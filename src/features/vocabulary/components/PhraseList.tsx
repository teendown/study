'use client';

import { useState, useMemo } from 'react';
import {
  Plus,
  Search,
  Layers,
  Loader2,
  Trash2,
  Wand2,
  Sparkles,
  CheckSquare,
  Square,
  Zap,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type { PhraseWithItem, PhraseListResult } from '../types/phraseTypes';
import Link from 'next/link';

interface PhraseListProps {
  initialData: PhraseListResult | null;
  onAddClick: () => void;
  onItemClick: (phrase: PhraseWithItem) => void;
  onSearch: (query: string) => void;
  onDeleteClick?: (id: string) => void;
  onBatchDelete?: (ids: string[]) => void;
  onAutoFillMissing?: () => Promise<void>;
  isAutoFilling?: boolean;
  isLoading?: boolean;
}

const difficultyLabels: Record<number, { label: string; color: string }> = {
  1: { label: '기초', color: 'bg-emerald-500/10 text-emerald-600' },
  2: { label: '쉬움', color: 'bg-blue-500/10 text-blue-600' },
  3: { label: '필수', color: 'bg-amber-500/10 text-amber-600' },
  4: { label: '심화', color: 'bg-orange-500/10 text-orange-600' },
  5: { label: '고난도', color: 'bg-red-500/10 text-red-600' },
};

export function PhraseList({
  initialData,
  onAddClick,
  onItemClick,
  onSearch,
  onDeleteClick,
  onBatchDelete,
  onAutoFillMissing,
  isAutoFilling = false,
  isLoading = false,
}: PhraseListProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch(searchQuery);
  };

  const items = initialData?.items ?? [];
  const total = initialData?.total ?? 0;

  const missingCount = useMemo(() => {
    return items.filter(
      (p) =>
        !p.meaning ||
        p.meaning.trim() === '' ||
        p.meaning === '의미 미입력' ||
        p.meaning === '의미 검색 필요' ||
        p.meaning === '뜻 미입력' ||
        !p.exampleSentence
    ).length;
  }, [items]);

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

  const handleDeleteItem = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    onDeleteClick?.(id);
  };

  const handleBatchDeleteClick = () => {
    if (selectedIds.size === 0) return;
    onBatchDelete?.(Array.from(selectedIds));
    setSelectedIds(new Set());
  };

  return (
    <div className="space-y-4 pb-16 relative">
      {/* 검색 & 추가 버튼 */}
      <div className="flex gap-2">
        <form onSubmit={handleSearch} className="flex-1 flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="숙어 또는 의미로 검색..."
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
          <span className="hidden sm:inline">숙어 추가</span>
        </Button>
      </div>

      {/* 💡 숙어 뜻/정보 누락 자동 완성 배너 */}
      {missingCount > 0 && onAutoFillMissing && (
        <div className="flex items-center justify-between gap-3 p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-900 dark:text-amber-200 text-xs sm:text-sm">
          <div className="flex items-center gap-2">
            <Wand2 className="h-4 w-4 text-amber-600 dark:text-amber-400 shrink-0" />
            <span>
              뜻이나 예문이 누락된 숙어가 <strong className="font-bold text-amber-600 dark:text-amber-400">{missingCount}개</strong> 있습니다.
            </span>
          </div>
          <Button
            size="sm"
            variant="secondary"
            className="h-8 shrink-0 font-bold gap-1.5 bg-amber-500 text-white hover:bg-amber-600 dark:bg-amber-600 dark:hover:bg-amber-500 shadow-xs"
            onClick={onAutoFillMissing}
            disabled={isAutoFilling}
          >
            {isAutoFilling ? (
              <>
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                자동 채우는 중...
              </>
            ) : (
              <>
                <Sparkles className="h-3.5 w-3.5" />
                뜻 자동 채우기
              </>
            )}
          </Button>
        </div>
      )}

      {/* 총 개수, 전체 선택 & 일괄 삭제 */}
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <p>
          총 <span className="font-semibold text-foreground">{total}</span>개 숙어
        </p>
        <div className="flex items-center gap-3">
          {selectedIds.size > 0 && onBatchDelete && (
            <button
              onClick={handleBatchDeleteClick}
              className="text-xs font-semibold text-destructive hover:underline flex items-center gap-1"
            >
              <Trash2 className="h-3.5 w-3.5" />
              선택 {selectedIds.size}개 삭제
            </button>
          )}
          {items.length > 0 && (
            <button
              onClick={selectAll}
              className="text-xs font-semibold text-primary hover:underline"
            >
              {selectedIds.size === items.length ? '전체 해제' : '전체 선택'}
            </button>
          )}
        </div>
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
            <div className="mb-3 rounded-2xl bg-amber-500/10 p-3">
              <Layers className="h-8 w-8 text-amber-500" />
            </div>
            <h3 className="text-base font-semibold mb-1">
              {searchQuery ? '검색 결과가 없습니다' : '등록된 숙어가 없습니다'}
            </h3>
            <p className="text-sm text-muted-foreground mb-4">
              {searchQuery
                ? '다른 검색어로 다시 시도해보세요.'
                : '자주 쓰이는 필수 관용구/숙어를 등록해보세요!'}
            </p>
            {!searchQuery && (
              <Button onClick={onAddClick} size="sm" className="gap-1.5 font-bold">
                <Plus className="h-3.5 w-3.5" />
                숙어 추가
              </Button>
            )}
          </CardContent>
        </Card>
      )}

      {/* 숙어 목록 */}
      {!isLoading && items.length > 0 && (
        <div className="space-y-2">
          {items.map((phrase) => {
            const diff = difficultyLabels[phrase.difficulty] ?? difficultyLabels[1];
            const isSelected = selectedIds.has(phrase.id);
            const isMissing =
              !phrase.meaning ||
              phrase.meaning === '의미 미입력' ||
              phrase.meaning === '의미 검색 필요' ||
              phrase.meaning === '뜻 미입력';

            return (
              <Card
                key={phrase.id}
                className={`card-hover cursor-pointer transition-all group ${
                  isSelected ? 'border-primary/50 bg-primary/5' : ''
                }`}
                onClick={() => onItemClick(phrase)}
              >
                <CardContent className="p-3.5 sm:p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3 min-w-0 flex-1">
                      {/* 체크박스 */}
                      <button
                        type="button"
                        onClick={(e) => toggleSelect(e, phrase.id)}
                        className="mt-0.5 text-primary shrink-0 focus:outline-hidden"
                      >
                        {isSelected ? (
                          <CheckSquare className="h-4.5 w-4.5 fill-primary text-background" />
                        ) : (
                          <Square className="h-4.5 w-4.5 text-muted-foreground/60" />
                        )}
                      </button>

                      <div className="min-w-0 flex-1">
                        <h3 className="text-base font-bold truncate text-foreground">
                          {phrase.phrase}
                        </h3>
                        <p className={`text-sm mt-0.5 truncate ${isMissing ? 'text-amber-500 font-medium italic' : 'text-muted-foreground'}`}>
                          {phrase.meaning || '의미 검색 필요'}
                        </p>
                        {phrase.exampleSentence && (
                          <p className="text-xs text-muted-foreground/70 mt-1 truncate italic">
                            {phrase.exampleSentence}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      <Badge
                        variant="secondary"
                        className={`text-[10px] font-semibold ${diff.color}`}
                      >
                        {diff.label}
                      </Badge>
                      {onDeleteClick && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6 text-muted-foreground hover:text-destructive hover:bg-destructive/10 opacity-70 group-hover:opacity-100 transition-opacity"
                          onClick={(e) => handleDeleteItem(e, phrase.id)}
                          title="숙어 삭제"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* 🎯 선택한 숙어 일괄 액션 바 */}
      {selectedIds.size > 0 && (
        <div className="fixed bottom-20 left-0 right-0 z-40 max-w-lg mx-auto px-4 animate-combo">
          <Card className="bg-primary text-primary-foreground shadow-2xl border-primary/50 p-3 rounded-2xl flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 pl-2">
              <Sparkles className="h-5 w-5 fill-primary-foreground/30" />
              <span className="text-sm font-bold">
                {selectedIds.size}개 숙어 선택됨
              </span>
            </div>

            <div className="flex gap-1.5">
              {onBatchDelete && (
                <Button
                  size="sm"
                  variant="destructive"
                  className="font-bold text-xs gap-1 shadow-xs bg-red-600 hover:bg-red-700 text-white"
                  onClick={handleBatchDeleteClick}
                >
                  <Trash2 className="h-3.5 w-3.5" /> 삭제
                </Button>
              )}
              <Link href={`/study?mode=learning`}>
                <Button
                  size="sm"
                  variant="secondary"
                  className="font-bold text-xs shadow-xs"
                >
                  퀴즈 풀기
                </Button>
              </Link>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
