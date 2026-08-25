import type { VocabularyWithItem } from '../types';
import type { PhraseWithItem } from '../types';

export interface VocabularyIssue {
  type: 'spelling' | 'meaning' | 'info';
  code: string;
  label: string;
  description: string;
  severity: 'error' | 'warning' | 'info';
}

export interface VocabularyIssueResult {
  hasIssue: boolean;
  issues: VocabularyIssue[];
  primaryLabel?: string;
}

/**
 * 영단어에 이상이나 오타, 표기 누락이 있는지 정밀 감지
 */
export function detectVocabularyIssues(vocab: VocabularyWithItem): VocabularyIssueResult {
  const issues: VocabularyIssue[] = [];
  const word = (vocab.word || '').trim();
  const meaning = (vocab.meaning || '').trim();

  // 1. 단어명(Word) 검사
  if (!word) {
    issues.push({
      type: 'spelling',
      code: 'empty_word',
      label: '단어 누락',
      description: '단어 텍스트가 비어 있습니다.',
      severity: 'error',
    });
  } else {
    // 1-1. 비정상 특수기호 감지 (@, #, $, %, ^, &, *, ~, |, \, _, =, +, <, >, [, ], {, })
    if (/[@#$%^&*~|\\_=+<>\[\]{}]/.test(word)) {
      issues.push({
        type: 'spelling',
        code: 'irregular_symbols',
        label: '특수기호 오류',
        description: '단어에 비정상적인 특수기호가 포함되어 있습니다.',
        severity: 'error',
      });
    }

    // 1-2. 단어명 내 한글 혼입 감지
    if (/[ㄱ-ㅎㅏ-ㅣ가-힣]/.test(word)) {
      issues.push({
        type: 'spelling',
        code: 'hangul_in_word',
        label: '한글 혼입',
        description: '영단어에 한글이 섞여 있습니다.',
        severity: 'error',
      });
    }

    // 1-3. 단어명 내 숫자 혼입 감지
    if (/\d/.test(word)) {
      issues.push({
        type: 'spelling',
        code: 'number_in_word',
        label: '숫자 혼입',
        description: '단어에 숫자가 포함되어 있습니다.',
        severity: 'warning',
      });
    }

    // 1-4. 글자수 이상 (a, I 외에 1글자이거나 너무 김)
    if (word.length === 1 && !['a', 'i', 'A', 'I'].includes(word)) {
      issues.push({
        type: 'spelling',
        code: 'single_char',
        label: '1글자 단어',
        description: '유효한 1글자 영단어가 아닙니다.',
        severity: 'warning',
      });
    } else if (word.length > 35) {
      issues.push({
        type: 'spelling',
        code: 'too_long',
        label: '비정상 길이',
        description: '단어 길이가 너무 깁니다 (문장이 들어갔을 수 있음).',
        severity: 'warning',
      });
    }
  }

  // 2. 뜻(Meaning) 검사
  const emptyMeaningKeywords = ['의미 미입력', '의미 검색 필요', '뜻 미입력', '의미 없음', ''];
  if (!meaning || emptyMeaningKeywords.includes(meaning)) {
    issues.push({
      type: 'meaning',
      code: 'missing_meaning',
      label: '뜻 누락',
      description: '한국어 뜻이 등록되어 있지 않습니다.',
      severity: 'error',
    });
  } else {
    // 뜻에 한글이 전혀 없는 경우 (영어만 적힌 경우 등)
    if (!/[가-힣]/.test(meaning)) {
      issues.push({
        type: 'meaning',
        code: 'no_hangul_meaning',
        label: '한글 뜻 없음',
        description: '뜻에 한국어 번역이 포함되어 있지 않습니다.',
        severity: 'warning',
      });
    }
  }

  // 3. 부가 정보 검사 (품사, 발음)
  if (!vocab.partOfSpeech || vocab.partOfSpeech.trim() === '') {
    issues.push({
      type: 'info',
      code: 'missing_pos',
      label: '품사 누락',
      description: '품사(n, v, adj 등)가 입력되지 않았습니다.',
      severity: 'info',
    });
  }

  if (!vocab.pronunciation || vocab.pronunciation.trim() === '') {
    issues.push({
      type: 'info',
      code: 'missing_pronunciation',
      label: '발음 누락',
      description: '발음 표기가 없습니다.',
      severity: 'info',
    });
  }

  return {
    hasIssue: issues.length > 0,
    issues,
    primaryLabel: issues[0]?.label,
  };
}

/**
 * 숙어에 이상이나 표기 누락이 있는지 감지
 */
export function detectPhraseIssues(phrase: PhraseWithItem): VocabularyIssueResult {
  const issues: VocabularyIssue[] = [];
  const phraseText = (phrase.phrase || '').trim();
  const meaning = (phrase.meaning || '').trim();

  if (!phraseText) {
    issues.push({
      type: 'spelling',
      code: 'empty_phrase',
      label: '숙어 누락',
      description: '숙어 텍스트가 비어 있습니다.',
      severity: 'error',
    });
  } else {
    if (/[@#$%^*~|\\_=+<>\[\]{}]/.test(phraseText)) {
      issues.push({
        type: 'spelling',
        code: 'irregular_symbols',
        label: '특수기호 오류',
        description: '숙어에 비정상적인 특수기호가 포함되어 있습니다.',
        severity: 'error',
      });
    }

    if (/[ㄱ-ㅎㅏ-ㅣ가-힣]/.test(phraseText)) {
      issues.push({
        type: 'spelling',
        code: 'hangul_in_phrase',
        label: '한글 혼입',
        description: '숙어에 한글이 섞여 있습니다.',
        severity: 'error',
      });
    }
  }

  const emptyMeaningKeywords = ['의미 미입력', '의미 검색 필요', '뜻 미입력', '의미 없음', ''];
  if (!meaning || emptyMeaningKeywords.includes(meaning)) {
    issues.push({
      type: 'meaning',
      code: 'missing_meaning',
      label: '뜻 누락',
      description: '한국어 뜻이 등록되어 있지 않습니다.',
      severity: 'error',
    });
  } else if (!/[가-힣]/.test(meaning)) {
    issues.push({
      type: 'meaning',
      code: 'no_hangul_meaning',
      label: '한글 뜻 없음',
      description: '뜻에 한국어 번역이 포함되어 있지 않습니다.',
      severity: 'warning',
    });
  }

  return {
    hasIssue: issues.length > 0,
    issues,
    primaryLabel: issues[0]?.label,
  };
}
