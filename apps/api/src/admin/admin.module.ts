import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { Team } from "../team/team.entity";
import { Season } from "../season/season.entity";
import { SeasonTeam } from "../season/season-team.entity";
import { GameEvent } from "../game/game-event.entity";
import { CheerMessage } from "../game/cheer-message.entity";
import { Score } from "../game/score.entity";
import { BatonChain } from "../game/baton-chain.entity";
import { Nomination } from "../nomination/nomination.entity";
import { SiteSettings } from "./site-settings.entity";
import { AdminController } from "./admin.controller";
import { PublicController } from "./public.controller";
import { AdminService } from "./admin.service";

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Team,
      Season,
      SeasonTeam,
      GameEvent,
      CheerMessage,
      Score,
      BatonChain,
      Nomination,
      SiteSettings,
    ]),
  ],
  controllers: [AdminController, PublicController],
  providers: [AdminService],
})
export class AdminModule {}
