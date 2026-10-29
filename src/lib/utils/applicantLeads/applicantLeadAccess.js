/**
 * Keep background Applicant Leads reads aligned with the HRIS Server's
 * recruitment authorization. This is a UI optimization, not an auth boundary:
 * the Server remains authoritative for every Applicant Leads request.
 */
const APPLICANT_LEAD_ALLOWED_ROLES = new Set([
  "ta", "hr", "hr_admin", "hradmin", "executive", "super_admin",
  "superadmin", "admin",
]);
const APPLICANT_LEAD_ALLOWED_ACCESS_LEVELS = new Set([1, 2, 3, 6, 7]);

export function hasApplicantLeadsPermission(user) {
  if (!user || typeof user !== "object" || Array.isArray(user)) return false;

  // Employee portal sessions cannot read recruitment data even if an
  // associated employee has an administrative account in HRIS.
  if (user.role === "employee" || user.tokenType === "employee") return false;

  if (typeof user.role === "string") {
    const normalized = user.role.trim().toLowerCase().replace(/[\s-]+/g, "_");
    if (APPLICANT_LEAD_ALLOWED_ROLES.has(normalized)) return true;
  }

  const access = Number(
    user.adminAccess ??
    user.admin_access ??
    user.gy_user_access ??
    user.access ??
    0,
  );
  return Number.isInteger(access) && APPLICANT_LEAD_ALLOWED_ACCESS_LEVELS.has(access);
}
