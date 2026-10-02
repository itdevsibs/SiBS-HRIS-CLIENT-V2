import { sanitizeDisplayFullName, sanitizeMiddleName } from "../employees/employeeNameDisplay.js";

export const ROLE_OPTIONS = [
  { value: "All", label: "All Access Levels" },
  { value: "employee", label: "Employee", access: 0 },
  { value: "ta", label: "Talent Acquisition", access: 1 },
  { value: "hr", label: "HR", access: 2 },
  { value: "hr_admin", label: "HR Admin", access: 3 },
  { value: "finance", label: "Finance", access: 4 },
  { value: "manager", label: "Manager", access: 5 },
  { value: "executive", label: "Executive", access: 6 },
  { value: "super_admin", label: "Super Admin", access: 7 },
  { value: "team_leaders", label: "Team Leaders", access: 8 },
  { value: "wfm", label: "WFM", access: 9 },
  { value: "som", label: "SOM", access: 10 },
];

export function safeText(value) {
  return String(value ?? "").trim();
}

export function normalizeRole(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[\s-]+/g, "_");
}

export function getAdminAccess(user) {
  const value =
    user?.adminAccess ??
    user?.admin_access ??
    user?.gy_user_access ??
    user?.access ??
    user?.adminLevel ??
    user?.admin_level;

  if (value !== undefined && value !== null && value !== "") {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) return parsed;
  }

  const role = normalizeRole(
    user?.role ||
      user?.userRole ||
      user?.user_role ||
      user?.adminRole ||
      user?.admin_role,
  );

  if (role === "super_admin" || role === "superadmin") return 7;
  if (role === "admin" || role === "hr_admin") return 6;
  if (role === "manager" || role === "operations_manager") return 4;
  if (role === "som") return 3;
  if (role === "team_leader" || role === "team_leaders") return 2;
  if (role === "wfm") return 1;

  return 0;
}

export function isSuperAdmin(user) {
  if (!user) return false;

  const role = normalizeRole(
    user?.role ||
      user?.userRole ||
      user?.user_role ||
      user?.adminRole ||
      user?.admin_role,
  );

  return (
    getAdminAccess(user) >= 7 ||
    role === "super_admin" ||
    role === "superadmin"
  );
}

export function formatNumber(value) {
  return Number(value || 0).toLocaleString("en-PH", {
    maximumFractionDigits: 0,
  });
}

export function formatDateTime(value) {
  if (!value) return "—";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);

  return date.toLocaleString("en-PH", {
    month: "long",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export function formatCompactDateTime(value) {
  if (!value) return "—";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);

  return date.toLocaleString("en-PH", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export function formatCompactDate(value) {
  if (!value) return "—";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);

  return date.toLocaleDateString("en-PH", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function formatEmployeeName(employee = {}) {
  if (!employee) return "—";

  const fullName = sanitizeDisplayFullName(
    safeText(employee.fullName || employee.full_name),
  );
  if (fullName) return fullName;

  const name = [
    employee.firstName,
    sanitizeMiddleName(employee.middleName),
    employee.lastName,
  ]
    .map(safeText)
    .filter(Boolean)
    .join(" ");

  return name || "—";
}

export function getProfileImageUrl(employee = {}) {
  const directUrl = safeText(
    employee?.profilePictureUrl ||
      employee?.profile_picture_url ||
      employee?.profileUrl ||
      employee?.profile_url,
  );

  if (directUrl) return directUrl;

  const filename = safeText(
    employee?.profileFilename ||
      employee?.profile_filename ||
      employee?.profilePicture ||
      employee?.profile_picture,
  );

  if (!filename) return "";
  return `/api/employees/profile-picture/${encodeURIComponent(filename)}`;
}

export function getRoleOptionByAccess(adminAccess) {
  if (adminAccess === null || adminAccess === undefined || adminAccess === "") {
    return null;
  }
  return (
    ROLE_OPTIONS.find(
      (option) => option.access === Number(adminAccess),
    ) || null
  );
}

export function getRoleLabel(role, adminAccess) {
  const byAccess = getRoleOptionByAccess(adminAccess);
  if (byAccess && byAccess.value !== "All") return byAccess.label;

  const normalized = normalizeRole(role);
  const byRole = ROLE_OPTIONS.find((option) => option.value === normalized);
  if (byRole) return byRole.label;

  return safeText(role) || "Employee";
}

export function getRolePillClass(adminAccess) {
  const access = Number(adminAccess || 0);

  if (access >= 7) {
    return "border-purple-200 bg-purple-50 text-purple-700";
  }

  if (access === 6) {
    return "border-indigo-200 bg-indigo-50 text-indigo-700";
  }

  if (access >= 4) {
    return "border-blue-200 bg-blue-50 text-blue-700";
  }

  if (access >= 1) {
    return "border-cyan-200 bg-cyan-50 text-cyan-700";
  }

  return "border-slate-200 bg-slate-50 text-slate-600";
}

export function isActiveAssignedUser(user = {}) {
  return safeText(user?.status).toLowerCase() === "active";
}

export function getStatusPillClass(status) {
  const normalized = safeText(status).toLowerCase();

  if (normalized === "active") {
    return "border-emerald-200 bg-emerald-50 text-emerald-700";
  }

  return "border-slate-200 bg-slate-50 text-slate-700";
}

export function getAccountName(account = {}) {
  if (typeof account === "string") return account;
  return (
    safeText(
      account?.accountName ||
        account?.account_name ||
        account?.gy_acc_name ||
        account?.account ||
        account?.name,
    ) || "—"
  );
}

export function getAccountId(account = {}) {
  if (typeof account === "string" || typeof account === "number") {
    return String(account);
  }
  return safeText(
    account?.accountId ||
      account?.account_id ||
      account?.gy_acc_id ||
      account?.id,
  );
}

export function getDepartmentName(account = {}) {
  if (typeof account === "string") return account;
  return (
    safeText(
      account?.departmentName ||
        account?.department_name ||
        account?.department ||
        account?.name_department,
    ) || "—"
  );
}

export function getAuditDisplayValue(user = {}, type = "creator") {
  if (!user) return "—";

  const directDisplay =
    type === "creator"
      ? safeText(
          user.creatorDisplay ||
            user.creator_display ||
            user.sibsIdCreatorDisplay ||
            user.sibs_id_creator_display,
        )
      : safeText(
          user.updaterDisplay ||
            user.updater_display ||
            user.sibsIdUpdaterDisplay ||
            user.sibs_id_updater_display,
        );

  if (directDisplay) return directDisplay;

  const assignedDisplayValues = [
    ...new Set(
      (user.assignedAccounts || [])
        .map((account) =>
          type === "creator"
            ? safeText(
                account.creatorDisplay ||
                  account.creator_display ||
                  account.sibsIdCreatorDisplay ||
                  account.sibs_id_creator_display,
              )
            : safeText(
                account.updaterDisplay ||
                  account.updater_display ||
                  account.sibsIdUpdaterDisplay ||
                  account.sibs_id_updater_display,
              ),
        )
        .filter(Boolean),
    ),
  ];

  if (assignedDisplayValues.length) {
    return assignedDisplayValues.join(", ");
  }

  const name =
    type === "creator"
      ? safeText(user.createdByName || user.created_by_name)
      : safeText(user.updatedByName || user.updated_by_name);

  const sibsId =
    type === "creator"
      ? safeText(
          user.sibsIdCreator ||
            user.sibs_id_creator ||
            user.createdBySibsId ||
            user.created_by_sibs_id,
        )
      : safeText(
          user.sibsIdUpdater ||
            user.sibs_id_updater ||
            user.updatedBySibsId ||
            user.updated_by_sibs_id,
        );

  if (sibsId && name) return `${sibsId} - ${name}`;
  if (name) return name;
  if (sibsId) return sibsId;

  return "—";
}

export function getAuditDateValue(user = {}, type = "created") {
  if (!user) return null;

  const directValue =
    type === "created"
      ? user.createdAt || user.created_at
      : user.updatedAt || user.updated_at;

  if (directValue) return directValue;

  const values = (user.assignedAccounts || [])
    .map((account) =>
      type === "created"
        ? account.createdAt || account.created_at
        : account.updatedAt || account.updated_at,
    )
    .filter(Boolean);

  if (!values.length) return null;

  return values.reduce((selected, current) => {
    if (!selected) return current;

    const selectedTime = new Date(selected).getTime();
    const currentTime = new Date(current).getTime();

    if (!Number.isFinite(selectedTime)) return current;
    if (!Number.isFinite(currentTime)) return selected;

    if (type === "created") {
      return currentTime < selectedTime ? current : selected;
    }

    return currentTime > selectedTime ? current : selected;
  }, null);
}
