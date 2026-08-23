// ===========================
// Dashboard Local Storage Services
// ===========================

import type { DashboardData } from '../types';
import { calculateLevelInfo } from './gameService';
import { getAchievementsAction } from './achievementActions';
import { getReviewSummaryAction } from '@/features/review/services';

const STORAGE_KEY_USER = 'study_quest_user_v1';

export async function getDashboardDataAction(): Promise<{
  success: boolean;
  data: DashboardData;
  error?: string;
}> {
  let user = { name: '다은', level: 12, xp: 820, streak: 8 };

  if (typeof window !== 'undefined') {
    try {
      const raw = localStorage.getItem(STORAGE_KEY_USER);
      if (raw) user = JSON.parse(raw);
    } catch {}
  }

  const levelInfo = calculateLevelInfo(user.xp || 820);
  const achRes = await getAchievementsAction();
  const recentAchievements = achRes.data.filter((a) => a.isUnlocked).slice(0, 3);
  const reviewRes = await getReviewSummaryAction();

  return {
    success: true,
    data: {
      user: {
        name: user.name || '다은',
        level: levelInfo.level,
        xp: user.xp || 820,
        streak: user.streak || 8,
        levelInfo,
      },
      dailyGoal: {
        reviewWords: 15,
        reviewWordsTarget: 20,
        newWords: 7,
        newWordsTarget: 10,
        questions: 22,
        questionsTarget: 30,
        studyMinutes: 18,
        studyMinutesTarget: 30,
        isAllCompleted: false,
      },
      recommendation: {
        dueReviewCount: reviewRes.data?.dueCount || 2,
        weakWordCount: reviewRes.data?.weakCount || 1,
        newWordCount: 5,
      },
      recentAchievements,
    },
  };
}
