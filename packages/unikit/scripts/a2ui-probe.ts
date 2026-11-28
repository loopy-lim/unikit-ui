import {
  Catalog,
  MessageProcessor,
  NodeResolver,
  ResolvedBinding,
  WritableBinding,
  getValue,
  spec,
  specDef,
} from "@a2ui/web_core";
import { z } from "zod";

const DataBinding = z
  .object({ "@path": z.string().optional(), path: z.string().optional() })
  .describe("REF:#/$defs/DataBinding");
const FunctionCall = z.record(z.string(), z.any()).describe("REF:#/$defs/FunctionCall");
const DynamicString = z.union([z.string(), DataBinding, FunctionCall]).describe("REF:#/$defs/DynamicString");
const DynamicBoolean = z.union([z.boolean(), DataBinding, FunctionCall]).describe("REF:#/$defs/DynamicBoolean");
const Child = z.string().describe("REF:#/$defs/Child|The ID of the child component.");
const ChildList = z
  .union([z.array(Child), z.object({ componentId: z.string(), path: z.string() }).strict()])
  .describe("REF:#/$defs/ChildList");
const Action = z
  .union([
    z.object({ event: z.object({ name: z.string() }).strict() }).strict(),
    z.object({ functionCall: FunctionCall }).strict(),
  ])
  .describe("REF:#/$defs/Action");
const Weight = specDef("Weight", z.number());
const CheckRule = z
  .object({ condition: z.union([DataBinding, FunctionCall]), message: z.string().optional() })
  .strict()
  .describe("REF:#/$defs/CheckRule");

const Column = {
  name: "Column",
  schema: spec(z.object({ children: ChildList.optional(), weight: Weight.optional() }).strict(), { mixins: [] }),
};
const Text = {
  name: "Text",
  schema: spec(z.object({ text: DynamicString }).strict(), { mixins: [] }),
};
const Button = {
  name: "Button",
  schema: spec(
    z.object({ child: Child, action: Action, weight: Weight.optional() }).strict(),
    { mixins: [] },
  ),
};
const CheckBox = {
  name: "CheckBox",
  schema: spec(
    z
      .object({
        label: DynamicString,
        value: DynamicBoolean,
        "@checks": z.array(CheckRule).optional(),
        onValueChange: Action.optional(),
      })
      .strict(),
    { mixins: ["Checkable"] },
  ),
};

const catalog = new Catalog("https://example.com/unikit-probe.json", "1.0", [
  Column,
  Text,
  Button,
  CheckBox,
]);

const messages = [
  { version: "1.0", createSurface: { surfaceId: "s1", catalogId: catalog.id } },
  { version: "1.0", updateDataModel: { surfaceId: "s1", value: { greeting: "bonjour", flag: true } } },
  {
    version: "1.0",
    updateComponents: {
      surfaceId: "s1",
      components: [
        { id: "root", component: "Column", children: ["t", "b1", "cb"] },
        { id: "t", component: "Text", text: { "@path": "/greeting" } },
        { id: "b1", component: "Button", child: "t2", action: { event: { name: "clicked" } } },
        { id: "t2", component: "Text", text: "press me" },
        { id: "cb", component: "CheckBox", label: "check", value: { "@path": "/flag" } },
      ],
    },
  },
];

const proc = new MessageProcessor([catalog], undefined, { version: "1.0" });
const errors = proc.processMessagesWithErrors(messages);
console.log("errors:", JSON.stringify(errors.map((e) => ({ code: e.code, msg: e.message?.slice(0, 140) }))));

const actions: unknown[] = [];
proc.model.onAction.subscribe((p) => actions.push(p));
const surface = proc.model.getSurface("s1");
const resolver = new NodeResolver(surface);
const root = getValue(resolver.rootNode);
console.log("root:", root?.type, root?.state);

const props = getValue(root.props);
const textNode = props.children[0];
const rawText = getValue(textNode.props)["text"];
console.log(
  "dynamic text ctor:", rawText?.constructor?.name,
  "| RB:", rawText instanceof ResolvedBinding,
  "| writable:", rawText instanceof WritableBinding,
  "| value:", rawText instanceof ResolvedBinding ? rawText.value : rawText,
);

const cbNode = props.children[2];
const cbProps = getValue(cbNode.props);
const rawValue = cbProps["value"];
console.log(
  "checkbox value ctor:", rawValue?.constructor?.name,
  "| writable:", rawValue instanceof WritableBinding,
  "| value:", rawValue instanceof ResolvedBinding ? rawValue.value : rawValue,
);
if (rawValue instanceof WritableBinding) {
  rawValue.set(false);
  console.log("after set(false):", getValue(cbNode.props)["value"]?.value ?? getValue(cbNode.props)["value"]);
}

const btn = props.children[1];
getValue(btn.props)["action"]?.();
console.log("actions:", JSON.stringify(actions.map((a) => ({ name: (a as { name: string }).name }))));

resolver.dispose();
proc.processMessages([{ version: "1.0", deleteSurface: { surfaceId: "s1" } }]);
console.log("deleted:", proc.model.getSurface("s1") === undefined);
