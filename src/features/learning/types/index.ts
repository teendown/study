// ===========================
// Learning & Quiz Types
// ===========================
// 설계서 섹션 7.6, 7.8, 7.9, 9, 15 기반

import type { QuestionType, StudyMode } from '@/types';
import type { VocabularyWithItem } from '@/features/vocabulary/types';

/** 생성된 학습 문제 */
export interface GeneratedQuestion {
  id: string;
  learningItemId: string;
  type: QuestionType;
  questionText: string;
  correctAnswer: string;
  options?: string[]; // 객관식일 경우 4개 선택지
  hint?: string;
  explanation?: string;
  word: VocabularyWithItem;
  timeLimit?: number; // 초 단위 (스피드 모드)
}

/** 문제 풀이 결과 기록 */
export interface AnswerRecord {
  questionId: string;
  learningItemId: string;
  word: string;
  meaning: string;
  isCorrect: boolean;
  userAnswer: string;
  correctAnswer: string;
  responseTimeMs: number;
}

/** 세션 요약 결과 */
export interface SessionSummary {
  mode: StudyMode;
  totalQuestions: number;
  correctCount: number;
  wrongCount: number;
  accuracy: number;
  totalXpEarned: number;
  maxCombo: number;
  totalTimeSeconds: number;
  answers: AnswerRecord[];
  wrongItems: VocabularyWithItem[];
}
