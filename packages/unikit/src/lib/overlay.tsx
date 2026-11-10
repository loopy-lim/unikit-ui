// Overlay 공통 골격 — ModalOverlay（중앙시트형 모달）AnchoredOverlay（앵커 팝업）.
// 사이클 40 T-0（42-design-plan §2.1）: 브리지 Portal오버레이 훈 4종
// measureInWindowgetViewport를 소비해 dialogalert-dialogsheetdrawer
// popoverdropdown-menucontext-menutooltipselect 등이 플랫폼 무관 한 번
// 소스로 오버레이를 구성하게 한다.
//
// 플랫폼 정합 메모:
// - 위치 좌표는 measureInWindow（뷰포트 기준）를 그대로 쓴다. 웹은 Portal이
//   body 직계로 뿌리므로 position:"fixed"와 정합（§2.1）, 네이티브는 브리지
//   View가 fixed→absolute 치환 후 RN Modal（창 전체） 컨테이너 기준이 되어
//   동일 좌표계가 성립한다.
// - 웹에서 콘텐츠 카드는 pointer-events-auto 클래스를 기본 포함해야 한다
//   （래퍼가 pointerEvents="box-none" → CSS none 치환 상속 때문）. 네이티브는
//   box-none이 자동으로 자식 수신을 허용한다.
// - 네이티브 useReposition은 no-op — 스크롤 중 앵커 팝업 재배치는 웹 전용.
import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";

import {
  Portal,
  View,
  getViewport,
  measureInWindow,
  useDismiss,
  useOverlayFocus,
  useReposition,
  useScrollLock,
  type BridgeRole,
} from "@unikit-bridge/ui/primitives";

import { cn } from "./utils";

// ---------------------------------------------------------------------------
// ModalOverlay — 중앙（및 시트 위치） 모달 골격
// ---------------------------------------------------------------------------

export type ModalOverlayPosition = "center" | "top" | "bottom" | "left" | "right";

const POSITION_CLASSES: Record<ModalOverlayPosition, string> = {
  center: "items-center justify-center",
  top: "items-center justify-start",
  bottom: "items-center justify-end",
  left: "flex-row items-center justify-start",
  right: "flex-row items-center justify-end",
};

export type ModalOverlayProps = {
  visible: boolean;
  onClose: () => void;
  children?: ReactNode;
  /** 시트 위치（기본 center） — sheet는 bottom, drawer는 left/right */
  position?: ModalOverlayPosition;
  /** 래퍼 추가 클래스（z-index 등） */
  className?: string;
  /** 백드롭 추가 클래스（기본 반투명 딤 bg-black/50） */
  backdropClassName?: string;
  /** 닫힘 후 포커스 복귀 대상（트리거） ref — 웹 전용 */
  triggerRef?: unknown;
  /** 오버레이 역할 — dialogalertdialog 등（컴포넌트가 지정） */
  accessibilityRole?: BridgeRole;
  accessibilityLabel?: string;
  /** 제목 연결（nativeID） — 웹 aria-labelledby（스크린리더가 제목을 오버레이 이름으로
   *  읽는다）. 네이티브 미지원（폐기） — T-1a 제기 반영 */
  "aria-labelledby"?: string;
  /** 백드롭 눌림 닫기（기본 true）. alert-dialog 등 경고 대화상자는 false로
   *  명시적 선택만 허용한다（원본 radix 동작） — T-1a 제기 반영 */
  dismissOnBackdrop?: boolean;
  /** ESC 닫기（기본 true）. alert-dialog는 false로 — 원본 radix는 경고
   *  대화상자에서 ESC도 차단한다（G3 리뷰 제기 반영） */
  dismissOnEscape?: boolean;
};

/**
 * 중앙（또는 시트 위치） 모달 골격. 백드롭（딤 + 눌림 닫기）포커스 이동/트랩/
 * 복귀ESC 닫기배경 스크롤 잠금을 한 번에 제공한다. children은 실제 카드
 * （dialog content 등）이며 웹에서 카드 className에 pointer-events-auto가
 * 필요하다（컴포넌트 구현이 기본 포함한다）.
 */
export function ModalOverlay({
  visible,
  onClose,
  children,
  position = "center",
  className,
  backdropClassName,
  triggerRef,
  accessibilityRole,
  accessibilityLabel,
  "aria-labelledby": ariaLabelledBy,
  dismissOnBackdrop = true,
  dismissOnEscape = true,
}: ModalOverlayProps) {
  const contentRef = useRef<HTMLElement | null>(null);
  useOverlayFocus(contentRef, visible, triggerRef);
  useDismiss(onClose, visible && dismissOnEscape);
  useScrollLock(visible);
  return (
    <Portal
      visible={visible}
      onBackdropPress={dismissOnBackdrop ? onClose : undefined}
      onRequestClose={onClose}
      backdropClassName={cn("bg-black/50 unikit-backdrop-in", backdropClassName)}
    >
      <View
        ref={contentRef}
        aria-modal
        accessibilityRole={accessibilityRole}
        accessibilityLabel={accessibilityLabel}
        aria-labelledby={ariaLabelledBy}
        pointerEvents="box-none"
        // position fixed — Portal이 body 직계로 뿌리므로 뷰포트 기준이
        // 정확하다（absolute inset-0이면 문서 좌표계가 돼 스크롤된 페이지에서
        // 카드가 뷰포트 밖으로 나간다 — G3 F-2）. 네이티브 브리지가
        // fixed→absolute로 치환하고 RN Modal（창 전체） 컨테이너 기준이
        // 되어 동일 좌표계가 성립한다.
        style={{ position: "fixed", inset: 0 }}
        className={cn("flex", POSITION_CLASSES[position], className)}
      >
        {children}
      </View>
    </Portal>
  );
}

// ---------------------------------------------------------------------------
// AnchoredOverlay — 앵커（트리거） 위치 추종 팝업 골격
// ---------------------------------------------------------------------------

export type OverlayPlacement = "top" | "bottom" | "left" | "right";
export type OverlayAlign = "start" | "center" | "end";

export type AnchoredOverlayProps = {
  visible: boolean;
  onClose: () => void;
  /** 앵커（트리거） ref — measureInWindow로 뷰포트 좌표를 얻는다 */
  anchorRef: unknown;
  /** 앵커 기준 전개 방향（기본 bottom） */
  placement?: OverlayPlacement;
  /** 앵커 변 기준 정렬（기본 start） */
  align?: OverlayAlign;
  /** 앵커와의 간격 px（기본 8） */
  offset?: number;
  children?: ReactNode;
  /** 콘텐츠 추가 클래스（z-index배경 등） */
  className?: string;
  /** 닫힘 후 포커스 복귀 대상（트리거） ref — 웹 전용 */
  triggerRef?: unknown;
  accessibilityRole?: BridgeRole;
  accessibilityLabel?: string;
};

type Rect = { x: number; y: number; w: number; h: number };

/** ref 객체 또는 요소 값을 그대로 뽑아 measureInWindow에 전달한다. */
function measureRef(ref: unknown, callback: Parameters<typeof measureInWindow>[1]) {
  const el =
    ref && typeof ref === "object" && "current" in (ref as Record<string, unknown>)
      ? (ref as { current: unknown }).current
      : ref;
  if (el) measureInWindow(el, callback);
}

/** 앵커콘텐츠 측정값 → 뷰포트 좌표（left/top）. 클램프 여백 8px. */
export function computeOverlayPosition(
  anchor: Rect | null,
  content: { w: number; h: number } | null,
  options: { placement: OverlayPlacement; align: OverlayAlign; offset: number },
): { left: number; top: number } {
  const a = anchor ?? { x: 0, y: 0, w: 0, h: 0 };
  const cw = content?.w ?? 0;
  const ch = content?.h ?? 0;
  const { placement, align, offset } = options;
  let left = 0;
  let top = 0;
  if (placement === "bottom" || placement === "top") {
    top = placement === "bottom" ? a.y + a.h + offset : a.y - ch - offset;
    left =
      align === "start"
        ? a.x
        : align === "center"
          ? a.x + (a.w - cw) / 2
          : a.x + a.w - cw;
  } else {
    left = placement === "right" ? a.x + a.w + offset : a.x - cw - offset;
    top =
      align === "start" ? a.y : align === "center" ? a.y + (a.h - ch) / 2 : a.y + a.h - ch;
  }
  const viewport = getViewport();
  if (viewport.width > 0) {
    left = Math.min(Math.max(left, 8), Math.max(viewport.width - cw - 8, 8));
  }
  if (viewport.height > 0) {
    if (top + ch > viewport.height - 8) top = Math.max(viewport.height - ch - 8, 8);
    else if (top < 8) top = 8;
  }
  return { left, top };
}

/**
 * 앵커 팝업 골격（popoverdropdowntooltipselect 목록 등）. 열릴 때와 웹
 * 스크롤/리사이즈 때 앵커를 다시 측정해 위치를 잡는다（콘텐츠 크기는 첫 렌더
 * 후 측정해 top/end 배치를 보정）. 비모달이라 배경 스크롤 잠금은 하지 않는다.
 */
export function AnchoredOverlay({
  visible,
  onClose,
  anchorRef,
  placement = "bottom",
  align = "start",
  offset = 8,
  children,
  className,
  triggerRef,
  accessibilityRole,
  accessibilityLabel,
}: AnchoredOverlayProps) {
  const [anchorRect, setAnchorRect] = useState<Rect | null>(null);
  const [contentSize, setContentSize] = useState<{ w: number; h: number } | null>(null);
  const contentRef = useRef<HTMLElement | null>(null);
  const ready = anchorRect !== null;

  const measure = useCallback(() => {
    measureRef(anchorRef, (x, y, width, height) =>
      setAnchorRect({ x, y, w: width, h: height }),
    );
    measureRef(contentRef, (_x, _y, width, height) =>
      setContentSize({ w: width, h: height }),
    );
  }, [anchorRef]);

  // deps에 ready — 첫 오픈은 anchorRect null로 Portal이 마운트 전이라
  // contentRef가 비어 콘텐츠 측정이 스킵된다. 앵커 측정 완료(ready)로
  // 재렌더해 Portal이 마운트된 뒤 이펙트가 한 번 더 실행돼 콘텐츠 크기를
  // 잡는다. 이 의존성이 없으면 contentSize가 영구 null → 카드가 투명(opacity
  // 0) 상태로 남는다(G3 F-1 — 첫 오픈 불가시화).
  useEffect(() => {
    if (visible) measure();
  }, [visible, ready, measure]);
  useReposition(measure, visible);
  useDismiss(onClose, visible);
  useOverlayFocus(contentRef, visible, triggerRef);

  const position = computeOverlayPosition(anchorRect, contentSize, { placement, align, offset });
  return (
    // onBackdropPress: 투명 백드롭이 앵커 팝업 바깥 탭/클릭을 잡아 닫는다
    // （웹 fixed 투명층네이티브 Modal 배경 Pressable — 양측 동일 UX）.
    // 비모달 팝업이지만 바깥 상호작용은 "닫힘 후 재시도"로 일관 처리한다.
    <Portal visible={visible && ready} onBackdropPress={onClose} onRequestClose={onClose}>
      <View
        ref={contentRef}
        accessibilityRole={accessibilityRole}
        accessibilityLabel={accessibilityLabel}
        className={cn("pointer-events-auto", className)}
        style={{
          position: "fixed",
          left: position.left,
          top: position.top,
          // 콘텐츠 크기 미측정 첫 프레임은 깜빡임 방지로 숨긴다
          opacity: contentSize === null ? 0 : 1,
        }}
      >
        {children}
      </View>
    </Portal>
  );
}
