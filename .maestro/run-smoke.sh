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

(cd apps/expo && bun x expo start --port 8081 > ../../.maestro/metro.log 2>&1 &)

# Metro가 8081을 듣기 전에 앱이 번들을 당기면 red screen이 뜬다 — /status가
# 응답한 뒤에 플로우(launchApp)를 시작한다(최대 120초 대기). 대기 실패를 그냥
# 넘기면 maestro의 launch 타임아웃으로 엉뚱하게 귀결되므로 여기서 즉시 실패시키고
# 로그로 안내한다.
metro_ready=0
for i in $(seq 1 60); do
  if curl -sf -o /dev/null http://localhost:8081/status; then metro_ready=1; break; fi
  sleep 2
done
if [ "$metro_ready" != "1" ]; then
  echo "Metro가 120초 내에 8081을 듣지 시작하지 않았다 — .maestro/metro.log 참고"
  exit 1
fi

maestro test .maestro/ --debug-output .maestro/evidence
