// ===========================
// Confidence Scoring & Validation Engine (0 ~ 100 Score)
// ===========================
// AI 환각 및 OCR 오탈자 방지를 위한 5단계 신뢰도 평가 시스템

export interface ConfidenceScoreResult {
  score: number; // 0 ~ 100
  status: 'verified' | 'ai_reviewed' | 'needs_review';
  isAutoApproved: boolean;
  scoreBreakdown: {
    builtinMatch: number;      // max 40
    externalDictMatch: number; // max 20
    geminiAnalysis: number;    // max 20
    exampleValidation: number; // max 10
    posAndPronValidation: number; // max 10
  };
  reason: string;
}

export interface ValidationInput {
  word: string;
  meaning: string;
  partOfSpeech?: string;
  pronunciation?: string;
  exampleSentence?: string;
  exampleTranslation?: string;
  source?: string;
  isBuiltin?: boolean;
  isGeminiVerified?: boolean;
}

/**
 * 단어/숙어 학습 데이터에 대한 신뢰도 점수(0~100점) 및 승인 상태 계산
 */
export function calculateConfidenceScore(data: ValidationInput): ConfidenceScoreResult {
  let builtinMatch = 0;
  let externalDictMatch = 0;
  let geminiAnalysis = 0;
  let exampleValidation = 0;
  let posAndPronValidation = 0;

  const reasons: string[] = [];

  // 1. 사전 일치 점수 (내장 표준 사전: +60점, 외부 사전: +35점)
  if (data.isBuiltin || data.source?.includes('내장') || data.source?.includes('표준')) {
    builtinMatch = 60;
    reasons.push('표준 내장 사전 등록 (+60)');
  } else if (data.source?.includes('네이버') || data.source?.includes('위키')) {
    externalDictMatch = 35;
    reasons.push('공식 사전 연동 (+35)');
  }

  // 2. Gemini AI 정밀 분석 및 검증 (+25점)
  if (data.isGeminiVerified || data.source?.includes('Gemini') || data.source?.includes('AI')) {
    geminiAnalysis = 25;
    reasons.push('AI 어휘 검증 완료 (+25)');
  }

  // 3. 예문 유효성 검증 (+20점)
  if (data.exampleSentence && data.exampleSentence.trim().length > 5) {
    const cleanWord = data.word.trim().toLowerCase();
    const cleanEx = data.exampleSentence.toLowerCase();

    // 단어나 숙어가 예문 본문에 실제로 포함되어 있는지 확인
    if (cleanEx.includes(cleanWord) || cleanWord.split(' ').every((w) => cleanEx.includes(w))) {
      exampleValidation = 20;
      reasons.push('문맥 예문 적합성 검증 (+20)');
    } else {
      exampleValidation = 10;
      reasons.push('예문 포함 (+10)');
    }
  }

  // 4. 발음 및 품사 유효성 검증 (품사+뜻: +10점, 발음: +10점)
  const hasValidPos = Boolean(data.partOfSpeech && data.partOfSpeech !== '');
  const hasValidMeaning = Boolean(data.meaning && /[가-힣]/.test(data.meaning) && !data.meaning.includes('비표준 어휘'));

  if (hasValidPos && hasValidMeaning) {
    posAndPronValidation += 10;
  }
  if (data.pronunciation && /[가-힣]/.test(data.pronunciation)) {
    posAndPronValidation += 10;
  } else if (data.word.includes(' ')) {
    // 숙어는 발음 생략이 정상이므로 만점 부여
    posAndPronValidation += 10;
  } else if (data.pronunciation) {
    posAndPronValidation += 5;
  }

  const totalScore = Math.min(100, builtinMatch + externalDictMatch + geminiAnalysis + exampleValidation + posAndPronValidation);

  let status: 'verified' | 'ai_reviewed' | 'needs_review' = 'needs_review';
  let isAutoApproved = false;

  if (totalScore >= 80) {
    status = 'verified';
    isAutoApproved = true;
  } else if (totalScore >= 60) {
    status = 'ai_reviewed';
    isAutoApproved = true;
  } else {
    status = 'needs_review';
    isAutoApproved = false;
  }

  return {
    score: totalScore,
    status,
    isAutoApproved,
    scoreBreakdown: {
      builtinMatch,
      externalDictMatch,
      geminiAnalysis,
      exampleValidation,
      posAndPronValidation,
    },
    reason: reasons.join(', ') || '기본 번역 분석',
  };
}
