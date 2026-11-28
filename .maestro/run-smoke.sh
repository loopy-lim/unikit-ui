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

# 번들 예열 — 차가운 Metro 첫 빌드(40~60초)를 앱이 기다리지 않게 먼저 돌린다.
# dev client의 번들 요청은 타임아웃이 있어, 빌드 완료 전에 연결이 끊기면
# loadJSBundleFromAssets 폴백 에러 화면으로 빠진다(실행 46129776499 — 두 플로우
# 모두 첫 어설션 "UniKit UI"에서 사망, metro.log에는 번들 완료 기록만 남음).
# 예열 후 앱은 캐시에서 즉시 받으므로 타임아웃 압박이 사라진다.
# URL은 앱이 실제로 요청하는 엔트리를 그대로 쓴다 — 워크스페이스 호이스팅으로
# /index.bundle은 루트 ./index를 찾다 404 난다(UnableToResolveError 실증).
echo "번들 예열 중(차가운 첫 빌드)..."
if ! curl -sf -o /dev/null --max-time 300 \
  "http://localhost:8081/node_modules/expo-router/entry.bundle?platform=android&dev=true&hot=false&lazy=true&transform.engine=hermes&transform.routerModule=expo-router%2Fentry&app=com.anonymous.unikitexpo"; then
  echo "번들 예열 실패 — $metro_log 참고"
  exit 1
fi
echo "번들 예열 완료"

maestro_rc=0
maestro test .maestro/ --debug-output e2e-evidence/maestro || maestro_rc=$?

# 실패 원인 판독용 증거 보강(실패 시에도 업로드된다):
#  - maestro가 --debug-output 외에 점 디렉터리 .maestro/tests/<ts>/에 남기는
#    단계별 스크린샷을 증거 디렉터리로 복사(upload-artifact v4는 점 디렉터리
#    미탐색 — 실행 46129776499에서 스크린샷이 전부 누락된 원인)
#  - 최종 화면 스크린샷 + 접근성 트리 + logcat — 앱이 어느 화면에서
#    멈춰 있었는지 기계적으로 판독한다
if [ "$maestro_rc" != "0" ]; then
  cp -r .maestro/tests e2e-evidence/maestro-tests 2>/dev/null || true
  adb exec-out screencap -p > e2e-evidence/final-screen.png 2>/dev/null || true
  adb shell uiautomator dump /sdcard/e2e-dump.xml >/dev/null 2>&1 || true
  adb shell cat /sdcard/e2e-dump.xml > e2e-evidence/final-hierarchy.xml 2>/dev/null || true
  adb logcat -d > e2e-evidence/logcat.txt 2>/dev/null || true
fi
exit "$maestro_rc"
