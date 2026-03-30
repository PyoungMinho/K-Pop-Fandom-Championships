import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { CheerMessage } from "./cheer-message.entity";
import { Score } from "./score.entity";
import { ScoreSource } from "../common/enums/score-source.enum";

const CHEER_POINTS = 2; // 응원 메시지 1회당 점수
const RATE_LIMIT_MS = 5_000; // 같은 IP 5초 쿨다운

@Injectable()
export class CheerService {
  // 인메모리 rate limiter (IP → 마지막 전송 시각)
  private rateLimitMap = new Map<string, number>();

  constructor(
    @InjectRepository(CheerMessage)
    private readonly cheerRepo: Repository<CheerMessage>,
    @InjectRepository(Score)
    private readonly scoreRepo: Repository<Score>,
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
    // Rate limit 체크
    const lastSent = this.rateLimitMap.get(data.ipHash) ?? 0;
    if (Date.now() - lastSent < RATE_LIMIT_MS) {
      throw new Error("RATE_LIMITED");
    }
    this.rateLimitMap.set(data.ipHash, Date.now());

    // 메시지 저장
    const msg = this.cheerRepo.create({
      gameEventId: data.gameEventId,
      seasonTeamId: data.seasonTeamId,
      content: data.content.slice(0, 200),
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

    return saved;
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
