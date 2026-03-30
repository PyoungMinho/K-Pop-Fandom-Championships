const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";
const TOKEN_KEY = "kfc_admin_token";

function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token: string) {
  localStorage.setItem(TOKEN_KEY, token);
}

export function clearToken() {
  localStorage.removeItem(TOKEN_KEY);
}

export function isAuthenticated(): boolean {
  return !!getToken();
}

async function adminFetch<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = getToken();
  const res = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  });

  if (res.status === 401) {
    clearToken();
    if (typeof window !== "undefined") {
      window.location.href = "/admin/login";
    }
    throw new Error("Unauthorized");
  }

  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: "요청 실패" }));
    throw new Error(err.message || `HTTP ${res.status}`);
  }

  return res.json();
}

// ═══════════ Auth ═══════════
export async function login(username: string, password: string) {
  const data = await adminFetch<{ accessToken: string }>("/auth/admin/login", {
    method: "POST",
    body: JSON.stringify({ username, password }),
  });
  setToken(data.accessToken);
  return data;
}

// ═══════════ Teams ═══════════
export const getTeams = () => adminFetch<any[]>("/admin/teams");
export const createTeam = (data: any) =>
  adminFetch("/admin/teams", { method: "POST", body: JSON.stringify(data) });
export const updateTeam = (id: string, data: any) =>
  adminFetch(`/admin/teams/${id}`, { method: "PUT", body: JSON.stringify(data) });
export const deleteTeam = (id: string) =>
  adminFetch(`/admin/teams/${id}`, { method: "DELETE" });

// ═══════════ Seasons ═══════════
export const getSeasons = () => adminFetch<any[]>("/admin/seasons");
export const createSeason = (data: any) =>
  adminFetch("/admin/seasons", { method: "POST", body: JSON.stringify(data) });
export const updateSeason = (id: string, data: any) =>
  adminFetch(`/admin/seasons/${id}`, { method: "PUT", body: JSON.stringify(data) });
export const addTeamToSeason = (seasonId: string, teamId: string, seedOrder?: number) =>
  adminFetch(`/admin/seasons/${seasonId}/teams`, {
    method: "POST",
    body: JSON.stringify({ teamId, seedOrder }),
  });

// ═══════════ Game Events ═══════════
export const getGameEvents = (seasonId?: string) =>
  adminFetch<any[]>(`/admin/game-events${seasonId ? `?seasonId=${seasonId}` : ""}`);
export const createGameEvent = (data: any) =>
  adminFetch("/admin/game-events", { method: "POST", body: JSON.stringify(data) });
export const updateGameEvent = (id: string, data: any) =>
  adminFetch(`/admin/game-events/${id}`, { method: "PUT", body: JSON.stringify(data) });

// ═══════════ Cheer Moderation ═══════════
export const getCheers = (params: Record<string, string | number>) => {
  const qs = new URLSearchParams(
    Object.fromEntries(Object.entries(params).map(([k, v]) => [k, String(v)])),
  ).toString();
  return adminFetch<any>(`/admin/cheers?${qs}`);
};
export const hideCheer = (id: string) =>
  adminFetch(`/admin/cheers/${id}/hide`, { method: "PATCH" });
export const showCheer = (id: string) =>
  adminFetch(`/admin/cheers/${id}/show`, { method: "PATCH" });
export const bulkHideCheers = (ids: string[]) =>
  adminFetch("/admin/cheers/bulk-hide", { method: "PATCH", body: JSON.stringify({ ids }) });

// ═══════════ Settings ═══════════
export const getSettings = () => adminFetch<Record<string, string>>("/admin/settings");
export const updateSetting = (key: string, value: string) =>
  adminFetch(`/admin/settings/${key}`, { method: "PUT", body: JSON.stringify({ value }) });

// ═══════════ Analytics ═══════════
export const getAnalytics = () => adminFetch<any>("/admin/analytics");
