'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  GraduationCap,
  BookOpen,
  RotateCcw,
  Settings,
  type LucideIcon,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface NavItemConfig {
  label: string;
  href: string;
  icon: LucideIcon;
}

const navItems: NavItemConfig[] = [
  { label: '대시보드', href: '/dashboard', icon: LayoutDashboard },
  { label: '학습', href: '/study', icon: GraduationCap },
  { label: '단어장', href: '/vocabulary', icon: BookOpen },
  { label: '복습', href: '/review', icon: RotateCcw },
  { label: '설정', href: '/settings', icon: Settings },
];

/**
 * 모바일 하단 네비게이션 바
 * 768px 이하에서만 표시
 */
export function MobileNav() {
  const pathname = usePathname();

  return (
    <nav
      id="mobile-nav"
      className="fixed bottom-0 left-0 right-0 z-50 border-t border-border bg-background/80 backdrop-blur-xl md:hidden mobile-nav-safe"
    >
      <div className="flex items-center justify-around px-2 py-1">
        {navItems.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex flex-col items-center gap-0.5 px-3 py-2 rounded-xl transition-all duration-200 min-w-[60px]',
                isActive
                  ? 'text-primary'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              <Icon
                className={cn(
                  'h-5 w-5 transition-transform duration-200',
                  isActive && 'scale-110'
                )}
                strokeWidth={isActive ? 2.5 : 2}
              />
              <span className={cn(
                'text-[10px] font-medium leading-none',
                isActive && 'font-semibold'
              )}>
                {item.label}
              </span>
              {isActive && (
                <span className="absolute -top-0.5 h-0.5 w-8 rounded-full bg-primary" />
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
