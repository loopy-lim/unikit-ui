import { describe, expect, test } from "bun:test";
import { getValue, NodeResolver } from "@a2ui/web_core";

import {
  createUnikitCatalog,
  createUnikitOptionalComponents,
  createUnikitTierAComponents,
  createUnikitTierBComponents,
  createUnikitTierCComponents,
  UNIKIT_CATALOG_ID,
} from "../src/a2ui/index";
import { createA2uiProcessor } from "../src/a2ui/runtime";

const UNIKIT_SLUGS = [
  "accordion",
  "alert",
  "alert-dialog",
  "aspect-ratio",
  "attachment",
  "avatar",
  "badge",
  "breadcrumb",
  "bubble",
  "button-group",
  "button",
  "calendar",
  "card",
  "carousel",
  "chart",
  "checkbox",
  "collapsible",
  "combobox",
  "command",
  "context-menu",
  "dialog",
  "direction",
  "drawer",
  "dropdown-menu",
  "editor-toolbar",
  "empty",
  "field",
  "form",
  "hover-card",
  "input-group",
  "input-otp",
  "input",
  "item",
  "kbd",
  "label",
  "marker",
  "menubar",
  "message-scroller",
  "message",
  "native-select",
  "navigation-menu",
  "pagination",
  "popover",
  "progress",
  "radio-group",
  "resizable",
  "scroll-area",
  "select",
  "separator",
  "sheet",
  "sidebar",
  "skeleton",
  "slider",
  "sonner",
  "spinner",
  "switch",
  "table",
  "tabs",
  "textarea",
  "toggle-group",
  "toggle",
  "tooltip",
];

describe("unikit a2ui catalog composition", () => {
  test("tier factories expose disjoint rosters", () => {
    const tiers = [
      ...createUnikitTierAComponents(),
      ...createUnikitTierBComponents(),
      ...createUnikitTierCComponents(),
    ];
    const names = tiers.map((component) => component.unikit);
    expect(new Set(names).size).toBe(names.length);
  });

  test("full catalog maps all 62 unikit components", () => {
    const catalog = createUnikitCatalog({ extras: ["chart", "form"] });
    const bySlug = new Map(
      [...catalog.components.values()].map((component) => [component.unikit, component.name]),
    );
    const covered = UNIKIT_SLUGS.map((slug) => bySlug.get(slug));
    const missing = covered.filter((name) => name === undefined);
    expect(missing).toEqual([]);
    expect(catalog.components.size).toBe(74);
    expect(new Set([...catalog.components.keys()]).size).toBe(74);
  });

  test("chart and form stay opt-in", () => {
    const base = createUnikitCatalog();
    expect(base.components.size).toBe(72);
    expect([...base.components.values()].map((component) => component.unikit)).not.toContain("chart");
    expect([...base.components.values()].map((component) => component.unikit)).not.toContain("form");
    expect(createUnikitOptionalComponents()).toHaveLength(2);
  });

  test("catalog serializes with instructions and identity", () => {
    const json = createUnikitCatalog({ extras: ["chart"] }).toJson() as {
      components: Record<string, { name: string }>;
      instructions?: string;
    };
    expect(json.instructions).toContain("62");
    expect(json.components["Chart"]).toBeDefined();
    expect(json.components["Form"]).toBeUndefined();
  });
});

describe("unikit a2ui catalog runtime", () => {
  const actions: Array<{ name: string; src: string }> = [];
  const runtime = createA2uiProcessor([createUnikitCatalog()], {
    onAction: (action) => {
      actions.push({ name: action.name, src: action.sourceComponentId });
    },
  });

  test("Tier A·B·C 노드가 한 서피스에서 해석된다", () => {
    const errors = runtime.process([
      {
        version: "1.0",
        createSurface: {
          surfaceId: "mix",
          catalogId: UNIKIT_CATALOG_ID,
          components: [
            {
              id: "root",
              component: "Column",
              children: ["intro", "table", "pick", "menuButton", "tip"],
            },
            { id: "intro", component: "Text", text: "혼합 서피스" },
            {
              id: "table",
              component: "Table",
              caption: "주간 방문",
              columns: [
                { label: "요일", key: "day" },
                { label: "방문", key: "visits" },
              ],
              rows: [
                { day: "월", visits: 12 },
                { day: "화", visits: 19 },
              ],
            },
            {
              id: "pick",
              component: "Select",
              label: "요일",
              placeholder: "선택해요",
              options: [
                { label: "월", value: "mon" },
                { label: "화", value: "tue" },
              ],
              value: { "@path": "/mix/day" },
              action: { event: { name: "dayPicked" } },
            },
            {
              id: "menuButton",
              component: "Button",
              child: "menuLabel",
              action: { event: { name: "menu" } },
            },
            { id: "menuLabel", component: "Text", text: "메뉴" },
            { id: "tip", component: "Tooltip", trigger: "menuButton", label: "열기" },
          ],
        },
      },
    ]);
    expect(errors).toEqual([]);
    const surface = runtime.getSurface("mix")!;
    const resolver = new NodeResolver(surface);
    const root = getValue(resolver.rootNode)!;
    const children = getValue(root.props).children as Array<{
      type: string;
      componentId: string;
      props: Record<string, unknown>;
    }>;
    const byId = new Map(children.map((child) => [child.componentId, child]));
    expect(byId.get("table")?.type).toBe("Table");
    expect(byId.get("pick")?.type).toBe("Select");
    expect(byId.get("tip")?.type).toBe("Tooltip");
    resolver.dispose();
  });

  test("Select 바인딩이 데이터 모델에 반영된다", () => {
    const surface = runtime.getSurface("mix")!;
    const resolver = new NodeResolver(surface);
    const root = getValue(resolver.rootNode)!;
    const children = getValue(root.props).children as Array<{
      componentId: string;
      props: Record<string, unknown>;
    }>;
    const pick = children.find((child) => child.componentId === "pick")!;
    const binding = getValue(pick.props as never).value as unknown as {
      value: unknown;
      set(value: string): void;
    };
    expect(binding.value).toBeUndefined();
    binding.set("tue");
    expect(surface.dataModel.get("/mix/day")).toBe("tue");
    resolver.dispose();
  });

  runtime.dispose();
});
