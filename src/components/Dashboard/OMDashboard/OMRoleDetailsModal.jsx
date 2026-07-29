import { X } from "lucide-react";

import {
  formatDate,
  safePercentage,
} from "../../../../lib/utils/OMDashboard/omDashboardHelpers.js";

function getStatusClass(status) {
  if (status === "Delayed") {
    return "border-rose-200 bg-rose-50 text-rose-700";
  }

  if (status === "At Risk") {
    return "border-amber-200 bg-amber-50 text-amber-700";
  }

  return "border-emerald-200 bg-emerald-50 text-emerald-700";
}

export default function OMRoleDetailsModal({ role, onClose }) {
  if (!role) return null;

  const progress = safePercentage(role.filled, role.req);

  return (
    <div
      className="fixed inset-0 z-[1200] flex items-center justify-center bg-black/65 p-4 backdrop-blur-[2px]"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <section className="max-h-[90dvh] w-full max-w-3xl overflow-y-auto rounded-2xl border border-[#D9E2EC] bg-white shadow-2xl">
        <header className="flex items-center justify-between gap-4 bg-[#042C51] px-5 py-4 text-white">
          <div>
            <h2 className="text-base font-extrabold">Role KPI Details</h2>
            <p className="mt-1 text-xs text-slate-300">
              Manager-accessible recruitment analytics
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="rounded-lg bg-white/10 p-2 transition hover:bg-white/20"
            aria-label="Close role details"
          >
            <X className="h-4 w-4" />
          </button>
        </header>

        <div className="space-y-5 p-5">
          <div className="flex flex-col justify-between gap-3 rounded-xl border border-[#E6ECF2] bg-[#F8FAFC] p-4 sm:flex-row sm:items-center">
            <div className="min-w-0">
              <h3 className="break-words text-lg font-extrabold text-[#042C51]">
                {role.roleTitle}
              </h3>
              <p className="mt-1 break-words text-sm text-[#667085]">
                {role.account} · {role.department}
              </p>
            </div>

            <div className="text-left sm:text-right">
              <span className="text-[10px] font-extrabold uppercase text-[#667085]">
                Progress
              </span>
              <p className="text-2xl font-extrabold text-[#FF5C28]">
                {progress}%
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {[
              ["Requirement", role.req],
              ["Filled", role.filled],
              ["Open", role.open],
              ["Aging", `${role.aging}d`],
            ].map(([label, value]) => (
              <div key={label} className="sibs-info-tile text-center">
                <span className="sibs-kicker">{label}</span>
                <p className="mt-1 text-xl font-extrabold text-[#042C51]">
                  {value}
                </p>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">
            {Object.entries(role.movement || {}).map(([label, value]) => (
              <div key={label} className="sibs-info-tile text-center">
                <span className="text-[8px] font-extrabold uppercase text-[#667085]">
                  {label}
                </span>
                <p className="mt-1 text-sm font-extrabold text-[#042C51]">
                  {value}
                </p>
              </div>
            ))}
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="rounded-xl border border-blue-200 bg-blue-50 p-4">
              <p className="text-[10px] font-extrabold uppercase text-blue-700">
                Current Action Item
              </p>
              <p className="mt-2 text-sm font-medium leading-6 text-blue-950">
                {role.actionItem}
              </p>
            </div>

            <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
              <p className="text-[10px] font-extrabold uppercase text-amber-700">
                Delivery Status
              </p>
              <div className="mt-2 flex flex-wrap items-center gap-2">
                <span
                  className={`inline-flex rounded border px-2 py-0.5 text-[10px] font-extrabold uppercase ${getStatusClass(
                    role.status,
                  )}`}
                >
                  {role.status}
                </span>
                <span className="text-xs font-bold text-amber-900">
                  Risk: {role.riskFlag}
                </span>
              </div>
              <p className="mt-3 text-xs text-amber-900">
                Due {formatDate(role.dueDate)} · TA Owner: {role.taOwner}
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
