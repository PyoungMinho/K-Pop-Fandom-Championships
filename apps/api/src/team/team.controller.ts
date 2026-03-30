import { Controller, Get, Post, Body, Param } from "@nestjs/common";
import { TeamService } from "./team.service";

@Controller("teams")
export class TeamController {
  constructor(private readonly teamService: TeamService) {}

  @Get()
  findAll() {
    return this.teamService.findAll();
  }

  @Get(":id")
  findOne(@Param("id") id: string) {
    return this.teamService.findOne(id);
  }

  @Post()
  create(
    @Body()
    body: {
      name: string;
      shortName: string;
      colorCode: string;
      logoUrl?: string;
    },
  ) {
    return this.teamService.create(body);
  }
}
