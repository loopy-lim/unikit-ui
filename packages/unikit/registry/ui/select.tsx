// Select — shadcn/ui（new-york-v4） select.tsx 유니버설 포팅 （사이클 40, T-2a）.
// 원본: shadcn-ref/ui/select.tsx — radix Select 엔진을 제거하고 popover.tsx
// （완성된 선행 컴포넌트, 수정 금지）의 Popover/PopoverTrigger/PopoverContent를
// 조합해 직접 구현한다. 열림은 Popover（제어형 open）이, 선택 값은 이 파일의
// React state + context가 관리한다.
//
// 포팅 판단（원본 대비 차이）:
// - radix Root/Trigger/Content를 Select（값 context + Popover 래핑）SelectTrigger
//   （PopoverTrigger + combobox role）SelectContent（PopoverContent + ScrollView
//   목록）로 재구성. 원본 10종 export（API）는 전량 유지한다.
// - 원본 SelectValue는 닫힌 상태에서도 항목 라벨을 보여준다（radix가 내부 캐시
//   유지）. 포팅은 콘텐츠가 언마운트되므로 2단 조회로 근사: （1） 루트가 children
//   정적 트리를 순회해 SelectItem（value→라벨）을 수집 — 초기/defaultValue 표시
//   대응, （2） SelectItem이 마운트될 때마다 라벨을 context에 등록（동적 목록요소
//   children 대응）. 라벨을 문자열로 얻을 수 없으면 value 문자열을 보여준다（한계）.
// - position（"item-aligned"|"popper"）은 시그니처만 유지 — radix의 선택 항목
//   정렬팝퍼 오프셋은 재현 불가, AnchoredOverlay의 앵커 배치로 근사된다.
// - SelectScrollUpButton/DownButton은 API 유지용 표시 컴포넌트로만 export —
//   radix의 오버플로우 감지 자동 표시는 불가해 SelectContent가 기본 렌더하지
//   않는다（목록은 ScrollView로 터치/휠 스크롤）.
// - 아이콘: ChevronDownIcon（트리거）CheckIcon（항목 표시자）ChevronUpIcon/
//   DownIcon（스크롤 버튼） — 브리지 lucide 아이콘 프리미티브（dropdown-menu 관행）.
// - 원본의 data-［state］data-［placeholder］*:data-［slot=］［&_svg］ 셀렉터 클래스는
//   조건부 클래스내부 Text 지정으로 전개（data 속성 부재）.
// - aria-invalid:* 트리거 토큰은 PressableProps의 aria-invalid 전달（웹 DOM）과
//   web:aria-invalid: 클래스로 유지.
// - 임의값 근사: min-w-［8rem］→min-w-32（동일 8rem）, ring-［3px］→ring-3（비대괄호
//   계단 — 사이클 72 원본 규격 정렬）, max-h-（--radix-）→max-h-96,
//   transition-［］→web:transition-all. dark: 제거.
// - 카드 키보드 탐색（사이클 90 해소 — 웹 전용）: 트리거 ArrowDown/Up 열림에
//   이어 카드 안에서 ArrowDown/Up（양 끝 루프）Home/End로 항목 DOM 포커스를
//   옮긴다 — lib/menu-nav 공유 골격. 항목은 웹 <button>이라 엔터 선택은 브라우저
//   기본 동작. 항목 pointerenter 포커스 이동도 골격이 제공한다（radix 정합）.
//   개방 시 포커스는 첫 항목으로 간다（근사 — radix는 선택된 항목을 우선
//   포커스한다）. 네이티브 View는 onKeyDown을 폐기한다（브리지 계약 한계）.
// - 미지원（로드맵）: 타입어헤드, 등장/퇴장 애니메이션, name/required
//   폼 제출용 숨은 input, 항목 textValue 프로퍼티, SelectValue 함수형 children.
// - 접근성: 트리거 combobox role + popover가 부여하는 aria-expandedaria-controls
//   （↔ 콘텐츠 nativeID）, 콘텐츠 listbox role, 항목 option + aria-selected.
//   RN은 combobox를 accessibilityState.expanded로 일부 반영하며 listbox/option
//   role은 카탈로그에 없어 무시될 수 있다（브리지 계약 문서화 방침）.
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
  Pressable,
  ScrollView,
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
import { cva } from "class-variance-authority";

import { Popover, PopoverContent, PopoverTrigger } from "./popover";
import type { OverlayAlign, OverlayPlacement } from "@/lib/overlay";
import {
  composeMenuItemFocus,
  composeMenuItemHoverIn,
  composeMenuNavKeyDown,
  MenuNavContext,
  useMenuItemRef,
  useMenuNav,
  useMenuNavContext,
} from "@/lib/menu-nav";
import { cn } from "@/lib/utils";

// ---------------------------------------------------------------------------
// 내부 유틸
// ---------------------------------------------------------------------------

/** 문자열/숫자 자식만 이어 붙여 라벨을 뽑는다 — 요소 자식은 undefined（한계）. */
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

/**
 * 자식 중 문자열/숫자를 내부 Text로 감싼다 — 네이티브는 Text 없이 문자열을
 * 렌더할 수 없고 색 상속도 되지 않는다（이중 지정）. 요소 자식은 그대로 둔다.
 */
function wrapTextChildren(children: ReactNode, textClassName: string) {
  return Children.map(children, (child) =>
    typeof child === "string" || typeof child === "number" ? (
      <Text className={textClassName}>{child}</Text>
    ) : (
      child
    ),
  );
}

/**
 * children 정적 트리에서 SelectItem（value→라벨）을 수집한다 — 콘텐츠가 언마운트된
 * 닫힘 상태에서 SelectValue가 라벨을 보여주기 위한 1단 조회（머리 주석）.
 * SelectContentSelectGroup 컨테이너만 들어가고, 그 외 래퍼는 관통하지 않는다.
 */
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
        if (label !== undefined) labels[props.value] = label;
      }
      return;
    }
    if (child.type === SelectContent || child.type === SelectGroup) {
      collectItemLabels(props.children, labels);
    }
  });
}

// ---------------------------------------------------------------------------
// 값 상태 context
// ---------------------------------------------------------------------------

type SelectContextValue = {
  open: boolean;
  setOpen: (open: boolean) => void;
  value: string;
  /** 항목 선택 확정 — 값 반영 + popover 닫음 */
  setValue: (value: string) => void;
  /** 루트 disabled — 트리거에 전파（radix Root disabled 관행） */
  disabled: boolean;
  /** 열린 콘텐츠에서 항목이 자기 라벨을 등록（2단 조회 — 동적 목록 대응） */
  registerLabel: (value: string, label: string) => void;
  /** value → 표시 라벨（등록값 → 정적 수집값 → value 문자열 폴백） */
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

// ---------------------------------------------------------------------------
// 컴포넌트
// ---------------------------------------------------------------------------

export type SelectProps = ViewProps & {
  value?: string;
  defaultValue?: string;
  onValueChange?: (value: string) => void;
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  /** 트리거 비활성화（radix Root disabled） */
  disabled?: boolean;
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
      children,
      ...props
    },
    ref,
  ) => {
    // 비제어 상태 — 제어（값열림 지정）면 무시된다.
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

    // 라벨 2단 조회 상태 — 정적 수집（트리 순회） + 항목 마운트 등록.
    const [runtimeLabels, setRuntimeLabels] = useState<
      Record<string, string>
    >({});
    const registerLabel = useCallback((itemValue: string, label: string) => {
      setRuntimeLabels((prev) =>
        prev[itemValue] === label
          ? prev
          : { ...prev, [itemValue]: label },
      );
    }, []);
    const staticLabels = useMemo(() => {
      const labels: Record<string, string> = {};
      collectItemLabels(children, labels);
      return labels;
    }, [children]);
    const labelOf = useCallback(
      (itemValue: string) =>
        runtimeLabels[itemValue] ?? staticLabels[itemValue] ?? itemValue,
      [runtimeLabels, staticLabels],
    );

    const contextValue = useMemo<SelectContextValue>(
      () => ({
        open: isOpen,
        setOpen,
        value: current,
        setValue,
        disabled: disabled ?? false,
        registerLabel,
        labelOf,
      }),
      [isOpen, setOpen, current, setValue, disabled, registerLabel, labelOf],
    );

    return (
      <Popover ref={ref} open={isOpen} onOpenChange={setOpen} {...props}>
        <SelectContext.Provider value={contextValue}>
          {children}
        </SelectContext.Provider>
      </Popover>
    );
  },
);
Select.displayName = "Select";

// 트리거 — 원본 토큰에서 data-size/셀렉터류를 cva size조건부 클래스로 전개.
// w-fit → self-start（tabs.tsx 관행）, focus 링은 원본 규격（ring-3 무오프셋） 준수.
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
    // radix 관행 — 루트 disabled와 트리거 disabled는 OR로 합쳐진다.
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
      // 원본 data-［placeholder］:text-muted-foreground（트리거）를 여기서 조건부로.
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
  /** 원본 시그니처 유지 — item-aligned/popper 구분 없이 앵커 배치로 근사（무시） */
  position?: "item-aligned" | "popper";
  /** 트리거 기준 전개 방향（기본 bottom — popover 기본값） */
  side?: OverlayPlacement;
  /** 트리거 변 기준 정렬（기본 center — 원본 기본값） */
  align?: OverlayAlign;
  /** 트리거와의 간격 px（기본 4 — popover 기본값） */
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
    // 카드 키보드 탐색（사이클 90） — 항목 등록·방향키 루빙은 lib/menu-nav.
    const nav = useMenuNav();
    return (
      <PopoverContent
        ref={ref}
        side={side}
        align={align}
        sideOffset={sideOffset}
        // radix Select Content의 role（listbox） 치환 — popover 기본 dialog를
        // 덮는다. nativeID는 popover 기본값（트리거 aria-controls와 연결됨） 유지.
        accessibilityRole="listbox"
        nativeID={nativeID}
        onKeyDown={composeMenuNavKeyDown(nav, onKeyDown)}
        // popover 카드 기본 w-72 p-4를 셀렉트 목록용으로 무효화（twMerge 병합）
        className={cn("w-auto min-w-32 p-0 web:shadow-md", className)}
        {...props}
      >
        {/* 목록 뷰포트 — 원본 Viewport p-1. ScrollView로 양측 실제 스크롤
            (웹 overflow div ... 네이티브 RN ScrollView). max-h는 원본
            --radix-...available-height의 표준 계단 근사. */}
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
      {/* 이중 지정: 전경색은 내부 Text에（네이티브 색 상속 불가） */}
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
  /** 선택 콜백 — 선택 후 popover가 닫힌다（원본 preventDefault 닫기 방지 미지원） */
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
    // 열린 콘텐츠 안에서 라벨 등록 — 동적 목록정적 수집 놓침 보완（머리 주석）.
    useEffect(() => {
      if (label !== undefined) select.registerLabel(value, label);
    }, [select, value, label]);
    // 키보드 탐색 등록（사이클 90） — 카드 밖 렌더는 nav가 없어도 동작.
    const nav = useMenuNavContext();
    const { id, attach, nodeRef } = useMenuItemRef(ref);
    return (
      <Pressable
        ref={attach}
        accessibilityRole="option"
        aria-selected={selected}
        disabled={disabled}
        // 포인터 진입 항목으로 포커스 이동（radix pointerenter 정합 — 하이라이트와
        // DOM 포커스가 일치해야 Enter가 가리키는 항목을 선택한다, 사이클 90）.
        onHoverIn={composeMenuItemHoverIn(nav, id, nodeRef, onHoverIn)}
        onFocus={composeMenuItemFocus(nav, id, onFocus)}
        onPress={() => {
          select.setValue(value);
          onSelect?.();
        }}
        className={cn(
          "relative flex-row w-full items-center gap-2 rounded-sm py-1.5 pr-8 pl-2 active:bg-accent web:cursor-default web:select-none web:outline-none web:hover:bg-accent web:focus-visible:bg-accent",
          disabled && "web:pointer-events-none opacity-50",
          className,
        )}
        {...props}
      >
        {/* 표시자 — 원본 ItemIndicator + CheckIcon（원본 슬롯 size-3.5·아이콘 size-4,
            아이콘 색은 항목 하이라이트 전경을 따른다） */}
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

// API 유지용 표시 컴포넌트 — SelectContent가 기본 렌더하지 않는다（머리 주석）.
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
