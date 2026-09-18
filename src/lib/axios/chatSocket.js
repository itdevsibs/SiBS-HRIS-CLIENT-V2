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
  autoConnect: false,
});

export default chatSocket;
