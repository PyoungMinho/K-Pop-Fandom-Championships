"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import TeamLogo from "@/components/TeamLogo";
import Confetti from "@/components/Confetti";
import { api } from "@/lib/api";
import { publicApi } from "@/lib/public-api";
import type { NominationResultPublic } from "@/lib/public-api";

export default function NominationPage() {
  const [mounted, setMounted] = useState(false);
  const [voted, setVoted] = useState<string | null>(null);
  const [showResults, setShowResults] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  const [results, setResults] = useState<NominationResultPublic[]>([]);
  const [seasonId, setSeasonId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [voting, setVoting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  /* ──────────── 초기 데이터 로드 ──────────── */
  useEffect(() => {
    setMounted(true);

    async function loadInitialData() {
      let season: Awaited<ReturnType<typeof publicApi.getActiveSeason>> = null;
      try {
        season = await publicApi.getActiveSeason();
        if (!season) {
          setLoading(false);
          return;
        }
        setSeasonId(season.id);

        const nominationResults = await publicApi.getNominationResults(season.id);
        setResults(nominationResults);
      } catch {
        // 서버 연결 실패 시 빈 결과 — 시즌 팀 정보로 fallback
        if (season) {
          const fallback: NominationResultPublic[] = season.scoreboard.map((s) => ({
            teamId: s.teamId,
            teamName: s.teamName,
            shortName: s.shortName,
            colorCode: s.colorCode,
            voteCount: 0,
          }));
          setResults(fallback);
        }
      } finally {
        setLoading(false);
      }
    }

    loadInitialData();
  }, []);

  const totalVotes = results.reduce((sum, r) => sum + r.voteCount, 0);
  const sortedResults = [...results].sort((a, b) => b.voteCount - a.voteCount);

  /* ──────────── 투표 핸들러 ──────────── */
  const handleVote = async (teamId: string) => {
    if (voting || voted) return;
    if (!seasonId) {
      setErrorMsg("다음 운동회를 준비 중이에요! 곧 새로운 시즌이 열릴 예정이에요.");
      return;
    }

    setVoting(true);
    setErrorMsg(null);

    try {
      await api.nominate({ seasonId, teamId });

      // 서버 응답 성공 후 결과 갱신
      const updatedResults = await publicApi.getNominationResults(seasonId);
      setResults(updatedResults);

      setVoted(teamId);
      setShowConfetti(true);
      setTimeout(() => setShowConfetti(false), 3000);
      setTimeout(() => setShowResults(true), 800);
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "알 수 없는 오류가 발생했습니다.";

      if (message.includes("409") || message.toLowerCase().includes("already") || message.includes("중복")) {
        setErrorMsg("이미 이번 시즌에 투표하셨습니다.");
      } else if (message.includes("400")) {
        setErrorMsg("투표 정보가 올바르지 않습니다. 다시 시도해주세요.");
      } else {
        setErrorMsg("투표 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.");
      }
    } finally {
      setVoting(false);
    }
  };

  if (!mounted) return null;

  return (
    <main className="min-h-screen pb-24 md:pb-8 pt-20">
      <Confetti active={showConfetti} />

      <div className="max-w-3xl mx-auto px-4 sm:px-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-rose/20 rounded-full mb-3">
            <span className="text-sm">🗳️</span>
            <span className="text-sm font-bold text-pink-700">팀 투표</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-black">
            내 <span className="gradient-text">최애 팀</span>에 투표!
          </h1>
          <p className="text-ink-muted mt-2">시즌당 1회 투표할 수 있어요</p>
        </motion.div>

        {/* 로딩 상태 */}
        {loading ? (
          <div className="flex justify-center items-center py-20">
            <div className="animate-spin rounded-full h-10 w-10 border-4 border-coral border-t-transparent" />
          </div>
        ) : (
          <>
            {/* 에러 메시지 */}
            <AnimatePresence>
              {errorMsg && (
                <motion.div
                  initial={{ opacity: 0, y: -8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  className="mb-4 px-4 py-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm font-medium text-center"
                >
                  {errorMsg}
                </motion.div>
              )}
            </AnimatePresence>

            {/* 빈 시즌 — 팀 목록 없음 */}
            {!loading && results.length === 0 && (
              <div className="text-center py-20">
                <div className="text-5xl mb-4">🏕️</div>
                <h2 className="text-xl font-bold mb-2">다음 운동회를 준비 중이에요!</h2>
                <p className="text-ink-muted text-sm">
                  곧 새로운 시즌이 열릴 예정이에요.
                  <br />
                  투표함이 열리면 제일 먼저 달려와 주세요!
                </p>
              </div>
            )}

            {/* Voting Area */}
            {!voted && results.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
              >
                <h2 className="text-lg font-bold mb-4 text-center">투표할 팀을 선택하세요</h2>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {results.map((team, i) => (
                    <motion.button
                      key={team.teamId}
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: 0.1 + i * 0.06 }}
                      whileHover={{ scale: voting ? 1 : 1.03 }}
                      whileTap={{ scale: voting ? 1 : 0.97 }}
                      onClick={() => handleVote(team.teamId)}
                      disabled={voting}
                      className="card-game flex flex-col items-center gap-3 py-8 cursor-pointer group disabled:opacity-60 disabled:cursor-not-allowed"
                    >
                      <div className="transition-transform group-hover:scale-110">
                        <TeamLogo
                          name={team.teamName}
                          shortName={team.shortName}
                          colorCode={team.colorCode}
                          size="xl"
                        />
                      </div>
                      <div className="text-center">
                        <div className="font-bold text-lg">{team.teamName}</div>
                        <div className="text-xs text-ink-muted mt-1">
                          {voting ? "투표 중..." : "탭하여 투표"}
                        </div>
                      </div>
                    </motion.button>
                  ))}
                </div>
              </motion.div>
            )}

            {/* Vote Confirmation + Results */}
            {voted && results.length > 0 && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
              >
                {/* Vote Confirmation */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="card-game text-center mb-8"
                >
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", bounce: 0.5, delay: 0.2 }}
                    className="text-5xl mb-3"
                  >
                    🎉
                  </motion.div>
                  <h2 className="text-xl font-black mb-1">투표 완료!</h2>
                  <p className="text-ink-muted">
                    <span className="font-bold text-ink">
                      {results.find((t) => t.teamId === voted)?.teamName}
                    </span>
                    에 투표했습니다
                  </p>
                </motion.div>

                {/* Results */}
                <AnimatePresence>
                  {showResults && (
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="space-y-3"
                    >
                      <h2 className="text-lg font-bold flex items-center gap-2">
                        <span>📊</span> 투표 현황
                        <span className="text-sm font-normal text-ink-muted">
                          총 {totalVotes.toLocaleString()}표
                        </span>
                      </h2>

                      {sortedResults.map((result, i) => {
                        const pct =
                          totalVotes > 0
                            ? ((result.voteCount / totalVotes) * 100).toFixed(1)
                            : "0.0";
                        const isVoted = result.teamId === voted;

                        return (
                          <motion.div
                            key={result.teamId}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: i * 0.08 }}
                            className={`card ${isVoted ? "ring-2" : ""}`}
                            style={isVoted ? { borderColor: result.colorCode } : undefined}
                          >
                            <div className="flex items-center gap-3">
                              <span className="w-6 text-center font-black text-ink-muted text-sm">
                                {i + 1}
                              </span>
                              <TeamLogo
                                name={result.teamName}
                                shortName={result.shortName}
                                colorCode={result.colorCode}
                                size="md"
                              />
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between mb-1.5">
                                  <span className="font-bold truncate">
                                    {result.teamName}
                                    {isVoted && (
                                      <span className="ml-1.5 text-xs bg-coral/10 text-coral px-1.5 py-0.5 rounded-full">
                                        MY VOTE
                                      </span>
                                    )}
                                  </span>
                                  <div className="text-right shrink-0 ml-2">
                                    <span className="font-bold tabular-nums">{pct}%</span>
                                    <span className="text-xs text-ink-muted ml-1">
                                      ({result.voteCount.toLocaleString()})
                                    </span>
                                  </div>
                                </div>
                                <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
                                  <motion.div
                                    className="h-full rounded-full"
                                    style={{ backgroundColor: result.colorCode }}
                                    initial={{ width: 0 }}
                                    animate={{ width: `${pct}%` }}
                                    transition={{
                                      delay: 0.3 + i * 0.1,
                                      duration: 0.6,
                                      ease: "easeOut",
                                    }}
                                  />
                                </div>
                              </div>
                            </div>
                          </motion.div>
                        );
                      })}
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            )}
          </>
        )}
      </div>
    </main>
  );
}
