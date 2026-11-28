import type { ComponentApi, ComponentNode, NodeAction } from "@a2ui/web_core";
import type { ReactNode } from "react";

export type A2uiCheckState = {
  valid: boolean;
  errors: string[];
};

export type A2uiViewContext = {
  node: ComponentNode<UnikitA2uiComponent>;
  text(name: string, fallback?: string): string;
  number(name: string, fallback?: number): number;
  boolean(name: string, fallback?: boolean): boolean;
  stringList(name: string): string[];
  value<T>(name: string, fallback?: T): T;
  set<T>(name: string, next: T): void;
  action(name: string): NodeAction | undefined;
  childNode(name: string): ComponentNode<UnikitA2uiComponent> | undefined;
  childNodes(name: string): ComponentNode<UnikitA2uiComponent>[];
  child(name: string): ReactNode;
  children(name?: string): ReactNode;
  childrenText(name?: string): string;
  render(node: ComponentNode<UnikitA2uiComponent> | undefined): ReactNode;
  weightStyle(): { flexGrow: number } | undefined;
  checks(): A2uiCheckState;
  metadata: Record<string, unknown> | undefined;
};

export type UnikitView = (context: A2uiViewContext) => ReactNode;

export type UnikitA2uiTier = "basic" | "a" | "b" | "c";

export type UnikitA2uiComponent = ComponentApi & {
  unikit: string | null;
  tier: UnikitA2uiTier;
  view: UnikitView;
};

export type A2uiExtras = Array<"form" | "chart">;

export type UnikitCatalogOptions = {
  extras?: A2uiExtras;
  locale?: string;
};

export const BASIC_CATALOG_ID = "https://a2ui.org/specification/v1_0/catalogs/basic/catalog.json";

export const UNIKIT_CATALOG_ID = "urn:unikit:a2ui:catalog:v1";
