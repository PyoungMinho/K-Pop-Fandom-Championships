"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MOCK_TEAMS, MOCK_SEASON_TEAMS, MOCK_GAME_EVENT } from "@/lib/mock-data";
import TeamLogo from "@/components/TeamLogo";
import Confetti from "@/components/Confetti";
import { getSocket } from "@/lib/socket";

/* ──────────── Types ──────────── */
interface BatonStatus {
  seasonTeamId: string;
  count: number;
}

/* ──────────── Helpers ──────────── */
function getSeasonTeamId(teamId: string): string {
  return MOCK_SEASON_TEAMS.find((st) => st.teamId === teamId)?.id ?? teamId;
}
function getTeamBySeasonTeamId(stId: string) {
  const st = MOCK_SEASON_TEAMS.find((s) => s.id === stId);
  return MOCK_TEAMS.find((t) => t.id === st?.teamId) ?? MOCK_TEAMS[0];
}

/* ──────────── Component ──────────── */
export default function RelayPage() {
  const [mounted, setMounted] = useState(false);
  const [selectedTeam, setSelectedTeam] = useState<string | null>(null);
  const [myInviteCode, setMyInviteCode] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [batonCounts, setBatonCounts] = useState<BatonStatus[]>([]);
  const [recentPass, setRecentPass] = useState<{
    seasonTeamId: string;
    chainLength: number;
  } | null>(null);
  const [showConfetti, setShowConfetti] = useState(false);

  const team = MOCK_TEAMS.find((t) => t.id === selectedTeam);
  const selectedStId = selectedTeam ? getSeasonTeamId(selectedTeam) : null;

  /* ──────────── WebSocket ──────────── */
  useEffect(() => {
    setMounted(true);
    const socket = getSocket();

    // 초기 현황 요청
    socket.emit("baton:status", { gameEventId: MOCK_GAME_EVENT.id });

    socket.on("baton:status:update", (data: { counts: BatonStatus[] }) => {
      setBatonCounts(data.counts);
    });

    socket.on("baton:created", (data: { inviteCode: string }) => {
      setMyInviteCode(data.inviteCode);
    });

    socket.on(
      "baton:passed",
      (data: { seasonTeamId: string; chainLength: number; teamTotal: number }) => {
        setRecentPass({ seasonTeamId: data.seasonTeamId, chainLength: data.chainLength });
        setBatonCounts((prev) => {
          const exists = prev.find((c) => c.seasonTeamId === data.seasonTeamId);
          if (exists) {
            return prev.map((c) =>
              c.seasonTeamId === data.seasonTeamId
                ? { ...c, count: data.teamTotal }
                : c,
            );
          }
          return [...prev, { seasonTeamId: data.seasonTeamId, count: data.teamTotal }];
        });
        setShowConfetti(true);
        setTimeout(() => {
          setShowConfetti(false);
          setRecentPass(null);
        }, 4000);
      },
    );

    return () => {
      socket.off("baton:status:update");
      socket.off("baton:created");
      socket.off("baton:passed");
    };
  }, []);

  /* ──────────── Handlers ──────────── */
  const handleCreateInvite = useCallback(() => {
    if (!selectedStId) return;
    const socket = getSocket();
    socket.emit("baton:create", {
      gameEventId: MOCK_GAME_EVENT.id,
      seasonTeamId: selectedStId,
      ipHash: "browser",
    });
  }, [selectedStId]);

  const handleCopy = useCallback(() => {
    if (!myInviteCode) return;
    const url = `${window.location.origin}/relay?code=${myInviteCode}`;
    navigator.clipboard.writeText(url).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }, [myInviteCode]);

  /* ──────────── URL 초대 코드 감지 ──────────── */
  useEffect(() => {
    if (!mounted) return;
    const params = new URLSearchParams(window.location.search);
    const code = params.get("code");
    if (code) {
      const socket = getSocket();
      socket.emit("baton:accept", {
        inviteCode: code,
        ipHash: "browser",
      });

      socket.once(
        "baton:accepted",
        (data: {
          inviteCode: string;
          isNew: boolean;
          seasonTeamId: string;
        }) => {
          setMyInviteCode(data.inviteCode);
          // 해당 팀 자동 선택
          const st = MOCK_SEASON_TEAMS.find((s) => s.id === data.seasonTeamId);
          if (st) setSelectedTeam(st.teamId);
        },
      );
    }
  }, [mounted]);

  /* ──────────── Derived ──────────── */
  const sortedTeams = MOCK_TEAMS.map((t) => {
    const stId = getSeasonTeamId(t.id);
    const bc = batonCounts.find((c) => c.seasonTeamId === stId);
    return { ...t, seasonTeamId: stId, count: bc?.count ?? 0 };
  }).sort((a, b) => b.count - a.count);

  const maxCount = Math.max(...sortedTeams.map((t) => t.count), 1);

  if (!mounted) return null;

  return (
    <main className="min-h-screen pb-24 md:pb-8 pt-20">
      <Confetti active={showConfetti} />

      {/* 바통 전달 알림 */}
      <AnimatePresence>
        {recentPass && (
          <motion.div
            initial={{ opacity: 0, y: -40 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -40 }}
            className="fixed top-20 left-1/2 -translate-x-1/2 z-50"
          >
            <div className="bg-white rounded-2xl shadow-xl px-6 py-4 flex items-center gap-3 border-2 border-sunny">
              <span className="text-2xl">🏃‍♂️</span>
              <div>
                <div className="font-bold text-sm">새로운 팬이 바통을 이어받았습니다!</div>
                <div className="text-xs text-ink-muted">
                  {getTeamBySeasonTeamId(recentPass.seasonTeamId).name} · 체인 길이{" "}
                  {recentPass.chainLength}
                </div>
              </div>
            </div>
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
          <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-mint/20 rounded-full mb-3">
            <span className="text-sm">🏃‍♂️</span>
            <span className="text-sm font-bold text-mint-dark">이어달리기</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-black">
            <span className="gradient-text">바통</span>을 이어라!
          </h1>
          <p className="text-ink-muted mt-2">
            초대 링크를 공유하고, 더 많은 팬을 모아 팀에 점수를 보태세요
          </p>
        </motion.div>

        {/* 팀별 바통 현황 */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="card-game mb-6"
        >
          <h3 className="font-bold mb-4 flex items-center gap-2">
            <span>🏅</span> 이어달리기 현황
          </h3>
          <div className="space-y-3">
            {sortedTeams.map((t, i) => {
              const percent = (t.count / maxCount) * 100;
              const isSelected = t.id === selectedTeam;
              return (
                <div key={t.id} className="flex items-center gap-3">
                  <span className="w-5 text-center font-bold text-sm text-ink-muted">
                    {i + 1}
                  </span>
                  <TeamLogo
                    name={t.name}
                    shortName={t.shortName}
                    colorCode={t.colorCode}
                    size="sm"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <span
                        className={`text-sm font-semibold truncate ${
                          isSelected ? "text-ink" : "text-ink-light"
                        }`}
                      >
                        {t.name}
                        {isSelected && (
                          <span className="ml-1.5 text-xs bg-mint/20 text-mint-dark px-1.5 py-0.5 rounded-full">
                            MY
                          </span>
                        )}
                      </span>
                      <span className="text-sm font-bold tabular-nums">
                        {t.count}명
                      </span>
                    </div>
                    <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                      <motion.div
                        className="h-full rounded-full"
                        style={{ backgroundColor: t.colorCode }}
                        animate={{ width: `${percent}%` }}
                        transition={{ duration: 0.5, ease: "easeOut" }}
                      />
                    </div>
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
            <h2 className="text-lg font-bold mb-4 text-center">
              응원할 팀을 선택하세요
            </h2>
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
            {/* Selected Team */}
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
                  <div className="text-sm text-ink-muted">이어달리기 참가 중</div>
                </div>
              </div>
              <button
                onClick={() => {
                  setSelectedTeam(null);
                  setMyInviteCode(null);
                }}
                className="text-sm font-semibold text-ink-muted hover:text-ink transition-colors"
              >
                팀 변경
              </button>
            </div>

            {/* Invite Card */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="card-game text-center"
            >
              {!myInviteCode ? (
                <div className="py-6">
                  <div className="text-5xl mb-4">🏃‍♂️</div>
                  <h3 className="text-xl font-black mb-2">바통을 만들어 시작하세요!</h3>
                  <p className="text-sm text-ink-muted mb-6">
                    초대 링크를 만들고 친구들에게 공유하면,
                    <br />
                    바통이 이어질 때마다 팀에 <strong>5점</strong>이 쌓여요
                  </p>
                  <button onClick={handleCreateInvite} className="btn-primary text-lg px-8 py-4">
                    🔗 초대 링크 만들기
                  </button>
                </div>
              ) : (
                <div className="py-6">
                  <div className="text-5xl mb-4">🎉</div>
                  <h3 className="text-xl font-black mb-2">내 초대 링크가 준비됐어요!</h3>
                  <p className="text-sm text-ink-muted mb-4">
                    링크를 공유하여 더 많은 팬을 모아보세요
                  </p>

                  {/* 초대 링크 표시 */}
                  <div className="bg-gray-50 rounded-xl p-4 mb-4">
                    <div className="text-xs text-ink-muted mb-1">초대 링크</div>
                    <div className="font-mono text-sm font-bold text-ink break-all">
                      {typeof window !== "undefined"
                        ? `${window.location.origin}/relay?code=${myInviteCode}`
                        : `https://site.com/relay?code=${myInviteCode}`}
                    </div>
                  </div>

                  <div className="flex gap-3 justify-center">
                    <button
                      onClick={handleCopy}
                      className="btn-primary px-6"
                    >
                      {copied ? "✅ 복사됨!" : "📋 링크 복사"}
                    </button>
                  </div>

                  {/* 바통 릴레이 시각화 */}
                  <div className="mt-8 pt-6 border-t border-gray-100">
                    <h4 className="font-bold text-sm mb-4 text-ink-muted">바통 릴레이 체인</h4>
                    <div className="flex items-center justify-center gap-2 flex-wrap">
                      {Array.from({ length: Math.min(sortedTeams.find((t) => t.id === selectedTeam)?.count ?? 1, 20) }).map(
                        (_, i) => (
                          <motion.div
                            key={i}
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ delay: i * 0.05 }}
                            className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold"
                            style={{
                              backgroundColor: team!.colorCode,
                              opacity: 0.4 + (i / 20) * 0.6,
                            }}
                          >
                            {i + 1}
                          </motion.div>
                        ),
                      )}
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: [0, 1.2, 1] }}
                        transition={{ repeat: Infinity, duration: 2 }}
                        className="w-8 h-8 rounded-full border-2 border-dashed flex items-center justify-center text-sm"
                        style={{ borderColor: team!.colorCode, color: team!.colorCode }}
                      >
                        +
                      </motion.div>
                    </div>
                  </div>
                </div>
              )}
            </motion.div>

            {/* Info */}
            <div className="card bg-mint/5 border border-mint/20">
              <div className="flex items-start gap-3">
                <span className="text-2xl">💡</span>
                <div className="text-sm text-ink-light leading-relaxed">
                  <p className="font-bold text-ink mb-1">이어달리기 규칙</p>
                  <ul className="space-y-1 list-disc list-inside">
                    <li>초대 링크로 새 팬이 들어오면 <strong>바통 1개</strong> 연결</li>
                    <li>바통 1개당 팀에 <strong>5점</strong> 추가</li>
                    <li>같은 사람이 중복으로 참여할 수 없어요 (IP 기반 검증)</li>
                    <li>7일 이벤트 기간 동안 진행됩니다</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
