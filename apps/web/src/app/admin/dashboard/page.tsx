"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { getAnalytics } from "@/lib/admin-api";

interface Analytics {
  totalTeams: number;
  totalSeasons: number;
  totalClicks: number;
  totalCheers: number;
  totalBatons: number;
}

const STAT_CARDS = [
  { key: "totalTeams", label: "등록 팀", icon: "👥", color: "#FF6B35" },
  { key: "totalClicks", label: "총 클릭", icon: "🎯", color: "#2EC4B6" },
  { key: "totalCheers", label: "응원 메시지", icon: "📣", color: "#A78BFA" },
  { key: "totalBatons", label: "바통 연결", icon: "🏃‍♂️", color: "#FB7185" },
  { key: "totalSeasons", label: "시즌", icon: "🗓️", color: "#38BDF8" },
];

const QUICK_ACTIONS = [
  { href: "/admin/teams", label: "팀 관리", icon: "👥", desc: "팀 추가/수정/삭제" },
  { href: "/admin/moderation", label: "응원 관리", icon: "🛡️", desc: "메시지 검토/삭제" },
  { href: "/admin/settings", label: "설정", icon: "⚙️", desc: "우승 노래, 배너" },
  { href: "/admin/game-events", label: "게임 이벤트", icon: "🎮", desc: "이벤트 생성/관리" },
];

export default function DashboardPage() {
  const [analytics, setAnalytics] = useState<Analytics | null>(null);

  useEffect(() => {
    getAnalytics().then(setAnalytics).catch(console.error);
  }, []);

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-black text-ink">대시보드</h1>
        <p className="text-sm text-ink-muted mt-1">K-F-C 전체 현황을 한눈에 확인하세요</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 mb-8">
        {STAT_CARDS.map((card, i) => (
          <motion.div
            key={card.key}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className="bg-white rounded-2xl p-5 shadow-sm"
          >
            <div className="text-2xl mb-2">{card.icon}</div>
            <div className="text-2xl font-black tabular-nums" style={{ color: card.color }}>
              {analytics
                ? (analytics[card.key as keyof Analytics] ?? 0).toLocaleString()
                : "—"}
            </div>
            <div className="text-xs text-ink-muted font-semibold mt-1">{card.label}</div>
          </motion.div>
        ))}
      </div>

      {/* Quick Actions */}
      <h2 className="text-lg font-bold text-ink mb-4">빠른 액션</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {QUICK_ACTIONS.map((action, i) => (
          <motion.div
            key={action.href}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 + i * 0.05 }}
          >
            <Link
              href={action.href}
              className="block bg-white rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow group"
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
