'use client';

import { useEffect, useState, useCallback, Suspense } from 'react';
import { usePathname, useSearchParams, useRouter } from 'next/navigation';
import { NavigationContext } from './useNavigationHistory';

const HISTORY_STORAGE_KEY = 'study_quest_nav_history';
const MAX_HISTORY_LENGTH = 30;

function NavigationWatcher({
  onLocationChange,
}: {
  onLocationChange: (url: string) => void;
}) {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    const fullUrl = searchParams?.toString()
      ? `${pathname}?${searchParams.toString()}`
      : pathname;

    if (fullUrl) {
      onLocationChange(fullUrl);
    }
  }, [pathname, searchParams, onLocationChange]);

  return null;
}

export function NavigationProvider({ children }: { children: React.ReactNode }) {
  const [historyStack, setHistoryStack] = useState<string[]>([]);
  const router = useRouter();

  // 초기 마운트 시 세션스토리지에서 기존 히스토리 복원
  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      const stored = sessionStorage.getItem(HISTORY_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setHistoryStack(parsed);
        }
      }
    } catch {
      // ignore
    }
  }, []);

  const handleLocationChange = useCallback((url: string) => {
    setHistoryStack((prev) => {
      // 마지막 방문 경로와 같으면 중복 추가 안 함
      if (prev[prev.length - 1] === url) return prev;

      const next = [...prev, url].slice(-MAX_HISTORY_LENGTH);
      try {
        sessionStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(next));
      } catch {
        // ignore
      }
      return next;
    });
  }, []);

  const safeBack = useCallback(
    (fallbackUrl: string = '/dashboard') => {
      if (typeof window === 'undefined') return;

      if (historyStack.length > 1) {
        router.back();
      } else {
        router.push(fallbackUrl);
      }
    },
    [historyStack, router]
  );

  const clearHistory = useCallback(() => {
    setHistoryStack([]);
    if (typeof window !== 'undefined') {
      try {
        sessionStorage.removeItem(HISTORY_STORAGE_KEY);
      } catch {}
    }
  }, []);

  return (
    <NavigationContext.Provider
      value={{
        historyStack,
        safeBack,
        canGoBack: historyStack.length > 1,
        clearHistory,
      }}
    >
      <Suspense fallback={null}>
        <NavigationWatcher onLocationChange={handleLocationChange} />
      </Suspense>
      {children}
    </NavigationContext.Provider>
  );
}
