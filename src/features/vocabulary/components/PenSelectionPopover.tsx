'use client';

import { useState, useEffect } from 'react';
import {
  Sparkles,
  Plus,
  Volume2,
  Check,
  Loader2,
  X,
  ExternalLink,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { searchWordOnline } from '@/features/vocabulary/services/dictionarySearch';

export interface PenSelectionPopoverProps {
  selectedText: string;
  position: { x: number; y: number } | null;
  onClose: () => void;
  onAddWord: (word: string, meaning: string, exampleSentence?: string, exampleTranslation?: string) => void;
  isAlreadyAdded?: boolean;
}

export function PenSelectionPopover({
  selectedText,
  position,
  onClose,
  onAddWord,
  isAlreadyAdded = false,
}: PenSelectionPopoverProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [data, setData] = useState<{
    word: string;
    meaning: string;
    pronunciation?: string;
    partOfSpeech?: string;
    exampleSentence?: string;
    exampleTranslation?: string;
    source?: string;
  } | null>(null);
  const [added, setAdded] = useState(isAlreadyAdded);

  useEffect(() => {
    if (!selectedText || !position) {
      setData(null);
      return;
    }

    const clean = selectedText.trim().replace(/[.,!?:;"'()]/g, '');
    if (clean.length < 2) return;

    let isMounted = true;
    setIsLoading(true);
    setAdded(isAlreadyAdded);

    searchWordOnline(clean)
      .then((res) => {
        if (isMounted && res) {
          setData({
            word: res.word,
            meaning: res.meaning,
            pronunciation: res.pronunciation,
            partOfSpeech: res.partOfSpeech,
            exampleSentence: res.exampleSentence,
            exampleTranslation: res.exampleTranslation,
            source: res.source,
          });
        }
      })
      .catch(() => {})
      .finally(() => {
        if (isMounted) setIsLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [selectedText, position, isAlreadyAdded]);

  if (!selectedText || !position) return null;

  const handleSpeak = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const u = new SpeechSynthesisUtterance(data?.word || selectedText);
      u.lang = 'en-US';
      u.rate = 0.9;
      window.speechSynthesis.speak(u);
    }
  };

  const handleAdd = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!data) return;
    onAddWord(data.word, data.meaning, data.exampleSentence, data.exampleTranslation);
    setAdded(true);
  };

  // 뷰포트 경계 계산 (화면 밖으로 나가지 않도록 조정)
  const left = Math.min(Math.max(16, position.x - 140), typeof window !== 'undefined' ? window.innerWidth - 300 : 300);
  const top = Math.max(16, position.y - 110);

  return (
    <div
      className="fixed z-50 animate-in fade-in zoom-in-95 bg-card/95 backdrop-blur-md border border-primary/30 rounded-xl shadow-xl p-3 w-72 text-xs"
      style={{ left: `${left}px`, top: `${top}px` }}
      onClick={(e) => e.stopPropagation()}
    >
      <div className="flex items-center justify-between gap-1 mb-1.5 pb-1 border-b border-border">
        <div className="flex items-center gap-1 font-bold text-foreground truncate">
          <Sparkles className="h-3.5 w-3.5 text-primary shrink-0" />
          <span className="truncate text-sm">{data?.word || selectedText}</span>
          {data?.pronunciation && (
            <span className="text-[11px] text-muted-foreground font-normal shrink-0">
              {data.pronunciation}
            </span>
          )}
        </div>
        <div className="flex items-center gap-0.5">
          <Button
            type="button"
            size="icon"
            variant="ghost"
            className="h-6 w-6 text-muted-foreground hover:text-primary"
            onClick={handleSpeak}
            title="발음 듣기"
          >
            <Volume2 className="h-3.5 w-3.5" />
          </Button>
          <Button
            type="button"
            size="icon"
            variant="ghost"
            className="h-6 w-6 text-muted-foreground hover:text-destructive"
            onClick={onClose}
          >
            <X className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-3 text-muted-foreground gap-2">
          <Loader2 className="h-4 w-4 animate-spin text-primary" />
          <span>AI 사전 검색 중...</span>
        </div>
      ) : data ? (
        <div className="space-y-2">
          <div>
            <div className="flex items-center gap-1.5">
              {data.partOfSpeech && (
                <span className="text-[10px] font-semibold text-primary bg-primary/10 px-1.5 py-0.5 rounded">
                  {data.partOfSpeech}
                </span>
              )}
              <span className="font-semibold text-foreground text-xs leading-snug">
                {data.meaning}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-1.5 pt-1">
            <Button
              type="button"
              size="sm"
              variant={added ? 'secondary' : 'default'}
              disabled={added}
              className="w-full h-7 gap-1 text-xs font-bold"
              onClick={handleAdd}
            >
              {added ? (
                <>
                  <Check className="h-3.5 w-3.5 text-emerald-500" />
                  단어장에 추가됨
                </>
              ) : (
                <>
                  <Plus className="h-3.5 w-3.5" />
                  단어장에 추가
                </>
              )}
            </Button>
          </div>
        </div>
      ) : (
        <div className="text-muted-foreground text-[11px] py-1">
          단어 뜻을 찾을 수 없습니다.
        </div>
      )}
    </div>
  );
}
