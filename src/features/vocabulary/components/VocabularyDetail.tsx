'use client';

import { useState } from 'react';
import { ArrowLeft, Pencil, Trash2, Volume2, Sparkles, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import type { VocabularyWithItem } from '@/features/vocabulary/types';
import { searchWordOnlineAction, updateVocabularyAction } from '@/features/vocabulary/services';

interface VocabularyDetailProps {
  vocab: VocabularyWithItem;
  onBack: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onVocabUpdated?: (updated: VocabularyWithItem) => void;
}

const difficultyStars: Record<number, string> = {
  1: '⭐ 매우 쉬움',
  2: '⭐⭐ 쉬움',
  3: '⭐⭐⭐ 보통',
  4: '⭐⭐⭐⭐ 어려움',
  5: '⭐⭐⭐⭐⭐ 매우 어려움',
};

/**
 * 단어 상세 보기 컴포넌트
 */
export function VocabularyDetail({
  vocab,
  onBack,
  onEdit,
  onDelete,
  onVocabUpdated,
}: VocabularyDetailProps) {
  const [isAutoFilling, setIsAutoFilling] = useState(false);

  const handleSpeak = () => {
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(vocab.word);
      utterance.lang = 'en-US';
      utterance.rate = 0.8;
      window.speechSynthesis.speak(utterance);
    }
  };

  const isMissing =
    !vocab.meaning ||
    vocab.meaning === '의미 미입력' ||
    vocab.meaning === '의미 검색 필요' ||
    vocab.meaning === '뜻 미입력' ||
    !vocab.pronunciation ||
    !vocab.exampleSentence;

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

  return (
    <div className="space-y-4">
      {/* 상단 네비게이션 */}
      <div className="flex items-center justify-between">
        <Button variant="ghost" size="sm" onClick={onBack} className="gap-1">
          <ArrowLeft className="h-4 w-4" />
          돌아가기
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
            className="gap-1 text-destructive hover:text-destructive hover:bg-destructive/10 font-semibold"
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
            <div>
              <div className="flex items-center gap-2">
                <CardTitle className="text-2xl font-bold">{vocab.word}</CardTitle>
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
              {vocab.pronunciation && (
                <p className="text-sm text-muted-foreground mt-0.5 font-mono">
                  {vocab.pronunciation}
                </p>
              )}
            </div>
            {vocab.partOfSpeech && (
              <Badge variant="secondary" className="font-semibold">{vocab.partOfSpeech}</Badge>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* 뜻 */}
          <div>
            <p className="text-xs font-semibold text-muted-foreground mb-1">뜻</p>
            <p className={`text-base font-medium ${isMissing && !vocab.meaning ? 'text-amber-500 italic' : ''}`}>
              {vocab.meaning || '뜻이 등록되지 않았습니다.'}
            </p>
          </div>

          <Separator />

          {/* 예문 */}
          {vocab.exampleSentence && (
            <div>
              <p className="text-xs font-semibold text-muted-foreground mb-1">예문</p>
              <p className="text-sm italic">{vocab.exampleSentence}</p>
              {vocab.exampleTranslation && (
                <p className="text-sm text-muted-foreground mt-1">
                  {vocab.exampleTranslation}
                </p>
              )}
            </div>
          )}

          {/* 유의어 & 반의어 */}
          {(vocab.synonyms || vocab.antonyms) && (
            <>
              <Separator />
              <div className="grid grid-cols-2 gap-4">
                {vocab.synonyms && (
                  <div>
                    <p className="text-xs font-semibold text-muted-foreground mb-1">
                      유의어
                    </p>
                    <p className="text-sm">{vocab.synonyms}</p>
                  </div>
                )}
                {vocab.antonyms && (
                  <div>
                    <p className="text-xs font-semibold text-muted-foreground mb-1">
                      반의어
                    </p>
                    <p className="text-sm">{vocab.antonyms}</p>
                  </div>
                )}
              </div>
            </>
          )}

          <Separator />

          {/* 메타 정보 */}
          <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
            <span>난이도: {difficultyStars[vocab.difficulty] ?? '⭐'}</span>
            {vocab.grade && <span>학년: 고{vocab.grade - 9}</span>}
            {vocab.source && <span>출처: {vocab.source}</span>}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
