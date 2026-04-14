"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { getSettings, updateSetting } from "@/lib/admin-api";

// ─── 설정 스펙 ────────────────────────────────────────────────────────────────

interface SettingField {
  key: string;
  label: string;
  icon: string;
  description: string;
  type: "text" | "textarea" | "url";
  placeholder: string;
  group: string;
}

const SETTING_FIELDS: SettingField[] = [
  {
    key: "site_title",
    label: "사이트 타이틀",
    icon: "🏷️",
    description: "메인 페이지 대제목으로 표시됩니다. 비어있으면 시즌 제목이 사용됩니다.",
    type: "text",
    placeholder: "예) 2026 K팝 팬덤 대전",
    group: "기본",
  },
  {
    key: "announcement",
    label: "공지사항",
    icon: "📢",
    description: "사이트 상단 배너에 표시될 공지 텍스트입니다.",
    type: "textarea",
    placeholder: "공지사항을 입력하세요...",
    group: "기본",
  },
  {
    key: "event_banner_url",
    label: "이벤트 배너 이미지 URL",
    icon: "🖼️",
    description: "메인 페이지 상단에 표시될 배너 이미지 URL입니다.",
    type: "url",
    placeholder: "https://example.com/banner.jpg",
    group: "배너",
  },
  {
    key: "event_banner_link",
    label: "이벤트 배너 링크 URL",
    icon: "🔗",
    description: "배너 클릭 시 이동할 링크입니다. 비어있으면 클릭이 비활성화됩니다.",
    type: "url",
    placeholder: "https://example.com/event",
    group: "배너",
  },
  {
    key: "winner_team_name",
    label: "우승 팀 이름",
    icon: "🏆",
    description: "지난 시즌 우승 팀 이름. 시상식 페이지에 표시됩니다.",
    type: "text",
    placeholder: "우승 팀 이름",
    group: "우승",
  },
  {
    key: "winner_embed_url",
    label: "우승팀 YouTube 영상 URL",
    icon: "🎵",
    description: "YouTube 영상 URL을 입력하면 메인 페이지에 임베드됩니다.",
    type: "url",
    placeholder: "https://www.youtube.com/watch?v=...",
    group: "우승",
  },
];

const GROUPS = Array.from(new Set(SETTING_FIELDS.map((f) => f.group)));

// ─── 유틸 ────────────────────────────────────────────────────────────────────

function extractYouTubeId(url: string): string {
  const match = url.match(/(?:v=|\/embed\/|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
  return match?.[1] ?? "";
}

// ─── 컴포넌트 ─────────────────────────────────────────────────────────────────

export default function SettingsPage() {
  const [settings, setSettings] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState<string | null>(null);
  const [toast, setToast] = useState<{ key: string; type: "success" | "error"; msg: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const loadSettings = () => {
    setLoading(true);
    setLoadError(null);
    getSettings()
      .then(setSettings)
      .catch((e) => setLoadError(e.message || "설정을 불러오지 못했습니다"))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadSettings();
  }, []);

  const showToast = (key: string, type: "success" | "error", msg: string) => {
    setToast({ key, type, msg });
    setTimeout(() => setToast(null), 2500);
  };

  const updateLocal = (key: string, value: string) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
  };

  const handleSave = async (key: string) => {
    setSaving(key);
    try {
      await updateSetting(key, settings[key] ?? "");
      showToast(key, "success", "저장되었습니다");
    } catch (e: any) {
      showToast(key, "error", e.message || "저장에 실패했습니다");
    } finally {
      setSaving(null);
    }
  };

  // 로딩 상태
  if (loading) {
    return (
      <div className="max-w-2xl">
        <div className="mb-8">
          <h1 className="text-2xl font-black text-ink">사이트 설정</h1>
          <p className="text-sm text-ink-muted mt-1">우승 노래 임베드, 배너 이미지 등 사이트 설정을 관리합니다</p>
        </div>
        <div className="space-y-6">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="bg-white rounded-2xl p-6 shadow-sm animate-pulse">
              <div className="h-5 bg-gray-100 rounded w-1/3 mb-3" />
              <div className="h-3 bg-gray-100 rounded w-2/3 mb-4" />
              <div className="h-11 bg-gray-100 rounded-xl" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  // 에러 상태
  if (loadError) {
    return (
      <div className="max-w-2xl">
        <div className="mb-8">
          <h1 className="text-2xl font-black text-ink">사이트 설정</h1>
        </div>
        <div className="bg-white rounded-2xl p-12 shadow-sm flex flex-col items-center text-center gap-3">
          <span className="text-5xl">⚠️</span>
          <p className="font-semibold text-red-600">{loadError}</p>
          <button onClick={loadSettings} className="btn-primary text-sm px-5 py-2.5 mt-2">
            다시 시도
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl">
      {/* 헤더 */}
      <div className="mb-8">
        <h1 className="text-2xl font-black text-ink">사이트 설정</h1>
        <p className="text-sm text-ink-muted mt-1">
          우승 노래 임베드, 배너 이미지 등 사이트 설정을 관리합니다
        </p>
      </div>

      {/* 설정 그룹 */}
      {GROUPS.map((group, gi) => (
        <div key={group} className="mb-8">
          <h2 className="text-xs font-bold text-ink-muted uppercase tracking-widest mb-4 px-1">
            {group}
          </h2>
          <div className="space-y-4">
            {SETTING_FIELDS.filter((f) => f.group === group).map((field, fi) => (
              <SettingCard
                key={field.key}
                field={field}
                value={settings[field.key] ?? ""}
                saving={saving === field.key}
                onSave={() => handleSave(field.key)}
                onChange={(v) => updateLocal(field.key, v)}
                delay={(gi * 3 + fi) * 0.05}
              />
            ))}
          </div>
        </div>
      ))}

      {/* 토스트 알림 */}
      <AnimatePresence>
        {toast && (
          <motion.div
            key={toast.key + toast.type}
            initial={{ opacity: 0, y: 24, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 24, scale: 0.95 }}
            transition={{ type: "spring", damping: 22, stiffness: 300 }}
            className={`fixed bottom-6 right-6 z-50 flex items-center gap-2.5 px-5 py-3.5 rounded-2xl shadow-xl text-sm font-semibold ${
              toast.type === "success"
                ? "bg-green-500 text-white"
                : "bg-red-500 text-white"
            }`}
          >
            <span>{toast.type === "success" ? "✅" : "❌"}</span>
            {toast.msg}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── 설정 카드 ────────────────────────────────────────────────────────────────

interface SettingCardProps {
  field: SettingField;
  value: string;
  saving: boolean;
  delay: number;
  onSave: () => void;
  onChange: (v: string) => void;
}

function SettingCard({ field, value, saving, delay, onSave, onChange }: SettingCardProps) {
  const inputClass =
    "w-full px-4 py-3 rounded-xl bg-gray-50 border border-gray-200 text-sm outline-none focus:border-coral transition-colors mb-3";

  // YouTube 미리보기
  const ytId =
    field.key === "winner_embed_url" && value.includes("youtube")
      ? extractYouTubeId(value)
      : null;

  // 배너 이미지 미리보기
  const showBannerPreview = field.key === "event_banner_url" && value.length > 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
      className="card-game"
    >
      <div className="flex items-center gap-2 mb-1">
        <span className="text-xl">{field.icon}</span>
        <h3 className="font-bold text-ink">{field.label}</h3>
      </div>
      <p className="text-xs text-ink-muted mb-4 leading-relaxed">{field.description}</p>

      {field.type === "textarea" ? (
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={field.placeholder}
          rows={3}
          className={`${inputClass} resize-none`}
        />
      ) : (
        <input
          type={field.type === "url" ? "url" : "text"}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={field.placeholder}
          className={inputClass}
        />
      )}

      {/* YouTube 미리보기 */}
      {ytId && (
        <div className="mb-3 rounded-xl overflow-hidden bg-black aspect-video">
          <iframe
            src={`https://www.youtube.com/embed/${ytId}`}
            className="w-full h-full"
            allow="autoplay; encrypted-media"
            allowFullScreen
            title="YouTube 미리보기"
          />
        </div>
      )}

      {/* 배너 이미지 미리보기 */}
      {showBannerPreview && (
        <div className="mb-3 rounded-xl overflow-hidden bg-gray-100">
          <img
            src={value}
            alt="배너 미리보기"
            className="w-full h-auto max-h-48 object-cover"
            onError={(e) => {
              (e.currentTarget as HTMLImageElement).style.display = "none";
            }}
          />
        </div>
      )}

      <button
        onClick={onSave}
        disabled={saving}
        className="btn-primary text-sm px-6 py-2.5 disabled:opacity-50"
      >
        {saving ? "저장 중..." : "저장"}
      </button>
    </motion.div>
  );
}
