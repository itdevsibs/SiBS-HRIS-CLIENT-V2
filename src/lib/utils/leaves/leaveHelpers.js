export const PAGE_LIMIT = 15;
export const LEAVES_STATE_KEY = "leavesPageState";

export function formatNumber(value) {
  if (value === "..." || value === null || value === undefined) return "...";

  const numberValue = Number(value || 0);

  return numberValue.toLocaleString("en-PH", {
    maximumFractionDigits: 2,
  });
}

export function formatDate(value) {
  if (!value) return "—";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "—";

  return date.toLocaleDateString("en-PH", {
    timeZone: "Asia/Manila",
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

export function formatDateTime(value) {
  if (!value) return "—";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "—";

  return date.toLocaleString("en-PH", {
    timeZone: "Asia/Manila",
    month: "long",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function normalizeRole(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[\s-]+/g, "_");
}

export function getAccessValue(user) {
  return Number(
    user?.admin_access ??
      user?.adminAccess ??
      user?.access ??
      user?.gy_user_access ??
      user?.gyUserAccess ??
      0,
  );
}

export function isTeamLeaderUser(user) {
  const access = getAccessValue(user);

  if (access) return access === 8;

  const roles = [
    user?.role,
    user?.userRole,
    user?.accountType,
    user?.user_type,
    user?.gy_user_type,
  ].map(normalizeRole);

  return roles.some((role) =>
    ["team_leader", "teamleader", "tl"].includes(role),
  );
}

export function isWfmUser(user) {
  const access = getAccessValue(user);

  if (access) return access === 9;

  const roles = [
    user?.role,
    user?.userRole,
    user?.accountType,
    user?.user_type,
    user?.gy_user_type,
  ].map(normalizeRole);

  return roles.some((role) =>
    ["wfm", "workforce_management"].includes(role),
  );
}

export function canViewLeaveFilters(user) {
  if (isTeamLeaderUser(user) || isWfmUser(user)) return true;

  const roles = [
    user?.role,
    user?.tokenType,
    user?.userRole,
    user?.accountType,
    user?.user_type,
    user?.gy_user_type,
  ].map(normalizeRole);

  return roles.some((role) =>
    [
      "admin",
      "administrator",
      "hr_admin",
      "hradmin",
      "super_admin",
      "superadmin",
      "super_administrator",
    ].includes(role),
  );
}

export function getLeaveTypeLabel(type, fallbackLabel) {
  if (fallbackLabel) return fallbackLabel;

  const value = Number(type);

  switch (value) {
    case 1:
      return "Vacation / Personal";
    case 2:
      return "Sick";
    case 3:
      return "Maternal";
    case 4:
      return "Paternal";
    case 5:
      return "Solo Parent";
    case 6:
      return "Force";
    case 7:
      return "Indefinite";
    case 8:
      return "Quarantine";
    case 9:
      return "Emergency";
    default:
      return type ? `Leave Type ${type}` : "—";
  }
}

export function normalizeStatus(status) {
  const value = String(status || "").trim();

  if (!value) return "Pending";

  const lower = value.toLowerCase();

  if (["approved", "approve", "1"].includes(lower)) return "Approved";

  if (
    ["rejected", "declined", "not approved", "not_approved", "2"].includes(
      lower,
    )
  ) {
    return "Rejected";
  }

  if (["pending", "for approval", "for_approval", "0"].includes(lower)) {
    return "Pending";
  }

  return value;
}

export function getStatusClass(status) {
  const normalized = normalizeStatus(status);

  if (normalized === "Approved") {
    return "border-emerald-200 bg-emerald-50 text-emerald-600";
  }

  if (normalized === "Rejected") {
    return "border-rose-200 bg-rose-50 text-rose-600";
  }

  return "border-amber-200 bg-amber-50 text-amber-600";
}

export function getPaidLeaveLabel(value) {
  if (value === null || value === undefined || value === "") return "—";
  if (value === true) return "Paid Leave";
  if (value === false) return "Unpaid Leave";

  const normalized = String(value ?? "")
    .trim()
    .toLowerCase();

  if (["paid", "paid leave", "yes", "true"].includes(normalized)) {
    return "Paid Leave";
  }

  if (["unpaid", "unpaid leave", "no", "false"].includes(normalized)) {
    return "Unpaid Leave";
  }

  const numericValue = Number(value);

  if (Number.isFinite(numericValue)) {
    return numericValue > 0 ? "Paid Leave" : "Unpaid Leave";
  }

  return normalized ? String(value) : "—";
}

export function getApproverDisplay(item) {
  const displayName = String(item?.approver_display_name || "").trim();

  const userCode = String(
    item?.approver_user_code ||
      displayName.split("-")[0] ||
      item?.gy_leave_approver ||
      "",
  )
    .trim()
    .toUpperCase();

  const lname = String(item?.approver_lname || "").trim().toUpperCase();
  const fname = String(item?.approver_fname || "").trim().toUpperCase();
  const mname = String(item?.approver_mname || "").trim().toUpperCase();

  let name = "";

  if (lname || fname || mname) {
    name = `${lname}, ${fname} ${mname}`.replace(/\s+/g, " ").trim();
  } else if (displayName) {
    const displayParts = displayName.split("-");
    name = String(displayParts.slice(1).join("-") || "")
      .replace(/\s+/g, " ")
      .trim()
      .toUpperCase();
  }

  return {
    sibsId: userCode || "—",
    name: name || "—",
  };
}

export const AVATAR_TONES = [
  "border-orange-100 bg-orange-50 text-sibs-orange",
  "border-emerald-100 bg-emerald-50 text-emerald-700",
  "border-blue-100 bg-blue-50 text-sibs-navy",
  "border-pink-100 bg-pink-50 text-pink-700",
  "border-violet-100 bg-violet-50 text-violet-700",
];

export function getCleanValue(...values) {
  const match = values.find((value) => {
    return value !== undefined && value !== null && String(value).trim() !== "";
  });

  return match === undefined || match === null ? "" : String(match).trim();
}

export function getNameParts(employee = {}) {
  return {
    firstName: getCleanValue(
      employee.firstName,
      employee.first_name,
      employee.gy_emp_fname,
    ),
    middleName: getCleanValue(
      employee.middleName,
      employee.middle_name,
      employee.gy_emp_mname,
    ),
    lastName: getCleanValue(
      employee.lastName,
      employee.last_name,
      employee.gy_emp_lname,
    ),
  };
}

export function getEmployeeName(employee = {}) {
  const { firstName, middleName, lastName } = getNameParts(employee);

  if (firstName || middleName || lastName) {
    const givenNames = [firstName, middleName].filter(Boolean).join(" ");

    return [lastName ? lastName.toUpperCase() : "", givenNames]
      .filter(Boolean)
      .join(lastName && givenNames ? ", " : "")
      .replace(/\s+/g, " ")
      .trim();
  }

  return (
    getCleanValue(
      employee.fullName,
      employee.full_name,
      employee.gy_emp_fullname,
      employee.name,
    ) || "Unnamed Employee"
  );
}

export function getInitials(employee = {}) {
  const { firstName, lastName } = getNameParts(employee);

  if (firstName || lastName) {
    return `${firstName.slice(0, 1)}${lastName.slice(0, 1)}`.toUpperCase();
  }

  const tokens = getEmployeeName(employee)
    .replace(",", " ")
    .split(/\s+/)
    .filter(Boolean);

  return `${tokens[0]?.[0] || "E"}${tokens[1]?.[0] || ""}`.toUpperCase();
}

export function getAvatarTone(employee = {}) {
  const seed = getEmployeeName(employee)
    .split("")
    .reduce((total, character) => total + character.charCodeAt(0), 0);

  return AVATAR_TONES[seed % AVATAR_TONES.length];
}

export function getApprovalResultFailed(result) {
  if (result === false) return true;

  if (result && typeof result === "object") {
    return result?.success === false || result?.ok === false;
  }

  return false;
}

export function calculateLeavePageStats(paginatedLeaves = []) {
  const totalLeaves = paginatedLeaves.length;

  const approvedLeaves = paginatedLeaves.filter(
    (item) => item.normalizedStatus === "Approved",
  ).length;

  const pendingLeaves = paginatedLeaves.filter(
    (item) => item.normalizedStatus === "Pending",
  ).length;

  const rejectedLeaves = paginatedLeaves.filter(
    (item) => item.normalizedStatus === "Rejected",
  ).length;

  const totalLeaveDays = paginatedLeaves.reduce(
    (sum, item) => sum + Number(item.gy_leave_day || 0),
    0,
  );

  const totalRemaining = paginatedLeaves.reduce(
    (sum, item) => sum + Number(item.leave_remaining || 0),
    0,
  );

  return {
    totalLeaves,
    approvedLeaves,
    pendingLeaves,
    rejectedLeaves,
    totalLeaveDays,
    totalRemaining,
  };
}
