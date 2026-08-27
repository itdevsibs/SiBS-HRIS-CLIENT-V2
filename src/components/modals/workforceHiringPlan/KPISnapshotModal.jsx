import React, { useEffect } from "react";
import { X } from "lucide-react";

function useLockBodyScroll(open) {
  useEffect(() => {
    if (!open) return undefined;

    const previousBodyOverflow = document.body.style.overflow;
    const previousHtmlOverflow = document.documentElement.style.overflow;

    document.body.style.overflow = "hidden";
    document.documentElement.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = previousBodyOverflow;
      document.documentElement.style.overflow = previousHtmlOverflow;
    };
  }, [open]);
}

function formatNumber(value) {
  return Number(value || 0).toLocaleString("en-PH", {
    maximumFractionDigits: 0,
  });
}

function InfoBox({ label, value }) {
  return (
    <div className="rounded-xl border border-[#E6ECF2] bg-white p-3.5 2xl:p-4 shadow-sm">
      <p className="mb-1 text-[8.5px] 2xl:text-[9px] font-extrabold uppercase tracking-wide text-[#98A2B3]">
        {label}
      </p>

      <div className="sibs-text-xs 2xl:sibs-text-sm font-extrabold text-[#042C51] tabular-nums">{value ?? "—"}</div>
    </div>
  );
}

export default function KPISnapshotModal({ open, week, records = [], onClose }) {
  useLockBodyScroll(open);

  if (!open || !week) return null;

  const required = records.reduce(
    (sum, item) => sum + Number(item.requiredHeadcount || 0),
    0
  );

  const actual = records.reduce(
    (sum, item) => sum + Number(item.actualHeadcount || 0),
    0
  );

  const opsPrf = records.reduce(
    (sum, item) => sum + Number(item.opsPrf || 0),
    0
  );

  const leads = records.reduce(
    (sum, item) => sum + Number(item.leadsToInterview || 0),
    0
  );

  return (
    <div className="sibs-modal-blur sibs-modal-backdrop-in fixed inset-0 z-[9999] flex h-dvh items-center justify-center px-4 py-4 font-jakarta">
      <div
        className="sibs-modal-pop-in relative flex max-h-[92dvh] w-full max-w-4xl flex-col overflow-hidden rounded-2xl border border-[#D6DEE8] bg-white shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4 border-b border-[#E6ECF2] bg-[#042C51] px-5 py-3 text-white sm:px-6 2xl:py-3.5">
          <div className="min-w-0">
            <h2 className="text-base sm:text-lg 2xl:text-xl font-extrabold text-white">
              Weekly KPI Snapshot
            </h2>
            <p className="mt-0.5 sibs-text-xs font-semibold text-white/75">
              Weekly manpower requirement, OPS PRF, and leads needed.
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-8 w-8 2xl:h-8.5 2xl:w-8.5 shrink-0 items-center justify-center rounded-lg text-white/70 transition hover:bg-white/10 hover:text-white"
            aria-label="Close modal"
          >
            <X size={18} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 sm:p-5 2xl:p-6 bg-[#F8FAFC]">
          <div className="mb-5 rounded-xl border border-blue-100 bg-blue-50 px-4 py-3 sm:px-5 sm:py-3.5">
            <p className="sibs-text-xs font-extrabold text-[#042C51]">
              {week.label || "Selected Week"}
            </p>
            <p className="mt-0.5 sibs-text-micro font-semibold text-[#042C51]/70">
              {week.weekRange ||
                [week.startDate, week.endDate].filter(Boolean).join(" - ") ||
                "Workforce hiring plan snapshot"}
            </p>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <InfoBox label="Required Headcount" value={formatNumber(required)} />
            <InfoBox label="Actual Headcount" value={formatNumber(actual)} />
            <InfoBox label="OPS PRF" value={formatNumber(opsPrf)} />
            <InfoBox label="Leads to Interview" value={formatNumber(leads)} />
          </div>
        </div>

        <div className="border-t border-[#E6ECF2] bg-white px-5 py-3 2xl:py-3.5">
          <div className="flex justify-end">
            <button
              type="button"
              onClick={onClose}
              className="inline-flex h-8.5 2xl:h-10 items-center justify-center rounded-lg border border-[#D6DEE8] bg-white px-3.5 2xl:px-4 sibs-text-xs font-extrabold text-[#042C51] transition hover:border-[#FF5C28]/40 hover:bg-[#FFF8F5] hover:text-[#FF5C28]"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
