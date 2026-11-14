// Sheet — shadcn/ui（new-york-v4） sheet.tsx 유니버설 포팅 （사이클 40, T-1a）.
// 원본: shadcn-ref/ui/sheet.tsx — radix Dialog（시트 변형） 엔진을 제거하고 열림
// 상태는 React state + context로 직접 관리한다. 포털백드롭포커스 관리ESC
// 닫기스크롤 잠금은 lib/overlay의 ModalOverlay가 담당한다（dialog.tsx 형제）.
//
// 포팅 판단（원본 대비 차이）:
// - 기본 side를 원본 "right" → "bottom"으로 변경（사이클 40 브리프 — 모바일
//   바텀시트 우선, sm에서도 bottom 유지. 원본 4방향 전부 side prop으로 지원）.
// - 원본의 fixed + inset-*-0 가장자리 고정 배치는 ModalOverlay position
//   （top/right/bottom/left — 래퍼 flex 정렬）이 담당하고, 카드는 남는 축 토큰
//   （높이 h-full폭 w-3/4 sm:max-w-sm테두리 border-l/r/t/b）만 유지한다.
// - 등장/퇴장 애니메이션（slide-in/outtransitionease-in-outduration）은
//   data-［state］ 의존이라 소실 — 마운트/언마운트 즉시 전환（로드맵）.
// - XIcon — 브리지 lucide 아이콘 프리미티브（primitives 경유）. sr-only "Close"는
//   accessibilityLabel로 대체（dialog 포팅과 동일）.
// - 트리거닫기는 asChild 대신 Pressable 직렬화（문자열 children → 내부 Text）.
// - 접근성 연결（dialog 포팅과 동일）: role="dialog"aria-modal은 ModalOverlay,
//   트리거 aria-expandedaria-controls ↔ 카드 nativeID（useId 토대）, 카드
//   aria-describedby ↔ 설명 nativeID, aria-labelledby ↔ 제목 nativeID
//   （ModalOverlay prop으로 전달 — G3 리뷰 제기 반영）.
// - 원본 SheetOverlaySheetPortal은 export 목록에 없지만（내부 사용） 포팅은
//   ModalOverlay가 그 역할을 통합 수행한다.
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
  XIcon,
  type BridgePressableRef,
  type BridgeTextRef,
  type BridgeViewRef,
  type PressableProps,
  type TextProps,
  type ViewProps,
} from "@unikit-bridge/ui/primitives";
import { cva } from "class-variance-authority";

import { ModalOverlay, type ModalOverlayPosition } from "@/lib/overlay";
import { cn } from "@/lib/utils";

type SheetContextValue = {
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

const SheetContext = createContext<SheetContextValue | null>(null);

function useSheetContext(component: string): SheetContextValue {
  const ctx = useContext(SheetContext);
  if (!ctx) {
    throw new Error(`<${component}>는 <Sheet> 안에서 사용해야 합니다.`);
  }
  return ctx;
}

// 카드 변형 — 남는 축 토큰만 원본에서 유지（가장자리 고정은 ModalOverlay가 담당）.
const sheetContentVariants = cva(
  "pointer-events-auto relative flex-col gap-4 bg-background shadow-lg",
  {
    variants: {
      side: {
        top: "w-full border-b unikit-sheet-in-top",
        bottom: "w-full border-t unikit-sheet-in-bottom",
        left: "h-full w-3/4 border-r unikit-sheet-in-left sm:max-w-sm",
        right: "h-full w-3/4 border-l unikit-sheet-in-right sm:max-w-sm",
      },
    },
    defaultVariants: {
      side: "bottom",
    },
  },
);

export type SheetProps = ViewProps & {
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
};

const Sheet = forwardRef<BridgeViewRef, SheetProps>(
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
    const contextValue = useMemo<SheetContextValue>(
      () => ({
        open: isOpen,
        setOpen,
        contentId: `${baseId}-sheet-content`,
        titleId: `${baseId}-sheet-title`,
        descriptionId: `${baseId}-sheet-description`,
        triggerRef,
        setTriggerElement,
      }),
      [isOpen, setOpen, baseId, setTriggerElement],
    );
    return (
      <SheetContext.Provider value={contextValue}>
        <View ref={ref} {...props}>
          {children}
        </View>
      </SheetContext.Provider>
    );
  },
);
Sheet.displayName = "Sheet";

export type SheetTriggerProps = PressableProps & {
  // asChild 미지원 — 문자열 children은 내부 Text로 감싸고, ReactNode는 그대로.
  children?: ReactNode;
};

const SheetTrigger = forwardRef<BridgePressableRef, SheetTriggerProps>(
  ({ className, children, disabled, onPress, ...props }, forwardedRef) => {
    const sheet = useSheetContext("SheetTrigger");
    // 콜백 ref — 외부 ref 병합 + 트리거 요소를 컨텍스트에 등록（포커스 복귀 대상）.
    const setRef = (element: BridgePressableRef | null) => {
      sheet.setTriggerElement(element);
      if (typeof forwardedRef === "function") forwardedRef(element);
      else if (forwardedRef) forwardedRef.current = element;
    };
    return (
      <Pressable
        ref={setRef}
        accessibilityRole="button"
        aria-expanded={sheet.open}
        aria-controls={sheet.contentId}
        disabled={disabled}
        onPress={() => {
          sheet.setOpen(true);
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
SheetTrigger.displayName = "SheetTrigger";

export type SheetCloseProps = PressableProps & {
  // SheetTrigger와 동일 — 문자열 children은 내부 Text로 감싼다.
  children?: ReactNode;
};

const SheetClose = forwardRef<BridgePressableRef, SheetCloseProps>(
  ({ className, children, disabled, onPress, ...props }, ref) => {
    const sheet = useSheetContext("SheetClose");
    return (
      <Pressable
        ref={ref}
        accessibilityRole="button"
        disabled={disabled}
        onPress={() => {
          sheet.setOpen(false);
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
SheetClose.displayName = "SheetClose";

// 기본 side는 원본 shadcn 기본값 "right"를 유지한다（사이클 40 초안이
// "bottom"으로 두었던 것을 G3 F-12 지적으로 복원 — API 기본값 호환）.
export type SheetContentProps = ViewProps & {
  side?: "top" | "right" | "bottom" | "left";
  showCloseButton?: boolean;
};

const SheetContent = forwardRef<BridgeViewRef, SheetContentProps>(
  (
    { className, children, side = "right", showCloseButton = true, nativeID, ...props },
    ref,
  ) => {
    const sheet = useSheetContext("SheetContent");
    return (
      <ModalOverlay
        visible={sheet.open}
        onClose={() => sheet.setOpen(false)}
        position={side as ModalOverlayPosition}
        // z-50는 오버레이 중첩 규칙 토큰（§2.3）. 시트는 가장자리에 붙으므로
        // 래퍼 여백 없음（원본 inset-0 flush 배치와 동일）.
        className="z-50"
        backdropClassName="z-50"
        triggerRef={sheet.triggerRef}
        accessibilityRole="dialog"
        aria-labelledby={sheet.titleId}
      >
        <View
          ref={ref}
          nativeID={nativeID ?? sheet.contentId}
          aria-describedby={sheet.descriptionId}
          className={cn(sheetContentVariants({ side }), className)}
          {...props}
        >
          {children}
          {showCloseButton && (
            <SheetClose
              accessibilityLabel="Close"
              // 원본 data-[state=open]:bg-secondary — 닫기 버튼은 열린 상태에서만
              // 보이므로 상시 적용과 동일. rounded-xs·무패딩 원본값.
              className={cn(
                "absolute top-4 right-4 rounded-xs bg-secondary opacity-70",
                "web:transition-opacity web:hover:opacity-100",
                "web:focus-visible:ring-2 web:focus-visible:ring-ring web:focus-visible:ring-offset-2 web:focus-visible:ring-offset-background",
              )}
            >
              {/* 원본은 전경 클래스가 없어（부모 상속 foreground） — 이중 지정
                  원칙으로 내부 아이콘에 text-foreground를 명시한다. */}
              <XIcon className="size-4 text-foreground" />
            </SheetClose>
          )}
        </View>
      </ModalOverlay>
    );
  },
);
SheetContent.displayName = "SheetContent";

export type SheetHeaderProps = ViewProps;

const SheetHeader = forwardRef<BridgeViewRef, SheetHeaderProps>(
  ({ className, ...props }, ref) => (
    <View ref={ref} className={cn("gap-1.5 p-4", className)} {...props} />
  ),
);
SheetHeader.displayName = "SheetHeader";

export type SheetFooterProps = ViewProps;

const SheetFooter = forwardRef<BridgeViewRef, SheetFooterProps>(
  ({ className, ...props }, ref) => (
    <View ref={ref} className={cn("mt-auto gap-2 p-4", className)} {...props} />
  ),
);
SheetFooter.displayName = "SheetFooter";

export type SheetTitleProps = TextProps;

const SheetTitle = forwardRef<BridgeTextRef, SheetTitleProps>(
  ({ className, nativeID, ...props }, ref) => {
    const sheet = useSheetContext("SheetTitle");
    return (
      <Text
        ref={ref}
        nativeID={nativeID ?? sheet.titleId}
        className={cn(
          "font-sans font-semibold text-foreground",
          className,
        )}
        {...props}
      />
    );
  },
);
SheetTitle.displayName = "SheetTitle";

export type SheetDescriptionProps = TextProps;

const SheetDescription = forwardRef<BridgeTextRef, SheetDescriptionProps>(
  ({ className, nativeID, ...props }, ref) => {
    const sheet = useSheetContext("SheetDescription");
    return (
      <Text
        ref={ref}
        nativeID={nativeID ?? sheet.descriptionId}
        className={cn("font-sans text-sm text-muted-foreground", className)}
        {...props}
      />
    );
  },
);
SheetDescription.displayName = "SheetDescription";

export {
  Sheet,
  SheetTrigger,
  SheetClose,
  SheetContent,
  SheetHeader,
  SheetFooter,
  SheetTitle,
  SheetDescription,
  sheetContentVariants,
};
