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
  batchDeleteVocabulariesAction,
  autoFillMissingVocabulariesAction,
  getPhrasesAction,
  addPhraseAction,
  updatePhraseAction,
  deletePhraseAction,
  batchDeletePhrasesAction,
  autoFillMissingPhrasesAction,
  type VocabularyWithItem,
  type VocabularyListResult,
  type CreateVocabularyInput,
  type PhraseWithItem,
  type PhraseListResult,
  type CreatePhraseInput,
} from '@/features/vocabulary';
import { BookOpen, Layers, Camera } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { OcrModal } from '@/features/ocr';
import type { ExtractedWordCandidate } from '@/lib/ocr/tokenizer';

export default function VocabularyPage() {
  const [activeTab, setActiveTab] = useState<'words' | 'phrases'>('words');

  // 단어 상태
  const [vocabData, setVocabData] = useState<VocabularyListResult>({
    items: [],
    total: 0,
    page: 1,
    limit: 20,
    totalPages: 1,
  });
  const [isVocabLoading, setIsVocabLoading] = useState(false);
  const [isVocabAutoFilling, setIsVocabAutoFilling] = useState(false);
  const [selectedVocab, setSelectedVocab] = useState<VocabularyWithItem | null>(null);
  const [isVocabFormOpen, setIsVocabFormOpen] = useState(false);
  const [vocabFormMode, setVocabFormMode] = useState<'create' | 'edit'>('create');
  const [vocabEditData, setVocabEditData] = useState<Partial<CreateVocabularyInput> | undefined>();

  // 숙어 상태
  const [phraseData, setPhraseData] = useState<PhraseListResult>({
    items: [],
    total: 0,
    page: 1,
    limit: 20,
    totalPages: 1,
  });
  const [isPhraseLoading, setIsPhraseLoading] = useState(false);
  const [isPhraseAutoFilling, setIsPhraseAutoFilling] = useState(false);
  const [selectedPhrase, setSelectedPhrase] = useState<PhraseWithItem | null>(null);
  const [isPhraseFormOpen, setIsPhraseFormOpen] = useState(false);
  const [phraseFormMode, setPhraseFormMode] = useState<'create' | 'edit'>('create');
  const [phraseEditData, setPhraseEditData] = useState<Partial<CreatePhraseInput> | undefined>();

  // OCR 모달 상태
  const [isOcrOpen, setIsOcrOpen] = useState(false);

  // 단어 목록 로드
  const loadVocabularies = useCallback(async (query: string = '') => {
    setIsVocabLoading(true);
    try {
      const res = await getVocabulariesAction({ query });
      if (res.success && res.data) {
        setVocabData(res.data);
      }
    } catch {
      // ignore
    } finally {
      setIsVocabLoading(false);
    }
  }, []);

  // 숙어 목록 로드
  const loadPhrases = useCallback(async (query: string = '') => {
    setIsPhraseLoading(true);
    try {
      const res = await getPhrasesAction({ query });
      if (res.success && res.data) {
        setPhraseData(res.data);
      }
    } catch {
      // ignore
    } finally {
      setIsPhraseLoading(false);
    }
  }, []);

  useEffect(() => {
    const initData = async () => {
      if (activeTab === 'words') {
        await loadVocabularies();
        // 백그라운드 자동 보강: 뜻이 누락된 단어가 있으면 자동 채우기 실행
        const fillRes = await autoFillMissingVocabulariesAction();
        if (fillRes.success && (fillRes.data?.updatedCount ?? 0) > 0) {
          await loadVocabularies();
        }
      } else {
        await loadPhrases();
        const fillRes = await autoFillMissingPhrasesAction();
        if (fillRes.success && (fillRes.data?.updatedCount ?? 0) > 0) {
          await loadPhrases();
        }
      }
    };
    initData();
  }, [activeTab, loadVocabularies, loadPhrases]);


  // OCR 추출 단어 일괄 저장 핸들러
  const handleOcrSaveWords = async (extracted: ExtractedWordCandidate[]) => {
    for (const item of extracted) {
      const input: CreateVocabularyInput = {
        word: item.word,
        meaning: item.meaning || '',
        partOfSpeech: item.partOfSpeech || '',
        pronunciation: '',
        exampleSentence: '',
        exampleTranslation: '',
        synonyms: '',
        antonyms: '',
        difficulty: item.difficulty || 2,
        source: 'OCR 사진 수집',
      };

      try {
        await addVocabularyAction(input);
      } catch {}
    }

    // 저장 후 뜻 누락 단어 자동 보강
    await autoFillMissingVocabulariesAction();
    loadVocabularies();
    alert(`총 ${extracted.length}개의 단어가 등록 및 사전 자동 완성이 완료되었습니다! 🎉`);
  };

  // 단어 CRUD 핸들러
  const handleVocabFormSubmit = async (input: CreateVocabularyInput, allowDuplicate = false) => {
    if (vocabFormMode === 'create') {
      const res = await addVocabularyAction(input, allowDuplicate);
      if (res.success) {
        setIsVocabFormOpen(false);
        await loadVocabularies();
      } else {
        throw new Error(res.error || '단어 추가 실패');
      }
    } else if (vocabFormMode === 'edit' && selectedVocab) {
      const res = await updateVocabularyAction(selectedVocab.id, input);
      if (res.success) {
        const updated = { ...selectedVocab, ...input, updatedAt: new Date().toISOString() } as VocabularyWithItem;
        setSelectedVocab(updated);
        setIsVocabFormOpen(false);
        await loadVocabularies();
      } else {
        throw new Error(res.error || '단어 수정 실패');
      }
    }
  };

  // 단어 단일 삭제
  const handleVocabDelete = async (id: string) => {
    if (!confirm('이 단어를 삭제하시겠습니까?')) return;
    try {
      await deleteVocabularyAction(id);
      loadVocabularies();
      if (selectedVocab?.id === id) {
        setSelectedVocab(null);
      }
    } catch {
      alert('단어 삭제에 실패했습니다.');
    }
  };

  // 단어 일괄 삭제
  const handleBatchDeleteVocabs = async (ids: string[]) => {
    if (!confirm(`선택한 ${ids.length}개의 단어를 삭제하시겠습니까?`)) return;
    try {
      await batchDeleteVocabulariesAction(ids);
      loadVocabularies();
      if (selectedVocab && ids.includes(selectedVocab.id)) {
        setSelectedVocab(null);
      }
    } catch {
      alert('단어 일괄 삭제에 실패했습니다.');
    }
  };

  // 저장된 단어 중 누락된 뜻/정보 일괄 자동 채우기
  const handleAutoFillMissingVocabs = async () => {
    setIsVocabAutoFilling(true);
    try {
      const res = await autoFillMissingVocabulariesAction();
      if (res.success) {
        await loadVocabularies();
        const count = res.data?.updatedCount ?? 0;
        if (count > 0) {
          alert(`🎉 ${count}개의 단어 뜻 및 정보를 사전에서 자동으로 채워 넣었습니다!`);
        } else {
          alert('모든 단어의 뜻과 정보가 이미 등록되어 있습니다.');
        }
      }
    } catch {
      alert('단어 정보 자동 채우기 중 오류가 발생했습니다.');
    } finally {
      setIsVocabAutoFilling(false);
    }
  };

  // 숙어 CRUD 핸들러
  const handlePhraseFormSubmit = async (input: CreatePhraseInput, allowDuplicate = false) => {
    if (phraseFormMode === 'create') {
      const res = await addPhraseAction(input, allowDuplicate);
      if (res.success) {
        setIsPhraseFormOpen(false);
        await loadPhrases();
      } else {
        throw new Error(res.error || '숙어 추가 실패');
      }
    } else if (phraseFormMode === 'edit' && selectedPhrase) {
      const res = await updatePhraseAction(selectedPhrase.id, input);
      if (res.success) {
        const updated = { ...selectedPhrase, ...input, updatedAt: new Date().toISOString() } as PhraseWithItem;
        setSelectedPhrase(updated);
        setIsPhraseFormOpen(false);
        await loadPhrases();
      } else {
        throw new Error(res.error || '숙어 수정 실패');
      }
    }
  };

  // 숙어 단일 삭제
  const handlePhraseDelete = async (id: string) => {
    if (!confirm('이 숙어를 삭제하시겠습니까?')) return;
    try {
      await deletePhraseAction(id);
      loadPhrases();
      if (selectedPhrase?.id === id) {
        setSelectedPhrase(null);
      }
    } catch {
      alert('숙어 삭제에 실패했습니다.');
    }
  };

  // 숙어 일괄 삭제
  const handleBatchPhraseDelete = async (ids: string[]) => {
    if (!confirm(`선택한 ${ids.length}개의 숙어를 모두 삭제하시겠습니까?`)) return;
    try {
      const res = await batchDeletePhrasesAction(ids);
      if (res.success) {
        loadPhrases();
        if (selectedPhrase && ids.includes(selectedPhrase.id)) {
          setSelectedPhrase(null);
        }
      }
    } catch {
      alert('일괄 삭제 중 오류가 발생했습니다.');
    }
  };

  // 저장된 숙어 중 누락된 뜻/예문 일괄 자동 채우기
  const handleAutoFillMissingPhrases = async () => {
    setIsPhraseAutoFilling(true);
    try {
      const res = await autoFillMissingPhrasesAction();
      if (res.success) {
        await loadPhrases();
        if (res.data.updatedCount > 0) {
          alert(`🎉 ${res.data.updatedCount}개의 숙어 뜻과 예문을 사전에서 자동으로 채워 넣었습니다!`);
        } else {
          alert('모든 숙어의 뜻과 예문이 이미 등록되어 있습니다.');
        }
      }
    } catch {
      alert('숙어 정보 자동 채우기 중 오류가 발생했습니다.');
    } finally {
      setIsPhraseAutoFilling(false);
    }
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

        <div className="flex items-center gap-2">
          {/* OCR 사진 단어 추출 버튼 */}
          <Button
            variant="outline"
            size="sm"
            className="font-bold gap-1.5 border-primary/40 bg-primary/5 hover:bg-primary/10 text-primary"
            onClick={() => setIsOcrOpen(true)}
          >
            <Camera className="h-4 w-4" />
            <span className="hidden sm:inline">사진 단어 추출 (OCR)</span>
          </Button>

          {/* 탭 전환 */}
          <div className="flex gap-1 p-1 bg-muted/60 rounded-xl">
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
              onVocabUpdated={(updated) => {
                setSelectedVocab(updated);
                loadVocabularies();
              }}
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
              onDeleteClick={handleVocabDelete}
              onBatchDelete={handleBatchDeleteVocabs}
              onAutoFillMissing={handleAutoFillMissingVocabs}
              isAutoFilling={isVocabAutoFilling}
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
              onPhraseUpdated={(updated) => {
                setSelectedPhrase(updated);
                loadPhrases();
              }}
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
              onDeleteClick={handlePhraseDelete}
              onBatchDelete={handleBatchPhraseDelete}
              onAutoFillMissing={handleAutoFillMissingPhrases}
              isAutoFilling={isPhraseAutoFilling}
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

      {/* OCR 모달 */}
      <OcrModal
        open={isOcrOpen}
        onOpenChange={setIsOcrOpen}
        onSaveWords={handleOcrSaveWords}
      />
    </div>
  );
}
