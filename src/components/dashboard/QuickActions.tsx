'use client';

import Link from 'next/link';
import {
  GraduationCap,
  RotateCcw,
  BookOpen,
  Zap,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface QuickAction {
  label: string;
  description: string;
  href: string;
  icon: React.ReactNode;
  gradient: string;
}

const actions: QuickAction[] = [
  {
    label: '학습 시작',
    description: '오늘의 추천 학습',
    href: '/study',
    icon: <GraduationCap className="h-6 w-6" />,
    gradient: 'from-blue-500/20 to-indigo-500/20',
  },
  {
    label: '복습',
    description: '복습 예정 단어',
    href: '/review',
    icon: <RotateCcw className="h-6 w-6" />,
    gradient: 'from-emerald-500/20 to-teal-500/20',
  },
  {
    label: '단어장',
    description: '내 단어 관리',
    href: '/vocabulary',
    icon: <BookOpen className="h-6 w-6" />,
    gradient: 'from-amber-500/20 to-orange-500/20',
  },
  {
    label: '스피드 모드',
    description: '빠른 학습 도전',
    href: '/study?mode=speed',
    icon: <Zap className="h-6 w-6" />,
    gradient: 'from-purple-500/20 to-pink-500/20',
  },
];

/**
 * 빠른 액션 그리드
 * 대시보드에서 주요 기능으로 바로 이동
 */
export function QuickActions() {
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base font-semibold">빠른 시작</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-3">
          {actions.map((action) => (
            <Link
              key={action.label}
              href={action.href}
              className={`group flex flex-col items-center gap-2 rounded-xl border border-border/50 bg-gradient-to-br ${action.gradient} p-4 transition-all duration-200 hover:scale-[1.02] hover:shadow-md active:scale-[0.98]`}
            >
              <div className="text-foreground/80 group-hover:text-primary transition-colors duration-200">
                {action.icon}
              </div>
              <div className="text-center">
                <p className="text-sm font-semibold">{action.label}</p>
                <p className="text-[11px] text-muted-foreground">
                  {action.description}
                </p>
              </div>
            </Link>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
