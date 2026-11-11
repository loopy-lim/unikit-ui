// ContextMenu — shadcn/ui（new-york-v4） context-menu.tsx 유니버설 포팅 （사이클 40, T-1d）.
// 원본: shadcn-ref/ui/context-menu.tsx
//
// 포팅 판단（원본 대비 차이이유）:
// - radix ContextMenu 엔진 제거 — 열림 상태는 React state + context（rootsub
//   radio-group 3종）로 관리하고, 오버레이는 lib/overlay의 AnchoredOverlay가
//   대체한다（포털오프셋뷰포트 클램프 포함）. 원본의 Portal 컴포넌트는 API 호환용
//   투명 래퍼로 남긴다.
// - 메뉴 진입（핵심 차이）: 트리거 래퍼에 PressableProps.onContextMenu를 연결한다 —
//   브리지가 웹에서는 onContextMenu（우클릭）, 네이티브에서는 onLongPress（길게
//   누르기）로 자동 매핑한다（bridge/types.ts §2.1）. 다만 브리지 계약이 이벤트
//   인자 없는 무인자 콜백이라 preventDefault를 호출할 수 없어 웹에서는 브라우저
//   기본 우클릭 메뉴가 함께 뜬다 — 브리지 확장 필요（완료 보고에 제기）.
// - 원본은 메뉴를 우클릭 '좌표'에 띄우지만 브리지 PressableProps에 포인터 좌표
//   계약이 없어 트리거 '요소' 기준 배치로 근사한다（AnchoredOverlay 앵커링）.
// - 트리거는 웹에서 <button>으로 렌더된다（원본은 span + asChild） — UA 기본
//   스타일만 리셋하고 자식（카드 등 임의 콘텐츠）을 세로로 감싼다. asChild
//   미지원은 dropdown-menu.tsx와 동일.
// - 서브메뉴（Sub 계열）: 중첩 AnchoredOverlay로 실제 서브메뉴를 구현（1단계
//   근사가 아님）. 복잡도 판단 — SubTrigger 눌림으로 열고 닫는다（hover 열기는
//   브리지 계약 밖）, Sub 열림은 비제어 내부 state, ESC는 서브루트가 동시에
//   닫힌다（document 단위 useDismiss — 근사）.
// - 아이콘: CheckIcon·ChevronRightIcon — 브리지 SVG 아이콘 프리미티브
//   （checkboxradio-groupaccordion 관행, lucide 의존 제거）. CircleIcon은 점 View
//   （size-2 rounded-full）로 근사.
// - 항목 onSelect는 무인자 콜백으로 단순화（preventDefault 닫기 방지 미지원）,
//   선택 시 항상 메뉴가 닫힌다.
// - 미지원（로드맵）: 등장/퇴장 애니메이션, 화살표키타입어헤드루프 탐색,
//   포인터 좌표 배치, alignOffsetavoidCollisions. 바깥 포인터 눌림 닫기는
//   AnchoredOverlay 투명 백드롭이 제공한다（G3 정합 갱신）. 웹에서는
//   AnchoredOverlay의 포커스 이동
//   ESC 닫기재배치가, 네이티브에서는 Modal onRequestClose（안드로이드 뒤로가기）
//   닫기가 동작한다.
// - 클래스 근사: min-w-［8rem］→min-w-32, max-h-（--radix-）→web:max-h-96,
//   outline-hidden→web:outline-none, focus 하이라이트→active:+web:hover:+
//   web:focus-visible:, shadow스크롤류 web: 접두, dark: 제거（dropdown-menu와
//   동일 기준）.
// - 접근성: Content=role "menu", ItemSubTrigger="menuitem", CheckboxItem
//   RadioItem aria-checked, TriggerSubTrigger aria-expandedaria-controls（useId）.
//   RN 한계 — "menu""menuitem" role은 네이티브에서 무시（브리지 방침）,
//   aria-haspopup은 PressableProps 계약에 없어 생략. ContextMenuLabel의 원본
//   text-foreground 토큰은 유지（dropdown label이 popover-foreground인 것과 대비）.
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
 * 렌더할 수 없고 색 상속도 되지 않는다（이중 지정）. 요소 자식은 그대로 둔다
 * （table.tsx 관행 — 사용자 정의 콘텐츠는 직접 Text를 넣는다）.
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

type ContextMenuContextValue = {
  open: boolean;
  setOpen: (open: boolean) => void;
  /** 콘텐츠（AnchoredOverlay）가 앵커로 측정할 트리거 요소 ref */
  triggerRef: PressableRefObject;
  /** 트리거 aria-controls ↔ 콘텐츠 nativeID 연결용 토대 ID */
  baseId: string;
};

const ContextMenuContext = createContext<ContextMenuContextValue | null>(null);

function useContextMenuContext(component: string): ContextMenuContextValue {
  const ctx = useContext(ContextMenuContext);
  if (!ctx) {
    throw new Error(`<${component}>는 <ContextMenu> 안에서 사용해야 합니다.`);
  }
  return ctx;
}

type ContextMenuSubContextValue = {
  open: boolean;
  setOpen: (open: boolean) => void;
  triggerRef: PressableRefObject;
  baseId: string;
};

const ContextMenuSubContext = createContext<ContextMenuSubContextValue | null>(
  null,
);

function useContextMenuSubContext(
  component: string,
): ContextMenuSubContextValue {
  const ctx = useContext(ContextMenuSubContext);
  if (!ctx) {
    throw new Error(`<${component}>는 <ContextMenuSub> 안에서 사용해야 합니다.`);
  }
  return ctx;
}

type ContextMenuRadioGroupContextValue = {
  value: string;
  onItemSelect: (value: string) => void;
};

// 기본값 — 그룹 밖 RadioItem도 크래시 없이 동작（radio-group.tsx 관행）.
const ContextMenuRadioGroupContext =
  createContext<ContextMenuRadioGroupContextValue>({
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

export type ContextMenuProps = ViewProps & {
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
};

const ContextMenu = forwardRef<BridgeViewRef, ContextMenuProps>(
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
      <ContextMenuContext.Provider
        value={{ open: isOpen, setOpen, triggerRef, baseId }}
      >
        {/* 컨텍스트 트리거는 임의 폭 콘텐츠（카드 등）를 감싸므로 폭 수축 없이 통과 */}
        <View ref={ref} className={className} {...props}>
          {children}
        </View>
      </ContextMenuContext.Provider>
    );
  },
);
ContextMenu.displayName = "ContextMenu";

/** API 호환용 투명 래퍼 — 포털은 AnchoredOverlay 골격이 대체（forceMountcontainer 미지원）. */
export type ContextMenuPortalProps = { children?: ReactNode };

function ContextMenuPortal({ children }: ContextMenuPortalProps) {
  return <>{children}</>;
}

export type ContextMenuTriggerProps = PressableProps;

const ContextMenuTrigger = forwardRef<
  BridgePressableRef,
  ContextMenuTriggerProps
>(({ className, children, ...props }, ref) => {
  const menu = useContextMenuContext("ContextMenuTrigger");
  return (
    <Pressable
      ref={composeRefs(ref, menu.triggerRef)}
      accessibilityRole="button"
      aria-expanded={menu.open}
      aria-controls={`${menu.baseId}-context-menu-content`}
      // 핵심 진입 — 웹 우클릭 ↔ 네이티브 길게 누르기 자동 매핑（브리지 처리）.
      // 다시 우클릭/길게 누르면 토글된다（원본은 재배치지만 골격 한계 내 대안）.
      onContextMenu={() => menu.setOpen(!menu.open)}
      className={cn(TRIGGER_RESET_CLASSES, className)}
      {...props}
    >
      {wrapTextChildren(children, "font-sans text-sm text-foreground")}
    </Pressable>
  );
});
ContextMenuTrigger.displayName = "ContextMenuTrigger";

export type ContextMenuContentProps = ViewProps & {
  /** 트리거 기준 전개 방향（기본 bottom） — 원본의 포인터 좌표 배치는 미지원 */
  side?: OverlayPlacement;
  /** 트리거 변 기준 정렬（기본 start） */
  align?: OverlayAlign;
  /** 트리거와의 간격 px（원본 sideOffset, 기본 4） */
  sideOffset?: number;
};

const ContextMenuContent = forwardRef<BridgeViewRef, ContextMenuContentProps>(
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
    const menu = useContextMenuContext("ContextMenuContent");
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
          nativeID={`${menu.baseId}-context-menu-content`}
          className={cn(CARD_CLASSES, className)}
          {...props}
        >
          {children}
        </View>
      </AnchoredOverlay>
    );
  },
);
ContextMenuContent.displayName = "ContextMenuContent";

export type ContextMenuGroupProps = ViewProps;

const ContextMenuGroup = forwardRef<BridgeViewRef, ContextMenuGroupProps>(
  ({ ...props }, ref) => <View ref={ref} {...props} />,
);
ContextMenuGroup.displayName = "ContextMenuGroup";

export type ContextMenuItemProps = Omit<PressableProps, "onPress"> & {
  inset?: boolean;
  variant?: "default" | "destructive";
  /** 항목 선택 콜백 — 선택 후 메뉴가 닫힌다（원본 preventDefault 닫기 방지 미지원） */
  onSelect?: () => void;
  children?: ReactNode;
};

const ContextMenuItem = forwardRef<BridgePressableRef, ContextMenuItemProps>(
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
    const menu = useContextMenuContext("ContextMenuItem");
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
ContextMenuItem.displayName = "ContextMenuItem";

export type ContextMenuCheckboxItemProps = Omit<
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

const ContextMenuCheckboxItem = forwardRef<
  BridgePressableRef,
  ContextMenuCheckboxItemProps
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
    const menu = useContextMenuContext("ContextMenuCheckboxItem");
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
ContextMenuCheckboxItem.displayName = "ContextMenuCheckboxItem";

export type ContextMenuRadioGroupProps = ViewProps & {
  value?: string;
  defaultValue?: string;
  onValueChange?: (value: string) => void;
};

const ContextMenuRadioGroup = forwardRef<
  BridgeViewRef,
  ContextMenuRadioGroupProps
>(({ value, defaultValue = "", onValueChange, children, ...props }, ref) => {
  // 제어/비제어 통합 — 라디오는 단일 선택이라 문자열 state면 충분하다.
  const [uncontrolled, setUncontrolled] = useState(defaultValue);
  const selected = value !== undefined ? value : uncontrolled;
  return (
    <ContextMenuRadioGroupContext.Provider
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
    </ContextMenuRadioGroupContext.Provider>
  );
});
ContextMenuRadioGroup.displayName = "ContextMenuRadioGroup";

export type ContextMenuRadioItemProps = Omit<
  PressableProps,
  "onPress" | "aria-checked"
> & {
  /** 이 항목의 값 — 그룹 value와의 일치 여부가 선택 상태가 된다 */
  value: string;
  onSelect?: () => void;
  children?: ReactNode;
};

const ContextMenuRadioItem = forwardRef<
  BridgePressableRef,
  ContextMenuRadioItemProps
>(({ className, value, onSelect, disabled, children, ...props }, ref) => {
  const menu = useContextMenuContext("ContextMenuRadioItem");
  const group = useContext(ContextMenuRadioGroupContext);
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
ContextMenuRadioItem.displayName = "ContextMenuRadioItem";

export type ContextMenuLabelProps = ViewProps & {
  inset?: boolean;
};

const ContextMenuLabel = forwardRef<BridgeViewRef, ContextMenuLabelProps>(
  ({ className, inset, children, ...props }, ref) => (
    <View
      ref={ref}
      className={cn("px-2 py-1.5", inset && "pl-8", className)}
      {...props}
    >
      {/* 원본 label은 text-foreground 토큰을 명시한다（dropdown label과 대비） */}
      {wrapTextChildren(
        children,
        "font-sans text-sm font-medium text-foreground",
      )}
    </View>
  ),
);
ContextMenuLabel.displayName = "ContextMenuLabel";

export type ContextMenuSeparatorProps = ViewProps;

const ContextMenuSeparator = forwardRef<
  BridgeViewRef,
  ContextMenuSeparatorProps
>(({ className, ...props }, ref) => (
  <View
    ref={ref}
    accessibilityRole="separator"
    className={cn("-mx-1 my-1 h-px bg-border", className)}
    {...props}
  />
));
ContextMenuSeparator.displayName = "ContextMenuSeparator";

export type ContextMenuShortcutProps = TextProps;

const ContextMenuShortcut = forwardRef<
  BridgeTextRef,
  ContextMenuShortcutProps
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
ContextMenuShortcut.displayName = "ContextMenuShortcut";

export type ContextMenuSubProps = { children?: ReactNode };

function ContextMenuSub({ children }: ContextMenuSubProps) {
  // 서브 열림은 비제어 — 눌림 토글로만 조작（원본 open/onOpenChange 제어 미지원）.
  const [open, setOpen] = useState(false);
  const triggerRef = useRef<BridgePressableRef | null>(null);
  const baseId = useId();
  return (
    <ContextMenuSubContext.Provider
      value={{ open, setOpen, triggerRef, baseId }}
    >
      {children}
    </ContextMenuSubContext.Provider>
  );
}

export type ContextMenuSubTriggerProps = Omit<PressableProps, "onPress"> & {
  inset?: boolean;
  children?: ReactNode;
};

const ContextMenuSubTrigger = forwardRef<
  BridgePressableRef,
  ContextMenuSubTriggerProps
>(({ className, inset, disabled, children, ...props }, ref) => {
  const sub = useContextMenuSubContext("ContextMenuSubTrigger");
  return (
    <Pressable
      ref={composeRefs(ref, sub.triggerRef)}
      accessibilityRole="menuitem"
      aria-expanded={sub.open}
      aria-controls={`${sub.baseId}-context-menu-sub-content`}
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
        cn(ITEM_TEXT_CLASSES, sub.open && "text-accent-foreground"),
      )}
      <ChevronRightIcon
        className={cn(
          "ml-auto size-4",
          sub.open ? "text-accent-foreground" : "text-muted-foreground",
        )}
      />
    </Pressable>
  );
});
ContextMenuSubTrigger.displayName = "ContextMenuSubTrigger";

export type ContextMenuSubContentProps = ViewProps & {
  /** 서브트리거 기준 전개 방향（기본 right — 원본 관행） */
  side?: OverlayPlacement;
  align?: OverlayAlign;
  sideOffset?: number;
};

const ContextMenuSubContent = forwardRef<
  BridgeViewRef,
  ContextMenuSubContentProps
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
    const sub = useContextMenuSubContext("ContextMenuSubContent");
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
          nativeID={`${sub.baseId}-context-menu-sub-content`}
          className={cn(CARD_CLASSES, "web:shadow-lg", className)}
          {...props}
        >
          {children}
        </View>
      </AnchoredOverlay>
    );
  },
);
ContextMenuSubContent.displayName = "ContextMenuSubContent";

export {
  ContextMenu,
  ContextMenuTrigger,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuCheckboxItem,
  ContextMenuRadioItem,
  ContextMenuLabel,
  ContextMenuSeparator,
  ContextMenuShortcut,
  ContextMenuGroup,
  ContextMenuPortal,
  ContextMenuSub,
  ContextMenuSubContent,
  ContextMenuSubTrigger,
  ContextMenuRadioGroup,
};
