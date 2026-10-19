import { io } from "socket.io-client";

const SOCKET_URL = import.meta.env.VITE_API_URL || "http://localhost:5001";

export const socket = io(SOCKET_URL, {
  withCredentials: true,
  // Prefer a persistent websocket: HTTP long-polling requests can be delayed
  // by background-tab scheduling. Fall back to polling when the deployment
  // proxy does not support WebSocket upgrades (Socket.IO >= 4.8).
  transports: ["websocket", "polling"],
  tryAllTransports: true,
  autoConnect: false,
});

export default socket;
