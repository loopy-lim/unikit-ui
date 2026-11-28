import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";

import {
  Portal,
  View,
  getViewport,
  measureInWindow,
  useDismiss,
  useOverlayFocus,
  useReposition,
  useScrollLock,
  type BridgeRole,
} from "@unikit-bridge/ui/primitives";

import { cn } from "./utils";

export type ModalOverlayPosition = "center" | "top" | "bottom" | "left" | "right";

const POSITION_CLASSES: Record<ModalOverlayPosition, string> = {
  center: "items-center justify-center",
  top: "items-center justify-start",
  bottom: "items-center justify-end",
  left: "flex-row items-center justify-start",
  right: "flex-row items-center justify-end",
};

const MODAL_WRAPPER_STYLE = { position: "fixed", inset: 0 } as const;

export type ModalOverlayProps = {
  visible: boolean;
  onClose: () => void;
  children?: ReactNode;

  position?: ModalOverlayPosition;

  className?: string;

  backdropClassName?: string;

  triggerRef?: unknown;

  accessibilityRole?: BridgeRole;
  accessibilityLabel?: string;

  "aria-labelledby"?: string;

  dismissOnBackdrop?: boolean;

  dismissOnEscape?: boolean;
};

const NOOP = () => {};

export function ModalOverlay({
  visible,
  onClose,
  children,
  position = "center",
  className,
  backdropClassName,
  triggerRef,
  accessibilityRole,
  accessibilityLabel,
  "aria-labelledby": ariaLabelledBy,
  dismissOnBackdrop = true,
  dismissOnEscape = true,
}: ModalOverlayProps) {
  const contentRef = useRef<HTMLElement | null>(null);
  useOverlayFocus(contentRef, visible, triggerRef);
  useDismiss(onClose, visible && dismissOnEscape);
  useScrollLock(visible);
  return (
    <Portal
      visible={visible}
      onBackdropPress={dismissOnBackdrop ? onClose : undefined}
      onRequestClose={dismissOnEscape ? onClose : NOOP}
      backdropClassName={
        backdropClassName
          ? cn("bg-black/50 unikit-backdrop-in", backdropClassName)
          : "bg-black/50 unikit-backdrop-in"
      }
    >
      <View
        ref={contentRef}
        aria-modal
        accessibilityRole={accessibilityRole}
        accessibilityLabel={accessibilityLabel}
        aria-labelledby={ariaLabelledBy}
        pointerEvents="box-none"

        style={MODAL_WRAPPER_STYLE}
        className={cn("flex", POSITION_CLASSES[position], className)}
      >
        {children}
      </View>
    </Portal>
  );
}

export type OverlayPlacement = "top" | "bottom" | "left" | "right";
export type OverlayAlign = "start" | "center" | "end";

const OverlayPlacementContext = createContext<OverlayPlacement | null>(null);

export function useOverlayPlacement(): OverlayPlacement | null {
  return useContext(OverlayPlacementContext);
}

export type AnchoredOverlayProps = {
  visible: boolean;
  onClose: () => void;

  anchorRef: unknown;

  placement?: OverlayPlacement;

  align?: OverlayAlign;

  offset?: number;
  children?: ReactNode;

  className?: string;

  triggerRef?: unknown;

  focusOnOpen?: boolean;
  accessibilityRole?: BridgeRole;
  accessibilityLabel?: string;
};

type Rect = { x: number; y: number; w: number; h: number };

const VIEWPORT_PADDING = 8;

function measureRef(ref: unknown, callback: Parameters<typeof measureInWindow>[1]) {
  const el =
    ref && typeof ref === "object" && "current" in (ref as Record<string, unknown>)
      ? (ref as { current: unknown }).current
      : ref;
  if (el) measureInWindow(el, callback);
}

export function computeOverlayPositionWithPlacement(
  anchor: Rect | null,
  content: { w: number; h: number } | null,
  options: { placement: OverlayPlacement; align: OverlayAlign; offset: number },
): { left: number; top: number; placement: OverlayPlacement } {
  const a = anchor ?? { x: 0, y: 0, w: 0, h: 0 };
  const cw = content?.w ?? 0;
  const ch = content?.h ?? 0;
  const { align, offset } = options;
  let resolvedPlacement = options.placement;
  const viewport = getViewport();

  if (
    content &&
    viewport.height > 0 &&
    (resolvedPlacement === "bottom" || resolvedPlacement === "top")
  ) {
    const spaceBelow = viewport.height - (a.y + a.h + offset) - VIEWPORT_PADDING;
    const spaceAbove = a.y - offset - VIEWPORT_PADDING;
    if (resolvedPlacement === "bottom" && ch > spaceBelow && spaceAbove > spaceBelow) {
      resolvedPlacement = "top";
    } else if (resolvedPlacement === "top" && ch > spaceAbove && spaceBelow > spaceAbove) {
      resolvedPlacement = "bottom";
    }
  } else if (
    content &&
    viewport.width > 0 &&
    (resolvedPlacement === "right" || resolvedPlacement === "left")
  ) {
    const spaceRight = viewport.width - (a.x + a.w + offset) - VIEWPORT_PADDING;
    const spaceLeft = a.x - offset - VIEWPORT_PADDING;
    if (resolvedPlacement === "right" && cw > spaceRight && spaceLeft > spaceRight) {
      resolvedPlacement = "left";
    } else if (resolvedPlacement === "left" && cw > spaceLeft && spaceRight > spaceLeft) {
      resolvedPlacement = "right";
    }
  }

  let left = 0;
  let top = 0;
  if (resolvedPlacement === "bottom" || resolvedPlacement === "top") {
    top = resolvedPlacement === "bottom" ? a.y + a.h + offset : a.y - ch - offset;
    left =
      align === "start"
        ? a.x
        : align === "center"
          ? a.x + (a.w - cw) / 2
          : a.x + a.w - cw;
  } else {
    left = resolvedPlacement === "right" ? a.x + a.w + offset : a.x - cw - offset;
    top =
      align === "start" ? a.y : align === "center" ? a.y + (a.h - ch) / 2 : a.y + a.h - ch;
  }

  if (viewport.width > 0) {
    left = Math.min(
      Math.max(left, VIEWPORT_PADDING),
      Math.max(viewport.width - cw - VIEWPORT_PADDING, VIEWPORT_PADDING),
    );
  }
  if (viewport.height > 0) {
    if (top + ch > viewport.height - VIEWPORT_PADDING) {
      top = Math.max(viewport.height - ch - VIEWPORT_PADDING, VIEWPORT_PADDING);
    } else if (top < VIEWPORT_PADDING) {
      top = VIEWPORT_PADDING;
    }
  }
  return { left, top, placement: resolvedPlacement };
}

export function computeOverlayPosition(
  anchor: Rect | null,
  content: { w: number; h: number } | null,
  options: { placement: OverlayPlacement; align: OverlayAlign; offset: number },
): { left: number; top: number } {
  const { left, top } = computeOverlayPositionWithPlacement(anchor, content, options);
  return { left, top };
}

export type OverlayPositionState = {
  left: number;
  top: number;

  placement: OverlayPlacement;
  maxWidth: number | null;
  maxHeight: number | null;
};

export type OverlayPositionSession = { stop: () => void };

export type OverlayPositionEngine = {
  attach(args: {

    anchorRef: unknown;

    contentRef: unknown;

    getOptions(): { placement: OverlayPlacement; align: OverlayAlign; offset: number };

    onPlace(next: OverlayPositionState): void;
  }): OverlayPositionSession;
};

let overlayPositionEngine: OverlayPositionEngine | null = null;

export function setOverlayPositionEngine(engine: OverlayPositionEngine | null): void {
  overlayPositionEngine = engine;
}

export function getOverlayPositionEngine(): OverlayPositionEngine | null {
  return overlayPositionEngine;
}

export function AnchoredOverlay({
  visible,
  onClose,
  anchorRef,
  placement = "bottom",
  align = "start",
  offset = 8,
  children,
  className,
  triggerRef,
  focusOnOpen = true,
  accessibilityRole,
  accessibilityLabel,
}: AnchoredOverlayProps) {
  const [anchorRect, setAnchorRect] = useState<Rect | null>(null);
  const [contentSize, setContentSize] = useState<{ w: number; h: number } | null>(null);

  const [placed, setPlaced] = useState<OverlayPositionState | null>(null);
  const contentRef = useRef<HTMLElement | null>(null);
  const engine = getOverlayPositionEngine();
  const ready = anchorRect !== null;

  const optionsRef = useRef({ placement, align, offset });
  optionsRef.current = { placement, align, offset };

  const measure = useCallback(() => {
    measureRef(anchorRef, (x, y, width, height) =>
      setAnchorRect((prev) =>
        prev && prev.x === x && prev.y === y && prev.w === width && prev.h === height
          ? prev
          : { x, y, w: width, h: height },
      ),
    );
    measureRef(contentRef, (_x, _y, width, height) =>
      setContentSize((prev) =>
        prev && prev.w === width && prev.h === height ? prev : { w: width, h: height },
      ),
    );
  }, [anchorRef]);

  useEffect(() => {
    if (!visible) {
      setAnchorRect(null);
      setContentSize(null);
      return;
    }
    measure();
  }, [visible, ready, measure]);
  useReposition(measure, visible);

  useEffect(() => {
    if (!visible || !ready || !engine) return;
    const session = engine.attach({
      anchorRef,
      contentRef,
      getOptions: () => optionsRef.current,
      onPlace: setPlaced,
    });
    return () => {
      session.stop();
      setPlaced(null);
    };
  }, [visible, ready, engine, anchorRef]);
  useDismiss(onClose, visible);

  useOverlayFocus(contentRef, visible && ready && focusOnOpen, triggerRef);

  const builtinPosition = engine
    ? null
    : computeOverlayPositionWithPlacement(anchorRect, contentSize, {
        placement,
        align,
        offset,
      });
  const resolvedPlacement = engine
    ? (placed?.placement ?? placement)
    : (builtinPosition?.placement ?? placement);
  const positionedStyle = useMemo(() => {
    if (engine) {

      return {
        position: "fixed" as const,
        left: placed?.left ?? 0,
        top: placed?.top ?? 0,
        ...(placed?.maxWidth != null ? { maxWidth: placed.maxWidth } : {}),
        ...(placed?.maxHeight != null ? { maxHeight: placed.maxHeight } : {}),
        opacity: placed !== null ? 1 : 0,
      };
    }
    return {
      position: "fixed" as const,
      left: builtinPosition?.left ?? 0,
      top: builtinPosition?.top ?? 0,

      opacity: contentSize !== null ? 1 : 0,
    };

  }, [
    engine,
    placed,
    builtinPosition?.left,
    builtinPosition?.top,
    contentSize,
    placement,
  ]);
  return (

    <Portal
      visible={visible && ready}
      onBackdropPress={onClose}
      onRequestClose={onClose}
      dismissViaDocument
      dismissIgnoreRef={anchorRef}
    >
      <View
        ref={contentRef}
        accessibilityRole={accessibilityRole}
        accessibilityLabel={accessibilityLabel}
        className={className ? cn("pointer-events-auto", className) : "pointer-events-auto"}
        style={positionedStyle}
      >
        <OverlayPlacementContext.Provider value={resolvedPlacement}>
          {children}
        </OverlayPlacementContext.Provider>
      </View>
    </Portal>
  );
}
