# 사이클 94 설계·계획 — editor 스킨 키트와 앱 성능 개선

요구: [94-requirements.md](94-requirements.md). G2 대화로 확정한 방향 «스킨+훅만 패키지로»의 구현 설계.

## 1. 아키텍처 결정

### 1.1 엔진/스킨 분리 (chart 선례 준용)

```text
앱(엔진 소유)                         패키지(스킨·계약 소유)
──────────────────────────           ──────────────────────────────────────
desktop  tiptap useEditor 직접   ←→  EditorToolbar + activeFormats + 프로토콜 타입
mobile   WebView 안 tiptap 번들  ←→  (RN 쪽 import) + editor-prose.css
web-editor(독립 번들)           ←→  editor-prose.css만 import(타입·검사 테이블은
                                         번들 분리를 위해 의도적 복제 유지)
```

- 완전한 에디터 컴포넌트 기각 사유: 네이티브 감싸기가 WebView HTML 번들의 제공·주입을 패키지에 요구해 의존·애셋 부담이 chart보다 크고, shadcn 규격(src↔registry 복사)과도 안 맞음.
- `activeFormats`의 매개변수는 `isActive`만 구조 타이핑(`EditorFormatState`) — tiptap Editor가 구조적으로 만족하므로 패키지 peer 의존·번들 증가 0.

### 1.2 배치 — 컴포넌트 vs lib vs style

| 조각 | 위치 | 근거 |
|---|---|---|
| `EditorToolbar`·`activeFormats`·`EDITOR_FORMATS`·프로토콜 타입 | `src/components/editor-toolbar.tsx`(배럴 export·62번째) | ToggleGroup·Button·Separator 형제 import가 src↔registry 양 트리에서 같은 상대 경로로 성립(form.tsx→label 선례). lib에 두면 registry 사본의 소비자 경로가 어긋남 |
| 본문 타이포그래피 CSS | `src/lib/editor-prose.css` + exports `./editor-prose.css` | 시맨틱 토큰만 소비하는 애셋 — 앱은 `import` 한 줄로 받음. 값은 데스크톱 기준으로 통일(모바일 값과 어긋나던 부분 해소) |
| 레지스트리 | `editor-toolbar`(registry:ui, files 복사)·`editor-prose`(registry:style, css 객체 — animations 선례) | 71 아이템 = UI 62 + lib 3 + theme 4 + style 2 |

web-editor 번들은 배럴 import를 하지 않는다(react가 번들에 끌려 들어옴 — sideEffects 미선언 트리셰이킹 신뢰 불가). CSS subpath만 소비.

## 2. 성능 설계

| 대상 | 이전 | 이후 |
|---|---|---|
| desktop 글자수 | onUpdate마다 `getMarkdown().length` | `useEditorState` selector에서 `doc.textContent.length`(직렬화 없는 순회) |
| desktop 툴바 상태 | transaction 리스너 + setFormats(새 배열) | `useEditorState` selector — `activeFormats().join(",")` 문자열 + chars, `circularDeepEqual`로 변화 시만 리렌더 |
| mobile state 메시지 | transaction마다 무조건 post | 웹 쪽 `lastStateKey` diff — 활성 서식 변화 시만 post |
| mobile RN setState | 매 입력 setSaveState/setFormats | 함수형 같은 값 반환(React bail) — `"saved"→"pending"` 전이와 포맷 변화 시만 리렌더 |
| mobile change 전송 | 매 입력 즉시 전체 markdown | **유지**(뒤로 가기 유실 방지 — 문서화된 설계 선택, 94-req §2) |

## 3. 수정 파일

패키지: `src/components/editor-toolbar.tsx`(신규)·`src/lib/editor-prose.css`(신규)·`src/index.ts`·`package.json`(exports)·`registry/ui/editor-toolbar.tsx`(신규 사본)·`registry.json`·`scripts/audit-design.ts`(names 목록).
앱: desktop `src/App.tsx`·`src/main.tsx`·`src/styles.css`. mobile `web-editor/src/main.ts`·`web-editor/index.html`·`web-editor/package.json`·`app/editor.tsx`·`lib/protocol.ts`(삭제 — 패키지 타입으로 대체)·`lib/editor-html.ts`(재생성).
데모·문서: `apps/web/components/showcase/catalog.ts`·`demos/form-controls-demos.tsx`·`demos/index.ts`·README 3종·llms.txt·AGENTS.md·docs/components.md·docs/install 2종·docs/roadmap-components.md.

## 4. 검증 계획 (G3 하드 게이트)

- `bun run typecheck`(워크스페이스 전체) — isActive 구조 타이핑·useEditorState null editor 계약 확인.
- `bun run audit:design` — (c) 임의값 클래스·(d) registry 사본 동일·(e) files 실재가 신규 파일에 적용되는지.
- `cd apps/desktop && bun run build` — editor-prose.css가 dist CSS에 인라인되는지(grep .tiptap).
- `cd apps/mobile && bun run build:editor` — 재생성 번들에 prose 규칙·state diff(`lastStateKey` 축소형)가 들어가는지.
- `cd apps/web && bun run build` — 카탈로그 62페이지·`public/r/editor-*.json` 생성.

## 5. 화면 검증 계획 (G4)

- desktop: `vite preview` + 프리뷰 도구 스크린샷 — 툴바(새 EditorToolbar)·본문 타이포그래프(h1/목록/코드)·다크 전환.
- mobile: 에뮬레이터(emulator-5554) — 편집 화면(툴바·본문·서식 토글·저장 상태 표시).
- 관찰 도구 불능 시 해당 항목은 `BLOCKED`로 기록(N/A 금지).
