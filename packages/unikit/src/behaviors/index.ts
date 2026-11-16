// 행동(behaviors) 진입점 — 사이클 100. npm 전용(배럴·registry 미등록).
//
// UniKit 컴포넌트의 상호작용 골격을 소비자·AI 에이전트가 조립에 쓸 수 있도록
// 그대로 재노출해요(기능 변경 없음 — 컴포넌트가 쓰는 것과 같은 구현이라 웹·
// 네이티브 양쪽에서 같은 계약으로 동작).
//
//   - overlay 계열(lib/overlay.tsx): 포털 모달·앵커 팝업 골격 + 뷰포트 위치
//     계산(12방 배치·충돌 플립·8px 클램프). dialog 계열은 ModalOverlay,
//     popover 계열은 AnchoredOverlay를 소비해요.
//   - menu-nav 계열(lib/menu-nav.tsx): 메뉴 카드 키보드 탐색 골격 — 방향키·
//     Home/End 이동, 서브메뉴 개방/복귀, 타입어헤드(radix getNextMatch 이식).
//   - 브리지 훅(primitives): useDrag(웹 Pointer Events / 네이티브
//     PanResponder), useOverlayFocus(포커스 이동·트랩·복귀), useDismiss(바깥
//     눌림·ESC), useReposition(스크롤·리사이즈 재계산), useScrollLock(배경
//     스크롤 잠금).
//
// 계약 상세는 각 원본 파일 머리 주석 참고. 한계도 원본과 같아요 — 네이티브
// 카드 키보드 탐색은 RN View에 키 이벤트가 없어 미지원이에요.
export {
  AnchoredOverlay,
  ModalOverlay,
  computeOverlayPosition,
  computeOverlayPositionWithPlacement,
  useOverlayPlacement,
} from "../lib/overlay";
export type {
  AnchoredOverlayProps,
  ModalOverlayPosition,
  ModalOverlayProps,
  OverlayAlign,
  OverlayPlacement,
} from "../lib/overlay";

export {
  MenuNavContext,
  composeMenuItemFocus,
  composeMenuItemHoverIn,
  composeMenuNavKeyDown,
  useMenuItemRef,
  useMenuNav,
  useMenuNavContext,
} from "../lib/menu-nav";
export type { MenuNavContextValue } from "../lib/menu-nav";

export {
  useDismiss,
  useDrag,
  useOverlayFocus,
  useReposition,
  useScrollLock,
} from "@unikit-bridge/ui/primitives";
export type {
  UseDismiss,
  UseDragOptions,
  UseDragResult,
  UseOverlayFocus,
  UseReposition,
  UseScrollLock,
} from "../bridge/types";
