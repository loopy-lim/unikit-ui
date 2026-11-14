/**
 * audit:design — 디자인 일관성 자동 감사 (T-14, AC-10·AC-12(f) / 3차 T-18, AC-13·AC-15 확장).
 *
 * 요구 기준 8종 (a)~(h) / 내부 검사 9건((a1)(a2) 분해). 위반 1건 이상이면 exit 1.
 * 생성 기준 포맷터·THEME_ITEMS·VALUE_SOURCES·대비 산수는 generate-design.ts와 공유한다
 * (설계 원칙: 검사는 생성의 역). (a2)는 type 기반으로 theme 항목 전수(기본+프리셋 3)를
 * 값·형식·WCAG 대비(라이트 ≥4.5:1)로 검사한다.
 *
 * 실행: packages/unikit에서 `bun run audit:design` (루트: `bun run audit:design`)
 */
import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import path from "node:path";

import { lightTokens } from "../src/theme/tokens";
import {
  buildGlobalsBlock,
  buildTokensDoc,
  contrastRatioHsl,
  THEME_ITEMS,
  VALUE_SOURCES,
  BEGIN,
  END,
} from "./generate-design";

const PKG = path.resolve(import.meta.dir, "..");
const REPO = path.resolve(PKG, "..", "..");
const GLOBALS_CSS = path.join(REPO, "apps", "web", "app", "globals.css");
const REGISTRY_JSON = path.join(PKG, "registry.json");
const TOKENS_DOC = path.join(PKG, "docs", "tokens.md");

type Violation = { file: string; line?: number; detail: string };
const failures: string[] = [];
const report = (id: string, ok: boolean, summary: string, violations: Violation[] = []) => {
  if (ok) console.log(`  [OK]   (${id}) ${summary}`);
  else {
    console.log(`  [FAIL] (${id}) ${summary}`);
    for (const v of violations.slice(0, 12)) {
      console.log(`         - ${v.file}${v.line ? `:${v.line}` : ""} — ${v.detail}`);
    }
    if (violations.length > 12) console.log(`         … 외 ${violations.length - 12}건`);
    failures.push(`(${id})`);
  }
};

function walk(dir: string, exts: string[], acc: string[] = []): string[] {
  for (const name of readdirSync(dir)) {
    const p = path.join(dir, name);
    if (statSync(p).isDirectory()) walk(p, exts, acc);
    else if (exts.some((e) => name.endsWith(e))) acc.push(p);
  }
  return acc;
}

const rel = (p: string) => path.relative(REPO, p);

/** 파일 내용을 줄 번호와 함께 */
function lines(p: string) {
  const text = readFileSync(p, "utf8");
  return { text, rows: text.split("\n") };
}

function scanPattern(files: string[], pattern: RegExp, label: string): Violation[] {
  const found: Violation[] = [];
  for (const f of files) {
    const { rows } = lines(f);
    rows.forEach((row, i) => {
      // 주석 라인(포팅 판단 기록의 원본 클래스·색 인용)은 실제 토큰이 아니므로
      // 제외한다 — 사이클 40 T-4(오탐 154건 해소).
      const t = row.trim();
      if (t.startsWith("//") || t.startsWith("*") || t.startsWith("/*") || t.includes("{/*")) return;
      pattern.lastIndex = 0;
      if (pattern.test(row)) found.push({ file: rel(f), line: i + 1, detail: `${label} 발견: ${row.trim().slice(0, 90)}` });
    });
  }
  return found;
}

// ── (a1) globals.css 생성 영역 == tokens 재생성 내용 ─────────────────────────
{
  const src = readFileSync(GLOBALS_CSS, "utf8");
  const s = src.indexOf(BEGIN);
  const e = src.indexOf(END);
  if (s === -1 || e === -1) {
    report("a1", false, "globals.css 생성 마커 없음 — `bun run generate:design` 실행 필요");
  } else {
    const region = src.slice(s + BEGIN.length, e).replace(/^\n/, "").replace(/\n$/, "");
    const expect = buildGlobalsBlock();
    const vs: Violation[] =
      region === expect ? [] : [{ file: rel(GLOBALS_CSS), detail: "마커 영역이 tokens.ts 생성물과 다름(값 또는 서식 드리프트)" }];
    report("a1", region === expect, `globals.css 생성 영역 일치(${region.length}B)`, vs);
  }
}

// ── (a2) theme 항목 4종: 소스 값·형식·대비 (type 기반 전수 — AC-13 (b)(c)(d)·AC-15 (a)(b)) ──
{
  const reg = JSON.parse(readFileSync(REGISTRY_JSON, "utf8")) as {
    items: { name?: string; type?: string; cssVars?: Record<string, Record<string, string>> }[];
  };
  const themes = reg.items.filter((i) => i.type === "registry:theme");
  const expectedNames = THEME_ITEMS.map((t) => t.name);
  const vs: Violation[] = [];

  // 1) 이름 집합 일치 — 누락·과잉(이름 우연 매칭 아닌 type 기반 수집 후 소스와 대조)
  const got = themes.map((t) => t.name ?? "(이름 없음)");
  for (const n of expectedNames) if (!got.includes(n)) vs.push({ file: rel(REGISTRY_JSON), detail: `theme 항목 누락: ${n}` });
  for (const n of got) if (!expectedNames.includes(n)) vs.push({ file: rel(REGISTRY_JSON), detail: `소스에 없는 theme 항목: ${n}` });

  // 2) 값 전수 비교 + 3) 형식(키 20종·HSL 채널 문자열·radius 1종)
  const HSL = /^\d+(\.\d+)? \d+(\.\d+)?% \d+(\.\d+)?%$/;
  const keySet = Object.keys(lightTokens);
  let schemes = 0;
  for (const def of THEME_ITEMS) {
    const item = themes.find((t) => t.name === def.name);
    if (!item) continue;
    for (const scheme of ["light", "dark"] as const) {
      const src = scheme === "light" ? def.light : def.dark;
      const dst = item.cssVars?.[scheme];
      if (!dst) {
        vs.push({ file: rel(REGISTRY_JSON), detail: `${def.name}: cssVars.${scheme} 없음` });
        continue;
      }
      schemes++;
      for (const k of keySet)
        if (src[k] !== dst[k]) vs.push({ file: rel(REGISTRY_JSON), detail: `${def.name} ${scheme} ${k}: registry=${dst[k]} / 소스=${src[k]}` });
      if (Object.keys(dst).length !== 20)
        vs.push({ file: rel(REGISTRY_JSON), detail: `${def.name} ${scheme}: 키 ${Object.keys(dst).length}종(20 아님)` });
      for (const k of keySet)
        if (k !== "--radius" && !HSL.test(dst[k] ?? ""))
          vs.push({ file: rel(REGISTRY_JSON), detail: `${def.name} ${scheme} ${k}: HSL 채널 형식 아님 — ${dst[k]}` });
    }
    // 4) WCAG 대비 산수(라이트 기준 ≥4.5:1) — 소스 정의 자체의 품질 검사(AC-13 (d) 상시 시행)
    const cp = contrastRatioHsl(def.light["--primary"]!, def.light["--primary-foreground"]!);
    const cb = contrastRatioHsl(def.light["--background"]!, def.light["--foreground"]!);
    if (cp < 4.5) vs.push({ file: rel(REGISTRY_JSON), detail: `${def.name}: primary↔primary-foreground 대비 ${cp.toFixed(2)}:1 < 4.5 (소스 값 품질)` });
    if (cb < 4.5) vs.push({ file: rel(REGISTRY_JSON), detail: `${def.name}: background↔foreground 대비 ${cb.toFixed(2)}:1 < 4.5 (소스 값 품질)` });
  }
  report("a2", vs.length === 0, `theme 항목 ${themes.length}/${expectedNames.length}종 — 값 ${schemes}스킴 전수·형식·대비(≥4.5) 일치`, vs);
}

// ── (b) 원색 리터럴 0건 (src 전체 — 값 정의 파일 VALUE_SOURCES 제외, F-32 일반화) ──
{
  const excluded = new Set(VALUE_SOURCES.map((s) => path.join(PKG, s)));
  const files = walk(path.join(PKG, "src"), [".ts", ".tsx"]).filter((f) => !excluded.has(f));
  const pattern = /#[0-9a-fA-F]{3,8}\b|\brgba?\(|\bhsla?\(|\boklch\(|\bcolor-mix\(/;
  const vs = scanPattern(files, pattern, "원색 리터럴");
  report("b", vs.length === 0, `원색 리터럴 0건 (대상 ${files.length}파일, 값 정의 ${VALUE_SOURCES.length}파일 제외)`, vs);
}

// ── (c) 임의값 클래스 0건 (컴포넌트 + registry 사본) ─────────────────────────
{
  const files = [
    ...walk(path.join(PKG, "src", "components"), [".tsx"]),
    ...walk(path.join(PKG, "registry"), [".tsx"]),
  ];
  const pattern = /[a-zA-Z][a-zA-Z0-9-]*-\[[^\]]+\]/; // 클래스 형태만 — 코드 인덱싱/셀렉터 주석은 '-[' 없어 미매칭
  const vs = scanPattern(files, pattern, "임의값 클래스");
  report("c", vs.length === 0, `임의값 클래스 0건 (대상 ${files.length}파일)`, vs);
}

// ── (d) registry 사본 == 원본 (import 치환 제외) ────────────────────────────
{
  const names = [
    // 1차 배치(사이클 30)
    "button", "card", "input", "label", "badge",
    "checkbox", "radio-group", "switch", "toggle", "toggle-group",
    "tabs", "accordion", "collapsible", "progress", "aspect-ratio",
    "skeleton", "separator", "alert", "kbd", "table",
    "breadcrumb", "pagination", "textarea", "avatar", "empty",
    "field", "item", "button-group",
    // 2차 배치(사이클 40) — 33종
    "alert-dialog", "attachment", "bubble", "calendar", "carousel",
    "chart", "combobox", "command", "context-menu", "dialog",
    "direction", "drawer", "dropdown-menu", "form", "hover-card",
    "input-group", "input-otp", "marker", "menubar", "message-scroller",
    "message", "native-select", "navigation-menu", "popover", "resizable",
    "scroll-area", "select", "sheet", "sidebar", "slider",
    "sonner", "spinner", "tooltip",
  ];
  const srcFiles = readdirSync(path.join(PKG, "src", "components"))
    .filter((f) => f.endsWith(".tsx"))
    .map((f) => f.replace(/\.tsx$/, ""));
  const regFiles = readdirSync(path.join(PKG, "registry", "ui"))
    .filter((f) => f.endsWith(".tsx"))
    .map((f) => f.replace(/\.tsx$/, ""));
  const vs: Violation[] = [];
  for (const n of srcFiles) {
    if (!names.includes(n)) vs.push({ file: `src/components/${n}.tsx`, detail: "audit-design 목록(names)에 누락됨" });
    if (!regFiles.includes(n)) vs.push({ file: `registry/ui/${n}.tsx`, detail: "registry/ui 사본 파일 누락됨" });
  }
  for (const n of names) {
    const orig = readFileSync(path.join(PKG, "src", "components", `${n}.tsx`), "utf8");
    const copy = readFileSync(path.join(PKG, "registry", "ui", `${n}.tsx`), "utf8")
      .replaceAll('"@/lib/utils"', '"../lib/utils"')
      .replaceAll('"@/lib/overlay"', '"../lib/overlay"')
      .replaceAll('"@/lib/menu-nav"', '"../lib/menu-nav"');
    if (orig !== copy) vs.push({ file: `registry/ui/${n}.tsx`, detail: "src/components 원본과 내용 다름(import 치환 제외)" });
  }
  const uo = readFileSync(path.join(PKG, "src", "lib", "utils.ts"), "utf8");
  const uc = readFileSync(path.join(PKG, "registry", "lib", "utils.ts"), "utf8");
  if (uo !== uc) vs.push({ file: "registry/lib/utils.ts", detail: "src/lib/utils.ts와 byte 다름" });
  // 사이클 90 후속 — lib 모듈 사본(overlay·menu-nav)도 동일 대상.
  for (const libName of ["overlay", "menu-nav"]) {
    const lo = readFileSync(path.join(PKG, "src", "lib", `${libName}.tsx`), "utf8");
    const lc = readFileSync(path.join(PKG, "registry", "lib", `${libName}.tsx`), "utf8");
    if (lo !== lc) vs.push({ file: `registry/lib/${libName}.tsx`, detail: `src/lib/${libName}.tsx와 byte 다름` });
  }
  report("d", vs.length === 0, `registry 사본 ${names.length + 3}종 동일(import 치환 제외)`, vs);
}

// ── (e) registry.json files 경로 실재 ───────────────────────────────────────
{
  const reg = JSON.parse(readFileSync(REGISTRY_JSON, "utf8"));
  const vs: Violation[] = [];
  for (const item of reg.items as { name: string; files?: { path: string }[] }) {
    for (const f of item.files ?? []) {
      if (!existsSync(path.join(PKG, f.path))) vs.push({ file: rel(REGISTRY_JSON), detail: `${item.name}: files 경로 없음 — ${f.path}` });
    }
  }
  report("e", vs.length === 0, `files 경로 전부 실재(files 없는 theme 4종 외 ${(reg.items as unknown[]).length}항목 검사)`, vs);
}

// ── (f) docs/tokens.md == 재생성 내용 (byte) ───────────────────────────────
{
  if (!existsSync(TOKENS_DOC)) {
    report("f", false, "docs/tokens.md 없음 — `bun run generate:design` 실행 필요");
  } else {
    const cur = readFileSync(TOKENS_DOC, "utf8");
    const expect = buildTokensDoc();
    report("f", cur === expect, `tokens.md 생성물과 byte 일치(${cur.length}B)`, cur === expect ? [] : [{ file: rel(TOKENS_DOC), detail: "생성물과 다름(드리프트)" }]);
  }
}

// ── (g) Tailwind 기본 팔레트 클래스 — 원본 인용 허용 목록 외 0건 ──
// G3 F-7 보정: ① 라인 단위 스캔 + 주석 제외(scanPattern과 동일 판정),
// ② 클래스 경계를 인용부호까지 확장(기존 (^|\s) 매처는 "bg-red-500"처럼
// 따옴표에 붙은 클래스를 놓쳤다), ③ 이식 9조 #3(원본 토큰 유지)과 충돌하는
// 원본 인용 팔레트는 허용 목록으로 명시한다 — 머리주석 포팅 판단과 정합.
{
  const files = [
    ...walk(path.join(PKG, "src", "components"), [".tsx"]),
    ...walk(path.join(PKG, "registry"), [".tsx"]),
  ];
  const PALETTES = "red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose|slate|gray|zinc|neutral|stone";
  // 클래스 경계 — 공백·따옴표·줄 끝(기존 (^|\s) 매처는 "bg-red-500"처럼
  // 따옴표에 붙은 클래스를 놓쳤다 — G3 F-7).
  const EDGE = "[\\s\"'`]";
  const pattern = new RegExp(
    `(?:${EDGE})((?:[a-z-]+:)*(?:bg|text|border|ring|fill|stroke|from|via|to|divide|outline|decoration|caret|accent)-(?:white|black|(?:${PALETTES})-\\d{2,3})(?:\\/\\d+)?)(?=${EDGE})`,
    "g",
  );
  // 원본 shadcn 토큰을 그대로 유지하는 허용 목록(파일명 → 클래스들).
  // - slider: 원본 썸 bg-white(shadcn-ref/ui/slider.tsx — 이식 9조 #3)
  // - sonner: richColors 원본 팔레트 재현(머리주석 포팅 판단 — 원본 sonner
  //   토큰 emerald-600/red-600/amber-500/sky-500·white 계열)
  const PALETTE_ALLOWLIST: Record<string, RegExp> = {
    "slider.tsx": /^bg-white$/,
    "sonner.tsx": /^(?:border|bg)-(?:emerald-600|red-600|amber-500|sky-500)$|^text-white(?:\/80)?$/,
    // overlay: 모달 백드롭 딤 bg-black/50 — 원본 shadcn DialogOverlay 원본값
    // (이식 9조 #3). 사이클 90 후속부터 registry/lib 사본도 스캔 대상에 들어와
    // 명시 허용으로 옮긴다.
    "overlay.tsx": /^bg-black\/50$/,
  };
  const vs: Violation[] = [];
  let allowed = 0;
  for (const f of files) {
    const base = path.basename(f);
    const { rows } = lines(f);
    rows.forEach((row, i) => {
      const t = row.trim();
      if (t.startsWith("//") || t.startsWith("*") || t.startsWith("/*") || t.includes("{/*")) return;
      pattern.lastIndex = 0;
      let m: RegExpExecArray | null;
      const probe = ` ${row} `;
      while ((m = pattern.exec(probe)) !== null) {
        const cls = m[1];
        const allow = PALETTE_ALLOWLIST[base];
        if (allow && allow.test(cls)) {
          allowed += 1;
        } else {
          vs.push({ file: rel(f), line: i + 1, detail: `팔레트 클래스: ${cls}` });
        }
      }
    });
  }
  report(
    "g",
    vs.length === 0,
    `Tailwind 팔레트 클래스 0건 (대상 ${files.length}파일, 원본 인용 허용 ${allowed}건)`,
    vs,
  );
}

// ── (h) 브리지 flex 방향 명시 — Pressable/View 기본이 flex-col이라
// 가로 배치(items-center+gap · justify-between/end/start)에 flex-row|flex-col
// 이 없으면 웹에서 세로로 깨진다（SidebarMenuButton 사고 2026-11-12）.
{
  const files = [
    ...walk(path.join(PKG, "src", "components"), [".tsx"]),
    ...walk(path.join(PKG, "registry"), [".tsx"]),
  ];
  const FLEX = /(?<![\w-])flex(?![\w-])/;
  const DIR = /\bflex-(?:row|col)\b/;
  const CROSS =
    /\bjustify-(?:between|end|start)\b|\bitems-center\b[\s\S]{0,80}\bgap-|\bgap-[\s\S]{0,80}\bitems-center\b/;
  const vs: Violation[] = [];
  for (const f of files) {
    const { rows } = lines(f);
    rows.forEach((row, i) => {
      const t = row.trim();
      if (t.startsWith("//") || t.startsWith("*") || t.startsWith("/*") || t.includes("{/*")) return;
      if (!FLEX.test(row) || DIR.test(row)) return;
      if (!CROSS.test(row)) return;
      vs.push({
        file: rel(f),
        line: i + 1,
        detail: `가로 의도 flex에 flex-row/flex-col 없음: ${row.trim().slice(0, 90)}`,
      });
    });
  }
  report(
    "h",
    vs.length === 0,
    `브리지 flex 방향 명시(대상 ${files.length}파일, 위반 ${vs.length}건)`,
    vs,
  );
}

console.log(failures.length === 0 ? "\naudit:design PASS — 9/9 검사 통과" : `\naudit:design FAIL — 위반: ${failures.join(", ")}`);
process.exit(failures.length === 0 ? 0 : 1);
