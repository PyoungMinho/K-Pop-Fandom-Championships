"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { getGameEvents, createGameEvent, updateGameEvent, getSeasons } from "@/lib/admin-api";

// ─── 상수 ────────────────────────────────────────────────────────────────────

const GAME_TYPES = [
  { value: "click_burst", label: "클릭 대전", icon: "🎯", color: "bg-coral/10 text-coral" },
  { value: "baton_relay", label: "이어달리기", icon: "🏃", color: "bg-mint/10 text-mint-dark" },
  { value: "cheer_board", label: "응원 게시판", icon: "📣", color: "bg-lavender/10 text-lavender" },
  { value: "hot_time", label: "핫타임", icon: "🔥", color: "bg-sunny/20 text-sunny-dark" },
] as const;

const STATUS_MAP: Record<string, { label: string; cls: string; next: string; nextLabel: string }> = {
  scheduled: {
    label: "예정",
    cls: "bg-gray-100 text-gray-600",
    next: "active",
    nextLabel: "활성화",
  },
  active: {
    label: "활성",
    cls: "bg-green-100 text-green-700",
    next: "completed",
    nextLabel: "완료 처리",
  },
  completed: {
    label: "완료",
    cls: "bg-blue-100 text-blue-700",
    next: "scheduled",
    nextLabel: "예정으로",
  },
};

const EMPTY_FORM = {
  seasonId: "",
  gameType: "click_burst" as string,
  dayNumber: 1,
  startTime: "",
  endTime: "",
  goal: 10000,
};

// ─── 유틸 ────────────────────────────────────────────────────────────────────

function formatDateTime(iso: string) {
  return new Date(iso).toLocaleString("ko-KR", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function getGameType(value: string) {
  return GAME_TYPES.find((g) => g.value === value);
}

// ─── 컴포넌트 ─────────────────────────────────────────────────────────────────

export default function GameEventsPage() {
  const [events, setEvents] = useState<any[]>([]);
  const [seasons, setSeasons] = useState<any[]>([]);
  const [selectedSeasonId, setSelectedSeasonId] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [changingStatus, setChangingStatus] = useState<string | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);

  // 시즌 목록 최초 로드
  useEffect(() => {
    getSeasons()
      .then((list) => {
        setSeasons(list);
        // 활성 시즌 자동 선택
        const active = list.find((s: any) => s.status === "active") ?? list[0];
        if (active) setSelectedSeasonId(active.id);
      })
      .catch(() => {});
  }, []);

  // 이벤트 목록 로드 (시즌 변경 시 재조회)
  const loadEvents = useCallback(() => {
    setLoading(true);
    setError(null);
    getGameEvents(selectedSeasonId || undefined)
      .then(setEvents)
      .catch((e) => setError(e.message || "이벤트를 불러오지 못했습니다"))
      .finally(() => setLoading(false));
  }, [selectedSeasonId]);

  useEffect(() => {
    loadEvents();
  }, [loadEvents]);

  // 이벤트 생성
  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await createGameEvent({
        seasonId: form.seasonId,
        gameType: form.gameType,
        dayNumber: form.dayNumber,
        startTime: new Date(form.startTime).toISOString(),
        endTime: new Date(form.endTime).toISOString(),
        config: { goal: form.goal },
      });
      setShowForm(false);
      setForm(EMPTY_FORM);
      loadEvents();
    } catch (e: any) {
      alert(e.message || "생성에 실패했습니다");
    } finally {
      setSubmitting(false);
    }
  };

  // 상태 변경
  const handleStatusChange = async (id: string, nextStatus: string) => {
    setChangingStatus(id);
    try {
      await updateGameEvent(id, { status: nextStatus });
      setEvents((prev) =>
        prev.map((ev) => (ev.id === id ? { ...ev, status: nextStatus } : ev))
      );
    } catch (e: any) {
      alert(e.message || "상태 변경에 실패했습니다");
    } finally {
      setChangingStatus(null);
    }
  };

  return (
    <div>
      {/* 헤더 */}
      <div className="flex flex-wrap items-start justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-black text-ink">게임 이벤트</h1>
          <p className="text-sm text-ink-muted mt-1">일별 게임 이벤트를 생성하고 활성화합니다</p>
        </div>
        <button
          onClick={() => {
            setForm({ ...EMPTY_FORM, seasonId: selectedSeasonId });
            setShowForm(true);
          }}
          className="btn-primary text-sm px-5 py-2.5"
        >
          + 이벤트 생성
        </button>
      </div>

      {/* 시즌 필터 */}
      <div className="flex items-center gap-3 mb-5">
        <label className="text-sm font-semibold text-ink-muted whitespace-nowrap">시즌 선택</label>
        <select
          value={selectedSeasonId}
          onChange={(e) => setSelectedSeasonId(e.target.value)}
          className="px-4 py-2.5 rounded-xl bg-white border border-gray-200 text-sm outline-none focus:border-coral min-w-[180px]"
        >
          <option value="">전체</option>
          {seasons.map((s) => (
            <option key={s.id} value={s.id}>
              {s.title}
              {s.status === "active" ? " (진행중)" : ""}
            </option>
          ))}
        </select>
        <span className="text-xs text-ink-muted">총 {events.length}개</span>
      </div>

      {/* 이벤트 목록 */}
      <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
        {loading ? (
          <LoadingSkeleton rows={4} cols={5} />
        ) : error ? (
          <ErrorState message={error} onRetry={loadEvents} />
        ) : events.length === 0 ? (
          <EmptyState
            onAdd={() => {
              setForm({ ...EMPTY_FORM, seasonId: selectedSeasonId });
              setShowForm(true);
            }}
          />
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="text-left px-5 py-3.5 text-xs font-bold text-ink-muted uppercase tracking-wide">Day</th>
                <th className="text-left px-5 py-3.5 text-xs font-bold text-ink-muted uppercase tracking-wide">게임 종류</th>
                <th className="text-left px-5 py-3.5 text-xs font-bold text-ink-muted uppercase tracking-wide hidden sm:table-cell">시간</th>
                <th className="text-left px-5 py-3.5 text-xs font-bold text-ink-muted uppercase tracking-wide">상태</th>
                <th className="text-right px-5 py-3.5 text-xs font-bold text-ink-muted uppercase tracking-wide">액션</th>
              </tr>
            </thead>
            <tbody>
              {events.map((ev, i) => {
                const gt = getGameType(ev.gameType);
                const status = STATUS_MAP[ev.status] ?? STATUS_MAP.scheduled;
                const isChanging = changingStatus === ev.id;

                return (
                  <motion.tr
                    key={ev.id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.03 }}
                    className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors"
                  >
                    <td className="px-5 py-3.5">
                      <span className="font-bold text-sm text-ink">D{ev.dayNumber}</span>
                    </td>
                    <td className="px-5 py-3.5">
                      {gt ? (
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${gt.color}`}>
                          {gt.icon} {gt.label}
                        </span>
                      ) : (
                        <span className="text-sm text-ink-muted">{ev.gameType}</span>
                      )}
                    </td>
                    <td className="px-5 py-3.5 hidden sm:table-cell">
                      <div className="text-xs text-ink-muted">
                        <span>{ev.startTime ? formatDateTime(ev.startTime) : "—"}</span>
                        <span className="mx-1.5 text-gray-300">~</span>
                        <span>{ev.endTime ? formatDateTime(ev.endTime) : "—"}</span>
                      </div>
                    </td>
                    <td className="px-5 py-3.5">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${status.cls}`}>
                        {status.label}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      {ev.status !== "completed" && (
                        <button
                          onClick={() => handleStatusChange(ev.id, status.next)}
                          disabled={isChanging}
                          className="text-xs font-semibold text-coral hover:text-coral-dark disabled:opacity-40 transition-colors"
                        >
                          {isChanging ? "처리중..." : status.nextLabel}
                        </button>
                      )}
                    </td>
                  </motion.tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* 생성 모달 */}
      <AnimatePresence>
        {showForm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4"
            onClick={() => setShowForm(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.92, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.92, y: 20 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl"
            >
              <div className="flex items-center justify-between mb-5">
                <h2 className="text-lg font-bold text-ink">게임 이벤트 생성</h2>
                <button
                  onClick={() => setShowForm(false)}
                  className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-ink-muted hover:bg-gray-200 transition-colors"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleCreate} className="space-y-4">
                {/* 시즌 */}
                <div>
                  <label className="block text-sm font-semibold text-ink mb-1.5">시즌 *</label>
                  <select
                    value={form.seasonId}
                    onChange={(e) => setForm({ ...form, seasonId: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl bg-gray-50 border border-gray-200 text-sm outline-none focus:border-coral"
                    required
                  >
                    <option value="">시즌 선택</option>
                    {seasons.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.title}
                      </option>
                    ))}
                  </select>
                </div>

                {/* 게임 종류 + Day */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-semibold text-ink mb-1.5">게임 종류</label>
                    <select
                      value={form.gameType}
                      onChange={(e) => setForm({ ...form, gameType: e.target.value })}
                      className="w-full px-4 py-2.5 rounded-xl bg-gray-50 border border-gray-200 text-sm outline-none focus:border-coral"
                    >
                      {GAME_TYPES.map((gt) => (
                        <option key={gt.value} value={gt.value}>
                          {gt.icon} {gt.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-ink mb-1.5">일차 (Day)</label>
                    <input
                      type="number"
                      value={form.dayNumber}
                      onChange={(e) => setForm({ ...form, dayNumber: Number(e.target.value) })}
                      min={1}
                      max={7}
                      className="w-full px-4 py-2.5 rounded-xl bg-gray-50 border border-gray-200 text-sm outline-none focus:border-coral"
                    />
                  </div>
                </div>

                {/* 시간 */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-semibold text-ink mb-1.5">시작 시간 *</label>
                    <input
                      type="datetime-local"
                      value={form.startTime}
                      onChange={(e) => setForm({ ...form, startTime: e.target.value })}
                      className="w-full px-4 py-2.5 rounded-xl bg-gray-50 border border-gray-200 text-sm outline-none focus:border-coral"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-ink mb-1.5">종료 시간 *</label>
                    <input
                      type="datetime-local"
                      value={form.endTime}
                      onChange={(e) => setForm({ ...form, endTime: e.target.value })}
                      className="w-full px-4 py-2.5 rounded-xl bg-gray-50 border border-gray-200 text-sm outline-none focus:border-coral"
                      required
                    />
                  </div>
                </div>

                {/* 목표 클릭 (클릭 대전만) */}
                {form.gameType === "click_burst" && (
                  <div>
                    <label className="block text-sm font-semibold text-ink mb-1.5">목표 클릭 수</label>
                    <input
                      type="number"
                      value={form.goal}
                      onChange={(e) => setForm({ ...form, goal: Number(e.target.value) })}
                      min={1000}
                      step={1000}
                      className="w-full px-4 py-2.5 rounded-xl bg-gray-50 border border-gray-200 text-sm outline-none focus:border-coral"
                    />
                  </div>
                )}

                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowForm(false)}
                    className="flex-1 py-2.5 rounded-xl bg-gray-100 text-ink font-semibold text-sm hover:bg-gray-200 transition-colors"
                  >
                    취소
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="flex-1 btn-primary py-2.5 text-sm disabled:opacity-50"
                  >
                    {submitting ? "생성 중..." : "생성"}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── 서브 컴포넌트 ────────────────────────────────────────────────────────────

function LoadingSkeleton({ rows, cols }: { rows: number; cols: number }) {
  return (
    <div className="p-6 space-y-3">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex gap-4 animate-pulse">
          {Array.from({ length: cols }).map((_, j) => (
            <div key={j} className="h-6 bg-gray-100 rounded-lg flex-1" />
          ))}
        </div>
      ))}
    </div>
  );
}

function ErrorState({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div className="py-16 flex flex-col items-center text-center gap-3">
      <span className="text-4xl">⚠️</span>
      <p className="text-sm text-red-600 font-semibold">{message}</p>
      <button
        onClick={onRetry}
        className="mt-1 text-xs text-coral hover:underline font-semibold"
      >
        다시 시도
      </button>
    </div>
  );
}

function EmptyState({ onAdd }: { onAdd: () => void }) {
  return (
    <div className="py-16 flex flex-col items-center text-center gap-3">
      <span className="text-5xl">🎮</span>
      <p className="text-sm font-semibold text-ink">이벤트가 없습니다</p>
      <p className="text-xs text-ink-muted">첫 번째 게임 이벤트를 생성해 보세요</p>
      <button onClick={onAdd} className="mt-2 btn-primary text-sm px-5 py-2.5">
        + 이벤트 생성
      </button>
    </div>
  );
}
