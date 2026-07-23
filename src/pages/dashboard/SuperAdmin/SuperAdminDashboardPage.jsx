import React, { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Activity,
  AlertTriangle,
  ArrowRight,
  Briefcase,
  Building2,
  CheckCircle2,
  CheckSquare,
  ChevronRight,
  Clock,
  DollarSign,
  Download,
  FileText,
  Layers,
  Lock,
  PieChart,
  Plus,
  RefreshCw,
  Search,
  Settings,
  ShieldCheck,
  SlidersHorizontal,
  UserPlus,
  Users,
  UserX,
  X,
} from "lucide-react";

import Header from "../../../components/layout/Header";
import { useUser } from "../../../services/context/UserContext";

const ROUTES = Object.freeze({
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

const ACCESS_LEVELS = [
  "1 - TA",
  "2 - HR",
  "3 - HR Admin",
  "4 - Finance",
  "5 - Manager",
  "6 - Executive",
  "7 - Super Admin",
];

const ACCOUNT_GROUPS = [
  "Verizon Tech",
  "Comcast Support",
  "Aetna Health",
  "Internal HR Ops",
  "Global WFM",
];

const INITIAL_ADMIN_USERS = [
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
];

const INITIAL_EXCEPTIONS = [
  {
    id: "EXC-101",
    category: "Unmapped User",
    title: "3 New Hires Missing Department / Account Mapping",
    description:
      "Employee records created in the Comcast account are missing cost center and manager assignments.",
    severity: "High",
    moduleTarget: "Employee Directory",
    path: ROUTES.employees,
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
    path: ROUTES.approvals,
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
];

const INITIAL_ACTIVITY_LOGS = [
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
];

const SUMMARY_CARDS = [
  {
    label: "Core HR Scope",
    value: "2,840 Active Staff",
    details: "18 Departments • 14 Pending Leaves • 4 Resignations",
    linkLabel: "Open HR Directory",
    path: ROUTES.employees,
  },
  {
    label: "Talent Acquisition (TA)",
    value: "142 Candidates",
    details: "18 Requisitions • 85 Talent Pool • 8 Offers Pending",
    linkLabel: "Open TA Pipeline",
    path: ROUTES.taDashboard,
  },
  {
    label: "Operations Management (OM)",
    value: "5 Client Accounts",
    details: "12 Hiring Needs • 4 Recruiters • 84% Shift Capacity",
    linkLabel: "Open OM Dashboard",
    path: ROUTES.omDashboard,
  },
  {
    label: "Finance & Payroll",
    value: "2 Payroll Cycles",
    details: "Approved for July 2026 • 3 Pending Budget Requests",
    linkLabel: "Open Payroll Module",
    path: "/payroll",
  },
];

function getUserDisplayName(user) {
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

function StatusPill({ status }) {
  const className =
    status === "Active"
      ? "border-emerald-200 bg-emerald-50 text-emerald-700"
      : status === "Locked"
        ? "border-red-200 bg-red-50 text-red-700"
        : "border-amber-200 bg-amber-50 text-amber-700";

  return (
    <span
      className={`inline-flex whitespace-nowrap rounded-full border px-2.5 py-1 text-[10px] font-extrabold ${className}`}
    >
      {status}
    </span>
  );
}

function SeverityPill({ severity }) {
  const className =
    severity === "High"
      ? "bg-red-100 text-red-800"
      : severity === "Medium"
        ? "bg-amber-100 text-amber-800"
        : "bg-blue-100 text-blue-800";

  return (
    <span
      className={`rounded-full px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-wide ${className}`}
    >
      {severity} Severity
    </span>
  );
}

function getAnimationStyle(delay = 0) {
  return {
    animationDelay: `${delay}ms`,
    animationFillMode: "both",
  };
}

function MetricCard({ label, value, accent, note, description, icon, delay = 0 }) {
  return (
    <article
      className="sibs-page-card-in rounded-2xl border border-[#E6ECF2] bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:border-[#042C51]/20 hover:shadow-md"
      style={getAnimationStyle(delay)}
    >
      <div className="flex items-start justify-between gap-3">
        <span className="text-[10px] font-extrabold uppercase tracking-wide text-[#667085]">
          {label}
        </span>
        <span
          className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${accent}`}
        >
          {React.createElement(icon, { size: 17, strokeWidth: 2 })}
        </span>
      </div>
      <div className="mt-3 flex items-end justify-between gap-3">
        <strong className="text-3xl font-extrabold leading-none tabular-nums tracking-tight text-[#042C51]">
          {value}
        </strong>
        {note && (
          <span className="text-right text-[10px] font-extrabold text-[#FF5C28]">
            {note}
          </span>
        )}
      </div>
      <p className="mt-2 text-xs font-semibold leading-relaxed text-[#667085]">
        {description}
      </p>
    </article>
  );
}

function QuickAction({ icon, title, description, onClick, delay = 0 }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="sibs-page-card-in group flex min-h-[102px] flex-col items-start justify-between rounded-xl border border-[#E6ECF2] bg-[#F8FAFC] p-3 text-left transition hover:-translate-y-0.5 hover:border-[#FF5C28]/40 hover:bg-[#FFF7F3] hover:shadow-sm"
      style={getAnimationStyle(delay)}
    >
      <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#042C51] text-white transition group-hover:bg-[#FF5C28]">
        {React.createElement(icon, { size: 15 })}
      </span>
      <span className="mt-3">
        <span className="block text-xs font-extrabold text-[#042C51]">
          {title}
        </span>
        <span className="mt-1 block text-[10px] font-semibold leading-4 text-[#98A2B3]">
          {description}
        </span>
      </span>
    </button>
  );
}

function FilterSelect({ label, value, options, onChange }) {
  return (
    <label className="min-w-0">
      <span className="mb-1.5 block text-[10px] font-extrabold uppercase tracking-wide text-[#667085]">
        {label}
      </span>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="h-11 w-full rounded-xl border border-[#D6DEE8] bg-[#F8FAFC] px-3 text-xs font-extrabold text-[#042C51] outline-none transition focus:border-[#FF5C28] focus:ring-4 focus:ring-[#FF5C28]/10"
      >
        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
    </label>
  );
}

function AddAdminModal({ open, onClose, onSave }) {
  const [form, setForm] = useState({
    name: "",
    email: "",
    accessLevel: "3 - HR Admin",
    department: "Human Resources",
    accountGroup: "Internal HR Ops",
  });

  if (!open) return null;

  function updateField(key, value) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  function handleSubmit(event) {
    event.preventDefault();
    if (!form.name.trim() || !form.email.trim()) return;

    onSave({
      id: `ADM-${String(Date.now()).slice(-6)}`,
      name: form.name.trim(),
      email: form.email.trim(),
      accessLevel: form.accessLevel,
      department: form.department.trim() || "Human Resources",
      accountGroup: form.accountGroup,
      lastActive: "Just created",
      status: "Active",
    });

    setForm({
      name: "",
      email: "",
      accessLevel: "3 - HR Admin",
      department: "Human Resources",
      accountGroup: "Internal HR Ops",
    });
  }

  return (
    <div
      className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/50 p-4 backdrop-blur-[1px]"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div className="max-h-[92dvh] w-full max-w-md overflow-y-auto rounded-2xl border border-[#E6ECF2] bg-white p-6 shadow-2xl">
        <div className="flex items-center justify-between border-b border-[#EEF2F6] pb-3">
          <div className="flex items-center gap-2">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#042C51] text-white">
              <UserPlus size={17} className="text-[#FF5C28]" />
            </span>
            <div>
              <h3 className="sibs-section-title">
                Add Admin User
              </h3>
              <p className="sibs-section-subtitle">
                Frontend account setup preview
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-2 text-[#98A2B3] transition hover:bg-[#F8FAFC] hover:text-[#042C51]"
            aria-label="Close add admin modal"
          >
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-4 space-y-3">
          <label className="block">
            <span className="mb-1 block text-[10px] font-extrabold uppercase tracking-wide text-[#667085]">
              Full Name
            </span>
            <input
              required
              value={form.name}
              onChange={(event) => updateField("name", event.target.value)}
              placeholder="e.g. Maria Santos"
              className="h-11 w-full rounded-xl border border-[#D6DEE8] bg-[#F8FAFC] px-3 text-xs font-semibold text-[#042C51] outline-none focus:border-[#FF5C28] focus:ring-4 focus:ring-[#FF5C28]/10"
            />
          </label>

          <label className="block">
            <span className="mb-1 block text-[10px] font-extrabold uppercase tracking-wide text-[#667085]">
              Work Email
            </span>
            <input
              required
              type="email"
              value={form.email}
              onChange={(event) => updateField("email", event.target.value)}
              placeholder="name@thesiblingssolutions.com"
              className="h-11 w-full rounded-xl border border-[#D6DEE8] bg-[#F8FAFC] px-3 text-xs font-semibold text-[#042C51] outline-none focus:border-[#FF5C28] focus:ring-4 focus:ring-[#FF5C28]/10"
            />
          </label>

          <FilterSelect
            label="Grounded Access Level (1-7)"
            value={form.accessLevel}
            options={ACCESS_LEVELS}
            onChange={(value) => updateField("accessLevel", value)}
          />

          <label className="block">
            <span className="mb-1 block text-[10px] font-extrabold uppercase tracking-wide text-[#667085]">
              Department
            </span>
            <input
              value={form.department}
              onChange={(event) =>
                updateField("department", event.target.value)
              }
              className="h-11 w-full rounded-xl border border-[#D6DEE8] bg-[#F8FAFC] px-3 text-xs font-semibold text-[#042C51] outline-none focus:border-[#FF5C28] focus:ring-4 focus:ring-[#FF5C28]/10"
            />
          </label>

          <FilterSelect
            label="Account Group"
            value={form.accountGroup}
            options={ACCOUNT_GROUPS}
            onChange={(value) => updateField("accountGroup", value)}
          />

          <div className="flex justify-end gap-2 border-t border-[#EEF2F6] pt-4">
            <button
              type="button"
              onClick={onClose}
              className="h-10 rounded-xl border border-[#D6DEE8] bg-white px-4 text-xs font-extrabold text-[#042C51] hover:bg-[#F8FAFC]"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="h-10 rounded-xl bg-[#042C51] px-4 text-xs font-extrabold text-white transition hover:bg-[#FF5C28]"
            >
              Save Admin Account
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function SuperAdminDashboardPage() {
  const navigate = useNavigate();
  const { user } = useUser();

  const [activeTab, setActiveTab] = useState("overview");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedAccessLevel, setSelectedAccessLevel] = useState(
    "All Access Levels",
  );
  const [selectedModule, setSelectedModule] = useState("All Modules");
  const [selectedAccount, setSelectedAccount] = useState("All Accounts");
  const [selectedStatus, setSelectedStatus] = useState("All Statuses");
  const [isAddAdminOpen, setIsAddAdminOpen] = useState(false);
  const [adminUsers, setAdminUsers] = useState(INITIAL_ADMIN_USERS);
  const [exceptions, setExceptions] = useState(INITIAL_EXCEPTIONS);
  const [activityLogs, setActivityLogs] = useState(INITIAL_ACTIVITY_LOGS);
  const [notice, setNotice] = useState("");

  const normalizedSearch = searchTerm.trim().toLowerCase();

  const filteredExceptions = useMemo(
    () =>
      exceptions.filter((item) => {
        const matchesSearch =
          !normalizedSearch ||
          [
            item.title,
            item.description,
            item.assignedTo,
            item.category,
            item.moduleTarget,
          ].some((value) =>
            String(value || "").toLowerCase().includes(normalizedSearch),
          );

        const matchesModule =
          selectedModule === "All Modules" ||
          item.moduleTarget === selectedModule;

        return matchesSearch && matchesModule;
      }),
    [exceptions, normalizedSearch, selectedModule],
  );

  const filteredAdmins = useMemo(
    () =>
      adminUsers.filter((item) => {
        const matchesSearch =
          !normalizedSearch ||
          [item.name, item.email, item.department, item.accountGroup].some(
            (value) =>
              String(value || "").toLowerCase().includes(normalizedSearch),
          );
        const matchesAccess =
          selectedAccessLevel === "All Access Levels" ||
          item.accessLevel === selectedAccessLevel;
        const matchesAccount =
          selectedAccount === "All Accounts" ||
          item.accountGroup === selectedAccount;
        const matchesStatus =
          selectedStatus === "All Statuses" || item.status === selectedStatus;

        return (
          matchesSearch && matchesAccess && matchesAccount && matchesStatus
        );
      }),
    [
      adminUsers,
      normalizedSearch,
      selectedAccessLevel,
      selectedAccount,
      selectedStatus,
    ],
  );

  const filteredLogs = useMemo(
    () =>
      activityLogs.filter((item) => {
        const matchesSearch =
          !normalizedSearch ||
          [item.actor, item.action, item.details, item.module].some((value) =>
            String(value || "").toLowerCase().includes(normalizedSearch),
          );
        const matchesModule =
          selectedModule === "All Modules" || item.module === selectedModule;
        const matchesStatus =
          selectedStatus === "All Statuses" || item.status === selectedStatus;

        return matchesSearch && matchesModule && matchesStatus;
      }),
    [activityLogs, normalizedSearch, selectedModule, selectedStatus],
  );

  function resetFilters() {
    setSearchTerm("");
    setSelectedAccessLevel("All Access Levels");
    setSelectedModule("All Modules");
    setSelectedAccount("All Accounts");
    setSelectedStatus("All Statuses");
  }

  function addAdmin(newAdmin) {
    setAdminUsers((current) => [newAdmin, ...current]);
    setActivityLogs((current) => [
      {
        id: `LOG-${String(Date.now()).slice(-6)}`,
        timestamp: new Date().toLocaleString("en-PH"),
        actor: user?.email || "Super Admin",
        accessLevel: "7 - Super Admin",
        module: "Access Governance",
        action: "CREATED_ADMIN_USER",
        details: `Created ${newAdmin.accessLevel} access for ${newAdmin.email}.`,
        status: "Success",
      },
      ...current,
    ]);
    setIsAddAdminOpen(false);
    setNotice(`Added administrator account for ${newAdmin.email}.`);
  }

  function resolveException(id) {
    const target = exceptions.find((item) => item.id === id);
    setExceptions((current) => current.filter((item) => item.id !== id));
    setNotice(`Resolved exception: ${target?.title || id}.`);
  }

  const tabs = [
    {
      id: "overview",
      label: "Overview & Telemetry",
      icon: Activity,
    },
    {
      id: "exceptions",
      label: `Risk & Exceptions Desk (${exceptions.length})`,
      icon: AlertTriangle,
    },
    {
      id: "access_roles",
      label: `Access & Roles Governance (${adminUsers.length})`,
      icon: ShieldCheck,
    },
    {
      id: "snapshot",
      label: "Cross-Module Snapshot",
      icon: Layers,
    },
    {
      id: "activity",
      label: "System & Module Activity",
      icon: FileText,
    },
  ];

  return (
    <div className="sibs-dashboard-shell">
      <Header />

      <main className="sibs-dashboard-main-wide bg-[#DCE4ED]">
        <div className="mx-auto w-full max-w-[1900px] space-y-5 pb-10">
          {notice && (
            <div className="fixed right-5 top-20 z-[9999] flex max-w-sm items-center gap-3 rounded-xl border border-blue-400 bg-[#042C51] px-4 py-3 text-xs font-extrabold text-white shadow-2xl">
              <ShieldCheck size={16} className="shrink-0 text-[#FF5C28]" />
              <span className="min-w-0 flex-1">{notice}</span>
              <button
                type="button"
                onClick={() => setNotice("")}
                aria-label="Close notification"
              >
                <X size={15} />
              </button>
            </div>
          )}

          <section className="sibs-page-header-in overflow-hidden rounded-2xl border border-[#D9E2EC] bg-white shadow-sm">
            <div className="h-1 bg-[#042C51]" />
            <div className="flex flex-col gap-5 p-5 sm:p-6 xl:flex-row xl:items-center xl:justify-between">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="inline-flex items-center gap-2 rounded border border-blue-100 bg-[#E9F0FC] px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-wide text-[#042C51]">
                    <ShieldCheck size={14} className="text-[#FF5C28]" />
                    Super Admin Operations Dashboard
                  </span>
                  <span className="inline-flex items-center gap-2 rounded-full bg-emerald-100 px-3 py-1 text-[10px] font-extrabold text-emerald-800">
                    <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-500" />
                    System Governance Online
                  </span>
                </div>

                <h1 className="mt-3 break-words text-xl font-extrabold tracking-tight text-[#042C51] sm:text-2xl">
                  Whole-System HRIS Operations & Governance
                </h1>
                <p className="mt-1 max-w-4xl text-xs font-semibold leading-relaxed text-[#667085] sm:text-sm">
                  Cross-module visibility, user access role governance, risk
                  exception monitoring, approval queue routing, and operational
                  snapshots across HR, TA, OM, and Finance modules.
                </p>
                <p className="mt-2 text-[10px] font-extrabold uppercase tracking-wide text-[#98A2B3]">
                  Signed in as {getUserDisplayName(user)}
                </p>
              </div>

              <div className="flex flex-wrap gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsAddAdminOpen(true)}
                  className="inline-flex h-10 items-center gap-2 rounded-xl bg-[#042C51] px-4 text-xs font-extrabold text-white shadow-sm transition hover:-translate-y-0.5 hover:bg-[#063866] hover:shadow-md"
                >
                  <UserPlus size={15} className="text-[#FF5C28]" />
                  Add Admin / User
                </button>
                <button
                  type="button"
                  onClick={() => navigate(ROUTES.employees)}
                  className="inline-flex h-10 items-center gap-2 rounded-xl bg-[#FF5C28] px-4 text-xs font-extrabold text-white shadow-sm transition hover:-translate-y-0.5 hover:bg-[#E95324] hover:shadow-md"
                >
                  <Users size={15} />
                  Employee Directory
                </button>
              </div>
            </div>
          </section>

          <section className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-6">
            <MetricCard
              label="Total Employees"
              value="2,840"
              note="+12% MoM"
              description="Across 18 Active Depts"
              icon={Users}
              accent="bg-blue-50 text-[#042C51]"
              delay={55}
            />
            <MetricCard
              label="Active Admin Users"
              value={adminUsers.length}
              note="7 Access Tiers"
              description="TA, HR, Finance & Execs"
              icon={ShieldCheck}
              accent="bg-emerald-50 text-emerald-700"
              delay={110}
            />
            <MetricCard
              label="Pending Approvals"
              value="18"
              note="Cross-Module"
              description="Leaves, Offers & Reqs"
              icon={Clock}
              accent="bg-amber-50 text-amber-700"
              delay={165}
            />
            <MetricCard
              label="Attendance Flags"
              value="14"
              note="Needs Review"
              description="Biometric timecard check"
              icon={AlertTriangle}
              accent="bg-orange-50 text-[#FF5C28]"
              delay={220}
            />
            <MetricCard
              label="Leaves & Resignations"
              value="18"
              note="14 Leave • 4 Resig"
              description="Active clearance pipelines"
              icon={UserX}
              accent="bg-red-50 text-red-600"
              delay={275}
            />
            <MetricCard
              label="Recruitment Funnel"
              value="142"
              note="8 Offers Pending"
              description="18 Open Requisitions"
              icon={Briefcase}
              accent="bg-indigo-50 text-indigo-700"
              delay={330}
            />
          </section>

          <section className="sibs-page-card-in rounded-2xl border border-[#E6ECF2] bg-white p-4 shadow-sm" style={getAnimationStyle(385)}>
            <div className="flex items-center justify-between border-b border-[#EEF2F6] pb-3">
              <h2 className="sibs-section-title flex items-center gap-2">
                <SlidersHorizontal size={16} className="text-[#FF5C28]" />
                Super Admin Operations Quick Actions
              </h2>
              <span className="hidden text-[10px] font-bold text-[#98A2B3] sm:block">
                Direct Governance Links
              </span>
            </div>

            <div className="mt-4 grid grid-cols-2 gap-2.5 sm:grid-cols-3 xl:grid-cols-6">
              <QuickAction
                icon={UserPlus}
                title="Add Employee"
                description="New hire profile entry"
                onClick={() => navigate(ROUTES.employees)}
                delay={440}
              />
              <QuickAction
                icon={ShieldCheck}
                title="Add Admin / User"
                description="Set 7 access tiers"
                onClick={() => setIsAddAdminOpen(true)}
                delay={495}
              />
              <QuickAction
                icon={Lock}
                title="Manage Access"
                description="Review role permissions"
                onClick={() => setActiveTab("access_roles")}
                delay={550}
              />
              <QuickAction
                icon={CheckSquare}
                title="Open Approvals"
                description="18 pending requests"
                onClick={() => navigate(ROUTES.approvals)}
                delay={605}
              />
              <QuickAction
                icon={Settings}
                title="Recruitment Setup"
                description="Job reqs & available roles"
                onClick={() => navigate(ROUTES.jobDescriptions)}
                delay={660}
              />
              <QuickAction
                icon={PieChart}
                title="View Reports"
                description="Cross-module analytics"
                onClick={() => navigate(ROUTES.reports)}
                delay={715}
              />
            </div>
          </section>

          <section className="sibs-page-card-in rounded-2xl border border-[#E6ECF2] bg-white p-4 shadow-sm sm:p-5" style={getAnimationStyle(770)}>
            <div className="flex items-center justify-between border-b border-[#EEF2F6] pb-3">
              <h2 className="sibs-section-title flex items-center gap-2">
                <SlidersHorizontal size={16} className="text-[#FF5C28]" />
                Filter Super Admin Operations, Roles & Exceptions
              </h2>
              <button
                type="button"
                onClick={resetFilters}
                className="inline-flex items-center gap-1.5 text-[10px] font-extrabold text-[#FF5C28] hover:underline"
              >
                <RefreshCw size={13} />
                Reset All Filters
              </button>
            </div>

            <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-[1.2fr_repeat(4,minmax(0,1fr))]">
              <label className="min-w-0">
                <span className="mb-1.5 block text-[10px] font-extrabold uppercase tracking-wide text-[#667085]">
                  Search Command Center
                </span>
                <span className="relative block">
                  <Search
                    size={16}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-[#98A2B3]"
                  />
                  <input
                    value={searchTerm}
                    onChange={(event) => setSearchTerm(event.target.value)}
                    placeholder="Search employees, admin users, exceptions..."
                    className="h-11 w-full rounded-xl border border-[#D6DEE8] bg-[#F8FAFC] pl-10 pr-3 text-xs font-semibold text-[#042C51] outline-none transition placeholder:text-[#98A2B3] focus:border-[#FF5C28] focus:ring-4 focus:ring-[#FF5C28]/10"
                  />
                </span>
              </label>

              <FilterSelect
                label="Access Level (1-7)"
                value={selectedAccessLevel}
                options={["All Access Levels", ...ACCESS_LEVELS]}
                onChange={setSelectedAccessLevel}
              />
              <FilterSelect
                label="Target Module"
                value={selectedModule}
                options={[
                  "All Modules",
                  "Employee Directory",
                  "Resignation Management",
                  "Leaves Management",
                  "Time & Attendance",
                  "Action Items",
                  "Offers & Onboarding",
                  "Candidate Pipeline",
                  "Payroll",
                ]}
                onChange={setSelectedModule}
              />
              <FilterSelect
                label="Account Group"
                value={selectedAccount}
                options={["All Accounts", ...ACCOUNT_GROUPS]}
                onChange={setSelectedAccount}
              />
              <FilterSelect
                label="Status Filter"
                value={selectedStatus}
                options={[
                  "All Statuses",
                  "Active",
                  "Pending Mapping",
                  "Locked",
                  "Success",
                  "Flagged",
                ]}
                onChange={setSelectedStatus}
              />
            </div>
          </section>

          <section className="sibs-page-card-in overflow-hidden rounded-2xl border border-[#D9E2EC] bg-white shadow-sm" style={getAnimationStyle(825)}>
            <div
              role="tablist"
              className="flex overflow-x-auto border-b border-[#E6ECF2] bg-[#F8FAFC] px-3 pt-3 no-scrollbar sm:px-4"
            >
              {tabs.map(({ id, label, icon }) => {
                const active = activeTab === id;
                return (
                  <button
                    key={id}
                    type="button"
                    role="tab"
                    aria-selected={active}
                    onClick={() => setActiveTab(id)}
                    className={`inline-flex shrink-0 items-center gap-2 border-b-2 px-4 py-3 text-xs font-extrabold uppercase tracking-wide transition sm:px-5 ${
                      active
                        ? "rounded-t-xl border-[#FF5C28] bg-white text-[#042C51]"
                        : "border-transparent text-[#667085] hover:text-[#042C51]"
                    }`}
                  >
                    {React.createElement(icon, {
                      size: 15,
                      className: "text-[#FF5C28]",
                    })}
                    {label}
                  </button>
                );
              })}
            </div>

            <div
              key={activeTab}
              role="tabpanel"
              className="sibs-page-card-in min-w-0 p-4 sm:p-5 lg:p-6"
              style={getAnimationStyle(0)}
            >
              {activeTab === "overview" && (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
                    {SUMMARY_CARDS.map((card, index) => (
                      <article
                        key={card.label}
                        className="sibs-page-card-in rounded-xl border border-[#E6ECF2] bg-[#FAFBFC] p-4"
                        style={getAnimationStyle(index * 55)}
                      >
                        <span className="text-[10px] font-extrabold uppercase tracking-wide text-[#98A2B3]">
                          {card.label}
                        </span>
                        <h3 className="mt-2 text-base font-extrabold text-[#042C51]">
                          {card.value}
                        </h3>
                        <p className="mt-1 text-xs font-semibold leading-relaxed text-[#667085]">
                          {card.details}
                        </p>
                        <button
                          type="button"
                          onClick={() => navigate(card.path)}
                          className="mt-3 inline-flex items-center gap-1 text-xs font-extrabold text-[#FF5C28] hover:underline"
                        >
                          {card.linkLabel}
                          <ChevronRight size={14} />
                        </button>
                      </article>
                    ))}
                  </div>

                  <section className="sibs-page-card-in rounded-2xl bg-[#042C51] p-5 text-white shadow-sm" style={getAnimationStyle(240)}>
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <AlertTriangle size={17} className="text-[#FF5C28]" />
                          <h3 className="text-sm font-extrabold uppercase tracking-wide">
                            Super Admin Operational Focus Items
                          </h3>
                          <span className="rounded-full bg-white/10 px-2.5 py-1 text-[10px] font-bold">
                            {exceptions.length} Active Desk Exceptions
                          </span>
                        </div>
                        <p className="mt-3 max-w-5xl text-xs font-semibold leading-relaxed text-slate-200">
                          There are currently {exceptions.length} items flagged
                          in the Risk & Exceptions Desk requiring Super Admin or
                          HR Director review, including unmapped hires and a job
                          requisition awaiting budget signoff.
                        </p>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <button
                          type="button"
                          onClick={() => setActiveTab("exceptions")}
                          className="inline-flex h-10 items-center gap-2 rounded-xl bg-[#FF5C28] px-4 text-xs font-extrabold text-white hover:bg-[#E95324]"
                        >
                          View Risk Desk
                          <ArrowRight size={14} />
                        </button>
                        <button
                          type="button"
                          onClick={() => navigate(ROUTES.approvals)}
                          className="h-10 rounded-xl bg-white/10 px-4 text-xs font-extrabold text-white hover:bg-white/20"
                        >
                          Review Approval Queue
                        </button>
                      </div>
                    </div>
                  </section>
                </div>
              )}

              {activeTab === "exceptions" && (
                <div className="space-y-4">
                  <div>
                    <h2 className="sibs-section-title">
                      Risk & Exception Escalation Desk ({filteredExceptions.length})
                    </h2>
                    <p className="sibs-section-subtitle">
                      System-wide exceptions for user mapping, resignations,
                      leaves, attendance, hiring, and approval workflows.
                    </p>
                  </div>

                  {filteredExceptions.length > 0 ? (
                    <div className="space-y-3">
                      {filteredExceptions.map((item, index) => (
                        <article
                          key={item.id}
                          className="sibs-page-card-in rounded-xl border border-[#E6ECF2] bg-white p-4 transition hover:border-[#FF5C28]/40"
                          style={getAnimationStyle(index * 55)}
                        >
                          <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                            <div className="min-w-0">
                              <div className="flex flex-wrap items-center gap-2">
                                <SeverityPill severity={item.severity} />
                                <span className="text-xs font-extrabold text-[#042C51]">
                                  {item.title}
                                </span>
                              </div>
                              <p className="mt-2 text-xs font-semibold leading-relaxed text-[#667085]">
                                {item.description}
                              </p>
                            </div>
                            <div className="shrink-0 text-[10px] font-semibold text-[#667085]">
                              Target: <strong>{item.moduleTarget}</strong> • Pending:{" "}
                              <strong className="text-amber-700">
                                {item.daysPending} days
                              </strong>
                            </div>
                          </div>

                          <div className="mt-4 flex flex-col gap-3 border-t border-[#EEF2F6] pt-3 sm:flex-row sm:items-center sm:justify-between">
                            <span className="text-[10px] font-semibold text-[#667085]">
                              Assigned:{" "}
                              <strong className="text-[#042C51]">
                                {item.assignedTo}
                              </strong>
                            </span>
                            <div className="flex gap-2">
                              <button
                                type="button"
                                onClick={() => navigate(item.path)}
                                className="h-8 rounded-lg bg-[#F2F6FA] px-3 text-[10px] font-extrabold text-[#042C51] hover:bg-[#E6ECF2]"
                              >
                                Open Module
                              </button>
                              <button
                                type="button"
                                onClick={() => resolveException(item.id)}
                                className="h-8 rounded-lg bg-emerald-600 px-3 text-[10px] font-extrabold text-white hover:bg-emerald-700"
                              >
                                Mark Resolved
                              </button>
                            </div>
                          </div>
                        </article>
                      ))}
                    </div>
                  ) : (
                    <div className="sibs-page-card-in rounded-xl border border-dashed border-[#D6DEE8] bg-[#F8FAFC] p-10 text-center">
                      <CheckCircle2 className="mx-auto text-emerald-500" />
                      <p className="mt-3 text-sm font-extrabold text-[#042C51]">
                        No Risk Exceptions Found
                      </p>
                      <p className="mt-1 text-xs font-semibold text-[#98A2B3]">
                        No records match the active search and module filters.
                      </p>
                    </div>
                  )}
                </div>
              )}

              {activeTab === "access_roles" && (
                <div className="space-y-6">
                  <section className="sibs-page-card-in rounded-xl border border-[#E6ECF2] bg-[#F8FAFC] p-4">
                    <h2 className="sibs-section-title flex items-center gap-2">
                      <Lock size={15} className="text-[#FF5C28]" />
                      Grounded 7 Admin Access Levels Hierarchy
                    </h2>
                    <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4 xl:grid-cols-7">
                      {[
                        ["1 - TA", "Recruitment & Sourcing"],
                        ["2 - HR", "HR Support & Tickets"],
                        ["3 - HR Admin", "Full HR Ops Control"],
                        ["4 - Finance", "Payroll & Costing"],
                        ["5 - Manager", "Team & Approval Head"],
                        ["6 - Executive", "Executive Reporting"],
                        ["7 - Super Admin", "Full System Oversight"],
                      ].map(([level, description]) => {
                        const superAdmin = level === "7 - Super Admin";
                        return (
                          <div
                            key={level}
                            className={`sibs-page-card-in rounded-lg border p-2 text-center ${
                              superAdmin
                                ? "border-[#042C51] bg-[#042C51] text-white"
                                : "border-[#E6ECF2] bg-white text-[#042C51]"
                            }`}
                            style={getAnimationStyle(55)}
                          >
                            <span
                              className={`block text-[10px] font-extrabold ${
                                superAdmin ? "text-[#FF5C28]" : ""
                              }`}
                            >
                              {level}
                            </span>
                            <span
                              className={`mt-1 block text-[9px] font-semibold leading-4 ${
                                superAdmin ? "text-slate-200" : "text-[#667085]"
                              }`}
                            >
                              {description}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </section>

                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <h2 className="sibs-section-title">
                      Admin Users & Access Levels ({filteredAdmins.length})
                    </h2>
                    <button
                      type="button"
                      onClick={() => setIsAddAdminOpen(true)}
                      className="inline-flex h-9 items-center justify-center gap-2 rounded-lg bg-[#042C51] px-3 text-xs font-extrabold text-white hover:bg-[#FF5C28]"
                    >
                      <Plus size={14} />
                      New Admin Account
                    </button>
                  </div>

                  <div className="sibs-page-card-in overflow-x-auto rounded-xl border border-[#E6ECF2]" style={getAnimationStyle(110)}>
                    <table className="w-full min-w-[1050px] text-left text-xs">
                      <thead>
                        <tr className="border-b border-[#E6ECF2] bg-[#F8FAFC] text-[10px] font-extrabold uppercase tracking-wide text-[#667085]">
                          <th className="px-4 py-3">User Name & Email</th>
                          <th className="px-4 py-3">Access Level</th>
                          <th className="px-4 py-3">Department</th>
                          <th className="px-4 py-3">Account Group</th>
                          <th className="px-4 py-3">Last Active</th>
                          <th className="px-4 py-3">Status</th>
                          <th className="px-4 py-3 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#EEF2F6]">
                        {filteredAdmins.map((item) => (
                          <tr key={item.id} className="hover:bg-[#F8FAFC]">
                            <td className="px-4 py-3">
                              <p className="font-extrabold text-[#042C51]">
                                {item.name}
                              </p>
                              <p className="mt-0.5 font-mono text-[10px] text-[#98A2B3]">
                                {item.email}
                              </p>
                            </td>
                            <td className="px-4 py-3">
                              <span
                                className={`rounded-full px-2.5 py-1 text-[10px] font-extrabold ${
                                  item.accessLevel.startsWith("7")
                                    ? "bg-[#042C51] text-white"
                                    : item.accessLevel.startsWith("3")
                                      ? "bg-blue-100 text-blue-800"
                                      : "bg-slate-100 text-slate-700"
                                }`}
                              >
                                {item.accessLevel}
                              </span>
                            </td>
                            <td className="px-4 py-3 font-semibold text-[#344054]">
                              {item.department}
                            </td>
                            <td className="px-4 py-3 text-[#667085]">
                              {item.accountGroup}
                            </td>
                            <td className="px-4 py-3 text-[10px] text-[#98A2B3]">
                              {item.lastActive}
                            </td>
                            <td className="px-4 py-3">
                              <StatusPill status={item.status} />
                            </td>
                            <td className="px-4 py-3 text-right">
                              <button
                                type="button"
                                onClick={() =>
                                  setNotice(`Opening access editor for ${item.email}.`)
                                }
                                className="h-8 rounded-lg bg-[#F2F6FA] px-3 text-[10px] font-extrabold text-[#042C51] hover:bg-[#E6ECF2]"
                              >
                                Edit Access
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {activeTab === "snapshot" && (
                <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                  {[
                    {
                      title: "Core HR & Employee Operations",
                      icon: Users,
                      path: ROUTES.employees,
                      metrics: [
                        ["Master Headcount", "2,840 Staff"],
                        ["Active Departments", "18 Depts"],
                        ["Pending Leaves", "14 Active"],
                        ["Resignation Queue", "4 Staff"],
                      ],
                    },
                    {
                      title: "Talent Acquisition & Sourcing",
                      icon: Briefcase,
                      path: ROUTES.taDashboard,
                      metrics: [
                        ["Candidate Pipeline", "142 Candidates"],
                        ["Open Requisitions", "18 Positions"],
                        ["Offers Outstanding", "8 Issued"],
                        ["Active Onboarding", "15 In Progress"],
                      ],
                    },
                    {
                      title: "Operations Management (OM)",
                      icon: Building2,
                      path: ROUTES.omDashboard,
                      metrics: [
                        ["Account Groups", "5 Client Accounts"],
                        ["Hiring Needs", "12 Requests"],
                        ["Recruiter Load", "4 Active TA Leads"],
                        ["Operation Capacity", "84% Staffed"],
                      ],
                    },
                    {
                      title: "Finance & Payroll Summary",
                      icon: DollarSign,
                      path: "/payroll",
                      metrics: [
                        ["Current Payroll Cycle", "July 16 - 31, 2026"],
                        ["Payroll Status", "Approved"],
                        ["Budget Requests", "3 Pending Clearance"],
                        ["Reports & Audits", "Monthly Summary Ready"],
                      ],
                    },
                  ].map(({ title, icon, path, metrics }, index) => (
                    <article
                      key={title}
                      className="sibs-page-card-in rounded-xl border border-[#E6ECF2] bg-white p-5"
                      style={getAnimationStyle(index * 55)}
                    >
                      <div className="flex items-center justify-between border-b border-[#EEF2F6] pb-3">
                        <h3 className="sibs-section-title flex items-center gap-2">
                          {React.createElement(icon, {
                            size: 16,
                            className: "text-[#FF5C28]",
                          })}
                          {title}
                        </h3>
                        <button
                          type="button"
                          onClick={() => navigate(path)}
                          className="text-[10px] font-extrabold text-[#FF5C28] hover:underline"
                        >
                          Open Module →
                        </button>
                      </div>
                      <div className="mt-4 grid grid-cols-2 gap-3">
                        {metrics.map(([label, value]) => (
                          <div
                            key={label}
                            className="rounded-lg bg-[#F8FAFC] p-3"
                          >
                            <span className="block text-[9px] font-extrabold uppercase tracking-wide text-[#98A2B3]">
                              {label}
                            </span>
                            <strong className="mt-1 block text-sm font-extrabold text-[#042C51]">
                              {value}
                            </strong>
                          </div>
                        ))}
                      </div>
                    </article>
                  ))}
                </div>
              )}

              {activeTab === "activity" && (
                <div className="space-y-4">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <h2 className="sibs-section-title">
                        System & Module Activity Audit Log ({filteredLogs.length})
                      </h2>
                      <p className="sibs-section-subtitle">
                        Recorded user actions, request updates, and access-level
                        modifications.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setNotice("Activity log export prepared for frontend preview.")}
                      className="inline-flex h-9 items-center justify-center gap-2 rounded-lg bg-[#F2F6FA] px-3 text-xs font-extrabold text-[#042C51] hover:bg-[#E6ECF2]"
                    >
                      <Download size={14} />
                      Export Activity Log
                    </button>
                  </div>

                  <div className="sibs-page-card-in overflow-x-auto rounded-xl border border-[#E6ECF2]">
                    <table className="w-full min-w-[1100px] text-left text-xs">
                      <thead>
                        <tr className="border-b border-[#E6ECF2] bg-[#F8FAFC] text-[10px] font-extrabold uppercase tracking-wide text-[#667085]">
                          <th className="px-4 py-3">Timestamp</th>
                          <th className="px-4 py-3">User Actor</th>
                          <th className="px-4 py-3">Access Level</th>
                          <th className="px-4 py-3">Module</th>
                          <th className="px-4 py-3">Action Taken</th>
                          <th className="px-4 py-3">Log Details</th>
                          <th className="px-4 py-3">Result</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#EEF2F6]">
                        {filteredLogs.map((item) => (
                          <tr key={item.id} className="hover:bg-[#F8FAFC]">
                            <td className="whitespace-nowrap px-4 py-3 font-mono text-[10px] text-[#98A2B3]">
                              {item.timestamp}
                            </td>
                            <td className="px-4 py-3 font-extrabold text-[#042C51]">
                              {item.actor}
                            </td>
                            <td className="px-4 py-3">
                              <span className="rounded bg-slate-100 px-2 py-1 text-[10px] font-bold text-slate-700">
                                {item.accessLevel}
                              </span>
                            </td>
                            <td className="px-4 py-3 font-semibold text-[#344054]">
                              {item.module}
                            </td>
                            <td className="px-4 py-3 font-mono text-[10px] font-extrabold text-[#FF5C28]">
                              {item.action}
                            </td>
                            <td className="px-4 py-3 text-[#667085]">
                              {item.details}
                            </td>
                            <td className="px-4 py-3">
                              <StatusPill status={item.status} />
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          </section>
        </div>
      </main>

      <AddAdminModal
        open={isAddAdminOpen}
        onClose={() => setIsAddAdminOpen(false)}
        onSave={addAdmin}
      />
    </div>
  );
}
