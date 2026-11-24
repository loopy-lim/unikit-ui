/**
 * Regenerates `nsh-types/`: the TypeScript surface of the `nsh` runtime
 * modules, as `nsh init` scaffolds it for an app. The native kit
 * (`src/nsh-ui`) compiles against these — `tsconfig.nsh-ui.json` maps the
 * `nsh` / `nsh/*` imports onto this copy. Re-run after upgrading the nsh CLI
 * (`nsh --version`): `bun run sync:nsh-types`.
 */
import { cpSync, mkdtempSync, rmSync, writeFileSync, existsSync, mkdirSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { execSync } from "node:child_process";

const outDir = join(import.meta.dir, "..", "nsh-types");
const tmp = mkdtempSync(join(tmpdir(), "nsh-types-"));

try {
  writeFileSync(
    join(tmp, "nsh.json"),
    JSON.stringify({ name: "type-sync", id: "com.example.typesync", version: "1.0.0", build: 1 }),
  );
  execSync("nsh init .", { cwd: tmp, stdio: "pipe" });
  const generated = join(tmp, ".nsh", "types", "nsh");
  if (!existsSync(join(generated, "index.d.ts"))) {
    throw new Error("nsh init did not scaffold .nsh/types/nsh — cannot sync");
  }
  rmSync(outDir, { recursive: true, force: true });
  mkdirSync(outDir, { recursive: true });
  cpSync(generated, outDir, { recursive: true });
} finally {
  rmSync(tmp, { recursive: true, force: true });
}
