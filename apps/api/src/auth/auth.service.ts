import { Injectable, UnauthorizedException } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { ConfigService } from "@nestjs/config";

@Injectable()
export class AuthService {
  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  async login(username: string, password: string) {
    const adminUser = this.configService.get<string>("ADMIN_USERNAME", "admin");
    const adminPass = this.configService.get<string>(
      "ADMIN_PASSWORD",
      "changeme",
    );

    if (username !== adminUser || password !== adminPass) {
      throw new UnauthorizedException("잘못된 관리자 계정입니다");
    }

    const payload = { sub: "admin", role: "admin" };
    return {
      accessToken: this.jwtService.sign(payload),
      expiresIn: "24h",
    };
  }
}
