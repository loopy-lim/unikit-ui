#!/usr/bin/env bash
# 시각 회귀 실행 — CI 관문과 같은 Playwright 컨테이너 이미지(mcr.microsoft.com/playwright)
# 에서 렌더링해야 로컬과 CI의 픽셀이 일치한다. 사용법:
#   cd apps/web && bun run test:visual            비교 모드
#   cd apps/web && bun run test:visual:update     베이스라인 재생성(--update-snapshots)
# 요구사항: 호스트 bun(빌드·serve), docker(스크린샷 촬영). --update 없이 실패가
# 나면 진짜 회귀이거나 CI 컨테이너 외 환경에서 베이스라인이 만들어진 것이다.
set -euo pipefail

root="$(cd "$(dirname "$0")/../../.." && pwd)"
image="mcr.microsoft.com/playwright:v1.65.1-noble"
mode="test"
if [ "${1:-}" = "--update" ]; then
  mode="test --update-snapshots"
fi

cd "$root"
bun install --frozen-lockfile

echo "== 웹 정적 export 빌드 =="
(cd apps/web && bun x next build)

echo "== 정적 서버 기동 (:4173) =="
serve_pid=""
cleanup() {
  if [ -n "$serve_pid" ]; then
    kill "$serve_pid" 2>/dev/null || true
  fi
}
trap cleanup EXIT
(cd apps/web && exec bun x serve out -p 4173) &
serve_pid=$!
for _ in $(seq 1 30); do
  if curl -sf http://localhost:4173/components >/dev/null; then break; fi
  sleep 1
done

echo "== Playwright 컨테이너에서 ${mode} 실행 =="
docker run --rm --network host \
  -v "$root":/repo -w /repo \
  "$image" \
  bash -c "cd apps/web && npx playwright ${mode}"
