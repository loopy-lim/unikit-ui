import { spec } from "@a2ui/web_core";
import { z } from "zod";
import { Image, Text, View } from "@unikit-bridge/ui/primitives";

import { Alert, AlertDescription, AlertTitle } from "../components/alert";
import { AspectRatio } from "../components/aspect-ratio";
import {
  Attachment,
  AttachmentContent,
  AttachmentDescription,
  AttachmentMedia,
  AttachmentTitle,
} from "../components/attachment";
import { Avatar, AvatarFallback, AvatarImage } from "../components/avatar";
import { Badge } from "../components/badge";
import { Bubble, BubbleContent, BubbleGroup } from "../components/bubble";
import { DirectionProvider } from "../components/direction";
import { Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyTitle } from "../components/empty";
import { Item, ItemContent, ItemDescription, ItemTitle } from "../components/item";
import { Kbd } from "../components/kbd";
import { Label } from "../components/label";
import { Marker, MarkerContent } from "../components/marker";
import { Message, MessageContent } from "../components/message";
import { Progress } from "../components/progress";
import { ScrollArea } from "../components/scroll-area";
import { Skeleton } from "../components/skeleton";
import { Spinner } from "../components/spinner";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../components/table";
import {
  ChildListSchema,
  ChildSchema,
  DataBindingSchema,
  DynamicBooleanSchema,
  DynamicNumberSchema,
  DynamicStringSchema,
  FunctionCallSchema,
  WeightSchema,
} from "./schemas";
import type { UnikitA2uiComponent } from "./types";

const child = (description: string) => ChildSchema.describe(`REF:#/$defs/Child|${description}`);

const children = (description: string) =>
  ChildListSchema.describe(`REF:#/$defs/ChildList|${description}`);

const text = (description: string) =>
  DynamicStringSchema.describe(`REF:#/$defs/DynamicString|${description}`);

export function createUnikitTierAComponents(): UnikitA2uiComponent[] {
  return [
    {
      name: "Alert",
      unikit: "alert",
      tier: "a",
      schema: spec(
        z
          .object({
            variant: z
              .enum(["default", "destructive"])
              .default("default")
              .describe("The visual style of the alert.")
              .optional(),
            title: text("The title of the alert."),
            description: text("The body message of the alert.").optional(),
            children: children("Optional content rendered below the description, referred to by ID."),
            weight: WeightSchema.optional(),
          })
          .strict(),
        { mixins: [] },
      ),
      view: (context) => (
        <Alert
          variant={context.value("variant") === "destructive" ? "destructive" : "default"}
          style={context.weightStyle()}
        >
          <AlertTitle>{context.text("title")}</AlertTitle>
          {context.text("description") ? (
            <AlertDescription>{context.text("description")}</AlertDescription>
          ) : null}
          {context.children("children")}
        </Alert>
      ),
    },
    {
      name: "AspectRatio",
      unikit: "aspect-ratio",
      tier: "a",
      schema: spec(
        z
          .object({
            ratio: z.number().positive().default(1).describe("The aspect ratio as width / height."),
            child: child("The ID of the single child component."),
            weight: WeightSchema.optional(),
          })
          .strict(),
        { mixins: [] },
      ),
      view: (context) => (
        <AspectRatio ratio={context.number("ratio", 1)} style={context.weightStyle()}>
          {context.child("child")}
        </AspectRatio>
      ),
    },
    {
      name: "Attachment",
      unikit: "attachment",
      tier: "a",
      schema: spec(
        z
          .object({
            url: text("The URL of the attached media."),
            title: text("The name of the attachment.").optional(),
            description: text("Additional details about the attachment.").optional(),
            state: z
              .enum(["idle", "uploading", "processing", "error"])
              .default("idle")
              .describe("The upload state the attachment renders.")
              .optional(),
            children: children("Optional actions rendered with the attachment, referred to by ID."),
            weight: WeightSchema.optional(),
          })
          .strict(),
        { mixins: [] },
      ),
      view: (context) => (
        <Attachment
          state={context.value("state") === undefined ? undefined : (context.value("state") as "idle" | "uploading" | "processing" | "error")}
          style={context.weightStyle()}
        >
          {context.text("url") ? (
            <AttachmentMedia variant="icon">
              <Image source={{ uri: context.text("url") }} className="size-8 rounded-md" />
            </AttachmentMedia>
          ) : null}
          <AttachmentContent>
            {context.text("title") ? <AttachmentTitle>{context.text("title")}</AttachmentTitle> : null}
            {context.text("description") ? (
              <AttachmentDescription>{context.text("description")}</AttachmentDescription>
            ) : null}
          </AttachmentContent>
          {context.children("children")}
        </Attachment>
      ),
    },
    {
      name: "Avatar",
      unikit: "avatar",
      tier: "a",
      schema: spec(
        z
          .object({
            url: text("The URL of the avatar image.").optional(),
            fallback: text("Initials shown when the image fails or is absent.").optional(),
            weight: WeightSchema.optional(),
          })
          .strict(),
        { mixins: [] },
      ),
      view: (context) => (
        <Avatar style={context.weightStyle()}>
          {context.text("url") ? <AvatarImage source={{ uri: context.text("url") }} /> : null}
          <AvatarFallback>
            <Text className="text-xs text-muted-foreground">{context.text("fallback")}</Text>
          </AvatarFallback>
        </Avatar>
      ),
    },
    {
      name: "Badge",
      unikit: "badge",
      tier: "a",
      schema: spec(
        z
          .object({
            label: text("The badge text."),
            variant: z
              .enum(["default", "secondary", "destructive", "outline"])
              .default("default")
              .describe("The visual style of the badge.")
              .optional(),
            weight: WeightSchema.optional(),
          })
          .strict(),
        { mixins: [] },
      ),
      view: (context) => (
        <Badge
          variant={(context.value("variant") as "default" | "secondary" | "destructive" | "outline") ?? "default"}
          style={context.weightStyle()}
        >
          {context.text("label")}
        </Badge>
      ),
    },
    {
      name: "Bubble",
      unikit: "bubble",
      tier: "a",
      schema: spec(
        z
          .object({
            variant: z
              .enum(["default", "secondary", "muted", "tinted", "outline", "ghost", "destructive"])
              .default("default")
              .describe("The visual style of the bubble.")
              .optional(),
            align: z
              .enum(["start", "end"])
              .default("start")
              .describe("Which side of the conversation the bubble sits on.")
              .optional(),
            children: children("The bubble content, referred to by ID."),
            weight: WeightSchema.optional(),
          })
          .strict(),
        { mixins: [] },
      ),
      view: (context) => (
        <BubbleGroup>
          <Bubble
            variant={(context.value("variant") as "default" | "secondary" | "muted" | "tinted" | "outline" | "ghost" | "destructive") ?? "default"}
            align={context.value("align") === "end" ? "end" : "start"}
            style={context.weightStyle()}
          >
            <BubbleContent>{context.childrenText("children")}</BubbleContent>
          </Bubble>
        </BubbleGroup>
      ),
    },
    {
      name: "Direction",
      unikit: "direction",
      tier: "a",
      schema: spec(
        z
          .object({
            dir: z.enum(["ltr", "rtl"]).default("ltr").describe("The text direction for the subtree."),
            children: children("The content the direction applies to, referred to by ID."),
            weight: WeightSchema.optional(),
          })
          .strict(),
        { mixins: [] },
      ),
      view: (context) => (
        <DirectionProvider dir={context.value("dir") === "rtl" ? "rtl" : "ltr"}>
          <View style={context.weightStyle()}>{context.children("children")}</View>
        </DirectionProvider>
      ),
    },
    {
      name: "Empty",
      unikit: "empty",
      tier: "a",
      schema: spec(
        z
          .object({
            title: text("The heading of the empty state."),
            description: text("The explanation of the empty state.").optional(),
            children: children("Optional extra content, referred to by ID."),
            weight: WeightSchema.optional(),
          })
          .strict(),
        { mixins: [] },
      ),
      view: (context) => (
        <Empty style={context.weightStyle()}>
          <EmptyHeader>
            <EmptyTitle>{context.text("title")}</EmptyTitle>
            {context.text("description") ? (
              <EmptyDescription>{context.text("description")}</EmptyDescription>
            ) : null}
          </EmptyHeader>
          <EmptyContent>{context.children("children")}</EmptyContent>
        </Empty>
      ),
    },
    {
      name: "Item",
      unikit: "item",
      tier: "a",
      schema: spec(
        z
          .object({
            title: text("The primary label of the item.").optional(),
            description: text("The supporting detail of the item.").optional(),
            variant: z
              .enum(["default", "outline", "muted"])
              .default("default")
              .describe("The visual style of the item row.")
              .optional(),
            children: children("Optional trailing content, referred to by ID."),
            weight: WeightSchema.optional(),
          })
          .strict(),
        { mixins: [] },
      ),
      view: (context) => (
        <Item
          variant={(context.value("variant") as "default" | "outline" | "muted") ?? "default"}
          style={context.weightStyle()}
        >
          <ItemContent>
            {context.text("title") ? <ItemTitle>{context.text("title")}</ItemTitle> : null}
            {context.text("description") ? (
              <ItemDescription>{context.text("description")}</ItemDescription>
            ) : null}
          </ItemContent>
          {context.children("children")}
        </Item>
      ),
    },
    {
      name: "Kbd",
      unikit: "kbd",
      tier: "a",
      schema: spec(
        z
          .object({
            label: text("The key or combination to display."),
            weight: WeightSchema.optional(),
          })
          .strict(),
        { mixins: [] },
      ),
      view: (context) => (
        <Kbd style={context.weightStyle()}>
          <Text className="text-xs text-muted-foreground">{context.text("label")}</Text>
        </Kbd>
      ),
    },
    {
      name: "Label",
      unikit: "label",
      tier: "a",
      schema: spec(
        z
          .object({
            text: text("The label text."),
            weight: WeightSchema.optional(),
          })
          .strict(),
        { mixins: [] },
      ),
      view: (context) => (
        <Label style={context.weightStyle()}>{context.text("text")}</Label>
      ),
    },
    {
      name: "Marker",
      unikit: "marker",
      tier: "a",
      schema: spec(
        z
          .object({
            content: text("The marker text, such as a timestamp."),
            variant: z
              .enum(["default", "separator", "border"])
              .default("default")
              .describe("The visual treatment of the marker row.")
              .optional(),
            weight: WeightSchema.optional(),
          })
          .strict(),
        { mixins: [] },
      ),
      view: (context) => (
        <Marker
          variant={(context.value("variant") as "default" | "separator" | "border") ?? "default"}
          style={context.weightStyle()}
        >
          <MarkerContent>{context.text("content")}</MarkerContent>
        </Marker>
      ),
    },
    {
      name: "Message",
      unikit: "message",
      tier: "a",
      schema: spec(
        z
          .object({
            align: z
              .enum(["start", "end"])
              .default("start")
              .describe("Which side of the conversation the message sits on.")
              .optional(),
            children: children("The message content, referred to by ID."),
            weight: WeightSchema.optional(),
          })
          .strict(),
        { mixins: [] },
      ),
      view: (context) => (
        <Message align={context.value("align") === "end" ? "end" : "start"} style={context.weightStyle()}>
          <MessageContent>{context.children("children")}</MessageContent>
        </Message>
      ),
    },
    {
      name: "Progress",
      unikit: "progress",
      tier: "a",
      schema: spec(
        z
          .object({
            value: DynamicNumberSchema.describe(
              "REF:#/$defs/DynamicNumber|The current progress value.",
            ),
            max: z.number().default(100).describe("The value that means completion.").optional(),
            weight: WeightSchema.optional(),
          })
          .strict(),
        { mixins: [] },
      ),
      view: (context) => (
        <Progress
          value={context.number("value", 0)}
          max={context.number("max", 100)}
          style={context.weightStyle()}
        />
      ),
    },
    {
      name: "ScrollArea",
      unikit: "scroll-area",
      tier: "a",
      schema: spec(
        z
          .object({
            orientation: z
              .enum(["vertical", "horizontal"])
              .default("vertical")
              .describe("The scrolling axis.")
              .optional(),
            children: children("The scrollable content, referred to by ID."),
            weight: WeightSchema.optional(),
          })
          .strict(),
        { mixins: [] },
      ),
      view: (context) => (
        <ScrollArea style={context.weightStyle()}>{context.children("children")}</ScrollArea>
      ),
    },
    {
      name: "Skeleton",
      unikit: "skeleton",
      tier: "a",
      schema: spec(
        z
          .object({
            lines: z.number().int().min(1).default(1).describe("How many stacked bars to render.").optional(),
            weight: WeightSchema.optional(),
          })
          .strict(),
        { mixins: [] },
      ),
      view: (context) => (
        <View className="flex flex-col gap-2" style={context.weightStyle()}>
          {Array.from({ length: context.number("lines", 1) }, (_, index) => (
            <Skeleton key={index} className="h-4 w-full" />
          ))}
        </View>
      ),
    },
    {
      name: "Spinner",
      unikit: "spinner",
      tier: "a",
      schema: spec(
        z
          .object({
            label: text("An accessibility label for the waiting state.").optional(),
            weight: WeightSchema.optional(),
          })
          .strict(),
        { mixins: [] },
      ),
      view: (context) => <Spinner accessibilityLabel={context.text("label") || undefined} />,
    },
    {
      name: "Table",
      unikit: "table",
      tier: "a",
      schema: spec(
        z
          .object({
            caption: text("The table caption.").optional(),
            columns: z
              .array(
                spec(
                  z
                    .object({
                      label: DynamicStringSchema.describe("REF:#/$defs/DynamicString|The column heading."),
                      key: z.string().describe("The row field this column reads."),
                    })
                    .strict(),
                  { closure: "additionalProperties" },
                ),
              )
              .min(1)
              .describe("The ordered column definitions."),
            rows: z
              .union([
                z.array(
                  z.record(z.string(), z.union([z.string(), z.number(), z.boolean(), z.null()])),
                ),
                DataBindingSchema,
                FunctionCallSchema,
              ])
              .describe(
                "REF:#/$defs/DynamicValue|The row records, keyed by column key. Static records or a data model path.",
              ),
            weight: WeightSchema.optional(),
          })
          .strict(),
        { mixins: [] },
      ),
      view: (context) => {
        const columns = (context.value("columns") as Array<{ label: string; key: string }>) ?? [];
        const rows = (context.value("rows") as Array<Record<string, unknown>>) ?? [];
        return (
          <Table style={context.weightStyle()}>
            {context.text("caption") ? <TableCaption>{context.text("caption")}</TableCaption> : null}
            <TableHeader>
              <TableRow>
                {columns.map((column) => (
                  <TableHead key={column.key}>{column.label}</TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((row, index) => (
                <TableRow key={index}>
                  {columns.map((column) => (
                    <TableCell key={column.key}>
                      {row[column.key] === null || row[column.key] === undefined
                        ? ""
                        : String(row[column.key])}
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        );
      },
    },
  ];
}
