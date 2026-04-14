import type { Metadata, Viewport } from "next";
import Script from "next/script";
import "./globals.css";
import NavigationWrapper from "@/components/NavigationWrapper";

export const metadata: Metadata = {
  title: "K-F-C 가을 운동회 | 내 팀을 응원해!",
  description: "7일간의 팬덤 가을 운동회! 클릭하고, 달리고, 응원하며 우리 팀을 1등으로 만들어요",
  openGraph: {
    title: "K-F-C 가을 운동회 | 내 팀을 응원해!",
    description: "7일간의 팬덤 가을 운동회! 클릭하고, 달리고, 응원하며 우리 팀을 1등으로 만들어요",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: "#FF6B35",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ko">
      <head>
        <link
          rel="stylesheet"
          as="style"
          crossOrigin="anonymous"
          href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/variable/pretendardvariable-dynamic-subset.min.css"
        />
      </head>
      <body className="bg-cream text-ink antialiased">
        {process.env.NEXT_PUBLIC_ADSENSE_PUB_ID && (
          <Script
            async
            src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${process.env.NEXT_PUBLIC_ADSENSE_PUB_ID}`}
            crossOrigin="anonymous"
            strategy="afterInteractive"
          />
        )}
        <NavigationWrapper />
        {children}
      </body>
    </html>
  );
}
