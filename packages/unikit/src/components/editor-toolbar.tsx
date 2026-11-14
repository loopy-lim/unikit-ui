// EditorToolbar — tiptap 위지윅 에디터 툴바(UniKit 자작 — shadcn 원본 없음).
// 설계 판단(사이클 94):
// - 에디터 엔진을 통째로 라이브러리에 녹이면 DOM 전용 ProseMirror 때문에 네이티브는
//   WebView 번들을 라이브러리가 떠안게 된다 — 엔진 소유는 앱(웹=tiptap 직접,
//   네이티브=WebView 브리지)으로 남기고, 이 컴포넌트는 보이는 층(툴바)과
//   포맷·커맨드 계약만 공유한다(chart의 엔진 peerDep 절충과 같은 결론).
// - tiptap 런타임 의존 0 — activeFormats 매개변수는 isActive만 구조 타이핑한다
//   (tiptap Editor가 이를 만족한다). peer 의존·번들을 늘리지 않는다.
// - 글자·블록 두 ToggleGroup이 같은 formats 상태를 나눠 쓰므로, 값 diff로 눌린
//   항목 하나를 뽑는 로직을 내부에 둔다(도그푸딩 앱 2종에 중복이던 로직의 단일 출처).
// - 본문 타이포그래피(제목·목록·인용·코드 스타일)는 이 컴포넌트 범위 밖 —
//   패키지 export editor-prose.css(hsl(var(--*)) 시맨틱 토큰만 사용)가 담당한다.
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

/** 툴바가 다루는 서식 9종 — tiptap 확장명이 아니라 앱↔툴바 계약 값. */
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

/** 실행 취소·다시 실행 — 토글 상태가 없는 한 번 실행 커맨드. */
export type EditorCommand = "undo" | "redo";

/** RN ↔ WebView 에디터 브리지 메시지 — WebView 안 tiptap 앱과 한 쌍으로 쓴다. */
export type RnToWebViewMessage =
  | { type: "init"; markdown: string; dark: boolean }
  | { type: "theme"; dark: boolean }
  | { type: "format"; format: EditorFormat }
  | { type: "command"; command: EditorCommand };

export type WebViewToRnMessage =
  | { type: "ready" }
  | { type: "change"; markdown: string }
  | { type: "state"; formats: string[]; canUndo?: boolean; canRedo?: boolean };

/** tiptap Editor의 isActive만 구조 타이핑 — 런타임 의존 없이 계약만 빌린다. */
export type EditorFormatState = {
  isActive: (name: string, attributes?: Record<string, unknown>) => boolean;
};

/** 커서 위치의 활성 서식 산출 — transaction마다 호출해 툴바 value로 쓴다. */
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

export type EditorToolbarProps = ViewProps & {
  /** 활성 포맷 — activeFormats(editor) 결과를 그대로 전달한다 */
  formats?: string[];
  /** 서식 항목 눌림 — 토글된 항목 하나를 전달 */
  onFormat?: (format: EditorFormat) => void;
  /** undo/redo 실행 */
  onCommand?: (command: EditorCommand) => void;
  /** 실행 취소 가능 여부(기본 true — 하위 호환) */
  canUndo?: boolean;
  /** 다시 실행 가능 여부(기본 true — 하위 호환) */
  canRedo?: boolean;
  /** 툴바 전체 차단 */
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
    // multiple 그룹의 value diff — 한 번 눌린 항목만 onFormat으로 흘린다.
    // members 안에서만 diff를 본다(두 ToggleGroup이 같은 formats 상태를 나눠 쓴다).
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
        // flex-wrap — 좁은 화면(모바일)에서는 두 그룹이 2행으로 나뉘어 11버튼
        // 전체가 화면 안에 보인다(사이클 94 G4: 스크롤 은닉으로 3종이 안 보였다).
        // 넓은 화면(웹)은 1행 그대로.
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
