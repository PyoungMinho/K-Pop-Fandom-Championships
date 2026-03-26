import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "아이돌 가을 운동회",
  description: "팬덤의 화력을 건강하게 증명하는 7일간의 축제",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ko">
      <body className="bg-white text-gray-900 antialiased">{children}</body>
    </html>
  );
}
