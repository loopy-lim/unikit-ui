// NavigationMenu — shadcn/ui（new-york-v4） navigation-menu.tsx 유니버설 포팅
// （사이클 40, T-1e）. 원본: shadcn-ref/ui/navigation-menu.tsx — radix
// NavigationMenu 엔진 제거.
//
// 포팅 판단（원본 대비 차이이유）:
// - 재구성: 상단 바（List） + 각 아이템 트리거에 앵커링된 AnchoredOverlay
//   （placement="bottom"） 콘텐츠로 구성한다. 활성 아이템은 원본 Root의 value/
//   onValueChange 계약 그대로 관리한다（제어/비제어 통합 — 콘텐츠가 있는
//   아이템의 Trigger 토글로 value가 해당 아이템으로 바뀌고 Content가 뜬다）.
//   viewport 없이도（항상） 각 아이템 AnchoredOverlay가 자체 동작한다.
// - NavigationMenuViewport: 원본은 활성 콘텐츠를 루트 하단 공용 카드에 모아
//   --radix--viewport-width/height CSS 변수로 크기 전환 애니메이션을 준다.
//   콘텐츠가 각자 포털（AnchoredOverlay）로 뜨는 구조라 이 배치 트릭을 재현할
//   수 없어 API 호환용 no-op（렌더하지 않음）로 두고 viewport prop은 장식으로
//   유지된다 — 콘텐츠는 항상 트리거 바로 아래 카드로 뜬다.
// - NavigationMenuIndicator: 활성 트리거 아래 화살표를 indicator x 이동
//   트릭으로 배치하는데 트리거 위치 측정 계약이 없어 재현 불가 — 생략（no-op）.
// - Trigger: hover 개방은 브리지 onHoverIn 계약 부재로 눌림 토글 근사
//   （dropdown-menu와 동일 판단）. ▾ 글리프（ChevronDownIcon 대체）는 개방 시
//   web:rotate-180 회전 근사（원본 300ms 전이 유지, 원본 top-［1px］ 임의값과
//   size-3은 text-xs로 근사）.
// - navigationMenuTriggerStyle: 원본 cva 문자열을 유지하되 data-［state=open］
//   토큰은 상태를 모르는 cva에 넣을 수 없어 Trigger에서 조건부 전개한다.
//   transition-［color,box-shadow］→web:transition-colorsring-［3px］→ring-2
//   outline-hidden→web:outline-none 근사（tabsdropdown 관행）, 임의값 금지.
// - Link: radix Link의 <a href>는 브리지 프리미티브 계약 밖이라 Pressable
//   role="link" + onPress로 근사한다（라우팅은 사용처 onPress 담당）. active
//   prop（data-［active=true］）은 유지한다. 원본 focus:text-accent-foreground
//   등 글자색 토큰은 이중 지정 원칙상 내부 Text가 대신한다（색 전환 생략）.
// - Content: 원본의 motion/viewport 그룹 셀렉터 토큰（data-［motion=］,
//   group-data-［viewport=false］/）은 네이티브 data 속성 부재그룹 셀렉터
//   불가로 전부 제거하고, viewport=false 모드 카드 토큰（borderbg-popover
//   p-2 pr-2.5shadow）을 기본으로 쓴다（위치크기 전환은 AnchoredOverlay가
//   담당）. slide-in-from-right-52 등 방향 애니메이션도 미지원.
// - 미지원: 화살표키 트리거 순회hover 지연 개방트리거 폭 추종 콘텐츠
//   （w-full 토큰 제거 — 카드 폭은 내용 결정, 사용처 className으로 조정）.
// - 아이템 value: radix는 자동 생성한다 — 포팅도 useId로 자동 생성하되
//   value prop 명시를 허용해 Root value/onValueChange 제어와 연결하게 했다.
// - 접근성: 트리거 aria-expandedaria-controls（useId 토대로 Content nativeID와
//   결정적 연결）, Link role="link". 원본 ul/list 스타일（list-none）은 View
//   구조에서 무의미해 제거, role list/listitem 계약도 생략했다（웹 div 기반
//   근사 — 필요시 사용처 지정）.
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
  Pressable,
  Text,
  View,
  type BridgePressableRef,
  type BridgeViewRef,
  type PressableProps,
  type ViewProps,
} from "@unikit-bridge/ui/primitives";
import { cva } from "class-variance-authority";

import { AnchoredOverlay } from "../lib/overlay";
import { cn } from "../lib/utils";

// ---------------------------------------------------------------------------
// 내부 유틸
// ---------------------------------------------------------------------------

type PressableRefObject = { current: BridgePressableRef | null };

/** 외부 forwardRef와 앵커 측정용 내부 ref를 한 콜백으로 합성한다（dropdown 관행） */
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

/** 자식 중 문자열/숫자를 내부 Text로 감싼다 — 네이티브 색 상속 불가 대응 */
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
// 상태 context — 루트（활성 아이템）아이템（값트리거 ref）
// ---------------------------------------------------------------------------

type NavigationMenuContextValue = {
  value: string | null;
  setValue: (next: string | null) => void;
};

const NavigationMenuContext = createContext<NavigationMenuContextValue | null>(
  null,
);

function useNavigationMenuContext(
  component: string,
): NavigationMenuContextValue {
  const ctx = useContext(NavigationMenuContext);
  if (!ctx) {
    throw new Error(`<${component}>는 <NavigationMenu> 안에서 사용해야 합니다.`);
  }
  return ctx;
}

type NavigationMenuItemContextValue = {
  itemValue: string;
  /** Trigger 요소 ref — Content（AnchoredOverlay）의 앵커포커스 복귀 공용 */
  triggerRef: PressableRefObject;
  /** 트리거 aria-controls ↔ 콘텐츠 nativeID 연결 */
  contentId: string;
};

const NavigationMenuItemContext =
  createContext<NavigationMenuItemContextValue | null>(null);

function useNavigationMenuItemContext(
  component: string,
): NavigationMenuItemContextValue {
  const ctx = useContext(NavigationMenuItemContext);
  if (!ctx) {
    throw new Error(
      `<${component}>는 <NavigationMenuItem> 안에서 사용해야 합니다.`,
    );
  }
  return ctx;
}

// ---------------------------------------------------------------------------
// 루트리스트아이템
// ---------------------------------------------------------------------------

export type NavigationMenuProps = ViewProps & {
  /** 활성（콘텐츠 전개） 아이템 value（제어） — null이면 전부 닫힘 */
  value?: string | null;
  defaultValue?: string | null;
  onValueChange?: (value: string | null) => void;
  /** API 호환용 — 포팅에서는 무시（콘텐츠가 각자 앵커링, 머리 주석 참조） */
  viewport?: boolean;
};

const NavigationMenu = forwardRef<BridgeViewRef, NavigationMenuProps>(
  (
    {
      value,
      defaultValue = null,
      onValueChange,
      viewport = true,
      className,
      children,
      ...props
    },
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
      <NavigationMenuContext.Provider value={{ value: current, setValue }}>
        {/* 원본 group/navigation-menu 그룹 셀렉터는 미사용 — 조건부 클래스로 대체 */}
        <View
          ref={ref}
          className={cn(
            "relative flex-row max-w-max flex-1 items-center justify-center",
            className,
          )}
          {...props}
        >
          {children}
          {viewport ? <NavigationMenuViewport /> : null}
        </View>
      </NavigationMenuContext.Provider>
    );
  },
);
NavigationMenu.displayName = "NavigationMenu";

export type NavigationMenuListProps = ViewProps;

const NavigationMenuList = forwardRef<BridgeViewRef, NavigationMenuListProps>(
  ({ className, ...props }, ref) => (
    <View
      ref={ref}
      className={cn(
        "flex-row flex-1 items-center justify-center gap-1",
        className,
      )}
      {...props}
    />
  ),
);
NavigationMenuList.displayName = "NavigationMenuList";

export type NavigationMenuItemProps = ViewProps & {
  /** 아이템 식별자 — Root value 제어와 연결（미지정 시 자동 생성） */
  value?: string;
};

const NavigationMenuItem = forwardRef<BridgeViewRef, NavigationMenuItemProps>(
  ({ value, className, children, ...props }, ref) => {
    const id = useId();
    const triggerRef = useRef<BridgePressableRef | null>(null);
    return (
      <NavigationMenuItemContext.Provider
        value={{
          itemValue: value ?? id,
          triggerRef,
          contentId: `${id}-navigation-menu-content`,
        }}
      >
        <View ref={ref} className={cn("relative", className)} {...props}>
          {children}
        </View>
      </NavigationMenuItemContext.Provider>
    );
  },
);
NavigationMenuItem.displayName = "NavigationMenuItem";

// ---------------------------------------------------------------------------
// 트리거콘텐츠링크
// ---------------------------------------------------------------------------

/** 원본 cva 재현 — data-［state=open］transition 임의값은 Trigger 측 근사（머리 주석） */
const navigationMenuTriggerStyle = cva(
  "flex h-9 w-max flex-row items-center justify-center rounded-md bg-background px-4 py-2 active:bg-accent web:hover:bg-accent web:focus-visible:bg-accent web:focus-visible:outline-1 web:focus-visible:ring-2 web:focus-visible:ring-ring/50 web:outline-none web:transition-colors",
);

export type NavigationMenuTriggerProps = PressableProps;

const NavigationMenuTrigger = forwardRef<
  BridgePressableRef,
  NavigationMenuTriggerProps
>(({ className, children, disabled, onPress, ...props }, ref) => {
  const nav = useNavigationMenuContext("NavigationMenuTrigger");
  const item = useNavigationMenuItemContext("NavigationMenuTrigger");
  const isOpen = nav.value === item.itemValue;
  return (
    <Pressable
      ref={composeRefs(ref, item.triggerRef)}
      accessibilityRole="button"
      aria-expanded={isOpen}
      aria-controls={item.contentId}
      disabled={disabled}
      onPress={() => {
        nav.setValue(isOpen ? null : item.itemValue);
        onPress?.();
      }}
      className={cn(
        navigationMenuTriggerStyle(),
        // 원본 data-［state=open］:bg-accent/50 → 조건부 클래스
        isOpen && "bg-accent/50",
        disabled && "web:pointer-events-none opacity-50",
        className,
      )}
      {...props}
    >
      {wrapTextChildren(children, "font-sans text-sm font-medium text-foreground")}
      {/* 원본 ChevronDownIcon → ▾ 글리프. 개방 시 회전 근사 */}
      <Text
        className={cn(
          "ml-1 text-xs leading-none text-muted-foreground web:transition-transform web:duration-300",
          isOpen && "web:rotate-180",
        )}
      >
        ▾
      </Text>
    </Pressable>
  );
});
NavigationMenuTrigger.displayName = "NavigationMenuTrigger";

export type NavigationMenuContentProps = ViewProps;

const NavigationMenuContent = forwardRef<
  BridgeViewRef,
  NavigationMenuContentProps
>(({ className, children, nativeID, ...props }, ref) => {
  const nav = useNavigationMenuContext("NavigationMenuContent");
  const item = useNavigationMenuItemContext("NavigationMenuContent");
  const isOpen = nav.value === item.itemValue;
  return (
    // 각 아이템 앵커링 팝업 — 원본 viewport=false 카드 토큰을 기본으로 사용.
    // ESC바깥 눌림 닫기포커스 이동/복귀는 AnchoredOverlay 골격이 제공한다.
    <AnchoredOverlay
      visible={isOpen}
      onClose={() => nav.setValue(null)}
      anchorRef={item.triggerRef}
      placement="bottom"
      align="start"
      offset={6}
      triggerRef={item.triggerRef}
      className="z-50"
    >
      <View
        ref={ref}
        nativeID={nativeID ?? item.contentId}
        className={cn(
          "pointer-events-auto rounded-md border border-border bg-popover p-2 pr-2.5 text-popover-foreground web:shadow-md",
          className,
        )}
        {...props}
      >
        {children}
      </View>
    </AnchoredOverlay>
  );
});
NavigationMenuContent.displayName = "NavigationMenuContent";

export type NavigationMenuLinkProps = PressableProps & {
  /** 현재 위치 표시（원본 data-［active=true］） */
  active?: boolean;
};

const NavigationMenuLink = forwardRef<
  BridgePressableRef,
  NavigationMenuLinkProps
>(({ className, active, disabled, onPress, children, ...props }, ref) => {
  const nav = useNavigationMenuContext("NavigationMenuLink");
  return (
    <Pressable
      ref={ref}
      accessibilityRole="link"
      disabled={disabled}
      onPress={() => {
        // 이동 선택 시 메뉴（콘텐츠 팝업）를 닫는다
        nav.setValue(null);
        onPress?.();
      }}
      className={cn(
        "flex flex-col gap-1 rounded-sm p-2 active:bg-accent web:hover:bg-accent web:focus-visible:bg-accent web:focus-visible:outline-none web:focus-visible:ring-2 web:focus-visible:ring-ring/50 web:transition-colors",
        active &&
          "bg-accent/50 active:bg-accent web:hover:bg-accent web:focus-visible:bg-accent",
        disabled && "web:pointer-events-none opacity-50",
        className,
      )}
      {...props}
    >
      {wrapTextChildren(children, "font-sans text-sm text-foreground")}
    </Pressable>
  );
});
NavigationMenuLink.displayName = "NavigationMenuLink";

// ---------------------------------------------------------------------------
// IndicatorViewport — 원본 배치 트릭 재현 불가로 no-op（머리 주석 참조）
// ---------------------------------------------------------------------------

export type NavigationMenuIndicatorProps = ViewProps;

const NavigationMenuIndicator = forwardRef<
  BridgeViewRef,
  NavigationMenuIndicatorProps
>(() => null);
NavigationMenuIndicator.displayName = "NavigationMenuIndicator";

export type NavigationMenuViewportProps = ViewProps;

const NavigationMenuViewport = forwardRef<
  BridgeViewRef,
  NavigationMenuViewportProps
>(() => null);
NavigationMenuViewport.displayName = "NavigationMenuViewport";

export {
  NavigationMenu,
  NavigationMenuList,
  NavigationMenuItem,
  NavigationMenuContent,
  NavigationMenuTrigger,
  NavigationMenuLink,
  NavigationMenuIndicator,
  NavigationMenuViewport,
  navigationMenuTriggerStyle,
};
