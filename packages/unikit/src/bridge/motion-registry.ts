/**
 * 네이티브 모션 드라이버 레지스트리 + 클래스·변환 순수 유틸.
 *
 * 설계 원칙(overlay-position과 동일 단방향 주입):
 * - 기본 경로(`bridge/native.tsx`)는 의존성 0으로 RN 0.88 코어 Animated
 *   (`useNativeDriver: true`)를 사용해 오버레이 등장/퇴장, 전환, 루프 애니메이션을
 *   UI 스레드에서 구동한다.
 * - 선택적 진입점 `@unikit-bridge/ui/motion`(react-native 조건 → `motion/native.tsx`)은
 *   앱 부트에서 `installReanimatedMotion()`을 호출해 Reanimated 4의
 *   CSS Keyframe Animations(`css.keyframes`) + CSS Transitions(`transitionProperty`)
 *   + `withUniwind(Animated.View)` 드라이버를 이 레지스트리에 등록한다.
 * - `bridge/native.tsx`는 `react-native-reanimated`를 정적 import하지 않으므로
 *   Reanimated를 설치하지 않은 소비자의 Metro 번들에 어떤 영향도 주지 않는다.
 */
import type { ComponentType, ReactNode } from "react";
import type { BridgeStyle, LoopPulseProps, LoopRotateProps } from "./types";

export type OverlayMotionPreset =
  | "backdrop"
  | "dialog"
  | "popover"
  | "sheet-top"
  | "sheet-bottom"
  | "sheet-left"
  | "sheet-right"
  | "toast";

export type TailwindAnimatePreset = "spin" | "pulse" | "bounce" | "ping";

export type NativeTransitionTiming =
  | "default"
  | "linear"
  | "ease-in"
  | "ease-out"
  | "ease-in-out";

export type NativeTransitionSpec = {
  properties: string[];
  durationMs: number;
  delayMs: number;
  timing: NativeTransitionTiming;
};

export type OverlayMotionPhase = "enter" | "exit";

export type NativeMotionViewProps = {
  viewRef?: unknown;
  className?: string;
  style?: unknown;
  preset: OverlayMotionPreset | null;
  hasTransition: boolean;
  animatePreset?: TailwindAnimatePreset | null;
  phase: OverlayMotionPhase;
  reducedMotion: boolean;
  hasUserTransform: boolean;
  children?: ReactNode;
  [key: string]: unknown;
};

export type NativeMotionBackdropProps = {
  className?: string;
  phase: OverlayMotionPhase;
  reducedMotion: boolean;
  children?: ReactNode;
};

export type NativeMotionDriver = {
  AnimatedView: ComponentType<NativeMotionViewProps>;
  Backdrop: ComponentType<NativeMotionBackdropProps>;
  LoopRotate: ComponentType<LoopRotateProps & { reducedMotion: boolean }>;
  LoopPulse: ComponentType<LoopPulseProps & { reducedMotion: boolean }>;
};

const OVERLAY_PRESET_MAP: Record<string, OverlayMotionPreset> = {
  "unikit-backdrop-in": "backdrop",
  "unikit-dialog-in": "dialog",
  "unikit-popover-in": "popover",
  "unikit-sheet-in-top": "sheet-top",
  "unikit-sheet-in-bottom": "sheet-bottom",
  "unikit-sheet-in-left": "sheet-left",
  "unikit-sheet-in-right": "sheet-right",
  "unikit-toast-in": "toast",
};

const TRANSITION_PROPERTY_MAP: Record<string, string[]> = {
  "transition-all": ["all"],
  "transition-transform": ["transform"],
  "transition-opacity": ["opacity"],
  "transition-colors": ["backgroundColor", "borderColor"],
  "transition-shadow": [
    "shadowColor",
    "shadowOpacity",
    "shadowRadius",
    "elevation",
  ],
  transition: ["backgroundColor", "borderColor", "opacity", "transform"],
};

const EASE_TOKEN_MAP: Record<string, NativeTransitionTiming> = {
  "ease-linear": "linear",
  "ease-in": "ease-in",
  "ease-out": "ease-out",
  "ease-in-out": "ease-in-out",
};

const ANIMATE_PRESET_MAP: Record<string, TailwindAnimatePreset | null> = {
  "animate-spin": "spin",
  "animate-pulse": "pulse",
  "animate-bounce": "bounce",
  "animate-ping": "ping",
  "animate-none": null,
};

const DURATION_TOKEN_RE = /^duration-(\d+)$/;
const DELAY_TOKEN_RE = /^delay-(\d+)$/;
const ROTATE_TOKEN_RE = /^(-?)rotate-(\d+)$/;

/** `className`에서 `unikit-*` 오버레이 모션 프리셋을 추출한다(`web:` 변형 제외). */
export function detectOverlayMotionPreset(
  className?: string,
): OverlayMotionPreset | null {
  if (!className) return null;
  let found: OverlayMotionPreset | null = null;
  for (const token of className.trim().split(/\s+/)) {
    if (!token || token.includes(":")) continue;
    const preset = OVERLAY_PRESET_MAP[token];
    if (preset) found = preset;
  }
  return found;
}

/**
 * 표준 Tailwind `transition-*`·`duration-*`·`delay-*`·`ease-*` 토큰을
 * 네이티브 CSS Transition 명세로 파싱한다(`web:` 등 접두 변형 제외).
 */
export function parseNativeTransitionSpec(
  className?: string,
): NativeTransitionSpec | null {
  if (!className) return null;
  let properties: string[] | null = null;
  let durationMs = 150;
  let delayMs = 0;
  let timing: NativeTransitionTiming = "default";

  for (const token of className.trim().split(/\s+/)) {
    if (!token || token.includes(":")) continue;
    if (token === "transition-none") {
      properties = null;
      continue;
    }
    const mappedProps = TRANSITION_PROPERTY_MAP[token];
    if (mappedProps) {
      properties = mappedProps;
      continue;
    }
    const durationMatch = DURATION_TOKEN_RE.exec(token);
    if (durationMatch) {
      durationMs = Number(durationMatch[1]);
      continue;
    }
    const delayMatch = DELAY_TOKEN_RE.exec(token);
    if (delayMatch) {
      delayMs = Number(delayMatch[1]);
      continue;
    }
    const mappedEase = EASE_TOKEN_MAP[token];
    if (mappedEase) {
      timing = mappedEase;
    }
  }

  if (!properties) return null;
  return { properties, durationMs, delayMs, timing };
}

/** `className`에 네이티브에서 구동할 공용 `transition*` 클래스가 있는지 확인한다(`web:` 제외). */
export function hasNativeTransitionClass(className?: string): boolean {
  return parseNativeTransitionSpec(className) !== null;
}

/** `className`에서 표준 Tailwind `animate-*` 루프 프리셋을 추출한다(`web:` 제외, 나중 토큰 우선). */
export function detectTailwindAnimatePreset(
  className?: string,
): TailwindAnimatePreset | null {
  if (!className) return null;
  let found: TailwindAnimatePreset | null = null;
  for (const token of className.trim().split(/\s+/)) {
    if (!token || token.includes(":")) continue;
    if (token in ANIMATE_PRESET_MAP) {
      found = ANIMATE_PRESET_MAP[token];
    }
  }
  return found;
}

/** `duration-<ms>` 토큰에서 ms를 추출한다(`web:` 변형 제외). 없으면 `fallback`. */
export function parseDurationMs(className?: string, fallback = 200): number {
  if (!className) return fallback;
  let result = fallback;
  for (const token of className.trim().split(/\s+/)) {
    if (!token || token.includes(":")) continue;
    const match = DURATION_TOKEN_RE.exec(token);
    if (match) result = Number(match[1]);
  }
  return result;
}

/** `rotate-<deg>` / `-rotate-<deg>` 토큰에서 각도를 추출한다(`web:` 변형 제외). */
export function parseRotateDeg(className?: string): number | null {
  if (!className) return null;
  let deg: number | null = null;
  for (const token of className.trim().split(/\s+/)) {
    if (!token || token.includes(":")) continue;
    const match = ROTATE_TOKEN_RE.exec(token);
    if (match) {
      const value = Number(match[2]);
      deg = match[1] === "-" ? -value : value;
    }
  }
  return deg;
}

export type ExtractedUniversalTransform = {
  translateX?: number;
  translateY?: number;
  scale?: number;
  rotate?: string;
  restStyle: BridgeStyle | undefined;
  hasTransformShorthand: boolean;
};

/**
 * `BridgeStyle`에서 범용 변환 단축키(`translateX`, `translateY`, `scale`, `rotate`)를
 * 분리해 웹(CSS transform)·네이티브(RN transform 배열) 양측이 일관되게 해석하도록 돕는다.
 */
export function extractUniversalTransform(
  style?: BridgeStyle,
): ExtractedUniversalTransform {
  if (!style) {
    return { restStyle: undefined, hasTransformShorthand: false };
  }
  const { translateX, translateY, scale, rotate, ...rest } = style;
  const tx = typeof translateX === "number" ? translateX : undefined;
  const ty = typeof translateY === "number" ? translateY : undefined;
  const sc = typeof scale === "number" ? scale : undefined;
  const rot = typeof rotate === "string" ? rotate : undefined;
  const hasTransformShorthand =
    tx !== undefined || ty !== undefined || sc !== undefined || rot !== undefined;
  const restKeys = Object.keys(rest);
  return {
    translateX: tx,
    translateY: ty,
    scale: sc,
    rotate: rot,
    restStyle: hasTransformShorthand
      ? restKeys.length > 0
        ? rest
        : undefined
      : style,
    hasTransformShorthand,
  };
}

let activeMotionDriver: NativeMotionDriver | null = null;
const driverListeners = new Set<() => void>();

export function setMotionDriver(driver: NativeMotionDriver | null): void {
  activeMotionDriver = driver;
  driverListeners.forEach((listener) => listener());
}

export function getMotionDriver(): NativeMotionDriver | null {
  return activeMotionDriver;
}

export function subscribeMotionDriver(listener: () => void): () => void {
  driverListeners.add(listener);
  return () => {
    driverListeners.delete(listener);
  };
}
