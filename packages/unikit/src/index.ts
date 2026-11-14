// @unikit-bridge/ui 공개 API （T-6 완성）
export { cn } from "./lib/utils";

export {
  Button,
  buttonVariants,
  buttonTextVariants,
  type ButtonProps,
} from "./components/button";

export {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
  cardVariants,
  cardHeaderVariants,
  cardTitleVariants,
  cardDescriptionVariants,
  cardContentVariants,
  cardFooterVariants,
  type CardProps,
  type CardHeaderProps,
  type CardTitleProps,
  type CardDescriptionProps,
  type CardContentProps,
  type CardFooterProps,
} from "./components/card";

export { Input, inputVariants, type InputProps } from "./components/input";

export { Label, labelVariants, type LabelProps } from "./components/label";

export {
  Badge,
  badgeVariants,
  badgeTextVariants,
  type BadgeProps,
} from "./components/badge";

// ── shadcn 카탈로그 1차 배치 23종（사이클 30, T-4 통합） ──────────────────────

export { Checkbox, type CheckboxProps } from "./components/checkbox";

export {
  RadioGroup,
  RadioGroupItem,
  type RadioGroupProps,
  type RadioGroupItemProps,
} from "./components/radio-group";

export {
  Switch,
  switchTrackVariants,
  switchThumbVariants,
  type SwitchProps,
} from "./components/switch";

export {
  Toggle,
  toggleVariants,
  toggleTextVariants,
  type ToggleProps,
} from "./components/toggle";

export {
  ToggleGroup,
  ToggleGroupItem,
  type ToggleGroupProps,
  type ToggleGroupItemProps,
} from "./components/toggle-group";

export {
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
  tabsListVariants,
  type TabsProps,
  type TabsListProps,
  type TabsTriggerProps,
  type TabsContentProps,
} from "./components/tabs";

export {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
  type AccordionProps,
  type AccordionItemProps,
  type AccordionTriggerProps,
  type AccordionContentProps,
} from "./components/accordion";

export {
  Collapsible,
  CollapsibleTrigger,
  CollapsibleContent,
  type CollapsibleProps,
  type CollapsibleTriggerProps,
  type CollapsibleContentProps,
} from "./components/collapsible";

export { Progress, type ProgressProps } from "./components/progress";

export { AspectRatio, type AspectRatioProps } from "./components/aspect-ratio";

export {
  Skeleton,
  skeletonVariants,
  type SkeletonProps,
} from "./components/skeleton";

export {
  Separator,
  separatorVariants,
  type SeparatorProps,
} from "./components/separator";

export {
  Alert,
  AlertTitle,
  AlertDescription,
  alertVariants,
  alertGlyphVariants,
  alertTitleVariants,
  alertDescriptionVariants,
  type AlertProps,
  type AlertTitleProps,
  type AlertDescriptionProps,
} from "./components/alert";

export {
  Kbd,
  KbdGroup,
  kbdVariants,
  kbdTextVariants,
  kbdGroupVariants,
  type KbdProps,
  type KbdGroupProps,
} from "./components/kbd";

export {
  Table,
  TableHeader,
  TableBody,
  TableFooter,
  TableRow,
  TableHead,
  TableCell,
  TableCaption,
  tableContainerVariants,
  tableVariants,
  tableHeaderVariants,
  tableBodyVariants,
  tableFooterVariants,
  tableRowVariants,
  tableHeadVariants,
  tableHeadTextVariants,
  tableCellVariants,
  tableCellTextVariants,
  tableCaptionVariants,
  tableCaptionTextVariants,
  type TableProps,
  type TableHeaderProps,
  type TableBodyProps,
  type TableFooterProps,
  type TableRowProps,
  type TableHeadProps,
  type TableCellProps,
  type TableCaptionProps,
} from "./components/table";

export {
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbPage,
  BreadcrumbSeparator,
  BreadcrumbEllipsis,
  breadcrumbListVariants,
  breadcrumbItemVariants,
  breadcrumbLinkVariants,
  breadcrumbLinkTextVariants,
  breadcrumbPageVariants,
  breadcrumbSeparatorVariants,
  breadcrumbSeparatorTextVariants,
  breadcrumbEllipsisVariants,
  breadcrumbEllipsisTextVariants,
  type BreadcrumbProps,
  type BreadcrumbListProps,
  type BreadcrumbItemProps,
  type BreadcrumbLinkProps,
  type BreadcrumbPageProps,
  type BreadcrumbSeparatorProps,
  type BreadcrumbEllipsisProps,
} from "./components/breadcrumb";

export {
  Pagination,
  PaginationContent,
  PaginationLink,
  PaginationItem,
  PaginationPrevious,
  PaginationNext,
  PaginationEllipsis,
  paginationVariants,
  paginationContentVariants,
  paginationGlyphVariants,
  paginationLabelVariants,
  paginationEllipsisVariants,
  paginationEllipsisTextVariants,
  type PaginationProps,
  type PaginationContentProps,
  type PaginationLinkProps,
  type PaginationItemProps,
  type PaginationPreviousProps,
  type PaginationNextProps,
  type PaginationEllipsisProps,
} from "./components/pagination";

export {
  Textarea,
  textareaVariants,
  type TextareaProps,
} from "./components/textarea";

export {
  Avatar,
  AvatarImage,
  AvatarFallback,
  AvatarBadge,
  AvatarGroup,
  AvatarGroupCount,
  type AvatarSize,
  type AvatarProps,
  type AvatarImageProps,
  type AvatarFallbackProps,
  type AvatarBadgeProps,
  type AvatarGroupProps,
  type AvatarGroupCountProps,
} from "./components/avatar";

export {
  Empty,
  EmptyHeader,
  EmptyTitle,
  EmptyDescription,
  EmptyContent,
  EmptyMedia,
  type EmptyProps,
  type EmptyHeaderProps,
  type EmptyTitleProps,
  type EmptyDescriptionProps,
  type EmptyContentProps,
  type EmptyMediaProps,
} from "./components/empty";

export {
  EditorToolbar,
  EDITOR_FORMATS,
  activeFormats,
  type EditorToolbarProps,
  type EditorFormat,
  type EditorFormatState,
  type EditorCommand,
  type RnToWebViewMessage,
  type WebViewToRnMessage,
} from "./components/editor-toolbar";

export {
  Field,
  FieldLabel,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLegend,
  FieldSeparator,
  FieldSet,
  FieldContent,
  FieldTitle,
  type FieldSetProps,
  type FieldLegendProps,
  type FieldGroupProps,
  type FieldProps,
  type FieldContentProps,
  type FieldLabelProps,
  type FieldTitleProps,
  type FieldDescriptionProps,
  type FieldSeparatorProps,
  type FieldErrorProps,
} from "./components/field";

export {
  Item,
  ItemMedia,
  ItemContent,
  ItemActions,
  ItemGroup,
  ItemSeparator,
  ItemTitle,
  ItemDescription,
  ItemHeader,
  ItemFooter,
  type ItemGroupProps,
  type ItemSeparatorProps,
  type ItemProps,
  type ItemMediaProps,
  type ItemContentProps,
  type ItemTitleProps,
  type ItemDescriptionProps,
  type ItemActionsProps,
  type ItemHeaderProps,
  type ItemFooterProps,
} from "./components/item";

export {
  ButtonGroup,
  ButtonGroupSeparator,
  ButtonGroupText,
  buttonGroupVariants,
  type ButtonGroupProps,
  type ButtonGroupTextProps,
  type ButtonGroupSeparatorProps,
} from "./components/button-group";

// ── shadcn 카탈로그 2차 배치 32종（사이클 40, T-4 통합） ─────────────────────
// chart는 @unikit-bridge/ui/chart 단독 진입점（§0.1 — Metro 오염 방지）이므로
// 여기에 포함하지 않는다.

// ── 오버레이 — 모달시트 ──

export {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  type DialogProps,
  type DialogTriggerProps,
  type DialogCloseProps,
  type DialogContentProps,
  type DialogHeaderProps,
  type DialogFooterProps,
  type DialogTitleProps,
  type DialogDescriptionProps,
} from "./components/dialog";

export {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogMedia,
  AlertDialogTitle,
  AlertDialogTrigger,
  alertDialogContentVariants,
  alertDialogHeaderVariants,
  alertDialogFooterVariants,
  type AlertDialogProps,
  type AlertDialogTriggerProps,
  type AlertDialogContentProps,
  type AlertDialogHeaderProps,
  type AlertDialogFooterProps,
  type AlertDialogTitleProps,
  type AlertDialogDescriptionProps,
  type AlertDialogMediaProps,
  type AlertDialogActionProps,
  type AlertDialogCancelProps,
} from "./components/alert-dialog";

export {
  Sheet,
  SheetTrigger,
  SheetClose,
  SheetContent,
  SheetHeader,
  SheetFooter,
  SheetTitle,
  SheetDescription,
  sheetContentVariants,
  type SheetProps,
  type SheetTriggerProps,
  type SheetCloseProps,
  type SheetContentProps,
  type SheetHeaderProps,
  type SheetFooterProps,
  type SheetTitleProps,
  type SheetDescriptionProps,
} from "./components/sheet";

export {
  Drawer,
  DrawerTrigger,
  DrawerClose,
  DrawerContent,
  DrawerHeader,
  DrawerFooter,
  DrawerTitle,
  DrawerDescription,
  drawerContentVariants,
  type DrawerProps,
  type DrawerTriggerProps,
  type DrawerCloseProps,
  type DrawerContentProps,
  type DrawerHeaderProps,
  type DrawerFooterProps,
  type DrawerTitleProps,
  type DrawerDescriptionProps,
} from "./components/drawer";

// ── 오버레이 — 앵커 팝업메뉴 ──

export {
  Popover,
  PopoverTrigger,
  PopoverContent,
  PopoverAnchor,
  PopoverHeader,
  PopoverTitle,
  PopoverDescription,
  popoverContentVariants,
  popoverHeaderVariants,
  popoverTitleVariants,
  popoverDescriptionVariants,
  type PopoverProps,
  type PopoverTriggerProps,
  type PopoverContentProps,
  type PopoverAnchorProps,
  type PopoverHeaderProps,
  type PopoverTitleProps,
  type PopoverDescriptionProps,
} from "./components/popover";

export {
  HoverCard,
  HoverCardTrigger,
  HoverCardContent,
  hoverCardContentVariants,
  type HoverCardProps,
  type HoverCardTriggerProps,
  type HoverCardContentProps,
} from "./components/hover-card";

export {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
  TooltipProvider,
  tooltipContentVariants,
  tooltipContentTextVariants,
  type TooltipProviderProps,
  type TooltipProps,
  type TooltipTriggerProps,
  type TooltipContentProps,
} from "./components/tooltip";

export {
  DropdownMenu,
  DropdownMenuPortal,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuLabel,
  DropdownMenuItem,
  DropdownMenuCheckboxItem,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuSubContent,
  type DropdownMenuProps,
  type DropdownMenuPortalProps,
  type DropdownMenuTriggerProps,
  type DropdownMenuContentProps,
  type DropdownMenuGroupProps,
  type DropdownMenuItemProps,
  type DropdownMenuCheckboxItemProps,
  type DropdownMenuRadioGroupProps,
  type DropdownMenuRadioItemProps,
  type DropdownMenuLabelProps,
  type DropdownMenuSeparatorProps,
  type DropdownMenuShortcutProps,
  type DropdownMenuSubProps,
  type DropdownMenuSubTriggerProps,
  type DropdownMenuSubContentProps,
} from "./components/dropdown-menu";

export {
  ContextMenu,
  ContextMenuTrigger,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuCheckboxItem,
  ContextMenuRadioItem,
  ContextMenuLabel,
  ContextMenuSeparator,
  ContextMenuShortcut,
  ContextMenuGroup,
  ContextMenuPortal,
  ContextMenuSub,
  ContextMenuSubContent,
  ContextMenuSubTrigger,
  ContextMenuRadioGroup,
  type ContextMenuProps,
  type ContextMenuPortalProps,
  type ContextMenuTriggerProps,
  type ContextMenuContentProps,
  type ContextMenuGroupProps,
  type ContextMenuItemProps,
  type ContextMenuCheckboxItemProps,
  type ContextMenuRadioGroupProps,
  type ContextMenuRadioItemProps,
  type ContextMenuLabelProps,
  type ContextMenuSeparatorProps,
  type ContextMenuShortcutProps,
  type ContextMenuSubProps,
  type ContextMenuSubTriggerProps,
  type ContextMenuSubContentProps,
} from "./components/context-menu";

// ── 탐색선택 ──

export {
  Command,
  CommandDialog,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandShortcut,
  CommandSeparator,
  type CommandProps,
  type CommandDialogProps,
  type CommandInputProps,
  type CommandListProps,
  type CommandEmptyProps,
  type CommandGroupProps,
  type CommandItemProps,
  type CommandShortcutProps,
  type CommandSeparatorProps,
} from "./components/command";

export {
  Combobox,
  ComboboxInput,
  ComboboxContent,
  ComboboxList,
  ComboboxItem,
  ComboboxGroup,
  ComboboxLabel,
  ComboboxCollection,
  ComboboxEmpty,
  ComboboxSeparator,
  ComboboxChips,
  ComboboxChip,
  ComboboxChipsInput,
  ComboboxTrigger,
  ComboboxValue,
  useComboboxAnchor,
  type ComboboxProps,
  type ComboboxTriggerProps,
  type ComboboxValueProps,
  type ComboboxClearProps,
  type ComboboxInputProps,
  type ComboboxContentProps,
  type ComboboxListProps,
  type ComboboxEmptyProps,
  type ComboboxGroupProps,
  type ComboboxLabelProps,
  type ComboboxCollectionProps,
  type ComboboxItemProps,
  type ComboboxSeparatorProps,
  type ComboboxChipsProps,
  type ComboboxChipProps,
  type ComboboxChipsInputProps,
} from "./components/combobox";

export {
  Menubar,
  MenubarPortal,
  MenubarMenu,
  MenubarTrigger,
  MenubarContent,
  MenubarGroup,
  MenubarSeparator,
  MenubarLabel,
  MenubarItem,
  MenubarShortcut,
  MenubarCheckboxItem,
  MenubarRadioGroup,
  MenubarRadioItem,
  MenubarSub,
  MenubarSubTrigger,
  MenubarSubContent,
  type MenubarProps,
  type MenubarMenuProps,
  type MenubarPortalProps,
  type MenubarTriggerProps,
  type MenubarContentProps,
  type MenubarGroupProps,
  type MenubarItemProps,
  type MenubarCheckboxItemProps,
  type MenubarRadioGroupProps,
  type MenubarRadioItemProps,
  type MenubarLabelProps,
  type MenubarSeparatorProps,
  type MenubarShortcutProps,
  type MenubarSubProps,
  type MenubarSubTriggerProps,
  type MenubarSubContentProps,
} from "./components/menubar";

export {
  NavigationMenu,
  NavigationMenuList,
  NavigationMenuItem,
  NavigationMenuContent,
  NavigationMenuTrigger,
  NavigationMenuLink,
  NavigationMenuIndicator,
  NavigationMenuViewport,
  navigationMenuTriggerStyle,
  type NavigationMenuProps,
  type NavigationMenuListProps,
  type NavigationMenuItemProps,
  type NavigationMenuTriggerProps,
  type NavigationMenuContentProps,
  type NavigationMenuLinkProps,
  type NavigationMenuIndicatorProps,
  type NavigationMenuViewportProps,
} from "./components/navigation-menu";

export {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectScrollDownButton,
  SelectScrollUpButton,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
  type SelectProps,
  type SelectTriggerProps,
  type SelectValueProps,
  type SelectContentProps,
  type SelectGroupProps,
  type SelectLabelProps,
  type SelectItemProps,
  type SelectSeparatorProps,
  type SelectScrollButtonProps,
} from "./components/select";

export {
  NativeSelect,
  NativeSelectOptGroup,
  NativeSelectOption,
  type NativeSelectProps,
  type NativeSelectOptionProps,
  type NativeSelectOptGroupProps,
} from "./components/native-select";

// ── 폼 입력 ──

export {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
  InputOTPSeparator,
  type InputOTPProps,
  type InputOTPGroupProps,
  type InputOTPSlotProps,
  type InputOTPSeparatorProps,
} from "./components/input-otp";

export {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupText,
  InputGroupInput,
  InputGroupTextarea,
  type InputGroupProps,
  type InputGroupAddonProps,
  type InputGroupButtonProps,
  type InputGroupTextProps,
  type InputGroupInputProps,
  type InputGroupTextareaProps,
} from "./components/input-group";

export {
  Slider,
  type SliderProps,
} from "./components/slider";

export {
  useFormField,
  Form,
  FormItem,
  FormLabel,
  FormControl,
  FormDescription,
  FormMessage,
  FormField,
  type FormItemProps,
  type FormLabelProps,
  type FormControlProps,
  type FormDescriptionProps,
  type FormMessageProps,
} from "./components/form";

export {
  Calendar,
  type CalendarProps,
} from "./components/calendar";

// ── 레이아웃스크롤 ──

export {
  ScrollArea,
  ScrollBar,
  type ScrollAreaProps,
  type ScrollBarProps,
} from "./components/scroll-area";

export {
  ResizablePanelGroup,
  ResizablePanel,
  ResizableHandle,
  type ResizablePanelGroupProps,
  type ResizablePanelProps,
  type ResizableHandleProps,
} from "./components/resizable";

export {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselPrevious,
  CarouselNext,
  type CarouselApi,
  type CarouselProps,
  type CarouselContentProps,
  type CarouselItemProps,
  type CarouselPreviousProps,
  type CarouselNextProps,
} from "./components/carousel";

export {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupAction,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarInput,
  SidebarInset,
  SidebarMenu,
  SidebarMenuAction,
  SidebarMenuBadge,
  SidebarMenuButton,
  sidebarMenuButtonVariants,
  SidebarMenuItem,
  SidebarMenuSkeleton,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  SidebarProvider,
  SidebarRail,
  SidebarSeparator,
  SidebarTrigger,
  type SidebarProviderProps,
  type SidebarProps,
  type SidebarTriggerProps,
  type SidebarRailProps,
  type SidebarInsetProps,
  type SidebarInputProps,
  type SidebarHeaderProps,
  type SidebarFooterProps,
  type SidebarSeparatorProps,
  type SidebarContentProps,
  type SidebarGroupProps,
  type SidebarGroupLabelProps,
  type SidebarGroupActionProps,
  type SidebarGroupContentProps,
  type SidebarMenuProps,
  type SidebarMenuItemProps,
  type SidebarMenuButtonProps,
  type SidebarMenuActionProps,
  type SidebarMenuBadgeProps,
  type SidebarMenuSkeletonProps,
  type SidebarMenuSubProps,
  type SidebarMenuSubItemProps,
  type SidebarMenuSubButtonProps,
} from "./components/sidebar";

// ── 피드백 ──

export {
  toast,
  Toaster,
  type ToastVariant,
  type ToastOptions,
  type ToasterProps,
} from "./components/sonner";

export {
  Spinner,
  spinnerVariants,
  type SpinnerProps,
} from "./components/spinner";

// ── 메시지 UI ──

export {
  MessageGroup,
  Message,
  MessageAvatar,
  MessageContent,
  MessageFooter,
  MessageHeader,
  type MessageAlign,
  type MessageGroupProps,
  type MessageProps,
  type MessageAvatarProps,
  type MessageContentProps,
  type MessageHeaderProps,
  type MessageFooterProps,
} from "./components/message";

export {
  BubbleGroup,
  Bubble,
  BubbleContent,
  BubbleReactions,
  type BubbleVariant,
  type BubbleGroupProps,
  type BubbleProps,
  type BubbleContentProps,
  type BubbleReactionsProps,
} from "./components/bubble";

export {
  Attachment,
  AttachmentGroup,
  AttachmentMedia,
  AttachmentContent,
  AttachmentTitle,
  AttachmentDescription,
  AttachmentActions,
  AttachmentAction,
  AttachmentTrigger,
  type AttachmentState,
  type AttachmentSize,
  type AttachmentOrientation,
  type AttachmentProps,
  type AttachmentMediaProps,
  type AttachmentContentProps,
  type AttachmentTitleProps,
  type AttachmentDescriptionProps,
  type AttachmentActionsProps,
  type AttachmentActionProps,
  type AttachmentTriggerProps,
  type AttachmentGroupProps,
} from "./components/attachment";

export {
  Marker,
  MarkerIcon,
  MarkerContent,
  markerVariants,
  type MarkerProps,
  type MarkerIconProps,
  type MarkerContentProps,
} from "./components/marker";

export {
  MessageScrollerProvider,
  MessageScroller,
  MessageScrollerViewport,
  MessageScrollerContent,
  MessageScrollerItem,
  MessageScrollerButton,
  useMessageScroller,
  useMessageScrollerScrollable,
  useMessageScrollerVisibility,
  type MessageScrollerScrollOptions,
  type MessageScrollerVisibilityValue,
  type MessageScrollerProviderProps,
  type MessageScrollerProps,
  type MessageScrollerViewportProps,
  type MessageScrollerContentProps,
  type MessageScrollerItemProps,
  type MessageScrollerButtonProps,
} from "./components/message-scroller";

// ── 유틸 ──

export {
  DirectionProvider,
  useDirection,
  type Direction,
  type DirectionProviderProps,
} from "./components/direction";

// 테마（T-5가 packages/unikit/src/theme/ 을 병렬 생성） — 디렉터리 존재 여부와
// 무관하게 이 라인은 항상 유지한다（T-6 지시）.
export * from "./theme";

// ── 유니버설 벡터 아이콘 ──
export {
  CheckIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  ChevronRightIcon,
  ChevronLeftIcon,
  XIcon,
  SearchIcon,
  MinusIcon,
  CircleIcon,
  MoreHorizontalIcon,
  ArrowLeftIcon,
  ArrowRightIcon,
  ArrowUpIcon,
  ArrowDownIcon,
  InfoIcon,
  AlertCircleIcon,
  CheckCircle2Icon,
  XCircleIcon,
  Loader2Icon,
  type IconProps,
  type IconComponent,
} from "@unikit-bridge/ui/primitives";

