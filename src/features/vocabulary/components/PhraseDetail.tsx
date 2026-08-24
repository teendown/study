'use client';

import { useState } from 'react';
import { ArrowLeft, Pencil, Trash2, Volume2, Sparkles, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import type { PhraseWithItem } from '../types/phraseTypes';
import { searchPhraseOnlineAction, updatePhraseAction } from '../services';

interface PhraseDetailProps {
  phrase: PhraseWithItem;
  onBack: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onPhraseUpdated?: (updated: PhraseWithItem) => void;
}

const difficultyStars: Record<number, string> = {
  1: '⭐ 기초',
  2: '⭐⭐ 쉬움',
  3: '⭐⭐⭐ 필수',
  4: '⭐⭐⭐⭐ 심화',
  5: '⭐⭐⭐⭐⭐ 고난도',
};

export function PhraseDetail({
  phrase,
  onBack,
  onEdit,
  onDelete,
  onPhraseUpdated,
}: PhraseDetailProps) {
  const [isAutoFilling, setIsAutoFilling] = useState(false);

  const handleSpeak = () => {
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(phrase.phrase);
      utterance.lang = 'en-US';
      utterance.rate = 0.85;
      window.speechSynthesis.speak(utterance);
    }
  };

  const isMissing =
    !phrase.meaning ||
    phrase.meaning === '의미 미입력' ||
    phrase.meaning === '의미 검색 필요' ||
    phrase.meaning === '뜻 미입력' ||
    !phrase.exampleSentence;

  const handleAutoFill = async () => {
    setIsAutoFilling(true);
    try {
      const res = await searchPhraseOnlineAction(phrase.phrase);
      if (res.success && res.data) {
        const d = res.data;
        const updatedFields = {
          meaning: d.meaning && d.meaning !== '의미 검색 필요' ? d.meaning : phrase.meaning,
          exampleSentence: (d.exampleSentence || phrase.exampleSentence) ?? undefined,
          exampleTranslation: (d.exampleTranslation || phrase.exampleTranslation) ?? undefined,
          source: (d.source || phrase.source) ?? undefined,
        };
        await updatePhraseAction(phrase.id, updatedFields);
        const updatedPhrase: PhraseWithItem = {
          ...phrase,
          meaning: updatedFields.meaning,
          exampleSentence: updatedFields.exampleSentence ?? null,
          exampleTranslation: updatedFields.exampleTranslation ?? null,
          source: updatedFields.source ?? null,
          updatedAt: new Date().toISOString(),
        };
        onPhraseUpdated?.(updatedPhrase);
      }
    } catch {
      alert('숙어 정보 자동 검색에 실패했습니다.');
    } finally {
      setIsAutoFilling(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* 상단 바 */}
      <div className="flex items-center justify-between">
        <Button variant="ghost" size="sm" onClick={onBack} className="gap-1">
          <ArrowLeft className="h-4 w-4" />
          목록으로
        </Button>
        <div className="flex gap-1.5">
          {isMissing && (
            <Button
              variant="secondary"
              size="sm"
              onClick={handleAutoFill}
              disabled={isAutoFilling}
              className="gap-1 text-primary border border-primary/20 font-bold"
            >
              {isAutoFilling ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Sparkles className="h-3.5 w-3.5" />
              )}
              뜻 자동 완성
            </Button>
          )}
          <Button variant="outline" size="sm" onClick={onEdit} className="gap-1 font-semibold">
            <Pencil className="h-3.5 w-3.5" />
            수정
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={onDelete}
            className="gap-1 font-semibold text-destructive hover:text-destructive hover:bg-destructive/10"
          >
            <Trash2 className="h-3.5 w-3.5" />
            삭제
          </Button>
        </div>
      </div>

      {/* 메인 카드 */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-2">
              <CardTitle className="text-2xl font-bold">{phrase.phrase}</CardTitle>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 shrink-0 text-primary hover:bg-primary/10"
                onClick={handleSpeak}
                title="발음 듣기"
              >
                <Volume2 className="h-5 w-5" />
              </Button>
            </div>
            <Badge variant="secondary" className="bg-amber-500/15 text-amber-700 dark:text-amber-400 font-semibold">
              숙어 (Phrase)
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* 뜻 */}
          <div>
            <p className="text-xs font-semibold text-muted-foreground mb-1">뜻</p>
            <p className={`text-base font-medium ${isMissing && !phrase.meaning ? 'text-amber-500 italic' : 'text-foreground'}`}>
              {phrase.meaning || '뜻이 등록되지 않았습니다.'}
            </p>
          </div>

          <Separator />

          {/* 예문 */}
          {phrase.exampleSentence && (
            <div>
              <p className="text-xs font-semibold text-muted-foreground mb-1">예문</p>
              <p className="text-sm italic">{phrase.exampleSentence}</p>
              {phrase.exampleTranslation && (
                <p className="text-sm text-muted-foreground mt-1">
                  {phrase.exampleTranslation}
                </p>
              )}
            </div>
          )}

          <Separator />

          {/* 메타 정보 */}
          <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
            <span>난이도: {difficultyStars[phrase.difficulty] || '⭐'}</span>
            {phrase.grade && <span>학년: 고{phrase.grade - 9}</span>}
            {phrase.source && <span>출처: {phrase.source}</span>}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
