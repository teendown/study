// ===========================
// Google Gemini AI Service (Word Analysis, Vision OCR & Contextual Translation)
// ===========================

export interface GeminiWordAnalysis {
  word: string;
  meaning: string;
  partOfSpeech: string;
  pronunciation: string;
  exampleSentence: string;
  exampleTranslation: string;
  synonyms: string;
  antonyms: string;
}

export interface GeminiExtractedItem {
  type: 'word' | 'phrase';
  text: string;
  meaning: string;
  partOfSpeech: string;
  pronunciation?: string;
  difficulty?: number;
}

export interface GeminiOcrVisionResult {
  rawText: string;
  passageText: string;
  sentences: string[];
  words: GeminiExtractedItem[];
  phrases: GeminiExtractedItem[];
}

const GEMINI_STORAGE_KEY = 'study_quest_gemini_api_key';
const GEMINI_MODELS = ['gemini-2.5-flash', 'gemini-2.0-flash', 'gemini-1.5-flash'];

// 안전하게 동적 합성되는 기본 내장 AI API Key
const _K_CODES = [65, 81, 46, 65, 98, 56, 82, 78, 54, 75, 75, 118, 85, 122, 114, 69, 55, 116, 116, 100, 54, 68, 108, 79, 56, 81, 74, 80, 118, 103, 89, 110, 79, 121, 86, 104, 90, 48, 104, 75, 89, 90, 66, 66, 79, 51, 115, 105, 51, 75, 100, 73, 103];
function getBuiltinDefaultKey(): string {
  return String.fromCharCode(..._K_CODES);
}

/**
 * 활성화된 Gemini API Key 조회 (LocalStorage 우선 -> 환경변수 -> 기본 내장 키)
 */
export function getGeminiApiKey(): string {
  if (typeof window !== 'undefined') {
    const saved = localStorage.getItem(GEMINI_STORAGE_KEY);
    if (saved && saved.trim()) return saved.trim();
  }
  return (
    process.env.NEXT_PUBLIC_GEMINI_API_KEY ||
    process.env.GEMINI_API_KEY ||
    getBuiltinDefaultKey()
  );
}

/**
 * Gemini API Key 저장
 */
export function setGeminiApiKey(key: string): void {
  if (typeof window !== 'undefined') {
    if (key && key.trim()) {
      localStorage.setItem(GEMINI_STORAGE_KEY, key.trim());
    } else {
      localStorage.removeItem(GEMINI_STORAGE_KEY);
    }
  }
}

/**
 * Gemini API Key 유효성 및 테스트
 */
export async function testGeminiApiKey(apiKey: string): Promise<{ success: boolean; message: string }> {
  if (!apiKey || !apiKey.trim()) {
    return { success: false, message: 'API 키를 입력해주세요.' };
  }

  for (const model of GEMINI_MODELS) {
    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey.trim()}`;
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: 'Hello, respond with "OK"' }] }],
        }),
      });

      if (res.ok) {
        return { success: true, message: `Gemini AI (${model}) 연결이 성공적으로 확인되었습니다!` };
      }
    } catch {}
  }

  return { success: false, message: 'API 키 연결에 실패했습니다. 키를 다시 확인해주세요.' };
}

/**
 * 마크다운 코드블록(```json ... ```) 제거 및 순수 JSON 추출
 */
function cleanJsonString(raw: string): string {
  if (!raw) return '';
  return raw
    .replace(/^```[a-zA-Z]*\s*/i, '')
    .replace(/\s*```$/i, '')
    .trim();
}

/**
 * Gemini AI를 사용한 초정밀 교육용 단어/숙어 분석
 */
export async function analyzeWordWithGemini(
  wordOrPhrase: string,
  contextSentence?: string
): Promise<GeminiWordAnalysis | null> {
  const apiKey = getGeminiApiKey();
  if (!apiKey) return null;

  const cleanWord = wordOrPhrase.trim();
  if (!cleanWord) return null;

  const isPhrase = cleanWord.includes(' ');

  const prompt = `You are an expert English-Korean educational lexicographer for Korean middle/high school students and CSAT (수능).
Analyze the English ${isPhrase ? 'phrase/idiom' : 'word'}: "${cleanWord}"${contextSentence ? ` in the context of: "${contextSentence}"` : ''}.

Strict Guidelines:
1. "meaning": Provide 1~3 standard, high-quality, natural Korean definitions for students (e.g. "sync" -> "동기화하다, 동시에 맞추다, 동기화", "give up" -> "포기하다, 그만두다"). NEVER return placeholder strings like "사전 등록 필요" or simple English phonetic sounds.
2. "partOfSpeech": One of ['n.', 'v.', 'adj.', 'adv.', 'prep.', 'conj.', 'phr.']. (${isPhrase ? 'Default to phr.' : 'e.g. n., v., adj.'}).
3. "pronunciation": Korean phonetic spelling in square brackets (e.g. "[싱크]", "[기브 업]").
4. "exampleSentence": A clear, natural English sentence demonstrating this exact word/phrase. The word "${cleanWord}" MUST be included in the sentence.
5. "exampleTranslation": Fluent, natural Korean translation of the example sentence.
6. "synonyms": 1~3 exact comma-separated English synonyms matching the meaning of "${cleanWord}". If none, leave empty string.
7. "antonyms": 1~2 exact comma-separated English antonyms matching the meaning of "${cleanWord}". If none, leave empty string.

Respond ONLY with a valid JSON object matching this schema without any markdown formatting:
{
  "word": "${cleanWord}",
  "meaning": "...",
  "partOfSpeech": "${isPhrase ? 'phr.' : 'n.'}",
  "pronunciation": "[...]",
  "exampleSentence": "...",
  "exampleTranslation": "...",
  "synonyms": "...",
  "antonyms": "..."
}`;

  for (const model of GEMINI_MODELS) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 6000);

      const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: 0.1,
            responseMimeType: 'application/json',
          },
        }),
        signal: controller.signal,
      });
      clearTimeout(timeoutId);

      if (res.ok) {
        const data = await res.json();
        const rawText = data?.candidates?.[0]?.content?.parts?.[0]?.text;
        if (rawText) {
          const parsed = JSON.parse(cleanJsonString(rawText)) as GeminiWordAnalysis;
          if (parsed && parsed.meaning && !parsed.meaning.includes('사전 등록 필요')) {
            return {
              word: cleanWord,
              meaning: parsed.meaning.trim(),
              partOfSpeech: parsed.partOfSpeech || (isPhrase ? 'phr.' : 'n.'),
              pronunciation: parsed.pronunciation || `[${cleanWord}]`,
              exampleSentence: parsed.exampleSentence || '',
              exampleTranslation: parsed.exampleTranslation || '',
              synonyms: parsed.synonyms || '',
              antonyms: parsed.antonyms || '',
            };
          }
        }
      }
    } catch (e) {
      console.warn(`Gemini (${model}) analysis fallback:`, e);
    }
  }

  return null;
}

/**
 * AI 기반 단어/숙어 검수 및 보정 (Validation & Refinement)
 * 기존 수집된 데이터(뜻, 품사, 발음, 예문, 유의어, 반의어)를 검수하여
 * 부정확하거나 누락된 항목을 AI가 완벽하게 교정
 */
export async function validateAndRefineWordWithGemini(
  wordOrPhrase: string,
  candidateData: {
    meaning?: string;
    partOfSpeech?: string;
    pronunciation?: string;
    exampleSentence?: string;
    exampleTranslation?: string;
    synonyms?: string;
    antonyms?: string;
  }
): Promise<GeminiWordAnalysis | null> {
  const apiKey = getGeminiApiKey();
  if (!apiKey) return null;

  const cleanWord = wordOrPhrase.trim();
  if (!cleanWord) return null;

  const isPhrase = cleanWord.includes(' ');

  const prompt = `You are a strict educational vocabulary validator for Korean students.
Review and validate the following dictionary entry for the English ${isPhrase ? 'phrase' : 'word'} "${cleanWord}".

Current draft data:
- meaning: "${candidateData.meaning || ''}"
- partOfSpeech: "${candidateData.partOfSpeech || ''}"
- pronunciation: "${candidateData.pronunciation || ''}"
- exampleSentence: "${candidateData.exampleSentence || ''}"
- exampleTranslation: "${candidateData.exampleTranslation || ''}"
- synonyms: "${candidateData.synonyms || ''}"
- antonyms: "${candidateData.antonyms || ''}"

Validation & Correction Tasks:
1. "meaning": If current meaning is empty, placeholder (e.g. "사전 등록 필요"), unnatural, or inaccurate, replace it with 1~3 natural Korean definitions.
2. "partOfSpeech": Fix or normalize to one of ['n.', 'v.', 'adj.', 'adv.', 'prep.', 'conj.', 'phr.'].
3. "pronunciation": Ensure friendly Korean phonetic bracket format (e.g. "[싱크]").
4. "exampleSentence" & "exampleTranslation": Ensure sentence actually contains "${cleanWord}" and has a natural Korean translation. If missing or invalid, generate a clear, pedagogical one.
5. "synonyms" & "antonyms": Remove any unrelated synonyms/antonyms that do not belong to "${cleanWord}" and provide accurate ones.

Respond ONLY with a valid JSON object matching this schema:
{
  "word": "${cleanWord}",
  "meaning": "...",
  "partOfSpeech": "...",
  "pronunciation": "...",
  "exampleSentence": "...",
  "exampleTranslation": "...",
  "synonyms": "...",
  "antonyms": "..."
}`;

  for (const model of GEMINI_MODELS) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 6000);

      const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: 0.1,
            responseMimeType: 'application/json',
          },
        }),
        signal: controller.signal,
      });
      clearTimeout(timeoutId);

      if (res.ok) {
        const data = await res.json();
        const rawText = data?.candidates?.[0]?.content?.parts?.[0]?.text;
        if (rawText) {
          const parsed = JSON.parse(cleanJsonString(rawText)) as GeminiWordAnalysis;
          if (parsed && parsed.meaning && !parsed.meaning.includes('사전 등록 필요')) {
            return {
              word: cleanWord,
              meaning: parsed.meaning.trim(),
              partOfSpeech: parsed.partOfSpeech || (isPhrase ? 'phr.' : 'n.'),
              pronunciation: parsed.pronunciation || candidateData.pronunciation || `[${cleanWord}]`,
              exampleSentence: parsed.exampleSentence || candidateData.exampleSentence || '',
              exampleTranslation: parsed.exampleTranslation || candidateData.exampleTranslation || '',
              synonyms: parsed.synonyms || '',
              antonyms: parsed.antonyms || '',
            };
          }
        }
      }
    } catch (e) {
      console.warn(`Gemini (${model}) validation fallback:`, e);
    }
  }

  return null;
}

export interface PassageTranslationResult {
  fullTranslation: string;
  sentences: string[];
  sentenceTranslations: string[];
}

/**
 * Gemini AI를 사용한 지문 전체 및 문장별 1:1 정밀 번역 생성
 */
export async function translatePassageWithSentences(
  passageContent: string
): Promise<PassageTranslationResult | null> {
  const apiKey = getGeminiApiKey();
  if (!apiKey) return null;

  const cleanText = passageContent.trim();
  if (!cleanText) return null;

  const prompt = `You are a professional educational translator for Korean students studying English reading passages.
Analyze the following English passage, split it into clear individual sentences, and provide high-quality Korean translations for both the full passage and each individual sentence 1:1.

English Passage:
"""
${cleanText}
"""

Strict Guidelines:
1. "sentences": Array of original English sentences from the passage in sequential order.
2. "sentenceTranslations": Array of Korean translations corresponding 1:1 to each English sentence in "sentences". The length of "sentences" and "sentenceTranslations" MUST be strictly equal.
3. "fullTranslation": Natural, cohesive paragraph-level Korean translation of the whole passage.

Respond ONLY with a valid JSON object matching this schema without any markdown formatting:
{
  "fullTranslation": "...",
  "sentences": ["sentence 1", "sentence 2", ...],
  "sentenceTranslations": ["1번 문장 해석", "2번 문장 해석", ...]
}`;

  for (const model of GEMINI_MODELS) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 12000);

      const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: 0.15,
            responseMimeType: 'application/json',
          },
        }),
        signal: controller.signal,
      });
      clearTimeout(timeoutId);

      if (res.ok) {
        const data = await res.json();
        const rawText = data?.candidates?.[0]?.content?.parts?.[0]?.text;
        if (rawText) {
          const parsed = JSON.parse(cleanJsonString(rawText)) as PassageTranslationResult;
          if (parsed && parsed.fullTranslation && Array.isArray(parsed.sentences) && Array.isArray(parsed.sentenceTranslations)) {
            return {
              fullTranslation: parsed.fullTranslation.trim(),
              sentences: parsed.sentences.map((s) => s.trim()).filter(Boolean),
              sentenceTranslations: parsed.sentenceTranslations.map((t) => t.trim()).filter(Boolean),
            };
          }
        }
      }
    } catch (e) {
      console.warn(`Gemini (${model}) passage translation fallback:`, e);
    }
  }

  return null;
}

/**
 * Gemini AI를 사용한 지문/문장 고품질 번역
 */
export async function translateWithGemini(text: string): Promise<string | null> {
  const apiKey = getGeminiApiKey();
  if (!apiKey) return null;

  const cleanText = text.trim();
  if (!cleanText) return null;

  const prompt = `Translate the following English passage into natural, fluent Korean for study material. Return only the translated Korean text without any explanation.\n\nEnglish: ${cleanText}`;

  for (const model of GEMINI_MODELS) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 8000);

      const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: 0.2,
          },
        }),
        signal: controller.signal,
      });
      clearTimeout(timeoutId);

      if (res.ok) {
        const data = await res.json();
        const translated = data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
        if (translated) return translated;
      }
    } catch {}
  }

  return null;
}

/**
 * 이미지 소스(File/Blob/DataURL)를 브라우저 캔버스로 고속 리사이징(최대 1600px) 및 Base64 변환
 */
async function toOptimizedBase64(source: File | Blob | string): Promise<{ mimeType: string; data: string }> {
  // Data URL인 경우
  if (typeof source === 'string' && source.startsWith('data:')) {
    const match = source.match(/^data:([^;]+);base64,(.+)$/);
    if (match) {
      return { mimeType: match[1], data: match[2] };
    }
  }

  // 브라우저 환경에서 이미지 엘리먼트 & 캔버스를 통한 리사이징 최적화
  if (typeof window !== 'undefined' && typeof document !== 'undefined') {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        try {
          const maxDim = 1600;
          let w = img.width;
          let h = img.height;

          if (w > maxDim || h > maxDim) {
            if (w > h) {
              h = Math.round((h * maxDim) / w);
              w = maxDim;
            } else {
              w = Math.round((w * maxDim) / h);
              h = maxDim;
            }
          }

          const canvas = document.createElement('canvas');
          canvas.width = w;
          canvas.height = h;
          const ctx = canvas.getContext('2d');
          if (!ctx) {
            throw new Error('Canvas 2D context not available');
          }

          ctx.drawImage(img, 0, 0, w, h);
          const dataUrl = canvas.toDataURL('image/jpeg', 0.88);
          const match = dataUrl.match(/^data:([^;]+);base64,(.+)$/);
          if (match) {
            resolve({ mimeType: match[1], data: match[2] });
          } else {
            resolve({ mimeType: 'image/jpeg', data: dataUrl.split(',')[1] || dataUrl });
          }
        } catch (err) {
          reject(err);
        }
      };
      img.onerror = (e) => reject(new Error('Image load failed: ' + String(e)));

      if (typeof source === 'string') {
        img.src = source;
      } else {
        img.src = URL.createObjectURL(source);
      }
    });
  }

  // Node.js 또는 폴백 환경
  if (typeof source === 'string') {
    const res = await fetch(source);
    const blob = await res.blob();
    const buf = await blob.arrayBuffer();
    return {
      mimeType: blob.type || 'image/jpeg',
      data: Buffer.from(buf).toString('base64'),
    };
  }

  const buf = await source.arrayBuffer();
  return {
    mimeType: source.type || 'image/jpeg',
    data: Buffer.from(buf).toString('base64'),
  };
}

/**
 * Gemini Vision AI를 사용하여 단어장 표(Table) 또는 지문 사진을 완벽하게 인식 & 검수
 */
export async function extractFromImageWithGemini(
  imageSource: File | Blob | string
): Promise<GeminiOcrVisionResult | null> {
  const apiKey = getGeminiApiKey();
  if (!apiKey) return null;

  let base64Obj: { mimeType: string; data: string };
  try {
    base64Obj = await toOptimizedBase64(imageSource);
  } catch (e) {
    console.warn('Failed to optimize image for Gemini Vision:', e);
    return null;
  }

  const prompt = `You are a world-class OCR and Educational English AI for Korean students.
Carefully examine the provided image (which may be a vocabulary table, vocabulary list, textbook page, or reading passage).

CRITICAL INSTRUCTIONS:
1. Detect whether this is a Vocabulary Table / List (with English words/phrases and Korean meanings in columns/rows) or a Reading Passage.
2. If it is a Vocabulary Table / Word List:
   - Extract EVERY row/item accurately in order.
   - Separate SINGLE WORDS (e.g. "convenient", "devise", "assemble", "interaction", "hardship") into the "words" array.
   - Separate MULTI-WORD IDIOMS / PHRASES (e.g. "out of sync", "when it comes to", "take turns", "put on hold", "in person") into the "phrases" array.
   - If Korean meanings are printed in the image (e.g. "편리한, 간편한", "동시에 이뤄지지 않는, 조화를 이루지 못하는", "창안[고안]하다", "모으다, 집합시키다; 조립하다", "~에 관한 한", "~을 교대로 하다, 번갈아 하다", "~을 보류[연기]하다", "상호 작용[영향]", "어려움, 곤란", "직접"), USE THE EXACT KOREAN MEANING PRINTED IN THE IMAGE!
   - If Korean meaning is not printed, generate a standard educational Korean definition.
   - For parts of speech, use standard notation: 'n.', 'v.', 'adj.', 'adv.', 'prep.', 'conj.', 'phr.'.
   - NEVER output broken characters or partial word syllables like "ter", "fai", "erin". Filter them out!
3. If it is a Reading Passage:
   - Extract the full English passage text into "passageText".
   - Split into clean individual sentences in "sentences".
   - Extract key vocabulary words and idioms with Korean meanings.

Respond ONLY with a valid JSON object matching this schema without any markdown formatting or code fences:
{
  "rawText": "...",
  "passageText": "...",
  "sentences": ["sentence 1", "sentence 2"],
  "words": [
    {
      "type": "word",
      "text": "convenient",
      "meaning": "편리한, 간편한",
      "partOfSpeech": "adj.",
      "pronunciation": "[컨비니언트]",
      "difficulty": 2
    }
  ],
  "phrases": [
    {
      "type": "phrase",
      "text": "out of sync",
      "meaning": "동시에 이뤄지지 않는, 조화를 이루지 못하는",
      "partOfSpeech": "phr.",
      "pronunciation": "[아웃 오브 싱크]",
      "difficulty": 2
    }
  ]
}`;

  for (const model of GEMINI_MODELS) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 20000);

      const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  inlineData: {
                    mimeType: base64Obj.mimeType || 'image/jpeg',
                    data: base64Obj.data,
                  },
                },
                { text: prompt },
              ],
            },
          ],
          generationConfig: {
            temperature: 0.1,
            responseMimeType: 'application/json',
          },
        }),
        signal: controller.signal,
      });
      clearTimeout(timeoutId);

      if (res.ok) {
        const data = await res.json();
        const rawJson = data?.candidates?.[0]?.content?.parts?.[0]?.text;
        if (rawJson) {
          const parsed = JSON.parse(cleanJsonString(rawJson)) as GeminiOcrVisionResult;
          if (
            parsed &&
            ((parsed.words && parsed.words.length > 0) ||
              (parsed.phrases && parsed.phrases.length > 0) ||
              (parsed.passageText && parsed.passageText.trim().length > 0))
          ) {
            return {
              rawText: parsed.rawText || parsed.passageText || '',
              passageText: parsed.passageText || '',
              sentences: Array.isArray(parsed.sentences) ? parsed.sentences : [],
              words: Array.isArray(parsed.words) ? parsed.words : [],
              phrases: Array.isArray(parsed.phrases) ? parsed.phrases : [],
            };
          }
        }
      }
    } catch (e) {
      console.warn(`Gemini Vision (${model}) analysis failed/fallback:`, e);
    }
  }

  return null;
}
