"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { getSettings, updateSetting } from "@/lib/admin-api";

export default function SettingsPage() {
  const [settings, setSettings] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState<string | null>(null);
  const [saved, setSaved] = useState<string | null>(null);

  useEffect(() => {
    getSettings().then(setSettings).catch(console.error);
  }, []);

  const handleSave = async (key: string) => {
    setSaving(key);
    try {
      await updateSetting(key, settings[key] || "");
      setSaved(key);
      setTimeout(() => setSaved(null), 2000);
    } finally {
      setSaving(null);
    }
  };

  const updateLocal = (key: string, value: string) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
  };

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-black text-ink">사이트 설정</h1>
        <p className="text-sm text-ink-muted mt-1">우승 노래 임베드, 배너 이미지 등 사이트 설정을 관리합니다</p>
      </div>

      <div className="space-y-6 max-w-2xl">
        {/* Site Title */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-white rounded-2xl p-6 shadow-sm">
          <h3 className="font-bold text-lg mb-1 flex items-center gap-2">🏷️ 사이트 타이틀</h3>
          <p className="text-xs text-ink-muted mb-4">메인 페이지 대제목으로 표시됩니다 (비어있으면 시즌 제목 사용)</p>
          <input
            value={settings.site_title || ""}
            onChange={(e) => updateLocal("site_title", e.target.value)}
            placeholder="예) 2026 K팝 팬덤 대전"
            className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-gray-200 text-sm outline-none focus:border-coral mb-3"
          />
          <button onClick={() => handleSave("site_title")}
            disabled={saving === "site_title"}
            className="btn-primary text-sm px-6 disabled:opacity-50">
            {saving === "site_title" ? "저장 중..." : saved === "site_title" ? "✅ 저장됨!" : "저장"}
          </button>
        </motion.div>

        {/* Winner Song Embed */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-white rounded-2xl p-6 shadow-sm">
          <h3 className="font-bold text-lg mb-1 flex items-center gap-2">🎵 우승 팬덤 노래</h3>
          <p className="text-xs text-ink-muted mb-4">YouTube 영상 URL을 입력하면 메인에 임베드됩니다</p>
          <input
            value={settings.winner_embed_url || ""}
            onChange={(e) => updateLocal("winner_embed_url", e.target.value)}
            placeholder="https://www.youtube.com/watch?v=..."
            className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-gray-200 text-sm outline-none focus:border-coral mb-3"
          />
          {/* YouTube Preview */}
          {settings.winner_embed_url && settings.winner_embed_url.includes("youtube") && (
            <div className="mb-3 rounded-xl overflow-hidden bg-black aspect-video">
              <iframe
                src={`https://www.youtube.com/embed/${extractYouTubeId(settings.winner_embed_url)}`}
                className="w-full h-full"
                allow="autoplay; encrypted-media"
                allowFullScreen
              />
            </div>
          )}
          <button onClick={() => handleSave("winner_embed_url")}
            disabled={saving === "winner_embed_url"}
            className="btn-primary text-sm px-6 disabled:opacity-50">
            {saving === "winner_embed_url" ? "저장 중..." : saved === "winner_embed_url" ? "✅ 저장됨!" : "저장"}
          </button>
        </motion.div>

        {/* Event Banner */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
          className="bg-white rounded-2xl p-6 shadow-sm">
          <h3 className="font-bold text-lg mb-1 flex items-center gap-2">🖼️ 이벤트 배너 이미지</h3>
          <p className="text-xs text-ink-muted mb-4">메인 페이지 상단에 표시될 배너 이미지 URL</p>
          <input
            value={settings.event_banner_url || ""}
            onChange={(e) => updateLocal("event_banner_url", e.target.value)}
            placeholder="https://..."
            className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-gray-200 text-sm outline-none focus:border-coral mb-3"
          />
          {settings.event_banner_url && (
            <div className="mb-3 rounded-xl overflow-hidden bg-gray-100">
              <img src={settings.event_banner_url} alt="Banner Preview" className="w-full h-auto max-h-48 object-cover" />
            </div>
          )}
          <button onClick={() => handleSave("event_banner_url")}
            disabled={saving === "event_banner_url"}
            className="btn-primary text-sm px-6 disabled:opacity-50">
            {saving === "event_banner_url" ? "저장 중..." : saved === "event_banner_url" ? "✅ 저장됨!" : "저장"}
          </button>
        </motion.div>

        {/* Winner Team Name */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
          className="bg-white rounded-2xl p-6 shadow-sm">
          <h3 className="font-bold text-lg mb-1 flex items-center gap-2">🏆 우승 팀 이름</h3>
          <p className="text-xs text-ink-muted mb-4">시상식 페이지에 표시될 우승 팀</p>
          <input
            value={settings.winner_team_name || ""}
            onChange={(e) => updateLocal("winner_team_name", e.target.value)}
            placeholder="우승 팀 이름"
            className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-gray-200 text-sm outline-none focus:border-coral mb-3"
          />
          <button onClick={() => handleSave("winner_team_name")}
            disabled={saving === "winner_team_name"}
            className="btn-primary text-sm px-6 disabled:opacity-50">
            {saving === "winner_team_name" ? "저장 중..." : saved === "winner_team_name" ? "✅ 저장됨!" : "저장"}
          </button>
        </motion.div>

        {/* Announcement */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
          className="bg-white rounded-2xl p-6 shadow-sm">
          <h3 className="font-bold text-lg mb-1 flex items-center gap-2">📢 공지사항</h3>
          <p className="text-xs text-ink-muted mb-4">사이트 상단에 표시될 공지</p>
          <textarea
            value={settings.announcement || ""}
            onChange={(e) => updateLocal("announcement", e.target.value)}
            placeholder="공지사항을 입력하세요..."
            rows={3}
            className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-gray-200 text-sm outline-none focus:border-coral mb-3 resize-none"
          />
          <button onClick={() => handleSave("announcement")}
            disabled={saving === "announcement"}
            className="btn-primary text-sm px-6 disabled:opacity-50">
            {saving === "announcement" ? "저장 중..." : saved === "announcement" ? "✅ 저장됨!" : "저장"}
          </button>
        </motion.div>
      </div>
    </div>
  );
}

function extractYouTubeId(url: string): string {
  const match = url.match(/(?:v=|\/embed\/|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
  return match?.[1] || "";
}
