'use client';

import { useState } from 'react';
import {
  Volume2,
  Pencil,
  Trash2,
  Sparkles,
  Loader2,
  ExternalLink,
  AlertTriangle,
  BookOpen,
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import type { VocabularyWithItem } from '../types';
import { searchWordOnlineAction, updateVocabularyAction } from '../services';
import { detectVocabularyIssues } from '../utils/vocabularyIssueDetector';
import { useBackHandler } from '@/lib/navigation';

interface VocabularyPreviewDialogProps {
  vocab: VocabularyWithItem | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onEdit: (vocab: VocabularyWithItem) => void;
  onDelete: (id: string) => void;
  onVocabUpdated?: (updated: VocabularyWithItem) => void;
}

const difficultyLabels: Record<number, { label: string; color: string }> = {
  1: { label: '⭐ 매우 쉬움', color: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20' },
  2: { label: '⭐⭐ 쉬움', color: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20' },
  3: { label: '⭐⭐⭐ 보통', color: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20' },
  4: { label: '⭐⭐⭐⭐ 어려움', color: 'bg-orange-500/10 text-orange-600 dark:text-orange-400 border-orange-500/20' },
  5: { label: '⭐⭐⭐⭐⭐ 매우 어려움', color: 'bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20' },
};

export function VocabularyPreviewDialog({
  vocab,
  open,
  onOpenChange,
  onEdit,
  onDelete,
  onVocabUpdated,
}: VocabularyPreviewDialogProps) {
  const [isAutoFilling, setIsAutoFilling] = useState(false);

  // 📱 휴대폰 뒤로가기 누를 시 모달 닫기
  useBackHandler(open, () => onOpenChange(false), 'vocab_preview');

  if (!vocab) return null;

  const issueResult = detectVocabularyIssues(vocab);
  const diff = difficultyLabels[vocab.difficulty] ?? difficultyLabels[2];

  const isMissing =
    !vocab.meaning ||
    vocab.meaning === '의미 미입력' ||
    vocab.meaning === '의미 검색 필요' ||
    vocab.meaning === '뜻 미입력' ||
    !vocab.pronunciation ||
    !vocab.exampleSentence;

  const handleSpeak = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(vocab.word);
      utterance.lang = 'en-US';
      utterance.rate = 0.85;
      window.speechSynthesis.speak(utterance);
    }
  };

  const handleAutoFill = async () => {
    setIsAutoFilling(true);
    try {
      const res = await searchWordOnlineAction(vocab.word);
      if (res.success && res.data) {
        const d = res.data;
        const updatedFields = {
          meaning: d.meaning && d.meaning !== '의미 검색 필요' ? d.meaning : vocab.meaning,
          partOfSpeech: (d.partOfSpeech || vocab.partOfSpeech) ?? undefined,
          pronunciation: (d.pronunciation || vocab.pronunciation) ?? undefined,
          exampleSentence: (d.exampleSentence || vocab.exampleSentence) ?? undefined,
          exampleTranslation: (d.exampleTranslation || vocab.exampleTranslation) ?? undefined,
          synonyms: (d.synonyms || vocab.synonyms) ?? undefined,
          antonyms: (d.antonyms || vocab.antonyms) ?? undefined,
          source: (d.source || vocab.source) ?? undefined,
        };
        await updateVocabularyAction(vocab.id, updatedFields);
        const updatedVocab: VocabularyWithItem = {
          ...vocab,
          meaning: updatedFields.meaning,
          partOfSpeech: updatedFields.partOfSpeech ?? null,
          pronunciation: updatedFields.pronunciation ?? null,
          exampleSentence: updatedFields.exampleSentence ?? null,
          exampleTranslation: updatedFields.exampleTranslation ?? null,
          synonyms: updatedFields.synonyms ?? null,
          antonyms: updatedFields.antonyms ?? null,
          source: updatedFields.source ?? null,
          updatedAt: new Date().toISOString(),
        };
        onVocabUpdated?.(updatedVocab);
      }
    } catch {
      alert('단어 정보 자동 검색에 실패했습니다.');
    } finally {
      setIsAutoFilling(false);
    }
  };

  const handleDelete = () => {
    onDelete(vocab.id);
    onOpenChange(false);
  };

  const handleEdit = () => {
    onEdit(vocab);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto p-0 gap-0 border-border bg-card shadow-2xl rounded-2xl">
        {/* 상단 헤더 영역 */}
        <div className="p-5 pb-4 bg-gradient-to-b from-primary/10 via-primary/5 to-transparent border-b border-border/50">
          <DialogHeader className="space-y-1.5">
            <div className="flex items-start justify-between gap-3 pr-6">
              <div className="space-y-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <DialogTitle className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
                    {vocab.word}
                  </DialogTitle>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 rounded-full text-primary hover:bg-primary/20 shrink-0"
                    onClick={handleSpeak}
                    title="발음 듣기"
                  >
                    <Volume2 className="h-4.5 w-4.5" />
                  </Button>
                </div>

                <div className="flex items-center gap-2 flex-wrap text-xs">
                  {vocab.partOfSpeech && (
                    <Badge variant="secondary" className="font-bold px-2 py-0.5 text-primary bg-primary/15">
                      {vocab.partOfSpeech}
                    </Badge>
                  )}
                  {vocab.pronunciation && (
                    <span className="text-muted-foreground font-mono font-medium">
                      {vocab.pronunciation}
                    </span>
                  )}
                  <Badge variant="outline" className={`text-[10px] ${diff.color}`}>
                    {diff.label}
                  </Badge>
                </div>
              </div>
            </div>
          </DialogHeader>
        </div>

        {/* 바디 영역 */}
        <div className="p-5 space-y-4 text-sm">
          {/* 오류/주의사항 배너 */}
          {issueResult.hasIssue && (
            <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-start gap-2.5 text-xs text-amber-900 dark:text-amber-200">
              <AlertTriangle className="h-4 w-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
              <div className="space-y-1 flex-1">
                <p className="font-bold">감지된 표기 오류 / 누락 항목</p>
                <div className="flex flex-wrap gap-1">
                  {issueResult.issues.map((iss, i) => (
                    <span
                      key={i}
                      className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-amber-500/20 text-amber-800 dark:text-amber-300"
                    >
                      {iss.label}: {iss.description}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* 뜻 */}
          <div className="space-y-1">
            <span className="text-xs font-bold text-muted-foreground tracking-wide uppercase">
              한국어 뜻
            </span>
            <p
              className={`text-base font-semibold ${
                !vocab.meaning || vocab.meaning === '의미 검색 필요'
                  ? 'text-amber-500 italic'
                  : 'text-foreground'
              }`}
            >
              {vocab.meaning || '뜻이 등록되지 않았습니다.'}
            </p>
          </div>

          <Separator className="bg-border/60" />

          {/* 예문 & 해석 */}
          {vocab.exampleSentence ? (
            <div className="space-y-1.5 bg-muted/40 p-3.5 rounded-xl border border-border/50">
              <span className="text-xs font-bold text-muted-foreground flex items-center gap-1.5">
                <BookOpen className="h-3.5 w-3.5 text-primary" /> 예문
              </span>
              <p className="text-sm font-medium text-foreground italic leading-relaxed">
                "{vocab.exampleSentence}"
              </p>
              {vocab.exampleTranslation && (
                <p className="text-xs text-muted-foreground leading-normal">
                  {vocab.exampleTranslation}
                </p>
              )}
            </div>
          ) : (
            <p className="text-xs text-muted-foreground/80 italic">등록된 예문이 없습니다.</p>
          )}

          {/* 유의어 / 반의어 */}
          {(vocab.synonyms || vocab.antonyms) && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
              {vocab.synonyms && (
                <div className="p-2.5 rounded-lg bg-muted/30 border border-border/40">
                  <span className="text-[11px] font-bold text-muted-foreground block mb-0.5">
                    유의어 (Synonyms)
                  </span>
                  <p className="text-xs font-medium">{vocab.synonyms}</p>
                </div>
              )}
              {vocab.antonyms && (
                <div className="p-2.5 rounded-lg bg-muted/30 border border-border/40">
                  <span className="text-[11px] font-bold text-muted-foreground block mb-0.5">
                    반의어 (Antonyms)
                  </span>
                  <p className="text-xs font-medium">{vocab.antonyms}</p>
                </div>
              )}
            </div>
          )}

          {/* 네이버 사전 링크 */}
          <div className="pt-2 flex items-center justify-between gap-2 flex-wrap">
            <span className="text-[11px] text-muted-foreground">
              출처: {vocab.source || '직접 등록'}
            </span>
            <a
              href={`https://en.dict.naver.com/#/search?query=${encodeURIComponent(vocab.word)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-600 dark:text-emerald-400 hover:underline bg-emerald-500/10 px-2.5 py-1 rounded-lg"
            >
              네이버 사전에서 검색 <ExternalLink className="h-3 w-3" />
            </a>
          </div>
        </div>

        {/* 하단 버튼 툴바: 수정 / 삭제 / 자동완성 / 닫기 */}
        <div className="p-3.5 bg-muted/50 border-t border-border/60 flex items-center justify-between gap-2 flex-wrap">
          <div className="flex items-center gap-1.5">
            {isMissing && (
              <Button
                type="button"
                variant="secondary"
                size="sm"
                className="h-8.5 font-bold gap-1 text-primary border border-primary/20 bg-primary/10 hover:bg-primary/20 text-xs"
                onClick={handleAutoFill}
                disabled={isAutoFilling}
              >
                {isAutoFilling ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Sparkles className="h-3.5 w-3.5" />
                )}
                뜻 자동 채우기
              </Button>
            )}
          </div>

          <div className="flex items-center gap-2 ml-auto">
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-8.5 font-bold gap-1 text-destructive hover:bg-destructive/10 hover:text-destructive text-xs"
              onClick={handleDelete}
            >
              <Trash2 className="h-3.5 w-3.5" />
              삭제
            </Button>
            <Button
              type="button"
              variant="default"
              size="sm"
              className="h-8.5 font-bold gap-1 text-xs shadow-xs"
              onClick={handleEdit}
            >
              <Pencil className="h-3.5 w-3.5" />
              수정하기
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
