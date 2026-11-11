import Link from "next/link";

/** /showcase/[name]에서 catalog에 없는 이름으로 notFound()가 발생했을 때
 *  보여지는 404 화면 — 셸 레이아웃(showcase/layout.tsx) 안에 렌더된다. */
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
        href="/showcase"
        className="site-focusable mt-2 font-sans text-xs text-muted-foreground underline-offset-2 hover:underline"
      >
        ← 전체 목록
      </Link>
    </div>
  );
}
