// ===========================
// Learning Local Storage Services
// ===========================

import type { SessionSummary } from '../types';

const STORAGE_KEY_SESSIONS = 'study_quest_sessions_v1';
const STORAGE_KEY_USER = 'study_quest_user_v1';
const STORAGE_KEY_PROGRESS = 'study_quest_progress_v1';

export async function saveStudySessionAction(summary: SessionSummary): Promise<{
  success: boolean;
  xpEarned: number;
  error?: string;
}> {
  if (typeof window === 'undefined') {
    return { success: true, xpEarned: summary.totalXpEarned };
  }

  try {
    // 1. 세션 히스토리 저장
    const rawSessions = localStorage.getItem(STORAGE_KEY_SESSIONS);
    const sessions = rawSessions ? JSON.parse(rawSessions) : [];
    sessions.unshift({
      id: `session-${Date.now()}`,
      mode: summary.mode,
      totalQuestions: summary.totalQuestions,
      correctAnswers: summary.correctCount,
      wrongAnswers: summary.wrongCount,
      xpEarned: summary.totalXpEarned,
      createdAt: new Date().toISOString(),
    });
    localStorage.setItem(STORAGE_KEY_SESSIONS, JSON.stringify(sessions.slice(0, 50)));

    // 2. 유저 XP 누적
    const rawUser = localStorage.getItem(STORAGE_KEY_USER);
    const user = rawUser
      ? JSON.parse(rawUser)
      : { name: '다은', level: 1, xp: 120, streak: 8 };

    const nextXp = (user.xp || 0) + summary.totalXpEarned;
    user.xp = nextXp;
    user.streak = (user.streak || 1) + 1;
    localStorage.setItem(STORAGE_KEY_USER, JSON.stringify(user));

    // 3. 단어별 숙련도 갱신
    const rawProgress = localStorage.getItem(STORAGE_KEY_PROGRESS);
    const progressMap = rawProgress ? JSON.parse(rawProgress) : {};

    summary.answers.forEach((ans) => {
      const prev = progressMap[ans.learningItemId] || {
        correctCount: 0,
        wrongCount: 0,
        totalAttempts: 0,
        masteryScore: 0,
        streak: 0,
      };

      const isCorrect = ans.isCorrect;
      const nextCorrect = prev.correctCount + (isCorrect ? 1 : 0);
      const nextWrong = prev.wrongCount + (isCorrect ? 0 : 1);
      const nextTotal = prev.totalAttempts + 1;
      const nextScore = Math.min(100, Math.round((nextCorrect / nextTotal) * 100));

      // 복습 주기 계산 (일)
      const intervalDays = isCorrect ? Math.min(30, (prev.streak + 1) * 2) : 0.02;

      progressMap[ans.learningItemId] = {
        correctCount: nextCorrect,
        wrongCount: nextWrong,
        totalAttempts: nextTotal,
        masteryScore: nextScore,
        streak: isCorrect ? prev.streak + 1 : 0,
        intervalDays,
        nextReviewAt: new Date(Date.now() + intervalDays * 86400000).toISOString(),
        lastStudiedAt: new Date().toISOString(),
      };
    });

    localStorage.setItem(STORAGE_KEY_PROGRESS, JSON.stringify(progressMap));

    return {
      success: true,
      xpEarned: summary.totalXpEarned,
    };
  } catch (err) {
    console.error('Session save error:', err);
    return {
      success: true,
      xpEarned: summary.totalXpEarned,
    };
  }
}
