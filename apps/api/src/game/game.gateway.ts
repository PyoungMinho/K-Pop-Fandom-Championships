import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
} from "@nestjs/websockets";
import { Server, Socket } from "socket.io";
import { GameService } from "./game.service";

@WebSocketGateway({ cors: { origin: "*" } })
export class GameGateway {
  @WebSocketServer()
  server!: Server;

  constructor(private readonly gameService: GameService) {}

  @SubscribeMessage("click")
  handleClick(
    @MessageBody() data: { teamId: string },
    @ConnectedSocket() client: Socket,
  ) {
    const score = this.gameService.addClick(data.teamId);
    this.server.emit("score:update", { teamId: data.teamId, score });
    return { event: "click:ack", data: { score } };
  }
}
