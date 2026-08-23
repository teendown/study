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
import type { CreateVocabularyInput } from '@/features/vocabulary/schemas';

interface VocabularyFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: CreateVocabularyInput) => Promise<void>;
  initialData?: Partial<CreateVocabularyInput>;
  mode?: 'create' | 'edit';
}

/**
 * 단어 등록/수정 다이얼로그
 */
export function VocabularyFormDialog({
  open,
  onOpenChange,
  onSubmit,
  initialData,
  mode = 'create',
}: VocabularyFormDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!word.trim()) {
      setError('단어를 입력하세요.');
      return;
    }
    if (!meaning.trim()) {
      setError('뜻을 입력하세요.');
      return;
    }

    setIsSubmitting(true);
    try {
      await onSubmit({
        word: word.trim(),
        meaning: meaning.trim(),
        partOfSpeech: partOfSpeech.trim(),
        pronunciation: pronunciation.trim(),
        exampleSentence: exampleSentence.trim(),
        exampleTranslation: exampleTranslation.trim(),
        synonyms: synonyms.trim(),
        antonyms: antonyms.trim(),
        difficulty,
        source: source.trim(),
      });

      // 성공 시 폼 초기화 (create 모드만)
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
            {mode === 'create' ? '새 단어 추가' : '단어 수정'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* 에러 메시지 */}
          {error && (
            <div className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {error}
            </div>
          )}

          {/* 필수: 단어 */}
          <div className="space-y-1.5">
            <Label htmlFor="form-word">
              단어 <span className="text-destructive">*</span>
            </Label>
            <Input
              id="form-word"
              placeholder="abandon"
              value={word}
              onChange={(e) => setWord(e.target.value)}
              autoFocus
            />
          </div>

          {/* 필수: 뜻 */}
          <div className="space-y-1.5">
            <Label htmlFor="form-meaning">
              뜻 <span className="text-destructive">*</span>
            </Label>
            <Input
              id="form-meaning"
              placeholder="포기하다, 버리다"
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
                placeholder="[əˈbændən]"
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
              placeholder="He decided to abandon the plan."
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
              placeholder="그는 그 계획을 포기하기로 결정했다."
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
                placeholder="give up, quit"
                value={synonyms}
                onChange={(e) => setSynonyms(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="form-antonyms">반의어</Label>
              <Input
                id="form-antonyms"
                placeholder="keep, maintain"
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

          {/* 제출 버튼 */}
          <div className="flex gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              className="flex-1"
              onClick={() => onOpenChange(false)}
            >
              취소
            </Button>
            <Button
              type="submit"
              className="flex-1"
              disabled={isSubmitting}
            >
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
