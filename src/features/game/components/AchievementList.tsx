'use client';

import { Trophy, Lock, CheckCircle2, Sparkles } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import type { AchievementItem } from '../types';

interface AchievementListProps {
  achievements: AchievementItem[];
}

export function AchievementList({ achievements }: AchievementListProps) {
  const unlockedCount = achievements.filter((a) => a.isUnlocked).length;
  const totalCount = achievements.length;
  const progressPercent = totalCount > 0 ? Math.round((unlockedCount / totalCount) * 100) : 0;

  return (
    <div className="space-y-5 max-w-2xl mx-auto">
      {/* 상단 요약 카드 */}
      <Card className="bg-gradient-to-r from-amber-500/15 via-primary/10 to-transparent border-amber-500/30">
        <CardContent className="p-5 flex items-center justify-between gap-4">
          <div className="space-y-1">
            <h3 className="font-bold text-lg flex items-center gap-2">
              <Trophy className="h-5 w-5 text-amber-500 fill-amber-500/20" />
              업적 도감 ({unlockedCount}/{totalCount})
            </h3>
            <p className="text-xs text-muted-foreground">
              문제를 풀고 목표를 달성하여 보너스 XP를 획득하세요!
            </p>
          </div>
          <div className="text-right shrink-0">
            <span className="text-2xl font-black text-amber-500">{progressPercent}%</span>
            <p className="text-[10px] text-muted-foreground">달성률</p>
          </div>
        </CardContent>
      </Card>

      {/* 전체 업적 그리드 */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {achievements.map((ach) => {
          const isDone = ach.isUnlocked;
          const currentVal = Math.min(ach.progressValue, ach.conditionValue);
          const itemPercent = Math.min(100, Math.round((currentVal / ach.conditionValue) * 100));

          return (
            <Card
              key={ach.id}
              className={`transition-all border-2 ${
                isDone
                  ? 'border-amber-500/40 bg-amber-500/5 shadow-xs'
                  : 'opacity-70 border-border/60 bg-muted/20'
              }`}
            >
              <CardContent className="p-4 flex items-start gap-3.5">
                <div
                  className={`text-2xl p-2.5 rounded-2xl shrink-0 flex items-center justify-center ${
                    isDone ? 'bg-background shadow-xs' : 'bg-muted filter grayscale'
                  }`}
                >
                  {isDone ? ach.icon || '🏆' : <Lock className="h-5 w-5 text-muted-foreground" />}
                </div>

                <div className="flex-1 min-w-0 space-y-1.5">
                  <div className="flex items-center justify-between gap-1">
                    <h4 className="font-bold text-sm truncate">{ach.name}</h4>
                    <Badge
                      variant={isDone ? 'default' : 'secondary'}
                      className={`text-[10px] shrink-0 font-semibold ${
                        isDone ? 'bg-amber-500 hover:bg-amber-600' : ''
                      }`}
                    >
                      +{ach.xpReward} XP
                    </Badge>
                  </div>

                  <p className="text-xs text-muted-foreground line-clamp-2">
                    {ach.description}
                  </p>

                  {/* 진행도 바 (미달성 시) */}
                  {!isDone && (
                    <div className="pt-1 space-y-1">
                      <div className="flex justify-between text-[10px] text-muted-foreground font-semibold">
                        <span>진행률</span>
                        <span>
                          {currentVal} / {ach.conditionValue}
                        </span>
                      </div>
                      <Progress value={itemPercent} className="h-1.5" />
                    </div>
                  )}

                  {isDone && (
                    <div className="flex items-center gap-1 text-[11px] text-amber-600 font-semibold pt-1">
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      달성 완료
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
