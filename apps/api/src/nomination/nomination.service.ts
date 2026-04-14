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
  ): Promise<
    { teamId: string; teamName: string; shortName: string; colorCode: string; voteCount: number }[]
  > {
    const raw: { teamId: string; voteCount: string; teamName: string; shortName: string; colorCode: string }[] =
      await this.nominationRepo
        .createQueryBuilder("n")
        .innerJoin("n.team", "t")
        .select("n.teamId", "teamId")
        .addSelect("t.name", "teamName")
        .addSelect("t.shortName", "shortName")
        .addSelect("t.colorCode", "colorCode")
        .addSelect("COUNT(*)", "voteCount")
        .where("n.seasonId = :seasonId", { seasonId })
        .groupBy("n.teamId")
        .addGroupBy("t.name")
        .addGroupBy("t.shortName")
        .addGroupBy("t.colorCode")
        .orderBy("voteCount", "DESC")
        .getRawMany();

    return raw.map((r) => ({
      teamId: r.teamId,
      teamName: r.teamName,
      shortName: r.shortName,
      colorCode: r.colorCode,
      voteCount: Number(r.voteCount),
    }));
  }
}
