'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  GraduationCap,
  BookOpen,
  RotateCcw,
  Settings,
  Sparkles,
  Image as ImageIcon,
  type LucideIcon,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Separator } from '@/components/ui/separator';
import { BackgroundSettingsDialog } from '@/features/theme/components/BackgroundSettingsDialog';

interface NavItemConfig {
  label: string;
  href: string;
  icon: LucideIcon;
}

const mainNavItems: NavItemConfig[] = [
  { label: '대시보드', href: '/dashboard', icon: LayoutDashboard },
  { label: '학습', href: '/study', icon: GraduationCap },
  { label: '단어장', href: '/vocabulary', icon: BookOpen },
  { label: '복습', href: '/review', icon: RotateCcw },
];

const bottomNavItems: NavItemConfig[] = [
  { label: '통계 & 설정', href: '/settings', icon: Settings },
];

/**
 * PC 사이드바 네비게이션
 * 768px 이상에서만 표시
 */
export function Sidebar() {
  const pathname = usePathname();
  const [isBgDialogOpen, setIsBgDialogOpen] = useState(false);

  return (
    <>
      <aside
        id="sidebar"
        className="hidden md:flex md:flex-col md:w-64 lg:w-72 border-r border-border bg-sidebar/95 backdrop-blur-xl h-screen sticky top-0"
      >
        {/* 로고 영역 */}
        <div className="flex items-center gap-3 px-6 py-5">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-xs">
            <Sparkles className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-lg font-bold tracking-tight gradient-text">
              STUDY QUEST
            </h1>
            <p className="text-[11px] text-muted-foreground font-medium">
              AI 맞춤형 학습
            </p>
          </div>
        </div>

        <Separator />

        {/* 메인 네비게이션 */}
        <nav className="flex-1 px-3 py-4 space-y-1">
          <p className="px-3 mb-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
            학습
          </p>
          {mainNavItems.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
            const Icon = item.icon;

            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200',
                  isActive
                    ? 'bg-sidebar-accent text-sidebar-accent-foreground shadow-xs'
                    : 'text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground'
                )}
              >
                <Icon
                  className={cn('h-[18px] w-[18px]', isActive && 'text-primary')}
                  strokeWidth={isActive ? 2.5 : 2}
                />
                {item.label}
                {isActive && (
                  <span className="ml-auto h-1.5 w-1.5 rounded-full bg-primary" />
                )}
              </Link>
            );
          })}
        </nav>

        {/* 하단 네비게이션 & 배경 사진 설정 */}
        <div className="px-3 pb-4 space-y-1">
          <Separator className="mb-3" />

          {/* 배경 사진 설정 퀵 액션 버튼 */}
          <button
            type="button"
            onClick={() => setIsBgDialogOpen(true)}
            className="flex w-full items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium text-sidebar-foreground/70 hover:bg-primary/10 hover:text-primary transition-all duration-200"
          >
            <ImageIcon className="h-[18px] w-[18px] text-primary" strokeWidth={2} />
            <span>배경 사진 설정</span>
          </button>

          {bottomNavItems.map((item) => {
            const isActive = pathname === item.href;
            const Icon = item.icon;

            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200',
                  isActive
                    ? 'bg-sidebar-accent text-sidebar-accent-foreground'
                    : 'text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground'
                )}
              >
                <Icon className="h-[18px] w-[18px]" strokeWidth={2} />
                {item.label}
              </Link>
            );
          })}
        </div>
      </aside>

      {/* 배경 사진 설정 모달 */}
      <BackgroundSettingsDialog
        open={isBgDialogOpen}
        onOpenChange={setIsBgDialogOpen}
      />
    </>
  );
}
