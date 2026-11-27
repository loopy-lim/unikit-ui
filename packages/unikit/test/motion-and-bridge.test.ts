import { afterEach, describe, expect, test } from "bun:test";
import { createElement, forwardRef } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { Select as WebSelect, Slot as WebSlot, TextInput as WebTextInput, View as WebView } from "../src/bridge/web";
import {
  detectOverlayMotionPreset,
  detectTailwindAnimatePreset,
  extractUniversalTransform,
  getMotionDriver,
  hasNativeTransitionClass,
  parseDurationMs,
  parseNativeTransitionSpec,
  parseRotateDeg,
  setMotionDriver,
  subscribeMotionDriver,
  type NativeMotionDriver,
} from "../src/bridge/motion-registry";

describe("bridge motion-registry helpers", () => {
  afterEach(() => {
    setMotionDriver(null);
  });

  test("detectOverlayMotionPreset matches unikit-* tokens and skips web:-prefixed tokens", () => {
    expect(detectOverlayMotionPreset("bg-background unikit-dialog-in p-4")).toBe(
      "dialog",
    );
    expect(detectOverlayMotionPreset("unikit-sheet-in-right")).toBe(
      "sheet-right",
    );
    expect(detectOverlayMotionPreset("unikit-sheet-in-bottom")).toBe(
      "sheet-bottom",
    );
    expect(detectOverlayMotionPreset("unikit-toast-in")).toBe("toast");
    expect(detectOverlayMotionPreset("web:unikit-popover-in")).toBeNull();
    expect(detectOverlayMotionPreset(undefined)).toBeNull();
  });

  test("hasNativeTransitionClass ignores web:-prefixed transition classes", () => {
    expect(hasNativeTransitionClass("transition-transform duration-200")).toBe(
      true,
    );
    expect(hasNativeTransitionClass("transition-all")).toBe(true);
    expect(hasNativeTransitionClass("web:transition-colors web:duration-150")).toBe(
      false,
    );
    expect(hasNativeTransitionClass("bg-primary rounded-md")).toBe(false);
  });

  test("parseNativeTransitionSpec parses properties, duration, delay, and timing", () => {
    expect(
      parseNativeTransitionSpec(
        "transition-colors duration-300 delay-75 ease-out",
      ),
    ).toEqual({
      properties: ["backgroundColor", "borderColor"],
      durationMs: 300,
      delayMs: 75,
      timing: "ease-out",
    });

    expect(parseNativeTransitionSpec("transition-transform ease-linear")).toEqual({
      properties: ["transform"],
      durationMs: 150,
      delayMs: 0,
      timing: "linear",
    });

    expect(parseNativeTransitionSpec("transition-all transition-none")).toBeNull();
    expect(parseNativeTransitionSpec("web:transition-all")).toBeNull();
  });

  test("detectTailwindAnimatePreset parses standard animate-* classes", () => {
    expect(detectTailwindAnimatePreset("animate-spin size-4")).toBe("spin");
    expect(detectTailwindAnimatePreset("animate-pulse")).toBe("pulse");
    expect(detectTailwindAnimatePreset("animate-bounce")).toBe("bounce");
    expect(detectTailwindAnimatePreset("animate-ping")).toBe("ping");
    expect(detectTailwindAnimatePreset("animate-spin animate-none")).toBeNull();
    expect(detectTailwindAnimatePreset("web:animate-spin")).toBeNull();
  });

  test("parseDurationMs returns the last unprefixed duration-<ms> or fallback", () => {
    expect(parseDurationMs("transition-all duration-300")).toBe(300);
    expect(parseDurationMs("duration-150 duration-500")).toBe(500);
    expect(parseDurationMs("web:duration-700", 200)).toBe(200);
    expect(parseDurationMs(undefined, 220)).toBe(220);
  });

  test("parseRotateDeg parses positive and negative rotate-* classes", () => {
    expect(parseRotateDeg("rotate-90 text-foreground")).toBe(90);
    expect(parseRotateDeg("-rotate-45")).toBe(-45);
    expect(parseRotateDeg("rotate-180 -rotate-180")).toBe(-180);
    expect(parseRotateDeg("web:rotate-90")).toBeNull();
  });

  test("extractUniversalTransform separates translateX/Y, scale, rotate from restStyle", () => {
    const empty = extractUniversalTransform(undefined);
    expect(empty.hasTransformShorthand).toBe(false);
    expect(empty.restStyle).toBeUndefined();

    const extracted = extractUniversalTransform({
      translateX: 14,
      translateY: -6,
      scale: 0.95,
      rotate: "90deg",
      opacity: 0.8,
    });
    expect(extracted.hasTransformShorthand).toBe(true);
    expect(extracted.translateX).toBe(14);
    expect(extracted.translateY).toBe(-6);
    expect(extracted.scale).toBe(0.95);
    expect(extracted.rotate).toBe("90deg");
    expect(extracted.restStyle).toEqual({ opacity: 0.8 });

    const onlyTransform = extractUniversalTransform({ translateY: 12 });
    expect(onlyTransform.hasTransformShorthand).toBe(true);
    expect(onlyTransform.restStyle).toBeUndefined();
  });

  // BridgeStyle 퍼센트 차원 계약(잔여 RN 갭 감사 후속) — % 문자열은 양 브리지
  // 스타일 해석기(resolveWebStyle·resolveNativeStyle)가 공유하는 이 추출기를
  // 거치며, 나머지 키는 건드리지 않는다. 웹 DOM 반영은 아래 WebView 렌더로 검증.
  test("extractUniversalTransform keeps percent dimension strings untouched in restStyle", () => {
    const extracted = extractUniversalTransform({
      height: "50%",
      width: "100%",
      maxHeight: "75%",
    });
    expect(extracted.hasTransformShorthand).toBe(false);
    expect(extracted.restStyle).toEqual({
      height: "50%",
      width: "100%",
      maxHeight: "75%",
    });
  });

  test("motion driver registry notifies subscribers on setMotionDriver", () => {
    expect(getMotionDriver()).toBeNull();
    let notifications = 0;
    const unsub = subscribeMotionDriver(() => {
      notifications += 1;
    });

    const stubDriver: NativeMotionDriver = {
      AnimatedView: () => null,
      Backdrop: () => null,
      LoopRotate: () => null,
      LoopPulse: () => null,
    };

    setMotionDriver(stubDriver);
    expect(getMotionDriver()).toBe(stubDriver);
    expect(notifications).toBe(1);

    unsub();
    setMotionDriver(null);
    expect(getMotionDriver()).toBeNull();
    expect(notifications).toBe(1);
  });
});

describe("bridge Slot — radix asChild 상당(bridge/slot.ts 공유 구현)", () => {
  // 병합 결과 탐침 — forwardRef라 props·ref 전달이 React 18·19 양쪽에서 확실하다
  //（렌더 시점에 캡처해, 합성된 핸들러·ref는 테스트 본문에서 직접 호출한다）.
  let capturedProps: Record<string, unknown> = {};
  let capturedRef: unknown = null;
  const SlotProbe = forwardRef<unknown, Record<string, unknown>>(
    function SlotProbe(props, ref) {
      capturedProps = props;
      capturedRef = ref;
      return createElement("span", null, "probe");
    },
  );

  const renderProbe = (
    slotProps: Record<string, unknown>,
    childProps: Record<string, unknown>,
  ) =>
    renderToStaticMarkup(
      createElement(WebSlot, slotProps, createElement(SlotProbe, childProps)),
    );

  test("renders the child element itself with merged className (no wrapper)", () => {
    const markup = renderToStaticMarkup(
      createElement(
        WebSlot,
        { className: "rounded-md", "aria-expanded": false },
        createElement("span", { className: "font-medium" }, "Open"),
      ),
    );
    expect(markup).toMatch(/^<span/);
    expect(markup).toContain("rounded-md");
    expect(markup).toContain("font-medium");
    expect(markup).toContain('aria-expanded="false"');
  });

  test("className merges via cn — token conflicts resolve to the child", () => {
    renderProbe(
      { className: "p-2 rounded-md" },
      { className: "p-4 bg-background" },
    );
    const merged = capturedProps.className as string;
    expect(merged).toContain("p-4");
    expect(merged).not.toContain("p-2");
    expect(merged).toContain("rounded-md");
    expect(merged).toContain("bg-background");
  });

  test("composes documented handlers child-first with both firing", () => {
    const handlerNames = [
      "onPress",
      "onLongPress",
      "onHoverIn",
      "onHoverOut",
      "onFocus",
      "onBlur",
      "onKeyDown",
      "onContextMenu",
    ] as const;
    const calls: string[] = [];
    const slotHandlers: Record<string, (...args: unknown[]) => unknown> = {};
    const childHandlers: Record<string, (...args: unknown[]) => unknown> = {};
    for (const name of handlerNames) {
      childHandlers[name] = (...args: unknown[]) => {
        calls.push(`child:${name}:${String(args[0])}`);
        return `child-result:${name}`;
      };
      slotHandlers[name] = (...args: unknown[]) => {
        calls.push(`slot:${name}`);
        return `slot-result:${name}`;
      };
    }
    renderProbe(slotHandlers, childHandlers);

    const expected: string[] = [];
    for (const name of handlerNames) {
      const merged = capturedProps[name] as (...args: unknown[]) => unknown;
      const result = merged("evt");
      // 반환값은 자식 것 — radix mergeProps 규칙 그대로.
      expect(result).toBe(`child-result:${name}`);
      expected.push(`child:${name}:evt`, `slot:${name}`);
    }
    expect(calls).toEqual(expected);
  });

  test("passes a slot-only handler through and keeps a child-only handler", () => {
    const slotOnly = () => {};
    const childOnly = () => {};
    renderProbe({ onPress: slotOnly }, { onHoverIn: childOnly });
    expect(capturedProps.onPress).toBe(slotOnly);
    expect(capturedProps.onHoverIn).toBe(childOnly);
  });

  test("forwards the slot ref and the child element ref to the same node", () => {
    const slotRef = { current: null as unknown };
    const childRef = { current: null as unknown };
    renderProbe({ ref: slotRef }, { ref: childRef });
    expect(typeof capturedRef).toBe("function");
    const node = { kind: "trigger-node" };
    (capturedRef as (node: unknown) => void)(node);
    expect(slotRef.current).toBe(node);
    expect(childRef.current).toBe(node);
  });

  test("plain props: child-defined keys win, slot-only keys pass through", () => {
    renderProbe(
      { nativeID: "slot-id", disabled: true, "aria-expanded": true },
      { nativeID: "child-id", disabled: false },
    );
    expect(capturedProps.nativeID).toBe("child-id");
    expect(capturedProps.disabled).toBe(false);
    expect(capturedProps["aria-expanded"]).toBe(true);
  });

  test("style objects merge one level deep with child winning keys", () => {
    renderProbe(
      { style: { margin: 4, padding: 2 } },
      { style: { padding: 8 } },
    );
    expect(capturedProps.style).toEqual({ margin: 4, padding: 8 });
  });

  test("aria-describedby id lists from both sides are concatenated", () => {
    renderProbe(
      { "aria-describedby": "tooltip-content" },
      { "aria-describedby": "field-hint field-hint" },
    );
    expect(capturedProps["aria-describedby"]).toBe("field-hint tooltip-content");
  });

  test("nested Slot elements keep merge rules down to the innermost child", () => {
    // SidebarMenuButton asChild + tooltip 조합과 동일 구조 — 외부 Slot(트리거)이
    // 내부 Slot(메뉴 버튼) 요소를 cloneElement로 병합해도 규칙이 유지된다.
    const markup = renderToStaticMarkup(
      createElement(
        WebSlot,
        { className: "p-2", "aria-expanded": true },
        createElement(
          WebSlot,
          { className: "p-4" },
          createElement("span", { className: "font-medium" }, "x"),
        ),
      ),
    );
    expect(markup).toContain("p-4");
    expect(markup).not.toContain("p-2");
    expect(markup).toContain("font-medium");
    expect(markup).toContain('aria-expanded="true"');
  });

  test("throws a clear error for non-element or multiple children", () => {
    expect(() =>
      renderToStaticMarkup(createElement(WebSlot, null, "plain text")),
    ).toThrow(/Slot/);
    expect(() =>
      renderToStaticMarkup(
        createElement(
          WebSlot,
          null,
          createElement("span"),
          createElement("span"),
        ),
      ),
    ).toThrow(/Slot/);
  });

  test("renders nothing without throwing when children are absent", () => {
    expect(renderToStaticMarkup(createElement(WebSlot, { className: "x" }))).toBe("");
  });
});

describe("web bridge contract mappings (잔여 RN 갭 감사 후속)", () => {
  // 참고: 이 환경의 renderToStaticMarkup은 알려진 camelCase 속성을 그대로
  // 내보내므로(autoComplete·inputMode 실측) 대소문자 무시로 단언한다 — 브리지의
  // 책임은 prop을 DOM 요소에 전달하는 것까지고, 속성 직렬화 대소문자는
  // React DOM 렌더러가 소유한다.
  test("TextInput maps autoComplete onto the DOM input attribute", () => {
    const html = renderToStaticMarkup(
      createElement(WebTextInput, { autoComplete: "one-time-code" }),
    );
    expect(html).toMatch(/^<input/);
    expect(html.toLowerCase()).toContain('autocomplete="one-time-code"');
  });

  test("TextInput maps autoComplete onto the multiline textarea branch too", () => {
    const html = renderToStaticMarkup(
      createElement(WebTextInput, { multiline: true, autoComplete: "off" }),
    );
    expect(html).toMatch(/^<textarea/);
    expect(html.toLowerCase()).toContain('autocomplete="off"');
  });

  test("View passes percent style strings through to the DOM style attribute", () => {
    const html = renderToStaticMarkup(
      createElement(WebView, {
        style: { height: "50%", width: "100%" },
      }),
    );
    expect(html).toContain("height:50%");
    expect(html).toContain("width:100%");
  });

  // SelectProps 폼 연동（잔여 RN 갭 감사 후속） — 웹 <select> 전달 검증.
  // 속성 직렬화 대소문자는 위 autoComplete 경우와 같은 이유로 무시 단언.
  test("web Select forwards form-integration props onto the <select> element", () => {
    const html = renderToStaticMarkup(
      createElement(WebSelect, {
        name: "country",
        required: true,
        tabIndex: -1,
        ariaHidden: true,
      }),
    );
    expect(html).toMatch(/^<select/);
    expect(html.toLowerCase()).toContain('name="country"');
    expect(html).toContain("required");
    expect(html.toLowerCase()).toContain('tabindex="-1"');
    expect(html).toContain('aria-hidden="true"');
  });
});
