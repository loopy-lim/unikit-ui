// Command — shadcn/ui（new-york-v4） command.tsx 유니버설 포팅 （사이클 40, T-1c）.
// 원본: shadcn-ref/ui/command.tsx — cmdk 엔진을 제거하고 필터링키보드 선택을
// React state + context + 항목 레지스트리（useEffect 등록）로 직접 재구현한다.
//
// 포팅 판단（원본 대비 차이）:
// - cmdk 제거: 필터는 대소문자 무시 단어별 부분문자열 일치（검색어의 공백 구분
//   토큰이 valuekeywords에 모두 포함돼야 매치 — cmdk fuzzy 스코어링의 단순화）.
//   비매칭 항목은 렌더 제외（cmdk의 hidden 처리와 같은 가시 결과）. shouldFilter
//   loop prop은 유지하고 커스텀 filter 함수는 미지원.
// - CommandDialog 이식（G3 F-5 반영 — 설계 §3 명시 항목） — Dialog +
//   DialogContent 조합. 원본의 cmdk 그룹 셀렉터 클래스（［&_[cmdk-item］ 등）는
//   radix 제거 원칙상 소실, sr-only 헤더는 accessibilityLabel 근사（관행）.
// - CommandLoading은 원본 new-york-v4 참조에 없어 미이식.
// - 키보드 탐색（웹）: CommandInput onKeyDown（BridgeKeyEvent）으로 ArrowUp/Down
//   （선택 이동, loop 시 순환）Enter（선택 항목 onSelect 확정）Escape（필터 비움 —
//   빈 상태면 무동작, 닫기는 소비측 Dialog/Popover 역할）. 필터가 바뀌면 선택은
//   첫 매칭 항목으로 되돌아간다（cmdk 동작）. 미선택 시 첫 매칭 항목이 유효 선택.
// - 네이티브 한계: onKeyDown은 RN onKeyPress（{key}） 래핑（bridge/types.ts）이라
//   변환 불가 키（IME 조합 등）는 발화되지 않고 preventDefault가 no-op다 —
//   터치 선택（onPress → onSelect）이 네이티브 기본 경로.
// - 선택 항목 자동 스크롤（cmdk scrollIntoView）은 항목 측정 계약이 없어 미지원.
// - SearchIcon（lucide） 제거 — ⌕ 글리프 Text（새 의존성 금지 관행, checkbox
//   pagination과 동일）.
// - 원본 data-selected/data-disabled［cmdk-group-heading］ 그룹 셀렉터 클래스는
//   네이티브에 data 속성이 없어 조건부 클래스heading Text 직접 지정으로 전개.
// - 그룹 숨김: 소속 항목이 전부 비매칭이면 그룹 컨테이너에 hidden 클래스 —
//   자식을 언마운트하지 않아（레지스트리 등록 유지） 필터 복귀에 즉시 대응한다.
//   마운트 전（version 0, 초기 렌더SSR）엔 표시 상태로 그린다（거짓 숨김 방지）.
// - CommandList는 브리지 ScrollView 프리미티브（웹 overflow div / RN ScrollView）.
// - 임의값 금지: 원본 max-h-［300px］ → max-h-72（288px） 근사.
// - 접근성: 목록 listbox항목 option + aria-selected, 입력 래퍼 combobox +
//   aria-expanded/aria-controls（useId로 목록 nativeID와 연결）. aria 2종은
//   브리지 ViewProps에 계약이 없어 확장 타입 스프레드로 웹 전달（웹 View는
//   rest를 div에 그대로 실음） — 네이티브에서 폐기, 계약 확장 필요（보고）.
// - 항목의 문자열 children은 내부 Text로 감싼다（네이티브 View 내 문자열
//   크래시 방지 — button-grouppagination 관행）. value 미지정 시 최상위 문자열
//   children에서 유도（cmdk textContent 유추의 근사, 중첩 요소 텍스트는 미수집）.
// - 루트의 text-popover-foreground는 웹 상속용으로 유지（커스텀 children 대응）,
//   문자열 children 경로는 Text에 직접 지정한다（이중 지정 원칙）.
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

import { cn } from "../lib/utils";
import { Dialog, DialogContent, type DialogProps } from "./dialog";

/** 항목 등록 정보 — 키보드 탐색필터 판정의 단일 출처 */
type CommandItemMeta = {
  /** 등록 인스턴스 ID（useId） — value 중복과 무관한 식별 */
  id: string;
  value: string;
  keywords?: string[];
  disabled: boolean;
  /** 소속 그룹 ID — 그룹 밖 항목은 undefined */
  groupId?: string;
  onSelect?: (value: string) => void;
};

type CommandContextValue = {
  filter: string;
  setFilter: (next: string) => void;
  shouldFilter: boolean;
  /** 등록된 전체 항목（등록 순） */
  items: CommandItemMeta[];
  /** 등록（해제 함수 반환） — 항목 마운트와 무관하게 레지스트리를 유지한다 */
  registerItem: (meta: CommandItemMeta) => () => void;
  /** 유효 선택값 — 미선택비매칭이면 첫 매칭 항목（cmdk 동작） */
  activeValue: string | null;
  select: (value: string | null) => void;
  /** 입력창 키 처리（ArrowUp/DownEnterEscape） */
  handleKeyDown: (event: BridgeKeyEvent) => void;
  /** aria-controls ↔ CommandList nativeID 연결용 */
  listId: string;
  /** 레지스트리 변경 횟수 — 0이면 마운트 전（초기 렌더SSR 낙관 상태） */
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

/** 그룹 소속 전달 — CommandGroup이 ID를 제공, 항목 등록 meta에 싣는다 */
const CommandGroupContext = createContext<string | undefined>(undefined);

/** 필터 일치 — shouldFilter=false 또는 빈 검색어면 전체 매치, 그 외엔 모든
 *  공백 구분 토큰이 valuekeywords 결합 문자열에 포함돼야 한다 */
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

/** value 미지정 항목의 유도값 — 최상위 문자열 children 결합 */
function textValueOf(nodes: ReactNode): string {
  return Children.toArray(nodes)
    .filter((child): child is string => typeof child === "string")
    .join(" ")
    .trim();
}

export type CommandProps = ViewProps & {
  /** 키보드 선택값（제어） — 미지정 시 내부 상태 */
  value?: string;
  defaultValue?: string;
  onValueChange?: (value: string) => void;
  /** 필터 적용 여부（기본 true） — false면 전체 항목 표시 */
  shouldFilter?: boolean;
  /** 방향키 끝 도달 시 순환（기본 false） */
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
    // 비제어 선택 상태 — 제어（value 지정）면 무시된다.
    const [internalSelected, setInternalSelected] = useState<string | null>(
      defaultValue ?? null,
    );
    const selected = value !== undefined ? value : internalSelected;
    const [filter, setInternalFilter] = useState("");

    // 항목 레지스트리 — 등록/해제마다 version을 올려 EmptyGroup이 재평가하게
    // 한다. 루트 마운트 효과로 version ≥ 1을 보장（0 = 마운트 전 낙관 상태）.
    const registry = useRef(new Map<string, CommandItemMeta>());
    const [version, setVersion] = useState(0);
    useEffect(() => {
      setVersion((v) => v + 1);
    }, []);
    const registerItem = useCallback((meta: CommandItemMeta) => {
      registry.current.set(meta.id, meta);
      setVersion((v) => v + 1);
      return () => {
        registry.current.delete(meta.id);
        setVersion((v) => v + 1);
      };
    }, []);
    const items = useMemo(
      () => Array.from(registry.current.values()),
      // eslint-disable-next-line react-hooks/exhaustive-deps
      [version],
    );

    const select = useCallback(
      (next: string | null) => {
        if (value === undefined) setInternalSelected(next);
        if (next !== null && next !== selected) onValueChange?.(next);
      },
      [value, selected, onValueChange],
    );

    // 필터 갱신 — 필터가 바뀌면 선택을 첫 매칭 항목으로 되돌린다（cmdk 동작）.
    const setFilter = useCallback(
      (next: string) => {
        setInternalFilter(next);
        if (value === undefined) setInternalSelected(null);
      },
      [value],
    );

    // 매칭비활성 제외한 탐색 대상과 유효 선택값（미선택 시 첫 매칭）.
    const selectableItems = items.filter(
      (item) =>
        !item.disabled &&
        matchesFilter(filter, shouldFilter, item.value, item.keywords),
    );
    const activeValue =
      selected !== null &&
      selectableItems.some((item) => item.value === selected)
        ? selected
        : (selectableItems[0]?.value ?? null);

    const moveSelection = (direction: 1 | -1) => {
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
    };

    const handleKeyDown = (event: BridgeKeyEvent) => {
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
          // 필터 비움 — 이미 비었으면 무동작（닫기는 소비측 역할）
          event.preventDefault();
          if (filter !== "") setFilter("");
          break;
      }
    };

    const baseId = useId();
    const listId = `${baseId}-command-list`;
    return (
      <CommandContext.Provider
        value={{
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
        }}
      >
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
  /** 검색창 래퍼（테두리높이패딩） 클래스 — 입력 요소 자체가 아니다（포팅 판단） */
  className?: string;
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
      ...props
    },
    ref,
  ) => {
    const command = useCommandContext("CommandInput");
    // combobox aria 2종 — 브리지 ViewProps 미계약 속성. 웹 View은 rest를 div에
    // 그대로 실어 보내고（bridge/web.tsx） 네이티브 구현은 무시폐기한다.
    // 계약 확장（ViewProps에 aria-expandedaria-controls 추가） 필요 — 보고 예정.
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
          "flex-none flex-row items-center gap-2 border-b border-border px-3 web:h-9",
          className,
        )}
      >
        {/* 검색 글리프 — 원본 SearchIcon（lucide） 대체 */}
        <View aria-hidden>
          <Text className="text-sm leading-none text-muted-foreground web:select-none">
            ⌕
          </Text>
        </View>
        <TextInput
          {...props}
          ref={ref}
          value={command.filter}
          onChangeText={command.setFilter}
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
    return (
      <ScrollView
        ref={ref}
        accessibilityRole="listbox"
        nativeID={nativeID ?? command.listId}
        className={cn("max-h-72 web:scroll-py-1", className)}
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
    // 마운트 전（version 0）엔 레지스트리가 비어 거짓 빈 상태가 된다 — 숨김.
    if (hasMatch || command.version === 0) return null;
    return (
      <View ref={ref} className={cn("py-6", className)} {...props}>
        {/* 문자열 children 권장（원본 그대로 text-center text-sm） */}
        <Text className="text-center font-sans text-sm text-muted-foreground">
          {children}
        </Text>
      </View>
    );
  },
);
CommandEmpty.displayName = "CommandEmpty";

export type CommandGroupProps = ViewProps & {
  /** 그룹 라벨（heading） — 문자열 children 권장 */
  heading?: ReactNode;
};

const CommandGroup = forwardRef<BridgeViewRef, CommandGroupProps>(
  ({ heading, className, children, ...props }, ref) => {
    const command = useCommandContext("CommandGroup");
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
          // 소속 항목 전부 비매칭 → hidden（언마운트 아님, 등록 유지）.
          // 마운트 전（version 0）엔 표시로 그린다（SSR초기 낙관 렌더）.
          className={cn(
            "overflow-hidden p-1",
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
  /** 항목값 — 필터선택 매칭에 쓰인다（미지정 시 문자열 children에서 유도） */
  value?: string;
  /** 필터 추가 검색어（cmdk keywords） */
  keywords?: string[];
  /** 선택 확정 콜백 — 터치 onPress와 웹 Enter가 호출（cmdk와 동일 시그니처） */
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
    const groupId = useContext(CommandGroupContext);
    const id = useId();
    const resolvedValue = value ?? textValueOf(children);

    // 레지스트리 등록 — 비매칭으로 렌더 제외돼도 컴포넌트는 마운트 상태라
    // 등록이 유지되고, 필터 복귀 시 즉시 다시 나타난다.
    const registerItem = command.registerItem;
    useEffect(() => {
      const meta: CommandItemMeta = {
        id,
        value: resolvedValue,
        keywords,
        disabled: disabled === true,
        groupId,
        onSelect,
      };
      return registerItem(meta);
    }, [registerItem, id, resolvedValue, keywords, disabled, groupId, onSelect]);

    // 비매칭 항목은 렌더 제외 — 원본 cmdk hidden 처리와 같은 가시 결과.
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
    // 문자열 children은 Text로 감싼다（네이티브 View 내 문자열 크래시 방지）.
    // 커스텀 children은 그대로 렌더 — 글자색은 사용처 Text에 지정한다.
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
          // 터치 선택 — 네이티브 기본 경로
          command.select(resolvedValue);
          onSelect?.(resolvedValue);
          onPress?.();
        }}
        className={cn(
          "relative flex-row items-center gap-2 rounded-sm px-2 py-1.5 web:cursor-default web:outline-none web:select-none",
          // 원본 data-［selected=true］data-［disabled=true］ 토큰
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

// ---------------------------------------------------------------------------
// CommandDialog — command 목록을 다이얼로그로 싣는 조합（원본 shadcn API
// 유지 — 설계 §3 명시 항목, G3 F-5 반영 이식）.
// ---------------------------------------------------------------------------

export type CommandDialogProps = DialogProps & {
  /** 스크린리더용 대화상자 이름（원본 기본 "Command Palette"） */
  title?: string;
  /** 원본의 sr-only 설명 — 유니버설 sr-only 유틸 부재로 연결을 생략한다
   *  （breadcrumb·dialog 포팅 관행） */
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
  ) => (
    <Dialog {...props}>
      <DialogContent
        ref={ref}
        // 원본의 sr-only DialogHeader（제목·설명） 근사 — 제목은 오버레이
        // 접근성 이름으로 전달한다（DialogContent → ModalOverlay）.
        accessibilityLabel={title}
        className={cn("gap-0 overflow-hidden p-0", className)}
        showCloseButton={showCloseButton}
      >
        {children}
      </DialogContent>
    </Dialog>
  ),
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
