import {
  Children,
  createContext,
  forwardRef,
  useCallback,
  useContext,
  useId,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import {
  Platform,
  Text,
  View,
  type BridgePressableRef,
  type BridgeTextRef,
  type BridgeViewRef,
  type PressableProps,
  type ViewProps,
} from "@unikit-bridge/ui/primitives";

import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
  type DropdownMenuCheckboxItemProps,
  type DropdownMenuContentProps,
  type DropdownMenuGroupProps,
  type DropdownMenuItemProps,
  type DropdownMenuLabelProps,
  type DropdownMenuRadioGroupProps,
  type DropdownMenuRadioItemProps,
  type DropdownMenuSeparatorProps,
  type DropdownMenuShortcutProps,
  type DropdownMenuSubContentProps,
  type DropdownMenuSubProps,
  type DropdownMenuSubTriggerProps,
} from "./dropdown-menu";
import { cn } from "../lib/utils";

type MenubarContextValue = {

  value: string | null;
  setValue: (value: string | null) => void;
};

const MenubarContext = createContext<MenubarContextValue | null>(null);

function useMenubarContext(component: string): MenubarContextValue {
  const ctx = useContext(MenubarContext);
  if (!ctx) {
    throw new Error(`<${component}>는 <Menubar> 안에서 사용해야 합니다.`);
  }
  return ctx;
}

const MenubarMenuContext = createContext<{
  isOpen: boolean;

  hoverActivate: () => void;
}>({
  isOpen: false,
  hoverActivate: () => {},
});

export type MenubarProps = ViewProps & {

  value?: string | null;
  defaultValue?: string | null;
  onValueChange?: (value: string | null) => void;
};

const Menubar = forwardRef<BridgeViewRef, MenubarProps>(
  (
    { value, defaultValue = null, onValueChange, className, children, ...props },
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
    const contextValue = useMemo<MenubarContextValue>(
      () => ({ value: current, setValue }),
      [current, setValue],
    );
    return (
      <MenubarContext.Provider value={contextValue}>
        <View
          ref={ref}
          accessibilityRole="menubar"
          className={cn(
            "h-9 flex-row items-center gap-1 rounded-md border border-border bg-background p-1",
            className,
          )}
          {...props}
        >
          {children}
        </View>
      </MenubarContext.Provider>
    );
  },
);
Menubar.displayName = "Menubar";

export type MenubarMenuProps = {

  value?: string;
  children?: ReactNode;
};

function MenubarMenu({ value, children }: MenubarMenuProps) {
  const menubar = useMenubarContext("MenubarMenu");
  const fallbackId = useId();
  const menuValue = value ?? fallbackId;
  const isOpen = menubar.value === menuValue;

  const hoverActivate = useCallback(() => {
    if (menubar.value !== null) menubar.setValue(menuValue);
  }, [menubar, menuValue]);
  const menuContextValue = useMemo(
    () => ({ isOpen, hoverActivate }),
    [isOpen, hoverActivate],
  );
  const handleOpenChange = useCallback(
    (open: boolean) => menubar.setValue(open ? menuValue : null),
    [menubar, menuValue],
  );
  return (
    <MenubarMenuContext.Provider value={menuContextValue}>

      <DropdownMenu open={isOpen} onOpenChange={handleOpenChange}>
        {children}
      </DropdownMenu>
    </MenubarMenuContext.Provider>
  );
}

export type MenubarPortalProps = { children?: ReactNode };

function MenubarPortal({ children }: MenubarPortalProps) {
  return <>{children}</>;
}

export type MenubarTriggerProps = PressableProps;

const MenubarTrigger = forwardRef<BridgePressableRef, MenubarTriggerProps>(
  ({ className, children, onHoverIn, onFocus, onBlur, ...props }, ref) => {
    const menu = useContext(MenubarMenuContext);

    const [focused, setFocused] = useState(false);
    const nativeFocused = focused && Platform.OS !== "web";
    return (
      <DropdownMenuTrigger
        ref={ref}

        onHoverIn={() => {
          menu.hoverActivate();
          onHoverIn?.();
        }}
        onFocus={() => {
          setFocused(true);
          onFocus?.();
        }}
        onBlur={() => {
          setFocused(false);
          onBlur?.();
        }}
        className={cn(
          "items-center rounded-sm px-2 py-1 active:bg-accent web:hover:bg-accent web:focus-visible:bg-accent",

          menu.isOpen && "bg-accent",
          nativeFocused && "bg-accent",
          className,
        )}
        {...props}
      >
        {

                                       }
        {Children.map(children, (child) =>
          typeof child === "string" || typeof child === "number" ? (
            <Text
              className={cn(
                "font-sans text-sm font-medium text-foreground active:text-accent-foreground web:hover:text-accent-foreground",

                menu.isOpen && "text-accent-foreground",
                nativeFocused && "text-accent-foreground",
              )}
            >
              {child}
            </Text>
          ) : (
            child
          ),
        )}
      </DropdownMenuTrigger>
    );
  },
);
MenubarTrigger.displayName = "MenubarTrigger";

export type MenubarContentProps = DropdownMenuContentProps;

const MenubarContent = forwardRef<BridgeViewRef, MenubarContentProps>(
  ({ className, side = "bottom", align = "start", sideOffset = 8, ...props }, ref) => (

    <DropdownMenuContent
      ref={ref}
      side={side}
      align={align}
      sideOffset={sideOffset}
      className={cn("min-w-48", className)}
      {...props}
    />
  ),
);
MenubarContent.displayName = "MenubarContent";

export type MenubarGroupProps = DropdownMenuGroupProps;

const MenubarGroup = forwardRef<BridgeViewRef, MenubarGroupProps>(
  (props, ref) => <DropdownMenuGroup ref={ref} {...props} />,
);
MenubarGroup.displayName = "MenubarGroup";

export type MenubarItemProps = DropdownMenuItemProps;

const MenubarItem = forwardRef<BridgePressableRef, MenubarItemProps>(
  (props, ref) => <DropdownMenuItem ref={ref} {...props} />,
);
MenubarItem.displayName = "MenubarItem";

export type MenubarCheckboxItemProps = DropdownMenuCheckboxItemProps;

const MenubarCheckboxItem = forwardRef<
  BridgePressableRef,
  MenubarCheckboxItemProps
>((props, ref) => <DropdownMenuCheckboxItem ref={ref} {...props} />);
MenubarCheckboxItem.displayName = "MenubarCheckboxItem";

export type MenubarRadioGroupProps = DropdownMenuRadioGroupProps;

const MenubarRadioGroup = forwardRef<BridgeViewRef, MenubarRadioGroupProps>(
  (props, ref) => <DropdownMenuRadioGroup ref={ref} {...props} />,
);
MenubarRadioGroup.displayName = "MenubarRadioGroup";

export type MenubarRadioItemProps = DropdownMenuRadioItemProps;

const MenubarRadioItem = forwardRef<BridgePressableRef, MenubarRadioItemProps>(
  (props, ref) => <DropdownMenuRadioItem ref={ref} {...props} />,
);
MenubarRadioItem.displayName = "MenubarRadioItem";

export type MenubarLabelProps = DropdownMenuLabelProps;

const MenubarLabel = forwardRef<BridgeViewRef, MenubarLabelProps>(
  (props, ref) => (

    <DropdownMenuLabel ref={ref} {...props} />
  ),
);
MenubarLabel.displayName = "MenubarLabel";

export type MenubarSeparatorProps = DropdownMenuSeparatorProps;

const MenubarSeparator = forwardRef<BridgeViewRef, MenubarSeparatorProps>(
  (props, ref) => <DropdownMenuSeparator ref={ref} {...props} />,
);
MenubarSeparator.displayName = "MenubarSeparator";

export type MenubarShortcutProps = DropdownMenuShortcutProps;

const MenubarShortcut = forwardRef<BridgeTextRef, MenubarShortcutProps>(
  (props, ref) => <DropdownMenuShortcut ref={ref} {...props} />,
);
MenubarShortcut.displayName = "MenubarShortcut";

export type MenubarSubProps = DropdownMenuSubProps;

function MenubarSub(props: MenubarSubProps) {
  return <DropdownMenuSub {...props} />;
}

export type MenubarSubTriggerProps = DropdownMenuSubTriggerProps;

const MenubarSubTrigger = forwardRef<
  BridgePressableRef,
  MenubarSubTriggerProps
>((props, ref) => <DropdownMenuSubTrigger ref={ref} {...props} />);
MenubarSubTrigger.displayName = "MenubarSubTrigger";

export type MenubarSubContentProps = DropdownMenuSubContentProps;

const MenubarSubContent = forwardRef<BridgeViewRef, MenubarSubContentProps>(
  (props, ref) => <DropdownMenuSubContent ref={ref} {...props} />,
);
MenubarSubContent.displayName = "MenubarSubContent";

export {
  Menubar,
  MenubarPortal,
  MenubarMenu,
  MenubarTrigger,
  MenubarContent,
  MenubarGroup,
  MenubarSeparator,
  MenubarLabel,
  MenubarItem,
  MenubarShortcut,
  MenubarCheckboxItem,
  MenubarRadioGroup,
  MenubarRadioItem,
  MenubarSub,
  MenubarSubTrigger,
  MenubarSubContent,
};
