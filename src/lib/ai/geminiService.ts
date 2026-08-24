// ===========================
// Google Gemini AI Service (Word Analysis & Contextual Translation)
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

const GEMINI_STORAGE_KEY = 'study_quest_gemini_api_key';

/**
 * 활성화된 Gemini API Key 조회 (LocalStorage 우선 -> 환경변수)
 */
export function getGeminiApiKey(): string {
  if (typeof window !== 'undefined') {
    const saved = localStorage.getItem(GEMINI_STORAGE_KEY);
    if (saved && saved.trim()) return saved.trim();
  }
  return process.env.NEXT_PUBLIC_GEMINI_API_KEY || '';
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

const GEMINI_MODELS = ['gemini-3.6-flash', 'gemini-2.5-flash', 'gemini-1.5-flash'];

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

  const prompt = `You are an expert English-Korean educational lexicographer for Korean middle/high school students and CSAT (수능).
Analyze the English word or idiom/phrase: "${cleanWord}"${contextSentence ? ` in the context of: "${contextSentence}"` : ''}.

Strict Guidelines:
1. "meaning": Provide 1~3 standard, essential Korean definitions for students (e.g. "journaling" -> "일기 쓰기, 일지 작성", NOT simple phonetic transliteration like "저널링"). Do NOT include English text or grammar fragments.
2. "partOfSpeech": One of ['n.', 'v.', 'adj.', 'adv.', 'prep.', 'conj.', 'phr.'].
3. "pronunciation": Korean phonetic spelling in square brackets (e.g. "[저널링]", "[애플]").
4. "exampleSentence": A clear, natural English sentence demonstrating this exact word/phrase.
5. "exampleTranslation": Fluent Korean translation of the example sentence.
6. "synonyms": 1~3 comma-separated English synonyms.
7. "antonyms": 1~2 comma-separated English antonyms (if applicable, else empty string).

Respond ONLY with a valid JSON object matching this schema without any markdown formatting or code blocks:
{
  "word": "${cleanWord}",
  "meaning": "...",
  "partOfSpeech": "n.",
  "pronunciation": "[...]",
  "exampleSentence": "...",
  "exampleTranslation": "...",
  "synonyms": "...",
  "antonyms": "..."
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
          const parsed = JSON.parse(rawText) as GeminiWordAnalysis;
          if (parsed && parsed.meaning) {
            return {
              word: cleanWord,
              meaning: parsed.meaning.trim(),
              partOfSpeech: parsed.partOfSpeech || 'n.',
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

/**
 * 이미지 소스(File/Blob/DataURL)를 Base64 데이터 및 mimeType으로 변환
 */
async function toBase64Data(source: File | Blob | string): Promise<{ mimeType: string; data: string }> {
  if (typeof source === 'string') {
    if (source.startsWith('data:')) {
      const match = source.match(/^data:([^;]+);base64,(.+)$/);
      if (match) {
        return { mimeType: match[1], data: match[2] };
      }
    }
    // 일반 URL인 경우 fetch로 blob 변환
    const res = await fetch(source);
    const blob = await res.blob();
    return toBase64Data(blob);
  }

  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const result = reader.result as string;
      const match = result.match(/^data:([^;]+);base64,(.+)$/);
      if (match) {
        resolve({ mimeType: match[1], data: match[2] });
      } else {
        resolve({ mimeType: source.type || 'image/jpeg', data: result });
      }
    };
    reader.onerror = reject;
    reader.readAsDataURL(source);
  });
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
    base64Obj = await toBase64Data(imageSource);
  } catch (e) {
    console.warn('Failed to convert image to base64 for Gemini Vision:', e);
    return null;
  }

  const prompt = `You are a world-class OCR and Educational English AI for Korean students.
Carefully examine the provided image (which may be a vocabulary table, vocabulary list, textbook page, or reading passage).

Tasks:
1. Detect whether this is a Vocabulary Table / List (with English words/phrases and Korean meanings) or a Reading Passage.
2. If it is a Vocabulary Table/List:
   - Extract EVERY row accurately.
   - Separate SINGLE WORDS (e.g. "convenient", "devise", "assemble", "interaction", "hardship") from MULTI-WORD IDIOMS/PHRASES (e.g. "out of sync", "when it comes to", "take turns", "put on hold", "in person").
   - If Korean meanings are printed in the image (e.g. "편리한, 간편한", "동시에 이뤄지지 않는, 조화를 이루지 못하는", "창안[고안]하다"), USE THE EXACT KOREAN MEANING PRINTED IN THE IMAGE!
   - If Korean meaning is not printed, generate a standard educational Korean meaning.
   - Filter out broken/partial syllables or OCR artifacts (e.g., do NOT extract "ter", "fai", "erin").
3. If it is a Reading Passage:
   - Extract the full English passage text accurately.
   - Split into clean sentences.
   - Extract key vocabulary words and idioms with standard Korean definitions.

Respond ONLY with a JSON object strictly matching this schema without code fences or markdown:
{
  "rawText": "full plain text extracted from image",
  "passageText": "full clean passage text (or empty if it is a pure vocabulary table)",
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
      const timeoutId = setTimeout(() => controller.abort(), 15000);

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
          const parsed = JSON.parse(rawJson) as GeminiOcrVisionResult;
          if (parsed && ((parsed.words && parsed.words.length > 0) || (parsed.phrases && parsed.phrases.length > 0) || parsed.passageText)) {
            return {
              rawText: parsed.rawText || '',
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

