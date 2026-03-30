import { Controller, Get, Post, Body, Param } from "@nestjs/common";
import { NominationService } from "./nomination.service";

@Controller("nominations")
export class NominationController {
  constructor(private readonly nominationService: NominationService) {}

  @Post()
  nominate(
    @Body()
    body: {
      seasonId: string;
      teamId: string;
      ipHash: string;
      fingerprint?: string;
    },
  ) {
    return this.nominationService.nominate(body);
  }

  @Get("results/:seasonId")
  getResults(@Param("seasonId") seasonId: string) {
    return this.nominationService.getResults(seasonId);
  }
}
