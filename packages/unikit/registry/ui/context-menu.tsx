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
//   근사가 아님）. SubTrigger는 hover로 열린다（사이클 90 해소 — dropdown-menu와
//   동일 판단）: radix Menu 원본값 그대로 진입 100ms 뒤 열림 예약, 이탈 300ms
//   grace 뒤 닫힘 예약（카드 진입이 취소）. Sub 열림은 비제어 내부 state, ESC는
//   서브루트가 동시에 닫힌다（document 단위 useDismiss — 근사）.
// - 아이콘: CheckIcon·ChevronRightIcon — 브리지 lucide 아이콘 프리미티브
//   （checkbox/radio-group/accordion 관행, lucide — primitives 경유）. CircleIcon은 점 View
//   （size-2 rounded-full）로 근사.
// - 항목 onSelect는 무인자 콜백으로 단순화（preventDefault 닫기 방지 미지원）,
//   선택 시 항상 메뉴가 닫힌다.
// - 키보드 탐색（사이클 90 해소 — 웹 전용）: 카드 안에서 ArrowDown/Up（양 끝
//   루프）Home/End로 항목 DOM 포커스를 옮기고, ArrowRight는 SubTrigger 서브를
//   열고 ArrowLeft는 닫아 트리거로 돌아간다 — lib/menu-nav 공유 골격
//   （dropdown-menu와 동일 판단）. 네이티브 View는 onKeyDown을 폐기（브리지
//   계약 한계）.
// - 포커스 정책（사이클 90, radix Menu 정합 — dropdown-menu와 동일 판단）:
//   항목 pointerenter 시 해당 항목으로 포커스 이동. 서브 개방의 첫 항목 포커스는
//   진입 경로를 따른다（hover/press 개방은 이동 없음, ArrowRight 개방만 이동）.
// - 미지원（로드맵）: 등장/퇴장 애니메이션, 타입어헤드,
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
  useCallback,
  useContext,
  useEffect,
  useId,
  useMemo,
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
  type BridgeKeyEvent,
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
} from "@/lib/overlay";
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
  /** 눌림 즉시 개방 — press도 pointer 진입으로 표시한다（포커스 이동 없음.
   *  setOpen(true)을 직접 쓰면 entry가 null로 남아 focusOnOpen이 켜진다 —
   *  G4 F-13, dropdown-menu와 동일 판단）. */
  openViaPointer: () => void;
  /** 트리거 hover 진입 — 100ms 뒤 열림 예약（이미 열림이면 닫힘 예약 취소만）.
   *  source "pointer"(hover)는 개방 시 항목 포커스 이동을 하지 않는다（radix
   *  포인터 모드 — SubContent focusOnOpen 참조）, "keyboard"(ArrowRight)만 이동한다. */
  scheduleOpen: (source?: "pointer" | "keyboard") => void;
  /** 트리거·카드 이탈 — 지연 열림을 취소하고 300ms 뒤 닫힘 예약 */
  scheduleClose: () => void;
  /** 카드 진입 — 예약된 닫힘을 취소한다（트리거→카드 포인터 이동 유지） */
  cancelClose: () => void;
  /** 이번 개방의 진입 경로 — "pointer"(hover·press 토글) · "keyboard" · null */
  entry: "pointer" | "keyboard" | null;
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
  "pointer-events-auto z-50 min-w-32 rounded-md border border-border bg-popover p-1 text-popover-foreground unikit-popover-in web:max-h-96 web:overflow-x-hidden web:overflow-y-auto web:shadow-md";

// 일반 항목 — 기본 상호작용 및 커서/선택 방지/포커스 아웃라인.
const ITEM_CLASSES =
  "relative flex-row items-center gap-2 rounded-sm px-2 py-1.5 web:cursor-default web:select-none web:outline-none";

// 일반 항목 하이라이트 — radix 하이라이트（focus:bg-accent focus:text-accent-foreground）를
// active（네이티브 눌림）+hover/focus-visible로. 전경색 전환도 원본과 같이 함께.
const ITEM_HIGHLIGHT_CLASSES =
  "active:bg-accent active:text-accent-foreground web:hover:bg-accent web:hover:text-accent-foreground web:focus-visible:bg-accent web:focus-visible:text-accent-foreground";

// 표시자（체크/라디오） 항목 — 왼쪽 pl-8 표시자 슬롯（원본 py-1.5 pr-2 pl-8）.
const INDICATED_ITEM_CLASSES =
  "relative flex-row items-center gap-2 rounded-sm py-1.5 pr-2 pl-8 active:bg-accent active:text-accent-foreground web:cursor-default web:select-none web:outline-none web:hover:bg-accent web:hover:text-accent-foreground web:focus-visible:bg-accent web:focus-visible:text-accent-foreground";

// 항목 텍스트 — 네이티브 색 상속 불가로 항목마다 명시（이중 지정）. 하이라이트
// 전경색도 이중 지정해야 웹에서 Text 고유 클래스가 컨테이너 전환을 덮지 않는다.
const ITEM_TEXT_CLASSES =
  "flex-1 font-sans text-sm text-popover-foreground active:text-accent-foreground web:hover:text-accent-foreground web:focus-visible:text-accent-foreground";

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
    const stateRef = useRef({ open, isOpen, onOpenChange });
    stateRef.current = { open, isOpen, onOpenChange };
    const setOpen = useCallback((next: boolean) => {
      const state = stateRef.current;
      if (state.open === undefined) setInternalOpen(next);
      if (next !== state.isOpen) state.onOpenChange?.(next);
    }, []);
    const triggerRef = useRef<BridgePressableRef | null>(null);
    const baseId = useId();
    const contextValue = useMemo<ContextMenuContextValue>(
      () => ({ open: isOpen, setOpen, triggerRef, baseId }),
      [isOpen, setOpen, baseId],
    );
    return (
      <ContextMenuContext.Provider value={contextValue}>
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
      onKeyDown,
      ...props
    },
    ref,
  ) => {
    const menu = useContextMenuContext("ContextMenuContent");
    // 카드 키보드 탐색（사이클 90） — lib/menu-nav 공유 골격.
    const nav = useMenuNav();
    return (
      <AnchoredOverlay
        visible={menu.open}
        onClose={() => menu.setOpen(false)}
        anchorRef={menu.triggerRef}
        // 닫힘(Enter·ESC) 후 포커스를 트리거로 복귀시킨다(G4 — BODY에 남으면
        // 다음 Tab이 문서 처음부터 시작된다).
        triggerRef={menu.triggerRef}
        placement={side}
        align={align}
        offset={sideOffset}
        className="z-50"
        accessibilityRole="menu"
      >
        <MenuNavContext.Provider value={nav}>
          <View
            ref={ref}
            nativeID={`${menu.baseId}-context-menu-content`}
            onKeyDown={composeMenuNavKeyDown(nav, onKeyDown)}
            className={cn(CARD_CLASSES, className)}
            {...props}
          >
            {children}
          </View>
        </MenuNavContext.Provider>
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
      onFocus,
      onHoverIn,
      ...props
    },
    ref,
  ) => {
    const menu = useContextMenuContext("ContextMenuItem");
    const destructive = variant === "destructive";
    // 키보드 탐색 등록（사이클 90）.
    const nav = useMenuNavContext();
    const { id, attach, nodeRef } = useMenuItemRef(ref);
    return (
      <Pressable
        ref={attach}
        accessibilityRole="menuitem"
        disabled={disabled}
        // 포인터 진입 항목으로 포커스 이동（radix pointerenter 정합 — 사이클 90）.
        onHoverIn={composeMenuItemHoverIn(nav, id, nodeRef, onHoverIn)}
        onFocus={composeMenuItemFocus(nav, id, onFocus)}
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
          // 파탈 항목은 하이라이트 중에도 원본처럼 destructive 전경을 유지한다.
          cn(
            ITEM_TEXT_CLASSES,
            destructive &&
              "text-destructive active:text-destructive web:hover:text-destructive web:focus-visible:text-destructive",
          ),
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
      onFocus,
      onHoverIn,
      ...props
    },
    ref,
  ) => {
    const menu = useContextMenuContext("ContextMenuCheckboxItem");
    // 제어/비제어 통합 — checkbox.tsx와 동일 구조.
    const [uncontrolled, setUncontrolled] = useState(defaultChecked);
    const isChecked = checked !== undefined ? checked : uncontrolled;
    // 키보드 탐색 등록（사이클 90）.
    const nav = useMenuNavContext();
    const { id, attach, nodeRef } = useMenuItemRef(ref);
    return (
      <Pressable
        ref={attach}
        accessibilityRole="menuitem"
        aria-checked={isChecked}
        disabled={disabled}
        // 포인터 진입 항목으로 포커스 이동（radix pointerenter 정합 — 사이클 90）.
        onHoverIn={composeMenuItemHoverIn(nav, id, nodeRef, onHoverIn)}
        onFocus={composeMenuItemFocus(nav, id, onFocus)}
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
            <CheckIcon className="size-4 text-foreground" />
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
  const onItemSelect = useCallback(
    (itemValue: string) => {
      if (value === undefined) setUncontrolled(itemValue);
      onValueChange?.(itemValue);
    },
    [value, onValueChange],
  );
  const contextValue = useMemo(
    () => ({ value: selected, onItemSelect }),
    [selected, onItemSelect],
  );
  return (
    <ContextMenuRadioGroupContext.Provider value={contextValue}>
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
>(
  (
    { className, value, onSelect, disabled, children, onFocus, onHoverIn, ...props },
    ref,
  ) => {
    const menu = useContextMenuContext("ContextMenuRadioItem");
    const group = useContext(ContextMenuRadioGroupContext);
    const isChecked = group.value === value;
    // 키보드 탐색 등록（사이클 90）.
    const nav = useMenuNavContext();
    const { id, attach, nodeRef } = useMenuItemRef(ref);
    return (
      <Pressable
        ref={attach}
        accessibilityRole="menuitem"
        aria-checked={isChecked}
        disabled={disabled}
        // 포인터 진입 항목으로 포커스 이동（radix pointerenter 정합 — 사이클 90）.
        onHoverIn={composeMenuItemHoverIn(nav, id, nodeRef, onHoverIn)}
        onFocus={composeMenuItemFocus(nav, id, onFocus)}
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
  },
);
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

// radix Menu 원본값（packages/react/menu/src/menu.tsx） — SubTrigger onPointerMove의
// 지연 열림 setTimeout 100ms, 포인터 grace 타이머 300ms（dropdown-menu와 동일）.
const SUB_OPEN_DELAY = 100;
const SUB_CLOSE_GRACE = 300;

function ContextMenuSub({ children }: ContextMenuSubProps) {
  // 서브 열림은 비제어 — 눌림 토글·hover로만 조작（원본 open/onOpenChange 제어 미지원）.
  const [open, setOpenState] = useState(false);
  const openRef = useRef(open);
  openRef.current = open;
  const triggerRef = useRef<BridgePressableRef | null>(null);
  const baseId = useId();

  // hover 지연 타이머（사이클 90） — 재스케줄·언마운트 해제가 의무.
  // entry는 이번 개방의 진입 경로（pointer=hover/press, keyboard=ArrowRight） —
  // SubContent의 focusOnOpen 결정에만 쓰이고 닫힘 때 null로 돌아간다.
  const [entry, setEntry] = useState<"pointer" | "keyboard" | null>(null);
  const openTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const closeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const clearOpenTimer = useCallback(() => {
    if (openTimerRef.current !== null) {
      clearTimeout(openTimerRef.current);
      openTimerRef.current = null;
    }
  }, []);
  const clearCloseTimer = useCallback(() => {
    if (closeTimerRef.current !== null) {
      clearTimeout(closeTimerRef.current);
      closeTimerRef.current = null;
    }
  }, []);
  useEffect(
    () => () => {
      clearOpenTimer();
      clearCloseTimer();
    },
    [clearOpenTimer, clearCloseTimer],
  );
  // 즉시 전환（눌림 토글·바깥 닫힘）은 보류 타이머를 청소하고 반영한다.
  const setOpen = useCallback(
    (next: boolean) => {
      clearOpenTimer();
      clearCloseTimer();
      setOpenState(next);
      if (!next) setEntry(null);
    },
    [clearOpenTimer, clearCloseTimer],
  );
  const scheduleOpen = useCallback(
    (source?: "pointer" | "keyboard") => {
      clearCloseTimer();
      if (openRef.current) return;
      clearOpenTimer();
      openTimerRef.current = setTimeout(() => {
        openTimerRef.current = null;
        setEntry(source ?? "pointer");
        setOpenState(true);
      }, SUB_OPEN_DELAY);
    },
    [clearCloseTimer, clearOpenTimer],
  );
  // 눌림 개방 — 지연 없이 즉시, 진입은 pointer로 표시（F-13）.
  const openViaPointer = useCallback(() => {
    clearOpenTimer();
    clearCloseTimer();
    setEntry("pointer");
    setOpenState(true);
  }, [clearOpenTimer, clearCloseTimer]);
  const scheduleClose = useCallback(() => {
    clearOpenTimer();
    if (!openRef.current) return;
    clearCloseTimer();
    closeTimerRef.current = setTimeout(() => {
      closeTimerRef.current = null;
      setEntry(null);
      setOpenState(false);
    }, SUB_CLOSE_GRACE);
  }, [clearOpenTimer, clearCloseTimer]);
  const cancelClose = clearCloseTimer;

  const contextValue = useMemo(
    () => ({
      open,
      setOpen,
      openViaPointer,
      scheduleOpen,
      scheduleClose,
      cancelClose,
      entry,
      triggerRef,
      baseId,
    }),
    [
      open,
      setOpen,
      openViaPointer,
      scheduleOpen,
      scheduleClose,
      cancelClose,
      entry,
      baseId,
    ],
  );
  return (
    <ContextMenuSubContext.Provider value={contextValue}>
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
>(
  (
    { className, inset, disabled, children, onHoverIn, onHoverOut, onFocus, onKeyDown, ...props },
    ref,
  ) => {
    const sub = useContextMenuSubContext("ContextMenuSubTrigger");
    // 키보드 탐색 등록（사이클 90） — ArrowRight가 scheduleOpen으로 이어진다
    // （keyboard 진입 표시 — SubContext entry 계약）.
    const nav = useMenuNavContext();
    const composedRef = useMemo(
      () => composeRefs(ref, sub.triggerRef),
      [ref, sub.triggerRef],
    );
    const openViaKeyboard = useMemo(
      () => () => sub.scheduleOpen("keyboard"),
      [sub.scheduleOpen],
    );
    const { id, attach, nodeRef } = useMenuItemRef(composedRef, openViaKeyboard);
    return (
      <Pressable
        ref={attach}
        accessibilityRole="menuitem"
        aria-expanded={sub.open}
        aria-controls={`${sub.baseId}-context-menu-sub-content`}
        disabled={disabled}
        // hover 개방（사이클 90 해소） — radix 원본값: 진입 100ms 뒤 열림 예약,
        // 이탈은 300ms grace 뒤 닫힘 예약（dropdown-menu와 동일 판단）.
        // 진입 항목 포커스 이동은 composeMenuItemHoverIn.
        onHoverIn={composeMenuItemHoverIn(nav, id, nodeRef, () => {
          sub.scheduleOpen("pointer");
          onHoverIn?.();
        })}
        onHoverOut={() => {
          sub.scheduleClose();
          onHoverOut?.();
        }}
        onFocus={composeMenuItemFocus(nav, id, onFocus)}
        // hover 개방(포커스가 트리거에 남는 radix 포인터 모드) 중 ArrowLeft는
        // 서브를 닫는다（dropdown-menu와 동일 판단, radix 정합 — 사이클 90）.
        onKeyDown={(event) => {
          if (event.key === "ArrowLeft" && sub.open) {
            event.preventDefault();
            event.stopPropagation?.();
            sub.setOpen(false);
          }
          onKeyDown?.(event);
        }}
        // 눌림 토글 — 개방은 openViaPointer（pointer 진입 표시, F-13）.
        onPress={() => (sub.open ? sub.setOpen(false) : sub.openViaPointer())}
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
  },
);
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
      onKeyDown,
      ...props
    },
    ref,
  ) => {
    const sub = useContextMenuSubContext("ContextMenuSubContent");
    // 서브 카드 자체 키보드 탐색（사이클 90） — ArrowLeft는 서브를 닫고 트리거로
    // 포커스를 되돌린다（dropdown-menu와 동일 판단）.
    const nav = useMenuNav();
    const handleKeyDown = (event: BridgeKeyEvent) => {
      if (event.key === "ArrowLeft") {
        event.preventDefault();
        event.stopPropagation?.();
        sub.setOpen(false);
        sub.triggerRef.current?.focus?.();
        return;
      }
      nav.handleKeyDown(event);
      onKeyDown?.(event);
    };
    return (
      // 중첩 AnchoredOverlay — 서브트리거에 앵커링된 2단 레벨 메뉴.
      <AnchoredOverlay
        visible={sub.open}
        onClose={() => sub.setOpen(false)}
        anchorRef={sub.triggerRef}
        // 닫힘 후 포커스 복귀 — 서브는 서브트리거로(ArrowLeft 닫힘과 같은 착지).
        triggerRef={sub.triggerRef}
        placement={side}
        align={align}
        offset={sideOffset}
        // hover 개방(pointer)은 첫 항목으로 포커스를 옮기지 않는다（radix 포인터
        // 모드 정합 — dropdown-menu와 동일 판단）. ArrowRight 개방(keyboard)만
        // 첫 항목 포커스. 항목 hover 진입 시 포커스는 composeMenuItemHoverIn이 옮긴다.
        focusOnOpen={sub.entry !== "pointer"}
        className="z-50"
        accessibilityRole="menu"
      >
        <MenuNavContext.Provider value={nav}>
          <View
            ref={ref}
            nativeID={`${sub.baseId}-context-menu-sub-content`}
            onKeyDown={handleKeyDown}
            // 카드 진입은 닫힘 예약을 취소, 이탈은 재예약（사이클 90 — 300ms grace）.
            onHoverIn={() => sub.cancelClose()}
            onHoverOut={() => sub.scheduleClose()}
            className={cn(CARD_CLASSES, "web:shadow-lg", className)}
            {...props}
          >
            {children}
          </View>
        </MenuNavContext.Provider>
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
