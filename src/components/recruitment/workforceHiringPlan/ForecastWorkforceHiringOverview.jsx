import {
  CalendarX2,
  CheckCircle2,
  Gauge,
  TrendingUp,
  UserPlus,
  UserRoundX,
  Users,
} from "lucide-react";
import { useMemo } from "react";
import { useWorkforceHiring } from "../../../services/context/WorkforceHiringContext";
import KpiCard from "../workforceHiringOverview/shared/KpiCard";

const EMPTY_SUMMARY = {
  requiredHeadcount: 0,
  actualHeadcount: 0,
  bufferPercentage: 0,
  absenteeism: 0,
  absenteeismPercentage: 0,
  attrition: 0,
  attritionPercentage: 0,
  netActualHc: 0,
  hiringNeeded: 0,
  hiringRate: 0,
  hiredCount: 0,
};

function cleanNumber(value) {
  const numberValue = Number(value || 0);
  return Number.isFinite(numberValue) ? numberValue : 0;
}

function getRowNumber(row = {}, keys = [], fallback = 0) {
  for (const key of keys) {
    const value = row?.[key];

    if (value !== null && value !== undefined && value !== "") {
      return cleanNumber(value);
    }
  }

  return cleanNumber(fallback);
}

function getWeekStart(row = {}) {
  return (
    row.weekStart || row.week_start || row.startDate || row.start_date || ""
  );
}

function getForecastWeekId(row = {}, index = 0) {
  const weekStart = getWeekStart(row);
  const weekNumber = row.weekNumber || row.week_number || index + 1;

  return `FORECAST-WEEK-${weekNumber}-${weekStart || index}`;
}

function buildSummaryFromForecastRow(row = {}) {
  const requiredHeadcount = getRowNumber(row, [
    "requiredHeadcount",
    "required_headcount",
  ]);

  const actualHeadcount = getRowNumber(row, [
    "actualHeadcount",
    "actual_headcount",
  ]);

  const absenteeism = getRowNumber(row, [
    "absenteeism",
    "absenteeismCount",
    "absenteeism_count",
    "averageAbsentHeadcount",
    "average_absent_headcount",
  ]);

  const attrition = getRowNumber(row, [
    "attrition",
    "attritionPastCount",
    "attrition_past_count",
    "attritionCount",
    "attrition_count",
  ]);

  const netActualHc = getRowNumber(
    row,
    [
      "netActualHc",
      "net_actual_hc",
      "netActualHeadcount",
      "net_actual_headcount",
    ],
    actualHeadcount - absenteeism - attrition,
  );

  const hiringNeeded = getRowNumber(
    row,
    ["hiringNeeded", "hiring_needed", "actualHeadcountNeeds"],
    Math.max(0, requiredHeadcount - netActualHc),
  );

  return {
    ...EMPTY_SUMMARY,
    requiredHeadcount,
    actualHeadcount,
    bufferPercentage: getRowNumber(row, [
      "bufferPercentage",
      "buffer_percentage",
      "bufferPercent",
      "buffer_percent",
      "actualBufferPercent",
      "actual_buffer_percent",
    ]),
    absenteeism,
    absenteeismPercentage: getRowNumber(row, [
      "absenteeismPercentage",
      "absenteeism_percentage",
      "absenteeismPercent",
      "absenteeism_percent",
      "averageAbsenteeismPercent",
      "average_absenteeism_percent",
    ]),
    attrition,
    attritionPercentage: getRowNumber(row, [
      "attritionPercentage",
      "attrition_percentage",
      "attritionPastPercent",
      "attrition_past_percent",
      "attritionPercent",
      "attrition_percent",
    ]),
    netActualHc,
    hiringNeeded,
    hiringRate: getRowNumber(row, [
      "hiringRate",
      "hiring_rate",
      "hiringPlanPercent",
      "hiring_plan_percent",
    ]),
    hiredCount: getRowNumber(row, ["hiredCount", "hired_count", "hired"]),
  };
}

function getSelectedForecastRow(weeklyVersion = {}, sourceRows = []) {
  const rows = Array.isArray(sourceRows) && sourceRows.length
    ? sourceRows
    : Array.isArray(weeklyVersion.forecastRows)
      ? weeklyVersion.forecastRows
      : [];

  if (!rows.length) return null;

  const selectedForecastWeek = weeklyVersion.selectedForecastWeek || null;
  const selectedWeekStart =
    selectedForecastWeek?.weekStart ||
    selectedForecastWeek?.week_start ||
    selectedForecastWeek?.startDate ||
    "";

  if (selectedWeekStart) {
    const matchedByDate = rows.find(
      (row) =>
        String(row.weekStart || row.week_start || row.startDate || "") ===
        String(selectedWeekStart),
    );

    if (matchedByDate) return matchedByDate;
  }

  const selectedForecastWeekId = weeklyVersion.selectedForecastWeekId || "";

  if (selectedForecastWeekId) {
    const matchedById = rows.find(
      (row, index) => getForecastWeekId(row, index) === selectedForecastWeekId,
    );

    if (matchedById) return matchedById;
  }

  return rows[0] || null;
}

function formatKpiNumber(value, decimals = 0) {
  const numberValue = cleanNumber(value);

  return numberValue.toLocaleString("en-US", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}

function formatKpiPercent(value, decimals = 2) {
  return `${formatKpiNumber(value, decimals)}%`;
}

export default function ForecastWorkforceHiringOverviewSummary({ rows = [] }) {
  const { weeklyVersion } = useWorkforceHiring();

  const selectedForecastRow = useMemo(
    () => getSelectedForecastRow(weeklyVersion, rows),
    [rows, weeklyVersion],
  );

  const summary = useMemo(
    () =>
      selectedForecastRow
        ? buildSummaryFromForecastRow(selectedForecastRow)
        : EMPTY_SUMMARY,
    [selectedForecastRow],
  );

  const metrics = [
    {
      title: "Required HC",
      value: formatKpiNumber(summary.requiredHeadcount),
      subtitle: "Approved baseline",
      icon: Users,
      tone: "navy",
    },
    {
      title: "Actual HC",
      value: formatKpiNumber(summary.actualHeadcount),
      subtitle: "Roster count",
      icon: Users,
      tone: "navy",
    },
    {
      title: "Buffer %",
      value: formatKpiPercent(summary.bufferPercentage, 2),
      subtitle: "VS required HC",
      icon: Gauge,
      tone: summary.bufferPercentage < 0 ? "red" : "green",
    },
    {
      title: "Absenteeism",
      value: formatKpiPercent(summary.absenteeismPercentage, 2),
      subtitle: "Absenteeism%",
      icon: CalendarX2,
      tone: "amber",
    },
    {
      title: "Attrition",
      value: formatKpiPercent(summary.attritionPercentage, 2),
      subtitle: "Attrition%",
      icon: UserRoundX,
      tone: "red",
    },
    {
      title: "Net Actual HC",
      value: formatKpiNumber(Math.round(summary.netActualHc)),
      subtitle: "Floor Availability",
      icon: Users,
      tone: "navy",
    },
    {
      title: "Hiring Needed",
      value: formatKpiNumber(Math.round(summary.hiringNeeded)),
      subtitle: "Total Coverage Gap",
      icon: UserPlus,
      tone: "indigo",
    },
    {
      title: "Hiring Rate",
      value: formatKpiPercent(summary.hiringRate, 1),
      subtitle: "Leads yield",
      icon: TrendingUp,
      tone: "teal",
    },
    {
      title: "Hired Count",
      value: formatKpiNumber(summary.hiredCount),
      subtitle: "Deployed Hires",
      icon: CheckCircle2,
      tone: "green",
    },
  ];

  return (
    <section className="space-y-3">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5 xl:grid-cols-5 2xl:grid-cols-9 xl:gap-3 2xl:gap-4">
        {metrics.map((metric, index) => (
          <KpiCard key={metric.title} {...metric} delay={60 + index * 45} />
        ))}
      </div>
    </section>
  );
}