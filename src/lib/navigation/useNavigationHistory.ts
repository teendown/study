'use client';

import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { usePathname, useSearchParams, useRouter } from 'next/navigation';

const HISTORY_STORAGE_KEY = 'study_quest_nav_history';
const MAX_HISTORY_LENGTH = 30;

interface NavigationContextType {
  historyStack: string[];
  safeBack: (fallbackUrl?: string) => void;
  canGoBack: boolean;
  clearHistory: () => void;
}

export const NavigationContext = createContext<NavigationContextType>({
  historyStack: [],
  safeBack: () => {},
  canGoBack: false,
  clearHistory: () => {},
});

export function useNavigationHistory() {
  return useContext(NavigationContext);
}

/**
 * 안전한 뒤로가기 훅 (단독으로도 사용 가능)
 */
export function useSafeBack(fallbackUrl: string = '/dashboard') {
  const router = useRouter();
  const { historyStack } = useNavigationHistory();

  const goBack = useCallback(() => {
    if (typeof window === 'undefined') return;

    if (historyStack.length > 1) {
      router.back();
    } else {
      router.push(fallbackUrl);
    }
  }, [historyStack, router, fallbackUrl]);

  return { goBack, canGoBack: historyStack.length > 1 };
}
