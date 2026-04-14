"use client";

import { motion, AnimatePresence, type Variants, type Easing } from "framer-motion";

interface ComboIndicatorProps {
  combo: number;
  multiplier: number;
  teamColor: string;
}

/* multiplier 단계별 텍스트 크기 + scale 설정 */
function getMultiplierStyle(multiplier: number): {
  textClass: string;
  scale: number;
  shake: boolean;
  strongShake: boolean;
} {
  if (multiplier >= 4) {
    return { textClass: "text-2xl", scale: 1.3, shake: false, strongShake: true };
  }
  if (multiplier >= 3) {
    return { textClass: "text-2xl", scale: 1.2, shake: true, strongShake: false };
  }
  if (multiplier >= 2) {
    return { textClass: "text-xl", scale: 1.1, shake: false, strongShake: false };
  }
  return { textClass: "text-lg", scale: 1.0, shake: false, strongShake: false };
}

const EASE_IN_OUT: Easing = "easeInOut";

/* 진동 keyframes variants */
const shakeVariants: Variants = {
  shake: {
    x: [0, -4, 4, -4, 4, 0],
    transition: { repeat: Infinity, duration: 0.4, ease: EASE_IN_OUT },
  },
  strongShake: {
    x: [0, -6, 6, -6, 6, 0],
    y: [0, -2, 2, -2, 2, 0],
    transition: { repeat: Infinity, duration: 0.25, ease: EASE_IN_OUT },
  },
  idle: { x: 0, y: 0 },
};

export default function ComboIndicator({ combo, multiplier, teamColor }: ComboIndicatorProps) {
  const { textClass, scale, shake, strongShake } = getMultiplierStyle(multiplier);

  /* 팀컬러 glow (multiplier 4x 전용) */
  const glowStyle =
    multiplier >= 4
      ? { filter: `drop-shadow(0 0 8px ${teamColor}) drop-shadow(0 0 16px ${teamColor}80)` }
      : {};

  return (
    <AnimatePresence>
      {combo >= 5 && (
        <motion.div
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{
            opacity: 1,
            scale,
            ...(shake && !strongShake ? { x: [0, -4, 4, -4, 4, 0] } : {}),
          }}
          exit={{ opacity: 0, scale: 0.5 }}
          transition={{ duration: 0.2 }}
          className={`mb-4 px-4 py-2 rounded-full font-black text-white ${textClass}`}
          style={{
            background: `var(--team-secondary, ${teamColor}33)`,
            color: `var(--team-primary, ${teamColor})`,
            boxShadow: `0 4px 20px ${teamColor}50`,
            border: `2px solid ${teamColor}66`,
            ...glowStyle,
          }}
        >
          <motion.span
            variants={shakeVariants}
            animate={strongShake ? "strongShake" : shake ? "shake" : "idle"}
            style={{ display: "inline-block" }}
          >
            {combo >= 50
              ? "🔥 ULTRA COMBO! "
              : combo >= 20
                ? "⚡ SUPER COMBO! "
                : "✨ COMBO! "}
            x{combo}
          </motion.span>

          {/* multiplier >= 2일 때 보너스 배지 표시 */}
          {multiplier >= 2 && (
            <motion.span
              initial={{ opacity: 0, x: 6 }}
              animate={{ opacity: 1, x: 0 }}
              className="ml-2 text-yellow-300 font-black"
            >
              → {multiplier}x 보너스!
            </motion.span>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
