// Expo Router 루트 레이아웃(T-3 → T-5 확장).
// UnikitThemeProvider가 colorScheme 상태(기본값 라이트)를 보유하고
// 브리지를 통해 uniwind 활성 테마로 반영한다 — 즉시 전환·영속화 없음(02-design §1.4).
// 토큰 값은 global.css(generate:design 생성)에 상주하며 단일 출처는
// packages/unikit/src/theme/tokens.ts.
import "../global.css";

import { Stack } from "expo-router";
import { UnikitThemeProvider } from "@unikit-bridge/ui";

export default function RootLayout() {
  return (
    <UnikitThemeProvider>
      {/* headerShown: false(G4 F-8) — expo-router Stack은 기본값이 헤더 표시라
          64px 흰색 "index" 바가 쇼케이스 위에 붙었다. §1.2 트리에 라우터 헤더는
          없으므로 숨긴다(웹·네이티브 동일). */}
      <Stack screenOptions={{ headerShown: false }} />
    </UnikitThemeProvider>
  );
}
