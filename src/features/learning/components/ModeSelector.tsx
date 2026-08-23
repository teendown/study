'use client';

import { useState } from 'react';
import { GraduationCap, RotateCcw, Zap, Sparkles } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import type { StudyMode } from '@/types';

interface ModeSelectorProps {
  onStart: (mode: StudyMode | 'speed_shadowing', questionCount: number) => void;
  totalVocabCount: number;
}

const MODES: {
  id: StudyMode | 'speed_shadowing';
  title: string;
  desc: string;
  badge: string;
  icon: React.ReactNode;
  gradient: string;
}[] = [
  {
    id: 'speed_shadowing',
    title: '스피드 섀도잉 (Speed Shadowing)',
    desc: '단어가 스피디하게 넘어가며 원어민 발음으로 바로 따라 읽는 집중 각인 학습!',
    badge: '인기 🔥',
    icon: <Sparkles className="h-6 w-6 text-pink-500" />,
    gradient: 'from-pink-500/15 via-rose-500/5 to-transparent hover:border-pink-500/40',
  },
  {
    id: 'learning',
    title: '기본 학습 모드',
    desc: '시간 제한 없이 객관식, 빈칸, 타이핑 문제를 골고루 학습합니다.',
    badge: '추천',
    icon: <GraduationCap className="h-6 w-6 text-blue-500" />,
    gradient: 'from-blue-500/15 via-indigo-500/5 to-transparent hover:border-blue-500/40',
  },
  {
    id: 'speed',
    title: '스피드 퀴즈 (SPEED QUIZ)',
    desc: '문제당 7~10초 제한! 빠른 순발력과 추가 보너스 XP 획득 도전.',
    badge: '도전',
    icon: <Zap className="h-6 w-6 text-amber-500" />,
    gradient: 'from-amber-500/15 via-orange-500/5 to-transparent hover:border-amber-500/40',
  },
  {
    id: 'review',
    title: '복습 집중 모드',
    desc: '이전에 틀렸거나 복습 시기가 도래한 단어를 집중적으로 복습합니다.',
    badge: '기억 강화',
    icon: <RotateCcw className="h-6 w-6 text-emerald-500" />,
    gradient: 'from-emerald-500/15 via-teal-500/5 to-transparent hover:border-emerald-500/40',
  },
];

export function ModeSelector({ onStart, totalVocabCount }: ModeSelectorProps) {
  const [selectedMode, setSelectedMode] = useState<StudyMode | 'speed_shadowing'>('speed_shadowing');
  const [count, setCount] = useState<number>(10);

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">학습 모드 선택</h2>
        <p className="text-sm text-muted-foreground mt-1">
          현재 등록된 학습 단어: <span className="font-semibold text-primary">{totalVocabCount}개</span>
        </p>
      </div>

      {/* 모드 카드 그리드 */}
      <div className="space-y-3">
        {MODES.map((mode) => {
          const isSelected = selectedMode === mode.id;
          return (
            <Card
              key={mode.id}
              className={`cursor-pointer transition-all duration-200 border-2 bg-gradient-to-br ${mode.gradient} ${
                isSelected
                  ? 'border-primary shadow-md scale-[1.01]'
                  : 'border-border/60 hover:border-border'
              }`}
              onClick={() => setSelectedMode(mode.id)}
            >
              <CardContent className="p-4 sm:p-5 flex items-start gap-4">
                <div className="p-2.5 rounded-xl bg-background/80 shadow-xs shrink-0">
                  {mode.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-bold text-base">{mode.title}</h3>
                    <Badge variant="secondary" className="text-[10px] font-semibold">
                      {mode.badge}
                    </Badge>
                  </div>
                  <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                    {mode.desc}
                  </p>
                </div>
                <div className="shrink-0 flex items-center self-center">
                  <div
                    className={`h-5 w-5 rounded-full border-2 flex items-center justify-center transition-colors ${
                      isSelected ? 'border-primary bg-primary' : 'border-muted-foreground/40'
                    }`}
                  >
                    {isSelected && <div className="h-2 w-2 rounded-full bg-white" />}
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* 문제 개수 선택 */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold">학습 문제 수</CardTitle>
          <CardDescription>한 번에 풀 문제 개수를 선택하세요.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-4 gap-2">
            {[5, 10, 15, 20].map((num) => (
              <Button
                key={num}
                variant={count === num ? 'default' : 'outline'}
                className="font-bold"
                onClick={() => setCount(num)}
              >
                {num}문제
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* 학습 시작 버튼 */}
      <Button
        size="lg"
        className="w-full text-base font-bold gap-2 shadow-md hover:shadow-lg transition-all"
        onClick={() => onStart(selectedMode, count)}
        disabled={totalVocabCount === 0}
      >
        <Sparkles className="h-5 w-5" />
        {totalVocabCount === 0 ? '단어를 먼저 등록해주세요' : '학습 시작하기'}
      </Button>
    </div>
  );
}
