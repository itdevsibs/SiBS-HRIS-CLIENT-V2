// Browser-only conversation cache for the signed-in HRIS employee.
// The key is scoped to that employee; all cached conversations are removed by
// the central HRIS logout lifecycle, never by closing the assistant drawer.
export const AI_CONVERSATION_STORAGE_PREFIX = "sibs-hris-ask-sibs-ai:v1:";

function storageOrNull(storage) {
  if (storage) return storage;
  try {
    return typeof window === "undefined" ? null : window.localStorage;
  } catch {
    return null;
  }
}

function storageKey(employeeKey) {
  const key = String(employeeKey ?? "").trim().toLowerCase();
  return key ? `${AI_CONVERSATION_STORAGE_PREFIX}${encodeURIComponent(key)}` : null;
}

function safeMessages(value) {
  if (!Array.isArray(value)) return [];
  return value.flatMap((message, index) => {
    if (!message || !["user", "assistant"].includes(message.role) ||
        typeof message.content !== "string") return [];
    return [{
      id: typeof message.id === "string" ? message.id : `restored-${index}`,
      role: message.role,
      content: message.content,
      ...(Array.isArray(message.highlights) ? { highlights: message.highlights } : {}),
      ...(Array.isArray(message.risks) ? { risks: message.risks } : {}),
      ...(Array.isArray(message.recommendations) ? { recommendations: message.recommendations } : {}),
    }];
  });
}

export function readAiConversationClient(employeeKey, storage) {
  const key = storageKey(employeeKey);
  const store = storageOrNull(storage);
  if (!key || !store) return { messages: [], conversationId: "" };

  try {
    const raw = store.getItem(key);
    if (!raw) return { messages: [], conversationId: "" };
    const saved = JSON.parse(raw);
    return {
      messages: safeMessages(saved?.messages),
      conversationId: typeof saved?.conversationId === "string"
        ? saved.conversationId : "",
    };
  } catch {
    return { messages: [], conversationId: "" };
  }
}

export function writeAiConversationClient(employeeKey, conversation, storage) {
  const key = storageKey(employeeKey);
  const store = storageOrNull(storage);
  if (!key || !store) return false;
  try {
    store.setItem(key, JSON.stringify({
      messages: safeMessages(conversation?.messages),
      conversationId: typeof conversation?.conversationId === "string"
        ? conversation.conversationId : "",
    }));
    return true;
  } catch {
    // Private browsing or a full storage quota must not crash Ask SiBS AI.
    return false;
  }
}

export function clearAiConversationsOnLogoutClient(storage) {
  const store = storageOrNull(storage);
  if (!store) return;
  try {
    // Iterate backwards so removing entries cannot skip the next entry.
    for (let index = store.length - 1; index >= 0; index -= 1) {
      const key = store.key(index);
      if (key?.startsWith(AI_CONVERSATION_STORAGE_PREFIX)) {
        store.removeItem(key);
      }
    }
  } catch {
    // Never interrupt the primary logout flow because storage is unavailable.
  }
}
