import { forwardRef } from "react";
import {
  View,
  type BridgeViewRef,
  type ViewProps,
} from "@unikit-bridge/ui/primitives";
import {
  BoldIcon,
  CodeIcon,
  Heading1Icon,
  Heading2Icon,
  ItalicIcon,
  ListIcon,
  ListOrderedIcon,
  Redo2Icon,
  StrikethroughIcon,
  TextQuoteIcon,
  Undo2Icon,
} from "@unikit-bridge/ui/primitives";

import { cn } from "../lib/utils";

import { Button } from "./button";
import { Separator } from "./separator";
import { ToggleGroup, ToggleGroupItem } from "./toggle-group";

export const EDITOR_FORMATS = [
  "bold",
  "italic",
  "strike",
  "h1",
  "h2",
  "bulletList",
  "orderedList",
  "quote",
  "code",
] as const;

export type EditorFormat = (typeof EDITOR_FORMATS)[number];

export type EditorCommand = "undo" | "redo";

export type RnToWebViewMessage =
  | { type: "init"; markdown: string; dark: boolean; placeholder?: string }
  | { type: "set"; markdown: string }
  | { type: "theme"; dark: boolean }
  | { type: "placeholder"; placeholder: string }
  | { type: "format"; format: EditorFormat }
  | { type: "command"; command: EditorCommand };

export type WebViewToRnMessage =
  | { type: "ready" }
  | { type: "change"; markdown: string; chars: number }
  | { type: "state"; formats: string[]; canUndo?: boolean; canRedo?: boolean; chars?: number };

export type EditorCommandChain = {
  focus(): EditorCommandChain;
  toggleBold(): EditorCommandChain;
  toggleItalic(): EditorCommandChain;
  toggleStrike(): EditorCommandChain;
  toggleHeading(attributes: { level: number }): EditorCommandChain;
  toggleBulletList(): EditorCommandChain;
  toggleOrderedList(): EditorCommandChain;
  toggleBlockquote(): EditorCommandChain;
  toggleCodeBlock(): EditorCommandChain;
  undo(): EditorCommandChain;
  redo(): EditorCommandChain;
  run(): boolean | void;
};

export const applyEditorFormat = (
  chain: EditorCommandChain,
  format: EditorFormat,
): void => {
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
};

export const applyEditorCommand = (
  chain: EditorCommandChain,
  command: EditorCommand,
): void => {
  if (command === "undo") chain.undo().run();
  else chain.redo().run();
};

export type EditorFormatState = {
  isActive: (name: string, attributes?: Record<string, unknown>) => boolean;
};

export const activeFormats = (editor: EditorFormatState): EditorFormat[] =>
  (
    [
      ["bold", editor.isActive("bold")],
      ["italic", editor.isActive("italic")],
      ["strike", editor.isActive("strike")],
      ["h1", editor.isActive("heading", { level: 1 })],
      ["h2", editor.isActive("heading", { level: 2 })],
      ["bulletList", editor.isActive("bulletList")],
      ["orderedList", editor.isActive("orderedList")],
      ["quote", editor.isActive("blockquote")],
      ["code", editor.isActive("codeBlock")],
    ] as const
  )
    .filter(([, on]) => on)
    .map(([name]) => name);

const TEXT_FORMATS: readonly EditorFormat[] = ["bold", "italic", "strike"];
const BLOCK_FORMATS: readonly EditorFormat[] = [
  "h1",
  "h2",
  "bulletList",
  "orderedList",
  "quote",
  "code",
];

export type EditorToolbarProps = ViewProps & {

  formats?: string[];

  onFormat?: (format: EditorFormat) => void;

  onCommand?: (command: EditorCommand) => void;

  canUndo?: boolean;

  canRedo?: boolean;

  disabled?: boolean;
};

const EditorToolbar = forwardRef<BridgeViewRef, EditorToolbarProps>(
  (
    {
      className,
      formats = [],
      onFormat,
      onCommand,
      canUndo = true,
      canRedo = true,
      disabled,
      ...props
    },
    ref,
  ) => {

    const handleFormatsChange =
      (members: readonly EditorFormat[]) => (next: string[]) => {
        const current = formats.filter((v) => members.includes(v as EditorFormat));
        const added = next.find((v) => !current.includes(v));
        const removed = current.find((v) => !next.includes(v));
        const changed = (added ?? removed) as EditorFormat | undefined;
        if (changed) onFormat?.(changed);
      };

    return (
      <View
        ref={ref}

        className={cn("flex flex-row flex-wrap items-center gap-2", className)}
        {...props}
      >
        <Button
          variant="ghost"
          size="icon-sm"
          disabled={disabled || !canUndo}
          onPress={() => onCommand?.("undo")}
          accessibilityLabel="되돌리기"
        >
          <Undo2Icon className="text-foreground" />
        </Button>
        <Button
          variant="ghost"
          size="icon-sm"
          disabled={disabled || !canRedo}
          onPress={() => onCommand?.("redo")}
          accessibilityLabel="다시 실행"
        >
          <Redo2Icon className="text-foreground" />
        </Button>
        <Separator orientation="vertical" className="h-6" />
        <ToggleGroup
          type="multiple"
          variant="outline"
          size="sm"
          disabled={disabled}
          value={formats.filter((v) => TEXT_FORMATS.includes(v as EditorFormat))}
          onValueChange={handleFormatsChange(TEXT_FORMATS)}
          accessibilityLabel="글자 서식"
        >
          <ToggleGroupItem value="bold" accessibilityLabel="굵게">
            <BoldIcon className="text-foreground" />
          </ToggleGroupItem>
          <ToggleGroupItem value="italic" accessibilityLabel="기울임">
            <ItalicIcon className="text-foreground" />
          </ToggleGroupItem>
          <ToggleGroupItem value="strike" accessibilityLabel="취소선">
            <StrikethroughIcon className="text-foreground" />
          </ToggleGroupItem>
        </ToggleGroup>
        <Separator orientation="vertical" className="h-6" />
        <ToggleGroup
          type="multiple"
          variant="outline"
          size="sm"
          disabled={disabled}
          value={formats.filter((v) => BLOCK_FORMATS.includes(v as EditorFormat))}
          onValueChange={handleFormatsChange(BLOCK_FORMATS)}
          accessibilityLabel="블록 서식"
        >
          <ToggleGroupItem value="h1" accessibilityLabel="제목 1">
            <Heading1Icon className="text-foreground" />
          </ToggleGroupItem>
          <ToggleGroupItem value="h2" accessibilityLabel="제목 2">
            <Heading2Icon className="text-foreground" />
          </ToggleGroupItem>
          <ToggleGroupItem value="bulletList" accessibilityLabel="불릿 목록">
            <ListIcon className="text-foreground" />
          </ToggleGroupItem>
          <ToggleGroupItem value="orderedList" accessibilityLabel="번호 목록">
            <ListOrderedIcon className="text-foreground" />
          </ToggleGroupItem>
          <ToggleGroupItem value="quote" accessibilityLabel="인용">
            <TextQuoteIcon className="text-foreground" />
          </ToggleGroupItem>
          <ToggleGroupItem value="code" accessibilityLabel="코드 블록">
            <CodeIcon className="text-foreground" />
          </ToggleGroupItem>
        </ToggleGroup>
      </View>
    );
  },
);
EditorToolbar.displayName = "EditorToolbar";

export { EditorToolbar };
