/**
 * generate:design — 디자인 토큰 사본 일괄 생성 (T-13, AC-9 / 3차 T-17, AC-13 /
 * 엔진 교체 확장 — uniwind 네이티브 CSS 사본·@theme inline 매핑 포함).
 *
 * 값의 출처는 src/theme/의 값 정의 파일들(VALUE_SOURCES — 기본 tokens.ts + 프리셋 presets.ts)이며
 * 이 스크립트가 사본들을 재생성한다:
 *   ① 두 앱 전역 CSS의 @theme inline 매핑 블록(토큰 키 → Tailwind 유틸리티 연결)
 *   ② apps/web/app/globals.css 의 :root/.dark 변수 블록(기본 테마만)
 *   ③ apps/expo/global.css 의 @variant light/dark 블록(uniwind — 기본 테마만)
 *   ④ registry.json 의 theme 항목 4종(cssVars light/dark — 기본 + 프리셋 3)
 *   ⑤ docs/tokens.md 토큰 카탈로그(기본 값 표 + 프리셋 목록 + 사용 규칙)
 *
 * 마커는 앱 세팅 시 각 CSS에 심어둔다 — 없으면 복구를 시도하지 않고 즉시 중단한다
 * (값·서식 파손 방지). 실행은 멱등: 같은 입력 → 같은 출력이며 내용 변화가 없으면
 * 쓰기를 생략한다(diff 0 · mtime 불변).
 *
 * 실행: packages/unikit에서 `bun run generate:design`
 */
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";

import { darkTokens, lightTokens } from "../src/theme/tokens";
import { themePresets, type ThemePreset } from "../src/theme/presets";

const PKG = path.resolve(import.meta.dir, "..");
const REPO = path.resolve(PKG, "..", "..");
const GLOBALS_CSS = path.join(REPO, "apps", "web", "app", "globals.css");
const EXPO_GLOBALS_CSS = path.join(REPO, "apps", "expo", "global.css");
const REGISTRY_JSON = path.join(PKG, "registry.json");
const TOKENS_DOC = path.join(PKG, "docs", "tokens.md");

export const BEGIN = "/* ⛔ UNIKIT-TOKENS:BEGIN — bun run generate:design이 생성. 수동 수정 금지. */";
export const END = "/* UNIKIT-TOKENS:END */";
export const MAP_BEGIN = "/* ⛔ UNIKIT-THEME-MAP:BEGIN — bun run generate:design이 생성. 수동 수정 금지. */";
export const MAP_END = "/* UNIKIT-THEME-MAP:END */";

/**
 * 토큰 값을 정의하는 소스 파일 목록(패키지 기준 경로) — 감사 (b) 원색 검사의 제외 목록과 공유.
 * 값 파일 추가 시 이 상수와 import를 같은 파일(여기)에서 갱신한다(F-32 일반화).
 */
export const VALUE_SOURCES = ["src/theme/tokens.ts", "src/theme/presets.ts"] as const;

/** registry theme 항목 정의 — 이름↔값 소스 매핑의 단일 정의점(audit가 import해 공유) */
export interface ThemeItemDef {
  name: string;
  title: string;
  label: string;
  neutral: string;
  primaryStep: string;
  light: Record<string, string>;
  dark: Record<string, string>;
  description: string;
}

/** theme 항목 4종 — 순서가 registry 주입 순서다(utils 다음 고정). 기본(zinc)은 tokens.ts가 출처. */
export const THEME_ITEMS: ThemeItemDef[] = [
  {
    name: "theme",
    title: "UniKit UI 디자인 토큰 (라이트/다크)",
    label: "Zinc (기본)",
    neutral: "zinc",
    primaryStep: "zinc-900",
    light: { ...lightTokens },
    dark: { ...darkTokens },
    description:
      "tokens.ts 단일 출처에서 생성된 디자인 토큰 20종(색 19 + radius). add 한 번으로 소비자 CSS에 :root/.dark 변수가 주입됩니다. 재생성은 `bun run generate:design`.",
  },
  presetEntry("blue"),
  presetEntry("emerald"),
  presetEntry("amber"),
];

function presetEntry(key: keyof typeof themePresets): ThemeItemDef {
  const p: ThemePreset = themePresets[key];
  return {
    name: `theme-${key}`,
    title: `UniKit UI 프리셋 테마 — ${p.label} (${p.neutral} 중립)`,
    label: p.label,
    neutral: p.neutral,
    primaryStep: p.primaryStep,
    light: { ...p.light },
    dark: { ...p.dark },
    description:
      `UniKit UI 프리셋 테마(${p.label} / 중립 ${p.neutral}). Tailwind 공식 팔레트에서 계산해 WCAG 대비(라이트 기준 ≥4.5:1)를 검증한 값입니다. ` +
      "같은 방식으로 add하면 기존 토큰 값을 그 자리에서 교체합니다.",
  };
}

/**
 * HSL 채널 문자열 2개("H S% L%")의 WCAG 대비비 — tokens.md 프리셋 표와 audit:design 대비 검사가 공유.
 * 의존성 없는 자체 산수(HSL→sRGB→상대휘도). --radius 등 비색 토큰 입력은 NaN을 돌려준다.
 */
export function contrastRatioHsl(a: string, b: string): number {
  const hslToRgb = (s: string): [number, number, number] => {
    const parts = s.trim().split(/\s+/);
    const h = parseFloat(parts[0]);
    const sat = parseFloat(parts[1]) / 100;
    const lig = parseFloat(parts[2]) / 100;
    const c = (1 - Math.abs(2 * lig - 1)) * sat;
    const hp = (h % 360) / 60;
    const x = c * (1 - Math.abs((hp % 2) - 1));
    let r = 0;
    let g = 0;
    let b2 = 0;
    if (hp < 1) { r = c; g = x; }
    else if (hp < 2) { r = x; g = c; }
    else if (hp < 3) { g = c; b2 = x; }
    else if (hp < 4) { g = x; b2 = c; }
    else if (hp < 5) { r = x; b2 = c; }
    else { r = c; b2 = x; }
    const m = lig - c / 2;
    return [(r + m) * 255, (g + m) * 255, (b2 + m) * 255];
  };
  const lum = (rgb: [number, number, number]): number => {
    const f = (v: number) => {
      const c = v / 255;
      return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
    };
    return 0.2126 * f(rgb[0]) + 0.7152 * f(rgb[1]) + 0.0722 * f(rgb[2]);
  };
  const [x, y] = [lum(hslToRgb(a)), lum(hslToRgb(b))].sort((p, q) => q - p);
  return (x + 0.05) / (y + 0.05);
}

/** 토큰 역할·대표 사용 클래스 — 사람이 다루는 유일한 메타데이터(값은 tokens.ts가 출처) */
const TOKEN_META: Record<string, { role: string; usage: string }> = {
  "--background": { role: "화면 전체 기본 배경", usage: "bg-background (provider 래퍼)" },
  "--foreground": { role: "기본 텍스트·아이콘 전경색", usage: "text-foreground" },
  "--card": { role: "카드 표면 배경", usage: "bg-card" },
  "--card-foreground": { role: "카드 위 텍스트 전경색", usage: "text-card-foreground" },
  "--popover": { role: "팝오버·드롭다운 표면 — v0.1 컴포넌트 미사용, 확장용", usage: "bg-popover (예약)" },
  "--popover-foreground": { role: "팝오버 위 텍스트 — v0.1 미사용, 확장용", usage: "text-popover-foreground (예약)" },
  "--primary": { role: "주요 행동 색(기본 버튼 배경)", usage: "bg-primary" },
  "--primary-foreground": { role: "주요 행동 위 텍스트", usage: "text-primary-foreground" },
  "--secondary": { role: "보조 행동 색(secondary 버튼·배지)", usage: "bg-secondary" },
  "--secondary-foreground": { role: "보조 행동 위 텍스트", usage: "text-secondary-foreground" },
  "--muted": { role: "강조를 낮춘 영역 배경", usage: "bg-muted" },
  "--muted-foreground": { role: "강조를 낮춘 텍스트(설명문)", usage: "text-muted-foreground" },
  "--accent": { role: "호버·눌림 강조 배경(outline/ghost active)", usage: "active:bg-accent" },
  "--accent-foreground": { role: "강조 배경 위 텍스트", usage: "active:text-accent-foreground" },
  "--destructive": { role: "위험·삭제 행동 색", usage: "bg-destructive" },
  "--destructive-foreground": { role: "위험 행동 위 텍스트", usage: "text-destructive-foreground" },
  "--border": { role: "일반 테두리(card outline 등)", usage: "border-border" },
  "--input": { role: "입력창 테두리", usage: "border-input" },
  "--ring": { role: "키보드 포커스 링", usage: "focus-visible:ring-ring" },
  "--radius": { role: "모서리 반경 기준값(스킴 무관 공통)", usage: "rounded-md (scale 파생)" },
};

/** tokens.ts 키 순서를 그대로 보존한 변수 블록 문자열(서식: 변수 행 4sp) */
function varBlock(selector: ":root" | ".dark", tokens: Record<string, string>): string {
  const lines = Object.entries(tokens).map(([k, v]) => `    ${k}: ${v};`);
  return `  ${selector} {\n${lines.join("\n")}\n  }`;
}

/** globals.css 생성 영역 전체(@layer base 블록 — 마커는 별도) */
export function buildGlobalsBlock(): string {
  return `@layer base {\n${varBlock(":root", lightTokens)}\n\n${varBlock(".dark", darkTokens)}\n}`;
}

/** expo global.css 생성 영역 전체 — uniwind @variant light/dark(값은 웹과 동일 소스) */
export function buildExpoGlobalsBlock(): string {
  const variant = (name: "light" | "dark", tokens: Record<string, string>) => {
    const lines = Object.entries(tokens).map(([k, v]) => `      ${k}: ${v};`);
    return `    @variant ${name} {\n${lines.join("\n")}\n    }`;
  };
  return `@layer theme {\n  :root {\n${variant("light", lightTokens)}\n\n${variant("dark", darkTokens)}\n  }\n}`;
}

/**
 * @theme inline 매핑 블록 — 시맨틱 토큰(--background 등)을 Tailwind 유틸리티
 * (bg-background 등)로 연결한다. 색 토큰 키는 tokens.ts 순서 그대로고
 * --radius는 스케일 파생 3종(lg/md/sm)로 대체된다. 두 앱 전역 CSS에
 * 동일 바이트로 들어가므로 한쪽만 드리프트할 여지가 사라진다.
 */
export function buildThemeMapBlock(): string {
  const colorLines = Object.keys(lightTokens)
    .filter((k) => k !== "--radius")
    .map((k) => `  --color-${k.slice(2)}: hsl(var(${k}));`);
  return [
    "@theme inline {",
    ...colorLines,
    "",
    "  /* --radius(0.5rem) 파생(02-design §2.2). xl은 Tailwind 기본값(0.75rem) 유지. */",
    "  --radius-lg: var(--radius);",
    "  --radius-md: calc(var(--radius) - 2px);",
    "  --radius-sm: calc(var(--radius) - 4px);",
    "}",
  ].join("\n");
}

/** registry.json theme 항목(THEME_ITEMS 항목 1개에서 생성 — 기본·프리셋 공용 형식) */
export function buildThemeItem(def: ThemeItemDef) {
  return {
    name: def.name,
    type: "registry:theme" as const,
    title: def.title,
    description: def.description,
    cssVars: {
      light: { ...def.light },
      dark: { ...def.dark },
    },
  };
}

/** docs/tokens.md 전체 문서 */
export function buildTokensDoc(): string {
  const rows = (Object.keys(lightTokens) as (keyof typeof lightTokens)[])
    .map((k) => {
      const meta = TOKEN_META[k] ?? { role: "(설명 미등록)", usage: "-" };
      return `| \`${k}\` | \`${lightTokens[k]}\` | \`${darkTokens[k]}\` | ${meta.role} | \`${meta.usage}\` |`;
    })
    .join("\n");
  const presetRows = THEME_ITEMS.map((t) => {
    const ratio = contrastRatioHsl(t.light["--primary"]!, t.light["--primary-foreground"]!).toFixed(2);
    return `| \`${t.name}\` (${t.label}) | ${t.neutral} | ${t.primaryStep} | ${ratio}:1 | \`bunx shadcn add <레지스트리>/r/${t.name}.json -y\` |`;
  }).join("\n");
  return `# UniKit UI 디자인 토큰 카탈로그

> ⛔ 이 파일은 \`bun run generate:design\`(packages/unikit)이 생성합니다 — 수동 수정 금지.
> 값의 출처는 [\`src/theme/tokens.ts\`](../src/theme/tokens.ts)(기본)와 [\`src/theme/presets.ts\`](../src/theme/presets.ts)(프리셋 3종)입니다. 값 형식은 CSS \`hsl()\` 함수 인자로 바로 쓰는 HSL 채널 문자열("H S% L%")입니다.

## 토큰 값 표 (20종 = 색 19 + radius)

| 토큰 | 라이트 | 다크 | 역할 | 대표 사용 |
|---|---|---|---|---|
${rows}

## 프리셋 테마 (기본 + 3종)

값 출처는 Tailwind 공식 팔레트 계산 + WCAG 대비 검증(22-design-plan §2.2 규칙). 재적용: 다른 프리셋을 같은 방식으로 add하면 기존 값이 그 자리에서 교체됩니다(같은 프리셋 재add는 값 불변).

| 항목 | 중립 계열 | 라이트 primary | 핵심 대비비¹ | 설치(한 줄) |
|---|---|---|---|---|
${presetRows}

¹ 라이트 primary↔primary-foreground(흰 전경)의 WCAG 대비비 — audit:design가 매 실행 재계산(기준 ≥4.5:1).
프리셋 전체 값(20종×라이트/다크)은 [\`src/theme/presets.ts\`](../src/theme/presets.ts)와 각 \`/r/theme-<이름>.json\`에서 관찰할 수 있습니다.

## 일관성 규칙 (audit:design가 기계 검사)

1. **원색 리터럴 금지** — 컴포넌트 소스에 \`#fff\`, \`rgb(...)\`, \`oklch(...)\` 등 직접 색 값을 쓰지 않는다. 반드시 위 토큰을 참조하는 유틸리티 클래스(\`bg-primary\` 등)를 쓴다.
2. **Tailwind 기본 팔레트 금지** — \`bg-zinc-500\`, \`text-white\` 류는 테마 전환(라이트↔다크)이 되지 않으므로 금지.
3. **임의값 클래스 금지** — \`h-[37px]\`, \`bg-[#fff]\` 류 대신 스케일 클래스(\`h-10\`)와 토큰을 쓴다.
4. **재테마** — 소비자는 아래 한 줄로 토큰을 받고, 값 커스터마이즈는 해당 CSS 변수값만 바꾼다(컴포넌트 수정 불필요). 런타임 스킴 전환은 \`UnikitThemeProvider\`가 담당한다.
   ${"```"}bash
   bunx shadcn add <레지스트리>/r/theme.json
   ${"```"}

## 사본이 생성되는 곳

| 사본 | 생성 위치 | 비고 |
|---|---|---|
| 웹 전역 CSS | \`apps/web/app/globals.css\` :root/.dark 블록 | 표준 Tailwind v4 — 기본 테마만 |
| 네이티브 전역 CSS | \`apps/expo/global.css\` @variant light/dark 블록 | uniwind(Tailwind v4) — 기본 테마만 |
| 토큰→유틸리티 매핑 | 두 앱 전역 CSS \`@theme inline\` 블록 | 토큰 키에서 자동 생성 — 두 플랫폼 동일 바이트 |
| 레지스트리 theme 항목 4종 | \`registry.json\` cssVars light/dark | 기본 + 프리셋 3 — 소비자 \`shadcn add\` 전달 |
| 이 카탈로그 | \`packages/unikit/docs/tokens.md\` | 값 드리프트는 audit (f)가 차단 |
`;
}

/**
 * 마커 사이 영역을 생성물로 치환한다(공용 절차). 마커는 앱 세팅 시 심어둔 것 —
 * 없으면 복구를 시도하지 않고 즉시 중단한다. 내용이 같으면 쓰기를 생략한다.
 * 반환값은 로그용 설명.
 */
function replaceMarkerBlock(
  filePath: string,
  markerBegin: string,
  markerEnd: string,
  generated: string,
  label: string,
): string {
  const src = readFileSync(filePath, "utf8");
  const start = src.indexOf(markerBegin);
  if (start === -1)
    throw new Error(`${label}: BEGIN 마커가 없습니다. 앱 세팅 시 마커 영역이 심어져 있어야 합니다.`);
  const end = src.indexOf(markerEnd);
  if (end === -1) throw new Error(`${label}: END 마커가 없습니다.`);
  const wrapped = `${markerBegin}\n${generated}\n${markerEnd}`;
  const next = src.slice(0, start) + wrapped + src.slice(end + markerEnd.length);
  if (next === src) return `${label} 동일(쓰기 생략)`;
  writeFileSync(filePath, next);
  return `${label} 치환`;
}

/** 웹 globals.css 처리: @theme inline 매핑 + :root/.dark 값 블록(마커 2쌍) */
function updateWebGlobalsCss(): string[] {
  return [
    replaceMarkerBlock(GLOBALS_CSS, MAP_BEGIN, MAP_END, buildThemeMapBlock(), "globals.css @theme inline"),
    replaceMarkerBlock(GLOBALS_CSS, BEGIN, END, buildGlobalsBlock(), "globals.css :root/.dark"),
  ];
}

/** expo global.css 처리: @theme inline 매핑 + @variant light/dark 값 블록(마커 2쌍) */
function updateExpoGlobalCss(): string[] {
  return [
    replaceMarkerBlock(EXPO_GLOBALS_CSS, MAP_BEGIN, MAP_END, buildThemeMapBlock(), "expo global.css @theme inline"),
    replaceMarkerBlock(EXPO_GLOBALS_CSS, BEGIN, END, buildExpoGlobalsBlock(), "expo global.css @variant light/dark"),
  ];
}

/** registry.json 처리: theme 항목 4종 주입(utils 다음 위치 고정), 나머지는 파싱 순서 보존 */
function updateRegistryJson(): string {
  const THEME_NAMES = new Set(THEME_ITEMS.map((t) => t.name));
  type Registry = { items: { name: string }[] };
  const strip = (o: Registry) => ({
    ...o,
    items: o.items.filter((i) => !THEME_NAMES.has(i.name)),
  });
  const raw = readFileSync(REGISTRY_JSON, "utf8");
  const reg = JSON.parse(raw) as Registry;
  const beforeStripped = JSON.stringify(strip(reg));
  // 기존 theme 항목(이름이 THEME_ITEMS와 같은 것 전부)을 빼고, 그 자리(utils 다음)에 4종을 연속 배치
  const hadThemes = reg.items.some((i) => THEME_NAMES.has(i.name));
  const rest = reg.items.filter((i) => !THEME_NAMES.has(i.name));
  reg.items = [...rest.slice(0, 1), ...THEME_ITEMS.map(buildThemeItem), ...rest.slice(1)];
  const injected = !hadThemes;

  const next = JSON.stringify(reg, null, 2) + "\n";
  // 기존 항목 불변 확인(무손실 — 파싱 수준): theme 항목 전부 제외 후 직렬화 동일(F-35 — 제외 목록 = THEME_ITEMS 전체).
  // reg는 next의 직렬화 원본이므로 재파싱 없이 메모리 객체로 대조한다.
  if (JSON.stringify(strip(reg)) !== beforeStripped) {
    throw new Error("registry.json 무손실 검증 실패 — theme 항목 외의 항목이 변경됐습니다.");
  }
  if (next !== raw) writeFileSync(REGISTRY_JSON, next);
  const state = next === raw
    ? "동일(쓰기 생략)"
    : injected
      ? `theme 항목 ${THEME_ITEMS.length}종 주입(utils 다음 연속)`
      : `theme 항목 ${THEME_ITEMS.length}종 치환`;
  return `registry.json ${state}`;
}

function updateTokensDoc(): string {
  mkdirSync(path.dirname(TOKENS_DOC), { recursive: true });
  const doc = buildTokensDoc();
  let prev: string | undefined;
  try {
    prev = readFileSync(TOKENS_DOC, "utf8");
  } catch {
    prev = undefined; // 첫 생성 — 파일 없음
  }
  if (prev !== doc) writeFileSync(TOKENS_DOC, doc);
  return prev === doc ? "docs/tokens.md 동일(쓰기 생략)" : "docs/tokens.md 생성";
}

function main() {
  const results = [
    ...updateWebGlobalsCss(),
    ...updateExpoGlobalCss(),
    updateRegistryJson(),
    updateTokensDoc(),
  ];
  console.log("generate:design 완료:");
  for (const r of results) console.log(`  - ${r}`);
}

// 진입점으로 직접 실행할 때만 파일을 쓴다 — audit:design이 import하면 순수 함수만 쓴다.
// (감사가 재생성 부수효과로 드리프트를 덮어쓰는 일을 막는 가드)
if (import.meta.main) main();
