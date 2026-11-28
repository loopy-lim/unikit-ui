import {
  Component,
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  useSyncExternalStore,
} from "react";
import {
  NodeResolver,
  ResolvedBinding,
  WritableBinding,
  effect,
  getValue,
  isComponentNode,
  type ComponentNode,
  type NodeAction,
  type Signal,
  type SurfaceModel,
} from "@a2ui/web_core";
import { Text, View } from "@unikit-bridge/ui/primitives";

import { Skeleton } from "../components/skeleton";
import type { A2uiProcessor } from "./runtime";
import type { A2uiCheckState, A2uiViewContext, UnikitA2uiComponent } from "./types";

export const A2uiTextForegroundContext = createContext<string | undefined>(undefined);

export function A2uiTextForeground({ value, children }: { value: string; children: ReactNode }) {
  return (
    <A2uiTextForegroundContext.Provider value={value}>{children}</A2uiTextForegroundContext.Provider>
  );
}

export function useA2uiTextForeground(): string | undefined {
  return useContext(A2uiTextForegroundContext);
}

export function useA2uiSignal<T>(source: Signal<T>): T {
  const subscribe = useCallback(
    (onChange: () => void) => {
      let warmed = false;
      return effect(() => {
        getValue(source);
        if (warmed) onChange();
        warmed = true;
      });
    },
    [source],
  );
  const snapshot = useCallback(() => getValue(source), [source]);
  return useSyncExternalStore(subscribe, snapshot, snapshot);
}

function unwrapProp(value: unknown): unknown {
  return value instanceof ResolvedBinding ? value.value : value;
}

function createViewContext(
  node: ComponentNode<UnikitA2uiComponent>,
  props: Record<string, unknown>,
): A2uiViewContext {
  const read = (name: string): unknown => unwrapProp(props[name]);
  const context: A2uiViewContext = {
    node,
    metadata: getValue(node.metadata) as Record<string, unknown> | undefined,
    text: (name, fallback = "") => {
      const value = read(name);
      if (typeof value === "string") return value;
      if (typeof value === "number" && Number.isFinite(value)) return String(value);
      return fallback;
    },
    number: (name, fallback = 0) => {
      const value = read(name);
      return typeof value === "number" && Number.isFinite(value) ? value : fallback;
    },
    boolean: (name, fallback = false) => {
      const value = read(name);
      return typeof value === "boolean" ? value : fallback;
    },
    stringList: (name) => {
      const value = read(name);
      if (!Array.isArray(value)) return [];
      return value.filter((item): item is string => typeof item === "string");
    },
    value: <T,>(name: string, fallback?: T) => {
      const value = read(name);
      return (value === undefined || value === null ? fallback : value) as T;
    },
    set: (name, next) => {
      const binding = props[name];
      if (binding instanceof WritableBinding) binding.set(next);
    },
    action: (name) => {
      const value = props[name];
      return typeof value === "function" ? (value as NodeAction) : undefined;
    },
    childNode: (name) => {
      const value = read(name);
      return isComponentNode(value) ? (value as ComponentNode<UnikitA2uiComponent>) : undefined;
    },
    childNodes: (name) => {
      const value = read(name);
      if (Array.isArray(value)) {
        return value.filter(isComponentNode) as Array<ComponentNode<UnikitA2uiComponent>>;
      }
      if (isComponentNode(value)) {
        return [value as ComponentNode<UnikitA2uiComponent>];
      }
      return [];
    },
    child: (name) => context.render(context.childNode(name)),
    children: (name = "children") => context.childNodes(name).map((child) => context.render(child)),
    childrenText: (name = "children") =>
      context
        .childNodes(name)
        .map((child) => {
          const value = unwrapProp((getValue(child.props) as Record<string, unknown> | undefined)?.text);
          return typeof value === "string" ? value : "";
        })
        .filter(Boolean)
        .join("\n"),
    render: (target) => (target ? <A2uiNodeView key={target.id} node={target} /> : null),
    weightStyle: () => {
      const weightValue = context.number("weight", 0);
      return weightValue > 0 ? { flexGrow: weightValue } : undefined;
    },
    checks: (): A2uiCheckState => {
      const valid = read("isValid");
      const errors = read("validationErrors");
      if (typeof valid !== "boolean" && !Array.isArray(errors)) return { valid: true, errors: [] };
      return {
        valid: typeof valid === "boolean" ? valid : true,
        errors: Array.isArray(errors)
          ? errors
              .map((item) =>
                typeof item === "string"
                  ? item
                  : item && typeof item === "object" && typeof (item as { message?: unknown }).message === "string"
                    ? (item as { message: string }).message
                    : "",
              )
              .filter(Boolean)
          : [],
      };
    },
  };
  return context;
}

type BoundaryState = { failed: boolean };

class A2uiNodeBoundary extends Component<{ children: ReactNode }, BoundaryState> {
  state: BoundaryState = { failed: false };

  static getDerivedStateFromError(): BoundaryState {
    return { failed: true };
  }

  render(): ReactNode {
    if (this.state.failed) {
      return <A2uiFallbackNote label="이 컴포넌트를 표시할 수 없어요" />;
    }
    return this.props.children;
  }
}

function A2uiFallbackNote({ label }: { label: string }) {
  return (
    <View className="rounded-md border border-border px-3 py-2">
      <Text className="text-sm text-muted-foreground">{label}</Text>
    </View>
  );
}

export function A2uiNodeView({ node }: { node: ComponentNode<UnikitA2uiComponent> }) {
  const props = useA2uiSignal(node.props);
  const state = node.state;
  if (state === "pending") {
    return <Skeleton className="h-4 w-full" />;
  }
  if (state === "cyclic") {
    return <A2uiFallbackNote label={`순환 참조: ${node.componentId}`} />;
  }
  const impl = node.impl as UnikitA2uiComponent | undefined;
  if (state !== "resolved" || !impl) {
    return <A2uiFallbackNote label={`알 수 없는 컴포넌트: ${node.type}`} />;
  }
  return (
    <A2uiNodeBoundary key={node.id}>
      {impl.view(createViewContext(node, props))}
    </A2uiNodeBoundary>
  );
}

export function UnikitA2uiSurface({
  surface,
  pending,
}: {
  surface: SurfaceModel<UnikitA2uiComponent>;
  pending?: ReactNode;
}) {
  const resolver = useMemo(() => new NodeResolver<UnikitA2uiComponent>(surface), [surface]);
  useEffect(() => () => resolver.dispose(), [resolver]);
  const root = useA2uiSignal(resolver.rootNode);
  if (!root) {
    return <>{pending ?? <Skeleton className="h-16 w-full" />}</>;
  }
  return <A2uiNodeView key={root.id} node={root} />;
}

export function useA2uiSurfaces(processor: A2uiProcessor): SurfaceModel<UnikitA2uiComponent>[] {
  const [surfaces, setSurfaces] = useState<Array<SurfaceModel<UnikitA2uiComponent>>>(() =>
    Array.from(processor.surfaces().values()),
  );
  useEffect(() => {
    const update = () => setSurfaces(Array.from(processor.surfaces().values()));
    const created = processor.processor.model.onSurfaceCreated.subscribe(update);
    const deleted = processor.processor.model.onSurfaceDeleted.subscribe(update);
    update();
    return () => {
      created.unsubscribe();
      deleted.unsubscribe();
    };
  }, [processor]);
  return surfaces;
}
