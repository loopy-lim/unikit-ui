import "../global.css";

import { StatusBar } from "expo-status-bar";
import { Stack } from "expo-router";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { Toaster, UnikitThemeProvider, useUnikitTheme } from "@unikit-bridge/ui";
import { installUiSdkOverlayPosition } from "@unikit-bridge/ui/overlay-position";
import { Dimensions, View } from "@unikit-bridge/ui/primitives";

// 오버레이 배치(앵커 팝업 전 계열)를 @ui-sdk/core position() 엔진으로 교체
// (이슈 #15 — behaviors/ui-sdk-dom 어댑터 경유, docs/sdd/100 §7 P3 패턴).
// 내장 경로로 되돌리려면 이 호출을 지우면 된다.
installUiSdkOverlayPosition();

const windowDim = Dimensions.get("window");
const INITIAL_METRICS = {
  insets: { top: 0, bottom: 0, left: 0, right: 0 },
  frame: {
    x: 0,
    y: 0,
    width: windowDim.width || 390,
    height: windowDim.height || 844,
  },
};

function RootShell() {
  const { colorScheme } = useUnikitTheme();
  return (
    <View style={{ flex: 1 }} className="flex-1 bg-background">
      <StatusBar style={colorScheme === "dark" ? "light" : "dark"} />
      <SafeAreaProvider initialMetrics={INITIAL_METRICS}>
        <Stack
          screenOptions={{
            headerShown: false,
            contentStyle: { backgroundColor: "transparent" },
          }}
        />
        <Toaster position="bottom-right" richColors closeButton />
      </SafeAreaProvider>
    </View>
  );
}

export default function RootLayout() {
  return (
    <UnikitThemeProvider>
      <RootShell />
    </UnikitThemeProvider>
  );
}

