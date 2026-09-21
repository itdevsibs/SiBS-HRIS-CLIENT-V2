import api from "./api-template";

function cleanText(value) {
  return String(value ?? "").trim();
}

export function getChatApiBaseUrl() {
  const rawBaseUrl =
    api?.defaults?.baseURL ||
    import.meta.env?.VITE_API_URL ||
    import.meta.env?.VITE_API_BASE_URL ||
    "http://localhost:5001";

  return String(rawBaseUrl)
    .trim()
    .replace(/\/+$/, "")
    .replace(/\/api$/i, "");
}

export function getChatAttachmentUrl(value) {
  const url = cleanText(value);
  if (!url) return "";

  if (/^https?:\/\//i.test(url)) return url;

  const baseUrl = getChatApiBaseUrl();
  if (!baseUrl) return url;

  return `${baseUrl}${url.startsWith("/") ? "" : "/"}${url}`;
}

export async function getChatParticipants(query = "", limit = 0) {
  const response = await api.get("/chat/participants", {
    params: {
      q: query,
      limit,
    },
  });

  return response.data?.data || [];
}

export async function getChatConversations() {
  const response = await api.get("/chat/conversations");
  return response.data?.data || [];
}

export async function createPrivateChat(sibsId) {
  const response = await api.post("/chat/conversations/private", {
    sibsId,
  });

  return response.data?.data || null;
}

export async function createGroupChat({ name, memberSibsIds }) {
  const response = await api.post("/chat/conversations/group", {
    name,
    memberSibsIds,
  });

  return response.data?.data || null;
}

export async function getChatMembers(conversationId) {
  const response = await api.get(
    `/chat/conversations/${encodeURIComponent(conversationId)}/members`,
  );

  return response.data?.data || [];
}

export async function renameGroupChat(conversationId, name) {
  const response = await api.patch(
    `/chat/conversations/${encodeURIComponent(conversationId)}`,
    { name },
  );

  return response.data?.data || null;
}

export async function addGroupChatMembers(conversationId, memberSibsIds) {
  const response = await api.post(
    `/chat/conversations/${encodeURIComponent(conversationId)}/members`,
    { memberSibsIds },
  );

  return response.data?.data || null;
}

export async function removeGroupChatMember(conversationId, sibsId) {
  const response = await api.delete(
    `/chat/conversations/${encodeURIComponent(conversationId)}/members/${encodeURIComponent(sibsId)}`,
  );

  return response.data?.data || null;
}

export async function leaveGroupChat(conversationId) {
  const response = await api.post(
    `/chat/conversations/${encodeURIComponent(conversationId)}/leave`,
    {},
  );

  return response.data;
}

export async function getChatMessages(
  conversationId,
  { before = "", limit = 50 } = {},
) {
  const response = await api.get(
    `/chat/conversations/${encodeURIComponent(conversationId)}/messages`,
    {
      params: {
        before: before || undefined,
        limit,
      },
    },
  );

  return response.data?.data || [];
}

export async function sendChatMessage(
  conversationId,
  { message = "", images = [], gifUrl = "", replyToMessageId = null } = {},
) {
  const formData = new FormData();
  formData.append("message", String(message || ""));

  if (cleanText(gifUrl)) {
    formData.append("gifUrl", cleanText(gifUrl));
  }

  const replyId = Number(replyToMessageId || 0);
  if (Number.isFinite(replyId) && replyId > 0) {
    formData.append("replyToMessageId", String(replyId));
  }

  (Array.isArray(images) ? images : []).forEach((image) => {
    formData.append("images", image);
  });

  const response = await api.post(
    `/chat/conversations/${encodeURIComponent(conversationId)}/messages`,
    formData,
    {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    },
  );

  return response.data?.data || null;
}

export async function unsendChatMessage(conversationId, messageId) {
  const response = await api.post(
    `/chat/conversations/${encodeURIComponent(conversationId)}/messages/${encodeURIComponent(messageId)}/unsend`,
    {},
  );

  return response.data?.data || null;
}

export async function setChatMessageReaction(
  conversationId,
  messageId,
  reaction = "",
) {
  const response = await api.post(
    `/chat/conversations/${encodeURIComponent(conversationId)}/messages/${encodeURIComponent(messageId)}/reaction`,
    { reaction: cleanText(reaction) },
  );

  return response.data?.data || null;
}

export async function markChatRead(conversationId, messageId = null) {
  const response = await api.post(
    `/chat/conversations/${encodeURIComponent(conversationId)}/read`,
    {
      messageId,
    },
  );

  return response.data?.data || null;
}
