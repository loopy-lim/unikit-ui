// M2-① 상태기계+press 유형 참조 화면(에픽 #35 «다 go» 로드맵, 이슈 #37).
// M1(toggle·checkbox — uisdk-toggle.tsx)에 이어 같은 유형의 남은 팩토리
// 4종을 파트 렌더러 진입점(@unikit-bridge/ui/behaviors/ui-sdk-renderer)으로
// 구동해요. 슬롯 실측(소스 기준):
//   - button        root 1슬롯 — press가 action을 실행해 pending·error 상태기계
//   - switch        root·input·thumb 3슬롯 — input은 폼 제출용 숨은 input
//   - radio         group·root(항목)·input·indicator 4슬롯 — 항목 파트는
//                   props.value 키로 분리, indicator의 value prop은 슬롯
//                   스키마가 "from: root" 선언(여기선 명시적으로 넘김)
//   - segmented-control  root(group)·item·input·indicator 4슬롯 — indicator
//                   bind는 요소 측정이 없어 스타일 제거 경로만 옴(문서 순서
//                   계약 없음 — roving 정차 stop은 null 유지, #19 벽 뒤)
// 측정 한계(roving stop)와 전 슬롯 경성 검사는
// packages/unikit/scripts/ui-sdk-contract-probe.ts (4)~(7)이 상시 재현해요.
import * as React from "react";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Pressable, Text, View } from "@unikit-bridge/ui/primitives";

import { button } from "@ui-sdk/core/button";
import { switchPrimitive } from "@ui-sdk/core/switch";
import { radioGroup } from "@ui-sdk/core/radio";
import { segmentedControl } from "@ui-sdk/core/segmented-control";
import {
  useSdkPart,
  useSdkPrimitive,
  type SdkPrimitiveInstance,
} from "@unikit-bridge/ui/behaviors/ui-sdk-renderer";

// 항목 파트의 안정 props — useSdkPart의 commit·구독이 props 객체 참조로
// 재실행되지 않게 모듈 상수로 둬요(진입점의 안정성 계약).
const RADIO_ITEMS = [
  { value: "a", label: "첫째" },
  { value: "b", label: "둘째" },
  { value: "c", label: "셋째(비활성)", disabled: true },
] as const;
const SEGMENT_ITEMS = [
  { value: "day", label: "일" },
  { value: "week", label: "주" },
  { value: "month", label: "월" },
] as const;

function ActionButtonRow() {
  const instance = useSdkPrimitive(button, {
    action: () =>
      new Promise<void>((resolve) => {
        setTimeout(resolve, 700);
      }),
  });
  const root = useSdkPart(instance, "root");
  if (!root.showing) return null;
  const pending = root.snapshot.pending === true;
  return (
    <View className="gap-1">
      <Pressable
        accessibilityLabel="비동기 작업 버튼"
        className={`h-12 flex-row items-center justify-center rounded-xl border px-4 ${
          pending ? "border-primary/60 bg-muted" : "border-border bg-background"
        }`}
        accessibilityRole={root.bridgeProps.accessibilityRole as "button" | undefined}
        disabled={root.bridgeProps.disabled}
        onPress={root.press}
      >
        <Text className="font-sans text-sm font-semibold text-foreground">
          {pending ? "작업 중…(pending)" : "비동기 작업 실행"}
        </Text>
      </Pressable>
      <Text className="font-sans text-xs leading-4 text-muted-foreground">
        attrs: {JSON.stringify(root.domAttrs)}
      </Text>
    </View>
  );
}

function DisabledButtonRow() {
  const instance = useSdkPrimitive(button, {
    disabled: true,
    action: () => {},
  });
  const root = useSdkPart(instance, "root");
  if (!root.showing) return null;
  return (
    <Pressable
      accessibilityLabel="비활성 버튼"
      className="h-12 flex-row items-center justify-center rounded-xl border border-border bg-muted px-4 opacity-60"
      accessibilityRole={root.bridgeProps.accessibilityRole as "button" | undefined}
      disabled={root.bridgeProps.disabled}
      onPress={root.press}
    >
      <Text className="font-sans text-sm font-semibold text-muted-foreground">
        비활성 버튼(action 없이 억제)
      </Text>
    </Pressable>
  );
}

function SwitchRow({ onLog }: { onLog: (line: string) => void }) {
  const instance = useSdkPrimitive(switchPrimitive, {
    onCheckedChange: (checked) => {
      onLog(`switch onCheckedChange(${String(checked)})`);
    },
  });
  const root = useSdkPart(instance, "root");
  const input = useSdkPart(instance, "input");
  const thumb = useSdkPart(instance, "thumb");
  if (!root.showing) return null;
  const checked = root.snapshot.checked === true;
  return (
    <View className="gap-1">
      <Pressable
        accessibilityLabel="스위치"
        className={`self-start flex-row items-center gap-3 rounded-xl border px-4 py-3 ${
          checked ? "border-primary bg-primary/10" : "border-border bg-background"
        }`}
        accessibilityRole={root.bridgeProps.accessibilityRole as "switch" | undefined}
        aria-checked={root.bridgeProps["aria-checked"]}
        disabled={root.bridgeProps.disabled}
        onPress={root.press}
      >
        <View
          className={`h-6 w-11 items-center rounded-full p-0.5 ${
            checked ? "flex-row-reverse bg-primary" : "flex-row bg-muted"
          }`}
        >
          <View
            className={`h-5 w-5 rounded-full ${checked ? "bg-primary-foreground" : "bg-background"}`}
          />
        </View>
        <Text className="font-sans text-sm font-semibold text-foreground">
          {checked ? "on" : "off"}
        </Text>
      </Pressable>
      <Text className="font-sans text-xs leading-4 text-muted-foreground">
        input(숨은 폼 입력): {JSON.stringify(input.domAttrs.type)} · thumb:{" "}
        {thumb.showing ? "표시" : "숨김"}
      </Text>
    </View>
  );
}

function RadioItem({
  instance,
  value,
  label,
  disabled,
  onLog,
}: {
  instance: SdkPrimitiveInstance;
  value: string;
  label: string;
  disabled?: boolean;
  onLog: (line: string) => void;
}) {
  const props = React.useMemo(() => ({ value, disabled }), [value, disabled]);
  const root = useSdkPart(instance, "root", props);
  const indicator = useSdkPart(instance, "indicator", props);
  if (!root.showing) return null;
  const checked = root.snapshot.checked === true;
  return (
    <Pressable
      accessibilityLabel={`라디오 ${label}`}
      className={`h-11 flex-row items-center gap-3 rounded-xl border px-4 ${
        checked ? "border-primary bg-primary/10" : "border-border bg-background"
      }`}
      accessibilityRole={root.bridgeProps.accessibilityRole as "radio" | undefined}
      aria-checked={root.bridgeProps["aria-checked"]}
      disabled={root.bridgeProps.disabled}
      onPress={() => {
        onLog(`radio press('${value}')`);
        root.press();
      }}
    >
      <View
        className={`h-5 w-5 items-center justify-center rounded-full border ${
          checked ? "border-primary" : "border-border"
        }`}
      >
        {indicator.showing ? (
          <View className="h-2.5 w-2.5 rounded-full bg-primary" />
        ) : null}
      </View>
      <Text className="font-sans text-sm font-semibold text-foreground">
        {label}
      </Text>
    </Pressable>
  );
}

function RadioDemo({ onLog }: { onLog: (line: string) => void }) {
  const instance = useSdkPrimitive(radioGroup, {
    defaultValue: "a",
    onValueChange: (value) => {
      onLog(`radio onValueChange('${String(value)}')`);
    },
  });
  const group = useSdkPart(instance, "group");
  if (!group.showing) return null;
  return (
    <View className="gap-2">
      <View
        className="gap-2 rounded-2xl border border-border/50 bg-card p-3"
        accessibilityRole={group.bridgeProps.accessibilityRole as "radiogroup" | undefined}
      >
        {RADIO_ITEMS.map((item) => (
          <RadioItem
            key={item.value}
            instance={instance}
            value={item.value}
            label={item.label}
            disabled={"disabled" in item ? item.disabled : undefined}
            onLog={onLog}
          />
        ))}
      </View>
      <Text className="font-sans text-xs leading-4 text-muted-foreground">
        group attrs: {JSON.stringify(group.domAttrs)}
      </Text>
    </View>
  );
}

function SegmentedItem({
  instance,
  value,
  label,
}: {
  instance: SdkPrimitiveInstance;
  value: string;
  label: string;
}) {
  const props = React.useMemo(() => ({ value }), [value]);
  const item = useSdkPart(instance, "item", props);
  if (!item.showing) return null;
  const checked = item.snapshot.checked === true;
  return (
    <Pressable
      accessibilityLabel={`구간 ${label}`}
      className={`flex-1 rounded-lg border px-3 py-2 ${
        checked ? "border-primary bg-primary" : "border-transparent bg-transparent"
      }`}
      accessibilityRole={item.bridgeProps.accessibilityRole as "radio" | undefined}
      aria-checked={item.bridgeProps["aria-checked"]}
      disabled={item.bridgeProps.disabled}
      onPress={item.press}
    >
      <Text
        className={`text-center font-sans text-sm font-semibold ${
          checked ? "text-primary-foreground" : "text-foreground"
        }`}
      >
        {label}
      </Text>
    </Pressable>
  );
}

function SegmentedDemo({ onLog }: { onLog: (line: string) => void }) {
  const instance = useSdkPrimitive(segmentedControl, {
    defaultValue: "day",
    onValueChange: (value) => {
      onLog(`segmented onValueChange('${String(value)}')`);
    },
  });
  const root = useSdkPart(instance, "root");
  const indicator = useSdkPart(instance, "indicator");
  if (!root.showing) return null;
  return (
    <View className="gap-2">
      <View
        className="flex-row gap-1 rounded-xl border border-border bg-muted p-1"
        accessibilityRole={root.bridgeProps.accessibilityRole as "radiogroup" | undefined}
      >
        {SEGMENT_ITEMS.map((entry) => (
          <SegmentedItem
            key={entry.value}
            instance={instance}
            value={entry.value}
            label={entry.label}
          />
        ))}
      </View>
      <Text className="font-sans text-xs leading-4 text-muted-foreground">
        indicator(선택 바): value=
        {JSON.stringify((indicator.snapshot as { value?: string | null }).value)}{" "}
        · attrs: {JSON.stringify(indicator.domAttrs)}
      </Text>
    </View>
  );
}

export default function UisdkPress() {
  const insets = useSafeAreaInsets();
  const [log, setLog] = React.useState<string[]>([]);
  const pushLog = React.useCallback((line: string) => {
    setLog((prev) => [line, ...prev].slice(0, 5));
  }, []);

  return (
    <View
      className="flex-1 bg-background gap-4 px-6"
      style={{ paddingTop: insets.top + 20, paddingBottom: insets.bottom + 24 }}
    >
      <Text className="font-sans text-xl font-bold tracking-tight text-foreground">
        상태기계+press 유형 — 남은 4종 구동(M2-①)
      </Text>
      <Text className="font-sans text-sm leading-5 text-foreground">
        button·switch·radio·segmented-control를 진입점으로 그대로 구동해요.
        눌러 보세요 — 상태 전환·콜백이 아래에 기록돼요.
      </Text>
      <ActionButtonRow />
      <DisabledButtonRow />
      <SwitchRow onLog={pushLog} />
      <RadioDemo onLog={pushLog} />
      <SegmentedDemo onLog={pushLog} />
      <View className="gap-1">
        <Text className="font-sans text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          onChange 기록
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
