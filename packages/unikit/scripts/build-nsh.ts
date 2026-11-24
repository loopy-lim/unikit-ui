/**
 * build:nsh — `@unikit-bridge/ui/nsh` 사전 번들(dist/nsh.mjs)과 타입
 * (dist/nsh-types/*.d.ts)을 굽는다.
 *
 * 왜 사전 번들인가(실측 근거 — docs/sdd nsh 사이클):
 * - nsh 번들러는 package.json exports에서 `default` 조건만 본다 → 브리지의
 *   조건분기(react-native/default)를 탈 수 없다. 전용 `./nsh` 진입점을
 *   조건 없는 단일 ESM으로 제공한다.
 * - nsh JSX 컴파일러는 앱 소스의 소문자 태그를 거부한다 → 컴포넌트(브리지
 *   호스트 태그 view/text/... 를 JSX로 쓰는 src/bridge/nsh.tsx 포함)는
 *   createElement로 컴파일된 번들이어야 한다.
 * - react·react-reconciler·cva·clsx·tailwind-merge를 인라인해 QuickJS에서
 *   단일 파일로 돈다. "nsh"·"nsh:rt"는 런타임 모듈이라 external로 남긴다.
 *
 * 왜 타입도 사전 빌드인가(실측):
 * - 소비 앱의 tsc는 .tsx 소스를 앱의 JSX 설정(jsxImportSource nsh)으로 읽어
 *   JSX.Element가 nsh Element가 되고 React.createElement 계약과 어긋난다.
 *   tsc declaration emit으로 JSX가 없는 .d.ts를 만들어 내린다.
 * - 런타임 "nsh" 임포트는 값 위치라 소비 앱에서 앱 자체의 "nsh" 타입(.nsh/types
 *   경로 매핑)으로 해석된다 — 우리가 ambient "nsh" 선언을 끼워 넣으면 앱 타입을
 *   가린다(실측 — mount 미발견 오류). ambient "nsh"은 저장소 전용 nsh-env.d.ts에만.
 *
 * 치환: 컴포넌트의 `@unikit-bridge/ui/primitives` import는 번들 시
 * src/bridge/nsh.tsx로 리졸브된다.
 */
import { rename, rm, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { Glob } from "bun";

const here = dirname(fileURLToPath(import.meta.url));
const pkgRoot = join(here, "..");
const dist = join(pkgRoot, "dist");
const typesOut = join(dist, "nsh-types");

/** nsh 진입점이 참조하는 패키지 내부 모듈 — 자기참조 specifier → 소스 경로. */
const SELF_REFERENCES: Record<string, string> = {
  "@unikit-bridge/ui/primitives": "./src/bridge/nsh.tsx",
};

async function buildBundle() {
  const result = await Bun.build({
    entrypoints: [join(pkgRoot, "src/nsh/index.ts")],
    outdir: dist,
    naming: { entry: "nsh.[ext]" },
    format: "esm",
    target: "browser",
    external: ["nsh", "nsh:rt"],
    sourcemap: "none",
    minify: false,
    plugins: [
      {
        name: "unikit-self-reference",
        setup(build) {
          build.onResolve({ filter: /^@unikit-bridge\/ui\// }, (args) => {
            const mapped = SELF_REFERENCES[args.path];
            if (mapped) return { path: join(pkgRoot, mapped) };
            // 그 외 자기참조(배럴 등)는 소스 루트 기준으로 해석 시도
            const sub = args.path.replace("@unikit-bridge/ui/", "");
            return [
              join(pkgRoot, "src", `${sub}.ts`),
              join(pkgRoot, "src", `${sub}.tsx`),
              join(pkgRoot, "src", sub, "index.ts"),
              join(pkgRoot, "src", sub, "index.tsx"),
            ];
          });
        },
      },
    ],
  });

  if (!result.success) {
    for (const log of result.logs) console.error(log);
    throw new Error("nsh bundle build failed");
  }
  return result.outputs[0];
}

/** 타입 선언 빌드 — tsc --emitDeclarationOnly(tsconfig.nsh-types.json: jsx
 *  react-jsx 고정 + primitives → nsh 브리지 paths). JSX가 없고 웹/네이티브
 *  브리지 소스를 참조하지 않는 .d.ts 트리를 내린다. */
async function buildTypes() {
  await rm(typesOut, { recursive: true, force: true });
  const proc = Bun.spawn(
    [
      "bun",
      "x",
      "tsc",
      "--project",
      join(pkgRoot, "tsconfig.nsh-types.json"),
    ],
    { stdout: "pipe", stderr: "pipe" },
  );
  const [stdout, stderr, code] = await Promise.all([
    new Response(proc.stdout).text(),
    new Response(proc.stderr).text(),
    proc.exited,
  ]);
  if (code !== 0) {
    console.error(stdout, stderr);
    throw new Error("nsh types build failed");
  }
  // 방출물 후처리 — 선언 emit은 import 지정자를 쓰지 않고 보존한다:
  // "@unikit-bridge/ui/primitives"을 방출된 nsh 브리지 선언(bridge/nsh.d.ts)의
  // 상대 경로로 재작성한다(소비 앱이 web.tsx 소스를 타입 검사에 끌어들이지
  // 않게 — DOM lib·JSX 설정 충돌, 실측). 도달 불가능한 web·native 브리지
  // 선언은 제거한다(nsh 트리가 참조하지 않는다).
  const dropDecls = ["bridge/web.d.ts", "bridge/native.d.ts"];
  for (const rel of dropDecls) {
    await rm(join(typesOut, rel), { force: true });
  }
  const rewritten: string[] = [];
  const files = new Glob("**/*.d.ts").scanSync({ cwd: typesOut });
  for (const file of files) {
    const path = join(typesOut, file);
    const source = await Bun.file(path).text();
    if (!source.includes("@unikit-bridge/ui/primitives")) continue;
    const depth = file.split("/").length - 1;
    const relPath = `${"../".repeat(depth)}bridge/nsh`;
    const next = source.replaceAll(
      /(["'])@unikit-bridge\/ui\/primitives\1/g,
      `"${relPath}"`,
    );
    await Bun.write(path, next);
    rewritten.push(file);
  }
  console.log(`rewrote primitives specifier in ${rewritten.length} declaration files`);
  // 타입 진입 래퍼 — 방출물이 triple-slash 참조를 유지하지 않아 "nsh:rt"
  // ambient 선언(src/nsh/nsh-rt.d.ts)을 프로그램으로 끌어온다(앱에는 nsh:rt
  // 타입이 없다 — 실측 TS2307). 브리지 프리미티브 면(View·Text·TextInput 등)은
  // src/nsh/index.ts의 명시적 재수출과 같은 목록을 유지한다(아이콘·타입은 배럴과
  // 겹쳐 index.d.ts 쪽이 우선한다).
  await writeFile(
    join(typesOut, "nsh", "entry.d.ts"),
    [
      '/// <reference path="../../../src/nsh/nsh-rt.d.ts" />',
      'export * from "../index";',
      'export { View, Text, Pressable, TextInput, Image, Portal, ScrollView, SectionList, Select, SelectOption, KeyboardAvoidingView, Platform, Dimensions, Share, measureInWindow, useDrag, useDismiss, useOverlayFocus, useReposition, useScrollLock, getViewport, LoopRotate, LoopPulse, animateLayout } from "../bridge/nsh";',
      'export { el, mountNsh, renderNsh, useState, useEffect, useMemo, useCallback, useRef, createContext, useContext, useId, useLayoutEffect, memo, forwardRef, isValidElement, Children } from "./renderer";',
      'export type { NshNode } from "nsh:rt";',
      '',
    ].join("\n"),
    "utf8",
  );
}

const bundle = await buildBundle();
await buildTypes();
// Bun이 esm 출력을 .js로 명명한다 — ESM임을 확실히 하는 .mjs로 정규화한다.
const builtPath = bundle.path;
const finalPath = builtPath.replace(/\.js$/, ".mjs");
if (finalPath !== builtPath) {
  await rm(finalPath, { force: true });
  await rename(builtPath, finalPath);
}
await writeFile(
  join(dist, ".gitignore"),
  "*\n!.gitignore\n",
  "utf8",
);
console.log(`built ${finalPath}`);
