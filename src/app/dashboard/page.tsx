'use client';

import { useState, useEffect, useCallback } from 'react';
import { StreakCard, DailyGoalCard, QuickActions } from '@/components/dashboard';
import {
  getDashboardDataAction,
  RecentAchievementsCard,
  type DashboardData,
} from '@/features/game';
import { Sparkles, ArrowRight, BookOpen, RotateCcw } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

export default function DashboardPage() {
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);

  const loadData = useCallback(async () => {
    try {
      const res = await getDashboardDataAction();
      if (res.success && res.data) {
        setDashboardData(res.data);
      }
    } catch {
      // fallback
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const user = dashboardData?.user;
  const goal = dashboardData?.dailyGoal;
  const rec = dashboardData?.recommendation;

  return (
    <div className="mx-auto max-w-2xl space-y-5">
      {/* 상단 인사말 및 페이지 제목 */}
      <div>
        <h2 className="text-2xl font-bold tracking-tight">
          반가워요, <span className="gradient-text">{user?.name || '다은'}</span> 학생! 👋
        </h2>
        <p className="text-sm text-muted-foreground mt-1">
          오늘도 목표를 향해 한 걸음 나아가볼까요?
        </p>
      </div>

      {/* 1. 스트릭 & 레벨/XP 진행도 카드 */}
      <StreakCard
        streak={user?.streak ?? 8}
        level={user?.level ?? 1}
        currentXp={user?.levelInfo.currentXp ?? 120}
        targetXp={user?.levelInfo.nextLevelXp ?? 200}
      />

      {/* 2. 오늘 맞춤 추천 학습 배너 (설계서 섹션 42) */}
      {(rec?.dueReviewCount ?? 0) > 0 && (
        <Card className="bg-gradient-to-r from-emerald-500/15 via-primary/10 to-transparent border-emerald-500/30">
          <CardContent className="p-4 flex items-center justify-between gap-3">
            <div className="space-y-0.5">
              <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                <Sparkles className="h-3.5 w-3.5" /> 오늘의 추천 학습
              </span>
              <p className="text-sm font-semibold">
                복습 예정 단어 <span className="text-primary font-bold">{rec?.dueReviewCount}개</span>가 기다리고 있어요!
              </p>
            </div>
            <Link href="/review">
              <Button size="sm" className="font-bold gap-1 shadow-xs shrink-0">
                복습하기 <ArrowRight className="h-3.5 w-3.5" />
              </Button>
            </Link>
          </CardContent>
        </Card>
      )}

      {/* 3. 일일 학습 목표 카드 */}
      <DailyGoalCard
        reviewWords={goal?.reviewWords ?? 15}
        reviewWordsTarget={goal?.reviewWordsTarget ?? 20}
        newWords={goal?.newWords ?? 7}
        newWordsTarget={goal?.newWordsTarget ?? 10}
        questions={goal?.questions ?? 22}
        questionsTarget={goal?.questionsTarget ?? 30}
        studyMinutes={goal?.studyMinutes ?? 18}
        studyMinutesTarget={goal?.studyMinutesTarget ?? 30}
      />

      {/* 4. 빠른 시작 그리드 */}
      <QuickActions />

      {/* 5. 최근 달성한 업적 */}
      {dashboardData?.recentAchievements && (
        <RecentAchievementsCard achievements={dashboardData.recentAchievements} />
      )}
    </div>
  );
}
