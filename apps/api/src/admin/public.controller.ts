import { Controller, Get } from "@nestjs/common";
import { AdminService } from "./admin.service";

@Controller("public")
export class PublicController {
  constructor(private readonly adminService: AdminService) {}

  /** 인증 없이 사이트 설정 조회 (site_title, winner_embed_url, announcement 등) */
  @Get("settings")
  getSettings() {
    return this.adminService.getAllSettings();
  }

  /** 현재 활성 시즌 + 스코어보드 (User 단 메인/순위판에서 사용) */
  @Get("active-season")
  getActiveSeason() {
    return this.adminService.getActiveSeason();
  }

  /** 현재 활성 게임이벤트 조회 (game/relay/cheer 페이지에서 gameEventId 획득용) */
  @Get("active-game-event")
  getActiveGameEvent() {
    return this.adminService.getActiveGameEvent();
  }
}
