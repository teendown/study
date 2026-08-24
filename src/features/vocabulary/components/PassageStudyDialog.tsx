'use client';

import { useState, useEffect, useMemo } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  Volume2,
  CheckCircle2,
  XCircle,
  Sparkles,
  ArrowRight,
  RotateCcw,
  Trophy,
  PenTool,
  Layers,
  HelpCircle,
  Eye,
  Check,
} from 'lucide-react';
import type { PassageItem } from '../types/passageTypes';
import { TabletPenCanvas } from './TabletPenCanvas';

export interface PassageStudyDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  passage: PassageItem;
}

type StudyMode = 'quiz' | 'unscramble' | 'workbook';

interface SentenceItem {
  english: string;
  korean: string;
}

export function PassageStudyDialog({
  open,
  onOpenChange,
  passage,
}: PassageStudyDialogProps) {
  const [studyMode, setStudyMode] = useState<StudyMode>('quiz');
  const [currentIndex, setCurrentIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [isAnswerChecked, setIsAnswerChecked] = useState(false);
  const [isFinished, setIsFinished] = useState(false);

  // Unscramble 모드 상태
  const [scrambledWords, setScrambledWords] = useState<{ id: string; text: string }[]>([]);
  const [assembledWords, setAssembledWords] = useState<{ id: string; text: string }[]>([]);

  // 워크북 모드 상태
  const [isWorkbookAnswerRevealed, setIsWorkbookAnswerRevealed] = useState(false);
  const [workbookAnswers, setWorkbookAnswers] = useState<Record<number, boolean>>({});

  // 문장 목록 및 매핑
  const sentencePairs = useMemo<SentenceItem[]>(() => {
    const rawSentences = passage.sentences || [];
    const rawTrans = passage.sentenceTranslations || [];

    return rawSentences.map((eng, idx) => {
      const kor = rawTrans[idx] || (idx === 0 && passage.translation ? passage.translation : '한국어 번역 준비 중');
      return {
        english: eng.trim(),
        korean: kor.trim(),
      };
    });
  }, [passage]);

  const currentPair = sentencePairs[currentIndex] || { english: '', korean: '' };

  // 4지선다 옵션 생성
  const currentOptions = useMemo<string[]>(() => {
    if (!currentPair.korean) return [];
    const correct = currentPair.korean;

    // 다른 문장의 번역들에서 오답 추출
    const otherTranslations = sentencePairs
      .map((p) => p.korean)
      .filter((k) => k !== correct && k.length > 2);

    const shuffledOthers = [...otherTranslations].sort(() => 0.5 - Math.random());
    const distractors = shuffledOthers.slice(0, 3);

    // 오답이 부족할 경우 더미 오답 보충
    const defaultDistractors = [
      '이 문장은 다른 의미를 나타냅니다.',
      '주어진 조건에 따라 결과가 달라집니다.',
      '시간이 지남에 따라 점차 변화합니다.',
    ];
    while (distractors.length < 3) {
      const dummy = defaultDistractors[distractors.length];
      if (!distractors.includes(dummy)) distractors.push(dummy);
    }

    const all = [correct, ...distractors];
    return all.sort(() => 0.5 - Math.random());
  }, [currentIndex, sentencePairs, currentPair]);

  // 문장 변경 시 상태 초기화
  useEffect(() => {
    if (open) {
      setSelectedOption(null);
      setIsAnswerChecked(false);
      setIsWorkbookAnswerRevealed(false);

      if (studyMode === 'unscramble' && currentPair.english) {
        // 단어 토큰 분리 (마침표 등 제거 후 분리)
        const words = currentPair.english
          .replace(/[.?!,]/g, '')
          .split(/\s+/)
          .filter(Boolean);
        const tokens = words.map((w, i) => ({ id: `${i}-${w}`, text: w }));
        setScrambledWords([...tokens].sort(() => 0.5 - Math.random()));
        setAssembledWords([]);
      }
    }
  }, [currentIndex, studyMode, open, currentPair]);

  const handleSpeak = (text: string) => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const u = new SpeechSynthesisUtterance(text);
      u.lang = 'en-US';
      u.rate = 0.85;
      window.speechSynthesis.speak(u);
    }
  };

  // 퀴즈 옵션 선택
  const handleSelectOption = (idx: number) => {
    if (isAnswerChecked) return;
    setSelectedOption(idx);
    setIsAnswerChecked(true);

    const chosen = currentOptions[idx];
    if (chosen === currentPair.korean) {
      setScore((s) => s + 1);
    }
  };

  // 어순 맞추기 단어 탭
  const handleWordTap = (item: { id: string; text: string }) => {
    if (isAnswerChecked) return;
    setScrambledWords((prev) => prev.filter((w) => w.id !== item.id));
    setAssembledWords((prev) => [...prev, item]);
  };

  const handleRemoveWordTap = (item: { id: string; text: string }) => {
    if (isAnswerChecked) return;
    setAssembledWords((prev) => prev.filter((w) => w.id !== item.id));
    setScrambledWords((prev) => [...prev, item]);
  };

  const handleCheckUnscramble = () => {
    const userSentence = assembledWords.map((w) => w.text).join(' ').toLowerCase();
    const correctClean = currentPair.english.replace(/[.?!,]/g, '').toLowerCase();

    setIsAnswerChecked(true);
    if (userSentence === correctClean) {
      setScore((s) => s + 1);
    }
  };

  // 워크북 모드 채점
  const handleWorkbookMark = (isCorrect: boolean) => {
    setWorkbookAnswers((prev) => ({ ...prev, [currentIndex]: isCorrect }));
    if (isCorrect) setScore((s) => s + 1);
    handleNext();
  };

  const handleNext = () => {
    if (currentIndex < sentencePairs.length - 1) {
      setCurrentIndex((i) => i + 1);
    } else {
      setIsFinished(true);
    }
  };

  const handleRestart = () => {
    setCurrentIndex(0);
    setScore(0);
    setSelectedOption(null);
    setIsAnswerChecked(false);
    setIsFinished(false);
    setIsWorkbookAnswerRevealed(false);
    setWorkbookAnswers({});
  };

  const progressPercent = sentencePairs.length > 0 ? ((currentIndex + 1) / sentencePairs.length) * 100 : 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[92vh] overflow-y-auto p-4 sm:p-6">
        <DialogHeader className="pb-2 border-b border-border">
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <DialogTitle className="text-lg font-bold flex items-center gap-1.5">
              <Sparkles className="h-5 w-5 text-primary" />
              지문 문장 번역 학습 퀘스트
            </DialogTitle>
            <Badge variant="outline" className="text-xs">
              {passage.title}
            </Badge>
          </div>
        </DialogHeader>

        {/* 학습 모드 전환 탭 */}
        {!isFinished && (
          <div className="flex items-center justify-between gap-2 pt-2">
            <div className="flex items-center rounded-lg bg-muted p-1 text-xs font-semibold">
              <button
                type="button"
                onClick={() => {
                  setStudyMode('quiz');
                  handleRestart();
                }}
                className={`flex items-center gap-1 px-2.5 py-1.5 rounded-md transition-all ${
                  studyMode === 'quiz' ? 'bg-background text-primary shadow-xs' : 'text-muted-foreground'
                }`}
              >
                <HelpCircle className="h-3.5 w-3.5" />
                4지선다 퀴즈
              </button>
              <button
                type="button"
                onClick={() => {
                  setStudyMode('unscramble');
                  handleRestart();
                }}
                className={`flex items-center gap-1 px-2.5 py-1.5 rounded-md transition-all ${
                  studyMode === 'unscramble' ? 'bg-background text-primary shadow-xs' : 'text-muted-foreground'
                }`}
              >
                <Layers className="h-3.5 w-3.5" />
                어순 맞추기
              </button>
              <button
                type="button"
                onClick={() => {
                  setStudyMode('workbook');
                  handleRestart();
                }}
                className={`flex items-center gap-1 px-2.5 py-1.5 rounded-md transition-all ${
                  studyMode === 'workbook' ? 'bg-background text-primary shadow-xs' : 'text-muted-foreground'
                }`}
              >
                <PenTool className="h-3.5 w-3.5" />
                펜슬 필기 워크북
              </button>
            </div>

            <div className="text-xs font-bold text-muted-foreground">
              문장 <strong className="text-primary font-mono">{currentIndex + 1}</strong> / {sentencePairs.length}
            </div>
          </div>
        )}

        {/* 진행률 바 */}
        {!isFinished && <Progress value={progressPercent} className="h-1.5 my-2" />}

        {/* 완료 화면 */}
        {isFinished ? (
          <div className="py-8 text-center space-y-4 animate-in zoom-in-95">
            <div className="inline-flex items-center justify-center h-16 w-16 rounded-full bg-amber-500/10 text-amber-500 mx-auto">
              <Trophy className="h-8 w-8" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-foreground">지문 문장 학습 완료! 🎉</h3>
              <p className="text-sm text-muted-foreground mt-1">
                총 {sentencePairs.length}개 문장 중 <strong className="text-primary font-bold">{score}개</strong>를 성공적으로 마스터했습니다!
              </p>
            </div>

            <div className="p-4 rounded-xl bg-muted/40 max-w-sm mx-auto text-sm space-y-1">
              <div className="flex justify-between">
                <span className="text-muted-foreground">정답률</span>
                <span className="font-bold text-primary">
                  {Math.round((score / sentencePairs.length) * 100)}%
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">학습 지문</span>
                <span className="font-semibold text-foreground truncate max-w-[180px]">{passage.title}</span>
              </div>
            </div>

            <div className="flex items-center justify-center gap-2 pt-2">
              <Button type="button" variant="outline" onClick={handleRestart} className="gap-1.5">
                <RotateCcw className="h-4 w-4" /> 다시 풀기
              </Button>
              <Button type="button" onClick={() => onOpenChange(false)} className="gap-1.5 font-bold">
                <Check className="h-4 w-4" /> 학습 완료하기
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-4 py-2">
            {/* 1. 모드: 4지선다 퀴즈 */}
            {studyMode === 'quiz' && (
              <div className="space-y-4">
                {/* 문제 영어 문장 카드 */}
                <div className="p-4 rounded-xl bg-card border border-primary/20 shadow-xs space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-primary">ENGLISH SENTENCE</span>
                    <Button
                      type="button"
                      size="sm"
                      variant="ghost"
                      className="h-7 text-xs gap-1 text-muted-foreground hover:text-primary"
                      onClick={() => handleSpeak(currentPair.english)}
                    >
                      <Volume2 className="h-4 w-4" /> 발음 듣기
                    </Button>
                  </div>
                  <p className="text-base sm:text-lg font-serif text-foreground leading-relaxed">
                    {currentPair.english}
                  </p>
                </div>

                {/* 4지선다 한국어 해석 보기 */}
                <div className="space-y-2">
                  <p className="text-xs font-semibold text-muted-foreground">올바른 한국어 해석을 고르세요:</p>
                  <div className="grid grid-cols-1 gap-2">
                    {currentOptions.map((opt, idx) => {
                      const isSelected = selectedOption === idx;
                      const isCorrect = opt === currentPair.korean;
                      let btnStyle = 'border-border hover:border-primary/40 bg-card';

                      if (isAnswerChecked) {
                        if (isCorrect) {
                          btnStyle = 'border-emerald-500 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 font-semibold';
                        } else if (isSelected) {
                          btnStyle = 'border-destructive bg-destructive/10 text-destructive font-semibold';
                        } else {
                          btnStyle = 'opacity-50 border-border';
                        }
                      }

                      return (
                        <button
                          key={idx}
                          type="button"
                          disabled={isAnswerChecked}
                          onClick={() => handleSelectOption(idx)}
                          className={`w-full text-left p-3.5 rounded-xl border text-sm transition-all flex items-start gap-2.5 ${btnStyle}`}
                        >
                          <span className="h-5 w-5 rounded-full bg-muted text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">
                            {idx + 1}
                          </span>
                          <span className="flex-1 leading-relaxed">{opt}</span>
                          {isAnswerChecked && isCorrect && (
                            <CheckCircle2 className="h-5 w-5 text-emerald-500 shrink-0" />
                          )}
                          {isAnswerChecked && isSelected && !isCorrect && (
                            <XCircle className="h-5 w-5 text-destructive shrink-0" />
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* 다음 버튼 */}
                {isAnswerChecked && (
                  <div className="flex justify-end pt-2 animate-in fade-in">
                    <Button type="button" onClick={handleNext} className="gap-1.5 font-bold">
                      다음 문장 <ArrowRight className="h-4 w-4" />
                    </Button>
                  </div>
                )}
              </div>
            )}

            {/* 2. 모드: 어순 맞추기 (Sentence Unscramble) */}
            {studyMode === 'unscramble' && (
              <div className="space-y-4">
                {/* 한국어 해석 제시 */}
                <div className="p-4 rounded-xl bg-muted/40 border border-border space-y-1">
                  <span className="text-xs font-bold text-muted-foreground">KOREAN TRANSLATION</span>
                  <p className="text-sm sm:text-base font-semibold text-foreground leading-relaxed">
                    {currentPair.korean}
                  </p>
                </div>

                {/* 조립된 단어 영역 */}
                <div className="p-3.5 rounded-xl border-2 border-dashed border-primary/30 min-h-[60px] flex flex-wrap gap-1.5 items-center bg-card">
                  {assembledWords.length === 0 ? (
                    <span className="text-xs text-muted-foreground/60 select-none">
                      아래 단어 조각을 탭하여 올바른 영어 문장 순서로 배열하세요.
                    </span>
                  ) : (
                    assembledWords.map((item) => (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => handleRemoveWordTap(item)}
                        className="px-3 py-1.5 rounded-lg bg-primary text-primary-foreground text-sm font-semibold shadow-xs hover:bg-primary/90 animate-in zoom-in-95"
                      >
                        {item.text}
                      </button>
                    ))
                  )}
                </div>

                {/* 셔플된 선택 단어들 */}
                <div className="flex flex-wrap gap-2 pt-1">
                  {scrambledWords.map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => handleWordTap(item)}
                      className="px-3 py-1.5 rounded-lg bg-secondary text-secondary-foreground text-sm font-medium border border-border hover:border-primary/50 shadow-xs transition-all active:scale-95"
                    >
                      {item.text}
                    </button>
                  ))}
                </div>

                {/* 정답 확인 결과 */}
                {isAnswerChecked && (
                  <div className="p-3 rounded-xl bg-card border border-primary/20 text-xs space-y-1 animate-in fade-in">
                    <span className="font-bold text-primary">정답 원문:</span>
                    <p className="text-sm font-serif text-foreground">{currentPair.english}</p>
                  </div>
                )}

                {/* 컨트롤 버튼 */}
                <div className="flex justify-between items-center pt-2">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="gap-1 text-xs"
                    onClick={() => handleSpeak(currentPair.english)}
                  >
                    <Volume2 className="h-4 w-4" /> 원문 듣기
                  </Button>

                  {!isAnswerChecked ? (
                    <Button
                      type="button"
                      onClick={handleCheckUnscramble}
                      disabled={assembledWords.length === 0}
                      className="font-bold gap-1"
                    >
                      정답 확인
                    </Button>
                  ) : (
                    <Button type="button" onClick={handleNext} className="gap-1.5 font-bold">
                      다음 문장 <ArrowRight className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>
            )}

            {/* 3. 모드: 태블릿 펜슬 손글씨 필기 워크북 */}
            {studyMode === 'workbook' && (
              <div className="space-y-3">
                {/* 영어 문장 카드 */}
                <div className="p-3.5 rounded-xl bg-card border border-primary/20 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-primary">ENGLISH SENTENCE</span>
                    <Button
                      type="button"
                      size="sm"
                      variant="ghost"
                      className="h-6 text-xs gap-1 text-muted-foreground hover:text-primary"
                      onClick={() => handleSpeak(currentPair.english)}
                    >
                      <Volume2 className="h-3.5 w-3.5" /> 듣기
                    </Button>
                  </div>
                  <p className="text-base sm:text-lg font-serif text-foreground leading-relaxed">
                    {currentPair.english}
                  </p>
                </div>

                {/* 아이패드 애플펜슬 손글씨 필기 캔버스 */}
                <TabletPenCanvas
                  id={`workbook-canvas-${currentIndex}`}
                  height={130}
                  placeholderText="애플펜슬 또는 손가락으로 이 문장의 한국어 해석을 직접 적어보세요..."
                />

                {/* 한국어 정답 확인 영역 */}
                {isWorkbookAnswerRevealed && (
                  <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-xs space-y-1 animate-in fade-in">
                    <span className="font-bold text-emerald-600 dark:text-emerald-400">
                      ✨ AI 정답 한국어 번역:
                    </span>
                    <p className="text-sm font-sans text-foreground leading-relaxed">
                      {currentPair.korean}
                    </p>
                  </div>
                )}

                {/* 워크북 컨트롤 */}
                <div className="flex items-center justify-between pt-1">
                  {!isWorkbookAnswerRevealed ? (
                    <Button
                      type="button"
                      variant="secondary"
                      onClick={() => setIsWorkbookAnswerRevealed(true)}
                      className="gap-1.5 font-semibold text-xs ml-auto"
                    >
                      <Eye className="h-4 w-4" /> 정답 해석 확인하기
                    </Button>
                  ) : (
                    <div className="flex items-center justify-between w-full gap-2">
                      <span className="text-xs text-muted-foreground font-medium">
                        내가 쓴 손글씨 해석이 맞았나요?
                      </span>
                      <div className="flex gap-2">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => handleWorkbookMark(false)}
                          className="gap-1 text-xs"
                        >
                          아쉬워요 😢
                        </Button>
                        <Button
                          type="button"
                          size="sm"
                          onClick={() => handleWorkbookMark(true)}
                          className="gap-1 text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white"
                        >
                          맞았어요! 👍
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
