// ===========================
// English OCR Tokenizer & Cleaner
// ===========================
// 설계서 섹션 28 기반 (OCR Pipeline)

import { BUILTIN_DICTIONARY } from './dictionary';

/** 너무 기초적인 불용어(Stopwords) */
const STOPWORDS = new Set([
  'the', 'be', 'to', 'of', 'and', 'a', 'in', 'that', 'have', 'i',
  'it', 'for', 'not', 'on', 'with', 'he', 'as', 'you', 'do', 'at',
  'this', 'but', 'his', 'by', 'from', 'they', 'we', 'say', 'her',
  'she', 'or', 'an', 'will', 'my', 'one', 'all', 'would', 'there',
  'their', 'what', 'so', 'up', 'out', 'if', 'about', 'who', 'get',
  'which', 'go', 'me', 'when', 'make', 'can', 'like', 'time', 'no',
  'just', 'him', 'know', 'take', 'people', 'into', 'year', 'your',
  'good', 'some', 'could', 'them', 'see', 'other', 'than', 'then',
  'now', 'look', 'only', 'come', 'its', 'over', 'think', 'also',
  'back', 'after', 'use', 'two', 'how', 'our', 'work', 'first',
  'well', 'way', 'even', 'new', 'want', 'because', 'any', 'these',
  'give', 'day', 'most', 'us', 'is', 'are', 'was', 'were', 'been',
  'has', 'had', 'did', 'does',
]);

export interface ExtractedWordCandidate {
  id: string;
  word: string;
  meaning: string;
  partOfSpeech: string;
  difficulty: number;
  selected: boolean; // 사용자가 체크박스로 선택했는지 여부
  sourceText?: string;
}

/**
 * OCR 원시 텍스트에서 학습 가치가 있는 영어 단어 후보들을 추출합니다.
 */
export function extractEnglishWords(rawText: string): ExtractedWordCandidate[] {
  if (!rawText || typeof rawText !== 'string') return [];

  // 1. 알파벳이 아닌 문자 공백 치환 (하이픈과 어포스트로피 일부 보존)
  const cleaned = rawText
    .replace(/[^a-zA-Z\s-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  // 2. 단어 토큰 분리
  const rawTokens = cleaned.split(' ');
  const wordMap = new Map<string, ExtractedWordCandidate>();

  rawTokens.forEach((token) => {
    const word = token.toLowerCase().replace(/^[-']+|[-']+$/g, '');

    // 단어 유효성 검사: 길이 3글자 이상, 불용어 제외, 순수 알파벳
    if (word.length < 3) return;
    if (STOPWORDS.has(word)) return;
    if (!/^[a-z]+$/.test(word)) return;
    if (wordMap.has(word)) return; // 중복 방지

    // 3. 내장 사전 매핑
    const dictInfo = BUILTIN_DICTIONARY[word];
    const meaning = dictInfo ? dictInfo.meaning : '';
    const partOfSpeech = dictInfo?.pos || '';
    const difficulty = dictInfo?.diff || 2;

    wordMap.set(word, {
      id: `ocr-${word}-${Date.now()}`,
      word,
      meaning,
      partOfSpeech,
      difficulty,
      selected: true, // 기본적으로 선택됨
    });
  });

  return Array.from(wordMap.values());
}
