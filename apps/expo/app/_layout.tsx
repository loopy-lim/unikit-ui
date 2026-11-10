// Expo Router 루트 레이아웃(T-3 → T-5 확장 → 카탈로그 재구성).
// UnikitThemeProvider가 colorScheme 상태(기본값 라이트)를 보유하고
// 브리지를 통해 uniwind 활성 테마로 반영한다 — 즉시 전환·영속화 없음(02-design §1.4).
// 토큰 값은 global.css(generate:design 생성)에 상주하며 단일 출처는
// packages/unikit/src/theme/tokens.ts.
//
// 카탈로그 재구성: SafeAreaProvider/SafeAreaView와 Toaster를 루트로 올렸다
// (목록·상세 어느 화면에서도 안전 영역·토스트가 동작하게). Toaster는
// 화면 루트(스크롤 밖)에 1개만 둔다(사이클 40 관행 유지).
// SafeAreaView 바깥을 bg-background View로 감싸 안전 영역(상태바·제스처
// 바)까지 테마 배경이 칠해지게 한다 — 없으면 다크 모드에서 창 배경
// (밝은 색) 띠가 상·하단에 남는다. 상태바 아이콘도 테마를 따라간다.
import "../global.css";

import { StatusBar } from "expo-status-bar";
import { Stack } from "expo-router";
import { View } from "react-native";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";
import { Toaster, UnikitThemeProvider, useUnikitTheme } from "@unikit-bridge/ui";

// 정적 내보내기 시에도 SafeAreaProvider가 children을 즉시 렌더하도록 하는 초기값.
// 웹에서 safe-area 인셋은 보통 0이고, 측정 후 실제 값으로 교정된다.
const ZERO_INITIAL_METRICS = {
  insets: { top: 0, bottom: 0, left: 0, right: 0 },
  frame: { x: 0, y: 0, width: 0, height: 0 },
} as const;

/** 테마를 아는 루트 껍데기 — Provider 안에서 훅을 쓰기 위해 분리 */
function RootShell() {
  const { colorScheme } = useUnikitTheme();
  return (
    // 창 전체(안전 영역 포함)에 테마 배경 — SafeAreaView는 인셋만 담당
    <View className="flex-1 bg-background">
      <StatusBar style={colorScheme === "dark" ? "light" : "dark"} />
      <SafeAreaProvider initialMetrics={ZERO_INITIAL_METRICS}>
        <SafeAreaView style={{ flex: 1 }}>
          {/* headerShown: false(G4 F-8) — §1.2 트리에 라우터 헤더는 없으므로
              숨긴다(웹·네이티브 동일). 상세 화면 헤더는 컴포넌트로 직접 렌더. */}
          <Stack screenOptions={{ headerShown: false }} />
          {/* Toaster — Sonner 섹션·Form 제출 완료의 toast가 여기에 쌓여요. */}
          <Toaster position="bottom-right" richColors closeButton />
        </SafeAreaView>
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
