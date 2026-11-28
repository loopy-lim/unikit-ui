import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useId,
  useMemo,
  useRef,
  type ForwardedRef,
  type MutableRefObject,
} from "react";
import type {
  BridgeKeyEvent,
  BridgePressableRef,
} from "@unikit-bridge/ui/primitives";

export type MenuNavContextValue = {

  registerItem: (
    id: string,
    node: BridgePressableRef | null,
    openSub?: () => void,
    onActivate?: () => void,
  ) => void;

  reportFocus: (id: string) => void;

  handleKeyDown: (event: BridgeKeyEvent) => void;
};

const SKIP_FORWARD = 1;
const SKIP_BACKWARD = -1;

const MenuNavContext = createContext<MenuNavContextValue | null>(null);

export function useMenuNavContext(): MenuNavContextValue | null {
  return useContext(MenuNavContext);
}

function wrapArray<T>(array: T[], startIndex: number): T[] {
  return array.map((_, index) => array[(startIndex + index) % array.length]!);
}

function getNextMatch(values: string[], search: string, currentMatch?: string): string | undefined {
  const isRepeated = search.length > 1 && Array.from(search).every((char) => char === search[0]);
  const normalizedSearch = isRepeated ? search[0]! : search;
  const currentMatchIndex = currentMatch ? values.indexOf(currentMatch) : -1;
  let wrappedValues = wrapArray(values, Math.max(currentMatchIndex, 0));
  const excludeCurrentMatch = normalizedSearch.length === 1;
  if (excludeCurrentMatch) wrappedValues = wrappedValues.filter((v) => v !== currentMatch);
  const nextMatch = wrappedValues.find((value) =>
    value.toLowerCase().startsWith(normalizedSearch.toLowerCase()),
  );
  return nextMatch !== currentMatch ? nextMatch : undefined;
}

export function useMenuNav(): MenuNavContextValue {
  const nodesRef = useRef(new Map<string, BridgePressableRef>());
  const subsRef = useRef(new Map<string, () => void>());
  const activationsRef = useRef(new Map<string, () => void>());
  const orderRef = useRef<string[]>([]);
  const currentRef = useRef<string | null>(null);

  const searchRef = useRef("");
  const searchTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const registerItem = useCallback(
    (
      id: string,
      node: BridgePressableRef | null,
      openSub?: () => void,
      onActivate?: () => void,
    ) => {
      if (node) {
        if (orderRef.current.length === 0) searchRef.current = "";
        if (!orderRef.current.includes(id)) orderRef.current.push(id);
        nodesRef.current.set(id, node);
        if (openSub) subsRef.current.set(id, openSub);
        else subsRef.current.delete(id);
        if (onActivate) activationsRef.current.set(id, onActivate);
        else activationsRef.current.delete(id);
      } else {
        orderRef.current = orderRef.current.filter((entry) => entry !== id);
        nodesRef.current.delete(id);
        subsRef.current.delete(id);
        activationsRef.current.delete(id);
        if (currentRef.current === id) currentRef.current = null;
      }
    },
    [],
  );

  const reportFocus = useCallback((id: string) => {
    currentRef.current = id;
  }, []);

  const resolveCurrentId = useCallback((): string | null => {
    if (typeof document === "undefined") return null;
    const active = document.activeElement;
    if (!active) return null;
    for (const [id, node] of nodesRef.current) {
      if (node === active) return id;
    }
    for (const [id, node] of nodesRef.current) {
      if (
        typeof (node as HTMLElement).contains === "function" &&
        (node as HTMLElement).contains(active as Node)
      ) {
        return id;
      }
    }
    return null;
  }, []);

  const focusAt = useCallback((index: number, direction: 1 | -1 = SKIP_FORWARD) => {
    const order = orderRef.current;
    if (order.length === 0) return;
    let wrapped = ((index % order.length) + order.length) % order.length;

    for (let step = 0; step < order.length; step++) {
      const id = order[wrapped]!;
      const node = nodesRef.current.get(id);
      if (node && (node as { disabled?: boolean }).disabled !== true) {
        currentRef.current = id;
        node.focus?.();
        return;
      }
      wrapped = (((wrapped + direction) % order.length) + order.length) % order.length;
    }
  }, []);

  const handleTypeaheadSearch = useCallback(
    (key: string) => {
      const search = searchRef.current + key;
      const order = orderRef.current;
      const items = order
        .map((id) => ({ id, node: nodesRef.current.get(id) }))
        .filter(
          (entry): entry is { id: string; node: BridgePressableRef } =>
            entry.node !== undefined &&
            (entry.node as { disabled?: boolean }).disabled !== true &&
            typeof (entry.node as HTMLElement).textContent === "string",
        );
      if (items.length === 0) return;
      const values = items.map(
        (entry) => ((entry.node as HTMLElement).textContent ?? "").trim(),
      );
      const currentId = resolveCurrentId();
      const currentItem = items.find((entry) => entry.id === currentId);
      const currentMatch =
        currentItem !== undefined
          ? values[items.indexOf(currentItem)]
          : undefined;
      const nextMatch = getNextMatch(values, search, currentMatch);

      searchRef.current = search;
      if (searchTimerRef.current !== null) clearTimeout(searchTimerRef.current);
      if (search !== "") {
        searchTimerRef.current = setTimeout(() => {
          searchRef.current = "";
          searchTimerRef.current = null;
        }, 1000);
      }
      if (nextMatch === undefined) return;
      const nextItem = items.find(
        (entry, index) => values[index] === nextMatch,
      );
      if (!nextItem) return;
      currentRef.current = nextItem.id;
      const node = nextItem.node;
      setTimeout(() => node.focus?.(), 0);
    },
    [resolveCurrentId],
  );

  useEffect(
    () => () => {
      if (searchTimerRef.current !== null) clearTimeout(searchTimerRef.current);
    },
    [],
  );

  const handleKeyDown = useCallback(
    (event: BridgeKeyEvent) => {
      const order = orderRef.current;
      if (order.length === 0) return;

      if (
        event.key.length === 1 &&
        !event.ctrlKey &&
        !event.altKey &&
        !event.metaKey
      ) {
        handleTypeaheadSearch(event.key);
      }
      const current = resolveCurrentId() ?? currentRef.current;
      const currentIndex =
        current !== null ? order.indexOf(current) : -1;
      switch (event.key) {
        case "ArrowDown":
          event.preventDefault();
          event.stopPropagation?.();
          focusAt(currentIndex < 0 ? 0 : currentIndex + 1);
          break;
        case "ArrowUp":
          event.preventDefault();
          event.stopPropagation?.();
          focusAt(currentIndex < 0 ? order.length - 1 : currentIndex - 1, SKIP_BACKWARD);
          break;
        case "Home":
          event.preventDefault();
          event.stopPropagation?.();
          focusAt(0);
          break;
        case "End":
          event.preventDefault();
          event.stopPropagation?.();

          focusAt(order.length - 1, SKIP_BACKWARD);
          break;
        case "ArrowRight": {
          if (current === null) return;
          const openSub = subsRef.current.get(current);
          if (!openSub) return;
          event.preventDefault();
          event.stopPropagation?.();
          openSub();
          break;
        }
        case "Enter":
        case " ": {

          if (typeof document !== "undefined" || current === null) return;
          const activate =
            activationsRef.current.get(current) ?? subsRef.current.get(current);
          if (!activate) return;
          event.preventDefault();
          event.stopPropagation?.();
          activate();
          break;
        }
      }
    },
    [focusAt, resolveCurrentId, handleTypeaheadSearch],
  );

  return useMemo<MenuNavContextValue>(
    () => ({ registerItem, reportFocus, handleKeyDown }),
    [registerItem, reportFocus, handleKeyDown],
  );
}

export function composeMenuNavKeyDown(
  nav: MenuNavContextValue,
  onKeyDown?: (event: BridgeKeyEvent) => void,
) {
  return (event: BridgeKeyEvent) => {
    nav.handleKeyDown(event);
    onKeyDown?.(event);
  };
}

export function useMenuItemRef(
  ref: ForwardedRef<BridgePressableRef>,
  openSub?: () => void,
  onActivate?: () => void,
): {
  id: string;
  attach: (node: BridgePressableRef | null) => void;

  nodeRef: MutableRefObject<BridgePressableRef | null>;
} {
  const nav = useMenuNavContext();
  const id = useId();
  const nodeRef = useRef<BridgePressableRef | null>(null);
  const onActivateRef = useRef(onActivate);
  useEffect(() => {
    onActivateRef.current = onActivate;
  });
  const hasActivate = Boolean(onActivate);
  const invokeActivate = useMemo(
    () => (hasActivate ? () => onActivateRef.current?.() : undefined),
    [hasActivate],
  );
  const attach = useCallback(
    (node: BridgePressableRef | null) => {
      nodeRef.current = node;
      nav?.registerItem(id, node, openSub, invokeActivate);
      if (typeof ref === "function") ref(node);
      else if (ref) ref.current = node;
    },
    [nav, id, openSub, invokeActivate],
  );
  return { id, attach, nodeRef };
}

export function composeMenuItemHoverIn(
  nav: MenuNavContextValue | null,
  id: string,
  nodeRef: MutableRefObject<BridgePressableRef | null>,
  onHoverIn?: () => void,
) {
  return () => {
    if (nav) {
      nav.reportFocus(id);
      const node = nodeRef.current;
      if (node && (node as { disabled?: boolean }).disabled !== true) {
        node.focus?.();
      }
    }
    onHoverIn?.();
  };
}

export function composeMenuItemFocus(
  nav: MenuNavContextValue | null,
  id: string,
  onFocus?: () => void,
) {
  return () => {
    nav?.reportFocus(id);
    onFocus?.();
  };
}

export { MenuNavContext };
