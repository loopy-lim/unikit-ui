// uniwind Metro 설정(apps/expo와 동일 구성).
// cssEntryFile은 프로젝트 루트 기준 상대 경로 문자열이어야 한다(공식 문서 지시).
const { getDefaultConfig } = require("expo/metro-config");
const { withUniwindConfig } = require("uniwind/metro");

const config = getDefaultConfig(__dirname);

module.exports = withUniwindConfig(config, {
  cssEntryFile: "./global.css",
  dtsFile: "./uniwind-types.d.ts",
});
