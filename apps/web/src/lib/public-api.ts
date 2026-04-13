const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

async function pub<T>(path: string): Promise<T> {
  const res = await fetch(`${API_URL}/public${path}`, { cache: "no-store" });
  if (!res.ok) throw new Error(`API ${res.status}`);
  return res.json();
}

export interface ScoreboardEntry {
  rank: number;
  seasonTeamId: string;
  teamId: string;
  teamName: string;
  shortName: string;
  colorCode: string;
  logoUrl: string | null;
  totalScore: number;
}

export interface ActiveSeason {
  id: string;
  title: string;
  seasonNumber: number;
  startDate: string;
  endDate: string;
  phase: string;
  status: string;
  totalDays: number;
  currentDay: number;
  scoreboard: ScoreboardEntry[];
}

export const publicApi = {
  getSettings: () => pub<Record<string, string>>("/settings"),
  getActiveSeason: () => pub<ActiveSeason | null>("/active-season"),
};
