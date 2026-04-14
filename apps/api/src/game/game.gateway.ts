import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from "@nestjs/websockets";
import { Inject } from "@nestjs/common";
import { Server, Socket } from "socket.io";
import { createHash } from "crypto";
import Redis from "ioredis";
import { GameService } from "./game.service";
import { BatonService } from "./baton.service";
import { CheerService } from "./cheer.service";
import { REDIS_CLIENT } from "../common/redis.provider";

// ─── Payload 인터페이스 ──────────────────────────────────────────────────────

/**
 * score:update — 전체 브로드캐스트용
 * 팀 점수 현황 + 실시간 접속자 수를 포함한다.
 */
interface ScoreUpdatePayload {
  gameEventId: string;
  seasonTeamId: string;
  total: number;
  goal: number;
  progress: number;        // 0~100 (%)
  onlineCount: number;     // SCARD active_clients:{gameEventId}
}

/**
 * click:ack — 클릭한 클라이언트 전용
 * 콤보/multiplier 등 개인화 정보를 포함한다.
 */
interface ClickAckPayload {
  total: number;
  combo: number;
  multiplier: number;
  isBurst: boolean;
}

// Redis key helper
const ACTIVE_CLIENTS_KEY = (gameEventId: string) =>
  `active_clients:${gameEventId}`;

// heartbeat TTL (초) — 이 시간 이내에 heartbeat가 없으면 클라이언트를 만료로 간주
const HEARTBEAT_TTL_SEC = 30;

@WebSocketGateway({ cors: { origin: process.env.CLIENT_URL || "http://localhost:3000" } })
export class GameGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server!: Server;

  constructor(
    private readonly gameService: GameService,
    private readonly batonService: BatonService,
    private readonly cheerService: CheerService,
    @Inject(REDIS_CLIENT)
    private readonly redis: Redis,
  ) {}

  handleConnection(client: Socket) {
    const forwarded = client.handshake.headers["x-forwarded-for"];
    const ip = forwarded
      ? (forwarded as string).split(",")[0].trim()
      : client.handshake.address;

    client.data.ipHash = createHash("sha256")
      .update(ip + (process.env.IP_SALT || "kfc-default-salt"))
      .digest("hex")
      .substring(0, 16);

    client.emit("connected", { message: "Welcome to K-F-C!" });
  }

  async handleDisconnect(client: Socket) {
    const gameEventId = client.data.gameEventId as string | undefined;
    if (gameEventId) {
      await this.redis.srem(`active_clients:${gameEventId}`, client.id);
      console.log(
        `[GameGateway] client ${client.id} disconnected – removed from active_clients:${gameEventId}`,
      );
    } else {
      console.log(`[GameGateway] client ${client.id} disconnected`);
    }
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
      fingerprint?: string;
    },
    @ConnectedSocket() client: Socket,
  ) {
    try {
      // ── B3: 첫 클릭 시점에 active_clients SET 등록 ─────────────────
      if (!client.data.gameEventId) {
        client.data.gameEventId = data.gameEventId;
        await this.redis.sadd(
          ACTIVE_CLIENTS_KEY(data.gameEventId),
          client.id,
        );
      }

      const result = await this.gameService.addClick({
        ...data,
        ipHash: client.data.ipHash as string,
      });

      // ── B9: score:update — onlineCount 포함 브로드캐스트 ──────────
      const onlineCount = await this.redis.scard(
        ACTIVE_CLIENTS_KEY(data.gameEventId),
      );

      const scoreUpdatePayload: ScoreUpdatePayload = {
        gameEventId: data.gameEventId,
        seasonTeamId: data.seasonTeamId,
        total: result.total,
        goal: result.goal,
        progress: Math.min((result.total / result.goal) * 100, 100),
        onlineCount,
      };
      this.server.emit("score:update", scoreUpdatePayload);

      if (result.isBurst) {
        this.server.emit("burst", {
          gameEventId: data.gameEventId,
          seasonTeamId: data.seasonTeamId,
          total: result.total,
        });
      }

      // ── B9: click:ack — 클릭한 클라이언트 전용, 콤보/multiplier 포함 ──
      const clickAckPayload: ClickAckPayload = {
        total: result.total,
        combo: result.combo,
        multiplier: result.multiplier,
        isBurst: result.isBurst,
      };
      client.emit("click:ack", clickAckPayload);

      return {
        event: "click:ack",
        data: {
          total: result.total,
          goal: result.goal,
          combo: result.combo,
          multiplier: result.multiplier,
          isBurst: result.isBurst,
        },
      };
    } catch (e) {
      const reason = e instanceof Error ? e.message : "UNKNOWN";

      // Rate limit 및 이벤트 상태 오류는 발신 클라이언트에게만 반환
      // 서버 전체 브로드캐스트 없음 — 정상 클라이언트 UX 보호
      return {
        event: "click:rejected",
        data: { reason },
      };
    }
  }

  // ═══════════════════════════════════════
  //  B3: Heartbeat (접속 유지 갱신)
  // ═══════════════════════════════════════

  /**
   * 클라이언트가 주기적으로 heartbeat를 전송하면
   * active_clients SET에 TTL을 갱신하는 방식 대신,
   * 각 클라이언트 전용 heartbeat 키에 TTL을 설정해 유효성을 추적한다.
   *
   * — 클라이언트가 끊기면 handleDisconnect → SREM으로 즉시 제거됨
   * — heartbeat는 "살아있음" 확인용이므로 별도 presence 키를 갱신한다.
   */
  @SubscribeMessage("heartbeat")
  async handleHeartbeat(
    @MessageBody() _data: unknown,
    @ConnectedSocket() client: Socket,
  ) {
    const gameEventId = client.data.gameEventId as string | undefined;
    if (!gameEventId) {
      // 아직 click 이벤트를 보내지 않아 gameEventId 미등록 → 무시
      return { event: "heartbeat:ack", data: { ok: false } };
    }

    // presence 키에 TTL 갱신 — 이 TTL이 만료되면 클라이언트가 zombie임을 의미
    const presenceKey = `presence:${gameEventId}:${client.id}`;
    await this.redis.set(presenceKey, "1", "EX", HEARTBEAT_TTL_SEC);

    return { event: "heartbeat:ack", data: { ok: true } };
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
      fingerprint?: string;
    },
    @ConnectedSocket() client: Socket,
  ) {
    try {
      const baton = await this.batonService.createInvite({
        ...data,
        ipHash: client.data.ipHash as string,
      });
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
      fingerprint?: string;
    },
    @ConnectedSocket() client: Socket,
  ) {
    try {
      const result = await this.batonService.acceptBaton({
        ...data,
        ipHash: client.data.ipHash as string,
      });

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
      fingerprint?: string;
    },
    @ConnectedSocket() client: Socket,
  ) {
    try {
      const msg = await this.cheerService.createMessage({
        ...data,
        ipHash: client.data.ipHash as string,
      });

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
