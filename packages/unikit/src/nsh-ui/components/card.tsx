// Card 계열 — src/components/card.tsx의 nsh 네이티브 포팅(사이클 102, 103 수정).
// 순수 스타일 컴포넌트 — py-6 유지(원본과 동일).
//
// 포팅 판단(원본 대비 차이):
// - 카드에 text-card-foreground(원본 값)를 둔다 — React 포팅은 RN에서 컨테이너
//   글자색이 자식 Text로 상속되지 않는 사유로 뺐지만(02-design §2), nsh는 웹·
//   안드로이드 모두 뷰의 글자색이 자식 Text에 상속된다(103 실측) — 전경 클래스
//   없는 Text가 카드 전경색을 받는다(RN에서는 검정으로 남는다). 카드 안 글자는
//   여전히 각자 전경 클래스를 둔다(CardTitle text-foreground·CardDescription
//   text-muted-foreground — 이식 규칙 6 관행).
// - 원본의 shadow-sm은 React 포팅(02-design §2)·이 포팅 모두 뺀다(관행 승계 —
//   103에서 확인, 변경 범위 밖).
import { Text, View } from "nsh";
import { cva } from "class-variance-authority";

import { cn } from "../../lib/utils";
import { nshClass } from "../lib";
import type { Element } from "../types";

const cardVariants = cva(
  "flex flex-col gap-6 rounded-xl border border-border bg-card py-6 text-card-foreground",
);
const cardHeaderVariants = cva("flex flex-col items-start gap-2 px-6");
const cardTitleVariants = cva("font-sans text-foreground leading-none font-semibold");
const cardDescriptionVariants = cva("font-sans text-sm text-muted-foreground");
const cardContentVariants = cva("px-6");
const cardFooterVariants = cva("flex flex-row items-center px-6");

export type CardProps = { className?: string; testID?: string; children?: Element };
export type CardTextProps = { className?: string; testID?: string; children?: Element };

export function Card(props: CardProps) {
  return (
    <View class={cn(cardVariants(), nshClass(props.className))} testID={props.testID}>
      {props.children}
    </View>
  );
}

export function CardHeader(props: CardProps) {
  return (
    <View class={cn(cardHeaderVariants(), nshClass(props.className))} testID={props.testID}>
      {props.children}
    </View>
  );
}

export function CardTitle(props: CardTextProps) {
  return (
    <Text class={cn(cardTitleVariants(), nshClass(props.className))} testID={props.testID}>
      {props.children}
    </Text>
  );
}

export function CardDescription(props: CardTextProps) {
  return (
    <Text
      class={cn(cardDescriptionVariants(), nshClass(props.className))}
      testID={props.testID}
    >
      {props.children}
    </Text>
  );
}

export function CardContent(props: CardProps) {
  return (
    <View class={cn(cardContentVariants(), nshClass(props.className))} testID={props.testID}>
      {props.children}
    </View>
  );
}

export function CardFooter(props: CardProps) {
  return (
    <View class={cn(cardFooterVariants(), nshClass(props.className))} testID={props.testID}>
      {props.children}
    </View>
  );
}

export {
  cardVariants,
  cardHeaderVariants,
  cardTitleVariants,
  cardDescriptionVariants,
  cardContentVariants,
  cardFooterVariants,
};
