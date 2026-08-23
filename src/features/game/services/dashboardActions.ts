// ===========================
// Dashboard Realtime Data Server Actions
// ===========================
// 설계서 섹션 18, 19 기반

'use server';

import { eq, sql } from 'drizzle-orm';
import { getDb, schema } from '@/lib/db/client';
import { calculateLevelInfo } from './gameService';
import { getAchievementsAction } from './achievementActions';
import type { DashboardData } from '../types';

/**
 * 대시보드 전체 실시간 데이터 조회
 */
export async function getDashboardDataAction(): Promise<{
  success: boolean;
  data: DashboardData;
  error?: string;
}> {
  try {
    const db = getDb();

    // 1. 사용자 조회 (없으면 기본 학생 생성)
    let [user] = await db.select().from(schema.users).limit(1);

    if (!user) {
      const newId = crypto.randomUUID();
      await db.insert(schema.users).values({
        id: newId,
        name: '다은',
        email: 'daeun@studyquest.local',
        role: 'student',
        level: 1,
        xp: 120,
        streak: 3,
      });
      user = {
        id: newId,
        name: '다은',
        email: 'daeun@studyquest.local',
        role: 'student',
        passwordHash: null,
        level: 1,
        xp: 120,
        streak: 3,
        lastActiveDate: null,
        parentId: null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
    }

    // 2. 레벨 정보 계산
    const levelInfo = calculateLevelInfo(user.xp);

    // 3. 오늘 학습 통계 집계 (study_sessions & study_answers)
    const today = new Date().toISOString().split('T')[0];

    const todayAnswers = await db
      .select({ isCorrect: schema.studyAnswers.isCorrect })
      .from(schema.studyAnswers)
      .where(
        eq(schema.studyAnswers.userId, user.id) &&
        sql`date(${schema.studyAnswers.createdAt}) = ${today}`
      );

    const questionsToday = todayAnswers.length;

    // 복습 대상 및 취약 단어 수
    const progressList = await db
      .select({
        nextReviewAt: schema.userProgress.nextReviewAt,
        wrongCount: schema.userProgress.wrongCount,
        masteryScore: schema.userProgress.masteryScore,
      })
      .from(schema.userProgress)
      .where(eq(schema.userProgress.userId, user.id));

    const now = new Date();
    const dueReviewCount = progressList.filter(
      (p) => !p.nextReviewAt || new Date(p.nextReviewAt).getTime() <= now.getTime()
    ).length;

    const weakWordCount = progressList.filter((p) => p.wrongCount >= 2).length;

    // 4. 업적 목록 조회
    const achRes = await getAchievementsAction();
    const recentAchievements = achRes.data.filter((a) => a.isUnlocked).slice(0, 3);

    // 일일 목표 계산
    const reviewWords = Math.min(20, Math.floor(questionsToday * 0.4));
    const newWords = Math.min(10, Math.floor(questionsToday * 0.3));
    const studyMinutes = Math.min(30, Math.round(questionsToday * 1.2));

    const isAllCompleted =
      reviewWords >= 20 && newWords >= 10 && questionsToday >= 30 && studyMinutes >= 30;

    return {
      success: true,
      data: {
        user: {
          name: user.name,
          level: levelInfo.level,
          xp: user.xp,
          streak: user.streak || 1,
          levelInfo,
        },
        dailyGoal: {
          reviewWords,
          reviewWordsTarget: 20,
          newWords,
          newWordsTarget: 10,
          questions: questionsToday,
          questionsTarget: 30,
          studyMinutes,
          studyMinutesTarget: 30,
          isAllCompleted,
        },
        recommendation: {
          dueReviewCount,
          weakWordCount,
          newWordCount: 5,
        },
        recentAchievements,
      },
    };
  } catch (err) {
    console.error('Dashboard data error:', err);
    return {
      success: true,
      data: getMockDashboardData(),
    };
  }
}

function getMockDashboardData(): DashboardData {
  const xp = 820;
  const levelInfo = calculateLevelInfo(xp);

  return {
    user: {
      name: '다은',
      level: 12,
      xp,
      streak: 8,
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
      dueReviewCount: 12,
      weakWordCount: 4,
      newWordCount: 5,
    },
    recentAchievements: [
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
    ],
  };
}
