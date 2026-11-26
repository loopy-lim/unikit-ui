import { afterEach, describe, expect, test } from "bun:test";
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
