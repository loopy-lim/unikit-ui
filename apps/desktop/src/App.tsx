import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { Editor } from "@tiptap/core";
import { ask, open, save } from "@tauri-apps/plugin-dialog";
import { exists, readTextFile, rename, writeTextFile } from "@tauri-apps/plugin-fs";
import { Placeholder } from "@tiptap/extensions";
import { Markdown } from "@tiptap/markdown";
import { EditorState } from "@tiptap/pm/state";
import { EditorContent, useEditor, useEditorState } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import {
  Button,
  EditorToolbar,
  Input,
  Separator,
  Toaster,
  activeFormats,
  toast,
  useUnikitTheme,
} from "@unikit-bridge/ui";

/*
 * UniKit Markdown(데스크톱) — @unikit-bridge/ui 도그푸딩 앱.
 * tiptap v3(ProseMirror) + @tiptap/markdown으로 위지윅 ↔ 마크다운을 왕복한다.
 * 툴바는 패키지 EditorToolbar, 본문 스타일은 editor-prose.css가 담당(사이클 94).
 */

const DEFAULT_TITLE = "제목 없음";
const WINDOWS_RESERVED_STEMS = /^(con|prn|aux|nul|com[1-9]|lpt[1-9])$/i;

const WELCOME = `# UniKit Markdown

**위지윅**으로 쓰고 마크다운으로 저장하는 데모 문서야.

## 지원 문법

- 굵게 · 기울임 · 취소선
- 목록(불릿 · 번호)과 인용
- \`인라인 코드\`와 코드 블록

> \`열기\`로 .md 파일을 불러오고 \`Ctrl+S\`로 저장해 봐.
`;

// 문서 교체 직후 undo 히스토리 초기화 — setContent가 한 단계로 기록되어
// 첫 undo가 교체 이전 문서로 되돌리는 것을 막는다(모바일 web-editor와 같은 결함).
const replaceDoc = (editor: Editor, markdown: string) => {
  editor.commands.setContent(markdown, { contentType: "markdown", emitUpdate: false });
  editor.view.updateState(
    EditorState.create({ doc: editor.state.doc, plugins: editor.state.plugins }),
  );
};

const sanitizeFileStem = (raw: string): string => {
  const cleaned = raw
    .trim()
    .replace(/\.(md|markdown)$/i, "")
    .replace(/[<>:"/\\|?*\x00-\x1f\x7f]/g, "-")
    .replace(/^\.+/, "")
    .replace(/[. ]+$/, "")
    .trim();
  if (!cleaned || cleaned === "." || cleaned === "..") return "";
  return WINDOWS_RESERVED_STEMS.test(cleaned) ? `${cleaned}_doc` : cleaned;
};

const splitPathParts = (
  fullPath: string,
): { dir: string; sep: string; hasDir: boolean; name: string; ext: string } => {
  const slashIdx = fullPath.lastIndexOf("/");
  const backslashIdx = fullPath.lastIndexOf("\\");
  const sepIdx = Math.max(slashIdx, backslashIdx);
  const hasDir = sepIdx >= 0;
  const sep = hasDir ? fullPath[sepIdx] : "/";
  const dir = hasDir ? fullPath.slice(0, sepIdx) : "";
  const name = hasDir ? fullPath.slice(sepIdx + 1) : fullPath;
  const extMatch = name.match(/\.(md|markdown)$/i);
  const ext = extMatch ? extMatch[0] : ".md";
  return { dir, sep, hasDir, name, ext };
};

function App() {
  const { colorScheme, toggleColorScheme } = useUnikitTheme();
  const [title, setTitle] = useState(DEFAULT_TITLE);
  const [filePath, setFilePath] = useState<string | null>(null);
  const [dirty, setDirty] = useState(false);
  const editSeqRef = useRef(0);
  const bodyDirtyRef = useRef(false);
  const ioBusyRef = useRef(false);

  const editor = useEditor({
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
    content: WELCOME,
    contentType: "markdown",
    onUpdate: () => {
      editSeqRef.current += 1;
      bodyDirtyRef.current = true;
      setDirty(true);
    },
  });

  // 툴바 상태 선택 구독 — transaction마다 selector가 돌지만, 결과가 같으면
  // 리렌더가 없다(tiptap useEditorState의 circularDeepEqual). 이전 구조는
  // 매 키 입력마다 getMarkdown() 직렬화(글자수) + formats 새 배열 set로
  // 헤더 전체가 리렌더됐다.
  const editorState = useEditorState({
    editor,
    selector: ({ editor }) =>
      editor
        ? {
            // 배열 대신 join 문자열 — 깊은 비교 비용까지 아낀다.
            formats: activeFormats(editor).join(","),
            canUndo: editor.can().undo(),
            canRedo: editor.can().redo(),
            // getMarkdown() 직렬화 폐지 — doc 순회만으로 글자수.
            chars: editor.state.doc.textContent.length,
          }
        : { formats: "", canUndo: false, canRedo: false, chars: 0 },
  });
  const formats = useMemo(
    () => editorState.formats.split(",").filter(Boolean),
    [editorState.formats],
  );

  const runFormat = useCallback(
    (format: string) => {
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

  const runCommand = useCallback(
    (command: "undo" | "redo") => {
      if (!editor) return;
      const chain = editor.chain().focus();
      if (command === "undo") chain.undo().run();
      else chain.redo().run();
    },
    [editor],
  );

  const savedStem = useMemo(() => {
    if (!filePath) return DEFAULT_TITLE;
    return splitPathParts(filePath).name.replace(/\.(md|markdown)$/i, "");
  }, [filePath]);

  const handleTitleChange = useCallback(
    (next: string) => {
      setTitle(next);
      setDirty(bodyDirtyRef.current || next !== savedStem);
    },
    [savedStem],
  );

  const saveDocument = useCallback(async () => {
    if (!editor || ioBusyRef.current) return;
    ioBusyRef.current = true;
    try {
      const snapshotSeq = editSeqRef.current;
      const markdown = editor.getMarkdown();
      let path = filePath;

      if (!path) {
        const defaultStem = sanitizeFileStem(title) || DEFAULT_TITLE;
        path = await save({
          title: "마크다운 문서 저장",
          defaultPath: `${defaultStem}.md`,
          filters: [{ name: "Markdown", extensions: ["md", "markdown"] }],
        });
        if (!path) return;
        await writeTextFile(path, markdown);
      } else {
        const { dir, sep, hasDir, name, ext } = splitPathParts(path);
        const currentStem = name.replace(/\.(md|markdown)$/i, "");
        const sanitizedTitle = sanitizeFileStem(title);
        if (!sanitizedTitle) {
          toast.error("문서 제목을 입력해 줘.");
          setTitle(currentStem);
          setDirty(bodyDirtyRef.current);
          return;
        }

        if (sanitizedTitle === currentStem) {
          await writeTextFile(path, markdown);
        } else {
          const nextName = `${sanitizedTitle}${ext}`;
          const nextPath = hasDir ? `${dir}${sep}${nextName}` : nextName;
          const isCaseOnly = sanitizedTitle.toLowerCase() === currentStem.toLowerCase();
          const isLinux = typeof navigator !== "undefined" && /linux/i.test(navigator.userAgent);

          // 먼저 현재 파일에 내용을 안전하게 저장해 이름 변경 실패 시에도 편집 내용을 잃지 않는다.
          let targetExists = false;
          let canScopeRename = true;
          if (!isCaseOnly || isLinux) {
            try {
              targetExists = await exists(nextPath);
            } catch {
              canScopeRename = false;
            }
          }

          if (canScopeRename && targetExists) {
            const overwrite = await ask(
              `같은 이름의 파일("${nextName}")이 이미 있어. 덮어쓸까?`,
              { title: "확인", kind: "warning" },
            );
            if (!overwrite) return;
          }

          await writeTextFile(path, markdown);

          if (canScopeRename) {
            try {
              if (isCaseOnly && !isLinux) {
                const tmpName = `__rename_${Date.now()}${ext}`;
                const tmpPath = hasDir ? `${dir}${sep}${tmpName}` : tmpName;
                await rename(path, tmpPath);
                try {
                  await rename(tmpPath, nextPath);
                } catch (err) {
                  await rename(tmpPath, path).catch(() => {});
                  throw err;
                }
              } else {
                await rename(path, nextPath);
              }
              path = nextPath;
            } catch {
              canScopeRename = false;
            }
          }

          if (!canScopeRename) {
            const picked = await save({
              title: "새 이름으로 저장",
              defaultPath: nextPath,
              filters: [{ name: "Markdown", extensions: ["md", "markdown"] }],
            });
            if (picked) {
              await writeTextFile(picked, markdown);
              path = picked;
            }
          }
        }
      }

      const savedName = splitPathParts(path).name;
      const savedNextStem = savedName.replace(/\.(md|markdown)$/i, "");
      setFilePath(path);
      setTitle(savedNextStem);
      if (editSeqRef.current === snapshotSeq) {
        bodyDirtyRef.current = false;
        setDirty(false);
      }
      toast.success(`저장했어: ${savedName}`);
    } catch (err) {
      toast.error(`저장에 실패했어: ${String(err)}`);
    } finally {
      ioBusyRef.current = false;
    }
  }, [editor, filePath, title]);

  const openDocument = useCallback(async () => {
    if (!editor || ioBusyRef.current) return;
    ioBusyRef.current = true;
    try {
      if (dirty) {
        const proceed = await ask(
          "저장하지 않은 변경이 있어. 저장하지 않고 불러올까?",
          { title: "확인", kind: "warning" },
        );
        if (!proceed) return;
      }
      const path = await open({
        title: "마크다운 문서 열기",
        multiple: false,
        filters: [{ name: "Markdown", extensions: ["md", "markdown"] }],
      });
      if (!path) return;
      const text = await readTextFile(path);
      replaceDoc(editor, text);
      const name = splitPathParts(path).name;
      bodyDirtyRef.current = false;
      setTitle(name.replace(/\.(md|markdown)$/i, ""));
      setFilePath(path);
      setDirty(false);
      toast.success(`불러왔어: ${name}`);
    } catch (err) {
      toast.error(`불러오기에 실패했어: ${String(err)}`);
    } finally {
      ioBusyRef.current = false;
    }
  }, [dirty, editor]);

  const newDocument = useCallback(async () => {
    if (!editor || ioBusyRef.current) return;
    ioBusyRef.current = true;
    try {
      if (dirty) {
        const proceed = await ask(
          "저장하지 않은 변경이 있어. 새 문서를 만들까?",
          { title: "확인", kind: "warning" },
        );
        if (!proceed) return;
      }
      replaceDoc(editor, "");
      bodyDirtyRef.current = false;
      setTitle(DEFAULT_TITLE);
      setFilePath(null);
      setDirty(false);
    } finally {
      ioBusyRef.current = false;
    }
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
            onChangeText={handleTitleChange}
            accessibilityLabel="문서 제목"
            className="h-8 max-w-80 border-none bg-transparent px-1 text-base web:md:text-base focus:ring-1"
            // 제목란은 앱바의 글자처럼 보이게 하는 게 목적이라 채움을 원천 제거한다.
            // 컴포넌트의 dark:bg-input/30은 shadcn 원본 클래스라 twMerge로는 못 이기고
            // (변형 접두사가 달라 별도 그룹), 원본 훼손 없이 앱에서만 무력화하는
            // 동적 style 계약으로 처리한다(사이클 94 G4 P2-3).
            style={{ backgroundColor: "transparent" }}
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
          <EditorToolbar
            formats={formats}
            canUndo={editorState.canUndo}
            canRedo={editorState.canRedo}
            disabled={!editor}
            onFormat={runFormat}
            onCommand={runCommand}
          />
          <div className="flex-1" />
          <span className="text-xs text-muted-foreground">{editorState.chars}자</span>
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
