import { useState } from "react";
import { spec } from "@a2ui/web_core";
import { z } from "zod";
import { Text, View } from "@unikit-bridge/ui/primitives";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "../components/accordion";
import { ButtonGroup } from "../components/button-group";
import { Calendar } from "../components/calendar";
import { Carousel, CarouselContent, CarouselItem } from "../components/carousel";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "../components/collapsible";
import {
  Combobox,
  ComboboxContent,
  ComboboxItem,
  ComboboxList,
  ComboboxTrigger,
} from "../components/combobox";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "../components/command";
import { Input } from "../components/input";
import { InputGroup } from "../components/input-group";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "../components/input-otp";
import { Label } from "../components/label";
import { NativeSelect, NativeSelectOption } from "../components/native-select";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "../components/pagination";
import { RadioGroup, RadioGroupItem } from "../components/radio-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/select";
import { Switch } from "../components/switch";
import { Textarea } from "../components/textarea";
import { Toggle } from "../components/toggle";
import { ToggleGroup, ToggleGroupItem } from "../components/toggle-group";
import {
  ActionSchema,
  ChildListSchema,
  ChildSchema,
  DynamicBooleanSchema,
  DynamicNumberSchema,
  DynamicStringSchema,
  DynamicStringListSchema,
  WeightSchema,
} from "./schemas";
import type { ComponentNode } from "@a2ui/web_core";
import type { A2uiViewContext, UnikitA2uiComponent } from "./types";

const child = (description: string) => ChildSchema.describe(`REF:#/$defs/Child|${description}`);

const children = (description: string) =>
  ChildListSchema.describe(`REF:#/$defs/ChildList|${description}`);

const text = (description: string) =>
  DynamicStringSchema.describe(`REF:#/$defs/DynamicString|${description}`);

const action = () => ActionSchema.describe("REF:#/$defs/Action");

const optionItem = spec(
  z
    .object({
      label: DynamicStringSchema.describe("REF:#/$defs/DynamicString|The text to display for this option."),
      value: z.string().describe("The stable value associated with this option."),
    })
    .strict(),
  { closure: "additionalProperties" },
);

const options = () =>
  z.array(optionItem).describe("The list of available options to choose from.");

const fireChange = (context: A2uiViewContext) => {
  void context.action("action")?.();
};

export function createUnikitTierBComponents(): UnikitA2uiComponent[] {
  return [
    {
      name: "Accordion",
      unikit: "accordion",
      tier: "b",
      schema: spec(
        z
          .object({
            items: z
              .array(
                spec(
                  z
                    .object({
                      title: DynamicStringSchema.describe("REF:#/$defs/DynamicString|The section heading."),
                      child: ChildSchema.describe("REF:#/$defs/Child|The ID of the section content."),
                    })
                    .strict(),
                  { closure: "additionalProperties" },
                ),
              )
              .min(1)
              .describe("The accordion sections."),
            weight: WeightSchema.optional(),
          })
          .strict(),
        { mixins: [] },
      ),
      view: (context) => {
        const items = (context.value("items") as Array<{ title: string; child: ComponentNode<UnikitA2uiComponent> }>) ?? [];
        const [open, setOpen] = useState("");
        return (
          <Accordion
            type="single"
            value={open}
            onValueChange={(next) => setOpen(Array.isArray(next) ? (next[0] ?? "") : next)}
            style={context.weightStyle()}
          >
            {items.map((item) => (
              <AccordionItem key={item.title} value={item.title}>
                <AccordionTrigger>{item.title}</AccordionTrigger>
                <AccordionContent>{context.render(item.child)}</AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        );
      },
    },
    {
      name: "ButtonGroup",
      unikit: "button-group",
      tier: "b",
      schema: spec(
        z
          .object({
            orientation: z
              .enum(["horizontal", "vertical"])
              .default("horizontal")
              .describe("The arrangement of the buttons.")
              .optional(),
            children: children("The buttons in the group, referred to by ID."),
            weight: WeightSchema.optional(),
          })
          .strict(),
        { mixins: [] },
      ),
      view: (context) => (
        <ButtonGroup
          orientation={context.value("orientation") === "vertical" ? "vertical" : "horizontal"}
          style={context.weightStyle()}
        >
          {context.children("children")}
        </ButtonGroup>
      ),
    },
    {
      name: "Calendar",
      unikit: "calendar",
      tier: "b",
      schema: spec(
        z
          .object({
            value: text("The selected date in ISO 8601 format, or an empty string."),
            action: action().optional(),
            weight: WeightSchema.optional(),
          })
          .strict(),
        { mixins: [] },
      ),
      view: (context) => {
        const raw = context.text("value");
        const parsed = raw ? new Date(raw) : undefined;
        const selected = parsed && !Number.isNaN(parsed.getTime()) ? parsed : undefined;
        return (
          <Calendar
            selected={selected}
            onSelect={(date) => {
              const next = date.toISOString().slice(0, 10);
              context.set("value", next);
              fireChange(context);
            }}
            style={context.weightStyle()}
          />
        );
      },
    },
    {
      name: "Carousel",
      unikit: "carousel",
      tier: "b",
      schema: spec(
        z
          .object({
            orientation: z
              .enum(["horizontal", "vertical"])
              .default("horizontal")
              .describe("The sliding axis.")
              .optional(),
            children: children("The carousel slides, referred to by ID."),
            weight: WeightSchema.optional(),
          })
          .strict(),
        { mixins: [] },
      ),
      view: (context) => (
        <Carousel
          orientation={context.value("orientation") === "vertical" ? "vertical" : "horizontal"}
          style={context.weightStyle()}
        >
          <CarouselContent>
            {context.childNodes("children").map((node) => (
              <CarouselItem key={node.id}>{context.render(node)}</CarouselItem>
            ))}
          </CarouselContent>
        </Carousel>
      ),
    },
    {
      name: "Collapsible",
      unikit: "collapsible",
      tier: "b",
      schema: spec(
        z
          .object({
            trigger: child("The ID of the component that toggles the content."),
            content: child("The ID of the component revealed on expand."),
            weight: WeightSchema.optional(),
          })
          .strict(),
        { mixins: [] },
      ),
      view: (context) => (
        <Collapsible style={context.weightStyle()}>
          <CollapsibleTrigger>{context.child("trigger")}</CollapsibleTrigger>
          <CollapsibleContent>{context.child("content")}</CollapsibleContent>
        </Collapsible>
      ),
    },
    {
      name: "Combobox",
      unikit: "combobox",
      tier: "b",
      schema: spec(
        z
          .object({
            label: text("The label for the combobox.").optional(),
            placeholder: text("The text shown before a selection.").optional(),
            options: options(),
            value: DynamicStringSchema.describe(
              "REF:#/$defs/DynamicString|The selected option value.",
            ),
            action: action().optional(),
            weight: WeightSchema.optional(),
          })
          .strict(),
        { mixins: [] },
      ),
      view: (context) => {
        const optionList = (context.value("options") as Array<{ label: string; value: string }>) ?? [];
        const selected = context.text("value");
        const selectedLabel = optionList.find((option) => option.value === selected)?.label;
        return (
          <View className="flex flex-col gap-1.5" style={context.weightStyle()}>
            {context.text("label") ? <Label>{context.text("label")}</Label> : null}
            <Combobox
              value={selected}
              onValueChange={(next) => {
                context.set("value", next);
                fireChange(context);
              }}
            >
              <ComboboxTrigger>
                <Text className="text-sm text-foreground">
                  {selectedLabel ?? context.text("placeholder") ?? ""}
                </Text>
              </ComboboxTrigger>
              <ComboboxContent>
                <ComboboxList>
                  {optionList.map((option) => (
                    <ComboboxItem key={option.value} value={option.value}>
                      <Text className="text-sm text-foreground">{option.label}</Text>
                    </ComboboxItem>
                  ))}
                </ComboboxList>
              </ComboboxContent>
            </Combobox>
          </View>
        );
      },
    },
    {
      name: "Command",
      unikit: "command",
      tier: "b",
      schema: spec(
        z
          .object({
            placeholder: text("The search input hint.").optional(),
            emptyText: text("The text shown when nothing matches.").optional(),
            options: options(),
            value: DynamicStringSchema.describe(
              "REF:#/$defs/DynamicString|The selected option value.",
            ),
            action: action().optional(),
            weight: WeightSchema.optional(),
          })
          .strict(),
        { mixins: [] },
      ),
      view: (context) => {
        const optionList = (context.value("options") as Array<{ label: string; value: string }>) ?? [];
        return (
          <Command
            value={context.text("value")}
            onValueChange={(next) => {
              context.set("value", next);
              fireChange(context);
            }}
            style={context.weightStyle()}
          >
            <CommandInput placeholder={context.text("placeholder") || undefined} />
            <CommandList>
              <CommandEmpty>{context.text("emptyText") || "No results."}</CommandEmpty>
              <CommandGroup>
                {optionList.map((option) => (
                  <CommandItem key={option.value} value={option.value}>
                    <Text className="text-sm text-foreground">{option.label}</Text>
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        );
      },
    },
    {
      name: "Input",
      unikit: "input",
      tier: "b",
      schema: spec(
        z
          .object({
            label: text("The label for the input.").optional(),
            value: text("The current value of the input."),
            placeholder: text("The input hint.").optional(),
            obscured: DynamicBooleanSchema.describe(
              "REF:#/$defs/DynamicBoolean|Whether to mask the typed characters.",
            )
              .optional(),
            action: action().optional(),
            weight: WeightSchema.optional(),
          })
          .strict(),
        { mixins: [] },
      ),
      view: (context) => (
        <View className="flex flex-col gap-1.5" style={context.weightStyle()}>
          {context.text("label") ? <Label>{context.text("label")}</Label> : null}
          <Input
            value={context.text("value")}
            placeholder={context.text("placeholder") || undefined}
            secureTextEntry={context.boolean("obscured")}
            onChangeText={(next) => {
              context.set("value", next);
              fireChange(context);
            }}
          />
        </View>
      ),
    },
    {
      name: "InputGroup",
      unikit: "input-group",
      tier: "b",
      schema: spec(
        z
          .object({
            children: children("The input group parts, referred to by ID."),
            weight: WeightSchema.optional(),
          })
          .strict(),
        { mixins: [] },
      ),
      view: (context) => (
        <InputGroup style={context.weightStyle()}>{context.children("children")}</InputGroup>
      ),
    },
    {
      name: "InputOtp",
      unikit: "input-otp",
      tier: "b",
      schema: spec(
        z
          .object({
            label: text("The label for the input.").optional(),
            length: z.number().int().min(1).max(12).default(6).describe("How many digits to accept."),
            value: text("The current code."),
            action: action().optional(),
            weight: WeightSchema.optional(),
          })
          .strict(),
        { mixins: [] },
      ),
      view: (context) => {
        const length = context.number("length", 6);
        return (
          <View className="flex flex-col gap-1.5" style={context.weightStyle()}>
            {context.text("label") ? <Label>{context.text("label")}</Label> : null}
            <InputOTP
              value={context.text("value")}
              maxLength={length}
              onChange={(next) => {
                context.set("value", next);
                fireChange(context);
              }}
            >
              <InputOTPGroup>
                {Array.from({ length }, (_, index) => (
                  <InputOTPSlot key={index} index={index} />
                ))}
              </InputOTPGroup>
            </InputOTP>
          </View>
        );
      },
    },
    {
      name: "NativeSelect",
      unikit: "native-select",
      tier: "b",
      schema: spec(
        z
          .object({
            label: text("The label for the select.").optional(),
            placeholder: text("The text shown before a selection.").optional(),
            options: options(),
            value: DynamicStringSchema.describe(
              "REF:#/$defs/DynamicString|The selected option value.",
            ),
            action: action().optional(),
            weight: WeightSchema.optional(),
          })
          .strict(),
        { mixins: [] },
      ),
      view: (context) => {
        const optionList = (context.value("options") as Array<{ label: string; value: string }>) ?? [];
        return (
          <View className="flex flex-col gap-1.5" style={context.weightStyle()}>
            {context.text("label") ? <Label>{context.text("label")}</Label> : null}
            <NativeSelect
              value={context.text("value")}
              onValueChange={(next) => {
                context.set("value", next);
                fireChange(context);
              }}
            >
              {optionList.map((option) => (
                <NativeSelectOption key={option.value} value={option.value}>
                  {option.label}
                </NativeSelectOption>
              ))}
            </NativeSelect>
          </View>
        );
      },
    },
    {
      name: "Pagination",
      unikit: "pagination",
      tier: "b",
      schema: spec(
        z
          .object({
            page: DynamicNumberSchema.describe("REF:#/$defs/DynamicNumber|The current page number."),
            totalPages: z.number().int().min(1).describe("How many pages exist."),
            action: action().optional(),
            weight: WeightSchema.optional(),
          })
          .strict(),
        { mixins: [] },
      ),
      view: (context) => {
        const totalPages = context.number("totalPages", 1);
        const current = Math.min(Math.max(1, context.number("page", 1)), totalPages);
        const goTo = (page: number) => {
          context.set("page", page);
          fireChange(context);
        };
        return (
          <Pagination style={context.weightStyle()}>
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious onPress={() => goTo(Math.max(1, current - 1))} />
              </PaginationItem>
              {Array.from({ length: totalPages }, (_, index) => index + 1)
                .filter((page) => Math.abs(page - current) <= 1 || page === 1 || page === totalPages)
                .map((page) => (
                  <PaginationItem key={page}>
                    <PaginationLink isActive={page === current} onPress={() => goTo(page)}>
                      {String(page)}
                    </PaginationLink>
                  </PaginationItem>
                ))}
              <PaginationItem>
                <PaginationNext onPress={() => goTo(Math.min(totalPages, current + 1))} />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        );
      },
    },
    {
      name: "RadioGroup",
      unikit: "radio-group",
      tier: "b",
      schema: spec(
        z
          .object({
            label: text("The label for the group.").optional(),
            options: options(),
            value: DynamicStringSchema.describe(
              "REF:#/$defs/DynamicString|The selected option value.",
            ),
            action: action().optional(),
            weight: WeightSchema.optional(),
          })
          .strict(),
        { mixins: [] },
      ),
      view: (context) => {
        const optionList = (context.value("options") as Array<{ label: string; value: string }>) ?? [];
        return (
          <View className="flex flex-col gap-1.5" style={context.weightStyle()}>
            {context.text("label") ? <Label>{context.text("label")}</Label> : null}
            <RadioGroup
              value={context.text("value")}
              onValueChange={(next) => {
                context.set("value", next);
                fireChange(context);
              }}
            >
              {optionList.map((option) => (
                <View key={option.value} className="flex flex-row items-center gap-2">
                  <RadioGroupItem value={option.value} />
                  <Label className="text-sm text-foreground">{option.label}</Label>
                </View>
              ))}
            </RadioGroup>
          </View>
        );
      },
    },
    {
      name: "Select",
      unikit: "select",
      tier: "b",
      schema: spec(
        z
          .object({
            label: text("The label for the select.").optional(),
            placeholder: text("The text shown before a selection.").optional(),
            options: options(),
            value: DynamicStringSchema.describe(
              "REF:#/$defs/DynamicString|The selected option value.",
            ),
            action: action().optional(),
            weight: WeightSchema.optional(),
          })
          .strict(),
        { mixins: [] },
      ),
      view: (context) => {
        const optionList = (context.value("options") as Array<{ label: string; value: string }>) ?? [];
        return (
          <View className="flex flex-col gap-1.5" style={context.weightStyle()}>
            {context.text("label") ? <Label>{context.text("label")}</Label> : null}
            <Select
              value={context.text("value")}
              onValueChange={(next) => {
                context.set("value", next);
                fireChange(context);
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder={context.text("placeholder") || undefined} />
              </SelectTrigger>
              <SelectContent>
                {optionList.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </View>
        );
      },
    },
    {
      name: "Switch",
      unikit: "switch",
      tier: "b",
      schema: spec(
        z
          .object({
            label: text("The label next to the switch.").optional(),
            value: DynamicBooleanSchema.describe(
              "REF:#/$defs/DynamicBoolean|Whether the switch is on.",
            ),
            action: action().optional(),
            weight: WeightSchema.optional(),
          })
          .strict(),
        { mixins: [] },
      ),
      view: (context) => (
        <View className="flex flex-row items-center gap-2" style={context.weightStyle()}>
          <Switch
            checked={context.boolean("value")}
            onCheckedChange={(next) => {
              context.set("value", next);
              fireChange(context);
            }}
          />
          {context.text("label") ? <Label className="text-sm text-foreground">{context.text("label")}</Label> : null}
        </View>
      ),
    },
    {
      name: "Textarea",
      unikit: "textarea",
      tier: "b",
      schema: spec(
        z
          .object({
            label: text("The label for the textarea.").optional(),
            value: text("The current value."),
            placeholder: text("The input hint.").optional(),
            action: action().optional(),
            weight: WeightSchema.optional(),
          })
          .strict(),
        { mixins: [] },
      ),
      view: (context) => (
        <View className="flex flex-col gap-1.5" style={context.weightStyle()}>
          {context.text("label") ? <Label>{context.text("label")}</Label> : null}
          <Textarea
            value={context.text("value")}
            placeholder={context.text("placeholder") || undefined}
            onChangeText={(next) => {
              context.set("value", next);
              fireChange(context);
            }}
          />
        </View>
      ),
    },
    {
      name: "Toggle",
      unikit: "toggle",
      tier: "b",
      schema: spec(
        z
          .object({
            label: text("The toggle text."),
            pressed: DynamicBooleanSchema.describe(
              "REF:#/$defs/DynamicBoolean|Whether the toggle is engaged.",
            ),
            variant: z
              .enum(["default", "outline"])
              .default("default")
              .describe("The visual style of the toggle.")
              .optional(),
            action: action().optional(),
            weight: WeightSchema.optional(),
          })
          .strict(),
        { mixins: [] },
      ),
      view: (context) => (
        <Toggle
          pressed={context.boolean("pressed")}
          variant={(context.value("variant") as "default" | "outline") ?? "default"}
          onPressedChange={(next) => {
            context.set("pressed", next);
            fireChange(context);
          }}
          style={context.weightStyle()}
        >
          <Text className="text-sm text-foreground">{context.text("label")}</Text>
        </Toggle>
      ),
    },
    {
      name: "ToggleGroup",
      unikit: "toggle-group",
      tier: "b",
      schema: spec(
        z
          .object({
            options: options(),
            value: DynamicStringListSchema.describe(
              "REF:#/$defs/DynamicStringList|The engaged option values.",
            ),
            multiple: z
              .boolean()
              .default(false)
              .describe("Whether several options can stay engaged.")
              .optional(),
            action: action().optional(),
            weight: WeightSchema.optional(),
          })
          .strict(),
        { mixins: [] },
      ),
      view: (context) => {
        const optionList = (context.value("options") as Array<{ label: string; value: string }>) ?? [];
        const selected = context.stringList("value");
        const multiple = context.boolean("multiple");
        const commit = (values: string[]) => {
          context.set("value", values);
          fireChange(context);
        };
        return (
          <ToggleGroup
            {...(multiple
              ? {
                  type: "multiple" as const,
                  value: selected,
                  onValueChange: (next: string[]) => commit(next),
                }
              : {
                  type: "single" as const,
                  value: selected[0] ?? "",
                  onValueChange: (next: string) => commit(next ? [next] : []),
                })}
            style={context.weightStyle()}
          >
            {optionList.map((option) => (
              <ToggleGroupItem key={option.value} value={option.value}>
                <Text className="text-sm text-foreground">{option.label}</Text>
              </ToggleGroupItem>
            ))}
          </ToggleGroup>
        );
      },
    },
  ];
}
