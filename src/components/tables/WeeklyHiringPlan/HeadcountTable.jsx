import React, { useMemo } from "react";
import {
  AlertTriangle,
  BarChart3,
  ShieldCheck,
  Target,
  TrendingUp,
  UserRound,
  UsersRound,
} from "lucide-react";

const EDGE = "rounded-[10px]";
const CARD_BORDER = "border border-[#E8EEF5]";

function toNumber(value) {
  const numberValue = Number(value ?? 0);
  return Number.isFinite(numberValue) ? numberValue : 0;
}

function formatNumber(value) {
  return toNumber(value).toLocaleString("en-PH", {
    maximumFractionDigits: 0,
  });
}

function formatPercent(value, decimals = 0) {
  return `${toNumber(value).toFixed(decimals)}%`;
}

function getNumberValue(item, keys = [], fallback = 0) {
  for (const key of keys) {
    const value = item?.[key];

    if (value !== undefined && value !== null && value !== "") {
      const numberValue = Number(value);

      if (Number.isFinite(numberValue)) {
        return numberValue;
      }
    }
  }

  return toNumber(fallback);
}

function getRequiredHeadcount(item = {}) {
  return getNumberValue(item, [
    "requiredHeadcount",
    "required_headcount",
    "requiredHC",
    "required_hc",
    "clientPlan",
    "client_plan",
  ]);
}

function getActualHeadcount(item = {}) {
  return getNumberValue(item, [
    "actualHeadcount",
    "actual_headcount",
    "actualHC",
    "actual_hc",
    "endorsedHeadcount",
    "endorsed_headcount",
  ]);
}

function getAbsenteeismTotal(item = {}) {
  return getNumberValue(item, [
    "absenteeismCount",
    "absenteeism_count",
    "absenteeismPastSixWeeks",
    "absenteeism_past_six_weeks",
    "absenteeismSixWeeks",
    "absenteeism_6_weeks",
    "totalAbsenteeism",
    "total_absenteeism",
  ]);
}

function getAttritionTotal(item = {}) {
  return getNumberValue(item, [
    "attritionPastCount",
    "attrition_past_count",
    "attritionCount",
    "attrition_count",
    "attritionPastSixWeeks",
    "attrition_past_six_weeks",
    "attritionSixWeeks",
    "attrition_6_weeks",
    "totalAttrition",
    "total_attrition",
  ]);
}

function getNhoCount(item = {}) {
  return getNumberValue(item, [
    "nhoCount",
    "nho_count",
    "nhoPopulationCount",
    "nho_population_count",
    "newHireOrientationCount",
    "new_hire_orientation_count",
  ]);
}

function getFstCount(item = {}) {
  return getNumberValue(item, [
    "fstCount",
    "fst_count",
    "fstPopulationCount",
    "fst_population_count",
  ]);
}

function getPstCount(item = {}) {
  return getNumberValue(item, [
    "pstCount",
    "pst_count",
    "pstPopulationCount",
    "pst_population_count",
  ]);
}

function getProjectedFromTraining(item = {}) {
  const directProjected = getNumberValue(
    item,
    [
      "projectedCoverageFromTraining",
      "projected_coverage_from_training",
      "projectedFromTraining",
      "projected_from_training",
      "trainingProjectedCoverage",
      "training_projected_coverage",
      "projectedToBeEndorsed",
      "projected_to_be_endorsed",
      "projectedEndorsed",
      "projected_endorsed",
      "pstEndorsedCount",
      "pst_endorsed_count",
    ],
    0,
  );

  if (directProjected > 0) return directProjected;

  const pstCount = getPstCount(item);
  const fstToPstAttrition = getNumberValue(item, [
    "attritionFstToPstCount",
    "attrition_fst_to_pst_count",
  ]);

  return Math.max(0, pstCount - fstToPstAttrition);
}

function getHiringNeeded(item = {}) {
  const directHiringNeeded = getNumberValue(
    item,
    [
      "hiringNeeded",
      "hiring_needed",
      "actualHeadcountNeeds",
      "actual_headcount_needs",
      "projectedEmployeeNeeds",
      "projected_employee_needs",
      "opsPrf",
      "ops_prf",
    ],
    0,
  );

  return directHiringNeeded;
}

function getLeadsToInterview(item = {}) {
  return getNumberValue(item, [
    "leadsToInterview",
    "leads_to_interview",
    "leadsNeeded",
    "leads_needed",
  ]);
}

function getInterviewCount(item = {}) {
  return getNumberValue(item, [
    "interviewCount",
    "interview_count",
    "interviewPopulationCount",
    "interview_population_count",
    "alreadyInterviewed",
    "already_interviewed",
  ]);
}

function getHiredCount(item = {}) {
  const directHired = getNumberValue(
    item,
    ["hiredCount", "hired_count", "hired"],
    0,
  );

  if (directHired > 0) return directHired;

  /*
    Based on your rule:
    FST + PST are already hired, but still under training.
    They are not counted in Actual HC until endorsed to the account.
  */
  return getFstCount(item) + getPstCount(item);
}

function KpiCard({
  title,
  subtitle,
  value,
  footer,
  icon: Icon,
  valueClassName = "text-sibs-primary-1",
  iconClassName = "bg-blue-50 text-blue-600",
}) {
  return (
    <div
      className={`${EDGE} ${CARD_BORDER} min-h-[112px] bg-white p-4 shadow-sm transition hover:-translate-y-[1px] hover:border-sibs-primary-1/20 hover:shadow-md`}
    >
      <div className="flex h-full items-start gap-3">
        <div
          className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-full ${iconClassName}`}
        >
          <Icon size={24} />
        </div>

        <div className="min-w-0 flex-1 text-center">
          <p className="truncate text-[11px] font-extrabold uppercase tracking-wide text-sibs-primary-1">
            {title}
          </p>

          {subtitle && (
            <p className="mt-0.5 truncate text-[10px] font-bold text-slate-500">
              {subtitle}
            </p>
          )}

          <p className={`mt-2 truncate text-3xl font-extrabold ${valueClassName}`}>
            {value}
          </p>

          {footer && (
            <div className="mt-2 text-[11px] font-semibold text-slate-600">
              {footer}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function HeadcountTable({ filteredPlans = [] }) {
  const totals = useMemo(() => {
    const rows = (filteredPlans || []).filter((item) => !item.isAssignedEmptyRow);

    const requiredHeadcount = rows.reduce(
      (sum, item) => sum + getRequiredHeadcount(item),
      0,
    );

    const actualHeadcount = rows.reduce(
      (sum, item) => sum + getActualHeadcount(item),
      0,
    );

    const absenteeismTotal = rows.reduce(
      (sum, item) => sum + getAbsenteeismTotal(item),
      0,
    );

    const attritionTotal = rows.reduce(
      (sum, item) => sum + getAttritionTotal(item),
      0,
    );

    /*
      Buffer logic based on your latest rule:
      - Absenteeism and Attrition are actual totals from the past 6 weeks.
      - Buffer HC = CEILING(total absenteeism / 6) + CEILING(total attrition / 6)
    */
    const absenteeismBuffer = Math.ceil(absenteeismTotal / 6);
    const attritionBuffer = Math.ceil(attritionTotal / 6);
    const bufferHeadcount = absenteeismBuffer + attritionBuffer;

    const effectiveDemand = requiredHeadcount + bufferHeadcount;

    /*
      Projected Coverage:
      Actual HC + training pipeline projected to be endorsed.
      NHO/FST/PST are not Actual HC yet.
    */
    const projectedFromTraining = rows.reduce(
      (sum, item) => sum + getProjectedFromTraining(item),
      0,
    );

    const projectedCoverage = actualHeadcount + projectedFromTraining;

    const computedHiringNeeded = Math.max(
      0,
      effectiveDemand - projectedCoverage,
    );

    const directHiringNeeded = rows.reduce(
      (sum, item) => sum + getHiringNeeded(item),
      0,
    );

    /*
      Use direct backend/page hiring-needed if available.
      Otherwise compute from Effective Demand - Projected Coverage.
    */
    const hiringNeeded =
      directHiringNeeded > 0 ? directHiringNeeded : computedHiringNeeded;

    const totalInterviewed = rows.reduce(
      (sum, item) => sum + getInterviewCount(item),
      0,
    );

    const totalHired = rows.reduce(
      (sum, item) => sum + getHiredCount(item),
      0,
    );

    const directHiringRateAverage =
      rows.length > 0
        ? rows.reduce(
            (sum, item) =>
              sum +
              getNumberValue(
                item,
                [
                  "hiringRate",
                  "hiring_rate",
                  "hiringPlanPercent",
                  "hiring_plan_percent",
                ],
                0,
              ),
            0,
          ) / rows.length
        : 0;

    const hiringRate =
      totalInterviewed > 0
        ? (totalHired / totalInterviewed) * 100
        : directHiringRateAverage;

    const directLeadsToInterview = rows.reduce(
      (sum, item) => sum + getLeadsToInterview(item),
      0,
    );

    const hiringRateDecimal = hiringRate > 0 ? hiringRate / 100 : 0;

    const computedLeadsToInterview =
      hiringRateDecimal > 0 ? Math.ceil(hiringNeeded / hiringRateDecimal) : 0;

    /*
      Use direct page/backend leads if available.
      Otherwise compute using Hiring Needed / Hiring Rate.
    */
    const leadsToInterview =
      directLeadsToInterview > 0
        ? directLeadsToInterview
        : computedLeadsToInterview;

    return {
      records: rows.length,
      requiredHeadcount,
      actualHeadcount,
      absenteeismTotal,
      attritionTotal,
      absenteeismBuffer,
      attritionBuffer,
      bufferHeadcount,
      effectiveDemand,
      projectedCoverage,
      projectedFromTraining,
      hiringNeeded,
      hiringRate,
      leadsToInterview,
    };
  }, [filteredPlans]);

  return (
    <div className="bg-white p-4 sm:p-5">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard
          title="Required HC"
          subtitle="Client Plan"
          value={formatNumber(totals.requiredHeadcount)}
          footer={`Across ${formatNumber(totals.records)} Accounts`}
          icon={UsersRound}
          valueClassName="text-blue-700"
          iconClassName="bg-blue-50 text-blue-600"
        />

        <KpiCard
          title="Actual HC"
          subtitle="Endorsed"
          value={formatNumber(totals.actualHeadcount)}
          footer="Endorsed / On Floor"
          icon={UserRound}
          valueClassName="text-emerald-600"
          iconClassName="bg-emerald-50 text-emerald-600"
        />

        <KpiCard
          title="Buffer HC"
          subtitle="From Past 6 Weeks"
          value={formatNumber(totals.bufferHeadcount)}
          footer={
            <span>
              Abs: <b>{formatNumber(totals.absenteeismBuffer)}</b>
              <span className="mx-2 text-slate-300">|</span>
              Attr: <b>{formatNumber(totals.attritionBuffer)}</b>
            </span>
          }
          icon={ShieldCheck}
          valueClassName="text-violet-700"
          iconClassName="bg-violet-50 text-violet-700"
        />

        <KpiCard
          title="Effective Demand"
          subtitle="Required + Buffer"
          value={formatNumber(totals.effectiveDemand)}
          footer="Required HC + Buffer HC"
          icon={Target}
          valueClassName="text-orange-500"
          iconClassName="bg-orange-50 text-orange-500"
        />

        <KpiCard
          title="Projected Coverage"
          subtitle="Actual + Projected"
          value={formatNumber(totals.projectedCoverage)}
          footer={`Training: ${formatNumber(totals.projectedFromTraining)}`}
          icon={UsersRound}
          valueClassName="text-cyan-700"
          iconClassName="bg-cyan-50 text-cyan-700"
        />

        <KpiCard
          title="Hiring Needed"
          subtitle="Gap"
          value={formatNumber(totals.hiringNeeded)}
          footer="Gap to Cover"
          icon={AlertTriangle}
          valueClassName="text-red-600"
          iconClassName="bg-red-50 text-red-600"
        />

        <KpiCard
          title="Hiring Rate"
          subtitle="Conversion to Hire"
          value={formatPercent(totals.hiringRate, 0)}
          footer="FST + PST / Interview"
          icon={TrendingUp}
          valueClassName="text-blue-700"
          iconClassName="bg-blue-50 text-blue-600"
        />

        <KpiCard
          title="Leads to Interview"
          subtitle="Needed"
          value={formatNumber(totals.leadsToInterview)}
          footer="To Achieve Need"
          icon={BarChart3}
          valueClassName="text-violet-700"
          iconClassName="bg-violet-50 text-violet-700"
        />
      </div>
    </div>
  );
}
