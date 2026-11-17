// 스파이크 화면 — Vercel UI SDK 순수 로직의 Metro 번들·RN 런타임 실증용.
// docs/sdd/100 §7 증거. 검증 후 제거해도 좋아요.
//
// 시험하는 것:
// 1. `@unikit-bridge/ui/behaviors/ui-sdk` 진입점(사이클 101 P1) — 서브패스
//    exports 해석·선택 peer(@ui-sdk/core)가 Metro(RN 번들러)를 통과하는가.
// 2. toSdkKeyEvent 래퍼 — 브리지 BridgeKeyEvent 모양({key, preventDefault})을
//    ui-sdk 이벤트 모양으로 바꿔 계산하는가(캐스팅 없이 타입으로 성립).
// 3. 순수 로직 헬퍼가 RN 런타임(에뮬레이터)에서 실제 계산하는가.
// 4. shiftKey 전달(이슈 #13) — 시프트 조합(선택 엔진 범위 선택 등)이
//    래퍼를 통과하는가. shift+글자는 여전히 타입어헤드(게이트는
//    ctrl·meta·alt만 본다)임도 함께 확인.
//
// 계약 메모(실측): isTypeaheadKey는 문자열이 아니라 DOM 이벤트 모양
// ({key, ctrlKey, metaKey, altKey})을 받아요 — P1 진입점의 toSdkKeyEvent가
// 그 변환을 맡아요(브리지 이벤트에는 수정자가 선택 멤버라 없으면 false).
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Text, View } from "@unikit-bridge/ui/primitives";

import {
  fuzzyScore,
  isTypeaheadKey,
  toSdkKeyEvent,
} from "@unikit-bridge/ui/behaviors/ui-sdk";

// 브리지 BridgeKeyEvent 최소 형태 — 웹은 DOM KeyboardEvent가 그대로 이 모양.
// shiftKey는 이슈 #13 계약 — 웹은 DOM이 실측값을 주고, 네이티브 TextInput은
// 시프트된 글자 대문자에서 유도한다.
const bridgeEvent = (key: string, shiftKey = false) => ({
  key,
  shiftKey,
  preventDefault: () => {},
});

export default function UisdkSpike() {
  const insets = useSafeAreaInsets();

  const results = [
    ["isTypeaheadKey(k)", String(isTypeaheadKey(toSdkKeyEvent(bridgeEvent("k"))))],
    [
      "isTypeaheadKey(ArrowDown)",
      String(isTypeaheadKey(toSdkKeyEvent(bridgeEvent("ArrowDown")))),
    ],
    ["fuzzyScore(abcd, abc)", String(fuzzyScore("abcd", "abc"))],
    ["fuzzyScore(xyz, abc)", String(fuzzyScore("xyz", "abc"))],
    [
      "toSdkKeyEvent(ArrowDown, shift).shiftKey",
      String(toSdkKeyEvent(bridgeEvent("ArrowDown", true)).shiftKey),
    ],
    [
      "toSdkKeyEvent(ArrowDown).shiftKey",
      String(toSdkKeyEvent(bridgeEvent("ArrowDown")).shiftKey),
    ],
    [
      "isTypeaheadKey(shift+k)",
      String(isTypeaheadKey(toSdkKeyEvent(bridgeEvent("k", true)))),
    ],
  ];

  return (
    <View
      className="flex-1 bg-background gap-2 px-6"
      style={{ paddingTop: insets.top + 20, paddingBottom: insets.bottom + 24 }}
    >
      <Text className="font-sans text-xl font-bold tracking-tight text-foreground">
        @ui-sdk/core RN 스파이크 — behaviors/ui-sdk 경유
      </Text>
      {results.map(([label, value]) => (
        <Text key={label} className="font-sans text-sm leading-5 text-foreground">
          {label} = {value}
        </Text>
      ))}
    </View>
  );
}
