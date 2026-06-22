import React from "react";

function formatCurrency(value) {
  const amount = Number(value || 0);

  return amount.toLocaleString("en-PH", {
    style: "currency",
    currency: "PHP",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function formatDate(date) {
  if (!date) return "—";

  const parsed = new Date(date);

  if (Number.isNaN(parsed.getTime())) return "—";

  return parsed.toLocaleDateString("en-PH", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function getSourceStatus(source) {
  if (Number(source?.hired || 0) > 0) return "With Hires";
  if (Number(source?.volume || 0) > 0) return "With Applicants";
  return "No Applicants";
}

function getSourceStatusClass(source) {
  const status = getSourceStatus(source);

  switch (status) {
    case "With Hires":
      return "border-emerald-200 bg-emerald-50 text-emerald-700";
    case "With Applicants":
      return "border-blue-200 bg-blue-50 text-sibs-primary-1";
    default:
      return "border-gray-200 bg-gray-50 text-gray-600";
  }
}

export default function SourcingAnalyticsMobileCard({ source, onView }) {
  const status = getSourceStatus(source);

  return (
    <button
      type="button"
      onClick={() => onView(source)}
      className="w-full rounded-2xl border border-[#E6ECF2] bg-white p-4 text-left shadow-sm transition hover:border-sibs-primary-1/40 hover:bg-[#F8FAFC]"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-bold text-sibs-primary-1">
            {source?.costEntries?.length || 0} cost entries
          </p>

          <h3 className="mt-1 truncate text-sm font-bold text-[#101828]">
            {source?.source || "—"}
          </h3>

          <p className="mt-1 truncate text-xs font-semibold text-sibs-tertiary-5">
            Latest Applicant: {source?.latestCandidate || "—"}
          </p>
        </div>

        <span
          className={`shrink-0 rounded-full border px-2.5 py-1 text-[10px] font-bold ${getSourceStatusClass(
            source,
          )}`}
        >
          {status}
        </span>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-2">
        <div className="rounded-xl bg-[#F8FAFC] p-3">
          <p className="text-[10px] font-bold uppercase text-sibs-tertiary-5">
            Applicants
          </p>

          <p className="mt-1 text-xs font-extrabold text-sibs-primary-1">
            {source?.volume || 0}
          </p>
        </div>

        <div className="rounded-xl bg-[#F8FAFC] p-3">
          <p className="text-[10px] font-bold uppercase text-sibs-tertiary-5">
            Hired
          </p>

          <p className="mt-1 text-xs font-extrabold text-emerald-600">
            {source?.hired || 0}
          </p>
        </div>

        <div className="rounded-xl bg-[#F8FAFC] p-3">
          <p className="text-[10px] font-bold uppercase text-sibs-tertiary-5">
            Source Cost
          </p>

          <p className="mt-1 truncate text-xs font-extrabold text-sibs-primary-1">
            {formatCurrency(source?.sourceCost)}
          </p>
        </div>

        <div className="rounded-xl bg-[#F8FAFC] p-3">
          <p className="text-[10px] font-bold uppercase text-sibs-tertiary-5">
            Cost / Hire
          </p>

          <p className="mt-1 truncate text-xs font-extrabold text-sibs-primary-1">
            {formatCurrency(source?.costPerHire)}
          </p>
        </div>
      </div>

      <div className="mt-3 flex items-center justify-between gap-3">
        <p className="text-[11px] font-bold text-sibs-tertiary-5 italic">
          Conversion: {Number(source?.conversionRate || 0).toFixed(1)}%
        </p>

        <p className="text-[11px] font-bold text-sibs-tertiary-5">
          {formatDate(source?.lastActivity)}
        </p>
      </div>
    </button>
  );
}