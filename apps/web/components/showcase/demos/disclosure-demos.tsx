"use client";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@unikit-bridge/ui";
import { Text } from "@unikit-bridge/ui/primitives";

import type { ShowcaseDemo } from "./types";

export const tabsDemo: ShowcaseDemo = {
  Demo: function TabsDemo() {
    return (
      <Tabs defaultValue="account">
        <TabsList variant="line">
          <TabsTrigger value="account">계정</TabsTrigger>
          <TabsTrigger value="security">보안</TabsTrigger>
        </TabsList>
        <TabsContent value="account">
          <Text className="font-sans text-sm text-foreground">계정 탭</Text>
        </TabsContent>
        <TabsContent value="security">
          <Text className="font-sans text-sm text-foreground">보안 탭</Text>
        </TabsContent>
      </Tabs>
    );
  },
  code: `import { Tabs, TabsList, TabsTrigger, TabsContent } from "@unikit-bridge/ui";

<Tabs defaultValue="a"><TabsList><TabsTrigger value="a">A</TabsTrigger></TabsList></Tabs>`,
};

export const accordionDemo: ShowcaseDemo = {
  Demo: function AccordionDemo() {
    return (
      <Accordion defaultValue="what">
        <AccordionItem value="what">
          <AccordionTrigger>UniKit이 뭔가요?</AccordionTrigger>
          <AccordionContent>
            <Text className="font-sans text-sm text-muted-foreground">
              웹·앱 공통 UI 컴포넌트 모음이에요.
            </Text>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    );
  },
  code: `import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from "@unikit-bridge/ui";

<Accordion defaultValue="a"><AccordionItem value="a">...</AccordionItem></Accordion>`,
};

export const collapsibleDemo: ShowcaseDemo = {
  Demo: function CollapsibleDemo() {
    return (
      <Collapsible defaultOpen>
        <CollapsibleTrigger>자세히 보기</CollapsibleTrigger>
        <CollapsibleContent className="mt-2">
          <Text className="font-sans text-sm text-muted-foreground">
            접기를 접었다 펼 수 있어요.
          </Text>
        </CollapsibleContent>
      </Collapsible>
    );
  },
  code: `import { Collapsible, CollapsibleTrigger, CollapsibleContent } from "@unikit-bridge/ui";

<Collapsible><CollapsibleTrigger>열기</CollapsibleTrigger></Collapsible>`,
};
