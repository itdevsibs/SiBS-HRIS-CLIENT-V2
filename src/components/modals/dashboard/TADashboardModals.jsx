import { useEffect } from "react";
import {
  CheckCircle2,
  Link2,
  ShieldAlert,
  Target,
  X,
} from "lucide-react";

import {
  formatDate,
  safePercentage,
} from "../../../pages/dashboard/TADashboard/TADashboardComponents";

const movementStages = [
  ["Sourced", "sourced"],
  ["Screened", "screened"],
  ["Interviewed", "interviewed"],
  ["Offered", "offered"],
  ["Accepted", "accepted"],
  ["Hired", "hired"],
];

function safeValue(value, fallback = "—") {
  return value === null || value === undefined || value === ""
    ? fallback
    : value;
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

function getRiskClass(riskFlag) {
  if (riskFlag === "High") {
    return "border-rose-200 bg-rose-50 text-rose-700";
  }

  if (riskFlag === "Medium") {
    return "border-amber-200 bg-amber-50 text-amber-700";
  }

  if (riskFlag === "Low") {
    return "border-blue-200 bg-blue-50 text-blue-700";
  }

  return "border-slate-200 bg-slate-50 text-slate-600";
}

function DeliveryDetail({ label, value }) {
  return (
    <div className="rounded-lg border border-[#E6ECF2] bg-white p-3">
      <span className="block text-[10px] font-extrabold uppercase tracking-wide text-slate-400">
        {label}
      </span>
      <span className="mt-1 block break-words text-xs font-extrabold text-[#042C51]">
        {safeValue(value)}
      </span>
    </div>
  );
}

export function RoleKpiDetailsModal({ open, role, onClose, onToast }) {
  useEffect(() => {
    if (!open) return undefined;

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
  }, [open, onClose]);

  if (!open || !role) return null;

  const progress = safePercentage(role.filled, role.req);

  const handleShare = async () => {
    try {
      const url = new URL(window.location.href);
      url.searchParams.set("role", role.id || "selected-role");

      if (!navigator.clipboard?.writeText) {
        throw new Error("Clipboard API unavailable");
      }

      await navigator.clipboard.writeText(url.toString());
      onToast?.({
        title: "Role Link Copied",
        message: `${safeValue(role.role, "Selected role")} was copied to the clipboard.`,
      });
    } catch {
      onToast?.({
        title: "Share Link Ready",
        message:
          "Clipboard access is unavailable. Copy the current browser URL manually.",
      });
    }
  };

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
        aria-labelledby="ta-role-kpi-title"
        className="sibs-modal-pop-in flex max-h-[calc(100dvh-1rem)] w-full max-w-4xl flex-col overflow-hidden rounded-xl bg-[#042C51] font-jakarta shadow-2xl sm:max-h-[88vh] sm:rounded-2xl"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <header className="flex shrink-0 items-center justify-between gap-3 bg-[#042C51] px-3 py-3 text-white sm:gap-4 sm:px-5 sm:py-3.5">
          <div className="flex min-w-0 items-center gap-3">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#FF5C28]">
              <Target className="h-[18px] w-[18px]" />
            </span>
            <div className="min-w-0">
              <h2
                id="ta-role-kpi-title"
                className="truncate text-base font-extrabold"
              >
                Role KPI Details
              </h2>
              <p className="mt-0.5 truncate text-xs text-slate-300">
                Recruitment dashboard analytics
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white/10 text-white transition hover:bg-white/20"
            aria-label="Close role details"
          >
            <X className="h-4 w-4" />
          </button>
        </header>

        <div className="min-h-0 flex-1 overflow-y-auto bg-white p-3 text-[#101828] sm:p-6">
          <div className="space-y-5">
            <section className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-slate-50 p-3 sm:flex-row sm:items-center sm:justify-between sm:p-4">
              <div className="min-w-0">
                <h3 className="break-words text-base font-extrabold text-[#042C51]">
                  {safeValue(role.role, "Untitled Role")}
                </h3>
                <p className="mt-1 break-words text-xs font-semibold leading-relaxed text-[#667085]">
                  {safeValue(role.roleAccount, role.account)}
                </p>

                <div className="mt-2 flex flex-wrap gap-1.5">
                  <span
                    className={`inline-flex rounded border px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-wide ${getStatusClass(
                      role.status,
                    )}`}
                  >
                    {safeValue(role.status, "Unknown")}
                  </span>
                  <span
                    className={`inline-flex rounded border px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-wide ${getRiskClass(
                      role.riskFlag,
                    )}`}
                  >
                    Risk: {safeValue(role.riskFlag, "None")}
                  </span>
                </div>
              </div>

              <div className="shrink-0 text-left sm:text-right">
                <span className="block text-xs font-extrabold uppercase text-slate-400">
                  Progress
                </span>
                <span className="mt-1 block text-3xl font-extrabold tabular-nums text-[#FF5C28]">
                  {progress}%
                </span>
              </div>
            </section>

            <section>
              <h3 className="text-base font-extrabold text-[#042C51]">
                Weekly Movement Breakdown
              </h3>
              <div className="mt-3 grid grid-cols-2 gap-2 text-center sm:grid-cols-3 lg:grid-cols-6">
                {movementStages.map(([label, key]) => (
                  <div
                    key={key}
                    className="rounded-lg border border-slate-100 bg-slate-50 p-2.5"
                  >
                    <span className="block text-[10px] font-bold uppercase leading-none text-slate-400">
                      {label}
                    </span>
                    <span className="mt-1.5 block text-base font-extrabold tabular-nums text-[#042C51]">
                      {Number(role.movement?.[key] || 0)}
                    </span>
                  </div>
                ))}
              </div>
            </section>

            <section className="rounded-xl border border-blue-200/60 bg-blue-50/60 p-3.5">
              <span className="block text-[10px] font-extrabold uppercase text-blue-600">
                Current Action Item
              </span>
              <p className="mt-1 text-xs font-semibold leading-relaxed text-blue-950">
                {safeValue(role.actionItem, "No action item has been assigned.")}
              </p>
            </section>

            <section className="rounded-xl border border-slate-200 bg-slate-50/60 p-3.5">
              <div className="flex items-center gap-2">
                <ShieldAlert className="h-4 w-4 text-[#FF5C28]" />
                <span className="block text-[10px] font-extrabold uppercase tracking-wide text-slate-500">
                  Role Delivery Details
                </span>
              </div>

              <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
                <DeliveryDetail
                  label="Role / Account"
                  value={safeValue(role.roleAccount, role.account)}
                />
                <DeliveryDetail label="TA Owner" value={role.taOwner} />
                <DeliveryDetail
                  label="Due Date"
                  value={formatDate(role.dueDate)}
                />
                <DeliveryDetail
                  label="Aging"
                  value={`${Number(role.aging || 0)} days`}
                />
                <DeliveryDetail label="Risk Flag" value={role.riskFlag} />
                <DeliveryDetail label="Status" value={role.status} />
              </div>
            </section>

            <section className="rounded-xl border border-slate-200 bg-slate-50/60 p-3.5">
              <span className="block text-[10px] font-extrabold uppercase tracking-wide text-slate-400">
                Role Snapshot KPI Matrix
              </span>
              <div className="mt-3 grid grid-cols-2 gap-3 text-center sm:grid-cols-4">
                {[
                  ["Requisition", role.req, "text-[#042C51]"],
                  ["Filled", role.filled, "text-emerald-600"],
                  ["Pending", role.open, "text-[#FF5C28]"],
                  ["Drop-Offs", role.dropOffs, "text-rose-500"],
                ].map(([label, value, tone]) => (
                  <div key={label} className="rounded-lg bg-white p-3">
                    <span className="block text-[10px] font-bold text-slate-400">
                      {label}
                    </span>
                    <span
                      className={`mt-1 block text-base font-extrabold tabular-nums ${tone}`}
                    >
                      {Number(value || 0)}
                    </span>
                  </div>
                ))}
              </div>
            </section>
          </div>
        </div>

        <footer className="flex shrink-0 flex-col gap-3 border-t border-[#E6ECF2] bg-[#F8FAFC] px-3 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <p className="text-center text-[10px] font-semibold leading-relaxed text-[#667085] sm:text-left">
            Frontend-only TA data. Values remain unchanged after applying the new theme.
          </p>
          <div className="grid w-full grid-cols-1 gap-2 sm:flex sm:w-auto">
            <button
              type="button"
              onClick={handleShare}
              className="inline-flex h-9 w-full items-center justify-center gap-2 rounded-lg bg-slate-100 px-3 text-xs font-bold text-slate-700 transition hover:bg-slate-200 sm:w-auto"
            >
              <Link2 className="h-3.5 w-3.5" />
              Share Link
            </button>
            <button
              type="button"
              onClick={onClose}
              className="inline-flex h-9 w-full items-center justify-center gap-2 rounded-lg bg-[#042C51] px-3 text-xs font-extrabold text-white transition hover:bg-[#FF5C28] sm:w-auto"
            >
              <CheckCircle2 className="h-3.5 w-3.5" />
              Close Details
            </button>
          </div>
        </footer>
      </section>
    </div>
  );
}
