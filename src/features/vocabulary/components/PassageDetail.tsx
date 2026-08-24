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
  PenTool,
  Eye,
  EyeOff,
  Target,
  GraduationCap,
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
import { TabletPenCanvas } from './TabletPenCanvas';
import { PenSelectionPopover } from './PenSelectionPopover';
import { PassageStudyDialog } from './PassageStudyDialog';

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
  const [viewMode, setViewMode] = useState<'full' | 'sentences'>('sentences');
  const [showTranslations, setShowTranslations] = useState(true);
  const [isPenMode, setIsPenMode] = useState(false);
  const [isStudyDialogOpen, setIsStudyDialogOpen] = useState(false);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  const [addedWords, setAddedWords] = useState<Set<string>>(new Set());
  const [addedPhrases, setAddedPhrases] = useState<Set<string>>(new Set());
  const [isReanalyzing, setIsReanalyzing] = useState(false);
  const [reanalyzeMessage, setReanalyzeMessage] = useState<string | null>(null);

  // 펜슬 선택 팝업 상태
  const [selectionPopover, setSelectionPopover] = useState<{
    text: string;
    x: number;
    y: number;
  } | null>(null);

  // 손글씨 캔버스 데이터 저장 (로컬 캐시)
  const [handwritingMap, setHandwritingMap] = useState<Record<number, string>>(() => {
    if (typeof window === 'undefined') return {};
    try {
      const saved = localStorage.getItem(`passage_pen_${passage.id}`);
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

  const handleHandwritingChange = (sentenceIdx: number, dataUrl: string) => {
    setHandwritingMap((prev) => {
      const next = { ...prev, [sentenceIdx]: dataUrl };
      try {
        localStorage.setItem(`passage_pen_${passage.id}`, JSON.stringify(next));
      } catch {}
      return next;
    });
  };

  // 텍스트 선택 감지 핸들러 (아이패드/태블릿 펜슬 터치 드래그 지원)
  const handleTextSelection = () => {
    const selection = window.getSelection();
    if (!selection || selection.isCollapsed) {
      return;
    }
    const text = selection.toString().trim();
    if (text.length >= 2 && text.length <= 50) {
      try {
        const range = selection.getRangeAt(0);
        const rect = range.getBoundingClientRect();
        setSelectionPopover({
          text,
          x: rect.left + rect.width / 2,
          y: rect.top,
        });
      } catch {}
    }
  };

  // 이미 단어장 및 숙어장에 저장되어 있는 목록 Set
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

  const [extractedPhrases, setExtractedPhrases] = useState<ExtractedPhraseResult[]>([]);
  const [extractedWords, setExtractedWords] = useState<string[]>([]);
  const [onlineMeaningMap, setOnlineMeaningMap] = useState<Record<string, { meaning: string; pron?: string }>>({});

  useEffect(() => {
    const freshPhrases = extractEnglishPhrases(passage.content);
    const existing = passage.phraseList || [];
    const map = new Map<string, ExtractedPhraseResult>();

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

    freshPhrases.forEach((p) => {
      map.set(p.phrase.toLowerCase(), p);
    });

    setExtractedPhrases(Array.from(map.values()));
    const wList = extractEnglishWords(passage.content).map((w) => w.word);
    setExtractedWords(wList);
  }, [passage.id, passage.content, passage.vocabularyList, passage.phraseList, passage.sentences]);

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

  const handleSpeak = (text: string) => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const u = new SpeechSynthesisUtterance(text);
      u.lang = 'en-US';
      u.rate = 0.9;
      u.onstart = () => setIsPlayingAudio(true);
      u.onend = () => setIsPlayingAudio(false);
      u.onerror = () => setIsPlayingAudio(false);
      window.speechSynthesis.speak(u);
    }
  };

  const handleStopAudio = () => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      setIsPlayingAudio(false);
    }
  };

  const handleCopy = () => {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(passage.content);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    }
  };

  const handleAddSingleWord = (word: string, meaning: string, exampleSentence?: string, exampleTranslation?: string) => {
    if (onAddWordToVocab) {
      onAddWordToVocab(word, meaning, exampleSentence, exampleTranslation);
      setAddedWords((prev) => new Set([...prev, word.toLowerCase()]));
    }
  };

  const handleAddSinglePhrase = (phrase: string, meaning: string, exampleSentence?: string, exampleTranslation?: string) => {
    if (onAddPhraseToVocab) {
      onAddPhraseToVocab(phrase, meaning, exampleSentence, exampleTranslation);
      setAddedPhrases((prev) => new Set([...prev, phrase.toLowerCase()]));
    }
  };

  const handleBatchAddPhrases = () => {
    if (onBatchAddPhrasesToVocab && extractedPhrases.length > 0) {
      const items: PassagePhraseItem[] = extractedPhrases.map((p) => ({
        phrase: p.phrase,
        meaning: p.meaning,
        exampleSentence: p.exampleSentence,
        exampleTranslation: p.exampleTranslation,
      }));
      onBatchAddPhrasesToVocab(items);
      const newSet = new Set(addedPhrases);
      extractedPhrases.forEach((p) => newSet.add(p.phrase.toLowerCase()));
      setAddedPhrases(newSet);
    }
  };

  const handleBatchAddWords = () => {
    if (onBatchAddWordsToVocab && extractedWords.length > 0) {
      const items: PassageWordItem[] = extractedWords.map((w) => {
        const dict = lookupWordMeaning(w) || BUILTIN_DICTIONARY[w.toLowerCase()];
        const online = onlineMeaningMap[w];
        const meaning = dict?.meaning || online?.meaning || '의미 검색 필요';
        const ex = dict?.ex || findSentenceInPassage(passage.content, passage.sentences, w) || '';
        const exTrans = dict?.exTrans || '';
        return {
          word: w,
          meaning,
          exampleSentence: ex,
          exampleTranslation: exTrans,
        };
      });
      onBatchAddWordsToVocab(items);
      const newSet = new Set(addedWords);
      extractedWords.forEach((w) => newSet.add(w.toLowerCase()));
      setAddedWords(newSet);
    }
  };

  const sentenceList = passage.sentences && passage.sentences.length > 0
    ? passage.sentences
    : [passage.content];

  const wordCount = useMemo(() => {
    return passage.content.trim().split(/\s+/).filter(Boolean).length;
  }, [passage.content]);

  return (
    <div
      className="space-y-6 pb-20 max-w-4xl mx-auto"
      onMouseUp={handleTextSelection}
      onTouchEnd={handleTextSelection}
    >
      {/* 펜/터치 선택 팝업 */}
      {selectionPopover && (
        <PenSelectionPopover
          selectedText={selectionPopover.text}
          position={{ x: selectionPopover.x, y: selectionPopover.y }}
          onClose={() => setSelectionPopover(null)}
          onAddWord={(w, m, ex, exT) => {
            handleAddSingleWord(w, m, ex, exT);
            setSelectionPopover(null);
          }}
          isAlreadyAdded={registeredWordSet.has(selectionPopover.text.toLowerCase())}
        />
      )}

      {/* 문장 번역 학습 다이얼로그 */}
      {isStudyDialogOpen && (
        <PassageStudyDialog
          open={isStudyDialogOpen}
          onOpenChange={setIsStudyDialogOpen}
          passage={passage}
        />
      )}

      {/* 상단 네비게이션 & 액션 툴바 */}
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <Button variant="ghost" size="sm" onClick={onBack} className="gap-1 text-xs">
          <ArrowLeft className="h-4 w-4" /> 지문 목록으로
        </Button>

        <div className="flex items-center gap-1.5 flex-wrap">
          <Button
            size="sm"
            onClick={() => setIsStudyDialogOpen(true)}
            className="gap-1.5 text-xs font-bold bg-primary hover:bg-primary/90 text-white shadow-sm"
          >
            <Target className="h-4 w-4" />
            문장 번역 학습 시작
          </Button>

          <Button
            size="sm"
            variant={isPenMode ? 'default' : 'outline'}
            onClick={() => setIsPenMode(!isPenMode)}
            className={`gap-1 text-xs ${
              isPenMode ? 'bg-amber-600 hover:bg-amber-700 text-white border-amber-600' : 'border-amber-500/40 text-amber-600 dark:text-amber-400'
            }`}
            title="애플펜슬로 문장 해석 직접 필기"
          >
            <PenTool className="h-3.5 w-3.5" />
            {isPenMode ? '펜 필기 켜짐' : '펜 필기 모드'}
          </Button>

          <Button
            size="sm"
            variant="outline"
            onClick={handleManualReanalyze}
            disabled={isReanalyzing}
            className="gap-1 text-xs border-indigo-500/40 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/40"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isReanalyzing ? 'animate-spin' : ''}`} />
            숙어/단어 재분석
          </Button>

          {isPlayingAudio ? (
            <Button size="sm" variant="destructive" onClick={handleStopAudio} className="gap-1 text-xs">
              <Volume2 className="h-3.5 w-3.5 animate-pulse" /> 중지
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

      {reanalyzeMessage && (
        <div className="p-2.5 rounded-lg bg-indigo-500/10 border border-indigo-500/30 text-indigo-600 dark:text-indigo-400 text-xs font-semibold animate-in slide-in-from-top-1">
          {reanalyzeMessage}
        </div>
      )}

      {/* 지문 기본 정보 배너 */}
      <div className="space-y-1.5 bg-card/90 backdrop-blur-xs p-4 rounded-xl border border-border shadow-xs">
        <div className="flex items-center gap-2 flex-wrap">
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

      {/* 뷰 모드 전환 및 번역 토글 바 */}
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div className="flex items-center rounded-lg bg-muted p-1 text-xs font-semibold">
          <button
            type="button"
            onClick={() => setViewMode('sentences')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md transition-all ${
              viewMode === 'sentences'
                ? 'bg-background text-primary shadow-xs font-bold'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <Layers className="h-3.5 w-3.5" />
            문장별 끊어 읽기 & 번역 ({sentenceList.length})
          </button>
          <button
            type="button"
            onClick={() => setViewMode('full')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md transition-all ${
              viewMode === 'full'
                ? 'bg-background text-primary shadow-xs font-bold'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <FileText className="h-3.5 w-3.5" />
            단락 전체 읽기
          </button>
        </div>

        {viewMode === 'sentences' && (
          <Button
            type="button"
            size="sm"
            variant="ghost"
            onClick={() => setShowTranslations(!showTranslations)}
            className="h-8 text-xs gap-1.5 text-muted-foreground hover:text-foreground font-semibold"
          >
            {showTranslations ? (
              <>
                <EyeOff className="h-3.5 w-3.5 text-primary" />
                번역 가리기
              </>
            ) : (
              <>
                <Eye className="h-3.5 w-3.5 text-primary" />
                번역 보기
              </>
            )}
          </Button>
        )}
      </div>

      {/* 본문 콘텐츠 뷰 */}
      {viewMode === 'full' ? (
        <div className="space-y-4">
          <Card className="bg-card/95 backdrop-blur-xs border-primary/20 shadow-xs">
            <CardContent className="p-5">
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-xs font-bold text-primary flex items-center gap-1">
                  <BookOpen className="h-4 w-4" /> ENGLISH PASSAGE
                </h4>
                <span className="text-[11px] text-muted-foreground">
                  💡 단어나 숙어를 펜/마우스로 드래그하면 즉시 단어장에 추가할 수 있습니다.
                </span>
              </div>
              <p className="text-base sm:text-lg leading-relaxed text-foreground font-serif tracking-normal whitespace-pre-line select-text">
                {passage.content}
              </p>
            </CardContent>
          </Card>

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
        <div className="space-y-3.5">
          {sentenceList.map((sentence, idx) => {
            const sentenceTrans = passage.sentenceTranslations?.[idx];
            const hasHandwriting = Boolean(handwritingMap[idx]);

            return (
              <Card
                key={idx}
                className="bg-card/95 backdrop-blur-xs border-border hover:border-primary/40 transition-all shadow-xs overflow-hidden"
              >
                <CardContent className="p-4 space-y-2.5">
                  <div className="flex items-start gap-3">
                    <span className="text-xs font-bold text-primary bg-primary/10 rounded-full h-6 w-6 flex items-center justify-center shrink-0 mt-0.5">
                      {idx + 1}
                    </span>
                    <div className="flex-1 space-y-1">
                      <p className="text-base sm:text-lg font-serif text-foreground leading-relaxed select-text">
                        {sentence}
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-muted-foreground hover:text-primary shrink-0"
                      onClick={() => handleSpeak(sentence)}
                      title="원어민 발음 듣기"
                    >
                      <Volume2 className="h-4 w-4" />
                    </Button>
                  </div>

                  {showTranslations && (
                    <div className="ml-9 p-2.5 rounded-lg bg-muted/40 border border-border/70 text-xs sm:text-sm text-muted-foreground leading-relaxed animate-in fade-in flex items-start gap-2">
                      <span className="font-semibold text-primary/80 shrink-0 select-none">해석:</span>
                      <span className="flex-1 text-foreground/90">
                        {sentenceTrans || (idx === 0 && passage.translation ? passage.translation : '한국어 번역이 준비 중입니다.')}
                      </span>
                    </div>
                  )}

                  {(isPenMode || hasHandwriting) && (
                    <div className="ml-9 pt-1 animate-in fade-in">
                      <div className="text-[11px] font-semibold text-amber-600 dark:text-amber-400 flex items-center gap-1 mb-1">
                        <PenTool className="h-3 w-3" />
                        손글씨 해석 및 펜 노트 ({idx + 1}번 문장)
                      </div>
                      <TabletPenCanvas
                        id={`sentence-canvas-${passage.id}-${idx}`}
                        initialDataUrl={handwritingMap[idx]}
                        onChange={(dataUrl) => handleHandwritingChange(idx, dataUrl)}
                        height={100}
                        placeholderText="애플펜슬로 문장 해석이나 끊어읽기 밑줄을 적어보세요..."
                      />
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <Card className="bg-card/90 backdrop-blur-xs border-indigo-500/30 shadow-xs mt-6">
        <CardContent className="p-4 space-y-3">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div className="space-y-0.5">
              <h4 className="font-bold text-sm text-foreground flex items-center gap-1.5">
                <BookmarkPlus className="h-4 w-4 text-indigo-500" />
                지문 핵심 숙어 및 연어 ({extractedPhrases.length}개 자동 판독)
              </h4>
            </div>

            {extractedPhrases.length > 0 && (
              <Button
                size="sm"
                variant="outline"
                onClick={handleBatchAddPhrases}
                className="h-7 text-xs gap-1 font-bold border-indigo-500/40 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50"
              >
                <CheckCheck className="h-3.5 w-3.5" />
                숙어 전체 추가 ({extractedPhrases.length}개)
              </Button>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
            {extractedPhrases.map((item, idx) => {
              const isSaved = registeredPhraseSet.has(item.phrase.toLowerCase()) || addedPhrases.has(item.phrase.toLowerCase());
              return (
                <div
                  key={idx}
                  className="flex items-center justify-between p-2.5 rounded-lg border border-border/80 bg-background/80 hover:border-indigo-500/40 transition-colors gap-2"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5">
                      <span className="font-bold text-xs text-indigo-600 dark:text-indigo-400 truncate">
                        {item.phrase}
                      </span>
                      <Button
                        type="button"
                        size="icon"
                        variant="ghost"
                        className="h-4 w-4 text-muted-foreground hover:text-indigo-500 shrink-0"
                        onClick={() => handleSpeak(item.phrase)}
                      >
                        <Volume2 className="h-3 w-3" />
                      </Button>
                    </div>
                    <p className="text-[11px] text-muted-foreground truncate">{item.meaning}</p>
                  </div>

                  <Button
                    size="icon"
                    variant={isSaved ? 'secondary' : 'ghost'}
                    disabled={isSaved}
                    onClick={() => handleAddSinglePhrase(item.phrase, item.meaning, item.exampleSentence, item.exampleTranslation)}
                    className="h-7 w-7 shrink-0"
                  >
                    {isSaved ? (
                      <Check className="h-3.5 w-3.5 text-emerald-500" />
                    ) : (
                      <Plus className="h-3.5 w-3.5 text-indigo-500" />
                    )}
                  </Button>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      <Card className="bg-card/90 backdrop-blur-xs border-primary/20 shadow-xs">
        <CardContent className="p-4 space-y-3">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div className="space-y-0.5">
              <h4 className="font-bold text-sm text-foreground flex items-center gap-1.5">
                <BookOpen className="h-4 w-4 text-primary" />
                지문 어휘 목록 ({extractedWords.length}개 추출)
              </h4>
              <p className="text-[11px] text-muted-foreground">
                지문 속 모든 영어 단어의 뜻과 발음을 확인할 수 있습니다.
              </p>
            </div>

            {extractedWords.length > 0 && (
              <Button
                size="sm"
                variant="outline"
                onClick={handleBatchAddWords}
                className="h-7 text-xs gap-1 font-bold border-primary/40 text-primary hover:bg-primary/10"
              >
                <CheckCheck className="h-3.5 w-3.5" />
                단어 전체 추가 ({extractedWords.length}개)
              </Button>
            )}
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
            {extractedWords.map((word, idx) => {
              const dict = lookupWordMeaning(word) || BUILTIN_DICTIONARY[word.toLowerCase()];
              const online = onlineMeaningMap[word];
              const meaning = dict?.meaning || online?.meaning || '의미 검색 중...';
              const isSaved = registeredWordSet.has(word.toLowerCase()) || addedWords.has(word.toLowerCase());

              return (
                <div
                  key={idx}
                  className="flex items-center justify-between p-2 rounded-lg border border-border/80 bg-background/80 hover:border-primary/40 transition-colors gap-1.5"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1">
                      <span className="font-bold text-xs text-foreground truncate">{word}</span>
                      <Button
                        type="button"
                        size="icon"
                        variant="ghost"
                        className="h-4 w-4 text-muted-foreground hover:text-primary shrink-0"
                        onClick={() => handleSpeak(word)}
                      >
                        <Volume2 className="h-3 w-3" />
                      </Button>
                    </div>
                    <p className="text-[10px] text-muted-foreground truncate">{meaning}</p>
                  </div>

                  <Button
                    size="icon"
                    variant={isSaved ? 'secondary' : 'ghost'}
                    disabled={isSaved}
                    onClick={() => handleAddSingleWord(word, meaning)}
                    className="h-6 w-6 shrink-0"
                    title={isSaved ? '이미 등록됨' : '단어장에 추가'}
                  >
                    {isSaved ? (
                      <Check className="h-3 w-3 text-emerald-500" />
                    ) : (
                      <Plus className="h-3 w-3 text-primary" />
                    )}
                  </Button>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
