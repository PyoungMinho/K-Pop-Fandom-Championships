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

const EMPTY_FORM = {
  name: "",
  shortName: "",
  colorCode: "#FF6B35",
  logoUrl: "",
};

const PRESET_COLORS = [
  "#FF6B35",
  "#2EC4B6",
  "#A78BFA",
  "#FB7185",
  "#38BDF8",
  "#FFD166",
  "#06D6A0",
  "#EF476F",
  "#F77F00",
  "#4CC9F0",
];

function TeamLogoPreview({
  shortName,
  colorCode,
  logoUrl,
  size = "md",
}: {
  shortName: string;
  colorCode: string;
  logoUrl?: string;
  size?: "sm" | "md" | "lg";
}) {
  const sizeClass =
    size === "sm"
      ? "w-9 h-9 text-xs"
      : size === "lg"
        ? "w-14 h-14 text-base"
        : "w-10 h-10 text-xs";

  return (
    <div
      className={`${sizeClass} rounded-xl flex items-center justify-center text-white font-bold shrink-0 overflow-hidden`}
      style={{
        background: `linear-gradient(135deg, ${colorCode}, ${colorCode}CC)`,
      }}
    >
      {logoUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={logoUrl}
          alt={shortName}
          className="w-full h-full object-cover"
          onError={(e) => {
            (e.target as HTMLImageElement).style.display = "none";
          }}
        />
      ) : (
        <span>{shortName || "???"}</span>
      )}
    </div>
  );
}

function StatusBadge({ count }: { count: number }) {
  return (
    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold bg-coral/10 text-coral">
      {count}팀
    </span>
  );
}

export default function TeamsPage() {
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [formError, setFormError] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  const load = useCallback(() => {
    setLoading(true);
    getTeams()
      .then((data) => {
        setTeams(data as Team[]);
        setError(null);
      })
      .catch((err) => setError(err.message || "팀 목록 로드 실패"))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const openCreate = () => {
    setForm(EMPTY_FORM);
    setEditingId(null);
    setFormError(null);
    setShowForm(true);
  };

  const openEdit = (team: Team) => {
    setForm({
      name: team.name,
      shortName: team.shortName,
      colorCode: team.colorCode,
      logoUrl: team.logoUrl || "",
    });
    setEditingId(team.id);
    setFormError(null);
    setShowForm(true);
  };

  const closeForm = () => {
    setShowForm(false);
    setEditingId(null);
    setFormError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setSaving(true);
    try {
      const data = {
        name: form.name.trim(),
        shortName: form.shortName.trim(),
        colorCode: form.colorCode,
        logoUrl: form.logoUrl.trim() || null,
      };
      if (editingId) {
        await updateTeam(editingId, data);
      } else {
        await createTeam(data);
      }
      closeForm();
      load();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "저장 실패";
      setFormError(msg);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!confirmDelete) return;
    setDeleting(true);
    try {
      await deleteTeam(confirmDelete);
      setConfirmDelete(null);
      load();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "삭제 실패";
      setError(msg);
      setConfirmDelete(null);
    } finally {
      setDeleting(false);
    }
  };

  const confirmDeleteTeam = teams.find((t) => t.id === confirmDelete);

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-black text-ink">팀 관리</h1>
          <div className="flex items-center gap-2 mt-1">
            <p className="text-sm text-ink-muted">
              대결에 참가할 팀을 추가하고 관리합니다
            </p>
            {!loading && <StatusBadge count={teams.length} />}
          </div>
        </div>
        <button onClick={openCreate} className="btn-primary text-sm">
          + 팀 추가
        </button>
      </div>

      {/* Error */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="mb-4 px-4 py-3 rounded-xl bg-red-50 border border-red-100 text-red-500 text-sm font-medium flex items-center justify-between"
          >
            <span>⚠️ {error}</span>
            <button
              onClick={() => setError(null)}
              className="text-red-400 hover:text-red-600 ml-4 font-bold"
            >
              ×
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Form Modal */}
      <AnimatePresence>
        {showForm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4"
            onClick={closeForm}
          >
            <motion.div
              initial={{ scale: 0.92, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.92, y: 20 }}
              transition={{ type: "spring", stiffness: 300, damping: 25 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl"
            >
              <h2 className="text-lg font-bold mb-5">
                {editingId ? "팀 수정" : "팀 추가"}
              </h2>
              <form onSubmit={handleSubmit} className="space-y-4">
                {/* 팀 이름 */}
                <div>
                  <label className="block text-sm font-semibold mb-1.5">
                    팀 이름
                  </label>
                  <input
                    value={form.name}
                    onChange={(e) =>
                      setForm({ ...form, name: e.target.value })
                    }
                    placeholder="예: 민호팀"
                    className="w-full px-4 py-2.5 rounded-xl bg-gray-50 border border-gray-200 text-sm outline-none focus:border-coral focus:ring-2 focus:ring-coral/20 transition-all"
                    required
                  />
                </div>

                {/* 약칭 + 색상 */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-semibold mb-1.5">
                      약칭 (최대 5자)
                    </label>
                    <input
                      value={form.shortName}
                      onChange={(e) =>
                        setForm({ ...form, shortName: e.target.value })
                      }
                      maxLength={5}
                      placeholder="MH"
                      className="w-full px-4 py-2.5 rounded-xl bg-gray-50 border border-gray-200 text-sm outline-none focus:border-coral focus:ring-2 focus:ring-coral/20 transition-all"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold mb-1.5">
                      팀 색상
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={form.colorCode}
                        onChange={(e) =>
                          setForm({ ...form, colorCode: e.target.value })
                        }
                        className="w-10 h-10 rounded-lg cursor-pointer border border-gray-200 p-0.5"
                        title="색상 선택"
                      />
                      <input
                        value={form.colorCode}
                        onChange={(e) =>
                          setForm({ ...form, colorCode: e.target.value })
                        }
                        className="flex-1 px-3 py-2.5 rounded-xl bg-gray-50 border border-gray-200 text-sm outline-none font-mono focus:border-coral"
                        maxLength={7}
                      />
                    </div>
                  </div>
                </div>

                {/* 프리셋 색상 */}
                <div>
                  <label className="block text-xs font-semibold text-ink-muted mb-2">
                    색상 프리셋
                  </label>
                  <div className="flex gap-1.5 flex-wrap">
                    {PRESET_COLORS.map((color) => (
                      <button
                        key={color}
                        type="button"
                        onClick={() => setForm({ ...form, colorCode: color })}
                        className="w-6 h-6 rounded-full border-2 transition-transform hover:scale-110"
                        style={{
                          backgroundColor: color,
                          borderColor:
                            form.colorCode === color ? "#1E1B2E" : "transparent",
                        }}
                        title={color}
                      />
                    ))}
                  </div>
                </div>

                {/* 로고 URL */}
                <div>
                  <label className="block text-sm font-semibold mb-1.5">
                    로고 이미지 URL{" "}
                    <span className="text-ink-muted font-normal">(선택)</span>
                  </label>
                  <input
                    value={form.logoUrl}
                    onChange={(e) =>
                      setForm({ ...form, logoUrl: e.target.value })
                    }
                    placeholder="https://..."
                    className="w-full px-4 py-2.5 rounded-xl bg-gray-50 border border-gray-200 text-sm outline-none focus:border-coral focus:ring-2 focus:ring-coral/20 transition-all"
                  />
                </div>

                {/* 미리보기 */}
                <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-xl">
                  <TeamLogoPreview
                    shortName={form.shortName}
                    colorCode={form.colorCode}
                    logoUrl={form.logoUrl}
                    size="lg"
                  />
                  <div>
                    <div className="font-bold text-sm">
                      {form.name || "팀 이름"}
                    </div>
                    <div className="text-xs text-ink-muted mt-0.5">
                      {form.shortName || "???"} ·{" "}
                      <span className="font-mono">{form.colorCode}</span>
                    </div>
                  </div>
                </div>

                {/* 에러 */}
                <AnimatePresence>
                  {formError && (
                    <motion.div
                      initial={{ opacity: 0, y: -4 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                      className="text-sm text-red-500 font-medium bg-red-50 px-4 py-2 rounded-xl"
                    >
                      {formError}
                    </motion.div>
                  )}
                </AnimatePresence>

                <div className="flex gap-3 pt-1">
                  <button
                    type="button"
                    onClick={closeForm}
                    className="flex-1 py-2.5 rounded-xl bg-gray-100 text-sm font-semibold hover:bg-gray-200 transition-colors"
                  >
                    취소
                  </button>
                  <button
                    type="submit"
                    disabled={saving}
                    className="flex-1 btn-primary py-2.5 text-sm disabled:opacity-60"
                  >
                    {saving ? "저장 중..." : editingId ? "수정" : "추가"}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Delete Confirm Modal */}
      <AnimatePresence>
        {confirmDelete && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4"
            onClick={() => setConfirmDelete(null)}
          >
            <motion.div
              initial={{ scale: 0.92 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.92 }}
              transition={{ type: "spring", stiffness: 300, damping: 25 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-2xl text-center"
            >
              <div className="text-4xl mb-3">⚠️</div>
              <h3 className="font-bold text-lg mb-1">팀을 삭제할까요?</h3>
              {confirmDeleteTeam && (
                <div className="flex items-center justify-center gap-2 my-3">
                  <TeamLogoPreview
                    shortName={confirmDeleteTeam.shortName}
                    colorCode={confirmDeleteTeam.colorCode}
                    logoUrl={confirmDeleteTeam.logoUrl || undefined}
                    size="sm"
                  />
                  <span className="font-semibold text-sm">
                    {confirmDeleteTeam.name}
                  </span>
                </div>
              )}
              <p className="text-sm text-ink-muted mb-5">
                이 작업은 되돌릴 수 없습니다.
                <br />
                연결된 시즌 데이터에도 영향을 줄 수 있습니다.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setConfirmDelete(null)}
                  className="flex-1 py-2.5 rounded-xl bg-gray-100 font-semibold text-sm hover:bg-gray-200 transition-colors"
                >
                  취소
                </button>
                <button
                  onClick={handleDelete}
                  disabled={deleting}
                  className="flex-1 py-2.5 rounded-xl bg-red-500 text-white font-semibold text-sm hover:bg-red-600 transition-colors disabled:opacity-60"
                >
                  {deleting ? "삭제 중..." : "삭제"}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Teams Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        {loading ? (
          <div className="p-8">
            <div className="space-y-4 animate-pulse">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="flex items-center gap-4">
                  <div className="w-9 h-9 rounded-xl bg-gray-100" />
                  <div className="flex-1 space-y-1.5">
                    <div className="h-3.5 bg-gray-100 rounded w-1/4" />
                  </div>
                  <div className="h-3 bg-gray-100 rounded w-16 hidden sm:block" />
                  <div className="h-3 bg-gray-100 rounded w-20 hidden sm:block" />
                  <div className="h-3 bg-gray-100 rounded w-16" />
                </div>
              ))}
            </div>
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="text-left px-5 py-3.5 text-xs font-bold text-ink-muted uppercase tracking-wider">
                  팀
                </th>
                <th className="text-left px-5 py-3.5 text-xs font-bold text-ink-muted uppercase tracking-wider hidden sm:table-cell">
                  약칭
                </th>
                <th className="text-left px-5 py-3.5 text-xs font-bold text-ink-muted uppercase tracking-wider hidden md:table-cell">
                  색상
                </th>
                <th className="text-right px-5 py-3.5 text-xs font-bold text-ink-muted uppercase tracking-wider">
                  액션
                </th>
              </tr>
            </thead>
            <tbody>
              {teams.map((team, i) => (
                <motion.tr
                  key={team.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.04 }}
                  className="border-b border-gray-50 hover:bg-gray-50/70 transition-colors"
                >
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-3">
                      <TeamLogoPreview
                        shortName={team.shortName}
                        colorCode={team.colorCode}
                        logoUrl={team.logoUrl || undefined}
                        size="sm"
                      />
                      <span className="font-semibold text-sm">{team.name}</span>
                    </div>
                  </td>
                  <td className="px-5 py-3.5 text-sm text-ink-muted hidden sm:table-cell">
                    <span className="font-mono">{team.shortName}</span>
                  </td>
                  <td className="px-5 py-3.5 hidden md:table-cell">
                    <div className="flex items-center gap-2">
                      <span
                        className="w-4 h-4 rounded-full shrink-0 border border-black/10"
                        style={{ backgroundColor: team.colorCode }}
                      />
                      <span className="text-xs font-mono text-ink-muted">
                        {team.colorCode}
                      </span>
                    </div>
                  </td>
                  <td className="px-5 py-3.5 text-right">
                    <button
                      onClick={() => openEdit(team)}
                      className="text-xs font-semibold text-coral hover:text-coral-dark mr-4 transition-colors"
                    >
                      수정
                    </button>
                    <button
                      onClick={() => setConfirmDelete(team.id)}
                      className="text-xs font-semibold text-red-400 hover:text-red-600 transition-colors"
                    >
                      삭제
                    </button>
                  </td>
                </motion.tr>
              ))}
              {teams.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-5 py-16 text-center">
                    <div className="text-4xl mb-3">👥</div>
                    <div className="text-ink-muted text-sm font-medium">
                      등록된 팀이 없습니다
                    </div>
                    <button
                      onClick={openCreate}
                      className="mt-4 text-sm font-semibold text-coral hover:text-coral-dark transition-colors"
                    >
                      첫 번째 팀 추가하기 →
                    </button>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
