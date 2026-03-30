"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { getTeams, createTeam, updateTeam, deleteTeam } from "@/lib/admin-api";

interface Team {
  id: string;
  name: string;
  shortName: string;
  colorCode: string;
  logoUrl: string | null;
}

const EMPTY_FORM = { name: "", shortName: "", colorCode: "#FF6B35", logoUrl: "" };

export default function TeamsPage() {
  const [teams, setTeams] = useState<Team[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  const load = useCallback(() => {
    getTeams().then(setTeams).catch(console.error);
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const data = { ...form, logoUrl: form.logoUrl || null };
    if (editingId) {
      await updateTeam(editingId, data);
    } else {
      await createTeam(data);
    }
    setShowForm(false);
    setEditingId(null);
    setForm(EMPTY_FORM);
    load();
  };

  const handleEdit = (team: Team) => {
    setForm({ name: team.name, shortName: team.shortName, colorCode: team.colorCode, logoUrl: team.logoUrl || "" });
    setEditingId(team.id);
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    await deleteTeam(id);
    setConfirmDelete(null);
    load();
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-black text-ink">팀 관리</h1>
          <p className="text-sm text-ink-muted mt-1">대결에 참가할 팀을 추가하고 관리합니다</p>
        </div>
        <button
          onClick={() => { setShowForm(true); setEditingId(null); setForm(EMPTY_FORM); }}
          className="btn-primary text-sm"
        >
          + 팀 추가
        </button>
      </div>

      {/* Form Modal */}
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
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl"
            >
              <h2 className="text-lg font-bold mb-4">{editingId ? "팀 수정" : "팀 추가"}</h2>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold mb-1">팀 이름</label>
                  <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl bg-gray-50 border border-gray-200 text-sm outline-none focus:border-coral" required />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-semibold mb-1">약칭 (3자)</label>
                    <input value={form.shortName} onChange={(e) => setForm({ ...form, shortName: e.target.value })} maxLength={5}
                      className="w-full px-4 py-2.5 rounded-xl bg-gray-50 border border-gray-200 text-sm outline-none focus:border-coral" required />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold mb-1">팀 색상</label>
                    <div className="flex items-center gap-2">
                      <input type="color" value={form.colorCode} onChange={(e) => setForm({ ...form, colorCode: e.target.value })}
                        className="w-10 h-10 rounded-lg cursor-pointer border-0" />
                      <input value={form.colorCode} onChange={(e) => setForm({ ...form, colorCode: e.target.value })}
                        className="flex-1 px-3 py-2.5 rounded-xl bg-gray-50 border border-gray-200 text-sm outline-none font-mono" />
                    </div>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-1">로고 이미지 URL (선택)</label>
                  <input value={form.logoUrl} onChange={(e) => setForm({ ...form, logoUrl: e.target.value })} placeholder="https://..."
                    className="w-full px-4 py-2.5 rounded-xl bg-gray-50 border border-gray-200 text-sm outline-none focus:border-coral" />
                </div>
                {/* Preview */}
                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold text-xs"
                    style={{ background: `linear-gradient(135deg, ${form.colorCode}, ${form.colorCode}CC)` }}>
                    {form.shortName || "???"}
                  </div>
                  <span className="font-bold text-sm">{form.name || "팀 이름"}</span>
                </div>
                <div className="flex gap-3 pt-2">
                  <button type="button" onClick={() => setShowForm(false)} className="flex-1 py-2.5 rounded-xl bg-gray-100 text-sm font-semibold">취소</button>
                  <button type="submit" className="flex-1 btn-primary py-2.5 text-sm">{editingId ? "수정" : "추가"}</button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Delete Confirm */}
      <AnimatePresence>
        {confirmDelete && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4" onClick={() => setConfirmDelete(null)}>
            <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} exit={{ scale: 0.9 }}
              onClick={(e) => e.stopPropagation()} className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-2xl text-center">
              <div className="text-4xl mb-3">⚠️</div>
              <h3 className="font-bold text-lg mb-2">정말 삭제하시겠습니까?</h3>
              <p className="text-sm text-ink-muted mb-4">이 작업은 되돌릴 수 없습니다</p>
              <div className="flex gap-3">
                <button onClick={() => setConfirmDelete(null)} className="flex-1 py-2.5 rounded-xl bg-gray-100 font-semibold text-sm">취소</button>
                <button onClick={() => handleDelete(confirmDelete)} className="flex-1 py-2.5 rounded-xl bg-red-500 text-white font-semibold text-sm">삭제</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Teams Table */}
      <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-100">
              <th className="text-left px-5 py-3 text-xs font-bold text-ink-muted uppercase">팀</th>
              <th className="text-left px-5 py-3 text-xs font-bold text-ink-muted uppercase hidden sm:table-cell">약칭</th>
              <th className="text-left px-5 py-3 text-xs font-bold text-ink-muted uppercase hidden sm:table-cell">색상</th>
              <th className="text-right px-5 py-3 text-xs font-bold text-ink-muted uppercase">액션</th>
            </tr>
          </thead>
          <tbody>
            {teams.map((team) => (
              <tr key={team.id} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
                <td className="px-5 py-3">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl flex items-center justify-center text-white font-bold text-xs"
                      style={{ background: `linear-gradient(135deg, ${team.colorCode}, ${team.colorCode}CC)` }}>
                      {team.shortName}
                    </div>
                    <span className="font-semibold text-sm">{team.name}</span>
                  </div>
                </td>
                <td className="px-5 py-3 text-sm text-ink-muted hidden sm:table-cell">{team.shortName}</td>
                <td className="px-5 py-3 hidden sm:table-cell">
                  <div className="flex items-center gap-2">
                    <span className="w-4 h-4 rounded-full" style={{ backgroundColor: team.colorCode }} />
                    <span className="text-xs font-mono text-ink-muted">{team.colorCode}</span>
                  </div>
                </td>
                <td className="px-5 py-3 text-right">
                  <button onClick={() => handleEdit(team)} className="text-xs font-semibold text-coral hover:text-coral-dark mr-3">수정</button>
                  <button onClick={() => setConfirmDelete(team.id)} className="text-xs font-semibold text-red-400 hover:text-red-600">삭제</button>
                </td>
              </tr>
            ))}
            {teams.length === 0 && (
              <tr><td colSpan={4} className="px-5 py-12 text-center text-ink-muted text-sm">등록된 팀이 없습니다</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
