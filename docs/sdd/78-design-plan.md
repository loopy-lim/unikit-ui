# 사이클 72 설계·계획 — 링 규약·menubar·주석·registry css

- 요구: docs/sdd/77-requirements.md (AC-1~6)
- 조사: 읽기 전용 위임(Codebase Researcher, 2026-11-11, 기준 a067e1b) — 주요 사실 아래 요약.
- 계획 수립: System Architect 관점(오케스트레이터). 문서 번호: 77 요구 → 78 계획 → 79 증거.

## 조사 확정 사실 (구현의 전제)

1. **ring-3 경로 확증**: Tailwind 4.3.5가 비대괄호 `ring-3`을 생성(bubble.tsx:197 실사용, 빌드 CSS에 `.ring-3{…calc(3px…)}` 규칙 실존). audit (c)는 대괄호 패턴만 매칭(audit-design.ts:155) → `ring-3` 통과. uniwind 1.13.2는 ring을 네이티브 box-shadow로 변환(RN 0.88.1 boxShadow 지원) — 무접두 ring도 네이티브 동작 경로.
2. **원본 규격 3계열**: ① 대다수 = `focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50`(무오프셋, destructive는 `ring-destructive/20`) ② bubble·slider = 비대괄호 ring-3/ring-4 ③ dialog·sheet 닫기 버튼 = `focus:ring-2 + ring-offset-2`(원본 자체 오프셋).
3. **menubar 원인**: dropdown-menu.tsx:268 `wrapTextChildren(children, "…text-foreground")`이 문자열 children 전경색을 고정 — MenubarTrigger가 자체 Text로 감싸 요소 자식을 넘기면 통과돼 select.tsx:256-278와 동일한 위임 구조가 됨. 원본 트리거는 focus·open 상태 텍스트 전환(원본에 hover: 없음 — UniKit은 web:hover·active 근사 관행) + `font-medium`.
4. **stale 주석**: 비-WIP 실측 15종(글리프 서술 6 + 교차 스펙 1 + 원본 경로 인용 8; alert 중복 제외). "예상 11종"이 아닌 이 실측이 기준.
5. **registry css**: 공식 규격에 아이템 최상위 `css` 필드 + type `registry:style` 존재 — CLI add 시 소비자 전역 CSS에 병합. 대상은 site.css의 unikit-* 블록(애니메이션 클래스 7종·keyframes 6종·reduced-motion 분) — overlay.tsx·alert-dialog·dialog·sheet·drawer·popover가 참조. registry.json 수동 추가는 허용(theme 블록만 generate:design 소유, generate-design.ts:313-314 나머지 보존).
6. **WIP 갱신**: 현시점 사용자 미커밋 = apps/web 4파일(showcase/page.tsx·site.css·docs-shell.tsx·landing.tsx). 이전 라이브러리 WIP(bridge·accordion 등)는 전부 커밋됨 → accordion·switch·tabs도 이번 범위 포함.

## AC ↔ T ↔ V 매핑

| 태스크 | 내용 | 담당 직군 | 수정 허용 경계 | AC | V |
|---|---|---|---|---|---|
| T-1 | focus 링 원본 규격 통일(16종+overlay 확인) | Frontend/UI Engineer | 아래 파일 목록 | AC-1 | V-1~V-4 |
| T-2 | menubar 트리거 텍스트 전환 | Frontend/UI Engineer (T-1과 동일 위임, 순차) | menubar.tsx 양 트리 | AC-2 | V-1·V-3·V-4 |
| T-3 | stale 머리 주석 15종 갱신 | Frontend/UI Engineer (T-1과 동일 위임, 순차) | 아래 15종 양 트리 | AC-3 | V-1·V-2 |
| T-4 | registry animations css 아이템 | Platform/Tooling Engineer | registry.json (+패키지 README 1줄) | AC-4 | V-1·V-2·V-5 |

T-1~T-3(컴포넌트 트리)과 T-4(registry.json)는 파일 소유권이 무교집합 → 병렬 스폰. T-1→T-2→T-3은 같은 파일군이라 한 위임에서 순차 수행.

## T-1 상세 — 링 규격 통일

대상(전부 src/components + registry/ui 양쪽):

**A군 — ring-2→ring-3 + 원본 문자열 정렬** (원본 ①계열):
button(:23,:30), checkbox(:72), native-select(:62,:105), select(:238), toggle(:24), item(:66), radio-group(:130), navigation-menu(:246,:349), combobox(:619, focus-within), input(:21), textarea(:28,:34), input-otp(:196 active 상태), calendar(:230), accordion(:191), switch(:24), tabs(:158)

- 폭: `ring-2` → `ring-3`, 색: `ring-ring` → `ring-ring/50`(원본 규격).
- 오프셋: `ring-offset-2 ring-offset-background` 제거(button·input·textarea·calendar 등 ①계열 전부 — 원본 무오프셋).
- 원본의 `focus-visible:border-ring` 추가(접두 규칙은 아래). destructive는 `ring-destructive/20`(원본 dark: /40은 dark: 금지 관행으로 제외, 기존과 동일).
- outline 계열(G1 F-1 반영): tabs 원본(shadcn-ref/ui/tabs.tsx:66)은 `focus-visible:outline-1 outline-ring` → `web:focus-visible:outline-1 web:outline-ring` 근사. navigation-menu 원본(:61,:131)은 `focus-visible:outline-1`만 → `web:focus-visible:outline-1`만 추가(outline-ring 없음). 각 머리 주석 기록.
- 접두 규칙(현행 유지, B 분류로 주석 기록): 기존 `web:` 접두 파일은 접두 유지, 무접두(input·textarea·input-otp)는 무접두 유지 — uniwind가 무접두 ring을 네이티브 box-shadow로 구동하므로 네이티브 링 동작을 보존하기 위함.

**변경 금지(이미 원본 정합)**: bubble(ring-3), avatar(ring-2 장식), dialog·sheet 닫기(ring-2+오프셋 = 원본 ③계열), sidebar(ring-2 = 원본), attachment(ring-1), slider(ring-4), input-group(slim 링 근사, 머리 주석 유지).

**overlay.tsx(src/lib/overlay.tsx)**: ring 클래스 없음이 G1 감사로 확인됨 — 변경·확인 불필요.

**주석**: 각 파일 머리의 «focus 링은 라이브러리 규약(ring-2 + ring-offset) 유지» 서술을 «원본 규격 ring-3 무오프셋 준수(사이클 72)»로 갱신. **badge.tsx:6의 동일 규약 서술도 갱신 대상**(G1 F-2 — badge 자체는 무링이므로 서술 정정). 패키지 README·docs에 옛 규약 서술이 있으면 함께 갱신(grep `ring-offset`·`ring-2`로 확인).

## T-2 상세 — menubar

menubar.tsx MenubarTrigger(:185-201): children 중 문자열/숫자를 자체 `<Text>`로 감싸 조건부 전경(`menu.isOpen && "text-accent-foreground"` + `web:hover:text-accent-foreground` + `active:text-accent-foreground`)과 원본 `font-medium`을 부여한 뒤 DropdownMenuTrigger에 요소 자식으로 전달(wrapTextChildren은 요소 자식을 통과시킴 — dropdown-menu.tsx:97-105). 배경 전환은 현행 유지. 양 트리 동일.

## T-3 상세 — stale 머리 주석 15종

양 트리 동일 적용, 본문 코드 변경 금지:

1. 글리프→SVG 서술 정정(6): alert(:4-6), calendar(:11,:23), checkbox(:6-8), input-otp(:26), navigation-menu(:19), sonner(:32) — 실제는 브리지 SVG 아이콘 프리미티브.
2. 교차 스펙(1): attachment:7 — icon-xs가 button 스펙에 신설돼 «소비자 지정으로 남긴다» 서술이 부정확 → 현행 스펙 기준으로 수정.
3. 원본 경로 인용(8): breadcrumb·kbd·pagination·separator·skeleton·table(«/tmp/shadcn-ref/src/…» → «shadcn-ref/ui/…»), aspect-ratio·progress(구 레이아웃 인용 → 현행 경로).

## T-4 상세 — registry animations 아이템

- registry.json 신규 아이템: `name: "animations"`, `type: "registry:style"`, 최상위 `css` 필드에 unikit-* 블록 전체(클래스 7종·keyframes 6종·reduced-motion unikit 분)를 문자열로.
- **추출 원본은 커밋된 상태**에서: `git show HEAD:apps/web/app/site.css`의 해당 블록 — 작업 트리 site.css는 사용자 WIP이므로 절대 수정하지 않고, WIP 편집 내용도 반영하지 않는다.
- dialog·sheet·popover·drawer·alert-dialog 5개 아이템의 `registryDependencies`에 `animations` 추가(자동 설치 유도).
- generate:design 재실행 시 보존됨(비-theme 아이템) 확인. 패키지 README에 animations 아이템 1줄 소개(영어, README는 영어 규정).
- apps/web은 현행대로 site.css를 import 유지(중복 정의 무해).

## 경계 (공통)

- 사용자 WIP 수정 금지: apps/web/app/showcase/page.tsx, apps/web/app/site.css, apps/web/components/showcase/docs-shell.tsx, apps/web/components/site/landing.tsx.
- shadcn-ref/ 수정 금지. 생성물(globals.css 토큰 블록·registry.json theme 항목·tokens.md) 직접 편집 금지(registry.json 신규 아이템·dependencies 추가는 허용 영역).
- 커밋·푸시 금지(사용자 요청 시만). bun만 사용.
- 검증은 각 구현자가 자기 범위에서 1차 실행(양 트리 diff·typecheck), 통합 검증(V-*)은 병합 후 오케스트레이터가 실행.

## V-* 검증 계획

- V-1 `bun run typecheck`(루트): 3패키지 exit 0.
- V-2 `bun run audit:design`: 8/8 PASS(특히 (c) 임의값·(d) 양 트리 동일·(e) files 실재).
- V-3 `cd apps/web && bun run build`: 성공(작업 트리에 사용자 WIP가 있어 실패 시 원인 구분 필요 — WIP 이전 커밋 상태와 대조).
- V-4 G4 렌더 실측(오케스트레이터, T3 프리뷰): 버튼·인풋 키보드 포커스 시 3px 무오프셋 링 관찰, menubar 트리거 hover/open 텍스트 전환 관찰, 기존 컴포넌트(dialog·slider) 무회귀 확인.
- V-5 레지스트리: apps/web 빌드 후 public/r/animations.json 존재·css 필드 포함 확인 + /r/registry.json 아이템 67개.

## 관문 편성

G1 Architecture & Plan Reviewer(위임) → G2 구현 2건 병렬 위임(Task QA는 G3에서 통합) → G3 Staff Code Reviewer(위임) → G4 오케스트레이터 렌더 실측 → G5 Release Gatekeeper(위임). UI 변경이므로 G4 N/A 아님.
