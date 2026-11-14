/*
 * WebView 안에서 도는 tiptap 에디터 — RN(apps/mobile/app/editor.tsx)과 JSON 브리지로 통신.
 * 프로토콜은 apps/mobile/lib/protocol.ts와 한 쌍이다(의도적 복제 — 번들을 나눈다).
 */
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
  | { type: "state"; formats: string[] };

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
    StarterKit,
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

const sendState = () => {
  post({ type: "state", formats: FORMAT_CHECKS.filter(([, on]) => on()).map(([name]) => name) });
};

// change는 디바운스 없이 즉시 보낸다 — RN 쪽 저장 디바운스(500ms)가 있고,
// 웹 쪽 지연 큐는 뒤로 가기(WebView 파괴) 시 마지막 입력 유실 창을 만든다.
editor.on("update", () => {
  post({ type: "change", markdown: editor.getMarkdown() });
});
editor.on("transaction", sendState);

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
  editor.commands.setContent(markdown, { contentType: "markdown" });
  editor.view.updateState(
    EditorState.create({ doc: editor.state.doc, plugins: editor.state.plugins }),
  );
};

const applyTheme = (dark: boolean) => {
  document.documentElement.classList.toggle("dark", dark);
};

window.__mdReceive = (raw: string) => {
  const msg = JSON.parse(raw) as RnToWebViewMessage;
  switch (msg.type) {
    case "init":
      applyTheme(msg.dark);
      if (msg.markdown) {
        replaceDoc(msg.markdown);
      }
      sendState();
      break;
    case "theme":
      applyTheme(msg.dark);
      break;
    case "format":
      runFormat(msg.format);
      break;
    case "command":
      runCommand(msg.command);
      break;
  }
};

post({ type: "ready" });
