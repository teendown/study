'use client';

import React, { useState, useMemo, useEffect, useRef } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Layers,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  X,
  Trash2,
  Loader2,
  HelpCircle,
  FileText,
  Wand2,
  ListPlus,
  Plus,
  RefreshCw,
  Info,
  Check,
} from 'lucide-react';
import {
  batchAddVocabulariesAction,
  searchWordOnlineAction,
  getStoredVocabs,
} from '../services';
import type { VocabularyWithItem } from '../types';
import { useBackHandler } from '@/lib/navigation';

export interface ParsedBatchWordItem {
  id: string;
  word: string;
  meaning: string;
  partOfSpeech?: string;
  pronunciation?: string;
  exampleSentence?: string;
  exampleTranslation?: string;
  isExistingDuplicate: boolean;
  isListDuplicate: boolean;
}

interface BatchVocabularyDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
  onSwitchToSingle?: () => void;
}

const SAMPLE_TEXT_1 = `apple : 사과
banana - 바나나
ubiquitous = 어디에나 존재하는
meticulous : 꼼꼼하고 세심한
resilient : 회복력 있는, 탄력 있는`;

const SAMPLE_TEXT_2 = `persuade, accommodate, significant, deteriorate, distinguish, comprehensive, vulnerable, preliminary`;

export function BatchVocabularyDialog({
  open,
  onOpenChange,
  onSuccess,
  onSwitchToSingle,
}: BatchVocabularyDialogProps) {
  // 모바일 뒤로가기 제어
  useBackHandler(open, () => onOpenChange(false), 'batch_vocab_form');

  const [rawText, setRawText] = useState('');
  const [defaultDifficulty, setDefaultDifficulty] = useState<number>(2);
  const [defaultSource, setDefaultSource] = useState<string>('다중 단어 등록');
  const [autoSearchOnline, setAutoSearchOnline] = useState<boolean>(true);
  const [duplicatePolicy, setDuplicatePolicy] = useState<'skip' | 'overwrite' | 'allow'>('skip');

  // 진행 상태 관리
  const [isProcessing, setIsProcessing] = useState(false);
  const [progressPercent, setProgressPercent] = useState(0);
  const [progressMessage, setProgressMessage] = useState('');
  const [processedCount, setProcessedCount] = useState(0);
  const [totalToProcess, setTotalToProcess] = useState(0);

  // 결과 요약
  const [resultSummary, setResultSummary] = useState<{
    added: number;
    updated: number;
    skipped: number;
    failed: number;
  } | null>(null);

  // 제외할 단어 ID 목록
  const [excludedIds, setExcludedIds] = useState<Set<string>>(new Set());

  // 기존 저장된 단어 목록 캐시
  const [existingWordsMap, setExistingWordsMap] = useState<Map<string, VocabularyWithItem>>(new Map());

  // Dialog 오픈 시 초기화
  useEffect(() => {
    if (open) {
      setRawText('');
      setResultSummary(null);
      setIsProcessing(false);
      setProgressPercent(0);
      setProgressMessage('');
      setExcludedIds(new Set());

      // 기존 단어 맵 로드
      try {
        const vocabs = getStoredVocabs();
        const map = new Map<string, VocabularyWithItem>();
        vocabs.forEach((v) => {
          map.set(v.word.toLowerCase().trim(), v);
        });
        setExistingWordsMap(map);
      } catch {
        setExistingWordsMap(new Map());
      }
    }
  }, [open]);

  // 스마트 텍스트 파싱 로직
  const parsedItems: ParsedBatchWordItem[] = useMemo(() => {
    if (!rawText.trim()) return [];

    const lines = rawText.split('\n');
    const items: ParsedBatchWordItem[] = [];
    const seenInInput = new Set<string>();

    for (let i = 0; i < lines.length; i++) {
      let line = lines[i].trim();
      if (!line) continue;

      // 만약 한 줄에 콤마로 여러 단어가 나열되어 있는 경우 (예: apple, banana, car)
      // 단, 'apple : 사과, 맛있는 과일' 같은 경우 구분자가 있으면 줄 단위로 처리
      const hasKeyValueSeparator = /[:=|\-\t–—]/.test(line);
      if (!hasKeyValueSeparator && line.includes(',')) {
        const parts = line.split(',');
        for (const p of parts) {
          const w = p.replace(/^[\d+.)\-•\s]+/, '').trim();
          if (!w) continue;
          const lower = w.toLowerCase();
          const isListDup = seenInInput.has(lower);
          seenInInput.add(lower);
          const isExistDup = existingWordsMap.has(lower);

          items.push({
            id: `item-${items.length}-${lower}`,
            word: w,
            meaning: '',
            isExistingDuplicate: isExistDup,
            isListDuplicate: isListDup,
          });
        }
        continue;
      }

      // 번호나 불릿 기호 제거 (예: "1. apple", "1) banana", "- cat", "• dog")
      line = line.replace(/^[\d+.)\-•\s]+/, '').trim();
      if (!line) continue;

      let word = '';
      let meaning = '';

      // 구분자 감지 (Tab, :, =, -, –, —, |)
      const delimiterMatch = line.match(/(\t|:|=|–|—|\||-)/);
      if (delimiterMatch && delimiterMatch.index !== undefined) {
        const idx = delimiterMatch.index;
        word = line.substring(0, idx).trim();
        meaning = line.substring(idx + delimiterMatch[0].length).trim();
      } else {
        // 구분자가 없으면 첫 공백 기준으로 영단어와 한글뜻 분리 시도
        // 예: "apple 사과", "persuade 설득하다"
        const spaceIdx = line.indexOf(' ');
        if (spaceIdx > 0) {
          const firstToken = line.substring(0, spaceIdx).trim();
          const rest = line.substring(spaceIdx + 1).trim();
          // firstToken이 영문/특수기호 위주일 때
          if (/^[a-zA-Z\s\-'.]+$/.test(firstToken) && /[가-힣]/.test(rest)) {
            word = firstToken;
            meaning = rest;
          } else {
            word = line;
            meaning = '';
          }
        } else {
          word = line;
          meaning = '';
        }
      }

      if (!word) continue;

      const lower = word.toLowerCase();
      const isListDup = seenInInput.has(lower);
      seenInInput.add(lower);
      const isExistDup = existingWordsMap.has(lower);

      items.push({
        id: `item-${items.length}-${lower}`,
        word,
        meaning,
        isExistingDuplicate: isExistDup,
        isListDuplicate: isListDup,
      });
    }

    return items;
  }, [rawText, existingWordsMap]);

  // 제외되지 않은 유효 항목들
  const activeItems = useMemo(() => {
    return parsedItems.filter((it) => !excludedIds.has(it.id));
  }, [parsedItems, excludedIds]);

  // 중복 카운트 통계
  const stats = useMemo(() => {
    let existingDupCount = 0;
    let listDupCount = 0;
    let missingMeaningCount = 0;

    activeItems.forEach((it) => {
      if (it.isExistingDuplicate) existingDupCount++;
      if (it.isListDuplicate) listDupCount++;
      if (!it.meaning.trim()) missingMeaningCount++;
    });

    return {
      total: activeItems.length,
      existingDupCount,
      listDupCount,
      missingMeaningCount,
    };
  }, [activeItems]);

  const handleToggleExclude = (id: string) => {
    const next = new Set(excludedIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setExcludedIds(next);
  };

  const handleClearAll = () => {
    setRawText('');
    setExcludedIds(new Set());
    setResultSummary(null);
  };

  const handleLoadSample = (sampleNum: 1 | 2) => {
    setRawText(sampleNum === 1 ? SAMPLE_TEXT_1 : SAMPLE_TEXT_2);
    setExcludedIds(new Set());
    setResultSummary(null);
  };

  // 일괄 단어 등록 실행
  const handleExecuteBatchRegister = async () => {
    if (activeItems.length === 0) {
      alert('등록할 단어가 없습니다. 단어를 입력해주세요.');
      return;
    }

    setIsProcessing(true);
    setProgressPercent(0);
    setProcessedCount(0);
    setTotalToProcess(activeItems.length);
    setProgressMessage('단어 목록 분석 및 준비 중...');
    setResultSummary(null);

    try {
      let added = 0;
      let updated = 0;
      let skipped = 0;
      let failed = 0;

      const total = activeItems.length;

      // 항목별 순차 처리 (사전 검색 및 저장 진행률 가시화)
      for (let i = 0; i < total; i++) {
        const item = activeItems[i];
        const currentNum = i + 1;
        setProcessedCount(currentNum);
        setProgressPercent(Math.round((currentNum / total) * 100));

        setProgressMessage(`[${currentNum}/${total}] "${item.word}" 단어 정보 처리 중...`);

        // 중복 정책 확인
        if (item.isExistingDuplicate) {
          if (duplicatePolicy === 'skip') {
            skipped++;
            continue;
          }
        }

        try {
          let finalMeaning = item.meaning;
          let finalPos = item.partOfSpeech || '';
          let finalPron = item.pronunciation || '';
          let finalEx = item.exampleSentence || '';
          let finalExTrans = item.exampleTranslation || '';
          let finalSource = defaultSource;

          // 뜻이 없거나 자동 검색 옵션이 켜져 있고 뜻이 빈 경우 온라인 사전 검색
          if (autoSearchOnline && (!finalMeaning || finalMeaning.trim() === '')) {
            setProgressMessage(`[${currentNum}/${total}] "${item.word}" 사전/AI 뜻 검색 중...`);
            try {
              const res = await searchWordOnlineAction(item.word);
              if (res.success && res.data) {
                if (res.data.meaning && res.data.meaning !== '의미 검색 필요') {
                  finalMeaning = res.data.meaning;
                }
                if (res.data.partOfSpeech) finalPos = res.data.partOfSpeech;
                if (res.data.pronunciation) finalPron = res.data.pronunciation;
                if (res.data.exampleSentence) finalEx = res.data.exampleSentence;
                if (res.data.exampleTranslation) finalExTrans = res.data.exampleTranslation;
                if (res.data.source) finalSource = res.data.source;
              }
            } catch {
              // search failed, proceed with empty meaning
            }
          }

          // 단일 등록 수행
          const res = await batchAddVocabulariesAction(
            [
              {
                word: item.word,
                meaning: finalMeaning || '의미 검색 필요',
                partOfSpeech: finalPos || undefined,
                pronunciation: finalPron || undefined,
                exampleSentence: finalEx || undefined,
                exampleTranslation: finalExTrans || undefined,
                difficulty: defaultDifficulty,
                source: finalSource,
              },
            ],
            {
              duplicatePolicy,
              defaultDifficulty,
              defaultSource,
            }
          );

          if (res.success && res.data) {
            added += res.data.addedCount;
            updated += res.data.updatedCount;
            skipped += res.data.skippedCount;
          } else {
            failed++;
          }
        } catch {
          failed++;
        }
      }

      setResultSummary({
        added,
        updated,
        skipped,
        failed,
      });
      setProgressPercent(100);
      setProgressMessage('다중 단어 등록이 완료되었습니다! 🎉');

      if (onSuccess) {
        onSuccess();
      }
    } catch (e: any) {
      alert(e?.message || '다중 단어 등록 중 오류가 발생했습니다.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] flex flex-col p-0 gap-0 overflow-hidden bg-card border-border shadow-2xl">
        {/* 상단 헤더 & 탭 전환 */}
        <DialogHeader className="p-4 sm:p-5 pb-3 border-b border-border/80 bg-muted/30">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-primary/10 text-primary border border-primary/20">
                <ListPlus className="h-5 w-5" />
              </div>
              <div>
                <DialogTitle className="text-base sm:text-lg font-extrabold flex items-center gap-2">
                  <span>다중 단어 일괄 입력</span>
                  <Badge variant="secondary" className="text-[11px] font-bold px-2 py-0.5 bg-primary/10 text-primary border-primary/20">
                    Bulk Import
                  </Badge>
                </DialogTitle>
                <DialogDescription className="text-xs text-muted-foreground mt-0.5">
                  여러 단어를 한 번에 붙여넣어 사전을 검색하고 빠르게 단어장에 등록하세요.
                </DialogDescription>
              </div>
            </div>

            {onSwitchToSingle && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="text-xs text-muted-foreground hover:text-foreground shrink-0 gap-1 h-8"
                onClick={() => {
                  onOpenChange(false);
                  onSwitchToSingle();
                }}
              >
                <Plus className="h-3.5 w-3.5" />
                <span>단일 입력 모드</span>
              </Button>
            )}
          </div>
        </DialogHeader>

        {/* 본문 스크롤 영역 */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4 text-xs sm:text-sm">
          {/* 등록 완료 요약 알림 배너 */}
          {resultSummary && (
            <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-950 dark:text-emerald-200 space-y-2 animate-in fade-in zoom-in-95 duration-200">
              <div className="flex items-center gap-2 font-bold text-sm text-emerald-700 dark:text-emerald-400">
                <CheckCircle2 className="h-5 w-5" />
                <span>일괄 등록 완료!</span>
              </div>
              <div className="flex flex-wrap gap-2 text-xs">
                <span className="px-2.5 py-1 rounded-md bg-emerald-500/20 font-semibold">
                  ✨ 신규 등록: <strong>{resultSummary.added}개</strong>
                </span>
                {resultSummary.updated > 0 && (
                  <span className="px-2.5 py-1 rounded-md bg-blue-500/20 text-blue-800 dark:text-blue-200 font-semibold">
                    🔄 수정/덮어쓰기: <strong>{resultSummary.updated}개</strong>
                  </span>
                )}
                {resultSummary.skipped > 0 && (
                  <span className="px-2.5 py-1 rounded-md bg-amber-500/20 text-amber-800 dark:text-amber-200 font-semibold">
                    ⚠️ 중복 건너뜀: <strong>{resultSummary.skipped}개</strong>
                  </span>
                )}
                {resultSummary.failed > 0 && (
                  <span className="px-2.5 py-1 rounded-md bg-red-500/20 text-red-800 dark:text-red-200 font-semibold">
                    ❌ 실패: <strong>{resultSummary.failed}개</strong>
                  </span>
                )}
              </div>
              <p className="text-[11px] text-muted-foreground mt-1">
                등록된 단어는 홈 및 단어장 목록에서 즉시 학습하실 수 있습니다.
              </p>
            </div>
          )}

          {/* 진행 상황 프로그레스 바 */}
          {isProcessing && (
            <div className="p-4 rounded-xl bg-primary/5 border border-primary/20 space-y-2.5">
              <div className="flex items-center justify-between text-xs font-bold text-foreground">
                <span className="flex items-center gap-2 text-primary">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  {progressMessage}
                </span>
                <span className="text-primary font-mono">{progressPercent}%</span>
              </div>
              <Progress value={progressPercent} className="h-2" />
            </div>
          )}

          {/* 1. 텍스트 입력창 영역 */}
          <div className="space-y-2">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <Label htmlFor="bulk-words-input" className="font-bold flex items-center gap-1.5 text-xs sm:text-sm">
                <FileText className="h-4 w-4 text-primary" />
                <span>단어 텍스트 붙여넣기 또는 입력</span>
              </Label>

              <div className="flex items-center gap-1.5">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="h-7 text-[11px] px-2 font-medium"
                  onClick={() => handleLoadSample(1)}
                  disabled={isProcessing}
                >
                  예시 (뜻 포함)
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="h-7 text-[11px] px-2 font-medium"
                  onClick={() => handleLoadSample(2)}
                  disabled={isProcessing}
                >
                  예시 (콤마 구분)
                </Button>
                {rawText && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-7 text-[11px] px-2 text-muted-foreground hover:text-destructive"
                    onClick={handleClearAll}
                    disabled={isProcessing}
                  >
                    지우기
                  </Button>
                )}
              </div>
            </div>

            <Textarea
              id="bulk-words-input"
              value={rawText}
              onChange={(e) => setRawText(e.target.value)}
              placeholder={`여기에 여러 단어를 입력하거나 복사한 텍스트를 붙여넣으세요.
지원 형식:
- 줄단위 단어: apple \n banana \n diligent
- 뜻과 함께: apple : 사과 \n banana - 바나나 \n resilient = 탄력 있는
- 콤마 나열: apple, banana, persimmon, avocado`}
              rows={6}
              disabled={isProcessing}
              className="font-mono text-xs sm:text-sm resize-y leading-relaxed bg-background/80"
            />

            <p className="text-[11px] text-muted-foreground flex items-center gap-1">
              <Info className="h-3.5 w-3.5 text-primary shrink-0" />
              <span>
                콜론(<strong>:</strong>), 하이픈(<strong>-</strong>), 등호(<strong>=</strong>), 탭, 쉼표(<strong>,</strong>)로 단어와 뜻을 자유롭게 구분할 수 있습니다.
              </span>
            </p>
          </div>

          {/* 2. 등록 옵션 설정 바 (사전 자동완성, 중복정책, 난이도, 출처) */}
          <div className="p-3 sm:p-4 rounded-xl bg-muted/40 border border-border/70 grid grid-cols-1 sm:grid-cols-3 gap-3">
            {/* 사전 자동검색 */}
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-foreground">사전 / AI 자동완성</Label>
              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="autoSearchOnline"
                  checked={autoSearchOnline}
                  onChange={(e) => setAutoSearchOnline(e.target.checked)}
                  disabled={isProcessing}
                  className="h-4 w-4 rounded border-border text-primary focus:ring-primary accent-primary cursor-pointer"
                />
                <label htmlFor="autoSearchOnline" className="text-xs text-foreground cursor-pointer select-none">
                  뜻 자동 채우기 (AI/사전)
                </label>
              </div>
            </div>

            {/* 중복 처리 정책 */}
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-foreground">기존 중복 단어 처리</Label>
              <Select
                value={duplicatePolicy}
                onValueChange={(val: any) => setDuplicatePolicy(val)}
                disabled={isProcessing}
              >
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="skip">중복 단어 건너뛰기</SelectItem>
                  <SelectItem value="overwrite">기존 단어 정보 덮어쓰기</SelectItem>
                  <SelectItem value="allow">중복 허용하여 추가</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* 기본 난이도 */}
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-foreground">기본 난이도</Label>
              <Select
                value={String(defaultDifficulty)}
                onValueChange={(val) => setDefaultDifficulty(Number(val))}
                disabled={isProcessing}
              >
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">1단계 (매우 쉬움)</SelectItem>
                  <SelectItem value="2">2단계 (쉬움)</SelectItem>
                  <SelectItem value="3">3단계 (보통)</SelectItem>
                  <SelectItem value="4">4단계 (어려움)</SelectItem>
                  <SelectItem value="5">5단계 (매우 어려움)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* 3. 실시간 인식 결과 미리보기 (Live Preview Grid) */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-2">
                <span className="font-bold text-xs sm:text-sm text-foreground">
                  인식된 단어 목록 ({activeItems.length}개)
                </span>
                {stats.existingDupCount > 0 && (
                  <Badge variant="outline" className="text-[10px] bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30 font-bold">
                    기존 중복 {stats.existingDupCount}개
                  </Badge>
                )}
                {stats.missingMeaningCount > 0 && autoSearchOnline && (
                  <Badge variant="outline" className="text-[10px] bg-primary/10 text-primary border-primary/30 font-bold">
                    사전 자동검색 예정 {stats.missingMeaningCount}개
                  </Badge>
                )}
              </div>

              {parsedItems.length > 0 && excludedIds.size > 0 && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-6 text-[11px] text-muted-foreground"
                  onClick={() => setExcludedIds(new Set())}
                >
                  제외 항목 모두 복원
                </Button>
              )}
            </div>

            {parsedItems.length === 0 ? (
              <div className="p-8 text-center border border-dashed border-border rounded-xl text-muted-foreground space-y-1">
                <p className="text-xs font-semibold">인식된 단어가 없습니다.</p>
                <p className="text-[11px]">위 입력창에 단어를 입력하거나 상단 예시 버튼을 눌러보세요.</p>
              </div>
            ) : (
              <div className="border border-border rounded-xl overflow-hidden divide-y divide-border/60 max-h-[260px] overflow-y-auto bg-background/50">
                {parsedItems.map((item, idx) => {
                  const isExcluded = excludedIds.has(item.id);
                  return (
                    <div
                      key={item.id}
                      className={`flex items-center justify-between p-2.5 px-3 transition-colors ${
                        isExcluded
                          ? 'opacity-40 bg-muted/40 line-through'
                          : 'hover:bg-muted/30'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0 flex-1">
                        <span className="text-[11px] font-mono text-muted-foreground w-6 text-right shrink-0">
                          {idx + 1}.
                        </span>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-xs sm:text-sm text-foreground font-mono">
                              {item.word}
                            </span>

                            {item.isExistingDuplicate && (
                              <Badge className="text-[9px] h-4 px-1 bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/30">
                                {duplicatePolicy === 'skip' ? '건너뜀' : duplicatePolicy === 'overwrite' ? '덮어쓰기' : '중복 추가'}
                              </Badge>
                            )}

                            {item.isListDuplicate && (
                              <Badge className="text-[9px] h-4 px-1 bg-orange-500/15 text-orange-700 dark:text-orange-300 border-orange-500/30">
                                입력목록 중복
                              </Badge>
                            )}
                          </div>

                          <p className="text-[11px] text-muted-foreground truncate">
                            {item.meaning ? (
                              item.meaning
                            ) : autoSearchOnline ? (
                              <span className="text-primary/80 italic flex items-center gap-1">
                                <Sparkles className="h-3 w-3 inline" />
                                등록 시 자동 사전 검색
                              </span>
                            ) : (
                              <span className="text-muted-foreground italic">의미 미지정</span>
                            )}
                          </p>
                        </div>
                      </div>

                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-muted-foreground hover:text-destructive shrink-0 ml-2"
                        onClick={() => handleToggleExclude(item.id)}
                        title={isExcluded ? '다시 포함' : '목록에서 제외'}
                        disabled={isProcessing}
                      >
                        {isExcluded ? <RefreshCw className="h-3.5 w-3.5" /> : <X className="h-3.5 w-3.5" />}
                      </Button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* 하단 액션 버튼 바 */}
        <div className="p-4 sm:p-5 pt-3 border-t border-border/80 bg-muted/20 flex items-center justify-between gap-3">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => onOpenChange(false)}
            disabled={isProcessing}
            className="h-9 px-4 text-xs font-semibold"
          >
            닫기
          </Button>

          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="default"
              size="sm"
              onClick={handleExecuteBatchRegister}
              disabled={isProcessing || activeItems.length === 0}
              className="h-9 px-5 text-xs font-bold gap-1.5 shadow-md"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>등록 진행 중 ({processedCount}/{totalToProcess})</span>
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4" />
                  <span>
                    총 {activeItems.length}개 단어 일괄 등록
                  </span>
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
