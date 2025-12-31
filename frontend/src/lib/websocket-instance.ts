import { WebSocketClient } from "./websocket-client";

const WEB_SOCKET_URL = import.meta.env.VITE_API_WEB_SOCKET_URL;

let instance: WebSocketClient | null = null;

export function getWebSocketClient(): WebSocketClient | null {
  const token = localStorage.getItem("accessToken");

  if (!token) return null;

  if (!instance) {
    instance = WebSocketClient.getInstance(`${WEB_SOCKET_URL}?token=${token}`);
  }

  return instance;
}
