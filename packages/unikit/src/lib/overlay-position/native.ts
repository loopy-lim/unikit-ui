// @unikit-bridge/ui/overlay-position 진입점(네이티브 — package.json exports
// react-native 조건). npm 전용(배럴·registry 미등록). 이슈 #15: 제품 오버레이가
// @ui-sdk/core position() 배치 엔진을 소비하는 설치 함수예요(웹 web.ts와 같은
// 계약·다른 구현 — 브리지 분기 원칙의 exports 조건 판. lib/overlay.tsx는 이
// 진입점을 import하지 않고, @ui-sdk/core는 선택 peer라 미설치 소비자에게 이
// 그래프가 끌려가지 않아요).
//
// RN 구동 방식(docs/sdd/100 §7 P3 기기 실증 — apps/expo/app/uisdk-popup.tsx
// 패턴의 제품화):
// - 앵커는 VirtualAnchor({getBoundingClientRect} getter — 공식 @stable 계약)로
//   전달. position()의 rAF 루프가 닫히지 않고(unwatched 경로) 매 프레임 앵커를
//   다시 읽어 충돌 플립·재배치를 프레임마다 재판정해요.
// - 콘텐츠 카드는 FakeElement(behaviors/ui-sdk-dom 어댑터) — measureInWindow
//   (비동기)로 채운 rect 캐시를 동기 읽기처럼 제공하고, 계산 결과(style·attr
//   쓰기)는 observer 훅으로 React 상태에 반영해요. rect는 개방 시 고유 측정
//   크기를 유지합니다(--available-* 로 줄어든 시각 크기를 되먹이면 available이
//   0으로 붕괴 — §7 P3 실측 함정).
// - 스크롤 추종: RN에는 전역 스크롤 이벤트가 없어(기존 useReposition도
//   네이티브 no-op) followIntervalMs 주기로 앵커를 다시 측정해 rect 캐시를
//   제자리 갱신(updateRect)한다 — rAF 루프가 나머지를 따라간다. 매 프레임
//   measureInWindow(브리지 왕복)는 비용이 커 폴링으로 근사했어요. 기본 200ms는
//   설계값(기기 실측 아님 — 증거 문서 참조), 0 이하로 끌 수 있어요.
// - 측정 좌표 시맨틱(PR #31 리뷰 F-1 정정): 브리지 measureInWindow는 RN
//   instance.measure 위임이라 콜백의 앞 4인자 x,y는 부모 뷰 기준 상대 좌표,
//   5·6번째 pageX,pageY가 창 기준 절대 좌표(getBoundingClientRect 시맨틱)예요.
//   FakeRect는 pageX/pageY로 채운다. P3 스파이크(apps/expo/app/uisdk-popup.tsx)
//   는 RN el.measureInWindow를 직접 호출해 앞 4인자가 이미 창 좌표였다 —
//   브리지 경유로 시맨틱이 달라지는 점이 결함의 근원이었어요.
import { measureInWindow } from "@unikit-bridge/ui/primitives";
import type { InstallUiSdkOverlayPositionOptions } from "./types";

import {
  FakeElement,
  installDomStubs,
  pxToNumber,
  rectFrom,
  updateRect,
  type FakeRect,
} from "../../behaviors/ui-sdk-dom";
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

/** ref 객체({current}) 또는 요소 값을 브리지 측정 대상으로 해석한다. */
function elementOf(ref: unknown): unknown {
  return ref && typeof ref === "object" && "current" in (ref as Record<string, unknown>)
    ? (ref as { current: unknown }).current
    : ref;
}

/** 브리지 measureInWindow(비동기) 측정 — 요소 없으면 즉시 null. 창 좌표는
 *  콜백 5·6번째 pageX,pageY(머리 주석 «측정 좌표 시맨틱» 참조. 4인자 스텁
 *  대비 x,y로의 nullish 폴백 유지). */
function measureElement(
  ref: unknown,
  callback: (rect: FakeRect | null) => void,
): void {
  const el = elementOf(ref);
  if (!el) {
    callback(null);
    return;
  }
  measureInWindow(el, (x, y, width, height, pageX, pageY) => {
    callback(
      rectFrom(pageX ?? x ?? 0, pageY ?? y ?? 0, width ?? 0, height ?? 0),
    );
  });
}

/** 마지막 통보와 달라진 경우만 setState가 일어나게 하는 직렬화 키. */
function stateKey(state: OverlayPositionState | null): string {
  return state
    ? `${state.left},${state.top},${state.placement},${state.maxWidth},${state.maxHeight}`
    : "";
}

/** position()이 data-side에 기록하는 물리 면 4종(OverlayPlacement와 같은 집합). */
const SIDES: readonly OverlayPlacement[] = ["top", "bottom", "left", "right"];

// 공개 옵션 계약 — web.ts와 같은 이름·같은 본문으로 재노출(정의는 플랫폼
// 비의존 공용 파일 ./types — 양쪽 조건이 같은 타입에 닿게).
export type { InstallUiSdkOverlayPositionOptions } from "./types";

/**
 * ui-sdk position() 엔진을 오버레이 배치 엔진으로 등록한다(앱 부트 1회).
 * DOM 스텁(installDomStubs — 멤버 단위 패치, 멱등)도 함께 설치한다.
 * 되돌리기는 setOverlayPositionEngine(null)(아래 재노출).
 */
export function installUiSdkOverlayPosition(
  options: InstallUiSdkOverlayPositionOptions = {},
): void {
  const followIntervalMs = options.followIntervalMs ?? 200;
  installDomStubs();
  setOverlayPositionEngine({
    attach({ anchorRef, contentRef, getOptions, onPlace }) {
      let stopped = false;
      let syncQueued = false;
      let lastKey = "";
      let stopPosition: (() => void) | null = null;
      let followTimer: ReturnType<typeof setInterval> | null = null;
      const anchorRectRef: { current: FakeRect | null } = { current: null };
      let popupEl: FakeElement | null = null;
      let contentRect: FakeRect | null = null;

      // style·attr 쓰기 → (rAF로 묶은) 스냅샷 통보. 프레임당 1회.
      const scheduleSync = () => {
        if (syncQueued || stopped || !popupEl) return;
        syncQueued = true;
        requestAnimationFrame(() => {
          syncQueued = false;
          const el = popupEl;
          if (stopped || !el) return;
          const left = pxToNumber(el.style.left);
          const top = pxToNumber(el.style.top);
          if (left === null || top === null) return; // 아직 첫 계산 전
          const side = el.getAttribute("data-side");
          const next: OverlayPositionState = {
            left,
            top,
            placement: SIDES.includes(side as OverlayPlacement)
              ? (side as OverlayPlacement)
              : getOptions().placement,
            maxWidth: pxToNumber(el.style.getPropertyValue("--available-width")),
            maxHeight: pxToNumber(el.style.getPropertyValue("--available-height")),
          };
          const key = stateKey(next);
          if (key === lastKey) return;
          lastKey = key;
          onPlace(next);
        });
      };

      // 스크롤 추종 근사 — 주기 재측정으로 rect 캐시를 제자리 갱신.
      const remeasureAnchor = () => {
        measureElement(anchorRef, (rect) => {
          if (rect && anchorRectRef.current) {
            updateRect(
              anchorRectRef.current,
              rect.x,
              rect.y,
              rect.width,
              rect.height,
            );
          }
        });
      };

      // 앵커·콘텐츠 측정이 둘 다 도착하면 엔진을 시작한다(측정은 비동기).
      const begin = () => {
        if (stopped || !anchorRectRef.current || !contentRect) return;
        // rect는 개방 시 고유 크기 — 이후 시각 max와 분리(§7 되먹임 함정).
        popupEl = new FakeElement("overlay-content", contentRect);
        popupEl.style.observer = scheduleSync;
        popupEl.attrObserver = scheduleSync;
        stopPosition = position(
          // VirtualAnchor getter — getBoundingClientRect 형태여야 unwatched
          // 경로로 rAF가 상시 유지된다(plain {x,y}는 stillFrames 후 멈춤).
          () => ({
            getBoundingClientRect: () =>
              anchorRectRef.current ?? rectFrom(0, 0, 0, 0),
          }),
          popupEl as unknown as HTMLElement,
          // 옵션 getter — 열린 채 side/align/offset 변경이 다음 체크에 반영.
          () => {
            const { placement, align, offset } = getOptions();
            return { side: placement, align, sideOffset: offset };
          },
        );
        scheduleSync();
        if (followIntervalMs > 0) {
          followTimer = setInterval(remeasureAnchor, followIntervalMs);
        }
      };

      measureElement(anchorRef, (rect) => {
        if (stopped || !rect) return;
        anchorRectRef.current = rect;
        begin();
      });
      measureElement(contentRef, (rect) => {
        if (stopped || !rect) return;
        contentRect = rect;
        begin();
      });

      return {
        stop() {
          stopped = true;
          if (followTimer) clearInterval(followTimer);
          stopPosition?.();
          popupEl = null;
          anchorRectRef.current = null;
          contentRect = null;
        },
      };
    },
  });
}
