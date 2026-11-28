import {
  MessageProcessor,
  type ActionListener,
  type Catalog,
  type FunctionImplementation,
  type ProcessableMessagePayload,
  type RendererErrorMessage,
  type SurfaceModel,
} from "@a2ui/web_core";

import type { UnikitA2uiComponent } from "./types";

export type A2uiProcessor = {
  processor: MessageProcessor<UnikitA2uiComponent>;
  process(messages: ProcessableMessagePayload): RendererErrorMessage[];
  getSurface(id: string): SurfaceModel<UnikitA2uiComponent> | undefined;
  surfaces(): ReadonlyMap<string, SurfaceModel<UnikitA2uiComponent>>;
  dispose(): void;
};

export function createA2uiProcessor(
  catalogs: Array<Catalog<UnikitA2uiComponent, FunctionImplementation>>,
  options?: { onAction?: ActionListener },
): A2uiProcessor {
  const processor = new MessageProcessor<UnikitA2uiComponent>(
    catalogs,
    options?.onAction,
    { version: "1.0" },
  );
  return {
    processor,
    process: (messages) => processor.processMessagesWithErrors(messages),
    getSurface: (id) => processor.model.getSurface(id),
    surfaces: () => processor.model.surfacesMap,
    dispose: () => {
      for (const id of processor.model.surfacesMap.keys()) {
        processor.processMessages([{ version: "1.0", deleteSurface: { surfaceId: id } }]);
      }
    },
  };
}
