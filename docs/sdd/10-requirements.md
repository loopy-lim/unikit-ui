# UniKit 2차 사이클 요구 — 디자인 토큰 일관성 시스템 (G0)

원 요청(2026-11-08): «좋아 그거 눌림 확인과 함께, 모든 디자인에 대해서 일관성을 쉽게 지키도록 하면 좋을꺼 같아. 특히 디자인에 대한 토큰 등 있자나.»

- 작성: Product Manager(오케스트레이터 역할 수행) · 판정: 독립 Requirements Auditor(validate-plan intake)
- 1차 사이클(G0~G5 + 네이티브 보충 PASS)과 독립적인 사이클이며, AC 번호는 1차 AC-1~8에 이어 **AC-9~AC-12**를 사용한다.

## 1. 배경 — «일관성을 쉽게 지킨다»의 현재 장애물 (2026-11-08 실측)

1차 사이클은 토큰 단일 출처(`packages/unikit/src/theme/tokens.ts` — 색 19종+radius, 라이트/다크)와 provider 주입을 확립했다. 그러나 **출처가 하나여도 사본이 여럿이고, 사본 일치는 전부 사람 손으로 확인한다**:

| # | 위험 | 현재 상태 | 검사 수단 |
|---|---|---|---|
| R-1 | `tokens.ts` ↔ `apps/web/app/globals.css` 변수 블록 — 값이 **수동 복사** | 지금은 1:1 일치 | G2 때 1회 수작업 대조 — 이후 없음 |
| R-2 | `packages/unikit/src/components/*.tsx` ↔ `packages/unikit/registry/ui/*.tsx` — 소비자 배포 본이 **수동 사본**(import 경로만 `@/lib/utils`로 치환) | 지금은 내용 동일(변환 1줄 제외) | 대조 없음 |
| R-3 | 새 컴포넌트에 원색 리터럴(`#fff`, `rgb(...)`) 침투 시 토큰 체계 이탈 | 지금은 0건(tokens.ts 제외) | grep 수작업 — 자동 없음 |
| R-4 | 임의값 클래스(`h-[37px]`, `bg-[#fff]` 등) 침투 시 스케일 이탈 | 지금은 0건(추정 — 검사 없음) | 없음 |
| R-5 | 소비자(shadcn add 사용자)가 토큰을 얻으려면 globals.css 블록을 **손으로 복사** — registry 6항목(utils·컴포넌트 5종)에 토큰 항목 부재 | 소비자 문서 안내만 | 재현 검증(T-10)은 컴포넌트만 |
| R-6 | 기계 검증되는 **정확한 값의** 카탈로그 부재 — 근사 표는 존재(docs/components.md §테마 20토큰 표·README 4-(d) 값 블록 전체 사본)하나 손 관리·검증 없음(값 사본 2곳이 오히려 R-1류 드리프트 위험) | 근사 사본 2곳 + tokens.ts 소스 | 없음 |

즉 «쉽게 지키도록»의 본질은 **사람의 기억과 수작업 대조를 기계의 생성·검사로 대체**하는 것이다.

## 2. 목표

1. 토큰 사본(globals.css·registry 항목·문서 표)은 `tokens.ts`에서 **생성**되어야 한다(수동 복사 제거).
2. 일관성 규칙(값 1:1·원색 금지·임의값 금지·사본 동일)은 **한 번의 명령**으로 검사되고 위반 시 실패해야 한다.
3. 소비자도 `shadcn add` **한 번**으로 토큰을 받아야 한다(손 복사 제거).
4. 토큰 목록·값·용도가 문서로 존재하고 그 문서도 출처와 어긋나지 않아야 한다.

## 3. 수용 기준 (AC)

### AC-9 토큰 단일 출처 생성
- `bun run generate:design`(packages/unikit) 실행 시 `tokens.ts`로부터 ① globals.css의 `:root`/`.dark` 변수 블록 ② 레지스트리 토큰 항목(AC-11 산출물) ③ 토큰 카탈로그 표(AC-12 산출물)가 **재생성**된다.
- 생성 결과는 현재 수동 본과 **값이 동일**(무손실 전환 — globals.css 값·registry 파일 내용·문서 표 값).
- 증명(F-14 감사 보강): ① **무손실 전환** — generate 실행 전 globals.css·registry.json·기존 문서 사본을 /tmp에 백업(커밋 0 상태라 git 기준 불가 — O-2) → 실행 후 대조: 생성 영역은 **값 1:1(파싱 비교)**, 생성 영역 밖(@tailwind 지시어·@layer 외곽·주석)은 byte 불변. ② 토큰 1개 임시 수정 → generate → 세 산출물 모두 반영 확인 → 원복·재생성·audit exit 0 회귀. globals.css 값 불변 = 1차 G4/G5 증거 유효 유지(computed style 불변 — 감사 논리 검증 확인).

### AC-10 디자인 일관성 자동 감사
- `bun run audit:design`(패키지 또는 루트)가 아래를 검사하고, 위반 발견 시 **exit 1 + 위반 목록 출력**, 무위반 시 exit 0:
  - (a) tokens.ts ↔ globals.css — 양 스킴 전 토큰 값 1:1(파싱 비교)
  - (b) src(전체, tokens.ts 제외) — **원색 리터럴 0건**. 매처(F-16): `#[0-9a-fA-F]{3,8}` 경계 포함·`rgb(`/`rgba(`·`hsl(`/`hsla(`·`oklch(`·`color-mix(`
  - (c) src/components — **임의값 클래스 0건**. 매처(F-16): 클래스 문자열 형태 `[a-zA-Z][a-zA-Z0-9-]*-\[[^\]]+\]`만 매칭(코드 인덱싱 `HIT_SLOP[...]`·CSS 셀렉터 주석 `input[disabled]`은 클래스 형태가 아니므로 제외 — 현 트리에서 나이브 `[` 스캔의 오경보 2건 실측 근거)
  - (d) registry/ui/*.tsx·registry/lib/utils.ts ↔ src 사본 — import 치환(`@/lib/utils`↔`../lib/utils`) 제외 내용 동일
  - (e) registry.json의 각 files 경로가 실재(files 없는 theme 항목은 예외)
  - (f) docs/tokens.md ↔ tokens.ts — 생성 내용과 byte 동일(문서 드리프트 차단)
  - (g) src/components·registry/ui — **Tailwind 기본 팔레트 클래스 0건**(F-18 — `bg-zinc-500`류는 (b)(c)에 걸리지 않으나 다크 전환되지 않는 일관성 파괴 경로). 매처: 색 유틸리티 접두(bg·text·border·ring·fill·stroke·from·via·to·divide·outline·decoration·caret·accent) 뒤 `white`/`black` 또는 `이름-숫자스케일`(`-[a-z]+-\d{2,3}`) 형태; 허용: 토큰명·transparent/current/none. 정확한 정규식은 G1 설계에서 확정하고 이 요건의 의미(팔레트 직접 사용 금지)가 보존되어야 한다.
- 증명: 현재 상태 exit 0(전 검사 보고) + **음수 테스트** — (a)(b)(c)(d)(e)(f)(g) 각 1건씩 일시 주입 시 해당 검사 FAIL·exit 1로 잡히는지(F-17) → 원복 → exit 0.

### AC-11 소비자 토큰 전달 자동화
- registry.json에 토큰 항목이 추가된다. 1순위는 shadcn 규격의 theme 항목(`type: "registry:theme"` + cssVars 라이트/다크 — 4.23.0 dist에 `registry:theme`·`transformCssVars`(cssVars→소비자 CSS 주입) 코드 경로 존재를 감사가 실측, 동작 재현은 V-12).
- **분기별 관찰 기준(F-15 — fallback도 스스로 관찰 가능해야 하며 본질 기준의 몰래 완화가 아님)**:
  - 1순위(theme 항목): /tmp 신규 소비자에서 `shadcn add <theme 항목 URL>` **1회** → 소비자 CSS 파일에 UniKit 변수 20종(라이트/다크) 주입 관찰. 손 작업 0건.
  - fallback(lib 항목 CSS 파일 — 1순위 재현 실패 시만): `shadcn add <lib 항목 URL>` 1회 → 소비자 프로젝트에 CSS 파일 복사 관찰 + 문서화된 적용 1줄(파일 임포트) 실행 후 20종 주입 관찰. **손으로 값을 복사하는 작업 0건**(파일 복사·1줄 임포트만 허용). fallback 채택 시 본 문서와 설계 문서에 «1순위 실패 경위»를 기록한 뒤 진행한다.
- 항목 내용은 AC-9의 생성 산출물(수동 작성 아님).

### AC-12 토큰 카탈로그 문서
- 토큰 20종(색 19+radius) 전부에 대해 이름·라이트 값·다크 값·역할(의미)·대표 사용 클래스(예: `--primary` ← `bg-primary`)를 담은 카탈로그가 저장소 문서로 존재한다(packages/unikit/docs/ 위치는 G1 확정). 사용처 없는 토큰(예: `--popover`)은 «쇼케이스 미사용·컴포넌트 확장용» 같은 표기 규약으로 기재한다.
- 카탈로그의 값 표는 AC-9 생성 산출물이며, audit:design가 생성 내용과 대조해 드리프트를 차단한다(AC-10 (f)).
- **기존 근사 사본 처우(F-14)**: docs/components.md §테마의 값 표는 값 열을 제거해 생성 카탈로그 참조로 대체하고, README 4-(d)의 값 블록 사본은 AC-11 절차(add theme) 안내로 대체한다 — 결과적으로 **토큰 값의 수동 사본은 2곳 감소**(R-6의 사본 2곳 제거, 신규 생성 카탈로그는 기계 검증 대상이라 제외). 관찰: 두 파일에서 값 사본 0건(패턴 스캔).

## 4. 명시적 범위 밖 (이번 사이클 미포함)

- **쇼케이스 UI 변경**(토큰 팔레트 섹션 등) — 1차 G4/G5 증거(캡처·실측) 보존. 필요 시 차기 사이클.
- **provider 재테마 API 확장**(토큰 오버라이드 프롭 등) — 기존 `vars()` 패턴은 유지하고 소비자 문서에 안내만 보강(AC-12 문서에 포함).
- **색 이외 신규 의미 토큰**(spacing/타이포 스케일 토큰화) — 현 설계에서 Tailwind 스케일 클래스(h-10·text-sm)가 그 역할을 하며(02-design §0.5·§2.2), 신규 체계 도입은 별도 요청이 필요한 설계 변경.
- **F-11 Pressable onPress 미발화** — 본 사이클과 무관한 별도 트랙(에뮬레이터 실험·release 빌드 확인 진행 중, 결과는 1차 증거 문서 §7에 기록).

## 5. 제약

- 패키지 매니저 bun 1.4.4만 사용(pnpm 금지 — 사용자 지정).
- **커밋 0 유지** — 커밋은 사용자 명시 요청 시만.
- 라이브러리 컴포넌트의 **렌더링·동작 불변**: 이 사이클은 생성·검사 도구와 배포 메타데이터 추가가 본질. 컴포넌트 소스 수정이 발생하면(하더라도) 1차 G4/G5 증거 갱신 필요 — 원칙적으로 미수정으로 설계.
- 생성·감사 스크립트는 신규 의존성 없이 Node/Bun 표준 기능으로(실행 환경 = bun 1.4.4).
- registry 소비 재현은 1차 T-10 절차 준용(로컬 3000 서버 + /tmp 격리 소비자).

## 6. 환경 사실 (오케스트레이터 실측, 평가자 재검증 대상)

- 토큰: `packages/unikit/src/theme/tokens.ts` — lightTokens/darkTokens `as const satisfies`(키 집합 컴파일 타임 일치), `--radius` 포함 20키.
- globals.css: `apps/web/app/globals.css` `@layer base` 내 `:root`/`.dark` 블록 — 2026-11-08 현재 tokens.ts와 1:1(유효 검증은 스크립트 필요 — 본 문서 §1 R-1).
- registry: `packages/unikit/registry.json` — homepage `http://localhost:3000/r/registry.json`(로컬 — 게시 시 갱신 예정), 항목 utils+ui 5종. 사본은 `packages/unikit/registry/{lib,ui}/`.
- 컴포넌트 5종(button·card·input·label·badge) — 원색 리터럴 0건(tokens.ts 제외, grep 실측).
- 패키지 scripts: `typecheck: tsc --noEmit` 유일. 루트: `bun run --filter '*' typecheck`.
- 소비자 재현 이력: 1차 T-10(`/tmp/unikit-consumer`, shadcn 4.23, `add http://localhost:3000/r/button.json` 성공 — 02-architecture §5).
- shadcn CLI 4.23의 registry:theme/cssVars 규격: dist에 `registry:theme` 타입과 `transformCssVars`(항목 cssVars를 소비자 tailwindCss에 주입) 코드 경로가 존재함을 G0 감사자가 실측 — 동작 재현은 V-12(소비자 재현)로 확정한다.

## 7. 차단 질문

없음 — 범위 결정(§4)은 «토큰 일관성» 원 요청의 직접 범위로 판단하고, 제외 항목은 사유와 함께 명시했다. 이의 있으면 평가자가 제기.
