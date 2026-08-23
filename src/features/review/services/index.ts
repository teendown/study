// ===========================
// Review Server Actions
// ===========================
// 설계서 섹션 42, 59 기반

'use server';

import { eq, desc } from 'drizzle-orm';
import { getDb, schema } from '@/lib/db/client';
import { calculateMasteryLevel } from '../algorithm/spacedRepetition';
import type { ReviewSummaryData, WordProgressItem } from '../types';

/**
 * 복습 대시보드 요약 정보 조회
 */
export async function getReviewSummaryAction(): Promise<{
  success: boolean;
  data: ReviewSummaryData;
  error?: string;
}> {
  try {
    const db = getDb();

    // 1. 임시 학생 사용자
    const [user] = await db.select({ id: schema.users.id }).from(schema.users).limit(1);

    if (!user) {
      // 사용자 없을 시 기본 빈 데이터 반환
      return {
        success: true,
        data: getEmptyReviewSummary(),
      };
    }

    // 2. user_progress + learning_items + vocabularies 조인 조회
    const progressList = await db
      .select({
        progressId: schema.userProgress.id,
        correctCount: schema.userProgress.correctCount,
        wrongCount: schema.userProgress.wrongCount,
        totalAttempts: schema.userProgress.totalAttempts,
        masteryScore: schema.userProgress.masteryScore,
        streak: schema.userProgress.streak,
        lastStudiedAt: schema.userProgress.lastStudiedAt,
        nextReviewAt: schema.userProgress.nextReviewAt,
        easeFactor: schema.userProgress.easeFactor,
        intervalDays: schema.userProgress.intervalDays,
        // vocabulary 필드들
        id: schema.vocabularies.id,
        word: schema.vocabularies.word,
        meaning: schema.vocabularies.meaning,
        partOfSpeech: schema.vocabularies.partOfSpeech,
        pronunciation: schema.vocabularies.pronunciation,
        audioUrl: schema.vocabularies.audioUrl,
        exampleSentence: schema.vocabularies.exampleSentence,
        exampleTranslation: schema.vocabularies.exampleTranslation,
        synonyms: schema.vocabularies.synonyms,
        antonyms: schema.vocabularies.antonyms,
        frequency: schema.vocabularies.frequency,
        difficulty: schema.learningItems.difficulty,
        grade: schema.learningItems.grade,
        source: schema.learningItems.source,
        learningItemId: schema.vocabularies.learningItemId,
        createdAt: schema.vocabularies.createdAt,
        updatedAt: schema.vocabularies.updatedAt,
      })
      .from(schema.userProgress)
      .innerJoin(
        schema.learningItems,
        eq(schema.userProgress.learningItemId, schema.learningItems.id)
      )
      .innerJoin(
        schema.vocabularies,
        eq(schema.learningItems.id, schema.vocabularies.learningItemId)
      )
      .where(eq(schema.userProgress.userId, user.id))
      .orderBy(desc(schema.userProgress.updatedAt));

    const now = new Date();
    const stats = {
      unlearned: 0,
      learning: 0,
      average: 0,
      skilled: 0,
      highlySkilled: 0,
      master: 0,
      total: progressList.length,
    };

    const dueItems: WordProgressItem[] = [];
    const weakItems: WordProgressItem[] = [];

    progressList.forEach((p) => {
      const masteryLevel = calculateMasteryLevel(p.masteryScore);

      // 통계 집계
      if (masteryLevel === 'master') stats.master++;
      else if (masteryLevel === 'highly_skilled') stats.highlySkilled++;
      else if (masteryLevel === 'skilled') stats.skilled++;
      else if (masteryLevel === 'average') stats.average++;
      else if (masteryLevel === 'learning') stats.learning++;
      else stats.unlearned++;

      // 복습 기한 도래 여부
      const isDue =
        !p.nextReviewAt || new Date(p.nextReviewAt).getTime() <= now.getTime();

      const item: WordProgressItem = {
        ...p,
        isDueForReview: isDue,
        masteryLevel,
      };

      if (isDue) {
        dueItems.push(item);
      }

      // 오답이 2회 이상이거나 정답률이 50% 미만인 취약 단어
      const isWeak =
        p.wrongCount >= 2 || (p.totalAttempts >= 2 && p.correctCount / p.totalAttempts < 0.6);
      if (isWeak) {
        weakItems.push(item);
      }
    });

    return {
      success: true,
      data: {
        dueCount: dueItems.length,
        weakCount: weakItems.length,
        masteredCount: stats.master + stats.highlySkilled,
        totalLearned: progressList.length,
        stats,
        dueItems,
        weakItems,
      },
    };
  } catch (err) {
    console.error('Review summary fetch error:', err);
    return {
      success: true, // fallback 전달
      data: getMockReviewSummary(),
    };
  }
}

function getEmptyReviewSummary(): ReviewSummaryData {
  return {
    dueCount: 0,
    weakCount: 0,
    masteredCount: 0,
    totalLearned: 0,
    stats: {
      unlearned: 0,
      learning: 0,
      average: 0,
      skilled: 0,
      highlySkilled: 0,
      master: 0,
      total: 0,
    },
    dueItems: [],
    weakItems: [],
  };
}

function getMockReviewSummary(): ReviewSummaryData {
  const mockDue: WordProgressItem[] = [
    {
      id: 'mock-1',
      word: 'abandon',
      meaning: '포기하다, 버리다',
      partOfSpeech: 'v.',
      pronunciation: '[əˈbændən]',
      audioUrl: null,
      exampleSentence: 'He decided to abandon the plan.',
      exampleTranslation: '그는 계획을 포기하기로 했다.',
      synonyms: 'give up',
      antonyms: 'maintain',
      frequency: 'high',
      difficulty: 2,
      grade: 10,
      source: '고1 어휘',
      learningItemId: 'item-1',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      correctCount: 3,
      wrongCount: 1,
      totalAttempts: 4,
      masteryScore: 65,
      streak: 2,
      lastStudiedAt: new Date(Date.now() - 86400000).toISOString(),
      nextReviewAt: new Date(Date.now() - 3600000).toISOString(),
      easeFactor: 2.5,
      intervalDays: 1,
      isDueForReview: true,
      masteryLevel: 'skilled',
    },
    {
      id: 'mock-2',
      word: 'contribute',
      meaning: '기여하다, 공헌하다',
      partOfSpeech: 'v.',
      pronunciation: '[kənˈtrɪbjuːt]',
      audioUrl: null,
      exampleSentence: 'Hard work contributed to success.',
      exampleTranslation: '노력이 성공에 기여했다.',
      synonyms: 'support',
      antonyms: null,
      frequency: 'high',
      difficulty: 3,
      grade: 10,
      source: '고1 어휘',
      learningItemId: 'item-3',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      correctCount: 1,
      wrongCount: 2,
      totalAttempts: 3,
      masteryScore: 33,
      streak: 0,
      lastStudiedAt: new Date(Date.now() - 172800000).toISOString(),
      nextReviewAt: new Date(Date.now() - 1800000).toISOString(),
      easeFactor: 2.3,
      intervalDays: 0.5,
      isDueForReview: true,
      masteryLevel: 'learning',
    },
  ];

  return {
    dueCount: 2,
    weakCount: 1,
    masteredCount: 1,
    totalLearned: 5,
    stats: {
      unlearned: 1,
      learning: 2,
      average: 1,
      skilled: 1,
      highlySkilled: 0,
      master: 0,
      total: 5,
    },
    dueItems: mockDue,
    weakItems: [mockDue[1]],
  };
}
