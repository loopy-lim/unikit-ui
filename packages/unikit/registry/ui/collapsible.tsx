// Collapsible — shadcn/ui（new-york-v4） collapsible.tsx 유니버설 포팅 （사이클 30, T-3b）.
// 원본: shadcn-ref/ui/collapsible.tsx — radix Collapsible을 그대로
// 재노출하는 무스타일 래퍼라 이식 결과에도 스타일 토큰이 없다. radix 의존 제거의
// 가장 단순한 예로, 전개 상태（open）를 React state + context로 직접 관리한다.
// （accordion.tsx가 같은 구조의 다중 항목 확장이다.）
//
// 포팅 판단（원본 대비 차이）:
// - 애니메이션（radix data-state 기반 CSS 전이） 미지원 — 열림/닫힘 즉시 전환.
// - 콘텐츠는 open 시에만 마운트한다（마운트/언마운트 방식）.
// - Trigger는 Pressable（웹 button） — 네이티브 Pressable（View 기반）에 문자열
//   children을 직접 두면 RN 런타임이 크래시하므로（"Text strings must be
//   rendered within a <Text> component"） children을 내부 Text로 감싼다（B-1）.
//   문자열 라벨 children 권장（AccordionTrigger와 동일 구조）.
import {
  createContext,
  forwardRef,
  useContext,
  useState,
  type ReactNode,
} from "react";
import {
  animateLayout,
  Pressable,
  Text,
  View,
  type BridgePressableRef,
  type BridgeViewRef,
  type PressableProps,
  type ViewProps,
} from "@unikit-bridge/ui/primitives";

type CollapsibleContextValue = {
  open: boolean;
  toggle: () => void;
};

const CollapsibleContext = createContext<CollapsibleContextValue | null>(null);

function useCollapsibleContext(component: string): CollapsibleContextValue {
  const ctx = useContext(CollapsibleContext);
  if (!ctx) {
    throw new Error(`<${component}>는 <Collapsible> 안에서 사용해야 합니다.`);
  }
  return ctx;
}

export type CollapsibleProps = ViewProps & {
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
};

const Collapsible = forwardRef<BridgeViewRef, CollapsibleProps>(
  ({ open, defaultOpen = false, onOpenChange, children, ...props }, ref) => {
    // 비제어 상태 — 제어（open 지정）면 무시된다.
    const [internalOpen, setInternalOpen] = useState(defaultOpen);
    const isOpen = open ?? internalOpen;
    const setOpen = (next: boolean) => {
      animateLayout();
      if (open === undefined) setInternalOpen(next);
      if (next !== isOpen) onOpenChange?.(next);
    };
    return (
      <CollapsibleContext.Provider
        value={{ open: isOpen, toggle: () => setOpen(!isOpen) }}
      >
        <View ref={ref} {...props}>
          {children}
        </View>
      </CollapsibleContext.Provider>
    );
  },
);
Collapsible.displayName = "Collapsible";

export type CollapsibleTriggerProps = PressableProps & {
  // 함수형 children은 내부 Text 래핑 구조와 양립하지 않아 문자열 children 권장.
  children?: ReactNode;
};

const CollapsibleTrigger = forwardRef<
  BridgePressableRef,
  CollapsibleTriggerProps
>(({ children, onPress, ...props }, ref) => {
  const { open, toggle } = useCollapsibleContext("CollapsibleTrigger");
  return (
    <Pressable
      ref={ref}
      accessibilityRole="button"
      aria-expanded={open}
      onPress={() => {
        toggle();
        onPress?.();
      }}
      {...props}
    >
      {/* 이중 지정: 전경색·타이포그래피는 내부 Text에（네이티브 색 상속 불가） */}
      <Text className="font-sans text-sm font-medium text-foreground">
        {children}
      </Text>
    </Pressable>
  );
});
CollapsibleTrigger.displayName = "CollapsibleTrigger";

export type CollapsibleContentProps = ViewProps;

const CollapsibleContent = forwardRef<BridgeViewRef, CollapsibleContentProps>(
  ({ children, ...props }, ref) => {
    const { open } = useCollapsibleContext("CollapsibleContent");
    // open 시에만 렌더 — 마운트/언마운트 방식（애니메이션 없음）.
    if (!open) return null;
    return (
      <View ref={ref} {...props}>
        {children}
      </View>
    );
  },
);
CollapsibleContent.displayName = "CollapsibleContent";

export { Collapsible, CollapsibleTrigger, CollapsibleContent };
