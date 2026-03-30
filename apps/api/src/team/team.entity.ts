import { Entity, Column, OneToMany } from "typeorm";
import { BaseEntity } from "../common/entities/base.entity";
import { SeasonTeam } from "../season/season-team.entity";
import { Nomination } from "../nomination/nomination.entity";

@Entity("team")
export class Team extends BaseEntity {
  @Column({ type: "varchar", length: 100 })
  name!: string;

  @Column({ type: "varchar", length: 20 })
  shortName!: string;

  @Column({ type: "varchar", length: 500, nullable: true })
  logoUrl!: string | null;

  @Column({ type: "varchar", length: 7 })
  colorCode!: string;

  @OneToMany(() => SeasonTeam, (st) => st.team)
  seasonTeams!: SeasonTeam[];

  @OneToMany(() => Nomination, (n) => n.team)
  nominations!: Nomination[];
}
