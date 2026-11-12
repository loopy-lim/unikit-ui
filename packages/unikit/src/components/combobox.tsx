// Combobox — shadcn/ui（new-york-v4） combobox.tsx 유니버설 포팅 （사이클 40, T-1e）.
// 원본: shadcn-ref/ui/combobox.tsx — @base-ui/react 헤드리스 엔진 기반이라 엔진을
// 제거하고 완성된 popover（열림 상태앵커 팝업） + command（필터키보드 선택）를
// 조합해 재구성했다（엔진 재노출형 — 원본 export 16종을 그대로 유지）.
//
// 포팅 판단（원본 대비 차이이유）:
// - @base-ui/react 제거: Combobox 루트는 Popover（제어 open 미러링） 안에
//   Command（카드 토큰 초기화）를 중첩해 렌더한다. Command를 루트에 두면
//   CommandInput/CommandItem이 루트 어디에 있어도（팝업 밖 인라인Content
//   내부） 필터와 화살표키엔터 탐색이 연결된다. 두 가지 구성 모두 지원:
//   base-ui형 <ComboboxInput showTrigger/> 단독 입력창, 전통형
//   <ComboboxTrigger><ComboboxValue/></ComboboxTrigger> + Content 내부 입력.
// - 값 상태: 원본 Root의 value/onValueChange（단일）에 values/onValuesChange
//   （다중）를 별도 prop으로 분리 — base-ui는 multiple 시 value에 배열이 실리는
//   암묵 오버로드인데 유니버설 타이핑을 위해 명시 분리가 안전하다. multiple
//   지정 시 항목 선택은 values 토글（팝업 유지）, 미지정 시 확정 후 팝업 닫기.
//   지우기（Clear/×）의 "값 없음" 표현은 onValueChange（""） 관례（radio-group의
//   "" 기본값과 정합）를 쓴다. ComboboxValue도 빈 문자열을 미선택으로 판정해
//   플레이스홀더를 렌더한다（value != null && value !== ""）.
// - 선택값 표시: 팝업이 닫히면 브리지 Portal이 children을 언마운트해（webnative
//   동일 계약） 항목이 사라지므로, 라벨 레지스트리는 항목 언마운트 시 삭제하지
//   않는다（한 번 열린 목록의 value→label은 유지 — 목록이 동적으로 바뀌면 stale
//   라벨이 남을 수 있는 근사）. 라벨을 못 찾으면 value 문자열 폴백, 정확 표시가
//   필요하면 ComboboxValue의 children 함수로 매핑한다.
// - ComboboxInput: input-group 미이식으로 원본 InputGroup 구조（인라인 애드온）를
//   View + CommandInput + 애드온 행으로 재구성. showTrigger（▾ 토글, 기본 true）
//   showClear（× 지우기, 기본 false）는 유지. 타이핑 중 자동 개방（base-ui 동작）은
//   CommandInput이 필터 변경 훅을 노출하지 않아 미지원 — ▾ 트리거로 개방한다.
// - ComboboxContent: 원본 side/sideOffset/align 기본값（bottom/6/start） 유지.
//   alignOffsetanchor（앵커 폭 추종 CSS 변수 포함）은 AnchoredOverlay 계약
//   밖이라 미지원 — 앵커 오버라이드는 popover의 PopoverAnchor를 children에
//   넣는 조합으로, 팝업 폭은 w-72 고정（원본 w-（--anchor-width） 대체）.
// - Chips 계열: 다중 선택 칩. ChipRemove는 원본 export 목록에 없어 내부 구현
//   （× Pressable）하며 ComboboxChip의 showRemove로 노출한다.
// - 아이콘: CheckIcon·ChevronDownIcon·XIcon — 브리지 lucide 아이콘 프리미티브
//   （@unikit-bridge/ui/primitives）를 사용한다（dropdown-menu 관행）.
// - 클래스 근사: 팝업 테두리는 원본（shadcn-ref/ui/combobox.tsx:119）의
//   ring-1 ring-foreground/10에서 border border-border로 의도적 이탈 — 사유:
//   select·dropdown·popover와 내부 형제 일관성,
//   max-h-［calc（--spacing（96））］→web:max-h-96, h-［calc（--spacing（5.5））］→h-5,
//   focus-within:ring-［3px］→web:focus-within:ring-3（비대괄호 계단 — 사이클 72
//   원본 규격 정렬）, min-w-［］→
//   표준 계단, 애니메이션CSS 변수 임의값dark:pointer-coarse: 토큰 제거,
//   radix data-* 속성은 조건부 클래스로 전개.
// - 접근성: 트리거 aria-expandedaria-controls와 카드 role="dialog"는 소비하는
//   PopoverTriggerPopoverContent가, listboxoptionaria-selected는 CommandList
//   CommandItem이 제공한다. RN 한계（aria 2종 폐기role 무시）는 commandpopover
//   머리 주석 그대로 승계.
import {
  Children,
  createContext,
  forwardRef,
  useCallback,
  useContext,
  useEffect,
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
import type { OverlayAlign, OverlayPlacement } from "../lib/overlay";
import { cn } from "../lib/utils";

// ---------------------------------------------------------------------------
// 내부 유틸
// ---------------------------------------------------------------------------

/** 자식 중 문자열/숫자를 내부 Text로 감싼다 — 네이티브 색 상속 불가 대응
 *  （dropdown-menu 관행과 동일, 요소 자식은 그대로 둔다） */
function wrapTextChildren(children: ReactNode, textClassName: string) {
  return Children.map(children, (child) =>
    typeof child === "string" || typeof child === "number" ? (
      <Text className={textClassName}>{child}</Text>
    ) : (
      child
    ),
  );
}

/** value 미지정 항목의 유도값/라벨 — 최상위 문자열 children 결합（command.tsx 관행） */
function textValueOf(nodes: ReactNode): string {
  return Children.toArray(nodes)
    .filter((child): child is string => typeof child === "string")
    .join(" ")
    .trim();
}

/** 웹 <button> 포커스 아웃라인 기본 처리(소비자 클래스 우선 보존) */
const TRIGGER_RESET_CLASSES = "web:outline-none";

// ---------------------------------------------------------------------------
// 상태 context — 열림（Popover 미러）값（단일/다중）라벨 레지스트리
// ---------------------------------------------------------------------------

type ComboboxContextValue = {
  multiple: boolean;
  /** 단일 선택값（미선택 null） */
  value: string | null;
  /** 다중 선택값 목록 */
  values: string[];
  /** 항목 확정 — 단일은 값 교체+팝업 닫기, 다중은 토글+팝업 유지 */
  commitItem: (value: string) => void;
  /** 다중 목록에서 값 제거（칩 × 등） */
  removeValue: (value: string) => void;
  /** 선택 전부 지우기（ComboboxClear） */
  clear: () => void;
  open: boolean;
  setOpen: (open: boolean) => void;
  /** value→label 등록 — 언마운트 시 삭제하지 않는다（포팅 판단 참조） */
  registerItem: (value: string, label: string) => void;
  /** 등록된 라벨 맵（읽기 전용 관찰） */
  labels: Map<string, string>;
};

const ComboboxContext = createContext<ComboboxContextValue | null>(null);

function useComboboxContext(component: string): ComboboxContextValue {
  const ctx = useContext(ComboboxContext);
  if (!ctx) {
    throw new Error(`<${component}>는 <Combobox> 안에서 사용해야 합니다.`);
  }
  return ctx;
}

// ---------------------------------------------------------------------------
// 루트
// ---------------------------------------------------------------------------

export type ComboboxProps = ViewProps & {
  /** 단일 선택값（제어） */
  value?: string;
  defaultValue?: string;
  onValueChange?: (value: string) => void;
  /** 다중 선택값（제어） — multiple 조합 */
  values?: string[];
  defaultValues?: string[];
  onValuesChange?: (values: string[]) => void;
  /** 다중 선택 모드 — 항목 선택이 values 토글로 동작한다 */
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
    // 비제어 상태 — 제어（prop 지정）면 무시된다.
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
    // Popover에 제어로 전달해 열림을 미러링 — 항목 확정 시 여기서 닫는다.
    const setOpen = (next: boolean) => {
      if (open === undefined) setInternalOpen(next);
      if (next !== isOpen) onOpenChange?.(next);
    };

    // 라벨 레지스트리 — 등록만 하고 해제하지 않는다（닫힘 상태 표시 유지）.
    const labelRegistry = useRef(new Map<string, string>());
    const [, setRegistryVersion] = useState(0);
    const registerItem = useCallback((itemValue: string, label: string) => {
      labelRegistry.current.set(itemValue, label);
      setRegistryVersion((version) => version + 1);
    }, []);

    const commitItem = (itemValue: string) => {
      if (multiple) {
        const next = selectedValues.includes(itemValue)
          ? selectedValues.filter((entry) => entry !== itemValue)
          : [...selectedValues, itemValue];
        if (values === undefined) setInternalValues(next);
        onValuesChange?.(next);
        return; // 다중 선택은 팝업 유지
      }
      if (itemValue !== selectedValue) {
        if (value === undefined) setInternalValue(itemValue);
        onValueChange?.(itemValue);
      }
      setOpen(false);
    };

    const removeValue = (itemValue: string) => {
      if (multiple) {
        if (!selectedValues.includes(itemValue)) return;
        const next = selectedValues.filter((entry) => entry !== itemValue);
        if (values === undefined) setInternalValues(next);
        onValuesChange?.(next);
        return;
      }
      if (selectedValue !== itemValue) return;
      if (value === undefined) setInternalValue(null);
      onValueChange?.("");
    };

    const clear = () => {
      if (multiple) {
        if (selectedValues.length === 0) return;
        if (values === undefined) setInternalValues([]);
        onValuesChange?.([]);
      } else {
        if (selectedValue == null) return;
        if (value === undefined) setInternalValue(null);
        onValueChange?.("");
      }
    };

    return (
      <ComboboxContext.Provider
        value={{
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
        }}
      >
        <Popover open={isOpen} onOpenChange={setOpen}>
          {/* Command 중첩 — 카드 토큰（bg-popoverroundedoverflow）은 인라인
              입력...카드 이중 프레임을 만들지 않도록 초기화한다. 필터...키보드
              탐색 컨텍스트는 그대로 제공된다. */}
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

// ---------------------------------------------------------------------------
// 트리거 계열
// ---------------------------------------------------------------------------

export type ComboboxTriggerProps = PressableProps;

const ComboboxTrigger = forwardRef<BridgePressableRef, ComboboxTriggerProps>(
  ({ className, children, ...props }, ref) => (
    <PopoverTrigger
      ref={ref}
      className={cn(
        "flex flex-row items-center gap-2",
        TRIGGER_RESET_CLASSES,
        className,
      )}
      {...props}
    >
      {wrapTextChildren(children, "font-sans text-sm text-foreground")}
      {/* 원본 트리거 아이콘: size-4 text-muted-foreground — opacity-50 없음 */}
      <ChevronDownIcon className="size-4 shrink-0 text-muted-foreground" />
    </PopoverTrigger>
  ),
);
ComboboxTrigger.displayName = "ComboboxTrigger";

export type ComboboxValueProps = Omit<ViewProps, "children"> & {
  /** 미선택 시 표시（문자열 권장） */
  placeholder?: ReactNode;
  /** 문자열이면 선택 라벨 표시, 함수면 （label）을 받아 자유 렌더 — 라벨은
   *  다중 선택 시 ", " 결합, 못 찾으면 value 폴백, 미선택이면 null */
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
  /** 인라인 ▾ 토글 표시（기본 true） */
  showTrigger?: boolean;
  /** 인라인 × 지우기 표시（기본 false） */
  showClear?: boolean;
  /** children은 래퍼 클래스로 해석된다（인라인 애드온 행 — 포팅 판단 참조） */
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
  ) => (
    // 원본 InputGroup（미이식） 구조를 검색 행으로 재구성 — 하단 보더는
    // Content 내부 배치（전통형）에서 목록과 구분선을 이룬다.
    <View
      className={cn(
        "flex-none flex-row items-center border-b border-border h-9",
        className,
      )}
    >
      <CommandInput
        ref={ref}
        disabled={disabled}
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
  ),
);
ComboboxInput.displayName = "ComboboxInput";

// ---------------------------------------------------------------------------
// 팝업 계열
// ---------------------------------------------------------------------------

export type ComboboxContentProps = ViewProps & {
  /** 전개 방향（기본 bottom — 원본 기본값） */
  side?: OverlayPlacement;
  /** 앵커 변 기준 정렬（기본 start — 원본 기본값） */
  align?: OverlayAlign;
  /** 앵커와의 간격 px（기본 6 — 원본 기본값） */
  sideOffset?: number;
};

const ComboboxContent = forwardRef<BridgeViewRef, ComboboxContentProps>(
  (
    {
      className,
      side = "bottom",
      align = "start",
      sideOffset = 6,
      children,
      ...props
    },
    ref,
  ) => (
    // PopoverContent 기본 카드（w-72p-4border）를 원본 팝업 토큰으로 오버라이드.
    // 테두리는 popover 기본 border border-border를 통과시킨다 — select·dropdown
    // 과 형제 일관성（원본 ring 대비 의도적 이탈 — 머리 주석 참조）.
    <PopoverContent
      ref={ref}
      side={side}
      align={align}
      sideOffset={sideOffset}
      className={cn(
        "p-0 web:max-h-96 web:overflow-y-auto web:shadow-md",
        className,
      )}
      {...props}
    >
      {children}
    </PopoverContent>
  ),
);
ComboboxContent.displayName = "ComboboxContent";

export type ComboboxListProps = CommandListProps;

const ComboboxList = forwardRef<BridgeScrollViewRef, ComboboxListProps>(
  ({ className, ...props }, ref) => (
    // 원본 List p-1스크롤 — CommandList（브리지 ScrollView, listbox role） 소비
    <CommandList ref={ref} className={cn("p-1", className)} {...props} />
  ),
);
ComboboxList.displayName = "ComboboxList";

export type ComboboxEmptyProps = ViewProps;

const ComboboxEmpty = forwardRef<BridgeViewRef, ComboboxEmptyProps>(
  ({ className, ...props }, ref) => (
    // 원본 py-2 — CommandEmpty 기본 py-6을 오버라이드
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

/** API 호환용 투명 래퍼 — base-ui Collection의 그룹 묶음 역할을 View로 근사 */
export type ComboboxCollectionProps = ViewProps;

const ComboboxCollection = forwardRef<BridgeViewRef, ComboboxCollectionProps>(
  ({ ...props }, ref) => <View ref={ref} {...props} />,
);
ComboboxCollection.displayName = "ComboboxCollection";

export type ComboboxItemProps = PressableProps & {
  /** 항목값 — 미지정 시 최상위 문자열 children에서 유도（command 관행） */
  value?: string;
  /** 필터 추가 검색어（cmdk keywords） */
  keywords?: string[];
  /** 선택 확정 콜백 — 터치 onPress와 웹 Enter가 호출 */
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

    // 라벨 등록（해제 없음 — 포팅 판단 참조）
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
        {/* 표시자 — 원본 ItemIndicator + CheckIcon（원본 슬롯 size-4·아이콘 size-4） */}
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

// ---------------------------------------------------------------------------
// 다중 선택 칩 계열
// ---------------------------------------------------------------------------

export type ComboboxChipsProps = ViewProps;

const ComboboxChips = forwardRef<BridgeViewRef, ComboboxChipsProps>(
  ({ className, ...props }, ref) => (
    <View
      ref={ref}
      className={cn(
        // 원본 px-2.5 py-1.5 shadow-xs（칩이 있을 때 px-1.5는 has- 셀렉터 미지원으로 고정）.
        "min-h-9 flex-row flex-wrap items-center gap-1.5 rounded-md border border-input px-2.5 py-1.5 web:focus-within:border-ring web:focus-within:ring-3 web:focus-within:ring-ring/50",
        className,
      )}
      {...props}
    />
  ),
);
ComboboxChips.displayName = "ComboboxChips";

export type ComboboxChipProps = ViewProps & {
  /** 이 칩이 나타내는 선택값 — × 제거에 쓰인다 */
  value: string;
  /** × 제거 버튼 표시（기본 true） */
  showRemove?: boolean;
};

const ComboboxChip = forwardRef<BridgeViewRef, ComboboxChipProps>(
  ({ className, value, showRemove = true, children, ...props }, ref) => {
    const combobox = useComboboxContext("ComboboxChip");
    return (
      <View
        ref={ref}
        className={cn(
          // 원본 h-［calc（--spacing（5.5））］（22px） → h-5 근사
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
            // 원본 ChipRemove Button: -ml-1 opacity-50 hover:opacity-100.
            className={cn(
              TRIGGER_RESET_CLASSES,
              "-ml-1 opacity-50 web:hover:opacity-100",
            )}
            onPress={() => combobox.removeValue(value)}
          >
            {/* 원본은 아이콘 크기 클래스가 없다 — 부모 icon-xs 버튼의
                ［&_svg］:size-3 규칙이 자식 셀렉터라 미지원, 직접 size-3 명시（G3）. */}
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
  // CommandInput 소비 — 칩 행 안 검색 입력. ⌕ 글리프 포함（검색 맥락）.
  <CommandInput
    ref={ref}
    className={cn("h-8 min-w-16 flex-1 border-0 px-1", className)}
    {...props}
  />
));
ComboboxChipsInput.displayName = "ComboboxChipsInput";

// ---------------------------------------------------------------------------
// 앵커 훅
// ---------------------------------------------------------------------------

/**
 * 앵커 ref 팩토리 — 원본 useComboboxAnchor（HTMLElement）의 브리지 치환.
 * 소비: <View ref={anchor}> 요소를 <PopoverAnchor>로 감싸면 ComboboxContent의
 * 앵커가 트리거 대신 그 요소로 오버라이드된다（popover 조합）.
 */
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
