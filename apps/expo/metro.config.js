// uniwind Metro 설정(엔진 교체: NativeWind → uniwind).
// cssEntryFile은 프로젝트 루트 기준 상대 경로 문자열이어야 한다(공식 문서 지시).
// dtsFile은 metro 실행 시 자동 생성되는 className 타이핑(수동 커밋 대상).
const { getDefaultConfig } = require("expo/metro-config");
const { withUniwindConfig } = require("uniwind/metro");

const config = getDefaultConfig(__dirname);

module.exports = withUniwindConfig(config, {
  cssEntryFile: "./global.css",
  dtsFile: "./uniwind-types.d.ts",
});
