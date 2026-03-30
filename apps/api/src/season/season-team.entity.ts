import { Entity, Column, ManyToOne, OneToMany, Index, Unique } from "typeorm";
import { BaseCreateOnlyEntity } from "../common/entities/base.entity";
import { Season } from "./season.entity";
import { Team } from "../team/team.entity";
import { Score } from "../game/score.entity";
import { CheerMessage } from "../game/cheer-message.entity";
import { BatonChain } from "../game/baton-chain.entity";

@Entity("season_team")
@Unique(["season", "team"])
@Index(["season", "totalScore"])
export class SeasonTeam extends BaseCreateOnlyEntity {
  @ManyToOne(() => Season, (s) => s.seasonTeams, { onDelete: "CASCADE" })
  season!: Season;

  @Column()
  seasonId!: string;

  @ManyToOne(() => Team, (t) => t.seasonTeams, { onDelete: "CASCADE" })
  team!: Team;

  @Column()
  teamId!: string;

  @Column({ type: "smallint", default: 0 })
  seedOrder!: number;

  @Column({ type: "bigint", default: 0 })
  totalScore!: number;

  @Column({ type: "smallint", nullable: true })
  rank!: number | null;

  @OneToMany(() => Score, (s) => s.seasonTeam)
  scores!: Score[];

  @OneToMany(() => CheerMessage, (cm) => cm.seasonTeam)
  cheerMessages!: CheerMessage[];

  @OneToMany(() => BatonChain, (bc) => bc.seasonTeam)
  batonChains!: BatonChain[];
}
