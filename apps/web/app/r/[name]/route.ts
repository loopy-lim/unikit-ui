// GET /r/<name>.json — 단일 레지스트리 아이템 동적 서빙(T-9, AC-7).
// shadcn 공식 규격의 동적 서빙 스니펫 구조: 파라미터에서 .json 확장자를 제거해
// loadRegistryItem으로 조회하고, 결과를 item JSON(files[].content 포함)으로 응답한다.
// 라우트 폴더는 [name](G3 F-2 — 점 포함 세그먼트 [name].json이 프로덕션 빌드에서
// staticRoutes로 오분류돼 404)이므로 소비자 URL /r/button.json의 파라미터는
// 확장자와 함께(name="button.json") 들어오고, 아래 .json 제거는 필수 로직이다.
import { NextResponse } from "next/server";

import { loadRegistryItem, RegistryItemNotFoundError } from "@/lib/registry";

// 레지스트리 원본(packages/unikit/registry.json)은 요청 시점의 파일을 읽어야 하므로
// 빌드 시점 사전 렌더를 비활성화한다.
export const dynamic = "force-dynamic";

// 참고: 핸들러 파라미터는 검증기 호환형({ name?: string }) + 옵셔널 꺼내기로
// 선언한다. 이는 점 포함 세그먼트([name].json — 개명 전) 시절에 typed routes가
// ParamMap을 {}로 생성하던 실측에서 온 형태로, 현재 [name] 세그먼트에서도
// 그대로 유효하며 name 부재(400 분기)의 타입 근거가 된다.
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ name?: string }> },
) {
  const { name } = await params;
  const itemName = name ? decodeURIComponent(name).replace(/\.json$/, "") : "";
  if (!itemName) {
    return NextResponse.json(
      { error: "Registry item name is required." },
      { status: 400 },
    );
  }

  try {
    const item = await loadRegistryItem(itemName);
    return NextResponse.json(item);
  } catch (error) {
    if (error instanceof RegistryItemNotFoundError) {
      return NextResponse.json(
        { error: `Registry item "${itemName}" not found.` },
        { status: 404 },
      );
    }
    return NextResponse.json(
      { error: `Failed to load registry item "${itemName}".` },
      { status: 500 },
    );
  }
}
