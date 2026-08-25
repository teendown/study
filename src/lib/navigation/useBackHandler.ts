'use client';

import { useEffect, useRef } from 'react';

/**
 * 모바일/브라우저 뒤로가기 버튼 감지 훅
 * - 모달이 열릴 때 history state를 푸시하고,
 * - 사용자가 휴대폰 뒤로가기를 누르면 이전 페이지로 이동하지 않고 모달만 닫히도록 처리
 */
export function useBackHandler(isOpen: boolean, onClose: () => void, modalId: string = 'modal') {
  const isPushedRef = useRef(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    if (isOpen) {
      // 모달이 열렸을 때 가상 히스토리 상태 추가
      const stateKey = `modal_${modalId}_${Date.now()}`;
      window.history.pushState({ modalOpen: true, stateKey }, '');
      isPushedRef.current = true;

      const handlePopState = () => {
        if (isPushedRef.current) {
          isPushedRef.current = false;
          onClose();
        }
      };

      window.addEventListener('popstate', handlePopState);

      return () => {
        window.removeEventListener('popstate', handlePopState);
        // 만약 사용자가 뒤로가기가 아닌 닫기 버튼/배경 클릭으로 모달을 닫았을 경우,
        // 쌓아둔 가상 히스토리를 정리(뒤로가기 한 번 실행)하여 히스토리 오염 방지
        if (isPushedRef.current) {
          isPushedRef.current = false;
          window.history.back();
        }
      };
    }
  }, [isOpen, onClose, modalId]);
}
