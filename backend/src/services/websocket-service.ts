import WebSocket, { WebSocketServer as WSS } from "ws";
import { type Server as HttpServer } from "http";
import { logger } from "@/utils/logger";
import { TPayload, verifyJwt } from "@/utils/jwt";
import { Env } from "@/config/env.config";

interface AuthenticatedWS extends WebSocket {
  userId?: string;
}

interface ClientInfo {
  userId: string;
  ws: AuthenticatedWS;
  rooms: Set<string>;
  isAlive: boolean;
}

export class WebSocketServer {
  private wss: WSS;
  private clients = new Map<string, ClientInfo>();
  private rooms = new Map<string, Set<string>>();

  constructor(server: HttpServer) {
    this.wss = new WSS({ server });

    this.setup();
    this.startHeartbeat();
  }

  private setup(): void {
    this.wss.on("connection", (ws: AuthenticatedWS, request) => {
      try {
        const token = new URL(request.url!, "http://x").searchParams.get(
          "token"
        );

        if (!token) {
          ws.close(4001, "Unauthorized");
          return;
        }

        const payload = verifyJwt(token, Env.ACCESS_TOKEN_SECRET) as TPayload;

        if (!payload.userId) {
          ws.close(4001, "Unauthorized");
          return;
        }

        ws.userId = payload.userId;

        this.clients.set(ws.userId, {
          userId: ws.userId,
          ws,
          rooms: new Set(),
          isAlive: true,
        });

        logger.info(`Client connected: ${ws.userId}`);

        ws.on("message", (data) => this.onMessage(ws, data));
        ws.on("pong", () => this.onPong(ws.userId ?? ""));
        ws.on("close", () => this.disconnect(ws.userId ?? ""));
      } catch (error) {
        logger.error("WebSocket connection error", error);
        ws.close();
      }
    });
  }

  private onMessage(ws: AuthenticatedWS, data: WebSocket.RawData): void {
    try {
      const msg = JSON.parse(data.toString());

      if (msg.type === "ping") {
        ws.send(JSON.stringify({ type: "pong", ts: Date.now() }));
      }
    } catch (error) {
      ws.send(JSON.stringify({ type: "error", message: "Invalid JSON" }));
    }
  }

  /** Called from REST controller when user opens home(Chat) page */
  public subscribeUserToRooms(userId: string, roomIds: string[]): void {
    const client = this.clients.get(userId);
    if (!client) {
      logger.warn(
        `User ${userId} not connected yet, storing room subscriptions`
      );
      return;
    }

    for (const roomId of roomIds) {
      if (!this.rooms.has(roomId)) {
        this.rooms.set(roomId, new Set());
      }

      this.rooms.get(roomId)!.add(userId);
      client.rooms.add(roomId);
    }
    logger.info(`User ${userId} subscribed to ${roomIds.length} rooms`);
  }

  /** Emit to all users in a room */
  public emitToRoom(roomId: string, payload: object): void {
    const members = this.rooms.get(roomId);
    if (!members) return;

    for (const userId of members) {
      this.emitToUser(userId, payload);
    }
  }

  /** Emit to a single user */
  public emitToUser(userId: string, payload: object): void {
    const client = this.clients.get(userId);
    if (!client) return;

    if (client.ws.readyState === WebSocket.OPEN) {
      client.ws.send(JSON.stringify(payload));
    }
  }

  private startHeartbeat(): void {
    setInterval(() => {
      this.clients.forEach((client, userId) => {
        if (!client.isAlive) {
          client.ws.terminate();
          this.disconnect(userId);
        } else {
          client.isAlive = false;
          client.ws.ping();
        }
      });
    }, 3000);
  }

  private onPong(userId: string): void {
    const client = this.clients.get(userId);
    if (client) client.isAlive = true;
  }

  private disconnect(userId: string): void {
    const client = this.clients.get(userId);
    if (!client) return;

    client.rooms.forEach((room) => this.rooms.get(room)?.delete(userId));

    this.clients.delete(userId);
    logger.info(`WebSocket disconnected: ${userId}`);
  }
}
