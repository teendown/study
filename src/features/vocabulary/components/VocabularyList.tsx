'use client';

import { useState, useMemo } from 'react';
import {
  Plus,
  Search,
  BookOpen,
  Loader2,
  CheckSquare,
  Square,
  Sparkles,
  Zap,
  Calendar,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type { VocabularyWithItem, VocabularyListResult } from '../types';
import Link from 'next/link';

interface VocabularyListProps {
  initialData: VocabularyListResult | null;
  onAddClick: () => void;
  onItemClick: (vocab: VocabularyWithItem) => void;
  onSearch: (query: string) => void;
  isLoading?: boolean;
}

const difficultyLabels: Record<number, { label: string; color: string }> = {
  1: { label: '매우 쉬움', color: 'bg-emerald-500/10 text-emerald-600' },
  2: { label: '쉬움', color: 'bg-blue-500/10 text-blue-600' },
  3: { label: '보통', color: 'bg-amber-500/10 text-amber-600' },
  4: { label: '어려움', color: 'bg-orange-500/10 text-orange-600' },
  5: { label: '매우 어려움', color: 'bg-red-500/10 text-red-600' },
};

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

export function VocabularyList({
  initialData,
  onAddClick,
  onItemClick,
  onSearch,
  isLoading = false,
}: VocabularyListProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [selectedDateFilter, setSelectedDateFilter] = useState<string | 'all'>('all');

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch(searchQuery);
  };

  const rawItems = initialData?.items ?? [];
  const total = initialData?.total ?? 0;

  // 등록 날짜 목록 추출
  const availableDates = useMemo(() => {
    const dateSet = new Set<string>();
    rawItems.forEach((v) => {
      dateSet.add(formatDateKey(v.createdAt));
    });
    return Array.from(dateSet).sort().reverse();
  }, [rawItems]);

  // 날짜 필터링된 단어 목록
  const items = useMemo(() => {
    if (selectedDateFilter === 'all') return rawItems;
    return rawItems.filter((v) => formatDateKey(v.createdAt) === selectedDateFilter);
  }, [rawItems, selectedDateFilter]);

  const toggleSelect = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    const next = new Set(selectedIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedIds(next);
  };

  const selectAll = () => {
    if (selectedIds.size === items.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(items.map((i) => i.id)));
    }
  };

  return (
    <div className="space-y-4 pb-16 relative">
      {/* 검색 & 추가 버튼 */}
      <div className="flex gap-2">
        <form onSubmit={handleSearch} className="flex-1 flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              id="vocab-search"
              placeholder="단어 또는 뜻으로 검색..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
          <Button type="submit" variant="secondary" size="icon" className="shrink-0">
            <Search className="h-4 w-4" />
          </Button>
        </form>
        <Button onClick={onAddClick} className="shrink-0 gap-1.5 font-bold">
          <Plus className="h-4 w-4" />
          <span className="hidden sm:inline">단어 추가</span>
        </Button>
      </div>

      {/* 📅 등록 날짜별 필터 칩 */}
      {availableDates.length > 0 && (
        <div className="flex gap-1.5 overflow-x-auto pb-1 text-xs no-scrollbar">
          <Button
            variant={selectedDateFilter === 'all' ? 'default' : 'outline'}
            size="sm"
            className="h-7 text-[11px] px-2.5 rounded-lg shrink-0 font-semibold"
            onClick={() => setSelectedDateFilter('all')}
          >
            전체 날짜 ({rawItems.length})
          </Button>
          {availableDates.map((dKey) => {
            const countOnDate = rawItems.filter((v) => formatDateKey(v.createdAt) === dKey).length;
            return (
              <Button
                key={dKey}
                variant={selectedDateFilter === dKey ? 'default' : 'outline'}
                size="sm"
                className="h-7 text-[11px] px-2.5 rounded-lg shrink-0 font-semibold gap-1"
                onClick={() => setSelectedDateFilter(dKey)}
              >
                <Calendar className="h-3 w-3" />
                {getDateLabel(dKey)} ({countOnDate})
              </Button>
            );
          })}
        </div>
      )}

      {/* 총 개수 & 전체 선택 */}
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <p>
          표시 중인 단어 <span className="font-semibold text-foreground">{items.length}</span>개
          {selectedDateFilter !== 'all' && ` (전체 ${total}개)`}
        </p>
        {items.length > 0 && (
          <button
            onClick={selectAll}
            className="text-xs font-semibold text-primary hover:underline"
          >
            {selectedIds.size === items.length ? '전체 해제' : '현재 목록 전체 선택'}
          </button>
        )}
      </div>

      {/* 로딩 상태 */}
      {isLoading && (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </div>
      )}

      {/* 빈 상태 */}
      {!isLoading && items.length === 0 && (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <div className="mb-3 rounded-2xl bg-primary/10 p-3">
              <BookOpen className="h-8 w-8 text-primary" />
            </div>
            <h3 className="text-base font-semibold mb-1">
              {searchQuery ? '검색 결과가 없습니다' : '해당 날짜에 등록된 단어가 없습니다'}
            </h3>
            <p className="text-sm text-muted-foreground mb-4">
              {searchQuery
                ? '다른 검색어를 시도해보세요.'
                : '새로운 단어를 추가해보세요!'}
            </p>
          </CardContent>
        </Card>
      )}

      {/* 단어 목록 */}
      {!isLoading && items.length > 0 && (
        <div className="space-y-2">
          {items.map((vocab) => {
            const diff = difficultyLabels[vocab.difficulty] ?? difficultyLabels[1];
            const isSelected = selectedIds.has(vocab.id);

            return (
              <Card
                key={vocab.id}
                className={`card-hover cursor-pointer transition-all ${
                  isSelected ? 'border-primary/50 bg-primary/5' : ''
                }`}
                onClick={() => onItemClick(vocab)}
              >
                <CardContent className="p-3.5 sm:p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3 min-w-0 flex-1">
                      {/* 체크박스 */}
                      <button
                        type="button"
                        onClick={(e) => toggleSelect(e, vocab.id)}
                        className="mt-0.5 text-primary shrink-0 focus:outline-hidden"
                      >
                        {isSelected ? (
                          <CheckSquare className="h-4.5 w-4.5 fill-primary text-background" />
                        ) : (
                          <Square className="h-4.5 w-4.5 text-muted-foreground/60" />
                        )}
                      </button>

                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="text-base font-bold truncate text-foreground">
                            {vocab.word}
                          </h3>
                          {vocab.partOfSpeech && (
                            <span className="text-[11px] text-muted-foreground shrink-0">
                              {vocab.partOfSpeech}
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground truncate">
                          {vocab.meaning}
                        </p>
                        {vocab.exampleSentence && (
                          <p className="text-xs text-muted-foreground/70 mt-1 truncate italic">
                            {vocab.exampleSentence}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="flex flex-col items-end gap-1 shrink-0">
                      <Badge
                        variant="secondary"
                        className={`text-[10px] ${diff.color}`}
                      >
                        {diff.label}
                      </Badge>
                      <span className="text-[10px] text-muted-foreground">
                        {formatDateKey(vocab.createdAt)}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* 🎯 선택한 단어 즉시 학습하기 플로팅 액션 바 */}
      {selectedIds.size > 0 && (
        <div className="fixed bottom-20 left-0 right-0 z-40 max-w-lg mx-auto px-4 animate-combo">
          <Card className="bg-primary text-primary-foreground shadow-2xl border-primary/50 p-3 rounded-2xl flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 pl-2">
              <Sparkles className="h-5 w-5 fill-primary-foreground/30" />
              <span className="text-sm font-bold">
                {selectedIds.size}개 단어 선택됨
              </span>
            </div>

            <div className="flex gap-1.5">
              <Link href={`/study?mode=learning`}>
                <Button
                  size="sm"
                  variant="secondary"
                  className="font-bold text-xs shadow-xs"
                >
                  퀴즈 풀기
                </Button>
              </Link>
              <Link href={`/study?mode=speed`}>
                <Button
                  size="sm"
                  variant="secondary"
                  className="font-bold text-xs gap-1 shadow-xs bg-amber-400 hover:bg-amber-300 text-amber-950"
                >
                  <Zap className="h-3.5 w-3.5" /> 섀도잉
                </Button>
              </Link>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
