import { Catalog, spec, type FunctionImplementation } from "@a2ui/web_core";
import { z } from "zod";

import { A2UI_BASIC_CATALOG_INSTRUCTIONS } from "./basic-instructions";
import { createA2uiBasicFunctions } from "./functions";
import {
  ActionSchema,
  ChildListSchema,
  ChildSchema,
  CheckRuleSchema,
  DataBindingSchema,
  DynamicBooleanSchema,
  DynamicNumberSchema,
  DynamicStringSchema,
  DynamicStringListSchema,
  DynamicValueSchema,
  ICON_NAMES,
  WeightSchema,
} from "./schemas";
import { BASIC_CATALOG_ID, type UnikitA2uiComponent, type UnikitView } from "./types";
import {
  a2uiButtonView,
  a2uiCardView,
  a2uiCheckBoxView,
  a2uiChoicePickerView,
  a2uiColumnView,
  a2uiDateTimeInputView,
  a2uiDividerView,
  a2uiIconView,
  a2uiImageView,
  a2uiListView,
  a2uiMediaStubView,
  a2uiRowView,
  a2uiSliderView,
  a2uiTabsView,
  a2uiTextView,
  a2uiTextFieldView,
} from "./views";
import { Dialog, DialogContent, DialogTrigger } from "../components/dialog";

const a2uiModalView: UnikitView = (context) => (
  <Dialog>
    <DialogTrigger>{context.child("trigger")}</DialogTrigger>
    <DialogContent className="sm:max-w-md">{context.child("content")}</DialogContent>
  </Dialog>
);

const checkableChecks = () =>
  z
    .array(CheckRuleSchema.describe("REF:#/$defs/CheckRule"))
    .describe("A list of validation check rules to perform on the component.")
    .optional();

const childList = (description: string) => ChildListSchema.describe(description);

const CHILDREN_LAYOUT = childList(
  "REF:#/$defs/ChildList|Defines the children. Use an array of strings for a fixed set of children, or a template object to generate children from a data list. Children cannot be defined inline, they must be referred to by ID.",
);

const CHILDREN_LIST = childList(
  "REF:#/$defs/ChildList|Defines the children. Use an array of strings for a fixed set of children, or a template object to generate children from a data list.",
);

const CHILD_CARD = ChildSchema.describe(
  "REF:#/$defs/Child|The ID of the single child component to be rendered inside the card. To display multiple elements, you MUST wrap them in a layout component (like Column or Row) and pass that container's ID here. Do NOT pass multiple IDs or a non-existent ID.",
);

const CHILD_BUTTON = ChildSchema.describe(
  "REF:#/$defs/Child|The ID of the child component. Use a 'Text' component for a labeled button. Only use an 'Icon' if the requirements explicitly ask for an icon-only button.",
);

const DATE_BOUND = (description: string) =>
  spec(DynamicStringSchema.describe(`REF:#/$defs/DynamicString|${description}`), {
    allOf: [
      {
        if: { type: "string" },
        then: { oneOf: [{ format: "date" }, { format: "time" }, { format: "date-time" }] },
      },
    ],
  });

export function createA2uiBasicComponents(): UnikitA2uiComponent[] {
  return [
    {
      name: "Text",
      schema: spec(
        z
          .object({
            text: DynamicStringSchema.describe(
              "REF:#/$defs/DynamicString|The text content to display. While simple Markdown formatting is supported (i.e. without HTML, images, or links), utilizing dedicated UI components is generally preferred for a richer and more structured presentation.",
            ),
            variant: z
              .enum(["caption", "body"])
              .default("body")
              .describe("A hint for the base text style.")
              .optional(),
            weight: WeightSchema.optional(),
          })
          .strict(),
        { mixins: [] },
      ),
      tier: "basic",
      unikit: null,
      view: a2uiTextView,
    },
    {
      name: "Image",
      schema: spec(
        z
          .object({
            url: DynamicStringSchema.describe("REF:#/$defs/DynamicString|The URL of the image to display."),
            description: DynamicStringSchema.describe(
              "REF:#/$defs/DynamicString|Accessibility text for the image.",
            ).optional(),
            fit: z
              .enum(["contain", "cover", "fill", "none", "scaleDown"])
              .default("fill")
              .describe(
                "Specifies how the image should be resized to fit its container. This corresponds to the CSS 'object-fit' property.",
              )
              .optional(),
            variant: z
              .enum(["icon", "avatar", "smallFeature", "mediumFeature", "largeFeature", "header"])
              .default("mediumFeature")
              .describe("A hint for the image size and style.")
              .optional(),
            weight: WeightSchema.optional(),
          })
          .strict(),
        { mixins: [] },
      ),
      tier: "basic",
      unikit: null,
      view: a2uiImageView,
    },
    {
      name: "Icon",
      schema: spec(
        z
          .object({
            name: z
              .union([
                z.enum(ICON_NAMES),
                spec(z.object({ svgPath: DynamicStringSchema.describe("REF:#/$defs/DynamicString") }), {
                  closure: "additionalProperties",
                }),
                DataBindingSchema.describe("REF:#/$defs/DataBinding"),
              ])
              .describe("The name of the icon to display."),
            weight: WeightSchema.optional(),
          })
          .strict(),
        { mixins: [] },
      ),
      tier: "basic",
      unikit: null,
      view: a2uiIconView,
    },
    {
      name: "Video",
      schema: spec(
        z
          .object({
            url: DynamicStringSchema.describe("REF:#/$defs/DynamicString|The URL of the video to display."),
            posterUrl: DynamicStringSchema.describe(
              "REF:#/$defs/DynamicString|The URL of the poster image to display before the video plays.",
            ).optional(),
            weight: WeightSchema.optional(),
          })
          .strict(),
        { mixins: [] },
      ),
      tier: "basic",
      unikit: null,
      view: a2uiMediaStubView,
    },
    {
      name: "AudioPlayer",
      schema: spec(
        z
          .object({
            url: DynamicStringSchema.describe("REF:#/$defs/DynamicString|The URL of the audio to be played."),
            description: DynamicStringSchema.describe(
              "REF:#/$defs/DynamicString|A description of the audio, such as a title or summary.",
            ).optional(),
            weight: WeightSchema.optional(),
          })
          .strict(),
        { mixins: [] },
      ),
      tier: "basic",
      unikit: null,
      view: a2uiMediaStubView,
    },
    {
      name: "Row",
      schema: spec(
        z
          .object({
            children: CHILDREN_LAYOUT,
            justify: z
              .enum(["center", "end", "spaceAround", "spaceBetween", "spaceEvenly", "start", "stretch"])
              .default("start")
              .describe(
                "Defines the arrangement of children along the main axis (horizontally). Use 'spaceBetween' to push items to the edges, or 'start'/'end'/'center' to pack them together.",
              )
              .optional(),
            align: z
              .enum(["start", "center", "end", "stretch"])
              .default("stretch")
              .describe(
                "Defines the alignment of children along the cross axis (vertically). This is similar to the CSS 'align-items' property, but uses camelCase values (e.g., 'start').",
              )
              .optional(),
            weight: WeightSchema.optional(),
          })
          .describe(
            "A layout component that arranges its children horizontally. To create a grid layout, nest Columns within this Row.",
          )
          .strict(),
        { mixins: [] },
      ),
      tier: "basic",
      unikit: null,
      view: a2uiRowView,
    },
    {
      name: "Column",
      schema: spec(
        z
          .object({
            children: CHILDREN_LAYOUT,
            justify: z
              .enum(["start", "center", "end", "spaceBetween", "spaceAround", "spaceEvenly", "stretch"])
              .default("start")
              .describe(
                "Defines the arrangement of children along the main axis (vertically). Use 'spaceBetween' to push items to the edges (e.g. header at top, footer at bottom), or 'start'/'end'/'center' to pack them together.",
              )
              .optional(),
            align: z
              .enum(["center", "end", "start", "stretch"])
              .default("stretch")
              .describe(
                "Defines the alignment of children along the cross axis (horizontally). This is similar to the CSS 'align-items' property.",
              )
              .optional(),
            weight: WeightSchema.optional(),
          })
          .describe(
            "A layout component that arranges its children vertically. To create a grid layout, nest Rows within this Column.",
          )
          .strict(),
        { mixins: [] },
      ),
      tier: "basic",
      unikit: null,
      view: a2uiColumnView,
    },
    {
      name: "List",
      schema: spec(
        z
          .object({
            children: CHILDREN_LIST,
            direction: z
              .enum(["vertical", "horizontal"])
              .default("vertical")
              .describe("The direction in which the list items are laid out.")
              .optional(),
            align: z
              .enum(["start", "center", "end", "stretch"])
              .default("stretch")
              .describe("Defines the alignment of children along the cross axis.")
              .optional(),
            weight: WeightSchema.optional(),
          })
          .strict(),
        { mixins: [] },
      ),
      tier: "basic",
      unikit: null,
      view: a2uiListView,
    },
    {
      name: "Card",
      schema: spec(
        z
          .object({
            child: CHILD_CARD,
            weight: WeightSchema.optional(),
          })
          .strict(),
        { mixins: [] },
      ),
      tier: "basic",
      unikit: null,
      view: a2uiCardView,
    },
    {
      name: "Tabs",
      schema: spec(
        z
          .object({
            tabs: z
              .array(
                spec(
                  z
                    .object({
                      title: DynamicStringSchema.describe("REF:#/$defs/DynamicString|The tab title."),
                      child: ChildSchema.describe("REF:#/$defs/Child|The ID of the child component."),
                    })
                    .strict(),
                  { closure: "additionalProperties" },
                ),
              )
              .min(1)
              .describe(
                "An array of objects, where each object defines a tab with a title and a child component.",
              ),
            weight: WeightSchema.optional(),
          })
          .strict(),
        { mixins: [] },
      ),
      tier: "basic",
      unikit: null,
      view: a2uiTabsView,
    },
    {
      name: "Modal",
      schema: spec(
        z
          .object({
            trigger: ChildSchema.describe(
              "REF:#/$defs/Child|The ID of the component that opens the modal when interacted with (e.g., a button).",
            ),
            content: ChildSchema.describe(
              "REF:#/$defs/Child|The ID of the component to be displayed inside the modal.",
            ),
            weight: WeightSchema.optional(),
          })
          .strict(),
        { mixins: [] },
      ),
      tier: "basic",
      unikit: null,
      view: a2uiModalView,
    },
    {
      name: "Divider",
      schema: spec(
        z
          .object({
            axis: z
              .enum(["horizontal", "vertical"])
              .default("horizontal")
              .describe("The orientation of the divider.")
              .optional(),
            weight: WeightSchema.optional(),
          })
          .strict(),
        { mixins: [] },
      ),
      tier: "basic",
      unikit: null,
      view: a2uiDividerView,
    },
    {
      name: "Button",
      schema: spec(
        z
          .object({
            "@checks": checkableChecks(),
            child: CHILD_BUTTON,
            variant: z
              .enum(["default", "primary", "borderless"])
              .default("default")
              .describe(
                "A hint for the button style. If omitted, a default button style is used. 'primary' indicates this is the main call-to-action button. 'borderless' means the button has no visual border or background, making its child content appear like a clickable link.",
              )
              .optional(),
            action: ActionSchema.describe("REF:#/$defs/Action"),
            weight: WeightSchema.optional(),
          })
          .strict(),
        { mixins: ["Checkable"] },
      ),
      tier: "basic",
      unikit: null,
      view: a2uiButtonView,
    },
    {
      name: "TextField",
      schema: spec(
        z
          .object({
            "@checks": checkableChecks(),
            label: DynamicStringSchema.describe(
              "REF:#/$defs/DynamicString|The text label for the input field.",
            ),
            value: DynamicStringSchema.describe("REF:#/$defs/DynamicString|The value of the text field."),
            placeholder: DynamicStringSchema.describe(
              "REF:#/$defs/DynamicString|The placeholder text for the input field.",
            ).optional(),
            variant: z
              .enum(["longText", "number", "shortText", "obscured"])
              .default("shortText")
              .describe("The type of input field to display.")
              .optional(),
            weight: WeightSchema.optional(),
          })
          .strict(),
        { mixins: ["Checkable"] },
      ),
      tier: "basic",
      unikit: null,
      view: a2uiTextFieldView,
    },
    {
      name: "CheckBox",
      schema: spec(
        z
          .object({
            "@checks": checkableChecks(),
            label: DynamicStringSchema.describe(
              "REF:#/$defs/DynamicString|The text to display next to the checkbox.",
            ),
            value: DynamicBooleanSchema.describe(
              "REF:#/$defs/DynamicBoolean|The current state of the checkbox (true for checked, false for unchecked).",
            ),
            weight: WeightSchema.optional(),
          })
          .strict(),
        { mixins: ["Checkable"] },
      ),
      tier: "basic",
      unikit: null,
      view: a2uiCheckBoxView,
    },
    {
      name: "ChoicePicker",
      schema: spec(
        z
          .object({
            "@checks": checkableChecks(),
            label: DynamicStringSchema.describe(
              "REF:#/$defs/DynamicString|The label for the group of options.",
            ).optional(),
            variant: z
              .enum(["multipleSelection", "mutuallyExclusive"])
              .default("mutuallyExclusive")
              .describe("A hint for how the choice picker should be displayed and behave.")
              .optional(),
            options: z
              .array(
                spec(
                  z
                    .object({
                      label: DynamicStringSchema.describe(
                        "REF:#/$defs/DynamicString|The text to display for this option.",
                      ),
                      value: z.string().describe("The stable value associated with this option."),
                    })
                    .strict(),
                  { closure: "additionalProperties" },
                ),
              )
              .describe("The list of available options to choose from."),
            value: DynamicStringListSchema.describe(
              "REF:#/$defs/DynamicStringList|The list of currently selected values. This should be bound to a string array in the data model.",
            ),
            displayStyle: z
              .enum(["checkbox", "chips"])
              .default("checkbox")
              .describe("The display style of the component.")
              .optional(),
            filterable: z
              .boolean()
              .default(false)
              .describe("If true, displays a search input to filter the options.")
              .optional(),
            weight: WeightSchema.optional(),
          })
          .describe("A component that allows selecting one or more options from a list.")
          .strict(),
        { mixins: ["Checkable"] },
      ),
      tier: "basic",
      unikit: null,
      view: a2uiChoicePickerView,
    },
    {
      name: "Slider",
      schema: spec(
        z
          .object({
            "@checks": checkableChecks(),
            label: DynamicStringSchema.describe(
              "REF:#/$defs/DynamicString|The label for the slider.",
            ).optional(),
            min: z.number().default(0).describe("The minimum value of the slider.").optional(),
            max: z.number().describe("The maximum value of the slider."),
            value: DynamicNumberSchema.describe(
              "REF:#/$defs/DynamicNumber|The current value of the slider.",
            ),
            steps: z
              .number()
              .int()
              .min(1)
              .describe(
                "The number of discrete divisions in the slider range. If specified, the slider will snap to discrete values.",
              )
              .optional(),
            weight: WeightSchema.optional(),
          })
          .strict(),
        { mixins: ["Checkable"], required: ["value", "max"] },
      ),
      tier: "basic",
      unikit: null,
      view: a2uiSliderView,
    },
    {
      name: "DateTimeInput",
      schema: spec(
        z
          .object({
            "@checks": checkableChecks(),
            value: DynamicStringSchema.describe(
              "REF:#/$defs/DynamicString|The selected date and/or time value in ISO 8601 format. If not yet set, initialize with an empty string.",
            ),
            enableDate: z
              .boolean()
              .default(false)
              .describe("If true, allows the user to select a date.")
              .optional(),
            enableTime: z
              .boolean()
              .default(false)
              .describe("If true, allows the user to select a time.")
              .optional(),
            min: DATE_BOUND("The minimum allowed date/time in ISO 8601 format.").optional(),
            max: DATE_BOUND("The maximum allowed date/time in ISO 8601 format.").optional(),
            label: DynamicStringSchema.describe(
              "REF:#/$defs/DynamicString|The text label for the input field.",
            ).optional(),
            weight: WeightSchema.optional(),
          })
          .strict(),
        { mixins: ["Checkable"] },
      ),
      tier: "basic",
      unikit: null,
      view: a2uiDateTimeInputView,
    },
  ];
}

export type A2uiBasicCatalogOptions = {
  locale?: string;
  catalogId?: string;
  instructions?: string;
};

export function createA2uiBasicCatalog(options?: A2uiBasicCatalogOptions): Catalog<
  UnikitA2uiComponent,
  FunctionImplementation
> {
  return new Catalog(BASIC_CATALOG_ID, "1.0", createA2uiBasicComponents(), createA2uiBasicFunctions(options), {
    title: "A2UI Basic Catalog",
    description: "Unified catalog of basic A2UI components and functions.",
    instructions: options?.instructions ?? A2UI_BASIC_CATALOG_INSTRUCTIONS,
    schemaId: BASIC_CATALOG_ID,
    schemaUri: "https://json-schema.org/draft/2020-12/schema",
  });
}
