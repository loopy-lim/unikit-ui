/**
 * @unikit-bridge/ui/motion (웹 — package.json exports `default` 조건).
 * 웹은 표준 CSS 애니메이션(`unikit-*-in`)과 Tailwind `transition-*` 유틸이
 * 브라우저에서 직접 구동되므로 no-op 호환 스텁을 제공한다.
 */
export function installReanimatedMotion(): void {}

export function uninstallReanimatedMotion(): void {}

export function isReanimatedMotionInstalled(): boolean {
  return false;
}
