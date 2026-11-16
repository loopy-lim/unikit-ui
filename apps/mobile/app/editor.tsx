import { useCallback, useEffect, useRef, useState } from "react";
import { router, useLocalSearchParams } from "expo-router";
import { Keyboard } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  EditorToolbar,
  toast,
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
import {
  ChevronLeftIcon,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  Text,
  TextInput,
  View,
} from "@unikit-bridge/ui/primitives";

import {
  docExists,
  docNameFromTitle,
  isValidDocName,
  nextDocName,
  readDoc,
  renameDoc,
  sanitizeDocTitle,
  writeDoc,
} from "../lib/storage";

const SAVE_DEBOUNCE_MS = 500;
const NEW_DOC_DEFAULT_TITLE = "새 문서";

export default function EditorScreen() {
  const params = useLocalSearchParams<{ file?: string }>();
  // 엣지투엣지 창 — 상단·하단 여백은 상태 표시줄·제스처 바 실측 insets로 잡는다.
  const insets = useSafeAreaInsets();

  // 마운트 시 한 번만 정한다 — 이후 route params 변화와 무관하게 편집을 이어간다.
  // file 파라미터는 딥링크 등 외부 입력이라 문서 이름 규칙을 통과할 때만 믿는다.
  const initialFile =
    typeof params.file === "string" && isValidDocName(params.file) ? params.file : null;
  const initialTitle = initialFile ? initialFile.replace(/\.md$/, "") : NEW_DOC_DEFAULT_TITLE;
  const initialRef = useRef<{ markdown: string; file: string | null }>({
    markdown: initialFile ? (readDoc(initialFile) ?? "") : "",
    file: initialFile,
  });
  const fileNameRef = useRef<string | null>(initialRef.current.file);
  const contentRef = useRef(initialRef.current.markdown);
  const dirtyRef = useRef(false);
  const titleRef = useRef(initialTitle);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // 에디터 엔진은 패키지 진입점(@unikit-bridge/ui/editor)이 소유한다(사이클 95) —
  // 앱은 저장·제목 편집만 담당하고, 서식 실행은 ref 명령으로, 상태는 onStateChange로.
  const editorRef = useRef<MarkdownEditorHandle | null>(null);

  const [editorReady, setEditorReady] = useState(false);
  const [formats, setFormats] = useState<string[]>([]);
  const [canUndo, setCanUndo] = useState(false);
  const [canRedo, setCanRedo] = useState(false);
  const [saveState, setSaveState] = useState<"saved" | "pending">("saved");
  const [title, setTitle] = useState(initialTitle);
  const [androidKeyboardOpen, setAndroidKeyboardOpen] = useState(false);

  useEffect(() => {
    if (Platform.OS !== "android") return;
    const showSub = Keyboard.addListener("keyboardDidShow", () => setAndroidKeyboardOpen(true));
    const hideSub = Keyboard.addListener("keyboardDidHide", () => setAndroidKeyboardOpen(false));
    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);

  const commitExistingRename = useCallback((): boolean => {
    const currentFile = fileNameRef.current;
    if (!currentFile) return true;
    const currentStem = currentFile.replace(/\.md$/, "");
    const sanitized = sanitizeDocTitle(titleRef.current);
    if (sanitized === currentStem) {
      if (titleRef.current !== currentStem) {
        titleRef.current = currentStem;
        setTitle(currentStem);
      }
      return true;
    }
    try {
      const renamed = renameDoc(currentFile, titleRef.current);
      fileNameRef.current = renamed.name;
      titleRef.current = renamed.title;
      setTitle(renamed.title);
      return true;
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      toast.error(message);
      titleRef.current = currentStem;
      setTitle(currentStem);
      return false;
    }
  }, []);

  const flushSave = useCallback((): boolean => {
    if (saveTimer.current) {
      clearTimeout(saveTimer.current);
      saveTimer.current = null;
    }
    const markdown = contentRef.current;
    if (!fileNameRef.current) {
      if (!markdown.trim()) {
        dirtyRef.current = false;
        setSaveState("saved");
        return true;
      }
      const custom =
        sanitizeDocTitle(titleRef.current) !== NEW_DOC_DEFAULT_TITLE
          ? docNameFromTitle(titleRef.current)
          : null;
      if (custom && !docExists(custom)) {
        fileNameRef.current = custom;
        const clean = custom.replace(/\.md$/, "");
        titleRef.current = clean;
        setTitle(clean);
      } else {
        if (custom && docExists(custom)) {
          toast.error("같은 이름의 문서가 이미 있어 새 이름으로 저장했어.");
        }
        const generated = nextDocName();
        fileNameRef.current = generated;
        const generatedTitle = generated.replace(/\.md$/, "");
        titleRef.current = generatedTitle;
        setTitle(generatedTitle);
      }
      try {
        writeDoc(fileNameRef.current, markdown);
        dirtyRef.current = false;
        initialRef.current = { markdown, file: fileNameRef.current };
        setSaveState("saved");
        return true;
      } catch (err) {
        toast.error(`저장에 실패했어: ${String(err)}`);
        return false;
      }
    }

    // 기존 문서는 이름 변경을 시도하기 전에 본문 변경부터 먼저 저장해
    // 제목 충돌이나 빈 제목 상태로 뒤로 갈 때 본문이 유실되지 않게 한다.
    if (dirtyRef.current || markdown !== initialRef.current.markdown) {
      try {
        writeDoc(fileNameRef.current, markdown);
        dirtyRef.current = false;
        initialRef.current = { markdown, file: fileNameRef.current };
      } catch (err) {
        toast.error(`저장에 실패했어: ${String(err)}`);
        return false;
      }
    }

    if (!commitExistingRename()) {
      setSaveState("saved");
      return false;
    }

    initialRef.current = { markdown, file: fileNameRef.current };
    setSaveState("saved");
    return true;
  }, [commitExistingRename]);

  const scheduleSave = useCallback(() => {
    // 이미 pending이면 같은 값 재set — React가 재렌더를 건너뛴다(키 입력마다
    // 리렌더가 쌓이던 이전 동작 개선, 사이클 94).
    setSaveState((prev) => (prev === "pending" ? prev : "pending"));
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(flushSave, SAVE_DEBOUNCE_MS);
  }, [flushSave]);

  // onStateChange는 글자수(chars)까지 포함해 키 입력마다 온다 — 앱이 안 쓰는 필드의
  // setStates가 같은 값으로 bail하므로 리렌더는 일어나지 않는다(사이클 94 계약).
  const handleStateChange = useCallback((state: MarkdownEditorState) => {
    const key = state.formats.join(",");
    setFormats((prev) => (prev.join(",") === key ? prev : state.formats));
    setCanUndo((prev) => (prev === state.canUndo ? prev : state.canUndo));
    setCanRedo((prev) => (prev === state.canRedo ? prev : state.canRedo));
    setEditorReady((prev) => (prev === state.ready ? prev : state.ready));
  }, []);

  const handleChange = useCallback(
    (markdown: string) => {
      contentRef.current = markdown;
      dirtyRef.current = true;
      scheduleSave();
    },
    [scheduleSave],
  );

  // 언마운트(시스템 뒤로 가기 포함) 직전 미저장 변경과 제목 변경을 확정 저장한다.
  // goBack()이 이미 저장을 끝냈다면 dirtyRef·saveTimer가 비어 중복 저장하지 않고,
  // 기존 문서를 비운 경우(contentRef.current === "")도 빠뜨리지 않는다.
  useEffect(() => {
    return () => {
      const hadTimer = saveTimer.current !== null;
      if (saveTimer.current) {
        clearTimeout(saveTimer.current);
        saveTimer.current = null;
      }
      const hasPendingRename =
        fileNameRef.current !== null &&
        sanitizeDocTitle(titleRef.current) !== fileNameRef.current.replace(/\.md$/, "");
      if (dirtyRef.current || hadTimer || hasPendingRename) {
        try {
          flushSave();
        } catch {
          // 저장 실패는 flushSave 내 toast가 알린다.
        }
      }
    };
  }, [flushSave]);

  const runFormat = useCallback(
    (format: EditorFormat) => {
      editorRef.current?.runFormat(format);
    },
    [],
  );

  const runCommand = useCallback(
    (command: EditorCommand) => {
      editorRef.current?.runCommand(command);
    },
    [],
  );

  const handleTitleChange = useCallback((next: string) => {
    titleRef.current = next;
    setTitle(next);
  }, []);

  const handleTitleBlur = useCallback(() => {
    if (fileNameRef.current) {
      commitExistingRename();
    } else if (!titleRef.current.trim()) {
      titleRef.current = NEW_DOC_DEFAULT_TITLE;
      setTitle(NEW_DOC_DEFAULT_TITLE);
    }
  }, [commitExistingRename]);

  const goBack = useCallback(() => {
    if (!flushSave()) return;
    router.back();
  }, [flushSave]);

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      className="flex-1 bg-background"
      style={{ paddingBottom: androidKeyboardOpen ? 0 : insets.bottom }}
    >
      <View
        className="flex-row items-center gap-2 border-b border-border px-2 pb-2"
        style={{ paddingTop: insets.top + 8 }}
      >
        <Pressable
          onPress={goBack}
          aria-label="문서 목록으로"
          className="rounded-md px-2 py-1 active:bg-accent"
        >
          <ChevronLeftIcon size={24} className="text-foreground" />
        </Pressable>
        <TextInput
          value={title}
          onChangeText={handleTitleChange}
          onBlur={handleTitleBlur}
          placeholder="문서 제목"
          accessibilityLabel="문서 제목"
          className="flex-1 px-1 py-1 text-base font-medium text-foreground"
        />
        <Text className="px-2 text-xs text-muted-foreground">
          {saveState === "pending" ? "저장 중…" : "저장됨"}
        </Text>
      </View>

      <View className="border-b border-border px-3 py-1">
        <EditorToolbar
          formats={formats}
          canUndo={canUndo}
          canRedo={canRedo}
          disabled={!editorReady}
          onFormat={runFormat}
          onCommand={runCommand}
        />
      </View>

      <MarkdownEditor
        ref={editorRef}
        className="flex-1"
        initialMarkdown={initialRef.current.markdown}
        toolbar={false}
        onChange={handleChange}
        onStateChange={handleStateChange}
      />
    </KeyboardAvoidingView>
  );
}
