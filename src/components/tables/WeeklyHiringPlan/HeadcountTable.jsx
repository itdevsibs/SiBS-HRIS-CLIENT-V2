import React, { useMemo } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  ClipboardList,
  PieChart,
  UserRound,
} from "lucide-react";

function formatNumber(value) {
  return Number(value || 0).toLocaleString("en-PH", {
    maximumFractionDigits: 0,
  });
}

function getOverallStatus(records = []) {
  const delayed = records.some((item) => item.pipelineStatus === "Delayed");
  const atRisk = records.some((item) => item.pipelineStatus === "At Risk");

  if (delayed || atRisk) return "AT RISK";

  const completed =
    records.length > 0 &&
    records.every(
      (item) => Number(item.actualHeadcount) >= Number(item.requiredHeadcount)
    );

  if (completed) return "COMPLETED";

  return "ON TRACK";
}

function MetricCard({
  title,
  value,
  icon: Icon,
  iconClassName = "bg-blue-50 text-sibs-primary-1",
  valueClassName = "text-sibs-primary-1",
}) {
  return (
    <div className="rounded-xl border border-[#E6ECF2] bg-white p-4 shadow-sm sm:p-5">
      <div className="flex items-center gap-4">
        <div
          className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-full ${iconClassName}`}
        >
          <Icon size={22} />
        </div>

        <div className="min-w-0">
          <p className="text-sm font-bold text-[#101828]">{title}</p>

          <h3 className={`mt-1 truncate text-3xl font-bold ${valueClassName}`}>
            {value}
          </h3>
        </div>
      </div>
    </div>
  );
}

export default function HeadcountTable({ filteredPlans = [] }) {
  const totals = useMemo(() => {
    const totalRequired = filteredPlans.reduce(
      (sum, item) => sum + Number(item.requiredHeadcount || 0),
      0
    );

    const actualHeadcount = filteredPlans.reduce(
      (sum, item) => sum + Number(item.actualHeadcount || 0),
      0
    );

    const opsPrf = filteredPlans.reduce(
      (sum, item) => sum + Number(item.opsPrf || 0),
      0
    );

    const leadsToInterview = filteredPlans.reduce(
      (sum, item) => sum + Number(item.leadsToInterview || 0),
      0
    );

    return {
      totalRequired,
      actualHeadcount,
      opsPrf,
      leadsToInterview,
      overallStatus: getOverallStatus(filteredPlans),
    };
  }, [filteredPlans]);

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-5">
      <MetricCard
        title="Required Headcount"
        value={formatNumber(totals.totalRequired)}
        icon={ClipboardList}
      />

      <MetricCard
        title="Actual Headcount"
        value={formatNumber(totals.actualHeadcount)}
        icon={UserRound}
        iconClassName="bg-indigo-50 text-sibs-primary-1"
      />

      <MetricCard
        title="OPS PRF"
        value={formatNumber(totals.opsPrf)}
        icon={CheckCircle2}
        iconClassName="bg-emerald-50 text-emerald-600"
        valueClassName="text-emerald-600"
      />

      <MetricCard
        title="Leads Needed"
        value={formatNumber(totals.leadsToInterview)}
        icon={PieChart}
        iconClassName="bg-violet-50 text-sibs-primary-1"
      />

      <MetricCard
        title="Overall Status"
        value={totals.overallStatus}
        icon={AlertTriangle}
        iconClassName="bg-orange-50 text-orange-500"
        valueClassName={
          totals.overallStatus === "AT RISK"
            ? "text-orange-500"
            : totals.overallStatus === "COMPLETED"
              ? "text-blue-600"
              : "text-emerald-600"
        }
      />
    </div>
  );
}
