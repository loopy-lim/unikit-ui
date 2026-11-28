import * as React from "react";
import {
  PanelLeftIcon,
  Pressable,
  ScrollView,
  Slot,
  Text,
  View,
  type BridgePressableRef,
  type BridgeScrollViewRef,
  type BridgeTextRef,
  type BridgeViewRef,
  type PressableProps,
  type ScrollViewProps,
  type TextProps,
  type TextInputProps,
  type ViewProps,
  type BridgeTextInputRef,
} from "@unikit-bridge/ui/primitives";
import { cva, type VariantProps } from "class-variance-authority";

import { Button } from "./button";
import { Input } from "./input";
import { Separator } from "./separator";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "./sheet";
import { Skeleton } from "./skeleton";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "./tooltip";
import { cn } from "../lib/utils";

const SIDEBAR_WIDTH = "w-64";
const SIDEBAR_WIDTH_MOBILE = "w-72";
const SIDEBAR_WIDTH_ICON = "w-12";
const SIDEBAR_WIDTH_ICON_PADDED = "w-14";
const SIDEBAR_KEYBOARD_SHORTCUT = "b";

type SidebarContextProps = {
  state: "expanded" | "collapsed";
  open: boolean;
  setOpen: (open: boolean) => void;
  openMobile: boolean;
  setOpenMobile: (open: boolean) => void;
  isMobile: boolean;
  toggleSidebar: () => void;

  variant: "sidebar" | "floating" | "inset";
  collapsible: "offcanvas" | "icon" | "none";
  side: "left" | "right";
};

const SidebarContext = React.createContext<SidebarContextProps | null>(null);

export function useSidebar(): SidebarContextProps {
  const context = React.useContext(SidebarContext);
  if (!context) {
    throw new Error("useSidebar는 <SidebarProvider> 안에서 사용해야 합니다.");
  }
  return context;
}

function serializableChildren(
  children: React.ReactNode,
  textClassName: string,
): React.ReactNode {
  if (typeof children === "string" || typeof children === "number") {
    return <Text className={textClassName}>{children}</Text>;
  }
  return children;
}

export type SidebarProviderProps = ViewProps & {
  defaultOpen?: boolean;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;

  isMobile?: boolean;
};

const SidebarProvider = React.forwardRef<
  BridgeViewRef,
  SidebarProviderProps
>(
  (
    {
      defaultOpen = true,
      open: openProp,
      onOpenChange: setOpenProp,
      isMobile = false,
      className,
      children,
      ...props
    },
    ref,
  ) => {
    const [openMobile, setOpenMobile] = React.useState(false);

    const [_open, _setOpen] = React.useState(defaultOpen);
    const open = openProp ?? _open;
    const setOpen = React.useCallback(
      (value: boolean | ((value: boolean) => boolean)) => {
        const openState = typeof value === "function" ? value(open) : value;
        if (setOpenProp) {
          setOpenProp(openState);
        } else {
          _setOpen(openState);
        }
      },
      [setOpenProp, open],
    );

    const toggleSidebar = React.useCallback(() => {
      return isMobile
        ? setOpenMobile((open) => !open)
        : setOpen((open) => !open);
    }, [isMobile, setOpen]);

    React.useEffect(() => {
      if (typeof window?.addEventListener !== "function") return;
      const handleKeyDown = (event: Event) => {
        const keyboardEvent = event as {
          key?: string;
          metaKey?: boolean;
          ctrlKey?: boolean;
          preventDefault?: () => void;
        };
        if (
          keyboardEvent.key === SIDEBAR_KEYBOARD_SHORTCUT &&
          (keyboardEvent.metaKey || keyboardEvent.ctrlKey)
        ) {
          keyboardEvent.preventDefault?.();
          toggleSidebar();
        }
      };
      window.addEventListener("keydown", handleKeyDown);
      return () => window.removeEventListener("keydown", handleKeyDown);
    }, [toggleSidebar]);

    const state = open ? "expanded" : "collapsed";

    const contextValue = React.useMemo<SidebarContextProps>(
      () => ({
        state,
        open,
        setOpen,
        isMobile,
        openMobile,
        setOpenMobile,
        toggleSidebar,

        variant: "sidebar",
        collapsible: "offcanvas",
        side: "left",
      }),
      [state, open, setOpen, isMobile, openMobile, toggleSidebar],
    );

    return (
      <SidebarContext.Provider value={contextValue}>
        <TooltipProvider delayDuration={0}>
          <View
            ref={ref}
            className={cn("w-full flex-row web:min-h-svh", className)}
            {...props}
          >
            {children}
          </View>
        </TooltipProvider>
      </SidebarContext.Provider>
    );
  },
);
SidebarProvider.displayName = "SidebarProvider";

export type SidebarProps = ViewProps & {
  side?: "left" | "right";
  variant?: "sidebar" | "floating" | "inset";
  collapsible?: "offcanvas" | "icon" | "none";
};

const Sidebar = React.forwardRef<BridgeViewRef, SidebarProps>(
  (
    {
      side = "left",
      variant = "sidebar",
      collapsible = "offcanvas",
      className,
      children,
      ...props
    },
    ref,
  ) => {
    const sidebar = useSidebar();
    const { isMobile, state, openMobile, setOpenMobile } = sidebar;

    const collapsed = state === "collapsed";
    const iconCollapsed = collapsed && collapsible === "icon";

    const contextValue = React.useMemo<SidebarContextProps>(
      () => ({ ...sidebar, variant, collapsible, side }),
      [sidebar, variant, collapsible, side],
    );

    if (collapsible === "none") {
      return (
        <SidebarContext.Provider value={contextValue}>
          <View
            ref={ref}
            className={cn(

              "web:sticky web:top-0 web:h-svh flex-col bg-background text-foreground",
              SIDEBAR_WIDTH,
              className,
            )}
            {...props}
          >
            {children}
          </View>
        </SidebarContext.Provider>
      );
    }

    if (isMobile) {
      return (
        <SidebarContext.Provider value={contextValue}>
          <Sheet open={openMobile} onOpenChange={setOpenMobile}>
            <SheetContent
              side={side}
              showCloseButton={false}
              className={cn(
                "gap-0 bg-background p-0 text-foreground",
                SIDEBAR_WIDTH_MOBILE,
                className,
              )}
            >

              <SheetHeader className="absolute inset-0 gap-0 p-0 opacity-0">
                <SheetTitle>Sidebar</SheetTitle>
                <SheetDescription>
                  모바일 사이드바를 표시합니다.
                </SheetDescription>
              </SheetHeader>
              <View className="h-full w-full flex-col">{children}</View>
            </SheetContent>
          </Sheet>
        </SidebarContext.Provider>
      );
    }

    const widthClass = collapsed
      ? collapsible === "icon"
        ? variant === "sidebar"
          ? SIDEBAR_WIDTH_ICON
          : SIDEBAR_WIDTH_ICON_PADDED
        : "w-0"
      : SIDEBAR_WIDTH;

    const inner = (
      <View className="h-full w-full flex-col bg-background text-foreground">
        {children}
      </View>
    );

    return (
      <SidebarContext.Provider value={contextValue}>
        <View
          ref={ref}
          className={cn(

            "relative web:sticky web:top-0 web:h-svh overflow-hidden",
            widthClass,
            variant === "sidebar" &&
              !collapsed &&
              (side === "left" ? "border-r" : "border-l"),
            variant === "floating" || variant === "inset" ? "p-2" : "",
            className,
          )}
          {...props}
        >
          {variant === "floating" ? (
            <View className="h-full w-full flex-col rounded-lg border bg-background text-foreground shadow-sm">
              {children}
            </View>
          ) : (
            inner
          )}
        </View>
      </SidebarContext.Provider>
    );
  },
);
Sidebar.displayName = "Sidebar";

export type SidebarTriggerProps = PressableProps;

const SidebarTrigger = React.forwardRef<
  BridgePressableRef,
  SidebarTriggerProps
>(({ className, onPress, ...props }, ref) => {
  const { toggleSidebar } = useSidebar();
  return (
    <Button
      ref={ref}
      variant="ghost"
      size="icon"
      accessibilityLabel="Toggle Sidebar"
      className={cn("size-7", className)}
      onPress={() => {
        onPress?.();
        toggleSidebar();
      }}
      {...props}
    >
      <PanelLeftIcon className="size-4" />
    </Button>
  );
});
SidebarTrigger.displayName = "SidebarTrigger";

export type SidebarRailProps = PressableProps;

const SidebarRail = React.forwardRef<BridgePressableRef, SidebarRailProps>(
  ({ className, onPress, ...props }, ref) => {
    const { toggleSidebar, isMobile, side } = useSidebar();

    if (isMobile) return null;
    return (
      <Pressable
        ref={ref}
        accessibilityLabel="Toggle Sidebar"
        onPress={() => {
          onPress?.();
          toggleSidebar();
        }}
        className={cn(

          "absolute inset-y-0 z-20 w-4 -translate-x-1/2",
          side === "left" ? "-right-4" : "left-0",
          className,
        )}
        {...props}
      />
    );
  },
);
SidebarRail.displayName = "SidebarRail";

export type SidebarInsetProps = ViewProps;

const SidebarInset = React.forwardRef<BridgeViewRef, SidebarInsetProps>(
  ({ className, ...props }, ref) => {

    const { variant, state } = useSidebar();
    const inset = variant === "inset";
    return (
      <View
        ref={ref}
        className={cn(
          "relative flex w-full flex-1 flex-col bg-background",
          inset && "m-2 ml-0 rounded-xl shadow-sm",
          inset && state === "collapsed" && "ml-2",
          className,
        )}
        {...props}
      />
    );
  },
);
SidebarInset.displayName = "SidebarInset";

export type SidebarInputProps = TextInputProps;

const SidebarInput = React.forwardRef<BridgeTextInputRef, SidebarInputProps>(
  ({ className, ...props }, ref) => (
    <Input
      ref={ref}
      className={cn("h-8 w-full bg-background shadow-none", className)}
      {...props}
    />
  ),
);
SidebarInput.displayName = "SidebarInput";

export type SidebarHeaderProps = ViewProps;

const SidebarHeader = React.forwardRef<BridgeViewRef, SidebarHeaderProps>(
  ({ className, ...props }, ref) => (
    <View ref={ref} className={cn("flex-col gap-2 p-2", className)} {...props} />
  ),
);
SidebarHeader.displayName = "SidebarHeader";

export type SidebarFooterProps = ViewProps;

const SidebarFooter = React.forwardRef<BridgeViewRef, SidebarFooterProps>(
  ({ className, ...props }, ref) => (
    <View ref={ref} className={cn("flex-col gap-2 p-2", className)} {...props} />
  ),
);
SidebarFooter.displayName = "SidebarFooter";

export type SidebarSeparatorProps = ViewProps;

const SidebarSeparator = React.forwardRef<BridgeViewRef, SidebarSeparatorProps>(
  ({ className, ...props }, ref) => (
    <Separator
      ref={ref}
      className={cn("mx-2 w-auto bg-border", className)}
      {...props}
    />
  ),
);
SidebarSeparator.displayName = "SidebarSeparator";

export type SidebarContentProps = ScrollViewProps;

const SidebarContent = React.forwardRef<
  BridgeScrollViewRef,
  SidebarContentProps
>(({ className, ...props }, ref) => {
  const { state, collapsible } = useSidebar();
  const iconCollapsed = state === "collapsed" && collapsible === "icon";
  return (
    <ScrollView
      ref={ref}
      contentContainerClassName="flex-col gap-2"
      className={cn(
        "min-h-0 flex-1",
        iconCollapsed && "overflow-hidden",
        className,
      )}
      {...props}
    />
  );
});
SidebarContent.displayName = "SidebarContent";

export type SidebarGroupProps = ViewProps;

const SidebarGroup = React.forwardRef<BridgeViewRef, SidebarGroupProps>(
  ({ className, ...props }, ref) => (
    <View
      ref={ref}
      className={cn("relative w-full min-w-0 flex-col p-2", className)}
      {...props}
    />
  ),
);
SidebarGroup.displayName = "SidebarGroup";

export type SidebarGroupLabelProps = TextProps & {

  asChild?: boolean;
};

const SidebarGroupLabel = React.forwardRef<
  BridgeTextRef,
  SidebarGroupLabelProps
>(({ asChild = false, className, children, ...props }, ref) => {
  const { state, collapsible } = useSidebar();
  const iconCollapsed = state === "collapsed" && collapsible === "icon";
  const layoutClasses = cn(
    "h-8 shrink-0 flex-row items-center rounded-md px-2",
    "web:focus-visible:ring-2 web:focus-visible:ring-ring",
    iconCollapsed && "-mt-8 opacity-0",
    className,
  );
  if (asChild) {

    return (
      <Slot
        ref={ref}
        className={cn(
          layoutClasses,
          "font-sans text-xs font-medium text-foreground/70",
        )}
        {...props}
      >
        {children}
      </Slot>
    );
  }
  return (
    <View className={layoutClasses}>
      <Text
        ref={ref}
        className="font-sans text-xs font-medium text-foreground/70"
        {...props}
      >
        {children}
      </Text>
    </View>
  );
});
SidebarGroupLabel.displayName = "SidebarGroupLabel";

export type SidebarGroupActionProps = PressableProps & {

  asChild?: boolean;
};

const SidebarGroupAction = React.forwardRef<
  BridgePressableRef,
  SidebarGroupActionProps
>(({ asChild = false, className, children, onPress, ...props }, ref) => {
  const { state, collapsible } = useSidebar();
  const iconCollapsed = state === "collapsed" && collapsible === "icon";

  if (iconCollapsed) return null;
  const classes = cn(
    "absolute top-3.5 right-3 aspect-square w-5 items-center justify-center rounded-md p-0",
    "web:focus-visible:ring-2 web:focus-visible:ring-ring active:bg-accent",
    className,
  );
  if (asChild) {
    return (
      <Slot
        ref={ref}
        accessibilityRole="button"

        hitSlop={8}
        className={classes}
        onPress={onPress}
        {...props}
      >
        {children}
      </Slot>
    );
  }
  return (
    <Pressable
      ref={ref}
      accessibilityRole="button"

      hitSlop={8}
      className={classes}
      onPress={onPress}
      {...props}
    >
      {serializableChildren(
        children,
        "font-sans text-sm text-foreground active:text-accent-foreground",
      )}
    </Pressable>
  );
});
SidebarGroupAction.displayName = "SidebarGroupAction";

export type SidebarGroupContentProps = ViewProps;

const SidebarGroupContent = React.forwardRef<
  BridgeViewRef,
  SidebarGroupContentProps
>(({ className, ...props }, ref) => (
  <View ref={ref} className={cn("w-full", className)} {...props} />
));
SidebarGroupContent.displayName = "SidebarGroupContent";

export type SidebarMenuProps = ViewProps;

const SidebarMenu = React.forwardRef<BridgeViewRef, SidebarMenuProps>(
  ({ className, ...props }, ref) => (
    <View
      ref={ref}
      accessibilityRole="list"
      className={cn("w-full min-w-0 flex-col gap-1", className)}
      {...props}
    />
  ),
);
SidebarMenu.displayName = "SidebarMenu";

export type SidebarMenuItemProps = ViewProps;

const SidebarMenuItem = React.forwardRef<BridgeViewRef, SidebarMenuItemProps>(
  ({ className, ...props }, ref) => (
    <View
      ref={ref}
      accessibilityRole="listitem"
      className={cn("relative", className)}
      {...props}
    />
  ),
);
SidebarMenuItem.displayName = "SidebarMenuItem";

const sidebarMenuButtonVariants = cva(

  "flex flex-row w-full items-center gap-2 overflow-hidden rounded-md p-2 text-left text-sm web:hover:bg-accent active:bg-accent web:hover:text-accent-foreground active:text-accent-foreground web:focus-visible:ring-2 web:focus-visible:ring-ring disabled:opacity-50 disabled:web:pointer-events-none",
  {
    variants: {
      variant: {
        default: "",

        outline: "border border-border bg-background web:hover:border-accent",
      },
      size: {
        default: "h-8 text-sm",
        sm: "h-7 text-xs",
        lg: "h-12 text-sm",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

export type SidebarMenuButtonProps = PressableProps & {
  isActive?: boolean;

  tooltip?: string | React.ComponentProps<typeof TooltipContent>;

  asChild?: boolean;
} & VariantProps<typeof sidebarMenuButtonVariants>;

const SidebarMenuButton = React.forwardRef<
  BridgePressableRef,
  SidebarMenuButtonProps
>(
  (
    {
      isActive = false,
      variant = "default",
      size = "default",
      tooltip,
      asChild = false,
      className,
      children,
      onPress,
      ...props
    },
    ref,
  ) => {
    const { state, collapsible, isMobile } = useSidebar();
    const iconCollapsed = state === "collapsed" && collapsible === "icon";

    const classes = cn(
      sidebarMenuButtonVariants({ variant, size }),
      isActive && "bg-accent font-medium",
      iconCollapsed && "size-8 p-2",
      className,
    );
    const content = serializableChildren(
      children,
      cn(

        "font-sans text-sm truncate web:hover:text-accent-foreground active:text-accent-foreground",
        isActive ? "text-accent-foreground" : "text-foreground",
      ),
    );

    if (asChild) {
      const button = (
        <Slot
          ref={ref}
          accessibilityRole="button"
          className={classes}
          onPress={onPress}
          {...props}
        >
          {children}
        </Slot>
      );

      if (!tooltip || !iconCollapsed || isMobile) {
        return button;
      }
      const tooltipOptions =
        typeof tooltip === "string" ? { children: tooltip } : tooltip;
      return (
        <Tooltip>
          {
                                            }
          <TooltipTrigger asChild>{button}</TooltipTrigger>
          <TooltipContent side="right" align="center" {...tooltipOptions} />
        </Tooltip>
      );
    }

    if (!tooltip || !iconCollapsed || isMobile) {
      return (
        <Pressable
          ref={ref}
          accessibilityRole="button"
          className={classes}
          onPress={onPress}
          {...props}
        >
          {content}
        </Pressable>
      );
    }

    const tooltipOptions =
      typeof tooltip === "string" ? { children: tooltip } : tooltip;

    return (
      <Tooltip>
        <TooltipTrigger
          ref={ref}
          accessibilityRole="button"
          className={classes}
          onPress={onPress}
          {...props}
        >
          {content}
        </TooltipTrigger>
        <TooltipContent side="right" align="center" {...tooltipOptions} />
      </Tooltip>
    );
  },
);
SidebarMenuButton.displayName = "SidebarMenuButton";

export type SidebarMenuActionProps = PressableProps & {

  showOnHover?: boolean;

  asChild?: boolean;
};

const SidebarMenuAction = React.forwardRef<
  BridgePressableRef,
  SidebarMenuActionProps
>(
  (
    { className, children, onPress, showOnHover: _showOnHover, asChild = false, ...props },
    ref,
  ) => {
    const { state, collapsible } = useSidebar();
    const iconCollapsed = state === "collapsed" && collapsible === "icon";
    if (iconCollapsed) return null;
    const classes = cn(
      "absolute top-1.5 right-1 aspect-square w-5 items-center justify-center rounded-md p-0",
      "web:focus-visible:ring-2 web:focus-visible:ring-ring active:bg-accent",
      className,
    );
    if (asChild) {
      return (
        <Slot
          ref={ref}
          accessibilityRole="button"
          hitSlop={8}
          className={classes}
          onPress={onPress}
          {...props}
        >
          {children}
        </Slot>
      );
    }
    return (
      <Pressable
        ref={ref}
        accessibilityRole="button"
        hitSlop={8}
        className={classes}
        onPress={onPress}
        {...props}
      >
        {serializableChildren(
          children,
          "font-sans text-sm text-foreground active:text-accent-foreground",
        )}
      </Pressable>
    );
  },
);
SidebarMenuAction.displayName = "SidebarMenuAction";

export type SidebarMenuBadgeProps = ViewProps;

const SidebarMenuBadge = React.forwardRef<
  BridgeViewRef,
  SidebarMenuBadgeProps
>(({ className, children, ...props }, ref) => {
  const { state, collapsible } = useSidebar();
  const iconCollapsed = state === "collapsed" && collapsible === "icon";
  if (iconCollapsed) return null;
  return (
    <View
      ref={ref}
      className={cn(
        "absolute top-1.5 right-1 h-5 min-w-5 flex-row items-center justify-center rounded-md px-1",
        "web:select-none web:tabular-nums",
        className,
      )}
      {...props}
    >
      {serializableChildren(children, "font-sans text-xs font-medium text-foreground")}
    </View>
  );
});
SidebarMenuBadge.displayName = "SidebarMenuBadge";

export type SidebarMenuSkeletonProps = ViewProps & {
  showIcon?: boolean;
};

const SidebarMenuSkeleton = React.forwardRef<
  BridgeViewRef,
  SidebarMenuSkeletonProps
>(({ className, showIcon = false, ...props }, ref) => {

  const width = React.useMemo(() => {
    return `${Math.floor(Math.random() * 40) + 50}%`;
  }, []);
  return (
    <View
      ref={ref}
      className={cn("h-8 flex-row items-center gap-2 rounded-md px-2", className)}
      {...props}
    >
      {showIcon && <Skeleton className="size-4 rounded-md" />}
      <Skeleton className="h-4 flex-1 rounded-md" style={{ maxWidth: width }} />
    </View>
  );
});
SidebarMenuSkeleton.displayName = "SidebarMenuSkeleton";

export type SidebarMenuSubProps = ViewProps;

const SidebarMenuSub = React.forwardRef<BridgeViewRef, SidebarMenuSubProps>(
  ({ className, ...props }, ref) => {
    const { state, collapsible } = useSidebar();
    const iconCollapsed = state === "collapsed" && collapsible === "icon";
    if (iconCollapsed) return null;
    return (
      <View
        ref={ref}
        accessibilityRole="list"
        className={cn(
          "mx-3.5 min-w-0 flex-col gap-1 border-l border-border px-2.5 py-0.5",
          className,
        )}
        {...props}
      />
    );
  },
);
SidebarMenuSub.displayName = "SidebarMenuSub";

export type SidebarMenuSubItemProps = ViewProps;

const SidebarMenuSubItem = React.forwardRef<
  BridgeViewRef,
  SidebarMenuSubItemProps
>(({ className, ...props }, ref) => (
  <View
    ref={ref}
    accessibilityRole="listitem"
    className={cn("relative", className)}
    {...props}
  />
));
SidebarMenuSubItem.displayName = "SidebarMenuSubItem";

export type SidebarMenuSubButtonProps = PressableProps & {
  size?: "sm" | "md";
  isActive?: boolean;

  asChild?: boolean;
};

const SidebarMenuSubButton = React.forwardRef<
  BridgePressableRef,
  SidebarMenuSubButtonProps
>(
  (
    { size = "md", isActive = false, asChild = false, className, children, onPress, ...props },
    ref,
  ) => {
    const { state, collapsible } = useSidebar();
    const iconCollapsed = state === "collapsed" && collapsible === "icon";
    if (iconCollapsed) return null;
    const classes = cn(

      "h-7 min-w-0 w-full flex-row items-center gap-2 overflow-hidden rounded-md px-2 web:hover:bg-accent active:bg-accent web:hover:text-accent-foreground active:text-accent-foreground",
      isActive && "bg-accent",
      className,
    );
    const textClasses = cn(
      "font-sans truncate web:hover:text-accent-foreground active:text-accent-foreground",
      size === "sm" ? "text-xs" : "text-sm",
      isActive ? "text-accent-foreground" : "text-foreground",
    );
    if (asChild) {

      return (
        <Slot
          ref={ref}

          accessibilityRole="link"
          className={cn(classes, textClasses)}
          onPress={onPress}
          {...props}
        >
          {children}
        </Slot>
      );
    }
    return (
      <Pressable
        ref={ref}

        accessibilityRole="link"
        className={classes}
        onPress={onPress}
        {...props}
      >
        {serializableChildren(children, textClasses)}
      </Pressable>
    );
  },
);
SidebarMenuSubButton.displayName = "SidebarMenuSubButton";

export {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupAction,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarInput,
  SidebarInset,
  SidebarMenu,
  SidebarMenuAction,
  SidebarMenuBadge,
  SidebarMenuButton,
  sidebarMenuButtonVariants,
  SidebarMenuItem,
  SidebarMenuSkeleton,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  SidebarProvider,
  SidebarRail,
  SidebarSeparator,
  SidebarTrigger,
};
