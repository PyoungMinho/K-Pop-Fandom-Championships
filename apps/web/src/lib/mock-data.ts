import type {
  Team,
  Season,
  SeasonTeam,
  ScoreboardEntry,
  GameEvent,
  CheerMessage,
  NominationResult,
} from "./types";

export const MOCK_TEAMS: Team[] = [
  {
    id: "t1",
    name: "스타라이트",
    shortName: "STL",
    logoUrl: null,
    colorCode: "#FF6B35",
  },
  {
    id: "t2",
    name: "문라이즈",
    shortName: "MNR",
    logoUrl: null,
    colorCode: "#2EC4B6",
  },
  {
    id: "t3",
    name: "썬플라워",
    shortName: "SNF",
    logoUrl: null,
    colorCode: "#FFD166",
  },
  {
    id: "t4",
    name: "오로라",
    shortName: "AUR",
    logoUrl: null,
    colorCode: "#A78BFA",
  },
  {
    id: "t5",
    name: "블레이즈",
    shortName: "BLZ",
    logoUrl: null,
    colorCode: "#FB7185",
  },
  {
    id: "t6",
    name: "스카이돔",
    shortName: "SKD",
    logoUrl: null,
    colorCode: "#38BDF8",
  },
];

export const MOCK_SEASON_TEAMS: SeasonTeam[] = MOCK_TEAMS.map((team, i) => ({
  id: `st${i + 1}`,
  seasonId: "s1",
  teamId: team.id,
  seedOrder: i + 1,
  totalScore: Math.floor(Math.random() * 50000) + 10000,
  rank: null,
  team,
}));

export const MOCK_SEASON: Season = {
  id: "s1",
  seasonNumber: 1,
  title: "아이돌 팬덤 대회 ",
  startDate: "2026-03-20T00:00:00Z",
  endDate: "2026-03-27T23:59:59Z",
  phase: "BATTLE",
  status: "ACTIVE",
  seasonTeams: MOCK_SEASON_TEAMS,
};

export const MOCK_SCOREBOARD: ScoreboardEntry[] = MOCK_SEASON_TEAMS.sort(
  (a, b) => b.totalScore - a.totalScore,
).map((st, i) => ({
  rank: i + 1,
  teamId: st.teamId,
  teamName: st.team!.name,
  shortName: st.team!.shortName,
  colorCode: st.team!.colorCode,
  totalScore: st.totalScore,
}));

export const MOCK_GAME_EVENT: GameEvent = {
  id: "ge1",
  seasonId: "s1",
  gameType: "CLICK_BURST",
  dayNumber: 5,
  startTime: "2026-03-25T09:00:00Z",
  endTime: "2026-03-25T21:00:00Z",
  status: "ACTIVE",
  config: null,
};

export const MOCK_CHEER_MESSAGES: CheerMessage[] = [
  {
    id: "c1",
    createdAt: "2026-03-25T10:00:00Z",
    gameEventId: "ge1",
    seasonTeamId: "st1",
    content: "스타라이트 최고! 끝까지 달려보자!!",
    isVisible: true,
  },
  {
    id: "c2",
    createdAt: "2026-03-25T10:01:00Z",
    gameEventId: "ge1",
    seasonTeamId: "st2",
    content: "문라이즈 파이팅!! 우리가 1등이다 🏆",
    isVisible: true,
  },
  {
    id: "c3",
    createdAt: "2026-03-25T10:02:00Z",
    gameEventId: "ge1",
    seasonTeamId: "st3",
    content: "썬플라워 응원해요! 힘내세요!!",
    isVisible: true,
  },
  {
    id: "c4",
    createdAt: "2026-03-25T10:03:00Z",
    gameEventId: "ge1",
    seasonTeamId: "st4",
    content: "오로라 빛나는 순간을 함께!",
    isVisible: true,
  },
  {
    id: "c5",
    createdAt: "2026-03-25T10:04:00Z",
    gameEventId: "ge1",
    seasonTeamId: "st1",
    content: "클릭 폭발! 멈추지 않아!",
    isVisible: true,
  },
  {
    id: "c6",
    createdAt: "2026-03-25T10:05:00Z",
    gameEventId: "ge1",
    seasonTeamId: "st5",
    content: "블레이즈 불꽃처럼! 화이팅!!",
    isVisible: true,
  },
  {
    id: "c7",
    createdAt: "2026-03-25T10:06:00Z",
    gameEventId: "ge1",
    seasonTeamId: "st6",
    content: "스카이돔 하늘 높이! 갈 수 있어!",
    isVisible: true,
  },
  {
    id: "c8",
    createdAt: "2026-03-25T10:07:00Z",
    gameEventId: "ge1",
    seasonTeamId: "st2",
    content: "우리 팀 최강! 더 올라가자!",
    isVisible: true,
  },
];

export const MOCK_NOMINATION_RESULTS: NominationResult[] = MOCK_TEAMS.map(
  (team) => ({
    teamId: team.id,
    teamName: team.name,
    shortName: team.shortName,
    colorCode: team.colorCode,
    voteCount: Math.floor(Math.random() * 3000) + 500,
  }),
);
