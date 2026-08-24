// ===========================
// English Phrase & Idiom Dictionary and Automatic Matcher
// ===========================
// 중·고등 및 수능/모의고사 필수 숙어, 구동사(Phrasal Verbs), 연어(Collocations) 내장 사전

export interface PhraseDictEntry {
  phrase: string; // 원형 숙어 표기 (예: "contribute to")
  meaning: string; // 한글 뜻
  difficulty: number; // 난이도 (1: 기초, 2: 중급, 3: 고급)
  aliases?: string[]; // 변형 또는 관련 형태
  regex?: RegExp; // 유연한 문맥/시제 매칭용 정규식
}

export const BUILTIN_PHRASE_DICTIONARY: PhraseDictEntry[] = [
  // ── A ──
  {
    phrase: 'according to',
    meaning: '~에 따르면, ~에 의하면',
    difficulty: 1,
    regex: /\baccording\s+to\b/i,
  },
  {
    phrase: 'account for',
    meaning: '~을 설명하다, (비율을) 차지하다',
    difficulty: 2,
    regex: /\b(account|accounts|accounted|accounting)\s+for\b/i,
  },
  {
    phrase: 'adapt to',
    meaning: '~에 적응하다, 맞추다',
    difficulty: 2,
    regex: /\b(adapt|adapts|adapted|adapting)\s+to\b/i,
  },
  {
    phrase: 'agree with',
    meaning: '~에 동의하다, 부합하다',
    difficulty: 1,
    regex: /\b(agree|agrees|agreed|agreeing)\s+with\b/i,
  },
  {
    phrase: 'aim at',
    meaning: '~을 겨냥하다, 목표로 하다',
    difficulty: 2,
    regex: /\b(aim|aims|aimed|aiming)\s+at\b/i,
  },
  {
    phrase: 'allow for',
    meaning: '~을 고려하다, 감안하다',
    difficulty: 2,
    regex: /\b(allow|allows|allowed|allowing)\s+for\b/i,
  },
  {
    phrase: 'all over the world',
    meaning: '전 세계에, 도처에',
    difficulty: 1,
    regex: /\ball\s+over\s+the\s+world\b/i,
  },
  {
    phrase: 'apply to',
    meaning: '~에 적용되다, 지원하다',
    difficulty: 2,
    regex: /\b(apply|applies|applied|applying)\s+to\b/i,
  },
  {
    phrase: 'as a result',
    meaning: '결과적으로, 그 결과',
    difficulty: 1,
    regex: /\bas\s+a\s+result(\s+of)?\b/i,
  },
  {
    phrase: 'as long as',
    meaning: '~하는 한, ~하기만 하면',
    difficulty: 2,
    regex: /\bas\s+long\s+as\b/i,
  },
  {
    phrase: 'as soon as',
    meaning: '~하자마자',
    difficulty: 1,
    regex: /\bas\s+soon\s+as\b/i,
  },
  {
    phrase: 'as well as',
    meaning: '~뿐만 아니라, ~도 마찬가지로',
    difficulty: 1,
    regex: /\bas\s+well\s+as\b/i,
  },
  {
    phrase: 'at all costs',
    meaning: '무슨 수를 써서라도, 기필코',
    difficulty: 3,
    regex: /\bat\s+all\s+costs?\b/i,
  },
  {
    phrase: 'at first',
    meaning: '처음에는',
    difficulty: 1,
    regex: /\bat\s+first\b/i,
  },
  {
    phrase: 'at least',
    meaning: '적어도, 최소한',
    difficulty: 1,
    regex: /\bat\s+least\b/i,
  },
  {
    phrase: 'at the same time',
    meaning: '동시에, 한편으로는',
    difficulty: 1,
    regex: /\bat\s+the\s+same\s+time\b/i,
  },

  // ── B ──
  {
    phrase: 'based on',
    meaning: '~에 근거하여, 바탕을 둔',
    difficulty: 1,
    regex: /\b(base|bases|based|basing)\s+on\b/i,
  },
  {
    phrase: 'because of',
    meaning: '~때문에, ~로 인하여',
    difficulty: 1,
    regex: /\bbecause\s+of\b/i,
  },
  {
    phrase: 'belong to',
    meaning: '~에 속하다, 소유이다',
    difficulty: 1,
    regex: /\b(belong|belongs|belonged|belonging)\s+to\b/i,
  },
  {
    phrase: 'break down',
    meaning: '고장 나다, 분해되다, 무너지다',
    difficulty: 2,
    regex: /\b(break|breaks|broke|broken|breaking)\s+down\b/i,
  },
  {
    phrase: 'bring about',
    meaning: '~을 초래하다, 야기하다',
    difficulty: 2,
    regex: /\b(bring|brings|brought|bringing)\s+about\b/i,
  },
  {
    phrase: 'bring up',
    meaning: '(화제를) 꺼내다, 기르다',
    difficulty: 2,
    regex: /\b(bring|brings|brought|bringing)\s+up\b/i,
  },
  {
    phrase: 'by means of',
    meaning: '~에 의하여, ~의 수단으로',
    difficulty: 3,
    regex: /\bby\s+means\s+of\b/i,
  },
  {
    phrase: 'by the way',
    meaning: '그런데, 그나저나',
    difficulty: 1,
    regex: /\bby\s+the\s+way\b/i,
  },

  // ── C ──
  {
    phrase: 'call off',
    meaning: '취소하다, 중단하다',
    difficulty: 2,
    regex: /\b(call|calls|called|calling)\s+off\b/i,
  },
  {
    phrase: 'care for',
    meaning: '~을 돌보다, 좋아하다',
    difficulty: 1,
    regex: /\b(care|cares|cared|caring)\s+for\b/i,
  },
  {
    phrase: 'carry on',
    meaning: '계속하다, 진행하다',
    difficulty: 2,
    regex: /\b(carry|carries|carried|carrying)\s+on\b/i,
  },
  {
    phrase: 'carry out',
    meaning: '수행하다, 실행하다',
    difficulty: 2,
    regex: /\b(carry|carries|carried|carrying)\s+out\b/i,
  },
  {
    phrase: 'catch up with',
    meaning: '~을 따라잡다',
    difficulty: 2,
    regex: /\b(catch|catches|caught|catching)\s+up\s+with\b/i,
  },
  {
    phrase: 'climate change',
    meaning: '기후 변화',
    difficulty: 1,
    regex: /\bclimate\s+change\b/i,
  },
  {
    phrase: 'come across',
    meaning: '우연히 마주치다, 발견하다',
    difficulty: 2,
    regex: /\b(come|comes|came|coming)\s+across\b/i,
  },
  {
    phrase: 'come up with',
    meaning: '(아이디어 등을) 생각해내다, 제안하다',
    difficulty: 2,
    regex: /\b(come|comes|came|coming)\s+up\s+with\b/i,
  },
  {
    phrase: 'consist of',
    meaning: '~으로 구성되다, 이루어지다',
    difficulty: 2,
    regex: /\b(consist|consists|consisted|consisting)\s+of\b/i,
  },
  {
    phrase: 'contribute to',
    meaning: '~에 기여하다, 원인이 되다',
    difficulty: 2,
    regex: /\b(contribute|contributes|contributed|contributing)\s+to\b/i,
  },
  {
    phrase: 'cope with',
    meaning: '~에 대처하다, 극복하다',
    difficulty: 2,
    regex: /\b(cope|copes|coped|coping)\s+with\b/i,
  },
  {
    phrase: 'count on',
    meaning: '~을 믿다, 의지하다',
    difficulty: 2,
    regex: /\b(count|counts|counted|counting)\s+on\b/i,
  },
  {
    phrase: 'cut down on',
    meaning: '~을 줄이다, 삭감하다',
    difficulty: 2,
    regex: /\b(cut|cuts|cutting)\s+down\s+on\b/i,
  },

  // ── D ──
  {
    phrase: 'daily life',
    meaning: '일상 생활',
    difficulty: 1,
    regex: /\bdaily\s+li(fe|ves)\b/i,
  },
  {
    phrase: 'deal with',
    meaning: '~을 다루다, 처리하다',
    difficulty: 1,
    regex: /\b(deal|deals|dealt|dealing)\s+with\b/i,
  },
  {
    phrase: 'depend on',
    meaning: '~에 의존하다, ~에 달려있다',
    difficulty: 1,
    regex: /\b(depend|depends|depended|depending)\s+on\b/i,
  },
  {
    phrase: 'differ from',
    meaning: '~와 다르다',
    difficulty: 2,
    regex: /\b(differ|differs|differed|differing)\s+from\b/i,
  },
  {
    phrase: 'due to',
    meaning: '~로 인하여, ~때문에',
    difficulty: 1,
    regex: /\bdue\s+to\b/i,
  },

  // ── E ──
  {
    phrase: 'end up',
    meaning: '결국 ~하게 되다',
    difficulty: 2,
    regex: /\b(end|ends|ended|ending)\s+up\b/i,
  },
  {
    phrase: 'even though',
    meaning: '비록 ~일지라도',
    difficulty: 1,
    regex: /\beven\s+though\b/i,
  },
  {
    phrase: 'every day',
    meaning: '매일, 날마다',
    difficulty: 1,
    regex: /\bevery\s+day\b/i,
  },

  // ── F ──
  {
    phrase: 'fall apart',
    meaning: '산산조각 나다, 결딴나다',
    difficulty: 2,
    regex: /\b(fall|falls|fell|fallen|falling)\s+apart\b/i,
  },
  {
    phrase: 'figure out',
    meaning: '알아내다, 이해하다, 해결하다',
    difficulty: 2,
    regex: /\b(figure|figures|figured|figuring)\s+out\b/i,
  },
  {
    phrase: 'find out',
    meaning: '알아내다, 발견하다',
    difficulty: 1,
    regex: /\b(find|finds|found|finding)\s+out\b/i,
  },
  {
    phrase: 'focus on',
    meaning: '~에 집중하다, 초점을 맞추다',
    difficulty: 1,
    regex: /\b(focus|focuses|focused|focusing)\s+on\b/i,
  },
  {
    phrase: 'for example',
    meaning: '예를 들어',
    difficulty: 1,
    regex: /\bfor\s+example\b/i,
  },
  {
    phrase: 'for instance',
    meaning: '예를 들면',
    difficulty: 1,
    regex: /\bfor\s+instance\b/i,
  },
  {
    phrase: 'fossil fuel',
    meaning: '화석 연료',
    difficulty: 1,
    regex: /\bfossil\s+fuels?\b/i,
  },

  // ── G ──
  {
    phrase: 'get along with',
    meaning: '~와 사이좋게 지내다',
    difficulty: 2,
    regex: /\b(get|gets|got|getting)\s+along\s+with\b/i,
  },
  {
    phrase: 'give in',
    meaning: '굴복하다, 양보하다',
    difficulty: 2,
    regex: /\b(give|gives|gave|given|giving)\s+in\b/i,
  },
  {
    phrase: 'give up',
    meaning: '포기하다, 그만두다',
    difficulty: 1,
    regex: /\b(give|gives|gave|given|giving)\s+up\b/i,
  },
  {
    phrase: 'go on',
    meaning: '계속하다, 일어나다',
    difficulty: 1,
    regex: /\b(go|goes|went|gone|going)\s+on\b/i,
  },
  {
    phrase: 'greenhouse gas',
    meaning: '온실가스',
    difficulty: 2,
    regex: /\bgreenhouse\s+gas(es)?\b/i,
  },
  {
    phrase: 'grow up',
    meaning: '성장하다, 자라다',
    difficulty: 1,
    regex: /\b(grow|grows|grew|grown|growing)\s+up\b/i,
  },

  // ── H ──
  {
    phrase: 'have an effect on',
    meaning: '~에 영향을 미치다',
    difficulty: 2,
    regex: /\b(have|has|had|having)\s+an?\s+(effect|impact|influence)\s+on\b/i,
  },
  {
    phrase: 'hold on',
    meaning: '기다리다, 버티다',
    difficulty: 1,
    regex: /\b(hold|holds|held|holding)\s+on\b/i,
  },

  // ── I ──
  {
    phrase: 'in accordance with',
    meaning: '~에 따라, 부합하여',
    difficulty: 3,
    regex: /\bin\s+accordance\s+with\b/i,
  },
  {
    phrase: 'in addition to',
    meaning: '~에 더하여, 게다가',
    difficulty: 2,
    regex: /\bin\s+addition(\s+to)?\b/i,
  },
  {
    phrase: 'in advance',
    meaning: '미리, 사전에',
    difficulty: 2,
    regex: /\bin\s+advance\b/i,
  },
  {
    phrase: 'in contrast',
    meaning: '대조적으로, 반면에',
    difficulty: 2,
    regex: /\bin\s+contrast(\s+to|\s+with)?\b/i,
  },
  {
    phrase: 'in order to',
    meaning: '~하기 위하여',
    difficulty: 1,
    regex: /\bin\s+order\s+to\b/i,
  },
  {
    phrase: 'in response to',
    meaning: '~에 응답하여, 대응하여',
    difficulty: 2,
    regex: /\bin\s+response\s+to\b/i,
  },
  {
    phrase: 'in shape',
    meaning: '건강한, 몸 상태가 좋은',
    difficulty: 2,
    regex: /\b(in|out\s+of)\s+shape\b/i,
  },
  {
    phrase: 'in spite of',
    meaning: '~에도 불구하고',
    difficulty: 2,
    regex: /\bin\s+spite\s+of\b/i,
  },
  {
    phrase: 'in terms of',
    meaning: '~의 관점에서, ~에 관하여',
    difficulty: 2,
    regex: /\bin\s+terms\s+of\b/i,
  },
  {
    phrase: 'instead of',
    meaning: '~대신에',
    difficulty: 1,
    regex: /\binstead\s+of\b/i,
  },

  // ── K ──
  {
    phrase: 'keep in mind',
    meaning: '명심하다, 유념하다',
    difficulty: 2,
    regex: /\b(keep|keeps|kept|keeping)\s+in\s+mind\b/i,
  },
  {
    phrase: 'keep up with',
    meaning: '~에 뒤처지지 않고 따라가다',
    difficulty: 2,
    regex: /\b(keep|keeps|kept|keeping)\s+up\s+with\b/i,
  },

  // ── L ──
  {
    phrase: 'lead to',
    meaning: '~로 이어지다, 초래하다',
    difficulty: 1,
    regex: /\b(lead|leads|led|leading)\s+to\b/i,
  },
  {
    phrase: 'look after',
    meaning: '~을 돌보다',
    difficulty: 1,
    regex: /\b(look|looks|looked|looking)\s+after\b/i,
  },
  {
    phrase: 'look down on',
    meaning: '~을 얕보다, 무시하다',
    difficulty: 2,
    regex: /\b(look|looks|looked|looking)\s+down\s+on\b/i,
  },
  {
    phrase: 'look forward to',
    meaning: '~을 고대하다, 기대하다',
    difficulty: 2,
    regex: /\b(look|looks|looked|looking)\s+forward\s+to\b/i,
  },
  {
    phrase: 'look into',
    meaning: '조사하다, 살펴보다',
    difficulty: 2,
    regex: /\b(look|looks|looked|looking)\s+into\b/i,
  },
  {
    phrase: 'look up to',
    meaning: '~을 존경하다',
    difficulty: 2,
    regex: /\b(look|looks|looked|looking)\s+up\s+to\b/i,
  },

  // ── M ──
  {
    phrase: 'make sense',
    meaning: '이치에 맞다, 말이 되다',
    difficulty: 1,
    regex: /\b(make|makes|made|making)\s+sense\b/i,
  },
  {
    phrase: 'make sure',
    meaning: '확실히 하다, 확인하다',
    difficulty: 1,
    regex: /\b(make|makes|made|making)\s+sure\b/i,
  },
  {
    phrase: 'make up for',
    meaning: '~을 보상하다, 만회하다',
    difficulty: 2,
    regex: /\b(make|makes|made|making)\s+up\s+for\b/i,
  },
  {
    phrase: 'more and more',
    meaning: '점점 더 많은',
    difficulty: 1,
    regex: /\bmore\s+and\s+more\b/i,
  },
  {
    phrase: 'more or less',
    meaning: '거의, 대략',
    difficulty: 2,
    regex: /\bmore\s+or\s+less\b/i,
  },

  // ── N ──
  {
    phrase: 'no longer',
    meaning: '더 이상 ~아닌',
    difficulty: 1,
    regex: /\bno\s+longer\b/i,
  },

  // ── O ──
  {
    phrase: 'on behalf of',
    meaning: '~을 대표하여, 대신하여',
    difficulty: 3,
    regex: /\bon\s+behalf\s+of\b/i,
  },
  {
    phrase: 'on the contrary',
    meaning: '그와는 반대로',
    difficulty: 2,
    regex: /\bon\s+the\s+contrary\b/i,
  },
  {
    phrase: 'on the other hand',
    meaning: '다른 한편으로는, 반면에',
    difficulty: 1,
    regex: /\bon\s+the\s+other\s+hand\b/i,
  },

  // ── P ──
  {
    phrase: 'participate in',
    meaning: '~에 참여하다, 참가하다',
    difficulty: 2,
    regex: /\b(participate|participates|participated|participating)\s+in\b/i,
  },
  {
    phrase: 'pass away',
    meaning: '돌아가시다, 사망하다',
    difficulty: 2,
    regex: /\b(pass|passes|passed|passing)\s+away\b/i,
  },
  {
    phrase: 'pay attention to',
    meaning: '~에 주의를 기울이다',
    difficulty: 1,
    regex: /\b(pay|pays|paid|paying)\s+attention\s+to\b/i,
  },
  {
    phrase: 'play a role in',
    meaning: '~에서 역할을 하다',
    difficulty: 2,
    regex: /\b(play|plays|played|playing)\s+a\s+(key\s+|major\s+|vital\s+|critical\s+|significant\s+)?role\s+in\b/i,
  },
  {
    phrase: 'point out',
    meaning: '지적하다, 언급하다',
    difficulty: 2,
    regex: /\b(point|points|pointed|pointing)\s+out\b/i,
  },
  {
    phrase: 'put off',
    meaning: '미루다, 연기하다',
    difficulty: 2,
    regex: /\b(put|puts|putting)\s+off\b/i,
  },
  {
    phrase: 'put up with',
    meaning: '~을 참다, 견디다',
    difficulty: 2,
    regex: /\b(put|puts|putting)\s+up\s+with\b/i,
  },

  // ── R ──
  {
    phrase: 'refer to',
    meaning: '~을 언급하다, 참조하다',
    difficulty: 2,
    regex: /\b(refer|refers|referred|referring)\s+to\b/i,
  },
  {
    phrase: 'rely on',
    meaning: '~에 의존하다, 신뢰하다',
    difficulty: 1,
    regex: /\b(rely|relies|relied|relying)\s+on\b/i,
  },
  {
    phrase: 'result from',
    meaning: '~에서 기인하다, 비롯되다',
    difficulty: 2,
    regex: /\b(result|results|resulted|resulting)\s+from\b/i,
  },
  {
    phrase: 'result in',
    meaning: '~을 낳다, 야기하다',
    difficulty: 2,
    regex: /\b(result|results|resulted|resulting)\s+in\b/i,
  },
  {
    phrase: 'run out of',
    meaning: '~이 바닥나다, 다 떨어지다',
    difficulty: 2,
    regex: /\b(run|runs|ran|running)\s+out\s+of\b/i,
  },

  // ── S ──
  {
    phrase: 'set up',
    meaning: '설립하다, 준비하다',
    difficulty: 1,
    regex: /\b(set|sets|setting)\s+up\b/i,
  },
  {
    phrase: 'show up',
    meaning: '나타나다, 참석하다',
    difficulty: 1,
    regex: /\b(show|shows|showed|shown|showing)\s+up\b/i,
  },
  {
    phrase: 'so as to',
    meaning: '~하기 위하여',
    difficulty: 2,
    regex: /\bso\s+as\s+to\b/i,
  },
  {
    phrase: 'stand for',
    meaning: '~을 나타내다, 지지하다',
    difficulty: 2,
    regex: /\b(stand|stands|stood|standing)\s+for\b/i,
  },
  {
    phrase: 'stick to',
    meaning: '~을 고수하다, 달라붙다',
    difficulty: 2,
    regex: /\b(stick|sticks|stuck|sticking)\s+to\b/i,
  },
  {
    phrase: 'succeed in',
    meaning: '~에 성공하다',
    difficulty: 1,
    regex: /\b(succeed|succeeds|succeeded|succeeding)\s+in\b/i,
  },
  {
    phrase: 'such as',
    meaning: '~와 같은',
    difficulty: 1,
    regex: /\bsuch\s+as\b/i,
  },
  {
    phrase: 'suffer from',
    meaning: '~로 고통받다, 겪다',
    difficulty: 2,
    regex: /\b(suffer|suffers|suffered|suffering)\s+from\b/i,
  },

  // ── T ──
  {
    phrase: 'take action',
    meaning: '조치를 취하다, 행동에 나서다',
    difficulty: 2,
    regex: /\b(take|takes|took|taken|taking)\s+(immediate\s+|collective\s+|decisive\s+)?action\b/i,
  },
  {
    phrase: 'take advantage of',
    meaning: '~을 활용하다, 이용하다',
    difficulty: 2,
    regex: /\b(take|takes|took|taken|taking)\s+advantage\s+of\b/i,
  },
  {
    phrase: 'take care of',
    meaning: '~을 돌보다, 처리하다',
    difficulty: 1,
    regex: /\b(take|takes|took|taken|taking)\s+care\s+of\b/i,
  },
  {
    phrase: 'take part in',
    meaning: '~에 참가하다',
    difficulty: 1,
    regex: /\b(take|takes|took|taken|taking)\s+part\s+in\b/i,
  },
  {
    phrase: 'take place',
    meaning: '일어나다, 개최되다',
    difficulty: 1,
    regex: /\b(take|takes|took|taken|taking)\s+place\b/i,
  },
  {
    phrase: 'turn down',
    meaning: '거절하다, (소리를) 줄이다',
    difficulty: 2,
    regex: /\b(turn|turns|turned|turning)\s+down\b/i,
  },
  {
    phrase: 'turn out',
    meaning: '~임이 밝혀지다, 드러나다',
    difficulty: 2,
    regex: /\b(turn|turns|turned|turning)\s+out\b/i,
  },

  // ── W ──
  {
    phrase: 'with regard to',
    meaning: '~에 관하여',
    difficulty: 3,
    regex: /\bwith\s+regard\s+to\b/i,
  },
  {
    phrase: 'work out',
    meaning: '운동하다, 잘 풀리다, 계산하다',
    difficulty: 1,
    regex: /\b(work|works|worked|working)\s+out\b/i,
  },
];

export interface ExtractedPhraseResult {
  phrase: string;
  matchedText: string;
  meaning: string;
  difficulty: number;
}

/**
 * 지문 원문 텍스트에서 포함된 모든 숙어/연어/구동사를 추출합니다. (개수 무제한)
 */
export function extractEnglishPhrases(rawText: string): ExtractedPhraseResult[] {
  if (!rawText || typeof rawText !== 'string') return [];

  const cleanText = rawText.replace(/\s+/g, ' ');
  const results: ExtractedPhraseResult[] = [];
  const foundPhrases = new Set<string>();

  for (const entry of BUILTIN_PHRASE_DICTIONARY) {
    if (foundPhrases.has(entry.phrase)) continue;

    let matched = false;
    let matchedText = entry.phrase;

    if (entry.regex) {
      const match = cleanText.match(entry.regex);
      if (match) {
        matched = true;
        matchedText = match[0];
      }
    } else {
      const idx = cleanText.toLowerCase().indexOf(entry.phrase.toLowerCase());
      if (idx !== -1) {
        matched = true;
        matchedText = cleanText.slice(idx, idx + entry.phrase.length);
      }
    }

    if (matched) {
      foundPhrases.add(entry.phrase);
      results.push({
        phrase: entry.phrase,
        matchedText,
        meaning: entry.meaning,
        difficulty: entry.difficulty,
      });
    }
  }

  return results;
}
