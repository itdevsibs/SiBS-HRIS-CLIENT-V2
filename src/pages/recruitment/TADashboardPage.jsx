import React, { useMemo, useRef, useState } from "react";
import Header from "../../components/layout/Header";
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
      return "border-green-200 bg-green-50 text-green-700";
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
      return "border-gray-200 bg-gray-50 text-gray-600";
  }
}

function getLoadClass(load) {
  switch (load) {
    case "High":
      return "border-red-200 bg-red-50 text-red-700";
    case "Medium":
      return "border-amber-200 bg-amber-50 text-amber-700";
    case "Normal":
      return "border-green-200 bg-green-50 text-green-700";
    default:
      return "border-gray-200 bg-gray-50 text-gray-600";
  }
}

function Badge({ children, className = "" }) {
  return (
    <span
      className={`inline-flex items-center justify-center rounded-full border px-3 py-1 text-xs font-bold whitespace-nowrap transition-all duration-200 hover:-translate-y-0.5 hover:shadow-sm ${className}`}
    >
      {children}
    </span>
  );
}

function StatCard({
  title,
  value,
  icon: Icon,
  description,
  trend,
  trendType,
  delay = 0,
}) {
  const TrendIcon = trendType === "down" ? TrendingDown : TrendingUp;

  return (
    <div
      className="sibs-page-card-in flex min-w-0 items-center gap-4 rounded-xl bg-white p-4 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md"
      style={{ animationDelay: `${delay}ms` }}
    >
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[10px] bg-sibs-primary-1 text-white transition-transform duration-200 group-hover:scale-105">
        <Icon size={18} />
      </div>

      <div className="min-w-0">
        <p className="m-0 truncate text-xs font-normal text-sibs-tertiary-5">
          {title}
        </p>

        <h2 className="m-0 truncate text-lg font-bold leading-tight text-sibs-primary-1">
          {value}
        </h2>

        {description && (
          <span className="block truncate text-xs font-normal text-sibs-tertiary-5">
            {description}
          </span>
        )}

        {trend && (
          <div
            className={`mt-2 inline-flex w-fit items-center gap-1 rounded-full border px-2.5 py-1 text-[11px] font-bold transition-all duration-200 hover:-translate-y-0.5 hover:shadow-sm ${
              trendType === "down"
                ? "border-red-200 bg-red-50 text-red-600"
                : "border-green-200 bg-green-50 text-green-600"
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
    <div className="transition-all duration-200 hover:-translate-y-0.5">
      <div className="mb-2 flex items-center justify-between gap-4">
        <p className="m-0 text-sm font-bold text-[#344054]">{label}</p>

        <span className="text-sm font-bold text-sibs-primary-1">
          {value} / {total}
        </span>
      </div>

      <div className="h-2.5 overflow-hidden rounded-full bg-[#eef2f6]">
        <div
          className="h-full rounded-full bg-sibs-primary-1 transition-all duration-700 ease-out"
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}

function MovementBar({ label, value, max }) {
  const percentage = max > 0 ? Math.round((value / max) * 100) : 0;

  return (
    <div className="transition-all duration-200 hover:-translate-y-0.5">
      <div className="mb-2 flex items-center justify-between gap-4">
        <p className="m-0 text-sm font-bold text-[#344054]">{label}</p>

        <span className="text-sm font-bold text-sibs-primary-1">{value}</span>
      </div>

      <div className="h-2.5 overflow-hidden rounded-full bg-[#eef2f6]">
        <div
          className="h-full rounded-full bg-sibs-primary-1 transition-all duration-700 ease-out"
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}

function DetailRow({ label, value }) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-[#f3f4f6] py-3 last:border-b-0">
      <p className="m-0 text-[11px] font-bold uppercase tracking-[0.04em] text-sibs-tertiary-5">
        {label}
      </p>

      <strong className="max-w-[60%] break-words text-right text-sm font-bold text-[#344054] max-sm:max-w-full max-sm:text-left">
        {value || "—"}
      </strong>
    </div>
  );
}

function RoleMobileCard({ role, onView, delay = 0 }) {
  return (
    <button
      type="button"
      onClick={onView}
      className="sibs-page-card-in w-full rounded-xl border border-[#e6ecf2] bg-white p-4 text-left shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:bg-slate-50 hover:shadow-md active:scale-[0.99]"
      style={{ animationDelay: `${delay}ms` }}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="m-0 text-sm font-bold text-[#101828]">
            {role.roleTitle}
          </h3>

          <p className="mt-1 text-xs font-semibold text-sibs-tertiary-5">
            {role.account}
          </p>
        </div>

        <Badge className={getStatusClass(role.status)}>{role.status}</Badge>
      </div>

      <div className="mt-4 grid grid-cols-3 gap-2 text-center">
        <div className="rounded-lg bg-slate-50 p-3 transition-all duration-200 hover:bg-white hover:shadow-sm">
          <p className="m-0 text-[10px] font-bold uppercase text-sibs-tertiary-5">
            Req.
          </p>
          <strong className="mt-1 block text-sm font-bold text-sibs-primary-1">
            {role.approvedRequirement}
          </strong>
        </div>

        <div className="rounded-lg bg-slate-50 p-3 transition-all duration-200 hover:bg-white hover:shadow-sm">
          <p className="m-0 text-[10px] font-bold uppercase text-sibs-tertiary-5">
            Filled
          </p>
          <strong className="mt-1 block text-sm font-bold text-green-600">
            {role.currentFilled}
          </strong>
        </div>

        <div className="rounded-lg bg-slate-50 p-3 transition-all duration-200 hover:bg-white hover:shadow-sm">
          <p className="m-0 text-[10px] font-bold uppercase text-sibs-tertiary-5">
            Open
          </p>
          <strong className="mt-1 block text-sm font-bold text-red-600">
            {role.openSlots}
          </strong>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap justify-between gap-3">
        <p className="m-0 text-xs font-semibold text-sibs-tertiary-5">
          Owner: <strong className="text-[#344054]">{role.taOwner}</strong>
        </p>

        <p className="m-0 text-xs font-semibold text-sibs-tertiary-5">
          Aging: <strong className="text-[#344054]">{role.agingDays}d</strong>
        </p>
      </div>
    </button>
  );
}

function RoleDetailsModal({ open, role, onClose }) {
  const [isClosing, setIsClosing] = useState(false);

  if (!open || !role) return null;

  const progress =
    role.approvedRequirement > 0
      ? Math.round((role.currentFilled / role.approvedRequirement) * 100)
      : 0;

  function handleAnimatedClose() {
    if (isClosing) return;

    setIsClosing(true);

    window.setTimeout(() => {
      setIsClosing(false);
      onClose?.();
    }, 220);
  }

  return (
    <div
      className={`fixed inset-0 z-[9999] flex h-dvh items-center justify-center bg-black/40 p-4 ${
        isClosing ? "sibs-modal-backdrop-out" : "sibs-modal-backdrop-in"
      }`}
      onClick={handleAnimatedClose}
    >
      <div
        className={`flex max-h-[92dvh] w-full max-w-4xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl ${
          isClosing ? "sibs-modal-pop-out" : "sibs-modal-pop-in"
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4 border-b border-[#f3f4f6] px-6 py-5 max-sm:px-4">
          <div>
            <h2 className="m-0 text-xl font-bold text-sibs-primary-1">
              Role KPI Details
            </h2>

            <p className="mt-1 text-sm font-medium text-sibs-tertiary-5">
              Hiring status, movement, risk, and current action item.
            </p>
          </div>

          <button
            type="button"
            onClick={handleAnimatedClose}
            className="rounded-full p-2 text-gray-400 transition hover:bg-gray-100 hover:text-gray-700 active:scale-[0.98]"
            aria-label="Close modal"
          >
            <X size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 max-sm:p-4">
          <div className="grid grid-cols-[1fr_340px] gap-5 max-lg:grid-cols-1">
            <div className="flex flex-col gap-5">
              <div className="rounded-xl border border-[#e6ecf2] bg-white p-5 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md">
                <div className="flex justify-between gap-4 max-lg:flex-col">
                  <div>
                    <h3 className="m-0 text-xl font-bold text-[#101828]">
                      {role.roleTitle}
                    </h3>

                    <p className="mt-1 text-sm font-semibold text-sibs-tertiary-5">
                      {role.account}
                    </p>

                    <div className="mt-3 flex flex-wrap gap-2">
                      <Badge className={getStatusClass(role.status)}>
                        {role.status}
                      </Badge>

                      <Badge className={getRiskClass(role.riskFlag)}>
                        Risk: {role.riskFlag}
                      </Badge>
                    </div>
                  </div>

                  <div className="min-w-[120px] rounded-xl border border-blue-200 bg-blue-50 px-5 py-4 text-center">
                    <p className="m-0 text-[11px] font-bold uppercase text-sibs-primary-1/70">
                      Progress
                    </p>

                    <strong className="mt-1 block text-3xl font-bold text-sibs-primary-1">
                      {progress}%
                    </strong>
                  </div>
                </div>
              </div>

              <div className="rounded-xl border border-[#e6ecf2] bg-white p-5 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md">
                <h3 className="mb-4 text-sm font-bold text-[#101828]">
                  Weekly Movement
                </h3>

                <div className="flex flex-col gap-4">
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

              <div className="rounded-xl border border-blue-200 bg-blue-50 p-5 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md">
                <h3 className="m-0 text-sm font-bold text-sibs-primary-1">
                  Current Action Item
                </h3>

                <p className="mt-2 text-sm leading-6 text-sibs-primary-1/80">
                  {role.actionItem}
                </p>
              </div>
            </div>

            <div className="flex flex-col gap-5">
              <div className="rounded-xl border border-[#e6ecf2] bg-slate-50 p-5 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md">
                <h3 className="mb-4 text-sm font-bold text-[#101828]">
                  Role Summary
                </h3>

                <div>
                  <DetailRow label="Role / Account" value={role.roleAccount} />
                  <DetailRow
                    label="Approved Requirement"
                    value={role.approvedRequirement}
                  />
                  <DetailRow
                    label="Current Filled"
                    value={role.currentFilled}
                  />
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

              <div className="rounded-xl border border-[#e6ecf2] bg-white p-5 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md">
                <h3 className="mb-4 text-sm font-bold text-[#101828]">
                  Filled vs Requirement
                </h3>

                <ProgressBar
                  label="Hiring Progress"
                  value={role.currentFilled}
                  total={role.approvedRequirement}
                />
              </div>

              <div className="rounded-xl border border-amber-200 bg-amber-50 p-5 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md">
                <h3 className="m-0 text-sm font-bold text-amber-700">
                  Risk Interpretation
                </h3>

                <p className="mt-2 text-sm leading-6 text-amber-700">
                  Roles marked At Risk or Delayed should have linked action
                  items and recruiter follow-up before the next hiring call.
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-end border-t border-[#f3f4f6] px-6 py-4 max-sm:px-4">
          <button
            type="button"
            onClick={handleAnimatedClose}
            className="rounded-xl bg-sibs-primary-1 px-5 py-2.5 text-sm font-bold text-white transition hover:-translate-y-0.5 hover:opacity-90 hover:shadow-md active:scale-[0.98]"
          >
            Close
          </button>
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
    <div className="flex h-full min-h-0 min-w-0 flex-1 flex-col overflow-hidden bg-sibs-tertiary-10 font-jakarta">
      <Header />

      <main
        ref={mainScrollRef}
        className="min-h-0 min-w-0 flex-1 overflow-y-auto overflow-x-hidden p-4 sm:p-6"
      >
        <section className="sibs-page-header-in mb-6">
          <div className="flex items-center gap-2 text-sibs-primary-1">
            <LayoutDashboard size={28} className="shrink-0" />

            <h1 className="m-0 text-[28px] font-bold leading-tight tracking-[-0.9px] text-sibs-primary-1 sm:text-[32px] xl:text-[38px]">
              TA Dashboard
            </h1>
          </div>

          <p className="mt-1 text-sm text-sibs-tertiary-5">
            Weekly hiring overview and recruitment KPIs
          </p>
        </section>

        <section className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard
            title="Total Open Roles"
            value={totals.totalOpenRoles}
            icon={BriefcaseBusiness}
            description="Roles with remaining open slots"
            trend="+2 from last week"
            delay={0}
          />

          <StatCard
            title="Requirement vs Filled"
            value={`${totals.totalFilled}/${totals.totalApproved}`}
            icon={UserRoundCheck}
            description="Approved hiring requirement"
            trend="68% filled"
            delay={60}
          />

          <StatCard
            title="At-Risk Roles"
            value={totals.atRisk}
            icon={AlertTriangle}
            description="Roles that may miss due date"
            trend="+1 risk"
            trendType="down"
            delay={120}
          />

          <StatCard
            title="Delayed Roles"
            value={totals.delayed}
            icon={CircleAlert}
            description="Roles already behind plan"
            trend="Needs action"
            trendType="down"
            delay={180}
          />

          <StatCard
            title="Weekly Movement"
            value={totals.movement.Hired}
            icon={Activity}
            description="Total hired this week"
            trend="+6 hires"
            delay={240}
          />

          <StatCard
            title="Drop-offs"
            value={totals.totalDropOffs}
            icon={UserX}
            description="Candidate exits across stages"
            trend="Monitor reasons"
            trendType="down"
            delay={300}
          />

          <StatCard
            title="Recruiter Load"
            value={recruiterLoads.length}
            icon={UsersRound}
            description="Active TA owners"
            trend="4 active"
            delay={360}
          />

          <StatCard
            title="Aging Roles"
            value={totals.agingRoles}
            icon={Clock3}
            description="Roles aging 15+ days"
            trend="Review weekly"
            trendType="down"
            delay={420}
          />
        </section>

        <section className="mb-6 grid grid-cols-1 gap-4 xl:grid-cols-[1.2fr_0.8fr]">
          <div
            className="sibs-profile-tab-panel rounded-xl bg-white p-5 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md sm:p-6"
            style={{ animationDelay: "80ms" }}
          >
            <div className="mb-5 flex items-start justify-between gap-4">
              <div>
                <h2 className="m-0 text-lg font-bold text-sibs-primary-1">
                  Approved Requirement vs Filled
                </h2>

                <p className="mt-1 text-sm text-sibs-tertiary-5">
                  Current hiring progress by role and account.
                </p>
              </div>

              <CalendarDays size={20} className="shrink-0 text-gray-400" />
            </div>

            <div className="flex flex-col gap-4">
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

          <div
            className="sibs-profile-tab-panel rounded-xl bg-white p-5 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md sm:p-6"
            style={{ animationDelay: "140ms" }}
          >
            <div className="mb-5 flex items-start justify-between gap-4">
              <div>
                <h2 className="m-0 text-lg font-bold text-sibs-primary-1">
                  Weekly Movement
                </h2>

                <p className="mt-1 text-sm text-sibs-tertiary-5">
                  Sourced to hired funnel.
                </p>
              </div>

              <Activity size={20} className="shrink-0 text-gray-400" />
            </div>

            <div className="flex flex-col gap-4">
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

        <section className="grid grid-cols-1 gap-4 2xl:grid-cols-[1fr_380px]">
          <div
            className="sibs-profile-tab-panel overflow-hidden rounded-xl bg-white shadow-sm"
            style={{ animationDelay: "180ms" }}
          >
            <div className="flex items-center justify-between gap-4 border-b border-[#f3f4f6] p-5 max-lg:flex-col max-lg:items-stretch sm:p-6">
              <div>
                <h2 className="m-0 text-lg font-bold text-sibs-primary-1">
                  Role Hiring Status
                </h2>

                <p className="mt-1 text-sm text-sibs-tertiary-5">
                  Role-level delivery, risk status, aging, and ownership.
                </p>
              </div>

              <div className="relative w-full shrink-0 lg:w-[340px]">
                <Search
                  size={18}
                  className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-sibs-tertiary-5"
                />

                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search role, account, owner..."
                  className="h-11 w-full rounded-full border border-sibs-tertiary-8 bg-white px-4 pl-11 text-sm text-sibs-primary-1 outline-none transition-all duration-200 placeholder:text-sibs-tertiary-5 hover:border-sibs-primary-1/30 hover:shadow-sm focus:border-sibs-primary-1 focus:ring-4 focus:ring-sibs-primary-1/10"
                />
              </div>
            </div>

            <div className="p-5 sm:p-6">
              <div key={search} className="flex flex-col gap-3 lg:hidden">
                {filteredRoles.length > 0 ? (
                  filteredRoles.map((role, index) => (
                    <RoleMobileCard
                      key={role.id}
                      role={role}
                      delay={Math.min(index * 40, 300)}
                      onView={() => setSelectedRole(role)}
                    />
                  ))
                ) : (
                  <div className="sibs-profile-tab-panel rounded-xl border border-[#e6ecf2] bg-white p-10 text-center text-sm font-bold text-gray-500">
                    No role records found.
                  </div>
                )}
              </div>

              <div className="hidden overflow-hidden rounded-xl border border-[#e6ecf2] lg:block">
                <div className="max-h-[520px] overflow-auto">
                  <table className="w-full min-w-[1050px] border-collapse bg-white">
                    <thead className="sticky top-0 z-10 bg-slate-50">
                      <tr>
                        <th className="whitespace-nowrap px-5 py-4 text-left text-xs font-bold uppercase tracking-[0.04em] text-sibs-tertiary-5">
                          Role / Account
                        </th>
                        <th className="whitespace-nowrap px-5 py-4 text-center text-xs font-bold uppercase tracking-[0.04em] text-sibs-tertiary-5">
                          Req.
                        </th>
                        <th className="whitespace-nowrap px-5 py-4 text-center text-xs font-bold uppercase tracking-[0.04em] text-sibs-tertiary-5">
                          Filled
                        </th>
                        <th className="whitespace-nowrap px-5 py-4 text-center text-xs font-bold uppercase tracking-[0.04em] text-sibs-tertiary-5">
                          Open
                        </th>
                        <th className="whitespace-nowrap px-5 py-4 text-left text-xs font-bold uppercase tracking-[0.04em] text-sibs-tertiary-5">
                          Due Date
                        </th>
                        <th className="whitespace-nowrap px-5 py-4 text-left text-xs font-bold uppercase tracking-[0.04em] text-sibs-tertiary-5">
                          Status
                        </th>
                        <th className="whitespace-nowrap px-5 py-4 text-left text-xs font-bold uppercase tracking-[0.04em] text-sibs-tertiary-5">
                          TA Owner
                        </th>
                        <th className="whitespace-nowrap px-5 py-4 text-center text-xs font-bold uppercase tracking-[0.04em] text-sibs-tertiary-5">
                          Aging
                        </th>
                        <th className="whitespace-nowrap px-5 py-4 text-right text-xs font-bold uppercase tracking-[0.04em] text-sibs-tertiary-5">
                          Action
                        </th>
                      </tr>
                    </thead>

                    <tbody key={search} className="sibs-profile-tab-panel">
                      {filteredRoles.length > 0 ? (
                        filteredRoles.map((role) => (
                          <tr
                            key={role.id}
                            className="transition-all duration-200 hover:bg-slate-50"
                          >
                            <td className="whitespace-nowrap border-t border-[#f3f4f6] px-5 py-4 text-sm text-[#344054]">
                              <p className="m-0 text-sm font-bold text-[#101828]">
                                {role.roleTitle}
                              </p>

                              <p className="mt-0.5 text-xs font-semibold text-sibs-tertiary-5">
                                {role.account}
                              </p>
                            </td>

                            <td className="whitespace-nowrap border-t border-[#f3f4f6] px-5 py-4 text-center text-sm font-bold text-[#344054]">
                              {role.approvedRequirement}
                            </td>

                            <td className="whitespace-nowrap border-t border-[#f3f4f6] px-5 py-4 text-center text-sm font-bold text-green-600">
                              {role.currentFilled}
                            </td>

                            <td className="whitespace-nowrap border-t border-[#f3f4f6] px-5 py-4 text-center text-sm font-bold text-red-600">
                              {role.openSlots}
                            </td>

                            <td className="whitespace-nowrap border-t border-[#f3f4f6] px-5 py-4 text-sm text-[#344054]">
                              {formatDate(role.dueDate)}
                            </td>

                            <td className="whitespace-nowrap border-t border-[#f3f4f6] px-5 py-4 text-sm">
                              <Badge className={getStatusClass(role.status)}>
                                {role.status}
                              </Badge>
                            </td>

                            <td className="whitespace-nowrap border-t border-[#f3f4f6] px-5 py-4 text-sm font-bold text-[#344054]">
                              {role.taOwner}
                            </td>

                            <td className="whitespace-nowrap border-t border-[#f3f4f6] px-5 py-4 text-center text-sm font-bold text-[#344054]">
                              {role.agingDays}d
                            </td>

                            <td className="whitespace-nowrap border-t border-[#f3f4f6] px-5 py-4 text-right">
                              <button
                                type="button"
                                onClick={() => setSelectedRole(role)}
                                className="inline-flex items-center justify-center gap-2 rounded-xl border border-[#e6ecf2] bg-white px-4 py-2 text-xs font-bold text-sibs-primary-1 transition-all duration-200 hover:-translate-y-0.5 hover:border-sibs-primary-1 hover:bg-sibs-primary-1/5 hover:shadow-sm active:scale-[0.98]"
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
                            className="p-10 text-center text-sm font-bold text-gray-500"
                          >
                            No role records found.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="mt-5 flex items-center justify-between gap-4 max-sm:flex-col max-sm:items-stretch">
                <p className="m-0 text-sm font-semibold text-sibs-tertiary-5">
                  Showing 1 to {filteredRoles.length} of{" "}
                  {dashboardRoles.length} roles
                </p>

                <div className="flex items-center gap-2 max-sm:justify-center">
                  <button
                    type="button"
                    className="flex h-9 w-9 items-center justify-center rounded-lg border border-[#e6ecf2] bg-white text-gray-500 transition hover:-translate-y-0.5 hover:shadow-sm active:scale-[0.98]"
                  >
                    <ChevronLeft size={16} />
                  </button>

                  <button
                    type="button"
                    className="flex h-9 w-9 items-center justify-center rounded-lg border border-sibs-primary-1 bg-sibs-primary-1 text-sm font-bold text-white transition hover:-translate-y-0.5 hover:shadow-sm active:scale-[0.98]"
                  >
                    1
                  </button>

                  <button
                    type="button"
                    className="flex h-9 w-9 items-center justify-center rounded-lg border border-[#e6ecf2] bg-white text-gray-500 transition hover:-translate-y-0.5 hover:shadow-sm active:scale-[0.98]"
                  >
                    <ChevronRight size={16} />
                  </button>
                </div>
              </div>
            </div>
          </div>

          <aside
            className="sibs-profile-tab-panel flex flex-col gap-4"
            style={{ animationDelay: "240ms" }}
          >
            <div className="rounded-xl bg-white p-5 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md sm:p-6">
              <h2 className="m-0 text-lg font-bold text-sibs-primary-1">
                Recruiter Load
              </h2>

              <p className="mt-1 text-sm text-sibs-tertiary-5">
                Active roles handled vs output.
              </p>

              <div className="mt-5 flex flex-col gap-4">
                {recruiterLoads.map((item, index) => (
                  <div
                    key={item.recruiter}
                    className="sibs-page-card-in rounded-xl border border-[#e6ecf2] bg-slate-50 p-4 transition-all duration-200 hover:-translate-y-0.5 hover:bg-white hover:shadow-md"
                    style={{ animationDelay: `${Math.min(index * 60, 300)}ms` }}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <h3 className="m-0 text-sm font-bold text-[#101828]">
                          {item.recruiter}
                        </h3>

                        <p className="mt-1 text-xs font-semibold text-sibs-tertiary-5">
                          {item.activeRoles} active role/s · {item.hired} hired
                        </p>
                      </div>

                      <Badge className={getLoadClass(item.loadStatus)}>
                        {item.loadStatus}
                      </Badge>
                    </div>

                    <div className="mt-4 grid grid-cols-3 gap-2 text-center max-sm:grid-cols-1">
                      <div className="rounded-lg bg-white p-3 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-sm">
                        <p className="m-0 text-[10px] font-bold uppercase text-sibs-tertiary-5">
                          Sourced
                        </p>
                        <strong className="mt-1 block text-sm font-bold text-sibs-primary-1">
                          {item.sourced}
                        </strong>
                      </div>

                      <div className="rounded-lg bg-white p-3 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-sm">
                        <p className="m-0 text-[10px] font-bold uppercase text-sibs-tertiary-5">
                          Interviewed
                        </p>
                        <strong className="mt-1 block text-sm font-bold text-sibs-primary-1">
                          {item.interviewed}
                        </strong>
                      </div>

                      <div className="rounded-lg bg-white p-3 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-sm">
                        <p className="m-0 text-[10px] font-bold uppercase text-sibs-tertiary-5">
                          Hired
                        </p>
                        <strong className="mt-1 block text-sm font-bold text-sibs-primary-1">
                          {item.hired}
                        </strong>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-xl border border-blue-200 bg-blue-50 p-5 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md">
              <h3 className="m-0 text-sm font-bold text-sibs-primary-1">
                TA Dashboard Rule
              </h3>

              <p className="mt-2 text-sm leading-6 text-sibs-primary-1/80">
                Dashboard values should be generated from Hiring Needs,
                Candidate Pipeline, Offer Management, Onboarding, and Action
                Items. Avoid manually encoded weekly summaries.
              </p>
            </div>
          </aside>
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