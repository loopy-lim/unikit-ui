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
    "한 import로 React(웹)와 React Native에서 같은 UI — UniKit 소개와 컴포넌트 카탈로그",
  metadataBase: new URL("https://ui.unikit.ll3.kr"),
  openGraph: {
    title: "UniKit",
    description:
      "한 import로 React(웹)와 React Native에서 같은 UI — UniKit 소개와 컴포넌트 카탈로그",
    url: "https://ui.unikit.ll3.kr",
    siteName: "UniKit",
    images: [{ url: "/brand/og.png", width: 2400, height: 1350, alt: "UniKit" }],
    locale: "ko_KR",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "UniKit",
    description:
      "한 import로 React(웹)와 React Native에서 같은 UI",
    images: ["/brand/og.png"],
  },
  icons: {
    icon: [{ url: "/brand/icon-192.png", sizes: "192x192", type: "image/png" }],
    apple: [{ url: "/brand/icon-512.png", sizes: "512x512", type: "image/png" }],
  },
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
