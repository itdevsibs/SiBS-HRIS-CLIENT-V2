import React from "react";
import { FileText } from "lucide-react";

function getStatValue(stats, keys = []) {
  for (const key of keys) {
    const value = stats?.[key];

    if (value !== undefined && value !== null && value !== "") {
      const numberValue = Number(value);

      return Number.isFinite(numberValue) ? numberValue : 0;
    }
  }

  return 0;
}

const SUMMARY_ROWS = [
  {
    key: "total",
    aliases: ["totalPrf", "totalPRF"],
    label: "Total PRs Registered",
    dotClassName: "bg-[#042C51]",
    textClassName: "text-[#042C51]",
  },
  {
    key: "forApproval",
    aliases: ["for_approval", "pending"],
    label: "For Approval",
    dotClassName: "bg-amber-500",
    textClassName: "text-amber-600",
  },
  {
    key: "approved",
    aliases: [],
    label: "Approved",
    dotClassName: "bg-emerald-500",
    textClassName: "text-emerald-600",
  },
  {
    key: "notApproved",
    aliases: ["not_approved", "rejected", "declined"],
    label: "Not Approved",
    dotClassName: "bg-rose-500",
    textClassName: "text-rose-600",
  },
];

export default function PRSummaryTable({
  stats,
  delay = 0,
}) {
  return (
    <section
      className="sibs-page-card-in sibs-card flex min-h-full flex-col rounded-2xl border border-[#E6ECF2] bg-white p-4 font-jakarta shadow-sm"
      style={{
        animationDelay: `${delay}ms`,
      }}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 className="text-xs font-extrabold uppercase tracking-wide text-[#042C51]">
            Personnel Requisition Summary
          </h2>

          <p className="mt-1 text-xs font-semibold text-[#667085]">
            Current intake status distribution
          </p>
        </div>

        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[10px] bg-[#EAF2FB] text-[#042C51]">
          <FileText size={15} />
        </span>
      </div>

      <div className="mt-4 flex-1">
        {SUMMARY_ROWS.map((row, index) => {
          const value = getStatValue(stats, [
            row.key,
            ...row.aliases,
          ]);

          return (
            <div
              key={row.key}
              className={`flex min-h-[32px] items-center justify-between gap-4 py-2 ${
                index < SUMMARY_ROWS.length - 1
                  ? "border-b border-[#E9EEF4]"
                  : ""
              }`}
            >
              <div className="flex min-w-0 items-center gap-2">
                <span
                  className={`h-1.5 w-1.5 shrink-0 rounded-full ${row.dotClassName}`}
                />

                <p
                  className={`truncate text-xs font-extrabold ${row.textClassName}`}
                >
                  {row.label}
                </p>
              </div>

              <p
                className={`shrink-0 text-sm font-extrabold tabular-nums ${row.textClassName}`}
              >
                {value.toLocaleString("en-PH")}
              </p>
            </div>
          );
        })}
      </div>
    </section>
  );
}
