"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MOCK_TEAMS, MOCK_NOMINATION_RESULTS } from "@/lib/mock-data";
import TeamLogo from "@/components/TeamLogo";
import Confetti from "@/components/Confetti";

export default function NominationPage() {
  const [mounted, setMounted] = useState(false);
  const [voted, setVoted] = useState<string | null>(null);
  const [showResults, setShowResults] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  const [results, setResults] = useState(MOCK_NOMINATION_RESULTS);

  useEffect(() => {
    setMounted(true);
  }, []);

  const totalVotes = results.reduce((sum, r) => sum + r.voteCount, 0);
  const sortedResults = [...results].sort((a, b) => b.voteCount - a.voteCount);

  const handleVote = (teamId: string) => {
    setVoted(teamId);
    setShowConfetti(true);
    setTimeout(() => setShowConfetti(false), 3000);

    setResults((prev) =>
      prev.map((r) =>
        r.teamId === teamId ? { ...r, voteCount: r.voteCount + 1 } : r
      )
    );

    setTimeout(() => setShowResults(true), 800);
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

        {/* Voting Area */}
        {!voted ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <h2 className="text-lg font-bold mb-4 text-center">투표할 팀을 선택하세요</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {MOCK_TEAMS.map((team, i) => (
                <motion.button
                  key={team.id}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.1 + i * 0.06 }}
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => handleVote(team.id)}
                  className="card-game flex flex-col items-center gap-3 py-8 cursor-pointer group"
                >
                  <div className="transition-transform group-hover:scale-110">
                    <TeamLogo
                      name={team.name}
                      shortName={team.shortName}
                      colorCode={team.colorCode}
                      size="xl"
                    />
                  </div>
                  <div className="text-center">
                    <div className="font-bold text-lg">{team.name}</div>
                    <div className="text-xs text-ink-muted mt-1">탭하여 투표</div>
                  </div>
                </motion.button>
              ))}
            </div>
          </motion.div>
        ) : (
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
                  {MOCK_TEAMS.find((t) => t.id === voted)?.name}
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
                    const pct = ((result.voteCount / totalVotes) * 100).toFixed(1);
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
      </div>
    </main>
  );
}
