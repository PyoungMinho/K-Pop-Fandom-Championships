import { Entity, Column, ManyToOne, OneToMany, Index } from "typeorm";
import { BaseEntity } from "../common/entities/base.entity";
import { GameType } from "../common/enums/game-type.enum";
import { GameStatus } from "../common/enums/game-status.enum";
import { Season } from "../season/season.entity";
import { Score } from "./score.entity";
import { CheerMessage } from "./cheer-message.entity";
import { BatonChain } from "./baton-chain.entity";

@Entity("game_event")
@Index(["season", "dayNumber"])
@Index(["season", "gameType"])
export class GameEvent extends BaseEntity {
  @ManyToOne(() => Season, (s) => s.gameEvents, { onDelete: "CASCADE" })
  season!: Season;

  @Column()
  seasonId!: string;

  @Column({ type: "enum", enum: GameType })
  gameType!: GameType;

  @Column({ type: "smallint" })
  dayNumber!: number;

  @Column({ type: "timestamp" })
  startTime!: Date;

  @Column({ type: "timestamp" })
  endTime!: Date;

  @Column({ type: "enum", enum: GameStatus, default: GameStatus.SCHEDULED })
  @Index()
  status!: GameStatus;

  @Column({ type: "jsonb", nullable: true })
  config!: Record<string, unknown> | null;

  @OneToMany(() => Score, (s) => s.gameEvent)
  scores!: Score[];

  @OneToMany(() => CheerMessage, (cm) => cm.gameEvent)
  cheerMessages!: CheerMessage[];

  @OneToMany(() => BatonChain, (bc) => bc.gameEvent)
  batonChains!: BatonChain[];
}
