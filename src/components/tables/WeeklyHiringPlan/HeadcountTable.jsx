import React, { useMemo } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  ClipboardList,
  PieChart,
  UserRound,
} from "lucide-react";

const EDGE = "rounded-[10px]";
const SOFT_PANEL_BORDER = "border border-[#E8EEF5]";

function formatNumber(value) {
  return Number(value || 0).toLocaleString("en-PH", {
    maximumFractionDigits: 0,
  });
}

function getOverallStatus(records = []) {
  const validRecords = records.filter((item) => !item.isAssignedEmptyRow);

  const delayed = validRecords.some((item) => item.pipelineStatus === "Delayed");
  const atRisk = validRecords.some((item) => item.pipelineStatus === "At Risk");

  if (delayed || atRisk) return "AT RISK";

  const hasRequirement = validRecords.some(
    (item) => Number(item.requiredHeadcount || 0) > 0,
  );

  const completed =
    hasRequirement &&
    validRecords.every(
      (item) =>
        Number(item.actualHeadcount || 0) >=
        Number(item.requiredHeadcount || 0),
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
    <div
      className={`${EDGE} ${SOFT_PANEL_BORDER} bg-white p-4 transition hover:bg-[#FAFBFC]`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-xs font-extrabold uppercase tracking-wide text-sibs-tertiary-5">
            {title}
          </p>

          <p
            className={`mt-2 truncate text-2xl font-extrabold ${valueClassName}`}
          >
            {value}
          </p>

          {description && (
            <p className="mt-1 truncate text-xs font-semibold text-sibs-tertiary-5">
              {description}
            </p>
          )}
        </div>

        <div
          className={`flex h-11 w-11 shrink-0 items-center justify-center ${EDGE} ${iconClassName}`}
        >
          <Icon size={21} />
        </div>
      </div>
    </div>
  );
}

export default function HeadcountTable({ filteredPlans = [] }) {
  const totals = useMemo(() => {
    const totalRequired = filteredPlans.reduce(
      (sum, item) => sum + Number(item.requiredHeadcount || 0),
      0,
    );

    const actualHeadcount = filteredPlans.reduce(
      (sum, item) => sum + Number(item.actualHeadcount || 0),
      0,
    );

    const opsPrf = filteredPlans.reduce(
      (sum, item) => sum + Number(item.opsPrf || 0),
      0,
    );

    const leadsToInterview = filteredPlans.reduce(
      (sum, item) => sum + Number(item.leadsToInterview || 0),
      0,
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
    <div className="bg-white">
      <div className="border-b border-[#E6ECF2] px-5 py-4">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
          <div className="min-w-0">
            <div className="inline-flex items-center gap-2 rounded-full border border-blue-100 bg-blue-50 px-3 py-1 text-xs font-extrabold uppercase tracking-wide text-sibs-primary-1">
              <ClipboardList size={14} />
              Headcount Overview
            </div>

            <h2 className="mt-3 text-lg font-extrabold text-sibs-primary-1">
              Weekly Hiring Headcount Summary
            </h2>

            <p className="mt-1 text-sm font-medium text-sibs-tertiary-5">
              Overview of manpower requirements, current headcount, OPS PRF, and
              leads needed.
            </p>
          </div>

          <div
            className={`inline-flex w-fit items-center gap-2 ${EDGE} border border-[#E6ECF2] bg-[#F8FAFC] px-4 py-3 text-sm font-bold text-[#344054]`}
          >
            Records: {filteredPlans.length}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 p-5 sm:grid-cols-2 xl:grid-cols-5">
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
    </div>
  );
}