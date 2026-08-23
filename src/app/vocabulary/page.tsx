'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  VocabularyList,
  VocabularyFormDialog,
  VocabularyDetail,
} from '@/features/vocabulary/components';
import {
  getVocabulariesAction,
  addVocabularyAction,
  updateVocabularyAction,
  deleteVocabularyAction,
} from '@/features/vocabulary/services';
import type {
  VocabularyWithItem,
  VocabularyListResult,
} from '@/features/vocabulary/types';
import type { CreateVocabularyInput } from '@/features/vocabulary/schemas';

// DB 연결 전 로컬 테스트 및 샘플용 초기 데이터
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
  {
    id: 'sample-3',
    word: 'contribute',
    meaning: '기여하다, 공헌하다, 원인이 되다',
    partOfSpeech: 'v.',
    pronunciation: '[kənˈtrɪbjuːt]',
    audioUrl: null,
    exampleSentence: 'Many factors contributed to the success.',
    exampleTranslation: '많은 요인들이 성공에 기여했다.',
    synonyms: 'donate, support, add to',
    antonyms: 'subtract, detract',
    frequency: 'high',
    difficulty: 3,
    grade: 10,
    source: '고1 필수 어휘',
    learningItemId: 'item-3',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

export default function VocabularyPage() {
  const [data, setData] = useState<VocabularyListResult>({
    items: SAMPLE_VOCABULARY,
    total: SAMPLE_VOCABULARY.length,
    page: 1,
    limit: 20,
    totalPages: 1,
  });
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // 뷰 & 모달 상태
  const [selectedVocab, setSelectedVocab] = useState<VocabularyWithItem | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [formMode, setFormMode] = useState<'create' | 'edit'>('create');
  const [editData, setEditData] = useState<Partial<CreateVocabularyInput> | undefined>();

  // 데이터 로드 함수
  const loadVocabularies = useCallback(async (query: string = '') => {
    setIsLoading(true);
    try {
      const res = await getVocabulariesAction({ query });
      if (res.success && res.data) {
        setData(res.data);
      }
    } catch {
      // DB 미설정 시 샘플 데이터 기반 로컬 필터링 동작
      const filtered = SAMPLE_VOCABULARY.filter(
        (v) =>
          v.word.toLowerCase().includes(query.toLowerCase()) ||
          v.meaning.includes(query)
      );
      setData({
        items: filtered,
        total: filtered.length,
        page: 1,
        limit: 20,
        totalPages: 1,
      });
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadVocabularies();
  }, [loadVocabularies]);

  // 검색
  const handleSearch = (query: string) => {
    setSearchQuery(query);
    loadVocabularies(query);
  };

  // 단어 추가 모달 열기
  const handleOpenCreate = () => {
    setFormMode('create');
    setEditData(undefined);
    setIsFormOpen(true);
  };

  // 단어 수정 모달 열기
  const handleOpenEdit = (vocab: VocabularyWithItem) => {
    setFormMode('edit');
    setEditData({
      word: vocab.word,
      meaning: vocab.meaning,
      partOfSpeech: vocab.partOfSpeech || '',
      pronunciation: vocab.pronunciation || '',
      exampleSentence: vocab.exampleSentence || '',
      exampleTranslation: vocab.exampleTranslation || '',
      synonyms: vocab.synonyms || '',
      antonyms: vocab.antonyms || '',
      difficulty: vocab.difficulty,
      source: vocab.source || '',
    });
    setIsFormOpen(true);
  };

  // 단어 추가/수정 폼 제출
  const handleFormSubmit = async (input: CreateVocabularyInput) => {
    if (formMode === 'create') {
      try {
        const res = await addVocabularyAction(input);
        if (res.success) {
          setIsFormOpen(false);
          loadVocabularies(searchQuery);
          return;
        }
      } catch {
        // 로컬 fallback
      }
      // 로컬 mock 추가
      const newVocab: VocabularyWithItem = {
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
      SAMPLE_VOCABULARY.unshift(newVocab);
      setData((prev) => ({
        ...prev,
        items: [newVocab, ...prev.items],
        total: prev.total + 1,
      }));
      setIsFormOpen(false);
    } else if (formMode === 'edit' && selectedVocab) {
      try {
        const res = await updateVocabularyAction(selectedVocab.id, input);
        if (res.success) {
          setIsFormOpen(false);
          loadVocabularies(searchQuery);
          return;
        }
      } catch {
        // 로컬 fallback
      }
      const updated: VocabularyWithItem = {
        ...selectedVocab,
        ...input,
        partOfSpeech: input.partOfSpeech || null,
        pronunciation: input.pronunciation || null,
        exampleSentence: input.exampleSentence || null,
        exampleTranslation: input.exampleTranslation || null,
        synonyms: input.synonyms || null,
        antonyms: input.antonyms || null,
        source: input.source || null,
        grade: input.grade ?? null,
        difficulty: input.difficulty ?? selectedVocab.difficulty,
        updatedAt: new Date().toISOString(),
      };
      setSelectedVocab(updated);
      setData((prev) => ({
        ...prev,
        items: prev.items.map((it) => (it.id === updated.id ? updated : it)),
      }));
      setIsFormOpen(false);
    }
  };

  // 단어 삭제
  const handleDelete = async (id: string) => {
    if (!confirm('이 단어를 삭제하시겠습니까?')) return;

    try {
      await deleteVocabularyAction(id);
    } catch {
      // fallback
    }

    const idx = SAMPLE_VOCABULARY.findIndex((v) => v.id === id);
    if (idx !== -1) SAMPLE_VOCABULARY.splice(idx, 1);

    setData((prev) => ({
      ...prev,
      items: prev.items.filter((item) => item.id !== id),
      total: Math.max(0, prev.total - 1),
    }));
    setSelectedVocab(null);
  };

  return (
    <div className="mx-auto max-w-2xl space-y-5">
      {/* 헤더 타이틀 */}
      <div>
        <h2 className="text-2xl font-bold tracking-tight">단어장</h2>
        <p className="text-sm text-muted-foreground mt-1">
          학습할 영어 단어를 등록하고 관리하세요
        </p>
      </div>

      {/* 상세 보기 또는 목록 보기 */}
      {selectedVocab ? (
        <VocabularyDetail
          vocab={selectedVocab}
          onBack={() => setSelectedVocab(null)}
          onEdit={() => handleOpenEdit(selectedVocab)}
          onDelete={() => handleDelete(selectedVocab.id)}
        />
      ) : (
        <VocabularyList
          initialData={data}
          onAddClick={handleOpenCreate}
          onItemClick={(vocab) => setSelectedVocab(vocab)}
          onSearch={handleSearch}
          isLoading={isLoading}
        />
      )}

      {/* 추가/수정 모달 다이얼로그 */}
      <VocabularyFormDialog
        open={isFormOpen}
        onOpenChange={setIsFormOpen}
        onSubmit={handleFormSubmit}
        initialData={editData}
        mode={formMode}
      />
    </div>
  );
}
