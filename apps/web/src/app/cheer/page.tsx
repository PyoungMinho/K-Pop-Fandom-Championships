"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MOCK_TEAMS, MOCK_SEASON_TEAMS, MOCK_GAME_EVENT, MOCK_CHEER_MESSAGES } from "@/lib/mock-data";
import TeamLogo from "@/components/TeamLogo";
import { getSocket } from "@/lib/socket";
import type { CheerMessage } from "@/lib/types";

/* ──────────── Types ──────────── */
interface TickerMessage {
  id: string;
  content: string;
  seasonTeamId: string;
  createdAt: string;
}

/* ──────────── Helpers ──────────── */
function getSeasonTeamId(teamId: string): string {
  return MOCK_SEASON_TEAMS.find((st) => st.teamId === teamId)?.id ?? teamId;
}
function getTeamBySeasonTeamId(stId: string) {
  const st = MOCK_SEASON_TEAMS.find((s) => s.id === stId);
  return MOCK_TEAMS.find((t) => t.id === st?.teamId) ?? MOCK_TEAMS[0];
}

/* ──────────── Ticker Item ──────────── */
function TickerItem({ msg, color }: { msg: TickerMessage; color: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, x: 30 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -30 }}
      transition={{ duration: 0.4 }}
      className="flex items-center gap-2 px-3 py-1.5 rounded-full text-sm whitespace-nowrap"
      style={{
        background: `${color}15`,
        border: `1px solid ${color}30`,
      }}
    >
      <span
        className="w-2 h-2 rounded-full shrink-0"
        style={{ backgroundColor: color }}
      />
      <span className="font-medium text-ink/80 max-w-[200px] truncate">{msg.content}</span>
    </motion.div>
  );
}

/* ──────────── Zone Component ──────────── */
function CheerZone({
  teamId,
  messages,
  isSelected,
  onSelect,
}: {
  teamId: string;
  messages: TickerMessage[];
  isSelected: boolean;
  onSelect: () => void;
}) {
  const team = MOCK_TEAMS.find((t) => t.id === teamId)!;
  const containerRef = useRef<HTMLDivElement>(null);

  // 최근 메시지 3개만 표시 (티커 효과)
  const recentMessages = messages.slice(0, 4);

  return (
    <motion.div
      whileHover={{ scale: 1.01 }}
      whileTap={{ scale: 0.99 }}
      onClick={onSelect}
      className={`relative rounded-2xl p-4 cursor-pointer transition-all overflow-hidden ${
        isSelected
          ? "ring-2 shadow-lg"
          : "hover:shadow-md"
      }`}
      style={{
        background: `linear-gradient(135deg, ${team.colorCode}08, ${team.colorCode}15)`,
        borderColor: isSelected ? team.colorCode : "transparent",
        ...(isSelected
          ? { boxShadow: `0 4px 20px ${team.colorCode}30` }
          : {}),
      }}
    >
      {/* Zone Header */}
      <div className="flex items-center gap-2 mb-3">
        <TeamLogo
          name={team.name}
          shortName={team.shortName}
          colorCode={team.colorCode}
          size="sm"
        />
        <div>
          <div className="font-bold text-sm">{team.name}</div>
          <div className="text-xs text-ink-muted">{messages.length}개 응원</div>
        </div>
        {isSelected && (
          <span
            className="ml-auto text-xs font-bold px-2 py-0.5 rounded-full text-white"
            style={{ backgroundColor: team.colorCode }}
          >
            선택됨
          </span>
        )}
      </div>

      {/* Ticker Messages */}
      <div ref={containerRef} className="space-y-1.5 min-h-[60px]">
        <AnimatePresence mode="popLayout">
          {recentMessages.length > 0 ? (
            recentMessages.map((msg) => (
              <TickerItem key={msg.id} msg={msg} color={team.colorCode} />
            ))
          ) : (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-xs text-ink-muted text-center py-3"
            >
              아직 응원이 없어요
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}

/* ──────────── Main Page ──────────── */
export default function CheerPage() {
  const [mounted, setMounted] = useState(false);
  const [selectedTeam, setSelectedTeam] = useState<string | null>(null);
  const [messages, setMessages] = useState<TickerMessage[]>(() =>
    MOCK_CHEER_MESSAGES.map((m) => ({
      id: m.id,
      content: m.content,
      seasonTeamId: m.seasonTeamId,
      createdAt: m.createdAt,
    })),
  );
  const [newMessage, setNewMessage] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const team = selectedTeam ? MOCK_TEAMS.find((t) => t.id === selectedTeam) : null;
  const selectedStId = selectedTeam ? getSeasonTeamId(selectedTeam) : null;

  /* ──────────── WebSocket ──────────── */
  useEffect(() => {
    setMounted(true);
    const socket = getSocket();

    // 초기 메시지 로드
    socket.emit("cheer:load", {
      gameEventId: MOCK_GAME_EVENT.id,
      limit: 100,
    });

    socket.on("cheer:messages", (data: { messages: CheerMessage[] }) => {
      setMessages(
        data.messages.map((m) => ({
          id: m.id,
          content: m.content,
          seasonTeamId: m.seasonTeamId,
          createdAt: m.createdAt,
        })),
      );
    });

    // 실시간 새 메시지
    socket.on(
      "cheer:new",
      (data: {
        id: string;
        createdAt: string;
        seasonTeamId: string;
        content: string;
      }) => {
        setMessages((prev) => [
          {
            id: data.id,
            content: data.content,
            seasonTeamId: data.seasonTeamId,
            createdAt: data.createdAt,
          },
          ...prev,
        ]);
      },
    );

    return () => {
      socket.off("cheer:messages");
      socket.off("cheer:new");
    };
  }, []);

  /* ──────────── Handlers ──────────── */
  const handleSend = () => {
    if (!newMessage.trim() || !selectedStId) return;

    const socket = getSocket();
    socket.emit("cheer:send", {
      gameEventId: MOCK_GAME_EVENT.id,
      seasonTeamId: selectedStId,
      content: newMessage.trim(),
      ipHash: "browser",
    });

    // 낙관적 업데이트
    const optimistic: TickerMessage = {
      id: `local-${Date.now()}`,
      content: newMessage.trim(),
      seasonTeamId: selectedStId,
      createdAt: new Date().toISOString(),
    };
    setMessages((prev) => [optimistic, ...prev]);
    setNewMessage("");
    inputRef.current?.focus();
  };

  /* ──────────── Derived ──────────── */
  const messagesByTeam: Record<string, TickerMessage[]> = {};
  MOCK_SEASON_TEAMS.forEach((st) => {
    messagesByTeam[st.teamId] = messages.filter(
      (m) => m.seasonTeamId === st.id,
    );
  });

  // 선택된 팀의 메시지들 (전체 타임라인)
  const selectedMessages = selectedTeam
    ? messages.filter((m) => m.seasonTeamId === selectedStId)
    : messages;

  if (!mounted) return null;

  return (
    <main className="min-h-screen pb-24 md:pb-8 pt-20">
      <div className="max-w-5xl mx-auto px-4 sm:px-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-lavender/20 rounded-full mb-3">
            <span className="text-sm">📣</span>
            <span className="text-sm font-bold text-purple-700">응원 게시판</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-black">
            <span className="gradient-text">구역별 응원석</span>
          </h1>
          <p className="text-ink-muted mt-2">팀 구역을 선택하고 응원을 보내보세요</p>
        </motion.div>

        {/* 구역별 응원석 그리드 */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-6"
        >
          {MOCK_TEAMS.map((t, i) => (
            <motion.div
              key={t.id}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.05 + i * 0.04 }}
            >
              <CheerZone
                teamId={t.id}
                messages={messagesByTeam[t.id] ?? []}
                isSelected={selectedTeam === t.id}
                onSelect={() =>
                  setSelectedTeam((prev) => (prev === t.id ? null : t.id))
                }
              />
            </motion.div>
          ))}
        </motion.div>

        {/* Message Input */}
        <AnimatePresence>
          {selectedTeam && team && (
            <motion.div
              initial={{ opacity: 0, y: 10, height: 0 }}
              animate={{ opacity: 1, y: 0, height: "auto" }}
              exit={{ opacity: 0, y: 10, height: 0 }}
              className="mb-6"
            >
              <div className="card-game">
                <div className="flex items-center gap-3 mb-3">
                  <TeamLogo
                    name={team.name}
                    shortName={team.shortName}
                    colorCode={team.colorCode}
                    size="sm"
                  />
                  <span className="font-bold text-sm">
                    {team.name} 응원석에 메시지 남기기
                  </span>
                </div>
                <div className="flex gap-2">
                  <input
                    ref={inputRef}
                    type="text"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleSend()}
                    placeholder="응원 메시지를 입력하세요..."
                    maxLength={200}
                    className="flex-1 px-4 py-3 rounded-xl bg-gray-50 border border-gray-200 text-sm outline-none focus:ring-2 transition-all"
                    style={{
                      borderColor: newMessage ? team.colorCode : undefined,
                      // @ts-expect-error CSS custom property
                      "--tw-ring-color": `${team.colorCode}30`,
                    }}
                  />
                  <button
                    onClick={handleSend}
                    disabled={!newMessage.trim()}
                    className="px-5 py-3 rounded-xl text-white font-bold text-sm transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                    style={{
                      background: newMessage.trim()
                        ? team.colorCode
                        : "#ccc",
                    }}
                  >
                    보내기
                  </button>
                </div>
                <div className="text-xs text-ink-muted mt-2 text-right">
                  {newMessage.length}/200
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* 선택 안내 */}
        {!selectedTeam && (
          <div className="card text-center py-6 mb-6 bg-gray-50 border border-dashed border-gray-200">
            <p className="text-ink-muted text-sm">
              위 응원석을 클릭하면 메시지를 작성할 수 있어요
            </p>
          </div>
        )}

        {/* Messages Timeline */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
        >
          <h3 className="font-bold mb-4 flex items-center gap-2">
            <span>💬</span>
            {selectedTeam
              ? `${team!.name} 응원 메시지`
              : "전체 응원 메시지"}
            <span className="text-sm font-normal text-ink-muted">
              ({selectedMessages.length})
            </span>
          </h3>

          <div className="space-y-2">
            <AnimatePresence mode="popLayout">
              {selectedMessages.slice(0, 30).map((msg, i) => {
                const msgTeam = getTeamBySeasonTeamId(msg.seasonTeamId);
                return (
                  <motion.div
                    key={msg.id}
                    layout
                    initial={{ opacity: 0, y: 15, scale: 0.97 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.97 }}
                    transition={{ delay: i * 0.02 }}
                    className="flex items-start gap-3 p-3 rounded-xl transition-colors hover:bg-white"
                    style={{
                      background: `${msgTeam.colorCode}06`,
                    }}
                  >
                    <TeamLogo
                      name={msgTeam.name}
                      shortName={msgTeam.shortName}
                      colorCode={msgTeam.colorCode}
                      size="sm"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className="font-bold text-sm">{msgTeam.name}</span>
                        <span className="text-xs text-ink-muted">
                          {new Date(msg.createdAt).toLocaleTimeString("ko-KR", {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                      </div>
                      <p className="text-sm leading-relaxed text-ink-light">
                        {msg.content}
                      </p>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>

            {selectedMessages.length === 0 && (
              <div className="text-center py-16">
                <div className="text-4xl mb-3">💬</div>
                <p className="text-ink-muted">아직 응원 메시지가 없어요</p>
                <p className="text-sm text-ink-muted mt-1">
                  첫 번째 응원을 남겨보세요!
                </p>
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </main>
  );
}
