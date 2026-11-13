// Drawer — shadcn/ui（new-york-v4） drawer.tsx 유니버설 포팅 （사이클 40, T-1a）.
// 원본: shadcn-ref/ui/drawer.tsx — vaul（드래그 바텀시트 엔진）을 제거하고 열림
// 상태는 React state + context로 직접 관리한다. 포털백드롭포커스 관리ESC
// 닫기스크롤 잠금은 lib/overlay의 ModalOverlay가, 드래그는 브리지 useDrag가
// 담당한다（dialog.tsxsheet.tsx 형제 포팅）.
//
// 포팅 판단（원본 대비 차이）:
// - vaul 제거 — 드래그로 닫기（디자인 계획 §3）만 useDrag로 최소 재현: 바텀
//   방향 핸들에서 아래로 80px 이상 끌면 닫는다. 핸들에서만 드래그를 받아 카드
//   안 버튼스크롤과 충돌하지 않게 했다. vaul의 나머지 기능（콘텐츠 스크롤과
//   제스처 통합스냅 루버 밴드드래그 중 카드 추적 이동키패드 대응）은 미지원
//   — 로드맵. topleftright 방향 드래그 닫기도 미지원.
// - direction은 원본 vaul 기본값 "bottom" 유지, 브리프 지정 방향 leftright를
//   포함해 4방향 전부 지원한다（시트와 구분: drawer는 핸들+드래그 닫기+높이 제한）.
// - 원본 data-［vaul-drawer-direction=］ 그룹 셀렉터 → cva direction 변형 +
//   React context 전파（헤더 정렬용 — alert.tsx 관행）. 핸들 표시 여부도 원본
//   group-data 셀렉터 대신 direction === "bottom" 조건부 렌더로 전개.
// - 임의값 클래스 금지에 따라 w-［100px］ → w-24, max-h-［80vh］ → max-h-96（24rem
//   고정 근사 — 뷰포트 비례 높이는 로드맵: BridgeStyle 퍼센트 또는 사용처
//   className 오버라이드）. mt-24/mb-24（드래그 여유 공간）rounded-t/b-lg
//   sm:max-w-sm 토큰은 유지.
// - 등장/퇴장 애니메이션（fade）은 data-［state］ 의존이라 소실 — 마운트/언마운트
//   즉시 전환（로드맵）. 원본은 닫기 버튼이 없어（드래그백드롭 닫기） 포팅도
//   동일하다（웹 ESC백드롭 눌림은 ModalOverlay가 담당）.
// - 트리거닫기는 asChild 대신 Pressable 직렬화（문자열 children → 내부 Text）.
// - 접근성 연결（dialog 포팅과 동일）: role="dialog"aria-modal은 ModalOverlay,
//   트리거 aria-expandedaria-controls ↔ 카드 nativeID（useId 토대）, 카드
//   aria-describedby ↔ 설명 nativeID, aria-labelledby ↔ 제목 nativeID
//   （ModalOverlay prop으로 전달 — G3 리뷰 제기 반영）.
// - DrawerOverlayDrawerPortal export 제거 — ModalOverlay로 통합.
import {
  createContext,
  forwardRef,
  useCallback,
  useContext,
  useId,
  useMemo,
  useRef,
  useState,
  type ReactNode,
  type RefObject,
} from "react";
import {
  Pressable,
  Text,
  View,
  useDrag,
  type BridgePressableRef,
  type BridgeTextRef,
  type BridgeViewRef,
  type PressableProps,
  type TextProps,
  type ViewProps,
} from "@unikit-bridge/ui/primitives";
import { cva } from "class-variance-authority";

import { ModalOverlay, type ModalOverlayPosition } from "../lib/overlay";
import { cn } from "@/lib/utils";

type DrawerContextValue = {
  open: boolean;
  setOpen: (open: boolean) => void;
  /** 트리거 aria-controls ↔ 카드 nativeID 연결 */
  contentId: string;
  /** 제목 nativeID — 라벨 연결（aria-labelledby） 대기 토대 */
  titleId: string;
  /** 설명 nativeID — 카드 aria-describedby가 참조 */
  descriptionId: string;
  /** 트리거 요소 저장소 — ModalOverlay triggerRef（닫힘 후 포커스 복귀）로 전달 */
  triggerRef: RefObject<unknown>;
  setTriggerElement: (element: unknown) => void;
};

const DrawerContext = createContext<DrawerContextValue | null>(null);

function useDrawerContext(component: string): DrawerContextValue {
  const ctx = useContext(DrawerContext);
  if (!ctx) {
    throw new Error(`<${component}>는 <Drawer> 안에서 사용해야 합니다.`);
  }
  return ctx;
}

// 방향 context — 원본 group-data-［vaul-drawer-direction］ 셀렉터 대체（헤더 정렬）.
const DrawerDirectionContext = createContext<"top" | "right" | "bottom" | "left">(
  "bottom",
);

// 카드 변형 — 남는 축 토큰 유지（가장자리 고정은 ModalOverlay position이 담당）.
// bottom/top의 mt-24/mb-24는 드래그 여유 공간（vaul 관행）이자 높이 상한의 역할.
const drawerContentVariants = cva(
  "pointer-events-auto relative flex-col bg-background",
  {
    variants: {
      direction: {
        top: "w-full mb-24 max-h-96 rounded-b-lg border-b unikit-sheet-in-top",
        bottom: "w-full mt-24 max-h-96 rounded-t-lg border-t unikit-sheet-in-bottom",
        left: "h-full w-3/4 border-r unikit-sheet-in-left sm:max-w-sm",
        right: "h-full w-3/4 border-l unikit-sheet-in-right sm:max-w-sm",
      },
    },
    defaultVariants: {
      direction: "bottom",
    },
  },
);

export type DrawerProps = ViewProps & {
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
};

const Drawer = forwardRef<BridgeViewRef, DrawerProps>(
  ({ open, defaultOpen = false, onOpenChange, children, ...props }, ref) => {
    // 비제어 상태 — 제어（open 지정）면 무시된다（tabsaccordion 관행）.
    const [internalOpen, setInternalOpen] = useState(defaultOpen);
    const isOpen = open ?? internalOpen;
    const stateRef = useRef({ open, isOpen, onOpenChange });
    stateRef.current = { open, isOpen, onOpenChange };
    const setOpen = useCallback((next: boolean) => {
      const state = stateRef.current;
      if (state.open === undefined) setInternalOpen(next);
      if (next !== state.isOpen) state.onOpenChange?.(next);
    }, []);
    const baseId = useId();
    const triggerRef = useRef<unknown>(null);
    const setTriggerElement = useCallback((element: unknown) => {
      triggerRef.current = element;
    }, []);
    const contextValue = useMemo<DrawerContextValue>(
      () => ({
        open: isOpen,
        setOpen,
        contentId: `${baseId}-drawer-content`,
        titleId: `${baseId}-drawer-title`,
        descriptionId: `${baseId}-drawer-description`,
        triggerRef,
        setTriggerElement,
      }),
      [isOpen, setOpen, baseId, setTriggerElement],
    );
    return (
      <DrawerContext.Provider value={contextValue}>
        <View ref={ref} {...props}>
          {children}
        </View>
      </DrawerContext.Provider>
    );
  },
);
Drawer.displayName = "Drawer";

export type DrawerTriggerProps = PressableProps & {
  // asChild 미지원 — 문자열 children은 내부 Text로 감싸고, ReactNode는 그대로.
  children?: ReactNode;
};

const DrawerTrigger = forwardRef<BridgePressableRef, DrawerTriggerProps>(
  ({ className, children, disabled, onPress, ...props }, forwardedRef) => {
    const drawer = useDrawerContext("DrawerTrigger");
    // 콜백 ref — 외부 ref 병합 + 트리거 요소를 컨텍스트에 등록（포커스 복귀 대상）.
    const setRef = (element: BridgePressableRef | null) => {
      drawer.setTriggerElement(element);
      if (typeof forwardedRef === "function") forwardedRef(element);
      else if (forwardedRef) forwardedRef.current = element;
    };
    return (
      <Pressable
        ref={setRef}
        accessibilityRole="button"
        aria-expanded={drawer.open}
        aria-controls={drawer.contentId}
        disabled={disabled}
        onPress={() => {
          drawer.setOpen(true);
          onPress?.();
        }}
        className={className}
        {...props}
      >
        {typeof children === "string" || typeof children === "number" ? (
          <Text className="font-sans text-sm font-medium text-foreground">
            {children}
          </Text>
        ) : (
          children
        )}
      </Pressable>
    );
  },
);
DrawerTrigger.displayName = "DrawerTrigger";

export type DrawerCloseProps = PressableProps & {
  // DrawerTrigger와 동일 — 문자열 children은 내부 Text로 감싼다.
  children?: ReactNode;
};

const DrawerClose = forwardRef<BridgePressableRef, DrawerCloseProps>(
  ({ className, children, disabled, onPress, ...props }, ref) => {
    const drawer = useDrawerContext("DrawerClose");
    return (
      <Pressable
        ref={ref}
        accessibilityRole="button"
        disabled={disabled}
        onPress={() => {
          drawer.setOpen(false);
          onPress?.();
        }}
        className={className}
        {...props}
      >
        {typeof children === "string" || typeof children === "number" ? (
          <Text className="font-sans text-sm font-medium text-foreground">
            {children}
          </Text>
        ) : (
          children
        )}
      </Pressable>
    );
  },
);
DrawerClose.displayName = "DrawerClose";

export type DrawerContentProps = ViewProps & {
  direction?: "top" | "right" | "bottom" | "left";
};

const DrawerContent = forwardRef<BridgeViewRef, DrawerContentProps>(
  ({ className, children, direction = "bottom", nativeID, ...props }, ref) => {
    const drawer = useDrawerContext("DrawerContent");
    // 아래 드래그 닫기 — vaul 제스처의 최소 대체（핸들 전용, 임계값 80px）.
    const { dragHandlers } = useDrag({
      onMove: (event) => {
        if (event.dy > 80) drawer.setOpen(false);
      },
    });
    return (
      <ModalOverlay
        visible={drawer.open}
        onClose={() => drawer.setOpen(false)}
        position={direction as ModalOverlayPosition}
        // z-50는 오버레이 중첩 규칙 토큰（§2.3）. 드로어는 가장자리에 붙는다.
        className="z-50"
        backdropClassName="z-50"
        triggerRef={drawer.triggerRef}
        accessibilityRole="dialog"
        aria-labelledby={drawer.titleId}
      >
        <DrawerDirectionContext.Provider value={direction}>
          <View
            ref={ref}
            nativeID={nativeID ?? drawer.contentId}
            aria-describedby={drawer.descriptionId}
            className={cn(drawerContentVariants({ direction }), className)}
            {...props}
          >
            {direction === "bottom" && (
              <View
                aria-hidden
                // 드래그 핸들 — 웹 포인터 이벤트/네이티브 panHandlers 펼침.
                {...(dragHandlers as ViewProps)}
                className="mx-auto mt-4 h-2 w-24 shrink-0 rounded-full bg-muted"
              />
            )}
            {children}
          </View>
        </DrawerDirectionContext.Provider>
      </ModalOverlay>
    );
  },
);
DrawerContent.displayName = "DrawerContent";

export type DrawerHeaderProps = ViewProps;

const DrawerHeader = forwardRef<BridgeViewRef, DrawerHeaderProps>(
  ({ className, ...props }, ref) => {
    const direction = useContext(DrawerDirectionContext);
    return (
      <View
        ref={ref}
        className={cn(
          // 바텀탭 드로어는 중앙 정렬（원본 group-data 셀렉터）, md부터는 원본대로
          // 좌측 정렬로 전환（md: 토큰이 나중에 이긴다 — 원본 캐스케이드 동일）.
          "gap-0.5 p-4",
          (direction === "bottom" || direction === "top") && "text-center",
          "md:gap-1.5 md:text-left",
          className,
        )}
        {...props}
      />
    );
  },
);
DrawerHeader.displayName = "DrawerHeader";

export type DrawerFooterProps = ViewProps;

const DrawerFooter = forwardRef<BridgeViewRef, DrawerFooterProps>(
  ({ className, ...props }, ref) => (
    <View ref={ref} className={cn("mt-auto gap-2 p-4", className)} {...props} />
  ),
);
DrawerFooter.displayName = "DrawerFooter";

export type DrawerTitleProps = TextProps;

const DrawerTitle = forwardRef<BridgeTextRef, DrawerTitleProps>(
  ({ className, nativeID, ...props }, ref) => {
    const drawer = useDrawerContext("DrawerTitle");
    return (
      <Text
        ref={ref}
        nativeID={nativeID ?? drawer.titleId}
        className={cn("font-sans font-semibold text-foreground", className)}
        {...props}
      />
    );
  },
);
DrawerTitle.displayName = "DrawerTitle";

export type DrawerDescriptionProps = TextProps;

const DrawerDescription = forwardRef<BridgeTextRef, DrawerDescriptionProps>(
  ({ className, nativeID, ...props }, ref) => {
    const drawer = useDrawerContext("DrawerDescription");
    return (
      <Text
        ref={ref}
        nativeID={nativeID ?? drawer.descriptionId}
        className={cn("font-sans text-sm text-muted-foreground", className)}
        {...props}
      />
    );
  },
);
DrawerDescription.displayName = "DrawerDescription";

export {
  Drawer,
  DrawerTrigger,
  DrawerClose,
  DrawerContent,
  DrawerHeader,
  DrawerFooter,
  DrawerTitle,
  DrawerDescription,
  drawerContentVariants,
};
