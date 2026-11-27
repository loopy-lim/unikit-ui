/**
 * 네이티브 브리지 — React Native（iOS/Android） + uniwind 소비자용.
 *
 * RN 프리미티브를 그대로 재노출한다. className은 uniwind가 빌드 타임에
 * RN 스타일로 컴파일한다（metro.config.js의 withUniwindConfig — 앱 책임）.
 * RN 관용 프로퍼티（hitSlop 등）는 네이티브 그대로 전달된다.
 *
 * 웹 관용 프로퍼티는 RN 관용으로 치환한다:
 *   disabled（버튼）→ RN 표준 disabled · onChangeText는 RN 표준 그대로
 * aria-* 프로퍼티는 RN 0.7x+가 네이티브 관용으로 지원한다.
 *
 * 사이클 40 확장（잔여 shadcn 33종 이식 지원）: Portal（RN Modal transparent）
 * ScrollView（RN ScrollView + ref scrollTo）Select/SelectOption（Pressable
 * 트리거 + Modal 목록 폴백 — 웹 <select> 대응）measureInWindow（ref.measure）
 * useDrag（PanResponder）오버레이 훈 4종은 no-op（RN Modal이 OS 수준에서
 * 포커스ESC（뒤로가기）스크롤 잠금을 처리）.
 * 루프 애니메이션 래퍼 LoopRotate/LoopPulse — RN Animated useNativeDriver
 * （UI 스레드）로 web:animate-spin/pulse와 같은 효과를 구동（웹은 투명）.
 *
 * 단일 import 원칙(AC-1) 확장: SectionList·KeyboardAvoidingView·Platform·
 * Dimensions·Share를 RN에서 재노출한다 — 소비 화면 코드가 react-native를
 * 직접 import하지 않아도 양 플랫폼에서 동작한다. web.tsx는 같은 이름의
 * DOM 폴백을 제공한다.
 *
 * 사이클 90 확장（docs/sdd/92-design-plan §2）: Pressable onHoverIn/onHoverOut/
 * onFocus/onBlur는 RN Pressable 고유 프로퍼티와 동일명이라 rest 전파로 동작
 * （터치 기기에서는 hover가 발화하지 않는다）. View onLayout은 RN 관용
 * 시그니처({nativeEvent:{layout}})를 {width,height}로 좁혀 전달.
 *
 * 잔여 RN 갭 감사 후속: TextInput autoComplete은 RN 관용 프로퍼티와 동일명 —
 * 브리지 string 계약을 RN 토큰 유니언으로 좁혀 전달한다. BridgeStyle 퍼센트
 * 차원（"N%" 문자열）은 resolveNativeStyle이 position:"fixed" 치환과 transform
 * 단축키 전개 외에 키를 건드리지 않아 RN DimensionValue %로 그대로 흐른다
 * （상대 기준 부모 박스 — 계약 상세는 bridge/types.ts BridgeStyle 주석）.
 *
 * Slot（잔여 RN 갭 감사 후속）: radix Slot(asChild) 상당 — bridge/slot.ts 공유
 * 구현을 그대로 재노출한다. cloneElement만 쓰는 순수 React라 네이티브에서
 * 별도 구현이 필요 없다（web.tsx도 같은 구현 — motion-registry 공유 패턴）.
 *
 * 웹 전용 계약의 네이티브 한계（컴포넌트 머리 주석에 기록됨）:
 *   aria-currentaria-invalidaria-describedby → RN 계약 없음, 폐기
 *   View/Pressable onKeyDown → Android는 RN 0.88 코어 W3C 규격 View onKeyDown에
 *     연결（이슈 #19 — 하드웨어 키보드·DPAD, focusable+포커스 필요, 수정자 4종
 *     실측값）. iOS는 코어에 일반 View 키 계약이 없어 폐기（한계）
 *   View onHoverIn/onHoverOut → 폐기（RN View 계약 — Pressable만 hover 보유）
 *   TextInput onKeyDown → RN onKeyPress（{key}）로 래핑（preventDefault는 no-op,
 *   shiftKey는 시프트된 글자 대문자에서 유도 — 근사 한계는 bridge/types.ts）
 *   Select name·required·tabIndex·ariaHidden → RN에 HTML 폼 계약이 없어 폐기
 *     （select.tsx의 sr-only 숨김 네이티브 셀렉트 폼 제출·제약 검증 연동 전용 —
 *     web.tsx만 전달）
 *   useReposition → 모달이 창 좌표에 고정이라 위치 재계산은 없고, 화면 회전·
 *     폴딩 대비 Dimensions 변경 구독만 재노출한다(하단 구현 — 이전 주석의
 *     "no-op" 기술은 드리프트였다)
 */
import {
  Children,
  Fragment,
  createContext,
  forwardRef,
  isValidElement,
  useContext,
  useEffect,
  useId,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
  type ReactElement,
  type ReactNode,
  type Ref,
} from "react";
import {
  AccessibilityInfo,
  Animated,
  Dimensions,
  Easing,
  Image as RNImage,
  KeyboardAvoidingView as RNKeyboardAvoidingView,
  LayoutAnimation,
  Modal as RNModal,
  PanResponder,
  Platform,
  Pressable as RNPressable,
  ScrollView as RNScrollView,
  SectionList as RNSectionList,
  Share,
  StyleSheet,
  Text as RNText,
  TextInput as RNTextInput,
  UIManager,
  View as RNView,
  type ImageInstance,
  type ImageStyle,
  type PressableInstance,
  type ScrollViewInstance,
  type TextInstance,
  type TextStyle,
  type TextInputInstance,
  type TextInputProps as RNTextInputProps,
  type ViewInstance,
  type ViewStyle,
} from "react-native";
import { Uniwind, useResolveClassNames } from "uniwind";
import {
  AlertCircleIcon as LucideAlertCircleIcon,
  ArrowDownIcon as LucideArrowDownIcon,
  ArrowLeftIcon as LucideArrowLeftIcon,
  ArrowRightIcon as LucideArrowRightIcon,
  ArrowUpIcon as LucideArrowUpIcon,
  BoldIcon as LucideBoldIcon,
  CheckCircle2Icon as LucideCheckCircle2Icon,
  CheckIcon as LucideCheckIcon,
  ChevronDownIcon as LucideChevronDownIcon,
  ChevronLeftIcon as LucideChevronLeftIcon,
  ChevronRightIcon as LucideChevronRightIcon,
  ChevronUpIcon as LucideChevronUpIcon,
  CircleIcon as LucideCircleIcon,
  CodeIcon as LucideCodeIcon,
  GripVerticalIcon as LucideGripVerticalIcon,
  Heading1Icon as LucideHeading1Icon,
  Heading2Icon as LucideHeading2Icon,
  InfoIcon as LucideInfoIcon,
  ItalicIcon as LucideItalicIcon,
  ListIcon as LucideListIcon,
  ListOrderedIcon as LucideListOrderedIcon,
  Loader2Icon as LucideLoader2Icon,
  MinusIcon as LucideMinusIcon,
  MoreHorizontalIcon as LucideMoreHorizontalIcon,
  PanelLeftIcon as LucidePanelLeftIcon,
  Redo2Icon as LucideRedo2Icon,
  SearchIcon as LucideSearchIcon,
  StrikethroughIcon as LucideStrikethroughIcon,
  TextQuoteIcon as LucideTextQuoteIcon,
  Undo2Icon as LucideUndo2Icon,
  XCircleIcon as LucideXCircleIcon,
  XIcon as LucideXIcon,
  type LucideIcon,
} from "lucide-react-native";

import { cn } from "../lib/utils";
import { Slot } from "./slot";
import {
  detectOverlayMotionPreset,
  detectTailwindAnimatePreset,
  extractUniversalTransform,
  getMotionDriver,
  hasNativeTransitionClass,
  parseDurationMs,
  parseRotateDeg,
  subscribeMotionDriver,
  type OverlayMotionPhase,
  type OverlayMotionPreset,
  type TailwindAnimatePreset,
} from "./motion-registry";
import type {
  AnimateLayoutFn,
  ApplyColorScheme,
  BridgeColorScheme,
  BridgeDragEvent,
  BridgeImageRef,
  BridgeKeyEvent,
  BridgePressableRef,
  BridgeScrollEvent,
  BridgeScrollViewRef,
  BridgeStyle,
  BridgeSelectRef,
  BridgeTextRef,
  BridgeTextInputRef,
  IconProps,
  BridgeViewRef,
  ImageProps,
  LoopPulseProps,
  LoopRotateProps,
  MeasureCallback,
  MeasureInWindow,
  PortalHostProps,
  PortalProps,
  PressableProps,
  ScrollViewProps,
  SectionListComponent,
  KeyboardAvoidingViewComponent,
  SelectOptGroupProps,
  SelectOptionProps,
  SelectProps,
  TextProps,
  TextInputProps,
  BridgeRole,
  GetViewport,
  UseColorScheme,
  UseDismiss,
  UseDragOptions,
  UseDragResult,
  UseOverlayFocus,
  UseReposition,
  UseScrollLock,
  ViewProps,
} from "./types";

// 공유 타입 전량 재수출 — 소비자는 @unikit-bridge/ui/primitives에서 타입까지 한 번에 import
export type * from "./types";

/** Tailwind 클래스 없이도 확정 동작하는 고정 스타일（백드롭은 StyleSheet.absoluteFill 토큰 사용） */
const STYLES = StyleSheet.create({
  selectList: { maxHeight: 288 },
  portalHostRoot: { flex: 1 },
});

// ---------------------------------------------------------------------------
// 접근성 모션 감소(Reduced Motion) & 색 스킴 스토어
// ---------------------------------------------------------------------------
let reducedMotionEnabled = false;
let reducedMotionInitialized = false;
const reducedMotionListeners = new Set<() => void>();

function ensureReducedMotionSubscribed() {
  if (reducedMotionInitialized) return;
  reducedMotionInitialized = true;
  if (typeof AccessibilityInfo?.isReduceMotionEnabled === "function") {
    AccessibilityInfo.isReduceMotionEnabled()
      .then((enabled) => {
        if (enabled !== reducedMotionEnabled) {
          reducedMotionEnabled = enabled;
          reducedMotionListeners.forEach((listener) => listener());
        }
      })
      .catch(() => {});
  }
  if (typeof AccessibilityInfo?.addEventListener === "function") {
    AccessibilityInfo.addEventListener("reduceMotionChanged", (enabled) => {
      if (enabled !== reducedMotionEnabled) {
        reducedMotionEnabled = enabled;
        reducedMotionListeners.forEach((listener) => listener());
      }
    });
  }
}

const subscribeReducedMotion = (listener: () => void) => {
  ensureReducedMotionSubscribed();
  reducedMotionListeners.add(listener);
  return () => {
    reducedMotionListeners.delete(listener);
  };
};
const getReducedMotionSnapshot = () => reducedMotionEnabled;
const getReducedMotionServerSnapshot = () => false;

function useReducedMotionNative(): boolean {
  return useSyncExternalStore(
    subscribeReducedMotion,
    getReducedMotionSnapshot,
    getReducedMotionServerSnapshot,
  );
}

const getMotionDriverSnapshot = () => getMotionDriver();
function useMotionDriver() {
  return useSyncExternalStore(
    subscribeMotionDriver,
    getMotionDriverSnapshot,
    getMotionDriverSnapshot,
  );
}

const MODAL_EXIT_WAIT_MS = 180;
const EASE_OUT_EXPO = Easing.bezier(0.22, 1, 0.36, 1);
const EASE_IN_CUBIC = Easing.in(Easing.cubic);

type NativeTransformEntry =
  | { translateX: number }
  | { translateY: number }
  | { scale: number }
  | { rotate: string };

type ResolvedNativeStyleResult = {
  resolvedStyle: ViewStyle | undefined;
  translateX: number;
  translateY: number;
  scale: number;
  rotate: string | undefined;
  hasTransform: boolean;
};

/**
 * `BridgeStyle`의 `position: "fixed"` → `"absolute"` 치환 및 범용 변환 단축키
 * (`translateX`/`translateY`/`scale`/`rotate`)를 RN `transform` 배열로 변환한다.
 */
function resolveNativeStyle(style?: BridgeStyle): ResolvedNativeStyleResult {
  if (!style) {
    return {
      resolvedStyle: undefined,
      translateX: 0,
      translateY: 0,
      scale: 1,
      rotate: undefined,
      hasTransform: false,
    };
  }
  const extracted = extractUniversalTransform(style);
  const rawRest = (extracted.restStyle ?? {}) as Record<string, unknown>;
  const fixedApplied =
    rawRest.position === "fixed" ? { ...rawRest, position: "absolute" } : rawRest;

  if (!extracted.hasTransformShorthand) {
    const existing = fixedApplied.transform;
    const hasTransform = Array.isArray(existing) ? existing.length > 0 : Boolean(existing);
    return {
      resolvedStyle: (Object.keys(fixedApplied).length > 0
        ? fixedApplied
        : undefined) as ViewStyle | undefined,
      translateX: 0,
      translateY: 0,
      scale: 1,
      rotate: undefined,
      hasTransform,
    };
  }

  const transforms: NativeTransformEntry[] = Array.isArray(fixedApplied.transform)
    ? [...(fixedApplied.transform as NativeTransformEntry[])]
    : [];
  if (extracted.translateX !== undefined) transforms.push({ translateX: extracted.translateX });
  if (extracted.translateY !== undefined) transforms.push({ translateY: extracted.translateY });
  if (extracted.scale !== undefined) transforms.push({ scale: extracted.scale });
  if (extracted.rotate !== undefined) transforms.push({ rotate: extracted.rotate });

  const merged: Record<string, unknown> = {
    ...fixedApplied,
    transform: transforms,
  };
  return {
    resolvedStyle: merged as ViewStyle,
    translateX: extracted.translateX ?? 0,
    translateY: extracted.translateY ?? 0,
    scale: extracted.scale ?? 1,
    rotate: extracted.rotate,
    hasTransform: transforms.length > 0,
  };
}

// ---------------------------------------------------------------------------
// 접근성 역할 매핑 — 웹 ARIA role 중 RN 유효 목록에 없는 값(tabpanel·dialog·
// listbox 등)은 Android 런타임에서 "Invalid accessibility role value" 크래시를
// 낸다(2026-11-10 에뮬레이터 실증 — 기존 "네이티브에서 무시된다" 판단 정정).
// 컴포넌트는 웹 role을 그대로 쓰고 브리지가 근접 RN 값으로 치환한다
// (플랫폼 분기는 브리지가 담당한다는 원칙의 적용).
// ---------------------------------------------------------------------------
const RN_VALID_ROLES = new Set([
  "none", "button", "link", "search", "image", "keyboardkey", "text",
  "adjustable", "imagebutton", "header", "summary", "alert", "checkbox",
  "combobox", "menu", "menubar", "menuitem", "progressbar", "radio",
  "radiogroup", "scrollbar", "spinbutton", "switch", "tab", "tablist",
  "timer", "toolbar",
]);

/** RN에 없는 웹 role → 근접 RN 역할. 대응이 없으면 none으로 낮춘다. */
const RN_ROLE_FALLBACK: Partial<Record<BridgeRole, string>> = {
  // 오버레이 계열 — RN alert(중요 알림)이 가장 근접.
  dialog: "alert",
  alertdialog: "alert",
  // 웹 heading — RN은 header.
  heading: "header",
  // 범위 입력 — RN은 adjustable.
  slider: "adjustable",
};

const toNativeRole = (role?: BridgeRole) => {
  if (!role) return undefined;
  if (RN_VALID_ROLES.has(role)) return role;
  return RN_ROLE_FALLBACK[role] ?? "none";
};

/** RN 합성 키 이벤트의 구조적 최소 형태 — Android KeyDownEvent(NativeSyntheticEvent<KeyEvent>)
 *  에서 브리지가 읽는 부분집합. RN의 KeyDownEvent가 이 형태를 구조적으로 만족한다. */
type NativeKeyDownLike = {
  nativeEvent: {
    key: string;
    ctrlKey?: boolean;
    altKey?: boolean;
    metaKey?: boolean;
    shiftKey?: boolean;
  };
  preventDefault: () => void;
  stopPropagation: () => void;
};

/**
 * Android W3C 규격 View 키 이벤트(RN KeyDownEvent — JSKeyDispatcher가 포커스된
 * focusable 뷰에 발화, 이슈 #19)를 BridgeKeyEvent으로 좁힌다. key·수정자 4종은
 * 네이티브 실측값이고 preventDefault/stopPropagation은 RN 합성 이벤트에 위임한다.
 * TextInput 래핑과 달리 시프트 근사가 없다 — View 경로는 실측 수정자를 준다.
 */
const toBridgeKeyEvent = (event: NativeKeyDownLike): BridgeKeyEvent => ({
  key: event.nativeEvent.key,
  ctrlKey: event.nativeEvent.ctrlKey,
  altKey: event.nativeEvent.altKey,
  metaKey: event.nativeEvent.metaKey,
  shiftKey: event.nativeEvent.shiftKey,
  preventDefault: () => event.preventDefault(),
  stopPropagation: () => event.stopPropagation(),
});

/** Android 전용 키 연결 — iOS 뷰 설정에는 topKeyDown이 없어 미발화 경로를
 *  아예 전달하지 않는다(미등록 이벤트 prop 경고 방지 — 이슈 #19). */
const androidKeyDown = (onKeyDown?: (event: BridgeKeyEvent) => void) =>
  onKeyDown && Platform.OS === "android"
    ? (event: NativeKeyDownLike) => onKeyDown(toBridgeKeyEvent(event))
    : undefined;

const PortalPhaseContext = createContext<OverlayMotionPhase>("enter");

function presetEnterDuration(preset: OverlayMotionPreset | null): number {
  switch (preset) {
    case "dialog":
      return 200;
    case "popover":
      return 160;
    case "sheet-top":
    case "sheet-bottom":
    case "sheet-left":
    case "sheet-right":
      return 260;
    case "toast":
      return 220;
    case "backdrop":
      return 180;
    default:
      return 200;
  }
}

function presetExitDuration(preset: OverlayMotionPreset | null): number {
  switch (preset) {
    case "dialog":
      return 150;
    case "popover":
      return 120;
    case "sheet-top":
    case "sheet-bottom":
    case "sheet-left":
    case "sheet-right":
      return 180;
    case "toast":
      return 160;
    case "backdrop":
      return 150;
    default:
      return 150;
  }
}

type CoreAnimatedViewProps = {
  viewRef: Ref<ViewInstance> | undefined;
  className?: string;
  style?: BridgeStyle;
  preset: OverlayMotionPreset | null;
  hasTransition: boolean;
  animatePreset?: TailwindAnimatePreset | null;
  phase: OverlayMotionPhase;
  reducedMotion: boolean;
  resolvedStyle: ViewStyle | undefined;
  extracted: ResolvedNativeStyleResult;
  children?: ReactNode;
  [key: string]: unknown;
};

/**
 * 기본 RN 0.88 코어 Animated 드라이버(`useNativeDriver: true`).
 * Reanimated 드라이버가 설치되지 않은 앱에서도 오버레이 등장/퇴장 및 Switch·
 * Toast·Drawer 스냅백 전환을 UI 스레드에서 구동한다.
 */
function CoreAnimatedView({
  viewRef,
  className,
  style,
  preset,
  hasTransition,
  animatePreset: _animatePreset,
  phase,
  reducedMotion,
  resolvedStyle,
  extracted,
  children,
  ...rnViewProps
}: CoreAnimatedViewProps) {
  const classResolved = useResolveClassNames(className ?? "");
  const styleOpacity =
    typeof style?.opacity === "number" ? style.opacity : undefined;
  const classOpacity =
    typeof classResolved.opacity === "number" ? classResolved.opacity : undefined;
  const targetOpacity = styleOpacity ?? classOpacity ?? 1;

  const targetTx = extracted.translateX;
  const targetTy = extracted.translateY;
  const targetScale = extracted.scale;
  const durationMs = parseDurationMs(className, 200);

  const presenceProgress = useRef(
    new Animated.Value(reducedMotion || !preset ? 1 : 0),
  ).current;
  const transOpacity = useRef(new Animated.Value(targetOpacity)).current;
  const transX = useRef(new Animated.Value(targetTx)).current;
  const transY = useRef(new Animated.Value(targetTy)).current;
  const transScale = useRef(new Animated.Value(targetScale)).current;
  const prevTargets = useRef({
    opacity: targetOpacity,
    tx: targetTx,
    ty: targetTy,
    scale: targetScale,
  });

  useEffect(() => {
    if (!preset) {
      presenceProgress.setValue(1);
      return;
    }
    if (reducedMotion) {
      presenceProgress.setValue(phase === "enter" ? 1 : 0);
      return;
    }
    if (phase === "enter") {
      presenceProgress.setValue(0);
      Animated.timing(presenceProgress, {
        toValue: 1,
        duration: presetEnterDuration(preset),
        easing: EASE_OUT_EXPO,
        useNativeDriver: true,
      }).start();
    } else {
      Animated.timing(presenceProgress, {
        toValue: 0,
        duration: presetExitDuration(preset),
        easing: EASE_IN_CUBIC,
        useNativeDriver: true,
      }).start();
    }
  }, [preset, phase, reducedMotion, presenceProgress]);

  useEffect(() => {
    const prev = prevTargets.current;
    const animateChange = hasTransition && !reducedMotion;
    const animations: Animated.CompositeAnimation[] = [];

    const syncVal = (animVal: Animated.Value, prevVal: number, nextVal: number) => {
      if (prevVal === nextVal) return;
      if (animateChange) {
        animations.push(
          Animated.timing(animVal, {
            toValue: nextVal,
            duration: durationMs,
            easing: EASE_OUT_EXPO,
            useNativeDriver: true,
          }),
        );
      } else {
        animVal.setValue(nextVal);
      }
    };

    syncVal(transOpacity, prev.opacity, targetOpacity);
    syncVal(transX, prev.tx, targetTx);
    syncVal(transY, prev.ty, targetTy);
    syncVal(transScale, prev.scale, targetScale);
    prevTargets.current = {
      opacity: targetOpacity,
      tx: targetTx,
      ty: targetTy,
      scale: targetScale,
    };

    if (animations.length > 0) {
      Animated.parallel(animations).start();
    }
  }, [
    hasTransition,
    reducedMotion,
    durationMs,
    targetOpacity,
    targetTx,
    targetTy,
    targetScale,
    transOpacity,
    transX,
    transY,
    transScale,
  ]);

  const combinedOpacity = preset
    ? hasTransition
      ? Animated.multiply(presenceProgress, transOpacity)
      : presenceProgress
    : hasTransition || styleOpacity !== undefined
      ? transOpacity
      : undefined;

  const animatedTransforms: Record<string, unknown>[] = [];
  if (preset && !reducedMotion) {
    switch (preset) {
      case "dialog":
        animatedTransforms.push({
          scale: presenceProgress.interpolate({
            inputRange: [0, 1],
            outputRange: [0.95, 1],
          }),
        });
        break;
      case "popover":
        animatedTransforms.push({
          scale: presenceProgress.interpolate({
            inputRange: [0, 1],
            outputRange: [0.96, 1],
          }),
        });
        animatedTransforms.push({
          translateY: presenceProgress.interpolate({
            inputRange: [0, 1],
            outputRange: [-4, 0],
          }),
        });
        break;
      case "sheet-top":
        animatedTransforms.push({
          translateY: presenceProgress.interpolate({
            inputRange: [0, 1],
            outputRange: [-64, 0],
          }),
        });
        break;
      case "sheet-bottom":
        animatedTransforms.push({
          translateY: presenceProgress.interpolate({
            inputRange: [0, 1],
            outputRange: [64, 0],
          }),
        });
        break;
      case "sheet-left":
        animatedTransforms.push({
          translateX: presenceProgress.interpolate({
            inputRange: [0, 1],
            outputRange: [-64, 0],
          }),
        });
        break;
      case "sheet-right":
        animatedTransforms.push({
          translateX: presenceProgress.interpolate({
            inputRange: [0, 1],
            outputRange: [64, 0],
          }),
        });
        break;
      case "toast":
        animatedTransforms.push({
          translateY: presenceProgress.interpolate({
            inputRange: [0, 1],
            outputRange: [12, 0],
          }),
        });
        animatedTransforms.push({
          scale: presenceProgress.interpolate({
            inputRange: [0, 1],
            outputRange: [0.97, 1],
          }),
        });
        break;
    }
  }

  if (extracted.hasTransform || hasTransition) {
    animatedTransforms.push({ translateX: transX });
    animatedTransforms.push({ translateY: transY });
    animatedTransforms.push({ scale: transScale });
    if (extracted.rotate !== undefined) {
      animatedTransforms.push({ rotate: extracted.rotate });
    }
  }

  // resolvedStyle에서 static transform/opacity를 빼고 Animated.Value로 일원화한다.
  const baseRestStyle = useMemo(() => {
    if (!resolvedStyle) return undefined;
    const clone = { ...(resolvedStyle as Record<string, unknown>) };
    delete clone.transform;
    if (combinedOpacity !== undefined) delete clone.opacity;
    return clone as ViewStyle;
  }, [resolvedStyle, combinedOpacity]);

  const motionOverlayStyle = useMemo(
    () =>
      ({
        ...(combinedOpacity !== undefined ? { opacity: combinedOpacity } : {}),
        ...(animatedTransforms.length > 0 ? { transform: animatedTransforms } : {}),
      }) as ViewStyle,
    // Animated.Value 참조는 안정적이므로 length·여부 변화 시에만 재조립
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [Boolean(combinedOpacity), animatedTransforms.length, extracted.rotate],
  );

  return (
    <Animated.View
      ref={viewRef as Ref<Animated.AnimatedComponent<typeof RNView>> as never}
      className={className}
      style={[baseRestStyle, motionOverlayStyle] as never}
      {...rnViewProps}
    >
      {children}
    </Animated.View>
  );
}

type MotionViewProps = CoreAnimatedViewProps & {
  rawStyle?: BridgeStyle;
};

function MotionView({
  viewRef,
  className,
  rawStyle,
  style: _ignoredStyle,
  preset,
  hasTransition,
  animatePreset = null,
  phase: _ignoredPhase,
  reducedMotion: _ignored,
  resolvedStyle,
  extracted,
  children,
  ...rnViewProps
}: MotionViewProps) {
  const driver = useMotionDriver();
  const phase = useContext(PortalPhaseContext);
  const reducedMotion = useReducedMotionNative();

  if (driver) {
    const DriverAnimatedView = driver.AnimatedView;
    return (
      <DriverAnimatedView
        viewRef={viewRef}
        className={className}
        style={resolvedStyle}
        preset={preset}
        hasTransition={hasTransition}
        animatePreset={animatePreset}
        phase={phase}
        reducedMotion={reducedMotion}
        hasUserTransform={extracted.hasTransform}
        {...rnViewProps}
      >
        {children}
      </DriverAnimatedView>
    );
  }

  return (
    <CoreAnimatedView
      viewRef={viewRef}
      className={className}
      style={rawStyle}
      preset={preset}
      hasTransition={hasTransition}
      animatePreset={animatePreset}
      phase={phase}
      reducedMotion={reducedMotion}
      resolvedStyle={resolvedStyle}
      extracted={extracted}
      {...rnViewProps}
    >
      {children}
    </CoreAnimatedView>
  );
}

// ---------------------------------------------------------------------------
// View — RN View 재노출（타입만 브리지 계약으로 좁힌다）.
// aria-modal → accessibilityViewIsModal, aria-describedby는 RN 계약 없음（폐기）.
// accessibilityRole="alert"|"status" → Android accessibilityLiveRegion 매핑.
// 인라인 style의 position:"fixed"（웹 포탈 오버레이 관용）은 RN에 없는 값이라
// "absolute"로 치환하고, 범용 transform 단축키(`translateX`/`translateY`/
// `scale`/`rotate`)를 RN transform 배열로 풀어준다.
// `unikit-*` 모션 프리셋 또는 `transition*` 클래스가 있으면 MotionView(기본 RN
// Animated 또는 @unikit-bridge/ui/motion의 Reanimated 4 CSS 드라이버)로 위임한다.
// ---------------------------------------------------------------------------
const View = forwardRef<BridgeViewRef, ViewProps>(
  (
    {
      className,
      style,
      children,
      nativeID,
      testID,
      accessibilityRole,
      accessibilityLabel,
      "aria-hidden": ariaHidden,
      "aria-modal": ariaModal,
      "aria-describedby": _ariaDescribedBy, // 웹 전용 — RN 미지원(한계)
      "aria-valuenow": ariaValueNow,
      "aria-valuemin": ariaValueMin,
      "aria-valuemax": ariaValueMax,
      "aria-expanded": _ariaExpanded, // 웹 전용 — RN 미지원(폐기)
      "aria-controls": _ariaControls, // 〃
      "aria-labelledby": _ariaLabelledBy, // 〃
      pointerEvents,
      // 사이클 90 — onLayout은 RN 관용 시그니처({nativeEvent:{layout}})를
      // {width,height}로 좁혀 전달. hover 2종은 RN View 계약이 없어 폐기한다
      // (웹 전용 — Pressable에는 hover/focus가 있다). onKeyDown은 이슈 #19로
      // Android에서 실연결됐다(조상 카드 패턴 — 버블링 수신).
      onLayout,
      onKeyDown,
      focusable,
      onHoverIn: _onHoverIn,
      onHoverOut: _onHoverOut,
      ...rest
    },
    ref,
  ) => {
    const extracted = resolveNativeStyle(style);
    const liveRegion =
      accessibilityRole === "alert"
        ? "assertive"
        : accessibilityRole === "status"
          ? "polite"
          : undefined;
    const rnProps = {
      nativeID,
      testID,
      onLayout: onLayout
        ? (event: { nativeEvent: { layout: { width: number; height: number } } }) =>
            onLayout({
              width: event.nativeEvent.layout.width,
              height: event.nativeEvent.layout.height,
            })
        : undefined,
      accessibilityRole: toNativeRole(accessibilityRole),
      accessibilityLabel,
      accessibilityLiveRegion: liveRegion,
      "aria-hidden": ariaHidden,
      accessibilityElementsHidden: ariaHidden,
      accessibilityViewIsModal: ariaModal,
      accessibilityValue: toAccessibilityValue({
        "aria-valuenow": ariaValueNow,
        "aria-valuemin": ariaValueMin,
        "aria-valuemax": ariaValueMax,
      }),
      pointerEvents,
      onKeyDown: androidKeyDown(onKeyDown),
      focusable,
      ...rest,
    };

    const preset = detectOverlayMotionPreset(className);
    const hasTransition = hasNativeTransitionClass(className);
    const animatePreset = detectTailwindAnimatePreset(className);
    if (preset !== null || hasTransition || animatePreset !== null) {
      return (
        <MotionView
          viewRef={ref as Ref<ViewInstance>}
          className={className}
          rawStyle={style}
          style={style}
          preset={preset}
          hasTransition={hasTransition}
          animatePreset={animatePreset}
          phase="enter"
          reducedMotion={false}
          resolvedStyle={extracted.resolvedStyle}
          extracted={extracted}
          {...(rnProps as Record<string, unknown>)}
        >
          {children}
        </MotionView>
      );
    }

    return (
      <RNView
        ref={ref as Ref<ViewInstance>}
        className={className}
        style={extracted.resolvedStyle}
        {...(rnProps as Record<string, unknown>)}
      >
        {children}
      </RNView>
    );
  },
);
View.displayName = "View";

// ---------------------------------------------------------------------------
// Text — RN Text 재노출
// ---------------------------------------------------------------------------
const Text = forwardRef<BridgeTextRef, TextProps>(
  (
    {
      className,
      style,
      children,
      nativeID,
      testID,
      onPress,
      accessibilityRole,
      accessibilityLabel,
      "aria-hidden": ariaHidden,
      ...rest
    },
    ref,
  ) => (
    <RNText
      ref={ref as Ref<TextInstance>}
      nativeID={nativeID}
      testID={testID}
      onPress={onPress}
      accessibilityRole={toNativeRole(accessibilityRole)}
      accessibilityLabel={accessibilityLabel}
      // 장식용 글리프 숨김（T-2a 제기） — View 관례와 동일 치환
      accessibilityElementsHidden={ariaHidden}
      className={className}
      style={resolveNativeStyle(style).resolvedStyle as TextStyle}
      {...rest}
    >
      {children}
    </RNText>
  ),
);
Text.displayName = "Text";

// ---------------------------------------------------------------------------
// Pressable — RN Pressable 재노출. onPress는 RN 시그니처（이벤트 인자）를
// 무인자로 좁혀 브리지 계약과 맞춘다（컴포넌트·데모는 무인자 콜백만 쓴다）.
// aria-* 상태 프로퍼티는 RN 0.77+ 네이티브 관용 별칭으로 그대로 전달한다.
// react-native-web（Expo web 등）은 accessibilityState를 0.21부터 폐기하고
// aria-* 직접 전달만 DOM 속성으로 렌더하므로, 양쪽 모두 aria-* 경로가 정답.
// 네이티브 실기기에서도 동일 값을 accessibilityState로 명시 전달해 구버전
// 스크린리더 호환을 유지한다（코어는 aria-* 별칭을 같은 상태로 병합）.
// ---------------------------------------------------------------------------
function toAccessibilityState(props: {
  disabled?: boolean;
  "aria-checked"?: boolean | "mixed";
  "aria-selected"?: boolean;
  "aria-pressed"?: boolean;
  "aria-current"?: PressableProps["aria-current"];
  "aria-expanded"?: boolean;
}) {
  const state: {
    disabled?: boolean;
    checked?: boolean | "mixed";
    selected?: boolean;
    expanded?: boolean;
  } = {};
  if (props.disabled !== undefined) state.disabled = props.disabled;
  if (props["aria-checked"] !== undefined) state.checked = props["aria-checked"];
  const selected =
    props["aria-selected"] ??
    props["aria-pressed"] ??
    (props["aria-current"] !== undefined && props["aria-current"] !== false
      ? true
      : undefined);
  if (selected !== undefined) state.selected = selected;
  if (props["aria-expanded"] !== undefined) state.expanded = props["aria-expanded"];
  return Object.keys(state).length > 0 ? state : undefined;
}

/** aria-value*（progressslider） → RN accessibilityValue（min/max/now） */
function toAccessibilityValue(props: {
  "aria-valuenow"?: number;
  "aria-valuemin"?: number;
  "aria-valuemax"?: number;
}) {
  const value: { min?: number; max?: number; now?: number } = {};
  if (props["aria-valuemin"] !== undefined) value.min = props["aria-valuemin"];
  if (props["aria-valuemax"] !== undefined) value.max = props["aria-valuemax"];
  if (props["aria-valuenow"] !== undefined) value.now = props["aria-valuenow"];
  return Object.keys(value).length > 0 ? value : undefined;
}

const Pressable = forwardRef<BridgePressableRef, PressableProps>(
  (
    {
      className,
      style,
      children,
      onPress,
      disabled,
      accessibilityLabel,
      accessibilityRole,
      "aria-disabled": ariaDisabled,
      "aria-pressed": ariaPressed,
      "aria-checked": ariaChecked,
      "aria-selected": ariaSelected,
      "aria-expanded": ariaExpanded,
      "aria-controls": ariaControls,
      "aria-labelledby": ariaLabelledBy,
      "aria-valuenow": ariaValueNow,
      "aria-valuemin": ariaValueMin,
      "aria-valuemax": ariaValueMax,
      // 웹 전용 aria-* — RN에서 표현 가능한 상태는 매핑한다.
      "aria-current": ariaCurrent,
      "aria-invalid": ariaInvalid,
      "aria-describedby": _ariaDescribedBy,
      onContextMenu,
      onLongPress,
      onKeyDown,
      onLayout,
      focusable,
      hitSlop,
      nativeID,
      testID,
      ...rest
    },
    ref,
  ) => {
    // context-menu（웹 우클릭）는 네이티브에서 길게 누르기로 매핑된다（§2.1）
    const longPress = onLongPress ?? onContextMenu;
    return (
      <RNPressable
        // BridgePressableRef（구조적 최소 계약） ↔ RN PressableInstance 불일치를
        // unknown 경유 이중 단언으로만 해소 — any 사용 금지（M-3）.
        ref={ref as unknown as Ref<PressableInstance>}
        nativeID={nativeID}
        testID={testID}
        onPress={onPress ? () => onPress() : undefined}
        onLongPress={longPress ? () => longPress() : undefined}
        onLayout={
          onLayout
            ? (event) =>
                onLayout({
                  width: event.nativeEvent.layout.width,
                  height: event.nativeEvent.layout.height,
                })
            : undefined
        }
        disabled={disabled}
        accessibilityLabel={accessibilityLabel}
        accessibilityHint={ariaInvalid ? "유효하지 않은 입력" : undefined}
        accessibilityRole={toNativeRole(accessibilityRole)}
        aria-disabled={ariaDisabled}
        aria-checked={ariaChecked}
        aria-selected={ariaSelected}
        aria-expanded={ariaExpanded}
        aria-labelledby={ariaLabelledBy}
        accessibilityState={toAccessibilityState({
          disabled,
          "aria-checked": ariaChecked,
          "aria-selected": ariaSelected,
          "aria-pressed": ariaPressed,
          "aria-current": ariaCurrent,
          "aria-expanded": ariaExpanded,
        })}
        accessibilityValue={toAccessibilityValue({
          "aria-valuenow": ariaValueNow,
          "aria-valuemin": ariaValueMin,
          "aria-valuemax": ariaValueMax,
        })}
        // aria-pressed（toggle）aria-controls（tab↔panel 연결）은 RN 코어 타입에
        // 없는 RNW 전용 속성 — 무형 스프레드로 전달（네이티브에서는 폐기됨）.
        {...({
          "aria-pressed": ariaPressed,
          "aria-controls": ariaControls,
        } as Record<string, unknown>)}
        hitSlop={hitSlop}
        className={className}
        style={resolveNativeStyle(style).resolvedStyle}
        onKeyDown={androidKeyDown(onKeyDown)}
        focusable={focusable}
        {...rest}
      >
        {children}
      </RNPressable>
    );
  },
);
Pressable.displayName = "Pressable";

// ---------------------------------------------------------------------------
// TextInput — RN TextInput 재노출. 웹 관용 disabled는 네이티브 표준 속성이
// 아니므로 여기서는 버린다（입력 차단 치환 editable={false}는 Input이 수행）.
// onKeyDown（웹）은 RN onKeyPress（{key}）로 래핑 — 변환 불가 키는 미발화,
// preventDefault는 no-op（RN이 입력을 사전 차단하지 않는 한계）. shiftKey는
// 시프트된 글자 대문자에서 유도(이슈 #13 — 근사 한계는 bridge/types.ts).
// aria-invalidaria-describedby는 RN 계약 없음（폐기）.
// autoComplete（잔여 RN 갭 감사 후속）— RN 관용 프로퍼티와 동일명: 브리지
// 계약은 HTML 토큰까지 수용하는 string이라 RN 토큰 유니언으로 좁혀 전달한다.
// ---------------------------------------------------------------------------
const TextInput = forwardRef<BridgeTextInputRef, TextInputProps>(
  (
    {
      className,
      style,
      value,
      defaultValue,
      placeholder,
      editable,
      disabled: _disabled, // 웹 관용 — 네이티브는 위 editable 치환으로 이미 반영됨
      onChangeText,
      nativeID,
      testID,
      accessibilityLabelledBy,
      autoFocus,
      secureTextEntry,
      inputMode,
      autoComplete,
      multiline,
      maxLength,
      onKeyDown,
      onFocus,
      onBlur,
      "aria-invalid": ariaInvalid,
      "aria-describedby": _ariaDescribedBy,
      ...rest
    },
    ref,
  ) => (
    <RNTextInput
      ref={ref as Ref<TextInputInstance>}
      nativeID={nativeID}
      testID={testID}
      accessibilityLabelledBy={accessibilityLabelledBy}
      accessibilityHint={ariaInvalid ? "유효하지 않은 입력" : undefined}
      className={className}
      style={resolveNativeStyle(style).resolvedStyle as TextStyle}
      value={value}
      defaultValue={defaultValue}
      placeholder={placeholder}
      editable={editable}
      onChangeText={onChangeText}
      autoFocus={autoFocus}
      secureTextEntry={secureTextEntry}
      inputMode={inputMode}
      // 브리지 계약은 string（HTML 토큰 수용） — RN 타입은 관용 토큰 유니언이라
      // 좁힘 캐스트로 전달（무효 토큰의 런타임 거동은 RN이 담당）.
      autoComplete={autoComplete as RNTextInputProps["autoComplete"]}
      multiline={multiline}
      maxLength={maxLength}
      onFocus={onFocus ? () => onFocus() : undefined}
      onBlur={onBlur ? () => onBlur() : undefined}
      onKeyPress={
        onKeyDown
          ? (event) => {
              const key = event.nativeEvent.key;
              onKeyDown({
                key,
                preventDefault: () => {}, // RN 미지원 — no-op(한계)
                // 시프트 유도(이슈 #13) — RN onKeyPress는 key만 주고 수정자
                // 상태가 없어 시프트된 글자(대문자)에서 판정한다(근사 한계는
                // bridge/types.ts).
                shiftKey: key.length === 1 && key !== key.toLowerCase(),
              });
            }
          : undefined
      }
      {...rest}
    />
  ),
);
TextInput.displayName = "TextInput";

// ---------------------------------------------------------------------------
// Image — RN Image 재노출. 원격 {uri} 소스만 브리지 공통 계약으로 한다
// （require（） 정적 소스는 네이티브 전용 기능이므로 타입에서 제외）.
// ---------------------------------------------------------------------------
const Image = forwardRef<BridgeImageRef, ImageProps>(
  (
    {
      className,
      style,
      source,
      alt: _alt, // 웹 관용 — 네이티브는 accessibilityLabel이 스크린리더 텍스트
      onError,
      accessibilityLabel,
      nativeID,
      testID,
      ...rest
    },
    ref,
  ) => (
    <RNImage
      ref={ref as Ref<ImageInstance>}
      nativeID={nativeID}
      testID={testID}
      accessibilityLabel={accessibilityLabel}
      source={source}
      className={className}
      style={resolveNativeStyle(style).resolvedStyle as ImageStyle}
      onError={onError ? () => onError() : undefined}
      {...rest}
    />
  ),
);
Image.displayName = "Image";

// ---------------------------------------------------------------------------
// Portal & PortalHost — RN Modal(transparent) + 비모달 루트 텔레포트.
// modal={true}: animated presence(180ms 퇴장 유예)로 CoreAnimatedView·Reanimated
//   드라이버가 등장·퇴장 애니메이션을 끝까지 재생할 수 있게 한다.
// modal={false}: UnikitThemeProvider가 감싸는 PortalHost 스토어에 등록하면 루트
//   화면 최상위에 pointerEvents="box-none"으로 텔레포트되어 토스트 등이 배경
//   상호작용을 가리지 않고 화면 위에 뜬다. 호스트 밖이면 인라인 절대 View 폴백.
// ---------------------------------------------------------------------------
type PortalEntry = [id: string, node: ReactNode];
type PortalHostStore = {
  set: (id: string, node: ReactNode) => void;
  remove: (id: string) => void;
  subscribe: (listener: () => void) => () => void;
  getSnapshot: () => PortalEntry[];
};

function createPortalHostStore(): PortalHostStore {
  const entries = new Map<string, ReactNode>();
  let snapshot: PortalEntry[] = [];
  const listeners = new Set<() => void>();
  const notify = () => {
    snapshot = Array.from(entries.entries());
    listeners.forEach((listener) => listener());
  };
  return {
    set: (id, node) => {
      entries.set(id, node);
      notify();
    },
    remove: (id) => {
      if (entries.delete(id)) notify();
    },
    subscribe: (listener) => {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    getSnapshot: () => snapshot,
  };
}

const PortalHostContext = createContext<PortalHostStore | null>(null);

function PortalOutlet({ store }: { store: PortalHostStore }) {
  const entries = useSyncExternalStore(
    store.subscribe,
    store.getSnapshot,
    store.getSnapshot,
  );
  if (entries.length === 0) return null;
  return (
    <RNView pointerEvents="box-none" style={StyleSheet.absoluteFill}>
      {entries.map(([id, node]) => (
        <Fragment key={id}>{node}</Fragment>
      ))}
    </RNView>
  );
}

const PortalHost = ({ children }: PortalHostProps) => {
  const storeRef = useRef<PortalHostStore | null>(null);
  if (storeRef.current === null) {
    storeRef.current = createPortalHostStore();
  }
  const store = storeRef.current;
  return (
    <PortalHostContext.Provider value={store}>
      <RNView style={STYLES.portalHostRoot}>
        {children}
        <PortalOutlet store={store} />
      </RNView>
    </PortalHostContext.Provider>
  );
};

function CoreMotionBackdrop({
  className,
  phase,
  reducedMotion,
}: {
  className?: string;
  phase: OverlayMotionPhase;
  reducedMotion: boolean;
}) {
  const opacity = useRef(new Animated.Value(reducedMotion ? 1 : 0)).current;
  useEffect(() => {
    if (reducedMotion) {
      opacity.setValue(phase === "enter" ? 1 : 0);
      return;
    }
    if (phase === "enter") {
      opacity.setValue(0);
      Animated.timing(opacity, {
        toValue: 1,
        duration: 180,
        easing: EASE_OUT_EXPO,
        useNativeDriver: true,
      }).start();
    } else {
      Animated.timing(opacity, {
        toValue: 0,
        duration: 150,
        easing: EASE_IN_CUBIC,
        useNativeDriver: true,
      }).start();
    }
  }, [phase, reducedMotion, opacity]);

  return (
    <Animated.View
      pointerEvents="none"
      className={className}
      style={[StyleSheet.absoluteFill, { opacity }] as never}
    />
  );
}

const Portal = ({
  children,
  visible,
  onBackdropPress,
  onRequestClose,
  backdropClassName,
  modal = true,
}: PortalProps) => {
  const hostStore = useContext(PortalHostContext);
  const reducedMotion = useReducedMotionNative();
  const driver = useMotionDriver();
  const portalId = useId();
  const [rendered, setRendered] = useState(visible);
  const exitTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const shouldRender = visible || rendered;
  const phase: OverlayMotionPhase = visible ? "enter" : "exit";

  useLayoutEffect(() => {
    if (exitTimerRef.current !== null) {
      clearTimeout(exitTimerRef.current);
      exitTimerRef.current = null;
    }
    if (visible) {
      if (!rendered) setRendered(true);
      return;
    }
    if (!rendered) return;
    if (reducedMotion) {
      setRendered(false);
      return;
    }
    exitTimerRef.current = setTimeout(() => {
      exitTimerRef.current = null;
      setRendered(false);
    }, MODAL_EXIT_WAIT_MS);
    return () => {
      if (exitTimerRef.current !== null) {
        clearTimeout(exitTimerRef.current);
        exitTimerRef.current = null;
      }
    };
  }, [visible, rendered, reducedMotion]);

  const hostedNode = useMemo(
    () =>
      !modal && hostStore && shouldRender ? (
        <PortalPhaseContext.Provider value={phase}>
          <RNView
            pointerEvents="box-none"
            className={cn("absolute inset-0", backdropClassName)}
          >
            {children}
          </RNView>
        </PortalPhaseContext.Provider>
      ) : null,
    [modal, hostStore, shouldRender, phase, backdropClassName, children],
  );

  useLayoutEffect(() => {
    if (modal || !hostStore) return;
    if (hostedNode) {
      hostStore.set(portalId, hostedNode);
    } else {
      hostStore.remove(portalId);
    }
    return () => {
      hostStore.remove(portalId);
    };
  }, [modal, hostStore, portalId, hostedNode]);

  if (!shouldRender) return null;
  if (!modal) {
    if (hostStore) return null;
    return (
      <PortalPhaseContext.Provider value={phase}>
        <RNView
          pointerEvents="box-none"
          className={cn("absolute inset-0", backdropClassName)}
        >
          {children}
        </RNView>
      </PortalPhaseContext.Provider>
    );
  }

  const BackdropComp = driver?.Backdrop;

  return (
    <RNModal
      visible={shouldRender}
      transparent
      animationType="none"
      statusBarTranslucent
      onRequestClose={onRequestClose}
    >
      <PortalPhaseContext.Provider value={phase}>
        <RNView className="flex-1">
          {backdropClassName ? (
            BackdropComp ? (
              <BackdropComp
                className={backdropClassName}
                phase={phase}
                reducedMotion={reducedMotion}
              />
            ) : (
              <CoreMotionBackdrop
                className={backdropClassName}
                phase={phase}
                reducedMotion={reducedMotion}
              />
            )
          ) : null}
          {onBackdropPress ? (
            <RNPressable
              accessibilityRole="button"
              accessibilityLabel="닫기"
              style={StyleSheet.absoluteFill}
              onPress={onBackdropPress}
            />
          ) : null}
          {children}
        </RNView>
      </PortalPhaseContext.Provider>
    </RNModal>
  );
};

// ---------------------------------------------------------------------------
// ScrollView — RN ScrollView 재노출. ref.scrollTo는 RN 표준 시그니처
// （x/y/animated） 그대로. 콘텐츠 정렬패딩은 내부 View의
// contentContainerClassName로（가로 스크롤 시 소비자가 "flex-row" 지정）.
// ---------------------------------------------------------------------------
const ScrollView = forwardRef<BridgeScrollViewRef, ScrollViewProps>(
  (
    {
      className,
      style,
      children,
      nativeID,
      testID,
      accessibilityRole,
      accessibilityLabel,
      contentContainerClassName,
      horizontal,
      pagingEnabled,
      onScroll,
      // 사이클 90 — View 신규 계약의 ScrollView 전파 정리: onLayout은 RN 이벤트
      // 시그니처를 좁혀 전달, onKeyDown·hover는 폐기(View와 동일 취급).
      onLayout,
      onKeyDown: _onKeyDown,
      onHoverIn: _onHoverIn,
      onHoverOut: _onHoverOut,
      ...rest
    },
    ref,
  ) => (
    <RNScrollView
      ref={ref as unknown as Ref<ScrollViewInstance>}
      nativeID={nativeID}
      testID={testID}
      accessibilityRole={toNativeRole(accessibilityRole)}
      accessibilityLabel={accessibilityLabel}
      horizontal={horizontal}
      pagingEnabled={pagingEnabled}
      onScroll={
        onScroll
          ? (event) => {
              const { contentOffset, contentSize, layoutMeasurement } =
                event.nativeEvent;
              const payload: BridgeScrollEvent = {
                contentOffset: { x: contentOffset.x, y: contentOffset.y },
                contentSize: { width: contentSize.width, height: contentSize.height },
                layoutMeasurement: {
                  width: layoutMeasurement.width,
                  height: layoutMeasurement.height,
                },
              };
              onScroll(payload);
            }
          : undefined
      }
      onLayout={
        onLayout
          ? (event) =>
              onLayout({
                width: event.nativeEvent.layout.width,
                height: event.nativeEvent.layout.height,
              })
          : undefined
      }
      scrollEventThrottle={16}
      className={className}
      style={resolveNativeStyle(style).resolvedStyle}
      {...rest}
    >
      <RNView className={contentContainerClassName}>{children}</RNView>
    </RNScrollView>
  ),
);
ScrollView.displayName = "ScrollView";

// ---------------------------------------------------------------------------
// 단일 import 원칙(AC-1) 확장 — SectionList·KeyboardAvoidingView·Platform·
// Dimensions·Share는 RN 것을 그대로 재노출한다（타입만 브리지 계약으로 좁힌다.
// Platform·Dimensions·Share는 네이티브 타입이 계약의 상위 집합이라 무표현으로
// 재수출）. 웹 구현(web.tsx)은 같은 이름으로 DOM 폴백을 제공한다 — 소비 화면
// 코드가 react-native를 직접 import하지 않아도 양 플랫폼에서 동작한다.
// ---------------------------------------------------------------------------
const SectionList = RNSectionList as unknown as SectionListComponent;
const KeyboardAvoidingView =
  RNKeyboardAvoidingView as unknown as KeyboardAvoidingViewComponent;

// ---------------------------------------------------------------------------
// Select/SelectOption/SelectOptGroup — 네이티브 <select> 폴백.
// 폼 연동 4속성（name·required·tabIndex·ariaHidden — 잔여 RN 갭 감사 후속）은
// 받아 두고 폐기한다 — RN에는 HTML 폼 계약이 없다（한계）.
// ---------------------------------------------------------------------------
const SelectOptGroup = (_props: SelectOptGroupProps) => null;

type NativeSelectListEntry =
  | { kind: "group"; key: string; label: string }
  | { kind: "option"; key: string; props: SelectOptionProps };

function collectSelectEntries(
  children: ReactNode,
  inheritedDisabled = false,
  keyPrefix = "",
): NativeSelectListEntry[] {
  const result: NativeSelectListEntry[] = [];
  Children.toArray(children).forEach((child, idx) => {
    if (!isValidElement(child)) return;
    const rawKey = child.key != null ? String(child.key) : `${keyPrefix}${idx}`;
    if (child.type === SelectOptGroup) {
      const groupProps = child.props as SelectOptGroupProps;
      result.push({
        kind: "group",
        key: `group-${rawKey}`,
        label: groupProps.label,
      });
      result.push(
        ...collectSelectEntries(
          groupProps.children,
          inheritedDisabled || Boolean(groupProps.disabled),
          `${rawKey}-`,
        ),
      );
      return;
    }
    const optProps = child.props as SelectOptionProps;
    if (typeof optProps.value === "string") {
      result.push({
        kind: "option",
        key: child.key != null ? String(child.key) : optProps.value,
        props: {
          ...optProps,
          disabled: Boolean(optProps.disabled) || inheritedDisabled,
        },
      });
    }
  });
  return result;
}

const Select = forwardRef<BridgeSelectRef, SelectProps>(function Select({
  className,
  value,
  defaultValue,
  onValueChange,
  children,
  disabled,
  accessibilityLabel,
  nativeID,
  testID,
  // 웹 전용 폼 연동（잔여 RN 갭 감사 후속） — RN에 HTML 폼 계약이 없어 폐기
  name: _name,
  required: _required,
  tabIndex: _tabIndex,
  ariaHidden: _ariaHidden,
}: SelectProps, _ref) {
  // ref는 웹 전용 계약 — 네이티브 부착 대상이 없어 무시한다(BridgeSelectRef).
  const [open, setOpen] = useState(false);
  // 비제어 값 — value 미지정 시 내부 선택을 트리거 라벨에도 반영한다
  // （G3 F-10: 웹 <select>와 플랫폼 동작 정합）.
  const [uncontrolled, setUncontrolled] = useState<string | undefined>(defaultValue);
  const entries = collectSelectEntries(children);
  const optionEntries = entries.filter(
    (entry): entry is Extract<NativeSelectListEntry, { kind: "option" }> =>
      entry.kind === "option",
  );
  const current = value ?? uncontrolled;
  const currentLabel = optionEntries.find(
    (entry) => entry.props.value === current,
  )?.props.children;
  const commit = (next: string) => {
    if (value === undefined) setUncontrolled(next);
    onValueChange?.(next);
    setOpen(false);
  };
  return (
    <>
      <Pressable
        accessibilityRole="combobox"
        accessibilityLabel={accessibilityLabel}
        aria-expanded={open}
        aria-disabled={disabled}
        disabled={disabled}
        nativeID={nativeID}
        testID={testID}
        className={className}
        onPress={() => setOpen(true)}
      >
        <RNText className="text-sm text-foreground" numberOfLines={1}>
          {currentLabel ?? ""}
        </RNText>
      </Pressable>
      <RNModal
        visible={open}
        transparent
        animationType="fade"
        statusBarTranslucent
        onRequestClose={() => setOpen(false)}
      >
        <RNView className="flex-1 justify-center px-4">
          <RNPressable
            accessibilityRole="button"
            accessibilityLabel="닫기"
            style={StyleSheet.absoluteFill}
            onPress={() => setOpen(false)}
          />
          <RNView className="w-full max-w-sm self-center rounded-lg border border-border bg-popover py-1">
            <RNScrollView style={STYLES.selectList}>
              {entries.map((entry) =>
                entry.kind === "group" ? (
                  <RNText
                    key={entry.key}
                    className="px-3 pt-2 pb-1 text-xs font-medium text-muted-foreground"
                  >
                    {entry.label}
                  </RNText>
                ) : (
                  <RNPressable
                    key={entry.key}
                    disabled={entry.props.disabled}
                    accessibilityRole={toNativeRole("option")}
                    accessibilityState={{ selected: entry.props.value === current }}
                    onPress={() => commit(entry.props.value)}
                    className={cn(
                      "rounded-md px-3 py-2",
                      entry.props.value === current && "bg-accent",
                      entry.props.disabled && "opacity-50",
                    )}
                  >
                    <RNText className="text-sm text-popover-foreground" numberOfLines={1}>
                      {entry.props.children}
                    </RNText>
                  </RNPressable>
                ),
              )}
            </RNScrollView>
          </RNView>
        </RNView>
      </RNModal>
    </>
  );
});

/** 옵션 자체는 네이티브에서 렌더하지 않는다 — Select가 children에서 추출해 목록을 그린다. */
const SelectOption = (_props: SelectOptionProps) => null;

// ---------------------------------------------------------------------------
// 루프 애니메이션 래퍼 — uniwind가 CSS keyframes(web:animate-*)를 구동하지
// 못 하는 네이티브에서 같은 효과를 RN 내장 Animated로 구동한다. transform·
// opacity라 useNativeDriver로 UI 스레드 구동(프레임마다 JS 관여 없음 —
// Reanimated와 같은 효율, 새 의존성 0). 웹은 web.tsx가 투명 프래그먼트로
// 두고 CSS 클래스가 담당한다(계약은 types.ts 참조).
// ---------------------------------------------------------------------------
const LoopRotate = ({ children, durationMs = 1000 }: LoopRotateProps) => {
  const driver = useMotionDriver();
  const reducedMotion = useReducedMotionNative();
  const spin = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (driver || reducedMotion) {
      spin.setValue(0);
      return;
    }
    const loop = Animated.loop(
      Animated.timing(spin, {
        toValue: 1,
        duration: durationMs,
        easing: Easing.linear,
        useNativeDriver: true,
      }),
    );
    loop.start();
    return () => loop.stop();
  }, [driver, reducedMotion, spin, durationMs]);

  if (driver) {
    const DriverLoopRotate = driver.LoopRotate;
    return (
      <DriverLoopRotate durationMs={durationMs} reducedMotion={reducedMotion}>
        {children}
      </DriverLoopRotate>
    );
  }
  if (reducedMotion) return <>{children}</>;

  return (
    <Animated.View
      style={{
        transform: [
          {
            rotate: spin.interpolate({
              inputRange: [0, 1],
              outputRange: ["0deg", "360deg"],
            }),
          },
        ],
      }}
    >
      {children}
    </Animated.View>
  );
};

const LoopPulse = ({ children, durationMs = 2000 }: LoopPulseProps) => {
  const driver = useMotionDriver();
  const reducedMotion = useReducedMotionNative();
  const opacity = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (driver || reducedMotion) {
      opacity.setValue(1);
      return;
    }
    const half = durationMs / 2;
    const pulse = Easing.bezier(0.4, 0, 0.6, 1);
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, {
          toValue: 0.5,
          duration: half,
          easing: pulse,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 1,
          duration: half,
          easing: pulse,
          useNativeDriver: true,
        }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [driver, reducedMotion, opacity, durationMs]);

  if (driver) {
    const DriverLoopPulse = driver.LoopPulse;
    return (
      <DriverLoopPulse durationMs={durationMs} reducedMotion={reducedMotion}>
        {children}
      </DriverLoopPulse>
    );
  }
  if (reducedMotion) return <>{children}</>;

  return <Animated.View style={{ opacity }}>{children}</Animated.View>;
};

// 구식 브리지(Old Architecture) 안드로이드에서만 실험 스위치를 켠다.
// 새 아키텍처(Fabric)에서는 이 호출이 no-op인데 WARN 로그를 뿜어
// LogBox 배너가 앱 하단을 가리기 때문이다. Fabric 런타임 판별은
// Fabric 환경에서만 존재하는 전역 UI 매니저 객체로 한다.
const isNewArchitecture =
  (globalThis as { nativeFabricUIManager?: unknown }).nativeFabricUIManager !=
  null;

if (
  Platform.OS === "android" &&
  !isNewArchitecture &&
  UIManager.setLayoutAnimationEnabledExperimental
) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

const animateLayout: AnimateLayoutFn = () => {
  if (reducedMotionEnabled) return;
  try {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
  } catch {
    // safe fallback
  }
};

// ---------------------------------------------------------------------------
// measureInWindow — RN ref.measure（x, y, w, h, pageX, pageY）. 창（뷰포트）
// 기준 좌표로 웹 getBoundingClientRect와 동일 시맨틱（lib/overlay 소비）.
// ---------------------------------------------------------------------------
const measureInWindow: MeasureInWindow = (ref, callback) => {
  const instance = ref as { measure?: (cb: MeasureCallback) => void } | null;
  instance?.measure?.(callback);
};

// ---------------------------------------------------------------------------
// useDrag — PanResponder 기반 드래그（sliderdrawer 등）. 웹 Pointer Events
// 대응: onBegin（제스처 시작）onMove（x/y 절대 좌표 + 시작점 대비 dx/dy）onEnd.
// panHandlers를 뷰에 펼쳐 넣는다（웹 dragHandlers와 동일한 소비 방식）.
// ---------------------------------------------------------------------------
const useDrag = (options: UseDragOptions): UseDragResult => {
  const [dragging, setDragging] = useState(false);
  const optionsRef = useRef(options);
  optionsRef.current = options;
  const originRef = useRef({ x: 0, y: 0 });
  const lastEventRef = useRef<BridgeDragEvent>({
    x: 0,
    y: 0,
    dx: 0,
    dy: 0,
    vx: 0,
    vy: 0,
  });
  const panRef = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => false,
      onPanResponderGrant: (event) => {
        originRef.current = { x: event.nativeEvent.pageX, y: event.nativeEvent.pageY };
        lastEventRef.current = {
          x: event.nativeEvent.pageX,
          y: event.nativeEvent.pageY,
          dx: 0,
          dy: 0,
          vx: 0,
          vy: 0,
        };
        setDragging(true);
        optionsRef.current.onBegin?.();
      },
      onPanResponderMove: (event, gesture) => {
        const payload: BridgeDragEvent = {
          x: event.nativeEvent.pageX,
          y: event.nativeEvent.pageY,
          dx: gesture.dx,
          dy: gesture.dy,
          vx: gesture.vx,
          vy: gesture.vy,
        };
        lastEventRef.current = payload;
        optionsRef.current.onMove?.(payload);
      },
      onPanResponderRelease: (_event, gesture) => {
        const finalEvent: BridgeDragEvent = {
          ...lastEventRef.current,
          dx: gesture.dx,
          dy: gesture.dy,
          vx: gesture.vx,
          vy: gesture.vy,
        };
        setDragging(false);
        optionsRef.current.onEnd?.(finalEvent);
      },
      onPanResponderTerminate: (_event, gesture) => {
        const finalEvent: BridgeDragEvent = {
          ...lastEventRef.current,
          dx: gesture.dx,
          dy: gesture.dy,
          vx: gesture.vx,
          vy: gesture.vy,
        };
        setDragging(false);
        optionsRef.current.onEnd?.(finalEvent);
      },
    }),
  );
  return { dragHandlers: panRef.current.panHandlers as Record<string, unknown>, dragging };
};

// ---------------------------------------------------------------------------
// 오버레이 훈 4종 — useReposition은 Dimensions 변화(회전·리사이즈) 구독,
// 나머지 3종은 RN Modal이 OS 수준에서 처리하는 stub이다.
// ---------------------------------------------------------------------------
const useOverlayFocus: UseOverlayFocus = (_target, _active, _returnTo) => {};
const useDismiss: UseDismiss = (_onDismiss, _active) => {};
const useReposition: UseReposition = (listener, active) => {
  const callbackRef = useRef(listener);
  callbackRef.current = listener;
  useEffect(() => {
    if (!active) return;
    const sub = Dimensions.addEventListener("change", () => {
      callbackRef.current();
    });
    return () => sub.remove();
  }, [active]);
};
const useScrollLock: UseScrollLock = (_active) => {};

// ---------------------------------------------------------------------------
// 테마 바인딩
// ---------------------------------------------------------------------------
let activeColorScheme: BridgeColorScheme = "light";
const colorSchemeListeners = new Set<() => void>();
const subscribeColorScheme = (listener: () => void) => {
  colorSchemeListeners.add(listener);
  return () => {
    colorSchemeListeners.delete(listener);
  };
};
const getColorSchemeSnapshot = (): BridgeColorScheme => activeColorScheme;

/** 색 스킴 → uniwind 활성 테마. setTheme은 Appearance.setColorScheme도 호출해
 *  Alert·Modal 등 시스템 UI가 앱 테마를 따르게 한다.
 *  정적 import가 안전한 이유: 웹 번들은 exports "default" 조건으로 web.tsx만
 *  로드하므로 이 파일（와 uniwind 의존）은 네이티브 그래프에만 존재한다. */
const applyColorScheme: ApplyColorScheme = (colorScheme) => {
  activeColorScheme = colorScheme;
  Uniwind.setTheme(colorScheme);
  colorSchemeListeners.forEach((listener) => listener());
};

/** 현재 활성 색 스킴을 구독한다（UnikitThemeProvider 밖에서도 안전）. */
const useColorScheme: UseColorScheme = () =>
  useSyncExternalStore(
    subscribeColorScheme,
    getColorSchemeSnapshot,
    getColorSchemeSnapshot,
  );

/** 뷰포트（창） 크기 — Dimensions.get（"window"）. 순간 값이며 리스너 미구독
 *  （오버레이 클램프용 순간 판독으로 충분하다）. */
const getViewport: GetViewport = () => {
  const { width, height } = Dimensions.get("window");
  return { width, height };
};

// ---------------------------------------------------------------------------
// 유니버설 벡터 아이콘 — lucide-react-native 래핑（컴포넌트는 primitives의 *Icon만 소비）
// ---------------------------------------------------------------------------

function wrapNativeLucide(Icon: LucideIcon, defaultClassName = "size-4") {
  const wrapperProps = {
    className: cn("items-center justify-center", defaultClassName),
  } as Record<string, unknown>;
  const defaultSvgProps = {
    className: defaultClassName,
  } as Record<string, unknown>;

  return function NativeIcon({
    className,
    size = 16,
    color,
    strokeWidth = 2,
    style,
    "aria-hidden": ariaHidden = true,
  }: IconProps) {
    const numericSize =
      typeof size === "string" ? Number(size) || 16 : size;
    // className의 text-* 색을 uniwind 훅으로 실제 색값으로 해석해 lucide color에
    // 넘긴다 — Svg는 RN 스타일 상속이 없어서 className→style 변환만으로는
    // stroke에 색이 닿지 않는다(2026-11-14 사이클 94 G4 발견: currentColor가
    // 검정으로 렌더돼 다크 모드에서 아이콘이 배경에 묻혔다).
    const resolvedStyles = useResolveClassNames(className ?? "");
    // 유니윈드 해석값은 처리된 색 문자열(토큰 → 테마별 실측값)이다.
    const resolvedColor = color ?? (resolvedStyles.color as string | undefined);
    const targetDeg = parseRotateDeg(className) ?? 0;
    const hasTransition = hasNativeTransitionClass(className);
    const durationMs = parseDurationMs(className, 200);
    const reducedMotion = useReducedMotionNative();
    const rotateVal = useRef(new Animated.Value(targetDeg)).current;
    const prevDegRef = useRef(targetDeg);

    useEffect(() => {
      if (prevDegRef.current === targetDeg) return;
      prevDegRef.current = targetDeg;
      if (!hasTransition || reducedMotion) {
        rotateVal.setValue(targetDeg);
        return;
      }
      Animated.timing(rotateVal, {
        toValue: targetDeg,
        duration: durationMs,
        easing: EASE_OUT_EXPO,
        useNativeDriver: true,
      }).start();
    }, [targetDeg, hasTransition, durationMs, reducedMotion, rotateVal]);

    const resolvedBaseStyle = resolveNativeStyle(style).resolvedStyle;
    const svgProps = className
      ? ({ className: cn(defaultClassName, className) } as Record<string, unknown>)
      : defaultSvgProps;

    const iconEl = (
      <Icon
        size={numericSize}
        color={resolvedColor}
        strokeWidth={strokeWidth}
        {...svgProps}
      />
    );

    if (hasTransition) {
      const rotateStr = rotateVal.interpolate({
        inputRange: [-360, 360],
        outputRange: ["-360deg", "360deg"],
      });
      return (
        <Animated.View
          aria-hidden={ariaHidden ? true : undefined}
          style={[resolvedBaseStyle, { transform: [{ rotate: rotateStr }] }] as never}
          {...wrapperProps}
        >
          {iconEl}
        </Animated.View>
      );
    }

    const mergedStyle =
      targetDeg !== 0
        ? [resolvedBaseStyle, { transform: [{ rotate: `${targetDeg}deg` }] }]
        : resolvedBaseStyle;
    // rotate-* 는 래퍼 View transform으로 처리（Svg 자체 rotate 클래스 의존 회피）.
    return (
      <RNView
        aria-hidden={ariaHidden ? true : undefined}
        style={mergedStyle as ViewStyle}
        {...wrapperProps}
      >
        {iconEl}
      </RNView>
    );
  };
}

const CheckIcon = wrapNativeLucide(LucideCheckIcon);
const ChevronDownIcon = wrapNativeLucide(LucideChevronDownIcon);
const ChevronUpIcon = wrapNativeLucide(LucideChevronUpIcon);
const ChevronRightIcon = wrapNativeLucide(LucideChevronRightIcon);
const ChevronLeftIcon = wrapNativeLucide(LucideChevronLeftIcon);
const XIcon = wrapNativeLucide(LucideXIcon);
const SearchIcon = wrapNativeLucide(LucideSearchIcon);
const MinusIcon = wrapNativeLucide(LucideMinusIcon);
const CircleIcon = wrapNativeLucide(LucideCircleIcon);
const MoreHorizontalIcon = wrapNativeLucide(LucideMoreHorizontalIcon);
const ArrowLeftIcon = wrapNativeLucide(LucideArrowLeftIcon);
const ArrowRightIcon = wrapNativeLucide(LucideArrowRightIcon);
const ArrowUpIcon = wrapNativeLucide(LucideArrowUpIcon);
const ArrowDownIcon = wrapNativeLucide(LucideArrowDownIcon);
const InfoIcon = wrapNativeLucide(LucideInfoIcon);
const AlertCircleIcon = wrapNativeLucide(LucideAlertCircleIcon);
const CheckCircle2Icon = wrapNativeLucide(LucideCheckCircle2Icon);
const XCircleIcon = wrapNativeLucide(LucideXCircleIcon);
const Loader2Icon = wrapNativeLucide(LucideLoader2Icon);
const PanelLeftIcon = wrapNativeLucide(LucidePanelLeftIcon);
const GripVerticalIcon = wrapNativeLucide(LucideGripVerticalIcon);
// 툴바 서식 아이콘 — 마크다운 에디터 도그푸딩(apps/desktop·apps/mobile)에서 사용.
const BoldIcon = wrapNativeLucide(LucideBoldIcon);
const ItalicIcon = wrapNativeLucide(LucideItalicIcon);
const StrikethroughIcon = wrapNativeLucide(LucideStrikethroughIcon);
const Heading1Icon = wrapNativeLucide(LucideHeading1Icon);
const Heading2Icon = wrapNativeLucide(LucideHeading2Icon);
const ListIcon = wrapNativeLucide(LucideListIcon);
const ListOrderedIcon = wrapNativeLucide(LucideListOrderedIcon);
const TextQuoteIcon = wrapNativeLucide(LucideTextQuoteIcon);
const CodeIcon = wrapNativeLucide(LucideCodeIcon);
const Undo2Icon = wrapNativeLucide(LucideUndo2Icon);
const Redo2Icon = wrapNativeLucide(LucideRedo2Icon);

export {
  View,
  Text,
  Pressable,
  TextInput,
  Image,
  Portal,
  PortalHost,
  ScrollView,
  SectionList,
  Slot,
  Select,
  SelectOptGroup,
  SelectOption,
  KeyboardAvoidingView,
  Platform,
  Dimensions,
  Share,
  LoopRotate,
  LoopPulse,
  animateLayout,
  measureInWindow,
  useDrag,
  useOverlayFocus,
  useDismiss,
  useReposition,
  useScrollLock,
  getViewport,
  applyColorScheme,
  useColorScheme,
  CheckIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  ChevronRightIcon,
  ChevronLeftIcon,
  XIcon,
  SearchIcon,
  MinusIcon,
  CircleIcon,
  MoreHorizontalIcon,
  ArrowLeftIcon,
  ArrowRightIcon,
  ArrowUpIcon,
  ArrowDownIcon,
  InfoIcon,
  AlertCircleIcon,
  CheckCircle2Icon,
  XCircleIcon,
  Loader2Icon,
  PanelLeftIcon,
  GripVerticalIcon,
  BoldIcon,
  ItalicIcon,
  StrikethroughIcon,
  Heading1Icon,
  Heading2Icon,
  ListIcon,
  ListOrderedIcon,
  TextQuoteIcon,
  CodeIcon,
  Undo2Icon,
  Redo2Icon,
};
