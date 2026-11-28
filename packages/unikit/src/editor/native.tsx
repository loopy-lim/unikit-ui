import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from "react";
import type { ComponentProps, FunctionComponent, Ref } from "react";
import WebViewDefault from "react-native-webview";
import type { WebViewMessageEvent } from "react-native-webview";
import { View } from "@unikit-bridge/ui/primitives";

import {
  EDITOR_FORMATS,
  EditorToolbar,
  type EditorCommand,
  type EditorFormat,
  type RnToWebViewMessage,
  type WebViewToRnMessage,
} from "../components/editor-toolbar";
import { useUnikitTheme } from "../theme";
import { cn } from "../lib/utils";
import { editorBackground } from "./colors";
import type {
  MarkdownEditorHandle,
  MarkdownEditorProps,
  MarkdownEditorState,
} from "./types";
import EDITOR_HTML from "./editor-html";

export type * from "./types";

type WebViewHandle = {
  injectJavaScript: (javaScript: string) => void;
  reload?: () => void;
};
const WebView = WebViewDefault as unknown as FunctionComponent<
  ComponentProps<typeof WebViewDefault> & { ref?: Ref<WebViewHandle> }
>;

const DEFAULT_PLACEHOLDER = "여기에 마크다운으로 적어 봐";

const MarkdownEditor = forwardRef<MarkdownEditorHandle, MarkdownEditorProps>(
  function MarkdownEditor(
    {
      initialMarkdown = "",
      onChange,
      onStateChange,
      placeholder = DEFAULT_PLACEHOLDER,
      toolbar = true,
      className,
    },
    ref,
  ) {
    const { colorScheme } = useUnikitTheme();

    const onChangeRef = useRef(onChange);
    onChangeRef.current = onChange;
    const onStateChangeRef = useRef(onStateChange);
    onStateChangeRef.current = onStateChange;

    const markdownRef = useRef(initialMarkdown);

    const placeholderRef = useRef(placeholder);
    placeholderRef.current = placeholder;

    const webRef = useRef<WebViewHandle | null>(null);

    const stateRef = useRef<MarkdownEditorState>({
      ready: false,
      formats: [],
      canUndo: false,
      canRedo: false,
      chars: 0,
    });
    const lastEmitKeyRef = useRef<string | null>(null);

    const [ready, setReady] = useState(false);
    const [formats, setFormats] = useState<string[]>([]);
    const [canUndo, setCanUndo] = useState(false);
    const [canRedo, setCanRedo] = useState(false);

    const emitState = useCallback(() => {
      const s = stateRef.current;
      const key = [
        Number(s.ready),
        s.formats.join(","),
        Number(s.canUndo),
        Number(s.canRedo),
        s.chars,
      ].join("|");
      if (key === lastEmitKeyRef.current) return;
      lastEmitKeyRef.current = key;
      onStateChangeRef.current?.({ ...s, formats: [...s.formats] });
    }, []);

    const patchState = useCallback(
      (patch: Partial<MarkdownEditorState>) => {
        const s = stateRef.current;
        if (patch.ready !== undefined && patch.ready !== s.ready) {
          s.ready = patch.ready;
          setReady(s.ready);
        }
        if (patch.formats !== undefined) {
          const key = patch.formats.join(",");
          if (s.formats.join(",") !== key) {
            s.formats = patch.formats;
            setFormats(patch.formats);
          }
        }
        if (patch.canUndo !== undefined && patch.canUndo !== s.canUndo) {
          s.canUndo = patch.canUndo;
          setCanUndo(s.canUndo);
        }
        if (patch.canRedo !== undefined && patch.canRedo !== s.canRedo) {
          s.canRedo = patch.canRedo;
          setCanRedo(s.canRedo);
        }
        if (patch.chars !== undefined) s.chars = patch.chars;
        emitState();
      },
      [emitState],
    );

    const send = useCallback((msg: RnToWebViewMessage) => {
      webRef.current?.injectJavaScript(
        `window.__mdReceive?.(${JSON.stringify(JSON.stringify(msg))}); true;`,
      );
    }, []);

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

          send({
            type: "init",
            markdown: markdownRef.current,
            dark: colorScheme === "dark",
            placeholder: placeholderRef.current,
          });
          patchState({ ready: true });
          return;
        }
        if (msg.type === "change") {
          if (typeof msg.markdown !== "string" || typeof msg.chars !== "number") {
            return;
          }
          markdownRef.current = msg.markdown;
          onChangeRef.current?.(msg.markdown);
          patchState({ chars: msg.chars });
          return;
        }
        if (msg.type === "state") {
          if (!Array.isArray(msg.formats) || !msg.formats.every((f) => typeof f === "string")) {
            return;
          }

          const knownFormats = msg.formats.filter((f): f is EditorFormat =>
            (EDITOR_FORMATS as readonly string[]).includes(f),
          );

          patchState({
            formats: knownFormats,
            ...(typeof msg.canUndo === "boolean" ? { canUndo: msg.canUndo } : {}),
            ...(typeof msg.canRedo === "boolean" ? { canRedo: msg.canRedo } : {}),
            ...(typeof msg.chars === "number" ? { chars: msg.chars } : {}),
          });
        }
      },
      [colorScheme, patchState, send],
    );

    useEffect(() => {
      if (stateRef.current.ready) {
        send({ type: "theme", dark: colorScheme === "dark" });
      }
    }, [colorScheme, send]);

    useEffect(() => {
      if (stateRef.current.ready) {
        send({ type: "placeholder", placeholder: placeholderRef.current });
      }
    }, [placeholder, send]);

    const runFormat = useCallback(
      (format: EditorFormat) => {
        if (!stateRef.current.ready) return;
        send({ type: "format", format });
      },
      [send],
    );

    const runCommand = useCallback(
      (command: EditorCommand) => {
        if (!stateRef.current.ready) return;
        send({ type: "command", command });
      },
      [send],
    );

    const setMarkdown = useCallback(
      (markdown: string) => {

        markdownRef.current = markdown;
        if (stateRef.current.ready) {
          send({ type: "set", markdown });
        }
      },
      [send],
    );

    useImperativeHandle(
      ref,
      () => ({ setMarkdown, runFormat, runCommand }),
      [setMarkdown, runFormat, runCommand],
    );

    const handleWebViewCrash = useCallback(() => {
      patchState({ ready: false });
      webRef.current?.reload?.();
    }, [patchState]);

    const backgroundColor = editorBackground(colorScheme);

    const html = useMemo(
      () =>
        colorScheme === "dark"
          ? EDITOR_HTML.replace("<html ", '<html class="dark" ')
          : EDITOR_HTML,
      [colorScheme],
    );

    return (
      <View className={cn("flex flex-col", className)}>
        {toolbar ? (
          <EditorToolbar
            formats={formats}
            canUndo={canUndo}
            canRedo={canRedo}
            disabled={!ready}
            onFormat={runFormat}
            onCommand={runCommand}
          />
        ) : null}
        <WebView
          ref={webRef}
          source={{ html }}
          onMessage={onMessage}
          onLoadStart={() => patchState({ ready: false })}
          onContentProcessDidTerminate={handleWebViewCrash}
          onRenderProcessGone={handleWebViewCrash}
          className="flex-1"
          style={{ flex: 1, backgroundColor }}
          originWhitelist={["about:blank"]}
          dataDetectorTypes={["none"]}
          allowFileAccess={false}
          allowFileAccessFromFileURLs={false}
          allowUniversalAccessFromFileURLs={false}
          javaScriptCanOpenWindowsAutomatically={false}
          setSupportMultipleWindows={false}
          onShouldStartLoadWithRequest={(req) => req.url === "about:blank"}
        />
      </View>
    );
  },
);
MarkdownEditor.displayName = "MarkdownEditor";

export { MarkdownEditor };
