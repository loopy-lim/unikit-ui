// @unikit-bridge/ui/overlay-position 진입점의 공개 옵션 계약(플랫폼 비의존).
// npm 전용(배럴·registry 미등록). web.ts·native.ts 양쪽이 같은 이름으로
// 재노출해, 유니버설 소비 코드가 exports 조건(react-native/default) 어느 쪽으로
// 해석돼도 같은 시그니처·같은 타입에 닿게 해요(PR #31 리뷰 F-2: 웹만 무인자
// 정의여서 default 조건에서만 TS2554/TS2305로 깨지던 계약 비대칭 수정).
export type InstallUiSdkOverlayPositionOptions = {
  /**
   * 앵커 재측정 폴링 주기 ms(기본 200). 0 이하면 추종 폴링을 끈다.
   * 네이티브 전용 — 웹은 position() 내부 watchMoves·rAF 구동이라 이 옵션을
   * 무시해요.
   */
  followIntervalMs?: number;
};
