import React from "react";
import {
  CalendarDays,
  ReceiptText,
  UserRound,
} from "lucide-react";

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
  if (Number(source?.hired || 0) > 0) {
    return "With Hires";
  }

  if (Number(source?.volume || 0) > 0) {
    return "With Applicants";
  }

  return "No Applicants";
}

function getSourceStatusClass(source) {
  const status = getSourceStatus(source);

  if (status === "With Hires") {
    return "border-emerald-200 bg-emerald-50 text-emerald-700";
  }

  if (status === "With Applicants") {
    return "border-blue-200 bg-blue-50 text-[#042C51]";
  }

  return "border-gray-200 bg-gray-50 text-gray-600";
}

function MetricTile({
  label,
  value,
  valueClassName = "text-[#042C51]",
}) {
  return (
    <div className="rounded-[10px] border border-[#EEF2F6] bg-[#F8FAFC] p-3">
      <p className="text-[9px] font-extrabold uppercase tracking-wide text-[#98A2B3]">
        {label}
      </p>

      <p
        className={`mt-1 truncate text-xs font-extrabold ${valueClassName}`}
        title={String(value)}
      >
        {value}
      </p>
    </div>
  );
}

export default function SourcingAnalyticsMobileCard({
  source,
  onView,
}) {
  const costPerHire =
    Number(source?.hired || 0) > 0
      ? formatCurrency(source?.costPerHire)
      : "—";

  return (
    <button
      type="button"
      onClick={() => onView?.(source)}
      className="sibs-page-card-in w-full rounded-2xl border border-[#E6ECF2] bg-white p-4 text-left shadow-sm outline-none transition hover:border-[#FF5C28]/35 hover:bg-[#FFFDFB] focus-visible:ring-2 focus-visible:ring-[#FF5C28]/40"
      aria-label={`View sourcing channel ${
        source?.source || ""
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="text-sm font-extrabold leading-5 text-[#042C51]">
            {source?.source || "—"}
          </h3>

          <p className="mt-1 flex items-center gap-1.5 truncate text-[10px] font-semibold text-[#667085]">
            <ReceiptText size={12} />
            {source?.costEntries?.length || 0} recorded
            cost entries
          </p>
        </div>

        <span
          className={`shrink-0 rounded-full border px-2.5 py-1 text-[9px] font-extrabold leading-none ${getSourceStatusClass(
            source,
          )}`}
        >
          {getSourceStatus(source)}
        </span>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-2">
        <MetricTile
          label="Applicants"
          value={Number(
            source?.volume || 0,
          ).toLocaleString("en-PH")}
        />

        <MetricTile
          label="Hired"
          value={Number(
            source?.hired || 0,
          ).toLocaleString("en-PH")}
          valueClassName="text-emerald-600"
        />

        <MetricTile
          label="Source Cost"
          value={formatCurrency(source?.sourceCost)}
        />

        <MetricTile
          label="Cost / Hire"
          value={costPerHire}
          valueClassName="text-[#FF5C28]"
        />
      </div>

      <div className="mt-3 rounded-[10px] border border-[#EEF2F6] bg-white px-3 py-2.5">
        <p className="flex items-center gap-1.5 text-[9px] font-extrabold uppercase tracking-wide text-[#98A2B3]">
          <UserRound size={12} />
          Latest Applicant
        </p>

        <p className="mt-1 truncate text-xs font-bold text-[#475467]">
          {source?.latestCandidate || "—"}
        </p>
      </div>

      <div className="mt-3 flex items-center justify-between gap-3 border-t border-[#EEF2F6] pt-3">
        <p className="text-[10px] font-extrabold text-[#042C51]">
          Conversion:{" "}
          {Number(
            source?.conversionRate || 0,
          ).toFixed(1)}%
        </p>

        <p className="flex items-center gap-1.5 text-[10px] font-semibold text-[#667085]">
          <CalendarDays size={12} />
          {formatDate(source?.lastActivity)}
        </p>
      </div>
    </button>
  );
}