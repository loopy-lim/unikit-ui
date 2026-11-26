import { afterEach, describe, expect, test } from "bun:test";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { toggle } from "@ui-sdk/core/toggle";
import { commit, subscribe, unwatched } from "@ui-sdk/core/renderer";
import { computeOverlayPositionWithPlacement } from "../src/lib/overlay";
import { useSdkSnapshot } from "../src/behaviors/ui-sdk-renderer";

describe("overlay positioning and ui-sdk snapshot subscription", () => {
  const originalWindow = globalThis.window;

  afterEach(() => {
    if (originalWindow === undefined) {
      delete (globalThis as Record<string, unknown>).window;
    } else {
      globalThis.window = originalWindow;
    }
  });

  test("computeOverlayPositionWithPlacement flips bottom to top near viewport bottom and clamps left", () => {
    (globalThis as Record<string, unknown>).window = {
      innerWidth: 390,
      innerHeight: 844,
    };

    const nearBottom = computeOverlayPositionWithPlacement(
      { x: 320, y: 760, w: 80, h: 40 },
      { w: 180, h: 120 },
      { placement: "bottom", align: "start", offset: 8 },
    );
    expect(nearBottom.placement).toBe("top");
    expect(nearBottom.top).toBe(760 - 8 - 120);
    // Clamped to viewportWidth(390) - contentWidth(180) - padding(8) = 202
    expect(nearBottom.left).toBe(202);

    const normalTop = computeOverlayPositionWithPlacement(
      { x: 40, y: 120, w: 100, h: 36 },
      { w: 160, h: 80 },
      { placement: "bottom", align: "center", offset: 6 },
    );
    expect(normalTop.placement).toBe("bottom");
    expect(normalTop.top).toBe(120 + 36 + 6);
    expect(normalTop.left).toBe(40 + (100 - 160) / 2);
  });

  test("useSdkSnapshot reads @ui-sdk/core state across renders and subscribes via kernel", () => {
    const instance = unwatched(() => toggle({ id: "snapshot-probe-toggle" }));
    try {
      const part = instance.part("root", {}, true);
      commit(part as never, {});

      let notifyCount = 0;
      const unsub = subscribe(part as never, () => {
        notifyCount += 1;
      });

      function Probe() {
        const pressed = useSdkSnapshot(
          instance,
          (state) => Boolean((state as { pressed?: boolean }).pressed),
        );
        return createElement("span", null, pressed ? "ON" : "OFF");
      }

      expect(renderToStaticMarkup(createElement(Probe))).toBe("<span>OFF</span>");

      const api = instance.api as { setPressed?: (value: boolean) => void };
      api.setPressed?.(true);
      expect(notifyCount).toBeGreaterThan(0);
      expect(renderToStaticMarkup(createElement(Probe))).toBe("<span>ON</span>");

      unsub();
    } finally {
      instance.destroy();
    }
  });
});
