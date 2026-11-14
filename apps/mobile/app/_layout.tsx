import "../global.css";

import { StatusBar } from "expo-status-bar";
import { Stack } from "expo-router";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { Toaster, UnikitThemeProvider, useUnikitTheme } from "@unikit-bridge/ui";
import { View } from "@unikit-bridge/ui/primitives";

function RootShell() {
  const { colorScheme } = useUnikitTheme();
  return (
    <View style={{ flex: 1 }} className="flex-1 bg-background">
      <StatusBar style={colorScheme === "dark" ? "light" : "dark"} />
      {/* initialMetrics를 생략해 네이티브 실측 insets를 쓴다 — 0으로 고정하면
          엣지투엣지 창에서 헤더가 상태 표시줄 아래로 내려오지 않아 터치가 막힌다. */}
      <SafeAreaProvider>
        <Stack
          screenOptions={{
            headerShown: false,
            contentStyle: { backgroundColor: "transparent" },
          }}
        />
        <Toaster position="bottom-center" />
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
