import { Controller, Get, Param } from "@nestjs/common";
import { ScoreboardService } from "./scoreboard.service";

@Controller("scoreboard")
export class ScoreboardController {
  constructor(private readonly scoreboardService: ScoreboardService) {}

  @Get(":seasonId")
  getScoreboard(@Param("seasonId") seasonId: string) {
    return this.scoreboardService.getBySeasonId(seasonId);
  }
}
