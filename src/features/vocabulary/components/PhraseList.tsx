'use client';

import { useState } from 'react';
import { Plus, Search, Layers, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type { PhraseWithItem, PhraseListResult } from '../types/phraseTypes';

interface PhraseListProps {
  initialData: PhraseListResult | null;
  onAddClick: () => void;
  onItemClick: (phrase: PhraseWithItem) => void;
  onSearch: (query: string) => void;
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
  isLoading = false,
}: PhraseListProps) {
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

      {/* 총 개수 */}
      {total > 0 && (
        <p className="text-xs text-muted-foreground">
          총 <span className="font-semibold text-foreground">{total}</span>개 숙어
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
            return (
              <Card
                key={phrase.id}
                className="card-hover cursor-pointer"
                onClick={() => onItemClick(phrase)}
              >
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <h3 className="text-base font-bold truncate text-foreground">
                        {phrase.phrase}
                      </h3>
                      <p className="text-sm text-muted-foreground mt-0.5 truncate">
                        {phrase.meaning}
                      </p>
                      {phrase.exampleSentence && (
                        <p className="text-xs text-muted-foreground/70 mt-1 truncate italic">
                          {phrase.exampleSentence}
                        </p>
                      )}
                    </div>
                    <Badge
                      variant="secondary"
                      className={`shrink-0 text-[10px] font-semibold ${diff.color}`}
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
