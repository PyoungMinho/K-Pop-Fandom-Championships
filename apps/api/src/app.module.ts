import { Module } from "@nestjs/common";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { TypeOrmModule } from "@nestjs/typeorm";
import { AppController } from "./app.controller";
import { AuthModule } from "./auth/auth.module";
import { AdminModule } from "./admin/admin.module";
import { TeamModule } from "./team/team.module";
import { SeasonModule } from "./season/season.module";
import { GameModule } from "./game/game.module";
import { ScoreboardModule } from "./scoreboard/scoreboard.module";
import { NominationModule } from "./nomination/nomination.module";

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        const databaseUrl = config.get<string>("DATABASE_URL");
        const isProd = config.get<string>("NODE_ENV") === "production";

        // Railway/클라우드: DATABASE_URL 하나로 연결
        if (databaseUrl) {
          return {
            type: "postgres" as const,
            url: databaseUrl,
            ssl: isProd ? { rejectUnauthorized: false } : false,
            entities: [__dirname + "/**/*.entity{.ts,.js}"],
            synchronize: !isProd,
            logging: !isProd,
          };
        }

        // 로컬 개발: 개별 환경변수 사용
        return {
          type: "postgres" as const,
          host: config.get<string>("DB_HOST", "localhost"),
          port: config.get<number>("DB_PORT", 5433),
          username: config.get<string>("DB_USERNAME", "idol"),
          password: config.get<string>("DB_PASSWORD", "idol_secret"),
          database: config.get<string>("DB_DATABASE", "idol_championship"),
          entities: [__dirname + "/**/*.entity{.ts,.js}"],
          synchronize: !isProd,
          logging: !isProd,
        };
      },
    }),
    AuthModule,
    AdminModule,
    TeamModule,
    SeasonModule,
    GameModule,
    ScoreboardModule,
    NominationModule,
  ],
  controllers: [AppController],
})
export class AppModule {}
