import {
  Fragment,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { CalendarDays, ChevronDown, ChevronUp, GripHorizontal } from "lucide-react";
import { useWorkforceHiringView } from "../../../services/context/WorkforceHiringContextAdapter";
import { usePagination } from "../../../services/context/PaginationContext";
import PaginationTable from "../../../services/pagination/PaginationTable";
import {
  formatOverviewNumber,
  formatOverviewPercent,
} from "../../../lib/utils/workforceHiringOverview/workforceHiringOverviewHelpers";

const DETAILS_ENTITY = "workforce-hiring-overview-details";
const TABLE_COLUMN_COUNT = 29;

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
      className={`sibs-data-table-th border border-[#E6ECF2] px-3 text-center align-middle font-jakarta font-extrabold uppercase tracking-normal text-[#667085] ${
        group
          ? "bg-[#F8FAFC] py-2.5 text-[11px] leading-snug text-[#042C51]"
          : "bg-[#F8FAFC] py-3 text-[10px] leading-snug"
      } ${className}`}
    >
      {children}
    </th>
  );
}

function BodyTd({ children, className = "", ...props }) {
  return (
    <td
      {...props}
      className={`border border-[#E6ECF2] px-3 py-3.5 text-center align-middle font-jakarta text-xs font-semibold leading-snug text-[#344054] ${className}`}
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

function SortHeaderButton({ label, active, direction, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      onMouseDown={(event) => event.stopPropagation()}
      className={`inline-flex items-center justify-center gap-1 rounded-md px-2 py-1.5 font-jakarta text-[10px] font-extrabold uppercase tracking-normal transition ${
        active
          ? "bg-[#E9F0FC] text-[#042C51] shadow-sm"
          : "text-[#042C51] hover:bg-[#F3F6FA]"
      }`}
    >
      {label}
      <span className="text-[8px] text-[#FF5C28]">
        {active ? (direction === "asc" ? "▲" : "▼") : "↕"}
      </span>
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
  if (numberValue < 0) return "text-rose-600";
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

function PerformanceCells({ row }) {
  return (
    <>
      <BodyTd>{formatOverviewNumber(row.requiredHeadcount)}</BodyTd>
      <BodyTd>{formatOverviewNumber(row.actualHeadcount)}</BodyTd>
      <BodyTd className={getBufferColor(row.bufferPercentage)}>
        {formatOverviewPercent(row.bufferPercentage)}
      </BodyTd>
      <BodyTd className="font-extrabold text-[#042C51]">
        {formatOverviewNumber(row.netActualHc)}
      </BodyTd>
      <BodyTd className={getHiringNeededColor(row.hiringNeeded)}>
        {formatOverviewNumber(row.hiringNeeded)}
      </BodyTd>

      <BodyTd>{formatOverviewNumber(row.absenteeism)}</BodyTd>
      <BodyTd className="font-extrabold text-blue-700">
        {formatOverviewPercent(row.absenteeismPercentage)}
      </BodyTd>
      <BodyTd>{formatOverviewNumber(row.attrition)}</BodyTd>
      <BodyTd className="font-extrabold text-rose-600">
        {formatOverviewPercent(row.attritionPercentage)}
      </BodyTd>

      <BodyTd>{formatOverviewNumber(row.acceptedJo)}</BodyTd>
      <BodyTd>{formatOverviewNumber(row.nho)}</BodyTd>
      <BodyTd>{formatOverviewNumber(row.fst)}</BodyTd>
      <BodyTd>{formatOverviewNumber(row.pst)}</BodyTd>
      <BodyTd className="font-extrabold text-emerald-700">
        {formatOverviewNumber(row.goLive)}
      </BodyTd>

      <BodyTd>{formatOverviewNumber(row.joNhoCount)}</BodyTd>
      <BodyTd>{formatOverviewPercent(row.joNhoPercentage)}</BodyTd>
      <BodyTd>{formatOverviewNumber(row.nhoFstCount)}</BodyTd>
      <BodyTd>{formatOverviewPercent(row.nhoFstPercentage)}</BodyTd>
      <BodyTd>{formatOverviewNumber(row.fstPstCount)}</BodyTd>
      <BodyTd>{formatOverviewPercent(row.fstPstPercentage)}</BodyTd>
      <BodyTd>{formatOverviewNumber(row.nhoPstCount)}</BodyTd>
      <BodyTd>{formatOverviewPercent(row.nhoPstPercentage)}</BodyTd>
      <BodyTd>{formatOverviewNumber(row.pstGoLiveCount)}</BodyTd>
      <BodyTd>{formatOverviewPercent(row.pstGoLivePercentage)}</BodyTd>

      <BodyTd className="font-extrabold text-emerald-700">
        {formatOverviewNumber(row.hiredCount)}
      </BodyTd>
      <BodyTd className="font-extrabold text-[#042C51]">
        {formatOverviewPercent(row.hiringRate)}
      </BodyTd>
    </>
  );
}

function ExpandedHistory({ row, selectedWeekNumber }) {
  const history = useMemo(
    () => getSixWeekHistory(row, selectedWeekNumber),
    [row, selectedWeekNumber],
  );
  const firstWeek = history[0] || {};
  const currentWeek = history[history.length - 1] || {};
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
      <div className="flex flex-col gap-2 border-b border-[#DDE5EE] pb-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex min-w-0 items-center gap-2">
          <CalendarDays className="h-4 w-4 shrink-0 text-[#FF5C28]" />
          <h4 className="truncate text-[11px] font-black uppercase tracking-wide text-[#042C51]">
            6-Week Historical Performance Breakdown — {row.account} ({row.cluster})
          </h4>
        </div>

        <span className="w-fit rounded-full bg-[#042C51] px-3 py-1 text-[9px] font-extrabold uppercase tracking-wide text-white">
          {firstWeek.period} – {currentWeek.period}
        </span>
      </div>

      <div className="overflow-x-auto rounded-xl border border-[#E6ECF2] bg-white shadow-sm">
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

          <tbody className="divide-y divide-[#E6ECF2]">
            {history.map((week, index) => {
              const isCurrentWeek = index === history.length - 1;

              return (
                <tr
                  key={`${row.account}-${week.period}-${index}`}
                  className={
                    isCurrentWeek
                      ? "bg-[#EAF2FB] font-extrabold"
                      : "bg-white hover:bg-[#F8FAFC]"
                  }
                >
                  <HistoryTd className="text-left font-extrabold text-[#042C51]">
                    <div className="flex items-center justify-between gap-3">
                      <span>{week.period}</span>
                      {isCurrentWeek ? (
                        <span className="rounded bg-blue-600 px-1.5 py-0.5 text-[8px] font-black uppercase text-white">
                          Active
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
                  <HistoryTd className="font-extrabold text-[#042C51]">
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
                  <HistoryTd className="font-extrabold text-[#042C51]">
                    {formatOverviewNumber(week.hiredCount)}
                  </HistoryTd>
                  <HistoryTd className="font-extrabold text-[#FF5C28]">
                    {formatOverviewPercent(week.hiringRate)}
                  </HistoryTd>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
        <article className="rounded-xl border border-[#DDE5EE] bg-white px-3 py-3 shadow-sm">
          <p className="text-[9px] font-black uppercase tracking-wide text-[#98A2B3]">
            6-Week Headcount Ramp
          </p>
          <div className="mt-1.5 flex items-end justify-between gap-3">
            <strong className="text-sm font-black tabular-nums text-[#042C51]">
              {formatOverviewNumber(firstWeek.actualHeadcount)} → {formatOverviewNumber(currentWeek.actualHeadcount)}
            </strong>
            <span className={`text-[10px] font-extrabold tabular-nums ${headcountRamp >= 0 ? "text-emerald-600" : "text-rose-600"}`}>
              {headcountRamp >= 0 ? "+" : ""}{formatOverviewNumber(headcountRamp)} agents
            </span>
          </div>
        </article>

        <article className="rounded-xl border border-[#DDE5EE] bg-white px-3 py-3 shadow-sm">
          <p className="text-[9px] font-black uppercase tracking-wide text-[#98A2B3]">
            6-Week Cumulative Hires
          </p>
          <div className="mt-1.5 flex items-end justify-between gap-3">
            <strong className="text-sm font-black tabular-nums text-[#FF5C28]">
              {formatOverviewNumber(cumulativeHires)} hired
            </strong>
            <span className="text-[10px] font-extrabold tabular-nums text-[#667085]">
              {formatOverviewNumber(cumulativeGoLive)} deployed
            </span>
          </div>
        </article>

        <article className="rounded-xl border border-[#DDE5EE] bg-white px-3 py-3 shadow-sm">
          <p className="text-[9px] font-black uppercase tracking-wide text-[#98A2B3]">
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

  const dragScrollRef = useRef(null);
  const isDraggingRef = useRef(false);
  const startXRef = useRef(0);
  const scrollLeftRef = useRef(0);
  const [isDragging, setIsDragging] = useState(false);
  const [expandedRows, setExpandedRows] = useState({});
  const [selectedCluster, setSelectedCluster] = useState("All Clusters");
  const [selectedRisk, setSelectedRisk] = useState("All Risks");
  const [sortConfig, setSortConfig] = useState({
    key: "cluster",
    direction: "asc",
  });

  const sourceRows = Array.isArray(detailRows) ? detailRows : [];
  const selectedWeekNumber = getSelectedWeekNumber(filters);
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

  function handleSort(nextKey) {
    setSortConfig((current) => ({
      key: nextKey,
      direction:
        current.key === nextKey && current.direction === "asc" ? "desc" : "asc",
    }));
  }

  function toggleExpandedRow(rowKey) {
    setExpandedRows((current) => ({
      ...current,
      [rowKey]: !current[rowKey],
    }));
  }

  const filteredRows = useMemo(
    () =>
      filterWorkforceRows(sourceRows, {
        search,
        cluster: activeCluster,
        risk: selectedRisk,
      }),
    [activeCluster, search, selectedRisk, sourceRows],
  );

  const sortedRows = useMemo(() => {
    return [...filteredRows].sort((firstRow, secondRow) => {
      const firstValue = getSortableText(firstRow, sortConfig.key);
      const secondValue = getSortableText(secondRow, sortConfig.key);
      const comparison = firstValue.localeCompare(secondValue, undefined, {
        numeric: true,
        sensitivity: "base",
      });
      return sortConfig.direction === "asc" ? comparison : -comparison;
    });
  }, [filteredRows, sortConfig]);

  const activeTotals = useMemo(
    () => buildFilteredTotals(filteredRows, totals),
    [filteredRows, totals],
  );

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
      <div className="border-b border-[#E6ECF2] p-4 sm:p-5">
        <div className="flex flex-col gap-3 xl:flex-row xl:items-start xl:justify-between">
          <div className="min-w-0">
            <h2 className="sibs-section-title">
              Detailed Performance by Cluster / Account
            </h2>
            <p className="sibs-section-subtitle">
              Current selected-week capacity, loss, pipeline, and yield metrics.
            </p>
          </div>

          <span className="inline-flex w-fit items-center gap-2 rounded-lg border border-[#E6ECF2] bg-[#F8FAFC] px-3 py-2 text-[10px] font-extrabold uppercase tracking-wide text-[#667085]">
            <GripHorizontal className="h-3.5 w-3.5 text-[#FF5C28]" />
            Drag horizontally to inspect all columns
          </span>
        </div>

        <PaginationTable
          className="mt-4 border-0 bg-transparent p-0 shadow-none"
          showPagination={false}
          searchValue={searchInput}
          searchPlaceholder="Search account / cluster..."
          onSearchChange={setSearchInput}
          onSearchKeyDown={handleSearchKeyDown}
          filterLayout="ta-inline"
          controlsClassName="flex flex-col gap-3 overflow-visible xl:flex-row xl:items-end"
          searchClassName="relative w-full min-w-0 xl:flex-[1_1_520px]"
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
              className: "w-full xl:w-[210px] xl:flex-none",
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
              className: "w-full xl:w-[180px] xl:flex-none",
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

      <div className="p-4 sm:p-5">
        <div className="sibs-data-table-shell !block overflow-hidden rounded-xl border border-[#E6ECF2] bg-white">
          <div
            ref={dragScrollRef}
            className={`overflow-x-auto ${
              isDragging ? "cursor-grabbing" : "cursor-grab"
            }`}
            onMouseDown={handleDragStart}
            onMouseMove={handleDragMove}
            onMouseUp={handleDragEnd}
            onMouseLeave={handleDragEnd}
          >
            <table className="w-full min-w-[1980px] border-collapse font-jakarta">
              <thead className="sibs-data-table-head sticky top-0 z-10">
                <tr className="sibs-data-table-head-row">
                  <HeaderTh colSpan={3} group>
                    1. Identification &amp; Scope
                  </HeaderTh>
                  <HeaderTh colSpan={5} group>
                    2. Capacity &amp; Buffer Metrics
                  </HeaderTh>
                  <HeaderTh colSpan={4} group>
                    3. Current Week Loss
                  </HeaderTh>
                  <HeaderTh colSpan={5} group>
                    4. Post-Offer Funnel Counts
                  </HeaderTh>
                  <HeaderTh colSpan={10} group>
                    5. Attrition Between Stages
                  </HeaderTh>
                  <HeaderTh colSpan={2} group>
                    6. Yield &amp; Recruiting
                  </HeaderTh>
                </tr>

                <tr className="sibs-data-table-head-row border-b border-[#E6ECF2]">
                  <HeaderTh>#</HeaderTh>
                  <HeaderTh>
                    <SortHeaderButton
                      label="Cluster"
                      active={sortConfig.key === "cluster"}
                      direction={sortConfig.direction}
                      onClick={() => handleSort("cluster")}
                    />
                  </HeaderTh>
                  <HeaderTh>
                    <SortHeaderButton
                      label="Account"
                      active={sortConfig.key === "account"}
                      direction={sortConfig.direction}
                      onClick={() => handleSort("account")}
                    />
                  </HeaderTh>

                  <HeaderTh>Required HC</HeaderTh>
                  <HeaderTh>Actual HC</HeaderTh>
                  <HeaderTh>Buffer %</HeaderTh>
                  <HeaderTh>Net Actual</HeaderTh>
                  <HeaderTh>Hiring Needed</HeaderTh>

                  <HeaderTh>Absenteeism</HeaderTh>
                  <HeaderTh>Abs %</HeaderTh>
                  <HeaderTh>Attrition</HeaderTh>
                  <HeaderTh>Att %</HeaderTh>

                  <HeaderTh>Accepted JO</HeaderTh>
                  <HeaderTh>NHO Count</HeaderTh>
                  <HeaderTh>FST Count</HeaderTh>
                  <HeaderTh>PST Count</HeaderTh>
                  <HeaderTh>Go Live</HeaderTh>

                  <HeaderTh>JO - NHO Count</HeaderTh>
                  <HeaderTh>%</HeaderTh>
                  <HeaderTh>NHO - FST Count</HeaderTh>
                  <HeaderTh>%</HeaderTh>
                  <HeaderTh>FST - PST Count</HeaderTh>
                  <HeaderTh>%</HeaderTh>
                  <HeaderTh>NHO - PST Count</HeaderTh>
                  <HeaderTh>%</HeaderTh>
                  <HeaderTh>PST - Go Live Count</HeaderTh>
                  <HeaderTh>%</HeaderTh>

                  <HeaderTh>Hired Count</HeaderTh>
                  <HeaderTh>Hiring Rate</HeaderTh>
                </tr>
              </thead>

              <tbody>
                {sortedRows.length === 0 ? (
                  <tr>
                    <td
                      colSpan={TABLE_COLUMN_COUNT}
                      className="px-6 py-12 text-center text-xs font-semibold text-[#667085]"
                    >
                      No account records match the current search and filters.
                    </td>
                  </tr>
                ) : (
                  <>
                    {sortedRows.map((row, index) => {
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
                            className={`sibs-data-table-row !cursor-default transition-colors hover:bg-[#FFF8F5] ${
                              isExpanded ? "bg-[#FFF9F6]" : "bg-white"
                            }`}
                          >
                            <BodyTd className="text-[#667085]">
                              <div className="flex items-center justify-center gap-1.5">
                                <button
                                  type="button"
                                  onClick={() => toggleExpandedRow(rowKey)}
                                  onMouseDown={(event) => event.stopPropagation()}
                                  className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-md text-[#52637A] transition hover:bg-[#F8FAFC] hover:text-[#042C51]"
                                  aria-expanded={isExpanded}
                                  aria-controls={detailsPanelId}
                                  aria-label={`${isExpanded ? "Collapse" : "Expand"} ${row.account} six-week history`}
                                >
                                  {isExpanded ? (
                                    <ChevronUp className="h-3.5 w-3.5" />
                                  ) : (
                                    <ChevronDown className="h-3.5 w-3.5" />
                                  )}
                                </button>
                                <span>{index + 1}</span>
                              </div>
                            </BodyTd>
                            <BodyTd className="text-left font-semibold text-[#52637A]">
                              {row.cluster}
                            </BodyTd>
                            <BodyTd className="text-left font-extrabold text-[#042C51]">
                              {row.account}
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
                                    className="sibs-animated-dropdown-box !rounded-none !border-x !border-b !border-t-0 !border-[#E6ECF2] !border-l-4 !border-l-[#FF5C28] !bg-white !p-4 !shadow-none"
                                  >
                                    {hasBeenOpened ? (
                                      <ExpandedHistory
                                        row={row}
                                        selectedWeekNumber={selectedWeekNumber}
                                      />
                                    ) : null}
                                  </div>
                                </div>
                              </div>
                            </td>
                          </tr>
                        </Fragment>
                      );
                    })}

                    <tr className="bg-[#F8FAFC] font-extrabold">
                      <BodyTd
                        colSpan={3}
                        className="text-left font-extrabold uppercase text-[#042C51]"
                      >
                        Total / Average ({sortedRows.length} Accounts)
                      </BodyTd>
                      <PerformanceCells row={activeTotals} />
                    </tr>
                  </>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </section>
  );
}