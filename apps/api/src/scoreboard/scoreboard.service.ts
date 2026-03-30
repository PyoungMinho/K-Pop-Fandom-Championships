import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { SeasonTeam } from "../season/season-team.entity";

@Injectable()
export class ScoreboardService {
  constructor(
    @InjectRepository(SeasonTeam)
    private readonly seasonTeamRepo: Repository<SeasonTeam>,
  ) {}

  async getBySeasonId(seasonId: string) {
    const teams = await this.seasonTeamRepo.find({
      where: { seasonId },
      relations: ["team"],
      order: { totalScore: "DESC" },
    });

    return {
      teams: teams.map((st, i) => ({
        rank: i + 1,
        teamId: st.teamId,
        teamName: st.team.name,
        shortName: st.team.shortName,
        colorCode: st.team.colorCode,
        totalScore: Number(st.totalScore),
      })),
      updatedAt: new Date().toISOString(),
    };
  }
}
