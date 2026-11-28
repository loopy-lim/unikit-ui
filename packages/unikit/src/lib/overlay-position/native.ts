import { measureInWindow } from "@unikit-bridge/ui/primitives";
import type { InstallUiSdkOverlayPositionOptions } from "./types";

import {
  FakeElement,
  installDomStubs,
  pxToNumber,
  rectFrom,
  updateRect,
  type FakeRect,
} from "../../behaviors/ui-sdk-dom";
import { position } from "@ui-sdk/core";

import {
  setOverlayPositionEngine,
  type OverlayPlacement,
  type OverlayPositionState,
} from "../overlay";

export {
  getOverlayPositionEngine,
  setOverlayPositionEngine,
} from "../overlay";
export type {
  OverlayPositionEngine,
  OverlayPositionSession,
  OverlayPositionState,
} from "../overlay";

function elementOf(ref: unknown): unknown {
  return ref && typeof ref === "object" && "current" in (ref as Record<string, unknown>)
    ? (ref as { current: unknown }).current
    : ref;
}

function measureElement(
  ref: unknown,
  callback: (rect: FakeRect | null) => void,
): void {
  const el = elementOf(ref);
  if (!el) {
    callback(null);
    return;
  }
  measureInWindow(el, (x, y, width, height, pageX, pageY) => {
    callback(
      rectFrom(pageX ?? x ?? 0, pageY ?? y ?? 0, width ?? 0, height ?? 0),
    );
  });
}

function stateKey(state: OverlayPositionState | null): string {
  return state
    ? `${state.left},${state.top},${state.placement},${state.maxWidth},${state.maxHeight}`
    : "";
}

const SIDES: readonly OverlayPlacement[] = ["top", "bottom", "left", "right"];

export type { InstallUiSdkOverlayPositionOptions } from "./types";

export function installUiSdkOverlayPosition(
  options: InstallUiSdkOverlayPositionOptions = {},
): void {
  const followIntervalMs = options.followIntervalMs ?? 200;
  installDomStubs();
  setOverlayPositionEngine({
    attach({ anchorRef, contentRef, getOptions, onPlace }) {
      let stopped = false;
      let syncQueued = false;
      let lastKey = "";
      let stopPosition: (() => void) | null = null;
      let followTimer: ReturnType<typeof setInterval> | null = null;
      const anchorRectRef: { current: FakeRect | null } = { current: null };
      let popupEl: FakeElement | null = null;
      let contentRect: FakeRect | null = null;

      const scheduleSync = () => {
        if (syncQueued || stopped || !popupEl) return;
        syncQueued = true;
        requestAnimationFrame(() => {
          syncQueued = false;
          const el = popupEl;
          if (stopped || !el) return;
          const left = pxToNumber(el.style.left);
          const top = pxToNumber(el.style.top);
          if (left === null || top === null) return;
          const side = el.getAttribute("data-side");
          const next: OverlayPositionState = {
            left,
            top,
            placement: SIDES.includes(side as OverlayPlacement)
              ? (side as OverlayPlacement)
              : getOptions().placement,
            maxWidth: pxToNumber(el.style.getPropertyValue("--available-width")),
            maxHeight: pxToNumber(el.style.getPropertyValue("--available-height")),
          };
          const key = stateKey(next);
          if (key === lastKey) return;
          lastKey = key;
          onPlace(next);
        });
      };

      const remeasureAnchor = () => {
        measureElement(anchorRef, (rect) => {
          if (rect && anchorRectRef.current) {
            updateRect(
              anchorRectRef.current,
              rect.x,
              rect.y,
              rect.width,
              rect.height,
            );
          }
        });
      };

      const begin = () => {
        if (stopped || !anchorRectRef.current || !contentRect) return;

        popupEl = new FakeElement("overlay-content", contentRect);
        popupEl.style.observer = scheduleSync;
        popupEl.attrObserver = scheduleSync;
        stopPosition = position(

          () => ({
            getBoundingClientRect: () =>
              anchorRectRef.current ?? rectFrom(0, 0, 0, 0),
          }),
          popupEl as unknown as HTMLElement,

          () => {
            const { placement, align, offset } = getOptions();
            return { side: placement, align, sideOffset: offset };
          },
        );
        scheduleSync();
        if (followIntervalMs > 0) {
          followTimer = setInterval(remeasureAnchor, followIntervalMs);
        }
      };

      measureElement(anchorRef, (rect) => {
        if (stopped || !rect) return;
        anchorRectRef.current = rect;
        begin();
      });
      measureElement(contentRef, (rect) => {
        if (stopped || !rect) return;
        contentRect = rect;
        begin();
      });

      return {
        stop() {
          stopped = true;
          if (followTimer) clearInterval(followTimer);
          stopPosition?.();
          popupEl = null;
          anchorRectRef.current = null;
          contentRect = null;
        },
      };
    },
  });
}
