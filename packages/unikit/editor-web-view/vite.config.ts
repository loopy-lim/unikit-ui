import { defineConfig } from "vite";
import { viteSingleFile } from "vite-plugin-singlefile";

// WebView 삽입용 단일 HTML 산출 — JS/CSS를 전부 인라인한다.
export default defineConfig({
  plugins: [viteSingleFile()],
});
