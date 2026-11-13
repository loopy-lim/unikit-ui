// Attachment — shadcn/ui（new-york-v4） attachment.tsx 유니버설 포팅 （사이클 40, T-3d）.
// 원본: shadcn-ref/ui/attachment.tsx
//
// 포팅 판단（원본 대비 차이이유）:
// - div/span → 브리지 View/Text. AttachmentAction은 기존 Button（"./button"）을
//   재사용한다（원본 의존과 동일 구성）. 원본 기본 size "icon-xs"는 사이클 71에
//   UniKit UI Button 스펙에 신설됐다 — 포팅은 기본값을 물리지 않아 소비자가
//   size="icon-xs"를 지정하는 계약 그대로 둔다.
// - data-state/data-size/data-orientation + group-data- 셀렉터는 네이티브에
//   data 속성이 없어 AttachmentContext { size, orientation, state, hasContent,
//   hasMedia } + 조회 테이블로 재현 — 자식（Media/Content/Title/）이 context를
//   읽어 스스로 크기색위치를 적용한다（avatar.tsx 패턴）.
// - 원본 `has-data-［slot=attachment-content］:px-2.5` 조건부 패딩은 자식
//   "마운트 등록"（reportContentMounted/reportMediaMounted）으로 근사한다.
// - AttachmentGroup은 div overflow-x-auto 대신 브리지 ScrollView（horizontal）를
//   직접 소비 — 네이티브에서 div overflow 스크롤이 동작하지 않기 때문.
//   snap/scroll-px/overscroll은 웹 전용 → web: 접두. scroll-fade-x
//   scrollbar-none은 커스텀 유틸이라 제거.
// - shimmer（업로드 중 광택 애니메이션）`*:data-［slot=spinner］:size-6!`
//   ［&_svg:not（）］:size-* 셀렉터는 정의셀렉터 부재로 제거 — 진행 표시는
//   AttachmentMedia의 image 변형 opacity로 근사.
// - asChild（radix Slot） 제거 — AttachmentTrigger는 Pressable 렌더 고정,
//   type 속성은 브리지 계약에 없어 제거.
// - truncatefocus-withinhover는 웹 전용 → web: 접두（네이티브은 전체 표시）.
// - attachment-media의 전경색（error 글리프 등）은 이중 지정 원칙에 따라
//   소비자 Text에 명시 — 배경상태색만 context가 적용한다.
// - 원본 has-［>a,>button］:hover 배경은 has 임의값 셀렉터라 hover:bg-muted/50로 근사（T-4 감사 반영）.
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
  Pressable,
  ScrollView,
  Text,
  View,
  type BridgePressableRef,
  type BridgeScrollViewRef,
  type BridgeTextRef,
  type BridgeViewRef,
  type PressableProps,
  type ScrollViewProps,
  type TextProps,
  type ViewProps,
} from "@unikit-bridge/ui/primitives";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";
import { Button, type ButtonProps } from "./button";

export type AttachmentState =
  | "idle"
  | "uploading"
  | "processing"
  | "error"
  | "done";
export type AttachmentSize = "default" | "sm" | "xs";
export type AttachmentOrientation = "horizontal" | "vertical";

// Attachment가 제공하는 상태 — group-data 셀렉터 재현의 단일 출처.
type AttachmentContextValue = {
  size: AttachmentSize;
  orientation: AttachmentOrientation;
  state: AttachmentState;
  hasContent: boolean;
  hasMedia: boolean;
  reportContentMounted: (mounted: boolean) => void;
  reportMediaMounted: (mounted: boolean) => void;
};

const AttachmentContext = createContext<AttachmentContextValue | null>(null);

// 콘텐츠미디어 있을 때의 루트 패딩（원본 has-data 조건부 토큰의 조회 테이블）.
const ATTACHMENT_PADDING_CONTENT: Record<AttachmentSize, string> = {
  default: "px-2.5 py-2",
  sm: "px-2 py-1.5",
  xs: "px-1.5 py-1",
};
const ATTACHMENT_PADDING_MEDIA: Record<AttachmentSize, string> = {
  default: "p-2",
  sm: "p-1.5",
  xs: "p-1",
};

// 미디어 칸 크기（원본 group-data-［size=］:w-* 치환）.
const ATTACHMENT_MEDIA_SIZE: Record<AttachmentSize, string> = {
  default: "w-10",
  sm: "w-8",
  xs: "w-7",
};

// 제목 글자 크기（원본 루트 text-sm/text-xs 상속 치환 — Title이 스스로 적용）.
const ATTACHMENT_TITLE_TEXT: Record<AttachmentSize, string> = {
  default: "text-sm",
  sm: "text-xs",
  xs: "text-xs",
};

// ---------------------------------------------------------------------------
// Attachment — 첨부 카드 루트. 상태 제공자역을 겸한다.
// ---------------------------------------------------------------------------
const attachmentVariants = cva(
  "relative flex w-fit max-w-full min-w-0 shrink-0 flex-wrap rounded-xl border bg-card web:snap-start web:transition-colors web:hover:bg-muted/50 web:focus-within:ring-1 web:focus-within:ring-ring/50",
  {
    variants: {
      size: {
        default: "gap-2",
        sm: "gap-2.5",
        xs: "gap-1.5 rounded-lg",
      },
      orientation: {
        horizontal: "min-w-40 items-center",
        vertical: "w-24 flex-col",
      },
      state: {
        idle: "border-dashed",
        uploading: "",
        processing: "",
        error: "border-destructive/30",
        done: "",
      },
    },
    defaultVariants: {
      size: "default",
      orientation: "horizontal",
      state: "done",
    },
  },
);

export type AttachmentProps = ViewProps &
  VariantProps<typeof attachmentVariants> & {
    state?: AttachmentState;
    children?: ReactNode;
  };

const Attachment = forwardRef<BridgeViewRef, AttachmentProps>(
  (
    { className, size, orientation, state, ...props },
    ref,
  ) => {
    const [hasContent, setHasContent] = useState(false);
    const [hasMedia, setHasMedia] = useState(false);
    // VariantProps는 null을 허용하므로 기본값 병합 후 context에 제공한다.
    const resolvedSize = size ?? "default";
    const resolvedOrientation = orientation ?? "horizontal";
    const resolvedState = state ?? "done";
    const contextValue = useMemo<AttachmentContextValue>(
      () => ({
        size: resolvedSize,
        orientation: resolvedOrientation,
        state: resolvedState,
        hasContent,
        hasMedia,
        // setState 설정자는 참조가 안정적이라 그대로 노출해도 안전하다.
        reportContentMounted: setHasContent,
        reportMediaMounted: setHasMedia,
      }),
      [resolvedSize, resolvedOrientation, resolvedState, hasContent, hasMedia],
    );
    return (
      <AttachmentContext.Provider value={contextValue}>
        <View
          ref={ref}
          className={cn(
            attachmentVariants({
              size: resolvedSize,
              orientation: resolvedOrientation,
              state: resolvedState,
            }),
            // 원본 has-data-[slot=attachment-content]:w-30 치환 — 콘텐츠가
            // 마운트되면 세로형 루트가 w-24에서 w-30으로 확장한다(자식 폭 초과 방지).
            resolvedOrientation === "vertical" && hasContent && "w-30",
            hasContent && ATTACHMENT_PADDING_CONTENT[resolvedSize],
            hasMedia && ATTACHMENT_PADDING_MEDIA[resolvedSize],
            className,
          )}
          {...props}
        />
      </AttachmentContext.Provider>
    );
  },
);
Attachment.displayName = "Attachment";

// ---------------------------------------------------------------------------
// AttachmentMedia — 아이콘/이미지 칸. 크기상태색은 context 연동.
// 글리프는 children Text（색 명시）, 이미지는 children Image（aspect-square
// w-full 클래스 권장 — 원본 *:［img］: 정렬 셀렉터의 안내 치환）.
// ---------------------------------------------------------------------------
const attachmentMediaVariants = cva(
  "relative flex aspect-square shrink-0 items-center justify-center overflow-hidden rounded-lg bg-muted",
  {
    variants: {
      variant: {
        icon: "",
        image: "opacity-60",
      },
    },
    defaultVariants: {
      variant: "icon",
    },
  },
);

export type AttachmentMediaProps = ViewProps &
  VariantProps<typeof attachmentMediaVariants> & {
    children?: ReactNode;
  };

const AttachmentMedia = forwardRef<BridgeViewRef, AttachmentMediaProps>(
  ({ className, variant = "icon", children, ...props }, ref) => {
    const attachment = useContext(AttachmentContext);
    const report = attachment?.reportMediaMounted;
    // 마운트 등록/해제 — 루트 패딩 판단의 근거（provider는 안정적）.
    useEffect(() => {
      report?.(true);
      return () => report?.(false);
    }, [report]);
    const size = attachment?.size ?? "default";
    const orientation = attachment?.orientation ?? "horizontal";
    const state = attachment?.state ?? "done";
    // 이미지는 완료（idle 포함） 상태에서만 완전 불투명（원본 opacity 토큰）.
    const imageReady =
      variant === "image" && (state === "done" || state === "idle");
    return (
      <View
        ref={ref}
        className={cn(
          attachmentMediaVariants({ variant }),
          ATTACHMENT_MEDIA_SIZE[size],
          orientation === "vertical" && "w-full",
          size === "xs" && "rounded-md",
          state === "error" && "bg-destructive/10",
          imageReady && "opacity-100",
          className,
        )}
        {...props}
      >
        {children}
      </View>
    );
  },
);
AttachmentMedia.displayName = "AttachmentMedia";

// ---------------------------------------------------------------------------
// AttachmentContent — 제목설명 본문 영역.
// ---------------------------------------------------------------------------
export type AttachmentContentProps = ViewProps;

const AttachmentContent = forwardRef<BridgeViewRef, AttachmentContentProps>(
  ({ className, ...props }, ref) => {
    const attachment = useContext(AttachmentContext);
    const report = attachment?.reportContentMounted;
    // 마운트 등록/해제 — 루트 패딩 판단의 근거（provider는 안정적）.
    useEffect(() => {
      report?.(true);
      return () => report?.(false);
    }, [report]);
    return (
      <View
        ref={ref}
        className={cn(
          "max-w-full min-w-0 flex-1 leading-tight",
          attachment?.orientation === "vertical" && "px-1",
          className,
        )}
        {...props}
      />
    );
  },
);
AttachmentContent.displayName = "AttachmentContent";

// ---------------------------------------------------------------------------
// AttachmentTitle — 파일명 등 제목. 크기는 루트 size 연동.
// ---------------------------------------------------------------------------
export type AttachmentTitleProps = TextProps & {
  children?: ReactNode;
};

const AttachmentTitle = forwardRef<BridgeTextRef, AttachmentTitleProps>(
  ({ className, children, ...props }, ref) => {
    const attachment = useContext(AttachmentContext);
    return (
      <Text
        ref={ref}
        className={cn(
          "max-w-full min-w-0 font-medium text-card-foreground web:truncate",
          attachment && ATTACHMENT_TITLE_TEXT[attachment.size],
          className,
        )}
        {...props}
      >
        {children}
      </Text>
    );
  },
);
AttachmentTitle.displayName = "AttachmentTitle";

// ---------------------------------------------------------------------------
// AttachmentDescription — 보조 설명（용량진행 상태 등）. error면 붉은 계열.
// ---------------------------------------------------------------------------
export type AttachmentDescriptionProps = TextProps & {
  children?: ReactNode;
};

const AttachmentDescription = forwardRef<BridgeTextRef, AttachmentDescriptionProps>(
  ({ className, children, ...props }, ref) => {
    const attachment = useContext(AttachmentContext);
    return (
      <Text
        ref={ref}
        className={cn(
          "mt-0.5 min-w-0 max-w-full text-xs text-muted-foreground web:truncate",
          attachment?.state === "error" && "text-destructive/80",
          className,
        )}
        {...props}
      >
        {children}
      </Text>
    );
  },
);
AttachmentDescription.displayName = "AttachmentDescription";

// ---------------------------------------------------------------------------
// AttachmentActions — 우측（세로형은 우상단） 액션 영역.
// ---------------------------------------------------------------------------
export type AttachmentActionsProps = ViewProps;

const AttachmentActions = forwardRef<BridgeViewRef, AttachmentActionsProps>(
  ({ className, ...props }, ref) => {
    const attachment = useContext(AttachmentContext);
    return (
      <View
        ref={ref}
        className={cn(
          "relative z-20 flex flex-row shrink-0 items-center",
          attachment?.orientation === "vertical" &&
            "absolute top-3 right-3 gap-1",
          className,
        )}
        {...props}
      />
    );
  },
);
AttachmentActions.displayName = "AttachmentActions";

// ---------------------------------------------------------------------------
// AttachmentAction — 개별 액션 버튼（기존 Button 재사용）.
// ---------------------------------------------------------------------------
export type AttachmentActionProps = ButtonProps;

const AttachmentAction = forwardRef<BridgePressableRef, AttachmentActionProps>(
  ({ className, variant, ...props }, ref) => (
    <Button
      ref={ref}
      variant={variant ?? "ghost"}
      className={cn(className)}
      {...props}
    />
  ),
);
AttachmentAction.displayName = "AttachmentAction";

// ---------------------------------------------------------------------------
// AttachmentTrigger — 카드 전체를 눌러 열기/제거하는 투명 오버레이 버튼.
// ---------------------------------------------------------------------------
export type AttachmentTriggerProps = PressableProps;

const AttachmentTrigger = forwardRef<BridgePressableRef, AttachmentTriggerProps>(
  ({ className, ...props }, ref) => (
    <Pressable
      ref={ref}
      accessibilityRole="button"
      className={cn("absolute inset-0 z-10 web:outline-none", className)}
      {...props}
    />
  ),
);
AttachmentTrigger.displayName = "AttachmentTrigger";

// ---------------------------------------------------------------------------
// AttachmentGroup — 첨부 가로 나열（브리지 ScrollView horizontal 소비）.
// ---------------------------------------------------------------------------
export type AttachmentGroupProps = ScrollViewProps;

const AttachmentGroup = forwardRef<BridgeScrollViewRef, AttachmentGroupProps>(
  ({ className, contentContainerClassName, ...props }, ref) => (
    <ScrollView
      ref={ref}
      horizontal
      className={cn(
        "web:snap-x web:snap-mandatory web:scroll-px-1 web:overscroll-x-contain",
        className,
      )}
      contentContainerClassName={cn("gap-3 py-1", contentContainerClassName)}
      {...props}
    />
  ),
);
AttachmentGroup.displayName = "AttachmentGroup";

export {
  Attachment,
  AttachmentGroup,
  AttachmentMedia,
  AttachmentContent,
  AttachmentTitle,
  AttachmentDescription,
  AttachmentActions,
  AttachmentAction,
  AttachmentTrigger,
};
