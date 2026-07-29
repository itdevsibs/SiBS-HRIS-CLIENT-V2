export const SUPER_ADMIN_ROUTES = Object.freeze({
  employees: "/employee",
  hrDashboard: "/dashboard/admin",
  taDashboard: "/recruitment/ta-dashboard",
  omDashboard: "/recruitment/om-dashboard",
  approvals: "/approval-request",
  jobDescriptions: "/recruitment/job-description",
  hiringNeeds: "/recruitment/hiring-needs",
  candidatePipeline: "/recruitment/candidate-pipeline",
  reports: "/weekly-reports",
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
]);

export const ACCOUNT_GROUPS = Object.freeze([
  "Verizon Tech",
  "Comcast Support",
  "Aetna Health",
  "Internal HR Ops",
  "Global WFM",
]);

export const ACCESS_HIERARCHY = Object.freeze([
  ["1 - TA", "Recruitment & Sourcing"],
  ["2 - HR", "HR Support & Tickets"],
  ["3 - HR Admin", "Full HR Ops Control"],
  ["4 - Finance", "Payroll & Costing"],
  ["5 - Manager", "Team & Approval Head"],
  ["6 - Executive", "Executive Reporting"],
  ["7 - Super Admin", "Full System Oversight"],
]);

export const INITIAL_ADMIN_USERS = Object.freeze([
  {
    id: "ADM-001",
    name: "Ralph Dulla",
    email: "dulla13ralph@gmail.com",
    accessLevel: "7 - Super Admin",
    department: "Executive Tech",
    accountGroup: "Internal HR Ops",
    lastActive: "Today at 01:05",
    status: "Active",
  },
  {
    id: "ADM-002",
    name: "Alena Batacan",
    email: "alena.batacan@thesiblingssolutions.com",
    accessLevel: "3 - HR Admin",
    department: "People Operations",
    accountGroup: "Verizon Tech",
    lastActive: "Today at 00:45",
    status: "Active",
  },
  {
    id: "ADM-003",
    name: "Marcus Vance",
    email: "marcus.vance@thesiblingssolutions.com",
    accessLevel: "1 - TA",
    department: "Talent Acquisition",
    accountGroup: "Comcast Support",
    lastActive: "Yesterday at 18:20",
    status: "Active",
  },
  {
    id: "ADM-004",
    name: "Samantha Reed",
    email: "s.reed@thesiblingssolutions.com",
    accessLevel: "4 - Finance",
    department: "Finance & Payroll",
    accountGroup: "Aetna Health",
    lastActive: "Yesterday at 16:10",
    status: "Active",
  },
  {
    id: "ADM-005",
    name: "David Chen",
    email: "david.c@thesiblingssolutions.com",
    accessLevel: "6 - Executive",
    department: "Executive Leadership",
    accountGroup: "Internal HR Ops",
    lastActive: "3 days ago",
    status: "Active",
  },
  {
    id: "ADM-006",
    name: "Patricia Miller",
    email: "p.miller@thesiblingssolutions.com",
    accessLevel: "5 - Manager",
    department: "Technical Support",
    accountGroup: "Verizon Tech",
    lastActive: "Today at 00:12",
    status: "Active",
  },
  {
    id: "ADM-007",
    name: "Robert Taylor",
    email: "r.taylor@thesiblingssolutions.com",
    accessLevel: "2 - HR",
    department: "Employee Relations",
    accountGroup: "Global WFM",
    lastActive: "4 days ago",
    status: "Pending Mapping",
  },
]);

export const INITIAL_EXCEPTIONS = Object.freeze([
  {
    id: "EXC-101",
    category: "Unmapped User",
    title: "3 New Hires Missing Department / Account Mapping",
    description:
      "Employee records created in the Comcast account are missing cost center and manager assignments.",
    severity: "High",
    moduleTarget: "Employee Directory",
    path: SUPER_ADMIN_ROUTES.employees,
    assignedTo: "Alena Batacan",
    daysPending: 3,
  },
  {
    id: "EXC-102",
    category: "Pending Resignation",
    title: "Resignation Clearance Nearing Last Working Date",
    description:
      "Senior Agent John Doe resignation is effective in three days. Exit clearance is still pending manager signoff.",
    severity: "High",
    moduleTarget: "Resignation Management",
    path: "/resignation",
    assignedTo: "HR Operations",
    daysPending: 9,
  },
  {
    id: "EXC-103",
    category: "Pending Leave",
    title: "Maternity Leave Request Pending Approval Over Five Days",
    description:
      "A leave request has been waiting for Executive signoff for six days.",
    severity: "Medium",
    moduleTarget: "Leaves Management",
    path: "/leaves",
    assignedTo: "David Chen",
    daysPending: 6,
  },
  {
    id: "EXC-104",
    category: "Attendance Flag",
    title: "14 Timecard Biometric Variances Pending Review",
    description:
      "Night-shift timecards contain missing checkout punches that require Workforce validation.",
    severity: "Medium",
    moduleTarget: "Time & Attendance",
    path: "/attendance",
    assignedTo: "WFM Lead",
    daysPending: 2,
  },
  {
    id: "EXC-105",
    category: "Stuck Approval",
    title: "Job Requisition Awaiting Budget Signoff",
    description:
      "A DevOps Engineer requisition has been pending Finance budget clearance for eight days.",
    severity: "High",
    moduleTarget: "Action Items",
    path: SUPER_ADMIN_ROUTES.approvals,
    assignedTo: "Samantha Reed",
    daysPending: 8,
  },
  {
    id: "EXC-106",
    category: "Recruitment Action",
    title: "2 Candidate Offers Pending Acceptance Over Seven Days",
    description:
      "Offer letters were issued more than seven days ago without a recorded candidate response.",
    severity: "Low",
    moduleTarget: "Offers & Onboarding",
    path: "/recruitment/offers",
    assignedTo: "Marcus Vance",
    daysPending: 7,
  },
]);

export const INITIAL_ACTIVITY_LOGS = Object.freeze([
  {
    id: "LOG-501",
    timestamp: "2026-07-22 00:52",
    actor: "dulla13ralph@gmail.com",
    accessLevel: "7 - Super Admin",
    module: "Access Governance",
    action: "UPDATED_ADMIN_LEVEL",
    details: "Updated Alena Batacan access level to 3 - HR Admin.",
    status: "Success",
  },
  {
    id: "LOG-502",
    timestamp: "2026-07-21 23:14",
    actor: "alena.batacan@thesiblingssolutions.com",
    accessLevel: "3 - HR Admin",
    module: "Employee Directory",
    action: "UPDATED_EMPLOYEE_RECORD",
    details: "Assigned department code TECH-SUPP to 12 new hires.",
    status: "Success",
  },
  {
    id: "LOG-503",
    timestamp: "2026-07-21 21:40",
    actor: "marcus.vance@thesiblingssolutions.com",
    accessLevel: "1 - TA",
    module: "Candidate Pipeline",
    action: "ISSUED_OFFER_LETTER",
    details: "Generated a job offer letter for candidate Jerome Miller.",
    status: "Success",
  },
  {
    id: "LOG-504",
    timestamp: "2026-07-21 19:05",
    actor: "s.reed@thesiblingssolutions.com",
    accessLevel: "4 - Finance",
    module: "Payroll",
    action: "APPROVED_PAYROLL_RUN",
    details: "Approved the bi-monthly payroll summary for Verizon Tech.",
    status: "Success",
  },
  {
    id: "LOG-505",
    timestamp: "2026-07-21 17:30",
    actor: "SYSTEM_VALIDATOR",
    accessLevel: "System",
    module: "Time & Attendance",
    action: "FLAGGED_ATTENDANCE_MISMATCH",
    details: "Identified 14 unverified biometric checkout records.",
    status: "Flagged",
  },
]);

export const SUMMARY_CARDS = Object.freeze([
  {
    label: "Core HR Scope",
    value: "2,840 Active Staff",
    details: "18 Departments • 14 Pending Leaves • 4 Resignations",
    linkLabel: "Open HR Directory",
    path: SUPER_ADMIN_ROUTES.employees,
  },
  {
    label: "Talent Acquisition (TA)",
    value: "142 Candidates",
    details: "18 Requisitions • 85 Talent Pool • 8 Offers Pending",
    linkLabel: "Open TA Pipeline",
    path: SUPER_ADMIN_ROUTES.taDashboard,
  },
  {
    label: "Operations Management (OM)",
    value: "5 Client Accounts",
    details: "12 Hiring Needs • 4 Recruiters • 84% Shift Capacity",
    linkLabel: "Open OM Dashboard",
    path: SUPER_ADMIN_ROUTES.omDashboard,
  },
  {
    label: "Finance & Payroll",
    value: "2 Payroll Cycles",
    details: "Approved for July 2026 • 3 Pending Budget Requests",
    linkLabel: "Open Payroll Module",
    path: "/payroll",
  },
]);

export const SNAPSHOT_CARDS = Object.freeze([
  {
    title: "Core HR & Employee Operations",
    iconKey: "employees",
    path: SUPER_ADMIN_ROUTES.employees,
    metrics: [
      ["Master Headcount", "2,840 Staff"],
      ["Active Departments", "18 Depts"],
      ["Pending Leaves", "14 Active"],
      ["Resignation Queue", "4 Staff"],
    ],
  },
  {
    title: "Talent Acquisition & Sourcing",
    iconKey: "recruitment",
    path: SUPER_ADMIN_ROUTES.taDashboard,
    metrics: [
      ["Candidate Pipeline", "142 Candidates"],
      ["Open Requisitions", "18 Positions"],
      ["Offers Outstanding", "8 Issued"],
      ["Active Onboarding", "15 In Progress"],
    ],
  },
  {
    title: "Operations Management (OM)",
    iconKey: "operations",
    path: SUPER_ADMIN_ROUTES.omDashboard,
    metrics: [
      ["Account Groups", "5 Client Accounts"],
      ["Hiring Needs", "12 Requests"],
      ["Recruiter Load", "4 Active TA Leads"],
      ["Operation Capacity", "84% Staffed"],
    ],
  },
  {
    title: "Finance & Payroll Summary",
    iconKey: "finance",
    path: "/payroll",
    metrics: [
      ["Current Payroll Cycle", "July 16 - 31, 2026"],
      ["Payroll Status", "Approved"],
      ["Budget Requests", "3 Pending Clearance"],
      ["Reports & Audits", "Monthly Summary Ready"],
    ],
  },
]);

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
  if (status === "Active" || status === "Success") {
    return "border-emerald-200 bg-emerald-50 text-emerald-700";
  }

  if (status === "Locked" || status === "Flagged") {
    return "border-rose-200 bg-rose-50 text-rose-700";
  }

  return "border-amber-200 bg-amber-50 text-amber-700";
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

export function getAccessLevelClass(accessLevel) {
  if (String(accessLevel || "").startsWith("7")) {
    return "bg-[#042C51] text-white";
  }

  if (String(accessLevel || "").startsWith("3")) {
    return "bg-blue-100 text-blue-800";
  }

  return "bg-slate-100 text-slate-700";
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
      moduleFilter === "All Modules" || item.moduleTarget === moduleFilter;

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
      accessLevelFilter === "All Access Levels" ||
      item.accessLevel === accessLevelFilter;
    const matchesAccount =
      accountFilter === "All Accounts" || item.accountGroup === accountFilter;
    const matchesStatus =
      statusFilter === "All Statuses" || item.status === statusFilter;

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
      moduleFilter === "All Modules" || item.module === moduleFilter;
    const matchesStatus =
      statusFilter === "All Statuses" || item.status === statusFilter;

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
