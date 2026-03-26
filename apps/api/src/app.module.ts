import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { AppController } from "./app.controller";
import { GameModule } from "./game/game.module";
import { SeasonModule } from "./season/season.module";
import { ScoreboardModule } from "./scoreboard/scoreboard.module";

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    GameModule,
    SeasonModule,
    ScoreboardModule,
  ],
  controllers: [AppController],
})
export class AppModule {}
