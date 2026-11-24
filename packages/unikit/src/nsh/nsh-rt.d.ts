/**
 * "nsh:rt"·"react-reconciler"의 최소 타입 선언 — 소비 앱에 함께 간다(이 둘은
 * 앱에 타입이 없다 — 2026-11 실측 TS2307; 상위 @types는 시그니처가 안 맞는다).
 * 충돌이 없는 이유: 앱의 "nsh" 타입(.nsh/types 경로 매핑)과 별개 모듈명이고,
 * nsh:rt·react-reconciler는 앱이 스스로 임포트하지 않는다.
 *
 * 계약의 근거는 longbridge/nsh 0.6.1 소스(crates/nsh-js/src/dom.rs RT_EXPORTS
 * 테이블)와 헤드리스 실측(apps/nsh App.test.tsx)이다.
 */
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
