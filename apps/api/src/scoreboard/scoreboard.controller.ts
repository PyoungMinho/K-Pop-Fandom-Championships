import { Controller, Get } from "@nestjs/common";

@Controller("scoreboard")
export class ScoreboardController {
  @Get()
  getScoreboard() {
    return { teams: [], updatedAt: new Date().toISOString() };
  }
}
