import {
  attrs,
  commit,
  handlers,
  keep,
  partState,
  present,
  ref,
  release,
  sameSlotState,
  sameValue,
  subscribe,
  unwatched,
} from "@ui-sdk/core/renderer";
import * as React from "react";

export type SdkPrimitiveInstance = {
  id: string;

  get(): unknown;

  readonly api?: Record<string, unknown>;
  setOptions(options: Record<string, unknown>): void;
  part(
    slot: string,
    props?: Record<string, unknown>,
    acquire?: boolean,
  ): SdkPart;
  destroy(): void;
};

export type SdkPart = {
  readonly slot: string;
  readonly key: string;
  readonly id: string;
};

type Attrs = Record<string, string | undefined>;

const HOST = { by: "framework", attaches: ["click", "keydown", "keyup"] } as const;

export type SdkSyntheticEventInit = {
  key?: string;
  ctrlKey?: boolean;
  altKey?: boolean;
  metaKey?: boolean;
  shiftKey?: boolean;
  repeat?: boolean;
  detail?: number;
  button?: number;
  buttons?: number;
  clientX?: number;
  clientY?: number;
  pointerId?: number;
  pointerType?: string;
  isPrimary?: boolean;

  target?: unknown;

  isTrusted?: boolean;
  bubbles?: boolean;
};

type SdkListener = (event: SdkEvent) => void;

export class SdkEvent {
  type: string;
  bubbles: boolean;
  composed: boolean;
  cancelable: boolean;
  defaultPrevented = false;
  isTrusted: boolean;
  target: unknown = null;
  currentTarget: unknown = null;

  cancelBubble = false;

  immediateStopped = false;
  [key: string]: unknown;
  constructor(
    type: string,
    init: { bubbles?: boolean; composed?: boolean; cancelable?: boolean; isTrusted?: boolean } = {},
  ) {
    this.type = type;
    this.bubbles = init.bubbles === true;
    this.composed = init.composed === true;
    this.cancelable = init.cancelable === true;
    this.isTrusted = init.isTrusted === true;
  }
  preventDefault() {
    if (this.cancelable) this.defaultPrevented = true;
  }
  stopPropagation() {
    this.cancelBubble = true;
  }
  stopImmediatePropagation() {
    this.cancelBubble = true;
    this.immediateStopped = true;
  }

  composedPath(): unknown[] {
    return composedPathOf(this.target);
  }
}

const NON_BUBBLING = /^(focus|blur|mouse(enter|leave)|pointer(enter|leave))$/;

export function sdkSyntheticEvent(type: string, init: SdkSyntheticEventInit = {}): SdkEvent {
  const { target, isTrusted = true, bubbles, ...fields } = init;
  const event = new SdkEvent(type, {
    bubbles: bubbles ?? !NON_BUBBLING.test(type),
    composed: true,
    cancelable: true,
    isTrusted,
  });
  Object.assign(event, fields);
  event.target = target ?? null;
  return event;
}

let sdkActiveElement: SdkElement | null = null;

function sdkSetFocus(next: SdkElement | null) {
  const previous = sdkActiveElement;
  if (previous === next) return;
  sdkActiveElement = null;

  if (previous) {
    previous.dispatchEvent(sdkSyntheticEvent("blur", { target: previous }));
    previous.dispatchEvent(sdkSyntheticEvent("focusout", { target: previous }));
    previous.blurObserver?.();
  }
  sdkActiveElement = next;
  if (next) {
    next.dispatchEvent(sdkSyntheticEvent("focus", { target: next }));
    next.dispatchEvent(sdkSyntheticEvent("focusin", { target: next }));
    next.focusObserver?.();
  }
}

let sdkElementAgentMode = false;
let sdkElementPopupMode = false;
let sdkElementFormMode = false;
let sdkElementFocusMode = false;

export function setSdkElementAgentMode(enabled: boolean): void {
  sdkElementAgentMode = enabled;
}

export function setSdkElementPopupMode(enabled: boolean): void {
  sdkElementPopupMode = enabled;
}

export function setSdkElementFormMode(enabled: boolean): void {
  sdkElementFormMode = enabled;
}

export function setSdkElementFocusMode(enabled: boolean): void {
  sdkElementFocusMode = enabled;
}

export function typeSdkValue(element: SdkElement, text: string): void {
  const descriptor = Object.getOwnPropertyDescriptor(
    Object.getPrototypeOf(element),
    "value",
  );
  descriptor?.set?.call(element, text);
  element.dispatchEvent(new SdkEvent("input", { bubbles: true, composed: true }));
}

export function installSdkFormGlobals(): void {
  const g = globalThis as Record<string, unknown>;
  for (const name of [
    "HTMLInputElement",
    "HTMLSelectElement",
    "HTMLTextAreaElement",
    "HTMLLabelElement",
    "HTMLButtonElement",
    "HTMLMeterElement",
    "HTMLOutputElement",
    "HTMLProgressElement",
    "Node",
  ]) {
    if (typeof g[name] !== "function") g[name] = class {};
  }
  if (typeof g.Event !== "function") g.Event = SdkEvent;
}

export type SdkStyleObserver = (key: string, value: string) => void;

export class SdkStyle {
  [key: string]: unknown;
  transformOrigin = "0px 0px";
  transform = "none";
  observer?: SdkStyleObserver;
  setProperty(key: string, value: string) {
    if (this[key] !== value) {
      this.observer?.(key, value);
    }
    this[key] = value;
  }
  getPropertyValue(key: string) {
    return typeof this[key] === "string" ? (this[key] as string) : "";
  }
  getPropertyPriority() {
    return "";
  }
  removeProperty(key: string) {
    delete this[key];
  }
}

export function setSdkRect(
  element: SdkElement,
  x: number,
  y: number,
  width: number,
  height: number,
): void {
  const rect = element.rect;
  rect.x = x;
  rect.y = y;
  rect.width = width;
  rect.height = height;
  rect.top = y;
  rect.left = x;
  rect.right = x + width;
  rect.bottom = y + height;
}

type SdkNode = SdkElement | SdkDocumentClass | SdkWindowClass;

type SdkPartRecord = { part: unknown };

const sdkParts = new WeakMap<SdkElement, SdkPartRecord>();

class SdkEventTarget {
  private capturing = new Map<string, Set<SdkListener>>();
  private bubbling = new Map<string, Set<SdkListener>>();
  private setFor(type: string, capture: boolean): Set<SdkListener> {
    const map = capture ? this.capturing : this.bubbling;
    let set = map.get(type);
    if (!set) {
      set = new Set();
      map.set(type, set);
    }
    return set;
  }
  addEventListener(
    type: string,
    listener: SdkListener,
    options?:
      | boolean
      | {
          capture?: boolean;
          signal?: {
            aborted?: boolean;
            addEventListener?: (type: string, listener: () => void) => void;
            removeEventListener?: (type: string, listener: () => void) => void;
          } | null;
        },
  ) {
    if (typeof listener !== "function") return;
    const signal = typeof options === "object" && options !== null ? options.signal : undefined;
    if (signal?.aborted) return;
    this.setFor(type, sdkCapture(options)).add(listener);

    if (signal && typeof signal.addEventListener === "function") {
      const abort = () => {
        this.removeEventListener(type, listener);
        signal.removeEventListener?.("abort", abort);
      };
      signal.addEventListener("abort", abort);
    }
  }
  removeEventListener(
    type: string,
    listener: SdkListener,
    _options?: boolean | { capture?: boolean },
  ) {

    this.setFor(type, true).delete(listener);
    this.setFor(type, false).delete(listener);
  }
  private run(set: Set<SdkListener> | undefined, event: SdkEvent) {
    if (!set) return;
    for (const listener of [...set]) {
      listener(event);
      if (event.immediateStopped) return;
    }
  }
  runCapture(event: SdkEvent) {
    this.run(this.capturing.get(event.type), event);
  }
  runBubble(event: SdkEvent) {
    this.run(this.bubbling.get(event.type), event);
  }

  runTarget(event: SdkEvent) {
    this.run(this.capturing.get(event.type), event);
    if (!event.immediateStopped) this.run(this.bubbling.get(event.type), event);
  }
}

function sdkCapture(options?: boolean | { capture?: boolean }): boolean {
  return options === true || (typeof options === "object" && options !== null && options.capture === true);
}

function isSdkElement(node: unknown): node is SdkElement {
  return node instanceof SdkElement;
}

function composedPathOf(target: unknown): SdkNode[] {
  if (!isSdkElement(target) && target !== SdkDocument && target !== SdkWindow) return [];
  const path: SdkNode[] = [target as SdkNode];
  if (isSdkElement(target)) {
    let at: SdkElement | undefined = target;
    while (at?.parentElement) {
      at = at.parentElement;
      path.push(at);
    }
    path.push(SdkDocument, SdkWindow);
  } else if (target === SdkDocument) {
    path.push(SdkWindow);
  }
  return path;
}

function runKernelHandlers(node: SdkNode, event: SdkEvent) {
  if (!isSdkElement(node) || event.immediateStopped) return;
  if (!HOST.attaches.includes(event.type as (typeof HOST.attaches)[number])) return;
  const record = sdkParts.get(node);
  if (!record) return;
  const map = handlers(record.part as never) as Record<string, ((event: SdkEvent) => void) | undefined>;
  map[event.type]?.(event);
}

function sdkDispatch(target: SdkNode, event: SdkEvent, container?: SdkElement): SdkEvent {
  if (event.target == null) event.target = target;
  const path = composedPathOf(target);
  const finish = () => {
    event.currentTarget = null;
    return event;
  };
  for (let i = path.length - 1; i >= 1; i--) {
    event.currentTarget = path[i];
    path[i].runCapture(event);

    if (event.immediateStopped || event.cancelBubble) return finish();
  }
  event.currentTarget = target;
  target.runTarget(event);
  if (!event.immediateStopped) runKernelHandlers(target, event);
  if (!event.bubbles || event.cancelBubble || event.immediateStopped) return finish();
  const ancestors = path.slice(1);
  if (container && container !== target && !ancestors.includes(container)) {
    ancestors.unshift(container);
  }
  for (const node of ancestors) {
    event.currentTarget = node;
    node.runBubble(event);
    if (!event.immediateStopped) runKernelHandlers(node, event);
    if (event.immediateStopped || event.cancelBubble) break;
  }
  return finish();
}

export function fireSdkEvent(
  element: SdkElement,
  type: string,
  init: SdkSyntheticEventInit = {},
): SdkEvent {
  const target = isSdkElement(init.target) ? init.target : element;
  return sdkDispatch(target, sdkSyntheticEvent(type, init), target === element ? undefined : element);
}

export function dispatchSdkDocumentEvent(type: string, init: SdkSyntheticEventInit = {}): SdkEvent {
  return sdkDispatch(isSdkElement(init.target) ? init.target : SdkDocument, sdkSyntheticEvent(type, init));
}

export function dispatchSdkWindowEvent(type: string, init: SdkSyntheticEventInit = {}): SdkEvent {
  return sdkDispatch(isSdkElement(init.target) ? init.target : SdkWindow, sdkSyntheticEvent(type, init));
}

export function bindSdkPart(
  part: unknown,
  props: Record<string, unknown>,
  domAttrs: Attrs,
  tag = "unknown",
): { element: SdkElement; unbind: () => void } {
  const globalScope = globalThis as { MutationObserver?: unknown };
  const saved = globalScope.MutationObserver;

  globalScope.MutationObserver = SilentObserver;
  let element: SdkElement;
  let bindRef: (el: unknown) => void;
  try {
    element = new SdkElement(tag);

    const agentLabel = props["aria-label"] ?? props.accessibilityLabel;
    if (typeof agentLabel === "string" && agentLabel !== "") {
      element.setAttribute("aria-label", agentLabel);
    }

    for (const [name, value] of Object.entries(domAttrs)) {
      if (value !== undefined && value !== null) {
        element.setAttribute(name, value);
      }
    }
    sdkParts.set(element, { part });
    bindRef = ref(part as never, HOST) as (el: unknown) => void;
    bindRef(element);
  } finally {
    globalScope.MutationObserver = saved;
  }
  return {
    element,
    unbind() {
      if (sdkActiveElement === element) sdkSetFocus(null);
      sdkParts.delete(element);
      bindRef(null);
    },
  };
}

class SilentObserver {
  observe() {}
  disconnect() {}
  takeRecords() {
    return [];
  }
}

let sdkSequence = 0;

function sdkCssEscape(value: string): string {
  return String(value).replace(/[^a-zA-Z0-9_-]/g, (ch) => `\\${ch}`);
}

function sdkMatchesSelector(element: SdkElement, selector: string): boolean {
  return selector.split(",").some((group) => {
    const text = group.trim();
    const parts = text.match(/[a-zA-Z][\w-]*|\[[^\]]*\]|:[\w-]+(?:\([^)]*\))?/g) ?? [];
    if (parts.map((part) => part.replace(/\s+/g, "")).join("") !== text.replace(/\s+/g, "")) {
      return false;
    }
    let index = 0;
    const first = parts[0];
    if (first !== undefined && /^[a-zA-Z]/.test(first)) {
      if (first.toUpperCase() !== element.tagName) return false;
      index = 1;
    }
    for (; index < parts.length; index++) {
      const part = parts[index];
      if (part === ":focus") {
        if (sdkActiveElement !== element) return false;
        continue;
      }
      if (part === ":disabled") {
        if (!element.hasAttribute("disabled")) return false;
        continue;
      }
      let negate = false;
      let inner = part;
      if (part.startsWith(":not(") && part.endsWith(")")) {
        negate = true;
        inner = part.slice(5, -1);
      }
      const attribute = inner.match(/^\[\s*([\w-]+)\s*(?:=\s*["']?([^"'\]]*?)["']?\s*)?\]$/);
      if (!attribute) return false;
      const has =
        element.hasAttribute(attribute[1]) &&
        (attribute[2] === undefined || element.getAttribute(attribute[1]) === attribute[2]);
      if (has === negate) return false;
    }
    return true;
  });
}

export class SdkElement extends SdkEventTarget {

  get isConnected() {
    return (
      sdkElementAgentMode ||
      sdkElementPopupMode ||
      sdkElementFormMode ||
      sdkElementFocusMode
    );
  }

  nodeType = 1;
  tagName: string;

  localName: string;

  parentElement: SdkElement | undefined = undefined;
  nextElementSibling: SdkElement | undefined = undefined;
  previousElementSibling: SdkElement | undefined = undefined;

  readonly #sequence = ++sdkSequence;

  get ownerDocument(): SdkDocumentClass {
    return SdkDocument;
  }

  get parentNode(): SdkElement | null {
    return this.parentElement ?? null;
  }

  offsetLeft = 0;
  offsetTop = 0;

  hidden = false;

  inert = false;

  tabIndex = -1;

  scrollWidth = 0;
  scrollHeight = 0;
  scrollLeft = 0;
  scrollTop = 0;

  focusObserver?: () => void;
  blurObserver?: () => void;

  style = new SdkStyle();

  rect = {
    x: 0,
    y: 0,
    width: 0,
    height: 0,
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  };
  private attributes = new Map<string, string>();
  constructor(tag: string) {
    super();
    this.tagName = tag.toUpperCase();
    this.localName = tag.toLowerCase();
  }

  setAttribute(name: string, value = "") {
    this.attributes.set(name, String(value));
    if (name === "id") this.id = String(value);
    if (name === "tabindex") this.tabIndex = Number(value);
  }
  removeAttribute(name: string) {
    this.attributes.delete(name);
    if (name === "id") this.id = "";
    if (name === "tabindex") this.tabIndex = -1;
  }
  toggleAttribute(name: string, force?: boolean) {
    const present = force ?? !this.attributes.has(name);
    if (present) this.setAttribute(name, "");
    else this.removeAttribute(name);
    return present;
  }
  hasAttribute(name: string) {
    return this.attributes.has(name);
  }
  getAttribute(name: string) {
    return this.attributes.has(name) ? this.attributes.get(name) ?? "" : null;
  }

  compareDocumentPosition(other: unknown): number {
    if (!isSdkElement(other) || other === this) return 0;
    return other.#sequence > this.#sequence ? 4 : 2;
  }

  contains(other: unknown): boolean {
    let at: SdkElement | undefined = isSdkElement(other) ? other : undefined;
    while (at) {
      if (at === this) return true;
      at = at.parentElement;
    }
    return false;
  }

  matches(selector: string): boolean {
    return sdkMatchesSelector(this, selector);
  }

  showPopover() {}
  hidePopover() {}

  closest(selector: string): SdkElement | null {
    let at: SdkElement | undefined = this;
    while (at) {
      if (sdkMatchesSelector(at, selector)) return at;
      at = at.parentElement;
    }
    return null;
  }
  querySelector() {
    return null;
  }

  querySelectorAll() {
    return [] as unknown[];
  }

  getRootNode() {
    return this.ownerDocument;
  }

  scrollTo() {}

  getAnimations() {
    return [];
  }

  setPointerCapture() {}
  releasePointerCapture() {}
  hasPointerCapture() {
    return false;
  }
  cloneNode() {
    return new SdkElement(this.localName);
  }

  focus() {
    sdkSetFocus(this);
  }
  blur() {
    if (sdkActiveElement === this) sdkSetFocus(null);
  }

  click() {
    this.dispatchEvent(sdkSyntheticEvent("click", { detail: 0, isTrusted: false }));
  }

  childNodes: unknown[] = [];
  children: unknown[] = [];

  checkVisibility() {
    return (
      !this.hidden &&
      !this.hasAttribute("hidden") &&
      this.getAttribute("aria-hidden") !== "true"
    );
  }

  getBoundingClientRect() {
    if (!sdkElementPopupMode && !sdkElementFocusMode) {
      return { x: 0, y: 0, top: 0, left: 0, right: 0, bottom: 0, width: 0, height: 0 };
    }
    const styleLeft = this.style.left;
    const styleTop = this.style.top;
    const left = typeof styleLeft === "string" ? parseFloat(styleLeft) || 0 : 0;
    const top = typeof styleTop === "string" ? parseFloat(styleTop) || 0 : 0;
    const x = styleLeft !== undefined ? left : this.rect.x;
    const y = styleTop !== undefined ? top : this.rect.y;
    return {
      x,
      y,
      width: this.rect.width,
      height: this.rect.height,
      top: y,
      left: x,
      right: x + this.rect.width,
      bottom: y + this.rect.height,
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

  dispatchEvent(event: SdkEvent): boolean {
    sdkDispatch(this, event);
    return !(event.cancelable && event.defaultPrevented);
  }

  #value = "";
  get value() {
    return this.#value;
  }
  set value(next: unknown) {
    this.#value = String(next);
  }

  defaultValue = "";

  id = "";

  form: unknown = null;
  name = "";
  type = "text";
  required = false;

  willValidate = false;
  validity = { valid: true };
  validationMessage = "";
  setCustomValidity() {}
}

type SdkViewportReader = () => { width: number; height: number };

let sdkViewport: SdkViewportReader = () => ({ width: 0, height: 0 });

export function setSdkViewport(read: SdkViewportReader): void {
  sdkViewport = read;
}

export class SdkDocumentClass extends SdkEventTarget {

  readonly body: SdkElement = new SdkElement("body");

  readonly documentElement: SdkElement = new SdkElement("html");
  pointerLockElement: unknown = null;
  exitPointerLock() {}
  constructor() {
    super();
    for (const key of ["clientWidth", "offsetWidth", "scrollWidth"] as const) {
      Object.defineProperty(this.documentElement, key, {
        get: () => sdkViewport().width,
        configurable: true,
      });
    }
    for (const key of ["clientHeight", "offsetHeight", "scrollHeight"] as const) {
      Object.defineProperty(this.documentElement, key, {
        get: () => sdkViewport().height,
        configurable: true,
      });
    }
  }
  get defaultView(): SdkWindowClass {
    return SdkWindow;
  }

  get activeElement(): SdkElement | null {
    return sdkActiveElement;
  }
  get hidden() {
    return false;
  }
  hasFocus() {
    return true;
  }

  getSelection() {
    return null;
  }
  getElementById(): SdkElement | null {
    return null;
  }
  querySelector(): SdkElement | null {
    return null;
  }
  querySelectorAll(): SdkElement[] {
    return [];
  }

  createElement(tag: string): SdkElement {
    return new SdkElement(tag);
  }

  createTreeWalker() {
    return { nextNode: () => null };
  }
  dispatchEvent(event: SdkEvent): boolean {
    sdkDispatch(this, event);
    return !(event.cancelable && event.defaultPrevented);
  }
}

export class SdkWindowClass extends SdkEventTarget {
  visualViewport: unknown = null;
  get document(): SdkDocumentClass {
    return SdkDocument;
  }

  getComputedStyle(element: unknown): SdkStyle {
    if (isSdkElement(element)) return element.style;
    const style = (element as { style?: unknown } | null | undefined)?.style;
    return typeof style === "object" && style !== null && "setProperty" in style
      ? (style as SdkStyle)
      : new SdkStyle();
  }
  get innerWidth() {
    return sdkViewport().width;
  }
  get innerHeight() {
    return sdkViewport().height;
  }
  scrollY = 0;
  scrollX = 0;

  requestAnimationFrame(callback: (time: number) => void): number {
    if (typeof requestAnimationFrame === "function") {
      return requestAnimationFrame(callback);
    }
    return setTimeout(() => callback(Date.now()), 16) as unknown as number;
  }
  cancelAnimationFrame(handle: number) {
    if (typeof cancelAnimationFrame === "function") cancelAnimationFrame(handle);
    else clearTimeout(handle as unknown as ReturnType<typeof setTimeout>);
  }

  setTimeout(callback: (...args: unknown[]) => void, ms?: number, ...args: unknown[]): number {
    return (setTimeout as (...a: unknown[]) => number)(callback, ms, ...args);
  }
  clearTimeout(handle: unknown) {
    (clearTimeout as (h: unknown) => void)(handle);
  }
  dispatchEvent(event: SdkEvent): boolean {
    sdkDispatch(this, event);
    return !(event.cancelable && event.defaultPrevented);
  }
}

export const SdkDocument: SdkDocumentClass = new SdkDocumentClass();
export const SdkWindow: SdkWindowClass = new SdkWindowClass();

function sdkDefine(target: Record<string, unknown>, key: string, value: unknown): void {
  try {
    Object.defineProperty(target, key, { value, configurable: true, writable: true });
  } catch {
    target[key] = value;
  }
}

function sdkDefineGetter(target: Record<string, unknown>, key: string, get: () => number): void {
  try {
    Object.defineProperty(target, key, { get, configurable: true });
  } catch {

  }
}

let sdkEventGlobalsInstalled = false;

export function installSdkEventGlobals(): void {
  const g = globalThis as Record<string, unknown>;
  if (sdkEventGlobalsInstalled) return;
  sdkEventGlobalsInstalled = true;
  if (typeof g.Document === "function" && g.document instanceof g.Document) return;

  installSdkFormGlobals();

  for (const name of [
    "Element",
    "HTMLElement",
    "ShadowRoot",
    "Document",
    "HTMLFormElement",
    "HTMLFieldSetElement",
    "HTMLDialogElement",
    "HTMLAnchorElement",
  ]) {
    if (typeof g[name] !== "function") g[name] = class {};
  }
  for (const name of ["MouseEvent", "KeyboardEvent", "PointerEvent"]) {
    if (typeof g[name] !== "function") g[name] = SdkEvent;
  }

  g.Event = SdkEvent;
  if (typeof g.InputEvent !== "function") g.InputEvent = SdkEvent;
  if (typeof g.NodeFilter === "undefined") g.NodeFilter = { SHOW_TEXT: 4 };
  if (typeof g.CSS !== "object" || g.CSS === null) {
    g.CSS = { escape: sdkCssEscape, supports: () => false };
  }

  g.document = SdkDocument;
  if (typeof g.window === "undefined") {

    g.window = SdkWindow;
  } else {

    const win = g.window as Record<string, unknown>;
    for (const name of ["addEventListener", "removeEventListener", "dispatchEvent"] as const) {
      sdkDefine(win, name, (SdkWindow[name] as (...args: unknown[]) => unknown).bind(SdkWindow));
    }
    if (typeof win.getComputedStyle !== "function") {
      sdkDefine(win, "getComputedStyle", SdkWindow.getComputedStyle.bind(SdkWindow));
    }
    if (typeof win.innerWidth !== "number") {
      sdkDefineGetter(win, "innerWidth", () => SdkWindow.innerWidth);
    }
    if (typeof win.innerHeight !== "number") {
      sdkDefineGetter(win, "innerHeight", () => SdkWindow.innerHeight);
    }
    if (win.visualViewport === undefined) sdkDefine(win, "visualViewport", null);
  }

  if (typeof g.getComputedStyle !== "function") {
    g.getComputedStyle = SdkWindow.getComputedStyle.bind(SdkWindow);
  }
}

const ELEMENT_ROLES: Record<string, string | undefined> = {

  button: "button",
};

export type SdkBridgeProps = {
  className: string | undefined;
  accessibilityRole: string | undefined;
  accessibilityLabel: string | undefined;
  disabled: boolean | undefined;
  "aria-pressed"?: boolean;
  "aria-checked"?: boolean;
  "aria-selected"?: boolean;
  "aria-expanded"?: boolean;
  "aria-invalid"?: boolean;
};

const ariaFlag = (value: string | undefined) =>
  value === undefined ? undefined : value === "true";

export type SdkHostKeyEvent = {
  key: string;
  ctrlKey?: boolean;
  altKey?: boolean;
  metaKey?: boolean;
  shiftKey?: boolean;
  repeat?: boolean;
};

export type SdkKeyHostProps = {

  focusable: true;
  onKeyDown: (event: SdkHostKeyEvent) => void;
  onKeyUp: (event: SdkHostKeyEvent) => void;

  onFocus: () => void;

  onBlur: () => void;
};

export function sdkKeyHostProps(options: {

  event: () => { element: unknown; target?: unknown };

  focusElement?: () => unknown;
}): SdkKeyHostProps {
  const send = (type: "keydown" | "keyup", source: SdkHostKeyEvent) => {
    const { element, target } = options.event();
    if (!isSdkElement(element)) return;
    fireSdkEvent(element, type, {
      key: source.key,
      ctrlKey: source.ctrlKey === true,
      altKey: source.altKey === true,
      metaKey: source.metaKey === true,
      shiftKey: source.shiftKey === true,
      repeat: source.repeat === true,
      ...(target !== undefined ? { target } : {}),
    });
  };
  return {
    focusable: true,
    onKeyDown: (event) => send("keydown", event),
    onKeyUp: (event) => send("keyup", event),
    onFocus: () => {
      const el = options.focusElement?.();
      if (isSdkElement(el)) el.focus();
    },
    onBlur: () => {
      const el = options.focusElement?.();
      if (isSdkElement(el) && el === SdkDocument.activeElement) el.blur();
    },
  };
}

export function sdkBridgeProps(domAttrs: Attrs, element: unknown): SdkBridgeProps {
  const role = domAttrs.role ?? ELEMENT_ROLES[String(element)];
  return {
    className: domAttrs.class,
    accessibilityRole: role,
    accessibilityLabel: domAttrs["aria-label"],
    disabled:
      domAttrs["aria-disabled"] === "true" || domAttrs.disabled !== undefined
        ? true
        : undefined,
    "aria-pressed": ariaFlag(domAttrs["aria-pressed"]),
    "aria-checked": ariaFlag(domAttrs["aria-checked"]),
    "aria-selected": ariaFlag(domAttrs["aria-selected"]),
    "aria-expanded": ariaFlag(domAttrs["aria-expanded"]),
    "aria-invalid": ariaFlag(domAttrs["aria-invalid"]),
  };
}

type SdkInjectedOptions = { id: string; controller?: unknown };

export function useSdkPrimitive<
  FactoryOptions extends object,
  Instance extends SdkPrimitiveInstance,
>(
  create: (options: FactoryOptions) => Instance,
  options: Omit<FactoryOptions, keyof SdkInjectedOptions>,
  idPrefix = "ui-sdk",
): Instance {
  const reactId = React.useId();
  const id = `${idPrefix}-${reactId}`;
  const [instance] = React.useState(() =>
    unwatched(() =>
      create({
        ...options,
        controller: undefined,
        id,
      } as FactoryOptions),
    ),
  );
  React.useLayoutEffect(() => keep(instance), [instance]);
  React.useLayoutEffect(() => {
    instance.setOptions({ ...options, id });
  });
  React.useEffect(
    () => () => {
      release(instance);
      instance.destroy();
    },
    [instance],
  );
  return instance;
}

export type SdkPartOutput = {

  showing: boolean;

  domAttrs: Attrs;

  snapshot: Record<string, unknown>;

  element: string;

  sdkElement: SdkElement;

  bridgeProps: SdkBridgeProps;

  fire(eventName: string, init?: SdkSyntheticEventInit): boolean;
  press(): boolean;
};

const EMPTY_PROPS: Record<string, unknown> = {};

export function useSdkPart(
  instance: SdkPrimitiveInstance,
  slot: string,
  props: Record<string, unknown> = EMPTY_PROPS,
): SdkPartOutput {
  const part = instance.part(slot, props, true);

  const kernel = part as never;
  const [, rerender] = React.useReducer((count: number) => count + 1, 0);

  const compute = React.useCallback((): {
    showing: boolean;
    domAttrs: Attrs;
    snapshot: Record<string, unknown>;
    element: string;
  } => {
    const state = instance.get() as Record<string, unknown>;
    return {

      showing: present(kernel, props, state),
      domAttrs: attrs(kernel, props, state) as Attrs,
      snapshot: partState(kernel, props, state) as Record<string, unknown>,
      element: String(state.element ?? "unknown"),
    };

  }, [instance, part, props]);

  const lastRef = React.useRef<{
    showing: boolean;
    domAttrs: Attrs;
    snapshot: Record<string, unknown>;
  } | null>(null);

  React.useLayoutEffect(() => {
    commit(kernel, props);

    return subscribe(kernel, () => {
      const next = compute();
      const last = lastRef.current;
      if (
        last &&
        last.showing === next.showing &&
        attrsEqual(last.domAttrs, next.domAttrs) &&
        sameSlotState(last.snapshot, next.snapshot)
      ) {
        return;
      }
      rerender();
    });
  }, [part, props]);

  const sdkElementRef = React.useRef<SdkElement | null>(null);

  const [, shakeElement] = React.useReducer((c: number) => c + 1, 0);
  const elementSeenRef = React.useRef(false);
  React.useLayoutEffect(() => {
    const bound = bindSdkPart(
      kernel,
      props,
      compute().domAttrs,
      String((instance.get() as Record<string, unknown>).element ?? "unknown"),
    );
    sdkElementRef.current = bound.element;
    if (!elementSeenRef.current) {
      elementSeenRef.current = true;
      shakeElement();
    }
    return () => {
      sdkElementRef.current = null;
      elementSeenRef.current = false;
      bound.unbind();
    };
  }, [instance]);

  const current = compute();
  lastRef.current = current;

  const fire = React.useCallback(
    (eventName: string, init: SdkSyntheticEventInit = {}) => {
      const element = sdkElementRef.current;
      if (element) return fireSdkEvent(element, eventName, init).defaultPrevented;

      const event = sdkSyntheticEvent(eventName, init);
      const map = handlers(kernel) as Record<
        string,
        ((event: SdkEvent) => void) | undefined
      >;
      map[eventName]?.(event);
      return event.defaultPrevented;
    },
    [part],
  );

  return {
    showing: current.showing,
    domAttrs: current.domAttrs,
    snapshot: current.snapshot,
    element: current.element,
    sdkElement: sdkElementRef.current as SdkElement,
    bridgeProps: sdkBridgeProps(current.domAttrs, current.element),
    fire,
    press: () => fire("click"),
  };
}

export function useSdkSnapshot<T>(
  instance: SdkPrimitiveInstance,
  selector: (state: unknown) => T,
  slot = "root",
): T {
  const part = instance.part(slot, EMPTY_PROPS, true);
  const kernel = part as never;
  const selectorRef = React.useRef(selector);
  React.useLayoutEffect(() => {
    selectorRef.current = selector;
    commit(kernel, EMPTY_PROPS);
  });

  const cacheRef = React.useRef<{ hasValue: boolean; value: T }>({
    hasValue: false,
    value: undefined as T,
  });

  const subscribeSnapshot = React.useCallback(
    (onStoreChange: () => void) => subscribe(kernel, onStoreChange),
    [kernel],
  );

  const getSnapshot = React.useCallback((): T => {
    const next = selectorRef.current(instance.get());
    if (cacheRef.current.hasValue && sameSnapshot(cacheRef.current.value, next)) {
      return cacheRef.current.value;
    }
    cacheRef.current = { hasValue: true, value: next };
    return next;
  }, [instance]);

  return React.useSyncExternalStore(
    subscribeSnapshot,
    getSnapshot,
    getSnapshot,
  );
}

function sameSnapshot<T>(a: T, b: T): boolean {
  if (sameValue(a, b)) return true;
  if (
    a !== null &&
    b !== null &&
    typeof a === "object" &&
    typeof b === "object" &&
    !Array.isArray(a) &&
    !Array.isArray(b)
  ) {
    return sameSlotState(
      a as Record<string, unknown>,
      b as Record<string, unknown>,
    );
  }
  return false;
}

function attrsEqual(a: Attrs, b: Attrs): boolean {
  const keys = new Set([...Object.keys(a), ...Object.keys(b)]);
  for (const key of keys) {
    if (!sameValue(a[key], b[key])) return false;
  }
  return true;
}
