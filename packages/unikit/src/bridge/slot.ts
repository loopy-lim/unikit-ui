/**
 * Slot — radix Slot(asChild) 상당의 prop 병합 프리미티브（잔여 RN 갭 감사 후속）.
 *
 * 배치 판단: cloneElement·Children·forwardRef만 쓰는 순수 React라 플랫폼 API가
 * 전혀 없어 web.tsx·native.tsx 양 진입점이 이 단일 구현을 그대로 재노출한다
 * （motion-registry 공유 모듈 패턴과 동일 — 플랫폼 분기는 컴포넌트가 아니라
 * 패키지 exports 조건이 담당한다는 원칙의 적용）. 병합 계약(규칙·제약)의 단일
 * 출처는 bridge/types.ts SlotProps 주석.
 *
 * 원본(@radix-ui/react-slot, node_modules 실측) 대비 차이:
 * - Slottable(복수 children 배열 재배치)·lazy 컴포넌트 언래핑은 미지원 —
 *   소비처(트리거 asChild)는 단일 요소 children만 필요로 한다(Subtract Before
 *   You Add). 단일 요소가 아니면 원본 관례대로 명확한 에러를 던진다.
 * - className 병합은 원본 join 대신 cn(clsx + tailwind-merge) — 충돌 토큰을
 *   자식 클래스가 이기도록 정리한다(원본 join 순서와 같은 방향).
 * - 그 외 규칙(핸들러 자식 먼저·style 자식 우선·일반 prop 자식 우선·ref 합성·
 *   aria-describedby 목록 병합·빈 children 무렌더)은 원본 구현을 따른다.
 * - 리뷰 후속(2026-11-27): useComposedRefs는 조건 반환 이전에 항상 호출된다
 *   (훅 규칙 — children 토글 시 훅 수 불일치 크래시 방지), refs를 deps로 두어
 *   ref 스왑을 전파하고 콜백 ref의 React 19 cleanup 반환값을 모아 되돌린다.
 *   style 병합은 RN 스타일 배열을 평탄화해 합친다(웹 객체 가정 확장).
 */
import {
  Fragment,
  Children,
  cloneElement,
  forwardRef,
  isValidElement,
  useCallback,
  useRef,
  type ReactElement,
  type ReactNode,
} from "react";

import { cn } from "../lib/utils";
import type { SlotProps } from "./types";

type AnyProps = Record<string, unknown>;

function setRef(ref: unknown, node: unknown): void {
  if (typeof ref === "function") ref(node);
  else if (ref != null) (ref as { current: unknown }).current = node;
}

/**
 * slot에 온 ref와 자식 요소의 기존 ref를 한 노드에 동시 연결한다.
 * radix 관례(composeRefs 1.1.5)와 같이 refs를 deps로 둔다 — ref 식별이 바뀌면
 * React가 기존 콜백을 null로 해제하고 새 콜백을 부착해 ref 스왑이 전파된다.
 * 콜백 ref별로 cleanup 반환 여부를 기록해(React 19), 해제 시 cleanup을 반환한
 * ref는 그 cleanup을 실행하고 나머지는 ref(null)로 분리한다 — cleanup을 반환한
 * ref에 null 호출이 가지 않는 React 19 규칙을 지킨다. cleanup이 실제로
 * React에 닿는 것은 브리지 프리미티브의 setRef가 반환값을 전달할 때다(웹 —
 * 리뷰 후속 수정).
 */
function useComposedRefs(...refs: unknown[]) {
  const cleanupsRef = useRef<Array<() => void>>([]);
  return useCallback(
    (node: unknown) => {
      const previous = cleanupsRef.current;
      cleanupsRef.current = [];
      if (node == null) {
        refs.forEach((ref, i) => {
          const cleanup = previous[i];
          if (cleanup) cleanup();
          else setRef(ref, node);
        });
        return undefined;
      }
      cleanupsRef.current = refs.map((ref) => {
        if (typeof ref !== "function") {
          setRef(ref, node);
          return () => setRef(ref, null);
        }
        const cleanup = (ref as (n: unknown) => unknown)(node);
        return typeof cleanup === "function"
          ? (cleanup as () => void)
          : () => (ref as (n: unknown) => void)(null);
      });
      return undefined;
    },
    refs,
  );
}

/**
 * 자식 요소의 ref를 React 18/19 양쪽에서 무경고로 읽는다(radix getElementRef
 * 등가). React 18은 ref를 element.ref에, React 19는 props.ref에 둔다 — 반대쪽
 * 접근은 dev 경고 getter라 descriptor로 판별해 안전한 쪽을 고른다.
 * （React 19 타입은 element.ref를 공개 타입에서 제거했다 — 런타임 값 읽기는
 *   구조 캐스트로만 한다.）
 */
function getElementRef(element: ReactElement): unknown {
  let getter = Object.getOwnPropertyDescriptor(element.props, "ref")?.get;
  if (
    getter &&
    (getter as { isReactWarning?: boolean }).isReactWarning
  ) {
    return (element as { ref?: unknown }).ref;
  }
  getter = Object.getOwnPropertyDescriptor(element, "ref")?.get;
  if (
    getter &&
    (getter as { isReactWarning?: boolean }).isReactWarning
  ) {
    return (element.props as { ref?: unknown }).ref;
  }
  return (element.props as { ref?: unknown }).ref || (element as { ref?: unknown }).ref;
}

/** aria-describedby 양쪽 id 목록 병합 — 원본 radix concatAriaDescribedby 등가. */
function concatAriaDescribedby(...values: unknown[]): string | undefined {
  const ids = new Set<string>();
  for (const value of values) {
    if (typeof value !== "string") continue;
    for (const id of value.trim().split(/\s+/)) {
      if (id) ids.add(id);
    }
  }
  return ids.size > 0 ? Array.from(ids).join(" ") : undefined;
}

/** RN 스타일 배열(중첩 포함)을 객체로 평탄화 — 미정·빈 값은 undefined. */
function flattenStyle(style: unknown): AnyProps | undefined {
  if (!style) return undefined;
  if (Array.isArray(style)) {
    const merged: AnyProps = {};
    for (const item of style)
      Object.assign(merged, flattenStyle(item) ?? {});
    return merged;
  }
  return style as AnyProps;
}

/** style 병합 — 양쪽을 평탄화해 자식 키가 이긴다(원본과 같은 방향). */
function mergeStyles(slotValue: unknown, childValue: unknown): AnyProps | undefined {
  const slotStyle = flattenStyle(slotValue);
  const childStyle = flattenStyle(childValue);
  if (!slotStyle && !childStyle) return undefined;
  return { ...slotStyle, ...childStyle };
}

/**
 * slot prop을 자식 prop에 병합한다 — 원본 radix mergeProps와 같은 방향:
 * 자식 prop을 바탕으로 두고(plain prop은 자식이 이긴다), 자식이 가진 키에
 * 대해서만 className·style·on[A-Z]*·aria-describedby를 합성 규칙으로 덮는다.
 * slot에만 있는 키(nativeID·aria-expanded 등)는 자식에 그대로 흐른다.
 */
function mergeSlotProps(slotProps: AnyProps, childProps: AnyProps): AnyProps {
  const overrideProps: AnyProps = { ...childProps };
  for (const propName of Object.keys(childProps)) {
    const slotPropValue = slotProps[propName];
    const childPropValue = childProps[propName];
    if (/^on[A-Z]/.test(propName)) {
      if (typeof slotPropValue === "function" && typeof childPropValue === "function") {
        overrideProps[propName] = (...args: unknown[]) => {
          const result = (childPropValue as (...a: unknown[]) => unknown)(...args);
          (slotPropValue as (...a: unknown[]) => unknown)(...args);
          return result;
        };
      } else if (typeof slotPropValue === "function") {
        overrideProps[propName] = slotPropValue;
      }
    } else if (propName === "style") {
      overrideProps[propName] = mergeStyles(slotPropValue, childPropValue);
    } else if (propName === "className") {
      overrideProps[propName] = cn(
        slotPropValue as string | undefined,
        childPropValue as string | undefined,
      );
    } else if (propName === "aria-describedby") {
      overrideProps[propName] = concatAriaDescribedby(childPropValue, slotPropValue);
    }
  }
  return { ...slotProps, ...overrideProps };
}

const Slot = forwardRef<unknown, SlotProps>((props, forwardedRef) => {
  const { children, ...slotProps } = props;
  const child =
    Children.count(children) === 1 && isValidElement(children)
      ? children
      : null;
  const childRef = child !== null ? getElementRef(child) : undefined;
  // 훅은 조건 반환·throw 이전에 항상 호출한다(React 훅 규칙 — children이
  // 비었을 때 조기 반환해도 훅 수가 일치해야 한다).
  const composedRef = useComposedRefs(forwardedRef, childRef);
  // radix 관례 — children이 비면(null·undefined·false·빈 문자열) 아무것도
  // 렌더하지 않고 조용히 돌아간다. 그 외(숫자 0 포함) 단일 요소가 아니면
  // 명확한 에러로 요구를 알린다.
  if (!children && children !== 0) return children as ReactNode;
  if (child === null) {
    throw new Error(
      "Slot은 정확히 하나의 React 요소 children을 받아야 합니다(문자열·여러 요소는 지원하지 않습니다).",
    );
  }

  const childProps = (child.props ?? {}) as AnyProps;
  const mergedProps = mergeSlotProps(slotProps as AnyProps, childProps);
  // Fragment는 ref를 받을 수 없다 — prop 병합만 하고 ref 합성은 생략한다(원본 동일).
  if (child.type !== Fragment) {
    mergedProps.ref = forwardedRef != null ? composedRef : childRef;
  }
  return cloneElement(child, mergedProps as Partial<AnyProps>);
});
Slot.displayName = "Slot";

export { Slot };
