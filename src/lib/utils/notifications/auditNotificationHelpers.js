const ALLOWED_ROLES = new Set([
  "hr",
  "hr_admin",
  "hradmin",
  "manager",
  "super_admin",
  "superadmin",
  "super_administrator",
]);

const ALLOWED_ACCESS = new Set([2, 3, 5, 7]);

function cleanText(value) {
  return String(value ?? "").trim();
}

function normalizeRole(value) {
  return cleanText(value).toLowerCase().replace(/[\s-]+/g, "_");
}

function getAccessValue(user = {}) {
  const raw =
    user?.adminAccess ??
    user?.admin_access ??
    user?.access ??
    user?.gy_user_access ??
    user?.gyUserAccess ??
    user?.adminLevel ??
    user?.admin_level ??
    0;

  const parsed = Number(raw);
  return Number.isFinite(parsed) ? parsed : 0;
}

export function canUseAuditNotifications(user = {}) {
  return (
    ALLOWED_ROLES.has(normalizeRole(user?.role || user?.userRole)) ||
    ALLOWED_ACCESS.has(getAccessValue(user))
  );
}

export function normalizeAuditNotificationsResponse(payload = {}) {
  const rows = Array.isArray(payload?.notifications)
    ? payload.notifications
    : Array.isArray(payload?.data?.notifications)
      ? payload.data.notifications
      : [];

  return rows
    .filter((item) => item && typeof item === "object")
    .map((item) => {
      const targetSibsId = cleanText(item.targetSibsId || item.target_sibs_id);
      const targetEmployeeName = cleanText(
        item.targetEmployeeName || item.target_employee_name,
      );

      return {
      id: cleanText(item.id),
      auditLogId: Number(item.auditLogId || 0),
      module: cleanText(item.module),
      tone: ["danger", "warning", "action", "info"].includes(item.tone)
        ? item.tone
        : "info",
      title: cleanText(item.title) || "System Notification",
      message: cleanText(item.message),
      actorSibsId: cleanText(item.actorSibsId),
      ...(targetSibsId ? { targetSibsId } : {}),
      ...(targetEmployeeName ? { targetEmployeeName } : {}),
      action: cleanText(item.action).toUpperCase(),
      status: cleanText(item.status).toUpperCase(),
      httpStatus: Number(item.httpStatus || 0),
      occurredAt: cleanText(item.occurredAt),
      targetPath: cleanText(item.targetPath) || null,
      };
    });
}

export function formatAuditNotificationTime(value, now = new Date()) {
  const date = new Date(value);
  const nowDate = now instanceof Date ? now : new Date(now);

  if (Number.isNaN(date.getTime()) || Number.isNaN(nowDate.getTime())) {
    return "Recently";
  }

  const diffMs = Math.max(0, nowDate.getTime() - date.getTime());
  const minutes = Math.floor(diffMs / 60_000);

  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes}m ago`;

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;

  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}
