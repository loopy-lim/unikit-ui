# UniKit Markdown (데스크톱)

[`@unikit-bridge/ui`](../../packages/unikit)를 실제 소비하는 Tauri 2 도그푸딩 앱이에요. tiptap 위지윅 마크다운 편집기로, 열기·저장은 Tauri 플러그인(dialog·fs)으로 처리해요.

## 실행

```bash
bun install                  # 루트에서 (패키지 매니저는 bun만)
bun x vite preview           # 웹 UI만 확인 (빌드 산출 preview)
bun x tauri dev              # Tauri 창으로 실행 (Rust 필요)
bun run tauri build          # 데스크톱 패키징 (deb·rpm·AppImage)
```

## 구조

- `src/App.tsx` — 편집기 본체. `useEditor` + StarterKit·`@tiptap/markdown`(v3 공식)·Placeholder, `contentType: "markdown"`으로 마크다운을 직접 주고받아요. 서식 툴바는 ToggleGroup, 저장·열기는 Button·Dialog 토스트.
- `src/styles.css` — Tailwind v4 진입 + 유니킷 토큰(수동 수집: `generate:design`은 apps/web만 관리) + `.tiptap` 타이포그래피.
- `src-tauri/` — Rust 셸. plugin-dialog·plugin-fs 등록, capabilities는 `$HOME/**`·`$DOCUMENT/**` 읽기·쓰기로 한정.

## 도그푸딩 메모

- UniKit 웹 소비도 RN 스타일 계약(`onPress`·`onChangeText`)을 그대로 써요 — 브리지가 웹에서 button→onClick 등으로 치환해요.
- tiptap-markdown(3rd-party)은 v2 전용이라 v3에서는 공식 `@tiptap/markdown`을 써야 해요.
- 이 환경(Linux Wayland)에서 webkit2gtk GPU 컴포지팅이 깨져 창이 하얗게 나올 수 있어요 — `GDK_BACKEND=x11`로 실행하고, 그래도 비면 `WEBKIT_DISABLE_COMPOSITING_MODE=1`을 시도해 보세요. 웹 UI 자체는 `vite preview`로 검증 가능해요.
