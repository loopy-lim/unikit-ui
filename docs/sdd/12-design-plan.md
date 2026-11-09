# UniKit 2차 사이클 설계·계획 — 디자인 토큰 일관성 시스템 (G1)

전제: docs/sdd/10-requirements.md(AC-9~12). 작성: System Architect + Platform/Tooling(오케스트레이터 역할 수행) · 판정: 독립 Architecture & Plan Reviewer(validate-plan plan 모드).

## 1. 설계 원칙

1. **값의 출처는 tokens.ts 하나** — 다른 모든 사본(globals.css 변수 블록·registry theme cssVars·문서 표)은 `generate:design`이 생성. 사람은 사본을 편집하지 않는다.
2. **검사는 생성의 역** — audit:design는 «생성 결과를 메모리에서 다시 만들어 디스크와 대조»+«침투 패턴 스캔»으로 일관성을 기계 판정한다(exit code). 생성과 감사가 같은 포맷터를 공유해 기준이 하나다.
3. **신규 의존성 0** — 스크립트는 bun 1.4.4가 직접 실행하는 TypeScript + node:fs/node:path 표준 모듈만 사용.
4. **1차 증거 불변** — 컴포넌트 소스 미수정, globals.css 재생성 결과는 현재 값과 동일(마커 주석만 추가). 쇼케이스 화면·동작 불변 → G4 N/A 근거.

## 2. 컴포넌트·파일 설계

### 2.1 generate:design (`packages/unikit/scripts/generate-design.ts`)

- 입력: `../src/theme/tokens.ts`의 `lightTokens`·`darkTokens`(키 순서 = tokens.ts 선언 순서, 멱등성의 기준).
- 산출 1 — `apps/web/app/globals.css`: 기존 `@layer base { :root{...} .dark{...} }` 블록을 생성 영역으로 교체. 파일에 생성 영역 표식을 넣는다:
  ```css
  /* ⛔ UNIKIT-TOKENS:BEGIN — bun run generate:design이 생성. 수동 수정 금지. */
  @layer base {
    :root { ... }   /* = lightTokens — 현재 파일 서식 byte 그대로(F-24):
                       @layer 0sp, :root/.dark 블록 2sp, 변수 행 4sp, "--k: v;" */
    .dark { ... }   /* = darkTokens */
  }
  /* UNIKIT-TOKENS:END */
  ```
  표식 밖(Tailwind 지시어·파일 머리 주석)은 수동 영역으로 남는다. 머리 주석은 «이 블록은 생성물»로 갱신(최초 1회 수동). 첫 실행 시 현재 블록과 byte 대조 — 불일치하면 중단(무손실 전환 보장, AC-9).
- 산출 2 — `packages/unikit/registry.json`의 theme 항목: JSON 파싱 후 `items`에 다음을 주입(이미 있으면 치환, 위치는 utils 다음 고정), 2-space로 재직렬화(나머지 항목은 파싱 순서 보존):
  ```json
  { "name": "theme", "type": "registry:theme",
    "cssVars": { "light": { "--background": "0 0% 100%", ... },
                 "dark":  { ... } } }
  ```
  근거(실측): shadcn 4.23.0의 `@shadcn/registry` 로더가 `registry:theme` 타입과 `cssVars:{light,dark}`를 통과시키고(dist 청크 — loadRegistryItem → route → add 플로우), CLI add는 theme 항목에 전용 확인 플로우로 소비자 CSS에 변수를 반영한다. 최종 실증은 V-12(소비자 재현).
- 산출 3 — `packages/unikit/docs/tokens.md`: 전체가 생성물(파일 머리에 생성 선언). 구성: 표(토큰 | 라이트 | 다크 | 역할 | 대표 클래스) 20행 + 토큰 사용 규칙(원색 금지·팔레트 직접 사용 금지·스케일 클래스 사용·재테마는 provider vars) 요약. 역할·대표 클래스는 스크립트 내 `TOKEN_META` 상수(사람이 다루는 유일한 메타데이터 — 값 아님)에서. 사용처 없는 토큰(`--popover` 등)은 «컴포넌트 확장용» 표기 규약으로 기재(AC-12).
- **기존 사본 대체(F-14)**: generate가 산출 3을 만들면 ① docs/components.md §테마 값 표는 값 열 제거·생성 카탈로그 참조로 대체(수동 편집 1회 — 값이 사라지므로 이후 드리프트 원천 없음) ② README 4-(d) 값 블록은 AC-11 add theme 절차 안내로 대체. 결과: 토큰 값 수동 사본 2곳 → 0곳.
- **무손실 전환 절차(O-2·F-23 목적 구분)**: 첫 generate 실행 전 4파일을 /tmp에 백업(커밋 0이라 git 기준 불가). 백업의 용도는 2종 — ① **무손실 대조 대상**(generate가 쓰는 globals.css·registry.json): 실행 후 생성 영역은 값 1:1, 영역 밖은 byte 불변. ② **T-15 대체 전 원본 보존**(README·docs/components.md — generate가 직접 쓰지 않음): AC-9의 «문서 표 값» 무손실은 «신규 생성 tokens.md의 값 ↔ 기존 문서 사본의 값» 파싱 대조로 치환해 증명. 이후 멱등성: 2회 연속 실행 시 3산출 모두 diff 0(V-9).

### 2.2 audit:design (`packages/unikit/scripts/audit-design.ts`)

검사 번호는 10-requirements AC-10 (a)~(g)와 대응시킨다.

| 검사 | 내용 | 매처/기준 |
|---|---|---|
| (a1) | globals.css 생성 영역 == tokens로 재생성한 내용 | 값 1:1(파싱 비교) — 마커 부재 시 FAIL |
| (a2) | registry.json theme 항목 cssVars light/dark == tokens 값 | 파싱 비교 |
| (b) | `src/`(tokens.ts 제외) 원색 리터럴 0건 | `#[0-9a-fA-F]{3,8}`(경계 포함)·`rgb(`·`rgba(`·`hsl(`·`hsla(`·`oklch(`·`color-mix(` |
| (c) | `src/components/*.tsx` + `registry/ui/*.tsx` 임의값 클래스 0건 | **클래스 형태만**: `[a-zA-Z][a-zA-Z0-9-]*-\[[^\]]+\]` — 코드 인덱싱(`HIT_SLOP[resolvedSize]`)·셀렉터 주석(`input[disabled]`)은 클래스 형태가 아니라 미매칭(F-16: 나이브 `[` 스캔은 무위반 트리에서 오경보 2건 실측) |
| (d) | registry/ui/*.tsx ↔ src/components/*.tsx, registry/lib/utils.ts ↔ src/lib/utils.ts | `@/lib/utils`→`../lib/utils` 치환 후 byte 동일 |
| (e) | registry.json files 경로 실재 | theme 항목(files 없음)은 예외 |
| (f) | docs/tokens.md == 재생성 내용 | byte 동일 — 문서 드리프트 차단 |
| (g) | `src/components`·`registry/ui` Tailwind 기본 팔레트 클래스 0건 | **확정 매처(F-20 — G1 확정)**: 클래스 문자열을 공백 경계 토큰 단위로 검사하되 변형 접두(`(?:[a-z-]+:)*` — `hover:`·`web:`·`focus-visible:`·`placeholder:` 등 반복 허용, 우회 방지)를 건너뛰고, 색 유틸리티 접두(bg\|text\|border\|ring\|fill\|stroke\|from\|via\|to\|divide\|outline\|decoration\|caret\|accent) 뒤 **팔레트 이름 고정 나열**(red\|orange\|amber\|yellow\|lime\|green\|emerald\|teal\|cyan\|sky\|blue\|indigo\|violet\|purple\|fuchsia\|pink\|rose\|slate\|gray\|zinc\|neutral\|stone) + `-\d{2,3}` 또는 `white`/`black`(불투명도 `/n` 접미 허용)만 매칭. 정규식: `/(?:^|\s)(?:[a-z-]+:)*(?:bg\|text\|border\|ring\|fill\|stroke\|from\|via\|to\|divide\|outline\|decoration\|caret\|accent)-(?:white\|black\|(?:red\|orange\|amber\|yellow\|lime\|green\|emerald\|teal\|cyan\|sky\|blue\|indigo\|violet\|purple\|fuchsia\|pink\|rose\|slate\|gray\|zinc\|neutral\|stone)-\d{2,3})(?:\/\d+)?(?=\s\|$)/g` — **긍정형 나열**이므로 허용 접미(토큰명·transparent·current·none)는 열거 없이 자동 통과. 양성 사례(전부 감지 — 감사 시뮬레이션 실측): `bg-zinc-500`·`text-white`·`from-black`·`border-gray-200`·`ring-red-500`·`hover:bg-zinc-500`. 음성 사례(전부 통과 — 현 트리 104토큰 오경보 0): `web:hover:bg-primary/90`·`placeholder:text-muted-foreground`·`focus-visible:ring-2`·`ring-ring`·`ring-offset-background`·`outline-none` |

- 출력: 검사별 OK/FAIL + 위반 상세(파일·줄·패턴). FAIL 1건 이상이면 exit 1. **모든 검사가 음수 테스트 대상**(V-11 — F-17). 검사 수 표기 통일(F-21): **요구 기준 7종 (a)~(g) — 내부 검사 8건((a1)(a2) 분해)**.
- package.json(packages/unikit)에 `"generate:design"`, `"audit:design"` 등록. 루트 package.json에 편의 스크립트 `"audit:design": "bun run --filter '@unikit/core' audit:design"` 등록(README 명령표 갱신).

### 2.3 소비자 전달(AC-11) — 변경 없는 전선 활용

- `apps/web`의 `/r/[name].json` + `shadcn/registry` 로더는 수정 없음(theme 항목이 registry.json에 있으면 그대로 서빙). 소비자는 `bunx shadcn add http://localhost:3000/r/theme.json` 한 번으로 CSS 변수를 받는다(손 복사 0).
- README 소비자 절 갱신: 토큰 설치 = add theme 1줄(기존 «globals.css 복사» 안내 대체).
- 홈페이지가 로컬(localhost:3000)인 현 상태는 1차 인계 그대로(게시 시 갱신).

## 3. 태스크 (T-13~T-16)

| 태스크 | 내용 | AC | 소유 파일 | 담당 |
|---|---|---|---|---|
| T-13 | generate-design.ts 구현 + globals.css 마커 전환(무손실 검증 포함) + package.json 스크립트 | AC-9 | packages/unikit/scripts/generate-design.ts, apps/web/app/globals.css, packages/unikit/package.json | Platform/Tooling |
| T-14 | audit-design.ts 구현(7검사) + package.json·루트 스크립트 + README 명령표 | AC-10 | packages/unikit/scripts/audit-design.ts, package.json(패키지·루트), README.md | Platform/Tooling |
| T-15 | registry theme 항목 주입 확인(generate 산출) + 소비자 재현(/tmp, add theme → 변수 주입 실증) + **기존 사본 대체(README 4-(d)→add 절차·docs/components.md 값 열 제거)** + docs/tokens.md 생성물 검수(미사용 토큰 표기 포함). **완료 기준 포함(F-19)**: README·docs/components.md에서 토큰 값 사본 패턴 스캔 0건(HSL 리터럴 `\d+(\.\d+)? \d+(\.\d+)?% \d+(\.\d+)?%` 및 `--[a-z-]+: <HSL값>` — 생성 카탈로그 참조 줄 제외) | AC-11, AC-12 | registry.json(generate가 침), README.md, docs/components.md, packages/unikit/docs/tokens.md(generate가 침) | Frontend/UI (배정 사유 F-25: 산출 물의 대부분이 소비자·문서 경험[README·컴포넌트 문서·소비자 재현 관찰]이고 도구 구현 T-13/14와 파일 소유가 분리되어 있어 1차 T-10/11 관례와 달라도 FE 배정이 자연스럽다 — 도구가 아닌 «전달되는 모습»의 검증 태스크) |
| T-16 | 통합 검증·문서 동기(10-requirements/12-design 인계, 실행 증거 문서 초안, ledger 행 준비) | 전 AC | docs/sdd/13-implementation-evidence.md, docs/sdd/ledger.md | 오케스트레이터 |

- 순서: T-13 → T-14 → T-15 → T-16(감사가 생성 산출을 대조하므로). 병렬 없음(파일 겹침: package.json·README).
- 컴포넌트 소스(`src/components/*.tsx`)·provider 는 **불변** — 1차 G4/G5 증거 보존(§1.4).

## 4. 검증 계획 (V-9~V-13)

- **V-9 (AC-9)**: /tmp 백업 → generate → 무손실 대조(생성 영역 값 1:1·영역 밖 byte 불변) → 2회 실행 diff 0(멱등) · 토큰 1개 임시 수정→generate→3산출 반영→원복→재생성·audit exit 0 회귀.
- **V-10 (AC-10)**: 현재 상태 `bun run audit:design`(루트) exit 0 + (a)~(g) 검사 보고 출력.
- **V-11 (AC-10 음수 — F-17)**: 요구 기준 7종 (a)~(g)에 대해 8개 주입 — (a1) globals.css 값 오염·(a2) registry cssVars 오염·(b) 원색 리터럴·(c) 임의값 클래스·(d) registry/ui 내용 분기·(e) files 경로 무효화·(f) tokens.md 드리프트·(g) 팔레트 클래스 — 각각 exit 1 + 해당 검사 FAIL 보고 → 원복 → exit 0. (g)의 양성·음성 사례는 §2.2 (g) 확정 매처의 사례 목록(감사 시뮬레이션 실측)을 그대로 사용.
- **V-12 (AC-11)**: /tmp 신규 소비자(1차 T-10 절차 준용)에서 `bunx shadcn add http://localhost:3000/r/theme.json` → 소비자 CSS 파일에 UniKit 변수 20종(라이트/다크) 주입 확인 + 서버 로그 200. 3000 서버는 기존 .next로 `next start`(레지스트리 라우트는 요청 시점 파일 읽기 — force-dynamic). 실패 시 10-requirements AC-11 fallback 계층 기준(lib CSS 파일 add+1줄 임포트, 값 손복사 0)으로 전환하고 경위를 문서 기록 후 재검증.
- **V-13 (회귀)**: 루트 `bun run --filter '*' typecheck` 3패키지 exit 0 · `/r/button.json`·`/r/registry.json` 여전 200(AC-7 회귀) · **쇼케이스 무변 근거(F-22 정정)**: ① 8081 정적 dist는 expo export 산출이며 본 사이클은 apps/expo를 전혀 변경하지 않으므로 재생성 요인 없음 — dist md5·mtime 불변 확인. ② globals.css(apps/web·3000 파이프라인)는 audit (a1)이 값 불변을 증명(캡처 유효 유지는 G0 감사 논리 검증 확인). · **기존 사본 0건 관찰(F-19)**: README·docs/components.md의 토큰 값 사본 패턴 스캔 0건(생성 카탈로그 참조 줄 제외).

## 5. 리스크와 대응

| 리스크 | 대응 |
|---|---|
| shadcn 4.23 add의 theme 반영이 예상과 다름(변수 미주입) | V-12에서 증명 실패 시 10-requirements §AC-11 fallback(lib 항목으로 CSS 파일 배포+문서 안내)으로 전환 — 설계 변경은 plan 문서 갱신 후 재검증 |
| registry.json 전체 재직렬화로 기존 서식 변동 | 파싱 순서 보존 + 2-space; diff는 theme 항목 추가와 들여쓰기 정규화로 한정 — V-12·AC-7 회귀로 서빙 무결 확인 |
| 마커 외 영역 수동 편집과 충돌 | 표식 밖은 수동 영역으로 명시; audit는 생성 영역만 대조(표식 부재 시 FAIL — 도입 초기 오류 방지) |
| TOKEN_META 메타데이터와 실제 컴포넌트 사용 불일치 | 대표 클래스는 실제 cva 문자열에서 인용(T-15 검수); audit 대상 아님(값 아닌 서술) |
| registry/ui·registry/lib 사본은 감사만 하고 생성하지 않음(O-3 설계 선택) | 사유: 소비자 배포본의 `@/` 경로 치환·registry 전용 메타는 curation 영역이라 자동 생성이 오히려 위험 — 드리프트는 감사 (d)가 종단 차단(분기 시 exit 1). 신규 컴포넌트 추가 시 이중 수작성 비용은 남지만, v0.1 컴포넌트 수(5종)에서 자동화 이득 < 복잡도 |

## 6. G4 예고 — N/A 사유

본 사이클은 툴링·배포 메타데이터·문서 추가이며 컴포넌트 렌더링·쇼케이스 UI는 불변(§1.4, V-13). 따라서 사용성·디자인 관찰 관문은 «비UI 변경 — N/A(사유: 위)»로 처리하고, 사용자 심사(UX/Design Auditor)는 G5 완료 감사로 통합 평가한다.
