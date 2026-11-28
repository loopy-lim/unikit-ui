import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "tests",
  timeout: 30_000,
  fullyParallel: true,
  retries: 0,
  expect: {
    toHaveScreenshot: {
      threshold: 0,
      maxDiffPixels: 32,
      animations: "disabled",
      caret: "hide",
      scale: "css",
    },
  },
  use: {
    baseURL: "http://localhost:4173",
    colorScheme: "light",
    viewport: { width: 1280, height: 900 },
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  webServer: {
    command: "bun x serve out -p 4173",
    url: "http://localhost:4173/components",
    reuseExistingServer: !process.env.CI,
    timeout: 60_000,
  },
});
