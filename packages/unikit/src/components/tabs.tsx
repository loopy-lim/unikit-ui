// Tabs — shadcn/ui(new-york-v4) tabs.tsx 유니버설 포팅 (사이클 30, T-3b).
// 원본: shadcn-ref/src/tabs/tabs.tsx — radix Tabs 엔진을 제거하고 선택 상태는
// React state + context로 직접 관리한다. 원본의 data-state·그룹 셀렉터 클래스는
// 네이티브에 data 속성이 없어 재현 불가하므로, 활성 여부에 따른 조건부 클래스
// 문자열로 전개한다(aria-selected는 접근성용으로 계속 지정).
//
// 포팅 판단(원본 대비 차이):
// - orientation(vertical) 미지원 — 세로축 스타일은 전부 그룹 셀렉터 의존이라
//   수평 전용으로 단순화. 루트의 flex·flex-col은 브리지 View 기본 클래스가 제공.
// - 임의값 클래스 금지(디자인 감사 (c))에 따라 원본의 calc 높이·3px 링·3px 리스트
//   패딩을 표준 계단으로 근사한다(링 ring-2, 패딩 p-1). 트리거 높이는 명시하지
//   않고 리스트 고정 높이 h-9와 패딩이 대신 결정한다.
// - line 변형 인디케이터는 원본 가상요소(after) 대신 absolute 인디케이터 View로
//   재현 — 렌더 여부는 리스트 변형 컨텍스트로, 표시는 활성 조건부 opacity로
//   전개한다. 원본은 트리거 바깥 음수 오프셋에 바를 뒀지만 포팅은 트리거
//   하단에 붙인다(네이티브 안전 근사).
// - dark: 변형 토큰은 기존 5종 관행(미사용)에 맞춰 제거.
// - 콘텐츠 전환 애니메이션(높이 전이)·웹 화살표키 탐색은 radix 전용 기능이라
//   미지원 — 로드맵 항목. 콘텐츠는 마운트/언마운트로 즉시 전환한다.
import {
  createContext,
  forwardRef,
  useContext,
  useId,
  useState,
  type ReactNode,
} from "react";
import {
  Pressable,
  Text,
  View,
  type BridgePressableRef,
  type BridgeViewRef,
  type PressableProps,
  type ViewProps,
} from "@unikit-bridge/ui/primitives";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "../lib/utils";

type TabsContextValue = {
  value: string;
  setValue: (value: string) => void;
  /** 트리거 aria-controls ↔ 콘텐츠 nativeID를 결정적으로 연결하기 위한 토대 ID */
  baseId: string;
};

const TabsContext = createContext<TabsContextValue | null>(null);

function useTabsContext(component: string): TabsContextValue {
  const ctx = useContext(TabsContext);
  if (!ctx) {
    throw new Error(`<${component}>는 <Tabs> 안에서 사용해야 합니다.`);
  }
  return ctx;
}

// 트리거(말록)와 콘텐츠(패널)를 잇는 ID — value의 공백은 ID에 쓸 수 없어 치환.
function contentIdOf(baseId: string, value: string) {
  return `${baseId}-tabs-content-${value.replace(/\s+/g, "-")}`;
}

// 리스트 변형 — line 인디케이터 렌더 여부를 트리거가 알 수 있게 전달(원본은
// 그룹 셀렉터로 전달했다). 리스트 밖의 트리거는 default 취급.
type TabsListContextValue = { variant: "default" | "line" | null };
const TabsListContext = createContext<TabsListContextValue>({ variant: null });

export type TabsProps = ViewProps & {
  value?: string;
  defaultValue?: string;
  onValueChange?: (value: string) => void;
};

const Tabs = forwardRef<BridgeViewRef, TabsProps>(
  ({ value, defaultValue, onValueChange, className, children, ...props }, ref) => {
    // 비제어 상태 — 제어(value 지정)면 무시된다.
    const [internalValue, setInternalValue] = useState(defaultValue ?? "");
    const current = value ?? internalValue;
    const setValue = (next: string) => {
      if (value === undefined) setInternalValue(next);
      if (next !== current) onValueChange?.(next);
    };
    const baseId = useId();
    return (
      <TabsContext.Provider value={{ value: current, setValue, baseId }}>
        <View ref={ref} className={cn("gap-2", className)} {...props}>
          {children}
        </View>
      </TabsContext.Provider>
    );
  },
);
Tabs.displayName = "Tabs";

// 리스트 — 원본 base에서 w-fit은 네이티브에 맞추기 위해 self-start(교차축 시작
// 정렬로 내용 폭 수축)로 치환, h-9는 수평 전용 고정값을 받았고 text-muted-foreground
// 는 이중 지정 원칙(컨테이너 글자색 무의미)으로 제거한다.
const tabsListVariants = cva(
  "flex-row self-start items-center justify-center rounded-lg p-1 h-9",
  {
    variants: {
      variant: {
        default: "bg-muted",
        line: "gap-1 bg-transparent rounded-none",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);

export type TabsListProps = ViewProps & VariantProps<typeof tabsListVariants>;

const TabsList = forwardRef<BridgeViewRef, TabsListProps>(
  ({ className, variant, ...props }, ref) => {
    const resolved = variant ?? "default";
    return (
      <TabsListContext.Provider value={{ variant: resolved }}>
        <View
          ref={ref}
          accessibilityRole="tablist"
          className={cn(tabsListVariants({ variant: resolved }), className)}
          {...props}
        />
      </TabsListContext.Provider>
    );
  },
);
TabsList.displayName = "TabsList";

export type TabsTriggerProps = PressableProps & {
  value: string;
  // 함수형 children은 내부 Text 래핑 구조와 양립하지 않아 문자열 children 권장.
  children?: ReactNode;
};

const TabsTrigger = forwardRef<BridgePressableRef, TabsTriggerProps>(
  ({ value, className, children, disabled, onPress, ...props }, ref) => {
    const tabs = useTabsContext("TabsTrigger");
    const list = useContext(TabsListContext);
    const active = tabs.value === value;
    return (
      <Pressable
        ref={ref}
        accessibilityRole="tab"
        aria-selected={active}
        aria-controls={contentIdOf(tabs.baseId, value)}
        disabled={disabled}
        onPress={() => {
          tabs.setValue(value);
          onPress?.();
        }}
        className={cn(
          "relative flex-row flex-1 items-center justify-center gap-1.5 rounded-md border border-transparent px-2 py-1 web:transition-all",
          "web:focus-visible:border-ring web:focus-visible:ring-2 web:focus-visible:ring-ring web:focus-visible:ring-offset-2 web:focus-visible:ring-offset-background",
          // 원본 활성 토큰(bg-background·shadow-sm) — line 변형은 활성 시 배경
          // 없이 인디케이터 바만(원본 line 활성 토큰이 bg-transparent).
          active && list.variant !== "line" && "bg-background web:shadow-sm",
          disabled && "web:pointer-events-none opacity-50",
          className,
        )}
        {...props}
      >
        {/* 이중 지정: 전경색은 내부 Text에(네이티브는 색 상속 불가) */}
        <Text
          className={cn(
            "font-sans text-sm font-medium text-foreground/60 web:whitespace-nowrap web:hover:text-foreground",
            active && "text-foreground",
          )}
        >
          {children}
        </Text>
        {list.variant === "line" && (
          <View
            aria-hidden
            className={cn(
              "absolute inset-x-0 bottom-0 h-0.5 bg-foreground",
              active ? "opacity-100" : "opacity-0",
            )}
          />
        )}
      </Pressable>
    );
  },
);
TabsTrigger.displayName = "TabsTrigger";

export type TabsContentProps = ViewProps & {
  value: string;
};

const TabsContent = forwardRef<BridgeViewRef, TabsContentProps>(
  ({ value, className, children, nativeID, ...props }, ref) => {
    const tabs = useTabsContext("TabsContent");
    // 마운트/언마운트 방식 전환 — 높이 애니메이션은 불가하므로 즉시 전환.
    if (tabs.value !== value) return null;
    return (
      <View
        ref={ref}
        accessibilityRole="tabpanel"
        nativeID={nativeID ?? contentIdOf(tabs.baseId, value)}
        className={cn("flex-1 web:outline-none", className)}
        {...props}
      >
        {children}
      </View>
    );
  },
);
TabsContent.displayName = "TabsContent";

export { Tabs, TabsList, TabsTrigger, TabsContent, tabsListVariants };
