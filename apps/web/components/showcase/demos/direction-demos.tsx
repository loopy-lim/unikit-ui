"use client";

import { DirectionProvider, useDirection } from "@unikit-bridge/ui";
import { Text, View } from "@unikit-bridge/ui/primitives";

import type { ShowcaseDemo } from "./types";

function DirectionReadout() {
  const dir = useDirection();
  return (
    <Text className="font-sans text-sm text-foreground">
      useDirection(): {dir}
    </Text>
  );
}

export const directionDemo: ShowcaseDemo = {
  Demo: function DirectionDemo() {
    return (
      <DirectionProvider dir="rtl">
        <View className="gap-2 rounded-md border p-3">
          <Text className="font-sans text-sm text-muted-foreground">
            프로바이더 dir=&quot;rtl&quot;
          </Text>
          <DirectionReadout />
        </View>
      </DirectionProvider>
    );
  },
  code: `import { DirectionProvider, useDirection } from "@unikit-bridge/ui";

<DirectionProvider dir="rtl">{children}</DirectionProvider>`,
};
