import type { ShowcaseDemo } from "./types";

import * as chart from "./chart-demos";
import * as command from "./command-demos";
import * as core from "./core-demos";
import * as direction from "./direction-demos";
import * as disclosure from "./disclosure-demos";
import * as formControls from "./form-controls-demos";
import * as formExtended from "./form-extended-demos";
import * as layout from "./layout-demos";
import * as message from "./message-demos";
import * as overlay from "./overlay-demos";

export type { ShowcaseDemo } from "./types";

/** Kebab-case keys match `packages/unikit/src/components/{name}.tsx` (62 total). */
export const demos: Record<string, ShowcaseDemo> = {
  accordion: disclosure.accordionDemo,
  alert: core.alertDemo,
  "alert-dialog": overlay.alertDialogDemo,
  "aspect-ratio": core.aspectRatioDemo,
  attachment: message.attachmentDemo,
  avatar: core.avatarDemo,
  badge: core.badgeDemo,
  breadcrumb: core.breadcrumbDemo,
  bubble: message.bubbleDemo,
  button: core.buttonDemo,
  "button-group": core.buttonGroupDemo,
  calendar: formExtended.calendarDemo,
  card: core.cardDemo,
  carousel: layout.carouselDemo,
  chart: chart.chartDemo,
  checkbox: formControls.checkboxDemo,
  collapsible: disclosure.collapsibleDemo,
  combobox: command.comboboxDemo,
  command: command.commandDemo,
  "context-menu": overlay.contextMenuDemo,
  dialog: overlay.dialogDemo,
  direction: direction.directionDemo,
  drawer: overlay.drawerDemo,
  "dropdown-menu": overlay.dropdownMenuDemo,
  empty: core.emptyDemo,
  "editor-toolbar": formControls.editorToolbarDemo,
  field: core.fieldDemo,
  form: formExtended.formDemo,
  "hover-card": overlay.hoverCardDemo,
  input: core.inputDemo,
  "input-group": formExtended.inputGroupDemo,
  "input-otp": formExtended.inputOtpDemo,
  item: core.itemDemo,
  kbd: core.kbdDemo,
  label: core.labelDemo,
  marker: message.markerDemo,
  menubar: command.menubarDemo,
  message: message.messageDemo,
  "message-scroller": message.messageScrollerDemo,
  "native-select": command.nativeSelectDemo,
  "navigation-menu": command.navigationMenuDemo,
  pagination: core.paginationDemo,
  popover: overlay.popoverDemo,
  progress: core.progressDemo,
  "radio-group": formControls.radioGroupDemo,
  resizable: layout.resizableDemo,
  "scroll-area": layout.scrollAreaDemo,
  select: command.selectDemo,
  separator: core.separatorDemo,
  sheet: overlay.sheetDemo,
  sidebar: layout.sidebarDemo,
  skeleton: core.skeletonDemo,
  slider: formExtended.sliderDemo,
  sonner: layout.sonnerDemo,
  spinner: layout.spinnerDemo,
  switch: formControls.switchDemo,
  table: core.tableDemo,
  tabs: disclosure.tabsDemo,
  textarea: formControls.textareaDemo,
  toggle: formControls.toggleDemo,
  "toggle-group": formControls.toggleGroupDemo,
  tooltip: overlay.tooltipDemo,
};
