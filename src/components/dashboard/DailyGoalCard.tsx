'use client';

import { Target, BookOpen, HelpCircle, Clock } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';

interface GoalItem {
  label: string;
  current: number;
  target: number;
  icon: React.ReactNode;
  color: string;
}

interface DailyGoalCardProps {
  reviewWords: number;
  reviewWordsTarget: number;
  newWords: number;
  newWordsTarget: number;
  questions: number;
  questionsTarget: number;
  studyMinutes: number;
  studyMinutesTarget: number;
}

/**
 * 일일 목표 진행 카드
 * 설계서 섹션 18 기반
 */
export function DailyGoalCard({
  reviewWords = 0,
  reviewWordsTarget = 20,
  newWords = 0,
  newWordsTarget = 10,
  questions = 0,
  questionsTarget = 30,
  studyMinutes = 0,
  studyMinutesTarget = 30,
}: DailyGoalCardProps) {
  const goals: GoalItem[] = [
    {
      label: '복습 단어',
      current: reviewWords,
      target: reviewWordsTarget,
      icon: <BookOpen className="h-4 w-4" />,
      color: 'text-blue-500',
    },
    {
      label: '신규 단어',
      current: newWords,
      target: newWordsTarget,
      icon: <Target className="h-4 w-4" />,
      color: 'text-emerald-500',
    },
    {
      label: '문제 풀기',
      current: questions,
      target: questionsTarget,
      icon: <HelpCircle className="h-4 w-4" />,
      color: 'text-amber-500',
    },
    {
      label: '학습 시간',
      current: studyMinutes,
      target: studyMinutesTarget,
      icon: <Clock className="h-4 w-4" />,
      color: 'text-purple-500',
    },
  ];

  const totalProgress =
    goals.reduce((sum, g) => sum + Math.min(g.current / g.target, 1), 0) / goals.length;
  const isComplete = totalProgress >= 1;

  return (
    <Card className="card-hover">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base font-semibold">오늘의 목표</CardTitle>
          {isComplete ? (
            <span className="text-xs font-bold text-sq-success bg-sq-success/10 px-2.5 py-1 rounded-full animate-combo">
              🎉 완료!
            </span>
          ) : (
            <span className="text-xs text-muted-foreground tabular-nums">
              {Math.round(totalProgress * 100)}%
            </span>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {goals.map((goal) => {
          const percent = Math.min((goal.current / goal.target) * 100, 100);
          const isDone = goal.current >= goal.target;

          return (
            <div key={goal.label} className="space-y-1.5">
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <span className={goal.color}>{goal.icon}</span>
                  <span className="font-medium">{goal.label}</span>
                </div>
                <span
                  className={`tabular-nums text-xs font-semibold ${
                    isDone ? 'text-sq-success' : 'text-muted-foreground'
                  }`}
                >
                  {goal.current} / {goal.target}
                  {goal.label === '학습 시간' ? '분' : ''}
                </span>
              </div>
              <Progress value={percent} className="h-2" />
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
