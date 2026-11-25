// 브리지 프리미티브 — src/bridge/{web,native}.tsx의 nsh 대응면(사이클 102).
// UniKit 관습(className)을 nsh 관습(class)으로 바꾸는 최소 어댑터다.
//
// 실측 계약(docs/sdd/102 §2):
// - nsh JSX의 속성 스프레드({...rest})는 children을 전달하지 않는다 —
//   children은 항상 명시적으로 넘긴다.
// - className을 host에 그대로 흘리면 "unsupported prop" 경고가 난다 —
//   split()으로 떼어내 class로 치환한다(nshClass 정규화 경유).
// - nsh/base Button은 문자열 children을 받지 못한다(103 실측: 라벨이 그려지지
//   않고 error invalid op: UnknownNode) — Pressable이 문자열·숫자를 내부 Text로
//   감싼다(React/RN Pressable은 문자열 children을 받으므로 같은 쓰임을 유지).
import { Button as NshButton } from "nsh/base";
import { Image as NshImage, Scroll, split, Text as NshText, View as NshView } from "nsh";
import type { ImageProps, ScrollProps, TextProps, ViewProps } from "nsh";

import { nshClass } from "./lib";
import { wrapLabel } from "./label";
import type { Element } from "./types";

export type { ImageProps, ScrollProps, TextProps, ViewProps };

/** nsh View — className 관습 지원(정규화 후 class로 전달). */
export function View(props: ViewProps & { className?: string }) {
  const [picked, rest] = split(props, ["className"]);
  return (
    <NshView class={nshClass(picked.className)} {...rest}>
      {rest.children}
    </NshView>
  );
}

/** nsh Text — className 관습 지원. 문자열 children은 nsh가 그대로 그린다. */
export function Text(props: TextProps & { className?: string }) {
  const [picked, rest] = split(props, ["className"]);
  return (
    <NshText class={nshClass(picked.className)} {...rest}>
      {rest.children}
    </NshText>
  );
}

/** nsh Image — className 관습 지원. */
export function Image(props: ImageProps & { className?: string }) {
  const [picked, rest] = split(props, ["className"]);
  return (
    <NshImage class={nshClass(picked.className)} {...rest}>
      {rest.children}
    </NshImage>
  );
}

/** nsh Scroll — className 관습 지원. */
export function ScrollView(props: ScrollProps & { className?: string }) {
  const [picked, rest] = split(props, ["className"]);
  return (
    <Scroll class={nshClass(picked.className)} {...rest}>
      {rest.children}
    </Scroll>
  );
}

export type PressableProps = {
  className?: string;
  onPress?: () => void;
  disabled?: boolean;
  testID?: string;
  hitSlop?: number;
  /** 화면 낭독기가 읽는 이름 — 눌림 대상에 글자가 없을 때(아이콘 버튼) 반드시 준다 */
  accessibilityLabel?: string;
  /** 라벨 — 문자열을 권장한다(내부 Text 래핑 기본 라벨 모양. 색·크기를 바꾸려면 Text를 직접 넘긴다) */
  children?: Element;
};

/** 눌림 대상 — 동작은 nsh/base Button(헤드리스), 모양은 앱의 class가 담당한다. */
export function Pressable(props: PressableProps) {
  return (
    <NshButton
      class={nshClass(props.className)}
      testID={props.testID}
      disabled={props.disabled}
      hitSlop={props.hitSlop}
      accessibilityLabel={props.accessibilityLabel}
      onPress={props.onPress}
    >
      {wrapLabel(props.children)}
    </NshButton>
  );
}
