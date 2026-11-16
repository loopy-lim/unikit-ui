// 웹 editor 렌더러가 본문 타이포그래피를 위해 import하는 CSS — 번들러(vite·webpack)
// 가 처리하고 tsc는 이 선언로 통과시킨다. 네이티브(metro)는 web.tsx 자체를 로드하지 않는다.
declare module "*.css";
