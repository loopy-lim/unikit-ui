// Popover — shadcn/ui（new-york-v4） popover.tsx 유니버설 포팅 （사이클 40, T-1b）.
// 원본: shadcn-ref/ui/popover.tsx — radix Popover 엔진을 제거하고 열림 상태는
// React state + context로, 오버레이는 lib/overlay의 AnchoredOverlay로 구성한다.
//
// 포팅 판단（원본 대비 차이）:
// - radix RootTriggerContentAnchorPortal을 각각 Popover（상태 context）
//   PopoverTrigger（Pressable 토글）PopoverContent（AnchoredOverlay + 카드 View）
//   PopoverAnchor（앵커 오버라이드 View）로 재구성. Portal은 AnchoredOverlay가
//   내부적으로 소비하므로 별도 파트가 없다（7종 export는 원본 그대로 유지）.
// - 충돌 감지（collision paddingavoidCollisionssticky）는 미지원 —
//   AnchoredOverlay의 뷰포트 클램프（여백 8px）로 근사된다. 원본과 달리 열리는
//   방향（side）을 역방향으로 자동 전환하지는 않는다.
// - 원본 Content의 sidesideOffset 프로퍼티명을 유지하되 내부적으로 AnchoredOverlay
//   의 placementoffset로 매핑한다（기본 side "bottom"sideOffset 4align "center"
//   은 원본 기본값 그대로）.
// - 애니메이션（animate-in/outfadezoomdata-［side］ 슬라이드）과 origin 변형
//   （radix CSS 변수）은 즉시 전환으로 근사 — 토큰 전부 제거.
// - modal 폴백（radix Root modal）은 미지원（항상 비모달）. 바깥 포인터
//   눌림 닫기는 AnchoredOverlay의 투명 백드롭이 잡아준다（onBackdropPress
//   연결 — G3 리뷰 주석 정합 갱신）. ESC（브리지 useDismiss, 웹）와 트리거
//   재토글도 닫는다.
// - asChild 미지원 — 트리거는 항상 브리지 Pressable（웹 <button>）로 렌더된다.
// - 카드 className에 pointer-events-auto 기본 포함（웹 box-none 상속 회피）.
// - 접근성: 트리거 aria-expandedaria-controls（useId 기반 nativeID）, 카드
//   role="dialog"（원본 radix Content와 동일）. RN은 dialog rolearia-describedby
//   를 무시한다（브리지 계약 문서화된 한계 — 웹 스크린리더만 이득）.
// - text-popover-foreground 카드 토큰은 웹 상속용으로 유지하되, 네이티브는 색
//   상속이 없어 Title/Description 내부 Text에 이중 지정한다（코드베이스 관행）.
// - dark: 변형 토큰은 프로젝트 관행（미사용）대로 제거.
import {
  createContext,
  forwardRef,
  useContext,
  useEffect,
  useId,
  useRef,
  useState,
  type ForwardedRef,
  type MutableRefObject,
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

import { AnchoredOverlay, type OverlayAlign, type OverlayPlacement } from "../lib/overlay";
import { cn } from "../lib/utils";

type PopoverContextValue = {
  open: boolean;
  setOpen: (open: boolean) => void;
  /** 트리거 aria-controls ↔ 카드 nativeID 연결용 토대 ID */
  baseId: string;
  /** 트리거 요소 ref — 앵커 측정닫힘 후 포커스 복귀에 공용 */
  triggerRef: MutableRefObject<BridgePressableRef | null>;
  /** PopoverAnchor 오버라이드 ref — 있으면 이쪽이 앵커가 된다 */
  anchorRef: MutableRefObject<BridgeViewRef | null>;
  hasAnchor: boolean;
  setHasAnchor: (has: boolean) => void;
};

const PopoverContext = createContext<PopoverContextValue | null>(null);

function usePopoverContext(component: string): PopoverContextValue {
  const ctx = useContext(PopoverContext);
  if (!ctx) {
    throw new Error(`<${component}>는 <Popover> 안에서 사용해야 합니다.`);
  }
  return ctx;
}

/** 외부 ref와 루트가 소유한 ref를 한 노드에 동시 연결한다. */
function composeRefs<T>(
  local: MutableRefObject<T | null>,
  forwarded: ForwardedRef<T>,
) {
  return (node: T | null) => {
    local.current = node;
    if (typeof forwarded === "function") forwarded(node);
    else if (forwarded) forwarded.current = node;
  };
}

export type PopoverProps = ViewProps & {
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
};

const Popover = forwardRef<BridgeViewRef, PopoverProps>(
  ({ open, defaultOpen, onOpenChange, children, ...props }, ref) => {
    // 비제어 상태 — 제어（open 지정）면 무시된다.
    const [internalOpen, setInternalOpen] = useState(defaultOpen ?? false);
    const isOpen = open ?? internalOpen;
    const setOpen = (next: boolean) => {
      if (open === undefined) setInternalOpen(next);
      if (next !== isOpen) onOpenChange?.(next);
    };
    const baseId = useId();
    const triggerRef = useRef<BridgePressableRef | null>(null);
    const anchorRef = useRef<BridgeViewRef | null>(null);
    const [hasAnchor, setHasAnchor] = useState(false);
    return (
      <PopoverContext.Provider
        value={{ open: isOpen, setOpen, baseId, triggerRef, anchorRef, hasAnchor, setHasAnchor }}
      >
        <View ref={ref} {...props}>{children}</View>
      </PopoverContext.Provider>
    );
  },
);
Popover.displayName = "Popover";

export type PopoverTriggerProps = PressableProps;

const PopoverTrigger = forwardRef<BridgePressableRef, PopoverTriggerProps>(
  ({ onPress, ...props }, ref) => {
    const popover = usePopoverContext("PopoverTrigger");
    return (
      <Pressable
        ref={composeRefs(popover.triggerRef, ref)}
        accessibilityRole="button"
        aria-expanded={popover.open}
        aria-controls={`${popover.baseId}-popover-content`}
        onPress={() => {
          popover.setOpen(!popover.open);
          onPress?.();
        }}
        {...props}
      />
    );
  },
);
PopoverTrigger.displayName = "PopoverTrigger";

const popoverContentVariants = cva(
  // pointer-events-auto: 웹에서 오버레이 래퍼 box-none 상속 회피（기본 포함）.
  "pointer-events-auto w-72 rounded-md border border-border bg-popover p-4 text-popover-foreground unikit-popover-in web:outline-none web:shadow-md",
);

export type PopoverContentProps = ViewProps & {
  /** 전개 방향（기본 bottom） — 원본 side 프로퍼티와 동일 값 목록 */
  side?: OverlayPlacement;
  /** 앵커 변 기준 정렬（기본 center — 원본 기본값） */
  align?: OverlayAlign;
  /** 앵커와의 간격 px（기본 4 — 원본 기본값） */
  sideOffset?: number;
};

const PopoverContent = forwardRef<BridgeViewRef, PopoverContentProps>(
  ({ className, side = "bottom", align = "center", sideOffset = 4, children, nativeID, ...props }, ref) => {
    const popover = usePopoverContext("PopoverContent");
    return (
      <AnchoredOverlay
        visible={popover.open}
        onClose={() => popover.setOpen(false)}
        anchorRef={popover.hasAnchor ? popover.anchorRef : popover.triggerRef}
        placement={side}
        align={align}
        offset={sideOffset}
        triggerRef={popover.triggerRef}
        className="z-50"
      >
        <View
          ref={ref}
          accessibilityRole="dialog"
          nativeID={nativeID ?? `${popover.baseId}-popover-content`}
          className={cn(popoverContentVariants(), className)}
          {...props}
        >
          {children}
        </View>
      </AnchoredOverlay>
    );
  },
);
PopoverContent.displayName = "PopoverContent";

export type PopoverAnchorProps = ViewProps;

const PopoverAnchor = forwardRef<BridgeViewRef, PopoverAnchorProps>(
  ({ children, ...props }, ref) => {
    const { anchorRef, setHasAnchor } = usePopoverContext("PopoverAnchor");
    // 마운트 시 앵커 오버라이드 등록 — Content가 이 ref를 앵커로 삼는다.
    // setHasAnchor（useState setter）는 안정 식별자라 1회 실행을 보장한다.
    useEffect(() => {
      setHasAnchor(true);
      return () => setHasAnchor(false);
    }, [setHasAnchor]);
    return (
      <View ref={composeRefs(anchorRef, ref)} {...props}>
        {children}
      </View>
    );
  },
);
PopoverAnchor.displayName = "PopoverAnchor";

const popoverHeaderVariants = cva("flex-col gap-1 text-sm");

export type PopoverHeaderProps = ViewProps;

const PopoverHeader = forwardRef<BridgeViewRef, PopoverHeaderProps>(
  ({ className, ...props }, ref) => (
    <View ref={ref} className={cn(popoverHeaderVariants(), className)} {...props} />
  ),
);
PopoverHeader.displayName = "PopoverHeader";

const popoverTitleVariants = cva("font-sans text-sm font-medium text-popover-foreground");

export type PopoverTitleProps = ViewProps;

const PopoverTitle = forwardRef<BridgeViewRef, PopoverTitleProps>(
  ({ className, children, ...props }, ref) => (
    // 원본은 <div>（h2 역할 없음） — 구조를 유지하되 네이티브 색 상속 불가로
    // 이중 지정한다（컨테이너 글자색은 웹 상속 전용）.
    <View ref={ref} className={cn(popoverTitleVariants(), className)} {...props}>
      <Text className="font-sans text-sm font-medium text-popover-foreground">
        {children}
      </Text>
    </View>
  ),
);
PopoverTitle.displayName = "PopoverTitle";

const popoverDescriptionVariants = cva("text-muted-foreground");

export type PopoverDescriptionProps = ViewProps;

const PopoverDescription = forwardRef<BridgeViewRef, PopoverDescriptionProps>(
  ({ className, children, ...props }, ref) => (
    <View ref={ref} className={cn(popoverDescriptionVariants(), className)} {...props}>
      <Text className="font-sans text-sm text-muted-foreground">{children}</Text>
    </View>
  ),
);
PopoverDescription.displayName = "PopoverDescription";

export {
  Popover,
  PopoverTrigger,
  PopoverContent,
  PopoverAnchor,
  PopoverHeader,
  PopoverTitle,
  PopoverDescription,
  popoverContentVariants,
  popoverHeaderVariants,
  popoverTitleVariants,
  popoverDescriptionVariants,
};
