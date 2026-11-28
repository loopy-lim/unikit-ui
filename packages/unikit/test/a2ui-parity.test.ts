import { describe, expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { join } from "node:path";

import { createA2uiBasicCatalog } from "../src/a2ui/catalog-basic";

const fixture = JSON.parse(
  readFileSync(join(import.meta.dir, "fixtures", "a2ui-basic-catalog.json"), "utf8"),
) as Record<string, unknown>;

test("기본 카탈로그가 공식 v1.0 문서와 정확히 일치한다", () => {
  const catalog = createA2uiBasicCatalog();
  const json = catalog.toJson() as Record<string, unknown>;
  const fixtureSorted = JSON.parse(JSON.stringify(fixture));
  const jsonText = JSON.stringify(json, Object.keys(json).sort());
  const fixtureText = JSON.stringify(fixtureSorted, Object.keys(fixtureSorted).sort());
  if (jsonText !== fixtureText) {
    const jsonPretty = JSON.stringify(json, null, 1);
    const fixturePretty = JSON.stringify(fixtureSorted, null, 1);
    writeDiffArtifacts(jsonPretty, fixturePretty);
  }
  expect(jsonText).toBe(fixtureText);
});

function writeDiffArtifacts(actual: string, expected: string): void {
  const { writeFileSync } = require("node:fs") as typeof import("node:fs");
  writeFileSync("/tmp/a2ui-parity-actual.json", actual);
  writeFileSync("/tmp/a2ui-parity-expected.json", expected);
}
