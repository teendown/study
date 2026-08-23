import type { Metadata } from 'next';
import { Settings } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export const metadata: Metadata = {
  title: '설정 — STUDY QUEST',
  description: '학습 환경을 설정하세요.',
};

/**
 * 설정 페이지 (Placeholder)
 * Phase 2 이후 점진적으로 구현 예정
 */
export default function SettingsPage() {
  return (
    <div className="mx-auto max-w-2xl space-y-5">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">설정</h2>
        <p className="text-sm text-muted-foreground mt-1">
          학습 환경을 맞춤 설정하세요
        </p>
      </div>

      <Card className="border-dashed">
        <CardContent className="flex flex-col items-center justify-center py-16 text-center">
          <div className="mb-4 rounded-2xl bg-slate-500/10 p-4">
            <Settings className="h-10 w-10 text-slate-500" />
          </div>
          <h3 className="text-lg font-semibold mb-2">설정 기능 준비 중</h3>
          <p className="text-sm text-muted-foreground mb-6 max-w-sm">
            테마, 학습 목표, 알림 등을 설정할 수 있습니다.
          </p>
          <Button variant="outline" disabled>
            곧 만나요! ⚙️
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
