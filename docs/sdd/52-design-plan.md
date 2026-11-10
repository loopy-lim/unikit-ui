# 사이클 50 설계·계획 (G1) — UniKit 소개 사이트

- 작성: System Architect + Product/UX Designer (role-perspective self-execution) · 2026-11-10
- 기준: `ee37765` + 미커밋 `docs/sdd/40-requirements.md`(보존)·`50`/`51`(본 사이클)
- 요구: `docs/sdd/50-requirements.md` AC-1~7 · 조사: `docs/sdd/51-research.md`

## 목표와 범위

`apps/web`을 **소개 랜딩(`/`) + 쇼케이스(`/showcase`) + 레지스트리(`/r/*`)** 단일 Next 앱으로 확장한다. 랜딩은 UniKit 브랜드·가치·라이브 사용·설치를 보여 주고, 쇼케이스는 기존 28종 데모를 경로만 옮겨 유지한다. Expo 미러·토큰 generate 마커·사이클 40 문서는 보존한다.

## 아키텍처 결정

| 결정 | 선택 | 근거 |
|---|---|---|
| 앱 위치 | `apps/web` 확장 (새 앱 없음) | 레지스트리·transpile·CI web build 단일화 |
| 라우트 | `/` 랜딩 · `/showcase` 쇼케이스 · `/r/*` 불변 | AC-1·3·README 국소 갱신 |
| 쇼케이스 이전 | `page.tsx` 본문 → `app/showcase/page.tsx` (+ 필요 시 `showcase-screen.tsx` 추출) | Expo 미러 파일은 **본문 카피 불변**; 웹만 경로·내비 링크 |
| 테마 | 랜딩·쇼케이스 모두 `UnikitThemeProvider` | 기존 브리지 `.dark` 계약 |
| 스타일 | UniKit 토큰 + **마커 밖** `site.css`(그리드·모션·폰트 변수) | generate 덮어쓰기 방지 |
| 모션 | CSS `@keyframes` / `transition` 2~3종 (진입 fade-up, 스테이지 은은한 호흡, 포커스 링) | framer-motion 미도입(범위 제외) |
| Provider 위치 | `layout.tsx`가 아니라 **페이지 단위** 유지(쇼케이스 현행) 또는 랜딩·쇼케이스 공통 클라이언트 셸 — 레지스트리 route는 RSC 유지 | `/r/*`에 클라이언트 번들 오염 금지 |

### 모듈 책임

```
apps/web/app/layout.tsx          — html/body, next/font, metadata, site.css
apps/web/app/page.tsx            — 랜딩(클라이언트 셸)
apps/web/app/showcase/page.tsx   — 기존 ShowcaseScreen
apps/web/components/site/        — LandingShell, Hero, Value, LiveDemo, Install, Teaser, SiteNav
apps/web/app/site.css            — 마케팅 전용(마커 밖)
apps/web/app/r/**                — 변경 없음
README.md                        — URL 안내만
```

## UI·디자인 기준 (Product/UX Designer)

### 시각 방향 — “Zinc Lab / Cross-surface”

- **한 문장:** 차가운 zinc 캔버스 위에, 실제 컴포넌트가 제품 비주얼이 되는 정밀 실험실.
- **색:** UniKit 토큰 라이트 기본(`--background` 백색·zinc foreground). 악센트는 `primary`(zinc-900)만. 보라·크림·테라코타·네온 글로우 금지(AC-4).
- **분위기:** 전면 미세 그리드 + 아주 옅은 상단 라디얼(무채·저채도). 장식 이미지가 아니라 **라이브 UI 스테이지**가 히어로 비주얼.
- **타이포(next/font/google):**
  - Display: **Syne** (브랜드·히어로)
  - Body: **Public Sans**
  - Code: **IBM Plex Mono**
  - 기본 Inter/Roboto/Arial/system 스택 금지.
- **모션(의도 3):** (1) 히어로 카피 짧은 fade-up (2) 스테이지 테두리/하이라이트 느린 breath (3) 섹션 스크롤 진입 시 opacity만. 과한 parallax·파티클 금지.

### 정보 구조 (원 페이지, 섹션당 1직무)

| # | 섹션 | 직무 | 요소 예산 |
|---|---|---|---|
| 0 | SiteNav | 이동 | UniKit 워드마크 · Showcase · (선택) GitHub 텍스트 링크 — 카드/뱃지 없음 |
| 1 | Hero | 브랜드 각인 | 브랜드 `UniKit` · 헤드라인 1 · 지지 1문장 · CTA 2(쇼케이스 primary, 설치 앵커 secondary) · **풀폭 라이브 스테이지(전시형)** |
| 2 | Value | 왜 | 한 절: “한 import · 웹+RN 동일 토큰” — 통계 스트립·아이콘 행 금지 |
| 3 | LiveDemo | 실사용(유일 조작 과업) | 조작 가능 Card+Field+Button+Badge(+Switch 1) · 짧은 코드 블록(읽기 전용) |

### Hero 스테이지 vs LiveDemo 경계 (고정)

| 표면 | 역할 | 상호작용 | 구성 |
|---|---|---|---|
| **Hero 스테이지** | 제품 비주얼(전시형 라이브 렌더) | **클릭/입력 불필요** — 정적 구성의 실제 UniKit 컴포넌트(Button·Badge·Tabs 미리보기 등). 포인터 이벤트는 장식에 두지 않음(`pointer-events-none` 또는 비포커스) | 풀폭 밴드, 가장자리까지. 카드 그리드·통계 칩 금지 |
| **LiveDemo** | AC-2 유일 조작 과업 | Input·Switch·제출 Button 조작 + 오류/성공 피드백 | 히어로 밖 별 섹션. Hero와 **동일 폼을 복제하지 않음**(구성·카피 차별) |
| 4 | Install | 소비 | npm 한 줄 · shadcn `add` 한 줄(로컬 `/r` 안내) — README와 동일 경로 |
| 5 | Teaser | 카탈로그 유도 | 대표 3~4 컴포넌트 인라인 미리보기 + `/showcase` 링크 — **카드 그리드 마케팅 타일 금지**, 실제 컴포넌트만 |
| 6 | Footer | 메타 | 버전·라이선스 톤 한 줄 |

### 히어로 규칙 (AC-4 / 사용자 디자인 규칙)

- 첫 뷰포트 = 하나의 구성: 브랜드 + 헤드라인 + 지지 + CTA + 라이브 스테이지.
- 히어로에 카드 그리드·통계·스케줄·플로팅 칩·이모지 없음.
- 스테이지는 가장자리까지 이어지는 평면(또는 뷰포트 하단을 채우는 밴드). inset 미디어 카드·콜라주 금지.

### 상태·접근성

| 상태 | 동작 |
|---|---|
| 초기 | 라이트 테마, LiveDemo 입력 빈 값·버튼 enabled |
| 로딩 | N/A — 정적+클라이언트 즉시(네트워크 페치 없음) |
| 빈 | Input placeholder만 — Empty 컴포넌트 남용 금지 |
| 오류 | LiveDemo 빈 제출 시 Field 오류 문구 + 인접 복구(다시 입력 후 재제출) |
| 성공 | 유효 제출 시 같은 Field 영역에 짧은 성공 문구 1줄(예: “준비됨”) — 토스트/모달 없음 |
| 중복 제출 | 성공 상태에서도 버튼 유지; 재제출 시 성공 문구 유지(별도 스피너 없음) |
| 권한·오프라인·취소 | N/A — 인증·네트워크 의존 과업 없음(마케팅 정적+로컬 state) |
| 테마 | 내비 토글 — 전 섹션 토큰 반응 |
| 키보드 | Tab으로 CTA·토글·데모 컨트롤 · `:focus-visible` 링(ring 토큰) |
| 반응형 | **단일안(고정):** 모든 뷰포트에서 히어로는 **카피 블록(상단) + 스테이지 풀폭 밴드(하단, 좌우 가장자리까지)**. 390에서도 첫 뷰포트에 스테이지 상단이 보이도록 밴드 min-height ≈ 42vh. 카피\|스테이지 2열 split 금지(inset 히어로 방지). |

### 카피 초안 (구현 시 미세 조정 허용, 의미 불변)

- 헤드라인: `한 import로, 웹과 네이티브가 같은 화면.`
- 지지: `shadcn 형태·zinc 토큰·브리지 프리미티브. React와 React Native에서 같은 컴포넌트를 씁니다.`
- CTA: `쇼케이스 보기` → `/showcase` · `설치 방법` → `#install`

## 수락 ↔ 태스크 ↔ 검증

| AC | T | V |
|---|---|---|
| AC-1 | T-2, T-3 | V-1, V-5 |
| AC-2 | T-3 | V-1, V-5 |
| AC-3 | T-1 | V-2, V-3 |
| AC-4 | T-2, T-3 | V-5 |
| AC-5 | T-3 | V-1, V-5 |
| AC-6 | T-4 | V-4 |
| AC-7 | T-5 | V-6 |

## 태스크

| ID | 목적 | 담당 직군 | 수정 허용 경계 | 선행 | V | 상태 |
|---|---|---|---|---|---|---|
| T-1 | 쇼케이스 `/showcase`로 이동(본문 카피 최소 변경) | Frontend/UI Engineer | `apps/web/app/showcase/page.tsx`(신규), `apps/web/app/page.tsx`(랜딩으로 교체 전 임시 이관), 필요 시 `apps/web/components/showcase/*` 추출. **Expo `index.tsx`·`/r/*`·`40-requirements` 금지** | — | V-2, V-3 | pending |
| T-2 | 레이아웃·폰트·site.css·SiteNav 셸 | Frontend/UI Engineer | `apps/web/app/layout.tsx`, `apps/web/app/site.css`(신규), `apps/web/components/site/nav.tsx` 등 셸만 | T-1 경로 확정 후 병렬 가능하나 layout은 공유→ **T-1 완료 후** | V-1 | pending |
| T-3 | 랜딩 섹션(Hero·Value·LiveDemo·Install·Teaser) | Frontend/UI Engineer | `apps/web/app/page.tsx`, `apps/web/components/site/**` | T-2 | V-1,V-5 | pending |
| T-4 | typecheck·build·audit 통과·회귀 | Frontend/UI Engineer | 수정은 빌드 오류 국소만 | T-3 | V-4 | pending |
| T-5 | README 빠른시작·웹 URL 정합(랜딩 `/`·쇼케이스 `/showcase`·Expo 미러는 쇼케이스 기준·「같은 화면」 문구가 `/`를 가리키지 않게) | Skill/Prompt Engineer(오케스트레이터) | `README.md`만 (`40-requirements` 금지) | T-1 | V-6 | pending |

병렬: T-1과 문서 T-5는 파일 교집합 ∅라 T-1 완료 전 T-5 초안 가능하나, URL 확정은 T-1 후. **T-2·T-3는 layout/page  overlapping → 순차.**

## 검증 계획 (V-*)

| ID | 방법 | cwd | 기대 |
|---|---|---|---|
| V-1 | `bun x next dev -p 3000` 후 `/` DOM·스크린샷 + LiveDemo 조작 | `apps/web` | AC-1·5 요소 존재; AC-2: Input에 텍스트 입력·Switch 토글·빈 제출 오류·유효 제출 성공 문구 관찰 |
| V-2 | `/showcase` 로드·테마 토글 | 동상 | 기존 섹션·토글 동작 |
| V-3 | `curl -s -o /dev/null -w '%{http_code}'` `/r/button.json` `/r/registry.json` | 서버 기동 중 | 200 |
| V-4 | `bun run typecheck` · `bun run audit:design` · `bun run build`(apps/web) | 루트 / apps/web | exit 0 |
| V-5 | G4 실화면: 390·1280, 키보드 Tab, AC-4 (a)–(d), LiveDemo 조작 재확인, 히어로=카피상단+풀폭 밴드 | preview/브라우저 | 결함 0(P0–P2) |
| V-6 | README 빠른시작이 `/`=랜딩·`/showcase`=웹 쇼케이스·Expo 비교는 쇼케이스 기준으로 서술 · `40-requirements.md` byte/내용 불변 | 루트 | 일치 |

## 리스크

- 쇼케이스 파일 거대(680줄): 이동 시 rename+export 기본, 리팩터 최소화.
- 폰트 FOUT: `next/font` display swap.
- 랜딩이 UniKit `View`/`Text`만 쓰면 SEO/시맨틱 약화 → 랜딩 셸은 DOM(`main`/`section`/`h1`) + 내부 데모만 브리지 컴포넌트.

## 관문 계획

- G1: Architecture & Plan Reviewer + UX/Design Auditor(설계 모드)
- G2: Task QA Validator
- G3: Staff Code Reviewer
- G4: UX/Design Auditor(구현 모드, 실화면)
- G5: Release Gatekeeper
