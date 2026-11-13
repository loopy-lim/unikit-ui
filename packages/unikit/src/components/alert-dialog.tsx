// AlertDialog — shadcn/ui（new-york-v4） alert-dialog.tsx 유니버설 포팅 （사이클 40, T-1a）.
// 원본: shadcn-ref/ui/alert-dialog.tsx — radix AlertDialog 엔진을 제거하고 열림
// 상태는 React state + context로 직접 관리한다. 포털백드롭포커스 관리ESC 닫기
// 스크롤 잠금은 lib/overlay의 ModalOverlay가 담당한다（dialog.tsx 형제 포팅）.
//
// 포팅 판단（원본 대비 차이）:
// - AlertDialogOverlayAlertDialogPortal export 제거 — ModalOverlay로 통합（dialog
//   포팅과 동일）. role은 "alertdialog"（aria-modal은 ModalOverlay가 부여）.
// - 원본 data-size 그룹 셀렉터（data-［size=sm］:max-w-xs, group-data-［size=］/
//  alert-dialog-content:）는 data 속성이 없어 cva size 변형 + React context로
//  전파한다（alert.tsx variant context 관행）. 헤더푸터가 콘텐츠의 size를 읽는다.
// - 헤더의 gridgrid-rows-［auto_1fr］has-data-［slot=alert-dialog-media］ 2열 배치
//  （sm 기본 크기에서 미디어 아이콘 좌측텍스트 우측）는 임의값그룹 셀렉터라 재현
//  불가 — flex-col 근사: 미디어 아이콘은 항상 텍스트 위 중앙（모바일 배치）에 둔다
//  （로드맵）. Title의 col-start-2Media의 row-span-2도 같은 이유로 소실.
// - 푸터 sm 크기의 grid grid-cols-2（취소확인 2분할） 토큰은 유지하되, 네이티브
//  Yoga에 grid가 없어 flex-col로 강등된다（웹만 2분할 — 한계）.
// - AlertDialogActionCancel은 원본 Button asChild 래핑 대신 Button을 직접 렌더
//  하고 variantsize 기본값（Action=default, Cancel=outline）과 닫기 연결
//  （radix Action/Cancel은 눌림 시 다이얼로그를 닫는다）을 유지한다.
// - 백드롭 눌림 닫기: radix AlertDialog는 외부 클릭으로 닫히지 않는다（경고 대화
//  상자는 명시적 선택만 허용）. ModalOverlay dismissOnBackdrop={false}로 원본
//  동작을 유지한다（골격에 옵션 반영 완료 — T-1a 제기）. ESC 닫기도 radix와
//  같이 차단한다（dismissOnEscape={false} — G3 리뷰 제기）. 안드로이드 뒤로가기
//  （onRequestClose）는 그대로 유지된다.
// - 등장/퇴장 애니메이션（fadezoom）duration 토큰은 data-［state］ 의존이라 소실
//  — 마운트/언마운트 즉시 전환（로드맵）. max-w-［calc（100%-2rem）］ → 래퍼 p-4 근사.
// - 접근성 연결（dialog 포팅과 동일）: 트리거 aria-expandedaria-controls ↔ 카드
//  nativeID（useId 토대）, 카드 aria-describedby ↔ 설명 nativeID, 오버레이
//  aria-labelledby ↔ 제목 nativeID（스크린리더가 제목을 대화상자 이름으로 읽는다）.
import {
  createContext,
  forwardRef,
  useCallback,
  useContext,
  useId,
  useMemo,
  useRef,
  useState,
  type ReactNode,
  type RefObject,
} from "react";
import {
  Pressable,
  Text,
  View,
  type BridgePressableRef,
  type BridgeTextRef,
  type BridgeViewRef,
  type PressableProps,
  type TextProps,
  type ViewProps,
} from "@unikit-bridge/ui/primitives";
import { cva } from "class-variance-authority";

import { Button, type ButtonProps } from "./button";
import { ModalOverlay } from "../lib/overlay";
import { cn } from "../lib/utils";

type AlertDialogContextValue = {
  open: boolean;
  setOpen: (open: boolean) => void;
  /** 트리거 aria-controls ↔ 카드 nativeID 연결 */
  contentId: string;
  /** 제목 nativeID — 라벨 연결（aria-labelledby） 대기 토대 */
  titleId: string;
  /** 설명 nativeID — 카드 aria-describedby가 참조 */
  descriptionId: string;
  /** 트리거 요소 저장소 — ModalOverlay triggerRef（닫힘 후 포커스 복귀）로 전달 */
  triggerRef: RefObject<unknown>;
  setTriggerElement: (element: unknown) => void;
};

const AlertDialogContext = createContext<AlertDialogContextValue | null>(null);

function useAlertDialogContext(component: string): AlertDialogContextValue {
  const ctx = useContext(AlertDialogContext);
  if (!ctx) {
    throw new Error(
      `<${component}>는 <AlertDialog> 안에서 사용해야 합니다.`,
    );
  }
  return ctx;
}

// 콘텐츠 size 변형 전파 — 원본 group-data-［size=］/alert-dialog-content 셀렉터
// 대체. 콘텐츠 밖의 헤더푸터는 default 취급（alert.tsx 관행）.
const AlertDialogSizeContext = createContext<"default" | "sm">("default");

// 카드 — 원본 fixed 중앙 배치는 ModalOverlay position="center"가 담당.
const alertDialogContentVariants = cva(
  "pointer-events-auto relative w-full gap-4 rounded-lg border bg-background p-6 shadow-lg unikit-dialog-in web:outline-none",
  {
    variants: {
      size: {
        default: "sm:max-w-lg",
        sm: "max-w-xs",
      },
    },
    defaultVariants: {
      size: "default",
    },
  },
);

// 헤더 — 원본 grid place-items-center를 flex-col 근사. 기본 크기는 sm부터 좌측
// 정렬（원본 sm:group-data-［size=default］ 토큰）, sm 크기는 중앙 유지.
const alertDialogHeaderVariants = cva(
  "flex-col items-center gap-1.5 text-center",
  {
    variants: {
      size: {
        default: "sm:items-start sm:text-left",
        sm: "",
      },
    },
    defaultVariants: {
      size: "default",
    },
  },
);

// 푸터 — sm 크기는 취소확인 2분할（웹 grid, 네이티브 flex-col 강등）.
const alertDialogFooterVariants = cva("gap-2", {
  variants: {
    size: {
      default: "flex-col-reverse sm:flex-row sm:justify-end",
      sm: "grid grid-cols-2",
    },
  },
  defaultVariants: {
    size: "default",
  },
});

export type AlertDialogProps = ViewProps & {
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
};

const AlertDialog = forwardRef<BridgeViewRef, AlertDialogProps>(
  ({ open, defaultOpen = false, onOpenChange, children, ...props }, ref) => {
    // 비제어 상태 — 제어（open 지정）면 무시된다（tabsaccordion 관행）.
    const [internalOpen, setInternalOpen] = useState(defaultOpen);
    const isOpen = open ?? internalOpen;
    const stateRef = useRef({ open, isOpen, onOpenChange });
    stateRef.current = { open, isOpen, onOpenChange };
    const setOpen = useCallback((next: boolean) => {
      const state = stateRef.current;
      if (state.open === undefined) setInternalOpen(next);
      if (next !== state.isOpen) state.onOpenChange?.(next);
    }, []);
    const baseId = useId();
    const triggerRef = useRef<unknown>(null);
    const setTriggerElement = useCallback((element: unknown) => {
      triggerRef.current = element;
    }, []);
    const contextValue = useMemo<AlertDialogContextValue>(
      () => ({
        open: isOpen,
        setOpen,
        contentId: `${baseId}-alert-dialog-content`,
        titleId: `${baseId}-alert-dialog-title`,
        descriptionId: `${baseId}-alert-dialog-description`,
        triggerRef,
        setTriggerElement,
      }),
      [isOpen, setOpen, baseId, setTriggerElement],
    );
    return (
      <AlertDialogContext.Provider value={contextValue}>
        <View ref={ref} {...props}>
          {children}
        </View>
      </AlertDialogContext.Provider>
    );
  },
);
AlertDialog.displayName = "AlertDialog";

export type AlertDialogTriggerProps = PressableProps & {
  // asChild 미지원 — 문자열 children은 내부 Text로 감싸고, ReactNode는 그대로.
  children?: ReactNode;
};

const AlertDialogTrigger = forwardRef<
  BridgePressableRef,
  AlertDialogTriggerProps
>(({ className, children, disabled, onPress, ...props }, forwardedRef) => {
  const dialog = useAlertDialogContext("AlertDialogTrigger");
  // 콜백 ref — 외부 ref 병합 + 트리거 요소를 컨텍스트에 등록（포커스 복귀 대상）.
  const setRef = (element: BridgePressableRef | null) => {
    dialog.setTriggerElement(element);
    if (typeof forwardedRef === "function") forwardedRef(element);
    else if (forwardedRef) forwardedRef.current = element;
  };
  return (
    <Pressable
      ref={setRef}
      accessibilityRole="button"
      aria-expanded={dialog.open}
      aria-controls={dialog.contentId}
      disabled={disabled}
      onPress={() => {
        dialog.setOpen(true);
        onPress?.();
      }}
      className={className}
      {...props}
    >
      {typeof children === "string" || typeof children === "number" ? (
        <Text className="font-sans text-sm font-medium text-foreground">
          {children}
        </Text>
      ) : (
        children
      )}
    </Pressable>
  );
});
AlertDialogTrigger.displayName = "AlertDialogTrigger";

export type AlertDialogContentProps = ViewProps & {
  size?: "default" | "sm";
};

const AlertDialogContent = forwardRef<BridgeViewRef, AlertDialogContentProps>(
  ({ className, children, size = "default", nativeID, ...props }, ref) => {
    const dialog = useAlertDialogContext("AlertDialogContent");
    return (
      <ModalOverlay
        visible={dialog.open}
        onClose={() => dialog.setOpen(false)}
        position="center"
        // z-50는 오버레이 중첩 규칙 토큰（§2.3）, p-4는 원본 max-w-［calc（100%-2rem）］
        // 의 표준 계단 근사（좌우 여백 1rem씩）.
        className="z-50 p-4"
        backdropClassName="z-50"
        triggerRef={dialog.triggerRef}
        accessibilityRole="alertdialog"
        aria-labelledby={dialog.titleId}
        dismissOnBackdrop={false}
        dismissOnEscape={false}
      >
        <AlertDialogSizeContext.Provider value={size}>
          <View
            ref={ref}
            nativeID={nativeID ?? dialog.contentId}
            aria-describedby={dialog.descriptionId}
            className={cn(alertDialogContentVariants({ size }), className)}
            {...props}
          >
            {children}
          </View>
        </AlertDialogSizeContext.Provider>
      </ModalOverlay>
    );
  },
);
AlertDialogContent.displayName = "AlertDialogContent";

export type AlertDialogHeaderProps = ViewProps;

const AlertDialogHeader = forwardRef<BridgeViewRef, AlertDialogHeaderProps>(
  ({ className, ...props }, ref) => {
    const size = useContext(AlertDialogSizeContext);
    return (
      <View
        ref={ref}
        className={cn(alertDialogHeaderVariants({ size }), className)}
        {...props}
      />
    );
  },
);
AlertDialogHeader.displayName = "AlertDialogHeader";

export type AlertDialogFooterProps = ViewProps;

const AlertDialogFooter = forwardRef<BridgeViewRef, AlertDialogFooterProps>(
  ({ className, ...props }, ref) => {
    const size = useContext(AlertDialogSizeContext);
    return (
      <View
        ref={ref}
        className={cn(alertDialogFooterVariants({ size }), className)}
        {...props}
      />
    );
  },
);
AlertDialogFooter.displayName = "AlertDialogFooter";

export type AlertDialogTitleProps = TextProps;

const AlertDialogTitle = forwardRef<BridgeTextRef, AlertDialogTitleProps>(
  ({ className, nativeID, ...props }, ref) => {
    const dialog = useAlertDialogContext("AlertDialogTitle");
    return (
      <Text
        ref={ref}
        nativeID={nativeID ?? dialog.titleId}
        // 이중 지정: 전경색은 Text에（네이티브는 색 상속 불가）. 원본의
        // col-start-2（미디어 2열 배치）는 grid 소실로 제거.
        className={cn(
          "font-sans text-lg font-semibold text-foreground",
          className,
        )}
        {...props}
      />
    );
  },
);
AlertDialogTitle.displayName = "AlertDialogTitle";

export type AlertDialogDescriptionProps = TextProps;

const AlertDialogDescription = forwardRef<
  BridgeTextRef,
  AlertDialogDescriptionProps
>(({ className, nativeID, ...props }, ref) => {
  const dialog = useAlertDialogContext("AlertDialogDescription");
  return (
    <Text
      ref={ref}
      nativeID={nativeID ?? dialog.descriptionId}
      className={cn("font-sans text-sm text-muted-foreground", className)}
      {...props}
    />
  );
});
AlertDialogDescription.displayName = "AlertDialogDescription";

export type AlertDialogMediaProps = ViewProps;

const AlertDialogMedia = forwardRef<BridgeViewRef, AlertDialogMediaProps>(
  ({ className, ...props }, ref) => (
    // self-center — 원본 inline-flex의 콘텐츠 폭 수축을 교차축 정렬로 근사.
    // 원본 ［*:［svg］］:size-8 아이콘 규격은 글리프/아이콘 사용처 className으로.
    <View
      ref={ref}
      className={cn(
        "mb-2 flex size-16 items-center justify-center self-center rounded-md bg-muted",
        className,
      )}
      {...props}
    />
  ),
);
AlertDialogMedia.displayName = "AlertDialogMedia";

// Action/Cancel — 원본 Button asChild 래핑을 직렬화하고 닫기 연결만 이식.
export type AlertDialogActionProps = ButtonProps;

const AlertDialogAction = forwardRef<
  BridgePressableRef,
  AlertDialogActionProps
>(
  (
    { className, variant = "default", size = "default", onPress, ...props },
    ref,
  ) => {
    const dialog = useAlertDialogContext("AlertDialogAction");
    return (
      <Button
        ref={ref}
        variant={variant}
        size={size}
        className={className}
        onPress={() => {
          dialog.setOpen(false);
          onPress?.();
        }}
        {...props}
      />
    );
  },
);
AlertDialogAction.displayName = "AlertDialogAction";

export type AlertDialogCancelProps = ButtonProps;

const AlertDialogCancel = forwardRef<
  BridgePressableRef,
  AlertDialogCancelProps
>(
  (
    { className, variant = "outline", size = "default", onPress, ...props },
    ref,
  ) => {
    const dialog = useAlertDialogContext("AlertDialogCancel");
    return (
      <Button
        ref={ref}
        variant={variant}
        size={size}
        className={className}
        onPress={() => {
          dialog.setOpen(false);
          onPress?.();
        }}
        {...props}
      />
    );
  },
);
AlertDialogCancel.displayName = "AlertDialogCancel";

export {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogMedia,
  AlertDialogTitle,
  AlertDialogTrigger,
  alertDialogContentVariants,
  alertDialogHeaderVariants,
  alertDialogFooterVariants,
};
