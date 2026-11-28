import { Dimensions } from "react-native";

import {
  installSdkEventGlobals,
  setSdkViewport,
} from "./ui-sdk-renderer";

export type FakeRect = {
  x: number;
  y: number;
  width: number;
  height: number;
  top: number;
  left: number;
  right: number;
  bottom: number;
};

export function rectFrom(x: number, y: number, width: number, height: number): FakeRect {
  return {
    x,
    y,
    width,
    height,
    top: y,
    left: x,
    right: x + width,
    bottom: y + height,
  };
}

export function updateRect(
  rect: FakeRect,
  x: number,
  y: number,
  width: number,
  height: number,
): void {
  rect.x = x;
  rect.y = y;
  rect.width = width;
  rect.height = height;
  rect.top = y;
  rect.left = x;
  rect.right = x + width;
  rect.bottom = y + height;
}

export function pxToNumber(value: unknown): number | null {
  if (typeof value !== "string") return null;
  const n = Number.parseFloat(value);
  return Number.isFinite(n) ? n : null;
}

export class FakeStyle {
  [key: string]: unknown;
  transformOrigin = "0px 0px";
  transform = "none";

  observer?: (key: string, value: string) => void;
  setProperty(key: string, value: string) {
    if (this[key] !== value) {
      this.observer?.(key, value);
    }
    this[key] = value;
  }
  getPropertyValue(key: string) {
    return typeof this[key] === "string" ? (this[key] as string) : "";
  }
  removeProperty(key: string) {
    delete this[key];
  }
}

export class FakeElement {
  nodeType = 1;
  isConnected = true;
  tagName: string;
  style = new FakeStyle();
  dataset: Record<string, string> = {};
  attrs: Record<string, string> = {};
  rect: FakeRect;
  constructor(name: string, rect: FakeRect) {
    this.tagName = name.toUpperCase();
    this.rect = rect;
  }
  setAttribute(key: string, value: string) {
    const next = String(value);
    if (this.attrs[key] !== next) {
      this.attrObserver?.(key, next);
    }
    this.attrs[key] = next;
  }
  getAttribute(key: string) {
    return this.attrs[key] ?? null;
  }
  removeAttribute(key: string) {
    if (key in this.attrs) {
      this.attrObserver?.(key, null);
    }
    delete this.attrs[key];
  }

  addEventListener(_type: string, _handler: unknown, _opts?: unknown) {}
  removeEventListener(_type: string, _handler?: unknown, _opts?: unknown) {}
  scrollTo() {}

  attrObserver?: (key: string, value: string | null) => void;

  getBoundingClientRect() {
    const left = pxToNumber(this.style.left);
    const top = pxToNumber(this.style.top);
    const x = left !== null ? left : this.rect.x;
    const y = top !== null ? top : this.rect.y;
    return {
      x,
      y,
      width: this.rect.width,
      height: this.rect.height,
      top: y,
      left: x,
      right: x + this.rect.width,
      bottom: y + this.rect.height,
      toJSON: () => this.rect,
    };
  }
  getClientRects() {
    return [this.getBoundingClientRect()];
  }
  get clientLeft() {
    return 0;
  }
  get clientTop() {
    return 0;
  }
  get clientWidth() {
    return this.rect.width;
  }
  get clientHeight() {
    return this.rect.height;
  }
  get offsetWidth() {
    return this.rect.width;
  }
  get offsetHeight() {
    return this.rect.height;
  }
}

export function installDomStubs(): void {
  installSdkEventGlobals();
  setSdkViewport(() => Dimensions.get("window"));

  const g = globalThis as Record<string, unknown>;
  if (typeof g.MutationObserver !== "function") {
    g.MutationObserver = class MutationObserver {
      observe() {}
      disconnect() {}
      takeRecords() {
        return [];
      }
    };
  }
}

export function bindVisualViewport(
  read: () => { offsetLeft: number; offsetTop: number; width: number; height: number },
): () => void {
  const g = globalThis as Record<string, unknown>;
  const win = (g.window ?? g) as Record<string, unknown>;
  const previous = win.visualViewport;
  win.visualViewport = {
    get offsetLeft() {
      return read().offsetLeft;
    },
    get offsetTop() {
      return read().offsetTop;
    },
    get width() {
      return read().width;
    },
    get height() {
      return read().height;
    },

    addEventListener() {},
    removeEventListener() {},
  };
  return () => {
    win.visualViewport = previous;
  };
}
