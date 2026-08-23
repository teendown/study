import { MainLayout } from '@/components/layout';

/**
 * 대시보드 레이아웃
 * MainLayout을 적용합니다.
 */
export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <MainLayout>{children}</MainLayout>;
}
