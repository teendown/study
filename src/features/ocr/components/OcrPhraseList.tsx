'use client';

import { useState } from 'react';
import { CheckSquare, Square, Volume2, BookmarkPlus, Sparkles, Plus, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type { ExtractedPhraseResult } from '@/lib/ocr/phraseDictionary';

interface OcrPhraseListProps {
  initialPhrases: ExtractedPhraseResult[];
  onSaveSelected: (selected: ExtractedPhraseResult[]) => Promise<void>;
  onCancel: () => void;
}

export function OcrPhraseList({
  initialPhrases,
  onSaveSelected,
  onCancel,
}: OcrPhraseListProps) {
  const [phrases, setPhrases] = useState<ExtractedPhraseResult[]>(initialPhrases);
  const [isSaving, setIsSaving] = useState(false);

  // 전체 선택/해제
  const isAllSelected = phrases.length > 0 && phrases.every((p) => p.selected);
  const selectedCount = phrases.filter((p) => p.selected).length;

  const toggleSelectAll = () => {
    setPhrases((prev) =>
      prev.map((p) => ({ ...p, selected: !isAllSelected }))
    );
  };

  const toggleItem = (id: string | undefined, phrase: string) => {
    setPhrases((prev) =>
      prev.map((p) =>
        (p.id === id || p.phrase === phrase) ? { ...p, selected: !p.selected } : p
      )
    );
  };

  const handleMeaningChange = (phrase: string, newMeaning: string) => {
    setPhrases((prev) =>
      prev.map((p) => (p.phrase === phrase ? { ...p, meaning: newMeaning } : p))
    );
  };

  const handleSpeak = (text: string) => {
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'en-US';
      utterance.rate = 0.85;
      window.speechSynthesis.speak(utterance);
    }
  };

  const handleSave = async () => {
    const selected = phrases.filter((p) => p.selected);
    if (selected.length === 0) return;

    setIsSaving(true);
    try {
      await onSaveSelected(selected);
    } finally {
      setIsSaving(false);
    }
  };

  if (phrases.length === 0) {
    return (
      <div className="py-8 text-center space-y-3">
        <div className="mx-auto w-12 h-12 rounded-full bg-indigo-500/10 flex items-center justify-center text-indigo-500">
          <BookmarkPlus className="h-6 w-6" />
        </div>
        <div className="space-y-1">
          <h4 className="font-bold text-sm text-foreground">판독된 숙어가 없습니다</h4>
          <p className="text-xs text-muted-foreground max-w-xs mx-auto">
            이 지문에는 등록된 관용구/숙어 패턴이 발견되지 않았습니다. [단어] 또는 [본문] 탭에서 학습을 진행해 주세요.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3 max-h-[75vh] flex flex-col">
      {/* 상단 컨트롤 바 */}
      <div className="flex items-center justify-between border-b border-border pb-2 shrink-0 flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={toggleSelectAll}
            className="h-7 px-2 text-xs font-semibold gap-1 text-muted-foreground hover:text-foreground"
          >
            {isAllSelected ? (
              <CheckSquare className="h-3.5 w-3.5 text-primary" />
            ) : (
              <Square className="h-3.5 w-3.5" />
            )}
            전체 선택 ({selectedCount}/{phrases.length})
          </Button>
        </div>

        <span className="text-xs text-indigo-600 dark:text-indigo-400 font-semibold flex items-center gap-1">
          <Sparkles className="h-3.5 w-3.5 text-amber-500" />
          {phrases.length}개 필수 숙어 자동 판독됨
        </span>
      </div>

      {/* 숙어 리스트 */}
      <div className="space-y-2 overflow-y-auto flex-1 pr-1">
        {phrases.map((item) => (
          <Card
            key={item.phrase}
            className={`border transition-all duration-150 ${
              item.selected
                ? 'border-indigo-500/40 bg-indigo-50/30 dark:bg-indigo-950/20 shadow-xs'
                : 'border-border opacity-70 bg-card'
            }`}
          >
            <CardContent className="p-2.5 flex items-center gap-2.5">
              <button
                type="button"
                onClick={() => toggleItem(item.id, item.phrase)}
                className="shrink-0 text-muted-foreground hover:text-primary transition-colors mt-0.5"
              >
                {item.selected ? (
                  <CheckSquare className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
                ) : (
                  <Square className="h-4 w-4" />
                )}
              </button>

              <div className="flex-1 min-w-0 space-y-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-bold text-sm text-foreground">
                    {item.phrase}
                  </span>

                  {item.matchedText && item.matchedText.toLowerCase() !== item.phrase.toLowerCase() && (
                    <span className="text-[10px] text-indigo-600 dark:text-indigo-400 bg-indigo-100 dark:bg-indigo-900/50 px-1.5 py-0.5 rounded font-mono">
                      본문: {item.matchedText}
                    </span>
                  )}

                  <Badge variant="secondary" className="text-[10px] h-4 px-1">
                    난이도 {item.difficulty}
                  </Badge>
                </div>

                <div className="flex items-center gap-1.5">
                  <Input
                    value={item.meaning}
                    onChange={(e) => handleMeaningChange(item.phrase, e.target.value)}
                    placeholder="한국어 뜻 입력"
                    className="h-7 text-xs bg-background/80"
                  />
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 text-muted-foreground hover:text-primary shrink-0"
                    onClick={() => handleSpeak(item.phrase)}
                  >
                    <Volume2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* 하단 저장/취소 버튼 */}
      <div className="flex gap-2 pt-2 border-t border-border shrink-0">
        <Button variant="outline" className="flex-1" onClick={onCancel} disabled={isSaving}>
          취소
        </Button>
        <Button
          className="flex-1 font-bold gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white"
          onClick={handleSave}
          disabled={selectedCount === 0 || isSaving}
        >
          <BookmarkPlus className="h-4 w-4" />
          {isSaving ? '저장 중...' : `선택한 ${selectedCount}개 숙어장에 저장`}
        </Button>
      </div>
    </div>
  );
}
