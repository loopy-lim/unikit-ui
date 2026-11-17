"use client";

// 웹 데모 전체의 오버레이 배치(popover·tooltip·dropdown·select 등)를
// @ui-sdk/core position() 엔진으로 교체(이슈 #15 — 제품 오버레이의 ui-sdk
// 소비 실증). lib/overlay.tsx는 서버 컴포넌트에서 직접 import할 수 없어
// (createContext — RSC 경계) 클라이언트 마커 컴포넌트로 얹는다. 내장
// 경로로 되돌리려면 이 컴포넌트를 트리에서 제거하면 된다.
import { installUiSdkOverlayPosition } from "@unikit-bridge/ui/overlay-position";

installUiSdkOverlayPosition();

/** 렌더 트리에 얹어 클라이언트 번들에서 위 설치가 실행되게 하는 마커(null 렌더) */
export function OverlayPositionEngineInstaller() {
  return null;
}
