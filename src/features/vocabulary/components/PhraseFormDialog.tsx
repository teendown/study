'use client';

import { useState } from 'react';
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
import type { CreatePhraseInput } from '../schemas/phraseSchemas';

interface PhraseFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: CreatePhraseInput) => Promise<void>;
  initialData?: Partial<CreatePhraseInput>;
  mode?: 'create' | 'edit';
}

export function PhraseFormDialog({
  open,
  onOpenChange,
  onSubmit,
  initialData,
  mode = 'create',
}: PhraseFormDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const [phrase, setPhrase] = useState(initialData?.phrase ?? '');
  const [meaning, setMeaning] = useState(initialData?.meaning ?? '');
  const [exampleSentence, setExampleSentence] = useState(initialData?.exampleSentence ?? '');
  const [exampleTranslation, setExampleTranslation] = useState(initialData?.exampleTranslation ?? '');
  const [difficulty, setDifficulty] = useState(initialData?.difficulty ?? 1);
  const [source, setSource] = useState(initialData?.source ?? '');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!phrase.trim()) {
      setError('숙어를 입력하세요.');
      return;
    }
    if (!meaning.trim()) {
      setError('뜻을 입력하세요.');
      return;
    }

    setIsSubmitting(true);
    try {
      await onSubmit({
        phrase: phrase.trim(),
        meaning: meaning.trim(),
        exampleSentence: exampleSentence.trim(),
        exampleTranslation: exampleTranslation.trim(),
        difficulty,
        source: source.trim(),
      });

      if (mode === 'create') {
        setPhrase('');
        setMeaning('');
        setExampleSentence('');
        setExampleTranslation('');
        setDifficulty(1);
        setSource('');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : '오류가 발생했습니다.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {mode === 'create' ? '새 숙어 추가' : '숙어 수정'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive font-medium">
              {error}
            </div>
          )}

          {/* 필수: 숙어 */}
          <div className="space-y-1.5">
            <Label htmlFor="form-phrase">
              숙어 <span className="text-destructive">*</span>
            </Label>
            <Input
              id="form-phrase"
              placeholder="look forward to"
              value={phrase}
              onChange={(e) => setPhrase(e.target.value)}
              autoFocus
            />
          </div>

          {/* 필수: 뜻 */}
          <div className="space-y-1.5">
            <Label htmlFor="form-phrase-meaning">
              뜻 <span className="text-destructive">*</span>
            </Label>
            <Input
              id="form-phrase-meaning"
              placeholder="~를 고대하다, 기대하다"
              value={meaning}
              onChange={(e) => setMeaning(e.target.value)}
            />
          </div>

          {/* 예문 */}
          <div className="space-y-1.5">
            <Label htmlFor="form-phrase-example">예문</Label>
            <Textarea
              id="form-phrase-example"
              placeholder="I look forward to hearing from you."
              value={exampleSentence}
              onChange={(e) => setExampleSentence(e.target.value)}
              rows={2}
            />
          </div>

          {/* 예문 해석 */}
          <div className="space-y-1.5">
            <Label htmlFor="form-phrase-trans">예문 해석</Label>
            <Input
              id="form-phrase-trans"
              placeholder="당신의 소식을 듣기를 고대합니다."
              value={exampleTranslation}
              onChange={(e) => setExampleTranslation(e.target.value)}
            />
          </div>

          {/* 난이도 & 출처 */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="form-phrase-diff">난이도</Label>
              <Select
                value={String(difficulty)}
                onValueChange={(v) => setDifficulty(v ? Number(v) : 1)}
              >
                <SelectTrigger id="form-phrase-diff">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">⭐ 기초</SelectItem>
                  <SelectItem value="2">⭐⭐ 쉬움</SelectItem>
                  <SelectItem value="3">⭐⭐⭐ 필수</SelectItem>
                  <SelectItem value="4">⭐⭐⭐⭐ 심화</SelectItem>
                  <SelectItem value="5">⭐⭐⭐⭐⭐ 고난도</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="form-phrase-source">출처</Label>
              <Input
                id="form-phrase-source"
                placeholder="교과서, 수능 등"
                value={source}
                onChange={(e) => setSource(e.target.value)}
              />
            </div>
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
                '추가'
              ) : (
                '저장'
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
