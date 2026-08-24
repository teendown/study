import { config } from 'dotenv';
config({ path: '.env.local' });

import { createClient } from '@libsql/client';
import { sanitizeMeaningText } from '../src/features/vocabulary/services/dictionarySearch';
import { BUILTIN_DICTIONARY, lookupWordMeaning } from '../src/lib/ocr/dictionary';
import { COMPREHENSIVE_PHRASE_DICTIONARY } from '../src/lib/ocr/phraseDictionary';

interface IssueReport {
  target: string;
  id?: string;
  word: string;
  originalMeaning: string;
  fixedMeaning: string;
  extractedEx?: string;
  extractedExTrans?: string;
  reason: string;
}

/**
 * 뜻 필드에서 순수 정의만 추출하고 예문/예문번역을 깔끔히 분리
 */
function cleanMeaningAndExtractExample(
  rawMeaning: string,
  word: string,
  currentEx?: string,
  currentExTrans?: string
) {
  let exSentence = currentEx && currentEx !== 'null' ? currentEx : '';
  let exTrans = currentExTrans && currentExTrans !== 'null' ? currentExTrans : '';
  const definitions: string[] = [];

  const segments = rawMeaning.split(/[,;\n\r]+/).map((s) => s.trim()).filter(Boolean);

  for (const seg of segments) {
    // 1. 영어 예문 + 한국어 번역 구조 (예: "That is not right. 그것은 옳지 않다.", "I hope you feel better. 빨리 쾌차하세요.")
    const engKrMatch = seg.match(/^([a-zA-Z0-9\s,.'’"!?–—~-]+)\s{1,}([가-힣\s,.'~?!]+)$/);
    if (engKrMatch) {
      if (!exSentence) exSentence = engKrMatch[1].trim();
      if (!exTrans) exTrans = engKrMatch[2].replace(/^[.,\s]+|[.,\s]+$/g, '').trim();
      continue;
    }

    // 2. 단어 + 예문 복합 구조 (예: "overcome difficulties 어려움을 극복하다")
    if (/[a-zA-Z]{2,}\s+[a-zA-Z]{2,}/.test(seg) && /[가-힣]/.test(seg)) {
      const engPart = seg.match(/^[a-zA-Z0-9\s,.'’"!?–—~-]+/);
      const krPart = seg.replace(/^[a-zA-Z0-9\s,.'’"!?–—~-]+/, '').trim();
      if (engPart && !exSentence) exSentence = engPart[0].trim();
      if (krPart && !exTrans) exTrans = krPart.replace(/^[.,\s]+|[.,\s]+$/g, '').trim();
      continue;
    }

    // 3. 순수 영문인 경우 스킵
    if (!/[가-힣]/.test(seg)) continue;

    // 4. 번호 매김 제거 (예: "1-1. 권력", "1-2. 통제")
    let cleaned = seg.replace(/^\d+[-.]\d+[\.\s]*/, '').replace(/^\d+[\.\s]*/, '').trim();

    // 5. 대상 영단어 단독 스포일러 제거
    if (word && word.length >= 2) {
      const escaped = word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      cleaned = cleaned.replace(new RegExp(`\\b${escaped}\\b`, 'gi'), '').trim();
    }

    // 6. 구두점 정리 (물결표 ~는 숙어용으로 보존)
    cleaned = cleaned
      .replace(/^[.,;:\s]+|[.,;:\s]+$/g, '')
      .replace(/\s+/g, ' ')
      .trim();

    if (cleaned && !definitions.includes(cleaned)) {
      definitions.push(cleaned);
    }
  }

  let finalMeaning = definitions.join(', ');

  // 만약 내장 사전에 완벽한 표준 정의가 있고, 추출된 뜻이 비어있거나 부족한 경우 내장 사전 활용
  const builtin = lookupWordMeaning(word.toLowerCase()) || BUILTIN_DICTIONARY[word.toLowerCase()];
  if (builtin && builtin.meaning) {
    if (!finalMeaning || finalMeaning === '의 과거분사' || finalMeaning === '의 현재분사' || definitions.length === 0) {
      finalMeaning = builtin.meaning;
    }
  }

  // 문법 설명만 남은 경우 (예: "give 의 과거분사" -> "주다(give)의 과거분사, 주어진")
  if (finalMeaning.includes('과거분사') || finalMeaning.includes('현재분사') || finalMeaning.includes('동명사')) {
    const baseMatch = rawMeaning.match(/([a-zA-Z]+)\s*의\s*(과거분사|현재분사|동명사)/i);
    if (baseMatch) {
      const baseWord = baseMatch[1].toLowerCase();
      const baseEntry = lookupWordMeaning(baseWord) || BUILTIN_DICTIONARY[baseWord];
      if (baseEntry && baseEntry.meaning) {
        finalMeaning = `${baseEntry.meaning} (${baseWord}의 ${baseMatch[2]})`;
      }
    }
  }

  // 구두점 최종 정리
  finalMeaning = finalMeaning
    .replace(/\s*[\.,;]+\s*[\.,;]+/g, ', ')
    .replace(/\s*,\s*/g, ', ')
    .replace(/^[.,;:\s]+|[.,;:\s]+$/g, '')
    .trim();

  return {
    finalMeaning: finalMeaning || rawMeaning,
    exSentence: exSentence || null,
    exTrans: exTrans || null,
  };
}

async function main() {
  console.log('🚀 [전체 단어 & 숙어 전수 정밀 점검 및 서버 업로드 시작]\n');

  const url = process.env.TURSO_DATABASE_URL;
  const authToken = process.env.TURSO_AUTH_TOKEN;

  if (!url) {
    console.error('❌ TURSO_DATABASE_URL이 설정되어 있지 않습니다.');
    process.exit(1);
  }

  const client = createClient({ url, authToken });
  const issues: IssueReport[] = [];

  // 1. vocabularies 테이블 점검 및 업데이트
  console.log('🌐 [1/2] Turso 원격 서버 단어(vocabularies) 점검 및 업데이트...');
  const vocabRes = await client.execute('SELECT * FROM vocabularies');
  console.log(`  총 ${vocabRes.rows.length}개 단어 레코드 검사 중...`);

  let vocabUpdated = 0;

  for (const row of vocabRes.rows) {
    const id = String(row.id);
    const word = String(row.word || '');
    const rawMeaning = String(row.meaning || '');
    const currentEx = String(row.example_sentence || '');
    const currentExTrans = String(row.example_translation || '');

    const { finalMeaning, exSentence, exTrans } = cleanMeaningAndExtractExample(
      rawMeaning,
      word,
      currentEx,
      currentExTrans
    );

    const isMeaningChanged = finalMeaning !== rawMeaning;
    const isExChanged = (exSentence || '') !== (currentEx === 'null' || !currentEx ? '' : currentEx);
    const isExTransChanged = (exTrans || '') !== (currentExTrans === 'null' || !currentExTrans ? '' : currentExTrans);

    if (isMeaningChanged || isExChanged || isExTransChanged) {
      let reason = '불필요한 구두점(.,) 및 스포일러 영문자 제거';
      if (rawMeaning.includes('That is not right') || rawMeaning.includes('feel better') || rawMeaning.includes('Read this book')) {
        reason = '뜻 필드에 예문(영문+번역)이 통째로 섞여 들어감';
      } else if (rawMeaning.includes('과거분사') || rawMeaning.includes('현재분사')) {
        reason = '단어 실질 뜻 누락 및 분사/변형 문법 설명 단독 표기';
      }

      issues.push({
        target: 'TURSO_VOCABULARIES',
        id,
        word,
        originalMeaning: rawMeaning,
        fixedMeaning: finalMeaning,
        extractedEx: exSentence || undefined,
        extractedExTrans: exTrans || undefined,
        reason,
      });

      await client.execute({
        sql: `UPDATE vocabularies SET meaning = ?, example_sentence = ?, example_translation = ?, updated_at = ? WHERE id = ?`,
        args: [finalMeaning, exSentence, exTrans, new Date().toISOString(), id],
      });
      vocabUpdated++;
    }
  }

  console.log(`  ✅ 단어(vocabularies) ${vocabUpdated}개 결함 수정 및 서버 동기화 완료!\n`);

  // 2. phrases 테이블 점검 및 업데이트
  console.log('🌐 [2/2] Turso 원격 서버 숙어(phrases) 점검 및 업데이트...');
  let phraseUpdated = 0;
  const phraseRes = await client.execute('SELECT * FROM phrases');
  console.log(`  총 ${phraseRes.rows.length}개 숙어 레코드 검사 중...`);

  for (const row of phraseRes.rows) {
    const id = String(row.id);
    const phrase = String(row.phrase || '');
    const rawMeaning = String(row.meaning || '');
    const currentEx = String(row.example_sentence || '');
    const currentExTrans = String(row.example_translation || '');

    const { finalMeaning, exSentence, exTrans } = cleanMeaningAndExtractExample(
      rawMeaning,
      phrase,
      currentEx,
      currentExTrans
    );

    const isMeaningChanged = finalMeaning !== rawMeaning;
    const isExChanged = (exSentence || '') !== (currentEx === 'null' || !currentEx ? '' : currentEx);
    const isExTransChanged = (exTrans || '') !== (currentExTrans === 'null' || !currentExTrans ? '' : currentExTrans);

    if (isMeaningChanged || isExChanged || isExTransChanged) {
      let reason = '불필요한 구두점(.,) 및 스포일러 영문자 제거';
      if (rawMeaning.includes('<차로 사람을>')) {
        reason = '특수문자 및 불필요한 마침표 포함';
      }

      issues.push({
        target: 'TURSO_PHRASES',
        id,
        word: phrase,
        originalMeaning: rawMeaning,
        fixedMeaning: finalMeaning,
        extractedEx: exSentence || undefined,
        extractedExTrans: exTrans || undefined,
        reason,
      });

      await client.execute({
        sql: `UPDATE phrases SET meaning = ?, example_sentence = ?, example_translation = ?, updated_at = ? WHERE id = ?`,
        args: [finalMeaning, exSentence, exTrans, new Date().toISOString(), id],
      });
      phraseUpdated++;
    }
  }

  console.log(`  ✅ 숙어(phrases) ${phraseUpdated}개 결함 수정 및 서버 동기화 완료!\n`);

  console.log('═══════════════════════════════════════════════════════════════');
  console.log(`🎉 [최종 완료 보고] 총 ${issues.length}개의 데이터 결함을 수정하여 원격 서버 DB에 즉시 업로드했습니다.`);
  console.log('═══════════════════════════════════════════════════════════════\n');

  issues.forEach((item, index) => {
    console.log(`[#${index + 1}] [${item.target}] "${item.word}" (ID: ${item.id})`);
    console.log(`  - 결함 원인: ${item.reason}`);
    console.log(`  - 기존 뜻: "${item.originalMeaning}"`);
    console.log(`  - 정제된 뜻: "${item.fixedMeaning}"`);
    if (item.extractedEx) {
      console.log(`  - 분리 저장된 예문: "${item.extractedEx}" (${item.extractedExTrans || '해석 없음'})`);
    }
    console.log('───────────────────────────────────────────────────────────────');
  });
}

main().catch((err) => {
  console.error('❌ 실행 중 에러 발생:', err);
  process.exit(1);
});
