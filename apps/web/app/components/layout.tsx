import type { ReactNode } from "react";

import { DocsShell } from "../../components/showcase/docs-shell";

export default function ShowcaseLayout({ children }: { children: ReactNode }) {
  return <DocsShell>{children}</DocsShell>;
}
