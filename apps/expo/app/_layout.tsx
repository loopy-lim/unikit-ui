import "../global.css";

import { StatusBar } from "expo-status-bar";
import { Stack } from "expo-router";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { Toaster, UnikitThemeProvider, useUnikitTheme } from "@unikit-bridge/ui";
import { Dimensions, View } from "@unikit-bridge/ui/primitives";

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

