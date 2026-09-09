const SOURCING_ANALYTICS_ALLOWED_ACCESS = new Set([1, 2, 3, 6, 7]);

function toFiniteAccess(value) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function normalizeSessionRole(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[\s-]+/g, "_");
}

function isEmployeeSession(user = {}) {
  return [user?.role, user?.tokenType]
    .map(normalizeSessionRole)
    .includes("employee");
}

export function getSourcingAnalyticsAccessValues(user = {}) {
  if (!user || typeof user !== "object") return [];

  const directValues = [
    user.adminAccess,
    user.admin_access,
    user.gy_user_access,
    user.gyUserAccess,
    user.access,
    user.adminLevel,
    user.admin_level,
  ];

  const assignedValues = Array.isArray(user.assignedAccounts)
    ? user.assignedAccounts.flatMap((account) => [
        account?.adminAccess,
        account?.admin_access,
        account?.gy_user_access,
        account?.gyUserAccess,
        account?.access,
        account?.adminLevel,
        account?.admin_level,
      ])
    : [];

  return [...directValues, ...assignedValues]
    .map(toFiniteAccess)
    .filter((value) => value !== null);
}

export function canAccessSourcingAnalytics(user = {}) {
  if (isEmployeeSession(user)) {
    return false;
  }

  return getSourcingAnalyticsAccessValues(user).some((access) =>
    SOURCING_ANALYTICS_ALLOWED_ACCESS.has(access),
  );
}
