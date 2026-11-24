// behaviors/ui-sdk-nsh — @ui-sdk/core 커널을 nsh 런타임에 올리는 린 어댑터
// (사이클 102 M1). src/behaviors/ui-sdk-renderer.ts(RN 가상 DOM 전면 어댑터)의
// nsh 축소판이다.
//
// 계약(@ui-sdk/core PrimitiveInstance — dist 타입·구현 실측):
// - primitive(options) → 인스턴스(컴포넌트 몸체에서 1회 생성 — nsh 컴포넌트도
//   1회 실행이라 수명이 일치한다).
// - instance.subscribe(listener) → 갱신 알림, cleanup()으로 해지.
// - instance.get() → 상태(disabled·pending·error…), instance.setOptions()로
//   옵션 추적, instance.api.internal.press()로 눌림 발송(button 기준).
// - instance.destroy() → 언마운트 정리(onDestroy 콜백·watcher 해지) —
//   RN 어댑터(ui-sdk-renderer.ts 언마운트 이펙트)와 같은 시점에 호출.
//
// 구현 가정(독립 리뷰 F11): 커널 인스턴스는 클로저 객체다(this·#private 없음,
// 0.1.0-beta.6 dist 실측) — 아래 Proxy의 Reflect.get 전달이 안전하다. 승급 시
// probe:ui-sdk 계약 프로브가 파악한다.
//
// M1 범위(판단):
// - button 프리미티브 1종을 nsh/base Button 호스트에 구동한다 — 상태
//   (disabled·pending)를 signal로 추적해 호스트 속성에 반영한다.
// - part.props의 aria-* 속성 매핑·나머지 프리미티브(switch·field·input…)는
//   로드맵(RN 어댑터의 bindSdkPart 상당을 단계적으로 이식).
import { button as buttonPrimitive } from "@ui-sdk/core/button";
import type { Primitive, PrimitiveInstance } from "@ui-sdk/core";
import { Button as NshButton } from "nsh/base";
import { cleanup, effect, signal, Text } from "nsh";

import { cn } from "../lib/utils";
import { nshClass } from "./lib";
import { buttonVariants, buttonTextVariants } from "./components/button";
import type { Element } from "./types";

let nextSdkId = 0;

/** 인스턴스 상태를 signal로 추적한다 — 컴포넌트 몸체(1회 실행)에서 호출. */
export function useSdkNshPrimitive<P extends Primitive>(
  primitive: P,
  options: object,
): PrimitiveInstance {
  const instance = primitive({
    ...(options as object),
    id: `nsh-sdk-${nextSdkId++}`,
  } as never);
  const tick = signal(0);
  cleanup(instance.subscribe(() => tick.update((n: number) => n + 1)));
  cleanup(() => instance.destroy());
  // tick을 읽는 곳에서 갱신을 감지한다 — 읽기 헬퍼를 인스턴스에 붙인다.
  return new Proxy(instance, {
    get(target, key, receiver) {
      if (key === "get") {
        return () => {
          tick();
          return target.get();
        };
      }
      return Reflect.get(target, key, receiver);
    },
  }) as PrimitiveInstance;
}

export type SdkButtonProps = {
  className?: string;
  /** 눌림이 실행할 동작(Promise를 돌려주면 pending 상태가 추적된다) */
  onPress?: () => unknown;
  disabled?: boolean;
  testID?: string;
  hitSlop?: number;
  children?: Element;
};

/** @ui-sdk/core의 button 프리미티브를 구동하는 버튼 — 형태는 킵 Button과 동일. */
export function SdkButton(props: SdkButtonProps) {
  const instance = useSdkNshPrimitive(buttonPrimitive, {
    disabled: props.disabled ?? false,
    action: props.onPress,
  });
  // 옵션 추적 — prop이 바뀌면 커널에 반영한다(읽기 반응형).
  effect(() => {
    instance.setOptions({
      disabled: props.disabled ?? false,
      action: props.onPress,
    });
  });
  const state = () =>
    instance.get() as { disabled: boolean; pending: boolean; error: unknown };
  return (
    <NshButton
      class={cn(
        buttonVariants({ variant: "default", size: "default" }),
        state().pending && "opacity-50",
        nshClass(props.className),
      )}
      disabled={state().disabled}
      testID={props.testID}
      hitSlop={props.hitSlop}
      onPress={() => {
        (instance.api as {
          internal: { press(event?: unknown): void };
        }).internal.press();
      }}
    >
      {typeof props.children === "string" || typeof props.children === "number" ? (
        <Text class={cn(buttonTextVariants({ variant: "default", size: "default" }))}>
          {state().pending ? `${props.children}…` : props.children}
        </Text>
      ) : (
        props.children
      )}
    </NshButton>
  );
}
