import type { ProcessableMessagePayload } from "@a2ui/web_core";

export const A2UI_DEMO_MESSAGES: ProcessableMessagePayload = [
  {
    version: "1.0",
    createSurface: {
      surfaceId: "demo",
      catalogId: "urn:unikit:a2ui:catalog:v1",
      components: [
        {
          id: "root",
          component: "Column",
          children: ["header", "greeting", "counterRow", "agreeCheck", "submitRow"],
        },
        {
          id: "header",
          component: "Text",
          text: "A2UI 데모",
        },
        {
          id: "greeting",
          component: "Text",
          text: { "@call": "formatString", args: { value: "안녕하세요, ${/user/name}님!" } },
        },
        {
          id: "counterRow",
          component: "Row",
          children: ["decrement", "countText", "increment"],
          justify: "center",
          align: "center",
        },
        {
          id: "decrement",
          component: "Button",
          child: "decrementLabel",
          action: { event: { name: "decrement" } },
        },
        { id: "decrementLabel", component: "Text", text: "−" },
        {
          id: "countText",
          component: "Text",
          text: {
            "@call": "formatString",
            args: { value: "횟수: ${/counter/value}" },
          },
        },
        {
          id: "increment",
          component: "Button",
          child: "incrementLabel",
          variant: "primary",
          action: { event: { name: "increment" } },
        },
        { id: "incrementLabel", component: "Text", text: "+" },
        {
          id: "agreeCheck",
          component: "CheckBox",
          label: "약관에 동의해요",
          value: { "@path": "/form/agreed" },
        },
        {
          id: "submitRow",
          component: "Row",
          children: ["submit"],
        },
        {
          id: "submit",
          component: "Button",
          child: "submitLabel",
          variant: "primary",
          action: { event: { name: "submitted", context: { agreed: { "@path": "/form/agreed" } } } },
        },
        { id: "submitLabel", component: "Text", text: "보내기" },
      ],
      dataModel: {
        user: { name: "UniKit" },
        counter: { value: 0 },
        form: { agreed: false },
      },
    },
  },
];
