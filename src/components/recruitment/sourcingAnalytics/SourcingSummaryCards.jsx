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
    tone: "navy",
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
    tone: "indigo",
    description: () => "Based on current records",
    format: (value) =>
      Number(value || 0).toLocaleString("en-PH"),
  },
  {
    key: "totalHired",
    title: "Total Hires",
    icon: UserCheck,
    tone: "green",
    description: () => "Current hired candidate count",
    format: (value) =>
      Number(value || 0).toLocaleString("en-PH"),
  },
  {
    key: "totalSourceCost",
    title: "Total Source Cost",
    icon: ReceiptText,
    tone: "amber",
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
    tone: "orange",
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
  const formattedValue = item.format(value);
  const isLongValue = typeof formattedValue === "string" && formattedValue.length > 9;

  return (
    <article
      className="sibs-metric-card flex h-[104px] 2xl:h-[116px] min-h-[96px] 2xl:min-h-[112px] flex-col justify-between overflow-hidden p-3 2xl:p-3.5 font-jakarta"
      style={{ animationDelay: `${delay}ms`, animationFillMode: "both" }}
    >
      <div className="flex h-full items-start justify-between gap-2.5 2xl:gap-3">
        <div className="flex flex-col justify-between h-full min-w-0 flex-1 self-stretch">
          <div>
            <p
              className={`m-0 truncate sibs-text-micro font-extrabold uppercase sibs-tone-${item.tone}-label`}
            >
              {item.title}
            </p>

            <p
              className={`mt-1.5 2xl:mt-2 truncate font-extrabold leading-none tabular-nums sibs-tone-${item.tone}-label ${
                isLongValue ? "text-lg sm:text-xl 2xl:text-2xl" : "text-2xl 2xl:text-3xl"
              }`}
              title={formattedValue}
            >
              {formattedValue}
            </p>
          </div>

          <p className="mt-1 line-clamp-1 truncate sibs-text-micro font-semibold leading-tight text-[#667085]">
            {item.description(totals)}
          </p>
        </div>

        <span
          className={`flex h-7.5 w-7.5 2xl:h-9 2xl:w-9 shrink-0 items-center justify-center rounded-lg 2xl:rounded-xl sibs-tone-${item.tone}-icon`}
        >
          {React.createElement(item.icon, {
            className: "h-4 w-4 2xl:h-4.5 2xl:w-4.5",
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
