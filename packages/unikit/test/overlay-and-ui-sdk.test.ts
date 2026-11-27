import { afterEach, describe, expect, test } from "bun:test";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { toggle } from "@ui-sdk/core/toggle";
import { commit, subscribe, unwatched } from "@ui-sdk/core/renderer";
import { computeOverlayPosition, computeOverlayPositionWithPlacement } from "../src/lib/overlay";
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

  test("computeOverlayPositionWithPlacement flips top to bottom near viewport top and clamps center align", () => {
    (globalThis as Record<string, unknown>).window = {
      innerWidth: 390,
      innerHeight: 844,
    };

    const nearTop = computeOverlayPositionWithPlacement(
      { x: 40, y: 20, w: 100, h: 40 },
      { w: 200, h: 180 },
      { placement: "top", align: "center", offset: 8 },
    );
    // spaceAbove(4) < spaceBelow(768) → 전환. center 정렬 left(-10)는 패딩 8로 클램프.
    expect(nearTop.placement).toBe("bottom");
    expect(nearTop.top).toBe(20 + 40 + 8);
    expect(nearTop.left).toBe(8);
  });

  test("computeOverlayPositionWithPlacement flips right and left sides horizontally", () => {
    (globalThis as Record<string, unknown>).window = {
      innerWidth: 390,
      innerHeight: 844,
    };

    const rightNearEdge = computeOverlayPositionWithPlacement(
      { x: 340, y: 300, w: 40, h: 36 },
      { w: 150, h: 80 },
      { placement: "right", align: "start", offset: 8 },
    );
    // spaceRight(-6) < spaceLeft(324) → 전환
    expect(rightNearEdge.placement).toBe("left");
    expect(rightNearEdge.left).toBe(340 - 150 - 8);
    expect(rightNearEdge.top).toBe(300);

    const leftNearEdge = computeOverlayPositionWithPlacement(
      { x: 10, y: 300, w: 40, h: 36 },
      { w: 150, h: 80 },
      { placement: "left", align: "start", offset: 8 },
    );
    // spaceLeft(-6) < spaceRight(324) → 전환
    expect(leftNearEdge.placement).toBe("right");
    expect(leftNearEdge.left).toBe(10 + 40 + 8);
    expect(leftNearEdge.top).toBe(300);
  });

  test("computeOverlayPositionWithPlacement keeps preferred side when it fits or the opposite is tighter", () => {
    (globalThis as Record<string, unknown>).window = {
      innerWidth: 390,
      innerHeight: 844,
    };

    // 오른쪽 여유 충분(spaceRight 234 ≥ 150) — 전환 없음
    const fitsRight = computeOverlayPositionWithPlacement(
      { x: 100, y: 300, w: 40, h: 36 },
      { w: 120, h: 80 },
      { placement: "right", align: "center", offset: 8 },
    );
    expect(fitsRight.placement).toBe("right");
    expect(fitsRight.left).toBe(100 + 40 + 8);
    expect(fitsRight.top).toBe(300 + (36 - 80) / 2);

    // 어느 쪽도 못 들어가고 반대편(spaceAbove 284)이 더 좁음 — 전환 없이
    // 메인 축 클램프 폴백: top 348 → 844-600-8 = 236
    const bothOverflow = computeOverlayPositionWithPlacement(
      { x: 45, y: 300, w: 100, h: 40 },
      { w: 200, h: 600 },
      { placement: "bottom", align: "start", offset: 8 },
    );
    expect(bothOverflow.placement).toBe("bottom");
    expect(bothOverflow.top).toBe(844 - 600 - 8);
    expect(bothOverflow.left).toBe(45);
  });

  test("computeOverlayPosition keeps the legacy left/top-only result shape", () => {
    (globalThis as Record<string, unknown>).window = {
      innerWidth: 390,
      innerHeight: 844,
    };

    const legacy = computeOverlayPosition(
      { x: 40, y: 20, w: 100, h: 40 },
      { w: 200, h: 180 },
      { placement: "top", align: "center", offset: 8 },
    );
    expect(legacy).toEqual({ left: 8, top: 20 + 40 + 8 });
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
