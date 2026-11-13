/**
 * 데모 앱 "UniKit 도우미" — 가상 어시스턴트 대본(웹용 사본).
 * 실제 API 호출 없이 키워드 매칭으로 미리 쓴 답변을 타이핑하듯 흘려 보낸다.
 * 답변 속 수치는 저장소 사실 기준(src/components 61종 · registry.json 66아이템).
 * 엑스포 앱(apps/expo/components/demo/script.ts)에 동일 내용 사본이 있다 — 한쪽을 고치면 같이 고른다.
 */

export type DemoModel = {
  id: string;
  label: string;
  description: string;
  /** 한 번 스트리밍 틱에 붙는 글자 수 — 클수록 체감 빠르다 */
  charsPerTick: number;
  /** 답변 시작 전 생각 시간(ms) — 모델별로 살짝 다르게 */
  thinkingDelayMs: number;
};

export const DEMO_MODELS: DemoModel[] = [
  {
    id: "muni-mini",
    label: "무니 mini",
    description: "가볍고 빠른 기본 모델",
    charsPerTick: 2,
    thinkingDelayMs: 640,
  },
  {
    id: "muni-pro",
    label: "무니 pro",
    description: "더 매끄럽게 쏟아지는 스트리밍",
    charsPerTick: 5,
    thinkingDelayMs: 420,
  },
];

export type DemoSuggestion = {
  title: string;
  description: string;
  prompt: string;
};

/** 첫 화면(Empty)·홈 빠른 질문 — 전부 대본에 있는 주제 */
export const DEMO_SUGGESTIONS: DemoSuggestion[] = [
  {
    title: "구성 알아보기",
    description: "컴포넌트가 몇 종인지, 레지스트리 규모",
    prompt: "UniKit에 컴포넌트가 몇 종 있어?",
  },
  {
    title: "설치 방법",
    description: "npm 패키지와 소스 복사 두 가지 길",
    prompt: "새 프로젝트에 어떻게 설치해?",
  },
  {
    title: "크로스플랫폼",
    description: "웹·네이티브가 같은 소스로 도는 원리",
    prompt: "웹과 네이티브는 어떻게 하나의 코드로 돼?",
  },
  {
    title: "테마",
    description: "다크 모드 전환 원리",
    prompt: "다크 모드는 어떻게 바꿔?",
  },
];

export type DemoRecent = {
  title: string;
  preview: string;
  time: string;
  prompt: string;
};

/** 홈 "이어서 하기" 목록 — 누르면 그 질문으로 새 대화가 시작된다 */
export const DEMO_RECENTS: DemoRecent[] = [
  {
    title: "레지스트리 구성",
    preview: "66아이템 안에 뭐가 들어가 있어?",
    time: "3분 전",
    prompt: "레지스트리 아이템 구성을 알려줘",
  },
  {
    title: "폼 조합",
    preview: "Field와 Form을 같이 쓰는 방법",
    time: "1시간 전",
    prompt: "폼 관련 컴포넌트는 어떻게 조합해?",
  },
  {
    title: "임의값 클래스",
    preview: "w-[340px] 같은 값은 왜 금지야?",
    time: "어제",
    prompt: "임의값 클래스는 왜 쓰면 안 돼?",
  },
];

type DemoAnswer = { keywords: string[]; answer: string };

const ANSWERS: DemoAnswer[] = [
  {
    keywords: ["몇 종", "컴포넌트 수", "구성", "규모", "레지스트리", "아이템"],
    answer:
      "지금 UniKit은 packages/unikit/src/components에 61종이 있고, registry.json에는 67아이템(UI 61 + utils 1 + theme 4 + animations 1)이 등록돼 있어요.\n\n같은 본문이 registry/ui 트리에도 사본으로 들어 있어서 소비자 프로젝트로 복사할 수 있어요. 쇼케이스의 Components 목록이 그 61종을 전부 살리고 있으니 둘러보세요.",
  },
  {
    keywords: ["설치", "install", "시작", "추가", "add"],
    answer:
      "두 가지 방법이 있어요.\n\n1) npm 패키지 — bun add @unikit-bridge/ui 로 설치해요(0.3.0부터 61종 전량 포함).\n\n2) 소스 복사 — shadcn CLI 규격 레지스트리(/r/registry.json)에서 컴포넌트 소스를 내 프로젝트로 가져와요. 복사한 코드는 내 것이 되니 자유롭게 고칠 수 있어요.",
  },
  {
    keywords: ["브리지", "네이티브", "웹", "플랫폼", "크로스", "같은", "어떻게 하나"],
    answer:
      "플랫폼 분기는 컴포넌트 코드가 아니라 패키지 exports 조건이 담당해요. react-native 조건이면 bridge/native.tsx, default(웹)이면 bridge/web.tsx로 해석돼요.\n\n덕분에 컴포넌트 안에는 Platform.select나 .web.tsx 파일이 없어요. 이 데모 앱도 웹과 엑스포에서 같은 컴포넌트로 만들어졌어요.",
  },
  {
    keywords: ["다크", "테마", "dark", "모드", "색"],
    answer:
      "다크 모드는 색 토큰의 값 전환으로만 구현해요. dark: 변형 클래스는 쓰지 않기로 한 규칙이에요.\n\n앱에서는 UnikitThemeProvider가 colorScheme을 들고 있어서 toggleColorScheme 한 번으로 전체 토큰이 뒤집혀요. 이 화면 오른쪽 위 토글로 직접 확인해 보세요.",
  },
  {
    keywords: ["임의값", "arbitrary", "340", "동적", "style"],
    answer:
      "w-[340px] 같은 [ ] 값 클래스는 금지예요. 감사(audit:design)가 임의값 클래스를 실패로 처리하거든요.\n\n동적 값이 필요하면 className 대신 style prop으로 넘겨요 — 동적 style 계약이 컴포넌트마다 마련돼 있어요.",
  },
  {
    keywords: ["폼", "form", "field", "조합"],
    answer:
      "폼은 Field가 라벨·설명·오류 메시지 자리를 잡고, Form이 제출·검증을 묶어요. react-hook-form 연동은 peerDependencies로만 선언돼 있어서 실제로 쓸 때만 설치해요.\n\nLabel · Input · Select · Checkbox 같은 입력 컴포넌트는 단독으로도 쓸 수 있어요.",
  },
];

const FALLBACK_ANSWER =
  "좋은 질문이에요! 저는 UniKit 데모 앱의 가상 도우미라 실제 추론은 없고, 미리 쓴 답변만 흘려 보낼 수 있어요.\n\n컴포넌트 수 · 설치 · 브리지 · 다크 모드 · 임의값 클래스 · 폼 조합 중 하나를 물어보면 자세히 답해요. 모델 전환(무니 mini/pro), 첨부, 재시도 같은 화면 요소도 이리저리 만져 보세요.";

/** 질문 텍스트에서 키워드를 찾아 대본 답변을 고른다 */
export function answerFor(prompt: string): string {
  const q = prompt.toLowerCase();
  for (const entry of ANSWERS) {
    if (entry.keywords.some((keyword) => q.includes(keyword.toLowerCase()))) {
      return entry.answer;
    }
  }
  return FALLBACK_ANSWER;
}

/** 데모 첨부 파일 후보 — 첨부 버튼을 누를 때마다 순서대로 붙는다 */
export const DEMO_FILES = [
  { name: "쇼케이스-스크린샷.png", kind: "image" as const, size: "142 KB" },
  { name: "감사-로그.txt", kind: "file" as const, size: "3 KB" },
  { name: "토큰-카탈로그.md", kind: "file" as const, size: "18 KB" },
];
