import { useEffect } from "react";
import { Target, X } from "lucide-react";

import {
  formatDate,
  safePercentage,
} from "../../../lib/utils/Dashboards/OMDashboard/omDashboardHelpers.js";

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
  useEffect(() => {
    if (!role) return undefined;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const handleEscape = (event) => {
      if (event.key === "Escape") onClose?.();
    };

    document.addEventListener("keydown", handleEscape);

    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", handleEscape);
    };
  }, [role, onClose]);

  if (!role) return null;

  const progress = safePercentage(role.filled, role.req);

  return (
    <div
      className="sibs-modal-backdrop-in sibs-modal-blur fixed inset-0 z-[1200] flex items-center justify-center p-2 font-jakarta sm:p-4"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose?.();
      }}
    >
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="om-role-kpi-title"
        className="sibs-modal-pop-in flex max-h-[84vh] w-full max-w-[700px] 2xl:max-w-3xl flex-col overflow-hidden rounded-xl bg-[#042C51] font-jakarta shadow-2xl sm:rounded-2xl"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <header className="flex shrink-0 items-center justify-between gap-4 bg-[#042C51] px-5 py-3 text-white sm:px-6 2xl:py-3.5">
          <div className="flex min-w-0 items-center gap-2.5 2xl:gap-3">
            <span className="flex h-8 w-8 2xl:h-8.5 2xl:w-8.5 shrink-0 items-center justify-center rounded-lg bg-[#FF5C28] text-white shadow-sm">
              <Target size={16} />
            </span>
            <div className="min-w-0">
              <h2 id="om-role-kpi-title" className="truncate text-base sm:text-lg 2xl:text-xl font-extrabold text-white">
                Role KPI Details
              </h2>
              <p className="mt-0.5 truncate sibs-text-xs font-semibold text-white/75">
                Manager-accessible recruitment analytics
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-8 w-8 2xl:h-8.5 2xl:w-8.5 shrink-0 items-center justify-center rounded-lg text-white/70 transition hover:bg-white/10 hover:text-white"
            aria-label="Close role details"
          >
            <X size={18} />
          </button>
        </header>

        <div className="flex-1 space-y-2.5 2xl:space-y-3.5 overflow-y-auto bg-white p-3.5 2xl:p-5 sibs-scrollbar">
          <div className="flex flex-col justify-between gap-2.5 rounded-xl border border-[#E6ECF2] bg-[#F8FAFC] p-3 2xl:p-3.5 sm:flex-row sm:items-center">
            <div className="min-w-0">
              <h3 className="break-words text-sm 2xl:text-base font-extrabold text-[#042C51]">
                {role.roleTitle}
              </h3>
              <p className="mt-0.5 break-words sibs-text-micro font-semibold text-[#667085]">
                {role.account} · {role.department}
              </p>
            </div>

            <div className="text-left sm:text-right">
              <span className="block sibs-text-micro font-extrabold uppercase tracking-wide text-[#667085]">
                Progress
              </span>
              <p className="text-lg 2xl:text-xl font-extrabold tabular-nums text-[#FF5C28]">
                {progress}%
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            {[
              ["Requirement", role.req],
              ["Filled", role.filled],
              ["Open", role.open],
              ["Aging", `${role.aging}d`],
            ].map(([label, value]) => (
              <div key={label} className="sibs-info-tile rounded-xl border border-[#E6ECF2] bg-white p-2 2xl:p-2.5 text-center shadow-2xs">
                <span className="block sibs-text-micro font-extrabold uppercase tracking-wide text-[#667085]">{label}</span>
                <p className="mt-0.5 text-base 2xl:text-lg font-extrabold tabular-nums text-[#042C51]">
                  {value}
                </p>
              </div>
            ))}
          </div>

          <div>
            <p className="mb-1.5 sibs-text-micro font-extrabold uppercase tracking-wider text-[#667085]">
              Movement Pipeline Stages
            </p>
            <div className="grid grid-cols-3 gap-1.5 sm:grid-cols-6">
              {Object.entries(role.movement || {}).map(([label, value]) => (
                <div key={label} className="sibs-info-tile rounded-lg border border-[#E6ECF2] bg-[#F8FAFC] p-2 text-center">
                  <span className="block truncate sibs-text-micro font-extrabold uppercase tracking-wider text-[#667085]">
                    {label}
                  </span>
                  <p className="mt-0.5 text-xs 2xl:text-sm font-extrabold tabular-nums text-[#042C51]">
                    {value}
                  </p>
                </div>
              ))}
            </div>
          </div>

          <div className="grid gap-2.5 sm:grid-cols-2 sm:gap-3">
            <div className="rounded-xl border border-blue-200 bg-blue-50/70 p-3">
              <p className="sibs-text-micro font-extrabold uppercase tracking-wider text-blue-700">
                Current Action Item
              </p>
              <p className="mt-1 sibs-text-xs font-semibold leading-relaxed text-blue-950">
                {role.actionItem}
              </p>
            </div>

            <div className="rounded-xl border border-amber-200 bg-amber-50/70 p-3">
              <p className="sibs-text-micro font-extrabold uppercase tracking-wider text-amber-700">
                Delivery Status
              </p>
              <div className="mt-1 flex flex-wrap items-center gap-1.5">
                <span
                  className={`inline-flex rounded border px-2 py-0.5 sibs-text-micro font-extrabold uppercase tracking-wide ${getStatusClass(
                    role.status,
                  )}`}
                >
                  {role.status}
                </span>
                <span className="sibs-text-xs font-bold text-amber-900">
                  Risk: {role.riskFlag}
                </span>
              </div>
              <p className="mt-1.5 sibs-text-xs font-semibold text-amber-900">
                Due: <strong className="font-extrabold">{formatDate(role.dueDate)}</strong> · TA Owner: <strong className="font-extrabold">{role.taOwner}</strong>
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
