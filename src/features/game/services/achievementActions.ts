// ===========================
// Achievement Local Storage Services
// ===========================

import type { AchievementItem } from '../types';

export async function getAchievementsAction(): Promise<{
  success: boolean;
  data: AchievementItem[];
  error?: string;
}> {
  const achievements: AchievementItem[] = [
    {
      id: 'ach-1',
      code: 'FIRST_WORD',
      name: '첫 단어',
      description: '첫 번째 단어를 학습했습니다!',
      icon: '🌟',
      xpReward: 50,
      conditionType: 'total_words',
      conditionValue: 1,
      isUnlocked: true,
      unlockedAt: new Date().toISOString(),
      progressValue: 5,
    },
    {
      id: 'ach-2',
      code: 'QUESTIONS_10',
      name: '첫 10문제',
      description: '10개의 문제를 풀었습니다!',
      icon: '✏️',
      xpReward: 30,
      conditionType: 'total_questions',
      conditionValue: 10,
      isUnlocked: true,
      unlockedAt: new Date().toISOString(),
      progressValue: 15,
    },
    {
      id: 'ach-3',
      code: 'STREAK_7',
      name: '7일 연속 학습',
      description: '7일 연속으로 학습했습니다!',
      icon: '🔥',
      xpReward: 200,
      conditionType: 'streak_days',
      conditionValue: 7,
      isUnlocked: true,
      unlockedAt: new Date().toISOString(),
      progressValue: 8,
    },
    {
      id: 'ach-4',
      code: 'WORDS_100',
      name: '100단어 달성',
      description: '100개의 단어를 학습했습니다!',
      icon: '📚',
      xpReward: 200,
      conditionType: 'total_words',
      conditionValue: 100,
      isUnlocked: false,
      unlockedAt: null,
      progressValue: 12,
    },
    {
      id: 'ach-5',
      code: 'COMBO_10',
      name: '10연속 정답',
      description: '10문제를 연속으로 맞혔습니다!',
      icon: '⚡',
      xpReward: 100,
      conditionType: 'consecutive_correct',
      conditionValue: 10,
      isUnlocked: false,
      unlockedAt: null,
      progressValue: 6,
    },
    {
      id: 'ach-6',
      code: 'ACCURACY_90',
      name: '정답률 90%',
      description: '전체 정답률 90% 이상을 달성했습니다!',
      icon: '🎯',
      xpReward: 300,
      conditionType: 'accuracy_rate',
      conditionValue: 90,
      isUnlocked: false,
      unlockedAt: null,
      progressValue: 85,
    },
  ];

  return {
    success: true,
    data: achievements,
  };
}
