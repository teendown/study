import type { Metadata } from 'next';
import { BookOpen } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export const metadata: Metadata = {
  title: '단어장 — STUDY QUEST',
  description: '나만의 단어장을 관리하세요.',
};

/**
 * 단어장 페이지 (Placeholder)
 * Phase 3에서 본격 구현 예정
 */
export default function VocabularyPage() {
  return (
    <div className="mx-auto max-w-2xl space-y-5">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">단어장</h2>
        <p className="text-sm text-muted-foreground mt-1">
          학습할 영어 단어를 등록하고 관리하세요
        </p>
      </div>

      <Card className="border-dashed">
        <CardContent className="flex flex-col items-center justify-center py-16 text-center">
          <div className="mb-4 rounded-2xl bg-amber-500/10 p-4">
            <BookOpen className="h-10 w-10 text-amber-500" />
          </div>
          <h3 className="text-lg font-semibold mb-2">단어장 기능 준비 중</h3>
          <p className="text-sm text-muted-foreground mb-6 max-w-sm">
            단어를 직접 입력하거나 OCR로 수집해서
            나만의 단어장을 만들 수 있습니다.
          </p>
          <Button variant="outline" disabled>
            곧 만나요! 📚
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
