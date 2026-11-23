// M2-④ 키·포커스 유형 참조 화면(에픽 #35 «다 go» 로드맵). #19 «문서 벽»의
// 정체는 문서·창이 noop이라 커널(roving의 focusOn·order.list)이 들을 수
// 없었다는 것이었어요 — installSdkEventGlobals()가 문서·창을 실 이벤트
// 대상으로 깔고 SdkElement.focus()가 가상 포커스 레지스트리
// (document.activeElement)에 기록하면서 roving이 성립해요.
//
// 화면 구성:
//   - tabs 데모 — list + tab 4종(a·b·c·비활성 d) + panel 3종. 화살표·Home/End
//     키가 list 파트 핸들러를 거쳐 포커스(stop)를 옮기고 선택(value)까지
//     이어져요(이유 list-navigation). 탭 press는 이유 item-press.
//   - radio 데모 — roving이 값을 동시에 바꾸는 대조군(ArrowDown → 값·포커스
//     동시 이동, list-navigation).
//
// 키 입력 경로: 화면의 키 패드가 fireSdkEvent로 커널 계약 그대로 발송해요.
// 하드웨어 키보드(DPAD)가 뷰 onKeyDown에 닿는 경로는 #19 스파이크
// (uisdk-keys)가 별도로 다뤄요 — 여기선 커널 계약만.
//
// 기기 실증(2026-11-23, 에뮬레이터 390×844dp, 클린 재시작): tabs ArrowRight →
// tabindex roving(0이 b로)·value b(list-navigation)·activeElement «tab b» ✓,
// ← → value a(list-navigation) ✓, Home → a ✓, End → 비활성 d에 «포커스는
// 이동·활성화는 차단» (커널 계약 — focusables가 전 항목, select가 enabled만)
// ✓, tab press → value b(item-press) ✓, radio ArrowDown → 값·포커스 동시
// 이동(list-navigation) ✓, Metro·logcat 무오류.
//
// 판독 계약(실측): value·stop의 화면 판독은 커널 변경이 마이크로태스크로
// 흐르기 때문에 «다음 렌더»부터 정착해요 — 즉시 판독은 stale(null)이 뜨고
// tabindex·activeElement는 동기라 그 즉시 움직여요. 판독은 지연 후 읽어야 해요.
import * as React from "react";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Pressable, Text, View } from "@unikit-bridge/ui/primitives";

import { tabs } from "@ui-sdk/core/tabs";
import { radioGroup } from "@ui-sdk/core/radio";
import {
  fireSdkEvent,
  installSdkEventGlobals,
  setSdkElementFocusMode,
  useSdkPart,
  useSdkPrimitive,
  type SdkPrimitiveInstance,
} from "@unikit-bridge/ui/behaviors/ui-sdk-renderer";

installSdkEventGlobals();

const TAB_PROPS = [
  { value: "a" },
  { value: "b" },
  { value: "c" },
  { value: "d", disabled: true },
] as const;
const TAB_LABELS: Record<string, string> = { a: "A 탭", b: "B 탭", c: "C 탭", d: "D 탭(비활성)" };
const PANEL_PROPS = [{ value: "a" }, { value: "b" }, { value: "c" }] as const;
const PANEL_LINES: Record<string, string> = {
  a: "A 패널 — 첫 번째 내용",
  b: "B 패널 — 두 번째 내용",
  c: "C 패널 — 세 번째 내용",
};

/** 탭 하나 — 요소를 부모 레지스트리에 등록해요(키 발송의 target·포커스
 *  판독에 써요). 등록은 layout effect(렌더 중 ref 대입은 컴파일러가 소거할
 *  수 있어요 — M2-③ 기기 실측). */
function TabItem({
  instance,
  props,
  label,
  register,
  onPress,
}: {
  instance: SdkPrimitiveInstance;
  props: Record<string, unknown>;
  label: string;
  register: (value: string, element: unknown) => void;
  onPress: (element: unknown, disabled: boolean) => void;
}) {
  const part = useSdkPart(instance, "tab", props);
  React.useLayoutEffect(() => {
    register(String(props.value), part.sdkElement);
    return () => register(String(props.value), null);
  }, [part.sdkElement, props.value, register]);
  if (!part.showing) return null;
  const disabled = part.domAttrs["aria-disabled"] === "true" || props.disabled === true;
  const tabIndex = part.domAttrs.tabindex;
  return (
    <Pressable
      accessibilityLabel={`${label} — tabindex ${String(tabIndex ?? "?")}`}
      className={`h-10 flex-1 items-center justify-center rounded-t-lg border-b-2 ${
        disabled ? "opacity-40" : "active:bg-muted/50"
      }`}
      style={{ borderBottomColor: tabIndex === "0" ? "#f54900" : "transparent" }}
      onPress={() => onPress(part.sdkElement, disabled)}
    >
      <Text className="font-sans text-xs font-semibold text-foreground">{label}</Text>
    </Pressable>
  );
}

function TabsDemo() {
  const [log, setLog] = React.useState<string[]>([]);
  const pushLog = React.useCallback((line: string) => {
    setLog((prev) => [line, ...prev].slice(0, 4));
  }, []);
  const [value, setValue] = React.useState("a");
  const [focusLabel, setFocusLabel] = React.useState("(없음)");

  const elements = React.useRef(new Map<string, unknown>());
  const register = React.useCallback((key: string, element: unknown) => {
    if (element) elements.current.set(key, element);
    else elements.current.delete(key);
  }, []);

  const instance = useSdkPrimitive(tabs, {
    defaultValue: "a",
    onValueChange: (next: string | null, details: { reason: string }) => {
      const value = next ?? "";
      setValue(value);
      pushLog(`onValueChange("${value}") 이유:${details.reason}`);
    },
  });
  const list = useSdkPart(instance, "list");
  const state = () => instance.get() as { value: string; stop: string | null };

  // 포커스 판독 — 가상 레지스트리(document.activeElement)와 등록 요소를
  // 비교해 라벨로 보여요.
  const readFocus = () => {
    const doc = (globalThis as { document?: { activeElement: unknown } }).document;
    const active = doc?.activeElement;
    for (const [key, element] of elements.current) {
      if (element === active) {
        setFocusLabel(`tab ${key}`);
        return;
      }
    }
    setFocusLabel(active ? "(다른 요소)" : "(없음)");
  };

  // 목록 파트 핸들러가 event.target으로 항목을 찾아요 — 현재 stop 탭 요소를
  // target으로 list 요소에 발송(프로브 (11)과 같은 계약).
  const sendKey = (key: string) => {
    const stop = state().stop ?? state().value;
    const target = elements.current.get(stop);
    const listEl = list.sdkElement;
    if (!target || !listEl) return;
    fireSdkEvent(listEl as never, "keydown", { key, target: target as never });
    readFocus();
  };

  const pressTab = (element: unknown, disabled: boolean) => {
    if (!element) return;
    fireSdkEvent(element as never, "click", { detail: 1 });
    if (!disabled) readFocus();
  };

  const panels = PANEL_PROPS.map((props) => (
    <PanelBlock key={props.value} instance={instance} props={props} />
  ));

  return (
    <View className="gap-2">
      <Text className="font-sans text-base font-bold text-foreground">TABS — roving 포커스</Text>
      <View className="flex-row border-b border-border" accessibilityLabel="탭 목록">
        {TAB_PROPS.map((props) => (
          <TabItem
            key={props.value}
            instance={instance}
            props={props}
            label={TAB_LABELS[props.value]}
            register={register}
            onPress={pressTab}
          />
        ))}
      </View>
      {panels.find((node) => node !== null) ?? null}
      <View className="flex-row gap-2" accessibilityLabel="탭 키 패드">
        {[
          ["ArrowLeft", "←"],
          ["ArrowRight", "→"],
          ["Home", "Home"],
          ["End", "End"],
        ].map(([key, label]) => (
          <Pressable
            key={key}
            accessibilityLabel={`탭 ${label} 키`}
            className="h-9 flex-1 items-center justify-center rounded-lg border border-border bg-background active:bg-muted/50"
            onPress={() => sendKey(key)}
          >
            <Text className="font-sans text-xs font-semibold text-foreground">{label}</Text>
          </Pressable>
        ))}
      </View>
      <Text className="font-sans text-xs leading-4 text-muted-foreground">
        value «{state().value}» · stop {state().stop === null ? "null" : `«${state().stop}»`} · 포커스 {focusLabel}
      </Text>
      {log.map((line, i) => (
        <Text key={`${line}-${i}`} className="font-sans text-xs leading-4 text-muted-foreground">
          {line}
        </Text>
      ))}
    </View>
  );
}

function PanelBlock({
  instance,
  props,
}: {
  instance: SdkPrimitiveInstance;
  props: Record<string, unknown>;
}) {
  const part = useSdkPart(instance, "panel", props);
  if (!part.showing) return null;
  return (
    <View className="min-h-12 justify-center rounded-b-lg border border-t-0 border-border bg-muted/30 px-3">
      <Text className="font-sans text-sm text-foreground">{PANEL_LINES[String(props.value)]}</Text>
    </View>
  );
}

const RADIO_PROPS = [
  { value: "a" },
  { value: "b" },
  { value: "c", disabled: true },
] as const;
const RADIO_LABELS: Record<string, string> = { a: "라디오 A", b: "라디오 B", c: "라디오 C(비활성)" };

function RadioItem({
  instance,
  props,
  label,
  register,
}: {
  instance: SdkPrimitiveInstance;
  props: Record<string, unknown>;
  label: string;
  register: (value: string, element: unknown) => void;
}) {
  const part = useSdkPart(instance, "root", props);
  React.useLayoutEffect(() => {
    register(String(props.value), part.sdkElement);
    return () => register(String(props.value), null);
  }, [part.sdkElement, props.value, register]);
  if (!part.showing) return null;
  const checked = part.domAttrs["aria-checked"] === "true" || part.snapshot.checked === true;
  return (
    <Pressable
      accessibilityLabel={label}
      className="h-10 flex-1 items-center justify-center rounded-lg border bg-background active:bg-muted/50"
      style={{ borderColor: checked ? "#f54900" : undefined }}
      onPress={() => {
        if (part.sdkElement) fireSdkEvent(part.sdkElement, "click", { detail: 1 });
      }}
    >
      <Text className="font-sans text-xs font-medium text-foreground">{label}</Text>
    </Pressable>
  );
}

function RadioDemo() {
  const [log, setLog] = React.useState<string[]>([]);
  const pushLog = React.useCallback((line: string) => {
    setLog((prev) => [line, ...prev].slice(0, 3));
  }, []);
  const [value, setValue] = React.useState("a");

  const elements = React.useRef(new Map<string, unknown>());
  const register = React.useCallback((key: string, element: unknown) => {
    if (element) elements.current.set(key, element);
    else elements.current.delete(key);
  }, []);

  const instance = useSdkPrimitive(radioGroup, {
    defaultValue: "a",
    onValueChange: (next: string | null, details?: { reason: string }) => {
      const value = next ?? "";
      setValue(value);
      pushLog(`onValueChange("${value}") 이유:${details?.reason ?? ""}`);
    },
  });
  useSdkPart(instance, "group");
  const state = () => instance.get() as { value: string; stop: string | null };

  // 라디오 roving — keydown을 항목 요소에 직접(프로브 (11) 대조군과 같은 경로).
  const sendKey = (key: string) => {
    const stop = state().stop ?? state().value;
    const element = elements.current.get(stop);
    if (!element) return;
    fireSdkEvent(element as never, "keydown", { key });
  };

  return (
    <View className="gap-2">
      <Text className="font-sans text-base font-bold text-foreground">RADIO — roving이 값까지 바꿔요</Text>
      <View className="flex-row gap-2">
        {RADIO_PROPS.map((props) => (
          <RadioItem key={props.value} instance={instance} props={props} label={RADIO_LABELS[props.value]} register={register} />
        ))}
      </View>
      <View className="flex-row gap-2">
        {[
          ["ArrowUp", "↑"],
          ["ArrowDown", "↓"],
        ].map(([key, label]) => (
          <Pressable
            key={key}
            accessibilityLabel={`라디오 ${label} 키`}
            className="h-9 flex-1 items-center justify-center rounded-lg border border-border bg-background active:bg-muted/50"
            onPress={() => sendKey(key)}
          >
            <Text className="font-sans text-xs font-semibold text-foreground">{label}</Text>
          </Pressable>
        ))}
      </View>
      <Text className="font-sans text-xs leading-4 text-muted-foreground">
        value «{state().value}» · stop {state().stop === null ? "null" : `«${state().stop}»`}
      </Text>
      {log.map((line, i) => (
        <Text key={`${line}-${i}`} className="font-sans text-xs leading-4 text-muted-foreground">
          {line}
        </Text>
      ))}
    </View>
  );
}

export default function UisdkRoving() {
  const insets = useSafeAreaInsets();

  // 포커스 모드 — roving(order.list·focusOn)가 요소의 연결을 읽어요.
  // 마운트 경계(팝업 모드와 같은 운영).
  React.useEffect(() => {
    setSdkElementFocusMode(true);
    return () => setSdkElementFocusMode(false);
  }, []);

  return (
    <View className="flex-1 bg-background">
      <View style={{ height: insets.top + 20 }} />
      <View className="flex-1 px-6">
        <Text className="font-sans text-xl font-bold tracking-tight text-foreground">
          키·포커스 — roving RN 구동
        </Text>
        <Text className="mt-1 font-sans text-xs leading-4 text-muted-foreground">
          문서·창이 실 이벤트 대상이 되고 focus()가 가상 포커스 레지스트리에 기록돼요 —
          화살표 키가 stop(포커스)을 옮기고 선택까지 이어져요.
        </Text>
        <View className="mt-5 gap-8">
          <TabsDemo />
          <RadioDemo />
        </View>
      </View>
    </View>
  );
}
