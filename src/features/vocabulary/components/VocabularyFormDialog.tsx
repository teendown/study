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
  searchWordOnlineAction,
  getStoredVocabs,
  updateVocabularyAction,
} from '../services';
import type { CreateVocabularyInput } from '../schemas';
import type { VocabularyWithItem } from '../types';
import { DuplicateChoiceDialog, type DuplicateActionType } from './DuplicateChoiceDialog';

interface VocabularyFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: CreateVocabularyInput, allowDuplicate?: boolean) => Promise<void>;
  initialData?: Partial<CreateVocabularyInput>;
  mode?: 'create' | 'edit';
}

export function VocabularyFormDialog({
  open,
  onOpenChange,
  onSubmit,
  initialData,
  mode = 'create',
}: VocabularyFormDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSearchingOnline, setIsSearchingOnline] = useState(false);
  const [searchSuccessMessage, setSearchSuccessMessage] = useState('');
  const [error, setError] = useState('');

  // 중복 선택 다이얼로그 상태
  const [duplicateDialogOpen, setDuplicateDialogOpen] = useState(false);
  const [duplicateTarget, setDuplicateTarget] = useState<VocabularyWithItem | null>(null);
  const [pendingInput, setPendingInput] = useState<CreateVocabularyInput | null>(null);

  const [word, setWord] = useState(initialData?.word ?? '');
  const [meaning, setMeaning] = useState(initialData?.meaning ?? '');
  const [partOfSpeech, setPartOfSpeech] = useState(initialData?.partOfSpeech ?? '');
  const [pronunciation, setPronunciation] = useState(initialData?.pronunciation ?? '');
  const [exampleSentence, setExampleSentence] = useState(initialData?.exampleSentence ?? '');
  const [exampleTranslation, setExampleTranslation] = useState(initialData?.exampleTranslation ?? '');
  const [synonyms, setSynonyms] = useState(initialData?.synonyms ?? '');
  const [antonyms, setAntonyms] = useState(initialData?.antonyms ?? '');
  const [difficulty, setDifficulty] = useState(initialData?.difficulty ?? 1);
  const [source, setSource] = useState(initialData?.source ?? '');

  const lastSearchedWord = useRef<string>('');

  // Dialog가 열릴 때 상태 초기화
  useEffect(() => {
    if (open) {
      setError('');
      setSearchSuccessMessage('');
      setDuplicateDialogOpen(false);
      setDuplicateTarget(null);
      setPendingInput(null);
      if (initialData) {
        setWord(initialData.word ?? '');
        setMeaning(initialData.meaning ?? '');
        setPartOfSpeech(initialData.partOfSpeech ?? '');
        setPronunciation(initialData.pronunciation ?? '');
        setExampleSentence(initialData.exampleSentence ?? '');
        setExampleTranslation(initialData.exampleTranslation ?? '');
        setSynonyms(initialData.synonyms ?? '');
        setAntonyms(initialData.antonyms ?? '');
        setDifficulty(initialData.difficulty ?? 1);
        setSource(initialData.source ?? '');
        lastSearchedWord.current = initialData.word ?? '';
      } else {
        setWord('');
        setMeaning('');
        setPartOfSpeech('');
        setPronunciation('');
        setExampleSentence('');
        setExampleTranslation('');
        setSynonyms('');
        setAntonyms('');
        setDifficulty(1);
        setSource('');
        lastSearchedWord.current = '';
      }
    }
  }, [open, initialData]);

  // 실시간 온라인 사전 자동 검색
  const executeSearch = async (targetWord: string, isManual = false) => {
    const clean = targetWord.trim();
    if (!clean) {
      if (isManual) setError('검색할 영어 단어를 먼저 입력해주세요.');
      return;
    }
    if (!isManual && clean.toLowerCase() === lastSearchedWord.current.toLowerCase()) {
      return;
    }

    setError('');
    setSearchSuccessMessage('');
    setIsSearchingOnline(true);
    lastSearchedWord.current = clean;

    try {
      const res = await searchWordOnlineAction(clean);
      if (res.success && res.data) {
        const d = res.data;
        if (d.meaning && d.meaning !== '의미 검색 필요') {
          setMeaning(d.meaning);
        }
        if (d.partOfSpeech) setPartOfSpeech(d.partOfSpeech);
        if (d.pronunciation) setPronunciation(d.pronunciation);
        if (d.exampleSentence) setExampleSentence(d.exampleSentence);
        if (d.exampleTranslation) setExampleTranslation(d.exampleTranslation);
        if (d.synonyms) setSynonyms(d.synonyms);
        if (d.antonyms) setAntonyms(d.antonyms);
        if (d.source) setSource(d.source);

        setSearchSuccessMessage(
          d.source ? `✨ [${d.source}] 정보가 자동 입력되었습니다.` : '✨ 단어 정보가 자동 입력되었습니다.'
        );
      } else if (!res.success) {
        if (isManual) setError(res.error || '단어 정보를 찾지 못했습니다.');
      }
    } catch {
      if (isManual) setError('사전 검색 중 오류가 발생했습니다.');
    } finally {
      setIsSearchingOnline(false);
    }
  };

  // ⚡ 단어 입력 중 300ms 디바운스 실시간 자동 검색
  useEffect(() => {
    if (!open || mode !== 'create') return;
    const clean = word.trim();
    if (clean.length < 2) return;

    const timer = setTimeout(() => {
      executeSearch(clean, false);
    }, 300);

    return () => clearTimeout(timer);
  }, [word, open, mode]);

  const handleManualSearch = () => {
    executeSearch(word, true);
  };

  const handleWordBlur = () => {
    if (word.trim().length >= 2 && !meaning.trim()) {
      executeSearch(word, false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const cleanWord = word.trim();
    if (!cleanWord) {
      setError('단어를 입력하세요.');
      return;
    }

    setIsSubmitting(true);

    let finalMeaning = meaning.trim();
    let finalPos = partOfSpeech.trim();
    let finalPron = pronunciation.trim();
    let finalEx = exampleSentence.trim();
    let finalExTrans = exampleTranslation.trim();
    let finalSyn = synonyms.trim();
    let finalAnt = antonyms.trim();
    let finalSource = source.trim();

    // 만약 뜻이 아직 비어있다면 제출 직전 즉시 자동 검색 실행
    if (!finalMeaning || finalMeaning === '의미 미입력' || finalMeaning === '의미 검색 필요') {
      try {
        const res = await searchWordOnlineAction(cleanWord);
        if (res.success && res.data && res.data.meaning && res.data.meaning !== '의미 검색 필요') {
          finalMeaning = res.data.meaning;
          if (!finalPos && res.data.partOfSpeech) finalPos = res.data.partOfSpeech;
          if (!finalPron && res.data.pronunciation) finalPron = res.data.pronunciation;
          if (!finalEx && res.data.exampleSentence) finalEx = res.data.exampleSentence;
          if (!finalExTrans && res.data.exampleTranslation) finalExTrans = res.data.exampleTranslation;
          if (!finalSyn && res.data.synonyms) finalSyn = res.data.synonyms;
          if (!finalAnt && res.data.antonyms) finalAnt = res.data.antonyms;
          if (!finalSource && res.data.source) finalSource = res.data.source;
        }
      } catch {}
    }

    if (!finalMeaning) {
      setError('뜻을 입력하세요.');
      setIsSubmitting(false);
      return;
    }

    const payload: CreateVocabularyInput = {
      word: cleanWord,
      meaning: finalMeaning,
      partOfSpeech: finalPos,
      pronunciation: finalPron,
      exampleSentence: finalEx,
      exampleTranslation: finalExTrans,
      synonyms: finalSyn,
      antonyms: finalAnt,
      difficulty,
      source: finalSource,
    };

    // ⚡ 신규 등록 시 중복 단어 사전 체크
    if (mode === 'create') {
      const allVocabs = getStoredVocabs();
      const existing = allVocabs.find(
        (v) => v.word.toLowerCase() === cleanWord.toLowerCase()
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
        setWord('');
        setMeaning('');
        setPartOfSpeech('');
        setPronunciation('');
        setExampleSentence('');
        setExampleTranslation('');
        setSynonyms('');
        setAntonyms('');
        setDifficulty(1);
        setSource('');
        lastSearchedWord.current = '';
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : '오류가 발생했습니다.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // ⚡ 중복 단어 발생 시 3가지 선택 처리 (건너뛰기 / 수정 / 새로 저장)
  const handleDuplicateAction = async (action: DuplicateActionType) => {
    if (!pendingInput || !duplicateTarget) return;

    if (action === 'skip') {
      // 1. 건너뛰기: 모달 닫기
      onOpenChange(false);
      return;
    }

    if (action === 'update') {
      // 2. 기존 단어 수정 (덮어쓰기)
      try {
        setIsSubmitting(true);
        await updateVocabularyAction(duplicateTarget.id, pendingInput);
        onOpenChange(false);
        // 부모 페이지 다시 로드 트리거를 위해 onSubmit 호출
        await onSubmit(pendingInput, true);
      } catch (err) {
        setError(err instanceof Error ? err.message : '단어 수정 중 오류가 발생했습니다.');
      } finally {
        setIsSubmitting(false);
      }
      return;
    }

    if (action === 'save_as_new') {
      // 3. 새로 추가 저장 (중복 허용 등록)
      try {
        setIsSubmitting(true);
        await onSubmit(pendingInput, true);
        onOpenChange(false);
      } catch (err) {
        setError(err instanceof Error ? err.message : '단어 추가 중 오류가 발생했습니다.');
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
              {mode === 'create' ? '새 단어 추가' : '단어 수정'}
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

            {/* 단어 입력 & 사전 자동 검색 버튼 */}
            <div className="space-y-1.5">
              <Label htmlFor="form-word">
                단어 <span className="text-destructive">*</span>
              </Label>
              <div className="flex gap-2">
                <Input
                  id="form-word"
                  placeholder="예: apple, hesitate, resilient"
                  value={word}
                  onChange={(e) => {
                    setWord(e.target.value);
                    setSearchSuccessMessage('');
                  }}
                  onBlur={handleWordBlur}
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
                  disabled={isSearchingOnline || !word.trim()}
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
                단어를 입력하면 뜻, 발음, 예문이 <strong className="text-primary font-semibold">실시간 자동 완성</strong>됩니다.
              </p>
            </div>

            {/* 필수: 뜻 */}
            <div className="space-y-1.5">
              <Label htmlFor="form-meaning">
                뜻 <span className="text-destructive">*</span>
              </Label>
              <Input
                id="form-meaning"
                placeholder="예: 사과, 망설이다"
                value={meaning}
                onChange={(e) => setMeaning(e.target.value)}
              />
            </div>

            {/* 품사 & 발음 */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="form-pos">품사</Label>
                <Select value={partOfSpeech} onValueChange={(val) => setPartOfSpeech(val ?? '')}>
                  <SelectTrigger id="form-pos">
                    <SelectValue placeholder="선택" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="n.">명사 (n.)</SelectItem>
                    <SelectItem value="v.">동사 (v.)</SelectItem>
                    <SelectItem value="adj.">형용사 (adj.)</SelectItem>
                    <SelectItem value="adv.">부사 (adv.)</SelectItem>
                    <SelectItem value="prep.">전치사 (prep.)</SelectItem>
                    <SelectItem value="conj.">접속사 (conj.)</SelectItem>
                    <SelectItem value="phr.">숙어 (phr.)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="form-pronunciation">발음</Label>
                <Input
                  id="form-pronunciation"
                  placeholder="[애플]"
                  value={pronunciation}
                  onChange={(e) => setPronunciation(e.target.value)}
                />
              </div>
            </div>

            {/* 예문 */}
            <div className="space-y-1.5">
              <Label htmlFor="form-example">예문</Label>
              <Textarea
                id="form-example"
                placeholder="An apple a day keeps the doctor away."
                value={exampleSentence}
                onChange={(e) => setExampleSentence(e.target.value)}
                rows={2}
              />
            </div>

            {/* 예문 해석 */}
            <div className="space-y-1.5">
              <Label htmlFor="form-example-trans">예문 해석</Label>
              <Input
                id="form-example-trans"
                placeholder="하루 사과 한 개는 의사를 멀리한다."
                value={exampleTranslation}
                onChange={(e) => setExampleTranslation(e.target.value)}
              />
            </div>

            {/* 유의어 & 반의어 */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="form-synonyms">유의어</Label>
                <Input
                  id="form-synonyms"
                  placeholder="important, notable"
                  value={synonyms}
                  onChange={(e) => setSynonyms(e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="form-antonyms">반의어</Label>
                <Input
                  id="form-antonyms"
                  placeholder="insignificant, trivial"
                  value={antonyms}
                  onChange={(e) => setAntonyms(e.target.value)}
                />
              </div>
            </div>

            {/* 난이도 & 출처 */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="form-difficulty">난이도</Label>
                <Select
                  value={String(difficulty)}
                  onValueChange={(v) => setDifficulty(v ? Number(v) : 1)}
                >
                  <SelectTrigger id="form-difficulty">
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
                <Label htmlFor="form-source">출처</Label>
                <Input
                  id="form-source"
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

      {/* ⚠️ 중복 단어 발생 시 선택 다이얼로그 (건너뛰기 / 수정 / 새로 저장) */}
      <DuplicateChoiceDialog
        open={duplicateDialogOpen}
        onOpenChange={setDuplicateDialogOpen}
        type="word"
        title={duplicateTarget?.word || ''}
        existingMeaning={duplicateTarget?.meaning}
        newMeaning={pendingInput?.meaning}
        onSelectAction={handleDuplicateAction}
      />
    </>
  );
}
