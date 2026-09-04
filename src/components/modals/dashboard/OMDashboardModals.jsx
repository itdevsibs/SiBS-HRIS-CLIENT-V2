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
} from "../../../lib/utils/Dashboards/OMDashboard/omDashboardHelpers.js";

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

function getRiskClass(risk) {
  if (risk === "High") {
    return "border-rose-200 bg-rose-50 text-rose-700";
  }

  if (risk === "Medium") {
    return "border-amber-200 bg-amber-50 text-amber-700";
  }

  if (risk === "Low") {
    return "border-blue-200 bg-blue-50 text-blue-700";
  }

  return "border-slate-200 bg-slate-50 text-slate-600";
}

function DetailRow({ label, value }) {
  return (
    <div className="flex flex-col gap-1 border-b border-[#EEF2F6] py-2 2xl:py-2.5 last:border-b-0 sm:flex-row sm:items-start sm:justify-between sm:gap-4 font-jakarta">
      <span className="font-jakarta text-[8.5px] 2xl:text-[9px] font-extrabold uppercase tracking-wide text-[#98A2B3]">
        {label}
      </span>
      <strong className="break-words text-left font-heading sibs-text-xs font-bold text-[#042C51] sm:max-w-[62%] sm:text-right">
        {safeValue(value)}
      </strong>
    </div>
  );
}

export function OperationsHiringDetailsModal({
  open,
  role,
  onClose,
  onToast,
}) {
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

  const progress = safePercentage(
    role.currentFilled,
    role.approvedRequirement,
  );

  const handleShare = async () => {
    try {
      const url = new URL(window.location.href);
      url.searchParams.set("role", String(role.id || "selected-role"));

      if (!navigator.clipboard?.writeText) {
        throw new Error("Clipboard API unavailable");
      }

      await navigator.clipboard.writeText(url.toString());
      onToast?.({
        title: "Operations Role Link Copied",
        message: `${safeValue(role.roleTitle, "Selected role")} was copied to the clipboard.`,
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
        aria-labelledby="om-hiring-details-title"
        className="sibs-modal-pop-in flex max-h-[calc(100dvh-1rem)] w-full max-w-4xl 2xl:max-w-5xl flex-col overflow-hidden rounded-2xl bg-[#042C51] font-jakarta shadow-2xl sm:max-h-[88vh]"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <header className="flex shrink-0 items-center justify-between gap-3 bg-[#042C51] px-5 py-3 text-white sm:gap-4 sm:px-6 2xl:py-3.5">
          <div className="flex min-w-0 items-center gap-2.5 2xl:gap-3">
            <span className="flex h-8 w-8 2xl:h-8.5 2xl:w-8.5 shrink-0 items-center justify-center rounded-lg bg-[#FF5C28] text-white shadow-sm">
              <Target size={16} />
            </span>
            <div className="min-w-0">
              <h2
                id="om-hiring-details-title"
                className="sibs-modal-title font-heading text-base sm:text-lg 2xl:text-xl font-bold tracking-tight text-white truncate"
              >
                Operations Hiring Details
              </h2>
              <p className="sibs-modal-subtitle font-jakarta sibs-text-xs font-semibold text-white/75 mt-0.5 truncate">
                Manager-restricted recruitment analytics
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-8 w-8 2xl:h-8.5 2xl:w-8.5 shrink-0 items-center justify-center rounded-lg text-white/70 transition hover:bg-white/10 hover:text-white"
            aria-label="Close operations hiring details"
          >
            <X size={18} />
          </button>
        </header>

        <div className="min-h-0 flex-1 overflow-y-auto bg-white p-3 text-[#101828] sm:p-6">
          <div className="space-y-5">
            <section className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-slate-50 p-3 sm:flex-row sm:items-center sm:justify-between sm:p-4">
              <div className="min-w-0">
                <h3 className="sibs-modal-section-title font-heading text-base sm:text-lg font-bold tracking-tight text-sibs-navy break-words">
                  {safeValue(role.roleTitle, "Untitled Role")}
                </h3>
                <p className="font-jakarta mt-1 break-words text-xs font-semibold leading-relaxed text-[#667085]">
                  {safeValue(role.account, "Unassigned Account")} →{" "}
                  {safeValue(role.department, "Unassigned Department")}
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <span
                    className={`inline-flex rounded border px-2 py-0.5 text-[10px] font-extrabold uppercase ${getStatusClass(
                      role.status,
                    )}`}
                  >
                    {safeValue(role.status, "Unknown")}
                  </span>
                  <span
                    className={`inline-flex rounded border px-2 py-0.5 text-[10px] font-extrabold uppercase ${getRiskClass(
                      role.riskFlag,
                    )}`}
                  >
                    Risk: {safeValue(role.riskFlag, "None")}
                  </span>
                </div>
              </div>

              <div className="shrink-0 rounded-xl border border-orange-200 bg-orange-50 px-4 py-3 text-left sm:min-w-[120px] sm:text-center">
                <span className="block font-jakarta text-xs font-extrabold uppercase text-orange-700/70">
                  Progress
                </span>
                <span className="mt-1 block font-heading text-3xl font-bold tabular-nums text-[#FF5C28]">
                  {progress}%
                </span>
              </div>
            </section>

            <section>
              <h3 className="sibs-modal-section-title font-heading text-sm 2xl:text-base font-bold tracking-tight text-sibs-navy">
                Weekly Movement Breakdown
              </h3>
              <div className="mt-3 grid grid-cols-2 gap-2 text-center sm:grid-cols-3 lg:grid-cols-6">
                {movementStages.map(([label, key]) => (
                  <div
                    key={key}
                    className="rounded-lg border border-slate-100 bg-slate-50 p-2.5"
                  >
                    <span className="block font-jakarta text-[10px] font-bold uppercase leading-none text-slate-400">
                      {label}
                    </span>
                    <span className="mt-1.5 block font-heading text-base font-bold tabular-nums text-[#042C51]">
                      {Number(role[key] || 0)}
                    </span>
                  </div>
                ))}
              </div>
            </section>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <section className="rounded-xl border border-blue-200/60 bg-blue-50/60 p-3.5">
                <span className="sibs-modal-section-subtitle block font-jakarta text-[10px] font-extrabold uppercase text-blue-600">
                  Current Action Item
                </span>
                <p className="font-jakarta mt-1 break-words text-xs font-semibold leading-relaxed text-blue-950">
                  {safeValue(
                    role.actionItem,
                    "No action item has been assigned.",
                  )}
                </p>
              </section>

              <section className="rounded-xl border border-amber-200 bg-amber-50 p-3.5">
                <div className="flex items-start gap-2.5">
                  <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0 text-amber-700" />
                  <div>
                    <span className="sibs-modal-section-subtitle block font-jakarta text-[10px] font-extrabold uppercase text-amber-700">
                      Risk Interpretation
                    </span>
                    <p className="font-jakarta mt-1 text-xs font-semibold leading-relaxed text-amber-900">
                      {role.status === "On Track"
                        ? "The role is progressing within its current delivery window. Continue the existing sourcing and interview cadence."
                        : "Roles marked At Risk or Delayed require a documented action item, additional sourcing coverage, and recruiter follow-up before the next hiring call."}
                    </p>
                  </div>
                </div>
              </section>
            </div>

            <section className="rounded-xl border border-slate-200 bg-slate-50/60 p-3.5">
              <span className="sibs-modal-section-title block font-heading text-sm 2xl:text-base font-bold tracking-tight text-sibs-navy">
                Role Summary
              </span>
              <div className="mt-2 grid grid-cols-1 gap-x-6 lg:grid-cols-2">
                <div>
                  <DetailRow
                    label="Role / Account"
                    value={role.roleAccount || role.roleTitle}
                  />
                  <DetailRow label="Department" value={role.department} />
                  <DetailRow
                    label="Approved Requirement"
                    value={Number(role.approvedRequirement || 0)}
                  />
                  <DetailRow
                    label="Current Filled"
                    value={Number(role.currentFilled || 0)}
                  />
                  <DetailRow
                    label="Open Slots"
                    value={Number(role.openSlots || 0)}
                  />
                </div>
                <div>
                  <DetailRow
                    label="Due Date"
                    value={formatDate(role.dueDate)}
                  />
                  <DetailRow label="TA Owner" value={role.taOwner} />
                  <DetailRow
                    label="Aging Days"
                    value={`${Number(role.agingDays || 0)} days`}
                  />
                  <DetailRow
                    label="Drop-Offs"
                    value={Number(role.dropOffs || 0)}
                  />
                </div>
              </div>
            </section>
          </div>
        </div>

        <footer className="flex shrink-0 flex-col gap-3 border-t border-[#E6ECF2] bg-[#F8FAFC] px-4 py-2.5 2xl:py-3 font-jakarta sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <p className="text-center font-jakarta text-[8.5px] 2xl:text-[9px] font-extrabold uppercase tracking-wide text-[#98A2B3] sm:text-left">
            Frontend-only manager view. Production access must also be enforced
            by the backend API.
          </p>
          <div className="grid w-full grid-cols-1 gap-2 sm:flex sm:w-auto">
            <button
              type="button"
              onClick={handleShare}
              className="inline-flex h-8.5 2xl:h-10 w-full items-center justify-center gap-2 rounded-lg border border-[#D6DEE8] bg-white px-3.5 2xl:px-4 font-jakarta sibs-text-xs font-extrabold text-[#042C51] transition hover:border-[#FF5C28]/40 hover:bg-[#FFF8F5] hover:text-[#FF5C28] sm:w-auto"
            >
              <Link2 size={13} />
              Share Link
            </button>
            <button
              type="button"
              onClick={onClose}
              className="inline-flex h-8.5 2xl:h-10 w-full items-center justify-center gap-2 rounded-lg bg-[#042C51] px-3.5 2xl:px-4 font-jakarta sibs-text-xs font-extrabold text-white transition hover:bg-[#FF5C28] active:scale-[0.98] sm:w-auto"
            >
              <CheckCircle2 size={13} />
              Close Details
            </button>
          </div>
        </footer>
      </section>
    </div>
  );
}
