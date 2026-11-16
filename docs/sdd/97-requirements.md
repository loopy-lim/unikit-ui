# 사이클 95 요구 — `@unikit-bridge/ui/editor` 진입점과 kitchen-sink 폐지

- 원 요청(해석 없음): «https://ui.ll3.kr/components/kitchen-sink이건 지우자. 그리고 tiptap도 된다고 어떻게 설득 못하는거야? rn에서 native로 하는거지? 100%는 아니더라도 어느정도 지원되도록 하는게 좋을거 같아서.»
- 방향 확정(G2 대화, AskUserQuestion 2회): ① «editor 진입점 추가» — chart 선례의 exports 조건 분기를 따라 `@unikit-bridge/ui/editor` 진입점으로 엔진을 패키지가 제공. ② «데스크톱도 함께» — 데스크톱 도그푸딩 앱도 이번 사이클에 MarkdownEditor로 이관.
- 사실 정정(원 요청 전제): tiptap(ProseMirror)은 DOM 전용이라 RN 네이티브 뷰로 직접 렌더하는 방법은 없음. 네이티브에서의 지원 경로는 WebView + 단일 파일 HTML + JSON 브리지가 유일하며(10tap 등 상용 에디터와 동일), 이 경로를 라이브러리가 통째로 제공하는 것이 «부분 지원»의 실체.
- 기준 리비전: d52f4dd(main, 사이클 94 푸시분) 위에서 작업.
- 조사: 2026-11-15, 오케스트레이터(전 파일 직독·grep 실측).

## 과제 1 — kitchen-sink 페이지 폐지

- `/components/kitchen-sink` 페이지와 참조(내비 2곳·command-search BLOCK_ITEMS·랜딩 CTA·README 표 2곳·roadmap) 제거. 카탈로그(`/components`)가 역할을 대신함.
- 고아가 되는 섹션 파일 6종(chart-section·command-sections·form-sections·layout-sections·message-sections·overlay-sections.tsx) 삭제 — `demos/`·`section.tsx`는 카탈로그가 사용하므로 유지.

## 과제 2 — editor 진입점 (마크다운 위지윅 엔진)

사이클 94는 «스킨+계약만 패키지, 엔진은 앱 소유»로 절충했음(94-requirements §4). 이번 사이클은 그 절충을 한 단계 진행시켜 엔진 소유권을 패키지로 옮겨요.

- **배치**: `packages/unikit/src/editor/`(web.tsx·native.tsx·types.ts·colors.ts) — `./editor` exports 진입점(`react-native` → native, `default` → web). 배럴·registry 미등록(npm 전용 — 엔진 HTML 번들은 빌드 산출물이라 소스 복사 배포 불가).
- **웹**: tiptap v3 직접 마운트(`@tiptap/react`·`starter-kit`·`markdown`·`extensions`·`pm` 선택 peer). `editor-prose.css` 자동 import.
- **네이티브**: `react-native-webview`(선택 peer)에 동봉 번들 로드. 번들 원본은 `apps/mobile/web-editor` → `packages/unikit/editor-web-view`로 이전(git mv)하고 `build:editor`(editor-web-view 빌드 → dist/index.html을 src/editor/editor-html.ts로 인라인)을 패키지 스크립트로.
- **계약 확장**(editor-toolbar.tsx 단일 출처 유지): `RnToWebViewMessage`에 `set`(문서 교체), init에 `placeholder`, `WebViewToRnMessage` change에 `chars` 동반·state에 `chars` 선택 필드.
- **API**: `MarkdownEditor`(props: initialMarkdown·onChange(markdown)·onStateChange(ready·formats·canUndo·canRedo·chars)·placeholder·toolbar 기본 true·className; ref: setMarkdown·runFormat·runCommand).
- **도그푸딩 이관**: 모바일·데스크톱 앱 모두 자체 브리지 코드를 걷어내고 MarkdownEditor(`toolbar={false}`) 소비로 전환 — 앱은 저장·제목·insets만 소유.

## 승인 기준 (AC)

- **AC-1** — `@unikit-bridge/ui/editor` 진입점이 exports 조건으로 웹(tiptap 직접)·네이티브(WebView+동봉 번들)를 분기하고, 배럴(`src/index.ts`)과 `registry.json`에는 등록되지 않는다(npm 전용).
- **AC-2** — 메인 배럴 소비자의 의존 그래프에 tiptap·webview가 새로 들어가지 않는다(전부 선택 peerDependencies — editor 진입점 미사용 시 설치·번들 영향 0).
- **AC-3** — 프로토콜 확장(`set`·`placeholder`·`chars`)이 editor-toolbar 단일 출처에서 이뤄지고 src↔registry 두 트리가 동일하다.
- **AC-4** — 성능 계약 유지: change는 키 입력마다(markdown+chars 동반), state는 서식·undo/redo 변화 시만(디듀프 키에 chars 미포함). 글자 수가 추가 메시지 없이 매 입력 최신값을 유지한다.
- **AC-5** — 두 도그푸딩 앱이 MarkdownEditor로 이관되어 앱쪽 WebView 브리지 코드·tiptap 직접 import가 제거된다(데스크톱 헤더 툴바·chars 표시는 로컬 상태로 존치).
- **AC-6** — 웹 쇼케이스 카탈로그에 editor 항목(npm 전용 표기·설치 스니펫 분기)이 추가되고, 문서(README·llms.txt·components.md·install.md·AGENTS.md)에 진입점·peer·구조가 반영된다.
- **AC-7** — `/components/kitchen-sink` 페이지·참조·고아 섹션이 제거되고 웹 빌드가 통과한다.
- **AC-8** — 기계적 검증 통과: 루트 `bun run typecheck`(워크스페이스 전체)·`bun run audit:design`·`apps/web bun run build`·`apps/desktop bun run build`·`packages/unikit bun run build:editor` 전부 exit 0.
- **AC-9** — 화면 검증: 데스크톱(vite preview)과 안드로이드 에뮬레이터(emulator-5554)에서 편집·툴바·저장 동작 확인.
