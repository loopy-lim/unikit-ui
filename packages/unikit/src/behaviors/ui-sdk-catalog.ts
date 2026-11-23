// @ui-sdk/core 카탈로그 — «다 go» 로드맵 M3 산출물(이슈 #42).
// 53종 프리미티브의 단일 출처: RN 구동 근거·UniKit 62종과의 동일 기능
// 대응(이중 유지)·커널 패밀리 의존. 검증은 probe:ui-sdk (14)가 맡아요 —
//
//   - 팩토리가 @ui-sdk/core/<sdk> export에 여전히 존재(버전 고정 0.1.0-beta.6
//     승급 시 이 카탈로그와 프로브가 계약)
//   - families가 dist 소스의 «이행적 foundation 의존» 재스캔과 정확히 일치
//     (빈 스캔 = ["press"] — 벽 없음 상태기계)
//   - unikit 대응은 packages/unikit/src/components/<이름>.tsx + 배럴 재수출 존재
//
// 패밀리 7종 — press(벽 없음 상태기계)·popup(createPopup)·form(ElementInternals
// 등가)·roving(가상 포커스)·gesture(문서 포인터 드래그)·modality(레이어·창
// 리스너)·motion(등장/퇴장 — RN은 즉시 전환, 수명 계약은 modality에서 검증).
// rn 근거 — screen: 에뮬레이터 기기 화면 실증(apps/expo/app/uisdk-*.tsx)·
// family: 커널 패밀리 전부가 프로브로 검증됨(개별 화면은 미구성).
export type SdkFamily =
  | "press"
  | "popup"
  | "form"
  | "roving"
  | "gesture"
  | "modality"
  | "motion";

export type SdkRnStatus = "screen" | "family";

export type SdkCatalogEntry = {
  /** @ui-sdk/core 서브경로 export 이름(kebab) */
  sdk: string;
  /** 팩토리 함수 export 식별자 */
  factory: string;
  /** UniKit 62종 중 동일 기능 컴포넌트(이중 유지 대상), 없으면 null */
  unikit: string | null;
  /** 이행적 커널 패밀리 의존 — 프로브 (14) 재스캔과 일치 검증 */
  families: SdkFamily[];
  /** RN 구동 근거 — screen(기기 화면) / family(패밀리 커널 검증) */
  rn: SdkRnStatus;
  note?: string;
};

export const SDK_CATALOG: readonly SdkCatalogEntry[] = [
  {
    sdk: "accordion",
    factory: "accordion",
    unikit: "accordion",
    families: ["form", "modality", "motion"],
    rn: "family",
  },
  {
    sdk: "alert-dialog",
    factory: "alertDialog",
    unikit: "alert-dialog",
    families: ["modality", "motion", "popup", "roving"],
    rn: "family", note: "dialog 모듈 내 별도 export",
  },
  {
    sdk: "autocomplete",
    factory: "autocomplete",
    unikit: null,
    families: ["form", "modality", "motion", "popup", "roving"],
    rn: "family",
  },
  {
    sdk: "avatar",
    factory: "avatar",
    unikit: "avatar",
    families: ["press"],
    rn: "family", note: "벽 없음 — 상태기계만",
  },
  {
    sdk: "button",
    factory: "button",
    unikit: "button",
    families: ["form", "modality"],
    rn: "screen",
  },
  {
    sdk: "calendar",
    factory: "calendar",
    unikit: "calendar",
    families: ["form", "modality", "roving"],
    rn: "family",
  },
  {
    sdk: "carousel",
    factory: "carousel",
    unikit: "carousel",
    families: ["gesture", "modality", "motion", "roving"],
    rn: "family",
  },
  {
    sdk: "checkbox",
    factory: "checkbox",
    unikit: "checkbox",
    families: ["form", "modality", "motion", "roving"],
    rn: "screen",
  },
  {
    sdk: "collapsible",
    factory: "collapsible",
    unikit: "collapsible",
    families: ["form", "modality", "motion"],
    rn: "family",
  },
  {
    sdk: "color-picker",
    factory: "colorPicker",
    unikit: null,
    families: ["form", "gesture", "modality", "roving"],
    rn: "family",
  },
  {
    sdk: "combobox",
    factory: "combobox",
    unikit: "combobox",
    families: ["form", "modality", "motion", "popup", "roving"],
    rn: "family",
  },
  {
    sdk: "command",
    factory: "command",
    unikit: "command",
    families: ["form", "modality", "motion", "popup", "roving"],
    rn: "family",
  },
  {
    sdk: "date-input",
    factory: "dateInput",
    unikit: null,
    families: ["form", "modality"],
    rn: "family",
  },
  {
    sdk: "date-picker",
    factory: "datePicker",
    unikit: null,
    families: ["form", "modality", "motion", "popup", "roving"],
    rn: "family",
  },
  {
    sdk: "dialog",
    factory: "dialog",
    unikit: "dialog",
    families: ["modality", "motion", "popup", "roving"],
    rn: "screen",
  },
  {
    sdk: "drawer",
    factory: "drawer",
    unikit: "drawer",
    families: ["gesture", "modality", "motion", "popup", "roving"],
    rn: "family",
  },
  {
    sdk: "field",
    factory: "field",
    unikit: "field",
    families: ["form"],
    rn: "screen",
  },
  {
    sdk: "file-input",
    factory: "fileInput",
    unikit: null,
    families: ["form", "modality", "roving"],
    rn: "family",
  },
  {
    sdk: "hover-card",
    factory: "hoverCard",
    unikit: "hover-card",
    families: ["modality", "motion", "popup", "roving"],
    rn: "family",
  },
  {
    sdk: "image-cropper",
    factory: "imageCropper",
    unikit: null,
    families: ["gesture", "modality"],
    rn: "family",
  },
  {
    sdk: "input",
    factory: "input",
    unikit: "input",
    families: ["form", "modality"],
    rn: "screen",
  },
  {
    sdk: "label",
    factory: "label",
    unikit: "label",
    families: ["form"],
    rn: "family",
  },
  {
    sdk: "listbox",
    factory: "listbox",
    unikit: null,
    families: ["form", "modality", "motion", "roving"],
    rn: "family",
  },
  {
    sdk: "menu",
    factory: "menu",
    unikit: "dropdown-menu",
    families: ["gesture", "modality", "motion", "popup", "roving"],
    rn: "family", note: "이름 상이 — UniKit dropdown-menu",
  },
  {
    sdk: "menubar",
    factory: "menubar",
    unikit: "menubar",
    families: ["popup", "roving"],
    rn: "family",
  },
  {
    sdk: "meter",
    factory: "meter",
    unikit: null,
    families: ["press"],
    rn: "family", note: "gauge 헬퍼 — 벽 없음",
  },
  {
    sdk: "navigation-menu",
    factory: "navigationMenu",
    unikit: "navigation-menu",
    families: ["modality", "motion", "popup", "roving"],
    rn: "family",
  },
  {
    sdk: "number-input",
    factory: "numberInput",
    unikit: null,
    families: ["form", "gesture", "modality", "roving"],
    rn: "family",
  },
  {
    sdk: "otp-input",
    factory: "otpInput",
    unikit: "input-otp",
    families: ["form", "modality"],
    rn: "family", note: "이름 상이 — UniKit input-otp",
  },
  {
    sdk: "pagination",
    factory: "pagination",
    unikit: "pagination",
    families: ["modality"],
    rn: "family",
  },
  {
    sdk: "password-input",
    factory: "passwordInput",
    unikit: null,
    families: ["form", "modality"],
    rn: "family",
  },
  {
    sdk: "popover",
    factory: "popover",
    unikit: "popover",
    families: ["modality", "motion", "popup", "roving"],
    rn: "screen",
  },
  {
    sdk: "progress",
    factory: "progress",
    unikit: "progress",
    families: ["press"],
    rn: "family", note: "gauge 헬퍼 — 벽 없음",
  },
  {
    sdk: "radio",
    factory: "radioGroup",
    unikit: "radio-group",
    families: ["form", "modality", "motion", "roving"],
    rn: "screen", note: "이름 상이 — UniKit radio-group",
  },
  {
    sdk: "rating",
    factory: "rating",
    unikit: null,
    families: ["form", "modality", "roving"],
    rn: "family",
  },
  {
    sdk: "resizable",
    factory: "resizable",
    unikit: "resizable",
    families: ["form", "gesture", "modality", "roving"],
    rn: "family",
  },
  {
    sdk: "scroll-area",
    factory: "scrollArea",
    unikit: "scroll-area",
    families: ["gesture", "roving"],
    rn: "family",
  },
  {
    sdk: "segmented-control",
    factory: "segmentedControl",
    unikit: null,
    families: ["form", "modality", "roving"],
    rn: "screen",
  },
  {
    sdk: "select",
    factory: "select",
    unikit: "select",
    families: ["form", "modality", "motion", "popup", "roving"],
    rn: "family",
  },
  {
    sdk: "separator",
    factory: "separator",
    unikit: "separator",
    families: ["press"],
    rn: "family", note: "순수 표현 — 벽 없음",
  },
  {
    sdk: "slider",
    factory: "slider",
    unikit: "slider",
    families: ["form", "gesture", "modality", "roving"],
    rn: "screen",
  },
  {
    sdk: "switch",
    factory: "switchPrimitive",
    unikit: "switch",
    families: ["form", "modality"],
    rn: "screen",
  },
  {
    sdk: "tabs",
    factory: "tabs",
    unikit: "tabs",
    families: ["modality", "motion", "roving"],
    rn: "screen",
  },
  {
    sdk: "time-input",
    factory: "timeInput",
    unikit: null,
    families: ["form", "modality"],
    rn: "family", note: "date-input 모듈 내 별도 export",
  },
  {
    sdk: "timeline",
    factory: "timeline",
    unikit: null,
    families: ["roving"],
    rn: "family",
  },
  {
    sdk: "toast",
    factory: "toast",
    unikit: "sonner",
    families: ["gesture", "modality", "motion", "popup", "roving"],
    rn: "family", note: "UniKit은 sonner 포팅 — 토스트 동일 기능",
  },
  {
    sdk: "toggle",
    factory: "toggle",
    unikit: "toggle",
    families: ["form", "modality", "roving"],
    rn: "screen",
  },
  {
    sdk: "token-input",
    factory: "tokenInput",
    unikit: null,
    families: ["form", "modality", "motion", "roving"],
    rn: "family",
  },
  {
    sdk: "toolbar",
    factory: "toolbar",
    unikit: null,
    families: ["form", "roving"],
    rn: "family",
  },
  {
    sdk: "tooltip",
    factory: "tooltip",
    unikit: "tooltip",
    families: ["modality", "motion", "popup", "roving"],
    rn: "family",
  },
  {
    sdk: "tree",
    factory: "tree",
    unikit: null,
    families: ["form", "modality", "motion", "roving"],
    rn: "family",
  },
  {
    sdk: "trigger-menu",
    factory: "triggerMenu",
    unikit: "context-menu",
    families: ["form", "modality", "motion", "popup", "roving"],
    rn: "family", note: "이름 상이 — UniKit context-menu",
  },
  {
    sdk: "waterfall",
    factory: "waterfall",
    unikit: null,
    families: ["modality", "roving"],
    rn: "family",
  },];

export const SDK_CATALOG_COUNT = SDK_CATALOG.length;

/** UniKit과 동일 기능인 이중 유지 대상 목록(에픽 #35 M3 — 이중 유지 검증). */
export const SDK_OVERLAP = SDK_CATALOG.filter((e) => e.unikit !== null);

/** 기기 화면까지 실증된 프리미티브 */
export const SDK_SCREEN_VERIFIED = SDK_CATALOG.filter((e) => e.rn === "screen");
