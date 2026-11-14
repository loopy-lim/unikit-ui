# 사이클 94 구현 증거 — editor 스킨 키트와 앱 성능 개선

요구: [94-requirements.md](94-requirements.md). 설계: [95-design-plan.md](95-design-plan.md). 기준 리비전 2e41be0.

## 1. 구현 결과 (AC 대응)

- **AC-1** — `packages/unikit/src/components/editor-toolbar.tsx`에서 `EditorToolbar`(forwardRef)·`EDITOR_FORMATS`(9종)·`activeFormats`·프로토콜 타입(`RnToWebViewMessage`·`WebViewToRnMessage`)·`EditorFormatState`(isActive 구조 타이핑) export. `src/index.ts` 배럴 추가. `package.json` peerDependencies 무변경(tiptap 런타임 의존 0 — `isActive(name, attributes?) => boolean` 구조만 요구).
- **AC-2** — `src/lib/editor-prose.css`(hsl(var(--*)) 토큰만) + `exports "./editor-prose.css"`. 데스크톱 `main.tsx` import, 모바일 web-editor `main.ts` import. 양쪽 앱의 개별 `.tiptap` 규칙 삭제(desktop styles.css 105-199행 제거, web-editor index.html 타이포그래피 제거).
- **AC-3** — 데스크톱 `App.tsx`: `useEditorState` selector(`formats` join 문자열 + `chars`), 글자수 `doc.textContent.length`(getMarkdown 직렬화 폐지 — `App.tsx`에 getMarkdown은 저장 시 1회만). onUpdate는 `setDirty(true)`만.
- **AC-4** — web-editor `main.ts`: `lastStateKey` diff로 `state` 메시지 조건 전송, `change`(전체 markdown 즉시 전송)은 유지. RN `editor.tsx`: `setSaveState`/`setFormats` 함수형 같은 값 반환(React bail).
- **AC-5** — 두 앱 툴바를 패키지 `EditorToolbar`로 교체. 모바일 `lib/protocol.ts` 삭제(패키지 타입으로 대체), 데스크톱 수동 툴바·runFormat의 isActive 테이블 제거(엔진 실행 chain/메시지 전송은 앱 소유 유지).
- **AC-6** — registry.json에 `editor-toolbar`(registry:ui, files 복사)·`editor-prose`(registry:style) 등록. 쇼케이스 카탈로그·데모 갱신. 문서 수치 62종·71 아이템(UI 62 + lib 3 + theme 4 + style 2) 반영 — README 3종·llms.txt·AGENTS.md·docs/components.md·install 2종·roadmap·packages README.
- **AC-7/AC-8** — 아래 검증 기록.

## 2. 기계 검증 (2026-11-14 실측)

| 명령 | 결과 |
|---|---|
| `bun run typecheck`(워크스페이스 전부) | exit 0 |
| `bun run audit:design` | 9/9 PASS(exit 0) |
| `cd apps/desktop && bun run build` | exit 0(238ms) |
| `cd apps/mobile && bun run build:editor` | exit 0 — 번들에 prose 규칙·state diff 축소형 포함(python 탐색 확인, minifier가 문자열 리터럴을 백틱화해 grep 불가) |
| `cd apps/web && bun run build` | exit 0 — 카탈로그 62·`public/r/editor-toolbar.json`·`editor-prose.json` 생성 |

트리아지 수정(브리지 아이콘·flex-wrap·계측 제거·P2-3) 후 재실행(2026-11-14): typecheck 5 패키지 전부 exit 0, audit:design 9/9 PASS, `apps/web` 빌드 exit 0, `apps/desktop` 빌드 exit 0(378ms).

## 3. 화면 검증 (G4 실측, 직접 목격)

데스크톱(vite preview 4173, 빌드 산출물):
- 라이트: EditorToolbar 렌더, 커서 위치 추적(제목 1 [pressed] — h1 «UniKit Markdown» 안), 글자수 «121자»(textContent 기반).
- 다크: html.dark 하 픽셀 실측 배경 rgb(9,9,11)·h1 rgb(250,250,250)·코드 배경 rgb(39,39,42) — 본문 타이포그래피 토큰 전환 확인. h1 30px(1.875rem)·p margin 12px(0.75em) — editor-prose.css 표준값.
- 다크 제목란: 잔여 채움 제거 후 제목 입력창 내부 명도 9.7 = 헤더 배경 9.7(중앙값, 차분 0) — P2-3 수정 검증.
- 정정: 최초 기록의 «mwggap6z(라이트)» 라벨은 오류 — 해당 파일은 다크와 바이트 동일이었다(같은 CDN 캐시 반화). 실측 라이트는 아래 mwgivjhi.
- 스크린샷: `browser-artifacts/browser-screenshot-localhost-mwgivjhi-c3b83982.png`(라이트, 실측)·`…-mwgix97u-7645bb79.png`(다크, 자체 토글 클릭 후 — 앱 테마는 prefers-color-scheme이 아니라 앱 버튼 상태로 전환됨).

모바일(emulator-5554, APK 설치 + Metro 8081 reverse):
- 편집 화면: 패키지 EditorToolbar 렌더 — 좁은 화면에서 루트 flex-wrap으로 2행 랩(P1-3, ScrollView 래퍼는 제거), WebView 본문 타이포그래피, «저장됨» 상태.
- 아이콘 가시성(P1-1): 다크에서 툴바 13개 요소 아이콘 전부 밝게 렌더 — 브리지 아이콘 color 해석 수정 전후 픽셀 비교로 확인(수정 전 132 어두운 픽셀 → 수정 후 132 밝은 픽셀 영역).
- 서식 왕복(재검증): 굵게 단독 탭 → Metro 로그 `runFormat: bold` → WebView `{"type":"state","formats":["bold"]}` 수신 → 버튼 내부 accent 채움 픽셀 확인(`----###----` 채움 ↔ `-...###...-` 투명, 눌림/해제 스크린샷 차분 x200–280). 재탭 → `formats:[]` + 채움 소멸. RN→WebView→tiptap→state→RN 전 구간 왕복 확인.
- 다크: RN 크롬과 WebView 본문 모두 다크.
- 스크린샷: `tool-results/mcp-t3-code-blob-1794667216948-yuommp.png`(굵게 눌림)·`…1794667441771-di9et6.png`(해제)·`…1794667779130-cpaedx.png`(계측 제거 후 최종) 및 초반 4장(`…1794663714642` 라이트·`…3753788`·`…3781657`·`…3839149` 다크) — 세션 도구 결과 디렉터리.

## 4. 조사 기록 — 클릭 시 후행 빈 문단 (회귀 아님, 기각)

데스크톱에서 CDP 합성 클릭 1회(목록 항목 근처 y=340)에 `<p><br class="ProseMirror-trailingBreak"></p>` 후행 문단이 추가되고 dirty가 켜지는 현상 관찰. 판정 실험: HEAD(2e41be0) App.tsx로 되돌린 빌드에서도 동일 재현(5블록 → 클릭 → 6블록 + dirty). 결론: tiptap/ProseMirror의 목록 하단 클릭 휴리스틱(문단 삽입)으로, 이번 변경 무관. 사이클 범위 밖.

## 5. G4 독립 리뷰 결과 (증거 기반 트리아지)

리뷰어 구성: 코드/아키텍처 1 + UI/UX 실측 감사 1(클린 컨텍스트 — 원 요청·diff·기계 출력·스크린샷만 전달). 트리아지 원칙대로 경로:줄·렌더 근거 없는 의견과 취향(P3)은 기각했다.

### 확정·수정 (F-*)

- **P1-1 다크 모드 툴바 아이콘 실종(수정)** — 브리지 `wrapNativeLucide`가 `color="currentColor"`를 넘기고, RN Svg는 스타일 상속이 없어 currentColor가 검정으로 렌더(다크 배경에 묻힘). lucide-react-native 소스(Icon 팩토리 color prop)·react-native-svg extractBrush(currentColor → 브러시 타입 2)·uniwind(className 빌드 타임 변환, Svg는 죽은 prop) 추적으로 원인 확정. 수정: `useResolveClassNames(className)`로 text-* 색을 실측값으로 해석해 lucide `color`에 전달(`bridge/native.tsx`). 픽셀 검증 완료.
- **P1-3 좁은 화면 3버튼 은닉(수정)** — 툴바 루트에 `flex-wrap`(좁으면 2행), 앱 쪽 가로 ScrollView 래퍼 제거(스크롤 은닉이 원인). 320dp급 에뮬레이터에서 11버튼 전체 노출 픽셀 확인. 행 끝 구분자 잔존은 경미한 잔상으로 수용.
- **P2(코드 리뷰 6건, 수정)** — `useEditorState` selector·데모 코드 문자열의 editor null 가드 2, 데모 `onFormat`이 포맷과 무관하게 항상 `toggleBold()` 실행하던 버그 1(포맷별 체인 실행 주석으로 수정), 문장 병합 중복 1(README.ko), npm 게시분 수치 0.2.0/28종 → 0.3.0/61종 정정 2(install 2종·roadmap). 수정 후 웹 빌드·tsc 재통과.
- **P2-3 다크 제목란 잔여 채움(수정)** — Input의 `dark:bg-input/30`은 shadcn 원본 클래스라 변형 접두사가 달라 twMerge로 제거 불가. 패키지는 원본 유지, 앱(App.tsx)에서 인라인 `style={{ backgroundColor: "transparent" }}`(동적 style 계약)로 무력화. 픽셀 검증(제목란 9.7 = 헤더 배경 9.7).

### 재검증 결과 결함 아님 (기각)

- **P1-2 «토글 눌림이 onFormat을 발화하지 않는다»** — 코드 리뷰(toggle.tsx·toggle-group.tsx·editor-toolbar.tsx·bridge Pressable 전 고리 검토: 결함 없음) 후 에뮬레이터 재시험: 굵게 단독 탭(신선한 ref)으로 `runFormat: bold` → `state:["bold"]` → accent 채움 픽셀까지 전 구간 동작. 초반 «무반응» 관찰은 재렌더 뒤 부패한 ref 프레스가 WebView에 착탈한 시험 오염(착탈 시 tiptap state 메시지가 함께 온 것이 오히려 증거). 같은 맥락에서 1차 세션의 «볼드 적용» 관찰도 오염 가능성이 있어 본 재검증으로 대체했다.
- **P1-2 눌림 채움 대비(bg-accent 1.04:1)** — shadcn 원본 toggle이 동일한 `data-[state=on]:bg-accent` 토큰을 씀. 충실 원칙(감사 74)에 따라 원본 유지.
- **P2-1 터치 타깃 40dp·hitSlop 중첩** — 기존 커밋된 컴포넌트 내부 관행, 이번 변경 범위 밖.
- **P2-2 헤더/본문 배치** — 표준 문서 편집기 레이아웃(전폭 툴바 헤더 + 중앙 본문 칼럼)이라 판단.
- **P2-4 다크 outline 테두리 대비 1.34:1** — zinc 토큰값은 shadcn 원본 테마 설정.
- **P2-5 저장 상태 어휘 상이(«저장됨» vs «•» dirty)** — 데스크톱 수동 Ctrl+S·모바일 자동 저장 모델 차이는 설계 의도.
- **클릭 시 후행 빈 문단** — §4(HEAD 빌드에서 동일 재현, tiptap 휴리스틱).

### 증거 무결성 정정

초반 감사에서 «라이트»로 보고한 데스크톱 스크린샷(mwggap6z)이 다크와 바이트 동일이었음을 감사자가 적발 — 동일 CDN 캐시 반화. 라이트는 재촬영(mwgivjhi)으로 대체하고, 미묘한 UI 상태는 육안 대신 픽셀 측정으로 판정하는 절차로 전환해 재검증했다. 1차 세션의 육상 판독 2건(«B 채움 확인»·«accent-foreground 아이콘 밝음»)도 픽셀 측정으로 부정된 바 있다.
