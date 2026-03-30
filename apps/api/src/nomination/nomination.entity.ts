import { Entity, Column, ManyToOne, Index, Unique } from "typeorm";
import { BaseCreateOnlyEntity } from "../common/entities/base.entity";
import { Season } from "../season/season.entity";
import { Team } from "../team/team.entity";

@Entity("nomination")
@Unique(["season", "ipHash"])
@Index(["season", "team"])
export class Nomination extends BaseCreateOnlyEntity {
  @ManyToOne(() => Season, (s) => s.nominations, { onDelete: "CASCADE" })
  season!: Season;

  @Column()
  seasonId!: string;

  @ManyToOne(() => Team, (t) => t.nominations, { onDelete: "CASCADE" })
  team!: Team;

  @Column()
  teamId!: string;

  @Column({ type: "varchar", length: 64 })
  ipHash!: string;

  @Column({ type: "varchar", length: 64, nullable: true })
  fingerprint!: string | null;
}
