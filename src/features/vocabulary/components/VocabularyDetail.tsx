'use client';

import { ArrowLeft, Pencil, Trash2, Volume2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import type { VocabularyWithItem } from '@/features/vocabulary/types';

interface VocabularyDetailProps {
  vocab: VocabularyWithItem;
  onBack: () => void;
  onEdit: () => void;
  onDelete: () => void;
}

const difficultyStars: Record<number, string> = {
  1: '⭐',
  2: '⭐⭐',
  3: '⭐⭐⭐',
  4: '⭐⭐⭐⭐',
  5: '⭐⭐⭐⭐⭐',
};

/**
 * 단어 상세 보기 컴포넌트
 */
export function VocabularyDetail({
  vocab,
  onBack,
  onEdit,
  onDelete,
}: VocabularyDetailProps) {
  const handleSpeak = () => {
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(vocab.word);
      utterance.lang = 'en-US';
      utterance.rate = 0.8;
      window.speechSynthesis.speak(utterance);
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
          <Button variant="outline" size="sm" onClick={onEdit} className="gap-1">
            <Pencil className="h-3.5 w-3.5" />
            수정
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={onDelete}
            className="gap-1 text-destructive hover:text-destructive"
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
                <CardTitle className="text-2xl">{vocab.word}</CardTitle>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 shrink-0"
                  onClick={handleSpeak}
                >
                  <Volume2 className="h-4 w-4 text-primary" />
                </Button>
              </div>
              {vocab.pronunciation && (
                <p className="text-sm text-muted-foreground mt-0.5">
                  {vocab.pronunciation}
                </p>
              )}
            </div>
            {vocab.partOfSpeech && (
              <Badge variant="secondary">{vocab.partOfSpeech}</Badge>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* 뜻 */}
          <div>
            <p className="text-xs font-semibold text-muted-foreground mb-1">뜻</p>
            <p className="text-base font-medium">{vocab.meaning}</p>
          </div>

          <Separator />

          {/* 예문 */}
          {vocab.exampleSentence && (
            <div>
              <p className="text-xs font-semibold text-muted-foreground mb-1">예문</p>
              <p className="text-sm italic">{vocab.exampleSentence}</p>
              {vocab.exampleTranslation && (
                <p className="text-sm text-muted-foreground mt-0.5">
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
