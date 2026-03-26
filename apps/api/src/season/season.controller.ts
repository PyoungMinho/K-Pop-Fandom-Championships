import { Controller, Get } from "@nestjs/common";
import { SeasonService } from "./season.service";

@Controller("season")
export class SeasonController {
  constructor(private readonly seasonService: SeasonService) {}

  @Get("current")
  getCurrentSeason() {
    return this.seasonService.getCurrentSeason();
  }
}
