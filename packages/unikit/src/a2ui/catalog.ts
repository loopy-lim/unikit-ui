import { Catalog, type FunctionImplementation } from "@a2ui/web_core";

import { createA2uiBasicComponents } from "./catalog-basic";
import { createA2uiBasicFunctions } from "./functions";
import type { UnikitA2uiComponent, UnikitCatalogOptions } from "./types";
import { UNIKIT_CATALOG_ID } from "./types";
import { createUnikitTierAComponents } from "./unikit-a";
import { createUnikitTierBComponents } from "./unikit-b";
import { createUnikitTierCComponents } from "./unikit-c";

const UNIKIT_OVERLAP_SLUGS: Record<string, string> = {
  Button: "button",
  Card: "card",
  CheckBox: "checkbox",
  Divider: "separator",
  Slider: "slider",
  Tabs: "tabs",
};

export const UNIKIT_CATALOG_INSTRUCTIONS = `이 카탈로그는 UniKit UI 렌더러용이에요. 레이아웃에는 Row와 Column을 쓰고, 문자열 연결이나 데이터 주입은 formatString(value)을 \${expression} 표기로 작성해요. 검증 메시지는 컴포넌트의 @checks message에 직접 지어요.

지원 컴포넌트(총 62종):
- 표현형: Alert, AspectRatio, Attachment, Avatar, Badge, Bubble, Card, Direction, Divider, Empty, Item, Kbd, Label, Marker, Message, Progress, ScrollArea, Skeleton, Spinner, Table
- 입력·선택: Accordion, Button, ButtonGroup, Calendar, Carousel, CheckBox, Collapsible, Combobox, Command, Input, InputGroup, InputOtp, NativeSelect, Pagination, RadioGroup, Select, Slider, Switch, Textarea, Toggle, ToggleGroup
- 오버레이·조합: AlertDialog, Breadcrumb, ContextMenu, Dialog, Drawer, DropdownMenu, EditorToolbar, Field, Form, HoverCard, Menubar, MessageScroller, NavigationMenu, Popover, Resizable, Sheet, Sidebar, Sonner, Tabs, Tooltip
- 데이터 시각화(옵트인): Chart

A2UI 기본 프리미티브(Row, Column, Text, Image, Icon, Video, AudioPlayer, List, Modal, TextField, ChoicePicker, DateTimeInput)도 함께 쓸 수 있어요. Video와 AudioPlayer는 자막·제어 UI 없이 콘텐츠 표시만 해요.

표·목록 내용은 items 또는 children 배열로 주고, 오버레이는 trigger에 다른 컴포넌트 ID를 지정해요. 사용자 입력이 데이터 모델로 흐르는 컴포넌트(Input·Select·CheckBox 등)는 value에 바인딩을 걸고 변경 시 action을 발화해요.`;

export function createUnikitCatalogComponents(
  overlapFromBasic: ReturnType<typeof createA2uiBasicComponents>,
): UnikitA2uiComponent[] {
  return [
    ...createUnikitTierAComponents(),
    ...createUnikitTierBComponents(),
    ...createUnikitTierCComponents(),
    ...overlapFromBasic.map((component) =>
      UNIKIT_OVERLAP_SLUGS[component.name]
        ? { ...component, unikit: UNIKIT_OVERLAP_SLUGS[component.name] }
        : component,
    ),
  ];
}

export function createUnikitCatalog(
  options?: Omit<UnikitCatalogOptions, "extras">,
): Catalog<UnikitA2uiComponent, FunctionImplementation> {
  return new Catalog(
    UNIKIT_CATALOG_ID,
    "1.0",
    createUnikitCatalogComponents(createA2uiBasicComponents()),
    createA2uiBasicFunctions({ locale: options?.locale, catalogId: UNIKIT_CATALOG_ID }),
    {
      title: "UniKit A2UI Catalog",
      description: "UniKit UI 브리지 프리미티브 62종 전수를 렌더링하는 A2UI 카탈로그예요.",
      instructions: UNIKIT_CATALOG_INSTRUCTIONS,
      schemaId: UNIKIT_CATALOG_ID,
      schemaUri: "https://json-schema.org/draft/2020-12/schema",
    },
  );
}
