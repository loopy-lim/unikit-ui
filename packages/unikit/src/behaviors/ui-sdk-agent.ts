import { agentTools, createAgent } from "@ui-sdk/core/agent";
import { installSdkEventGlobals, setSdkElementAgentMode } from "./ui-sdk-renderer";

export type SdkAgentOptions = Parameters<typeof createAgent>[0];
export type SdkAgent = ReturnType<typeof createAgent>;

export function installSdkAgentDom(): void {
  installSdkEventGlobals();
  const g = globalThis as Record<string, unknown>;

  if (typeof g.requestAnimationFrame !== "function") {
    g.requestAnimationFrame = (callback: (time: number) => void) =>
      setTimeout(() => callback(Date.now()), 0) as unknown as number;
  }
  if (typeof g.cancelAnimationFrame !== "function") {
    g.cancelAnimationFrame = (handle: number) => {
      clearTimeout(handle as unknown as ReturnType<typeof setTimeout>);
    };
  }
}

export function createSdkAgent(options?: SdkAgentOptions): SdkAgent {
  installSdkAgentDom();
  setSdkElementAgentMode(true);
  return createAgent(options);
}

export { agentTools };
