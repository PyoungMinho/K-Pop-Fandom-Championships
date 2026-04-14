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

export interface NominationResultPublic {
  teamId: string;
  teamName: string;
  shortName: string;
  colorCode: string;
  voteCount: number;
}

/**
 * scoreboard 항목을 Team + SeasonTeam 모양으로 변환한 타입.
 * game/relay/cheer 페이지에서 팀 목록 및 seasonTeamId 매핑에 사용.
 */
export interface SeasonTeamInfo {
  id: string;         // seasonTeamId
  teamId: string;
  name: string;
  shortName: string;
  colorCode: string;
  logoUrl: string | null;
}

export interface ActiveGameEvent {
  id: string;
  seasonId: string;
  gameType: string;
  dayNumber: number;
  startTime: string;
  endTime: string;
  status: string;
  config: Record<string, unknown> | null;
}

export const publicApi = {
  getSettings: () => pub<Record<string, string>>("/settings"),
  getActiveSeason: () => pub<ActiveSeason | null>("/active-season"),
  getActiveGameEvent: () => pub<ActiveGameEvent | null>("/active-game-event"),
  getNominationResults: async (seasonId: string): Promise<NominationResultPublic[]> => {
    // nomination controller는 /public prefix 없이 /nominations/results/:seasonId
    const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";
    const res = await fetch(`${API_BASE}/nominations/results/${seasonId}`, { cache: "no-store" });
    if (!res.ok) throw new Error(`API ${res.status}`);
    return res.json();
  },
};

/**
 * ActiveSeason의 scoreboard에서 SeasonTeamInfo 배열을 추출하는 헬퍼.
 * scoreboard는 이미 totalScore 내림차순 정렬되어 있다.
 */
export function extractSeasonTeams(season: ActiveSeason): SeasonTeamInfo[] {
  return season.scoreboard.map((entry) => ({
    id: entry.seasonTeamId,
    teamId: entry.teamId,
    name: entry.teamName,
    shortName: entry.shortName,
    colorCode: entry.colorCode,
    logoUrl: entry.logoUrl,
  }));
}
