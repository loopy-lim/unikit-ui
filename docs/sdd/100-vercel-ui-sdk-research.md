# 100 — Vercel UI SDK(vercel-labs/ui) 분석: 행동 계층 대조·스킬 배포 검토

조사 문서(관문 대상 아님 — 51-research.md와 같은 장르). 기준일 2026-11-17(§7 일부 2026-11-18 재실측), 실측 기반.

> **참고(2026-11-18, 이슈 [#21](https://github.com/loopy-lim/unikit-ui/issues/21) 문서 정리 반영 시점)**: 이 문서가 main에 들어가는 시점에 main 기준선에는 아직 사이클 101의 코드 산물(`packages/unikit/src/behaviors/ui-sdk.ts`·`apps/expo` 스파이크 부속·`@ui-sdk/core` 의존)이 병합되지 않았어요. 아래의 파일 경로·화면은 기기 실측을 수행한 작업 체크아웃 기준이고, 코드 반영은 그 뒤를 따라요(docs/sdd/issue-22-ui-sdk-excluded-helpers.md의 참고 주석과 같은 취지).

- 원 요청: «Vercel lab의 ui도구가 나왔는데, 이것도 여기에서 진행해볼 수 있어?» — 사용자 선택: 갭 분석 + 스킬 배포 검토 + 웹 데모 체험 3종 병행.
- 핵심 결론: **의존성·이식 대상이 아니라 참조 이웃**. 웹 전용(DOM·ARIA 전제)이라 브리지 단일 계약 원칙과 양립 불가. 대신 (a) 순수 로직 행동의 브리지 이식 후보, (b) npm 문서 동봉·스킬 배포 아이디어를 얻었어요.

## §1 무엇인가 (공개 사실 — 2026-11-17 실측)

- **주체·공개**: Vercel Labs의 **UI SDK**. 2026-11-13 보도로 공개된 오픈소스 베타(Apache 2.0). 저장소 <https://github.com/vercel-labs/ui> · 문서 <https://ui-sdk.dev> · ★1.9k·fork 36(2026-11-17 기준)·마지막 커밋 2026-11-17(#769)로 활발해요.
- **구성**(저장소 `packages/` 실측): 행동 코어 `@ui-sdk/core` + 프레임워크 어댑터 `react`·`vue`·`svelte`·`solid`·`web`(웹 컴포넌트) 5종. **React Native 어댑터는 없어요.**
- **규모**(실측): 코어 `src/components/` 51 디렉터리(완성 컴포넌트), `src/foundation/` 21 주제 디렉터리(행동), 문서 카탈로그(`apps/docs` behaviors/index.mdx)에 **헬퍼 263개**를 15개 이상 주제로 정리. npm 버전 `0.1.0-beta.6`(2026-11-17 설치 실측). "50+ behaviors"는 행동 계층 마케팅 표기예요.
- **모델**: 무스타일(headless) 행동 라이브러리 + npm 의존 모델(우리는 토큰 스타일 + 소비자 복사(레지스트리) 모델). `definePrimitive`(상태·슬롯·api 정의)로 프리미티브을 정의하고 `createParts`로 각 프레임워크 파트로 조립해요. 기본 스킨은 `@ui-sdk/core/web.css` 선택.
- **에이전트 전략**: ① npm 패키지 안에 문서(`docs/llms.txt` 인덱스 + 컴포넌트별 md)를 동봉 — 소비자 프로젝트의 에이전트가 `node_modules`에서 바로 읽어요. ② `npx skills add vercel-labs/ui --skill ui-sdk`로 에이전트 스킬 배포(skills.sh). ③ `createAgent`·`agentTools`(snapshot·act·query)·WebMCP `registerTools` — 소비자 **페이지의 컴포넌트를 런타임에 읽고 조작**하는 계층(«스크린샷 없이 컨트롤을 직접»이 차별점 주장).

## §2 웹 데모 체험 (/tmp/uisdk-demo — 라이브러리 변경 없음)

vite react-ts + `@ui-sdk/react` `0.1.0-beta.6`, 포트 5199(세션 종료 시 폐기). Select·Popover(완성 컴포넌트)와 README 예제 search-field(`definePrimitive` + `createFocusRecovery` 행동 조립)를 띄웠어요. 브라우저(접근성 트리·JS 평가)로 실증:

- **행동 계층 실증** — input에 `hello` 입력 → 슬롯 `present: state.value !== ""` 계약대로 Clear 버튼 등장. Clear 클릭(포커스된 버튼 언마운트) → 값 초기화와 함께 **포커스가 input으로 복구**(`createFocusRecovery` fallback 작동 확인 — activeElement가 input).
- **완성 컴포넌트 실증** — Select 개방 시 `role="listbox"`·`option` 3건·`aria-selected`·`data-highlighted` 상태 노출. web.css 기본 스킨은 `@layer ui-sdk;` 선언과 함께 동작.
- 체감: 슬롯 계약(attrs·present·press·bind)이 러닝커브지만, 상태 기계는 프레임워크 무관 코어에 있고 React 쪽은 얇아요. 무스타일이라 소비자가 전부 스타일해야 해요(우리 토큰 클래스 접근과 대비).

## §3 행동 카탈로그 대조 — UI SDK 주제 × UniKit behaviors 진입점(사이클 100)

우리 쪽 재노출 목록은 `packages/unikit/src/behaviors/index.ts` 실측(overlay·menu-nav + 브리지 훈 useDrag·useDismiss·useOverlayFocus·useReposition·useScrollLock).

| UI SDK 주제(대표 헬퍼) | UniKit 현황 | 판정 |
|---|---|---|
| Popups·Layers(createPopup·position·bindLayer) | ModalOverlay·AnchoredOverlay·computeOverlayPosition(12방+클램프)·useDismiss·useReposition·useScrollLock | **상당 충족** |
| Focus·Keys(createRovingFocus·createTypeahead) | useMenuNav(항목 DOM 포커스 루빙·타입어헤드)·useOverlayFocus(트랩·복귀) | 부분 충족 — 그리드 포커스·공간 이동 없음 |
| Lists(createListbox) | menu-nav이 탐색 상당(하이라이트 상태 기계 대신 DOM 포커스 방식) | 부분 충족 |
| Selection(createSelection — Shift/Ctrl 범위) | 없음 — 컴포넌트별 단일 선택 산재 | 갭 |
| Drag&Drop(createReorder·createTransfer) | useDrag(기본 드래그)만 — 재정렬·이동 상태 기계 없음 | 갭 |
| Lists 심화(createVirtualizer·createStickToBottom·createInlineEdit) | 없음 | 갭 |
| Trees(createTreeCollection·visibleTreeRows) | 없음 | 갭 |
| Motion(bindPanel·animateIn/Out·spring) | 없음 — 오버레이 등장/퇴장 즉시 전환(기존 로드맵 항목과 동일 지점) | 갭 |
| Changes(createChange·createUndoStack·sourceOf) | 없음 — 컴포넌트별 콜백 관례 | 갭 |
| Platform(announce·shortcuts) | announce 없음(sonner만 role=status)·shortcuts 없음(direction 컴포넌트는 있음) | 갭 |
| Preferences·Storage(createPreference·createColorScheme·localStorage) | 없음(Provider의 토큰 값 전환은 별개) | 갭 |
| Text 검색(fuzzyScore·matchRanges) | 없음 — command가 자체 필터 사용 | 갭 |
| Canvas(createViewport·createConnect) | 없음(chart 줌 미지원과 연결) | 갭 |
| Mobile(bindViewport·bindAvoidKeyboard — 브라우저 visual viewport) | 없음 — 네이티브는 RN Modal·브리지가 자체 처리 | 갭(웹 전용 주제) |
| Agents(createAgent·agentTools·WebMCP) | 없음 — 다른 계층(§5) | 별도 과제 |

역방향(우리만의 것): **웹+RN 단일 계약**(그들의 mobile.mdx는 브라우저 모바일이지 RN이 아니에요), **토큰 스타일 동봉**(무스타일 아님), **shadcn API 호환 + 소비자 복사 레지스트리**(npm 의존 아님).

## §4 갭 → 로드맵 후보 (수요 판단은 사용자 몫 — 우선순위 제안만)

이식 가능성은 두 부류로 갈라요:

1. **순수 로직(브리지로 RN 무관 이식 가능)** — `createSelection` 유사 다중·범위 선택 상태 기계(table 다중 선택·파일 관리형 UI 수요), fuzzy 매칭(command 필터 고도화), `createUndoStack`·입력 이력(단, 에디터는 tiptap이 자체 undo 제공), `matchesShortcut`(단축키 매처 — 에디터·툴바 문맥). 후보 진입점: 기존 `@unikit-bridge/ui/behaviors` 확장.
2. **플랫폼 종속(웹 전용이거나 RN 등가가 다른 것)** — virtualizer(RN은 FlatList가 이미 담당), canvas·pan/zoom, mobile helpers(브라우저 전용), DnD 재정렬 일부(포인터 이벤트·측정 전제). 브리지 계약 확장이 먼저라 비용이 커요 — 관찰 유지.

같은 맥락에서 기존 로드맵과 연결되는 것: Motion 갭(animateIn/Out·bindPanel)은 roadmap-components «오버레이 등장/퇴장 애니메이션 — `web:` 클래스 도입 검토» 항목의 참고 사례가 돼요(그들의 접근: CSS 진입 상태 + 애니메이션 종료 콜백).

## §5 에이전트 조작 계층 — 방향 차이 기록

UI SDK의 `createAgent` 계층은 **소비자 앱 런타임**에서 페이지 컴포넌트를 snapshot·act·query해요(WebMCP로 브라우저 내장 에이전트까지). 우리 `@unikit-bridge/mcp`(도구 4종·데이터 동봉)는 **빌드 타임 레지스트리 조회**예요 — 목적이 다르고 충돌하지 않아요. UniKit 컴포넌트로 지은 앱에 동등한 조작 계층을 얹는 건 (a) 웹 전용 UI SDK 의존 추가이거나 (b) 브리지식 웹+RN 등가 설계라 큰 그림 과제예요. 지금은 방향 메모로만 남겨요.

## §6 스킬 배포 검토

그들의 3중 패키징(실측): ① npm 패키지 내 `docs/llms.txt` + 컴포넌트별 md — 노드모듈에서 직접 읽힘. ② 스킬 본체 `packages/core/skills/ui-sdk/`(SKILL.md 56행 + references 7종 — web-components·testing·styles·patterns·create-component·build-interface·agent-ready)을 `skills.sh.json`로 노출, `npx skills add vercel-labs/ui --skill ui-sdk` 설치. ③ 저장소 `.claude/skills`(→`.agents/skills` 심볼릭) 동봉.

우리 현황(실측): llms.txt는 **저장소 루트 한정 — npm tarball 미동봉**(`packages/unikit/package.json` files: src·docs·README·LICENSE). docs/에는 tokens.md만. MCP가 데이터를 동봉하지만 서버 소스는 포털 저장소예요.

권고(단계별):

- **(a) 저비용 고가치 — npm에 llms.txt 동봉**: `files`에 `llms.txt` 추가. 소비자 프로젝트의 에이전트가 `node_modules/@unikit-bridge/ui/llms.txt`를 읽어요. 포털 `sync:data`와 같은 원천이라 중복 유지보수가 늘지 않아요.
- **(b) 검토 — 에이전트 스킬 작성·배포**: 내용 후보는 «브리지 원칙(플랫폼 분기 금지)·설치(shadcn CLI)·behaviors·토큰 규칙·이식 9조» 요약. 위치는 이 저장소 `.agents/skills/` + skills.sh 등록(주체 결정 필요). UI SDK 스킬이 «에이전트가 쓰는 법»을 가르치듯, ours는 «에이전트가 UniKit으로 짓는 법»이 되겠어요.
- **(c) 주의 — 동기화 부담**: 스킬·llms.txt는 코드와 달리 드리프트 위험이 있어요. (a)부터 진행하고 sync:data 파이프라인에 포함시키는 순서를 권해요.

## §7 후속(같은 날) — «ui-sdk를 쓰는데 RN도 되도록» 실현 가능성 실측

사용자 방향 확정: UI SDK를 의존으로 가져가되 RN에서도 돌게 하는 것. 이를 3층으로 나눠 실측했어요.

**층 1 — 순수 로직 헬퍼의 RN 재사용: 실증됨.**
- Metro 통과: `expo export:embed --platform android --dev false` 프로덕션 번들 성공(apps/expo). 루트 임포트 `@ui-sdk/core`(전체 그래프)와 서브패스 `@ui-sdk/core/text-match` 둘 다 번들에 포함(심볼 isTypeaheadKey·fuzzyScore 확인).
- DOM 없는 런타임 평가: bun(`document` 전역 부재)에서 루트 임포트 평가 시점 크래시 없음. 계산 정상 — isTypeaheadKey(k)=true·(ArrowDown)=false·(ctrl+k)=false, fuzzyScore("abcd","abc")=0.9675·("xyz","abc")=0.
- 허들 2가지(실측): ① `isTypeaheadKey`의 공개 계약은 DOM 이벤트 모양·타입(`KeyboardEvent` — `event.key`·`ctrlKey`·`metaKey`·`altKey` 읽음). 문자열 키 판정조차 이 형태를 요구해서, RN 적용은 브리지 `BridgeKeyEvent` → 이 형태로 바꾸는 얇은 래퍼가 필요해요(스파이크의 fakeEvent가 그 최소형). ② 문자열 키 기반 순수 상태기계 `createKeySelection`(selection-model.ts — DOM 참조 0)은 루트에 미수출이고, 공개된 `createSelection`은 커널 `PrimitiveContext`를 받아 단독 소비가 어려워요.
- foundation 204파일 중 **런타임 DOM 호출은 ~40파일**로 국한돼요(popups·platform·motion·storage 등). DOM 타입 참조(`HTMLElement` 서명 등)까지 세면 ~102파일 — 이것도 Metro 번들에는 걸리지 않아요(§7 실증)지만 브리지 타입 래핑 대상이 돼요.

**«전체적으로 가져오기 + 얇은 래퍼» 판정(2026-11-17 추가 실측)** — 안 되는 이유는 래퍼 두께가 아니라 플랫폼 계약이에요. 3벽:
1. **명령형 변경** — 50파일이 `setAttribute`·`.style.`·`getBoundingClientRect`를 써요. 코어의 live()/direct 쓰기 전략이 «DOM은 즉시 변이 가능» 전제로 설계됐어요. RN은 마운트된 뷰의 props를 명령형으로 바꿀 수 없고(setNativeProps는 Fabric에서 제거) 재렌더로 흘려야 해요 — 이건 래퍼가 아니라 역방향 react-native-web급 아키텍처예요.
2. **동기 레이아웃 읽기** — `getBoundingClientRect`는 동기, RN의 `measureInWindow`·`onLayout`은 비동기예요. 팝업 위치 계산의 타이밍 의미 자체가 달라요.
3. **키 이벤트** — focus 주제 10파일 중 8이 DOM이에요. native RN View에는 키 이벤트 자체가 없어서(기존 실측) 래퍼로 빚을 수 없는 종류의 결함이에요.

**Rust 판정** — 이 심에는 안 맞아요. ① 막힌 곳이 성능이 아니라 위 3벽(계약)이라 Rust의 속도가 벽을 지우지 않아요. ② 심이 JS↔JS예요(행동은 JS, RN도 JS) — Rust가 중간에 끼일 자리가 없어요. ③ UniKit 배포 모델은 소비자가 TS 소스를 복사하는 레지스트리라 cargo·NAPI·WASM 산물은 복사 설치가 불가능해요(모델 붕괴). ④ Rust 코어 재작성(Astryx식 네이티브 접근)은 Apache 2.0상 가능은 하나 «가져오기»가 아니라, 주간 단위로 반복되는 베타 업스트림(공개 4일차 446커밋)을 포크로 유지하는 일이에요. Rust가 실제로 맞는 자리는 나중에 P2에서 제스처 물리를 UI 스레드로 돌릴 때고, 그 자리의 RN 표준 답은 Reanimated(C++)이에요. 데스크톱 Tauri는 앱 셸 포장이라 선례가 안 돼요.

**«전체적으로»의 실현 가능한 의미** — 층 1 전량 랩이에요. DOM-프리 파일 102/204(주제 전체가 무결한 color 9·date 6·number 7·gauge 2 + 혼합 주제의 순수 파일: motion 수학·selection 모델·lists 데이터 엔진·text 매칭·kernel store 등)을 peer 재수출 + `BridgeKeyEvent` 래퍼로 가져오는 것 — «가져올 수 있는 전부»를 가져오는 방법이에요.

**«계약을 우리가 채운다»(DOM 호환층) 판정(추가 실측)** — 사용자 제안: 3벽을 UniKit이 구현해 채우고, 동기 측정은 JNI(TurboModule 동기 메서드)로. 방향 자체는 실재해요(NativeScript가 native 뷰를 DOM처럼 노출하던 접근의 역방향). 실측한 채울 표면의 크기:
- **DOM API 26종·약 1,200 호출 지점**(foundation+kernel+page+components 합계) — focus( 183, contains( 135, addEventListener 113, getBoundingClientRect 76, getAttribute 75, setAttribute 70, matches  70, getComputedStyle 45, closest  42, requestAnimationFrame 39, textContent 35, MutationObserver 30, document.activeElement 24, instanceof HTMLElement 18, ResizeObserver 13, getRootNode 13, scrollTo 15 외.
- 함의: 이벤트 시스템(캡처·버블)·속성·**가상 포커스**(RN엔 뷰 포커스 없음 — activeElement 24곳)·가상 노드 트리(closest/contains/querySelector용)·MutationObserver 자체 구현·getComputedStyle(45곳 — uniwind className→값 해석 필요)·동기 rect(76곳). `instanceof HTMLElement` 18곳은 `globalThis.HTMLElement`까지 갈아끼워야 통과해요. 결론: «얇은 래퍼»가 아니라 **작은 브라우저 DOM 런타임**을 짓는 사업이에요(react-native-web의 역방향 — 개월 단위).
- **JNI 직감의 정확도**: Android는 TurboModule 동기 메서드로 동기 측정이 가능해요. 단 ① iOS는 JNI가 아니라 Obj-C 동기 호출로 각각 만들어야 하고 ② UI 스레드 동기 진입은 데드락·버벅임 리스크가 있으며 Fabric shadow tree에서 stale 좌표를 읽을 수 있고 ③ 프레임당 동기 폴링은 RN이 Reanimated(UI 스레드 worklet)로 방향을 정한 문제 영역이에요.
- **현실적 범위(권고)**: 풀 DOM 런타임이 아니라 **팝업 계열 수직 슬라이스**로 증명 — `createPopup` 계약에 필요한 표면만(이벤트 3종·속성 3종·rect·focus) 채워 그들의 Popover가 RN에서 열리게 하는 것. 개방 시 1회 측정은 우리 overlay.tsx가 이미 해온 방식(비동기 measure→고정 배치)이라 경험 자산이 있고, 스크롤 추종에서 동기 측정이 실제로 필요한지(그들의 웹 코드도 rAF 39곳으로 이미 비동기 구동)가 슬라이스에서 드러나요.

**«동기 + 어댑터 패턴» 최소 증명(계약 프로브 — 같은 날)** — `position()`(팝업 위치 계산의 심장, 루트 수출)을 DOM 없는 런타임(bun)에서 가짜 요소로 돌렸어요. 프로브: `apps/expo/uisdk-probe.mts`(머리 주석 «임시, 실행 후 삭제»대로 실측 직후 제거 — 결과는 아래에 전부 기록, FakeElement 계약은 `uisdk-adapter.ts`로 제품화).
- **결과: 완주·수치 정확** — 앵커(100,200·120×40)에 side=bottom·align=start·sideOffset=8를 주자 `left:100px·top:248px`(=240+8), `--available-height:588px·--available-width:374px`(뷰포트 390×844에서 올바른 클램프), `--anchor-width/height:120px/40px` 계산. `data-side·data-align` 속성 기록.
- **측정된 계약(이 행동 전체)**: 요소 10개 멤버(getBoundingClientRect·getClientRects·client{Width,Height,Left,Top}·offset{Width,Height}·setAttribute·style.setProperty·style.transformOrigin) + 전역 6종(MutationObserver·requestAnimationFrame·getComputedStyle·document.addEventListener[scroll·pointermove·focusin·input·load·animationstart·transitionstart]·document.documentElement.client{Width,Height}·window resize). 추정 26종이 아니라 이 행동은 이 정도예요.
- **동기 측정에 대한 답**: `position()`은 rect를 rAF 루프·이벤트 구동 안에서 **주문형**으로 읽어요(레이아웃 중 동기 읽기 아님). 따라서 v1은 onLayout/measureInWindow로 채운 **rect 캐시**를 동기 읽기처럼 제공하면 JNI 없이 성립하고, TurboModule 동기 호출은 정밀도 업그레이드 경로예요. document 이벤트 7종은 각각 RN 등가가 있어요(scroll→onScroll·pointermove→제스처·resize→Dimensions·focusin/input→가상 포커스·onChangeText, load·animationstart·transitionstart→웹 전용 no-op 허용).
- **남은 진짜 벽**: 키보드 이벤트(하드웨어 키보드에서만 Activity/UITextView 레벨 캡처로 부분 충전 가능 — 소프트 키보드엔 방향키가 없음), 그리고 이 증명은 행동 1개 — 컴포넌트 51종 전체는 여전히 표면 확장(26종·~1,200 지점)이에요.

**P1+P2 사이클 완료(사이클 101, 같은 날 — 기기 실증)** — 권고 경로의 1·2단계를 실행했어요.

- **P1 — `@unikit-bridge/ui/behaviors/ui-sdk` 진입점(npm 전용)**: 층 1 순수 헬퍼 11종 선택 재수출 + `toSdkKeyEvent`(BridgeKeyEvent → ui-sdk 이벤트 모양) 래퍼. 전 항목 DOM 없는 런타임(bun) 실행 검증 후 선정: 타입어헤드 isTypeaheadKey·createTypeahead, 텍스트 매칭 fuzzyScore·matchRanges·matchSegments, 트리 데이터 엔진 treeFromPaths·treeDataNodes·visibleTreeRows·createTreeCollection·toggleTreeChecked·treeCheckedStates(체크 전략·indeterminate 판정 확인). 제외(실측 근거): labelOf(document.createTreeWalker), createSelection(PrimitiveContext 필요), position(P2 어댑터 대상). @ui-sdk/core는 선택 peer(peerDependenciesMeta) — 미설치 소비자는 영향 없음. 한계: BridgeKeyEvent에 shiftKey가 없어 시프트 계열 조합은 이 래퍼로 도달 불가였으나 **해소(2026-11-18, 이슈 #13)** — BridgeKeyEvent에 shiftKey 선택 멤버를 추가하고 toSdkKeyEvent가 전달. 웹은 DOM KeyboardEvent가 구조적으로 제공, 네이티브 TextInput 래핑은 시프트된 글자 대문자에서 유도하는 근사(CapsLock·자동 대문화 오탐, 이름키·기호 미탐 — bridge/types.ts에 기록). **기기 검증 완료(같은 날)**: 스파이크 화면(uisdk-spike.tsx)을 이 진입점 경유 import로 전환 — 서브패스 exports·선택 peer가 Metro를 통과하고 toSdkKeyEvent 래퍼가 에뮬레이터 런타임에서 계산 확인(isTypeaheadKey(k)=true·(ArrowDown)=false, fuzzyScore 0.9675·0).
- **P2 — position() 기기 구동 슬라이스(apps/expo)**: `uisdk-adapter.ts`(FakeElement·FakeStyle·installDomStubs·pxToNumber) + `app/uisdk-position.tsx`(목록 화면 «실험» 섹션에서 진입). 흐름: 앵커·팝업·컨테이너 measureInWindow(비동기) → rect 채운 FakeElement → position() 동기 계산 → style 쓰기를 RN style로 적용 → stop().
- **기기 검증(emulator-5554, 수치 3중 대조)**: 위쪽 앵커(실측 x16 y184·160×44) → `left:16px·top:236px` = 184+44+8 **정확**, `data-side=bottom`. 아래쪽 앵커(x16 y748·238×44, 아래 공간 44 < 팝업 124) → **플립 판정 `data-side=top`**, `top:616px` = 748−8−124 **정확**. `--available-height` 600·732 = 뷰포트 844(390×844 dp, Dimensions live getter)에서 클램프 수학과 일치. 플립 판정도 ui-sdk 코어가 내렸어요(어댑터는 좌표만 전달).
- **새 계약 발견(«전역 6종»의 정정)**: RN에서 `window === globalThis`라 window는 **이미 존재하지만 DOM 멤버가 없어요**. «없으면 설치» 가드는 이 경우를 건너뛰고, `target?.addEventListener(...)` 선택 체인은 대상이 객체인데 메서드가 없으면 못 막아요(널만 막음) — 실제 크래시 `undefined is not a function`(moves.js listen). 해결: installDomStubs를 «통째로 설치»가 아니라 **멤버 단위 패치**로. 추가 확인: RN 자체 AbortController polyfill 존재(setUpXHR), document.fonts는 undefined여도 선택 체인으로 무해. 프로브(bun)는 window가 아예 없어 이 차이가 안 보였어요 — DOM 없는 런타임 검증은 프로브 네이티브 런타임(기기)을 대체하지 못해요.
- **v1 한계(의도적)**: 개방 시 1회 계산 후 stop() — 스크롤 추종 미구동. 추적 재계산은 우리 useReposition 훈 영역이고, 추종 정밀도가 필요해질 때 TurboModule 동기 측정이 업그레이드 경로예요.

**P3 — position() 전체 API 상시 구동(같은 날, 기기 실증)** — v1의 «1회 계산» 한계를 허물고 이 행동을 본래 설계인 «계속 따라가는 배치 엔진»으로 구동했어요. 화면 `apps/expo/app/uisdk-popup.tsx`(목록 «실험» 섹션 진입), 어댑터 확장 `updateRect`(rect 캐시 제자리 갱신)·style/attr `observer` 훅(계산 결과 → RN 화면 반영)·style 유도 `getBoundingClientRect`(«스타일이 곧 위치» web 의미 복원).

- **무엇으로 성립하나(전부 공식 @stable 계약)**: 앵커를 `VirtualAnchor`({x,y}·{getBoundingClientRect} — 노드 아님) getter로 전달하면 position()의 rAF 루프가 **닫히지 않고**(unwatched 경로, `still < stillFrames || unwatched`) 매 프레임 앵커를 다시 읽어요. onScroll → measureInWindow → updateRect(제자리)만 해주면 추종 입력이 되고, 이벤트 주입·리스너 레지스트리가 필요 없어요(watchMoves/listen 스텁 no-op 유지). 옵션도 getter로 전달해 **열린 채 side/align 전환**이 다음 프레임에 재배치돼요. `arrow` 옵션으로 화살표 요소에 left/top·data-side·data-arrow-clamped가 기록돼요(tooltip·popover 핵심).
- **기기 실증(2026-11-17, emulator-5554 — 화면 진단 수치)**: ① 개방 side=bottom — available w374(=390−16)·h452(=844−8−332−44−8)·top=앵커 y+높이+오프셋 정확. ② side 열린 채 순환 bottom→top→right→left 전부 재배치(화살표 면 전환 포함). ③ side=right에서 `--available-width` **123**(=390−8−앵커 우측 250.5−8) — 팝업이 이 값을 max 폭으로 취하자 화면 안에 온전히 들어옴(안 취하면 224 폭으로 92dp 넘침). ④ 스크롤 추종 — 스와이프 후 raw 측정 y188 == rect 캐시 y188(더블링 없음) → SDK 재계산 → top 236(=188+44+8−4, 측정 오차) 추종. ⑤ align 열린 채 start→center — 카드 중심이 앵커 중심으로(예측 top 288dp 일치).
- **새 계약 발견(메인 축 비클램프)**: position.js 119-133 — 뷰포트 클램프는 **정렬 축만** 해요(bottom/top→x, left/right→y). 메인 축은 클램프하지 않고 `--available-width/height`로 «콘텐츠가 스스로 줄어들라»는 계약이에요. 웹에서는 CSS `max-width: var(--available-width)`가 소비하지만 RN에는 CSS가 없으므로 소비자가 style에 적용해요. **되먹임 함정(2026-11-18 재실측)**: 줄어든 시각 크기를 onLayout → FakeElement.rect에 되먹이면, 스크롤 추종 중 available이 0으로 붕괴해 팝업이 사라져요(모드는 열린 채). 고유 측정 크기(개방 시 measure)를 rect에 유지하고 available은 **시각 max만** 깎는 쪽이 안전해요. 웹의 max-width는 레이아웃 엔진이 intrinsic을 보존한 채 그리는 것과 같은 분리예요.
- **origin-drift 함정(소스 정독으로 선제 방어)**: position()의 원점 계산이 매 업데이트 `getBoundingClientRect().x − parseFloat(getComputedStyle(el).left)`를 읽어요. FakeElement가 고정 rect를 돌려주면 «style로 이동 → rect는 그대로»가 되어 추종마다 원점이 누적 드리프트해요 → getBoundingClientRect가 style.left/top에서 x/y를 유도하게 해결(«스타일이 곧 위치» web 의미). **추가(2026-11-18)**: `getComputedStyle` 스텁이 빈 FakeStyle을 돌려주면 left가 항상 0 → 앵커 이동 시 style.left가 절대값이 아니라 델타로 기록되어 팝업이 화면 밖으로 사라져요. `getComputedStyle(el) → el.style`로 고치고, VirtualAnchor는 `{getBoundingClientRect}` 형태(unwatched rAF 상시)로 전달해요.
- **createPopup 판정(층 사이)**: createPopup(primitiveContext, config)은 **비공개 커널 렌더러 API**(store·element()·props()·parts·onDestroy — popup-slots는 프레임워크 어댑터의 slot()까지)를 요구해요. 얇은 어댑터 영역이 아니라 커널 포크 또는 업스트림 RN 어댑터 협력 경계예요(P3 업스트림 후보). position() 계열(팝업 배치의 전부)은 이번에 확보했어요.
- **기기 디버깅 교훈(비결정적 «동결»의 정체)**: 앱이 간헐적으로 터치 무반응이 된 원인은 코드가 아니라 **OS 프리저**였어요 — logcat에 `IPCThreadState: Sending oneway calls to frozen process` + `binder_alloc ... spamming oneway? (수백 버퍼)` 관측. 포그라운드 전환(딥링크 재진입)으로 해동돼요. 덤으로: Metro는 8083으로 실행하고 `adb reverse tcp:8083 tcp:8083`(8081 reverse는 다른 기기 것일 수 있음 — `-s`로 대상 확인), 개발 클라이언트는 Metro 단절 시 «오프라인 계속»을 기억해 **v0.1 시절 캐시 번들**을 띄울 수 있음(구버전 UI가 보이면 오프라인 캐시 의심), uiautomator dump의 idle 실패는 RN 화면에서 정상이라 화면 검증은 스크린샷+픽셀 판독으로.

**층 2 — parts 렌더러의 RN 어댑터: 구조적 선례 있음, 비용·리스크 큼.**
- @ui-sdk/react의 `use-primitive`는 코어가 뱉는 DOM 속성을 번역해요(class→className·tabindex→tabIndex·checked→defaultChecked·CSS 문자열→객체). RN 어댑터는 같은 자리에서 class→uniwind/nativewind className·aria-*→accessibility props·CSS 문자열→StyleSheet·DOM 이벤트→RN 콜백을 번역하는 층이에요. kernel 30파일의 DOM 결합은 `modality.ts`(document keydown/pointerdown 수신) 등 일부예요.
- 리스크: `renderer.ts`가 스스로 «프레임워크 렌더러 전용·비공개 API·릴리스마다 변경 가능»이라 선언해요. 어댑터를 우리가 유지하면 베타 기간 내부 API 추적 부담이 따라요.

**층 3 — 완성 컴포넌트 51종의 RN 구동: 업스트림 지원 전엔 불가.**
- 컴포넌트들이 `definePrimitive` 안에서 DOM 행동을 직접 조립해요(forms의 `attachFormInternals`는 `ElementInternals` 전용 API·keydown 기반 roving focus·top layer·visual viewport). RN View에 키 이벤트가 없다는 건 우리 menu-nav 실측과 같은 벽이에요.

**권고 경로**: P1 완료(사이클 101 — behaviors/ui-sdk 진입점) → P2 완료(같은 사이클 — position() 기기 구동 슬라이스, 위 검증) → P3 완료(같은 사이클 — position() 전체 API 상시 구동: 열린 채 side/align 전환·충돌 플립·화살표·스크롤 추종·available 리사이즈 계약, 위 검증) → 다음 후보: P3 업스트림(Vercel) RN 어댑터 논의 — createPopup 계열은 비공개 커널 API라 얇은 어댑터 밖이고, 외부 활동이라 사용자 결정. 층 2(definePrimitive RN 어댑터)·층 3(완성 컴포넌트 51종)은 여전히 리스크 문단 참조. 잔여 추적은 에픽 [#11](https://github.com/loopy-lim/unikit-ui/issues/11) 자식 이슈로 옮겨갔어요(2026-11-18 기준 #22·#16 완료): [#12](https://github.com/loopy-lim/unikit-ui/issues/12) 열린 채 side 전환 모서리 겹침·[#13](https://github.com/loopy-lim/unikit-ui/issues/13) BridgeKeyEvent.shiftKey·[#14](https://github.com/loopy-lim/unikit-ui/issues/14) 어댑터 제품화·[#15](https://github.com/loopy-lim/unikit-ui/issues/15) UniKit overlay/popover 소비·[#16](https://github.com/loopy-lim/unikit-ui/issues/16) createPopup 업스트림(완료 — 2026-11-18 보류 판정: 비도입 wontfix 확정, 업스트림 제기는 사용자 승인 대기, 상세 docs/sdd/issue-16-createpopup-rn-boundary.md)·[#17](https://github.com/loopy-lim/unikit-ui/issues/17) 층 2 어댑터 조사·[#18](https://github.com/loopy-lim/unikit-ui/issues/18) 층 3 범위 재정의·[#19](https://github.com/loopy-lim/unikit-ui/issues/19) 키보드·모달리티 벽·[#20](https://github.com/loopy-lim/unikit-ui/issues/20) (선택) TurboModule 동기 측정·[#21](https://github.com/loopy-lim/unikit-ui/issues/21) 스파이크·로드맵 문서 정리·[#22](https://github.com/loopy-lim/unikit-ui/issues/22) 제외 헬퍼 재평가(완료 — 보류 판정, docs/sdd/issue-22-ui-sdk-excluded-helpers.md).

**스파이크 부속**(철회 가능): apps/expo에 `@ui-sdk/core` 의존(실험 목적)·`apps/expo/app/uisdk-spike.tsx`(P1 진입점 경유 임포트·toSdkKeyEvent·계산 표시 화면)·`apps/expo/uisdk-adapter.ts`(DOM 계약 어댑터 — P3에서 updateRect·observer·style 유도 bbox 확장)·`apps/expo/app/uisdk-position.tsx`(P2 기기 구동 슬라이스 화면)·`apps/expo/app/uisdk-popup.tsx`(P3 상시 추종 팝업 화면 — 목록 «실험» 섹션에서 진입). 계약 프로브 `uisdk-probe.mts`는 실측 후 제거(머리 주석 «임시»대로 — 결과는 §7 기록). 저장소 쪽: `packages/unikit/src/behaviors/ui-sdk.ts` + package.json exports `./behaviors/ui-sdk`·선택 peer. 검증: 루트 typecheck 전부 exit 0·audit:design 10/10 통과·기기 4화면 전부 실증(위 참조).

**실험 화면 정책(2026-11-18 결정 — 이슈 [#21](https://github.com/loopy-lim/unikit-ui/issues/21))** — 목록 «실험» 섹션 진입 화면 3종의 keep·graduate·delete를 정했어요. 근거는 각 화면 머리 주석의 자기 규정과 §7 실측 기록이에요.

| 화면 | 역할(유일성) | 결정 | 졸업·제거 트리거 |
|---|---|---|---|
| `uisdk-spike.tsx`(P1) | npm 전용 진입점(`behaviors/ui-sdk`)의 Metro 통과·런타임 계산 기기 실증 — 진입점이 배럴·registry 밖이라 이 화면이 유일한 기기 소비 경로 | **keep** | `@ui-sdk/core`가 주간 단위 베타라 재검증 가치가 있어요. 진입점이 안정화돼 카탈로그 데모로 흡수되면 delete |
| `uisdk-position.tsx`(P2) | 1회 계산 + `stop()` 계약(개방 시 단발 배치)의 참조 구현 — 제품화(#14)가 단발 배치 옵션을 포함하므로 계약 증거로 유효. 계산 근거(앵커 rect·스타일 쓰기 기록)를 화면에 그대로 보여요 | **keep** | #14 제품화 시 제품 데모로 흡수 후 delete |
| `uisdk-popup.tsx`(P3) | 상시 추종·열린 채 side/align 전환·arrow·available 계약의 참조 구현 — #12(side=right 겹침)의 재현·검증 화면이자 #15(overlay 소비)의 입력 | **keep(graduate 후보)** | #12·#14·#15 완료 시 오버레이 제품 데모로 graduate |

- 공통 원칙: «실험» 섹션은 제품 안내가 아니라 **계약 증거 보관소**예요. 스파이크 부속은 철회 가능(위 문단)을 유지하되, 근거가 §7에 기록됐으므로 삭제는 대응 이슈(#14·#15 등) 완료 시점에 함께 판단해요.
- **디버그 텔레메트리 경계(제품/스파이크)**: 쓰기 N회(`FakeStyle.writeCount`·`writes` 링 버퍼 — uisdk-adapter.ts)와 «앵커 y→top» 판독(uisdk-popup.tsx 팝업 카드 하단 텍스트)은 **스파이크 화면 전용 계측**이에요. 되먹임·origin-drift 함정 방어 검증에 계속 필요하므로 실험 화면에는 남기되, #14 제품화에서 어댑터가 `@unikit-bridge/ui`로 올라갈 때 이 계측은 제품 표면으로 넘어가지 않아요(제품 진입점 export에서 제외 — 제품 데모는 사용자 가치 문구로 대체).

## §8 참조

- 저장소: <https://github.com/vercel-labs/ui> · 문서: <https://ui-sdk.dev> · 공개 보도: MarkTechPost 2026-11-13 <https://www.marktechpost.com/2026/11/13/vercel-ui-sdk-agent-ui-behaviors>
- 실측 스냅샷: `/tmp/uisdk-ref/ui`(얕은 클론 cf6c86f, 2026-11-17), 웹 데모 `/tmp/uisdk-demo`(`@ui-sdk/react` 0.1.0-beta.6), RN 스파이크 번들 `/tmp/index.android.bundle`(apps/expo·`expo export:embed --platform android --dev false`).
- 연결 문서: docs/roadmap-components.md «경쟁 현황»·«미지원 기능 로드맵», packages/unikit/src/behaviors/index.ts(사이클 100), docs/sdd/51-research.md(선행 조사 선례).
