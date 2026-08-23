'use client';

import {
  Award,
  Sparkles,
  Flame,
  Clock,
  BookOpen,
  CheckCircle2,
  AlertTriangle,
  HeartHandshake,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type { ParentWeeklyReport } from '../types';

interface ParentReportCardProps {
  report: ParentWeeklyReport;
}

export function ParentReportCard({ report }: ParentReportCardProps) {
  return (
    <div className="space-y-4">
      {/* 상단 주간 성취 배너 */}
      <Card className="border-2 border-primary/40 bg-gradient-to-r from-primary/15 via-indigo-500/10 to-transparent">
        <CardContent className="p-5 space-y-3">
          <div className="flex items-center justify-between">
            <Badge className="bg-primary text-white font-bold text-xs gap-1">
              <Sparkles className="h-3.5 w-3.5" />
              학부모 주간 리포트
            </Badge>
            <span className="text-xs text-muted-foreground font-semibold">
              {report.weekLabel}
            </span>
          </div>

          <div>
            <h3 className="text-xl font-bold text-foreground">
              {report.studentName} 학생의 이번 주 학습 성취도: <span className="text-primary">{report.targetCompletionRate}% 달성</span>
            </h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              총 {Math.round(report.totalStudyMinutes / 60)}시간 {report.totalStudyMinutes % 60}분 동안 {report.totalWordsLearned}개 단어를 집중 학습했습니다.
            </p>
          </div>

          {/* 핵심 지표 4칸 요약 */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
            <div className="p-2.5 rounded-xl bg-background/80 text-center border">
              <span className="text-[11px] text-muted-foreground font-medium">연속 출석</span>
              <p className="text-lg font-black text-orange-500 flex items-center justify-center gap-0.5 mt-0.5">
                <Flame className="h-4 w-4 fill-orange-500" />
                {report.streakDays}일
              </p>
            </div>
            <div className="p-2.5 rounded-xl bg-background/80 text-center border">
              <span className="text-[11px] text-muted-foreground font-medium">평균 정답률</span>
              <p className="text-lg font-black text-emerald-600 mt-0.5">
                {report.averageAccuracy}%
              </p>
            </div>
            <div className="p-2.5 rounded-xl bg-background/80 text-center border">
              <span className="text-[11px] text-muted-foreground font-medium">학습 단어</span>
              <p className="text-lg font-black text-primary mt-0.5">
                {report.totalWordsLearned}개
              </p>
            </div>
            <div className="p-2.5 rounded-xl bg-background/80 text-center border">
              <span className="text-[11px] text-muted-foreground font-medium">총 풀이 문제</span>
              <p className="text-lg font-black text-foreground mt-0.5">
                {report.totalQuestionsAnswered}제
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* AI 맞춤 지도 조언 및 칭찬 코멘트 */}
      <Card className="border-amber-500/30 bg-amber-500/5">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-bold flex items-center gap-2 text-amber-700 dark:text-amber-400">
            <HeartHandshake className="h-4 w-4" />
            AI 학습 코칭 & 칭찬 한마디
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-xs sm:text-sm text-foreground/90 leading-relaxed">
            &ldquo;{report.aiCoachingComment}&rdquo;
          </p>
        </CardContent>
      </Card>

      {/* 이번 주 취약 단어 요약 */}
      {report.topWeakWords.length > 0 && (
        <Card className="border-border">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-bold flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-orange-500" />
              가정에서 함께 격려해줄 단어
            </CardTitle>
            <CardDescription className="text-xs">
              반복 오답이 있었던 단어들로, 주말에 한 번 더 칭찬과 함께 확인해 주시면 좋습니다.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-1.5">
            {report.topWeakWords.map((item, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between p-2 rounded-lg bg-muted/40 text-xs"
              >
                <div>
                  <span className="font-bold mr-2">{item.word}</span>
                  <span className="text-muted-foreground">{item.meaning}</span>
                </div>
                <Badge variant="secondary" className="text-[10px] text-orange-600">
                  {item.wrongCount}회 오답
                </Badge>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
