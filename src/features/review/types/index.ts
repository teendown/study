// ===========================
// Review Feature Types
// ===========================
// 설계서 섹션 7.7, 13, 14 기반

import type { MasteryLevel } from '@/types';
import type { VocabularyWithItem } from '@/features/vocabulary/types';

/** 사용자별 단어 학습 상태 */
export interface WordProgressItem extends VocabularyWithItem {
  progressId?: string;
  correctCount: number;
  wrongCount: number;
  totalAttempts: number;
  masteryScore: number;
  streak: number;
  lastStudiedAt: string | null;
  nextReviewAt: string | null;
  easeFactor: number;
  intervalDays: number;
  isDueForReview: boolean; // 오늘 복습 대상 여부
  masteryLevel: MasteryLevel;
}

/** 숙련도 단계별 통계 */
export interface MasteryStats {
  unlearned: number;      // 0~20
  learning: number;       // 21~40
  average: number;        // 41~60
  skilled: number;        // 61~80
  highlySkilled: number;  // 81~95
  master: number;         // 96~100
  total: number;
}

/** 복습 요약 데이터 */
export interface ReviewSummaryData {
  dueCount: number;         // 오늘 복습 예정
  weakCount: number;        // 취약/반복 오답 단어
  masteredCount: number;    // 마스터 단어
  totalLearned: number;     // 학습 시작한 총 단어
  stats: MasteryStats;
  dueItems: WordProgressItem[];
  weakItems: WordProgressItem[];
}
