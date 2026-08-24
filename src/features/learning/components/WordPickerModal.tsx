'use client';

import { useState, useMemo } from 'react';
import {
  CheckSquare,
  Square,
  Search,
  Volume2,
  CheckCircle2,
  Calendar,
  Layers,
  Filter,
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
import type { VocabularyWithItem } from '@/features/vocabulary/types';

interface WordPickerModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  allVocabs: VocabularyWithItem[];
  onConfirm: (selectedVocabs: VocabularyWithItem[]) => void;
}

// 날짜 포맷 함수 (YYYY-MM-DD)
function formatDateKey(isoString: string): string {
  if (!isoString) return '날짜 미상';
  try {
    const d = new Date(isoString);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  } catch {
    return '날짜 미상';
  }
}

function getDateLabel(dateKey: string): string {
  const today = formatDateKey(new Date().toISOString());
  const yesterday = formatDateKey(new Date(Date.now() - 86400000).toISOString());

  if (dateKey === today) return `오늘 (${dateKey})`;
  if (dateKey === yesterday) return `어제 (${dateKey})`;
  return dateKey;
}

export function WordPickerModal({
  open,
  onOpenChange,
  allVocabs,
  onConfirm,
}: WordPickerModalProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [selectedDateFilter, setSelectedDateFilter] = useState<string | 'all'>('all');
  const [difficultyFilter, setDifficultyFilter] = useState<number | null>(null);

  // 등록 날짜 목록 추출 (최신순)
  const availableDates = useMemo(() => {
    const dateSet = new Set<string>();
    allVocabs.forEach((v) => {
      dateSet.add(formatDateKey(v.createdAt));
    });
    return Array.from(dateSet).sort().reverse();
  }, [allVocabs]);

  // 검색 및 필터링된 단어 목록
  const filteredVocabs = useMemo(() => {
    return allVocabs.filter((v) => {
      const matchQuery =
        v.word.toLowerCase().includes(searchQuery.toLowerCase()) ||
        v.meaning.includes(searchQuery) ||
        (v.source && v.source.includes(searchQuery));

      const matchDiff = difficultyFilter === null || v.difficulty === difficultyFilter;
      const matchDate =
        selectedDateFilter === 'all' || formatDateKey(v.createdAt) === selectedDateFilter;

      return matchQuery && matchDiff && matchDate;
    });
  }, [allVocabs, searchQuery, difficultyFilter, selectedDateFilter]);

  // 날짜별로 그룹화된 단어 맵
  const groupedByDate = useMemo(() => {
    const map = new Map<string, VocabularyWithItem[]>();
    filteredVocabs.forEach((v) => {
      const dKey = formatDateKey(v.createdAt);
      if (!map.has(dKey)) map.set(dKey, []);
      map.get(dKey)!.push(v);
    });
    return map;
  }, [filteredVocabs]);

  const toggleSelect = (id: string) => {
    const next = new Set(selectedIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedIds(next);
  };

  // 특정 날짜의 단어 전체 선택 / 해제
  const toggleSelectDateGroup = (dateKey: string) => {
    const itemsInGroup = groupedByDate.get(dateKey) || [];
    const isGroupAllSelected = itemsInGroup.every((v) => selectedIds.has(v.id));

    const next = new Set(selectedIds);
    if (isGroupAllSelected) {
      itemsInGroup.forEach((v) => next.delete(v.id));
    } else {
      itemsInGroup.forEach((v) => next.add(v.id));
    }
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
      <DialogContent className="max-w-xl max-h-[90vh] flex flex-col p-5">
        <DialogHeader className="pb-2 border-b shrink-0">
          <DialogTitle className="flex items-center justify-between text-lg">
            <span className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-primary" />
              날짜별 단어 선택 및 학습
            </span>
            <Badge variant="default" className="text-xs font-bold bg-primary text-white">
              {selectedIds.size}개 선택됨
            </Badge>
          </DialogTitle>
        </DialogHeader>

        {/* 1. 검색 및 날짜 선택 필터 칩 */}
        <div className="space-y-2.5 pt-2 shrink-0">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="단어, 뜻, 출처(교재명)로 검색..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 h-9 text-xs"
            />
          </div>

          {/* 📅 등록 날짜별 탭/필터 칩 */}
          <div className="space-y-1">
            <p className="text-[11px] font-semibold text-muted-foreground flex items-center gap-1">
              <Calendar className="h-3.5 w-3.5" /> 등록 날짜 필터:
            </p>
            <div className="flex gap-1.5 overflow-x-auto pb-1 text-xs no-scrollbar">
              <Button
                variant={selectedDateFilter === 'all' ? 'default' : 'outline'}
                size="sm"
                className="h-7 text-[11px] px-2.5 rounded-lg shrink-0 font-semibold"
                onClick={() => setSelectedDateFilter('all')}
              >
                전체 날짜 ({allVocabs.length})
              </Button>
              {availableDates.map((dKey) => {
                const countOnDate = allVocabs.filter((v) => formatDateKey(v.createdAt) === dKey).length;
                return (
                  <Button
                    key={dKey}
                    variant={selectedDateFilter === dKey ? 'default' : 'outline'}
                    size="sm"
                    className="h-7 text-[11px] px-2.5 rounded-lg shrink-0 font-semibold gap-1"
                    onClick={() => setSelectedDateFilter(dKey)}
                  >
                    {getDateLabel(dKey)} ({countOnDate})
                  </Button>
                );
              })}
            </div>
          </div>

          {/* 난이도 필터 & 액션 버튼 */}
          <div className="flex items-center justify-between gap-1 text-xs pt-0.5">
            <div className="flex items-center gap-1">
              <span className="text-[10px] text-muted-foreground font-semibold mr-0.5">난이도:</span>
              <Button
                variant={difficultyFilter === null ? 'default' : 'outline'}
                size="sm"
                className="h-6 text-[10px] px-1.5"
                onClick={() => setDifficultyFilter(null)}
              >
                전체
              </Button>
              {[1, 2, 3, 4, 5].map((d) => (
                <Button
                  key={d}
                  variant={difficultyFilter === d ? 'default' : 'outline'}
                  size="sm"
                  className="h-6 text-[10px] px-1.5"
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
                className="h-6 text-[10px] px-2 font-bold text-primary"
                onClick={selectAllFiltered}
              >
                현재 목록 전체 선택
              </Button>
              {selectedIds.size > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 text-[10px] px-2 text-muted-foreground"
                  onClick={deselectAll}
                >
                  선택 해제
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* 2. 날짜별 그룹핑 단어 스크롤 목록 */}
        <div className="flex-1 overflow-y-auto space-y-4 pr-1 my-2">
          {filteredVocabs.length === 0 ? (
            <div className="text-center py-12 text-xs text-muted-foreground">
              선택한 날짜 및 검색 조건에 맞는 단어가 없습니다.
            </div>
          ) : (
            Array.from(groupedByDate.entries()).map(([dateKey, items]) => {
              const isGroupAllSelected = items.every((v) => selectedIds.has(v.id));
              const selectedInGroupCount = items.filter((v) => selectedIds.has(v.id)).length;

              return (
                <div key={dateKey} className="space-y-1.5">
                  {/* 날짜 헤더 & 해당 날짜 전체 선택 버튼 */}
                  <div className="flex items-center justify-between bg-muted/70 px-3 py-1.5 rounded-lg text-xs font-bold text-foreground">
                    <span className="flex items-center gap-1.5">
                      <Calendar className="h-3.5 w-3.5 text-primary" />
                      {getDateLabel(dateKey)} ({items.length}개)
                    </span>
                    <button
                      type="button"
                      onClick={() => toggleSelectDateGroup(dateKey)}
                      className="text-[11px] font-semibold text-primary hover:underline"
                    >
                      {isGroupAllSelected
                        ? '이 날짜 전체 해제'
                        : `이 날짜 전체 선택 (${selectedInGroupCount}/${items.length})`}
                    </button>
                  </div>

                  {/* 해당 날짜의 단어 카드들 */}
                  <div className="space-y-1.5 pl-1">
                    {items.map((vocab) => {
                      const isSelected = selectedIds.has(vocab.id);
                      return (
                        <div
                          key={vocab.id}
                          onClick={() => toggleSelect(vocab.id)}
                          className={`p-3 rounded-xl border transition-all cursor-pointer flex items-start gap-3 ${
                            isSelected
                              ? 'border-primary/50 bg-primary/10 shadow-xs'
                              : 'border-border/70 hover:border-border hover:bg-muted/30 bg-card'
                          }`}
                        >
                          {/* 체크박스 */}
                          <div className="text-primary shrink-0 pt-0.5">
                            {isSelected ? (
                              <CheckSquare className="h-5 w-5 fill-primary text-background" />
                            ) : (
                              <Square className="h-5 w-5 text-muted-foreground/60" />
                            )}
                          </div>

                          {/* 단어 상세 콘텐츠 (flex-1 min-w-0 로 가려짐 방지) */}
                          <div className="flex-1 min-w-0 space-y-1">
                            {/* 1행: 단어 + 품사 + 발음 듣기 + 별점 */}
                            <div className="flex items-center justify-between gap-2">
                              <div className="flex items-center gap-1.5 min-w-0">
                                <span className="font-bold text-sm sm:text-base text-foreground truncate">
                                  {vocab.word}
                                </span>
                                {vocab.partOfSpeech && (
                                  <span className="text-[10px] text-muted-foreground bg-muted/80 px-1.5 py-0.5 rounded font-mono shrink-0">
                                    {vocab.partOfSpeech}
                                  </span>
                                )}
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-5 w-5 text-muted-foreground hover:text-primary shrink-0"
                                  onClick={(e) => handleSpeak(e, vocab.word)}
                                >
                                  <Volume2 className="h-3.5 w-3.5" />
                                </Button>
                              </div>

                              <span className="text-xs text-amber-600 font-semibold shrink-0 bg-amber-500/10 px-1.5 py-0.5 rounded">
                                ⭐{vocab.difficulty}
                              </span>
                            </div>

                            {/* 2행: 한국어 뜻 (줄바꿈 허용 및 선명한 가독성) */}
                            <p className="text-xs text-foreground/90 font-medium leading-relaxed break-words line-clamp-2">
                              {vocab.meaning || '뜻 없음'}
                            </p>

                            {/* 3행: 출처 태그 (하단에 안전하게 배치) */}
                            {vocab.source && (
                              <div className="pt-0.5">
                                <span className="text-[10px] text-muted-foreground bg-muted/60 px-2 py-0.5 rounded-md inline-block truncate max-w-[260px] sm:max-w-[360px]">
                                  {vocab.source}
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* 3. 하단 확인 버튼 */}
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
