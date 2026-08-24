'use client';

import { useState, useEffect } from 'react';
import { Loader2, Sparkles, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { CreatePassageInput } from '../types/passageTypes';
import { translatePassageWithSentences } from '@/lib/ai/geminiService';

interface PassageFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: CreatePassageInput) => Promise<void>;
  initialData?: Partial<CreatePassageInput>;
  mode?: 'create' | 'edit';
}

export function PassageFormDialog({
  open,
  onOpenChange,
  onSubmit,
  initialData,
  mode = 'create',
}: PassageFormDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isTranslating, setIsTranslating] = useState(false);
  const [translationSuccessMessage, setTranslationSuccessMessage] = useState('');
  const [error, setError] = useState('');

  const [title, setTitle] = useState(initialData?.title ?? '');
  const [content, setContent] = useState(initialData?.content ?? '');
  const [translation, setTranslation] = useState(initialData?.translation ?? '');
  const [sentenceTranslations, setSentenceTranslations] = useState<string[]>(
    initialData?.sentenceTranslations ?? []
  );
  const [difficulty, setDifficulty] = useState(initialData?.difficulty ?? 2);
  const [source, setSource] = useState(initialData?.source ?? '');

  useEffect(() => {
    if (open) {
      setError('');
      setTranslationSuccessMessage('');
      if (initialData) {
        setTitle(initialData.title ?? '');
        setContent(initialData.content ?? '');
        setTranslation(initialData.translation ?? '');
        setSentenceTranslations(initialData.sentenceTranslations ?? []);
        setDifficulty(initialData.difficulty ?? 2);
        setSource(initialData.source ?? '');
      } else {
        setTitle('');
        setContent('');
        setTranslation('');
        setSentenceTranslations([]);
        setDifficulty(2);
        setSource('교재 지문');
      }
    }
  }, [open, initialData]);

  // AI 자동 번역 및 문장별 분석 실행
  const handleAiTranslate = async () => {
    const cleanContent = content.trim();
    if (!cleanContent) {
      setError('먼저 영어 본문 내용을 입력해주세요.');
      return;
    }

    setError('');
    setIsTranslating(true);
    setTranslationSuccessMessage('');

    try {
      const res = await translatePassageWithSentences(cleanContent);
      if (res && res.fullTranslation) {
        setTranslation(res.fullTranslation);
        if (res.sentenceTranslations && res.sentenceTranslations.length > 0) {
          setSentenceTranslations(res.sentenceTranslations);
        }
        setTranslationSuccessMessage('✨ AI 번역 및 문장별 1:1 해석이 생성되었습니다.');
      } else {
        setError('AI 번역을 생성하지 못했습니다. 직접 입력해주세요.');
      }
    } catch {
      setError('AI 번역 처리 중 오류가 발생했습니다.');
    } finally {
      setIsTranslating(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const cleanTitle = title.trim() || '영어 지문 ' + new Date().toLocaleDateString('ko-KR');
    const cleanContent = content.trim();

    if (!cleanContent) {
      setError('영어 본문 내용을 입력하세요.');
      return;
    }

    setIsSubmitting(true);
    try {
      await onSubmit({
        title: cleanTitle,
        content: cleanContent,
        translation: translation.trim() || undefined,
        sentenceTranslations: sentenceTranslations.length > 0 ? sentenceTranslations : undefined,
        difficulty,
        source: source.trim() || '교재 지문',
      });
      onOpenChange(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : '오류가 발생했습니다.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {mode === 'create' ? '새 영어 독해 지문 등록' : '독해 지문 수정'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive font-medium">
              {error}
            </div>
          )}

          {/* 제목 & 출처 */}
          <div className="grid grid-cols-3 gap-2">
            <div className="col-span-2 space-y-1.5">
              <Label htmlFor="pform-title">
                지문 제목 <span className="text-destructive">*</span>
              </Label>
              <Input
                id="pform-title"
                placeholder="예: The Power of Habit"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                autoFocus
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="pform-source">출처</Label>
              <Input
                id="pform-source"
                placeholder="2026 수능특강 등"
                value={source}
                onChange={(e) => setSource(e.target.value)}
              />
            </div>
          </div>

          {translationSuccessMessage && (
            <div className="flex items-center gap-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20 px-3 py-2 text-xs text-emerald-600 dark:text-emerald-400 font-medium animate-in fade-in">
              <CheckCircle2 className="h-4 w-4 shrink-0" />
              <span>{translationSuccessMessage}</span>
            </div>
          )}

          {/* 영어 본문 & AI 번역 버튼 */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <Label htmlFor="pform-content">
                영어 본문 <span className="text-destructive">*</span>
              </Label>
              <Button
                type="button"
                size="sm"
                variant="secondary"
                disabled={isTranslating || !content.trim()}
                onClick={handleAiTranslate}
                className="h-7 px-2.5 text-xs font-bold gap-1 border border-primary/30 text-primary hover:bg-primary/10"
              >
                {isTranslating ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Sparkles className="h-3.5 w-3.5 text-amber-500" />
                )}
                AI 자동 번역 & 문장 분석
              </Button>
            </div>
            <Textarea
              id="pform-content"
              placeholder="영어 문장 및 단락을 입력하세요..."
              value={content}
              onChange={(e) => {
                setContent(e.target.value);
                setTranslationSuccessMessage('');
              }}
              rows={8}
              className="text-xs leading-relaxed font-sans"
            />
            <p className="text-[11px] text-muted-foreground">
              본문을 입력하고 <strong className="text-primary font-semibold">AI 자동 번역 & 문장 분석</strong>을 누르면 전체 번역 및 문장별 해석이 자동 완성됩니다.
            </p>
          </div>

          {/* 한글 해석 */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <Label htmlFor="pform-trans">한글 번역/해석 (선택)</Label>
              {sentenceTranslations.length > 0 && (
                <span className="text-[10px] text-primary font-semibold bg-primary/10 px-2 py-0.5 rounded">
                  {sentenceTranslations.length}개 문장 1:1 해석 준비됨
                </span>
              )}
            </div>
            <Textarea
              id="pform-trans"
              placeholder="지문의 한국어 번역이나 해석을 입력하세요..."
              value={translation}
              onChange={(e) => setTranslation(e.target.value)}
              rows={3}
              className="text-xs leading-relaxed font-sans"
            />
          </div>

          {/* 난이도 */}
          <div className="space-y-1.5">
            <Label htmlFor="pform-diff">난이도</Label>
            <Select
              value={String(difficulty)}
              onValueChange={(v) => setDifficulty(v ? Number(v) : 2)}
            >
              <SelectTrigger id="pform-diff">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1">⭐ 기초 (중학/고1 기본)</SelectItem>
                <SelectItem value="2">⭐⭐ 기본 (고1-고2 수준)</SelectItem>
                <SelectItem value="3">⭐⭐⭐ 실전 (수능/모의고사)</SelectItem>
                <SelectItem value="4">⭐⭐⭐⭐ 심화 (고난도 킬러 문항)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* 버튼 */}
          <div className="flex gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              className="flex-1"
              onClick={() => onOpenChange(false)}
            >
              취소
            </Button>
            <Button type="submit" className="flex-1 font-bold" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
                  저장 중...
                </>
              ) : mode === 'create' ? (
                '지문 등록'
              ) : (
                '수정 완료'
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
