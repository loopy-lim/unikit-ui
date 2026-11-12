import Link from "next/link";

/** /components/[name] 404 — catalog에 없는 이름(notFound())일 때 셸 레이아웃 안에 렌더 */
export default function NotFound() {
  return (
    <div className="flex min-h-[50dvh] flex-col items-start justify-center gap-3 py-16">
      <p className="site-display text-3xl font-semibold tracking-tight text-foreground">
        문서를 찾을 수 없어요
      </p>
      <p className="font-sans text-sm leading-6 text-muted-foreground">
        요청한 컴포넌트가 카탈로그에 없어요. 전체 목록에서 다시 골라보세요.
      </p>
      <Link
        href="/components"
        className="site-focusable mt-2 font-sans text-xs text-muted-foreground underline-offset-2 hover:underline"
      >
        ← 전체 목록
      </Link>
    </div>
  );
}
