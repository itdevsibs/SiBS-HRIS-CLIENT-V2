import api from "./api-template";

export async function getNotifications({
  limit = 30,
  cursor = null,
} = {}) {
  const safeLimit = Math.min(100, Math.max(1, Number(limit) || 30));
  const safeCursor = Number(cursor);

  const response = await api.get("/api/notifications", {
    params: {
      limit: safeLimit,
      ...(Number.isFinite(safeCursor) && safeCursor > 0
        ? { cursor: Math.trunc(safeCursor) }
        : {}),
    },
    skipAuthRedirect: true,
  });

  return response?.data || {
    success: false,
    notifications: [],
    unreadCount: 0,
    hasMore: false,
    nextCursor: null,
    serverEpochMs: null,
    timeZone: "Asia/Manila",
  };
}

export async function getUnreadNotificationCount() {
  const response = await api.get("/api/notifications/unread-count", {
    skipAuthRedirect: true,
  });
  return response?.data || {
    success: false,
    unreadCount: 0,
  };
}

export async function markNotificationRead(auditLogId) {
  const safeId = Number(auditLogId);
  if (!Number.isFinite(safeId) || safeId <= 0) {
    return { success: false };
  }

  const response = await api.post(
    `/api/notifications/${Math.trunc(safeId)}/read`,
    {},
    { skipAuthRedirect: true },
  );
  return response?.data || { success: false };
}

export async function markAllNotificationsRead() {
  const response = await api.post(
    "/api/notifications/read-all",
    {},
    { skipAuthRedirect: true },
  );
  return response?.data || { success: false };
}

export async function dismissNotification(auditLogId) {
  const safeId = Number(auditLogId);
  if (!Number.isFinite(safeId) || safeId <= 0) {
    return { success: false };
  }

  const response = await api.post(
    `/api/notifications/${Math.trunc(safeId)}/dismiss`,
    {},
    { skipAuthRedirect: true },
  );
  return response?.data || { success: false };
}

export default getNotifications;
