import type { BridgeKeyEvent } from "../bridge/types";

import { isTypeaheadKey } from "@ui-sdk/core";

export type SdkKeyEvent = Parameters<typeof isTypeaheadKey>[0];

export { createTypeahead, isTypeaheadKey } from "@ui-sdk/core";
export type { TreeCheckedState, TreeCheckStrategy } from "@ui-sdk/core";
export {
  createTreeCollection,
  treeCheckedStates,
  treeDataNodes,
  treeFromPaths,
  toggleTreeChecked,
  visibleTreeRows,
} from "@ui-sdk/core";
export type {
  TreeCollection,
  TreeCollectionNode,
  TreeItemData,
  TreeRow,
} from "@ui-sdk/core";
export { fuzzyScore, matchRanges, matchSegments } from "@ui-sdk/core/text-match";
export type { MatchRange, MatchSegment } from "@ui-sdk/core/text-match";

export function toSdkKeyEvent(event: BridgeKeyEvent): SdkKeyEvent {
  return {
    key: event.key,
    ctrlKey: event.ctrlKey ?? false,
    metaKey: event.metaKey ?? false,
    altKey: event.altKey ?? false,
    shiftKey: event.shiftKey ?? false,

    preventDefault: () => event.preventDefault(),
    stopPropagation: () => event.stopPropagation?.(),
  } as unknown as SdkKeyEvent;
}
