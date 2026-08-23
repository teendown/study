'use client';

import { useState } from 'react';
import { Check, CheckSquare, Square, Volume2, Plus, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type { ExtractedWordCandidate } from '@/lib/ocr/tokenizer';

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

  // 전체 선택/해제
  const isAllSelected = candidates.length > 0 && candidates.every((c) => c.selected);
  const selectedCount = candidates.filter((c) => c.selected).length;

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

  const handleSave = async () => {
    const selected = candidates.filter((c) => c.selected);
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
      <div className="flex items-center justify-between border-b border-border pb-2 shrink-0">
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

        <span className="text-xs text-muted-foreground">
          총 <span className="font-bold text-foreground">{candidates.length}</span>개 중{' '}
          <span className="font-bold text-primary">{selectedCount}</span>개 선택됨
        </span>
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
                {item.partOfSpeech && (
                  <span className="text-[10px] text-muted-foreground">{item.partOfSpeech}</span>
                )}
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
          {isSaving ? '저장 중...' : `선택한 ${selectedCount}개 단어 등록`}
        </Button>
      </div>
    </div>
  );
}
