import api from "./api-template";

export async function getAuditNotifications({ limit = 20 } = {}) {
  const safeLimit = Math.min(50, Math.max(1, Number(limit) || 20));

  const response = await api.get("/api/audit-notifications", {
    params: {
      limit: safeLimit,
    },
  });

  return response?.data || {
    success: false,
    notifications: [],
    count: 0,
  };
}

export default getAuditNotifications;
