'use client';

import { useState } from 'react';
import { Plus, Search, BookOpen, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type { VocabularyWithItem, VocabularyListResult } from '@/features/vocabulary/types';

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

/**
 * 단어 목록 컴포넌트
 * 검색, 추가, 아이템 클릭 기능
 */
export function VocabularyList({
  initialData,
  onAddClick,
  onItemClick,
  onSearch,
  isLoading = false,
}: VocabularyListProps) {
  const [searchQuery, setSearchQuery] = useState('');

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch(searchQuery);
  };

  const items = initialData?.items ?? [];
  const total = initialData?.total ?? 0;

  return (
    <div className="space-y-4">
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
        <Button onClick={onAddClick} className="shrink-0 gap-1.5">
          <Plus className="h-4 w-4" />
          <span className="hidden sm:inline">단어 추가</span>
        </Button>
      </div>

      {/* 총 개수 */}
      {total > 0 && (
        <p className="text-xs text-muted-foreground">
          총 <span className="font-semibold text-foreground">{total}</span>개
        </p>
      )}

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
              {searchQuery ? '검색 결과가 없습니다' : '등록된 단어가 없습니다'}
            </h3>
            <p className="text-sm text-muted-foreground mb-4">
              {searchQuery
                ? '다른 검색어를 시도해보세요.'
                : '첫 번째 단어를 추가해보세요!'}
            </p>
            {!searchQuery && (
              <Button onClick={onAddClick} size="sm" className="gap-1.5">
                <Plus className="h-3.5 w-3.5" />
                단어 추가
              </Button>
            )}
          </CardContent>
        </Card>
      )}

      {/* 단어 목록 */}
      {!isLoading && items.length > 0 && (
        <div className="space-y-2">
          {items.map((vocab) => {
            const diff = difficultyLabels[vocab.difficulty] ?? difficultyLabels[1];
            return (
              <Card
                key={vocab.id}
                className="card-hover cursor-pointer"
                onClick={() => onItemClick(vocab)}
              >
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="text-base font-bold truncate">
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
                    <Badge
                      variant="secondary"
                      className={`shrink-0 text-[10px] ${diff.color}`}
                    >
                      {diff.label}
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
