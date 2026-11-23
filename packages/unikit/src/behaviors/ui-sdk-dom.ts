// @unikit-bridge/ui/behaviors/ui-sdk-dom 진입점 — ui-sdk DOM 계약 어댑터
// (P2·P3 슬라이스, 사이클 101, docs/sdd/100 §7). npm 전용(배럴·registry
// 미등록)이고 네이티브 전용이에요(react-native의 Dimensions를 import — 웹
// 소비자는 이 진입점을 쓰지 않아요). 이슈 #14 제품화: apps/expo/
// uisdk-adapter.ts 스파이크를 그대로 이관(본문은 기기 실증 원본 보존).
// @ui-sdk/core 팝업 계열 행동이 요구하는 DOM 표면(요소 10멤버 + 전역 6종 —
// 2026-11-17 계약 프로브 실측, 결과는 docs/sdd/100 §7에 기록)을 RN 데이터로
// 채우는 얇은 어댑터예요.
//
// 원리: position()은 rect를 레이아웃 중 동기 읽기가 아니라 호출 시점·이벤트
// 구동(rAF 루프) 안에서 주문형으로 읽어요. 따라서 measureInWindow(비동기)로
// 채운 rect 캐시를 FakeElement가 동기 읽기처럼 돌려주면 JNI·TurboModule 없이
// 성립해요(§7 «동기 + 어댑터 패턴» 최소 증명). 스크롤 추종 등 정밀도가
// 필요해지면 TurboModule 동기 측정이 업그레이드 경로예요.
//
// v1 한계 개선(P3 확장, 2026-11-17): position()은 VirtualAnchor(노드가 아닌
// {getBoundingClientRect}·{x,y} 앵커 — 공식 @stable 계약)를 만나면 rAF 루프를
// 닫지 않고 매 프레임 앵커를 다시 읽어요(unwatched 경로). 이 어댑터의
// rect 캐시를 제자리 갱신(updateRect)하면 RN 측정값이 그대로 추종 입력이
// 돼요. 계산 결과(style·attr 쓰기)는 observer 훅으로 화면에 즉시 반영해요.
// 개방 시 1회 계산이 필요하면 여전히 계산 뒤 stop()으로 닫으면 돼요.
import { Dimensions } from "react-native";

import {
  installSdkEventGlobals,
  setSdkViewport,
} from "./ui-sdk-renderer";

/** DOMRect 모양의 사각형 — measureInWindow(x, y, w, h)로 채워요. */
export type FakeRect = {
  x: number;
  y: number;
  width: number;
  height: number;
  top: number;
  left: number;
  right: number;
  bottom: number;
};

export function rectFrom(x: number, y: number, width: number, height: number): FakeRect {
  return {
    x,
    y,
    width,
    height,
    top: y,
    left: x,
    right: x + width,
    bottom: y + height,
  };
}

/** rect 캐시를 제자리에서 갱신 — 같은 객체를 getter가 계속 읽게 해요(추종 입력). */
export function updateRect(
  rect: FakeRect,
  x: number,
  y: number,
  width: number,
  height: number,
): void {
  rect.x = x;
  rect.y = y;
  rect.width = width;
  rect.height = height;
  rect.top = y;
  rect.left = x;
  rect.right = x + width;
  rect.bottom = y + height;
}

/** "248px" → 248. 계산 결과(style 쓰기)를 RN style 수치로 옮길 때 써요. */
export function pxToNumber(value: unknown): number | null {
  if (typeof value !== "string") return null;
  const n = Number.parseFloat(value);
  return Number.isFinite(n) ? n : null;
}

/**
 * CSSStyleDeclaration 모양 — position()의 계산 결과가 setProperty로 흘러와요.
 * 쓰기 기록 계측(`writes` 링 버퍼·`writeCount`)은 PR #27 사후 리뷰 F-1에서
 * 제품 export에서 제거했어요(sdd/100 «디버그 텔레메트리 경계»: 스파이크 화면이
 * setProperty를 감싸 자체 기록). observer 훅은 제품 계약으로 유지해요.
 */
export class FakeStyle {
  [key: string]: unknown;
  transformOrigin = "0px 0px";
  transform = "none";
  /** 값이 실제로 바뀐 setProperty마다 호출 — 계산 결과를 RN 화면으로 옮기는 훅. */
  observer?: (key: string, value: string) => void;
  setProperty(key: string, value: string) {
    if (this[key] !== value) {
      this.observer?.(key, value);
    }
    this[key] = value;
  }
  getPropertyValue(key: string) {
    return typeof this[key] === "string" ? (this[key] as string) : "";
  }
  removeProperty(key: string) {
    delete this[key];
  }
}

/**
 * 가짜 DOM 요소 — 측정된 rect 캐시를 동기 읽기처럼 제공해요.
 * 프로브가 실측한 position()의 요소 계약 전부(getBoundingClientRect·
 * getClientRects·client{Width,Height}·offset{Width,Height}·setAttribute·
 * style.setProperty·style.transformOrigin)를 갖춰요.
 */
export class FakeElement {
  nodeType = 1;
  isConnected = true;
  tagName: string;
  style = new FakeStyle();
  dataset: Record<string, string> = {};
  attrs: Record<string, string> = {};
  rect: FakeRect;
  constructor(name: string, rect: FakeRect) {
    this.tagName = name.toUpperCase();
    this.rect = rect;
  }
  setAttribute(key: string, value: string) {
    const next = String(value);
    if (this.attrs[key] !== next) {
      this.attrObserver?.(key, next);
    }
    this.attrs[key] = next;
  }
  getAttribute(key: string) {
    return this.attrs[key] ?? null;
  }
  removeAttribute(key: string) {
    if (key in this.attrs) {
      this.attrObserver?.(key, null);
    }
    delete this.attrs[key];
  }
  /** v1은 1회 계산이라 구독을 저장하지 않아요(stop()과 짝이 맞음). */
  addEventListener(_type: string, _handler: unknown, _opts?: unknown) {}
  removeEventListener(_type: string, _handler?: unknown, _opts?: unknown) {}
  scrollTo() {}
  /**
   * attr 쓰기 관찰 훅 — data-side·data-align 등 배치 판정 결과를 화면으로
   * 옮길 때 써요(style.observer와 같은 용도).
   */
  attrObserver?: (key: string, value: string | null) => void;
  /**
   * web처럼 «스타일이 곧 위치»: position()이 style.left/top을 쓰면 이후
   * getBoundingClientRect는 그 값을 현재 위치로 돌려줘요. position()의
   * 원점 계산(box − style.left)이 매 업데이트 일관되게 유지되려면 필수예요
   * — 고정 rect를 돌려주면 추종 중 원점이 누적 드리프트해요.
   */
  getBoundingClientRect() {
    const left = pxToNumber(this.style.left);
    const top = pxToNumber(this.style.top);
    const x = left !== null ? left : this.rect.x;
    const y = top !== null ? top : this.rect.y;
    return {
      x,
      y,
      width: this.rect.width,
      height: this.rect.height,
      top: y,
      left: x,
      right: x + this.rect.width,
      bottom: y + this.rect.height,
      toJSON: () => this.rect,
    };
  }
  getClientRects() {
    return [this.getBoundingClientRect()];
  }
  get clientLeft() {
    return 0;
  }
  get clientTop() {
    return 0;
  }
  get clientWidth() {
    return this.rect.width;
  }
  get clientHeight() {
    return this.rect.height;
  }
  get offsetWidth() {
    return this.rect.width;
  }
  get offsetHeight() {
    return this.rect.height;
  }
}

/**
 * RN에 없는 전역 설치 — 제품 문서·창(ui-sdk-renderer installSdkEventGlobals)
 * 을 깔고 뷰포트 제공자를 Dimensions에 묶어요. 멱등(한 번만 설치).
 *
 * 실측 교훈(2026-11-17 기기 검증): RN에서 window === globalThis라 window는
 * 이미 존재하지만 addEventListener 같은 DOM 멤버가 없어요. 예전엔 멤버별
 * noop을 채웠는데, 그 noop이 곧 «문서 벽»이었어요 — document·window의
 * addEventListener가 아무 일도 하지 않아 커널의 레이어(바깥누름·Escape)·
 * 모달리티·roving 순서가 듣지 못했어요(#19 modality 벽). M2-④⑤⑥
 * (2026-11-23)부터 설치자가 문서·창을 실 이벤트 대상(SdkEventTarget)으로
 * 교체하고, 입력은 dispatchSdkDocumentEvent/dispatchSdkWindowEvent로 들어가요.
 *
 * 요소 표면은 소비자가 고르세요 — SdkElement(useSdkPart) 또는 이 파일의
 * FakeElement(P2/P3 팝업 스파이크 경로). getComputedStyle은 어느 쪽이든
 * 요소 자신의 style을 돌려줘요(position()의 원점 계약 — 빈 객체를 돌려주면
 * style.left가 «절대 좌표»가 아니라 «델타»로 쓰여 팝업이 화면 밖으로
 * 튕겨요, PR #27 사후 리뷰 F-3 실측).
 *
 * documentElement·window 치수는 sdkViewport 제공자가 Dimensions를 live로
 * 읽어 회전·리사이즈를 반영해요(에이전트 진입점의 선행 설치와 같은 싱글턴
 * 문서를 공유해요). RN(Hermes)은 requestAnimationFrame을 이미 제공해요.
 * MutationObserver no-op은 moves.js(watchMoves)가 가드 없이 생성하므로
 * «미존재 시에만» 계속 깔아요.
 *
 * 주의(부작용): 앱 전역에 퍼져요 — 설치는 모듈 스코프에서 한 번.
 */
export function installDomStubs(): void {
  installSdkEventGlobals();
  setSdkViewport(() => Dimensions.get("window"));

  const g = globalThis as Record<string, unknown>;
  if (typeof g.MutationObserver !== "function") {
    g.MutationObserver = class MutationObserver {
      observe() {}
      disconnect() {}
      takeRecords() {
        return [];
      }
    };
  }
}

/**
 * window.visualViewport를 live getter 객체로 교체하고 되돌리는 함수를 돌려줘요.
 *
 * position()은 뷰포트를 visualViewport(offsetLeft·offsetTop·width·height)에서
 * 읽어요(없으면 documentElement 치수로 전체 창). 화면이 «팝업이 살아도 되는
 * 세계»를 알려 주려면(예: 상단 컨트롤 아래 대역 — 웹에서 키보드가 열려
 * visualViewport가 줄어드는 것과 같은 의미) 그 대역을 매 프레임 최신값으로
 * 돌려주는 이 훅으로 교체해요. 플립·클램프·available 판정은 전부 코어가 이
 * 뷰포트 기준으로 내려요(이슈 #12). 되돌림 함수로 화면 언마운트 시 원래대로
 * (null = 전체 창) 복구해 다른 소비 화면에 새는 것을 막아요.
 */
export function bindVisualViewport(
  read: () => { offsetLeft: number; offsetTop: number; width: number; height: number },
): () => void {
  const g = globalThis as Record<string, unknown>;
  const win = (g.window ?? g) as Record<string, unknown>;
  const previous = win.visualViewport;
  win.visualViewport = {
    get offsetLeft() {
      return read().offsetLeft;
    },
    get offsetTop() {
      return read().offsetTop;
    },
    get width() {
      return read().width;
    },
    get height() {
      return read().height;
    },
    // moves.js가 [visualViewport, ["resize","scroll"]]에 addEventListener를
    // 붙여요. null이면 선택 체인으로 건너뛰지만 객체면 메서드가 필요해요.
    addEventListener() {},
    removeEventListener() {},
  };
  return () => {
    win.visualViewport = previous;
  };
}
