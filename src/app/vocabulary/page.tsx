'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  VocabularyList,
  VocabularyFormDialog,
  VocabularyDetail,
  PhraseList,
  PhraseFormDialog,
  PhraseDetail,
  getVocabulariesAction,
  addVocabularyAction,
  updateVocabularyAction,
  deleteVocabularyAction,
  getPhrasesAction,
  addPhraseAction,
  updatePhraseAction,
  deletePhraseAction,
  type VocabularyWithItem,
  type VocabularyListResult,
  type CreateVocabularyInput,
  type PhraseWithItem,
  type PhraseListResult,
  type CreatePhraseInput,
} from '@/features/vocabulary';
import { BookOpen, Layers } from 'lucide-react';
import { Button } from '@/components/ui/button';

// 샘플 단어
const SAMPLE_VOCABULARY: VocabularyWithItem[] = [
  {
    id: 'sample-1',
    word: 'abandon',
    meaning: '포기하다, 버리다',
    partOfSpeech: 'v.',
    pronunciation: '[əˈbændən]',
    audioUrl: null,
    exampleSentence: 'He decided to abandon the risky project.',
    exampleTranslation: '그는 위험한 프로젝트를 포기하기로 결정했다.',
    synonyms: 'give up, quit, discard',
    antonyms: 'maintain, keep, retain',
    frequency: 'high',
    difficulty: 2,
    grade: 10,
    source: '고1 필수 어휘',
    learningItemId: 'item-1',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'sample-2',
    word: 'significant',
    meaning: '중요한, 의미심장한, 상당한',
    partOfSpeech: 'adj.',
    pronunciation: '[sɪɡˈnɪfɪkənt]',
    audioUrl: null,
    exampleSentence: 'There has been a significant increase in sales.',
    exampleTranslation: '매출에 상당한 증가가 있었다.',
    synonyms: 'important, substantial, notable',
    antonyms: 'insignificant, trivial',
    frequency: 'high',
    difficulty: 3,
    grade: 10,
    source: '고1 교과서 어휘',
    learningItemId: 'item-2',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

// 샘플 숙어
const SAMPLE_PHRASES: PhraseWithItem[] = [
  {
    id: 'phrase-1',
    phrase: 'look forward to',
    meaning: '~를 고대하다, 기대하다',
    exampleSentence: 'I look forward to seeing you soon.',
    exampleTranslation: '곧 당신을 만나기를 고대합니다.',
    difficulty: 2,
    grade: 10,
    source: '고1 필수 숙어',
    learningItemId: 'p-item-1',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'phrase-2',
    phrase: 'take part in',
    meaning: '~에 참여하다, 참가하다',
    exampleSentence: 'Many students took part in the contest.',
    exampleTranslation: '많은 학생들이 그 대회에 참가했다.',
    difficulty: 1,
    grade: 10,
    source: '고1 필수 숙어',
    learningItemId: 'p-item-2',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'phrase-3',
    phrase: 'carry out',
    meaning: '수행하다, 실행하다',
    exampleSentence: 'They carried out the scientific experiment.',
    exampleTranslation: '그들은 과학 실험을 수행했다.',
    difficulty: 3,
    grade: 10,
    source: '고1 교과서 숙어',
    learningItemId: 'p-item-3',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

export default function VocabularyPage() {
  const [activeTab, setActiveTab] = useState<'words' | 'phrases'>('words');

  // 단어 상태
  const [vocabData, setVocabData] = useState<VocabularyListResult>({
    items: SAMPLE_VOCABULARY,
    total: SAMPLE_VOCABULARY.length,
    page: 1,
    limit: 20,
    totalPages: 1,
  });
  const [isVocabLoading, setIsVocabLoading] = useState(false);
  const [selectedVocab, setSelectedVocab] = useState<VocabularyWithItem | null>(null);
  const [isVocabFormOpen, setIsVocabFormOpen] = useState(false);
  const [vocabFormMode, setVocabFormMode] = useState<'create' | 'edit'>('create');
  const [vocabEditData, setVocabEditData] = useState<Partial<CreateVocabularyInput> | undefined>();

  // 숙어 상태
  const [phraseData, setPhraseData] = useState<PhraseListResult>({
    items: SAMPLE_PHRASES,
    total: SAMPLE_PHRASES.length,
    page: 1,
    limit: 20,
    totalPages: 1,
  });
  const [isPhraseLoading, setIsPhraseLoading] = useState(false);
  const [selectedPhrase, setSelectedPhrase] = useState<PhraseWithItem | null>(null);
  const [isPhraseFormOpen, setIsPhraseFormOpen] = useState(false);
  const [phraseFormMode, setPhraseFormMode] = useState<'create' | 'edit'>('create');
  const [phraseEditData, setPhraseEditData] = useState<Partial<CreatePhraseInput> | undefined>();

  // 단어 로드
  const loadVocabularies = useCallback(async (query: string = '') => {
    setIsVocabLoading(true);
    try {
      const res = await getVocabulariesAction({ query });
      if (res.success && res.data) {
        setVocabData(res.data);
      }
    } catch {
      const filtered = SAMPLE_VOCABULARY.filter(
        (v) => v.word.toLowerCase().includes(query.toLowerCase()) || v.meaning.includes(query)
      );
      setVocabData({ items: filtered, total: filtered.length, page: 1, limit: 20, totalPages: 1 });
    } finally {
      setIsVocabLoading(false);
    }
  }, []);

  // 숙어 로드
  const loadPhrases = useCallback(async (query: string = '') => {
    setIsPhraseLoading(true);
    try {
      const res = await getPhrasesAction({ query });
      if (res.success && res.data) {
        setPhraseData(res.data);
      }
    } catch {
      const filtered = SAMPLE_PHRASES.filter(
        (p) => p.phrase.toLowerCase().includes(query.toLowerCase()) || p.meaning.includes(query)
      );
      setPhraseData({ items: filtered, total: filtered.length, page: 1, limit: 20, totalPages: 1 });
    } finally {
      setIsPhraseLoading(false);
    }
  }, []);

  useEffect(() => {
    if (activeTab === 'words') loadVocabularies();
    else loadPhrases();
  }, [activeTab, loadVocabularies, loadPhrases]);

  // 단어 CRUD 핸들러
  const handleVocabFormSubmit = async (input: CreateVocabularyInput) => {
    if (vocabFormMode === 'create') {
      try {
        const res = await addVocabularyAction(input);
        if (res.success) {
          setIsVocabFormOpen(false);
          loadVocabularies();
          return;
        }
      } catch {}
      const newItem: VocabularyWithItem = {
        id: `local-${Date.now()}`,
        word: input.word,
        meaning: input.meaning,
        partOfSpeech: input.partOfSpeech || null,
        pronunciation: input.pronunciation || null,
        audioUrl: null,
        exampleSentence: input.exampleSentence || null,
        exampleTranslation: input.exampleTranslation || null,
        synonyms: input.synonyms || null,
        antonyms: input.antonyms || null,
        frequency: null,
        difficulty: input.difficulty ?? 1,
        grade: input.grade ?? null,
        source: input.source || null,
        learningItemId: `local-item-${Date.now()}`,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      SAMPLE_VOCABULARY.unshift(newItem);
      setVocabData((prev) => ({ ...prev, items: [newItem, ...prev.items], total: prev.total + 1 }));
      setIsVocabFormOpen(false);
    } else if (vocabFormMode === 'edit' && selectedVocab) {
      try {
        await updateVocabularyAction(selectedVocab.id, input);
      } catch {}
      const updated = { ...selectedVocab, ...input, updatedAt: new Date().toISOString() } as VocabularyWithItem;
      setSelectedVocab(updated);
      setVocabData((prev) => ({ ...prev, items: prev.items.map((it) => (it.id === updated.id ? updated : it)) }));
      setIsVocabFormOpen(false);
    }
  };

  const handleVocabDelete = async (id: string) => {
    if (!confirm('이 단어를 삭제하시겠습니까?')) return;
    try {
      await deleteVocabularyAction(id);
    } catch {}
    const idx = SAMPLE_VOCABULARY.findIndex((v) => v.id === id);
    if (idx !== -1) SAMPLE_VOCABULARY.splice(idx, 1);
    setVocabData((prev) => ({ ...prev, items: prev.items.filter((it) => it.id !== id), total: Math.max(0, prev.total - 1) }));
    setSelectedVocab(null);
  };

  // 숙어 CRUD 핸들러
  const handlePhraseFormSubmit = async (input: CreatePhraseInput) => {
    if (phraseFormMode === 'create') {
      try {
        const res = await addPhraseAction(input);
        if (res.success) {
          setIsPhraseFormOpen(false);
          loadPhrases();
          return;
        }
      } catch {}
      const newItem: PhraseWithItem = {
        id: `local-p-${Date.now()}`,
        phrase: input.phrase,
        meaning: input.meaning,
        exampleSentence: input.exampleSentence || null,
        exampleTranslation: input.exampleTranslation || null,
        difficulty: input.difficulty ?? 1,
        grade: input.grade ?? null,
        source: input.source || null,
        learningItemId: `local-pitem-${Date.now()}`,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      SAMPLE_PHRASES.unshift(newItem);
      setPhraseData((prev) => ({ ...prev, items: [newItem, ...prev.items], total: prev.total + 1 }));
      setIsPhraseFormOpen(false);
    } else if (phraseFormMode === 'edit' && selectedPhrase) {
      try {
        await updatePhraseAction(selectedPhrase.id, input);
      } catch {}
      const updated = { ...selectedPhrase, ...input, updatedAt: new Date().toISOString() } as PhraseWithItem;
      setSelectedPhrase(updated);
      setPhraseData((prev) => ({ ...prev, items: prev.items.map((it) => (it.id === updated.id ? updated : it)) }));
      setIsPhraseFormOpen(false);
    }
  };

  const handlePhraseDelete = async (id: string) => {
    if (!confirm('이 숙어를 삭제하시겠습니까?')) return;
    try {
      await deletePhraseAction(id);
    } catch {}
    const idx = SAMPLE_PHRASES.findIndex((p) => p.id === id);
    if (idx !== -1) SAMPLE_PHRASES.splice(idx, 1);
    setPhraseData((prev) => ({ ...prev, items: prev.items.filter((it) => it.id !== id), total: Math.max(0, prev.total - 1) }));
    setSelectedPhrase(null);
  };

  return (
    <div className="mx-auto max-w-2xl space-y-5">
      {/* 상단 탭 전환: [영단어장] / [영어 숙어장] */}
      <div className="flex items-center justify-between border-b border-border/80 pb-3">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">어휘 관리</h2>
          <p className="text-sm text-muted-foreground mt-0.5">
            단어와 숙어를 등록하고 학습하세요
          </p>
        </div>

        <div className="flex gap-1.5 p-1 bg-muted/60 rounded-xl">
          <Button
            variant={activeTab === 'words' ? 'default' : 'ghost'}
            size="sm"
            className="font-bold gap-1.5 rounded-lg"
            onClick={() => {
              setActiveTab('words');
              setSelectedVocab(null);
            }}
          >
            <BookOpen className="h-4 w-4" />
            단어 ({vocabData.total})
          </Button>
          <Button
            variant={activeTab === 'phrases' ? 'default' : 'ghost'}
            size="sm"
            className="font-bold gap-1.5 rounded-lg"
            onClick={() => {
              setActiveTab('phrases');
              setSelectedPhrase(null);
            }}
          >
            <Layers className="h-4 w-4" />
            숙어 ({phraseData.total})
          </Button>
        </div>
      </div>

      {/* ────────────────────────────────────
          1. 영단어 뷰
         ──────────────────────────────────── */}
      {activeTab === 'words' && (
        <>
          {selectedVocab ? (
            <VocabularyDetail
              vocab={selectedVocab}
              onBack={() => setSelectedVocab(null)}
              onEdit={() => {
                setVocabFormMode('edit');
                setVocabEditData({
                  word: selectedVocab.word,
                  meaning: selectedVocab.meaning,
                  partOfSpeech: selectedVocab.partOfSpeech || '',
                  pronunciation: selectedVocab.pronunciation || '',
                  exampleSentence: selectedVocab.exampleSentence || '',
                  exampleTranslation: selectedVocab.exampleTranslation || '',
                  synonyms: selectedVocab.synonyms || '',
                  antonyms: selectedVocab.antonyms || '',
                  difficulty: selectedVocab.difficulty,
                  grade: selectedVocab.grade || undefined,
                  source: selectedVocab.source || '',
                });
                setIsVocabFormOpen(true);
              }}
              onDelete={() => handleVocabDelete(selectedVocab.id)}
            />
          ) : (
            <VocabularyList
              initialData={vocabData}
              onAddClick={() => {
                setVocabFormMode('create');
                setVocabEditData(undefined);
                setIsVocabFormOpen(true);
              }}
              onItemClick={(v) => setSelectedVocab(v)}
              onSearch={(q) => loadVocabularies(q)}
              isLoading={isVocabLoading}
            />
          )}

          <VocabularyFormDialog
            open={isVocabFormOpen}
            onOpenChange={setIsVocabFormOpen}
            onSubmit={handleVocabFormSubmit}
            initialData={vocabEditData}
            mode={vocabFormMode}
          />
        </>
      )}

      {/* ────────────────────────────────────
          2. 영어 숙어 뷰
         ──────────────────────────────────── */}
      {activeTab === 'phrases' && (
        <>
          {selectedPhrase ? (
            <PhraseDetail
              phrase={selectedPhrase}
              onBack={() => setSelectedPhrase(null)}
              onEdit={() => {
                setPhraseFormMode('edit');
                setPhraseEditData({
                  phrase: selectedPhrase.phrase,
                  meaning: selectedPhrase.meaning,
                  exampleSentence: selectedPhrase.exampleSentence || '',
                  exampleTranslation: selectedPhrase.exampleTranslation || '',
                  difficulty: selectedPhrase.difficulty,
                  grade: selectedPhrase.grade || undefined,
                  source: selectedPhrase.source || '',
                });
                setIsPhraseFormOpen(true);
              }}
              onDelete={() => handlePhraseDelete(selectedPhrase.id)}
            />
          ) : (
            <PhraseList
              initialData={phraseData}
              onAddClick={() => {
                setPhraseFormMode('create');
                setPhraseEditData(undefined);
                setIsPhraseFormOpen(true);
              }}
              onItemClick={(p) => setSelectedPhrase(p)}
              onSearch={(q) => loadPhrases(q)}
              isLoading={isPhraseLoading}
            />
          )}

          <PhraseFormDialog
            open={isPhraseFormOpen}
            onOpenChange={setIsPhraseFormOpen}
            onSubmit={handlePhraseFormSubmit}
            initialData={phraseEditData}
            mode={phraseFormMode}
          />
        </>
      )}
    </div>
  );
}
