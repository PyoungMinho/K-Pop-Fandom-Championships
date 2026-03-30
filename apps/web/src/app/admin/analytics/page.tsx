"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { getAnalytics } from "@/lib/admin-api";

interface AnalyticsData {
  totalTeams: number;
  totalSeasons: number;
  totalClicks: number;
  totalCheers: number;
  totalBatons: number;
  cheersByTeam: { seasonTeamId: string; count: string }[];
}

export default function AnalyticsPage() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const load = () => {
    setRefreshing(true);
    getAnalytics()
      .then(setData)
      .catch(console.error)
      .finally(() => setRefreshing(false));
  };

  useEffect(() => {
    load();
    const interval = setInterval(load, 10_000); // 10초마다 갱신
    return () => clearInterval(interval);
  }, []);

  const maxCheerCount = data?.cheersByTeam
    ? Math.max(...data.cheersByTeam.map((c) => Number(c.count)), 1)
    : 1;

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-black text-ink">분석</h1>
          <p className="text-sm text-ink-muted mt-1">실시간 통계 및 참여 현황 (10초마다 자동 갱신)</p>
        </div>
        <button onClick={load} disabled={refreshing}
          className="text-sm font-semibold text-coral hover:text-coral-dark disabled:opacity-50">
          {refreshing ? "갱신 중..." : "🔄 새로고침"}
        </button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {[
          { label: "총 클릭", value: data?.totalClicks ?? 0, icon: "🎯", color: "#FF6B35" },
          { label: "응원 메시지", value: data?.totalCheers ?? 0, icon: "📣", color: "#A78BFA" },
          { label: "바통 연결", value: data?.totalBatons ?? 0, icon: "🏃‍♂️", color: "#2EC4B6" },
          { label: "등록 팀", value: data?.totalTeams ?? 0, icon: "👥", color: "#FB7185" },
        ].map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className="bg-white rounded-2xl p-5 shadow-sm"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-2xl">{stat.icon}</span>
              <div className={`w-2 h-2 rounded-full ${refreshing ? "animate-pulse" : ""}`}
                style={{ backgroundColor: stat.color }} />
            </div>
            <div className="text-3xl font-black tabular-nums" style={{ color: stat.color }}>
              {stat.value.toLocaleString()}
            </div>
            <div className="text-xs text-ink-muted font-semibold mt-1">{stat.label}</div>
          </motion.div>
        ))}
      </div>

      {/* Cheers by Team Chart */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="bg-white rounded-2xl p-6 shadow-sm"
      >
        <h3 className="font-bold text-lg mb-6">📊 팀별 응원 메시지 분포</h3>
        {data?.cheersByTeam && data.cheersByTeam.length > 0 ? (
          <div className="space-y-4">
            {data.cheersByTeam.map((team, i) => {
              const count = Number(team.count);
              const percent = (count / maxCheerCount) * 100;
              return (
                <div key={team.seasonTeamId} className="flex items-center gap-4">
                  <span className="text-sm font-semibold text-ink-muted w-20 truncate">
                    {team.seasonTeamId}
                  </span>
                  <div className="flex-1 h-8 bg-gray-100 rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${percent}%` }}
                      transition={{ delay: 0.3 + i * 0.05, duration: 0.6 }}
                      className="h-full rounded-full flex items-center justify-end pr-3"
                      style={{
                        background: `linear-gradient(90deg, #FF6B35${i % 2 === 0 ? "" : "CC"}, #FB7185)`,
                      }}
                    >
                      <span className="text-xs font-bold text-white">{count}</span>
                    </motion.div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-8 text-ink-muted text-sm">아직 데이터가 없습니다</div>
        )}
      </motion.div>
    </div>
  );
}
