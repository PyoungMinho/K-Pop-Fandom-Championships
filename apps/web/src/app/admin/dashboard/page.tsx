"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { getAnalytics } from "@/lib/admin-api";

interface TeamRanking {
  teamId: string;
  teamName: string;
  shortName: string;
  colorCode: string;
  totalCheers: number;
  totalClicks: number;
  totalBatons: number;
}

interface Analytics {
  totalTeams: number;
  totalSeasons: number;
  totalClicks: number;
  totalCheers: number;
  totalBatons: number;
  teamRankings?: TeamRanking[];
}

const STAT_CARDS = [
  { key: "totalTeams", label: "등록 팀", icon: "👥", color: "#FF6B35", bg: "bg-orange-50" },
  { key: "totalClicks", label: "총 클릭", icon: "🎯", color: "#2EC4B6", bg: "bg-teal-50" },
  { key: "totalCheers", label: "응원 메시지", icon: "📣", color: "#A78BFA", bg: "bg-violet-50" },
  { key: "totalBatons", label: "바통 연결", icon: "🏃", color: "#FB7185", bg: "bg-rose-50" },
  { key: "totalSeasons", label: "시즌", icon: "🗓️", color: "#38BDF8", bg: "bg-sky-50" },
];

const QUICK_ACTIONS = [
  { href: "/admin/teams", label: "팀 관리", icon: "👥", desc: "팀 추가/수정/삭제" },
  { href: "/admin/seasons", label: "시즌 관리", icon: "🗓️", desc: "시즌 생성/팀 배정" },
  { href: "/admin/moderation", label: "응원 관리", icon: "🛡️", desc: "메시지 검토/삭제" },
  { href: "/admin/game-events", label: "게임 이벤트", icon: "🎮", desc: "이벤트 생성/관리" },
];

function useCountUp(target: number, duration = 1200) {
  const [count, setCount] = useState(0);
  const frameRef = useRef<number>(0);
  const startRef = useRef<number | null>(null);

  useEffect(() => {
    if (target === 0) { setCount(0); return; }
    startRef.current = null;

    const step = (timestamp: number) => {
      if (startRef.current === null) startRef.current = timestamp;
      const elapsed = timestamp - startRef.current;
      const progress = Math.min(elapsed / duration, 1);
      // easeOutExpo
      const eased = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress);
      setCount(Math.round(eased * target));
      if (progress < 1) {
        frameRef.current = requestAnimationFrame(step);
      }
    };

    frameRef.current = requestAnimationFrame(step);
    return () => cancelAnimationFrame(frameRef.current);
  }, [target, duration]);

  return count;
}

function StatCard({
  card,
  value,
  index,
}: {
  card: (typeof STAT_CARDS)[0];
  value: number;
  index: number;
}) {
  const count = useCountUp(value, 1000 + index * 100);

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.07, type: "spring", stiffness: 200, damping: 20 }}
      className={`bg-white rounded-2xl p-5 shadow-sm border border-gray-100 overflow-hidden relative`}
    >
      <div
        className={`absolute top-0 right-0 w-20 h-20 rounded-full opacity-10 translate-x-6 -translate-y-6`}
        style={{ backgroundColor: card.color }}
      />
      <div className="text-2xl mb-2">{card.icon}</div>
      <div
        className="text-2xl font-black tabular-nums"
        style={{ color: card.color }}
      >
        {count.toLocaleString()}
      </div>
      <div className="text-xs text-ink-muted font-semibold mt-1">{card.label}</div>
    </motion.div>
  );
}

function TeamRankingBar({
  ranking,
  max,
  index,
}: {
  ranking: TeamRanking;
  max: number;
  index: number;
}) {
  const pct = max > 0 ? (ranking.totalCheers / max) * 100 : 0;

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: 0.3 + index * 0.08 }}
      className="flex items-center gap-3"
    >
      <div className="w-6 text-center text-xs font-bold text-ink-muted">
        {index + 1}
      </div>
      <div
        className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-xs font-bold shrink-0"
        style={{
          background: `linear-gradient(135deg, ${ranking.colorCode}, ${ranking.colorCode}CC)`,
        }}
      >
        {ranking.shortName}
      </div>
      <div className="flex-1">
        <div className="flex items-center justify-between mb-1">
          <span className="text-xs font-semibold text-ink truncate max-w-[120px]">
            {ranking.teamName}
          </span>
          <span className="text-xs font-bold tabular-nums" style={{ color: ranking.colorCode }}>
            {ranking.totalCheers.toLocaleString()}
          </span>
        </div>
        <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${pct}%` }}
            transition={{ delay: 0.4 + index * 0.08, duration: 0.8, ease: "easeOut" }}
            className="h-full rounded-full"
            style={{
              background: `linear-gradient(90deg, ${ranking.colorCode}, ${ranking.colorCode}AA)`,
            }}
          />
        </div>
      </div>
    </motion.div>
  );
}

export default function DashboardPage() {
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    getAnalytics()
      .then((data) => {
        setAnalytics(data as Analytics);
        setError(null);
      })
      .catch((err) => setError(err.message || "데이터 로드 실패"))
      .finally(() => setLoading(false));
  }, []);

  const teamRankings = analytics?.teamRankings ?? [];
  const maxCheers = teamRankings.reduce(
    (acc, t) => Math.max(acc, t.totalCheers),
    0
  );

  return (
    <div>
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <h1 className="text-2xl font-black text-ink">대시보드</h1>
        <p className="text-sm text-ink-muted mt-1">
          K-F-C 전체 현황을 한눈에 확인하세요
        </p>
      </motion.div>

      {/* Error */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="mb-6 px-4 py-3 rounded-xl bg-red-50 border border-red-100 text-red-500 text-sm font-medium"
          >
            ⚠️ {error}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 mb-8">
        {STAT_CARDS.map((card, i) => (
          <StatCard
            key={card.key}
            card={card}
            value={
              loading
                ? 0
                : (analytics?.[card.key as keyof Analytics] as number) ?? 0
            }
            index={i}
          />
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Team Cheer Ranking */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
          className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100"
        >
          <h2 className="text-base font-bold text-ink mb-5">팀별 응원 랭킹</h2>
          {loading ? (
            <div className="space-y-4">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="flex items-center gap-3 animate-pulse">
                  <div className="w-6 h-4 bg-gray-100 rounded" />
                  <div className="w-8 h-8 bg-gray-100 rounded-lg" />
                  <div className="flex-1">
                    <div className="h-3 bg-gray-100 rounded w-1/3 mb-2" />
                    <div className="h-2 bg-gray-100 rounded w-full" />
                  </div>
                </div>
              ))}
            </div>
          ) : teamRankings.length === 0 ? (
            <div className="text-center py-8 text-ink-muted text-sm">
              <div className="text-3xl mb-2">📊</div>
              아직 팀 데이터가 없습니다
            </div>
          ) : (
            <div className="space-y-4">
              {teamRankings
                .slice()
                .sort((a, b) => b.totalCheers - a.totalCheers)
                .map((r, i) => (
                  <TeamRankingBar
                    key={r.teamId}
                    ranking={r}
                    max={maxCheers}
                    index={i}
                  />
                ))}
            </div>
          )}
        </motion.div>

        {/* Activity Summary */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100"
        >
          <h2 className="text-base font-bold text-ink mb-5">활동 요약</h2>
          {loading ? (
            <div className="space-y-4 animate-pulse">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="flex items-center justify-between">
                  <div className="h-4 bg-gray-100 rounded w-1/3" />
                  <div className="h-4 bg-gray-100 rounded w-1/4" />
                </div>
              ))}
            </div>
          ) : (
            <div className="space-y-3">
              {[
                {
                  label: "클릭 게임 참여",
                  value: analytics?.totalClicks ?? 0,
                  icon: "🎯",
                  color: "#2EC4B6",
                },
                {
                  label: "응원 메시지",
                  value: analytics?.totalCheers ?? 0,
                  icon: "📣",
                  color: "#A78BFA",
                },
                {
                  label: "바통 릴레이",
                  value: analytics?.totalBatons ?? 0,
                  icon: "🏃",
                  color: "#FB7185",
                },
              ].map((item, i) => (
                <motion.div
                  key={item.label}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.35 + i * 0.07 }}
                  className="flex items-center justify-between p-3 rounded-xl bg-gray-50"
                >
                  <div className="flex items-center gap-2">
                    <span className="text-lg">{item.icon}</span>
                    <span className="text-sm font-medium text-ink-light">
                      {item.label}
                    </span>
                  </div>
                  <span
                    className="text-sm font-black tabular-nums"
                    style={{ color: item.color }}
                  >
                    {item.value.toLocaleString()}
                  </span>
                </motion.div>
              ))}
            </div>
          )}
        </motion.div>
      </div>

      {/* Quick Actions */}
      <h2 className="text-lg font-bold text-ink mb-4">빠른 액션</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {QUICK_ACTIONS.map((action, i) => (
          <motion.div
            key={action.href}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 + i * 0.06 }}
          >
            <Link
              href={action.href}
              className="block bg-white rounded-2xl p-5 shadow-sm border border-gray-100 hover:shadow-md hover:border-coral/20 transition-all group"
            >
              <div className="text-3xl mb-3">{action.icon}</div>
              <div className="font-bold text-ink group-hover:text-coral transition-colors">
                {action.label}
              </div>
              <div className="text-xs text-ink-muted mt-1">{action.desc}</div>
            </Link>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
