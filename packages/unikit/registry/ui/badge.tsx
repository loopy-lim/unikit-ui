// Badge — shadcn/ui new-york-v4 badge를 UniKit UI 유니버설로 이식（사이클 71 원본값 정비）.
// 이중 지정 원칙（§0.5）: 배경·테두리는 View, 전경색은 내부 Text에 명시（Button과 동일 패턴）.
// 인터랙티브 뱃지（onPress 지정 — 잔여 갭 해소）: 원본의 ［a&］ 래퍼 조건을 View →
// Pressable 전환으로 치환한다. 원본 ［a&］:hover:* 배경·전경 전환은 web:hover:* 조건부
// 전개, 네이티브은 hover가 없어 active:*（눌림 어포던스 근사 — Button과 동일 패턴）.
// focus 링은 인터랙티브에서만 전개한다（원본 focus-visible:* — Pressable이 스스로
// 포커스를 받아 발동. 비인터랙티브는 사이클 72 정정 그대로 없음）.
// 미지원（로드맵）: aria-invalid:*（invalid 상태 없음）·dark:*（다크는 토큰 값 전환
// 아키텍처）·［&>svg］:size-3.
// ［&>svg］:size-3 근사 유지（주석 정정）: 아이콘은 요소 자식으로 그대로 통과한다
// （문자열·숫자만 내부 Text로 감싼다 — 글리프 Text가 아니다）. 브리지 아이콘은
// 플랫폼별 팩토리（web.tsx wrapWebLucide · native.tsx wrapNativeLucide）가 만든
// 익명 함수라 식별 레지스트리가 없고, 프롭 서명 스니핑은 취약 추측이라 자식 아이콘
// 감지（cloneElement 주입）를 하지 않는다. 브리지 아이콘 기본 크기는 size-4（원본
// ［&_svg］:size-4와 동일）라 뱃지 관용 size-3은 소비자가 아이콘에
// className="size-3"으로 지정한다（브리지가 cn 병합해 덮어쓴다）.
import { Children, forwardRef } from "react";
import {
  Pressable,
  Text,
  View,
  type BridgeViewRef,
  type ViewProps,
} from "@unikit-bridge/ui/primitives";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

// View（컨테이너） — 웹은 w-fit으로 정렬 보존, 네이티브는 self-start 유지.
const badgeVariants = cva(
  "flex flex-row native:self-start web:w-fit shrink-0 items-center justify-center gap-1 overflow-hidden rounded-full border border-transparent px-2 py-0.5 text-xs font-medium web:transition-all",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground",
        secondary: "bg-secondary text-secondary-foreground",
        destructive: "bg-destructive text-destructive-foreground",
        outline: "border-border text-foreground",
        ghost: "text-foreground",
        link: "text-primary",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);

// 인터랙티브（onPress 지정）전용 전개 — 원본 ［a&］:hover:* · focus-visible:*
// （ring-［3px］→ring-3 비대괄호 계단 — 사이클 72 규격 정렬）의 조건부 클래스 치환.
// outline·ghost의 hover 전경 전환（text-accent-foreground）은 내부 Text 변형에도
// 이중 지정한다（§0.5 — 네이티브 컨테이너 글자색이 자식으로 상속되지 않는다）.
const badgeInteractiveVariants = cva(
  "web:focus-visible:border-ring web:focus-visible:ring-3 web:focus-visible:ring-ring/50",
  {
    variants: {
      variant: {
        default: "web:hover:bg-primary/90 active:bg-primary/90",
        secondary: "web:hover:bg-secondary/90 active:bg-secondary/90",
        destructive: "web:hover:bg-destructive/90 active:bg-destructive/90",
        outline:
          "web:hover:bg-accent web:hover:text-accent-foreground active:bg-accent active:text-accent-foreground",
        ghost:
          "web:hover:bg-accent web:hover:text-accent-foreground active:bg-accent active:text-accent-foreground",
        link: "",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);

// 내부 Text — 원본 text-xs font-medium. link의 밑줄은 원본대로 hover에서만
// （네이티브는 hover가 없어 밑줄이 없다 — 상시 밑줄은 소비자가 underline 추가）.
const badgeTextVariants = cva(
  "font-sans text-xs font-medium web:whitespace-nowrap",
  {
    variants: {
      variant: {
        default: "text-primary-foreground",
        secondary: "text-secondary-foreground",
        // 원본 text-white의 토큰 동등물（--destructive-foreground = 98% 백색）.
        destructive: "text-destructive-foreground",
        outline: "text-foreground",
        ghost: "text-foreground",
        link: "text-primary underline-offset-4 web:hover:underline",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);

// 내부 Text 인터랙티브 전개 — outline·ghost의 hover 전경 전환 이중 지정（§0.5）.
const badgeInteractiveTextVariants = cva("", {
  variants: {
    variant: {
      default: "",
      secondary: "",
      destructive: "",
      outline: "web:hover:text-accent-foreground active:text-accent-foreground",
      ghost: "web:hover:text-accent-foreground active:text-accent-foreground",
      link: "",
    },
  },
  defaultVariants: {
    variant: "default",
  },
});

export type BadgeProps = ViewProps &
  VariantProps<typeof badgeVariants> & {
    /** 인터랙티브 뱃지 — 지정 시 View 대신 Pressable로 렌더（원본 ［a&］ 래퍼
     *  대응）. 링크 시맨틱으로 role="link"을 부여한다（props로 덮어쓸 수 있다）. */
    onPress?: () => void;
  };

const Badge = forwardRef<BridgeViewRef, BadgeProps>(
  ({ className, variant, onPress, children, ...props }, ref) => {
    const interactive = onPress !== undefined;
    const textClass = cn(
      badgeTextVariants({ variant }),
      interactive && badgeInteractiveTextVariants({ variant }),
    );
    const content = Children.map(children, (child) =>
      typeof child === "string" || typeof child === "number" ? (
        <Text className={textClass}>{child}</Text>
      ) : (
        child
      ),
    );
    if (!interactive) {
      return (
        <View
          ref={ref}
          className={cn(badgeVariants({ variant }), className)}
          {...props}
        >
          {content}
        </View>
      );
    }
    return (
      <Pressable
        ref={ref}
        accessibilityRole="link"
        onPress={onPress}
        className={cn(
          badgeVariants({ variant }),
          badgeInteractiveVariants({ variant }),
          className,
        )}
        {...props}
      >
        {content}
      </Pressable>
    );
  },
);
Badge.displayName = "Badge";

export {
  Badge,
  badgeVariants,
  badgeInteractiveVariants,
  badgeTextVariants,
  badgeInteractiveTextVariants,
};
