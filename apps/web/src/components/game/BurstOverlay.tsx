"use client";

import { motion, AnimatePresence } from "framer-motion";
import Confetti from "@/components/Confetti";

interface BurstOverlayProps {
  burstTeamName: string | null; // null이면 unmount
  showConfetti: boolean;
  teamColor?: string; // 터진 팀의 colorCode — Confetti 팀 컬러 배합에 사용
}

export default function BurstOverlay({ burstTeamName, showConfetti, teamColor }: BurstOverlayProps) {
  return (
    <>
      <Confetti active={showConfetti} teamColor={teamColor} />

      <AnimatePresence>
        {burstTeamName !== null && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none"
          >
            <motion.div
              initial={{ scale: 0, rotate: -10 }}
              animate={{ scale: 1, rotate: 0 }}
              exit={{ scale: 0, opacity: 0 }}
              transition={{ type: "spring", damping: 12, stiffness: 200 }}
              className="text-center"
            >
              <div className="text-8xl mb-4">🎊</div>
              <div className="text-4xl sm:text-6xl font-black text-white drop-shadow-[0_4px_12px_rgba(0,0,0,0.5)]">
                박 터짐!
              </div>
              <div className="text-xl sm:text-2xl font-bold text-white/90 mt-2 drop-shadow-[0_2px_8px_rgba(0,0,0,0.4)]">
                {burstTeamName}팀 목표 달성!
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
