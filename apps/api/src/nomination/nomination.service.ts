import { Injectable, ConflictException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { Nomination } from "./nomination.entity";

@Injectable()
export class NominationService {
  constructor(
    @InjectRepository(Nomination)
    private readonly nominationRepo: Repository<Nomination>,
  ) {}

  async nominate(data: {
    seasonId: string;
    teamId: string;
    ipHash: string;
    fingerprint?: string;
  }): Promise<Nomination> {
    const existing = await this.nominationRepo.findOneBy({
      seasonId: data.seasonId,
      ipHash: data.ipHash,
    });

    if (existing) {
      throw new ConflictException("이미 이번 시즌에 투표하셨습니다.");
    }

    const nomination = this.nominationRepo.create(data);
    return this.nominationRepo.save(nomination);
  }

  async getResults(
    seasonId: string,
  ): Promise<{ teamId: string; count: number }[]> {
    return this.nominationRepo
      .createQueryBuilder("n")
      .select("n.teamId", "teamId")
      .addSelect("COUNT(*)", "count")
      .where("n.seasonId = :seasonId", { seasonId })
      .groupBy("n.teamId")
      .orderBy("count", "DESC")
      .getRawMany();
  }
}
