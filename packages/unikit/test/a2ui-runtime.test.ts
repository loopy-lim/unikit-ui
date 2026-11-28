import { describe, expect, test } from "bun:test";
import { getValue, NodeResolver } from "@a2ui/web_core";

import { createUnikitCatalog } from "../src/a2ui/catalog";
import { A2UI_DEMO_MESSAGES } from "../src/a2ui/demo";
import { createA2uiBasicFunctions } from "../src/a2ui/functions";
import { createA2uiProcessor } from "../src/a2ui/runtime";
import { UNIKIT_CATALOG_ID } from "../src/a2ui/types";

const received: Array<Record<string, unknown>> = [];
const processor = createA2uiProcessor([createUnikitCatalog()], {
  onAction: (action) => {
    received.push({ name: action.name, src: action.sourceComponentId });
  },
});

function demoChildren(): Array<{ type: string; componentId: string; props: Record<string, unknown> }> {
  const surface = processor.getSurface("demo")!;
  const resolver = new NodeResolver(surface);
  const root = getValue(resolver.rootNode)!;
  const children = getValue(root.props).children as Array<{
    type: string;
    componentId: string;
    props: Record<string, unknown>;
  }>;
  resolver.dispose();
  return children;
}

test("데모 메시지가 오류 없이 처리된다", () => {
  const errors = processor.process(A2UI_DEMO_MESSAGES);
  expect(errors).toEqual([]);
  const surface = processor.getSurface("demo");
  expect(surface).toBeDefined();
  expect(surface?.defaultCatalog?.id).toBe(UNIKIT_CATALOG_ID);
});

test("루트 노드가 Column으로 확인된다", () => {
  const surface = processor.getSurface("demo");
  const resolver = new NodeResolver(surface!);
  const root = getValue(resolver.rootNode);
  expect(root?.type).toBe("Column");
  expect(root?.state).toBe("resolved");
  expect(root?.componentId).toBe("root");
  resolver.dispose();
});

test("formatString이 데이터 모델을 보간한다", () => {
  const children = demoChildren();
  const greeting = children.find((child) => child.componentId === "greeting")!;
  const text = (getValue(greeting.props as never) as Record<string, unknown>).text;
  expect(getValue(text as never)).toBe("안녕하세요, UniKit님!");
});

test("CheckBox 값이 쓰기 가능 바인딩으로 확인된다", () => {
  const surface = processor.getSurface("demo")!;
  const resolver = new NodeResolver(surface);
  const root = getValue(resolver.rootNode)!;
  const children = getValue(root.props).children as Array<{ componentId: string; props: Record<string, unknown> }>;
  const agreeCheck = children.find((child) => child.componentId === "agreeCheck")!;
  expect(agreeCheck.type).toBe("CheckBox");
  const binding = getValue(agreeCheck.props as never).value as unknown as {
    value: unknown;
    set(value: boolean): void;
  };
  expect(binding.value).toBe(false);
  binding.set(true);
  expect(surface.dataModel.get("/form/agreed")).toBe(true);
  resolver.dispose();
});

test("버튼 액션이 onAction으로 발화한다", () => {
  const surface = processor.getSurface("demo")!;
  const resolver = new NodeResolver(surface);
  const root = getValue(resolver.rootNode)!;
  const children = getValue(root.props).children as Array<{
    componentId: string;
    props: Record<string, unknown>;
  }>;
  const submitRow = children.find((child) => child.componentId === "submitRow")!;
  const submit = (getValue(submitRow.props as never) as { children: Array<{ props: unknown }> }).children[0];
  const action = (getValue(submit.props as never) as Record<string, unknown>).action;
  expect(typeof action).toBe("function");
  (action as () => void)();
  expect(received.at(-1)).toMatchObject({ name: "submitted", src: "submit" });
  resolver.dispose();
});

test("required 검증이 실패 결과를 만든다", () => {
  const functions = createA2uiBasicFunctions();
  const required = functions.find((fn) => fn.name === "required");
  const result = required?.execute({ value: "" }, {} as never) as { valid: boolean; message?: string };
  expect(result.valid).toBe(false);
  expect(result.message).toBe("This field is required.");
});

test("formatDate가 ISO 값을 패턴으로 포맷한다", () => {
  const functions = createA2uiBasicFunctions();
  const formatDate = functions.find((fn) => fn.name === "formatDate");
  const result = formatDate?.execute({ value: "2026-01-16T14:30:00Z", format: "MMM dd, yyyy" }, {} as never);
  expect(result).toBe("Jan 16, 2026");
});

test("deleteSurface가 서피스를 제거한다", () => {
  processor.process([{ version: "1.0", deleteSurface: { surfaceId: "demo" } }]);
  expect(processor.getSurface("demo")).toBeUndefined();
});
