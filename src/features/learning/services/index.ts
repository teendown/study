// ===========================
// Learning Server Actions
// ===========================
// 설계서 섹션 7.7, 7.8, 7.9, 16, 58 기반

'use server';

import { eq, sql } from 'drizzle-orm';
import { getDb, schema } from '@/lib/db/client';
import type { SessionSummary } from '../types';

/**
 * 학습 세션 결과 저장
 */
export async function saveStudySessionAction(summary: SessionSummary): Promise<{
  success: boolean;
  xpEarned: number;
  error?: string;
}> {
  try {
    const db = getDb();

    // 1. 영어 과목 ID 조회
    const [subject] = await db
      .select({ id: schema.subjects.id })
      .from(schema.subjects)
      .where(eq(schema.subjects.code, 'ENGLISH'))
      .limit(1);

    const subjectId = subject?.id;
    if (!subjectId) {
      return { success: true, xpEarned: summary.totalXpEarned };
    }

    // 2. 임시 학생 계정 확보 (없으면 생성)
    let [user] = await db
      .select({ id: schema.users.id, xp: schema.users.xp, level: schema.users.level })
      .from(schema.users)
      .limit(1);

    if (!user) {
      const newUserId = crypto.randomUUID();
      await db.insert(schema.users).values({
        id: newUserId,
        name: '다은 학생',
        email: 'student@studyquest.local',
        role: 'student',
        level: 1,
        xp: 0,
        streak: 1,
      });
      user = { id: newUserId, xp: 0, level: 1 };
    }

    // 3. study_sessions 테이블에 세션 저장
    const sessionId = crypto.randomUUID();
    await db.insert(schema.studySessions).values({
      id: sessionId,
      userId: user.id,
      subjectId,
      mode: summary.mode,
      totalQuestions: summary.totalQuestions,
      correctAnswers: summary.correctCount,
      wrongAnswers: summary.wrongCount,
      xpEarned: summary.totalXpEarned,
      startedAt: new Date(Date.now() - summary.totalTimeSeconds * 1000).toISOString(),
      endedAt: new Date().toISOString(),
    });

    // 4. 개별 답변 기록 저장 (study_answers)
    for (const ans of summary.answers) {
      await db.insert(schema.studyAnswers).values({
        id: crypto.randomUUID(),
        sessionId,
        userId: user.id,
        questionId: ans.questionId,
        learningItemId: ans.learningItemId,
        isCorrect: ans.isCorrect,
        answer: ans.userAnswer,
        responseTimeMs: ans.responseTimeMs,
      });

      // 5. user_progress 테이블에 단어 숙련도 갱신
      const [existingProgress] = await db
        .select()
        .from(schema.userProgress)
        .where(
          eq(schema.userProgress.userId, user.id) &&
          eq(schema.userProgress.learningItemId, ans.learningItemId)
        )
        .limit(1);

      if (existingProgress) {
        const nextCorrect = existingProgress.correctCount + (ans.isCorrect ? 1 : 0);
        const nextWrong = existingProgress.wrongCount + (ans.isCorrect ? 0 : 1);
        const nextTotal = existingProgress.totalAttempts + 1;
        const nextMastery = Math.min(100, Math.round((nextCorrect / nextTotal) * 100));

        await db
          .update(schema.userProgress)
          .set({
            correctCount: nextCorrect,
            wrongCount: nextWrong,
            totalAttempts: nextTotal,
            masteryScore: nextMastery,
            lastStudiedAt: new Date().toISOString(),
            updatedAt: sql`(datetime('now'))`,
          })
          .where(eq(schema.userProgress.id, existingProgress.id));
      } else {
        await db.insert(schema.userProgress).values({
          id: crypto.randomUUID(),
          userId: user.id,
          learningItemId: ans.learningItemId,
          correctCount: ans.isCorrect ? 1 : 0,
          wrongCount: ans.isCorrect ? 0 : 1,
          totalAttempts: 1,
          masteryScore: ans.isCorrect ? 25 : 0,
          lastStudiedAt: new Date().toISOString(),
        });
      }
    }

    // 6. 유저 XP 및 레벨 업데이트
    const nextXp = user.xp + summary.totalXpEarned;
    const nextLevel = Math.floor(nextXp / 100) + 1;

    await db
      .update(schema.users)
      .set({
        xp: nextXp,
        level: nextLevel,
        updatedAt: sql`(datetime('now'))`,
      })
      .where(eq(schema.users.id, user.id));

    return {
      success: true,
      xpEarned: summary.totalXpEarned,
    };
  } catch (err) {
    console.error('Session save error:', err);
    return {
      success: false,
      xpEarned: summary.totalXpEarned,
      error: err instanceof Error ? err.message : '학습 세션 저장 실패',
    };
  }
}
