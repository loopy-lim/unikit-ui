/**
 * React 19 JSX 태그 보강 — 브리지(src/bridge/nsh.tsx)가 내리는 nsh 호스트
 * 태그를 JSX.IntrinsicElements에 넣는다.
 *
 * 모듈 파일이어야 react 타입과 병합된다(증강 규칙): 스크립트 파일의
 * declare module "react"는 node_modules 타입을 통째로 가리므로 쓰면 안 된다.
 * (react 19 타입이 JSX를 React 네임스페이스 아래 두므로 모듈 보강으로 합친다 —
 * declare global은 무시된다.)
 */
import type {} from "react";

declare module "react" {
  namespace JSX {
    /** 브리지(src/bridge/nsh.tsx)가 내리는 nsh 호스트 태그 — React-on-nsh 렌더러
     *  (src/nsh/renderer.ts)가 nsh:rt 노드로 인스턴스화한다. 소비 앱의
     *  JSX(nsh-jsx)에는 이 어휘가 없다(앱은 <View> 등 컴포넌트를 쓴다). */
    interface IntrinsicElements {
      view: Record<string, unknown>;
      text: Record<string, unknown>;
      input: Record<string, unknown>;
      image: Record<string, unknown>;
      scroll: Record<string, unknown>;
      canvas: Record<string, unknown>;
      overlay: Record<string, unknown>;
    }
  }
}
