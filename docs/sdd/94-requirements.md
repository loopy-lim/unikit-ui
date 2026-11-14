# 사이클 94 요구 — tiptap 에디터 스킨의 라이브러리 통합과 도그푸딩 앱 성능 개선

- 원 요청(해석 없음): «지금 문제점들이 볼 대애 tiptap을 여기에 녹이고 싶은데 그게 안되는거 같아. 특히 성능과 함께 디자인의 관점으로 모두 해서 반영하고 싶어. 도와줘.»
- 방향 확정(G2 대화): «스킨+훅만 패키지로» — 에디터 엔진(tiptap 인스턴스·WebView)은 앱이 소유하고, 보이는 층(툴바)·포맷 계약·본문 타이포그래피를 `@unikit-bridge/ui`에 녹인다. 완전한 에디터 컴포넌트(패키지가 WebView 번들까지 소유)는 기각 — 규모·의존 부담.
- 기준 리비전: 2e41be0(main, 작업 트리 clean) 위에서 작업.
- 조사: 2026-11-14, 오케스트레이터(전 파일 직독·grep 실측).

## 배경 실측 — 문제점

### 1. 성능 (데스크톱 apps/desktop/src/App.tsx)

- 키 입력(onUpdate)마다 `editor.getMarkdown()` 전체 직렬화를 글자수 계산에 사용 — 문서 전체 → 마크다운 직렬화가 매 키 입력마다 발생(`App.tsx:99-102`).
- `transaction` 이벤트마다 9종 `isActive` 검사 + `setFormats`(새 배열) — 활성 서식이 그대로여도 매 키 입력마다 헤더·툴바 전체 리렌더(`App.tsx:106-132`).
- tiptap 3.34의 `useEditorState`(선택 구독, `circularDeepEqual` 기본 — `node_modules/@tiptap/react/dist/index.js` 실측)가 이 리렌더를 제거하는 정석 수단.

### 2. 성능 (모바일 apps/mobile)

- WebView 안 tiptap이 `transaction`마다 `state` 메시지를 무조건 전송 — 키 입력마다 RN `setFormats` 리렌더 유발(`web-editor/src/main.ts:66`).
- RN 쪽도 매 `change`마다 `setSaveState("pending")` 재설정 — 이미 pending이어도 함수가 재실행돼 리렌더 후보가 계속 생김(`app/editor.tsx:91-95`).
- `change`(전체 markdown 직렬화 + 즉시 전송)는 **유지** — 뒤로 가기(WebView 파괴) 시 마지막 입력 유실을 피하려는 문서화된 설계 선택(`web-editor/src/main.ts:61-62` 주석).

### 3. 디자인 (중복·드리프트)

- tiptap 본문 타이포그래피 CSS가 두 곳에 중복인데 값이 이미 어긋남 — 데스크톱 `styles.css:106-199`(h1 1.875rem·p 여백 0.75em) vs 모바일 `web-editor/index.html:42-133`(h1 1.6rem·0.6em).
- 툴바 wiring(포맷 목록·isActive 매핑·ToggleGroup 값 diff 핸들러)이 세 곳에 중복(데스크톱 App.tsx·모바일 editor.tsx·web-editor main.ts).
- RN↔WebView 프로토콜 타입이 두 곳에 복제(`lib/protocol.ts` ↔ `web-editor/src/main.ts` — 번들 분리를 위한 의도적 복제라 주석은 있음).
- 본문 스타일이 디자인 시스템(토큰·레지스트리) 밖 — 소비자가 "UniKit 룩의 tiptap"을 재현할 방법이 없음.

### 4. 구조적 제약 — "라이브러리에 통째로 녹이기"가 안 되는 이유

ProseMirror는 DOM 전용이라 네이티브에서는 WebView여야만 해요. 에디터 엔진을 컴포넌트로 만들면 라이브러리가 tiptap+pm 의존(~200KB)과 WebView용 HTML 번들 제공까지 떠안게 돼요. `src/chart` 선례(엔진은 선택 peerDep·레이어만 패키지)가 절충 모델.

## 승인 기준 (AC)

- **AC-1** — `EditorToolbar`·`activeFormats`·프로토콜 타입이 `@unikit-bridge/ui` 배럴에서 export되고 tiptap 런타임 의존 0(peerDependencies 변화 없음)로 동작한다.
- **AC-2** — 본문 타이포그래피가 `src/lib/editor-prose.css` 단일 출처(시맨틱 토큰만)가 되고, 데스크톱·모바일 web-editor가 모두 이를 import해 두 앱의 `.tiptap` 규칙이 어긋나지 않는다.
- **AC-3** — 데스크톱에서 키 입력이 활성 서식·글자수 변화로 이어지지 않을 때 헤더·툴바 리렌더가 없다(useEditorState 선택 구독), 글자수 계산에 getMarkdown 직렬화를 쓰지 않는다.
- **AC-4** — 모바일에서 활성 서식이 그대로인 키 입력이 `state` 메시지를 발생시키지 않고, RN 쪽 `setSaveState`·`setFormats`가 같은 값 재설정으로 리렌더를 일으키지 않는다. `change` 즉시 전송 정책은 유지한다.
- **AC-5** — 두 도그푸딩 앱의 툴바가 패키지 `EditorToolbar`로 교체되어 앱쪽 중복 wiring이 제거된다(엔진 실행부 chain/메시지 전송은 앱 소유로 남는다).
- **AC-6** — registry에 `editor-toolbar`(registry:ui)·`editor-prose`(registry:style)가 등록되고, 웹 쇼케이스 카탈로그·데모가 갱신되며, 컴포넌트 62종·레지스트리 71 아이템 수치가 문서 전반에 정확히 반영된다.
- **AC-7** — 기계적 검증 통과: `bun run typecheck`·`bun run audit:design`·`apps/desktop bun run build`·`apps/mobile bun run build:editor`·`apps/web bun run build` 전부 exit 0.
- **AC-8** — 화면 검증: 데스크톱은 빌드 산출물 렌더로 툴바·본문 타이포그래피 확인, 모바일은 에뮬레이터(emulator-5554) 편집 화면 확인.
