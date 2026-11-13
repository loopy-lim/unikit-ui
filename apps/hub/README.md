# unikit-hub

Cloudflare Worker for `https://unikit.ll3.kr`.

- `/` — product hub
- `/ui` → `https://ui.ll3.kr/`
- `/scriptca` → `https://scriptca.ll3.kr/`

```bash
cd apps/hub
npx wrangler deploy
```

CI: `.github/workflows/deploy-hub.yml` deploys on `main` pushes that touch `apps/hub/**` (needs `CLOUDFLARE_API_TOKEN` + `CLOUDFLARE_ACCOUNT_ID`).
