"use client";

import { useEffect, useState } from "react";

const FALLBACK_COLORS = ["#FF6B35", "#2EC4B6", "#FFD166", "#A78BFA", "#FB7185", "#38BDF8"];

interface Particle {
  id: number;
  x: number;
  color: string;
  delay: number;
  duration: number;
  size: number;
}

/**
 * hex 색상의 relative luminance를 계산한다 (WCAG 2.1 기준).
 * 반환값 0(검정) ~ 1(흰색).
 */
function hexLuminance(hex: string): number {
  const clean = hex.replace("#", "");
  if (clean.length !== 6) return 0;

  const toLinear = (c: number) => {
    const s = c / 255;
    return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
  };

  const r = toLinear(parseInt(clean.slice(0, 2), 16));
  const g = toLinear(parseInt(clean.slice(2, 4), 16));
  const b = toLinear(parseInt(clean.slice(4, 6), 16));

  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/**
 * teamColor가 주어지면 팀 컬러 중심 5색 배합을 반환한다.
 * luminance > 0.8(매우 밝은 색)이면 금색 대신 coral을 사용해 대비를 확보한다.
 */
function buildColorPalette(teamColor?: string): string[] {
  if (!teamColor) return FALLBACK_COLORS;

  const lum = hexLuminance(teamColor);
  const accent = lum > 0.8 ? "#FF6B35" : "#FFD700"; // 밝은 팀 컬러 → coral, 그 외 → gold

  return [teamColor, teamColor, `${teamColor}99`, "#FFFFFF", accent];
}

interface ConfettiProps {
  active: boolean;
  teamColor?: string;
}

export default function Confetti({ active, teamColor }: ConfettiProps) {
  const [particles, setParticles] = useState<Particle[]>([]);

  useEffect(() => {
    if (!active) {
      setParticles([]);
      return;
    }

    const palette = buildColorPalette(teamColor);

    const newParticles: Particle[] = Array.from({ length: 30 }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      color: palette[Math.floor(Math.random() * palette.length)],
      delay: Math.random() * 2,
      duration: 2 + Math.random() * 2,
      size: 6 + Math.random() * 8,
    }));
    setParticles(newParticles);
  }, [active, teamColor]);

  if (!active || particles.length === 0) return null;

  return (
    <div className="fixed inset-0 pointer-events-none z-[100] overflow-hidden">
      {particles.map((p) => (
        <div
          key={p.id}
          className="absolute rounded-sm"
          style={{
            left: `${p.x}%`,
            top: "-2%",
            width: p.size,
            height: p.size,
            backgroundColor: p.color,
            animation: `confetti-fall ${p.duration}s ease-in ${p.delay}s forwards`,
          }}
        />
      ))}
    </div>
  );
}
