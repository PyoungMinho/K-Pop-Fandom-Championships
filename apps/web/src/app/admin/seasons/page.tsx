"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  getSeasons,
  createSeason,
  updateSeason,
  getTeams,
  addTeamToSeason,
} from "@/lib/admin-api";

interface Team {
  id: string;
  name: string;
  shortName: string;
  colorCode: string;
  logoUrl: string | null;
}

interface SeasonTeam {
  id: string;
  seedOrder: number | null;
  team: Team;
}

interface Season {
  id: string;
  seasonNumber: number;
  title: string;
  status: "UPCOMING" | "ACTIVE" | "COMPLETED";
  phase: "BATTLE" | "WINNER" | "NOMINATION";
  startDate: string;
  endDate: string;
  seasonTeams: SeasonTeam[];
}

const STATUS_LABELS: Record<string, { label: string; color: string; bg: string }> = {
  UPCOMING: {
    label: "준비중",
    color: "text-sky-600",
    bg: "bg-sky-50 border-sky-200",
  },
  ACTIVE: {
    label: "진행중",
    color: "text-green-600",
    bg: "bg-green-50 border-green-200",
  },
  COMPLETED: {
    label: "완료",
    color: "text-gray-500",
    bg: "bg-gray-50 border-gray-200",
  },
};

const PHASE_LABELS: Record<string, string> = {
  BATTLE: "배틀",
  WINNER: "우승",
  NOMINATION: "투표",
};

const STATUS_FLOW: Array<Season["status"]> = ["UPCOMING", "ACTIVE", "COMPLETED"];

function StatusBadge({ status }: { status: Season["status"] }) {
  const s = STATUS_LABELS[status] ?? STATUS_LABELS.UPCOMING;
  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold border ${s.bg} ${s.color}`}
    >
      {status === "ACTIVE" && (
        <span className="w-1.5 h-1.5 rounded-full bg-green-500 mr-1.5 animate-pulse" />
      )}
      {s.label}
    </span>
  );
}

function TeamChip({ st }: { st: SeasonTeam }) {
  return (
    <span
      className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold text-white"
      style={{ backgroundColor: st.team?.colorCode || "#ccc" }}
      title={st.team?.name}
    >
      {st.team?.shortName || "?"}
    </span>
  );
}

function formatDate(dateStr: string) {
  const d = new Date(dateStr);
  return d.toLocaleDateString("ko-KR", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
}

export default function SeasonsPage() {
  const [seasons, setSeasons] = useState<Season[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 시즌 생성 모달
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createForm, setCreateForm] = useState({
    seasonNumber: 1,
    title: "",
    startDate: "",
    endDate: "",
  });
  const [createError, setCreateError] = useState<string | null>(null);

  // 팀 추가 모달
  const [addTeamModal, setAddTeamModal] = useState<string | null>(null);
  const [addingTeam, setAddingTeam] = useState(false);

  // 상태 변경 로딩
  const [statusLoading, setStatusLoading] = useState<string | null>(null);

  const load = useCallback(() => {
    setLoading(true);
    Promise.all([
      getSeasons() as Promise<Season[]>,
      getTeams() as Promise<Team[]>,
    ])
      .then(([s, t]) => {
        setSeasons(s);
        setTeams(t);
        setError(null);
      })
      .catch((err) => setError(err.message || "데이터 로드 실패"))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreateError(null);
    setSaving(true);
    try {
      await createSeason({
        ...createForm,
        startDate: new Date(createForm.startDate).toISOString(),
        endDate: new Date(createForm.endDate).toISOString(),
      });
      setShowCreateModal(false);
      setCreateForm({ seasonNumber: 1, title: "", startDate: "", endDate: "" });
      load();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "시즌 생성 실패";
      setCreateError(msg);
    } finally {
      setSaving(false);
    }
  };

  const handleStatusChange = async (id: string, status: string) => {
    setStatusLoading(id + "_status");
    try {
      await updateSeason(id, { status });
      load();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "상태 변경 실패";
      setError(msg);
    } finally {
      setStatusLoading(null);
    }
  };

  const handlePhaseChange = async (id: string, phase: string) => {
    setStatusLoading(id + "_phase");
    try {
      await updateSeason(id, { phase });
      load();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "페이즈 변경 실패";
      setError(msg);
    } finally {
      setStatusLoading(null);
    }
  };

  const handleAddTeam = async (seasonId: string, teamId: string) => {
    setAddingTeam(true);
    try {
      await addTeamToSeason(seasonId, teamId);
      setAddTeamModal(null);
      load();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "팀 추가 실패";
      setError(msg);
    } finally {
      setAddingTeam(false);
    }
  };

  // 특정 시즌에 이미 등록된 teamId 목록
  const getSeasonTeamIds = (season: Season) =>
    new Set((season.seasonTeams ?? []).map((st) => st.team?.id));

  // 다음 상태로 이동하는 버튼
  const getNextStatus = (current: Season["status"]): Season["status"] | null => {
    const idx = STATUS_FLOW.indexOf(current);
    return idx < STATUS_FLOW.length - 1 ? STATUS_FLOW[idx + 1] : null;
  };

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-black text-ink">시즌 관리</h1>
          <p className="text-sm text-ink-muted mt-1">
            대회 시즌을 생성하고 팀을 배정합니다
          </p>
        </div>
        <button
          onClick={() => {
            setCreateError(null);
            setShowCreateModal(true);
          }}
          className="btn-primary text-sm"
        >
          + 시즌 생성
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

      {/* Create Modal */}
      <AnimatePresence>
        {showCreateModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4"
            onClick={() => setShowCreateModal(false)}
          >
            <motion.div
              initial={{ scale: 0.92, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.92, y: 20 }}
              transition={{ type: "spring", stiffness: 300, damping: 25 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl"
            >
              <h2 className="text-lg font-bold mb-5">시즌 생성</h2>
              <form onSubmit={handleCreate} className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-semibold mb-1.5">
                      시즌 번호
                    </label>
                    <input
                      type="number"
                      min={1}
                      value={createForm.seasonNumber}
                      onChange={(e) =>
                        setCreateForm({
                          ...createForm,
                          seasonNumber: +e.target.value,
                        })
                      }
                      className="w-full px-4 py-2.5 rounded-xl bg-gray-50 border border-gray-200 text-sm outline-none focus:border-coral focus:ring-2 focus:ring-coral/20 transition-all"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold mb-1.5">
                      시즌 제목
                    </label>
                    <input
                      value={createForm.title}
                      onChange={(e) =>
                        setCreateForm({ ...createForm, title: e.target.value })
                      }
                      placeholder="예: 2026 봄 운동회"
                      className="w-full px-4 py-2.5 rounded-xl bg-gray-50 border border-gray-200 text-sm outline-none focus:border-coral focus:ring-2 focus:ring-coral/20 transition-all"
                      required
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-semibold mb-1.5">
                      시작일
                    </label>
                    <input
                      type="datetime-local"
                      value={createForm.startDate}
                      onChange={(e) =>
                        setCreateForm({
                          ...createForm,
                          startDate: e.target.value,
                        })
                      }
                      className="w-full px-4 py-2.5 rounded-xl bg-gray-50 border border-gray-200 text-sm outline-none focus:border-coral focus:ring-2 focus:ring-coral/20 transition-all"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold mb-1.5">
                      종료일
                    </label>
                    <input
                      type="datetime-local"
                      value={createForm.endDate}
                      onChange={(e) =>
                        setCreateForm({
                          ...createForm,
                          endDate: e.target.value,
                        })
                      }
                      className="w-full px-4 py-2.5 rounded-xl bg-gray-50 border border-gray-200 text-sm outline-none focus:border-coral focus:ring-2 focus:ring-coral/20 transition-all"
                      required
                    />
                  </div>
                </div>

                {/* 미리보기 */}
                {createForm.title && (
                  <div className="p-3 bg-gray-50 rounded-xl">
                    <div className="text-sm font-bold">
                      시즌 {createForm.seasonNumber}: {createForm.title}
                    </div>
                    {createForm.startDate && createForm.endDate && (
                      <div className="text-xs text-ink-muted mt-0.5">
                        {formatDate(createForm.startDate)} ~{" "}
                        {formatDate(createForm.endDate)}
                      </div>
                    )}
                  </div>
                )}

                <AnimatePresence>
                  {createError && (
                    <motion.div
                      initial={{ opacity: 0, y: -4 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                      className="text-sm text-red-500 font-medium bg-red-50 px-4 py-2 rounded-xl"
                    >
                      {createError}
                    </motion.div>
                  )}
                </AnimatePresence>

                <div className="flex gap-3 pt-1">
                  <button
                    type="button"
                    onClick={() => setShowCreateModal(false)}
                    className="flex-1 py-2.5 rounded-xl bg-gray-100 text-sm font-semibold hover:bg-gray-200 transition-colors"
                  >
                    취소
                  </button>
                  <button
                    type="submit"
                    disabled={saving}
                    className="flex-1 btn-primary py-2.5 text-sm disabled:opacity-60"
                  >
                    {saving ? "생성 중..." : "생성"}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Add Team Modal */}
      <AnimatePresence>
        {addTeamModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4"
            onClick={() => setAddTeamModal(null)}
          >
            <motion.div
              initial={{ scale: 0.92, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.92, y: 20 }}
              transition={{ type: "spring", stiffness: 300, damping: 25 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-2xl"
            >
              <h2 className="text-lg font-bold mb-4">참가 팀 추가</h2>
              {(() => {
                const season = seasons.find((s) => s.id === addTeamModal);
                const alreadyIds = season ? getSeasonTeamIds(season) : new Set();
                const available = teams.filter((t) => !alreadyIds.has(t.id));
                return available.length === 0 ? (
                  <div className="text-center py-8 text-ink-muted text-sm">
                    <div className="text-3xl mb-2">✅</div>
                    모든 팀이 이미 추가되었습니다
                  </div>
                ) : (
                  <div className="space-y-2">
                    {available.map((t) => (
                      <button
                        key={t.id}
                        onClick={() => handleAddTeam(addTeamModal!, t.id)}
                        disabled={addingTeam}
                        className="w-full flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-gray-50 transition-colors text-left disabled:opacity-60"
                      >
                        <div
                          className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-xs font-bold shrink-0"
                          style={{ backgroundColor: t.colorCode }}
                        >
                          {t.shortName}
                        </div>
                        <span className="font-semibold text-sm">{t.name}</span>
                      </button>
                    ))}
                  </div>
                );
              })()}
              <button
                onClick={() => setAddTeamModal(null)}
                className="w-full mt-4 py-2.5 rounded-xl bg-gray-100 text-sm font-semibold hover:bg-gray-200 transition-colors"
              >
                닫기
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Seasons List */}
      {loading ? (
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <div
              key={i}
              className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 animate-pulse"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="space-y-2">
                  <div className="h-5 bg-gray-100 rounded w-40" />
                  <div className="h-3.5 bg-gray-100 rounded w-56" />
                </div>
                <div className="flex gap-2">
                  <div className="h-7 bg-gray-100 rounded w-20" />
                  <div className="h-7 bg-gray-100 rounded w-20" />
                </div>
              </div>
              <div className="flex gap-2">
                <div className="h-6 bg-gray-100 rounded-full w-16" />
                <div className="h-6 bg-gray-100 rounded-full w-16" />
              </div>
            </div>
          ))}
        </div>
      ) : seasons.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-2xl p-16 text-center shadow-sm border border-gray-100"
        >
          <div className="text-5xl mb-4">🗓️</div>
          <div className="font-bold text-ink mb-1">시즌이 없습니다</div>
          <div className="text-sm text-ink-muted mb-5">
            첫 번째 시즌을 생성해서 팀을 배정해 보세요
          </div>
          <button
            onClick={() => {
              setCreateError(null);
              setShowCreateModal(true);
            }}
            className="btn-primary text-sm"
          >
            + 시즌 생성
          </button>
        </motion.div>
      ) : (
        <div className="space-y-4">
          {seasons
            .slice()
            .sort((a, b) => b.seasonNumber - a.seasonNumber)
            .map((season, i) => {
              const nextStatus = getNextStatus(season.status);
              const isStatusLoading = statusLoading === season.id + "_status";
              const isPhaseLoading = statusLoading === season.id + "_phase";
              const alreadyIds = getSeasonTeamIds(season);
              const canAddMore = teams.some((t) => !alreadyIds.has(t.id));

              return (
                <motion.div
                  key={season.id}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.06 }}
                  className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100"
                >
                  {/* 시즌 헤더 */}
                  <div className="flex items-start justify-between mb-4 gap-4">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-bold text-lg leading-tight">
                          {season.title}
                        </h3>
                        <StatusBadge status={season.status} />
                        <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-ink-muted font-semibold">
                          {PHASE_LABELS[season.phase] ?? season.phase}
                        </span>
                      </div>
                      <p className="text-xs text-ink-muted mt-1.5">
                        시즌 {season.seasonNumber} ·{" "}
                        {formatDate(season.startDate)} ~{" "}
                        {formatDate(season.endDate)}
                      </p>
                    </div>

                    {/* 컨트롤 */}
                    <div className="flex items-center gap-2 shrink-0 flex-wrap justify-end">
                      {/* 상태 단계 버튼 */}
                      {nextStatus && (
                        <button
                          onClick={() =>
                            handleStatusChange(season.id, nextStatus)
                          }
                          disabled={isStatusLoading}
                          className="text-xs px-3 py-1.5 rounded-lg bg-coral text-white font-semibold hover:bg-coral-dark transition-colors disabled:opacity-60 whitespace-nowrap"
                        >
                          {isStatusLoading
                            ? "변경 중..."
                            : `→ ${STATUS_LABELS[nextStatus].label}`}
                        </button>
                      )}
                      {/* 상태 select */}
                      <select
                        value={season.status}
                        onChange={(e) =>
                          handleStatusChange(season.id, e.target.value)
                        }
                        disabled={isStatusLoading}
                        className="text-xs px-2.5 py-1.5 rounded-lg bg-gray-50 border border-gray-200 font-semibold outline-none focus:border-coral disabled:opacity-60 cursor-pointer"
                      >
                        <option value="UPCOMING">준비중</option>
                        <option value="ACTIVE">진행중</option>
                        <option value="COMPLETED">완료</option>
                      </select>
                      {/* 페이즈 select */}
                      <select
                        value={season.phase}
                        onChange={(e) =>
                          handlePhaseChange(season.id, e.target.value)
                        }
                        disabled={isPhaseLoading}
                        className="text-xs px-2.5 py-1.5 rounded-lg bg-gray-50 border border-gray-200 font-semibold outline-none focus:border-coral disabled:opacity-60 cursor-pointer"
                      >
                        <option value="BATTLE">배틀</option>
                        <option value="WINNER">우승</option>
                        <option value="NOMINATION">투표</option>
                      </select>
                    </div>
                  </div>

                  {/* 팀 칩 */}
                  <div className="flex items-center gap-2 flex-wrap">
                    {(season.seasonTeams ?? []).length === 0 ? (
                      <span className="text-xs text-ink-muted">
                        참가 팀이 없습니다
                      </span>
                    ) : (
                      (season.seasonTeams ?? [])
                        .slice()
                        .sort(
                          (a, b) => (a.seedOrder ?? 99) - (b.seedOrder ?? 99)
                        )
                        .map((st) => <TeamChip key={st.id} st={st} />)
                    )}
                    {canAddMore && (
                      <button
                        onClick={() => setAddTeamModal(season.id)}
                        className="px-3 py-1 rounded-full text-xs font-semibold border-2 border-dashed border-gray-300 text-ink-muted hover:border-coral hover:text-coral transition-colors"
                      >
                        + 팀 추가
                      </button>
                    )}
                    {!canAddMore && teams.length > 0 && (
                      <span className="text-xs text-ink-muted italic">
                        모든 팀 참가 중
                      </span>
                    )}
                  </div>

                  {/* 팀 수 표시 */}
                  {(season.seasonTeams ?? []).length > 0 && (
                    <div className="mt-3 pt-3 border-t border-gray-50 flex items-center justify-between">
                      <span className="text-xs text-ink-muted">
                        {(season.seasonTeams ?? []).length}개 팀 참가
                      </span>
                      {season.status === "ACTIVE" && (
                        <span className="text-xs font-semibold text-green-600 flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                          라이브
                        </span>
                      )}
                    </div>
                  )}
                </motion.div>
              );
            })}
        </div>
      )}
    </div>
  );
}
