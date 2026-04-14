import { Controller, Get, Post, Body, Param, Req } from "@nestjs/common";
import { createHash } from "crypto";
import { Request } from "express";
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
      fingerprint?: string;
    },
    @Req() req: Request,
  ) {
    const forwarded = req.headers["x-forwarded-for"];
    const rawIp = forwarded
      ? (Array.isArray(forwarded) ? forwarded[0] : forwarded).split(",")[0].trim()
      : (req.ip ?? "unknown");

    const ipHash = createHash("sha256")
      .update(rawIp + (process.env.IP_SALT || "kfc-default-salt"))
      .digest("hex")
      .substring(0, 16);

    return this.nominationService.nominate({ ...body, ipHash });
  }

  @Get("results/:seasonId")
  getResults(@Param("seasonId") seasonId: string) {
    return this.nominationService.getResults(seasonId);
  }
}
