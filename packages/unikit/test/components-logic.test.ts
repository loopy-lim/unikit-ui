import { describe, expect, test } from "bun:test";
import {
  computeDrawerDragOffset,
  shouldDismissDrawer,
} from "../src/components/drawer";
import { matchesCalendarDate } from "../src/components/calendar";
import { buildChartScale } from "../src/components/chart";

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
