import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "UniKit",
  description:
    "React(웹)와 React Native에서 같은 컴포넌트, 같은 모습 — 유니버설 UI 쇼케이스",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="ko">
      <body>{children}</body>
    </html>
  );
}
