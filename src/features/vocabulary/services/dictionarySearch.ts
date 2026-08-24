// ===========================
// Online Dictionary & Translation Service (Enhanced Multi-Source Engine)
// ===========================
// 네이버 영한사전, 위키낱말사전, Free Dictionary API, 번역 엔진 및 내장 사전을 결합한
// 고품질 자동 단어/숙어 정보 검색 파이프라인

import { BUILTIN_DICTIONARY } from '@/lib/ocr/dictionary';

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
 * 뜻 텍스트 정리: 참조 기호 (→...) 및 불필요한 공백 정리
 */
function cleanMeaning(meaning: string): string {
  if (!meaning) return '';
  return cleanText(meaning)
    .replace(/\s+/g, ' ')
    .replace(/;\s*;/g, ';')
    .trim();
}

/**
 * 1. 네이버 영한사전 API 검색 (단어, 뜻, 품사, 발음, 예문, 예문해석)
 */
async function fetchNaverDictionary(cleanWord: string) {
  const urls = [
    // 1순위: 직접 호출
    `https://en.dict.naver.com/api3/enko/search?query=${encodeURIComponent(cleanWord)}&range=word&page=1`,
    // 2순위: CORS 프록시 폴백
    `https://api.allorigins.win/raw?url=${encodeURIComponent(`https://en.dict.naver.com/api3/enko/search?query=${encodeURIComponent(cleanWord)}&range=word&page=1`)}`,
  ];

  let wordData: any = null;
  for (const url of urls) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3500);
      const res = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Referer': 'https://en.dict.naver.com/',
        },
        signal: controller.signal,
      });
      clearTimeout(timeoutId);
      if (res.ok) {
        wordData = await res.json();
        if (wordData?.searchResultMap?.searchResultListMap?.WORD?.items?.length) {
          break;
        }
      }
    } catch {
      // try next url
    }
  }

  if (!wordData) return null;

  const items = wordData?.searchResultMap?.searchResultListMap?.WORD?.items || [];
  if (items.length === 0) return null;

  const item = items[0];
  let meaning = '';
  let partOfSpeech = '';
  let synonyms = '';
  let antonyms = '';

  if (item.meansCollector && item.meansCollector.length > 0) {
    const meaningSections: string[] = [];
    for (const mc of item.meansCollector) {
      if (!partOfSpeech && mc.partOfSpeech) {
        partOfSpeech = mc.partOfSpeech;
      }
      const values: string[] = [];
      if (Array.isArray(mc.means)) {
        for (const m of mc.means) {
          if (m.value) {
            const rawVal = cleanText(m.value);
            // 유의어/반의어 추출
            const synMatch = rawVal.match(/\(=([^)]+)\)/);
            if (synMatch && !synonyms) {
              synonyms = synMatch[1].trim();
            }
            const antMatch = rawVal.match(/\(→([^)]+)\)/);
            if (antMatch && !antonyms && antMatch[1].length < 30) {
              antonyms = antMatch[1].trim();
            }
            values.push(rawVal);
          }
        }
      }
      if (values.length > 0) {
        meaningSections.push(values.join(', '));
      }
    }
    meaning = meaningSections.join('; ');
  }

  // 발음 기호
  let pronunciation = '';
  if (item.searchPhoneticSymbolList && item.searchPhoneticSymbolList.length > 0) {
    const symbol = item.searchPhoneticSymbolList.find((s: { symbolValue?: string }) => s.symbolValue);
    if (symbol?.symbolValue) {
      const cleanSymbol = cleanText(symbol.symbolValue);
      if (cleanSymbol) pronunciation = `[${cleanSymbol}]`;
    }
  }

  // 예문 검색 (별도 요청)
  let exampleSentence = '';
  let exampleTranslation = '';
  try {
    const exUrl = `https://en.dict.naver.com/api3/enko/search?query=${encodeURIComponent(cleanWord)}&range=example&page=1`;
    const exController = new AbortController();
    const exTimeout = setTimeout(() => exController.abort(), 3000);
    const exRes = await fetch(exUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Referer': 'https://en.dict.naver.com/',
      },
      signal: exController.signal,
    });
    clearTimeout(exTimeout);
    if (exRes.ok) {
      const exData = await exRes.json();
      const exItems = exData?.searchResultMap?.searchResultListMap?.EXAMPLE?.items || [];
      if (exItems.length > 0) {
        exampleSentence = cleanText(exItems[0].expExample1 || '');
        exampleTranslation = cleanText(exItems[0].expExample2 || '');
      }
    }
  } catch {}

  return {
    word: cleanText(item.expEntry) || cleanWord,
    meaning: cleanMeaning(meaning),
    partOfSpeech: normalizePartOfSpeech(partOfSpeech, cleanWord),
    pronunciation,
    exampleSentence,
    exampleTranslation,
    synonyms,
    antonyms,
  };
}

/**
 * 2. 위키낱말사전 (Wiktionary CORS 공식 API) 검색
 */
async function fetchWiktionary(cleanWord: string) {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3000);
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
    let pronunciation = '';
    let partOfSpeech = '';
    let exampleSentence = '';
    let exampleTranslation = '';

    const ipaMatch = extract.match(/IPA\s*(?:\(표기\))?:\s*\/([^\/]+)\/|IPA\s*\[([^\]]+)\]/);
    if (ipaMatch) {
      pronunciation = `[${ipaMatch[1] || ipaMatch[2]}]`;
    }

    if (extract.includes('동사') || extract.includes('타동사') || extract.includes('자동사')) {
      partOfSpeech = 'v.';
    } else if (extract.includes('형용사')) {
      partOfSpeech = 'adj.';
    } else if (extract.includes('명사')) {
      partOfSpeech = 'n.';
    } else if (extract.includes('부사')) {
      partOfSpeech = 'adv.';
    }

    const lines = extract.split('\n').map((l) => l.trim()).filter(Boolean);
    const meaningLines: string[] = [];

    for (const line of lines) {
      if (
        line.startsWith('=') ||
        line.startsWith('어원') ||
        line.startsWith('IPA') ||
        line.startsWith('참조') ||
        line.startsWith('파생어') ||
        line.startsWith('유의어') ||
        line.startsWith('동의어') ||
        line.startsWith('반의어')
      ) {
        continue;
      }
      if (/[가-힣]/.test(line)) {
        const engExMatch = line.match(/^([A-Z][a-zA-Z\s,.'’"-]+)\s+([가-힣\s,.'~]+)/);
        if (engExMatch && engExMatch[1].length > 10 && !exampleSentence) {
          exampleSentence = engExMatch[1].trim();
          exampleTranslation = engExMatch[2].trim();
        } else if (!meaningLines.length || (!line.includes('.') && meaningLines.length < 3)) {
          meaningLines.push(line);
        }
      }
    }

    if (meaningLines.length === 0) return null;

    return {
      meaning: meaningLines.slice(0, 3).join(', '),
      partOfSpeech: normalizePartOfSpeech(partOfSpeech, cleanWord),
      pronunciation,
      exampleSentence,
      exampleTranslation,
    };
  } catch {
    return null;
  }
}

/**
 * 3. Free Dictionary API (발음, 영어 예문, 품사, 유의어 보충)
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
    const pronunciation = entry.phonetic || entry.phonetics?.find((p: { text?: string }) => p.text)?.text || '';
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
      pronunciation: pronunciation ? `[${pronunciation.replace(/\[|\]/g, '')}]` : '',
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
 * 4. 한국어 번역 API (MyMemory 및 보조 번역 엔진)
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

  // 1. 내장 사전 우선 조회
  const builtin = BUILTIN_DICTIONARY[cleanWord];

  let meaning = builtin?.meaning || '';
  let partOfSpeech = builtin?.pos ? normalizePartOfSpeech(builtin.pos, cleanWord) : '';
  let pronunciation = '';
  let exampleSentence = '';
  let exampleTranslation = '';
  let synonyms = '';
  let antonyms = '';
  let source = '온라인 사전 자동 검색';

  // 2. 1순위: 네이버 영한사전 검색
  try {
    const naverResult = await fetchNaverDictionary(cleanWord);
    if (naverResult) {
      if (naverResult.meaning) meaning = naverResult.meaning;
      if (naverResult.partOfSpeech) partOfSpeech = naverResult.partOfSpeech;
      if (naverResult.pronunciation) pronunciation = naverResult.pronunciation;
      if (naverResult.exampleSentence) exampleSentence = naverResult.exampleSentence;
      if (naverResult.exampleTranslation) exampleTranslation = naverResult.exampleTranslation;
      if (naverResult.synonyms) synonyms = naverResult.synonyms;
      if (naverResult.antonyms) antonyms = naverResult.antonyms;
      source = '네이버 영한사전';
    }
  } catch (err) {
    console.warn('Naver dictionary search failed:', err);
  }

  // 3. 2순위: 뜻이 비어있으면 위키낱말사전 검색
  if (!meaning) {
    try {
      const wiktResult = await fetchWiktionary(cleanWord);
      if (wiktResult) {
        if (wiktResult.meaning) meaning = wiktResult.meaning;
        if (!partOfSpeech && wiktResult.partOfSpeech) partOfSpeech = wiktResult.partOfSpeech;
        if (!pronunciation && wiktResult.pronunciation) pronunciation = wiktResult.pronunciation;
        if (!exampleSentence && wiktResult.exampleSentence) exampleSentence = wiktResult.exampleSentence;
        if (!exampleTranslation && wiktResult.exampleTranslation) exampleTranslation = wiktResult.exampleTranslation;
        source = '위키낱말사전';
      }
    } catch (err) {
      console.warn('Wiktionary search failed:', err);
    }
  }

  // 4. 3순위: Free Dictionary API로 발음, 품사, 예문, 유의어 보충
  try {
    const freeDict = await fetchFreeDictionary(cleanWord);
    if (freeDict) {
      if (!pronunciation && freeDict.pronunciation) pronunciation = freeDict.pronunciation;
      if (!partOfSpeech && freeDict.partOfSpeech) partOfSpeech = freeDict.partOfSpeech;
      if (!exampleSentence && freeDict.exampleSentence) exampleSentence = freeDict.exampleSentence;
      if (!synonyms && freeDict.synonyms) synonyms = freeDict.synonyms;
      if (!antonyms && freeDict.antonyms) antonyms = freeDict.antonyms;
    }
  } catch (err) {
    console.warn('Free Dictionary search failed:', err);
  }

  // 5. 4순위: 여전히 한국어 뜻이 없는 경우 번역 API 호출
  if (!meaning) {
    const transMeaning = await translateToKorean(cleanWord);
    if (transMeaning) {
      meaning = transMeaning;
      source = '온라인 번역';
    }
  }

  // 6. 예문이 있는데 예문 해석이 없는 경우 자동 번역
  if (exampleSentence && !exampleTranslation) {
    const transEx = await translateToKorean(exampleSentence);
    if (transEx) {
      exampleTranslation = transEx;
    }
  }

  // 7. 최종 품사 기본값 처리
  if (!partOfSpeech) {
    partOfSpeech = normalizePartOfSpeech('', cleanWord);
  }

  return {
    word: cleanWord,
    meaning: meaning || '의미 검색 필요',
    partOfSpeech,
    pronunciation,
    exampleSentence,
    exampleTranslation,
    synonyms,
    antonyms,
    source: meaning ? source : '직접 등록 필요',
  };
}
