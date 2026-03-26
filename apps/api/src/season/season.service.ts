import { Injectable } from "@nestjs/common";

export interface Season {
  id: number;
  startDate: string;
  endDate: string;
  phase: "battle" | "winner" | "nomination";
  teams: string[];
}

@Injectable()
export class SeasonService {
  getCurrentSeason(): Season {
    return {
      id: 1,
      startDate: new Date().toISOString(),
      endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      phase: "battle",
      teams: [],
    };
  }
}
