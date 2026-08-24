'use client';

import { useState, useMemo } from 'react';
import { CheckSquare, Square, Volume2, BookmarkPlus, Sparkles, Plus, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type { ExtractedPhraseResult } from '@/lib/ocr/phraseDictionary';
import { getStoredPhrases } from '@/features/vocabulary/services/phraseActions';

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
  // 이미 숙어장에 등록된 숙어 Set
  const existingPhraseSet = useMemo(() => {
    try {
      const stored = getStoredPhrases();
      return new Set(stored.map((p) => p.phrase.toLowerCase()));
    } catch {
      return new Set<string>();
    }
  }, []);

  // 이미 등록된 숙어는 기본 선택 해제
  const [phrases, setPhrases] = useState<ExtractedPhraseResult[]>(() =>
    initialPhrases.map((p) => ({
      ...p,
      selected: !existingPhraseSet.has(p.phrase.toLowerCase()),
    }))
  );
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

  return (
    <div className="space-y-4 max-h-[75vh] flex flex-col">
      {/* 상단 액션 바: 전체 선택 & 카운트 */}
      <div className="flex items-center justify-between border-b border-border pb-2 shrink-0 gap-2 flex-wrap">
        <Button
          variant="ghost"
          size="sm"
          onClick={toggleSelectAll}
          className="text-xs font-bold gap-1.5"
        >
          {isAllSelected ? (
            <>
              <CheckSquare className="h-4 w-4 text-indigo-500" />
              전체 해제
            </>
          ) : (
            <>
              <Square className="h-4 w-4 text-muted-foreground" />
              전체 선택
            </>
          )}
        </Button>

        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">
            총 <span className="font-bold text-foreground">{phrases.length}</span>개 중{' '}
            <span className="font-bold text-indigo-600 dark:text-indigo-400">{selectedCount}</span>개 선택됨
          </span>
        </div>
      </div>

      {/* 추출된 숙어 목록 */}
      <div className="space-y-2 overflow-y-auto flex-1 pr-1">
        {phrases.length === 0 ? (
          <div className="py-8 text-center text-xs text-muted-foreground">
            인식된 필수 숙어가 없습니다.
          </div>
        ) : (
          phrases.map((item) => {
            const isRegistered = existingPhraseSet.has(item.phrase.toLowerCase());

            return (
              <Card
                key={item.phrase}
                className={`border transition-all ${
                  item.selected ? 'border-indigo-500/40 bg-indigo-50/20 dark:bg-indigo-950/20' : 'opacity-60 border-border'
                }`}
              >
                <CardContent className="p-3 flex items-center gap-3">
                  {/* 체크박스 */}
                  <button
                    type="button"
                    onClick={() => toggleItem(item.id, item.phrase)}
                    className="shrink-0 p-1 text-indigo-600 focus:outline-hidden"
                  >
                    {item.selected ? (
                      <CheckSquare className="h-5 w-5 fill-indigo-600 text-background" />
                    ) : (
                      <Square className="h-5 w-5 text-muted-foreground" />
                    )}
                  </button>

                  {/* 숙어 표제어 & 본문 문맥 & 중복 여부 */}
                  <div className="min-w-[140px] shrink-0 space-y-1">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="font-bold text-sm text-foreground">{item.phrase}</span>
                      {isRegistered && (
                        <Badge variant="outline" className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30 text-[9px] px-1 py-0 h-4">
                          <Check className="h-2.5 w-2.5 mr-0.5" /> 이미 등록됨
                        </Badge>
                      )}
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-5 w-5 text-muted-foreground hover:text-indigo-600"
                        onClick={() => handleSpeak(item.phrase)}
                      >
                        <Volume2 className="h-3 w-3" />
                      </Button>
                    </div>

                    {item.matchedText && item.matchedText.toLowerCase() !== item.phrase.toLowerCase() && (
                      <span className="text-[10px] text-indigo-600 dark:text-indigo-400 bg-indigo-100 dark:bg-indigo-900/40 px-1 rounded block truncate font-mono max-w-[150px]">
                        본문: {item.matchedText}
                      </span>
                    )}
                  </div>

                  {/* 뜻 입력/수정 창 */}
                  <div className="flex-1">
                    <Input
                      value={item.meaning}
                      onChange={(e) => handleMeaningChange(item.phrase, e.target.value)}
                      placeholder="숙어의 뜻을 입력하세요..."
                      className="h-8 text-xs bg-background"
                    />
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
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
          {isSaving ? '숙어 저장 중...' : `선택한 ${selectedCount}개 숙어 등록`}
        </Button>
      </div>
    </div>
  );
}
