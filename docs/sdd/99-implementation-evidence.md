# 사이클 95 구현 증거 — editor 엔진 진입점과 kitchen-sink 폐지

요구: [97-requirements.md](97-requirements.md). 설계: [98-design-plan.md](98-design-plan.md). 기준 리비전 d52f4dd.

## 1. 구현 결과 (AC 대응)

- **AC-1** — `packages/unikit/src/editor/`(web.tsx·native.tsx·types.ts·colors.ts + editor-html.ts 빌드 산출물) 신설. `package.json` exports `"./editor"`(`react-native` → native.tsx, `default` → web.tsx). 배럴(`src/index.ts`)·`registry.json` 미등록(npm 전용). 번들 원본은 `apps/mobile/web-editor` → `packages/unikit/editor-web-view`로 git mv, `build:editor`(editor-web-view 빌드 → dist/index.html을 src/editor/editor-html.ts 인라인)을 패키지 스크립트로 이관(apps/mobile은 alias).
- **AC-2** — peerDependencies에 `@tiptap/extensions`·`@tiptap/markdown`·`@tiptap/pm`·`@tiptap/react`·`@tiptap/starter-kit`(전부 ^3.0.0)·`react-native-webview`(^14.0.0) 추가 — 전부 `peerDependenciesMeta` optional 실측. 배럴 소비 그래프 불변.
- **AC-3** — `components/editor-toolbar.tsx`(src↔registry 양쪽, diff 77줄 대칭)에서 `RnToWebViewMessage`에 `set`(문서 교체)·`placeholder` 추가, `WebViewToRnMessage`의 change에 `chars` 동반·state에 `chars` 선택 필드. 체인 실행 헬퍼 `applyEditorFormat`/`applyEditorCommand`(구조 타이핑) 추가.
- **AC-4** — 웹: `useEditorState` selector 1개로 formats·canUndo·canRedo·chars 관측. 네이티브: stateRef 단일 출처 + `emitState`(조인 키 diff), change마다 chars만 패치. 번들: `lastStateKey`(서식·undo/redo만) 디듀프 + change에 chars 동반 — 키 입력마다 chars 최신, 추가 메시지 0건.
- **AC-5** — 데스크톱 `App.tsx`: tiptap 직접 import 제거·`MarkdownEditor`(`toolbar={false}`)·ref 3종(setMarkdown·runFormat·runCommand) 소비. 모바일 `editor.tsx`: WebView 브리지 제거·`lib/editor-html.ts`·`lib/webview-compat.tsx`·`scripts/sync-editor-html.ts` 삭제.
- **AC-6** — 카탈로그 `editor` 항목(install: "npm")·`demos/editor-demos.tsx`·`loaders.ts` 등록. 문서: README 2종·llms.txt·components.md(«에디터 엔진» 절 신설)·install.md 2종(editor peer 블록)·AGENTS.md(구조 트리·검증 항목)·packages/unikit README·roadmap.
- **AC-7** — `/components/kitchen-sink` 페이지·참조(내비·command-search·랜딩·README·roadmap)·고아 섹션 6종+`command-sections.tsx`·죽은 코드 `demos/index.ts` 삭제. 정적 export에서 404/200 실측(§3).
- **AC-8 / AC-9** — 아래 §2·§3.

## 2. 기계 검증 (2026-11-15 실측)

| 명령 | 결과 |
|---|---|
| `bun run typecheck`(워크스페이스 전체) | exit 0(7패키지) |
| `bun run audit:design` | 10/10 검사 통과(exit 0) |
| `cd apps/web && bun run build`(`rm -rf .next out` 후) | exit 0 — editor 카탈로그 페이지·public/r 재생성 |
| `cd apps/desktop && bun run build` | exit 0 |
| `cd packages/unikit && bun run build:editor` | exit 0 — dist 452.76 kB(gzip 143.19 kB)·editor-html.ts 441.4 KiB |

G4 확정 결함 6건(§5) 수정 후 위 전부 재실행 — 동일 통과.

## 3. 화면 검증 (G4 실측, 직접 목격)

데스크톱(vite preview 4173 — §5 F-B 수정 반영 재빌드분):
- 환영 문서 로드(«121자»·h1·굵게·목록·인용 5블록).
- 입력: 본문 클릭 → «회귀점검» 타이핑 → 125자·«저장되지 않은 변경» 표시.
- 굵게: 토글 후 «굵게» 타이핑 → `<strong>굵게</strong>`·버튼 pressed=true·127자.
- undo 2회 → 121자 복원·pressed 해제·redo enabled.
- 다크 전환 → `html.dark` 적용 확인.

에뮬레이터(emulator-5556 — §5 F-A 수정 후 Metro 리번들, APK 불변. 스크린샷은 이 에뮬레이터에서 WebView 서피스를 담지 않아(§6 F-H) a11y 스냅샷·로그·감사자 라이브 재검증이 근거):
- 앱 재실행 → 새 문서 → 본문 탭+입력 «에뮬 재검증 본문» → **크래시 없음**(pid 유지 — 수정 직전 빌드는 동일 조작에서 SIGABRT 3회 재현).
- 굵게+입력 → 토글 후 입력 반영(a11y 텍스트 필드 «에뮬 재검증 본문굵게») — 굵은 스트로크 픽셀 실증은 감사자 라이브 재검증(«보통글자» 대비 «굵은글자» 확대 획, 라이트·다크 모두).
- undo 2회 → 되돌리기 비활성·다시 실행 활성(a11y 버튼 상태) — 빈 문서 placeholder 렌더 실증은 감사자 라이브 재검증(«여기에 마크다운으로 적어 봐» 잉크 6,783px).
- 다크: 목록 «라이트» 버튼 전환 확인 → WebView 다크 동기화·아이콘 가시는 감사자 라이브 재검증(평균 RGB≈12,12,14). 빈 문서 «문서 1 (빈 문서)» 자동 저장은 a11y 목록 항목으로 확인.
- 툴바 a11y 트리: 버튼 11개 라벨 정상(F-G 수정 후 ￼ 노드 0건 — 수정 전 9건).

웹 카탈로그(정적 export 4174, `/components/editor` — headless chromium 캡처):
- npm 전용 안내 배너·MarkdownEditor 라이브 데모(placeholder 표시)·Props/API 문서·설치 스니펫 렌더.

kitchen-sink 폐지(정적 export 서빙 실측): `/components/kitchen-sink` 404·`/components` 200·`/r/registry.json` 200.

## 4. 조사 기록

- **dataDetectorTypes 크래시(F-A 원인)** — 본문 탭+입력 시 SIGABRT 3회 재현. `logcat -b crash`의 어셈블리 스택(castValue → `RNCWebViewDataDetectorTypesMaskWrapped convertRawProp` → RNCWebViewProps 갱신 생성자)과 react-native-webview 14.0.1 Fabric 코드젠 소스 대조로 확정: 코드젠이 `dataDetectorTypes`를 `std::vector<std::string>`(Props.h)로만 파싱하는데 문자열 `"none"`을 전달해 `RawValue` 어설션(value.isObject()) 실패. 수정은 배열 전달(§5).
- **Tauri `ask()` 브라우저 한계** — dirty 상태에서 새 문서가 무반응인 것은 브라우저(preview)에서 Tauri 대화상자가 동작하지 않는 기존 한계(HEAD 빌드 동일 — 회귀 아님). 문서 교체(`set`) 검증은 재로드로 깨끗한 상태를 만들어 수행했다.
- **placeholder 동적 교체의 실물 소비 부재** — 데스크톱·모바일·웹 데모 모두 기본값만 사용(실측 grep). prop 교체 경로는 웹(함수형 Placeholder + 빈 트랜잭션 dispatch)·네이티브(placeholder 메시지 + 빈 트랜잭션) 같은 «문서 보존» 계약의 코드·타입 검증으로 남는다.

## 5. G4 독립 리뷰 결과 (증거 기반 트리아지)

리뷰어: 코드/아키텍처 1 + UI/UX 실측 감사 1(클린 컨텍스트 — 원 요청·diff·게이트 출력·스크린샷만 전달). 경로:줄·렌더 근거 없는 의견과 취향(P3)은 기각했다.

### 확정·수정 (F-A~F-F, 6건)

- **F-A(P1 — 에뮬레이터 자체 실측) 네이티브 입력 크래시** — §4 원인대로 `dataDetectorTypes={["none"]}`으로 수정(타입은 `DataDetectorTypes | DataDetectorTypes[]` 호환). 에뮬레이터 재검증 통과(§3).
- **F-B(P2 — 리뷰어) 웹 placeholder 교체 시 문서 리셋** — `useEditor(options, [placeholder])`가 placeholder 교체마다 에디터를 재생성해 편집 중 문서를 initialMarkdown으로 유실. 수정: 함수형 `Placeholder.configure({ placeholder: () => ref.current })` + placeholderRef + 빈 트랜잭션 dispatch useEffect. 데스크톱 회귀 점검 통과(§3).
- **F-C(P3 — 리뷰어) 네이티브 placeholder prop 무시** — ref 재할당 부재·WebView 전달 메시지 부재. 수정: 렌더마다 재할당 + `placeholder` 메시지 useEffect(번들 핸들러·init 전달 포함, 문서 보존 계약).
- **F-D(P3) AGENTS.md 구조·검증 안내 부재** — 저장소 구조 트리에 `src/editor/`·`editor-web-view/` 행, 배럴 표기 «chart·editor는 제외», 검증 항목에 `build:editor` 재생성 절차 추가.
- **F-E(P3) 죽은 코드 `demos/index.ts`** — eager `demos` 레코드의 소비자 0건(페이지 2곳은 loaders.ts만 사용). 삭제.
- **F-F(P3) 주석 부정확** — native.tsx 머리 주석의 «markdownRef·charsRef»(charsRef 미존재 → stateRef의 chars로 정정), editor-toolbar 머리 주석에 브리지 확장(set·placeholder·chars) 기록 보강.

### 기각·우회 기록

- Tauri `ask()` 브라우저 무반응 — HEAD 동일, 데스크톱 패키징 전용 기존 한계(§4).
- placeholder 동적 교체 실물 검증 — 소비처 없음, 계약 검증으로 대체(§4).

## 6. UI/UX 감사 결과 (클린 컨텍스트 스폰)

감사자는 제출 스크린샷 7장을 로컬 픽셀 측정으로 검증하고, 모바일 증거가 무효였던 5건은 에뮬레이터에서 앱을 직접 구동해 a11y 입력·픽셀 비교로 재수집했다(에이전트 100도구·26분). 라이브 재검증으로 확정된 사실: 타이핑 반영(잉크 3,622px 증가)·undo/redo 상태 기계(undo 1회에 다시 실행 활성+본문 원복·redo 복원)·굵게 픽셀(«보통글자» 대비 확실히 굵은 «굵은글자» — 라이트·다크 모두)·placeholder 실렌더(잉크 6,783px)·다크 전환(평균 RGB≈12,12,14)·툴바 2행 랩·저장 직렬화(«보통글자**굵은글자**» 마크다운)·키보드 inset(manifest adjustResize + KeyboardAvoidingView 코드 근거).

### 채택·수정 (F-G)

- **F-G(P2 — 감사자 발견, 원인 재규명 후 수정) 툴바 ￼(U+FFFC) 접근성 노이즈** — 감사자는 아이콘 래퍼 은닉을 제안했으나, a11y 트리 구조 실측에서 ￼의 실체는 브리지 아이콘이 아니라 `toggle.tsx`가 모든 children을 감싸는 내부 `Text`였다(아이콘 뷰가 Text 안에 들어가 객체 치환 문자 텍스트 노드로 노출 — 아이콘 없이 문자 children만 쓰는 되돌리기·다시 실행 Button에는 ￼가 없었음). 수정: 문자·숫자 children만 Text 래핑 대상으로 좁히고 뷰 children은 Text 밖에 둔다(src↔registry 양쪽). 재검증: 에뮬레이터 에디터 화면 ￼ 9건 → 0건(노드 75→66, 버튼 11개 라벨·svgview 구조는 그대로), 웹은 하이드레이션 DOM에서 굵게·되돌리기 데모 버튼 렌더 확인. 게이트 재통과(typecheck·audit:design 10/10·web/desktop 빌드).
- 감사자가 제안한 «아이콘 래퍼 accessible=false»는 원인 부재로 적용하지 않았다(브리지 편집 1회 시도 후 원복 — 효과 관찰 불가·원인 오진 명세 방지).

### 채택 — 증거 절차 결함 (F-H, 구현 결함 아님)

- **F-H(P1 — 감사자 발견, 교차 확인 채택) 제출 모바일 스크린샷 5장 무효** — 오케스트레이터 로컬 재측정으로 교차 확인: `emul-bold-crop.png`·`emul-undo-crop.png`는 고유색 1(전면 백색), `emul-bold.png`는 툴바 영역(y=280..680 잉크 0.36%) 아래 전 구간 임계값 미만 잉크 0. 원인 2중: ① agent-device CLI `screenshot`이 이 에뮬레이터에서 WebView 하드웨어 서피스를 담지 않는다(RN 크롬만 캡처) ② 파일 열람(Read→CDN 왕복)이 디스크와 다른 내용을 반환했다 — 작성자가 «본문 텍스트·placeholder 목격»으로 기록한 것은 CDN 캐시의 유령(사이클 94 «같은 CDN 캐시 반화»의 재발이며, 이번엔 같은 바이트를 두 번 읽어 첫 회만 유령을 반환하는 변형까지 확인). 조치: §3의 모바일 스크린샷 근거를 무효로 정정하고, 실증은 ①a11y 스냅샷(실시간 상태 — 텍스트 필드 내용·버튼 활성 상태 기계) ②Metro 로그 ③감사자의 라이브 재검증(픽셀 측정) 3원으로 대체한다. WebView 영역 스크린샷 증거가 필요한 후속 작업은 캡처 경로를 검증한 뒤 사용한다.

### 기각·기록 (감사자 재확인 포함)

- 데스크톱 본문 비대칭 — 실측 x=280..645로 max-w-3xl 중앙 정렬과 정확히 일치(착시).
- 웹 데모 스켈레폰 상주 — loadDemo 캐싱 + Skeleton 로딩 + destructive 에러 배너(component-doc.tsx 148~173)로 정상 상태 처리.
- 설치 코드 잘림 — pre에 overflow-x-auto(docs-shell.tsx 418).
- 카탈로그 «워지원» 오탈자 — 원본 소스에 없음(감사자 열람 환경 유령).
- 툴바 ghost/outline 혼용 — 커맨드(ghost Button)와 토글(outline ToggleGroup)의 의도적 구분(editor-toolbar.tsx).
- P3 비재현 이상(타이핑 직후 undo/redo 모두 비활성 1회 관찰) — 감사자가 제어 재시험에서 재현 실패로 계측 아티팩트로 자체 판정·제외. 기록만 남긴다.

### BLOCKED (관측 도구 없음)

- WebView 초기 로드 화이트 플래시 유무 — 정지 이미지·a11y로 판정 불가(녹화 도구 미운용).
- 실기기(폰) 입력 지연·성능, iOS 동작 — 에뮬레이터 Android 1대만 사용.

