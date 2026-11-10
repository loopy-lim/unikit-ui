import type { Metadata } from "next";
import { IBM_Plex_Mono, Public_Sans, Syne } from "next/font/google";
import "./globals.css";
import "./site.css";

const syne = Syne({
  subsets: ["latin"],
  variable: "--font-site-display",
  display: "swap",
});

const publicSans = Public_Sans({
  subsets: ["latin"],
  variable: "--font-site-sans",
  display: "swap",
});

const ibmPlexMono = IBM_Plex_Mono({
  weight: ["400", "500"],
  subsets: ["latin"],
  variable: "--font-site-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: "UniKit",
  description:
    "한 import로 React(웹)와 React Native에서 같은 UI — UniKit 소개와 쇼케이스",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="ko"
      className={`${syne.variable} ${publicSans.variable} ${ibmPlexMono.variable}`}
    >
      <body className="site-body antialiased">{children}</body>
    </html>
  );
}
