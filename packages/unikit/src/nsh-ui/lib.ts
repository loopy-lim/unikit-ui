// nsh 킷 공용 유틸 — 클래스 정규화·입력 매핑.
// src/bridge/nsh.tsx(제거됨)의 치환표를 계승한다: 컴포넌트 소스는 단일(UniKit
// 형태)로 두고, nsh가 모르는 클래스 토큰은 이 지점에서 정규화한다.
// - web:selection:* 등 nsh가 파싱 못 하는 웹 전용 변형 → 제거
// - web:X → 제거(웹 전용 효과 — 호버/트랜지션은 nsh가 hover:/active:로 자체 지원)
// - native:X → X(nsh도 네이티브라 값이 그대로 유효)

/** 사용자가 넘긴 className을 nsh 클래스 문법으로 정규화한다. */
export function nshClass(className: string | undefined): string | undefined {
  if (!className) return className;
  const kept = className
    .split(/\s+/)
    .filter(
      (token) =>
        token !== "" &&
        !token.startsWith("web:") &&
        !token.startsWith("dark:"),
    )
    .map((token) =>
      token.startsWith("native:") ? token.slice("native:".length) : token,
    );
  return kept.length > 0 ? kept.join(" ") : undefined;
}

/** UniKit TextInputProps.inputMode → nsh KeyboardType. */
export const KEYBOARD_TYPE: Record<
  string,
  "default" | "number-pad" | "decimal-pad" | "numeric" | "numbers-and-punctuation" | "email-address" | "phone-pad" | "url"
> = {
  text: "default",
  tel: "phone-pad",
  url: "url",
  email: "email-address",
  numeric: "numbers-and-punctuation",
  decimal: "decimal-pad",
  search: "default",
};

/** UniKit autoCapitalize("default"|"none"|...) → nsh AutoCapitalize. */
export function autoCapitalizeOf(
  value: string | undefined,
): "none" | "sentences" | "words" | "characters" | undefined {
  if (value === undefined || value === "default") return undefined;
  return value as "none" | "sentences" | "words" | "characters";
}
