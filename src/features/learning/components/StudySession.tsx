'use client';

import { useState, useEffect, useRef } from 'react';
import {
  Volume2,
  Timer,
  Flame,
  CheckCircle2,
  XCircle,
  ArrowRight,
  HelpCircle,
  Lightbulb,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import type { GeneratedQuestion, AnswerRecord, SessionSummary } from '../types';
import type { StudyMode } from '@/types';
import { createMaskedWord } from '../engine/generator';

interface StudySessionProps {
  questions: GeneratedQuestion[];
  mode: StudyMode;
  onFinish: (summary: SessionSummary) => void;
  onExit: () => void;
}

export function StudySession({
  questions,
  mode,
  onFinish,
  onExit,
}: StudySessionProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [userTypedAnswer, setUserTypedAnswer] = useState('');
  const [isAnswered, setIsAnswered] = useState(false);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [showHint, setShowHint] = useState(false);

  // 통계 및 콤보 상태
  const [combo, setCombo] = useState(0);
  const [maxCombo, setMaxCombo] = useState(0);
  const [xpEarned, setXpEarned] = useState(0);
  const [answers, setAnswers] = useState<AnswerRecord[]>([]);

  // 타이머 관련
  const startTimeRef = useRef<number>(Date.now());
  const sessionStartTimeRef = useRef<number>(Date.now());
  const [timeLeft, setTimeLeft] = useState<number | null>(null);

  const currentQ = questions[currentIndex];
  const total = questions.length;
  const progressPercent = total > 0 ? ((currentIndex + 1) / total) * 100 : 0;

  // 단어 발음 TTS
  const handleSpeak = (text: string) => {
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'en-US';
      utterance.rate = 0.85;
      window.speechSynthesis.speak(utterance);
    }
  };

  // 문제 변경 시 타이머 & 상태 초기화
  useEffect(() => {
    startTimeRef.current = Date.now();
    setIsAnswered(false);
    setIsCorrect(null);
    setSelectedOption(null);
    setUserTypedAnswer('');
    setShowHint(false);

    if (currentQ?.timeLimit) {
      setTimeLeft(currentQ.timeLimit);
    } else {
      setTimeLeft(null);
    }
  }, [currentIndex, currentQ]);

  // 스피드 모드 카운트다운 타이머
  useEffect(() => {
    if (timeLeft === null || isAnswered) return;

    if (timeLeft <= 0) {
      handleAnswerSubmission('', false);
      return;
    }

    const timer = setInterval(() => {
      setTimeLeft((prev) => (prev !== null && prev > 0 ? prev - 1 : 0));
    }, 1000);

    return () => clearInterval(timer);
  }, [timeLeft, isAnswered]);

  // 답변 제출 처리 함수
  const handleAnswerSubmission = (answerGiven: string, directCorrectness?: boolean) => {
    if (isAnswered || !currentQ) return;

    const responseTimeMs = Date.now() - startTimeRef.current;
    let correct = false;

    if (typeof directCorrectness === 'boolean') {
      correct = directCorrectness;
    } else {
      const cleanGiven = answerGiven.trim().toLowerCase();
      const cleanAnswer = currentQ.correctAnswer.trim().toLowerCase();
      correct =
        cleanGiven === cleanAnswer ||
        cleanGiven.replace(/\s+/g, '') === cleanAnswer.replace(/\s+/g, '');
    }

    setIsAnswered(true);
    setIsCorrect(correct);

    // XP 및 콤보 계산
    let gainedXp = 0;
    if (correct) {
      const nextCombo = combo + 1;
      setCombo(nextCombo);
      if (nextCombo > maxCombo) setMaxCombo(nextCombo);

      gainedXp = 10;
      if (responseTimeMs < 3000) gainedXp += 5;
      if (nextCombo >= 3) gainedXp += 5;

      setXpEarned((prev) => prev + gainedXp);
    } else {
      setCombo(0);
    }

    // 기록 추가
    const record: AnswerRecord = {
      questionId: currentQ.id,
      learningItemId: currentQ.learningItemId,
      word: currentQ.word.word,
      meaning: currentQ.word.meaning,
      isCorrect: correct,
      userAnswer: answerGiven,
      correctAnswer: currentQ.correctAnswer,
      responseTimeMs,
    };

    setAnswers((prev) => [...prev, record]);
  };

  // 객관식 선택 시
  const handleOptionClick = (option: string) => {
    if (isAnswered) return;
    setSelectedOption(option);
    const correct = option.trim().toLowerCase() === currentQ.correctAnswer.trim().toLowerCase();
    handleAnswerSubmission(option, correct);
  };

  // 주관식/빈칸 제출 시
  const handleTypedSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!userTypedAnswer.trim() || isAnswered) return;
    handleAnswerSubmission(userTypedAnswer);
  };

  // 다음 문제로 이동
  const handleNext = () => {
    if (currentIndex + 1 < total) {
      setCurrentIndex((prev) => prev + 1);
    } else {
      const totalTimeSec = Math.round((Date.now() - sessionStartTimeRef.current) / 1000);
      const correctCount = answers.filter((a) => a.isCorrect).length;
      const wrongCount = total - correctCount;
      const accuracy = total > 0 ? Math.round((correctCount / total) * 100) : 0;

      const wrongWordIds = new Set(
        answers.filter((a) => !a.isCorrect).map((a) => a.learningItemId)
      );

      const wrongItems = questions
        .map((q) => q.word)
        .filter((w) => wrongWordIds.has(w.learningItemId));

      onFinish({
        mode,
        totalQuestions: total,
        correctCount,
        wrongCount,
        accuracy,
        totalXpEarned: xpEarned,
        maxCombo,
        totalTimeSeconds: totalTimeSec,
        answers,
        wrongItems,
      });
    }
  };

  if (!currentQ) {
    return null;
  }

  return (
    <div className="max-w-xl mx-auto space-y-4 py-4 animate-in fade-in duration-200">
      {/* 상단 헤더: 진행률, 콤보, 타이머 */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs font-semibold text-muted-foreground">
          <div className="flex items-center gap-2">
            <span>
              문제 <strong className="text-foreground text-sm">{currentIndex + 1}</strong> / {total}
            </span>
            {combo > 1 && (
              <Badge variant="secondary" className="bg-amber-500/15 text-amber-600 border-amber-500/30 gap-1 text-xs">
                <Flame className="h-3.5 w-3.5 fill-amber-500 text-amber-500" />
                {combo} 콤보!
              </Badge>
            )}
          </div>

          <div className="flex items-center gap-3">
            {timeLeft !== null && (
              <div
                className={`flex items-center gap-1 font-mono text-xs px-2 py-0.5 rounded-full border ${
                  timeLeft <= 3 ? 'text-destructive border-destructive/50 bg-destructive/10 animate-pulse' : 'text-primary border-primary/30'
                }`}
              >
                <Timer className="h-3 w-3" />
                <span>{timeLeft}s</span>
              </div>
            )}
            <span className="text-emerald-600 font-bold">+{xpEarned} XP</span>
            <Button variant="ghost" size="sm" onClick={onExit} className="h-7 px-2 text-xs text-muted-foreground">
              종료
            </Button>
          </div>
        </div>

        <Progress value={progressPercent} className="h-2" />
      </div>

      {/* 메인 문제 카드 */}
      <Card className="border-2 shadow-sm">
        <CardContent className="p-5 sm:p-6 space-y-5">
          {/* 문제 헤더 & 텍스트 */}
          <div className="space-y-2">
            <p className="text-xs text-muted-foreground font-medium">
              {currentQ.type === 'multiple_choice'
                ? '객관식 문제'
                : currentQ.type === 'fill_blank'
                ? '빈칸 완성'
                : currentQ.type === 'sentence_completion'
                ? '문장 완성'
                : '스펠링 입력'}
            </p>
            <h3 className="text-lg sm:text-xl font-bold leading-snug">
              {currentQ.questionText}
            </h3>

            {/* 1. 객관식 (단어 -> 뜻 선택인 경우 영어 단어 강조) */}
            {currentQ.type === 'multiple_choice' && currentQ.correctAnswer === currentQ.word.meaning && (
              <div className="flex items-center gap-2 p-3 rounded-xl bg-primary/5 border border-primary/10 mt-2">
                <span className="text-2xl font-black tracking-wide text-primary">
                  {currentQ.word.word}
                </span>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-primary shrink-0"
                  onClick={() => handleSpeak(currentQ.word.word)}
                >
                  <Volume2 className="h-4 w-4" />
                </Button>
                {currentQ.word.partOfSpeech && (
                  <span className="text-xs text-muted-foreground ml-auto font-semibold bg-muted px-2 py-0.5 rounded">
                    {currentQ.word.partOfSpeech}
                  </span>
                )}
              </div>
            )}

            {/* 2. ⚡ 빈칸 완성 (fill_blank) 전용 시각적 카드 (한국어 뜻 + 마스킹된 빈칸 철자 or 예문 문장) */}
            {currentQ.type === 'fill_blank' && (
              <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-br from-primary/10 via-primary/5 to-background border-2 border-primary/20 space-y-3 mt-2 shadow-xs">
                <div className="flex items-center justify-between gap-2 border-b border-primary/10 pb-2">
                  <span className="text-xs font-bold text-primary flex items-center gap-1">
                    💡 맞혀야 할 단어의 뜻
                  </span>
                  {currentQ.word.partOfSpeech && (
                    <span className="text-xs bg-primary/10 text-primary font-semibold px-2 py-0.5 rounded-md">
                      {currentQ.word.partOfSpeech}
                    </span>
                  )}
                </div>

                <p className="text-xl sm:text-2xl font-extrabold text-foreground tracking-tight">
                  {currentQ.word.meaning}
                </p>

                {/* 예문이 있고 단어가 포함되어 있다면 예문 속 빈칸 표시 */}
                {currentQ.word.exampleSentence && currentQ.word.exampleSentence.toLowerCase().includes(currentQ.word.word.toLowerCase()) ? (
                  <div className="p-3 rounded-xl bg-card border text-sm sm:text-base font-medium leading-relaxed text-foreground/90 space-y-1">
                    <p className="text-[11px] text-muted-foreground font-semibold">📖 예문 속 빈칸</p>
                    <p className="font-semibold text-primary">
                      {currentQ.word.exampleSentence.replace(
                        new RegExp(`\\b${currentQ.word.word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}[a-z]*\\b`, 'gi'),
                        ' [ ______ ] '
                      )}
                    </p>
                    {currentQ.word.exampleTranslation && (
                      <p className="text-xs text-muted-foreground italic pt-0.5">
                        해석: {currentQ.word.exampleTranslation}
                      </p>
                    )}
                  </div>
                ) : (
                  /* 예문이 없는 경우 마스킹된 철자 힌트 박스 표시 (예: w _ _ _ y) */
                  <div className="p-3 rounded-xl bg-card border flex items-center justify-between gap-2">
                    <span className="text-xs text-muted-foreground font-semibold">철자 힌트:</span>
                    <div className="font-mono text-lg sm:text-xl font-black text-primary tracking-widest bg-muted/60 px-3.5 py-1 rounded-lg border">
                      {createMaskedWord(currentQ.word.word).masked}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* 3. 직접 타이핑 / 스펠링 입력 (typing) 전용 카드 */}
            {currentQ.type === 'typing' && (
              <div className="p-4 sm:p-5 rounded-2xl bg-muted/30 border space-y-2 mt-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-muted-foreground">한국어 뜻</span>
                  {currentQ.word.partOfSpeech && (
                    <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded font-mono">
                      {currentQ.word.partOfSpeech}
                    </span>
                  )}
                </div>
                <p className="text-xl sm:text-2xl font-extrabold text-foreground">
                  {currentQ.word.meaning}
                </p>
                {currentQ.word.exampleTranslation && (
                  <p className="text-xs text-muted-foreground italic">
                    {currentQ.word.exampleTranslation}
                  </p>
                )}
              </div>
            )}
          </div>

          {/* 힌트 버튼 */}
          {currentQ.hint && !isAnswered && (
            <div>
              {showHint ? (
                <div className="flex items-center gap-1.5 text-xs text-amber-600 bg-amber-500/10 p-2.5 rounded-lg">
                  <Lightbulb className="h-4 w-4 shrink-0" />
                  <span>{currentQ.hint}</span>
                </div>
              ) : (
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-xs text-muted-foreground h-7 gap-1"
                  onClick={() => setShowHint(true)}
                >
                  <HelpCircle className="h-3.5 w-3.5" />
                  힌트 보기
                </Button>
              )}
            </div>
          )}

          {/* ──────────────────────────────────
              답변 영역 (객관식 vs 주관식/빈칸)
             ────────────────────────────────── */}
          {currentQ.type === 'multiple_choice' && currentQ.options && (
            <div className="grid grid-cols-1 gap-2.5 pt-2">
              {currentQ.options.map((opt, i) => {
                let btnStyle = 'border-border/80 hover:border-primary/50 hover:bg-primary/5 text-foreground';

                if (isAnswered) {
                  const isThisCorrect =
                    opt.trim().toLowerCase() === currentQ.correctAnswer.trim().toLowerCase();
                  const isThisSelected = opt === selectedOption;

                  if (isThisCorrect) {
                    btnStyle = 'border-emerald-500 bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 font-bold';
                  } else if (isThisSelected && !isCorrect) {
                    btnStyle = 'border-destructive bg-destructive/15 text-destructive font-bold';
                  } else {
                    btnStyle = 'opacity-40 border-border';
                  }
                }

                return (
                  <button
                    key={i}
                    disabled={isAnswered}
                    onClick={() => handleOptionClick(opt)}
                    className={`w-full p-3.5 rounded-xl border-2 text-left text-sm sm:text-base font-medium transition-all duration-150 flex items-center justify-between ${btnStyle}`}
                  >
                    <span>{opt}</span>
                    {isAnswered && opt.trim().toLowerCase() === currentQ.correctAnswer.trim().toLowerCase() && (
                      <CheckCircle2 className="h-5 w-5 text-emerald-500 shrink-0" />
                    )}
                    {isAnswered && opt === selectedOption && !isCorrect && (
                      <XCircle className="h-5 w-5 text-destructive shrink-0" />
                    )}
                  </button>
                );
              })}
            </div>
          )}

          {(currentQ.type === 'fill_blank' || currentQ.type === 'typing') && (
            <form onSubmit={handleTypedSubmit} className="space-y-3 pt-2">
              <div className="flex gap-2">
                <Input
                  placeholder="정답 철자를 영어로 입력하세요..."
                  value={userTypedAnswer}
                  onChange={(e) => setUserTypedAnswer(e.target.value)}
                  disabled={isAnswered}
                  autoFocus
                  className="text-base sm:text-lg font-semibold tracking-wide"
                />
                {!isAnswered && (
                  <Button type="submit" disabled={!userTypedAnswer.trim()} className="font-bold px-5">
                    확인
                  </Button>
                )}
              </div>
            </form>
          )}

          {/* ──────────────────────────────────
              정답/오답 즉시 피드백 패널
             ────────────────────────────────── */}
          {isAnswered && (
            <div
              className={`p-4 rounded-xl border-2 space-y-2 animate-combo ${
                isCorrect
                  ? 'bg-emerald-500/10 border-emerald-500/30'
                  : 'bg-destructive/10 border-destructive/30'
              }`}
            >
              <div className="flex items-center gap-2 font-bold text-sm sm:text-base">
                {isCorrect ? (
                  <>
                    <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                    <span className="text-emerald-600">정답입니다! (+10 XP)</span>
                  </>
                ) : (
                  <>
                    <XCircle className="h-5 w-5 text-destructive" />
                    <span className="text-destructive">아쉽네요!</span>
                  </>
                )}
              </div>

              {!isCorrect && (
                <div className="text-sm font-medium">
                  정답: <span className="text-emerald-600 font-bold underline">{currentQ.correctAnswer}</span>
                </div>
              )}

              {currentQ.explanation && (
                <p className="text-xs text-muted-foreground pt-1 leading-relaxed">
                  💡 {currentQ.explanation}
                </p>
              )}

              <Button
                onClick={handleNext}
                className="w-full mt-3 font-bold gap-1.5 shadow-sm"
                autoFocus
              >
                {currentIndex + 1 < total ? '다음 문제' : '결과 확인하기'}
                <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
