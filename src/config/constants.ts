// ===========================
// STUDY QUEST 상수 정의
// ===========================

import type { NavItem } from '@/types';

/** 앱 기본 정보 */
export const APP_CONFIG = {
  name: 'STUDY QUEST',
  description: 'AI 개인 맞춤형 학습 플랫폼',
  version: '0.1.0',
} as const;

/** 네비게이션 메뉴 */
export const NAV_ITEMS: NavItem[] = [
  { label: '대시보드', href: '/dashboard', icon: 'LayoutDashboard' },
  { label: '학습', href: '/study', icon: 'GraduationCap' },
  { label: '단어장', href: '/vocabulary', icon: 'BookOpen' },
  { label: '복습', href: '/review', icon: 'RotateCcw' },
  { label: '설정', href: '/settings', icon: 'Settings' },
];

/** XP 관련 상수 */
export const XP_CONFIG = {
  correctAnswer: 10,
  fastBonus: 5,
  reviewComplete: 20,
  dailyGoalComplete: 100,
  levelUpBase: 100,         // 레벨업 기본 XP
  levelUpMultiplier: 1.5,   // 레벨당 XP 증가 배율
} as const;

/** 복습 간격 (일) */
export const REVIEW_INTERVALS = [
  0,      // 5분 (같은 날)
  0,      // 30분 (같은 날)
  1,      // 1일
  3,      // 3일
  7,      // 7일
  14,     // 14일
  30,     // 30일
] as const;

/** 숙련도 범위 */
export const MASTERY_RANGES = {
  unlearned: { min: 0, max: 20, label: '미학습', color: 'hsl(0, 0%, 60%)' },
  learning: { min: 21, max: 40, label: '학습중', color: 'hsl(30, 90%, 55%)' },
  average: { min: 41, max: 60, label: '보통', color: 'hsl(50, 90%, 50%)' },
  skilled: { min: 61, max: 80, label: '숙련', color: 'hsl(120, 60%, 50%)' },
  highly_skilled: { min: 81, max: 95, label: '매우 숙련', color: 'hsl(200, 80%, 50%)' },
  master: { min: 96, max: 100, label: '마스터', color: 'hsl(270, 80%, 55%)' },
} as const;

/** 반응형 브레이크포인트 */
export const BREAKPOINTS = {
  mobile: 768,
  tablet: 1024,
  desktop: 1280,
} as const;
