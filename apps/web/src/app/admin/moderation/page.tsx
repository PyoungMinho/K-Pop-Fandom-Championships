"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { getCheers, hideCheer, showCheer, bulkHideCheers, getSeasons } from "@/lib/admin-api";

// ─── 타입 ─────────────────────────────────────────────────────────────────────

interface Cheer {
  id: string;
  content: string;
  isVisible: boolean;
  createdAt: string;
  team?: { id: string; name: string; colorCode?: string };
  user?: { nickname?: string };
}

interface CheersResponse {
  items: Cheer[];
  total: number;
  page: number;
  totalPages: number;
}

// ─── 유틸 ────────────────────────────────────────────────────────────────────

function formatTime(iso: string) {
  return new Date(iso).toLocaleString("ko-KR", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

// ─── 컴포넌트 ─────────────────────────────────────────────────────────────────

export default function ModerationPage() {
  const [cheers, setCheers] = useState<CheersResponse>({
    items: [],
    total: 0,
    page: 1,
    totalPages: 1,
  });
  const [seasons, setSeasons] = useState<any[]>([]);
  const [selectedSeasonId, setSelectedSeasonId] = useState<string>("");
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [filterVisible, setFilterVisible] = useState<string>("");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [bulkProcessing, setBulkProcessing] = useState(false);

  // 시즌 목록 최초 로드
  useEffect(() => {
    getSeasons()
      .then((list) => {
        setSeasons(list);
        const active = list.find((s: any) => s.status === "active") ?? list[0];
        if (active) setSelectedSeasonId(active.id);
      })
      .catch(() => {});
  }, []);

  // 메시지 목록 로드
  const loadCheers = useCallback(() => {
    setLoading(true);
    setError(null);
    const params: Record<string, string | number> = { page, limit: 20 };
    if (search.trim()) params.search = search.trim();
    if (filterVisible) params.isVisible = filterVisible;
    if (selectedSeasonId) params.seasonId = selectedSeasonId;

    getCheers(params)
      .then((data) => setCheers(data))
      .catch((e) => setError(e.message || "메시지를 불러오지 못했습니다"))
      .finally(() => setLoading(false));
  }, [page, search, filterVisible, selectedSeasonId]);

  useEffect(() => {
    setSelected(new Set()); // 필터 변경 시 선택 초기화
    loadCheers();
  }, [loadCheers]);

  // 개별 공개/숨김 토글
  const handleToggle = async (id: string, isVisible: boolean) => {
    setTogglingId(id);
    try {
      if (isVisible) {
        await hideCheer(id);
      } else {
        await showCheer(id);
      }
      setCheers((prev) => ({
        ...prev,
        items: prev.items.map((c) =>
          c.id === id ? { ...c, isVisible: !isVisible } : c
        ),
      }));
    } catch (e: any) {
      alert(e.message || "처리에 실패했습니다");
    } finally {
      setTogglingId(null);
    }
  };

  // 일괄 숨김
  const handleBulkHide = async () => {
    if (selected.size === 0) return;
    setBulkProcessing(true);
    try {
      await bulkHideCheers(Array.from(selected));
      setSelected(new Set());
      loadCheers();
    } catch (e: any) {
      alert(e.message || "일괄 처리에 실패했습니다");
    } finally {
      setBulkProcessing(false);
    }
  };

  // 체크박스 제어
  const toggleSelect = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleAll = () => {
    if (selected.size === cheers.items.length && cheers.items.length > 0) {
      setSelected(new Set());
    } else {
      setSelected(new Set(cheers.items.map((c) => c.id)));
    }
  };

  const allChecked =
    cheers.items.length > 0 && selected.size === cheers.items.length;

  return (
    <div>
      {/* 헤더 */}
      <div className="mb-6">
        <h1 className="text-2xl font-black text-ink">응원 메시지 관리</h1>
        <p className="text-sm text-ink-muted mt-1">
          욕설·비방이 포함된 메시지를 검토하고 숨길 수 있습니다
        </p>
      </div>

      {/* 필터 바 */}
      <div className="flex flex-wrap items-center gap-3 mb-5">
        {/* 시즌 선택 */}
        <select
          value={selectedSeasonId}
          onChange={(e) => {
            setSelectedSeasonId(e.target.value);
            setPage(1);
          }}
          className="px-4 py-2.5 rounded-xl bg-white border border-gray-200 text-sm outline-none focus:border-coral"
        >
          <option value="">전체 시즌</option>
          {seasons.map((s) => (
            <option key={s.id} value={s.id}>
              {s.title}
              {s.status === "active" ? " (진행중)" : ""}
            </option>
          ))}
        </select>

        {/* 검색 */}
        <input
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
          placeholder="메시지 검색..."
          className="px-4 py-2.5 rounded-xl bg-white border border-gray-200 text-sm outline-none focus:border-coral w-56"
        />

        {/* 공개 여부 필터 */}
        <select
          value={filterVisible}
          onChange={(e) => {
            setFilterVisible(e.target.value);
            setPage(1);
          }}
          className="px-4 py-2.5 rounded-xl bg-white border border-gray-200 text-sm outline-none focus:border-coral"
        >
          <option value="">전체 상태</option>
          <option value="true">공개만</option>
          <option value="false">숨김만</option>
        </select>

        {/* 일괄 숨김 버튼 */}
        <AnimatePresence>
          {selected.size > 0 && (
            <motion.button
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              onClick={handleBulkHide}
              disabled={bulkProcessing}
              className="px-4 py-2.5 rounded-xl bg-red-500 text-white text-sm font-semibold hover:bg-red-600 transition-colors disabled:opacity-50"
            >
              {bulkProcessing ? "처리 중..." : `🛡️ ${selected.size}개 숨기기`}
            </motion.button>
          )}
        </AnimatePresence>

        {/* 카운트 */}
        <span className="text-xs text-ink-muted ml-auto">
          총 {cheers.total.toLocaleString()}개 · {cheers.page}/{cheers.totalPages} 페이지
        </span>
      </div>

      {/* 테이블 */}
      <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
        {loading ? (
          <ModerationSkeleton />
        ) : error ? (
          <ErrorState message={error} onRetry={loadCheers} />
        ) : cheers.items.length === 0 ? (
          <EmptyState />
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="px-4 py-3.5 w-10">
                  <input
                    type="checkbox"
                    checked={allChecked}
                    onChange={toggleAll}
                    className="rounded accent-coral"
                  />
                </th>
                <th className="text-left px-4 py-3.5 text-xs font-bold text-ink-muted uppercase tracking-wide">
                  시간
                </th>
                <th className="text-left px-4 py-3.5 text-xs font-bold text-ink-muted uppercase tracking-wide hidden md:table-cell">
                  팀
                </th>
                <th className="text-left px-4 py-3.5 text-xs font-bold text-ink-muted uppercase tracking-wide">
                  내용
                </th>
                <th className="text-left px-4 py-3.5 text-xs font-bold text-ink-muted uppercase tracking-wide hidden sm:table-cell">
                  상태
                </th>
                <th className="text-right px-4 py-3.5 text-xs font-bold text-ink-muted uppercase tracking-wide">
                  액션
                </th>
              </tr>
            </thead>
            <tbody>
              {cheers.items.map((msg, i) => (
                <motion.tr
                  key={msg.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: i * 0.02 }}
                  className={`border-b border-gray-50 transition-colors ${
                    !msg.isVisible ? "bg-red-50/30" : "hover:bg-gray-50/50"
                  } ${selected.has(msg.id) ? "bg-coral/5" : ""}`}
                >
                  <td className="px-4 py-3.5">
                    <input
                      type="checkbox"
                      checked={selected.has(msg.id)}
                      onChange={() => toggleSelect(msg.id)}
                      className="rounded accent-coral"
                    />
                  </td>
                  <td className="px-4 py-3.5 text-xs text-ink-muted whitespace-nowrap">
                    {formatTime(msg.createdAt)}
                  </td>
                  <td className="px-4 py-3.5 hidden md:table-cell">
                    {msg.team ? (
                      <span
                        className="inline-flex items-center gap-1.5 text-xs font-semibold px-2 py-1 rounded-full"
                        style={{
                          backgroundColor: msg.team.colorCode
                            ? `${msg.team.colorCode}20`
                            : "#f3f4f6",
                          color: msg.team.colorCode ?? "#6b7280",
                        }}
                      >
                        {msg.team.name}
                      </span>
                    ) : (
                      <span className="text-xs text-ink-muted">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3.5 max-w-xs">
                    <p
                      className={`text-sm leading-snug ${
                        !msg.isVisible
                          ? "line-through text-ink-muted"
                          : "text-ink"
                      }`}
                    >
                      {msg.content}
                    </p>
                    {msg.user?.nickname && (
                      <p className="text-xs text-ink-muted mt-0.5">
                        @{msg.user.nickname}
                      </p>
                    )}
                  </td>
                  <td className="px-4 py-3.5 hidden sm:table-cell">
                    <span
                      className={`text-xs px-2.5 py-1 rounded-full font-semibold ${
                        msg.isVisible
                          ? "bg-green-100 text-green-700"
                          : "bg-red-100 text-red-700"
                      }`}
                    >
                      {msg.isVisible ? "공개" : "숨김"}
                    </span>
                  </td>
                  <td className="px-4 py-3.5 text-right">
                    <button
                      onClick={() => handleToggle(msg.id, msg.isVisible)}
                      disabled={togglingId === msg.id}
                      className={`text-xs font-semibold transition-colors disabled:opacity-40 ${
                        msg.isVisible
                          ? "text-red-500 hover:text-red-700"
                          : "text-green-600 hover:text-green-800"
                      }`}
                    >
                      {togglingId === msg.id
                        ? "..."
                        : msg.isVisible
                        ? "숨기기"
                        : "복원"}
                    </button>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* 페이지네이션 */}
      {cheers.totalPages > 1 && (
        <div className="flex justify-center gap-1.5 mt-5">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className="w-9 h-9 rounded-xl text-sm font-semibold bg-white text-ink-muted hover:bg-gray-50 disabled:opacity-30 transition-colors"
          >
            ‹
          </button>
          {Array.from({ length: cheers.totalPages }, (_, i) => i + 1)
            .filter(
              (p) =>
                p === 1 ||
                p === cheers.totalPages ||
                Math.abs(p - page) <= 2
            )
            .reduce<(number | "...")[]>((acc, p, idx, arr) => {
              if (idx > 0 && p - (arr[idx - 1] as number) > 1) acc.push("...");
              acc.push(p);
              return acc;
            }, [])
            .map((p, idx) =>
              p === "..." ? (
                <span
                  key={`ellipsis-${idx}`}
                  className="w-9 h-9 flex items-center justify-center text-sm text-ink-muted"
                >
                  …
                </span>
              ) : (
                <button
                  key={p}
                  onClick={() => setPage(p as number)}
                  className={`w-9 h-9 rounded-xl text-sm font-semibold transition-colors ${
                    p === page
                      ? "bg-coral text-white shadow-sm"
                      : "bg-white text-ink-muted hover:bg-gray-50"
                  }`}
                >
                  {p}
                </button>
              )
            )}
          <button
            onClick={() => setPage((p) => Math.min(cheers.totalPages, p + 1))}
            disabled={page === cheers.totalPages}
            className="w-9 h-9 rounded-xl text-sm font-semibold bg-white text-ink-muted hover:bg-gray-50 disabled:opacity-30 transition-colors"
          >
            ›
          </button>
        </div>
      )}
    </div>
  );
}

// ─── 서브 컴포넌트 ────────────────────────────────────────────────────────────

function ModerationSkeleton() {
  return (
    <div className="p-6 space-y-3">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="flex gap-4 animate-pulse">
          <div className="w-5 h-5 bg-gray-100 rounded" />
          <div className="h-5 bg-gray-100 rounded-lg w-20" />
          <div className="h-5 bg-gray-100 rounded-lg w-16" />
          <div className="h-5 bg-gray-100 rounded-lg flex-1" />
          <div className="h-5 bg-gray-100 rounded-lg w-12" />
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

function EmptyState() {
  return (
    <div className="py-16 flex flex-col items-center text-center gap-3">
      <span className="text-5xl">📭</span>
      <p className="text-sm font-semibold text-ink">메시지가 없습니다</p>
      <p className="text-xs text-ink-muted">선택한 시즌에 응원 메시지가 아직 없습니다</p>
    </div>
  );
}
