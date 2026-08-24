'use client';

import { useState } from 'react';
import {
  FileText,
  Search,
  Plus,
  Camera,
  BookOpen,
  Calendar,
  Layers,
  Volume2,
  Trash2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type { PassageItem, PassageListResult } from '../types/passageTypes';

interface PassageListProps {
  initialData: PassageListResult;
  onAddClick: () => void;
  onOcrClick?: () => void;
  onItemClick: (item: PassageItem) => void;
  onDeleteClick?: (id: string) => void;
  onSearch: (query: string) => void;
  isLoading?: boolean;
}

export function PassageList({
  initialData,
  onAddClick,
  onOcrClick,
  onItemClick,
  onDeleteClick,
  onSearch,
  isLoading = false,
}: PassageListProps) {
  const [searchQuery, setSearchQuery] = useState('');

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setSearchQuery(val);
    onSearch(val);
  };

  const getDifficultyBadge = (diff: number) => {
    switch (diff) {
      case 1:
        return <Badge variant="secondary" className="text-[10px] bg-emerald-500/10 text-emerald-600">⭐ 기초</Badge>;
      case 2:
        return <Badge variant="secondary" className="text-[10px] bg-blue-500/10 text-blue-600">⭐⭐ 기본</Badge>;
      case 3:
        return <Badge variant="secondary" className="text-[10px] bg-amber-500/10 text-amber-600">⭐⭐⭐ 실전</Badge>;
      default:
        return <Badge variant="secondary" className="text-[10px] bg-rose-500/10 text-rose-600">⭐⭐⭐⭐ 심화</Badge>;
    }
  };

  return (
    <div className="space-y-4">
      {/* 상단 툴바: 검색 및 등록 버튼 */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="지문 제목, 본문 내용, 출처 검색..."
            value={searchQuery}
            onChange={handleSearchChange}
            className="pl-9 h-10 bg-card/90"
          />
        </div>

        <div className="flex items-center gap-2">
          {onOcrClick && (
            <Button
              type="button"
              variant="outline"
              onClick={onOcrClick}
              className="gap-1.5 font-bold border-primary/30 text-primary hover:bg-primary/10"
            >
              <Camera className="h-4 w-4" />
              지문 OCR 촬영
            </Button>
          )}
          <Button
            type="button"
            onClick={onAddClick}
            className="gap-1.5 font-bold bg-primary hover:bg-primary/90 text-primary-foreground shadow-sm"
          >
            <Plus className="h-4 w-4" />
            새 지문 직접 등록
          </Button>
        </div>
      </div>

      {/* 안내 배너 */}
      <div className="flex items-center justify-between text-xs text-muted-foreground px-1">
        <span>
          등록된 독해 지문: <strong className="text-foreground font-bold">{initialData.total}</strong>개
        </span>
        <span className="text-[11px]">지문을 클릭하면 문장별 독해 및 음성 학습이 가능합니다.</span>
      </div>

      {/* 지문 카드 그리드 */}
      {initialData.items.length === 0 ? (
        <Card className="border-dashed border-2 py-12 text-center bg-card/60">
          <CardContent className="space-y-3">
            <FileText className="h-12 w-12 mx-auto text-muted-foreground/50" />
            <div className="space-y-1">
              <h3 className="font-bold text-base">등록된 독해 지문이 없습니다</h3>
              <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                교재 사진을 찍어 [지문 OCR 촬영]을 하거나 [새 지문 직접 등록] 버튼을 눌러 영어 본문을 추가해 보세요.
              </p>
            </div>
            <div className="flex justify-center gap-2 pt-2">
              {onOcrClick && (
                <Button size="sm" variant="outline" onClick={onOcrClick} className="gap-1.5">
                  <Camera className="h-4 w-4" /> OCR 지문 촬영
                </Button>
              )}
              <Button size="sm" onClick={onAddClick} className="gap-1.5">
                <Plus className="h-4 w-4" /> 지문 등록
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
          {initialData.items.map((item) => {
            const wordCount = item.content.trim().split(/\s+/).filter(Boolean).length;
            const sentencesCount = item.sentences?.length || 0;

            return (
              <Card
                key={item.id}
                onClick={() => onItemClick(item)}
                className="group cursor-pointer hover:border-primary/50 transition-all duration-200 hover:shadow-md bg-card/90 backdrop-blur-xs flex flex-col justify-between"
              >
                <CardContent className="p-4 space-y-3">
                  {/* 상단 태그 및 출처 */}
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      {getDifficultyBadge(item.difficulty)}
                      <span className="text-[11px] font-medium text-muted-foreground bg-muted/60 px-2 py-0.5 rounded">
                        {item.source}
                      </span>
                    </div>

                    {onDeleteClick && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-muted-foreground opacity-0 group-hover:opacity-100 hover:text-destructive transition-opacity"
                        onClick={(e) => {
                          e.stopPropagation();
                          onDeleteClick(item.id);
                        }}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    )}
                  </div>

                  {/* 제목 */}
                  <h4 className="font-bold text-base text-foreground group-hover:text-primary transition-colors line-clamp-1">
                    {item.title}
                  </h4>

                  {/* 본문 미리보기 */}
                  <p className="text-xs text-muted-foreground/90 line-clamp-2 leading-relaxed font-sans">
                    {item.content}
                  </p>

                  {/* 하단 통계 정보 */}
                  <div className="flex items-center justify-between pt-2 border-t border-border/60 text-[11px] text-muted-foreground">
                    <div className="flex items-center gap-3">
                      <span className="flex items-center gap-1 font-medium">
                        <BookOpen className="h-3.5 w-3.5 text-primary/70" />
                        {wordCount}단어
                      </span>
                      <span className="flex items-center gap-1 font-medium">
                        <Layers className="h-3.5 w-3.5 text-primary/70" />
                        {sentencesCount}문장
                      </span>
                    </div>

                    <span className="flex items-center gap-1 text-[10px]">
                      <Calendar className="h-3 w-3" />
                      {new Date(item.createdAt).toLocaleDateString('ko-KR')}
                    </span>
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
