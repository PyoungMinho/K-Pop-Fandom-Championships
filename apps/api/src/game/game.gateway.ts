import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
  OnGatewayConnection,
} from "@nestjs/websockets";
import { Server, Socket } from "socket.io";
import { GameService } from "./game.service";
import { BatonService } from "./baton.service";
import { CheerService } from "./cheer.service";

@WebSocketGateway({ cors: { origin: "*" } })
export class GameGateway implements OnGatewayConnection {
  @WebSocketServer()
  server!: Server;

  constructor(
    private readonly gameService: GameService,
    private readonly batonService: BatonService,
    private readonly cheerService: CheerService,
  ) {}

  handleConnection(client: Socket) {
    client.emit("connected", { message: "Welcome to K-F-C!" });
  }

  // ═══════════════════════════════════════
  //  1. 박 터트리기 (Click Burst)
  // ═══════════════════════════════════════

  @SubscribeMessage("click")
  async handleClick(
    @MessageBody()
    data: {
      gameEventId: string;
      seasonTeamId: string;
      ipHash: string;
      fingerprint?: string;
    },
    @ConnectedSocket() _client: Socket,
  ) {
    const result = await this.gameService.addClick(data);

    this.server.emit("score:update", {
      gameEventId: data.gameEventId,
      seasonTeamId: data.seasonTeamId,
      total: result.total,
      goal: result.goal,
      progress: Math.min((result.total / result.goal) * 100, 100),
    });

    if (result.isBurst) {
      this.server.emit("burst", {
        gameEventId: data.gameEventId,
        seasonTeamId: data.seasonTeamId,
        total: result.total,
      });
    }

    return {
      event: "click:ack",
      data: {
        total: result.total,
        goal: result.goal,
        isBurst: result.isBurst,
      },
    };
  }

  @SubscribeMessage("progress:request")
  async handleProgressRequest(
    @MessageBody()
    data: {
      gameEventId: string;
      seasonTeamIds: string[];
    },
    @ConnectedSocket() client: Socket,
  ) {
    const progress = await this.gameService.getProgress(
      data.gameEventId,
      data.seasonTeamIds,
    );
    client.emit("progress:update", progress);
    return { event: "progress:ack", data: progress };
  }

  // ═══════════════════════════════════════
  //  2. 이어달리기 (Baton Relay)
  // ═══════════════════════════════════════

  /**
   * 초대 링크 생성
   */
  @SubscribeMessage("baton:create")
  async handleBatonCreate(
    @MessageBody()
    data: {
      gameEventId: string;
      seasonTeamId: string;
      ipHash: string;
      fingerprint?: string;
    },
    @ConnectedSocket() client: Socket,
  ) {
    try {
      const baton = await this.batonService.createInvite(data);
      client.emit("baton:created", {
        inviteCode: baton.inviteCode,
        seasonTeamId: data.seasonTeamId,
      });
      return { event: "baton:create:ack", data: { inviteCode: baton.inviteCode } };
    } catch {
      return { event: "baton:create:error", data: { error: "FAILED" } };
    }
  }

  /**
   * 바통 이어받기
   */
  @SubscribeMessage("baton:accept")
  async handleBatonAccept(
    @MessageBody()
    data: {
      inviteCode: string;
      ipHash: string;
      fingerprint?: string;
    },
    @ConnectedSocket() client: Socket,
  ) {
    try {
      const result = await this.batonService.acceptBaton(data);

      if (result.isNew) {
        // 새 팬이 바통을 이어받았을 때 전체 알림
        this.server.emit("baton:passed", {
          seasonTeamId: result.baton.seasonTeamId,
          chainLength: result.chainLength,
          teamTotal: result.teamTotal,
          inviteCode: result.baton.inviteCode,
        });
      }

      client.emit("baton:accepted", {
        inviteCode: result.baton.inviteCode,
        isNew: result.isNew,
        chainLength: result.chainLength,
        teamTotal: result.teamTotal,
        seasonTeamId: result.baton.seasonTeamId,
      });

      return { event: "baton:accept:ack", data: result };
    } catch (e) {
      const msg = e instanceof Error ? e.message : "UNKNOWN";
      return { event: "baton:accept:error", data: { error: msg } };
    }
  }

  /**
   * 바통 현황 요청
   */
  @SubscribeMessage("baton:status")
  async handleBatonStatus(
    @MessageBody()
    data: { gameEventId: string },
    @ConnectedSocket() client: Socket,
  ) {
    const counts = await this.batonService.getAllTeamBatonCounts(data.gameEventId);
    client.emit("baton:status:update", { counts });
    return { event: "baton:status:ack", data: { counts } };
  }

  // ═══════════════════════════════════════
  //  3. 응원 게시판 (Cheer Board)
  // ═══════════════════════════════════════

  /**
   * 응원 메시지 보내기
   */
  @SubscribeMessage("cheer:send")
  async handleCheerSend(
    @MessageBody()
    data: {
      gameEventId: string;
      seasonTeamId: string;
      content: string;
      ipHash: string;
      fingerprint?: string;
    },
    @ConnectedSocket() _client: Socket,
  ) {
    try {
      const msg = await this.cheerService.createMessage(data);

      // 전체 클라이언트에 실시간 메시지 브로드캐스트
      this.server.emit("cheer:new", {
        id: msg.id,
        createdAt: msg.createdAt,
        gameEventId: msg.gameEventId,
        seasonTeamId: msg.seasonTeamId,
        content: msg.content,
      });

      return { event: "cheer:send:ack", data: { id: msg.id } };
    } catch (e) {
      const msg = e instanceof Error ? e.message : "UNKNOWN";
      return { event: "cheer:send:error", data: { error: msg } };
    }
  }

  /**
   * 응원 메시지 목록 요청
   */
  @SubscribeMessage("cheer:load")
  async handleCheerLoad(
    @MessageBody()
    data: {
      gameEventId: string;
      seasonTeamId?: string;
      limit?: number;
    },
    @ConnectedSocket() client: Socket,
  ) {
    const messages = await this.cheerService.getMessages(
      data.gameEventId,
      data.seasonTeamId,
      data.limit ?? 50,
    );
    client.emit("cheer:messages", { messages });
    return { event: "cheer:load:ack", data: { count: messages.length } };
  }
}
