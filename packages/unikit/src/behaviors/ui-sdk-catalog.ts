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

  sdk: string;

  factory: string;

  unikit: string | null;

  families: SdkFamily[];

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

export const SDK_OVERLAP = SDK_CATALOG.filter((e) => e.unikit !== null);

export const SDK_SCREEN_VERIFIED = SDK_CATALOG.filter((e) => e.rn === "screen");
