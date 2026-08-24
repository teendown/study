'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  VocabularyList,
  VocabularyFormDialog,
  VocabularyDetail,
  PhraseList,
  PhraseFormDialog,
  PhraseDetail,
  PassageList,
  PassageDetail,
  PassageFormDialog,
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
  getPassagesAction,
  addPassageAction,
  updatePassageAction,
  deletePassageAction,
  type VocabularyWithItem,
  type VocabularyListResult,
  type CreateVocabularyInput,
  type PhraseWithItem,
  type PhraseListResult,
  type CreatePhraseInput,
} from '@/features/vocabulary';
import type { PassageItem, PassageListResult, CreatePassageInput } from '@/features/vocabulary/types/passageTypes';
import { BookOpen, Layers, Camera, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { OcrModal } from '@/features/ocr';
import type { ExtractedWordCandidate } from '@/lib/ocr/tokenizer';
import type { ExtractedPhraseResult } from '@/lib/ocr/phraseDictionary';

export default function VocabularyPage() {
  const [activeTab, setActiveTab] = useState<'words' | 'phrases' | 'passages'>('words');

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

  // 본문/독해 지문 상태
  const [passageData, setPassageData] = useState<PassageListResult>({
    items: [],
    total: 0,
    page: 1,
    limit: 20,
    totalPages: 1,
  });
  const [isPassageLoading, setIsPassageLoading] = useState(false);
  const [selectedPassage, setSelectedPassage] = useState<PassageItem | null>(null);
  const [isPassageFormOpen, setIsPassageFormOpen] = useState(false);
  const [passageFormMode, setPassageFormMode] = useState<'create' | 'edit'>('create');
  const [passageEditData, setPassageEditData] = useState<Partial<CreatePassageInput> | undefined>();

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

  // 지문 목록 로드
  const loadPassages = useCallback(async (query: string = '') => {
    setIsPassageLoading(true);
    try {
      const res = await getPassagesAction(query);
      if (res.success && res.data) {
        setPassageData(res.data);
      }
    } catch {
      // ignore
    } finally {
      setIsPassageLoading(false);
    }
  }, []);

  useEffect(() => {
    const initData = async () => {
      if (activeTab === 'words') {
        await loadVocabularies();
        const fillRes = await autoFillMissingVocabulariesAction();
        if (fillRes.success && (fillRes.data?.updatedCount ?? 0) > 0) {
          await loadVocabularies();
        }
      } else if (activeTab === 'phrases') {
        await loadPhrases();
        const fillRes = await autoFillMissingPhrasesAction();
        if (fillRes.success && (fillRes.data?.updatedCount ?? 0) > 0) {
          await loadPhrases();
        }
      } else if (activeTab === 'passages') {
        await loadPassages();
      }
    };
    initData();
  }, [activeTab, loadVocabularies, loadPhrases, loadPassages]);

  // OCR 추출 단어 일괄 저장 핸들러
  const handleOcrSaveWords = async (extracted: ExtractedWordCandidate[]) => {
    for (const item of extracted) {
      const input: CreateVocabularyInput = {
        word: item.word,
        meaning: item.meaning || '',
        partOfSpeech: item.partOfSpeech || '',
        pronunciation: item.pronunciation || '',
        exampleSentence: '',
        exampleTranslation: '',
        synonyms: '',
        antonyms: '',
        difficulty: item.difficulty || 2,
        source: 'OCR 사진 수집',
      };

      try {
        await addVocabularyAction(input, true);
      } catch {}
    }

    await autoFillMissingVocabulariesAction();
    await loadVocabularies();
    alert(`총 ${extracted.length}개의 단어가 등록되었습니다! 🎉`);
  };

  // OCR 추출 숙어 일괄 저장 핸들러
  const handleOcrSavePhrases = async (extracted: ExtractedPhraseResult[]) => {
    for (const item of extracted) {
      const input: CreatePhraseInput = {
        phrase: item.phrase,
        meaning: item.meaning || '의미 검색 필요',
        exampleSentence: item.matchedText ? `(본문 문맥: ${item.matchedText})` : '',
        exampleTranslation: '',
        difficulty: item.difficulty || 2,
        source: 'OCR 사진 수집',
      };

      try {
        await addPhraseAction(input, true);
      } catch {}
    }

    await loadPhrases();
    alert(`총 ${extracted.length}개의 숙어가 등록되었습니다! 🔖`);
  };

  // OCR 추출 본문 저장 핸들러
  const handleOcrSavePassage = async (data: { title: string; content: string; source: string }) => {
    try {
      const res = await addPassageAction(data);
      if (res.success && res.data) {
        await loadPassages();
        setActiveTab('passages');
        setSelectedPassage(res.data);
        alert(`"${data.title}" 본문이 성공적으로 등록되었습니다! 📖`);
      }
    } catch {
      alert('지문 저장 중 오류가 발생했습니다.');
    }
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

  const handleVocabDelete = async (id: string) => {
    if (!confirm('이 단어를 삭제하시겠습니까?')) return;
    try {
      await deleteVocabularyAction(id);
      await loadVocabularies();
      if (selectedVocab?.id === id) {
        setSelectedVocab(null);
      }
    } catch {
      alert('단어 삭제에 실패했습니다.');
    }
  };

  const handleBatchDeleteVocabs = async (ids: string[]) => {
    if (!confirm(`선택한 ${ids.length}개의 단어를 삭제하시겠습니까?`)) return;
    try {
      await batchDeleteVocabulariesAction(ids);
      await loadVocabularies();
      if (selectedVocab && ids.includes(selectedVocab.id)) {
        setSelectedVocab(null);
      }
    } catch {
      alert('단어 일괄 삭제에 실패했습니다.');
    }
  };

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

  const handlePhraseDelete = async (id: string) => {
    if (!confirm('이 숙어를 삭제하시겠습니까?')) return;
    try {
      await deletePhraseAction(id);
      await loadPhrases();
      if (selectedPhrase?.id === id) {
        setSelectedPhrase(null);
      }
    } catch {
      alert('숙어 삭제에 실패했습니다.');
    }
  };

  const handleBatchPhraseDelete = async (ids: string[]) => {
    if (!confirm(`선택한 ${ids.length}개의 숙어를 모두 삭제하시겠습니까?`)) return;
    try {
      await batchDeletePhrasesAction(ids);
      await loadPhrases();
      if (selectedPhrase && ids.includes(selectedPhrase.id)) {
        setSelectedPhrase(null);
      }
    } catch {
      alert('숙어 일괄 삭제에 실패했습니다.');
    }
  };

  const handleAutoFillMissingPhrases = async () => {
    setIsPhraseAutoFilling(true);
    try {
      const res = await autoFillMissingPhrasesAction();
      if (res.success) {
        await loadPhrases();
        const count = res.data?.updatedCount ?? 0;
        if (count > 0) {
          alert(`🎉 ${count}개의 숙어 뜻 및 예문을 사전에서 자동으로 채워 넣었습니다!`);
        } else {
          alert('모든 숙어의 뜻과 정보가 이미 등록되어 있습니다.');
        }
      }
    } catch {
      alert('숙어 자동 채우기 중 오류가 발생했습니다.');
    } finally {
      setIsPhraseAutoFilling(false);
    }
  };

  // 지문 CRUD 핸들러
  const handlePassageFormSubmit = async (input: CreatePassageInput) => {
    if (passageFormMode === 'create') {
      const res = await addPassageAction(input);
      if (res.success) {
        setIsPassageFormOpen(false);
        await loadPassages();
        if (res.data) setSelectedPassage(res.data);
      } else {
        throw new Error(res.error || '지문 추가 실패');
      }
    } else if (passageFormMode === 'edit' && selectedPassage) {
      const res = await updatePassageAction(selectedPassage.id, input);
      if (res.success) {
        if (res.data) setSelectedPassage(res.data);
        setIsPassageFormOpen(false);
        await loadPassages();
      } else {
        throw new Error(res.error || '지문 수정 실패');
      }
    }
  };

  const handlePassageDelete = async (id: string) => {
    if (!confirm('이 독해 지문을 삭제하시겠습니까?')) return;
    try {
      await deletePassageAction(id);
      await loadPassages();
      if (selectedPassage?.id === id) {
        setSelectedPassage(null);
      }
    } catch {
      alert('지문 삭제에 실패했습니다.');
    }
  };

  // 지문에서 단어 바로 단어장에 추가 (지문 실제 예문 연동)
  const handleAddWordFromPassage = async (
    word: string,
    meaning: string,
    exampleSentence?: string,
    exampleTranslation?: string
  ) => {
    try {
      await addVocabularyAction({
        word,
        meaning,
        partOfSpeech: 'n.',
        pronunciation: '',
        exampleSentence: exampleSentence || '',
        exampleTranslation: exampleTranslation || '',
        synonyms: '',
        antonyms: '',
        difficulty: 2,
        source: selectedPassage ? `${selectedPassage.title} 어휘` : '지문 추출 어휘',
      }, true);
      await loadVocabularies();
    } catch {}
  };

  // 지문에서 숙어 바로 숙어장에 추가 (지문 실제 예문 연동)
  const handleAddPhraseFromPassage = async (
    phrase: string,
    meaning: string,
    exampleSentence?: string,
    exampleTranslation?: string
  ) => {
    try {
      await addPhraseAction({
        phrase,
        meaning,
        exampleSentence: exampleSentence || '',
        exampleTranslation: exampleTranslation || '',
        difficulty: 2,
        source: selectedPassage ? `${selectedPassage.title} 숙어` : '지문 추출 숙어',
      }, true);
      await loadPhrases();
    } catch {}
  };

  // 지문에서 단어 일괄 추가 (지문 실제 예문 연동)
  const handleBatchAddWordsFromPassage = async (
    items: Array<{ word: string; meaning: string; exampleSentence?: string; exampleTranslation?: string }>
  ) => {
    for (const item of items) {
      try {
        await addVocabularyAction({
          word: item.word,
          meaning: item.meaning,
          partOfSpeech: 'n.',
          pronunciation: '',
          exampleSentence: item.exampleSentence || '',
          exampleTranslation: item.exampleTranslation || '',
          synonyms: '',
          antonyms: '',
          difficulty: 2,
          source: selectedPassage ? `${selectedPassage.title} 어휘` : '지문 추출 어휘',
        }, true);
      } catch {}
    }
    await loadVocabularies();
    alert(`총 ${items.length}개의 단어가 단어장에 추가되었습니다! 📚`);
  };

  // 지문에서 숙어 일괄 추가 (지문 실제 예문 연동)
  const handleBatchAddPhrasesFromPassage = async (
    items: Array<{ phrase: string; meaning: string; exampleSentence?: string; exampleTranslation?: string }>
  ) => {
    for (const item of items) {
      try {
        await addPhraseAction({
          phrase: item.phrase,
          meaning: item.meaning,
          exampleSentence: item.exampleSentence || '',
          exampleTranslation: item.exampleTranslation || '',
          difficulty: 2,
          source: selectedPassage ? `${selectedPassage.title} 숙어` : '지문 추출 숙어',
        }, true);
      } catch {}
    }
    await loadPhrases();
    alert(`총 ${items.length}개의 숙어가 숙어장에 추가되었습니다! 🔖`);
  };


  return (
    <div className="space-y-6">
      {/* ────────────────────────────────────
          헤더 및 3단 탭 네비게이션
         ──────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">단어 및 본문 학습장</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            단어, 숙어, 독해 지문을 등록하고 체계적으로 학습하세요
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* OCR 사진 추출 버튼 */}
          <Button
            variant="outline"
            size="sm"
            className="font-bold gap-1.5 border-primary/40 bg-primary/5 hover:bg-primary/10 text-primary"
            onClick={() => setIsOcrOpen(true)}
          >
            <Camera className="h-4 w-4" />
            <span className="hidden sm:inline">사진 OCR 추출</span>
          </Button>

          {/* 3단 탭 전환: 단어 / 숙어 / 본문 지문 */}
          <div className="flex gap-1 p-1 bg-muted/70 backdrop-blur-xs rounded-xl">
            <Button
              variant={activeTab === 'words' ? 'default' : 'ghost'}
              size="sm"
              className="font-bold gap-1.5 rounded-lg text-xs"
              onClick={() => {
                setActiveTab('words');
                setSelectedVocab(null);
              }}
            >
              <BookOpen className="h-3.5 w-3.5" />
              단어 ({vocabData.total})
            </Button>

            <Button
              variant={activeTab === 'phrases' ? 'default' : 'ghost'}
              size="sm"
              className="font-bold gap-1.5 rounded-lg text-xs"
              onClick={() => {
                setActiveTab('phrases');
                setSelectedPhrase(null);
              }}
            >
              <Layers className="h-3.5 w-3.5" />
              숙어 ({phraseData.total})
            </Button>

            <Button
              variant={activeTab === 'passages' ? 'default' : 'ghost'}
              size="sm"
              className="font-bold gap-1.5 rounded-lg text-xs"
              onClick={() => {
                setActiveTab('passages');
                setSelectedPassage(null);
              }}
            >
              <FileText className="h-3.5 w-3.5" />
              본문/지문 ({passageData.total})
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

      {/* ────────────────────────────────────
          3. 영어 본문/독해 지문 뷰 ✨
         ──────────────────────────────────── */}
      {activeTab === 'passages' && (
        <>
          {selectedPassage ? (
            <PassageDetail
              passage={selectedPassage}
              onBack={() => setSelectedPassage(null)}
              onEdit={() => {
                setPassageFormMode('edit');
                setPassageEditData({
                  title: selectedPassage.title,
                  content: selectedPassage.content,
                  translation: selectedPassage.translation || undefined,
                  difficulty: selectedPassage.difficulty,
                  grade: selectedPassage.grade || undefined,
                  source: selectedPassage.source,
                });
                setIsPassageFormOpen(true);
              }}
              onDelete={() => handlePassageDelete(selectedPassage.id)}
              onAddWordToVocab={handleAddWordFromPassage}
              onAddPhraseToVocab={handleAddPhraseFromPassage}
              onBatchAddWordsToVocab={handleBatchAddWordsFromPassage}
              onBatchAddPhrasesToVocab={handleBatchAddPhrasesFromPassage}
            />
          ) : (
            <PassageList
              initialData={passageData}
              onAddClick={() => {
                setPassageFormMode('create');
                setPassageEditData(undefined);
                setIsPassageFormOpen(true);
              }}
              onOcrClick={() => setIsOcrOpen(true)}
              onItemClick={(p) => setSelectedPassage(p)}
              onDeleteClick={handlePassageDelete}
              onSearch={(q) => loadPassages(q)}
              isLoading={isPassageLoading}
            />
          )}

          <PassageFormDialog
            open={isPassageFormOpen}
            onOpenChange={setIsPassageFormOpen}
            onSubmit={handlePassageFormSubmit}
            initialData={passageEditData}
            mode={passageFormMode}
          />
        </>
      )}

      {/* OCR 모달 (단어, 숙어 및 본문 지문 동시 지원) */}
      <OcrModal
        open={isOcrOpen}
        onOpenChange={setIsOcrOpen}
        onSaveWords={handleOcrSaveWords}
        onSavePhrases={handleOcrSavePhrases}
        onSavePassage={handleOcrSavePassage}
      />
    </div>
  );
}
