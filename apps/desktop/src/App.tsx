import { useCallback, useEffect, useMemo, useState } from "react";
import type { Editor } from "@tiptap/core";
import { ask, open, save } from "@tauri-apps/plugin-dialog";
import { readTextFile, writeTextFile } from "@tauri-apps/plugin-fs";
import { Placeholder } from "@tiptap/extensions";
import { Markdown } from "@tiptap/markdown";
import { EditorState } from "@tiptap/pm/state";
import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import {
  Button,
  Input,
  Separator,
  Toaster,
  ToggleGroup,
  ToggleGroupItem,
  toast,
  useUnikitTheme,
} from "@unikit-bridge/ui";
import {
  BoldIcon,
  CodeIcon,
  Heading1Icon,
  Heading2Icon,
  ItalicIcon,
  ListIcon,
  ListOrderedIcon,
  Redo2Icon,
  StrikethroughIcon,
  TextQuoteIcon,
  Undo2Icon,
} from "@unikit-bridge/ui/primitives";

/*
 * UniKit Markdown(데스크톱) — @unikit-bridge/ui 도그푸딩 앱.
 * tiptap v3(ProseMirror) + @tiptap/markdown으로 위지윅 ↔ 마크다운을 왕복한다.
 */

const WELCOME = `# UniKit Markdown

**위지윅**으로 쓰고 마크다운으로 저장하는 데모 문서야.

## 지원 문법

- 굵게 · 기울임 · 취소선
- 목록(불릿 · 번호)과 인용
- \`인라인 코드\`와 코드 블록

> \`열기\`로 .md 파일을 불러오고 \`Ctrl+S\`로 저장해 봐.
`;

type Format =
  | "bold"
  | "italic"
  | "strike"
  | "h1"
  | "h2"
  | "bulletList"
  | "orderedList"
  | "quote"
  | "code";

// 툴바 두 그룹 — 글자 서식과 블록 서식을 구분자로 나눠 보여준다.
const TEXT_FORMATS: readonly Format[] = ["bold", "italic", "strike"];
const BLOCK_FORMATS: readonly Format[] = [
  "h1",
  "h2",
  "bulletList",
  "orderedList",
  "quote",
  "code",
];

// 문서 교체 직후 undo 히스토리 초기화 — setContent가 한 단계로 기록되어
// 첫 undo가 교체 이전 문서로 되돌리는 것을 막는다(모바일 web-editor와 같은 결함).
const replaceDoc = (editor: Editor, markdown: string) => {
  editor.commands.setContent(markdown, { contentType: "markdown" });
  editor.view.updateState(
    EditorState.create({ doc: editor.state.doc, plugins: editor.state.plugins }),
  );
};

function App() {
  const { colorScheme, toggleColorScheme } = useUnikitTheme();
  const [title, setTitle] = useState("제목 없음");
  const [filePath, setFilePath] = useState<string | null>(null);
  const [dirty, setDirty] = useState(false);
  const [charCount, setCharCount] = useState(WELCOME.length);
  const [formats, setFormats] = useState<Format[]>([]);

  const editor = useEditor({
    extensions: [
      StarterKit,
      Markdown,
      Placeholder.configure({ placeholder: "여기에 마크다운으로 적어 봐" }),
    ],
    content: WELCOME,
    contentType: "markdown",
    onUpdate: ({ editor }) => {
      setDirty(true);
      setCharCount(editor.getMarkdown().length);
    },
  });

  // 활성 포맷 동기화 — 커서/선택이 바뀔 때마다 재계산한다.
  useEffect(() => {
    if (!editor) return;
    const sync = () => {
      setFormats(
        (
          [
            ["bold", editor.isActive("bold")],
            ["italic", editor.isActive("italic")],
            ["strike", editor.isActive("strike")],
            ["h1", editor.isActive("heading", { level: 1 })],
            ["h2", editor.isActive("heading", { level: 2 })],
            ["bulletList", editor.isActive("bulletList")],
            ["orderedList", editor.isActive("orderedList")],
            ["quote", editor.isActive("blockquote")],
            ["code", editor.isActive("codeBlock")],
          ] as const
        )
          .filter(([, on]) => on)
          .map(([name]) => name as Format),
      );
    };
    editor.on("transaction", sync);
    sync();
    return () => {
      editor.off("transaction", sync);
    };
  }, [editor]);

  const runFormat = useCallback(
    (format: Format) => {
      if (!editor) return;
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
    },
    [editor],
  );

  // multiple 그룹의 value diff — 한 번 눌린 항목만 커맨드로 실행한다.
  // 그룹별 핸들러: members 안에서만 diff를 본다(두 ToggleGroup이 같은 formats 상태를 나눠 쓴다).
  const handleFormatsChange = useCallback(
    (members: readonly Format[]) => (next: string[]) => {
      const current: string[] = formats.filter((v) => members.includes(v));
      const added = next.find((v) => !current.includes(v));
      const removed = current.find((v) => !next.includes(v));
      const changed = (added ?? removed) as Format | undefined;
      if (changed) runFormat(changed);
    },
    [formats, runFormat],
  );

  const undo = useCallback(() => {
    editor?.chain().focus().undo().run();
  }, [editor]);

  const redo = useCallback(() => {
    editor?.chain().focus().redo().run();
  }, [editor]);

  const saveDocument = useCallback(async () => {
    if (!editor) return;
    let path = filePath;
    try {
      if (!path) {
        path = await save({
          title: "마크다운 문서 저장",
          defaultPath: `${title || "제목 없음"}.md`,
          filters: [{ name: "Markdown", extensions: ["md", "markdown"] }],
        });
        if (!path) return;
      }
      await writeTextFile(path, editor.getMarkdown());
      setFilePath(path);
      setDirty(false);
      toast.success(`저장했어: ${path.split("/").pop() ?? path}`);
    } catch (err) {
      toast.error(`저장에 실패했어: ${String(err)}`);
    }
  }, [editor, filePath, title]);

  const openDocument = useCallback(async () => {
    if (!editor) return;
    if (dirty) {
      const proceed = await ask(
        "저장하지 않은 변경이 있어. 저장하지 않고 불러올까?",
        { title: "확인", kind: "warning" },
      );
      if (!proceed) return;
    }
    try {
      const path = await open({
        title: "마크다운 문서 열기",
        multiple: false,
        filters: [{ name: "Markdown", extensions: ["md", "markdown"] }],
      });
      if (!path) return;
      const text = await readTextFile(path);
      replaceDoc(editor, text);
      const name = path.split("/").pop() ?? path;
      setTitle(name.replace(/\.(md|markdown)$/i, ""));
      setFilePath(path);
      setDirty(false);
      setCharCount(editor.getMarkdown().length);
      toast.success(`불러왔어: ${name}`);
    } catch (err) {
      toast.error(`불러오기에 실패했어: ${String(err)}`);
    }
  }, [dirty, editor]);

  const newDocument = useCallback(async () => {
    if (!editor) return;
    if (dirty) {
      const proceed = await ask(
        "저장하지 않은 변경이 있어. 새 문서를 만들까?",
        { title: "확인", kind: "warning" },
      );
      if (!proceed) return;
    }
    replaceDoc(editor, "");
    setTitle("제목 없음");
    setFilePath(null);
    setDirty(false);
    setCharCount(0);
  }, [dirty, editor]);

  // Ctrl+S 저장 — 브라우저 기본 저장 대화상자를 막는다.
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "s") {
        e.preventDefault();
        void saveDocument();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [saveDocument]);

  const themeLabel = useMemo(
    () => (colorScheme === "dark" ? "라이트로" : "다크로"),
    [colorScheme],
  );

  return (
    <div className="flex h-screen flex-col bg-background text-foreground">
      <header className="flex flex-col gap-2 border-b border-border px-4 py-3">
        <div className="flex items-center gap-2">
          <Input
            value={title}
            onChangeText={setTitle}
            aria-label="문서 제목"
            className="h-8 max-w-80 border-none bg-transparent px-1 text-base web:md:text-base focus:ring-1"
          />
          {dirty && (
            <span aria-label="저장되지 않은 변경" className="text-muted-foreground">
              •
            </span>
          )}
          <div className="flex-1" />
          <Button variant="ghost" size="sm" onPress={() => void newDocument()}>
            새 문서
          </Button>
          <Button variant="ghost" size="sm" onPress={() => void openDocument()}>
            열기
          </Button>
          <Button variant="outline" size="sm" onPress={() => void saveDocument()}>
            저장
          </Button>
          <Separator orientation="vertical" />
          <Button variant="ghost" size="sm" onPress={toggleColorScheme}>
            {themeLabel}
          </Button>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="icon-sm" onPress={undo} aria-label="되돌리기">
              <Undo2Icon className="text-foreground" />
            </Button>
            <Button variant="ghost" size="icon-sm" onPress={redo} aria-label="다시 실행">
              <Redo2Icon className="text-foreground" />
            </Button>
          </div>
          <Separator orientation="vertical" />
          <ToggleGroup
            type="multiple"
            variant="outline"
            size="sm"
            value={formats.filter((v) => TEXT_FORMATS.includes(v))}
            onValueChange={handleFormatsChange(TEXT_FORMATS)}
            aria-label="글자 서식"
          >
            <ToggleGroupItem value="bold" aria-label="굵게">
              <BoldIcon className="text-foreground" />
            </ToggleGroupItem>
            <ToggleGroupItem value="italic" aria-label="기울임">
              <ItalicIcon className="text-foreground" />
            </ToggleGroupItem>
            <ToggleGroupItem value="strike" aria-label="취소선">
              <StrikethroughIcon className="text-foreground" />
            </ToggleGroupItem>
          </ToggleGroup>
          <Separator orientation="vertical" />
          <ToggleGroup
            type="multiple"
            variant="outline"
            size="sm"
            value={formats.filter((v) => BLOCK_FORMATS.includes(v))}
            onValueChange={handleFormatsChange(BLOCK_FORMATS)}
            aria-label="블록 서식"
          >
            <ToggleGroupItem value="h1" aria-label="제목 1">
              <Heading1Icon className="text-foreground" />
            </ToggleGroupItem>
            <ToggleGroupItem value="h2" aria-label="제목 2">
              <Heading2Icon className="text-foreground" />
            </ToggleGroupItem>
            <ToggleGroupItem value="bulletList" aria-label="불릿 목록">
              <ListIcon className="text-foreground" />
            </ToggleGroupItem>
            <ToggleGroupItem value="orderedList" aria-label="번호 목록">
              <ListOrderedIcon className="text-foreground" />
            </ToggleGroupItem>
            <ToggleGroupItem value="quote" aria-label="인용">
              <TextQuoteIcon className="text-foreground" />
            </ToggleGroupItem>
            <ToggleGroupItem value="code" aria-label="코드 블록">
              <CodeIcon className="text-foreground" />
            </ToggleGroupItem>
          </ToggleGroup>
          <div className="flex-1" />
          <span className="text-xs text-muted-foreground">{charCount}자</span>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto">
        <div className="mx-auto max-w-3xl px-6 py-8">
          <EditorContent editor={editor} className="tiptap" />
        </div>
      </main>

      <Toaster position="bottom-right" />
    </div>
  );
}

export default App;
