export function cleanRole(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[\s-]+/g, "_");
}

export const ADMIN_ROLES = [
  "ta",
  "hr",
  "hr_admin",
  "finance",
  "manager",
  "executive",
  "super_admin",
];

export const ADMIN_ACCESS = {
  TA: 1,
  HR: 2,
  HR_ADMIN: 3,
  FINANCE: 4,
  MANAGER: 5,
  EXECUTIVE: 6,
  SUPER_ADMIN: 7,
};

export const DASHBOARD_ACCESS = {
  SUPER_ADMIN: [ADMIN_ACCESS.SUPER_ADMIN],
  HR: [
    ADMIN_ACCESS.HR,
    ADMIN_ACCESS.HR_ADMIN,
    ADMIN_ACCESS.EXECUTIVE,
    ADMIN_ACCESS.SUPER_ADMIN,
  ],
  TA: [
    ADMIN_ACCESS.TA,
    ADMIN_ACCESS.EXECUTIVE,
    ADMIN_ACCESS.SUPER_ADMIN,
  ],
  OM: [
    ADMIN_ACCESS.MANAGER,
    ADMIN_ACCESS.EXECUTIVE,
    ADMIN_ACCESS.SUPER_ADMIN,
  ],
};

export function getAdminAccess(user = {}) {
  return Number(
    user?.adminAccess ??
      user?.admin_access ??
      user?.access ??
      user?.gy_user_access ??
      user?.gyUserAccess ??
      0,
  );
}

export function getDefaultDashboardPath(user = {}) {
  const role = cleanRole(user?.role);

  if (role === "employee") return "/dashboard/employee";

  const access = getAdminAccess(user);

  if (DASHBOARD_ACCESS.SUPER_ADMIN.includes(access)) {
    return "/dashboard/super-admin";
  }
  if (DASHBOARD_ACCESS.HR.includes(access)) return "/dashboard/admin";
  if (DASHBOARD_ACCESS.TA.includes(access)) return "/recruitment/ta-dashboard";
  if (DASHBOARD_ACCESS.OM.includes(access)) return "/recruitment/om-dashboard";

  return "/employee";
}

export const EMPLOYEE_ALLOWED_PATHS = [
  "/dashboard/employee",
  "/attendance",
  "/leaves",
  "/profile",
  "/profile/user",
  "/schedule",
  "/resignation",
];

export const ACCESS_RULES = [
  {
    paths: ["/dashboard/super-admin"],
    roles: ["super_admin"],
    adminAccess: DASHBOARD_ACCESS.SUPER_ADMIN,
  },
  {
    paths: ["/dashboard/admin"],
    roles: ["hr", "hr_admin", "executive", "super_admin"],
    adminAccess: DASHBOARD_ACCESS.HR,
  },
  {
    paths: ["/recruitment/ta-dashboard"],
    roles: ["ta", "executive", "super_admin"],
    adminAccess: DASHBOARD_ACCESS.TA,
  },
  {
    paths: ["/recruitment/om-dashboard"],
    roles: ["manager", "executive", "super_admin"],
    adminAccess: DASHBOARD_ACCESS.OM,
  },
  {
    paths: ["/employee", "/employee/employee-data"],
    roles: [
      "ta",
      "hr",
      "hr_admin",
      "finance",
      "manager",
      "executive",
      "super_admin",
    ],
  },
  {
    paths: [
      "/attendance",
      "/leaves",
      "/attrition",
      "/requisitions",
      "/resignation",
      "/schedule",
      "/profile/user",
    ],
    roles: [
      "employee",
      "ta",
      "hr",
      "hr_admin",
      "finance",
      "manager",
      "executive",
      "super_admin",
    ],
  },
  {
    paths: [
      "/recruitment/workforce-hiring-plan",
      "/recruitment/hiring-needs",
      "/recruitment/weekly-reports",
    ],
    roles: ["ta", "hr", "hr_admin", "manager", "executive", "super_admin"],
  },
  {
    paths: [
      "/recruitment/job-description",
      "/recruitment/available-positions",
      "/recruitment/sourcing-analytics",
      "/recruitment/talent-pool",
      "/recruitment/candidate-pipeline",
      "/recruitment/offers",
      "/recruitment/onboarding",
      "/recruitment/action-items",
      "/recruitment/candidate-experience",
      "/recruitment/final-interview-form",
      "/settings/recruitment-settings",
    ],
    roles: ["ta", "hr", "hr_admin", "executive", "super_admin"],
  },
  {
    paths: ["/email-logs", "/reports", "/analytics"],
    roles: [
      "ta",
      "hr",
      "hr_admin",
      "finance",
      "manager",
      "executive",
      "super_admin",
    ],
  },
  {
    paths: ["/costs", "/payroll"],
    roles: ["finance", "hr_admin", "executive", "super_admin"],
  },
  {
    paths: ["/departments", "/locations"],
    roles: ["hr_admin", "executive", "super_admin"],
  },
  {
    paths: ["/users"],
    roles: ["super_admin"],
  },
];

export function pathMatches(pathname, path) {
  return pathname === path || pathname.startsWith(`${path}/`);
}

export function isEmployeeAllowedPath(pathname) {
  return EMPLOYEE_ALLOWED_PATHS.some((path) => pathMatches(pathname, path));
}

export function canAccessPath(user, pathname) {
  if (!user) return false;

  const role = cleanRole(user?.role);

  if (role === "employee") {
    return isEmployeeAllowedPath(pathname);
  }

  const matchedRule = ACCESS_RULES.find((rule) =>
    rule.paths.some((path) => pathMatches(pathname, path)),
  );

  if (!matchedRule) {
    return true;
  }

  if (Array.isArray(matchedRule.adminAccess)) {
    const access = getAdminAccess(user);

    if (access) return matchedRule.adminAccess.includes(access);
  }

  return matchedRule.roles.includes(role);
}

export function canAccessMenuItem(user, item) {
  if (!item?.allowedRoles) return true;

  const role = cleanRole(user?.role);

  return item.allowedRoles.includes(role);
}
