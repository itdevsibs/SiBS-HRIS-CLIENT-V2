import React, { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";

const EDGE = "rounded-[10px]";
const FALLBACK_FALLBACK_WEEK_LABELS = ["W1", "W2", "W3", "W4", "W5", "W6"];

function getWeekNumberFromAny(value) {
  const rawValue = String(value ?? "").trim();

  if (!rawValue) return 0;

  const directNumber = Number(rawValue);

  if (Number.isFinite(directNumber) && directNumber > 0) {
    return directNumber;
  }

  const match = rawValue.match(/week\s*(\d+)/i) || rawValue.match(/w(\d+)/i);

  if (!match) return 0;

  const weekNumber = Number(match[1]);

  return Number.isFinite(weekNumber) && weekNumber > 0 ? weekNumber : 0;
}

function normalizeWeekLabels(labels = []) {
  const cleanLabels = labels
    .map((label) => String(label || "").trim())
    .filter(Boolean);

  if (cleanLabels.length >= 6) {
    return cleanLabels.slice(-6);
  }

  return [];
}

function getWeekLabelsFromRows(rows = []) {
  for (const row of rows) {
    const possibleLabels = [
      row?.weekLabels,
      row?.week_labels,
      row?.pastSixWeekLabels,
      row?.past_six_week_labels,
      row?.trendWeekLabels,
      row?.trend_week_labels,
      row?.weeklyLabels,
      row?.weekly_labels,
    ];

    for (const value of possibleLabels) {
      if (Array.isArray(value)) {
        const labels = normalizeWeekLabels(value);

        if (labels.length === 6) return labels;
      }

      if (typeof value === "string" && value.trim()) {
        try {
          const parsed = JSON.parse(value);
          const labels = Array.isArray(parsed) ? normalizeWeekLabels(parsed) : [];

          if (labels.length === 6) return labels;
        } catch {
          const labels = normalizeWeekLabels(value.split(","));

          if (labels.length === 6) return labels;
        }
      }
    }
  }

  return [];
}

function buildWeekLabels(activeWeek, rows = []) {
  const rowLabels = getWeekLabelsFromRows(rows);

  if (rowLabels.length === 6) return rowLabels;

  const firstRow = rows.find(Boolean) || {};

  const currentWeekNumber = getWeekNumberFromAny(
    activeWeek?.weekNumber ||
      activeWeek?.week_number ||
      activeWeek?.label ||
      activeWeek?.weekLabel ||
      activeWeek?.week_label ||
      firstRow?.weekNumber ||
      firstRow?.week_number ||
      firstRow?.week ||
      firstRow?.weekLabel ||
      firstRow?.week_label ||
      firstRow?.label,
  );

  if (currentWeekNumber > 0) {
    return Array.from({ length: 6 }, (_, index) => {
      const weekNumber = currentWeekNumber - 5 + index;
      return `W${weekNumber > 0 ? weekNumber : index + 1}`;
    });
  }

  return FALLBACK_FALLBACK_WEEK_LABELS;
}

function toNumber(value) {
  const numberValue = Number(value || 0);
  return Number.isFinite(numberValue) ? numberValue : 0;
}

function formatNumber(value, decimals = 0) {
  return toNumber(value).toLocaleString("en-PH", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
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

      if (Number.isFinite(numberValue)) return numberValue;
    }
  }

  return toNumber(fallback);
}

function cleanSeries(values = []) {
  const cleaned = values
    .map((value) => Number(value || 0))
    .filter((value) => Number.isFinite(value));

  if (cleaned.length >= 6) return cleaned.slice(-6);

  if (cleaned.length > 0) {
    return [...Array.from({ length: 6 - cleaned.length }, () => 0), ...cleaned];
  }

  return [];
}

function extractSeries(value, type = "") {
  if (Array.isArray(value)) {
    if (!value.length) return [];

    if (typeof value[0] === "object" && value[0] !== null) {
      return cleanSeries(
        value.map((entry) => {
          if (type === "absenteeism") {
            return (
              entry.absenteeism ??
              entry.absenteeismCount ??
              entry.absenteeism_count ??
              entry.total ??
              entry.count ??
              entry.value ??
              0
            );
          }

          if (type === "attrition") {
            return (
              entry.attrition ??
              entry.attritionCount ??
              entry.attrition_count ??
              entry.total ??
              entry.count ??
              entry.value ??
              0
            );
          }

          return entry.total ?? entry.count ?? entry.value ?? 0;
        }),
      );
    }

    return cleanSeries(value);
  }

  if (value && typeof value === "object") {
    return cleanSeries([
      value.w1 ?? value.W1 ?? value.week1 ?? value.week_1,
      value.w2 ?? value.W2 ?? value.week2 ?? value.week_2,
      value.w3 ?? value.W3 ?? value.week3 ?? value.week_3,
      value.w4 ?? value.W4 ?? value.week4 ?? value.week_4,
      value.w5 ?? value.W5 ?? value.week5 ?? value.week_5,
      value.w6 ?? value.W6 ?? value.week6 ?? value.week_6,
    ]);
  }

  if (typeof value === "string" && value.trim()) {
    try {
      return extractSeries(JSON.parse(value), type);
    } catch {
      return cleanSeries(
        value
          .split(",")
          .map((entry) => Number(String(entry).trim()))
          .filter((entry) => Number.isFinite(entry)),
      );
    }
  }

  return [];
}

function getArrayValue(item, keys = [], type = "") {
  for (const key of keys) {
    const series = extractSeries(item?.[key], type);

    if (series.length > 0) return series;
  }

  return [];
}

function getPerWeekSeries(item, type) {
  if (type === "absenteeism") {
    const directSeries = getArrayValue(
      item,
      [
        "absenteeismTrend",
        "absenteeism_trend",
        "absenteeismWeeklyCounts",
        "absenteeism_weekly_counts",
        "absenteeismPastSixWeeksTrend",
        "absenteeism_past_six_weeks_trend",
        "absenteeismSixWeeksBreakdown",
        "absenteeism_six_weeks_breakdown",
        "weeklyAbsenteeism",
        "weekly_absenteeism",
      ],
      "absenteeism",
    );

    if (directSeries.length > 0) {
      return {
        values: directSeries,
        hasRealWeeklyData: true,
      };
    }

    const keyedSeries = cleanSeries([
      getNumberValue(item, [
        "absenteeismWeek1",
        "absenteeism_week_1",
        "week1Absenteeism",
        "week_1_absenteeism",
        "w1Absenteeism",
        "absenteeismW1",
      ]),
      getNumberValue(item, [
        "absenteeismWeek2",
        "absenteeism_week_2",
        "week2Absenteeism",
        "week_2_absenteeism",
        "w2Absenteeism",
        "absenteeismW2",
      ]),
      getNumberValue(item, [
        "absenteeismWeek3",
        "absenteeism_week_3",
        "week3Absenteeism",
        "week_3_absenteeism",
        "w3Absenteeism",
        "absenteeismW3",
      ]),
      getNumberValue(item, [
        "absenteeismWeek4",
        "absenteeism_week_4",
        "week4Absenteeism",
        "week_4_absenteeism",
        "w4Absenteeism",
        "absenteeismW4",
      ]),
      getNumberValue(item, [
        "absenteeismWeek5",
        "absenteeism_week_5",
        "week5Absenteeism",
        "week_5_absenteeism",
        "w5Absenteeism",
        "absenteeismW5",
      ]),
      getNumberValue(item, [
        "absenteeismWeek6",
        "absenteeism_week_6",
        "week6Absenteeism",
        "week_6_absenteeism",
        "w6Absenteeism",
        "absenteeismW6",
      ]),
    ]);

    const hasKeyedData = keyedSeries.some((value) => value > 0);

    return {
      values: hasKeyedData ? keyedSeries : [0, 0, 0, 0, 0, 0],
      hasRealWeeklyData: hasKeyedData,
    };
  }

  const directSeries = getArrayValue(
    item,
    [
      "attritionTrend",
      "attrition_trend",
      "attritionWeeklyCounts",
      "attrition_weekly_counts",
      "attritionPastSixWeeksTrend",
      "attrition_past_six_weeks_trend",
      "attritionSixWeeksBreakdown",
      "attrition_six_weeks_breakdown",
      "weeklyAttrition",
      "weekly_attrition",
    ],
    "attrition",
  );

  if (directSeries.length > 0) {
    return {
      values: directSeries,
      hasRealWeeklyData: true,
    };
  }

  const keyedSeries = cleanSeries([
    getNumberValue(item, [
      "attritionWeek1",
      "attrition_week_1",
      "week1Attrition",
      "week_1_attrition",
      "w1Attrition",
      "attritionW1",
    ]),
    getNumberValue(item, [
      "attritionWeek2",
      "attrition_week_2",
      "week2Attrition",
      "week_2_attrition",
      "w2Attrition",
      "attritionW2",
    ]),
    getNumberValue(item, [
      "attritionWeek3",
      "attrition_week_3",
      "week3Attrition",
      "week_3_attrition",
      "w3Attrition",
      "attritionW3",
    ]),
    getNumberValue(item, [
      "attritionWeek4",
      "attrition_week_4",
      "week4Attrition",
      "week_4_attrition",
      "w4Attrition",
      "attritionW4",
    ]),
    getNumberValue(item, [
      "attritionWeek5",
      "attrition_week_5",
      "week5Attrition",
      "week_5_attrition",
      "w5Attrition",
      "attritionW5",
    ]),
    getNumberValue(item, [
      "attritionWeek6",
      "attrition_week_6",
      "week6Attrition",
      "week_6_attrition",
      "w6Attrition",
      "attritionW6",
    ]),
  ]);

  const hasKeyedData = keyedSeries.some((value) => value > 0);

  return {
    values: hasKeyedData ? keyedSeries : [0, 0, 0, 0, 0, 0],
    hasRealWeeklyData: hasKeyedData,
  };
}

function getRowTotal(item, type) {
  if (type === "absenteeism") {
    return getNumberValue(item, [
      "absenteeismCount",
      "absenteeism_count",
      "absenteeismPastSixWeeks",
      "absenteeism_past_six_weeks",
      "absenteeismSixWeeks",
      "absenteeism_6_weeks",
    ]);
  }

  return getNumberValue(item, [
    "attritionPastCount",
    "attrition_past_count",
    "attritionCount",
    "attrition_count",
    "attritionPastSixWeeks",
    "attrition_past_six_weeks",
    "attritionSixWeeks",
    "attrition_6_weeks",
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

function getRateStatusClass(rate = 0) {
  return toNumber(rate) <= 25
    ? "text-emerald-600"
    : "text-red-600";
}

function buildAggregateTrend(rows = [], type) {
  let hasRealWeeklyData = false;

  const values = rows.reduce(
    (sum, item) => {
      const series = getPerWeekSeries(item, type);

      if (series.hasRealWeeklyData) {
        hasRealWeeklyData = true;
        return sum.map((value, index) => value + toNumber(series.values[index]));
      }

      return sum;
    },
    [0, 0, 0, 0, 0, 0],
  );

  return {
    values,
    hasRealWeeklyData,
  };
}

function getTrainingMetrics(item = {}) {
  const nhoCount = getNumberValue(item, [
    "nhoCount",
    "nho_count",
    "nhoPopulationCount",
    "nho_population_count",
    "newHireOrientationCount",
    "new_hire_orientation_count",
  ]);

  const fstCount = getNumberValue(item, [
    "fstCount",
    "fst_count",
    "fstPopulationCount",
    "fst_population_count",
  ]);

  const pstCount = getNumberValue(item, [
    "pstCount",
    "pst_count",
    "pstPopulationCount",
    "pst_population_count",
  ]);

  const projectedToBeEndorsed = getNumberValue(
    item,
    [
      "projectedToBeEndorsed",
      "projected_to_be_endorsed",
      "projectedEndorsed",
      "projected_endorsed",
      "pstEndorsedCount",
      "pst_endorsed_count",
    ],
    Math.max(
      0,
      pstCount -
        getNumberValue(item, [
          "attritionFstToPstCount",
          "attrition_fst_to_pst_count",
        ]),
    ),
  );

  return {
    nhoCount,
    fstCount,
    pstCount,
    projectedToBeEndorsed,
  };
}

function getHiringMetrics(item = {}) {
  const hiringNeeded = getNumberValue(item, [
    "actualHeadcountNeeds",
    "actual_headcount_needs",
    "hiringNeeded",
    "hiring_needed",
    "opsPrf",
    "ops_prf",
  ]);

  const leadsToInterview = getNumberValue(item, [
    "leadsToInterview",
    "leads_to_interview",
  ]);

  const interviewCount = getNumberValue(item, [
    "interviewCount",
    "interview_count",
    "interviewPopulationCount",
    "interview_population_count",
    "alreadyInterviewed",
    "already_interviewed",
  ]);

  const fstCount = getNumberValue(item, [
    "fstCount",
    "fst_count",
    "fstPopulationCount",
    "fst_population_count",
  ]);

  const pstCount = getNumberValue(item, [
    "pstCount",
    "pst_count",
    "pstPopulationCount",
    "pst_population_count",
  ]);

  const hiredCount = getNumberValue(
    item,
    ["hiredCount", "hired_count"],
    fstCount + pstCount,
  );

  return {
    hiringNeeded,
    leadsToInterview,
    interviewCount,
    hiredCount,
  };
}

function buildLinePoints(values = [], width = 300, height = 132) {
  const paddingX = 24;
  const paddingTop = 18;
  const paddingBottom = 28;
  const cleanValues = values.map((value) => toNumber(value));
  const maxValue = Math.max(...cleanValues, 1);
  const usableWidth = width - paddingX * 2;
  const usableHeight = height - paddingTop - paddingBottom;

  return cleanValues.map((value, index) => {
    const x =
      paddingX +
      (cleanValues.length <= 1
        ? usableWidth / 2
        : (usableWidth / (cleanValues.length - 1)) * index);

    const y = paddingTop + usableHeight - (value / maxValue) * usableHeight;

    return {
      x,
      y,
      value,
    };
  });
}

function MiniLineChart({
  values = [],
  hasRealWeeklyData = false,
  labels = FALLBACK_FALLBACK_WEEK_LABELS,
  color = "#155EEF",
}) {
  const width = 300;
  const height = 132;
  const points = buildLinePoints(values, width, height);
  const pathData = points
    .map((point, index) => `${index === 0 ? "M" : "L"} ${point.x} ${point.y}`)
    .join(" ");

  const maxValue = Math.max(...values.map((value) => toNumber(value)), 1);
  const yAxisLabels = [maxValue, maxValue / 2, 0];

  return (
    <div className="relative mt-3 w-full">
      <svg
        key={`${color}-${values.join("-")}-${hasRealWeeklyData}`}
        viewBox={`0 0 ${width} ${height}`}
        className="h-[138px] w-full overflow-visible"
        role="img"
      >
        {yAxisLabels.map((label, index) => {
          const y = 18 + ((height - 46) / 2) * index;

          return (
            <g key={index}>
              <text
                x="0"
                y={y + 4}
                className="fill-slate-700 text-[10px] font-bold"
              >
                {formatNumber(label)}
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

        {hasRealWeeklyData && (
          <>
            <path
              d={pathData}
              fill="none"
              stroke={color}
              strokeWidth="3"
              strokeLinecap="round"
              strokeLinejoin="round"
              pathLength="1"
              className="whp-line-draw"
            />

            {points.map((point, index) => (
              <g
                key={index}
                className="whp-point-pop"
                style={{ animationDelay: `${250 + index * 90}ms` }}
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
                  className="fill-slate-900 text-[11px] font-extrabold"
                >
                  {formatNumber(point.value)}
                </text>
              </g>
            ))}
          </>
        )}

        {labels.map((label, index) => {
          const x = points[index]?.x || 24;

          return (
            <text
              key={label}
              x={x}
              y={height - 5}
              textAnchor="middle"
              className="fill-slate-700 text-[10px] font-bold"
            >
              {label}
            </text>
          );
        })}
      </svg>

      {!hasRealWeeklyData && (
        <div className="absolute inset-x-4 top-9 rounded-[10px] border border-amber-200 bg-amber-50 px-3 py-2 text-center text-[11px] font-bold leading-5 text-amber-700">
          Per-week data is not returned yet.
        </div>
      )}
    </div>
  );
}

function AnimatedCard({ children, className = "", delay = 0, onClick }) {
  const Component = onClick ? "button" : "div";

  return (
    <Component
      type={onClick ? "button" : undefined}
      onClick={onClick}
      className={`${EDGE} whp-animate-card whp-hover-lift h-full w-full border border-[#E6ECF2] bg-white p-4 text-left shadow-sm ${onClick ? "cursor-pointer focus:outline-none focus:ring-4 focus:ring-sibs-primary-1/10" : ""} ${className}`}
      style={{ animationDelay: `${delay}ms` }}
    >
      {children}
    </Component>
  );
}

function TrendCard({
  type,
  title,
  subtitle,
  values,
  total,
  average,
  buffer,
  percentageRate = 0,
  color,
  accentClassName,
  hasRealWeeklyData,
  labels = FALLBACK_FALLBACK_WEEK_LABELS,
  onClick,
  delay,
}) {
  return (
    <AnimatedCard delay={delay} onClick={() => onClick?.(type)}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="text-sm font-extrabold uppercase tracking-wide text-[#101828]">
            {title}
          </h3>

          <p className="mt-1 text-xs font-bold text-slate-500">{subtitle}</p>
        </div>

        <span className="rounded-full border border-blue-100 bg-blue-50 px-3 py-1 text-[10px] font-extrabold uppercase tracking-wide text-sibs-primary-1">
          Click
        </span>
      </div>

      <MiniLineChart
        values={values}
        color={color}
        labels={labels}
        hasRealWeeklyData={hasRealWeeklyData}
      />

      <div
        className={`mt-2 grid grid-cols-2 overflow-hidden ${EDGE} border sm:grid-cols-4 ${accentClassName}`}
      >
        <div className="border-b border-r border-inherit bg-white/70 px-2 py-3 text-center sm:border-b-0">
          <p className="text-[9px] font-extrabold text-slate-600">
            Total (6 Weeks)
          </p>

          <p className="mt-1 text-lg font-extrabold text-sibs-primary-1">
            {formatNumber(total)}
          </p>
        </div>

        <div className="border-b border-inherit bg-white/70 px-2 py-3 text-center sm:border-b-0 sm:border-r">
          <p className="text-[9px] font-extrabold text-slate-600">
            Average / Week
          </p>

          <p className="mt-1 text-lg font-extrabold text-sibs-primary-1">
            {formatNumber(average, 2)}
          </p>
        </div>

        <div className="border-r border-inherit bg-white/70 px-2 py-3 text-center">
          <p className="text-[9px] font-extrabold text-sibs-primary-1">
            Buffer HC
          </p>

          <p className="text-[9px] font-extrabold text-sibs-primary-1">
            (Ceiling)
          </p>

          <p className="mt-1 text-lg font-extrabold text-sibs-primary-1">
            {formatNumber(buffer)}
          </p>
        </div>

        <div className="bg-white/70 px-2 py-3 text-center">
          <p className="text-[9px] font-extrabold text-slate-600">
            % vs Actual HC
          </p>

          <p className={`mt-1 text-lg font-extrabold ${getRateStatusClass(percentageRate)}`}>
            {formatPercent(percentageRate, 2)}
          </p>

          <p className="mt-0.5 text-[9px] font-extrabold text-slate-500">
            Max 25%
          </p>
        </div>
      </div>
    </AnimatedCard>
  );
}

function TrainingPipelineCard({
  nho,
  fst,
  pst,
  projectedToBeEndorsed,
  delay,
}) {
  return (
    <AnimatedCard delay={delay}>
      <div>
        <h3 className="text-sm font-extrabold uppercase tracking-wide text-[#101828]">
          Training Pipeline
        </h3>
        <p className="mt-1 text-xs font-bold text-slate-500">
          Not Yet in Actual HC
        </p>
      </div>

      <div className="mt-4 flex items-center justify-center">
        <div className="w-full max-w-[230px]">
          <div className="whp-funnel-segment mx-auto flex h-[46px] w-full items-center justify-between rounded-t-[10px] bg-[#155EEF] px-4 text-white">
            <div>
              <p className="text-sm font-extrabold">NHO</p>
              <p className="text-[9px] font-semibold opacity-90">
                New Hire Orientation
              </p>
            </div>
            <p className="text-lg font-extrabold">{formatNumber(nho)}</p>
          </div>

          <div className="whp-funnel-segment mx-auto mt-[2px] flex h-[46px] w-[86%] items-center justify-between bg-[#16A34A] px-4 text-white">
            <div>
              <p className="text-sm font-extrabold">FST</p>
              <p className="text-[9px] font-semibold opacity-90">Week 1 to 2</p>
            </div>
            <p className="text-lg font-extrabold">{formatNumber(fst)}</p>
          </div>

          <div className="whp-funnel-segment mx-auto mt-[2px] flex h-[46px] w-[74%] items-center justify-between bg-[#F59E0B] px-4 text-white">
            <div>
              <p className="text-sm font-extrabold">PST</p>
              <p className="text-[9px] font-semibold opacity-90">Week 3 to 4</p>
            </div>
            <p className="text-lg font-extrabold">{formatNumber(pst)}</p>
          </div>

          <div className="whp-funnel-segment mx-auto mt-[2px] flex h-[46px] w-[62%] items-center justify-between rounded-b-[10px] bg-[#7C3AED] px-4 text-white">
            <div>
              <p className="text-[11px] font-extrabold">Projected</p>
              <p className="text-[9px] font-semibold opacity-90">
                To be Endorsed
              </p>
            </div>
            <p className="text-lg font-extrabold">
              {formatNumber(projectedToBeEndorsed)}
            </p>
          </div>
        </div>
      </div>

      <div className="mt-4 text-center text-xs font-extrabold text-[#155EEF]">
        View Pipeline Details →
      </div>
    </AnimatedCard>
  );
}

function HiringForecastCard({
  hiringNeeded,
  hiringRate,
  leadsToInterview,
  alreadyInterviewed,
  remainingLeadsToGenerate,
  delay,
}) {
  return (
    <AnimatedCard delay={delay}>
      <div>
        <h3 className="text-sm font-extrabold uppercase tracking-wide text-[#101828]">
          Hiring Forecast
        </h3>
        <p className="mt-1 text-xs font-bold text-slate-500">Current Week</p>
      </div>

      <div className="mt-5 space-y-3">
        <div className="flex items-center justify-between gap-3">
          <p className="text-xs font-bold text-slate-600">Hiring Needed</p>
          <p className="text-base font-extrabold text-red-600">
            {formatNumber(hiringNeeded)}
          </p>
        </div>

        <div className="flex items-center justify-between gap-3">
          <p className="text-xs font-bold text-slate-600">
            Hiring Rate (Conversion)
          </p>
          <p className="text-base font-extrabold text-slate-900">
            {formatPercent(hiringRate, 0)}
          </p>
        </div>

        <div className="flex items-center justify-between gap-3 border-t border-[#E6ECF2] pt-3">
          <p className="text-xs font-bold text-slate-600">
            Leads to Interview Needed
          </p>
          <p className="text-base font-extrabold text-blue-700">
            {formatNumber(leadsToInterview)}
          </p>
        </div>

        <div className="flex items-center justify-between gap-3">
          <p className="text-xs font-bold text-slate-600">
            Already Interviewed
          </p>
          <p className="text-base font-extrabold text-slate-900">
            {formatNumber(alreadyInterviewed)}
          </p>
        </div>

        <div className="flex items-center justify-between gap-3">
          <p className="text-xs font-bold text-slate-600">Remaining Leads</p>
          <p className="text-base font-extrabold text-red-600">
            {formatNumber(remainingLeadsToGenerate)}
          </p>
        </div>
      </div>

      <div className="mt-4 text-center text-xs font-extrabold text-[#155EEF]">
        View Forecast Details →
      </div>
    </AnimatedCard>
  );
}


function TrendDetailsModal({ open, type, rows = [], summary, weekLabels = FALLBACK_FALLBACK_WEEK_LABELS, onClose }) {
  useEffect(() => {
    if (!open) return undefined;

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    function handleKeyDown(e) {
      if (e.key === "Escape") onClose?.();
    }

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = originalOverflow;
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [open, onClose]);

  if (!open || !type || typeof document === "undefined") return null;

  const isAbsenteeism = type === "absenteeism";
  const title = isAbsenteeism ? "Absenteeism Details" : "Attrition Details";
  const totalLabel = isAbsenteeism ? "Total Absences" : "Total Attritions";
  const colorClass = isAbsenteeism ? "text-blue-700" : "text-violet-700";
  const bgClass = isAbsenteeism ? "bg-blue-50" : "bg-violet-50";
  const borderClass = isAbsenteeism ? "border-blue-100" : "border-violet-100";

  const detailRows = rows
    .map((item) => {
      const total = getRowTotal(item, type);
      const average = total / 6;
      const buffer = Math.ceil(average);
      const weekly = getPerWeekSeries(item, type);

      const actualHeadcount = getActualHeadcount(item);
      const detailPercentage =
        actualHeadcount > 0 ? (total / actualHeadcount) * 100 : 0;

      return {
        ...item,
        detailTotal: total,
        detailAverage: average,
        detailBuffer: buffer,
        detailActualHeadcount: actualHeadcount,
        detailPercentage,
        detailSeries: weekly.values,
        hasRealWeeklyData: weekly.hasRealWeeklyData,
      };
    })
    .sort((a, b) => Number(b.detailTotal || 0) - Number(a.detailTotal || 0));

  return createPortal(
    <div className="fixed inset-0 z-[2147483647] isolate flex items-center justify-center bg-slate-950/55 px-3 py-4">
      <div className="whp-modal-in flex max-h-[92vh] w-full max-w-6xl flex-col overflow-hidden rounded-[16px] bg-white shadow-2xl">
        <div className="flex items-start justify-between gap-4 border-b border-[#E6ECF2] px-5 py-4">
          <div className="min-w-0">
            <div className={`inline-flex rounded-full border px-3 py-1 text-xs font-extrabold uppercase tracking-wide ${borderClass} ${bgClass} ${colorClass}`}>
              Past 6 Weeks Actual
            </div>

            <h2 className="mt-3 text-xl font-extrabold text-sibs-primary-1">
              {title}
            </h2>

            <p className="mt-1 text-sm font-semibold text-slate-500">
              Specific account breakdown for the selected report.
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-[#E6ECF2] bg-white text-slate-500 transition hover:bg-slate-50 hover:text-slate-800"
            aria-label="Close details"
          >
            <X size={20} />
          </button>
        </div>

        <div className="grid grid-cols-1 gap-3 border-b border-[#E6ECF2] bg-[#F8FAFC] px-5 py-4 sm:grid-cols-2 xl:grid-cols-4">
          <div className={`${EDGE} border ${borderClass} bg-white px-4 py-3`}>
            <p className="text-xs font-extrabold uppercase text-slate-500">
              {totalLabel}
            </p>
            <p className={`mt-1 text-2xl font-extrabold ${colorClass}`}>
              {formatNumber(summary?.total)}
            </p>
          </div>

          <div className={`${EDGE} border ${borderClass} bg-white px-4 py-3`}>
            <p className="text-xs font-extrabold uppercase text-slate-500">
              Average / Week
            </p>
            <p className={`mt-1 text-2xl font-extrabold ${colorClass}`}>
              {formatNumber(summary?.average, 2)}
            </p>
          </div>

          <div className={`${EDGE} border ${borderClass} bg-white px-4 py-3`}>
            <p className="text-xs font-extrabold uppercase text-slate-500">
              Buffer HC Ceiling
            </p>
            <p className={`mt-1 text-2xl font-extrabold ${colorClass}`}>
              {formatNumber(summary?.buffer)}
            </p>
          </div>

          <div className={`${EDGE} border ${borderClass} bg-white px-4 py-3`}>
            <p className="text-xs font-extrabold uppercase text-slate-500">
              {isAbsenteeism ? "Absenteeism %" : "Attrition %"} vs Actual HC
            </p>

            <p className={`mt-1 text-2xl font-extrabold ${getRateStatusClass(summary?.percentage)}`}>
              {formatPercent(summary?.percentage, 2)}
            </p>

            <p className="mt-1 text-xs font-bold text-slate-500">
              Formula: Total / Actual Headcount. Max allowed: 25%.
            </p>
          </div>
        </div>

        <div className="min-h-0 flex-1 overflow-auto p-5">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[920px] border-separate border-spacing-0 overflow-hidden rounded-[12px] border border-[#E1E7EF] text-left">
              <thead>
                <tr className="bg-[#F5F7FA] text-xs font-extrabold uppercase tracking-wide text-sibs-primary-1">
                  <th className="border-b border-[#E1E7EF] px-4 py-3">Account</th>
                  <th className="border-b border-[#E1E7EF] px-4 py-3">Cluster</th>
                  <th className="border-b border-[#E1E7EF] px-4 py-3 text-center">{totalLabel}</th>
                  <th className="border-b border-[#E1E7EF] px-4 py-3 text-center">Average / Week</th>
                  <th className="border-b border-[#E1E7EF] px-4 py-3 text-center">Buffer HC</th>
                  <th className="border-b border-[#E1E7EF] px-4 py-3 text-center">Actual HC</th>
                  <th className="border-b border-[#E1E7EF] px-4 py-3 text-center">
                    {isAbsenteeism ? "Absenteeism %" : "Attrition %"}
                  </th>
                  {weekLabels.map((label) => (
                    <th key={label} className="border-b border-[#E1E7EF] px-4 py-3 text-center">
                      {label}
                    </th>
                  ))}
                </tr>
              </thead>

              <tbody>
                {detailRows.map((item, index) => (
                  <tr key={`${type}-${item.id || item.account || index}`} className="transition hover:bg-[#FAFBFC]">
                    <td className="border-b border-[#EDF1F5] px-4 py-3">
                      <p className="text-sm font-extrabold text-[#101828]">
                        {item.account || item.accountName || "—"}
                      </p>
                    </td>

                    <td className="border-b border-[#EDF1F5] px-4 py-3">
                      <p className="text-sm font-semibold text-slate-600">
                        {item.cluster || item.clusterName || "—"}
                      </p>
                    </td>

                    <td className={`border-b border-[#EDF1F5] px-4 py-3 text-center text-sm font-extrabold ${colorClass}`}>
                      {formatNumber(item.detailTotal)}
                    </td>

                    <td className="border-b border-[#EDF1F5] px-4 py-3 text-center text-sm font-bold text-slate-700">
                      {formatNumber(item.detailAverage, 2)}
                    </td>

                    <td className="border-b border-[#EDF1F5] px-4 py-3 text-center text-sm font-extrabold text-sibs-primary-1">
                      {formatNumber(item.detailBuffer)}
                    </td>

                    <td className="border-b border-[#EDF1F5] px-4 py-3 text-center text-sm font-bold text-slate-700">
                      {formatNumber(item.detailActualHeadcount)}
                    </td>

                    <td className={`border-b border-[#EDF1F5] px-4 py-3 text-center text-sm font-extrabold ${getRateStatusClass(item.detailPercentage)}`}>
                      {formatPercent(item.detailPercentage, 2)}
                    </td>

                    {weekLabels.map((label, weekIndex) => (
                      <td key={label} className="border-b border-[#EDF1F5] px-4 py-3 text-center text-sm font-bold text-slate-700">
                        {item.hasRealWeeklyData
                          ? formatNumber(item.detailSeries[weekIndex])
                          : "—"}
                      </td>
                    ))}
                  </tr>
                ))}

                {!detailRows.length && (
                  <tr>
                    <td colSpan={13} className="px-4 py-10 text-center text-sm font-bold text-slate-500">
                      No details available.
                    </td>
                  </tr>
                )}
              </tbody>

              {detailRows.length > 0 && (
                <tfoot>
                  <tr className="bg-[#F8FAFC] text-sm font-extrabold text-sibs-primary-1">
                    <td className="px-4 py-3" colSpan={2}>TOTAL</td>
                    <td className="px-4 py-3 text-center">{formatNumber(summary?.total)}</td>
                    <td className="px-4 py-3 text-center">{formatNumber(summary?.average, 2)}</td>
                    <td className="px-4 py-3 text-center">{formatNumber(summary?.buffer)}</td>
                    <td className="px-4 py-3 text-center">{formatNumber(summary?.actualHeadcountTotal)}</td>
                    <td className={`px-4 py-3 text-center ${getRateStatusClass(summary?.percentage)}`}>
                      {formatPercent(summary?.percentage, 2)}
                    </td>
                    {weekLabels.map((label, index) => (
                      <td key={label} className="px-4 py-3 text-center">
                        {summary?.hasRealWeeklyData
                          ? formatNumber(summary?.series?.[index])
                          : "—"}
                      </td>
                    ))}
                  </tr>
                </tfoot>
              )}
            </table>
          </div>
        </div>
      </div>
    </div>,
    document.body,
  );
}


export default function PercentageRiskGraphTable({ filteredPlans = [], activeWeek = null }) {
  const [activeDetailsType, setActiveDetailsType] = useState("");

  const validPlans = useMemo(
    () => filteredPlans.filter((item) => !item.isAssignedEmptyRow),
    [filteredPlans],
  );

  const weekLabels = useMemo(
    () => buildWeekLabels(activeWeek, validPlans),
    [activeWeek, validPlans],
  );

  const data = useMemo(() => {
    const absenteeismTotal = validPlans.reduce(
      (sum, item) => sum + getRowTotal(item, "absenteeism"),
      0,
    );

    const attritionTotal = validPlans.reduce(
      (sum, item) => sum + getRowTotal(item, "attrition"),
      0,
    );

    const actualHeadcountTotal = validPlans.reduce(
      (sum, item) => sum + getActualHeadcount(item),
      0,
    );

    const absenteeismPercentage =
      actualHeadcountTotal > 0
        ? (absenteeismTotal / actualHeadcountTotal) * 100
        : 0;

    const attritionPercentage =
      actualHeadcountTotal > 0
        ? (attritionTotal / actualHeadcountTotal) * 100
        : 0;

    const absenteeismAggregate = buildAggregateTrend(
      validPlans,
      "absenteeism",
    );

    const attritionAggregate = buildAggregateTrend(validPlans, "attrition");

    const training = validPlans.reduce(
      (sum, item) => {
        const metrics = getTrainingMetrics(item);

        sum.nho += metrics.nhoCount;
        sum.fst += metrics.fstCount;
        sum.pst += metrics.pstCount;
        sum.projectedToBeEndorsed += metrics.projectedToBeEndorsed;

        return sum;
      },
      {
        nho: 0,
        fst: 0,
        pst: 0,
        projectedToBeEndorsed: 0,
      },
    );

    const forecastBase = validPlans.reduce(
      (sum, item) => {
        const metrics = getHiringMetrics(item);

        sum.hiringNeeded += metrics.hiringNeeded;
        sum.leadsToInterview += metrics.leadsToInterview;
        sum.alreadyInterviewed += metrics.interviewCount;
        sum.hiredCount += metrics.hiredCount;

        return sum;
      },
      {
        hiringNeeded: 0,
        leadsToInterview: 0,
        alreadyInterviewed: 0,
        hiredCount: 0,
      },
    );

    const hiringRate =
      forecastBase.alreadyInterviewed > 0
        ? (forecastBase.hiredCount / forecastBase.alreadyInterviewed) * 100
        : 0;

    return {
      absenteeism: {
        total: absenteeismTotal,
        average: absenteeismTotal / 6,
        buffer: Math.ceil(absenteeismTotal / 6),
        percentage: absenteeismPercentage,
        actualHeadcountTotal,
        series: absenteeismAggregate.values,
        hasRealWeeklyData: absenteeismAggregate.hasRealWeeklyData,
      },
      attrition: {
        total: attritionTotal,
        average: attritionTotal / 6,
        buffer: Math.ceil(attritionTotal / 6),
        percentage: attritionPercentage,
        actualHeadcountTotal,
        series: attritionAggregate.values,
        hasRealWeeklyData: attritionAggregate.hasRealWeeklyData,
      },
      training,
      forecast: {
        ...forecastBase,
        hiringRate,
        remainingLeadsToGenerate: Math.max(
          0,
          forecastBase.leadsToInterview - forecastBase.alreadyInterviewed,
        ),
      },
    };
  }, [validPlans]);

  if (!validPlans.length) {
    return (
      <div className="bg-white p-4 sm:p-5">
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
            from {
              opacity: 0;
              transform: translateY(18px);
            }
            to {
              opacity: 1;
              transform: translateY(0);
            }
          }

          @keyframes whpModalIn {
            from {
              opacity: 0;
              transform: translateY(14px) scale(0.98);
            }
            to {
              opacity: 1;
              transform: translateY(0) scale(1);
            }
          }

          @keyframes whpLineDraw {
            from {
              stroke-dashoffset: 1;
            }
            to {
              stroke-dashoffset: 0;
            }
          }

          @keyframes whpPointPop {
            0% {
              opacity: 0;
              transform: scale(0.45);
            }
            70% {
              opacity: 1;
              transform: scale(1.14);
            }
            100% {
              opacity: 1;
              transform: scale(1);
            }
          }

          .whp-animate-card {
            animation: whpFadeUp 0.45s ease-out both;
          }

          .whp-hover-lift {
            transition:
              transform 0.2s ease,
              box-shadow 0.2s ease,
              border-color 0.2s ease;
          }

          .whp-hover-lift:hover {
            transform: translateY(-3px);
            box-shadow: 0 14px 32px rgba(15, 23, 42, 0.08);
            border-color: rgba(13, 70, 118, 0.25);
          }

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

          .whp-modal-in {
            animation: whpModalIn 0.22s ease-out both;
          }

          .whp-funnel-segment {
            transition:
              transform 0.18s ease,
              filter 0.18s ease;
          }

          .whp-funnel-segment:hover {
            transform: scale(1.02);
            filter: brightness(1.04);
          }
        `}
      </style>

      <div className="bg-white p-4 sm:p-5">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
          <TrendCard
            type="absenteeism"
            title="Absenteeism Trend"
            subtitle="Past 6 Weeks Actual"
            values={data.absenteeism.series}
            total={data.absenteeism.total}
            average={data.absenteeism.average}
            buffer={data.absenteeism.buffer}
            percentageRate={data.absenteeism.percentage}
            color="#155EEF"
            accentClassName="border-blue-100 bg-blue-50"
            hasRealWeeklyData={data.absenteeism.hasRealWeeklyData}
            labels={weekLabels}
            onClick={setActiveDetailsType}
            delay={0}
          />

          <TrendCard
            type="attrition"
            title="Attrition Trend"
            subtitle="Past 6 Weeks Actual"
            values={data.attrition.series}
            total={data.attrition.total}
            average={data.attrition.average}
            buffer={data.attrition.buffer}
            percentageRate={data.attrition.percentage}
            color="#6938EF"
            accentClassName="border-violet-100 bg-violet-50"
            hasRealWeeklyData={data.attrition.hasRealWeeklyData}
            labels={weekLabels}
            onClick={setActiveDetailsType}
            delay={90}
          />

          <TrainingPipelineCard
            nho={data.training.nho}
            fst={data.training.fst}
            pst={data.training.pst}
            projectedToBeEndorsed={data.training.projectedToBeEndorsed}
            delay={180}
          />

          <HiringForecastCard
            hiringNeeded={data.forecast.hiringNeeded}
            hiringRate={data.forecast.hiringRate}
            leadsToInterview={data.forecast.leadsToInterview}
            alreadyInterviewed={data.forecast.alreadyInterviewed}
            remainingLeadsToGenerate={data.forecast.remainingLeadsToGenerate}
            delay={270}
          />
        </div>
      </div>

      <TrendDetailsModal
        open={!!activeDetailsType}
        type={activeDetailsType}
        rows={validPlans}
        summary={activeDetailsType ? data[activeDetailsType] : null}
        weekLabels={weekLabels}
        onClose={() => setActiveDetailsType("")}
      />
    </>
  );
}
