function cleanText(value, maxLength = 4000) {
  return String(value ?? "").trim().slice(0, maxLength);
}

function normalizeList(value) {
  const items = Array.isArray(value) ? value : value == null ? [] : [value];

  return items
    .map((item) => cleanText(item, 1000))
    .filter(Boolean)
    .slice(0, 10);
}

export function buildConversationPayload(messages = []) {
  if (!Array.isArray(messages)) return [];

  return messages
    .map((message) => ({
      role: message?.role === "assistant" ? "assistant" : message?.role === "user" ? "user" : "",
      content: cleanText(message?.content, 4000),
    }))
    .filter((message) => message.role && message.content)
    .slice(-10);
}

export function normalizeAiAnswerPayload(payload = {}) {
  return {
    answer: cleanText(payload?.answer, 12000),
    highlights: normalizeList(payload?.highlights),
    risks: normalizeList(payload?.risks),
    recommendations: normalizeList(payload?.recommendations),
    toolsUsed: normalizeList(payload?.toolsUsed),
    conversationId: cleanText(payload?.conversationId, 64),
    modelName: cleanText(payload?.modelName, 120),
  };
}

export function getAiErrorMessage(error) {
  return (
    cleanText(error?.response?.data?.message, 500) ||
    cleanText(error?.response?.data?.error, 500) ||
    cleanText(error?.message, 500) ||
    "SiBS AI could not complete the request. Please try again."
  );
}
