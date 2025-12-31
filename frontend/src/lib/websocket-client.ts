interface WebSocketClientOptions {
  reconnectInterval?: number;
  maxReconnectAttempts?: number;
  heartbeatInterval?: number;
}

type EventHandler<T = any> = (data: T) => void;

export class WebSocketClient {
  private ws?: WebSocket;
  private url: string;
  private options: Required<WebSocketClientOptions>;
  private static instance: WebSocketClient;

  private reconnectAttempts = 0;
  private eventHandlers: Record<string, EventHandler[]> = {};

  private heartbeatTimer: number | null = null;
  private lastPong?: number;

  private constructor(url: string, options: WebSocketClientOptions = {}) {
    this.url = url;
    this.options = {
      reconnectInterval: 1000,
      maxReconnectAttempts: 5,
      heartbeatInterval: 3000,
      ...options,
    };

    this.connect();
  }

  static getInstance(url: string) {
    if (!WebSocketClient.instance) {
      WebSocketClient.instance = new WebSocketClient(url);
    }
    return WebSocketClient.instance;
  }

  private connect(): void {
    // console.log(`Connecting to ${this.url}...`);

    try {
      this.ws = new WebSocket(this.url);
      this.setupEventHandlers();
    } catch (error) {
      console.error("Failed to create WebSocket:", error);
      this.scheduleReconnect();
    }
  }

  private setupEventHandlers(): void {
    if (!this.ws) return;

    this.ws.onopen = () => {
      // console.log("WS connected");

      this.reconnectAttempts = 0;
      this.startHeartbeat();
      this.trigger("open", null);
    };

    this.ws.onmessage = (event: MessageEvent) => {
      // console.log("Message recieved:", event.data);

      try {
        const data = JSON.parse(event.data);

        if (data.type === "pong") {
          this.lastPong = Date.now();
          return;
        }

        this.trigger("new_message", data);

        if (data.type) {
          this.trigger(data.type, data);
        }
      } catch (error) {
        console.log("Invalid WebSocket message:", event.data);
      }
    };

    this.ws.onerror = (error: Event) => {
      console.log("WebSocket error: ", error);
      this.trigger("error", error);
    };

    this.ws.onclose = (event: CloseEvent) => {
      console.log(`WS Closed: ${event.code} ${event.reason}`);

      this.stopHeartbeat();
      this.trigger("close", event);

      if (event.code !== 1000 && event.code !== 1001) {
        this.scheduleReconnect();
      }
    };
  }

  private startHeartbeat(): void {
    this.stopHeartbeat();

    this.heartbeatTimer = window.setInterval(() => {
      if (!this.ws || this.ws.readyState !== WebSocket.OPEN) return;

      this.ws.send(JSON.stringify({ type: "ping", timestamp: Date.now() }));

      const diff = Date.now() - (this.lastPong ?? 0);

      if (diff > this.options.heartbeatInterval * 2) {
        console.warn("Heartbeat timeout");
        this.ws?.close();
      }
    }, this.options.heartbeatInterval);
  }

  private stopHeartbeat(): void {
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = null;
    }
  }

  private scheduleReconnect(): void {
    if (this.reconnectAttempts >= this.options.maxReconnectAttempts) {
      console.error("Max reconnect attempts reached");
      this.trigger("maxReconnectAttemptsReached", null);
      return;
    }

    this.reconnectAttempts++;

    const delay =
      this.options.reconnectInterval * Math.pow(2, this.reconnectAttempts - 1);

    console.log(`Reconnecting in ${delay}ms...`);

    setTimeout(() => this.connect(), delay);
  }

  public on(event: string, handler: EventHandler): void {
    if (!this.eventHandlers[event]) {
      this.eventHandlers[event] = [];
    }
    this.eventHandlers[event].push(handler);
  }

  public off(event: string, handler: EventHandler): void {
    this.eventHandlers[event] =
      this.eventHandlers[event]?.filter((h) => h !== handler) ?? [];
  }

  private trigger(event: string, data: any): void {
    this.eventHandlers[event]?.forEach((handler) => handler(data));
  }

  public close(): void {
    this.stopHeartbeat();
    this.ws?.close(1000, "Client, closed");
  }
}
