// 하드웨어 키보드 → 커널 직결 참조 화면(«다 go» 하드웨어 키 마일스톤).
// M2-④(uisdk-roving)는 화면 키패드의 합성 발송만 다뤘어요 — 이 화면은
// sdkKeyHostProps(컨테이너 전략)로 «실제 하드웨어 키»가 브리지 View
// onKeyDown(RN 0.88 W3C 규격 — MainApplication의 enableKeyEvents 레시피,
// 이슈 #19 §1.2)에서 커널 keydown으로 흐르는 끝을 실증해요.
//
// 컨테이너 전략: 목록 파트 하나만 focusable이고 항목 뷰는 포커스 불가 —
// 네이티브 화살표 탐색이 항목 사이를 움직일 대상이 없으므로 방향키 소유권이
// 커널 roving에 단독으로 남아요(#19 스파이크 §2.2 실측의 이중 루빙 우회).
// 발송 target은 «실제 포커스 항목 우선»(웹 keydown과 같은 계약 — 커널이
// tab.el === event.target으로 현재 항목을 찾아요).
//
// tabs 데모는 manual 활성화 — 방향키는 포커스(activeElement)만 옮기고(tabs
// roving은 remember:false라 stop이 선택을 따라요) Enter가 값을 바꿔요.
// radio 데모는 기본값(값·포커스 동시 이동).
//
// 그룹 경계 계약(실측 예정): 컨테이너 사이의 방향키는 네이티브 탐색이 실
// 포커스를 옮겨요(커널 preventDefault가 비동기 JS라 네이티브 결정에 못
// 미쳐요) — 커널의 값 이동은 완료되지만, 다음 키는 포커스을 받은 이웃
// 컨테이너로 가요. 안드로이드의 «방향키로 컨트롤 사이 이동» 관행과 같아요.
//
// 기기 실증(2026-11-23, 에뮬레이터 390×844dp, 클린 재시작, 플래그 on 빌드):
//   DPAD_DOWN 첫 주입 → 탭 목록 컨테이너 포커스 + 가상 포커스 a 동기 ✓,
//   DPAD_RIGHT → 포커스 b(값 a 유지 — manual) ✓, ENTER → 값 «b» 이유
//   item-press(커널 직접 선택) ✓, 그룹 경계 DOWN → tabs는 ArrowDown 무시
//   (수평 목록)하고 네이티브가 radio 컨테이너로 실 포커스 이동 + radio
//   onFocus 동기 ✓, radio DPAD_DOWN/UP → 값·포커스 동시 이동
//   (list-navigation)·비활성 c 건너뜀(램) ✓, 경계 UP → radio 처리 후
//   네이티브가 tabs로 이동(다음 키는 tabs가 수신) ✓.
//   경계 실측: MOVE_HOME/MOVE_END(122/123)는 RN 코어가 key "Unidentified"로
//   번역 — 커널 도달 불가(브리지 수준 결핍, 화면 키패드 발송은 무관).
import * as React from "react";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Pressable, Text, View } from "@unikit-bridge/ui/primitives";

import { tabs } from "@ui-sdk/core/tabs";
import { radioGroup } from "@ui-sdk/core/radio";
import {
  fireSdkEvent,
  installSdkEventGlobals,
  sdkKeyHostProps,
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
const TAB_LABELS: Record<string, string> = { a: "A", b: "B", c: "C", d: "D(비활성)" };

const RADIO_PROPS = [{ value: "a" }, { value: "b" }, { value: "c", disabled: true }] as const;
const RADIO_LABELS: Record<string, string> = { a: "항목 A", b: "항목 B", c: "항목 C(비활성)" };

/** 문서 activeElement와 항목 레지스트리 비교 — 라벨로 돌려줘요. */
function focusLabelOf(registry: Map<string, unknown>): string {
  const doc = (globalThis as { document?: { activeElement: unknown } }).document;
  const active = doc?.activeElement;
  for (const [key, element] of registry) {
    if (element === active) return key;
  }
  return active ? "(다른 요소)" : "(없음)";
}

function HwTabsDemo({
  onKey,
}: {
  onKey: (line: string) => void;
}) {
  const [value, setValue] = React.useState("a");
  const [focusLabel, setFocusLabel] = React.useState("(없음)");

  const elements = React.useRef(new Map<string, unknown>());
  const register = React.useCallback((key: string, element: unknown) => {
    if (element) elements.current.set(key, element);
    else elements.current.delete(key);
  }, []);

  const instance = useSdkPrimitive(tabs, {
    defaultValue: "a",
    activation: "manual",
    onValueChange: (next: string | null, details: { reason: string }) => {
      setValue(next ?? "");
      onKey(`tabs 값 «${next ?? ""}» 이유:${details.reason}`);
    },
  });
  const list = useSdkPart(instance, "list");
  const state = () => instance.get() as { value: string; stop: string | null };

  // 발송 target — 실제 포커스 항목 우선(웹 keydown 계약), 없으면 stop 항목.
  const currentItem = () => {
    const doc = (globalThis as { document?: { activeElement: unknown } }).document;
    for (const element of elements.current.values()) {
      if (element === doc?.activeElement) return element;
    }
    return elements.current.get(state().stop ?? state().value);
  };
  const host = sdkKeyHostProps({
    event: () => ({ element: list.sdkElement, target: currentItem() }),
    focusElement: () => currentItem(),
  });
  const readFocus = () => setFocusLabel(focusLabelOf(elements.current));

  return (
    <View className="gap-2">
      <Text className="font-sans text-base font-bold text-foreground">
        TABS(수동 활성화) — 방향키는 포커스, Enter가 선택
      </Text>
      <Pressable
        accessibilityLabel="하드웨어 탭 목록"
        className="flex-row border-b border-border"
        {...host}
        onFocus={() => {
          host.onFocus();
          readFocus();
        }}
        onBlur={() => {
          host.onBlur();
          readFocus();
        }}
        onKeyDown={(event) => {
          host.onKeyDown(event);
          onKey(`tabs ↓${event.key}`);
          readFocus();
        }}
      >
        {TAB_PROPS.map((props) => (
          <HwTabItem
            key={props.value}
            instance={instance}
            props={props}
            label={TAB_LABELS[props.value]}
            register={register}
            onChanged={readFocus}
          />
        ))}
      </Pressable>
      <Text className="font-sans text-xs leading-4 text-muted-foreground">
        value «{state().value}» · stop {state().stop === null ? "null" : `«${state().stop}»`} · 포커스 {focusLabel}
      </Text>
    </View>
  );
}

function HwTabItem({
  instance,
  props,
  label,
  register,
  onChanged,
}: {
  instance: SdkPrimitiveInstance;
  props: Record<string, unknown>;
  label: string;
  register: (key: string, element: unknown) => void;
  onChanged: () => void;
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
      focusable={false}
      accessibilityLabel={`탭 ${label} — tabindex ${String(tabIndex ?? "?")}`}
      className={`h-10 flex-1 items-center justify-center border-b-2 ${
        disabled ? "opacity-40" : "active:bg-muted/50"
      }`}
      style={{ borderBottomColor: tabIndex === "0" ? "#f54900" : "transparent" }}
      onPress={() => {
        if (part.sdkElement) {
          fireSdkEvent(part.sdkElement, "click", { detail: 1 });
          onChanged();
        }
      }}
    >
      <Text className="font-sans text-xs font-semibold text-foreground">{label}</Text>
    </Pressable>
  );
}

function HwRadioDemo({ onKey }: { onKey: (line: string) => void }) {
  const [value, setValue] = React.useState("a");
  const [focusLabel, setFocusLabel] = React.useState("(없음)");

  const elements = React.useRef(new Map<string, unknown>());
  const register = React.useCallback((key: string, element: unknown) => {
    if (element) elements.current.set(key, element);
    else elements.current.delete(key);
  }, []);

  const instance = useSdkPrimitive(radioGroup, {
    defaultValue: "a",
    onValueChange: (next: string | null, details?: { reason: string }) => {
      setValue(next ?? "");
      onKey(`radio 값 «${next ?? ""}» 이유:${details?.reason ?? ""}`);
    },
  });
  const group = useSdkPart(instance, "group");
  const state = () => instance.get() as { value: string; stop: string | null };

  const currentItem = () => {
    const doc = (globalThis as { document?: { activeElement: unknown } }).document;
    for (const element of elements.current.values()) {
      if (element === doc?.activeElement) return element;
    }
    return elements.current.get(state().stop ?? state().value);
  };
  // radio keydown은 항목 요소에 직접(프로브 (11) 대조군과 같은 경로).
  const host = sdkKeyHostProps({
    event: () => ({ element: currentItem() }),
    focusElement: () => currentItem(),
  });
  const readFocus = () => setFocusLabel(focusLabelOf(elements.current));

  return (
    <View className="gap-2">
      <Text className="font-sans text-base font-bold text-foreground">RADIO — 값·포커스 동시 이동</Text>
      <Pressable
        accessibilityLabel="하드웨어 라디오 목록"
        className="gap-1"
        {...host}
        onFocus={() => {
          host.onFocus();
          readFocus();
        }}
        onBlur={() => {
          host.onBlur();
          readFocus();
        }}
        onKeyDown={(event) => {
          host.onKeyDown(event);
          onKey(`radio ↓${event.key}`);
          readFocus();
        }}
      >
        {RADIO_PROPS.map((props) => (
          <HwRadioItem
            key={props.value}
            instance={instance}
            props={props}
            label={RADIO_LABELS[props.value]}
            register={register}
            onChanged={readFocus}
          />
        ))}
      </Pressable>
      <Text className="font-sans text-xs leading-4 text-muted-foreground">
        value «{state().value}» · stop {state().stop === null ? "null" : `«${state().stop}»`} · 포커스 {focusLabel}
      </Text>
    </View>
  );
}

function HwRadioItem({
  instance,
  props,
  label,
  register,
  onChanged,
}: {
  instance: SdkPrimitiveInstance;
  props: Record<string, unknown>;
  label: string;
  register: (key: string, element: unknown) => void;
  onChanged: () => void;
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
      focusable={false}
      accessibilityLabel={label}
      className="h-10 items-center justify-center rounded-lg border bg-background active:bg-muted/50"
      style={{ borderColor: checked ? "#f54900" : undefined }}
      onPress={() => {
        if (part.sdkElement) {
          fireSdkEvent(part.sdkElement, "click", { detail: 1 });
          onChanged();
        }
      }}
    >
      <Text className="font-sans text-xs font-medium text-foreground">{label}</Text>
    </Pressable>
  );
}

export default function UisdkHwkeys() {
  const insets = useSafeAreaInsets();
  const [log, setLog] = React.useState<string[]>([]);
  const pushLog = React.useCallback((line: string) => {
    setLog((prev) => [line, ...prev].slice(0, 6));
  }, []);

  React.useEffect(() => {
    setSdkElementFocusMode(true);
    return () => setSdkElementFocusMode(false);
  }, []);

  return (
    <View className="flex-1 bg-background">
      <View style={{ height: insets.top + 20 }} />
      <View className="flex-1 px-6">
        <Text className="font-sans text-xl font-bold tracking-tight text-foreground">
          하드웨어 키 → 커널 직결
        </Text>
        <Text className="mt-1 font-sans text-xs leading-4 text-muted-foreground">
          실제 하드웨어 키(RN 0.88 View onKeyDown — enableKeyEvents 플래그)가 sdkKeyHostProps를
          거쳐 커널 keydown으로 흘러요. 목록 파트만 focusable(컨테이너 전략) — 방향키 소유권이
          커널 roving에 있어요. 터치도 함께 동작해요.
        </Text>
        <View className="mt-5 gap-8">
          <HwTabsDemo onKey={pushLog} />
          <HwRadioDemo onKey={pushLog} />
        </View>
        <Text className="mt-6 font-sans text-xs leading-4 text-muted-foreground">최근 이벤트</Text>
        {log.map((line, i) => (
          <Text key={`${line}-${i}`} className="font-sans text-xs leading-4 text-muted-foreground">
            {line}
          </Text>
        ))}
      </View>
    </View>
  );
}
