// M2-⑤ 제스처·레이아웃 유형 참조 화면(에픽 #35 «다 go» 로드맵). 드래그
// 커널(bindDrag)은 문서 리스너(pointermove/pointerup/pointercancel)와
// ownerDocument.defaultView의 rAF로 추적해요 — 문서가 실 이벤트 대상이라야
// 성립해요(installSdkEventGlobals). RN 화면은 PanResponder의 터치 이동·끝을
// dispatchSdkDocumentEvent로 넣고, 트랙 좌표는 measureInWindow→setSdkRect로
// 주입해요(동기 레이아웃 읽기 대신 — M2-②의 rect 캐시 패턴).
//
// 검증 경로(프로브 (12)와 같은 계약):
//   - 트랙 누름 → control pointerdown → track-press(누른 좌표가 값이 돼요)
//   - 드래그 → document pointermove(rAF flush) → drag
//   - 놓기 → document pointerup → onValueCommit(drag) + 같은 틱 click 삼킴
//   - 시스템 취소 → pointercancel → 종료·commit
//   - 키 스텝 → thumb-input keydown/keyup → step-key
//
// 기기 실증(2026-11-23, 에뮬레이터 390×844dp, 클린 재시작): 트랙 누름(가운데)
// → 50 track-press·commit ✓, 드래그(200→600px) → 값 추적 89→91→93(drag)·
// onValueCommit(93, drag) ✓, 키 스텝 → 93→94→95→94(step-key·commit) ✓,
// Metro·logcat 무오류.
//
// 계약(실측): PanResponder는 한 번만 만들어지므로 핸들러는 «최신 파츠 ref»를
// 읽어야 해요 — 첫 렌더의 control 클로저(sdkElement null)를 얼으면 누름이
// 실종돼요(grant el=false 실측).
import * as React from "react";
import { PanResponder, type PanResponderInstance } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Pressable, Text, View } from "@unikit-bridge/ui/primitives";

import { slider } from "@ui-sdk/core/slider";
import {
  dispatchSdkDocumentEvent,
  fireSdkEvent,
  installSdkEventGlobals,
  setSdkElementFocusMode,
  setSdkRect,
  useSdkPart,
  useSdkPrimitive,
} from "@unikit-bridge/ui/behaviors/ui-sdk-renderer";

installSdkEventGlobals();

const TRACK_WIDTH = 300;

function SliderDemo() {
  const [log, setLog] = React.useState<string[]>([]);
  const pushLog = React.useCallback((line: string) => {
    setLog((prev) => [line, ...prev].slice(0, 4));
  }, []);

  const instance = useSdkPrimitive(slider, {
    defaultValue: 20,
    min: 0,
    max: 100,
    step: 1,
    onValueChange: (value: number | number[], details: { reason: string }) =>
      pushLog(`onValueChange(${value}) 이유:${details.reason}`),
    onValueCommit: (value: number | number[], details: { reason: string }) =>
      pushLog(`onValueCommit(${value}) 이유:${details.reason}`),
  });
  const root = useSdkPart(instance, "root");
  const control = useSdkPart(instance, "control");
  const track = useSdkPart(instance, "track");
  const thumbInput = useSdkPart(instance, "thumb-input", { index: 0, id: "0" });

  // 트랙 rect 주입 — 커널이 clientX를 값으로 환산할 기준이에요. rAF+재시도로
  // 측정하고(M2-② measureInto 패턴) 레이아웃이 바뀌면 다시 채워요.
  const trackViewRef = React.useRef<{ measureInWindow: (cb: (x: number, y: number, w: number, h: number) => void) => void } | null>(null);
  React.useLayoutEffect(() => {
    let cancelled = false;
    let attempts = 0;
    const measure = () => {
      if (cancelled) return;
      attempts += 1;
      trackViewRef.current?.measureInWindow((x, y, w, h) => {
        if (cancelled || w === 0) {
          if (attempts < 8) requestAnimationFrame(measure);
          return;
        }
        const el = track.sdkElement;
        if (el) setSdkRect(el, x, y, w, h);
      });
    };
    requestAnimationFrame(measure);
    return () => {
      cancelled = true;
    };
  }, [track.sdkElement]);

  const touchInit = (clientX: number, buttons = 1) => ({
    clientX,
    clientY: 10,
    pointerId: 1,
    pointerType: "touch" as const,
    button: 0,
    buttons,
    isPrimary: true,
  });

  // PanResponder → 커널 문서 리스너. grant는 control pointerdown(track-press),
  // move는 document pointermove(drag), release는 pointerup + 같은 틱 click
  // (swallowNextClick 계약 — 웹에서 pointerup→click은 같은 작업 안에서 연속).
  // PanResponder는 한 번만 만들어요 — 핸들러가 첫 렌더의 파츠(sdkElement
  // 아직 null)를 얼지 않도록 최신 파츠를 가리키는 ref를 읽어요.
  const latest = React.useRef({ control, instance });
  latest.current = { control, instance };
  const pan = React.useRef<PanResponderInstance | null>(null);
  if (!pan.current) {
    pan.current = PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: (event) => {
        const el = latest.current.control.sdkElement;
        if (!el) return;
        fireSdkEvent(el, "pointerdown", touchInit(event.nativeEvent.touches[0]?.pageX ?? 0));
      },
      onPanResponderMove: (event) => {
        dispatchSdkDocumentEvent("pointermove", touchInit(event.nativeEvent.touches[0]?.pageX ?? 0));
      },
      onPanResponderRelease: (event) => {
        const x = event.nativeEvent.changedTouches[0]?.pageX ?? 0;
        dispatchSdkDocumentEvent("pointerup", touchInit(x, 0));
        dispatchSdkDocumentEvent("click", { detail: 1, pointerId: 1 });
      },
      onPanResponderTerminate: (event) => {
        const x = event.nativeEvent.changedTouches[0]?.pageX ?? 0;
        dispatchSdkDocumentEvent("pointercancel", touchInit(x, 0));
      },
    });
  }

  const state = () => instance.get() as { value: number; active: number | null };
  const value = state().value;
  const dragging = root.domAttrs["data-dragging"] === "";

  const step = (key: string) => {
    const el = thumbInput.sdkElement;
    if (!el) return;
    fireSdkEvent(el, "keydown", { key });
    fireSdkEvent(el, "keyup", { key });
  };

  return (
    <View className="gap-2">
      <Text className="font-sans text-base font-bold text-foreground">SLIDER — 트랙 press·드래그·키 스텝</Text>
      <View
        ref={trackViewRef}
        accessibilityLabel="슬라이더 트랙"
        className="h-12 justify-center"
        style={{ width: TRACK_WIDTH }}
        {...pan.current.panHandlers}
      >
        <View className="h-2 w-full rounded-full bg-muted">
          <View
            className="h-2 rounded-full bg-primary"
            style={{ width: `${value}%`, opacity: dragging ? 0.7 : 1 }}
          />
        </View>
        <View
          className="absolute h-6 w-6 rounded-full border-2 border-primary bg-background"
          style={{ left: `${value}%`, marginLeft: -12 }}
        />
      </View>
      <View className="flex-row gap-2">
        {[
          ["ArrowLeft", "−1"],
          ["ArrowRight", "+1"],
        ].map(([key, label]) => (
          <Pressable
            key={key}
            accessibilityLabel={`값 ${label} 스텝`}
            className="h-9 flex-1 items-center justify-center rounded-lg border border-border bg-background active:bg-muted/50"
            onPress={() => step(key)}
          >
            <Text className="font-sans text-xs font-semibold text-foreground">{label}</Text>
          </Pressable>
        ))}
      </View>
      <Text className="font-sans text-xs leading-4 text-muted-foreground">
        value {state().value} · active {state().active === null ? "null" : String(state().active)} · data-dragging{" "}
        {dragging ? "표시" : "없음"}
      </Text>
      {log.map((line, i) => (
        <Text key={`${line}-${i}`} className="font-sans text-xs leading-4 text-muted-foreground">
          {line}
        </Text>
      ))}
    </View>
  );
}

export default function UisdkSlider() {
  const insets = useSafeAreaInsets();

  // 포커스 모드 — thumb-input 조회(element("thumb-input","0"))가 연결을 읽어요.
  React.useEffect(() => {
    setSdkElementFocusMode(true);
    return () => setSdkElementFocusMode(false);
  }, []);

  return (
    <View className="flex-1 bg-background">
      <View style={{ height: insets.top + 20 }} />
      <View className="flex-1 px-6">
        <Text className="font-sans text-xl font-bold tracking-tight text-foreground">
          제스처·레이아웃 — slider RN 구동
        </Text>
        <Text className="mt-1 font-sans text-xs leading-4 text-muted-foreground">
          터치 누름·이동·끝이 문서 리스너로 흘러 드래그 커널을 구동해요 —
          track-press·drag·commit 이유가 커널에서 와요.
        </Text>
        <View className="mt-6">
          <SliderDemo />
        </View>
      </View>
    </View>
  );
}
