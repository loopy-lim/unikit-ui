// @unikit-bridge/ui 공개 API (T-6 완성)
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

// ── shadcn 카탈로그 1차 배치 23종(사이클 30, T-4 통합) ──────────────────────

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

// 테마(T-5가 packages/unikit/src/theme/ 을 병렬 생성) — 디렉터리 존재 여부와
// 무관하게 이 라인은 항상 유지한다(T-6 지시).
export * from "./theme";
