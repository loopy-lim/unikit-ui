/**
 * 엑스포 앱 아이콘 색 헬퍼 — 디자인 토큰 단일 출처 유도.
 *
 * lucide-react-native은 currentColor 상속이 없어 아이콘마다 명시 색이 필요하다.
 * 예전에는 토큰값을 hsl(...) 리터럴로 각 파일에서 다시 베껴 썼고(일부는 토큰에 없는
 * 지어낸 값), 다크 모드에서 보내기 버튼이 배경과 같은 색이 되는 결함이 있었다
 * (사이클 74, docs/sdd/83-requirements.md 배경 실측).
 * 이후로는 색 값을 여기서 직접 쓰지 않고 getThemeTokens(colorScheme)에서 유도한다.
 * 채널 문자열("240 10% 3.9%")은 RN 파서가 확정 지원하는 레거시 hsl(240, 10%, 3.9%)
 * 형식으로 바꿔 돌려준다(슬래시 알파 등 최신 문법은 파서 지원이 불확실해 쓰지 않는다).
 */
import { getThemeTokens, useUnikitTheme } from "@unikit-bridge/ui";

/** 토큰 채널 문자열을 레거시 hsl() 문자열로 변환 */
function hsl(channels: string): string {
  return `hsl(${channels.replaceAll(" ", ", ")})`;
}

/**
 * 테마 스킴에 맞는 아이콘 색 묶음.
 * - fg: 일반 아이콘(전경) — 토큰 --foreground
 * - muted: 보조 아이콘(흐린 화살표 등) — 토큰 --muted-foreground
 * - onPrimary: primary 배경 위 아이콘(보내기 버튼 등) — 토큰 --primary-foreground
 */
export function useIconColors() {
  const { colorScheme } = useUnikitTheme();
  const tokens = getThemeTokens(colorScheme);
  return {
    fg: hsl(tokens["--foreground"]),
    muted: hsl(tokens["--muted-foreground"]),
    onPrimary: hsl(tokens["--primary-foreground"]),
  };
}
