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
  type ReactNode,
} from "react";
import {
  Pressable,
  ScrollView,
  SearchIcon,
  Text,
  TextInput,
  View,
  type BridgeKeyEvent,
  type BridgePressableRef,
  type BridgeScrollViewRef,
  type BridgeTextRef,
  type BridgeTextInputRef,
  type BridgeViewRef,
  type PressableProps,
  type ScrollViewProps,
  type TextProps,
  type TextInputProps,
  type ViewProps,
} from "@unikit-bridge/ui/primitives";

import { cn } from "@/lib/utils";
import { Dialog, DialogContent, type DialogProps } from "./dialog";

type CommandItemMeta = {

  id: string;
  value: string;
  keywords?: string[];
  disabled: boolean;

  groupId?: string;
  onSelect?: (value: string) => void;
};

type CommandContextValue = {
  filter: string;
  setFilter: (next: string) => void;
  shouldFilter: boolean;

  items: CommandItemMeta[];

  registerItem: (meta: CommandItemMeta) => () => void;

  activeValue: string | null;
  select: (value: string | null) => void;

  handleKeyDown: (event: BridgeKeyEvent) => void;

  listId: string;

  version: number;
};

const CommandContext = createContext<CommandContextValue | null>(null);

function useCommandContext(component: string): CommandContextValue {
  const ctx = useContext(CommandContext);
  if (!ctx) {
    throw new Error(`<${component}>는 <Command> 안에서 사용해야 합니다.`);
  }
  return ctx;
}

const CommandGroupContext = createContext<string | undefined>(undefined);

const CommandDialogContext = createContext<{
  inDialog: boolean;
  showCloseButton: boolean;
} | null>(null);

function matchesFilter(
  filter: string,
  shouldFilter: boolean,
  value: string,
  keywords?: string[],
): boolean {
  if (!shouldFilter) return true;
  const tokens = filter.trim().toLowerCase().split(/\s+/).filter(Boolean);
  if (tokens.length === 0) return true;
  const haystack = [value, ...(keywords ?? [])].join(" ").toLowerCase();
  return tokens.every((token) => haystack.includes(token));
}

function textValueOf(nodes: ReactNode): string {
  return Children.toArray(nodes)
    .filter((child): child is string => typeof child === "string")
    .join(" ")
    .trim();
}

export type CommandProps = ViewProps & {

  value?: string;
  defaultValue?: string;
  onValueChange?: (value: string) => void;

  shouldFilter?: boolean;

  loop?: boolean;
};

const Command = forwardRef<BridgeViewRef, CommandProps>(
  (
    {
      value,
      defaultValue,
      onValueChange,
      shouldFilter = true,
      loop = false,
      className,
      children,
      ...props
    },
    ref,
  ) => {

    const [internalSelected, setInternalSelected] = useState<string | null>(
      defaultValue ?? null,
    );
    const selected = value !== undefined ? value : internalSelected;
    const [filter, setInternalFilter] = useState("");

    const registry = useRef(new Map<string, CommandItemMeta>());
    const [version, setVersion] = useState(0);
    useEffect(() => {
      setVersion((v) => v + 1);
    }, []);
    const registerItem = useCallback((meta: CommandItemMeta) => {
      const existing = registry.current.get(meta.id);
      registry.current.set(meta.id, meta);
      const structuralSame =
        existing &&
        existing.value === meta.value &&
        existing.disabled === meta.disabled &&
        existing.groupId === meta.groupId &&
        existing.keywords?.join("\0") === meta.keywords?.join("\0");
      if (!structuralSame) {
        setVersion((v) => v + 1);
      }
      return () => {
        if (registry.current.delete(meta.id)) {
          setVersion((v) => v + 1);
        }
      };
    }, []);
    const items = useMemo(
      () => Array.from(registry.current.values()),

      [version],
    );

    const select = useCallback(
      (next: string | null) => {
        if (value === undefined) setInternalSelected(next);
        if (next !== null && next !== selected) onValueChange?.(next);
      },
      [value, selected, onValueChange],
    );

    const setFilter = useCallback(
      (next: string) => {
        setInternalFilter(next);
        if (value === undefined) setInternalSelected(null);
      },
      [value],
    );

    const selectableItems = useMemo(
      () =>
        items.filter(
          (item) =>
            !item.disabled &&
            matchesFilter(filter, shouldFilter, item.value, item.keywords),
        ),
      [items, filter, shouldFilter],
    );
    const activeValue = useMemo(
      () =>
        selected !== null &&
        selectableItems.some((item) => item.value === selected)
          ? selected
          : (selectableItems[0]?.value ?? null),
      [selected, selectableItems],
    );

    const moveSelection = useCallback(
      (direction: 1 | -1) => {
        if (selectableItems.length === 0) return;
        const index = selectableItems.findIndex(
          (item) => item.value === activeValue,
        );
        const next =
          index === -1
            ? 0
            : loop
              ? (index + direction + selectableItems.length) %
                selectableItems.length
              : Math.min(
                  selectableItems.length - 1,
                  Math.max(0, index + direction),
                );
        select(selectableItems[next].value);
      },
      [selectableItems, activeValue, loop, select],
    );

    const handleKeyDown = useCallback(
      (event: BridgeKeyEvent) => {
        switch (event.key) {
          case "ArrowUp":
            event.preventDefault();
            moveSelection(-1);
            break;
          case "ArrowDown":
            event.preventDefault();
            moveSelection(1);
            break;
          case "Enter": {
            const chosen = selectableItems.find(
              (item) => item.value === activeValue,
            );
            if (chosen) {
              event.preventDefault();
              select(chosen.value);
              chosen.onSelect?.(chosen.value);
            }
            break;
          }
          case "Escape":

            event.preventDefault();
            if (filter !== "") setFilter("");
            break;
        }
      },
      [moveSelection, selectableItems, activeValue, select, filter, setFilter],
    );

    const baseId = useId();
    const listId = `${baseId}-command-list`;
    const contextValue = useMemo<CommandContextValue>(
      () => ({
        filter,
        setFilter,
        shouldFilter,
        items,
        registerItem,
        activeValue,
        select,
        handleKeyDown,
        listId,
        version,
      }),
      [
        filter,
        setFilter,
        shouldFilter,
        items,
        registerItem,
        activeValue,
        select,
        handleKeyDown,
        listId,
        version,
      ],
    );
    return (
      <CommandContext.Provider value={contextValue}>
        <View
          ref={ref}
          className={cn(
            "h-full w-full overflow-hidden rounded-md bg-popover text-popover-foreground",
            className,
          )}
          {...props}
        >
          {children}
        </View>
      </CommandContext.Provider>
    );
  },
);
Command.displayName = "Command";

export type CommandInputProps = Omit<
  TextInputProps,
  "value" | "defaultValue" | "onChangeText"
> & {

  className?: string;

  onValueChange?: (search: string) => void;
};

const CommandInput = forwardRef<BridgeTextInputRef, CommandInputProps>(
  (
    {
      className,
      placeholder,
      editable,
      disabled,
      autoFocus,
      inputMode,
      onKeyDown,
      onValueChange,
      ...props
    },
    ref,
  ) => {
    const command = useCommandContext("CommandInput");
    const dialog = useContext(CommandDialogContext);

    const comboboxAria: {
      "aria-expanded": boolean;
      "aria-controls": string;
    } = {
      "aria-expanded": true,
      "aria-controls": command.listId,
    };
    return (
      <View
        accessibilityRole="combobox"
        {...comboboxAria}
        className={cn(

          "flex-none flex-row items-center gap-2 border-b border-border px-3",
          dialog?.inDialog ? "h-12" : "h-9",
          dialog?.inDialog && dialog.showCloseButton && "pr-12",
          className,
        )}
      >

        <SearchIcon className="size-4 shrink-0 text-popover-foreground opacity-50" />
        <TextInput
          {...props}
          ref={ref}
          value={command.filter}
          onChangeText={(text) => {
            command.setFilter(text);
            onValueChange?.(text);
          }}
          onKeyDown={(event) => {
            command.handleKeyDown(event);
            onKeyDown?.(event);
          }}
          placeholder={placeholder}
          editable={disabled ? false : editable}
          disabled={disabled}
          aria-disabled={disabled ? true : undefined}
          autoFocus={autoFocus}
          inputMode={inputMode ?? "search"}
          className="h-full flex-1 font-sans text-sm text-popover-foreground placeholder:text-muted-foreground web:outline-none disabled:opacity-50"
        />
      </View>
    );
  },
);
CommandInput.displayName = "CommandInput";

export type CommandListProps = ScrollViewProps;

const CommandList = forwardRef<BridgeScrollViewRef, CommandListProps>(
  ({ className, children, nativeID, ...props }, ref) => {
    const command = useCommandContext("CommandList");
    const dialog = useContext(CommandDialogContext);
    return (
      <ScrollView
        ref={ref}
        accessibilityRole="listbox"
        nativeID={nativeID ?? command.listId}
        className={cn(
          "max-h-72 web:scroll-py-1",
          dialog?.inDialog && "pb-1",
          className,
        )}
        {...props}
      >
        {children}
      </ScrollView>
    );
  },
);
CommandList.displayName = "CommandList";

export type CommandEmptyProps = ViewProps;

const CommandEmpty = forwardRef<BridgeViewRef, CommandEmptyProps>(
  ({ className, children, ...props }, ref) => {
    const command = useCommandContext("CommandEmpty");
    const hasMatch = command.items.some((item) =>
      matchesFilter(
        command.filter,
        command.shouldFilter,
        item.value,
        item.keywords,
      ),
    );

    if (hasMatch || command.version === 0) return null;
    return (
      <View ref={ref} className={cn("py-6", className)} {...props}>

        <Text className="text-center font-sans text-sm text-popover-foreground">
          {children}
        </Text>
      </View>
    );
  },
);
CommandEmpty.displayName = "CommandEmpty";

export type CommandGroupProps = ViewProps & {

  heading?: ReactNode;
};

const CommandGroup = forwardRef<BridgeViewRef, CommandGroupProps>(
  ({ heading, className, children, ...props }, ref) => {
    const command = useCommandContext("CommandGroup");
    const dialog = useContext(CommandDialogContext);
    const groupId = useId();
    const hasVisible = command.items.some(
      (item) =>
        item.groupId === groupId &&
        matchesFilter(
          command.filter,
          command.shouldFilter,
          item.value,
          item.keywords,
        ),
    );
    return (
      <CommandGroupContext.Provider value={groupId}>
        <View
          ref={ref}

          className={cn(
            "overflow-hidden",
            dialog?.inDialog ? "px-2 py-1" : "p-1",
            command.version > 0 && !hasVisible && "hidden",
            className,
          )}
          {...props}
        >
          {heading != null && (
            <Text className="px-2 py-1.5 font-sans text-xs font-medium text-muted-foreground web:whitespace-nowrap">
              {heading}
            </Text>
          )}
          {children}
        </View>
      </CommandGroupContext.Provider>
    );
  },
);
CommandGroup.displayName = "CommandGroup";

export type CommandItemProps = PressableProps & {

  value?: string;

  keywords?: string[];

  onSelect?: (value: string) => void;
  children?: ReactNode;
};

const CommandItem = forwardRef<BridgePressableRef, CommandItemProps>(
  (
    {
      value,
      keywords,
      disabled,
      onSelect,
      onPress,
      className,
      children,
      ...props
    },
    ref,
  ) => {
    const command = useCommandContext("CommandItem");
    const dialog = useContext(CommandDialogContext);
    const groupId = useContext(CommandGroupContext);
    const id = useId();
    const resolvedValue = value ?? textValueOf(children);

    const onSelectRef = useRef(onSelect);
    onSelectRef.current = onSelect;
    const keywordsRef = useRef(keywords);
    keywordsRef.current = keywords;
    const keywordsKey = keywords?.join("\0") ?? "";
    const registerItem = command.registerItem;
    useEffect(() => {
      const meta: CommandItemMeta = {
        id,
        value: resolvedValue,
        keywords: keywordsRef.current,
        disabled: disabled === true,
        groupId,
        onSelect: (selectedValue) => onSelectRef.current?.(selectedValue),
      };
      return registerItem(meta);
    }, [registerItem, id, resolvedValue, keywordsKey, disabled, groupId]);

    if (
      !matchesFilter(
        command.filter,
        command.shouldFilter,
        resolvedValue,
        keywords,
      )
    ) {
      return null;
    }

    const selected = command.activeValue === resolvedValue;

    const labelClass = cn(
      "font-sans text-sm web:select-none",
      selected ? "text-accent-foreground" : "text-popover-foreground",
    );
    const content = Children.map(children, (child) =>
      typeof child === "string" || typeof child === "number" ? (
        <Text className={labelClass}>{child}</Text>
      ) : (
        child
      ),
    );

    return (
      <Pressable
        ref={ref}
        accessibilityRole="option"
        aria-selected={selected}
        disabled={disabled}
        onPress={() => {

          command.select(resolvedValue);
          onSelect?.(resolvedValue);
          onPress?.();
        }}
        className={cn(
          "relative flex-row items-center gap-2 rounded-sm px-2 web:cursor-default web:outline-none web:select-none",
          dialog?.inDialog ? "py-3" : "py-1.5",

          selected && "bg-accent",
          disabled && "web:pointer-events-none opacity-50",
          className,
        )}
        {...props}
      >
        {content}
      </Pressable>
    );
  },
);
CommandItem.displayName = "CommandItem";

export type CommandShortcutProps = TextProps;

const CommandShortcut = forwardRef<BridgeTextRef, CommandShortcutProps>(
  ({ className, ...props }, ref) => (
    <Text
      ref={ref}
      className={cn(
        "ml-auto font-sans text-xs tracking-widest text-muted-foreground",
        className,
      )}
      {...props}
    />
  ),
);
CommandShortcut.displayName = "CommandShortcut";

export type CommandSeparatorProps = ViewProps;

const CommandSeparator = forwardRef<BridgeViewRef, CommandSeparatorProps>(
  ({ className, ...props }, ref) => (
    <View ref={ref} className={cn("-mx-1 h-px bg-border", className)} {...props} />
  ),
);
CommandSeparator.displayName = "CommandSeparator";

export type CommandDialogProps = DialogProps & {

  title?: string;

  description?: string;
  className?: string;
  showCloseButton?: boolean;
};

const CommandDialog = forwardRef<BridgeViewRef, CommandDialogProps>(
  (
    {
      title = "Command Palette",
      description: _description,
      className,
      showCloseButton = true,
      children,
      ...props
    },
    ref,
  ) => {
    const dialogContext = useMemo(
      () => ({ inDialog: true, showCloseButton }),
      [showCloseButton],
    );
    return (
      <Dialog {...props}>
        <DialogContent
          ref={ref}

          accessibilityLabel={title}
          className={cn("gap-0 overflow-hidden p-0", className)}
          showCloseButton={showCloseButton}
        >
          <CommandDialogContext.Provider value={dialogContext}>
            {children}
          </CommandDialogContext.Provider>
        </DialogContent>
      </Dialog>
    );
  },
);
CommandDialog.displayName = "CommandDialog";

export {
  Command,
  CommandDialog,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandShortcut,
  CommandSeparator,
};
