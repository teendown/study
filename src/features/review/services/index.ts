// ===========================
// Review Local Storage Services
// ===========================

import type { ReviewSummaryData, WordProgressItem } from '../types';
import type { VocabularyWithItem } from '@/features/vocabulary/types';
import { calculateMasteryLevel } from '../algorithm/spacedRepetition';
import { getVocabulariesAction } from '@/features/vocabulary/services';

const STORAGE_KEY_PROGRESS = 'study_quest_progress_v1';

export async function getReviewSummaryAction(): Promise<{
  success: boolean;
  data: ReviewSummaryData;
  error?: string;
}> {
  const vocabRes = await getVocabulariesAction();
  const vocabs = vocabRes.success && vocabRes.data ? vocabRes.data.items : [];

  let progressMap: Record<string, any> = {};
  if (typeof window !== 'undefined') {
    try {
      const raw = localStorage.getItem(STORAGE_KEY_PROGRESS);
      if (raw) progressMap = JSON.parse(raw);
    } catch {}
  }

  const now = Date.now();
  const stats = {
    unlearned: 0,
    learning: 0,
    average: 0,
    skilled: 0,
    highlySkilled: 0,
    master: 0,
    total: vocabs.length,
  };

  const dueItems: WordProgressItem[] = [];
  const weakItems: WordProgressItem[] = [];

  vocabs.forEach((v: VocabularyWithItem) => {
    const p = progressMap[v.learningItemId] || {
      correctCount: 0,
      wrongCount: 0,
      totalAttempts: 0,
      masteryScore: 0,
      streak: 0,
      nextReviewAt: null,
      intervalDays: 0,
    };

    const masteryLevel = calculateMasteryLevel(p.masteryScore || 0);

    if (masteryLevel === 'master') stats.master++;
    else if (masteryLevel === 'highly_skilled') stats.highlySkilled++;
    else if (masteryLevel === 'skilled') stats.skilled++;
    else if (masteryLevel === 'average') stats.average++;
    else if (masteryLevel === 'learning') stats.learning++;
    else stats.unlearned++;

    const isDue =
      !p.nextReviewAt || new Date(p.nextReviewAt).getTime() <= now;

    const item: WordProgressItem = {
      ...v,
      progressId: `prog-${v.id}`,
      correctCount: p.correctCount,
      wrongCount: p.wrongCount,
      totalAttempts: p.totalAttempts,
      masteryScore: p.masteryScore,
      streak: p.streak,
      lastStudiedAt: p.lastStudiedAt || null,
      nextReviewAt: p.nextReviewAt || null,
      easeFactor: 2.5,
      intervalDays: p.intervalDays || 1,
      isDueForReview: isDue,
      masteryLevel,
    };

    if (isDue) dueItems.push(item);
    if (p.wrongCount >= 2 || (p.totalAttempts >= 2 && p.correctCount / p.totalAttempts < 0.6)) {
      weakItems.push(item);
    }
  });

  return {
    success: true,
    data: {
      dueCount: dueItems.length,
      weakCount: weakItems.length,
      masteredCount: stats.master + stats.highlySkilled,
      totalLearned: vocabs.length,
      stats,
      dueItems,
      weakItems,
    },
  };
}
