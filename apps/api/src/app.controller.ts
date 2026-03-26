import { Controller, Get } from "@nestjs/common";

@Controller()
export class AppController {
  @Get()
  healthCheck() {
    return { status: "ok", service: "idol-athletic-championship-api" };
  }
}
