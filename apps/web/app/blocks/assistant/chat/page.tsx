/**
 * 데모 앱 어시스턴트 화면(웹) — /blocks/assistant/chat?q=… 로 들어오면
 * 그 질문으로 대화를 자동 시작한다. useSearchParams는 정적 내보내기에서
 * 사전 렌더를 건너뛰므로 Suspense로 감싼다.
 */
import { Suspense } from "react";

import { AssistantScreen } from "../../../../components/blocks/assistant-screen";

export default function AssistantChatPage() {
  return (
    <Suspense fallback={null}>
      <AssistantScreen />
    </Suspense>
  );
}
