'use client';

import { useState, useEffect } from 'react';
import { Loader2 } from 'lucide-react';
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
  const [error, setError] = useState('');

  const [title, setTitle] = useState(initialData?.title ?? '');
  const [content, setContent] = useState(initialData?.content ?? '');
  const [translation, setTranslation] = useState(initialData?.translation ?? '');
  const [difficulty, setDifficulty] = useState(initialData?.difficulty ?? 2);
  const [source, setSource] = useState(initialData?.source ?? '');

  useEffect(() => {
    if (open) {
      setError('');
      if (initialData) {
        setTitle(initialData.title ?? '');
        setContent(initialData.content ?? '');
        setTranslation(initialData.translation ?? '');
        setDifficulty(initialData.difficulty ?? 2);
        setSource(initialData.source ?? '');
      } else {
        setTitle('');
        setContent('');
        setTranslation('');
        setDifficulty(2);
        setSource('교재 지문');
      }
    }
  }, [open, initialData]);

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

          {/* 영어 본문 */}
          <div className="space-y-1.5">
            <Label htmlFor="pform-content">
              영어 본문 <span className="text-destructive">*</span>
            </Label>
            <Textarea
              id="pform-content"
              placeholder="영어 문장 및 단락을 입력하세요..."
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={8}
              className="text-xs leading-relaxed font-sans"
            />
          </div>

          {/* 한글 해석 */}
          <div className="space-y-1.5">
            <Label htmlFor="pform-trans">한글 번역/해석 (선택)</Label>
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
