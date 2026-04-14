const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

async function fetchAPI<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...options?.headers,
    },
  });

  if (!res.ok) {
    throw new Error(`API Error: ${res.status} ${res.statusText}`);
  }

  return res.json();
}

export const api = {
  getTeams: () => fetchAPI<import("./types").Team[]>("/teams"),

  getCurrentSeason: () => fetchAPI<import("./types").Season>("/season/current"),

  getScoreboard: (seasonId: string) =>
    fetchAPI<import("./types").ScoreboardEntry[]>(`/scoreboard/${seasonId}`),

  getNominationResults: (seasonId: string) =>
    fetchAPI<import("./types").NominationResult[]>(`/nominations/results/${seasonId}`),

  nominate: (data: { seasonId: string; teamId: string; fingerprint?: string }) =>
    fetchAPI<{ id: string }>("/nominations", {
      method: "POST",
      body: JSON.stringify(data),
    }),
};
