// HoverCard — shadcn/ui（new-york-v4） hover-card.tsx 유니버설 포팅 （사이클 40, T-1b）.
// 원본: shadcn-ref/ui/hover-card.tsx — radix HoverCard 엔진을 제거하고 열림 상태는
// React state + context로, 오버레이는 lib/overlay의 AnchoredOverlay로 구성한다.
//
// 포팅 판단（원본 대비 차이）:
// - 진입 조건 설계: 원본은 포인터 진입（hover） 후 openDelay（ms） 뒤 열리고 포인터
//   이탈 시 closeDelay 뒤 닫힌다. 브리지 PressableProps에 hover/포인터 이벤트
//   계약이 없어（onLongPress는 웹 폐기onFocus 부재） hover 상태 열림을 포인터
//   이벤트로 관리할 수 없다 — 진입을 press 토글로 근사한다.
//    onPress（웹 클릭 + 네이티브 탭）: 열림/닫힘 토글 — 양측 공통 진입로.
//    onLongPress（네이티브 롱프레스 전용, 웹은 브리지가 폐기）: 열림.
//   플랫폼 분기 없이 두 핸들러를 항상 연결해 어느 쪽에서도 동작한다.
// - openDelay（원본 기본 200）closeDelay（원본 기본 300） 프로퍼티는 API 호환을
//   위해 수용하되 즉시 전환 근사에서는 대기 없이 바로 열림/닫힘（미사용 토큰）.
// - 콘텐츠 이탈 닫힘바깥 포인터 닫힘 미지원（포인터 이벤트 계약 부재
//   AnchoredOverlay 비모달 원칙） — 닫기는 ESC（브리지 useDismiss, 웹）와
//   트리거 재누름으로 한다. openDelay/closeDelay와 함께 원본 대비 상실 목록.
// - 원본 Content의 sidesideOffset 프로퍼티명을 유지하되 내부적으로
//   AnchoredOverlay의 placementoffset로 매핑（기본 side "bottom"sideOffset 4
//   align "center"는 원본 기본값 그대로）.
// - 애니메이션（animate-in/outfadezoomdata-［side］ 슬라이드）과 origin 변형은
//   즉시 전환으로 근사 — 토큰 전부 제거.
// - asChild 미지원 — 트리거는 항상 브리지 Pressable（웹 <button>）로 렌더된다.
// - 카드 className에 pointer-events-auto 기본 포함（웹 box-none 상속 회피）.
// - 접근성: 트리거 aria-expandedaria-controls（useId 기반 nativeID）. 원본 radix
//   HoverCard Content는 별도 role을 노출하지 않아 이식도 카드에 role을 부여하지
//   않는다. RN은 aria-expanded만 accessibilityState.expanded로 치환되고
//   aria-controls는 무시된다（브리지 계약 문서화된 한계）.
// - dark: 변형 토큰은 프로젝트 관행（미사용）대로 제거.
import {
  createContext,
  forwardRef,
  useCallback,
  useContext,
  useId,
  useMemo,
  useRef,
  useState,
  type ForwardedRef,
  type MutableRefObject,
} from "react";
import {
  Pressable,
  View,
  type BridgePressableRef,
  type BridgeViewRef,
  type PressableProps,
  type ViewProps,
} from "@unikit-bridge/ui/primitives";
import { cva } from "class-variance-authority";

import { AnchoredOverlay, type OverlayAlign, type OverlayPlacement } from "../lib/overlay";
import { cn } from "../lib/utils";

type HoverCardContextValue = {
  open: boolean;
  setOpen: (open: boolean) => void;
  /** 트리거 aria-controls ↔ 카드 nativeID 연결용 토대 ID */
  baseId: string;
  /** 트리거 요소 ref — 앵커 측정닫힘 후 포커스 복귀에 공용 */
  triggerRef: MutableRefObject<BridgePressableRef | null>;
};

const HoverCardContext = createContext<HoverCardContextValue | null>(null);

function useHoverCardContext(component: string): HoverCardContextValue {
  const ctx = useContext(HoverCardContext);
  if (!ctx) {
    throw new Error(`<${component}>는 <HoverCard> 안에서 사용해야 합니다.`);
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

export type HoverCardProps = ViewProps & {
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  /** 원본 radix openDelay（기본 200） 호환 — 즉시 전환 근사에서 미사용 */
  openDelay?: number;
  /** 원본 radix closeDelay（기본 300） 호환 — 즉시 전환 근사에서 미사용 */
  closeDelay?: number;
};

const HoverCard = forwardRef<BridgeViewRef, HoverCardProps>(
  (
    // openDelaycloseDelay는 API 호환용으로만 수용（즉시 전환 근사에서 미사용） —
    // rest로 흘러 View에 알 수 없는 속성이 되지 않게 폐기한다（브리지 관행）.
    { open, defaultOpen, onOpenChange, openDelay: _openDelay, closeDelay: _closeDelay, children, ...props },
    ref,
  ) => {
    // 비제어 상태 — 제어（open 지정）면 무시된다.
    const [internalOpen, setInternalOpen] = useState(defaultOpen ?? false);
    const isOpen = open ?? internalOpen;
    const stateRef = useRef({ open, isOpen, onOpenChange });
    stateRef.current = { open, isOpen, onOpenChange };
    const setOpen = useCallback((next: boolean) => {
      const state = stateRef.current;
      if (state.open === undefined) setInternalOpen(next);
      if (next !== state.isOpen) state.onOpenChange?.(next);
    }, []);
    const baseId = useId();
    const triggerRef = useRef<BridgePressableRef | null>(null);
    const contextValue = useMemo<HoverCardContextValue>(
      () => ({ open: isOpen, setOpen, baseId, triggerRef }),
      [isOpen, setOpen, baseId],
    );
    return (
      <HoverCardContext.Provider value={contextValue}>
        <View ref={ref} {...props}>{children}</View>
      </HoverCardContext.Provider>
    );
  },
);
HoverCard.displayName = "HoverCard";

export type HoverCardTriggerProps = PressableProps;

const HoverCardTrigger = forwardRef<BridgePressableRef, HoverCardTriggerProps>(
  ({ onPress, onLongPress, ...props }, ref) => {
    const hoverCard = useHoverCardContext("HoverCardTrigger");
    return (
      <Pressable
        ref={composeRefs(hoverCard.triggerRef, ref)}
        accessibilityRole="button"
        aria-expanded={hoverCard.open}
        aria-controls={`${hoverCard.baseId}-hover-card-content`}
        onPress={() => {
          hoverCard.setOpen(!hoverCard.open);
          onPress?.();
        }}
        onLongPress={() => {
          hoverCard.setOpen(true);
          onLongPress?.();
        }}
        {...props}
      />
    );
  },
);
HoverCardTrigger.displayName = "HoverCardTrigger";

const hoverCardContentVariants = cva(
  // pointer-events-auto: 웹에서 오버레이 래퍼 box-none 상속 회피（기본 포함）.
  "pointer-events-auto w-64 rounded-md border border-border bg-popover p-4 text-popover-foreground unikit-popover-in web:outline-none web:shadow-md",
);

export type HoverCardContentProps = ViewProps & {
  /** 전개 방향（기본 bottom） — 원본 side 프로퍼티와 동일 값 목록 */
  side?: OverlayPlacement;
  /** 앵커 변 기준 정렬（기본 center — 원본 기본값） */
  align?: OverlayAlign;
  /** 앵커와의 간격 px（기본 4 — 원본 기본값） */
  sideOffset?: number;
};

const HoverCardContent = forwardRef<BridgeViewRef, HoverCardContentProps>(
  (
    { className, side = "bottom", align = "center", sideOffset = 4, children, nativeID, ...props },
    ref,
  ) => {
    const hoverCard = useHoverCardContext("HoverCardContent");
    return (
      <AnchoredOverlay
        visible={hoverCard.open}
        onClose={() => hoverCard.setOpen(false)}
        anchorRef={hoverCard.triggerRef}
        placement={side}
        align={align}
        offset={sideOffset}
        triggerRef={hoverCard.triggerRef}
        className="z-50"
      >
        <View
          ref={ref}
          nativeID={nativeID ?? `${hoverCard.baseId}-hover-card-content`}
          className={cn(hoverCardContentVariants(), className)}
          {...props}
        >
          {children}
        </View>
      </AnchoredOverlay>
    );
  },
);
HoverCardContent.displayName = "HoverCardContent";

export {
  HoverCard,
  HoverCardTrigger,
  HoverCardContent,
  hoverCardContentVariants,
};
