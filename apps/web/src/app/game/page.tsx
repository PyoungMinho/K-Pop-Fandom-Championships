"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MOCK_TEAMS, MOCK_SEASON_TEAMS, MOCK_GAME_EVENT } from "@/lib/mock-data";
import TeamLogo from "@/components/TeamLogo";
import Confetti from "@/components/Confetti";
import { getSocket } from "@/lib/socket";

/* ──────────── Types ──────────── */
interface Ripple {
  id: number;
  x: number;
  y: number;
}

interface FloatingScore {
  id: number;
  x: number;
  y: number;
}

interface TeamProgress {
  seasonTeamId: string;
  total: number;
  isBurst: boolean;
}

/* ──────────── Constants ──────────── */
const GOAL = (MOCK_GAME_EVENT.config as { goal?: number } | null)?.goal ?? 10_000;

/* ──────────── Helpers ──────────── */
function getSeasonTeamId(teamId: string): string {
  return MOCK_SEASON_TEAMS.find((st) => st.teamId === teamId)?.id ?? teamId;
}

/* ──────────── Component ──────────── */
export default function GamePage() {
  const [mounted, setMounted] = useState(false);
  const [selectedTeam, setSelectedTeam] = useState<string | null>(null);
  const [clickCount, setClickCount] = useState(0);
  const [combo, setCombo] = useState(0);
  const [ripples, setRipples] = useState<Ripple[]>([]);
  const [floatingScores, setFloatingScores] = useState<FloatingScore[]>([]);
  const [showConfetti, setShowConfetti] = useState(false);
  const [burstTeamId, setBurstTeamId] = useState<string | null>(null);
  const comboTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const rippleId = useRef(0);

  // 팀별 점수 (Redis 실시간 반영)
  const [teamProgress, setTeamProgress] = useState<Record<string, TeamProgress>>(() => {
    const init: Record<string, TeamProgress> = {};
    MOCK_SEASON_TEAMS.forEach((st) => {
      init[st.id] = { seasonTeamId: st.id, total: 0, isBurst: false };
    });
    return init;
  });

  const goal = GOAL;
  const team = MOCK_TEAMS.find((t) => t.id === selectedTeam);
  const selectedSeasonTeamId = selectedTeam ? getSeasonTeamId(selectedTeam) : null;

  /* ──────────── WebSocket ──────────── */
  useEffect(() => {
    setMounted(true);
    const socket = getSocket();

    // 초기 진행 상황 요청
    socket.emit("progress:request", {
      gameEventId: MOCK_GAME_EVENT.id,
      seasonTeamIds: MOCK_SEASON_TEAMS.map((st) => st.id),
    });

    // 실시간 점수 업데이트
    socket.on(
      "score:update",
      (data: {
        gameEventId: string;
        seasonTeamId: string;
        total: number;
        goal: number;
        progress: number;
      }) => {
        setTeamProgress((prev) => ({
          ...prev,
          [data.seasonTeamId]: {
            seasonTeamId: data.seasonTeamId,
            total: data.total,
            isBurst: prev[data.seasonTeamId]?.isBurst ?? false,
          },
        }));
      },
    );

    // 진행 상황 응답
    socket.on(
      "progress:update",
      (data: {
        goal: number;
        teams: { seasonTeamId: string; total: number; isBurst: boolean }[];
      }) => {
        setTeamProgress((prev) => {
          const next = { ...prev };
          data.teams.forEach((t) => {
            next[t.seasonTeamId] = t;
          });
          return next;
        });
      },
    );

    // 박 터짐 이벤트!
    socket.on(
      "burst",
      (data: { gameEventId: string; seasonTeamId: string; total: number }) => {
        setTeamProgress((prev) => ({
          ...prev,
          [data.seasonTeamId]: {
            ...prev[data.seasonTeamId],
            isBurst: true,
          },
        }));
        setBurstTeamId(data.seasonTeamId);
        setShowConfetti(true);
        setTimeout(() => {
          setShowConfetti(false);
          setBurstTeamId(null);
        }, 5000);
      },
    );

    return () => {
      socket.off("score:update");
      socket.off("progress:update");
      socket.off("burst");
      if (comboTimerRef.current) clearTimeout(comboTimerRef.current);
    };
  }, []);

  /* ──────────── Click Handler ──────────── */
  const handleClick = useCallback(
    (e: React.MouseEvent<HTMLButtonElement>) => {
      if (!selectedTeam || !selectedSeasonTeamId) return;

      const rect = e.currentTarget.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      const id = rippleId.current++;
      setRipples((prev) => [...prev.slice(-10), { id, x, y }]);
      setFloatingScores((prev) => [...prev.slice(-8), { id, x, y }]);
      setClickCount((c) => c + 1);
      setCombo((c) => c + 1);

      // 로컬 낙관적 업데이트
      setTeamProgress((prev) => ({
        ...prev,
        [selectedSeasonTeamId]: {
          ...prev[selectedSeasonTeamId],
          total: (prev[selectedSeasonTeamId]?.total ?? 0) + 1,
        },
      }));

      // WebSocket으로 서버에 전송
      const socket = getSocket();
      socket.emit("click", {
        gameEventId: MOCK_GAME_EVENT.id,
        seasonTeamId: selectedSeasonTeamId,
        ipHash: "browser",
      });

      if (comboTimerRef.current) clearTimeout(comboTimerRef.current);
      comboTimerRef.current = setTimeout(() => setCombo(0), 1500);

      setTimeout(() => setRipples((prev) => prev.filter((r) => r.id !== id)), 600);
      setTimeout(() => setFloatingScores((prev) => prev.filter((f) => f.id !== id)), 800);
    },
    [selectedTeam, selectedSeasonTeamId],
  );

  /* ──────────── Derived State ──────────── */
  const sortedTeams = [...MOCK_TEAMS]
    .map((t) => {
      const stId = getSeasonTeamId(t.id);
      const progress = teamProgress[stId];
      return { ...t, seasonTeamId: stId, total: progress?.total ?? 0, isBurst: progress?.isBurst ?? false };
    })
    .sort((a, b) => b.total - a.total);

  const myProgress = selectedSeasonTeamId ? teamProgress[selectedSeasonTeamId] : null;
  const myTotal = myProgress?.total ?? 0;
  const myPercent = Math.min((myTotal / goal) * 100, 100);
  const myIsBurst = myProgress?.isBurst ?? false;

  // 박이 가장 가까운 팀 찾기
  const leadingTeam = sortedTeams[0];
  const leadPercent = Math.min((leadingTeam.total / goal) * 100, 100);

  if (!mounted) return null;

  return (
    <main className="min-h-screen pb-24 md:pb-8 pt-20">
      <Confetti active={showConfetti} />

      {/* 박 터짐 오버레이 */}
      <AnimatePresence>
        {burstTeamId && (
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
                {MOCK_SEASON_TEAMS.find((st) => st.id === burstTeamId)?.team?.name ?? ""}팀 목표 달성!
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="max-w-4xl mx-auto px-4 sm:px-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-coral/10 rounded-full mb-3">
            <span className="text-sm">🎯</span>
            <span className="text-sm font-bold text-coral">클릭 대전</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-black">
            <span className="gradient-text">박 터트리기</span>
          </h1>
          <p className="text-ink-muted mt-2">
            목표 <span className="font-bold text-coral">{goal.toLocaleString()}</span>회 클릭! 가장 먼저 박을 터트려라!
          </p>
        </motion.div>

        {/* 전체 팀 진행 상황 (항상 표시) */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="card-game mb-6"
        >
          <h3 className="font-bold mb-4 flex items-center gap-2">
            <span>🏆</span> 박 터트리기 현황
          </h3>
          <div className="space-y-3">
            {sortedTeams.map((t, i) => {
              const percent = Math.min((t.total / goal) * 100, 100);
              const isSelected = t.id === selectedTeam;
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
                        <span className="ml-1.5 text-xs bg-coral/10 text-coral px-1.5 py-0.5 rounded-full">
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

        {/* Team Selection */}
        {!selectedTeam ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <h2 className="text-lg font-bold mb-4 text-center">응원할 팀을 선택하세요</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {MOCK_TEAMS.map((t, i) => (
                <motion.button
                  key={t.id}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.1 + i * 0.06 }}
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => setSelectedTeam(t.id)}
                  className="card-game flex flex-col items-center gap-3 py-6 cursor-pointer"
                >
                  <TeamLogo
                    name={t.name}
                    shortName={t.shortName}
                    colorCode={t.colorCode}
                    size="lg"
                  />
                  <div className="font-bold">{t.name}</div>
                </motion.button>
              ))}
            </div>
          </motion.div>
        ) : (
          <div className="space-y-6">
            {/* Selected Team + Change Button */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <TeamLogo
                  name={team!.name}
                  shortName={team!.shortName}
                  colorCode={team!.colorCode}
                  size="md"
                />
                <div>
                  <div className="font-bold text-lg">{team!.name}</div>
                  <div className="text-sm text-ink-muted">내 클릭: {clickCount.toLocaleString()}</div>
                </div>
              </div>
              <button
                onClick={() => {
                  setSelectedTeam(null);
                  setClickCount(0);
                  setCombo(0);
                }}
                className="text-sm font-semibold text-ink-muted hover:text-ink transition-colors"
              >
                팀 변경
              </button>
            </div>

            {/* 내 팀 진행 상황 (대형 게이지) */}
            <div className="card-game">
              <div className="flex items-center justify-between mb-2">
                <span className="font-bold">우리 팀 박</span>
                <span className="text-sm font-bold tabular-nums">
                  {myTotal.toLocaleString()} / {goal.toLocaleString()}
                </span>
              </div>
              <div className="h-6 bg-gray-100 rounded-full overflow-hidden relative">
                <motion.div
                  className="h-full rounded-full relative overflow-hidden"
                  style={{
                    backgroundColor: team!.colorCode,
                    boxShadow: myPercent > 80 ? `0 0 20px ${team!.colorCode}80` : undefined,
                  }}
                  animate={{ width: `${myPercent}%` }}
                  transition={{ duration: 0.3, ease: "easeOut" }}
                >
                  <div
                    className="absolute inset-0"
                    style={{
                      background:
                        "linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.3) 50%, transparent 100%)",
                      animation: "shimmer 1.5s infinite",
                    }}
                  />
                </motion.div>
              </div>
              <div className="text-center mt-2">
                <motion.span
                  key={myPercent.toFixed(0)}
                  initial={{ scale: 1.3 }}
                  animate={{ scale: 1 }}
                  className="text-2xl font-black"
                  style={{ color: team!.colorCode }}
                >
                  {myPercent.toFixed(1)}%
                </motion.span>
                {myPercent >= 90 && !myIsBurst && (
                  <motion.span
                    animate={{ opacity: [0.5, 1, 0.5] }}
                    transition={{ repeat: Infinity, duration: 1 }}
                    className="ml-2 text-sm font-bold text-coral"
                  >
                    거의 다 왔어요!
                  </motion.span>
                )}
                {myIsBurst && (
                  <span className="ml-2 text-sm font-bold text-sunny-dark">🎊 박 터짐!</span>
                )}
              </div>
            </div>

            {/* Click Area */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex flex-col items-center"
            >
              {/* Combo Indicator */}
              <AnimatePresence>
                {combo >= 5 && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.5 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.5 }}
                    className="mb-4 px-4 py-2 rounded-full font-black text-white text-lg"
                    style={{
                      background: `linear-gradient(135deg, ${team!.colorCode}, ${team!.colorCode}CC)`,
                      boxShadow: `0 4px 20px ${team!.colorCode}50`,
                    }}
                  >
                    {combo >= 50
                      ? "🔥 ULTRA COMBO! "
                      : combo >= 20
                        ? "⚡ SUPER COMBO! "
                        : "✨ COMBO! "}
                    x{combo}
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Big Click Button */}
              <button
                onClick={handleClick}
                disabled={myIsBurst}
                className="relative w-48 h-48 sm:w-56 sm:h-56 rounded-full cursor-pointer select-none active:scale-95 transition-transform disabled:opacity-50 disabled:cursor-not-allowed"
                style={{
                  background: myIsBurst
                    ? "linear-gradient(135deg, #FFD166, #FB7185)"
                    : `linear-gradient(135deg, ${team!.colorCode}, ${team!.colorCode}DD)`,
                  boxShadow:
                    combo >= 10
                      ? `0 0 ${20 + combo}px ${team!.colorCode}80, 0 8px 32px ${team!.colorCode}40`
                      : `0 8px 32px ${team!.colorCode}40`,
                  animation: combo >= 10 && !myIsBurst ? "pulse-glow 1s infinite" : undefined,
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

                {/* Floating +1 scores */}
                <AnimatePresence>
                  {floatingScores.map((f) => (
                    <motion.span
                      key={f.id}
                      initial={{ opacity: 1, y: 0, scale: 1 }}
                      animate={{ opacity: 0, y: -60, scale: 1.5 }}
                      exit={{ opacity: 0 }}
                      className="absolute text-white font-black text-lg pointer-events-none"
                      style={{ left: f.x - 10, top: f.y - 20 }}
                    >
                      +1
                    </motion.span>
                  ))}
                </AnimatePresence>

                <div className="flex flex-col items-center text-white">
                  {myIsBurst ? (
                    <>
                      <span className="text-4xl sm:text-5xl">🎊</span>
                      <span className="text-xl font-black mt-1">완료!</span>
                    </>
                  ) : (
                    <>
                      <span className="text-5xl sm:text-6xl font-black">TAP!</span>
                      <span className="text-lg font-bold opacity-80 mt-1">
                        {myTotal.toLocaleString()}
                      </span>
                    </>
                  )}
                </div>
              </button>

              {!myIsBurst && (
                <p className="text-sm text-ink-muted mt-4">연타하여 박을 터트리세요!</p>
              )}
            </motion.div>
          </div>
        )}
      </div>
    </main>
  );
}
