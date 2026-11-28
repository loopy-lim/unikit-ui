import { describe, expect, test } from "bun:test";
import { createElement, forwardRef } from "react";
import { renderToStaticMarkup } from "react-dom/server";

import { Text as WebText } from "../src/bridge/web";
import {
  computeDrawerDragOffset,
  shouldDismissDrawer,
} from "../src/components/drawer";
import { matchesCalendarDate } from "../src/components/calendar";
import { buildChartScale } from "../src/components/chart";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "../src/components/accordion";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "../src/components/collapsible";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "../src/components/tabs";
import { Calendar } from "../src/components/calendar";
import { DirectionProvider } from "../src/components/direction";
import {
  ContextMenu,
  ContextMenuSub,
  ContextMenuSubTrigger,
  ContextMenuTrigger,
} from "../src/components/context-menu";
import {
  DropdownMenu,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "../src/components/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../src/components/select";
import {
  HoverCard,
  HoverCardTrigger,
} from "../src/components/hover-card";
import { Popover, PopoverTrigger } from "../src/components/popover";
import {
  SidebarMenuButton,
  SidebarProvider,
} from "../src/components/sidebar";
import { Tooltip, TooltipTrigger } from "../src/components/tooltip";
import { Badge } from "../src/components/badge";
import {
  CardAction,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../src/components/card";
import {
  AlertDialog,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogMedia,
  AlertDialogTitle,
} from "../src/components/alert-dialog";
import { Input } from "../src/components/input";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "../src/components/input-otp";
import {
  ScrollArea,
  ScrollBar,
} from "../src/components/scroll-area";
import { nextThumbValue, Slider } from "../src/components/slider";

describe("component pure helpers", () => {
  test("drawer drag offset tracks forward direction and rubber-bands opposite pulls", () => {
    expect(computeDrawerDragOffset("bottom", 0, 90)).toBe(90);
    expect(computeDrawerDragOffset("bottom", 0, -50)).toBeCloseTo(-9, 5);

    expect(computeDrawerDragOffset("top", 0, -100)).toBe(-100);
    expect(computeDrawerDragOffset("top", 0, 50)).toBeCloseTo(9, 5);

    expect(computeDrawerDragOffset("right", 60, 0)).toBe(60);
    expect(computeDrawerDragOffset("right", -50, 0)).toBeCloseTo(-9, 5);

    expect(computeDrawerDragOffset("left", -60, 0)).toBe(-60);
    expect(computeDrawerDragOffset("left", 50, 0)).toBeCloseTo(9, 5);
  });

  test("drawer dismiss threshold uses distance > 80px or velocity > 0.5 with distance > 24px", () => {
    expect(shouldDismissDrawer("bottom", 0, 81, 0, 0)).toBe(true);
    expect(shouldDismissDrawer("bottom", 0, 30, 0, 0.7)).toBe(true);
    expect(shouldDismissDrawer("bottom", 0, 20, 0, 0.9)).toBe(false);

    expect(shouldDismissDrawer("top", 0, -85, 0, 0)).toBe(true);
    expect(shouldDismissDrawer("left", -32, 0, -0.6, 0)).toBe(true);
    expect(shouldDismissDrawer("right", 50, 0, 0.1, 0)).toBe(false);
  });

  test("nextThumbValue maps arrows/Home/End and returns null for unconsumed keys", () => {
    expect(nextThumbValue("ArrowRight", 40, 0, 100, 1)).toBe(41);
    expect(nextThumbValue("ArrowLeft", 40, 0, 100, 1)).toBe(39);

    expect(nextThumbValue("ArrowUp", 40, 0, 100, 1)).toBe(41);
    expect(nextThumbValue("ArrowDown", 40, 0, 100, 1)).toBe(39);
    expect(nextThumbValue("Home", 40, 0, 100, 1)).toBe(0);
    expect(nextThumbValue("End", 40, 0, 100, 1)).toBe(100);
    expect(nextThumbValue("Enter", 40, 0, 100, 1)).toBeNull();
    expect(nextThumbValue("Tab", 40, 0, 100, 1)).toBeNull();

    expect(nextThumbValue("ArrowRight", 40, 0, 100, 0)).toBe(41);
  });

  test("matchesCalendarDate supports Date, ranges, before/after, arrays, and predicates", () => {
    const target = new Date(2026, 10, 15);
    const sameDayOtherHour = new Date(2026, 10, 15, 19, 30);

    expect(matchesCalendarDate(target, sameDayOtherHour)).toBe(true);
    expect(matchesCalendarDate(target, new Date(2026, 10, 16))).toBe(false);
    expect(
      matchesCalendarDate(target, {
        from: new Date(2026, 10, 10),
        to: new Date(2026, 10, 20),
      }),
    ).toBe(true);
    expect(matchesCalendarDate(target, { before: new Date(2026, 10, 15) })).toBe(
      false,
    );
    expect(matchesCalendarDate(target, { before: new Date(2026, 10, 16) })).toBe(
      true,
    );
    expect(matchesCalendarDate(target, { after: new Date(2026, 10, 14) })).toBe(
      true,
    );
    expect(
      matchesCalendarDate(target, [
        new Date(2026, 10, 1),
        (d) => d.getDate() === 15,
      ]),
    ).toBe(true);
  });

  test("buildChartScale handles negative series values and computes zeroY inside plot", () => {
    const scale = buildChartScale(
      [
        { label: "Q1", profit: -30 },
        { label: "Q2", profit: 60 },
      ],
      ["profit"],
      320,
      200,
    );

    expect(scale.yMin).toBeLessThan(0);
    expect(scale.yMax).toBeGreaterThan(0);
    const zeroY = scale.yAt(0);
    expect(zeroY).toBeGreaterThan(scale.plotTop);
    expect(zeroY).toBeLessThan(scale.plotTop + scale.plotHeight);
    expect(scale.yAt(scale.yMax)).toBeCloseTo(scale.plotTop, 5);
    expect(scale.yAt(scale.yMin)).toBeCloseTo(
      scale.plotTop + scale.plotHeight,
      5,
    );
  });
});

describe("trigger asChild — 브리지 Slot 소비（잔여 RN 갭 감사 후속）", () => {
  test("popover trigger asChild merges linkage onto the child element", () => {
    const markup = renderToStaticMarkup(
      createElement(
        Popover,
        null,
        createElement(
          PopoverTrigger,
          { asChild: true },
          createElement(WebText, { className: "font-medium" }, "Open"),
        ),
      ),
    );

    expect(markup).toContain("<span");
    expect(markup).not.toContain("<button");
    expect(markup).toContain('role="button"');
    expect(markup).toContain('aria-expanded="false"');
    expect(markup).toContain("aria-controls=");

    expect(markup).toContain("font-medium");
  });

  test("popover trigger without asChild keeps the fixed Pressable wrapper", () => {
    const markup = renderToStaticMarkup(
      createElement(
        Popover,
        null,
        createElement(PopoverTrigger, null, "Open"),
      ),
    );
    expect(markup).toContain("<button");
    expect(markup).toContain('role="button"');
    expect(markup).toContain('aria-expanded="false"');
  });

  test("popover trigger asChild runs the child handler first, then the toggle", () => {
    const order: string[] = [];
    let mergedOnPress: (() => unknown) | undefined;
    const Probe = forwardRef<unknown, Record<string, unknown>>(
      function Probe(props, _ref) {
        mergedOnPress = props.onPress as () => unknown;
        return createElement("span", null, "Open");
      },
    );
    renderToStaticMarkup(
      createElement(
        Popover,
        { defaultOpen: false, onOpenChange: (open) => order.push(`open:${open}`) },
        createElement(
          PopoverTrigger,
          { asChild: true },
          createElement(Probe, {
            onPress: () => {
              order.push("child");
            },
          }),
        ),
      ),
    );
    expect(typeof mergedOnPress).toBe("function");
    mergedOnPress?.();

    expect(order).toEqual(["child", "open:true"]);
  });

  test("tooltip trigger asChild renders the child without wrapper or stale describedby", () => {
    const markup = renderToStaticMarkup(
      createElement(
        Tooltip,
        null,
        createElement(
          TooltipTrigger,
          { asChild: true },
          createElement(WebText, null, "Tip me"),
        ),
      ),
    );
    expect(markup).toContain("<span");
    expect(markup).not.toContain("<button");

    expect(markup).not.toContain("aria-describedby");
  });

  test("hover-card trigger asChild merges linkage onto the child element", () => {
    const markup = renderToStaticMarkup(
      createElement(
        HoverCard,
        null,
        createElement(
          HoverCardTrigger,
          { asChild: true },
          createElement(WebText, null, "Author"),
        ),
      ),
    );
    expect(markup).toContain("<span");
    expect(markup).not.toContain("<button");
    expect(markup).toContain('role="button"');
    expect(markup).toContain('aria-expanded="false"');
    expect(markup).toContain("aria-controls=");
  });

  test("sidebar menu button asChild merges variants onto the child element", () => {
    const markup = renderToStaticMarkup(
      createElement(
        SidebarProvider,
        null,
        createElement(
          SidebarMenuButton,
          { asChild: true },
          createElement(WebText, { className: "font-medium" }, "Menu"),
        ),
      ),
    );
    expect(markup).toContain("<span");
    expect(markup).not.toContain("<button");
    expect(markup).toContain('role="button"');

    expect(markup).toContain("font-medium");
    expect(markup).toContain("rounded-md");
  });

  test("sidebar menu button without asChild keeps the fixed Pressable render", () => {
    const markup = renderToStaticMarkup(
      createElement(
        SidebarProvider,
        null,
        createElement(SidebarMenuButton, null, "Menu"),
      ),
    );
    expect(markup).toContain("<button");
    expect(markup).toContain('role="button"');
  });
});

describe("menu and select controlled open state", () => {

  const ariaExpandedOf = (markup: string): string | undefined =>
    markup.match(/aria-expanded="([^"]*)"/)?.[1];

  test("dropdown-menu root reflects controlled open, defaultOpen, and uncontrolled closed", () => {
    const closed = renderToStaticMarkup(
      createElement(
        DropdownMenu,
        null,
        createElement(DropdownMenuTrigger, null, "Menu"),
      ),
    );
    expect(ariaExpandedOf(closed)).toBe("false");

    const controlled = renderToStaticMarkup(
      createElement(
        DropdownMenu,
        { open: true },
        createElement(DropdownMenuTrigger, null, "Menu"),
      ),
    );
    expect(ariaExpandedOf(controlled)).toBe("true");

    const defaultOpen = renderToStaticMarkup(
      createElement(
        DropdownMenu,
        { defaultOpen: true },
        createElement(DropdownMenuTrigger, null, "Menu"),
      ),
    );
    expect(ariaExpandedOf(defaultOpen)).toBe("true");
  });

  test("dropdown-menu sub accepts controlled open/defaultOpen (radix Sub API parity)", () => {
    const controlled = renderToStaticMarkup(
      createElement(
        DropdownMenu,
        null,
        createElement(
          DropdownMenuSub,
          { open: true },
          createElement(DropdownMenuSubTrigger, null, "Sub"),
        ),
      ),
    );
    expect(ariaExpandedOf(controlled)).toBe("true");

    const defaultOpen = renderToStaticMarkup(
      createElement(
        DropdownMenu,
        null,
        createElement(
          DropdownMenuSub,
          { defaultOpen: true },
          createElement(DropdownMenuSubTrigger, null, "Sub"),
        ),
      ),
    );
    expect(ariaExpandedOf(defaultOpen)).toBe("true");

    const closed = renderToStaticMarkup(
      createElement(
        DropdownMenu,
        null,
        createElement(
          DropdownMenuSub,
          null,
          createElement(DropdownMenuSubTrigger, null, "Sub"),
        ),
      ),
    );
    expect(ariaExpandedOf(closed)).toBe("false");
  });

  test("context-menu root and sub accept controlled open/defaultOpen", () => {
    const rootControlled = renderToStaticMarkup(
      createElement(
        ContextMenu,
        { open: true },
        createElement(ContextMenuTrigger, null, "Target"),
      ),
    );
    expect(ariaExpandedOf(rootControlled)).toBe("true");

    const rootDefault = renderToStaticMarkup(
      createElement(
        ContextMenu,
        { defaultOpen: true },
        createElement(ContextMenuTrigger, null, "Target"),
      ),
    );
    expect(ariaExpandedOf(rootDefault)).toBe("true");

    const subControlled = renderToStaticMarkup(
      createElement(
        ContextMenu,
        null,
        createElement(
          ContextMenuSub,
          { open: true },
          createElement(ContextMenuSubTrigger, null, "Sub"),
        ),
      ),
    );
    expect(ariaExpandedOf(subControlled)).toBe("true");

    const subDefault = renderToStaticMarkup(
      createElement(
        ContextMenu,
        null,
        createElement(
          ContextMenuSub,
          { defaultOpen: true },
          createElement(ContextMenuSubTrigger, null, "Sub"),
        ),
      ),
    );
    expect(ariaExpandedOf(subDefault)).toBe("true");
  });

  test("select root reflects controlled open and defaultOpen on the trigger", () => {
    const trigger = (openProps: Record<string, unknown>) =>
      renderToStaticMarkup(
        createElement(
          Select,
          openProps,
          createElement(SelectTrigger, null, createElement(SelectValue)),
          createElement(
            SelectContent,
            null,
            createElement(SelectItem, { value: "a" }, "A"),
          ),
        ),
      );

    expect(ariaExpandedOf(trigger({}))).toBe("false");
    expect(ariaExpandedOf(trigger({ open: true }))).toBe("true");
    expect(ariaExpandedOf(trigger({ defaultOpen: true }))).toBe("true");
  });

  test("select name renders a web-only hidden native select mirroring item labels", () => {
    const markup = renderToStaticMarkup(
      createElement(
        Select,
        { name: "country", defaultValue: "fr", required: true },
        createElement(SelectTrigger, null, createElement(SelectValue)),
        createElement(
          SelectContent,
          null,
          createElement(SelectItem, { value: "kr" }, "South Korea"),
          createElement(SelectItem, { value: "fr" }, "France"),
        ),
      ),
    );

    expect(markup).toContain("<select");
    expect(markup).toContain('class="sr-only"');
    expect(markup).toContain('name="country"');
    expect(markup).toContain('required=""');
    expect(markup).toContain('tabindex="-1"');
    expect(markup).toContain('aria-hidden="true"');

    expect(markup).toContain('<option value="kr">South Korea</option>');
    expect(markup).toContain('<option value="fr" selected="">France</option>');
    expect(markup).toContain('selected=""');

    const withElementChildren = renderToStaticMarkup(
      createElement(
        Select,
        { name: "mixed" },
        createElement(SelectTrigger, null, createElement(SelectValue)),
        createElement(
          SelectContent,
          null,
          createElement(SelectItem, { value: "plain" }, "Plain"),
          createElement(
            SelectItem,
            { value: "rich" },
            createElement("span", null, "Rich"),
          ),
        ),
      ),
    );
    expect(withElementChildren).toContain('<option value="rich">rich</option>');

    const withoutName = renderToStaticMarkup(
      createElement(
        Select,
        null,
        createElement(SelectTrigger, null, createElement(SelectValue)),
        createElement(
          SelectContent,
          null,
          createElement(SelectItem, { value: "kr" }, "South Korea"),
        ),
      ),
    );
    expect(withoutName).not.toContain("<select");
  });
});

describe("slider per-thumb focus and aria", () => {
  test("thumbs are individual slider stops with own values; root is a group", () => {
    const markup = renderToStaticMarkup(
      createElement(Slider, {
        defaultValue: [25, 75],
        accessibilityLabel: "밝기",
      }),
    );

    expect(markup.match(/role="group"/g)).toHaveLength(1);

    expect(markup.match(/role="slider"/g)).toHaveLength(2);
    expect(markup).toContain('aria-valuenow="25"');
    expect(markup).toContain('aria-valuenow="75"');
    expect(markup).toContain('aria-valuemin="0"');
    expect(markup).toContain('aria-valuemax="100"');

    expect(markup.match(/aria-label="밝기"/g)).toHaveLength(2);

    expect(markup.match(/tabindex="0"/g)).toHaveLength(2);
  });

  test("disabled slider removes thumbs from the tab order", () => {
    const markup = renderToStaticMarkup(
      createElement(Slider, { defaultValue: [50], disabled: true }),
    );
    expect(markup).toContain('tabindex="-1"');
    expect(markup).not.toContain('tabindex="0"');
  });
});

describe("small-component parity ports (잔여 갭 해소)", () => {
  test("badge interactive (onPress) renders Pressable with the original link-hover/focus classes; static stays a View", () => {
    const interactive = renderToStaticMarkup(
      createElement(Badge, { onPress: () => {} }, "New"),
    );
    expect(interactive).toContain("<button");
    expect(interactive).toContain('role="link"');

    expect(interactive).toContain("web:hover:bg-primary/90");
    expect(interactive).toContain("web:focus-visible:ring-3");

    const linkVariant = renderToStaticMarkup(
      createElement(Badge, { variant: "link", onPress: () => {} }, "Docs"),
    );
    expect(linkVariant).toContain("web:hover:underline");

    const ghostVariant = renderToStaticMarkup(
      createElement(Badge, { variant: "ghost", onPress: () => {} }, "Ghost"),
    );

    expect(ghostVariant).toContain("web:hover:text-accent-foreground");

    const plain = renderToStaticMarkup(createElement(Badge, null, "New"));
    expect(plain).toContain("<div");
    expect(plain).not.toContain("web:hover:bg-primary/90");
    expect(plain).not.toContain("web:focus-visible:ring-3");
  });

  test("card header with CardAction switches to the end-aligned action row, text block stays a column", () => {
    const withAction = renderToStaticMarkup(
      createElement(
        CardHeader,
        null,
        createElement(CardTitle, null, "제목"),
        createElement(CardDescription, null, "설명"),
        createElement(CardAction, null, "액션"),
      ),
    );
    expect(withAction).toContain("justify-between");

    expect(withAction.indexOf("액션")).toBeGreaterThan(
      withAction.indexOf("제목"),
    );

    const plain = renderToStaticMarkup(
      createElement(CardHeader, null, createElement(CardTitle, null, "제목")),
    );
    expect(plain).not.toContain("justify-between");
    expect(plain).toContain("제목");
  });

  test("alert-dialog header lays media beside the text block at sm (default size) and stacks without media", () => {
    const beside = renderToStaticMarkup(
      createElement(
        AlertDialog,
        null,
        createElement(
          AlertDialogHeader,
          null,
          createElement(AlertDialogMedia, null),
          createElement(AlertDialogTitle, null, "제목"),
          createElement(AlertDialogDescription, null, "설명"),
        ),
      ),
    );

    expect(beside).toContain("sm:flex-row");
    expect(beside).toContain("sm:gap-6");
    expect(beside).toContain("sm:self-start");
    expect(beside.indexOf("bg-muted")).toBeLessThan(beside.indexOf("제목"));

    const stacked = renderToStaticMarkup(
      createElement(
        AlertDialog,
        null,
        createElement(
          AlertDialogHeader,
          null,
          createElement(AlertDialogTitle, null, "제목"),
        ),
      ),
    );
    expect(stacked).not.toContain("sm:flex-row");
  });

  test("input type=file flows to the DOM input with the original file: tokens; native path is web-gated", () => {
    const file = renderToStaticMarkup(createElement(Input, { type: "file" }));
    expect(file).toContain('type="file"');
    expect(file).toContain("file:h-7");
    expect(file).toContain("file:text-foreground");

    const plain = renderToStaticMarkup(createElement(Input, null));
    expect(plain).not.toContain('type="file"');
    expect(plain).not.toContain("file:");
  });

  test("input-otp passes autoComplete through to the hidden single input", () => {
    const markup = renderToStaticMarkup(
      createElement(
        InputOTP,
        { maxLength: 6, autoComplete: "one-time-code" },
        createElement(
          InputOTPGroup,
          null,
          createElement(InputOTPSlot, { index: 0 }),
        ),
      ),
    );
    expect(markup).toContain('autoComplete="one-time-code"');
  });

  test("scroll-area renders the custom vertical bar on web, hides the browser bar, and hoists consumer ScrollBar out of the scroll content", () => {
    const markup = renderToStaticMarkup(
      createElement(
        ScrollArea,
        { className: "h-40" },
        "내용",
        createElement(ScrollBar, { orientation: "horizontal" }),
      ),
    );

    expect(markup).toContain("w-2.5");
    expect(markup).toContain("h-2.5");

    expect(markup).toContain("scrollbar-width:none");

    expect(markup.indexOf("내용")).toBeLessThan(markup.indexOf("h-2.5"));
  });

  test("scroll-area ScrollBar standalone (outside a ScrollArea) renders nothing", () => {
    expect(renderToStaticMarkup(createElement(ScrollBar, null))).toBe("");
  });
});

describe("height-collapse presence and calendar selection motion", () => {

  const hasCollapseWrapper = (markup: string): boolean =>
    markup.includes("web:transition-all");

  test("collapsible content mounts with the transition wrapper when open and renders nothing when closed", () => {
    const open = renderToStaticMarkup(
      createElement(
        Collapsible,
        { defaultOpen: true },
        createElement(CollapsibleTrigger, null, "트리거"),
        createElement(CollapsibleContent, null, "본문"),
      ),
    );

    expect(hasCollapseWrapper(open)).toBe(true);
    expect(open).not.toContain("height:0");
    expect(open).toContain("본문");

    const closed = renderToStaticMarkup(
      createElement(
        Collapsible,
        null,
        createElement(CollapsibleTrigger, null, "트리거"),
        createElement(CollapsibleContent, null, "본문"),
      ),
    );
    expect(hasCollapseWrapper(closed)).toBe(false);
    expect(closed.includes("본문")).toBe(false);
  });

  test("accordion renders only the open item's content inside the transition wrapper", () => {
    const item = (value: string, label: string) =>
      createElement(
        AccordionItem,
        { value },
        createElement(AccordionTrigger, null, label),
        createElement(AccordionContent, null, `${label} 본문`),
      );
    const markup = renderToStaticMarkup(
      createElement(
        Accordion,
        { defaultValue: "b" },
        item("a", "A"),
        item("b", "B"),
      ),
    );
    expect(hasCollapseWrapper(markup)).toBe(true);
    expect(markup).toContain("B 본문");
    expect(markup.includes("A 본문")).toBe(false);
  });

  test("tabs renders only the active panel inside the transition wrapper", () => {
    const markup = renderToStaticMarkup(
      createElement(
        Tabs,
        { defaultValue: "a" },
        createElement(
          TabsList,
          null,
          createElement(TabsTrigger, { value: "a" }, "A"),
          createElement(TabsTrigger, { value: "b" }, "B"),
        ),
        createElement(TabsContent, { value: "a" }, "패널 A"),
        createElement(TabsContent, { value: "b" }, "패널 B"),
      ),
    );
    expect(hasCollapseWrapper(markup)).toBe(true);
    expect(markup).toContain('role="tabpanel"');
    expect(markup).toContain("패널 A");
    expect(markup.includes("패널 B")).toBe(false);
  });

  test("calendar selection layer pops on the selected day (scale/opacity) and not others", () => {
    const markup = renderToStaticMarkup(
      createElement(Calendar, { selected: new Date() }),
    );

    expect(markup).toContain("scale(1)");
    expect(markup).toContain("opacity:1");

    expect(markup).toContain("scale(0.75)");
    expect(markup).toContain("opacity:0");
    expect(markup).toContain("bg-primary");
  });

  test("calendar rotates prev/next arrows under RTL via useDirection", () => {
    const ltr = renderToStaticMarkup(
      createElement(DirectionProvider, { dir: "ltr" },
        createElement(Calendar, { selected: new Date() }),
      ),
    );
    expect(ltr.includes("rotate-180")).toBe(false);

    const rtl = renderToStaticMarkup(
      createElement(DirectionProvider, { direction: "rtl" },
        createElement(Calendar, { selected: new Date() }),
      ),
    );

    expect(rtl.match(/rotate-180/g)?.length).toBe(2);
  });
});
