// chart-logic.test.ts — chart 컴포넌트의 순수 계산 함수 계약(스택 누적·극좌표
// 지오메트리·도메인 매핑·참조선 위치·줌/브러시 사각형)을 검증한다.
// 렌더러·브리지 의존이 없는 순수 함수만 대상(컴포넌트 렌더는
// components-logic.test.ts 관행과 분리 — 이 파일은 chart 전용).
import { describe, expect, test } from "bun:test";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import {
  ChartBarSeries,
  ChartBrush,
  ChartContainer,
  ChartGrid,
  ChartPieSeries,
  ChartRadialSeries,
  ChartReferenceLine,
  ChartXAxis,
  ChartYAxis,
  ChartZoom,
  buildChartScale,
  buildPieArcs,
  buildRadarGeometry,
  buildReferenceLine,
  buildSelectionRect,
  computeBarStackOffsets,
  groupStacks,
  nearestRadarIndex,
  pieIndexAtAngle,
  pixelToBandIndex,
  polarToAngle,
  seriesEffectiveRange,
  stackedTotalsRange,
  yPixelsToDomain,
  type ChartDatum,
} from "../src/components/chart";

const chartData: ChartDatum[] = [
  { month: "1월", desktop: 100, mobile: 60, server: -20 },
  { month: "2월", desktop: 200, mobile: 40, server: -60 },
  { month: "3월", desktop: 300, mobile: 20, server: -10 },
];

// 기본 플롯 박스(320×200, 패딩 좌48 우8 상8 하24) — 계산 근거 공유
const PLOT = { left: 48, top: 8, width: 264, height: 168, bottom: 176, right: 312 };

describe("buildChartScale — 옵션 확장(우측 축 패딩·y 도메인 줌·실효 범위)", () => {
  test("옵션 미지정 시 기존 계약 유지(0 기준 nice 틱 4구간)", () => {
    const scale = buildChartScale(chartData, ["desktop"], 320, 200);
    expect(scale.plotLeft).toBe(PLOT.left);
    expect(scale.plotWidth).toBe(PLOT.width);
    expect(scale.yMin).toBe(0);
    expect(scale.yMax).toBe(400); // niceStep(300/4)=100 → 4스텝
    expect(scale.ticksY).toEqual([0, 100, 200, 300, 400]);
  });

  test("padding 오버라이드 — 우측 y축 라벨 여유(8→48)만 플롯 폭이 줄어든다", () => {
    const scale = buildChartScale(chartData, ["desktop"], 320, 200, {
      padding: { right: 48 },
    });
    expect(scale.plotLeft).toBe(PLOT.left);
    expect(scale.plotWidth).toBe(320 - 48 - 48);
  });

  test("yDomain 오버라이드 — 줌 확정 구간을 그대로 도메인으로 쓰고 틱은 내부 nice 간격", () => {
    const scale = buildChartScale(chartData, ["desktop"], 320, 200, {
      yDomain: { min: 100, max: 300 },
    });
    expect(scale.yMin).toBe(100);
    expect(scale.yMax).toBe(300);
    expect(scale.ticksY).toEqual([100, 150, 200, 250, 300]);
    expect(scale.yAt(100)).toBeCloseTo(PLOT.bottom, 5);
    expect(scale.yAt(300)).toBeCloseTo(PLOT.top, 5);
  });

  test("yDomain ulp 수준 폭 — 틱이 유계하게 계산된다(무한 루프 회귀, 리뷰 후속)", () => {
    // 1.6e12 크기의 값에서 폭 1e-7 — step이 ulp보다 작아 value += step이
    // 정체되던 영역. 인덱스 유계 반복으로 64 이내에 끝나야 한다.
    const base = 1.6e12;
    const scale = buildChartScale([{ x: "a", desktop: base }], ["desktop"], 320, 200, {
      yDomain: { min: base, max: base + 1e-7 },
    });
    expect(scale.ticksY.length).toBeLessThanOrEqual(65);
    for (const tick of scale.ticksY) expect(Number.isFinite(tick)).toBe(true);
  });

  test("yDomain 역순/비정상 구간은 폴백 도메인으로 정규화된다", () => {
    const scale = buildChartScale(chartData, ["desktop"], 320, 200, {
      yDomain: { min: 300, max: 100 },
    });
    expect(scale.yMax).toBeGreaterThan(scale.yMin);
  });

  test("스팬 오버플로 극단값 — RangeError 없이 폴백 도메인으로 내려간다(리뷰 후속)", () => {
    // [-1e308, 1e308] 데이터는 max - min이 Infinity가 되어 stepsCount가
    // Infinity, Array.from가 RangeError를 던지던 경로.
    const negative = buildChartScale(
      [
        { x: "a", desktop: -1e308 },
        { x: "b", desktop: 1e308 },
      ],
      ["desktop"],
      320,
      200,
    );
    expect(Number.isFinite(negative.yMin)).toBe(true);
    expect(Number.isFinite(negative.yMax)).toBe(true);
    expect(negative.ticksY.every(Number.isFinite)).toBe(true);

    // 양수 극단 — max ≥ 약 8.9e307에서 step*4가 Infinity로 오버플로하던 경로.
    const positive = buildChartScale([{ x: "a", desktop: 9e307 }], ["desktop"], 320, 200);
    expect(Number.isFinite(positive.yMax)).toBe(true);
    expect(positive.ticksY.every(Number.isFinite)).toBe(true);
  });

  test("range 오버라이드 — 스택 누적 합계를 실효 최댓값으로 반영한다", () => {
    const plain = buildChartScale(chartData, ["desktop"], 320, 200);
    const stacked = buildChartScale(chartData, ["desktop"], 320, 200, {
      range: { min: 0, max: 500 }, // desktop+mobile 누적 합계 가정
    });
    expect(stacked.yMax).toBeGreaterThan(plain.yMax);
    expect(stacked.yMax).toBe(800); // niceStep(500/4)=125 → 200 → 4스텝
  });

  test("yValueAt — yAt의 역매핑(줌 y 도메인 확정용)", () => {
    const scale = buildChartScale(chartData, ["desktop"], 320, 200);
    expect(scale.yValueAt(PLOT.bottom)).toBeCloseTo(scale.yMin, 5);
    expect(scale.yValueAt(PLOT.top)).toBeCloseTo(scale.yMax, 5);
    for (const value of [0, 137, 289, 400]) {
      expect(scale.yValueAt(scale.yAt(value))).toBeCloseTo(value, 5);
    }
  });
});

describe("스택 누적 — groupStacks·computeBarStackOffsets·범위", () => {
  const stackData: ChartDatum[] = [
    { label: "a", x: 10, y: 5 },
    { label: "b", x: 20, y: -5 },
    { label: "c", x: null, y: 5 },
  ];
  const members = [
    { dataKey: "x", stackId: "s" },
    { dataKey: "y", stackId: "s" },
  ];

  test("groupStacks — stackId별 등장 순서 보존 그룹화", () => {
    const groups = groupStacks([
      { dataKey: "a", stackId: "1" },
      { dataKey: "b", stackId: "2" },
      { dataKey: "c", stackId: "1" },
    ]);
    expect([...groups.keys()]).toEqual(["1", "2"]);
    expect(groups.get("1")).toEqual(["a", "c"]);
    expect(groups.get("2")).toEqual(["b"]);
  });

  test("computeBarStackOffsets — 양수는 위로, 음수는 아래로, 값 없는 행은 null", () => {
    const offsets = computeBarStackOffsets(stackData, members);
    expect(offsets.x).toEqual([
      { base: 0, value: 10 },
      { base: 0, value: 20 },
      null,
    ]);
    // y의 양수는 x 누적 위에 쌓이고, 음수는 0 아래 별도 누적, 갭 인덱스는 독립
    expect(offsets.y).toEqual([
      { base: 10, value: 5 },
      { base: 0, value: -5 },
      { base: 0, value: 5 },
    ]);
  });

  test("computeBarStackOffsets — 서로 다른 stackId는 따로 쌓인다", () => {
    const offsets = computeBarStackOffsets(stackData, [
      { dataKey: "x", stackId: "s1" },
      { dataKey: "y", stackId: "s2" },
    ]);
    expect(offsets.y[0]).toEqual({ base: 0, value: 5 });
  });

  test("stackedTotalsRange — 그룹별 양수 합 최대/음수 합 최소", () => {
    const range = stackedTotalsRange(
      stackData,
      new Map([["s", ["x", "y"]]]),
    );
    expect(range.max).toBe(20); // b행: x=20 단독이 a행 누적(15)보다 크다
    expect(range.min).toBe(-5); // b행: y=-5
  });

  test("seriesEffectiveRange — 비스택 원값과 스택 누적 합계를 결합", () => {
    const range = seriesEffectiveRange(chartData, [
      { dataKey: "desktop", stackId: "s" },
      { dataKey: "mobile", stackId: "s" },
      { dataKey: "server" },
    ]);
    expect(range.max).toBe(320); // desktop+mobile 누적 최대(3월 300+20)
    expect(range.min).toBe(-60); // server 최소
  });
});

describe("buildReferenceLine — 참조선 위치", () => {
  const scale = buildChartScale(chartData, ["desktop"], 320, 200);

  test("x(범주) — 세로선이 해당 밴드 중심에, 라벨 기본 end(위)", () => {
    const geometry = buildReferenceLine({
      axis: "x",
      value: "2월",
      scale,
      data: chartData,
      xKey: "month",
    });
    expect(geometry).not.toBeNull();
    const x = scale.xAt(1);
    expect(geometry?.x1).toBe(x);
    expect(geometry?.x2).toBe(x);
    expect(geometry?.y1).toBe(PLOT.top);
    expect(geometry?.y2).toBe(PLOT.bottom);
    expect(geometry?.labelY).toBe(PLOT.top + 12);
    expect(geometry?.labelAnchor).toBe("start");
  });

  test("x(범주) — 데이터에 없는 값은 null", () => {
    expect(
      buildReferenceLine({ axis: "x", value: "없는달", scale, data: chartData, xKey: "month" }),
    ).toBeNull();
  });

  test("y(수치) — 가로선이 값 위치에, 라벨 위치 start/middle/end", () => {
    const geometry = buildReferenceLine({
      axis: "y",
      value: 200,
      scale,
      data: chartData,
      xKey: "month",
    });
    expect(geometry?.y1).toBe(scale.yAt(200));
    expect(geometry?.x1).toBe(PLOT.left);
    expect(geometry?.x2).toBe(PLOT.right);
    // 기본 end — 오른쪽 끝, anchor end
    expect(geometry?.labelX).toBe(PLOT.right - 4);
    expect(geometry?.labelAnchor).toBe("end");
    expect(geometry?.labelY).toBe(scale.yAt(200) - 6);

    const start = buildReferenceLine({
      axis: "y", value: 200, scale, data: chartData, xKey: "month", labelPosition: "start",
    });
    expect(start?.labelX).toBe(PLOT.left + 4);
    expect(start?.labelAnchor).toBe("start");

    const middle = buildReferenceLine({
      axis: "y", value: 200, scale, data: chartData, xKey: "month", labelPosition: "middle",
    });
    expect(middle?.labelX).toBe((PLOT.left + PLOT.right) / 2);
    expect(middle?.labelAnchor).toBe("middle");
  });
});

describe("극좌표 — polarToAngle·buildPieArcs·pieIndexAtAngle", () => {
  const pieData: ChartDatum[] = [
    { label: "a", value: 60 },
    { label: "b", value: 30 },
    { label: "c", value: 10 },
  ];

  test("polarToAngle — 화면 좌표 도수(0=오른쪽, 90=아래, 180=왼쪽, 270=위)", () => {
    expect(polarToAngle(100, 100, 110, 100)).toBe(0);
    expect(polarToAngle(100, 100, 100, 110)).toBe(90);
    expect(polarToAngle(100, 100, 90, 100)).toBe(180);
    expect(polarToAngle(100, 100, 100, 90)).toBe(270);
    // 음수 각도 정규화
    expect(polarToAngle(100, 100, 105, 95)).toBe(315);
  });

  test("buildPieArcs — 위(270°)부터 시계 방향, 분율 합 1, 조각 연속성", () => {
    const arcs = buildPieArcs(pieData, "value", "label", {
      cx: 100, cy: 100, outerRadius: 80,
    });
    expect(arcs).toHaveLength(3);
    expect(arcs[0].startAngle).toBe(270);
    expect(arcs.reduce((sum, arc) => sum + arc.fraction, 0)).toBeCloseTo(1, 9);
    for (let i = 1; i < arcs.length; i++) {
      expect(arcs[i].startAngle).toBeCloseTo(arcs[i - 1].endAngle, 9);
    }
    // 60% 조각은 largeArc=1 경로를 갖는다
    expect(arcs[0].d).toContain("A80 80 0 1 1");
    // 파이(내반경 0)는 중심에서 시작
    expect(arcs[0].d.startsWith("M100 100")).toBe(true);
    // 중심점은 링 중간 반경
    const r = 80 / 2;
    const mid = arcs[0];
    const midAngle = ((mid.startAngle + mid.endAngle) / 2) * (Math.PI / 180);
    expect(mid.centroid.x).toBeCloseTo(100 + r * Math.cos(midAngle), 5);
    expect(mid.centroid.y).toBeCloseTo(100 + r * Math.sin(midAngle), 5);
  });

  test("buildPieArcs — 도넛(innerRadius) 경로는 안쪽 호를 되돌아간다", () => {
    const arcs = buildPieArcs(pieData, "value", "label", {
      cx: 100, cy: 100, outerRadius: 80, innerRadius: 30,
    });
    expect(arcs[0].d).toContain("A80 80 0");
    expect(arcs[0].d).toContain("A30 30 0");
    expect(arcs[0].d.startsWith("M100 100")).toBe(false);
  });

  test("buildPieArcs — 단일 100% 조각은 두 반원 호로 퇴화하지 않는다", () => {
    const arcs = buildPieArcs([{ label: "only", value: 100 }], "value", "label", {
      cx: 100, cy: 100, outerRadius: 80,
    });
    expect(arcs).toHaveLength(1);
    expect(arcs[0].fraction).toBeCloseTo(1, 9);
    expect((arcs[0].d.match(/A80 80/g) ?? []).length).toBe(2);
  });

  test("buildPieArcs — 양수가 없으면 빈 배열", () => {
    expect(
      buildPieArcs([{ label: "a", value: 0 }], "value", "label", { cx: 0, cy: 0, outerRadius: 10 }),
    ).toEqual([]);
  });

  test("pieIndexAtAngle — 각도로 조각 인덱스(래핑 포함), 무효 입력 null", () => {
    const values = [60, 30, 10];
    expect(pieIndexAtAngle(270, values)).toBe(0); // 꼭대기
    expect(pieIndexAtAngle(0, values)).toBe(0); // 오른쪽(90° 진행)
    expect(pieIndexAtAngle(200, values)).toBe(1);
    expect(pieIndexAtAngle(265, values)).toBe(2); // 꼭대기 직전 = 마지막 조각(래핑)
    expect(pieIndexAtAngle(90, [])).toBeNull();
    expect(pieIndexAtAngle(90, [0, 0])).toBeNull();
  });
});

describe("방사형 — buildRadarGeometry·nearestRadarIndex", () => {
  const radarData: ChartDatum[] = [
    { axis: "축1", v: 100 },
    { axis: "축2", v: 50 },
    { axis: "축3", v: 25 },
    { axis: "축4", v: 75 },
  ];
  const geometry = buildRadarGeometry(radarData, ["v"], {
    cx: 100, cy: 100, radius: 60, labelKey: "axis",
  });

  test("축 수 = 데이터 행 수, 시작 각도 270°(위), 값 정규화 valueMax", () => {
    expect(geometry.axes).toHaveLength(4);
    expect(geometry.valueMax).toBe(100);
    expect(geometry.axes[0].x).toBeCloseTo(100, 5);
    expect(geometry.axes[0].y).toBeCloseTo(40, 5); // cy - radius
  });

  test("격자 폴리곤 levels(기본 4) 단계 + 시리즈 폴리곤 반경 비례", () => {
    expect(geometry.gridD).toHaveLength(4);
    // 축2(오른쪽, 0°)의 v=50 → 반경 30
    const point = geometry.seriesPoints.v[1];
    expect(point.x).toBeCloseTo(130, 5);
    expect(point.y).toBeCloseTo(100, 5);
    expect(geometry.seriesD.v).toContain("Z");
  });

  test("축 라벨 앵커 — 오른쪽 축 start, 왼쪽 end, 위/아래 middle", () => {
    expect(geometry.axes[1].labelAnchor).toBe("start");
    expect(geometry.axes[3].labelAnchor).toBe("end");
    expect(geometry.axes[0].labelAnchor).toBe("middle");
    expect(geometry.axes[1].label).toBe("축2");
  });

  test("nearestRadarIndex — 가장 가까운 축으로 반올림, count 0은 null", () => {
    expect(nearestRadarIndex(100, 100, 100, 40, 4)).toBe(0); // 위
    expect(nearestRadarIndex(100, 100, 160, 100, 4)).toBe(1); // 오른쪽
    expect(nearestRadarIndex(100, 100, 141.4, 58.6, 4)).toBe(1); // 45° 경계 반올림 → 축2
    expect(nearestRadarIndex(100, 100, 100, 160, 4)).toBe(2); // 아래
    expect(nearestRadarIndex(100, 100, 100, 100, 0)).toBeNull();
  });
});

describe("제스처 도메인 매핑 — pixelToBandIndex·yPixelsToDomain·buildSelectionRect", () => {
  const scale = buildChartScale(chartData, ["desktop"], 320, 200);
  // bandWidth = 264/3 = 88

  test("pixelToBandIndex — 밴드 중심 인덱스, 플롯 밖 클램프", () => {
    expect(pixelToBandIndex(48 + 44, scale.plotLeft, scale.bandWidth, 3)).toBe(0);
    expect(pixelToBandIndex(48 + 132, scale.plotLeft, scale.bandWidth, 3)).toBe(1);
    expect(pixelToBandIndex(48 + 220, scale.plotLeft, scale.bandWidth, 3)).toBe(2);
    expect(pixelToBandIndex(-50, scale.plotLeft, scale.bandWidth, 3)).toBe(0);
    expect(pixelToBandIndex(9999, scale.plotLeft, scale.bandWidth, 3)).toBe(2);
    expect(pixelToBandIndex(100, 48, 0, 3)).toBe(0);
  });

  test("yPixelsToDomain — 픽셀 y 구간 → 도메인 구간(플롯 밖 클램프)", () => {
    const domain = yPixelsToDomain(scale, PLOT.top, PLOT.bottom);
    expect(domain.max).toBeCloseTo(scale.yMax, 5);
    expect(domain.min).toBeCloseTo(scale.yMin, 5);
    const clamped = yPixelsToDomain(scale, -999, PLOT.top);
    expect(clamped.min).toBeCloseTo(scale.yMax, 5);
    expect(clamped.max).toBeCloseTo(scale.yMax, 5);
  });

  test("buildSelectionRect — band(브러시)는 플롯 전체 높이, rect(줌)는 양축 클램프", () => {
    const band = buildSelectionRect({ x: 0, y: 0 }, { x: 100, y: 50 }, scale, "band");
    expect(band.x).toBe(PLOT.left);
    expect(band.y).toBe(PLOT.top);
    expect(band.height).toBe(PLOT.height);
    expect(band.width).toBe(100 - PLOT.left);

    const rect = buildSelectionRect({ x: 0, y: -50 }, { x: 400, y: 500 }, scale, "rect");
    expect(rect.x).toBe(PLOT.left);
    expect(rect.y).toBe(PLOT.top);
    expect(rect.width).toBe(PLOT.width);
    expect(rect.height).toBe(PLOT.height);
  });
});

// ---------------------------------------------------------------------------
// 컴포지션 스모크 — 웹 렌더러로 정적 마크업을 뽑아 children 분류·축 분리·
// 극좌표 렌더가 깨지지 않는지만 확인한다(제스처는 정적 마크업에서 불가).
// ---------------------------------------------------------------------------
describe("chart 컴포지션 스모크(웹 정적 렌더)", () => {
  const config = {
    month: { label: "월" },
    desktop: { label: "데스크톱" },
    mobile: { label: "모바일" },
    value: { label: "값" },
    v: { label: "시리즈" },
  };

  test("스택 막대 + 이중 y축 + 참조선 — 분류·축 패딩·점선·라벨", () => {
    const markup = renderToStaticMarkup(
      createElement(
        ChartContainer,
        { config, data: chartData },
        createElement(ChartGrid),
        createElement(ChartXAxis),
        createElement(ChartYAxis),
        createElement(ChartYAxis, { yAxisId: "right", orientation: "right" }),
        createElement(ChartReferenceLine, { y: 200, label: "목표" }),
        createElement(ChartBarSeries, { dataKey: "desktop", stackId: "s" }),
        createElement(ChartBarSeries, { dataKey: "mobile", stackId: "s" }),
      ),
    );
    // 참조선 — 점선 + 라벨
    expect(markup).toContain('stroke-dasharray="4 4"');
    expect(markup).toContain("목표");
    // 스택 막대 6개(시리즈 2 × 3행) — 투명 캡처 Rect 1개 포함
    expect((markup.match(/<rect/g) ?? []).length).toBe(7);
    // 우측 축 라벨은 우측 앵커로 붙는다
    expect(markup).toContain('text-anchor="start"');
  });

  test("파이 시리즈 — 조각 3개 경로 + 백분율 라벨 + 캡처 Rect", () => {
    const pieData: ChartDatum[] = [
      { name: "a", value: 60 },
      { name: "b", value: 30 },
      { name: "c", value: 10 },
    ];
    const markup = renderToStaticMarkup(
      createElement(
        ChartContainer,
        { config, data: pieData, xKey: "name" },
        createElement(ChartPieSeries, { dataKey: "value", label: true }),
      ),
    );
    expect((markup.match(/<path/g) ?? []).length).toBe(3);
    expect(markup).toContain("60%");
    expect(markup).toContain("30%");
    expect((markup.match(/<rect/g) ?? []).length).toBe(1);
  });

  test("레이더 시리즈 — 격자 4 + 축 4 + 라벨 + 시리즈 폴리곤", () => {
    const radarData: ChartDatum[] = [
      { axis: "축1", v: 100 },
      { axis: "축2", v: 50 },
      { axis: "축3", v: 25 },
      { axis: "축4", v: 75 },
    ];
    const markup = renderToStaticMarkup(
      createElement(
        ChartContainer,
        { config, data: radarData, xKey: "axis" },
        createElement(ChartRadialSeries, { dataKey: "v" }),
      ),
    );
    // 격자 4 + 시리즈(채움+선) 2 = path 6, 축 line 4
    expect((markup.match(/<path/g) ?? []).length).toBe(6);
    expect((markup.match(/<line/g) ?? []).length).toBe(4);
    expect(markup).toContain("축1");
  });

  test("브러시·줌 구성 — 캡처 Rect가 제거되고(램퍼가 탭 인계) 제스처 핸들러가 붙는다", () => {
    const markup = renderToStaticMarkup(
      createElement(
        ChartContainer,
        { config, data: chartData },
        createElement(ChartGrid),
        createElement(ChartXAxis),
        createElement(ChartYAxis),
        createElement(ChartBarSeries, { dataKey: "desktop" }),
        createElement(ChartBrush),
        createElement(ChartZoom),
      ),
    );
    // 램퍼가 제스처를 받는다(touch-none — 정적 마크업은 이벤트 핸들러를 직렬화하지 않아 클래스로 확인)
    expect(markup).toContain("touch-none");
    expect(markup).toContain("cursor-crosshair");
    expect(markup).not.toContain('fill="transparent"');
    // 미확정 상태 — 선택 사각형·초기화 칩은 렌더되지 않는다
    expect(markup).not.toContain("초기화");
  });
});

// ---------------------------------------------------------------------------
// 리뷰 수정 회귀 — 비스택 음수 막대 지오메트리·극좌표 비정상값 방어·
// 빈 레이더 경로·파이 히트 판정 오염 방지.
// ---------------------------------------------------------------------------
/** 정적 마크업에서 시리즈 막대(rx="4", 캡처 Rect 와 구분) 지오메트리만 뽑는다 */
function seriesBarRects(markup: string) {
  return [...markup.matchAll(/<rect\b[^>]*>/g)]
    .filter((match) => match[0].includes('rx="4"'))
    .map((match) => {
      const attrs = match[0];
      const attr = (name: string) =>
        Number(attrs.match(new RegExp(`\\b${name}="([^"]+)"`))?.[1]);
      return { x: attr("x"), y: attr("y"), height: attr("height") };
    });
}

describe("리뷰 수정 회귀 — 비스택 음수 막대·비정상값·빈 데이터", () => {
  test("비스택 음수 막대 — 높이 0이 아니라 0 기준선 아래로 뻗는다", () => {
    const data: ChartDatum[] = [
      { month: "1월", v: -100 },
      { month: "2월", v: 50 },
    ];
    const scale = buildChartScale(data, ["v"], 320, 200);
    const zeroY = scale.yAt(0);
    const plotBottom = scale.plotTop + scale.plotHeight;
    const markup = renderToStaticMarkup(
      createElement(
        ChartContainer,
        { config: { month: { label: "월" }, v: { label: "값" } }, data },
        createElement(ChartBarSeries, { dataKey: "v" }),
      ),
    );
    const bars = seriesBarRects(markup);
    expect(bars).toHaveLength(2);
    const [negative, positive] = bars[0].x < bars[1].x ? bars : [bars[1], bars[0]];
    // 음수 막대 — 꼭대기가 0 기준선, 도메인 최솟값(-100=플롯 하단)까지 뻗는다
    expect(negative.y).toBeCloseTo(zeroY, 6);
    expect(negative.height).toBeCloseTo(plotBottom - zeroY, 6);
    expect(negative.height).toBeGreaterThan(0);
    // 양수 막대 — 기존 계약 유지(0 기준선까지 내려온다)
    expect(positive.y).toBeCloseTo(scale.yAt(50), 6);
    expect(positive.y + positive.height).toBeCloseTo(zeroY, 6);
  });

  test("비스택 막대 — NaN·Infinity 값 행은 렌더에서 건너뛴다", () => {
    const data: ChartDatum[] = [
      { month: "1월", v: NaN },
      { month: "2월", v: 50 },
      { month: "3월", v: Infinity },
    ];
    const markup = renderToStaticMarkup(
      createElement(
        ChartContainer,
        { config: { month: { label: "월" }, v: { label: "값" } }, data },
        createElement(ChartBarSeries, { dataKey: "v" }),
      ),
    );
    const bars = seriesBarRects(markup);
    expect(bars).toHaveLength(1);
    for (const bar of bars) {
      expect(Number.isFinite(bar.y)).toBe(true);
      expect(Number.isFinite(bar.height)).toBe(true);
    }
  });

  test("buildPieArcs — NaN·±Infinity·음수 값은 조각이 되지 않는다", () => {
    const arcs = buildPieArcs(
      [
        { label: "inf", value: Infinity },
        { label: "nan", value: NaN },
        { label: "neg", value: -40 },
        { label: "ok", value: 60 },
      ],
      "value",
      "label",
      { cx: 100, cy: 100, outerRadius: 80 },
    );
    expect(arcs).toHaveLength(1);
    expect(arcs[0].index).toBe(3);
    expect(arcs[0].label).toBe("ok");
    expect(arcs[0].fraction).toBeCloseTo(1, 9);
    expect(arcs[0].d).not.toContain("NaN");
    expect(arcs[0].d).not.toContain("Infinity");
  });

  test("buildPieArcs — innerRadius ≥ outerRadius는 링 반전 없이 클램프된다", () => {
    const pieData: ChartDatum[] = [
      { label: "a", value: 60 },
      { label: "b", value: 30 },
      { label: "c", value: 10 },
    ];
    const arcs = buildPieArcs(pieData, "value", "label", {
      cx: 100,
      cy: 100,
      outerRadius: 40,
      innerRadius: 80,
    });
    expect(arcs).toHaveLength(3);
    for (const arc of arcs) {
      const radii = [...arc.d.matchAll(/A(\d+(?:\.\d+)?) /g)].map((m) => Number(m[1]));
      expect(radii.length).toBeGreaterThan(0);
      for (const radius of radii) {
        expect(radius).toBeLessThanOrEqual(40);
      }
      // 안쪽 링은 outerRadius-1(=39)로 클램프 — 뒤집힌 도넛이 되지 않는다
      expect(arc.d).toContain("A39 39 0");
    }
  });

  test("buildPieArcs — 전체 원 파이 경로에서 중심 M 중복이 없다", () => {
    const arcs = buildPieArcs([{ label: "only", value: 100 }], "value", "label", {
      cx: 100,
      cy: 100,
      outerRadius: 80,
    });
    expect(arcs[0].d.startsWith("M100 100")).toBe(false);
    expect((arcs[0].d.match(/M/g) ?? []).length).toBe(1);
  });

  test("pieIndexAtAngle — 음수·NaN 항목은 스윕 커서를 오염시키지 않는다", () => {
    // [60, -30, 10] → 가중치 [60, 0, 10](총 70): 위(270°)는 조각 0, 지나면 조각 2
    expect(pieIndexAtAngle(270, [60, -30, 10])).toBe(0);
    expect(pieIndexAtAngle(310, [60, -30, 10])).toBe(0);
    expect(pieIndexAtAngle(230, [60, -30, 10])).toBe(2);
    // NaN 선행 항목 — 커서가 NaN이 되어 마지막 인덱스로 몰리지 않는다
    expect(pieIndexAtAngle(270, [NaN, 60, 10])).toBe(1);
    expect(pieIndexAtAngle(210, [NaN, 60, 10])).toBe(1);
    expect(pieIndexAtAngle(250, [NaN, 60, 10])).toBe(2);
    // 전부 무효(0·음수·NaN)면 null
    expect(pieIndexAtAngle(90, [0, -5, NaN])).toBeNull();
  });

  test("buildRadarGeometry — 빈 데이터는 격자 없음·빈 시리즈 경로", () => {
    const geometry = buildRadarGeometry([], ["v"], {
      cx: 100,
      cy: 100,
      radius: 60,
      labelKey: "axis",
    });
    expect(geometry.axes).toEqual([]);
    expect(geometry.gridD).toEqual([]);
    expect(geometry.seriesD.v).toBe("");
    expect(geometry.seriesPoints.v).toEqual([]);
  });

  test("빈 데이터 레이더 컨테이너 — 격자·시리즈 path가 렌더되지 않는다", () => {
    const markup = renderToStaticMarkup(
      createElement(
        ChartContainer,
        {
          config: { axis: { label: "축" }, v: { label: "시리즈" } },
          data: [],
          xKey: "axis",
        },
        createElement(ChartRadialSeries, { dataKey: "v" }),
      ),
    );
    expect(markup).not.toContain("<path");
  });
});
