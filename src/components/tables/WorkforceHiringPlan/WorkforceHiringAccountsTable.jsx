import React, { useEffect, useMemo, useRef, useState } from "react";
import { Search } from "lucide-react";
import { getWorkforceHiringPlanForecast } from "../../../lib/axios/getWorkforceHiringPlan";
import { useWorkforceHiring } from "../../../services/context/WorkforceHiringContext";

const PAGE_LIMIT = 15;

function toNumber(value) {
  if (value === null || value === undefined || value === "") return 0;

  const cleanValue = String(value).replace(/,/g, "").replace(/%/g, "").trim();
  const numberValue = Number(cleanValue);

  return Number.isFinite(numberValue) ? numberValue : 0;
}

function getNumberValue(...values) {
  for (const value of values) {
    if (value !== undefined && value !== null && value !== "") {
      const numberValue = toNumber(value);

      if (Number.isFinite(numberValue)) return numberValue;
    }
  }

  return 0;
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

function getSixWeekSeriesTotal(item, type = "absenteeism") {
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
      getNumberValue(
        item?.[`${prefix}Week${weekNumber}`],
        item?.[`${prefix}_week_${weekNumber}`],
        item?.[
          `week${weekNumber}${type === "absenteeism" ? "Absenteeism" : "Attrition"}`
        ],
        item?.[`week_${weekNumber}_${type}`],
      ),
    0,
  );

  if (keyedTotal > 0) return keyedTotal;

  return type === "absenteeism"
    ? getNumberValue(
        item.absenteeismSixWeeks,
        item.absenteeism_6_weeks,
        item.absenteeismPastSixWeeks,
        item.absenteeism_past_six_weeks,
        item.totalAbsenteeism,
        item.total_absenteeism,
        item.absenteeismCount,
        item.absenteeism_count,
      )
    : getNumberValue(
        item.attritionSixWeeks,
        item.attrition_6_weeks,
        item.attritionPastSixWeeks,
        item.attrition_past_six_weeks,
        item.totalAttrition,
        item.total_attrition,
        item.attritionPastCount,
        item.attrition_past_count,
        item.attritionCount,
        item.attrition_count,
      );
}

function normalizeRate(value) {
  const cleanValue = toNumber(value);

  if (cleanValue <= 0) return 0;
  if (cleanValue > 1) return cleanValue / 100;

  return cleanValue;
}

function formatNumber(value, maximumFractionDigits = 0) {
  return Number(value || 0).toLocaleString("en-PH", {
    maximumFractionDigits,
  });
}

function formatPercent(value, decimals = 1) {
  return `${(Number(value || 0) * 100).toFixed(decimals)}%`;
}

function formatSignedPercentWhole(value, decimals = 2) {
  return `${Number(value || 0).toFixed(decimals)}%`;
}

function getSignedNumberClass(value = 0) {
  const numberValue = Number(value || 0);

  if (numberValue < 0) return "text-red-600";
  if (numberValue > 0) return "text-emerald-600";

  return "text-sibs-primary-90";
}

function getRequiredHeadcount(item = {}) {
  return getNumberValue(
    item.requiredHeadcount,
    item.required_headcount,
    item.requiredHC,
    item.required_hc,
  );
}

function getActualHeadcount(item = {}) {
  return getNumberValue(
    item.actualHeadcount,
    item.actual_headcount,
    item.actualHC,
    item.actual_hc,
    item.endorsedHeadcount,
    item.endorsed_headcount,
  );
}

function getAcceptedJobOffer(item = {}) {
  return getNumberValue(
    item.acceptedJobOffer,
    item.accepted_job_offer,
    item.acceptedJoCount,
    item.accepted_jo_count,
    item.acceptedJOCount,
    item.accepted_job_offer_count,
    item.interviewCount,
    item.interview_count,
    item.interviewPopulationCount,
    item.interview_population_count,
  );
}

function getNhoCount(item = {}) {
  return getNumberValue(
    item.nhoCount,
    item.nho_count,
    item.nhoPopulationCount,
    item.nho_population_count,
  );
}

function getFstCount(item = {}) {
  return getNumberValue(
    item.fstCount,
    item.fst_count,
    item.fstPopulationCount,
    item.fst_population_count,
  );
}

function getPstCount(item = {}) {
  return getNumberValue(
    item.pstCount,
    item.pst_count,
    item.pstPopulationCount,
    item.pst_population_count,
  );
}

function getGoLiveCount(item = {}) {
  const direct = getNumberValue(
    item.goLiveCount,
    item.go_live_count,
    item.goLive,
    item.go_live,
    item.liveCount,
    item.live_count,
    item.projectedToBeEndorsed,
    item.projected_to_be_endorsed,
    item.projectedEndorsed,
    item.projected_endorsed,
  );

  if (direct > 0) return direct;

  const pstCount = getPstCount(item);
  const fstToPstAttrition = getNumberValue(
    item.attritionFstToPstCount,
    item.attrition_fst_to_pst_count,
    item.fstToPstAttritionCount,
    item.fst_to_pst_attrition_count,
  );

  return Math.max(0, pstCount - fstToPstAttrition);
}

function getHiredCount(item = {}) {
  const direct = getNumberValue(
    item.actualHiredCount,
    item.actual_hired_count,
    item.hiredEmployeeCount,
    item.hired_employee_count,
    item.hiredCount,
    item.hired_count,
  );

  if (direct > 0) return direct;

  return getFstCount(item);
}

function getLeadsToInterview(item = {}) {
  return getNumberValue(
    item.leadsToInterview,
    item.leads_to_interview,
    item.leadsToInterviewCount,
    item.leads_to_interview_count,
    item.leadsNeeded,
    item.leads_needed,
  );
}

function getDirectForecastNumber(item = {}, keys = []) {
  for (const key of keys) {
    const value = item?.[key];

    if (value !== undefined && value !== null && value !== "") {
      return toNumber(value);
    }
  }

  return null;
}

function getRowMetrics(item = {}) {
  /*
    Use forecast endpoint fields first.

    This table is now the account-level 6 forecast weeks average table.
    Do not rebuild values from old/current weekly rows unless a field is missing.
  */
  const requiredHeadcount =
    getDirectForecastNumber(item, [
      "requiredHeadcount",
      "required_headcount",
    ]) ?? getRequiredHeadcount(item);

  const actualHeadcount =
    getDirectForecastNumber(item, ["actualHeadcount", "actual_headcount"]) ??
    getActualHeadcount(item);

  const absenteeismSixWeeks =
    getDirectForecastNumber(item, [
      "absenteeism",
      "absenteeismCount",
      "absenteeism_count",
      "averageAbsentHeadcount",
      "average_absent_headcount",
    ]) ?? getSixWeekSeriesTotal(item, "absenteeism");

  const attritionSixWeeks =
    getDirectForecastNumber(item, [
      "attrition",
      "attritionCount",
      "attrition_count",
      "attritionPastCount",
      "attrition_past_count",
    ]) ?? getSixWeekSeriesTotal(item, "attrition");

  const directAbsenteeismRate = getDirectForecastNumber(item, [
    "absenteeismRate",
    "absenteeism_rate",
    "absenteeismPercentage",
    "absenteeism_percentage",
    "absenteeismPercent",
    "absenteeism_percent",
    "averageAbsenteeismPercent",
    "average_absenteeism_percent",
  ]);

  const absenteeismRate =
    directAbsenteeismRate !== null
      ? normalizeRate(directAbsenteeismRate)
      : actualHeadcount > 0
        ? absenteeismSixWeeks / actualHeadcount
        : 0;

  const directAttritionRate = getDirectForecastNumber(item, [
    "attritionRate",
    "attrition_rate",
    "attritionPercentage",
    "attrition_percentage",
    "attritionPercent",
    "attrition_percent",
    "attritionPastPercent",
    "attrition_past_percent",
  ]);

  const attritionRate =
    directAttritionRate !== null
      ? normalizeRate(directAttritionRate)
      : actualHeadcount > 0
        ? attritionSixWeeks / actualHeadcount
        : 0;

  const directNetActualHeadcount = getDirectForecastNumber(item, [
    "netActualHc",
    "net_actual_hc",
    "netActualHC",
    "netActualHeadcount",
    "net_actual_headcount",
  ]);

  const netActualHeadcount =
    directNetActualHeadcount !== null
      ? directNetActualHeadcount
      : Math.max(0, actualHeadcount - absenteeismSixWeeks - attritionSixWeeks);

  const directBufferPercentage = getDirectForecastNumber(item, [
    "bufferPercentage",
    "buffer_percentage",
    "bufferPercent",
    "buffer_percent",
    "actualBufferPercent",
    "actual_buffer_percent",
  ]);

  const bufferPercentage =
    directBufferPercentage !== null
      ? directBufferPercentage
      : requiredHeadcount > 0
        ? ((netActualHeadcount - requiredHeadcount) / requiredHeadcount) * 100
        : 0;

  const directHiringNeeded = getDirectForecastNumber(item, [
    "hiringNeeded",
    "hiring_needed",
    "actualHeadcountNeeds",
    "actual_headcount_needs",
  ]);

  const hiringNeeded =
    directHiringNeeded !== null
      ? directHiringNeeded
      : Math.max(0, requiredHeadcount - netActualHeadcount);

  const acceptedJobOffer =
    getDirectForecastNumber(item, [
      "acceptedJo",
      "acceptedJO",
      "accepted_jo",
      "acceptedJobOffer",
      "accepted_job_offer",
      "interviewCount",
      "interview_count",
    ]) ?? getAcceptedJobOffer(item);

  const nhoCount =
    getDirectForecastNumber(item, ["nho", "nhoCount", "nho_count"]) ??
    getNhoCount(item);

  const fstCount =
    getDirectForecastNumber(item, ["fst", "fstCount", "fst_count"]) ??
    getFstCount(item);

  const pstCount =
    getDirectForecastNumber(item, ["pst", "pstCount", "pst_count"]) ??
    getPstCount(item);

  const goLiveCount =
    getDirectForecastNumber(item, [
      "goLive",
      "go_live",
      "goLiveCount",
      "go_live_count",
      "projectedToBeEndorsed",
      "projected_to_be_endorsed",
    ]) ?? getGoLiveCount(item);

  const hiredCount =
    getDirectForecastNumber(item, [
      "hiredCount",
      "hired_count",
      "hired",
      "actualHiredCount",
      "actual_hired_count",
    ]) ?? getHiredCount(item);

  const directHiringRate = getDirectForecastNumber(item, [
    "hiringRate",
    "hiring_rate",
    "hiringRateDecimal",
    "hiring_rate_decimal",
    "hiringPlanPercent",
    "hiring_plan_percent",
  ]);

  const hiringRate =
    directHiringRate !== null
      ? normalizeRate(directHiringRate)
      : acceptedJobOffer > 0
        ? fstCount / acceptedJobOffer
        : 0;

  const directLeadsToInterview = getDirectForecastNumber(item, [
    "leadsToInterview",
    "leads_to_interview",
    "leadsToInterviewCount",
    "leads_to_interview_count",
    "targetLeads",
    "target_leads",
  ]);

  const leadsToInterviewToGenerate =
    directLeadsToInterview !== null
      ? directLeadsToInterview
      : hiringNeeded <= 0
        ? 0
        : hiringRate > 0
          ? Math.ceil(hiringNeeded / hiringRate)
          : hiringNeeded;

  return {
    requiredHeadcount,
    actualHeadcount,
    absenteeismSixWeeks,
    absenteeismRate,
    attritionSixWeeks,
    attritionRate,
    netActualHeadcount,
    bufferPercentage,
    hiringNeeded,
    acceptedJobOffer,
    nhoCount,
    fstCount,
    pstCount,
    goLiveCount,
    hiredCount,
    hiringRate,
    leadsToInterviewToGenerate,
  };
}

function ColumnGroup() {
  return (
    <colgroup>
      <col style={{ width: "105px" }} />
      <col style={{ width: "165px" }} />
      <col style={{ width: "92px" }} />
      <col style={{ width: "92px" }} />
      <col style={{ width: "96px" }} />
      <col style={{ width: "96px" }} />
      <col style={{ width: "88px" }} />
      <col style={{ width: "96px" }} />
      <col style={{ width: "88px" }} />
      <col style={{ width: "92px" }} />
      <col style={{ width: "92px" }} />
      <col style={{ width: "88px" }} />
      <col style={{ width: "78px" }} />
      <col style={{ width: "78px" }} />
      <col style={{ width: "78px" }} />
      <col style={{ width: "78px" }} />
      <col style={{ width: "82px" }} />
      <col style={{ width: "112px" }} />
      <col style={{ width: "132px" }} />
    </colgroup>
  );
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
      className={[
        "border border-slate-200 px-2 py-2 text-center align-middle text-[10px] font-extrabold uppercase leading-tight text-sibs-primary-90",
        group ? "bg-slate-100" : "bg-slate-50",
        className,
      ].join(" ")}
    >
      {children}
    </th>
  );
}

function BodyTd({ children, className = "" }) {
  return (
    <td
      className={[
        "border border-slate-200 px-2 py-1.5 text-center align-middle text-[12px] font-semibold leading-tight text-sibs-primary-90",
        className,
      ].join(" ")}
    >
      {children}
    </td>
  );
}

function SortHeaderButton({
  label,
  active = false,
  direction = "asc",
  onClick,
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      data-no-table-drag="true"
      className={[
        "group inline-flex items-center justify-center gap-1.5 rounded-lg px-2 py-1 text-[11px] font-extrabold uppercase leading-tight transition",
        active
          ? "bg-[#EAF2FB] text-sibs-primary-1"
          : "text-sibs-primary-90 hover:bg-slate-100 hover:text-sibs-primary-1",
      ].join(" ")}
    >
      <span>{label}</span>

      <span className="relative flex h-4 w-3 shrink-0 flex-col items-center justify-center">
        <span
          className={[
            "h-0 w-0 border-x-[4px] border-b-[5px] border-x-transparent transition",
            active && direction === "asc"
              ? "border-b-sibs-primary-1"
              : "border-b-slate-300 group-hover:border-b-sibs-primary-1/70",
          ].join(" ")}
        />

        <span
          className={[
            "mt-0.5 h-0 w-0 border-x-[4px] border-t-[5px] border-x-transparent transition",
            active && direction === "desc"
              ? "border-t-sibs-primary-1"
              : "border-t-slate-300 group-hover:border-t-sibs-primary-1/70",
          ].join(" ")}
        />
      </span>
    </button>
  );
}

function getSortableText(row = {}, key = "") {
  if (key === "cluster") {
    return String(row.cluster || row.clusterName || "").trim();
  }

  if (key === "account") {
    return String(row.account || row.accountName || "").trim();
  }

  return "";
}

function getDateValue(row = {}, keys = []) {
  for (const key of keys) {
    const value = row?.[key];

    if (value) return String(value).slice(0, 10);
  }

  return "";
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

function normalizeRequestFilter(value) {
  if (Array.isArray(value)) {
    const cleanValues = value
      .map((item) => String(item || "").trim())
      .filter(Boolean);

    if (
      cleanValues.length === 0 ||
      cleanValues.includes("All") ||
      cleanValues.includes("All Clusters") ||
      cleanValues.includes("All Accounts")
    ) {
      return "All";
    }

    return cleanValues.join(",");
  }

  const cleanValue = String(value || "").trim();

  if (
    !cleanValue ||
    cleanValue === "All" ||
    cleanValue === "All Clusters" ||
    cleanValue === "All Accounts"
  ) {
    return "All";
  }

  return cleanValue;
}

function getForecastTableStateFromContext(context = {}) {
  const tables = context?.tables || {};
  const weeklyVersion = context?.weeklyVersion || {};

  const sourceWeek =
    tables.sourceWeek ||
    tables.baseWeek ||
    tables.currentWeek ||
    tables.dashboardWeek ||
    weeklyVersion.sourceWeek ||
    weeklyVersion.baseWeek ||
    weeklyVersion.currentWeek ||
    weeklyVersion.dashboardWeek ||
    tables.activeWeek ||
    weeklyVersion.activeWeek ||
    weeklyVersion.selectedWeek ||
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
    sourceWeek,
    selectedCluster,
    selectedAccount,
  };
}

function getForecastAccountRowsByWeekFromResponse(response = {}) {
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

function getForecastAccountRowsFromResponse(response = {}) {
  const candidates = [
    response?.accountForecastRows,
    response?.account_forecast_rows,
    response?.data?.accountForecastRows,
    response?.data?.account_forecast_rows,
  ];

  for (const candidate of candidates) {
    if (Array.isArray(candidate)) return candidate;
  }

  return [];
}

function getAccountKey(row = {}) {
  return [
    String(row.cluster || row.clusterName || row.cluster_name || "").trim(),
    String(row.account || row.accountName || row.account_name || "").trim(),
  ]
    .join("||")
    .toLowerCase();
}

function getAccountDisplayIdentity(row = {}) {
  return {
    id:
      row.id ||
      `${row.cluster || row.clusterName || row.cluster_name || "All"}-${
        row.account || row.accountName || row.account_name || "Account"
      }`,
    cluster: row.cluster || row.clusterName || row.cluster_name || "",
    clusterName: row.clusterName || row.cluster || row.cluster_name || "",
    account: row.account || row.accountName || row.account_name || "",
    accountName: row.accountName || row.account || row.account_name || "",
  };
}

function flattenForecastAccountRows(response = {}) {
  const groupedRows = getForecastAccountRowsByWeekFromResponse(response);

  if (groupedRows.length > 0) {
    return groupedRows.flatMap((group, groupIndex) => {
      const rows = Array.isArray(group?.rows) ? group.rows : [];
      const groupWeekStart = getWeekStart(group);
      const groupWeekEnd = getWeekEnd(group);
      const groupWeekLabel =
        group.weekLabel ||
        group.week_label ||
        group.label ||
        `Forecast Week ${groupIndex + 1}`;

      return rows.map((row) => ({
        ...row,
        weekStart: getWeekStart(row) || groupWeekStart,
        weekEnd: getWeekEnd(row) || groupWeekEnd,
        weekLabel: row.weekLabel || row.week_label || groupWeekLabel,
      }));
    });
  }

  return getForecastAccountRowsFromResponse(response);
}

function buildSixWeekAverageForecastRows(response = {}) {
  const rows = flattenForecastAccountRows(response);
  const groupedRows = new Map();

  rows.forEach((row) => {
    const key = getAccountKey(row);

    if (!key) return;

    if (!groupedRows.has(key)) {
      groupedRows.set(key, {
        base: getAccountDisplayIdentity(row),
        count: 0,

        requiredHeadcount: 0,
        actualHeadcount: 0,
        absenteeismSixWeeks: 0,
        attritionSixWeeks: 0,

        acceptedJobOffer: 0,
        nhoCount: 0,
        fstCount: 0,
        pstCount: 0,
        goLiveCount: 0,
        hiredCount: 0,
      });
    }

    const entry = groupedRows.get(key);
    const metrics = getRowMetrics(row);

    entry.count += 1;

    /*
      Excel-style source averaging:
      Average only the source/count columns across the 6 forecast weeks.
      Derived columns are recalculated after these averages are finalized.
    */
    entry.requiredHeadcount += metrics.requiredHeadcount;
    entry.actualHeadcount += metrics.actualHeadcount;
    entry.absenteeismSixWeeks += metrics.absenteeismSixWeeks;
    entry.attritionSixWeeks += metrics.attritionSixWeeks;

    entry.acceptedJobOffer += metrics.acceptedJobOffer;
    entry.nhoCount += metrics.nhoCount;
    entry.fstCount += metrics.fstCount;
    entry.pstCount += metrics.pstCount;
    entry.goLiveCount += metrics.goLiveCount;
    entry.hiredCount += metrics.hiredCount;
  });

  return Array.from(groupedRows.values()).map((entry, index) => {
    const divisor = Math.max(entry.count, 1);

    const requiredHeadcount = entry.requiredHeadcount / divisor;
    const actualHeadcount = entry.actualHeadcount / divisor;
    const absenteeismSixWeeks = entry.absenteeismSixWeeks / divisor;
    const attritionSixWeeks = entry.attritionSixWeeks / divisor;

    const acceptedJobOffer = entry.acceptedJobOffer / divisor;
    const nhoCount = entry.nhoCount / divisor;
    const fstCount = entry.fstCount / divisor;
    const pstCount = entry.pstCount / divisor;
    const goLiveCount = entry.goLiveCount / divisor;
    const hiredCount = entry.hiredCount / divisor;

    /*
      Excel logic after the 6-week averaged values are finalized:
      - Net Actual HC = Actual HC - Absenteeism - Attrition
      - Buffer % = (Net Actual HC - Required HC) / Required HC
      - Hiring Needed = Required HC - Net Actual HC
      - Hiring Rate = FST / Accepted JO
      - Leads to Interview = Hiring Needed / Hiring Rate
    */
    const netActualHeadcount = Math.max(
      0,
      actualHeadcount - absenteeismSixWeeks - attritionSixWeeks,
    );

    const bufferPercentage =
      requiredHeadcount > 0
        ? ((netActualHeadcount - requiredHeadcount) / requiredHeadcount) * 100
        : 0;

    const hiringNeeded = Math.max(0, requiredHeadcount - netActualHeadcount);

    const hiringRate = acceptedJobOffer > 0 ? fstCount / acceptedJobOffer : 0;

    const leadsToInterviewToGenerate =
      hiringNeeded <= 0
        ? 0
        : hiringRate > 0
          ? Math.ceil(hiringNeeded / hiringRate)
          : hiringNeeded;

    return {
      ...entry.base,
      id: `${entry.base.id || "forecast-account"}-${index}`,
      week: "6 forecast weeks average",
      weekLabel: "6 forecast weeks average",
      forecastWeeksCount: divisor,

      requiredHeadcount,
      actualHeadcount,
      absenteeismSixWeeks,
      attritionSixWeeks,

      bufferPercentage,
      netActualHc: netActualHeadcount,
      netActualHeadcount,
      hiringNeeded,

      acceptedJobOffer,
      acceptedJo: acceptedJobOffer,
      nhoCount,
      nho: nhoCount,
      fstCount,
      fst: fstCount,
      pstCount,
      pst: pstCount,
      goLiveCount,
      goLive: goLiveCount,
      hiredCount,
      hiringRate,
      leadsToInterview: leadsToInterviewToGenerate,
      leadsToInterviewToGenerate,
    };
  });
}

function buildTotalsFromRows(rows = []) {
  const sum = rows.reduce(
    (acc, item) => {
      const metrics = item.planMetrics || getRowMetrics(item);

      acc.requiredHeadcount += metrics.requiredHeadcount;
      acc.actualHeadcount += metrics.actualHeadcount;
      acc.absenteeismSixWeeks += metrics.absenteeismSixWeeks;
      acc.attritionSixWeeks += metrics.attritionSixWeeks;

      acc.acceptedJobOffer += metrics.acceptedJobOffer;
      acc.nhoCount += metrics.nhoCount;
      acc.fstCount += metrics.fstCount;
      acc.pstCount += metrics.pstCount;
      acc.goLiveCount += metrics.goLiveCount;
      acc.hiredCount += metrics.hiredCount;

      return acc;
    },
    {
      requiredHeadcount: 0,
      actualHeadcount: 0,
      absenteeismSixWeeks: 0,
      attritionSixWeeks: 0,
      acceptedJobOffer: 0,
      nhoCount: 0,
      fstCount: 0,
      pstCount: 0,
      goLiveCount: 0,
      hiredCount: 0,
    },
  );

  const netActualHeadcount = Math.max(
    0,
    sum.actualHeadcount - sum.absenteeismSixWeeks - sum.attritionSixWeeks,
  );

  const bufferPercentage =
    sum.requiredHeadcount > 0
      ? ((netActualHeadcount - sum.requiredHeadcount) / sum.requiredHeadcount) *
        100
      : 0;

  const absenteeismRate =
    sum.actualHeadcount > 0 ? sum.absenteeismSixWeeks / sum.actualHeadcount : 0;

  const attritionRate =
    sum.actualHeadcount > 0 ? sum.attritionSixWeeks / sum.actualHeadcount : 0;

  const hiringNeeded = Math.max(0, sum.requiredHeadcount - netActualHeadcount);

  const hiringRate =
    sum.acceptedJobOffer > 0 ? sum.fstCount / sum.acceptedJobOffer : 0;

  const leadsToInterviewToGenerate =
    hiringNeeded <= 0
      ? 0
      : hiringRate > 0
        ? Math.ceil(hiringNeeded / hiringRate)
        : hiringNeeded;

  return {
    ...sum,
    netActualHeadcount,
    hiringNeeded,
    bufferPercentage,
    absenteeismRate,
    attritionRate,
    hiringRate,
    leadsToInterviewToGenerate,
  };
}

export default function WorkforceHiringAccountsTable({
  accountsLoading = false,
  filteredPlans = [],
  onViewPlan,
  basisWeeks = 6,
  forecastWeeks = 6,
}) {
  const workforceHiring = useWorkforceHiring(true);
  const { sourceWeek, selectedCluster, selectedAccount } =
    getForecastTableStateFromContext(workforceHiring);

  const weekStart = getWeekStart(sourceWeek);
  const weekEnd = getWeekEnd(sourceWeek);

  const [forecastData, setForecastData] = useState({
    response: {},
    loading: false,
    loaded: false,
    error: "",
  });

  const dragScrollRef = useRef(null);
  const mobileScrollRef = useRef(null);

  const isDraggingRef = useRef(false);
  const startXRef = useRef(0);
  const scrollLeftRef = useRef(0);
  const movedRef = useRef(false);

  const [isDragging, setIsDragging] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortConfig, setSortConfig] = useState({
    key: "cluster",
    direction: "asc",
  });

  useEffect(() => {
    let cancelled = false;

    async function loadForecastAverageRows() {
      if (!weekStart || !weekEnd) {
        setForecastData({
          response: {},
          loading: false,
          loaded: true,
          error: "Missing selected week date range for forecast averages.",
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
          cluster: normalizeRequestFilter(selectedCluster),
          account: normalizeRequestFilter(selectedAccount),
          weekStart,
          weekEnd,
          startDate: weekStart,
          endDate: weekEnd,
          basisWeeks,
          forecastWeeks,
        });

        if (cancelled) return;

        setForecastData({
          response: response || {},
          loading: false,
          loaded: true,
          error:
            response?.success === false
              ? response?.message || "Failed to load forecast average rows."
              : "",
        });
      } catch (error) {
        if (cancelled) return;

        setForecastData({
          response: {},
          loading: false,
          loaded: true,
          error:
            error?.response?.data?.message ||
            error?.response?.data?.error ||
            error?.message ||
            "Failed to load forecast average rows.",
        });
      }
    }

    loadForecastAverageRows();

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

  const sixWeekAverageForecastRows = useMemo(
    () => buildSixWeekAverageForecastRows(forecastData.response),
    [forecastData.response],
  );

  const computedPlans = useMemo(() => {
    const safePlans = Array.isArray(sixWeekAverageForecastRows)
      ? sixWeekAverageForecastRows
      : [];

    return safePlans.map((item) => ({
      ...item,
      planMetrics: getRowMetrics(item),
    }));
  }, [sixWeekAverageForecastRows]);

  const visibleRows = useMemo(() => {
    const cleanSearch = searchQuery.trim().toLowerCase();

    const filteredRows = cleanSearch
      ? computedPlans.filter((item) => {
          const metrics = item.planMetrics || getRowMetrics(item);

          const searchableText = [
            item.id,
            item.week,
            item.account,
            item.accountName,
            item.cluster,
            item.clusterName,
            metrics.requiredHeadcount,
            metrics.actualHeadcount,
            formatSignedPercentWhole(metrics.bufferPercentage),
            metrics.absenteeismSixWeeks,
            formatPercent(metrics.absenteeismRate),
            metrics.attritionSixWeeks,
            formatPercent(metrics.attritionRate),
            metrics.netActualHeadcount,
            metrics.hiringNeeded,
            metrics.acceptedJobOffer,
            metrics.nhoCount,
            metrics.fstCount,
            metrics.pstCount,
            metrics.goLiveCount,
            metrics.hiredCount,
            formatPercent(metrics.hiringRate),
            metrics.leadsToInterviewToGenerate,
          ]
            .filter((value) => value !== undefined && value !== null)
            .join(" ")
            .toLowerCase();

          return searchableText.includes(cleanSearch);
        })
      : computedPlans;

    return [...filteredRows].sort((firstRow, secondRow) => {
      const firstValue = getSortableText(firstRow, sortConfig.key);
      const secondValue = getSortableText(secondRow, sortConfig.key);

      const comparison = firstValue.localeCompare(secondValue, undefined, {
        numeric: true,
        sensitivity: "base",
      });

      return sortConfig.direction === "asc" ? comparison : -comparison;
    });
  }, [computedPlans, searchQuery, sortConfig.direction, sortConfig.key]);

  const totals = useMemo(() => buildTotalsFromRows(visibleRows), [visibleRows]);

  const legacyFilteredPlanCount = Array.isArray(filteredPlans)
    ? filteredPlans.length
    : 0;

  const combinedLoading = Boolean(accountsLoading || forecastData.loading);

  useEffect(() => {
    if (dragScrollRef.current) {
      dragScrollRef.current.scrollTo({ left: 0, behavior: "smooth" });
    }

    if (mobileScrollRef.current) {
      mobileScrollRef.current.scrollTo({ top: 0, behavior: "smooth" });
    }
  }, [searchQuery, sortConfig.direction, sortConfig.key]);

  function handleSort(nextKey) {
    setSortConfig((current) => {
      if (current.key === nextKey) {
        return {
          key: nextKey,
          direction: current.direction === "asc" ? "desc" : "asc",
        };
      }

      return {
        key: nextKey,
        direction: "asc",
      };
    });
  }

  function handleDragStart(event) {
    const target = event.target;
    const isInteractiveElement = target.closest(
      "button, a, input, select, textarea, [data-no-table-drag='true']",
    );

    if (isInteractiveElement) return;

    const container = dragScrollRef.current;

    if (!container) return;

    isDraggingRef.current = true;
    movedRef.current = false;
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
    const walk = x - startXRef.current;

    if (Math.abs(walk) > 4) {
      movedRef.current = true;
    }

    container.scrollLeft = scrollLeftRef.current - walk;
  }

  function handleDragEnd() {
    const container = dragScrollRef.current;

    isDraggingRef.current = false;
    setIsDragging(false);

    if (container) {
      container.style.userSelect = "";
    }

    window.setTimeout(() => {
      movedRef.current = false;
    }, 0);
  }

  function handleTouchStart(event) {
    const container = dragScrollRef.current;

    if (!container) return;

    const touch = event.touches?.[0];

    if (!touch) return;

    isDraggingRef.current = true;
    movedRef.current = false;
    setIsDragging(true);

    startXRef.current = touch.pageX - container.offsetLeft;
    scrollLeftRef.current = container.scrollLeft;
  }

  function handleTouchMove(event) {
    const container = dragScrollRef.current;

    if (!container || !isDraggingRef.current) return;

    const touch = event.touches?.[0];

    if (!touch) return;

    const x = touch.pageX - container.offsetLeft;
    const walk = x - startXRef.current;

    if (Math.abs(walk) > 4) {
      movedRef.current = true;
    }

    container.scrollLeft = scrollLeftRef.current - walk;
  }

  function handleRowClick(item) {
    if (movedRef.current) return;
    onViewPlan?.(item);
  }

  function handleRowKeyDown(event, item) {
    if (event.key !== "Enter" && event.key !== " ") return;

    event.preventDefault();
    handleRowClick(item);
  }

  function renderDesktopRow(item, index) {
    const metrics = item.planMetrics || getRowMetrics(item);

    return (
      <tr
        key={item.id || `${item.cluster}-${item.account}-${index}`}
        role="button"
        tabIndex={0}
        onClick={() => handleRowClick(item)}
        onKeyDown={(event) => handleRowKeyDown(event, item)}
        className={[
          index % 2 === 0 ? "bg-white" : "bg-slate-50/50",
          "cursor-pointer transition hover:bg-blue-50/50 focus:bg-blue-50/50 focus:outline-none",
        ].join(" ")}
      >
        <BodyTd className="text-left font-semibold text-sibs-primary-90">
          {item.cluster || item.clusterName || "--"}
        </BodyTd>

        <BodyTd className="text-left font-semibold">
          <p className="max-w-[150px] truncate">
            {item.account || item.accountName || "--"}
          </p>
        </BodyTd>

        <BodyTd>{formatNumber(metrics.requiredHeadcount)}</BodyTd>
        <BodyTd>{formatNumber(metrics.actualHeadcount)}</BodyTd>

        <BodyTd className={getSignedNumberClass(metrics.bufferPercentage)}>
          {formatSignedPercentWhole(metrics.bufferPercentage)}
        </BodyTd>

        <BodyTd>{formatNumber(metrics.absenteeismSixWeeks)}</BodyTd>

        <BodyTd className="text-blue-600">
          {formatPercent(metrics.absenteeismRate)}
        </BodyTd>

        <BodyTd>{formatNumber(metrics.attritionSixWeeks)}</BodyTd>

        <BodyTd className="text-red-600">
          {formatPercent(metrics.attritionRate)}
        </BodyTd>

        <BodyTd>{formatNumber(metrics.netActualHeadcount)}</BodyTd>

        <BodyTd
          className={
            metrics.hiringNeeded > 0 ? "text-red-600" : "text-emerald-600"
          }
        >
          {formatNumber(metrics.hiringNeeded)}
        </BodyTd>

        <BodyTd>{formatNumber(metrics.acceptedJobOffer)}</BodyTd>
        <BodyTd>{formatNumber(metrics.nhoCount)}</BodyTd>
        <BodyTd>{formatNumber(metrics.fstCount)}</BodyTd>
        <BodyTd>{formatNumber(metrics.pstCount)}</BodyTd>

        <BodyTd className="text-emerald-600">
          {formatNumber(metrics.goLiveCount)}
        </BodyTd>

        <BodyTd className="text-emerald-600">
          {formatNumber(metrics.hiredCount)}
        </BodyTd>

        <BodyTd>{formatPercent(metrics.hiringRate)}</BodyTd>

        <BodyTd className="text-violet-600">
          {formatNumber(metrics.leadsToInterviewToGenerate)}
        </BodyTd>
      </tr>
    );
  }

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="mb-3 border-b border-slate-200 pb-3">
        <div className="flex flex-col gap-3 xl:flex-row xl:items-start xl:justify-between">
          <div className="min-w-0 pt-1">
            <div className="flex flex-wrap items-center gap-3">
              <h2 className="text-base font-extrabold uppercase leading-tight tracking-tight text-sibs-primary-90">
                Details by Cluster / Account (6-Week Forecast Average Plan)
              </h2>

              <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-500">
                {computedPlans.length > 0
                  ? `${visibleRows.length} of ${computedPlans.length} average forecast rows`
                  : forecastData.loaded
                    ? "No forecast rows"
                    : `${legacyFilteredPlanCount} source rows`}
              </span>
            </div>

            <p className="mt-1 text-xs font-semibold text-slate-500">
              Account-level average forecast data across all 6 forecast weeks.
            </p>
          </div>

          <div className="w-full xl:w-[520px]">
            <div className="relative">
              <Search
                size={20}
                className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-sibs-primary-70"
                strokeWidth={2.25}
              />

              <input
                type="text"
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                placeholder="Search cluster or account then press Enter..."
                className="h-12 w-full rounded-xl border border-[#D0D5DD] bg-white px-12 pr-24 text-sm font-semibold text-sibs-primary-90 outline-none transition placeholder:text-slate-400 hover:border-sibs-primary-1/40 focus:border-sibs-primary-1 focus:ring-4 focus:ring-sibs-primary-1/10"
              />

              {searchQuery ? (
                <button
                  type="button"
                  data-no-table-drag="true"
                  onClick={() => setSearchQuery("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg px-3 py-1.5 text-xs font-extrabold text-slate-500 transition hover:bg-slate-100 hover:text-sibs-primary-90"
                >
                  Clear
                </button>
              ) : null}
            </div>
          </div>
        </div>
      </div>

      {forecastData.error ? (
        <div className="mb-3 rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm font-semibold text-red-600">
          {forecastData.error}
        </div>
      ) : null}

      <div className="hidden overflow-hidden rounded-xl border border-slate-200 bg-white lg:block">
        <div
          ref={dragScrollRef}
          className={[
            "max-h-[760px] overflow-auto sibs-scrollbar",
            isDragging ? "cursor-grabbing" : "cursor-pointer",
          ].join(" ")}
          onMouseDown={handleDragStart}
          onMouseMove={handleDragMove}
          onMouseUp={handleDragEnd}
          onMouseLeave={handleDragEnd}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleDragEnd}
        >
          <table className="w-full min-w-[1760px] border-collapse">
            <ColumnGroup />

            <thead>
              <tr>
                <HeaderTh rowSpan={2}>
                  <SortHeaderButton
                    label="Cluster"
                    active={sortConfig.key === "cluster"}
                    direction={sortConfig.direction}
                    onClick={() => handleSort("cluster")}
                  />
                </HeaderTh>

                <HeaderTh rowSpan={2}>
                  <SortHeaderButton
                    label="Account"
                    active={sortConfig.key === "account"}
                    direction={sortConfig.direction}
                    onClick={() => handleSort("account")}
                  />
                </HeaderTh>

                <HeaderTh rowSpan={2}>
                  Required
                  <br />
                  Headcount
                </HeaderTh>

                <HeaderTh rowSpan={2}>
                  Actual
                  <br />
                  Headcount
                </HeaderTh>

                <HeaderTh rowSpan={2}>
                  Buffer
                  <br />
                  Percentage
                </HeaderTh>

                <HeaderTh rowSpan={2}>
                  Absenteeism
                  <br />
                  Count
                </HeaderTh>

                <HeaderTh rowSpan={2}>
                  Absenteeism
                  <br />%
                </HeaderTh>

                <HeaderTh rowSpan={2}>
                  Attrition
                  <br />
                  Count
                </HeaderTh>

                <HeaderTh rowSpan={2}>
                  Attrition
                  <br />%
                </HeaderTh>

                <HeaderTh rowSpan={2}>
                  Net Actual
                  <br />
                  HC
                </HeaderTh>

                <HeaderTh rowSpan={2}>
                  Hiring
                  <br />
                  Needed
                </HeaderTh>

                <HeaderTh colSpan={5} group>
                  Pipeline Plan (Candidates)
                </HeaderTh>

                <HeaderTh rowSpan={2}>
                  Hired
                  <br />
                  Count
                </HeaderTh>

                <HeaderTh rowSpan={2}>
                  Hiring Rate
                  <br />
                  (Leads to JO)
                </HeaderTh>

                <HeaderTh rowSpan={2}>
                  Leads to Interview
                  <br />
                  (To Generate)
                </HeaderTh>
              </tr>

              <tr>
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

                <HeaderTh>
                  Go
                  <br />
                  Live
                </HeaderTh>
              </tr>
            </thead>

            <tbody>
              {combinedLoading ? (
                Array.from({ length: 10 }).map((_, index) => (
                  <tr key={index}>
                    <BodyTd className="py-2" colSpan={19}>
                      <div className="h-5 w-full animate-sibs-pulse rounded bg-slate-200" />
                    </BodyTd>
                  </tr>
                ))
              ) : visibleRows.length === 0 ? (
                <tr>
                  <BodyTd
                    className="py-12 text-center text-sm font-bold text-slate-500"
                    colSpan={19}
                  >
                    No workforce hiring plan records found.
                  </BodyTd>
                </tr>
              ) : (
                visibleRows.map(renderDesktopRow)
              )}
            </tbody>

            {!combinedLoading && visibleRows.length > 0 ? (
              <tfoot>
                <tr className="bg-slate-50 font-extrabold">
                  <BodyTd className="text-left font-extrabold" colSpan={2}>
                    TOTAL / AVG.
                  </BodyTd>
                  <BodyTd
                    className="text-left font-extrabold"
                    colSpan={2}
                  ></BodyTd>
                  <BodyTd>{formatNumber(totals.requiredHeadcount)}</BodyTd>
                  <BodyTd>{formatNumber(totals.actualHeadcount)}</BodyTd>
                  <BodyTd
                    className={getSignedNumberClass(totals.bufferPercentage)}
                  >
                    {formatSignedPercentWhole(totals.bufferPercentage)}
                  </BodyTd>
                  <BodyTd>{formatNumber(totals.absenteeismSixWeeks)}</BodyTd>
                  <BodyTd className="text-blue-600">
                    {formatPercent(totals.absenteeismRate)}
                  </BodyTd>
                  <BodyTd>{formatNumber(totals.attritionSixWeeks)}</BodyTd>
                  <BodyTd className="text-red-600">
                    {formatPercent(totals.attritionRate)}
                  </BodyTd>
                  <BodyTd>{formatNumber(totals.netActualHeadcount)}</BodyTd>
                  <BodyTd
                    className={
                      totals.hiringNeeded > 0
                        ? "text-red-600"
                        : "text-emerald-600"
                    }
                  >
                    {formatNumber(totals.hiringNeeded)}
                  </BodyTd>
                  <BodyTd>{formatNumber(totals.acceptedJobOffer)}</BodyTd>
                  <BodyTd>{formatNumber(totals.nhoCount)}</BodyTd>
                  <BodyTd>{formatNumber(totals.fstCount)}</BodyTd>
                  <BodyTd>{formatNumber(totals.pstCount)}</BodyTd>
                  <BodyTd className="text-emerald-600">
                    {formatNumber(totals.goLiveCount)}
                  </BodyTd>
                  <BodyTd className="text-emerald-600">
                    {formatNumber(totals.hiredCount)}
                  </BodyTd>
                  <BodyTd>{formatPercent(totals.hiringRate)}</BodyTd>
                  <BodyTd className="text-violet-600">
                    {formatNumber(totals.leadsToInterviewToGenerate)}
                  </BodyTd>
                </tr>
              </tfoot>
            ) : null}
          </table>
        </div>
      </div>

      <div ref={mobileScrollRef} className="space-y-3 lg:hidden">
        {combinedLoading ? (
          Array.from({ length: 4 }).map((_, index) => (
            <div
              key={index}
              className="h-36 animate-sibs-pulse rounded-2xl bg-gray-200"
            />
          ))
        ) : visibleRows.length === 0 ? (
          <div className="rounded-2xl border border-slate-200 bg-slate-50 px-5 py-12 text-center text-sm font-bold text-slate-500">
            No workforce hiring plan records found.
          </div>
        ) : (
          visibleRows.map((item) => {
            const metrics = item.planMetrics || getRowMetrics(item);

            return (
              <button
                key={item.id || `${item.cluster}-${item.account}`}
                type="button"
                onClick={() => handleRowClick(item)}
                className="block w-full rounded-2xl border border-slate-200 bg-white p-4 text-left shadow-sm transition hover:border-blue-200 hover:bg-slate-50"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-extrabold text-sibs-primary-90">
                      {item.account || item.accountName || "--"}
                    </p>
                    <p className="mt-1 truncate text-xs font-semibold text-slate-500">
                      {item.cluster || item.clusterName || "--"}
                    </p>
                  </div>
                  <p className="shrink-0 rounded-full border border-blue-100 bg-blue-50 px-3 py-1 text-xs font-extrabold text-sibs-primary-1">
                    {formatNumber(metrics.hiringNeeded)} needed
                  </p>
                </div>

                <div className="mt-4 grid grid-cols-2 gap-3">
                  <MobileMetric
                    label="Required HC"
                    value={formatNumber(metrics.requiredHeadcount)}
                  />
                  <MobileMetric
                    label="Actual HC"
                    value={formatNumber(metrics.actualHeadcount)}
                  />
                  <MobileMetric
                    label="Buffer Percentage"
                    value={formatSignedPercentWhole(metrics.bufferPercentage)}
                    valueClassName={getSignedNumberClass(
                      metrics.bufferPercentage,
                    )}
                  />
                  <MobileMetric
                    label="Absenteeism Count"
                    value={formatNumber(metrics.absenteeismSixWeeks)}
                  />
                  <MobileMetric
                    label="Absenteeism %"
                    value={formatPercent(metrics.absenteeismRate)}
                    valueClassName="text-blue-600"
                  />
                  <MobileMetric
                    label="Attrition Count"
                    value={formatNumber(metrics.attritionSixWeeks)}
                  />
                  <MobileMetric
                    label="Attrition %"
                    value={formatPercent(metrics.attritionRate)}
                    valueClassName="text-red-600"
                  />
                  <MobileMetric
                    label="Net Actual HC"
                    value={formatNumber(metrics.netActualHeadcount)}
                  />
                  <MobileMetric
                    label="Accepted Job Offer"
                    value={formatNumber(metrics.acceptedJobOffer)}
                  />
                  <MobileMetric
                    label="NHO / FST / PST"
                    value={`${formatNumber(metrics.nhoCount)} / ${formatNumber(metrics.fstCount)} / ${formatNumber(metrics.pstCount)}`}
                  />
                  <MobileMetric
                    label="Go Live"
                    value={formatNumber(metrics.goLiveCount)}
                    valueClassName="text-emerald-600"
                  />
                  <MobileMetric
                    label="Leads to Interview"
                    value={formatNumber(metrics.leadsToInterviewToGenerate)}
                    valueClassName="text-violet-600"
                  />
                </div>
              </button>
            );
          })
        )}
      </div>
    </section>
  );
}

function MobileMetric({
  label,
  value,
  valueClassName = "text-sibs-primary-1",
}) {
  return (
    <div className="rounded-xl bg-slate-50 p-3">
      <p className="text-[10px] font-bold uppercase tracking-wide text-slate-500">
        {label}
      </p>
      <p className={`mt-1 text-sm font-extrabold ${valueClassName}`}>{value}</p>
    </div>
  );
}
