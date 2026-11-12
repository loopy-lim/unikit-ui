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
// - orientation（vertical） 미지원 — 원본의 data-［orientation］ 셀렉터 전개는
//   data 속성이 없는 네이티브에서 재현 불가해 수평 전용으로 단순화했다.
// - 원본의 ［min,max］ 폴백（radix가 도달시키지 않는 방어 코드） 대신 defaultValue
//   미지정 시 썸 1개（min）로 시작한다.
// - 접근성: 루트 Pressable이 role="slider"를 대표해 aria-valuenow/min/max를
//   부여한다（마지막으로 조작한 썸 기준）. 썸별 포커스썸별 aria는 미지원 —
//   썸은 장식 View（aria-hidden）이고 조작은 트랙 전체 드래그가 담당한다.
// - 웹 키보드 조정: 루트 onKeyDown으로 ArrowLeft/Right（±step）Home/End.
//   포커스 링은 원본의 썸 focus-visible 대신 드래그 중 활성 썸 강조로 근사.
// - transition-［color,box-shadow］（임의값）hover/focus-visible（웹 변형）은
//   web: 접두의 표준 토큰으로 근사했다.
import {
  forwardRef,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import {
  Pressable,
  View,
  measureInWindow,
  useDrag,
  type BridgeDragEvent,
  type BridgeKeyEvent,
  type BridgePressableRef,
  type PressableProps,
} from "@unikit-bridge/ui/primitives";

import { cn } from "../lib/utils";

export type SliderProps = Omit<
  PressableProps,
  "onPress" | "children" | "onKeyDown"
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
  /** 슬라이더 비활성화 */
  disabled?: boolean;
  /** 내부 전용 — 루트 children은 트랙/썸로 고정 */
  children?: ReactNode;
  /** 웹 키보드 조정（ArrowLeft/RightHome/End） */
  onKeyDown?: (event: BridgeKeyEvent) => void;
};

const Slider = forwardRef<BridgePressableRef, SliderProps>(
  (
    {
      className,
      value,
      defaultValue,
      onValueChange,
      min = 0,
      max = 100,
      step = 1,
      disabled,
      ...props
    },
    ref,
  ) => {
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

    // 드래그 중 활성 썸 — ref가 진실원（첫 onMove에서 결정）, state는 강조 렌더용.
    const activeRef = useRef<number>(0);
    const [activeIndex, setActiveIndex] = useState<number | null>(null);
    // 트랙 캐시 — 드래그마다 재측정（레이아웃 변화 대응）. 마운트 시에도 1회.
    const trackRef = useRef<BridgePressableRef>(null);
    const rectRef = useRef<{ x: number; width: number } | null>(null);
    const measureTrack = () => {
      measureInWindow(trackRef.current, (x, _y, width) => {
        rectRef.current = { x, width };
      });
    };
    useEffect(measureTrack, []);

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
      const rect = rectRef.current;
      if (!rect || rect.width <= 0) return;
      const pct = ((event.x - rect.x) / rect.width) * 100;
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

    // 웹 키보드 조정 — 마지막으로 조작한 썸 기준（기본 첫 썸）.
    const handleKeyDown = (event: BridgeKeyEvent) => {
      if (disabled) return;
      // value 배열 교체로 마지막 활성 썸이 사라진 경우 방어
      const index = Math.min(activeRef.current, values.length - 1);
      const current = values[index] ?? values[0] ?? min;
      let next: number;
      switch (event.key) {
        case "ArrowLeft":
          next = current - step;
          break;
        case "ArrowRight":
          next = current + step;
          break;
        case "Home":
          next = min;
          break;
        case "End":
          next = max;
          break;
        default:
          return;
      }
      event.preventDefault();
      updateValue(index, next);
    };

    const first = values[0] ?? min;
    const last = values[values.length - 1] ?? min;

    return (
      // 트랙 전체가 드래그키보드 조작면 — Pressable（button）이라 웹 포커스가 된다.
      <Pressable
        ref={ref}
        accessibilityRole="slider"
        aria-valuenow={values[activeRef.current] ?? first}
        aria-valuemin={min}
        aria-valuemax={max}
        disabled={disabled}
        onKeyDown={handleKeyDown}
        className={cn(
          "relative flex w-full touch-none flex-row items-center select-none",
          disabled && "web:pointer-events-none opacity-50",
          className,
        )}
        {...dragHandlers}
        {...props}
      >
        {/* 트랙 — 원본 h-1.5grow 토큰 그대로 */}
        <View
          aria-hidden
          className="relative h-1.5 w-full grow overflow-hidden rounded-full bg-muted"
        >
          {/* 범위 채움 — 동적 백분율 left/width는 BridgeStyle 전용 영역 */}
          <View
            className="absolute h-full bg-primary"
            style={{
              left: `${pctOf(first)}%`,
              width: `${Math.max(0, pctOf(last) - pctOf(first))}%`,
            }}
          />
        </View>
        {/* 썸 — 장식（aria-hidden）. 위치는 동적 백분율 left */}
        {values.map((v, index) => (
          <View
            aria-hidden
            key={index}
            className={cn(
              // 원본 썸: shadow-sm + ring-ring/50 상시·hover/focus-visible ring-4.
              // 장식 썸은 포커스 불가라 hover로 근사하고, 드래그 링은 기존 어포던스 유지.
              "absolute top-1/2 -mt-2 -ml-2 size-4 rounded-full border border-primary bg-white web:ring-ring/50 web:hover:ring-4",
              dragging &&
                index === (activeIndex ?? activeRef.current) &&
                "web:ring-4",
            )}
            style={{ left: `${pctOf(v)}%` }}
          />
        ))}
      </Pressable>
    );
  },
);
Slider.displayName = "Slider";

export { Slider };
