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
  Trash2,
  Wand2,
  LayoutGrid,
  List as ListIcon,
  Volume2,
  Filter,
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
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
  onDeleteClick?: (id: string) => void;
  onBatchDelete?: (ids: string[]) => void;
  onAutoFillMissing?: () => Promise<void>;
  isAutoFilling?: boolean;
  isLoading?: boolean;
}

const difficultyLabels: Record<number, { label: string; color: string }> = {
  1: { label: '매우 쉬움', color: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20' },
  2: { label: '쉬움', color: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20' },
  3: { label: '보통', color: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20' },
  4: { label: '어려움', color: 'bg-orange-500/10 text-orange-600 dark:text-orange-400 border-orange-500/20' },
  5: { label: '매우 어려움', color: 'bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20' },
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
  onDeleteClick,
  onBatchDelete,
  onAutoFillMissing,
  isAutoFilling = false,
  isLoading = false,
}: VocabularyListProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // 🗂️ 뷰 모드: 카드 그리드(기본) vs 상세 리스트
  const [viewMode, setViewMode] = useState<'card' | 'list'>('card');

  // 🔍 분류 및 필터 상태
  const [selectedDateFilter, setSelectedDateFilter] = useState<string | 'all'>('all');
  const [selectedDifficulty, setSelectedDifficulty] = useState<number | 'all'>('all');
  const [selectedPos, setSelectedPos] = useState<string | 'all'>('all');
  const [sortOrder, setSortOrder] = useState<'newest' | 'oldest' | 'alphabetical' | 'difficulty-asc' | 'difficulty-desc'>('newest');

  // 📄 페이지네이션 상태
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState<number>(24);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch(searchQuery);
    setCurrentPage(1);
  };

  const rawItems = initialData?.items ?? [];
  const total = initialData?.total ?? 0;

  // 뜻이나 정보가 누락된 단어 수 계산
  const missingCount = useMemo(() => {
    return rawItems.filter(
      (v) =>
        !v.meaning ||
        v.meaning.trim() === '' ||
        v.meaning === '의미 미입력' ||
        v.meaning === '의미 검색 필요' ||
        v.meaning === '뜻 미입력' ||
        !v.partOfSpeech ||
        !v.pronunciation
    ).length;
  }, [rawItems]);

  // 등록 날짜 목록 추출
  const availableDates = useMemo(() => {
    const dateSet = new Set<string>();
    rawItems.forEach((v) => {
      dateSet.add(formatDateKey(v.createdAt));
    });
    return Array.from(dateSet).sort().reverse();
  }, [rawItems]);

  // 다중 필터링 및 정렬 적용
  const filteredAndSortedItems = useMemo(() => {
    let list = [...rawItems];

    // 1. 날짜 필터
    if (selectedDateFilter !== 'all') {
      list = list.filter((v) => formatDateKey(v.createdAt) === selectedDateFilter);
    }

    // 2. 난이도 필터
    if (selectedDifficulty !== 'all') {
      list = list.filter((v) => v.difficulty === selectedDifficulty);
    }

    // 3. 품사 필터
    if (selectedPos !== 'all') {
      list = list.filter((v) => {
        const pos = (v.partOfSpeech || '').toLowerCase();
        if (selectedPos === 'noun') return pos.startsWith('n') || pos.includes('명');
        if (selectedPos === 'verb') return pos.startsWith('v') || pos.includes('동');
        if (selectedPos === 'adj') return pos.startsWith('adj') || pos.includes('형');
        if (selectedPos === 'adv') return pos.startsWith('adv') || pos.includes('부');
        return true;
      });
    }

    // 4. 정렬
    list.sort((a, b) => {
      if (sortOrder === 'newest') {
        return new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime();
      }
      if (sortOrder === 'oldest') {
        return new Date(a.createdAt || 0).getTime() - new Date(b.createdAt || 0).getTime();
      }
      if (sortOrder === 'alphabetical') {
        return a.word.localeCompare(b.word);
      }
      if (sortOrder === 'difficulty-desc') {
        return (b.difficulty || 2) - (a.difficulty || 2);
      }
      if (sortOrder === 'difficulty-asc') {
        return (a.difficulty || 2) - (b.difficulty || 2);
      }
      return 0;
    });

    return list;
  }, [rawItems, selectedDateFilter, selectedDifficulty, selectedPos, sortOrder]);

  // 페이지네이션 슬라이싱
  const totalPages = Math.max(1, Math.ceil(filteredAndSortedItems.length / pageSize));
  const pagedItems = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredAndSortedItems.slice(start, start + pageSize);
  }, [filteredAndSortedItems, currentPage, pageSize]);

  const toggleSelect = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    const next = new Set(selectedIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedIds(next);
  };

  const selectAllCurrentPage = () => {
    const pageIds = pagedItems.map((i) => i.id);
    const allSelected = pageIds.every((id) => selectedIds.has(id));
    const next = new Set(selectedIds);
    if (allSelected) {
      pageIds.forEach((id) => next.delete(id));
    } else {
      pageIds.forEach((id) => next.add(id));
    }
    setSelectedIds(next);
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

  const handleSpeak = (e: React.MouseEvent, text: string) => {
    e.stopPropagation();
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const u = new SpeechSynthesisUtterance(text);
      u.lang = 'en-US';
      u.rate = 0.9;
      window.speechSynthesis.speak(u);
    }
  };

  return (
    <div className="space-y-4 pb-20 relative max-w-7xl mx-auto">
      {/* ────────────────────────────────────
          1. 상단 검색 및 액션 툴바
         ──────────────────────────────────── */}
      <div className="flex gap-2 flex-wrap sm:flex-nowrap">
        <form onSubmit={handleSearch} className="flex-1 flex gap-2 min-w-[240px]">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              id="vocab-search"
              placeholder="단어 또는 뜻으로 검색..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 h-9.5 text-sm"
            />
          </div>
          <Button type="submit" variant="secondary" size="sm" className="h-9.5 px-3 shrink-0 font-bold">
            <Search className="h-4 w-4" />
          </Button>
        </form>

        <div className="flex items-center gap-1.5 shrink-0">
          {/* 카드/리스트 뷰 전환 */}
          <div className="flex bg-muted/80 p-0.5 rounded-lg border border-border">
            <Button
              type="button"
              variant={viewMode === 'card' ? 'default' : 'ghost'}
              size="icon"
              className="h-8 w-8 rounded-md"
              onClick={() => setViewMode('card')}
              title="카드 그리드 뷰 (태블릿/모바일 추천)"
            >
              <LayoutGrid className="h-4 w-4" />
            </Button>
            <Button
              type="button"
              variant={viewMode === 'list' ? 'default' : 'ghost'}
              size="icon"
              className="h-8 w-8 rounded-md"
              onClick={() => setViewMode('list')}
              title="상세 리스트 뷰"
            >
              <ListIcon className="h-4 w-4" />
            </Button>
          </div>

          <Button onClick={onAddClick} className="h-9.5 gap-1.5 font-bold shadow-xs">
            <Plus className="h-4 w-4" />
            <span className="hidden sm:inline">단어 추가</span>
          </Button>
        </div>
      </div>

      {/* 💡 뜻/정보 누락 단어 자동 완성 배너 */}
      {missingCount > 0 && onAutoFillMissing && (
        <div className="flex items-center justify-between gap-3 p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-900 dark:text-amber-200 text-xs sm:text-sm">
          <div className="flex items-center gap-2">
            <Wand2 className="h-4 w-4 text-amber-600 dark:text-amber-400 shrink-0" />
            <span>
              뜻이나 발음이 누락된 단어가 <strong className="font-bold text-amber-600 dark:text-amber-400">{missingCount}개</strong> 있습니다.
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

      {/* ────────────────────────────────────
          2. 다차원 분류 및 필터 바 (날짜, 난이도, 품사, 정렬, 페이지당 개수)
         ──────────────────────────────────── */}
      <div className="p-3 bg-card/90 backdrop-blur-xs rounded-xl border border-border shadow-xs space-y-2.5 text-xs">
        {/* 1행: 날짜 필터 칩 */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5 no-scrollbar">
          <span className="text-muted-foreground font-semibold flex items-center gap-1 shrink-0 mr-1">
            <Calendar className="h-3.5 w-3.5" /> 날짜:
          </span>
          <Button
            variant={selectedDateFilter === 'all' ? 'default' : 'outline'}
            size="sm"
            className="h-6.5 text-[11px] px-2.5 rounded-lg shrink-0 font-medium"
            onClick={() => {
              setSelectedDateFilter('all');
              setCurrentPage(1);
            }}
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
                className="h-6.5 text-[11px] px-2.5 rounded-lg shrink-0 font-medium"
                onClick={() => {
                  setSelectedDateFilter(dKey);
                  setCurrentPage(1);
                }}
              >
                {getDateLabel(dKey)} ({countOnDate})
              </Button>
            );
          })}
        </div>

        {/* 2행: 난이도 / 품사 / 정렬 / 페이지 단위 선택 */}
        <div className="flex items-center justify-between gap-2 flex-wrap pt-1 border-t border-border/50">
          <div className="flex items-center gap-2 flex-wrap">
            {/* 난이도 셀렉트 */}
            <div className="flex items-center gap-1">
              <span className="text-muted-foreground font-medium">난이도:</span>
              <select
                value={selectedDifficulty}
                onChange={(e) => {
                  setSelectedDifficulty(e.target.value === 'all' ? 'all' : Number(e.target.value));
                  setCurrentPage(1);
                }}
                className="h-7 rounded-md border border-input bg-background px-2 py-0.5 text-xs text-foreground focus:outline-hidden"
              >
                <option value="all">전체 난이도</option>
                <option value="1">1단계 (매우 쉬움)</option>
                <option value="2">2단계 (쉬움)</option>
                <option value="3">3단계 (보통)</option>
                <option value="4">4단계 (어려움)</option>
                <option value="5">5단계 (매우 어려움)</option>
              </select>
            </div>

            {/* 품사 셀렉트 */}
            <div className="flex items-center gap-1">
              <span className="text-muted-foreground font-medium">품사:</span>
              <select
                value={selectedPos}
                onChange={(e) => {
                  setSelectedPos(e.target.value);
                  setCurrentPage(1);
                }}
                className="h-7 rounded-md border border-input bg-background px-2 py-0.5 text-xs text-foreground focus:outline-hidden"
              >
                <option value="all">전체 품사</option>
                <option value="noun">명사 (n.)</option>
                <option value="verb">동사 (v.)</option>
                <option value="adj">형용사 (adj.)</option>
                <option value="adv">부사 (adv.)</option>
              </select>
            </div>

            {/* 정렬 셀렉트 */}
            <div className="flex items-center gap-1">
              <ArrowUpDown className="h-3 w-3 text-muted-foreground" />
              <select
                value={sortOrder}
                onChange={(e) => setSortOrder(e.target.value as typeof sortOrder)}
                className="h-7 rounded-md border border-input bg-background px-2 py-0.5 text-xs text-foreground focus:outline-hidden"
              >
                <option value="newest">최신 등록순</option>
                <option value="oldest">오래된순</option>
                <option value="alphabetical">알파벳순 (A-Z)</option>
                <option value="difficulty-desc">난이도 높은순</option>
                <option value="difficulty-asc">난이도 낮은순</option>
              </select>
            </div>
          </div>

          {/* 한 페이지당 표시 개수 */}
          <div className="flex items-center gap-1.5 ml-auto">
            <span className="text-muted-foreground font-medium">보기:</span>
            <select
              value={pageSize}
              onChange={(e) => {
                setPageSize(Number(e.target.value));
                setCurrentPage(1);
              }}
              className="h-7 rounded-md border border-input bg-background px-2 py-0.5 text-xs text-foreground font-semibold focus:outline-hidden"
            >
              <option value="12">12개씩 끊어보기</option>
              <option value="24">24개씩 끊어보기</option>
              <option value="48">48개씩 끊어보기</option>
              <option value="9999">전체 한 번에 보기</option>
            </select>
          </div>
        </div>
      </div>

      {/* ────────────────────────────────────
          3. 상태 바: 표시 건수, 선택/일괄삭제
         ──────────────────────────────────── */}
      <div className="flex items-center justify-between text-xs text-muted-foreground px-1">
        <p>
          총 <strong className="text-foreground">{filteredAndSortedItems.length}개</strong>의 단어
          {pageSize < 9999 && ` (페이지 ${currentPage} / ${totalPages})`}
        </p>

        <div className="flex items-center gap-3">
          {selectedIds.size > 0 && onBatchDelete && (
            <button
              onClick={handleBatchDeleteClick}
              className="text-xs font-bold text-destructive hover:underline flex items-center gap-1"
            >
              <Trash2 className="h-3.5 w-3.5" />
              선택 {selectedIds.size}개 삭제
            </button>
          )}
          {pagedItems.length > 0 && (
            <button
              onClick={selectAllCurrentPage}
              className="text-xs font-semibold text-primary hover:underline"
            >
              현재 페이지 전체 선택
            </button>
          )}
        </div>
      </div>

      {/* 로딩 상태 */}
      {isLoading && (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="h-7 w-7 animate-spin text-primary" />
        </div>
      )}

      {/* 빈 상태 */}
      {!isLoading && pagedItems.length === 0 && (
        <Card className="border-dashed bg-card/50">
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <div className="mb-3 rounded-2xl bg-primary/10 p-3.5">
              <BookOpen className="h-8 w-8 text-primary" />
            </div>
            <h3 className="text-base font-bold mb-1">등록된 단어가 없습니다</h3>
            <p className="text-sm text-muted-foreground mb-4">
              {searchQuery ? '검색 조건을 변경해보세요.' : '새 단어를 추가하거나 사진 OCR로 등록해보세요!'}
            </p>
            <Button onClick={onAddClick} size="sm" className="font-bold gap-1.5">
              <Plus className="h-4 w-4" /> 단어 추가하기
            </Button>
          </CardContent>
        </Card>
      )}

      {/* ────────────────────────────────────
          4-A. 🗂️ 카드 그리드 뷰 (모바일 2열, 태블릿 3열, PC 4열)
         ──────────────────────────────────── */}
      {!isLoading && pagedItems.length > 0 && viewMode === 'card' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2.5 sm:gap-3">
          {pagedItems.map((vocab) => {
            const diff = difficultyLabels[vocab.difficulty] ?? difficultyLabels[1];
            const isSelected = selectedIds.has(vocab.id);
            const isMissing =
              !vocab.meaning ||
              vocab.meaning === '의미 미입력' ||
              vocab.meaning === '의미 검색 필요' ||
              vocab.meaning === '뜻 미입력';

            return (
              <Card
                key={vocab.id}
                className={`group relative overflow-hidden transition-all cursor-pointer border hover:border-primary/50 hover:shadow-md bg-card/95 backdrop-blur-xs ${
                  isSelected ? 'border-primary bg-primary/5 ring-1 ring-primary' : 'border-border'
                }`}
                onClick={() => onItemClick(vocab)}
              >
                <CardContent className="p-3.5 space-y-2">
                  {/* 상단: 체크박스 + 단어명 + 발음 듣기 + 삭제 */}
                  <div className="flex items-start justify-between gap-1.5">
                    <div className="flex items-center gap-1.5 min-w-0 flex-1">
                      <button
                        type="button"
                        onClick={(e) => toggleSelect(e, vocab.id)}
                        className="text-primary shrink-0 focus:outline-hidden"
                      >
                        {isSelected ? (
                          <CheckSquare className="h-4 w-4 fill-primary text-background" />
                        ) : (
                          <Square className="h-4 w-4 text-muted-foreground/60 group-hover:text-primary" />
                        )}
                      </button>

                      <h3 className="font-bold text-base text-foreground truncate tracking-tight">
                        {vocab.word}
                      </h3>

                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-5 w-5 text-muted-foreground hover:text-primary shrink-0"
                        onClick={(e) => handleSpeak(e, vocab.word)}
                        title="원어민 발음 듣기"
                      >
                        <Volume2 className="h-3 w-3" />
                      </Button>
                    </div>

                    {onDeleteClick && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 -mr-1 -mt-1 text-muted-foreground/50 hover:text-destructive hover:bg-destructive/10 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={(e) => handleDeleteItem(e, vocab.id)}
                        title="단어 삭제"
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    )}
                  </div>

                  {/* 중간: 품사 & 한글 발음 표기 */}
                  <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground flex-wrap">
                    {vocab.partOfSpeech && (
                      <span className="font-semibold text-primary bg-primary/10 px-1.5 py-0.2 rounded text-[10px]">
                        {vocab.partOfSpeech}
                      </span>
                    )}
                    {vocab.pronunciation && (
                      <span className="text-muted-foreground/80 font-mono">
                        {vocab.pronunciation}
                      </span>
                    )}
                  </div>

                  {/* 뜻 영역 (2줄까지 표시) */}
                  <p
                    className={`text-xs sm:text-sm line-clamp-2 leading-snug ${
                      isMissing ? 'text-amber-500 font-medium italic' : 'text-foreground/90 font-medium'
                    }`}
                  >
                    {vocab.meaning || '의미 검색 필요'}
                  </p>

                  {/* 하단: 난이도 배지, 신뢰도 & 등록일 */}
                  <div className="flex items-center justify-between pt-1 border-t border-border/40 text-[10px] text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Badge variant="outline" className={`px-1.5 py-0 text-[9px] h-4 font-semibold ${diff.color}`}>
                        {diff.label}
                      </Badge>
                      {vocab.confidence !== undefined && vocab.confidence !== null && (
                        <span
                          className={`px-1 py-0.2 rounded text-[9px] font-semibold ${
                            vocab.confidence >= 95
                              ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                              : vocab.confidence >= 80
                              ? 'bg-blue-500/10 text-blue-600 dark:text-blue-400'
                              : 'bg-amber-500/10 text-amber-600 dark:text-amber-400'
                          }`}
                          title={`신뢰도 점수: ${vocab.confidence}점`}
                        >
                          {vocab.confidence >= 95 ? `🛡️ ${vocab.confidence}%` : `✨ ${vocab.confidence}%`}
                        </span>
                      )}
                    </div>
                    <span>{formatDateKey(vocab.createdAt)}</span>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* ────────────────────────────────────
          4-B. 📋 상세 리스트 뷰
         ──────────────────────────────────── */}
      {!isLoading && pagedItems.length > 0 && viewMode === 'list' && (
        <div className="space-y-2">
          {pagedItems.map((vocab) => {
            const diff = difficultyLabels[vocab.difficulty] ?? difficultyLabels[1];
            const isSelected = selectedIds.has(vocab.id);
            const isMissing =
              !vocab.meaning ||
              vocab.meaning === '의미 미입력' ||
              vocab.meaning === '의미 검색 필요' ||
              vocab.meaning === '뜻 미입력';

            return (
              <Card
                key={vocab.id}
                className={`card-hover cursor-pointer transition-all group ${
                  isSelected ? 'border-primary/50 bg-primary/5 ring-1 ring-primary/30' : 'border-border'
                }`}
                onClick={() => onItemClick(vocab)}
              >
                <CardContent className="p-3 sm:p-3.5">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-2.5 min-w-0 flex-1">
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
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <h3 className="text-base font-bold text-foreground truncate">
                            {vocab.word}
                          </h3>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="h-5 w-5 text-muted-foreground hover:text-primary shrink-0"
                            onClick={(e) => handleSpeak(e, vocab.word)}
                          >
                            <Volume2 className="h-3 w-3" />
                          </Button>
                          {vocab.partOfSpeech && (
                            <span className="text-[10px] font-semibold text-primary bg-primary/10 px-1.5 py-0.2 rounded">
                              {vocab.partOfSpeech}
                            </span>
                          )}
                          {vocab.pronunciation && (
                            <span className="text-[11px] text-muted-foreground/80 font-mono">
                              {vocab.pronunciation}
                            </span>
                          )}
                        </div>

                        <p className={`text-sm truncate ${isMissing ? 'text-amber-500 font-medium italic' : 'text-foreground/90 font-medium'}`}>
                          {vocab.meaning || '의미 검색 필요'}
                        </p>

                        {vocab.exampleSentence && (
                          <p className="text-xs text-muted-foreground mt-0.5 truncate italic">
                            {vocab.exampleSentence}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="flex flex-col items-end gap-1 shrink-0">
                      <div className="flex items-center gap-1">
                        <Badge variant="outline" className={`text-[10px] ${diff.color}`}>
                          {diff.label}
                        </Badge>
                        {onDeleteClick && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6 text-muted-foreground hover:text-destructive hover:bg-destructive/10 opacity-70 group-hover:opacity-100 transition-opacity"
                            onClick={(e) => handleDeleteItem(e, vocab.id)}
                            title="단어 삭제"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        )}
                      </div>
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

      {/* ────────────────────────────────────
          5. 📄 페이지네이션 네비게이션
         ──────────────────────────────────── */}
      {!isLoading && totalPages > 1 && (
        <div className="flex items-center justify-center gap-1.5 pt-4 pb-2">
          <Button
            variant="outline"
            size="icon"
            className="h-8 w-8 rounded-lg"
            onClick={() => setCurrentPage(1)}
            disabled={currentPage === 1}
            title="첫 페이지"
          >
            <ChevronsLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            className="h-8 w-8 rounded-lg"
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            disabled={currentPage === 1}
            title="이전 페이지"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>

          {/* 페이지 번호 목록 */}
          <div className="flex items-center gap-1 px-1">
            {Array.from({ length: totalPages }, (_, i) => i + 1)
              .filter((p) => Math.abs(p - currentPage) <= 2 || p === 1 || p === totalPages)
              .map((p, idx, arr) => {
                const prev = arr[idx - 1];
                const showEllipsis = prev && p - prev > 1;

                return (
                  <div key={p} className="flex items-center gap-1">
                    {showEllipsis && <span className="text-muted-foreground px-1">...</span>}
                    <Button
                      variant={currentPage === p ? 'default' : 'outline'}
                      size="sm"
                      className={`h-8 w-8 p-0 rounded-lg text-xs font-bold ${
                        currentPage === p ? 'shadow-xs' : ''
                      }`}
                      onClick={() => setCurrentPage(p)}
                    >
                      {p}
                    </Button>
                  </div>
                );
              })}
          </div>

          <Button
            variant="outline"
            size="icon"
            className="h-8 w-8 rounded-lg"
            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
            title="다음 페이지"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            className="h-8 w-8 rounded-lg"
            onClick={() => setCurrentPage(totalPages)}
            disabled={currentPage === totalPages}
            title="마지막 페이지"
          >
            <ChevronsRight className="h-4 w-4" />
          </Button>
        </div>
      )}

      {/* ────────────────────────────────────
          6. 🎯 선택한 단어 즉시 학습하기 플로팅 액션 바
         ──────────────────────────────────── */}
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
                  className="font-bold text-xs shadow-xs font-bold"
                >
                  퀴즈 풀기
                </Button>
              </Link>
              <Link href={`/study?mode=speed`}>
                <Button
                  size="sm"
                  variant="secondary"
                  className="font-bold text-xs gap-1 shadow-xs bg-amber-400 hover:bg-amber-300 text-amber-950 font-bold"
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

