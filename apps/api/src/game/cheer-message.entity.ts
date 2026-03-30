import { Entity, Column, ManyToOne, Index } from "typeorm";
import { BaseCreateOnlyEntity } from "../common/entities/base.entity";
import { GameEvent } from "./game-event.entity";
import { SeasonTeam } from "../season/season-team.entity";

@Entity("cheer_message")
@Index(["gameEvent", "seasonTeam", "createdAt"])
@Index(["ipHash", "gameEvent"])
export class CheerMessage extends BaseCreateOnlyEntity {
  @ManyToOne(() => GameEvent, (ge) => ge.cheerMessages, {
    onDelete: "CASCADE",
  })
  gameEvent!: GameEvent;

  @Column()
  gameEventId!: string;

  @ManyToOne(() => SeasonTeam, (st) => st.cheerMessages, {
    onDelete: "CASCADE",
  })
  seasonTeam!: SeasonTeam;

  @Column()
  seasonTeamId!: string;

  @Column({ type: "varchar", length: 200 })
  content!: string;

  @Column({ type: "boolean", default: true })
  isVisible!: boolean;

  @Column({ type: "varchar", length: 64 })
  ipHash!: string;

  @Column({ type: "varchar", length: 64, nullable: true })
  fingerprint!: string | null;
}
