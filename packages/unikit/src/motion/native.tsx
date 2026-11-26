/**
 * @unikit-bridge/ui/motion (네이티브 — package.json exports `react-native` 조건).
 *
 * `react-native-reanimated` 4.7+(MIT)의 W3C CSS Animations(`css.keyframes`) 및
 * CSS Transitions(`transitionProperty`·`transitionDuration`·`transitionDelay`·
 * `transitionTimingFunction`) 엔진을 브리지 모션 드라이버 레지스트리에 등록해,
 * 오버레이 등장/퇴장과 표준 Tailwind 유틸리티(`transition-*`·`duration-*`·
 * `delay-*`·`ease-*`·`animate-*`)를 Reanimated UI 스레드(C++ CSS 엔진)로 구동한다.
 *
 * 무료 OSS `uniwind@1.13.2`(MIT)의 `useResolveClassNames`가 방출하는 불완전한
 * `transition*`·`animation*` 필드는 상용 Uniwind Pro 코드 없이 전면 제거하고,
 * 자체 MIT 유틸리티 파서(`parseNativeTransitionSpec`)가 Reanimated 4 공개 CSS API로
 * 직접 매핑한다.
 */
import { useMemo } from "react";
import { StyleSheet, type ViewStyle } from "react-native";
import Animated, {
  css,
  cubicBezier,
  type CSSStyle,
} from "react-native-reanimated";
import { useResolveClassNames } from "uniwind";

import {
  getMotionDriver,
  parseNativeTransitionSpec,
  setMotionDriver,
  type NativeMotionBackdropProps,
  type NativeMotionDriver,
  type NativeMotionViewProps,
  type NativeTransitionTiming,
  type OverlayMotionPreset,
  type TailwindAnimatePreset,
} from "../bridge/motion-registry";
import type { LoopPulseProps, LoopRotateProps } from "../bridge/types";

const EASE_OUT_EXPO = cubicBezier(0.22, 1, 0.36, 1);
const EASE_IN_CUBIC = cubicBezier(0.4, 0, 1, 1);
const TAILWIND_DEFAULT_EASE = cubicBezier(0.4, 0, 0.2, 1);
const TAILWIND_PING_EASE = cubicBezier(0, 0, 0.2, 1);

const backdropInKeyframes = css.keyframes({
  from: { opacity: 0 },
  to: { opacity: 1 },
});

const backdropOutKeyframes = css.keyframes({
  from: { opacity: 1 },
  to: { opacity: 0 },
});

const dialogInKeyframes = css.keyframes({
  from: { opacity: 0, transform: [{ scale: 0.95 }] },
  to: { opacity: 1, transform: [{ scale: 1 }] },
});

const dialogOutKeyframes = css.keyframes({
  from: { opacity: 1, transform: [{ scale: 1 }] },
  to: { opacity: 0, transform: [{ scale: 0.95 }] },
});

const popoverInKeyframes = css.keyframes({
  from: { opacity: 0, transform: [{ scale: 0.96 }, { translateY: -4 }] },
  to: { opacity: 1, transform: [{ scale: 1 }, { translateY: 0 }] },
});

const popoverOutKeyframes = css.keyframes({
  from: { opacity: 1, transform: [{ scale: 1 }, { translateY: 0 }] },
  to: { opacity: 0, transform: [{ scale: 0.96 }, { translateY: -4 }] },
});

const sheetTopInKeyframes = css.keyframes({
  from: { opacity: 0, transform: [{ translateY: -48 }] },
  to: { opacity: 1, transform: [{ translateY: 0 }] },
});

const sheetTopOutKeyframes = css.keyframes({
  from: { opacity: 1, transform: [{ translateY: 0 }] },
  to: { opacity: 0, transform: [{ translateY: -48 }] },
});

const sheetBottomInKeyframes = css.keyframes({
  from: { opacity: 0, transform: [{ translateY: 48 }] },
  to: { opacity: 1, transform: [{ translateY: 0 }] },
});

const sheetBottomOutKeyframes = css.keyframes({
  from: { opacity: 1, transform: [{ translateY: 0 }] },
  to: { opacity: 0, transform: [{ translateY: 48 }] },
});

const sheetLeftInKeyframes = css.keyframes({
  from: { opacity: 0, transform: [{ translateX: -48 }] },
  to: { opacity: 1, transform: [{ translateX: 0 }] },
});

const sheetLeftOutKeyframes = css.keyframes({
  from: { opacity: 1, transform: [{ translateX: 0 }] },
  to: { opacity: 0, transform: [{ translateX: -48 }] },
});

const sheetRightInKeyframes = css.keyframes({
  from: { opacity: 0, transform: [{ translateX: 48 }] },
  to: { opacity: 1, transform: [{ translateX: 0 }] },
});

const sheetRightOutKeyframes = css.keyframes({
  from: { opacity: 1, transform: [{ translateX: 0 }] },
  to: { opacity: 0, transform: [{ translateX: 48 }] },
});

const toastInKeyframes = css.keyframes({
  from: { opacity: 0, transform: [{ translateY: 12 }, { scale: 0.97 }] },
  to: { opacity: 1, transform: [{ translateY: 0 }, { scale: 1 }] },
});

const toastOutKeyframes = css.keyframes({
  from: { opacity: 1, transform: [{ translateY: 0 }, { scale: 1 }] },
  to: { opacity: 0, transform: [{ translateY: 12 }, { scale: 0.97 }] },
});

const spinLoopKeyframes = css.keyframes({
  from: { transform: [{ rotate: "0deg" }] },
  to: { transform: [{ rotate: "360deg" }] },
});

const pulseLoopKeyframes = css.keyframes({
  "0%": { opacity: 1 },
  "50%": { opacity: 0.5 },
  "100%": { opacity: 1 },
});

const bounceLoopKeyframes = css.keyframes({
  "0%": { transform: [{ translateY: 0 }] },
  "50%": { transform: [{ translateY: -6 }] },
  "100%": { transform: [{ translateY: 0 }] },
});

const pingLoopKeyframes = css.keyframes({
  "0%": { transform: [{ scale: 1 }], opacity: 1 },
  "75%": { transform: [{ scale: 1.5 }], opacity: 0 },
  "100%": { transform: [{ scale: 1.5 }], opacity: 0 },
});

function resolveTailwindAnimate(
  animatePreset: TailwindAnimatePreset | null | undefined,
  reducedMotion: boolean,
): CSSStyle | undefined {
  if (!animatePreset || reducedMotion) return undefined;
  switch (animatePreset) {
    case "spin":
      return {
        animationName: spinLoopKeyframes,
        animationDuration: 1000,
        animationTimingFunction: "linear",
        animationIterationCount: "infinite",
      };
    case "pulse":
      return {
        animationName: pulseLoopKeyframes,
        animationDuration: 2000,
        animationTimingFunction: "ease-in-out",
        animationIterationCount: "infinite",
      };
    case "bounce":
      return {
        animationName: bounceLoopKeyframes,
        animationDuration: 1000,
        animationTimingFunction: "ease-in-out",
        animationIterationCount: "infinite",
      };
    case "ping":
      return {
        animationName: pingLoopKeyframes,
        animationDuration: 1000,
        animationTimingFunction: TAILWIND_PING_EASE,
        animationIterationCount: "infinite",
      };
  }
}

function resolveTransitionTiming(timing: NativeTransitionTiming) {
  return timing === "default" ? TAILWIND_DEFAULT_EASE : timing;
}

function resolvePresetAnimation(
  preset: OverlayMotionPreset | null,
  phase: "enter" | "exit",
  reducedMotion: boolean,
  hasUserTransform: boolean,
): CSSStyle | undefined {
  if (!preset || reducedMotion) return undefined;
  // 드래그 추적 중에는 사용자의 live transform과 입장 keyframe이 충돌하지 않도록 끈다.
  if (hasUserTransform && phase === "enter") return undefined;

  const isEnter = phase === "enter";
  const fill = "both" as const;
  switch (preset) {
    case "backdrop":
      return {
        animationName: isEnter ? backdropInKeyframes : backdropOutKeyframes,
        animationDuration: isEnter ? 180 : 150,
        animationTimingFunction: isEnter ? "ease-out" : "ease-in",
        animationFillMode: fill,
      };
    case "dialog":
      return {
        animationName: isEnter ? dialogInKeyframes : dialogOutKeyframes,
        animationDuration: isEnter ? 200 : 150,
        animationTimingFunction: isEnter ? EASE_OUT_EXPO : EASE_IN_CUBIC,
        animationFillMode: fill,
      };
    case "popover":
      return {
        animationName: isEnter ? popoverInKeyframes : popoverOutKeyframes,
        animationDuration: isEnter ? 160 : 120,
        animationTimingFunction: isEnter ? EASE_OUT_EXPO : EASE_IN_CUBIC,
        animationFillMode: fill,
      };
    case "sheet-top":
      return {
        animationName: isEnter ? sheetTopInKeyframes : sheetTopOutKeyframes,
        animationDuration: isEnter ? 260 : 180,
        animationTimingFunction: isEnter ? EASE_OUT_EXPO : EASE_IN_CUBIC,
        animationFillMode: fill,
      };
    case "sheet-bottom":
      return {
        animationName: isEnter ? sheetBottomInKeyframes : sheetBottomOutKeyframes,
        animationDuration: isEnter ? 260 : 180,
        animationTimingFunction: isEnter ? EASE_OUT_EXPO : EASE_IN_CUBIC,
        animationFillMode: fill,
      };
    case "sheet-left":
      return {
        animationName: isEnter ? sheetLeftInKeyframes : sheetLeftOutKeyframes,
        animationDuration: isEnter ? 260 : 180,
        animationTimingFunction: isEnter ? EASE_OUT_EXPO : EASE_IN_CUBIC,
        animationFillMode: fill,
      };
    case "sheet-right":
      return {
        animationName: isEnter ? sheetRightInKeyframes : sheetRightOutKeyframes,
        animationDuration: isEnter ? 260 : 180,
        animationTimingFunction: isEnter ? EASE_OUT_EXPO : EASE_IN_CUBIC,
        animationFillMode: fill,
      };
    case "toast":
      return {
        animationName: isEnter ? toastInKeyframes : toastOutKeyframes,
        animationDuration: isEnter ? 220 : 160,
        animationTimingFunction: isEnter ? EASE_OUT_EXPO : EASE_IN_CUBIC,
        animationFillMode: fill,
      };
  }
}

function sanitizeUniwindStyle(
  resolved: Record<string, unknown>,
  options: { hasTransition: boolean; reducedMotion: boolean; className?: string },
): ViewStyle {
  const {
    transitionProperty: _tp,
    transitionDuration: _td,
    transitionTimingFunction: _ttf,
    transitionDelay: _delay,
    transitionBehavior: _behavior,
    transition: _shorthand,
    animationName: _an,
    animationDuration: _ad,
    animationTimingFunction: _atf,
    animationDelay: _adl,
    animationIterationCount: _aic,
    animationDirection: _adir,
    animationFillMode: _afm,
    animationPlayState: _aps,
    animation: _animShorthand,
    ...rest
  } = resolved;

  if (!options.hasTransition || options.reducedMotion) {
    return rest as ViewStyle;
  }

  const spec = parseNativeTransitionSpec(options.className);
  if (!spec) {
    return rest as ViewStyle;
  }

  return {
    ...rest,
    transitionProperty: spec.properties,
    transitionDuration: spec.durationMs,
    ...(spec.delayMs > 0 ? { transitionDelay: spec.delayMs } : {}),
    transitionTimingFunction: resolveTransitionTiming(spec.timing),
  } as ViewStyle;
}

function ReanimatedMotionView({
  viewRef,
  className,
  style,
  preset,
  hasTransition,
  animatePreset = null,
  phase,
  reducedMotion,
  hasUserTransform,
  children,
  ...rest
}: NativeMotionViewProps) {
  const resolvedClass = useResolveClassNames(className ?? "");
  const sanitizedBase = useMemo(
    () =>
      sanitizeUniwindStyle(resolvedClass as Record<string, unknown>, {
        hasTransition,
        reducedMotion,
        className,
      }),
    [resolvedClass, hasTransition, reducedMotion, className],
  );
  const animationStyle = useMemo(
    () =>
      resolvePresetAnimation(
        preset,
        phase,
        reducedMotion,
        hasUserTransform,
      ) ?? resolveTailwindAnimate(animatePreset, reducedMotion),
    [preset, phase, reducedMotion, hasUserTransform, animatePreset],
  );

  return (
    <Animated.View
      ref={viewRef as never}
      style={[sanitizedBase, style as ViewStyle | undefined, animationStyle] as never}
      {...rest}
    >
      {children}
    </Animated.View>
  );
}

function ReanimatedBackdrop({
  className,
  phase,
  reducedMotion,
}: NativeMotionBackdropProps) {
  const resolvedClass = useResolveClassNames(className ?? "");
  const animationStyle = useMemo(
    () => resolvePresetAnimation("backdrop", phase, reducedMotion, false),
    [phase, reducedMotion],
  );
  return (
    <Animated.View
      pointerEvents="none"
      style={
        [
          StyleSheet.absoluteFill,
          resolvedClass as ViewStyle,
          reducedMotion ? { opacity: phase === "enter" ? 1 : 0 } : animationStyle,
        ] as never
      }
    />
  );
}

function ReanimatedLoopRotate({
  children,
  durationMs = 1000,
  reducedMotion,
}: LoopRotateProps & { reducedMotion: boolean }) {
  const style = useMemo<CSSStyle | undefined>(
    () =>
      reducedMotion
        ? undefined
        : {
            animationName: spinLoopKeyframes,
            animationDuration: durationMs,
            animationTimingFunction: "linear",
            animationIterationCount: "infinite",
          },
    [durationMs, reducedMotion],
  );
  if (reducedMotion) return <>{children}</>;
  return <Animated.View style={style as never}>{children}</Animated.View>;
}

function ReanimatedLoopPulse({
  children,
  durationMs = 2000,
  reducedMotion,
}: LoopPulseProps & { reducedMotion: boolean }) {
  const style = useMemo<CSSStyle | undefined>(
    () =>
      reducedMotion
        ? undefined
        : {
            animationName: pulseLoopKeyframes,
            animationDuration: durationMs,
            animationTimingFunction: "ease-in-out",
            animationIterationCount: "infinite",
          },
    [durationMs, reducedMotion],
  );
  if (reducedMotion) return <>{children}</>;
  return <Animated.View style={style as never}>{children}</Animated.View>;
}

const REANIMATED_MOTION_DRIVER: NativeMotionDriver = {
  AnimatedView: ReanimatedMotionView,
  Backdrop: ReanimatedBackdrop,
  LoopRotate: ReanimatedLoopRotate,
  LoopPulse: ReanimatedLoopPulse,
};

/**
 * Reanimated 4 CSS Animations / Transitions 모션 드라이버를 활성화한다(앱 부트 1회).
 * 되돌리기는 `uninstallReanimatedMotion()`.
 */
export function installReanimatedMotion(): void {
  setMotionDriver(REANIMATED_MOTION_DRIVER);
}

export function uninstallReanimatedMotion(): void {
  setMotionDriver(null);
}

export function isReanimatedMotionInstalled(): boolean {
  return getMotionDriver() === REANIMATED_MOTION_DRIVER;
}
