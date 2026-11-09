import React from "react";
import {
  Building2,
  TrendingDown,
  Users,
  UserX,
} from "lucide-react";
import {
  MetricCard,
  MetricGrid,
  MetricGridSkeleton,
} from "@/components/ui";

export default function AttritionReportsKpiSummary({ data, loading = false }) {
  if (loading) {
    return (
      <MetricGridSkeleton
        count={4}
        labels={[
          "Total Attritions",
          "Attrition Rate",
          "Actual Headcount",
          "Affected Accounts",
        ]}
      />
    );
  }

  const kpi = data?.kpi || {};
  const reportingPeriod = data?.reportingPeriod || {};

  const totalAttritions = kpi.totalAttritions ?? 0;
  const attritionRate =
    kpi.attritionRate !== undefined
      ? `${Number(kpi.attritionRate).toFixed(2)}%`
      : "0.00%";
  const actualHeadcount = kpi.actualHeadcount
    ? Number(kpi.actualHeadcount).toLocaleString()
    : "0";
  const headcountDate = reportingPeriod.headcountAsOf
    ? `As of ${reportingPeriod.headcountAsOf}`
    : "Period end";
  const accountsWithAttrition = kpi.accountsWithAttrition ?? 0;
  const totalAccounts = kpi.totalAccountsInScope
    ? `of ${kpi.totalAccountsInScope} accounts`
    : "recorded";

  return (
    <MetricGrid columns={4}>
      {/* 1. TOTAL ATTRITIONS */}
      <MetricCard
        title="Total Attritions"
        value={Number(totalAttritions).toLocaleString()}
        subtext="Workforce separations"
        icon={UserX}
        tone="red"
        delay={40}
      />

      {/* 2. ATTRITION RATE */}
      <MetricCard
        title="Attrition Rate"
        value={attritionRate}
        subtext="Separations / Avg. headcount"
        icon={TrendingDown}
        tone="orange"
        delay={80}
      />

      {/* 3. WORKFORCE HEADCOUNT */}
      <MetricCard
        title="Actual Headcount"
        value={actualHeadcount}
        subtext={headcountDate}
        icon={Users}
        tone="navy"
        delay={120}
      />

      {/* 4. AFFECTED ACCOUNTS */}
      <MetricCard
        title="Affected Accounts"
        value={Number(accountsWithAttrition).toLocaleString()}
        subtext={totalAccounts}
        icon={Building2}
        tone="blue"
        delay={160}
      />
    </MetricGrid>
  );
}
