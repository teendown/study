// ===========================
// Online Dictionary & Translation Service
// ===========================
// 인터넷 무료 사전 API + 번역 API를 활용한 실시간 단어 정보 자동 검색

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
 * 영단어의 뜻, 품사, 발음, 예문 등을 인터넷에서 실시간으로 자동 검색합니다.
 */
export async function searchWordOnline(word: string): Promise<WordSearchResult> {
  const cleanWord = word.trim().toLowerCase();
  if (!cleanWord) {
    throw new Error('검색할 단어를 입력해주세요.');
  }

  // 1. 내장 사전 우선 확인
  const builtin = BUILTIN_DICTIONARY[cleanWord];
  let meaning = builtin?.meaning || '';
  let partOfSpeech = builtin?.pos || '';
  let pronunciation = '';
  let exampleSentence = '';
  let exampleTranslation = '';
  let synonyms = '';
  let antonyms = '';

  // 2. Free Dictionary API로 발음, 품사, 예문, 유의어 가져오기
  try {
    const dictRes = await fetch(
      `https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(cleanWord)}`,
      { next: { revalidate: 86400 } }
    );

    if (dictRes.ok) {
      const data = await dictRes.json();
      if (Array.isArray(data) && data.length > 0) {
        const entry = data[0];
        pronunciation = entry.phonetic || entry.phonetics?.find((p: { text?: string }) => p.text)?.text || '';

        if (entry.meanings && entry.meanings.length > 0) {
          const m = entry.meanings[0];
          if (!partOfSpeech) {
            const pos = m.partOfSpeech;
            if (pos === 'noun') partOfSpeech = 'n.';
            else if (pos === 'verb') partOfSpeech = 'v.';
            else if (pos === 'adjective') partOfSpeech = 'adj.';
            else if (pos === 'adverb') partOfSpeech = 'adv.';
            else partOfSpeech = pos;
          }

          // 예문 추출
          const defWithExample = m.definitions?.find(
            (d: { example?: string }) => d.example
          );
          if (defWithExample?.example) {
            exampleSentence = defWithExample.example;
          }

          // 유의어/반의어 추출
          if (m.synonyms && m.synonyms.length > 0) {
            synonyms = m.synonyms.slice(0, 3).join(', ');
          }
          if (m.antonyms && m.antonyms.length > 0) {
            antonyms = m.antonyms.slice(0, 2).join(', ');
          }
        }
      }
    }
  } catch (err) {
    console.warn('Free Dictionary API lookup failed:', err);
  }

  // 3. 한국어 뜻이 없는 경우 MyMemory 번역 API로 한글 뜻 및 예문 번역 자동 조회
  if (!meaning) {
    try {
      const transRes = await fetch(
        `https://api.mymemory.translated.net/get?q=${encodeURIComponent(cleanWord)}&langpair=en|ko`
      );
      if (transRes.ok) {
        const transData = await transRes.json();
        if (transData.responseData?.translatedText) {
          meaning = transData.responseData.translatedText.trim();
        }
      }
    } catch (err) {
      console.warn('MyMemory translation failed:', err);
    }
  }

  // 4. 예문이 있는데 예문 해석이 없는 경우 자동 번역
  if (exampleSentence && !exampleTranslation) {
    try {
      const exTransRes = await fetch(
        `https://api.mymemory.translated.net/get?q=${encodeURIComponent(exampleSentence)}&langpair=en|ko`
      );
      if (exTransRes.ok) {
        const exData = await exTransRes.json();
        if (exData.responseData?.translatedText) {
          exampleTranslation = exData.responseData.translatedText.trim();
        }
      }
    } catch (err) {
      console.warn('Example translation failed:', err);
    }
  }

  return {
    word: cleanWord,
    meaning: meaning || '의미 검색 필요',
    partOfSpeech: partOfSpeech || 'n.',
    pronunciation: pronunciation ? `[${pronunciation.replace(/\[|\]/g, '')}]` : '',
    exampleSentence,
    exampleTranslation,
    synonyms,
    antonyms,
    source: '온라인 사전 자동 검색',
  };
}
