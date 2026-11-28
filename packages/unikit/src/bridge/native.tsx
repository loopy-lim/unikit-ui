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
  BellIcon as LucideBellIcon,
  BellOffIcon as LucideBellOffIcon,
BoldIcon as LucideBoldIcon,
  CalendarIcon as LucideCalendarIcon,
  CalendarClockIcon as LucideCalendarClockIcon,
  CameraIcon as LucideCameraIcon,
CheckCircle2Icon as LucideCheckCircle2Icon,
CheckIcon as LucideCheckIcon,
ChevronDownIcon as LucideChevronDownIcon,
ChevronLeftIcon as LucideChevronLeftIcon,
ChevronRightIcon as LucideChevronRightIcon,
ChevronUpIcon as LucideChevronUpIcon,
  CircleHelpIcon as LucideCircleHelpIcon,
CircleIcon as LucideCircleIcon,
  CircleUserIcon as LucideCircleUserIcon,
CodeIcon as LucideCodeIcon,
  CreditCardIcon as LucideCreditCardIcon,
  DownloadIcon as LucideDownloadIcon,
  EllipsisVerticalIcon as LucideEllipsisVerticalIcon,
  EyeIcon as LucideEyeIcon,
  EyeOffIcon as LucideEyeOffIcon,
  FastForwardIcon as LucideFastForwardIcon,
  FolderIcon as LucideFolderIcon,
GripVerticalIcon as LucideGripVerticalIcon,
Heading1Icon as LucideHeading1Icon,
Heading2Icon as LucideHeading2Icon,
  HeartIcon as LucideHeartIcon,
  HeartOffIcon as LucideHeartOffIcon,
  HomeIcon as LucideHomeIcon,
InfoIcon as LucideInfoIcon,
ItalicIcon as LucideItalicIcon,
ListIcon as LucideListIcon,
ListOrderedIcon as LucideListOrderedIcon,
Loader2Icon as LucideLoader2Icon,
  LockIcon as LucideLockIcon,
  LockOpenIcon as LucideLockOpenIcon,
  MailIcon as LucideMailIcon,
  MapPinIcon as LucideMapPinIcon,
  ImageIcon as LucideMediaImageIcon,
  MenuIcon as LucideMenuIcon,
MinusIcon as LucideMinusIcon,
MoreHorizontalIcon as LucideMoreHorizontalIcon,
PanelLeftIcon as LucidePanelLeftIcon,
  PaperclipIcon as LucidePaperclipIcon,
  PauseIcon as LucidePauseIcon,
  PencilIcon as LucidePencilIcon,
  PhoneIcon as LucidePhoneIcon,
  PhoneCallIcon as LucidePhoneCallIcon,
  PlayIcon as LucidePlayIcon,
  PlusIcon as LucidePlusIcon,
  PrinterIcon as LucidePrinterIcon,
Redo2Icon as LucideRedo2Icon,
  RefreshCwIcon as LucideRefreshCwIcon,
  RewindIcon as LucideRewindIcon,
SearchIcon as LucideSearchIcon,
  SendIcon as LucideSendIcon,
  SettingsIcon as LucideSettingsIcon,
  Share2Icon as LucideShare2Icon,
  ShoppingCartIcon as LucideShoppingCartIcon,
  SkipBackIcon as LucideSkipBackIcon,
  SkipForwardIcon as LucideSkipForwardIcon,
  SquareIcon as LucideSquareIcon,
  StarIcon as LucideStarIcon,
  StarHalfIcon as LucideStarHalfIcon,
  StarOffIcon as LucideStarOffIcon,
StrikethroughIcon as LucideStrikethroughIcon,
TextQuoteIcon as LucideTextQuoteIcon,
  Trash2Icon as LucideTrash2Icon,
  TriangleAlertIcon as LucideTriangleAlertIcon,
Undo2Icon as LucideUndo2Icon,
  UploadIcon as LucideUploadIcon,
  UserIcon as LucideUserIcon,
  Volume1Icon as LucideVolume1Icon,
  Volume2Icon as LucideVolume2Icon,
  VolumeOffIcon as LucideVolumeOffIcon,
  VolumeXIcon as LucideVolumeXIcon,
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

export type * from "./types";

const STYLES = StyleSheet.create({
  selectList: { maxHeight: 288 },
  portalHostRoot: { flex: 1 },
});

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

const RN_VALID_ROLES = new Set([
  "none", "button", "link", "search", "image", "keyboardkey", "text",
  "adjustable", "imagebutton", "header", "summary", "alert", "checkbox",
  "combobox", "menu", "menubar", "menuitem", "progressbar", "radio",
  "radiogroup", "scrollbar", "spinbutton", "switch", "tab", "tablist",
  "timer", "toolbar",
]);

const RN_ROLE_FALLBACK: Partial<Record<BridgeRole, string>> = {

  dialog: "alert",
  alertdialog: "alert",

  heading: "header",

  slider: "adjustable",
};

const toNativeRole = (role?: BridgeRole) => {
  if (!role) return undefined;
  if (RN_VALID_ROLES.has(role)) return role;
  return RN_ROLE_FALLBACK[role] ?? "none";
};

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

const toBridgeKeyEvent = (event: NativeKeyDownLike): BridgeKeyEvent => ({
  key: event.nativeEvent.key,
  ctrlKey: event.nativeEvent.ctrlKey,
  altKey: event.nativeEvent.altKey,
  metaKey: event.nativeEvent.metaKey,
  shiftKey: event.nativeEvent.shiftKey,
  preventDefault: () => event.preventDefault(),
  stopPropagation: () => event.stopPropagation(),
});

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
      "aria-describedby": _ariaDescribedBy,
      "aria-valuenow": ariaValueNow,
      "aria-valuemin": ariaValueMin,
      "aria-valuemax": ariaValueMax,
      "aria-expanded": _ariaExpanded,
      "aria-controls": _ariaControls,
      "aria-labelledby": _ariaLabelledBy,
      pointerEvents,

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

    const longPress = onLongPress ?? onContextMenu;
    return (
      <RNPressable

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

function shiftKeyFromKeyCase(key: string): boolean {
  return key.length === 1 && key !== key.toLowerCase();
}

const TextInput = forwardRef<BridgeTextInputRef, TextInputProps>(
  (
    {
      className,
      style,
      value,
      defaultValue,
      placeholder,
      editable,
      disabled: _disabled,
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
                preventDefault: () => {},

                shiftKey: shiftKeyFromKeyCase(key),
              });
            }
          : undefined
      }
      {...rest}
    />
  ),
);
TextInput.displayName = "TextInput";

const Image = forwardRef<BridgeImageRef, ImageProps>(
  (
    {
      className,
      style,
      source,
      alt: _alt,
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

const SectionList = RNSectionList as unknown as SectionListComponent;
const KeyboardAvoidingView =
  RNKeyboardAvoidingView as unknown as KeyboardAvoidingViewComponent;

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

  name: _name,
  required: _required,
  tabIndex: _tabIndex,
  ariaHidden: _ariaHidden,
}: SelectProps, _ref) {

  const [open, setOpen] = useState(false);

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

const SelectOption = (_props: SelectOptionProps) => null;

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

  }
};

const measureInWindow: MeasureInWindow = (ref, callback) => {
  const instance = ref as { measure?: (cb: MeasureCallback) => void } | null;
  instance?.measure?.(callback);
};

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

let activeColorScheme: BridgeColorScheme = "light";
const colorSchemeListeners = new Set<() => void>();
const subscribeColorScheme = (listener: () => void) => {
  colorSchemeListeners.add(listener);
  return () => {
    colorSchemeListeners.delete(listener);
  };
};
const getColorSchemeSnapshot = (): BridgeColorScheme => activeColorScheme;

const applyColorScheme: ApplyColorScheme = (colorScheme) => {
  activeColorScheme = colorScheme;
  Uniwind.setTheme(colorScheme);
  colorSchemeListeners.forEach((listener) => listener());
};

const useColorScheme: UseColorScheme = () =>
  useSyncExternalStore(
    subscribeColorScheme,
    getColorSchemeSnapshot,
    getColorSchemeSnapshot,
  );

const getViewport: GetViewport = () => {
  const { width, height } = Dimensions.get("window");
  return { width, height };
};

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

    const resolvedStyles = useResolveClassNames(className ?? "");

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
const BellIcon = wrapNativeLucide(LucideBellIcon);
const BellOffIcon = wrapNativeLucide(LucideBellOffIcon);
const CalendarIcon = wrapNativeLucide(LucideCalendarIcon);
const CalendarClockIcon = wrapNativeLucide(LucideCalendarClockIcon);
const CameraIcon = wrapNativeLucide(LucideCameraIcon);
const CircleHelpIcon = wrapNativeLucide(LucideCircleHelpIcon);
const CircleUserIcon = wrapNativeLucide(LucideCircleUserIcon);
const CreditCardIcon = wrapNativeLucide(LucideCreditCardIcon);
const DownloadIcon = wrapNativeLucide(LucideDownloadIcon);
const EllipsisVerticalIcon = wrapNativeLucide(LucideEllipsisVerticalIcon);
const EyeIcon = wrapNativeLucide(LucideEyeIcon);
const EyeOffIcon = wrapNativeLucide(LucideEyeOffIcon);
const FastForwardIcon = wrapNativeLucide(LucideFastForwardIcon);
const FolderIcon = wrapNativeLucide(LucideFolderIcon);
const HeartIcon = wrapNativeLucide(LucideHeartIcon);
const HeartOffIcon = wrapNativeLucide(LucideHeartOffIcon);
const HomeIcon = wrapNativeLucide(LucideHomeIcon);
const LockIcon = wrapNativeLucide(LucideLockIcon);
const LockOpenIcon = wrapNativeLucide(LucideLockOpenIcon);
const MailIcon = wrapNativeLucide(LucideMailIcon);
const MapPinIcon = wrapNativeLucide(LucideMapPinIcon);
const MediaImageIcon = wrapNativeLucide(LucideMediaImageIcon);
const MenuIcon = wrapNativeLucide(LucideMenuIcon);
const PaperclipIcon = wrapNativeLucide(LucidePaperclipIcon);
const PauseIcon = wrapNativeLucide(LucidePauseIcon);
const PencilIcon = wrapNativeLucide(LucidePencilIcon);
const PhoneIcon = wrapNativeLucide(LucidePhoneIcon);
const PhoneCallIcon = wrapNativeLucide(LucidePhoneCallIcon);
const PlayIcon = wrapNativeLucide(LucidePlayIcon);
const PlusIcon = wrapNativeLucide(LucidePlusIcon);
const PrinterIcon = wrapNativeLucide(LucidePrinterIcon);
const RefreshCwIcon = wrapNativeLucide(LucideRefreshCwIcon);
const RewindIcon = wrapNativeLucide(LucideRewindIcon);
const SendIcon = wrapNativeLucide(LucideSendIcon);
const SettingsIcon = wrapNativeLucide(LucideSettingsIcon);
const Share2Icon = wrapNativeLucide(LucideShare2Icon);
const ShoppingCartIcon = wrapNativeLucide(LucideShoppingCartIcon);
const SkipBackIcon = wrapNativeLucide(LucideSkipBackIcon);
const SkipForwardIcon = wrapNativeLucide(LucideSkipForwardIcon);
const SquareIcon = wrapNativeLucide(LucideSquareIcon);
const StarIcon = wrapNativeLucide(LucideStarIcon);
const StarHalfIcon = wrapNativeLucide(LucideStarHalfIcon);
const StarOffIcon = wrapNativeLucide(LucideStarOffIcon);
const Trash2Icon = wrapNativeLucide(LucideTrash2Icon);
const TriangleAlertIcon = wrapNativeLucide(LucideTriangleAlertIcon);
const UploadIcon = wrapNativeLucide(LucideUploadIcon);
const UserIcon = wrapNativeLucide(LucideUserIcon);
const Volume1Icon = wrapNativeLucide(LucideVolume1Icon);
const Volume2Icon = wrapNativeLucide(LucideVolume2Icon);
const VolumeOffIcon = wrapNativeLucide(LucideVolumeOffIcon);
const VolumeXIcon = wrapNativeLucide(LucideVolumeXIcon);

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
  BellIcon,
  BellOffIcon,
  CalendarIcon,
  CalendarClockIcon,
  CameraIcon,
  CircleHelpIcon,
  CircleUserIcon,
  CreditCardIcon,
  DownloadIcon,
  EllipsisVerticalIcon,
  EyeIcon,
  EyeOffIcon,
  FastForwardIcon,
  FolderIcon,
  HeartIcon,
  HeartOffIcon,
  HomeIcon,
  LockIcon,
  LockOpenIcon,
  MailIcon,
  MapPinIcon,
  MediaImageIcon,
  MenuIcon,
  PaperclipIcon,
  PauseIcon,
  PencilIcon,
  PhoneIcon,
  PhoneCallIcon,
  PlayIcon,
  PlusIcon,
  PrinterIcon,
  RefreshCwIcon,
  RewindIcon,
  SendIcon,
  SettingsIcon,
  Share2Icon,
  ShoppingCartIcon,
  SkipBackIcon,
  SkipForwardIcon,
  SquareIcon,
  StarIcon,
  StarHalfIcon,
  StarOffIcon,
  Trash2Icon,
  TriangleAlertIcon,
  UploadIcon,
  UserIcon,
  Volume1Icon,
  Volume2Icon,
  VolumeOffIcon,
  VolumeXIcon,
};
