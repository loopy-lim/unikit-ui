// Card 계열 — src/components/card.tsx의 nsh 네이티브 포팅(사이클 102).
// 순수 스타일 컴포넌트 — py-6 유지(원본과 동일).
import { Text, View } from "nsh";
import { cva } from "class-variance-authority";

import { cn } from "../../lib/utils";
import { nshClass } from "../lib";
import type { Element } from "../types";

const cardVariants = cva(
  "flex flex-col gap-6 rounded-xl border border-border bg-card py-6",
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
