# 사이클 100 설계·계획 — A2UI 범용 렌더러 (web + RN, 카탈로그 전수) [v2]

- 요청: «A2UI를 여기에서도 지원하고 싶다. RN까지 한번에, 컴포넌트 전수, surface 포맷은 v1.0으로.»
- 설계 기준(Golden Example): behaviors UI-SDK 적층(`src/behaviors/ui-sdk-*.ts` — 헤드리스 코어 재사용 + 브리지 프리미티브 렌더). chart·editor의 exports 조건 분기는 **사용하지 않는다**(아래 §1.1).
- 프로토콜: A2UI v1.0(a2ui.org, `@a2ui/web_core` 0.16.x, Apache-2.0).
- 개정 이력: v2 — 1차 교차비평(읽기 전용 antigravity gemini-4-neon, 2026-11-28) P1 5건·P2 4건·P3 2건 반영. 주요 변경: ① `@a2ui/react` 의존 제거·단일 렌더러 통일 ② NodeResolver 소유권 존중(node.props 신호 구독, 이중 GenericBinder 금지) ③ 기본 카탈로그 vendoring 방식 변경 ④ 아이콘·컴포넌트 수치 정정(18종·59개) ⑤ form·chart 옵트인 분리 ⑥ 상태·실패 모드 신설 ⑦ 검증 계획 정정.

## 0. 조사에서 확정한 사실 (2026-11-28 실측·교차비평 검증)

- `@a2ui/web_core` 헤드리스(`.`·`./catalog`·`./state`·`./processing`·`./resolution`·`./validation`·`./reactivity`·`./expressions`·`./rpc`)만이 lit/DOM 무의존 — exports 맵 확인. **`./v1_0`·`./catalogs/basic/v1`은 Lit·DOM 재수출을 포함하므로 RN에서 import 불가**(비평 F-1).
- 기본 카탈로그 v1.0: **컴포넌트 18종**(Text·Image·Icon·Video·AudioPlayer·Row·Column·List·Card·Tabs·Modal·Divider·Button·TextField·CheckBox·ChoicePicker·Slider·DateTimeInput — Checkable은 믹스인, Weight는 $defs 스키마), **함수 14종 + @index**, 표준 `$id` = `https://a2ui.org/specification/v1_0/catalogs/basic/catalog.json`(패키지 내 `src/v1_0/schemas/catalogs/basic/catalog.json`으로 실재 — 테스트 오라클로 벤더링).
- Icon 스키마는 3중 유니언: **Material 이름 enum 59개** | `{svgPath}` | DataBinding. 브리지는 현재 32~50종 아이콘만 노출(수동 목록 `src/bridge/{web,native}-icons.tsx`) — 확장 필요(비평 F-3).
- `NodeResolver`가 노드마다 `GenericBinder`를 내부 생성·해제하며 결과를 `node.props: Signal<NodeProps>`(값 + `set<Prop>` 세터 + 액션 클로저)로 노출 → 렌더러는 **이 신호를 구독만 한다**(이중 바인더 금지, 비평 F-2). 노드 신원은 `node.id` — `(surfaceId, componentId)`는 템플릿 ChildList·중복 참조에서 충돌.
- 식별자는 UAX31 검증 → 유니킷 kebab 이름은 PascalCase로 노출(alert-dialog→AlertDialog).
- 프로토콜: **모든 메시지에 `version:"1.0"` 필수**(createSurface·updateComponents·updateDataModel·deleteSurface). `MessageProcessor` 기본 버전은 `v0.9` → 명시적 `{version:'1.0'}` 전달 필요. 오류 내성은 `processMessagesWithErrors()`(비평 F-6).
- `@a2ui/react`는 내부적으로 `customElements.define`·카탈로그 제자리 변형을 수행(Next `output:"export"` SSR·소유권 위험) → **사용하지 않고 단일 자체 렌더러로 양 플랫폼을 함께 커버**(비평 F-5).
- 선택 peer 위반: `chart`→react-native-svg(배럴 제외 원칙의 이유), `form`→react-hook-form — views가 정적 전수 import하면 미설치 소비자가 깨진다(비평 F-4).
- 검증 환경: audit:design 중 src/a2ui에 실제 적용되는 검사는 (b) 원색·(j) 주석뿐((c)(g)(h)는 src/components·registry 한정). `packages/unikit/tsconfig.json` include는 `["src"]` → test/*.test.ts는 루트 typecheck 미포함. apps/expo는 react-dom 19.3.0 의존 보유(export:web용).
- 저장소 내 기존 A2UI 참조 0건(~/dev/ll3 전역 — 포털 ../unikit 포함).

## 1. 아키텍처 결정

### 1.1 진입점 — 플랫폼 조건 없는 단일 렌더러 (npm 전용, registry 미등록)

```
packages/unikit/package.json exports:
  "./a2ui":        "./src/a2ui/index.ts"
  "./a2ui/catalog": "./src/a2ui/catalog.ts"
  "./a2ui/demo":    "./src/a2ui/demo.ts"
```

- 렌더러·뷰 전부 브리지 프리미티브 기반 → 웹·RN 동일 코드(브리지 분기 원칙 그대로). react-native/default 조건 불필요.
- `@a2ui/react`·lit은 어디서도 import하지 않는다(§3 게이트 5로 실증).
- 배럴·registry.json 미등록 — editor·behaviors 선례. 컴포넌트 수(62)·레지스트리 아이템 수(71) 불변.
- peerDependencies(선택): `@a2ui/web_core` `~0.16.1`, `zod` `^3.25.76`. peerDependenciesMeta optional. 워크스페이스 개발은 devDependencies.

### 1.2 파일 구성

| 파일 | 역할 |
|---|---|
| `src/a2ui/index.ts` | 공개 API 재수출(렌더러·런타임·타입) |
| `src/a2ui/types.ts` | 공개 계약 — `A2uiViewProps<P>`({props: 값+세터+액션 클로저, buildChild, metadata, node}), 카탈로그 빌더 옵션 |
| `src/a2ui/catalog.ts` | 카탈로그 정의 단일 출처(§1.4) — 이름·zod 스키마·슬롯·액션. web_core 헤드리스 import만 허용 |
| `src/a2ui/views.tsx` | 공유 뷰 — `A2uiViewProps` → 유니킷 컴포넌트. **배럴 61종 중 form 제외 60종만 정적 import** |
| `src/a2ui/views-optional.tsx` | form·chart 옵트인 뷰 — 카탈로그 빌더 옵션로만 결합(해당 peer 미설치 소비자는 번들에 미포함) |
| `src/a2ui/icons.ts` | Material 59종 → 브리지 `*Icon` 매핑 + 브리지 아이콘 확장 재수출. `svgPath` 분기는 미지원 스텁(로드맵) |
| `src/a2ui/functions.ts` | v1.0 기본 함수 15종(required·regex·length·numeric·email·formatString·formatNumber·formatCurrency·formatDate·pluralize·openUrl·and·or·not·@index) 순수 JS 구현. `openUrl`은 주입형 핸들러(웹 window.open 가드·RN Linking) |
| `src/a2ui/runtime.ts` | `createA2uiProcessor(catalogs)`(MessageProcessor `{version:'1.0'}` 고정)·`processMessagesWithErrors` 랩·수명주기(onSurfaceCreated/Deleted·updateDataModel)·에러 매핑 |
| `src/a2ui/renderer.tsx` | 단일 렌더러(§1.3) |
| `src/a2ui/demo.ts` | 재생용 fixture 메시지 시퀀스(색상 리터럴 없음 — audit (b) 준수) |
| `test/fixtures/basic-catalog.v1_0.json` | 표준 카탈로그 JSON 벤더 사본(오라클 — npm 미배포) |

### 1.3 렌더러 — NodeResolver 소유권 존중 (UI-SDK 패턴의 web_core 판)

- 표면 호스트: `new NodeResolver(surface)` 1개 → `rootNode` 신호를 `useSyncExternalStore`로 구독 → 루트부터 재귀 렌더.
- 노드당: **`node.props` 신호 구독만**(이중 GenericBinder 금지). 값 언래핑은 peek-then-subscribe 패턴, 세터(`set<Prop>`)와 액션 클로저는 props에서 그대로 뷰로 전달. React 상태 소유 단일화: 인스턴스 신원은 `node.id` 1개.
- 메모리: 노드 언마운트·surface 삭제 시 resolver dispose, 구독 해제.
- **상태·실패 모드(필수 구현)**: ① rootNode 도착 전 → spinner/skeleton ② `node.state === 'pending'`·placeholder → skeleton ③ `unknown-type`·`cyclic` → 폴백 뷰 + `surface.onError` 전파 ④ malformed 메시지 → `processMessagesWithErrors`로 수집·표시(렌더 중단 없음) ⑤ 노드별 ErrorBoundary ⑥ `@checks` → validationErrors 표시·유효할 때만 활성화되는 Button 게이팅 ⑦ deleteSurface → 즉시 언마운트·dispose.
- 마크다운(Text): bridge Text 기반 최소 인라인 렌더러(헤더·문단·강조·인라인 코드·링크 서브셋, 미지원 구문은 플레인 텍스트) — 양 플랫폼 동일.

### 1.4 카탈로그 — 두 개, 정의는 한 곳

1. **`unikit-basic`(기본 카탈로그 호환, 표준 URI)** — catalogId를 표준 `$id`로 등록해 에이전트 표준 어휘와 직결. 스키마는 **로컬 zod 재선언**(18종 — vendoring JSON은 테스트 오라클로 패리티 검증, runtime import 아님). 구현만 유니킷 뷰: Button→button, Card→card, CheckBox→checkbox, ChoicePicker→radio-group/toggle-group, Slider→slider, Tabs→tabs, TextField→field+input, DateTimeInput→popover+calendar, Modal→dialog, Row/Column→브리지 View, Divider→separator, Icon→icons.ts, List→item, Image→브리지 Image, Text→마크다운 뷰. **Video·AudioPlayer는 스텝 엔트리**(미지원 안내 뷰 — 표준 payload가 검증 거부로 죽지 않게) + roadmap 기록.
2. **`unikit`(전수 62종, 자체 catalogId)** — PascalCase 이름. Tier 분류(합계 62 검산):
   - **Tier A(표현형 21)**: alert·aspect-ratio·attachment·avatar·badge·bubble·card·chart(옵트인)·direction·empty·item·kbd·label·marker·message·progress·scroll-area·separator·skeleton·spinner·table
   - **Tier B(상호작용 22)**: accordion·button·button-group·calendar·carousel·checkbox·collapsible·combobox·command·input·input-group·input-otp·native-select·pagination·radio-group·select·slider·switch·tabs·textarea·toggle·toggle-group
   - **Tier C(조합·오버레이·명령형 19)**: alert-dialog·breadcrumb·context-menu·dialog·drawer·dropdown-menu·editor-toolbar·field·form(옵트인)·hover-card·menubar·message-scroller·navigation-menu·popover·resizable(web: 접두 유지)·sheet·sidebar·sonner(액션 트리거)·tooltip — 오버레이 계열은 `lib/overlay.tsx`, 메뉴 계열은 `lib/menu-nav.ts` 재사용 래퍼.
   - **엔트리별 수용 기준(완료 조건)**: Tier A=스키마+렌더 fixture, Tier B=+핵심 상호작용 액션 1종(값 변경→onAction), Tier C=축소 계약 명시+렌더 fixture. **62종 전부 등록이 완료 조건** — 직렬화 불가 프롭은 스키마에서 제외하고 roadmap-components.md에 열거(엔트리 누락 아닌 스키마 축소로 표현). form·chart는 기본 미등록·옵트인 등록(`createUnikitCatalog({ extras: ["form","chart"] })`).

### 1.5 데모·검증 앱

- `apps/web/app/a2ui/page.tsx`("use client" — output:export 사전렌더 가드) + 사이트 내비게이션 링크. surface 재생·카탈로그 브라우저.
- `apps/expo/app/a2ui.tsx` + `apps/expo/app/index.tsx` 링크 추가(Stack 라우터 — 탭 없음).
- fixture는 `src/a2ui/demo.ts`를 양앱이 `@unikit-bridge/ui/a2ui/demo`로 import.
- 에이전트 발화측(MCP·스킬)은 포털 저장소 후속 과제 — llms.txt 진입점 추가 외 저장소 산출 변동 없어 `sync:data` 불필요.

## 2. 수정 파일

| 영역 | 파일 |
|---|---|
| 패키지 | `src/a2ui/` 신규 10종(§1.2)·`package.json`(exports 3·peer 2+meta·devDeps)·`src/bridge/web-icons.tsx`·`src/bridge/native-icons.tsx`(부족 아이콘 확장)·`test/a2ui-catalog.test.ts`·`test/a2ui-renderer.test.ts`·`test/fixtures/basic-catalog.v1_0.json` |
| 앱 | `apps/web/app/a2ui/page.tsx`(+"use client"·내비 링크)·`apps/expo/app/a2ui.tsx`·`apps/expo/app/index.tsx`(링크)·양 app package.json(web_core·zod devDeps — expo는 이미 react-dom 보유, 변동 없음) |
| 문서 | `README.md`·`README.ko.md`·`llms.txt`(a2ui 섹션)·`docs/roadmap-components.md`(Video·AudioPlayer·svgPath·스키마 축소 항목)·`AGENTS.md`(구조에 src/a2ui)·`packages/unikit/README.md` |
| 불변 확인 | registry.json 71·컴포넌트 62·src/components·registry/ui 무변경 |

## 3. 검증 계획 (G3 하드 게이트)

1. 루트 `bun run typecheck` exit 0.
2. 루트 `bun run audit:design` 전 항목 PASS — src/a2ui 적용 검사는 (b) 원색·(j) 주석(신규 파일 자동 대상).
3. `cd packages/unikit && bun test` — ① 카탈로그 전수성(62 엔트리·PascalCase·UAX31·Tier 합계 검산) ② unikit-basic 스키마 ↔ vendored 표준 JSON 패리티 ③ 아이콘 매핑 59종 완전성·브리지 실재 확인 ④ fixture → processor → surface → rootNode → 액션 발화·`set<Prop>`→DataModel 환류 헤드리스 검증 ⑤ 실패 모드: malformed 메시지·unknown-type·순환·placeholder 스트리밍 업그레이드 ⑥ deleteSurface 후 dispose.
4. `cd apps/web && bun run build` exit 0 + `bun x next dev`로 `/a2ui` 실물 확인(재생·액션·@checks 게이팅).
5. `cd apps/expo && bun x expo export --platform android --source-maps` exit 0 — **소스맵/번들에서 lit·`@a2ui/react`·`@a2ui/web_core/universal` 심볼 미포함 grep**(Hermes 바이트코드는 텍스트 grep 불가하므로 소스맵 대상), signals-core·zod 번들 포함 확인.
6. 에뮬레이터 가용 시 AGENTS 절차대로 실물 설치·재생(불가 시 5번으로 대체·증거 기록).
7. 웹 소비 재현: 임시 소비자(react-native-svg·react-hook-form 미설치)에서 `@unikit-bridge/ui/a2ui` import·번들 성공 — 옵트인 미지정 시 form·chart 미포함 실증.

## 4. 리스크·대응

- **web_core 0.16.x 미성숙** — 헤드리스 하위 경로만 사용(§0 명시 목록 밖 import 금지, 코드 리뷰 게이트), 상한 `~0.16.1`.
- **기본 카탈로그 로컬 재선언 drift** — vendored JSON 오라클 패리티 테스트(§3-3②)가 상류 변경 감지.
- **zod 단일 인스턴스** — peer `^3.25.76` 공유.
- **브리지 아이콘 확장 분량** — 59종 중 부족분 일괄 추가(양 플래폼 파일 동일 목록 유지).
- **Tier C 과공수** — 수용 기준은 "엔트리 등록+축소 계약"이지 기능 완전체가 아님을 명시(로드맵 기록으로 충족).
- **Metro exports 해석** — 헤드리스 하위 경로 해석을 5번 게이트가 실측(실패 시 metro.config 실험 플래그 명시적 추가).

## 5. 태스크 순서

1. 골격: package.json(exports·peer·devDeps)·types.ts·runtime.ts(+functions.ts) → 헤드리스 파이프 bun test(§3-3④ 일부) 통과.
2. 렌더러 코어: renderer.tsx + views 최소 4종(Button·Text·Column·Row) + demo.ts 최소 fixture → 양앱 스모크.
3. 아이콘 확장 + icons.ts(매핑·svgPath 스텁).
4. unikit-basic 18종(스텁 2 포함) + vendored 오라클 패리티 테스트.
5. unikit 전수: Tier A(21) → B(22) → C(19) — 매티어 완료 시 카탈로그 테스트 갱신, form·chart는 views-optional 옵트인.
6. 데모 완성(재생 시나리오·카탈로그 브라우저·실패 모드 연출) + 양앱 내비.
7. 문서 동기 + 전체 게이트 재실행.
