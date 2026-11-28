# 변경 이력

`@unikit-bridge/ui`의 눈에 보이는 모든 변화를 이 파일에 기록해요. 형식은 [Keep a Changelog](https://keepachangelog.com/ko/1.1.0/), 버전 규칙은 [유의적 버전](https://semver.org/lang/ko/)을 따라요. 1.0.0 이전(0.x)에서는 마이너 업데이트가 하위 호환을 깰 수 있어요 — 하위 호환을 깨는 변경에는 **⚠ 마이그레이션** 절을 붙여요.

## [미게시] (0.6.0 예정)

### 제거

- **nsh 지원 제거** — `@unikit-bridge/ui/nsh`·`@unikit-bridge/ui/behaviors/ui-sdk-nsh` 진입점과 도그푸딩 앱 `apps/nsh`가 사라지고 React·React Native 전용으로 복원됐어요(8e25214).
  - **⚠ 마이그레이션**: nsh 소비자는 `0.5.x`에 머물러요. React·React Native 소비자는 영향이 없어요.

### 변경

- **차트 팔레트를 디자인 토큰 시스템으로 편입** — `--chart-1`..`--chart-5` 5색 범주 팔레트(스틸 블루 앵커·청록·황·보라·장미, 비텍스트 WCAG ≥3:1)가 토큰 단일 출처에 들어가고(누적 25키), 프리셋 3종(blue·emerald·amber)에 chart 키가 추가됐어요. RN SVG용 `chartPalette()` 헬퍼가 토큰 채널을 hex로 조립해요(49fe07c).
  - **⚠ 마이그레이션**: 레지스트리 복사 소비자는 `globals.css` 토큰 블록을 최신화해야 차트 색이 나와요 — 원본 저장소에서 `bun run generate:design` 재생성물을 받거나 `--chart-1`..`--chart-5` 키를 수동으로 더하세요. npm 설치 소비자는 토큰이 패키지에 담기므로 영향이 없어요.

### 추가

- **브리지 Slot** — `asChild` 조합 지원을 순수 훈(`useComposedRefs` 기반 `src/bridge/slot.ts`)으로 자체 구현하고, 오버레이 계열·기초 컴포넌트에 이식했어요. 외부 slot 의존은 없어요. 높이 접힘 전이(accordion·collapsible·tabs·calendar)는 측정 높이 전이·언마운트 유예·RTL 대응으로 정비됐고, `CardAction` 스킨 변형이 추가됐어요(dae8574, 80f8c5c).
- **차트 신규 시리즈** — 원형(파이·도넛)·레이더 시리즈와 스택 바·다중 y축·브러시 줌(04831bf).
- **네이티브 모션 선택 드라이버** — `@unikit-bridge/ui/motion` 진입점의 `installReanimatedMotion`로 Reanimated 4 드라이버를 끼울 수 있어요. 기본은 RN `Animated` 코어 구동이고 설치형 의존은 없어요(8bf6c6e).

### 수정

- resizable의 리사이즈 가드, select 네이티브 미러 잔여, slider 역할 결함 수리(80f8c5c).

### 내부

- CI 관문 확장 — 생성물 드리프트 검사(`generate:design` → `git diff --exit-code`), 에디터 WebView 번들 빌드 관문, Maestro E2E 스모크(안드로이드), iOS export 컴파일, 단위 테스트·ui-sdk 계약 프로브(f7d2bdc, a845995, 4310b2b 외).
- 소스 주석 전면 소거 — 의미는 이름·타입으로 인코딩하고 설계 근거는 docs/sdd로 이동(5a6e9c5), `audit:design` 검사 (j)로 상시 강제(d9eca02).

## [0.5.0] - 2026-11-24

### 추가

- **ui-sdk 계열 진입점 5종** — `@unikit-bridge/ui/behaviors/ui-sdk`(순수 헬퍼)·`ui-sdk-dom`(position() 어댑터)·`ui-sdk-renderer`(파트 렌더러 코어)·`ui-sdk-agent`(에이전트 브리지 가상 DOM)·`ui-sdk-catalog`(카탈로그 단일 출처). `@ui-sdk/core`는 선택 peer(00025e8, 6fc9095, 28697a0 외).
- **overlay-position 진입점** — 오버레이 위치 계산 엔진의 플랫폼 분기 노출(`react-native`/`default`).
- **브리지 키보드 계약** — View/Pressable에 `focusable`·`onKeyDown`(f8b3e81).
- nsh 네이티브 킵 1차(`./nsh`·`./behaviors/ui-sdk-nsh`) — 다음 버전에서 제거돼요(1acd72b).

### 수정

- menubar 트리거·input-group의 네이티브 포커스 피드백(52ea674).

### 내부

- `probe:ui-sdk` 계약 프로브 관문 신설, 53종 ui-sdk 카탈로그 이중 유지 검증 자동화.

## [0.4.1] - 2026-11-17

### 추가

- **행동 훈 진입점 `@unikit-bridge/ui/behaviors`** — 오버레이·메뉴 탐색·브리지 훈 재노출(npm 전용). 컴포넌트 62종·editor 진입점은 0.4.0과 동일해요.

## [0.4.0] - 2026-11-16

### 추가

- **EditorToolbar**(62번째 컴포넌트) — 에디터 툴바 스킨+훅(서식 9종·실행 취소/다시 실행, tiptap 런타임 의존 0).
- **`@unikit-bridge/ui/editor` 진입점** — 마크다운 에디터 엔진 `MarkdownEditor`(웹=tiptap v3 직접 마운트, 네이티브=WebView+동봉 단일 HTML 번들). peer: `@tiptap/*` 5종·`react-native-webview`(전부 선택).
- **editor-prose 스타일**(registry:style).

### 수정

- 네이티브 다크 모드 첫 페인트 화이트 플래시 제거(마운트 시점 dark 클래스 주입).
- 네이티브 본문 입력 크래시(react-native-webview 14 Fabric `dataDetectorTypes` 배열 전달).
- 웹 placeholder 교체 시 문서 리셋(함수형 Placeholder + 빈 트랜잭션).
- 툴바 ￼(U+FFFC) 접근성 노이즈(toggle 문자 children만 Text 래핑).

## [0.3.0] - 2026-11-13

### 추가

- **컴포넌트 61종 전량 제공** — 배럴 60종 + `@unikit-bridge/ui/chart` 단독 진입점, `registry/ui` 61종 바이트 동기화와 디렉터리 교차 검증.
- **테마 프리셋·Provider 개선** — `./presets` 재노출, `storageKey`/`onColorSchemeChange` 지원, 콜백·컨텍스트 메모이제이션.
- **오버레이 플립 & 웹 모션** — 뷰포트 경계 충돌 시 자동 방향 전환(`computeOverlayPositionWithPlacement`, `OverlayPlacementContext`, `TooltipArrow`), `.unikit-popover-in`·`.unikit-toast-in` 진입 모션과 레지스트리 `animations` 의존성 연결.
- **인터랙션** — `ToggleGroupItem`의 `onPressedChange` 전달 누락 수정, `Tabs` 좌우/Home/End·`Select` 방향키 지원, `CommandItem` ref 안정화.

### 성능

- 브리지 `cn()` 조건부 스킵, 스타일 상수 호이스팅, `measure()` 상태 동일성 가드.

## [0.2.0] - 2026-11-10

### 추가

- **shadcn 컴포넌트 1차 23종 이식(누적 28종)** — accordion, alert, aspect-ratio, avatar, breadcrumb, button-group, checkbox, collapsible, empty, field, item, kbd, pagination, progress, radio-group, separator, skeleton, switch, table, tabs, textarea, toggle, toggle-group. radix 의존 제거 — 한 벌 소스로 웹·네이티브 동일 렌더(브리지 프리미티브 기반).
- **브리지 계약 확장** — 전 프리미티브 `style` 동적 값, TextInput `multiline`(웹 textarea 분기), Image `onError`, Pressable `aria-pressed`, 네이티브 aria-* 직접 전달, 웹 View/Text role·aria-label 치환.

### 수정

- 다크 모드 경고색(`--destructive`) 대비 1.99:1 → 6.08:1(red-400 계) — 기본·프리셋 3종 전부.
- 꺼짐 상태 비텍스트 대비 3:1 이상(스위치 트랙·라디오/체크박스 링·진행 트랙·스켈레톤·활성 페이지 테두리).

## [0.1.0] - 2026-11-09

### 추가

- 첫 게시 — Button·Card·Input·Label·Badge 5종, React Native와 웹에서 같은 소스로 동일 렌더링.
- 디자인 토큰 시스템 — 라이트/다크 20키, zinc 기본 + blue/emerald/amber 프리셋 3종(WCAG 대비 ≥4.5 규칙 기반 선정).
- shadcn 배포용 `registry.json`(아이템 10종)·`registry/` 소스, 생성(`generate:design`)·감사(`audit:design`)·소비자 검증(`check:consumer`) 스크립트.

[미게시]: https://github.com/loopy-lim/unikit-ui/compare/1acd72b...HEAD
[0.5.0]: https://github.com/loopy-lim/unikit-ui/compare/v0.4.1...1acd72b
[0.4.1]: https://github.com/loopy-lim/unikit-ui/compare/v0.4.0...v0.4.1
[0.4.0]: https://github.com/loopy-lim/unikit-ui/compare/v0.3.0...v0.4.0
[0.3.0]: https://github.com/loopy-lim/unikit-ui/compare/v0.2.0...v0.3.0
[0.2.0]: https://github.com/loopy-lim/unikit-ui/compare/27045dd...v0.2.0
[0.1.0]: https://github.com/loopy-lim/unikit-ui/commit/27045dd
