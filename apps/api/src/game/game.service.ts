import { Injectable, OnModuleInit, OnModuleDestroy } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import Redis from "ioredis";
import { Score } from "./score.entity";
import { GameEvent } from "./game-event.entity";
import { ScoreSource } from "../common/enums/score-source.enum";
import { GameStatus } from "../common/enums/game-status.enum";

/** Redis key helpers */
const CLICK_KEY = (gameEventId: string, seasonTeamId: string) =>
  `clicks:${gameEventId}:${seasonTeamId}`;
const GOAL_KEY = (gameEventId: string) => `goal:${gameEventId}`;
const BURST_KEY = (gameEventId: string, seasonTeamId: string) =>
  `burst:${gameEventId}:${seasonTeamId}`;

const FLUSH_INTERVAL_MS = 2_000; // 2초마다 DB flush
const DEFAULT_GOAL = 10_000; // 기본 목표 클릭수

@Injectable()
export class GameService implements OnModuleInit, OnModuleDestroy {
  private redis!: Redis;
  private flushTimer!: ReturnType<typeof setInterval>;

  constructor(
    @InjectRepository(Score)
    private readonly scoreRepo: Repository<Score>,
    @InjectRepository(GameEvent)
    private readonly gameEventRepo: Repository<GameEvent>,
  ) {}

  onModuleInit() {
    this.redis = new Redis({
      host: process.env.REDIS_HOST || "localhost",
      port: Number(process.env.REDIS_PORT) || 6379,
      maxRetriesPerRequest: 3,
      lazyConnect: true,
    });
    this.redis.connect().catch(() => {
      console.warn("Redis connection failed – falling back to DB-only mode");
    });

    this.flushTimer = setInterval(() => this.flushAllToDb(), FLUSH_INTERVAL_MS);
  }

  onModuleDestroy() {
    clearInterval(this.flushTimer);
    this.redis?.disconnect();
  }

  // ──────────────────────────────────────
  //  Click: Redis increment (no DB write)
  // ──────────────────────────────────────

  async addClick(data: {
    gameEventId: string;
    seasonTeamId: string;
    ipHash: string;
    fingerprint?: string;
  }): Promise<{ total: number; goal: number; isBurst: boolean }> {
    const { gameEventId, seasonTeamId } = data;
    const key = CLICK_KEY(gameEventId, seasonTeamId);

    // Redis INCR (atomic)
    const total = await this.redis.incr(key);

    // 첫 클릭이면 goal 세팅
    if (total === 1) {
      await this.ensureGoal(gameEventId);
    }

    const goal = await this.getGoal(gameEventId);
    const burstKey = BURST_KEY(gameEventId, seasonTeamId);
    const alreadyBurst = await this.redis.get(burstKey);

    let isBurst = false;
    if (total >= goal && !alreadyBurst) {
      // 박 터짐!
      await this.redis.set(burstKey, "1");
      isBurst = true;
    }

    return { total, goal, isBurst };
  }

  // ──────────────────────────────────────
  //  Goal management
  // ──────────────────────────────────────

  private async ensureGoal(gameEventId: string): Promise<void> {
    const goalKey = GOAL_KEY(gameEventId);
    const exists = await this.redis.exists(goalKey);
    if (exists) return;

    // DB에서 config.goal 가져오기
    const event = await this.gameEventRepo.findOne({
      where: { id: gameEventId },
    });
    const goal =
      (event?.config as { goal?: number } | null)?.goal ?? DEFAULT_GOAL;
    await this.redis.set(goalKey, goal.toString());
  }

  async getGoal(gameEventId: string): Promise<number> {
    const goalKey = GOAL_KEY(gameEventId);
    const val = await this.redis.get(goalKey);
    return val ? parseInt(val, 10) : DEFAULT_GOAL;
  }

  // ──────────────────────────────────────
  //  Progress: 모든 팀의 현재 점수
  // ──────────────────────────────────────

  async getProgress(
    gameEventId: string,
    seasonTeamIds: string[],
  ): Promise<{
    goal: number;
    teams: { seasonTeamId: string; total: number; isBurst: boolean }[];
  }> {
    const goal = await this.getGoal(gameEventId);
    const teams = await Promise.all(
      seasonTeamIds.map(async (stId) => {
        const key = CLICK_KEY(gameEventId, stId);
        const burstKey = BURST_KEY(gameEventId, stId);
        const [totalStr, burstStr] = await Promise.all([
          this.redis.get(key),
          this.redis.get(burstKey),
        ]);
        return {
          seasonTeamId: stId,
          total: totalStr ? parseInt(totalStr, 10) : 0,
          isBurst: burstStr === "1",
        };
      }),
    );
    return { goal, teams };
  }

  // ──────────────────────────────────────
  //  Flush: Redis → DB 배치 기록
  // ──────────────────────────────────────

  private async flushAllToDb(): Promise<void> {
    try {
      const keys = await this.redis.keys("clicks:*");
      if (keys.length === 0) return;

      for (const key of keys) {
        const val = await this.redis.getset(key, "0");
        const count = val ? parseInt(val, 10) : 0;
        if (count <= 0) continue;

        // key = "clicks:{gameEventId}:{seasonTeamId}"
        const parts = key.split(":");
        const gameEventId = parts[1];
        const seasonTeamId = parts[2];

        // 배치 Score 레코드 (합산)
        const score = this.scoreRepo.create({
          gameEventId,
          seasonTeamId,
          points: count,
          source: ScoreSource.CLICK,
          ipHash: "batch",
          fingerprint: null,
        });
        await this.scoreRepo.save(score);
      }
    } catch {
      // Redis 연결 실패 등 → 다음 주기에 재시도
    }
  }

  // ──────────────────────────────────────
  //  기존 DB 기반 조회 (스코어보드용)
  // ──────────────────────────────────────

  async getScoresByGameEvent(
    gameEventId: string,
  ): Promise<{ seasonTeamId: string; total: number }[]> {
    return this.scoreRepo
      .createQueryBuilder("s")
      .select("s.seasonTeamId", "seasonTeamId")
      .addSelect("SUM(s.points)", "total")
      .where("s.gameEventId = :gameEventId", { gameEventId })
      .groupBy("s.seasonTeamId")
      .orderBy("total", "DESC")
      .getRawMany();
  }

  async findActiveGameEvents(): Promise<GameEvent[]> {
    return this.gameEventRepo.find({
      where: { status: GameStatus.ACTIVE },
      relations: ["season"],
    });
  }
}
