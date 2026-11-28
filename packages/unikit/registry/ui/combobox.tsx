import {
  Children,
  createContext,
  forwardRef,
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
  Pressable,
  Text,
  View,
  XIcon,
  type BridgePressableRef,
  type BridgeScrollViewRef,
  type BridgeTextRef,
  type BridgeTextInputRef,
  type BridgeViewRef,
  type PressableProps,
  type TextProps,
  type TextInputProps,
  type ViewProps,
} from "@unikit-bridge/ui/primitives";

import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
  type CommandGroupProps,
  type CommandListProps,
} from "./command";
import { Popover, PopoverContent, PopoverTrigger } from "./popover";
import type { OverlayAlign, OverlayPlacement } from "@/lib/overlay";
import { cn } from "@/lib/utils";

function wrapTextChildren(children: ReactNode, textClassName: string) {
  return Children.map(children, (child) =>
    typeof child === "string" || typeof child === "number" ? (
      <Text className={textClassName}>{child}</Text>
    ) : (
      child
    ),
  );
}

function textValueOf(nodes: ReactNode): string {
  return Children.toArray(nodes)
    .filter((child): child is string => typeof child === "string")
    .join(" ")
    .trim();
}

const TRIGGER_RESET_CLASSES = "web:outline-none";

type ComboboxContextValue = {
  multiple: boolean;

  value: string | null;

  values: string[];

  commitItem: (value: string) => void;

  removeValue: (value: string) => void;

  clear: () => void;
  open: boolean;
  setOpen: (open: boolean) => void;

  registerItem: (value: string, label: string) => void;

  labels: Map<string, string>;

  anchorWidth: number | null;
  setAnchorWidth: (width: number) => void;
};

const ComboboxContext = createContext<ComboboxContextValue | null>(null);

function useComboboxContext(component: string): ComboboxContextValue {
  const ctx = useContext(ComboboxContext);
  if (!ctx) {
    throw new Error(`<${component}>는 <Combobox> 안에서 사용해야 합니다.`);
  }
  return ctx;
}

export type ComboboxProps = ViewProps & {

  value?: string;
  defaultValue?: string;
  onValueChange?: (value: string) => void;

  values?: string[];
  defaultValues?: string[];
  onValuesChange?: (values: string[]) => void;

  multiple?: boolean;
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
};

const Combobox = forwardRef<BridgeViewRef, ComboboxProps>(
  (
    {
      value,
      defaultValue,
      onValueChange,
      values,
      defaultValues,
      onValuesChange,
      multiple = false,
      open,
      defaultOpen,
      onOpenChange,
      className,
      children,
      ...props
    },
    ref,
  ) => {

    const [internalValue, setInternalValue] = useState<string | null>(
      defaultValue ?? null,
    );
    const selectedValue = value !== undefined ? value : internalValue;
    const [internalValues, setInternalValues] = useState<string[]>(
      defaultValues ?? [],
    );
    const selectedValues = values !== undefined ? values : internalValues;
    const [internalOpen, setInternalOpen] = useState(defaultOpen ?? false);
    const isOpen = open ?? internalOpen;
    const [anchorWidth, setAnchorWidthState] = useState<number | null>(null);
    const setAnchorWidth = useCallback((w: number) => {
      const next = Math.round(w);
      if (next <= 0) return;
      setAnchorWidthState((prev) => (prev === next ? prev : next));
    }, []);

    const stateRef = useRef({
      multiple,
      value,
      selectedValue,
      onValueChange,
      values,
      selectedValues,
      onValuesChange,
      open,
      isOpen,
      onOpenChange,
    });
    stateRef.current = {
      multiple,
      value,
      selectedValue,
      onValueChange,
      values,
      selectedValues,
      onValuesChange,
      open,
      isOpen,
      onOpenChange,
    };

    const setOpen = useCallback((next: boolean) => {
      const state = stateRef.current;
      if (state.open === undefined) setInternalOpen(next);
      if (next !== state.isOpen) state.onOpenChange?.(next);
    }, []);

    const labelRegistry = useRef(new Map<string, string>());
    const [, setRegistryVersion] = useState(0);
    const registerItem = useCallback((itemValue: string, label: string) => {
      if (labelRegistry.current.get(itemValue) === label) return;
      labelRegistry.current.set(itemValue, label);
      setRegistryVersion((version) => version + 1);
    }, []);

    const commitItem = useCallback(
      (itemValue: string) => {
        const state = stateRef.current;
        if (state.multiple) {
          const next = state.selectedValues.includes(itemValue)
            ? state.selectedValues.filter((entry) => entry !== itemValue)
            : [...state.selectedValues, itemValue];
          if (state.values === undefined) setInternalValues(next);
          state.onValuesChange?.(next);
          return;
        }
        if (itemValue !== state.selectedValue) {
          if (state.value === undefined) setInternalValue(itemValue);
          state.onValueChange?.(itemValue);
        }
        setOpen(false);
      },
      [setOpen],
    );

    const removeValue = useCallback((itemValue: string) => {
      const state = stateRef.current;
      if (state.multiple) {
        if (!state.selectedValues.includes(itemValue)) return;
        const next = state.selectedValues.filter((entry) => entry !== itemValue);
        if (state.values === undefined) setInternalValues(next);
        state.onValuesChange?.(next);
        return;
      }
      if (state.selectedValue !== itemValue) return;
      if (state.value === undefined) setInternalValue(null);
      state.onValueChange?.("");
    }, []);

    const clear = useCallback(() => {
      const state = stateRef.current;
      if (state.multiple) {
        if (state.selectedValues.length === 0) return;
        if (state.values === undefined) setInternalValues([]);
        state.onValuesChange?.([]);
      } else {
        if (state.selectedValue == null) return;
        if (state.value === undefined) setInternalValue(null);
        state.onValueChange?.("");
      }
    }, []);

    const contextValue = useMemo<ComboboxContextValue>(
      () => ({
        multiple,
        value: selectedValue,
        values: selectedValues,
        commitItem,
        removeValue,
        clear,
        open: isOpen,
        setOpen,
        registerItem,
        labels: labelRegistry.current,
        anchorWidth,
        setAnchorWidth,
      }),
      [
        multiple,
        selectedValue,
        selectedValues,
        commitItem,
        removeValue,
        clear,
        isOpen,
        setOpen,
        registerItem,
        anchorWidth,
        setAnchorWidth,
      ],
    );

    return (
      <ComboboxContext.Provider value={contextValue}>
        <Popover open={isOpen} onOpenChange={setOpen}>
          {

                                   }
          <Command
            ref={ref}
            className={cn(
              "h-auto w-auto overflow-visible rounded-none bg-transparent",
              className,
            )}
            {...props}
          >
            {children}
          </Command>
        </Popover>
      </ComboboxContext.Provider>
    );
  },
);
Combobox.displayName = "Combobox";

export type ComboboxTriggerProps = PressableProps;

const ComboboxTrigger = forwardRef<BridgePressableRef, ComboboxTriggerProps>(
  ({ className, children, onLayout, ...props }, ref) => {
    const combobox = useComboboxContext("ComboboxTrigger");
    return (
      <PopoverTrigger
        ref={ref}
        onLayout={(layout) => {
          combobox.setAnchorWidth(layout.width);
          onLayout?.(layout);
        }}
        className={cn(
          "flex flex-row items-center gap-2",
          TRIGGER_RESET_CLASSES,
          className,
        )}
        {...props}
      >
        {wrapTextChildren(children, "font-sans text-sm text-foreground")}

        <ChevronDownIcon className="size-4 shrink-0 text-muted-foreground" />
      </PopoverTrigger>
    );
  },
);
ComboboxTrigger.displayName = "ComboboxTrigger";

export type ComboboxValueProps = Omit<ViewProps, "children"> & {

  placeholder?: ReactNode;

  children?: ReactNode | ((label: string | null) => ReactNode);
};

const ComboboxValue = forwardRef<BridgeViewRef, ComboboxValueProps>(
  ({ className, placeholder, children, ...props }, ref) => {
    const combobox = useComboboxContext("ComboboxValue");
    const selected = combobox.multiple
      ? combobox.values
      : combobox.value != null && combobox.value !== ""
        ? [combobox.value]
        : [];
    const joined =
      selected.length > 0
        ? selected.map((v) => combobox.labels.get(v) ?? v).join(", ")
        : null;
    const rendered =
      typeof children === "function" ? children(joined) : joined;
    return (
      <View ref={ref} className={cn("flex-1 justify-center", className)} {...props}>
        {rendered != null ? (
          wrapTextChildren(rendered, "font-sans text-sm text-foreground")
        ) : (
          <Text className="font-sans text-sm text-muted-foreground">
            {placeholder ?? ""}
          </Text>
        )}
      </View>
    );
  },
);
ComboboxValue.displayName = "ComboboxValue";

export type ComboboxClearProps = Omit<PressableProps, "onPress">;

const ComboboxClear = forwardRef<BridgePressableRef, ComboboxClearProps>(
  ({ className, children, accessibilityLabel, ...props }, ref) => {
    const combobox = useComboboxContext("ComboboxClear");
    return (
      <Pressable
        ref={ref}
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabel ?? "선택 지우기"}
        className={cn(TRIGGER_RESET_CLASSES, className)}
        onPress={() => combobox.clear()}
        {...props}
      >
        {children ?? (
          <XIcon className="size-3.5 text-muted-foreground" />
        )}
      </Pressable>
    );
  },
);
ComboboxClear.displayName = "ComboboxClear";

export type ComboboxInputProps = Omit<
  TextInputProps,
  "value" | "defaultValue" | "onChangeText"
> & {

  showTrigger?: boolean;

  showClear?: boolean;

  className?: string;
  children?: ReactNode;
};

const ComboboxInput = forwardRef<BridgeTextInputRef, ComboboxInputProps>(
  (
    {
      className,
      children,
      disabled,
      showTrigger = true,
      showClear = false,
      ...props
    },
    ref,
  ) => {
    const combobox = useComboboxContext("ComboboxInput");
    return (

      <View
        onLayout={(layout) => combobox.setAnchorWidth(layout.width)}
        className={cn(
          "flex-none flex-row items-center border-b border-border h-9",
          className,
        )}
      >
        <CommandInput
          ref={ref}
          disabled={disabled}
          onValueChange={(search) => {
            if (!combobox.open && search !== "") combobox.setOpen(true);
          }}
          className="h-full flex-1 border-0 px-3"
          {...props}
        />
        {showClear ? (
          <ComboboxClear disabled={disabled} className="mr-2" />
        ) : null}
        {showTrigger ? (
          <PopoverTrigger
            accessibilityLabel="목록 열기"
            className={cn("mr-2", TRIGGER_RESET_CLASSES)}
          >
            <ChevronDownIcon className="size-4 shrink-0 text-muted-foreground" />
          </PopoverTrigger>
        ) : null}
        {children}
      </View>
    );
  },
);
ComboboxInput.displayName = "ComboboxInput";

export type ComboboxContentProps = ViewProps & {

  side?: OverlayPlacement;

  align?: OverlayAlign;

  sideOffset?: number;
};

const ComboboxContent = forwardRef<BridgeViewRef, ComboboxContentProps>(
  (
    {
      className,
      style,
      side = "bottom",
      align = "start",
      sideOffset = 6,
      children,
      ...props
    },
    ref,
  ) => {
    const combobox = useComboboxContext("ComboboxContent");
    const mergedStyle =
      combobox.anchorWidth != null
        ? { minWidth: combobox.anchorWidth, ...style }
        : style;
    return (

      <PopoverContent
        ref={ref}
        side={side}
        align={align}
        sideOffset={sideOffset}
        style={mergedStyle}
        className={cn(
          "p-0 web:max-h-96 web:overflow-y-auto web:shadow-md",
          className,
        )}
        {...props}
      >
        {children}
      </PopoverContent>
    );
  },
);
ComboboxContent.displayName = "ComboboxContent";

export type ComboboxListProps = CommandListProps;

const ComboboxList = forwardRef<BridgeScrollViewRef, ComboboxListProps>(
  ({ className, ...props }, ref) => (

    <CommandList ref={ref} className={cn("p-1", className)} {...props} />
  ),
);
ComboboxList.displayName = "ComboboxList";

export type ComboboxEmptyProps = ViewProps;

const ComboboxEmpty = forwardRef<BridgeViewRef, ComboboxEmptyProps>(
  ({ className, ...props }, ref) => (

    <CommandEmpty ref={ref} className={cn("py-2", className)} {...props} />
  ),
);
ComboboxEmpty.displayName = "ComboboxEmpty";

export type ComboboxGroupProps = CommandGroupProps;

const ComboboxGroup = forwardRef<BridgeViewRef, ComboboxGroupProps>(
  ({ className, ...props }, ref) => (
    <CommandGroup
      ref={ref}
      className={cn("overflow-hidden p-1", className)}
      {...props}
    />
  ),
);
ComboboxGroup.displayName = "ComboboxGroup";

export type ComboboxLabelProps = TextProps;

const ComboboxLabel = forwardRef<BridgeTextRef, ComboboxLabelProps>(
  ({ className, ...props }, ref) => (
    <Text
      ref={ref}
      className={cn(
        "px-2 py-1.5 font-sans text-xs text-muted-foreground",
        className,
      )}
      {...props}
    />
  ),
);
ComboboxLabel.displayName = "ComboboxLabel";

export type ComboboxCollectionProps = ViewProps;

const ComboboxCollection = forwardRef<BridgeViewRef, ComboboxCollectionProps>(
  ({ ...props }, ref) => <View ref={ref} {...props} />,
);
ComboboxCollection.displayName = "ComboboxCollection";

export type ComboboxItemProps = PressableProps & {

  value?: string;

  keywords?: string[];

  onSelect?: (value: string) => void;
  children?: ReactNode;
};

const ComboboxItem = forwardRef<BridgePressableRef, ComboboxItemProps>(
  (
    { value, keywords, disabled, onSelect, className, children, ...props },
    ref,
  ) => {
    const combobox = useComboboxContext("ComboboxItem");
    const { registerItem } = combobox;
    const resolvedValue = value ?? textValueOf(children);
    const label = textValueOf(children) || resolvedValue;
    const isSelected = combobox.multiple
      ? combobox.values.includes(resolvedValue)
      : combobox.value === resolvedValue;

    useEffect(() => {
      registerItem(resolvedValue, label);
    }, [registerItem, resolvedValue, label]);

    return (
      <CommandItem
        ref={ref}
        value={resolvedValue}
        keywords={keywords}
        disabled={disabled}
        onSelect={(selected) => {
          combobox.commitItem(selected);
          onSelect?.(selected);
        }}
        className={cn("pl-2 pr-8", className)}
        {...props}
      >
        {children}

        <View
          aria-hidden
          className="absolute right-2 size-4 items-center justify-center"
        >
          {isSelected ? (
            <CheckIcon className="size-4 text-foreground" />
          ) : null}
        </View>
      </CommandItem>
    );
  },
);
ComboboxItem.displayName = "ComboboxItem";

export type ComboboxSeparatorProps = ViewProps;

const ComboboxSeparator = forwardRef<BridgeViewRef, ComboboxSeparatorProps>(
  ({ className, ...props }, ref) => (
    <CommandSeparator
      ref={ref}
      className={cn("my-1", className)}
      {...props}
    />
  ),
);
ComboboxSeparator.displayName = "ComboboxSeparator";

export type ComboboxChipsProps = ViewProps;

const ComboboxChips = forwardRef<BridgeViewRef, ComboboxChipsProps>(
  ({ className, ...props }, ref) => (
    <View
      ref={ref}
      className={cn(

        "min-h-9 flex-row flex-wrap items-center gap-1.5 rounded-md border border-input px-2.5 py-1.5 web:focus-within:border-ring web:focus-within:ring-3 web:focus-within:ring-ring/50",
        className,
      )}
      {...props}
    />
  ),
);
ComboboxChips.displayName = "ComboboxChips";

export type ComboboxChipProps = ViewProps & {

  value: string;

  showRemove?: boolean;
};

const ComboboxChip = forwardRef<BridgeViewRef, ComboboxChipProps>(
  ({ className, value, showRemove = true, children, ...props }, ref) => {
    const combobox = useComboboxContext("ComboboxChip");
    return (
      <View
        ref={ref}
        className={cn(

          "h-5 flex-row items-center gap-1 rounded-sm bg-muted px-1.5",
          className,
        )}
        {...props}
      >
        {wrapTextChildren(
          children,
          "font-sans text-xs font-medium text-foreground",
        )}
        {showRemove ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="제거"

            className={cn(
              TRIGGER_RESET_CLASSES,
              "-ml-1 opacity-50 web:hover:opacity-100",
            )}
            onPress={() => combobox.removeValue(value)}
          >
            {
                                                                    }
            <XIcon className="size-3 text-foreground" />
          </Pressable>
        ) : null}
      </View>
    );
  },
);
ComboboxChip.displayName = "ComboboxChip";

export type ComboboxChipsInputProps = Omit<
  TextInputProps,
  "value" | "defaultValue" | "onChangeText"
>;

const ComboboxChipsInput = forwardRef<
  BridgeTextInputRef,
  ComboboxChipsInputProps
>(({ className, ...props }, ref) => (

  <CommandInput
    ref={ref}
    className={cn("h-8 min-w-16 flex-1 border-0 px-1", className)}
    {...props}
  />
));
ComboboxChipsInput.displayName = "ComboboxChipsInput";

export function useComboboxAnchor() {
  return useRef<BridgeViewRef | null>(null);
}

export {
  Combobox,
  ComboboxInput,
  ComboboxContent,
  ComboboxList,
  ComboboxItem,
  ComboboxGroup,
  ComboboxLabel,
  ComboboxCollection,
  ComboboxEmpty,
  ComboboxSeparator,
  ComboboxChips,
  ComboboxChip,
  ComboboxChipsInput,
  ComboboxTrigger,
  ComboboxValue,
};
