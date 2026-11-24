/**
 * `@unikit-bridge/ui/nsh` 진입점 — nsh(Native Shell) 앱용 사전 번들(dist/nsh.mjs)
 * 의 소스 루트. scripts/build-nsh.ts가 이 파일을 굽는다.
 *
 * - 컴포넌트 62종 + 훅 + Provider는 메인 배럴(src/index.ts)을 그대로 재수출한다
 *  (컴포넌트 소스는 플랫폼 무관 한 벌 — 브리지 조건분기 원칙).
 * - 빌드 시 `@unikit-bridge/ui/primitives` import는 src/bridge/nsh.tsx로 치환돼
 *   번들에 인라인된다(nsh 번들러는 exports `default` 조건만 보므로 조건분기
 *   진입을 쓸 수 없다 — 실측).
 * - 렌더러 진입(el·renderNsh·React 훅 재수출)을 함께 제공해 소비 앱이 이
 *   진입점 하나로 React 트리를 조립·구동한다(React 단일 인스턴스 계약 —
 *   react는 번들에 포함되므로 앱이 react를 따로 import하면 안 된다).
 */
export * from "../index";
// 브리지 프리미티브 면도 함께 — 소비 앱이 View/Text/TextInput 등을 단일
// 진입점에서 쓴다(배럴은 컴포넌트만 담는다 — 웹/네이티브와 같은 구조).
// 아이콘·타입은 배럴과 겹쳐 명시적으로 배럴 쪽을 우선한다(TS2308 해소).
export {
  View,
  Text,
  Pressable,
  TextInput,
  Image,
  Portal,
  ScrollView,
  SectionList,
  Select,
  SelectOption,
  KeyboardAvoidingView,
  Platform,
  Dimensions,
  Share,
  measureInWindow,
  useDrag,
  useDismiss,
  useOverlayFocus,
  useReposition,
  useScrollLock,
  getViewport,
  LoopRotate,
  LoopPulse,
  animateLayout,
} from "../bridge/nsh";
export {
  el,
  mountNsh,
  renderNsh,
  useState,
  useEffect,
  useMemo,
  useCallback,
  useRef,
  createContext,
  useContext,
  useId,
  useLayoutEffect,
  memo,
  forwardRef,
  isValidElement,
  Children,
} from "./renderer";
export type { NshNode } from "nsh:rt";
