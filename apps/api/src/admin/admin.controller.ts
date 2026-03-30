import {
  Controller,
  Get,
  Post,
  Put,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
} from "@nestjs/common";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { AdminService } from "./admin.service";

@Controller("admin")
@UseGuards(JwtAuthGuard)
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  // ═══════════ Teams ═══════════

  @Get("teams")
  getTeams() {
    return this.adminService.findAllTeams();
  }

  @Post("teams")
  createTeam(
    @Body()
    body: {
      name: string;
      shortName: string;
      colorCode: string;
      logoUrl?: string;
    },
  ) {
    return this.adminService.createTeam(body);
  }

  @Put("teams/:id")
  updateTeam(
    @Param("id") id: string,
    @Body()
    body: {
      name?: string;
      shortName?: string;
      colorCode?: string;
      logoUrl?: string;
    },
  ) {
    return this.adminService.updateTeam(id, body);
  }

  @Delete("teams/:id")
  deleteTeam(@Param("id") id: string) {
    return this.adminService.deleteTeam(id);
  }

  // ═══════════ Seasons ═══════════

  @Get("seasons")
  getSeasons() {
    return this.adminService.findAllSeasons();
  }

  @Post("seasons")
  createSeason(
    @Body()
    body: {
      seasonNumber: number;
      title: string;
      startDate: string;
      endDate: string;
    },
  ) {
    return this.adminService.createSeason({
      ...body,
      startDate: new Date(body.startDate),
      endDate: new Date(body.endDate),
    });
  }

  @Put("seasons/:id")
  updateSeason(
    @Param("id") id: string,
    @Body()
    body: { phase?: string; status?: string; title?: string },
  ) {
    return this.adminService.updateSeason(id, body as any);
  }

  @Post("seasons/:id/teams")
  addTeamToSeason(
    @Param("id") seasonId: string,
    @Body() body: { teamId: string; seedOrder?: number },
  ) {
    return this.adminService.addTeamToSeason(
      seasonId,
      body.teamId,
      body.seedOrder,
    );
  }

  // ═══════════ Game Events ═══════════

  @Get("game-events")
  getGameEvents(@Query("seasonId") seasonId?: string) {
    return this.adminService.findGameEvents(seasonId);
  }

  @Post("game-events")
  createGameEvent(
    @Body()
    body: {
      seasonId: string;
      gameType: string;
      dayNumber: number;
      startTime: string;
      endTime: string;
      config?: Record<string, unknown>;
    },
  ) {
    return this.adminService.createGameEvent({
      ...body,
      startTime: new Date(body.startTime),
      endTime: new Date(body.endTime),
    } as any);
  }

  @Put("game-events/:id")
  updateGameEvent(
    @Param("id") id: string,
    @Body()
    body: {
      status?: string;
      config?: Record<string, unknown>;
      startTime?: string;
      endTime?: string;
    },
  ) {
    const data: any = { ...body };
    if (body.startTime) data.startTime = new Date(body.startTime);
    if (body.endTime) data.endTime = new Date(body.endTime);
    return this.adminService.updateGameEvent(id, data);
  }

  // ═══════════ Cheer Moderation ═══════════

  @Get("cheers")
  getCheers(
    @Query("page") page?: string,
    @Query("limit") limit?: string,
    @Query("seasonTeamId") seasonTeamId?: string,
    @Query("isVisible") isVisible?: string,
    @Query("search") search?: string,
  ) {
    return this.adminService.findCheers({
      page: page ? parseInt(page) : 1,
      limit: limit ? parseInt(limit) : 20,
      seasonTeamId,
      isVisible: isVisible !== undefined ? isVisible === "true" : undefined,
      search,
    });
  }

  @Patch("cheers/:id/hide")
  hideCheer(@Param("id") id: string) {
    return this.adminService.hideCheer(id);
  }

  @Patch("cheers/:id/show")
  showCheer(@Param("id") id: string) {
    return this.adminService.showCheer(id);
  }

  @Patch("cheers/bulk-hide")
  bulkHideCheers(@Body() body: { ids: string[] }) {
    return this.adminService.bulkHideCheers(body.ids);
  }

  // ═══════════ Settings ═══════════

  @Get("settings")
  getSettings() {
    return this.adminService.getAllSettings();
  }

  @Put("settings/:key")
  updateSetting(@Param("key") key: string, @Body() body: { value: string }) {
    return this.adminService.upsertSetting(key, body.value);
  }

  // ═══════════ Analytics ═══════════

  @Get("analytics")
  getAnalytics() {
    return this.adminService.getAnalytics();
  }
}
