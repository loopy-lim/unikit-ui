/*
 * editor-web-view 빌드 산출물(dist/index.html)을 네이티브 렌더러가 import하는
 * TS 모듈(src/editor/editor-html.ts)로 인라인한다.
 * bun run build:editor가 build 후 이 스크립트를 실행한다.
 */
import { readFileSync, writeFileSync } from "node:fs";

const html = readFileSync(new URL("../editor-web-view/dist/index.html", import.meta.url), "utf8");
const out = `/*
 * editor-web-view 빌드 산출물 인라인 — bun run build:editor로 재생성(직접 편집 금지).
 * 원본: packages/unikit/editor-web-view(vite 단일 HTML — tiptap가 안에 있다).
 */
export default ${JSON.stringify(html)};
`;
writeFileSync(new URL("../src/editor/editor-html.ts", import.meta.url), out);
console.log(`src/editor/editor-html.ts 동기화 완료 (${(html.length / 1024).toFixed(1)} KiB)`);
