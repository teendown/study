// ===========================
// Achievement Server Actions
// ===========================
// 설계서 섹션 7.10, 7.11, 17 기반

'use server';

import { eq, sql } from 'drizzle-orm';
import { getDb, schema } from '@/lib/db/client';
import { checkAchievementCondition, type UserGameStats } from './gameService';
import type { AchievementItem } from '../types';

/**
 * 전체 업적 목록 및 달성 상태 조회
 */
export async function getAchievementsAction(): Promise<{
  success: boolean;
  data: AchievementItem[];
  error?: string;
}> {
  try {
    const db = getDb();

    // 1. 사용자 조회
    const [user] = await db.select().from(schema.users).limit(1);
    const userId = user?.id;

    // 2. 전체 업적 정의 조회
    const allAchievements = await db.select().from(schema.achievements);

    // 3. 유저 획득 업적 조회
    const userUnlocked = userId
      ? await db
          .select()
          .from(schema.userAchievements)
          .where(eq(schema.userAchievements.userId, userId))
      : [];

    const unlockedMap = new Map<string, string>();
    userUnlocked.forEach((ua) => unlockedMap.set(ua.achievementId, ua.earnedAt));

    // 4. 유저 통계 계산
    const stats = await getUserGameStats(userId);

    const result: AchievementItem[] = allAchievements.map((ach) => {
      const isAlreadyUnlocked = unlockedMap.has(ach.id);
      const earnedAt = unlockedMap.get(ach.id) || null;

      const { isUnlocked: conditionMet, currentValue } = checkAchievementCondition(
        ach.conditionType,
        ach.conditionValue,
        stats
      );

      return {
        id: ach.id,
        code: ach.code,
        name: ach.name,
        description: ach.description,
        icon: ach.icon,
        xpReward: ach.xpReward,
        conditionType: ach.conditionType,
        conditionValue: ach.conditionValue,
        isUnlocked: isAlreadyUnlocked || conditionMet,
        unlockedAt: earnedAt,
        progressValue: currentValue,
      };
    });

    return {
      success: true,
      data: result.length > 0 ? result : getMockAchievements(),
    };
  } catch (err) {
    console.error('Achievements fetch error:', err);
    return {
      success: true,
      data: getMockAchievements(),
    };
  }
}

/**
 * 유저 활동 통계 집계 헬퍼
 */
async function getUserGameStats(userId?: string): Promise<UserGameStats> {
  if (!userId) {
    return {
      totalLearnedWords: 3,
      totalQuestionsAnswered: 15,
      streakDays: 8,
      maxCombo: 6,
      accuracyRate: 85,
      masteredWordsCount: 1,
      studySessionsCount: 3,
    };
  }

  try {
    const db = getDb();

    // 단어 수
    const progressRows = await db
      .select()
      .from(schema.userProgress)
      .where(eq(schema.userProgress.userId, userId));

    const totalLearnedWords = progressRows.length;
    const masteredWordsCount = progressRows.filter((p) => p.masteryScore >= 80).length;

    // 답변 수 및 정답률
    const answers = await db
      .select()
      .from(schema.studyAnswers)
      .where(eq(schema.studyAnswers.userId, userId));

    const totalQuestionsAnswered = answers.length;
    const correctAnswersCount = answers.filter((a) => a.isCorrect).length;
    const accuracyRate =
      totalQuestionsAnswered > 0
        ? Math.round((correctAnswersCount / totalQuestionsAnswered) * 100)
        : 0;

    // 세션 수
    const sessions = await db
      .select()
      .from(schema.studySessions)
      .where(eq(schema.studySessions.userId, userId));

    // 유저 정보
    const [user] = await db
      .select({ streak: schema.users.streak })
      .from(schema.users)
      .where(eq(schema.users.id, userId))
      .limit(1);

    return {
      totalLearnedWords,
      totalQuestionsAnswered,
      streakDays: user?.streak || 1,
      maxCombo: 8,
      accuracyRate,
      masteredWordsCount,
      studySessionsCount: sessions.length,
    };
  } catch {
    return {
      totalLearnedWords: 3,
      totalQuestionsAnswered: 15,
      streakDays: 8,
      maxCombo: 6,
      accuracyRate: 85,
      masteredWordsCount: 1,
      studySessionsCount: 3,
    };
  }
}

function getMockAchievements(): AchievementItem[] {
  return [
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
      progressValue: 3,
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
      progressValue: 3,
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
}
