'use client';

import {
  RotateCcw,
  AlertTriangle,
  Award,
  Sparkles,
  Flame,
  BookOpen,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import type { ReviewSummaryData } from '../types';

interface ReviewDashboardProps {
  summary: ReviewSummaryData;
  onStartReview: () => void;
}

const MASTERY_LEVELS_CONFIG = [
  { key: 'unlearned', label: '미학습', color: 'bg-muted-foreground/30', barColor: 'bg-slate-400' },
  { key: 'learning', label: '학습중', color: 'bg-amber-500/20 text-amber-600', barColor: 'bg-amber-500' },
  { key: 'average', label: '보통', color: 'bg-blue-500/20 text-blue-600', barColor: 'bg-blue-500' },
  { key: 'skilled', label: '숙련', color: 'bg-emerald-500/20 text-emerald-600', barColor: 'bg-emerald-500' },
  { key: 'highlySkilled', label: '매우 숙련', color: 'bg-purple-500/20 text-purple-600', barColor: 'bg-purple-500' },
  { key: 'master', label: '마스터', color: 'bg-pink-500/20 text-pink-600', barColor: 'bg-pink-500' },
] as const;

export function ReviewDashboard({
  summary,
  onStartReview,
}: ReviewDashboardProps) {
  const total = summary.stats.total || 1;

  return (
    <div className="space-y-5">
      {/* 3가지 주요 요약 카드 */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {/* 오늘 복습 예정 */}
        <Card className="border-2 border-emerald-500/30 bg-emerald-500/5">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground font-semibold">오늘 복습 예정</p>
              <p className="text-2xl font-black text-emerald-600 mt-1">
                {summary.dueCount}개
              </p>
            </div>
            <div className="p-3 rounded-2xl bg-emerald-500/15 text-emerald-600">
              <RotateCcw className="h-6 w-6" />
            </div>
          </CardContent>
        </Card>

        {/* 취약/오답 단어 */}
        <Card className="border-2 border-amber-500/30 bg-amber-500/5">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground font-semibold">취약 단어 (집중 필요)</p>
              <p className="text-2xl font-black text-amber-600 mt-1">
                {summary.weakCount}개
              </p>
            </div>
            <div className="p-3 rounded-2xl bg-amber-500/15 text-amber-600">
              <AlertTriangle className="h-6 w-6" />
            </div>
          </CardContent>
        </Card>

        {/* 마스터 완료 */}
        <Card className="border-2 border-purple-500/30 bg-purple-500/5">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground font-semibold">숙련 & 마스터</p>
              <p className="text-2xl font-black text-purple-600 mt-1">
                {summary.masteredCount}개
              </p>
            </div>
            <div className="p-3 rounded-2xl bg-purple-500/15 text-purple-600">
              <Award className="h-6 w-6" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 원클릭 복습 시작 배너 */}
      <Card className="bg-gradient-to-r from-primary/15 via-primary/5 to-transparent border-primary/30">
        <CardContent className="p-5 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="space-y-1 text-center sm:text-left">
            <h3 className="font-bold text-base flex items-center justify-center sm:justify-start gap-1.5">
              <Sparkles className="h-4 w-4 text-primary" />
              에빙하우스 최적 복습 타이밍
            </h3>
            <p className="text-xs sm:text-sm text-muted-foreground">
              {summary.dueCount > 0
                ? `오늘 기억을 장기 기억으로 전환할 단어가 ${summary.dueCount}개 있습니다!`
                : '현재 복습 시기가 도래한 단어가 모두 학습되었습니다.'}
            </p>
          </div>
          <Button
            size="lg"
            className="w-full sm:w-auto font-bold gap-2 shadow-sm shrink-0"
            disabled={summary.dueCount === 0 && summary.weakCount === 0}
            onClick={onStartReview}
          >
            <Flame className="h-4 w-4" />
            {summary.dueCount > 0 ? '오늘의 복습 시작' : '취약 단어 복습'}
          </Button>
        </CardContent>
      </Card>

      {/* 숙련도 등급별 분포 현황 */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold flex items-center justify-between">
            <span>단어 숙련도 현황</span>
            <span className="text-xs text-muted-foreground font-normal">
              총 {summary.totalLearned}개 단어 학습 중
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* 복합 프로그레스 바 */}
          <div className="h-3 w-full bg-muted rounded-full overflow-hidden flex">
            {MASTERY_LEVELS_CONFIG.map((lvl) => {
              const count = summary.stats[lvl.key as keyof typeof summary.stats] || 0;
              const pct = (count / total) * 100;
              if (pct === 0) return null;
              return (
                <div
                  key={lvl.key}
                  style={{ width: `${pct}%` }}
                  className={`h-full ${lvl.barColor} transition-all duration-300`}
                  title={`${lvl.label}: ${count}개 (${Math.round(pct)}%)`}
                />
              );
            })}
          </div>

          {/* 범례 및 수치 그리드 */}
          <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 pt-1 text-center">
            {MASTERY_LEVELS_CONFIG.map((lvl) => {
              const count = summary.stats[lvl.key as keyof typeof summary.stats] || 0;
              return (
                <div key={lvl.key} className="p-2 rounded-xl bg-muted/40 space-y-0.5">
                  <span className="text-[11px] font-medium text-muted-foreground block truncate">
                    {lvl.label}
                  </span>
                  <span className="text-base font-extrabold text-foreground">
                    {count}
                  </span>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
