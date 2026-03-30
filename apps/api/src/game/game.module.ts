import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { GameEvent } from "./game-event.entity";
import { Score } from "./score.entity";
import { CheerMessage } from "./cheer-message.entity";
import { BatonChain } from "./baton-chain.entity";
import { GameGateway } from "./game.gateway";
import { GameService } from "./game.service";
import { BatonService } from "./baton.service";
import { CheerService } from "./cheer.service";

@Module({
  imports: [
    TypeOrmModule.forFeature([GameEvent, Score, CheerMessage, BatonChain]),
  ],
  providers: [GameGateway, GameService, BatonService, CheerService],
  exports: [GameService, BatonService, CheerService],
})
export class GameModule {}
