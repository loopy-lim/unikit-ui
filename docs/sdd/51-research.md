# 조사 요약 — 사이클 40 경쟁 재확인 · 사이클 50 소개 사이트

작성: Codebase Researcher + Tooling & Runtime Analyst (독립 explore 스폰) · 교차: role-perspective self-review · 2026-11-10 · 기준 `ee37765`

## 구조 사실

- 마케팅/소개 사이트 **없음**. `apps/web` `/`는 28종 컴포넌트 쇼케이스 전용.
- 레지스트리: `/r/[name]`, `/r/registry.json` — 보존 필수.
- Expo·Web 쇼케이스는 **공유 모듈 없는 이중 미러** (`apps/web/app/page.tsx` ↔ `apps/expo/app/index.tsx`).
- 토큰: `packages/unikit/src/theme/tokens.ts` → `generate:design` → `apps/web/app/globals.css` 마커 블록.
- 폰트/모션 라이브러리: `apps/web`에 `next/font`·framer-motion **미사용**.

## 검증 명령 (실존)

| V 후보 | 명령 | cwd |
|---|---|---|
| typecheck | `bun run typecheck` | 루트 |
| audit | `bun run audit:design` | 루트 |
| web-build | `bun run build` | `apps/web` |
| web-dev | `bun run dev` 또는 `bun x next dev -p 3000` | `apps/web` |

CI: `.github/workflows/ci.yml` — install → typecheck → audit → web build → expo android export.

## 인계 판단 입력

- 소개 사이트는 **`apps/web` 확장**이 사실상 유리(레지스트리 단일·Next 스택 기존재).
- `/`를 랜딩으로 쓰면 쇼케이스 경로 이동과 README 갱신 필요.
- `docs/sdd/40-requirements.md`는 별 사이클 미커밋 — 보존.

## 4. 2026-11-10 경쟁 갭 재확인 — 사이클 40 완성 시점

작성: Codebase Researcher · 2026-11-10 · 섹션 번호는 위 3개 무번호 섹션 뒤 4번 부여(기존 내용 무수정·추가 전용).

**확인 수단**: WebFetch(ui.shadcn.com 문서·체인지로그) + GitHub Contents API(`gh api`/`curl`, 2026-11-10 스냅숏) + npm Downloads API. 기존 분석(2026-11-09~10) 대비 변화만 별도 표기.

**도구 한계**: `astryx.dev` 접속 3회 모두 실패(WebFetch 2회 TLS handshake failure · MCP webReader 1회 500) → Astryx는 GitHub·npm 관찰로 대체했고, **사이트 디자인 경향·문서상 컴포넌트 분류는 미확인**(필요 시 추정 표기).

### 4.1 shadcn/ui — 카탈로그 66(문서)·61(ui 디렉터리), MCP 7도구 변화 없음

- 문서 사이드바 **66종**(https://ui.shadcn.com/docs/components). 이 중 **Code Block·Trace에 "New" 태그** 부착.
- GitHub `apps/v4/registry/new-york-v4/ui` = **컴포넌트 61종 + `_registry.ts` 총 62 파일**(Contents API 실측). 문서 66과의 차이는 data-table·date-picker·toast(=sonner 중복)·typography·questionnaire·code-block·trace 등 레시피/신규 문서 페이지.
- 체인지로그(https://ui.shadcn.com/docs/changelog): **2026-10 Trace·Code Block 추가**(Base UI·React Aria·Radix 3엔진 × 8스타일) 및 **AI Elements 21 패턴**(Chat·Prompt Input·Reasoning·Tool 등, 카피인 방식·에이전트용 마크다운 페이지 제공). 2026-09 독립 `cn` 패키지 + `shadcn migrate cn`. 2026-08 비공개 GitHub 레지스트리·Questionnaire. **2026-11 항목은 아직 없음**.
- 대화형 계열(bubble·message·message-scroller·attachment·marker·direction)은 이미 본 카탈로그에 편입 — UniKit이 이번 사이클에 이식 중인 신규 목록과 정확히 일치.
- MCP 서버 **7도구 그대로** — 소스 `packages/shadcn/src/mcp/index.ts`의 `registerTool` 호출 7회 실측(`get_project_registries`·`list_items_in_registries`·`search_items_in_registries`·`view_items_in_registries`·`get_item_examples_from_registries`·`get_add_command_for_items`·`get_audit_checklist`). 문서 페이지는 도구 목록 나열 없이 기능 서술로 변경됨.
- 커뮤니티 레지스트리 디렉터리 **548개 그대로**(https://ui.shadcn.com/r/registries.json, `jq length` 실측).
- 에이전트 인프라 확장 지속: 저장소 루트에 `skills/`·`.claude/`·`.cursor-plugin/` 디렉터리 실존(Contents API 확인). **RN 공식 지원은 여전히 없음**.

### 4.2 Astryx — 웹 안정 · 네이티브 실험 개시(canary)

- `github.com/meta/astryx`: ★**20,252**(기존 18.9k 대비 증가), 마지막 푸시 **2026-11-10 당일**(매우 활발), MIT.
- npm `@astryxdesign/core` 주간 다운로드 **661,968**(npm Downloads API 실측 — 기존 ~66만 유지).
- 컴포넌트 수: `packages/core/src` **디렉터리 122개**(Contents API 실측). 기존 분석의 "150~180"은 문서 사이트 기준 추정치로 보이나 사이트 미확인(도구 한계)이라 확정 불가.
- **신설 `packages/native` = `@astryxdesign/native` v0.1.0** — "Experimental. Canary only." iOS·Android·macOS·Windows 대상 **SwiftUI/Swift 네이티브 뷰 + JS 로직 코어(Hermes/JSC 구동) JSON 브리지** 실험. 계약(contract) 12종, SwiftUI 뷰 6종(Text·Heading·Button·TextInput·Card·Banner)+login 템플릿만 구현. README 명시: **"React Native and Android bindings are not built yet"**.
- 해석: 기존 분석 "웹 전용·RN 계획 없음"을 **"웹 안정 + 네이티브 실험(canary)"으로 갱신**. 단 접근은 UniKit(React 단일 소스 + RN 브리지)과 근본적으로 다른 Swift 네이티브 렌더링이며 RN은 여전히 미구축. 유니버설 컴포넌트 공간에 대형 경쟁자도 진입 중이라는 시그널로 읽음.

### 4.3 react-native-reusables — 32종 × 2엔진, 활동 둔화

- `github.com/founded-labs/react-native-reusables`: ★**8,720**, MIT, 마지막 푸시 **2026-09-27**(조사 시점 약 6주 공백).
- 공개 레지스트리 `apps/docs/public/r/{nativewind,uniwind}` 각 **46항목**(Contents API 실측). 순수 컴포넌트는 **32종**, 나머지 14항목은 Clerk 인증 폼 패턴(sign-in/up·forgot/reset·social·user-menu·verify-email 계열).
- 여전히 **RN 중심**(웹 범용 타깃 없음), nativewind·uniwind 이중 발행 유지.

### 4.4 UniKit 현재 포지션 (기준 `ee37765` + 작업 트리)

- `packages/unikit/src/components` **56종**(0.2.0 커밋분 28 + 진행 중 28). shadcn ui 디렉터리 61종과 직접 diff → **미이식 5종: `combobox`·`input-group`·`input-otp`·`menubar`·`navigation-menu`**. 사이클 40 완료 시 61/61 달성.
- `registry.json` **33아이템**(ui 28 + utils + theme + 프리셋 3). `homepage` 여전히 `http://localhost:3000/r/registry.json` — 공개 호스팅 갭 지속(기존 P1 미해소 실측).
- 3자 대비(2026-11-10 실측):

| 항목 | shadcn/ui | Astryx | RNR | UniKit |
|---|---|---|---|---|
| 카탈로그 | 61(ui dir)·66(문서) | 코어 122 dir(실측) | 32종(+폼 14)×2엔진 46항목 | 56종(61 목표) |
| 플랫폼 범위 | 웹(3엔진) | 웹 안정 + SwiftUI 실험 | RN | **웹+RN 단일 소스** |
| 레지스트리 | 디렉터리 548 | npm+CLI | 공개 r/ 2엔진 | 비공개(localhost) |
| AI 계층 | MCP 7도구·skills | "agent ready"·AGENTS.md | — | 없음 |

- 차별점 유효성 재확인: **웹+RN 단일 소스·단일 레지스트리** 포지션은 여전히 유일(shadcn 무RN, Astryx RN 미구축 — Swift 실험은 별도 접근, RNR RN 중심). 61종 완성은 "shadcn 카탈로그 전량 + 유니버설" 주장이 실제 카탈로그 규모에서 성립하는 시점.

### 4.5 다음 사이클 우선순위 제안 (근거 연결)

- **P1** ① 잔여 5종 완성(4.4 diff 실측 근거) ② 레지스트리 공개 호스팅 + `homepage` 갱신(localhost 실측, 디렉터리 548개 시장에서 미등재) ③ README·docs 구아키텍처 기술 정리(기존 P1 이월, 미해소).
- **P2** ④ AI 계층 착수(llms.txt → AGENTS.md → MCP): shadcn MCP 7도구·`skills/` 디렉터리, Astryx "agent ready"·저장소 AGENTS.md/CLAUDE.md 커밋 — 상위 2경쟁자 모두 운용 중. ⑤ 문서 사이트·blocks(사이클 50 소개 사이트 라인과 동일 궤적). ⑥ shadcn 2026-10 신규(trace·code-block) 및 questionnaire 등 문서 전용 항목의 후속 사이클 편성 결정.
- **P3** ⑦ OKLCH·영어 문서·테마 도구(기존 이월). ⑧ RNR 대비 우위 명시 문서화(단일 레지스트리·순수 컴포넌트 구성 vs 2엔진 이중 발행·인증 폼 14항목 혼재) — RNR 활동 공백(6주)으로 시급성 낮음.

### 4.6 신규 경쟁자 @aniui·@tetra-ui — 디렉터리 등재 기록 (G5 보완 · 2026-11-10 재실측)

사이클 40 G0 작성 전 재확인에서 발견된 신규 경쟁자 2건(AC-9 산출 대상)을 기록한다. G5 보완 시점에 디렉터리 원문을 재실측했다(https://ui.shadcn.com/r/registries.json — 총 **548개 그대로**, 두 항목 모두 `firstObservedAt` 2026-08-24).

- **@aniui**(https://aniui.dev) — "React Native components (**Uniwind or NativeWind**) — copy, paste, own the code. **93 components** plus pre-built screen blocks, installable with the shadcn CLI." UniKit과 같은 uniwind 생태계의 RN 전용 직접 경쟁자. 다만 재실측 시점 디렉터리 헬스 **status `"unavailable"`**(최근 24시간 인덱스 체크 성공 없음)·가용성 7일 11.4% / 30일 3.0%·**`hidden: true`** — 등재는 유지되나 서비스가 사실상 다운 상태로 관찰된다.
- **@tetra-ui**(https://tetra-ui.com) — "clean, accessible and modern component library for **React Native**." 헬스 **`"healthy"`**(스코어 98.67·가용성 30일 99.7%)·아이템 **45종**·ranking 스코어 91.25 — 디렉터리 내 정상 운영 중인 RN 경쟁자.
- **포지션 영향**: 둘 다 RN 전용(웹 범용 아님)이라 4.4의 "웹+RN 단일 소스 포지션 유일" 결론은 불변이다. 다만 RN 시장 안에 uniwind 계열(@aniui 93종)과 헬시한 @tetra-ui 45종이 이미 존재하므로, RN 단일 대안은 여럿 — UniKit 차별점은 어디까지나 **한 벌 소스로 양 플랫폼**이라는 점이다.
