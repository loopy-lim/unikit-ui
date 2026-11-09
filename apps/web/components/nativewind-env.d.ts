/// <reference types="nativewind/types" />
// apps/web용 NativeWind 타입 보강(T-8) — RN 프리미티브(View/Text/Pressable/TextInput)의
// props에 className을 추가하는 ambient 선언을 프로그램에 포함한다.
// Expo 앱은 apps/expo/nativewind-env.d.ts(T-3), @unikit/core은 tsconfig "types"(T-2/T-6)로
// 동일한 보강을 받는다. 웹 앱은 이 참조가 없으면 apps/web 컨텍스트의 tsc에서
// packages/unikit/src 전체에 className 오류가 난다(실측).
