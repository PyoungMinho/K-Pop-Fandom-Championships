"use client";

interface TeamLogoProps {
  name: string;
  shortName: string;
  colorCode: string;
  size?: "sm" | "md" | "lg" | "xl";
}

const SIZE_MAP = {
  sm: "w-8 h-8 text-xs",
  md: "w-12 h-12 text-sm",
  lg: "w-16 h-16 text-lg",
  xl: "w-24 h-24 text-2xl",
};

export default function TeamLogo({ shortName, colorCode, size = "md" }: TeamLogoProps) {
  return (
    <div
      className={`${SIZE_MAP[size]} rounded-2xl flex items-center justify-center font-black text-white shadow-lg`}
      style={{
        background: `linear-gradient(135deg, ${colorCode}, ${colorCode}CC)`,
        boxShadow: `0 4px 14px ${colorCode}40`,
      }}
    >
      {shortName}
    </div>
  );
}
