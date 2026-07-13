import React, { useMemo } from "react";

const EDGE = "rounded-[10px]";
const CARD = `${EDGE} border border-[#E6ECF2] bg-white shadow-sm`;

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
          "weeklyAbsenteeism",
          "weekly_absenteeism",
        ]
      : [
          "attritionTrend",
          "attrition_trend",
          "attritionWeeklyCounts",
          "attrition_weekly_counts",
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

function getPerWeekSeries(item = {}, type = "absenteeism") {
  const arrayKeys =
    type === "absenteeism"
      ? [
          "absenteeismTrend",
          "absenteeism_trend",
          "absenteeismWeeklyCounts",
          "absenteeism_weekly_counts",
          "weeklyAbsenteeism",
          "weekly_absenteeism",
        ]
      : [
          "attritionTrend",
          "attrition_trend",
          "attritionWeeklyCounts",
          "attrition_weekly_counts",
          "weeklyAttrition",
          "weekly_attrition",
        ];

  for (const key of arrayKeys) {
    const series = getArrayValue(item?.[key]).map(toNumber);

    if (series.length >= 6) return series.slice(-6);
    if (series.length > 0)
      return [...Array.from({ length: 6 - series.length }, () => 0), ...series];
  }

  const prefix = type === "absenteeism" ? "absenteeism" : "attrition";

  return [1, 2, 3, 4, 5, 6].map((weekNumber) =>
    getNumberValue(item, [
      `${prefix}Week${weekNumber}`,
      `${prefix}_week_${weekNumber}`,
      `week${weekNumber}${type === "absenteeism" ? "Absenteeism" : "Attrition"}`,
      `week_${weekNumber}_${type}`,
    ]),
  );
}

function getRequiredHeadcount(item = {}) {
  return getNumberValue(item, [
    "requiredHeadcount",
    "required_headcount",
    "requiredHC",
    "required_hc",
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
  ]);
}

function getNhoCount(item = {}) {
  return getNumberValue(item, [
    "nhoCount",
    "nho_count",
    "nhoPopulationCount",
    "nho_population_count",
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

function getGoLiveCount(item = {}) {
  const direct = getNumberValue(item, [
    "goLiveCount",
    "go_live_count",
    "goLive",
    "go_live",
    "liveCount",
    "live_count",
    "projectedToBeEndorsed",
    "projected_to_be_endorsed",
    "projectedEndorsed",
    "projected_endorsed",
  ]);

  if (direct > 0) return direct;

  const pstCount = getPstCount(item);
  const fstToPstAttrition = getNumberValue(item, [
    "attritionFstToPstCount",
    "attrition_fst_to_pst_count",
    "fstToPstAttritionCount",
    "fst_to_pst_attrition_count",
  ]);

  return Math.max(0, pstCount - fstToPstAttrition);
}

function getHiredCount(item = {}) {
  const direct = getNumberValue(item, [
    "actualHiredCount",
    "actual_hired_count",
    "hiredEmployeeCount",
    "hired_employee_count",
    "hiredCount",
    "hired_count",
  ]);

  if (direct > 0) return direct;

  return getFstCount(item);
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

function formatPercent(value, decimals = 1) {
  return `${(toNumber(value) * 100).toFixed(decimals)}%`;
}

function formatSignedPercentFromWhole(value, decimals = 2) {
  return `${toNumber(value).toFixed(decimals)}%`;
}

function getSignedClass(value = 0) {
  const cleanValue = toNumber(value);

  if (cleanValue < 0) return "text-red-600";
  if (cleanValue > 0) return "text-emerald-600";

  return "text-slate-700";
}

function getWeekStartDate(activeWeek) {
  const value =
    activeWeek?.startDate || activeWeek?.weekStart || activeWeek?.week_start;

  if (value) {
    const date = new Date(`${value}T00:00:00`);
    if (!Number.isNaN(date.getTime())) return date;
  }

  return new Date();
}

function formatWeekDate(date) {
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function addDays(date, days) {
  const nextDate = new Date(date);
  nextDate.setDate(nextDate.getDate() + days);
  return nextDate;
}

function scaleValue(value, weekIndex, dropRate = 0.04) {
  const scaled = toNumber(value) * Math.max(0, 1 - weekIndex * dropRate);
  return Math.max(0, Math.round(scaled));
}

function getTotals(rows = []) {
  const validRows = rows.filter((item) => !item.isAssignedEmptyRow);

  const requiredHeadcount = validRows.reduce(
    (sum, item) => sum + getRequiredHeadcount(item),
    0,
  );
  const actualHeadcount = validRows.reduce(
    (sum, item) => sum + getActualHeadcount(item),
    0,
  );
  const absenteeismTotal = validRows.reduce(
    (sum, item) => sum + getSixWeekTotal(item, "absenteeism"),
    0,
  );
  const attritionTotal = validRows.reduce(
    (sum, item) => sum + getSixWeekTotal(item, "attrition"),
    0,
  );
  const acceptedJobOffer = validRows.reduce(
    (sum, item) => sum + getAcceptedJobOffer(item),
    0,
  );
  const nhoCount = validRows.reduce((sum, item) => sum + getNhoCount(item), 0);
  const fstCount = validRows.reduce((sum, item) => sum + getFstCount(item), 0);
  const pstCount = validRows.reduce((sum, item) => sum + getPstCount(item), 0);
  const goLiveCount = validRows.reduce(
    (sum, item) => sum + getGoLiveCount(item),
    0,
  );
  const hiredCount = validRows.reduce(
    (sum, item) => sum + getHiredCount(item),
    0,
  );
  const directLeadsToInterview = validRows.reduce(
    (sum, item) => sum + getLeadsToInterview(item),
    0,
  );

  const hiringRateFromLeads =
    acceptedJobOffer > 0 && directLeadsToInterview > 0
      ? acceptedJobOffer / directLeadsToInterview
      : 0;

  const averageDirectHiringRate = normalizeRate(
    validRows.reduce(
      (sum, item) => sum + normalizeRate(item?.hiringRate ?? item?.hiring_rate),
      0,
    ) / Math.max(validRows.length, 1),
  );

  const hiringRate = hiringRateFromLeads || averageDirectHiringRate;
  const bufferPercentage =
    requiredHeadcount > 0
      ? ((actualHeadcount - requiredHeadcount) / requiredHeadcount) * 100
      : 0;
  const netActualHeadcount = Math.max(0, actualHeadcount - attritionTotal);
  const hiringNeeded = Math.max(0, requiredHeadcount - netActualHeadcount);
  const leadsToGenerate =
    hiringNeeded <= 0
      ? 0
      : hiringRate > 0
        ? Math.ceil(hiringNeeded / hiringRate)
        : hiringNeeded;

  const absenteeismSeries = validRows.reduce(
    (sum, item) =>
      sum.map(
        (value, index) => value + getPerWeekSeries(item, "absenteeism")[index],
      ),
    [0, 0, 0, 0, 0, 0],
  );

  const attritionSeries = validRows.reduce(
    (sum, item) =>
      sum.map(
        (value, index) => value + getPerWeekSeries(item, "attrition")[index],
      ),
    [0, 0, 0, 0, 0, 0],
  );

  return {
    records: validRows.length,
    requiredHeadcount,
    actualHeadcount,
    absenteeismTotal,
    attritionTotal,
    bufferPercentage,
    netActualHeadcount,
    hiringNeeded,
    acceptedJobOffer,
    nhoCount,
    fstCount,
    pstCount,
    goLiveCount,
    hiredCount,
    hiringRate,
    leadsToGenerate,
    absenteeismSeries,
    attritionSeries,
  };
}

function buildPlanRows(totals, activeWeek) {
  const startDate = getWeekStartDate(activeWeek);
  const weeklyActualGain = Math.max(
    0,
    Math.round((totals.goLiveCount || totals.hiredCount) / 7),
  );

  return Array.from({ length: 6 }, (_, index) => {
    const actualHeadcount = totals.actualHeadcount + weeklyActualGain * index;
    const attritionTotal = scaleValue(totals.attritionTotal, index, 0.02);
    const netActualHeadcount = Math.max(0, actualHeadcount - attritionTotal);
    const hiringNeeded = Math.max(
      0,
      totals.requiredHeadcount - netActualHeadcount,
    );
    const acceptedJobOffer = scaleValue(totals.acceptedJobOffer, index, 0.04);
    const nhoCount = scaleValue(totals.nhoCount, index, 0.035);
    const fstCount = scaleValue(totals.fstCount, index, 0.04);
    const pstCount = scaleValue(totals.pstCount, index, 0.04);
    const goLiveCount = scaleValue(totals.goLiveCount, index, 0.04);
    const hiredCount = scaleValue(totals.hiredCount, index, 0.045);
    const leadsToGenerate =
      hiringNeeded <= 0
        ? 0
        : totals.hiringRate > 0
          ? Math.ceil(hiringNeeded / totals.hiringRate)
          : hiringNeeded;

    return {
      weekDate: addDays(startDate, index * 7),
      requiredHeadcount: totals.requiredHeadcount,
      actualHeadcount,
      bufferPercentage:
        totals.requiredHeadcount > 0
          ? ((actualHeadcount - totals.requiredHeadcount) /
              totals.requiredHeadcount) *
            100
          : 0,
      netActualHeadcount,
      hiringNeeded,
      acceptedJobOffer,
      nhoCount,
      fstCount,
      pstCount,
      goLiveCount,
      hiredCount,
      hiringRate: totals.hiringRate,
      leadsToGenerate,
    };
  });
}

function MiniLineChart({
  values = [],
  labels = [],
  color = "#155EEF",
  suffix = "",
}) {
  const width = 360;
  const height = 170;
  const paddingX = 34;
  const paddingTop = 22;
  const paddingBottom = 34;
  const cleanValues = values.map(toNumber);
  const maxValue = Math.max(...cleanValues, 1);
  const minValue = Math.min(...cleanValues, 0);
  const range = Math.max(maxValue - minValue, 1);
  const usableWidth = width - paddingX * 2;
  const usableHeight = height - paddingTop - paddingBottom;

  const points = cleanValues.map((value, index) => {
    const x =
      paddingX + (usableWidth / Math.max(cleanValues.length - 1, 1)) * index;
    const y =
      paddingTop + usableHeight - ((value - minValue) / range) * usableHeight;

    return { x, y, value };
  });

  const pathData = points
    .map((point, index) => `${index === 0 ? "M" : "L"} ${point.x} ${point.y}`)
    .join(" ");

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      className="h-[190px] w-full overflow-visible"
      role="img"
    >
      {[0, 1, 2].map((gridIndex) => {
        const y = paddingTop + (usableHeight / 2) * gridIndex;
        const labelValue = maxValue - ((maxValue - minValue) / 2) * gridIndex;

        return (
          <g key={gridIndex}>
            <text
              x="0"
              y={y + 4}
              className="fill-slate-700 text-[10px] font-bold"
            >
              {suffix === "%"
                ? `${labelValue.toFixed(0)}%`
                : formatNumber(labelValue)}
            </text>
            <line
              x1="34"
              x2={width - 8}
              y1={y}
              y2={y}
              stroke="#EEF2F6"
              strokeWidth="1"
            />
          </g>
        );
      })}

      <path
        d={pathData}
        fill="none"
        stroke={color}
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="whp-line-draw"
      />

      {points.map((point, index) => (
        <g
          key={index}
          className="whp-point-pop"
          style={{ animationDelay: `${250 + index * 85}ms` }}
        >
          <circle
            cx={point.x}
            cy={point.y}
            r="4.5"
            fill={color}
            stroke="white"
            strokeWidth="2"
          />
          <text
            x={point.x}
            y={point.y - 12}
            textAnchor="middle"
            className="fill-slate-900 text-[10px] font-extrabold"
          >
            {suffix === "%"
              ? `${point.value.toFixed(1)}%`
              : formatNumber(point.value)}
          </text>
        </g>
      ))}

      {labels.map((label, index) => (
        <text
          key={label}
          x={points[index]?.x || paddingX}
          y={height - 8}
          textAnchor="middle"
          className="fill-slate-700 text-[10px] font-bold"
        >
          {label}
        </text>
      ))}
    </svg>
  );
}

function SummaryTable({ planRows = [] }) {
  const totals = planRows.reduce(
    (sum, item) => ({
      requiredHeadcount: sum.requiredHeadcount + item.requiredHeadcount,
      actualHeadcount: sum.actualHeadcount + item.actualHeadcount,
      netActualHeadcount: sum.netActualHeadcount + item.netActualHeadcount,
      hiringNeeded: sum.hiringNeeded + item.hiringNeeded,
      acceptedJobOffer: sum.acceptedJobOffer + item.acceptedJobOffer,
      nhoCount: sum.nhoCount + item.nhoCount,
      fstCount: sum.fstCount + item.fstCount,
      pstCount: sum.pstCount + item.pstCount,
      goLiveCount: sum.goLiveCount + item.goLiveCount,
      hiredCount: sum.hiredCount + item.hiredCount,
      leadsToGenerate: sum.leadsToGenerate + item.leadsToGenerate,
    }),
    {
      requiredHeadcount: 0,
      actualHeadcount: 0,
      netActualHeadcount: 0,
      hiringNeeded: 0,
      acceptedJobOffer: 0,
      nhoCount: 0,
      fstCount: 0,
      pstCount: 0,
      goLiveCount: 0,
      hiredCount: 0,
      leadsToGenerate: 0,
    },
  );

  const average = {
    requiredHeadcount: totals.requiredHeadcount / Math.max(planRows.length, 1),
    actualHeadcount: totals.actualHeadcount / Math.max(planRows.length, 1),
    netActualHeadcount:
      totals.netActualHeadcount / Math.max(planRows.length, 1),
    hiringNeeded: totals.hiringNeeded / Math.max(planRows.length, 1),
  };

  return (
    <div className={`${CARD} overflow-hidden`}>
      <div className="border-b border-[#E6ECF2] px-5 py-4">
        <h2 className="text-base font-extrabold uppercase tracking-wide text-[#101828]">
          6-Week Headcount Plan
        </h2>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[1180px] border-separate border-spacing-0 text-left">
          <thead>
            <tr className="bg-[#F5F7FA] text-xs font-extrabold uppercase tracking-wide text-sibs-primary-1">
              <th className="border-b border-[#E1E7EF] px-4 py-3">
                Week
                <br />
                (Start of Week)
              </th>
              <th className="border-b border-[#E1E7EF] px-4 py-3 text-center">
                Required
                <br />
                Headcount
              </th>
              <th className="border-b border-[#E1E7EF] px-4 py-3 text-center">
                Actual
                <br />
                Headcount
              </th>
              <th className="border-b border-[#E1E7EF] px-4 py-3 text-center">
                Buffer
                <br />
                Percentage
              </th>
              <th className="border-b border-[#E1E7EF] px-4 py-3 text-center">
                Net Actual
                <br />
                HC
              </th>
              <th className="border-b border-[#E1E7EF] px-4 py-3 text-center">
                Hiring
                <br />
                Needed
              </th>
              <th className="border-b border-[#E1E7EF] px-4 py-3 text-center">
                Accepted
                <br />
                Job Offer
              </th>
              <th className="border-b border-[#E1E7EF] px-4 py-3 text-center">
                NHO
                <br />
                Count
              </th>
              <th className="border-b border-[#E1E7EF] px-4 py-3 text-center">
                FST
                <br />
                Count
              </th>
              <th className="border-b border-[#E1E7EF] px-4 py-3 text-center">
                PST
                <br />
                Count
              </th>
              <th className="border-b border-[#E1E7EF] px-4 py-3 text-center">
                Go Live
              </th>
              <th className="border-b border-[#E1E7EF] px-4 py-3 text-center">
                Hired
                <br />
                Count
              </th>
              <th className="border-b border-[#E1E7EF] px-4 py-3 text-center">
                Hiring Rate
                <br />
                (Leads to JO)
              </th>
              <th className="border-b border-[#E1E7EF] px-4 py-3 text-center">
                Leads to Interview
                <br />
                (To Generate)
              </th>
            </tr>
          </thead>

          <tbody>
            {planRows.map((item, index) => (
              <tr key={index} className="transition hover:bg-[#FAFBFC]">
                <td className="border-b border-[#EDF1F5] px-4 py-3 text-sm font-bold text-sibs-primary-1">
                  {formatWeekDate(item.weekDate)}
                </td>
                <td className="border-b border-[#EDF1F5] px-4 py-3 text-center text-sm font-extrabold text-sibs-primary-1">
                  {formatNumber(item.requiredHeadcount)}
                </td>
                <td className="border-b border-[#EDF1F5] px-4 py-3 text-center text-sm font-extrabold text-sibs-primary-1">
                  {formatNumber(item.actualHeadcount)}
                </td>
                <td
                  className={`border-b border-[#EDF1F5] px-4 py-3 text-center text-sm font-extrabold ${getSignedClass(item.bufferPercentage)}`}
                >
                  {formatSignedPercentFromWhole(item.bufferPercentage, 2)}
                </td>
                <td className="border-b border-[#EDF1F5] px-4 py-3 text-center text-sm font-extrabold text-sibs-primary-1">
                  {formatNumber(item.netActualHeadcount)}
                </td>
                <td className="border-b border-[#EDF1F5] px-4 py-3 text-center text-sm font-extrabold text-red-600">
                  {formatNumber(item.hiringNeeded)}
                </td>
                <td className="border-b border-[#EDF1F5] px-4 py-3 text-center text-sm font-extrabold text-sibs-primary-1">
                  {formatNumber(item.acceptedJobOffer)}
                </td>
                <td className="border-b border-[#EDF1F5] px-4 py-3 text-center text-sm font-extrabold text-sibs-primary-1">
                  {formatNumber(item.nhoCount)}
                </td>
                <td className="border-b border-[#EDF1F5] px-4 py-3 text-center text-sm font-extrabold text-sibs-primary-1">
                  {formatNumber(item.fstCount)}
                </td>
                <td className="border-b border-[#EDF1F5] px-4 py-3 text-center text-sm font-extrabold text-sibs-primary-1">
                  {formatNumber(item.pstCount)}
                </td>
                <td className="border-b border-[#EDF1F5] px-4 py-3 text-center text-sm font-extrabold text-emerald-700">
                  {formatNumber(item.goLiveCount)}
                </td>
                <td className="border-b border-[#EDF1F5] px-4 py-3 text-center text-sm font-extrabold text-sibs-primary-1">
                  {formatNumber(item.hiredCount)}
                </td>
                <td className="border-b border-[#EDF1F5] px-4 py-3 text-center text-sm font-extrabold text-sibs-primary-1">
                  {formatPercent(item.hiringRate, 1)}
                </td>
                <td className="border-b border-[#EDF1F5] px-4 py-3 text-center text-sm font-extrabold text-violet-700">
                  {formatNumber(item.leadsToGenerate)}
                </td>
              </tr>
            ))}
          </tbody>

          {planRows.length > 0 && (
            <tfoot>
              <tr className="bg-[#F8FAFC] text-sm font-extrabold text-sibs-primary-1">
                <td className="px-4 py-3">TOTAL / AVG.</td>
                <td className="px-4 py-3 text-center">
                  {formatNumber(average.requiredHeadcount)}
                </td>
                <td className="px-4 py-3 text-center">
                  {formatNumber(average.actualHeadcount)}
                </td>
                <td className="px-4 py-3 text-center">—</td>
                <td className="px-4 py-3 text-center">
                  {formatNumber(average.netActualHeadcount)}
                </td>
                <td className="px-4 py-3 text-center text-red-600">
                  {formatNumber(average.hiringNeeded)}
                </td>
                <td className="px-4 py-3 text-center">
                  {formatNumber(totals.acceptedJobOffer)}
                </td>
                <td className="px-4 py-3 text-center">
                  {formatNumber(totals.nhoCount)}
                </td>
                <td className="px-4 py-3 text-center">
                  {formatNumber(totals.fstCount)}
                </td>
                <td className="px-4 py-3 text-center">
                  {formatNumber(totals.pstCount)}
                </td>
                <td className="px-4 py-3 text-center text-emerald-700">
                  {formatNumber(totals.goLiveCount)}
                </td>
                <td className="px-4 py-3 text-center">
                  {formatNumber(totals.hiredCount)}
                </td>
                <td className="px-4 py-3 text-center">
                  {formatPercent(planRows[0]?.hiringRate || 0, 1)}
                </td>
                <td className="px-4 py-3 text-center text-violet-700">
                  {formatNumber(totals.leadsToGenerate)}
                </td>
              </tr>
            </tfoot>
          )}
        </table>
      </div>
    </div>
  );
}

function PipelineFlowCard({ totals }) {
  const acceptedJobOffer = Number(totals.acceptedJobOffer || 0);
  const nhoCount = Number(totals.nhoCount || 0);
  const fstCount = Number(totals.fstCount || 0);
  const pstCount = Number(totals.pstCount || 0);
  const goLiveCount = Number(totals.goLiveCount || 0);

  const baselineY = 132;
  const minHeight = 44;
  const maxHeight = 92;

  const maxStageValue = Math.max(
    acceptedJobOffer,
    nhoCount,
    fstCount,
    pstCount,
    goLiveCount,
    1,
  );

  function getStageHeight(value) {
    const cleanValue = Number(value || 0);

    if (cleanValue <= 0) return minHeight;

    return Math.round(
      minHeight + (cleanValue / maxStageValue) * (maxHeight - minHeight),
    );
  }

  const stages = [
    {
      key: "accepted",
      label1: "Accepted",
      label2: "Job Offer",
      value: acceptedJobOffer,
      x: 16,
      w: 50,
      h: getStageHeight(acceptedJobOffer),
      color: "#1F5FDA",
      sideColor: "#D8EEF4",
      sideShade: "#C8E3EE",
      labelColor: "#0B315F",
    },
    {
      key: "nho",
      label1: "NHO",
      label2: "Count",
      value: nhoCount,
      x: 82,
      w: 48,
      h: getStageHeight(nhoCount),
      color: "#6A48A8",
      sideColor: "#D8EEF4",
      sideShade: "#C8E3EE",
      labelColor: "#0B315F",
    },
    {
      key: "fst",
      label1: "FST",
      label2: "Count",
      value: fstCount,
      x: 148,
      w: 48,
      h: getStageHeight(fstCount),
      color: "#078C96",
      sideColor: "#F5EFE5",
      sideShade: "#E8DAC3",
      labelColor: "#0B315F",
    },
    {
      key: "pst",
      label1: "PST",
      label2: "Count",
      value: pstCount,
      x: 214,
      w: 48,
      h: getStageHeight(pstCount),
      color: "#F47C0B",
      sideColor: "#F5EFE5",
      sideShade: "#E8DAC3",
      labelColor: "#0B315F",
    },
    {
      key: "goLive",
      label1: "Go Live",
      label2: "",
      value: goLiveCount,
      x: 280,
      w: 48,
      h: getStageHeight(goLiveCount),
      color: "#4B9229",
      sideColor: "",
      sideShade: "",
      labelColor: "#4B9229",
    },
  ].map((stage) => ({
    ...stage,
    y: baselineY - stage.h,
  }));

  function getNumberValue(...values) {
    for (const value of values) {
      if (value !== undefined && value !== null && value !== "") {
        const cleanValue = String(value)
          .replace(/,/g, "")
          .replace(/%/g, "")
          .trim();

        const numberValue = Number(cleanValue);

        if (Number.isFinite(numberValue)) {
          return numberValue;
        }
      }
    }

    return 0;
  }

  function getAttritionCountByKey(key) {
    if (key === "accepted") {
      return getNumberValue(
        totals.acceptedToNhoAttritionCount,
        totals.accepted_to_nho_attrition_count,
        totals.acceptedToNhoCount,
        totals.accepted_to_nho_count,
        totals.joToNhoAttritionCount,
        totals.jo_to_nho_attrition_count,
        totals.attritionAcceptedToNhoCount,
        totals.attrition_accepted_to_nho_count,
        totals.attritionInterviewToNhoCount,
        totals.attrition_interview_to_nho_count,
      );
    }

    if (key === "nho") {
      return getNumberValue(
        totals.nhoToFstAttritionCount,
        totals.nho_to_fst_attrition_count,
        totals.nhoToFstCount,
        totals.nho_to_fst_count,
        totals.attritionNhoToFstCount,
        totals.attrition_nho_to_fst_count,
      );
    }

    if (key === "fst") {
      return getNumberValue(
        totals.fstToPstAttritionCount,
        totals.fst_to_pst_attrition_count,
        totals.fstToPstCount,
        totals.fst_to_pst_count,
        totals.attritionFstToPstCount,
        totals.attrition_fst_to_pst_count,
      );
    }

    if (key === "pst") {
      return getNumberValue(
        totals.pstToGoLiveAttritionCount,
        totals.pst_to_go_live_attrition_count,
        totals.pstToGoLiveCount,
        totals.pst_to_go_live_count,
        totals.attritionPstToGoLiveCount,
        totals.attrition_pst_to_go_live_count,
      );
    }

    return 0;
  }

  function getAttritionRateByKey(key) {
    const count = getAttritionCountByKey(key);

    if (key === "accepted") {
      return acceptedJobOffer > 0 ? count / acceptedJobOffer : 0;
    }

    if (key === "nho") {
      return nhoCount > 0 ? count / nhoCount : 0;
    }

    if (key === "fst") {
      return fstCount > 0 ? count / fstCount : 0;
    }

    if (key === "pst") {
      return pstCount > 0 ? count / pstCount : 0;
    }

    return 0;
  }

  return (
    <div className={`${CARD} h-[275px] p-4`}>
      <h3 className="text-[13px] font-extrabold uppercase tracking-wide text-[#101828]">
        Pipeline Flow — Total (6 Weeks)
      </h3>

      <div className="mt-2 overflow-hidden">
        <svg
          viewBox="0 0 344 205"
          className="block h-[225px] w-full"
          role="img"
          aria-label="Pipeline Flow Total 6 Weeks"
        >
          {/* side connector faces */}
          {stages.slice(0, -1).map((stage, index) => {
            const next = stages[index + 1];

            return (
              <g key={`side-${stage.key}`}>
                <polygon
                  points={`
                    ${stage.x + stage.w},${stage.y}
                    ${next.x + 5},${next.y + 5}
                    ${next.x + 5},${next.y + next.h - 1}
                    ${stage.x + stage.w},${stage.y + stage.h}
                  `}
                  fill={stage.sideColor}
                />

                <polygon
                  points={`
                    ${stage.x + stage.w + 1},${stage.y + 4}
                    ${next.x + 3},${next.y + 8}
                    ${next.x + 3},${next.y + next.h - 5}
                    ${stage.x + stage.w + 1},${stage.y + stage.h - 4}
                  `}
                  fill={stage.sideShade}
                  opacity="0.8"
                />
              </g>
            );
          })}

          {/* main blocks */}
          {stages.map((stage) => {
            const cx = stage.x + stage.w / 2;
            const cy = stage.y + stage.h / 2 + 6;

            return (
              <g key={`block-${stage.key}`}>
                <rect
                  x={stage.x}
                  y={stage.y}
                  width={stage.w}
                  height={stage.h}
                  fill={stage.color}
                />

                <text
                  x={cx}
                  y={cy}
                  textAnchor="middle"
                  fill="white"
                  fontSize="14"
                  fontWeight="900"
                >
                  {formatNumber(stage.value)}
                </text>
              </g>
            );
          })}

          {/* labels */}
          {stages.map((stage) => {
            const cx = stage.x + stage.w / 2;
            const labelY = Math.max(13, stage.y - 20);

            return (
              <g key={`label-${stage.key}`}>
                <text
                  x={cx}
                  y={labelY}
                  textAnchor="middle"
                  fill={stage.labelColor}
                  fontSize="7.8"
                  fontWeight="900"
                >
                  {stage.label1}
                </text>

                {stage.label2 && (
                  <text
                    x={cx}
                    y={labelY + 8}
                    textAnchor="middle"
                    fill={stage.labelColor}
                    fontSize="7.8"
                    fontWeight="900"
                  >
                    {stage.label2}
                  </text>
                )}
              </g>
            );
          })}

          {/* bottom drop indicators - Go Live removed */}
          {stages.slice(0, -1).map((stage, index) => {
            const arrowX = stage.x + stage.w / 2;

            const gapCenterX =
              index < stages.length - 1
                ? (stage.x + stage.w + stages[index + 1].x) / 2
                : arrowX;

            const attritionCount = getAttritionCountByKey(stage.key);
            const attritionRate = getAttritionRateByKey(stage.key);

            return (
              <g key={`drop-${stage.key}`}>
                <text
                  x={arrowX}
                  y="150"
                  textAnchor="middle"
                  fill="#A7B4C4"
                  fontSize="10"
                  fontWeight="900"
                >
                  ↑
                </text>

                <text
                  x={gapCenterX}
                  y="166"
                  textAnchor="middle"
                  fill="#DC2626"
                  fontSize="8.5"
                  fontWeight="900"
                >
                  -{formatNumber(attritionCount)}
                </text>

                <text
                  x={gapCenterX}
                  y="179"
                  textAnchor="middle"
                  fill="#DC2626"
                  fontSize="7.2"
                  fontWeight="900"
                >
                  ({formatPercent(attritionRate, 2)})
                </text>
              </g>
            );
          })}

          <text
            x="172"
            y="196"
            textAnchor="middle"
            fontSize="7"
            fontWeight="900"
          >
            <tspan fill="#DC2626">Drop</tspan>
            <tspan fill="#64748B"> = Attrition Count (% Attrition)</tspan>
          </text>
        </svg>
      </div>
    </div>
  );
}

function AttritionByStageCard({ totals }) {
  const stages = [
    {
      label: "Accepted JO → NHO",
      count: Math.max(0, totals.acceptedJobOffer - totals.nhoCount),
      base: totals.acceptedJobOffer,
    },
    {
      label: "NHO → FST",
      count: Math.max(0, totals.nhoCount - totals.fstCount),
      base: totals.nhoCount,
    },
    {
      label: "FST → PST",
      count: Math.max(0, totals.fstCount - totals.pstCount),
      base: totals.fstCount,
    },
    {
      label: "NHO → PST",
      count: Math.max(0, totals.nhoCount - totals.pstCount),
      base: totals.nhoCount,
    },
    {
      label: "PST → Go Live",
      count: Math.max(0, totals.pstCount - totals.goLiveCount),
      base: totals.pstCount,
    },
  ];

  return (
    <div className={`${CARD} h-[260px] p-4`}>
      <h3 className="text-[13px] font-extrabold uppercase tracking-wide text-[#101828]">
        Attrition by Stage — Total (6 Weeks)
      </h3>

      <div className="mt-4">
        <div className="grid grid-cols-[1.4fr_0.8fr_0.8fr_1fr] border-b border-[#E6ECF2] pb-2 text-[9px] font-extrabold text-sibs-primary-1">
          <p>Stage</p>
          <p className="text-center">Attrition Count</p>
          <p className="text-center">Attrition %</p>
          <p />
        </div>

        <div className="space-y-3 pt-3">
          {stages.map((stage) => {
            const rate = stage.base > 0 ? stage.count / stage.base : 0;

            return (
              <div
                key={stage.label}
                className="grid grid-cols-[1.4fr_0.8fr_0.8fr_1fr] items-center gap-2 text-[10px]"
              >
                <p className="font-extrabold text-slate-700">{stage.label}</p>

                <p className="text-center font-extrabold text-red-600">
                  {formatNumber(stage.count)}
                </p>

                <p className="text-center font-extrabold text-slate-700">
                  {formatPercent(rate, 2)}
                </p>

                <div className="h-2 overflow-hidden rounded-full bg-red-50">
                  <div
                    className="h-full rounded-full bg-red-500"
                    style={{ width: `${Math.min(rate * 100, 100)}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function CompactTrendCard({
  title,
  values = [],
  labels = [],
  color = "#155EEF",
  suffix = "",
}) {
  const width = 300;
  const height = 160;
  const paddingLeft = 34;
  const paddingRight = 10;
  const paddingTop = 24;
  const paddingBottom = 28;

  const cleanValues = values.map((value) => Number(value || 0));
  const maxValue = Math.max(...cleanValues, 1);
  const usableWidth = width - paddingLeft - paddingRight;
  const usableHeight = height - paddingTop - paddingBottom;

  const points = cleanValues.map((value, index) => {
    const x =
      paddingLeft +
      (cleanValues.length <= 1
        ? usableWidth / 2
        : (usableWidth / (cleanValues.length - 1)) * index);

    const y = paddingTop + usableHeight - (value / maxValue) * usableHeight;

    return { x, y, value };
  });

  const pathData = points
    .map((point, index) => `${index === 0 ? "M" : "L"} ${point.x} ${point.y}`)
    .join(" ");

  const yAxisLabels = [maxValue, maxValue / 2, 0];

  function displayValue(value) {
    if (suffix === "%") return `${Number(value || 0).toFixed(1)}%`;
    return formatNumber(value);
  }

  return (
    <div className={`${CARD} h-[260px] p-4`}>
      <h3 className="text-[13px] font-extrabold uppercase tracking-wide text-[#101828]">
        {title}
      </h3>

      <div className="mt-4">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="h-[180px] w-full overflow-visible"
          role="img"
        >
          {yAxisLabels.map((label, index) => {
            const y = paddingTop + (usableHeight / 2) * index;

            return (
              <g key={`axis-${index}`}>
                <text
                  x="0"
                  y={y + 4}
                  className="fill-slate-700 text-[9px] font-extrabold"
                >
                  {displayValue(label)}
                </text>

                <line
                  x1={paddingLeft}
                  x2={width - paddingRight}
                  y1={y}
                  y2={y}
                  stroke="#E9EEF5"
                  strokeWidth="1"
                />
              </g>
            );
          })}

          <path
            d={pathData}
            fill="none"
            stroke={color}
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {points.map((point, index) => (
            <g key={`point-${index}`}>
              <circle
                cx={point.x}
                cy={point.y}
                r="3.5"
                fill={color}
                stroke="white"
                strokeWidth="1.5"
              />

              <text
                x={point.x}
                y={point.y - 10}
                textAnchor="middle"
                className="fill-slate-900 text-[9px] font-extrabold"
              >
                {displayValue(point.value)}
              </text>
            </g>
          ))}

          {labels.map((label, index) => {
            const point = points[index];

            return (
              <text
                key={`${label}-${index}`}
                x={point?.x || paddingLeft}
                y={height - 4}
                textAnchor="middle"
                className="fill-slate-700 text-[8.5px] font-extrabold"
              >
                {label}
              </text>
            );
          })}
        </svg>
      </div>
    </div>
  );
}

export default function PercentageRiskGraphTable({
  filteredPlans = [],
  activeWeek,
}) {
  const validPlans = useMemo(
    () => (filteredPlans || []).filter((item) => !item.isAssignedEmptyRow),
    [filteredPlans],
  );

  const totals = useMemo(() => getTotals(validPlans), [validPlans]);
  const planRows = useMemo(
    () => buildPlanRows(totals, activeWeek),
    [totals, activeWeek],
  );

  const trendLabels = planRows.map((row) =>
    row.weekDate.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    }),
  );

  if (!validPlans.length) {
    return (
      <div className="bg-transparent">
        <div
          className={`${EDGE} border border-[#E6ECF2] bg-[#F8FAFC] px-5 py-12 text-center text-sm font-bold text-gray-500`}
        >
          No weekly hiring data available for the selected filter.
        </div>
      </div>
    );
  }

  return (
    <>
      <style>
        {`
          @keyframes whpFadeUp {
            from { opacity: 0; transform: translateY(18px); }
            to { opacity: 1; transform: translateY(0); }
          }

          @keyframes whpLineDraw {
            from { stroke-dashoffset: 1; }
            to { stroke-dashoffset: 0; }
          }

          @keyframes whpPointPop {
            0% { opacity: 0; transform: scale(0.45); }
            70% { opacity: 1; transform: scale(1.14); }
            100% { opacity: 1; transform: scale(1); }
          }

          @keyframes whpBarRise {
            from { transform: scaleY(0); }
            to { transform: scaleY(1); }
          }

          .whp-card-in { animation: whpFadeUp 0.45s ease-out both; }
          .whp-line-draw {
            stroke-dasharray: 1;
            stroke-dashoffset: 1;
            animation: whpLineDraw 1s ease-out forwards;
          }
          .whp-point-pop {
            opacity: 0;
            transform-box: fill-box;
            transform-origin: center;
            animation: whpPointPop 0.35s ease-out both;
          }
          .whp-bar-rise {
            transform-origin: bottom;
            animation: whpBarRise 0.55s ease-out both;
          }
        `}
      </style>

      <div className="space-y-4 bg-transparent">
        <div className="whp-card-in" style={{ animationDelay: "0ms" }}>
          <SummaryTable planRows={planRows} />
        </div>

        <div className="grid grid-cols-1 gap-1.5 md:grid-cols-2 xl:grid-cols-4">
          <div className="whp-card-in" style={{ animationDelay: "90ms" }}>
            <PipelineFlowCard totals={totals} />
          </div>

          <div className="whp-card-in" style={{ animationDelay: "180ms" }}>
            <AttritionByStageCard totals={totals} />
          </div>

          <div className="whp-card-in" style={{ animationDelay: "270ms" }}>
            <CompactTrendCard
              title="Leads to Interview Trend"
              values={planRows.map((row) => row.leadsToGenerate)}
              labels={trendLabels}
              color="#6938EF"
            />
          </div>

          <div className="whp-card-in" style={{ animationDelay: "360ms" }}>
            <CompactTrendCard
              title="Hiring Rate Trend"
              values={planRows.map((row) => row.hiringRate * 100)}
              labels={trendLabels}
              color="#155EEF"
              suffix="%"
            />
          </div>
        </div>
      </div>
    </>
  );
}
