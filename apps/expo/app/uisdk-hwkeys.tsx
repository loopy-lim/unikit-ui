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
// slider 데모(키보드 전용): thumb-input 요소에 keydown — ArrowLeft/Right가
// ±step(step-key), Home/End가 양끝(이슈 #43 «v1 경계» 항목의 하드웨어 실증).
// dialog 데모: Escape(111)가 트리거·콘텐츠 어디에 있든 요소 keydown →
// 창 캡처 → 레이어 onEscape → 닫힘(escape-key) — Tab 트랩도 같은 경로.
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
import { Modal } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Pressable, ScrollView, Text, View } from "@unikit-bridge/ui/primitives";

import { tabs } from "@ui-sdk/core/tabs";
import { radioGroup } from "@ui-sdk/core/radio";
import { slider as sliderPrimitive } from "@ui-sdk/core/slider";
import { dialog as dialogPrimitive } from "@ui-sdk/core/dialog";
import {
  SdkDocument,
  dispatchSdkDocumentEvent,
  dispatchSdkWindowEvent,
  fireSdkEvent,
  installSdkEventGlobals,
  sdkKeyHostProps,
  setSdkElementFocusMode,
  setSdkElementPopupMode,
  useSdkPart,
  useSdkPrimitive,
  type SdkPrimitiveInstance,
} from "@unikit-bridge/ui/behaviors/ui-sdk-renderer";

installSdkEventGlobals();

/** Fabric 키 핸들러 안에서 커널로 동기 발송하면 change→콜백 전파를 삼키는
 *  레이스가 계측 없이도 재현돼요(슬라이더·다이얼로그 — 탭·라디오 목록은 같은
 *  동기 경로가 무사해요). keydown·keyup 한 쌍을 마이크로태스크로 미뤄
 *  보내면 안정해요. 파트의 fire는 호출 시점의 바인딩 요소를 읽어요. */
function sendKeyPair(
  part: { fire: (type: string, init: Record<string, unknown>) => unknown },
  key: string,
) {
  queueMicrotask(() => {
    part.fire("keydown", { key });
    part.fire("keyup", { key });
  });
}

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

function HwSliderDemo({ onKey }: { onKey: (line: string) => void }) {
  const instance = useSdkPrimitive(sliderPrimitive, {
    defaultValue: 50,
    min: 0,
    max: 100,
    step: 1,
  });
  useSdkPart(instance, "root");
  useSdkPart(instance, "control");
  useSdkPart(instance, "track");
  const thumbInput = useSdkPart(instance, "thumb-input", { index: 0, id: "0" });

  // 커널이 진실 — 값은 스토어 구독(useSyncExternalStore)으로 읽어요. 이 화면은
  // reactCompiler가 켜져 있어서 콜백이 내 녹화한 클로저를 메모이즈하고,
  // instance.get() 직독은 컴파일러 눈에 보이지 않는 외부 상태라 캐시돼요.
  // 스토어 구독은 컴파일러가 아는 훅이라 안전해요.
  const subscribeStore = React.useCallback(
    (notify: () => void) => instance.subscribe(notify),
    [instance],
  );
  const kernelValue = React.useSyncExternalStore(
    subscribeStore,
    () => (instance.get() as { value: number | number[] }).value,
  );
  const value = Array.isArray(kernelValue) ? (kernelValue[0] ?? 0) : kernelValue;

  // 키보드 전용 구획 — 트랙 누름(rect 주입)·드래그는 uisdk-slider 화면 영역.
  // 방향키는 thumb-input 요소에 keydown(프로브 (12)와 같은 경로).
  const host = sdkKeyHostProps({
    event: () => ({ element: thumbInput.sdkElement }),
    focusElement: () => thumbInput.sdkElement,
  });

  const [lastKey, setLastKey] = React.useState<string | null>(null);

  return (
    <View className="gap-2">
      <Text className="font-sans text-base font-bold text-foreground">
        SLIDER — 방향키 값 조정(키보드 전용)
      </Text>
      <Pressable
        accessibilityLabel="하드웨어 슬라이더 트랙"
        className="h-10 justify-center"
        {...host}
        onKeyDown={(event) => {
          setLastKey(event.key);
          const key = event.key;
          sendKeyPair(thumbInput, key);
          onKey(`slider ↓${event.key}`);
        }}
      >
        <View className="h-1.5 w-full rounded-full bg-muted">
          <View
            className="absolute h-4 w-4 rounded-full bg-primary"
            style={{ left: `${value}%` }}
          />
        </View>
      </Pressable>
      <Text className="font-sans text-xs leading-4 text-muted-foreground">
        value «{String(value)}» · ↓{lastKey ?? "-"} — ArrowLeft/Right가 ±step(step-key)
      </Text>
    </View>
  );
}

/** 다이얼로그 콘텐츠 서브트리 — 네이티브 Modal 창 안에서 열림 동안만 마운트
 *  (언마운트에 잠금 해제 — uisdk-dialog와 같은 수명 계약). 하드웨어
 *  Tab·Escape가 콘텐츠 컨테이너의 host props를 거쳐 커널(layers 창 캡처)로
 *  흘러요. */
function HwDialogContent({
  instance,
  onKey,
}: {
  instance: SdkPrimitiveInstance;
  onKey: (line: string) => void;
}) {
  const content = useSdkPart(instance, "content");
  const title = useSdkPart(instance, "title");
  const description = useSdkPart(instance, "description");
  const close = useSdkPart(instance, "close");
  const backdrop = useSdkPart(instance, "backdrop");

  React.useLayoutEffect(() => {
    const contentEl = content.sdkElement;
    if (!contentEl) return;
    // 가상 트리 연결 — 안쪽 누름 판정(composedHops)의 고리.
    for (const part of [title, description, close]) {
      const el = part.sdkElement;
      if (el) el.parentElement = contentEl;
    }
  }, [content.sdkElement, title.sdkElement, description.sdkElement, close.sdkElement]);

  const host = sdkKeyHostProps({
    event: () => ({ element: content.sdkElement }),
    focusElement: () => content.sdkElement,
  });

  // 열림 즉시 네이티브 포커스를 콘텐츠로 — Escape·Tab가 도착하는 길.
  // Modal 창 부착 후 한 프레임 미뤄 잡는다(마운트 직후 호출은 흘러넘침).
  // 브리지 View ref 타입은 focus를 선언하지 않아요 — 실행 시점 선택적 호출.
  const contentHostRef = React.useRef<React.ComponentRef<typeof View>>(null);
  React.useLayoutEffect(() => {
    const raf = requestAnimationFrame(() => {
      (contentHostRef.current as unknown as { focus?: () => void } | null)?.focus?.();
    });
    return () => cancelAnimationFrame(raf);
  }, []);

  const closePress = () => {
    const el = close.sdkElement;
    if (!el) return;
    dispatchSdkWindowEvent("pointerdown", {
      pointerType: "mouse",
      pointerId: 3,
      button: 0,
      buttons: 1,
      clientX: 100,
      clientY: 100,
      target: el,
    });
    dispatchSdkWindowEvent("pointerup", {
      pointerType: "mouse",
      pointerId: 3,
      button: 0,
      buttons: 0,
      clientX: 100,
      clientY: 100,
      target: el,
    });
    fireSdkEvent(el, "click", { detail: 1 });
  };

  return (
    <View className="absolute inset-0 items-center justify-center">
      {backdrop.showing ? (
        <Pressable
          focusable={false}
          accessibilityLabel="다이얼로그 뒷면(바깥누름)"
          className="absolute inset-0 bg-black/50"
          onPress={() => {
            dispatchSdkWindowEvent("pointerdown", {
              pointerType: "touch",
              pointerId: 2,
              button: 0,
              isPrimary: true,
              clientX: 10,
              clientY: 10,
              target: null,
            });
            dispatchSdkWindowEvent("click", {
              pointerType: "touch",
              detail: 1,
              button: 0,
              clientX: 12,
              clientY: 12,
              target: null,
            });
          }}
        >
          <Text className="font-sans text-xs text-white/70" />
        </Pressable>
      ) : null}
      <View
        ref={contentHostRef}
        accessibilityLabel="하드웨어 다이얼로그 콘텐츠"
        className="w-72 gap-3 rounded-2xl border border-border bg-background p-4"
        {...host}
        onKeyDown={(event) => {
          sendKeyPair(content, event.key);
          onKey(`dialog ↓${event.key}`);
        }}
      >
        <Text className="font-sans text-base font-bold text-foreground">모달 제목(title 슬롯)</Text>
        <Text className="font-sans text-xs leading-4 text-muted-foreground">
          열림 동안 Tab·Escape가 레이어에 갇혀요 — 하드웨어 Escape(111)로 닫혀요.
        </Text>
        <Pressable
          focusable={false}
          accessibilityLabel="다이얼로그 닫기"
          className="h-9 items-center justify-center rounded-lg bg-primary active:opacity-85"
          onPress={closePress}
        >
          <Text className="font-sans text-xs font-semibold text-primary-foreground">닫기(close press)</Text>
        </Pressable>
      </View>
    </View>
  );
}

function HwDialogDemo({ onKey }: { onKey: (line: string) => void }) {
  const instance = useSdkPrimitive(dialogPrimitive, {});
  const trigger = useSdkPart(instance, "trigger");

  // 커널이 진실 — open은 스토어 구독으로 읽어요(슬라이더와 같은 이유 —
  // reactCompiler 환경에서 instance.get() 직독은 캐시되고 콜백 클로저도
  // 메모이즈돼요. useSyncExternalStore는 컴파일러가 아는 구독 경로예요).
  const subscribeStore = React.useCallback(
    (notify: () => void) => instance.subscribe(notify),
    [instance],
  );
  const open = React.useSyncExternalStore(
    subscribeStore,
    () => Boolean((instance.get() as { open?: boolean }).open),
  );
  const lastLogged = React.useRef<boolean | null>(null);
  React.useEffect(() => {
    if (open !== lastLogged.current) {
      lastLogged.current = open;
      onKey(`dialog ${open ? "열림" : "닫힘"}(kernel)`);
    }
  }, [open, onKey]);

  // 트리거도 키 호스트 — 열림 동안 실 포커스가 트리거에 남아 있어도
  // Escape가 요소 발송으로 흘러 창에 닿아요(layers 캡처 — 발송 요소 불문).
  const host = sdkKeyHostProps({
    event: () => ({ element: trigger.sdkElement }),
    focusElement: () => trigger.sdkElement,
  });

  const openPress = () => {
    const el = trigger.sdkElement;
    if (!el) return;
    dispatchSdkDocumentEvent("pointerdown", {
      pointerType: "touch",
      pointerId: 1,
      button: 0,
      isPrimary: true,
      clientX: 20,
      clientY: 20,
    });
    fireSdkEvent(el, "click", { detail: 1 });
  };

  // 안드로이드 뒤로가기 — 같은 커널 경로로 Escape를 발송해 닫는다(발송 요소
  // 불문 — layers 창 캡처). 트리거 요소는 항상 마운트돼 있어 송신점이 안전해요.
  const backPress = () => {
    sendKeyPair(trigger, "Escape");
  };

  return (
    <>
      <View className="gap-2">
        <Text className="font-sans text-base font-bold text-foreground">DIALOG — Escape 닫기(하드웨어)</Text>
        <Pressable
          accessibilityLabel="하드웨어 다이얼로그 열기"
          className="h-11 items-center justify-center rounded-xl bg-primary active:opacity-85"
          {...host}
          onKeyDown={(event) => {
            // Enter·Space는 네이티브 클릭(Pressable onPress)이 한 번만 활성화
            // — 커널 keydown으로도 보내면 이중 활성화가 돼 열렸다 곧바로 닫혀요.
            if (event.key !== "Enter" && event.key !== " ") {
              sendKeyPair(trigger, event.key);
            }
            onKey(`dialog ↓${event.key}`);
          }}
          onPress={openPress}
        >
          <Text className="font-sans text-sm font-semibold text-primary-foreground">
            {open ? "열림(트리거)" : "다이얼로그 열기(Enter·터치)"}
          </Text>
        </Pressable>
        <Text className="mt-2 font-sans text-xs leading-4 text-muted-foreground">
          open {String(open)} · 잠금 overflow «{SdkDocument.documentElement.style.getPropertyValue("overflow")}»
        </Text>
      </View>
      {/* 네이티브 Modal 창 — 오버레이가 화면 전체를 덮고 하드웨어 키가
          이 창 안의 포커스로 흘러요. 열림 동안만 콘텐츠 마운트(수명 계약). */}
      <Modal
        visible={open}
        transparent
        animationType="none"
        statusBarTranslucent
        onRequestClose={backPress}
      >
        {open ? <HwDialogContent instance={instance} onKey={onKey} /> : null}
      </Modal>
    </>
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
    setSdkElementPopupMode(true);
    return () => {
      setSdkElementFocusMode(false);
      setSdkElementPopupMode(false);
    };
  }, []);

  // 콘텐츠(탭·라디오·슬라이더·다이얼로그 4섹션 + 이벤트 로그)가 폰 화면 높이를
  // 넘어요 — uisdk 화면 관례대로 브리지 ScrollView로 감싸고(uisdk-agent와 동일)
  // 안전 영역은 양끝 스페이서 View로. 스크롤 없이는 하단 DIALOG 섹션이 도달
  // 불가능해요(E2E 45855459563에서 하단 라벨 미가시로 확인).
  return (
    <ScrollView
      className="flex-1 bg-background"
      contentContainerClassName="px-6"
    >
      <View style={{ height: insets.top + 20 }} />
      <Text className="font-sans text-xl font-bold tracking-tight text-foreground">
        하드웨어 키 → 커널 직결
      </Text>
        <Text className="mt-1 font-sans text-xs leading-4 text-muted-foreground">
          실제 하드웨어 키(RN 0.88 View onKeyDown — enableKeyEvents 플래그)가 sdkKeyHostProps를
          거쳐 커널 keydown으로 흘러요. 목록 파트만 focusable(컨테이너 전략) — 방향키 소유권이
          커널 roving에 있어요. 터치도 함께 동작해요.
        </Text>
        <View className="mt-5 gap-6">
          <HwTabsDemo onKey={pushLog} />
          <HwRadioDemo onKey={pushLog} />
          <HwSliderDemo onKey={pushLog} />
          <HwDialogDemo onKey={pushLog} />
        </View>
        <Text className="mt-6 font-sans text-xs leading-4 text-muted-foreground">최근 이벤트</Text>
        {log.map((line, i) => (
          <Text key={`${line}-${i}`} className="font-sans text-xs leading-4 text-muted-foreground">
            {line}
          </Text>
        ))}
      <View style={{ height: insets.bottom + 24 }} />
    </ScrollView>
  );
}
