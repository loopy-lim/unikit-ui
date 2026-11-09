import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/** shadcn/ui 표준 cn 유틸 — clsx(조건 결합) + tailwind-merge(클래스 충돌 병합) */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
