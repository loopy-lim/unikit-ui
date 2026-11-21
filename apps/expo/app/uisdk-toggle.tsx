// 층2 파트 렌더러 참조 화면 — 이슈 #17 스파이크에서 «다 go» 로드맵 M1으로
// graduate: 렌더러 코어는 패키지 진입점 @unikit-bridge/ui/behaviors/
// ui-sdk-renderer(useSdkPrimitive·useSdkPart)로 제품화됐고, 이 화면은 그
// 기기 실증 참조 소비자예요.
//
// 시연하는 것:
// 1. @ui-sdk/core 프리미티브 팩토리(toggle·checkbox — 51종 중 상태기계+press
//    1유형)를 «그대로» 넘기면 수명·구독·DOM 속성 번역이 진입점이 담당한다.
// 2. checkbox는 root+indicator 두 슬롯 — 같은 훅으로 슬롯별 파트를 얻는다.
// 3. 좁은 구독(출력 기반 축소)·합성 이벤트(press)·MutationObserver 마스킹은
//    진입점 내부 계약(동일 파일 머리 주석 참조).
//
// 원 스파이크의 실측 기록(요소 멤버 3개·렌더러 계약 방어 2·followId
// 마스킹)은 docs/sdd/issue-17-layer2-rn-renderer-spike.md에 그대로 남아요.
// keydown/keyup(Space/Enter 활성화)은 하드웨어 키보드 전용이라 이 화면은
// press(click) 경로만 구동해요(키 이벤트 벽 — 이슈 #19).
import * as React from "react";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Pressable, Text, View } from "@unikit-bridge/ui/primitives";

import { toggle } from "@ui-sdk/core/toggle";
import { checkbox } from "@ui-sdk/core/checkbox";
import {
  useSdkPart,
  useSdkPrimitive,
} from "@unikit-bridge/ui/behaviors/ui-sdk-renderer";

type ToggleOptions = {
  defaultPressed?: boolean;
  disabled?: boolean;
  onPressedChange?: (pressed: boolean) => void;
};

function ToggleRow({
  label,
  options,
  onLog,
}: {
  label: string;
  options: ToggleOptions;
  onLog: (line: string) => void;
}) {
  const instance = useSdkPrimitive(toggle, {
    ...options,
    onPressedChange: (pressed) => {
      onLog(`${label} onPressedChange(${pressed})`);
    },
  });
  const root = useSdkPart(instance, "root");
  if (!root.showing) return null;
  const pressed = root.snapshot.pressed === true;
  return (
    <View className="gap-1">
      <Pressable
        accessibilityLabel={label}
        className={`h-12 flex-row items-center justify-center rounded-xl border px-4 ${
          pressed
            ? "border-primary bg-primary"
            : "border-border bg-background"
        }`}
        accessibilityRole={root.bridgeProps.accessibilityRole as "button" | undefined}
        aria-pressed={root.bridgeProps["aria-pressed"]}
        disabled={root.bridgeProps.disabled}
        onPress={root.press}
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

function CheckboxRow({
  label,
  onLog,
}: {
  label: string;
  onLog: (line: string) => void;
}) {
  const instance = useSdkPrimitive(checkbox, {
    onCheckedChange: (checked) => {
      onLog(`${label} onCheckedChange(${String(checked)})`);
    },
  });
  const root = useSdkPart(instance, "root");
  const indicator = useSdkPart(instance, "indicator");
  if (!root.showing) return null;
  const checked = root.snapshot.checked === true;
  return (
    <View className="gap-1">
      <Pressable
        accessibilityLabel={label}
        className={`h-12 flex-row items-center gap-3 rounded-xl border px-4 ${
          checked ? "border-primary bg-primary/10" : "border-border bg-background"
        }`}
        accessibilityRole={root.bridgeProps.accessibilityRole as "checkbox" | undefined}
        aria-checked={root.bridgeProps["aria-checked"]}
        disabled={root.bridgeProps.disabled}
        onPress={root.press}
      >
        <View
          className={`h-5 w-5 items-center justify-center rounded-md border ${
            checked ? "border-primary bg-primary" : "border-border"
          }`}
        >
          {indicator.showing && checked ? (
            <Text className="font-sans text-xs font-bold text-primary-foreground">
              ✓
            </Text>
          ) : null}
        </View>
        <Text className="font-sans text-sm font-semibold text-foreground">
          {label} — {checked ? "checked" : "unchecked"}
        </Text>
      </Pressable>
      <Text className="font-sans text-xs leading-4 text-muted-foreground">
        root: {JSON.stringify(root.domAttrs)}
      </Text>
      <Text className="font-sans text-xs leading-4 text-muted-foreground">
        indicator: {JSON.stringify(indicator.domAttrs)}
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
        파트 렌더러 — ui-sdk 그대로 구동(M1)
      </Text>
      <Text className="font-sans text-sm leading-5 text-foreground">
        @ui-sdk/core의 toggle·checkbox를 패키지 렌더러 진입점으로 구동해요.
        눌러 보세요 — 상태 전환·콜백이 아래에 기록돼요.
      </Text>
      <ToggleRow label="기본 토글" options={{ defaultPressed: false }} onLog={pushLog} />
      <ToggleRow label="초기 pressed 토글" options={{ defaultPressed: true }} onLog={pushLog} />
      <ToggleRow
        label="비활성 토글"
        options={{ defaultPressed: false, disabled: true }}
        onLog={pushLog}
      />
      <CheckboxRow label="체크박스(root+indicator)" onLog={pushLog} />
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
