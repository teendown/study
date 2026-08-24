'use client';

import { useState } from 'react';
import { Sparkles, Image as ImageIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { BackgroundSettingsDialog } from '@/features/theme/components/BackgroundSettingsDialog';

/**
 * 모바일 헤더
 * 768px 이하에서만 표시 (PC에서는 사이드바에 로고 및 배경설정 포함)
 */
export function Header() {
  const [isBgDialogOpen, setIsBgDialogOpen] = useState(false);

  return (
    <>
      <header
        id="header"
        className="sticky top-0 z-40 flex items-center justify-between px-4 py-3 border-b border-border bg-background/80 backdrop-blur-xl md:hidden"
      >
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-xs">
            <Sparkles className="h-4 w-4" />
          </div>
          <h1 className="text-base font-bold tracking-tight gradient-text">
            STUDY QUEST
          </h1>
        </div>

        {/* 모바일 배경 사진 설정 버튼 */}
        <Button
          variant="outline"
          size="sm"
          onClick={() => setIsBgDialogOpen(true)}
          className="h-8 px-2.5 text-xs font-semibold gap-1.5 rounded-lg border-primary/30 text-primary hover:bg-primary/10"
        >
          <ImageIcon className="h-3.5 w-3.5" />
          배경 사진
        </Button>
      </header>

      {/* 배경 사진 설정 모달 */}
      <BackgroundSettingsDialog
        open={isBgDialogOpen}
        onOpenChange={setIsBgDialogOpen}
      />
    </>
  );
}
