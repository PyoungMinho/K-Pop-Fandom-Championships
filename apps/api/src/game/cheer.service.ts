import { Injectable, Inject } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import Redis from "ioredis";
import sanitizeHtml from "sanitize-html";
import { CheerMessage } from "./cheer-message.entity";
import { Score } from "./score.entity";
import { SeasonTeam } from "../season/season-team.entity";
import { ScoreSource } from "../common/enums/score-source.enum";
import { REDIS_CLIENT } from "../common/redis.provider";

const CHEER_POINTS = 2; // 응원 메시지 1회당 점수
const RATE_LIMIT_SECONDS = 5; // 같은 IP 5초 쿨다운
const CHEER_RL_KEY = (ipHash: string) => `cheer:rl:${ipHash}`;

@Injectable()
export class CheerService {
  constructor(
    @InjectRepository(CheerMessage)
    private readonly cheerRepo: Repository<CheerMessage>,
    @InjectRepository(Score)
    private readonly scoreRepo: Repository<Score>,
    @InjectRepository(SeasonTeam)
    private readonly seasonTeamRepo: Repository<SeasonTeam>,
    @Inject(REDIS_CLIENT)
    private readonly redis: Redis,
  ) {}

  /**
   * 응원 메시지 작성
   */
  async createMessage(data: {
    gameEventId: string;
    seasonTeamId: string;
    content: string;
    ipHash: string;
    fingerprint?: string;
  }): Promise<CheerMessage> {
    // Redis 기반 Rate limit 체크 (SETNX + EXPIRE 원자적 처리)
    const rlKey = CHEER_RL_KEY(data.ipHash);
    const set = await this.redis.set(rlKey, "1", "EX", RATE_LIMIT_SECONDS, "NX");
    if (set === null) {
      // 키가 이미 존재 → 쿨다운 중
      throw new Error("RATE_LIMITED");
    }

    // XSS 방지: sanitize-html로 태그/속성 전체 제거 후 200자 제한
    // allowedTags: [], allowedAttributes: {} → 텍스트 노드만 남김
    const sanitizedContent = sanitizeHtml(data.content, {
      allowedTags: [],
      allowedAttributes: {},
    }).slice(0, 200);

    // 메시지 저장
    const msg = this.cheerRepo.create({
      gameEventId: data.gameEventId,
      seasonTeamId: data.seasonTeamId,
      content: sanitizedContent,
      ipHash: data.ipHash,
      fingerprint: data.fingerprint ?? null,
      isVisible: true,
    });
    const saved = await this.cheerRepo.save(msg);

    // 점수 부여
    const score = this.scoreRepo.create({
      gameEventId: data.gameEventId,
      seasonTeamId: data.seasonTeamId,
      points: CHEER_POINTS,
      source: ScoreSource.CHEER,
      ipHash: data.ipHash,
      fingerprint: data.fingerprint ?? null,
    });
    await this.scoreRepo.save(score);
    await this.updateSeasonTeamScore(data.seasonTeamId);

    return saved;
  }

  private async updateSeasonTeamScore(seasonTeamId: string): Promise<void> {
    const result = await this.scoreRepo
      .createQueryBuilder("score")
      .select("COALESCE(SUM(score.points), 0)", "total")
      .where("score.seasonTeamId = :seasonTeamId", { seasonTeamId })
      .getRawOne();

    await this.seasonTeamRepo.update(seasonTeamId, {
      totalScore: parseInt(result.total, 10),
    });
  }

  /**
   * 최근 응원 메시지 목록 (팀별 or 전체)
   */
  async getMessages(
    gameEventId: string,
    seasonTeamId?: string,
    limit = 50,
  ): Promise<CheerMessage[]> {
    const qb = this.cheerRepo
      .createQueryBuilder("c")
      .where("c.gameEventId = :gameEventId", { gameEventId })
      .andWhere("c.isVisible = :visible", { visible: true })
      .orderBy("c.createdAt", "DESC")
      .take(limit);

    if (seasonTeamId) {
      qb.andWhere("c.seasonTeamId = :seasonTeamId", { seasonTeamId });
    }

    return qb.getMany();
  }

  /**
   * 팀별 응원 메시지 수
   */
  async getTeamMessageCounts(
    gameEventId: string,
  ): Promise<{ seasonTeamId: string; count: number }[]> {
    return this.cheerRepo
      .createQueryBuilder("c")
      .select("c.seasonTeamId", "seasonTeamId")
      .addSelect("COUNT(*)", "count")
      .where("c.gameEventId = :gameEventId", { gameEventId })
      .andWhere("c.isVisible = :visible", { visible: true })
      .groupBy("c.seasonTeamId")
      .orderBy("count", "DESC")
      .getRawMany();
  }
}
