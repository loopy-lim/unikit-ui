/**
 * audit:design — 디자인 일관성 자동 감사 (T-14, AC-10·AC-12(f) / 3차 T-18, AC-13·AC-15 확장).
 *
 * 요구 기준 7종 (a)~(g) / 내부 검사 8건((a1)(a2) 분해). 위반 1건 이상이면 exit 1.
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
    "button", "card", "input", "label", "badge",
    "checkbox", "radio-group", "switch", "toggle", "toggle-group",
    "tabs", "accordion", "collapsible", "progress", "aspect-ratio",
    "skeleton", "separator", "alert", "kbd", "table",
    "breadcrumb", "pagination", "textarea", "avatar", "empty",
    "field", "item", "button-group",
  ];
  const vs: Violation[] = [];
  for (const n of names) {
    const orig = readFileSync(path.join(PKG, "src", "components", `${n}.tsx`), "utf8");
    const copy = readFileSync(path.join(PKG, "registry", "ui", `${n}.tsx`), "utf8").replaceAll('"@/lib/utils"', '"../lib/utils"');
    if (orig !== copy) vs.push({ file: `registry/ui/${n}.tsx`, detail: "src/components 원본과 내용 다름(import 치환 제외)" });
  }
  const uo = readFileSync(path.join(PKG, "src", "lib", "utils.ts"), "utf8");
  const uc = readFileSync(path.join(PKG, "registry", "lib", "utils.ts"), "utf8");
  if (uo !== uc) vs.push({ file: "registry/lib/utils.ts", detail: "src/lib/utils.ts와 byte 다름" });
  report("d", vs.length === 0, `registry 사본 ${names.length + 1}종 동일(import 치환 제외)`, vs);
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

// ── (g) Tailwind 기본 팔레트 클래스 0건 (확정 매처 — 12-design-plan §2.2) ──
{
  const files = [
    ...walk(path.join(PKG, "src", "components"), [".tsx"]),
    ...walk(path.join(PKG, "registry"), [".tsx"]),
  ];
  const PALETTES = "red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose|slate|gray|zinc|neutral|stone";
  const pattern = new RegExp(
    `(?:^|\\s)(?:[a-z-]+:)*(?:bg|text|border|ring|fill|stroke|from|via|to|divide|outline|decoration|caret|accent)-(?:white|black|(?:${PALETTES})-\\d{2,3})(?:\\/\\d+)?(?=\\s|$)`,
    "g",
  );
  const vs: Violation[] = [];
  for (const f of files) {
    const { text } = lines(f);
    pattern.lastIndex = 0;
    let m: RegExpExecArray | null;
    while ((m = pattern.exec(text)) !== null) {
      const line = text.slice(0, m.index).split("\n").length;
      vs.push({ file: rel(f), line, detail: `팔레트 클래스: ${m[0].trim()}` });
    }
  }
  report("g", vs.length === 0, `Tailwind 팔레트 클래스 0건 (대상 ${files.length}파일)`, vs);
}

console.log(failures.length === 0 ? "\naudit:design PASS — 8/8 검사 통과" : `\naudit:design FAIL — 위반: ${failures.join(", ")}`);
process.exit(failures.length === 0 ? 0 : 1);
