import {
  Fragment,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { CalendarDays, ChevronDown, ChevronRight, ChevronUp, GripHorizontal } from "lucide-react";
import { useWorkforceHiringView } from "../../../services/context/WorkforceHiringContextAdapter";
import { usePagination } from "../../../services/context/PaginationContext";
import PaginationTable from "../../../services/pagination/PaginationTable";
import { DataCard, ResponsiveTableShell } from "@/components/ui";
import {
  formatOverviewNumber,
  formatOverviewPercent,
} from "../../../lib/utils/workforceHiringOverview/workforceHiringOverviewHelpers";

const DETAILS_ENTITY = "workforce-hiring-overview-details";
const TABLE_COLUMN_COUNT = 24;

const HISTORY_FACTORS = [0.88, 0.9, 0.93, 0.95, 0.98, 1];
const ABSENTEEISM_OFFSETS = [-0.8, -0.6, 0.2, -0.3, 0.1, 0];
const ATTRITION_OFFSETS = [-0.6, -0.5, -0.2, 0.1, 0.2, 0];


const WORKFORCE_RISK_OPTIONS = [
  "All Risks",
  "Healthy",
  "Watch",
  "At Risk",
  "Critical",
];

function toSafeFilterNumber(value) {
  const numberValue = Number(value || 0);
  return Number.isFinite(numberValue) ? numberValue : 0;
}

function normalizeRiskLabel(value) {
  const cleanValue = String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ");

  if (!cleanValue) return "";

  if (["healthy", "low", "low risk", "good"].includes(cleanValue)) {
    return "Healthy";
  }

  if (["watch", "monitor", "medium", "medium risk"].includes(cleanValue)) {
    return "Watch";
  }

  if (["at risk", "atrisk", "high", "high risk"].includes(cleanValue)) {
    return "At Risk";
  }

  if (["critical", "severe", "urgent"].includes(cleanValue)) {
    return "Critical";
  }

  return "";
}

function getWorkforceRiskLevel(row = {}) {
  const explicitRisk = normalizeRiskLabel(
    row.riskLevel ??
      row.risk_level ??
      row.risk ??
      row.hiringRisk ??
      row.hiring_risk ??
      row.riskStatus ??
      row.risk_status,
  );

  if (explicitRisk) return explicitRisk;

  const bufferPercentage = toSafeFilterNumber(row.bufferPercentage);
  const hiringNeeded = toSafeFilterNumber(row.hiringNeeded);
  const absenteeismPercentage = toSafeFilterNumber(
    row.absenteeismPercentage,
  );
  const attritionPercentage = toSafeFilterNumber(row.attritionPercentage);

  if (
    bufferPercentage <= -20 ||
    hiringNeeded >= 20 ||
    absenteeismPercentage >= 15 ||
    attritionPercentage >= 10
  ) {
    return "Critical";
  }

  if (
    bufferPercentage <= -10 ||
    hiringNeeded >= 10 ||
    absenteeismPercentage >= 10 ||
    attritionPercentage >= 7
  ) {
    return "At Risk";
  }

  if (
    bufferPercentage < 0 ||
    hiringNeeded > 0 ||
    absenteeismPercentage >= 5 ||
    attritionPercentage >= 5
  ) {
    return "Watch";
  }

  return "Healthy";
}

function getWorkforceClusterOptions(rows = []) {
  const uniqueClusters = Array.from(
    new Set(
      (Array.isArray(rows) ? rows : [])
        .map((row) => String(row?.cluster || "").trim())
        .filter(Boolean),
    ),
  ).sort((first, second) =>
    first.localeCompare(second, undefined, {
      numeric: true,
      sensitivity: "base",
    }),
  );

  return ["All Clusters", ...uniqueClusters];
}

function filterWorkforceRows(
  rows = [],
  {
    search = "",
    cluster = "All Clusters",
    risk = "All Risks",
  } = {},
) {
  const keyword = String(search || "").trim().toLowerCase();
  const selectedCluster = String(cluster || "All Clusters");
  const selectedRisk = String(risk || "All Risks");

  return (Array.isArray(rows) ? rows : []).filter((row) => {
    const matchesSearch =
      !keyword ||
      [row?.cluster, row?.account].some((value) =>
        String(value || "").toLowerCase().includes(keyword),
      );

    const matchesCluster =
      selectedCluster === "All Clusters" || row?.cluster === selectedCluster;

    const matchesRisk =
      selectedRisk === "All Risks" ||
      getWorkforceRiskLevel(row) === selectedRisk;

    return matchesSearch && matchesCluster && matchesRisk;
  });
}

function HeaderTh({
  children,
  rowSpan,
  colSpan,
  className = "",
  group = false,
}) {
  return (
    <th
      rowSpan={rowSpan}
      colSpan={colSpan}
      className={`sibs-data-table-th border border-slate-200 !px-2.5 2xl:!px-3 text-center align-middle font-jakarta uppercase tracking-wider ${
        group
          ? "!bg-[#EBF3FA] !py-1.5 2xl:!py-2 sibs-text-micro !font-black !text-sibs-primary-1"
          : "!bg-[#F8FAFC] !py-1.5 2xl:!py-2.5 sibs-text-micro !font-extrabold !text-slate-500"
      } ${className}`}
    >
      {children}
    </th>
  );
}

function BodyTd({
  children,
  className = "",
  align = "right",
  numeric = true,
  ...props
}) {
  const alignmentClass =
    align === "left"
      ? "text-left"
      : align === "center"
        ? "text-center"
        : "text-right";

  return (
    <td
      {...props}
      className={`whitespace-nowrap border-b border-[#E6ECF2] px-2.5 py-1.5 2xl:px-3 2xl:py-2.5 align-middle sibs-text-xs leading-tight font-jakarta tabular-nums ${alignmentClass} ${className}`}
    >
      {children}
    </td>
  );
}

function HistoryTh({ children, className = "" }) {
  return (
    <th
      className={`border-r border-[#174B78] bg-[#063C69] px-3 py-2.5 text-center text-[9px] font-black uppercase tracking-wide text-white last:border-r-0 ${className}`}
    >
      {children}
    </th>
  );
}

function HistoryTd({ children, className = "" }) {
  return (
    <td
      className={`border-r border-[#E6ECF2] px-3 py-2.5 text-center text-[10px] font-semibold text-[#344054] last:border-r-0 ${className}`}
    >
      {children}
    </td>
  );
}

function SortHeaderButton({
  label,
  active,
  direction,
  onClick,
  align = "left",
  className = "",
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      onMouseDown={(event) => event.stopPropagation()}
      className={`inline-flex w-full min-w-0 items-center gap-1 whitespace-nowrap rounded-none bg-transparent p-0 font-jakarta text-[10px] font-extrabold uppercase tracking-wider transition-colors focus:outline-none focus-visible:text-sibs-primary-1 active:bg-transparent ${
        align === "right"
          ? "justify-end"
          : align === "center"
            ? "justify-center"
            : "justify-start"
      } ${
        active
          ? "text-sibs-primary-1"
          : "text-slate-500 hover:text-sibs-primary-2"
      } ${className}`}
    >
      <span>{label}</span>

      {active ? (
        <span
          aria-hidden="true"
          className={`h-0 w-0 border-x-[3px] border-x-transparent ${
            direction === "asc"
              ? "border-b-[5px] border-b-sibs-primary-1"
              : "border-t-[5px] border-t-sibs-primary-1"
          }`}
        />
      ) : null}
    </button>
  );
}

function getSortableText(row = {}, key = "") {
  return String(row?.[key] || "").trim();
}

function toNumber(value) {
  const numberValue = Number(value || 0);
  return Number.isFinite(numberValue) ? numberValue : 0;
}

function getPercent(numerator, denominator) {
  return denominator ? (numerator / denominator) * 100 : 0;
}

function firstDefined(source = {}, keys = [], fallback = 0) {
  for (const key of keys) {
    if (source?.[key] !== undefined && source?.[key] !== null) {
      return source[key];
    }
  }

  return fallback;
}

function buildFilteredTotals(rows = [], fallbackTotals = {}) {
  if (!Array.isArray(rows) || rows.length === 0) {
    return {
      ...(fallbackTotals || {}),
      cluster: "TOTAL / AVERAGE",
      account: "",
    };
  }

  const sum = rows.reduce(
    (total, row) => {
      total.requiredHeadcount += toNumber(row.requiredHeadcount);
      total.actualHeadcount += toNumber(row.actualHeadcount);
      total.absenteeism += toNumber(row.absenteeism);
      total.attrition += toNumber(row.attrition);
      total.acceptedJo += toNumber(row.acceptedJo);
      total.nho += toNumber(row.nho);
      total.fst += toNumber(row.fst);
      total.pst += toNumber(row.pst);
      total.goLive += toNumber(row.goLive);
      total.joNhoCount += toNumber(row.joNhoCount);
      total.nhoFstCount += toNumber(row.nhoFstCount);
      total.fstPstCount += toNumber(row.fstPstCount);
      total.nhoPstCount += toNumber(row.nhoPstCount);
      total.pstGoLiveCount += toNumber(row.pstGoLiveCount);
      total.hiredCount += toNumber(row.hiredCount);
      return total;
    },
    {
      requiredHeadcount: 0,
      actualHeadcount: 0,
      absenteeism: 0,
      attrition: 0,
      acceptedJo: 0,
      nho: 0,
      fst: 0,
      pst: 0,
      goLive: 0,
      joNhoCount: 0,
      nhoFstCount: 0,
      fstPstCount: 0,
      nhoPstCount: 0,
      pstGoLiveCount: 0,
      hiredCount: 0,
    },
  );

  const netActualHc = sum.actualHeadcount - sum.absenteeism - sum.attrition;

  return {
    ...(fallbackTotals || {}),
    ...sum,
    cluster: "TOTAL / AVERAGE",
    account: "",
    bufferPercentage: getPercent(
      netActualHc - sum.requiredHeadcount,
      sum.requiredHeadcount,
    ),
    absenteeismPercentage: getPercent(sum.absenteeism, sum.actualHeadcount),
    attritionPercentage: getPercent(sum.attrition, sum.actualHeadcount),
    netActualHc,
    hiringNeeded: Math.max(0, sum.requiredHeadcount - netActualHc),
    joNhoPercentage: getPercent(sum.joNhoCount, sum.acceptedJo),
    nhoFstPercentage: getPercent(sum.nhoFstCount, sum.nho),
    fstPstPercentage: getPercent(sum.fstPstCount, sum.fst),
    nhoPstPercentage: getPercent(sum.nhoPstCount, sum.nho),
    pstGoLivePercentage: getPercent(sum.pstGoLiveCount, sum.pst),
    hiringRate: getPercent(sum.hiredCount, sum.acceptedJo),
  };
}

function getBufferColor(value) {
  const numberValue = Number(value || 0);
  if (numberValue < 0) return "text-[#E74C3C]";
  if (numberValue > 0) return "text-emerald-600";
  return "text-[#042C51]";
}

function getHiringNeededColor(value) {
  return Number(value || 0) > 0 ? "text-rose-600" : "text-emerald-600";
}

function getRowKey(row = {}, index = 0) {
  return String(
    row.id ||
      row.accountId ||
      row.account_id ||
      `${row.cluster || "cluster"}::${row.account || "account"}::${index}`,
  );
}

function getSelectedWeekNumber(filters = {}) {
  const selectedWeek = filters?.selectedWeek;
  const directWeekNumber = Number(
    selectedWeek?.weekNumber ||
      selectedWeek?.week_number ||
      selectedWeek?.week ||
      0,
  );

  if (Number.isFinite(directWeekNumber) && directWeekNumber > 0) {
    return directWeekNumber;
  }

  const rawValue = String(
    selectedWeek?.label ||
      selectedWeek?.weeklyVersion ||
      filters?.weeklyVersion ||
      "",
  );
  const matchedWeek = rawValue.match(/(?:week|wk)\s*-?\s*(\d+)/i);

  return matchedWeek?.[1] ? Number(matchedWeek[1]) : 28;
}

function getHistorySource(row = {}) {
  const candidates = [
    row.history,
    row.sixWeekHistory,
    row.six_week_history,
    row.weeklyHistory,
    row.weekly_history,
    row.historicalRows,
    row.historical_rows,
  ];

  return candidates.find((candidate) => Array.isArray(candidate)) || [];
}

function normalizeHistoryRow(historyRow = {}, fallbackRow = {}, period = "") {
  const requiredHeadcount = toNumber(
    firstDefined(historyRow, [
      "requiredHeadcount",
      "requiredHC",
      "required_hc",
      "reqHc",
    ], fallbackRow.requiredHeadcount),
  );
  const actualHeadcount = toNumber(
    firstDefined(historyRow, [
      "actualHeadcount",
      "actualHC",
      "actual_hc",
      "actHc",
    ], fallbackRow.actualHeadcount),
  );
  const absenteeism = toNumber(
    firstDefined(historyRow, [
      "absenteeism",
      "absenteeismCount",
      "absenteeism_count",
      "absCount",
    ], fallbackRow.absenteeism),
  );
  const attrition = toNumber(
    firstDefined(historyRow, [
      "attrition",
      "attritionCount",
      "attrition_count",
      "attCount",
    ], fallbackRow.attrition),
  );
  const netActualHc = toNumber(
    firstDefined(historyRow, [
      "netActualHc",
      "netActualHC",
      "net_actual_hc",
      "netActual",
    ], actualHeadcount - absenteeism - attrition),
  );
  const acceptedJo = toNumber(
    firstDefined(historyRow, [
      "acceptedJo",
      "acceptedJO",
      "accepted_jo",
    ], fallbackRow.acceptedJo),
  );
  const hiredCount = toNumber(
    firstDefined(historyRow, ["hiredCount", "hired_count"], fallbackRow.hiredCount),
  );

  return {
    period:
      String(
        firstDefined(historyRow, [
          "period",
          "weekPeriod",
          "week_period",
          "weekLabel",
          "week_label",
        ], period),
      ).trim() || period,
    requiredHeadcount,
    actualHeadcount,
    bufferPercentage: toNumber(
      firstDefined(
        historyRow,
        ["bufferPercentage", "buffer_percentage", "bufferPercent"],
        getPercent(netActualHc - requiredHeadcount, requiredHeadcount),
      ),
    ),
    absenteeism,
    absenteeismPercentage: toNumber(
      firstDefined(
        historyRow,
        [
          "absenteeismPercentage",
          "absenteeism_percentage",
          "absPercentage",
        ],
        getPercent(absenteeism, actualHeadcount),
      ),
    ),
    attrition,
    attritionPercentage: toNumber(
      firstDefined(
        historyRow,
        ["attritionPercentage", "attrition_percentage", "attPercentage"],
        getPercent(attrition, actualHeadcount),
      ),
    ),
    netActualHc,
    hiringNeeded: toNumber(
      firstDefined(
        historyRow,
        ["hiringNeeded", "hiring_needed"],
        Math.max(0, requiredHeadcount - netActualHc),
      ),
    ),
    acceptedJo,
    nho: toNumber(firstDefined(historyRow, ["nho", "nhoCount"], fallbackRow.nho)),
    fst: toNumber(firstDefined(historyRow, ["fst", "fstCount"], fallbackRow.fst)),
    pst: toNumber(firstDefined(historyRow, ["pst", "pstCount"], fallbackRow.pst)),
    goLive: toNumber(
      firstDefined(historyRow, ["goLive", "go_live", "goLiveCount"], fallbackRow.goLive),
    ),
    hiredCount,
    hiringRate: toNumber(
      firstDefined(
        historyRow,
        ["hiringRate", "hiring_rate", "yieldRate"],
        getPercent(hiredCount, acceptedJo),
      ),
    ),
    riskLevel: normalizeRiskLabel(
      firstDefined(
        historyRow,
        [
          "riskLevel",
          "risk_level",
          "risk",
          "hiringRisk",
          "hiring_risk",
          "riskStatus",
          "risk_status",
        ],
        "",
      ),
    ),
  };
}

function buildFallbackHistory(row = {}, selectedWeekNumber = 28) {
  const endWeek = Math.max(6, Number(selectedWeekNumber) || 28);
  const startWeek = endWeek - 5;
  const currentRequired = toNumber(row.requiredHeadcount);
  const currentActual = toNumber(row.actualHeadcount);
  const currentAbsPercentage = toNumber(row.absenteeismPercentage);
  const currentAttPercentage = toNumber(row.attritionPercentage);

  return HISTORY_FACTORS.map((factor, index) => {
    const period = `Week ${startWeek + index}`;

    if (index === HISTORY_FACTORS.length - 1) {
      return normalizeHistoryRow({ ...row, period }, row, period);
    }

    const requiredHeadcount = Math.round(
      currentRequired * (0.95 + (factor - 0.88) * 0.4),
    );
    const actualHeadcount = Math.round(currentActual * factor);
    const absenteeismPercentage = Math.max(
      0,
      Number(
        (currentAbsPercentage + ABSENTEEISM_OFFSETS[index]).toFixed(2),
      ),
    );
    const attritionPercentage = Math.max(
      0,
      Number((currentAttPercentage + ATTRITION_OFFSETS[index]).toFixed(2)),
    );
    const absenteeism = Math.round(
      (actualHeadcount * absenteeismPercentage) / 100,
    );
    const attrition = Math.round(
      (actualHeadcount * attritionPercentage) / 100,
    );
    const netActualHc = Math.max(
      0,
      actualHeadcount - absenteeism - attrition,
    );
    const acceptedJo = Math.round(toNumber(row.acceptedJo) * factor);
    const hiredCount = Math.round(toNumber(row.hiredCount) * factor);

    return {
      period,
      requiredHeadcount,
      actualHeadcount,
      bufferPercentage: getPercent(
        netActualHc - requiredHeadcount,
        requiredHeadcount,
      ),
      absenteeism,
      absenteeismPercentage,
      attrition,
      attritionPercentage,
      netActualHc,
      hiringNeeded: Math.max(0, requiredHeadcount - netActualHc),
      acceptedJo,
      nho: Math.round(toNumber(row.nho) * factor),
      fst: Math.round(toNumber(row.fst) * factor),
      pst: Math.round(toNumber(row.pst) * factor),
      goLive: Math.round(toNumber(row.goLive) * factor),
      hiredCount,
      hiringRate: getPercent(hiredCount, acceptedJo),
    };
  });
}

function getSixWeekHistory(row = {}, selectedWeekNumber = 28) {
  const endWeek = Math.max(6, Number(selectedWeekNumber) || 28);
  const startWeek = endWeek - 5;
  const suppliedHistory = getHistorySource(row);

  if (suppliedHistory.length > 0) {
    return suppliedHistory
      .slice(-6)
      .map((historyRow, index) =>
        normalizeHistoryRow(
          historyRow,
          row,
          `Week ${startWeek + index}`,
        ),
      );
  }

  return buildFallbackHistory(row, selectedWeekNumber);
}


export const ALL_SIX_WEEKS = "All 6 Weeks";

function getPeriodWeekNumber(value) {
  const match = String(value || "").match(/(?:week|wk)\s*-?\s*(\d+)/i);
  return match?.[1] ? Number(match[1]) : 0;
}

export function buildPeriodOptions(selectedWeekNumber = 28) {
  const currentWeek = Math.max(6, Number(selectedWeekNumber) || 28);
  const startWeek = currentWeek - 5;

  return [
    ...Array.from({ length: 6 }, (_, index) => {
      const weekNumber = startWeek + index;
      const value = `Week ${weekNumber}`;
      const isCurrent = weekNumber === currentWeek;

      return {
        value,
        weekNumber,
        isCurrent,
        label: isCurrent ? `${value} (Current)` : value,
      };
    }),
    {
      value: ALL_SIX_WEEKS,
      label: ALL_SIX_WEEKS,
      weekNumber: null,
      isCurrent: false,
    },
  ];
}

function buildStageLossMetrics({
  acceptedJo = 0,
  nho = 0,
  fst = 0,
  pst = 0,
  goLive = 0,
} = {}) {
  const cleanAcceptedJo = toNumber(acceptedJo);
  const cleanNho = toNumber(nho);
  const cleanFst = toNumber(fst);
  const cleanPst = toNumber(pst);
  const cleanGoLive = toNumber(goLive);

  const joNhoCount = Math.max(0, cleanAcceptedJo - cleanNho);
  const nhoFstCount = Math.max(0, cleanNho - cleanFst);
  const fstPstCount = Math.max(0, cleanFst - cleanPst);
  const nhoPstCount = Math.max(0, cleanNho - cleanPst);
  const pstGoLiveCount = Math.max(0, cleanPst - cleanGoLive);

  return {
    joNhoCount,
    joNhoPercentage: getPercent(joNhoCount, cleanAcceptedJo),
    nhoFstCount,
    nhoFstPercentage: getPercent(nhoFstCount, cleanNho),
    fstPstCount,
    fstPstPercentage: getPercent(fstPstCount, cleanFst),
    nhoPstCount,
    nhoPstPercentage: getPercent(nhoPstCount, cleanNho),
    pstGoLiveCount,
    pstGoLivePercentage: getPercent(pstGoLiveCount, cleanPst),
  };
}

function clearPeriodRiskAliases(explicitRisk = "") {
  return {
    riskLevel: normalizeRiskLabel(explicitRisk),
    risk_level: undefined,
    risk: undefined,
    hiringRisk: undefined,
    hiring_risk: undefined,
    riskStatus: undefined,
    risk_status: undefined,
  };
}

function buildSingleWeekDisplayRow(row = {}, historyRow = {}, history = []) {
  const acceptedJo = toNumber(historyRow.acceptedJo);
  const nho = toNumber(historyRow.nho);
  const fst = toNumber(historyRow.fst);
  const pst = toNumber(historyRow.pst);
  const goLive = toNumber(historyRow.goLive);

  return {
    ...row,
    period: historyRow.period,
    requiredHeadcount: toNumber(historyRow.requiredHeadcount),
    actualHeadcount: toNumber(historyRow.actualHeadcount),
    bufferPercentage: toNumber(historyRow.bufferPercentage),
    absenteeism: toNumber(historyRow.absenteeism),
    absenteeismPercentage: toNumber(historyRow.absenteeismPercentage),
    attrition: toNumber(historyRow.attrition),
    attritionPercentage: toNumber(historyRow.attritionPercentage),
    netActualHc: toNumber(historyRow.netActualHc),
    hiringNeeded: toNumber(historyRow.hiringNeeded),
    acceptedJo,
    nho,
    fst,
    pst,
    goLive,
    hiredCount: toNumber(historyRow.hiredCount),
    hiringRate: toNumber(historyRow.hiringRate),
    ...buildStageLossMetrics({ acceptedJo, nho, fst, pst, goLive }),
    ...clearPeriodRiskAliases(historyRow.riskLevel),
    history,
  };
}

function buildAllWeeksDisplayRow(row = {}, history = []) {
  const safeHistory = Array.isArray(history) ? history : [];
  const weekCount = safeHistory.length || 1;

  const totals = safeHistory.reduce(
    (result, week) => {
      result.requiredHeadcount += toNumber(week.requiredHeadcount);
      result.actualHeadcount += toNumber(week.actualHeadcount);
      result.absenteeism += toNumber(week.absenteeism);
      result.attrition += toNumber(week.attrition);
      result.netActualHc += toNumber(week.netActualHc);
      result.hiringNeeded += toNumber(week.hiringNeeded);
      result.acceptedJo += toNumber(week.acceptedJo);
      result.nho += toNumber(week.nho);
      result.fst += toNumber(week.fst);
      result.pst += toNumber(week.pst);
      result.goLive += toNumber(week.goLive);
      result.hiredCount += toNumber(week.hiredCount);
      return result;
    },
    {
      requiredHeadcount: 0,
      actualHeadcount: 0,
      absenteeism: 0,
      attrition: 0,
      netActualHc: 0,
      hiringNeeded: 0,
      acceptedJo: 0,
      nho: 0,
      fst: 0,
      pst: 0,
      goLive: 0,
      hiredCount: 0,
    },
  );

  const requiredHeadcount = totals.requiredHeadcount / weekCount;
  const actualHeadcount = totals.actualHeadcount / weekCount;
  const netActualHc = totals.netActualHc / weekCount;
  const hiringNeeded = totals.hiringNeeded / weekCount;

  return {
    ...row,
    period: ALL_SIX_WEEKS,
    requiredHeadcount,
    actualHeadcount,
    bufferPercentage: getPercent(
      totals.netActualHc - totals.requiredHeadcount,
      totals.requiredHeadcount,
    ),
    absenteeism: totals.absenteeism,
    absenteeismPercentage: getPercent(
      totals.absenteeism,
      totals.actualHeadcount,
    ),
    attrition: totals.attrition,
    attritionPercentage: getPercent(
      totals.attrition,
      totals.actualHeadcount,
    ),
    netActualHc,
    hiringNeeded,
    acceptedJo: totals.acceptedJo,
    nho: totals.nho,
    fst: totals.fst,
    pst: totals.pst,
    goLive: totals.goLive,
    hiredCount: totals.hiredCount,
    hiringRate: getPercent(totals.hiredCount, totals.acceptedJo),
    ...buildStageLossMetrics(totals),
    ...clearPeriodRiskAliases(),
    history: safeHistory,
  };
}

export function buildPeriodDisplayRow(
  row = {},
  selectedPeriod = "",
  selectedWeekNumber = 28,
) {
  const history = getSixWeekHistory(row, selectedWeekNumber);

  if (selectedPeriod === ALL_SIX_WEEKS) {
    return buildAllWeeksDisplayRow(row, history);
  }

  const selectedWeek = getPeriodWeekNumber(selectedPeriod);
  const matchedHistoryRow =
    history.find(
      (week) => getPeriodWeekNumber(week?.period) === selectedWeek,
    ) || history[history.length - 1];

  if (!matchedHistoryRow) {
    return {
      ...row,
      history,
    };
  }

  return buildSingleWeekDisplayRow(row, matchedHistoryRow, history);
}

function PeriodSelector({ options = [], value = "", onChange }) {
  return (
    <div className="inline-flex min-w-0 items-center overflow-hidden rounded-xl border border-[#DDE5EE] bg-[#F3F6FA] p-1.5 font-jakarta">
      <div className="flex h-8 shrink-0 items-center gap-1.5 px-2.5 text-[10px] font-extrabold uppercase tracking-normal text-[#042C51]">
        <CalendarDays className="h-3.5 w-3.5 text-[#FF5C28]" />
        <span>Period:</span>
      </div>

      <div className="no-scrollbar min-w-0 flex-1 overflow-x-auto sm:flex-initial">
        <div className="flex min-w-max items-center justify-end gap-1.5">
          {options.map((option) => {
            const isActive = option.value === value;

            return (
              <button
                key={option.value}
                type="button"
                onClick={() => onChange?.(option.value)}
                aria-pressed={isActive}
                className={`inline-flex h-8 items-center justify-center whitespace-nowrap rounded-lg px-3 text-[10px] font-extrabold leading-tight transition focus:outline-none focus:ring-2 focus:ring-[#FF5C28]/20 ${
                  isActive
                    ? "bg-[#042C51] text-white shadow-sm"
                    : "text-[#52637A] hover:bg-white hover:text-[#FF5C28]"
                }`}
              >
                {option.label}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function getStageRetentionPercentage(startValue, endValue) {
  const start = toNumber(startValue);
  const end = toNumber(endValue);

  return start > 0 ? (end / start) * 100 : 0;
}

function formatRetentionPercentage(value, summary = false) {
  const cleanValue = toNumber(value);

  if (summary) {
    return cleanValue
      .toFixed(1)
      .replace(/\.0$/, "");
  }

  return String(Math.round(cleanValue));
}

function getRiskBadgeClasses(riskLabel = "") {
  if (riskLabel === "Watch") {
    return "border-blue-100 bg-blue-50 text-blue-700";
  }

  if (riskLabel === "At Risk") {
    return "border-amber-100 bg-amber-50 text-amber-700";
  }

  if (riskLabel === "Critical") {
    return "border-rose-100 bg-rose-50 text-rose-700";
  }

  if (riskLabel === "Summary") {
    return "border-[#042C51] bg-[#042C51] text-white";
  }

  return "border-emerald-100 bg-emerald-50 text-emerald-700";
}

function StageConversionCell({
  dropCount = 0,
  startCount = 0,
  endCount = 0,
  summary = false,
}) {
  const retentionPercentage = getStageRetentionPercentage(
    startCount,
    endCount,
  );

  return (
    <BodyTd align="center">
      <span className="font-bold text-[#E74C3C]">
        -{formatOverviewNumber(dropCount)}
      </span>

      <span
        className={`ml-1 ${
          summary
            ? "font-bold text-[#E74C3C]"
            : "text-[10px] font-medium text-slate-400"
        }`}
      >
        ({formatRetentionPercentage(retentionPercentage, summary)}%)
      </span>
    </BodyTd>
  );
}

const BOLD_NUMBER_CLASS = "!font-jakarta !text-xs !font-black !text-[#042C51]";

function PerformanceCells({ row, summary = false }) {
  const hiringNeeded = toNumber(row.hiringNeeded);
  const riskLabel = summary ? "Summary" : getWorkforceRiskLevel(row);

  return (
    <>
      {/* Required HC (BOLD) */}
      <BodyTd className={BOLD_NUMBER_CLASS}>
        {formatOverviewNumber(row.requiredHeadcount)}
      </BodyTd>

      {/* Actual HC (NOT BOLD) */}
      <BodyTd className={summary ? BOLD_NUMBER_CLASS : "font-normal text-slate-600"}>
        {formatOverviewNumber(row.actualHeadcount)}
      </BodyTd>

      {/* Buffer % (BOLD RED / GREEN) */}
      <BodyTd
        className={`!font-black ${getBufferColor(
          row.bufferPercentage,
        )}`}
      >
        {formatOverviewPercent(row.bufferPercentage)}
      </BodyTd>

      {/* Net Actual (BOLD) */}
      <BodyTd className={BOLD_NUMBER_CLASS}>
        {formatOverviewNumber(row.netActualHc)}
      </BodyTd>

      {/* Hiring Needed (BOLD RED BADGE) */}
      <BodyTd>
        {summary ? (
          <span
            className={
              hiringNeeded > 0
                ? "!font-black !text-rose-600"
                : "!font-black !text-emerald-600"
            }
          >
            {formatOverviewNumber(row.hiringNeeded)}
          </span>
        ) : (
          <span
            className={
              hiringNeeded > 0
                ? "inline-block rounded border border-rose-100 bg-rose-50 px-1.5 py-0.5 !font-black !text-rose-600"
                : "font-normal text-slate-400"
            }
          >
            {formatOverviewNumber(row.hiringNeeded)}
          </span>
        )}
      </BodyTd>

      {/* Absenteeism (NOT BOLD) */}
      <BodyTd className={summary ? BOLD_NUMBER_CLASS : "font-normal text-slate-600"}>
        {formatOverviewNumber(row.absenteeism)}
      </BodyTd>

      {/* ABS % (BOLD) */}
      <BodyTd className={BOLD_NUMBER_CLASS}>
        {formatOverviewPercent(row.absenteeismPercentage)}
      </BodyTd>

      {/* Attrition (NOT BOLD) */}
      <BodyTd className={summary ? BOLD_NUMBER_CLASS : "font-normal text-slate-600"}>
        {formatOverviewNumber(row.attrition)}
      </BodyTd>

      {/* ATT % (BOLD) */}
      <BodyTd className={BOLD_NUMBER_CLASS}>
        {formatOverviewPercent(row.attritionPercentage)}
      </BodyTd>

      {/* Accepted JO (BOLD) */}
      <BodyTd className={BOLD_NUMBER_CLASS}>
        {formatOverviewNumber(row.acceptedJo)}
      </BodyTd>

      {/* NHO Count (NOT BOLD) */}
      <BodyTd className={summary ? BOLD_NUMBER_CLASS : "font-normal text-slate-600"}>
        {formatOverviewNumber(row.nho)}
      </BodyTd>

      {/* FST Count (NOT BOLD) */}
      <BodyTd className={summary ? BOLD_NUMBER_CLASS : "font-normal text-slate-600"}>
        {formatOverviewNumber(row.fst)}
      </BodyTd>

      {/* PST Count (NOT BOLD) */}
      <BodyTd className={summary ? BOLD_NUMBER_CLASS : "font-normal text-slate-600"}>
        {formatOverviewNumber(row.pst)}
      </BodyTd>

      {/* Go Live (BOLD GREEN) */}
      <BodyTd className="!font-black !text-emerald-600">
        {formatOverviewNumber(row.goLive)}
      </BodyTd>

      <StageConversionCell
        dropCount={row.joNhoCount}
        startCount={row.acceptedJo}
        endCount={row.nho}
        summary={summary}
      />

      <StageConversionCell
        dropCount={row.nhoFstCount}
        startCount={row.nho}
        endCount={row.fst}
        summary={summary}
      />

      <StageConversionCell
        dropCount={row.fstPstCount}
        startCount={row.fst}
        endCount={row.pst}
        summary={summary}
      />

      <StageConversionCell
        dropCount={row.pstGoLiveCount}
        startCount={row.pst}
        endCount={row.goLive}
        summary={summary}
      />

      {/* Hired Count (BOLD) */}
      <BodyTd className={BOLD_NUMBER_CLASS}>
        {formatOverviewNumber(row.hiredCount)}
      </BodyTd>

      {/* Hiring Rate % (BOLD ORANGE) */}
      <BodyTd className="!font-black !text-[#FF5C28]">
        {formatOverviewPercent(row.hiringRate)}
      </BodyTd>

      <BodyTd align="center" numeric={false}>
        <span
          className={`inline-flex items-center justify-center rounded-full border px-2.5 py-1 text-[10px] !font-extrabold ${
            summary ? "rounded uppercase !font-black" : ""
          } ${getRiskBadgeClasses(riskLabel)}`}
        >
          {riskLabel}
        </span>
      </BodyTd>
    </>
  );
}

function HistoryWeekMobileCard({
  week,
  isCurrentWeek,
  isActiveWeek,
  selectedPeriod,
}) {
  const hiringNeeded = toNumber(week.hiringNeeded);

  return (
    <div
      className={`rounded-xl border p-3 transition-colors ${
        isActiveWeek
          ? "border-sibs-orange/50 bg-sibs-orange/[0.04] shadow-xs"
          : "border-sibs-border bg-white"
      }`}
    >
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="font-heading text-xs font-black text-sibs-navy">
            {week.period}
          </span>
          {isActiveWeek && (
            <span className="rounded bg-sibs-navy px-1.5 py-0.5 text-[8.5px] font-black uppercase tracking-wide text-white">
              {selectedPeriod === ALL_SIX_WEEKS && isCurrentWeek
                ? "Current"
                : "Selected"}
            </span>
          )}
        </div>

        <span
          className={`inline-flex items-center justify-center rounded-full border px-2 py-0.5 text-[9.5px] font-extrabold tabular-nums ${
            hiringNeeded > 0
              ? "border-rose-200 bg-rose-50 text-rose-700"
              : "border-emerald-200 bg-emerald-50 text-emerald-700"
          }`}
        >
          Need: {formatOverviewNumber(hiringNeeded)}
        </span>
      </div>

      <div className="mt-2 grid grid-cols-4 gap-1 rounded-lg bg-sibs-canvas px-2.5 py-2 text-center">
        <div>
          <span className="block text-[9px] font-bold uppercase tracking-wider text-sibs-muted">
            Req
          </span>
          <strong className="text-[11.5px] font-black tabular-nums text-sibs-navy">
            {formatOverviewNumber(week.requiredHeadcount)}
          </strong>
        </div>
        <div>
          <span className="block text-[9px] font-bold uppercase tracking-wider text-sibs-muted">
            Act
          </span>
          <strong className="text-[11.5px] font-black tabular-nums text-sibs-navy">
            {formatOverviewNumber(week.actualHeadcount)}
          </strong>
        </div>
        <div>
          <span className="block text-[9px] font-bold uppercase tracking-wider text-sibs-muted">
            Net
          </span>
          <strong className="text-[11.5px] font-black tabular-nums text-sibs-navy">
            {formatOverviewNumber(week.netActualHc)}
          </strong>
        </div>
        <div>
          <span className="block text-[9px] font-bold uppercase tracking-wider text-sibs-muted">
            Buffer
          </span>
          <strong
            className={`text-[11.5px] font-black tabular-nums ${getBufferColor(
              week.bufferPercentage,
            )}`}
          >
            {formatOverviewPercent(week.bufferPercentage)}
          </strong>
        </div>
      </div>

      <div className="mt-2 flex flex-wrap items-center justify-between gap-x-3 gap-y-1 text-[10.5px] font-semibold text-sibs-muted">
        <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
          <span>
            Abs:{" "}
            <strong className="text-sibs-navy tabular-nums">
              {formatOverviewNumber(week.absenteeism)}
            </strong>
          </span>
          <span>
            Attr:{" "}
            <strong className="text-sibs-navy tabular-nums">
              {formatOverviewNumber(week.attrition)}
            </strong>
          </span>
          <span>
            JO:{" "}
            <strong className="text-sibs-navy tabular-nums">
              {formatOverviewNumber(week.acceptedJo)}
            </strong>
          </span>
          <span>
            Live:{" "}
            <strong className="text-emerald-700 tabular-nums">
              {formatOverviewNumber(week.goLive)}
            </strong>
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <span>
            Hired:{" "}
            <strong className="font-black text-sibs-navy tabular-nums">
              {formatOverviewNumber(week.hiredCount)}
            </strong>
          </span>
          <span className="font-extrabold text-sibs-orange tabular-nums">
            ({formatOverviewPercent(week.hiringRate)})
          </span>
        </div>
      </div>
    </div>
  );
}

function ExpandedHistory({ row, selectedWeekNumber, selectedPeriod }) {
  const history = useMemo(
    () => getSixWeekHistory(row, selectedWeekNumber),
    [row, selectedWeekNumber],
  );
  const firstWeek = history[0] || {};
  const currentWeek = history[history.length - 1] || {};
  const activeHistoryPeriod =
    selectedPeriod === ALL_SIX_WEEKS
      ? currentWeek.period
      : selectedPeriod || currentWeek.period;
  const cumulativeHires = history.reduce(
    (total, week) => total + toNumber(week.hiredCount),
    0,
  );
  const cumulativeGoLive = history.reduce(
    (total, week) => total + toNumber(week.goLive),
    0,
  );
  const headcountRamp =
    toNumber(currentWeek.actualHeadcount) - toNumber(firstWeek.actualHeadcount);
  const bufferShift =
    toNumber(currentWeek.bufferPercentage) -
    toNumber(firstWeek.bufferPercentage);

  return (
    <div className="space-y-4 whitespace-normal">
      <div className="flex flex-col gap-2 border-b border-sibs-border pb-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex min-w-0 items-center gap-2">
          <CalendarDays className="h-4 w-4 shrink-0 text-sibs-orange" />
          <h4 className="truncate text-[11px] font-black uppercase tracking-wide text-sibs-navy">
            6-Week Historical Performance Breakdown — {row.account} ({row.cluster})
          </h4>
        </div>

        <span className="w-fit rounded-full bg-sibs-navy px-3 py-1 text-[9px] font-extrabold uppercase tracking-wide text-white">
          {firstWeek.period} – {currentWeek.period}
        </span>
      </div>

      <ResponsiveTableShell
        mobileContent={
          <div className="space-y-2.5">
            {history.map((week, index) => {
              const isCurrentWeek = index === history.length - 1;
              const isActiveWeek =
                getPeriodWeekNumber(week.period) ===
                getPeriodWeekNumber(activeHistoryPeriod);

              return (
                <HistoryWeekMobileCard
                  key={`${row.account}-${week.period}-${index}`}
                  week={week}
                  isCurrentWeek={isCurrentWeek}
                  isActiveWeek={isActiveWeek}
                  selectedPeriod={selectedPeriod}
                />
              );
            })}
          </div>
        }
        desktopContent={
          <div className="overflow-x-auto rounded-xl border border-sibs-border bg-white shadow-sm">
            <table className="w-full min-w-[1580px] border-collapse font-jakarta">
              <thead>
                <tr>
                  <HistoryTh className="text-left">Week Period</HistoryTh>
                  <HistoryTh>Req HC</HistoryTh>
                  <HistoryTh>Act HC</HistoryTh>
                  <HistoryTh>Buffer %</HistoryTh>
                  <HistoryTh>Abs Count (%)</HistoryTh>
                  <HistoryTh>Att Count (%)</HistoryTh>
                  <HistoryTh>Net Actual</HistoryTh>
                  <HistoryTh>Hiring Needed</HistoryTh>
                  <HistoryTh>Accepted JO</HistoryTh>
                  <HistoryTh>NHO</HistoryTh>
                  <HistoryTh>FST</HistoryTh>
                  <HistoryTh>PST</HistoryTh>
                  <HistoryTh>Go Live</HistoryTh>
                  <HistoryTh>Hired Count</HistoryTh>
                  <HistoryTh>Yield Rate %</HistoryTh>
                </tr>
              </thead>

              <tbody className="divide-y divide-sibs-border">
                {history.map((week, index) => {
                  const isCurrentWeek = index === history.length - 1;
                  const isActiveWeek =
                    getPeriodWeekNumber(week.period) ===
                    getPeriodWeekNumber(activeHistoryPeriod);

                  return (
                    <tr
                      key={`${row.account}-${week.period}-${index}`}
                      className={
                        isActiveWeek
                          ? "bg-sibs-surface font-extrabold"
                          : "bg-white hover:bg-sibs-canvas"
                      }
                    >
                      <HistoryTd className="text-left font-extrabold text-sibs-navy">
                        <div className="flex items-center justify-between gap-3">
                          <span>{week.period}</span>
                          {isActiveWeek ? (
                            <span className="rounded bg-sibs-navy px-1.5 py-0.5 text-[8px] font-black uppercase text-white">
                              {selectedPeriod === ALL_SIX_WEEKS && isCurrentWeek
                                ? "Current"
                                : "Selected"}
                            </span>
                          ) : null}
                        </div>
                      </HistoryTd>
                      <HistoryTd>{formatOverviewNumber(week.requiredHeadcount)}</HistoryTd>
                      <HistoryTd>{formatOverviewNumber(week.actualHeadcount)}</HistoryTd>
                      <HistoryTd className={`font-extrabold ${getBufferColor(week.bufferPercentage)}`}>
                        {formatOverviewPercent(week.bufferPercentage)}
                      </HistoryTd>
                      <HistoryTd>
                        {formatOverviewNumber(week.absenteeism)} ({formatOverviewPercent(week.absenteeismPercentage)})
                      </HistoryTd>
                      <HistoryTd>
                        {formatOverviewNumber(week.attrition)} ({formatOverviewPercent(week.attritionPercentage)})
                      </HistoryTd>
                      <HistoryTd className="font-extrabold text-sibs-navy">
                        {formatOverviewNumber(week.netActualHc)}
                      </HistoryTd>
                      <HistoryTd className={`font-extrabold ${getHiringNeededColor(week.hiringNeeded)}`}>
                        {formatOverviewNumber(week.hiringNeeded)}
                      </HistoryTd>
                      <HistoryTd>{formatOverviewNumber(week.acceptedJo)}</HistoryTd>
                      <HistoryTd>{formatOverviewNumber(week.nho)}</HistoryTd>
                      <HistoryTd>{formatOverviewNumber(week.fst)}</HistoryTd>
                      <HistoryTd>{formatOverviewNumber(week.pst)}</HistoryTd>
                      <HistoryTd className="font-extrabold text-emerald-700">
                        {formatOverviewNumber(week.goLive)}
                      </HistoryTd>
                      <HistoryTd className="font-extrabold text-sibs-navy">
                        {formatOverviewNumber(week.hiredCount)}
                      </HistoryTd>
                      <HistoryTd className="font-extrabold text-sibs-orange">
                        {formatOverviewPercent(week.hiringRate)}
                      </HistoryTd>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        }
      />

      <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
        <article className="rounded-xl border border-sibs-border bg-white px-3 py-3 shadow-sm">
          <p className="text-[9px] font-black uppercase tracking-wide text-sibs-muted">
            6-Week Headcount Ramp
          </p>
          <div className="mt-1.5 flex items-end justify-between gap-3">
            <strong className="text-sm font-black tabular-nums text-sibs-navy">
              {formatOverviewNumber(firstWeek.actualHeadcount)} → {formatOverviewNumber(currentWeek.actualHeadcount)}
            </strong>
            <span className={`text-[10px] font-extrabold tabular-nums ${headcountRamp >= 0 ? "text-emerald-600" : "text-rose-600"}`}>
              {headcountRamp >= 0 ? "+" : ""}{formatOverviewNumber(headcountRamp)} agents
            </span>
          </div>
        </article>

        <article className="rounded-xl border border-sibs-border bg-white px-3 py-3 shadow-sm">
          <p className="text-[9px] font-black uppercase tracking-wide text-sibs-muted">
            6-Week Cumulative Hires
          </p>
          <div className="mt-1.5 flex items-end justify-between gap-3">
            <strong className="text-sm font-black tabular-nums text-sibs-orange">
              {formatOverviewNumber(cumulativeHires)} hired
            </strong>
            <span className="text-[10px] font-extrabold tabular-nums text-sibs-muted">
              {formatOverviewNumber(cumulativeGoLive)} deployed
            </span>
          </div>
        </article>

        <article className="rounded-xl border border-sibs-border bg-white px-3 py-3 shadow-sm">
          <p className="text-[9px] font-black uppercase tracking-wide text-sibs-muted">
            6-Week Buffer Trajectory
          </p>
          <div className="mt-1.5 flex items-end justify-between gap-3">
            <strong className={`text-sm font-black tabular-nums ${getBufferColor(currentWeek.bufferPercentage)}`}>
              {formatOverviewPercent(firstWeek.bufferPercentage)} → {formatOverviewPercent(currentWeek.bufferPercentage)}
            </strong>
            <span className={`text-[10px] font-extrabold tabular-nums ${bufferShift >= 0 ? "text-emerald-600" : "text-rose-600"}`}>
              {bufferShift >= 0 ? "+" : ""}{bufferShift.toFixed(2)}% shift
            </span>
          </div>
        </article>
      </div>
    </div>
  );
}

function WorkforceAccountMobileCard({
  row,
  isExpanded,
  onToggleExpand,
  activePeriod,
  normalizedSelectedWeekNumber,
}) {
  const riskLabel = getWorkforceRiskLevel(row) || "Healthy";
  const hiringNeeded = Number(row.hiringNeeded || 0);

  return (
    <DataCard interactive onClick={onToggleExpand}>
      <DataCard.Header
        title={row.account}
        subtitle={
          <span className="inline-flex items-center gap-1.5 text-xs text-sibs-muted">
            <span className="font-extrabold text-sibs-navy">{row.cluster}</span>
          </span>
        }
        badge={
          <span
            className={`inline-flex items-center justify-center rounded-full border px-2.5 py-0.5 text-[10px] font-extrabold ${getRiskBadgeClasses(
              riskLabel,
            )}`}
          >
            {riskLabel}
          </span>
        }
      />

      <DataCard.ContextRow>
        <span className="text-[11px] font-bold text-sibs-navy">
          Planned: <span className="tabular-nums font-black">{formatOverviewNumber(row.requiredHeadcount ?? row.plannedHeadcount)}</span>
        </span>
        <span className="text-[11px] font-bold text-sibs-navy">
          Actual: <span className="tabular-nums font-black">{formatOverviewNumber(row.actualHeadcount)}</span>
        </span>
        <span className="text-[11px] font-bold text-sibs-navy">
          Net Actual: <span className="tabular-nums font-black">{formatOverviewNumber(row.netActualHc ?? row.netActual)}</span>
        </span>
        <span
          className={`text-[11px] font-bold tabular-nums ${
            hiringNeeded > 0 ? "font-black text-rose-600" : "text-emerald-700"
          }`}
        >
          Need: {formatOverviewNumber(hiringNeeded)}
        </span>
      </DataCard.ContextRow>

      <DataCard.Metrics cols={4}>
        <DataCard.MetricItem
          label="Buffer"
          value={formatOverviewPercent(row.bufferPercentage)}
        />
        <DataCard.MetricItem
          label="ABS %"
          value={formatOverviewPercent(row.absenteeismPercentage ?? row.absenteeismRate)}
        />
        <DataCard.MetricItem
          label="ATT %"
          value={formatOverviewPercent(row.attritionPercentage ?? row.attritionRate)}
        />
        <DataCard.MetricItem
          label="Hiring Rate"
          value={formatOverviewPercent(row.hiringRate)}
          tone="primary"
        />
      </DataCard.Metrics>

      <div className="mt-2.5 flex flex-wrap items-center justify-between gap-2 border-t border-sibs-border pt-2">
        <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1 text-[10.5px] font-semibold text-sibs-muted">
          <span>JO: <strong className="text-sibs-navy">{formatOverviewNumber(row.acceptedJo)}</strong></span>
          <span>NHO: <strong className="text-sibs-navy">{formatOverviewNumber(row.nho)}</strong></span>
          <span>FST: <strong className="text-sibs-navy">{formatOverviewNumber(row.fst)}</strong></span>
          <span>PST: <strong className="text-sibs-navy">{formatOverviewNumber(row.pst)}</strong></span>
          <span>Go Live: <strong className="text-emerald-700">{formatOverviewNumber(row.goLive)}</strong></span>
          <span>Hired: <strong className="font-black text-sibs-navy">{formatOverviewNumber(row.hiredCount)}</strong></span>
        </div>

        <button
          type="button"
          onClick={(event) => {
            event.stopPropagation();
            onToggleExpand();
          }}
          className="inline-flex shrink-0 items-center gap-1 rounded-md px-2 py-1 text-[10px] font-extrabold uppercase text-sibs-orange transition hover:bg-orange-50"
        >
          <span>{isExpanded ? "Hide History" : "6-Wk Trend"}</span>
          {isExpanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
        </button>
      </div>

      {isExpanded && (
        <div className="mt-3 border-t border-sibs-border pt-3">
          <ExpandedHistory
            row={row}
            selectedWeekNumber={normalizedSelectedWeekNumber}
            selectedPeriod={activePeriod}
          />
        </div>
      )}
    </DataCard>
  );
}

export default function WorkforceHiringOverviewDetailsTable() {
  const workforceView = useWorkforceHiringView();
  const {
    detailTable: { detailRows, totals },
    filters,
  } = workforceView;

  const {
    search,
    setSearch,
    searchInput,
    setSearchInput,
    handleSearchKeyDown,
    resetPagination,
  } = usePagination(DETAILS_ENTITY);

  const sourceRows = Array.isArray(detailRows) ? detailRows : [];
  const selectedWeekNumber = getSelectedWeekNumber(filters);
  const normalizedSelectedWeekNumber = Math.max(
    6,
    Number(selectedWeekNumber) || 28,
  );
  const currentPeriodValue = `Week ${normalizedSelectedWeekNumber}`;
  const periodOptions = useMemo(
    () => buildPeriodOptions(normalizedSelectedWeekNumber),
    [normalizedSelectedWeekNumber],
  );

  const dragScrollRef = useRef(null);
  const isDraggingRef = useRef(false);
  const startXRef = useRef(0);
  const scrollLeftRef = useRef(0);
  const [isDragging, setIsDragging] = useState(false);
  const [expandedRows, setExpandedRows] = useState({});
  const [selectedCluster, setSelectedCluster] = useState("All Clusters");
  const [selectedRisk, setSelectedRisk] = useState("All Risks");
  const [selectedPeriod, setSelectedPeriod] = useState(currentPeriodValue);
  const [sortConfig, setSortConfig] = useState({
    key: "cluster",
    direction: "asc",
  });

  const activePeriod = periodOptions.some(
    (option) => option.value === selectedPeriod,
  )
    ? selectedPeriod
    : currentPeriodValue;

  const clusterOptions = useMemo(
    () => getWorkforceClusterOptions(sourceRows),
    [sourceRows],
  );
  const activeCluster = clusterOptions.includes(selectedCluster)
    ? selectedCluster
    : "All Clusters";

  useEffect(() => {
    return () => resetPagination();
  }, [resetPagination]);

  useEffect(() => {
    setSelectedPeriod(currentPeriodValue);
    setExpandedRows({});
  }, [currentPeriodValue]);

  function handleSort(nextKey) {
    setSortConfig((current) => ({
      key: nextKey,
      direction:
        current.key === nextKey && current.direction === "asc" ? "desc" : "asc",
    }));
  }

  function handlePeriodChange(nextPeriod) {
    if (!nextPeriod || nextPeriod === activePeriod) return;

    setSelectedPeriod(nextPeriod);
    setExpandedRows({});
  }

  function toggleExpandedRow(rowKey) {
    setExpandedRows((current) => ({
      ...current,
      [rowKey]: !current[rowKey],
    }));
  }

  const periodRows = useMemo(
    () =>
      sourceRows.map((row) =>
        buildPeriodDisplayRow(row, activePeriod, normalizedSelectedWeekNumber),
      ),
    [activePeriod, normalizedSelectedWeekNumber, sourceRows],
  );

  const filteredRows = useMemo(
    () =>
      filterWorkforceRows(periodRows, {
        search,
        cluster: activeCluster,
        risk: selectedRisk,
      }),
    [activeCluster, periodRows, search, selectedRisk],
  );

  const sortedRows = useMemo(() => {
    return [...filteredRows].sort((firstRow, secondRow) => {
      const firstRawValue = firstRow?.[sortConfig.key];
      const secondRawValue = secondRow?.[sortConfig.key];
      const firstNumber = Number(firstRawValue);
      const secondNumber = Number(secondRawValue);

      let comparison = 0;

      if (Number.isFinite(firstNumber) && Number.isFinite(secondNumber)) {
        comparison = firstNumber - secondNumber;
      } else {
        comparison = getSortableText(firstRow, sortConfig.key).localeCompare(
          getSortableText(secondRow, sortConfig.key),
          undefined,
          {
            numeric: true,
            sensitivity: "base",
          },
        );
      }

      return sortConfig.direction === "asc" ? comparison : -comparison;
    });
  }, [filteredRows, sortConfig]);

  const activeTotals = useMemo(
    () => buildFilteredTotals(filteredRows, totals),
    [filteredRows, totals],
  );

  const lossGroupTitle =
    activePeriod === ALL_SIX_WEEKS
      ? "3. 6-Week Loss"
      : activePeriod === currentPeriodValue
        ? "3. Current Week Loss"
        : "3. Selected Week Loss";

  function clearSearch() {
    setSearchInput("");
    setSearch?.("");
  }

  function clearAllFilters() {
    clearSearch();
    setSelectedCluster("All Clusters");
    setSelectedRisk("All Risks");
  }

  const hasActiveFilters =
    Boolean(searchInput || search) ||
    activeCluster !== "All Clusters" ||
    selectedRisk !== "All Risks";

  function handleDragStart(event) {
    const container = dragScrollRef.current;
    if (!container) return;
    if (event.target.closest("button, input, select, textarea, a")) return;

    isDraggingRef.current = true;
    setIsDragging(true);
    startXRef.current = event.pageX - container.offsetLeft;
    scrollLeftRef.current = container.scrollLeft;
    container.style.userSelect = "none";
  }

  function handleDragMove(event) {
    const container = dragScrollRef.current;
    if (!container || !isDraggingRef.current) return;

    event.preventDefault();
    const x = event.pageX - container.offsetLeft;
    container.scrollLeft = scrollLeftRef.current - (x - startXRef.current);
  }

  function handleDragEnd() {
    const container = dragScrollRef.current;
    isDraggingRef.current = false;
    setIsDragging(false);
    if (container) container.style.userSelect = "";
  }

  return (
    <section className="sibs-page-card-in sibs-card overflow-hidden rounded-2xl border border-[#E6ECF2] bg-white shadow-sm">
      <div className="border-b border-[#E6ECF2] px-3 py-2 2xl:px-5 2xl:py-4">
        <div className="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(320px,1fr)_minmax(680px,860px)] xl:items-start">
          <div className="min-w-0">
            <div className="flex min-w-0 items-start gap-2">

              <div className="min-w-0 space-y-0.5">
                <h2 className="font-heading text-sm 2xl:text-base font-bold text-sibs-navy tracking-tight">
                  Detailed Performance by Cluster / Account (6-Week Multi-Week Ledger)
                </h2>
                <p className="mt-0.5 sibs-text-xs font-semibold text-[#667085]">
                  Master account-level capacity ledger across the selected six-week window, including requirements, buffer, workforce loss, pipeline, and yield metrics.
                </p>
              </div>
            </div>

            <span className="mt-2.5 inline-flex w-fit items-center gap-1.5 rounded-lg border border-[#E6ECF2] bg-[#F8FAFC] px-2.5 py-1 2xl:px-3 2xl:py-1.5 sibs-text-micro font-extrabold uppercase tracking-wide text-[#667085]">
              <GripHorizontal className="h-3.5 w-3.5 text-[#FF5C28]" />
              Drag horizontally to inspect all columns
            </span>
          </div>

          <div className="min-w-0 space-y-3">
            <div className="flex w-full justify-end">
              <PeriodSelector
                options={periodOptions}
                value={activePeriod}
                onChange={handlePeriodChange}
              />
            </div>

            <PaginationTable
              className="border-0 bg-transparent p-0 shadow-none"
              showPagination={false}
              searchValue={searchInput}
              searchPlaceholder="Search account / cluster..."
              onSearchChange={setSearchInput}
              onSearchKeyDown={handleSearchKeyDown}
              filterLayout="ta-inline"
              controlsClassName="grid grid-cols-1 gap-2 overflow-visible sm:grid-cols-2 xl:grid-cols-[minmax(240px,1fr)_190px_170px_auto] xl:items-end"
              searchClassName="relative w-full min-w-0 sm:col-span-2 xl:col-span-1"
              dropdownFilters={[
                {
                  key: "cluster",
                  value: activeCluster,
                  onChange: setSelectedCluster,
                  options: clusterOptions
                    .filter((option) => option !== "All Clusters")
                    .map((option) => ({ label: option, value: option })),
                  allLabel: "All Clusters",
                  placeholder: "Search clusters...",
                  includeAll: true,
                  searchable: true,
                  className: "w-full xl:w-[190px] xl:flex-none",
                },
                {
                  key: "risk",
                  value: selectedRisk,
                  onChange: setSelectedRisk,
                  options: WORKFORCE_RISK_OPTIONS
                    .filter((option) => option !== "All Risks")
                    .map((option) => ({ label: option, value: option })),
                  allLabel: "All Risks",
                  placeholder: "Search risks...",
                  includeAll: true,
                  searchable: true,
                  className: "w-full xl:w-[170px] xl:flex-none",
                },
              ]}
              rightContentClassName="flex w-full items-end xl:w-auto xl:flex-none"
              rightContent={
                <div className="flex w-full flex-wrap items-center justify-start gap-2 xl:w-auto xl:justify-end">
                  <span className="inline-flex h-10 items-center rounded-[10px] border border-blue-100 bg-[#E9F0FC] px-3 text-[10px] font-extrabold tabular-nums text-[#042C51]">
                    {sortedRows.length} account rows
                  </span>

                  {hasActiveFilters ? (
                    <button
                      type="button"
                      onClick={clearAllFilters}
                      className="h-10 rounded-[10px] border border-[#D6E0EA] bg-white px-3 text-[10px] font-extrabold text-[#667085] transition hover:border-[#FF5C28]/40 hover:bg-[#FFF7F3] hover:text-[#FF5C28] focus:outline-none focus:ring-4 focus:ring-[#FF5C28]/10"
                    >
                      Clear
                    </button>
                  ) : null}
                </div>
              }
            />
          </div>
        </div>
      </div>

      <div className="p-3 sm:p-4">
        <ResponsiveTableShell
          mobileContent={
            sortedRows.length === 0 ? (
              <DataCard.Empty
                title="No account records found"
                description="No account records match the current period, search, and filters."
              />
            ) : (
              <div className="space-y-3">
                {sortedRows.map((row, index) => {
                  const rowKey = getRowKey(row, index);
                  const isExpanded = Boolean(expandedRows[rowKey]);

                  return (
                    <WorkforceAccountMobileCard
                      key={`mobile-${rowKey}`}
                      row={row}
                      isExpanded={isExpanded}
                      onToggleExpand={() => toggleExpandedRow(rowKey)}
                      activePeriod={activePeriod}
                      normalizedSelectedWeekNumber={normalizedSelectedWeekNumber}
                    />
                  );
                })}
              </div>
            )
          }
          desktopContent={
            <div className="sibs-data-table-shell !block overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
              <div
                ref={dragScrollRef}
                className={`overflow-x-auto sibs-scrollbar ${
                  isDragging ? "cursor-grabbing" : "cursor-grab"
                }`}
                onMouseDown={handleDragStart}
                onMouseMove={handleDragMove}
                onMouseUp={handleDragEnd}
                onMouseLeave={handleDragEnd}
              >
                <table className="w-[2500px] min-w-[2500px] table-fixed border-collapse text-left font-jakarta text-xs whitespace-nowrap">
                  <colgroup>
                    <col style={{ width: "40px" }} />
                    <col style={{ width: "120px" }} />
                    <col style={{ width: "150px" }} />

                    <col style={{ width: "95px" }} />
                    <col style={{ width: "90px" }} />
                    <col style={{ width: "85px" }} />
                    <col style={{ width: "95px" }} />
                    <col style={{ width: "105px" }} />

                    <col style={{ width: "90px" }} />
                    <col style={{ width: "75px" }} />
                    <col style={{ width: "85px" }} />
                    <col style={{ width: "75px" }} />

                    <col style={{ width: "95px" }} />
                    <col style={{ width: "85px" }} />
                    <col style={{ width: "85px" }} />
                    <col style={{ width: "85px" }} />
                    <col style={{ width: "80px" }} />

                    <col style={{ width: "155px" }} />
                    <col style={{ width: "155px" }} />
                    <col style={{ width: "155px" }} />
                    <col style={{ width: "155px" }} />

                    <col style={{ width: "90px" }} />
                    <col style={{ width: "90px" }} />
                    <col style={{ width: "110px" }} />
                  </colgroup>

                  <thead className="bg-[#F8FAFC] font-jakarta">
                    <tr className="border-b border-slate-200 text-slate-600 font-extrabold text-[10px] tracking-wider uppercase">
                      <HeaderTh className="!text-center">#</HeaderTh>
                      <HeaderTh sortable sortKey="cluster">Cluster</HeaderTh>
                      <HeaderTh sortable sortKey="account">Account</HeaderTh>

                      <HeaderTh colSpan={5} className="!text-center !bg-slate-100/70 !border-r-slate-200">
                        Workforce Capacity
                      </HeaderTh>

                      <HeaderTh colSpan={4} className="!text-center !bg-slate-100/70 !border-r-slate-200">
                        Shrinkage & Attrition
                      </HeaderTh>

                      <HeaderTh colSpan={5} className="!text-center !bg-slate-100/70 !border-r-slate-200">
                        Hiring Funnel Milestones
                      </HeaderTh>

                      <HeaderTh colSpan={4} className="!text-center !bg-slate-100/70 !border-r-slate-200">
                        Pipeline Conversion & Retention
                      </HeaderTh>

                      <HeaderTh colSpan={3} className="!text-center !bg-slate-100/70">
                        Fulfillment Summary
                      </HeaderTh>
                    </tr>

                    <tr className="border-b border-slate-200 text-slate-500 font-bold text-[10px] uppercase tracking-wider">
                      <HeaderTh className="!text-center">
                        <GripHorizontal className="w-3.5 h-3.5 mx-auto text-slate-400" />
                      </HeaderTh>
                      <HeaderTh sortable sortKey="cluster">Cluster Group</HeaderTh>
                      <HeaderTh sortable sortKey="account">Account Name</HeaderTh>

                      <HeaderTh className="!text-right">Planned HC</HeaderTh>
                      <HeaderTh className="!text-right">Actual HC</HeaderTh>
                      <HeaderTh className="!text-right">Buffer %</HeaderTh>

                      <HeaderTh className="!text-right !font-black !text-sibs-primary-1">
                        Net Actual
                      </HeaderTh>

                      <HeaderTh className="!border-r-slate-200 !text-right !font-black !text-rose-600">
                        Hiring Needed
                      </HeaderTh>

                      <HeaderTh className="!text-right">Absenteeism</HeaderTh>

                      <HeaderTh className="!text-right !font-black !text-sibs-primary-1">
                        ABS %
                      </HeaderTh>

                      <HeaderTh className="!text-right">Attrition</HeaderTh>

                      <HeaderTh className="!border-r-slate-200 !text-right !font-black !text-sibs-primary-1">
                        ATT %
                      </HeaderTh>

                      <HeaderTh className="!text-right">Accepted JO</HeaderTh>
                      <HeaderTh className="!text-right">NHO Count</HeaderTh>
                      <HeaderTh className="!text-right">FST Count</HeaderTh>
                      <HeaderTh className="!text-right">PST Count</HeaderTh>

                      <HeaderTh className="!border-r-slate-200 !text-right">
                        Go Live
                      </HeaderTh>

                      <HeaderTh>JO → NHO (Drop / Ret%)</HeaderTh>
                      <HeaderTh>NHO → FST (Drop / Ret%)</HeaderTh>
                      <HeaderTh>FST → PST (Drop / Ret%)</HeaderTh>

                      <HeaderTh className="!border-r-slate-200">
                        PST → Go Live (Drop / Ret%)
                      </HeaderTh>

                      <HeaderTh className="!text-right">Hired Count</HeaderTh>
                      <HeaderTh className="!text-right">Hiring Rate %</HeaderTh>
                      <HeaderTh>Hiring Risk</HeaderTh>
                    </tr>
                  </thead>

                  <tbody className="bg-white font-jakarta font-medium">
                    {sortedRows.length === 0 ? (
                      <tr>
                        <td
                          colSpan={TABLE_COLUMN_COUNT}
                          className="sibs-empty-panel border-0 px-6 py-12"
                        >
                          No account records match the current period, search, and filters.
                        </td>
                      </tr>
                    ) : (
                      sortedRows.map((row, index) => {
                        const rowKey = getRowKey(row, index);
                        const isExpanded = Boolean(expandedRows[rowKey]);
                        const hasBeenOpened = Object.prototype.hasOwnProperty.call(
                          expandedRows,
                          rowKey,
                        );
                        const detailsPanelId = `workforce-history-${index}-${String(
                          rowKey,
                        ).replace(/[^a-zA-Z0-9_-]/g, "-")}`;

                        return (
                          <Fragment key={rowKey}>
                            <tr
                              className={`border-b border-[#E6ECF2] transition-colors cursor-pointer text-xs ${
                                isExpanded ? "bg-amber-50/60" : "hover:bg-slate-50/80"
                              }`}
                            >
                              <BodyTd
                                align="center"
                                numeric={false}
                                className="!px-2 !py-2.5"
                              >
                                <button
                                  type="button"
                                  onClick={() => toggleExpandedRow(rowKey)}
                                  onMouseDown={(event) => event.stopPropagation()}
                                  className="p-1 rounded text-slate-500 transition-colors hover:bg-slate-200"
                                  aria-expanded={isExpanded}
                                  aria-controls={detailsPanelId}
                                  aria-label={`${isExpanded ? "Collapse" : "Expand"} ${row.account} six-week history`}
                                >
                                  {isExpanded ? (
                                    <ChevronDown className="w-3.5 h-3.5" />
                                  ) : (
                                    <ChevronRight className="w-3.5 h-3.5" />
                                  )}
                                </button>
                              </BodyTd>

                              <BodyTd
                                align="left"
                                numeric={false}
                                className="font-normal text-slate-500"
                              >
                                <span
                                  className="block max-w-[105px] truncate font-normal text-slate-500"
                                  title={row.cluster}
                                >
                                  {row.cluster}
                                </span>
                              </BodyTd>

                              <BodyTd
                                align="left"
                                numeric={false}
                                className={BOLD_NUMBER_CLASS}
                              >
                                <span
                                  className="block max-w-[135px] truncate !font-black !text-[#042C51]"
                                  title={row.account}
                                >
                                  {row.account}
                                </span>
                              </BodyTd>

                              <PerformanceCells row={row} />
                            </tr>

                            <tr aria-hidden={!isExpanded}>
                              <td
                                colSpan={TABLE_COLUMN_COUNT}
                                className="border-0 bg-white p-0"
                              >
                                <div
                                  className={`sibs-animated-dropdown ${
                                    isExpanded ? "open" : "closed"
                                  }`}
                                >
                                  <div className="sibs-animated-dropdown-inner">
                                    <div
                                      id={detailsPanelId}
                                      role="region"
                                      aria-label={`${row.account} six-week history`}
                                      className="sibs-animated-dropdown-box !rounded-none !border-x !border-b !border-t-0 !border-slate-200 !border-l-4 !border-l-sibs-primary-2 !bg-white !p-4 !shadow-none"
                                    >
                                      {hasBeenOpened ? (
                                        <ExpandedHistory
                                          row={row}
                                          selectedWeekNumber={normalizedSelectedWeekNumber}
                                          selectedPeriod={activePeriod}
                                        />
                                      ) : null}
                                    </div>
                                  </div>
                                </div>
                              </td>
                            </tr>
                          </Fragment>
                        );
                      })
                    )}
                  </tbody>

                  {sortedRows.length > 0 ? (
                    <tfoot>
                      <tr className="border-t-2 border-slate-300 bg-[#EBF3FA] font-black text-sibs-primary-1">
                        <BodyTd
                          colSpan={3}
                          align="left"
                          numeric={false}
                          className="font-extrabold uppercase text-sibs-primary-1 !border-r-slate-200"
                        >
                          Total / Average ({sortedRows.length} Accounts)
                        </BodyTd>

                        <PerformanceCells row={activeTotals} summary />
                      </tr>
                    </tfoot>
                  ) : null}
                </table>
              </div>
            </div>
          }
        />
      </div>
    </section>
  );
}