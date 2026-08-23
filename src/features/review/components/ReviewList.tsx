'use client';

import { useState } from 'react';
import { Volume2, Clock, CheckCircle2, AlertCircle } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import type { WordProgressItem } from '../types';

interface ReviewListProps {
  dueItems: WordProgressItem[];
  weakItems: WordProgressItem[];
}

const masteryBadges: Record<string, { label: string; color: string }> = {
  unlearned: { label: '미학습', color: 'bg-slate-500/10 text-slate-600' },
  learning: { label: '학습중', color: 'bg-amber-500/10 text-amber-600' },
  average: { label: '보통', color: 'bg-blue-500/10 text-blue-600' },
  skilled: { label: '숙련', color: 'bg-emerald-500/10 text-emerald-600' },
  highly_skilled: { label: '매우 숙련', color: 'bg-purple-500/10 text-purple-600' },
  master: { label: '마스터', color: 'bg-pink-500/10 text-pink-600' },
};

export function ReviewList({ dueItems, weakItems }: ReviewListProps) {
  const [activeTab, setActiveTab] = useState<'due' | 'weak'>('due');

  const items = activeTab === 'due' ? dueItems : weakItems;

  const handleSpeak = (word: string) => {
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(word);
      utterance.lang = 'en-US';
      utterance.rate = 0.85;
      window.speechSynthesis.speak(utterance);
    }
  };

  return (
    <div className="space-y-3">
      {/* 탭 버튼 */}
      <div className="flex gap-2 border-b border-border/80 pb-2">
        <Button
          variant={activeTab === 'due' ? 'default' : 'ghost'}
          size="sm"
          className="font-bold gap-1.5"
          onClick={() => setActiveTab('due')}
        >
          <CheckCircle2 className="h-4 w-4" />
          오늘 복습 대상 ({dueItems.length})
        </Button>
        <Button
          variant={activeTab === 'weak' ? 'default' : 'ghost'}
          size="sm"
          className="font-bold gap-1.5"
          onClick={() => setActiveTab('weak')}
        >
          <AlertCircle className="h-4 w-4" />
          취약 단어 ({weakItems.length})
        </Button>
      </div>

      {/* 단어 목록 */}
      {items.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="py-10 text-center text-sm text-muted-foreground">
            {activeTab === 'due'
              ? '🎉 오늘 예정된 복습 단어가 없습니다! 완벽해요.'
              : '👍 반복 오답이나 취약한 단어가 없습니다!'}
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {items.map((item) => {
            const badge = masteryBadges[item.masteryLevel] || masteryBadges.unlearned;
            return (
              <Card key={item.id} className="card-hover">
                <CardContent className="p-3.5 flex items-center justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="font-bold text-base text-foreground truncate">
                        {item.word}
                      </span>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 text-muted-foreground hover:text-primary shrink-0"
                        onClick={() => handleSpeak(item.word)}
                      >
                        <Volume2 className="h-3.5 w-3.5" />
                      </Button>
                      {item.partOfSpeech && (
                        <span className="text-[11px] text-muted-foreground">
                          {item.partOfSpeech}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground truncate">
                      {item.meaning}
                    </p>
                  </div>

                  {/* 숙련도 점수 및 등급 뱃지 */}
                  <div className="flex items-center gap-2 shrink-0">
                    <div className="text-right hidden sm:block">
                      <span className="text-xs font-bold text-primary block">
                        {item.masteryScore}점
                      </span>
                      <span className="text-[10px] text-muted-foreground flex items-center gap-0.5">
                        <Clock className="h-3 w-3" />
                        {item.intervalDays >= 1
                          ? `${Math.round(item.intervalDays)}일 간격`
                          : '단기 복습'}
                      </span>
                    </div>
                    <Badge variant="secondary" className={`text-[10px] ${badge.color}`}>
                      {badge.label}
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
