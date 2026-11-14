/*
 * 문서 저장소 — expo-file-system File/Directory API로 Documents/markdown/*.md를 관리한다.
 * 동기 API(textSync/writeSync)를 쓴다: 문서 수가 작고 UI 스레드 부담이 관찰될 만큼 크지 않다.
 */
import { Directory, File, Paths } from "expo-file-system";

export const DOC_EXT = ".md";

const docsDir = new Directory(Paths.document, "markdown");

const CONTROL_OR_INVALID_CHARS = /[<>:"/\\|?*\x00-\x1f\x7f]/;
const CONTROL_OR_INVALID_CHARS_GLOBAL = /[<>:"/\\|?*\x00-\x1f\x7f]/g;
const MAX_FILENAME_BYTES = 255;

const utf8ByteLength = (text: string): number => new TextEncoder().encode(text).length;

/** 문서 이름 규칙 — .md 확장자, 숨김/점 전용/제어/금지 문자·255B 초과 차단. */
export const isValidDocName = (name: string): boolean => {
  if (!name.endsWith(DOC_EXT)) return false;
  const stem = name.slice(0, -DOC_EXT.length);
  if (!stem || stem === "." || stem === ".." || stem.startsWith(".")) return false;
  if (CONTROL_OR_INVALID_CHARS.test(name)) return false;
  return utf8ByteLength(name) <= MAX_FILENAME_BYTES;
};

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
    .filter((entry): entry is File => entry instanceof File && isValidDocName(entry.name))
    .flatMap((file): DocMeta[] => {
      try {
        const meta = file.info();
        return [
          {
            name: file.name,
            title: file.name.slice(0, -DOC_EXT.length),
            mtimeMs: meta.modificationTime ?? 0,
            preview: firstMeaningfulLine(file.textSync()),
          },
        ];
      } catch {
        return [];
      }
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

/** 제목 문자열에서 파일 이름에 안전한 문서 제목만 추린다. */
export function sanitizeDocTitle(raw: string): string {
  const cleaned = raw
    .trim()
    .replace(/\.md$/i, "")
    .replace(CONTROL_OR_INVALID_CHARS_GLOBAL, "-")
    .replace(/^\.+/, "")
    .trim();
  if (!cleaned || cleaned === "." || cleaned === "..") return "";
  return cleaned;
}

export function docNameFromTitle(raw: string): string | null {
  const title = sanitizeDocTitle(raw);
  if (!title) return null;
  const name = `${title}${DOC_EXT}`;
  return isValidDocName(name) ? name : null;
}

export function docExists(name: string): boolean {
  return docFile(name).exists;
}

export function renameDoc(
  oldName: string,
  nextRawTitle: string,
): { name: string; title: string } {
  const title = sanitizeDocTitle(nextRawTitle);
  if (!title) {
    throw new Error("문서 제목을 입력해 줘.");
  }
  const targetName = `${title}${DOC_EXT}`;
  if (targetName === oldName) {
    return { name: oldName, title };
  }
  const oldFile = docFile(oldName);
  const targetFile = docFile(targetName);
  const isCaseOnly = targetName.toLowerCase() === oldName.toLowerCase();
  const exactTargetExists =
    targetFile.exists &&
    (!isCaseOnly || docsDir.list().some((entry) => entry.name === targetName));
  if (exactTargetExists) {
    throw new Error(`같은 이름의 문서가 이미 있어: ${title}`);
  }
  if (oldFile.exists) {
    if (isCaseOnly) {
      let tmpName = `__rename_${Date.now()}${DOC_EXT}`;
      let counter = 0;
      while (new File(docsDir, tmpName).exists) {
        tmpName = `__rename_${Date.now()}_${++counter}${DOC_EXT}`;
      }
      const tmpFile = new File(docsDir, tmpName);
      oldFile.moveSync(tmpFile);
      tmpFile.moveSync(targetFile);
    } else {
      oldFile.moveSync(targetFile);
    }
  }
  return { name: targetName, title };
}

/** 목록과 겹치지 않는 새 문서 이름 — "문서 N.md" */
export function nextDocName(): string {
  ensureDocsDir();
  const titles = new Set(listDocs().map((d) => d.title));
  let i = 1;
  while (titles.has(`문서 ${i}`)) i++;
  return `문서 ${i}${DOC_EXT}`;
}
