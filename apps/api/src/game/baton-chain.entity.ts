import { Entity, Column, ManyToOne, OneToMany, Index } from "typeorm";
import { BaseCreateOnlyEntity } from "../common/entities/base.entity";
import { GameEvent } from "./game-event.entity";
import { SeasonTeam } from "../season/season-team.entity";

@Entity("baton_chain")
@Index(["gameEvent", "seasonTeam"])
export class BatonChain extends BaseCreateOnlyEntity {
  @ManyToOne(() => GameEvent, (ge) => ge.batonChains, { onDelete: "CASCADE" })
  gameEvent!: GameEvent;

  @Column()
  gameEventId!: string;

  @ManyToOne(() => SeasonTeam, (st) => st.batonChains, { onDelete: "CASCADE" })
  seasonTeam!: SeasonTeam;

  @Column()
  seasonTeamId!: string;

  @Column({ type: "varchar", length: 20, unique: true })
  inviteCode!: string;

  @ManyToOne(() => BatonChain, (bc) => bc.children, { nullable: true })
  parent!: BatonChain | null;

  @Column({ nullable: true })
  parentId!: string | null;

  @OneToMany(() => BatonChain, (bc) => bc.parent)
  children!: BatonChain[];

  @Column({ type: "smallint", default: 0 })
  depth!: number;

  @Column({ type: "varchar", length: 64 })
  ipHash!: string;

  @Column({ type: "varchar", length: 64, nullable: true })
  fingerprint!: string | null;
}
