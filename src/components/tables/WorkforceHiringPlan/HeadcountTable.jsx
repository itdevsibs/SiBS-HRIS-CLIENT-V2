import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  CalendarDays,
  Gauge,
  Filter,
  TrendingUp,
  UserPlus,
  UserRoundX,
  UsersRound,
} from "lucide-react";

const EDGE = "rounded-[10px]";
const CARD_BORDER = "border border-[#E8EEF5]";

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

function formatNumber(value, maximumFractionDigits = 0) {
  return toNumber(value).toLocaleString("en-PH", {
    maximumFractionDigits,
  });
}

function formatAnimatedValue(value, decimals = 0, suffix = "") {
  return `${toNumber(value).toLocaleString("en-PH", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  })}${suffix}`;
}

function AnimatedNumber({
  value,
  decimals = 0,
  suffix = "",
  duration = 650,
  className = "",
}) {
  const [displayValue, setDisplayValue] = useState(toNumber(value));
  const displayValueRef = useRef(displayValue);

  useEffect(() => {
    const target = toNumber(value);
    const start = toNumber(displayValueRef.current);
    const difference = target - start;

    if (difference === 0) return undefined;

    let frameId = 0;
    const startTime = performance.now();

    function animateNumber(currentTime) {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const easedProgress = 1 - Math.pow(1 - progress, 3);
      const nextValue = start + difference * easedProgress;

      displayValueRef.current = nextValue;
      setDisplayValue(nextValue);

      if (progress < 1) {
        frameId = requestAnimationFrame(animateNumber);
      } else {
        displayValueRef.current = target;
        setDisplayValue(target);
      }
    }

    frameId = requestAnimationFrame(animateNumber);

    return () => cancelAnimationFrame(frameId);
  }, [value, duration]);

  return (
    <span className={`inline-block tabular-nums ${className}`}>
      {formatAnimatedValue(displayValue, decimals, suffix)}
    </span>
  );
}

function getSignedClass(value = 0) {
  const cleanValue = toNumber(value);

  if (cleanValue < 0) return "text-red-600";
  if (cleanValue > 0) return "text-emerald-600";

  return "text-slate-700";
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

  const absenteeismTotal = rows.reduce(
    (sum, item) => sum + getSixWeekTotal(item, "absenteeism"),
    0,
  );

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

  const absenteeismPercentage =
    actualHeadcount > 0 ? (absenteeismTotal / actualHeadcount) * 100 : 0;

  const attritionPercentage =
    actualHeadcount > 0 ? (attritionTotal / actualHeadcount) * 100 : 0;

  const netActualHeadcount = Math.max(0, actualHeadcount - attritionTotal);
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
    absenteeismTotal,
    absenteeismPercentage,
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

function KpiCard({
  title,
  value,
  subtitle,
  icon,
  valueClassName = "text-sibs-primary-1",
  iconClassName = "bg-blue-50 text-sibs-primary-1",
}) {
  return (
    <div
      className={`${EDGE} ${CARD_BORDER} whp-kpi-card min-h-[132px] bg-white px-5 py-4 shadow-sm transition hover:-translate-y-[1px] hover:border-blue-200 hover:shadow-md`}
    >
      <div className="flex h-full flex-col items-center justify-center text-center">
        <p className="min-h-[36px] text-[13px] font-extrabold leading-[18px] text-[#101828]">
          {title}
        </p>

        <div
          className={`mt-2 flex h-10 w-10 items-center justify-center rounded-full ${iconClassName}`}
        >
          {React.createElement(icon, { size: 28, strokeWidth: 2.4 })}
        </div>

        <div
          className={`whp-kpi-value mt-2 text-3xl font-extrabold leading-none ${valueClassName}`}
        >
          {value}
        </div>

        {subtitle && (
          <p className="mt-1 text-[11px] font-bold leading-4 text-[#344054]">
            {subtitle}
          </p>
        )}
      </div>
    </div>
  );
}

export default function HeadcountTable({ filteredPlans = [] }) {
  const totals = useMemo(() => getTotals(filteredPlans), [filteredPlans]);

  return (
    <div className="bg-transparent">
      <style>
        {`
          @keyframes whpKpiFadeUp {
            from { opacity: 0; transform: translateY(10px); }
            to { opacity: 1; transform: translateY(0); }
          }

          @keyframes whpKpiPulse {
            0%, 100% { transform: scale(1); }
            50% { transform: scale(1.035); }
          }

          .whp-kpi-card { animation: whpKpiFadeUp 0.42s ease-out both; }
          .whp-kpi-card:hover .whp-kpi-value { animation: whpKpiPulse 0.45s ease-out both; }
          .whp-kpi-card:nth-child(1) { animation-delay: 0ms; }
          .whp-kpi-card:nth-child(2) { animation-delay: 45ms; }
          .whp-kpi-card:nth-child(3) { animation-delay: 90ms; }
          .whp-kpi-card:nth-child(4) { animation-delay: 135ms; }
          .whp-kpi-card:nth-child(5) { animation-delay: 180ms; }
          .whp-kpi-card:nth-child(6) { animation-delay: 225ms; }
          .whp-kpi-card:nth-child(7) { animation-delay: 270ms; }
          .whp-kpi-card:nth-child(8) { animation-delay: 315ms; }
          .whp-kpi-card:nth-child(9) { animation-delay: 360ms; }
        `}
      </style>

      <section
        className={`${EDGE} border border-[#E1E7EF] bg-white p-5 shadow-sm`}
      >
        <div className="mb-4 flex flex-col gap-1">
          <h2 className="text-base font-extrabold uppercase tracking-wide text-[#101828]">
            Workforce Plan Overview (Aggregated)
          </h2>
          <p className="text-sm font-semibold text-[#255C95]">
            Aggregated workforce hiring plan metrics based on the selected week,
            cluster, and account filters.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-9">
          <KpiCard
            title="Required Headcount"
            value={<AnimatedNumber value={totals.requiredHeadcount} />}
            icon={UsersRound}
            valueClassName="text-sibs-primary-1"
            iconClassName="bg-blue-50 text-sibs-primary-1"
          />

          <KpiCard
            title="Actual Headcount"
            value={<AnimatedNumber value={totals.actualHeadcount} />}
            icon={UsersRound}
            valueClassName="text-sibs-primary-1"
            iconClassName="bg-blue-50 text-sibs-primary-1"
          />

          <KpiCard
            title="Buffer Percentage"
            value={
              <AnimatedNumber
                value={totals.bufferPercentage}
                decimals={2}
                suffix="%"
                className={getSignedClass(totals.bufferPercentage)}
              />
            }
            subtitle="vs Required HC"
            icon={Gauge}
            valueClassName={getSignedClass(totals.bufferPercentage)}
            iconClassName={
              getSignedClass(totals.bufferPercentage) + " text-sibs-primary-1"
            }
          />

          <KpiCard
            title="Absenteeism (6 weeks)"
            value={<AnimatedNumber value={totals.absenteeismTotal} />}
            subtitle={`${formatNumber(totals.absenteeismPercentage, 2)}% Absenteeism %`}
            icon={CalendarDays}
            valueClassName="text-orange-500"
            iconClassName="bg-orange-50 text-orange-500"
          />

          <KpiCard
            title="Attrition (6 weeks)"
            value={<AnimatedNumber value={totals.attritionTotal} />}
            subtitle={`${formatNumber(totals.attritionPercentage, 2)}% Attrition %`}
            icon={UserRoundX}
            valueClassName="text-red-600"
            iconClassName="bg-red-50 text-red-600"
          />

          <KpiCard
            title="Net Actual HC"
            value={<AnimatedNumber value={totals.netActualHeadcount} />}
            icon={UsersRound}
            valueClassName="text-sibs-primary-1"
            iconClassName="bg-blue-50 text-sibs-primary-1"
          />

          <KpiCard
            title="Hiring Needed"
            value={<AnimatedNumber value={totals.hiringNeeded} />}
            icon={UserPlus}
            valueClassName="text-emerald-600"
            iconClassName="bg-emerald-50 text-emerald-600"
          />

          <KpiCard
            title="Hiring Rate (Leads to JO)"
            value={
              <AnimatedNumber
                value={totals.hiringRate * 100}
                decimals={1}
                suffix="%"
              />
            }
            icon={TrendingUp}
            valueClassName="text-cyan-600"
            iconClassName="bg-cyan-50 text-cyan-600"
          />

          <KpiCard
            title="Leads to Interview"
            value={<AnimatedNumber value={totals.leadsToInterviewToGenerate} />}
            subtitle="To Generate"
            icon={Filter}
            valueClassName="text-violet-700"
            iconClassName="bg-violet-50 text-violet-700"
          />
        </div>
      </section>
    </div>
  );
}
