"use client";

import { MarkdownEditor } from "@unikit-bridge/ui/editor";
import { Text, View } from "@unikit-bridge/ui/primitives";

import type { ShowcaseDemo } from "./types";

const SAMPLE = `# 마크다운 에디터

**굵게** · *기울임* · ~~취소선~~을 직접 눌러 보세요.

- 불릿 목록
- 툴바의 H1/H2로 제목을 바꿔 보세요

> 인용문과 \`코드 블록\`도 지원해요.
`;

// editor 데모 — npm 전용 진입점 @unikit-bridge/ui/editor(chart와 같은 배포 형태,
// registry 미등록). 내장 툴바(기본값)로 열리는 마크다운 위지윅 에디터예요.
export const editorDemo: ShowcaseDemo = {
  Demo: function EditorDemo() {
    return (
      <View className="flex w-full flex-col gap-3">
        <MarkdownEditor
          className="min-h-64 rounded-md border border-border"
          initialMarkdown={SAMPLE}
        />
        <Text className="font-sans text-xs text-muted-foreground">
          웹은 tiptap이 직접 마운트되고, 네이티브는 WebView로 같은 계약을 써요.
        </Text>
      </View>
    );
  },
  code: `import { MarkdownEditor } from "@unikit-bridge/ui/editor";

// 내장 툴바(기본) — 웹은 tiptap 직접, 네이티브는 WebView+동봉 번들
<MarkdownEditor
  initialMarkdown="# 제목"
  onChange={(markdown) => console.log(markdown)}
/>;
`,
};
