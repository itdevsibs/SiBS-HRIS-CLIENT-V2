/* eslint-disable react-refresh/only-export-components */
import { createElement } from "react";
import {
  ArrowRight,
  BriefcaseBusiness,
  Sparkles,
  Target,
  TrendingDown,
  TrendingUp,
  UsersRound,
  X,
} from "lucide-react";

import PaginationTable from "../../../services/pagination/PaginationTable";

export const OM_SURFACE_CLASS = "sibs-page-card-in sibs-card";

const metricTone = {
  navy: {
    label: "text-[#042C51]",
    icon: "bg-[#E9F0FC] text-[#042C51]",
    value: "text-[#042C51]",
  },
  orange: {
    label: "text-[#FF5C28]",
    icon: "bg-orange-50 text-[#FF5C28]",
    value: "text-[#FF5C28]",
  },
  amber: {
    label: "text-amber-800",
    icon: "bg-amber-50 text-amber-600",
    value: "text-amber-600",
  },
  rose: {
    label: "text-rose-800",
    icon: "bg-rose-50 text-rose-600",
    value: "text-rose-600",
  },
  indigo: {
    label: "text-indigo-800",
    icon: "bg-indigo-50 text-indigo-600",
    value: "text-indigo-600",
  },
  slate: {
    label: "text-slate-700",
    icon: "bg-slate-100 text-slate-700",
    value: "text-slate-700",
  },
};

const pipelineTone = {
  Sourced: "border-blue-200 bg-blue-50 text-blue-700",
  Screened: "border-cyan-200 bg-cyan-50 text-cyan-700",
  Interviewed: "border-amber-200 bg-amber-50 text-amber-700",
  Offered: "border-orange-200 bg-orange-50 text-orange-700",
  Accepted: "border-indigo-200 bg-indigo-50 text-indigo-700",
  Hired: "border-emerald-200 bg-emerald-50 text-emerald-700",
};

function getAnimationStyle(delay = 0) {
  return {
    animationDelay: `${delay}ms`,
    animationFillMode: "both",
  };
}

export function safePercentage(value, total) {
  const safeValue = Number(value || 0);
  const safeTotal = Number(total || 0);

  return safeTotal > 0 ? Math.round((safeValue / safeTotal) * 100) : 0;
}

export function formatDate(value) {
  if (!value) return "—";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";

  return date.toLocaleDateString("en-PH", {
    timeZone: "Asia/Manila",
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function getStatusClass(status) {
  if (status === "On Track") {
    return "border-emerald-200 bg-emerald-50 text-emerald-700";
  }

  if (status === "At Risk") {
    return "border-amber-200 bg-amber-50 text-amber-700";
  }

  if (status === "Delayed") {
    return "border-rose-200 bg-rose-50 text-rose-700";
  }

  return "border-slate-200 bg-slate-50 text-slate-600";
}

function getLoadClass(status) {
  if (status === "High") {
    return "border-rose-200 bg-rose-50 text-rose-700";
  }

  if (status === "Medium") {
    return "border-amber-200 bg-amber-50 text-amber-700";
  }

  return "border-emerald-200 bg-emerald-50 text-emerald-700";
}

function StatusBadge({ status }) {
  return (
    <span
      className={`inline-flex whitespace-nowrap rounded border px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-wide ${getStatusClass(
        status,
      )}`}
    >
      {status || "Unknown"}
    </span>
  );
}

export function OMDashboardToast({ toast, onClose }) {
  if (!toast) return null;

  return (
    <div className="sibs-toast-in fixed right-4 top-20 z-[1200] flex max-w-[370px] items-start gap-3 rounded-r-xl border-l-4 border-[#FF5C28] bg-[#042C51] px-4 py-3 text-white shadow-2xl sm:right-6">
      <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-[#FF5C28]" />
      <div className="min-w-0 flex-1">
        <p className="text-xs font-extrabold">
          {toast.title || "Operations Dashboard Update"}
        </p>
        {toast.message ? (
          <p className="mt-0.5 text-xs leading-relaxed text-slate-200">
            {toast.message}
          </p>
        ) : null}
      </div>
      <button
        type="button"
        onClick={onClose}
        className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md text-slate-300 transition hover:bg-white/10 hover:text-white"
        aria-label="Close toast"
      >
        <X className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}

export function OMWelcomeCard({ currentUser, onOpenHiringPlan }) {
  const accounts = Array.isArray(currentUser?.accounts)
    ? currentUser.accounts
    : [];

  return (
    <section
      className={`sibs-page-header-in relative overflow-hidden ${OM_SURFACE_CLASS} p-5 sm:p-6`}
    >
      <span className="sibs-top-accent" aria-hidden="true" />

      <div className="mt-1 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="min-w-0 space-y-1.5">
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded border border-blue-100 bg-[#E9F0FC] px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-wide text-[#042C51]">
              <span className="h-1.5 w-1.5 rounded-full bg-[#FF5C28] animate-sibs-pulse" />
              Operations Manager View
            </span>
            <span className="inline-flex max-w-full rounded border border-orange-200 bg-orange-50 px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-wide text-[#FF5C28]">
              <span className="truncate">
                Dept: {currentUser?.department || "Unassigned"}
              </span>
            </span>
          </div>

          <h1 className="break-words text-xl font-extrabold tracking-tight text-[#042C51] sm:text-2xl">
            Operations Dashboard
          </h1>
          <p className="text-xs font-semibold leading-relaxed text-[#667085] sm:text-sm">
            Hiring overview filtered by your department and assigned accounts:
            {" "}
            <span className="font-extrabold text-[#042C51]">
              {accounts.length > 0 ? accounts.join(", ") : "No assigned accounts"}
            </span>
            .
          </p>
        </div>

        <button
          type="button"
          onClick={onOpenHiringPlan}
          className="inline-flex h-10 shrink-0 items-center justify-center gap-2 rounded-lg border border-[#E6ECF2] bg-[#F8FAFC] px-3.5 text-xs font-extrabold text-[#042C51] transition hover:border-[#FF5C28]/40 hover:bg-[#FFF0EB] hover:text-[#FF5C28]"
        >
          Return to Hiring Plan
          <ArrowRight className="h-3.5 w-3.5" />
        </button>
      </div>
    </section>
  );
}

export function OMMetricCard({ item, delay = 0 }) {
  const tone = metricTone[item.tone] || metricTone.navy;

  return (
    <article
      className="sibs-metric-card flex flex-col justify-between overflow-hidden p-3.5"
      style={getAnimationStyle(delay)}
    >
      <div className="flex items-start justify-between gap-3">
        <span
          className={`text-[10px] font-extrabold uppercase tracking-wider ${tone.label}`}
        >
          {item.label}
        </span>
        <span
          className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full ${tone.icon}`}
        >
          {item.icon
            ? createElement(item.icon, { size: 14, strokeWidth: 2.2 })
            : null}
        </span>
      </div>

      <div className="mt-2">
        <p className={`text-3xl font-extrabold leading-none tabular-nums tracking-tight ${tone.value}`}>
          {item.value}
        </p>
        <p className="mt-1.5 text-xs font-bold leading-4 text-[#667085]">
          {item.description}
        </p>
      </div>
    </article>
  );
}

export function RequirementProgressPanel({ roles, delay = 0 }) {
  return (
    <section className={`${OM_SURFACE_CLASS} p-5 sm:p-6`} style={getAnimationStyle(delay)}>
      <div>
        <h2 className="sibs-section-title">
          Approved Requirement vs Filled Progress
        </h2>
        <p className="sibs-section-subtitle">
          Current hiring progress for manager-accessible roles
        </p>
      </div>

      <div className="mt-5 max-h-[390px] space-y-4 overflow-y-auto pr-1 thin-scroll">
        {roles.length === 0 ? (
          <div className="sibs-empty-panel">
            No hiring requirements are available for this manager.
          </div>
        ) : (
          roles.map((role) => {
            const percentage = safePercentage(
              role.currentFilled,
              role.approvedRequirement,
            );
            const progressClass =
              role.status === "Delayed"
                ? "bg-rose-500"
                : role.status === "At Risk"
                  ? "bg-amber-400"
                  : "bg-[#FF5C28]";

            return (
              <div key={role.id} className="space-y-1.5">
                <div className="flex flex-col gap-1 text-sm sm:flex-row sm:items-center sm:justify-between">
                  <span className="min-w-0 break-words font-extrabold text-[#042C51]">
                    {role.roleTitle || "Untitled Role"}
                    <span className="ml-1 font-medium text-slate-400">
                      ({role.account || "Unassigned Account"})
                    </span>
                  </span>
                  <span className="shrink-0 font-extrabold text-[#FF5C28]">
                    {Number(role.currentFilled || 0)} /{" "}
                    {Number(role.approvedRequirement || 0)}{" "}
                    <span className="text-[10px] text-slate-400">
                      ({percentage}%)
                    </span>
                  </span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${progressClass}`}
                    style={{ width: `${percentage}%` }}
                  />
                </div>
              </div>
            );
          })
        )}
      </div>
    </section>
  );
}

export function WeeklyMovementPanel({ movement, delay = 0 }) {
  const stages = [
    ["Sourced", Number(movement?.sourced || 0)],
    ["Screened", Number(movement?.screened || 0)],
    ["Interviewed", Number(movement?.interviewed || 0)],
    ["Offered", Number(movement?.offered || 0)],
    ["Accepted", Number(movement?.accepted || 0)],
    ["Hired", Number(movement?.hired || 0)],
  ];
  const conversion = safePercentage(movement?.hired, movement?.sourced);

  return (
    <section className={`${OM_SURFACE_CLASS} p-5 sm:p-6`} style={getAnimationStyle(delay)}>
      <div>
        <h2 className="sibs-section-title">
          Weekly Movement Pipeline
        </h2>
        <p className="sibs-section-subtitle">
          Candidate progression for the manager’s accessible hiring scope
        </p>
      </div>

      <div className="mt-5 grid grid-cols-2 gap-2 text-center sm:grid-cols-3 xl:grid-cols-6">
        {stages.map(([label, count]) => (
          <div
            key={label}
            className={`flex min-h-[74px] flex-col justify-between rounded-xl border p-2.5 ${pipelineTone[label]}`}
          >
            <span className="text-[10px] font-extrabold uppercase tracking-wider">
              {label}
            </span>
            <span className="mt-2 text-lg font-extrabold tabular-nums">
              {count}
            </span>
          </div>
        ))}
      </div>

      <div className="mt-4 flex items-start gap-2.5 rounded-xl border border-slate-200/70 bg-slate-50 p-3">
        <TrendingUp className="mt-0.5 h-4 w-4 shrink-0 text-[#042C51]" />
        <p className="text-xs font-semibold leading-relaxed text-[#667085]">
          Conversion from Sourced to Hired is{" "}
          <span className="font-extrabold text-[#042C51]">
            {conversion}%
          </span>
          . Frontend-only insight: roles marked At Risk or Delayed require
          additional sourcing buffers before the next hiring call.
        </p>
      </div>
    </section>
  );
}

export function ManagerVisibilityNotice({ currentUser }) {
  const accounts = Array.isArray(currentUser?.accounts)
    ? currentUser.accounts
    : [];

  return (
    <div className="rounded-xl border border-blue-200 bg-blue-50 px-3.5 py-3">
      <p className="break-words text-xs font-semibold leading-relaxed text-[#042C51]">
        Viewing only:{" "}
        <strong>{currentUser?.department || "Unassigned Department"}</strong>
        {accounts.length > 0 ? ` · ${accounts.join(", ")}` : ""}
      </p>
    </div>
  );
}

function RoleMobileCard({ role, onViewRole }) {
  return (
    <button
      type="button"
      onClick={() => onViewRole(role)}
      className="sibs-card w-full p-4 text-left transition hover:-translate-y-0.5 hover:border-[#FF5C28]/40 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-[#FF5C28]/30"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="break-words text-base font-extrabold text-[#042C51]">
            {role.roleTitle || "Untitled Role"}
          </h3>
          <p className="mt-0.5 break-words text-xs font-semibold text-[#667085]">
            {role.account || "Unassigned Account"}
          </p>
        </div>
        <StatusBadge status={role.status} />
      </div>

      <div className="mt-4 grid grid-cols-3 gap-2 text-center">
        {[
          ["Req.", role.approvedRequirement, "text-[#042C51]"],
          ["Filled", role.currentFilled, "text-emerald-600"],
          ["Open", role.openSlots, "text-[#FF5C28]"],
        ].map(([label, value, tone]) => (
          <div key={label} className="rounded-lg bg-slate-50 p-2.5">
            <span className="block text-[10px] font-bold uppercase text-slate-400">
              {label}
            </span>
            <span className={`mt-1 block text-base font-extrabold tabular-nums ${tone}`}>
              {Number(value || 0)}
            </span>
          </div>
        ))}
      </div>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-2 text-[10px] font-semibold text-[#667085]">
        <span>
          Owner:{" "}
          <strong className="text-[#042C51]">{role.taOwner || "—"}</strong>
        </span>
        <span>
          Aging:{" "}
          <strong className="text-[#042C51]">
            {Number(role.agingDays || 0)}d
          </strong>
        </span>
      </div>
    </button>
  );
}

export function RoleHiringStatusPanel({
  roles,
  totalRoles,
  searchTerm,
  onSearchChange,
  onViewRole,
  currentUser,
  delay = 0,
  pagination,
}) {
  return (
    <section
      className={`${OM_SURFACE_CLASS} overflow-hidden`}
      style={getAnimationStyle(delay)}
    >
      <div className="border-b border-[#F1F5F9] p-5 sm:p-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h2 className="sibs-section-title">
              Role Hiring Status
            </h2>
            <p className="sibs-section-subtitle">
              Role-level delivery, risk status, aging, and ownership
            </p>
          </div>
          <span className="inline-flex max-w-full self-start rounded border border-amber-200 bg-amber-50 px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-wide text-amber-800">
            Manager Restricted View
          </span>
        </div>

        <div className="mt-4 space-y-3">
          <ManagerVisibilityNotice currentUser={currentUser} />

          <PaginationTable
            className="border-0 bg-transparent p-0 shadow-none"
            showPagination={false}
            searchValue={searchTerm}
            searchPlaceholder="Search by role, account, department, owner, or status..."
            onSearchChange={(value) => onSearchChange(value)}
            controlsClassName="grid grid-cols-1"
            searchClassName="relative w-full"
          />
        </div>
      </div>

      <div className="p-5 sm:p-6">
        <div className="flex flex-col gap-3 lg:hidden">
          {roles.length === 0 ? (
            <div className="sibs-empty-panel">
              No roles match this search within your accessible scope.
            </div>
          ) : (
            roles.map((role) => (
              <RoleMobileCard
                key={role.id}
                role={role}
                onViewRole={onViewRole}
              />
            ))
          )}
        </div>

        <div className="hidden overflow-x-auto rounded-xl border border-[#E6ECF2] lg:block">
          <table className="w-full min-w-[920px] border-collapse text-left text-sm">
            <thead className="bg-[#F8FAFC] text-xs font-extrabold uppercase tracking-wide text-[#667085]">
              <tr>
                <th className="px-4 py-3">Role / Account</th>
                <th className="px-4 py-3 text-center">Req.</th>
                <th className="px-4 py-3 text-center">Filled</th>
                <th className="px-4 py-3 text-center">Open</th>
                <th className="px-4 py-3">Due Date</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">TA Owner</th>
                <th className="px-4 py-3 text-center">Aging</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#EEF2F6]">
              {roles.length === 0 ? (
                <tr>
                  <td
                    colSpan={8}
                    className="px-5 py-10 text-center text-xs font-bold text-[#667085]"
                  >
                    No roles match this search within your accessible scope.
                  </td>
                </tr>
              ) : (
                roles.map((role) => (
                  <tr
                    key={role.id}
                    role="button"
                    tabIndex={0}
                    onClick={() => onViewRole(role)}
                    onKeyDown={(event) => {
                      if (event.key === "Enter" || event.key === " ") {
                        event.preventDefault();
                        onViewRole(role);
                      }
                    }}
                    aria-label={`Open details for ${
                      role.roleTitle || "this role"
                    }`}
                    className="cursor-pointer transition hover:bg-[#FFF7F3] focus:bg-[#FFF7F3] focus:outline-none focus:ring-2 focus:ring-inset focus:ring-[#FF5C28]/30"
                  >
                    <td className="px-4 py-3">
                      <span className="block font-extrabold text-[#042C51]">
                        {role.roleTitle || "Untitled Role"}
                      </span>
                      <span className="mt-0.5 block text-xs font-semibold text-[#667085]">
                        {role.account || "Unassigned Account"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center font-bold text-slate-600">
                      {Number(role.approvedRequirement || 0)}
                    </td>
                    <td className="px-4 py-3 text-center font-extrabold text-emerald-600">
                      {Number(role.currentFilled || 0)}
                    </td>
                    <td className="px-4 py-3 text-center font-extrabold text-[#FF5C28]">
                      {Number(role.openSlots || 0)}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 font-semibold text-[#667085]">
                      {formatDate(role.dueDate)}
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge status={role.status} />
                    </td>
                    <td className="px-4 py-3 font-semibold text-slate-600">
                      {role.taOwner || "—"}
                    </td>
                    <td className="px-4 py-3 text-center font-bold tabular-nums text-[#667085]">
                      {Number(role.agingDays || 0)}d
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {pagination ? (
          <PaginationTable
            className="mt-4"
            showSearch={false}
            currentPage={pagination.currentPage}
            totalPages={pagination.totalPages}
            loadedCount={roles.length}
            totalRecords={pagination.totalItems}
            recordLabel="accessible roles"
            onPrevious={() => pagination.onPageChange(pagination.currentPage - 1)}
            onNext={() => pagination.onPageChange(pagination.currentPage + 1)}
          />
        ) : (
          <p className="mt-4 text-xs font-semibold text-[#667085]">
            Showing {roles.length} of {totalRoles} accessible roles
          </p>
        )}
      </div>
    </section>
  );
}

export function RecruiterLoadPanel({ recruiters, delay = 0 }) {
  return (
    <section
      className={`${OM_SURFACE_CLASS} flex h-full w-full flex-col p-5 sm:p-6`}
      style={getAnimationStyle(delay)}
    >
      <div>
        <h2 className="sibs-section-title">
          Recruiter Load
        </h2>
        <p className="sibs-section-subtitle">
          Active accessible roles versus recruiter output
        </p>
      </div>

      <div className="mt-4 space-y-3">
        {recruiters.length === 0 ? (
          <div className="sibs-empty-panel">
            No recruiter load records are available.
          </div>
        ) : (
          recruiters.map((recruiter) => (
            <article
              key={recruiter.recruiter}
              className="rounded-xl border border-slate-200/80 bg-slate-50 p-3 transition hover:-translate-y-0.5 hover:bg-white hover:shadow-sm"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <h3 className="break-words text-sm font-extrabold leading-tight text-[#042C51]">
                    {recruiter.recruiter}
                  </h3>
                  <p className="mt-1 text-xs font-semibold text-[#667085]">
                    {Number(recruiter.activeRoles || 0)} active roles handled
                  </p>
                </div>
                <span
                  className={`shrink-0 rounded border px-2 py-0.5 text-[10px] font-extrabold uppercase ${getLoadClass(
                    recruiter.loadStatus,
                  )}`}
                >
                  {recruiter.loadStatus || "Normal"} Load
                </span>
              </div>

              <div className="mt-3 grid grid-cols-3 gap-1 border-t border-slate-200/60 pt-2 text-center">
                {[
                  ["Sourced", recruiter.sourced, "text-[#042C51]"],
                  ["Interviewed", recruiter.interviewed, "text-[#042C51]"],
                  ["Hired", recruiter.hired, "text-emerald-600"],
                ].map(([label, value, tone]) => (
                  <div key={label}>
                    <span className="block text-[10px] font-bold uppercase text-slate-400">
                      {label}
                    </span>
                    <span
                      className={`mt-0.5 block text-sm font-extrabold tabular-nums ${tone}`}
                    >
                      {Number(value || 0)}
                    </span>
                  </div>
                ))}
              </div>
            </article>
          ))
        )}
      </div>
    </section>
  );
}



export const OM_METRIC_ICONS = {
  open: BriefcaseBusiness,
  requirement: Target,
  movement: TrendingUp,
  dropOffs: TrendingDown,
  aging: UsersRound,
};
