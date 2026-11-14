// HoverCard — shadcn/ui（new-york-v4） hover-card.tsx 유니버설 포팅 （사이클 40, T-1b）.
// 원본: shadcn-ref/ui/hover-card.tsx — radix HoverCard 엔진을 제거하고 열림 상태는
// React state + context로, 오버레이는 lib/overlay의 AnchoredOverlay로 구성한다.
//
// 포팅 판단（원본 대비 차이）:
// - 진입 조건（사이클 90 원본 정합 — 브리지 onHoverIn/onHoverOut 계약 추가로
//   재현）: 트리거 포인터 진입 시 openDelay（기본 200） 후 열리고, 트리거·카드
//   이탈 시 closeDelay（기본 300） 후 닫힌다. 카드 진입은 닫힘 예약을 취소해
//   트리거→카드 포인터 이동을 유지한다 — 원본 radix HoverCard 동작.
//   터치 기기에서 hover 계열은 발화하지 않아 기존 press 근사가 폴백으로 남는다:
//    onPress（네이티브 탭·hover 없는 환경）: 열림/닫힘 토글.
//    onLongPress（네이티브 롱프레스 전용, 웹은 브리지가 폐기）: 열림.
//   hover 진입("pointer" 모드) 중에는 onPress 토글이 동작하지 않는다（원본도
//   클릭으로 카드를 끄지 않는다）.
// - openDelay/closeDelay는 실제 지연으로 동작한다（사이클 90 전환 — 이전까지는
//   API 호환용 미사용 토큰이었다）.
// - 콘텐츠 이탈 닫힘은 위 지연 로직이 담당하고（사이클 90 해소）, 바깥 포인터
//   닫힘은 웹에서 문서 수준 리스너로 포착한다（사이클 90 F-4 정정 — 투명 커버층
//   방식은 카드가 열리는 순간 브라우저 hover 재계산으로 트리거 mouseleave를
//   일으켜 카드를 스스로 닫히게 했다. AnchoredOverlay 전체 기본 동작 참조）.
//   네이티브는 RN Modal 배경 Pressable이 그대로 담당한다. ESC（브리지
//   useDismiss, 웹）는 유지된다.
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
  useEffect,
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
  /** 포인터 진입 — openDelay 후 열림 예약（이미 열림이면 닫힘 예약 취소） */
  scheduleOpen: () => void;
  /** 포인터 이탈 — closeDelay 후 닫힘 예약 */
  scheduleClose: () => void;
  /** 카드 진입 — 닫힘 예약 취소（트리거→카드 이동 유지） */
  cancelClose: () => void;
  /** 진입 경로 — "pointer"(hover) · null(press 개방 전·닫힘). press는 값을
   *  남기지 않는다: press로 열린 뒤 hover가 오면 pointer로 상승해야 클릭
   *  닫힘이 다시 막히기 때문이다(G4 F-14). */
  entry: "pointer" | null;
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
  /** 포인터 진입 후 열림까지 대기 ms（기본 200 — radix 기본값） */
  openDelay?: number;
  /** 포인터 이탈 후 닫힘까지 대기 ms（기본 300 — radix 기본값） */
  closeDelay?: number;
};

const HoverCard = forwardRef<BridgeViewRef, HoverCardProps>(
  (
    { open, defaultOpen, onOpenChange, openDelay = 200, closeDelay = 300, children, ...props },
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

    // 포인터 진입/이탈 지연 타이머（사이클 90） — 재스케줄·언마운트 해제가 의무.
    // entry는 state다(ref 금지): 이미 열린(press) 채 hover 진입이 와도 context
    // 재렌더로 트리거 onPress 게이트가 갱신돼야 한다(G4 F-14).
    const [entry, setEntry] = useState<"pointer" | null>(null);
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
    const scheduleOpen = useCallback(() => {
      clearCloseTimer();
      // 이미 열려 있어도 진입 경로는 pointer로 갱신한다(press 개방의 상승 —
      // 이것이 없으면 press로 연 카드 위에서 클릭이 카드를 껐다, F-14).
      setEntry("pointer");
      if (stateRef.current.isOpen) return;
      clearOpenTimer();
      openTimerRef.current = setTimeout(() => {
        openTimerRef.current = null;
        setOpen(true);
      }, openDelay);
    }, [clearCloseTimer, clearOpenTimer, openDelay, setOpen]);
    const scheduleClose = useCallback(() => {
      clearOpenTimer();
      if (!stateRef.current.isOpen) return;
      clearCloseTimer();
      closeTimerRef.current = setTimeout(() => {
        closeTimerRef.current = null;
        setEntry(null);
        setOpen(false);
      }, closeDelay);
    }, [clearCloseTimer, clearOpenTimer, closeDelay, setOpen]);
    const cancelClose = useCallback(clearCloseTimer, [clearCloseTimer]);

    const baseId = useId();
    const triggerRef = useRef<BridgePressableRef | null>(null);
    const contextValue = useMemo<HoverCardContextValue>(
      () => ({
        open: isOpen,
        setOpen,
        scheduleOpen,
        scheduleClose,
        cancelClose,
        entry,
        baseId,
        triggerRef,
      }),
      [isOpen, setOpen, scheduleOpen, scheduleClose, cancelClose, entry, baseId],
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
  (
    { onPress, onLongPress, onHoverIn, onHoverOut, ...props },
    ref,
  ) => {
    const hoverCard = useHoverCardContext("HoverCardTrigger");
    return (
      <Pressable
        ref={composeRefs(hoverCard.triggerRef, ref)}
        accessibilityRole="button"
        aria-expanded={hoverCard.open}
        aria-controls={`${hoverCard.baseId}-hover-card-content`}
        // 포인터 진입/이탈（사이클 90） — 지연 열림·닫힘 예약. 터치에서는 발화하지
        // 않아 아래 press 폴백이 담당한다.
        onHoverIn={() => {
          hoverCard.scheduleOpen();
          onHoverIn?.();
        }}
        onHoverOut={() => {
          hoverCard.scheduleClose();
          onHoverOut?.();
        }}
        onPress={() => {
          // hover 진입 중에는 클릭으로 끄지 않는다（원본 정합 — 토글은 터치 폴백）.
          if (hoverCard.entry !== "pointer") {
            hoverCard.setOpen(!hoverCard.open);
          }
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
        // hover 개방 계열은 열림에 포커스를 뺏지 않는다(원본 정합 — F-5).
        focusOnOpen={false}
        className="z-50"
      >
        <View
          ref={ref}
          nativeID={nativeID ?? `${hoverCard.baseId}-hover-card-content`}
          // 카드 진입은 닫힘 예약을 취소, 이탈은 재예약（사이클 90 — 트리거→카드
          // 포인터 이동 유지, 원본 정합）.
          onHoverIn={() => hoverCard.cancelClose()}
          onHoverOut={() => hoverCard.scheduleClose()}
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
