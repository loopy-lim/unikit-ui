/**
 * check-consumer-theme — 소비자 globals.css 토큰 주입 검증 도구 (T-19, AC-14 관찰 수단 — F-31).
 *
 * 사용: packages/unikit에서
 *   bun run check:consumer <소비자 globals.css 경로> <프리셋: zinc|blue|emerald|amber>
 *
 * 동작: 중괄호 깊이 파사(문자 단위 depth 계산)로 `:root`·`.dark` 선언 블록을 추출해
 * UniKit UI 토큰 20종만 대조한다. 소비자 자산(`--sidebar*`, `--chart-*` 등)은 무시하고,
 * 값은 shadcn CLI가 넣는 `hsl(...)` 함수 래핑 양쪽(래핑/비래핑)을 허용한다(스트립 후 비교).
 * 20키 전부 양 스킴에서 일치하면 exit 0, 아니면 불일치 상세 출력 후 exit 1.
 *
 * 재적용 실증(AC-14)에서 설치·교체·멱등 판정을 이 도구로 기계 관찰한다.
 */
import { readFileSync } from "node:fs";

import { darkTokens, lightTokens } from "../src/theme/tokens";
import { themePresets, type PresetKey } from "../src/theme/presets";

/** 선언 블록을 중괄호 깊이로 정확히 추출 — 선택자는 «줄 시작 + 선택자 + {» 형태만 인정
 *  (예: `@custom-variant dark (&:is(.dark *))` 같은 본문 언급은 선택자가 아님) */
function extractBlock(src: string, selector: ":root" | ".dark"): string | null {
  const re = new RegExp(`(^|\\n)[ \\t]*${selector.replace(".", "\\.")}[ \\t]*\\{`);
  const m = re.exec(src);
  if (!m) return null;
  const open = src.indexOf("{", m.index + m[0].length - 1);
  let depth = 0;
  for (let i = open; i < src.length; i++) {
    if (src[i] === "{") depth++;
    else if (src[i] === "}") {
      depth--;
      if (depth === 0) return src.slice(open + 1, i);
    }
  }
  return null;
}

/** 블록 본문에서 CSS 사용자 정의 속성 파싱 — `hsl(...)` 래핑은 스트립 */
function parseVars(block: string): Record<string, string> {
  const out: Record<string, string> = {};
  for (const m of block.matchAll(/(--[a-zA-Z0-9-]+)\s*:\s*([^;]+);/g)) {
    let v = m[2]!.trim();
    if (v.startsWith("hsl(") && v.endsWith(")")) v = v.slice(4, -1).trim();
    out[m[1]!] = v;
  }
  return out;
}

// ── 진입 ────────────────────────────────────────────────────────────────────
const args = process.argv.slice(2);
if (args.length !== 2) {
  console.error("사용법: bun run check:consumer <소비자 globals.css 경로> <zinc|blue|emerald|amber>");
  process.exit(2);
}
const [cssPath, presetArg] = args as [string, string];

const expected =
  presetArg === "zinc"
    ? { light: lightTokens, dark: darkTokens }
    : themePresets[presetArg as PresetKey];
if (!expected) {
  console.error(`알 수 없는 프리셋: ${presetArg} (zinc|blue|emerald|amber)`);
  process.exit(2);
}

let src: string;
try {
  src = readFileSync(cssPath, "utf8");
} catch (e) {
  console.error(`파일을 읽을 수 없습니다: ${cssPath} — ${e instanceof Error ? e.message : e}`);
  process.exit(2);
}

let mismatches = 0;
for (const [scheme, tokens] of [["light", expected.light], ["dark", expected.dark]] as const) {
  const selector = scheme === "light" ? ":root" : ".dark";
  const block = extractBlock(src, selector);
  if (!block) {
    console.error(`[FAIL] ${selector} 블록을 찾을 수 없습니다.`);
    mismatches++;
    continue;
  }
  const got = parseVars(block);
  const keys = Object.keys(tokens) as (keyof typeof tokens)[];
  let ok = 0;
  for (const k of keys) {
    const g = got[k];
    if (g === undefined) {
      console.error(`[FAIL] ${selector} ${k} 없음(주입 누락 또는 교체 실패)`);
      mismatches++;
    } else if (g !== tokens[k]) {
      console.error(`[FAIL] ${selector} ${k}: 소비자=${g} / 기대(${presetArg})=${tokens[k]}`);
      mismatches++;
    } else ok++;
  }
  console.log(`[${ok === keys.length ? "OK" : "FAIL"}] ${selector}: UniKit UI ${keys.length}키 중 ${ok} 일치 (소비자 자산 ${Object.keys(got).length - keys.length}키 무시)`);
}

if (mismatches === 0) {
  console.log(`check:consumer PASS — ${cssPath} 가 프리셋 '${presetArg}' 와 전수 일치`);
  process.exit(0);
}
console.log(`check:consumer FAIL — 불일치 ${mismatches}건`);
process.exit(1);
