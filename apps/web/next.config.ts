import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: [
    "nativewind",
    "react-native-css-interop",
    "react-native",
    "react-native-web",
    "@unikit/core",
  ],
  // Next 16: Turbopack 기본. RNW 표준 별칭 (R-1 1단계 — Turbopack resolveAlias).
  turbopack: {
    resolveAlias: {
      "react-native": "react-native-web",
      // pnpm auto-install-peers가 react-native-css-interop의 optional peer를
      // 설치함. 이 라이브러리는 react-native 내부 경로를 deep-import 해서
      // Turbopack이 Flow 구문 파싱에 실패하므로 웹 그래프에서 차단(빈 모듈).
      // css-interop 측 require는 try/catch로 보호되어 있어 정상 무시됨.
      "react-native-safe-area-context": false,
    },
  },
};

export default nextConfig;
