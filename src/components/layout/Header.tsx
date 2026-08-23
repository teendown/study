'use client';

import { Sparkles } from 'lucide-react';

/**
 * 모바일 헤더
 * 768px 이하에서만 표시 (PC에서는 사이드바에 로고 포함)
 */
export function Header() {
  return (
    <header
      id="header"
      className="sticky top-0 z-40 flex items-center justify-between px-4 py-3 border-b border-border bg-background/80 backdrop-blur-xl md:hidden"
    >
      <div className="flex items-center gap-2.5">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
          <Sparkles className="h-4 w-4" />
        </div>
        <h1 className="text-base font-bold tracking-tight gradient-text">
          STUDY QUEST
        </h1>
      </div>
    </header>
  );
}
