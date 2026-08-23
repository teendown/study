'use client';

import { useState } from 'react';
import {
  CheckSquare,
  Square,
  Search,
  Star,
  Sparkles,
  Volume2,
  CheckCircle2,
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import type { VocabularyWithItem } from '@/features/vocabulary/types';

interface WordPickerModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  allVocabs: VocabularyWithItem[];
  onConfirm: (selectedVocabs: VocabularyWithItem[]) => void;
}

export function WordPickerModal({
  open,
  onOpenChange,
  allVocabs,
  onConfirm,
}: WordPickerModalProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [difficultyFilter, setDifficultyFilter] = useState<number | null>(null);

  // 검색 및 필터링된 단어 목록
  const filteredVocabs = allVocabs.filter((v) => {
    const matchQuery =
      v.word.toLowerCase().includes(searchQuery.toLowerCase()) ||
      v.meaning.includes(searchQuery) ||
      (v.source && v.source.includes(searchQuery));

    const matchDiff = difficultyFilter === null || v.difficulty === difficultyFilter;
    return matchQuery && matchDiff;
  });

  const toggleSelect = (id: string) => {
    const next = new Set(selectedIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedIds(next);
  };

  const selectAllFiltered = () => {
    const next = new Set(selectedIds);
    filteredVocabs.forEach((v) => next.add(v.id));
    setSelectedIds(next);
  };

  const deselectAll = () => {
    setSelectedIds(new Set());
  };

  const handleSpeak = (e: React.MouseEvent, word: string) => {
    e.stopPropagation();
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(word);
      utterance.lang = 'en-US';
      utterance.rate = 0.85;
      window.speechSynthesis.speak(utterance);
    }
  };

  const handleConfirm = () => {
    const selected = allVocabs.filter((v) => selectedIds.has(v.id));
    if (selected.length === 0) {
      alert('학습할 단어를 최소 1개 이상 선택해주세요.');
      return;
    }
    onConfirm(selected);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl max-h-[88vh] flex flex-col p-5">
        <DialogHeader className="pb-2 border-b shrink-0">
          <DialogTitle className="flex items-center justify-between text-lg">
            <span>학습할 단어 직접 선택하기</span>
            <Badge variant="default" className="text-xs font-bold bg-primary text-white">
              {selectedIds.size}개 선택됨
            </Badge>
          </DialogTitle>
        </DialogHeader>

        {/* 검색 및 빠른 필터 */}
        <div className="space-y-2 pt-2 shrink-0">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="단어, 뜻, 출처(교재명)로 검색..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 h-9 text-xs"
            />
          </div>

          {/* 필터 버튼들 */}
          <div className="flex items-center justify-between gap-1 text-xs">
            <div className="flex items-center gap-1">
              <Button
                variant={difficultyFilter === null ? 'default' : 'outline'}
                size="sm"
                className="h-7 text-[11px] px-2"
                onClick={() => setDifficultyFilter(null)}
              >
                전체
              </Button>
              {[1, 2, 3, 4, 5].map((d) => (
                <Button
                  key={d}
                  variant={difficultyFilter === d ? 'default' : 'outline'}
                  size="sm"
                  className="h-7 text-[11px] px-2"
                  onClick={() => setDifficultyFilter(difficultyFilter === d ? null : d)}
                >
                  ⭐{d}
                </Button>
              ))}
            </div>

            <div className="flex gap-1">
              <Button
                variant="ghost"
                size="sm"
                className="h-7 text-[11px] px-2 font-bold text-primary"
                onClick={selectAllFiltered}
              >
                현재 목록 전체 선택
              </Button>
              {selectedIds.size > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 text-[11px] px-2 text-muted-foreground"
                  onClick={deselectAll}
                >
                  선택 해제
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* 단어 선택 스크롤 목록 */}
        <div className="flex-1 overflow-y-auto space-y-1.5 pr-1 my-2">
          {filteredVocabs.length === 0 ? (
            <div className="text-center py-12 text-xs text-muted-foreground">
              검색 조건에 맞는 단어가 없습니다.
            </div>
          ) : (
            filteredVocabs.map((vocab) => {
              const isSelected = selectedIds.has(vocab.id);
              return (
                <div
                  key={vocab.id}
                  onClick={() => toggleSelect(vocab.id)}
                  className={`p-3 rounded-xl border transition-all cursor-pointer flex items-center justify-between gap-3 ${
                    isSelected
                      ? 'border-primary/50 bg-primary/10 shadow-xs'
                      : 'border-border/70 hover:border-border hover:bg-muted/30'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="text-primary shrink-0">
                      {isSelected ? (
                        <CheckSquare className="h-5 w-5 fill-primary text-background" />
                      ) : (
                        <Square className="h-5 w-5 text-muted-foreground/60" />
                      )}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="font-bold text-sm text-foreground truncate">
                          {vocab.word}
                        </span>
                        {vocab.partOfSpeech && (
                          <span className="text-[10px] text-muted-foreground">
                            {vocab.partOfSpeech}
                          </span>
                        )}
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-5 w-5 text-muted-foreground hover:text-primary"
                          onClick={(e) => handleSpeak(e, vocab.word)}
                        >
                          <Volume2 className="h-3 w-3" />
                        </Button>
                      </div>
                      <p className="text-xs text-muted-foreground truncate">{vocab.meaning}</p>
                    </div>
                  </div>

                  <div className="text-right shrink-0 flex items-center gap-2">
                    {vocab.source && (
                      <span className="text-[10px] text-muted-foreground bg-muted px-1.5 py-0.5 rounded-md hidden sm:inline">
                        {vocab.source}
                      </span>
                    )}
                    <span className="text-[10px] text-amber-600 font-semibold">
                      ⭐{vocab.difficulty}
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* 하단 확인 버튼 */}
        <div className="flex gap-2 pt-2 border-t shrink-0">
          <Button variant="outline" className="flex-1" onClick={() => onOpenChange(false)}>
            취소
          </Button>
          <Button
            className="flex-1 font-bold gap-1.5"
            onClick={handleConfirm}
            disabled={selectedIds.size === 0}
          >
            <CheckCircle2 className="h-4 w-4" />
            선택한 {selectedIds.size}개 단어로 시작
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
