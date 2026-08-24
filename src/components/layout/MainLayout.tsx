'use client';

import { Header } from './Header';
import { Sidebar } from './Sidebar';
import { MobileNav } from './MobileNav';

interface MainLayoutProps {
  children: React.ReactNode;
}

/**
 * 메인 레이아웃 래퍼
 * - 모바일/데스크톱 배경 이미지 지원 (반투명 글래스모피즘 가독성 오버레이)
 * - 모바일: Header (상단) + Content + MobileNav (하단)
 * - PC: Sidebar (좌측) + Content
 */
export function MainLayout({ children }: MainLayoutProps) {
  const isProd = process.env.NODE_ENV === 'production';
  const bgPath = `${isProd ? '/study' : ''}/images/mobile-bg.jpg`;

  return (
    <div className="relative flex min-h-screen text-foreground selection:bg-primary/20">
      {/* 🌟 전역 커스텀 배경 이미지 레이어 */}
      <div
        className="fixed inset-0 pointer-events-none -z-10 bg-cover bg-center bg-no-repeat transition-opacity duration-500"
        style={{
          backgroundImage: `url(${bgPath})`,
        }}
      >
        {/* 부드러운 반투명 오버레이로 사진의 멋진 분위기를 살리면서 텍스트 가독성 극대화 */}
        <div className="absolute inset-0 bg-background/85 dark:bg-background/90 backdrop-blur-[1px]" />
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
