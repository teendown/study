'use client';

import { useState } from 'react';
import {
  ArrowLeft,
  Volume2,
  Copy,
  Check,
  Edit3,
  Trash2,
  BookOpen,
  Sparkles,
  Layers,
  FileText,
  Plus,
  BookmarkPlus,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type { PassageItem } from '../types/passageTypes';
import { BUILTIN_DICTIONARY } from '@/lib/ocr/dictionary';
import { extractEnglishPhrases } from '@/lib/ocr/phraseDictionary';

interface PassageDetailProps {
  passage: PassageItem;
  onBack: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
  onAddWordToVocab?: (word: string, meaning: string) => void;
  onAddPhraseToVocab?: (phrase: string, meaning: string) => void;
}

export function PassageDetail({
  passage,
  onBack,
  onEdit,
  onDelete,
  onAddWordToVocab,
  onAddPhraseToVocab,
}: PassageDetailProps) {
  const [viewMode, setViewMode] = useState<'full' | 'sentences'>('full');
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  const [addedWords, setAddedWords] = useState<Set<string>>(new Set());
  const [addedPhrases, setAddedPhrases] = useState<Set<string>>(new Set());

  const handleCopy = () => {
    navigator.clipboard.writeText(passage.content);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  const handleSpeak = (text: string) => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'en-US';
      utterance.rate = 0.85;
      utterance.onstart = () => setIsPlayingAudio(true);
      utterance.onend = () => setIsPlayingAudio(false);
      utterance.onerror = () => setIsPlayingAudio(false);
      window.speechSynthesis.speak(utterance);
    }
  };

  const handleStopAudio = () => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      setIsPlayingAudio(false);
    }
  };

  const handleAddWord = (word: string, meaning: string) => {
    onAddWordToVocab?.(word, meaning);
    setAddedWords((prev) => new Set(prev).add(word));
  };

  const handleAddPhrase = (phrase: string, meaning: string) => {
    onAddPhraseToVocab?.(phrase, meaning);
    setAddedPhrases((prev) => new Set(prev).add(phrase));
  };

  const wordCount = passage.content.trim().split(/\s+/).filter(Boolean).length;
  const sentenceList = passage.sentences || [];

  // 숙어 목록 (지문 데이터에 없으면 실시간 추출)
  const phrases = passage.phraseList && passage.phraseList.length > 0
    ? passage.phraseList
    : extractEnglishPhrases(passage.content);

  // 단어 목록 (전수 표시)
  const vocabList = passage.vocabularyList || [];

  return (
    <div className="space-y-4 animate-in fade-in duration-200">
      {/* 상단 헤더 및 네비게이션 */}
      <div className="flex items-center justify-between gap-2 border-b border-border pb-3 flex-wrap">
        <Button variant="ghost" size="sm" onClick={onBack} className="gap-1.5 font-bold">
          <ArrowLeft className="h-4 w-4" /> 지문 목록으로
        </Button>

        <div className="flex items-center gap-1.5 flex-wrap">
          {isPlayingAudio ? (
            <Button size="sm" variant="destructive" onClick={handleStopAudio} className="gap-1 text-xs">
              <Volume2 className="h-3.5 w-3.5 animate-pulse" /> 재생 중지
            </Button>
          ) : (
            <Button size="sm" variant="outline" onClick={() => handleSpeak(passage.content)} className="gap-1 text-xs">
              <Volume2 className="h-3.5 w-3.5" /> 전체 듣기
            </Button>
          )}

          <Button size="sm" variant="outline" onClick={handleCopy} className="gap-1 text-xs">
            {isCopied ? <Check className="h-3.5 w-3.5 text-emerald-500" /> : <Copy className="h-3.5 w-3.5" />}
            {isCopied ? '복사됨' : '복사'}
          </Button>

          {onEdit && (
            <Button size="sm" variant="outline" onClick={onEdit} className="gap-1 text-xs">
              <Edit3 className="h-3.5 w-3.5" /> 수정
            </Button>
          )}

          {onDelete && (
            <Button size="sm" variant="ghost" onClick={onDelete} className="text-destructive hover:bg-destructive/10 h-8 px-2">
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          )}
        </div>
      </div>

      {/* 지문 기본 정보 배너 */}
      <div className="space-y-1.5 bg-card/90 backdrop-blur-xs p-4 rounded-xl border border-border">
        <div className="flex items-center gap-2">
          <Badge variant="secondary" className="text-xs">
            난이도 {passage.difficulty}단계
          </Badge>
          <span className="text-xs font-semibold text-primary bg-primary/10 px-2 py-0.5 rounded">
            {passage.source}
          </span>
          <span className="text-xs text-muted-foreground ml-auto">
            {wordCount}단어 · {sentenceList.length}문장 · {phrases.length}개 숙어
          </span>
        </div>
        <h2 className="text-xl font-bold text-foreground pt-1">{passage.title}</h2>
      </div>

      {/* 뷰 모드 전환 탭 */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center rounded-lg bg-muted p-1 text-xs font-semibold">
          <button
            type="button"
            onClick={() => setViewMode('full')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md transition-all ${
              viewMode === 'full'
                ? 'bg-background text-primary shadow-xs'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <FileText className="h-3.5 w-3.5" />
            단락 전체 읽기
          </button>
          <button
            type="button"
            onClick={() => setViewMode('sentences')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md transition-all ${
              viewMode === 'sentences'
                ? 'bg-background text-primary shadow-xs'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <Layers className="h-3.5 w-3.5" />
            문장별 끊어 읽기 ({sentenceList.length})
          </button>
        </div>
      </div>

      {/* 본문 콘텐츠 뷰 */}
      {viewMode === 'full' ? (
        <div className="space-y-4">
          {/* 영어 원문 본문 */}
          <Card className="bg-card/95 backdrop-blur-xs border-primary/20 shadow-xs">
            <CardContent className="p-5">
              <h4 className="text-xs font-bold text-primary mb-2 flex items-center gap-1">
                <BookOpen className="h-4 w-4" /> ENGLISH PASSAGE
              </h4>
              <p className="text-base sm:text-lg leading-relaxed text-foreground font-serif tracking-normal whitespace-pre-line">
                {passage.content}
              </p>
            </CardContent>
          </Card>

          {/* 한국어 해석 (있는 경우) */}
          {passage.translation && (
            <Card className="bg-muted/30 border-border">
              <CardContent className="p-4 space-y-1">
                <h4 className="text-xs font-bold text-muted-foreground flex items-center gap-1">
                  <Sparkles className="h-3.5 w-3.5 text-amber-500" /> 한글 해석
                </h4>
                <p className="text-sm leading-relaxed text-muted-foreground font-sans whitespace-pre-line">
                  {passage.translation}
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      ) : (
        /* 문장별 끊어 읽기 뷰 */
        <div className="space-y-2.5">
          {sentenceList.map((sentence, idx) => (
            <Card
              key={idx}
              className="bg-card/90 backdrop-blur-xs hover:border-primary/40 transition-colors"
            >
              <CardContent className="p-3.5 flex items-start gap-3">
                <span className="text-xs font-bold text-primary bg-primary/10 rounded-full h-6 w-6 flex items-center justify-center shrink-0 mt-0.5">
                  {idx + 1}
                </span>
                <div className="flex-1 space-y-1">
                  <p className="text-sm sm:text-base font-serif text-foreground leading-relaxed">
                    {sentence}
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-muted-foreground hover:text-primary shrink-0"
                  onClick={() => handleSpeak(sentence)}
                >
                  <Volume2 className="h-4 w-4" />
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* ────────────────────────────────────
          1. 지문 핵심 숙어 및 연어 (Phrases & Collocations) ✨
         ──────────────────────────────────── */}
      {phrases.length > 0 && (
        <Card className="bg-card/90 backdrop-blur-xs border-indigo-500/30 shadow-xs mt-6">
          <CardContent className="p-4 space-y-3">
            <div className="flex items-center justify-between flex-wrap gap-1">
              <h4 className="font-bold text-sm text-foreground flex items-center gap-1.5">
                <BookmarkPlus className="h-4 w-4 text-indigo-500" />
                지문 핵심 숙어 및 연어 ({phrases.length}개)
              </h4>
              <span className="text-[11px] text-muted-foreground">
                지문에서 자동 판독된 필수 숙어를 숙어장에 저장할 수 있습니다.
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
              {phrases.map((item) => {
                const isAdded = addedPhrases.has(item.phrase);

                return (
                  <div
                    key={item.phrase}
                    className="flex items-center justify-between p-2.5 rounded-lg border border-indigo-500/20 bg-indigo-50/40 dark:bg-indigo-950/20 text-xs"
                  >
                    <div className="space-y-0.5 min-w-0 pr-2">
                      <div className="flex items-center gap-1.5">
                        <span className="font-bold text-foreground">{item.phrase}</span>
                        {item.matchedText && item.matchedText.toLowerCase() !== item.phrase.toLowerCase() && (
                          <span className="text-[10px] text-indigo-600 dark:text-indigo-400 bg-indigo-100 dark:bg-indigo-900/50 px-1 rounded">
                            본문: {item.matchedText}
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-muted-foreground truncate">{item.meaning}</p>
                    </div>

                    <Button
                      size="sm"
                      variant={isAdded ? 'secondary' : 'default'}
                      className="h-6 px-2 text-[10px] shrink-0 gap-1 font-semibold"
                      disabled={isAdded}
                      onClick={() => handleAddPhrase(item.phrase, item.meaning)}
                    >
                      {isAdded ? (
                        <>
                          <Check className="h-3 w-3 text-emerald-500" />
                          등록됨
                        </>
                      ) : (
                        <>
                          <Plus className="h-3 w-3" />
                          숙어장 추가
                        </>
                      )}
                    </Button>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* ────────────────────────────────────
          2. 지문 핵심 어휘 (단어장에 추가 지원 - 무제한 전수 표시)
         ──────────────────────────────────── */}
      {vocabList.length > 0 && (
        <Card className="bg-card/90 backdrop-blur-xs border-border mt-4">
          <CardContent className="p-4 space-y-3">
            <div className="flex items-center justify-between flex-wrap gap-1">
              <h4 className="font-bold text-sm text-foreground flex items-center gap-1.5">
                <Sparkles className="h-4 w-4 text-amber-500" />
                지문 핵심 어휘 (총 {vocabList.length}개 전수 판독)
              </h4>
              <span className="text-[11px] text-muted-foreground">
                단어 유효성 및 원형 분석을 거친 전체 어휘 목록입니다.
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2">
              {vocabList.map((word) => {
                const dict = BUILTIN_DICTIONARY[word.toLowerCase()];
                const meaning = dict ? dict.meaning : '사전 매칭 준비 중';
                const isAdded = addedWords.has(word);

                return (
                  <div
                    key={word}
                    className="flex items-center justify-between p-2.5 rounded-lg border border-border bg-background/60 text-xs"
                  >
                    <div className="space-y-0.5 min-w-0 pr-2">
                      <div className="flex items-center gap-1">
                        <span className="font-bold text-foreground">{word}</span>
                        {dict?.pron && (
                          <span className="text-[10px] text-primary/80">{dict.pron}</span>
                        )}
                      </div>
                      <p className="text-[11px] text-muted-foreground truncate">{meaning}</p>
                    </div>

                    <Button
                      size="sm"
                      variant={isAdded ? 'secondary' : 'outline'}
                      className="h-6 px-2 text-[10px] shrink-0 gap-1 font-semibold"
                      disabled={isAdded}
                      onClick={() => handleAddWord(word, meaning)}
                    >
                      {isAdded ? (
                        <>
                          <Check className="h-3 w-3 text-emerald-500" />
                          등록됨
                        </>
                      ) : (
                        <>
                          <Plus className="h-3 w-3" />
                          단어장 추가
                        </>
                      )}
                    </Button>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
