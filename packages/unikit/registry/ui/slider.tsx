// Slider — shadcn/ui（new-york-v4） slider.tsx 유니버설 포팅 （사이클 40, T-2b）.
// 원본: shadcn-ref/ui/slider.tsx — radix Slider 엔진（Root/Track/Range/Thumb）을
// 제거하고 브리지 useDrag（웹 PointerEvent네이티브 PanResponder 동일 계약）로
// 직접 구현한다.
//
// 포팅 판단（원본 대비 차이）:
// - 값 갱신: 드래그 시작 시 measureInWindow로 트랙 위치폭을 캐시하고, onMove의
//   절대 x로 위치 백분율을 계산한 뒤 min/max/step으로 정규화한다. 제스처 시작
//   위치에서 가장 가까운 썸이 움직인다（다중 썸 근사） — 인접 썸 경계를 넘지
//   않도록 클램프한다（썸 교차 없음, radix와 동일 동작）.
// - 썸 위치범위 채움은 원본의 radix 배치 대신 동적 백분율 left/width
//   （BridgeStyle） — progress.tsx 관행. 썸 중심 보정（-ml-2/-mt-2 = size-4의
//   절반 8px）은 표준 계단 토큰으로 표현해 transformcalc를 쓰지 않는다.
// - orientation vertical 지원 — 원본의 data-［orientation］ 셀렉터 전개 대신
//   prop 분기로 구현한다（레이아웃 토큰·드래그 축·범위 채움 전부 분기）.
//   aria-orientation 속성은 브리지 View/Pressable 계약에 없어 미부여 — 로드맵.
// - 원본의 ［min,max］ 폴백（radix가 도달시키지 않는 방어 코드） 대신 defaultValue
//   미지정 시 썸 1개（min）로 시작한다.
// - 접근성: 썸마다 개별 포커스 정지점이다 — View focusable（웹 tabIndex 0 →
//   focus-visible 링·Android focusable — 이슈 #19 하드웨어 키 수신 조건,
//   RN 0.88 enableKeyEvents 피처 플래그(기본 false) 뒤에 있음）. 썸별
//   role="slider" + aria-valuenow/min/max（제공 시 accessibilityLabel도 썸에
//   전달）, 루트는 role="group"（다중 썸 = 슬라이더 그룹 — 원본 radix도 썸이
//   role="slider"이고, role="slider"는 자식을 장식 취급해 루트에 남기면 썸
//   aria가 가려진다）. iOS는 View 포커스 계약이 없어 포커스 정지가 성립하지
//   않는다（한계 — 트랙 드래그 조작은 그대로 유지된다）.
// - 키보드 조정: 포커스된 썸의 onKeyDown이 그 썸을 직접 조정한다（Arrow
//   4종 ±step·Home/End — nextThumbValue）. 소비한 키는 전파를 끊어 루트와
//   이중 조정하지 않는다. 루트 onKeyDown은 포커스가 썸 밖에 있을 때(웹)
//   마지막 활성 썸을 조정하는 폴백이다. 포커스 링은 원본 관례대로 썸
//   focus-visible. 루트는 View(role=group) — Pressable button 시절의 중첩
//   인터랙티브 위반 제거(리뷰 후속), 비활성화는 드래그 가드가 담당한다.
// - transition-［color,box-shadow］（임의값）hover/focus-visible（웹 변형）은
//   web: 접두의 표준 토큰으로 근사했다.
import {
  forwardRef,
  useEffect,
  useRef,
  useState,
  type ForwardedRef,
  type MutableRefObject,
  type ReactNode,
} from "react";
import {
  View,
  measureInWindow,
  useDrag,
  type BridgeDragEvent,
  type BridgeKeyEvent,
  type BridgeViewRef,
  type ViewProps,
} from "@unikit-bridge/ui/primitives";

import { cn } from "@/lib/utils";

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

/** 썸 키 조정 — 소비 키（방향키 4종·Home/End）의 다음 값, 미소비 키는 null.
 *  이웃 썸 경계 클램프는 updateValue가 담당해 여기선 순수 계산만 한다. */
export function nextThumbValue(
  key: string,
  current: number,
  min: number,
  max: number,
  step: number,
): number | null {
  const safeStep = step > 0 ? step : 1;
  switch (key) {
    case "ArrowLeft":
    case "ArrowDown":
      return current - safeStep;
    case "ArrowRight":
    case "ArrowUp":
      return current + safeStep;
    case "Home":
      return min;
    case "End":
      return max;
    default:
      return null;
  }
}

export type SliderProps = Omit<
  ViewProps,
  "children" | "onKeyDown"
> & {
  /** 제어형 값（배열 — 다중 썸）. 지정 시 내부 state를 대체한다 */
  value?: number[];
  /** 비제어형 초기값 */
  defaultValue?: number[];
  /** 값 확정 콜백（값이 변한 이동에서만 발화） */
  onValueChange?: (value: number[]) => void;
  /** 최솟값（기본 0） */
  min?: number;
  /** 최댓값（기본 100） */
  max?: number;
  /** 조정 단위（기본 1） */
  step?: number;
  /** 슬라이더 방향（기본 "horizontal"） */
  orientation?: "horizontal" | "vertical";
  /** 슬라이더 비활성화 */
  disabled?: boolean;
  /** 내부 전용 — 루트 children은 트랙/썸로 고정 */
  children?: ReactNode;
  /** 웹/안드로이드 키보드 조정（ArrowLeft/Right/Up/Down·Home/End） */
  onKeyDown?: (event: BridgeKeyEvent) => void;
};

const Slider = forwardRef<BridgeViewRef, SliderProps>(
  (
    {
      className,
      value,
      defaultValue,
      onValueChange,
      min = 0,
      max = 100,
      step = 1,
      orientation = "horizontal",
      disabled,
      accessibilityLabel,
      onKeyDown,
      ...props
    },
    ref,
  ) => {
    const isVertical = orientation === "vertical";
    // 제어/비제어 통합 — 썸 개수는 원본처럼 값 배열 길이로 정한다.
    const [internal, setInternal] = useState<number[]>(defaultValue ?? [min]);
    const isControlled = value !== undefined;
    const values = isControlled ? value : internal;

    const safeStep = step > 0 ? step : 1;
    const range = max > min ? max - min : 1;
    // step 소수 정밀도（0.1 계열에서 0.300004가 나오지 않게）
    const stepPrecision = (String(safeStep).split(".")[1] ?? "").length;
    const pctOf = (v: number) => ((v - min) / range) * 100;
    const snap = (raw: number) => {
      const clamped = Math.min(max, Math.max(min, raw));
      const stepped =
        Math.round((clamped - min) / safeStep) * safeStep + min;
      return Number((Math.min(max, Math.max(min, stepped))).toFixed(stepPrecision));
    };

    // 활성 썸 — ref가 진실원（드래그 첫 onMove에서 결정）, state는 강조 렌더용.
    // 루트 포커스 키 조정의 대상도 이 인덱스를 따른다（썸 포커스 시 그 썸이
    // 직접 조정되며 updateValue가 여기에 반영한다）.
    const activeRef = useRef<number>(0);
    const [activeIndex, setActiveIndex] = useState<number | null>(null);
    // 트랙 캐시 — 드래그마다 재측정（pageX/pageY 창 기준 좌표 사용해 useDrag와 일치）.
    const trackRef = useRef<BridgeViewRef | null>(null);
    const rectRef = useRef<{ x: number; y: number; width: number; height: number } | null>(null);
    const measureTrack = () => {
      measureInWindow(trackRef.current, (x, y, width, height, pageX, pageY) => {
        rectRef.current = { x: pageX ?? x, y: pageY ?? y, width, height };
      });
    };
    useEffect(measureTrack, [orientation]);

    const commit = (index: number, next: number) => {
      const arr = values.slice();
      arr[index] = next;
      if (!isControlled) setInternal(arr);
      onValueChange?.(arr);
    };

    // 인접 썸 경계 안에서 값 확정（썸 교차 방지）.
    const updateValue = (index: number, raw: number) => {
      const snapped = snap(raw);
      const lower = index > 0 ? values[index - 1]! : min;
      const upper = index < values.length - 1 ? values[index + 1]! : max;
      const next = Math.min(Math.max(snapped, lower), upper);
      activeRef.current = index;
      setActiveIndex(index);
      if (next !== values[index]) commit(index, next);
    };

    const handleMove = (event: BridgeDragEvent) => {
      if (disabled) return;
      const rect = rectRef.current;
      if (!rect) return;
      const axisSize = isVertical ? rect.height : rect.width;
      if (axisSize <= 0) return;
      const pct = isVertical
        ? ((rect.y + rect.height - event.y) / rect.height) * 100
        : ((event.x - rect.x) / rect.width) * 100;
      const raw = min + (Math.min(100, Math.max(0, pct)) / 100) * range;
      if (activeIndex === null) {
        // 첫 이동 — 절대 위치에서 가장 가까운 썸을 고정한다.
        let nearest = 0;
        let best = Infinity;
        values.forEach((v, i) => {
          const d = Math.abs(v - raw);
          if (d < best) {
            best = d;
            nearest = i;
          }
        });
        activeRef.current = nearest;
        setActiveIndex(nearest);
      }
      updateValue(activeRef.current, raw);
    };

    const { dragHandlers, dragging } = useDrag({
      onBegin: () => {
        setActiveIndex(null);
        measureTrack();
      },
      onMove: handleMove,
      onEnd: () => setActiveIndex(null),
    });

    // 키 조정 공용 계산 — 썸별 핸들러와 루트 핸들러가 같은 규칙을 쓴다.
    const applyThumbKey = (index: number, event: BridgeKeyEvent): boolean => {
      if (disabled) return false;
      // value 배열 교체로 대상 썸이 사라진 경우 방어
      const target = Math.min(index, values.length - 1);
      const current = values[target] ?? values[0] ?? min;
      const next = nextThumbValue(event.key, current, min, max, safeStep);
      if (next === null) return false;
      updateValue(target, next);
      return true;
    };

    // 루트(트랙) 포커스 시 — 마지막으로 조작한 썸 기준（기본 첫 썸）.
    const handleKeyDown = (event: BridgeKeyEvent) => {
      if (applyThumbKey(activeRef.current, event)) event.preventDefault();
      onKeyDown?.(event);
    };

    // 포커스된 썸 직접 조정 — 소비한 키는 전파를 끊어 루트 핸들러와의 이중
    // 조정을 막는다. 소비자 onKeyDown 훅은 여기서 한 번만 발화한다（루트가
    // 이벤트를 받지 못하므로）.
    const handleThumbKeyDown = (index: number) => (event: BridgeKeyEvent) => {
      if (!applyThumbKey(index, event)) return;
      event.preventDefault();
      event.stopPropagation?.();
      onKeyDown?.(event);
    };

    const first = values[0] ?? min;
    const last = values[values.length - 1] ?? min;

    return (
      // 트랙 전체가 드래그·루트 키보드 조작면 — 루트는 View（role=group）로
      // 원본(shadcn div)과 같은 비인터랙티브 컨테이너다(리뷰 후속 — 이전
      // Pressable 루트는 웹 button 안에 포커스 가능한 썸이 중첩되는 WCAG
      // nested-interactive 위반이었다). 슬라이더 시맨틱·포커스는 각 썸이 지닌다.
      <View
        ref={composeRefs(trackRef, ref)}
        accessibilityRole="group"
        onKeyDown={handleKeyDown}
        className={cn(
          isVertical
            ? "relative flex h-44 w-4 touch-none flex-col items-center select-none"
            : "relative flex h-4 w-full touch-none flex-row items-center select-none",
          disabled && "web:pointer-events-none opacity-50",
          className,
        )}
        {...dragHandlers}
        {...props}
      >
        {/* 트랙 — 가로 h-1.5 w-full / 세로 w-1.5 h-full */}
        <View
          aria-hidden
          className={cn(
            "relative grow overflow-hidden rounded-full bg-muted",
            isVertical ? "h-full w-1.5" : "h-1.5 w-full",
          )}
        >
          {/* 범위 채움 — 동적 백분율은 BridgeStyle 전용 영역 */}
          <View
            className={cn(
              "absolute bg-primary",
              isVertical ? "w-full" : "h-full",
            )}
            style={
              isVertical
                ? {
                    bottom: `${pctOf(first)}%`,
                    height: `${Math.max(0, pctOf(last) - pctOf(first))}%`,
                  }
                : {
                    left: `${pctOf(first)}%`,
                    width: `${Math.max(0, pctOf(last) - pctOf(first))}%`,
                  }
            }
          />
        </View>
        {/* 썸 — 개별 포커스 정지점（썸별 role="slider"·aria）. 위치는 동적 백분율 */}
        {values.map((v, index) => (
          <View
            key={index}
            focusable={!disabled}
            accessibilityRole="slider"
            accessibilityLabel={accessibilityLabel}
            aria-valuenow={v}
            aria-valuemin={min}
            aria-valuemax={max}
            onKeyDown={handleThumbKeyDown(index)}
            className={cn(
              // 원본 썸: shadow-sm + ring-ring/50 상시·hover/focus-visible ring-4 —
              // 썸이 포커스 정지점이라 focus-visible 링이 실제로 걸린다.
              "absolute size-4 rounded-full border border-primary bg-white web:ring-ring/50 web:hover:ring-4 web:focus-visible:outline-none web:focus-visible:ring-4",
              isVertical ? "left-1/2 -mb-2 -ml-2" : "top-1/2 -mt-2 -ml-2",
              dragging &&
                index === (activeIndex ?? activeRef.current) &&
                "web:ring-4",
            )}
            style={
              isVertical
                ? { bottom: `${pctOf(v)}%` }
                : { left: `${pctOf(v)}%` }
            }
          />
        ))}
      </View>
    );
  },
);
Slider.displayName = "Slider";

export { Slider };
