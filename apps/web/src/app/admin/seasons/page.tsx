"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { getSeasons, createSeason, updateSeason, getTeams, addTeamToSeason } from "@/lib/admin-api";

export default function SeasonsPage() {
  const [seasons, setSeasons] = useState<any[]>([]);
  const [teams, setTeams] = useState<any[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ seasonNumber: 1, title: "", startDate: "", endDate: "" });
  const [addTeamModal, setAddTeamModal] = useState<string | null>(null);

  const load = useCallback(() => {
    getSeasons().then(setSeasons).catch(console.error);
    getTeams().then(setTeams).catch(console.error);
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    await createSeason(form);
    setShowForm(false);
    load();
  };

  const handleStatusChange = async (id: string, status: string) => {
    await updateSeason(id, { status });
    load();
  };

  const handlePhaseChange = async (id: string, phase: string) => {
    await updateSeason(id, { phase });
    load();
  };

  const handleAddTeam = async (seasonId: string, teamId: string) => {
    await addTeamToSeason(seasonId, teamId);
    setAddTeamModal(null);
    load();
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-black text-ink">시즌 관리</h1>
          <p className="text-sm text-ink-muted mt-1">대회 시즌을 생성하고 팀을 배정합니다</p>
        </div>
        <button onClick={() => setShowForm(true)} className="btn-primary text-sm">+ 시즌 생성</button>
      </div>

      {/* Create Modal */}
      <AnimatePresence>
        {showForm && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4" onClick={() => setShowForm(false)}>
            <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} exit={{ scale: 0.9 }}
              onClick={(e) => e.stopPropagation()} className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl">
              <h2 className="text-lg font-bold mb-4">시즌 생성</h2>
              <form onSubmit={handleCreate} className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-semibold mb-1">시즌 번호</label>
                    <input type="number" value={form.seasonNumber} onChange={(e) => setForm({ ...form, seasonNumber: +e.target.value })}
                      className="w-full px-4 py-2.5 rounded-xl bg-gray-50 border border-gray-200 text-sm outline-none" required />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold mb-1">시즌 제목</label>
                    <input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })}
                      className="w-full px-4 py-2.5 rounded-xl bg-gray-50 border border-gray-200 text-sm outline-none" required />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-semibold mb-1">시작일</label>
                    <input type="datetime-local" value={form.startDate} onChange={(e) => setForm({ ...form, startDate: e.target.value })}
                      className="w-full px-4 py-2.5 rounded-xl bg-gray-50 border border-gray-200 text-sm outline-none" required />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold mb-1">종료일</label>
                    <input type="datetime-local" value={form.endDate} onChange={(e) => setForm({ ...form, endDate: e.target.value })}
                      className="w-full px-4 py-2.5 rounded-xl bg-gray-50 border border-gray-200 text-sm outline-none" required />
                  </div>
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

      {/* Add Team Modal */}
      <AnimatePresence>
        {addTeamModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4" onClick={() => setAddTeamModal(null)}>
            <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} exit={{ scale: 0.9 }}
              onClick={(e) => e.stopPropagation()} className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-2xl">
              <h2 className="text-lg font-bold mb-4">팀 추가</h2>
              <div className="space-y-2">
                {teams.map((t) => (
                  <button key={t.id} onClick={() => handleAddTeam(addTeamModal, t.id)}
                    className="w-full flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-gray-50 transition-colors text-left">
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-xs font-bold"
                      style={{ backgroundColor: t.colorCode }}>{t.shortName}</div>
                    <span className="font-semibold text-sm">{t.name}</span>
                  </button>
                ))}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Seasons List */}
      <div className="space-y-4">
        {seasons.map((season) => (
          <div key={season.id} className="bg-white rounded-2xl p-5 shadow-sm">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="font-bold text-lg">{season.title}</h3>
                <p className="text-xs text-ink-muted mt-1">
                  시즌 {season.seasonNumber} · {new Date(season.startDate).toLocaleDateString("ko-KR")} ~ {new Date(season.endDate).toLocaleDateString("ko-KR")}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <select value={season.status} onChange={(e) => handleStatusChange(season.id, e.target.value)}
                  className="text-xs px-3 py-1.5 rounded-lg bg-gray-50 border border-gray-200 font-semibold">
                  <option value="UPCOMING">준비중</option>
                  <option value="ACTIVE">진행중</option>
                  <option value="COMPLETED">완료</option>
                </select>
                <select value={season.phase} onChange={(e) => handlePhaseChange(season.id, e.target.value)}
                  className="text-xs px-3 py-1.5 rounded-lg bg-gray-50 border border-gray-200 font-semibold">
                  <option value="BATTLE">배틀</option>
                  <option value="WINNER">우승</option>
                  <option value="NOMINATION">투표</option>
                </select>
              </div>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              {season.seasonTeams?.map((st: any) => (
                <span key={st.id} className="px-3 py-1 rounded-full text-xs font-semibold text-white"
                  style={{ backgroundColor: st.team?.colorCode || "#ccc" }}>
                  {st.team?.shortName || "?"}
                </span>
              ))}
              <button onClick={() => setAddTeamModal(season.id)}
                className="px-3 py-1 rounded-full text-xs font-semibold border-2 border-dashed border-gray-300 text-ink-muted hover:border-coral hover:text-coral transition-colors">
                + 팀 추가
              </button>
            </div>
          </div>
        ))}
        {seasons.length === 0 && (
          <div className="bg-white rounded-2xl p-12 text-center text-ink-muted text-sm shadow-sm">시즌이 없습니다</div>
        )}
      </div>
    </div>
  );
}
