// Sonner — shadcn/ui（new-york-v4） sonner.tsx 유니버설 포팅 （사이클 40, T-3b）.
// 원본: shadcn-ref/ui/sonner.tsx
//
// 포팅 판단（원본 대비 차이이유）:
// - sonnernext-themes 제거 — 토스트 상태는 모듈 레벨 저장소（불변 배열 + 리스너
//   Set）가 관리하고 toast（） 호출부와 <Toaster> 렌더를 잇는다（useSyncExternalStore）.
//   원본 API 형태를 유지한다: toast（message|opts）toast.success/error/warning/
//   info/loadingtoast.dismiss（id?）toast.promise（loading → resolve/reject 갱신）.
//   toast.custom（JSX 렌더）action/cancel 버튼description 외 sonner 고유
//   프로퍼티（unstylediconsoffset 등）는 미지원 — 원본 shadcn 래퍼도 쓰지
//   않는 범위다（제한 기록）.
// - theme（받아서 무시했던 next-themes 연동）은 제거 — 스타일은 UniKit UI 팝오버
//   토큰（bg-popovertext-popover-foregroundborder）으로 통일했다（원본이
//   --normal-bg=var（--popover） 등으로 매핑하던 것의 정착）.
// - 비모달 오버레이: ModalOverlay（백드롭포커스 트랩ESC스크롤 잠금 포함）가
//   아니라 브리지 Portal을 직접 소비한다 — onBackdropPress를 주지 않아 백드롭
//   없이 body 최상위에 렌더하고, 래퍼는 pointerEvents="box-none"로 토스트
//   카드 밖 터치클릭을 통과시킨다. 네이티브는 Portal modal={false}로 RN Modal
//   대신 절대 배치 View 경로를 탄다（배경 조용 차단 회피 — 브리지에 반영 완료）.
//   이 경로는 진짜 포털이 아니므로 네이티브에서 Toaster를 화면 루트에 두는
//   것이 전제다.
// - 위치: position prop（top/bottom × left/center/right 6방향, 기본 bottom-right
//   — sonner 기본값）을 래퍼 flex 정렬 클래스로 근사. 원본의 창 가장자리
//   오프셋 고정 계산（offset prop）은 미지원, p-4 여백으로 근사.
// - 등장/퇴장 애니메이션（슬라이드높이 접힘）은 즉시 전환으로 근사（다른
//   오버레이 계열 포팅과 동일 — data-［state］ 의존 토큰 소실）.
// - 자동 닫힘: 기본 4000ms（원본 기본）, duration 옵션/Infinity（무기한） 지원.
//   loadingpromise 진행 중 토스트는 무기한, 해결 시 남은 수명으로 전환.
// - 스와이프/드래그 dismiss: 브리지 useDrag로 근사 — 배치 방향으로 48px 이상
//   끌면 닫는다（아래 배치는 아래로, 위 배치는 위로）. 원본의 방향 전환이동
//   중 카드 추적속도 판정은 없다（즉시 판정）.
// - 아이콘: 브리지 lucide 아이콘 프리미티브（CheckCircle2Icon·XCircleIcon·
//   AlertCircleIcon·InfoIcon, loading은 Loader2Icon web:animate-spin）.
// - richColors: 원본 sonner 토큰（emerald-600/red-600/amber-500/sky-500 배경）
//   을 표준 팔레트 클래스로 재현, dark: 변형은 제거（라이트 기준 단색）.
// - closeButton은 항상 표시 근사（원본은 hover 시 노출 — group 셀렉터 불가）.
// - toast 카드 max-width 356px（원본） → max-w-sm（24rem） 표준 계단 근사.
import {
  forwardRef,
  useEffect,
  useRef,
  useSyncExternalStore,
} from "react";
import {
  AlertCircleIcon,
  CheckCircle2Icon,
  InfoIcon,
  Loader2Icon,
  LoopRotate,
  Portal,
  Pressable,
  Text,
  View,
  XCircleIcon,
  XIcon,
  useDrag,
  type BridgeViewRef,
  type ViewProps,
} from "@unikit-bridge/ui/primitives";
import { cva } from "class-variance-authority";

import { cn } from "../lib/utils";

// ---------------------------------------------------------------------------
// 토스트 저장소 — 모듈 레벨（컴포넌트 외부에서 toast（） 호출 지원）
// ---------------------------------------------------------------------------

export type ToastVariant =
  | "default"
  | "success"
  | "error"
  | "warning"
  | "info"
  | "loading";

export type ToastOptions = {
  /** 보조 설명（제목 아래） */
  description?: string;
  /** 자동 닫힘 ms（기본 Toaster duration4000）. Infinity면 무기한 */
  duration?: number;
};

type ToastItem = {
  id: number;
  title: string;
  variant: ToastVariant;
  description?: string;
  /** undefined면 Toaster 기본 duration 적용 */
  duration?: number;
};

let toasts: ToastItem[] = [];
let toastCounter = 0;
const listeners = new Set<() => void>();
/** 서버 스냅샷 상수 — 서버 렌더 중 우연히 toast()가 호출돼도 모듈 상태가
 *  아닌 이 불변 빈 배열을 반환해 요청 간 누출·hydration 불일치를 막는다
 *  （G3 리뷰 제기）. */
const EMPTY_TOASTS: ToastItem[] = [];

const emit = () => {
  listeners.forEach((listener) => listener());
};

const dismissToast = (id: number) => {
  toasts = toasts.filter((toast) => toast.id !== id);
  emit();
};

const updateToast = (id: number, patch: Partial<Omit<ToastItem, "id">>) => {
  toasts = toasts.map((toast) => (toast.id === id ? { ...toast, ...patch } : toast));
  emit();
};

const createToast = (
  title: string,
  variant: ToastVariant,
  options?: ToastOptions,
): number => {
  toastCounter += 1;
  const id = toastCounter;
  toasts = [
    ...toasts,
    {
      id,
      title,
      variant,
      description: options?.description,
      duration: options?.duration,
    },
  ];
  emit();
  return id;
};

function toast(message: string, options?: ToastOptions): number;
function toast(options: ToastOptions & { title?: string }): number;
function toast(
  messageOrOptions: string | (ToastOptions & { title?: string }),
  maybeOptions?: ToastOptions,
): number {
  if (typeof messageOrOptions === "string") {
    return createToast(messageOrOptions, "default", maybeOptions);
  }
  const { title, ...rest } = messageOrOptions;
  return createToast(title ?? "", "default", rest);
}

toast.success = (message: string, options?: ToastOptions) =>
  createToast(message, "success", options);
toast.error = (message: string, options?: ToastOptions) =>
  createToast(message, "error", options);
toast.warning = (message: string, options?: ToastOptions) =>
  createToast(message, "warning", options);
toast.info = (message: string, options?: ToastOptions) =>
  createToast(message, "info", options);
toast.loading = (message: string, options?: ToastOptions) =>
  createToast(message, "loading", { ...options, duration: options?.duration ?? Infinity });

toast.dismiss = (id?: number) => {
  if (id === undefined) {
    toasts = [];
  } else {
    toasts = toasts.filter((toast) => toast.id !== id);
  }
  emit();
};

/** promise 토스트 — 로딩 표시 후 resolve면 success, reject면 error로 갱신. */
toast.promise = <T,>(
  promise: Promise<T>,
  config: {
    loading?: string;
    success?: string | ((data: T) => string);
    error?: string | ((error: unknown) => string);
  },
): Promise<T> => {
  const id = createToast(config.loading ?? "", "loading", { duration: Infinity });
  promise
    .then((data) => {
      const message =
        typeof config.success === "function" ? config.success(data) : config.success;
      updateToast(id, {
        variant: "success",
        ...(message !== undefined ? { title: message } : {}),
        // 수명 해제 — 무기한 로딩에서 자동 닫힘으로 전환. undefined로
        // 덮어써야 Toaster duration prop 기본값이 적용된다（G3 F-16 —
        // 프로퍼티를 아예 빼면 스프레드가 기존 Infinity를 유지한다）.
        duration: undefined,
      });
    })
    .catch((error: unknown) => {
      const message =
        typeof config.error === "function" ? config.error(error) : config.error;
      updateToast(id, {
        variant: "error",
        ...(message !== undefined ? { title: message } : {}),
        duration: undefined,
      });
    });
  return promise;
};

export { toast };

// ---------------------------------------------------------------------------
// Toaster — Portal 렌더（비모달）
// ---------------------------------------------------------------------------

export type ToasterProps = ViewProps & {
  position?:
    | "top-left"
    | "top-center"
    | "top-right"
    | "bottom-left"
    | "bottom-center"
    | "bottom-right";
  /** 변형별 채색 배경（emerald/red/amber/sky） */
  richColors?: boolean;
  /** 카드별 닫기 버튼 */
  closeButton?: boolean;
  /** 자동 닫힘 기본 ms（개별 duration이 우선） */
  duration?: number;
};

// 래퍼 정렬 — 원본 sonner 위치를 flex 정렬로 근사（주축=수직, 교차축=수평）.
const POSITION_CLASSES: Record<NonNullable<ToasterProps["position"]>, string> = {
  "top-left": "items-start justify-start",
  "top-center": "items-center justify-start",
  "top-right": "items-end justify-start",
  "bottom-left": "items-start justify-end",
  "bottom-center": "items-center justify-end",
  "bottom-right": "items-end justify-end",
};

function ToastIcon({
  variant,
  className,
}: {
  variant: ToastVariant;
  className?: string;
}) {
  switch (variant) {
    case "success":
      return <CheckCircle2Icon className={className} />;
    case "error":
      return <XCircleIcon className={className} />;
    case "warning":
      return <AlertCircleIcon className={className} />;
    case "info":
      return <InfoIcon className={className} />;
    case "loading":
      return (
        <LoopRotate>
          <Loader2Icon className={cn(className, "web:animate-spin")} />
        </LoopRotate>
      );
    default:
      return null;
  }
}

const subscribeToasts = (listener: () => void) => {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
};
const getClientToasts = () => toasts;
const getServerToasts = () => EMPTY_TOASTS;
const FIXED_WRAPPER_STYLE = { position: "fixed", left: 0, top: 0, right: 0, bottom: 0 } as const;

const toastCardVariants = cva(
  "pointer-events-auto relative flex-row items-start gap-3 rounded-lg border bg-popover px-4 py-3 shadow-lg unikit-toast-in web:max-w-sm",
  {
    variants: {
      rich: {
        true: "",
        false: "",
      },
      variant: {
        default: "",
        // 원본 richColors 팔레트（라이트 기준 — dark: 변형 제거）
        success: "",
        error: "",
        warning: "",
        info: "",
        loading: "",
      },
    },
    compoundVariants: [
      {
        rich: true,
        variant: "success",
        class: "border-emerald-600 bg-emerald-600",
      },
      { rich: true, variant: "error", class: "border-red-600 bg-red-600" },
      { rich: true, variant: "warning", class: "border-amber-500 bg-amber-500" },
      { rich: true, variant: "info", class: "border-sky-500 bg-sky-500" },
    ],
    defaultVariants: {
      rich: false,
      variant: "default",
    },
  },
);

type ToastCardProps = {
  toastItem: ToastItem;
  position: NonNullable<ToasterProps["position"]>;
  richColors: boolean;
  closeButton: boolean;
  defaultDuration: number;
};

function ToastCard({
  toastItem,
  position,
  richColors,
  closeButton,
  defaultDuration,
}: ToastCardProps) {
  // 드래그 dismiss — 배치 방향으로 48px 이상 끌면 닫는다（이동 중 추적 없음）.
  const dyRef = useRef(0);
  const { dragHandlers } = useDrag({
    onBegin: () => {
      dyRef.current = 0;
    },
    onMove: (event) => {
      dyRef.current = event.dy;
    },
    onEnd: () => {
      const upward = position.startsWith("top");
      const dy = dyRef.current;
      if (upward ? dy < -48 : dy > 48) {
        dismissToast(toastItem.id);
      }
    },
  });

  // 자동 닫힘 — loading（무기한）이 아니면 duration 후 제거. variant 전환（promise
  // 갱신）마다 재스케줄된다.
  const duration = toastItem.duration ?? defaultDuration;
  useEffect(() => {
    if (!Number.isFinite(duration)) return;
    const timer = setTimeout(() => dismissToast(toastItem.id), duration);
    return () => clearTimeout(timer);
  }, [toastItem.id, toastItem.variant, toastItem.description, duration]);

  const colored = richColors && toastItem.variant !== "default" && toastItem.variant !== "loading";
  // richColors 시 전경은 흰색 계열로 고정（원본）, 아니면 팝오버 토큰.
  const titleColor = colored ? "text-white" : "text-popover-foreground";
  const descriptionColor = colored ? "text-white/80" : "text-muted-foreground";

  return (
    <View
      accessibilityRole={toastItem.variant === "error" || toastItem.variant === "warning" ? "alert" : "status"}
      className={cn(
        "w-full",
        toastCardVariants({ rich: richColors, variant: toastItem.variant }),
      )}
      {...(dragHandlers as ViewProps)}
    >
      {toastItem.variant !== "default" && (
        <View aria-hidden className="shrink-0 pt-0.5">
          <ToastIcon
            variant={toastItem.variant}
            className={cn("size-4", colored ? "text-white" : "text-foreground")}
          />
        </View>
      )}
      <View className="min-w-0 flex-1 flex-col gap-1">
        {toastItem.title !== "" && (
          <Text className={cn("font-sans text-sm font-semibold", titleColor)}>
            {toastItem.title}
          </Text>
        )}
        {toastItem.description && (
          <Text className={cn("font-sans text-xs", descriptionColor)}>
            {toastItem.description}
          </Text>
        )}
      </View>
      {closeButton && (
        <Pressable
          accessibilityLabel="닫기"
          onPress={() => dismissToast(toastItem.id)}
          className="shrink-0 rounded-xs p-1"
        >
          <XIcon className={cn("size-3.5", titleColor)} />
        </Pressable>
      )}
    </View>
  );
}

const Toaster = forwardRef<BridgeViewRef, ToasterProps>(
  (
    {
      position = "bottom-right",
      richColors = false,
      closeButton = false,
      duration = 4000,
      className,
      children,
      ...props
    },
    ref,
  ) => {
    const currentToasts = useSyncExternalStore(
      subscribeToasts,
      getClientToasts,
      getServerToasts,
    );

    return (
      // modal={false} — 네이티브에서 RN Modal이 배경 터치를 차단하는 것을
      // 회피한다（비모달 오버레이 계약）. 웹은 원래 비모달이라 무시. 네이티브
      // 비모달 경로는 진짜 포털이 아니므로 Toaster를 화면 루트에 두는 것이
      // 전제다（머리주석 안내）.
      <Portal visible={currentToasts.length > 0} modal={false}>
        {/* 비모달 래퍼 — box-none으로 카드 밖 상호작용 통과（머리주석 참조）.
            fixed는 네이티브 브리지가 absolute로 치환. */}
        <View
          ref={ref}
          pointerEvents="box-none"
          className={cn(
            "gap-2 p-4 web:z-50",
            POSITION_CLASSES[position],
            className,
          )}
          style={FIXED_WRAPPER_STYLE}
          {...props}
        >
          {currentToasts.map((toastItem) => (
            <ToastCard
              key={toastItem.id}
              toastItem={toastItem}
              position={position}
              richColors={richColors}
              closeButton={closeButton}
              defaultDuration={duration}
            />
          ))}
          {children}
        </View>
      </Portal>
    );
  },
);
Toaster.displayName = "Toaster";

export { Toaster };
