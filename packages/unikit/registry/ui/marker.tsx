// Marker — shadcn/ui（new-york-v4） marker.tsx 유니버설 포팅 （사이클 40, T-3d）.
// 원본: shadcn-ref/ui/marker.tsx
//
// 포팅 판단（원본 대비 차이이유）:
// - 원본 확인 결과 지도/위치 마커가 아니라 채팅 목록의 날짜안내 구분선
//   마커다（default 텍스트 / separator 좌우 선 / border 하단 선） — 이미지
//   브리지 Image 불필요, 원본 구조（텍스트 마커） 그대로 이식했다.
// - div/span → 브리지 View/Text. asChild（radix Slot） 제거 — View 렌더 고정.
// - separator 변형의 before:/after: 의사요소（좌우 선）는 네이티브에 없어
//   실제 View（h-px flex-1 bg-border, aria-hidden） 두 개로 근사 렌더한다.
//   원본 before:mr-1/after:ml-1 간격은 기존 gap-2가 대신한다.
// - MarkerContent의 group-data-［variant=separator］/marker:* 셀렉터는
//   MarkerContext（variant）로 재현 — separator면 flex-none + 가운데 정렬.
// - ［&_svg:not（）］:size-*［a］:underline 등 셀렉터는 제거（글리프 크기
//   링크 색은 소비자 Text에 명시 — 이중 지정 원칙）. wrap-break-word는
//   웹 전용 → web: 접두.
// - markerVariants는 원본과 동일하게 export（변이 토큰 유지）.
import {
  createContext,
  forwardRef,
  useContext,
  type ReactNode,
} from "react";
import {
  Text,
  View,
  type BridgeTextRef,
  type BridgeViewRef,
  type TextProps,
  type ViewProps,
} from "@unikit-bridge/ui/primitives";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const markerVariants = cva(
  "relative flex flex-row min-h-4 w-full items-center gap-2",
  {
    variants: {
      variant: {
        default: "",
        // 좌우 선은 before/after 의사요소 대신 실제 View로 렌더（본문 참조）.
        separator: "",
        border: "border-b border-border pb-2",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);

// MarkerContent가 variant를 읽기 위한 문맥（separator 근사의 판단 근거）.
const MarkerContext = createContext<
  VariantProps<typeof markerVariants>["variant"] | null
>(null);

// ---------------------------------------------------------------------------
// Marker — 구분 마커 루트. separator 변형이면 좌우 선을 함께 렌더한다.
// ---------------------------------------------------------------------------
export type MarkerProps = ViewProps &
  VariantProps<typeof markerVariants> & {
    children?: ReactNode;
  };

const Marker = forwardRef<BridgeViewRef, MarkerProps>(
  ({ className, variant = "default", children, ...props }, ref) => (
    <MarkerContext.Provider value={variant}>
      <View
        ref={ref}
        className={cn(markerVariants({ variant }), className)}
        {...props}
      >
        {variant === "separator" && (
          <View aria-hidden className="h-px min-w-0 flex-1 bg-border" />
        )}
        {children}
        {variant === "separator" && (
          <View aria-hidden className="h-px min-w-0 flex-1 bg-border" />
        )}
      </View>
    </MarkerContext.Provider>
  ),
);
Marker.displayName = "Marker";

// ---------------------------------------------------------------------------
// MarkerIcon — 마커 앞 글리프 칸（장식 — 스크린리더 은닉）.
// ---------------------------------------------------------------------------
export type MarkerIconProps = ViewProps;

const MarkerIcon = forwardRef<BridgeViewRef, MarkerIconProps>(
  ({ className, ...props }, ref) => (
    <View
      ref={ref}
      aria-hidden
      className={cn("size-4 shrink-0 items-center justify-center", className)}
      {...props}
    />
  ),
);
MarkerIcon.displayName = "MarkerIcon";

// ---------------------------------------------------------------------------
// MarkerContent — 마커 텍스트（날짜안내 문구）. separator면 가운데 고정.
// ---------------------------------------------------------------------------
export type MarkerContentProps = TextProps & {
  children?: ReactNode;
};

const MarkerContent = forwardRef<BridgeTextRef, MarkerContentProps>(
  ({ className, ...props }, ref) => {
    const variant = useContext(MarkerContext);
    return (
      <Text
        ref={ref}
        className={cn(
          "min-w-0 text-sm text-muted-foreground web:wrap-break-word",
          variant === "separator" && "flex-none text-center",
          className,
        )}
        {...props}
      />
    );
  },
);
MarkerContent.displayName = "MarkerContent";

export { Marker, MarkerIcon, MarkerContent, markerVariants };
