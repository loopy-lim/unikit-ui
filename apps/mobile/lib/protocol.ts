/*
 * RN ↔ WebView 에디터 브리지 프로토콜 — web-editor/src/main.ts와 한 쌍(의도적 복제).
 */

export const EDITOR_FORMATS = [
  "bold",
  "italic",
  "strike",
  "h1",
  "h2",
  "bulletList",
  "orderedList",
  "quote",
  "code",
] as const;

export type EditorFormat = (typeof EDITOR_FORMATS)[number];

/** 실행 취소·다시 실행 — 토글 상태가 없는 한 번 실행 커맨드. */
export type EditorCommand = "undo" | "redo";

export type RnToWebViewMessage =
  | { type: "init"; markdown: string; dark: boolean }
  | { type: "theme"; dark: boolean }
  | { type: "format"; format: EditorFormat }
  | { type: "command"; command: EditorCommand };

export type WebViewToRnMessage =
  | { type: "ready" }
  | { type: "change"; markdown: string }
  | { type: "state"; formats: string[] };
