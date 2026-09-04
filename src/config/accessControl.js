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
  "wfm",
  "som",
  "executive",
  "super_admin",
];

export const ADMIN_ACCESS = {
  TA: 1,
  HR: 2,
  HR_ADMIN: 3,
  FINANCE: 4,
  MANAGER: 5,
  WFM: 9,
  SOM: 10,
  EXECUTIVE: 6,
  SUPER_ADMIN: 7,
};

export const DASHBOARD_ACCESS = {
  SUPER_ADMIN: [ADMIN_ACCESS.SUPER_ADMIN],
  HR: [
    ADMIN_ACCESS.HR,
    ADMIN_ACCESS.HR_ADMIN,
    ADMIN_ACCESS.EXECUTIVE,
  ],
  TA: [
    ADMIN_ACCESS.TA,
  ],
  OM: [
    ADMIN_ACCESS.MANAGER,
    ADMIN_ACCESS.SOM,
  ],
};

export function getAdminAccess(user = {}) {
  const role = cleanRole(user?.role);
  if (role === "super_admin" || role === "superadmin") {
    return ADMIN_ACCESS.SUPER_ADMIN;
  }

  const access = Number(
    user?.adminAccess ??
      user?.admin_access ??
      user?.access ??
      user?.gy_user_access ??
      user?.gyUserAccess ??
      0,
  );

  // Team Leaders (admin_access 8) and WFM (admin_access 9) use the exact
  // same route permissions and dashboard behavior as Managers (admin_access 5).
  if (access === 8 || access === 9) return ADMIN_ACCESS.MANAGER;

  return access;
}

export function getDefaultDashboardPath(user = {}) {
  const role = cleanRole(user?.role);

  if (role === "employee") return "/dashboard/employee";

  if (role === "super_admin" || role === "superadmin") {
    return "/dashboard/super-admin";
  }

  const access = getAdminAccess(user);

  if (DASHBOARD_ACCESS.SUPER_ADMIN.includes(access)) {
    return "/dashboard/super-admin";
  }
  if (
    ["hr", "hr_admin", "executive"].includes(role) ||
    DASHBOARD_ACCESS.HR.includes(access)
  ) {
    return "/dashboard/admin";
  }
  if (
    role === "ta" ||
    role === "talent_acquisition" ||
    DASHBOARD_ACCESS.TA.includes(access)
  ) {
    return "/recruitment/ta-dashboard";
  }
  if (
    ["om", "manager", "som"].includes(role) ||
    DASHBOARD_ACCESS.OM.includes(access)
  ) {
    return "/recruitment/om-dashboard";
  }

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
    adminAccess: [ADMIN_ACCESS.SUPER_ADMIN],
  },
  {
    paths: ["/dashboard/admin"],
    roles: ["hr", "hr_admin", "executive", "super_admin"],
    adminAccess: [
      ADMIN_ACCESS.HR,
      ADMIN_ACCESS.HR_ADMIN,
      ADMIN_ACCESS.EXECUTIVE,
      ADMIN_ACCESS.SUPER_ADMIN,
    ],
  },
  {
    paths: ["/recruitment/ta-dashboard"],
    roles: ["ta", "executive", "super_admin"],
    adminAccess: [
      ADMIN_ACCESS.TA,
      ADMIN_ACCESS.EXECUTIVE,
      ADMIN_ACCESS.SUPER_ADMIN,
    ],
  },
  {
    paths: ["/recruitment/om-dashboard"],
    roles: ["manager", "som", "executive", "super_admin"],
    adminAccess: [
      ADMIN_ACCESS.MANAGER,
      ADMIN_ACCESS.SOM,
      ADMIN_ACCESS.EXECUTIVE,
      ADMIN_ACCESS.SUPER_ADMIN,
    ],
  },
  {
    paths: ["/employee", "/employee/employee-data"],
    roles: [
      "ta",
      "hr",
      "hr_admin",
      "finance",
      "manager",
      "som",
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
      "som",
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
    roles: [
      "ta",
      "hr",
      "hr_admin",
      "manager",
      "som",
      "executive",
      "super_admin",
    ],
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
      "som",
      "executive",
      "super_admin",
    ],
  },
  {
    paths: ["/costs", "/payroll"],
    roles: [
      "finance",
      "hr_admin",
      "manager",
      "som",
      "executive",
      "super_admin",
    ],
  },
  {
    paths: ["/departments", "/locations"],
    roles: [
      "hr_admin",
      "manager",
      "som",
      "executive",
      "super_admin",
    ],
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
