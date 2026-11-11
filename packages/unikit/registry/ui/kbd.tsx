// Kbd — shadcn/ui new-york-v4 kbd 포팅（shadcn-ref/ui/kbd.tsx）. Kbd·KbdGroup 2종.
// 포팅 판단:
// - <kbd> 요소는 브리지 계약에 없어 View（배경·크기） + 내부 Text（글자）의
//   이중 지정으로 재현한다. children은 문자열（"⌘", "Ctrl", "K" 등）을 권장한다.
// - 원본의 svg·tooltip 연동 셀렉터（［&_svg］·［［data-slot=tooltip-content］_&］）는
//   아이콘·툴팁 미지원 포팅이라 소실.
// - pointer-events-none·select-none은 웹 전용 접두. KbdGroup의 원본이 <div>가
//   아니라 <kbd>를 다시 쓰는 업스트림 특성은 View로 정리했다.
import { forwardRef } from "react";
import {
  Text,
  View,
  type BridgeViewRef,
  type ViewProps,
} from "@unikit-bridge/ui/primitives";
import { cva } from "class-variance-authority";

import { cn } from "../lib/utils";

// View（컨테이너） — 원본 토큰 그대로（h-5 min-w-5 px-1 rounded-sm bg-muted）.
const kbdVariants = cva(
  "flex-row h-5 w-fit min-w-5 items-center justify-center gap-1 rounded-sm bg-muted px-1 web:pointer-events-none web:select-none",
);

// 내부 Text
const kbdTextVariants = cva(
  "font-sans text-xs font-medium text-muted-foreground",
);

// 키 조합 그룹 — Kbd 여러 개를 묶는 인라인 컨테이너（원본 inline-flex gap-1）.
// w-fit은 uniwind 미지원 — tabs.tsx와 동일하게 self-start（교차축 시작 정렬로
// 내용 폭 수축）로 치환해 양쪽 플랫폼 폭을 맞춘다（M-2）.
const kbdGroupVariants = cva("flex-row self-start items-center gap-1");

export type KbdProps = ViewProps;
export type KbdGroupProps = ViewProps;

const Kbd = forwardRef<BridgeViewRef, KbdProps>(
  ({ className, children, ...props }, ref) => (
    <View
      ref={ref}
      className={cn(kbdVariants(), className)}
      {...props}
    >
      <Text className={cn(kbdTextVariants())}>{children}</Text>
    </View>
  ),
);
Kbd.displayName = "Kbd";

const KbdGroup = forwardRef<BridgeViewRef, KbdGroupProps>(
  ({ className, ...props }, ref) => (
    <View
      ref={ref}
      className={cn(kbdGroupVariants(), className)}
      {...props}
    />
  ),
);
KbdGroup.displayName = "KbdGroup";

export { Kbd, KbdGroup, kbdVariants, kbdTextVariants, kbdGroupVariants };
