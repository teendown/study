'use client';

import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  GraduationCap,
  Sparkles,
  Zap,
  RotateCcw,
  FileText,
  Play,
  Layers,
  BookOpen,
  CheckCircle,
  Hash,
  Repeat,
  Sliders,
  Settings2,
} from 'lucide-react';
import type { StudyMode } from '@/types';
import type { PassageItem } from '@/features/vocabulary/types/passageTypes';
import type { VocabularyWithItem } from '@/features/vocabulary/types';
import { useBackHandler } from '@/lib/navigation';

export interface StudyStartConfig {
  mode: StudyMode | 'speed_shadowing' | 'passage_cloze';
  count: number; // 문항 수 또는 반복 횟수
  selectedPassage?: PassageItem;
  repeatRounds?: number;
  questionType?: 'choice' | 'chips' | 'typing';
  blankDensity?: 'keywords' | 'one_per_sentence' | 'two_per_sentence';
  customVocabs?: VocabularyWithItem[];
}

interface StudyStartConfigDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedMode: StudyMode | 'speed_shadowing' | 'passage_cloze';
  totalVocabCount: number;
  selectedCustomVocabs: VocabularyWithItem[];
  passages: PassageItem[];
  onConfirmStart: (config: StudyStartConfig) => void;
}

const MODE_META: Record<
  StudyMode | 'speed_shadowing' | 'passage_cloze',
  { title: string; desc: string; icon: React.ReactNode; badge: string; color: string }
> = {
  speed_shadowing: {
    title: '스피드 섀도잉 (Speed Shadowing)',
    desc: '원어민 발음으로 단어를 빠르게 따라 읽으며 뇌에 즉시 각인하는 모드',
    icon: <Sparkles className="h-5 w-5 text-pink-500" />,
    badge: '인기 🔥',
    color: 'border-pink-500/30 bg-pink-500/10 text-pink-700 dark:text-pink-300',
  },
  learning: {
    title: '기본 학습 모드',
    desc: '객관식, 빈칸 채우기, 스펠링 등 다양한 유형의 퀴즈를 골고루 학습',
    icon: <GraduationCap className="h-5 w-5 text-blue-500" />,
    badge: '기본 추천',
    color: 'border-blue-500/30 bg-blue-500/10 text-blue-700 dark:text-blue-300',
  },
  speed: {
    title: '스피드 퀴즈 (SPEED QUIZ)',
    desc: '문제당 7~10초 제한! 순발력 테스트와 보너스 XP 획득',
    icon: <Zap className="h-5 w-5 text-amber-500" />,
    badge: '도전',
    color: 'border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-300',
  },
  review: {
    title: '복습 집중 모드',
    desc: '이전에 틀렸거나 복습 시기가 도래한 단어를 집중 복습',
    icon: <RotateCcw className="h-5 w-5 text-emerald-500" />,
    badge: '기억 강화',
    color: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300',
  },
  passage_cloze: {
    title: '지문 빈칸 채우기 (Passage Cloze)',
    desc: '영어 지문 문맥 속에서 핵심 어휘의 빈칸을 채워 완성하는 몰입형 독해 학습',
    icon: <FileText className="h-5 w-5 text-indigo-500" />,
    badge: '신규 ✨',
    color: 'border-indigo-500/30 bg-indigo-500/10 text-indigo-700 dark:text-indigo-300',
  },
  test: {
    title: '실전 테스트 모드',
    desc: '실전 모의고사 형식의 종합 단어 테스트',
    icon: <GraduationCap className="h-5 w-5 text-purple-500" />,
    badge: '테스트',
    color: 'border-purple-500/30 bg-purple-500/10 text-purple-700 dark:text-purple-300',
  },
};

const COUNT_PRESETS = [5, 10, 15, 20, 30];
const REPEAT_ROUND_PRESETS = [1, 2, 3, 5];

export function StudyStartConfigDialog({
  open,
  onOpenChange,
  selectedMode,
  totalVocabCount,
  selectedCustomVocabs,
  passages,
  onConfirmStart,
}: StudyStartConfigDialogProps) {
  // 모바일 뒤로가기 제어
  useBackHandler(open, () => onOpenChange(false), 'study_start_dialog');

  // 단어 퀴즈 횟수/문항 수
  const [questionCount, setQuestionCount] = useState<number>(10);

  // 지문 빈칸 모드 설정
  const [selectedPassageId, setSelectedPassageId] = useState<string>('');
  const [repeatRounds, setRepeatRounds] = useState<number>(1);
  const [questionType, setQuestionType] = useState<'choice' | 'chips' | 'typing'>('choice');
  const [blankDensity, setBlankDensity] = useState<'keywords' | 'one_per_sentence' | 'two_per_sentence'>('keywords');

  // 다이얼로그 열릴 때 초기화
  useEffect(() => {
    if (open) {
      if (selectedCustomVocabs.length > 0) {
        setQuestionCount(selectedCustomVocabs.length);
      } else {
        setQuestionCount(10);
      }

      if (passages.length > 0 && !selectedPassageId) {
        setSelectedPassageId(passages[0].id);
      }
    }
  }, [open, selectedCustomVocabs, passages, selectedPassageId]);

  const meta = MODE_META[selectedMode] || MODE_META.learning;
  const isPassageMode = selectedMode === 'passage_cloze';
  const hasCustomVocabs = selectedCustomVocabs.length > 0;

  const currentPassage = passages.find((p) => p.id === selectedPassageId) || passages[0];

  const handleStart = () => {
    onOpenChange(false);

    if (isPassageMode) {
      if (!currentPassage) {
        alert('학습할 지문을 선택해주세요.');
        return;
      }

      onConfirmStart({
        mode: 'passage_cloze',
        count: currentPassage.sentences?.length || 10,
        selectedPassage: currentPassage,
        repeatRounds,
        questionType,
        blankDensity,
      });
    } else {
      onConfirmStart({
        mode: selectedMode,
        count: hasCustomVocabs ? selectedCustomVocabs.length : questionCount,
        customVocabs: hasCustomVocabs ? selectedCustomVocabs : undefined,
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg p-0 gap-0 overflow-hidden bg-card border-border shadow-2xl">
        {/* 상단 헤더 */}
        <DialogHeader className="p-4 sm:p-5 pb-3 border-b border-border bg-muted/30">
          <div className="flex items-center gap-3">
            <div className={`p-2.5 rounded-xl border ${meta.color} shrink-0`}>
              {meta.icon}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <DialogTitle className="text-base sm:text-lg font-extrabold">
                  {meta.title}
                </DialogTitle>
                <Badge variant="secondary" className="text-[10px] font-bold">
                  {meta.badge}
                </Badge>
              </div>
              <DialogDescription className="text-xs text-muted-foreground mt-0.5">
                {meta.desc}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {/* 본문 설정 영역 */}
        <div className="p-4 sm:p-5 space-y-4 text-xs sm:text-sm">
          {/* ────────────────────────────────────
              A. 지문 빈칸 채우기 전용 설정
             ──────────────────────────────────── */}
          {isPassageMode ? (
            <div className="space-y-4">
              {/* 1. 지문 선택 */}
              <div className="space-y-1.5">
                <Label className="font-bold flex items-center gap-1.5 text-xs sm:text-sm text-foreground">
                  <BookOpen className="h-4 w-4 text-indigo-500" />
                  <span>학습할 영어 지문 선택</span>
                </Label>

                {passages.length === 0 ? (
                  <div className="p-4 text-center rounded-xl bg-muted/40 border border-dashed border-border text-muted-foreground text-xs">
                    등록된 지문이 없습니다. 단어장 지문 탭에서 먼저 지문을 등록해주세요.
                  </div>
                ) : (
                  <Select
                    value={selectedPassageId}
                    onValueChange={(val) => setSelectedPassageId(val || '')}
                  >
                    <SelectTrigger className="h-11 font-semibold text-xs sm:text-sm">
                      <SelectValue placeholder="지문을 선택하세요" />
                    </SelectTrigger>
                    <SelectContent>
                      {passages.map((p) => (
                        <SelectItem key={p.id} value={p.id} className="text-xs sm:text-sm py-2">
                          <div className="flex items-center gap-2">
                            <span className="font-bold truncate">{p.title}</span>
                            <span className="text-[11px] text-muted-foreground">
                              ({p.sentences?.length || 0}문장 • 어휘 {p.vocabularyList?.length || 0}개)
                            </span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}

                {currentPassage && (
                  <div className="p-3 rounded-xl bg-indigo-500/5 border border-indigo-500/15 space-y-1">
                    <p className="text-[11px] font-semibold text-indigo-700 dark:text-indigo-300">
                      선택된 지문 정보:
                    </p>
                    <p className="text-xs text-muted-foreground line-clamp-2">
                      {currentPassage.content}
                    </p>
                  </div>
                )}
              </div>

              {/* 2. 학습 반복 횟수 선택 */}
              <div className="space-y-1.5">
                <Label className="font-bold flex items-center gap-1.5 text-xs sm:text-sm text-foreground">
                  <Repeat className="h-4 w-4 text-indigo-500" />
                  <span>반복 완독 횟수 선택</span>
                </Label>
                <div className="grid grid-cols-4 gap-2">
                  {REPEAT_ROUND_PRESETS.map((rounds) => (
                    <Button
                      key={rounds}
                      type="button"
                      variant={repeatRounds === rounds ? 'default' : 'outline'}
                      className={`h-10 font-bold text-xs sm:text-sm rounded-xl transition-all ${
                        repeatRounds === rounds
                          ? 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs'
                          : 'hover:bg-indigo-500/10'
                      }`}
                      onClick={() => setRepeatRounds(rounds)}
                    >
                      {rounds}회 {rounds === 1 ? '완독' : rounds === 3 ? '마스터' : '반복'}
                    </Button>
                  ))}
                </div>
              </div>

              {/* 3. 문제 풀이 방식 */}
              <div className="space-y-1.5">
                <Label className="font-bold flex items-center gap-1.5 text-xs sm:text-sm text-foreground">
                  <Settings2 className="h-4 w-4 text-indigo-500" />
                  <span>빈칸 문제 풀이 방식</span>
                </Label>
                <div className="grid grid-cols-3 gap-2">
                  <Button
                    type="button"
                    variant={questionType === 'choice' ? 'default' : 'outline'}
                    className={`h-9 text-xs font-bold rounded-xl ${
                      questionType === 'choice'
                        ? 'bg-indigo-600 hover:bg-indigo-700 text-white'
                        : ''
                    }`}
                    onClick={() => setQuestionType('choice')}
                  >
                    4지선다 객관식
                  </Button>
                  <Button
                    type="button"
                    variant={questionType === 'chips' ? 'default' : 'outline'}
                    className={`h-9 text-xs font-bold rounded-xl ${
                      questionType === 'chips'
                        ? 'bg-indigo-600 hover:bg-indigo-700 text-white'
                        : ''
                    }`}
                    onClick={() => setQuestionType('chips')}
                  >
                    단어 보기형
                  </Button>
                  <Button
                    type="button"
                    variant={questionType === 'typing' ? 'default' : 'outline'}
                    className={`h-9 text-xs font-bold rounded-xl ${
                      questionType === 'typing'
                        ? 'bg-indigo-600 hover:bg-indigo-700 text-white'
                        : ''
                    }`}
                    onClick={() => setQuestionType('typing')}
                  >
                    직접 타이핑
                  </Button>
                </div>
              </div>
            </div>
          ) : (
            /* ────────────────────────────────────
                B. 일반 단어 퀴즈 / 섀도잉 횟수 설정
               ──────────────────────────────────── */
            <div className="space-y-4">
              {/* 직접 선택 단어 여부 표시 */}
              {hasCustomVocabs ? (
                <div className="p-3.5 rounded-xl bg-primary/10 border border-primary/30 flex items-center justify-between gap-2">
                  <div>
                    <p className="font-bold text-xs sm:text-sm text-primary">
                      직접 선택한 단어로 학습
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      선택하신 <strong className="text-foreground">{selectedCustomVocabs.length}개</strong> 단어 전체가 출제됩니다.
                    </p>
                  </div>
                  <Badge className="bg-primary text-white font-extrabold px-2.5 py-1 shrink-0">
                    {selectedCustomVocabs.length}단어
                  </Badge>
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label className="font-bold flex items-center gap-1.5 text-xs sm:text-sm text-foreground">
                      <Hash className="h-4 w-4 text-primary" />
                      <span>학습할 문제 수 / 횟수 선택</span>
                    </Label>
                    <span className="text-xs text-muted-foreground">
                      전체 등록 단어: {totalVocabCount}개
                    </span>
                  </div>

                  <div className="grid grid-cols-5 gap-2">
                    {COUNT_PRESETS.map((num) => (
                      <Button
                        key={num}
                        type="button"
                        variant={questionCount === num ? 'default' : 'outline'}
                        className={`h-11 font-bold text-xs sm:text-sm rounded-xl transition-all ${
                          questionCount === num
                            ? 'bg-primary text-white shadow-xs scale-[1.02]'
                            : 'hover:bg-primary/10'
                        }`}
                        onClick={() => setQuestionCount(num)}
                      >
                        {num}문제
                      </Button>
                    ))}
                  </div>

                  {totalVocabCount > 30 && (
                    <Button
                      type="button"
                      variant={questionCount === totalVocabCount ? 'default' : 'ghost'}
                      className="w-full text-xs font-semibold h-8 mt-1 text-muted-foreground hover:text-foreground"
                      onClick={() => setQuestionCount(totalVocabCount)}
                    >
                      전체 단어 모두 풀기 ({totalVocabCount}문제)
                    </Button>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* 하단 확인 및 시작 버튼 */}
        <div className="p-4 sm:p-5 pt-3 border-t border-border bg-muted/20 flex items-center justify-between gap-3">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => onOpenChange(false)}
            className="text-xs font-semibold text-muted-foreground hover:text-foreground h-9 px-4"
          >
            취소
          </Button>

          <Button
            type="button"
            size="lg"
            className="h-11 px-6 font-extrabold text-sm gap-2 shadow-lg hover:shadow-xl transition-all bg-gradient-to-r from-primary via-indigo-600 to-purple-600 text-white"
            onClick={handleStart}
            disabled={!isPassageMode && totalVocabCount === 0}
          >
            <Play className="h-4 w-4 fill-current" />
            <span>
              {isPassageMode
                ? `${repeatRounds}회차 지문 빈칸 학습 시작하기`
                : hasCustomVocabs
                ? `선택한 ${selectedCustomVocabs.length}개 단어로 시작`
                : `${questionCount}문제 학습 시작하기`}
            </span>
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
