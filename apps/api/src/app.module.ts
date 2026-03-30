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
      useFactory: (config: ConfigService) => ({
        type: "postgres" as const,
        host: config.get<string>("DB_HOST", "localhost"),
        port: config.get<number>("DB_PORT", 5433),
        username: config.get<string>("DB_USERNAME", "idol"),
        password: config.get<string>("DB_PASSWORD", "idol_secret"),
        database: config.get<string>("DB_DATABASE", "idol_championship"),
        entities: [__dirname + "/**/*.entity{.ts,.js}"],
        synchronize: config.get<string>("NODE_ENV") !== "production",
        logging: config.get<string>("NODE_ENV") !== "production",
      }),
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
