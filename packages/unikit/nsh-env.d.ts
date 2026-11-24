/**
 * "nsh"·"nsh:rt" 런타임 모듈의 최소 타입 선언 — 이 저장소의 tsc(--noEmit)
 * 전용이다. 소비 앱에는 절대 함께 가지 않는다(아래 원칙 참조).
 *
 * 원칙:
 *   ambient "nsh" 선언은 앱의 실제 "nsh" 타입(.nsh/types 경로 매핑)을 가린다
 *   (2026-11 실측 — mount 미발견 오류). 소비 앱은 dist/nsh-types의 사전 빌드
 *   .d.ts가 "nsh"을 값 위치로 임포트해 앱의 경로 매핑 타입을 그대로 소진한다.
 * - "nsh:rt"는 앱에 타입이 없어서(2026-11 실측 — TS2307) 이 패키지가 계약을
 *   제공한다. nsh가 스스로 타입을 배포하면 이 선언을 제거한다(로드맵).
 * - 계약의 근거는 longbridge/nsh 0.6.1 소스(crates/nsh-js/src/dom.rs
 *   RT_EXPORTS 테이블)와 헤드리스 실측(apps/nsh App.test.tsx)이다.
 */
declare module "nsh" {
  /** 앱이 쓰는 색 스킴 전환 — nsh setColorScheme("light"|"dark"|"system"). */
  export function setColorScheme(scheme: "light" | "dark" | "system"): void;
  /** 디자인 토큰 해석 — 테마의 색(#rrggbbaa)·길이·폰트. 반응형. 실패 시 throw. */
  export function token(name: string): string | number | null;
  /** 창 크기(포인트) 접근자. */
  export const windowSize: () => { width: number; height: number };
  /** 화면 크기(포인트) 접근자. */
  export const screenSize: () => { width: number; height: number };
  /** 사용자 텍스트 배율 접근자. */
  export const fontScale: () => number;
  /** 기기 픽셀 비율 접근자. */
  export const pixelRatio: () => number;
  /** 플랫폼 정보 — os는 BridgePlatformOS와 같은 어휘. */
  export const platform: { os: "ios" | "android" | "macos" | "windows" | "linux" | "web" };
  /** SVG 경로 데이터 문자열로 만드는 캔버스 패스(nsh canvas의 stroke 인자). */
  export declare class Path2D {
    constructor(path?: string | Path2D);
  }
  /** 시스템 공유 시트 — BridgeShare 계약으로 감싼다(bridge/nsh.tsx). */
  export const Share: {
    show(content: {
      text?: string;
      url?: string;
      title?: string;
    }): Promise<{ action: "shared" | "dismissed"; target: string | null }>;
  };
}

declare module "nsh:rt" {
  /** nsh 호스트 뷰 노드 — ViewRef(Rust 핸들). focus·measure 등 최소 멤버만. */
  export interface NshNode {
    focus(): void;
    blur(): void;
    measure(): Promise<
      | {
          bounds: { x: number; y: number; width: number; height: number };
          pagePosition: { x: number; y: number };
        }
      | null
    >;
    animateLayout(transition?: unknown): void;
    scrollTo(options: { x?: number; y?: number; animated?: boolean }): void;
  }
  /** 호스트 태그 뷰를 만든다(Tag::from_name — "view"·"text"·"input"·…). */
  export function element(name: string): NshNode;
  /** 텍스트 노드를 만든다(내용은 생성 시에만 정해진다 — 갱신은 노드 교체). */
  export function text(content: string): NshNode;
  /** 자식을 부모 끝에 넣는다. 이미 부모가 있으면 이동한다(제거에도 쓴다). */
  export function append(parent: NshNode, child: NshNode): void;
  /** 자식을 `before` 앞에 넣는다(이미 부모가 있으면 이동). */
  export function insert(parent: NshNode, child: NshNode, before: NshNode): void;
  /** 노드의 prop 하나를 즉시 설정한다(class·onPress·role 등 호스트 prop명).
   * `draw`는 예외다 — element에는 없고 nsh/canvas의 Canvas 컴포넌트가 소비한다. */
  export function prop(node: NshNode, name: string, value: unknown): void;
  /** 등록된 nsh 컴포넌트를 props로 호출해 노드를 만든다 — Canvas 등. */
  export function component(
    comp: (props: Record<string, unknown>) => NshNode,
    props: Record<string, unknown>,
  ): NshNode;
}

declare module "nsh/canvas" {
  import type { NshNode } from "nsh:rt";
  /** 2D 컨텍스트 뷰 — `draw`가 그림을 기록해 네이티브가 재생한다. */
  export function Canvas(props: {
    draw: (cx: unknown, size: { width: number; height: number }) => void;
    class?: string;
    style?: Record<string, unknown>;
    accessibilityElementsHidden?: boolean;
    testID?: string;
  }): NshNode;
}

/**
 * react-reconciler(0.34 — 번들 인라인)의 우리가 쓰는 면. 상위 @types는
 * react 19 후기 reconciler 시그니처(0.46)를 요구해 0.34와 맞지 않는다 —
 * 실측으로 검증한 8인자 createContainer·flushSync 계약을 직접 선언한다.
 */
declare module "react-reconciler" {
  export interface NshFiberRoot {
    updateContainer(
      children: unknown,
      root: NshFiberRoot,
      parentComponent: unknown,
      callback: (() => void) | null,
    ): void;
  }
  export interface NshReconciler {
    createContainer(
      containerInfo: unknown,
      tag: number,
      hydrationCallbacks: unknown,
      isStrictMode: boolean,
      concurrentUpdatesByDefaultOverride: unknown,
      identifierPrefix: string,
      onUncaughtError: (error: unknown) => void,
      onCaughtError: unknown,
    ): NshFiberRoot;
    updateContainer(
      element: unknown,
      root: NshFiberRoot,
      parentComponent: unknown,
      callback: (() => void) | null,
    ): void;
    /** 0.34의 보류 작업 동기 배수 — 공개 flushSync는 react-dom 소유라 없다. */
    flushSyncWork?(): void;
  }
  /** 호스트 설정 — 멤버 구조는 renderer.ts의 구현이 유일한 진실. */
  export default function createReconciler(hostConfig: unknown): NshReconciler;
}

declare module "nsh" {
  /** 앱 진입 — 컴포넌트(엘리먼트를 반환하는 함수)를 화면에 올린다. */
  export function mount(app: (props: unknown) => unknown): () => void;
  /** 2D 컨텍스트 뷰(nsh/canvas 소스가 nsh로 병합된 export — 실측).
   * 소비 앱의 .nsh/types는 정식 CanvasProps를 갖는다(저장소 내 타입체크용 최소면). */
  export function Canvas(props: {
    draw: (cx: unknown, size: { width: number; height: number }) => void;
    class?: string;
    style?: Record<string, unknown>;
    accessibilityElementsHidden?: boolean;
    testID?: string;
  }): import("nsh:rt").NshNode;
}
