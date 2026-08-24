import { searchPhraseOnline, searchWordOnline } from '../src/features/vocabulary/services/dictionarySearch';

async function testPhraseSearch() {
  console.log('=== ⚡ 숙어 전용 검색 및 단어 검색 분리 테스트 ===\n');

  const phraseCases = [
    'account for',
    'take care of',
    'give up',
    'look forward to',
    'carry out',
    'make sense',
    'as a result',
    'in spite of',
  ];

  for (const phr of phraseCases) {
    const res = await searchPhraseOnline(phr);
    console.log(`[숙어]: "${phr}"`);
    console.log(`- 뜻: ${res.meaning}`);
    console.log(`- 품사: ${res.partOfSpeech}`);
    console.log(`- 발음: "${res.pronunciation}" (공백이어야 함)`);
    console.log(`- 출처: ${res.source}\n`);

    // 1. 뜻 검증: 발음 음차나 비표준 어휘 메시지가 들어있으면 실패
    if (res.meaning.includes('비표준 어휘') || res.meaning.includes('철자 확인') || /^[\[\w\s]+$/.test(res.meaning)) {
      console.error(`❌ 잘못된 숙어 뜻: "${phr}" -> "${res.meaning}"`);
      process.exit(1);
    }

    // 2. 발음 검증: 숙어는 발음이 빈 문자열이어야 함
    if (res.pronunciation !== '') {
      console.error(`❌ 숙어에 발음이 포함됨: "${phr}" -> "${res.pronunciation}"`);
      process.exit(1);
    }
  }

  console.log('--- searchWordOnline으로 숙어 입력 시에도 자동 위임되는지 테스트 ---');
  const autoDelegationRes = await searchWordOnline('account for');
  console.log(`[단어 검색기로 숙어 입력]: "account for"`);
  console.log(`- 뜻: ${autoDelegationRes.meaning}`);
  console.log(`- 발음: "${autoDelegationRes.pronunciation}"`);
  console.log(`- 출처: ${autoDelegationRes.source}\n`);

  if (autoDelegationRes.meaning.includes('비표준 어휘') || autoDelegationRes.pronunciation !== '') {
    console.error(`❌ 자동 위임 실패: "account for" -> 뜻: ${autoDelegationRes.meaning}, 발음: ${autoDelegationRes.pronunciation}`);
    process.exit(1);
  }

  console.log('✅ 모든 숙어 검색 및 분리 테스트가 100% 성공했습니다!');
}

testPhraseSearch().catch((err) => {
  console.error(err);
  process.exit(1);
});
