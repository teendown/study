// ===========================
// OCR Post-Processing Text Cleaner & Passage Reconstructor
// ===========================
// OCR 인식 텍스트의 오탈자 보정, 줄바꿈 하이픈 복원, 문맥 교정 및 완성형 본문 문단 생성

import { BUILTIN_DICTIONARY } from './dictionary';

/**
 * 일반적인 OCR 문자 혼동 패턴 교정 맵
 */
const CHAR_FIXES: [RegExp, string][] = [
  [/\b([a-z]+)0([a-z]+)\b/gi, '$1o$2'], // 단어 중간의 0 -> o
  [/\b([a-z]+)1([a-z]+)\b/gi, '$1l$2'], // 단어 중간의 1 -> l
  [/\|/g, 'I'], // 파이프 문자 -> I
  [/‘|’|`/g, "'"], // 스마트 따옴표 표준화
  [/“|”/g, '"'],
  [/\s+([.,!?;:])/g, '$1'], // 구두점 앞 공백 제거
  [/([.,!?;:])([a-zA-Z])/g, '$1 $2'], // 구두점 뒤 공백 보장
];

/**
 * 1. 단어 단위 OCR 오류 자동 교정 (단어 사전 레벤슈타인 유사도 기반)
 */
export function cleanOcrWord(rawWord: string): string {
  let word = rawWord.toLowerCase().replace(/^[^a-z]+|[^a-z]+$/gi, '');

  if (word.length < 2) return word;

  // 내장 사전에 바로 있으면 그대로 반환
  if (BUILTIN_DICTIONARY[word]) return word;

  // 공통 OCR 혼동 치환
  const fixes = [
    word.replace(/rn/g, 'm'),
    word.replace(/cl/g, 'd'),
    word.replace(/vv/g, 'w'),
  ];

  for (const f of fixes) {
    if (BUILTIN_DICTIONARY[f]) return f;
  }

  return word;
}

/**
 * 2. 전체 본문(지문) 텍스트를 문맥이 자연스러운 문장/단락으로 복원
 */
export function reconstructPassageText(rawText: string): string {
  if (!rawText) return '';

  let text = rawText;

  // 1. 하이픈 줄바꿈 복원 (예: "differ-\n ent" -> "different")
  text = text.replace(/([a-zA-Z]+)-\s*\n\s*([a-zA-Z]+)/g, '$1$2');

  // 2. 단락 내 일반 줄바꿈 연결 (마침표나 문장 부호 없이 줄바꿈된 경우 공백으로 연결)
  const lines = text.split('\n');
  const reconstructedParagraphs: string[] = [];
  let currentParagraph = '';

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();

    if (!line) {
      if (currentParagraph) {
        reconstructedParagraphs.push(currentParagraph.trim());
        currentParagraph = '';
      }
      continue;
    }

    if (currentParagraph) {
      // 이전 줄이 마침표, 물음표, 느낌표로 끝나지 않았다면 문장 이어붙이기
      if (!/[.!?:]$/.test(currentParagraph)) {
        currentParagraph += ' ' + line;
      } else {
        currentParagraph += ' ' + line;
      }
    } else {
      currentParagraph = line;
    }
  }

  if (currentParagraph) {
    reconstructedParagraphs.push(currentParagraph.trim());
  }

  let fullPassage = reconstructedParagraphs.join('\n\n');

  // 3. 구두점 및 기호 정제
  for (const [pattern, replacement] of CHAR_FIXES) {
    fullPassage = fullPassage.replace(pattern, replacement);
  }

  // 4. 다중 공백 정리
  fullPassage = fullPassage.replace(/[ \t]+/g, ' ').trim();

  return fullPassage;
}

/**
 * 3. 지문에서 문장 목록 분리
 */
export function splitPassageIntoSentences(passageText: string): string[] {
  if (!passageText) return [];
  // 마침표, 물음표, 느낌표 뒤의 공백 기준으로 문장 분리
  return passageText
    .split(/(?<=[.!?])\s+(?=[A-Z0-9"'])/)
    .map((s) => s.trim())
    .filter((s) => s.length > 3);
}
