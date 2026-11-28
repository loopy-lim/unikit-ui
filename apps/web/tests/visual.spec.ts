import { expect, test } from "@playwright/test";

import { catalog } from "../components/showcase/catalog";

const DEMO_PANEL_TAB = "미리보기";
const TRANSITION_SETTLE_MS = 400;

for (const item of catalog) {
  test(`component page — ${item.name}`, async ({ page }) => {
    await page.goto(`/components/${item.name}`);

    await expect(
      page.getByRole("button", { name: DEMO_PANEL_TAB }).first(),
    ).toBeVisible();
    await page.waitForTimeout(TRANSITION_SETTLE_MS);

    await expect(page).toHaveScreenshot(`${item.name}.png`, {
      fullPage: true,
    });
  });
}
