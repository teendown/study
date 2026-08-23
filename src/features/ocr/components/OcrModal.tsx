'use client';

import { useState, useRef } from 'react';
import {
  Camera,
  Upload,
  Image as ImageIcon,
  Loader2,
  Sparkles,
  CheckCircle2,
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { recognizeAndExtractWords } from '../services/ocrService';
import { OcrCandidateList } from './OcrCandidateList';
import type { ExtractedWordCandidate } from '@/lib/ocr/tokenizer';
import type { OcrStep } from '../types';

interface OcrModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSaveWords: (words: ExtractedWordCandidate[]) => Promise<void>;
}

export function OcrModal({ open, onOpenChange, onSaveWords }: OcrModalProps) {
  const [step, setStep] = useState<OcrStep>('upload');
  const [progress, setProgress] = useState(0);
  const [statusText, setStatusText] = useState('');
  const [candidates, setCandidates] = useState<ExtractedWordCandidate[]>([]);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // 모달 닫힐 때 초기화
  const handleOpenChange = (val: boolean) => {
    if (!val) {
      setStep('upload');
      setProgress(0);
      setStatusText('');
      setCandidates([]);
      setPreviewUrl(null);
      setError(null);
    }
    onOpenChange(val);
  };

  // 이미지 파일 처리
  const processImageFile = async (file: File) => {
    if (!file) return;

    setError(null);
    setPreviewUrl(URL.createObjectURL(file));
    setStep('processing');

    try {
      const result = await recognizeAndExtractWords({
        imageSource: file,
        onProgress: (pct, msg) => {
          setProgress(pct);
          setStatusText(msg);
        },
      });

      if (result.candidates.length === 0) {
        setError('이미지에서 영단어를 찾지 못했습니다. 글자가 선명한 이미지를 선택해주세요.');
        setStep('upload');
        return;
      }

      setCandidates(result.candidates);
      setStep('review');
    } catch (err) {
      console.error('OCR error:', err);
      setError('글자 인식 중 오류가 발생했습니다. 다시 시도해주세요.');
      setStep('upload');
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processImageFile(file);
  };

  // 선택 단어 일괄 저장
  const handleSaveSelected = async (selected: ExtractedWordCandidate[]) => {
    await onSaveWords(selected);
    handleOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Camera className="h-5 w-5 text-primary" />
            {step === 'review'
              ? `단어 검수 및 선택 (${candidates.length}개 발견)`
              : '사진 / 이미지로 단어 추출 (OCR)'}
          </DialogTitle>
        </DialogHeader>

        {/* ────────────────────────────────────
            1. 이미지 업로드 단계
           ──────────────────────────────────── */}
        {step === 'upload' && (
          <div className="space-y-4 py-2">
            {error && (
              <div className="p-3 rounded-xl bg-destructive/10 text-destructive text-xs font-medium">
                {error}
              </div>
            )}

            <div
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-primary/40 hover:border-primary bg-primary/5 rounded-2xl p-8 text-center cursor-pointer transition-all duration-200 hover:scale-[1.01]"
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleFileChange}
              />
              <div className="mx-auto w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mb-3">
                <Upload className="h-7 w-7 text-primary" />
              </div>
              <h4 className="font-bold text-base mb-1">
                문제집 / 교재 사진을 업로드하세요
              </h4>
              <p className="text-xs text-muted-foreground max-w-xs mx-auto">
                스마트폰 카메라로 찍은 사진이나 스크린샷 이미지를 선택하면
                영어 단어를 자동으로 추출합니다.
              </p>
            </div>

            {/* 안내 팁 */}
            <div className="p-3.5 rounded-xl bg-muted/50 border border-border text-xs text-muted-foreground space-y-1">
              <p className="font-semibold text-foreground flex items-center gap-1">
                <Sparkles className="h-3.5 w-3.5 text-amber-500" /> 촬영 팁
              </p>
              <p>• 글자가 선명하고 수평에 가깝게 촬영하면 인식률이 높아집니다.</p>
              <p>• 추출된 단어는 바로 저장되지 않고 원하는 단어만 골라서 등록할 수 있습니다.</p>
            </div>
          </div>
        )}

        {/* ────────────────────────────────────
            2. OCR 글자 인식 진행 중
           ──────────────────────────────────── */}
        {step === 'processing' && (
          <div className="py-12 text-center space-y-5">
            <div className="relative mx-auto w-16 h-16 flex items-center justify-center">
              <Loader2 className="h-12 w-12 animate-spin text-primary" />
            </div>

            <div className="space-y-1.5">
              <h4 className="font-bold text-base">{statusText || '이미지 분석 중...'}</h4>
              <p className="text-xs text-muted-foreground">
                Tesseract.js OCR 엔진으로 글자를 추출하고 있습니다.
              </p>
            </div>

            <div className="max-w-xs mx-auto space-y-1">
              <Progress value={progress} className="h-2" />
              <p className="text-[11px] text-muted-foreground text-right">{progress}%</p>
            </div>
          </div>
        )}

        {/* ────────────────────────────────────
            3. 단어 검수 및 선택 단계
           ──────────────────────────────────── */}
        {step === 'review' && (
          <OcrCandidateList
            initialCandidates={candidates}
            onSaveSelected={handleSaveSelected}
            onCancel={() => setStep('upload')}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}
