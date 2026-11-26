#!/bin/sh
# apps/expo 쇼케이스 E2E 스모크 러너 — android-emulator-runner의 script: 에서
# "sh .maestro/run-smoke.sh" 한 줄로 호출된다.
#
# 주의: 해당 액션은 script를 뉴라인 단위로 쪼개 각 줄을 sh -c 로 실행한다(공식
# 파서 — script-parser.ts). 여러 줄에 걸친 for 루프는 여기 두지 않으면 잘려서
# "Syntax error: end of file unexpected (expecting done)"로 죽는다(실행
# 45853306577에서 확인). 제어 흐름은 전부 이 파일 안에 둔다.
set -e

adb install -r apps/expo/android/app/build/outputs/apk/debug/app-debug.apk
adb reverse tcp:8081 tcp:8081

# 증거는 점이 아닌 디렉터리(e2e-evidence/)에 — upload-artifact v4는 점
# 디렉터리(.maestro)를 직접 지정해도 못 찾는다(실행 45855459563).
mkdir -p e2e-evidence
metro_log=e2e-evidence/metro.log

# Metro를 서브셸이 아니라 이 셸의 직접 자식으로(exec) 띄워 PID를 잡고, EXIT에서
# 정리한다 — 증거 업로드 시 metro.log를 연 채 남아 있지 않게.
(cd apps/expo && exec bun x expo start --port 8081) > "$metro_log" 2>&1 &
METRO_PID=$!
trap 'kill "$METRO_PID" 2>/dev/null || true' EXIT INT TERM

# Metro가 8081을 듣기 전에 앱이 번들을 당기면 red screen이 뜬다 — /status가
# 응답한 뒤에 플로우(launchApp)를 시작한다(최대 120초 대기). 시작 도중 죽으면
# 맹목적으로 120초를 기다리지 않고 즉시 실패시키며, 대기 실패도 여기서 끝낸다
# — 그냥 넘기면 maestro의 launch 타임아웃으로 엉뚱하게 귀결된다.
metro_ready=0
for i in $(seq 1 60); do
  if ! kill -0 "$METRO_PID" 2>/dev/null; then
    echo "Metro가 시작 도중 죽었다 — $metro_log 참고"
    exit 1
  fi
  if curl -sf -o /dev/null http://localhost:8081/status; then metro_ready=1; break; fi
  sleep 2
done
if [ "$metro_ready" != "1" ]; then
  echo "Metro가 120초 내에 8081을 듣기 시작하지 않았다 — $metro_log 참고"
  exit 1
fi

maestro test .maestro/ --debug-output e2e-evidence/maestro
