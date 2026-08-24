'use client';

import { useState, useEffect, useRef } from 'react';
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
import {
  searchPhraseOnlineAction,
  getStoredPhrases,
  updatePhraseAction,
} from '../services';
import type { CreatePhraseInput } from '../schemas/phraseSchemas';
import type { PhraseWithItem } from '../types/phraseTypes';
import { DuplicateChoiceDialog, type DuplicateActionType } from './DuplicateChoiceDialog';

interface PhraseFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: CreatePhraseInput, allowDuplicate?: boolean) => Promise<void>;
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
  const [isSearchingOnline, setIsSearchingOnline] = useState(false);
  const [searchSuccessMessage, setSearchSuccessMessage] = useState('');
  const [error, setError] = useState('');

  // 중복 선택 다이얼로그 상태
  const [duplicateDialogOpen, setDuplicateDialogOpen] = useState(false);
  const [duplicateTarget, setDuplicateTarget] = useState<PhraseWithItem | null>(null);
  const [pendingInput, setPendingInput] = useState<CreatePhraseInput | null>(null);

  const [phrase, setPhrase] = useState(initialData?.phrase ?? '');
  const [meaning, setMeaning] = useState(initialData?.meaning ?? '');
  const [exampleSentence, setExampleSentence] = useState(initialData?.exampleSentence ?? '');
  const [exampleTranslation, setExampleTranslation] = useState(initialData?.exampleTranslation ?? '');
  const [difficulty, setDifficulty] = useState(initialData?.difficulty ?? 1);
  const [source, setSource] = useState(initialData?.source ?? '');

  const lastSearchedPhrase = useRef<string>('');

  useEffect(() => {
    if (open) {
      setError('');
      setSearchSuccessMessage('');
      setDuplicateDialogOpen(false);
      setDuplicateTarget(null);
      setPendingInput(null);
      if (initialData) {
        setPhrase(initialData.phrase ?? '');
        setMeaning(initialData.meaning ?? '');
        setExampleSentence(initialData.exampleSentence ?? '');
        setExampleTranslation(initialData.exampleTranslation ?? '');
        setDifficulty(initialData.difficulty ?? 1);
        setSource(initialData.source ?? '');
        lastSearchedPhrase.current = initialData.phrase ?? '';
      } else {
        setPhrase('');
        setMeaning('');
        setExampleSentence('');
        setExampleTranslation('');
        setDifficulty(1);
        setSource('');
        lastSearchedPhrase.current = '';
      }
    }
  }, [open, initialData]);

  // 숙어 온라인 자동 검색
  const executeSearch = async (targetPhrase: string, isManual = false) => {
    const clean = targetPhrase.trim();
    if (!clean) {
      if (isManual) setError('검색할 숙어를 먼저 입력해주세요.');
      return;
    }
    if (!isManual && clean === lastSearchedPhrase.current) {
      return;
    }

    setError('');
    setSearchSuccessMessage('');
    setIsSearchingOnline(true);
    lastSearchedPhrase.current = clean;

    try {
      const res = await searchPhraseOnlineAction(clean);
      if (res.success && res.data) {
        const d = res.data;
        if (d.meaning && d.meaning !== '의미 검색 필요') {
          setMeaning(d.meaning);
        }
        if (d.exampleSentence) setExampleSentence(d.exampleSentence);
        if (d.exampleTranslation) setExampleTranslation(d.exampleTranslation);
        if (d.source) setSource(d.source);

        setSearchSuccessMessage(
          d.source ? `✨ [${d.source}] 숙어 정보가 자동 입력되었습니다.` : '✨ 숙어 정보가 자동 입력되었습니다.'
        );
      } else if (!res.success) {
        if (isManual) setError(res.error || '숙어 정보를 찾지 못했습니다.');
      }
    } catch {
      if (isManual) setError('숙어 검색 중 오류가 발생했습니다.');
    } finally {
      setIsSearchingOnline(false);
    }
  };

  // ⚡ 숙어 입력 중 300ms 디바운스 실시간 자동 검색
  useEffect(() => {
    if (!open || mode !== 'create') return;
    const clean = phrase.trim();
    if (clean.length < 3) return;

    const timer = setTimeout(() => {
      executeSearch(clean, false);
    }, 300);

    return () => clearTimeout(timer);
  }, [phrase, open, mode]);

  const handleManualSearch = () => {
    executeSearch(phrase, true);
  };

  const handlePhraseBlur = () => {
    if (phrase.trim().length >= 3 && !meaning.trim()) {
      executeSearch(phrase, false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const cleanPhrase = phrase.trim();
    if (!cleanPhrase) {
      setError('숙어를 입력하세요.');
      return;
    }

    setIsSubmitting(true);

    let finalMeaning = meaning.trim();
    let finalEx = exampleSentence.trim();
    let finalExTrans = exampleTranslation.trim();
    let finalSource = source.trim();

    if (!finalMeaning || finalMeaning === '의미 미입력' || finalMeaning === '의미 검색 필요') {
      try {
        const res = await searchPhraseOnlineAction(cleanPhrase);
        if (res.success && res.data && res.data.meaning && res.data.meaning !== '의미 검색 필요') {
          finalMeaning = res.data.meaning;
          if (!finalEx && res.data.exampleSentence) finalEx = res.data.exampleSentence;
          if (!finalExTrans && res.data.exampleTranslation) finalExTrans = res.data.exampleTranslation;
          if (!finalSource && res.data.source) finalSource = res.data.source;
        }
      } catch {}
    }

    if (!finalMeaning) {
      setError('뜻을 입력하세요.');
      setIsSubmitting(false);
      return;
    }

    const payload: CreatePhraseInput = {
      phrase: cleanPhrase,
      meaning: finalMeaning,
      exampleSentence: finalEx,
      exampleTranslation: finalExTrans,
      difficulty,
      source: finalSource,
    };

    // ⚡ 신규 등록 시 중복 숙어 체크
    if (mode === 'create') {
      const allPhrases = getStoredPhrases();
      const existing = allPhrases.find(
        (p) => p.phrase.toLowerCase() === cleanPhrase.toLowerCase()
      );

      if (existing) {
        setIsSubmitting(false);
        setDuplicateTarget(existing);
        setPendingInput(payload);
        setDuplicateDialogOpen(true);
        return;
      }
    }

    try {
      await onSubmit(payload);
      if (mode === 'create') {
        setPhrase('');
        setMeaning('');
        setExampleSentence('');
        setExampleTranslation('');
        setDifficulty(1);
        setSource('');
        lastSearchedPhrase.current = '';
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : '오류가 발생했습니다.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // ⚡ 중복 숙어 처리
  const handleDuplicateAction = async (action: DuplicateActionType) => {
    if (!pendingInput || !duplicateTarget) return;

    if (action === 'skip') {
      onOpenChange(false);
      return;
    }

    if (action === 'update') {
      try {
        setIsSubmitting(true);
        await updatePhraseAction(duplicateTarget.id, pendingInput);
        onOpenChange(false);
        await onSubmit(pendingInput, true);
      } catch (err) {
        setError(err instanceof Error ? err.message : '숙어 수정 중 오류가 발생했습니다.');
      } finally {
        setIsSubmitting(false);
      }
      return;
    }

    if (action === 'save_as_new') {
      try {
        setIsSubmitting(true);
        await onSubmit(pendingInput, true);
        onOpenChange(false);
      } catch (err) {
        setError(err instanceof Error ? err.message : '숙어 추가 중 오류가 발생했습니다.');
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  return (
    <>
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

            {searchSuccessMessage && (
              <div className="flex items-center gap-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20 px-3 py-2 text-xs text-emerald-600 dark:text-emerald-400 font-medium animate-in fade-in">
                <CheckCircle2 className="h-4 w-4 shrink-0" />
                <span>{searchSuccessMessage}</span>
              </div>
            )}

            {/* 필수: 숙어 & 자동 검색 */}
            <div className="space-y-1.5">
              <Label htmlFor="form-phrase">
                숙어 <span className="text-destructive">*</span>
              </Label>
              <div className="flex gap-2">
                <Input
                  id="form-phrase"
                  placeholder="예: look forward to, take care of"
                  value={phrase}
                  onChange={(e) => {
                    setPhrase(e.target.value);
                    setSearchSuccessMessage('');
                  }}
                  onBlur={handlePhraseBlur}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleManualSearch();
                    }
                  }}
                  autoFocus
                  className="text-base font-semibold"
                />
                <Button
                  type="button"
                  variant="secondary"
                  className="font-bold gap-1.5 shrink-0 border border-primary/30 hover:bg-primary/10 text-primary"
                  onClick={handleManualSearch}
                  disabled={isSearchingOnline || !phrase.trim()}
                >
                  {isSearchingOnline ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Sparkles className="h-4 w-4" />
                  )}
                  자동 검색
                </Button>
              </div>
              <p className="text-[11px] text-muted-foreground">
                숙어 입력 후 <kbd className="px-1 py-0.5 rounded bg-muted text-[10px]">Enter</kbd> 또는 [자동 검색]을 누르면 뜻과 예문이 자동 완성됩니다.
              </p>
            </div>

            {/* 필수: 뜻 */}
            <div className="space-y-1.5">
              <Label htmlFor="form-phrase-meaning">
                뜻 <span className="text-destructive">*</span>
              </Label>
              <Input
                id="form-phrase-meaning"
                placeholder="예: ~를 고대하다, 기대하다"
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
                <Label htmlFor="form-phrase-difficulty">난이도</Label>
                <Select
                  value={String(difficulty)}
                  onValueChange={(v) => setDifficulty(v ? Number(v) : 1)}
                >
                  <SelectTrigger id="form-phrase-difficulty">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">⭐ 매우 쉬움</SelectItem>
                    <SelectItem value="2">⭐⭐ 쉬움</SelectItem>
                    <SelectItem value="3">⭐⭐⭐ 보통</SelectItem>
                    <SelectItem value="4">⭐⭐⭐⭐ 어려움</SelectItem>
                    <SelectItem value="5">⭐⭐⭐⭐⭐ 매우 어려움</SelectItem>
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

      {/* ⚠️ 중복 숙어 발생 시 선택 다이얼로그 (건너뛰기 / 수정 / 새로 저장) */}
      <DuplicateChoiceDialog
        open={duplicateDialogOpen}
        onOpenChange={setDuplicateDialogOpen}
        type="phrase"
        title={duplicateTarget?.phrase || ''}
        existingMeaning={duplicateTarget?.meaning}
        newMeaning={pendingInput?.meaning}
        onSelectAction={handleDuplicateAction}
      />
    </>
  );
}
