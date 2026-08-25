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
  LayoutGrid,
  List as ListIcon,
  Volume2,
  Calendar,
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  AlertTriangle,
  XCircle,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type { PhraseWithItem, PhraseListResult } from '../types/phraseTypes';
import { detectPhraseIssues } from '../utils/vocabularyIssueDetector';
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
  1: { label: '기초', color: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20' },
  2: { label: '쉬움', color: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20' },
  3: { label: '필수', color: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20' },
  4: { label: '심화', color: 'bg-orange-500/10 text-orange-600 dark:text-orange-400 border-orange-500/20' },
  5: { label: '고난도', color: 'bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20' },
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

  // 🗂️ 뷰 모드
  const [viewMode, setViewMode] = useState<'card' | 'list'>('card');

  // 🔍 필터 및 정렬
  const [selectedDifficulty, setSelectedDifficulty] = useState<number | 'all'>('all');
  const [sortOrder, setSortOrder] = useState<'newest' | 'oldest' | 'alphabetical'>('newest');
  const [showOnlyIssues, setShowOnlyIssues] = useState(false);

  // 📄 페이지네이션
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState<number>(24);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch(searchQuery);
    setCurrentPage(1);
  };

  const rawItems = initialData?.items ?? [];
  const total = initialData?.total ?? 0;

  const itemsWithIssues = useMemo(() => {
    return rawItems.filter((p) => detectPhraseIssues(p).hasIssue);
  }, [rawItems]);

  const issuesCount = itemsWithIssues.length;

  const missingCount = useMemo(() => {
    return rawItems.filter(
      (p) =>
        !p.meaning ||
        p.meaning.trim() === '' ||
        p.meaning === '의미 미입력' ||
        p.meaning === '의미 검색 필요' ||
        p.meaning === '뜻 미입력' ||
        !p.exampleSentence
    ).length;
  }, [rawItems]);

  // 필터링 및 정렬
  const filteredAndSortedItems = useMemo(() => {
    let list = [...rawItems];

    if (showOnlyIssues) {
      list = list.filter((p) => detectPhraseIssues(p).hasIssue);
    }

    if (selectedDifficulty !== 'all') {
      list = list.filter((p) => p.difficulty === selectedDifficulty);
    }

    list.sort((a, b) => {
      if (sortOrder === 'newest') {
        return new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime();
      }
      if (sortOrder === 'oldest') {
        return new Date(a.createdAt || 0).getTime() - new Date(b.createdAt || 0).getTime();
      }
      if (sortOrder === 'alphabetical') {
        return a.phrase.localeCompare(b.phrase);
      }
      return 0;
    });

    return list;
  }, [rawItems, showOnlyIssues, selectedDifficulty, sortOrder]);

  // 페이지 슬라이싱
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

  const selectAllIssues = () => {
    const issueIds = itemsWithIssues.map((p) => p.id);
    const next = new Set(selectedIds);
    const allIssueSelected = issueIds.every((id) => selectedIds.has(id));
    if (allIssueSelected) {
      issueIds.forEach((id) => next.delete(id));
    } else {
      issueIds.forEach((id) => next.add(id));
    }
    setSelectedIds(next);
  };

  const deselectAll = () => {
    setSelectedIds(new Set());
  };

  const isAllCurrentPageSelected =
    pagedItems.length > 0 && pagedItems.every((item) => selectedIds.has(item.id));

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
              placeholder="숙어 또는 뜻으로 검색..."
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
            <span className="hidden sm:inline">숙어 추가</span>
          </Button>
        </div>
      </div>

      {/* 💡 누락 숙어 자동 완성 배너 */}
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

      {/* ────────────────────────────────────
          2. 필터 & 정렬 바 (이상 숙어 모아보기 지원)
         ──────────────────────────────────── */}
      <div className="p-3 bg-card/90 backdrop-blur-xs rounded-xl border border-border shadow-xs flex items-center justify-between gap-2 flex-wrap text-xs">
        <div className="flex items-center gap-2 flex-wrap">
          {/* ⚠️ 이상 숙어 자동 감지 퀵 필터 버튼 */}
          <Button
            variant={showOnlyIssues ? 'default' : 'outline'}
            size="sm"
            className={`h-7 text-xs px-2.5 rounded-lg shrink-0 font-bold gap-1 transition-all ${
              showOnlyIssues
                ? 'bg-amber-600 hover:bg-amber-700 text-white border-amber-600 shadow-xs'
                : issuesCount > 0
                ? 'border-amber-500/50 bg-amber-500/10 text-amber-700 dark:text-amber-300 hover:bg-amber-500/20'
                : 'text-muted-foreground'
            }`}
            onClick={() => {
              setShowOnlyIssues(!showOnlyIssues);
              setCurrentPage(1);
            }}
          >
            <AlertTriangle className={`h-3.5 w-3.5 ${showOnlyIssues ? 'text-white' : 'text-amber-500'}`} />
            <span>오류/이상 숙어 감지</span>
            <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-extrabold ${
              showOnlyIssues ? 'bg-white/20 text-white' : 'bg-amber-500/20 text-amber-800 dark:text-amber-200'
            }`}>
              {issuesCount}
            </span>
          </Button>

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
              <option value="1">1단계 (기초)</option>
              <option value="2">2단계 (쉬움)</option>
              <option value="3">3단계 (필수)</option>
              <option value="4">4단계 (심화)</option>
              <option value="5">5단계 (고난도)</option>
            </select>
          </div>

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
            </select>
          </div>
        </div>

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

      {/* ────────────────────────────────────
          3. 상태 바 (선택 해제 버튼 포함)
         ──────────────────────────────────── */}
      <div className="flex items-center justify-between text-xs text-muted-foreground px-1 flex-wrap gap-2">
        <p>
          총 <strong className="text-foreground">{filteredAndSortedItems.length}개</strong>의 숙어
          {showOnlyIssues && <span className="ml-1 text-amber-600 font-bold">(오류 감지 목록)</span>}
          {pageSize < 9999 && ` (페이지 ${currentPage} / ${totalPages})`}
        </p>

        <div className="flex items-center gap-2 flex-wrap">
          {issuesCount > 0 && (
            <button
              onClick={selectAllIssues}
              className="text-xs font-bold text-amber-700 dark:text-amber-300 hover:underline flex items-center gap-1 bg-amber-500/10 px-2.5 py-1 rounded-md transition-colors"
            >
              <AlertTriangle className="h-3 w-3 text-amber-600" />
              오류 {issuesCount}개 선택
            </button>
          )}

          {/* ⚡ 선택 취소 (선택 해제) 버튼 */}
          {selectedIds.size > 0 && (
            <button
              onClick={deselectAll}
              className="text-xs font-bold text-muted-foreground hover:text-foreground flex items-center gap-1 bg-muted hover:bg-muted/80 px-2.5 py-1 rounded-md transition-colors border border-border"
              title="선택된 모든 숙어 선택 해제"
            >
              <XCircle className="h-3.5 w-3.5" />
              선택 해제 ({selectedIds.size}개)
            </button>
          )}

          {selectedIds.size > 0 && onBatchDelete && (
            <button
              onClick={handleBatchDeleteClick}
              className="text-xs font-bold text-destructive hover:underline flex items-center gap-1 bg-destructive/10 hover:bg-destructive/20 px-2.5 py-1 rounded-md transition-colors"
            >
              <Trash2 className="h-3.5 w-3.5" />
              선택 {selectedIds.size}개 삭제
            </button>
          )}

          {pagedItems.length > 0 && (
            <button
              onClick={selectAllCurrentPage}
              className="text-xs font-semibold text-primary hover:underline px-1 py-1"
            >
              {isAllCurrentPageSelected ? '현재 페이지 선택 취소' : '현재 페이지 전체 선택'}
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
              <Layers className="h-8 w-8 text-primary" />
            </div>
            <h3 className="text-base font-bold mb-1">
              {showOnlyIssues ? '감지된 오류/이상 숙어가 없습니다! 🎉' : '등록된 숙어가 없습니다'}
            </h3>
            <p className="text-sm text-muted-foreground mb-4">
              {showOnlyIssues
                ? '모든 숙어가 정상적으로 등록되어 있습니다.'
                : searchQuery
                ? '검색 조건을 변경해보세요.'
                : '새 숙어를 추가해보세요!'}
            </p>
            {showOnlyIssues ? (
              <Button onClick={() => setShowOnlyIssues(false)} size="sm" variant="outline" className="font-bold">
                전체 숙어 보기
              </Button>
            ) : (
              <Button onClick={onAddClick} size="sm" className="font-bold gap-1.5">
                <Plus className="h-4 w-4" /> 숙어 추가하기
              </Button>
            )}
          </CardContent>
        </Card>
      )}

      {/* ────────────────────────────────────
          4-A. 🗂️ 카드 그리드 뷰
         ──────────────────────────────────── */}
      {!isLoading && pagedItems.length > 0 && viewMode === 'card' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2.5 sm:gap-3">
          {pagedItems.map((phrase) => {
            const diff = difficultyLabels[phrase.difficulty] ?? difficultyLabels[1];
            const isSelected = selectedIds.has(phrase.id);
            const issueResult = detectPhraseIssues(phrase);

            return (
              <Card
                key={phrase.id}
                className={`group relative overflow-hidden transition-all cursor-pointer border hover:border-indigo-500/50 hover:shadow-md bg-card/95 backdrop-blur-xs ${
                  isSelected
                    ? 'border-indigo-500 bg-indigo-500/5 ring-1 ring-indigo-500'
                    : issueResult.hasIssue
                    ? 'border-amber-500/40 bg-amber-500/[0.02]'
                    : 'border-border'
                }`}
                onClick={() => onItemClick(phrase)}
              >
                <CardContent className="p-3.5 space-y-2">
                  <div className="flex items-start justify-between gap-1.5">
                    <div className="flex items-center gap-1.5 min-w-0 flex-1">
                      <button
                        type="button"
                        onClick={(e) => toggleSelect(e, phrase.id)}
                        className="text-primary shrink-0 focus:outline-hidden"
                      >
                        {isSelected ? (
                          <CheckSquare className="h-4 w-4 fill-primary text-background" />
                        ) : (
                          <Square className="h-4 w-4 text-muted-foreground/60 group-hover:text-primary" />
                        )}
                      </button>

                      <h3 className="font-bold text-base text-indigo-600 dark:text-indigo-400 truncate tracking-tight">
                        {phrase.phrase}
                      </h3>

                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-5 w-5 text-muted-foreground hover:text-indigo-500 shrink-0"
                        onClick={(e) => handleSpeak(e, phrase.phrase)}
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
                        onClick={(e) => handleDeleteItem(e, phrase.id)}
                        title="숙어 삭제"
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    )}
                  </div>

                  {issueResult.hasIssue && (
                    <div className="flex items-center gap-1">
                      <span className="inline-flex items-center gap-0.5 px-1.5 py-0.2 rounded text-[9px] font-bold bg-amber-500/20 text-amber-700 dark:text-amber-300">
                        <AlertTriangle className="h-2.5 w-2.5 text-amber-600" />
                        {issueResult.primaryLabel}
                      </span>
                    </div>
                  )}

                  <p className="text-xs sm:text-sm text-foreground/90 font-medium line-clamp-2 leading-snug">
                    {phrase.meaning || '의미 검색 필요'}
                  </p>

                  {phrase.exampleSentence && (
                    <p className="text-[11px] text-muted-foreground/75 truncate italic">
                      {phrase.exampleSentence}
                    </p>
                  )}

                  <div className="flex items-center justify-between pt-1 border-t border-border/40 text-[10px] text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Badge variant="outline" className={`px-1.5 py-0 text-[9px] h-4 font-semibold ${diff.color}`}>
                        {diff.label}
                      </Badge>
                      {phrase.confidence !== undefined && phrase.confidence !== null && (
                        <span
                          className={`px-1 py-0.2 rounded text-[9px] font-semibold ${
                            phrase.confidence >= 95
                              ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                              : phrase.confidence >= 80
                              ? 'bg-blue-500/10 text-blue-600 dark:text-blue-400'
                              : 'bg-amber-500/10 text-amber-600 dark:text-amber-400'
                          }`}
                          title={`신뢰도 점수: ${phrase.confidence}점`}
                        >
                          {phrase.confidence >= 95 ? `🛡️ ${phrase.confidence}%` : `✨ ${phrase.confidence}%`}
                        </span>
                      )}
                    </div>
                    <span>{formatDateKey(phrase.createdAt)}</span>
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
          {pagedItems.map((phrase) => {
            const diff = difficultyLabels[phrase.difficulty] ?? difficultyLabels[1];
            const isSelected = selectedIds.has(phrase.id);
            const issueResult = detectPhraseIssues(phrase);

            return (
              <Card
                key={phrase.id}
                className={`card-hover cursor-pointer transition-all group ${
                  isSelected
                    ? 'border-indigo-500/50 bg-indigo-500/5 ring-1 ring-indigo-500/30'
                    : issueResult.hasIssue
                    ? 'border-amber-500/40 bg-amber-500/[0.02]'
                    : 'border-border'
                }`}
                onClick={() => onItemClick(phrase)}
              >
                <CardContent className="p-3 sm:p-3.5">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-2.5 min-w-0 flex-1">
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
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <h3 className="text-base font-bold text-indigo-600 dark:text-indigo-400 truncate">
                            {phrase.phrase}
                          </h3>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="h-5 w-5 text-muted-foreground hover:text-indigo-500 shrink-0"
                            onClick={(e) => handleSpeak(e, phrase.phrase)}
                          >
                            <Volume2 className="h-3 w-3" />
                          </Button>
                          {issueResult.hasIssue && (
                            <span className="inline-flex items-center gap-0.5 px-1.5 py-0.2 rounded text-[10px] font-bold bg-amber-500/20 text-amber-700 dark:text-amber-300">
                              <AlertTriangle className="h-3 w-3 text-amber-600" />
                              {issueResult.primaryLabel}
                            </span>
                          )}
                        </div>

                        <p className="text-sm text-foreground/90 font-medium truncate">
                          {phrase.meaning || '의미 검색 필요'}
                        </p>

                        {phrase.exampleSentence && (
                          <p className="text-xs text-muted-foreground mt-0.5 truncate italic">
                            {phrase.exampleSentence}
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
                            onClick={(e) => handleDeleteItem(e, phrase.id)}
                            title="숙어 삭제"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        )}
                      </div>
                      <span className="text-[10px] text-muted-foreground">
                        {formatDateKey(phrase.createdAt)}
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
          6. 🎯 선택한 숙어 즉시 학습하기 플로팅 액션 바
         ──────────────────────────────────── */}
      {selectedIds.size > 0 && (
        <div className="fixed bottom-20 left-0 right-0 z-40 max-w-lg mx-auto px-4 animate-combo">
          <Card className="bg-indigo-600 text-white shadow-2xl border-indigo-500 p-3 rounded-2xl flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 pl-2">
              <Sparkles className="h-5 w-5 fill-white/30" />
              <span className="text-sm font-bold">
                {selectedIds.size}개 숙어 선택됨
              </span>
            </div>

            <div className="flex items-center gap-1.5">
              <Button
                size="sm"
                variant="ghost"
                className="font-bold text-xs gap-1 text-white hover:bg-white/10"
                onClick={deselectAll}
                title="선택 해제"
              >
                <XCircle className="h-3.5 w-3.5" /> 선택 취소
              </Button>
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
