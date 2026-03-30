import { Controller, Get } from "@nestjs/common";
import { AdminService } from "./admin.service";

/**
 * 인증 없이 공개된 사이트 설정 엔드포인트
 * - winner_embed_url, event_banner_url, announcement, winner_team_name 등
 */
@Controller("public")
export class PublicController {
  constructor(private readonly adminService: AdminService) {}

  @Get("settings")
  getSettings() {
    return this.adminService.getAllSettings();
  }
}
