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
    paths: ["/dashboard/admin"],
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
    paths: ["/recruitment/ta-dashboard"],
    roles: ["ta", "hr", "hr_admin", "executive", "super_admin"],
  },
  {
    paths: ["/recruitment/om-dashboard"],
    roles: ["manager", "hr", "hr_admin", "executive", "super_admin"],
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
      "/recruitment/weekly-hiring-plan",
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

  return matchedRule.roles.includes(role);
}

export function canAccessMenuItem(user, item) {
  if (!item?.allowedRoles) return true;

  const role = cleanRole(user?.role);

  return item.allowedRoles.includes(role);
}