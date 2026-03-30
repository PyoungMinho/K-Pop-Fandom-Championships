import { Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { Season } from "./season.entity";
import { SeasonTeam } from "./season-team.entity";
import { SeasonStatus } from "../common/enums/season-status.enum";

@Injectable()
export class SeasonService {
  constructor(
    @InjectRepository(Season)
    private readonly seasonRepo: Repository<Season>,
    @InjectRepository(SeasonTeam)
    private readonly seasonTeamRepo: Repository<SeasonTeam>,
  ) {}

  async getCurrentSeason(): Promise<Season> {
    const season = await this.seasonRepo.findOne({
      where: { status: SeasonStatus.ACTIVE },
      relations: ["seasonTeams", "seasonTeams.team"],
    });

    if (!season) {
      throw new NotFoundException("현재 진행 중인 시즌이 없습니다.");
    }

    return season;
  }

  findAll(): Promise<Season[]> {
    return this.seasonRepo.find({ order: { seasonNumber: "DESC" } });
  }

  async create(data: Partial<Season>): Promise<Season> {
    const season = this.seasonRepo.create(data);
    return this.seasonRepo.save(season);
  }

  async addTeamToSeason(
    seasonId: string,
    teamId: string,
    seedOrder: number,
  ): Promise<SeasonTeam> {
    const seasonTeam = this.seasonTeamRepo.create({
      seasonId,
      teamId,
      seedOrder,
    });
    return this.seasonTeamRepo.save(seasonTeam);
  }

  async getLeaderboard(
    seasonId: string,
  ): Promise<SeasonTeam[]> {
    return this.seasonTeamRepo.find({
      where: { seasonId },
      relations: ["team"],
      order: { totalScore: "DESC" },
    });
  }
}
