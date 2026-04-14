import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { randomBytes } from "crypto";
import { BatonChain } from "./baton-chain.entity";
import { Score } from "./score.entity";
import { SeasonTeam } from "../season/season-team.entity";
import { ScoreSource } from "../common/enums/score-source.enum";

const BATON_POINTS = 5; // 바통 연결 1회당 점수

@Injectable()
export class BatonService {
  constructor(
    @InjectRepository(BatonChain)
    private readonly batonRepo: Repository<BatonChain>,
    @InjectRepository(Score)
    private readonly scoreRepo: Repository<Score>,
    @InjectRepository(SeasonTeam)
    private readonly seasonTeamRepo: Repository<SeasonTeam>,
  ) {}

  /**
   * 초대 링크 생성 (바통 시작점)
   */
  async createInvite(data: {
    gameEventId: string;
    seasonTeamId: string;
    ipHash: string;
    fingerprint?: string;
  }): Promise<BatonChain> {
    const inviteCode = this.generateCode();
    const baton = this.batonRepo.create({
      ...data,
      inviteCode,
      parent: null,
      parentId: null,
      depth: 0,
    });
    return this.batonRepo.save(baton);
  }

  /**
   * 초대 링크로 바통 이어받기
   * - 같은 IP/fingerprint 중복 방지
   * - 부모 바통에 연결 → depth 증가
   * - 점수 부여
   */
  async acceptBaton(data: {
    inviteCode: string;
    ipHash: string;
    fingerprint?: string;
  }): Promise<{
    baton: BatonChain;
    isNew: boolean;
    chainLength: number;
    teamTotal: number;
  }> {
    const parent = await this.batonRepo.findOne({
      where: { inviteCode: data.inviteCode },
    });
    if (!parent) {
      throw new Error("INVALID_INVITE_CODE");
    }

    // 중복 참여 체크 (IP 기반)
    const existing = await this.batonRepo.findOne({
      where: {
        gameEventId: parent.gameEventId,
        ipHash: data.ipHash,
      },
    });
    if (existing) {
      // 이미 참여한 사용자 → 기존 바통 반환
      const teamTotal = await this.getTeamBatonCount(
        parent.gameEventId,
        parent.seasonTeamId,
      );
      return {
        baton: existing,
        isNew: false,
        chainLength: existing.depth,
        teamTotal,
      };
    }

    // 새 바통 생성
    const newBaton = this.batonRepo.create({
      gameEventId: parent.gameEventId,
      seasonTeamId: parent.seasonTeamId,
      inviteCode: this.generateCode(),
      parentId: parent.id,
      depth: parent.depth + 1,
      ipHash: data.ipHash,
      fingerprint: data.fingerprint ?? null,
    });
    const saved = await this.batonRepo.save(newBaton);

    // 점수 부여
    const score = this.scoreRepo.create({
      gameEventId: parent.gameEventId,
      seasonTeamId: parent.seasonTeamId,
      points: BATON_POINTS,
      source: ScoreSource.BATON,
      ipHash: data.ipHash,
      fingerprint: data.fingerprint ?? null,
    });
    await this.scoreRepo.save(score);
    await this.updateSeasonTeamScore(parent.seasonTeamId);

    const teamTotal = await this.getTeamBatonCount(
      parent.gameEventId,
      parent.seasonTeamId,
    );

    return {
      baton: saved,
      isNew: true,
      chainLength: saved.depth,
      teamTotal,
    };
  }

  /**
   * 팀별 바통 연결 수
   */
  async getTeamBatonCount(
    gameEventId: string,
    seasonTeamId: string,
  ): Promise<number> {
    return this.batonRepo.count({
      where: { gameEventId, seasonTeamId },
    });
  }

  /**
   * 전체 팀 바통 현황
   */
  async getAllTeamBatonCounts(
    gameEventId: string,
  ): Promise<{ seasonTeamId: string; count: number }[]> {
    return this.batonRepo
      .createQueryBuilder("b")
      .select("b.seasonTeamId", "seasonTeamId")
      .addSelect("COUNT(*)", "count")
      .where("b.gameEventId = :gameEventId", { gameEventId })
      .groupBy("b.seasonTeamId")
      .orderBy("count", "DESC")
      .getRawMany();
  }

  /**
   * 특정 바통 체인 트리
   */
  async getChain(inviteCode: string): Promise<{
    chain: BatonChain[];
    depth: number;
  }> {
    const baton = await this.batonRepo.findOne({
      where: { inviteCode },
      relations: ["children"],
    });
    if (!baton) throw new Error("INVALID_INVITE_CODE");

    // 루트까지 올라가기
    const chain: BatonChain[] = [baton];
    let current = baton;
    while (current.parentId) {
      const parent = await this.batonRepo.findOne({
        where: { id: current.parentId },
      });
      if (!parent) break;
      chain.unshift(parent);
      current = parent;
    }

    return { chain, depth: baton.depth };
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

  private generateCode(): string {
    return randomBytes(6).toString("base64url").slice(0, 8);
  }
}
