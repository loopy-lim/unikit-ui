/// <reference types="uniwind/types" />

// 사이드이펙트 CSS import(`import "../global.css"`)의 모듈 선언 —
// expo-env.d.ts(로컬에서 expo CLI가 생성, gitignore) 없는 CI·초기 체크아웃용
declare module "*.css";
