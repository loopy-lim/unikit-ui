// Direction — shadcn/ui（new-york-v4） direction.tsx 유니버설 포팅 （사이클 40, T-3c）.
// 원본: shadcn-ref/ui/direction.tsx — radix-ui Direction 모듈의 DirectionProvider
// useDirection을 재노출하는 래퍼.
//
// 포팅 판단（원본 대비 차이）:
// - radix-ui 의존 제거 — 순수 React 컨텍스트로 동일 API를 직접 구현한다.
//   원본（및 radix） DirectionProvider는 DOM 요소를 렌더하지 않는 컨텍스트 전용
//   컴포넌트라, 구조를 그대로 옮기면 플랫폼 API를 전혀 쓰지 않는다 — 웹네이티브
//   동일 동작이라 별도 폴백 분기가 불필요하다.
// - 원본이 허용하는 dir/direction 두 프로퍼티（direction이 우선）와 useDirection
//   시맨틱（localDir 우선 → 컨텍스트 값 → "ltr" 폴백, radix 기본값）을 유지한다.
// - 실제 화면 방향 적용은 이 프로바이더의 책임이 아니다（원본과 동일）: 웹은 소비
//   앱이 <html dir>이나 래퍼 요소의 dir 속성으로 지정하고, 네이티브는 OS 로캘
//   I18nManager가 정한다. 브리지 ViewProps에 dir 속성 계약이 없어 컴포넌트에서
//   임의 전달도 하지 않는다（추가 필요 — 향후 브리지 확장 과제）. 방향 감지가
//   필요한 컴포넌트（tabscarousel 등）와 앱은 useDirection로 값을 읽는다.
// - refforwardRef가 없는 것도 원본 그대로다（호스트 요소가 없음）. 함수 컴포넌트라
//   함수명이 곧 displayName 역할을 한다.
// - 원본의 "use client" 지시문은 저장소 관행（브리지 패키지 소스를 소비 앱
//   런타임이 직접 컴파일）에 따라 제거했다.
import { createContext, useContext } from "react";
import type { ReactNode } from "react";

/** 문서 쓰기 방향 — radix-ui Direction 타입 대응（순수 유니언으로 재정의） */
export type Direction = "ltr" | "rtl";

const DirectionContext = createContext<Direction | undefined>(undefined);

export type DirectionProviderProps = {
  /** 쓸 방향（기본 "ltr" — radix 기본값） */
  dir?: Direction;
  /** dir의 별칭（원본 래퍼가 허용, dir보다 우선） */
  direction?: Direction;
  children?: ReactNode;
};

function DirectionProvider({
  dir,
  direction,
  children,
}: DirectionProviderProps) {
  return (
    <DirectionContext.Provider value={direction ?? dir ?? "ltr"}>
      {children}
    </DirectionContext.Provider>
  );
}

/** 현재 쓰기 방향 읽기 — localDir > 프로바이더 값 > "ltr"（radix 시맨틱 유지） */
function useDirection(localDir?: Direction): Direction {
  const contextDir = useContext(DirectionContext);
  return localDir ?? contextDir ?? "ltr";
}

export { DirectionProvider, useDirection };
