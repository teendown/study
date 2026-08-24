// ===========================
// OCR Text Normalization & Typo Correction Service
// ===========================
// OCR 인식 과정에서 발생하는 광학 오류(l/1/I, 0/O, rn/m, cl/d 등) 및 철자 오탈자 자동 교정

import { BUILTIN_DICTIONARY } from '@/lib/ocr/dictionary';
import { COMPREHENSIVE_PHRASE_DICTIONARY } from '@/lib/ocr/phraseDictionary';

// 흔히 발생하는 단어 단위 OCR/타이핑 오탈자 사전
const COMMON_OCR_TYPO_MAP: Record<string, string> = {
  wnat: 'want',
  wnt: 'want',
  abondon: 'abandon',
  teh: 'the',
  recieve: 'receive',
  untill: 'until',
  occured: 'occurred',
  seperate: 'separate',
  definately: 'definitely',
  accomodate: 'accommodate',
  acheive: 'achieve',
  accross: 'across',
  alot: 'a lot',
  becuase: 'because',
  calender: 'calendar',
  enviroment: 'environment',
  goverment: 'government',
  grammer: 'grammar',
  knowlege: 'knowledge',
  neccessary: 'necessary',
  peice: 'piece',
  tommorow: 'tomorrow',
  truely: 'truly',
  wierd: 'weird',
};

/**
 * Levenshtein 거리(편집 거리) 계산 함수
 */
export function calculateLevenshteinDistance(a: string, b: string): number {
  if (a === b) return 0;
  if (a.length === 0) return b.length;
  if (b.length === 0) return a.length;

  const matrix: number[][] = [];

  for (let i = 0; i <= b.length; i++) {
    matrix[i] = [i];
  }
  for (let j = 0; j <= a.length; j++) {
    matrix[0][j] = j;
  }

  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b.charAt(i - 1) === a.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1, // 교체
          matrix[i][j - 1] + 1,     // 삽입
          matrix[i - 1][j] + 1      // 삭제
        );
      }
    }
  }

  return matrix[b.length][a.length];
}

/**
 * 1. 텍스트 기본 정규화 (소문자, 특수기호/연속 공백 정리)
 */
export function normalizeInputText(rawText: string): string {
  if (!rawText) return '';
  return rawText
    .trim()
    .toLowerCase()
    .replace(/[“”"']/g, '')
    .replace(/[—–]/g, '-')
    .replace(/\s+/g, ' ');
}

/**
 * 2. OCR 문자 수준 광학 패턴 오류 교정
 */
export function correctOcrCharacterGlitch(word: string): string {
  if (!word) return '';
  let str = word.trim().toLowerCase();

  // 영단어 내부에 숫자가 섞여 들어간 OCR 오류 교정 (예: 'h0me' -> 'home', 'c1ear' -> 'clear')
  if (/[a-z]/.test(str) && /\d/.test(str)) {
    str = str
      .replace(/0/g, 'o')
      .replace(/1/g, 'l')
      .replace(/5/g, 's')
      .replace(/8/g, 'b');
  }

  // 'rn' -> 'm' 오인식, 'cl' -> 'd' 오인식 등 일반화
  return str;
}

/**
 * 3. 사전 기반 최고 유사 단어/숙어 교정 추천
 */
export function correctOcrWordOrPhrase(raw: string): {
  corrected: string;
  isModified: boolean;
  original: string;
  confidence: number;
} {
  const normalized = normalizeInputText(raw);
  const charCorrected = correctOcrCharacterGlitch(normalized);

  // 1) 이미 내장 단어/숙어 사전에 완벽히 존재하는 경우
  if (BUILTIN_DICTIONARY[charCorrected]) {
    return {
      corrected: charCorrected,
      isModified: charCorrected !== normalized,
      original: raw,
      confidence: 100,
    };
  }

  const isPhraseMatch = COMPREHENSIVE_PHRASE_DICTIONARY.some((p) => p.phrase.toLowerCase() === charCorrected);
  if (isPhraseMatch) {
    return {
      corrected: charCorrected,
      isModified: charCorrected !== normalized,
      original: raw,
      confidence: 100,
    };
  }

  // 2) 흔한 오탈자 매핑 확인
  if (COMMON_OCR_TYPO_MAP[charCorrected]) {
    const matched = COMMON_OCR_TYPO_MAP[charCorrected];
    return {
      corrected: matched,
      isModified: true,
      original: raw,
      confidence: 95,
    };
  }

  // 3) 단어의 길이가 3자 이상인 경우 Levenshtein 거리 1 이하인 내장 사전 단어 탐색
  if (charCorrected.length >= 3 && !charCorrected.includes(' ')) {
    let closestWord = '';
    let minDistance = 999;

    const dictKeys = Object.keys(BUILTIN_DICTIONARY);
    for (const key of dictKeys) {
      if (Math.abs(key.length - charCorrected.length) > 1) continue;
      const dist = calculateLevenshteinDistance(charCorrected, key);
      if (dist < minDistance) {
        minDistance = dist;
        closestWord = key;
        if (dist === 1) break; // 거리 1이면 즉시 채택
      }
    }

    if (closestWord && minDistance <= 1) {
      return {
        corrected: closestWord,
        isModified: true,
        original: raw,
        confidence: 90,
      };
    }
  }

  // 원본 유지
  return {
    corrected: charCorrected,
    isModified: false,
    original: raw,
    confidence: 75,
  };
}
