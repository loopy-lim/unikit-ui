# 사이클 72 요구 — 사이클 71 잔여 과제 4건 완료

- 원 요청: «그러면 그 과제들 스폰해서 다 시키자 /sdd 를 활용해» — 사이클 71 완료 보고에 남긴 잔여 과제 전건을 SDD로 진행.
- 선행: 사이클 71(docs/sdd/74~76, G5 PASS, 커밋 2cf4342·d3a0b4a·4c4e1ff·a067e1b, 배포 실측 완료).
- 기준 리비전: a067e1b(main), 작업 트리 클론 — 사용자 미커밋 변경 없음.
- 작성: 2026-11-11, Product Manager 관점(오케스트레이터).

## 목표

shadcn 원본 우선 방침(2026-11-11 확립) 아래 사이클 71에서 별도 과제로 미룬 4건을 완료해 라이브러리의 원본 일치성 잔여분을 정리한다.

1. **focus 링 규약 통일** — 현행 라이브러리 규약 `ring-2 + ring-offset-2 + ring-offset-background`를 원본 규격(`focus-visible:border-ring` + 폭 3px 상당 링 + `ring-ring/50`, destructive는 `ring-destructive/20`, offset 없음)으로 전체 컴포넌트 통일. 임의값 클래스 금지(audit (c))를 지키되 원본 시각(3px 무오프셋 링)에 정합할 것.
2. **menubar 트리거 hover 텍스트 전환** — 메뉴바 트리거 항목의 전경색이 hover/focus/active에 전환되지 않는 한계 해소(select가 사이클 71에서 처리한 패턴과 동일 계열로).
3. **stale 머리 주석 갱신** — 머리 주석 서술이 현재 코드와 불일치한 컴포넌트(예상 11종, 조사로 확정)의 주석 정정. 본문 코드는 건드리지 않는다.
4. **site.css 애니메이션 클래스 registry 아이템화** — 웹 데모 사이트 CSS에만 있는 애니메이션/트랜지션 클래스를 registry 소비자도 설치받을 수 있는 형태(css 아이템)로 제공.

## 수용 기준 (AC-*)

- **AC-1 링 통일**: packages/unikit 컴포넌트의 focus 링 클래스가 원본 규격으로 교체됐고(파일 목록은 조사 Q1 결과로 확정), `[…]` 임의값 클래스 0건 유지, 양 트리(src/components·registry/ui) 본문 불일치 0건.
- **AC-2 menubar**: 웹 브라우저에서 메뉴바 트리거 hover 시 라벨 전경색 전환이 관찰된다(원본 규격 클래스).
- **AC-3 주석 갱신**: 조사에서 확정한 불일치 파일 전부(accordion·collapsible·switch·tabs·bridge 등 WIP 성격 파일 제외)의 머리 주석이 코드 실제와 일치. 본문 변경 0건.
- **AC-4 registry css**: 애니메이션 클래스 정의가 registry 파일로 제공되고 registry.json에 등록되며, 웹 데모 렌더는 종전과 동일(audit (e) files 실재·(a1) globals 정합 통과).
- **AC-5 검증**: 루트 typecheck 3패키지 exit 0 · audit:design 8/8 PASS · apps/web 빌드 성공 · G4 렌더 실측(링·menubar 관찰 포함).
- **AC-6 범위 보존**: 구현 중 사용자 WIP 발생 시 보존(현재 없음). 커밋·푸시·배포는 사용자 요청 시에만.

## 제약

- shadcn-ref/가 유일한 원본 기준(수정 금지). 이식 규칙 9조·보조 규칙(임의값 금지·dark: 금지·web: 접두·이중 지정) 유지.
- bun만 사용. 생성물(globals.css 토큰 블록·registry.json theme·tokens.md) 직접 편집 금지.
- 직군 편성: 조사(위임 완료) → 계획(Product Manager·System Architect 관점, 오케스트레이터) → 구현 위임(Frontend/UI Engineer, Platform/Tooling Engineer) → G1·G3·G5 독립 평가 위임, G4는 오케스트레이터 렌더 실측(사이클 70·71 전례).

## 막힌 질문

- 없음 — 4과제 전부 사이클 71 증거 문서에 근거가 있고, 세부 사실은 조사로 확인한다.
