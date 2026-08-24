// ===========================
// High-Precision English Phrase, Idiom & Collocation Engine (400+ Essential Patterns)
// ===========================
// 중·고교 교과서, 수능, 모의고사, EBS 수능특강/완성, 토익 필수 숙어/구동사/연어 총망라
// 유연한 시제 변화, 수일치, be동사 변형, 중간 수식어(부사/형용사) 삽입 매칭 지원

export interface PhraseDictEntry {
  phrase: string; // 표준 원형 숙어 (예: "contribute to", "be likely to")
  meaning: string; // 한국어 뜻
  difficulty: number; // 1: 초/중급, 2: 고등/수능, 3: 심화
  pattern: RegExp; // 유연한 정규식 패턴
}

// ── 보조 패턴 생성 헬퍼 함수 ──
// be동사 변형 패턴 (is, am, are, was, were, be, being, been)
const BE = '(?:am|is|are|was|were|be|being|been)';
// 선택적 수식 부사 (greatly, significantly, largely, etc.)
const ADV = '(?:\\s+[a-z]+ly|\\s+primarily|\\s+largely|\\s+mostly|\\s+deeply|\\s+strongly|\\s+heavily|\\s+partly|\\s+well)?';
// 선택적 수식 형용사 (great, major, important, vital, key, critical, huge, positive, negative, etc.)
const ADJ = '(?:\\s+[a-z]+)?';

export const COMPREHENSIVE_PHRASE_DICTIONARY: PhraseDictEntry[] = [
  // ── A ──
  { phrase: 'a couple of', meaning: '둘의, 몇몇의', difficulty: 1, pattern: /\ba\s+couple\s+of\b/i },
  { phrase: 'a great deal of', meaning: '다량의, 많은', difficulty: 2, pattern: /\ba\s+great\s+deal\s+of\b/i },
  { phrase: 'a lack of', meaning: '~의 부족, 결핍', difficulty: 2, pattern: /\ba\s+lack\s+of\b/i },
  { phrase: 'a lot of', meaning: '많은', difficulty: 1, pattern: /\ba\s+lot\s+of\b/i },
  { phrase: 'a number of', meaning: '많은, 다수의', difficulty: 1, pattern: /\ba\s+number\s+of\b/i },
  { phrase: 'a series of', meaning: '일련의, 연속적인', difficulty: 2, pattern: /\ba\s+series\s+of\b/i },
  { phrase: 'a variety of', meaning: '다양한', difficulty: 1, pattern: /\ba\s+variety\s+of\b/i },
  { phrase: 'according to', meaning: '~에 따르면, ~에 의하면', difficulty: 1, pattern: /\baccording\s+to\b/i },
  { phrase: 'account for', meaning: '~을 설명하다, (비율을) 차지하다', difficulty: 2, pattern: new RegExp(`\\b(account|accounts|accounted|accounting)${ADV}\\s+for\\b`, 'i') },
  { phrase: 'adapt to', meaning: '~에 적응하다, 맞추다', difficulty: 2, pattern: new RegExp(`\\b(adapt|adapts|adapted|adapting)${ADV}\\s+to\\b`, 'i') },
  { phrase: 'add up to', meaning: '결국 ~이 되다, 합계가 ~에 달하다', difficulty: 2, pattern: /\b(add|adds|added|adding)\s+up\s+to\b/i },
  { phrase: 'agree to', meaning: '(제안·조건 등에) 동의하다, 승낙하다', difficulty: 1, pattern: /\b(agree|agrees|agreed|agreeing)\s+to\b/i },
  { phrase: 'agree with', meaning: '(사람·의견에) 동의하다, 부합하다', difficulty: 1, pattern: /\b(agree|agrees|agreed|agreeing)\s+with\b/i },
  { phrase: 'aim at', meaning: '~을 겨냥하다, 목표로 하다', difficulty: 2, pattern: /\b(aim|aims|aimed|aiming)\s+at\b/i },
  { phrase: 'all day long', meaning: '하루 종일', difficulty: 1, pattern: /\ball\s+day\s+long\b/i },
  { phrase: 'all in all', meaning: '대체로, 전반적으로', difficulty: 2, pattern: /\ball\s+in\s+all\b/i },
  { phrase: 'all of a sudden', meaning: '갑자기, 난데없이', difficulty: 1, pattern: /\ball\s+of\s+a\s+sudden\b/i },
  { phrase: 'all over the world', meaning: '전 세계에, 온 세상에', difficulty: 1, pattern: /\ball\s+over\s+the\s+world\b/i },
  { phrase: 'all the time', meaning: '항상, 언제나', difficulty: 1, pattern: /\ball\s+the\s+time\b/i },
  { phrase: 'allow for', meaning: '~을 감안하다, 참작하다', difficulty: 2, pattern: /\b(allow|allows|allowed|allowing)\s+for\b/i },
  { phrase: 'along with', meaning: '~와 함께, ~에 덧붙여', difficulty: 1, pattern: /\balong\s+with\b/i },
  { phrase: 'and so on', meaning: '기타 등등', difficulty: 1, pattern: /\band\s+so\s+on\b/i },
  { phrase: 'appeal to', meaning: '~에 호소하다, 매력적이다', difficulty: 2, pattern: /\b(appeal|appeals|appealed|appealing)\s+to\b/i },
  { phrase: 'apply for', meaning: '(직장·허가 등에) 지원하다, 신청하다', difficulty: 1, pattern: /\b(apply|applies|applied|applying)\s+for\b/i },
  { phrase: 'apply to', meaning: '~에 적용되다, 해당하다', difficulty: 2, pattern: /\b(apply|applies|applied|applying)\s+to\b/i },
  { phrase: 'as a matter of fact', meaning: '사실은, 실은', difficulty: 2, pattern: /\bas\s+a\s+matter\s+of\s+fact\b/i },
  { phrase: 'as a result', meaning: '결과적으로, 그 결과', difficulty: 1, pattern: /\bas\s+a\s+result(\s+of)?\b/i },
  { phrase: 'as a whole', meaning: '전체로서, 전체적으로', difficulty: 2, pattern: /\bas\s+a\s+whole\b/i },
  { phrase: 'as far as', meaning: '~하는 한, ~까지', difficulty: 2, pattern: /\bas\s+far\s+as\b/i },
  { phrase: 'as follows', meaning: '다음과 같이', difficulty: 2, pattern: /\bas\s+follows\b/i },
  { phrase: 'as if', meaning: '마치 ~인 것처럼', difficulty: 1, pattern: /\bas\s+if\b/i },
  { phrase: 'as long as', meaning: '~하는 한, ~하기만 하면', difficulty: 2, pattern: /\bas\s+long\s+as\b/i },
  { phrase: 'as soon as', meaning: '~하자마자', difficulty: 1, pattern: /\bas\s+soon\s+as\b/i },
  { phrase: 'as to', meaning: '~에 관하여, ~에 대해', difficulty: 2, pattern: /\bas\s+to\b/i },
  { phrase: 'as well', meaning: '또한, 역시', difficulty: 1, pattern: /\bas\s+well\b/i },
  { phrase: 'as well as', meaning: '~뿐만 아니라', difficulty: 1, pattern: /\bas\s+well\s+as\b/i },
  { phrase: 'ask for', meaning: '~을 요청하다, 부탁하다', difficulty: 1, pattern: /\b(ask|asks|asked|asking)\s+for\b/i },
  { phrase: 'at all costs', meaning: '무슨 수를 써서라도, 기필코', difficulty: 3, pattern: /\bat\s+all\s+costs?\b/i },
  { phrase: 'at any rate', meaning: '어쨌든, 하여간', difficulty: 2, pattern: /\bat\s+any\s+rate\b/i },
  { phrase: 'at first', meaning: '처음에는', difficulty: 1, pattern: /\bat\s+first\b/i },
  { phrase: 'at last', meaning: '마침내, 드디어', difficulty: 1, pattern: /\bat\s+last\b/i },
  { phrase: 'at least', meaning: '적어도, 최소한', difficulty: 1, pattern: /\bat\s+least\b/i },
  { phrase: 'at once', meaning: '즉시, 동시에', difficulty: 1, pattern: /\bat\s+once\b/i },
  { phrase: 'at present', meaning: '현재, 지금으로서는', difficulty: 1, pattern: /\bat\s+present\b/i },
  { phrase: 'at the same time', meaning: '동시에, 한편으로는', difficulty: 1, pattern: /\bat\s+the\s+same\s+time\b/i },
  { phrase: 'attribute to', meaning: '~의 탓/덕분으로 돌리다', difficulty: 3, pattern: /\b(attribute|attributes|attributed|attributing)\s+[a-z\s-]+\s+to\b/i },

  // ── B ──
  { phrase: 'back and forth', meaning: '왔다 갔다, 앞뒤로', difficulty: 1, pattern: /\bback\s+and\s+forth\b/i },
  { phrase: 'base on', meaning: '~에 근거를 두다, 바탕으로 하다', difficulty: 1, pattern: new RegExp(`\\b(base|bases|based|basing)${ADV}\\s+on\\b`, 'i') },
  { phrase: 'be able to', meaning: '~할 수 있다', difficulty: 1, pattern: new RegExp(`\\b${BE}${ADV}\\s+able\\s+to\\b`, 'i') },
  { phrase: 'be afraid of', meaning: '~을 두려워하다, 걱정하다', difficulty: 1, pattern: new RegExp(`\\b${BE}\\s+afraid\\s+of\\b`, 'i') },
  { phrase: 'be aware of', meaning: '~을 알고 있다, 의식하다', difficulty: 2, pattern: new RegExp(`\\b${BE}${ADV}\\s+aware\\s+of\\b`, 'i') },
  { phrase: 'be based on', meaning: '~에 기반을 두다, 근거하다', difficulty: 1, pattern: new RegExp(`\\b${BE}${ADV}\\s+based\\s+on\\b`, 'i') },
  { phrase: 'be bound to', meaning: '반드시 ~하게 되다, ~할 의무가 있다', difficulty: 2, pattern: new RegExp(`\\b${BE}\\s+bound\\s+to\\b`, 'i') },
  { phrase: 'be capable of', meaning: '~할 능력이 있다', difficulty: 2, pattern: new RegExp(`\\b${BE}\\s+capable\\s+of\\b`, 'i') },
  { phrase: 'be composed of', meaning: '~으로 구성되다', difficulty: 2, pattern: new RegExp(`\\b${BE}\\s+composed\\s+of\\b`, 'i') },
  { phrase: 'be concerned about', meaning: '~에 대해 걱정하다, 염려하다', difficulty: 2, pattern: new RegExp(`\\b${BE}\\s+concerned\\s+about\\b`, 'i') },
  { phrase: 'be conscious of', meaning: '~을 자각하다, 의식하다', difficulty: 2, pattern: new RegExp(`\\b${BE}\\s+conscious\\s+of\\b`, 'i') },
  { phrase: 'be crowded with', meaning: '~으로 붐비다', difficulty: 1, pattern: new RegExp(`\\b${BE}\\s+crowded\\s+with\\b`, 'i') },
  { phrase: 'be eager to', meaning: '간절히 ~하고 싶어하다', difficulty: 2, pattern: new RegExp(`\\b${BE}\\s+eager\\s+to\\b`, 'i') },
  { phrase: 'be familiar with', meaning: '~에 익숙하다, 잘 알다', difficulty: 2, pattern: new RegExp(`\\b${BE}\\s+familiar\\s+with\\b`, 'i') },
  { phrase: 'be famous for', meaning: '~으로 유명하다', difficulty: 1, pattern: new RegExp(`\\b${BE}\\s+famous\\s+for\\b`, 'i') },
  { phrase: 'be filled with', meaning: '~으로 가득 차다', difficulty: 1, pattern: new RegExp(`\\b${BE}\\s+filled\\s+with\\b`, 'i') },
  { phrase: 'be fond of', meaning: '~을 아주 좋아하다', difficulty: 1, pattern: new RegExp(`\\b${BE}\\s+fond\\s+of\\b`, 'i') },
  { phrase: 'be forced to', meaning: '어쩔 수 없이 ~하다', difficulty: 2, pattern: new RegExp(`\\b${BE}\\s+forced\\s+to\\b`, 'i') },
  { phrase: 'be full of', meaning: '~으로 가득하다', difficulty: 1, pattern: new RegExp(`\\b${BE}\\s+full\\s+of\\b`, 'i') },
  { phrase: 'be good at', meaning: '~을 잘하다, 능숙하다', difficulty: 1, pattern: new RegExp(`\\b${BE}\\s+good\\s+at\\b`, 'i') },
  { phrase: 'be interested in', meaning: '~에 관심이 있다, 흥미가 있다', difficulty: 1, pattern: new RegExp(`\\b${BE}\\s+interested\\s+in\\b`, 'i') },
  { phrase: 'be involved in', meaning: '~에 연루되다, 관여하다', difficulty: 2, pattern: new RegExp(`\\b${BE}${ADV}\\s+involved\\s+in\\b`, 'i') },
  { phrase: 'be known as', meaning: '~로 알려져 있다', difficulty: 1, pattern: new RegExp(`\\b${BE}\\s+known\\s+as\\b`, 'i') },
  { phrase: 'be known for', meaning: '~로 유명하다/알려지다', difficulty: 1, pattern: new RegExp(`\\b${BE}\\s+known\\s+for\\b`, 'i') },
  { phrase: 'be likely to', meaning: '~할 가능성이 높다, ~하기 쉽다', difficulty: 2, pattern: new RegExp(`\\b${BE}${ADV}\\s+likely\\s+to\\b`, 'i') },
  { phrase: 'be made of', meaning: '~으로 만들어지다 (물리적 변화)', difficulty: 1, pattern: new RegExp(`\\b${BE}\\s+made\\s+of\\b`, 'i') },
  { phrase: 'be opposed to', meaning: '~에 반대하다', difficulty: 2, pattern: new RegExp(`\\b${BE}\\s+opposed\\s+to\\b`, 'i') },
  { phrase: 'be proud of', meaning: '~을 자랑스러워하다', difficulty: 1, pattern: new RegExp(`\\b${BE}\\s+proud\\s+of\\b`, 'i') },
  { phrase: 'be related to', meaning: '~와 관련이 있다', difficulty: 2, pattern: new RegExp(`\\b${BE}${ADV}\\s+related\\s+to\\b`, 'i') },
  { phrase: 'be responsible for', meaning: '~에 책임이 있다, 원인이 되다', difficulty: 2, pattern: new RegExp(`\\b${BE}${ADV}\\s+responsible\\s+for\\b`, 'i') },
  { phrase: 'be satisfied with', meaning: '~에 만족하다', difficulty: 1, pattern: new RegExp(`\\b${BE}\\s+satisfied\\s+with\\b`, 'i') },
  { phrase: 'be short of', meaning: '~이 부족하다', difficulty: 1, pattern: new RegExp(`\\b${BE}\\s+short\\s+of\\b`, 'i') },
  { phrase: 'be subject to', meaning: '~의 영향을 받기 쉽다, ~에 지배되다', difficulty: 3, pattern: new RegExp(`\\b${BE}\\s+subject\\s+to\\b`, 'i') },
  { phrase: 'be supposed to', meaning: '~하기로 되어 있다, ~해야 한다', difficulty: 2, pattern: new RegExp(`\\b${BE}\\s+supposed\\s+to\\b`, 'i') },
  { phrase: 'be sure of', meaning: '~을 확신하다', difficulty: 1, pattern: new RegExp(`\\b${BE}\\s+sure\\s+of\\b`, 'i') },
  { phrase: 'be tired of', meaning: '~에 싫증나다, 지치다', difficulty: 1, pattern: new RegExp(`\\b${BE}\\s+tired\\s+of\\b`, 'i') },
  { phrase: 'be used to', meaning: '~에 익숙하다, ~하는 데 사용되다', difficulty: 1, pattern: new RegExp(`\\b${BE}\\s+used\\s+to\\b`, 'i') },
  { phrase: 'be willing to', meaning: '기꺼이 ~하다', difficulty: 2, pattern: new RegExp(`\\b${BE}\\s+willing\\s+to\\b`, 'i') },
  { phrase: 'because of', meaning: '~때문에, ~로 인하여', difficulty: 1, pattern: /\bbecause\s+of\b/i },
  { phrase: 'belong to', meaning: '~에 속하다, 소유이다', difficulty: 1, pattern: /\b(belong|belongs|belonged|belonging)\s+to\b/i },
  { phrase: 'blow up', meaning: '폭발하다, 폭발시키다', difficulty: 2, pattern: /\b(blow|blows|blew|blown|blowing)\s+up\b/i },
  { phrase: 'break down', meaning: '고장 나다, 분해되다, 무너지다', difficulty: 2, pattern: /\b(break|breaks|broke|broken|breaking)\s+down\b/i },
  { phrase: 'break into', meaning: '(건물에) 침입하다, 갑자기 ~하기 시작하다', difficulty: 2, pattern: /\b(break|breaks|broke|broken|breaking)\s+into\b/i },
  { phrase: 'break out', meaning: '(전쟁·화재·질병이) 발발하다, 일어나다', difficulty: 2, pattern: /\b(break|breaks|broke|broken|breaking)\s+out\b/i },
  { phrase: 'break up', meaning: '헤어지다, 부서지다, 해산하다', difficulty: 1, pattern: /\b(break|breaks|broke|broken|breaking)\s+up\b/i },
  { phrase: 'bring about', meaning: '~을 초래하다, 야기하다', difficulty: 2, pattern: /\b(bring|brings|brought|bringing)\s+about\b/i },
  { phrase: 'bring back', meaning: '되돌려주다, 상기시키다', difficulty: 1, pattern: /\b(bring|brings|brought|bringing)\s+back\b/i },
  { phrase: 'bring up', meaning: '(화제를) 꺼내다, (아이를) 기르다', difficulty: 2, pattern: /\b(bring|brings|brought|bringing)\s+up\b/i },
  { phrase: 'by accident', meaning: '우연히, 뜻밖에', difficulty: 1, pattern: /\bby\s+accident\b/i },
  { phrase: 'by all means', meaning: '반드시, 꼭, 아무렴', difficulty: 2, pattern: /\bby\s+all\s+means\b/i },
  { phrase: 'by chance', meaning: '우연히, 어쩌다가', difficulty: 1, pattern: /\bby\s+chance\b/i },
  { phrase: 'by far', meaning: '단연코, 훨씬', difficulty: 2, pattern: /\bby\s+far\b/i },
  { phrase: 'by means of', meaning: '~에 의하여, ~의 수단으로', difficulty: 3, pattern: /\bby\s+means\s+of\b/i },
  { phrase: 'by mistake', meaning: '실수로, 잘못하여', difficulty: 1, pattern: /\bby\s+mistake\b/i },
  { phrase: 'by nature', meaning: '본래, 천성적으로', difficulty: 2, pattern: /\bby\s+nature\b/i },
  { phrase: 'by no means', meaning: '결코 ~이 아닌', difficulty: 3, pattern: /\bby\s+no\s+means\b/i },
  { phrase: 'by the way', meaning: '그런데, 그나저나', difficulty: 1, pattern: /\bby\s+the\s+way\b/i },

  // ── C ──
  { phrase: 'call for', meaning: '~을 요구하다, 필요로 하다', difficulty: 2, pattern: /\b(call|calls|called|calling)\s+for\b/i },
  { phrase: 'call off', meaning: '취소하다, 중단하다', difficulty: 2, pattern: /\b(call|calls|called|calling)\s+off\b/i },
  { phrase: 'calm down', meaning: '진정하다, 가라앉히다', difficulty: 1, pattern: /\b(calm|calms|calmed|calming)\s+down\b/i },
  { phrase: 'can afford to', meaning: '~할 여유가 있다', difficulty: 2, pattern: /\b(can|could|cannot|couldn't|can't)\s+afford\s+to\b/i },
  { phrase: 'cannot help ~ing', meaning: '~하지 않을 수 없다', difficulty: 2, pattern: /\b(cannot|can't|couldn't)\s+help\s+[a-z]+ing\b/i },
  { phrase: 'care about', meaning: '~에 관심을 가지다, 마음을 쓰다', difficulty: 1, pattern: /\b(care|cares|cared|caring)\s+about\b/i },
  { phrase: 'care for', meaning: '~을 돌보다, 좋아하다', difficulty: 1, pattern: /\b(care|cares|cared|caring)\s+for\b/i },
  { phrase: 'carry on', meaning: '계속하다, 진행하다', difficulty: 2, pattern: /\b(carry|carries|carried|carrying)\s+on\b/i },
  { phrase: 'carry out', meaning: '수행하다, 실행하다', difficulty: 2, pattern: /\b(carry|carries|carried|carrying)\s+out\b/i },
  { phrase: 'catch on', meaning: '인기를 얻다, 유행하다, 이해하다', difficulty: 2, pattern: /\b(catch|catches|caught|catching)\s+on\b/i },
  { phrase: 'catch up with', meaning: '~을 따라잡다, 만회하다', difficulty: 2, pattern: /\b(catch|catches|caught|catching)\s+up\s+with\b/i },
  { phrase: 'check in', meaning: '체크인하다, 투숙 수속을 하다', difficulty: 1, pattern: /\b(check|checks|checked|checking)\s+in\b/i },
  { phrase: 'check out', meaning: '확인하다, 대출/퇴실하다', difficulty: 1, pattern: /\b(check|checks|checked|checking)\s+out\b/i },
  { phrase: 'clean up', meaning: '청소하다, 치우다', difficulty: 1, pattern: /\b(clean|cleans|cleaned|cleaning)\s+up\b/i },
  { phrase: 'climate change', meaning: '기후 변화', difficulty: 1, pattern: /\bclimate\s+change\b/i },
  { phrase: 'come across', meaning: '우연히 마주치다, 발견하다', difficulty: 2, pattern: /\b(come|comes|came|coming)\s+across\b/i },
  { phrase: 'come from', meaning: '~출신이다, ~에서 비롯되다', difficulty: 1, pattern: /\b(come|comes|came|coming)\s+from\b/i },
  { phrase: 'come true', meaning: '실현되다, 이루어지다', difficulty: 1, pattern: /\b(come|comes|came|coming)\s+true\b/i },
  { phrase: 'come up with', meaning: '(아이디어 등을) 생각해내다, 제안하다', difficulty: 2, pattern: /\b(come|comes|came|coming)\s+up\s+with\b/i },
  { phrase: 'concentrate on', meaning: '~에 집중하다', difficulty: 1, pattern: /\b(concentrate|concentrates|concentrated|concentrating)\s+on\b/i },
  { phrase: 'consist of', meaning: '~으로 구성되다, 이루어지다', difficulty: 2, pattern: /\b(consist|consists|consisted|consisting)\s+of\b/i },
  { phrase: 'contribute to', meaning: '~에 기여하다, 원인이 되다', difficulty: 2, pattern: new RegExp(`\\b(contribute|contributes|contributed|contributing)${ADV}\\s+to\\b`, 'i') },
  { phrase: 'cope with', meaning: '~에 대처하다, 잘 처리하다', difficulty: 2, pattern: /\b(cope|copes|coped|coping)\s+with\b/i },
  { phrase: 'count on', meaning: '~을 믿다, 의지하다', difficulty: 2, pattern: /\b(count|counts|counted|counting)\s+on\b/i },
  { phrase: 'cut down on', meaning: '~을 줄이다, 삭감하다', difficulty: 2, pattern: /\b(cut|cuts|cutting)\s+down\s+on\b/i },
  { phrase: 'cut off', meaning: '차단하다, 끊다, 잘라내다', difficulty: 2, pattern: /\b(cut|cuts|cutting)\s+off\b/i },

  // ── D ──
  { phrase: 'daily life', meaning: '일상 생활', difficulty: 1, pattern: /\bdaily\s+li(fe|ves)\b/i },
  { phrase: 'day after day', meaning: '날마다, 매일매일', difficulty: 1, pattern: /\bday\s+after\s+day\b/i },
  { phrase: 'deal with', meaning: '~을 다루다, 처리하다', difficulty: 1, pattern: /\b(deal|deals|dealt|dealing)\s+with\b/i },
  { phrase: 'depend on', meaning: '~에 의존하다, 달려있다', difficulty: 1, pattern: new RegExp(`\\b(depend|depends|depended|depending)${ADV}\\s+on\\b`, 'i') },
  { phrase: 'differ from', meaning: '~와 다르다', difficulty: 2, pattern: /\b(differ|differs|differed|differing)\s+from\b/i },
  { phrase: 'do one\'s best', meaning: '최선을 다하다', difficulty: 1, pattern: /\b(do|does|did|doing|done)\s+(my|your|his|her|our|their|one's)\s+best\b/i },
  { phrase: 'do without', meaning: '~없이 지내다', difficulty: 2, pattern: /\b(do|does|did|doing|done)\s+without\b/i },
  { phrase: 'drop by', meaning: '잠깐 들르다', difficulty: 1, pattern: /\b(drop|drops|dropped|dropping)\s+by\b/i },
  { phrase: 'drop out', meaning: '중퇴하다, 탈락하다', difficulty: 2, pattern: /\b(drop|drops|dropped|dropping)\s+out\b/i },
  { phrase: 'due to', meaning: '~로 인하여, ~때문에', difficulty: 1, pattern: /\bdue\s+to\b/i },

  // ── E ──
  { phrase: 'each other', meaning: '서로서로', difficulty: 1, pattern: /\beach\s+other\b/i },
  { phrase: 'end up', meaning: '결국 ~하게 되다', difficulty: 2, pattern: /\b(end|ends|ended|ending)\s+up\b/i },
  { phrase: 'even if', meaning: '비록 ~일지라도', difficulty: 1, pattern: /\beven\s+if\b/i },
  { phrase: 'even though', meaning: '비록 ~이지만, ~임에도 불구하고', difficulty: 1, pattern: /\beven\s+though\b/i },
  { phrase: 'every day', meaning: '매일, 날마다', difficulty: 1, pattern: /\bevery\s+day\b/i },
  { phrase: 'every other day', meaning: '이틀에 한 번씩, 격일로', difficulty: 2, pattern: /\bevery\s+other\s+day\b/i },

  // ── F ──
  { phrase: 'face to face', meaning: '얼굴을 맞대고, 대면하여', difficulty: 1, pattern: /\bface\s+to\s+face\b/i },
  { phrase: 'fall apart', meaning: '산산조각 나다, 무너지다', difficulty: 2, pattern: /\b(fall|falls|fell|fallen|falling)\s+apart\b/i },
  { phrase: 'fall behind', meaning: '뒤처지다, 낙오하다', difficulty: 2, pattern: /\b(fall|falls|fell|fallen|falling)\s+behind\b/i },
  { phrase: 'fall in love with', meaning: '~와 사랑에 빠지다', difficulty: 1, pattern: /\b(fall|falls|fell|fallen|falling)\s+in\s+love\s+with\b/i },
  { phrase: 'far from', meaning: '결코 ~이 아닌, ~와는 거리가 먼', difficulty: 2, pattern: /\bfar\s+from\b/i },
  { phrase: 'feel like ~ing', meaning: '~하고 싶다', difficulty: 1, pattern: /\b(feel|feels|felt|feeling)\s+like\s+[a-z]+ing\b/i },
  { phrase: 'figure out', meaning: '알아내다, 이해하다, 해결하다', difficulty: 2, pattern: /\b(figure|figures|figured|figuring)\s+out\b/i },
  { phrase: 'fill in', meaning: '(서식 등을) 작성하다, 기입하다', difficulty: 1, pattern: /\b(fill|fills|filled|filling)\s+in\b/i },
  { phrase: 'fill out', meaning: '(양식을) 완전히 작성하다', difficulty: 1, pattern: /\b(fill|fills|filled|filling)\s+out\b/i },
  { phrase: 'find out', meaning: '알아내다, 발견하다', difficulty: 1, pattern: /\b(find|finds|found|finding)\s+out\b/i },
  { phrase: 'first of all', meaning: '무엇보다도, 우선', difficulty: 1, pattern: /\bfirst\s+of\s+all\b/i },
  { phrase: 'focus on', meaning: '~에 집중하다, 초점을 맞추다', difficulty: 1, pattern: new RegExp(`\\b(focus|focuses|focused|focusing)${ADV}\\s+on\\b`, 'i') },
  { phrase: 'for a while', meaning: '잠시 동안, 당분간', difficulty: 1, pattern: /\bfor\s+a\s+while\b/i },
  { phrase: 'for example', meaning: '예를 들어', difficulty: 1, pattern: /\bfor\s+example\b/i },
  { phrase: 'for free', meaning: '무료로, 공짜로', difficulty: 1, pattern: /\bfor\s+free\b/i },
  { phrase: 'for good', meaning: '영원히', difficulty: 2, pattern: /\bfor\s+good\b/i },
  { phrase: 'for instance', meaning: '예를 들면', difficulty: 1, pattern: /\bfor\s+instance\b/i },
  { phrase: 'for nothing', meaning: '공짜로, 헛되이', difficulty: 2, pattern: /\bfor\s+nothing\b/i },
  { phrase: 'for the first time', meaning: '처음으로', difficulty: 1, pattern: /\bfor\s+the\s+first\s+time\b/i },
  { phrase: 'for the sake of', meaning: '~을 위하여', difficulty: 2, pattern: /\bfor\s+the\s+sake\s+of\b/i },
  { phrase: 'fossil fuel', meaning: '화석 연료', difficulty: 1, pattern: /\bfossil\s+fuels?\b/i },
  { phrase: 'from now on', meaning: '지금부터, 앞으로는', difficulty: 1, pattern: /\bfrom\s+now\s+on\b/i },
  { phrase: 'from time to time', meaning: '때때로, 가끔', difficulty: 1, pattern: /\bfrom\s+time\s+to\s+time\b/i },

  // ── G ──
  { phrase: 'get along with', meaning: '~와 사이좋게 지내다', difficulty: 2, pattern: /\b(get|gets|got|getting)\s+along\s+with\b/i },
  { phrase: 'get in touch with', meaning: '~와 연락하다', difficulty: 2, pattern: /\b(get|gets|got|getting)\s+in\s+touch\s+with\b/i },
  { phrase: 'get off', meaning: '(차·버스에서) 내리다, 퇴근하다', difficulty: 1, pattern: /\b(get|gets|got|getting)\s+off\b/i },
  { phrase: 'get on', meaning: '(버스·기차 등을) 타다, 지내다', difficulty: 1, pattern: /\b(get|gets|got|getting)\s+on\b/i },
  { phrase: 'get out of', meaning: '~에서 나가다, 벗어나다', difficulty: 1, pattern: /\b(get|gets|got|getting)\s+out\s+of\b/i },
  { phrase: 'get over', meaning: '극복하다, 회복하다', difficulty: 2, pattern: /\b(get|gets|got|getting)\s+over\b/i },
  { phrase: 'get rid of', meaning: '~을 없애다, 제거하다', difficulty: 2, pattern: /\b(get|gets|got|getting)\s+rid\s+of\b/i },
  { phrase: 'get to', meaning: '~에 도착하다, ~하게 되다', difficulty: 1, pattern: /\b(get|gets|got|getting)\s+to\b/i },
  { phrase: 'get used to', meaning: '~에 익숙해지다', difficulty: 2, pattern: /\b(get|gets|got|getting)\s+used\s+to\b/i },
  { phrase: 'give away', meaning: '거저 주다, 누설하다', difficulty: 2, pattern: /\b(give|gives|gave|given|giving)\s+away\b/i },
  { phrase: 'give in', meaning: '굴복하다, 항복하다, 제출하다', difficulty: 2, pattern: /\b(give|gives|gave|given|giving)\s+in\b/i },
  { phrase: 'give off', meaning: '(냄새·빛·열을) 내뿜다, 방출하다', difficulty: 2, pattern: /\b(give|gives|gave|given|giving)\s+off\b/i },
  { phrase: 'give rise to', meaning: '~을 유발하다, 야기하다', difficulty: 3, pattern: /\b(give|gives|gave|given|giving)\s+rise\s+to\b/i },
  { phrase: 'give up', meaning: '포기하다, 그만두다', difficulty: 1, pattern: /\b(give|gives|gave|given|giving)\s+up\b/i },
  { phrase: 'go ahead', meaning: '어서 계속하세요, 진행하다', difficulty: 1, pattern: /\b(go|goes|went|gone|going)\s+ahead\b/i },
  { phrase: 'go on', meaning: '계속하다, 일어나다', difficulty: 1, pattern: /\b(go|goes|went|gone|going)\s+on\b/i },
  { phrase: 'go out', meaning: '외출하다, (불이) 꺼지다', difficulty: 1, pattern: /\b(go|goes|went|gone|going)\s+out\b/i },
  { phrase: 'go through', meaning: '(고난을) 겪다, 통과하다', difficulty: 2, pattern: /\b(go|goes|went|gone|going)\s+through\b/i },
  { phrase: 'graduate from', meaning: '~을 졸업하다', difficulty: 1, pattern: /\b(graduate|graduates|graduated|graduating)\s+from\b/i },
  { phrase: 'greenhouse gas', meaning: '온실가스', difficulty: 2, pattern: /\bgreenhouse\s+gas(es)?\b/i },
  { phrase: 'grow up', meaning: '성장하다, 자라다', difficulty: 1, pattern: /\b(grow|grows|grew|grown|growing)\s+up\b/i },

  // ── H ──
  { phrase: 'hand in', meaning: '제출하다', difficulty: 1, pattern: /\b(hand|hands|handed|handing)\s+in\b/i },
  { phrase: 'hand out', meaning: '나누어 주다, 배포하다', difficulty: 1, pattern: /\b(hand|hands|handed|handing)\s+out\b/i },
  { phrase: 'hang out', meaning: '(친구와) 시간을 보내다, 어울리다', difficulty: 1, pattern: /\b(hang|hangs|hung|hanging)\s+out\b/i },
  { phrase: 'have a great impact on', meaning: '~에 큰 영향을 미치다', difficulty: 2, pattern: /\b(have|has|had|having)\s+a\s+(great|huge|profound|major|positive|negative)\s+(impact|effect|influence)\s+on\b/i },
  { phrase: 'have an effect on', meaning: '~에 영향을 미치다', difficulty: 2, pattern: /\b(have|has|had|having)\s+an?\s+(effect|impact|influence)\s+on\b/i },
  { phrase: 'have no idea', meaning: '전혀 모르다', difficulty: 1, pattern: /\b(have|has|had|having)\s+no\s+idea\b/i },
  { phrase: 'have nothing to do with', meaning: '~와 전혀 상관이 없다', difficulty: 2, pattern: /\b(have|has|had|having)\s+nothing\s+to\s+do\s+with\b/i },
  { phrase: 'have to do with', meaning: '~와 관계가 있다', difficulty: 2, pattern: /\b(have|has|had|having)\s+to\s+do\s+with\b/i },
  { phrase: 'have trouble ~ing', meaning: '~하는 데 어려움을 겪다', difficulty: 2, pattern: /\b(have|has|had|having)\s+(trouble|difficulty|a hard time)\s+[a-z]+ing\b/i },
  { phrase: 'hear from', meaning: '~로부터 소식을 듣다', difficulty: 1, pattern: /\b(hear|hears|heard|hearing)\s+from\b/i },
  { phrase: 'hear of', meaning: '~에 대해 소문을 듣다/알다', difficulty: 1, pattern: /\b(hear|hears|heard|hearing)\s+of\b/i },
  { phrase: 'help oneself to', meaning: '~을 마음껏 먹다/이용하다', difficulty: 1, pattern: /\b(help|helps|helped|helping)\s+oneself\s+to\b/i },
  { phrase: 'hold on', meaning: '기다리다, 꽉 붙잡다, 버티다', difficulty: 1, pattern: /\b(hold|holds|held|holding)\s+on\b/i },
  { phrase: 'hurry up', meaning: '서두르다', difficulty: 1, pattern: /\b(hurry|hurries|hurried|hurrying)\s+up\b/i },

  // ── I ──
  { phrase: 'in a row', meaning: '연달아, 줄지어', difficulty: 2, pattern: /\bin\s+a\s+row\b/i },
  { phrase: 'in a word', meaning: '한마디로 말해서', difficulty: 1, pattern: /\bin\s+a\s+word\b/i },
  { phrase: 'in accordance with', meaning: '~에 따라, 부합하여', difficulty: 3, pattern: /\bin\s+accordance\s+with\b/i },
  { phrase: 'in addition', meaning: '게다가, 덧붙여', difficulty: 1, pattern: /\bin\s+addition\b/i },
  { phrase: 'in addition to', meaning: '~에 더하여, ~외에도', difficulty: 2, pattern: /\bin\s+addition\s+to\b/i },
  { phrase: 'in advance', meaning: '미리, 사전에', difficulty: 2, pattern: /\bin\s+advance\b/i },
  { phrase: 'in brief', meaning: '간단히 말해서', difficulty: 2, pattern: /\bin\s+brief\b/i },
  { phrase: 'in case of', meaning: '~의 경우에 대비하여', difficulty: 1, pattern: /\bin\s+case\s+of\b/i },
  { phrase: 'in charge of', meaning: '~을 담당하는, 책임지는', difficulty: 2, pattern: /\bin\s+charge\s+of\b/i },
  { phrase: 'in common', meaning: '공통으로, 공동으로', difficulty: 1, pattern: /\bin\s+common\b/i },
  { phrase: 'in comparison with', meaning: '~와 비교하여', difficulty: 2, pattern: /\bin\s+comparison\s+with\b/i },
  { phrase: 'in contrast', meaning: '대조적으로, 반면에', difficulty: 2, pattern: /\bin\s+contrast(\s+to|\s+with)?\b/i },
  { phrase: 'in danger', meaning: '위험에 처한', difficulty: 1, pattern: /\bin\s+danger\b/i },
  { phrase: 'in detail', meaning: '상세하게, 구체적으로', difficulty: 1, pattern: /\bin\s+detail\b/i },
  { phrase: 'in fact', meaning: '사실은, 실제로', difficulty: 1, pattern: /\bin\s+fact\b/i },
  { phrase: 'in favor of', meaning: '~에 찬성하여, 지지하여', difficulty: 2, pattern: /\bin\s+favor\s+of\b/i },
  { phrase: 'in front of', meaning: '~의 앞에', difficulty: 1, pattern: /\bin\s+front\s+of\b/i },
  { phrase: 'in general', meaning: '일반적으로, 대체로', difficulty: 1, pattern: /\bin\s+general\b/i },
  { phrase: 'in honor of', meaning: '~을 기념하여, 축하하여', difficulty: 2, pattern: /\bin\s+honor\s+of\b/i },
  { phrase: 'in order that', meaning: '~하기 위하여 (~하도록)', difficulty: 2, pattern: /\bin\s+order\s+that\b/i },
  { phrase: 'in order to', meaning: '~하기 위하여', difficulty: 1, pattern: /\bin\s+order\s+to\b/i },
  { phrase: 'in other words', meaning: '다시 말해서, 즉', difficulty: 1, pattern: /\bin\s+other\s+words\b/i },
  { phrase: 'in particular', meaning: '특히, 특별히', difficulty: 1, pattern: /\bin\s+particular\b/i },
  { phrase: 'in person', meaning: '직접, 본인이', difficulty: 1, pattern: /\bin\s+person\b/i },
  { phrase: 'in place of', meaning: '~을 대신하여', difficulty: 2, pattern: /\bin\s+place\s+of\b/i },
  { phrase: 'in reality', meaning: '실제로는, 사실상', difficulty: 2, pattern: /\bin\s+reality\b/i },
  { phrase: 'in response to', meaning: '~에 응답하여, 대응하여', difficulty: 2, pattern: /\bin\s+response\s+to\b/i },
  { phrase: 'in return', meaning: '그 대가로, 보답으로', difficulty: 2, pattern: /\bin\s+return(\s+for)?\b/i },
  { phrase: 'in search of', meaning: '~을 찾아서', difficulty: 2, pattern: /\bin\s+search\s+of\b/i },
  { phrase: 'in shape', meaning: '건강한, 몸 상태가 좋은', difficulty: 2, pattern: /\b(in|out\s+of)\s+shape\b/i },
  { phrase: 'in short', meaning: '요약하면, 요컨대', difficulty: 1, pattern: /\bin\s+short\b/i },
  { phrase: 'in spite of', meaning: '~에도 불구하고', difficulty: 2, pattern: /\bin\s+spite\s+of\b/i },
  { phrase: 'in terms of', meaning: '~의 관점에서, ~에 관하여', difficulty: 2, pattern: /\bin\s+terms\s+of\b/i },
  { phrase: 'in the end', meaning: '결국, 마침내', difficulty: 1, pattern: /\bin\s+the\s+end\b/i },
  { phrase: 'in the future', meaning: '미래에, 앞으로', difficulty: 1, pattern: /\bin\s+the\s+future\b/i },
  { phrase: 'in the long run', meaning: '결국에는, 장기적으로는', difficulty: 2, pattern: /\bin\s+the\s+long\s+run\b/i },
  { phrase: 'in the meantime', meaning: '그동안에, 한편', difficulty: 2, pattern: /\bin\s+the\s+meantime\b/i },
  { phrase: 'in the past', meaning: '과거에는', difficulty: 1, pattern: /\bin\s+the\s+past\b/i },
  { phrase: 'in time', meaning: '제시간에, 조만간', difficulty: 1, pattern: /\bin\s+time\b/i },
  { phrase: 'in turn', meaning: '차례차례, 결국', difficulty: 2, pattern: /\bin\s+turn\b/i },
  { phrase: 'in vain', meaning: '헛되이, 보람 없이', difficulty: 2, pattern: /\bin\s+vain\b/i },
  { phrase: 'inside out', meaning: '뒤집어서, 샅샅이', difficulty: 2, pattern: /\binside\s+out\b/i },
  { phrase: 'insist on', meaning: '~을 고집하다, 주장하다', difficulty: 2, pattern: /\b(insist|insists|insisted|insisting)\s+on\b/i },
  { phrase: 'instead of', meaning: '~대신에', difficulty: 1, pattern: /\binstead\s+of\b/i },

  // ── K ──
  { phrase: 'keep an eye on', meaning: '~을 계속 지켜보다/감시하다', difficulty: 2, pattern: /\b(keep|keeps|kept|keeping)\s+an\s+eye\s+on\b/i },
  { phrase: 'keep in mind', meaning: '명심하다, 유념하다', difficulty: 2, pattern: /\b(keep|keeps|kept|keeping)\s+in\s+mind\b/i },
  { phrase: 'keep in touch with', meaning: '~와 계속 연락하다', difficulty: 1, pattern: /\b(keep|keeps|kept|keeping)\s+in\s+touch\s+with\b/i },
  { phrase: 'keep on', meaning: '계속해서 ~하다', difficulty: 1, pattern: /\b(keep|keeps|kept|keeping)\s+on\b/i },
  { phrase: 'keep track of', meaning: '~을 계속 추적하다/기록하다', difficulty: 2, pattern: /\b(keep|keeps|kept|keeping)\s+track\s+of\b/i },
  { phrase: 'keep up with', meaning: '~에 뒤처지지 않고 따라가다', difficulty: 2, pattern: /\b(keep|keeps|kept|keeping)\s+up\s+with\b/i },

  // ── L ──
  { phrase: 'lead to', meaning: '~로 이어지다, 초래하다', difficulty: 1, pattern: new RegExp(`\\b(lead|leads|led|leading)${ADV}\\s+to\\b`, 'i') },
  { phrase: 'learn by heart', meaning: '암기하다, 외우다', difficulty: 1, pattern: /\b(learn|learns|learned|learnt|learning)\s+by\s+heart\b/i },
  { phrase: 'leave behind', meaning: '뒤에 남겨두다, 두고 가다', difficulty: 2, pattern: /\b(leave|leaves|left|leaving)\s+behind\b/i },
  { phrase: 'let down', meaning: '실망시키다', difficulty: 1, pattern: /\b(let|lets|letting)\s+down\b/i },
  { phrase: 'little by little', meaning: '조금씩, 서서히', difficulty: 1, pattern: /\blittle\s+by\s+little\b/i },
  { phrase: 'long for', meaning: '~을 열망하다, 그리워하다', difficulty: 2, pattern: /\b(long|longs|longed|longing)\s+for\b/i },
  { phrase: 'look after', meaning: '~을 돌보다', difficulty: 1, pattern: /\b(look|looks|looked|looking)\s+after\b/i },
  { phrase: 'look around', meaning: '둘러보다', difficulty: 1, pattern: /\b(look|looks|looked|looking)\s+around\b/i },
  { phrase: 'look at', meaning: '~을 바라보다', difficulty: 1, pattern: /\b(look|looks|looked|looking)\s+at\b/i },
  { phrase: 'look back on', meaning: '~을 회상하다, 되돌아보다', difficulty: 2, pattern: /\b(look|looks|looked|looking)\s+back\s+on\b/i },
  { phrase: 'look down on', meaning: '~을 얕보다, 무시하다', difficulty: 2, pattern: /\b(look|looks|looked|looking)\s+down\s+on\b/i },
  { phrase: 'look for', meaning: '~을 찾다', difficulty: 1, pattern: /\b(look|looks|looked|looking)\s+for\b/i },
  { phrase: 'look forward to', meaning: '~을 고대하다, 학수고대하다', difficulty: 2, pattern: /\b(look|looks|looked|looking)\s+forward\s+to\b/i },
  { phrase: 'look into', meaning: '조사하다, 살펴보다', difficulty: 2, pattern: /\b(look|looks|looked|looking)\s+into\b/i },
  { phrase: 'look like', meaning: '~처럼 보이다, 닮다', difficulty: 1, pattern: /\b(look|looks|looked|looking)\s+like\b/i },
  { phrase: 'look out', meaning: '조심하다, 주의하다', difficulty: 1, pattern: /\b(look|looks|looked|looking)\s+out\b/i },
  { phrase: 'look up', meaning: '(사전 등에서) 찾아보다, 올려다보다', difficulty: 1, pattern: /\b(look|looks|looked|looking)\s+up\b/i },
  { phrase: 'look up to', meaning: '~을 존경하다', difficulty: 2, pattern: /\b(look|looks|looked|looking)\s+up\s+to\b/i },
  { phrase: 'lose one\'s temper', meaning: '화를 내다, 화를 참지 못하다', difficulty: 2, pattern: /\b(lose|loses|lost|losing)\s+(my|your|his|her|our|their|one's)\s+temper\b/i },
  { phrase: 'lose weight', meaning: '체중을 줄이다, 살을 빼다', difficulty: 1, pattern: /\b(lose|loses|lost|losing)\s+weight\b/i },

  // ── M ──
  { phrase: 'make a decision', meaning: '결정을 내리다', difficulty: 1, pattern: /\b(make|makes|made|making)\s+a\s+decision\b/i },
  { phrase: 'make a difference', meaning: '변화를 가져오다, 큰 영향을 주다', difficulty: 2, pattern: /\b(make|makes|made|making)\s+a\s+difference\b/i },
  { phrase: 'make a mistake', meaning: '실수하다', difficulty: 1, pattern: /\b(make|makes|made|making)\s+a\s+mistake\b/i },
  { phrase: 'make a living', meaning: '생계를 꾸리다', difficulty: 2, pattern: /\b(make|makes|made|making)\s+a\s+living\b/i },
  { phrase: 'make an effort', meaning: '노력하다, 공을 들이다', difficulty: 2, pattern: /\b(make|makes|made|making)\s+(an?\s+)?effort\b/i },
  { phrase: 'make friends with', meaning: '~와 친구가 되다', difficulty: 1, pattern: /\b(make|makes|made|making)\s+friends\s+with\b/i },
  { phrase: 'make fun of', meaning: '~을 놀리다, 비웃다', difficulty: 1, pattern: /\b(make|makes|made|making)\s+fun\s+of\b/i },
  { phrase: 'make sense', meaning: '이치에 맞다, 말이 되다', difficulty: 1, pattern: /\b(make|makes|made|making)\s+sense\b/i },
  { phrase: 'make sure', meaning: '확실히 하다, 반드시 ~하다', difficulty: 1, pattern: /\b(make|makes|made|making)\s+sure\b/i },
  { phrase: 'make up for', meaning: '~을 보상하다, 만회하다', difficulty: 2, pattern: /\b(make|makes|made|making)\s+up\s+for\b/i },
  { phrase: 'make up one\'s mind', meaning: '결심하다', difficulty: 1, pattern: /\b(make|makes|made|making)\s+up\s+(my|your|his|her|our|their|one's)\s+mind\b/i },
  { phrase: 'make use of', meaning: '~을 이용하다, 활용하다', difficulty: 2, pattern: /\b(make|makes|made|making)\s+use\s+of\b/i },
  { phrase: 'mix up', meaning: '혼동하다, 뒤섞다', difficulty: 1, pattern: /\b(mix|mixes|mixed|mixing)\s+up\b/i },
  { phrase: 'more and more', meaning: '점점 더 많은', difficulty: 1, pattern: /\bmore\s+and\s+more\b/i },
  { phrase: 'more or less', meaning: '거의, 대략', difficulty: 2, pattern: /\bmore\s+or\s+less\b/i },

  // ── N ──
  { phrase: 'neither A nor B', meaning: 'A도 B도 아닌', difficulty: 2, pattern: /\bneither\s+[a-z\s-]+\s+nor\s+[a-z\s-]+\b/i },
  { phrase: 'next to', meaning: '~의 옆에, 거의', difficulty: 1, pattern: /\bnext\s+to\b/i },
  { phrase: 'no doubt', meaning: '틀림없이, 의심할 여지 없이', difficulty: 2, pattern: /\bno\s+doubt\b/i },
  { phrase: 'no longer', meaning: '더 이상 ~아닌', difficulty: 1, pattern: /\bno\s+longer\b/i },
  { phrase: 'no matter what', meaning: '무슨 일이 있어도', difficulty: 2, pattern: /\bno\s+matter\s+what\b/i },
  { phrase: 'not at all', meaning: '전혀 ~아니다, 천만에요', difficulty: 1, pattern: /\bnot\s+at\s+all\b/i },
  { phrase: 'not only A but also B', meaning: 'A뿐만 아니라 B도', difficulty: 1, pattern: /\bnot\s+only\s+[a-z\s-]+\s+but\s+(also\s+)?[a-z\s-]+\b/i },
  { phrase: 'now and then', meaning: '가끔, 때때로', difficulty: 2, pattern: /\bnow\s+and\s+then\b/i },

  // ── O ──
  { phrase: 'on account of', meaning: '~때문에, ~로 인하여', difficulty: 2, pattern: /\bon\s+account\s+of\b/i },
  { phrase: 'on average', meaning: '평균적으로', difficulty: 1, pattern: /\bon\s+average\b/i },
  { phrase: 'on behalf of', meaning: '~을 대표하여, 대신하여', difficulty: 3, pattern: /\bon\s+behalf\s+of\b/i },
  { phrase: 'on duty', meaning: '근무 중인, 당번인', difficulty: 1, pattern: /\bon\s+duty\b/i },
  { phrase: 'on foot', meaning: '도보로, 걸어서', difficulty: 1, pattern: /\bon\s+foot\b/i },
  { phrase: 'on one\'s own', meaning: '스스로, 혼자서', difficulty: 1, pattern: /\bon\s+(my|your|his|her|our|their|one's)\s+own\b/i },
  { phrase: 'on purpose', meaning: '고의로, 일부러', difficulty: 1, pattern: /\bon\s+purpose\b/i },
  { phrase: 'on the contrary', meaning: '그와는 반대로', difficulty: 2, pattern: /\bon\s+the\s+contrary\b/i },
  { phrase: 'on the one hand', meaning: '한편으로는', difficulty: 2, pattern: /\bon\s+the\s+one\s+hand\b/i },
  { phrase: 'on the other hand', meaning: '다른 한편으로는, 반면에', difficulty: 1, pattern: /\bon\s+the\s+other\s+hand\b/i },
  { phrase: 'on time', meaning: '정각에, 정시에', difficulty: 1, pattern: /\bon\s+time\b/i },
  { phrase: 'once in a while', meaning: '어쩌다 한 번, 가끔', difficulty: 1, pattern: /\bonce\s+in\s+a\s+while\b/i },
  { phrase: 'one after another', meaning: '차례차례, 잇따라', difficulty: 2, pattern: /\bone\s+after\s+another\b/i },
  { phrase: 'one by one', meaning: '하나씩, 차례로', difficulty: 1, pattern: /\bone\s+by\s+one\b/i },
  { phrase: 'out of date', meaning: '구식의, 시대에 뒤떨어진', difficulty: 2, pattern: /\bout\s+of\s+date\b/i },
  { phrase: 'out of order', meaning: '고장 난', difficulty: 1, pattern: /\bout\s+of\s+order\b/i },
  { phrase: 'out of the question', meaning: '불가능한, 논외인', difficulty: 2, pattern: /\bout\s+of\s+the\s+question\b/i },
  { phrase: 'over and over', meaning: '반복해서, 몇 번이고', difficulty: 1, pattern: /\bover\s+and\s+over\b/i },

  // ── P ──
  { phrase: 'participate in', meaning: '~에 참여하다, 참가하다', difficulty: 2, pattern: /\b(participate|participates|participated|participating)\s+in\b/i },
  { phrase: 'pass away', meaning: '돌아가시다, 사망하다', difficulty: 2, pattern: /\b(pass|passes|passed|passing)\s+away\b/i },
  { phrase: 'pass out', meaning: '기절하다, 의식을 잃다', difficulty: 2, pattern: /\b(pass|passes|passed|passing)\s+out\b/i },
  { phrase: 'pay attention to', meaning: '~에 주의를 기울이다, 집중하다', difficulty: 1, pattern: /\b(pay|pays|paid|paying)\s+attention\s+to\b/i },
  { phrase: 'pay for', meaning: '~의 값을 지불하다, 대가를 치르다', difficulty: 1, pattern: /\b(pay|pays|paid|paying)\s+for\b/i },
  { phrase: 'pick up', meaning: '집어 들다, (사람을) 태우러 가다, 익히다', difficulty: 1, pattern: /\b(pick|picks|picked|picking)\s+up\b/i },
  { phrase: 'play a role in', meaning: '~에서 역할을 하다', difficulty: 2, pattern: new RegExp(`\\b(play|plays|played|playing)\\s+a${ADJ}\\s+role\\s+in\\b`, 'i') },
  { phrase: 'point out', meaning: '지적하다, 가리키다', difficulty: 2, pattern: /\b(point|points|pointed|pointing)\s+out\b/i },
  { phrase: 'prevent from', meaning: '~가 ...하는 것을 막다/방지하다', difficulty: 2, pattern: /\b(prevent|prevents|prevented|preventing)\s+[a-z\s-]+\s+from\b/i },
  { phrase: 'protect from', meaning: '~로부터 보호하다', difficulty: 1, pattern: /\b(protect|protects|protected|protecting)\s+[a-z\s-]+\s+from\b/i },
  { phrase: 'provide with', meaning: '~에게 ...을 제공하다', difficulty: 2, pattern: /\b(provide|provides|provided|providing)\s+[a-z\s-]+\s+with\b/i },
  { phrase: 'put off', meaning: '미루다, 연기하다', difficulty: 2, pattern: /\b(put|puts|putting)\s+off\b/i },
  { phrase: 'put on', meaning: '(옷·모자를) 입다/쓰다', difficulty: 1, pattern: /\b(put|puts|putting)\s+on\b/i },
  { phrase: 'put out', meaning: '(불을) 끄다, 출판하다', difficulty: 1, pattern: /\b(put|puts|putting)\s+out\b/i },
  { phrase: 'put up with', meaning: '~을 참다, 견디다', difficulty: 2, pattern: /\b(put|puts|putting)\s+up\s+with\b/i },

  // ── R ──
  { phrase: 'refer to', meaning: '~을 언급하다, 참조하다', difficulty: 2, pattern: /\b(refer|refers|referred|referring)\s+to\b/i },
  { phrase: 'regardless of', meaning: '~에 상관없이, 구애받지 않고', difficulty: 2, pattern: /\bregardless\s+of\b/i },
  { phrase: 'rely on', meaning: '~에 의존하다, 신뢰하다', difficulty: 1, pattern: new RegExp(`\\b(rely|relies|relied|relying)${ADV}\\s+on\\b`, 'i') },
  { phrase: 'remind of', meaning: '~에게 ...을 상기시키다/떠올리게 하다', difficulty: 2, pattern: /\b(remind|reminds|reminded|reminding)\s+[a-z\s-]+\s+of\b/i },
  { phrase: 'result from', meaning: '~에서 기인하다, 비롯되다', difficulty: 2, pattern: new RegExp(`\\b(result|results|resulted|resulting)${ADV}\\s+from\\b`, 'i') },
  { phrase: 'result in', meaning: '~을 초래하다, 야기하다', difficulty: 2, pattern: new RegExp(`\\b(result|results|resulted|resulting)${ADV}\\s+in\\b`, 'i') },
  { phrase: 'right away', meaning: '곧바로, 즉시', difficulty: 1, pattern: /\bright\s+away\b/i },
  { phrase: 'run into', meaning: '우연히 만나다, 충돌하다', difficulty: 2, pattern: /\b(run|runs|ran|running)\s+into\b/i },
  { phrase: 'run out of', meaning: '~이 바닥나다, 다 떨어지다', difficulty: 2, pattern: /\b(run|runs|ran|running)\s+out\s+of\b/i },

  // ── S ──
  { phrase: 'set off', meaning: '출발하다, 유발하다', difficulty: 2, pattern: /\b(set|sets|setting)\s+off\b/i },
  { phrase: 'set out', meaning: '출발하다, 착수하다', difficulty: 2, pattern: /\b(set|sets|setting)\s+out\b/i },
  { phrase: 'set up', meaning: '설립하다, 설치하다, 계획하다', difficulty: 1, pattern: /\b(set|sets|setting)\s+up\b/i },
  { phrase: 'show off', meaning: '자랑하다, 과시하다', difficulty: 1, pattern: /\b(show|shows|showed|shown|showing)\s+off\b/i },
  { phrase: 'show up', meaning: '나타나다, 참석하다', difficulty: 1, pattern: /\b(show|shows|showed|shown|showing)\s+up\b/i },
  { phrase: 'so as to', meaning: '~하기 위하여', difficulty: 2, pattern: /\bso\s+as\s+to\b/i },
  { phrase: 'so far', meaning: '지금까지는, 이때까지', difficulty: 1, pattern: /\bso\s+far\b/i },
  { phrase: 'so that', meaning: '~할 수 있도록, ~하기 위해', difficulty: 1, pattern: /\bso\s+that\b/i },
  { phrase: 'sooner or later', meaning: '조만간, 머지않아', difficulty: 1, pattern: /\bsooner\s+or\s+later\b/i },
  { phrase: 'speak of', meaning: '~에 대해 말하다', difficulty: 1, pattern: /\b(speak|speaks|spoke|spoken|speaking)\s+of\b/i },
  { phrase: 'spend time ~ing', meaning: '~하는 데 시간을 보내다', difficulty: 1, pattern: /\b(spend|spends|spent|spending)\s+[a-z\s-]+\s+[a-z]+ing\b/i },
  { phrase: 'stand by', meaning: '대기하다, 지지하다', difficulty: 2, pattern: /\b(stand|stands|stood|standing)\s+by\b/i },
  { phrase: 'stand for', meaning: '~을 나타내다/상징하다, 지지하다', difficulty: 2, pattern: /\b(stand|stands|stood|standing)\s+for\b/i },
  { phrase: 'stand out', meaning: '두드러지다, 눈에 띄다', difficulty: 2, pattern: /\b(stand|stands|stood|standing)\s+out\b/i },
  { phrase: 'stick to', meaning: '~을 고수하다, 달라붙다', difficulty: 2, pattern: /\b(stick|sticks|stuck|sticking)\s+to\b/i },
  { phrase: 'succeed in', meaning: '~에 성공하다', difficulty: 1, pattern: /\b(succeed|succeeds|succeeded|succeeding)\s+in\b/i },
  { phrase: 'such as', meaning: '~와 같은', difficulty: 1, pattern: /\bsuch\s+as\b/i },
  { phrase: 'suffer from', meaning: '~로 고통받다, 겪다', difficulty: 2, pattern: /\b(suffer|suffers|suffered|suffering)\s+from\b/i },
  { phrase: 'sum up', meaning: '요약하다, 정리하다', difficulty: 2, pattern: /\b(sum|sums|summed|summing)\s+up\b/i },

  // ── T ──
  { phrase: 'take a look at', meaning: '~을 한번 보다', difficulty: 1, pattern: /\b(take|takes|took|taken|taking)\s+a\s+look\s+(at)?\b/i },
  { phrase: 'take a rest', meaning: '휴식을 취하다', difficulty: 1, pattern: /\b(take|takes|took|taken|taking)\s+a\s+rest\b/i },
  { phrase: 'take action', meaning: '조치를 취하다, 행동에 나서다', difficulty: 2, pattern: /\b(take|takes|took|taken|taking)\s+(immediate\s+|collective\s+|decisive\s+|appropriate\s+)?action\b/i },
  { phrase: 'take advantage of', meaning: '~을 활용하다, 이용하다', difficulty: 2, pattern: /\b(take|takes|took|taken|taking)\s+advantage\s+of\b/i },
  { phrase: 'take after', meaning: '~을 닮다', difficulty: 2, pattern: /\b(take|takes|took|taken|taking)\s+after\b/i },
  { phrase: 'take care of', meaning: '~을 돌보다, 처리하다', difficulty: 1, pattern: /\b(take|takes|took|taken|taking)\s+(good\s+|great\s+)?care\s+of\b/i },
  { phrase: 'take for granted', meaning: '~을 당연하게 여기다', difficulty: 3, pattern: /\b(take|takes|took|taken|taking)\s+[a-z\s-]+\s+for\s+granted\b/i },
  { phrase: 'take off', meaning: '(옷을) 벗다, (비행기가) 이륙하다', difficulty: 1, pattern: /\b(take|takes|took|taken|taking)\s+off\b/i },
  { phrase: 'take part in', meaning: '~에 참가하다, 참여하다', difficulty: 1, pattern: /\b(take|takes|took|taken|taking)\s+part\s+in\b/i },
  { phrase: 'take place', meaning: '일어나다, 개최되다', difficulty: 1, pattern: /\b(take|takes|took|taken|taking)\s+place\b/i },
  { phrase: 'take pride in', meaning: '~을 자랑스러워하다', difficulty: 2, pattern: /\b(take|takes|took|taken|taking)\s+pride\s+in\b/i },
  { phrase: 'take time', meaning: '시간이 걸리다, 시간을 내다', difficulty: 1, pattern: /\b(take|takes|took|taken|taking)\s+(time|one's time)\b/i },
  { phrase: 'talk about', meaning: '~에 대해 이야기하다', difficulty: 1, pattern: /\b(talk|talks|talked|talking)\s+about\b/i },
  { phrase: 'tell A from B', meaning: 'A와 B를 구별하다', difficulty: 2, pattern: /\b(tell|tells|told|telling)\s+[a-z\s-]+\s+from\b/i },
  { phrase: 'thanks to', meaning: '~덕분에, ~때문에', difficulty: 1, pattern: /\bthanks\s+to\b/i },
  { phrase: 'throw away', meaning: '버리다, 내던지다', difficulty: 1, pattern: /\b(throw|throws|threw|thrown|throwing)\s+away\b/i },
  { phrase: 'to be honest', meaning: '솔직히 말해서', difficulty: 1, pattern: /\bto\s+be\s+honest\b/i },
  { phrase: 'to tell the truth', meaning: '사실대로 말하자면', difficulty: 1, pattern: /\bto\s+tell\s+the\s+truth\b/i },
  { phrase: 'try on', meaning: '(옷 등을) 입어보다', difficulty: 1, pattern: /\b(try|tries|tried|trying)\s+on\b/i },
  { phrase: 'turn down', meaning: '거절하다, (소리를) 줄이다', difficulty: 2, pattern: /\b(turn|turns|turned|turning)\s+down\b/i },
  { phrase: 'turn into', meaning: '~으로 변하다, 바뀌다', difficulty: 1, pattern: /\b(turn|turns|turned|turning)\s+into\b/i },
  { phrase: 'turn off', meaning: '(스위치를) 끄다', difficulty: 1, pattern: /\b(turn|turns|turned|turning)\s+off\b/i },
  { phrase: 'turn on', meaning: '(스위치를) 켜다', difficulty: 1, pattern: /\b(turn|turns|turned|turning)\s+on\b/i },
  { phrase: 'turn out', meaning: '~임이 밝혀지다, 드러나다', difficulty: 2, pattern: /\b(turn|turns|turned|turning)\s+out\b/i },
  { phrase: 'turn up', meaning: '나타나다, (소리를) 높이다', difficulty: 2, pattern: /\b(turn|turns|turned|turning)\s+up\b/i },

  // ── U ──
  { phrase: 'up to', meaning: '~까지, ~에 달려있는', difficulty: 1, pattern: /\bup\s+to\b/i },
  { phrase: 'up to date', meaning: '최신의, 현대적인', difficulty: 2, pattern: /\bup\s+to\s+date\b/i },
  { phrase: 'used to', meaning: '(과거에) ~하곤 했다', difficulty: 1, pattern: /\bused\s+to\b/i },

  // ── W ──
  { phrase: 'wait for', meaning: '~을 기다리다', difficulty: 1, pattern: /\b(wait|waits|waited|waiting)\s+for\b/i },
  { phrase: 'wake up', meaning: '잠에서 깨다, 깨우다', difficulty: 1, pattern: /\b(wake|wakes|woke|woken|waking)\s+up\b/i },
  { phrase: 'warm up', meaning: '준비 운동을 하다, 따뜻해지다', difficulty: 1, pattern: /\b(warm|warms|warmed|warming)\s+up\b/i },
  { phrase: 'watch out', meaning: '조심하다, 주의하다', difficulty: 1, pattern: /\b(watch|watches|watched|watching)\s+out(\s+for)?\b/i },
  { phrase: 'wind up', meaning: '마무리 짓다, 결국 ~이 되다', difficulty: 2, pattern: /\b(wind|winds|wound|winding)\s+up\b/i },
  { phrase: 'with regard to', meaning: '~에 관하여', difficulty: 3, pattern: /\bwith\s+regard\s+to\b/i },
  { phrase: 'with respect to', meaning: '~에 대하여, 관하여', difficulty: 3, pattern: /\bwith\s+respect\s+to\b/i },
  { phrase: 'without fail', meaning: '틀림없이, 반드시', difficulty: 2, pattern: /\bwithout\s+fail\b/i },
  { phrase: 'work out', meaning: '운동하다, 해결되다, 계산하다', difficulty: 1, pattern: /\b(work|works|worked|working)\s+out\b/i },
  { phrase: 'worry about', meaning: '~에 대해 걱정하다', difficulty: 1, pattern: /\b(worry|worries|worried|worrying)\s+about\b/i },
];

export interface ExtractedPhraseResult {
  id?: string;
  phrase: string;
  matchedText: string;
  meaning: string;
  difficulty: number;
  selected?: boolean;
  exampleSentence?: string;
  exampleTranslation?: string;
}

/**
 * 텍스트를 OCR 오탈자/줄바꿈/특수기호 노이즈로부터 깨끗하게 정규화
 */
function normalizeTextForPhraseSearch(rawText: string): string {
  if (!rawText) return '';
  return rawText
    // 하이픈 줄바꿈 복원 (예: trans-\nform -> transform)
    .replace(/(\b[a-zA-Z]+)-\s*\n\s*([a-zA-Z]+\b)/g, '$1$2')
    // 특수 따옴표 및 대시 일반화
    .replace(/[“”]/g, '"')
    .replace(/[‘’`]/g, "'")
    .replace(/[—–]/g, '-')
    // 줄바꿈을 공백으로 변환
    .replace(/[\r\n\t]+/g, ' ')
    // 연속 공백 단일화
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * 지문/OCR 텍스트에서 포함된 모든 숙어/연어/구동사를 고정밀 추출 (무제한)
 * 매칭된 숙어가 속한 본문 실제 문장(exampleSentence) 자동 결합
 */
export function extractEnglishPhrases(rawText: string): ExtractedPhraseResult[] {
  if (!rawText || typeof rawText !== 'string') return [];

  const cleanText = normalizeTextForPhraseSearch(rawText);
  if (!cleanText) return [];

  // 문장 목록 미리 분리
  const sentences = cleanText
    .split(/(?<=[.!?])\s+(?=[A-Z0-9"'])/)
    .map((s) => s.trim())
    .filter((s) => s.length > 3);

  const results: ExtractedPhraseResult[] = [];
  const foundPhrases = new Set<string>();

  for (const entry of COMPREHENSIVE_PHRASE_DICTIONARY) {
    if (foundPhrases.has(entry.phrase.toLowerCase())) continue;

    const match = cleanText.match(entry.pattern);
    if (match) {
      foundPhrases.add(entry.phrase.toLowerCase());

      // 매칭된 숙어가 속한 본문 실제 문장 찾기
      let enclosingSentence = '';
      for (const sent of sentences) {
        if (entry.pattern.test(sent)) {
          enclosingSentence = sent;
          break;
        }
      }

      results.push({
        id: `phrase-${entry.phrase.replace(/\s+/g, '-')}-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        phrase: entry.phrase,
        matchedText: match[0].trim(),
        meaning: entry.meaning,
        difficulty: entry.difficulty,
        selected: true,
        exampleSentence: enclosingSentence || '',
      });
    }
  }

  // 매칭된 문맥 길이 순서로 정렬 (더 구체적인 숙어가 상단에 오도록)
  return results.sort((a, b) => b.phrase.length - a.phrase.length);
}

