// ===========================
// Game Service (Level & XP Engine)
// ===========================
// 설계서 섹션 16, 17, 60 기반

import type { LevelInfo } from '../types';

/**
 * 누적 XP를 기반으로 현재 레벨 및 진행 정보를 계산합니다.
 * 레벨 L에 도달하기 위한 누적 XP: 50 * L * (L - 1)
 */
export function calculateLevelInfo(totalXp: number): LevelInfo {
  const xp = Math.max(0, totalXp);

  // 레벨 계산: 50 * L * (L - 1) <= xp
  // 50L^2 - 50L - xp = 0
  // 근의 공식: L = (50 + sqrt(2500 + 200*xp)) / 100
  let level = Math.floor((50 + Math.sqrt(2500 + 200 * xp)) / 100);
  if (level < 1) level = 1;

  // 현재 레벨 시작 XP 및 다음 레벨 필요 XP
  const levelStartXp = 50 * level * (level - 1);
  const nextLevelXp = 50 * (level + 1) * level;
  const levelSpan = nextLevelXp - levelStartXp;

  const currentLevelXp = xp - levelStartXp;
  const progressPercent = Math.min(100, Math.round((currentLevelXp / levelSpan) * 100));
  const remainingXp = nextLevelXp - xp;

  return {
    level,
    currentXp: xp,
    levelStartXp,
    nextLevelXp,
    progressPercent,
    remainingXp,
  };
}

/**
 * 사용자 활동 지표에 따라 업적 해금 여부를 판정합니다.
 */
export interface UserGameStats {
  totalLearnedWords: number;
  totalQuestionsAnswered: number;
  streakDays: number;
  maxCombo: number;
  accuracyRate: number;
  masteredWordsCount: number;
  studySessionsCount: number;
}

export function checkAchievementCondition(
  conditionType: string,
  conditionValue: number,
  stats: UserGameStats
): { isUnlocked: boolean; currentValue: number } {
  let currentValue = 0;

  switch (conditionType) {
    case 'total_words':
      currentValue = stats.totalLearnedWords;
      break;
    case 'total_questions':
      currentValue = stats.totalQuestionsAnswered;
      break;
    case 'streak_days':
      currentValue = stats.streakDays;
      break;
    case 'consecutive_correct':
      currentValue = stats.maxCombo;
      break;
    case 'accuracy_rate':
      currentValue = stats.accuracyRate;
      break;
    case 'mastered_words':
      currentValue = stats.masteredWordsCount;
      break;
    case 'study_sessions':
      currentValue = stats.studySessionsCount;
      break;
    default:
      currentValue = 0;
  }

  const isUnlocked = currentValue >= conditionValue;
  return { isUnlocked, currentValue };
}
