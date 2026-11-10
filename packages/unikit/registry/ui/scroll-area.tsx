// ScrollArea — shadcn/ui（new-york-v4） scroll-area.tsx 유니버설 포팅 （사이클 40, T-2b）.
// 원본: shadcn-ref/ui/scroll-area.tsx — radix ScrollArea 엔진을 제거하고 브리지
// ScrollView 프리미티브（웹 overflow div / 네이티브 RN ScrollView, ref.scrollTo）를
// 그대로 소비한다. 수직이 기본이고 horizontal prop으로 가로 축으로 전환한다.
//
// 포팅 판단（원본 대비 차이）:
// - 원본의 커스텀 스크롤바（ScrollBarThumb, radix가 스크롤 오프셋뷰포트 크기를
//   계산해 주는 전제）는 브리지 계약상 재현 불가 — ScrollView의 onScroll이
//   무인자이고 스크롤 오프셋 읽기 계약이 없다. 판단: 커스텀 바를 포기하고 웹은
//   브라우저 기본 스크롤바, 네이티브는 OS 스크롤바를 쓴다（표준 동작 유지）.
// - ScrollBar export는 API 호환을 위해 유지하되 렌더할 것이 없어 null을
//   반환한다（사용측 코드가 깨지지 않게 하는 셸 — 미사용 권장）.
// - radix의 Viewport/Corner 내부 구조는 ScrollView 프리미티브가 이미
//   뷰포트+콘텐츠 컨테이너 이중 구조（contentContainerClassName）로 제공한다.
// - 원본은 ScrollBar orientation으로 가로 축을 표현했지만, 포팅은 브리지
//   ScrollView 관행을 따라 ScrollArea 자체의 horizontal prop으로 전환한다.
// - 원본 뷰포트의 focus-visible 링은 ScrollView 계약에 포커스 개념이 없어
//   제거했다（스크롤 영역은 포커서블이 아니어도 무방）.
import { forwardRef } from "react";
import {
  ScrollView,
  type BridgeScrollViewRef,
  type BridgeViewRef,
  type ScrollViewProps,
  type ViewProps,
} from "@unikit-bridge/ui/primitives";

import { cn } from "../lib/utils";

export type ScrollAreaProps = ScrollViewProps;

const ScrollArea = forwardRef<BridgeScrollViewRef, ScrollAreaProps>(
  ({ className, ...props }, ref) => (
    <ScrollView
      ref={ref}
      className={cn("relative", className)}
      {...props}
    />
  ),
);
ScrollArea.displayName = "ScrollArea";

export type ScrollBarProps = ViewProps & {
  /** 원본 호환용 — 포팅에서는 무시된다（위 머리 주석 참조） */
  orientation?: "vertical" | "horizontal";
};

// 커스텀 스크롤바 미지원 셸 — 항상 null을 렌더한다.
const ScrollBar = forwardRef<BridgeViewRef, ScrollBarProps>(() => null);
ScrollBar.displayName = "ScrollBar";

export { ScrollArea, ScrollBar };
