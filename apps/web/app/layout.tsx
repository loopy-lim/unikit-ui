import type { Metadata } from "next";
import { IBM_Plex_Mono, Public_Sans, Syne } from "next/font/google";
import "./globals.css";
import "./site.css";

import { SiteThemeProvider } from "../components/site/site-theme";

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

const THEME_INIT_SCRIPT = `(function(){try{var d=document.documentElement;var s=localStorage.getItem("unikit-color-scheme");if(s==="dark"){d.classList.add("dark");}var r=localStorage.getItem("unikit-theme-radius");if(r==="0rem"||r==="0.3rem"||r==="0.5rem"||r==="0.75rem"||r==="1rem"){d.style.setProperty("--radius",r);}}catch(e){}})();`;

export const metadata: Metadata = {
  title: "UniKit",
  description:
    "한 import로 React(웹)와 React Native에서 같은 UI — UniKit 소개와 컴포넌트 카탈로그",
  metadataBase: new URL("https://ui.ll3.kr"),
  openGraph: {
    title: "UniKit",
    description:
      "한 import로 React(웹)와 React Native에서 같은 UI — UniKit 소개와 컴포넌트 카탈로그",
    url: "https://ui.ll3.kr",
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
      suppressHydrationWarning
      className={`${syne.variable} ${publicSans.variable} ${ibmPlexMono.variable}`}
    >
      <body className="site-body antialiased">
        <script dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT }} />
        <SiteThemeProvider>{children}</SiteThemeProvider>
      </body>
    </html>
  );
}
