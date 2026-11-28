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

export function hasNativeTransitionClass(className?: string): boolean {
  return parseNativeTransitionSpec(className) !== null;
}

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
