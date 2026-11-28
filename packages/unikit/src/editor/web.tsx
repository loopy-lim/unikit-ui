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

    const onChangeRef = useRef(onChange);
    onChangeRef.current = onChange;
    const onStateChangeRef = useRef(onStateChange);
    onStateChangeRef.current = onStateChange;

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

    useEffect(() => {
      editor?.view.dispatch(editor.state.tr);
    }, [placeholder, editor]);

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
