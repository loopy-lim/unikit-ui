import { describe, expect, test } from "bun:test";
import { readFileSync } from "node:fs";

const read = (path: string) => readFileSync(new URL(`../src/a2ui/${path}`, import.meta.url)).toString();

const viewSources: Array<[string, string]> = [
  ["views", read("views.tsx")],
  ["catalog-basic", read("catalog-basic.tsx")],
  ["unikit-a", read("unikit-a.tsx")],
  ["unikit-b", read("unikit-b.tsx")],
  ["unikit-c", read("unikit-c.tsx")],
  ["views-optional", read("views-optional.tsx")],
];

function jsxBlocks(source: string, tag: string): string[] {
  const blocks: string[] = [];
  const re = new RegExp(`<${tag}(?:\\s[^>]*)?>`, "g");
  let match: RegExpExecArray | null;
  while ((match = re.exec(source))) {
    const close = source.indexOf(`</${tag}>`, match.index);
    if (close >= 0) blocks.push(source.slice(match.index, close + tag.length + 3));
  }
  return blocks;
}

const RENDER_CALL = /context\.(child|children|render)\(/;

describe("a2ui 전경색 계약", () => {
  test("렌더러가 전경 오버라이드 컨텍스트를 내보낸다", () => {
    const source = read("renderer.tsx");
    expect(source).toContain("export const A2uiTextForegroundContext");
    expect(source).toContain("export function A2uiTextForeground(");
    expect(source).toContain("export function useA2uiTextForeground(");
  });

  test("마크다운 텍스트가 전경 오버라이드를 우선 적용한다", () => {
    const source = read("views.tsx");
    expect(source).toContain("useA2uiTextForeground()");
    expect(source).toContain('fg ?? "text-foreground"');
    expect(source).toContain('fg ?? "text-muted-foreground"');
  });

  test("Button 뷰가 variant 전경을 하위 텍스트에 공급한다", () => {
    const source = read("views.tsx");
    const buttonBlocks = jsxBlocks(source, "Button");
    const view = buttonBlocks.find((block) => RENDER_CALL.test(block));
    expect(view).toBeDefined();
    expect(view).toContain("A2uiTextForeground");
    expect(view).toContain("buttonTextVariants");
  });

  test("Bubble 뷰가 평문 추출로 BubbleContent 전경을 유지한다", () => {
    const source = read("unikit-a.tsx");
    const bubbleBlocks = jsxBlocks(source, "BubbleContent");
    const view = bubbleBlocks.find((block) => RENDER_CALL.test(block) || block.includes("childrenText"));
    expect(view).toBeDefined();
    expect(view).toContain("childrenText");
  });

  test("Tooltip 뷰가 컴포넌트 전경 변형을 사용한다", () => {
    const source = read("unikit-c.tsx");
    expect(source).not.toContain("text-popover-foreground");
    const tooltipBlocks = jsxBlocks(source, "TooltipContent");
    const view = tooltipBlocks.find((block) => block.includes("context.text("));
    expect(view).toBeDefined();
    expect(view).toContain("tooltipContentTextVariants");
  });

  test.each([
    ["ContextMenuItem", "destructive"],
    ["DropdownMenuItem", "destructive"],
    ["MenubarItem", "destructive"],
  ])("%s 뷰가 destructive 항목에 destructive 전경을 쓴다", (tag) => {
    const source = read("unikit-c.tsx");
    const blocks = jsxBlocks(source, tag);
    const view = blocks.find((block) => block.includes("{item.label}"));
    expect(view).toBeDefined();
    expect(view).toContain('item.destructive ? "text-destructive"');
  });

  test("진한 배경 컨테이너 안 직접 child 렌더는 전경 공급을 동반한다", () => {
    const darkBgTags = ["Button", "BubbleContent", "TooltipContent", "AlertDialogAction"];
    for (const [name, source] of viewSources) {
      for (const tag of darkBgTags) {
        for (const block of jsxBlocks(source, tag)) {
          if (!RENDER_CALL.test(block)) continue;
          expect(
            block.includes("A2uiTextForeground") || block.includes("childrenText"),
            `${name}의 <${tag}> 블록이 전경 공급 없이 하위 노드를 렌더합니다`,
          ).toBe(true);
        }
      }
    }
  });
});
