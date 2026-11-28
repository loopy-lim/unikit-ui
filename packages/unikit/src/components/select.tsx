import {
  Children,
  createContext,
  forwardRef,
  isValidElement,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import {
  CheckIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  Platform,
  Pressable,
  ScrollView,
  Select as BridgeSelect,
  SelectOption,
  Text,
  View,
  type BridgeKeyEvent,
  type BridgePressableRef,
  type BridgeTextRef,
  type BridgeSelectRef,
  type BridgeViewRef,
  type PressableProps,
  type TextProps,
  type ViewProps,
} from "@unikit-bridge/ui/primitives";
import { cva } from "class-variance-authority";

import { Popover, PopoverContent, PopoverTrigger } from "./popover";
import type { OverlayAlign, OverlayPlacement } from "../lib/overlay";
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

function textOfChildren(children: ReactNode): string | undefined {
  const parts = Children.toArray(children)
    .map((child) =>
      typeof child === "string" || typeof child === "number"
        ? String(child)
        : undefined,
    )
    .filter((part): part is string => part !== undefined);
  return parts.length > 0 ? parts.join("") : undefined;
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

function collectItemLabels(
  children: ReactNode,
  labels: Record<string, string>,
): void {
  Children.forEach(children, (child) => {
    if (!isValidElement(child)) return;
    const props = child.props as { value?: string; children?: ReactNode };
    if (child.type === SelectItem) {
      if (typeof props.value === "string") {
        const label = textOfChildren(props.children);

        labels[props.value] = label ?? props.value;
      }
      return;
    }
    if (child.type === SelectContent || child.type === SelectGroup) {
      collectItemLabels(props.children, labels);
    }
  });
}

type SelectContextValue = {
  open: boolean;
  setOpen: (open: boolean) => void;
  value: string;

  setValue: (value: string) => void;

  disabled: boolean;

  name?: string;

  required?: boolean;

  registerLabel: (value: string, label: string) => void;

  labelOf: (value: string) => string;
};

const SelectContext = createContext<SelectContextValue | null>(null);

function useSelectContext(component: string): SelectContextValue {
  const ctx = useContext(SelectContext);
  if (!ctx) {
    throw new Error(`<${component}>는 <Select> 안에서 사용해야 합니다.`);
  }
  return ctx;
}

export type SelectProps = ViewProps & {
  value?: string;
  defaultValue?: string;
  onValueChange?: (value: string) => void;
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;

  disabled?: boolean;

  name?: string;

  required?: boolean;
};

const Select = forwardRef<BridgeViewRef, SelectProps>(
  (
    {
      value,
      defaultValue,
      onValueChange,
      open,
      defaultOpen,
      onOpenChange,
      disabled,
      name,
      required,
      children,
      ...props
    },
    ref,
  ) => {

    const [internalValue, setInternalValue] = useState(defaultValue ?? "");
    const current = value ?? internalValue;
    const [internalOpen, setInternalOpen] = useState(defaultOpen ?? false);
    const isOpen = open ?? internalOpen;
    const stateRef = useRef({ open, isOpen, onOpenChange, value, current, onValueChange });
    stateRef.current = { open, isOpen, onOpenChange, value, current, onValueChange };
    const setOpen = useCallback((next: boolean) => {
      const state = stateRef.current;
      if (state.open === undefined) setInternalOpen(next);
      if (next !== state.isOpen) state.onOpenChange?.(next);
    }, []);
    const setValue = useCallback(
      (next: string) => {
        const state = stateRef.current;
        if (state.value === undefined) setInternalValue(next);
        if (next !== state.current) state.onValueChange?.(next);
        setOpen(false);
      },
      [setOpen],
    );

    const [runtimeLabels, setRuntimeLabels] = useState<
      Record<string, string>
    >(() => Object.create(null));
    const registerLabel = useCallback((itemValue: string, label: string) => {
      setRuntimeLabels((prev) =>
        prev[itemValue] === label
          ? prev
          : { ...prev, [itemValue]: label },
      );
    }, []);
    const staticLabels = useMemo(() => {
      const labels = Object.create(null) as Record<string, string>;
      collectItemLabels(children, labels);
      return labels;
    }, [children]);
    const labelOf = useCallback(
      (itemValue: string) =>
        runtimeLabels[itemValue] ?? staticLabels[itemValue] ?? itemValue,
      [runtimeLabels, staticLabels],
    );

    const formSelectRef = useRef<BridgeSelectRef | null>(null);
    useEffect(() => {
      if (Platform.OS !== "web" || !name) return;
      const selectEl = formSelectRef.current as HTMLSelectElement | null;
      const form = selectEl?.form;
      if (!selectEl || !form) return;
      const handleReset = () => {
        queueMicrotask(() => setValue(selectEl.value));
      };
      form.addEventListener("reset", handleReset);
      return () => form.removeEventListener("reset", handleReset);
    }, [name, setValue]);

    const contextValue = useMemo<SelectContextValue>(
      () => ({
        open: isOpen,
        setOpen,
        value: current,
        setValue,
        disabled: disabled ?? false,
        name,
        required,
        registerLabel,
        labelOf,
      }),
      [isOpen, setOpen, current, setValue, disabled, name, required, registerLabel, labelOf],
    );

    const mirrorOptions = useMemo(
      () => ({ ...staticLabels, ...runtimeLabels }),
      [staticLabels, runtimeLabels],
    );

    return (
      <Popover ref={ref} open={isOpen} onOpenChange={setOpen} {...props}>
        <SelectContext.Provider value={contextValue}>
          {children}
          {

                                                      }
          {name && Platform.OS === "web" ? (
            <BridgeSelect
              ref={formSelectRef}
              className="sr-only"
              value={current}
              name={name}
              required={required}
              disabled={disabled}
              tabIndex={-1}
              ariaHidden
              onValueChange={setValue}
            >
              {

                                        }
              {mirrorOptions[""] === undefined && (
                <SelectOption value={""}>{""}</SelectOption>
              )}
              {Object.entries(mirrorOptions).map(([itemValue, label]) => (
                <SelectOption key={itemValue} value={itemValue}>
                  {label}
                </SelectOption>
              ))}
            </BridgeSelect>
          ) : null}
        </SelectContext.Provider>
      </Popover>
    );
  },
);
Select.displayName = "Select";

const selectTriggerVariants = cva(
  "flex-row items-center justify-between gap-2 native:self-start web:w-fit rounded-md border border-input bg-transparent px-3 py-2 web:whitespace-nowrap web:transition-all web:outline-none web:focus-visible:border-ring web:focus-visible:ring-3 web:focus-visible:ring-ring/50 web:aria-invalid:border-destructive web:aria-invalid:ring-destructive/20",
  {
    variants: {
      size: {
        default: "h-9",
        sm: "h-8",
      },
    },
    defaultVariants: {
      size: "default",
    },
  },
);

export type SelectTriggerProps = PressableProps & {
  size?: "sm" | "default";
};

const SelectTrigger = forwardRef<BridgePressableRef, SelectTriggerProps>(
  ({ className, size = "default", children, disabled, onKeyDown, ...props }, ref) => {
    const select = useSelectContext("SelectTrigger");

    const isDisabled = disabled || select.disabled;
    const handleKeyDown = (event: BridgeKeyEvent) => {
      if (!isDisabled && (event.key === "ArrowDown" || event.key === "ArrowUp")) {
        event.preventDefault();
        if (!select.open) select.setOpen(true);
      }
      onKeyDown?.(event);
    };
    return (
      <PopoverTrigger
        ref={ref}
        accessibilityRole="combobox"
        disabled={isDisabled}
        onKeyDown={handleKeyDown}
        className={cn(
          selectTriggerVariants({ size }),
          isDisabled && "web:cursor-not-allowed opacity-50",
          className,
        )}
        {...props}
      >
        {wrapTextChildren(children, "font-sans text-sm text-foreground")}
        <ChevronDownIcon className="size-4 shrink-0 text-muted-foreground opacity-50 web:select-none" />
      </PopoverTrigger>
    );
  },
);
SelectTrigger.displayName = "SelectTrigger";

export type SelectValueProps = TextProps & {
  placeholder?: ReactNode;
};

const SelectValue = forwardRef<BridgeTextRef, SelectValueProps>(
  ({ className, placeholder, children, ...props }, ref) => {
    const select = useSelectContext("SelectValue");
    const hasValue = select.value !== "";
    return (

      <Text
        ref={ref}
        className={cn(
          "font-sans text-sm text-foreground web:line-clamp-1",
          !hasValue && "text-muted-foreground",
          className,
        )}
        {...props}
      >
        {hasValue ? (children ?? select.labelOf(select.value)) : placeholder}
      </Text>
    );
  },
);
SelectValue.displayName = "SelectValue";

export type SelectContentProps = ViewProps & {

  position?: "item-aligned" | "popper";

  side?: OverlayPlacement;

  align?: OverlayAlign;

  sideOffset?: number;
};

const SelectContent = forwardRef<BridgeViewRef, SelectContentProps>(
  (
    {
      className,
      children,
      position: _position,
      side,
      align,
      sideOffset,
      nativeID,
      onKeyDown,
      ...props
    },
    ref,
  ) => {

    const nav = useMenuNav();
    return (
      <PopoverContent
        ref={ref}
        side={side}
        align={align}
        sideOffset={sideOffset}

        accessibilityRole="listbox"
        nativeID={nativeID}
        focusable
        onKeyDown={composeMenuNavKeyDown(nav, onKeyDown)}

        className={cn("w-auto min-w-32 p-0 web:shadow-md", className)}
        {...props}
      >
        {

                                                     }
        <MenuNavContext.Provider value={nav}>
          <ScrollView className="max-h-96" contentContainerClassName="p-1">
            {children}
          </ScrollView>
        </MenuNavContext.Provider>
      </PopoverContent>
    );
  },
);
SelectContent.displayName = "SelectContent";

export type SelectGroupProps = ViewProps;

const SelectGroup = forwardRef<BridgeViewRef, SelectGroupProps>(
  ({ ...props }, ref) => <View ref={ref} {...props} />,
);
SelectGroup.displayName = "SelectGroup";

export type SelectLabelProps = ViewProps;

const SelectLabel = forwardRef<BridgeViewRef, SelectLabelProps>(
  ({ className, children, ...props }, ref) => (
    <View ref={ref} className={cn("px-2 py-1.5", className)} {...props}>

      <Text className="font-sans text-xs text-muted-foreground">
        {children}
      </Text>
    </View>
  ),
);
SelectLabel.displayName = "SelectLabel";

export type SelectItemProps = Omit<
  PressableProps,
  "onPress" | "aria-selected"
> & {
  value: string;

  onSelect?: () => void;
};

const SelectItem = forwardRef<BridgePressableRef, SelectItemProps>(
  (
    { className, value, disabled, onSelect, children, onFocus, onHoverIn, ...props },
    ref,
  ) => {
    const select = useSelectContext("SelectItem");
    const selected = select.value === value;
    const label = textOfChildren(children);

    useEffect(() => {
      if (label !== undefined) select.registerLabel(value, label);
    }, [select, value, label]);

    const nav = useMenuNavContext();
    const handleSelect = () => {
      if (disabled) return;
      select.setValue(value);
      onSelect?.();
    };
    const { id, attach, nodeRef } = useMenuItemRef(ref, undefined, handleSelect);
    return (
      <Pressable
        ref={attach}
        accessibilityRole="option"
        aria-selected={selected}
        disabled={disabled}
        focusable={!disabled}

        onHoverIn={composeMenuItemHoverIn(nav, id, nodeRef, onHoverIn)}
        onFocus={composeMenuItemFocus(nav, id, onFocus)}
        onPress={handleSelect}
        className={cn(
          "relative flex-row w-full items-center gap-2 rounded-sm py-1.5 pr-8 pl-2 active:bg-accent web:cursor-default web:select-none web:outline-none web:hover:bg-accent web:focus-visible:bg-accent",
          disabled && "web:pointer-events-none opacity-50",
          className,
        )}
        {...props}
      >
        {
                                       }
        <View
          aria-hidden
          className="absolute right-2 size-3.5 items-center justify-center web:pointer-events-none"
        >
          {selected ? (
            <CheckIcon className="size-4 text-foreground active:text-accent-foreground web:hover:text-accent-foreground web:focus-visible:text-accent-foreground" />
          ) : null}
        </View>
        {wrapTextChildren(
          children,
          "flex-1 font-sans text-sm text-popover-foreground active:text-accent-foreground web:hover:text-accent-foreground web:focus-visible:text-accent-foreground",
        )}
      </Pressable>
    );
  },
);
SelectItem.displayName = "SelectItem";

export type SelectSeparatorProps = ViewProps;

const SelectSeparator = forwardRef<BridgeViewRef, SelectSeparatorProps>(
  ({ className, ...props }, ref) => (
    <View
      ref={ref}
      accessibilityRole="separator"
      className={cn("-mx-1 my-1 h-px bg-border", className)}
      {...props}
    />
  ),
);
SelectSeparator.displayName = "SelectSeparator";

export type SelectScrollButtonProps = ViewProps;

const SelectScrollUpButton = forwardRef<
  BridgeViewRef,
  SelectScrollButtonProps
>(({ className, ...props }, ref) => (
  <View
    ref={ref}
    className={cn("flex-row items-center justify-center py-1", className)}
    {...props}
  >
    <ChevronUpIcon className="size-4 text-muted-foreground" />
  </View>
));
SelectScrollUpButton.displayName = "SelectScrollUpButton";

const SelectScrollDownButton = forwardRef<
  BridgeViewRef,
  SelectScrollButtonProps
>(({ className, ...props }, ref) => (
  <View
    ref={ref}
    className={cn("flex-row items-center justify-center py-1", className)}
    {...props}
  >
    <ChevronDownIcon className="size-4 text-muted-foreground" />
  </View>
));
SelectScrollDownButton.displayName = "SelectScrollDownButton";

export {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectScrollDownButton,
  SelectScrollUpButton,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
};
