// Menubar — shadcn/ui（new-york-v4） menubar.tsx 유니버설 포팅 （사이클 40, T-1e）.
// 원본: shadcn-ref/ui/menubar.tsx — radix Menubar 엔진 제거.
//
// 포팅 판단（원본 대비 차이이유）:
// - 재구성 방식（독립 구현 vs 조합）: dropdown-menu의 하위 컴포넌트는 전부 내부
//   context（useDropdownMenuContext） 의존이라 단독 재사용이 불가능하다. 대신
//   MenubarMenu가 DropdownMenu를 루트로 소비하면 Trigger/Content/Item/Checkbox/
//   Radio/Separator/Label/Sub 계열이 전부 그대로 동작한다 — 파일 수정 없이
//   전량 조합（소비）으로 간다. 원본 export 16종은 그대로 유지된다.
// - "한 번에 하나의 메뉴만 열림"（radix menubar 루트 계약）은 Menubar 루트가
//   value（열린 메뉴 식별자）를 조율해 제공한다 — MenubarMenu가 DropdownMenu를
//   제어 모드（open/onOpenChange）로 렌더하고 다른 메뉴가 열리면 자동으로 닫는다.
//   원본 Root의 value/onValueChange 계약（활성 메뉴 제어）도 이 값으로 유지되고,
//   MenubarMenu에 value를 명시하면 사용처가 이 식별자로 제어할 수 있다.
// - 미지원（radix 대비 근사）: 열린 상태에서 인접 트리거 hover 전환（브리지에
//   onHoverIn 계약 부재 — dropdown SubTrigger와 동일 판단, 눌림 전환만）,
//   화살표키 트리거 순회타입어헤드, 등장/퇴장 애니메이션origin 변형,
//   alignOffset=-4（AnchoredOverlay 계약 밖 — Content에서 미수용으로 제거）.
//   ESC바깥 눌림 닫기포커스 이동은 소비하는 dropdown 계열이 제공한다.
// - MenubarTrigger: 원본 토큰（focus/open 하이라이트 bg-accent）을 조건부
//   클래스로 전개해 dropdown 트리거에 얹는다. 원본 font-medium은 dropdown
//   트리거의 내부 Text가 이중 지정 고정이라 문자열 children은 보통 굵기로
//   렌더된다 — 굵게 하려면 <Text className="font-medium"> 자식을 넣는다.
// - MenubarContent: 원본 기본값（align startsideOffset 8） 유지, min-w-［12rem］
//   → min-w-48（표준 계단 근사）. CheckboxItem rounded-xs→dropdown rounded-sm
//   근사 등 사소한 토큰 차이는 승계（동일 역할시각 차이 미미）.
// - MenubarPortal은 API 호환 투명 래퍼 — 포털은 AnchoredOverlay 골격이 대체.
// - 아이콘: CheckIcon ✓CircleIcon 점ChevronRightIcon › — 소비하는
//   dropdown-menu가 이미 같은 글리프 관행으로 처리한다.
// - 접근성: 루트 role="menubar"（브리지 BridgeRole 카탈로그에 있음 — RN은 이
//   role을 무시하고 웹 스크린리더만 이득, bridge/types.ts 문서화 방침）.
//   트리거 aria-expandedaria-controls콘텐츠 role="menu"항목 menuitem
//   aria-checked는 dropdown 소비로 자동 제공된다.
import {
  createContext,
  forwardRef,
  useContext,
  useId,
  useState,
  type ReactNode,
} from "react";
import {
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

// ---------------------------------------------------------------------------
// 상태 context — 루트（단일 열림 조율）메뉴（자기 열림）
// ---------------------------------------------------------------------------

type MenubarContextValue = {
  /** 열려 있는 메뉴 value — null이면 전부 닫힘 */
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

/** 메뉴 단위 열림 — MenubarTrigger가 하이라이트 조건으로 소비 */
const MenubarMenuContext = createContext<{ isOpen: boolean }>({
  isOpen: false,
});

// ---------------------------------------------------------------------------
// 루트메뉴
// ---------------------------------------------------------------------------

export type MenubarProps = ViewProps & {
  /** 열린 메뉴 value（제어） — MenubarMenu의 value와 대응 */
  value?: string | null;
  defaultValue?: string | null;
  onValueChange?: (value: string | null) => void;
};

const Menubar = forwardRef<BridgeViewRef, MenubarProps>(
  (
    { value, defaultValue = null, onValueChange, className, children, ...props },
    ref,
  ) => {
    // 비제어 상태 — 제어（value 지정）면 무시된다.
    const [internalValue, setInternalValue] = useState(defaultValue);
    const current = value !== undefined ? value : internalValue;
    const setValue = (next: string | null) => {
      if (value === undefined) setInternalValue(next);
      if (next !== current) onValueChange?.(next);
    };
    return (
      <MenubarContext.Provider value={{ value: current, setValue }}>
        <View
          ref={ref}
          accessibilityRole="menubar"
          className={cn(
            "h-9 flex-row items-center gap-1 rounded-md border border-border bg-background p-1 web:shadow-xs",
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
  /** 메뉴 식별자 — Menubar 루트 value 제어와 연결（미지정 시 자동 생성） */
  value?: string;
  children?: ReactNode;
};

function MenubarMenu({ value, children }: MenubarMenuProps) {
  const menubar = useMenubarContext("MenubarMenu");
  const fallbackId = useId();
  const menuValue = value ?? fallbackId;
  const isOpen = menubar.value === menuValue;
  return (
    <MenubarMenuContext.Provider value={{ isOpen }}>
      {/* 제어 모드 조합 — 다른 메뉴가 열리면 이 값이 바뀌어 자동으로 닫힌다 */}
      <DropdownMenu
        open={isOpen}
        onOpenChange={(open) => menubar.setValue(open ? menuValue : null)}
      >
        {children}
      </DropdownMenu>
    </MenubarMenuContext.Provider>
  );
}

/** API 호환용 투명 래퍼 — 포털은 AnchoredOverlay가 대체（forceMountcontainer 미지원） */
export type MenubarPortalProps = { children?: ReactNode };

function MenubarPortal({ children }: MenubarPortalProps) {
  return <>{children}</>;
}

// ---------------------------------------------------------------------------
// 트리거콘텐츠
// ---------------------------------------------------------------------------

export type MenubarTriggerProps = PressableProps;

const MenubarTrigger = forwardRef<BridgePressableRef, MenubarTriggerProps>(
  ({ className, ...props }, ref) => {
    const menu = useContext(MenubarMenuContext);
    return (
      <DropdownMenuTrigger
        ref={ref}
        className={cn(
          "items-center rounded-sm px-2 py-1 active:bg-accent web:hover:bg-accent web:focus-visible:bg-accent",
          // 원본 data-［state=open］:bg-accent → 조건부 클래스
          menu.isOpen && "bg-accent",
          className,
        )}
        {...props}
      />
    );
  },
);
MenubarTrigger.displayName = "MenubarTrigger";

export type MenubarContentProps = DropdownMenuContentProps;

const MenubarContent = forwardRef<BridgeViewRef, MenubarContentProps>(
  ({ className, side = "bottom", align = "start", sideOffset = 8, ...props }, ref) => (
    // 원본 기본값 sideOffset 8（alignOffset -4는 미지원 — 머리 주석 참조）
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

// ---------------------------------------------------------------------------
// 체크라디오기타 항목
// ---------------------------------------------------------------------------

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
    // dropdown Label과 동일 계약（inset） — 조합으로 승계
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

// ---------------------------------------------------------------------------
// 서브메뉴
// ---------------------------------------------------------------------------

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
