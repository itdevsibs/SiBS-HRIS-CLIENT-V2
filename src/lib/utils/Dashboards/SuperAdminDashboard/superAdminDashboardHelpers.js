import { formatHrisDateLocalized, formatHrisDateTimeLocalized } from "@/lib/axios/dateFormatter";
export const SUPER_ADMIN_ROUTES = Object.freeze({
  employees: "/employee",
  hrDashboard: "/dashboard/admin",
  taDashboard: "/recruitment/ta-dashboard",
  omDashboard: "/recruitment/om-dashboard",
  approvals: "/approval-request",
  jobDescriptions: "/recruitment/job-description",
  hiringNeeds: "/recruitment/hiring-needs",
  candidatePipeline: "/recruitment/candidate-pipeline",
  reports: "/recruitment/weekly-reports",
  accessSettings: "/settings/user-settings",
});

export const SUPER_ADMIN_PENDING_APPROVALS_PATH = "/approval-request?queue=pending-attrition";
export function getSuperAdminPendingLeavesState(leaveDateRange) {
  return { source: "super-admin-pending-leaves", leaveStatus: "Pending", leaveDateRange };
}

export const ACCESS_LEVELS = Object.freeze([
  "1 - TA",
  "2 - HR",
  "3 - HR Admin",
  "4 - Finance",
  "5 - Manager",
  "6 - Executive",
  "7 - Super Admin",
  "8 - Team Leaders",
  "9 - WFM",
  "10 - SOM",
]);

export const ACCOUNT_GROUPS = Object.freeze([
  "Software Management",
  "Call Center Operations",
  "Workforce Management",
  "Management Team",
  "Internal HR Ops",
]);

export const ACCESS_HIERARCHY = Object.freeze([
  ["1 - TA", "Recruitment & Sourcing"],
  ["2 - HR", "HR Support & Tickets"],
  ["3 - HR Admin", "Full HR Ops Control"],
  ["4 - Finance", "Payroll & Costing"],
  ["5 - Manager", "Team & Approval Head"],
  ["6 - Executive", "Executive Reporting"],
  ["7 - Super Admin", "Full System Oversight"],
  ["8 - Team Leaders", "Operations & Team Leads"],
  ["9 - WFM", "Workforce Planning"],
  ["10 - SOM", "Senior Operations"],
]);

export function buildDynamicSnapshotCards({
  metrics = {},
  overview = null,
  accountCount = 0,
  adminCount = 0,
} = {}) {
  const employees = Number(metrics?.employeesCount || 0);
  const departments = Number(metrics?.departmentsCount || 0);
  const leaves = metrics.leavesStatus === "updating" ? "Updating"
    : metrics.leavesCount === "—" || metrics.leavesCount == null ? "Unavailable" : metrics.leavesCount;
  const approvals = metrics.approvalsLoading ? "Updating"
    : metrics.pendingApprovals === "—" || metrics.pendingApprovals == null
    ? "Unavailable" : metrics.pendingApprovals;
  const recruitment = Number(metrics?.recruitmentCount || 0);
  const accounts = accountCount || 0;
  const admins = adminCount || Number(metrics?.admins || 0);

  const now = new Date();
  const monthName = formatHrisDateTimeLocalized(now, "en-US", { month: "long" });
  const year = now.getFullYear();
  const day = now.getDate();
  const lastDay = new Date(year, now.getMonth() + 1, 0).getDate();
  const payrollCycleText =
    day <= 15
      ? `${monthName} 1 – 15, ${year}`
      : `${monthName} 16 – ${lastDay}, ${year}`;

  const attendanceRate =
    overview?.metrics?.attendanceRate ??
    (overview?.workforceKpi?.utilization || 98);

  return [
    {
      title: "Core HR & Employee Operations",
      iconKey: "employees",
      path: SUPER_ADMIN_ROUTES.employees,
      metrics: [
        [
          "Master Headcount",
          employees > 0 ? `${employees.toLocaleString()} Staff` : "Live Directory",
        ],
        [
          "Active Departments",
          departments > 0 ? `${departments} Depts` : "Configured",
        ],
        ["Pending Leave Requests", leaves],
        ["Access Governance", `${admins} Assigned`],
      ],
    },
    {
      title: "Talent Acquisition & Sourcing",
      iconKey: "recruitment",
      path: SUPER_ADMIN_ROUTES.taDashboard,
      metrics: [
        [
          "Candidate Pipeline",
          recruitment > 0 ? `${recruitment} Candidates` : "Live Pipeline",
        ],
        ["Open Requisitions", "Active"],
        ["Weekly Reports", "Performance Ready"],
        ["Talent Pool", "Sourcing Active"],
      ],
    },
    {
      title: "Operations Management (OM)",
      iconKey: "operations",
      path: SUPER_ADMIN_ROUTES.omDashboard,
      metrics: [
        [
          "Account Groups",
          accounts > 0 ? `${accounts} Client Accounts` : "Live Accounts",
        ],
        ["Recruiter Load", `${admins || 1} Active Leads`],
        ["Operation Capacity", `${attendanceRate}% Staffed`],
        ["Shift Coverage", "Real-Time Tracking"],
      ],
    },
    {
      title: "Finance & Payroll Summary",
      iconKey: "finance",
      path: SUPER_ADMIN_PENDING_APPROVALS_PATH,
      metrics: [
        ["Current Payroll Cycle", payrollCycleText],
        ["Payroll Status", "Active Cycle"],
        ["Pending Attrition Approvals", approvals],
        ["Reports & Audits", "Audit Logs Ready"],
      ],
    },
  ];
}

export function getUserDisplayName(user) {
  const lastName = (
    user?.gy_emp_lname ||
    user?.lastName ||
    user?.last_name ||
    ""
  ).trim();
  const firstName = (
    user?.gy_emp_fname ||
    user?.firstName ||
    user?.first_name ||
    ""
  ).trim();
  const middleName = (
    user?.gy_emp_mname ||
    user?.middleName ||
    user?.middle_name ||
    ""
  ).trim();

  if (lastName || firstName) {
    const parts = [lastName, [firstName, middleName].filter(Boolean).join(" ")].filter(Boolean);
    return parts.join(", ").trim().toUpperCase();
  }

  return String(
    user?.full_name ||
      user?.fullName ||
      user?.name ||
      user?.email ||
      "Super Admin",
  ).toUpperCase();
}

export function getStatusPillClass(status) {
  const s = String(status || "").trim().toLowerCase();
  if (s === "active" || s === "success") {
    return "border-emerald-200 bg-emerald-50 text-emerald-700";
  }

  if (s === "locked" || s === "flagged" || s === "inactive") {
    return "border-rose-200 bg-rose-50 text-rose-700";
  }

  return "border-amber-200 bg-amber-50 text-amber-700";
}

export function formatRoleDisplayName(role = "") {
  const r = String(role || "").trim().toLowerCase();
  if (r === "ta") return "TA";
  if (r === "hr") return "HR";
  if (r === "hr_admin") return "HR Admin";
  if (r === "wfm") return "WFM";
  if (r === "som") return "SOM";
  if (r === "super_admin" || r === "superadmin") return "Super Admin";
  if (r === "team_leaders" || r === "team_leader") return "Team Leaders";
  if (r === "manager") return "Manager";
  if (r === "finance") return "Finance";
  if (r === "executive") return "Executive";
  if (r === "employee") return "Employee";

  return r.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

export function getAccessLevelClass(accessLevel) {
  const str = String(accessLevel || "");
  const lower = str.toLowerCase();

  if (str.startsWith("7") || lower.includes("super_admin") || lower.includes("super admin")) {
    return "bg-sibs-navy text-white border border-sibs-navy";
  }
  if (str.startsWith("6") || lower.includes("executive")) {
    return "bg-purple-100 text-purple-800 border border-purple-200";
  }
  if (str.startsWith("5") || lower.includes("manager")) {
    return "bg-sky-100 text-sky-800 border border-sky-200";
  }
  if (str.startsWith("4") || lower.includes("finance")) {
    return "bg-amber-100 text-amber-800 border border-amber-200";
  }
  if (str.startsWith("3") || lower.includes("hr_admin") || lower.includes("hr admin")) {
    return "bg-blue-100 text-blue-800 border border-blue-200";
  }
  if (str.startsWith("8") || lower.includes("team_leader") || lower.includes("team leaders")) {
    return "bg-teal-100 text-teal-800 border border-teal-200";
  }
  if (str.startsWith("9") || lower.includes("wfm")) {
    return "bg-indigo-100 text-indigo-800 border border-indigo-200";
  }
  if (str.startsWith("10") || lower.includes("som")) {
    return "bg-emerald-100 text-emerald-800 border border-emerald-200";
  }
  if (str.startsWith("1") || lower.includes("ta")) {
    return "bg-orange-100 text-sibs-orange border border-orange-200";
  }

  return "bg-slate-100 text-slate-700 border border-slate-200";
}

function includesSearch(values, keyword) {
  if (!keyword) return true;

  return values.some((value) =>
    String(value || "").toLowerCase().includes(keyword),
  );
}

export function filterSuperAdminExceptions(items, search, moduleFilter) {
  const keyword = String(search || "").trim().toLowerCase();

  return (Array.isArray(items) ? items : []).filter((item) => {
    const matchesSearch = includesSearch(
      [
        item.title,
        item.description,
        item.moduleTarget,
      ],
      keyword,
    );

    const matchesModule =
      !moduleFilter ||
      moduleFilter === "All" ||
      moduleFilter === "All Modules" ||
      item.moduleTarget === moduleFilter;

    return matchesSearch && matchesModule;
  });
}

export function filterSuperAdminAdmins(
  items,
  search,
  accessLevelFilter,
  accountFilter,
  statusFilter,
) {
  const keyword = String(search || "").trim().toLowerCase();

  return (Array.isArray(items) ? items : []).filter((item) => {
    const matchesSearch = includesSearch(
      [item.name, item.email, item.department, item.accountGroup],
      keyword,
    );
    const matchesAccess =
      !accessLevelFilter ||
      accessLevelFilter === "All" ||
      accessLevelFilter === "All Access Levels" ||
      item.accessLevel === accessLevelFilter;
    const matchesAccount =
      !accountFilter ||
      accountFilter === "All" ||
      accountFilter === "All Accounts" ||
      item.accountGroup === accountFilter;
    const matchesStatus =
      !statusFilter ||
      statusFilter === "All" ||
      statusFilter === "All Statuses" ||
      item.status === statusFilter;

    return matchesSearch && matchesAccess && matchesAccount && matchesStatus;
  });
}

export function filterSuperAdminActivity(
  items,
  search,
  moduleFilter,
  statusFilter,
) {
  const keyword = String(search || "").trim().toLowerCase();

  return (Array.isArray(items) ? items : []).filter((item) => {
    const matchesSearch = includesSearch(
      [item.actor, item.action, item.details, item.module],
      keyword,
    );
    const matchesModule =
      !moduleFilter ||
      moduleFilter === "All" ||
      moduleFilter === "All Modules" ||
      item.module === moduleFilter;
    const matchesStatus =
      !statusFilter ||
      statusFilter === "All" ||
      statusFilter === "All Statuses" ||
      item.status === statusFilter;

    return matchesSearch && matchesModule && matchesStatus;
  });
}

export function getSuperAdminPageLimit(activeTab) {
  if (activeTab === "exceptions") return 5;
  if (activeTab === "access_roles") return 10;
  if (activeTab === "activity") return 10;
  return 1;
}

export function paginateSuperAdminItems(items, page, limit) {
  const safeItems = Array.isArray(items) ? items : [];
  const safeLimit = Math.max(Number(limit) || 1, 1);
  const totalPages = Math.max(Math.ceil(safeItems.length / safeLimit), 1);
  const safePage = Math.min(Math.max(Number(page) || 1, 1), totalPages);
  const start = (safePage - 1) * safeLimit;

  return {
    items: safeItems.slice(start, start + safeLimit),
    currentPage: safePage,
    totalPages,
    totalItems: safeItems.length,
    limit: safeLimit,
  };
}

function verifiedCount(value) {
  return Number.isSafeInteger(value) && value >= 0 ? value : null;
}

export function normalizeSuperAdminQueueMetrics(approvalResult, leaveResult) {
  const approvalsTotal = approvalResult?.success === true
    ? verifiedCount(approvalResult.data?.pending) : null;
  const leavesUpdating = leaveResult?.success === true &&
    (leaveResult.ready === false || leaveResult.stale === true);
  const recent = leaveResult?.data?.recentPendingLeaves;
  const leavesTotal = leaveResult?.success === true && leaveResult.ready === true &&
    !leavesUpdating && recent?.dateFrom && recent?.dateTo
    ? verifiedCount(recent.count) : null;

  return {
    approvalsTotal,
    leavesTotal,
    leavesDateRange: leavesTotal === null ? null : { dateFrom: recent.dateFrom, dateTo: recent.dateTo },
    leavesStatus: leavesUpdating ? "updating" : leavesTotal === null ? "unavailable" : "ready",
  };
}

export function normalizeSuperAdminMetrics(overview = {}, extraData = {}) {
  const employees = extraData?.employeeTotal ?? overview?.metrics?.employees ?? null;
  const departments = Number(
    extraData?.departmentsTotal ?? overview?.metrics?.departments ?? 0,
  );
  const attendancePresent = verifiedCount(overview?.attendance?.present);
  // `interviewsToday` counts only today's interviews, not active candidates.
  // Until the feed supplies an actual pipeline count, show unavailable rather
  // than a misleading zero.
  const rawRecruitmentCount = extraData?.recruitmentTotal;
  const recruitmentCount = rawRecruitmentCount === null ||
    rawRecruitmentCount === undefined || rawRecruitmentCount === ""
    ? null
    : Number(rawRecruitmentCount);
  const adminCount = Number(extraData?.adminCount ?? 7);

  return {
    employees: employees?.toLocaleString() ?? "—",
    employeesCount: employees,
    departmentsCount: departments,
    admins: String(adminCount),
    attendancePresent: attendancePresent?.toLocaleString() ?? "—",
    attendanceDate: overview?.generatedAt
      ? formatHrisDateLocalized(overview.generatedAt, "en-PH", { month: "short", day: "numeric", year: "numeric" })
      : null,
    pendingApprovals: extraData.approvalsTotal?.toLocaleString() ?? "—",
    approvalsLoading: extraData.approvalsLoading,
    leavesCount: extraData.leavesTotal?.toLocaleString() ?? "—",
    leavesStatus: extraData.leavesStatus,
    leavesDateRange: extraData.leavesDateRange,
    recruitmentCount: recruitmentCount !== null &&
      Number.isFinite(recruitmentCount) && recruitmentCount >= 0
      ? String(recruitmentCount)
      : "—",
  };
}

export function buildDynamicSummaryCards(metrics = {}) {
  const empCount = metrics?.employees || "—";
  const deptCount = metrics?.departmentsCount || 0;
  const approvalsCount = metrics?.pendingApprovals || "—";
  const recruitmentCount = metrics?.recruitmentCount || "—";

  return [
    {
      label: "Core HR Scope",
      value: `${empCount} Active Staff`,
      details: metrics?.employees === "—" ? "Workforce data unavailable" : `${deptCount} Departments`,
      linkLabel: "Open HR Directory",
      path: SUPER_ADMIN_ROUTES.employees,
    },
    {
      label: "Talent Acquisition (TA)",
      value: `${recruitmentCount} Active Pipeline`,
      details: "Live Requisitions & Candidate Pipeline",
      linkLabel: "Open TA Pipeline",
      path: SUPER_ADMIN_ROUTES.taDashboard,
    },
    {
      label: "Operations Management (OM)",
      value: "Live Client Accounts",
      details: "Department Staffing & Shift Capacity",
      linkLabel: "Open OM Dashboard",
      path: SUPER_ADMIN_ROUTES.omDashboard,
    },
    {
      label: "Finance & Governance",
      value: "System Governance",
      details: metrics.approvalsLoading ? "Updating approval count"
        : approvalsCount === "—" ? "Approval count unavailable" : `${approvalsCount} Pending Attrition Approvals`,
      linkLabel: "Open Approvals",
      path: SUPER_ADMIN_PENDING_APPROVALS_PATH,
    },
  ];
}

export function deriveLiveExceptions({ approvalsTotal, leavesTotal, leavesDateRange } = {}) {
  const flags = [];

  if (approvalsTotal > 0) {
    flags.push({
      id: "pending-attrition",
      title: `${approvalsTotal} pending workflow approval${approvalsTotal === 1 ? "" : "s"}`,
      description: "Attrition requests in the visible approval queue with Pending status.",
      moduleTarget: "Approval Requests",
      path: SUPER_ADMIN_PENDING_APPROVALS_PATH,
    });
  }

  if (leavesTotal > 0) {
    flags.push({
      id: "pending-leaves",
      title: `${leavesTotal} pending leave request${leavesTotal === 1 ? "" : "s"}`,
      description: "Pending leave requests dated within the last six weeks in your leave scope.",
      moduleTarget: "Leaves Management",
      path: "/leaves",
      state: getSuperAdminPendingLeavesState(leavesDateRange),
    });
  }

  return flags;
}

export function detectActivityModule(action = "", details = "") {
  const text = `${action} ${details}`.toLowerCase();

  if (text.includes("requisition")) return "Job Requisitions";
  if (text.includes("jd-") || text.includes("job description")) return "Job Descriptions";
  if (
    text.includes("interview") ||
    text.includes("screen") ||
    text.includes("candidate") ||
    text.includes("assessment") ||
    text.includes("pipeline")
  ) {
    return "Candidate Pipeline";
  }
  if (text.includes("offer") || text.includes("onboarding") || text.includes("nho")) {
    return "Offers & Onboarding";
  }
  if (text.includes("leave")) return "Leaves Management";
  if (text.includes("resign") || text.includes("clearance")) return "Resignation Management";
  if (text.includes("attendance") || text.includes("timecard") || text.includes("biometric")) {
    return "Time & Attendance";
  }
  if (text.includes("employee") || text.includes("hire") || text.includes("department")) {
    return "Employee Directory";
  }
  if (text.includes("admin") || text.includes("access") || text.includes("role") || text.includes("user")) {
    return "Access Governance";
  }
  if (text.includes("payroll") || text.includes("salary") || text.includes("bonus")) {
    return "Payroll";
  }

  return "HRIS Operations";
}

function formatAuditTimestamp(rawTimestamp) {
  const date =
    !rawTimestamp || rawTimestamp === "Recently"
      ? new Date()
      : new Date(rawTimestamp);

  if (Number.isNaN(date.getTime())) {
    return String(rawTimestamp || "—");
  }

  return formatHrisDateTimeLocalized(date, "en-PH", {
    timeZone: "Asia/Manila",
    month: "long",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}

export function formatLogDate(dateVal) {
  if (!dateVal) return null;
  if (dateVal instanceof Date) {
    if (Number.isNaN(dateVal.getTime())) return null;
    return formatHrisDateLocalized(dateVal, "en-PH", {
      timeZone: "Asia/Manila",
      month: "long",
      day: "numeric",
      year: "numeric",
    });
  }

  const str = String(dateVal).trim();
  const isoMatch = str.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (isoMatch) {
    const d = new Date(Number(isoMatch[1]), Number(isoMatch[2]) - 1, Number(isoMatch[3]));
    return formatHrisDateLocalized(d, "en-PH", {
      month: "long",
      day: "numeric",
      year: "numeric",
    });
  }

  const d = new Date(str);
  if (!Number.isNaN(d.getTime())) {
    return formatHrisDateLocalized(d, "en-PH", {
      timeZone: "Asia/Manila",
      month: "long",
      day: "numeric",
      year: "numeric",
    });
  }

  return null;
}

export function formatLogDetails(text) {
  if (typeof text !== "string" || !text.trim()) return text || "—";

  // Check for '<date> to <date>' or '<date> – <date>' pattern
  const rangeMatch = text.match(/^(.+?)\s+(?:to|–|-)\s+(.+?)$/i);
  if (rangeMatch) {
    const rawStart = rangeMatch[1].trim();
    const rawEnd = rangeMatch[2].trim();
    const d1 = formatLogDate(rawStart);
    const d2 = formatLogDate(rawEnd);
    if (d1 && d2) {
      return d1 === d2 ? d1 : `${d1} to ${d2}`;
    }
  }

  // Replace any verbose Date.toString() representations:
  // e.g., 'Sun Sep 06 2026 00:00:00 GMT+0800 (Taiwan Standard Time)'
  const verboseDateRegex =
    /(?:Mon|Tue|Wed|Thu|Fri|Sat|Sun)\s+[A-Z][a-z]{2}\s+\d{1,2}\s+\d{4}(?:\s+\d{2}:\d{2}:\d{2})?(?:\s+GMT[+-]\d{4})?(?:\s*\([^)]+\))?/g;
  let formatted = text.replace(verboseDateRegex, (m) => formatLogDate(m) || m);

  // If after replacement we have '<formattedDate> to <formattedDate>' where both match
  const simplifiedRange = formatted.match(
    /^([A-Z][a-z]{2}\s+\d{1,2},\s+\d{4})\s+(?:to|–|-)\s+([A-Z][a-z]{2}\s+\d{1,2},\s+\d{4})$/,
  );
  if (simplifiedRange && simplifiedRange[1] === simplifiedRange[2]) {
    return simplifiedRange[1];
  }

  return formatted;
}

export function enrichActivityLogs(rawLogs = []) {
  if (!Array.isArray(rawLogs)) return [];

  return rawLogs.map((item, idx) => {
    const action = item.action || item.actionTaken || "SYSTEM_EVENT";
    const details = formatLogDetails(
      item.details || item.description || item.detail || "Activity recorded.",
    );
    const detectedModule = item.module && item.module !== "HRIS Operations"
      ? item.module
      : detectActivityModule(action, details);

    return {
      id: item.id || `LOG-LIVE-${idx}-${Date.now()}`,
      timestamp: formatAuditTimestamp(item.timestamp || item.created_at || item.createdAt),
      actor: item.actor || item.userName || item.user || "System",
      accessLevel: item.accessLevel || item.role || "Admin",
      module: detectedModule,
      action: action,
      details: details,
      status: item.status || "Success",
    };
  });
}

export function exportActivityLogsToCsv(logs = []) {
  if (!Array.isArray(logs) || logs.length === 0) {
    return false;
  }

  const headers = ["Timestamp", "User Actor", "Access Level", "Module", "Action Taken", "Log Details", "Result Status"];

  const escapeCsvValue = (val) => {
    const stringVal = String(val ?? "");
    if (stringVal.includes(",") || stringVal.includes('"') || stringVal.includes("\n")) {
      return `"${stringVal.replace(/"/g, '""')}"`;
    }
    return stringVal;
  };

  const rows = logs.map((log) => [
    escapeCsvValue(log.timestamp),
    escapeCsvValue(log.actor),
    escapeCsvValue(log.accessLevel),
    escapeCsvValue(log.module),
    escapeCsvValue(log.action),
    escapeCsvValue(log.details),
    escapeCsvValue(log.status),
  ]);

  const csvContent = [headers.join(","), ...rows.map((row) => row.join(","))].join("\r\n");

  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  const today = new Date().toISOString().slice(0, 10);
  link.setAttribute("href", url);
  link.setAttribute("download", `sibs-hris-activity-log-${today}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);

  return true;
}

export function normalizeAssignedAdminUsers(users = []) {
  if (!Array.isArray(users)) return [];

  return users.map((user, idx) => {
    const name =
      user.employeeName ||
      user.fullName ||
      `${user.firstName || ""} ${user.lastName || ""}`.trim() ||
      user.name ||
      "User";
    const email = user.email || "No email available";

    const roleName = formatRoleDisplayName(user.role);
    const accessLevelNumber = Number(user.adminAccess ?? user.admin_access ?? 7);
    const accessLevel = `${accessLevelNumber} - ${roleName}`;

    let department = "General";
    if (Array.isArray(user.departments) && user.departments.length > 0) {
      department = user.departments
        .map((d) => d.name || d.departmentName || d.department || d)
        .filter(Boolean)
        .join(", ");
    } else if (user.department) {
      department = user.department;
    }

    let accountGroup = "All Accounts";
    if (Array.isArray(user.assignedAccounts) && user.assignedAccounts.length > 0) {
      accountGroup = user.assignedAccounts
        .map((a) => a.name || a.accountName || a.account || a)
        .filter(Boolean)
        .join(", ");
    } else if (user.account) {
      accountGroup = user.account;
    }

    let lastActive = "Active";
    if (user.updatedAt || user.updated_at) {
      const d = new Date(user.updatedAt || user.updated_at);
      if (!Number.isNaN(d.getTime())) {
        lastActive = formatHrisDateLocalized(d, "en-PH", {
          month: "long",
          day: "numeric",
          year: "numeric",
        });
      }
    }

    const rawStatus = user.status || "Active";
    const status =
      rawStatus.charAt(0).toUpperCase() + rawStatus.slice(1).toLowerCase();

    return {
      id: user.sibsId || user.sibs_id || user.id || `ADM-${idx + 1}`,
      name,
      email,
      accessLevel,
      department,
      accountGroup,
      lastActive,
      status,
    };
  });
}



