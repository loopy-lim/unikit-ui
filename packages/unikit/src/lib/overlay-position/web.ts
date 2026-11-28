import { position } from "@ui-sdk/core";
import type { InstallUiSdkOverlayPositionOptions } from "./types";

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

const SIDES: readonly OverlayPlacement[] = ["top", "bottom", "left", "right"];

function domElementOf(ref: unknown): HTMLElement | null {
  if (typeof window === "undefined") return null;
  const el =
    ref && typeof ref === "object" && "current" in (ref as Record<string, unknown>)
      ? (ref as { current: unknown }).current
      : ref;
  if (!el || typeof el !== "object") return null;
  const node = el as { nodeType?: number };
  return node.nodeType === 1 ? (el as HTMLElement) : null;
}

function pxOf(value: string): number | null {
  if (!value) return null;
  const n = Number.parseFloat(value);
  return Number.isFinite(n) ? n : null;
}

function sideOf(el: HTMLElement, fallback: OverlayPlacement): OverlayPlacement {
  const side = el.getAttribute("data-side");
  return SIDES.includes(side as OverlayPlacement) ? (side as OverlayPlacement) : fallback;
}

function stateKey(state: OverlayPositionState | null): string {
  return state
    ? `${state.left},${state.top},${state.placement},${state.maxWidth},${state.maxHeight}`
    : "";
}

export type { InstallUiSdkOverlayPositionOptions } from "./types";

export function installUiSdkOverlayPosition(
  _options?: InstallUiSdkOverlayPositionOptions,
): void {
  setOverlayPositionEngine({
    attach({ anchorRef, contentRef, getOptions, onPlace }) {
      const anchorEl = domElementOf(anchorRef);
      const contentEl = domElementOf(contentRef);
      if (!anchorEl || !contentEl) {

        return { stop: () => {} };
      }
      let stopped = false;
      let frame = 0;
      let lastKey = "";
      const report = () => {
        const left = pxOf(contentEl.style.left);
        const top = pxOf(contentEl.style.top);
        if (left === null || top === null) return;
        const next: OverlayPositionState = {
          left,
          top,
          placement: sideOf(contentEl, getOptions().placement),
          maxWidth: pxOf(contentEl.style.getPropertyValue("--available-width")),
          maxHeight: pxOf(contentEl.style.getPropertyValue("--available-height")),
        };
        const key = stateKey(next);
        if (key === lastKey) return;
        lastKey = key;
        onPlace(next);
      };
      const poll = () => {
        if (stopped) return;
        report();
        frame = window.requestAnimationFrame(poll);
      };

      const stopPosition = position(anchorEl, contentEl, () => {
        const { placement, align, offset } = getOptions();
        return { side: placement, align, sideOffset: offset };
      });
      report();
      frame = window.requestAnimationFrame(poll);
      return {
        stop() {
          stopped = true;
          if (frame) window.cancelAnimationFrame(frame);
          stopPosition();
        },
      };
    },
  });
}
