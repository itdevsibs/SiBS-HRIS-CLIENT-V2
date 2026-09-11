import React from "react";
import {
  CalendarDays,
  ReceiptText,
  UserRound,
} from "lucide-react";
import { DataCard } from "@/components/ui";

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

export default function SourcingAnalyticsMobileCard({
  source,
  onView,
}) {
  const costPerHire =
    Number(source?.hired || 0) > 0
      ? formatCurrency(source?.costPerHire)
      : "—";

  return (
    <DataCard
      interactive
      onClick={() => onView?.(source)}
      aria-label={`View sourcing channel ${source?.source || ""}`}
    >
      <DataCard.Header
        title={source?.source || "—"}
        subtitle={
          <span className="flex items-center gap-1.5 truncate text-[10px] font-semibold text-[#667085]">
            <ReceiptText size={12} className="shrink-0" />
            {source?.costEntries?.length || 0} recorded cost entries
          </span>
        }
        badge={
          <span
            className={`shrink-0 rounded-full border px-2.5 py-1 text-[9px] font-extrabold leading-none ${getSourceStatusClass(
              source,
            )}`}
          >
            {getSourceStatus(source)}
          </span>
        }
      />

      <DataCard.Metrics cols={4}>
        <DataCard.MetricItem
          label="Applicants"
          value={Number(source?.volume || 0).toLocaleString("en-PH")}
        />
        <DataCard.MetricItem
          label="Hired"
          value={Number(source?.hired || 0).toLocaleString("en-PH")}
          valueClassName="text-emerald-600 font-extrabold"
        />
        <DataCard.MetricItem
          label="Source Cost"
          value={formatCurrency(source?.sourceCost)}
        />
        <DataCard.MetricItem
          label="Cost / Hire"
          value={costPerHire}
          valueClassName="text-[#FF5C28] font-extrabold"
        />
      </DataCard.Metrics>

      <div className="mt-3 rounded-[10px] border border-[#EEF2F6] bg-white px-3 py-2">
        <p className="flex items-center gap-1.5 text-[9px] font-extrabold uppercase tracking-wide text-[#98A2B3]">
          <UserRound size={12} className="shrink-0" />
          Latest Applicant
        </p>
        <p className="mt-0.5 truncate text-xs font-bold text-[#475467]">
          {source?.latestCandidate || "—"}
        </p>
      </div>

      <DataCard.Footer>
        <p className="text-[10px] font-extrabold text-[#042C51]">
          Conversion: {Number(source?.conversionRate || 0).toFixed(1)}%
        </p>

        <p className="flex items-center gap-1.5 text-[10px] font-semibold text-[#667085]">
          <CalendarDays size={12} className="shrink-0" />
          {formatDate(source?.lastActivity)}
        </p>
      </DataCard.Footer>
    </DataCard>
  );
}