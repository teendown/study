'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  Volume2,
  Sparkles,
  CheckCircle2,
  XCircle,
  ArrowRight,
  HelpCircle,
  Lightbulb,
  BookOpen,
  RotateCcw,
  Trophy,
  Flame,
  Check,
  Eye,
  Layers,
  FileText,
  Clock,
  X,
  Keyboard,
  ListFilter,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import type { PassageItem } from '@/features/vocabulary/types/passageTypes';
import type { SessionSummary } from '../types';
import { useBackHandler } from '@/lib/navigation';

export interface ClozeQuestion {
  id: string;
  sentenceIndex: number;
  originalSentence: string;
  koreanTranslation: string;
  targetWord: string;
  cleanTargetWord: string; // 마침표 등 구두점 제외된 순수 단어
  prefix: string; // 빈칸 앞부분 문장
  suffix: string; // 빈칸 뒷부분 문장
  options: string[]; // 4지선다 보기
  hint: string;
}

export interface PassageClozeSessionProps {
  passage: PassageItem;
  repeatRounds?: number; // 반복 횟수 (1~5회)
  questionType?: 'choice' | 'chips' | 'typing'; // 4지선다 vs 단어 칩 vs 타이핑
  blankDensity?: 'keywords' | 'one_per_sentence' | 'two_per_sentence';
  onFinish: (summary: SessionSummary) => void;
  onExit: () => void;
}

export function PassageClozeSession({
  passage,
  repeatRounds = 1,
  questionType = 'choice',
  blankDensity = 'keywords',
  onFinish,
  onExit,
}: PassageClozeSessionProps) {
  // 모바일 뒤로가기 제어
  useBackHandler(true, onExit, 'passage_cloze_session');

  const [currentRound, setCurrentRound] = useState(1);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [typedAnswer, setTypedAnswer] = useState('');
  const [isAnswered, setIsAnswered] = useState(false);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const [showHint, setShowHint] = useState(false);
  const [showFullPassageContext, setShowFullPassageContext] = useState(false);

  // 성과 통계
  const [combo, setCombo] = useState(0);
  const [maxCombo, setMaxCombo] = useState(0);
  const [correctCount, setCorrectCount] = useState(0);
  const [wrongCount, setWrongCount] = useState(0);
  const [xpEarned, setXpEarned] = useState(0);
  const [wrongQuestions, setWrongQuestions] = useState<ClozeQuestion[]>([]);

  const sessionStartTime = useRef<number>(Date.now());
  const inputRef = useRef<HTMLInputElement>(null);

  // 1. 지문으로부터 빈칸 문제 목록 생성
  const questions: ClozeQuestion[] = useMemo(() => {
    const rawSentences = passage.sentences || [];
    const rawTrans = passage.sentenceTranslations || [];
    const vocabSet = new Set(
      (passage.vocabularyList || []).map((v) => v.toLowerCase().trim())
    );

    const generated: ClozeQuestion[] = [];

    rawSentences.forEach((sentence, sIdx) => {
      const trimmedSentence = sentence.trim();
      if (!trimmedSentence) return;

      const translation =
        rawTrans[sIdx] ||
        (sIdx === 0 && passage.translation ? passage.translation : '한국어 문맥 번역');

      // 단어 토큰 분리
      const tokens = trimmedSentence.split(/(\s+)/);
      const wordTokens = tokens.filter((t) => /\w+/.test(t));

      // 빈칸 후보 선정
      let candidateWords: string[] = [];

      if (blankDensity === 'keywords') {
        // 어휘 목록에 포함된 단어 우선
        candidateWords = wordTokens.filter((w) => {
          const clean = w.replace(/[.,?!;:()'"]/g, '').toLowerCase();
          return clean.length >= 3 && (vocabSet.has(clean) || clean.length >= 6);
        });
      }

      // 만약 후보가 없으면 4글자 이상의 일반 단어 중에서 선택
      if (candidateWords.length === 0) {
        candidateWords = wordTokens.filter((w) => {
          const clean = w.replace(/[.,?!;:()'"]/g, '').toLowerCase();
          return clean.length >= 4 && !['this', 'that', 'with', 'from', 'have', 'were', 'they'].includes(clean);
        });
      }

      if (candidateWords.length === 0) {
        candidateWords = wordTokens.slice(0, 1);
      }

      // 선정된 단어로 빈칸 문제 구성 (최대 1~2개)
      const selectedWords = candidateWords.slice(0, blankDensity === 'two_per_sentence' ? 2 : 1);

      selectedWords.forEach((targetWordRaw, wIdx) => {
        const cleanWord = targetWordRaw.replace(/[.,?!;:()'"]/g, '');
        if (!cleanWord) return;

        // prefix와 suffix 추출
        const targetPos = trimmedSentence.indexOf(targetWordRaw);
        const prefix = trimmedSentence.substring(0, targetPos);
        const suffix = trimmedSentence.substring(targetPos + targetWordRaw.length);

        // 오답 선택지(distractors) 풀 생성
        const otherWordsPool = (passage.vocabularyList || []).filter(
          (w) => w.toLowerCase() !== cleanWord.toLowerCase()
        );
        const shuffledOthers = [...otherWordsPool].sort(() => 0.5 - Math.random());
        const distractors = shuffledOthers.slice(0, 3);

        // 오답이 부족하면 대체 일반 고교 어휘 추가
        const defaultDistractors = [
          'perspective',
          'maintain',
          'significant',
          'contribute',
          'essential',
          'transform',
          'consequence',
        ];
        for (const d of defaultDistractors) {
          if (distractors.length >= 3) break;
          if (d.toLowerCase() !== cleanWord.toLowerCase() && !distractors.includes(d)) {
            distractors.push(d);
          }
        }

        const options = [cleanWord, ...distractors].sort(() => 0.5 - Math.random());

        generated.push({
          id: `q-${sIdx}-${wIdx}-${cleanWord}`,
          sentenceIndex: sIdx,
          originalSentence: trimmedSentence,
          koreanTranslation: translation,
          targetWord: targetWordRaw,
          cleanTargetWord: cleanWord,
          prefix,
          suffix,
          options,
          hint: `${cleanWord.charAt(0)}${'_'.repeat(Math.max(2, cleanWord.length - 1))}`,
        });
      });
    });

    return generated.length > 0
      ? generated
      : [
          {
            id: 'default-q',
            sentenceIndex: 0,
            originalSentence: passage.content,
            koreanTranslation: passage.translation || '',
            targetWord: 'habit',
            cleanTargetWord: 'habit',
            prefix: 'The power of ',
            suffix: ' in daily life.',
            options: ['habit', 'nature', 'science', 'future'],
            hint: 'h____',
          },
        ];
  }, [passage, blankDensity]);

  const currentQ = questions[currentQuestionIndex] || questions[0];
  const totalInRound = questions.length;
  const grandTotalQuestions = totalInRound * repeatRounds;
  const currentGlobalProgress =
    (currentRound - 1) * totalInRound + currentQuestionIndex + 1;
  const progressPercent = Math.round(
    (currentGlobalProgress / grandTotalQuestions) * 100
  );

  // 음성 듣기 (TTS)
  const handleSpeak = (text: string) => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'en-US';
      utterance.rate = 0.85;
      window.speechSynthesis.speak(utterance);
    }
  };

  // 문제 변경 시 상태 리셋
  useEffect(() => {
    setIsAnswered(false);
    setIsCorrect(null);
    setSelectedOption(null);
    setTypedAnswer('');
    setShowHint(false);

    if (questionType === 'typing') {
      setTimeout(() => inputRef.current?.focus(), 150);
    }
  }, [currentQuestionIndex, currentRound, questionType]);

  // 답변 제출 판정
  const handleCheckAnswer = (answer: string) => {
    if (isAnswered) return;

    const cleanInput = answer.trim().toLowerCase();
    const cleanCorrect = currentQ.cleanTargetWord.trim().toLowerCase();
    const correct = cleanInput === cleanCorrect;

    setSelectedOption(answer);
    setIsAnswered(true);
    setIsCorrect(correct);

    if (correct) {
      const nextCombo = combo + 1;
      setCombo(nextCombo);
      setMaxCombo((prev) => Math.max(prev, nextCombo));
      setCorrectCount((c) => c + 1);
      setXpEarned((x) => x + 15 + Math.min(nextCombo * 2, 20));

      // 원어민 전체 문장 발음 재생
      handleSpeak(currentQ.originalSentence);
    } else {
      setCombo(0);
      setWrongCount((w) => w + 1);
      setWrongQuestions((prev) => [...prev, currentQ]);
    }
  };

  // 다음 문제로 이동
  const handleNext = () => {
    if (currentQuestionIndex + 1 < totalInRound) {
      setCurrentQuestionIndex((prev) => prev + 1);
    } else {
      // 현재 라운드 완료
      if (currentRound < repeatRounds) {
        setCurrentRound((prev) => prev + 1);
        setCurrentQuestionIndex(0);
      } else {
        // 전체 세션 완료 -> 요약 생성
        const totalTimeSeconds = Math.max(
          1,
          Math.round((Date.now() - sessionStartTimeRef.current) / 1000)
        );
        const totalAnswered = correctCount + wrongCount;
        const accuracy =
          totalAnswered > 0 ? Math.round((correctCount / totalAnswered) * 100) : 100;

        const summary: SessionSummary = {
          mode: 'learning',
          totalQuestions: grandTotalQuestions,
          correctCount,
          wrongCount,
          accuracy,
          totalXpEarned: xpEarned,
          maxCombo,
          totalTimeSeconds,
          answers: [],
          wrongItems: [],
        };

        onFinish(summary);
      }
    }
  };

  const sessionStartTimeRef = useRef<number>(Date.now());

  return (
    <div className="space-y-4 max-w-3xl mx-auto pb-16">
      {/* ────────────────────────────────────
          1. 상단 헤더 (지문 타이틀, 라운드, 프로그레스, 콤보/XP)
         ──────────────────────────────────── */}
      <div className="bg-card/90 backdrop-blur-md p-4 rounded-2xl border border-border shadow-sm space-y-3">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20 shrink-0">
              <FileText className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-sm sm:text-base text-foreground truncate">
                  {passage.title}
                </span>
                <Badge variant="outline" className="text-[10px] bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/30 shrink-0 font-bold">
                  지문 빈칸 채우기
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground">
                {repeatRounds > 1 ? `반복 ${currentRound}/${repeatRounds}회차 • ` : ''}
                문항 {currentQuestionIndex + 1}/{totalInRound}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {/* 콤보 배지 */}
            {combo > 1 && (
              <Badge className="bg-gradient-to-r from-amber-500 to-orange-500 text-white font-extrabold text-xs px-2.5 py-1 animate-bounce gap-1">
                <Flame className="h-3.5 w-3.5 fill-current" />
                <span>{combo} COMBO!</span>
              </Badge>
            )}

            {/* 나가기 버튼 */}
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-muted-foreground hover:text-foreground"
              onClick={onExit}
              title="학습 나가기"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* 진행률 바 */}
        <div className="space-y-1">
          <div className="flex justify-between text-[11px] font-bold text-muted-foreground">
            <span>전체 진행률 ({currentGlobalProgress}/{grandTotalQuestions})</span>
            <span className="text-indigo-600 dark:text-indigo-400">{progressPercent}%</span>
          </div>
          <Progress value={progressPercent} className="h-2" />
        </div>
      </div>

      {/* ────────────────────────────────────
          2. 메인 문제 풀이 카드
         ──────────────────────────────────── */}
      <Card className="border-2 border-indigo-500/20 shadow-md bg-card/95 overflow-hidden">
        <CardContent className="p-5 sm:p-6 space-y-6">
          {/* 상단 문맥 보기 토글 & 듣기 버튼 */}
          <div className="flex items-center justify-between gap-2 pb-3 border-b border-border/60">
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-8 text-xs font-bold gap-1.5 border-primary/30 text-primary hover:bg-primary/10"
                onClick={() => handleSpeak(currentQ.originalSentence)}
                title="문장 전체 원어민 발음 듣기"
              >
                <Volume2 className="h-4 w-4" />
                <span>문장 듣기</span>
              </Button>

              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-8 text-xs font-medium gap-1 text-muted-foreground hover:text-foreground"
                onClick={() => setShowFullPassageContext(!showFullPassageContext)}
              >
                <BookOpen className="h-3.5 w-3.5" />
                <span>{showFullPassageContext ? '지문 닫기' : '전체 지문 보기'}</span>
              </Button>
            </div>

            {/* 힌트 버튼 */}
            {!isAnswered && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-8 text-xs font-bold gap-1 text-amber-600 dark:text-amber-400 hover:bg-amber-500/10"
                onClick={() => setShowHint(!showHint)}
              >
                <Lightbulb className="h-3.5 w-3.5" />
                <span>힌트</span>
              </Button>
            )}
          </div>

          {/* 전체 지문 문맥 펼치기 카드 */}
          {showFullPassageContext && (
            <div className="p-4 rounded-xl bg-muted/50 border border-border text-xs sm:text-sm leading-relaxed text-muted-foreground space-y-2 animate-in fade-in">
              <p className="font-bold text-foreground flex items-center gap-1.5">
                <BookOpen className="h-4 w-4 text-primary" />
                전체 지문 본문
              </p>
              <div className="whitespace-pre-line font-serif">
                {passage.sentences.map((sent, idx) => {
                  const isCurrent = idx === currentQ.sentenceIndex;
                  return (
                    <span
                      key={idx}
                      className={`transition-colors ${
                        isCurrent
                          ? 'bg-indigo-500/20 text-indigo-950 dark:text-indigo-200 font-bold px-1 rounded'
                          : ''
                      }`}
                    >
                      {sent}{' '}
                    </span>
                  );
                })}
              </div>
            </div>
          )}

          {/* 힌트 박스 */}
          {showHint && !isAnswered && (
            <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-900 dark:text-amber-200 text-xs sm:text-sm flex items-center justify-between gap-2 animate-in fade-in">
              <div className="flex items-center gap-2">
                <Lightbulb className="h-4 w-4 text-amber-600 dark:text-amber-400 shrink-0" />
                <span>
                  첫 글자 힌트: <strong className="font-mono font-bold tracking-widest text-amber-700 dark:text-amber-300">{currentQ.hint}</strong> ({currentQ.cleanTargetWord.length}글자)
                </span>
              </div>
            </div>
          )}

          {/* 📝 빈칸 포함 영어 문장 디스플레이 */}
          <div className="p-5 sm:p-6 rounded-2xl bg-indigo-500/5 border border-indigo-500/20 text-center space-y-3">
            <div className="text-base sm:text-xl font-medium leading-relaxed tracking-wide text-foreground">
              <span>{currentQ.prefix}</span>
              <span className="inline-block mx-1.5 px-3 py-1 rounded-xl font-bold font-mono transition-all border-2 border-dashed border-indigo-500/40 bg-background/80 shadow-xs">
                {isAnswered ? (
                  <span
                    className={`inline-flex items-center gap-1 ${
                      isCorrect ? 'text-emerald-600 font-bold' : 'text-red-600 font-bold'
                    }`}
                  >
                    {currentQ.cleanTargetWord}
                    {isCorrect ? (
                      <Check className="h-4 w-4 inline text-emerald-500" />
                    ) : (
                      <X className="h-4 w-4 inline text-red-500" />
                    )}
                  </span>
                ) : (
                  <span className="text-indigo-600 dark:text-indigo-400 tracking-widest">
                    [ ? ]
                  </span>
                )}
              </span>
              <span>{currentQ.suffix}</span>
            </div>

            {/* 한국어 문맥 해석 */}
            <p className="text-xs sm:text-sm text-muted-foreground font-medium pt-2 border-t border-indigo-500/10">
              "{currentQ.koreanTranslation}"
            </p>
          </div>

          {/* ────────────────────────────────────
              3. 답안 입력 방식 (4지선다 vs 단어 칩 vs 직접 타이핑)
             ──────────────────────────────────── */}
          {!isAnswered ? (
            <div className="space-y-4 pt-2">
              {questionType === 'choice' || questionType === 'chips' ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {currentQ.options.map((opt, idx) => (
                    <Button
                      key={idx}
                      type="button"
                      variant="outline"
                      size="lg"
                      className="h-13 font-mono font-bold text-sm sm:text-base border-2 hover:border-indigo-500 hover:bg-indigo-500/10 hover:text-indigo-600 dark:hover:text-indigo-400 transition-all rounded-xl justify-start px-4 shadow-xs"
                      onClick={() => handleCheckAnswer(opt)}
                    >
                      <span className="w-6 text-xs text-muted-foreground font-sans">
                        {String.fromCharCode(65 + idx)}.
                      </span>
                      <span className="truncate">{opt}</span>
                    </Button>
                  ))}
                </div>
              ) : (
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    if (typedAnswer.trim()) handleCheckAnswer(typedAnswer);
                  }}
                  className="space-y-3"
                >
                  <div className="flex gap-2">
                    <Input
                      ref={inputRef}
                      value={typedAnswer}
                      onChange={(e) => setTypedAnswer(e.target.value)}
                      placeholder="빈칸에 들어갈 단어를 영어로 입력하세요..."
                      className="h-12 font-mono font-bold text-base sm:text-lg bg-background"
                      autoFocus
                    />
                    <Button
                      type="submit"
                      disabled={!typedAnswer.trim()}
                      className="h-12 px-6 font-bold bg-indigo-600 hover:bg-indigo-700 text-white shadow-md shrink-0"
                    >
                      확인
                    </Button>
                  </div>
                </form>
              )}
            </div>
          ) : (
            /* ────────────────────────────────────
                4. 정답 / 오답 판정 결과 피드백 & 다음 버튼
               ──────────────────────────────────── */
            <div
              className={`p-4 sm:p-5 rounded-2xl border-2 space-y-4 animate-in fade-in zoom-in-95 duration-200 ${
                isCorrect
                  ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-950 dark:text-emerald-200'
                  : 'bg-red-500/10 border-red-500/30 text-red-950 dark:text-red-200'
              }`}
            >
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center gap-2">
                  {isCorrect ? (
                    <CheckCircle2 className="h-6 w-6 text-emerald-600 dark:text-emerald-400 shrink-0" />
                  ) : (
                    <XCircle className="h-6 w-6 text-red-600 dark:text-red-400 shrink-0" />
                  )}
                  <div>
                    <h4 className="font-extrabold text-base">
                      {isCorrect ? '정답입니다! 완벽해요 🎉' : '아쉬워요! 정답을 확인하세요.'}
                    </h4>
                    {!isCorrect && (
                      <p className="text-xs text-muted-foreground mt-0.5">
                        정답: <strong className="font-bold text-foreground font-mono">{currentQ.cleanTargetWord}</strong>
                      </p>
                    )}
                  </div>
                </div>

                <Button
                  type="button"
                  size="lg"
                  className={`h-11 px-6 font-bold gap-2 text-white shadow-md transition-all ${
                    isCorrect
                      ? 'bg-emerald-600 hover:bg-emerald-700'
                      : 'bg-indigo-600 hover:bg-indigo-700'
                  }`}
                  onClick={handleNext}
                  autoFocus
                >
                  <span>다음 문장</span>
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
