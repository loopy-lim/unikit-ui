// Alert — shadcn/ui new-york-v4 alert 포팅（shadcn-ref/ui/alert.tsx）. 3종 export.
// 포팅 판단:
// - 원본은 grid + has-자손 셀렉터로 선택적 아이콘 열을 배치한다.
//   data·자손 셀렉터는 네이티브에서 동작하지 않으므로 flex-row（아이콘 + 콘텐츠 열）
//   구조로 재작성하고, 좌측 아이콘은 브리지 lucide 아이콘 프리미티브（default
//   InfoIcon / destructive AlertCircleIcon）로 표시한다（아이콘 없는 배치는 미지원）.
//   색·여백·rounding 토큰은 유지.
// - 원본의 텍스트 색 상속（text-card-foreground / text-destructive）은 이중 지정
//   원칙에 따라 내부 Text로 이동. 특히 AlertDescription의 destructive 톤（원본은
//   data-slot=alert-description 자손 셀렉터의 text-destructive/90）은 셀렉터를
//   쓸 수 없어 React context로 variant를 전달한다 — variant prop은 원본대로
//   Alert에만 존재한다（Alert 단독 사용 시 하위 컴포넌트는 default 톤）.
// - role="alert"은 원본 그대로 유지（신규 접근성 계약 BridgeRole "alert"）.
// - 웹 전용 토큰 처리: line-clamp-1·tracking-tight은 web: 접두, 그리드 전용
//   col-start-*·min-h-4와 ［&_p］:leading-relaxed（단락 자손 스타일）은 소실.
import { createContext, forwardRef, useContext } from "react";
import {
  AlertCircleIcon,
  InfoIcon,
  Text,
  View,
  type BridgeTextRef,
  type BridgeViewRef,
  type TextProps,
  type ViewProps,
} from "@unikit-bridge/ui/primitives";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "../lib/utils";

// 컨테이너（View） — 배경·테두리. 원본의 grid 배치를 flex-row（글리프+콘텐츠 열）로 치환.
const alertVariants = cva(
  "relative w-full flex-row items-start gap-3 rounded-lg border px-4 py-3",
  {
    variants: {
      variant: {
        default: "bg-card",
        // 원본 destructive는 border 클래스가 없다（bg-card + text-destructive뿐）.
        // border-destructive/50은 구버전 유물로 제거 — destructive는 글자색·
        // 아이콘·설명 톤(/90)으로만 구분된다.
        destructive: "bg-card",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);

// 좌측 글리프 Text — 원본 ［&>svg］:size-4·text-current 아이콘의 글리프 대체.
const alertGlyphVariants = cva("text-base leading-none", {
  variants: {
    variant: {
      default: "text-card-foreground",
      destructive: "text-destructive",
    },
  },
  defaultVariants: {
    variant: "default",
  },
});

// 제목 Text — 원본 col-start-2 line-clamp-1 font-medium tracking-tight.
const alertTitleVariants = cva(
  "font-sans text-sm font-medium leading-none web:line-clamp-1 web:tracking-tight",
  {
    variants: {
      variant: {
        default: "text-card-foreground",
        destructive: "text-destructive",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);

// 설명 Text — 원본 text-muted-foreground, destructive는 /90 톤（자손 셀렉터 대체）.
const alertDescriptionVariants = cva(
  "font-sans text-sm text-muted-foreground",
  {
    variants: {
      variant: {
        default: "",
        destructive: "text-destructive/90",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);

// variant 전파용 React context — 원본의 `*:` 자손 셀렉터를 대체한다.
const AlertContext = createContext<
  NonNullable<VariantProps<typeof alertVariants>["variant"]>
>("default");

export type AlertProps = ViewProps & VariantProps<typeof alertVariants>;
export type AlertTitleProps = TextProps;
export type AlertDescriptionProps = TextProps;

const Alert = forwardRef<BridgeViewRef, AlertProps>(
  ({ className, variant, children, ...props }, ref) => (
    <AlertContext.Provider value={variant ?? "default"}>
      <View
        ref={ref}
        accessibilityRole="alert"
        className={cn(alertVariants({ variant }), className)}
        {...props}
      >
        <View aria-hidden className="mt-0.5 shrink-0">
          {variant === "destructive" ? (
            <AlertCircleIcon className="size-4 text-destructive" />
          ) : (
            <InfoIcon className="size-4 text-foreground" />
          )}
        </View>
        <View className="flex flex-col gap-0.5">{children}</View>
      </View>
    </AlertContext.Provider>
  ),
);
Alert.displayName = "Alert";

const AlertTitle = forwardRef<BridgeTextRef, AlertTitleProps>(
  ({ className, ...props }, ref) => {
    const variant = useContext(AlertContext);
    return (
      <Text
        ref={ref}
        className={cn(alertTitleVariants({ variant }), className)}
        {...props}
      />
    );
  },
);
AlertTitle.displayName = "AlertTitle";

const AlertDescription = forwardRef<BridgeTextRef, AlertDescriptionProps>(
  ({ className, ...props }, ref) => {
    const variant = useContext(AlertContext);
    return (
      <Text
        ref={ref}
        className={cn(alertDescriptionVariants({ variant }), className)}
        {...props}
      />
    );
  },
);
AlertDescription.displayName = "AlertDescription";

export {
  Alert,
  AlertTitle,
  AlertDescription,
  alertVariants,
  alertGlyphVariants,
  alertTitleVariants,
  alertDescriptionVariants,
};
