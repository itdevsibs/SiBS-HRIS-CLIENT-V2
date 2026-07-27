import React, { useEffect, useMemo, useState } from "react";
import {
  formatOverviewNumber,
  formatOverviewPercent,
} from "../../../lib/utils/workforceHiringOverview/workforceHiringOverviewHelpers";
import { getWorkforceHiringPlanForecast } from "../../../lib/axios/getWorkforceHiringPlan";
import { useWorkforceHiring } from "../../../services/context/WorkforceHiringContext";
import ForecastWeekAccountDetailsModal from "./ForecastWeekAccountDetailsModal";

function safeNumber(value) {
  const numberValue = Number(value || 0);
  return Number.isFinite(numberValue) ? numberValue : 0;
}

function getDateValue(row = {}, keys = []) {
  for (const key of keys) {
    const value = row?.[key];

    if (value) return String(value).slice(0, 10);
  }

  return "";
}

function parseDate(value) {
  if (!value) return null;

  const date = new Date(`${String(value).slice(0, 10)}T00:00:00`);

  return Number.isNaN(date.getTime()) ? null : date;
}

function formatDisplayDate(value, includeYear = true) {
  const date = value instanceof Date ? value : parseDate(value);

  if (!date) return "—";

  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    ...(includeYear ? { year: "numeric" } : {}),
  });
}

function getWeekNumberFromDate(value) {
  const date = parseDate(value);

  if (!date) return 0;

  const year = date.getFullYear();
  const weekOneStart = new Date(`${year}-01-01T00:00:00`);
  const day = weekOneStart.getDay();
  const diffToMonday = day === 0 ? -6 : 1 - day;

  weekOneStart.setDate(weekOneStart.getDate() + diffToMonday);
  weekOneStart.setHours(0, 0, 0, 0);

  const diffDays = Math.floor(
    (date.getTime() - weekOneStart.getTime()) / 86_400_000,
  );

  if (!Number.isFinite(diffDays) || diffDays < 0) return 0;

  return Math.floor(diffDays / 7) + 1;
}

function formatForecastWeekLabel(row = {}) {
  const weekStart = getWeekStart(row);
  const weekEnd = getWeekEnd(row);
  const startDate = parseDate(weekStart);

  if (!startDate || !weekEnd) {
    return formatDisplayDate(weekStart);
  }

  const weekNumber =
    row?.weekNumber || row?.week_number || getWeekNumberFromDate(weekStart);

  const startLabel = formatDisplayDate(weekStart, false);
  const endLabel = formatDisplayDate(weekEnd, true);

  if (!weekNumber) {
    return `${startLabel} – ${endLabel}`;
  }

  return `Week ${weekNumber} | ${startLabel} – ${endLabel}`;
}

function getRowNumber(row = {}, keys = [], fallback = 0) {
  for (const key of keys) {
    const value = row?.[key];

    if (value !== null && value !== undefined && value !== "") {
      return safeNumber(value);
    }
  }

  return safeNumber(fallback);
}

function getWeekStart(row = {}) {
  return getDateValue(row, [
    "weekStart",
    "week_start",
    "startDate",
    "start_date",
    "dateStart",
    "date_start",
    "weekStartDate",
    "week_start_date",
  ]);
}

function getWeekEnd(row = {}) {
  return getDateValue(row, [
    "weekEnd",
    "week_end",
    "endDate",
    "end_date",
    "dateEnd",
    "date_end",
    "weekEndDate",
    "week_end_date",
  ]);
}

function normalizeRequestFilter(value, allLabel) {
  if (Array.isArray(value)) {
    if (!value.length || value.includes(allLabel) || value.includes("All")) {
      return "All";
    }

    return value.join(",");
  }

  const cleanValue = String(value || "").trim();

  if (!cleanValue || cleanValue === allLabel || cleanValue === "All") {
    return "All";
  }

  return cleanValue;
}

function HeaderTh({ children, className = "" }) {
  return (
    <th
      className={[
        "border-b border-slate-200 bg-slate-50 px-3 py-3 text-center align-middle text-[11px] font-extrabold uppercase leading-tight text-sibs-primary-90",
        className,
      ].join(" ")}
    >
      {children}
    </th>
  );
}

function BodyTd({ children, className = "", ...props }) {
  return (
    <td
      {...props}
      className={[
        "border-b border-slate-200 px-3 py-3 text-center align-middle text-sm font-extrabold text-sibs-primary-90",
        className,
      ].join(" ")}
    >
      {children}
    </td>
  );
}

function FooterTd({ children, className = "", ...props }) {
  return (
    <td
      {...props}
      className={[
        "border-t border-slate-200 bg-slate-50 px-3 py-4 text-center align-middle text-sm font-extrabold text-sibs-primary-90",
        className,
      ].join(" ")}
    >
      {children}
    </td>
  );
}

function getValueColor(value) {
  const numberValue = safeNumber(value);

  if (numberValue < 0) return "text-red-600";
  if (numberValue > 0) return "text-emerald-600";

  return "text-sibs-primary-90";
}

function getHiringNeededColor(value) {
  return safeNumber(value) > 0 ? "text-red-600" : "text-emerald-600";
}

function ForecastMetricWithPercent({
  value,
  percent,
  percentClassName = "text-slate-500",
}) {
  return (
    <div className="leading-tight">
      <div>{formatOverviewNumber(value)}</div>
      <div
        className={["mt-0.5 text-[10px] font-extrabold", percentClassName].join(
          " ",
        )}
      >
        {formatOverviewPercent(percent)}
      </div>
    </div>
  );
}

function normalizeForecastRow(row = {}) {
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
  ]);

  const attrition = getRowNumber(row, [
    "attrition",
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
    ["hiringNeeded", "hiring_needed"],
    Math.max(0, requiredHeadcount - netActualHc),
  );

  return {
    weekStart: getWeekStart(row),
    weekEnd: getWeekEnd(row),

    requiredHeadcount,
    actualHeadcount,

    absenteeism,
    absenteeismPercentage: getRowNumber(row, [
      "absenteeismPercentage",
      "absenteeism_percentage",
      "absenteeismPercent",
      "absenteeism_percent",
    ]),

    attrition,
    attritionPercentage: getRowNumber(row, [
      "attritionPercentage",
      "attrition_percentage",
      "attritionPercent",
      "attrition_percent",
    ]),

    bufferPercentage: getRowNumber(row, [
      "bufferPercentage",
      "buffer_percentage",
      "bufferPercent",
      "buffer_percent",
    ]),

    netActualHc,
    hiringNeeded,

    acceptedJo: getRowNumber(row, [
      "acceptedJo",
      "acceptedJO",
      "accepted_jo",
      "acceptedJobOffer",
      "accepted_job_offer",
    ]),

    nho: getRowNumber(row, ["nho", "nhoCount", "nho_count"]),
    fst: getRowNumber(row, ["fst", "fstCount", "fst_count"]),
    pst: getRowNumber(row, ["pst", "pstCount", "pst_count"]),

    goLive: getRowNumber(row, [
      "goLive",
      "go_live",
      "goLiveCount",
      "go_live_count",
    ]),

    hiredCount: getRowNumber(row, ["hiredCount", "hired_count", "hired"]),

    hiringRate: getRowNumber(row, [
      "hiringRate",
      "hiring_rate",
      "hiringPlanPercent",
      "hiring_plan_percent",
    ]),

    leadsToInterview: getRowNumber(row, [
      "leadsToInterview",
      "leads_to_interview",
      "targetLeads",
      "target_leads",
    ]),

    acceptedJoToNhoCount: getRowNumber(row, [
      "acceptedJoToNhoCount",
      "accepted_jo_to_nho_count",
      "attritionInterviewToNhoCount",
      "attrition_interview_to_nho_count",
    ]),
    acceptedJoToNhoPercent: getRowNumber(row, [
      "acceptedJoToNhoPercent",
      "accepted_jo_to_nho_percent",
      "attritionInterviewToNhoPercent",
      "attrition_interview_to_nho_percent",
    ]),

    nhoToFstCount: getRowNumber(row, [
      "nhoToFstCount",
      "nho_to_fst_count",
      "attritionNhoToFstCount",
      "attrition_nho_to_fst_count",
    ]),
    nhoToFstPercent: getRowNumber(row, [
      "nhoToFstPercent",
      "nho_to_fst_percent",
      "attritionNhoToFstPercent",
      "attrition_nho_to_fst_percent",
    ]),

    fstToPstCount: getRowNumber(row, [
      "fstToPstCount",
      "fst_to_pst_count",
      "attritionFstToPstCount",
      "attrition_fst_to_pst_count",
    ]),
    fstToPstPercent: getRowNumber(row, [
      "fstToPstPercent",
      "fst_to_pst_percent",
      "attritionFstToPstPercent",
      "attrition_fst_to_pst_percent",
    ]),

    nhoToPstCount: getRowNumber(row, [
      "nhoToPstCount",
      "nho_to_pst_count",
      "attritionNhoToPstCount",
      "attrition_nho_to_pst_count",
      "attritionNhoToFstPstCount",
      "attrition_nho_to_fst_pst_count",
    ]),
    nhoToPstPercent: getRowNumber(row, [
      "nhoToPstPercent",
      "nho_to_pst_percent",
      "attritionNhoToPstPercent",
      "attrition_nho_to_pst_percent",
      "attritionNhoToFstPstPercent",
      "attrition_nho_to_fst_pst_percent",
    ]),

    pstToGoLiveCount: getRowNumber(row, [
      "pstToGoLiveCount",
      "pst_to_go_live_count",
      "attritionPstToGoLiveCount",
      "attrition_pst_to_go_live_count",
    ]),
    pstToGoLivePercent: getRowNumber(row, [
      "pstToGoLivePercent",
      "pst_to_go_live_percent",
      "attritionPstToGoLivePercent",
      "attrition_pst_to_go_live_percent",
    ]),
  };
}

function normalizeForecastSummary(summary = {}) {
  return normalizeForecastRow(summary);
}

function buildSixWeekForecastAverageSummary(rows = []) {
  const safeRows = Array.isArray(rows) ? rows : [];

  if (!safeRows.length) {
    return normalizeForecastRow({});
  }

  const sum = safeRows.reduce(
    (acc, row) => {
      acc.requiredHeadcount += safeNumber(row.requiredHeadcount);
      acc.actualHeadcount += safeNumber(row.actualHeadcount);
      acc.absenteeism += safeNumber(row.absenteeism);
      acc.attrition += safeNumber(row.attrition);

      acc.acceptedJo += safeNumber(row.acceptedJo);
      acc.nho += safeNumber(row.nho);
      acc.fst += safeNumber(row.fst);
      acc.pst += safeNumber(row.pst);
      acc.goLive += safeNumber(row.goLive);
      acc.hiredCount += safeNumber(row.hiredCount);

      return acc;
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
      hiredCount: 0,
    },
  );

  const divisor = Math.max(safeRows.length, 1);

  /*
    Round the averaged count/source columns so the TOTAL / AVG. row
    does not show decimals like 502.667, 52.5, or 77.167.
  */
  const requiredHeadcount = Math.round(sum.requiredHeadcount / divisor);
  const actualHeadcount = Math.round(sum.actualHeadcount / divisor);
  const absenteeism = Math.round(sum.absenteeism / divisor);
  const attrition = Math.round(sum.attrition / divisor);

  const acceptedJo = Math.round(sum.acceptedJo / divisor);
  const nho = Math.round(sum.nho / divisor);
  const fst = Math.round(sum.fst / divisor);
  const pst = Math.round(sum.pst / divisor);
  const goLive = Math.round(sum.goLive / divisor);
  const hiredCount = Math.round(sum.hiredCount / divisor);

  /*
    Match the Excel-style 6-week average logic:
    average and round source/count columns first, then recompute derived columns.
  */
  const netActualHc = Math.max(0, actualHeadcount - absenteeism - attrition);

  const bufferPercentage =
    requiredHeadcount > 0
      ? ((netActualHc - requiredHeadcount) / requiredHeadcount) * 100
      : 0;

  const absenteeismPercentage =
    actualHeadcount > 0 ? (absenteeism / actualHeadcount) * 100 : 0;

  const attritionPercentage =
    actualHeadcount > 0 ? (attrition / actualHeadcount) * 100 : 0;

  const hiringNeeded = Math.max(0, requiredHeadcount - netActualHc);

  /*
    Keep the same unit as the forecast table rows.
    formatOverviewPercent prints the value as-is with %, so 147 means 147%.
  */
  const hiringRate = acceptedJo > 0 ? (fst / acceptedJo) * 100 : 0;

  const hiringRateDecimal = hiringRate / 100;

  const leadsToInterview =
    hiringNeeded <= 0
      ? 0
      : hiringRateDecimal > 0
        ? Math.ceil(hiringNeeded / hiringRateDecimal)
        : hiringNeeded;

  return {
    requiredHeadcount,
    actualHeadcount,
    absenteeism,
    absenteeismPercentage,
    attrition,
    attritionPercentage,
    bufferPercentage,
    netActualHc,
    hiringNeeded,
    acceptedJo,
    nho,
    fst,
    pst,
    goLive,
    hiredCount,
    hiringRate,
    leadsToInterview,
  };
}

function getForecastRowsFromResponse(response) {
  if (Array.isArray(response)) return response;

  const candidates = [
    response?.data,
    response?.rows,
    response?.forecastRows,
    response?.forecast_rows,
    response?.forecastData,
    response?.forecast_data,
  ];

  for (const candidate of candidates) {
    if (Array.isArray(candidate)) return candidate;
  }

  return [];
}

function getForecastAccountRowsByWeekFromResponse(response) {
  if (!response || Array.isArray(response)) return [];

  const candidates = [
    response?.accountForecastRowsByWeek,
    response?.account_forecast_rows_by_week,
    response?.data?.accountForecastRowsByWeek,
    response?.data?.account_forecast_rows_by_week,
  ];

  for (const candidate of candidates) {
    if (Array.isArray(candidate)) return candidate;
  }

  return [];
}

function getForecastWeekAccountGroup(groups = [], row = {}, index = 0) {
  const safeGroups = Array.isArray(groups) ? groups : [];
  const weekStart = getWeekStart(row);
  const weekEnd = getWeekEnd(row);
  const weekNumber = row?.weekNumber || row?.week_number || "";

  const matchedByDate = safeGroups.find((group) => {
    const groupWeekStart = getWeekStart(group);
    const groupWeekEnd = getWeekEnd(group);

    return (
      groupWeekStart &&
      groupWeekEnd &&
      groupWeekStart === weekStart &&
      groupWeekEnd === weekEnd
    );
  });

  if (matchedByDate) return matchedByDate;

  const matchedByWeekNumber = safeGroups.find((group) => {
    const groupWeekNumber = group?.weekNumber || group?.week_number || "";

    return weekNumber && String(groupWeekNumber) === String(weekNumber);
  });

  if (matchedByWeekNumber) return matchedByWeekNumber;

  return safeGroups[index] || {};
}

function getForecastSummaryFromResponse(response) {
  if (!response || Array.isArray(response)) return {};

  return (
    response?.summary ||
    response?.totals ||
    response?.total ||
    response?.data?.summary ||
    response?.data?.totals ||
    {}
  );
}

function getForecastStateFromContext(context = {}) {
  const tables = context?.tables || {};
  const weeklyVersion = context?.weeklyVersion || {};

  const activeWeek =
    tables.activeWeek ||
    weeklyVersion.activeWeek ||
    weeklyVersion.selectedWeek ||
    weeklyVersion.currentWeek ||
    {};

  const selectedCluster =
    tables.cluster ||
    tables.selectedCluster ||
    weeklyVersion.selectedClusters ||
    weeklyVersion.cluster ||
    weeklyVersion.selectedCluster ||
    "All";

  const selectedAccount =
    tables.account ||
    tables.selectedAccount ||
    weeklyVersion.selectedAccounts ||
    weeklyVersion.account ||
    weeklyVersion.selectedAccount ||
    "All";

  return {
    activeWeek,
    selectedCluster,
    selectedAccount,
  };
}

export default function ForecastHeadcountPlanTable({
  basisWeeks = 6,
  forecastWeeks = 6,
}) {
  const workforceHiring = useWorkforceHiring();

  /*
    Do not wrap this in useMemo.

    WorkforceHiringContext stores values in a ref and exposes them through
    getters. The context object reference stays the same, so useMemo would keep
    the first empty value and the forecast table would never receive the
    selected week date range.
  */
  const { activeWeek, selectedCluster, selectedAccount } =
    getForecastStateFromContext(workforceHiring);

  const [forecastData, setForecastData] = useState({
    rows: [],
    summary: {},
    accountRowsByWeek: [],
    loading: false,
    error: "",
  });

  const [selectedForecastWeek, setSelectedForecastWeek] = useState(null);

  const weekStart = getWeekStart(activeWeek);
  const weekEnd = getWeekEnd(activeWeek);

  useEffect(() => {
    let cancelled = false;

    async function loadForecast() {
      if (!weekStart || !weekEnd) {
        setForecastData({
          rows: [],
          summary: {},
          accountRowsByWeek: [],
          loading: false,
          error: "Missing selected week date range for forecast.",
        });

        return;
      }

      setForecastData((current) => ({
        ...current,
        loading: true,
        error: "",
      }));

      try {
        const response = await getWorkforceHiringPlanForecast({
          cluster: normalizeRequestFilter(selectedCluster, "All Clusters"),
          account: normalizeRequestFilter(selectedAccount, "All Accounts"),
          weekStart,
          weekEnd,
          startDate: weekStart,
          endDate: weekEnd,
          basisWeeks,
          forecastWeeks,
        });

        if (cancelled) return;

        if (response?.success === false) {
          setForecastData({
            rows: [],
            summary: {},
            accountRowsByWeek: [],
            loading: false,
            error: response?.message || "Failed to load forecast.",
          });

          return;
        }

        setForecastData({
          rows: getForecastRowsFromResponse(response),
          summary: getForecastSummaryFromResponse(response),
          accountRowsByWeek: getForecastAccountRowsByWeekFromResponse(response),
          loading: false,
          error: "",
        });
      } catch (error) {
        if (cancelled) return;

        setForecastData({
          rows: [],
          summary: {},
          accountRowsByWeek: [],
          loading: false,
          error:
            error?.response?.data?.message ||
            error?.response?.data?.error ||
            error?.message ||
            "Failed to load forecast.",
        });
      }
    }

    loadForecast();

    return () => {
      cancelled = true;
    };
  }, [
    basisWeeks,
    forecastWeeks,
    selectedAccount,
    selectedCluster,
    weekEnd,
    weekStart,
  ]);

  const forecastRows = useMemo(
    () => forecastData.rows.map(normalizeForecastRow),
    [forecastData.rows],
  );

  const totals = useMemo(() => {
    if (forecastRows.length > 0) {
      return buildSixWeekForecastAverageSummary(forecastRows);
    }

    return normalizeForecastSummary(forecastData.summary);
  }, [forecastData.summary, forecastRows]);

  const hasRows = forecastRows.length > 0;

  function openForecastWeekDetails(row, index) {
    const accountGroup = getForecastWeekAccountGroup(
      forecastData.accountRowsByWeek,
      row,
      index,
    );

    setSelectedForecastWeek({
      ...row,
      label: formatForecastWeekLabel(row),
      weekStart: getWeekStart(row),
      weekEnd: getWeekEnd(row),
      accountRows: Array.isArray(accountGroup?.rows) ? accountGroup.rows : [],
      rowCount:
        accountGroup?.rowCount ||
        accountGroup?.row_count ||
        (Array.isArray(accountGroup?.rows) ? accountGroup.rows.length : 0),
      forecastBasisStart:
        accountGroup?.forecastBasisStart || accountGroup?.forecast_basis_start,
      forecastBasisEnd:
        accountGroup?.forecastBasisEnd || accountGroup?.forecast_basis_end,
    });
  }

  function closeForecastWeekDetails() {
    setSelectedForecastWeek(null);
  }

  return (
    <>
      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-3 border-b border-slate-200 px-5 py-4">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-base font-extrabold uppercase tracking-tight text-sibs-primary-90">
                6-Week Forecast Headcount Plan
              </h2>

              <span className="rounded-full bg-purple-50 px-3 py-1 text-xs font-extrabold uppercase text-purple-700">
                Projection
              </span>
            </div>

            <p className="mt-1 text-sm font-semibold text-sibs-primary-70">
              Projected next 6 weeks from the past 6 actual workforce weeks.
            </p>
          </div>

          <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-extrabold text-slate-500">
            {forecastData.loading
              ? "Loading forecast..."
              : hasRows
                ? `${forecastRows.length} forecast weeks`
                : "No forecast"}
          </span>
        </div>

        {forecastData.error ? (
          <div className="mx-5 mt-4 rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm font-semibold text-red-600">
            {forecastData.error}
          </div>
        ) : null}

        <div className="overflow-hidden rounded-b-2xl">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1520px] border-separate border-spacing-0">
              <thead>
                <tr>
                  <HeaderTh className="text-left">
                    Week
                    <br />
                    (Start of Week)
                  </HeaderTh>
                  <HeaderTh>
                    Required
                    <br />
                    Headcount
                  </HeaderTh>
                  <HeaderTh>
                    Actual
                    <br />
                    Headcount
                  </HeaderTh>
                  <HeaderTh>
                    Buffer
                    <br />
                    Percentage
                  </HeaderTh>
                  <HeaderTh>
                    Absenteeism
                    <br />
                    Count / %
                  </HeaderTh>
                  <HeaderTh>
                    Attrition
                    <br />
                    Count / %
                  </HeaderTh>
                  <HeaderTh>
                    Net Actual
                    <br />
                    HC
                  </HeaderTh>
                  <HeaderTh>
                    Hiring
                    <br />
                    Needed
                  </HeaderTh>
                  <HeaderTh>
                    Accepted
                    <br />
                    Job Offer
                  </HeaderTh>
                  <HeaderTh>
                    NHO
                    <br />
                    Count
                  </HeaderTh>
                  <HeaderTh>
                    FST
                    <br />
                    Count
                  </HeaderTh>
                  <HeaderTh>
                    PST
                    <br />
                    Count
                  </HeaderTh>
                  <HeaderTh>Go Live</HeaderTh>
                  <HeaderTh>
                    Hired
                    <br />
                    Count
                  </HeaderTh>
                  <HeaderTh>
                    Hiring Rate
                    <br />
                    (Leads to JO)
                  </HeaderTh>
                  <HeaderTh>
                    Leads to Interview
                    <br />
                    (To Generate)
                  </HeaderTh>
                </tr>
              </thead>

              <tbody>
                {hasRows ? (
                  forecastRows.map((row, index) => (
                    <tr
                      key={`${row.weekStart || "forecast"}-${index}`}
                      role="button"
                      tabIndex={0}
                      title="View account-level forecast details"
                      onClick={() => openForecastWeekDetails(row, index)}
                      onKeyDown={(event) => {
                        if (event.key === "Enter" || event.key === " ") {
                          event.preventDefault();
                          openForecastWeekDetails(row, index);
                        }
                      }}
                      className="cursor-pointer transition hover:bg-blue-50/40 focus:bg-blue-50/60 focus:outline-none"
                    >
                      <BodyTd className="text-left whitespace-nowrap">
                        {formatForecastWeekLabel(row)}
                      </BodyTd>
                      <BodyTd>
                        {formatOverviewNumber(row.requiredHeadcount)}
                      </BodyTd>
                      <BodyTd>
                        {formatOverviewNumber(row.actualHeadcount)}
                      </BodyTd>
                      <BodyTd className={getValueColor(row.bufferPercentage)}>
                        {formatOverviewPercent(row.bufferPercentage)}
                      </BodyTd>
                      <BodyTd className="text-orange-600">
                        <ForecastMetricWithPercent
                          value={row.absenteeism}
                          percent={row.absenteeismPercentage}
                          percentClassName="text-orange-500"
                        />
                      </BodyTd>
                      <BodyTd className="text-red-600">
                        <ForecastMetricWithPercent
                          value={row.attrition}
                          percent={row.attritionPercentage}
                          percentClassName="text-red-500"
                        />
                      </BodyTd>
                      <BodyTd>{formatOverviewNumber(row.netActualHc)}</BodyTd>
                      <BodyTd
                        className={getHiringNeededColor(row.hiringNeeded)}
                      >
                        {formatOverviewNumber(row.hiringNeeded)}
                      </BodyTd>
                      <BodyTd>{formatOverviewNumber(row.acceptedJo)}</BodyTd>
                      <BodyTd>{formatOverviewNumber(row.nho)}</BodyTd>
                      <BodyTd>{formatOverviewNumber(row.fst)}</BodyTd>
                      <BodyTd>{formatOverviewNumber(row.pst)}</BodyTd>
                      <BodyTd className="text-emerald-700">
                        {formatOverviewNumber(row.goLive)}
                      </BodyTd>
                      <BodyTd>{formatOverviewNumber(row.hiredCount)}</BodyTd>
                      <BodyTd>{formatOverviewPercent(row.hiringRate)}</BodyTd>
                      <BodyTd className="text-purple-700">
                        {formatOverviewNumber(row.leadsToInterview)}
                      </BodyTd>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <BodyTd colSpan={16}>
                      {forecastData.loading
                        ? "Loading forecast..."
                        : "No forecast data available."}
                    </BodyTd>
                  </tr>
                )}
              </tbody>

              {hasRows ? (
                <tfoot>
                  <tr>
                    <FooterTd className="rounded-bl-2xl text-left">
                      TOTAL / AVG.
                    </FooterTd>

                    <FooterTd>
                      {formatOverviewNumber(totals.requiredHeadcount)}
                    </FooterTd>

                    <FooterTd>
                      {formatOverviewNumber(totals.actualHeadcount)}
                    </FooterTd>

                    <FooterTd
                      className={getValueColor(totals.bufferPercentage)}
                    >
                      {formatOverviewPercent(totals.bufferPercentage)}
                    </FooterTd>

                    <FooterTd className="text-orange-600">
                      <ForecastMetricWithPercent
                        value={totals.absenteeism}
                        percent={totals.absenteeismPercentage}
                        percentClassName="text-orange-500"
                      />
                    </FooterTd>

                    <FooterTd className="text-red-600">
                      <ForecastMetricWithPercent
                        value={totals.attrition}
                        percent={totals.attritionPercentage}
                        percentClassName="text-red-500"
                      />
                    </FooterTd>

                    <FooterTd>
                      {formatOverviewNumber(totals.netActualHc)}
                    </FooterTd>

                    <FooterTd
                      className={getHiringNeededColor(totals.hiringNeeded)}
                    >
                      {formatOverviewNumber(totals.hiringNeeded)}
                    </FooterTd>

                    <FooterTd>
                      {formatOverviewNumber(totals.acceptedJo)}
                    </FooterTd>

                    <FooterTd>{formatOverviewNumber(totals.nho)}</FooterTd>

                    <FooterTd>{formatOverviewNumber(totals.fst)}</FooterTd>

                    <FooterTd>{formatOverviewNumber(totals.pst)}</FooterTd>

                    <FooterTd className="text-emerald-700">
                      {formatOverviewNumber(totals.goLive)}
                    </FooterTd>

                    <FooterTd>
                      {formatOverviewNumber(totals.hiredCount)}
                    </FooterTd>

                    <FooterTd>
                      {formatOverviewPercent(totals.hiringRate)}
                    </FooterTd>

                    <FooterTd className="rounded-br-2xl text-purple-700">
                      {formatOverviewNumber(totals.leadsToInterview)}
                    </FooterTd>
                  </tr>
                </tfoot>
              ) : null}
            </table>
          </div>
        </div>
      </section>

      <ForecastWeekAccountDetailsModal
        open={Boolean(selectedForecastWeek)}
        forecastWeek={selectedForecastWeek}
        rows={selectedForecastWeek?.accountRows || []}
        onClose={closeForecastWeekDetails}
      />
    </>
  );
}
