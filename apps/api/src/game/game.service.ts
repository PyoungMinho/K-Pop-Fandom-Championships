import { Injectable, Inject, OnModuleDestroy } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import Redis from "ioredis";
import { Score } from "./score.entity";
import { GameEvent } from "./game-event.entity";
import { SeasonTeam } from "../season/season-team.entity";
import { ScoreSource } from "../common/enums/score-source.enum";
import { GameStatus } from "../common/enums/game-status.enum";
import { REDIS_CLIENT } from "../common/redis.provider";

/** Redis key helpers */
const CLICK_KEY = (gameEventId: string, seasonTeamId: string) =>
  `clicks:${gameEventId}:${seasonTeamId}`;
const GOAL_KEY = (gameEventId: string) => `goal:${gameEventId}`;
const BURST_KEY = (gameEventId: string, seasonTeamId: string) =>
  `burst:${gameEventId}:${seasonTeamId}`;
const COMBO_KEY = (gameEventId: string, ipHash: string) =>
  `combo:${gameEventId}:${ipHash}`;

// 콤보 만료 간격 (ms) — 1.5초 이내 연속 클릭이어야 콤보 유지
const COMBO_WINDOW_MS = 1_500;
// 콤보 Redis TTL (초) — 마지막 클릭 후 10초 뒤 자동 소멸
const COMBO_TTL_SEC = 10;

/** 콤보 카운트를 multiplier로 변환 */
function comboToMultiplier(count: number): number {
  if (count >= 50) return 4;
  if (count >= 20) return 3;
  if (count >= 5) return 2;
  return 1;
}

// ──────────────────────────────────────
//  Rate Limiter key helpers
// ──────────────────────────────────────
const RL_SEC_KEY = (ipHash: string) => `rl:click:sec:${ipHash}`;
const RL_MIN_KEY = (ipHash: string) => `rl:click:min:${ipHash}`;
const RL_HOUR_KEY = (ipHash: string) => `rl:click:hour:${ipHash}`;

// Rate limit thresholds
const RL_SEC_LIMIT = 15;
const RL_MIN_LIMIT = 500;
const RL_HOUR_LIMIT = 10_000;

// Event status cache key
const EVENT_STATUS_KEY = (gameEventId: string) =>
  `event:status:${gameEventId}`;
const EVENT_STATUS_TTL = 60; // seconds

const FLUSH_INTERVAL_MS = 2_000; // 2초마다 DB flush
const DEFAULT_GOAL = 10_000; // 기본 목표 클릭수

@Injectable()
export class GameService implements OnModuleDestroy {
  private flushTimer!: ReturnType<typeof setInterval>;

  constructor(
    @InjectRepository(Score)
    private readonly scoreRepo: Repository<Score>,
    @InjectRepository(GameEvent)
    private readonly gameEventRepo: Repository<GameEvent>,
    @InjectRepository(SeasonTeam)
    private readonly seasonTeamRepo: Repository<SeasonTeam>,
    @Inject(REDIS_CLIENT)
    private readonly redis: Redis,
  ) {
    this.flushTimer = setInterval(() => this.flushAllToDb(), FLUSH_INTERVAL_MS);
  }

  onModuleDestroy() {
    clearInterval(this.flushTimer);
  }

  // ──────────────────────────────────────
  //  Click: Redis increment (no DB write)
  // ──────────────────────────────────────

  async addClick(data: {
    gameEventId: string;
    seasonTeamId: string;
    ipHash: string;
    fingerprint?: string;
  }): Promise<{ total: number; goal: number; isBurst: boolean; combo: number; multiplier: number }> {
    const { gameEventId, seasonTeamId, ipHash } = data;

    // ── B5: GameEvent ACTIVE 상태 검증 ──────────────────────────────
    await this.assertEventActive(gameEventId);

    // ── B4: Sliding Window Rate Limiter ─────────────────────────────
    await this.assertRateLimit(ipHash);

    // ── B6: 콤보 상태 추적 및 multiplier 결정 ─────────────────────
    const comboKey = COMBO_KEY(gameEventId, ipHash);
    const comboData = await this.redis.hgetall(comboKey);

    const now = Date.now();
    let comboCount: number;

    if (
      comboData &&
      comboData.lastClickAt &&
      now - parseInt(comboData.lastClickAt, 10) <= COMBO_WINDOW_MS
    ) {
      // 1.5초 이내 연속 클릭 → 콤보 증가
      comboCount = parseInt(comboData.count, 10) + 1;
    } else {
      // 콤보 초기화
      comboCount = 1;
    }

    // 콤보 상태 저장 (HMSET + EXPIRE)
    await this.redis.hmset(comboKey, {
      count: comboCount.toString(),
      lastClickAt: now.toString(),
    });
    await this.redis.expire(comboKey, COMBO_TTL_SEC);

    const multiplier = comboToMultiplier(comboCount);

    // ── 클릭 카운트 증가 (atomic INCRBY — multiplier 반영) ──────────
    const key = CLICK_KEY(gameEventId, seasonTeamId);
    const total = await this.redis.incrby(key, multiplier);

    // 첫 증가(또는 최초 도달)이면 goal 세팅
    if (total <= multiplier) {
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

    return { total, goal, isBurst, combo: comboCount, multiplier };
  }

  // ──────────────────────────────────────
  //  B5: GameEvent ACTIVE 상태 검증
  // ──────────────────────────────────────

  /**
   * gameEventId에 해당하는 이벤트가 ACTIVE 상태인지 확인한다.
   * Redis 캐시(TTL 60s)를 먼저 확인하고, 캐시 미스 시 DB 조회 후 캐시에 저장한다.
   * ACTIVE가 아니면 Error를 throw한다.
   */
  private async assertEventActive(gameEventId: string): Promise<void> {
    const cacheKey = EVENT_STATUS_KEY(gameEventId);
    const cached = await this.redis.get(cacheKey);

    let status: string;
    if (cached !== null) {
      status = cached;
    } else {
      const event = await this.gameEventRepo.findOne({
        where: { id: gameEventId },
        select: ["id", "status"],
      });

      if (!event) {
        throw new Error("EVENT_NOT_FOUND");
      }

      status = event.status;
      // 캐시 저장 (TTL 60초)
      await this.redis.set(cacheKey, status, "EX", EVENT_STATUS_TTL);
    }

    if (status !== GameStatus.ACTIVE) {
      throw new Error(`EVENT_NOT_ACTIVE:${status}`);
    }
  }

  // ──────────────────────────────────────
  //  B4: Sliding Window Rate Limiter
  // ──────────────────────────────────────

  /**
   * 3단계 Rate Limit을 검사한다.
   * - 초당 15회: Redis Sorted Set 기반 Sliding Window
   * - 분당 500회: INCR + EXPIRE 기반 카운터
   * - 시간당 10,000회: INCR + EXPIRE 기반 카운터
   *
   * 초과 시 Error를 throw한다. Gateway에서 click:rejected 이벤트로 응답.
   */
  private async assertRateLimit(ipHash: string): Promise<void> {
    const now = Date.now();
    const secKey = RL_SEC_KEY(ipHash);

    // ── 1. 초당 제한: Sorted Set Sliding Window ──────────────────────
    // MULTI/EXEC 파이프라인으로 원자성 보장
    const secPipeline = this.redis.pipeline();
    secPipeline.zremrangebyscore(secKey, 0, now - 1_000); // 1초 이전 멤버 제거
    secPipeline.zcard(secKey);                             // 현재 윈도우 내 카운트
    secPipeline.zadd(secKey, now, `${now}:${Math.random()}`); // 현재 요청 추가
    secPipeline.expire(secKey, 2);                         // 안전 TTL (2초)

    const secResults = await secPipeline.exec();
    // exec() 반환: [Error|null, unknown][] | null
    if (!secResults) {
      throw new Error("RATE_LIMITER_ERROR");
    }
    // index 1: zcard 결과 (파이프라인 내 zremrangebyscore 이후 기존 개수)
    const secCount = (secResults[1][1] as number) ?? 0;
    if (secCount >= RL_SEC_LIMIT) {
      throw new Error("RATE_LIMIT_EXCEEDED:SEC");
    }

    // ── 2. 분당 제한: INCR + EXPIRE ──────────────────────────────────
    const minKey = RL_MIN_KEY(ipHash);
    const minPipeline = this.redis.pipeline();
    minPipeline.incr(minKey);
    minPipeline.ttl(minKey);

    const minResults = await minPipeline.exec();
    if (!minResults) {
      throw new Error("RATE_LIMITER_ERROR");
    }

    const minCount = (minResults[0][1] as number) ?? 0;
    const minTtl = (minResults[1][1] as number) ?? -1;

    // 첫 증가(카운트가 1)이거나 TTL이 설정되지 않은 경우에만 TTL 세팅
    if (minTtl < 0) {
      await this.redis.expire(minKey, 60);
    }
    if (minCount > RL_MIN_LIMIT) {
      throw new Error("RATE_LIMIT_EXCEEDED:MIN");
    }

    // ── 3. 시간당 제한: INCR + EXPIRE ────────────────────────────────
    const hourKey = RL_HOUR_KEY(ipHash);
    const hourPipeline = this.redis.pipeline();
    hourPipeline.incr(hourKey);
    hourPipeline.ttl(hourKey);

    const hourResults = await hourPipeline.exec();
    if (!hourResults) {
      throw new Error("RATE_LIMITER_ERROR");
    }

    const hourCount = (hourResults[0][1] as number) ?? 0;
    const hourTtl = (hourResults[1][1] as number) ?? -1;

    if (hourTtl < 0) {
      await this.redis.expire(hourKey, 3_600);
    }
    if (hourCount > RL_HOUR_LIMIT) {
      throw new Error("RATE_LIMIT_EXCEEDED:HOUR");
    }
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
      // KEYS는 O(N) 블로킹 명령어 → SCAN으로 교체
      const keys: string[] = [];
      let cursor = "0";
      do {
        const [nextCursor, batch] = await this.redis.scan(
          cursor,
          "MATCH",
          "clicks:*",
          "COUNT",
          100,
        );
        cursor = nextCursor;
        keys.push(...batch);
      } while (cursor !== "0");

      if (keys.length === 0) return;

      // 영향받는 seasonTeamId를 모아서 루프 끝에 한 번씩만 갱신
      const affectedSeasonTeamIds = new Set<string>();

      for (const key of keys) {
        const val = await this.redis.getset(key, "0");
        const count = val ? parseInt(val, 10) : 0;
        if (count <= 0) continue;

        // key = "clicks:{gameEventId}:{seasonTeamId}"
        const parts = key.split(":");
        const gameEventId = parts[1];
        const seasonTeamId = parts[2];

        // 배치 Score 레코드 (합산)
        // multiplier는 이미 Redis INCRBY 시 반영됐으므로 여기선 기본값 1 사용
        const score = this.scoreRepo.create({
          gameEventId,
          seasonTeamId,
          points: count,
          multiplier: 1,
          source: ScoreSource.CLICK,
          ipHash: "batch",
          fingerprint: null,
        });
        await this.scoreRepo.save(score);

        affectedSeasonTeamIds.add(seasonTeamId);
      }

      // 루프 완료 후 영향받은 팀만 한 번씩 totalScore 갱신
      await Promise.all(
        [...affectedSeasonTeamIds].map((id) => this.updateSeasonTeamScore(id)),
      );
    } catch {
      // Redis 연결 실패 등 → 다음 주기에 재시도
    }
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
