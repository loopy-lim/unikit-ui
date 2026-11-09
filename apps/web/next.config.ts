import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // @unikit-bridge/ui는 TS 소스 배포 — Next가 직접 컴파일한다.
  // (웹 그래프에는 react-native가 없다 — 브리지가 DOM으로 렌더링하므로
  // resolveAlias·transpilePackages의 RN 항목도 더 이상 불필요)
  transpilePackages: ["@unikit-bridge/ui"],
};

export default nextConfig;
