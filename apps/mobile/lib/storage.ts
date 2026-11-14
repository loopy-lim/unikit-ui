/*
 * 문서 저장소 — expo-file-system File/Directory API로 Documents/markdown/*.md를 관리한다.
 * 동기 API(textSync/writeSync)를 쓴다: 문서 수가 작고 UI 스레드 부담이 관찰될 만큼 크지 않다.
 */
import { Directory, File, Paths } from "expo-file-system";

export const DOC_EXT = ".md";

const docsDir = new Directory(Paths.document, "markdown");

/** 문서 이름 규칙 — 확장자 .md, 경로 구분자 없음. 딥링크 파라미터 검증에도 쓴다. */
export const isValidDocName = (name: string): boolean =>
  name.endsWith(DOC_EXT) && !name.includes("/") && !name.includes("\\");

const docFile = (name: string): File => {
  if (!isValidDocName(name)) {
    throw new Error(`잘못된 문서 이름: ${name}`);
  }
  return new File(docsDir, name);
};

export function ensureDocsDir(): void {
  if (!docsDir.exists) {
    docsDir.create();
  }
}

export type DocMeta = {
  name: string;
  title: string;
  mtimeMs: number;
  preview: string;
};

const firstMeaningfulLine = (text: string): string => {
  for (const line of text.split("\n")) {
    const trimmed = line.trim().replace(/^#+\s*/, "");
    if (trimmed) return trimmed.slice(0, 80);
  }
  return "";
};

export function listDocs(): DocMeta[] {
  ensureDocsDir();
  return docsDir
    .list()
    .filter((entry): entry is File => entry instanceof File && entry.name.endsWith(DOC_EXT))
    .map((file) => {
      const meta = file.info();
      return {
        name: file.name,
        title: file.name.slice(0, -DOC_EXT.length),
        mtimeMs: meta.modificationTime ?? 0,
        preview: firstMeaningfulLine(file.textSync()),
      };
    })
    .sort((a, b) => b.mtimeMs - a.mtimeMs);
}

export function readDoc(name: string): string | null {
  const file = docFile(name);
  return file.exists ? file.textSync() : null;
}

export function writeDoc(name: string, content: string): void {
  ensureDocsDir();
  docFile(name).writeSync(content);
}

export function deleteDoc(name: string): void {
  const file = docFile(name);
  if (file.exists) {
    file.delete();
  }
}

/** 목록과 겹치지 않는 새 문서 이름 — "문서 N.md" */
export function nextDocName(): string {
  ensureDocsDir();
  const titles = new Set(listDocs().map((d) => d.title));
  let i = 1;
  while (titles.has(`문서 ${i}`)) i++;
  return `문서 ${i}${DOC_EXT}`;
}
