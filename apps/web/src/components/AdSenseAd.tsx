"use client";

import { useEffect, useRef } from "react";

interface Props {
  slot: string;            // AdSense 광고 슬롯 ID (숫자 문자열)
  format?: "auto" | "rectangle" | "vertical";
  className?: string;
}

declare global {
  interface Window {
    adsbygoogle: unknown[];
  }
}

export default function AdSenseAd({ slot, format = "auto", className }: Props) {
  const ref = useRef<HTMLModElement>(null);
  const pubId = process.env.NEXT_PUBLIC_ADSENSE_PUB_ID;

  useEffect(() => {
    // pubId 없으면 광고 로드 시도하지 않음
    if (!pubId || !ref.current) return;
    try {
      (window.adsbygoogle = window.adsbygoogle || []).push({});
    } catch {
      // 중복 push 등 무시
    }
  }, [pubId]);

  // 개발 환경이거나 pubId 없으면 플레이스홀더 표시
  if (!pubId) {
    return (
      <div
        className={`flex items-center justify-center bg-gray-100 border-2 border-dashed border-gray-300 rounded-xl text-gray-400 text-xs font-medium text-center p-2 ${className}`}
      >
        <div>
          <div className="text-lg mb-1">📢</div>
          <div>광고 영역</div>
          <div className="text-[10px] mt-0.5 text-gray-300">NEXT_PUBLIC_ADSENSE_PUB_ID 설정 후 활성화</div>
        </div>
      </div>
    );
  }

  return (
    <ins
      ref={ref}
      className={`adsbygoogle ${className ?? ""}`}
      style={{ display: "block" }}
      data-ad-client={pubId}
      data-ad-slot={slot}
      data-ad-format={format}
      data-full-width-responsive="true"
    />
  );
}
