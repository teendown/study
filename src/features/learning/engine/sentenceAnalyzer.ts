// ===========================
// Sentence Deep Analyzer & Learning Data Generator
// ===========================
// 문장 단위 한국어 번역 + 핵심 단어/품사 + 숙어/구동사 추출 + 문법 패턴 분석(현재완료, 수동태, 관계사 등) + 중요도/난이도 종합 생성

import { extractEnglishPhrases } from '@/lib/ocr/phraseDictionary';
import { extractEnglishWords } from '@/lib/ocr/tokenizer';
import { translateToKorean } from '@/features/vocabulary/services/dictionarySearch';
import { getGeminiApiKey, callGeminiApi } from '@/lib/ai/geminiService';

export interface GrammarPattern {
  name: string;        // 문법 항목 (예: "현재완료진행형", "조동사 + 동사원형", "관계대명사절", "수동태")
  pattern: string;     // 매칭된 형태 (예: "have been looking", "will go")
  explanation: string; // 친절한 문법 설명
}

export interface KeyWordItem {
  word: string;
  meaning: string;
  partOfSpeech: string;
  importance: number; // 1 ~ 5 (별점)
}

export interface KeyPhraseItem {
  phrase: string;
  meaning: string;
  difficulty: number;
  importance: number; // 1 ~ 5 (별점)
}

export interface SentenceAnalysisResult {
  originalSentence: string;
  koreanTranslation: string;
  grammarPatterns: GrammarPattern[];
  keyWords: KeyWordItem[];
  keyPhrases: KeyPhraseItem[];
  difficultyLevel: '초급' | '중급' | '고급' | '수능/실전';
  summary: string;
}

/**
 * 규칙 기반 영문법 패턴 분석기
 */
function analyzeGrammarRules(sentence: string): GrammarPattern[] {
  const patterns: GrammarPattern[] = [];
  const text = sentence.trim();

  // 1. 현재완료진행형 (have/has been + V-ing)
  const perfectProgressive = text.match(/\b(have|has|had)\s+been\s+([a-z]+ing)\b/i);
  if (perfectProgressive) {
    patterns.push({
      name: '현재완료진행형 (have/has been + V-ing)',
      pattern: perfectProgressive[0],
      explanation: '과거부터 시작되어 지금까지 계속 진행 중인 동작을 나타냅니다.',
    });
  }

  // 2. 현재완료 / 과거완료 (have/has/had + p.p)
  const perfectTense = text.match(/\b(have|has|had)\s+([a-z]+(?:ed|en|ne|t))\b/i);
  if (perfectTense && !perfectProgressive) {
    patterns.push({
      name: '완료 시제 (have/has/had + p.p.)',
      pattern: perfectTense[0],
      explanation: '과거의 사건이나 경험이 현재와 연결되어 있음을 나타냅니다.',
    });
  }

  // 3. 수동태 (be + p.p)
  const passiveVoice = text.match(/\b(am|is|are|was|were|be|been|being)\s+([a-z]+(?:ed|en|ne|t))\b/i);
  if (passiveVoice && !perfectProgressive) {
    patterns.push({
      name: '수동태 (be + p.p.)',
      pattern: passiveVoice[0],
      explanation: '주어가 동작의 주체가 아니라 대상(당하는 입장)임을 표현합니다.',
    });
  }

  // 4. 조동사 + 동사원형
  const modalVerb = text.match(/\b(can|could|will|would|shall|should|may|might|must)\s+([a-z]+)\b/i);
  if (modalVerb) {
    patterns.push({
      name: '조동사 표현',
      pattern: modalVerb[0],
      explanation: `조동사 '${modalVerb[1]}' 뒤에 동사원형이 결합하여 가능, 의지, 의무 등을 나타냅니다.`,
    });
  }

  // 5. to부정사 (to + 동사원형)
  const infinitive = text.match(/\bto\s+([a-z]{3,})\b/i);
  if (infinitive && !/\b(to\s+(the|a|an|me|you|him|her|us|them|it))\b/i.test(infinitive[0])) {
    patterns.push({
      name: 'to 부정사 (to + 동사원형)',
      pattern: infinitive[0],
      explanation: '목적(~하기 위해), 명사적 용법(~하는 것), 또는 형용사적 용법으로 쓰입니다.',
    });
  }

  // 6. 관계사절 (who, which, that, where, when 등)
  const relativeClause = text.match(/\b(who|whom|whose|which|that|where|when|why)\s+[a-z]+/i);
  if (relativeClause) {
    patterns.push({
      name: '관계사절',
      pattern: relativeClause[0],
      explanation: '앞의 선행사(명사)를 뒤에서 수식하여 의미를 구체화합니다.',
    });
  }

  return patterns;
}

/**
 * 문장 종합 심층 분석 및 학습 데이터 생성
 */
export async function analyzeSentenceComprehensive(sentenceText: string): Promise<SentenceAnalysisResult> {
  const cleanSentence = sentenceText.trim();
  if (!cleanSentence) {
    throw new Error('분석할 문장을 입력해주세요.');
  }

  // 1. 한국어 번역
  let koreanTranslation = '';
  try {
    koreanTranslation = await translateToKorean(cleanSentence);
  } catch {}

  // 2. 문장 내 숙어/구동사 추출 (고정밀 내장 숙어 엔진)
  const extractedPhrases = extractEnglishPhrases(cleanSentence);
  const keyPhrases: KeyPhraseItem[] = extractedPhrases.map((p) => ({
    phrase: p.phrase,
    meaning: p.meaning,
    difficulty: p.difficulty,
    importance: Math.min(5, p.difficulty + 2),
  }));

  // 3. 문장 내 핵심 단어 추출
  const rawWords = extractEnglishWords(cleanSentence);
  const keyWords: KeyWordItem[] = rawWords.slice(0, 5).map((w) => ({
    word: w.word,
    meaning: w.meaning || '어휘 학습 필요',
    partOfSpeech: w.partOfSpeech || 'n.',
    importance: w.difficulty >= 2 ? 4 : 3,
  }));

  // 4. 문법 패턴 분석 (1차 규칙 기반)
  const grammarPatterns = analyzeGrammarRules(cleanSentence);

  // 5. 난이도 산출
  let difficultyLevel: '초급' | '중급' | '고급' | '수능/실전' = '중급';
  const wordCount = cleanSentence.split(/\s+/).length;
  if (wordCount <= 5 && grammarPatterns.length <= 1) {
    difficultyLevel = '초급';
  } else if (wordCount > 15 || grammarPatterns.length >= 3) {
    difficultyLevel = '수능/실전';
  } else if (wordCount > 10) {
    difficultyLevel = '고급';
  }

  // 6. Gemini AI가 연결된 경우 초정밀 문법 및 학습 요약 보강
  if (getGeminiApiKey()) {
    try {
      const prompt = `다음 영어 문장을 학생 영어 학습용으로 정밀 분석하여 JSON 형식으로 반환해줘.
문장: "${cleanSentence}"

JSON 형식:
{
  "translation": "자연스러운 한국어 번역",
  "summary": "핵심 학습 포인트 1문장 요약",
  "difficulty": "초급 | 중급 | 고급 | 수능/실전",
  "grammar": [
    { "name": "문법 항목명", "pattern": "문장 내 해당 표현", "explanation": "한국어 설명" }
  ]
}`;

      const aiResponse = await callGeminiApi(prompt);
      if (aiResponse) {
        const jsonMatch = aiResponse.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          const parsed = JSON.parse(jsonMatch[0]);
          if (parsed.translation) koreanTranslation = parsed.translation;
          if (parsed.difficulty) difficultyLevel = parsed.difficulty;
          if (Array.isArray(parsed.grammar) && parsed.grammar.length > 0) {
            grammarPatterns.push(...parsed.grammar);
          }
        }
      }
    } catch {}
  }

  return {
    originalSentence: cleanSentence,
    koreanTranslation: koreanTranslation || cleanSentence,
    grammarPatterns: grammarPatterns.slice(0, 4),
    keyWords,
    keyPhrases,
    difficultyLevel,
    summary: `${keyPhrases.length > 0 ? `숙어 [${keyPhrases.map((p) => p.phrase).join(', ')}]와 ` : ''}${grammarPatterns.length > 0 ? `문법 [${grammarPatterns[0].name}]` : '핵심 어휘'} 중심 학습`,
  };
}
