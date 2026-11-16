/**
 * 네이티브 editor 렌더러 — WebView + 동봉 단일 HTML 번들(`@unikit-bridge/ui/editor`
 * 네이티브 진입점).
 *
 * tiptap(ProseMirror)는 DOM 전용이라 RN 네이티브 뷰로 직접 올릴 수 없다 — WebView에
 * 단일 파일 HTML(editor-html.ts — editor-web-view 워크스페이스의 vite 빌드 산출물)을
 * 띄우고 JSON 브리지(RnToWebViewMessage/WebViewToRnMessage — components/editor-toolbar
 * 계약)로 통신한다. 도그푸딩 모바일 앱이 쓰던 구조의 패키지 이전이고, WebView 하드닝
 * (about:blank 화이트리스트·파일 접근 차단·멀티 윈도우 금지)도 그대로 물려받는다.
 * react-native-webview는 선택 peer — 이 파일은 "react-native" 조건에서만 로드되므로
 * 웹 번들은 포함하지 않는다(chart 네이티브 렌더러와 같은 구조 — §0.1).
 *
 * 성능 계약(사이클 94 유지): 키 입력마다 오는 change는 markdownRef와 stateRef의
 * chars, onChange만 갱신한다. 리렌더(setState)는 서식·undo/redo·ready가 바뀔 때만,
 * onStateChange는 스냅샷 조인 키가 바뀔 때만 발화한다.
 */
import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
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

/*
 * react-native-webview 14 호환 래퍼(구 apps/mobile/lib/webview-compat.tsx 이전).
 * webview 14의 cross-platform 타입(lib/WebView.d.ts)이 `FunctionComponent<WebViewProps>`
 * 로만 선언돼 ref 계약(forwardRef + injectJavaScript)을 타입에 노출하지 않는다.
 * 런타임 계약에 맞춰 사용하는 최소 인터페이스만 단언한다.
 */
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
    // 콜백은 ref에 최신 유지 — 브리지 핸들러가 재생성되지 않게 한다.
    const onChangeRef = useRef(onChange);
    onChangeRef.current = onChange;
    const onStateChangeRef = useRef(onStateChange);
    onStateChangeRef.current = onStateChange;

    // 초기값은 마운트 시 한 번만(비제어). WebView 프로세스 재시작 시 되살릴 분량.
    const markdownRef = useRef(initialMarkdown);
    // placeholder는 ref로 최신 유지 — prop 교체를 장식 갱신 메시지로 반영한다.
    const placeholderRef = useRef(placeholder);
    placeholderRef.current = placeholder;

    const webRef = useRef<WebViewHandle | null>(null);

    // 스냅샷 단일 출처 — 렌더 상태와 onStateChange가 같은 값을 본다.
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

    /** 스냅샷 패치 — 렌더 상태는 값이 바뀔 때만, 콜백은 emitState가 디듀프한다. */
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
          // markdownRef.current를 보낸다(초기값은 initial과 같다) — WebView 프로세스가
          // 재시작해 ready가 다시 와도 편집 중 분량을 되살린다(옛 스냅샷 롤백 방지).
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
          // 브리지 문자열을 계약값으로 좁힌다(외부 입력 — 모르는 값은 버린다).
          const knownFormats = msg.formats.filter((f): f is EditorFormat =>
            (EDITOR_FORMATS as readonly string[]).includes(f),
          );
          // 웹 쪽에서 활성 서식이나 undo/redo 여부가 바뀔 때만 보내지만, 이중으로 막아 둔다.
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

    // 테마 전환 동기화 — ready 전이라면 init이 곧 최신 값을 보낸다.
    useEffect(() => {
      if (stateRef.current.ready) {
        send({ type: "theme", dark: colorScheme === "dark" });
      }
    }, [colorScheme, send]);

    // placeholder 교체 — 문서를 보존한 채 번들 장식만 다시 그린다(웹 렌더러와 같은 계약).
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
        // 되살릴 분량을 먼저 갱신 — 이후 프로세스 재시작 시 복구 스냅샷이 새 문서다.
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

    // 배경색은 토큰에서 조립(lib/editor 값 성형 — 원색 리터럴 금지, audit b).
    const backgroundColor = editorBackground(colorScheme);

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
          source={{ html: EDITOR_HTML }}
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
