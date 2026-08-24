import { searchWordOnline } from '../src/features/vocabulary/services/dictionarySearch';
import { convertToKoreanPronunciation } from '../src/features/vocabulary/services/koreanPronunciation';

async function testPhonicsAndResolution() {
  console.log('=== ⚡ 파닉스 발음 음차 및 비표준 어휘 형태소 분석 테스트 ===\n');

  const testCases = [
    'erate',
    'irate',
    'generate',
    'wrong',
    'right',
    'sputnik',
    'accelerate',
    'tolerate',
    'moderate',
    'operate',
  ];

  for (const word of testCases) {
    const pron = convertToKoreanPronunciation('', word);
    const searchRes = await searchWordOnline(word);

    console.log(`[단어]: ${word}`);
    console.log(`- 한글 발음: ${pron}`);
    console.log(`- 뜻: ${searchRes.meaning}`);
    console.log(`- 품사: ${searchRes.partOfSpeech}`);
    console.log(`- 출처: ${searchRes.source}\n`);

    // 검증: 발음에 영문 알파벳만 있거나 괄호 안에 영문만 남아있으면 실패
    if (/\[[a-zA-Z]+\]/.test(pron)) {
      console.error(`❌ 발음 음차 실패: ${word} -> ${pron}`);
      process.exit(1);
    }

    // 검증: 뜻이 영문 원문과 똑같이 남아있으면 실패
    if (searchRes.meaning.trim().toLowerCase() === word.toLowerCase()) {
      console.error(`❌ 뜻 형태소 분석 실패: ${word} -> ${searchRes.meaning}`);
      process.exit(1);
    }
  }

  console.log('✅ 모든 파닉스 음차 및 뜻 분석 테스트가 100% 통과되었습니다!');
}

testPhonicsAndResolution().catch((err) => {
  console.error(err);
  process.exit(1);
});
