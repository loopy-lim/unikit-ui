import type { ShowcaseDemo } from "./types";
export type { ShowcaseDemo } from "./types";

type DemoLoader = () => Promise<ShowcaseDemo>;

const DEMO_LOADERS: Record<string, DemoLoader> = {
  accordion: () => import("./disclosure-demos").then((m) => m.accordionDemo),
  alert: () => import("./core-demos").then((m) => m.alertDemo),
  "alert-dialog": () => import("./overlay-demos").then((m) => m.alertDialogDemo),
  "aspect-ratio": () => import("./core-demos").then((m) => m.aspectRatioDemo),
  attachment: () => import("./message-demos").then((m) => m.attachmentDemo),
  avatar: () => import("./core-demos").then((m) => m.avatarDemo),
  badge: () => import("./core-demos").then((m) => m.badgeDemo),
  breadcrumb: () => import("./core-demos").then((m) => m.breadcrumbDemo),
  bubble: () => import("./message-demos").then((m) => m.bubbleDemo),
  button: () => import("./core-demos").then((m) => m.buttonDemo),
  "button-group": () => import("./core-demos").then((m) => m.buttonGroupDemo),
  calendar: () => import("./form-extended-demos").then((m) => m.calendarDemo),
  card: () => import("./core-demos").then((m) => m.cardDemo),
  carousel: () => import("./layout-demos").then((m) => m.carouselDemo),
  chart: () => import("./chart-demos").then((m) => m.chartDemo),
  checkbox: () => import("./form-controls-demos").then((m) => m.checkboxDemo),
  collapsible: () => import("./disclosure-demos").then((m) => m.collapsibleDemo),
  combobox: () => import("./command-demos").then((m) => m.comboboxDemo),
  command: () => import("./command-demos").then((m) => m.commandDemo),
  "context-menu": () => import("./overlay-demos").then((m) => m.contextMenuDemo),
  dialog: () => import("./overlay-demos").then((m) => m.dialogDemo),
  direction: () => import("./direction-demos").then((m) => m.directionDemo),
  drawer: () => import("./overlay-demos").then((m) => m.drawerDemo),
  "dropdown-menu": () => import("./overlay-demos").then((m) => m.dropdownMenuDemo),
  "editor-toolbar": () => import("./form-controls-demos").then((m) => m.editorToolbarDemo),
  empty: () => import("./core-demos").then((m) => m.emptyDemo),
  field: () => import("./core-demos").then((m) => m.fieldDemo),
  form: () => import("./form-extended-demos").then((m) => m.formDemo),
  "hover-card": () => import("./overlay-demos").then((m) => m.hoverCardDemo),
  input: () => import("./core-demos").then((m) => m.inputDemo),
  "input-group": () => import("./form-extended-demos").then((m) => m.inputGroupDemo),
  "input-otp": () => import("./form-extended-demos").then((m) => m.inputOtpDemo),
  item: () => import("./core-demos").then((m) => m.itemDemo),
  kbd: () => import("./core-demos").then((m) => m.kbdDemo),
  label: () => import("./core-demos").then((m) => m.labelDemo),
  marker: () => import("./message-demos").then((m) => m.markerDemo),
  menubar: () => import("./command-demos").then((m) => m.menubarDemo),
  message: () => import("./message-demos").then((m) => m.messageDemo),
  "message-scroller": () => import("./message-demos").then((m) => m.messageScrollerDemo),
  "native-select": () => import("./command-demos").then((m) => m.nativeSelectDemo),
  "navigation-menu": () => import("./command-demos").then((m) => m.navigationMenuDemo),
  pagination: () => import("./core-demos").then((m) => m.paginationDemo),
  popover: () => import("./overlay-demos").then((m) => m.popoverDemo),
  progress: () => import("./core-demos").then((m) => m.progressDemo),
  "radio-group": () => import("./form-controls-demos").then((m) => m.radioGroupDemo),
  resizable: () => import("./layout-demos").then((m) => m.resizableDemo),
  "scroll-area": () => import("./layout-demos").then((m) => m.scrollAreaDemo),
  select: () => import("./command-demos").then((m) => m.selectDemo),
  separator: () => import("./core-demos").then((m) => m.separatorDemo),
  sheet: () => import("./overlay-demos").then((m) => m.sheetDemo),
  sidebar: () => import("./layout-demos").then((m) => m.sidebarDemo),
  skeleton: () => import("./core-demos").then((m) => m.skeletonDemo),
  slider: () => import("./form-extended-demos").then((m) => m.sliderDemo),
  sonner: () => import("./layout-demos").then((m) => m.sonnerDemo),
  spinner: () => import("./layout-demos").then((m) => m.spinnerDemo),
  switch: () => import("./form-controls-demos").then((m) => m.switchDemo),
  table: () => import("./core-demos").then((m) => m.tableDemo),
  tabs: () => import("./disclosure-demos").then((m) => m.tabsDemo),
  textarea: () => import("./form-controls-demos").then((m) => m.textareaDemo),
  toggle: () => import("./form-controls-demos").then((m) => m.toggleDemo),
  "toggle-group": () => import("./form-controls-demos").then((m) => m.toggleGroupDemo),
  tooltip: () => import("./overlay-demos").then((m) => m.tooltipDemo),
};

const resolvedCache = new Map<string, ShowcaseDemo>();
const inflightCache = new Map<string, Promise<ShowcaseDemo | undefined>>();

export function getCachedDemo(name: string): ShowcaseDemo | undefined {
  return resolvedCache.get(name);
}

export function loadDemo(name: string): Promise<ShowcaseDemo | undefined> {
  const cached = resolvedCache.get(name);
  if (cached) return Promise.resolve(cached);

  const inflight = inflightCache.get(name);
  if (inflight) return inflight;

  const loader = DEMO_LOADERS[name];
  if (!loader) return Promise.resolve(undefined);

  const promise = loader()
    .then((demo) => {
      resolvedCache.set(name, demo);
      inflightCache.delete(name);
      return demo;
    })
    .catch((err) => {
      inflightCache.delete(name);
      throw err;
    });

  inflightCache.set(name, promise);
  return promise;
}
