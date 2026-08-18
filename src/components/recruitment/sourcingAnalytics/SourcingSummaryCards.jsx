import React from "react";
import {
  Compass,
  ReceiptText,
  Target,
  UserCheck,
  UsersRound,
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

const metricConfig = [
  {
    key: "totalSources",
    title: "Tracked Channels",
    icon: Compass,
    labelClassName: "text-[#667085]",
    valueClassName: "text-[#042C51]",
    iconClassName: "bg-[#EAF2FB] text-[#042C51]",
    description: (totals) =>
      `${Number(totals?.activeSources || 0).toLocaleString(
        "en-PH",
      )} channels with applicants`,
    format: (value) =>
      Number(value || 0).toLocaleString("en-PH"),
  },
  {
    key: "totalVolume",
    title: "Public Applicants",
    icon: UsersRound,
    labelClassName: "text-blue-600",
    valueClassName: "text-[#042C51]",
    iconClassName: "bg-blue-50 text-blue-700",
    description: () => "Based on current records",
    format: (value) =>
      Number(value || 0).toLocaleString("en-PH"),
  },
  {
    key: "totalHired",
    title: "Total Hires",
    icon: UserCheck,
    labelClassName: "text-emerald-600",
    valueClassName: "text-emerald-700",
    iconClassName: "bg-emerald-50 text-emerald-700",
    description: () => "Current hired candidate count",
    format: (value) =>
      Number(value || 0).toLocaleString("en-PH"),
  },
  {
    key: "totalSourceCost",
    title: "Total Source Cost",
    icon: ReceiptText,
    labelClassName: "text-amber-600",
    valueClassName: "text-amber-700",
    iconClassName: "bg-amber-50 text-amber-700",
    description: (totals) =>
      `${Number(
        totals?.totalCostEntries || 0,
      ).toLocaleString("en-PH")} recorded cost entries`,
    format: formatCurrency,
  },
  {
    key: "overallCostPerHire",
    title: "Overall Cost / Hire",
    icon: Target,
    labelClassName: "text-[#FF5C28]",
    valueClassName: "text-[#FF5C28]",
    iconClassName: "bg-[#FFF0EB] text-[#FF5C28]",
    description: () => "Total cost / total hires",
    format: formatCurrency,
  },
];

function MetricCard({
  item,
  totals,
  delay = 0,
}) {
  const value = totals?.[item.key] ?? 0;

  return (
    <article
      className="sibs-metric-card h-[104px] 2xl:h-[116px] p-3 sm:p-3.5 2xl:p-4 rounded-2xl font-jakarta"
      style={{ animationDelay: `${delay}ms`, animationFillMode: "both" }}
    >
      <div className="flex h-full items-start justify-between gap-3">
        <div className="flex flex-col justify-between h-full min-w-0 flex-1">
          <p
            className={`truncate text-[10px] 2xl:text-[11px] font-extrabold uppercase tracking-wide ${
              item.labelClassName || "text-[#667085]"
            }`}
          >
            {item.title}
          </p>

          <p
            className={`truncate text-lg 2xl:text-2xl font-extrabold leading-none tabular-nums tracking-normal ${item.valueClassName}`}
            title={item.format(value)}
          >
            {item.format(value)}
          </p>

          <p className="line-clamp-1 truncate sibs-text-micro font-medium text-[#667085]">
            {item.description(totals)}
          </p>
        </div>

        <span
          className={`flex h-7.5 w-7.5 2xl:h-8.5 2xl:w-8.5 shrink-0 items-center justify-center rounded-full ${item.iconClassName}`}
        >
          {React.createElement(item.icon, {
            className: "h-3.5 w-3.5 2xl:h-4 2xl:w-4",
            strokeWidth: 2.2,
          })}
        </span>
      </div>
    </article>
  );
}

export default function SourcingSummaryCards({
  totals,
}) {
  return (
    <section className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-5">
      {metricConfig.map((item, index) => (
        <MetricCard
          key={item.key}
          item={item}
          totals={totals}
          delay={index * 50}
        />
      ))}
    </section>
  );
}
