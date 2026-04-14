import { Entity, Column, ManyToOne, Index } from "typeorm";
import { BaseCreateOnlyEntity } from "../common/entities/base.entity";
import { ScoreSource } from "../common/enums/score-source.enum";
import { GameEvent } from "./game-event.entity";
import { SeasonTeam } from "../season/season-team.entity";

@Entity("score")
@Index(["gameEvent", "seasonTeam"])
@Index(["ipHash", "gameEvent"])
export class Score extends BaseCreateOnlyEntity {
  @ManyToOne(() => GameEvent, (ge) => ge.scores, { onDelete: "CASCADE" })
  gameEvent!: GameEvent;

  @Column()
  gameEventId!: string;

  @ManyToOne(() => SeasonTeam, (st) => st.scores, { onDelete: "CASCADE" })
  seasonTeam!: SeasonTeam;

  @Column()
  seasonTeamId!: string;

  @Column({ type: "bigint" })
  points!: number;

  @Column({ type: "smallint", default: 1 })
  multiplier!: number;

  @Column({ type: "enum", enum: ScoreSource })
  source!: ScoreSource;

  @Column({ type: "varchar", length: 64 })
  ipHash!: string;

  @Column({ type: "varchar", length: 64, nullable: true })
  fingerprint!: string | null;
}
