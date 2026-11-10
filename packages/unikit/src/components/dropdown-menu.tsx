// DropdownMenu — shadcn/ui（new-york-v4） dropdown-menu.tsx 유니버설 포팅 （사이클 40, T-1d）.
// 원본: shadcn-ref/ui/dropdown-menu.tsx
//
// 포팅 판단（원본 대비 차이이유）:
// - radix DropdownMenu 엔진 제거 — 열림 상태는 React state + context（rootsub
//   radio-group 3종）로 관리하고, 오버레이는 lib/overlay의 AnchoredOverlay
//   （measureInWindow 기반 앵커 팝업 골격）가 대체한다（포털오프셋뷰포트 클램프
//   포함）. 원본의 Portal 컴포넌트는 API 호환용 투명 래퍼로 남긴다.
// - 원본의 data-statedata-variantdata-inset［&_svg］ 속성/자손 셀렉터 클래스는
//   네이티브에 data 속성이 없어 조건부 클래스 문자열로 전개한다.
// - 서브메뉴（Sub 계열）: 1단계 근사가 아니라 중첩 AnchoredOverlay로 실제 서브메뉴를
//   구현했다. 복잡도 판단 — SubTrigger 눌림으로 열고 닫는다: radix의 hover로 열기
//   지연은 포인터 개념이라 브리지 계약（onHoverIn 부재）으로 재현 불가하고, 눌림
//   방식이 터치에서도 동일하게 동작한다. Sub 열림 상태는 Sub 내부 state（비제어）
//   로만 관리（원본의 open/onOpenChange 제어 변형 미지원）. ESC는 서브루트가 동시에
//   닫힌다（useDismiss가 document 단위라 개별 소멸 불가 — 근사）.
// - 아이콘: lucide 금지 → checkbox.tsxradio-group.tsx 관행에 따라 CheckIcon은 ✓
//   글리프 Text, CircleIcon은 점 View（size-2 rounded-full）, ChevronRightIcon은 ›
//   글리프 Text로 대체.
// - 트리거: radix asChild 미지원 — 트리거 자체가 브리지 Pressable（웹 <button>）이라
//   UA 기본 버튼 스타일만 리셋하고 외관은 사용처 className에 맡긴다（Button 등
//   컴포넌트를 자식으로 넣으면 웹에서 button 중첩이 되니 문자열/텍스트 계열 권장）.
// - 항목 onSelect는 원본 이벤트 인자（preventDefault로 닫기 방지） 없이 무인자
//   콜백으로 단순화 — 선택 시 항상 메뉴가 닫힌다.
// - 미지원（로드맵）: 등장/퇴장 애니메이션（animate-inorigin 변형）, 화살표키
//   타입어헤드루프 탐색, alignOffsetavoidCollisions 등 포퍼 세부 옵션.
//   （바깥 포인터 눌림 닫기는 AnchoredOverlay 투명 백드롭이 제공한다 —
//   G3 리뷰 주석 정합 갱신）
//   항목은 Pressable이라 웹에서 Tab 포커스엔터 선택은 동작하고 AnchoredOverlay의
//   포커스 이동（열림 시 첫 포커서블）ESC 닫기스크롤/리사이즈 재배치가 붙는다.
// - 클래스 근사: min-w-［8rem］→min-w-32（표준 계단）, max-h-（--radix-available-
//   height）→web:max-h-96, outline-hidden→web:outline-none, radix data-［state=open］
//   하이라이트→active:+web:hover:+web:focus-visible: 조건부 전개, shadow-md
//   스크롤류는 web: 접두, dark: 제거, 커서/선택 계열은 웹 전용 개념이라 web: 접두.
// - 접근성: Content=role "menu", ItemSubTrigger="menuitem", CheckboxItem
//   RadioItem은 aria-checked, TriggerSubTrigger는 aria-expandedaria-controls
//   （useId 토대로 Content nativeID와 결정적 연결）. RN 한계 — "menu""menuitem" role
//   은 RN accessibilityRole 카탈로그에 없어 네이티브에서 무시된다（브리지 문서화
//   방침, 웹 스크린리더만 이득）, aria-haspopup은 브리지 PressableProps 계약에
//   없어 생략, 키보드 탐색은 위 미지원 항목 참조.
import {
  Children,
  createContext,
  forwardRef,
  useContext,
  useId,
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
import { cn } from "../lib/utils";

// ---------------------------------------------------------------------------
// 내부 유틸
// ---------------------------------------------------------------------------

type PressableRefObject = { current: BridgePressableRef | null };

/** 트리거의 외부 forwardRef와 앵커 측정용 내부 ref를 한 콜백으로 합성한다. */
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

/**
 * 자식 중 문자열/숫자를 내부 Text로 감싼다 — 네이티브는 Text 없이 문자열을
 * 렌더할 수 없고 색 상속도 되지 않는다（이중 지정）. 요소 자식（Shortcut 등）은
 * 그대로 둔다（table.tsx 관행 — 사용자 정의 콘텐츠는 직접 Text를 넣는다）.
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

// ---------------------------------------------------------------------------
// 상태 context — root（열림）sub（서브메뉴）radio-group（단일 선택）
// ---------------------------------------------------------------------------

type DropdownMenuContextValue = {
  open: boolean;
  setOpen: (open: boolean) => void;
  /** 콘텐츠（AnchoredOverlay）가 앵커로 측정할 트리거 요소 ref */
  triggerRef: PressableRefObject;
  /** 트리거 aria-controls ↔ 콘텐츠 nativeID 연결용 토대 ID */
  baseId: string;
};

const DropdownMenuContext = createContext<DropdownMenuContextValue | null>(null);

function useDropdownMenuContext(component: string): DropdownMenuContextValue {
  const ctx = useContext(DropdownMenuContext);
  if (!ctx) {
    throw new Error(`<${component}>는 <DropdownMenu> 안에서 사용해야 합니다.`);
  }
  return ctx;
}

type DropdownMenuSubContextValue = {
  open: boolean;
  setOpen: (open: boolean) => void;
  triggerRef: PressableRefObject;
  baseId: string;
};

const DropdownMenuSubContext = createContext<DropdownMenuSubContextValue | null>(
  null,
);

function useDropdownMenuSubContext(
  component: string,
): DropdownMenuSubContextValue {
  const ctx = useContext(DropdownMenuSubContext);
  if (!ctx) {
    throw new Error(`<${component}>는 <DropdownMenuSub> 안에서 사용해야 합니다.`);
  }
  return ctx;
}

type DropdownMenuRadioGroupContextValue = {
  value: string;
  onItemSelect: (value: string) => void;
};

// 기본값 — 그룹 밖 RadioItem도 크래시 없이 동작（radio-group.tsx 관행）.
const DropdownMenuRadioGroupContext =
  createContext<DropdownMenuRadioGroupContextValue>({
    value: "",
    onItemSelect: () => {},
  });

// ---------------------------------------------------------------------------
// 공통 클래스 상수
// ---------------------------------------------------------------------------

// 메뉴 카드 — 원본 콘텐츠 토큰 + 골격 요구 pointer-events-auto（§규칙 6）.
const CARD_CLASSES =
  "pointer-events-auto z-50 min-w-32 rounded-md border border-border bg-popover p-1 text-popover-foreground web:max-h-96 web:overflow-x-hidden web:overflow-y-auto web:shadow-md";

// 일반 항목 — 기본 상호작용 및 커서/선택 방지/포커스 아웃라인.
const ITEM_CLASSES =
  "relative flex-row items-center gap-2 rounded-sm px-2 py-1.5 web:cursor-default web:select-none web:outline-none";

// 일반 항목 하이라이트 — radix 하이라이트（focus）를 active（네이티브 눌림）+hover/focus-visible으로.
const ITEM_HIGHLIGHT_CLASSES =
  "active:bg-accent web:hover:bg-accent web:focus-visible:bg-accent";

// 표시자（체크/라디오） 항목 — 왼쪽 pl-8 표시자 슬롯（원본 py-1.5 pr-2 pl-8）.
const INDICATED_ITEM_CLASSES =
  "relative flex-row items-center gap-2 rounded-sm py-1.5 pr-2 pl-8 active:bg-accent web:cursor-default web:select-none web:outline-none web:hover:bg-accent web:focus-visible:bg-accent";

// 항목 텍스트 — 네이티브 색 상속 불가로 항목마다 명시（이중 지정）.
const ITEM_TEXT_CLASSES = "flex-1 font-sans text-sm text-popover-foreground";

// 표시자 슬롯 — 원본 span（pointer-events-none absolute left-2 size-3.5）.
const INDICATOR_SLOT_CLASSES =
  "absolute left-2 size-3.5 items-center justify-center web:pointer-events-none";

// 트리거 리셋 — 포커스 아웃라인 기본 처리(소비자 클래스 우선 보존).
const TRIGGER_RESET_CLASSES = "web:outline-none";

// ---------------------------------------------------------------------------
// 컴포넌트
// ---------------------------------------------------------------------------

export type DropdownMenuProps = ViewProps & {
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
};

const DropdownMenu = forwardRef<BridgeViewRef, DropdownMenuProps>(
  (
    { open, defaultOpen = false, onOpenChange, className, children, ...props },
    ref,
  ) => {
    // 비제어 상태 — 제어（open 지정）면 무시된다.
    const [internalOpen, setInternalOpen] = useState(defaultOpen);
    const isOpen = open !== undefined ? open : internalOpen;
    const setOpen = (next: boolean) => {
      if (open === undefined) setInternalOpen(next);
      if (next !== isOpen) onOpenChange?.(next);
    };
    const triggerRef = useRef<BridgePressableRef | null>(null);
    const baseId = useId();
    return (
      <DropdownMenuContext.Provider
        value={{ open: isOpen, setOpen, triggerRef, baseId }}
      >
        {/* w-fit 미지원 — kbd.tsx 관행의 self-start（교차축 시작 정렬）로 트리거
            폭 수축. 풀폭 트리거는 사용처 className(self-stretch)으로. */}
        <View ref={ref} className={cn("self-start", className)} {...props}>
          {children}
        </View>
      </DropdownMenuContext.Provider>
    );
  },
);
DropdownMenu.displayName = "DropdownMenu";

/** API 호환용 투명 래퍼 — 포털은 AnchoredOverlay 골격이 대체（forceMountcontainer 미지원）. */
export type DropdownMenuPortalProps = { children?: ReactNode };

function DropdownMenuPortal({ children }: DropdownMenuPortalProps) {
  return <>{children}</>;
}

export type DropdownMenuTriggerProps = PressableProps;

const DropdownMenuTrigger = forwardRef<
  BridgePressableRef,
  DropdownMenuTriggerProps
>(
  (
    { className, children, disabled, onPress, ...props },
    ref,
  ) => {
    const menu = useDropdownMenuContext("DropdownMenuTrigger");
    const contentId = `${menu.baseId}-dropdown-menu-content`;
    return (
      <Pressable
        ref={composeRefs(ref, menu.triggerRef)}
        accessibilityRole="button"
        aria-expanded={menu.open}
        aria-controls={contentId}
        disabled={disabled}
        onPress={() => {
          menu.setOpen(!menu.open);
          onPress?.();
        }}
        className={cn(TRIGGER_RESET_CLASSES, className)}
        {...props}
      >
        {wrapTextChildren(children, "font-sans text-sm text-foreground")}
      </Pressable>
    );
  },
);
DropdownMenuTrigger.displayName = "DropdownMenuTrigger";

export type DropdownMenuContentProps = ViewProps & {
  /** 트리거 기준 전개 방향（기본 bottom） */
  side?: OverlayPlacement;
  /** 트리거 변 기준 정렬（기본 start） */
  align?: OverlayAlign;
  /** 트리거와의 간격 px（원본 sideOffset, 기본 4） */
  sideOffset?: number;
};

const DropdownMenuContent = forwardRef<
  BridgeViewRef,
  DropdownMenuContentProps
>(
  (
    {
      className,
      side = "bottom",
      align = "start",
      sideOffset = 4,
      children,
      ...props
    },
    ref,
  ) => {
    const menu = useDropdownMenuContext("DropdownMenuContent");
    return (
      <AnchoredOverlay
        visible={menu.open}
        onClose={() => menu.setOpen(false)}
        anchorRef={menu.triggerRef}
        placement={side}
        align={align}
        offset={sideOffset}
        className="z-50"
        accessibilityRole="menu"
      >
        <View
          ref={ref}
          nativeID={`${menu.baseId}-dropdown-menu-content`}
          className={cn(CARD_CLASSES, className)}
          {...props}
        >
          {children}
        </View>
      </AnchoredOverlay>
    );
  },
);
DropdownMenuContent.displayName = "DropdownMenuContent";

export type DropdownMenuGroupProps = ViewProps;

const DropdownMenuGroup = forwardRef<BridgeViewRef, DropdownMenuGroupProps>(
  ({ ...props }, ref) => <View ref={ref} {...props} />,
);
DropdownMenuGroup.displayName = "DropdownMenuGroup";

export type DropdownMenuItemProps = Omit<PressableProps, "onPress"> & {
  inset?: boolean;
  variant?: "default" | "destructive";
  /** 항목 선택 콜백 — 선택 후 메뉴가 닫힌다（원본 preventDefault 닫기 방지 미지원） */
  onSelect?: () => void;
  children?: ReactNode;
};

const DropdownMenuItem = forwardRef<BridgePressableRef, DropdownMenuItemProps>(
  (
    {
      className,
      inset,
      variant = "default",
      disabled,
      onSelect,
      children,
      ...props
    },
    ref,
  ) => {
    const menu = useDropdownMenuContext("DropdownMenuItem");
    const destructive = variant === "destructive";
    return (
      <Pressable
        ref={ref}
        accessibilityRole="menuitem"
        disabled={disabled}
        onPress={() => {
          onSelect?.();
          menu.setOpen(false);
        }}
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
          cn(ITEM_TEXT_CLASSES, destructive && "text-destructive"),
        )}
      </Pressable>
    );
  },
);
DropdownMenuItem.displayName = "DropdownMenuItem";

export type DropdownMenuCheckboxItemProps = Omit<
  PressableProps,
  "onPress" | "aria-checked"
> & {
  /** 제어형 체크 상태（미지정 시 내부 state） */
  checked?: boolean;
  defaultChecked?: boolean;
  onCheckedChange?: (checked: boolean) => void;
  onSelect?: () => void;
  children?: ReactNode;
};

const DropdownMenuCheckboxItem = forwardRef<
  BridgePressableRef,
  DropdownMenuCheckboxItemProps
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
      ...props
    },
    ref,
  ) => {
    const menu = useDropdownMenuContext("DropdownMenuCheckboxItem");
    // 제어/비제어 통합 — checkbox.tsx와 동일 구조.
    const [uncontrolled, setUncontrolled] = useState(defaultChecked);
    const isChecked = checked !== undefined ? checked : uncontrolled;
    return (
      <Pressable
        ref={ref}
        accessibilityRole="menuitem"
        aria-checked={isChecked}
        disabled={disabled}
        onPress={() => {
          const next = !isChecked;
          if (checked === undefined) setUncontrolled(next);
          onCheckedChange?.(next);
          onSelect?.();
          menu.setOpen(false);
        }}
        className={cn(
          INDICATED_ITEM_CLASSES,
          disabled && "web:pointer-events-none opacity-50",
          className,
        )}
        {...props}
      >
        {/* 표시자 — 원본 ItemIndicator + CheckIcon */}
        <View aria-hidden className={INDICATOR_SLOT_CLASSES}>
          {isChecked ? (
            <CheckIcon className="size-3.5 text-foreground" />
          ) : null}
        </View>
        {wrapTextChildren(children, ITEM_TEXT_CLASSES)}
      </Pressable>
    );
  },
);
DropdownMenuCheckboxItem.displayName = "DropdownMenuCheckboxItem";

export type DropdownMenuRadioGroupProps = ViewProps & {
  value?: string;
  defaultValue?: string;
  onValueChange?: (value: string) => void;
};

const DropdownMenuRadioGroup = forwardRef<
  BridgeViewRef,
  DropdownMenuRadioGroupProps
>(
  (
    { value, defaultValue = "", onValueChange, children, ...props },
    ref,
  ) => {
    // 제어/비제어 통합 — 라디오는 단일 선택이라 문자열 state면 충분하다.
    const [uncontrolled, setUncontrolled] = useState(defaultValue);
    const selected = value !== undefined ? value : uncontrolled;
    return (
      <DropdownMenuRadioGroupContext.Provider
        value={{
          value: selected,
          onItemSelect: (itemValue) => {
            if (value === undefined) setUncontrolled(itemValue);
            onValueChange?.(itemValue);
          },
        }}
      >
        <View ref={ref} {...props}>
          {children}
        </View>
      </DropdownMenuRadioGroupContext.Provider>
    );
  },
);
DropdownMenuRadioGroup.displayName = "DropdownMenuRadioGroup";

export type DropdownMenuRadioItemProps = Omit<
  PressableProps,
  "onPress" | "aria-checked"
> & {
  /** 이 항목의 값 — 그룹 value와의 일치 여부가 선택 상태가 된다 */
  value: string;
  onSelect?: () => void;
  children?: ReactNode;
};

const DropdownMenuRadioItem = forwardRef<
  BridgePressableRef,
  DropdownMenuRadioItemProps
>(({ className, value, onSelect, disabled, children, ...props }, ref) => {
  const menu = useDropdownMenuContext("DropdownMenuRadioItem");
  const group = useContext(DropdownMenuRadioGroupContext);
  const isChecked = group.value === value;
  return (
    <Pressable
      ref={ref}
      accessibilityRole="menuitem"
      aria-checked={isChecked}
      disabled={disabled}
      onPress={() => {
        group.onItemSelect(value);
        onSelect?.();
        menu.setOpen(false);
      }}
      className={cn(
        INDICATED_ITEM_CLASSES,
        disabled && "web:pointer-events-none opacity-50",
        className,
      )}
      {...props}
    >
      {/* 표시자 — 원본 ItemIndicator + CircleIcon（fill-current size-2） 대신 점
          View(radio-group.tsx 관행). 배경이 popover라 foreground 점. */}
      <View aria-hidden className={INDICATOR_SLOT_CLASSES}>
        {isChecked ? (
          <View className="size-2 rounded-full bg-foreground" />
        ) : null}
      </View>
      {wrapTextChildren(children, ITEM_TEXT_CLASSES)}
    </Pressable>
  );
});
DropdownMenuRadioItem.displayName = "DropdownMenuRadioItem";

export type DropdownMenuLabelProps = ViewProps & {
  inset?: boolean;
};

const DropdownMenuLabel = forwardRef<BridgeViewRef, DropdownMenuLabelProps>(
  ({ className, inset, children, ...props }, ref) => (
    <View
      ref={ref}
      className={cn("px-2 py-1.5", inset && "pl-8", className)}
      {...props}
    >
      {wrapTextChildren(
        children,
        "font-sans text-sm font-medium text-popover-foreground",
      )}
    </View>
  ),
);
DropdownMenuLabel.displayName = "DropdownMenuLabel";

export type DropdownMenuSeparatorProps = ViewProps;

const DropdownMenuSeparator = forwardRef<
  BridgeViewRef,
  DropdownMenuSeparatorProps
>(({ className, ...props }, ref) => (
  <View
    ref={ref}
    accessibilityRole="separator"
    className={cn("-mx-1 my-1 h-px bg-border", className)}
    {...props}
  />
));
DropdownMenuSeparator.displayName = "DropdownMenuSeparator";

export type DropdownMenuShortcutProps = TextProps;

const DropdownMenuShortcut = forwardRef<
  BridgeTextRef,
  DropdownMenuShortcutProps
>(({ className, ...props }, ref) => (
  // 항목 flex-row의 직계 자식이 되므로 ml-auto가 양쪽 플랫폼에서 동작한다.
  <Text
    ref={ref}
    className={cn(
      "ml-auto font-sans text-xs tracking-widest text-muted-foreground",
      className,
    )}
    {...props}
  />
));
DropdownMenuShortcut.displayName = "DropdownMenuShortcut";

export type DropdownMenuSubProps = { children?: ReactNode };

function DropdownMenuSub({ children }: DropdownMenuSubProps) {
  // 서브 열림은 비제어 — 눌림 토글로만 조작（원본 open/onOpenChange 제어 미지원）.
  const [open, setOpen] = useState(false);
  const triggerRef = useRef<BridgePressableRef | null>(null);
  const baseId = useId();
  return (
    <DropdownMenuSubContext.Provider
      value={{ open, setOpen, triggerRef, baseId }}
    >
      {children}
    </DropdownMenuSubContext.Provider>
  );
}

export type DropdownMenuSubTriggerProps = Omit<PressableProps, "onPress"> & {
  inset?: boolean;
  children?: ReactNode;
};

const DropdownMenuSubTrigger = forwardRef<
  BridgePressableRef,
  DropdownMenuSubTriggerProps
>(
  (
    { className, inset, disabled, children, ...props },
    ref,
  ) => {
    const sub = useDropdownMenuSubContext("DropdownMenuSubTrigger");
    return (
      <Pressable
        ref={composeRefs(ref, sub.triggerRef)}
        accessibilityRole="menuitem"
        aria-expanded={sub.open}
        aria-controls={`${sub.baseId}-dropdown-menu-sub-content`}
        disabled={disabled}
        onPress={() => sub.setOpen(!sub.open)}
        className={cn(
          ITEM_CLASSES,
          ITEM_HIGHLIGHT_CLASSES,
          inset && "pl-8",
          // 원본 data-［state=open］:bg-accent → 조건부 클래스
          sub.open && "bg-accent active:bg-accent",
          disabled && "web:pointer-events-none opacity-50",
          className,
        )}
        {...props}
      >
        {wrapTextChildren(
          children,
          cn(
            ITEM_TEXT_CLASSES,
            sub.open && "text-accent-foreground",
          ),
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
DropdownMenuSubTrigger.displayName = "DropdownMenuSubTrigger";

export type DropdownMenuSubContentProps = ViewProps & {
  /** 서브트리거 기준 전개 방향（기본 right — 원본 관행） */
  side?: OverlayPlacement;
  align?: OverlayAlign;
  sideOffset?: number;
};

const DropdownMenuSubContent = forwardRef<
  BridgeViewRef,
  DropdownMenuSubContentProps
>(
  (
    {
      className,
      side = "right",
      align = "start",
      sideOffset = 4,
      children,
      ...props
    },
    ref,
  ) => {
    const sub = useDropdownMenuSubContext("DropdownMenuSubContent");
    return (
      // 중첩 AnchoredOverlay — 서브트리거에 앵커링된 2단 레벨 메뉴.
      <AnchoredOverlay
        visible={sub.open}
        onClose={() => sub.setOpen(false)}
        anchorRef={sub.triggerRef}
        placement={side}
        align={align}
        offset={sideOffset}
        className="z-50"
        accessibilityRole="menu"
      >
        <View
          ref={ref}
          nativeID={`${sub.baseId}-dropdown-menu-sub-content`}
          className={cn(CARD_CLASSES, "web:shadow-lg", className)}
          {...props}
        >
          {children}
        </View>
      </AnchoredOverlay>
    );
  },
);
DropdownMenuSubContent.displayName = "DropdownMenuSubContent";

export {
  DropdownMenu,
  DropdownMenuPortal,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuLabel,
  DropdownMenuItem,
  DropdownMenuCheckboxItem,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuSubContent,
};
