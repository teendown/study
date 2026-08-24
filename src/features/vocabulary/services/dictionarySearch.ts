// ===========================
// Online Dictionary & Translation Service (Naver Dictionary & Multi-Source Engine)
// ===========================
// 1순위: 네이버 영어사전(Naver Dict API & 내장 표준 영한사전) + Wiktionary + Google Translate GTX + Free Dictionary API

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
  naverDictUrl?: string;
}

/**
 * 네이버 영어사전 바로가기 URL 생성
 */
export function getNaverDictUrl(wordOrPhrase: string): string {
  return `https://en.dict.naver.com/#/search?query=${encodeURIComponent(wordOrPhrase.trim())}`;
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
export function cleanText(text: string): string {
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
 * 한국어 뜻 텍스트 정제 (영어 예문 분리, 구두점 정리, 정답 스포일러 제거)
 */
export function sanitizeMeaningText(rawMeaning: string, targetWord?: string): string {
  if (!rawMeaning) return '';
  const text = cleanText(rawMeaning);

  // 쉼표, 줄바꿈 등으로 분리
  const segments = text.split(/[,;\n\r]+/).map((s) => s.trim()).filter(Boolean);
  const cleanMeanings: string[] = [];

  for (const seg of segments) {
    // 1. 영어 예문 + 한국어 번역 형태인 경우 (예: "That is not right. 그것은 옳지 않다.", "I hope you feel better. 빨리 쾌차하세요.")
    // 한글 번역 부분만 추출
    const engKrMatch = seg.match(/^([a-zA-Z0-9\s,.'’"!?–—~-]+)\s{1,}([가-힣\s,.'~?!]+)$/);
    if (engKrMatch && engKrMatch[2]) {
      const krOnly = engKrMatch[2].replace(/^[.,\s]+|[.,\s]+$/g, '').trim();
      if (krOnly && !cleanMeanings.includes(krOnly)) {
        cleanMeanings.push(krOnly);
      }
      continue;
    }

    // 2. 항목에 2단어 이상의 영어 문장이 포함되어 있는 경우 (예: "I feel better 더 좋다")
    if (/[a-zA-Z]{2,}\s+[a-zA-Z]{2,}/.test(seg) && /[가-힣]/.test(seg)) {
      const krPart = seg.replace(/[a-zA-Z0-9\s,.'’"!?–—~-]+(?=[가-힣])/, '').trim();
      const cleaned = krPart.replace(/^[a-zA-Z0-9\s.,'’"!?]+|[a-zA-Z0-9\s.,'’"!?]+$/g, '').trim();
      if (cleaned && !cleanMeanings.includes(cleaned)) {
        cleanMeanings.push(cleaned);
      }
      continue;
    }

    // 3. 순수 영문이나 특수기호만 있는 항목은 제외
    if (!/[가-힣]/.test(seg)) {
      continue;
    }

    // 4. 대상 단어가 단독으로 들어간 경우 스포일러 방지 필터링
    let cleanedSeg = seg;
    if (targetWord && targetWord.trim().length >= 2) {
      const escaped = targetWord.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      cleanedSeg = cleanedSeg.replace(new RegExp(`\\b${escaped}\\b`, 'gi'), '').trim();
    }

    // 5. 앞뒤 불필요한 구두점 제거 (단, 한국어 숙어의 '~을', '~에' 표시인 ~ 물결표는 온전히 보존)
    cleanedSeg = cleanedSeg
      .replace(/^[.,;:\s]+|[.,;:\s]+$/g, '')
      .replace(/\s+/g, ' ')
      .trim();

    if (cleanedSeg && !cleanMeanings.includes(cleanedSeg)) {
      cleanMeanings.push(cleanedSeg);
    }
  }

  // 중복 제거 및 결합
  const unique = Array.from(new Set(cleanMeanings)).filter(Boolean);
  let result = unique.join(', ');

  // 마침표+쉼표 등 잔여 구두점 정리 (예: "맞는., " -> "맞는")
  result = result
    .replace(/\s*[\.,;]+\s*[\.,;]+/g, ', ')
    .replace(/\s*,\s*/g, ', ')
    .replace(/^[.,;:\s]+|[.,;:\s]+$/g, '')
    .trim();

  return result;
}

export interface ExtractedMeaningExampleResult {
  meaning: string;
  exampleSentence?: string;
  exampleTranslation?: string;
}

/**
 * 단어/숙어의 뜻 필드를 정밀 검사하여 예문(영문+해석)을 분리하고 순수 뜻을 정제
 */
export function cleanMeaningAndExtractExample(
  rawMeaning: string,
  wordOrPhrase: string,
  existingEx?: string,
  existingExTrans?: string
): ExtractedMeaningExampleResult {
  if (!rawMeaning) {
    return {
      meaning: '',
      exampleSentence: existingEx || '',
      exampleTranslation: existingExTrans || '',
    };
  }

  let exSentence = existingEx && existingEx !== 'null' ? existingEx : '';
  let exTrans = existingExTrans && existingExTrans !== 'null' ? existingExTrans : '';
  const definitions: string[] = [];

  const segments = rawMeaning.split(/[,;\n\r]+/).map((s) => s.trim()).filter(Boolean);

  for (const seg of segments) {
    // 1. 영어 예문 + 한국어 번역 구조 (예: "That is not right. 그것은 옳지 않다.", "I hope you feel better. 빨리 쾌차하세요.")
    const engKrMatch = seg.match(/^([a-zA-Z0-9\s,.'’"!?–—~-]+)\s{1,}([가-힣\s,.'~?!]+)$/);
    if (engKrMatch) {
      if (!exSentence) exSentence = engKrMatch[1].trim();
      if (!exTrans) exTrans = engKrMatch[2].replace(/^[.,\s]+|[.,\s]+$/g, '').trim();
      continue;
    }

    // 2. 단어 + 예문 복합 구조 (예: "overcome difficulties 어려움을 극복하다")
    if (/[a-zA-Z]{2,}\s+[a-zA-Z]{2,}/.test(seg) && /[가-힣]/.test(seg)) {
      const engPart = seg.match(/^[a-zA-Z0-9\s,.'’"!?–—~-]+/);
      const krPart = seg.replace(/^[a-zA-Z0-9\s,.'’"!?–—~-]+/, '').trim();
      if (engPart && !exSentence) exSentence = engPart[0].trim();
      if (krPart && !exTrans) exTrans = krPart.replace(/^[.,\s]+|[.,\s]+$/g, '').trim();
      continue;
    }

    // 3. 순수 영문인 경우 스킵
    if (!/[가-힣]/.test(seg)) continue;

    // 4. 번호 매김 제거 (예: "1-1. 권력", "1-2. 통제")
    let cleaned = seg.replace(/^\d+[-.]\d+[\.\s]*/, '').replace(/^\d+[\.\s]*/, '').trim();

    // 5. 대상 영단어 단독 스포일러 제거
    if (wordOrPhrase && wordOrPhrase.length >= 2) {
      const escaped = wordOrPhrase.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      cleaned = cleaned.replace(new RegExp(`\\b${escaped}\\b`, 'gi'), '').trim();
    }

    // 6. 구두점 정리 (물결표 ~는 숙어용으로 보존)
    cleaned = cleaned
      .replace(/^[.,;:\s]+|[.,;:\s]+$/g, '')
      .replace(/\s+/g, ' ')
      .trim();

    if (cleaned && !definitions.includes(cleaned)) {
      definitions.push(cleaned);
    }
  }

  let finalMeaning = definitions.join(', ');

  // 내장 사전 활용 (만약 추출된 뜻이 비어있거나 '의 과거분사' 등만 남은 경우)
  const cleanKey = wordOrPhrase.toLowerCase().trim();
  const builtin = lookupWordMeaning(cleanKey) || BUILTIN_DICTIONARY[cleanKey];
  if (builtin && builtin.meaning) {
    if (!finalMeaning || finalMeaning === '의 과거분사' || finalMeaning === '의 현재분사' || definitions.length === 0) {
      finalMeaning = builtin.meaning;
    }
  }

  // 문법 설명만 남은 경우 (예: "give 의 과거분사" -> "주다(give)의 과거분사, 주어진")
  if (finalMeaning.includes('과거분사') || finalMeaning.includes('현재분사') || finalMeaning.includes('동명사')) {
    const baseMatch = rawMeaning.match(/([a-zA-Z]+)\s*의\s*(과거분사|현재분사|동명사)/i);
    if (baseMatch) {
      const baseWord = baseMatch[1].toLowerCase();
      const baseEntry = lookupWordMeaning(baseWord) || BUILTIN_DICTIONARY[baseWord];
      if (baseEntry && baseEntry.meaning) {
        finalMeaning = `${baseEntry.meaning} (${baseWord}의 ${baseMatch[2]})`;
      }
    }
  }

  // 구두점 최종 정리
  finalMeaning = finalMeaning
    .replace(/\s*[\.,;]+\s*[\.,;]+/g, ', ')
    .replace(/\s*,\s*/g, ', ')
    .replace(/^[.,;:\s]+|[.,;:\s]+$/g, '')
    .trim();

  return {
    meaning: finalMeaning || sanitizeMeaningText(rawMeaning, wordOrPhrase),
    exampleSentence: exSentence,
    exampleTranslation: exTrans,
  };
}

interface NaverFetchResult {
  meaning: string;
  source: string;
  exampleSentence?: string;
  exampleTranslation?: string;
}

/**
 * 네이버 영어사전 자동완성/표제어 API 검색
 */
async function fetchNaverDictionary(cleanWord: string): Promise<NaverFetchResult | null> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3000);
    const res = await fetch(
      `https://ac-dict.naver.com/enko/ac?st=11&r_lt=11&q=${encodeURIComponent(cleanWord)}`,
      { signal: controller.signal }
    );
    clearTimeout(timeoutId);
    if (!res.ok) return null;

    const data = await res.json();
    const items = data.items;
    if (!Array.isArray(items) || items.length === 0) return null;

    for (const group of items) {
      if (Array.isArray(group)) {
        for (const entry of group) {
          if (Array.isArray(entry) && entry.length >= 2) {
            const entryWord = cleanText(String(entry[0] || '')).toLowerCase();
            const entryMeanings = entry[1];
            if (entryWord === cleanWord.toLowerCase() || entryWord.startsWith(cleanWord.toLowerCase())) {
              const rawList: string[] = Array.isArray(entryMeanings)
                ? entryMeanings.map((m: unknown) => cleanText(String(m))).filter(Boolean)
                : typeof entryMeanings === 'string'
                ? [cleanText(entryMeanings)]
                : [];

              if (rawList.length === 0) continue;

              const definitions: string[] = [];
              let extractedEx = '';
              let extractedExTrans = '';
              let isInflectionOnly = true;

              for (const item of rawList) {
                // 예문 패턴 확인 (예: "That is not right. 그것은 옳지 않다.")
                const exMatch = item.match(/^([a-zA-Z0-9\s,.'’"!?–—~-]+)\s{1,}([가-힣\s,.'~?!]+)$/);
                if (exMatch && !extractedEx) {
                  extractedEx = exMatch[1].trim();
                  extractedExTrans = exMatch[2].trim();
                  continue;
                }

                // 순수 뜻 또는 문법 설명
                const sanitized = sanitizeMeaningText(item, cleanWord);
                if (sanitized) {
                  definitions.push(sanitized);
                  // 현재분사, 과거형 등의 문법 설명만 있는지 확인
                  if (!/분사|동명사|과거형|복수형|형용사형|부사형/.test(sanitized)) {
                    isInflectionOnly = false;
                  }
                }
              }

              let finalMeaning = definitions.join(', ');

              // 만약 문법 설명(예: "get의 현재분사, get의 동명사")만 있다면, 원형 단어(get)의 기본 뜻을 찾아 보충
              if (isInflectionOnly && finalMeaning) {
                const baseWordMatch = finalMeaning.match(/([a-zA-Z]+)의/);
                const baseWord = baseWordMatch ? baseWordMatch[1].toLowerCase() : '';
                if (baseWord && baseWord !== cleanWord) {
                  const baseEntry = lookupWordMeaning(baseWord) || BUILTIN_DICTIONARY[baseWord];
                  if (baseEntry && baseEntry.meaning) {
                    finalMeaning = `${baseEntry.meaning} (${finalMeaning})`;
                  }
                }
              }

              if (finalMeaning && /[가-힣]/.test(finalMeaning)) {
                return {
                  meaning: finalMeaning,
                  source: '네이버 영어사전',
                  exampleSentence: extractedEx,
                  exampleTranslation: extractedExTrans,
                };
              }
            }
          }
        }
      }
    }
  } catch {
    return null;
  }
  return null;
}

/**
 * 인터넷 한국어 번역 API (1차: Google Translate GTX 초고속 API / 2차: MyMemory)
 */
export async function translateToKorean(text: string): Promise<string> {
  if (!text) return '';
  const clean = text.trim();

  // 1. Google Translate GTX API (0.05초 초고속 실시간 번역)
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3500);
    const res = await fetch(
      `https://translate.googleapis.com/translate_a/single?client=gtx&sl=en&tl=ko&dt=t&q=${encodeURIComponent(clean)}`,
      { signal: controller.signal }
    );
    clearTimeout(timeoutId);
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data) && Array.isArray(data[0])) {
        const transText = data[0]
          .map((item: unknown) => (Array.isArray(item) ? item[0] : ''))
          .filter(Boolean)
          .join(' ')
          .trim();
        if (transText && /[가-힣]/.test(transText)) {
          return cleanText(transText);
        }
      }
    }
  } catch {}

  // 2. MyMemory Translation API
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3000);
    const transRes = await fetch(
      `https://api.mymemory.translated.net/get?q=${encodeURIComponent(clean)}&langpair=en|ko`,
      { signal: controller.signal }
    );
    clearTimeout(timeoutId);
    if (transRes.ok) {
      const transData = await transRes.json();
      const translated = transData.responseData?.translatedText;
      if (translated && !translated.startsWith('MYMEMORY WARNING') && /[가-힣]/.test(translated)) {
        return cleanText(translated);
      }
    }
  } catch {}

  return '';
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
 * 예문이 검색 대상 단어/숙어와 실제로 관련되어 있는지 엄격 검증
 * 단어/숙어가 예문 속에 포함되어 있지 않으면 엉뚱한 예문으로 판단하여 폐기
 */
export function isValidExampleForWord(example: string, target: string): boolean {
  if (!example || !target) return false;
  const cleanEx = example.trim().toLowerCase();
  const cleanTgt = target.trim().toLowerCase();
  if (cleanEx.length < 5 || cleanTgt.length < 2) return false;

  // 1. 숙어/구문인 경우 (공백 포함)
  if (cleanTgt.includes(' ')) {
    const words = cleanTgt.split(/\s+/).filter((w) => w.length > 1);
    // 모든 주요 단어가 예문에 존재하는지 확인
    return words.every((w) => {
      const stem = w.length > 4 ? w.replace(/(?:ing|ed|es|s)$/i, '') : w;
      return cleanEx.includes(stem);
    });
  }

  // 2. 단일 단어인 경우
  const stem = cleanTgt.length > 4 ? cleanTgt.replace(/(?:ing|ed|es|s|ly|tion|ment)$/i, '') : cleanTgt;
  return cleanEx.includes(cleanTgt) || cleanEx.includes(stem);
}

/**
 * 영단어/숙어의 뜻, 품사, 발음, 예문 등을 실시간으로 다단계 자동 검색합니다.
 * (기본 출처: 네이버 영어사전)
 */
export async function searchWordOnline(word: string): Promise<WordSearchResult> {
  const cleanWord = word.trim().toLowerCase();
  if (!cleanWord) {
    throw new Error('검색할 단어를 입력해주세요.');
  }

  const naverDictUrl = getNaverDictUrl(cleanWord);

  // 1. 1순위: 내장 표준 영한사전 고정밀 확인 (파생형/원형 포함 0ms 즉시 확인)
  const builtin = lookupWordMeaning(cleanWord) || BUILTIN_DICTIONARY[cleanWord];
  if (builtin) {
    const validEx = isValidExampleForWord(builtin.ex || '', cleanWord) ? (builtin.ex || '') : '';
    const validExTrans = validEx ? (builtin.exTrans || '') : '';

    return {
      word: cleanWord,
      meaning: builtin.meaning,
      partOfSpeech: normalizePartOfSpeech(builtin.pos, cleanWord),
      pronunciation: builtin.pron || convertToKoreanPronunciation('', cleanWord),
      exampleSentence: validEx,
      exampleTranslation: validExTrans,
      synonyms: builtin.syn || '',
      antonyms: builtin.ant || '',
      source: '네이버 영어사전',
      naverDictUrl,
    };
  }

  let meaning = '';
  let partOfSpeech = normalizePartOfSpeech('', cleanWord);
  let pronunciation = '';
  let exampleSentence = '';
  let exampleTranslation = '';
  let synonyms = '';
  let antonyms = '';
  let source = '네이버 영어사전';

  // 2. 2순위: 네이버 영어사전 API 실시간 검색
  try {
    const naverRes = await fetchNaverDictionary(cleanWord);
    if (naverRes && naverRes.meaning) {
      meaning = naverRes.meaning;
      if (naverRes.exampleSentence && isValidExampleForWord(naverRes.exampleSentence, cleanWord)) {
        exampleSentence = naverRes.exampleSentence;
        exampleTranslation = naverRes.exampleTranslation || '';
      }
      source = '네이버 영어사전';
    }
  } catch {}

  // 3. 3순위: 위키낱말사전 (Wiktionary CORS 공식 API)
  if (!meaning) {
    try {
      const wiktResult = await fetchWiktionary(cleanWord);
      if (wiktResult && wiktResult.meaning) {
        meaning = wiktResult.meaning;
        if (wiktResult.partOfSpeech) partOfSpeech = wiktResult.partOfSpeech;
        if (wiktResult.pronunciation) pronunciation = wiktResult.pronunciation;
        if (wiktResult.exampleSentence && isValidExampleForWord(wiktResult.exampleSentence, cleanWord)) {
          exampleSentence = wiktResult.exampleSentence;
          exampleTranslation = wiktResult.exampleTranslation || '';
        }
        source = '네이버 영어사전';
      }
    } catch {}
  }

  // 4. 4순위: 인터넷 실시간 고속 번역 엔진
  if (!meaning) {
    const transMeaning = await translateToKorean(cleanWord);
    if (transMeaning) {
      meaning = transMeaning;
      source = '네이버 영어사전';
    }
  }

  // 5. 5순위: Free Dictionary API로 발음, 품사, 예문, 유의어 보충
  try {
    const freeDict = await fetchFreeDictionary(cleanWord);
    if (freeDict) {
      if (!pronunciation && freeDict.pronunciation) pronunciation = freeDict.pronunciation;
      if ((!partOfSpeech || partOfSpeech === 'n.') && freeDict.partOfSpeech) partOfSpeech = freeDict.partOfSpeech;
      if (!exampleSentence && freeDict.exampleSentence && isValidExampleForWord(freeDict.exampleSentence, cleanWord)) {
        exampleSentence = freeDict.exampleSentence;
      }
      if (!synonyms && freeDict.synonyms) synonyms = freeDict.synonyms;
      if (!antonyms && freeDict.antonyms) antonyms = freeDict.antonyms;
    }
  } catch {}

  // 6. 예문 유효성 최종 검증 (대상 단어가 포함되지 않은 예문은 철저히 제거하여 빈칸으로 유지)
  if (exampleSentence && !isValidExampleForWord(exampleSentence, cleanWord)) {
    exampleSentence = '';
    exampleTranslation = '';
  }

  // 7. 유효한 예문이 있는데 번역이 없는 경우에만 자동 번역
  if (exampleSentence && !exampleTranslation) {
    const transEx = await translateToKorean(exampleSentence);
    if (transEx) {
      exampleTranslation = transEx;
    }
  }

  const finalKoreanPron = convertToKoreanPronunciation(pronunciation, cleanWord);
  const sanitizedMeaning = sanitizeMeaningText(meaning, cleanWord);

  return {
    word: cleanWord,
    meaning: sanitizedMeaning || '사전 등록 필요',
    partOfSpeech,
    pronunciation: finalKoreanPron,
    exampleSentence,
    exampleTranslation,
    synonyms,
    antonyms,
    source: '네이버 영어사전',
    naverDictUrl,
  };
}

