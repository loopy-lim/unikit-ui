/*
 * web-editor 빌드 산출물(dist/index.html)을 앱 번들에 인라인하는 TS 모듈로 복사한다.
 * bun run build:editor가 build 후 이 스크립트를 실행한다.
 */
import { readFileSync, writeFileSync } from "node:fs";

const html = readFileSync(new URL("../web-editor/dist/index.html", import.meta.url), "utf8");
const out = `/*
 * apps/mobile/web-editor 빌드 산출물 인라인 — bun run build:editor로 재생성(직접 편집 금지).
 */
export default ${JSON.stringify(html)};
`;
writeFileSync(new URL("../lib/editor-html.ts", import.meta.url), out);
console.log(`lib/editor-html.ts 동기화 완료 (${(html.length / 1024).toFixed(1)} KiB)`);
