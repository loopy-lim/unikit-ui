import {
  Children,
  createContext,
  forwardRef,
  useCallback,
  useContext,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  type ForwardedRef,
  type ReactNode,
} from "react";
import {
  CheckIcon,
  ChevronRightIcon,
  Pressable,
  Text,
  View,
  type BridgeKeyEvent,
  type BridgePressableRef,
  type BridgeTextRef,
  type BridgeViewRef,
  type PressableProps,
  type TextProps,
  type ViewProps,
} from "@unikit-bridge/ui/primitives";

import {
  AnchoredOverlay,
  type OverlayAlign,
  type OverlayPlacement,
} from "../lib/overlay";
import {
  composeMenuItemFocus,
  composeMenuItemHoverIn,
  composeMenuNavKeyDown,
  MenuNavContext,
  useMenuItemRef,
  useMenuNav,
  useMenuNavContext,
} from "../lib/menu-nav";
import { cn } from "../lib/utils";

type PressableRefObject = { current: BridgePressableRef | null };

function composeRefs(
  ...refs: Array<ForwardedRef<BridgePressableRef> | PressableRefObject>
) {
  return (node: BridgePressableRef | null) => {
    for (const ref of refs) {
      if (!ref) continue;
      if (typeof ref === "function") ref(node);
      else ref.current = node;
    }
  };
}

function wrapTextChildren(children: ReactNode, textClassName: string) {
  return Children.map(children, (child) =>
    typeof child === "string" || typeof child === "number" ? (
      <Text className={textClassName}>{child}</Text>
    ) : (
      child
    ),
  );
}

type ContextMenuContextValue = {
  open: boolean;
  setOpen: (open: boolean) => void;

  triggerRef: PressableRefObject;

  baseId: string;
};

const ContextMenuContext = createContext<ContextMenuContextValue | null>(null);

function useContextMenuContext(component: string): ContextMenuContextValue {
  const ctx = useContext(ContextMenuContext);
  if (!ctx) {
    throw new Error(`<${component}>는 <ContextMenu> 안에서 사용해야 합니다.`);
  }
  return ctx;
}

type ContextMenuSubContextValue = {
  open: boolean;
  setOpen: (open: boolean) => void;

  openViaPointer: () => void;

  scheduleOpen: (source?: "pointer" | "keyboard") => void;

  scheduleClose: () => void;

  cancelClose: () => void;

  entry: "pointer" | "keyboard" | null;
  triggerRef: PressableRefObject;
  baseId: string;
};

const ContextMenuSubContext = createContext<ContextMenuSubContextValue | null>(
  null,
);

function useContextMenuSubContext(
  component: string,
): ContextMenuSubContextValue {
  const ctx = useContext(ContextMenuSubContext);
  if (!ctx) {
    throw new Error(`<${component}>는 <ContextMenuSub> 안에서 사용해야 합니다.`);
  }
  return ctx;
}

type ContextMenuRadioGroupContextValue = {
  value: string;
  onItemSelect: (value: string) => void;
};

const ContextMenuRadioGroupContext =
  createContext<ContextMenuRadioGroupContextValue>({
    value: "",
    onItemSelect: () => {},
  });

const CARD_CLASSES =
  "pointer-events-auto z-50 min-w-32 rounded-md border border-border bg-popover p-1 text-popover-foreground unikit-popover-in web:max-h-96 web:overflow-x-hidden web:overflow-y-auto web:shadow-md";

const ITEM_CLASSES =
  "relative flex-row items-center gap-2 rounded-sm px-2 py-1.5 web:cursor-default web:select-none web:outline-none";

const ITEM_HIGHLIGHT_CLASSES =
  "active:bg-accent active:text-accent-foreground web:hover:bg-accent web:hover:text-accent-foreground web:focus-visible:bg-accent web:focus-visible:text-accent-foreground";

const INDICATED_ITEM_CLASSES =
  "relative flex-row items-center gap-2 rounded-sm py-1.5 pr-2 pl-8 active:bg-accent active:text-accent-foreground web:cursor-default web:select-none web:outline-none web:hover:bg-accent web:hover:text-accent-foreground web:focus-visible:bg-accent web:focus-visible:text-accent-foreground";

const ITEM_TEXT_CLASSES =
  "flex-1 font-sans text-sm text-popover-foreground active:text-accent-foreground web:hover:text-accent-foreground web:focus-visible:text-accent-foreground";

const INDICATOR_SLOT_CLASSES =
  "absolute left-2 size-3.5 items-center justify-center web:pointer-events-none";

const TRIGGER_RESET_CLASSES = "web:outline-none";

export type ContextMenuProps = ViewProps & {
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
};

const ContextMenu = forwardRef<BridgeViewRef, ContextMenuProps>(
  (
    { open, defaultOpen = false, onOpenChange, className, children, ...props },
    ref,
  ) => {

    const [internalOpen, setInternalOpen] = useState(defaultOpen);
    const isOpen = open !== undefined ? open : internalOpen;
    const stateRef = useRef({ open, isOpen, onOpenChange });
    stateRef.current = { open, isOpen, onOpenChange };
    const setOpen = useCallback((next: boolean) => {
      const state = stateRef.current;
      if (state.open === undefined) setInternalOpen(next);
      if (next !== state.isOpen) state.onOpenChange?.(next);
    }, []);
    const triggerRef = useRef<BridgePressableRef | null>(null);
    const baseId = useId();
    const contextValue = useMemo<ContextMenuContextValue>(
      () => ({ open: isOpen, setOpen, triggerRef, baseId }),
      [isOpen, setOpen, baseId],
    );
    return (
      <ContextMenuContext.Provider value={contextValue}>

        <View ref={ref} className={className} {...props}>
          {children}
        </View>
      </ContextMenuContext.Provider>
    );
  },
);
ContextMenu.displayName = "ContextMenu";

export type ContextMenuPortalProps = { children?: ReactNode };

function ContextMenuPortal({ children }: ContextMenuPortalProps) {
  return <>{children}</>;
}

export type ContextMenuTriggerProps = PressableProps;

const ContextMenuTrigger = forwardRef<
  BridgePressableRef,
  ContextMenuTriggerProps
>(({ className, children, ...props }, ref) => {
  const menu = useContextMenuContext("ContextMenuTrigger");
  return (
    <Pressable
      ref={composeRefs(ref, menu.triggerRef)}
      accessibilityRole="button"
      aria-expanded={menu.open}
      aria-controls={`${menu.baseId}-context-menu-content`}

      onContextMenu={() => menu.setOpen(!menu.open)}
      className={cn(TRIGGER_RESET_CLASSES, className)}
      {...props}
    >
      {wrapTextChildren(children, "font-sans text-sm text-foreground")}
    </Pressable>
  );
});
ContextMenuTrigger.displayName = "ContextMenuTrigger";

export type ContextMenuContentProps = ViewProps & {

  side?: OverlayPlacement;

  align?: OverlayAlign;

  sideOffset?: number;
};

const ContextMenuContent = forwardRef<BridgeViewRef, ContextMenuContentProps>(
  (
    {
      className,
      side = "bottom",
      align = "start",
      sideOffset = 4,
      children,
      onKeyDown,
      ...props
    },
    ref,
  ) => {
    const menu = useContextMenuContext("ContextMenuContent");

    const nav = useMenuNav();
    return (
      <AnchoredOverlay
        visible={menu.open}
        onClose={() => menu.setOpen(false)}
        anchorRef={menu.triggerRef}

        triggerRef={menu.triggerRef}
        placement={side}
        align={align}
        offset={sideOffset}
        className="z-50"
        accessibilityRole="menu"
      >
        <MenuNavContext.Provider value={nav}>
          <View
            ref={ref}
            nativeID={`${menu.baseId}-context-menu-content`}
            focusable
            onKeyDown={composeMenuNavKeyDown(nav, onKeyDown)}
            className={cn(CARD_CLASSES, className)}
            {...props}
          >
            {children}
          </View>
        </MenuNavContext.Provider>
      </AnchoredOverlay>
    );
  },
);
ContextMenuContent.displayName = "ContextMenuContent";

export type ContextMenuGroupProps = ViewProps;

const ContextMenuGroup = forwardRef<BridgeViewRef, ContextMenuGroupProps>(
  ({ ...props }, ref) => <View ref={ref} {...props} />,
);
ContextMenuGroup.displayName = "ContextMenuGroup";

export type ContextMenuItemProps = Omit<PressableProps, "onPress"> & {
  inset?: boolean;
  variant?: "default" | "destructive";

  onSelect?: () => void;
  children?: ReactNode;
};

const ContextMenuItem = forwardRef<BridgePressableRef, ContextMenuItemProps>(
  (
    {
      className,
      inset,
      variant = "default",
      disabled,
      onSelect,
      children,
      onFocus,
      onHoverIn,
      ...props
    },
    ref,
  ) => {
    const menu = useContextMenuContext("ContextMenuItem");
    const destructive = variant === "destructive";

    const nav = useMenuNavContext();
    const handleSelect = () => {
      if (disabled) return;
      onSelect?.();
      menu.setOpen(false);
    };
    const { id, attach, nodeRef } = useMenuItemRef(ref, undefined, handleSelect);
    return (
      <Pressable
        ref={attach}
        accessibilityRole="menuitem"
        disabled={disabled}
        focusable={!disabled}

        onHoverIn={composeMenuItemHoverIn(nav, id, nodeRef, onHoverIn)}
        onFocus={composeMenuItemFocus(nav, id, onFocus)}
        onPress={handleSelect}
        className={cn(
          ITEM_CLASSES,
          destructive
            ? "active:bg-destructive/10 web:hover:bg-destructive/10 web:focus-visible:bg-destructive/10"
            : ITEM_HIGHLIGHT_CLASSES,
          inset && "pl-8",
          disabled && "web:pointer-events-none opacity-50",
          className,
        )}
        {...props}
      >
        {wrapTextChildren(
          children,

          cn(
            ITEM_TEXT_CLASSES,
            destructive &&
              "text-destructive active:text-destructive web:hover:text-destructive web:focus-visible:text-destructive",
          ),
        )}
      </Pressable>
    );
  },
);
ContextMenuItem.displayName = "ContextMenuItem";

export type ContextMenuCheckboxItemProps = Omit<
  PressableProps,
  "onPress" | "aria-checked"
> & {

  checked?: boolean;
  defaultChecked?: boolean;
  onCheckedChange?: (checked: boolean) => void;
  onSelect?: () => void;
  children?: ReactNode;
};

const ContextMenuCheckboxItem = forwardRef<
  BridgePressableRef,
  ContextMenuCheckboxItemProps
>(
  (
    {
      className,
      checked,
      defaultChecked = false,
      onCheckedChange,
      onSelect,
      disabled,
      children,
      onFocus,
      onHoverIn,
      ...props
    },
    ref,
  ) => {
    const menu = useContextMenuContext("ContextMenuCheckboxItem");

    const [uncontrolled, setUncontrolled] = useState(defaultChecked);
    const isChecked = checked !== undefined ? checked : uncontrolled;

    const nav = useMenuNavContext();
    const handleSelect = () => {
      if (disabled) return;
      const next = !isChecked;
      if (checked === undefined) setUncontrolled(next);
      onCheckedChange?.(next);
      onSelect?.();
      menu.setOpen(false);
    };
    const { id, attach, nodeRef } = useMenuItemRef(ref, undefined, handleSelect);
    return (
      <Pressable
        ref={attach}
        accessibilityRole="menuitem"
        aria-checked={isChecked}
        disabled={disabled}
        focusable={!disabled}

        onHoverIn={composeMenuItemHoverIn(nav, id, nodeRef, onHoverIn)}
        onFocus={composeMenuItemFocus(nav, id, onFocus)}
        onPress={handleSelect}
        className={cn(
          INDICATED_ITEM_CLASSES,
          disabled && "web:pointer-events-none opacity-50",
          className,
        )}
        {...props}
      >

        <View aria-hidden className={INDICATOR_SLOT_CLASSES}>
          {isChecked ? (
            <CheckIcon className="size-4 text-foreground" />
          ) : null}
        </View>
        {wrapTextChildren(children, ITEM_TEXT_CLASSES)}
      </Pressable>
    );
  },
);
ContextMenuCheckboxItem.displayName = "ContextMenuCheckboxItem";

export type ContextMenuRadioGroupProps = ViewProps & {
  value?: string;
  defaultValue?: string;
  onValueChange?: (value: string) => void;
};

const ContextMenuRadioGroup = forwardRef<
  BridgeViewRef,
  ContextMenuRadioGroupProps
>(({ value, defaultValue = "", onValueChange, children, ...props }, ref) => {

  const [uncontrolled, setUncontrolled] = useState(defaultValue);
  const selected = value !== undefined ? value : uncontrolled;
  const onItemSelect = useCallback(
    (itemValue: string) => {
      if (value === undefined) setUncontrolled(itemValue);
      onValueChange?.(itemValue);
    },
    [value, onValueChange],
  );
  const contextValue = useMemo(
    () => ({ value: selected, onItemSelect }),
    [selected, onItemSelect],
  );
  return (
    <ContextMenuRadioGroupContext.Provider value={contextValue}>
      <View ref={ref} {...props}>
        {children}
      </View>
    </ContextMenuRadioGroupContext.Provider>
  );
});
ContextMenuRadioGroup.displayName = "ContextMenuRadioGroup";

export type ContextMenuRadioItemProps = Omit<
  PressableProps,
  "onPress" | "aria-checked"
> & {

  value: string;
  onSelect?: () => void;
  children?: ReactNode;
};

const ContextMenuRadioItem = forwardRef<
  BridgePressableRef,
  ContextMenuRadioItemProps
>(
  (
    { className, value, onSelect, disabled, children, onFocus, onHoverIn, ...props },
    ref,
  ) => {
    const menu = useContextMenuContext("ContextMenuRadioItem");
    const group = useContext(ContextMenuRadioGroupContext);
    const isChecked = group.value === value;

    const nav = useMenuNavContext();
    const handleSelect = () => {
      if (disabled) return;
      group.onItemSelect(value);
      onSelect?.();
      menu.setOpen(false);
    };
    const { id, attach, nodeRef } = useMenuItemRef(ref, undefined, handleSelect);
    return (
      <Pressable
        ref={attach}
        accessibilityRole="menuitem"
        aria-checked={isChecked}
        disabled={disabled}
        focusable={!disabled}

        onHoverIn={composeMenuItemHoverIn(nav, id, nodeRef, onHoverIn)}
        onFocus={composeMenuItemFocus(nav, id, onFocus)}
        onPress={handleSelect}
        className={cn(
          INDICATED_ITEM_CLASSES,
          disabled && "web:pointer-events-none opacity-50",
          className,
        )}
        {...props}
      >
        {
                                                                   }
        <View aria-hidden className={INDICATOR_SLOT_CLASSES}>
          {isChecked ? (
            <View className="size-2 rounded-full bg-foreground" />
          ) : null}
        </View>
        {wrapTextChildren(children, ITEM_TEXT_CLASSES)}
      </Pressable>
    );
  },
);
ContextMenuRadioItem.displayName = "ContextMenuRadioItem";

export type ContextMenuLabelProps = ViewProps & {
  inset?: boolean;
};

const ContextMenuLabel = forwardRef<BridgeViewRef, ContextMenuLabelProps>(
  ({ className, inset, children, ...props }, ref) => (
    <View
      ref={ref}
      className={cn("px-2 py-1.5", inset && "pl-8", className)}
      {...props}
    >

      {wrapTextChildren(
        children,
        "font-sans text-sm font-medium text-foreground",
      )}
    </View>
  ),
);
ContextMenuLabel.displayName = "ContextMenuLabel";

export type ContextMenuSeparatorProps = ViewProps;

const ContextMenuSeparator = forwardRef<
  BridgeViewRef,
  ContextMenuSeparatorProps
>(({ className, ...props }, ref) => (
  <View
    ref={ref}
    accessibilityRole="separator"
    className={cn("-mx-1 my-1 h-px bg-border", className)}
    {...props}
  />
));
ContextMenuSeparator.displayName = "ContextMenuSeparator";

export type ContextMenuShortcutProps = TextProps;

const ContextMenuShortcut = forwardRef<
  BridgeTextRef,
  ContextMenuShortcutProps
>(({ className, ...props }, ref) => (

  <Text
    ref={ref}
    className={cn(
      "ml-auto font-sans text-xs tracking-widest text-muted-foreground",
      className,
    )}
    {...props}
  />
));
ContextMenuShortcut.displayName = "ContextMenuShortcut";

export type ContextMenuSubProps = {

  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  children?: ReactNode;
};

const SUB_OPEN_DELAY = 100;
const SUB_CLOSE_GRACE = 300;

function ContextMenuSub({
  open,
  defaultOpen = false,
  onOpenChange,
  children,
}: ContextMenuSubProps) {

  const [internalOpen, setInternalOpen] = useState(defaultOpen);
  const isOpen = open ?? internalOpen;
  const stateRef = useRef({ open, isOpen, onOpenChange });
  stateRef.current = { open, isOpen, onOpenChange };
  const openRef = useRef(isOpen);
  openRef.current = isOpen;
  const triggerRef = useRef<BridgePressableRef | null>(null);
  const baseId = useId();

  const [entry, setEntry] = useState<"pointer" | "keyboard" | null>(null);
  const openTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const closeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const clearOpenTimer = useCallback(() => {
    if (openTimerRef.current !== null) {
      clearTimeout(openTimerRef.current);
      openTimerRef.current = null;
    }
  }, []);
  const clearCloseTimer = useCallback(() => {
    if (closeTimerRef.current !== null) {
      clearTimeout(closeTimerRef.current);
      closeTimerRef.current = null;
    }
  }, []);
  useEffect(
    () => () => {
      clearOpenTimer();
      clearCloseTimer();
    },
    [clearOpenTimer, clearCloseTimer],
  );

  useEffect(() => {
    clearOpenTimer();
    clearCloseTimer();
    if (!isOpen) setEntry(null);
  }, [isOpen, clearOpenTimer, clearCloseTimer]);

  const commitOpen = useCallback((next: boolean) => {
    const state = stateRef.current;
    if (state.open === undefined) setInternalOpen(next);
    if (next !== state.isOpen) state.onOpenChange?.(next);
  }, []);

  const setOpen = useCallback(
    (next: boolean) => {
      clearOpenTimer();
      clearCloseTimer();
      if (!next) setEntry(null);
      commitOpen(next);
    },
    [clearOpenTimer, clearCloseTimer, commitOpen],
  );
  const scheduleOpen = useCallback(
    (source?: "pointer" | "keyboard") => {
      clearCloseTimer();
      if (openRef.current) return;
      clearOpenTimer();
      openTimerRef.current = setTimeout(() => {
        openTimerRef.current = null;
        setEntry(source ?? "pointer");
        commitOpen(true);
      }, SUB_OPEN_DELAY);
    },
    [clearCloseTimer, clearOpenTimer, commitOpen],
  );

  const openViaPointer = useCallback(() => {
    clearOpenTimer();
    clearCloseTimer();
    setEntry("pointer");
    commitOpen(true);
  }, [clearOpenTimer, clearCloseTimer, commitOpen]);
  const scheduleClose = useCallback(() => {
    clearOpenTimer();
    if (!openRef.current) return;
    clearCloseTimer();
    closeTimerRef.current = setTimeout(() => {
      closeTimerRef.current = null;
      setEntry(null);
      commitOpen(false);
    }, SUB_CLOSE_GRACE);
  }, [clearOpenTimer, clearCloseTimer, commitOpen]);
  const cancelClose = clearCloseTimer;

  const contextValue = useMemo(
    () => ({
      open: isOpen,
      setOpen,
      openViaPointer,
      scheduleOpen,
      scheduleClose,
      cancelClose,
      entry,
      triggerRef,
      baseId,
    }),
    [
      isOpen,
      setOpen,
      openViaPointer,
      scheduleOpen,
      scheduleClose,
      cancelClose,
      entry,
      baseId,
    ],
  );
  return (
    <ContextMenuSubContext.Provider value={contextValue}>
      {children}
    </ContextMenuSubContext.Provider>
  );
}

export type ContextMenuSubTriggerProps = Omit<PressableProps, "onPress"> & {
  inset?: boolean;
  children?: ReactNode;
};

const ContextMenuSubTrigger = forwardRef<
  BridgePressableRef,
  ContextMenuSubTriggerProps
>(
  (
    { className, inset, disabled, children, onHoverIn, onHoverOut, onFocus, onKeyDown, ...props },
    ref,
  ) => {
    const sub = useContextMenuSubContext("ContextMenuSubTrigger");

    const nav = useMenuNavContext();
    const composedRef = useMemo(
      () => composeRefs(ref, sub.triggerRef),
      [ref, sub.triggerRef],
    );
    const openViaKeyboard = useMemo(
      () => () => sub.scheduleOpen("keyboard"),
      [sub.scheduleOpen],
    );
    const { id, attach, nodeRef } = useMenuItemRef(composedRef, openViaKeyboard);
    return (
      <Pressable
        ref={attach}
        accessibilityRole="menuitem"
        aria-expanded={sub.open}
        aria-controls={`${sub.baseId}-context-menu-sub-content`}
        disabled={disabled}
        focusable={!disabled}

        onHoverIn={composeMenuItemHoverIn(nav, id, nodeRef, () => {
          sub.scheduleOpen("pointer");
          onHoverIn?.();
        })}
        onHoverOut={() => {
          sub.scheduleClose();
          onHoverOut?.();
        }}
        onFocus={composeMenuItemFocus(nav, id, onFocus)}

        onKeyDown={(event) => {
          if (event.key === "ArrowLeft" && sub.open) {
            event.preventDefault();
            event.stopPropagation?.();
            sub.setOpen(false);
          }
          onKeyDown?.(event);
        }}

        onPress={() => (sub.open ? sub.setOpen(false) : sub.openViaPointer())}
        className={cn(
          ITEM_CLASSES,
          ITEM_HIGHLIGHT_CLASSES,
          inset && "pl-8",

          sub.open && "bg-accent active:bg-accent",
          disabled && "web:pointer-events-none opacity-50",
          className,
        )}
        {...props}
      >
        {wrapTextChildren(
          children,
          cn(ITEM_TEXT_CLASSES, sub.open && "text-accent-foreground"),
        )}
        <ChevronRightIcon
          className={cn(
            "ml-auto size-4",
            sub.open ? "text-accent-foreground" : "text-muted-foreground",
          )}
        />
      </Pressable>
    );
  },
);
ContextMenuSubTrigger.displayName = "ContextMenuSubTrigger";

export type ContextMenuSubContentProps = ViewProps & {

  side?: OverlayPlacement;
  align?: OverlayAlign;
  sideOffset?: number;
};

const ContextMenuSubContent = forwardRef<
  BridgeViewRef,
  ContextMenuSubContentProps
>(
  (
    {
      className,
      side = "right",
      align = "start",
      sideOffset = 4,
      children,
      onKeyDown,
      ...props
    },
    ref,
  ) => {
    const sub = useContextMenuSubContext("ContextMenuSubContent");

    const nav = useMenuNav();
    const handleKeyDown = (event: BridgeKeyEvent) => {
      if (event.key === "ArrowLeft") {
        event.preventDefault();
        event.stopPropagation?.();
        sub.setOpen(false);
        sub.triggerRef.current?.focus?.();
        return;
      }
      nav.handleKeyDown(event);
      onKeyDown?.(event);
    };
    return (

      <AnchoredOverlay
        visible={sub.open}
        onClose={() => sub.setOpen(false)}
        anchorRef={sub.triggerRef}

        triggerRef={sub.triggerRef}
        placement={side}
        align={align}
        offset={sideOffset}

        focusOnOpen={sub.entry !== "pointer"}
        className="z-50"
        accessibilityRole="menu"
      >
        <MenuNavContext.Provider value={nav}>
          <View
            ref={ref}
            nativeID={`${sub.baseId}-context-menu-sub-content`}
            focusable
            onKeyDown={handleKeyDown}

            onHoverIn={() => sub.cancelClose()}
            onHoverOut={() => sub.scheduleClose()}
            className={cn(CARD_CLASSES, "web:shadow-lg", className)}
            {...props}
          >
            {children}
          </View>
        </MenuNavContext.Provider>
      </AnchoredOverlay>
    );
  },
);
ContextMenuSubContent.displayName = "ContextMenuSubContent";

export {
  ContextMenu,
  ContextMenuTrigger,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuCheckboxItem,
  ContextMenuRadioItem,
  ContextMenuLabel,
  ContextMenuSeparator,
  ContextMenuShortcut,
  ContextMenuGroup,
  ContextMenuPortal,
  ContextMenuSub,
  ContextMenuSubContent,
  ContextMenuSubTrigger,
  ContextMenuRadioGroup,
};
