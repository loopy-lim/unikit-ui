# UniKit 요구 정의 (G0)

- 작성 직군: `Product Manager` (role-perspective, 오케스트레이터 컨텍스트에서 작성)
- 날짜: 2026-11-07
- 상태: G0 독립 감사(`Requirements Auditor`, validate-plan `intake` 모드) 대상
- 작업 유형 편성: ② UI·풀스택 제품 변경(신규 구축)

## 1. 원 사용자 요청 (원문, 해석 없음)

> 처음 개발하는 것이야. HeroUI처럼 한개의 import로 react, react-native에서 두개 같이 보이게 만들고 싶어.
> 형태는 shad/cn 처럼 이루어지게 하면 좋을꺼 같아.

### 해석 (원문 각 구문 → 요구)

| 원문 | 요구로의 해석 |
|---|---|
| "HeroUI처럼 한개의 import로" | 사용자는 컴포넌트마다 플랫폼별 import를 분기하지 않는다. import 문 하나가 react(웹)와 react-native 양쪽 코드베이스에서 그대로 동작한다. |
| "react, react-native에서 두개 같이 보이게" | 동일 컴포넌트 소스가 웹 브라우저와 네이티브 앱에서 같은 디자인(토큰·변형·타이포)으로 렌더링된다. |
| "형태는 shad/cn 처럼" | shadcn/ui 배포 형태를 따른다: 컴포넌트 소스가 사용자 프로젝트로 복사되어 사용자가 코드를 소유·수정하며, `cn`(clsx + tailwind-merge) 유틸과 `class-variance-authority` 변형 패턴, CSS 변수 기반 테마 토큰을 사용한다. |
| "처음 개발하는 것이야" | 표준적이고 학습 자료가 풍부한 스택(Expo, Tailwind/NativeWind, Next.js, 패키지 매니저 — 2026-11-07 사용자 결정으로 bun 확정) 위주로 구성하고, 커스텀 툴링·마법을 최소화하며, 한글 문서를 제공한다. |

## 2. 목표

- **G-1 유니버설 단일 소스**: React Native 프리미티브(`View`/`Text`/`Pressable`/`TextInput`) + NativeWind(`className`)로 작성된 컴포넌트 1벌이, 웹에서는 react-native-web으로 렌더링되어 React(웹)·React Native 양쪽에서 같은 모습으로 동작한다.
- **G-2 shadcn 스타일 배포**: 컴포넌트를 npm 패키지로 배포하는 대신, shadcn CLI 규격 레지스트리(`registry.json`)에서 사용자 프로젝트로 소스를 복사하는 형태로 제공한다.
- **G-3 첫 개발자 온보딩**: 모노레포 구조·빌드·검증 명령·컴포넌트 추가 방법을 한글 README로 문서화해, 원 사용자가 스스로 컴포넌트를 추가·수정할 수 있는 기반을 만든다.

## 3. 범위

### v0.1 포함

1. **모노레포(bun workspaces — 2026-11-07 사용자 결정으로 pnpm에서 전환, 당초 pnpm workspaces로 착수)**
   - `apps/expo`: Expo(SDK 58) 유니버설 데모 앱 — Expo Router + NativeWind, iOS/Android/Web 타깃. 컴포넌트 쇼케이스 화면 + 라이트/다크 토글 포함.
   - `apps/web`: Next.js 데모 앱 — React(웹) 쪽 소비를 증명한다. 동일 컴포넌트를 동일 import로 렌더링하는 쇼케이스 1페이지 이상.
   - `packages/unikit`: 유니버설 컴포넌트 소스 + `cn` 유틸 + 테마 토큰 + `registry.json`(shadcn 규격).
2. **컴포넌트(v0.1 세트)**: `Button`(변형 default/secondary/destructive/outline/ghost/link × 사이즈 sm/default/lg/icon), `Card`(Header/Title/Description/Content/Footer), `Input`, `Label`, `Badge` — 모두 cva 변형 + `className` 병합(`cn`) + TypeScript 타입.
3. **테마**: shadcn 호환 CSS 변수 토큰(라이트/다크) — 웹(`:root`/`.dark`)과 네이티브(`vars()`) 양쪽 전환.
4. **레지스트리**: shadcn CLI(`npx shadcn add`)로 설치 가능한 `registry.json` + 설치·사용 문서.
5. **문서**: 한글 README(빠른 시작, 모노레포 구조, 컴포넌트 추가 가이드), 컴포넌트별 간단 사용법, 사용자 스마트폰 Expo Go 실행 가이드(네이티브 실물 확인용).

### v0.1 제외 (후속 버전)

- npm 레지스트리 배포(`@unikit/*` 퍼블리시), GitHub 공개·CI/CD
- 컴포넌트 수 확장(Dialog, Select, Avatar, Switch 등), 커스텀 CLI 구현(shadcn CLI 재사용)
- Storybook, 비주얼 회귀 테스트, 네이티브 실기기/에뮬레이터 실행 검증
- 웹 전용 원소 DOM 컴포넌트, SSR 최적화 외 추가 최적화

## 4. 수락 조건 (AC-*)

| ID | 관찰 가능한 조건 | 증거 예상 |
|---|---|---|
| AC-1 단일 소스·단일 import | `packages/unikit`의 컴포넌트 파일이 `apps/expo`와 `apps/web`(Next.js)에서 **수정·플랫폼 분기 없이 동일 import 경로**로 사용되어 양쪽 모두 렌더링된다. | 두 앱의 import 구문, 양쪽 프로덕션 빌드 성공 로그, Expo web·Next.js 렌더 스크린샷 |
| AC-2 같은 모습 | 쇼케이스 화면에서 동일 컴포넌트가 Expo web과 Next.js에서 동일 토큰·디자인으로 보인다. 버튼 변형 6종·사이즈 4종이 모두 의도한 스타일로 렌더링된다. **비교 대상은 두 웹(react-native-web) 렌더링 간임** — 네이티브 실물 외형 검증은 잔여 한계(AC-3·5절 참조). | 브라우저 스크린샷 비교(컴포넌트별) |
| AC-3 네이티브 번들 | 네이티브 측 정적 증거로 `expo export --platform android`(Metro 번들)가 오류 없이 완료된다. (에뮬레이터 부재로 실물 화면 확인은 잔여 한계로 명시) | 번들 명령 종료 코드·출력 |
| AC-4 정적 품질 | 모든 워크스페이스에서 TypeScript(`tsc --noEmit`) 오류 0건. | 타입체크 명령 출력 |
| AC-5 컴포넌트 API | Button/Card/Input/Label/Badge가 cva 변형과 `cn` 병합, 완전한 TypeScript props 타입을 갖고 `packages/unikit`에서 내보내진다. | 소스 파일, 타입 사용 예시, tsc 통과 |
| AC-6 테마 전환 | 라이트/다크 토글이 쇼케이스 앱에서 동작해 색 토큰이 전환된다(웹에서 실제 확인. 네이티브 테마 전환 실물 확인은 잔여 한계). | 토글 전·후 스크린샷 |
| AC-7 shadcn 배포 형태 | `packages/unikit/registry.json`이 shadcn CLI 규격에 맞고, 문서화된 설치 절차로 신규 프로젝트에 컴포넌트가 복사되어 사용 가능함을 로컬에서 재현한다. | registry.json 스키마 검증, 설치 재현 로그 |
| AC-8 문서 | 한글 README가 존재하고 빠른 시작(설치→실행→컴포넌트 추가) 절차가 실제 명령과 일치한다. | 문서 내 명령 실행 검증 |

## 5. 제약·가정·환경 사실

### 환경 (실행 준비에서 확인, 2026-11-07)

- 디렉터리 `/home/loopy/dev/ll3/UniKit` 존재, **빈 디렉터리**(보존할 기존 변경 없음). git 저장소 아님 → `git init`은 구현 단계에서 실시(커밋은 사용자 요청 시에만).
- 도구: node v26.13.0, pnpm 12.15.0, npm 11.20.0, git 2.56.0, bun 1.4.4. Linux(x86, Arch계). **패키지 매니저: bun 1.4.4(2026-11-07 사용자 결정 — pnpm에서 전환)**.
- 레지스트리 최신 버전: expo 58.0.23 / react-native 0.88.1 / expo-router 58.0.30 / nativewind 4.2.7(peer `tailwindcss >3.3.0`, TW4 호환) / tailwindcss 4.3.5 / shadcn CLI 4.23.0 / next 16.4.5 / react-native-web 0.21.4 / react-dom 19.3.1. 정확한 버전 고정·설정 방법은 조사 단계에서 문서 대조로 확정한다.
- 네이티브 에뮬레이터/실기기 없음(**확인** — G0 감사 실측: `adb`·`emulator` 미설치, `ANDROID_HOME`·SDK 디렉터리 부재, Linux에서 iOS 시뮬레이터 원천 불가) → AC-3처럼 번들 빌드로 갈음한다. **잔여 한계(전 항목 공통): 네이티브 외형·네이티브 테마 전환의 실물 화면 확인 불가.** 이 한계는 G5까지 열어둔 채 인계되며, 사용자는 README의 Expo Go 자체 실행 가이드로 직접 닫을 수 있다. 브라우저 실행·스크린샷은 가능(호스트 미리보기 도구).

### 제약

- 첫 개발자 프로젝트: 표준 스택·표준 설정 위주, 비표준 커스텀 툴링 최소화.
- 커밋·푸시·npm 배포·GitHub 게시는 사용자 요청 전까지 금지.
- TDD 강제 없음. 빌드·렌더·타입체크 등 실제 실행 증거를 우선.

### 가정 (조사 단계에서 검증)

- Expo SDK 58 + 모노레포(패키지 매니저: bun — 2026-11-07 전환) + Metro 구성이 공식 지원 경로로 동작한다(설정 파일 필요 여부 확인).
- NativeWind 4.2 + Tailwind v4 조합의 공식 설정 방식(CSS `@import "tailwindcss"` 기반)을 따를 수 있다.
- Next.js(React 측)에서 react-native-web + NativeWind를 함께 사용하는 공식 지원 설정(`withNativeWind` 등)이 존재한다.
- shadcn CLI 4.x가 사용자 정의 레지스트리(로컬/원격 `registry.json`)를 지원한다.

## 6. 차단 질문 (사용자 결정 필요)

- **없음.** 구현 방향을 바꾸는 미해결 결정은 남기지 않는다. 컴포넌트 세트(v0.1 5종), 스택(Expo+NativeWind+react-native-web+Next.js 데모), 배포 형태(shadcn 레지스트리 소스 복사)는 원문 해석과 표준 권장안에 따라 본 문서에서 확정했다. 사용자가 원하면 v0.1 완료 후 범위 조정 가능하다.

## 7. 직군 편성 계획 (SDD 편성 ②)

- 수행 측: `System Architect` + `Product/UX Designer`(G1) → `Frontend/UI Engineer` + `Platform/Tooling Engineer`(G2, 파일 소유권 분리) 
- 독립 평가 측: `Requirements Auditor`(G0) → `Architecture & Plan Reviewer` + `UX/Design Auditor`(G1) → `Task QA Validator`(G2) → `Staff Code Reviewer`(G3) → `UX/Design Auditor`(G4) → `Release Gatekeeper`(G5)
- 위임 가용성: 네이티브 하위 에이전트 스폰 가능(독립 컨텍스트). 관문 평가는 모두 독립 스폰으로 진행.
