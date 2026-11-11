# 사이클 71 설계·계획 — shadcn 원본 일치성 복원

- 요구(사용자, 2026-11-11): «shadcn과 동일하게. 그 shadcn을 RN에서도 거의 사용할 수 있는 형태로. 지금의 것은 너무 깨지는 부분이 많아서 큰일이야.» 깨짐 관찰: 웹 사이트.
- 조사·분류 원장: docs/sdd/74-shadcn-fidelity-audit.md (D 결함 9건·C 무단 이탈 24건·렌더 의심 1건·원본 28종 보충 완료).

## 수용 기준 (AC-*)

- AC-1: 감사 원장의 D 결함 9건 중 사용자 WIP 구역 제외분 전부가 원본 클래스·동작으로 복원된다 (accordion rotate는 사용자 WIP가 이미 수정 — 중복 적용 금지, 검증만).
- AC-2: C 무단 이탈 24건이 전부 원본값으로 복원된다 (§5 목록; skeleton·checkbox의 dark: 포함, switch는 WIP 구역 제외).
- AC-3: 보충된 28종 원본에 대한 재대조 감사가 수행되고 그 C·D가 WIP 구역 제외하고 적용된다 (배치 2b).
- AC-4: 모든 수정은 src/components와 registry/ui 양 트리에 동일 반영된다.
- AC-5: bun run typecheck·audit:design·웹 빌드·엑스포 tsc 통과 + 배포 전 로컬 렌더 실측(resizable 가로 분할·calendar 격자·table 셀 정렬 포함) 확인.
- AC-6: 사용자 미커밋 WIP(accordion·collapsible·switch·tabs·bridge 3종·expo showcase·kitchen-sink page·landing)는 보존 — 커밋 대상에서 제외.

## 태스크

- T-1 배치 1 결함 복원 (수행: Frontend/UI Engineer 관점 — 오케스트레이터 자체 수행, 기계적 되돌리기라 위임 실익 없음):
  resizable flex-row(D·P1)·calendar 셀 크기(D·P2)·attachment w-30(D·P2)·sidebar MenuButton hover/active(D·P2)·input-otp gap-2(D·P2)·table 셀 정렬(D·P2, 보충 원본으로 검증)·message 푸터 겹침(의심 확인 후)·dropdown-menu/context-menu 하이라이트 글자색(D·P3).
- T-2 배치 2 C 복원 24건 (§5 — 원본 대조 후 정확 클래스 문자열로 되돌리기).
- T-3 배치 2b: 백그라운드 재대조 감사(연구직, 읽기 전용, 진행 중) 결과의 C·D 적용 — WIP 4종(accordion·collapsible·switch·tabs) 제외.
- T-4 배치 3 구조: skeleton·checkbox dark: 제거·stale 머리 주석 갱신(WIP 파일 제외)·site.css 애니메이션 클래스 registry css 아이템화.
- T-5 검증: 위 AC-5 명령 + G3 독립 Staff Code Reviewer 스폰 판정 + G4 로컬 프리뷰 렌더 실측(오케스트레이터 — T3 프리뷰 도구는 오케스트레이터 전용, 사이클 40·70 전례) + G5 독립 Release Gatekeeper 스폰 판정.

## 경계

- 수정 허용: packages/unikit/src/components·packages/unikit/registry/ui (WIP 4종·브리지 3종 제외), apps/web/app/site.css 및 registry.json은 T-4 css 아이템화에 한해.
- 수정 금지: shadcn-ref/(이번 보충 신규 파일 제외 — 이미 완료)·apps/expo WIP 파일·브리지·생성물(globals.css 토큰 블록·tokens.md).
- 커밋·푸시·배포는 사용자 요청 시에만.
