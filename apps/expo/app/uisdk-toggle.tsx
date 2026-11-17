// 스파이크 화면 — 층2 definePrimitive/parts 렌더러의 RN 어댑터 실증용.
// docs/sdd/issue-17-layer2-rn-renderer-spike.md 증거. 이슈 #17.
//
// 시험하는 것(@ui-sdk/core 0.1.0-beta.6 고정 — bun.lock 실측):
// 1. `@ui-sdk/core/toggle`(공개 @stable)의 상태 기계가 RN에서 인스턴스·파트
//    계약으로 살아 움직이는가 — pressed 전환·onPressedChange 콜백·disabled 억제.
// 2. `@ui-sdk/core/renderer`(exports 맵에는 있으나 «프레임워크 렌더러 전용·
//    공개 API 없음» 선언 — 비공개 경계)의 심볼 10종(attrs·handlers·present·
//    partState·subscribe·commit·ref·keep·release·unwatched)만으로 파트
//    렌더러가 성립하는가. @ui-sdk/react(react-dom 전제)는 쓰지 않아요.
// 3. DOM 속성 번역표 — 웹 use-primitive가 하는 번역(class→className·
//    tabindex·이벤트)의 RN 판: role/state→accessibility props, click→onPress
//    합성 이벤트, data-*→시각 소비.
//
// 계약 메모(실측, 상세는 issue-17 문서):
// - 토글 root가 요소에 요구하는 실측 멤버는 3개(tagName·isConnected·
//   parentElement[지연])에 렌더러 계약 방어 2(addEventListener/
//   removeEventListener) — 전역 스텁(installDomStubs) 불필요.
//   단 bun 프로브(프로세스에 MutationObserver 없음)는 기기를 대체하지
//   않아요: RN 0.88 런타임에는 내장 MutationObserver가 있어 커널 followId가
//   동작하다 계약 충돌로 죽어요(아래 마스킹 메모 — docs/sdd/100 §7 교훈 재현).
// - 웹은 native <button>이 접근성 역할을 대신하지만 RN Pressable는 View라,
//   렌더러가 인스턴스 상태의 element("button")에서 accessibilityRole을
//   합성해요. 바인딩 전(element "unknown")에는 aria-disabled가 내려오고
//   바인딩 후에는 네이티브 disabled 속성으로 대체되는 웹 계약도 그대로
//   흐러요(번역표가 둘 다 disabled로 옮겨요).
// - aria-pressed에 대응하는 RN 접근성 상태가 없어요(aria-checked·selected·
//   expanded만 있음, react-native 0.88.1 타입 실측). 번역 목적지를 RN 직접이
//   아니라 브리지 계약(aria-* 관용 별칭 — «네이티브는 시각 상태로만 반영»,
//   bridge/types.ts 선례)으로 잡아요.
// - keydown/keyup(Space/Enter 활성화)은 하드웨어 키보드 전용이라 이 스파이크는
//   click(onPress) 경로만 구동해요(키 이벤트 벽 — docs/sdd/100 §7, 이슈 #19).
import * as React from "react";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Pressable, Text, View } from "@unikit-bridge/ui/primitives";

import { toggle } from "@ui-sdk/core/toggle";
import {
  attrs,
  commit,
  handlers,
  keep,
  partState,
  present,
  ref,
  release,
  subscribe,
  unwatched,
} from "@ui-sdk/core/renderer";

/** 토글 root가 실제로 읽는 요소 멤버만 갖춘 가짜 요소(프록시 실측: tagName·
 *  isConnected 즉시 읽힘·parentElement는 watchFieldsets의 마이크로태스크에서
 *  지연 읽힘). addEventListener/removeEventListener 쌍은 실측상 미호출이지만
 *  렌더러 계약의 방어예요 — bind()는 host.attaches에 없는 이벤트 종류를
 *  on(el, …)으로 요소에 직접 붙이는 경로가 있어요(커널 part.js bind). */
class FakeToggleElement {
  isConnected = false;
  // buttonElement(el): tagName "BUTTON" → matches("a[href]") 분기 미도달.
  // watchFieldsets: isConnected false → queueMicrotask → parentElement
  // undefined → 비활성 fieldset 없음. api.internal.join: standalone은
  // 스코프 없어 no-op.
  tagName = "BUTTON";
  parentElement: FakeToggleElement | undefined = undefined;
  addEventListener() {}
  removeEventListener() {}
}

/** bind(part, el, host)가 비-attaches 이벤트를 요소에 직접 붙이지 않게 하는
 *  프레임워크 렌더러 선언 — 웹 use-primitive와 같은 모양. */
const host = {
  by: "framework",
  attaches: ["click", "keydown", "keyup"],
} as const;

type Attrs = Record<string, string | undefined>;

/** DOM attrs → 브리지 props 번역표 — 이 스파이크의 본체(층2 어댑터 최소형).
 *  번역 목적지는 RN 직접이 아니라 브리지 계약(bridge/types.ts aria-* 관용
 *  별칭 — Pressable은 aria-*를 네이티브 상태로 병합)이에요. aria-pressed는
 *  브리지 선례대로 «네이티브는 시각 상태로만 반영»이에요(bridge/types.ts
 *  실측 — RN에 pressed 접근성 상태가 없다는 간극은 브리지가 이미 기록). */
function toRnProps(a: Attrs, element: string) {
  const pressed = a["aria-pressed"] === "true";
  const disabled = a["aria-disabled"] === "true" || a.disabled !== undefined;
  // 웹은 native <button>(element "button")이 역할을 대신하고 role attr은
  // undefined로 내려와요. RN Pressable는 View라 렌더러가 역할을 합성.
  const role = a.role ?? (element === "button" ? "button" : undefined);
  return {
    accessibilityRole: role as "button" | undefined,
    "aria-pressed": pressed,
    "aria-disabled": disabled || undefined,
    disabled: disabled || undefined,
    className: a.class,
  };
}

type ToggleOptions = {
  defaultPressed?: boolean;
  disabled?: boolean;
  onPressedChange?: (pressed: boolean) => void;
};

/**
 * 최소 RN 파트 렌더더 — 웹 usePrimitive/usePart의 수명·구독·번역을 RN으로
 * 재구성한 것. 인스턴스 수명은 웹 구현(unwatched 생성 → keep → 해제 시
 * release·destroy)을, 재렌더는 store 구독으로 간략화했어요(웹의 읽은 키
 * 좁은 구독 최적화는 이 스파이크 범위 밖).
 */
function useSdkToggleRoot(options: ToggleOptions) {
  const id = `ui-sdk-${React.useId()}`;
  const [instance] = React.useState(() =>
    unwatched(() => toggle({ ...options, controller: undefined, id })),
  );
  React.useLayoutEffect(() => keep(instance), [instance]);
  React.useLayoutEffect(() => {
    instance.setOptions({ ...options, id });
  });
  React.useEffect(
    () => () => {
      release(instance);
      instance.destroy();
    },
    [instance],
  );

  const part = instance.part("root", {}, true);
  const [, rerender] = React.useReducer((count: number) => count + 1, 0);
  React.useLayoutEffect(() => {
    commit(part, {});
    return subscribe(part, rerender);
  }, [part]);

  const bindElement = React.useMemo(() => ref(part, host), [part]);
  React.useLayoutEffect(() => {
    // 기기 실측 발견: RN 0.88은 자체 MutationObserver(react-native/src/
    // private/webapis — childList 전용·대상은 ReactNativeElement 전용·
    // attributeFilter 미지원 예외)를 내장해요. ui-sdk 커널의 followId는
    // attributeFilter ["id"] 관찰을 써서 이 폴리필과 계약이 안 맞으므로,
    // 바인딩 동안만 전역을 마스킹해 followId를 건너뛰게 해요(id 전파는
    // 웹 전용 계약 — RN 렌더러가 id를 소유하지 않음. 문서 §2 기록).
    const g = globalThis as Record<string, unknown>;
    const saved = g.MutationObserver;
    g.MutationObserver = undefined;
    try {
      bindElement(new FakeToggleElement() as unknown as HTMLElement);
    } finally {
      g.MutationObserver = saved;
    }
    return () => bindElement(null);
  }, [bindElement]);

  const state = instance.get();
  const showing = present(part, {}, state);
  const domAttrs = attrs(part, {}, state) as Attrs;
  // 파트 상태 계약: root 슬롯이 선언한 상태만 돌아와요({pressed, disabled}).
  // element(역할 합성용)는 인스턴스 전체 상태에서 읽어요.
  const snapshot = partState(part, {}, state) as {
    pressed: boolean;
    disabled: boolean;
  };
  const element = (state as { element: string }).element;
  const events = handlers(part);
  const rnProps = toRnProps(domAttrs, element);
  // 합성 이벤트 — core 핸들러는 defaultPrevented·preventDefault만 읽어요.
  // renderer의 타입 계약은 DOM Event라 캐스트를 감수(비공개 경계 마찰 기록).
  const onPress = () => {
    const event = { defaultPrevented: false } as {
      defaultPrevented: boolean;
      preventDefault(): void;
    };
    event.preventDefault = () => {
      event.defaultPrevented = true;
    };
    events.click?.(event as unknown as Event);
  };
  return { showing, domAttrs, snapshot, rnProps, onPress };
}

function ToggleRow({
  label,
  options,
  onLog,
}: {
  label: string;
  options: ToggleOptions;
  onLog: (line: string) => void;
}) {
  const root = useSdkToggleRoot({
    ...options,
    onPressedChange: (pressed) => {
      onLog(`${label} onPressedChange(${pressed})`);
    },
  });
  if (!root.showing) return null;
  const pressed = root.snapshot.pressed;
  return (
    <View className="gap-1">
      <Pressable
        accessibilityLabel={label}
        className={`h-12 flex-row items-center justify-center rounded-xl border px-4 ${
          pressed
            ? "border-primary bg-primary"
            : "border-border bg-background"
        }`}
        disabled={root.rnProps.disabled}
        accessibilityRole={root.rnProps.accessibilityRole}
        aria-pressed={root.rnProps["aria-pressed"]}
        aria-disabled={root.rnProps["aria-disabled"]}
        onPress={root.onPress}
      >
        <Text
          className={`font-sans text-sm font-semibold ${
            pressed ? "text-primary-foreground" : "text-foreground"
          }`}
        >
          {label} — {pressed ? "pressed" : "idle"}
        </Text>
      </Pressable>
      <Text className="font-sans text-xs leading-4 text-muted-foreground">
        attrs: {JSON.stringify(root.domAttrs)}
      </Text>
    </View>
  );
}

export default function UisdkToggle() {
  const insets = useSafeAreaInsets();
  const [log, setLog] = React.useState<string[]>([]);
  const pushLog = React.useCallback((line: string) => {
    setLog((prev) => [line, ...prev].slice(0, 4));
  }, []);

  return (
    <View
      className="flex-1 bg-background gap-4 px-6"
      style={{ paddingTop: insets.top + 20, paddingBottom: insets.bottom + 24 }}
    >
      <Text className="font-sans text-xl font-bold tracking-tight text-foreground">
        층2 parts 렌더러 — toggle RN 스파이크
      </Text>
      <Text className="font-sans text-sm leading-5 text-foreground">
        @ui-sdk/core/toggle의 상태 기계를 renderer 심볼 10종으로 구동해요.
        눌러 보세요 — pressed 전환·콜백이 아래에 기록돼요.
      </Text>
      <ToggleRow label="기본 토글" options={{ defaultPressed: false }} onLog={pushLog} />
      <ToggleRow label="초기 pressed 토글" options={{ defaultPressed: true }} onLog={pushLog} />
      <ToggleRow
        label="비활성 토글"
        options={{ defaultPressed: false, disabled: true }}
        onLog={pushLog}
      />
      <View className="gap-1">
        <Text className="font-sans text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          onPressedChange 기록
        </Text>
        {log.length === 0 ? (
          <Text className="font-sans text-sm text-muted-foreground">
            (아직 이벤트 없음)
          </Text>
        ) : (
          log.map((line, i) => (
            <Text key={`${line}-${i}`} className="font-sans text-sm leading-5 text-foreground">
              {line}
            </Text>
          ))
        )}
      </View>
    </View>
  );
}
