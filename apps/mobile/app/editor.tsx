import { useCallback, useEffect, useRef, useState } from "react";
import { router, useLocalSearchParams } from "expo-router";
import { Keyboard } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  EditorToolbar,
  toast,
  useUnikitTheme,
} from "@unikit-bridge/ui";
import type {
  EditorCommand,
  EditorFormat,
  RnToWebViewMessage,
  WebViewToRnMessage,
} from "@unikit-bridge/ui";
import {
  ChevronLeftIcon,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  Text,
  TextInput,
  View,
} from "@unikit-bridge/ui/primitives";

import EDITOR_HTML from "../lib/editor-html";
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
import { WebView, type WebViewHandle, type WebViewMessageEvent } from "../lib/webview-compat";

const SAVE_DEBOUNCE_MS = 500;
const NEW_DOC_DEFAULT_TITLE = "새 문서";

export default function EditorScreen() {
  const params = useLocalSearchParams<{ file?: string }>();
  const { colorScheme } = useUnikitTheme();
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

  const webRef = useRef<WebViewHandle | null>(null);
  const readyRef = useRef(false);

  const [ready, setReady] = useState(false);
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

  const send = useCallback((msg: RnToWebViewMessage) => {
    webRef.current?.injectJavaScript(
      `window.__mdReceive?.(${JSON.stringify(JSON.stringify(msg))}); true;`,
    );
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

  const onMessage = useCallback(
    (event: WebViewMessageEvent) => {
      let parsed: unknown;
      try {
        parsed = JSON.parse(event.nativeEvent.data);
      } catch {
        return;
      }
      if (!parsed || typeof parsed !== "object") return;
      const msg = parsed as Partial<WebViewToRnMessage>;

      if (msg.type === "ready") {
        readyRef.current = true;
        setReady(true);
        // contentRef.current를 보낸다(초기값은 initial과 같다) — WebView 프로세스가
        // 재시작해 ready가 다시 와도 편집 중 분량을 되살린다(옛 스냅샷 롤백 방지).
        send({
          type: "init",
          markdown: contentRef.current,
          dark: colorScheme === "dark",
        });
        return;
      }
      if (msg.type === "change") {
        if (typeof msg.markdown !== "string") return;
        contentRef.current = msg.markdown;
        dirtyRef.current = true;
        scheduleSave();
        return;
      }
      if (msg.type === "state") {
        if (!Array.isArray(msg.formats) || !msg.formats.every((f) => typeof f === "string")) {
          return;
        }
        // 웹 쪽에서 활성 서식이나 undo/redo 여부가 바뀔 때만 보내지만, 이중으로 막아 둔다.
        const nextFormats = msg.formats;
        const key = nextFormats.join(",");
        setFormats((prev) => (prev.join(",") === key ? prev : nextFormats));
        if (typeof msg.canUndo === "boolean") {
          const nextCanUndo = msg.canUndo;
          setCanUndo((prev) => (prev === nextCanUndo ? prev : nextCanUndo));
        }
        if (typeof msg.canRedo === "boolean") {
          const nextCanRedo = msg.canRedo;
          setCanRedo((prev) => (prev === nextCanRedo ? prev : nextCanRedo));
        }
      }
    },
    [colorScheme, scheduleSave, send],
  );

  // 테마 전환 동기화 — ready 전이라면 init이 곧 최신 값을 보낸다.
  useEffect(() => {
    if (readyRef.current) {
      send({ type: "theme", dark: colorScheme === "dark" });
    }
  }, [colorScheme, send]);

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
      if (!readyRef.current) return;
      send({ type: "format", format });
    },
    [send],
  );

  const runCommand = useCallback(
    (command: EditorCommand) => {
      if (!readyRef.current) return;
      send({ type: "command", command });
    },
    [send],
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

  const handleWebViewCrash = useCallback(() => {
    readyRef.current = false;
    setReady(false);
    webRef.current?.reload?.();
  }, []);

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
          disabled={!ready}
          onFormat={runFormat}
          onCommand={runCommand}
        />
      </View>

      <WebView
        ref={webRef}
        source={{ html: EDITOR_HTML }}
        onMessage={onMessage}
        onLoadStart={() => {
          readyRef.current = false;
          setReady(false);
        }}
        onContentProcessDidTerminate={handleWebViewCrash}
        onRenderProcessGone={handleWebViewCrash}
        className="flex-1"
        style={{
          flex: 1,
          backgroundColor: colorScheme === "dark" ? "#09090b" : "#ffffff",
        }}
        originWhitelist={["about:blank"]}
        dataDetectorTypes="none"
        allowFileAccess={false}
        allowFileAccessFromFileURLs={false}
        allowUniversalAccessFromFileURLs={false}
        javaScriptCanOpenWindowsAutomatically={false}
        setSupportMultipleWindows={false}
        onShouldStartLoadWithRequest={(req) => req.url === "about:blank"}
      />
    </KeyboardAvoidingView>
  );
}
