"use client";

import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { getCheers, hideCheer, showCheer, bulkHideCheers } from "@/lib/admin-api";

export default function ModerationPage() {
  const [cheers, setCheers] = useState<any>({ items: [], total: 0, page: 1, totalPages: 1 });
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [filterVisible, setFilterVisible] = useState<string>("");
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const load = useCallback(() => {
    const params: Record<string, string | number> = { page, limit: 20 };
    if (search) params.search = search;
    if (filterVisible) params.isVisible = filterVisible;
    getCheers(params).then(setCheers).catch(console.error);
  }, [page, search, filterVisible]);

  useEffect(() => { load(); }, [load]);

  const handleToggle = async (id: string, visible: boolean) => {
    if (visible) await hideCheer(id);
    else await showCheer(id);
    load();
  };

  const handleBulkHide = async () => {
    if (selected.size === 0) return;
    await bulkHideCheers(Array.from(selected));
    setSelected(new Set());
    load();
  };

  const toggleSelect = (id: string) => {
    const next = new Set(selected);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelected(next);
  };

  const toggleAll = () => {
    if (selected.size === cheers.items.length) setSelected(new Set());
    else setSelected(new Set(cheers.items.map((c: any) => c.id)));
  };

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-black text-ink">응원 메시지 관리</h1>
        <p className="text-sm text-ink-muted mt-1">욕설이나 비방이 포함된 메시지를 검토하고 숨길 수 있습니다</p>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3 mb-4">
        <input
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          placeholder="메시지 검색..."
          className="px-4 py-2.5 rounded-xl bg-white border border-gray-200 text-sm outline-none focus:border-coral w-64"
        />
        <select value={filterVisible} onChange={(e) => { setFilterVisible(e.target.value); setPage(1); }}
          className="px-4 py-2.5 rounded-xl bg-white border border-gray-200 text-sm">
          <option value="">전체</option>
          <option value="true">공개</option>
          <option value="false">숨김</option>
        </select>
        {selected.size > 0 && (
          <motion.button initial={{ scale: 0.9 }} animate={{ scale: 1 }}
            onClick={handleBulkHide}
            className="px-4 py-2.5 rounded-xl bg-red-500 text-white text-sm font-semibold">
            🛡️ {selected.size}개 숨기기
          </motion.button>
        )}
        <span className="text-xs text-ink-muted ml-auto">
          총 {cheers.total}개 · {cheers.page}/{cheers.totalPages} 페이지
        </span>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-100">
              <th className="px-4 py-3 w-10">
                <input type="checkbox" checked={selected.size === cheers.items.length && cheers.items.length > 0}
                  onChange={toggleAll} className="rounded" />
              </th>
              <th className="text-left px-4 py-3 text-xs font-bold text-ink-muted uppercase">시간</th>
              <th className="text-left px-4 py-3 text-xs font-bold text-ink-muted uppercase">내용</th>
              <th className="text-left px-4 py-3 text-xs font-bold text-ink-muted uppercase hidden sm:table-cell">상태</th>
              <th className="text-right px-4 py-3 text-xs font-bold text-ink-muted uppercase">액션</th>
            </tr>
          </thead>
          <tbody>
            {cheers.items?.map((msg: any) => (
              <tr key={msg.id} className={`border-b border-gray-50 ${!msg.isVisible ? "bg-red-50/30" : ""}`}>
                <td className="px-4 py-3">
                  <input type="checkbox" checked={selected.has(msg.id)}
                    onChange={() => toggleSelect(msg.id)} className="rounded" />
                </td>
                <td className="px-4 py-3 text-xs text-ink-muted whitespace-nowrap">
                  {new Date(msg.createdAt).toLocaleString("ko-KR", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                </td>
                <td className="px-4 py-3">
                  <p className={`text-sm ${!msg.isVisible ? "line-through text-ink-muted" : ""}`}>
                    {msg.content}
                  </p>
                </td>
                <td className="px-4 py-3 hidden sm:table-cell">
                  <span className={`text-xs px-2 py-1 rounded-full font-semibold ${
                    msg.isVisible ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
                  }`}>
                    {msg.isVisible ? "공개" : "숨김"}
                  </span>
                </td>
                <td className="px-4 py-3 text-right">
                  <button onClick={() => handleToggle(msg.id, msg.isVisible)}
                    className={`text-xs font-semibold ${msg.isVisible ? "text-red-500 hover:text-red-700" : "text-green-500 hover:text-green-700"}`}>
                    {msg.isVisible ? "숨기기" : "복원"}
                  </button>
                </td>
              </tr>
            ))}
            {cheers.items?.length === 0 && (
              <tr><td colSpan={5} className="px-4 py-12 text-center text-ink-muted text-sm">메시지가 없습니다</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {cheers.totalPages > 1 && (
        <div className="flex justify-center gap-2 mt-4">
          {Array.from({ length: cheers.totalPages }, (_, i) => i + 1).map((p) => (
            <button key={p} onClick={() => setPage(p)}
              className={`w-9 h-9 rounded-xl text-sm font-semibold ${
                p === page ? "bg-coral text-white" : "bg-white text-ink-muted hover:bg-gray-50"
              }`}>
              {p}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
