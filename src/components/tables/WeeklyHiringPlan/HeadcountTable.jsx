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
      (item) =>
        Number(item.actualHeadcount || 0) >=
        Number(item.requiredHeadcount || 0)
    );

  if (completed) return "COMPLETED";

  return "ON TRACK";
}

function getOverallStatusDescription(status) {
  if (status === "AT RISK") return "Needs immediate attention";
  if (status === "COMPLETED") return "Requirement fulfilled";
  return "Within hiring target";
}

function getOverallStatusClass(status) {
  if (status === "AT RISK") return "text-orange-500";
  if (status === "COMPLETED") return "text-blue-600";
  return "text-emerald-600";
}

function getOverallStatusIconClass(status) {
  if (status === "AT RISK") return "bg-orange-50 text-orange-500";
  if (status === "COMPLETED") return "bg-blue-50 text-blue-600";
  return "bg-emerald-50 text-emerald-600";
}

function StatCard({
  title,
  value,
  icon: Icon,
  description,
  valueClassName = "text-sibs-primary-1",
  iconClassName = "bg-[#F2F6FA] text-sibs-primary-1",
}) {
  return (
    <div className="rounded-2xl border border-[#E6ECF2] bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-sibs-primary-1/20 hover:shadow-md">
      <div className="flex items-center justify-between gap-4">
        <div className="min-w-0">
          <p className="truncate text-xs font-bold uppercase tracking-wide text-sibs-tertiary-5">
            {title}
          </p>

          <p className={`mt-3 truncate text-3xl font-extrabold ${valueClassName}`}>
            {value}
          </p>

          {description && (
            <p className="mt-1 truncate text-xs font-semibold text-sibs-tertiary-5">
              {description}
            </p>
          )}
        </div>

        <div
          className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl ${iconClassName}`}
        >
          <Icon size={22} />
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

    const overallStatus = getOverallStatus(filteredPlans);

    return {
      totalRequired,
      actualHeadcount,
      opsPrf,
      leadsToInterview,
      overallStatus,
    };
  }, [filteredPlans]);

  return (
    <section className="rounded-xl border border-[#E6ECF2] bg-white p-4 shadow-sm sm:p-5">
      <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-base font-bold text-[#101828]">
            Weekly Hiring Headcount Summary
          </h2>
          <p className="mt-1 text-sm font-medium text-sibs-tertiary-5">
            Overview of manpower requirements, current headcount, OPS PRF, and
            leads needed.
          </p>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-5">
        <StatCard
          title="Required Headcount"
          value={formatNumber(totals.totalRequired)}
          icon={ClipboardList}
          description="Weekly requirement"
        />

        <StatCard
          title="Actual Headcount"
          value={formatNumber(totals.actualHeadcount)}
          icon={UserRound}
          description="Current active HC"
        />

        <StatCard
          title="OPS PRF"
          value={formatNumber(totals.opsPrf)}
          icon={CheckCircle2}
          description="Projected PRF need"
          iconClassName="bg-emerald-50 text-emerald-600"
          valueClassName="text-emerald-600"
        />

        <StatCard
          title="Leads Needed"
          value={formatNumber(totals.leadsToInterview)}
          icon={PieChart}
          description="For interview pipeline"
          iconClassName="bg-violet-50 text-sibs-primary-1"
        />

        <StatCard
          title="Overall Status"
          value={totals.overallStatus}
          icon={AlertTriangle}
          description={getOverallStatusDescription(totals.overallStatus)}
          iconClassName={getOverallStatusIconClass(totals.overallStatus)}
          valueClassName={getOverallStatusClass(totals.overallStatus)}
        />
      </div>
    </section>
  );
}