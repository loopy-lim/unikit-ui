import {
  Fragment,
  forwardRef,
  isValidElement,
  useCallback,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
  useSyncExternalStore,
  type ChangeEvent,
  type ComponentType,
  type PointerEvent as ReactPointerEvent,
  type ReactNode,
  type RefObject,
  type UIEvent as ReactUIEvent,
} from "react";
import { createPortal } from "react-dom";
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
} from "lucide-react";

import { cn } from "../lib/utils";
import { Slot } from "./slot";
import { extractUniversalTransform } from "./motion-registry";
import type {
  AnimateLayoutFn,
  ApplyColorScheme,
  BridgeColorScheme,
  BridgeDimensions,
  BridgeDragEvent,
  BridgeImageRef,
  BridgePlatformStatic,
  BridgePressableRef,
  BridgeScrollEvent,
  BridgeScrollViewRef,
  BridgeSelectRef,
  BridgeShare,
  BridgeStyle,
  BridgeTextRef,
  IconProps,
  BridgeTextInputRef,
  BridgeViewRef,
  ImageProps,
  KeyboardAvoidingViewProps,
  LoopPulseProps,
  LoopRotateProps,
  MeasureInWindow,
  PortalHostProps,
  PortalProps,
  PressableProps,
  ScrollViewProps,
  SectionListComponent,
  SectionListNode,
  SectionListProps,
  SelectOptGroupProps,
  SelectOptionProps,
  SelectProps,
  TextProps,
  TextInputProps,
  UseColorScheme,
  UseDismiss,
  UseDragOptions,
  UseDragResult,
  UseOverlayFocus,
  UseReposition,
  UseScrollLock,
  ViewProps,
  GetViewport,
} from "./types";

export type * from "./types";

function resolveWebStyle(style?: BridgeStyle): React.CSSProperties | undefined {
  if (!style) return undefined;
  const extracted = extractUniversalTransform(style);
  if (!extracted.hasTransformShorthand) {
    return style as React.CSSProperties;
  }
  const parts: string[] = [];
  if (typeof style.transform === "string" && style.transform) {
    parts.push(style.transform);
  }
  if (extracted.translateX !== undefined) parts.push(`translateX(${extracted.translateX}px)`);
  if (extracted.translateY !== undefined) parts.push(`translateY(${extracted.translateY}px)`);
  if (extracted.scale !== undefined) parts.push(`scale(${extracted.scale})`);
  if (extracted.rotate !== undefined) parts.push(`rotate(${extracted.rotate})`);
  return {
    ...(extracted.restStyle as React.CSSProperties | undefined),
    transform: parts.join(" "),
  };
}

const VIEW_BASE_CLASS = "flex flex-col";
const PRESSABLE_BASE_CLASS = "flex flex-col text-left";
const SINGLE_LINE_STYLE: React.CSSProperties = {
  display: "block",
  overflow: "hidden",
  textOverflow: "ellipsis",
  whiteSpace: "nowrap",
};

const View = forwardRef<BridgeViewRef, ViewProps>(
  (
    {
      className,
      style,
      children,
      nativeID,
      testID,
      accessibilityLabel,
      accessibilityRole,
      pointerEvents,
      onLayout,
      focusable,
      onHoverIn,
      onHoverOut,
      ...rest
    },
    ref,
  ) => {
    const pointerEventsValue =
      pointerEvents === "box-none"
        ? "none"
        : pointerEvents === "box-only"
          ? "auto"
          : pointerEvents;
    const baseStyle = resolveWebStyle(style);
    const resolvedStyle: React.CSSProperties | undefined = pointerEventsValue
      ? baseStyle
        ? { ...baseStyle, pointerEvents: pointerEventsValue }
        : { pointerEvents: pointerEventsValue }
      : baseStyle;

    const nodeRef = useRef<HTMLDivElement | null>(null);
    const layoutRef = useRef(onLayout);
    layoutRef.current = onLayout;
    const hasLayout = onLayout !== undefined;
    useEffect(() => {
      if (!hasLayout) return;
      const el = nodeRef.current;
      if (!el || typeof ResizeObserver !== "function") return;
      const observer = new ResizeObserver((entries) => {
        const rect = entries[0]?.contentRect;
        if (rect) layoutRef.current?.({ width: rect.width, height: rect.height });
      });
      observer.observe(el);
      return () => observer.disconnect();
    }, [hasLayout]);
    const setRef = useCallback(
      (node: HTMLDivElement | null) => {
        nodeRef.current = node;

        if (typeof ref === "function") return ref(node);
        if (ref) (ref as { current: HTMLDivElement | null }).current = node;
        return undefined;
      },
      [ref],
    );
    return (
      <div
        ref={setRef}
        id={nativeID}
        data-testid={testID}
        role={accessibilityRole}
        aria-label={accessibilityLabel}
        className={className ? cn(VIEW_BASE_CLASS, className) : VIEW_BASE_CLASS}
        style={resolvedStyle}
        tabIndex={focusable === true ? 0 : focusable === false ? -1 : undefined}
        onMouseEnter={onHoverIn}
        onMouseLeave={onHoverOut}
        {...rest}
      >
        {children}
      </div>
    );
  },
);
View.displayName = "View";

const Text = forwardRef<BridgeTextRef, TextProps>(
  (
    { className, style, children, nativeID, testID, onPress, accessibilityLabel, accessibilityRole, numberOfLines, ...rest },
    ref,
  ) => {
    const baseStyle = resolveWebStyle(style);
    const resolvedStyle: React.CSSProperties | undefined = numberOfLines
      ? numberOfLines === 1
        ? baseStyle
          ? { ...baseStyle, ...SINGLE_LINE_STYLE }
          : SINGLE_LINE_STYLE
        : {
            ...baseStyle,
            display: "-webkit-box",
            WebkitBoxOrient: "vertical",
            WebkitLineClamp: numberOfLines,
            overflow: "hidden",
          }
      : baseStyle;
    return (
      <span
        ref={ref as React.Ref<HTMLSpanElement>}
        id={nativeID}
        data-testid={testID}
        role={accessibilityRole}
        aria-label={accessibilityLabel}
        className={className}

        style={resolvedStyle}
        onClick={onPress}
        {...rest}
      >
        {children}
      </span>
    );
  },
);
Text.displayName = "Text";

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
      nativeID,
      testID,
      hitSlop: _hitSlop,
      onLongPress: _onLongPress,
      onContextMenu,

      onHoverIn,
      onHoverOut,
      onLayout,
      focusable,
      pointerEvents,
      ...rest
    },
    ref,
  ) => {
    const nodeRef = useRef<HTMLButtonElement | null>(null);
    const layoutRef = useRef(onLayout);
    layoutRef.current = onLayout;
    const hasLayout = onLayout !== undefined;
    useEffect(() => {
      if (!hasLayout) return;
      const el = nodeRef.current;
      if (!el || typeof ResizeObserver !== "function") return;
      const observer = new ResizeObserver((entries) => {
        const rect = entries[0]?.contentRect;
        if (rect) layoutRef.current?.({ width: rect.width, height: rect.height });
      });
      observer.observe(el);
      return () => observer.disconnect();
    }, [hasLayout]);
    const setRef = useCallback(
      (node: HTMLButtonElement | null) => {
        nodeRef.current = node;

        if (typeof ref === "function") return ref(node);
        if (ref) (ref as { current: HTMLButtonElement | null }).current = node;
        return undefined;
      },
      [ref],
    );
    return (
      <button
        ref={setRef}
        type="button"
        id={nativeID}
        data-testid={testID}
        className={className ? cn(PRESSABLE_BASE_CLASS, className) : PRESSABLE_BASE_CLASS}
        style={(() => {
          const baseStyle = resolveWebStyle(style);
          const value =
            pointerEvents === "box-none"
              ? "none"
              : pointerEvents === "box-only"
                ? "auto"
                : pointerEvents;
          return value
            ? baseStyle
              ? { ...baseStyle, pointerEvents: value }
              : { pointerEvents: value }
            : baseStyle;
        })()}
        tabIndex={focusable === true ? 0 : focusable === false ? -1 : undefined}
        onClick={onPress}
        disabled={disabled}
        aria-label={accessibilityLabel}
        role={accessibilityRole}
        onMouseEnter={onHoverIn}
        onMouseLeave={onHoverOut}

        onContextMenu={
          onContextMenu
            ? (event: React.MouseEvent<HTMLButtonElement>) => {
                event.preventDefault();
                onContextMenu();
              }
            : undefined
        }
        {...rest}
      >
        {children}
      </button>
    );
  },
);
Pressable.displayName = "Pressable";

const TextInput = forwardRef<BridgeTextInputRef, TextInputProps>(
  (
    {
      className,
      style,
      value,
      defaultValue,
      placeholder,
      editable,
      disabled,
      onChangeText,
      nativeID,
      testID,
      accessibilityLabel,
      accessibilityLabelledBy,
      autoFocus,
      secureTextEntry,
      inputMode,
      autoComplete,
      multiline,
      onFocus,
      onBlur,
      ...rest
    },
    ref,
  ) => {
    const resolvedStyle = resolveWebStyle(style);
    const handleChange = (
      event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
    ) => {
      onChangeText?.(event.target.value);
    };
    const handleFocus = onFocus ? () => onFocus() : undefined;
    const handleBlur = onBlur ? () => onBlur() : undefined;

    if (multiline) {
      return (
        <textarea
          ref={ref as React.Ref<HTMLTextAreaElement>}
          id={nativeID}
          data-testid={testID}
          aria-label={accessibilityLabel}
          aria-labelledby={accessibilityLabelledBy}
          className={className}
          style={resolvedStyle}
          value={value}
          defaultValue={defaultValue}
          placeholder={placeholder}
          disabled={disabled}
          readOnly={editable === false}
          autoFocus={autoFocus}
          autoComplete={autoComplete}
          inputMode={inputMode}
          onChange={handleChange}
          onFocus={handleFocus}
          onBlur={handleBlur}
          {...rest}
        />
      );
    }
    return (
      <input
        ref={ref as React.Ref<HTMLInputElement>}
        id={nativeID}
        data-testid={testID}
        aria-label={accessibilityLabel}
        aria-labelledby={accessibilityLabelledBy}
        className={className}
        style={resolvedStyle}
        value={value}
        defaultValue={defaultValue}
        placeholder={placeholder}
        disabled={disabled}
        readOnly={editable === false}
        autoFocus={autoFocus}
        inputMode={inputMode}
        autoComplete={autoComplete}
        onChange={handleChange}
        onFocus={handleFocus}
        onBlur={handleBlur}
        {...rest}
        type={secureTextEntry ? "password" : (rest as { type?: string }).type}
      />
    );
  },
);
TextInput.displayName = "TextInput";

const Image = forwardRef<BridgeImageRef, ImageProps>(
  (
    {
      className,
      style,
      source,
      alt = "",
      onError,
      accessibilityLabel,
      nativeID,
      testID,
      ...rest
    },
    ref,
  ) => (
    <img
      ref={ref as React.Ref<HTMLImageElement>}
      id={nativeID}
      data-testid={testID}
      src={source.uri}
      alt={alt || accessibilityLabel}
      loading="lazy"
      className={className}
      style={resolveWebStyle(style)}
      onError={onError}
      {...rest}
    />
  ),
);
Image.displayName = "Image";

type DismissLayer = {
  host: HTMLDivElement;
  close: () => void;

  ignoreNode: Node | null;
};
const dismissLayers: DismissLayer[] = [];
function resolveDismissIgnoreNode(ref: unknown): Node | null {
  const el =
    ref && typeof ref === "object" && "current" in (ref as Record<string, unknown>)
      ? (ref as { current: unknown }).current
      : ref;
  return el instanceof Node ? el : null;
}

const Portal = ({
  children,
  visible,
  onBackdropPress,
  backdropClassName,
  dismissViaDocument,
  dismissIgnoreRef,
}: PortalProps) => {

  const hostRef = useRef<HTMLDivElement | null>(null);
  const closeRef = useRef(onBackdropPress);
  closeRef.current = onBackdropPress;
  useEffect(() => {
    if (!visible || !dismissViaDocument || !closeRef.current) return;
    const layer: DismissLayer = {
      host: hostRef.current!,
      close: () => closeRef.current?.(),
      ignoreNode: resolveDismissIgnoreNode(dismissIgnoreRef),
    };
    dismissLayers.push(layer);
    const handlePointerDown = (event: PointerEvent) => {
      if (!(event.target instanceof Node)) return;
      const layers = dismissLayers.slice();
      for (let i = layers.length - 1; i >= 0; i--) {
        const current = layers[i]!;
        const inside =
          current.host.contains(event.target) ||
          (current.ignoreNode !== null && current.ignoreNode.contains(event.target));
        if (inside) break;
        current.close();
      }
    };
    document.addEventListener("pointerdown", handlePointerDown);
    return () => {
      const index = dismissLayers.indexOf(layer);
      if (index !== -1) dismissLayers.splice(index, 1);
      document.removeEventListener("pointerdown", handlePointerDown);
    };
  }, [visible, dismissViaDocument, dismissIgnoreRef]);
  if (!visible || typeof document === "undefined") return null;

  const renderBackdrop = (onBackdropPress || backdropClassName) && !dismissViaDocument;
  return createPortal(
    <>
      {renderBackdrop ? (
        <div
          className={backdropClassName}
          style={{ position: "fixed", inset: 0 }}
          onPointerDown={onBackdropPress}
        />
      ) : null}
      <div ref={hostRef} style={{ display: "contents" }}>
        {children}
      </div>
    </>,
    document.body,
  );
};

const PortalHost = ({ children }: PortalHostProps) => <>{children}</>;

const ScrollView = forwardRef<BridgeScrollViewRef, ScrollViewProps>(
  (
    {
      className,
      style,
      children,
      nativeID,
      testID,
      accessibilityLabel,
      accessibilityRole,
      contentContainerClassName,
      horizontal,
      pagingEnabled,
      onScroll,
      keyboardShouldPersistTaps: _keyboardShouldPersistTaps,
      keyboardDismissMode: _keyboardDismissMode,
      ...rest
    },
    ref,
  ) => {
    const elRef = useRef<HTMLDivElement | null>(null);
    useImperativeHandle(
      ref,
      () => ({
        scrollTo: ({ x = 0, y = 0 }: { x?: number; y?: number; animated?: boolean }) => {
          const el = elRef.current;
          if (!el) return;
          if (horizontal) el.scrollTo({ left: x, behavior: "smooth" });
          else el.scrollTo({ top: y, behavior: "smooth" });
        },
      }),
      [horizontal],
    );
    return (
      <div
        ref={elRef}
        id={nativeID}
        data-testid={testID}
        role={accessibilityRole}
        aria-label={accessibilityLabel}
        className={cn(
          horizontal ? "overflow-x-auto overflow-y-hidden" : "overflow-y-auto overflow-x-hidden",
          pagingEnabled && (horizontal ? "snap-x snap-mandatory" : "snap-y snap-mandatory"),
          className,
        )}
        style={resolveWebStyle(style)}
        onScroll={
          onScroll
            ? (event: ReactUIEvent<HTMLDivElement>) => {
                const el = event.currentTarget;
                const payload: BridgeScrollEvent = {
                  contentOffset: { x: el.scrollLeft, y: el.scrollTop },
                  contentSize: { width: el.scrollWidth, height: el.scrollHeight },
                  layoutMeasurement: { width: el.clientWidth, height: el.clientHeight },
                };
                onScroll(payload);
              }
            : undefined
        }
        {...rest}
      >
        <div
          className={cn(
            "flex min-w-full",
            horizontal ? "flex-row" : "flex-col",
            contentContainerClassName,
          )}
        >
          {children}
        </div>
      </div>
    );
  },
);
ScrollView.displayName = "ScrollView";

const renderListNode = (node: SectionListNode | undefined): ReactNode => {
  if (!node) return null;
  if (isValidElement(node)) return node;
  const Comp = node as ComponentType;
  return <Comp />;
};

const SectionList: SectionListComponent = ({
  className,
  style,
  nativeID,
  testID,
  accessibilityLabel,
  accessibilityRole,
  contentContainerClassName,
  sections,
  renderItem,
  keyExtractor,
  renderSectionHeader,
  stickySectionHeadersEnabled = true,
  ListHeaderComponent,
  ListEmptyComponent,
  ListFooterComponent,
  keyboardShouldPersistTaps: _keyboardShouldPersistTaps,
  keyboardDismissMode: _keyboardDismissMode,
  ...rest
}) => {
  const totalItems = sections.reduce((count, section) => count + section.data.length, 0);
  return (
    <div
      id={nativeID}
      data-testid={testID}
      role={accessibilityRole}
      aria-label={accessibilityLabel}
      className={cn("overflow-y-auto overflow-x-hidden", className)}
      style={style as React.CSSProperties}
      {...rest}
    >
      <div className={cn("flex min-w-full flex-col", contentContainerClassName)}>
        {renderListNode(ListHeaderComponent)}
        {totalItems === 0
          ? renderListNode(ListEmptyComponent)
          : sections.map((section, sectionIndex) => (
              <Fragment key={section.title ?? sectionIndex}>
                {renderSectionHeader ? (
                  <div
                    className={cn(
                      stickySectionHeadersEnabled && "sticky top-0 z-10",
                    )}
                  >
                    {renderSectionHeader({ section })}
                  </div>
                ) : null}
                {section.data.map((item, index) => (
                  <Fragment key={keyExtractor?.(item, index) ?? index}>
                    {renderItem({ item, index, section })}
                  </Fragment>
                ))}
              </Fragment>
            ))}
        {renderListNode(ListFooterComponent)}
      </div>
    </div>
  );
};

const Platform: BridgePlatformStatic = {
  OS: "web",
  select: (spec) => spec.web ?? spec.default,
};

const windowSnapshot = () => ({
  width: window.innerWidth,
  height: window.innerHeight,
  scale: window.devicePixelRatio || 1,
  fontScale: 1,
});

const screenSnapshot = () => ({
  width: window.screen.width,
  height: window.screen.height,
  scale: window.devicePixelRatio || 1,
  fontScale: 1,
});

const Dimensions: BridgeDimensions = {
  get: (dim) => (dim === "screen" ? screenSnapshot() : windowSnapshot()),
  addEventListener: (type, handler) => {
    if (type !== "change") return { remove: () => {} };
    const listener = () => handler({ window: windowSnapshot(), screen: screenSnapshot() });
    window.addEventListener("resize", listener);
    return { remove: () => window.removeEventListener("resize", listener) };
  },
};

const Share: BridgeShare = {
  share: async (content) => {
    if (typeof navigator !== "undefined" && navigator.share) {
      await navigator.share({
        text: content.message,
        url: content.url,
        title: content.title,
      });
      return { action: "shared" };
    }
    return { action: "dismissed" };
  },
};

const KeyboardAvoidingView = ({
  behavior: _behavior,
  keyboardVerticalOffset: _keyboardVerticalOffset,
  ...rest
}: KeyboardAvoidingViewProps) => <View {...rest} />;

const Select = forwardRef<BridgeSelectRef, SelectProps>(
  (
    {
      className,
      value,
      defaultValue,
      onValueChange,
      children,
      disabled,
      accessibilityLabel,
      nativeID,
      testID,
      name,
      required,
      tabIndex,
      ariaHidden,
    },
    ref,
  ) => (
    <select
      ref={ref as React.Ref<HTMLSelectElement> | undefined}
      className={className}
      value={value}
      defaultValue={defaultValue}
      disabled={disabled}
      aria-label={accessibilityLabel}
      id={nativeID}
      data-testid={testID}
      name={name}
      required={required}
      tabIndex={tabIndex}
      aria-hidden={ariaHidden}
      onChange={(event) => onValueChange?.(event.target.value)}
    >
      {children}
    </select>
  ),
);

const SelectOption = ({ value, disabled, children }: SelectOptionProps) => (
  <option value={value} disabled={disabled}>
    {children}
  </option>
);

const SelectOptGroup = ({ label, disabled, children }: SelectOptGroupProps) => (
  <optgroup label={label} disabled={disabled}>
    {children}
  </optgroup>
);

const measureInWindow: MeasureInWindow = (ref, callback) => {
  if (typeof window === "undefined") return;
  const el = ref as HTMLElement | null;
  if (!el || typeof el.getBoundingClientRect !== "function") return;
  const rect = el.getBoundingClientRect();
  callback(rect.x, rect.y, rect.width, rect.height, rect.x, rect.y);
};

const useDrag = (options: UseDragOptions): UseDragResult => {
  const [dragging, setDragging] = useState(false);
  const draggingRef = useRef(false);
  const optionsRef = useRef(options);
  optionsRef.current = options;
  const originRef = useRef({ x: 0, y: 0 });
  const sampleRef = useRef({ x: 0, y: 0, t: 0, vx: 0, vy: 0 });
  const lastEventRef = useRef<BridgeDragEvent>({ x: 0, y: 0, dx: 0, dy: 0, vx: 0, vy: 0 });

  const onPointerDown = (event: ReactPointerEvent<HTMLElement>) => {
    event.currentTarget.setPointerCapture?.(event.pointerId);
    const now = typeof performance !== "undefined" ? performance.now() : Date.now();
    originRef.current = { x: event.clientX, y: event.clientY };
    sampleRef.current = { x: event.clientX, y: event.clientY, t: now, vx: 0, vy: 0 };
    lastEventRef.current = { x: event.clientX, y: event.clientY, dx: 0, dy: 0, vx: 0, vy: 0 };
    draggingRef.current = true;
    setDragging(true);
    optionsRef.current.onBegin?.();
  };
  const onPointerMove = (event: ReactPointerEvent<HTMLElement>) => {
    if (!draggingRef.current) return;
    const now = typeof performance !== "undefined" ? performance.now() : Date.now();
    const dt = now - sampleRef.current.t;
    const vx = dt > 0 ? (event.clientX - sampleRef.current.x) / dt : sampleRef.current.vx;
    const vy = dt > 0 ? (event.clientY - sampleRef.current.y) / dt : sampleRef.current.vy;
    if (dt > 0) {
      sampleRef.current = { x: event.clientX, y: event.clientY, t: now, vx, vy };
    }
    const payload: BridgeDragEvent = {
      x: event.clientX,
      y: event.clientY,
      dx: event.clientX - originRef.current.x,
      dy: event.clientY - originRef.current.y,
      vx,
      vy,
    };
    lastEventRef.current = payload;
    optionsRef.current.onMove?.(payload);
  };
  const onPointerEnd = () => {
    if (!draggingRef.current) return;
    draggingRef.current = false;
    setDragging(false);
    optionsRef.current.onEnd?.(lastEventRef.current);
  };

  return {
    dragHandlers: {
      onPointerDown,
      onPointerMove,
      onPointerUp: onPointerEnd,
      onPointerCancel: onPointerEnd,
    },
    dragging,
  };
};

function toElement(target: unknown): HTMLElement | null {
  if (!target || typeof window === "undefined") return null;
  if (typeof target === "object" && "current" in (target as Record<string, unknown>)) {
    return (target as RefObject<HTMLElement | null>).current ?? null;
  }
  return target as HTMLElement | null;
}

const FOCUSABLE_SELECTOR =
  'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

const useOverlayFocus: UseOverlayFocus = (target, active, returnTo) => {
  const prevActiveRef = useRef(false);
  useEffect(() => {
    const node = toElement(target);
    if (active) {
      const first = node?.querySelector<HTMLElement>(FOCUSABLE_SELECTOR) ?? null;
      (first ?? node)?.focus({ preventScroll: true });
    } else if (prevActiveRef.current) {
      toElement(returnTo)?.focus({ preventScroll: true });
    }
    prevActiveRef.current = active;
  }, [active, target, returnTo]);

  useEffect(() => {
    if (!active) return;
    const node = toElement(target);
    if (!node) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Tab") return;
      const items = Array.from(
        node.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR),
      ).filter((el) => el.offsetParent !== null);
      if (items.length === 0) {
        event.preventDefault();
        return;
      }
      const first = items[0]!;
      const last = items[items.length - 1]!;
      const current = document.activeElement as HTMLElement | null;
      if (event.shiftKey && (current === first || !node.contains(current))) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && (current === last || !node.contains(current))) {
        event.preventDefault();
        first.focus();
      }
    };
    node.addEventListener("keydown", onKeyDown);
    return () => node.removeEventListener("keydown", onKeyDown);
  }, [active, target]);
};

const dismissStack: unknown[] = [];

const useDismiss: UseDismiss = (onDismiss, active) => {
  const callbackRef = useRef(onDismiss);
  callbackRef.current = onDismiss;
  useEffect(() => {
    if (!active || typeof document === "undefined") return;
    const entry = {};
    dismissStack.push(entry);
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      if (dismissStack[dismissStack.length - 1] !== entry) return;
      callbackRef.current();
    };
    document.addEventListener("keydown", onKeyDown);
    return () => {
      const index = dismissStack.indexOf(entry);
      if (index >= 0) dismissStack.splice(index, 1);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [active]);
};

const useReposition: UseReposition = (listener, active) => {
  const callbackRef = useRef(listener);
  callbackRef.current = listener;
  useEffect(() => {
    if (!active || typeof window === "undefined") return;

    let frame = 0;
    const onEvent = () => {
      if (frame) return;
      frame = window.requestAnimationFrame(() => {
        frame = 0;
        callbackRef.current();
      });
    };
    window.addEventListener("scroll", onEvent, true);
    window.addEventListener("resize", onEvent);
    return () => {
      if (frame) window.cancelAnimationFrame(frame);
      window.removeEventListener("scroll", onEvent, true);
      window.removeEventListener("resize", onEvent);
    };
  }, [active]);
};

const useScrollLock: UseScrollLock = (active) => {
  useEffect(() => {
    if (!active || typeof document === "undefined") return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, [active]);
};

let activeColorScheme: BridgeColorScheme = "light";
const colorSchemeListeners = new Set<() => void>();
const subscribeColorScheme = (listener: () => void) => {
  colorSchemeListeners.add(listener);
  return () => {
    colorSchemeListeners.delete(listener);
  };
};
const getColorSchemeSnapshot = (): BridgeColorScheme => activeColorScheme;
const getServerColorScheme = (): BridgeColorScheme => "light";

const applyColorScheme: ApplyColorScheme = (colorScheme) => {
  activeColorScheme = colorScheme;
  if (typeof document !== "undefined") {
    document.documentElement.classList.toggle("dark", colorScheme === "dark");
  }
  colorSchemeListeners.forEach((listener) => listener());
};

const useColorScheme: UseColorScheme = () =>
  useSyncExternalStore(
    subscribeColorScheme,
    getColorSchemeSnapshot,
    getServerColorScheme,
  );

const getViewport: GetViewport = () =>
  typeof window === "undefined"
    ? { width: 0, height: 0 }
    : { width: window.innerWidth, height: window.innerHeight };

const LoopRotate = ({ children }: LoopRotateProps) => <>{children}</>;
const LoopPulse = ({ children }: LoopPulseProps) => <>{children}</>;
const animateLayout: AnimateLayoutFn = () => {};

function wrapWebLucide(Icon: LucideIcon, defaultClassName = "size-4") {
  return function WebIcon({
    className,
    size,
    color,
    strokeWidth = 2,
    style,
    "aria-hidden": ariaHidden = true,
  }: IconProps) {
    return (
      <Icon
        className={className ? cn(defaultClassName, className) : defaultClassName}
        {...(size != null ? { size } : {})}
        color={color}
        strokeWidth={strokeWidth}
        aria-hidden={ariaHidden ? true : undefined}
        style={style as React.CSSProperties | undefined}
      />
    );
  };
}

const CheckIcon = wrapWebLucide(LucideCheckIcon);
const ChevronDownIcon = wrapWebLucide(LucideChevronDownIcon);
const ChevronUpIcon = wrapWebLucide(LucideChevronUpIcon);
const ChevronRightIcon = wrapWebLucide(LucideChevronRightIcon);
const ChevronLeftIcon = wrapWebLucide(LucideChevronLeftIcon);
const XIcon = wrapWebLucide(LucideXIcon);
const SearchIcon = wrapWebLucide(LucideSearchIcon);
const MinusIcon = wrapWebLucide(LucideMinusIcon);
const CircleIcon = wrapWebLucide(LucideCircleIcon);
const MoreHorizontalIcon = wrapWebLucide(LucideMoreHorizontalIcon);
const ArrowLeftIcon = wrapWebLucide(LucideArrowLeftIcon);
const ArrowRightIcon = wrapWebLucide(LucideArrowRightIcon);
const ArrowUpIcon = wrapWebLucide(LucideArrowUpIcon);
const ArrowDownIcon = wrapWebLucide(LucideArrowDownIcon);
const InfoIcon = wrapWebLucide(LucideInfoIcon);
const AlertCircleIcon = wrapWebLucide(LucideAlertCircleIcon);
const CheckCircle2Icon = wrapWebLucide(LucideCheckCircle2Icon);
const XCircleIcon = wrapWebLucide(LucideXCircleIcon);
const Loader2Icon = wrapWebLucide(LucideLoader2Icon);
const PanelLeftIcon = wrapWebLucide(LucidePanelLeftIcon);
const GripVerticalIcon = wrapWebLucide(LucideGripVerticalIcon);

const BoldIcon = wrapWebLucide(LucideBoldIcon);
const ItalicIcon = wrapWebLucide(LucideItalicIcon);
const StrikethroughIcon = wrapWebLucide(LucideStrikethroughIcon);
const Heading1Icon = wrapWebLucide(LucideHeading1Icon);
const Heading2Icon = wrapWebLucide(LucideHeading2Icon);
const ListIcon = wrapWebLucide(LucideListIcon);
const ListOrderedIcon = wrapWebLucide(LucideListOrderedIcon);
const TextQuoteIcon = wrapWebLucide(LucideTextQuoteIcon);
const CodeIcon = wrapWebLucide(LucideCodeIcon);
const Undo2Icon = wrapWebLucide(LucideUndo2Icon);
const Redo2Icon = wrapWebLucide(LucideRedo2Icon);

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
