import api from "./api-template";

export async function getAuditNotifications({
  limit = 20,
  beforeId = null,
  history = false,
} = {}) {
  const safeLimit = Math.min(50, Math.max(1, Number(limit) || 20));
  const safeBeforeId = Number(beforeId);

  const response = await api.get("/api/audit-notifications", {
    params: {
      limit: safeLimit,
      ...(Number.isFinite(safeBeforeId) && safeBeforeId > 0
        ? { beforeId: Math.trunc(safeBeforeId) }
        : {}),
      ...(history ? { history: 1 } : {}),
    },
  });

  return response?.data || {
    success: false,
    notifications: [],
    count: 0,
    hasMore: false,
    nextCursor: null,
  };
}

export async function markAuditNotificationRead(auditLogId) {
  const safeAuditLogId = Number(auditLogId);
  if (!Number.isFinite(safeAuditLogId) || safeAuditLogId <= 0) {
    return { success: false };
  }

  const response = await api.post(
    `/api/audit-notifications/${Math.trunc(safeAuditLogId)}/read`,
  );
  return response?.data || { success: false };
}

export async function getManilaClock() {
  const response = await api.get("/api/audit-notifications/clock");

  return response?.data || {
    success: false,
    serverEpochMs: null,
    timeZone: "Asia/Manila",
  };
}

export default getAuditNotifications;
