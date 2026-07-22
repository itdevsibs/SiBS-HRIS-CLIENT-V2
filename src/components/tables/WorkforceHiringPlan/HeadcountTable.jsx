import React, { useMemo } from "react";
import {
  CalendarX2,
  CheckCircle2,
  Gauge,
  TrendingUp,
  UserPlus,
  UserRoundX,
  Users,
} from "lucide-react";
import KpiCard from "../../recruitment/workforceHiringOverview/shared/KpiCard";

function toNumber(value) {
  if (value === null || value === undefined || value === "") return 0;

  const cleanValue = String(value).replace(/,/g, "").replace(/%/g, "").trim();
  const numberValue = Number(cleanValue);

  return Number.isFinite(numberValue) ? numberValue : 0;
}

function getNumberValue(item = {}, keys = [], fallback = 0) {
  for (const key of keys) {
    const value = item?.[key];

    if (value !== undefined && value !== null && value !== "") {
      const numberValue = toNumber(value);

      if (Number.isFinite(numberValue)) return numberValue;
    }
  }

  return toNumber(fallback);
}

function getArrayValue(value) {
  if (Array.isArray(value)) return value;

  if (typeof value === "string" && value.trim().startsWith("[")) {
    try {
      const parsed = JSON.parse(value);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }

  return [];
}

function getSixWeekTotal(item = {}, type = "absenteeism") {
  const arrayKeys =
    type === "absenteeism"
      ? [
          "absenteeismTrend",
          "absenteeism_trend",
          "absenteeismWeeklyCounts",
          "absenteeism_weekly_counts",
          "absenteeismPastSixWeeksTrend",
          "absenteeism_past_six_weeks_trend",
          "weeklyAbsenteeism",
          "weekly_absenteeism",
        ]
      : [
          "attritionTrend",
          "attrition_trend",
          "attritionWeeklyCounts",
          "attrition_weekly_counts",
          "attritionPastSixWeeksTrend",
          "attrition_past_six_weeks_trend",
          "weeklyAttrition",
          "weekly_attrition",
        ];

  for (const key of arrayKeys) {
    const series = getArrayValue(item?.[key]);

    if (series.length > 0) {
      return series.reduce((sum, value) => sum + toNumber(value), 0);
    }
  }

  const prefix = type === "absenteeism" ? "absenteeism" : "attrition";

  const keyedTotal = [1, 2, 3, 4, 5, 6].reduce(
    (sum, weekNumber) =>
      sum +
      getNumberValue(item, [
        `${prefix}Week${weekNumber}`,
        `${prefix}_week_${weekNumber}`,
        `week${weekNumber}${type === "absenteeism" ? "Absenteeism" : "Attrition"}`,
        `week_${weekNumber}_${type}`,
      ]),
    0,
  );

  if (keyedTotal > 0) return keyedTotal;

  return type === "absenteeism"
    ? getNumberValue(item, [
        "absenteeismSixWeeks",
        "absenteeism_6_weeks",
        "absenteeismPastSixWeeks",
        "absenteeism_past_six_weeks",
        "totalAbsenteeism",
        "total_absenteeism",
        "absenteeismCount",
        "absenteeism_count",
      ])
    : getNumberValue(item, [
        "attritionSixWeeks",
        "attrition_6_weeks",
        "attritionPastSixWeeks",
        "attrition_past_six_weeks",
        "totalAttrition",
        "total_attrition",
        "attritionPastCount",
        "attrition_past_count",
        "attritionCount",
        "attrition_count",
      ]);
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

function getAcceptedJobOffer(item = {}) {
  return getNumberValue(item, [
    "acceptedJobOffer",
    "accepted_job_offer",
    "acceptedJoCount",
    "accepted_jo_count",
    "acceptedJOCount",
    "accepted_job_offer_count",
    "interviewCount",
    "interview_count",
    "interviewPopulationCount",
    "interview_population_count",
    "alreadyInterviewed",
    "already_interviewed",
  ]);
}

function getHiredCount(item = {}) {
  const directHired = getNumberValue(item, [
    "actualHiredCount",
    "actual_hired_count",
    "hiredEmployeeCount",
    "hired_employee_count",
    "hiredCount",
    "hired_count",
  ]);

  if (directHired > 0) return directHired;

  return getNumberValue(item, [
    "fstCount",
    "fst_count",
    "fstPopulationCount",
    "fst_population_count",
  ]);
}

function getLeadsToInterview(item = {}) {
  return getNumberValue(item, [
    "leadsToInterview",
    "leads_to_interview",
    "leadsToInterviewCount",
    "leads_to_interview_count",
    "leadsNeeded",
    "leads_needed",
  ]);
}

function normalizeRate(value) {
  const cleanValue = toNumber(value);

  if (cleanValue <= 0) return 0;
  if (cleanValue > 1) return cleanValue / 100;

  return cleanValue;
}

function getTotals(filteredPlans = []) {
  const rows = (filteredPlans || []).filter((item) => !item.isAssignedEmptyRow);

  const requiredHeadcount = rows.reduce(
    (sum, item) => sum + getRequiredHeadcount(item),
    0,
  );

  const actualHeadcount = rows.reduce(
    (sum, item) => sum + getActualHeadcount(item),
    0,
  );

  /*
    Selected-week average absenteeism for the KPI card.
    Do NOT use getSixWeekTotal(item, "absenteeism") here.
  */
  const averageAbsentHeadcountTotal = rows.reduce(
    (sum, item) =>
      sum +
      getNumberValue(item, [
        "averageAbsentHeadcount",
        "average_absent_headcount",
      ]),
    0,
  );

  const currentWeekAbsenteeismTotal = rows.reduce(
    (sum, item) =>
      sum +
      getNumberValue(item, [
        "currentWeekAbsenteeismCount",
        "current_week_absenteeism_count",
        "absenteeismCurrentWeekCount",
        "absenteeism_current_week_count",
      ]),
    0,
  );

  const scheduledCountTotal = rows.reduce(
    (sum, item) =>
      sum + getNumberValue(item, ["scheduledCount", "scheduled_count"]),
    0,
  );

  const absenteeismPercentage =
    scheduledCountTotal > 0
      ? (currentWeekAbsenteeismTotal / scheduledCountTotal) * 100
      : 0;

  /*
    Keep attrition as 6-week total.
  */
  const attritionTotal = rows.reduce(
    (sum, item) => sum + getSixWeekTotal(item, "attrition"),
    0,
  );

  const acceptedJobOffer = rows.reduce(
    (sum, item) => sum + getAcceptedJobOffer(item),
    0,
  );

  const hiredCount = rows.reduce((sum, item) => sum + getHiredCount(item), 0);

  const directLeadsToInterview = rows.reduce(
    (sum, item) => sum + getLeadsToInterview(item),
    0,
  );

  const directHiringRate = normalizeRate(
    rows.reduce(
      (sum, item) => sum + normalizeRate(item?.hiringRate ?? item?.hiring_rate),
      0,
    ) / Math.max(rows.length, 1),
  );

  const hiringRateFromLeads =
    acceptedJobOffer > 0 && directLeadsToInterview > 0
      ? acceptedJobOffer / directLeadsToInterview
      : 0;

  const hiringRate = hiringRateFromLeads || directHiringRate;

  const bufferPercentage =
    requiredHeadcount > 0
      ? ((actualHeadcount - requiredHeadcount) / requiredHeadcount) * 100
      : 0;

  const attritionPercentage =
    actualHeadcount > 0 ? (attritionTotal / actualHeadcount) * 100 : 0;

  /*
    Use selected-week average absenteeism in net HC calculation.
    This prevents the 6-week total from destroying Net Actual HC.
  */
  const netActualHeadcount = Math.max(
    0,
    actualHeadcount - averageAbsentHeadcountTotal - attritionTotal,
  );

  const hiringNeeded = Math.max(0, requiredHeadcount - netActualHeadcount);

  const leadsToInterviewToGenerate =
    hiringNeeded <= 0
      ? 0
      : hiringRate > 0
        ? Math.ceil(hiringNeeded / hiringRate)
        : hiringNeeded;

  return {
    records: rows.length,
    requiredHeadcount,
    actualHeadcount,
    bufferPercentage,

    absenteeismTotal: averageAbsentHeadcountTotal,
    absenteeismPercentage,

    currentWeekAbsenteeismTotal,
    scheduledCountTotal,

    attritionTotal,
    attritionPercentage,
    netActualHeadcount,
    hiringNeeded,
    acceptedJobOffer,
    hiredCount,
    hiringRate,
    leadsToInterviewToGenerate,
  };
}

function formatKpiNumber(value, decimals = 0) {
  const numberValue = toNumber(value);

  return numberValue.toLocaleString("en-US", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}

function formatKpiPercent(value, decimals = 2) {
  return `${formatKpiNumber(value, decimals)}%`;
}

export default function HeadcountTable({ filteredPlans = [] }) {
  const totals = useMemo(() => getTotals(filteredPlans), [filteredPlans]);

  return (
    <section className="mb-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
      <div className="mb-4">
        <h2 className="text-base font-bold uppercase tracking-tight text-slate-900">
          Workforce Plan Overview (Aggregated)
        </h2>
        <p className="mt-1 text-sm font-medium text-sibs-primary-70">
          Aggregated workforce hiring plan metrics based on the selected week,
          cluster, and account filters.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-9">
        <KpiCard
          title="Required Headcount"
          value={formatKpiNumber(totals.requiredHeadcount)}
          icon={Users}
          tone="blue"
        />

        <KpiCard
          title="Actual Headcount"
          value={formatKpiNumber(totals.actualHeadcount)}
          icon={Users}
          tone="blue"
        />

        <KpiCard
          title="Buffer Percentage"
          value={formatKpiPercent(totals.bufferPercentage, 2)}
          icon={Gauge}
          subtitle="vs Required HC"
          tone="green2"
        />

        <KpiCard
          title="Absenteeism"
          value={formatKpiNumber(Math.round(totals.absenteeismTotal))}
          sideValue={formatKpiPercent(totals.absenteeismPercentage, 2)}
          icon={CalendarX2}
          subtitle="Absenteeism %"
          tone="orange"
        />

        <KpiCard
          title="Attrition"
          value={formatKpiNumber(totals.attritionTotal)}
          sideValue={formatKpiPercent(totals.attritionPercentage, 2)}
          icon={UserRoundX}
          subtitle="Attrition %"
          tone="red"
        />

        <KpiCard
          title="Net Actual HC"
          value={formatKpiNumber(Math.round(totals.netActualHeadcount))}
          icon={Users}
          tone="blue"
        />

        <KpiCard
          title="Hiring Needed"
          value={formatKpiNumber(Math.round(totals.hiringNeeded))}
          icon={UserPlus}
          tone="purple"
        />

        <KpiCard
          title="Hiring Rate"
          value={formatKpiPercent(totals.hiringRate * 100, 1)}
          icon={TrendingUp}
          subtitle="Leads to JO"
          tone="teal"
        />

        <KpiCard
          title="Hired Count"
          value={formatKpiNumber(totals.hiredCount)}
          icon={CheckCircle2}
          tone="green"
        />
      </div>
    </section>
  );
}