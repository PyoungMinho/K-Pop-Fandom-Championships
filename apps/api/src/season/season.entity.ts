import { Entity, Column, OneToMany, Index } from "typeorm";
import { BaseEntity } from "../common/entities/base.entity";
import { SeasonPhase } from "../common/enums/season-phase.enum";
import { SeasonStatus } from "../common/enums/season-status.enum";
import { SeasonTeam } from "./season-team.entity";
import { GameEvent } from "../game/game-event.entity";
import { Nomination } from "../nomination/nomination.entity";

@Entity("season")
@Index(["status", "phase"])
export class Season extends BaseEntity {
  @Column({ type: "int", unique: true })
  seasonNumber!: number;

  @Column({ type: "varchar", length: 200 })
  title!: string;

  @Column({ type: "timestamp" })
  startDate!: Date;

  @Column({ type: "timestamp" })
  endDate!: Date;

  @Column({ type: "enum", enum: SeasonPhase, default: SeasonPhase.BATTLE })
  phase!: SeasonPhase;

  @Column({ type: "enum", enum: SeasonStatus, default: SeasonStatus.UPCOMING })
  @Index()
  status!: SeasonStatus;

  @OneToMany(() => SeasonTeam, (st) => st.season)
  seasonTeams!: SeasonTeam[];

  @OneToMany(() => GameEvent, (ge) => ge.season)
  gameEvents!: GameEvent[];

  @OneToMany(() => Nomination, (n) => n.season)
  nominations!: Nomination[];
}
