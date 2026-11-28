import { useMemo, useState } from "react";
import { Image, Text, View, type ImageProps } from "@unikit-bridge/ui/primitives";

import { Button } from "../components/button";
import { Card } from "../components/card";
import { Checkbox } from "../components/checkbox";
import { Input } from "../components/input";
import { Label } from "../components/label";
import { RadioGroup, RadioGroupItem } from "../components/radio-group";
import { Separator } from "../components/separator";
import { Slider } from "../components/slider";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/tabs";
import { Textarea } from "../components/textarea";
import { a2uiIcon } from "./icons";
import type { ComponentNode } from "@a2ui/web_core";
import type { UnikitA2uiComponent, UnikitView } from "./types";

const JUSTIFY = {
  start: "flex-start",
  center: "center",
  end: "flex-end",
  spaceAround: "space-around",
  spaceBetween: "space-between",
  spaceEvenly: "space-evenly",
  stretch: "stretch",
} as const;

const ALIGN = {
  start: "flex-start",
  center: "center",
  end: "flex-end",
  stretch: "stretch",
} as const;

const IMAGE_FIT = {
  contain: "contain",
  cover: "cover",
  fill: "fill",
  none: "none",
  scaleDown: "scale-down",
} as const;

const IMAGE_SIZE = {
  icon: "size-6",
  avatar: "size-10 rounded-full",
  smallFeature: "size-24 rounded-md",
  mediumFeature: "size-48 rounded-lg",
  largeFeature: "size-80 rounded-lg",
  header: "h-40 w-full rounded-lg",
} as const;

type MarkdownSpan = {
  text: string;
  bold?: boolean;
  italic?: boolean;
  code?: boolean;
};

function parseMarkdownInline(source: string): MarkdownSpan[] {
  const spans: MarkdownSpan[] = [];
  const pattern = /\*\*([^*]+)\*\*|\*([^*]+)\*|`([^`]+)`/g;
  let cursor = 0;
  let match = pattern.exec(source);
  while (match) {
    if (match.index > cursor) {
      spans.push({ text: source.slice(cursor, match.index) });
    }
    if (match[1] !== undefined) spans.push({ text: match[1], bold: true });
    else if (match[2] !== undefined) spans.push({ text: match[2], italic: true });
    else spans.push({ text: match[3] ?? "", code: true });
    cursor = match.index + match[0].length;
    match = pattern.exec(source);
  }
  if (cursor < source.length) {
    spans.push({ text: source.slice(cursor) });
  }
  return spans;
}

function MarkdownLine({ spans }: { spans: MarkdownSpan[] }) {
  return (
    <Text className="text-sm leading-6 text-foreground">
      {spans.map((span, index) => (
        <Text
          key={index}
          className={
            span.code
              ? "font-mono text-xs text-muted-foreground"
              : span.bold
                ? "font-semibold text-foreground"
                : span.italic
                  ? "italic text-foreground"
                  : undefined
          }
        >
          {span.text}
        </Text>
      ))}
    </Text>
  );
}

export function A2uiMarkdown({ text }: { text: string }) {
  const paragraphs = useMemo(
    () =>
      text
        .split(/\n{2,}/)
        .map((paragraph) => paragraph.split("\n").map((line) => parseMarkdownInline(line)))
        .filter((lines) => lines.some((line) => line.length > 0)),
    [text],
  );
  return (
    <View className="gap-2">
      {paragraphs.map((lines, pIndex) => (
        <View key={pIndex} className="gap-1">
          {lines.map((spans, lIndex) => (
            <MarkdownLine key={lIndex} spans={spans} />
          ))}
        </View>
      ))}
    </View>
  );
}

const BUTTON_VARIANT = {
  default: "secondary",
  primary: "default",
  borderless: "ghost",
} as const;

export const a2uiTextView: UnikitView = (context) => (
  <A2uiMarkdown text={context.text("text")} />
);

export const a2uiButtonView: UnikitView = (context) => (
  <Button
    variant={BUTTON_VARIANT[context.value("variant") as keyof typeof BUTTON_VARIANT] ?? "secondary"}
    size="default"
    disabled={context.checks().valid === false}
    onPress={() => void context.action("action")?.()}
    style={context.weightStyle()}
  >
    {context.child("child")}
  </Button>
);

export const a2uiRowView: UnikitView = (context) => (
  <View
    className="flex flex-row gap-2"
    style={{
      justifyContent: JUSTIFY[context.value("justify") as keyof typeof JUSTIFY] ?? "flex-start",
      alignItems: ALIGN[context.value("align") as keyof typeof ALIGN] ?? "stretch",
      ...context.weightStyle(),
    }}
  >
    {context.children("children")}
  </View>
);

export const a2uiColumnView: UnikitView = (context) => (
  <View
    className="flex flex-col gap-2"
    style={{
      justifyContent: JUSTIFY[context.value("justify") as keyof typeof JUSTIFY] ?? "flex-start",
      alignItems: ALIGN[context.value("align") as keyof typeof ALIGN] ?? "stretch",
      ...context.weightStyle(),
    }}
  >
    {context.children("children")}
  </View>
);

export const a2uiListView: UnikitView = (context) => (
  <View
    className={context.value("direction") === "horizontal" ? "flex flex-row gap-2" : "flex flex-col gap-2"}
    style={{ alignItems: ALIGN[context.value("align") as keyof typeof ALIGN] ?? "stretch", ...context.weightStyle() }}
  >
    {context.children("children")}
  </View>
);

export const a2uiCardView: UnikitView = (context) => (
  <Card className="p-4" style={context.weightStyle()}>
    {context.child("child")}
  </Card>
);

export const a2uiDividerView: UnikitView = (context) => (
  <Separator
    orientation={context.value("axis") === "vertical" ? "vertical" : "horizontal"}
    className={context.value("axis") === "vertical" ? "self-stretch" : "w-full"}
  />
);

export const a2uiIconView: UnikitView = (context) => {
  const name = context.value("name");
  const Icon = typeof name === "string" ? a2uiIcon(name) : undefined;
  if (!Icon) {
    return <View className="size-5 rounded-sm bg-muted" />;
  }
  return <Icon className="size-5 text-foreground" />;
};

export const a2uiImageView: UnikitView = (context) => {
  const url = context.text("url");
  const description = context.text("description");
  const fit = IMAGE_FIT[context.value("fit") as keyof typeof IMAGE_FIT] ?? "fill";  const imageProps: ImageProps = {
    source: { uri: url },
    alt: description || undefined,
    accessibilityLabel: description || undefined,
    style: { objectFit: fit },
    className: IMAGE_SIZE[context.value("variant") as keyof typeof IMAGE_SIZE] ?? "size-48 rounded-lg",
  };
  return <Image {...imageProps} />;
};

export const a2uiTextFieldView: UnikitView = (context) => {
  const variant = context.value("variant") as string | undefined;
  const label = context.text("label");
  const value = context.text("value");
  const placeholder = context.text("placeholder");
  const checks = context.checks();
  return (
    <View className="flex flex-col gap-1.5">
      {label ? <Label className="text-sm text-foreground">{label}</Label> : null}
      {variant === "longText" ? (
        <Textarea
          value={value}
          placeholder={placeholder || undefined}
          invalid={!checks.valid}
          onChangeText={(next) => context.set("value", next)}
        />
      ) : (
        <Input
          value={value}
          placeholder={placeholder || undefined}
          secureTextEntry={variant === "obscured"}
          inputMode={variant === "number" ? "decimal" : undefined}
          onChangeText={(next) => context.set("value", next)}
        />
      )}
      {checks.errors.length > 0 ? (
        <Text className="text-xs text-destructive">{checks.errors[0]}</Text>
      ) : null}
    </View>
  );
};

export const a2uiCheckBoxView: UnikitView = (context) => (
  <View className="flex flex-row items-center gap-2">
    <Checkbox
      checked={context.boolean("value")}
      onCheckedChange={(next) => context.set("value", next)}
    />
    {context.text("label") ? (
      <Label className="text-sm text-foreground">{context.text("label")}</Label>
    ) : null}
  </View>
);

type ChoiceOption = { label: string; value: string };

export const a2uiChoicePickerView: UnikitView = (context) => {
  const options = (context.value("options") as ChoiceOption[] | undefined) ?? [];
  const selected = context.stringList("value");
  const multiple = context.value("variant") === "multipleSelection";
  const label = context.text("label");
  const toggle = (option: ChoiceOption) => {
    if (multiple) {
      const next = selected.includes(option.value)
        ? selected.filter((item) => item !== option.value)
        : [...selected, option.value];
      context.set("value", next);
      return;
    }
    context.set("value", [option.value]);
  };
  return (
    <View className="flex flex-col gap-1.5">
      {label ? <Label className="text-sm text-foreground">{label}</Label> : null}
      {multiple ? (
        <View className="flex flex-col gap-1.5">
          {options.map((option) => (
            <View key={option.value} className="flex flex-row items-center gap-2">
              <Checkbox
                checked={selected.includes(option.value)}
                onCheckedChange={() => toggle(option)}
              />
              <Label className="text-sm text-foreground">{option.label}</Label>
            </View>
          ))}
        </View>
      ) : (
        <RadioGroup
          value={selected[0] ?? ""}
          onValueChange={(next) => {
            const option = options.find((item) => item.value === next);
            if (option) toggle(option);
          }}
        >
          {options.map((option) => (
            <View key={option.value} className="flex flex-row items-center gap-2">
              <RadioGroupItem value={option.value} />
              <Label className="text-sm text-foreground">{option.label}</Label>
            </View>
          ))}
        </RadioGroup>
      )}
    </View>
  );
};

export const a2uiSliderView: UnikitView = (context) => {
  const label = context.text("label");
  const min = context.number("min", 0);
  const max = context.number("max", 100);
  const steps = context.number("steps", 0);
  return (
    <View className="flex flex-col gap-1.5">
      {label ? <Label className="text-sm text-foreground">{label}</Label> : null}
      <Slider
        min={min}
        max={max}
        step={steps > 1 ? (max - min) / steps : undefined}
        value={[context.number("value", min)]}
        onValueChange={(next) => context.set("value", next[0] ?? min)}
      />
    </View>
  );
};

type TabDefinition = { title: string; child: ComponentNode<UnikitA2uiComponent> };

export const a2uiTabsView: UnikitView = (context) => {
  const tabs = (context.value("tabs") as TabDefinition[] | undefined) ?? [];
  const [active, setActive] = useState(tabs[0]?.title ?? "");
  const current = tabs.some((tab) => tab.title === active) ? active : (tabs[0]?.title ?? "");
  return (
    <Tabs value={current} onValueChange={setActive} style={context.weightStyle()}>
      <TabsList>
        {tabs.map((tab) => (
          <TabsTrigger key={tab.title} value={tab.title}>
            {tab.title}
          </TabsTrigger>
        ))}
      </TabsList>
      {tabs.map((tab) => (
        <TabsContent key={tab.title} value={tab.title}>
          {context.render(tab.child)}
        </TabsContent>
      ))}
    </Tabs>
  );
};

export const a2uiDateTimeInputView: UnikitView = (context) => {
  const label = context.text("label");
  const enableDate = context.boolean("enableDate");
  const enableTime = context.boolean("enableTime");
  const placeholder = enableDate && enableTime ? "2026-01-01T09:00" : enableDate ? "2026-01-01" : "09:00";
  return (
    <View className="flex flex-col gap-1.5">
      {label ? <Label className="text-sm text-foreground">{label}</Label> : null}
      <Input
        value={context.text("value")}
        placeholder={placeholder}
        onChangeText={(next) => context.set("value", next)}
      />
    </View>
  );
};

export const a2uiMediaStubView: UnikitView = (context) => (
  <View className="rounded-md border border-dashed border-border px-3 py-4">
    <Text className="text-sm text-muted-foreground">
      {`${context.node.type} 미디어 재생은 아직 지원되지 않아요`}
    </Text>
  </View>
);
