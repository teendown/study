import type { Metadata } from 'next';
import { GraduationCap } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export const metadata: Metadata = {
  title: '학습 — STUDY QUEST',
  description: '오늘의 학습을 시작하세요.',
};

/**
 * 학습 페이지 (Placeholder)
 * Phase 4에서 본격 구현 예정
 */
export default function StudyPage() {
  return (
    <div className="mx-auto max-w-2xl space-y-5">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">학습</h2>
        <p className="text-sm text-muted-foreground mt-1">
          AI가 추천하는 오늘의 학습을 시작하세요
        </p>
      </div>

      <Card className="border-dashed">
        <CardContent className="flex flex-col items-center justify-center py-16 text-center">
          <div className="mb-4 rounded-2xl bg-primary/10 p-4">
            <GraduationCap className="h-10 w-10 text-primary" />
          </div>
          <h3 className="text-lg font-semibold mb-2">학습 기능 준비 중</h3>
          <p className="text-sm text-muted-foreground mb-6 max-w-sm">
            단어를 등록하면 객관식, 빈칸, 번역 등 다양한 문제로
            학습할 수 있습니다.
          </p>
          <Button variant="outline" disabled>
            곧 만나요! 🚀
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
