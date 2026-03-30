"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { MOCK_SCOREBOARD, MOCK_SEASON } from "@/lib/mock-data";
import TeamLogo from "@/components/TeamLogo";

function Podium() {
  const top3 = MOCK_SCOREBOARD.slice(0, 3);
  if (top3.length < 3) return null;

  const podiumOrder = [top3[1], top3[0], top3[2]];
  const heights = ["h-28", "h-40", "h-20"];
  const positions = ["2nd", "1st", "3rd"];
  const crowns = ["🥈", "🥇", "🥉"];

  return (
    <div className="flex items-end justify-center gap-3 sm:gap-4 mt-8">
      {podiumOrder.map((entry, i) => (
        <motion.div
          key={entry.teamId}
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 + i * 0.15, type: "spring", bounce: 0.3 }}
          className="flex flex-col items-center"
        >
          {/* Team Avatar + Crown */}
          <div className="relative mb-3">
            <TeamLogo
              name={entry.teamName}
              shortName={entry.shortName}
              colorCode={entry.colorCode}
              size={i === 1 ? "xl" : "lg"}
            />
            <motion.span
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.6 + i * 0.1, type: "spring", bounce: 0.5 }}
              className="absolute -top-3 -right-1 text-2xl"
            >
              {crowns[i]}
            </motion.span>
          </div>

          <span className="font-bold text-sm mb-0.5">{entry.teamName}</span>
          <span className="text-xs text-ink-muted font-semibold tabular-nums">
            {entry.totalScore.toLocaleString()} pts
          </span>

          {/* Podium bar */}
          <motion.div
            initial={{ height: 0 }}
            animate={{ height: "auto" }}
            transition={{ delay: 0.5 + i * 0.1, duration: 0.5 }}
            className={`${heights[i]} w-20 sm:w-28 mt-3 rounded-t-2xl flex items-start justify-center pt-3`}
            style={{
              background: `linear-gradient(180deg, ${entry.colorCode}, ${entry.colorCode}88)`,
            }}
          >
            <span className="text-white font-black text-lg">{positions[i]}</span>
          </motion.div>
        </motion.div>
      ))}
    </div>
  );
}

export default function ScoreboardPage() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  const maxScore = MOCK_SCOREBOARD[0]?.totalScore || 1;

  return (
    <main className="min-h-screen pb-24 md:pb-8 pt-20">
      <div className="max-w-3xl mx-auto px-4 sm:px-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center"
        >
          <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-sunny/20 rounded-full mb-3">
            <span className="text-sm">🏆</span>
            <span className="text-sm font-bold text-amber-700">스코어보드</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-black">
            실시간 <span className="gradient-text">팀 순위</span>
          </h1>
          <p className="text-ink-muted mt-2">{MOCK_SEASON.title} • DAY 5</p>
        </motion.div>

        {/* Podium */}
        <Podium />

        {/* Full Rankings */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="mt-10 space-y-3"
        >
          <h2 className="text-lg font-bold mb-4">전체 순위</h2>

          {MOCK_SCOREBOARD.map((entry, i) => (
            <motion.div
              key={entry.teamId}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.6 + i * 0.08 }}
              className="card flex items-center gap-4 py-4"
            >
              {/* Rank */}
              <div
                className={`w-10 h-10 rounded-xl flex items-center justify-center font-black text-sm ${
                  i === 0
                    ? "bg-amber-100 text-amber-700"
                    : i === 1
                    ? "bg-gray-100 text-gray-600"
                    : i === 2
                    ? "bg-orange-50 text-orange-600"
                    : "bg-gray-50 text-gray-400"
                }`}
              >
                {entry.rank}
              </div>

              {/* Team */}
              <TeamLogo
                name={entry.teamName}
                shortName={entry.shortName}
                colorCode={entry.colorCode}
                size="md"
              />

              {/* Info + Score Bar */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="font-bold truncate">{entry.teamName}</span>
                  <span className="font-bold tabular-nums text-lg">
                    {entry.totalScore.toLocaleString()}
                  </span>
                </div>
                <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
                  <motion.div
                    className="h-full rounded-full"
                    style={{ backgroundColor: entry.colorCode }}
                    initial={{ width: 0 }}
                    animate={{ width: `${(entry.totalScore / maxScore) * 100}%` }}
                    transition={{ delay: 0.8 + i * 0.1, duration: 0.6, ease: "easeOut" }}
                  />
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>

        {/* Score Breakdown */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mt-10 card-game"
        >
          <h3 className="font-bold mb-4 flex items-center gap-2">
            <span>📊</span> 점수 구성
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { label: "클릭 대전", icon: "🎯", pct: "45%", color: "coral" },
              { label: "바톤 릴레이", icon: "🏃", pct: "25%", color: "mint" },
              { label: "응원 게시판", icon: "📣", pct: "20%", color: "lavender" },
              { label: "핫타임", icon: "⚡", pct: "10%", color: "sunny" },
            ].map((item) => (
              <div key={item.label} className="text-center p-3 bg-gray-50 rounded-xl">
                <div className="text-2xl mb-1">{item.icon}</div>
                <div className="text-xl font-black" style={{ color: `var(--color-${item.color})` }}>
                  {item.pct}
                </div>
                <div className="text-xs text-ink-muted font-medium mt-0.5">{item.label}</div>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </main>
  );
}
