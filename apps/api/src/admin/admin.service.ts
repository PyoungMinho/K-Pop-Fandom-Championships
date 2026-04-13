import { Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository, Like } from "typeorm";
import { Team } from "../team/team.entity";
import { Season } from "../season/season.entity";
import { SeasonTeam } from "../season/season-team.entity";
import { GameEvent } from "../game/game-event.entity";
import { CheerMessage } from "../game/cheer-message.entity";
import { Score } from "../game/score.entity";
import { BatonChain } from "../game/baton-chain.entity";
import { SiteSettings } from "./site-settings.entity";

@Injectable()
export class AdminService {
  constructor(
    @InjectRepository(Team) private readonly teamRepo: Repository<Team>,
    @InjectRepository(Season) private readonly seasonRepo: Repository<Season>,
    @InjectRepository(SeasonTeam) private readonly seasonTeamRepo: Repository<SeasonTeam>,
    @InjectRepository(GameEvent) private readonly gameEventRepo: Repository<GameEvent>,
    @InjectRepository(CheerMessage) private readonly cheerRepo: Repository<CheerMessage>,
    @InjectRepository(Score) private readonly scoreRepo: Repository<Score>,
    @InjectRepository(BatonChain) private readonly batonRepo: Repository<BatonChain>,
    @InjectRepository(SiteSettings) private readonly settingsRepo: Repository<SiteSettings>,
  ) {}

  // ═══════════ Teams ═══════════

  findAllTeams() {
    return this.teamRepo.find({ order: { createdAt: "ASC" } });
  }

  async createTeam(data: Partial<Team>) {
    const team = this.teamRepo.create(data);
    return this.teamRepo.save(team);
  }

  async updateTeam(id: string, data: Partial<Team>) {
    await this.teamRepo.update(id, data as any);
    return this.teamRepo.findOneByOrFail({ id });
  }

  async deleteTeam(id: string) {
    const result = await this.teamRepo.delete(id);
    if (result.affected === 0) throw new NotFoundException("팀을 찾을 수 없습니다");
    return { deleted: true };
  }

  // ═══════════ Seasons ═══════════

  findAllSeasons() {
    return this.seasonRepo.find({
      order: { seasonNumber: "DESC" },
      relations: ["seasonTeams", "seasonTeams.team"],
    });
  }

  async createSeason(data: Partial<Season>) {
    const season = this.seasonRepo.create(data);
    return this.seasonRepo.save(season);
  }

  async updateSeason(id: string, data: Partial<Season>) {
    await this.seasonRepo.update(id, data as any);
    return this.seasonRepo.findOne({
      where: { id },
      relations: ["seasonTeams", "seasonTeams.team"],
    });
  }

  async addTeamToSeason(seasonId: string, teamId: string, seedOrder = 0) {
    const st = this.seasonTeamRepo.create({ seasonId, teamId, seedOrder });
    return this.seasonTeamRepo.save(st);
  }

  // ═══════════ Game Events ═══════════

  findGameEvents(seasonId?: string) {
    const where = seasonId ? { seasonId } : {};
    return this.gameEventRepo.find({
      where,
      order: { dayNumber: "ASC" },
      relations: ["season"],
    });
  }

  async createGameEvent(data: Partial<GameEvent>) {
    const ge = this.gameEventRepo.create(data);
    return this.gameEventRepo.save(ge);
  }

  async updateGameEvent(id: string, data: Partial<GameEvent>) {
    await this.gameEventRepo.update(id, data as any);
    return this.gameEventRepo.findOneByOrFail({ id });
  }

  // ═══════════ Cheer Moderation ═══════════

  async findCheers(params: {
    page?: number;
    limit?: number;
    seasonTeamId?: string;
    isVisible?: boolean;
    search?: string;
  }) {
    const { page = 1, limit = 20, seasonTeamId, isVisible, search } = params;
    const qb = this.cheerRepo
      .createQueryBuilder("c")
      .orderBy("c.createdAt", "DESC")
      .skip((page - 1) * limit)
      .take(limit);

    if (seasonTeamId) qb.andWhere("c.seasonTeamId = :seasonTeamId", { seasonTeamId });
    if (isVisible !== undefined) qb.andWhere("c.isVisible = :isVisible", { isVisible });
    if (search) qb.andWhere("c.content LIKE :search", { search: `%${search}%` });

    const [items, total] = await qb.getManyAndCount();
    return { items, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async hideCheer(id: string) {
    await this.cheerRepo.update(id, { isVisible: false });
    return { id, isVisible: false };
  }

  async showCheer(id: string) {
    await this.cheerRepo.update(id, { isVisible: true });
    return { id, isVisible: true };
  }

  async bulkHideCheers(ids: string[]) {
    await this.cheerRepo.update(ids, { isVisible: false });
    return { hidden: ids.length };
  }

  // ═══════════ Public ═══════════

  async getActiveSeason() {
    const season = await this.seasonRepo.findOne({
      where: { status: "ACTIVE" as any },
      relations: ["seasonTeams", "seasonTeams.team"],
    });
    if (!season) return null;

    const scoreboard = [...season.seasonTeams]
      .sort((a, b) => Number(b.totalScore) - Number(a.totalScore))
      .map((st, i) => ({
        rank: i + 1,
        seasonTeamId: st.id,
        teamId: st.teamId,
        teamName: st.team?.name ?? "",
        shortName: st.team?.shortName ?? "",
        colorCode: st.team?.colorCode ?? "#888",
        logoUrl: st.team?.logoUrl ?? null,
        totalScore: Number(st.totalScore),
      }));

    const start = new Date(season.startDate);
    const end = new Date(season.endDate);
    const now = new Date();
    const totalDays = Math.max(
      1,
      Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)),
    );
    const currentDay = Math.min(
      totalDays,
      Math.max(1, Math.ceil((now.getTime() - start.getTime()) / (1000 * 60 * 60 * 24))),
    );

    return {
      id: season.id,
      title: season.title,
      seasonNumber: season.seasonNumber,
      startDate: season.startDate,
      endDate: season.endDate,
      phase: season.phase,
      status: season.status,
      totalDays,
      currentDay,
      scoreboard,
    };
  }

  // ═══════════ Settings ═══════════

  async getAllSettings() {
    const rows = await this.settingsRepo.find();
    const obj: Record<string, string> = {};
    rows.forEach((r) => (obj[r.key] = r.value));
    return obj;
  }

  async upsertSetting(key: string, value: string) {
    let setting = await this.settingsRepo.findOne({ where: { key } });
    if (setting) {
      setting.value = value;
    } else {
      setting = this.settingsRepo.create({ key, value });
    }
    return this.settingsRepo.save(setting);
  }

  // ═══════════ Analytics ═══════════

  async getAnalytics() {
    const [totalTeams, totalCheers, totalBatons, totalNominations] =
      await Promise.all([
        this.teamRepo.count(),
        this.cheerRepo.count(),
        this.batonRepo.count(),
        this.scoreRepo
          .createQueryBuilder("s")
          .select("COALESCE(SUM(s.points), 0)", "total")
          .where("s.source = :source", { source: "click" })
          .getRawOne()
          .then((r) => Number(r?.total ?? 0)),
      ]);

    const cheersByTeam = await this.cheerRepo
      .createQueryBuilder("c")
      .select("c.seasonTeamId", "seasonTeamId")
      .addSelect("COUNT(*)", "count")
      .groupBy("c.seasonTeamId")
      .orderBy("count", "DESC")
      .getRawMany();

    const totalSeasons = await this.seasonRepo.count();

    return {
      totalTeams,
      totalSeasons,
      totalClicks: totalNominations,
      totalCheers,
      totalBatons,
      cheersByTeam,
    };
  }
}
