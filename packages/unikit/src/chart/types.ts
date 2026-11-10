/**
 * chart 렌더러 공개 타입 — `@unikit-bridge/ui/chart` 단독 진입점의 공통 계약.
 *
 * 웹（src/chart/web.tsx, JSX `<svg>`）과 네이티브（src/chart/native.tsx,
 * react-native-svg）가 **동일 props 인터페이스**로 최소 SVG 렌더러를 제공한다
 * （42-design-plan §2.2）. 구체 형상축스케일 로직은 공유 컴포넌트
 * src/components/chart.tsx가 담당하고 이 프록시들은 좌표를 그리는 역할만 한다.
 *
 * 색상은 className（chart-1~5 토큰 등）으로 주는 게 원칙이고, stroke/fill은
 * 폴백（토큰 컴파일이 어려운 동적 경우）용이다.
 *
 * T-3a 보완（사이클 40）: ChartPoint와 ChartSurface.onPointMove/onPointLeave（웹
 * hover）, ChartRect.onPress（웹 클릭네이티브 탭 — 투명 오버레이 캡처）를 추가했다.
 * 좌표는 전부 SVG 국소 px로 정규화해 계약을 양측 동일하게 유지한다.
 */
import type { ReactNode } from "react";

/**
 * 포인터 상호작용의 정규화 좌표（SVG 로컬 px — viewBox가 width/height와 1:1이므로
 * 픽셀 좌표가 곧 SVG 좌표다）. T-3a（chart 컴포넌트）의 툴팁 상호작용이 소비한다.
 */
export type ChartPoint = { x: number; y: number };

/** 차트 캔버스 — viewBox 없이 명시 width/height（px）. */
export type ChartSurfaceProps = {
  width: number;
  height: number;
  children?: ReactNode;
  className?: string;
  /** 시리즈 요약 라벨（스크린리더） — 웹 <svg title> 대기물, 네이티브 accessibilityLabel */
  accessibilityLabel?: string;
  /**
   * 포인터 이동（hover 추적） — 웹 onMouseMove에서 SVG 국소 좌표로 정규화해 발화.
   * 네이티브는 no-op（hover 개념 없음 — 탭은 ChartRect.onPress로）.
   */
  onPointMove?: (point: ChartPoint) => void;
  /** 포인터 영역 이탈 — 웹 onMouseLeave. 네이티브 no-op. */
  onPointLeave?: () => void;
};

export type ChartLineProps = {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  className?: string;
  stroke?: string;
  strokeWidth?: number;
  /** 점선 지정（예: "3 3"） */
  strokeDasharray?: string;
};

export type ChartRectProps = {
  x: number;
  y: number;
  width: number;
  height: number;
  className?: string;
  fill?: string;
  rx?: number;
  /**
   * 눌림（탭클릭） — 웹 onClick네이티브 react-native-svg onPress（Rect 터치）에서
   * Rect 국소 좌표로 정규화해 발화. 투명 오버레이 Rect가 툴팁 탭 캡처를 담당한다
   * （T-3a）. fill이 none이면 네이티브에서 터치가 관통되니 "transparent"를 쓴다.
   */
  onPress?: (point: ChartPoint) => void;
};

export type ChartTextProps = {
  x: number;
  y: number;
  children?: ReactNode;
  className?: string;
  textAnchor?: "start" | "middle" | "end";
  fontSize?: number;
};

export type ChartPathProps = {
  d: string;
  className?: string;
  fill?: string;
  stroke?: string;
  strokeWidth?: number;
};

/** 원（primitive） — 그라디언트 정지점 등에 쓰는 경우를 남겨둔다. */
export type ChartCircleProps = {
  cx: number;
  cy: number;
  r: number;
  className?: string;
  fill?: string;
};
