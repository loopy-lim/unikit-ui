// GET /r/registry.json — 루트 레지스트리 카탈로그(인덱스) 동적 서빙(T-9, AC-7).
// shadcn 공식 규격의 동적 서빙 스니펫 구조: loadRegistry로 카탈로그(name/homepage/items)를
// 조립해 응답한다. 아이템 본문(files[].content)은 각 /r/<name>.json이 담당한다.
import { NextResponse } from "next/server";

import { loadRegistry } from "@/lib/registry";

// 레지스트리 원본(packages/unikit/registry.json)은 요청 시점의 파일을 읽어야 하므로
// 빌드 시점 사전 렌더를 비활성화한다.
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const registry = await loadRegistry();
    return NextResponse.json(registry);
  } catch {
    return NextResponse.json(
      { error: "Failed to load registry." },
      { status: 500 },
    );
  }
}
