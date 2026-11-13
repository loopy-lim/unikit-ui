// Empty — shadcn/ui new-york-v4 empty를 UniKit 유니버설로 이식.
//
// 포팅 판단:
// - 단순 레이아웃 컴포넌트군 — 엔진 의존이 없어 구조·토큰을 그대로 옮기고
//   data-slot 속성과 ［&_svg］·［&>a］ 자식 셀렉터만 제거했다.
// - EmptyMedia의 아이콘: 원본 svg 대신 큰 글리프（⊕ ⬚ ◻ 등）를 내부 Text로
//   렌더한다（아이콘 금지 규칙）. children에 문자열을 넘긴다.
// - 텍스트 정렬（text-center）은 웹은 상속되지만 네이티브은 되지 않으므로
//   Title/Description Text에 직접 지정한다（루트의 text-center는 웹 중첩
//   자식용으로 유지 — 네이티브 View에서는 무해한 no-op）.
// - text-balance·md: 반응형 패딩은 웹 전용 → web: 접두.
import { forwardRef, type ReactNode } from "react";
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

// Empty — 빈 상태 컨테이너（원본 border-dashed 토큰 보존 — 테두리 굵기는
// 소비자 className으로 지정하는 원본 사용법과 동일）.
export type EmptyProps = ViewProps;

const Empty = forwardRef<BridgeViewRef, EmptyProps>(
  ({ className, ...props }, ref) => (
    <View
      ref={ref}
      className={cn(
        "flex min-w-0 flex-1 flex-col items-center justify-center gap-6 rounded-lg border-dashed p-6 text-center web:text-balance web:md:p-12",
        className,
      )}
      {...props}
    />
  ),
);
Empty.displayName = "Empty";

// EmptyHeader — 제목·설명 묶음.
export type EmptyHeaderProps = ViewProps;

const EmptyHeader = forwardRef<BridgeViewRef, EmptyHeaderProps>(
  ({ className, ...props }, ref) => (
    <View
      ref={ref}
      className={cn(
        "flex max-w-sm flex-col items-center gap-2 text-center",
        className,
      )}
      {...props}
    />
  ),
);
EmptyHeader.displayName = "EmptyHeader";

// EmptyMedia — 글리프 아이콘 영역. icon 변형은 원본 bg-muted 상자（size-10）를
// 유지하고, 글리프 크기（text-2xl ≈ 원본 svg size-6）·색은 내부 Text에 명시.
const emptyMediaVariants = cva(
  "mb-2 flex shrink-0 items-center justify-center",
  {
    variants: {
      variant: {
        default: "bg-transparent",
        icon: "size-10 rounded-lg bg-muted",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);

export type EmptyMediaProps = ViewProps &
  VariantProps<typeof emptyMediaVariants> & {
    /** 큰 글리프 문자열（⊕ ⬚ ◻ 등） — svg 아이콘 치환 */
    children?: ReactNode;
  };

const EmptyMedia = forwardRef<BridgeViewRef, EmptyMediaProps>(
  ({ className, variant, children, ...props }, ref) => (
    <View
      ref={ref}
      className={cn(emptyMediaVariants({ variant }), className)}
      {...props}
    >
      <Text className="font-sans text-2xl leading-none text-foreground">
        {children}
      </Text>
    </View>
  ),
);
EmptyMedia.displayName = "EmptyMedia";

// EmptyTitle — 빈 상태 제목（원본 text-lg font-medium tracking-tight）.
export type EmptyTitleProps = TextProps & {
  children?: ReactNode;
};

const EmptyTitle = forwardRef<BridgeTextRef, EmptyTitleProps>(
  ({ className, ...props }, ref) => (
    <Text
      ref={ref}
      className={cn(
        "font-sans text-lg font-medium text-foreground text-center web:tracking-tight",
        className,
      )}
      {...props}
    />
  ),
);
EmptyTitle.displayName = "EmptyTitle";

// EmptyDescription — 보조 설명（원본 text-sm/relaxed → text-sm + leading-relaxed）.
export type EmptyDescriptionProps = TextProps & {
  children?: ReactNode;
};

const EmptyDescription = forwardRef<BridgeTextRef, EmptyDescriptionProps>(
  ({ className, ...props }, ref) => (
    <Text
      ref={ref}
      className={cn(
        "font-sans text-sm leading-relaxed text-center text-muted-foreground web:text-balance",
        className,
      )}
      {...props}
    />
  ),
);
EmptyDescription.displayName = "EmptyDescription";

// EmptyContent — 빈 상태 하단 액션 영역.
export type EmptyContentProps = ViewProps;

const EmptyContent = forwardRef<BridgeViewRef, EmptyContentProps>(
  ({ className, ...props }, ref) => (
    <View
      ref={ref}
      className={cn(
        "flex min-w-0 w-full max-w-sm flex-col items-center gap-4 text-sm web:text-balance",
        className,
      )}
      {...props}
    />
  ),
);
EmptyContent.displayName = "EmptyContent";

export {
  Empty,
  EmptyHeader,
  EmptyTitle,
  EmptyDescription,
  EmptyContent,
  EmptyMedia,
};
