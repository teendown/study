// ===========================
// English OCR Tokenizer & Cleaner (Enhanced with Base Form Resolution)
// ===========================
// 설계서 섹션 28 기반 (OCR Pipeline)

import { BUILTIN_DICTIONARY, lookupWordMeaning } from './dictionary';
import { convertToKoreanPronunciation } from '@/features/vocabulary/services/koreanPronunciation';

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
  'back', 'after', 'use', 'two', 'how', 'our', 'first',
  'well', 'way', 'even', 'new', 'want', 'because', 'any', 'these',
  'give', 'day', 'most', 'us', 'is', 'are', 'was', 'were', 'been',
  'has', 'had', 'did', 'does',
]);

export interface ExtractedWordCandidate {
  id: string;
  word: string;
  meaning: string;
  partOfSpeech: string;
  pronunciation?: string;
  difficulty: number;
  selected: boolean;
  sourceText?: string;
}

/**
 * 단어의 원형(동사원형, 단수형, 형용사 원형) 후보군 생성
 */
export function getBaseFormCandidates(word: string): string[] {
  const forms = [word];
  if (word.endsWith('ing')) {
    forms.push(word.slice(0, -3));
    if (word.endsWith('ting') || word.endsWith('ning') || word.endsWith('ping') || word.endsWith('ding')) {
      forms.push(word.slice(0, -4));
    }
    forms.push(word.slice(0, -3) + 'e');
  }
  if (word.endsWith('ly')) {
    forms.push(word.slice(0, -2));
    if (word.endsWith('ily')) forms.push(word.slice(0, -3) + 'y');
  }
  if (word.endsWith('ed')) {
    forms.push(word.slice(0, -2));
    forms.push(word.slice(0, -1));
    if (word.endsWith('ied')) forms.push(word.slice(0, -3) + 'y');
    if (word.endsWith('ted') || word.endsWith('ned') || word.endsWith('ped') || word.endsWith('ded')) {
      forms.push(word.slice(0, -3));
    }
  }
  if (word.endsWith('ies')) forms.push(word.slice(0, -3) + 'y');
  if (word.endsWith('es')) forms.push(word.slice(0, -2));
  if (word.endsWith('s') && !word.endsWith('ss')) forms.push(word.slice(0, -1));
  return Array.from(new Set(forms));
}

/**
 * OCR 원시 텍스트에서 학습 가치가 있는 영어 단어 후보들을 추출합니다. (영한사전 뜻 자동 연동)
 */
export function extractEnglishWords(rawText: string): ExtractedWordCandidate[] {
  if (!rawText || typeof rawText !== 'string') return [];

  // 1. 알파벳이 아닌 문자 공백 치환
  const cleaned = rawText
    .replace(/[^a-zA-Z\s-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  // 2. 단어 토큰 분리
  const rawTokens = cleaned.split(' ');
  const wordMap = new Map<string, ExtractedWordCandidate>();

  rawTokens.forEach((token) => {
    const word = token.toLowerCase().replace(/^[-']+|[-']+$/g, '');

    // 단어 유효성 검사
    if (word.length < 3) return;
    if (STOPWORDS.has(word)) return;
    if (!/^[a-z]+$/.test(word)) return;
    if (wordMap.has(word)) return; // 중복 방지

    // 3. 내장 대용량 영한사전 매핑 (파생형/원형 탐색)
    const dictInfo = lookupWordMeaning(word);
    let meaning = '';
    let partOfSpeech = 'n.';
    let pronunciation = convertToKoreanPronunciation('', word);
    let difficulty = 2;

    if (dictInfo) {
      meaning = dictInfo.meaning;
      partOfSpeech = dictInfo.pos || (word.includes(' ') ? 'phr.' : 'n.');
      pronunciation = dictInfo.pron || convertToKoreanPronunciation('', word);
      difficulty = dictInfo.diff || 2;
    } else {
      // 2차 탐색: 원형 후보군 순회
      const baseCandidates = getBaseFormCandidates(word);
      for (const cand of baseCandidates) {
        const cInfo = BUILTIN_DICTIONARY[cand];
        if (cInfo) {
          meaning = cInfo.meaning;
          partOfSpeech = cInfo.pos || 'n.';
          pronunciation = cInfo.pron || convertToKoreanPronunciation('', word);
          difficulty = cInfo.diff || 2;
          break;
        }
      }
    }

    wordMap.set(word, {
      id: `ocr-${word}-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      word,
      meaning,
      partOfSpeech,
      pronunciation,
      difficulty,
      selected: true,
    });
  });

  return Array.from(wordMap.values());
}
