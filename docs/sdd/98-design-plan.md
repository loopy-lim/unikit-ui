# 사이클 95 설계·계획 — editor 진입점과 kitchen-sink 폐지

- 전제: [97-requirements.md](97-requirements.md) (AC-1~9).
- 설계 기준: chart 진입점(`src/chart` — web.tsx·native.tsx·types.ts + exports 조건)이 Golden Example. 계약의 단일 출처는 `src/components/editor-toolbar.tsx`(사이클 94 확립).

## 1. 아키텍처 결정

### 1.1 엔진 소유권 이동 (chart 선례 확장)

```
packages/unikit/package.json exports:
  "./editor": { "react-native": "./src/editor/native.tsx", "default": "./src/editor/web.tsx" }
```

- `src/editor/types.ts` — 공개 계약(MarkdownEditorProps·MarkdownEditorHandle·MarkdownEditorState). EditorFormat·EditorCommand·브리지 메시지는 editor-toolbar.tsx에서 재수출 없이 import(단일 출처).
- `src/editor/web.tsx` — tiptap 직접 마운트. `useEditor(options, [placeholder])`로 placeholder 교체 시 재생성, `useEditorState` 단일 selector({formats, canUndo, canRedo, chars} — circularDeepEqual 기본). `setMarkdown`은 `setContent(emitUpdate:false)` + `EditorState.create` 히스토리 초기화. `editor-prose.css`를 웹 렌더러가 import(소비자 별도 import 불필요).
- `src/editor/native.tsx` — WebView 브리지. apps/mobile의 webview-compat 흡수(WebViewHandle 타입 단언 래퍼), stateRef 단일 출처 + patchState(가드된 setStates) + emitState(조인 키 디듀프), ready 시 init 전송, change→onChange, 크래시 시 reload, WebView 보안 props 일괄 유지.
- `src/editor/colors.ts` — `editorBackground(colorScheme)` 값 성형(`hsl(${tokens})` 템플릿). audit (b) 원색 검사의 값 정의 지점으로 제외(VALUE_SOURCES와 같은 사정).
- `src/editor/editor-html.ts` — 생성물(sync-editor-html.ts가 dist/index.html 인라인 — 직접 편집 금지, audit 제외).

### 1.2 번들 원본 이전

`apps/mobile/web-editor` → `packages/unikit/editor-web-view`(git mv, 패키지명 @unikit/editor-web-view). 루트 package.json workspaces에 명시 등록. main.ts 확장: set 메시지 핸들러(replaceDoc+sendState), init placeholder(함수형 Placeholder — 교체 시 replaceDoc으로 장식 재생성), change/state에 chars 동반. apps/mobile의 lib/editor-html.ts·lib/webview-compat.tsx·scripts/sync-editor-html.ts는 git rm(패키지로 흡수), build:editor는 패키지 명령의 alias로.

### 1.3 npm 전용 — registry 미등록

엔진 HTML 번들은 빌드 산출물이라 shadcn registry 소스 복사로 배포 불가. registry.json은 그대로 71 아이템(chart는 등록+배럴 제외이었던 것과 달리 editor는 미등록). 웹 카탈로그는 `install?: "registry" | "npm"` 필드로 분기 — npm 모드 설치 스니펫(`bun add @unikit-bridge/ui @tiptap/* …` + react-native-webview 안내)·"npm 전용" 배지·Registry JSON 링크 생략.

### 1.4 chars 계약 (성능 유지)

- change(키 입력마다 기존 전송)에 chars를 얹음 — 추가 트래픽 0건.
- state 디듀프 키는 chars 제외(서식·undo 변화 시만 RN 리렌더).
- set 문서 교체 시 번들 핸들러가 sendState를 항상 전송형으로 호출 — state에 chars 선택 필드로 실어 동기화.

## 2. 수정 파일

| 영역 | 파일 |
|---|---|
| 패키지 | `src/editor/{types,web,native,colors}.ts(x)` 신규·`editor-web-view/*` 이전·`package.json`(exports·script·peer·devDeps)·`scripts/sync-editor-html.ts` 신규·`scripts/audit-design.ts`(제외 목록)·`src/components/editor-toolbar.tsx` + `registry/ui/editor-toolbar.tsx`(프로토콜 확장·양쪽 동일) |
| 앱 | `apps/mobile/app/editor.tsx`(MarkdownEditor 소비로 재작성)·lib 2종·script git rm·`package.json` alias·`apps/desktop/src/App.tsx`(tiptap 직접 import 제거·이관) |
| 웹 데모 | `components/showcase/catalog.ts`(install 필드)·`demos/editor-demos.tsx` 신규·`docs-shell.tsx`(InstallSnippet 분기)·`app/components/[name]/component-doc.tsx`(npm 전용 표기)·`package.json`(tiptap 의존)·kitchen-sink 폐지(page.tsx·참조·고아 섹션 6종) |
| 루트·문서 | `package.json`(workspaces)·`README.md`·`README.ko.md`·`llms.txt`·`docs/components.md`·`docs/install.md`·`AGENTS.md`·`packages/unikit/README.md`·`docs/roadmap-components.md` |

## 3. 검증 계획 (G3 하드 게이트)

- 루트 `bun run typecheck`(워크스페이스 전체) exit 0.
- 루트 `bun run audit:design` 10/10 PASS((b) 제외 목록에 colors.ts·editor-html.ts 추가 후).
- `apps/web bun run build`(에디터 페이지 포함 export) exit 0 — kitchen-sink 폐지 후 stale .next 제거 주의.
- `apps/desktop bun run build` exit 0.
- `packages/unikit bun run build:editor` exit 0(editor-html.ts 재생성).

## 4. 화면 검증 계획 (G4)

- 데스크톱: `cd apps/desktop && bun x vite preview` 후 브라우저 — 편집·툴바·chars·저장(제목 변경 포함).
- 모바일: emulator-5554 — build:editor → gradle 분리 빌드·설치 → Metro 8083 + adb reverse. 편집·서식 토글·저장 확인(직접 목격, 미묘한 상태는 픽셀 측정).
- G4 독립 리뷰: Code & Architecture Reviewer + UI/UX & Visual Auditor 클린 컨텍스트 병렬 스폰(원 요청·diff·게이트 출력만 전달).
