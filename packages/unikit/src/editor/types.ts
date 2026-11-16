/**
 * editor 렌더러 공개 타입 — `@unikit-bridge/ui/editor` 단독 진입점의 공통 계약.
 *
 * 웹(src/editor/web.tsx, tiptap 직접 마운트)과 네이티브(src/editor/native.tsx,
 * WebView + 동봉 단일 HTML 번들)가 **동일 props 인터페이스**로 마크다운 위지윅
 * 에디터를 제공한다. 엔진 계약(서식 9종·브리지 메시지)은 components/editor-toolbar
 * 가 단일 출처고, 이 진입점은 그 위에 에디터 본체를 얹는다(chart의 "엔진은
 * peerDep" 절충과 같은 결론 — @tiptap/*는 웹에서, react-native-webview는
 * 네이티브에서 선택 peer).
 *
 * 값 흐름(비제어): initialMarkdown은 마운트 시 한 번 반영하고, 이후 편집은
 * onChange(markdown)로 흘러나가기만 한다. 외부 교체는 ref.setMarkdown으로.
 */
import type { EditorCommand, EditorFormat } from "../components/editor-toolbar";

/** 툴바·소비자가 아는 에디터 상태 — onStateChange로 전달된다. */
export type MarkdownEditorState = {
  /** 네이티브: WebView 번들이 init을 마친 시점(웹은 마운트와 동시). */
  ready: boolean;
  /** 커서 위치의 활성 서식 — activeFormats 계약과 같은 값. */
  formats: EditorFormat[];
  canUndo: boolean;
  canRedo: boolean;
  /** 본문 글자 수(doc.textContent.length — 마크다운 문법 기호 제외). */
  chars: number;
};

/** ref로 노출하는 명령 — 툴바를 직접 꾸리는 소비자(toolbar={false})가 쓴다. */
export type MarkdownEditorHandle = {
  /**
   * 문서 교체(외부 파일 열기 등) — undo 히스토리를 초기화해 첫 undo가 교체
   * 이전 문서로 되돌아가지 못하게 한다. onChange는 발화하지 않는다(교체는
   * 편집이 아니므로 — 소비자는 교체 분량을 스스로 반영한다).
   */
  setMarkdown: (markdown: string) => void;
  runFormat: (format: EditorFormat) => void;
  runCommand: (command: EditorCommand) => void;
};

export type MarkdownEditorProps = {
  /** 초기 문서(마크다운) — 마운트 시 한 번만 반영한다(비제어). */
  initialMarkdown?: string;
  /** 문서 변경마다 발화 — 마크다운 직렬화 결과. */
  onChange?: (markdown: string) => void;
  /** ready·서식·undo/redo·글자수가 바뀔 때 발화. */
  onStateChange?: (state: MarkdownEditorState) => void;
  /** 플레이스홀더 문구(기본 «여기에 마크다운으로 적어 봐»). */
  placeholder?: string;
  /** 내장 EditorToolbar 표시(기본 true). false면 onStateChange+ref로 직접 꾸린다. */
  toolbar?: boolean;
  /** 편집 영역 래퍼(View) 클래스 — 토큰 클래스만. */
  className?: string;
};
