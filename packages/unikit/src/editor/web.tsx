/**
 * 웹 editor 렌더러 — tiptap 직접 마운트(`@unikit-bridge/ui/editor` 웹 진입점).
 *
 * @tiptap/react(선택 peer)로 contentEditable을 띄우고, 계약(서식 9종·undo/redo)은
 * components/editor-toolbar가 단일 출처다. 본문 타이포그래피는 editor-prose.css를
 * 여기서 import해 소비자 별도 설치 없이 적용된다(중복 import는 번들러가 정리).
 * 이 파일은 "default" 조건에서만 로드되므로 네이티브 번들은 @tiptap/react를
 * 포함하지 않는다(chart 웹 렌더러와 같은 구조 — §0.1).
 *
 * 상태 관측은 useEditorState selector 하나로 모은다(도그푸딩 데스크톱 앱이 쓰던
 * 패턴의 패키지 이전 — circularDeepEqual로 결과가 같으면 리렌더가 없다). chars는
 * selector 안에서 doc 순회로만 산출(getMarkdown 직렬화 폐지 — 사이클 94).
 */
import "../lib/editor-prose.css";
import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useRef,
} from "react";
import { EditorState } from "@tiptap/pm/state";
import { Placeholder } from "@tiptap/extensions";
import { Markdown } from "@tiptap/markdown";
import { EditorContent, useEditor, useEditorState } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { View } from "@unikit-bridge/ui/primitives";

import {
  EditorToolbar,
  activeFormats,
  applyEditorCommand,
  applyEditorFormat,
  type EditorCommand,
  type EditorFormat,
} from "../components/editor-toolbar";
import { cn } from "../lib/utils";
import type {
  MarkdownEditorHandle,
  MarkdownEditorProps,
} from "./types";

export type * from "./types";

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
    // 콜백은 ref에 최신 유지 — 에디터 재생성 없이 소비자 콜백 교체를 반영한다.
    const onChangeRef = useRef(onChange);
    onChangeRef.current = onChange;
    const onStateChangeRef = useRef(onStateChange);
    onStateChangeRef.current = onStateChange;
    // placeholder도 같은 방식 — 에디터를 다시 만들면 편집 중 문서가 initialMarkdown으로
    // 되돌아가므로(유실), 함수형 Placeholder가 ref를 읽게 하고 문구 교체 시 빈
    // 트랜잭션 dispatch로 장식만 다시 그린다(네이티브 번들과 같은 계약).
    const placeholderRef = useRef(placeholder);
    placeholderRef.current = placeholder;

    const editor = useEditor({
      extensions: [
        StarterKit.configure({
          link: { openOnClick: false, markdownLinks: true },
        }),
        Markdown,
        Placeholder.configure({ placeholder: () => placeholderRef.current }),
      ],
      content: initialMarkdown,
      contentType: "markdown",
      onUpdate: ({ editor }) => {
        onChangeRef.current?.(editor.getMarkdown());
      },
    });

    // placeholder prop 교체 — 문서·히스토리는 건드리지 않고 장식만 갱신한다.
    useEffect(() => {
      editor?.view.dispatch(editor.state.tr);
    }, [placeholder, editor]);

    // 툴바·onStateChange가 아는 상태 — 결과가 같으면 tiptap가 리렌더를 건너뛴다.
    const state = useEditorState({
      editor,
      selector: ({ editor }) =>
        editor
          ? {
              formats: activeFormats(editor),
              canUndo: editor.can().undo(),
              canRedo: editor.can().redo(),
              chars: editor.state.doc.textContent.length,
            }
          : {
              formats: [] as EditorFormat[],
              canUndo: false,
              canRedo: false,
              chars: 0,
            },
    });
    const ready = editor !== null;

    useEffect(() => {
      onStateChangeRef.current?.({
        ready,
        formats: state.formats,
        canUndo: state.canUndo,
        canRedo: state.canRedo,
        chars: state.chars,
      });
    }, [ready, state]);

    const runFormat = useCallback(
      (format: EditorFormat) => {
        if (!editor) return;
        applyEditorFormat(editor.chain().focus(), format);
      },
      [editor],
    );

    const runCommand = useCallback(
      (command: EditorCommand) => {
        if (!editor) return;
        applyEditorCommand(editor.chain().focus(), command);
      },
      [editor],
    );

    const setMarkdown = useCallback(
      (markdown: string) => {
        if (!editor) return;
        // 문서 교체 직후 undo 히스토리 초기화 — setContent가 한 단계로 기록되어
        // 첫 undo가 교체 이전 문서로 되돌리는 것을 막는다(네이티브 번들과 같은 결함).
        editor.commands.setContent(markdown, {
          contentType: "markdown",
          emitUpdate: false,
        });
        editor.view.updateState(
          EditorState.create({
            doc: editor.state.doc,
            plugins: editor.state.plugins,
          }),
        );
      },
      [editor],
    );

    useImperativeHandle(
      ref,
      () => ({ setMarkdown, runFormat, runCommand }),
      [setMarkdown, runFormat, runCommand],
    );

    return (
      <View className={cn("flex flex-col", className)}>
        {toolbar ? (
          <EditorToolbar
            formats={state.formats}
            canUndo={state.canUndo}
            canRedo={state.canRedo}
            disabled={!ready}
            onFormat={runFormat}
            onCommand={runCommand}
          />
        ) : null}
        <EditorContent editor={editor} className="tiptap flex-1" />
      </View>
    );
  },
);
MarkdownEditor.displayName = "MarkdownEditor";

export { MarkdownEditor };
