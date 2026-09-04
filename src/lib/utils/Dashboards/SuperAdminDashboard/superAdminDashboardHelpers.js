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
  accessSettings: "/settings/account-settings",
});

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
  const leaves = Number(metrics?.leavesCount || 0);
  const approvals = Number(metrics?.pendingApprovals || 0);
  const recruitment = Number(metrics?.recruitmentCount || 0);
  const accounts = accountCount || 0;
  const admins = adminCount || Number(metrics?.admins || 0);

  const now = new Date();
  const monthName = now.toLocaleString("en-US", { month: "long" });
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
        ["Pending Leaves", `${leaves} Active`],
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
      path: SUPER_ADMIN_ROUTES.approvals || "/payroll",
      metrics: [
        ["Current Payroll Cycle", payrollCycleText],
        ["Payroll Status", "Active Cycle"],
        ["Approval Requests", `${approvals} Pending Clearance`],
        ["Reports & Audits", "Audit Logs Ready"],
      ],
    },
  ];
}

export function getUserDisplayName(user) {
  const values = [
    user?.gy_emp_lname,
    user?.gy_emp_fname,
    user?.gy_emp_mname,
  ].filter(Boolean);

  if (values.length) {
    return `${values[0] || ""}, ${values.slice(1).join(" ")}`
      .replace(/^,\s*/, "")
      .replace(/\s+/g, " ")
      .trim()
      .toUpperCase();
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
    return "bg-[#042C51] text-white border border-[#042C51]";
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
    return "bg-orange-100 text-[#FF5C28] border border-orange-200";
  }

  return "bg-slate-100 text-slate-700 border border-slate-200";
}

export function getSeverityPillClass(severity) {
  if (severity === "High") {
    return "border-rose-200 bg-rose-50 text-rose-700";
  }

  if (severity === "Medium") {
    return "border-amber-200 bg-amber-50 text-amber-700";
  }

  return "border-blue-200 bg-blue-50 text-blue-700";
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
        item.assignedTo,
        item.category,
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

export function normalizeSuperAdminMetrics(overview = {}, extraData = {}) {
  const employees = Number(
    extraData?.employeeTotal ?? overview?.metrics?.employees ?? 0,
  );
  const departments = Number(
    extraData?.departmentsTotal ?? overview?.metrics?.departments ?? 0,
  );
  const late = Number(overview?.attendance?.late || 0);
  const absent = Number(overview?.attendance?.absent || 0);
  const onLeave = Number(extraData?.leavesTotal ?? overview?.attendance?.onLeave ?? 0);
  const attendanceFlags = late + absent;
  const pendingApprovals = Number(
    extraData?.approvalsTotal ??
      overview?.notificationCounts?.pendingApprovals ??
      overview?.notificationCounts?.approvals ??
      0,
  );
  const recruitmentCount = Number(
    extraData?.recruitmentTotal ?? overview?.metrics?.interviewsToday ?? 0,
  );
  const adminCount = Number(extraData?.adminCount ?? 7);

  return {
    employees: employees > 0 ? employees.toLocaleString() : "0",
    employeesCount: employees,
    departmentsCount: departments,
    admins: String(adminCount),
    attendanceFlags: String(attendanceFlags),
    pendingApprovals: String(pendingApprovals),
    leavesCount: String(onLeave),
    recruitmentCount: String(recruitmentCount),
  };
}

export function buildDynamicSummaryCards(metrics = {}) {
  const empCount = metrics?.employees || "0";
  const deptCount = metrics?.departmentsCount || 0;
  const leavesCount = metrics?.leavesCount || "0";
  const approvalsCount = metrics?.pendingApprovals || "0";
  const recruitmentCount = metrics?.recruitmentCount || "0";

  return [
    {
      label: "Core HR Scope",
      value: `${empCount} Active Staff`,
      details: `${deptCount} Departments • ${leavesCount} Pending Leaves • ${approvalsCount} Approvals`,
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
      details: `${approvalsCount} Cross-Module Approval Requests`,
      linkLabel: "Open Approvals",
      path: SUPER_ADMIN_ROUTES.approvals,
    },
  ];
}

export function deriveLiveExceptions({
  employeeData = null,
  approvalsData = null,
  leavesData = null,
  overviewData = null,
} = {}) {
  const exceptions = [];

  // 1. Unmapped / Incomplete Employees
  const employees = Array.isArray(employeeData?.data) ? employeeData.data : [];
  const unmappedEmployees = employees.filter((emp) => {
    const dept = emp.department || emp.departmentAccount;
    const acct = emp.account || emp.accountGroup;
    return !dept || !acct;
  });

  if (unmappedEmployees.length > 0) {
    exceptions.push({
      id: "EXC-LIVE-UNMAPPED",
      category: "Unmapped User",
      title: `${unmappedEmployees.length} Employee/s Missing Department or Account Mapping`,
      description: "Employee record(s) in the directory require cost center and organizational account assignments.",
      severity: "High",
      moduleTarget: "Employee Directory",
      path: SUPER_ADMIN_ROUTES.employees,
      assignedTo: "HR Operations",
      daysPending: 2,
    });
  }

  // 2. Pending Leaves
  const pendingLeavesCount =
    leavesData?.pagination?.total ??
    (Array.isArray(leavesData?.data)
      ? leavesData.data.filter((lv) => lv.status === "Pending").length
      : 0);

  if (pendingLeavesCount > 0) {
    exceptions.push({
      id: "EXC-LIVE-LEAVES",
      category: "Pending Leave",
      title: `${pendingLeavesCount} Leave Request/s Awaiting Approval`,
      description: "Employee leave requests are currently pending supervisor or management review.",
      severity: pendingLeavesCount > 10 ? "High" : "Medium",
      moduleTarget: "Leaves Management",
      path: "/leaves",
      assignedTo: "HR Admin",
      daysPending: 3,
    });
  }

  // 3. Pending Approvals
  const pendingApprovalsCount =
    approvalsData?.counts?.pending ??
    approvalsData?.total ??
    (Array.isArray(approvalsData?.data) ? approvalsData.data.length : 0);

  if (pendingApprovalsCount > 0) {
    exceptions.push({
      id: "EXC-LIVE-APPROVALS",
      category: "Stuck Approval",
      title: `${pendingApprovalsCount} Workflow Approval Request/s Pending Review`,
      description: "System approval requests for Job Descriptions, Hiring Needs, or Personnel Requisitions require signoff.",
      severity: pendingApprovalsCount > 5 ? "High" : "Medium",
      moduleTarget: "Approval Requests",
      path: SUPER_ADMIN_ROUTES.approvals,
      assignedTo: "Approver Desk",
      daysPending: 4,
    });
  }

  // 4. Resignations
  const resignationCount = Number(overviewData?.resignationCount || 0);
  if (resignationCount > 0) {
    exceptions.push({
      id: "EXC-LIVE-RESIGNATIONS",
      category: "Pending Resignation",
      title: `${resignationCount} Active Resignation Clearance/s in Progress`,
      description: "Resignation records and exit clearance workflows are pending final management signoff.",
      severity: "High",
      moduleTarget: "Resignation Management",
      path: "/resignation",
      assignedTo: "HR Operations",
      daysPending: 5,
    });
  }

  // 5. Attendance Variances
  const attendanceLate = Number(overviewData?.attendance?.late || 0);
  const attendanceAbsent = Number(overviewData?.attendance?.absent || 0);
  const totalAttendanceFlags = attendanceLate + attendanceAbsent;
  if (totalAttendanceFlags > 0) {
    exceptions.push({
      id: "EXC-LIVE-ATTENDANCE",
      category: "Attendance Variance",
      title: `${totalAttendanceFlags} Timecard & Biometric Variances Pending Review`,
      description: `${attendanceLate} late arrivals and ${attendanceAbsent} absences recorded in attendance logs requiring workforce validation.`,
      severity: totalAttendanceFlags > 10 ? "High" : "Medium",
      moduleTarget: "Time & Attendance",
      path: "/attendance",
      assignedTo: "WFM Lead",
      daysPending: 1,
    });
  }

  return exceptions;
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
  if (!rawTimestamp || rawTimestamp === "Recently") {
    const now = new Date();
    const pad = (n) => String(n).padStart(2, "0");
    return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())} ${pad(now.getHours())}:${pad(now.getMinutes())}`;
  }

  const date = new Date(rawTimestamp);
  if (Number.isNaN(date.getTime())) {
    return String(rawTimestamp);
  }

  const pad = (n) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

export function enrichActivityLogs(rawLogs = []) {
  if (!Array.isArray(rawLogs)) return [];

  return rawLogs.map((item, idx) => {
    const action = item.action || item.actionTaken || "SYSTEM_EVENT";
    const details = item.details || item.description || item.detail || "Activity recorded.";
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
        lastActive = d.toLocaleDateString("en-PH", {
          month: "short",
          day: "numeric",
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



