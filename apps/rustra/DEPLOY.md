# Cloudflare Pages 배포 (정적) — rustra 소개 사이트

UniKit 모노레포의 `apps/rustra`를 **정적 export**로 Cloudflare Pages에 올립니다.
Cloudflare 시크릿은 이 저장소(`unikit-ui`)에 이미 있습니다.

- 프로젝트명: `rustra-site`
- 권장 커스텀 도메인: `rustra.ll3.kr`
- 산출물: `apps/rustra/out/` (`output: "export"`)
- hub 경로(`unikit.ll3.kr/rustra`)는 hub Worker에서 별도 연결

## 1. Cloudflare

1. Pages 프로젝트 `rustra-site` (production branch = `main`). 없으면 첫 deploy 때 생성됩니다.
2. 커스텀 도메인 `rustra.ll3.kr` 연결.
3. GitHub Secrets (이미 존재): `CLOUDFLARE_ACCOUNT_ID`, `CLOUDFLARE_API_TOKEN`

## 2. 로컬 수동 배포

```bash
bun install
cd apps/rustra
bun run build
npx wrangler login     # 최초 1회
bun run deploy
```

## 3. CI

- `.github/workflows/ci.yml` — PR/push 시 `apps/rustra` 빌드 검증
- `.github/workflows/deploy-rustra.yml` — `main` push 또는 `workflow_dispatch` 시 Pages 배포
