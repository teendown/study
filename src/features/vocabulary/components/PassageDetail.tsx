'use client';

import { useState, useEffect, useMemo } from 'react';
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
  ExternalLink,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type { PassageItem } from '../types/passageTypes';
import { BUILTIN_DICTIONARY, lookupWordMeaning } from '@/lib/ocr/dictionary';
import { extractEnglishWords } from '@/lib/ocr/tokenizer';
import { extractEnglishPhrases, type ExtractedPhraseResult } from '@/lib/ocr/phraseDictionary';
import { searchWordOnline, getNaverDictUrl } from '@/features/vocabulary/services/dictionarySearch';
import { getStoredVocabs } from '@/features/vocabulary/services';
import { getStoredPhrases } from '@/features/vocabulary/services/phraseActions';
import { findSentenceInPassage } from '@/lib/ocr/textCleaner';

export interface PassageWordItem {
  word: string;
  meaning: string;
  exampleSentence?: string;
  exampleTranslation?: string;
}

export interface PassagePhraseItem {
  phrase: string;
  meaning: string;
  exampleSentence?: string;
  exampleTranslation?: string;
}

interface PassageDetailProps {
  passage: PassageItem;
  onBack: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
  onAddWordToVocab?: (word: string, meaning: string, exampleSentence?: string, exampleTranslation?: string) => void;
  onAddPhraseToVocab?: (phrase: string, meaning: string, exampleSentence?: string, exampleTranslation?: string) => void;
  onBatchAddWordsToVocab?: (items: PassageWordItem[]) => void;
  onBatchAddPhrasesToVocab?: (items: PassagePhraseItem[]) => void;
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

  // 이미 단어장 및 숙어장에 저장되어 있는 목록 Set (중복 표시 및 방지)
  const registeredWordSet = useMemo(() => {
    try {
      const stored = getStoredVocabs();
      return new Set(stored.map((v) => v.word.toLowerCase()));
    } catch {
      return new Set<string>();
    }
  }, [addedWords]);

  const registeredPhraseSet = useMemo(() => {
    try {
      const stored = getStoredPhrases();
      return new Set(stored.map((p) => p.phrase.toLowerCase()));
    } catch {
      return new Set<string>();
    }
  }, [addedPhrases]);

  // 추출된 숙어 목록 상태 (초기 자동 분석 + 수동 재분석 지원)
  const [extractedPhrases, setExtractedPhrases] = useState<ExtractedPhraseResult[]>([]);
  // 추출된 단어 목록 상태
  const [extractedWords, setExtractedWords] = useState<string[]>([]);
  // 사전에 없는 단어 실시간 인터넷 검색 캐시
  const [onlineMeaningMap, setOnlineMeaningMap] = useState<Record<string, { meaning: string; pron?: string }>>({});

  // 1. 처음에 지문 들어갈 때 자동 분석 실행 (본문에서 검색되는 모든 숙어/단어 전수 추출)
  useEffect(() => {
    const freshPhrases = extractEnglishPhrases(passage.content);
    const existing = passage.phraseList || [];
    const map = new Map<string, ExtractedPhraseResult>();

    // 기존에 저장되어 있던 숙어 추가
    existing.forEach((p) => {
      const ex = findSentenceInPassage(passage.content, passage.sentences, p.phrase);
      map.set(p.phrase.toLowerCase(), {
        id: `phrase-${p.phrase}`,
        phrase: p.phrase,
        matchedText: p.matchedText || p.phrase,
        meaning: p.meaning,
        difficulty: p.difficulty || 2,
        selected: true,
        exampleSentence: ex || '',
      });
    });

    // 400+개 정밀 사전에서 검출된 모든 숙어 전수 추가
    freshPhrases.forEach((p) => {
      map.set(p.phrase.toLowerCase(), p);
    });

    setExtractedPhrases(Array.from(map.values()));

    // 단어도 본문 내 모든 어휘 추출
    const wList = extractEnglishWords(passage.content).map((w) => w.word);
    setExtractedWords(wList);
  }, [passage.id, passage.content, passage.vocabularyList, passage.phraseList, passage.sentences]);

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

  // 3. 수동 재분석 버튼 클릭 핸들러 (모든 숙어 전수 재검출)
  const handleManualReanalyze = () => {
    setIsReanalyzing(true);
    setReanalyzeMessage(null);

    setTimeout(() => {
      const pList = extractEnglishPhrases(passage.content);
      const wList = extractEnglishWords(passage.content).map((w) => w.word);

      setExtractedPhrases(pList);
      setExtractedWords(wList);
      setIsReanalyzing(false);
      setReanalyzeMessage(`전수 재분석 완료! (검색된 모든 숙어 ${pList.length}개, 단어 ${wList.length}개 검출)`);
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
    const exSentence = findSentenceInPassage(passage.content, passage.sentences, word);
    onAddWordToVocab?.(word, meaning, exSentence || undefined);
    setAddedWords((prev) => new Set(prev).add(word));
  };

  const handleAddPhrase = (phrase: string, meaning: string) => {
    const exSentence = findSentenceInPassage(passage.content, passage.sentences, phrase);
    onAddPhraseToVocab?.(phrase, meaning, exSentence || undefined);
    setAddedPhrases((prev) => new Set(prev).add(phrase));
  };

  // 숙어 전체 일괄 추가 (중복 등록 방지 필터링 + 본문 실제 문장 예문 자동 포함)
  const handleBatchAddPhrases = () => {
    const unadded = extractedPhrases.filter(
      (p) => !registeredPhraseSet.has(p.phrase.toLowerCase()) && !addedPhrases.has(p.phrase)
    );

    if (unadded.length === 0) {
      alert(`지문 내 검출된 모든 숙어(${extractedPhrases.length}개)가 이미 숙어장에 등록되어 있습니다! 🔖`);
      return;
    }

    const items: PassagePhraseItem[] = unadded.map((p) => {
      const exSentence = p.exampleSentence || findSentenceInPassage(passage.content, passage.sentences, p.phrase);
      return {
        phrase: p.phrase,
        meaning: p.meaning,
        exampleSentence: exSentence || undefined,
      };
    });

    if (onBatchAddPhrasesToVocab) {
      onBatchAddPhrasesToVocab(items);
    } else {
      items.forEach((p) => onAddPhraseToVocab?.(p.phrase, p.meaning, p.exampleSentence));
    }

    setAddedPhrases((prev) => {
      const next = new Set(prev);
      unadded.forEach((p) => next.add(p.phrase));
      return next;
    });
  };

  // 단어 전체 일괄 추가 (중복 등록 방지 필터링 + 본문 실제 문장 예문 자동 포함)
  const handleBatchAddWords = () => {
    const unadded = extractedWords.filter(
      (w) => !registeredWordSet.has(w.toLowerCase()) && !addedWords.has(w)
    );

    if (unadded.length === 0) {
      alert(`지문 내 검출된 모든 단어(${extractedWords.length}개)가 이미 단어장에 등록되어 있습니다! 📚`);
      return;
    }

    const items: PassageWordItem[] = unadded.map((w) => {
      const dict = lookupWordMeaning(w) || BUILTIN_DICTIONARY[w.toLowerCase()];
      const online = onlineMeaningMap[w];
      const exSentence = findSentenceInPassage(passage.content, passage.sentences, w);
      return {
        word: w,
        meaning: dict?.meaning || online?.meaning || '사전 등록 필요',
        exampleSentence: exSentence || undefined,
      };
    });

    if (onBatchAddWordsToVocab) {
      onBatchAddWordsToVocab(items);
    } else {
      items.forEach((item) => onAddWordToVocab?.(item.word, item.meaning, item.exampleSentence));
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
                본문 문맥을 정밀 분석하여 검출된 필수 관용구 및 연어입니다. (이미 등록된 숙어는 중복 저장되지 않습니다)
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
                const isRegistered = registeredPhraseSet.has(item.phrase.toLowerCase()) || addedPhrases.has(item.phrase);

                return (
                  <div
                    key={item.phrase}
                    className="flex items-center justify-between p-2.5 rounded-lg border border-indigo-500/20 bg-indigo-50/40 dark:bg-indigo-950/20 text-xs"
                  >
                    <div className="space-y-0.5 min-w-0 pr-2">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="font-bold text-foreground">{item.phrase}</span>
                        <a
                          href={getNaverDictUrl(item.phrase)}
                          target="_blank"
                          rel="noopener noreferrer"
                          title="네이버 영어사전 검색"
                          className="text-muted-foreground hover:text-emerald-600 dark:hover:text-emerald-400 inline-flex items-center"
                        >
                          <ExternalLink className="h-3 w-3" />
                        </a>
                        {isRegistered && (
                          <Badge variant="outline" className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30 text-[9px] px-1 py-0 h-4">
                            <Check className="h-2.5 w-2.5 mr-0.5" /> 이미 등록됨
                          </Badge>
                        )}
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
                      variant={isRegistered ? 'secondary' : 'default'}
                      className="h-6 px-2 text-[10px] shrink-0 gap-1 font-semibold"
                      disabled={isRegistered}
                      onClick={() => handleAddPhrase(item.phrase, item.meaning)}
                    >
                      {isRegistered ? (
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
                  사전 및 실시간 인터넷 검색을 거친 표준 영한 어휘 목록입니다. (이미 등록된 단어는 중복 저장되지 않습니다)
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
                const isRegistered = registeredWordSet.has(word.toLowerCase()) || addedWords.has(word);

                return (
                  <div
                    key={word}
                    className="flex items-center justify-between p-2.5 rounded-lg border border-border bg-background/60 text-xs"
                  >
                    <div className="space-y-0.5 min-w-0 pr-2">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="font-bold text-foreground">{word}</span>
                        <a
                          href={getNaverDictUrl(word)}
                          target="_blank"
                          rel="noopener noreferrer"
                          title="네이버 영어사전 검색"
                          className="text-muted-foreground hover:text-emerald-600 dark:hover:text-emerald-400 inline-flex items-center"
                        >
                          <ExternalLink className="h-3 w-3" />
                        </a>
                        {isRegistered && (
                          <Badge variant="outline" className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30 text-[9px] px-1 py-0 h-4">
                            <Check className="h-2.5 w-2.5 mr-0.5" /> 이미 등록됨
                          </Badge>
                        )}
                        {pron && (
                          <span className="text-[10px] text-primary/80">{pron}</span>
                        )}
                      </div>
                      <p className="text-[11px] text-muted-foreground truncate">{meaning}</p>
                    </div>

                    <Button
                      size="sm"
                      variant={isRegistered ? 'secondary' : 'outline'}
                      className="h-6 px-2 text-[10px] shrink-0 gap-1 font-semibold"
                      disabled={isRegistered}
                      onClick={() => handleAddWord(word, meaning)}
                    >
                      {isRegistered ? (
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
