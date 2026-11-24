/**
 * generate:nsh-icons — 브리지가 그리는 32종 lucide 아이콘의 경로 데이터를
 * lucide-react(dist/esm/icons/*.mjs의 `__iconData`)에서 뽑아
 * src/nsh-ui/lucide-icons.generated.ts로 만든다.
 *
 * - 생성물이므로 lucide-icons.generated.ts를 직접 편집하지 않는다(재실행으로
 *   재생성). 아이콘 목록은 src/bridge/web.tsx의 *Icon export 면과 1:1.
 * - nsh 브리지는 lucide-react를 런타임 의존으로 두지 않고(QuickJS에서 React
 *   컴포넌트로 그리지 않는다 — nsh:rt 호스트가 svg를 모름) 경로 데이터만
 *   Canvas(Path2D)로 그린다.
 */
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const outPath = join(here, "../src/nsh-ui/lucide-icons.generated.ts");

/** web.tsx가 export하는 아이콘 면(PascalCase) → lucide 모듈명(kebab-case). */
const ICONS: Record<string, string> = {
  Check: "check",
  ChevronDown: "chevron-down",
  ChevronUp: "chevron-up",
  ChevronRight: "chevron-right",
  ChevronLeft: "chevron-left",
  X: "x",
  Search: "search",
  Minus: "minus",
  Circle: "circle",
  MoreHorizontal: "more-horizontal",
  ArrowLeft: "arrow-left",
  ArrowRight: "arrow-right",
  ArrowUp: "arrow-up",
  ArrowDown: "arrow-down",
  Info: "info",
  AlertCircle: "circle-alert",
  CheckCircle2: "circle-check-big",
  XCircle: "circle-x",
  Loader2: "loader-circle",
  PanelLeft: "panel-left",
  GripVertical: "grip-vertical",
  Bold: "bold",
  Italic: "italic",
  Strikethrough: "strikethrough",
  Heading1: "heading-1",
  Heading2: "heading-2",
  List: "list",
  ListOrdered: "list-ordered",
  TextQuote: "text-quote",
  Code: "code",
  Undo2: "undo-2",
  Redo2: "redo-2",
};

type LucideIconNode = ReadonlyArray<
  readonly [tag: string, attrs: Readonly<Record<string, string | number>>]
>;

const header = `/** 생성물 — scripts/generate-nsh-icons.ts가 lucide-react(${await lucideVersion()})에서
 * 뽑았다. 직접 편집 금지(재생성: bun run generate:nsh-icons).
 * nsh 킵(src/nsh-ui/icons.tsx)이 Canvas(Path2D)로 그리는 lucide 아이콘 경로 데이터. */
`;

async function lucideVersion(): Promise<string> {
  const pkg = (await import("lucide-react/package.json", { with: { type: "json" } }))
    .default as { version: string };
  return pkg.version;
}

/** 아이콘 모듈을 읽어 경로 데이터를 반환한다 — 별칭 모듈(circle-alert 등)은
 *  `export { default } from './원본.mjs'` 재수출 스텁이라 원본을 따라간다. */
async function loadIconNode(modPath: string): Promise<LucideIconNode> {
  const mod = (await import(pathToFileURL(modPath).href)) as {
    __iconData?: { node: LucideIconNode };
  };
  if (mod.__iconData) return mod.__iconData.node;
  const source = readFileSync(modPath, "utf8");
  const target = source.match(/from\s+'"?'?\"?'?(\.{2}[^"']+)"?'?/);
  const reExport = source.match(/export\s+\{[^}]*\}\s+from\s+['"]([^'"]+)['"]/);
  const rel = reExport?.[1] ?? target?.[1];
  if (!rel) throw new Error(`icon module without __iconData or re-export: ${modPath}`);
  return loadIconNode(join(dirname(modPath), rel));
}

const entries: string[] = [];
for (const [name, mod] of Object.entries(ICONS)) {
  // exports 맵이 개별 아이콘 모듈을 노출하지 않아 설치 경로에서 직접 잡는다
  // (루트 워크스페이스 node_modules — bun 호이스팅).
  const root = join(here, "../../../node_modules");
  const modPath = join(root, `lucide-react/dist/esm/icons/${mod}.mjs`);
  entries.push(`  ${name}: ${JSON.stringify(await loadIconNode(modPath))},`);
}

const body = `export type NshLucideNode = ReadonlyArray<
  readonly [tag: string, attrs: Readonly<Record<string, string | number>>]
>;

export const NSH_LUCIDE_ICONS: Readonly<Record<string, NshLucideNode>> = {
${entries.join("\n")}
};
`;

mkdirSync(dirname(outPath), { recursive: true });
writeFileSync(outPath, header + body, "utf8");
console.log(`generated ${outPath} (${Object.keys(ICONS).length} icons)`);
