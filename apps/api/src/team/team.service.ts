import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { Team } from "./team.entity";

@Injectable()
export class TeamService {
  constructor(
    @InjectRepository(Team)
    private readonly teamRepo: Repository<Team>,
  ) {}

  findAll(): Promise<Team[]> {
    return this.teamRepo.find({ order: { name: "ASC" } });
  }

  findOne(id: string): Promise<Team | null> {
    return this.teamRepo.findOneBy({ id });
  }

  create(data: Partial<Team>): Promise<Team> {
    const team = this.teamRepo.create(data);
    return this.teamRepo.save(team);
  }
}
