// @unikit-bridge/ui/overlay-position 진입점(웹 — package.json exports
// default 조건). npm 전용(배럴·registry 미등록). 이슈 #15: 제품 오버레이가
// @ui-sdk/core position() 배치 엔진(docs/sdd/100 §7 — vercel-labs/ui의
// «계속 따라가는 배치 엔진»)을 소비하는 설치 함수예요.
//
// 사용법: 앱 부트에서 1회 호출. 이후 모든 AnchoredOverlay 계열(popover·
// dropdown-menu·tooltip·select·combobox·hover-card·navigation-menu·
// menubar·context-menu)의 배치가 내장 computeOverlayPosition 대신
// position()으로 교체돼요(레지스트리 주입 — lib/overlay.tsx는 이 진입점을
// import하지 않아요. @ui-sdk/core는 선택 peer라 미설치 소비자에게 이 파일
// 그래프가 끌려가지 않게 하는 구조).
//
// 웹 구동 방식(네이티브 native.ts와 같은 계약, 다른 구현 — 브리지 분기
// 원칙의 exports 조건 판):
// - 앵커·콘텐츠를 실제 DOM 요소로 position()에 넘긴다. position()은 내부
//   watchMoves로 앵커 이동(스크롤·리사이즈)을 스스로 추적하고 style.left/top·
//   data-side·--available-width/height를 요소에 기록한다(@experimental 표기 —
//   버전 고정 ^0.1.0-beta.6, §7 참조).
// - React는 위치를 style prop으로 내리므로, position()의 쓰기를 화면에 두고
//   보지 않고 rAF 폴링으로 다시 읽어 onPlace(React state)로 보고한다 — 쓴 값과
//   같은 값을 React가 확정하는 수렴 구조(웹·네이티브가 같은 계약으로
//   AnchoredOverlay에 닿게 하는 핵심 선택).
// - 충돌 플립·정렬 축 클램프는 position() 계약을 따른다(메인 축은 클램프 대신
//   --available-* 통보 → AnchoredOverlay가 maxWidth/maxHeight로 시각만 깎음).
// - stop()은 rAF 폴링과 position() cleanup을 함께 정리한다.
import { position } from "@ui-sdk/core";

import {
  setOverlayPositionEngine,
  type OverlayPlacement,
  type OverlayPositionState,
} from "../overlay";

// 계약·레지스트리 재수출 — 이 진입점 소비자가 lib/overlay 경로를 따로 찾지
// 않게. (되돌리기: setOverlayPositionEngine(null).)
export {
  getOverlayPositionEngine,
  setOverlayPositionEngine,
} from "../overlay";
export type {
  OverlayPositionEngine,
  OverlayPositionSession,
  OverlayPositionState,
} from "../overlay";

const SIDES: readonly OverlayPlacement[] = ["top", "bottom", "left", "right"];

/** ref 객체({current}) 또는 요소 값을 DOM 요소로 해석한다(SSR·미마운트는 null). */
function domElementOf(ref: unknown): HTMLElement | null {
  if (typeof window === "undefined") return null;
  const el =
    ref && typeof ref === "object" && "current" in (ref as Record<string, unknown>)
      ? (ref as { current: unknown }).current
      : ref;
  if (!el || typeof el !== "object") return null;
  const node = el as { nodeType?: number };
  return node.nodeType === 1 ? (el as HTMLElement) : null;
}

/** "374px" → 374, 빈 값·해석 불가는 null. */
function pxOf(value: string): number | null {
  if (!value) return null;
  const n = Number.parseFloat(value);
  return Number.isFinite(n) ? n : null;
}

/** position()이 data-side에 기록한 물리 면을 OverlayPlacement로 좁힌다. */
function sideOf(el: HTMLElement, fallback: OverlayPlacement): OverlayPlacement {
  const side = el.getAttribute("data-side");
  return SIDES.includes(side as OverlayPlacement) ? (side as OverlayPlacement) : fallback;
}

/** 마지막 통보와 달라진 경우만 setState가 일어나게 하는 직렬화 키. */
function stateKey(state: OverlayPositionState | null): string {
  return state
    ? `${state.left},${state.top},${state.placement},${state.maxWidth},${state.maxHeight}`
    : "";
}

/**
 * ui-sdk position() 엔진을 오버레이 배치 엔진으로 등록한다(앱 부트 1회).
 * 되돌리기는 setOverlayPositionEngine(null)(아래 재노출).
 */
export function installUiSdkOverlayPosition(): void {
  setOverlayPositionEngine({
    attach({ anchorRef, contentRef, getOptions, onPlace }) {
      const anchorEl = domElementOf(anchorRef);
      const contentEl = domElementOf(contentRef);
      if (!anchorEl || !contentEl) {
        // SSR·미마운트 — 세션만 돌려주고 아무 일도 하지 않는다(오버레이는
        // 닫혀 있거나 첫 onPlace 전 opacity 0 상태로 머문다).
        return { stop: () => {} };
      }
      let stopped = false;
      let frame = 0;
      let lastKey = "";
      const report = () => {
        const left = pxOf(contentEl.style.left);
        const top = pxOf(contentEl.style.top);
        if (left === null || top === null) return; // 아직 첫 계산 전
        const next: OverlayPositionState = {
          left,
          top,
          placement: sideOf(contentEl, getOptions().placement),
          maxWidth: pxOf(contentEl.style.getPropertyValue("--available-width")),
          maxHeight: pxOf(contentEl.style.getPropertyValue("--available-height")),
        };
        const key = stateKey(next);
        if (key === lastKey) return;
        lastKey = key;
        onPlace(next);
      };
      const poll = () => {
        if (stopped) return;
        report();
        frame = window.requestAnimationFrame(poll);
      };
      // 옵션 getter 전달 — 열린 채 side/align/offset 변경이 다음 체크에 반영된다.
      const stopPosition = position(anchorEl, contentEl, () => {
        const { placement, align, offset } = getOptions();
        return { side: placement, align, sideOffset: offset };
      });
      report();
      frame = window.requestAnimationFrame(poll);
      return {
        stop() {
          stopped = true;
          if (frame) window.cancelAnimationFrame(frame);
          stopPosition();
        },
      };
    },
  });
}
