# Cloudflare Pages 배포 (정적)

소개 사이트·쇼케이스·shadcn 레지스트리(`/r/*.json`)를 **정적 export**로 Cloudflare Pages에 올립니다.

- 프로젝트명: `unikit-ui`
- 권장 커스텀 도메인: `ui.unikit.ll3.kr`
- 산출물: `apps/web/out/` (`output: "export"`)

## 1. Cloudflare / GitHub 시크릿 (사람)

1. Cloudflare에서 Pages 프로젝트 `unikit-ui` 생성(production branch = `main`). 없으면 첫 `wrangler pages deploy` 때 생성해도 됩니다.
2. 커스텀 도메인 `ui.unikit.ll3.kr` 연결(DNS는 Cloudflare가 안내하는 CNAME).
3. GitHub 저장소 Secrets:
   - `CLOUDFLARE_ACCOUNT_ID`
   - `CLOUDFLARE_API_TOKEN` (Account → Cloudflare Pages → Edit)

## 2. 로컬 수동 배포

```bash
bun install
cd apps/web
bun run build          # prebuild → public/r/*.json 생성 후 next export
npx wrangler login     # 최초 1회
bun run deploy
```

로컬에서 오리진을 바꾸려면:

```bash
SITE_ORIGIN=http://localhost:3000 bun run generate:registry
```

## 3. CI

`.github/workflows/deploy-pages.yml` — `main` push 또는 `workflow_dispatch` 시 빌드 후 `wrangler pages deploy`.

시크릿이 아직 없으면 워크플로의 Deploy 스텝만 실패합니다. 빌드 검증은 기존 `ci.yml`의 웹 빌드가 담당합니다.
