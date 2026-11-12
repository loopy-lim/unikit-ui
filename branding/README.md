# UniKit brand assets

확정 BI:

- **워드마크**: 사이트 디스플레이와 같은 **Syne Bold**(SIL OFL 1.1 — 로고 사용 가능)
- **마크**: 끝만 바깥·위로 올린 커스텀 **U** (`svg/mark-u.svg`가 단일 출처)
- **부제**: **Public Sans**(OFL) — `One import. Web and native.`

| 파일 | 용도 |
|---|---|
| `svg/mark-u.svg` | 마크 원본 |
| `icon-1024.png` | 앱 아이콘 |
| `icon-tile.png` | 배너용 타일(배경만 살짝 밝게) |
| `banner-og.png` | Open Graph (2400×1350) |
| `banner-readme.png` | README 배너 (1280×720) |
| `fonts/Syne*.ttf` · `PublicSans.ttf` | BI 렌더용(OFL) |

배포 사본: Expo `apps/expo/assets/images/`, Web `apps/web/public/brand/` · `app/favicon.ico`.
웹 UI는 `SiteBrand` / `UnikitMark`(`apps/web/components/site/brand.tsx`)가 `/brand/mark-u.svg`를 씁니다.
