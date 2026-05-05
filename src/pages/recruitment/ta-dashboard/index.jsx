import React, { useMemo, useRef, useState } from "react";
import Header from "../../../components/layout/Header";
import {
  LayoutDashboard,
  BriefcaseBusiness,
  AlertTriangle,
  CircleAlert,
  UsersRound,
  UserX,
  Clock3,
  UserRoundCheck,
  Search,
  Eye,
  ChevronLeft,
  ChevronRight,
  TrendingUp,
  TrendingDown,
  Activity,
  CalendarDays,
  X,
} from "lucide-react";

const dashboardRoles = [
  {
    id: 1,
    roleAccount: "CSR - SIBS Operations",
    account: "SIBS Operations",
    roleTitle: "Customer Service Representative",
    approvedRequirement: 20,
    currentFilled: 12,
    openSlots: 8,
    dueDate: "2026-05-15",
    status: "At Risk",
    taOwner: "Maria Reyes",
    riskFlag: "High",
    agingDays: 18,
    sourced: 80,
    screened: 46,
    interviewed: 22,
    offered: 10,
    accepted: 7,
    hired: 12,
    dropOffs: 15,
    actionItem: "Increase sourcing and speed up interview scheduling.",
  },
  {
    id: 2,
    roleAccount: "QA - SIBS Operations",
    account: "SIBS Operations",
    roleTitle: "QA Specialist",
    approvedRequirement: 5,
    currentFilled: 2,
    openSlots: 3,
    dueDate: "2026-05-10",
    status: "Delayed",
    taOwner: "John Dela Cruz",
    riskFlag: "High",
    agingDays: 24,
    sourced: 28,
    screened: 16,
    interviewed: 7,
    offered: 3,
    accepted: 2,
    hired: 2,
    dropOffs: 6,
    actionItem: "Review QA sourcing pool and add backup candidates.",
  },
  {
    id: 3,
    roleAccount: "RCM Analyst - SIBS RCM",
    account: "SIBS RCM",
    roleTitle: "RCM Analyst",
    approvedRequirement: 5,
    currentFilled: 3,
    openSlots: 2,
    dueDate: "2026-05-20",
    status: "On Track",
    taOwner: "Kim Domingo",
    riskFlag: "None",
    agingDays: 10,
    sourced: 35,
    screened: 20,
    interviewed: 10,
    offered: 5,
    accepted: 3,
    hired: 3,
    dropOffs: 4,
    actionItem: "Maintain current pipeline movement.",
  },
  {
    id: 4,
    roleAccount: "System Developer - SIBS IT",
    account: "SIBS IT",
    roleTitle: "System Developer",
    approvedRequirement: 3,
    currentFilled: 1,
    openSlots: 2,
    dueDate: "2026-04-30",
    status: "Delayed",
    taOwner: "Maria Reyes",
    riskFlag: "Medium",
    agingDays: 31,
    sourced: 18,
    screened: 9,
    interviewed: 4,
    offered: 1,
    accepted: 1,
    hired: 1,
    dropOffs: 5,
    actionItem: "Reopen sourcing and review compensation range.",
  },
  {
    id: 5,
    roleAccount: "HR Assistant - SIBS HR",
    account: "SIBS HR",
    roleTitle: "HR Assistant",
    approvedRequirement: 2,
    currentFilled: 2,
    openSlots: 0,
    dueDate: "2026-05-18",
    status: "On Track",
    taOwner: "Paul Garcia",
    riskFlag: "None",
    agingDays: 7,
    sourced: 20,
    screened: 12,
    interviewed: 6,
    offered: 2,
    accepted: 2,
    hired: 2,
    dropOffs: 2,
    actionItem: "No immediate risk.",
  },
];

const recruiterLoads = [
  {
    recruiter: "Maria Reyes",
    activeRoles: 2,
    sourced: 98,
    interviewed: 26,
    hired: 13,
    loadStatus: "High",
  },
  {
    recruiter: "John Dela Cruz",
    activeRoles: 1,
    sourced: 28,
    interviewed: 7,
    hired: 2,
    loadStatus: "Medium",
  },
  {
    recruiter: "Kim Domingo",
    activeRoles: 1,
    sourced: 35,
    interviewed: 10,
    hired: 3,
    loadStatus: "Normal",
  },
  {
    recruiter: "Paul Garcia",
    activeRoles: 1,
    sourced: 20,
    interviewed: 6,
    hired: 2,
    loadStatus: "Normal",
  },
];

const movementStages = [
  "Sourced",
  "Screened",
  "Interviewed",
  "Offered",
  "Accepted",
  "Hired",
];

function formatDate(date) {
  if (!date) return "—";

  return new Date(date).toLocaleDateString("en-PH", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function getStatusClass(status) {
  switch (status) {
    case "On Track":
      return "border-emerald-200 bg-emerald-50 text-emerald-700";
    case "At Risk":
      return "border-amber-200 bg-amber-50 text-amber-700";
    case "Delayed":
      return "border-red-200 bg-red-50 text-red-700";
    default:
      return "border-gray-200 bg-gray-50 text-gray-600";
  }
}

function getRiskClass(risk) {
  switch (risk) {
    case "High":
      return "border-red-200 bg-red-50 text-red-700";
    case "Medium":
      return "border-amber-200 bg-amber-50 text-amber-700";
    case "Low":
      return "border-blue-200 bg-blue-50 text-blue-700";
    default:
      return "border-gray-200 bg-gray-50 text-gray-500";
  }
}

function getLoadClass(load) {
  switch (load) {
    case "High":
      return "border-red-200 bg-red-50 text-red-700";
    case "Medium":
      return "border-amber-200 bg-amber-50 text-amber-700";
    case "Normal":
      return "border-emerald-200 bg-emerald-50 text-emerald-700";
    default:
      return "border-gray-200 bg-gray-50 text-gray-600";
  }
}

function StatCard({ title, value, icon: Icon, description, trend, trendType }) {
  const TrendIcon = trendType === "down" ? TrendingDown : TrendingUp;

  return (
    <div className="flex min-w-0 items-center gap-4 rounded-xl bg-white p-4 shadow-sm">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[var(--sibs-primary-1)] text-white">
        <Icon size={18} />
      </div>

      <div className="min-w-0">
        <p className="truncate text-xs text-sibs-tertiary-5">{title}</p>

        <h2 className="truncate text-lg font-bold text-sibs-primary-1">
          {value}
        </h2>

        {description && (
          <p className="truncate text-xs text-sibs-tertiary-5">
            {description}
          </p>
        )}

        {trend && (
          <div
            className={`mt-2 inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-[11px] font-bold ${
              trendType === "down"
                ? "border-red-100 bg-red-50 text-red-600"
                : "border-emerald-100 bg-emerald-50 text-emerald-600"
            }`}
          >
            <TrendIcon size={13} />
            {trend}
          </div>
        )}
      </div>
    </div>
  );
}

function ProgressBar({ label, value, total }) {
  const percentage = total > 0 ? Math.round((value / total) * 100) : 0;

  return (
    <div>
      <div className="mb-2 flex items-center justify-between gap-4">
        <p className="min-w-0 truncate text-sm font-bold text-[#344054]">
          {label}
        </p>
        <p className="shrink-0 text-sm font-bold text-sibs-primary-1">
          {value} / {total}
        </p>
      </div>

      <div className="h-2.5 overflow-hidden rounded-full bg-[#EEF2F6]">
        <div
          className="h-full rounded-full bg-[var(--sibs-primary-1)]"
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}

function MovementBar({ label, value, max }) {
  const percentage = max > 0 ? Math.round((value / max) * 100) : 0;

  return (
    <div>
      <div className="mb-2 flex items-center justify-between gap-3">
        <span className="text-sm font-bold text-[#344054]">{label}</span>
        <span className="text-sm font-bold text-sibs-primary-1">{value}</span>
      </div>

      <div className="h-2.5 overflow-hidden rounded-full bg-[#EEF2F6]">
        <div
          className="h-full rounded-full bg-[var(--sibs-primary-1)]"
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}

function DetailRow({ label, value }) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-gray-100 py-3 last:border-b-0">
      <p className="text-[11px] font-bold uppercase tracking-wide text-sibs-tertiary-5">
        {label}
      </p>
      <div className="max-w-[60%] break-words text-right text-sm font-bold text-[#344054]">
        {value || "—"}
      </div>
    </div>
  );
}

function RoleMobileCard({ role, onView }) {
  return (
    <button
      type="button"
      onClick={onView}
      className="w-full rounded-xl border border-[#E6ECF2] bg-white p-4 text-left shadow-sm transition hover:border-[var(--sibs-primary-1)]/40 hover:bg-[#F8FAFC]"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="text-sm font-bold text-[#101828]">
            {role.roleTitle}
          </h3>
          <p className="mt-1 text-xs font-semibold text-sibs-tertiary-5">
            {role.account}
          </p>
        </div>

        <span
          className={`shrink-0 rounded-full border px-2.5 py-1 text-[10px] font-bold ${getStatusClass(
            role.status
          )}`}
        >
          {role.status}
        </span>
      </div>

      <div className="mt-4 grid grid-cols-3 gap-2 text-center">
        <div className="rounded-lg bg-[#F8FAFC] p-3">
          <p className="text-[10px] font-bold uppercase text-sibs-tertiary-5">
            Req.
          </p>
          <p className="mt-1 text-sm font-bold text-sibs-primary-1">
            {role.approvedRequirement}
          </p>
        </div>

        <div className="rounded-lg bg-[#F8FAFC] p-3">
          <p className="text-[10px] font-bold uppercase text-sibs-tertiary-5">
            Filled
          </p>
          <p className="mt-1 text-sm font-bold text-emerald-600">
            {role.currentFilled}
          </p>
        </div>

        <div className="rounded-lg bg-[#F8FAFC] p-3">
          <p className="text-[10px] font-bold uppercase text-sibs-tertiary-5">
            Open
          </p>
          <p className="mt-1 text-sm font-bold text-red-600">
            {role.openSlots}
          </p>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-3 text-xs">
        <p className="font-semibold text-sibs-tertiary-5">
          Owner:{" "}
          <span className="font-bold text-[#344054]">{role.taOwner}</span>
        </p>

        <p className="font-semibold text-sibs-tertiary-5">
          Aging:{" "}
          <span className="font-bold text-[#344054]">{role.agingDays}d</span>
        </p>
      </div>
    </button>
  );
}

function RoleDetailsModal({ open, role, onClose }) {
  if (!open || !role) return null;

  const progress =
    role.approvedRequirement > 0
      ? Math.round((role.currentFilled / role.approvedRequirement) * 100)
      : 0;

  return (
    <div
      className="fixed inset-0 z-[9999] flex h-dvh items-center justify-center bg-black/40 px-4 py-4"
      onClick={onClose}
    >
      <div
        className="flex max-h-[92dvh] w-full max-w-4xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4 border-b border-gray-100 px-5 py-4 sm:px-6 sm:py-5">
          <div className="min-w-0">
            <h2 className="text-lg font-bold text-sibs-primary-1 sm:text-xl">
              Role KPI Details
            </h2>
            <p className="mt-1 text-sm font-medium text-sibs-tertiary-5">
              Hiring status, movement, risk, and current action item.
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="shrink-0 rounded-full p-2 text-gray-400 transition hover:bg-gray-100 hover:text-gray-700"
            aria-label="Close modal"
          >
            <X size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 sm:p-6">
          <div className="grid grid-cols-1 gap-5 xl:grid-cols-[1fr_340px]">
            <div className="space-y-5">
              <div className="rounded-xl border border-[#E6ECF2] bg-white p-5 shadow-sm">
                <div className="flex flex-col justify-between gap-4 md:flex-row md:items-start">
                  <div className="min-w-0">
                    <h3 className="text-lg font-bold text-[#101828] sm:text-xl">
                      {role.roleTitle}
                    </h3>
                    <p className="mt-1 text-sm font-semibold text-sibs-tertiary-5">
                      {role.account}
                    </p>

                    <div className="mt-3 flex flex-wrap gap-2">
                      <span
                        className={`inline-flex rounded-full border px-3 py-1 text-xs font-bold ${getStatusClass(
                          role.status
                        )}`}
                      >
                        {role.status}
                      </span>

                      <span
                        className={`inline-flex rounded-full border px-3 py-1 text-xs font-bold ${getRiskClass(
                          role.riskFlag
                        )}`}
                      >
                        Risk: {role.riskFlag}
                      </span>
                    </div>
                  </div>

                  <div className="rounded-xl border border-blue-100 bg-blue-50 px-5 py-4 text-center">
                    <p className="text-[11px] font-bold uppercase tracking-wide text-sibs-primary-1/70">
                      Progress
                    </p>
                    <p className="mt-1 text-3xl font-bold text-sibs-primary-1">
                      {progress}%
                    </p>
                  </div>
                </div>
              </div>

              <div className="rounded-xl border border-[#E6ECF2] bg-white p-5 shadow-sm">
                <h3 className="mb-5 text-sm font-bold text-[#101828]">
                  Weekly Movement
                </h3>

                <div className="space-y-4">
                  <MovementBar
                    label="Sourced"
                    value={role.sourced}
                    max={role.sourced}
                  />
                  <MovementBar
                    label="Screened"
                    value={role.screened}
                    max={role.sourced}
                  />
                  <MovementBar
                    label="Interviewed"
                    value={role.interviewed}
                    max={role.sourced}
                  />
                  <MovementBar
                    label="Offered"
                    value={role.offered}
                    max={role.sourced}
                  />
                  <MovementBar
                    label="Accepted"
                    value={role.accepted}
                    max={role.sourced}
                  />
                  <MovementBar
                    label="Hired"
                    value={role.hired}
                    max={role.sourced}
                  />
                </div>
              </div>

              <div className="rounded-xl border border-blue-100 bg-blue-50 p-5">
                <h3 className="text-sm font-bold text-sibs-primary-1">
                  Current Action Item
                </h3>
                <p className="mt-2 text-sm leading-6 text-sibs-primary-1/80">
                  {role.actionItem}
                </p>
              </div>
            </div>

            <div className="space-y-5">
              <div className="rounded-xl border border-[#E6ECF2] bg-[#F8FAFC] p-5">
                <h3 className="text-sm font-bold text-[#101828]">
                  Role Summary
                </h3>

                <div className="mt-4">
                  <DetailRow label="Role / Account" value={role.roleAccount} />
                  <DetailRow
                    label="Approved Requirement"
                    value={role.approvedRequirement}
                  />
                  <DetailRow label="Current Filled" value={role.currentFilled} />
                  <DetailRow label="Open Slots" value={role.openSlots} />
                  <DetailRow label="Due Date" value={formatDate(role.dueDate)} />
                  <DetailRow label="TA Owner" value={role.taOwner} />
                  <DetailRow
                    label="Aging Days"
                    value={`${role.agingDays} days`}
                  />
                  <DetailRow label="Drop-offs" value={role.dropOffs} />
                </div>
              </div>

              <div className="rounded-xl border border-[#E6ECF2] bg-white p-5 shadow-sm">
                <h3 className="mb-4 text-sm font-bold text-[#101828]">
                  Filled vs Requirement
                </h3>

                <ProgressBar
                  label="Hiring Progress"
                  value={role.currentFilled}
                  total={role.approvedRequirement}
                />
              </div>

              <div className="rounded-xl border border-amber-100 bg-amber-50 p-5">
                <h3 className="text-sm font-bold text-amber-700">
                  Risk Interpretation
                </h3>
                <p className="mt-2 text-sm leading-6 text-amber-700/90">
                  Roles marked At Risk or Delayed should have linked action
                  items and recruiter follow-up before the next hiring call.
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="border-t border-gray-100 px-5 py-4 sm:px-6">
          <div className="flex justify-end">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl bg-[var(--sibs-primary-1)] px-5 py-2.5 text-sm font-bold text-white transition hover:opacity-90"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function TADashboardPage() {
  const [search, setSearch] = useState("");
  const [selectedRole, setSelectedRole] = useState(null);
  const mainScrollRef = useRef(null);

  const filteredRoles = useMemo(() => {
    const keyword = search.trim().toLowerCase();

    if (!keyword) return dashboardRoles;

    return dashboardRoles.filter((role) => {
      return (
        role.roleAccount.toLowerCase().includes(keyword) ||
        role.account.toLowerCase().includes(keyword) ||
        role.roleTitle.toLowerCase().includes(keyword) ||
        role.taOwner.toLowerCase().includes(keyword) ||
        role.status.toLowerCase().includes(keyword)
      );
    });
  }, [search]);

  const totals = useMemo(() => {
    const totalOpenRoles = dashboardRoles.filter(
      (role) => role.openSlots > 0
    ).length;

    const totalApproved = dashboardRoles.reduce(
      (sum, role) => sum + role.approvedRequirement,
      0
    );

    const totalFilled = dashboardRoles.reduce(
      (sum, role) => sum + role.currentFilled,
      0
    );

    const atRisk = dashboardRoles.filter(
      (role) => role.status === "At Risk"
    ).length;

    const delayed = dashboardRoles.filter(
      (role) => role.status === "Delayed"
    ).length;

    const totalDropOffs = dashboardRoles.reduce(
      (sum, role) => sum + role.dropOffs,
      0
    );

    const agingRoles = dashboardRoles.filter(
      (role) => role.agingDays >= 15
    ).length;

    const totalSourced = dashboardRoles.reduce(
      (sum, role) => sum + role.sourced,
      0
    );

    const totalScreened = dashboardRoles.reduce(
      (sum, role) => sum + role.screened,
      0
    );

    const totalInterviewed = dashboardRoles.reduce(
      (sum, role) => sum + role.interviewed,
      0
    );

    const totalOffered = dashboardRoles.reduce(
      (sum, role) => sum + role.offered,
      0
    );

    const totalAccepted = dashboardRoles.reduce(
      (sum, role) => sum + role.accepted,
      0
    );

    const totalHired = dashboardRoles.reduce(
      (sum, role) => sum + role.hired,
      0
    );

    return {
      totalOpenRoles,
      totalApproved,
      totalFilled,
      atRisk,
      delayed,
      totalDropOffs,
      agingRoles,
      movement: {
        Sourced: totalSourced,
        Screened: totalScreened,
        Interviewed: totalInterviewed,
        Offered: totalOffered,
        Accepted: totalAccepted,
        Hired: totalHired,
      },
    };
  }, []);

  const maxMovement = Math.max(...Object.values(totals.movement));

  return (
    <div className="flex-1 flex flex-col bg-[var(--sibs-tertiary-10)]">
      <Header />

      <main
        ref={mainScrollRef}
        className="min-w-0 flex-1 overflow-y-auto overflow-x-hidden p-4 sm:p-6"
      >
        <div className="mb-6">
          <div className="flex items-center gap-2">
            <LayoutDashboard size={28} className="shrink-0 text-sibs-primary-1" />

            <h1 className="min-w-0 break-words text-2xl font-bold text-sibs-primary-1 sm:text-4xl">
              TA Dashboard
            </h1>
          </div>

          <p className="mt-1 text-sm text-sibs-tertiary-5">
            Weekly hiring overview and recruitment KPIs
          </p>
        </div>

        <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard
            title="Total Open Roles"
            value={totals.totalOpenRoles}
            icon={BriefcaseBusiness}
            description="Roles with remaining open slots"
            trend="+2 from last week"
          />

          <StatCard
            title="Requirement vs Filled"
            value={`${totals.totalFilled}/${totals.totalApproved}`}
            icon={UserRoundCheck}
            description="Approved hiring requirement"
            trend="68% filled"
          />

          <StatCard
            title="At-Risk Roles"
            value={totals.atRisk}
            icon={AlertTriangle}
            description="Roles that may miss due date"
            trend="+1 risk"
            trendType="down"
          />

          <StatCard
            title="Delayed Roles"
            value={totals.delayed}
            icon={CircleAlert}
            description="Roles already behind plan"
            trend="Needs action"
            trendType="down"
          />

          <StatCard
            title="Weekly Movement"
            value={totals.movement.Hired}
            icon={Activity}
            description="Total hired this week"
            trend="+6 hires"
          />

          <StatCard
            title="Drop-offs"
            value={totals.totalDropOffs}
            icon={UserX}
            description="Candidate exits across stages"
            trend="Monitor reasons"
            trendType="down"
          />

          <StatCard
            title="Recruiter Load"
            value={recruiterLoads.length}
            icon={UsersRound}
            description="Active TA owners"
            trend="4 active"
          />

          <StatCard
            title="Aging Roles"
            value={totals.agingRoles}
            icon={Clock3}
            description="Roles aging 15+ days"
            trend="Review weekly"
            trendType="down"
          />
        </div>

        <section className="mb-6 grid grid-cols-1 gap-4 xl:grid-cols-[1.2fr_0.8fr]">
          <div className="rounded-xl bg-white p-4 shadow-sm sm:p-6">
            <div className="mb-5 flex items-start justify-between gap-4">
              <div className="min-w-0">
                <h2 className="text-lg font-bold text-sibs-primary-1">
                  Approved Requirement vs Filled
                </h2>
                <p className="text-sm text-sibs-tertiary-5">
                  Current hiring progress by role and account.
                </p>
              </div>

              <CalendarDays size={20} className="shrink-0 text-gray-400" />
            </div>

            <div className="space-y-5">
              {dashboardRoles.map((role) => (
                <ProgressBar
                  key={role.id}
                  label={role.roleAccount}
                  value={role.currentFilled}
                  total={role.approvedRequirement}
                />
              ))}
            </div>
          </div>

          <div className="rounded-xl bg-white p-4 shadow-sm sm:p-6">
            <div className="mb-5 flex items-start justify-between gap-4">
              <div className="min-w-0">
                <h2 className="text-lg font-bold text-sibs-primary-1">
                  Weekly Movement
                </h2>
                <p className="text-sm text-sibs-tertiary-5">
                  Sourced to hired funnel.
                </p>
              </div>

              <Activity size={20} className="shrink-0 text-gray-400" />
            </div>

            <div className="space-y-4">
              {movementStages.map((stage) => (
                <MovementBar
                  key={stage}
                  label={stage}
                  value={totals.movement[stage]}
                  max={maxMovement}
                />
              ))}
            </div>
          </div>
        </section>

        <section className="grid grid-cols-1 gap-4 xl:grid-cols-[1fr_380px]">
          <div className="overflow-hidden rounded-xl bg-white shadow-sm">
            <div className="border-b border-gray-100 p-4 sm:p-6">
              <div className="flex flex-col justify-between gap-4 xl:flex-row xl:items-center">
                <div className="min-w-0">
                  <h2 className="text-lg font-bold text-sibs-primary-1">
                    Role Hiring Status
                  </h2>
                  <p className="text-sm text-sibs-tertiary-5">
                    Role-level delivery, risk status, aging, and ownership.
                  </p>
                </div>

                <div className="relative w-full xl:w-[340px]">
                  <Search
                    size={18}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-sibs-tertiary-5"
                  />
                  <input
                    type="text"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search role, account, owner..."
                    className="search-input w-full"
                  />
                </div>
              </div>
            </div>

            <div className="p-4 sm:p-6">
              <div className="space-y-3 lg:hidden">
                {filteredRoles.length > 0 ? (
                  filteredRoles.map((role) => (
                    <RoleMobileCard
                      key={role.id}
                      role={role}
                      onView={() => setSelectedRole(role)}
                    />
                  ))
                ) : (
                  <div className="rounded-xl border border-[#E6ECF2] bg-white px-5 py-10 text-center text-sm font-bold text-gray-500">
                    No role records found.
                  </div>
                )}
              </div>

              <div className="hidden overflow-hidden rounded-xl border border-[#E6ECF2] lg:block">
                <div className="max-h-[520px] overflow-auto">
                  <table className="w-full min-w-[1050px] border-collapse text-left">
                    <thead className="sticky top-0 z-10 bg-[#F8FAFC]">
                      <tr className="text-xs font-bold uppercase tracking-wide text-sibs-tertiary-5">
                        <th className="px-5 py-4">Role / Account</th>
                        <th className="px-5 py-4 text-center">Req.</th>
                        <th className="px-5 py-4 text-center">Filled</th>
                        <th className="px-5 py-4 text-center">Open</th>
                        <th className="px-5 py-4">Due Date</th>
                        <th className="px-5 py-4">Status</th>
                        <th className="px-5 py-4">TA Owner</th>
                        <th className="px-5 py-4 text-center">Aging</th>
                        <th className="px-5 py-4 text-right">Action</th>
                      </tr>
                    </thead>

                    <tbody className="divide-y divide-gray-100 bg-white">
                      {filteredRoles.length > 0 ? (
                        filteredRoles.map((role) => (
                          <tr
                            key={role.id}
                            className="transition hover:bg-[#F8FAFC]"
                          >
                            <td className="px-5 py-4">
                              <p className="text-sm font-bold text-[#101828]">
                                {role.roleTitle}
                              </p>
                              <p className="text-xs font-semibold text-sibs-tertiary-5">
                                {role.account}
                              </p>
                            </td>

                            <td className="px-5 py-4 text-center text-sm font-bold text-[#344054]">
                              {role.approvedRequirement}
                            </td>

                            <td className="px-5 py-4 text-center text-sm font-bold text-emerald-600">
                              {role.currentFilled}
                            </td>

                            <td className="px-5 py-4 text-center text-sm font-bold text-red-600">
                              {role.openSlots}
                            </td>

                            <td className="px-5 py-4 text-sm font-semibold text-[#344054]">
                              {formatDate(role.dueDate)}
                            </td>

                            <td className="px-5 py-4">
                              <span
                                className={`inline-flex rounded-full border px-3 py-1 text-xs font-bold ${getStatusClass(
                                  role.status
                                )}`}
                              >
                                {role.status}
                              </span>
                            </td>

                            <td className="px-5 py-4 text-sm font-bold text-[#344054]">
                              {role.taOwner}
                            </td>

                            <td className="px-5 py-4 text-center text-sm font-bold text-[#344054]">
                              {role.agingDays}d
                            </td>

                            <td className="px-5 py-4 text-right">
                              <button
                                type="button"
                                onClick={() => setSelectedRole(role)}
                                className="inline-flex items-center justify-center gap-2 rounded-xl border border-[#E6ECF2] bg-white px-4 py-2 text-xs font-bold text-sibs-primary-1 transition hover:border-[var(--sibs-primary-1)] hover:bg-[var(--sibs-primary-1)]/5"
                              >
                                <Eye size={15} />
                                View
                              </button>
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td
                            colSpan={9}
                            className="px-5 py-12 text-center text-sm font-bold text-gray-500"
                          >
                            No role records found.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="mt-5 flex flex-col justify-between gap-4 md:flex-row md:items-center">
                <p className="text-sm font-semibold text-sibs-tertiary-5">
                  Showing 1 to {filteredRoles.length} of {dashboardRoles.length}{" "}
                  roles
                </p>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    className="flex h-9 w-9 items-center justify-center rounded-lg border border-[#E6ECF2] text-gray-500 transition hover:bg-gray-50"
                  >
                    <ChevronLeft size={16} />
                  </button>

                  <button
                    type="button"
                    className="flex h-9 w-9 items-center justify-center rounded-lg bg-[var(--sibs-primary-1)] text-sm font-bold text-white"
                  >
                    1
                  </button>

                  <button
                    type="button"
                    className="flex h-9 w-9 items-center justify-center rounded-lg border border-[#E6ECF2] text-gray-500 transition hover:bg-gray-50"
                  >
                    <ChevronRight size={16} />
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div className="rounded-xl bg-white p-4 shadow-sm sm:p-6">
              <h2 className="text-lg font-bold text-sibs-primary-1">
                Recruiter Load
              </h2>
              <p className="mt-1 text-sm text-sibs-tertiary-5">
                Active roles handled vs output.
              </p>

              <div className="mt-5 space-y-4">
                {recruiterLoads.map((item) => (
                  <div
                    key={item.recruiter}
                    className="rounded-xl border border-[#E6ECF2] bg-[#F8FAFC] p-4"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="min-w-0">
                        <p className="text-sm font-bold text-[#101828]">
                          {item.recruiter}
                        </p>
                        <p className="mt-1 text-xs font-semibold text-sibs-tertiary-5">
                          {item.activeRoles} active role/s · {item.hired} hired
                        </p>
                      </div>

                      <span
                        className={`shrink-0 rounded-full border px-3 py-1 text-xs font-bold ${getLoadClass(
                          item.loadStatus
                        )}`}
                      >
                        {item.loadStatus}
                      </span>
                    </div>

                    <div className="mt-4 grid grid-cols-3 gap-2 text-center">
                      <div className="rounded-lg bg-white p-3">
                        <p className="text-[10px] font-bold uppercase text-sibs-tertiary-5">
                          Sourced
                        </p>
                        <p className="mt-1 text-sm font-bold text-sibs-primary-1">
                          {item.sourced}
                        </p>
                      </div>

                      <div className="rounded-lg bg-white p-3">
                        <p className="text-[10px] font-bold uppercase text-sibs-tertiary-5">
                          Interviewed
                        </p>
                        <p className="mt-1 text-sm font-bold text-sibs-primary-1">
                          {item.interviewed}
                        </p>
                      </div>

                      <div className="rounded-lg bg-white p-3">
                        <p className="text-[10px] font-bold uppercase text-sibs-tertiary-5">
                          Hired
                        </p>
                        <p className="mt-1 text-sm font-bold text-sibs-primary-1">
                          {item.hired}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-xl border border-blue-100 bg-blue-50 p-5 sm:p-6">
              <h3 className="text-sm font-bold text-sibs-primary-1">
                TA Dashboard Rule
              </h3>
              <p className="mt-2 text-sm leading-6 text-sibs-primary-1/80">
                Dashboard values should be generated from Hiring Needs,
                Candidate Pipeline, Offer Management, Onboarding, and Action
                Items. Avoid manually encoded weekly summaries.
              </p>
            </div>
          </div>
        </section>
      </main>

      <RoleDetailsModal
        open={!!selectedRole}
        role={selectedRole}
        onClose={() => setSelectedRole(null)}
      />
    </div>
  );
}