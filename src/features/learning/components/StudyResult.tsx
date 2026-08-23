'use client';

import {
  Trophy,
  RotateCcw,
  Sparkles,
  BookOpen,
  LayoutDashboard,
  Flame,
  Clock,
  CheckCircle2,
  XCircle,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import type { SessionSummary } from '../types';
import Link from 'next/link';

interface StudyResultProps {
  summary: SessionSummary;
  onRetry: () => void;
  onRetryWrongOnly?: () => void;
}

export function StudyResult({
  summary,
  onRetry,
  onRetryWrongOnly,
}: StudyResultProps) {
  const isPerfect = summary.accuracy === 100;
  const isGreat = summary.accuracy >= 80;

  return (
    <div className="max-w-xl mx-auto space-y-5 animate-combo">
      {/* 상단 축하 배너 카드 */}
      <Card
        className={`border-2 text-center overflow-hidden ${
          isGreat
            ? 'bg-gradient-to-b from-primary/20 via-primary/5 to-transparent border-primary/40'
            : 'bg-gradient-to-b from-muted/50 to-transparent'
        }`}
      >
        <CardContent className="p-6 space-y-3">
          <div className="inline-flex p-4 rounded-3xl bg-background shadow-md">
            <Trophy
              className={`h-12 w-12 ${
                isGreat ? 'text-amber-500 fill-amber-500/20' : 'text-muted-foreground'
              }`}
            />
          </div>

          <div>
            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              {isPerfect
                ? '🎉 PERFECT! 완벽해요!'
                : isGreat
                ? '👏 대단해요! 훌륭한 성적!'
                : '💪 수고하셨어요! 복습해봐요!'}
            </h2>
            <p className="text-sm text-muted-foreground mt-1">
              오늘의 학습 목표에 한 걸음 더 다가섰습니다.
            </p>
          </div>

          {/* 획득 XP 뱃지 */}
          <div className="pt-2">
            <Badge className="text-sm font-bold bg-sq-xp text-white px-4 py-1.5 rounded-full shadow-sm gap-1.5">
              <Sparkles className="h-4 w-4" />
              +{summary.totalXpEarned} XP 획득!
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* 핵심 통계 그리드 (4칸) */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
        <Card className="text-center p-3">
          <p className="text-xs text-muted-foreground font-medium">정답률</p>
          <p className="text-xl font-extrabold text-primary mt-1">
            {summary.accuracy}%
          </p>
          <p className="text-[11px] text-muted-foreground">
            {summary.correctCount} / {summary.totalQuestions}
          </p>
        </Card>

        <Card className="text-center p-3">
          <p className="text-xs text-muted-foreground font-medium">최대 콤보</p>
          <p className="text-xl font-extrabold text-orange-500 mt-1 flex items-center justify-center gap-0.5">
            <Flame className="h-4 w-4 fill-orange-500" />
            {summary.maxCombo}
          </p>
          <p className="text-[11px] text-muted-foreground">연속 정답</p>
        </Card>

        <Card className="text-center p-3">
          <p className="text-xs text-muted-foreground font-medium">소요 시간</p>
          <p className="text-xl font-extrabold text-foreground mt-1 flex items-center justify-center gap-0.5">
            <Clock className="h-4 w-4 text-muted-foreground" />
            {summary.totalTimeSeconds}초
          </p>
          <p className="text-[11px] text-muted-foreground">집중 학습</p>
        </Card>

        <Card className="text-center p-3">
          <p className="text-xs text-muted-foreground font-medium">학습 모드</p>
          <p className="text-xl font-extrabold text-foreground mt-1 uppercase text-sm leading-7">
            {summary.mode}
          </p>
          <p className="text-[11px] text-muted-foreground">영어 단어</p>
        </Card>
      </div>

      {/* 오답 단어 목록 (틀린 문제가 있을 때) */}
      {summary.wrongItems.length > 0 && (
        <Card className="border-destructive/30 bg-destructive/5">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-bold flex items-center gap-2 text-destructive">
              <XCircle className="h-5 w-5" />
              다시 확인해볼 단어 ({summary.wrongItems.length}개)
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {summary.wrongItems.map((vocab) => (
              <div
                key={vocab.id}
                className="flex items-center justify-between p-2.5 rounded-lg bg-background border border-border/80 text-sm"
              >
                <div>
                  <span className="font-bold text-foreground mr-2">{vocab.word}</span>
                  {vocab.partOfSpeech && (
                    <span className="text-xs text-muted-foreground mr-2 font-medium">
                      {vocab.partOfSpeech}
                    </span>
                  )}
                  <span className="text-muted-foreground">{vocab.meaning}</span>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* 하단 액션 버튼 */}
      <div className="space-y-2 pt-2">
        {summary.wrongItems.length > 0 && onRetryWrongOnly && (
          <Button
            variant="default"
            size="lg"
            className="w-full font-bold gap-2 bg-gradient-to-r from-orange-500 to-amber-600 hover:from-orange-600 hover:to-amber-700 text-white shadow-md"
            onClick={onRetryWrongOnly}
          >
            <RotateCcw className="h-5 w-5" />
            틀린 단어만 다시 풀기 ({summary.wrongItems.length}개)
          </Button>
        )}

        <Button
          variant="outline"
          size="lg"
          className="w-full font-bold gap-2"
          onClick={onRetry}
        >
          <RotateCcw className="h-5 w-5" />
          처음부터 다시 학습하기
        </Button>

        <div className="grid grid-cols-2 gap-2 pt-1">
          <Link href="/vocabulary" className="w-full">
            <Button variant="secondary" className="w-full gap-1.5 font-semibold">
              <BookOpen className="h-4 w-4" />
              단어장 가기
            </Button>
          </Link>
          <Link href="/dashboard" className="w-full">
            <Button variant="secondary" className="w-full gap-1.5 font-semibold">
              <LayoutDashboard className="h-4 w-4" />
              대시보드
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
