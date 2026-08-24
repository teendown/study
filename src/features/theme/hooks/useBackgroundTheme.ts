'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  getBackgroundConfig,
  saveBackgroundConfig,
  type BackgroundConfig,
  DEFAULT_BG_CONFIG,
  BG_CHANGE_EVENT,
  PRESET_BACKGROUNDS,
  processCustomImageFile,
} from '../services/backgroundService';

export function useBackgroundTheme() {
  const [config, setConfig] = useState<BackgroundConfig>(DEFAULT_BG_CONFIG);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    setConfig(getBackgroundConfig());
    setIsLoaded(true);

    const handleBgChange = (e: Event) => {
      const customEvent = e as CustomEvent<BackgroundConfig>;
      if (customEvent.detail) {
        setConfig(customEvent.detail);
      } else {
        setConfig(getBackgroundConfig());
      }
    };

    window.addEventListener(BG_CHANGE_EVENT, handleBgChange);
    window.addEventListener('storage', handleBgChange);

    return () => {
      window.removeEventListener(BG_CHANGE_EVENT, handleBgChange);
      window.removeEventListener('storage', handleBgChange);
    };
  }, []);

  // 1. 내 사진 업로드 및 적용
  const uploadCustomImage = useCallback(async (file: File) => {
    try {
      const dataUrl = await processCustomImageFile(file);
      const newConfig: BackgroundConfig = {
        ...config,
        type: 'custom',
        customImageUrl: dataUrl,
      };
      setConfig(newConfig);
      saveBackgroundConfig(newConfig);
      return { success: true };
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : '사진을 불러오지 못했습니다.';
      return { success: false, error: message };
    }
  }, [config]);

  // 2. 추천 프리셋 배경 적용
  const setPreset = useCallback((presetId: string) => {
    const newConfig: BackgroundConfig = {
      ...config,
      type: 'preset',
      presetId,
    };
    setConfig(newConfig);
    saveBackgroundConfig(newConfig);
  }, [config]);

  // 3. 오버레이 투명도 조절 (0.1 ~ 0.95)
  const setOverlayOpacity = useCallback((opacity: number) => {
    const newConfig: BackgroundConfig = {
      ...config,
      overlayOpacity: opacity,
    };
    setConfig(newConfig);
    saveBackgroundConfig(newConfig);
  }, [config]);

  // 4. 블러(흐림) 강도 조절 (0 ~ 10px)
  const setBlur = useCallback((blur: number) => {
    const newConfig: BackgroundConfig = {
      ...config,
      blur,
    };
    setConfig(newConfig);
    saveBackgroundConfig(newConfig);
  }, [config]);

  // 5. 기본 배경으로 초기화
  const resetDefault = useCallback(() => {
    const newConfig: BackgroundConfig = {
      ...DEFAULT_BG_CONFIG,
    };
    setConfig(newConfig);
    saveBackgroundConfig(newConfig);
  }, []);

  // 현재 실제 배경 이미지 URL 계산
  const currentImageUrl = useCallback(() => {
    if (config.type === 'custom' && config.customImageUrl) {
      return config.customImageUrl;
    }
    if (config.type === 'preset' && config.presetId) {
      const p = PRESET_BACKGROUNDS.find((item) => item.id === config.presetId);
      if (p) return p.url;
    }
    const isProd = process.env.NODE_ENV === 'production';
    return `${isProd ? '/study' : ''}/images/mobile-bg.jpg`;
  }, [config]);

  return {
    config,
    isLoaded,
    currentImageUrl: currentImageUrl(),
    uploadCustomImage,
    setPreset,
    setOverlayOpacity,
    setBlur,
    resetDefault,
  };
}
