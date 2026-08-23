'use client';

import { Trophy, ArrowRight } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type { AchievementItem } from '../types';
import Link from 'next/link';

interface RecentAchievementsCardProps {
  achievements: AchievementItem[];
}

export function RecentAchievementsCard({ achievements }: RecentAchievementsCardProps) {
  if (!achievements || achievements.length === 0) return null;

  return (
    <Card className="card-hover">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <Trophy className="h-4 w-4 text-amber-500" />
            최근 달성한 업적
          </CardTitle>
          <span className="text-xs text-muted-foreground">
            총 {achievements.length}개 달성
          </span>
        </div>
      </CardHeader>
      <CardContent className="space-y-2.5">
        {achievements.map((ach) => (
          <div
            key={ach.id}
            className="flex items-center justify-between p-3 rounded-xl bg-muted/40 border border-border/50 text-sm"
          >
            <div className="flex items-center gap-3">
              <span className="text-xl p-1.5 rounded-lg bg-background shadow-xs">
                {ach.icon || '🏆'}
              </span>
              <div>
                <p className="font-bold text-foreground">{ach.name}</p>
                <p className="text-xs text-muted-foreground">{ach.description}</p>
              </div>
            </div>
            <Badge variant="secondary" className="text-xs font-bold text-amber-600 shrink-0">
              +{ach.xpReward} XP
            </Badge>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
