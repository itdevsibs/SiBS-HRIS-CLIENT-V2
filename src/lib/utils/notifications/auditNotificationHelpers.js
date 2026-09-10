const ALLOWED_ROLES = new Set([
  "hr",
  "hr_admin",
  "hradmin",
  "manager",
  "employee",
  "team_leader",
  "teamleader",
  "tl",
  "operations_manager",
  "senior_operations_manager",
  "som",
  "super_admin",
  "superadmin",
  "super_administrator",
]);

const ALLOWED_ACCESS = new Set([2, 3, 5, 7, 8, 10]);

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
      const actorSibsId = cleanText(item.actorSibsId || item.actor_sibs_id);
      const actorEmployeeName = cleanText(
        item.actorEmployeeName || item.actor_employee_name,
      );
      const targetSibsId = cleanText(item.targetSibsId || item.target_sibs_id);
      const targetEmployeeName = cleanText(
        item.targetEmployeeName || item.target_employee_name,
      );
      const resignationId = cleanText(
        item.resignationId || item.resignation_id,
      );
      const employeeSibsId = cleanText(
        item.employeeSibsId || item.employee_sibs_id,
      );
      const resignationEmployeeName = cleanText(
        item.resignationEmployeeName || item.resignation_employee_name,
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
        actorSibsId,
        ...(actorEmployeeName ? { actorEmployeeName } : {}),
        ...(targetSibsId ? { targetSibsId } : {}),
        ...(targetEmployeeName ? { targetEmployeeName } : {}),
        ...(resignationId ? { resignationId } : {}),
        ...(employeeSibsId ? { employeeSibsId } : {}),
        ...(resignationEmployeeName ? { resignationEmployeeName } : {}),
        action: cleanText(item.action).toUpperCase(),
        status: cleanText(item.status).toUpperCase(),
        httpStatus: Number(item.httpStatus || 0),
        occurredAt: cleanText(item.occurredAt),
        targetPath: cleanText(item.targetPath) || null,
      };
    });
}

function extractResignationEmployeeNameFromMessage(value) {
  const text = cleanText(value);
  if (!text) return "";

  const match = text.match(/resignation request for\s+(.+?)\s+is waiting for your review/i);
  return cleanText(match?.[1]);
}

function normalizeComparableResignationId(value) {
  const text = cleanText(value).replace(/^RES-|^ATT-/i, "");
  if (!text) return "";

  const numeric = Number(text);
  return Number.isFinite(numeric) ? String(numeric) : text.toLowerCase();
}

function normalizeComparableSibsId(value) {
  const text = cleanText(value);
  if (!text) return "";

  const numeric = Number(text);
  return Number.isFinite(numeric) ? String(numeric) : text.toLowerCase();
}

function normalizeNameTokens(value) {
  return cleanText(value)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .split(/\s+/)
    .filter(Boolean);
}

export function buildAuditNotificationActionState(item = {}) {
  const moduleName = cleanText(item.module).toLowerCase();
  const action = cleanText(item.action).toUpperCase();
  const targetPath = cleanText(item.targetPath);
  const isResignationModule = ["resignation", "attrition"].includes(moduleName);
  const resignationId = cleanText(item.resignationId || item.resignation_id);
  const employeeSibsId = cleanText(
    item.employeeSibsId || item.employee_sibs_id,
  );
  const isGenericResignationApproval =
    targetPath === "/resignation" &&
    ["APPROVE", "REJECT"].includes(action) &&
    Boolean(resignationId || employeeSibsId);

  if (!isResignationModule && !isGenericResignationApproval) return null;

  const employeeName = cleanText(
    item.resignationEmployeeName ||
      item.resignation_employee_name ||
      extractResignationEmployeeNameFromMessage(item.message),
  );

  if (
    targetPath === "/resignation" &&
    ["RESIGN_REVIEW", "APPROVE", "REJECT"].includes(action)
  ) {
    return {
      openResignationDetails: true,
      resignationId,
      employeeSibsId,
      ...(employeeName ? { employeeName } : {}),
      source: "resignation-review-notification",
    };
  }

  if (targetPath === "/dashboard/employee") {
    return {
      openResignationDetails: true,
      resignationId,
      employeeSibsId,
      source: "resignation-notification",
    };
  }

  return null;
}

export function findResignationNotificationTarget(records = [], state = {}) {
  if (!state?.openResignationDetails || !Array.isArray(records)) return null;

  const requestedResignationId = normalizeComparableResignationId(
    state.resignationId,
  );
  const requestedEmployeeSibsId = normalizeComparableSibsId(
    state.employeeSibsId,
  );

  if (requestedResignationId) {
    const exactRecord = records.find((item) => {
      const ids = [
        item?.resignationId,
        item?.resignation_id,
        item?.raw?.resignationId,
        item?.raw?.resignation_id,
        item?.id,
      ]
        .map(normalizeComparableResignationId)
        .filter(Boolean);

      if (!ids.includes(requestedResignationId)) return false;
      if (!requestedEmployeeSibsId) return true;

      const recordEmployeeSibsId = normalizeComparableSibsId(
        item?.employeeSibsId ||
          item?.employee_sibs_id ||
          item?.sibsId ||
          item?.sibs_id ||
          item?.raw?.employeeSibsId ||
          item?.raw?.employee_sibs_id ||
          item?.raw?.sibsId ||
          item?.raw?.sibs_id,
      );

      return recordEmployeeSibsId === requestedEmployeeSibsId;
    });

    if (exactRecord) return exactRecord;
  }

  if (requestedEmployeeSibsId) {
    const employeeMatch = records.find((item) => {
      const recordEmployeeSibsId = normalizeComparableSibsId(
        item?.employeeSibsId ||
          item?.employee_sibs_id ||
          item?.sibsId ||
          item?.sibs_id ||
          item?.raw?.employeeSibsId ||
          item?.raw?.employee_sibs_id ||
          item?.raw?.sibsId ||
          item?.raw?.sibs_id,
      );

      return recordEmployeeSibsId === requestedEmployeeSibsId;
    });

    if (employeeMatch) return employeeMatch;
  }

  const requestedNameTokens = normalizeNameTokens(state.employeeName);
  if (requestedNameTokens.length < 2) return null;

  return (
    records.find((item) => {
      const recordNameTokens = new Set(
        normalizeNameTokens(
          item?.employeeName ||
            item?.employee_name ||
            item?.fullName ||
            item?.full_name ||
            item?.name ||
            item?.raw?.employeeName ||
            item?.raw?.employee_name ||
            item?.raw?.fullName ||
            item?.raw?.full_name,
        ),
      );

      return requestedNameTokens.every((token) => recordNameTokens.has(token));
    }) || null
  );
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
