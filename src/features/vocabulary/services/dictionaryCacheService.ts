// ===========================
// Two-tier Smart Dictionary Cache Service (Memory + LocalStorage)
// ===========================
// AI API 호출 비용 절감 및 0ms 초고속 재검색을 위한 지능형 캐시 계층

import type { WordSearchResult } from './dictionarySearch';

const CACHE_STORAGE_KEY = 'study_quest_dict_cache_v1';
const CACHE_TTL_MS = 1000 * 60 * 60 * 24 * 7; // 7일 유효
const MAX_CACHE_ENTRIES = 500; // 최대 500개 유지

interface CacheEntry {
  data: WordSearchResult;
  timestamp: number;
}

// 1차: 메모리 램 캐시
const memoryCache = new Map<string, CacheEntry>();

/**
 * 로컬스토리지에서 캐시 데이터 로드
 */
function loadStorageCache(): Record<string, CacheEntry> {
  if (typeof window === 'undefined') return {};
  try {
    const raw = localStorage.getItem(CACHE_STORAGE_KEY);
    if (!raw) return {};
    return JSON.parse(raw);
  } catch {
    return {};
  }
}

/**
 * 로컬스토리지에 캐시 데이터 저장
 */
function saveStorageCache(cacheObj: Record<string, CacheEntry>) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(CACHE_STORAGE_KEY, JSON.stringify(cacheObj));
  } catch {}
}

/**
 * 캐시에서 단어/숙어 검색 결과 조회
 */
export function getCachedSearchResult(wordOrPhrase: string): WordSearchResult | null {
  if (!wordOrPhrase) return null;
  const key = wordOrPhrase.trim().toLowerCase();

  // 1. 메모리 캐시 확인
  const inMem = memoryCache.get(key);
  if (inMem) {
    if (Date.now() - inMem.timestamp < CACHE_TTL_MS) {
      return inMem.data;
    } else {
      memoryCache.delete(key);
    }
  }

  // 2. LocalStorage 캐시 확인
  const storageCache = loadStorageCache();
  const inStorage = storageCache[key];
  if (inStorage) {
    if (Date.now() - inStorage.timestamp < CACHE_TTL_MS) {
      // 메모리 캐시에 승격
      memoryCache.set(key, inStorage);
      return inStorage.data;
    }
  }

  return null;
}

/**
 * 검색 결과를 캐시에 저장
 */
export function setCachedSearchResult(wordOrPhrase: string, data: WordSearchResult) {
  if (!wordOrPhrase || !data || !data.meaning || data.meaning.includes('직접 입력')) return;
  const key = wordOrPhrase.trim().toLowerCase();

  const entry: CacheEntry = {
    data,
    timestamp: Date.now(),
  };

  // 1. 메모리 캐시 저장
  memoryCache.set(key, entry);

  // 2. LocalStorage 저장
  const storageCache = loadStorageCache();
  storageCache[key] = entry;

  // 용량 제한 관리 (최대 500개 초과 시 오래된 것 삭제)
  const keys = Object.keys(storageCache);
  if (keys.length > MAX_CACHE_ENTRIES) {
    keys.sort((a, b) => storageCache[a].timestamp - storageCache[b].timestamp);
    const keysToRemove = keys.slice(0, keys.length - MAX_CACHE_ENTRIES);
    for (const k of keysToRemove) {
      delete storageCache[k];
    }
  }

  saveStorageCache(storageCache);
}
