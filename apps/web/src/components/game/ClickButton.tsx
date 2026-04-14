"use client";

import { motion, AnimatePresence } from "framer-motion";

interface FloatingScore {
  id: number;
  x: number;
  y: number;
  multiplier?: number;
}

interface ClickButtonProps {
  teamColor: string;
  combo: number;
  multiplier: number;
  isBurst: boolean;
  myTotal: number;
  ripples: Array<{ id: number; x: number; y: number }>;
  floatingScores: FloatingScore[];
  onClick: (e: React.MouseEvent<HTMLButtonElement>) => void;
}

export default function ClickButton({
  teamColor,
  combo,
  multiplier,
  isBurst,
  myTotal,
  ripples,
  floatingScores,
  onClick,
}: ClickButtonProps) {
  return (
    <button
      onClick={onClick}
      disabled={isBurst}
      className="relative w-48 h-48 sm:w-56 sm:h-56 rounded-full cursor-pointer select-none active:scale-95 transition-transform disabled:opacity-50 disabled:cursor-not-allowed"
      style={{
        background: isBurst
          ? "linear-gradient(135deg, #FFD166, #FB7185)"
          : `linear-gradient(135deg, ${teamColor}, ${teamColor}DD)`,
        boxShadow:
          combo >= 10
            ? `0 0 ${20 + combo}px ${teamColor}80, 0 8px 32px ${teamColor}40`
            : `0 8px 32px ${teamColor}40`,
        animation: combo >= 10 && !isBurst ? "pulse-glow 1s infinite" : undefined,
      }}
    >
      {/* Ripple effects */}
      {ripples.map((r) => (
        <span
          key={r.id}
          className="click-ripple"
          style={{
            left: r.x - 60,
            top: r.y - 60,
            background: "rgba(255,255,255,0.3)",
          }}
        />
      ))}

      {/* Floating scores — multiplier >= 2이면 "+Nx" yellow-300, text-xl */}
      <AnimatePresence>
        {floatingScores.map((f) => {
          const isBonus = (f.multiplier ?? 1) >= 2;
          return (
            <motion.span
              key={f.id}
              initial={{ opacity: 1, y: 0, scale: 1 }}
              animate={{ opacity: 0, y: -60, scale: 1.5 }}
              exit={{ opacity: 0 }}
              className={`absolute font-black pointer-events-none ${
                isBonus ? "text-yellow-300 text-xl" : "text-white text-lg"
              }`}
              style={{ left: f.x - 10, top: f.y - 20 }}
            >
              {isBonus ? `+${f.multiplier}x` : "+1"}
            </motion.span>
          );
        })}
      </AnimatePresence>

      <div className="flex flex-col items-center text-white">
        {isBurst ? (
          <>
            <span className="text-4xl sm:text-5xl">🎊</span>
            <span className="text-xl font-black mt-1">완료!</span>
          </>
        ) : (
          <>
            <span className="text-5xl sm:text-6xl font-black">TAP!</span>
            {multiplier >= 2 && (
              <span className="text-sm font-black text-yellow-300 mt-0.5">
                x{multiplier} BONUS
              </span>
            )}
            <span className="text-lg font-bold opacity-80 mt-1">
              {myTotal.toLocaleString()}
            </span>
          </>
        )}
      </div>
    </button>
  );
}
