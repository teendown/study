'use client';

import { Flame } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';

interface StreakCardProps {
  streak: number;
  level: number;
  currentXp: number;
  targetXp: number;
}

/**
 * 연속 학습 & 레벨/XP 카드
 * 대시보드 상단에 표시
 */
export function StreakCard({
  streak = 0,
  level = 1,
  currentXp = 0,
  targetXp = 100,
}: StreakCardProps) {
  const xpPercent = Math.min((currentXp / targetXp) * 100, 100);

  return (
    <Card className="card-hover border-0 bg-gradient-to-br from-primary/10 via-primary/5 to-transparent">
      <CardContent className="p-5">
        <div className="flex items-center justify-between mb-4">
          {/* 스트릭 */}
          <div className="flex items-center gap-2">
            <span className={streak > 0 ? 'animate-flame' : ''}>
              <Flame
                className={`h-6 w-6 ${
                  streak > 0 ? 'text-sq-streak fill-sq-streak/30' : 'text-muted-foreground'
                }`}
              />
            </span>
            <div>
              <span className="text-2xl font-bold tabular-nums">{streak}</span>
              <span className="text-sm text-muted-foreground ml-1">일 연속</span>
            </div>
          </div>

          {/* 레벨 */}
          <div className="flex items-center gap-1.5 rounded-full bg-primary/10 px-3.5 py-1.5">
            <span className="text-xs font-semibold text-primary">Lv.</span>
            <span className="text-lg font-bold text-primary tabular-nums">{level}</span>
          </div>
        </div>

        {/* XP 프로그레스 */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-xs">
            <span className="font-semibold text-sq-xp">XP</span>
            <span className="text-muted-foreground tabular-nums">
              {currentXp.toLocaleString()} / {targetXp.toLocaleString()}
            </span>
          </div>
          <div className="relative">
            <Progress value={xpPercent} className="h-2.5 xp-glow" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
