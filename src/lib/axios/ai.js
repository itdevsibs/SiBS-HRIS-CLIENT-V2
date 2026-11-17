import api from "./api-template";

export const AI_CHAT_TIMEOUT_MS = 60_000;

export async function askSibsAi({
  message,
  conversation = [],
  conversationId = "",
  context = {},
  signal,
}) {
  const payload = {
    message: String(message || "").trim(),
    conversation,
    context: {
      source: "global_assistant",
      ...context,
    },
  };

  if (conversationId) {
    payload.conversationId = conversationId;
  }

  const response = await api.post("/api/ai/chat", payload, {
    timeout: AI_CHAT_TIMEOUT_MS,
    signal,
  });
  return response?.data || {};
}
