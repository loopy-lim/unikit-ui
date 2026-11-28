import type { EditorCommand, EditorFormat } from "../components/editor-toolbar";

export type MarkdownEditorState = {

  ready: boolean;

  formats: EditorFormat[];
  canUndo: boolean;
  canRedo: boolean;

  chars: number;
};

export type MarkdownEditorHandle = {

  setMarkdown: (markdown: string) => void;
  runFormat: (format: EditorFormat) => void;
  runCommand: (command: EditorCommand) => void;
};

export type MarkdownEditorProps = {

  initialMarkdown?: string;

  onChange?: (markdown: string) => void;

  onStateChange?: (state: MarkdownEditorState) => void;

  placeholder?: string;

  toolbar?: boolean;

  className?: string;
};
