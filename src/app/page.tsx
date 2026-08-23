import { redirect } from 'next/navigation';

/**
 * 루트 페이지
 * 대시보드로 리디렉트합니다.
 * Phase 2에서 로그인 여부에 따라 분기할 예정입니다.
 */
export default function Home() {
  redirect('/dashboard');
}
