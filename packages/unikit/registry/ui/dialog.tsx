// Dialog — shadcn/ui（new-york-v4） dialog.tsx 유니버설 포팅 （사이클 40, T-1a）.
// 원본: shadcn-ref/ui/dialog.tsx — radix Dialog 엔진을 제거하고 열림 상태는
// React state + context로 직접 관리한다. 포털백드롭（딤）포커스 이동/트랩/복귀
// ESC 닫기배경 스크롤 잠금은 lib/overlay의 ModalOverlay（브리지 오버레이 훈）가
// 담당한다（재구현 금지 — 디자인 계획 §2.3 "dialog 계열은 포털+백드롭만 소비"）.
//
// 포팅 판단（원본 대비 차이）:
// - DialogOverlayDialogPortal export 제거 — 포털과 오버레이（백드롭）가 ModalOverlay
//   하나로 통합되었다. z-50은 오버레이 중첩 규칙 토큰으로 래퍼백드롭에 지정한다.
// - 원본 콘텐츠의 fixed + top/left 50% + translate 중앙 배치는 ModalOverlay
//   position="center"（flex 중앙 정렬）로 대체. 임의값 max-w-［calc（100%-2rem）］ 금지에
//   따라 래퍼에 p-4（좌우 1rem씩 = 100%-2rem 상당）를 줘 카드가 화면 가장자리에
//   닿지 않게 한다. grid gap-4 → 브리지 View 기본 flex-col + gap-4로 동등 재현.
// - data-［state］ 기반 등장/퇴장 애니메이션（fadezoomduration）은 data 속성이 없어
//   재현 불가 — 마운트/언마운트 즉시 전환（로드맵: 웹 전용 애니메이션 클래스）.
// - XIcon（lucide） → ✕ 글리프 Text（alertaccordion 관행）, sr-only "Close"는
//   accessibilityLabel로 대체（유니버설 sr-only 유틸 부재 — 디자인 계획 §3）.
// - 트리거닫기는 radix asChild 대신 Pressable 직렬화 — 문자열 children은 내부
//   Text로 감싸고（pagination 관행） ReactNode는 그대로 둔다（사용처가 직접 스타일링）.
// - 접근성 연결: role="dialog"aria-modal은 ModalOverlay가 부여하고, 트리거
//   aria-expandedaria-controls와 카드 nativeID를 useId 토대로 결정적으로 연결한다.
//   카드에 aria-describedby（설명 nativeID）, 오버레이에 aria-labelledby（제목
//   nativeID）를 건다 — 스크린리더가 제목을 대화상자 이름으로 읽는다（골격에
//   계약 반영 완료, T-1a 제기）.
// - 닫힘 후 트리거 포커스 복귀: 트리거가 컨텍스트에 요소를 등록하고 ModalOverlay
//   triggerRef로 전달한다（useOverlayFocus가 복귀 처리）.
import {
  createContext,
  forwardRef,
  useContext,
  useId,
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

import { Button } from "./button";
import { ModalOverlay } from "../lib/overlay";
import { cn } from "@/lib/utils";

type DialogContextValue = {
  open: boolean;
  setOpen: (open: boolean) => void;
  /** 트리거 aria-controls ↔ 카드 nativeID 연결 */
  contentId: string;
  /** 제목 nativeID — 카드 라벨 연결（aria-labelledby） 대기 토대 */
  titleId: string;
  /** 설명 nativeID — 카드 aria-describedby가 참조 */
  descriptionId: string;
  /** 트리거 요소 저장소 — ModalOverlay triggerRef（닫힘 후 포커스 복귀）로 전달 */
  triggerRef: RefObject<unknown>;
  setTriggerElement: (element: unknown) => void;
};

const DialogContext = createContext<DialogContextValue | null>(null);

function useDialogContext(component: string): DialogContextValue {
  const ctx = useContext(DialogContext);
  if (!ctx) {
    throw new Error(`<${component}>는 <Dialog> 안에서 사용해야 합니다.`);
  }
  return ctx;
}

export type DialogProps = ViewProps & {
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
};

const Dialog = forwardRef<BridgeViewRef, DialogProps>(
  ({ open, defaultOpen = false, onOpenChange, children, ...props }, ref) => {
    // 비제어 상태 — 제어（open 지정）면 무시된다（tabsaccordion 관행）.
    const [internalOpen, setInternalOpen] = useState(defaultOpen);
    const isOpen = open ?? internalOpen;
    const setOpen = (next: boolean) => {
      if (open === undefined) setInternalOpen(next);
      if (next !== isOpen) onOpenChange?.(next);
    };
    const baseId = useId();
    const triggerRef = useRef<unknown>(null);
    return (
      <DialogContext.Provider
        value={{
          open: isOpen,
          setOpen,
          contentId: `${baseId}-dialog-content`,
          titleId: `${baseId}-dialog-title`,
          descriptionId: `${baseId}-dialog-description`,
          triggerRef,
          setTriggerElement: (element) => {
            triggerRef.current = element;
          },
        }}
      >
        <View ref={ref} {...props}>
          {children}
        </View>
      </DialogContext.Provider>
    );
  },
);
Dialog.displayName = "Dialog";

export type DialogTriggerProps = PressableProps & {
  // asChild 미지원 — 문자열 children은 내부 Text로 감싸고, ReactNode는 그대로.
  children?: ReactNode;
};

const DialogTrigger = forwardRef<BridgePressableRef, DialogTriggerProps>(
  ({ className, children, disabled, onPress, ...props }, forwardedRef) => {
    const dialog = useDialogContext("DialogTrigger");
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
  },
);
DialogTrigger.displayName = "DialogTrigger";

export type DialogCloseProps = PressableProps & {
  // DialogTrigger와 동일 — 문자열 children은 내부 Text로 감싼다.
  children?: ReactNode;
};

const DialogClose = forwardRef<BridgePressableRef, DialogCloseProps>(
  ({ className, children, disabled, onPress, ...props }, ref) => {
    const dialog = useDialogContext("DialogClose");
    return (
      <Pressable
        ref={ref}
        accessibilityRole="button"
        disabled={disabled}
        onPress={() => {
          dialog.setOpen(false);
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
  },
);
DialogClose.displayName = "DialogClose";

export type DialogContentProps = ViewProps & {
  showCloseButton?: boolean;
};

const DialogContent = forwardRef<BridgeViewRef, DialogContentProps>(
  (
    { className, children, showCloseButton = true, nativeID, ...props },
    ref,
  ) => {
    const dialog = useDialogContext("DialogContent");
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
        accessibilityRole="dialog"
        aria-labelledby={dialog.titleId}
      >
        <View
          ref={ref}
          nativeID={nativeID ?? dialog.contentId}
          aria-describedby={dialog.descriptionId}
          className={cn(
            // pointer-events-auto — 래퍼 box-none 상속 회피（lib/overlay 머리주석）.
            "pointer-events-auto relative w-full gap-4 rounded-lg border bg-background p-6 shadow-lg sm:max-w-lg unikit-dialog-in web:outline-none",
            className,
          )}
          {...props}
        >
          {children}
          {showCloseButton && (
            <DialogClose
              accessibilityLabel="Close"
              className={cn(
                "absolute top-4 right-4 rounded-xs opacity-70",
                "web:transition-opacity web:hover:opacity-100",
                "web:focus-visible:ring-2 web:focus-visible:ring-ring web:focus-visible:ring-offset-2 web:focus-visible:ring-offset-background",
              )}
            >
              <View aria-hidden>
                <Text className="text-base leading-none text-foreground">✕</Text>
              </View>
            </DialogClose>
          )}
        </View>
      </ModalOverlay>
    );
  },
);
DialogContent.displayName = "DialogContent";

export type DialogHeaderProps = ViewProps;

const DialogHeader = forwardRef<BridgeViewRef, DialogHeaderProps>(
  ({ className, ...props }, ref) => (
    <View
      ref={ref}
      className={cn("gap-2 text-center sm:text-left", className)}
      {...props}
    />
  ),
);
DialogHeader.displayName = "DialogHeader";

export type DialogFooterProps = ViewProps & {
  showCloseButton?: boolean;
};

const DialogFooter = forwardRef<BridgeViewRef, DialogFooterProps>(
  ({ className, showCloseButton = false, children, ...props }, ref) => {
    // 문맥 밖 단독 사용 시 자동 닫기 버튼은 생략한다（레이아웃 역할 유지）.
    const dialog = useContext(DialogContext);
    return (
      <View
        ref={ref}
        className={cn(
          "gap-2 flex-col-reverse sm:flex-row sm:justify-end",
          className,
        )}
        {...props}
      >
        {children}
        {showCloseButton && dialog && (
          <Button variant="outline" onPress={() => dialog.setOpen(false)}>
            Close
          </Button>
        )}
      </View>
    );
  },
);
DialogFooter.displayName = "DialogFooter";

export type DialogTitleProps = TextProps;

const DialogTitle = forwardRef<BridgeTextRef, DialogTitleProps>(
  ({ className, nativeID, ...props }, ref) => {
    const dialog = useDialogContext("DialogTitle");
    return (
      <Text
        ref={ref}
        nativeID={nativeID ?? dialog.titleId}
        className={cn(
          "font-sans text-lg leading-none font-semibold text-foreground",
          className,
        )}
        {...props}
      />
    );
  },
);
DialogTitle.displayName = "DialogTitle";

export type DialogDescriptionProps = TextProps;

const DialogDescription = forwardRef<BridgeTextRef, DialogDescriptionProps>(
  ({ className, nativeID, ...props }, ref) => {
    const dialog = useDialogContext("DialogDescription");
    return (
      <Text
        ref={ref}
        nativeID={nativeID ?? dialog.descriptionId}
        className={cn("font-sans text-sm text-muted-foreground", className)}
        {...props}
      />
    );
  },
);
DialogDescription.displayName = "DialogDescription";

export {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
};
