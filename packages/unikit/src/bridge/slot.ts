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

function mergeStyles(slotValue: unknown, childValue: unknown): AnyProps | undefined {
  const slotStyle = flattenStyle(slotValue);
  const childStyle = flattenStyle(childValue);
  if (!slotStyle && !childStyle) return undefined;
  return { ...slotStyle, ...childStyle };
}

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

function isEmptyChildren(children: unknown): boolean {
  return !children && children !== 0;
}

const Slot = forwardRef<unknown, SlotProps>((props, forwardedRef) => {
  const { children, ...slotProps } = props;
  const child =
    Children.count(children) === 1 && isValidElement(children)
      ? children
      : null;
  const childRef = child !== null ? getElementRef(child) : undefined;

  const composedRef = useComposedRefs(forwardedRef, childRef);

  if (isEmptyChildren(children)) return children as ReactNode;
  if (child === null) {
    throw new Error(
      "Slot은 정확히 하나의 React 요소 children을 받아야 합니다(문자열·여러 요소는 지원하지 않습니다).",
    );
  }

  const childProps = (child.props ?? {}) as AnyProps;
  const mergedProps = mergeSlotProps(slotProps as AnyProps, childProps);

  if (child.type !== Fragment) {
    mergedProps.ref = forwardedRef != null ? composedRef : childRef;
  }
  return cloneElement(child, mergedProps as Partial<AnyProps>);
});
Slot.displayName = "Slot";

export { Slot };
