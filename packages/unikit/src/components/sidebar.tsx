// Sidebar — shadcn/ui（new-york-v4） sidebar.tsx 유니버설 포팅 （사이클 40, T-3b）.
// 원본: shadcn-ref/ui/sidebar.tsx
//
// 포팅 판단（원본 대비 차이이유）:
// - 쿠키 지속화（document.cookie） 제거 — 열림 상태는 React state + context로만
//   관리한다（openopenMobiletoggleSidebar）. 제어형（open/onOpenChange） 유지.
// - useIsMobile 훅 대신 SidebarProvider의 isMobile prop（기본 false）으로 전환
//   — 유니버설 환경에 matchMedia 계약이 없어 소비자가 결정한다. isMobile이면
//   원본과 동일하게 Sheet（side 전달）로 전환, 아니면 데스크톱 레이아웃.
// - 데스크톱 배치: 원본의 fixed 컨테이너 + gap peer 구조（화면 밖 슬라이드
//   transition）는 문서 흐름 참여형 단일 View（폭 토큰 전환）로 근사 — 즉시
//   전환 관행（다른 오버레이 계열과 동일）, offcanvas 접힘은 w-0 + 경계 제거로
//   표현한다. md: 미디어쿼리 토큰은 isMobile prop 분기가 대체했다.
//   높이는 웹에서 web:sticky top-0 + web:h-svh（원본 fixed inset-y-0의 근사 —
//   스크롤 문서에서도 뷰포트 높이를 유지）, 네이티브는 Provider flex-row의
//   교차축 stretch. h-full은 Provider（min-h, 높이 부정） 안에서 콘텐츠 높이로
//   붕괴해 제거했다（2026-11-12 블록 검증에서 발견）.
// - 폭 CSS 변수（--sidebar-width 16rem 등）는 표준 계단 토큰으로 치환:
//   w-64（16rem）w-72（18rem 모바일）w-12（3rem 아이콘）w-14（아이콘+패딩 3.5rem,
//   원본 calc（3rem+1rem）의 임의값 근사）.
// - sidebar-* 색 팔레트는 UniKit 토큰 20종에 없어（check-consumer-theme가 소비자
//   자산으로 분류） 다음 매핑으로 근사: bg-sidebar→bg-background,
//   text-sidebar-foreground→text-foreground, bg-sidebar-accent→bg-accent,
//   *-accent-foreground→*-accent-foreground, sidebar-border→border,
//   sidebar-ring→ring. 소비자가 sidebar 팔레트를 쓰려면 className 오버라이드.
// - data-slotdata-sidebar 속성과 group-data-［］peer-data-［］ 그룹 셀렉터는
//   네이티브에 data 속성이 없어 SidebarContext 확장 필드（variantcollapsible
//   side） + cva 변형 + 조건부 클래스로 근사한다（attachmentalert-dialog 관행）.
//   icon 접힘（size-8! p-2! 등 important 토큰）은 cn 병합 순서로 대체.
// - 키보드 단축키（Ctrl/Cmd+B）는 window keydown 리스너（typeof window 가드）로
//   유지 — 웹 전용, 네이티브는 no-op.
// - radix Slot（asChild） 미지원 — GroupLabelMenuButtonMenuActionSubButton은
//   Pressable/View 렌더 고정（문자열 children은 내부 Text로 감싼다）.
// - 툴팁 연동: 기존 "./tooltip"을 소비. 원본은 항상 Tooltip으로 감싸고
//   hidden 제어하지만, 우리 툴팁은 press-to-toggle 방식이라 "아이콘 접힘
//   상태에서만" TooltipTrigger로 전환한다（expanded에선 라벨이 이미 보이므로
//   원본 hidden과 동일 효과 — 판단 기록）.
// - lucide PanelLeftIcon은 브리지 primitives 경유（직접 lucide import 금지）.
//   sr-only는 accessibilityLabel로 대체（dialogsheet 관행）. 모바일 시트의
//   sr-only 헤더는 시각 숨김 근사（absolute opacity-0）로 렌더해 스크린리더
//   이름은 유지한다.
// - 원본 임의값가상요소 토큰 근사: after:w-［2px］ 레일 바 제거（커서
//   w/e-resize와 함께 — 웹 전용 셀렉터）, shadow-［0_0_0_1px_var（）］ outline
//   변형은 border border-border로, skeleton 랜덤 폭은 style maxWidth 직접 값으로.
// - SidebarContent는 div overflow-auto 대신 브리지 ScrollView를 소비（네이티브
//   스크롤 보장 — scroll-area 관행）.
// - ［&>svg］:size-4 등 자식 svg 규격 셀렉터는 제거 — 아이콘 크기는 소비자
//   className 안내로 남긴다. hover 전경색 전환（peer-hover）도 셀렉터 불가로
//   배경 전환만 근사했다.
import * as React from "react";
import {
  PanelLeftIcon,
  Pressable,
  ScrollView,
  Text,
  View,
  type BridgePressableRef,
  type BridgeScrollViewRef,
  type BridgeTextRef,
  type BridgeViewRef,
  type PressableProps,
  type ScrollViewProps,
  type TextProps,
  type TextInputProps,
  type ViewProps,
  type BridgeTextInputRef,
} from "@unikit-bridge/ui/primitives";
import { cva, type VariantProps } from "class-variance-authority";

import { Button } from "./button";
import { Input } from "./input";
import { Separator } from "./separator";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "./sheet";
import { Skeleton } from "./skeleton";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "./tooltip";
import { cn } from "../lib/utils";

const SIDEBAR_WIDTH = "w-64"; // 원본 16rem
const SIDEBAR_WIDTH_MOBILE = "w-72"; // 원본 18rem
const SIDEBAR_WIDTH_ICON = "w-12"; // 원본 3rem
const SIDEBAR_WIDTH_ICON_PADDED = "w-14"; // 원본 calc(3rem + 1rem) 근사
const SIDEBAR_KEYBOARD_SHORTCUT = "b";

type SidebarContextProps = {
  state: "expanded" | "collapsed";
  open: boolean;
  setOpen: (open: boolean) => void;
  openMobile: boolean;
  setOpenMobile: (open: boolean) => void;
  isMobile: boolean;
  toggleSidebar: () => void;
  /** 포팅 확장 — 원본 data-variant/collapsible/side 속성그룹 셀렉터 근사 */
  variant: "sidebar" | "floating" | "inset";
  collapsible: "offcanvas" | "icon" | "none";
  side: "left" | "right";
};

const SidebarContext = React.createContext<SidebarContextProps | null>(null);

export function useSidebar(): SidebarContextProps {
  const context = React.useContext(SidebarContext);
  if (!context) {
    throw new Error("useSidebar는 <SidebarProvider> 안에서 사용해야 합니다.");
  }
  return context;
}

// 문자열 children을 스타일 지정된 내부 Text로 감싼다（이중 지정 원칙）.
function serializableChildren(
  children: React.ReactNode,
  textClassName: string,
): React.ReactNode {
  if (typeof children === "string" || typeof children === "number") {
    return <Text className={textClassName}>{children}</Text>;
  }
  return children;
}

// ---------------------------------------------------------------------------
// SidebarProvider
// ---------------------------------------------------------------------------

export type SidebarProviderProps = ViewProps & {
  defaultOpen?: boolean;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  /** 모바일 여부 — true면 Sidebar가 Sheet로 전환（기본 false 데스크톱） */
  isMobile?: boolean;
};

const SidebarProvider = React.forwardRef<
  BridgeViewRef,
  SidebarProviderProps
>(
  (
    {
      defaultOpen = true,
      open: openProp,
      onOpenChange: setOpenProp,
      isMobile = false,
      className,
      children,
      ...props
    },
    ref,
  ) => {
    const [openMobile, setOpenMobile] = React.useState(false);

    // 내부 상태 — openProp 제어형이면 무시된다（tabsdialog 관행）.
    const [_open, _setOpen] = React.useState(defaultOpen);
    const open = openProp ?? _open;
    const setOpen = React.useCallback(
      (value: boolean | ((value: boolean) => boolean)) => {
        const openState = typeof value === "function" ? value(open) : value;
        if (setOpenProp) {
          setOpenProp(openState);
        } else {
          _setOpen(openState);
        }
      },
      [setOpenProp, open],
    );

    const toggleSidebar = React.useCallback(() => {
      return isMobile
        ? setOpenMobile((open) => !open)
        : setOpen((open) => !open);
    }, [isMobile, setOpen]);

    // Ctrl/Cmd+B 단축키 — 웹 window 리스너（네이티브 no-op）.
    // RN(Hermes)은 window 전역이 global의 별칭이라 존재하지만 DOM API가 없다 —
    // 존재 여부가 아니라 addEventListener 함수 여부로 가드해야 한다(실증 2026-11-10).
    React.useEffect(() => {
      if (typeof window?.addEventListener !== "function") return;
      const handleKeyDown = (event: Event) => {
        const keyboardEvent = event as {
          key?: string;
          metaKey?: boolean;
          ctrlKey?: boolean;
          preventDefault?: () => void;
        };
        if (
          keyboardEvent.key === SIDEBAR_KEYBOARD_SHORTCUT &&
          (keyboardEvent.metaKey || keyboardEvent.ctrlKey)
        ) {
          keyboardEvent.preventDefault?.();
          toggleSidebar();
        }
      };
      window.addEventListener("keydown", handleKeyDown);
      return () => window.removeEventListener("keydown", handleKeyDown);
    }, [toggleSidebar]);

    const state = open ? "expanded" : "collapsed";

    const contextValue = React.useMemo<SidebarContextProps>(
      () => ({
        state,
        open,
        setOpen,
        isMobile,
        openMobile,
        setOpenMobile,
        toggleSidebar,
        // Sidebar가 실제 값으로 재제공하기 전의 기본값
        variant: "sidebar",
        collapsible: "offcanvas",
        side: "left",
      }),
      [state, open, setOpen, isMobile, openMobile, toggleSidebar],
    );

    return (
      <SidebarContext.Provider value={contextValue}>
        <TooltipProvider delayDuration={0}>
          <View
            ref={ref}
            className={cn("w-full flex-row web:min-h-svh", className)}
            {...props}
          >
            {children}
          </View>
        </TooltipProvider>
      </SidebarContext.Provider>
    );
  },
);
SidebarProvider.displayName = "SidebarProvider";

// ---------------------------------------------------------------------------
// Sidebar 루트 — isMobile이면 Sheet, 아니면 흐름 참여형 고정 열
// ---------------------------------------------------------------------------

export type SidebarProps = ViewProps & {
  side?: "left" | "right";
  variant?: "sidebar" | "floating" | "inset";
  collapsible?: "offcanvas" | "icon" | "none";
};

const Sidebar = React.forwardRef<BridgeViewRef, SidebarProps>(
  (
    {
      side = "left",
      variant = "sidebar",
      collapsible = "offcanvas",
      className,
      children,
      ...props
    },
    ref,
  ) => {
    const sidebar = useSidebar();
    const { isMobile, state, openMobile, setOpenMobile } = sidebar;

    // 아이콘 접힘 여부 — 자식 토큰 근사의 공통 조건.
    const collapsed = state === "collapsed";
    const iconCollapsed = collapsed && collapsible === "icon";

    // 루트 context 재제공 — data-* 속성그룹 셀렉터 근사（attachment 관행）.
    const contextValue = React.useMemo<SidebarContextProps>(
      () => ({ ...sidebar, variant, collapsible, side }),
      [sidebar, variant, collapsible, side],
    );

    if (collapsible === "none") {
      return (
        <SidebarContext.Provider value={contextValue}>
          <View
            ref={ref}
            className={cn(
              // h-full 제거 — Provider(높이 부정 min-h) 안에서 100%가 콘텐츠
              // 높이로 붕괴한다. 네이티브는 flex-row 교차축 stretch, 웹은
              // sticky+h-svh(원본 fixed inset-y-0의 흐름 참여형 근사)로 채운다.
              "web:sticky web:top-0 web:h-svh flex-col bg-background text-foreground",
              SIDEBAR_WIDTH,
              className,
            )}
            {...props}
          >
            {children}
          </View>
        </SidebarContext.Provider>
      );
    }

    if (isMobile) {
      return (
        <SidebarContext.Provider value={contextValue}>
          <Sheet open={openMobile} onOpenChange={setOpenMobile}>
            <SheetContent
              side={side}
              showCloseButton={false}
              className={cn(
                "gap-0 bg-background p-0 text-foreground",
                SIDEBAR_WIDTH_MOBILE,
                className,
              )}
            >
              {/* 시각 숨김 근사（sr-only 대체） — 스크린리더 이름 유지 */}
              <SheetHeader className="absolute inset-0 gap-0 p-0 opacity-0">
                <SheetTitle>Sidebar</SheetTitle>
                <SheetDescription>
                  모바일 사이드바를 표시합니다.
                </SheetDescription>
              </SheetHeader>
              <View className="h-full w-full flex-col">{children}</View>
            </SheetContent>
          </Sheet>
        </SidebarContext.Provider>
      );
    }

    // offcanvas 접힘 — 원본 화면 밖 슬라이드 대신 폭 0경계 제거로 즉시 전환.
    const widthClass = collapsed
      ? collapsible === "icon"
        ? variant === "sidebar"
          ? SIDEBAR_WIDTH_ICON
          : SIDEBAR_WIDTH_ICON_PADDED
        : "w-0"
      : SIDEBAR_WIDTH;

    const inner = (
      <View className="h-full w-full flex-col bg-background text-foreground">
        {children}
      </View>
    );

    return (
      <SidebarContext.Provider value={contextValue}>
        <View
          ref={ref}
          className={cn(
            // h-full 제거 근거는 collapsible=none 분기 주석과 동일 —
            // 웹은 sticky+h-svh로 뷰포트 높이 고정(스크롤 문서에서도 잔류),
            // 네이티브는 교차축 stretch로 부모를 채운다.
            "relative web:sticky web:top-0 web:h-svh overflow-hidden",
            widthClass,
            variant === "sidebar" &&
              !collapsed &&
              (side === "left" ? "border-r" : "border-l"),
            variant === "floating" || variant === "inset" ? "p-2" : "",
            className,
          )}
          {...props}
        >
          {variant === "floating" ? (
            <View className="h-full w-full flex-col rounded-lg border bg-background text-foreground shadow-sm">
              {children}
            </View>
          ) : (
            inner
          )}
        </View>
      </SidebarContext.Provider>
    );
  },
);
Sidebar.displayName = "Sidebar";

// ---------------------------------------------------------------------------
// Trigger / Rail / Inset
// ---------------------------------------------------------------------------

export type SidebarTriggerProps = PressableProps;

const SidebarTrigger = React.forwardRef<
  BridgePressableRef,
  SidebarTriggerProps
>(({ className, onPress, ...props }, ref) => {
  const { toggleSidebar } = useSidebar();
  return (
    <Button
      ref={ref}
      variant="ghost"
      size="icon"
      accessibilityLabel="Toggle Sidebar"
      className={cn("size-7", className)}
      onPress={() => {
        onPress?.();
        toggleSidebar();
      }}
      {...props}
    >
      <PanelLeftIcon className="size-4" />
    </Button>
  );
});
SidebarTrigger.displayName = "SidebarTrigger";

export type SidebarRailProps = PressableProps;

const SidebarRail = React.forwardRef<BridgePressableRef, SidebarRailProps>(
  ({ className, onPress, ...props }, ref) => {
    const { toggleSidebar, isMobile, side } = useSidebar();
    // 모바일（시트）에서는 레일이 무의미 — 렌더하지 않는다（원본 hidden sm:flex）.
    if (isMobile) return null;
    return (
      <Pressable
        ref={ref}
        accessibilityLabel="Toggle Sidebar"
        onPress={() => {
          onPress?.();
          toggleSidebar();
        }}
        className={cn(
          // 원본: -translate-x-1/2 + side=left -right-4 / side=right left-0.
          "absolute inset-y-0 z-20 w-4 -translate-x-1/2",
          side === "left" ? "-right-4" : "left-0",
          className,
        )}
        {...props}
      />
    );
  },
);
SidebarRail.displayName = "SidebarRail";

export type SidebarInsetProps = ViewProps;

const SidebarInset = React.forwardRef<BridgeViewRef, SidebarInsetProps>(
  ({ className, ...props }, ref) => {
    // 원본 md:peer-data-［variant=inset］:* 토큰 근사 — variantstate context 판독.
    const { variant, state } = useSidebar();
    const inset = variant === "inset";
    return (
      <View
        ref={ref}
        className={cn(
          "relative flex w-full flex-1 flex-col bg-background",
          inset && "m-2 ml-0 rounded-xl shadow-sm",
          inset && state === "collapsed" && "ml-2",
          className,
        )}
        {...props}
      />
    );
  },
);
SidebarInset.displayName = "SidebarInset";

// ---------------------------------------------------------------------------
// Input / Header / Footer / Separator / Content
// ---------------------------------------------------------------------------

export type SidebarInputProps = TextInputProps;

const SidebarInput = React.forwardRef<BridgeTextInputRef, SidebarInputProps>(
  ({ className, ...props }, ref) => (
    <Input
      ref={ref}
      className={cn("h-8 w-full bg-background shadow-none", className)}
      {...props}
    />
  ),
);
SidebarInput.displayName = "SidebarInput";

export type SidebarHeaderProps = ViewProps;

const SidebarHeader = React.forwardRef<BridgeViewRef, SidebarHeaderProps>(
  ({ className, ...props }, ref) => (
    <View ref={ref} className={cn("flex-col gap-2 p-2", className)} {...props} />
  ),
);
SidebarHeader.displayName = "SidebarHeader";

export type SidebarFooterProps = ViewProps;

const SidebarFooter = React.forwardRef<BridgeViewRef, SidebarFooterProps>(
  ({ className, ...props }, ref) => (
    <View ref={ref} className={cn("flex-col gap-2 p-2", className)} {...props} />
  ),
);
SidebarFooter.displayName = "SidebarFooter";

export type SidebarSeparatorProps = ViewProps;

const SidebarSeparator = React.forwardRef<BridgeViewRef, SidebarSeparatorProps>(
  ({ className, ...props }, ref) => (
    <Separator
      ref={ref}
      className={cn("mx-2 w-auto bg-border", className)}
      {...props}
    />
  ),
);
SidebarSeparator.displayName = "SidebarSeparator";

export type SidebarContentProps = ScrollViewProps;

const SidebarContent = React.forwardRef<
  BridgeScrollViewRef,
  SidebarContentProps
>(({ className, ...props }, ref) => {
  const { state, collapsible } = useSidebar();
  const iconCollapsed = state === "collapsed" && collapsible === "icon";
  return (
    <ScrollView
      ref={ref}
      contentContainerClassName="flex-col gap-2"
      className={cn(
        "min-h-0 flex-1",
        iconCollapsed && "overflow-hidden",
        className,
      )}
      {...props}
    />
  );
});
SidebarContent.displayName = "SidebarContent";

// ---------------------------------------------------------------------------
// Group 계열
// ---------------------------------------------------------------------------

export type SidebarGroupProps = ViewProps;

const SidebarGroup = React.forwardRef<BridgeViewRef, SidebarGroupProps>(
  ({ className, ...props }, ref) => (
    <View
      ref={ref}
      className={cn("relative w-full min-w-0 flex-col p-2", className)}
      {...props}
    />
  ),
);
SidebarGroup.displayName = "SidebarGroup";

export type SidebarGroupLabelProps = TextProps;

const SidebarGroupLabel = React.forwardRef<
  BridgeTextRef,
  SidebarGroupLabelProps
>(({ className, children, ...props }, ref) => {
  const { state, collapsible } = useSidebar();
  const iconCollapsed = state === "collapsed" && collapsible === "icon";
  return (
    <View
      className={cn(
        "h-8 shrink-0 flex-row items-center rounded-md px-2",
        "web:focus-visible:ring-2 web:focus-visible:ring-ring",
        iconCollapsed && "-mt-8 opacity-0",
        className,
      )}
    >
      <Text
        ref={ref}
        className="font-sans text-xs font-medium text-foreground/70"
        {...props}
      >
        {children}
      </Text>
    </View>
  );
});
SidebarGroupLabel.displayName = "SidebarGroupLabel";

export type SidebarGroupActionProps = PressableProps;

const SidebarGroupAction = React.forwardRef<
  BridgePressableRef,
  SidebarGroupActionProps
>(({ className, children, onPress, ...props }, ref) => {
  const { state, collapsible } = useSidebar();
  const iconCollapsed = state === "collapsed" && collapsible === "icon";
  // 아이콘 접힘 시 비활성（원본 group-data-［collapsible=icon］:hidden）.
  if (iconCollapsed) return null;
  return (
    <Pressable
      ref={ref}
      accessibilityRole="button"
      // after:-inset-2（8px 히트영역 확장）의 근사 — hitSlop.
      hitSlop={8}
      className={cn(
        "absolute top-3.5 right-3 aspect-square w-5 items-center justify-center rounded-md p-0",
        "web:focus-visible:ring-2 web:focus-visible:ring-ring active:bg-accent",
        className,
      )}
      onPress={onPress}
      {...props}
    >
      {serializableChildren(
        children,
        "font-sans text-sm text-foreground active:text-accent-foreground",
      )}
    </Pressable>
  );
});
SidebarGroupAction.displayName = "SidebarGroupAction";

export type SidebarGroupContentProps = ViewProps;

const SidebarGroupContent = React.forwardRef<
  BridgeViewRef,
  SidebarGroupContentProps
>(({ className, ...props }, ref) => (
  <View ref={ref} className={cn("w-full", className)} {...props} />
));
SidebarGroupContent.displayName = "SidebarGroupContent";

// ---------------------------------------------------------------------------
// Menu 계열
// ---------------------------------------------------------------------------

export type SidebarMenuProps = ViewProps;

const SidebarMenu = React.forwardRef<BridgeViewRef, SidebarMenuProps>(
  ({ className, ...props }, ref) => (
    <View
      ref={ref}
      accessibilityRole="list"
      className={cn("w-full min-w-0 flex-col gap-1", className)}
      {...props}
    />
  ),
);
SidebarMenu.displayName = "SidebarMenu";

export type SidebarMenuItemProps = ViewProps;

const SidebarMenuItem = React.forwardRef<BridgeViewRef, SidebarMenuItemProps>(
  ({ className, ...props }, ref) => (
    <View
      ref={ref}
      accessibilityRole="listitem"
      className={cn("relative", className)}
      {...props}
    />
  ),
);
SidebarMenuItem.displayName = "SidebarMenuItem";

const sidebarMenuButtonVariants = cva(
  // 원본 base의 hover·active 피드백（hover:bg-sidebar-accent hover:text-sidebar-accent-foreground
  // active:bg-sidebar-accent active:text-sidebar-accent-foreground）를 토큰 대응(bg-accent 등)으로
  // 복원 — hover 전경색은 RN 미상속이라 내부 Text에도 web:hover 이중 지정한다.
  // flex-row 필수: 브리지 Pressable 기본이 flex-col이라(아이콘+라벨이 세로로
  // 쌓이며 h-8에서 라벨이 밀려 보임) 여기서 방향을 덮어쓴다.
  "flex flex-row w-full items-center gap-2 overflow-hidden rounded-md p-2 text-left text-sm web:hover:bg-accent active:bg-accent web:hover:text-accent-foreground active:text-accent-foreground web:focus-visible:ring-2 web:focus-visible:ring-ring disabled:opacity-50 disabled:web:pointer-events-none",
  {
    variants: {
      variant: {
        default: "",
        // 원본 shadow-［0_0_0_1px_var（--sidebar-border）］ → border 근사.
        // hover 링 색 전환（shadow→sidebar-accent）은 border-accent로 대응.
        outline: "border border-border bg-background web:hover:border-accent",
      },
      size: {
        default: "h-8 text-sm",
        sm: "h-7 text-xs",
        lg: "h-12 text-sm",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

export type SidebarMenuButtonProps = PressableProps & {
  isActive?: boolean;
  /** 접힘 시 툴팁 문구（TooltipContentProps 전달도 지원） */
  tooltip?: string | React.ComponentProps<typeof TooltipContent>;
} & VariantProps<typeof sidebarMenuButtonVariants>;

const SidebarMenuButton = React.forwardRef<
  BridgePressableRef,
  SidebarMenuButtonProps
>(
  (
    {
      isActive = false,
      variant = "default",
      size = "default",
      tooltip,
      className,
      children,
      onPress,
      ...props
    },
    ref,
  ) => {
    const { state, collapsible, isMobile } = useSidebar();
    const iconCollapsed = state === "collapsed" && collapsible === "icon";

    const classes = cn(
      sidebarMenuButtonVariants({ variant, size }),
      isActive && "bg-accent font-medium",
      iconCollapsed && "size-8 p-2",
      className,
    );
    const content = serializableChildren(
      children,
      cn(
        // hover·active 전경색 이중 지정 — 컨테이너 클래스만으론 RN에서 자식이
        // 물려받지 못하고, 웹에서는 Text 고유 클래스가 상속보다 우선한다.
        "font-sans text-sm truncate web:hover:text-accent-foreground active:text-accent-foreground",
        isActive ? "text-accent-foreground" : "text-foreground",
      ),
    );

    // 툴팁 없음 또는 전개 상태（라벨이 보임）모바일이면 일반 버튼.
    if (!tooltip || !iconCollapsed || isMobile) {
      return (
        <Pressable
          ref={ref}
          accessibilityRole="button"
          className={classes}
          onPress={onPress}
          {...props}
        >
          {content}
        </Pressable>
      );
    }

    const tooltipOptions =
      typeof tooltip === "string" ? { children: tooltip } : tooltip;

    // 접힘 상태에서만 툴팁 — press-to-toggle 툴팁을 소비（머리주석 참조）.
    return (
      <Tooltip>
        <TooltipTrigger
          ref={ref}
          accessibilityRole="button"
          className={classes}
          onPress={onPress}
          {...props}
        >
          {content}
        </TooltipTrigger>
        <TooltipContent side="right" align="center" {...tooltipOptions} />
      </Tooltip>
    );
  },
);
SidebarMenuButton.displayName = "SidebarMenuButton";

export type SidebarMenuActionProps = PressableProps & {
  /** 원본 showOnHover 표시 제어는 그룹 셀렉터 의존이라 미지원（항상 표시） */
  showOnHover?: boolean;
};

const SidebarMenuAction = React.forwardRef<
  BridgePressableRef,
  SidebarMenuActionProps
>(({ className, children, onPress, showOnHover: _showOnHover, ...props }, ref) => {
  const { state, collapsible } = useSidebar();
  const iconCollapsed = state === "collapsed" && collapsible === "icon";
  if (iconCollapsed) return null;
  return (
    <Pressable
      ref={ref}
      accessibilityRole="button"
      hitSlop={8}
      className={cn(
        "absolute top-1.5 right-1 aspect-square w-5 items-center justify-center rounded-md p-0",
        "web:focus-visible:ring-2 web:focus-visible:ring-ring active:bg-accent",
        className,
      )}
      onPress={onPress}
      {...props}
    >
      {serializableChildren(
        children,
        "font-sans text-sm text-foreground active:text-accent-foreground",
      )}
    </Pressable>
  );
});
SidebarMenuAction.displayName = "SidebarMenuAction";

export type SidebarMenuBadgeProps = ViewProps;

const SidebarMenuBadge = React.forwardRef<
  BridgeViewRef,
  SidebarMenuBadgeProps
>(({ className, children, ...props }, ref) => {
  const { state, collapsible } = useSidebar();
  const iconCollapsed = state === "collapsed" && collapsible === "icon";
  if (iconCollapsed) return null;
  return (
    <View
      ref={ref}
      className={cn(
        "absolute top-1.5 right-1 h-5 min-w-5 flex-row items-center justify-center rounded-md px-1",
        "web:select-none web:tabular-nums",
        className,
      )}
      {...props}
    >
      {serializableChildren(children, "font-sans text-xs font-medium text-foreground")}
    </View>
  );
});
SidebarMenuBadge.displayName = "SidebarMenuBadge";

export type SidebarMenuSkeletonProps = ViewProps & {
  showIcon?: boolean;
};

const SidebarMenuSkeleton = React.forwardRef<
  BridgeViewRef,
  SidebarMenuSkeletonProps
>(({ className, showIcon = false, ...props }, ref) => {
  // 50~90% 랜덤 폭 — 원본 CSS 변수 대신 style maxWidth 직접 값.
  const width = React.useMemo(() => {
    return `${Math.floor(Math.random() * 40) + 50}%`;
  }, []);
  return (
    <View
      ref={ref}
      className={cn("h-8 flex-row items-center gap-2 rounded-md px-2", className)}
      {...props}
    >
      {showIcon && <Skeleton className="size-4 rounded-md" />}
      <Skeleton className="h-4 flex-1 rounded-md" style={{ maxWidth: width }} />
    </View>
  );
});
SidebarMenuSkeleton.displayName = "SidebarMenuSkeleton";

export type SidebarMenuSubProps = ViewProps;

const SidebarMenuSub = React.forwardRef<BridgeViewRef, SidebarMenuSubProps>(
  ({ className, ...props }, ref) => {
    const { state, collapsible } = useSidebar();
    const iconCollapsed = state === "collapsed" && collapsible === "icon";
    if (iconCollapsed) return null;
    return (
      <View
        ref={ref}
        accessibilityRole="list"
        className={cn(
          "mx-3.5 min-w-0 flex-col gap-1 border-l border-border px-2.5 py-0.5",
          className,
        )}
        {...props}
      />
    );
  },
);
SidebarMenuSub.displayName = "SidebarMenuSub";

export type SidebarMenuSubItemProps = ViewProps;

const SidebarMenuSubItem = React.forwardRef<
  BridgeViewRef,
  SidebarMenuSubItemProps
>(({ className, ...props }, ref) => (
  <View
    ref={ref}
    accessibilityRole="listitem"
    className={cn("relative", className)}
    {...props}
  />
));
SidebarMenuSubItem.displayName = "SidebarMenuSubItem";

export type SidebarMenuSubButtonProps = PressableProps & {
  size?: "sm" | "md";
  isActive?: boolean;
};

const SidebarMenuSubButton = React.forwardRef<
  BridgePressableRef,
  SidebarMenuSubButtonProps
>(
  (
    { size = "md", isActive = false, className, children, onPress, ...props },
    ref,
  ) => {
    const { state, collapsible } = useSidebar();
    const iconCollapsed = state === "collapsed" && collapsible === "icon";
    if (iconCollapsed) return null;
    return (
      <Pressable
        ref={ref}
        // 원본이 <a> 기반이라 링크 역할로 근사（href 계약은 부재）.
        accessibilityRole="link"
        className={cn(
          // 원본 hover·active 피드백 복원（전경색은 내부 Text 이중 지정）.
          "h-7 min-w-0 w-full flex-row items-center gap-2 overflow-hidden rounded-md px-2 web:hover:bg-accent active:bg-accent web:hover:text-accent-foreground active:text-accent-foreground",
          isActive && "bg-accent",
          className,
        )}
        onPress={onPress}
        {...props}
      >
        {serializableChildren(
          children,
          cn(
            "font-sans truncate web:hover:text-accent-foreground active:text-accent-foreground",
            size === "sm" ? "text-xs" : "text-sm",
            isActive ? "text-accent-foreground" : "text-foreground",
          ),
        )}
      </Pressable>
    );
  },
);
SidebarMenuSubButton.displayName = "SidebarMenuSubButton";

export {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupAction,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarInput,
  SidebarInset,
  SidebarMenu,
  SidebarMenuAction,
  SidebarMenuBadge,
  SidebarMenuButton,
  sidebarMenuButtonVariants,
  SidebarMenuItem,
  SidebarMenuSkeleton,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  SidebarProvider,
  SidebarRail,
  SidebarSeparator,
  SidebarTrigger,
};
