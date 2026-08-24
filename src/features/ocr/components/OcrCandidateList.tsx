'use client';

import { useState } from 'react';
import { CheckSquare, Square, Volume2, Plus, Sparkles, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import type { ExtractedWordCandidate } from '@/lib/ocr/tokenizer';
import { searchWordOnline } from '@/features/vocabulary/services/dictionarySearch';

interface OcrCandidateListProps {
  initialCandidates: ExtractedWordCandidate[];
  onSaveSelected: (selected: ExtractedWordCandidate[]) => Promise<void>;
  onCancel: () => void;
}

export function OcrCandidateList({
  initialCandidates,
  onSaveSelected,
  onCancel,
}: OcrCandidateListProps) {
  const [candidates, setCandidates] = useState<ExtractedWordCandidate[]>(initialCandidates);
  const [isSaving, setIsSaving] = useState(false);
  const [isAutoFilling, setIsAutoFilling] = useState(false);

  // 전체 선택/해제
  const isAllSelected = candidates.length > 0 && candidates.every((c) => c.selected);
  const selectedCount = candidates.filter((c) => c.selected).length;
  const missingMeaningCount = candidates.filter(
    (c) => !c.meaning || c.meaning.trim() === '' || c.meaning === '의미 검색 필요' || c.meaning === '의미 미입력'
  ).length;

  const toggleSelectAll = () => {
    setCandidates((prev) =>
      prev.map((c) => ({ ...c, selected: !isAllSelected }))
    );
  };

  const toggleItem = (id: string) => {
    setCandidates((prev) =>
      prev.map((c) => (c.id === id ? { ...c, selected: !c.selected } : c))
    );
  };

  const handleMeaningChange = (id: string, newMeaning: string) => {
    setCandidates((prev) =>
      prev.map((c) => (c.id === id ? { ...c, meaning: newMeaning } : c))
    );
  };

  const handleSpeak = (word: string) => {
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(word);
      utterance.lang = 'en-US';
      utterance.rate = 0.85;
      window.speechSynthesis.speak(utterance);
    }
  };

  // 모든 빈 뜻 자동 검색 및 채우기
  const handleAutoFillAll = async () => {
    setIsAutoFilling(true);
    try {
      const updated = [...candidates];
      const targets = updated.filter(
        (c) => !c.meaning || c.meaning.trim() === '' || c.meaning === '의미 검색 필요' || c.meaning === '의미 미입력'
      );

      const BATCH_SIZE = 8;
      for (let i = 0; i < targets.length; i += BATCH_SIZE) {
        const batch = targets.slice(i, i + BATCH_SIZE);
        await Promise.all(
          batch.map(async (item) => {
            try {
              const res = await searchWordOnline(item.word);
              if (res && res.meaning && res.meaning !== '의미 검색 필요') {
                item.meaning = res.meaning;
                if (res.partOfSpeech) item.partOfSpeech = res.partOfSpeech;
                if (res.pronunciation) item.pronunciation = res.pronunciation;
              }
            } catch {}
          })
        );
        setCandidates([...updated]);
      }
    } finally {
      setIsAutoFilling(false);
    }
  };

  const handleSave = async () => {
    const selected = candidates.filter((c) => c.selected);
    if (selected.length === 0) return;

    setIsSaving(true);
    try {
      // 저장 전 뜻이 비어있는 선택 단어 자동 보충
      await Promise.all(
        selected.map(async (item) => {
          if (!item.meaning || item.meaning.trim() === '' || item.meaning === '의미 검색 필요') {
            try {
              const res = await searchWordOnline(item.word);
              if (res && res.meaning && res.meaning !== '의미 검색 필요') {
                item.meaning = res.meaning;
                if (res.partOfSpeech) item.partOfSpeech = res.partOfSpeech;
                if (res.pronunciation) item.pronunciation = res.pronunciation;
              }
            } catch {}
          }
        })
      );

      await onSaveSelected(selected);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-4 max-h-[75vh] flex flex-col">
      {/* 상단 액션 바: 전체 선택 & 카운트 & 자동 채우기 */}
      <div className="flex items-center justify-between border-b border-border pb-2 shrink-0 gap-2 flex-wrap">
        <Button
          variant="ghost"
          size="sm"
          onClick={toggleSelectAll}
          className="text-xs font-bold gap-1.5"
        >
          {isAllSelected ? (
            <>
              <CheckSquare className="h-4 w-4 text-primary" />
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
          {missingMeaningCount > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleAutoFillAll}
              disabled={isAutoFilling}
              className="text-xs font-semibold gap-1 h-7 border-primary/40 text-primary hover:bg-primary/10"
            >
              {isAutoFilling ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Sparkles className="h-3.5 w-3.5 text-amber-500" />
              )}
              {isAutoFilling ? '사전 검색 중...' : '뜻 자동 완성'}
            </Button>
          )}

          <span className="text-xs text-muted-foreground">
            총 <span className="font-bold text-foreground">{candidates.length}</span>개 중{' '}
            <span className="font-bold text-primary">{selectedCount}</span>개 선택됨
          </span>
        </div>
      </div>

      {/* 후보 단어 리스트 (스크롤) */}
      <div className="space-y-2 overflow-y-auto flex-1 pr-1">
        {candidates.map((item) => (
          <Card
            key={item.id}
            className={`border transition-all ${
              item.selected ? 'border-primary/40 bg-primary/5' : 'opacity-60 border-border'
            }`}
          >
            <CardContent className="p-3 flex items-center gap-3">
              {/* 체크박스 */}
              <button
                type="button"
                onClick={() => toggleItem(item.id)}
                className="shrink-0 p-1 text-primary focus:outline-hidden"
              >
                {item.selected ? (
                  <CheckSquare className="h-5 w-5 fill-primary text-background" />
                ) : (
                  <Square className="h-5 w-5 text-muted-foreground" />
                )}
              </button>

              {/* 단어 & 발음 */}
              <div className="min-w-[110px] shrink-0">
                <div className="flex items-center gap-1">
                  <span className="font-bold text-sm text-foreground">{item.word}</span>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-5 w-5 text-muted-foreground hover:text-primary"
                    onClick={() => handleSpeak(item.word)}
                  >
                    <Volume2 className="h-3 w-3" />
                  </Button>
                </div>
                <div className="flex items-center gap-1">
                  {item.partOfSpeech && (
                    <span className="text-[10px] text-muted-foreground">{item.partOfSpeech}</span>
                  )}
                  {item.pronunciation && (
                    <span className="text-[10px] text-primary/80 font-medium">
                      {item.pronunciation}
                    </span>
                  )}
                </div>
              </div>

              {/* 뜻 입력/수정 창 */}
              <div className="flex-1">
                <Input
                  value={item.meaning}
                  onChange={(e) => handleMeaningChange(item.id, e.target.value)}
                  placeholder="단어의 뜻을 입력하세요..."
                  className="h-8 text-xs bg-background"
                />
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
          className="flex-1 font-bold gap-1.5"
          onClick={handleSave}
          disabled={selectedCount === 0 || isSaving}
        >
          <Plus className="h-4 w-4" />
          {isSaving ? '단어 및 뜻 저장 중...' : `선택한 ${selectedCount}개 단어 등록`}
        </Button>
      </div>
    </div>
  );
}
