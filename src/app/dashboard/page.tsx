import type { Metadata } from 'next';
import { StreakCard, DailyGoalCard, QuickActions } from '@/components/dashboard';

export const metadata: Metadata = {
  title: '대시보드 — STUDY QUEST',
  description: '오늘의 학습 현황과 목표를 확인하세요.',
};

/**
 * 학생 대시보드 페이지
 * 설계서 섹션 19 기반
 *
 * Phase 2 이후 실제 데이터 연동 예정
 * 현재는 더미 데이터로 UI를 확인합니다.
 */
export default function DashboardPage() {
  return (
    <div className="mx-auto max-w-2xl space-y-5">
      {/* 페이지 제목 (PC에서만) */}
      <div className="hidden md:block">
        <h2 className="text-2xl font-bold tracking-tight">대시보드</h2>
        <p className="text-sm text-muted-foreground mt-1">
          오늘의 학습 현황을 확인하세요
        </p>
      </div>

      {/* 스트릭 & 레벨 */}
      <StreakCard
        streak={8}
        level={12}
        currentXp={820}
        targetXp={1000}
      />

      {/* 일일 목표 */}
      <DailyGoalCard
        reviewWords={15}
        reviewWordsTarget={20}
        newWords={7}
        newWordsTarget={10}
        questions={22}
        questionsTarget={30}
        studyMinutes={18}
        studyMinutesTarget={30}
      />

      {/* 빠른 시작 */}
      <QuickActions />
    </div>
  );
}
