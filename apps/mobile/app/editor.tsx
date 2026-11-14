import { useCallback, useEffect, useRef, useState } from "react";
import { router, useLocalSearchParams } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Toaster, toast, ToggleGroup, ToggleGroupItem, useUnikitTheme } from "@unikit-bridge/ui";
import {
  BoldIcon,
  ChevronLeftIcon,
  CodeIcon,
  Heading1Icon,
  Heading2Icon,
  ItalicIcon,
  ListIcon,
  ListOrderedIcon,
  Pressable,
  Redo2Icon,
  ScrollView,
  StrikethroughIcon,
  Text,
  TextQuoteIcon,
  Undo2Icon,
  View,
} from "@unikit-bridge/ui/primitives";

import EDITOR_HTML from "../lib/editor-html";
import type { EditorCommand, EditorFormat, RnToWebViewMessage, WebViewToRnMessage } from "../lib/protocol";
import { isValidDocName, nextDocName, readDoc, writeDoc } from "../lib/storage";
import { WebView, type WebViewHandle, type WebViewMessageEvent } from "../lib/webview-compat";

const SAVE_DEBOUNCE_MS = 500;

// 툴바 두 그룹 — 글자 서식과 블록 서식을 구분자로 나눠 보여준다.
const TEXT_FORMATS: readonly EditorFormat[] = ["bold", "italic", "strike"];
const BLOCK_FORMATS: readonly EditorFormat[] = [
  "h1",
  "h2",
  "bulletList",
  "orderedList",
  "quote",
  "code",
];

export default function EditorScreen() {
  const params = useLocalSearchParams<{ file?: string }>();
  const { colorScheme } = useUnikitTheme();
  // 엣지투엣지 창 — 상단 여백은 상태 표시줄 실측 insets로 잡는다(고정 pt-*면
  // 헤더가 상태 표시줄 아래에 걸려 터치가 시스템에 먹힌다).
  const insets = useSafeAreaInsets();

  // 마운트 시 한 번만 정한다 — 이후 route params 변화와 무관하게 편집을 이어간다.
  // file 파라미터는 딥링크 등 외부 입력이라 문서 이름 규칙을 통과할 때만 믿는다.
  const initialFile =
    typeof params.file === "string" && isValidDocName(params.file) ? params.file : null;
  const initialRef = useRef<{ markdown: string; file: string | null }>({
    markdown: initialFile ? (readDoc(initialFile) ?? "") : "",
    file: initialFile,
  });
  const fileNameRef = useRef<string | null>(initialRef.current.file);
  const contentRef = useRef(initialRef.current.markdown);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const webRef = useRef<WebViewHandle | null>(null);
  const readyRef = useRef(false);

  const [formats, setFormats] = useState<string[]>([]);
  const [saveState, setSaveState] = useState<"saved" | "pending">("saved");
  const [title, setTitle] = useState(
    initialRef.current.file ? initialRef.current.file.replace(/\.md$/, "") : "새 문서",
  );

  const send = useCallback((msg: RnToWebViewMessage) => {
    webRef.current?.injectJavaScript(
      `window.__mdReceive(${JSON.stringify(JSON.stringify(msg))}); true;`,
    );
  }, []);

  const flushSave = useCallback(() => {
    const markdown = contentRef.current;
    if (!fileNameRef.current) {
      if (!markdown.trim()) return;
      fileNameRef.current = nextDocName();
      setTitle(fileNameRef.current.replace(/\.md$/, ""));
    }
    try {
      writeDoc(fileNameRef.current, markdown);
      setSaveState("saved");
    } catch (err) {
      toast.error(`저장에 실패했어: ${String(err)}`);
    }
  }, []);

  const scheduleSave = useCallback(() => {
    setSaveState("pending");
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(flushSave, SAVE_DEBOUNCE_MS);
  }, [flushSave]);

  const onMessage = useCallback(
    (event: WebViewMessageEvent) => {
      const msg = JSON.parse(event.nativeEvent.data) as WebViewToRnMessage;
      if (msg.type === "ready") {
        readyRef.current = true;
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
        contentRef.current = msg.markdown;
        scheduleSave();
        return;
      }
      if (msg.type === "state") {
        setFormats(msg.formats);
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

  // 언마운트(뒤로 가기 포함) 직전 미저장 변경을 확정 저장한다.
  useEffect(() => {
    return () => {
      if (saveTimer.current) clearTimeout(saveTimer.current);
      if (contentRef.current.trim()) {
        try {
          flushSave();
        } catch {
          // 저장 실패는 flushSave 내 toast가 알린다.
        }
      }
    };
  }, [flushSave]);

  // 툴바 — 그룹 value diff로 눌린 서식 하나만 커맨드로 보낸다.
  // members 안에서만 diff를 본다(두 ToggleGroup이 같은 formats 상태를 나눠 쓴다).
  const handleFormatsChange = useCallback(
    (members: readonly EditorFormat[]) => (next: string[]) => {
      const current = formats.filter((v) => members.includes(v as EditorFormat));
      const added = next.find((v) => !current.includes(v));
      const removed = current.find((v) => !next.includes(v));
      const changed = (added ?? removed) as EditorFormat | undefined;
      if (changed) send({ type: "format", format: changed });
    },
    [formats, send],
  );

  const sendCommand = useCallback(
    (command: EditorCommand) => {
      send({ type: "command", command });
    },
    [send],
  );

  const goBack = useCallback(() => {
    if (saveTimer.current) clearTimeout(saveTimer.current);
    flushSave();
    router.back();
  }, [flushSave]);

  return (
    <View className="flex-1 bg-background">
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
        <Text className="flex-1 truncate text-base font-medium text-foreground">{title}</Text>
        <Text className="px-2 text-xs text-muted-foreground">
          {saveState === "pending" ? "저장 중…" : "저장됨"}
        </Text>
      </View>

      <View className="border-b border-border py-1">
        <ScrollView horizontal contentContainerClassName="flex-row items-center px-3 gap-1">
          <Pressable
            onPress={() => sendCommand("undo")}
            aria-label="되돌리기"
            className="rounded-md p-2 active:bg-accent"
          >
            <Undo2Icon className="text-foreground" />
          </Pressable>
          <Pressable
            onPress={() => sendCommand("redo")}
            aria-label="다시 실행"
            className="rounded-md p-2 active:bg-accent"
          >
            <Redo2Icon className="text-foreground" />
          </Pressable>
          <View className="mx-1 h-6 w-px bg-border" />
          <ToggleGroup
            type="multiple"
            variant="outline"
            size="sm"
            value={formats.filter((v) => TEXT_FORMATS.includes(v as EditorFormat))}
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
          <View className="mx-1 h-6 w-px bg-border" />
          <ToggleGroup
            type="multiple"
            variant="outline"
            size="sm"
            value={formats.filter((v) => BLOCK_FORMATS.includes(v as EditorFormat))}
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
        </ScrollView>
      </View>

      <WebView
        ref={webRef}
        source={{ html: EDITOR_HTML }}
        onMessage={onMessage}
        className="flex-1"
        originWhitelist={["*"]}
        setSupportMultipleWindows={false}
      />

      <Toaster position="bottom-center" />
    </View>
  );
}
