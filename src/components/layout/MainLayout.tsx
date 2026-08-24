'use client';

import { Header } from './Header';
import { Sidebar } from './Sidebar';
import { MobileNav } from './MobileNav';
import { useBackgroundTheme } from '@/features/theme/hooks/useBackgroundTheme';

interface MainLayoutProps {
  children: React.ReactNode;
}

/**
 * 메인 레이아웃 래퍼
 * - 사용자 커스텀 사진 / 프리셋 배경 실시간 지원 (반투명 가독성 오버레이 및 블러 조절)
 * - 모바일: Header (상단) + Content + MobileNav (하단)
 * - PC: Sidebar (좌측) + Content
 */
export function MainLayout({ children }: MainLayoutProps) {
  const { currentImageUrl, config } = useBackgroundTheme();

  return (
    <div className="relative flex min-h-screen text-foreground selection:bg-primary/20">
      {/* 🌟 전역 커스텀 배경 이미지 레이어 */}
      <div
        className="fixed inset-0 pointer-events-none -z-10 bg-cover bg-center bg-no-repeat transition-all duration-700"
        style={{
          backgroundImage: `url(${currentImageUrl})`,
        }}
      >
        {/* 부드러운 반투명 오버레이로 사진의 멋진 분위기를 살리면서 텍스트 가독성 극대화 */}
        <div
          className="absolute inset-0 transition-all duration-300"
          style={{
            backgroundColor: `rgba(var(--background-rgb, 255, 255, 255), ${config.overlayOpacity})`,
            backdropFilter: `blur(${config.blur}px)`,
            WebkitBackdropFilter: `blur(${config.blur}px)`,
          }}
        />
      </div>

      {/* PC 사이드바 */}
      <Sidebar />

      {/* 메인 콘텐츠 영역 */}
      <div className="flex flex-1 flex-col min-w-0 relative z-0">
        {/* 모바일 헤더 */}
        <Header />

        {/* 페이지 콘텐츠 */}
        <main className="flex-1 px-4 py-5 md:px-6 lg:px-8 pb-24 md:pb-6 page-enter">
          {children}
        </main>
      </div>

      {/* 모바일 하단 네비게이션 */}
      <MobileNav />
    </div>
  );
}
