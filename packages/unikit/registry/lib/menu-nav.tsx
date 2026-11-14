// 메뉴 카드 키보드 탐색 공유 골격（사이클 90, T-7）.
//
// 설계（dropdown-menu·context-menu·select 공용）:
// - 항목은 전부 브리지 Pressable（웹 <button>）이라 DOM 포커스를 옮기는 방식의
//   루빙 탐색이다 — 별도 하이라이트 상태 기계 없이 기존 web:focus-visible 토큰과
//   브라우저 기본 동작（엔터 선택·스크롤 따라가기）을 그대로 얻는다.
// - 카드（Content）가 useMenuNav로 컨트롤러를 만들어 MenuNavContext.Provider로
//   항목에 내려주고, 항목은 useMenuItemRef로 자기 노드를 등록한다. 등록 순서＝
//   마운트 순서＝탐색 순서다.
// - 키 계약: ArrowDown/ArrowUp（양 끝 루프）, Home/End, ArrowRight（SubTrigger만 —
//   서브메뉴 개방, 개방 후 첫 항목 포커스는 AnchoredOverlay 포커스 이동이 담당）.
//   ArrowLeft（서브 닫기）는 서브 카드 쪽 조합 핸들러가 담당한다.
// - 타입어헤드(사이클 90 후속): 수정자 없는 1글자 키 입력은 항목 텍스트로 점프한다
//   （radix Menu getNextMatch 이식 — 반복 글자 순환, 버퍼 1초 초기화, disabled 제외）.
// - 현재 항목은 키 입력 시점에 document.activeElement로 해석한다（웹） — 포탈 안
//   useEffect에서의 프로그래매틱 focus가 React onFocus(reportFocus)를 발화시키지
//   않는 경우가 있어(사이클 90 실증) 이벤트 등록에 의존하지 않는다.
//   currentRef(reportFocus)는 네이티브 폴백이다.
// - 처리한 키는 preventDefault + stopPropagation한다 — 서브 카드는 포탈로 렌더되지만
//   React 합성 이벤트는 React 트리를 따라 루트 카드까지 버블링되어 2중 처리가
//   생긴다（menu-nav은 이를 끊는다）.
// - 웹 전용: 네이티브 View는 onKeyDown을 폐기한다（브리지 계약 문서화 한계）.
//   항목 등록·포커스 보고 자체는 무해해 네이티브에서도 수행된다.
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

// ---------------------------------------------------------------------------
// 컨트롤러 — 카드（Content）가 소유
// ---------------------------------------------------------------------------

export type MenuNavContextValue = {
  /** 항목 노드 등록/해제（null이면 해제） — 마운트 순서가 탐색 순서다 */
  registerItem: (
    id: string,
    node: BridgePressableRef | null,
    openSub?: () => void,
  ) => void;
  /** 항목 포커스 보고 — 현재 위치 추적（마우스·탭 포커스도 갱신된다） */
  reportFocus: (id: string) => void;
  /** 카드 onKeyDown — 처리한 키는 preventDefault·stopPropagation한다 */
  handleKeyDown: (event: BridgeKeyEvent) => void;
};

const MenuNavContext = createContext<MenuNavContextValue | null>(null);

/** 항목 소비 — 카드 밖（nav 없음）에서도 항목이 무리 없이 동작하게 null 허용 */
export function useMenuNavContext(): MenuNavContextValue | null {
  return useContext(MenuNavContext);
}

// ---------------------------------------------------------------------------
// 타입어헤드 매칭 — radix Menu 원본 이식(getNextMatch)
// ---------------------------------------------------------------------------

/** 배열을 startIndex 기준으로 자기 자신에게 감는다 — 현재 매치 «앞쪽부터» 찾기용. */
function wrapArray<T>(array: T[], startIndex: number): T[] {
  return array.map((_, index) => array[(startIndex + index) % array.length]!);
}

/**
 * radix Menu의 타입어헤드 매칭 원본 로직（packages/react/menu/src/menu.tsx
 * getNextMatch — 주석 포함 의도 요약）:
 * - 같은 글자 반복("aa")은 한 글자("a")와 같게 정규화 — 반복 입력으로 시작
 *   항목들을 순환한다.
 * - 값 배열을 현재 매치 기준으로 감아 항상 앞쪽부터 찾는다.
 * - 정규화 검색어가 한 글자면 현재 매치를 후보에서 제외 — 그대로 두면 매번
 *   자기 자신이 먼저 매치돼 포커스가 절대 움직이지 않는다.
 */
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
  const orderRef = useRef<string[]>([]);
  const currentRef = useRef<string | null>(null);
  // 타입어헤드 버퍼(사이클 90 후속) — 누적 검색어와 1초 초기화 타이머.
  // 원본 radix는 카드 언마운트로 리셋되지만 여기선 컨트롤러가 카드 마운트보다
  // 오래 살아, 첫 항목 등록 시점(=카드 (재)개방)에 버퍼를 비운다(근사).
  const searchRef = useRef("");
  const searchTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const registerItem = useCallback(
    (id: string, node: BridgePressableRef | null, openSub?: () => void) => {
      if (node) {
        if (orderRef.current.length === 0) searchRef.current = "";
        if (!orderRef.current.includes(id)) orderRef.current.push(id);
        nodesRef.current.set(id, node);
        if (openSub) subsRef.current.set(id, openSub);
      } else {
        orderRef.current = orderRef.current.filter((entry) => entry !== id);
        nodesRef.current.delete(id);
        subsRef.current.delete(id);
        if (currentRef.current === id) currentRef.current = null;
      }
    },
    [],
  );

  const reportFocus = useCallback((id: string) => {
    currentRef.current = id;
  }, []);

  // 키 입력 시점의 현재 항목 — 웹에서는 document.activeElement로 해석한다.
  // 포탈 안 useEffect에서의 프로그래매틱 focus는 React onFocus(→reportFocus)를
  // 발화시키지 않는 경우가 있어(사이클 90 실증 — 서브 개방 시 첫 항목 ArrowDown이
  // 멈춰 있었다) focus 이벤트 등록에 의존하지 않는다. currentRef는 네이티브
  // (activeElement 없음)와 폴백용으로 유지한다.
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

  const focusAt = useCallback((index: number, direction: 1 | -1 = 1) => {
    const order = orderRef.current;
    if (order.length === 0) return;
    let wrapped = ((index % order.length) + order.length) % order.length;
    // disabled 항목은 브라우저가 포커스를 거부한다 — 원본처럼 한 번의 키에
    // 건너뛴다(포커스 실패 후 currentRef를 옮기지 않는 것도 이것이 이유).
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

  // 타입어헤드 검색（사이클 90 후속） — 항목 텍스트는 등록 노드의 textContent
  // （원본 textValue 기본 전략과 동일）. disabled 항목은 후보에서 제외한다.
  // 매칭 포커스는 keydown 중 명령형 focus의 React 배칭 문제를 피하려 원본처럼
  // setTimeout으로 다음 태스크에 뺀다.
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
      // 버퍼는 마지막 입력 1초 뒤 초기화(원본값) — 새 입력마다 타이머를 재작성.
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
  // 타이머 해제 — 컨트롤러 언마운트 의무(재스케줄 방지).
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
      // 타입어헤드 — 수정자 없는 1글자 키는 글자 검색으로 흘린다(원본 게이트와
      // 동일: ctrl·alt·meta 눌림이나 여러 글자 키는 제외). preventDefault는
      // 하지 않는다(원본도 글자 키의 기본 동작을 막지 않는다).
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
          focusAt(currentIndex < 0 ? order.length - 1 : currentIndex - 1, -1);
          break;
        case "Home":
          event.preventDefault();
          event.stopPropagation?.();
          focusAt(0);
          break;
        case "End":
          event.preventDefault();
          event.stopPropagation?.();
          // 끝 항목이 disabled면 그 앞으로 건너뛴다(-1 — 뒤 방향 스킵.
          // 기본 +1이면 목록 끝에서 한 바퀴 돌아 첫 항목으로 가버린다 — G4).
          focusAt(order.length - 1, -1);
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
      }
    },
    [focusAt, resolveCurrentId, handleTypeaheadSearch],
  );

  return useMemo<MenuNavContextValue>(
    () => ({ registerItem, reportFocus, handleKeyDown }),
    [registerItem, reportFocus, handleKeyDown],
  );
}

/** 카드 키다운과 소비자 onKeyDown을 한 핸들러로 합성한다（선행 처리 후 통과） */
export function composeMenuNavKeyDown(
  nav: MenuNavContextValue,
  onKeyDown?: (event: BridgeKeyEvent) => void,
) {
  return (event: BridgeKeyEvent) => {
    nav.handleKeyDown(event);
    onKeyDown?.(event);
  };
}

// ---------------------------------------------------------------------------
// 항목 조합 — Item·CheckboxItem·RadioItem·SubTrigger가 소비
// ---------------------------------------------------------------------------

/**
 * 항목용 ref 조합 — 탐색 등록과 외부 forwardRef를 한 (안정) 콜백으로 합친다.
 * openSub는 SubTrigger만 전달한다（ArrowRight 개방）. 콜백 안정성을 위해
 * openSub도 안정 식별자여야 한다（dropdown Sub의 scheduleOpen 등）.
 */
export function useMenuItemRef(
  ref: ForwardedRef<BridgePressableRef>,
  openSub?: () => void,
): {
  id: string;
  attach: (node: BridgePressableRef | null) => void;
  /** 자기 노드 — onHoverIn 포커스 이동(composeMenuItemHoverIn)용 */
  nodeRef: MutableRefObject<BridgePressableRef | null>;
} {
  const nav = useMenuNavContext();
  const id = useId();
  const nodeRef = useRef<BridgePressableRef | null>(null);
  const attach = useCallback(
    (node: BridgePressableRef | null) => {
      nodeRef.current = node;
      nav?.registerItem(id, node, openSub);
      if (typeof ref === "function") ref(node);
      else if (ref) ref.current = node;
    },
    [nav, id, openSub],
  );
  return { id, attach, nodeRef };
}

/** 항목 onHoverIn 조합 — 포인터 진입 항목으로 포커스를 옮긴다.
 *  radix Menu은 항목 pointerenter 시 항목으로 포커스를 옮긴다(포인터 하이라이트와
 *  DOM 포커스가 일치한다). 이것이 없으면 hover로 서브를 열어 둔 채 다른 항목을
 *  가리킨 뒤 Enter를 눌렀을 때 포커스가 머문 옛 항목이 활성화된다(사이클 90). */
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

/** 항목 onFocus 조합 — 현재 위치 보고 후 소비자 콜백 통과 */
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
