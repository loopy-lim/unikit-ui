// Resizable — shadcn/ui（new-york-v4） resizable.tsx 유니버설 포팅 （사이클 40, T-2b）.
// 원본: shadcn-ref/ui/resizable.tsx — react-resizable-panels 엔진을 제거하고
// 브리지 useDrag（웹 PointerEvent네이티브 PanResponder 동일 계약） 기반 2패널
// 근사로 직접 구현한다. PanelGroup/Panel/Handle API명은 원본을 유지한다.
//
// 포팅 판단（원본 대비 차이）:
// - 드래그: 핸들에서 useDrag로 제스처를 받고, 그룹이 measureInWindow로 컨테이너
//   폭（수직은 높이）을 캐시해 dx（수직은 dy）를 백분율로 환산, 첫 패널의
//   flex-basis를 동적 % （BridgeStyle）로 조정한다 — progress.tsx 관행.
// - 3패널 이상은 부분 근사: 각 핸들은 자기 왼쪽（수직은 위） 패널의 basis만
//   조정하고 마지막 패널은 남은 폭을 차지한다（flex-1）. 미지원: 비율 저장
//   （autoSaveId）중첩 그룹패널 collapse 등 react-resizable-panels 전용 기능.
// - 제약: Panel의 defaultSize/minSize/maxSize（%）를 그룹이 children에서 읽어
//   클램프에 반영한다. 기본 minSize 10（원본 라이브러리 기본）maxSize 90
//   （마지막 패널 최소 폭 확보 근사）.
// - 핸들 배치 한계: 마지막 패널 뒤에 핸들을 두면 그 패널이 잔여(flex-1)에서
//   고정 basis로 전환돼 양쪽이 모두 고정된다 — 핸들은 패널 사이에 두는 것이
//   관례(원본 react-resizable-panels와 같은 제약, 리뷰 후속 기록).
// - 핸들은 View에 dragHandlers를 펼친다（클릭 시맨틱 없음）. role="separator"와
//   focusable（웹 tabIndex 0/-1 치환·Android focusable）을 부여하고 화살표 키로
//   리사이즈한다 — 수평 Left/Right·수직 Up/Down, 스텝 2%（Shift 10% — 실용값,
//   원본 라이브러리의 정확한 증분은 미이식）. focus-visible 링은 웹 전용 클래스.
//   iOS는 View 키 계약 부재로 키보드 리사이즈 불가（slider 썸과 같은 한계）,
//   Android 하드웨어 키는 RN 0.88 enableKeyEvents 플래그（기본 off） 뒤에서만 발화.
// - 원본 핸들의 after: 가상요소 히트 영역（웹 전용） 대신 핸들 자체를 w-1（수직
//   h-1）로 잡고 시각 바（w-px）를 내부 View로 분리해 양 플랫폼 동일 히트 영역.
// - GripVerticalIcon은 브리지 primitives 경유（lucide）. 수직 방향（horizontal
//   false）은 rotate-90로 원본과 같이 가로 그립으로 근사.
import {
  Children,
  cloneElement,
  createContext,
  forwardRef,
  useCallback,
  useContext,
  useEffect,
  isValidElement,
  useMemo,
  useRef,
  useState,
  type ReactElement,
  type ReactNode,
} from "react";
import {
  GripVerticalIcon,
  View,
  measureInWindow,
  useDrag,
  type BridgeDragEvent,
  type BridgeKeyEvent,
  type BridgeViewRef,
  type ViewProps,
} from "@unikit-bridge/ui/primitives";

import { cn } from "@/lib/utils";

// 패널 기본 제약（%） — 원본 라이브러리 기본 minSize 10 준수.
const DEFAULT_MIN_SIZE = 10;
const DEFAULT_MAX_SIZE = 90;

type ResizableContextValue = {
  direction: "horizontal" | "vertical";
  /** 각 패널의 flex-basis %（마지막 패널은 자동 분배를 뜻하는 null） */
  sizes: (number | null)[];
  /** 각 패널 제약（%） — 핸들 aria-valuemin/max 노출용（리뷰 후속） */
  constraints: { minSize: number; maxSize: number }[];
  beginResize: (index: number) => void;
  moveResize: (index: number, event: BridgeDragEvent) => void;
  /** 키보드 리사이즈 — 현재 basis에서 deltaPercent(%)만큼 조정（제약 클램프）. */
  keyResize: (index: number, deltaPercent: number) => void;
};

const ResizableContext = createContext<ResizableContextValue | null>(null);

function useResizableContext(component: string): ResizableContextValue {
  const ctx = useContext(ResizableContext);
  if (!ctx) {
    throw new Error(`<${component}>는 <ResizablePanelGroup> 안에서 사용해야 합니다.`);
  }
  return ctx;
}

// 패널 제약 — 그룹이 children 순회 시 수집（렌더 시점 계산, 별도 등록 없음）.
type PanelConstraint = {
  defaultSize?: number;
  minSize: number;
  maxSize: number;
};

export type ResizablePanelGroupProps = ViewProps & {
  /** 분할 방향（기본 수평） */
  direction?: "horizontal" | "vertical";
  children?: ReactNode;
};

const ResizablePanelGroup = forwardRef<BridgeViewRef, ResizablePanelGroupProps>(
  ({ className, direction = "horizontal", children, ...props }, ref) => {
    // Panel/Handle 순회 — 각각에 순서 index를 주입하고 패널 제약을 수집한다.
    const { decorated, constraints } = useMemo(() => {
      const panelConstraints: PanelConstraint[] = [];
      let panelCount = 0;
      const items = Children.toArray(children).map((child) => {
        if (!isValidElement(child)) return child;
        const element = child as ReactElement;
        if (element.type === ResizablePanel) {
          const panel = element.props as ResizablePanelProps;
          panelConstraints.push({
            defaultSize: panel.defaultSize,
            minSize: panel.minSize ?? DEFAULT_MIN_SIZE,
            maxSize: panel.maxSize ?? DEFAULT_MAX_SIZE,
          });
          const indexed = cloneElement(
            element as ReactElement<ResizablePanelProps>,
            { index: panelCount },
          );
          panelCount += 1;
          return indexed;
        }
        if (element.type === ResizableHandle) {
          // 핸들은 자기 왼쪽（수직은 위） 패널 — 직전 패널을 조정 대상으로 받는다.
          return cloneElement(
            element as ReactElement<ResizableHandleProps>,
            { index: panelCount - 1 },
          );
        }
        return child;
      });
      return { decorated: items, constraints: panelConstraints };
    }, [children]);

    // 비율 상태 — 마지막 패널은 basis 없이 잔여 폭（flex-1）을 뜻하는 null.
    const [sizes, setSizes] = useState<(number | null)[]>(() => {
      const share = Math.floor(100 / Math.max(1, constraints.length));
      return constraints.map((constraint, index) =>
        index === constraints.length - 1
          ? null
          : (constraint.defaultSize ?? share),
      );
    });

    // 드래그 세션 — 컨테이너 축 크기（캐시）와 제스처 시작 시점의 basis.
    const containerRef = useRef<BridgeViewRef>(null);
    const axisRef = useRef(0);
    const startRef = useRef(0);
    const sizesRef = useRef(sizes);
    sizesRef.current = sizes;
    const measureContainer = useCallback(() => {
      measureInWindow(containerRef.current, (_x, _y, width, height) => {
        axisRef.current = direction === "horizontal" ? width : height;
      });
    }, [direction]);
    useEffect(measureContainer, [measureContainer]);

    const beginResize = useCallback(
      (index: number) => {
        measureContainer();
        startRef.current = sizesRef.current[index] ?? 0;
      },
      [measureContainer],
    );
    const moveResize = useCallback(
      (index: number, event: BridgeDragEvent) => {
        const axis = axisRef.current;
        if (index < 0 || index >= constraints.length || axis <= 0) return;
        const delta = direction === "horizontal" ? event.dx : event.dy;
        const { minSize, maxSize } = constraints[index]!;
        const next = Math.min(
          maxSize,
          Math.max(minSize, startRef.current + (delta / axis) * 100),
        );
        setSizes((prev) =>
          // 잔여 폭 패널(마지막=null)이 조작 대상이면 무시한다 — null을 수치로
          // 바꾸면 flex-1이 고정 basis로 뒤집힌다(잘못된 후행 핸들 배치 방어).
          prev[index] == null ? prev : prev.map((size, i) => (i === index ? next : size)),
        );
      },
      [direction, constraints],
    );
    const keyResize = useCallback(
      (index: number, deltaPercent: number) => {
        if (index < 0 || index >= constraints.length) return;
        const { minSize, maxSize } = constraints[index]!;
        setSizes((prev) =>
          // 위와 같은 null-패널 가드 — 키보드 리사이즈도 잔여 폭 패널을 못 바꾼다.
          prev[index] == null
            ? prev
            : prev.map((size, i) =>
                i === index
                  ? Math.min(maxSize, Math.max(minSize, (size ?? 0) + deltaPercent))
                  : size,
              ),
        );
      },
      [constraints],
    );

    // 사용측 ref와 내부 측정 ref 병합 — 하나의 DOM/RN 요소를 공유한다.
    const combinedRef = useCallback(
      (node: BridgeViewRef | null) => {
        containerRef.current = node;
        if (typeof ref === "function") ref(node);
        else if (ref) (ref as { current: BridgeViewRef | null }).current = node;
      },
      [ref],
    );

    const contextValue = useMemo(
      () => ({
        direction,
        sizes,
        constraints,
        beginResize,
        moveResize,
        keyResize,
      }),
      [direction, sizes, constraints, beginResize, moveResize, keyResize],
    );

    return (
      <ResizableContext.Provider value={contextValue}>
        <View
          ref={combinedRef}
          className={cn(
            "flex h-full w-full",
            // 원본은 브라우저 flex-direction:row 기본에 의존(vertical만 flex-col 지정) —
            // 브리지 View는 양 플랫폼 모두 flex-col 기본이라 수평 flex-row를 명시해야 한다.
            direction === "vertical" ? "flex-col" : "flex-row",
            className,
          )}
          {...props}
        >
          {decorated}
        </View>
      </ResizableContext.Provider>
    );
  },
);
ResizablePanelGroup.displayName = "ResizablePanelGroup";

export type ResizablePanelProps = ViewProps & {
  /** 초기 크기（%） — 미지정 시 균등 분배 */
  defaultSize?: number;
  /** 최소 크기（%, 기본 10） */
  minSize?: number;
  /** 최대 크기（%, 기본 90） */
  maxSize?: number;
  /** 그룹이 주입하는 순번（내부 전용） */
  index?: number;
};

const ResizablePanel = forwardRef<BridgeViewRef, ResizablePanelProps>(
  (
    {
      // 제약 prop은 그룹이 children 순회 시 읽는다 — Panel 본체는 소비하지
      // 않으므로 구조분해로 버려 View(DOM)에 전개되지 않게 한다.
      defaultSize: _defaultSize,
      minSize: _minSize,
      maxSize: _maxSize,
      index = -1,
      className,
      style,
      ...props
    },
    ref,
  ) => {
    const ctx = useResizableContext("ResizablePanel");
    const size = index >= 0 ? (ctx.sizes[index] ?? null) : null;
    // 마지막 패널（null）은 잔여 폭 차지 — 나머지는 동적 basis %로 고정.
    const isLast = size === null;
    return (
      <View
        ref={ref}
        className={cn(isLast ? "flex-1" : "grow-0 shrink-0", className)}
        style={
          isLast ? style : { ...style, flexBasis: `${size}%` }
        }
        {...props}
      />
    );
  },
);
ResizablePanel.displayName = "ResizablePanel";

export type ResizableHandleProps = ViewProps & {
  /** 중앙 그립 박스 표시 */
  withHandle?: boolean;
  /** 그룹이 주입하는 조절 대상（왼쪽 패널） 순번（내부 전용） */
  index?: number;
};

const ResizableHandle = forwardRef<BridgeViewRef, ResizableHandleProps>(
  ({ withHandle, index = -1, className, onKeyDown, ...props }, ref) => {
    const ctx = useResizableContext("ResizableHandle");
    const { dragHandlers } = useDrag({
      onBegin: () => ctx.beginResize(index),
      onMove: (event) => ctx.moveResize(index, event),
    });
    const horizontal = ctx.direction === "horizontal";
    const handleKeyDown = (event: BridgeKeyEvent) => {
      onKeyDown?.(event);
      // 소비자 핸들러가 preventDefault로 선점했으면 기본 리사이즈를 하지 않는다
      // (웹 KeyboardEvent — 네이티브 브리지 키 계약에는 defaultPrevented가 없어
      // 항상 false로 흐른다 — bridge/types.ts 근사 한계 주석 참조).
      if ((event as { defaultPrevented?: boolean }).defaultPrevented) return;
      const step = event.shiftKey ? 10 : 2;
      if (horizontal && event.key === "ArrowLeft")
        ctx.keyResize(index, -step);
      else if (horizontal && event.key === "ArrowRight")
        ctx.keyResize(index, step);
      else if (!horizontal && event.key === "ArrowUp")
        ctx.keyResize(index, -step);
      else if (!horizontal && event.key === "ArrowDown")
        ctx.keyResize(index, step);
      else return;
      event.preventDefault();
    };
    return (
      <View
        ref={ref}
        accessibilityRole="separator"
        focusable
        aria-valuenow={ctx.sizes[index] ?? undefined}
        aria-valuemin={ctx.constraints[index]?.minSize}
        aria-valuemax={ctx.constraints[index]?.maxSize}
        onKeyDown={handleKeyDown}
        {...dragHandlers}
        className={cn(
          "relative flex touch-none items-center justify-center select-none web:outline-none web:focus-visible:ring-1 web:focus-visible:ring-ring web:focus-visible:ring-offset-1",
          horizontal
            ? "w-1 web:cursor-col-resize"
            : "h-1 web:cursor-row-resize",
          className,
        )}
        {...props}
      >
        {/* 시각 바 — 핸들（히트 영역 w-1/h-1） 안의 w-px/h-px 선. 중앙 배치는
            절반 오프셋 토큰(-ml-px/-mt-px)으로 결정적으로 표현한다. */}
        <View
          aria-hidden
          className={cn(
            "absolute bg-border",
            horizontal
              ? "inset-y-0 left-1/2 -ml-px w-px"
              : "inset-x-0 top-1/2 -mt-px h-px",
          )}
        />
        {withHandle && (
          <View
            aria-hidden
            className="z-10 flex h-4 w-3 items-center justify-center rounded-xs border border-border bg-border"
          >
            <GripVerticalIcon
              className={cn(
                "size-2.5 text-muted-foreground",
                !horizontal && "rotate-90",
              )}
            />
          </View>
        )}
      </View>
    );
  },
);
ResizableHandle.displayName = "ResizableHandle";

export { ResizablePanelGroup, ResizablePanel, ResizableHandle };
