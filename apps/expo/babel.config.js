// uniwind는 Babel 프리셋이 필요 없다(엔진 교체: nativewind/babel·jsxImportSource 제거).
module.exports = function (api) {
  api.cache(true);
  return {
    presets: ["babel-preset-expo"],
  };
};
