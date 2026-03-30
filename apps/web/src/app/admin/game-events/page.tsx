"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { getGameEvents, createGameEvent, updateGameEvent, getSeasons } from "@/lib/admin-api";

const GAME_TYPES = [
  { value: "click_burst", label: "🎯 클릭 대전" },
  { value: "baton_relay", label: "🏃‍♂️ 이어달리기" },
  { value: "cheer_board", label: "📣 응원 게시판" },
  { value: "hot_time", label: "🔥 핫타임" },
];

const STATUS_COLORS: Record<string, string> = {
  scheduled: "bg-gray-100 text-gray-600",
  active: "bg-green-100 text-green-700",
  completed: "bg-blue-100 text-blue-700",
};

export default function GameEventsPage() {
  const [events, setEvents] = useState<any[]>([]);
  const [seasons, setSeasons] = useState<any[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    seasonId: "", gameType: "click_burst", dayNumber: 1,
    startTime: "", endTime: "", goal: 10000,
  });

  const load = useCallback(() => {
    getGameEvents().then(setEvents).catch(console.error);
    getSeasons().then(setSeasons).catch(console.error);
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    await createGameEvent({
      ...form,
      config: { goal: form.goal },
    });
    setShowForm(false);
    load();
  };

  const handleStatusChange = async (id: string, status: string) => {
    await updateGameEvent(id, { status });
    load();
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-black text-ink">게임 이벤트</h1>
          <p className="text-sm text-ink-muted mt-1">일별 게임 이벤트를 생성하고 관리합니다</p>
        </div>
        <button onClick={() => setShowForm(true)} className="btn-primary text-sm">+ 이벤트 생성</button>
      </div>

      {/* Create Modal */}
      <AnimatePresence>
        {showForm && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4" onClick={() => setShowForm(false)}>
            <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} exit={{ scale: 0.9 }}
              onClick={(e) => e.stopPropagation()} className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl">
              <h2 className="text-lg font-bold mb-4">게임 이벤트 생성</h2>
              <form onSubmit={handleCreate} className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold mb-1">시즌</label>
                  <select value={form.seasonId} onChange={(e) => setForm({ ...form, seasonId: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl bg-gray-50 border border-gray-200 text-sm" required>
                    <option value="">시즌 선택</option>
                    {seasons.map((s) => <option key={s.id} value={s.id}>{s.title}</option>)}
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-semibold mb-1">게임 종류</label>
                    <select value={form.gameType} onChange={(e) => setForm({ ...form, gameType: e.target.value })}
                      className="w-full px-4 py-2.5 rounded-xl bg-gray-50 border border-gray-200 text-sm">
                      {GAME_TYPES.map((gt) => <option key={gt.value} value={gt.value}>{gt.label}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold mb-1">Day</label>
                    <input type="number" value={form.dayNumber} onChange={(e) => setForm({ ...form, dayNumber: +e.target.value })}
                      className="w-full px-4 py-2.5 rounded-xl bg-gray-50 border border-gray-200 text-sm" min={1} max={7} />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-semibold mb-1">시작 시간</label>
                    <input type="datetime-local" value={form.startTime} onChange={(e) => setForm({ ...form, startTime: e.target.value })}
                      className="w-full px-4 py-2.5 rounded-xl bg-gray-50 border border-gray-200 text-sm" required />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold mb-1">종료 시간</label>
                    <input type="datetime-local" value={form.endTime} onChange={(e) => setForm({ ...form, endTime: e.target.value })}
                      className="w-full px-4 py-2.5 rounded-xl bg-gray-50 border border-gray-200 text-sm" required />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-1">목표 클릭수 (클릭 대전)</label>
                  <input type="number" value={form.goal} onChange={(e) => setForm({ ...form, goal: +e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl bg-gray-50 border border-gray-200 text-sm" />
                </div>
                <div className="flex gap-3 pt-2">
                  <button type="button" onClick={() => setShowForm(false)} className="flex-1 py-2.5 rounded-xl bg-gray-100 font-semibold text-sm">취소</button>
                  <button type="submit" className="flex-1 btn-primary py-2.5 text-sm">생성</button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Events List */}
      <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-100">
              <th className="text-left px-5 py-3 text-xs font-bold text-ink-muted uppercase">Day</th>
              <th className="text-left px-5 py-3 text-xs font-bold text-ink-muted uppercase">게임</th>
              <th className="text-left px-5 py-3 text-xs font-bold text-ink-muted uppercase hidden sm:table-cell">시간</th>
              <th className="text-left px-5 py-3 text-xs font-bold text-ink-muted uppercase">상태</th>
              <th className="text-right px-5 py-3 text-xs font-bold text-ink-muted uppercase">액션</th>
            </tr>
          </thead>
          <tbody>
            {events.map((ev) => (
              <tr key={ev.id} className="border-b border-gray-50 hover:bg-gray-50/50">
                <td className="px-5 py-3 font-bold text-sm">D{ev.dayNumber}</td>
                <td className="px-5 py-3 text-sm">{GAME_TYPES.find((g) => g.value === ev.gameType)?.label || ev.gameType}</td>
                <td className="px-5 py-3 text-xs text-ink-muted hidden sm:table-cell">
                  {new Date(ev.startTime).toLocaleString("ko-KR", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                </td>
                <td className="px-5 py-3">
                  <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${STATUS_COLORS[ev.status] || "bg-gray-100"}`}>
                    {ev.status}
                  </span>
                </td>
                <td className="px-5 py-3 text-right">
                  <select value={ev.status} onChange={(e) => handleStatusChange(ev.id, e.target.value)}
                    className="text-xs px-2 py-1 rounded-lg bg-gray-50 border border-gray-200 font-semibold">
                    <option value="scheduled">예정</option>
                    <option value="active">활성</option>
                    <option value="completed">완료</option>
                  </select>
                </td>
              </tr>
            ))}
            {events.length === 0 && (
              <tr><td colSpan={5} className="px-5 py-12 text-center text-ink-muted text-sm">이벤트가 없습니다</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
