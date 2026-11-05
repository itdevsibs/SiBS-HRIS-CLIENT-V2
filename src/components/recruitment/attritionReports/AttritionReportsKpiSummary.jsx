import React from "react";
import {
  Building2,
  TrendingDown,
  Users,
  UserX,
} from "lucide-react";
import { Skeleton } from "@/components/ui";

function KpiCard({
  title,
  value,
  subtext,
  icon,
  tone = "navy",
  delay = 0,
}) {
  return (
    <article
      className="sibs-metric-card sibs-page-card-in flex h-[104px] 2xl:h-[116px] min-h-[96px] 2xl:min-h-[112px] flex-col justify-between overflow-hidden p-2.5 2xl:p-3.5 font-jakarta"
      style={{ animationDelay: `${delay}ms`, animationFillMode: "both" }}
    >
      <div className="flex h-full items-start justify-between gap-2 2xl:gap-3">
        <div className="flex h-full min-w-0 flex-1 flex-col justify-between">
          <div>
            <p className={`m-0 truncate sibs-text-micro font-extrabold uppercase sibs-tone-${tone}-label`}>
              {title}
            </p>

            <p className={`font-heading mt-1 2xl:mt-1.5 text-xl 2xl:text-2xl font-bold leading-none tabular-nums tracking-tight sibs-tone-${tone}-label`}>
              {value}
            </p>
          </div>

          <p className="line-clamp-1 truncate sibs-text-micro font-bold text-sibs-muted">
            {subtext}
          </p>
        </div>

        <span
          className={`flex h-7.5 w-7.5 2xl:h-9 2xl:w-9 shrink-0 items-center justify-center rounded-full sibs-tone-${tone}-icon`}
        >
          {React.createElement(icon, { className: "h-3.5 w-3.5 2xl:h-4.5 2xl:w-4.5", strokeWidth: 2 })}
        </span>
      </div>
    </article>
  );
}

export default function AttritionReportsKpiSummary({ data, loading = false }) {
  if (loading) {
    return (
      <div className="grid grid-cols-2 gap-2.5 lg:grid-cols-4 2xl:gap-3">
        {Array.from({ length: 4 }).map((_, idx) => (
          <div
            key={idx}
            className="flex h-[104px] 2xl:h-[116px] flex-col justify-between rounded-xl border border-sibs-border bg-white p-3"
          >
            <Skeleton className="h-3 w-20" />
            <Skeleton className="h-7 w-16" />
            <Skeleton className="h-2.5 w-24" />
          </div>
        ))}
      </div>
    );
  }

  const kpi = data?.kpi || {};
  const reportingPeriod = data?.reportingPeriod || {};

  const totalAttritions = kpi.totalAttritions ?? 0;
  const attritionRate = kpi.attritionRate !== undefined ? `${Number(kpi.attritionRate).toFixed(2)}%` : "0.00%";
  const actualHeadcount = kpi.actualHeadcount ? Number(kpi.actualHeadcount).toLocaleString() : "0";
  const headcountDate = reportingPeriod.headcountAsOf ? `As of ${reportingPeriod.headcountAsOf}` : "Period end";
  const accountsWithAttrition = kpi.accountsWithAttrition ?? 0;
  const totalAccounts = kpi.totalAccountsInScope ? `of ${kpi.totalAccountsInScope} accounts` : "recorded";

  return (
    <section className="grid grid-cols-2 gap-2.5 lg:grid-cols-4 2xl:gap-3 font-jakarta">
      {/* 1. TOTAL ATTRITIONS */}
      <KpiCard
        title="Total Attritions"
        value={Number(totalAttritions).toLocaleString()}
        subtext="Workforce separations"
        icon={UserX}
        tone="red"
        delay={40}
      />

      {/* 2. ATTRITION RATE */}
      <KpiCard
        title="Attrition Rate"
        value={attritionRate}
        subtext="Separations / Avg. headcount"
        icon={TrendingDown}
        tone="orange"
        delay={80}
      />

      {/* 3. WORKFORCE HEADCOUNT */}
      <KpiCard
        title="Actual Headcount"
        value={actualHeadcount}
        subtext={headcountDate}
        icon={Users}
        tone="navy"
        delay={120}
      />

      {/* 4. AFFECTED ACCOUNTS */}
      <KpiCard
        title="Affected Accounts"
        value={Number(accountsWithAttrition).toLocaleString()}
        subtext={totalAccounts}
        icon={Building2}
        tone="blue"
        delay={160}
      />
    </section>
  );
}
