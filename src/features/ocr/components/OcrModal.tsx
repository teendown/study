'use client';

import { useState, useRef } from 'react';
import {
  Camera,
  Upload,
  Loader2,
  Sparkles,
  FileText,
  List,
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
import { OcrPassageReview } from './OcrPassageReview';
import type { ExtractedWordCandidate } from '@/lib/ocr/tokenizer';
import type { OcrStep } from '../types';

interface OcrModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSaveWords: (words: ExtractedWordCandidate[]) => Promise<void>;
  onSavePassage?: (passageData: { title: string; content: string; source: string }) => Promise<void>;
}

export function OcrModal({
  open,
  onOpenChange,
  onSaveWords,
  onSavePassage,
}: OcrModalProps) {
  const [step, setStep] = useState<OcrStep>('upload');
  const [activeView, setActiveView] = useState<'words' | 'passage'>('words');
  const [progress, setProgress] = useState(0);
  const [statusText, setStatusText] = useState('');
  const [candidates, setCandidates] = useState<ExtractedWordCandidate[]>([]);
  const [passageText, setPassageText] = useState('');
  const [sentences, setSentences] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // 모달 닫힐 때 초기화
  const handleOpenChange = (val: boolean) => {
    if (!val) {
      setStep('upload');
      setActiveView('words');
      setProgress(0);
      setStatusText('');
      setCandidates([]);
      setPassageText('');
      setSentences([]);
      setError(null);
    }
    onOpenChange(val);
  };

  // 이미지 파일 처리
  const processImageFile = async (file: File) => {
    if (!file) return;

    setError(null);
    setStep('processing');

    try {
      const result = await recognizeAndExtractWords({
        imageSource: file,
        onProgress: (pct, msg) => {
          setProgress(pct);
          setStatusText(msg);
        },
      });

      if (!result.rawText || result.candidates.length === 0) {
        setError('이미지에서 영문 텍스트를 찾지 못했습니다. 글자가 선명한 이미지를 선택해주세요.');
        setStep('upload');
        return;
      }

      setCandidates(result.candidates);
      setPassageText(result.passageText);
      setSentences(result.sentences);
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
  const handleSaveSelectedWords = async (selected: ExtractedWordCandidate[]) => {
    await onSaveWords(selected);
    handleOpenChange(false);
  };

  // 본문 저장
  const handleSavePassage = async (data: { title: string; content: string; source: string }) => {
    if (onSavePassage) {
      await onSavePassage(data);
    }
    handleOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Camera className="h-5 w-5 text-primary" />
            {step === 'review' ? (
              <div className="flex items-center justify-between flex-1 pr-4">
                <span>OCR 추출 결과</span>
                {/* 단어 모드 / 본문 모드 전환 탭 */}
                <div className="flex items-center rounded-lg bg-muted p-0.5 text-xs font-semibold">
                  <button
                    type="button"
                    onClick={() => setActiveView('words')}
                    className={`flex items-center gap-1 px-2.5 py-1 rounded-md transition-all ${
                      activeView === 'words'
                        ? 'bg-background text-primary shadow-xs'
                        : 'text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    <List className="h-3.5 w-3.5" />
                    단어 ({candidates.length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveView('passage')}
                    className={`flex items-center gap-1 px-2.5 py-1 rounded-md transition-all ${
                      activeView === 'passage'
                        ? 'bg-background text-primary shadow-xs'
                        : 'text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    <FileText className="h-3.5 w-3.5" />
                    본문 지문
                  </button>
                </div>
              </div>
            ) : (
              '사진 / 교재 이미지 OCR 텍스트 인식'
            )}
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
                스마트폰으로 찍은 사진의 그림자를 자동 제거하고, 선명도를 극대화하여 
                <strong> 단어 및 본문 전체</strong>를 고정밀 인식합니다.
              </p>
            </div>

            {/* 고정밀 개선 안내 팁 */}
            <div className="p-3.5 rounded-xl bg-muted/50 border border-border text-xs text-muted-foreground space-y-1">
              <p className="font-semibold text-foreground flex items-center gap-1">
                <Sparkles className="h-3.5 w-3.5 text-amber-500" /> 고정밀 OCR 전처리 적용됨
              </p>
              <p>• <strong>자동 대비 강화 &amp; 그림자 제거</strong>로 흐린 사진도 선명하게 판독합니다.</p>
              <p>• <strong>단어 추출</strong>뿐만 아니라 <strong>지문 본문 통째 읽기/저장</strong>도 지원합니다.</p>
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
              <h4 className="font-bold text-base">{statusText || '이미지 분석 및 보정 중...'}</h4>
              <p className="text-xs text-muted-foreground">
                화질 개선, 그림자 제거, Tesseract 고정밀 분석을 수행하고 있습니다.
              </p>
            </div>

            <div className="max-w-xs mx-auto space-y-1">
              <Progress value={progress} className="h-2" />
              <p className="text-[11px] text-muted-foreground text-right">{progress}%</p>
            </div>
          </div>
        )}

        {/* ────────────────────────────────────
            3. 결과 검수 단계 (단어 탭 vs 본문 탭)
           ──────────────────────────────────── */}
        {step === 'review' && activeView === 'words' && (
          <OcrCandidateList
            initialCandidates={candidates}
            onSaveSelected={handleSaveSelectedWords}
            onCancel={() => setStep('upload')}
          />
        )}

        {step === 'review' && activeView === 'passage' && (
          <OcrPassageReview
            initialPassageText={passageText}
            sentences={sentences}
            onSavePassage={handleSavePassage}
            onCancel={() => setStep('upload')}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}
