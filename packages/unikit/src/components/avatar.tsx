// Avatar — shadcn/ui new-york-v4 avatar（Radix Avatar 기반）를 UniKit 유니버설로 이식.
//
// 포팅 판단（radix 엔진 의존 제거）:
// - 로드 실패 상태 공유는 React context로 재현 — Avatar（루트）가
//   { size, hasImage, imageFailed }를 제공하고, AvatarImage가 마운트 등록/
//   실패 보고（브리지 Image onError）, AvatarFallback이
//   "소스 없음 또는 로드 실패"일 때만 렌더된다.
// - 브리지 Image에 onLoad 계약이 없어 '로드 성공'을 알 수 없으므로 폴백
//   표시 조건을 Radix의 "로드 전+실패"에서 "소스 없음+실패"로 단순화했다.
//   실패한 AvatarImage는 렌더를 중단한다（Radix는 깨진 img를 남긴다）.
// - 원본의 data-size + group-data size/avatar 셀렉터（폴백 글자 크기·배지
//   크기 연동）는 아래 조회 테이블로 치환 — 각 컴포넌트가 context size를 읽어
//   자기 크기 클래스를 적용한다.
// - AvatarGroup의 겹침（-space-x-2）과 data-slot=avatar 자식 링은 자식 셀렉터가
//   필요하다. 겹침은 웹 전용 클래스로 유지（네이티브은 나란히 배치）하고, 링은
//   Avatar가 AvatarGroupContext를 읽어 자신에게 ring-2를 건다.
// - AvatarGroupCount의 그룹 크기 반응（group-has-data-）은 고정 토큰（size-8）으로
//   단순화. AvatarBadge 내용은 글리프 Text 또는 비움（배경 자체가 상태 점）.
import {
  createContext,
  forwardRef,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  Image,
  Text,
  View,
  type BridgeImageRef,
  type BridgeViewRef,
  type ImageProps,
  type ViewProps,
} from "@unikit-bridge/ui/primitives";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "../lib/utils";

export type AvatarSize = "default" | "sm" | "lg";

// 루트 크기 — 원본 data-size 셀렉터（size-8 · sm:size-6 · lg:size-10） 치환.
const avatarVariants = cva(
  "relative flex shrink-0 overflow-hidden rounded-full web:select-none",
  {
    variants: {
      size: {
        default: "size-8",
        sm: "size-6",
        lg: "size-10",
      },
    },
    defaultVariants: {
      size: "default",
    },
  },
);

// 폴백 글자 크기（원본의 group-data size=sm → text-xs）·배지 크기
// （sm 2 · default 2.5 · lg 3） — context size 값으로 조회하는 치환 테이블.
const AVATAR_FALLBACK_TEXT: Record<AvatarSize, string> = {
  default: "text-sm",
  sm: "text-xs",
  lg: "text-sm",
};
const AVATAR_BADGE_SIZE: Record<AvatarSize, string> = {
  default: "size-2.5",
  sm: "size-2",
  lg: "size-3",
};

// 루트가 제공하는 상태 — 폴백 전환 판단의 단일 출처.
type AvatarContextValue = {
  size: AvatarSize;
  /** AvatarImage 마운트 여부 — false면 "소스 없음"으로 폴백 렌더 */
  hasImage: boolean;
  /** AvatarImage 로드 실패 — 폴백으로 전환 */
  imageFailed: boolean;
  reportImageMounted: (mounted: boolean) => void;
  reportImageFailed: () => void;
};

const AvatarContext = createContext<AvatarContextValue | null>(null);

// AvatarGroup 내부 여부 — Avatar가 겹침 경계 링을 자신에게 적용한다.
const AvatarGroupContext = createContext(false);

// ---------------------------------------------------------------------------
// Avatar — 루트 컨테이너. 상태 제공자역도 겸한다（원본 AvatarPrimitive.Root）.
// ---------------------------------------------------------------------------
export type AvatarProps = ViewProps &
  VariantProps<typeof avatarVariants> & {
    children?: ReactNode;
  };

const Avatar = forwardRef<BridgeViewRef, AvatarProps>(
  ({ className, size, ...props }, ref) => {
    const [hasImage, setHasImage] = useState(false);
    const [imageFailed, setImageFailed] = useState(false);
    const grouped = useContext(AvatarGroupContext);
    const resolvedSize = size ?? "default";
    const contextValue = useMemo<AvatarContextValue>(
      () => ({
        size: resolvedSize,
        hasImage,
        imageFailed,
        // setState 설정자는 참조가 안정적이라 그대로 노출해도 안전하다.
        reportImageMounted: setHasImage,
        reportImageFailed: () => setImageFailed(true),
      }),
      [resolvedSize, hasImage, imageFailed],
    );
    return (
      <AvatarContext.Provider value={contextValue}>
        <View
          ref={ref}
          className={cn(
            avatarVariants({ size }),
            grouped && "ring-2 ring-background",
            className,
          )}
          {...props}
        />
      </AvatarContext.Provider>
    );
  },
);
Avatar.displayName = "Avatar";

// ---------------------------------------------------------------------------
// AvatarImage — 브리지 Image（원격 {uri}만）. 실패 보고는 context로.
// ---------------------------------------------------------------------------
// onError는 폴백 전환의 통로이므로 props에서 제외하고 컴포넌트가 소유한다.
export type AvatarImageProps = Omit<ImageProps, "onError">;

const AvatarImage = forwardRef<BridgeImageRef, AvatarImageProps>(
  ({ className, source, ...props }, ref) => {
    const avatar = useContext(AvatarContext);
    // 마운트 등록/해제 — 폴백의 "소스 없음" 판단 근거（provider는 안정적）.
    useEffect(() => {
      avatar?.reportImageMounted(true);
      return () => avatar?.reportImageMounted(false);
    }, [avatar]);
    // 실패한 이미지는 렌더하지 않는다（포팅 노트 — Radix는 깨진 img를 남김）.
    if (avatar?.imageFailed) {
      return null;
    }
    return (
      <Image
        ref={ref}
        source={source}
        onError={avatar ? avatar.reportImageFailed : undefined}
        className={cn("aspect-square size-full", className)}
        {...props}
      />
    );
  },
);
AvatarImage.displayName = "AvatarImage";

// ---------------------------------------------------------------------------
// AvatarFallback — 이니셜/글리프. "소스 없음 또는 실패"일 때만 렌더.
// ---------------------------------------------------------------------------
export type AvatarFallbackProps = ViewProps & {
  children?: ReactNode;
};

const AvatarFallback = forwardRef<BridgeViewRef, AvatarFallbackProps>(
  ({ className, children, ...props }, ref) => {
    const avatar = useContext(AvatarContext);
    // Avatar 밖 단독 사용（문맥 없음）이면 항상 렌드한다.
    const visible = avatar ? !avatar.hasImage || avatar.imageFailed : true;
    if (!visible) {
      return null;
    }
    return (
      <View
        ref={ref}
        className={cn(
          "flex size-full items-center justify-center rounded-full bg-muted",
          className,
        )}
        {...props}
      >
        {/* 이중 지정 원칙: 전경색은 내부 Text에 — children은 이니셜/글리프 문자열 권장 */}
        <Text
          className={cn(
            "font-sans text-muted-foreground",
            avatar && AVATAR_FALLBACK_TEXT[avatar.size],
          )}
        >
          {children}
        </Text>
      </View>
    );
  },
);
AvatarFallback.displayName = "AvatarFallback";

// ---------------------------------------------------------------------------
// AvatarBadge — 우하단 상태 점. 크기는 context size 연동.
// ---------------------------------------------------------------------------
export type AvatarBadgeProps = ViewProps;

const AvatarBadge = forwardRef<BridgeViewRef, AvatarBadgeProps>(
  ({ className, ...props }, ref) => {
    const avatar = useContext(AvatarContext);
    return (
      <View
        ref={ref}
        className={cn(
          "absolute right-0 bottom-0 z-10 flex items-center justify-center rounded-full bg-primary ring-2 ring-background web:select-none",
          avatar && AVATAR_BADGE_SIZE[avatar.size],
          className,
        )}
        {...props}
      />
    );
  },
);
AvatarBadge.displayName = "AvatarBadge";

// ---------------------------------------------------------------------------
// AvatarGroup — 아바타 무리. 겹침은 웹 전용（네이티브은 나란히）.
// ---------------------------------------------------------------------------
export type AvatarGroupProps = ViewProps;

const AvatarGroup = forwardRef<BridgeViewRef, AvatarGroupProps>(
  ({ className, ...props }, ref) => (
    <AvatarGroupContext.Provider value={true}>
      <View
        ref={ref}
        className={cn("flex flex-row items-center web:-space-x-2", className)}
        {...props}
      />
    </AvatarGroupContext.Provider>
  ),
);
AvatarGroup.displayName = "AvatarGroup";

// ---------------------------------------------------------------------------
// AvatarGroupCount — 넘친 인원 표시（"+9" 등 문자열 children）.
// ---------------------------------------------------------------------------
export type AvatarGroupCountProps = ViewProps & {
  children?: ReactNode;
};

const AvatarGroupCount = forwardRef<BridgeViewRef, AvatarGroupCountProps>(
  ({ className, children, ...props }, ref) => (
    <View
      ref={ref}
      className={cn(
        "relative flex size-8 shrink-0 items-center justify-center rounded-full bg-muted ring-2 ring-background",
        className,
      )}
      {...props}
    >
      {/* 이중 지정 원칙: 전경색은 내부 Text에 */}
      <Text className="font-sans text-sm text-muted-foreground">
        {children}
      </Text>
    </View>
  ),
);
AvatarGroupCount.displayName = "AvatarGroupCount";

export {
  Avatar,
  AvatarImage,
  AvatarFallback,
  AvatarBadge,
  AvatarGroup,
  AvatarGroupCount,
};
