import { BlocksIndex } from "../../components/blocks/blocks-index";
import { DocsShell } from "../../components/showcase/docs-shell";

/** Blocks 목록 — /blocks. 개별 블록은 자체 레이아웃의 전체 화면(문서 셸 없음). */
export default function BlocksPage() {
  return (
    <DocsShell>
      <BlocksIndex />
    </DocsShell>
  );
}
