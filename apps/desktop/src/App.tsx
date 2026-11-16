import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ask, open, save } from "@tauri-apps/plugin-dialog";
import { exists, readTextFile, rename, writeTextFile } from "@tauri-apps/plugin-fs";
import {
  Button,
  EditorToolbar,
  Input,
  Separator,
  Toaster,
  toast,
  useUnikitTheme,
} from "@unikit-bridge/ui";
import type {
  EditorCommand,
  EditorFormat,
} from "@unikit-bridge/ui";
import {
  MarkdownEditor,
  type MarkdownEditorHandle,
  type MarkdownEditorState,
} from "@unikit-bridge/ui/editor";

/*
 * UniKit Markdown(데스크톱) — @unikit-bridge/ui 도그푸딩 앱.
 * 에디터 엔진은 패키지 진입점 @unikit-bridge/ui/editor(MarkdownEditor — tiptap v3 +
 * @tiptap/markdown)이 소유한다(사이클 95 이관). 앱은 파일 입출력·제목·저장 상태만
 * 담당하고, 툴바는 패키지 EditorToolbar를 앱 헤더에 직접 꾸린다(toolbar={false}).
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

// 문서 교체는 에디터 ref 명령이 담당한다(undo 히스토리 초기화 포함 — 사이클 95).
// setMarkdown은 onChange를 발화하지 않으므로 앱의 markdownRef를 함께 갱신한다.

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

  // 에디터 엔진·상태는 MarkdownEditor가 소유 — 앱은 ref 명령과 onStateChange로.
  const editorRef = useRef<MarkdownEditorHandle | null>(null);
  // 저장 시점의 본문 — onChange로 항상 최신을 유지한다(브리지와 달리 웹은
  // 키 입력마다 즉시 온다).
  const markdownRef = useRef(WELCOME);

  const [ready, setReady] = useState(false);
  const [formats, setFormats] = useState<string[]>([]);
  const [canUndo, setCanUndo] = useState(false);
  const [canRedo, setCanRedo] = useState(false);
  const [chars, setChars] = useState(0);

  const handleStateChange = useCallback((state: MarkdownEditorState) => {
    const key = state.formats.join(",");
    setFormats((prev) => (prev.join(",") === key ? prev : state.formats));
    setCanUndo((prev) => (prev === state.canUndo ? prev : state.canUndo));
    setCanRedo((prev) => (prev === state.canRedo ? prev : state.canRedo));
    setReady((prev) => (prev === state.ready ? prev : state.ready));
    setChars((prev) => (prev === state.chars ? prev : state.chars));
  }, []);

  const handleChange = useCallback((markdown: string) => {
    markdownRef.current = markdown;
    editSeqRef.current += 1;
    bodyDirtyRef.current = true;
    setDirty(true);
  }, []);

  /** 문서 교체(열기·새 문서) — ref 명령 + 앱 스냅샷 동기 갱신. */
  const applyDoc = useCallback((markdown: string) => {
    markdownRef.current = markdown;
    editorRef.current?.setMarkdown(markdown);
  }, []);

  const runFormat = useCallback((format: EditorFormat) => {
    editorRef.current?.runFormat(format);
  }, []);

  const runCommand = useCallback((command: EditorCommand) => {
    editorRef.current?.runCommand(command);
  }, []);

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
    if (ioBusyRef.current) return;
    ioBusyRef.current = true;
    try {
      const snapshotSeq = editSeqRef.current;
      const markdown = markdownRef.current;
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
  }, [filePath, title]);

  const openDocument = useCallback(async () => {
    if (ioBusyRef.current) return;
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
      applyDoc(text);
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
  }, [dirty, applyDoc]);

  const newDocument = useCallback(async () => {
    if (ioBusyRef.current) return;
    ioBusyRef.current = true;
    try {
      if (dirty) {
        const proceed = await ask(
          "저장하지 않은 변경이 있어. 새 문서를 만들까?",
          { title: "확인", kind: "warning" },
        );
        if (!proceed) return;
      }
      applyDoc("");
      bodyDirtyRef.current = false;
      setTitle(DEFAULT_TITLE);
      setFilePath(null);
      setDirty(false);
    } finally {
      ioBusyRef.current = false;
    }
  }, [dirty, applyDoc]);

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
            canUndo={canUndo}
            canRedo={canRedo}
            disabled={!ready}
            onFormat={runFormat}
            onCommand={runCommand}
          />
          <div className="flex-1" />
          <span className="text-xs text-muted-foreground">{chars}자</span>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto">
        <div className="mx-auto max-w-3xl px-6 py-8">
          <MarkdownEditor
            ref={editorRef}
            toolbar={false}
            initialMarkdown={WELCOME}
            onChange={handleChange}
            onStateChange={handleStateChange}
          />
        </div>
      </main>

      <Toaster position="bottom-right" />
    </div>
  );
}

export default App;
