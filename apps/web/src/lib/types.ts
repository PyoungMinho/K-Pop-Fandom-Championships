export interface Team {
  id: string;
  name: string;
  shortName: string;
  logoUrl: string | null;
  colorCode: string;
}

export interface Season {
  id: string;
  seasonNumber: number;
  title: string;
  startDate: string;
  endDate: string;
  phase: "BATTLE" | "WINNER" | "NOMINATION";
  status: "UPCOMING" | "ACTIVE" | "COMPLETED";
  seasonTeams: SeasonTeam[];
}

export interface SeasonTeam {
  id: string;
  seasonId: string;
  teamId: string;
  seedOrder: number;
  totalScore: number;
  rank: number | null;
  team?: Team;
}

export interface GameEvent {
  id: string;
  seasonId: string;
  gameType: "CLICK_BURST" | "BATON_RELAY" | "CHEER_BOARD" | "HOT_TIME";
  dayNumber: number;
  startTime: string;
  endTime: string;
  status: "SCHEDULED" | "ACTIVE" | "COMPLETED";
  config: Record<string, unknown> | null;
}

export interface Score {
  id: string;
  createdAt: string;
  gameEventId: string;
  seasonTeamId: string;
  points: number;
  source: "CLICK" | "BATON" | "CHEER" | "HOT_TIME_CLICK";
  ipHash: string;
}

export interface CheerMessage {
  id: string;
  createdAt: string;
  gameEventId: string;
  seasonTeamId: string;
  content: string;
  isVisible: boolean;
}

export interface ScoreboardEntry {
  rank: number;
  teamId: string;
  teamName: string;
  shortName: string;
  colorCode: string;
  totalScore: number;
}

export interface NominationResult {
  teamId: string;
  teamName: string;
  shortName: string;
  colorCode: string;
  voteCount: number;
}
