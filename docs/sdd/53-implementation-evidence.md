# 사이클 50 구현 증거 (G2)

- 작성: Frontend/UI Engineer (role-perspective self-execution) · 2026-11-10
- 계획: `docs/sdd/52-design-plan.md` · 요구: `docs/sdd/50-requirements.md`
- 보존: `docs/sdd/40-requirements.md` 미수정

## 변경 파일

- `apps/web/app/page.tsx` — 소개 랜딩
- `apps/web/app/showcase/page.tsx` — 기존 쇼케이스 이전(+소개 링크)
- `apps/web/app/layout.tsx` — Syne / Public Sans / IBM Plex Mono
- `apps/web/app/site.css` — 그리드·모션·포커스(마커 밖)
- `apps/web/components/site/landing.tsx` — Hero·Value·LiveDemo·Install·Teaser
- `README.md` — `/`·`/showcase` URL 정합

## V-* 실행

| ID | 명령 | cwd | 결과 |
|---|---|---|---|
| V-4 | `bun run typecheck` | 루트 | exit 0 ×3 (재실행 확인) |
| V-4 | `bun run audit:design` | 루트 | 8/8 PASS |
| V-4 | `bun run build` | apps/web | exit 0 · routes `/` `/showcase` `/r/*` |
| V-3 | curl `/r/button.json` `/r/registry.json` | :3000 | 200 · 200 |
| V-1 | LiveDemo 조작 | preview | 빈제출 오류 · `준비됨 — Orbit` |
| V-2 | `/showcase` | :3000 | 200 · 카탈로그 |
| V-5 | G4 실화면 390·1280 | preview | overflow false · AC-4 PASS |
| V-6 | README + `40-requirements` | 루트 | README `/`·`/showcase` · 40은 `??` 보존 |

## 태스크 상태

| T | 상태 |
|---|---|
| T-1 | done |
| T-2 | done |
| T-3 | done |
| T-4 | done (명령 통과) |
| T-5 | done |
