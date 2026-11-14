// Accordion — shadcn/ui（new-york-v4） accordion.tsx 유니버설 포팅 （사이클 30, T-3b）.
// 원본: shadcn-ref/ui/accordion.tsx — radix Accordion 엔진을 제거하고
// 전개 상태는 React state + context로 직접 관리한다（collapsible.tsx의 다중 항목
// 확장 구조）. 원본의 data-state·셀렉터 클래스는 조건부 클래스·아이콘 회전으로 전개.
//
// 포팅 판단（원본 대비 차이）:
// - ChevronDownIcon은 브리지 lucide 아이콘 프리미티브를 쓰고 open 시 rotate-180
//   회전（원본 ［&［data-state=open］>svg］:rotate-180의 조건부 클래스 전개）.
// - 트리거 focus 링은 원본 규격（ring-3 · ring-ring/50 · 무오프셋 ·
//   focus-visible:border-ring）을 web: 접두로 준수한다（사이클 72）.
// - 항목 구분선의 마지막 항목 제외（last 변형）는 위치 셀렉터라 네이티브 재현 불가
//   — 제거. 마지막 항목 하단선 제거는 사용처 className 오버라이드로 한다.
// - 콘텐츠 전이 애니메이션 미지원 — value 일치 시에만 마운트（즉시 전환）.
//   원본의 이중 뷰（애니메이션용 바깥쪽 + 패딩 안쪽）는 애니메이션 상실로 한 벌로
//   통합하고 사용처 className은 같은 패딩 토큰 위에 병합된다.
// - single 모드의 collapsible은 기본 true（shadcn 관용 — 원본 radix 기본값은 false）.
// - aria-controls ↔ 콘텐츠 nativeID를 루트 useId 토대로 결정적으로 연결한다.
import {
  Children,
  createContext,
  forwardRef,
  useCallback,
  useContext,
  useId,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import {
  animateLayout,
  ChevronDownIcon,
  Pressable,
  Text,
  View,
  type BridgePressableRef,
  type BridgeViewRef,
  type PressableProps,
  type ViewProps,
} from "@unikit-bridge/ui/primitives";

import { cn } from "../lib/utils";

type AccordionContextValue = {
  type: "single" | "multiple";
  collapsible: boolean;
  openItems: string[];
  toggleItem: (value: string) => void;
  /** 트리거 aria-controls ↔ 콘텐츠 nativeID 연결용 토대 ID */
  baseId: string;
};

const AccordionContext = createContext<AccordionContextValue | null>(null);

function useAccordionContext(component: string): AccordionContextValue {
  const ctx = useContext(AccordionContext);
  if (!ctx) {
    throw new Error(`<${component}>는 <Accordion> 안에서 사용해야 합니다.`);
  }
  return ctx;
}

type AccordionItemContextValue = {
  value: string;
  open: boolean;
  toggle: () => void;
  contentId: string;
};

const AccordionItemContext = createContext<AccordionItemContextValue | null>(
  null,
);

function useAccordionItemContext(
  component: string,
): AccordionItemContextValue {
  const ctx = useContext(AccordionItemContext);
  if (!ctx) {
    throw new Error(`<${component}>는 <AccordionItem> 안에서 사용해야 합니다.`);
  }
  return ctx;
}

// 콘텐츠 패널 ID — value의 공백은 ID에 쓸 수 없어 치환.
function contentIdOf(baseId: string, value: string) {
  return `${baseId}-accordion-content-${value.replace(/\s+/g, "-")}`;
}

function toItems(value: string | string[] | undefined): string[] {
  if (value === undefined) return [];
  return Array.isArray(value) ? value : [value];
}

export type AccordionProps = ViewProps & {
  type?: "single" | "multiple";
  /** single 모드에서 펼친 항목 다시 접기 허용 여부（기본 true — shadcn 관용） */
  collapsible?: boolean;
  /** single 모드에서는 문자열 1개, multiple 모드에서는 펼친 value 배열 */
  value?: string | string[];
  defaultValue?: string | string[];
  onValueChange?: (value: string | string[]) => void;
};

const Accordion = forwardRef<BridgeViewRef, AccordionProps>(
  (
    { type = "single", collapsible = true, value, defaultValue, onValueChange, children, ...props },
    ref,
  ) => {
    // 비제어 상태 — 제어（value 지정）면 무시된다.
    const [internalItems, setInternalItems] = useState(() =>
      toItems(defaultValue),
    );
    const openItems = value !== undefined ? toItems(value) : internalItems;
    const openItemsRef = useRef(openItems);
    openItemsRef.current = openItems;
    const toggleItem = useCallback(
      (itemValue: string) => {
        animateLayout();
        const currentItems = openItemsRef.current;
        const isOpen = currentItems.includes(itemValue);
        let next: string[];
        if (isOpen) {
          // single 비접이형（collapsible=false）은 마지막 펼침 항목을 유지한다.
          if (type === "single" && !collapsible) return;
          next = currentItems.filter((v) => v !== itemValue);
        } else {
          next =
            type === "single"
              ? [itemValue]
              : [...currentItems, itemValue];
        }
        if (value === undefined) setInternalItems(next);
        if (type === "single") onValueChange?.(next[0] ?? "");
        else onValueChange?.(next);
      },
      [type, collapsible, value, onValueChange],
    );
    const baseId = useId();
    const contextValue = useMemo(
      () => ({ type, collapsible, openItems, toggleItem, baseId }),
      [type, collapsible, openItems, toggleItem, baseId],
    );
    return (
      <AccordionContext.Provider value={contextValue}>
        <View ref={ref} {...props}>
          {children}
        </View>
      </AccordionContext.Provider>
    );
  },
);
Accordion.displayName = "Accordion";

export type AccordionItemProps = ViewProps & {
  value: string;
};

const AccordionItem = forwardRef<BridgeViewRef, AccordionItemProps>(
  ({ value, className, children, ...props }, ref) => {
    const accordion = useAccordionContext("AccordionItem");
    const open = accordion.openItems.includes(value);
    const toggle = useCallback(
      () => accordion.toggleItem(value),
      [accordion.toggleItem, value],
    );
    const contentId = contentIdOf(accordion.baseId, value);
    const itemContextValue = useMemo(
      () => ({ value, open, toggle, contentId }),
      [value, open, toggle, contentId],
    );
    return (
      <AccordionItemContext.Provider value={itemContextValue}>
        <View
          ref={ref}
          className={cn("border-b border-border", className)}
          {...props}
        >
          {children}
        </View>
      </AccordionItemContext.Provider>
    );
  },
);
AccordionItem.displayName = "AccordionItem";

export type AccordionTriggerProps = PressableProps & {
  // 함수형 children은 내부 Text 래핑 구조와 양립하지 않아 문자열 children 권장.
  children?: ReactNode;
};

const AccordionTrigger = forwardRef<BridgePressableRef, AccordionTriggerProps>(
  ({ className, children, disabled, onPress, ...props }, ref) => {
    const item = useAccordionItemContext("AccordionTrigger");
    const content =
      typeof children === "string" || typeof children === "number" ? (
        <Text className="flex-1 font-sans text-left text-sm font-medium text-foreground web:hover:underline">
          {children}
        </Text>
      ) : (
        <View className="flex-1 flex-row items-center gap-2">
          {Children.map(children, (child) =>
            typeof child === "string" || typeof child === "number" ? (
              <Text className="font-sans text-left text-sm font-medium text-foreground web:hover:underline">
                {child}
              </Text>
            ) : (
              child
            ),
          )}
        </View>
      );
    return (
      <Pressable
        ref={ref}
        accessibilityRole="button"
        aria-expanded={item.open}
        aria-controls={item.contentId}
        disabled={disabled}
        onPress={() => {
          item.toggle();
          onPress?.();
        }}
        className={cn(
          "flex-row items-center justify-between gap-4 rounded-md py-4 web:transition-all",
          "web:focus-visible:border-ring web:focus-visible:ring-3 web:focus-visible:ring-ring/50",
          disabled && "web:pointer-events-none opacity-50",
          className,
        )}
        {...props}
      >
        {/* 이중 지정: 전경색·밑줄은 내부 Text에（네이티브는 색 상속 불가） */}
        {content}
        <ChevronDownIcon
          className={cn(
            "size-4 shrink-0 text-muted-foreground transition-transform duration-200",
            item.open && "rotate-180",
          )}
        />
      </Pressable>
    );
  },
);
AccordionTrigger.displayName = "AccordionTrigger";

export type AccordionContentProps = ViewProps;

const AccordionContent = forwardRef<BridgeViewRef, AccordionContentProps>(
  ({ className, children, nativeID, ...props }, ref) => {
    const item = useAccordionItemContext("AccordionContent");
    // 펼침 항목만 렌더 — 마운트/언마운트 방식（애니메이션 없음）.
    if (!item.open) return null;
    return (
      <View
        ref={ref}
        nativeID={nativeID ?? item.contentId}
        className={cn("overflow-hidden pb-4 pt-0", className)}
        {...props}
      >
        {children}
      </View>
    );
  },
);
AccordionContent.displayName = "AccordionContent";

export { Accordion, AccordionItem, AccordionTrigger, AccordionContent };
