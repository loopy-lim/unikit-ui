/**
 * 빌드 전 레지스트리를 apps/web/public/r/*.json 으로 정적 생성한다.
 * Cloudflare Pages(static export)에서도 /r/<name>.json · /r/registry.json 이
 * 동일 URL로 서빙되도록 한다. (Route Handler는 output:export 와 공존 불가)
 *
 * 환경변수:
 *   SITE_ORIGIN — 레지스트리 homepage 에 쓸 오리진
 *                 (기본: https://ui.ll3.kr)
 */
import { mkdir, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { loadRegistry, loadRegistryItem } from "../lib/registry";

const SCRIPT_DIR = path.dirname(fileURLToPath(import.meta.url));
const OUT_DIR = path.resolve(SCRIPT_DIR, "..", "public", "r");
const SITE_ORIGIN = (
  process.env.SITE_ORIGIN ?? "https://ui.ll3.kr"
).replace(/\/$/, "");

async function main() {
  await rm(OUT_DIR, { recursive: true, force: true });
  await mkdir(OUT_DIR, { recursive: true });
  // git이 빈 public/r 를 추적하도록 .gitkeep 복구(생성 JSON은 gitignore)
  await writeFile(path.join(OUT_DIR, ".gitkeep"), "", "utf8");

  const catalog = await loadRegistry();
  const homepage = `${SITE_ORIGIN}/r/registry.json`;
  const catalogOut = { ...catalog, homepage };

  await writeFile(
    path.join(OUT_DIR, "registry.json"),
    `${JSON.stringify(catalogOut, null, 2)}\n`,
    "utf8",
  );

  const names = (catalog.items ?? []).map((item: { name: string }) => item.name);
  for (const name of names) {
    const item = await loadRegistryItem(name);
    await writeFile(
      path.join(OUT_DIR, `${name}.json`),
      `${JSON.stringify(item, null, 2)}\n`,
      "utf8",
    );
  }

  console.log(
    `generate-registry-static: ${names.length} items + registry.json → public/r (homepage=${homepage})`,
  );
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
