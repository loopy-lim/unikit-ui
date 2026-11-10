"use client";

import {
  Checkbox,
  RadioGroup,
  RadioGroupItem,
  Switch,
  Textarea,
  Toggle,
  ToggleGroup,
  ToggleGroupItem,
} from "@unikit-bridge/ui";
import { Text, View } from "@unikit-bridge/ui/primitives";

import type { ShowcaseDemo } from "./types";

export const checkboxDemo: ShowcaseDemo = {
  Demo: function CheckboxDemo() {
    return (
      <View className="flex flex-col gap-3">
        <View className="flex flex-row items-center gap-2">
          <Checkbox defaultChecked accessibilityLabel="알림 받기" />
          <Text className="font-sans text-sm text-foreground">알림 받기</Text>
        </View>
        <View className="flex flex-row items-center gap-2">
          <Checkbox accessibilityLabel="마케팅 수신" />
          <Text className="font-sans text-sm text-foreground">마케팅 수신</Text>
        </View>
        <View className="flex flex-row items-center gap-2 opacity-50">
          <Checkbox disabled accessibilityLabel="비활성" />
          <Text className="font-sans text-sm text-foreground">비활성</Text>
        </View>
      </View>
    );
  },
  code: `import { Checkbox } from "@unikit-bridge/ui";

<Checkbox defaultChecked accessibilityLabel="동의" />`,
};

export const radioGroupDemo: ShowcaseDemo = {
  Demo: function RadioGroupDemo() {
    return (
      <RadioGroup defaultValue="email" accessibilityLabel="알림 방법">
        <View className="flex flex-row gap-4">
          <View className="flex flex-row items-center gap-2">
            <RadioGroupItem value="email" />
            <Text className="font-sans text-sm text-foreground">이메일</Text>
          </View>
          <View className="flex flex-row items-center gap-2">
            <RadioGroupItem value="push" />
            <Text className="font-sans text-sm text-foreground">푸시</Text>
          </View>
        </View>
      </RadioGroup>
    );
  },
  code: `import { RadioGroup, RadioGroupItem } from "@unikit-bridge/ui";

<RadioGroup defaultValue="a"><RadioGroupItem value="a" /></RadioGroup>`,
};

export const switchDemo: ShowcaseDemo = {
  Demo: function SwitchDemo() {
    return (
      <View className="flex flex-col gap-3">
        <View className="flex flex-row items-center gap-2">
          <Switch defaultChecked accessibilityLabel="알림" />
          <Text className="font-sans text-sm text-foreground">알림 켜기</Text>
        </View>
        <View className="flex flex-row items-center gap-2">
          <Switch accessibilityLabel="자동 저장" />
          <Text className="font-sans text-sm text-foreground">자동 저장</Text>
        </View>
      </View>
    );
  },
  code: `import { Switch } from "@unikit-bridge/ui";

<Switch defaultChecked accessibilityLabel="알림" />`,
};

export const toggleDemo: ShowcaseDemo = {
  Demo: function ToggleDemo() {
    return (
      <View className="flex flex-row flex-wrap gap-2">
        <Toggle defaultPressed accessibilityLabel="즐겨찾기">
          ★ 즐겨찾기
        </Toggle>
        <Toggle accessibilityLabel="고정">📌 고정</Toggle>
        <Toggle variant="outline" accessibilityLabel="굵게">
          B
        </Toggle>
      </View>
    );
  },
  code: `import { Toggle } from "@unikit-bridge/ui";

<Toggle accessibilityLabel="토글">★</Toggle>`,
};

export const toggleGroupDemo: ShowcaseDemo = {
  Demo: function ToggleGroupDemo() {
    return (
      <ToggleGroup type="single" defaultValue="list">
        <ToggleGroupItem value="list">목록</ToggleGroupItem>
        <ToggleGroupItem value="map">지도</ToggleGroupItem>
      </ToggleGroup>
    );
  },
  code: `import { ToggleGroup, ToggleGroupItem } from "@unikit-bridge/ui";

<ToggleGroup type="single" defaultValue="a">
  <ToggleGroupItem value="a">A</ToggleGroupItem>
</ToggleGroup>`,
};

export const textareaDemo: ShowcaseDemo = {
  Demo: function TextareaDemo() {
    return (
      <Textarea className="w-full" placeholder="메모를 입력해 보세요." />
    );
  },
  code: `import { Textarea } from "@unikit-bridge/ui";

<Textarea placeholder="메모" />`,
};
