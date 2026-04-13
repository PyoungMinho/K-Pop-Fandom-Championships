import AdSenseAd from "@/components/AdSenseAd";

// 게임 페이지: 데스크탑에서 콘텐츠 양옆에 AdSense 광고 표시
// xl(1280px) 미만(모바일/태블릿)에서는 광고 자동 숨김
export default function GameLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex justify-center gap-4 min-h-screen">
      {/* 왼쪽 광고 — xl 이상 데스크탑만 표시 */}
      <aside className="hidden xl:flex flex-col items-center gap-4 pt-24 w-[160px] shrink-0">
        <AdSenseAd
          slot={process.env.NEXT_PUBLIC_ADSENSE_SLOT_LEFT ?? "0000000000"}
          format="vertical"
          className="w-[160px] min-h-[600px]"
        />
      </aside>

      {/* 게임 콘텐츠 */}
      <div className="flex-1 min-w-0 max-w-2xl">{children}</div>

      {/* 오른쪽 광고 — xl 이상 데스크탑만 표시 */}
      <aside className="hidden xl:flex flex-col items-center gap-4 pt-24 w-[160px] shrink-0">
        <AdSenseAd
          slot={process.env.NEXT_PUBLIC_ADSENSE_SLOT_RIGHT ?? "0000000000"}
          format="vertical"
          className="w-[160px] min-h-[600px]"
        />
      </aside>
    </div>
  );
}
