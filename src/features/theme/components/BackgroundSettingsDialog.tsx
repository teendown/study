'use client';

import { useState, useRef } from 'react';
import {
  Image as ImageIcon,
  Upload,
  RotateCcw,
  Sparkles,
  Sliders,
  Check,
  Eye,
  Layers,
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useBackgroundTheme } from '../hooks/useBackgroundTheme';
import { PRESET_BACKGROUNDS } from '../services/backgroundService';

interface BackgroundSettingsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function BackgroundSettingsDialog({
  open,
  onOpenChange,
}: BackgroundSettingsDialogProps) {
  const {
    config,
    currentImageUrl,
    uploadCustomImage,
    setPreset,
    setOverlayOpacity,
    setBlur,
    resetDefault,
  } = useBackgroundTheme();

  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      const res = await uploadCustomImage(file);
      if (res.success) {
        alert('내 사진이 배경화면으로 성공적으로 적용되었습니다! 🎉');
      } else {
        alert(res.error || '사진 업로드 중 오류가 발생했습니다.');
      }
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[90vh] flex flex-col p-5 overflow-y-auto">
        <DialogHeader className="pb-2 border-b shrink-0">
          <DialogTitle className="flex items-center gap-2 text-lg">
            <ImageIcon className="h-5 w-5 text-primary" />
            배경화면 테마 & 내 사진 설정
          </DialogTitle>
          <DialogDescription className="text-xs">
            내가 가지고 있는 사진을 불러와 나만의 학습 배경을 만들어보세요.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 pt-3 flex-1">
          {/* 1. 현재 배경 미리보기 카드 */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-foreground flex items-center justify-between">
              <span>현재 적용된 배경 미리보기</span>
              <Badge variant="outline" className="text-[10px]">
                {config.type === 'custom' ? '📸 내 사진 적용 중' : config.type === 'preset' ? '🎨 추천 테마 적용 중' : '기본 배경'}
              </Badge>
            </label>

            <div
              className="relative h-32 w-full rounded-xl overflow-hidden border border-border shadow-xs bg-cover bg-center transition-all"
              style={{
                backgroundImage: `url(${currentImageUrl})`,
              }}
            >
              {/* 실시간 오버레이 & 블러 미리보기 */}
              <div
                className="absolute inset-0 transition-all flex flex-col items-center justify-center p-3 text-center"
                style={{
                  backgroundColor: `rgba(var(--background-rgb, 255, 255, 255), ${config.overlayOpacity})`,
                  backdropFilter: `blur(${config.blur}px)`,
                }}
              >
                <p className="text-xs font-bold text-foreground drop-shadow-xs">
                  STUDY QUEST
                </p>
                <p className="text-[11px] text-muted-foreground mt-0.5">
                  글자 가독성 테스트 문구입니다 (선명하게 보이나요?)
                </p>
              </div>
            </div>
          </div>

          {/* 2. 내 사진 업로드 액션 버튼 */}
          <div className="space-y-2 p-3.5 rounded-xl border border-primary/20 bg-primary/5">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-xs font-bold text-foreground flex items-center gap-1.5">
                  <Upload className="h-4 w-4 text-primary" />
                  내 갤러리/PC 사진 불러오기
                </h4>
                <p className="text-[11px] text-muted-foreground mt-0.5">
                  풍경, 가족, 반려동물 등 소장한 사진 파일(JPG, PNG, WebP)을 불러옵니다.
                </p>
              </div>
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleFileChange}
            />

            <Button
              type="button"
              className="w-full font-bold gap-2 text-xs h-9 bg-primary text-primary-foreground shadow-sm"
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading}
            >
              <Upload className="h-4 w-4" />
              {isUploading ? '사진 압축 및 적용 중...' : '📁 사진 파일 선택하기'}
            </Button>
          </div>

          {/* 3. 배경 밝기 & 흐림(Blur) 조절 슬라이더 */}
          <div className="space-y-3 p-3.5 rounded-xl border border-border bg-card/60">
            <h4 className="text-xs font-bold text-foreground flex items-center gap-1.5">
              <Sliders className="h-4 w-4 text-amber-500" />
              배경 밝기 및 텍스트 가독성 조절
            </h4>

            {/* 오버레이 불투명도 조절 */}
            <div className="space-y-1">
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">배경 가림막 (글자 선명도)</span>
                <span className="font-bold text-foreground">{Math.round(config.overlayOpacity * 100)}%</span>
              </div>
              <input
                type="range"
                min="0.30"
                max="0.95"
                step="0.05"
                value={config.overlayOpacity}
                onChange={(e) => setOverlayOpacity(parseFloat(e.target.value))}
                className="w-full h-1.5 bg-muted rounded-lg appearance-none cursor-pointer accent-primary"
              />
              <div className="flex justify-between text-[10px] text-muted-foreground px-0.5">
                <span>사진이 잘 보임</span>
                <span>글자가 선명함</span>
              </div>
            </div>

            {/* 블러 흐림 조절 */}
            <div className="space-y-1 pt-1">
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">배경 흐림 효과 (Blur)</span>
                <span className="font-bold text-foreground">{config.blur}px</span>
              </div>
              <input
                type="range"
                min="0"
                max="8"
                step="1"
                value={config.blur}
                onChange={(e) => setBlur(parseInt(e.target.value, 10))}
                className="w-full h-1.5 bg-muted rounded-lg appearance-none cursor-pointer accent-primary"
              />
            </div>
          </div>

          {/* 4. 기본 추천 감성 프리셋 */}
          <div className="space-y-2">
            <h4 className="text-xs font-bold text-foreground flex items-center gap-1.5">
              <Sparkles className="h-4 w-4 text-indigo-500" />
              추천 감성 배경 테마
            </h4>

            <div className="grid grid-cols-2 gap-2">
              {PRESET_BACKGROUNDS.map((preset) => {
                const isSelected = config.type === 'preset' && config.presetId === preset.id;

                return (
                  <div
                    key={preset.id}
                    onClick={() => setPreset(preset.id)}
                    className={`group relative h-20 rounded-xl overflow-hidden border cursor-pointer transition-all ${
                      isSelected
                        ? 'border-primary ring-2 ring-primary/40 shadow-xs'
                        : 'border-border hover:border-primary/50'
                    }`}
                  >
                    <div
                      className="absolute inset-0 bg-cover bg-center transition-transform group-hover:scale-105"
                      style={{ backgroundImage: `url(${preset.thumb})` }}
                    />
                    <div className="absolute inset-0 bg-black/40 group-hover:bg-black/30 transition-colors flex flex-col justify-end p-2 text-white">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-xs">{preset.name}</span>
                        {isSelected && <Check className="h-3.5 w-3.5 text-primary" />}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* 5. 하단 닫기 & 기본 배경 초기화 버튼 */}
        <div className="flex gap-2 pt-3 border-t border-border shrink-0 mt-3">
          <Button
            variant="outline"
            size="sm"
            onClick={resetDefault}
            className="gap-1 text-xs text-muted-foreground hover:text-foreground"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            기본 배경 복원
          </Button>
          <Button
            size="sm"
            className="flex-1 font-bold text-xs"
            onClick={() => onOpenChange(false)}
          >
            설정 완료
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
