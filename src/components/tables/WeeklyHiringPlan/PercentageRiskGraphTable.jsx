import React, { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { Info, X } from "lucide-react";

const EDGE = "rounded-[10px]";

const WEEK_LABELS = ["W1", "W2", "W3", "W4", "W5", "W6"];

function formatNumber(value, decimals = 0) {
  const numberValue = Number(value || 0);

  return numberValue.toLocaleString("en-PH", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}

function getNumberValue(item, keys = [], fallback = 0) {
  for (const key of keys) {
    const value = item?.[key];

    if (value !== undefined && value !== null && value !== "") {
      const numberValue = Number(value);

      if (Number.isFinite(numberValue)) return numberValue;
    }
  }

  const fallbackNumber = Number(fallback || 0);

  return Number.isFinite(fallbackNumber) ? fallbackNumber : 0;
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

function extractSeriesFromValue(value) {
  if (Array.isArray(value)) {
    if (!value.length) return [];

    if (typeof value[0] === "object" && value[0] !== null) {
      return cleanSeries(
        value.map(
          (entry) =>
            entry.total ??
            entry.count ??
            entry.value ??
            entry.absenteeism ??
            entry.attrition ??
            0,
        ),
      );
    }

    return cleanSeries(value);
  }

  if (value && typeof value === "object") {
    return cleanSeries([
      value.w1 ?? value.W1 ?? value.week1 ?? value.week_1 ?? value.weekOne,
      value.w2 ?? value.W2 ?? value.week2 ?? value.week_2 ?? value.weekTwo,
      value.w3 ?? value.W3 ?? value.week3 ?? value.week_3 ?? value.weekThree,
      value.w4 ?? value.W4 ?? value.week4 ?? value.week_4 ?? value.weekFour,
      value.w5 ?? value.W5 ?? value.week5 ?? value.week_5 ?? value.weekFive,
      value.w6 ?? value.W6 ?? value.week6 ?? value.week_6 ?? value.weekSix,
    ]);
  }

  if (typeof value === "string" && value.trim()) {
    try {
      return extractSeriesFromValue(JSON.parse(value));
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

function getArrayValue(item, keys = []) {
  for (const key of keys) {
    const value = item?.[key];
    const series = extractSeriesFromValue(value);

    if (series.length > 0) return series;
  }

  return [];
}

function getPerWeekSeries(item, type) {
  if (type === "absenteeism") {
    const directSeries = getArrayValue(item, [
      "absenteeismTrend",
      "absenteeism_trend",
      "absenteeismPastSixWeeksTrend",
      "absenteeism_past_six_weeks_trend",
      "absenteeismWeeklyCounts",
      "absenteeism_weekly_counts",
      "absenteeismSixWeeksBreakdown",
      "absenteeism_six_weeks_breakdown",
      "absenteeismPastSixWeeksBreakdown",
      "absenteeism_past_six_weeks_breakdown",
      "weeklyAbsenteeism",
      "weekly_absenteeism",
    ]);

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

    const hasKeyedData = keyedSeries.some((value) => Number(value || 0) > 0);

    return {
      values: hasKeyedData ? keyedSeries : [0, 0, 0, 0, 0, 0],
      hasRealWeeklyData: hasKeyedData,
    };
  }

  const directSeries = getArrayValue(item, [
    "attritionTrend",
    "attrition_trend",
    "attritionPastSixWeeksTrend",
    "attrition_past_six_weeks_trend",
    "attritionWeeklyCounts",
    "attrition_weekly_counts",
    "attritionSixWeeksBreakdown",
    "attrition_six_weeks_breakdown",
    "attritionPastSixWeeksBreakdown",
    "attrition_past_six_weeks_breakdown",
    "weeklyAttrition",
    "weekly_attrition",
  ]);

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

  const hasKeyedData = keyedSeries.some((value) => Number(value || 0) > 0);

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

function getRowAverage(item, type) {
  if (type === "absenteeism") {
    const directAverage = getNumberValue(
      item,
      [
        "absenteeismPastSixWeeksAverage",
        "absenteeism_past_six_weeks_average",
        "absenteeismOpsCount",
        "absenteeism_ops_count",
      ],
      0,
    );

    if (directAverage > 0) return directAverage;
  }

  if (type === "attrition") {
    const directAverage = getNumberValue(
      item,
      ["attritionPastSixWeeksAverage", "attrition_past_six_weeks_average"],
      0,
    );

    if (directAverage > 0) return directAverage;
  }

  return getRowTotal(item, type) / 6;
}

function buildAggregateSeries(rows = [], type) {
  let hasAnyRealWeeklyData = false;

  const values = rows.reduce(
    (sum, item) => {
      const rowSeries = getPerWeekSeries(item, type);

      if (rowSeries.hasRealWeeklyData) {
        hasAnyRealWeeklyData = true;

        return sum.map(
          (value, index) => value + Number(rowSeries.values[index] || 0),
        );
      }

      return sum;
    },
    [0, 0, 0, 0, 0, 0],
  );

  return {
    values,
    hasRealWeeklyData: hasAnyRealWeeklyData,
  };
}

function buildLinePoints(values = [], width = 300, height = 132) {
  const paddingX = 18;
  const paddingTop = 18;
  const paddingBottom = 24;

  const cleanValues = values.map((value) => Number(value || 0));
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
  labels = WEEK_LABELS,
  color = "#155EEF",
}) {
  const width = 300;
  const height = 132;
  const points = buildLinePoints(values, width, height);
  const pathData = points
    .map((point, index) => `${index === 0 ? "M" : "L"} ${point.x} ${point.y}`)
    .join(" ");

  const maxValue = Math.max(...values.map((value) => Number(value || 0)), 1);
  const yAxisLabels = [maxValue, maxValue / 2, 0];

  return (
    <div className="relative mt-4 w-full">
      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="h-[160px] w-full overflow-visible"
        role="img"
      >
        {yAxisLabels.map((label, index) => {
          const y = 18 + ((height - 42) / 2) * index;

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
                x1="28"
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
            />

            {points.map((point, index) => (
              <g key={index}>
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

                <text
                  x={point.x}
                  y={height - 4}
                  textAnchor="middle"
                  className="fill-slate-700 text-[10px] font-bold"
                >
                  {labels[index] || `W${index + 1}`}
                </text>
              </g>
            ))}
          </>
        )}

        {!hasRealWeeklyData &&
          labels.map((label, index) => {
            const x = 18 + ((width - 36) / (labels.length - 1)) * index;

            return (
              <text
                key={label}
                x={x}
                y={height - 4}
                textAnchor="middle"
                className="fill-slate-700 text-[10px] font-bold"
              >
                {label}
              </text>
            );
          })}
      </svg>

      {!hasRealWeeklyData && (
        <div className="absolute inset-x-6 top-10 rounded-[10px] border border-amber-200 bg-amber-50 px-3 py-2 text-center text-xs font-bold leading-5 text-amber-700">
          Per-week data is not returned by the API yet.
        </div>
      )}
    </div>
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
  color,
  accentClassName,
  hasRealWeeklyData,
  onClick,
}) {
  return (
    <button
      type="button"
      onClick={() => onClick?.(type)}
      className={`${EDGE} w-full border border-[#E6ECF2] bg-white p-4 text-left shadow-sm transition hover:-translate-y-[1px] hover:border-sibs-primary-1/30 hover:shadow-md focus:outline-none focus:ring-4 focus:ring-sibs-primary-1/10`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="text-sm font-extrabold uppercase tracking-wide text-[#101828]">
            {title}
          </h3>

          <p className="mt-1 text-xs font-bold text-slate-500">{subtitle}</p>
        </div>

        <span className="rounded-full border border-blue-100 bg-blue-50 px-3 py-1 text-[10px] font-extrabold uppercase tracking-wide text-sibs-primary-1">
          Click to view
        </span>
      </div>

      <MiniLineChart
        values={values}
        color={color}
        hasRealWeeklyData={hasRealWeeklyData}
      />

      <div
        className={`mt-3 grid grid-cols-3 overflow-hidden ${EDGE} border ${accentClassName}`}
      >
        <div className="border-r border-inherit bg-white/70 px-3 py-3 text-center">
          <p className="text-[10px] font-extrabold text-slate-600">
            Total (6 Weeks)
          </p>

          <p className="mt-1 text-xl font-extrabold text-sibs-primary-1">
            {formatNumber(total)}
          </p>
        </div>

        <div className="border-r border-inherit bg-white/70 px-3 py-3 text-center">
          <p className="text-[10px] font-extrabold text-slate-600">
            Average / Week
          </p>

          <p className="mt-1 text-xl font-extrabold text-sibs-primary-1">
            {formatNumber(average, 2)}
          </p>
        </div>

        <div className="bg-white/70 px-3 py-3 text-center">
          <p className="text-[10px] font-extrabold text-sibs-primary-1">
            Buffer HC
          </p>

          <p className="text-[10px] font-extrabold text-sibs-primary-1">
            (Ceiling)
          </p>

          <p className="mt-1 text-xl font-extrabold text-sibs-primary-1">
            {formatNumber(buffer)}
          </p>
        </div>
      </div>
    </button>
  );
}

function TrendDetailsModal({ open, type, rows = [], summary, onClose }) {
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

  const subtitle = isAbsenteeism
    ? "Specific account details from past 6 weeks actual absenteeism."
    : "Specific account details from past 6 weeks actual attrition.";

  const totalLabel = isAbsenteeism ? "Total Absences" : "Total Attritions";
  const colorClass = isAbsenteeism ? "text-blue-700" : "text-violet-700";
  const bgClass = isAbsenteeism ? "bg-blue-50" : "bg-violet-50";
  const borderClass = isAbsenteeism ? "border-blue-100" : "border-violet-100";

  const sortedRows = rows
    .map((item) => {
      const total = getRowTotal(item, type);
      const average = getRowAverage(item, type);
      const buffer = Math.ceil(average);
      const weekly = getPerWeekSeries(item, type);

      return {
        ...item,
        detailTotal: total,
        detailAverage: average,
        detailBuffer: buffer,
        detailSeries: weekly.values,
        hasRealWeeklyData: weekly.hasRealWeeklyData,
      };
    })
    .sort((a, b) => Number(b.detailTotal || 0) - Number(a.detailTotal || 0));

  return createPortal(
    <div className="fixed inset-0 z-[2147483647] isolate flex items-center justify-center bg-slate-950/55 px-3 py-4">
      <div className="flex max-h-[92vh] w-full max-w-6xl flex-col overflow-hidden rounded-[16px] bg-white shadow-2xl">
        <div className="flex items-start justify-between gap-4 border-b border-[#E6ECF2] px-5 py-4">
          <div className="min-w-0">
            <div
              className={`inline-flex rounded-full border px-3 py-1 text-xs font-extrabold uppercase tracking-wide ${borderClass} ${bgClass} ${colorClass}`}
            >
              Past 6 Weeks Actual
            </div>

            <h2 className="mt-3 text-xl font-extrabold text-sibs-primary-1">
              {title}
            </h2>

            <p className="mt-1 text-sm font-semibold text-slate-500">
              {subtitle}
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

        <div className="grid grid-cols-1 gap-3 border-b border-[#E6ECF2] bg-[#F8FAFC] px-5 py-4 sm:grid-cols-3">
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
        </div>

        {!summary?.hasRealWeeklyData && (
          <div className="border-b border-amber-200 bg-amber-50 px-5 py-3 text-sm font-bold text-amber-700">
            <div className="flex items-start gap-2">
              <Info size={18} className="mt-0.5 shrink-0" />
              <p>
                The API is only returning the 6-week total. To show W1 to W6
                movement, return weekly breakdown fields such as{" "}
                <span className="font-extrabold">
                  absenteeismWeeklyCounts
                </span>{" "}
                or <span className="font-extrabold">attritionWeeklyCounts</span>.
              </p>
            </div>
          </div>
        )}

        <div className="min-h-0 flex-1 overflow-auto p-5">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[920px] border-separate border-spacing-0 overflow-hidden rounded-[12px] border border-[#E1E7EF] text-left">
              <thead>
                <tr className="bg-[#F5F7FA] text-xs font-extrabold uppercase tracking-wide text-sibs-primary-1">
                  <th className="border-b border-[#E1E7EF] px-4 py-3">
                    Account
                  </th>
                  <th className="border-b border-[#E1E7EF] px-4 py-3">
                    Cluster
                  </th>
                  <th className="border-b border-[#E1E7EF] px-4 py-3 text-center">
                    {totalLabel}
                  </th>
                  <th className="border-b border-[#E1E7EF] px-4 py-3 text-center">
                    Average / Week
                  </th>
                  <th className="border-b border-[#E1E7EF] px-4 py-3 text-center">
                    Buffer HC
                  </th>
                  {WEEK_LABELS.map((label) => (
                    <th
                      key={label}
                      className="border-b border-[#E1E7EF] px-4 py-3 text-center"
                    >
                      {label}
                    </th>
                  ))}
                </tr>
              </thead>

              <tbody>
                {sortedRows.map((item, index) => {
                  return (
                    <tr
                      key={`${type}-${item.id || item.account || index}`}
                      className="transition hover:bg-[#FAFBFC]"
                    >
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

                      <td
                        className={`border-b border-[#EDF1F5] px-4 py-3 text-center text-sm font-extrabold ${colorClass}`}
                      >
                        {formatNumber(item.detailTotal)}
                      </td>

                      <td className="border-b border-[#EDF1F5] px-4 py-3 text-center text-sm font-bold text-slate-700">
                        {formatNumber(item.detailAverage, 2)}
                      </td>

                      <td className="border-b border-[#EDF1F5] px-4 py-3 text-center text-sm font-extrabold text-sibs-primary-1">
                        {formatNumber(item.detailBuffer)}
                      </td>

                      {WEEK_LABELS.map((label, weekIndex) => (
                        <td
                          key={label}
                          className="border-b border-[#EDF1F5] px-4 py-3 text-center text-sm font-bold text-slate-700"
                        >
                          {item.hasRealWeeklyData
                            ? formatNumber(item.detailSeries[weekIndex])
                            : "—"}
                        </td>
                      ))}
                    </tr>
                  );
                })}

                {!sortedRows.length && (
                  <tr>
                    <td
                      colSpan={11}
                      className="px-4 py-10 text-center text-sm font-bold text-slate-500"
                    >
                      No details available.
                    </td>
                  </tr>
                )}
              </tbody>

              {sortedRows.length > 0 && (
                <tfoot>
                  <tr className="bg-[#F8FAFC] text-sm font-extrabold text-sibs-primary-1">
                    <td className="px-4 py-3" colSpan={2}>
                      TOTAL
                    </td>
                    <td className="px-4 py-3 text-center">
                      {formatNumber(summary?.total)}
                    </td>
                    <td className="px-4 py-3 text-center">
                      {formatNumber(summary?.average, 2)}
                    </td>
                    <td className="px-4 py-3 text-center">
                      {formatNumber(summary?.buffer)}
                    </td>

                    {WEEK_LABELS.map((label, index) => (
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

export default function PercentageRiskGraphTable({ filteredPlans = [] }) {
  const [activeDetailsType, setActiveDetailsType] = useState("");

  const validPlans = useMemo(
    () => filteredPlans.filter((item) => !item.isAssignedEmptyRow),
    [filteredPlans],
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

    const absenteeismAggregate = buildAggregateSeries(
      validPlans,
      "absenteeism",
    );

    const attritionAggregate = buildAggregateSeries(validPlans, "attrition");

    const absenteeismAverage = absenteeismTotal / 6;
    const attritionAverage = attritionTotal / 6;

    return {
      absenteeism: {
        total: absenteeismTotal,
        average: absenteeismAverage,
        buffer: Math.ceil(absenteeismAverage),
        series: absenteeismAggregate.values,
        hasRealWeeklyData: absenteeismAggregate.hasRealWeeklyData,
      },
      attrition: {
        total: attritionTotal,
        average: attritionAverage,
        buffer: Math.ceil(attritionAverage),
        series: attritionAggregate.values,
        hasRealWeeklyData: attritionAggregate.hasRealWeeklyData,
      },
    };
  }, [validPlans]);

  if (!validPlans.length) {
    return (
      <div className="bg-white p-4 sm:p-5">
        <div
          className={`${EDGE} border border-[#E6ECF2] bg-[#F8FAFC] px-5 py-12 text-center text-sm font-bold text-gray-500`}
        >
          No absenteeism or attrition data available for the selected filter.
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="bg-white p-4 sm:p-5">
        <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
          <TrendCard
            type="absenteeism"
            title="Absenteeism Trend"
            subtitle="Past 6 Weeks Actual"
            values={data.absenteeism.series}
            total={data.absenteeism.total}
            average={data.absenteeism.average}
            buffer={data.absenteeism.buffer}
            color="#155EEF"
            accentClassName="border-blue-100 bg-blue-50"
            hasRealWeeklyData={data.absenteeism.hasRealWeeklyData}
            onClick={setActiveDetailsType}
          />

          <TrendCard
            type="attrition"
            title="Attrition Trend"
            subtitle="Past 6 Weeks Actual"
            values={data.attrition.series}
            total={data.attrition.total}
            average={data.attrition.average}
            buffer={data.attrition.buffer}
            color="#6938EF"
            accentClassName="border-violet-100 bg-violet-50"
            hasRealWeeklyData={data.attrition.hasRealWeeklyData}
            onClick={setActiveDetailsType}
          />
        </div>
      </div>

      <TrendDetailsModal
        open={!!activeDetailsType}
        type={activeDetailsType}
        rows={validPlans}
        summary={activeDetailsType ? data[activeDetailsType] : null}
        onClose={() => setActiveDetailsType("")}
      />
    </>
  );
}