"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { publicApi, extractSeasonTeams, type SeasonTeamInfo, type ActiveGameEvent } from "@/lib/public-api";
import TeamLogo from "@/components/TeamLogo";
import { getSocket } from "@/lib/socket";
import { useSocketEvent } from "@/lib/useSocketEvent";
import BurstOverlay from "@/components/game/BurstOverlay";
import ComboIndicator from "@/components/game/ComboIndicator";
import ClickButton from "@/components/game/ClickButton";
import TeamProgressBar from "@/components/game/TeamProgressBar";

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
  multiplier?: number;
}

interface ClickAck {
  total: number;
  combo: number;
  multiplier: number;
  isBurst: boolean;
}

interface TeamProgress {
  seasonTeamId: string;
  total: number;
  isBurst: boolean;
}

/* ──────────── Component ──────────── */
export default function GamePage() {
  const [mounted, setMounted] = useState(false);
  const [seasonTeams, setSeasonTeams] = useState<SeasonTeamInfo[]>([]);
  const [gameEvent, setGameEvent] = useState<ActiveGameEvent | null>(null);
  const [loading, setLoading] = useState(true);

  const [selectedTeamId, setSelectedTeamId] = useState<string | null>(null); // teamId
  const [clickCount, setClickCount] = useState(0);
  const [combo, setCombo] = useState(0);
  const [multiplier, setMultiplier] = useState(1);
  const [ripples, setRipples] = useState<Ripple[]>([]);
  const [floatingScores, setFloatingScores] = useState<FloatingScore[]>([]);
  const [showConfetti, setShowConfetti] = useState(false);
  const [burstSeasonTeamId, setBurstSeasonTeamId] = useState<string | null>(null);
  const comboTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const rippleId = useRef(0);
  // click:ack 수신 후 FloatingScore의 multiplier를 교체하기 위한 최근 id 추적
  const lastFloatingIdRef = useRef<number | null>(null);

  // 팀별 점수 (Redis 실시간 반영)
  const [teamProgress, setTeamProgress] = useState<Record<string, TeamProgress>>({});

  // 실시간 참여자 수
  const [onlineCount, setOnlineCount] = useState(0);

  // teamId -> SeasonTeamInfo 조회 헬퍼
  const findByTeamId = (teamId: string) =>
    seasonTeams.find((st) => st.teamId === teamId) ?? null;

  const goal = (gameEvent?.config as { goal?: number } | null)?.goal ?? 10_000;
  const selectedSt = selectedTeamId ? findByTeamId(selectedTeamId) : null;
  const selectedSeasonTeamId = selectedSt?.id ?? null;

  /* ──────────── 초기 데이터 로드 ──────────── */
  useEffect(() => {
    setMounted(true);

    Promise.all([
      publicApi.getActiveSeason().catch(() => null),
      publicApi.getActiveGameEvent().catch(() => null),
    ]).then(([season, event]) => {
      if (season) {
        const teams = extractSeasonTeams(season);
        setSeasonTeams(teams);

        // teamProgress 초기화
        const init: Record<string, TeamProgress> = {};
        teams.forEach((st) => {
          init[st.id] = { seasonTeamId: st.id, total: 0, isBurst: false };
        });
        setTeamProgress(init);
      }
      setGameEvent(event);
      setLoading(false);
    });
  }, []);

  /* ──────────── WebSocket ──────────── */
  useEffect(() => {
    if (!gameEvent || seasonTeams.length === 0) return;

    const socket = getSocket();

    // 초기 진행 상황 요청
    socket.emit("progress:request", {
      gameEventId: gameEvent.id,
      seasonTeamIds: seasonTeams.map((st) => st.id),
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
        onlineCount?: number;
      }) => {
        setTeamProgress((prev) => ({
          ...prev,
          [data.seasonTeamId]: {
            seasonTeamId: data.seasonTeamId,
            total: data.total,
            isBurst: prev[data.seasonTeamId]?.isBurst ?? false,
          },
        }));
        if (typeof data.onlineCount === "number") {
          setOnlineCount(data.onlineCount);
        }
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
        setBurstSeasonTeamId(data.seasonTeamId);
        setShowConfetti(true);
        setTimeout(() => {
          setShowConfetti(false);
          setBurstSeasonTeamId(null);
        }, 5000);
      },
    );

    return () => {
      socket.off("score:update");
      socket.off("progress:update");
      socket.off("burst");
      if (comboTimerRef.current) clearTimeout(comboTimerRef.current);
    };
  }, [gameEvent, seasonTeams]);

  /* ──────────── Heartbeat (30초 간격, 탭 비활성화 시 중단) ──────────── */
  useEffect(() => {
    if (!gameEvent) return;

    const socket = getSocket();
    let intervalId: ReturnType<typeof setInterval> | null = null;

    const startHeartbeat = () => {
      if (intervalId !== null) return;
      intervalId = setInterval(() => {
        socket.emit("heartbeat", { gameEventId: gameEvent.id });
      }, 30_000);
    };

    const stopHeartbeat = () => {
      if (intervalId !== null) {
        clearInterval(intervalId);
        intervalId = null;
      }
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        startHeartbeat();
      } else {
        stopHeartbeat();
      }
    };

    // 최초 시작 (탭이 이미 visible인 경우)
    if (document.visibilityState === "visible") {
      startHeartbeat();
    }

    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      stopHeartbeat();
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [gameEvent]);

  /* ──────────── click:ack 처리 (useSocketEvent) ──────────── */
  const isSocketReady = !!gameEvent && seasonTeams.length > 0;

  const handleClickAck = useCallback(
    (data: ClickAck) => {
      // 서버가 authority — combo 불일치 시 0.2s transition으로 동기화
      setCombo((localCombo) => {
        if (localCombo !== data.combo) {
          // 서버 값으로 강제 동기화 (transition은 Framer Motion이 처리)
          return data.combo;
        }
        return localCombo;
      });

      // multiplier 업데이트
      setMultiplier(data.multiplier);

      // isBurst 처리 — burst 이벤트가 별도로 오지만 ack에서도 트리거
      if (data.isBurst && selectedSeasonTeamId) {
        setBurstSeasonTeamId(selectedSeasonTeamId);
        setShowConfetti(true);
        setTimeout(() => {
          setShowConfetti(false);
          setBurstSeasonTeamId(null);
        }, 5000);
      }

      // multiplier >= 2이면 마지막 FloatingScore의 multiplier를 서버값으로 교체
      if (data.multiplier >= 2 && lastFloatingIdRef.current !== null) {
        const targetId = lastFloatingIdRef.current;
        setFloatingScores((prev) =>
          prev.map((f) =>
            f.id === targetId ? { ...f, multiplier: data.multiplier } : f,
          ),
        );
      }
    },
    [selectedSeasonTeamId],
  );

  useSocketEvent<ClickAck>("click:ack", handleClickAck, isSocketReady);

  /* ──────────── Click Handler ──────────── */
  const handleClick = useCallback(
    (e: React.MouseEvent<HTMLButtonElement>) => {
      if (!selectedTeamId || !selectedSeasonTeamId || !gameEvent) return;

      const rect = e.currentTarget.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      const id = rippleId.current++;
      // 낙관적 업데이트: 초기 multiplier=1, ack 수신 후 교체
      setRipples((prev) => [...prev.slice(-10), { id, x, y }]);
      setFloatingScores((prev) => [...prev.slice(-8), { id, x, y, multiplier: 1 }]);
      lastFloatingIdRef.current = id;
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
        gameEventId: gameEvent.id,
        seasonTeamId: selectedSeasonTeamId,
      });

      if (comboTimerRef.current) clearTimeout(comboTimerRef.current);
      comboTimerRef.current = setTimeout(() => setCombo(0), 1500);

      setTimeout(() => setRipples((prev) => prev.filter((r) => r.id !== id)), 600);
      setTimeout(() => setFloatingScores((prev) => prev.filter((f) => f.id !== id)), 800);
    },
    [selectedTeamId, selectedSeasonTeamId, gameEvent],
  );

  /* ──────────── Derived State ──────────── */
  const sortedTeams = [...seasonTeams]
    .map((st) => {
      const progress = teamProgress[st.id];
      return { ...st, total: progress?.total ?? 0, isBurst: progress?.isBurst ?? false };
    })
    .sort((a, b) => b.total - a.total);

  const myProgress = selectedSeasonTeamId ? teamProgress[selectedSeasonTeamId] : null;
  const myTotal = myProgress?.total ?? 0;
  const myPercent = Math.min((myTotal / goal) * 100, 100);
  const myIsBurst = myProgress?.isBurst ?? false;

  // 박 터짐 오버레이용 팀 정보 변환
  const burstSt = burstSeasonTeamId
    ? (seasonTeams.find((st) => st.id === burstSeasonTeamId) ?? null)
    : null;
  const burstTeamName = burstSt?.name ?? null;
  const burstTeamColor = burstSt?.colorCode ?? undefined;

  // 팀 선택 시 CSS 변수를 main에 주입 (새로 추가되는 요소에 var(--team-primary) 사용 가능)
  const teamStyle = selectedSt
    ? ({
        "--team-primary": selectedSt.colorCode,
        "--team-secondary": `${selectedSt.colorCode}33`,
        "--team-light": `${selectedSt.colorCode}15`,
      } as React.CSSProperties)
    : {};

  if (!mounted) return null;

  /* ──────────── 로딩 상태 ──────────── */
  if (loading) {
    return (
      <main className="min-h-screen pb-24 md:pb-8 pt-20 flex items-center justify-center">
        <div className="text-center">
          <div className="text-4xl mb-4 animate-bounce">🎯</div>
          <p className="text-ink-muted font-semibold">게임 데이터를 불러오는 중...</p>
        </div>
      </main>
    );
  }

  /* ──────────── 활성 시즌 없음 ──────────── */
  if (seasonTeams.length === 0) {
    return (
      <main className="min-h-screen pb-24 md:pb-8 pt-20 flex items-center justify-center">
        <div className="text-center card-game max-w-sm mx-4">
          <div className="text-5xl mb-4">🏕️</div>
          <h2 className="text-xl font-bold mb-2">다음 운동회를 준비 중이에요!</h2>
          <p className="text-ink-muted text-sm">
            곧 새로운 시즌이 열릴 예정이에요.
            <br />
            조금만 기다려 주세요!
          </p>
        </div>
      </main>
    );
  }

  /* ──────────── 게임이벤트 없음 ──────────── */
  if (!gameEvent) {
    return (
      <main className="min-h-screen pb-24 md:pb-8 pt-20 flex items-center justify-center">
        <div className="text-center card-game max-w-sm mx-4">
          <div className="text-5xl mb-4">⏳</div>
          <h2 className="text-xl font-bold mb-2">잠깐! 박이 아직 준비 중이에요</h2>
          <p className="text-ink-muted text-sm">
            감독님이 박을 달고 있는 중이에요...
            <br />
            조금만 기다리면 곧 시작돼요!
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen pb-24 md:pb-8 pt-20" style={teamStyle}>
      <BurstOverlay
        burstTeamName={burstTeamName}
        showConfetti={showConfetti}
        teamColor={burstTeamColor}
      />

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
        <TeamProgressBar
          teams={sortedTeams}
          goal={goal}
          selectedTeamId={selectedTeamId}
          onlineCount={onlineCount}
          gameEventId={gameEvent.id}
        />

        {/* Team Selection */}
        {!selectedTeamId ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <h2 className="text-lg font-bold mb-4 text-center">응원할 팀을 선택하세요</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {seasonTeams.map((st, i) => (
                <motion.button
                  key={st.id}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.1 + i * 0.06 }}
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => setSelectedTeamId(st.teamId)}
                  className="card-game flex flex-col items-center gap-3 py-6 cursor-pointer"
                >
                  <TeamLogo
                    name={st.name}
                    shortName={st.shortName}
                    colorCode={st.colorCode}
                    size="lg"
                  />
                  <div className="font-bold">{st.name}</div>
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
                  name={selectedSt!.name}
                  shortName={selectedSt!.shortName}
                  colorCode={selectedSt!.colorCode}
                  size="md"
                />
                <div>
                  <div className="font-bold text-lg">{selectedSt!.name}</div>
                  <div className="text-sm text-ink-muted">내 클릭: {clickCount.toLocaleString()}</div>
                </div>
              </div>
              <button
                onClick={() => {
                  setSelectedTeamId(null);
                  setClickCount(0);
                  setCombo(0);
                  setMultiplier(1);
                  lastFloatingIdRef.current = null;
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
                    backgroundColor: selectedSt!.colorCode,
                    boxShadow: myPercent > 80 ? `0 0 20px ${selectedSt!.colorCode}80` : undefined,
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
                  style={{ color: selectedSt!.colorCode }}
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
              <ComboIndicator
                combo={combo}
                multiplier={multiplier}
                teamColor={selectedSt!.colorCode}
              />

              <ClickButton
                teamColor={selectedSt!.colorCode}
                combo={combo}
                multiplier={multiplier}
                isBurst={myIsBurst}
                myTotal={myTotal}
                ripples={ripples}
                floatingScores={floatingScores}
                onClick={handleClick}
              />

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
