// UniKit 루트 레지스트리 로딩 — shadcn 패키지(shadcn/registry → @shadcn/registry)의
// loadRegistry/loadRegistryItem을 이 앱에서 쓰는 형태로 조정해 재노출한다(T-9).
//
// 조정 내용: 레지스트리 원본 위치 지정. 레지스트리는 이 앱이 아니라 모노레포의
// @unikit-bridge/ui 패키지(packages/unikit/registry.json + registry/ 복사 트리)에 있다.
// loadRegistry*의 기본 cwd는 process.cwd()이므로, next dev/start 실행 디렉터리인
// apps/web 기준 상대 경로로 @unikit-bridge/ui 패키지 루트를 지정한다.
import path from "node:path";

import {
  loadRegistry as shadcnLoadRegistry,
  loadRegistryItem as shadcnLoadRegistryItem,
  RegistryItemNotFoundError,
  type LoadRegistryOptions,
} from "shadcn/registry";

export type { LoadRegistryOptions };
export { RegistryItemNotFoundError };

/** @unikit-bridge/ui 루트 레지스트리(packages/unikit/registry.json) 위치 옵션 */
export const registryOptions: LoadRegistryOptions = {
  cwd: path.resolve(process.cwd(), "..", "..", "packages", "unikit"),
};

/** 루트 레지스트리 카탈로그(name/homepage/items) 로드 — GET /r/registry.json용 */
export function loadRegistry(options: LoadRegistryOptions = {}) {
  return shadcnLoadRegistry({ ...registryOptions, ...options });
}

/** 단일 레지스트리 아이템(files[].content 포함) 로드 — GET /r/[name].json용 */
export function loadRegistryItem(itemName: string, options: LoadRegistryOptions = {}) {
  return shadcnLoadRegistryItem(itemName, { ...registryOptions, ...options });
}
