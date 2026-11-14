// Tooltip — shadcn/ui（new-york-v4） tooltip.tsx 유니버설 포팅 （사이클 40, T-1b）.
// 원본: shadcn-ref/ui/tooltip.tsx — radix Tooltip 엔진을 제거하고 열림 상태는
// React state + context로, 오버레이는 lib/overlay의 AnchoredOverlay로 구성한다.
//
// 포팅 판단（원본 대비 차이）:
// - 진입 조건（사이클 90 원본 정합 — 브리지 onHoverIn/onHoverOut/onFocus/onBlur
//   계약 추가로 재현）: 트리거 hover 진입 시 지연 로직대로 열리고 이탈 시
//   닫힌다. focus 진입（웹 키보드 탭·모바일 탭 포커스）에도 열리고 blur에서
//   닫힌다 — 원본 radix의 hover/focus 진입 조건과 같다.
//   hover/focus 진입("pointer" 모드) 중에는 onPress 토글이 동작하지 않는다
//   （원본도 클릭으로 툴팁을 끄지 않는다）.
//   터치 기기에서 hover 계열은 발화하지 않아 기존 press 근사가 폴백으로 남는다:
//    onPress（네이티브 탭·hover 없는 환경）: 닫힘 상태면 지연 로직대로 열고,
//     열림 상태면 즉시 닫는다（토글）.
//    onLongPress（네이티브 롱프레스 전용, 웹은 브리지가 폐기）: 지연 로직대로 연다.
//   displayDuration 자동 닫힘은 press 진입분만 — pointer 진입은 포인터·포커스가
//   머무는 동안 유지된다（원본 정합）.
// - 지연 재현: delayDuration（기본 0 — 원본 Provider 기본값） 후 열림,
//   skipDelayDuration（기본 300 — radix 기본값） 창 안의 재진입은 지연 없이 즉시
//   열림, displayDuration（신규 프로퍼티, 기본 3000） 후 자동 닫힘. 전부
//   setTimeout으로 재현하고 재스케줄언마운트 시 clearTimeout 클린업한다.
//   displayDuration은 press 진입 근사에서 이탈 이벤트가 없어 자동 닫힘용으로
//   추가한 프로퍼티다（원본에는 없음）.
// - 원본은 TooltipProvider가 필수（radix 제약） — 포팅은 Provider 부재 시 기본값
//   폴백으로 동작하게 해 선택형으로 완화했다.
// - 원본 Content의 sidesideOffset 프로퍼티명을 유지하되 내부적으로
//   AnchoredOverlay의 placementoffset로 매핑（기본 side "top"sideOffset 0은
//   원본 기본값, align "center"는 radix popper 기본값）.
// - 화살표: 원본은 rotate-45 사각형 + 임의값 translate — 임의값 클래스 금지
//   때문에 View 도형（size-2 rotate-45）으로 근사하되, 배치가 성립하는
//   side "top"（기본）일 때만 카드 하단에 렌더한다（lucide 아이콘 아님）.
// - 애니메이션（animate-in/outfadezoomdata-［side］ 슬라이드）과 origin 변형은
//   즉시 전환으로 근사 — 토큰 전부 제거.
// - 카드 className에 pointer-events-auto 기본 포함（웹 box-none 상속 회피）.
// - 바깥 포인터 닫힘（웹）: 투명 커버층 대신 문서 수준 리스너로 포착한다（사이클
//   90 F-4 정정 — 커버층이 열리는 순간 브라우저 hover 재계산으로 트리거
//   mouseleave를 일으켜 hover 진입 툴팁이 스스로 닫혔다. AnchoredOverlay 전체
//   기본 동작 참조）. 네이티브는 RN Modal 배경 Pressable이 담당.
// - 접근성: 카드 role="tooltip"（원본과 동일） + nativeID, 트리거는 원본처럼
//   aria-describedby로 카드를 설명 연결한다（열림 중에만 — 닫힘 카드는 언마운트
//   되므로 끊어진 참조를 만들지 않는다）. RN은 role="tooltip"aria-describedby를
//   무시한다（브리지 계약 문서화된 한계 — 웹 스크린리더만 이득）.
// - text-balance는 웹 전용 속성이라 web: 접두로만 지정, 카드 글자색（text-background）
//   은 네이티브 색 상속 불가로 내부 Text에 이중 지정한다.
// - asChild 미지원 — 트리거는 항상 브리지 Pressable（웹 <button>）로 렌더된다.
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

import {
  AnchoredOverlay,
  useOverlayPlacement,
  type OverlayAlign,
  type OverlayPlacement,
} from "@/lib/overlay";
import { cn } from "@/lib/utils";

// ---------------------------------------------------------------------------
// Provider — 지연 정책 공유（원본과 달리 요소를 렌더하지 않는다）
// ---------------------------------------------------------------------------

type TooltipPolicyContextValue = {
  /** 진입 후 열림까지 대기 ms（기본 0 — 원본 shadcn Provider 기본값） */
  delayDuration: number;
  /** 한 번 열린 뒤 다른 트리거 진입 시 즉시 열림으로 간주하는 창 ms */
  skipDelayDuration: number;
  /** 열림 유지 ms — press 진입 근사의 자동 닫힘（원본에 없는 포팅 추가） */
  displayDuration: number;
  /** 툴팁이 열렸음을 정책에 기록（skip 창 갱신） */
  markOpened: () => void;
  /** 현재 skip 창 안인지 */
  isSkipped: () => boolean;
};

const TooltipPolicyContext = createContext<TooltipPolicyContextValue | null>(null);

// Provider 없이 <Tooltip>만 쓸 때의 폴백 정책（원본 radix는 Provider 필수）.
const TOOLTIP_POLICY_DEFAULT: TooltipPolicyContextValue = {
  delayDuration: 0,
  skipDelayDuration: 300,
  displayDuration: 3000,
  markOpened: () => {},
  isSkipped: () => false,
};

export type TooltipProviderProps = {
  children?: ReactNode;
  delayDuration?: number;
  skipDelayDuration?: number;
  displayDuration?: number;
};

// 원본처럼 렌더 요소가 없는（context만 제공하는） 파트라 forwardRef 대상이 없다.
function TooltipProvider({
  children,
  delayDuration = 0,
  skipDelayDuration = 300,
  displayDuration = 3000,
}: TooltipProviderProps) {
  const skipUntilRef = useRef(0);
  const value = useMemo<TooltipPolicyContextValue>(
    () => ({
      delayDuration,
      skipDelayDuration,
      displayDuration,
      markOpened: () => {
        skipUntilRef.current = Date.now() + skipDelayDuration;
      },
      isSkipped: () => Date.now() < skipUntilRef.current,
    }),
    [delayDuration, skipDelayDuration, displayDuration],
  );
  return (
    <TooltipPolicyContext.Provider value={value}>
      {children}
    </TooltipPolicyContext.Provider>
  );
}

// ---------------------------------------------------------------------------
// Tooltip 루트 — 열림 상태 + 지연 타이머
// ---------------------------------------------------------------------------

type TooltipContextValue = {
  open: boolean;
  /** 지연 로직대로 연다（skip 창이면 즉시, 아니면 delayDuration 후）.
   *  source "pointer"는 hover/focus 진입 — 자동 닫힘·클릭 토글 제외 대상. */
  show: (source?: "pointer") => void;
  /** 지연 타이머를 취소하고 즉시 닫는다 */
  hide: () => void;
  /** 진입 경로 — "pointer"(hover/focus) · "press"(터치 폴백) · null(닫힘) */
  entry: "pointer" | "press" | null;
  /** 카드 nativeID ↔ 트리거 aria-describedby 연결용 ID */
  contentId: string;
  /** 트리거 요소 ref — 앵커 측정닫힘 후 포커스 복귀에 공용 */
  triggerRef: MutableRefObject<BridgePressableRef | null>;
};

const TooltipContext = createContext<TooltipContextValue | null>(null);

function useTooltipContext(component: string): TooltipContextValue {
  const ctx = useContext(TooltipContext);
  if (!ctx) {
    throw new Error(`<${component}>는 <Tooltip> 안에서 사용해야 합니다.`);
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

export type TooltipProps = ViewProps & {
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  /** 이 툴팁 진입의 delayDuration 오버라이드（기본 Provider 값） */
  delayDuration?: number;
};

const Tooltip = forwardRef<BridgeViewRef, TooltipProps>(
  ({ open, defaultOpen, onOpenChange, delayDuration, children, ...props }, ref) => {
    // 비제어 상태 — 제어（open 지정）면 무시된다.
    const [internalOpen, setInternalOpen] = useState(defaultOpen ?? false);
    const isOpen = open ?? internalOpen;
    const policy = useContext(TooltipPolicyContext) ?? TOOLTIP_POLICY_DEFAULT;
    const resolvedDelay = delayDuration ?? policy.delayDuration;
    const baseId = useId();
    const triggerRef = useRef<BridgePressableRef | null>(null);

    // 지연 진입 타이머 — 재스케줄언마운트 시 해제가 의무다.
    const delayTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const clearDelayTimer = useCallback(() => {
      if (delayTimerRef.current !== null) {
        clearTimeout(delayTimerRef.current);
        delayTimerRef.current = null;
      }
    }, []);
    useEffect(() => clearDelayTimer, [clearDelayTimer]);

    // 타이머 콜백에서도 최신 열림 값/제어 여부를 읽도록 렌더마다 갱신하는 미러.
    const stateRef = useRef({ isOpen, open, onOpenChange });
    stateRef.current = { isOpen, open, onOpenChange };
    const applyOpen = useCallback(
      (next: boolean) => {
        const state = stateRef.current;
        if (state.open === undefined) setInternalOpen(next);
        if (next !== state.isOpen) state.onOpenChange?.(next);
        stateRef.current = { ...state, isOpen: next };
        if (next) policy.markOpened();
      },
      [policy],
    );
    const applyOpenRef = useRef(applyOpen);
    applyOpenRef.current = applyOpen;

    // displayDuration 자동 닫힘 — press 진입분만 열림마다 1회 스케줄, 클린업 필수.
    // pointer(hover/focus) 진입은 이탈·블러 사건이 닫힘을 담당한다（원본 정합）.
    // entry는 state다 — 이미 열린(press) 채 hover 진입이 와도 context.entry가
    // 갱신돼야 트리거의 onPress 게이트(«pointer 진입 중 클릭으로 끄지 않는다»)가
    // 올바르게 막힌다. ref면 재렌더가 없어 stale 값이 남았다(G4 F-14).
    const [entry, setEntry] = useState<"pointer" | "press" | null>(null);
    const displayDuration = policy.displayDuration;
    useEffect(() => {
      if (!isOpen || displayDuration <= 0) return;
      if (entry === "pointer") return;
      const id = setTimeout(() => applyOpenRef.current(false), displayDuration);
      return () => clearTimeout(id);
    }, [isOpen, displayDuration, entry]);

    const show = useCallback(
      (source?: "pointer") => {
        // 이미 열려 있어도 진입 경로는 갱신한다(press→hover 상승, F-14).
        setEntry(source ?? "press");
        clearDelayTimer();
        if (stateRef.current.isOpen) return;
        // skip 창 안의 재진입은 지연 없이 즉시 열림（radix skipDelayDuration 재현）.
        if (policy.isSkipped()) {
          applyOpen(true);
          return;
        }
        delayTimerRef.current = setTimeout(() => {
          delayTimerRef.current = null;
          applyOpen(true);
        }, resolvedDelay);
      },
      [clearDelayTimer, policy, applyOpen, resolvedDelay],
    );
    const hide = useCallback(() => {
      clearDelayTimer();
      setEntry(null);
      applyOpen(false);
    }, [clearDelayTimer, applyOpen]);

    const contextValue = useMemo<TooltipContextValue>(
      () => ({
        open: isOpen,
        show,
        hide,
        entry,
        contentId: `${baseId}-tooltip-content`,
        triggerRef,
      }),
      [isOpen, show, hide, entry, baseId],
    );

    return (
      <TooltipContext.Provider value={contextValue}>
        <View ref={ref} {...props}>{children}</View>
      </TooltipContext.Provider>
    );
  },
);
Tooltip.displayName = "Tooltip";

// ---------------------------------------------------------------------------
// TriggerContent
// ---------------------------------------------------------------------------

export type TooltipTriggerProps = PressableProps;
// children에 문자열을 쓸 때는 Text로 감싸주세요 — 트리거는 내부 Text 래핑이
// 없어서 네이티브에서 문자열 children이 런타임 에러를 낸다(2026-11-10 실증).

const TooltipTrigger = forwardRef<BridgePressableRef, TooltipTriggerProps>(
  (
    { onPress, onLongPress, onHoverIn, onHoverOut, onFocus, onBlur, ...props },
    ref,
  ) => {
    const tooltip = useTooltipContext("TooltipTrigger");
    return (
      <Pressable
        ref={composeRefs(tooltip.triggerRef, ref)}
        // 원본 관행대로 트리거의 보조 설명을 카드와 연결 — 열림 중에만（닫힘 카드는
        // 언마운트되므로 끊어진 참조를 만들지 않는다）.
        aria-describedby={tooltip.open ? tooltip.contentId : undefined}
        // hover/focus 진입（사이클 90） — 원본 radix 진입 조건 재현. 터치 기기에서는
        // 발화하지 않아 아래 press 폴백이 담당한다.
        onHoverIn={() => {
          tooltip.show("pointer");
          onHoverIn?.();
        }}
        onHoverOut={() => {
          tooltip.hide();
          onHoverOut?.();
        }}
        onFocus={() => {
          tooltip.show("pointer");
          onFocus?.();
        }}
        onBlur={() => {
          tooltip.hide();
          onBlur?.();
        }}
        onPress={() => {
          // pointer 진입 중에는 클릭으로 끄지 않는다（원본 정합 — 토글은 hover
          // 계열이 없는 터치 환경 폴백）.
          if (tooltip.entry !== "pointer") {
            if (tooltip.open) tooltip.hide();
            else tooltip.show();
          }
          onPress?.();
        }}
        onLongPress={() => {
          tooltip.show();
          onLongPress?.();
        }}
        {...props}
      />
    );
  },
);
TooltipTrigger.displayName = "TooltipTrigger";

const tooltipContentVariants = cva(
  // pointer-events-auto: 웹에서 오버레이 래퍼 box-none 상속 회피（기본 포함）.
  // relative는 하단 화살표 절대 배치의 기준이 된다.
  "pointer-events-auto relative w-fit rounded-md bg-foreground px-3 py-1.5 text-background unikit-popover-in web:outline-none web:text-balance",
);

// 네이티브 색 상속 불가로 내부 Text에 이중 지정（코드베이스 관행）.
// text-balance는 컨테이너의 web: 토큰이 웹에서 상속된다.
const tooltipContentTextVariants = cva("font-sans text-xs text-background");

function TooltipArrow({ fallbackSide }: { fallbackSide: OverlayPlacement }) {
  const resolvedSide = useOverlayPlacement() ?? fallbackSide;
  if (resolvedSide !== "top" && resolvedSide !== "bottom") return null;
  return (
    <View
      aria-hidden
      className={cn(
        "absolute inset-x-0 flex-row justify-center",
        resolvedSide === "top" ? "-bottom-1" : "-top-1",
      )}
    >
      <View className="size-2 rotate-45 bg-foreground" />
    </View>
  );
}

export type TooltipContentProps = ViewProps & {
  /** 전개 방향（기본 top — radix 기본값） */
  side?: OverlayPlacement;
  /** 앵커 변 기준 정렬（기본 center — radix popper 기본값） */
  align?: OverlayAlign;
  /** 앵커와의 간격 px（기본 0 — 원본 기본값） */
  sideOffset?: number;
};

const TooltipContent = forwardRef<BridgeViewRef, TooltipContentProps>(
  (
    { className, side = "top", align = "center", sideOffset = 0, children, nativeID, ...props },
    ref,
  ) => {
    const tooltip = useTooltipContext("TooltipContent");
    return (
      <AnchoredOverlay
        visible={tooltip.open}
        onClose={tooltip.hide}
        anchorRef={tooltip.triggerRef}
        placement={side}
        align={align}
        offset={sideOffset}
        triggerRef={tooltip.triggerRef}
        // hover/focus 개방 계열은 열림에 포커스를 뺏지 않는다(원본 정합 — F-5).
        focusOnOpen={false}
        className="z-50"
      >
        <View
          ref={ref}
          accessibilityRole="tooltip"
          nativeID={nativeID ?? tooltip.contentId}
          className={cn(tooltipContentVariants(), className)}
          {...props}
        >
          <Text className={tooltipContentTextVariants()}>{children}</Text>
          <TooltipArrow fallbackSide={side} />
        </View>
      </AnchoredOverlay>
    );
  },
);
TooltipContent.displayName = "TooltipContent";

export {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
  TooltipProvider,
  tooltipContentVariants,
  tooltipContentTextVariants,
};
