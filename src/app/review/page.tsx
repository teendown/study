'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  ReviewDashboard,
  ReviewList,
  getReviewSummaryAction,
  type ReviewSummaryData,
} from '@/features/review';
import {
  StudySession,
  StudyResult,
  generateQuestions,
  saveStudySessionAction,
  type GeneratedQuestion,
  type SessionSummary,
} from '@/features/learning';
import { Loader2 } from 'lucide-react';

export default function ReviewPage() {
  const [summaryData, setSummaryData] = useState<ReviewSummaryData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // 세션 상태: 'dashboard' | 'studying' | 'result'
  const [viewState, setViewState] = useState<'dashboard' | 'studying' | 'result'>('dashboard');
  const [activeQuestions, setActiveQuestions] = useState<GeneratedQuestion[]>([]);
  const [sessionSummary, setSessionSummary] = useState<SessionSummary | null>(null);

  // 복습 데이터 로드
  const loadReviewData = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await getReviewSummaryAction();
      if (res.success && res.data) {
        setSummaryData(res.data);
      }
    } catch {
      // fallback
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadReviewData();
  }, [loadReviewData]);

  // 복습 세션 시작
  const handleStartReview = () => {
    if (!summaryData) return;

    // 복습 대상 우선, 없으면 취약 단어로 생성
    const targetItems =
      summaryData.dueItems.length > 0
        ? summaryData.dueItems
        : summaryData.weakItems;

    if (targetItems.length === 0) {
      alert('복습할 단어가 없습니다.');
      return;
    }

    const questions = generateQuestions(targetItems, 'review', targetItems.length);
    setActiveQuestions(questions);
    setViewState('studying');
  };

  // 복습 완료
  const handleFinishReview = async (summary: SessionSummary) => {
    setSessionSummary(summary);
    setViewState('result');

    try {
      await saveStudySessionAction(summary);
    } catch {
      // offline fallback
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      {/* 타이틀 */}
      {viewState === 'dashboard' && (
        <div>
          <h2 className="text-2xl font-bold tracking-tight">복습</h2>
          <p className="text-sm text-muted-foreground mt-1">
            간격 반복 알고리즘으로 장기 기억을 완성하세요
          </p>
        </div>
      )}

      {/* 1. 복습 대시보드 뷰 */}
      {viewState === 'dashboard' && summaryData && (
        <div className="space-y-6">
          <ReviewDashboard
            summary={summaryData}
            onStartReview={handleStartReview}
          />
          <ReviewList
            dueItems={summaryData.dueItems}
            weakItems={summaryData.weakItems}
          />
        </div>
      )}

      {/* 2. 복습 문제 풀이 뷰 */}
      {viewState === 'studying' && activeQuestions.length > 0 && (
        <StudySession
          questions={activeQuestions}
          mode="review"
          onFinish={handleFinishReview}
          onExit={() => {
            setViewState('dashboard');
            loadReviewData();
          }}
        />
      )}

      {/* 3. 복습 결과 뷰 */}
      {viewState === 'result' && sessionSummary && (
        <StudyResult
          summary={sessionSummary}
          onRetry={() => {
            setViewState('dashboard');
            loadReviewData();
          }}
        />
      )}
    </div>
  );
}
