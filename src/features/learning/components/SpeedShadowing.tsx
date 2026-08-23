'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import {
  Play,
  Pause,
  RotateCcw,
  Volume2,
  VolumeX,
  FastForward,
  Rewind,
  Mic,
  Sparkles,
  ArrowRight,
  Gauge,
  Flame,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import type { VocabularyWithItem } from '@/features/vocabulary/types';

interface SpeedShadowingProps {
  vocabList: VocabularyWithItem[];
  onFinish: (xpEarned: number, totalCount: number) => void;
  onExit: () => void;
}

export function SpeedShadowing({
  vocabList,
  onFinish,
  onExit,
}: SpeedShadowingProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const [intervalSpeed, setIntervalSpeed] = useState<number>(2500); // ms 단위 (2.5초 기본)
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [xpEarned, setXpEarned] = useState(0);

  const total = vocabList.length;
  const currentWord = vocabList[currentIndex];
  const progressPercent = ((currentIndex + 1) / total) * 100;

  // TTS 발음 재생
  const speakWord = useCallback((text: string) => {
    if (!soundEnabled) return;
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'en-US';
      utterance.rate = intervalSpeed <= 1800 ? 1.0 : 0.85;
      window.speechSynthesis.speak(utterance);
    }
  }, [soundEnabled, intervalSpeed]);

  // 단어 전환 시 발음 자동 재생 및 XP 증가
  useEffect(() => {
    if (!currentWord) return;
    speakWord(currentWord.word);
    setXpEarned((prev) => prev + 5);
  }, [currentIndex, currentWord, speakWord]);

  // 자동 다음 단어 타이머
  useEffect(() => {
    if (!isPlaying) return;

    const timer = setTimeout(() => {
      if (currentIndex + 1 < total) {
        setCurrentIndex((prev) => prev + 1);
      } else {
        // 완주 시 종료
        setIsPlaying(false);
        onFinish(xpEarned + 20, total); // 완주 보너스 +20 XP
      }
    }, intervalSpeed);

    return () => clearTimeout(timer);
  }, [currentIndex, isPlaying, intervalSpeed, total, onFinish, xpEarned]);

  const handlePrev = () => {
    if (currentIndex > 0) setCurrentIndex((prev) => prev - 1);
  };

  const handleNext = () => {
    if (currentIndex + 1 < total) {
      setCurrentIndex((prev) => prev + 1);
    } else {
      onFinish(xpEarned + 20, total);
    }
  };

  if (!currentWord) return null;

  return (
    <div className="max-w-xl mx-auto space-y-4">
      {/* 상단 컨트롤 바 */}
      <div className="flex items-center justify-between text-xs font-semibold">
        <div className="flex items-center gap-2">
          <Badge className="bg-gradient-to-r from-orange-500 to-pink-500 text-white gap-1 animate-pulse">
            <Flame className="h-3 w-3 fill-white" />
            스피드 섀도잉
          </Badge>
          <span className="text-muted-foreground">
            <span className="text-foreground font-bold">{currentIndex + 1}</span> / {total}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-sq-xp font-bold">+{xpEarned} XP</span>
          <Button
            variant="ghost"
            size="sm"
            onClick={onExit}
            className="h-7 px-2 text-xs text-muted-foreground"
          >
            종료
          </Button>
        </div>
      </div>

      <Progress value={progressPercent} className="h-2" />

      {/* 메인 섀도잉 플래시 카드 */}
      <Card className="border-2 border-primary/40 bg-gradient-to-b from-primary/10 via-background to-background overflow-hidden shadow-lg">
        <CardContent className="p-6 sm:p-8 text-center space-y-6">
          {/* 상단 안내 애니메이션 */}
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/15 text-primary text-xs font-bold animate-bounce">
            <Mic className="h-3.5 w-3.5" />
            소리 내어 따라 읽으세요! (Repeat After Me)
          </div>

          {/* 대형 영단어 텍스트 */}
          <div className="space-y-2 py-4">
            <h1 className="text-4xl sm:text-5xl font-black tracking-wide text-foreground animate-combo">
              {currentWord.word}
            </h1>
            {currentWord.pronunciation && (
              <p className="text-sm font-medium text-muted-foreground tracking-wider">
                {currentWord.pronunciation}
              </p>
            )}
          </div>

          {/* 한국어 뜻 */}
          <div className="p-4 rounded-2xl bg-muted/50 border border-border/80 space-y-1">
            <div className="flex items-center justify-center gap-2">
              {currentWord.partOfSpeech && (
                <Badge variant="secondary" className="text-xs font-semibold">
                  {currentWord.partOfSpeech}
                </Badge>
              )}
              <span className="text-xl sm:text-2xl font-bold text-foreground">
                {currentWord.meaning}
              </span>
            </div>

            {currentWord.exampleSentence && (
              <p className="text-xs text-muted-foreground pt-2 italic">
                &ldquo;{currentWord.exampleSentence}&rdquo;
              </p>
            )}
          </div>

          {/* 발음 다시 듣기 버튼 */}
          <Button
            variant="outline"
            size="sm"
            className="gap-1.5 font-semibold text-primary border-primary/30 hover:bg-primary/10"
            onClick={() => speakWord(currentWord.word)}
          >
            <Volume2 className="h-4 w-4" /> 발음 다시 듣기
          </Button>
        </CardContent>
      </Card>

      {/* 하단 플레이 컨트롤 & 속도 조절 */}
      <Card className="p-3">
        <div className="flex items-center justify-between gap-2">
          {/* 이전 단어 */}
          <Button
            variant="ghost"
            size="icon"
            onClick={handlePrev}
            disabled={currentIndex === 0}
          >
            <Rewind className="h-4 w-4" />
          </Button>

          {/* 재생 / 일시정지 */}
          <Button
            size="lg"
            className="rounded-full w-12 h-12 p-0 shadow-md font-bold"
            onClick={() => setIsPlaying(!isPlaying)}
          >
            {isPlaying ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5 ml-0.5" />}
          </Button>

          {/* 다음 단어 */}
          <Button variant="ghost" size="icon" onClick={handleNext}>
            <FastForward className="h-4 w-4" />
          </Button>

          {/* 음소거 토글 */}
          <Button
            variant="ghost"
            size="icon"
            className={!soundEnabled ? 'text-destructive' : 'text-muted-foreground'}
            onClick={() => setSoundEnabled(!soundEnabled)}
          >
            {soundEnabled ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
          </Button>

          {/* 속도 조절 버튼 (1.8s / 2.5s / 3.5s) */}
          <div className="flex items-center gap-1 bg-muted/80 p-1 rounded-xl text-xs font-bold">
            <button
              onClick={() => setIntervalSpeed(1800)}
              className={`px-2 py-1 rounded-lg transition-colors ${
                intervalSpeed === 1800 ? 'bg-primary text-white' : 'text-muted-foreground'
              }`}
            >
              1.8초
            </button>
            <button
              onClick={() => setIntervalSpeed(2500)}
              className={`px-2 py-1 rounded-lg transition-colors ${
                intervalSpeed === 2500 ? 'bg-primary text-white' : 'text-muted-foreground'
              }`}
            >
              2.5초
            </button>
            <button
              onClick={() => setIntervalSpeed(3500)}
              className={`px-2 py-1 rounded-lg transition-colors ${
                intervalSpeed === 3500 ? 'bg-primary text-white' : 'text-muted-foreground'
              }`}
            >
              3.5초
            </button>
          </div>
        </div>
      </Card>
    </div>
  );
}
