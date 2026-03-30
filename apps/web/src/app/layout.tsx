import type { Metadata, Viewport } from "next";
import "./globals.css";
import NavigationWrapper from "@/components/NavigationWrapper";

export const metadata: Metadata = {
  title: "아이돌 팬덤 대회",
  description: "팬덤의 화력을 건강하게 증명하는 7일간의 축제",
  openGraph: {
    title: "아이돌 팬덤 대회",
    description: "팬덤의 화력을 건강하게 증명하는 7일간의 축제",
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
        <NavigationWrapper />
        {children}
      </body>
    </html>
  );
}
