/*
 * WebView 안에서 도는 tiptap 에디터 — RN(apps/mobile/app/editor.tsx)과 JSON 브리지로 통신.
 * 프로토콜·포맷 계약의 원본은 @unikit-bridge/ui의 editor-toolbar(modules)이고,
 * 이 파일의 타입·검사 테이블은 독립 번들을 위한 의도적 복제다(vite 단일 HTML —
 * 패키지 배럴을 끌어오면 react까지 번들에 들어온다).
 * 본문 타이포그래피는 패키지 editor-prose.css를 그대로 쓴다(아래 import).
 */
import "@unikit-bridge/ui/editor-prose.css";
import { Editor } from "@tiptap/core";
import { EditorState } from "@tiptap/pm/state";
import { Placeholder } from "@tiptap/extensions";
import { Markdown } from "@tiptap/markdown";
import StarterKit from "@tiptap/starter-kit";

type RnToWebViewMessage =
  | { type: "init"; markdown: string; dark: boolean }
  | { type: "theme"; dark: boolean }
  | { type: "format"; format: string }
  | { type: "command"; command: "undo" | "redo" };

type WebViewToRnMessage =
  | { type: "ready" }
  | { type: "change"; markdown: string }
  | { type: "state"; formats: string[]; canUndo: boolean; canRedo: boolean };

declare global {
  interface Window {
    ReactNativeWebView?: { postMessage(data: string): void };
    __mdReceive?: (raw: string) => void;
  }
}

const post = (msg: WebViewToRnMessage) => {
  window.ReactNativeWebView?.postMessage(JSON.stringify(msg));
};

const editor = new Editor({
  element: document.getElementById("editor")!,
  // placeholder는 Placeholder 확장의 옵션으로 지정해야 반영된다 —
  // editorProps의 data-placeholder 속성은 확장 기본값("Write something …")에 덮어씌워진다.
  extensions: [
    StarterKit.configure({
      link: {
        openOnClick: false,
        markdownLinks: true,
      },
    }),
    Markdown,
    Placeholder.configure({ placeholder: "여기에 마크다운으로 적어 봐" }),
  ],
  content: "",
});

const FORMAT_CHECKS: [string, () => boolean][] = [
  ["bold", () => editor.isActive("bold")],
  ["italic", () => editor.isActive("italic")],
  ["strike", () => editor.isActive("strike")],
  ["h1", () => editor.isActive("heading", { level: 1 })],
  ["h2", () => editor.isActive("heading", { level: 2 })],
  ["bulletList", () => editor.isActive("bulletList")],
  ["orderedList", () => editor.isActive("orderedList")],
  ["quote", () => editor.isActive("blockquote")],
  ["code", () => editor.isActive("codeBlock")],
];

const stateFormats = () =>
  FORMAT_CHECKS.filter(([, on]) => on()).map(([name]) => name);

let lastStateKey: string | null = null;
const buildStateSnapshot = () => {
  const formats = stateFormats();
  const canUndo = editor.can().undo();
  const canRedo = editor.can().redo();
  const key = `${formats.join(",")}|${Number(canUndo)}|${Number(canRedo)}`;
  return { formats, canUndo, canRedo, key };
};

const sendState = () => {
  const { formats, canUndo, canRedo, key } = buildStateSnapshot();
  lastStateKey = key;
  post({ type: "state", formats, canUndo, canRedo });
};

// state는 활성 서식이나 undo/redo 가능 여부가 바뀔 때만 보낸다 — 매 transaction마다
// 보내면 키 입력 하나하나가 RN 리렌더를 일으킨다(사이클 94 성능 개선).
const sendStateIfChanged = () => {
  const { formats, canUndo, canRedo, key } = buildStateSnapshot();
  if (key === lastStateKey) return;
  lastStateKey = key;
  post({ type: "state", formats, canUndo, canRedo });
};

// change는 디바운스 없이 즉시 보낸다 — RN 쪽 저장 디바운스(500ms)가 있고,
// 웹 쪽 지연 큐는 뒤로 가기(WebView 파괴) 시 마지막 입력 유실 창을 만든다.
editor.on("update", () => {
  post({ type: "change", markdown: editor.getMarkdown() });
});
editor.on("transaction", sendStateIfChanged);

const runFormat = (format: string) => {
  const chain = editor.chain().focus();
  switch (format) {
    case "bold":
      chain.toggleBold().run();
      break;
    case "italic":
      chain.toggleItalic().run();
      break;
    case "strike":
      chain.toggleStrike().run();
      break;
    case "h1":
      chain.toggleHeading({ level: 1 }).run();
      break;
    case "h2":
      chain.toggleHeading({ level: 2 }).run();
      break;
    case "bulletList":
      chain.toggleBulletList().run();
      break;
    case "orderedList":
      chain.toggleOrderedList().run();
      break;
    case "quote":
      chain.toggleBlockquote().run();
      break;
    case "code":
      chain.toggleCodeBlock().run();
      break;
  }
};

const runCommand = (command: "undo" | "redo") => {
  const chain = editor.chain().focus();
  if (command === "undo") chain.undo().run();
  else chain.redo().run();
};

// 문서 교체 직후 undo 히스토리 초기화 — setContent가 한 단계로 기록되어
// 첫 undo가 불러오기 이전의 빈 문서로 되돌리는 것(오토세이브 유실)을 막는다.
const replaceDoc = (markdown: string) => {
  editor.commands.setContent(markdown, { contentType: "markdown", emitUpdate: false });
  editor.view.updateState(
    EditorState.create({ doc: editor.state.doc, plugins: editor.state.plugins }),
  );
};

const applyTheme = (dark: boolean) => {
  document.documentElement.classList.toggle("dark", dark);
};

let initialized = false;
window.__mdReceive = (raw: string) => {
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return;
  }
  if (!parsed || typeof parsed !== "object") return;
  const msg = parsed as Partial<RnToWebViewMessage>;
  try {
    switch (msg.type) {
      case "init":
        if (typeof msg.dark !== "boolean") return;
        initialized = true;
        applyTheme(msg.dark);
        if (typeof msg.markdown === "string" && (msg.markdown.length > 0 || !editor.isEmpty)) {
          replaceDoc(msg.markdown);
        }
        sendState();
        break;
      case "theme":
        if (typeof msg.dark === "boolean") {
          applyTheme(msg.dark);
        }
        break;
      case "format":
        if (initialized && typeof msg.format === "string") {
          runFormat(msg.format);
        }
        break;
      case "command":
        if (initialized && (msg.command === "undo" || msg.command === "redo")) {
          runCommand(msg.command);
        }
        break;
    }
  } catch {
    // 잘못된 마크다운이나 명령 예외가 에디터 브리지를 망가뜨리지 않도록 차단한다.
  }
};

post({ type: "ready" });
