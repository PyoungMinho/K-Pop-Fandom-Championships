import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { SeasonTeam } from "../season/season-team.entity";
import { ScoreboardController } from "./scoreboard.controller";
import { ScoreboardService } from "./scoreboard.service";

@Module({
  imports: [TypeOrmModule.forFeature([SeasonTeam])],
  controllers: [ScoreboardController],
  providers: [ScoreboardService],
})
export class ScoreboardModule {}
