// 문자열 라벨 래핑 — nsh/base 파트(Button 포함: Checkbox·Switch·Radio·Button)는
// 문자열 children을 받지 못한다(102 §4, 103 실측: 라벨이 그려지지 않고 error invalid
// op: UnknownNode). 문자열·숫자 children은 전경색을 직접 둔 내부 Text로 감싼다
// (이식 규칙 6 관행). nsh는 뷰의 글자색이 자식 Text에 상속되지만(103 실측) 클래스
// 없는 Text의 기본색은 검정이라, 래핑 Text에는 전경 클래스를 명시한다.
import { Text } from "nsh";

import { nshClass } from "./lib";
import type { Element } from "./types";

// 라벨 기본 모양 — Pressable·Checkbox·Switch·RadioGroupItem이 공유한다.
const LABEL_CLASS = "font-sans text-sm text-foreground";

/**
 * `children`이 문자열·숫자이면 `className`(기본은 라벨 모양)을 가진 Text로 감싼다
 * (그 외는 그대로).
 */
export function wrapLabel(children: Element, className: string = LABEL_CLASS): Element {
  if (typeof children === "string" || typeof children === "number") {
    return <Text class={nshClass(className)}>{String(children)}</Text>;
  }
  return children;
}
