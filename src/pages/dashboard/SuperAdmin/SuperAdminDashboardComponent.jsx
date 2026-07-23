import React from "react";
import {
  Activity,
  AlertTriangle,
  ArrowRight,
  BriefcaseBusiness,
  CalendarClock,
  CalendarDays,
  CheckCircle2,
  ChevronRight,
  CircleAlert,
  ClipboardCheck,
  Clock3,
  Database,
  FileText,
  Gauge,
  Layers3,
  Loader2,
  RefreshCw,
  RotateCcw,
  Search,
  ShieldAlert,
  ShieldCheck,
  Siren,
  UserRoundX,
  Users,
  WifiOff,
} from "lucide-react";

import { formatDashboardTimestamp } from "./superAdminDashboardModel.js";

const METRIC_ITEMS = [
  {
    key: "activeEmployees",
    label: "Active Employees",
    description: "Current active workforce",
    icon: Users,
    iconClass: "bg-blue-50 text-[#174A7C]",
  },
  {
    key: "pendingApprovals",
    label: "Pending Approvals",
    description: "Across approval modules",
    icon: Clock3,
    iconClass: "bg-amber-50 text-amber-700",
  },
  {
    key: "openHiringNeeds",
    label: "Open Hiring Needs",
    description: "Requirements with remaining HC",
    icon: ClipboardCheck,
    iconClass: "bg-indigo-50 text-indigo-700",
  },
  {
    key: "activeCandidates",
    label: "Active Candidates",
    description: "Current recruitment pipeline",
    icon: BriefcaseBusiness,
    iconClass: "bg-violet-50 text-violet-700",
  },
  {
    key: "attendanceExceptions",
    label: "Attendance Exceptions",
    description: "Unresolved timecard variances",
    icon: AlertTriangle,
    iconClass: "bg-orange-50 text-[#FF5C28]",
  },
  {
    key: "pendingLeaves",
    label: "Pending Leaves",
    description: "Awaiting review or approval",
    icon: CalendarDays,
    iconClass: "bg-cyan-50 text-cyan-700",
  },
  {
    key: "activeResignations",
    label: "Active Resignations",
    description: "Approval and notice-period cases",
    icon: UserRoundX,
    iconClass: "bg-rose-50 text-rose-700",
  },
  {
    key: "criticalExceptions",
    label: "Critical Exceptions",
    description: "High-severity operational risks",
    icon: Siren,
    iconClass: "bg-red-50 text-red-700",
  },
];

export const SUPER_ADMIN_TABS = [
  { id: "overview", label: "Overview & Telemetry", icon: Activity },
  { id: "exceptions", label: "Risk & Exceptions Desk", icon: ShieldAlert },
  { id: "snapshot", label: "Cross-Module Snapshot", icon: Layers3 },
  { id: "activity", label: "System & Module Activity", icon: FileText },
];

const QUICK_ACTIONS = [
  { label: "Employee Directory", path: "/employee", icon: Users },
  { label: "Approval Requests", path: "/approval-request", icon: ClipboardCheck },
  { label: "Hiring Needs", path: "/recruitment/hiring-needs", icon: Gauge },
  {
    label: "Candidate Pipeline",
    path: "/recruitment/candidate-pipeline",
    icon: BriefcaseBusiness,
  },
  { label: "Attendance", path: "/attendance", icon: CalendarClock },
  { label: "Leaves", path: "/leaves", icon: CalendarDays },
  { label: "Resignation Management", path: "/resignation", icon: UserRoundX },
];

function metricStatusClass(status) {
  switch (status) {
    case "positive":
      return "text-emerald-700";
    case "warning":
      return "text-amber-700";
    case "critical":
      return "text-rose-700";
    default:
      return "text-[#344054]";
  }
}

function severityClass(severity) {
  switch (severity) {
    case "High":
      return "border-rose-200 bg-rose-50 text-rose-700";
    case "Medium":
      return "border-amber-200 bg-amber-50 text-amber-700";
    default:
      return "border-blue-200 bg-blue-50 text-blue-700";
  }
}

function activityStatusClass(status) {
  switch (status) {
    case "Success":
      return "border-emerald-200 bg-emerald-50 text-emerald-700";
    case "Flagged":
      return "border-rose-200 bg-rose-50 text-rose-700";
    default:
      return "border-blue-200 bg-blue-50 text-blue-700";
  }
}

export function SectionState({
  state,
  title,
  message,
  onRetry,
  compact = false,
}) {
  if (state === "loading") {
    return (
      <div
        aria-busy="true"
        className={`rounded-2xl border border-[#E6ECF2] bg-white ${
          compact ? "p-4" : "p-6"
        }`}
      >
        <div className="flex items-center gap-3 text-[#667085]">
          <Loader2 className="h-4 w-4 animate-spin text-[#FF5C28]" />
          <span className="text-xs font-bold">Loading dashboard data...</span>
        </div>
        <div className="mt-4 space-y-2">
          <div className="h-3 w-full animate-pulse rounded bg-slate-100" />
          <div className="h-3 w-4/5 animate-pulse rounded bg-slate-100" />
        </div>
      </div>
    );
  }

  if (state === "error" || state === "unavailable") {
    return (
      <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5">
        <div className="flex items-start gap-3">
          <WifiOff className="mt-0.5 h-5 w-5 shrink-0 text-amber-700" />
          <div className="min-w-0 flex-1">
            <p className="text-sm font-extrabold text-[#042C51]">{title}</p>
            <p className="mt-1 text-xs font-semibold leading-5 text-amber-800">
              {message}
            </p>
            {onRetry && (
              <button
                type="button"
                onClick={onRetry}
                className="mt-3 inline-flex h-9 items-center gap-2 rounded-lg bg-[#042C51] px-3 text-xs font-extrabold text-white transition hover:bg-[#FF5C28]"
              >
                <RefreshCw size={14} />
                Retry
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  if (state === "empty") {
    return (
      <div className="rounded-2xl border border-dashed border-[#D6DEE8] bg-[#F8FAFC] p-7 text-center">
        <CheckCircle2 className="mx-auto h-8 w-8 text-emerald-500" />
        <p className="mt-3 text-sm font-extrabold text-[#042C51]">{title}</p>
        <p className="mt-1 text-xs font-semibold text-[#667085]">{message}</p>
      </div>
    );
  }

  return null;
}

export function SuperAdminHeader({
  generatedAt,
  stale,
  partial,
  refreshing,
  onRefresh,
  onNavigate,
}) {
  const healthLabel = stale
    ? "Data may be outdated"
    : partial
      ? "Partial data available"
      : "System governance online";

  const healthClass = stale
    ? "border-amber-200 bg-amber-50 text-amber-700"
    : partial
      ? "border-blue-200 bg-blue-50 text-blue-700"
      : "border-emerald-200 bg-emerald-50 text-emerald-700";

  return (
    <section className="sibs-page-header-in overflow-hidden rounded-2xl border border-[#D9E2EC] bg-white shadow-sm">
      <div className="h-1.5 bg-[#FF5C28]" />
      <div className="flex flex-col gap-5 p-5 sm:p-6 xl:flex-row xl:items-center xl:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-2 rounded-full bg-[#042C51] px-3 py-1 text-[10px] font-extrabold uppercase tracking-wide text-white">
              <ShieldCheck size={14} className="text-[#FF5C28]" />
              Super Admin Operations Dashboard
            </span>
            <span
              className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-[10px] font-extrabold uppercase tracking-wide ${healthClass}`}
            >
              <span className="h-1.5 w-1.5 rounded-full bg-current" />
              {healthLabel}
            </span>
          </div>

          <h1 className="mt-3 text-2xl font-extrabold tracking-tight text-[#042C51] sm:text-3xl">
            Whole-System HRIS Operations & Governance
          </h1>
          <p className="mt-1 max-w-4xl text-sm font-medium leading-6 text-[#667085]">
            Unified visibility across HR operations, Talent Acquisition, and
            Operations Management without duplicating their detailed workflows.
          </p>
          <p className="mt-2 text-xs font-bold text-[#7E8DA8]">
            Last updated: {formatDashboardTimestamp(generatedAt)}
          </p>
        </div>

        <div className="flex flex-col gap-2 sm:flex-row">
          <button
            type="button"
            onClick={onRefresh}
            disabled={refreshing}
            className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-[#D6DEE8] bg-white px-4 text-sm font-extrabold text-[#042C51] transition hover:border-[#042C51] hover:bg-[#F8FAFC] disabled:cursor-not-allowed disabled:opacity-60"
          >
            <RefreshCw
              size={16}
              className={refreshing ? "animate-spin" : ""}
            />
            {refreshing ? "Refreshing..." : "Refresh"}
          </button>
          <button
            type="button"
            onClick={() => onNavigate("/employee")}
            className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-[#FF5C28] px-4 text-sm font-extrabold text-white shadow-sm transition hover:-translate-y-0.5 hover:bg-[#E95324] hover:shadow-md active:scale-[0.98]"
          >
            <Users size={16} />
            Employee Directory
          </button>
        </div>
      </div>
    </section>
  );
}

export function SuperAdminMetricGrid({ metrics, state }) {
  if (state === "loading") {
    return (
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4 2xl:grid-cols-8">
        {METRIC_ITEMS.map((metric) => (
          <SectionState key={metric.key} state="loading" compact />
        ))}
      </div>
    );
  }

  if (state === "error" || state === "unavailable") {
    return (
      <SectionState
        state={state}
        title="Summary metrics unavailable"
        message="The command center could not load the global metrics section. Other dashboard sections may still be available."
      />
    );
  }

  return (
    <section className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4 2xl:grid-cols-8">
      {METRIC_ITEMS.map(({ key, label, description, icon: Icon, iconClass }) => (
        <article
          key={key}
          className="rounded-2xl border border-[#E6ECF2] bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:border-[#042C51]/20 hover:shadow-md"
        >
          <div className="flex items-start justify-between gap-3">
            <p className="text-[10px] font-extrabold uppercase tracking-wide text-[#667085]">
              {label}
            </p>
            <span
              className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-xl ${iconClass}`}
            >
              <Icon size={16} />
            </span>
          </div>
          <p className="mt-3 text-2xl font-extrabold leading-none text-[#042C51]">
            {Number(metrics?.[key] || 0).toLocaleString("en-PH")}
          </p>
          <p className="mt-2 text-[10px] font-semibold leading-4 text-[#7E8DA8]">
            {description}
          </p>
        </article>
      ))}
    </section>
  );
}

export function SuperAdminQuickActions({ onNavigate }) {
  return (
    <section className="rounded-2xl border border-[#E6ECF2] bg-white p-4 shadow-sm sm:p-5">
      <div className="flex flex-col gap-1 border-b border-[#EEF2F6] pb-3 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="text-sm font-extrabold text-[#042C51]">
          Operations Quick Actions
        </h2>
        <span className="text-[10px] font-extrabold uppercase tracking-wide text-[#98A2B3]">
          Navigation only
        </span>
      </div>
      <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-7">
        {QUICK_ACTIONS.map(({ label, path, icon: Icon }) => (
          <button
            key={path}
            type="button"
            onClick={() => onNavigate(path)}
            className="group flex min-h-24 flex-col items-start justify-between rounded-xl border border-[#E6ECF2] bg-[#F8FAFC] p-3 text-left transition hover:-translate-y-0.5 hover:border-[#FF5C28]/40 hover:bg-[#FFF7F3] hover:shadow-sm"
          >
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#042C51] text-white transition group-hover:bg-[#FF5C28]">
              <Icon size={15} />
            </span>
            <span className="mt-3 text-xs font-extrabold leading-4 text-[#042C51]">
              {label}
            </span>
          </button>
        ))}
      </div>
    </section>
  );
}

function FilterSelect({ label, value, options, onChange }) {
  return (
    <label className="block min-w-0">
      <span className="mb-1 block text-xs font-extrabold text-[#344054]">
        {label}
      </span>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="h-11 w-full rounded-xl border border-[#D0D5DD] bg-white px-3 text-sm font-bold text-[#344054] outline-none transition focus:border-[#FF5C28] focus:ring-4 focus:ring-[#FF5C28]/10"
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

export function SuperAdminFilters({
  filters,
  onChange,
  onReset,
  sourceOptions,
  moduleOptions,
  statusOptions,
}) {
  return (
    <section className="rounded-2xl border border-[#E6ECF2] bg-white p-4 shadow-sm sm:p-5">
      <div className="grid grid-cols-1 gap-3 lg:grid-cols-[1.5fr_repeat(4,minmax(0,0.7fr))_auto] lg:items-end">
        <label className="block min-w-0">
          <span className="mb-1 block text-xs font-extrabold text-[#344054]">
            Search Command Center
          </span>
          <span className="relative block">
            <Search
              size={17}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-[#98A2B3]"
            />
            <input
              type="text"
              value={filters.search}
              onChange={(event) => onChange("search", event.target.value)}
              placeholder="Search snapshots, exceptions, or activity..."
              className="h-11 w-full rounded-xl border border-[#D0D5DD] bg-white pl-10 pr-3 text-sm font-semibold text-[#344054] outline-none transition placeholder:text-[#98A2B3] focus:border-[#FF5C28] focus:ring-4 focus:ring-[#FF5C28]/10"
            />
          </span>
        </label>

        <FilterSelect
          label="Source Dashboard"
          value={filters.source}
          options={sourceOptions}
          onChange={(value) => onChange("source", value)}
        />
        <FilterSelect
          label="Target Module"
          value={filters.module}
          options={moduleOptions}
          onChange={(value) => onChange("module", value)}
        />
        <FilterSelect
          label="Severity"
          value={filters.severity}
          options={["All Severities", "High", "Medium", "Low"]}
          onChange={(value) => onChange("severity", value)}
        />
        <FilterSelect
          label="Status"
          value={filters.status}
          options={statusOptions}
          onChange={(value) => onChange("status", value)}
        />

        <button
          type="button"
          onClick={onReset}
          className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-[#D6DEE8] bg-white px-4 text-sm font-extrabold text-[#042C51] transition hover:bg-[#F8FAFC] active:scale-[0.98]"
        >
          <RotateCcw size={16} />
          Reset
        </button>
      </div>
    </section>
  );
}

export function SuperAdminTabs({ activeTab, onChange, counts }) {
  return (
    <div
      role="tablist"
      aria-label="Super Admin dashboard sections"
      className="flex overflow-x-auto border-b border-[#E6ECF2] bg-[#F8FAFC] px-3 pt-3 no-scrollbar sm:px-4"
    >
      {SUPER_ADMIN_TABS.map(({ id, label, icon: Icon }) => {
        const active = activeTab === id;
        const count = counts?.[id];

        return (
          <button
            key={id}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onChange(id)}
            className={`inline-flex shrink-0 items-center gap-2 border-b-2 px-4 py-3 text-xs font-extrabold uppercase tracking-wide transition sm:px-5 ${
              active
                ? "rounded-t-xl border-[#FF5C28] bg-white text-[#042C51]"
                : "border-transparent text-[#667085] hover:text-[#042C51]"
            }`}
          >
            <Icon size={15} className={active ? "text-[#FF5C28]" : ""} />
            {label}
            {Number.isFinite(Number(count)) && (
              <span
                className={`rounded-full px-2 py-0.5 text-[9px] ${
                  active
                    ? "bg-[#042C51] text-white"
                    : "bg-slate-200 text-slate-600"
                }`}
              >
                {Number(count)}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}

function SnapshotCard({ snapshot, state, onNavigate }) {
  if (state === "error" || state === "unavailable") {
    return (
      <SectionState
        state={state}
        title={`${snapshot?.title || "Dashboard"} unavailable`}
        message="This source dashboard did not return summary data. Other command-center sections remain usable."
        compact
      />
    );
  }

  if (!snapshot) return null;

  return (
    <article className="flex h-full flex-col rounded-2xl border border-[#E6ECF2] bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-[#042C51]/20 hover:shadow-md">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[10px] font-extrabold uppercase tracking-wide text-[#FF5C28]">
            Source Dashboard
          </p>
          <h3 className="mt-1 text-base font-extrabold text-[#042C51]">
            {snapshot.title}
          </h3>
          <p className="mt-1 text-xs font-semibold leading-5 text-[#667085]">
            {snapshot.subtitle || "Operational summary"}
          </p>
        </div>
        <span
          className={`rounded-full px-2.5 py-1 text-[10px] font-extrabold ${
            snapshot.criticalCount > 0
              ? "bg-rose-50 text-rose-700"
              : "bg-emerald-50 text-emerald-700"
          }`}
        >
          {snapshot.criticalCount} critical
        </span>
      </div>

      <div className="mt-5 rounded-xl bg-[#F8FAFC] p-4">
        <p className="text-[10px] font-extrabold uppercase tracking-wide text-[#98A2B3]">
          {snapshot.primaryLabel}
        </p>
        <p className="mt-1 text-2xl font-extrabold text-[#042C51]">
          {snapshot.primaryValue}
        </p>
      </div>

      <div className="mt-3 grid grid-cols-2 gap-2">
        {snapshot.secondaryMetrics.length > 0 ? (
          snapshot.secondaryMetrics.map((metric) => (
            <div
              key={`${snapshot.key}-${metric.label}`}
              className="rounded-xl border border-[#EEF2F6] bg-white p-3"
            >
              <p className="text-[9px] font-extrabold uppercase tracking-wide text-[#98A2B3]">
                {metric.label}
              </p>
              <p
                className={`mt-1 text-sm font-extrabold ${metricStatusClass(
                  metric.status,
                )}`}
              >
                {metric.value}
              </p>
            </div>
          ))
        ) : (
          <p className="col-span-2 rounded-xl bg-[#F8FAFC] p-3 text-xs font-semibold text-[#7E8DA8]">
            No secondary metrics were returned.
          </p>
        )}
      </div>

      <div className="mt-auto flex items-center justify-between gap-3 pt-5">
        <span className="text-[10px] font-semibold text-[#98A2B3]">
          Updated {formatDashboardTimestamp(snapshot.lastUpdated)}
        </span>
        {snapshot.moduleTarget && (
          <button
            type="button"
            onClick={() => onNavigate(snapshot.moduleTarget)}
            className="inline-flex items-center gap-1 text-xs font-extrabold text-[#FF5C28] hover:underline"
          >
            Open Dashboard
            <ChevronRight size={14} />
          </button>
        )}
      </div>
    </article>
  );
}

export function OverviewTelemetry({
  snapshots,
  availability,
  criticalCount,
  pendingApprovals,
  onNavigate,
}) {
  const byKey = Object.fromEntries(snapshots.map((item) => [item.key, item]));

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        {["hr", "ta", "om"].map((key) => (
          <SnapshotCard
            key={key}
            snapshot={byKey[key] || {
              key,
              title:
                key === "hr"
                  ? "HR Operations"
                  : key === "ta"
                    ? "Talent Acquisition"
                    : "Operations Management",
            }}
            state={availability?.[key] || "unavailable"}
            onNavigate={onNavigate}
          />
        ))}
      </div>

      <section className="overflow-hidden rounded-2xl bg-[#042C51] text-white shadow-sm">
        <div className="h-1.5 bg-[#FF5C28]" />
        <div className="flex flex-col gap-4 p-5 sm:p-6 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <Siren size={18} className="text-[#FF5C28]" />
              <h3 className="text-sm font-extrabold uppercase tracking-wide">
                Operational Focus
              </h3>
            </div>
            <p className="mt-2 max-w-3xl text-xs font-semibold leading-5 text-slate-200">
              {criticalCount > 0
                ? `${criticalCount} high-severity exception${criticalCount === 1 ? "" : "s"} require review. ${pendingApprovals} approval request${pendingApprovals === 1 ? " is" : "s are"} also pending across source modules.`
                : `No high-severity exceptions are currently active. ${pendingApprovals} approval request${pendingApprovals === 1 ? " remains" : "s remain"} pending.`}
            </p>
          </div>
          <button
            type="button"
            onClick={() => onNavigate("/approval-request")}
            className="inline-flex h-10 shrink-0 items-center justify-center gap-2 rounded-xl bg-[#FF5C28] px-4 text-xs font-extrabold text-white transition hover:bg-[#E95324]"
          >
            Open Approval Requests
            <ArrowRight size={15} />
          </button>
        </div>
      </section>
    </div>
  );
}

export function RiskExceptionsDesk({
  items,
  state,
  errorMessage,
  onNavigate,
  onRetry,
}) {
  if (state === "loading") {
    return <SectionState state="loading" title="Loading exceptions" />;
  }

  if (state === "error" || state === "unavailable") {
    return (
      <SectionState
        state={state}
        title="Risk and exceptions data unavailable"
        message={
          errorMessage ||
          "The backend did not return the operational exceptions section."
        }
        onRetry={onRetry}
      />
    );
  }

  if (items.length === 0) {
    return (
      <SectionState
        state="empty"
        title="No active exceptions found"
        message="All returned cross-module records are within the current monitoring thresholds."
      />
    );
  }

  return (
    <div className="space-y-3">
      {items.map((item) => (
        <article
          key={item.id}
          className="rounded-2xl border border-[#E6ECF2] bg-white p-4 shadow-sm transition hover:border-[#FF5C28]/35 sm:p-5"
        >
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <span
                  className={`rounded-full border px-2.5 py-1 text-[9px] font-extrabold uppercase tracking-wide ${severityClass(
                    item.severity,
                  )}`}
                >
                  {item.severity} severity
                </span>
                <span className="text-[10px] font-extrabold uppercase tracking-wide text-[#7E8DA8]">
                  {item.category}
                </span>
              </div>
              <h3 className="mt-2 text-sm font-extrabold text-[#042C51]">
                {item.title}
              </h3>
              <p className="mt-1 text-xs font-semibold leading-5 text-[#667085]">
                {item.description || "No additional description was returned."}
              </p>
            </div>
            <span className="shrink-0 rounded-full bg-[#F2F6FA] px-2.5 py-1 text-[10px] font-extrabold text-[#475467]">
              {item.status}
            </span>
          </div>

          <div className="mt-4 flex flex-col gap-3 border-t border-[#EEF2F6] pt-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-wrap gap-x-4 gap-y-1 text-[10px] font-semibold text-[#7E8DA8]">
              <span>
                Module: <strong className="text-[#344054]">{item.moduleTarget || "Not assigned"}</strong>
              </span>
              <span>
                Owner: <strong className="text-[#344054]">{item.assignedTo || "Unassigned"}</strong>
              </span>
              <span>
                Age: <strong className="text-[#344054]">{item.daysPending === null ? "Not available" : `${item.daysPending} day${item.daysPending === 1 ? "" : "s"}`}</strong>
              </span>
            </div>
            <div className="flex gap-2">
              {item.recordPath && (
                <button
                  type="button"
                  onClick={() => onNavigate(item.recordPath)}
                  className="inline-flex h-9 items-center gap-1 rounded-lg border border-[#D6DEE8] bg-white px-3 text-xs font-extrabold text-[#042C51] hover:bg-[#F8FAFC]"
                >
                  View Record
                  <ChevronRight size={14} />
                </button>
              )}
              {item.moduleTarget && (
                <button
                  type="button"
                  onClick={() => onNavigate(item.moduleTarget)}
                  className="inline-flex h-9 items-center gap-1 rounded-lg bg-[#042C51] px-3 text-xs font-extrabold text-white hover:bg-[#FF5C28]"
                >
                  Open Module
                  <ArrowRight size={14} />
                </button>
              )}
            </div>
          </div>
        </article>
      ))}
    </div>
  );
}

export function CrossModuleSnapshot({ snapshots, availability, onNavigate }) {
  if (snapshots.length === 0) {
    return (
      <SectionState
        state="empty"
        title="No dashboard snapshots returned"
        message="The summary endpoint returned no source-dashboard panels."
      />
    );
  }

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
      {snapshots.map((snapshot) => (
        <SnapshotCard
          key={snapshot.key}
          snapshot={snapshot}
          state={availability?.[snapshot.key] || "available"}
          onNavigate={onNavigate}
        />
      ))}
    </div>
  );
}

export function SystemActivity({
  items,
  state,
  errorMessage,
  onRetry,
}) {
  if (state === "loading") {
    return <SectionState state="loading" title="Loading activity" />;
  }

  if (state === "error" || state === "unavailable") {
    return (
      <SectionState
        state={state}
        title="System activity unavailable"
        message={
          errorMessage ||
          "System activity data is not available from the current backend."
        }
        onRetry={onRetry}
      />
    );
  }

  if (items.length === 0) {
    return (
      <SectionState
        state="empty"
        title="No recent activity returned"
        message="No audit records matched the active filters."
      />
    );
  }

  return (
    <div>
      <div className="space-y-3 lg:hidden">
        {items.map((item) => (
          <article
            key={item.id}
            className="rounded-2xl border border-[#E6ECF2] bg-white p-4 shadow-sm"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-xs font-extrabold text-[#042C51]">
                  {item.action}
                </p>
                <p className="mt-1 truncate text-[10px] font-semibold text-[#667085]">
                  {item.actor} • {item.module}
                </p>
              </div>
              <span
                className={`rounded-full border px-2 py-1 text-[9px] font-extrabold uppercase ${activityStatusClass(
                  item.status,
                )}`}
              >
                {item.status}
              </span>
            </div>
            <p className="mt-3 text-xs font-semibold leading-5 text-[#475467]">
              {item.details || "No details were returned."}
            </p>
            <p className="mt-3 text-[10px] font-semibold text-[#98A2B3]">
              {formatDashboardTimestamp(item.timestamp)}
            </p>
          </article>
        ))}
      </div>

      <div className="hidden overflow-hidden rounded-2xl border border-[#D9E2EC] bg-white lg:block">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1050px] border-collapse text-left text-xs">
            <thead>
              <tr className="border-b border-[#D9E2EC] bg-[#F8FAFC] text-[10px] font-extrabold uppercase tracking-wide text-[#667085]">
                <th className="px-4 py-3">Timestamp</th>
                <th className="px-4 py-3">Actor</th>
                <th className="px-4 py-3">Access Level</th>
                <th className="px-4 py-3">Module</th>
                <th className="px-4 py-3">Action</th>
                <th className="px-4 py-3">Details</th>
                <th className="px-4 py-3 text-center">Result</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#EEF2F6]">
              {items.map((item) => (
                <tr key={item.id} className="hover:bg-[#F8FAFC]">
                  <td className="whitespace-nowrap px-4 py-3 font-mono text-[10px] font-semibold text-[#7E8DA8]">
                    {formatDashboardTimestamp(item.timestamp)}
                  </td>
                  <td className="px-4 py-3 font-extrabold text-[#042C51]">
                    {item.actor}
                  </td>
                  <td className="px-4 py-3 text-[#667085]">
                    {item.accessLevel || "—"}
                  </td>
                  <td className="px-4 py-3 font-bold text-[#344054]">
                    {item.module}
                  </td>
                  <td className="px-4 py-3 font-mono text-[10px] font-extrabold text-[#FF5C28]">
                    {item.action}
                  </td>
                  <td className="max-w-[360px] px-4 py-3 text-[#667085]">
                    {item.details || "—"}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span
                      className={`inline-flex rounded-full border px-2 py-1 text-[9px] font-extrabold uppercase ${activityStatusClass(
                        item.status,
                      )}`}
                    >
                      {item.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export function CommandCenterPageError({ message, onRetry }) {
  return (
    <section className="rounded-2xl border border-rose-200 bg-rose-50 p-5 shadow-sm">
      <div className="flex items-start gap-3">
        <CircleAlert className="mt-0.5 h-5 w-5 shrink-0 text-rose-700" />
        <div className="min-w-0 flex-1">
          <h2 className="text-sm font-extrabold text-[#042C51]">
            Dashboard request failed
          </h2>
          <p className="mt-1 text-xs font-semibold leading-5 text-rose-700">
            {message}
          </p>
          <button
            type="button"
            onClick={onRetry}
            className="mt-3 inline-flex h-9 items-center gap-2 rounded-lg bg-[#042C51] px-3 text-xs font-extrabold text-white hover:bg-[#FF5C28]"
          >
            <RefreshCw size={14} />
            Retry request
          </button>
        </div>
      </div>
    </section>
  );
}