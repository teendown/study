// ===========================
// Online Dictionary & Translation Service (Enhanced Multi-Source Engine)
// ===========================
// 내장 사전(1순위 즉시 매칭) + 위키낱말사전(Wiktionary CORS 공식 API) + Free Dictionary API + 온라인 번역

import { BUILTIN_DICTIONARY, lookupWordMeaning } from '@/lib/ocr/dictionary';
import { convertToKoreanPronunciation } from './koreanPronunciation';

export interface WordSearchResult {
  word: string;
  meaning: string;
  partOfSpeech: string;
  pronunciation: string;
  exampleSentence: string;
  exampleTranslation: string;
  synonyms: string;
  antonyms: string;
  source: string;
}

/**
 * 품사 문자열을 UI 및 시스템 표준 포맷 ('n.', 'v.', 'adj.', 'adv.', 'prep.', 'conj.', 'phr.')으로 정규화
 */
export function normalizePartOfSpeech(pos: string | undefined, word: string): string {
  if (!pos) {
    if (word.trim().includes(' ')) return 'phr.';
    return 'n.';
  }
  const p = pos.toLowerCase().trim();
  if (p.includes('동사') || p === 'verb' || p === 'v.' || p === 'v') return 'v.';
  if (p.includes('명사') || p === 'noun' || p === 'n.' || p === 'n') return 'n.';
  if (p.includes('형용사') || p === 'adjective' || p === 'adj.' || p === 'adj') return 'adj.';
  if (p.includes('부사') || p === 'adverb' || p === 'adv.' || p === 'adv') return 'adv.';
  if (p.includes('전치사') || p === 'preposition' || p === 'prep.' || p === 'prep') return 'prep.';
  if (p.includes('접속사') || p === 'conjunction' || p === 'conj.' || p === 'conj') return 'conj.';
  if (p.includes('숙어') || p.includes('구') || p === 'idiom' || p === 'phrase' || p === 'phr.' || p === 'phr') return 'phr.';

  if (word.trim().includes(' ')) return 'phr.';
  return 'n.';
}

/**
 * HTML 태그 및 특수문자 제거
 */
function cleanText(text: string): string {
  if (!text) return '';
  return text
    .replace(/<[^>]+>/g, '')
    .replace(/&quot;/g, '"')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&nbsp;/g, ' ')
    .replace(/&apos;/g, "'")
    .replace(/<sub>.*?<\/sub>/gi, '')
    .replace(/<sup>.*?<\/sup>/gi, '')
    .replace(/[│|]/g, '')
    .trim();
}

/**
 * 위키낱말사전 (Wiktionary CORS 공식 API) 검색
 */
async function fetchWiktionary(cleanWord: string) {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3500);
    const res = await fetch(
      `https://ko.wiktionary.org/w/api.php?action=query&prop=extracts&explaintext=1&titles=${encodeURIComponent(cleanWord)}&format=json&origin=*`,
      { signal: controller.signal }
    );
    clearTimeout(timeoutId);
    if (!res.ok) return null;

    const data = await res.json();
    const pages = data.query?.pages || {};
    const firstPage = Object.values(pages)[0] as { extract?: string; pageid?: number } | undefined;
    if (!firstPage?.extract || firstPage.pageid === undefined) return null;

    const extract = firstPage.extract;
    const lines = extract.split('\n').map((l) => l.trim()).filter(Boolean);
    let currentPos = '';
    const meanings: string[] = [];
    let exampleSentence = '';
    let exampleTranslation = '';
    let pronunciation = '';

    const ipaMatch = extract.match(/IPA\s*(?:\(표기\))?:\s*\/([^\/]+)\/|IPA\s*\[([^\]]+)\]/);
    if (ipaMatch) {
      const rawIpa = (ipaMatch[1] || ipaMatch[2]).replace(/^[\[\/]+|[\]\/]+$/g, '').trim();
      if (rawIpa) {
        pronunciation = `[${rawIpa}]`;
      }
    }

    let inEng = false;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      if (line.includes('== 영어 ==')) {
        inEng = true;
        continue;
      }
      if (inEng && line.startsWith('== ') && !line.includes('영어')) {
        break;
      }
      if (!inEng) continue;

      if (line.includes('=== 명사 ===') || line.includes('==== 명사 ====')) currentPos = currentPos || 'n.';
      else if (line.includes('=== 동사 ===') || line.includes('==== 타동사 ====') || line.includes('==== 자동사 ====')) currentPos = currentPos || 'v.';
      else if (line.includes('=== 형용사 ===') || line.includes('==== 형용사 ====')) currentPos = currentPos || 'adj.';
      else if (line.includes('=== 부사 ===') || line.includes('==== 부사 ====')) currentPos = currentPos || 'adv.';
      else if (line.includes('=== 전치사 ===')) currentPos = currentPos || 'prep.';
      else if (line.includes('=== 접속사 ===')) currentPos = currentPos || 'conj.';
      else if (line.includes('=== 숙어 ===') || line.includes('=== 관용구 ===')) currentPos = currentPos || 'phr.';

      if (
        line.startsWith('=') ||
        line.startsWith('어원') ||
        line.startsWith('IPA') ||
        line.startsWith('참조') ||
        line.startsWith('관용구') ||
        line.startsWith('유의어') ||
        line.startsWith('동의어') ||
        line.startsWith('반의어') ||
        line.startsWith('파생어')
      ) {
        continue;
      }

      if (/[가-힣]/.test(line)) {
        const match = line.match(/^([A-Z][a-zA-Z0-9\s,.'’"-]+)\s{2,}([가-힣\s,.'~?!]+)/);
        if (match && !exampleSentence) {
          exampleSentence = match[1].trim();
          exampleTranslation = match[2].trim();
        } else if (!line.includes(':') && !line.includes('따옴◄') && line.length < 40) {
          const cleaned = line
            .replace(/^\d+\.\s*/, '')
            .replace(/\([^)]+\)/g, '')
            .replace(/\s+/g, ' ')
            .trim();
          if (
            cleaned &&
            cleaned.length >= 1 &&
            !cleaned.includes('IPA') &&
            !meanings.includes(cleaned) &&
            !cleaned.includes('참는다') &&
            !cleaned.includes('속담')
          ) {
            meanings.push(cleaned);
          }
        }
      }
    }

    if (meanings.length === 0) return null;

    return {
      meaning: meanings.slice(0, 2).join(', '),
      partOfSpeech: normalizePartOfSpeech(currentPos, cleanWord),
      pronunciation,
      exampleSentence,
      exampleTranslation,
    };
  } catch {
    return null;
  }
}

/**
 * Free Dictionary API (발음, 영어 예문, 품사, 유의어 보충)
 */
async function fetchFreeDictionary(cleanWord: string) {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3000);
    const dictRes = await fetch(
      `https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(cleanWord)}`,
      { signal: controller.signal }
    );
    clearTimeout(timeoutId);

    if (!dictRes.ok) return null;
    const data = await dictRes.json();
    if (!Array.isArray(data) || data.length === 0) return null;

    const entry = data[0];
    const rawPhonetic = entry.phonetic || entry.phonetics?.find((p: { text?: string }) => p.text)?.text || '';
    const cleanPhonetic = rawPhonetic ? rawPhonetic.replace(/^[\[\/]+|[\]\/]+$/g, '').trim() : '';
    const pronunciation = cleanPhonetic ? `[${cleanPhonetic}]` : '';

    let partOfSpeech = '';
    let exampleSentence = '';
    let synonyms = '';
    let antonyms = '';

    if (entry.meanings && entry.meanings.length > 0) {
      const m = entry.meanings[0];
      partOfSpeech = m.partOfSpeech || '';

      const defWithExample = m.definitions?.find((d: { example?: string }) => d.example);
      if (defWithExample?.example) {
        exampleSentence = defWithExample.example;
      }

      if (m.synonyms && m.synonyms.length > 0) {
        synonyms = m.synonyms.slice(0, 3).join(', ');
      }
      if (m.antonyms && m.antonyms.length > 0) {
        antonyms = m.antonyms.slice(0, 2).join(', ');
      }
    }

    return {
      pronunciation,
      partOfSpeech: normalizePartOfSpeech(partOfSpeech, cleanWord),
      exampleSentence,
      synonyms,
      antonyms,
    };
  } catch {
    return null;
  }
}

/**
 * 한국어 번역 API (MyMemory 번역기)
 */
async function translateToKorean(text: string): Promise<string> {
  if (!text) return '';
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3000);
    const transRes = await fetch(
      `https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=en|ko`,
      { signal: controller.signal }
    );
    clearTimeout(timeoutId);
    if (transRes.ok) {
      const transData = await transRes.json();
      const translated = transData.responseData?.translatedText;
      if (translated && !translated.startsWith('MYMEMORY WARNING')) {
        return cleanText(translated);
      }
    }
  } catch {}
  return '';
}

/**
 * 영단어/숙어의 뜻, 품사, 발음, 예문 등을 실시간으로 다단계 자동 검색합니다.
 */
export async function searchWordOnline(word: string): Promise<WordSearchResult> {
  const cleanWord = word.trim().toLowerCase();
  if (!cleanWord) {
    throw new Error('검색할 단어를 입력해주세요.');
  }

  // 1. 1순위: 내장 영한사전 고정밀 확인 (파생형/원형 포함 0ms 즉시 확인)
  const builtin = lookupWordMeaning(cleanWord) || BUILTIN_DICTIONARY[cleanWord];
  if (builtin) {
    return {
      word: cleanWord,
      meaning: builtin.meaning,
      partOfSpeech: normalizePartOfSpeech(builtin.pos, cleanWord),
      pronunciation: builtin.pron || convertToKoreanPronunciation('', cleanWord),
      exampleSentence: builtin.ex || '',
      exampleTranslation: builtin.exTrans || '',
      synonyms: builtin.syn || '',
      antonyms: builtin.ant || '',
      source: '표준 필수 영한사전',
    };
  }

  let meaning = '';
  let partOfSpeech = normalizePartOfSpeech('', cleanWord);
  let pronunciation = '';
  let exampleSentence = '';
  let exampleTranslation = '';
  let synonyms = '';
  let antonyms = '';
  let source = '온라인 사전';

  // 2. 2순위: 위키낱말사전 (Wiktionary CORS 공식 API)
  try {
    const wiktResult = await fetchWiktionary(cleanWord);
    if (wiktResult && wiktResult.meaning) {
      meaning = wiktResult.meaning;
      if (wiktResult.partOfSpeech) partOfSpeech = wiktResult.partOfSpeech;
      if (wiktResult.pronunciation) pronunciation = wiktResult.pronunciation;
      if (wiktResult.exampleSentence) exampleSentence = wiktResult.exampleSentence;
      if (wiktResult.exampleTranslation) exampleTranslation = wiktResult.exampleTranslation;
      source = '위키낱말사전';
    }
  } catch (err) {
    console.warn('Wiktionary search failed:', err);
  }

  // 3. 3순위: Free Dictionary API로 발음, 품사, 예문, 유의어 보충
  try {
    const freeDict = await fetchFreeDictionary(cleanWord);
    if (freeDict) {
      if (!pronunciation && freeDict.pronunciation) pronunciation = freeDict.pronunciation;
      if ((!partOfSpeech || partOfSpeech === 'n.') && freeDict.partOfSpeech) partOfSpeech = freeDict.partOfSpeech;
      if (!exampleSentence && freeDict.exampleSentence) exampleSentence = freeDict.exampleSentence;
      if (!synonyms && freeDict.synonyms) synonyms = freeDict.synonyms;
      if (!antonyms && freeDict.antonyms) antonyms = freeDict.antonyms;
    }
  } catch (err) {
    console.warn('Free Dictionary search failed:', err);
  }

  // 4. 4순위: 여전히 한국어 뜻이 없는 경우 번역 API 호출
  if (!meaning) {
    const transMeaning = await translateToKorean(cleanWord);
    if (transMeaning) {
      meaning = transMeaning;
      source = '온라인 번역';
    }
  }

  // 5. 예문이 있는데 예문 해석이 없는 경우 자동 번역
  if (exampleSentence && !exampleTranslation) {
    const transEx = await translateToKorean(exampleSentence);
    if (transEx) {
      exampleTranslation = transEx;
    }
  }

  const finalKoreanPron = convertToKoreanPronunciation(pronunciation, cleanWord);

  return {
    word: cleanWord,
    meaning: meaning || '의미 검색 필요',
    partOfSpeech,
    pronunciation: finalKoreanPron,
    exampleSentence,
    exampleTranslation,
    synonyms,
    antonyms,
    source: meaning ? source : '직접 등록 필요',
  };
}
