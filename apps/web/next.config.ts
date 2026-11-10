import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Cloudflare Pages 정적 배포 — Route Handler 없이 public/r/*.json 으로 레지스트리 서빙.
  output: "export",
  // 정적 호스팅에서는 이미지 최적화 서버가 없다.
  images: { unoptimized: true },
  // @unikit-bridge/ui는 TS 소스 배포 — Next가 직접 컴파일한다.
  // (웹 그래프에는 react-native가 없다 — 브리지가 DOM으로 렌더링하므로
  // resolveAlias·transpilePackages의 RN 항목도 더 이상 불필요)
  transpilePackages: ["@unikit-bridge/ui"],
};

export default nextConfig;
