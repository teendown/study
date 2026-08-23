// ===========================
// Spaced Repetition & Mastery Algorithm
// ===========================
// 설계서 섹션 13, 14, 59 기반

import type { MasteryLevel } from '@/types';

/** 복습 간격 단계 (일 단위 환산) */
export const INTERVAL_STAGES: number[] = [
  5 / (24 * 60),  // 0단계: 5분 후 (약 0.0035일)
  30 / (24 * 60), // 1단계: 30분 후 (약 0.0208일)
  1,              // 2단계: 1일 후
  3,              // 3단계: 3일 후
  7,              // 4단계: 7일 후
  14,             // 5단계: 14일 후
  30,             // 6단계: 30일 후
];

/**
 * 숙련도 점수를 바탕으로 등급을 판정합니다.
 * 설계서 섹션 14
 */
export function calculateMasteryLevel(score: number): MasteryLevel {
  if (score >= 96) return 'master';
  if (score >= 81) return 'highly_skilled';
  if (score >= 61) return 'skilled';
  if (score >= 41) return 'average';
  if (score >= 21) return 'learning';
  return 'unlearned';
}

/**
 * 문제 풀이 결과에 따라 다음 복습 일정 및 숙련도를 계산합니다.
 */
export interface RepetitionResult {
  nextReviewAt: string;
  intervalDays: number;
  easeFactor: number;
  streak: number;
  masteryScore: number;
}

export function calculateNextReview(params: {
  isCorrect: boolean;
  currentStreak: number;
  currentEaseFactor: number;
  currentIntervalDays: number;
  currentMasteryScore: number;
  responseTimeMs?: number;
}): RepetitionResult {
  const {
    isCorrect,
    currentStreak = 0,
    currentEaseFactor = 2.5,
    currentIntervalDays = 0,
    currentMasteryScore = 0,
    responseTimeMs = 3000,
  } = params;

  let nextStreak = currentStreak;
  let nextEase = currentEaseFactor;
  let nextInterval = currentIntervalDays;
  let nextScore = currentMasteryScore;

  if (isCorrect) {
    nextStreak = currentStreak + 1;

    // 빠른 응답(2.5초 이내) 시 가산점
    const isFast = responseTimeMs < 2500;
    const scoreGain = isFast ? 18 : 12;
    nextScore = Math.min(100, currentMasteryScore + scoreGain);

    // 간격 계산 (단계별 확장)
    if (nextStreak === 1) {
      nextInterval = INTERVAL_STAGES[2]; // 1일
    } else if (nextStreak === 2) {
      nextInterval = INTERVAL_STAGES[3]; // 3일
    } else if (nextStreak === 3) {
      nextInterval = INTERVAL_STAGES[4]; // 7일
    } else if (nextStreak === 4) {
      nextInterval = INTERVAL_STAGES[5]; // 14일
    } else {
      nextInterval = Math.round(currentIntervalDays * nextEase);
      if (nextInterval < 30) nextInterval = 30;
    }

    // ease factor 미세 증가
    nextEase = Math.min(3.0, currentEaseFactor + 0.1);
  } else {
    // 오답 시: 스트릭 초기화, 간격 5분~30분으로 대폭 축소
    nextStreak = 0;
    nextInterval = INTERVAL_STAGES[1]; // 30분 후 재복습

    // 숙련도 감점 (최소 0점)
    nextScore = Math.max(0, currentMasteryScore - 15);

    // ease factor 감소
    nextEase = Math.max(1.3, currentEaseFactor - 0.2);
  }

  // 다음 복습 시점 계산
  const nextReviewDate = new Date(Date.now() + nextInterval * 24 * 60 * 60 * 1000);

  return {
    nextReviewAt: nextReviewDate.toISOString(),
    intervalDays: nextInterval,
    easeFactor: Math.round(nextEase * 100) / 100,
    streak: nextStreak,
    masteryScore: Math.round(nextScore),
  };
}
