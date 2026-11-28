import { useEffect, useRef, useState } from "react";
import { spec } from "@a2ui/web_core";
import { z } from "zod";
import { Text, View } from "@unikit-bridge/ui/primitives";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "../components/alert-dialog";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "../components/breadcrumb";
import { ContextMenu, ContextMenuContent, ContextMenuItem, ContextMenuTrigger } from "../components/context-menu";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "../components/dialog";
import { DirectionProvider } from "../components/direction";
import { Drawer, DrawerContent, DrawerDescription, DrawerHeader, DrawerTitle, DrawerTrigger } from "../components/drawer";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "../components/dropdown-menu";
import { EditorToolbar } from "../components/editor-toolbar";
import { Field, FieldDescription, FieldError, FieldLabel } from "../components/field";
import { HoverCard, HoverCardContent, HoverCardTrigger } from "../components/hover-card";
import { Menubar, MenubarContent, MenubarItem, MenubarMenu, MenubarTrigger } from "../components/menubar";
import {
  MessageScroller,
  MessageScrollerContent,
  MessageScrollerProvider,
  MessageScrollerViewport,
} from "../components/message-scroller";
import {
  NavigationMenu,
  NavigationMenuItem,
  NavigationMenuList,
  NavigationMenuTrigger,
} from "../components/navigation-menu";
import { Popover, PopoverContent, PopoverDescription, PopoverHeader, PopoverTitle, PopoverTrigger } from "../components/popover";
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from "../components/resizable";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "../components/sheet";
import { Sidebar, SidebarContent, SidebarInset, SidebarProvider, SidebarTrigger } from "../components/sidebar";
import { Toaster, toast } from "../components/sonner";
import { Tooltip, TooltipContent, TooltipTrigger, tooltipContentTextVariants } from "../components/tooltip";
import { cn } from "../lib/utils";
import {
  ActionSchema,
  ChildListSchema,
  ChildSchema,
  DynamicBooleanSchema,
  DynamicStringSchema,
  WeightSchema,
} from "./schemas";
import type { A2uiViewContext, UnikitA2uiComponent } from "./types";

const child = (description: string) => ChildSchema.describe(`REF:#/$defs/Child|${description}`);

const children = (description: string) =>
  ChildListSchema.describe(`REF:#/$defs/ChildList|${description}`);

const text = (description: string) =>
  DynamicStringSchema.describe(`REF:#/$defs/DynamicString|${description}`);

const action = () => ActionSchema.describe("REF:#/$defs/Action");

const menuItem = spec(
  z
    .object({
      label: DynamicStringSchema.describe("REF:#/$defs/DynamicString|The item text."),
      destructive: z.boolean().describe("Whether the item is a destructive action.").optional(),
    })
    .strict(),
  { closure: "additionalProperties" },
);

const fire = (context: A2uiViewContext, name = "action") => {
  void context.action(name)?.();
};

export function createUnikitTierCComponents(): UnikitA2uiComponent[] {
  return [
    {
      name: "AlertDialog",
      unikit: "alert-dialog",
      tier: "c",
      schema: spec(
        z
          .object({
            trigger: child("The ID of the component that opens the dialog."),
            title: text("The dialog heading."),
            description: text("The dialog body.").optional(),
            actionLabel: text("The confirm button text.").optional(),
            cancelLabel: text("The dismiss button text.").optional(),
            action: action().optional(),
            weight: WeightSchema.optional(),
          })
          .strict(),
        { mixins: [] },
      ),
      view: (context) => (
        <AlertDialog>
          <AlertDialogTrigger>{context.child("trigger")}</AlertDialogTrigger>
          <AlertDialogContent style={context.weightStyle()}>
            <AlertDialogHeader>
              <AlertDialogTitle>{context.text("title")}</AlertDialogTitle>
              {context.text("description") ? (
                <AlertDialogDescription>{context.text("description")}</AlertDialogDescription>
              ) : null}
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>{context.text("cancelLabel") || "취소"}</AlertDialogCancel>
              <AlertDialogAction onPress={() => fire(context)}>{context.text("actionLabel") || "확인"}</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      ),
    },
    {
      name: "Breadcrumb",
      unikit: "breadcrumb",
      tier: "c",
      schema: spec(
        z
          .object({
            items: z
              .array(
                spec(
                  z
                    .object({
                      label: DynamicStringSchema.describe("REF:#/$defs/DynamicString|The crumb text."),
                      child: ChildSchema.describe(
                        "REF:#/$defs/Child|The ID of an optional component shown in place of the plain label.",
                      ).optional(),
                      current: z.boolean().describe("Whether this crumb is the current page.").optional(),
                    })
                    .strict(),
                  { closure: "additionalProperties" },
                ),
              )
              .min(1)
              .describe("The ordered trail of crumbs."),
            weight: WeightSchema.optional(),
          })
          .strict(),
        { mixins: [] },
      ),
      view: (context) => {
        const items = (context.value("items") as Array<{ label: string; child?: unknown; current?: boolean }>) ?? [];
        return (
          <Breadcrumb style={context.weightStyle()}>
            <BreadcrumbList>
              {items.map((item, index) => (
                <View key={index} className="flex flex-row items-center gap-1.5">
                  {index > 0 ? <BreadcrumbSeparator /> : null}
                  <BreadcrumbItem>
                    {item.current ? (
                      <BreadcrumbPage>{item.label}</BreadcrumbPage>
                    ) : (
                      <BreadcrumbLink>
                        <Text className="text-sm text-primary">{item.label}</Text>
                      </BreadcrumbLink>
                    )}
                  </BreadcrumbItem>
                </View>
              ))}
            </BreadcrumbList>
          </Breadcrumb>
        );
      },
    },
    {
      name: "ContextMenu",
      unikit: "context-menu",
      tier: "c",
      schema: spec(
        z
          .object({
            trigger: child("The ID of the component the menu attaches to."),
            items: z.array(menuItem).describe("The menu entries."),
            action: action().optional(),
            weight: WeightSchema.optional(),
          })
          .strict(),
        { mixins: [] },
      ),
      view: (context) => {
        const items = (context.value("items") as Array<{ label: string; destructive?: boolean }>) ?? [];
        return (
          <ContextMenu>
            <ContextMenuTrigger>{context.child("trigger")}</ContextMenuTrigger>
            <ContextMenuContent>
              {items.map((item, index) => (
                <ContextMenuItem
                  key={index}
                  variant={item.destructive ? "destructive" : "default"}
                  onSelect={() => fire(context)}
                >
                  <Text className={cn("text-sm", item.destructive ? "text-destructive" : "text-foreground")}>
                    {item.label}
                  </Text>
                </ContextMenuItem>
              ))}
            </ContextMenuContent>
          </ContextMenu>
        );
      },
    },
    {
      name: "Dialog",
      unikit: "dialog",
      tier: "c",
      schema: spec(
        z
          .object({
            trigger: child("The ID of the component that opens the dialog."),
            title: text("The dialog heading."),
            description: text("The dialog body.").optional(),
            children: children("The dialog content, referred to by ID."),
            weight: WeightSchema.optional(),
          })
          .strict(),
        { mixins: [] },
      ),
      view: (context) => (
        <Dialog>
          <DialogTrigger>{context.child("trigger")}</DialogTrigger>
          <DialogContent className="sm:max-w-md" style={context.weightStyle()}>
            <DialogHeader>
              <DialogTitle>{context.text("title")}</DialogTitle>
              {context.text("description") ? (
                <DialogDescription>{context.text("description")}</DialogDescription>
              ) : null}
            </DialogHeader>
            {context.children("children")}
          </DialogContent>
        </Dialog>
      ),
    },
    {
      name: "Drawer",
      unikit: "drawer",
      tier: "c",
      schema: spec(
        z
          .object({
            trigger: child("The ID of the component that opens the drawer."),
            title: text("The drawer heading."),
            description: text("The drawer body.").optional(),
            children: children("The drawer content, referred to by ID."),
            weight: WeightSchema.optional(),
          })
          .strict(),
        { mixins: [] },
      ),
      view: (context) => (
        <Drawer>
          <DrawerTrigger>{context.child("trigger")}</DrawerTrigger>
          <DrawerContent style={context.weightStyle()}>
            <DrawerHeader>
              <DrawerTitle>{context.text("title")}</DrawerTitle>
              {context.text("description") ? (
                <DrawerDescription>{context.text("description")}</DrawerDescription>
              ) : null}
            </DrawerHeader>
            {context.children("children")}
          </DrawerContent>
        </Drawer>
      ),
    },
    {
      name: "DropdownMenu",
      unikit: "dropdown-menu",
      tier: "c",
      schema: spec(
        z
          .object({
            trigger: child("The ID of the component that opens the menu."),
            items: z.array(menuItem).describe("The menu entries."),
            action: action().optional(),
            weight: WeightSchema.optional(),
          })
          .strict(),
        { mixins: [] },
      ),
      view: (context) => {
        const items = (context.value("items") as Array<{ label: string; destructive?: boolean }>) ?? [];
        return (
          <DropdownMenu>
            <DropdownMenuTrigger>{context.child("trigger")}</DropdownMenuTrigger>
            <DropdownMenuContent>
              {items.map((item, index) => (
                <DropdownMenuItem
                  key={index}
                  variant={item.destructive ? "destructive" : "default"}
                  onSelect={() => fire(context)}
                >
                  <Text className={cn("text-sm", item.destructive ? "text-destructive" : "text-foreground")}>
                    {item.label}
                  </Text>
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
    },
    {
      name: "EditorToolbar",
      unikit: "editor-toolbar",
      tier: "c",
      schema: spec(
        z
          .object({
            formats: z
              .array(z.string())
              .describe("The format identifiers the toolbar offers."),
            action: action().optional(),
            weight: WeightSchema.optional(),
          })
          .strict(),
        { mixins: [] },
      ),
      view: (context) => (
        <EditorToolbar
          formats={context.stringList("formats")}
          onCommand={() => fire(context)}
          style={context.weightStyle()}
        />
      ),
    },
    {
      name: "Field",
      unikit: "field",
      tier: "c",
      schema: spec(
        z
          .object({
            label: text("The field label."),
            description: text("The helper text under the control.").optional(),
            error: text("The error text that replaces the helper on failure.").optional(),
            children: children("The field control, referred to by ID."),
            weight: WeightSchema.optional(),
          })
          .strict(),
        { mixins: [] },
      ),
      view: (context) => (
        <Field style={context.weightStyle()}>
          <FieldLabel>{context.text("label")}</FieldLabel>
          {context.children("children")}
          {context.text("error") ? (
            <FieldError>{context.text("error")}</FieldError>
          ) : context.text("description") ? (
            <FieldDescription>{context.text("description")}</FieldDescription>
          ) : null}
        </Field>
      ),
    },
    {
      name: "HoverCard",
      unikit: "hover-card",
      tier: "c",
      schema: spec(
        z
          .object({
            trigger: child("The ID of the component that reveals the card on hover."),
            children: children("The card content, referred to by ID."),
            weight: WeightSchema.optional(),
          })
          .strict(),
        { mixins: [] },
      ),
      view: (context) => (
        <HoverCard>
          <HoverCardTrigger>{context.child("trigger")}</HoverCardTrigger>
          <HoverCardContent style={context.weightStyle()}>{context.children("children")}</HoverCardContent>
        </HoverCard>
      ),
    },
    {
      name: "Menubar",
      unikit: "menubar",
      tier: "c",
      schema: spec(
        z
          .object({
            menus: z
              .array(
                spec(
                  z
                    .object({
                      label: DynamicStringSchema.describe("REF:#/$defs/DynamicString|The menu title."),
                      items: z.array(menuItem).describe("The entries under this menu."),
                    })
                    .strict(),
                  { closure: "additionalProperties" },
                ),
              )
              .min(1)
              .describe("The menubar menus."),
            action: action().optional(),
            weight: WeightSchema.optional(),
          })
          .strict(),
        { mixins: [] },
      ),
      view: (context) => {
        const menus = (context.value("menus") as Array<{ label: string; items: Array<{ label: string; destructive?: boolean }> }>) ?? [];
        return (
          <Menubar style={context.weightStyle()}>
            {menus.map((menu) => (
              <MenubarMenu key={menu.label} value={menu.label}>
                <MenubarTrigger>
                  <Text className="text-sm text-foreground">{menu.label}</Text>
                </MenubarTrigger>
                <MenubarContent>
                  {menu.items.map((item, index) => (
                    <MenubarItem
                      key={index}
                      variant={item.destructive ? "destructive" : "default"}
                      onSelect={() => fire(context)}
                    >
                      <Text className={cn("text-sm", item.destructive ? "text-destructive" : "text-foreground")}>
                        {item.label}
                      </Text>
                    </MenubarItem>
                  ))}
                </MenubarContent>
              </MenubarMenu>
            ))}
          </Menubar>
        );
      },
    },
    {
      name: "MessageScroller",
      unikit: "message-scroller",
      tier: "c",
      schema: spec(
        z
          .object({
            children: children("The messages, referred to by ID."),
            autoScroll: DynamicBooleanSchema.describe(
              "REF:#/$defs/DynamicBoolean|Whether new content scrolls into view.",
            )
              .optional(),
            weight: WeightSchema.optional(),
          })
          .strict(),
        { mixins: [] },
      ),
      view: (context) => (
        <MessageScrollerProvider>
          <MessageScroller style={context.weightStyle()}>
            <MessageScrollerViewport>
              <MessageScrollerContent>{context.children("children")}</MessageScrollerContent>
            </MessageScrollerViewport>
          </MessageScroller>
        </MessageScrollerProvider>
      ),
    },
    {
      name: "NavigationMenu",
      unikit: "navigation-menu",
      tier: "c",
      schema: spec(
        z
          .object({
            items: z
              .array(
                spec(
                  z
                    .object({
                      label: DynamicStringSchema.describe("REF:#/$defs/DynamicString|The nav entry text."),
                      child: ChildSchema.describe(
                        "REF:#/$defs/Child|The ID of the panel shown when the entry opens.",
                      ).optional(),
                    })
                    .strict(),
                  { closure: "additionalProperties" },
                ),
              )
              .min(1)
              .describe("The navigation entries."),
            weight: WeightSchema.optional(),
          })
          .strict(),
        { mixins: [] },
      ),
      view: (context) => {
        const items = (context.value("items") as Array<{ label: string; child?: unknown }>) ?? [];
        return (
          <NavigationMenu style={context.weightStyle()}>
            <NavigationMenuList>
              {items.map((item) => (
                <NavigationMenuItem key={item.label}>
                  <NavigationMenuTrigger>
                    <Text className="text-sm text-foreground">{item.label}</Text>
                  </NavigationMenuTrigger>
                </NavigationMenuItem>
              ))}
            </NavigationMenuList>
          </NavigationMenu>
        );
      },
    },
    {
      name: "Popover",
      unikit: "popover",
      tier: "c",
      schema: spec(
        z
          .object({
            trigger: child("The ID of the component that toggles the popover."),
            title: text("The popover heading.").optional(),
            description: text("The popover body.").optional(),
            children: children("Extra popover content, referred to by ID."),
            weight: WeightSchema.optional(),
          })
          .strict(),
        { mixins: [] },
      ),
      view: (context) => (
        <Popover>
          <PopoverTrigger>{context.child("trigger")}</PopoverTrigger>
          <PopoverContent style={context.weightStyle()}>
            {context.text("title") || context.text("description") ? (
              <PopoverHeader>
                {context.text("title") ? <PopoverTitle>{context.text("title")}</PopoverTitle> : null}
                {context.text("description") ? (
                  <PopoverDescription>{context.text("description")}</PopoverDescription>
                ) : null}
              </PopoverHeader>
            ) : null}
            {context.children("children")}
          </PopoverContent>
        </Popover>
      ),
    },
    {
      name: "Resizable",
      unikit: "resizable",
      tier: "c",
      schema: spec(
        z
          .object({
            direction: z
              .enum(["horizontal", "vertical"])
              .default("horizontal")
              .describe("The axis the panels divide along.")
              .optional(),
            children: children("Exactly two panels, referred to by ID."),
            weight: WeightSchema.optional(),
          })
          .strict(),
        { mixins: [] },
      ),
      view: (context) => {
        const panels = context.childNodes("children");
        return (
          <ResizablePanelGroup
            direction={context.value("direction") === "vertical" ? "vertical" : "horizontal"}
            style={context.weightStyle()}
          >
            <ResizablePanel defaultSize={50}>{context.render(panels[0])}</ResizablePanel>
            <ResizableHandle withHandle />
            <ResizablePanel defaultSize={50}>{context.render(panels[1])}</ResizablePanel>
          </ResizablePanelGroup>
        );
      },
    },
    {
      name: "Sheet",
      unikit: "sheet",
      tier: "c",
      schema: spec(
        z
          .object({
            trigger: child("The ID of the component that opens the sheet."),
            side: z
              .enum(["top", "right", "bottom", "left"])
              .default("right")
              .describe("The edge the sheet slides from.")
              .optional(),
            title: text("The sheet heading."),
            description: text("The sheet body.").optional(),
            children: children("The sheet content, referred to by ID."),
            weight: WeightSchema.optional(),
          })
          .strict(),
        { mixins: [] },
      ),
      view: (context) => (
        <Sheet>
          <SheetTrigger>{context.child("trigger")}</SheetTrigger>
          <SheetContent
            side={(context.value("side") as "top" | "right" | "bottom" | "left") ?? "right"}
            style={context.weightStyle()}
          >
            <SheetHeader>
              <SheetTitle>{context.text("title")}</SheetTitle>
              {context.text("description") ? (
                <SheetDescription>{context.text("description")}</SheetDescription>
              ) : null}
            </SheetHeader>
            {context.children("children")}
          </SheetContent>
        </Sheet>
      ),
    },
    {
      name: "Sidebar",
      unikit: "sidebar",
      tier: "c",
      schema: spec(
        z
          .object({
            children: children("The sidebar sections, referred to by ID."),
            content: child("The ID of the main content shown beside the sidebar."),
            weight: WeightSchema.optional(),
          })
          .strict(),
        { mixins: [] },
      ),
      view: (context) => (
        <SidebarProvider>
          <Sidebar style={context.weightStyle()}>
            <SidebarContent>{context.children("children")}</SidebarContent>
          </Sidebar>
          <SidebarInset>
            <View className="flex flex-row items-center gap-2 border-b border-border px-4 py-2">
              <SidebarTrigger />
            </View>
            {context.child("content")}
          </SidebarInset>
        </SidebarProvider>
      ),
    },
    {
      name: "Sonner",
      unikit: "sonner",
      tier: "c",
      schema: spec(
        z
          .object({
            title: text("The toast title."),
            description: text("The toast body.").optional(),
            variant: z
              .enum(["default", "success", "error", "warning", "info"])
              .default("default")
              .describe("The toast tone.")
              .optional(),
            position: z
              .enum(["top-left", "top-center", "top-right", "bottom-left", "bottom-center", "bottom-right"])
              .default("bottom-right")
              .describe("Where the toast appears.")
              .optional(),
            weight: WeightSchema.optional(),
          })
          .strict(),
        { mixins: [] },
      ),
      view: (context) => {
        const title = context.text("title");
        const description = context.text("description");
        const variant = (context.value("variant") as "default" | "success" | "error" | "warning" | "info") ?? "default";
        const signature = `${title}\n${description}`;
        const shown = useRef<string | null>(null);
        useEffect(() => {
          if (!title || shown.current === signature) return;
          shown.current = signature;
          if (variant === "success") {
            toast.success(title, { description: description || undefined });
          } else if (variant === "error") {
            toast.error(title, { description: description || undefined });
          } else if (variant === "warning") {
            toast.warning(title, { description: description || undefined });
          } else if (variant === "info") {
            toast.info(title, { description: description || undefined });
          } else {
            toast(title, { description: description || undefined });
          }
        }, [title, description, variant, signature]);
        return (
          <Toaster
            position={
              (context.value("position") as
                | "top-left"
                | "top-center"
                | "top-right"
                | "bottom-left"
                | "bottom-center"
                | "bottom-right") ?? "bottom-right"
            }
          />
        );
      },
    },
    {
      name: "Tooltip",
      unikit: "tooltip",
      tier: "c",
      schema: spec(
        z
          .object({
            trigger: child("The ID of the component the tooltip attaches to."),
            label: text("The tooltip text."),
            weight: WeightSchema.optional(),
          })
          .strict(),
        { mixins: [] },
      ),
      view: (context) => (
        <Tooltip>
          <TooltipTrigger>{context.child("trigger")}</TooltipTrigger>
          <TooltipContent style={context.weightStyle()}>
            <Text className={tooltipContentTextVariants()}>{context.text("label")}</Text>
          </TooltipContent>
        </Tooltip>
      ),
    },
  ];
}
