# 103 — nsh 네이티브 킵 0.5.0 검증 결함 수리

- 날짜: 2026-11-25(수리) · 2026-11-26(PR·독립 리뷰)
- 상태: 완료(게이트 통과 — §6). PR «nsh 네이티브 킵 반영과 0.5.0 검증 결함 수리»에
  `sdd:pr` 라벨을 붙여 독립 리뷰를 받는다 — 결과는 §9
- 선행: [102-nsh-native-kit.md](102-nsh-native-kit.md)
- 이슈: [#45](https://github.com/loopy-lim/unikit-ui/issues/45)

## 1. 요청과 범위

사용자 요청: 0.5.0 검증 보고(게이트 4종은 통과했지만 화면·조작에서 결함이 남았다)의
결함을 «순서대로 모든 것을 고쳐줘. issue로 올려줘» — 작업 결함 8건·안내 1건·검증
2건·원본값 복원 1건·유지보수 1건·메모(범위 밖 후보) 1건을 이슈 #45로 추적하고
전부 처리했다.

운영 판단 두 가지:

- 이슈에 `sdd:ready` 라벨을 붙이지 않았다 — 붙이면 구현 세션이 자동으로 하나 더
  떠서 같은 파일을 동시에 고친다.
- 독립 리뷰는 이슈가 아니라 PR의 `sdd:pr` 라벨로 받는다(사용자 «피알 열고 t3로
  라벨 달아서 검증하고 검증한거 토대로 잘 되면 마무리 및 버전업 하자» — §9).
  수리 직후의 평가는 작성과 같은 세션이 했고 수단은 게이트 재실행·tarball 신규
  설치 프로브·웹·안드로이드 에뮬레이터 화면 직접 확인이다(§8).
- PR은 로컬 main의 미푸시 커밋 3개(126c058·40d8ff4·850267c — 0.5.0 게시분)를
  기반으로 열린다. origin/main은 f0c9349까지라 nsh 네이티브 킵 자체가 원격에
  없었고, PR의 차이에는 그 3커밋(52파일)과 수리분이 함께 들어간다.

검증 대상은 npm에 올라간 0.5.0 그대로였고, 수리분은 같은 방식(`bun pm pack` →
다른 폴더에 신규 설치)으로 다시 확인했다. 패키지 버전은 이 PR 안에서는 0.5.0
그대로고, 독립 리뷰를 통과해 머지한 뒤 0.6.0으로 올린다 — API가 바뀌었다(§4).

## 2. nsh 계약 실측(103에서 새로 확인한 것)

| 질문 | 결과 | 근거 |
| --- | --- | --- |
| 문자열 children | nsh/base의 Button·Checkbox·Switch·Radio는 문자열 children을 받지 못한다 — 라벨이 그려지지 않고 `error invalid op: UnknownNode` | 0.5.0 재현, 수리 후 웹·안드로이드 프로브 |
| Dialog 레이어 | `class`·`style`은 팝업(children을 감싸는 뷰)에 붙고 레이어는 창 전체를 덮는다. 백드롭은 `backdropClass`/`backdropStyle`을 줘야 생기고, 바깥 누름은 `onOpenChange(false)`(nsh reason `backdropPress`), 안드로이드 뒤로가기도 닫는다(reason `cancel`) | 웹 x-kit T1~T5, 안드로이드 and-kit K1~K8 |
| Dialog testID | 레이어의 이름으로만 쓰이고 눌림 대상이 아니다 — 바깥 누름은 `backdropTestID`로 백드롭을 찾아 누른다 | and-kit K2 |
| 안드로이드 Dialog 상태 바 | 기본은 상태 바 아래에서 시작해 딤이 위 68dp를 덮지 않는다. `android={{ statusBarTranslucent: true }}`면 844dp 전체를 덮는다 | and-kit K1(백드롭 {0,0,390,844}) |
| Sheet | 패널 클래스는 `popupClass`로만 붙는다(`class`는 패널에 적용되지 않는다). 바깥 누름·뒤로가기는 기본으로 닫힌다. testID를 테스트 드라이버에 노출하지 않는다. nsh 기본 side는 bottom이고 백드롭은 상태 바까지 덮는다 | x-kit T3~T5, and-kit K5~K8 |
| 열림 상태 | `open`을 항상 넘기면 제어형이 되어 앱이 값을 내려주지 않는 한 닫히지 않는다. signal은 `set`하면 즉시 바뀐다 — 이전 값은 바꾸기 전에 읽어야 한다 | T1~T2, K1~K3 |
| 본문 수명 | Dialog/Sheet의 children은 열릴 때마다 다시 만들어진다 — 본문 안 signal 상태는 닫으면 사라진다 | 프로브 |
| 글자색 | 클래스 없는 `Text`는 검정(0,0,0)으로 고정이다. 뷰의 `text-*` 색과 `text-center`는 자식 Text에 상속된다(웹·안드로이드 동일) | `spanStyle`, 픽셀 덤프 |
| 테두리 | 색을 붙이지 않은 `border`(너비만)는 검정으로 그린다 — 브리지처럼 모든 요소에 기본 테두리색을 주는 규칙이 없다. 킵의 테두리는 색을 함께 쓴다 | 웹 실측 |
| flex 방향 | nsh의 `flex`는 가로 기본이다(브리지는 세로 기본) — 킷 클래스는 `flex-row`/`flex-col`을 항상 붙이고 audit (h)가 강제한다 | `nsh-types/types.d.ts:267` |
| ScrollView | flex-1 부모 안에서 `class="flex-1"`이 있어야 스크롤한다 | 안드로이드 실측 |
| 아이콘(Canvas) | `draw` 안에서 `token()`을 읽으면 색 스킴이 바뀔 때 `draw`가 다시 실행된다. 인라인 style은 `size-*` 클래스를 이긴다 | 안드로이드 다크 갤러리, 크기 실측 |
| 테스트 드라이버 | `width`/`height` 열기 옵션은 `--target android`에서 미지원, 스크린샷은 `--target` 실행에서만 찍힌다, 비활성 누름은 `ERR_NSH_TEST_DISABLED`. `nsh test`는 번들만 하고 `nsh check`가 타입 검사를 한다(`App.tsx` 진입 필요) | 프로브 실행 |

## 3. 수리 내용(이슈 #45 번호 순)

**작동 결함**

1. **다크 모드 아이콘·체크표시 색** — `icons.tsx`가 색을 `draw` 바깥에서 한 번만
   계산했다. 색을 `draw` 안에서 `props.color ?? iconColor(props.className)`로
   읽게 했고 props도 읽는 시점에 받게 했다.
2. **체크박스 표시가 늘 그려짐** — `indicator`를 체크·중간일 때만 넘긴다. 글리프는
   원본값 `size-3.5`로 되돌렸다(0.5.0은 `size-3`).
3. **Sheet 패널 꾸밈·배경** — 패널 클래스를 `popupClass`로, 백드롭을
   `backdropClass="bg-black/50"`로 넘긴다.
4. **Sheet 비제어형이 안 닫힘** — 내부 signal과 제어형 `open`을 구분한다(§2 열림 상태).
5. **Dialog** — React 포팅과 같은 컴파운드로 다시 썼다. 팝업은
   `my-auto self-stretch p-4` + 인라인 `pointerEvents: "box-none"`, 카드는
   `w-full max-w-lg mx-auto … shadow-lg pointer-events-auto`, 백드롭은
   `backdropClass`, X 닫기 버튼(`absolute right-3 top-3 rounded-sm p-1 opacity-70`
   — React 포팅 값), `animation="fade"`, 안드로이드는 `statusBarTranslucent: true`.
   머리 주석의 «바깥 탭 닫기 지원» 주장도 실측대로 고쳤다.
6. **문자열 라벨** — 새 파일 `src/nsh-ui/label.tsx`의 `wrapLabel`이 문자열·숫자
   children을 전경색을 둔 `Text`로 감싼다. Checkbox·Switch·RadioGroupItem·
   Pressable·Dialog/Sheet의 Trigger·Close에 적용했다.
7. **아이콘 `size-*` 클래스** — `size` prop을 준 때만 인라인 크기를 쓴다.
8. **비활성 라디오** — `disabled:opacity-50`을 안쪽 View에서 호스트 행으로 옮겼다.
   더해 Checkbox·Switch·RadioGroupItem의 호스트 행에 `text-foreground`를 두었다 —
   클래스 없는 `Text`를 라벨로 넘겨도 색 스킴을 따른다(안드로이드 다크 실측:
   수리 전 (0,0,0) → 수리 후 (250,250,250)).

**안내**

9. 루트에 `bg-background text-foreground`를 두라는 안내를 `packages/unikit/README.md`의
   «nsh runtime notes» 블록에 넣었고, 데모 앱 루트에 적용했으며, 회귀 7)단계가 클래스
   없는 Text가 루트 색을 상속하는지까지 확인한다.

**검증**

10. 회귀(`apps/nsh/App.test.tsx`) 8단계 → 13단계. 8) 체크박스 9) 라디오(비활성
    항목 거절 포함) 10) textarea 11) Dialog(열기→DialogClose→재개→밖 누름) 12) Sheet.
    7) 색 스킴 단계는 전경색 토큰값(`#09090b` ↔ `#fafafa`)까지 본다.
11. `audit:design` — (c) 임의값·(g) Tailwind 팔레트 대상에 `src/nsh-ui`를 더하고,
    (h)에 nsh 규칙(방향 없는 `flex` 금지)을 넣었다. (g) 허용 목록에 nsh 킵
    Dialog·Sheet의 `bg-black/50` 2건을 등록했다(원본값).

**shadcn 원본 대비 이탈 — 원본값 복원**

12. SheetHeader `gap-1.5 p-4`, SheetFooter `mt-auto flex flex-col gap-2 p-4`,
    SheetTitle은 무게만(`text-lg` 없음), 시트 면 경계선은 안쪽(`border-l` 등),
    기본 side `right`, DialogTitle `leading-none`, Dialog/Sheet의 X 닫기 버튼과
    Trigger/Close/Content 묶음, Switch 엄지 다크 변형
    (`bg-foreground checked:bg-primary-foreground`), Card `text-card-foreground`,
    체크 글리프 `size-3.5`. 머리 주석(이식 규칙 9조)에 판단을 적었다.

**유지보수**

13. `bun run sync:nsh-types`로 `nsh-types/` 8파일 재생성, AGENTS.md의 수치·검사
    대상 표기 갱신(12패밀리 32export, 회귀 13단계, audit 대상에 src/nsh-ui), 포털
    `../unikit`에서 `bun run sync:data` 재실행(§5).

**메모(범위 밖 후보)**

14. 처리한 것: `react`를 선택 peer로(`peerDependenciesMeta`) — nsh 전용 앱은
    react 없이 4패키지만 설치된다. `@ui-sdk/core` 설치 안내를 README에. Pressable·
    Trigger·Close·DialogContent의 `accessibilityLabel`. `ScrollView`은
    `className="flex-1"`이 필요하다는 안내를 README에.
    안드로이드 Escape: 휴대폰에는 Escape 키가 없고 그 역할은 뒤로가기다 —
    `app.back()`으로 Dialog·Sheet가 닫히는 것을 확인했다. 하드웨어 키보드 Escape는
    nsh가 소유하며 이번 프로브에서는 보내지 않았다(로드맵).
    웹 Input placeholder «왼쪽에 붙음»은 **결함이 아니었다** — placeholder 잉크
    x=55, 입력 테두리 x=41(12px 안쪽), 0.5.0 갤러리에서도 placeholder 26·입력값 25.
    축소한 스크린샷을 잘못 읽은 것이었다.

더불어 고친 문서: `docs/install.md`·`docs/install.en.md`·루트 README 두 쪽은
게시분 설명이 0.4.1에 머물러 있어 0.5.0(2026-11-24) 게시 사실을 더했다
(`npm view`로 확인). `llms.txt`의 버전·export 수도 같은 기준으로 갱신한다.

## 4. API 변화(0.5.0 게시분 대비)

- Dialog/Sheet 본문은 `<DialogContent>`·`<SheetContent>`로 감싼다(0.5.0은
  Dialog/Sheet의 children이 곧 본문).
- `side`는 Sheet에서 `SheetContent` prop으로 옮겼고 기본값은 `right`(0.5.0은 `bottom`).
- 변형 export 이름 `sheetPanelVariants` → `sheetContentVariants`(React 포팅과 같다).
- 신설: `DialogTrigger`·`DialogClose`·`SheetTrigger`·`SheetClose`.
  `DialogContent`에 `showCloseButton`(기본 true)·`backdropTestID`·
  `accessibilityLabel`·`android`·`ios`. `DialogFooter showCloseButton`(기본 false)는
  React 포팅과 같다.
- export 수: 15파일, 값 88종(아이콘 32 + 컴포넌트 32 + 프리미티브 5 + 변형 19),
  타입 30종. 0.5.0은 컴포넌트 26export였다.
- `react`가 선택 peer가 됐다.

## 5. 검증 증거(2026-11-25 실측)

**tarball 신규 설치 프로브**(`bun pm pack` → 다른 폴더에서 `bun install`)

- tarball 430,418 B(압축 해제 1.54MB, 118파일). 설치되는 패키지 4종
  (cva·clsx·tailwind-merge·ui) — react 없음.
- `nsh check` exit 0. 웹 타깃 x-kit 5/5 + x-kit-t3 1/1, 안드로이드 and-kit 8/8.
- Dialog(안드로이드): 카드 {16,326,358,192}(390×844에서 좌우 16 여백·수직 중앙),
  백드롭 {0,0,390,844}. 제목 색 `#09090b` → 다크 `#fafafa`, 설명 `#71717a` → `#a1a1aa`.
  카드 안 누름은 백드롭으로 새지 않고, 여백 누름·X·footer Close·뒤로가기가 닫는다.
- Sheet(안드로이드): right 본문 {98.5,0,291.5,844}, top {0,0,390,132.5},
  bottom {0,769.5,390,74.5}. 웹 900폭에서 패널 383(max-w-sm 상한).
- 데모 앱(웹·안드로이드): 카드 폭 358로 동일, Dialog 카드 {16,334,358,176},
  Sheet 웹 {99,0,291,844}·안드로이드 {98.5,0,291.5,844}.

**화면 직접 확인** — 웹 타깃·안드로이드 에뮬레이터 각각 라이트·다크·Dialog 다크·
Sheet 다크 스크린샷과 안드로이드 갤러리 라이트·다크 5장씩. 미체크 상자에 표시
없음, 다크에서 체크 표시·X·아이콘이 전경색, 비활성 항목 흐림, Dialog 배경 딤.

**아이콘 크기**(안드로이드) — `size-3` 12×12, `size-4` 16×16, `size-8` 32×32,
`size` prop 8·24 → 8×8·24×24.

**포털 동기화** — `../unikit`의 `bun run sync:data`: 아이템 71종·사용법 66종·
742.9 KiB 생성. `packages/mcp/src/data.ts`의 상수 2개가 바뀌었다(커밋하지 않음).
`DOCS_JSON`은 이 사이클의 llms.txt 버전 표기(0.4.1 → 0.5.0) 때문이고,
`ITEMS_JSON`은 input-group·menubar 2아이템 — 이 사이클과 무관하게 main보다
뒤처져 있던분이다(포털 마지막 동기화 f93d194가 2026-11-22, 이 저장소 52ea674가
2026-11-24).

## 6. 게이트(2026-11-25 수리, 2026-11-26 커밋 직전 재실행)

- `bun run typecheck` — 7워크스페이스 exit 0.
- `bun run audit:design` — 10/10 PASS. (c) 146파일, (g) 146파일(허용 28건),
  (h) 브리지 126파일 + nsh-ui 20파일 위반 0.
- `cd apps/nsh && nsh check` — exit 0. `nsh test` — 13단계 PASS(웹 1.1초, 안드로이드
  에뮬레이터 9.4초). 데모 번들 174,971 B(102는 154,048 B). 경고 0.
- `bun install --frozen-lockfile` — 변경 없음(CI 설치 조건).

§5의 tarball 수치는 2026-11-25 마지막 소스 변경 뒤 다시 팩해 확인한 값이다.
2026-11-26 커밋 직전 정리 — 라벨 클래스 문자열 4곳을 `label.tsx` 한 곳으로(Pressable의
cva 1개 삭제), audit (h) nsh 규칙의 위반 줄 번호 정정(주석 줄을 지운 뒤 세어 주소가
밀려 있었다 — 가짜 위반 1건을 넣어 실제 줄 번호로 보고되는지 확인), 주석 정리 — 뒤에
typecheck·audit:design·nsh check·nsh test 웹 13단계를 다시 돌렸고 전부 통과했다.
이 정리는 클래스 문자열을 바꾸지 않았고, 안드로이드는 에뮬레이터가 꺼져 있어 다시
돌리지 않았다(9.4초는 정리 전 측정).

## 7. 범위 밖 관찰·로드맵

- Card의 `shadow-sm`이 React 포팅·nsh 킵 양쪽에 없다(원본에는 있다) — 양쪽을
  함께 봐야 해서 이번 범위에서는 손대지 않았다.
- `docs/install.md`의 «npm 전용 서브진입점» 절이 세 가지만 적고 있다 — 100·102
  사이클로 더 늘어난 진입점(ui-sdk-renderer·agent·nsh 등)이 빠져 있다.
- 킵 `ScrollView`의 기본 `flex-1` 검토(RN ScrollView는 flexGrow 기본값이 있다).
- 하드웨어 키보드 Escape로 nsh Dialog·Sheet가 닫히는지 확인.
- 포털 `data.ts`는 이 작업 전에 이미 이 저장소 main보다 뒤처져 있었다(52ea674의
  레지스트리 사본 2종 미반영) — AGENTS.md의 «고치면 sync:data» 규칙이 지켜지지
  않으면 재발하므로 동기화 시점을 게시 절차에 묶을지 검토.
- npm 게시는 사용자 결정이다(버전은 독립 리뷰 통과 뒤 0.6.0 — §1).

## 8. 평가 방식과 한계

- 수리 직후의 평가는 작성≠평가 분리를 지키지 않았다(같은 세션). 객관적 근거는
  §5·§6의 기계 출력과 스크린샷이며, 독립 리뷰는 PR `sdd:pr`로 따로 받는다(§9).
- 검증 환경은 웹 타깃(헤드리스·실제 타깃)과 안드로이드 에뮬레이터 390×844 하나다.
  iOS·실기기는 확인하지 않았다.

## 9. 독립 리뷰(PR `sdd:pr`, 2026-11-26)

이 문서가 들어가는 PR에 `sdd:pr` 라벨을 붙여 클린 컨텍스트 리뷰 세션에 검증을
맡긴다(수리 세션은 리뷰에 개입하지 않는다 — 결함 지적이 오면 그때 수정한다).
리뷰 판정과 반영 내용은 리뷰가 끝난 뒤 여기에 기록한다.

**PR 준비 중 발견(PR [#46](https://github.com/loopy-lim/unikit-ui/pull/46))**

- 첫 푸시에서 CI `verify`가 실패했다 — `bun run typecheck`의 `unikit-nsh-demo`가
  `.nsh/tsconfig.json` 부재(TS5083)로 쓰러졌다. nsh 데모 워크스페이스는 102에서
  들어왔지만 그 커밋들이 한 번도 원격에 푸시된 적이 없어 CI를 처음 만난 것이다.
  nsh CLI는 npm 패키지가 아니라서 `bun install`로 생기지 않는다 — 러너에 따로
  설치하는 일은 범위 밖으로 두고 `ci.yml`·`publish.yml`의 타입 검사에서 이
  워크스페이스를 제외했다(`--filter '*' --filter '!unikit-nsh-demo'` — 로컬에서
  나머지 6워크스페이스만 선택되는 것을 확인). nsh 데모 게이트는 로컬 `nsh check`·
  `nsh test`가 그대로 담당한다(AGENTS.md에 적었다). 같은 명령을 쓰는 publish
  워크플로도 GitHub Release로 게시하면 같은 이유로 쓰러졌을 것이다.
- 라벨 순서 실수: CI 실패를 보기 전에 `sdd:pr`을 붙였다가 85초 만에 뗐다
  (16:08:55Z 붙임 → 16:10:20Z 제거). 웹훅 배달은 접수되어 오케스트레이터 세션이
  1개 열렸지만(16:08:59Z) 첫 턴이 바로 실패했다 — `Pi RPC set_model failed: Model
  not found: anthropic/glm-5.3`. 웹훅 작업(`scheduled-task:7d99af0d`)과 라우팅
  설정(`t3-routing.local.json`)은 11-22에 pi zai 제공자의 `anthropic/glm-5.3`으로
  맞춰 두었는데, 그 제공자의 모델 이름은 지금 `zai-plan/glm-5.3` 꼴이다
  (`orchestrator_capabilities` 실측 — `zai-plan/glm-5.4`·`zai-plan/glm-5.3`·
  `zai-plan/glm-5.3-flash`). 리뷰는 시작되지 않았다. 작업 모델은 도구로는 바꿀 수
  없어 사람이 T3 설정에서 바꿔야 한다.
- 이 PR이 `.github/workflows`를 건드리게 되어, 리뷰 파이프라인 규칙상 자동 머지
  대상이 아니다(보호 경로) — 판정 PASS 뒤에는 머지를 사람이 한다.
