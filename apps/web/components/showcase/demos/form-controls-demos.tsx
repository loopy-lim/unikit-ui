"use client";

import { useState } from "react";
import {
  Checkbox,
  EditorToolbar,
  RadioGroup,
  RadioGroupItem,
  Switch,
  Textarea,
  Toggle,
  ToggleGroup,
  ToggleGroupItem,
} from "@unikit-bridge/ui";
import { Text, View } from "@unikit-bridge/ui/primitives";
import { Bold, Bookmark, Pin } from "lucide-react";

import type { ShowcaseDemo } from "./types";

export const checkboxDemo: ShowcaseDemo = {
  Demo: function CheckboxDemo() {
    return (
      <View className="flex flex-col gap-3">
        <View className="flex flex-row items-center gap-2">
          <Checkbox defaultChecked accessibilityLabel="이용약관 동의" />
          <Text className="font-sans text-sm text-foreground">
            이용약관에 동의합니다
          </Text>
        </View>
        <View className="flex flex-row items-center gap-2">
          <Checkbox accessibilityLabel="마케팅 수신" />
          <Text className="font-sans text-sm text-foreground">
            마케팅 정보 수신（선택）
          </Text>
        </View>
      </View>
    );
  },
  code: `import { Checkbox } from "@unikit-bridge/ui";

<Checkbox defaultChecked accessibilityLabel="동의" />`,
  examples: [
    {
      title: "Disabled",
      Demo: function CheckboxDisabled() {
        return (
          <View className="flex flex-row items-center gap-2 opacity-60">
            <Checkbox disabled accessibilityLabel="비활성" />
            <Text className="font-sans text-sm text-foreground">비활성</Text>
          </View>
        );
      },
    },
  ],
};

export const radioGroupDemo: ShowcaseDemo = {
  Demo: function RadioGroupDemo() {
    return (
      <RadioGroup defaultValue="email" accessibilityLabel="알림 방법">
        <View className="flex flex-row gap-4">
          <View className="flex flex-row items-center gap-2">
            <RadioGroupItem value="email" />
            <Text className="font-sans text-sm text-foreground">이메일</Text>
          </View>
          <View className="flex flex-row items-center gap-2">
            <RadioGroupItem value="push" />
            <Text className="font-sans text-sm text-foreground">푸시</Text>
          </View>
        </View>
      </RadioGroup>
    );
  },
  code: `import { RadioGroup, RadioGroupItem } from "@unikit-bridge/ui";

<RadioGroup defaultValue="a"><RadioGroupItem value="a" /></RadioGroup>`,
};

export const switchDemo: ShowcaseDemo = {
  Demo: function SwitchDemo() {
    return (
      <View className="w-full gap-4">
        <View className="flex flex-row items-center justify-between gap-4">
          <View className="min-w-0 flex-1 gap-0.5">
            <Text className="font-sans text-sm font-medium text-foreground">
              푸시 알림
            </Text>
            <Text className="font-sans text-xs text-muted-foreground">
              새 메시지와 멘션을 바로 알려줘요.
            </Text>
          </View>
          <Switch defaultChecked accessibilityLabel="푸시 알림" />
        </View>
        <View className="flex flex-row items-center justify-between gap-4">
          <View className="min-w-0 flex-1 gap-0.5">
            <Text className="font-sans text-sm font-medium text-foreground">
              자동 저장
            </Text>
            <Text className="font-sans text-xs text-muted-foreground">
              작성 중인 내용을 임시 저장해요.
            </Text>
          </View>
          <Switch accessibilityLabel="자동 저장" />
        </View>
      </View>
    );
  },
  code: `import { Switch } from "@unikit-bridge/ui";

<Switch defaultChecked accessibilityLabel="푸시 알림" />`,
};

export const toggleDemo: ShowcaseDemo = {
  Demo: function ToggleDemo() {
    return (
      <View className="flex flex-row flex-wrap gap-2">
        <Toggle defaultPressed accessibilityLabel="즐겨찾기">
          <Bookmark className="size-4" />
        </Toggle>
        <Toggle accessibilityLabel="고정">
          <Pin className="size-4" />
        </Toggle>
        <Toggle variant="outline" accessibilityLabel="굵게">
          <Bold className="size-4" />
        </Toggle>
      </View>
    );
  },
  code: `import { Toggle } from "@unikit-bridge/ui";
import { Bookmark } from "lucide-react";

<Toggle accessibilityLabel="즐겨찾기">
  <Bookmark className="size-4" />
</Toggle>`,
};

export const toggleGroupDemo: ShowcaseDemo = {
  Demo: function ToggleGroupDemo() {
    return (
      <ToggleGroup type="single" defaultValue="list">
        <ToggleGroupItem value="list">목록</ToggleGroupItem>
        <ToggleGroupItem value="map">지도</ToggleGroupItem>
      </ToggleGroup>
    );
  },
  code: `import { ToggleGroup, ToggleGroupItem } from "@unikit-bridge/ui";

<ToggleGroup type="single" defaultValue="a">
  <ToggleGroupItem value="a">A</ToggleGroupItem>
</ToggleGroup>`,
};

export const textareaDemo: ShowcaseDemo = {
  Demo: function TextareaDemo() {
    return (
      <Textarea className="w-full" placeholder="메모를 입력해 보세요." />
    );
  },
  code: `import { Textarea } from "@unikit-bridge/ui";

<Textarea placeholder="메모" />`,
};

export const editorToolbarDemo: ShowcaseDemo = {
  Demo: function EditorToolbarDemo() {
    // 툴바 계약 데모 — formats/onFormat/onCommand/canUndo/canRedo를 상태로 연결한다.
    // 실제 에디터 연동(tiptap 엔진)은 도그푸딩 앱(UniKit Markdown)이 담당한다.
    const [history, setHistory] = useState<string[][]>([["bold"]]);
    const [cursor, setCursor] = useState(0);
    const [log, setLog] = useState("onFormat → bold");
    const formats = history[cursor] ?? [];
    const canUndo = cursor > 0;
    const canRedo = cursor < history.length - 1;

    return (
      <View className="flex flex-col items-start gap-3">
        <EditorToolbar
          formats={formats}
          canUndo={canUndo}
          canRedo={canRedo}
          onFormat={(format) => {
            const next = formats.includes(format)
              ? formats.filter((v) => v !== format)
              : [...formats, format];
            const nextHistory = [...history.slice(0, cursor + 1), next];
            setHistory(nextHistory);
            setCursor(nextHistory.length - 1);
            setLog(`onFormat → ${format}`);
          }}
          onCommand={(command) => {
            if (command === "undo" && canUndo) {
              setCursor((c) => c - 1);
            } else if (command === "redo" && canRedo) {
              setCursor((c) => c + 1);
            }
            setLog(`onCommand → ${command}`);
          }}
        />
        <Text className="font-mono text-xs text-muted-foreground">{log}</Text>
      </View>
    );
  },
  code: `import { EditorToolbar, activeFormats } from "@unikit-bridge/ui";
import { useEditorState } from "@tiptap/react";

// tiptap 위지윅 에디터와 연결(엔진은 앱이 소유)
// selector는 editor가 null로 넘어올 수 있어 방어한다(초기 렌더 지연).
const state = useEditorState({
  editor,
  selector: ({ editor }) =>
    editor
      ? {
          formats: activeFormats(editor).join(","),
          canUndo: editor.can().undo(),
          canRedo: editor.can().redo(),
        }
      : { formats: "", canUndo: false, canRedo: false },
});

<EditorToolbar
  formats={state.formats.split(",").filter(Boolean)}
  canUndo={state.canUndo}
  canRedo={state.canRedo}
  disabled={!editor}
  onFormat={runFormat} // 포맷별 toggleBold()/toggleHeading(...) 체인 실행 — 앱 소유
  onCommand={(command) =>
    command === "undo"
      ? editor?.chain().focus().undo().run()
      : editor?.chain().focus().redo().run()
  }
/>`,
  examples: [
    {
      title: "Disabled",
      Demo: function EditorToolbarDisabled() {
        return <EditorToolbar disabled formats={["bold", "h1"]} />;
      },
    },
  ],
};
