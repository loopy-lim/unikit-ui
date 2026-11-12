/**
 * 사이트 브랜드 마크 — branding/svg/mark-u.svg 와 동일 실루엣.
 * 랜딩·문서 셸·블록 BrandMark가 같은 마크를 쓴다.
 */
import Link from "next/link";
import { cn } from "@unikit-bridge/ui";

export function UnikitMark({
  size = 28,
  className,
}: {
  size?: number;
  className?: string;
}) {
  return (
    <img
      src="/brand/mark-u.svg"
      alt=""
      width={size}
      height={size}
      className={cn("shrink-0 rounded-[22%] object-cover", className)}
      aria-hidden
    />
  );
}

/** 마크 + Syne 워드마크 — 헤더·히어로 공통 */
export function SiteBrand({
  href = "/",
  className,
  markSize = 28,
  wordmarkClassName,
}: {
  href?: string;
  className?: string;
  markSize?: number;
  wordmarkClassName?: string;
}) {
  return (
    <Link
      href={href}
      className={cn(
        "site-focusable inline-flex items-center gap-2.5 text-foreground",
        className
      )}
    >
      <UnikitMark size={markSize} />
      <span
        className={cn(
          "site-display font-semibold tracking-tight",
          wordmarkClassName ?? "text-lg"
        )}
      >
        UniKit
      </span>
    </Link>
  );
}
