# UniKit 컴포넌트 로드맵 — shadcn 카탈로그 전체 가져오기

shadcn/ui(new-york-v4)의 `registry:ui` 61종을 UniKit 유니버설(한 벌 소스 → 웹·네이티브 동일 렌더)로 가져오는 전체 계획이에요. 이 문서는 어디까지 왔고, 남은 컴포넌트가 어떤 브리지 기능을 필요로 하는지를 정리해요. 수치의 기준일: 2026-11-10.

## 현재 상태: 28 / 61종

| 단계 | 수량 | 컴포넌트 |
|---|---|---|
| v0.1 기초 (완료) | 5 | button, card, input, label, badge |
| 1차 배치 (완료, 이번 사이클) | 23 | accordion, alert, aspect-ratio, avatar, breadcrumb, button-group, checkbox, collapsible, empty, field, item, kbd, pagination, progress, radio-group, separator, skeleton, switch, table, tabs, textarea, toggle, toggle-group |
| 잔여 | 33 | 아래 티어 표 |

잔여 33종은 **필요한 브리지 기능**에 따라 3개 티어로 나뉘어요. 티어 순서가 구현 순서 후보예요(티어가 낮을수록 브리지 확장 없이 지금 패턴으로 가능하거나 확장이 가벼워요).

## 티어 2 — 오버레이·포털 13종

화면 최상위에 떠야 하는 컴포넌트예요. 현재 브리지(View/Text/Pressable/TextInput/Image)로는 부모 레이아웃을 벗어날 수 없어서, **포털 프리미티브**가 먼저 필요해요.

| 컴포넌트 | 종류 | 추가로 필요한 것 |
|---|---|---|
| `dialog` | 중앙 모달 | 포털 + 배경 눌림 닫기 + ESC(웹) |
| `alert-dialog` | 확인 모달 | dialog 공유 |
| `sheet` | 측면 슬라이드 패널 | dialog 공유 |
| `drawer` | 바닥 슬라이드 패널 | 드래그 닫기 제스처(네이티브 PanResponder) |
| `popover` | 앵커 팝오버 | **위치 계산**(앵커 기준 배치 — 웹 getBoundingClientRect / RN measure) |
| `hover-card` | 호버 카드 | popover 공유 + 웹 호버 지연 |
| `tooltip` | 짧은 힌트 | popover 공유 |
| `dropdown-menu` | 드롭다운 메뉴 | popover 공유 + 하위 메뉴 캐스케이드 |
| `context-menu` | 우클릭 메뉴 | 웹 onContextMenu / 네이티브 길게 누르기 매핑 |
| `combobox` | 검색 셀렉트 | popover + command 공유 |
| `command` | 명령 팔레트 | 키보드 탐색(웹) ↔ 방향키/포커스(네이티브) 통합 입력 모델 |
| `menubar` | 수평 메뉴 바 | dropdown-menu 공유 |
| `navigation-menu` | 내비게이션 메뉴 | dropdown-menu 공유 |

**선행 브리지 작업(B-1):** `Portal`(웹 `createPortal` → document.body / 네이티브 RN `Modal`), 바깥 눌림 감지, 앵커 위치 계산 유틸. 이 계약이 잡히면 13종 대부분이 같은 패턴으로 이식돼요.

## 티어 3 — 입력 확장·제스처 9종

| 컴포넌트 | 종류 | 추가로 필요한 것 |
|---|---|---|
| `native-select` | 기본 셀렉트 | 웹 `<select>` 옵션 렌더 — 브리지 Select 프리미티브(가장 가벼움, 티어 3 시작점) |
| `select` | 커스텀 셀렉트 | 티어 2 popover + 목록 키보드 탐색 |
| `slider` | 슬라이더 | 포인터 드래그 추적(웹 PointerEvent / RN PanResponder) 공통 추상화 |
| `resizable` | 크기 조절 패널 | 드래그 공통 추상화 공유 |
| `scroll-area` | 커스텀 스크롤 영역 | 웹 overflow 스타일 / 네이티브 ScrollView — `web:` 분기 폭 넓음, 감싸기 계약 필요 |
| `calendar` | 달력 | 순수 로직(날짜 그리드)이라 브리지 확장 불필요, 그리드 레이아웃만 |
| `input-otp` | OTP 입력 | TextInput value 분배 + 자동 포커스 이동 |
| `input-group` | 입력 묶음 | 지금 패턴으로 가능(조립형) — 티어 상관없이 언제든 |
| `form` | 폼 라이브러리 통합 | react-hook-form/zod 의존 추가 여부 결정(레지스트리 deps 정책) |

## 티어 4 — 데이터 시각화·복합 11종

| 컴포넌트 | 종류 | 추가로 필요한 것 |
|---|---|---|
| `chart` | Recharts 래퍼 | 웹 Recharts / 네이티브 대체(react-native-svg 기반 또는 정적 View 차트) — 이원화 전략 필요 |
| `carousel` | 캐러셀 | 가로 스와이프(네이티브 FlatList paging / 웹 scroll-snap) |
| `sidebar` | 사이드바(블록급) | sheet + collapsible 조립 + 컨테이너 쿼리 대응 |
| `sonner` | 토스트 | 포털(티어 2) + 전역 큐 상태 |
| `spinner` | 로딩 스피너 | 애니메이션 계약(아래 한계 참고) |
| `message` | 채팅 메시지 | 지금 패턴으로 대부분 가능 |
| `message-scroller` | 메시지 스크롤 | scroll-area 공유 + 하단 고정 |
| `bubble` | 말풍선 | 지금 패턴으로 가능 |
| `attachment` | 첨부 표시 | 지금 패턴으로 가능 |
| `marker` | 마커(하이라이트) | 지금 패턴으로 가능 |
| `direction` | RTL/LTR 방향 | 논리 속성(ms-/me-) 토큰 정책 — Tailwind v4는 지원, uniwind 확인 필요 |

티어 4의 `message`·`bubble`·`attachment`·`marker` 4종은 사실상 티어 없이 지금 패턴으로 이식 가능해서, 다음 사이클의 "가성비 배치"로 먼저 가져올 수 있어요.

## 알려진 한계 (1차 배치에서 기록)

완료된 28종에도 브리지 계약상 아직 표현하지 못한 것이 있어요. 잔여 티어와 함께 후속에서 다뤄요.

- **표 시맨틱** — `table`은 View+flex 이식이라 `role="table"/"row"/"cell"`이 없어요(BridgeRole에 해당 역할이 없음). 스크린리더가 표 구조를 읽지 못해요.
- **표·빈상태 셀 children** — `TableHead`·`TableCell`·`EmptyMedia`는 children을 내부 Text로 강제 래핑해요. 문자열이 아니라 View 기반 children을 넣으면 네이티브에서 렌더가 깨져요(문자열 권장, 파일 머리 주석에 표기).
- **`aria-valuenow`** — `progress`가 `role="progressbar"`는 지정하지만 현재값 속성은 브리지 계약에 없어요.
- **`aria-current`** — `pagination`의 현재 페이지는 시각 강조만 가능하고 `aria-current="page"`는 브리지 계약에 없어요.
- **`aria-pressed`(네이티브)** — toggle은 웹에서 `aria-pressed`가 나가지만 네이티브에서는 시각 상태만 반영돼요(accessibilityState 매핑에 pressed 없음).
- **경고 테두리 대비** — `alert` destructive의 `border-destructive/50`은 비텍스트 3:1에 미달해요(shadcn 원본과 동일한 값 — 글리프 ⚠·글자색이 상태의 주 신호).
- **애니메이션** — `skeleton`의 펄스 등은 `web:animate-pulse`로 웹 전용이에요. 네이티브 애니메이션은 uniwind 지원 확인 후 계약이 필요해요(티어 4 spinner와 연동).
- **셀렉터 의존 스타일** — 원본의 `data-[state=…]`·`group`/`peer` 셀렉터는 전부 조건부 클래스 문자열로 치환했어요. 상태 조합이 많은 컴포넌트(dialog 계열)는 이 비용이 커져서, 포털 작업 시 상태 전파 방식을 함께 설계해야 해요.

## 다음 사이클 제안 순서

1. **B-1 포털·위치 계약 설계** → 티어 2 오버레이 13종 (오버레이가 shadcn 사용처의 가장 큰 빈자리)
2. 티어 4 가성비 4종(message, bubble, attachment, marker) — 브리지 확장 불필요
3. 티어 3 입력 확장(native-select → select → slider 순)
4. chart·carousel 등 이원화 전략이 필요한 것들
