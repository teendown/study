'use client';

import { useState, useEffect } from 'react';
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
  RefreshCw,
  CheckCheck,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type { PassageItem } from '../types/passageTypes';
import { BUILTIN_DICTIONARY, lookupWordMeaning } from '@/lib/ocr/dictionary';
import { extractEnglishWords } from '@/lib/ocr/tokenizer';
import { extractEnglishPhrases, type ExtractedPhraseResult } from '@/lib/ocr/phraseDictionary';
import { searchWordOnline } from '@/features/vocabulary/services/dictionarySearch';

interface PassageDetailProps {
  passage: PassageItem;
  onBack: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
  onAddWordToVocab?: (word: string, meaning: string) => void;
  onAddPhraseToVocab?: (phrase: string, meaning: string) => void;
  onBatchAddWordsToVocab?: (items: Array<{ word: string; meaning: string }>) => void;
  onBatchAddPhrasesToVocab?: (items: Array<{ phrase: string; meaning: string }>) => void;
}

export function PassageDetail({
  passage,
  onBack,
  onEdit,
  onDelete,
  onAddWordToVocab,
  onAddPhraseToVocab,
  onBatchAddWordsToVocab,
  onBatchAddPhrasesToVocab,
}: PassageDetailProps) {
  const [viewMode, setViewMode] = useState<'full' | 'sentences'>('full');
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  const [addedWords, setAddedWords] = useState<Set<string>>(new Set());
  const [addedPhrases, setAddedPhrases] = useState<Set<string>>(new Set());
  const [isReanalyzing, setIsReanalyzing] = useState(false);
  const [reanalyzeMessage, setReanalyzeMessage] = useState<string | null>(null);

  // 추출된 숙어 목록 상태 (초기 자동 분석 + 수동 재분석 지원)
  const [extractedPhrases, setExtractedPhrases] = useState<ExtractedPhraseResult[]>([]);
  // 추출된 단어 목록 상태
  const [extractedWords, setExtractedWords] = useState<string[]>([]);
  // 사전에 없는 단어 실시간 인터넷 검색 캐시
  const [onlineMeaningMap, setOnlineMeaningMap] = useState<Record<string, { meaning: string; pron?: string }>>({});

  // 1. 처음에 지문 들어갈 때 자동 분석 실행
  useEffect(() => {
    const pList = extractEnglishPhrases(passage.content);
    setExtractedPhrases(pList);

    const wList = passage.vocabularyList && passage.vocabularyList.length > 0
      ? passage.vocabularyList
      : extractEnglishWords(passage.content).map((w) => w.word);
    setExtractedWords(wList);
  }, [passage.id, passage.content, passage.vocabularyList]);

  // 2. 사전에 없는 단어 백그라운드 인터넷 자동 검색
  useEffect(() => {
    const fetchMissingOnline = async () => {
      const missingWords = extractedWords.filter((w) => {
        const dict = lookupWordMeaning(w) || BUILTIN_DICTIONARY[w.toLowerCase()];
        return !dict && !onlineMeaningMap[w];
      });

      if (missingWords.length === 0) return;

      const BATCH = 5;
      for (let i = 0; i < missingWords.length; i += BATCH) {
        const batch = missingWords.slice(i, i + BATCH);
        await Promise.all(
          batch.map(async (word) => {
            try {
              const res = await searchWordOnline(word);
              if (res && res.meaning && res.meaning !== '사전 등록 필요') {
                setOnlineMeaningMap((prev) => ({
                  ...prev,
                  [word]: { meaning: res.meaning, pron: res.pronunciation },
                }));
              }
            } catch {}
          })
        );
      }
    };

    fetchMissingOnline();
  }, [extractedWords, onlineMeaningMap]);

  // 3. 수동 재분석 버튼 클릭 핸들러
  const handleManualReanalyze = () => {
    setIsReanalyzing(true);
    setReanalyzeMessage(null);

    setTimeout(() => {
      const pList = extractEnglishPhrases(passage.content);
      const wList = extractEnglishWords(passage.content).map((w) => w.word);

      setExtractedPhrases(pList);
      setExtractedWords(wList);
      setIsReanalyzing(false);
      setReanalyzeMessage(`정밀 재분석 완료! (숙어 ${pList.length}개, 단어 ${wList.length}개 검출)`);
      setTimeout(() => setReanalyzeMessage(null), 3000);
    }, 400);
  };

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

  // 숙어 전체 일괄 추가
  const handleBatchAddPhrases = () => {
    const unadded = extractedPhrases.filter((p) => !addedPhrases.has(p.phrase));
    if (unadded.length === 0) return;

    if (onBatchAddPhrasesToVocab) {
      onBatchAddPhrasesToVocab(unadded.map((p) => ({ phrase: p.phrase, meaning: p.meaning })));
    } else {
      unadded.forEach((p) => onAddPhraseToVocab?.(p.phrase, p.meaning));
    }
    setAddedPhrases((prev) => {
      const next = new Set(prev);
      unadded.forEach((p) => next.add(p.phrase));
      return next;
    });
  };

  // 단어 전체 일괄 추가
  const handleBatchAddWords = () => {
    const unadded = extractedWords.filter((w) => !addedWords.has(w));
    if (unadded.length === 0) return;

    const items = unadded.map((w) => {
      const dict = lookupWordMeaning(w) || BUILTIN_DICTIONARY[w.toLowerCase()];
      const online = onlineMeaningMap[w];
      return {
        word: w,
        meaning: dict?.meaning || online?.meaning || '사전 등록 필요',
      };
    });

    if (onBatchAddWordsToVocab) {
      onBatchAddWordsToVocab(items);
    } else {
      items.forEach((item) => onAddWordToVocab?.(item.word, item.meaning));
    }
    setAddedWords((prev) => {
      const next = new Set(prev);
      unadded.forEach((w) => next.add(w));
      return next;
    });
  };

  const wordCount = passage.content.trim().split(/\s+/).filter(Boolean).length;
  const sentenceList = passage.sentences || [];

  return (
    <div className="space-y-4 animate-in fade-in duration-200">
      {/* 상단 헤더 및 네비게이션 */}
      <div className="flex items-center justify-between gap-2 border-b border-border pb-3 flex-wrap">
        <Button variant="ghost" size="sm" onClick={onBack} className="gap-1.5 font-bold">
          <ArrowLeft className="h-4 w-4" /> 지문 목록으로
        </Button>

        <div className="flex items-center gap-1.5 flex-wrap">
          {/* 수동 재분석 버튼 */}
          <Button
            size="sm"
            variant="outline"
            onClick={handleManualReanalyze}
            disabled={isReanalyzing}
            className="gap-1 text-xs border-indigo-500/40 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/40"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isReanalyzing ? 'animate-spin' : ''}`} />
            숙어/단어 다시 분석
          </Button>

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

      {/* 재분석 완료 알림 토스트 메시지 */}
      {reanalyzeMessage && (
        <div className="p-2.5 rounded-lg bg-indigo-500/10 border border-indigo-500/30 text-indigo-600 dark:text-indigo-400 text-xs font-semibold flex items-center gap-1.5 animate-in slide-in-from-top-1">
          <Sparkles className="h-4 w-4 text-amber-500" />
          {reanalyzeMessage}
        </div>
      )}

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
            {wordCount}단어 · {sentenceList.length}문장 · <strong className="text-indigo-600 dark:text-indigo-400">{extractedPhrases.length}</strong>개 숙어 판독
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
      <Card className="bg-card/90 backdrop-blur-xs border-indigo-500/30 shadow-xs mt-6">
        <CardContent className="p-4 space-y-3">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div className="space-y-0.5">
              <h4 className="font-bold text-sm text-foreground flex items-center gap-1.5">
                <BookmarkPlus className="h-4 w-4 text-indigo-500" />
                지문 핵심 숙어 및 연어 ({extractedPhrases.length}개 자동 판독)
              </h4>
              <p className="text-[11px] text-muted-foreground">
                본문 문맥을 정밀 분석하여 검출된 필수 관용구 및 연어입니다.
              </p>
            </div>

            {extractedPhrases.length > 0 && (
              <Button
                size="sm"
                variant="outline"
                onClick={handleBatchAddPhrases}
                className="h-7 text-xs gap-1 font-bold border-indigo-500/40 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/30"
              >
                <CheckCheck className="h-3.5 w-3.5" />
                숙어 전체 추가 ({extractedPhrases.length}개)
              </Button>
            )}
          </div>

          {extractedPhrases.length === 0 ? (
            <div className="py-4 text-center text-xs text-muted-foreground bg-muted/20 rounded-lg border border-dashed border-border">
              판독된 숙어가 없습니다. 상단의 <strong>[숙어/단어 다시 분석]</strong> 버튼을 눌러보세요.
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
              {extractedPhrases.map((item) => {
                const isAdded = addedPhrases.has(item.phrase);

                return (
                  <div
                    key={item.phrase}
                    className="flex items-center justify-between p-2.5 rounded-lg border border-indigo-500/20 bg-indigo-50/40 dark:bg-indigo-950/20 text-xs"
                  >
                    <div className="space-y-0.5 min-w-0 pr-2">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="font-bold text-foreground">{item.phrase}</span>
                        {item.matchedText && item.matchedText.toLowerCase() !== item.phrase.toLowerCase() && (
                          <span className="text-[10px] text-indigo-600 dark:text-indigo-400 bg-indigo-100 dark:bg-indigo-900/50 px-1 rounded font-mono">
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
          )}
        </CardContent>
      </Card>

      {/* ────────────────────────────────────
          2. 지문 핵심 어휘 (단어장에 추가 지원 - 무제한 전수 표시)
         ──────────────────────────────────── */}
      {extractedWords.length > 0 && (
        <Card className="bg-card/90 backdrop-blur-xs border-border mt-4">
          <CardContent className="p-4 space-y-3">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div className="space-y-0.5">
                <h4 className="font-bold text-sm text-foreground flex items-center gap-1.5">
                  <Sparkles className="h-4 w-4 text-amber-500" />
                  지문 핵심 어휘 (총 {extractedWords.length}개 전수 판독)
                </h4>
                <p className="text-[11px] text-muted-foreground">
                  사전 및 실시간 인터넷 검색을 거친 표준 영한 어휘 목록입니다.
                </p>
              </div>

              <Button
                size="sm"
                variant="outline"
                onClick={handleBatchAddWords}
                className="h-7 text-xs gap-1 font-bold"
              >
                <CheckCheck className="h-3.5 w-3.5" />
                단어 전체 추가 ({extractedWords.length}개)
              </Button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2">
              {extractedWords.map((word) => {
                const dict = lookupWordMeaning(word) || BUILTIN_DICTIONARY[word.toLowerCase()];
                const online = onlineMeaningMap[word];
                const meaning = dict ? dict.meaning : (online?.meaning || '사전 검색 중...');
                const pron = dict?.pron || online?.pron;
                const isAdded = addedWords.has(word);

                return (
                  <div
                    key={word}
                    className="flex items-center justify-between p-2.5 rounded-lg border border-border bg-background/60 text-xs"
                  >
                    <div className="space-y-0.5 min-w-0 pr-2">
                      <div className="flex items-center gap-1">
                        <span className="font-bold text-foreground">{word}</span>
                        {pron && (
                          <span className="text-[10px] text-primary/80">{pron}</span>
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
