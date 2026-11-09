// @unikit/core 공개 API (T-6 완성)
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

// 테마(T-5가 packages/unikit/src/theme/ 을 병렬 생성) — 디렉터리 존재 여부와
// 무관하게 이 라인은 항상 유지한다(T-6 지시).
export * from "./theme";
