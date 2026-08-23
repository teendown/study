import type { Metadata } from 'next';
import { RotateCcw } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export const metadata: Metadata = {
  title: '복습 — STUDY QUEST',
  description: '복습 예정 단어를 학습하세요.',
};

/**
 * 복습 페이지 (Placeholder)
 * Phase 5에서 본격 구현 예정
 */
export default function ReviewPage() {
  return (
    <div className="mx-auto max-w-2xl space-y-5">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">복습</h2>
        <p className="text-sm text-muted-foreground mt-1">
          잊어버리기 전에 복습하세요
        </p>
      </div>

      <Card className="border-dashed">
        <CardContent className="flex flex-col items-center justify-center py-16 text-center">
          <div className="mb-4 rounded-2xl bg-emerald-500/10 p-4">
            <RotateCcw className="h-10 w-10 text-emerald-500" />
          </div>
          <h3 className="text-lg font-semibold mb-2">복습 기능 준비 중</h3>
          <p className="text-sm text-muted-foreground mb-6 max-w-sm">
            학습한 단어를 간격 반복 알고리즘으로
            최적의 시점에 복습할 수 있습니다.
          </p>
          <Button variant="outline" disabled>
            곧 만나요! 🔄
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
