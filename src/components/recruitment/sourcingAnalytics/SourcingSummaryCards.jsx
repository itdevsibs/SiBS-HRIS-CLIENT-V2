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
    valueClassName: "text-[#042C51]",
    iconClassName: "bg-[#EAF2FB] text-[#042C51]",
    description: () => "Based on current records",
    format: (value) =>
      Number(value || 0).toLocaleString("en-PH"),
  },
  {
    key: "totalHired",
    title: "Total Hires",
    icon: UserCheck,
    valueClassName: "text-emerald-600",
    iconClassName: "bg-emerald-50 text-[#042C51]",
    description: () => "Current hired candidate count",
    format: (value) =>
      Number(value || 0).toLocaleString("en-PH"),
  },
  {
    key: "totalSourceCost",
    title: "Total Source Cost",
    icon: ReceiptText,
    valueClassName: "text-[#042C51]",
    iconClassName: "bg-amber-50 text-[#042C51]",
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
    valueClassName: "text-[#FF5C28]",
    iconClassName: "bg-[#FFF0EB] text-[#042C51]",
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
      className="sibs-metric-card"
      style={{ animationDelay: `${delay}ms` }}
    >
      <div className="flex h-full items-start justify-between gap-4">
        <div className="min-w-0 flex-1 self-stretch">
          <p className="sibs-kicker">
            {item.title}
          </p>

          <p
            className={`mt-2 truncate text-2xl font-extrabold leading-none tabular-nums tracking-normal sm:text-3xl ${item.valueClassName}`}
            title={item.format(value)}
          >
            {item.format(value)}
          </p>

          <p className="mt-1.5 line-clamp-2 text-xs font-bold leading-4 text-[#667085]">
            {item.description(totals)}
          </p>
        </div>

        <span
          className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${item.iconClassName}`}
        >
          {React.createElement(item.icon, {
            size: 17,
            strokeWidth: 2,
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
    <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-5">
      {metricConfig.map((item, index) => (
        <MetricCard
          key={item.key}
          item={item}
          totals={totals}
          delay={index * 60}
        />
      ))}
    </section>
  );
}