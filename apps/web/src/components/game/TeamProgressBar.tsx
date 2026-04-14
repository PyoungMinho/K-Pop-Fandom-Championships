"use client";

import { motion } from "framer-motion";
import { type SeasonTeamInfo } from "@/lib/public-api";
import TeamLogo from "@/components/TeamLogo";

interface TeamProgressBarProps {
  teams: Array<SeasonTeamInfo & { total: number; isBurst: boolean }>;
  goal: number;
  selectedTeamId: string | null;
  onlineCount: number;
  gameEventId: string;
}

export default function TeamProgressBar({
  teams,
  goal,
  selectedTeamId,
  onlineCount,
}: TeamProgressBarProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1 }}
      className="card-game mb-6"
    >
      <h3 className="font-bold mb-4 flex items-center gap-2">
        <span>🏆</span> 박 터트리기 현황
        {onlineCount > 0 && (
          <span className="ml-auto flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white border border-gray-100 shadow-sm text-xs font-semibold text-ink-light">
            <span
              className="inline-block w-2 h-2 rounded-full pulse-dot"
              style={{ backgroundColor: "var(--team-primary)" }}
            />
            {onlineCount.toLocaleString()}명 참여 중
          </span>
        )}
      </h3>
      <div className="space-y-3">
        {teams.map((t, i) => {
          const percent = Math.min((t.total / goal) * 100, 100);
          const isSelected = t.teamId === selectedTeamId;
          return (
            <div key={t.id}>
              <div className="flex items-center gap-3 mb-1.5">
                <span className="w-5 text-center font-bold text-sm text-ink-muted">
                  {i + 1}
                </span>
                <TeamLogo
                  name={t.name}
                  shortName={t.shortName}
                  colorCode={t.colorCode}
                  size="sm"
                />
                <span
                  className={`text-sm font-semibold flex-1 truncate ${
                    isSelected ? "text-ink" : "text-ink-light"
                  }`}
                >
                  {t.name}
                  {isSelected && (
                    <span
                      className="ml-1.5 text-xs px-1.5 py-0.5 rounded-full font-bold"
                      style={{
                        backgroundColor: "var(--team-light)",
                        color: "var(--team-primary)",
                      }}
                    >
                      MY
                    </span>
                  )}
                  {t.isBurst && (
                    <span className="ml-1.5 text-xs bg-sunny/20 text-sunny-dark px-1.5 py-0.5 rounded-full">
                      🎊 터짐!
                    </span>
                  )}
                </span>
                <span className="text-sm font-bold tabular-nums whitespace-nowrap">
                  {t.total.toLocaleString()} / {goal.toLocaleString()}
                </span>
              </div>
              {/* 게이지 바 */}
              <div className="ml-8 h-3 bg-gray-100 rounded-full overflow-hidden relative">
                <motion.div
                  className="h-full rounded-full relative overflow-hidden"
                  style={{ backgroundColor: t.colorCode }}
                  animate={{ width: `${percent}%` }}
                  transition={{ duration: 0.3, ease: "easeOut" }}
                >
                  {/* 쉬머 효과 */}
                  <div
                    className="absolute inset-0"
                    style={{
                      background:
                        "linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.3) 50%, transparent 100%)",
                      animation: "shimmer 2s infinite",
                    }}
                  />
                </motion.div>
                {/* 목표선 */}
                {percent < 100 && (
                  <div className="absolute right-0 top-0 bottom-0 w-0.5 bg-ink/20" />
                )}
              </div>
              <div className="ml-8 mt-0.5 text-xs text-ink-muted text-right">
                {percent.toFixed(1)}%
              </div>
            </div>
          );
        })}
      </div>
    </motion.div>
  );
}
