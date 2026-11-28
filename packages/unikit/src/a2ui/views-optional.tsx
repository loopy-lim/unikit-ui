import { spec } from "@a2ui/web_core";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { Text, View } from "@unikit-bridge/ui/primitives";

import { Button } from "../components/button";
import { Form } from "../components/form";
import { ChartPath, ChartRect, ChartSurface } from "@unikit-bridge/ui/chart";
import {
  ActionSchema,
  ChildListSchema,
  DataBindingSchema,
  DynamicStringSchema,
  FunctionCallSchema,
  WeightSchema,
} from "./schemas";
import type { UnikitA2uiComponent } from "./types";

const children = (description: string) =>
  ChildListSchema.describe(`REF:#/$defs/ChildList|${description}`);

const chartPoint = spec(
  z
    .object({
      x: z.number().describe("The horizontal position of the point."),
      y: z.number().describe("The value of the point."),
    })
    .strict(),
  { closure: "additionalProperties" },
);

const CHART_WIDTH = 320;
const CHART_HEIGHT = 160;
const CHART_PADDING = 8;

export function createUnikitOptionalComponents(): UnikitA2uiComponent[] {
  return [
    {
      name: "Chart",
      unikit: "chart",
      tier: "a",
      schema: spec(
        z
          .object({
            kind: z
              .enum(["line", "bars"])
              .default("line")
              .describe("The chart shape drawn for the series.")
              .optional(),
            caption: DynamicStringSchema.describe(
              "REF:#/$defs/DynamicString|The chart caption.",
            ).optional(),
            data: z
              .union([z.array(chartPoint), DataBindingSchema, FunctionCallSchema])
              .describe(
                "REF:#/$defs/DynamicValue|The series points, static records or a data model path.",
              ),
            weight: WeightSchema.optional(),
          })
          .strict(),
        { mixins: [] },
      ),
      view: (context) => {
        const points = (context.value("data") as Array<{ x: number; y: number }>) ?? [];
        const ys = points.map((point) => point.y);
        const minY = Math.min(...ys, 0);
        const maxY = Math.max(...ys, 1);
        const spanY = maxY - minY || 1;
        const innerWidth = CHART_WIDTH - CHART_PADDING * 2;
        const innerHeight = CHART_HEIGHT - CHART_PADDING * 2;
        const scaleY = (value: number) =>
          CHART_PADDING + innerHeight - ((value - minY) / spanY) * innerHeight;
        const pointX = (index: number) =>
          points.length <= 1
            ? CHART_PADDING + innerWidth / 2
            : CHART_PADDING + (index / (points.length - 1)) * innerWidth;
        const kind = context.value("kind") === "bars" ? "bars" : "line";
        return (
          <View className="flex flex-col gap-2" style={context.weightStyle()}>
            <ChartSurface
              width={CHART_WIDTH}
              height={CHART_HEIGHT}
              className="w-full"
              accessibilityLabel={context.text("caption") || "chart"}
            >
              {kind === "line" ? (
                <ChartPath
                  className="stroke-primary"
                  strokeWidth={2}
                  fill="none"
                  d={points
                    .map(
                      (point, index) =>
                        `${index === 0 ? "M" : "L"}${pointX(index)},${scaleY(point.y)}`,
                    )
                    .join(" ")}
                />
              ) : (
                points.map((point, index) => {
                  const barWidth = innerWidth / Math.max(points.length, 1);
                  const barHeight = Math.max(((point.y - minY) / spanY) * innerHeight, 1);
                  return (
                    <ChartRect
                      key={index}
                      className="fill-primary"
                      x={CHART_PADDING + index * barWidth + barWidth * 0.15}
                      y={CHART_PADDING + innerHeight - barHeight}
                      width={barWidth * 0.7}
                      height={barHeight}
                      rx={2}
                    />
                  );
                })
              )}
            </ChartSurface>
            {context.text("caption") ? (
              <Text className="text-sm text-muted-foreground">{context.text("caption")}</Text>
            ) : null}
          </View>
        );
      },
    },
    {
      name: "Form",
      unikit: "form",
      tier: "c",
      schema: spec(
        z
          .object({
            children: children("The form fields, referred to by ID."),
            submitLabel: DynamicStringSchema.describe(
              "REF:#/$defs/DynamicString|The submit button text.",
            ).optional(),
            action: ActionSchema.describe("REF:#/$defs/Action"),
            weight: WeightSchema.optional(),
          })
          .strict(),
        { mixins: [] },
      ),
      view: (context) => {
        const form = useForm();
        return (
          <View className="flex flex-col gap-4" style={context.weightStyle()}>
            <Form {...form}>{context.children("children")}</Form>
            <Button variant="default" onPress={() => void context.action("action")?.()}>
              {context.text("submitLabel") || "보내기"}
            </Button>
          </View>
        );
      },
    },
  ];
}
