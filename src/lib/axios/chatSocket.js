import { io } from "socket.io-client";

function getSocketBaseUrl() {
  const rawUrl =
    import.meta.env?.VITE_API_URL ||
    import.meta.env?.VITE_API_BASE_URL ||
    "http://localhost:5001";

  return String(rawUrl)
    .trim()
    .replace(/\/+$/, "")
    .replace(/\/api$/, "");
}

const CHAT_SOCKET_URL = `${getSocketBaseUrl()}/chat`;

export const chatSocket = io(CHAT_SOCKET_URL, {
  withCredentials: true,
  transports: ["polling", "websocket"],
  upgrade: true,
  autoConnect: false,

  // Keep SiBS Chat connected without requiring a browser refresh when the
  // backend/proxy temporarily drops the Socket.IO connection.
  reconnection: true,
  reconnectionAttempts: Infinity,
  reconnectionDelay: 500,
  reconnectionDelayMax: 5000,
  randomizationFactor: 0.25,
  timeout: 10000,
});

export default chatSocket;
