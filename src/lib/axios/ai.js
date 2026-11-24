import api from "./api-template";

export const AI_CHAT_TIMEOUT_MS = 60_000;

export async function askSibsAi({
  message,
  conversation = [],
  conversationId = "",
  context = {},
  signal,
  expectedSibsId,
  expectedEmployeeId,
}) {
  const payload = {
    message: String(message || "").trim(),
    conversation,
    ...(expectedSibsId !== undefined ? { expectedSibsId: String(expectedSibsId).trim() } : {}),
    ...(expectedEmployeeId ? { expectedEmployeeId: String(expectedEmployeeId).trim() } : {}),
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
