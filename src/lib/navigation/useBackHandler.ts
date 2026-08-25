'use client';

import { useEffect, useRef } from 'react';

// 전역 모달 스택 관리 (다중 모달 및 모달 간 전환 시 레이스 컨디션 방지)
interface ModalEntry {
  id: string;
  onClose: () => void;
}

const modalStack: ModalEntry[] = [];
let isPopStateRegistered = false;
let isHandlingPopState = false;

function setupGlobalPopStateHandler() {
  if (typeof window === 'undefined' || isPopStateRegistered) return;
  isPopStateRegistered = true;

  window.addEventListener('popstate', () => {
    // 뒤로가기가 발생했을 때 모달 스택에 열려있는 모달이 있으면 최상단 모달 닫기
    if (modalStack.length > 0) {
      isHandlingPopState = true;
      const topModal = modalStack.pop();
      if (topModal) {
        topModal.onClose();
      }
      isHandlingPopState = false;

      // 만약 스택에 여전히 다른 모달이 남아있다면 다음 뒤로가기를 위해 가상 히스토리 유지
      if (modalStack.length > 0) {
        window.history.pushState({ modalOpen: true }, '');
      }
    }
  });
}

/**
 * 모바일/브라우저 뒤로가기 버튼 감지 훅
 * - 모달이 열릴 때 history state를 관리하고,
 * - 사용자가 휴대폰 뒤로가기를 누르면 최상단 모달만 닫히도록 처리
 * - 모달에서 다른 모달로 전환될 때(예: 미리보기 -> 수정 폼) 즉시 닫히는 레이스 컨디션 완벽 방지
 */
export function useBackHandler(isOpen: boolean, onClose: () => void, modalId: string = 'modal') {
  const modalKeyRef = useRef(`${modalId}_${Math.random().toString(36).slice(2, 7)}`);
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  useEffect(() => {
    if (typeof window === 'undefined') return;
    setupGlobalPopStateHandler();

    if (isOpen) {
      const currentKey = modalKeyRef.current;

      // 첫 모달이 열릴 때만 history.pushState 실행
      if (modalStack.length === 0) {
        window.history.pushState({ modalOpen: true }, '');
      }

      // 스택에 등록 (이미 있으면 교체/갱신)
      const existingIdx = modalStack.findIndex((m) => m.id === currentKey);
      if (existingIdx !== -1) {
        modalStack[existingIdx].onClose = () => onCloseRef.current();
      } else {
        modalStack.push({
          id: currentKey,
          onClose: () => onCloseRef.current(),
        });
      }

      return () => {
        // 모달이 닫히거나 언마운트될 때 스택에서 제거
        const idx = modalStack.findIndex((m) => m.id === currentKey);
        if (idx !== -1) {
          modalStack.splice(idx, 1);
        }

        // 뒤로가기 버튼이 아닌 프로그램적(X버튼, 모달 전환 등)으로 닫혔을 때,
        // 모든 모달이 완전히 닫혔을 경우에만 히스토리 정리 (비동기 지연으로 전환 중 다른 모달이 열리는 시간 확보)
        if (!isHandlingPopState) {
          setTimeout(() => {
            if (modalStack.length === 0 && window.history.state?.modalOpen) {
              window.history.back();
            }
          }, 50);
        }
      };
    }
  }, [isOpen]);
}
