import api from "./api-template";

export async function askSibsAi({
  message,
  conversation = [],
  conversationId = "",
  context = {},
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

  const response = await api.post("/api/ai/chat", payload);
  return response?.data || {};
}
