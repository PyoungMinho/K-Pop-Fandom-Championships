"use client";

import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { useState, useEffect } from "react";
import TeamLogo from "@/components/TeamLogo";
import { publicApi, type ActiveSeason } from "@/lib/public-api";

function extractYouTubeId(url: string): string {
  const match = url.match(/(?:v=|\/embed\/|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
  return match?.[1] || "";
}

const GAME_MODES = [
  { icon: "🎯", title: "클릭 대전", desc: "팀을 위해 미친 듯이 클릭!", color: "#FF6B35", href: "/game" },
  { icon: "🏆", title: "스코어보드", desc: "실시간 팀 순위를 확인", color: "#2EC4B6", href: "/scoreboard" },
  { icon: "📣", title: "응원 게시판", desc: "팀에게 응원 메시지를 전달", color: "#A78BFA", href: "/cheer" },
  { icon: "🗳️", title: "팀 투표", desc: "내 최애 팀에 투표하기", color: "#FB7185", href: "/nomination" },
];

function DayCounter({ totalDays, currentDay }: { totalDays: number; currentDay: number }) {
  return (
    <div className="flex items-center gap-2 flex-wrap justify-center">
      {Array.from({ length: totalDays }, (_, i) => (
        <div
          key={i}
          className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold transition-all ${
            i + 1 < currentDay
              ? "bg-coral text-white shadow-md"
              : i + 1 === currentDay
              ? "bg-coral text-white shadow-md ring-2 ring-coral ring-offset-2"
              : "bg-gray-100 text-gray-400"
          }`}
        >
          {i + 1}
        </div>
      ))}
    </div>
  );
}

function LiveScorePreview({ scoreboard }: { scoreboard: ActiveSeason["scoreboard"] }) {
  const top3 = scoreboard.slice(0, 3);
  const maxScore = top3[0]?.totalScore || 1;

  if (top3.length === 0) {
    return <p className="text-sm text-ink-muted text-center py-4">아직 등록된 팀이 없습니다</p>;
  }

  return (
    <div className="space-y-3">
      {top3.map((entry, i) => (
        <motion.div
          key={entry.teamId}
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.3 + i * 0.1 }}
          className="flex items-center gap-3"
        >
          <span className="text-2xl font-black text-ink/30 w-8 text-center">
            {i === 0 ? "🥇" : i === 1 ? "🥈" : "🥉"}
          </span>
          <TeamLogo name={entry.teamName} shortName={entry.shortName} colorCode={entry.colorCode} size="sm" />
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between mb-1">
              <span className="font-bold text-sm truncate">{entry.teamName}</span>
              <span className="text-sm font-semibold text-ink-muted tabular-nums">
                {entry.totalScore.toLocaleString()}
              </span>
            </div>
            <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
              <motion.div
                className="h-full rounded-full"
                style={{ backgroundColor: entry.colorCode }}
                initial={{ width: 0 }}
                animate={{ width: `${(entry.totalScore / maxScore) * 100}%` }}
                transition={{ delay: 0.5 + i * 0.15, duration: 0.8, ease: "easeOut" }}
              />
            </div>
          </div>
        </motion.div>
      ))}
    </div>
  );
}

export default function Home() {
  const [mounted, setMounted] = useState(false);
  const [settings, setSettings] = useState<Record<string, string>>({});
  const [season, setSeason] = useState<ActiveSeason | null>(null);

  useEffect(() => {
    setMounted(true);
    Promise.all([
      publicApi.getSettings().catch(() => ({} as Record<string, string>)),
      publicApi.getActiveSeason().catch(() => null),
    ]).then(([s, a]) => {
      setSettings(s);
      setSeason(a);
    });
  }, []);

  if (!mounted) return null;

  const siteTitle = settings.site_title || season?.title || "아이돌 팬덤 대회";
  const winnerEmbedId = settings.winner_embed_url ? extractYouTubeId(settings.winner_embed_url) : null;
  const scoreboard = season?.scoreboard ?? [];
  const teams = scoreboard.map((s) => ({
    id: s.teamId,
    name: s.teamName,
    shortName: s.shortName,
    colorCode: s.colorCode,
    logoUrl: s.logoUrl,
  }));

  return (
    <main className="min-h-screen pb-24 md:pb-8">
      {/* Announcement Banner */}
      <AnimatePresence>
        {settings.announcement && (
          <motion.div
            initial={{ opacity: 0, y: -40 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -40 }}
            className="bg-coral text-white text-center text-sm font-semibold py-2 px-4"
          >
            📢 {settings.announcement}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 gradient-bg-warm" />
        <div className="absolute top-20 left-10 w-64 h-64 bg-coral/10 rounded-full blur-3xl" />
        <div className="absolute bottom-10 right-10 w-48 h-48 bg-mint/10 rounded-full blur-3xl" />
        <div className="absolute top-40 right-20 w-32 h-32 bg-sunny/10 rounded-full blur-2xl" />

        <div className="relative max-w-6xl mx-auto px-4 sm:px-6 pt-28 pb-16 sm:pt-32 sm:pb-20">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center"
          >
            {/* Live Badge */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2 }}
              className="inline-flex items-center gap-2 px-4 py-2 bg-white/80 backdrop-blur rounded-full shadow-sm mb-6"
            >
              {season ? (
                <>
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500" />
                  </span>
                  <span className="text-sm font-semibold text-green-700">시즌 진행 중</span>
                  <span className="text-sm text-ink-muted">
                    • DAY {season.currentDay} / {season.totalDays}
                  </span>
                </>
              ) : (
                <span className="text-sm font-semibold text-gray-500">시즌 준비 중</span>
              )}
            </motion.div>

            {/* Title */}
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-black tracking-tight leading-tight">
              <span className="gradient-text">{siteTitle}</span>
            </h1>

            <p className="mt-4 text-lg sm:text-xl text-ink-light max-w-lg mx-auto leading-relaxed">
              팬덤의 화력을 건강하게 증명하는
              <br className="sm:hidden" /> {season ? `${season.totalDays}일간의` : ""} 축제
            </p>

            {/* Day Counter */}
            {season && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="mt-8 flex justify-center"
              >
                <DayCounter totalDays={season.totalDays} currentDay={season.currentDay} />
              </motion.div>
            )}

            {/* CTA */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3"
            >
              <Link href="/game" className="btn-primary text-lg px-8 py-4">
                지금 참전하기
              </Link>
              <Link href="/scoreboard" className="btn-secondary text-lg px-8 py-4">
                순위 보기
              </Link>
            </motion.div>
          </motion.div>

          {/* Team Avatars Row */}
          {teams.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
              className="mt-12 flex justify-center items-center gap-3 sm:gap-4 flex-wrap"
            >
              {teams.map((team, i) => (
                <motion.div
                  key={team.id}
                  initial={{ opacity: 0, scale: 0 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.7 + i * 0.08, type: "spring", bounce: 0.4 }}
                  className="group cursor-pointer"
                >
                  <div className="relative">
                    <TeamLogo name={team.name} shortName={team.shortName} colorCode={team.colorCode} size="lg" />
                    <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <div className="bg-ink text-white text-xs font-semibold px-2 py-1 rounded-lg whitespace-nowrap">
                        {team.name}
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          )}
        </div>
      </section>

      {/* Live Score Preview */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 -mt-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="card-game"
        >
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-2">
              <span className="text-xl">🔥</span>
              <h2 className="text-lg font-bold">실시간 순위</h2>
            </div>
            <Link href="/scoreboard" className="text-sm font-semibold text-coral hover:text-coral-dark transition-colors">
              전체 보기 →
            </Link>
          </div>
          <LiveScorePreview scoreboard={scoreboard} />
        </motion.div>
      </section>

      {/* Game Modes Grid */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 mt-10">
        <motion.h2
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="text-2xl font-bold mb-6"
        >
          종목 참여하기
        </motion.h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
          {GAME_MODES.map((mode, i) => (
            <motion.div
              key={mode.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
            >
              <Link href={mode.href} className="block">
                <div className="card-game group text-center h-full">
                  <div
                    className="w-14 h-14 rounded-2xl flex items-center justify-center text-2xl mx-auto mb-3 transition-transform group-hover:scale-110"
                    style={{ backgroundColor: `${mode.color}15` }}
                  >
                    {mode.icon}
                  </div>
                  <h3 className="font-bold text-base">{mode.title}</h3>
                  <p className="text-xs text-ink-muted mt-1 leading-relaxed">{mode.desc}</p>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Event Banner */}
      <AnimatePresence>
        {settings.event_banner_url && (
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-6xl mx-auto px-4 sm:px-6 mt-10"
          >
            <div className="rounded-2xl overflow-hidden shadow-md">
              <img src={settings.event_banner_url} alt="이벤트 배너" className="w-full h-auto max-h-56 object-cover" />
            </div>
          </motion.section>
        )}
      </AnimatePresence>

      {/* Winner Song Embed — 자동재생(무음), 유저가 소리 직접 켬 */}
      <AnimatePresence>
        {winnerEmbedId && (
          <motion.section
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-6xl mx-auto px-4 sm:px-6 mt-10"
          >
            <div className="card-game">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <span className="text-2xl">🏆</span>
                  <div>
                    <h2 className="text-lg font-bold">
                      {settings.winner_team_name
                        ? `${settings.winner_team_name} 우승 축하!`
                        : "우승 팬덤 축하 영상"}
                    </h2>
                    <p className="text-xs text-ink-muted">함께 응원해주셔서 감사합니다</p>
                  </div>
                </div>
                {/* 자동재생 안내 배지 */}
                <span className="text-xs bg-gray-100 text-gray-500 px-2 py-1 rounded-full flex items-center gap-1">
                  🔇 <span>자동재생</span>
                </span>
              </div>
              <div className="aspect-video rounded-xl overflow-hidden bg-black">
                <iframe
                  src={`https://www.youtube.com/embed/${winnerEmbedId}?autoplay=1&mute=1&rel=0&loop=1&playlist=${winnerEmbedId}`}
                  className="w-full h-full"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  title="우승 팬덤 노래"
                />
              </div>
            </div>
          </motion.section>
        )}
      </AnimatePresence>

      {/* Stats Row */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 mt-10">
        <div className="grid grid-cols-3 gap-3 sm:gap-4">
          {[
            { label: "참여 팀", value: teams.length > 0 ? String(teams.length) : "-", icon: "👥" },
            { label: "총 점수 합산", value: scoreboard.reduce((s, e) => s + e.totalScore, 0) > 0
                ? (scoreboard.reduce((s, e) => s + e.totalScore, 0) / 1000).toFixed(0) + "K"
                : "-", icon: "🖱️" },
            { label: "시즌", value: season ? `S${season.seasonNumber}` : "-", icon: "🎯" },
          ].map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 15 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="card text-center py-5"
            >
              <div className="text-2xl mb-1">{stat.icon}</div>
              <div className="text-2xl sm:text-3xl font-black gradient-text">{stat.value}</div>
              <div className="text-xs text-ink-muted font-medium mt-1">{stat.label}</div>
            </motion.div>
          ))}
        </div>
      </section>
    </main>
  );
}
