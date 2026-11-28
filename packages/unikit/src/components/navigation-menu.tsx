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
  ChevronDownIcon,
  Pressable,
  Text,
  View,
  type BridgePressableRef,
  type BridgeViewRef,
  type PressableProps,
  type ViewProps,
} from "@unikit-bridge/ui/primitives";
import { cva } from "class-variance-authority";

import { AnchoredOverlay } from "../lib/overlay";
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

type NavigationMenuContextValue = {
  value: string | null;
  setValue: (next: string | null) => void;

  hoverOpen: (itemValue: string) => void;

  hoverHold: () => void;

  hoverLeave: () => void;
};

const NavigationMenuContext = createContext<NavigationMenuContextValue | null>(
  null,
);

function useNavigationMenuContext(
  component: string,
): NavigationMenuContextValue {
  const ctx = useContext(NavigationMenuContext);
  if (!ctx) {
    throw new Error(`<${component}>는 <NavigationMenu> 안에서 사용해야 합니다.`);
  }
  return ctx;
}

type NavigationMenuItemContextValue = {
  itemValue: string;

  triggerRef: PressableRefObject;

  contentId: string;
};

const NavigationMenuItemContext =
  createContext<NavigationMenuItemContextValue | null>(null);

function useNavigationMenuItemContext(
  component: string,
): NavigationMenuItemContextValue {
  const ctx = useContext(NavigationMenuItemContext);
  if (!ctx) {
    throw new Error(
      `<${component}>는 <NavigationMenuItem> 안에서 사용해야 합니다.`,
    );
  }
  return ctx;
}

const NAV_HOVER_DELAY = 200;
const NAV_SKIP_DELAY = 300;

export type NavigationMenuProps = ViewProps & {

  value?: string | null;
  defaultValue?: string | null;
  onValueChange?: (value: string | null) => void;

  viewport?: boolean;
};

const NavigationMenu = forwardRef<BridgeViewRef, NavigationMenuProps>(
  (
    {
      value,
      defaultValue = null,
      onValueChange,
      viewport = true,
      className,
      children,
      ...props
    },
    ref,
  ) => {

    const [internalValue, setInternalValue] = useState(defaultValue);
    const current = value !== undefined ? value : internalValue;
    const stateRef = useRef({ value, current, onValueChange });
    stateRef.current = { value, current, onValueChange };
    const setValue = useCallback((next: string | null) => {
      const state = stateRef.current;
      if (state.value === undefined) setInternalValue(next);
      if (next !== state.current) state.onValueChange?.(next);
    }, []);

    const prevValueRef = useRef<string | null>(current);
    const skipUntilRef = useRef(0);
    useEffect(() => {
      if (prevValueRef.current !== null && current === null) {
        skipUntilRef.current = Date.now() + NAV_SKIP_DELAY;
      }
      prevValueRef.current = current;
    }, [current]);
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
    const hoverOpen = useCallback(
      (itemValue: string) => {
        clearCloseTimer();
        clearOpenTimer();
        const active = stateRef.current.current;

        if (active !== null) {
          if (active !== itemValue) setValue(itemValue);
          return;
        }

        if (Date.now() < skipUntilRef.current) {
          setValue(itemValue);
          return;
        }
        openTimerRef.current = setTimeout(() => {
          openTimerRef.current = null;

          if (stateRef.current.current === null) setValue(itemValue);
        }, NAV_HOVER_DELAY);
      },
      [clearCloseTimer, clearOpenTimer, setValue],
    );

    const hoverHold = clearCloseTimer;

    const hoverLeave = useCallback(() => {
      clearOpenTimer();
      clearCloseTimer();
      if (stateRef.current.current === null) return;
      closeTimerRef.current = setTimeout(() => {
        closeTimerRef.current = null;
        setValue(null);
      }, NAV_HOVER_DELAY);
    }, [clearOpenTimer, clearCloseTimer, setValue]);
    const contextValue = useMemo<NavigationMenuContextValue>(
      () => ({ value: current, setValue, hoverOpen, hoverHold, hoverLeave }),
      [current, setValue, hoverOpen, hoverHold, hoverLeave],
    );
    return (
      <NavigationMenuContext.Provider value={contextValue}>

        <View
          ref={ref}
          className={cn(
            "relative flex-row max-w-max flex-1 items-center justify-center",
            className,
          )}
          {...props}
        >
          {children}
          {viewport ? <NavigationMenuViewport /> : null}
        </View>
      </NavigationMenuContext.Provider>
    );
  },
);
NavigationMenu.displayName = "NavigationMenu";

export type NavigationMenuListProps = ViewProps;

const NavigationMenuList = forwardRef<BridgeViewRef, NavigationMenuListProps>(
  ({ className, ...props }, ref) => (
    <View
      ref={ref}
      className={cn(
        "flex-row flex-1 items-center justify-center gap-1",
        className,
      )}
      {...props}
    />
  ),
);
NavigationMenuList.displayName = "NavigationMenuList";

export type NavigationMenuItemProps = ViewProps & {

  value?: string;
};

const NavigationMenuItem = forwardRef<BridgeViewRef, NavigationMenuItemProps>(
  ({ value, className, children, ...props }, ref) => {
    const id = useId();
    const triggerRef = useRef<BridgePressableRef | null>(null);
    const itemValue = value ?? id;
    const itemContextValue = useMemo<NavigationMenuItemContextValue>(
      () => ({
        itemValue,
        triggerRef,
        contentId: `${id}-navigation-menu-content`,
      }),
      [itemValue, id],
    );
    return (
      <NavigationMenuItemContext.Provider value={itemContextValue}>
        <View ref={ref} className={cn("relative", className)} {...props}>
          {children}
        </View>
      </NavigationMenuItemContext.Provider>
    );
  },
);
NavigationMenuItem.displayName = "NavigationMenuItem";

const navigationMenuTriggerStyle = cva(
  "flex h-9 w-max flex-row items-center justify-center rounded-md bg-background px-4 py-2 active:bg-accent web:hover:bg-accent web:focus-visible:bg-accent web:focus-visible:outline-1 web:focus-visible:ring-3 web:focus-visible:ring-ring/50 web:outline-none web:transition-colors",
);

export type NavigationMenuTriggerProps = PressableProps;

const NavigationMenuTrigger = forwardRef<
  BridgePressableRef,
  NavigationMenuTriggerProps
>(
  (
    { className, children, disabled, onPress, onHoverIn, onHoverOut, ...props },
    ref,
  ) => {
    const nav = useNavigationMenuContext("NavigationMenuTrigger");
    const item = useNavigationMenuItemContext("NavigationMenuTrigger");
    const isOpen = nav.value === item.itemValue;
    return (
      <Pressable
        ref={composeRefs(ref, item.triggerRef)}
        accessibilityRole="button"
        aria-expanded={isOpen}
        aria-controls={item.contentId}
        disabled={disabled}

        onHoverIn={() => {
          nav.hoverOpen(item.itemValue);
          onHoverIn?.();
        }}
        onHoverOut={() => {
          nav.hoverLeave();
          onHoverOut?.();
        }}
        onPress={() => {
          nav.setValue(isOpen ? null : item.itemValue);
          onPress?.();
        }}
        className={cn(
          navigationMenuTriggerStyle(),

          isOpen && "bg-accent/50",
          disabled && "web:pointer-events-none opacity-50",
          className,
        )}
        {...props}
      >
        {wrapTextChildren(children, "font-sans text-sm font-medium text-foreground")}
        <ChevronDownIcon
          className={cn(
            "ml-1 size-3 text-muted-foreground web:transition-transform web:duration-300",
            isOpen && "web:rotate-180",
          )}
        />
      </Pressable>
    );
  },
);
NavigationMenuTrigger.displayName = "NavigationMenuTrigger";

export type NavigationMenuContentProps = ViewProps;

const NavigationMenuContent = forwardRef<
  BridgeViewRef,
  NavigationMenuContentProps
>(({ className, children, nativeID, ...props }, ref) => {
  const nav = useNavigationMenuContext("NavigationMenuContent");
  const item = useNavigationMenuItemContext("NavigationMenuContent");
  const isOpen = nav.value === item.itemValue;
  return (

    <AnchoredOverlay
      visible={isOpen}
      onClose={() => nav.setValue(null)}
      anchorRef={item.triggerRef}
      placement="bottom"
      align="start"
      offset={6}
      triggerRef={item.triggerRef}

      focusOnOpen={false}
      className="z-50"
    >
      <View
        ref={ref}
        nativeID={nativeID ?? item.contentId}

        onHoverIn={() => nav.hoverHold()}
        onHoverOut={() => nav.hoverLeave()}
        className={cn(
          "pointer-events-auto rounded-md border border-border bg-popover p-2 pr-2.5 text-popover-foreground unikit-popover-in web:shadow-md",
          className,
        )}
        {...props}
      >
        {children}
      </View>
    </AnchoredOverlay>
  );
});
NavigationMenuContent.displayName = "NavigationMenuContent";

export type NavigationMenuLinkProps = PressableProps & {

  active?: boolean;
};

const NavigationMenuLink = forwardRef<
  BridgePressableRef,
  NavigationMenuLinkProps
>(({ className, active, disabled, onPress, children, ...props }, ref) => {
  const nav = useNavigationMenuContext("NavigationMenuLink");
  return (
    <Pressable
      ref={ref}
      accessibilityRole="link"
      disabled={disabled}
      onPress={() => {

        nav.setValue(null);
        onPress?.();
      }}
      className={cn(
        "flex flex-col gap-1 rounded-sm p-2 active:bg-accent web:hover:bg-accent web:focus-visible:bg-accent web:focus-visible:outline-1 web:focus-visible:ring-3 web:focus-visible:ring-ring/50 web:transition-colors",
        active &&
          "bg-accent/50 active:bg-accent web:hover:bg-accent web:focus-visible:bg-accent",
        disabled && "web:pointer-events-none opacity-50",
        className,
      )}
      {...props}
    >
      {wrapTextChildren(children, "font-sans text-sm text-foreground")}
    </Pressable>
  );
});
NavigationMenuLink.displayName = "NavigationMenuLink";

export type NavigationMenuIndicatorProps = ViewProps;

const NavigationMenuIndicator = forwardRef<
  BridgeViewRef,
  NavigationMenuIndicatorProps
>(() => null);
NavigationMenuIndicator.displayName = "NavigationMenuIndicator";

export type NavigationMenuViewportProps = ViewProps;

const NavigationMenuViewport = forwardRef<
  BridgeViewRef,
  NavigationMenuViewportProps
>(() => null);
NavigationMenuViewport.displayName = "NavigationMenuViewport";

export {
  NavigationMenu,
  NavigationMenuList,
  NavigationMenuItem,
  NavigationMenuContent,
  NavigationMenuTrigger,
  NavigationMenuLink,
  NavigationMenuIndicator,
  NavigationMenuViewport,
  navigationMenuTriggerStyle,
};
