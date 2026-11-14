// uniwind는 Babel 프리셋이 필요 없다(apps/expo와 동일 — 엔진 교체 이력).
module.exports = function (api) {
  api.cache(true);
  return {
    presets: ["babel-preset-expo"],
  };
};
