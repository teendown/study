import { Header } from './Header';
import { Sidebar } from './Sidebar';
import { MobileNav } from './MobileNav';

interface MainLayoutProps {
  children: React.ReactNode;
}

/**
 * 메인 레이아웃 래퍼
 * - 모바일: Header (상단) + Content + MobileNav (하단)
 * - PC: Sidebar (좌측) + Content
 */
export function MainLayout({ children }: MainLayoutProps) {
  return (
    <div className="flex min-h-screen">
      {/* PC 사이드바 */}
      <Sidebar />

      {/* 메인 콘텐츠 영역 */}
      <div className="flex flex-1 flex-col min-w-0">
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
