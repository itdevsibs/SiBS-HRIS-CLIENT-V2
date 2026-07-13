import { WEEKLY_CLUSTER_OPTIONS } from "../../lib/utils/workforceHiringPlan/workforceHiringPlanConstants";
import { useWorkforceHiring } from "./WorkforceHiringContext";

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
  leadsToInterview: 0,
};

const TREND_WEEKS = ["Wk -5", "Wk -4", "Wk -3", "Wk -2", "Wk -1", "Wk 0"];

function cleanNumber(value) {
  const numberValue = Number(value || 0);
  return Number.isFinite(numberValue) ? numberValue : 0;
}

function cleanArray(value) {
  return Array.isArray(value) ? value : [];
}

function sumRows(rows, key) {
  return rows.reduce((total, row) => total + cleanNumber(row[key]), 0);
}

function getAveragePercent(numerator, denominator) {
  return denominator ? (numerator / denominator) * 100 : 0;
}

function normalizeSelectedPlanValues(values = [], allValue, overviewAllValue) {
  const cleanValues = cleanArray(values);

  if (!cleanValues.length || cleanValues.includes(allValue)) {
    return overviewAllValue;
  }

  return cleanValues;
}

function normalizeOverviewValues(values, planAllValue) {
  if (!Array.isArray(values)) {
    if (!values || values === "All Clusters" || values === "All Accounts") {
      return [planAllValue];
    }

    return [values];
  }

  if (!values.length) return [planAllValue];

  if (
    values.includes("All Clusters") ||
    values.includes("All Accounts") ||
    values.includes(planAllValue)
  ) {
    return [planAllValue];
  }

  return values;
}

function buildDetailRows(plans = []) {
  return plans.map((row) => {
    const requiredHeadcount = cleanNumber(
      row.requiredHeadcount ?? row.required_headcount,
    );

    const actualHeadcount = cleanNumber(
      row.actualHeadcount ?? row.actual_headcount,
    );

    /*
      Selected-week absenteeism only.
      Do not use absenteeismTrend or absenteeismSixWeeks for KPI cards.
    */
    const scheduledDays = cleanNumber(row.scheduledDays ?? row.scheduled_days);

    const scheduledCount = cleanNumber(
      row.scheduledCount ?? row.scheduled_count,
    );

    const currentWeekAbsenteeismCount = cleanNumber(
      row.currentWeekAbsenteeismCount ??
        row.current_week_absenteeism_count ??
        row.absenteeismCurrentWeekCount ??
        row.absenteeism_current_week_count ??
        row.absenteeismCount ??
        row.absenteeism_count,
    );

    const averageAbsentHeadcount =
      scheduledDays > 0
        ? currentWeekAbsenteeismCount / scheduledDays
        : cleanNumber(
            row.averageAbsentHeadcount ?? row.average_absent_headcount,
          );

    const roundedAverageAbsentHeadcount = Math.round(averageAbsentHeadcount);

    const absenteeismPercentage =
      actualHeadcount > 0
        ? (roundedAverageAbsentHeadcount / actualHeadcount) * 100
        : 0;

    const attrition = cleanNumber(
      row.attritionPastCount ??
        row.attrition_past_count ??
        row.attritionCount ??
        row.attrition_count,
    );

    /*
      Keep this based on the raw averageAbsentHeadcount to avoid losing
      decimal precision before final totals.
    */
    const netActualHc = actualHeadcount - averageAbsentHeadcount - attrition;

    const hiringNeeded = Math.max(0, requiredHeadcount - netActualHc);

    const acceptedJo = cleanNumber(
      row.interviewCount ??
        row.interview_count ??
        row.interviewPopulationCount ??
        row.interview_population_count,
    );

    const nho = cleanNumber(row.nhoCount ?? row.nho_count);
    const fst = cleanNumber(row.fstCount ?? row.fst_count);
    const pst = cleanNumber(row.pstCount ?? row.pst_count);

    const goLive = cleanNumber(
      row.projectedToBeEndorsed ??
        row.projected_to_be_endorsed ??
        row.projectedEndorsed ??
        row.projected_endorsed,
    );

    const leadsToInterview = cleanNumber(
      row.leadsToInterview ?? row.leads_to_interview,
    );

    return {
      cluster: row.cluster || row.clusterName || "",
      account: row.account || row.accountName || "",

      requiredHeadcount,
      actualHeadcount,

      bufferPercentage:
        requiredHeadcount > 0
          ? ((netActualHc - requiredHeadcount) / requiredHeadcount) * 100
          : 0,

      /*
        KPI absenteeism:
        - absenteeism = rounded current selected week average absent headcount
        - absenteeismPercentage = absenteeism / actual headcount
      */
      absenteeism: roundedAverageAbsentHeadcount,
      absenteeismPercentage,

      currentWeekAbsenteeismCount,
      scheduledCount,
      scheduledDays,

      attrition,
      attritionPercentage: cleanNumber(
        row.attritionPastPercent ?? row.attrition_past_percent,
      ),

      netActualHc,
      hiringNeeded,

      acceptedJo,
      nho,
      fst,
      pst,
      goLive,

      joNhoCount: cleanNumber(
        row.attritionInterviewToNhoCount ??
          row.attrition_interview_to_nho_count,
      ),
      joNhoPercentage: cleanNumber(
        row.attritionInterviewToNhoPercent ??
          row.attrition_interview_to_nho_percent,
      ),

      nhoFstCount: cleanNumber(
        row.attritionNhoToFstPstCount ?? row.attrition_nho_to_fst_pst_count,
      ),
      nhoFstPercentage: cleanNumber(
        row.attritionNhoToFstPstPercent ?? row.attrition_nho_to_fst_pst_percent,
      ),

      fstPstCount: cleanNumber(
        row.attritionFstToPstCount ?? row.attrition_fst_to_pst_count,
      ),
      fstPstPercentage: cleanNumber(
        row.attritionFstToPstPercent ?? row.attrition_fst_to_pst_percent,
      ),

      nhoPstCount: 0,
      nhoPstPercentage: 0,

      pstGoLiveCount: 0,
      pstGoLivePercentage: 0,

      hiredCount: cleanNumber(row.hiredCount ?? row.hired_count),

      hiringRate: cleanNumber(row.hiringRate ?? row.hiring_rate) * 100,

      leadsToInterview,

      /*
        Trends are only for charts/history.
        The real 6-week chart should now come from /accounts/trends.
      */
      absenteeismTrend: cleanArray(
        row.absenteeismTrend ??
          row.absenteeism_trend ??
          row.absenteeismWeeklyCounts ??
          row.absenteeism_weekly_counts,
      ),

      attritionTrend: cleanArray(
        row.attritionTrend ??
          row.attrition_trend ??
          row.attritionWeeklyCounts ??
          row.attrition_weekly_counts,
      ),
    };
  });
}

function buildTotals(detailRows = []) {
  const requiredHeadcount = sumRows(detailRows, "requiredHeadcount");
  const actualHeadcount = sumRows(detailRows, "actualHeadcount");

  /*
    Absenteeism follows your Excel logic:
    Absenteeism = rounded average absent headcount.
  */
  const absenteeism = sumRows(detailRows, "absenteeism");

  const attrition = sumRows(detailRows, "attrition");

  const acceptedJo = sumRows(detailRows, "acceptedJo");
  const nho = sumRows(detailRows, "nho");
  const fst = sumRows(detailRows, "fst");
  const pst = sumRows(detailRows, "pst");
  const leadsToInterview = sumRows(detailRows, "leadsToInterview");

  /*
    Excel formula:
    Net Actual HC = Actual Headcount - Absenteeism - Attrition
  */
  const netActualHc = actualHeadcount - absenteeism - attrition;

  /*
    Excel formula:
    Hiring Needed = MAX(0, Required Headcount - Net Actual HC)
  */
  const hiringNeeded = Math.max(0, requiredHeadcount - netActualHc);

  /*
    Excel formula:
    Buffer Percentage =
    (Net Actual HC - Required Headcount) / Required Headcount
  */
  const bufferPercentage = getAveragePercent(
    netActualHc - requiredHeadcount,
    requiredHeadcount,
  );

  return {
    cluster: "TOTAL / AVERAGE",
    account: "",

    requiredHeadcount,
    actualHeadcount,

    bufferPercentage,

    absenteeism,
    absenteeismPercentage: getAveragePercent(absenteeism, actualHeadcount),

    attrition,
    attritionPercentage: getAveragePercent(attrition, actualHeadcount),

    netActualHc,
    hiringNeeded,

    acceptedJo,
    nho,
    fst,
    pst,

    goLive: sumRows(detailRows, "goLive"),

    joNhoCount: sumRows(detailRows, "joNhoCount"),
    joNhoPercentage: getAveragePercent(
      sumRows(detailRows, "joNhoCount"),
      acceptedJo,
    ),

    nhoFstCount: sumRows(detailRows, "nhoFstCount"),
    nhoFstPercentage: getAveragePercent(
      sumRows(detailRows, "nhoFstCount"),
      nho,
    ),

    fstPstCount: sumRows(detailRows, "fstPstCount"),
    fstPstPercentage: getAveragePercent(
      sumRows(detailRows, "fstPstCount"),
      fst,
    ),

    nhoPstCount: sumRows(detailRows, "nhoPstCount"),
    nhoPstPercentage: getAveragePercent(
      sumRows(detailRows, "nhoPstCount"),
      nho,
    ),

    pstGoLiveCount: sumRows(detailRows, "pstGoLiveCount"),
    pstGoLivePercentage: getAveragePercent(
      sumRows(detailRows, "pstGoLiveCount"),
      pst,
    ),

    hiredCount: sumRows(detailRows, "hiredCount"),

    hiringRate: getAveragePercent(
      sumRows(detailRows, "hiredCount"),
      leadsToInterview,
    ),

    leadsToInterview,
  };
}

function buildPipeline(totals) {
  return [
    {
      stage: "Accepted Job Offer",
      short: "Accepted Job Offer",
      count: totals.acceptedJo,
      stepConversion: null,
      cumulative: totals.hiringRate,
      color: "#1f5a9d",
      text: "text-[#1f5a9d]",
      iconKey: "handshake",
    },
    {
      stage: "NHO",
      short: "NHO Count",
      count: totals.nho,
      stepConversion: getAveragePercent(totals.nho, totals.acceptedJo),
      cumulative: getAveragePercent(totals.nho, totals.leadsToInterview),
      color: "#6c55a3",
      text: "text-[#6c55a3]",
      iconKey: "fileText",
    },
    {
      stage: "FST",
      short: "FST Count",
      count: totals.fst,
      stepConversion: getAveragePercent(totals.fst, totals.nho),
      cumulative: getAveragePercent(totals.fst, totals.leadsToInterview),
      color: "#0d9298",
      text: "text-[#0d9298]",
      iconKey: "users",
    },
    {
      stage: "PST",
      short: "PST Count",
      count: totals.pst,
      stepConversion: getAveragePercent(totals.pst, totals.fst),
      cumulative: getAveragePercent(totals.pst, totals.leadsToInterview),
      color: "#f5820b",
      text: "text-[#f5820b]",
      iconKey: "laptop",
    },
    {
      stage: "Go Live",
      short: "Go Live",
      count: totals.goLive,
      stepConversion: getAveragePercent(totals.goLive, totals.pst),
      cumulative: getAveragePercent(totals.goLive, totals.leadsToInterview),
      color: "#4c9a2a",
      text: "text-[#4c9a2a]",
      iconKey: "rocket",
    },
  ];
}

function buildAttritionStages(totals) {
  return [
    ["Accepted JO -> NHO", totals.joNhoCount, totals.joNhoPercentage],
    ["NHO -> FST", totals.nhoFstCount, totals.nhoFstPercentage],
    ["FST -> PST", totals.fstPstCount, totals.fstPstPercentage],
    ["NHO -> PST", totals.nhoPstCount, totals.nhoPstPercentage],
    ["PST -> Go Live", totals.pstGoLiveCount, totals.pstGoLivePercentage],
  ].map(([fromTo, count, percentage]) => ({
    fromTo,
    count,
    percentage,
    width: `${Math.min(Math.max(percentage * 2.4, 0), 100)}%`,
  }));
}

/*
  Fallback trend builder.

  This only runs when /accounts/trends data is not available yet.
  The old code returned buffer: [0, 0, 0, 0, 0, 0].
  That caused the green Buffer % line to stay at 0.0%.
*/
function buildTrends(detailRows = []) {
  const averageSeries = (key) =>
    TREND_WEEKS.map((_, index) => {
      const values = detailRows
        .map((row) => cleanNumber(row[key]?.[index]))
        .filter((value) => value !== 0);

      if (!values.length) return 0;

      return values.reduce((total, value) => total + value, 0) / values.length;
    });

  const bufferFallbackValue =
    detailRows.length > 0
      ? detailRows.reduce(
          (total, row) => total + cleanNumber(row.bufferPercentage),
          0,
        ) / detailRows.length
      : 0;

  return {
    absenteeism: averageSeries("absenteeismTrend"),
    attrition: averageSeries("attritionTrend"),
    buffer: TREND_WEEKS.map(() => bufferFallbackValue),
  };
}

function buildTrendWeeksFromEndpoint(trendData) {
  if (Array.isArray(trendData?.labels) && trendData.labels.length > 0) {
    return trendData.labels;
  }

  if (Array.isArray(trendData?.data) && trendData.data.length > 0) {
    return trendData.data.map((item) => item.label);
  }

  return ["Wk -5", "Wk -4", "Wk -3", "Wk -2", "Wk -1", "Wk 0"];
}

function buildTrendsFromEndpoint(trendData) {
  const absenteeism = trendData?.trends?.absenteeism;
  const attrition = trendData?.trends?.attrition;
  const buffer = trendData?.trends?.buffer;

  const hasEndpointTrends =
    Array.isArray(absenteeism) &&
    Array.isArray(attrition) &&
    Array.isArray(buffer);

  if (!hasEndpointTrends) {
    return null;
  }

  return {
    absenteeism: absenteeism.map(cleanNumber),
    attrition: attrition.map(cleanNumber),
    buffer: buffer.map(cleanNumber),
  };
}

function buildTrendSummaryFromEndpoint(trendData, fallbackSummary = {}) {
  const averages = trendData?.averages || trendData?.totals;

  if (!averages) {
    return {
      absenteeism: cleanNumber(fallbackSummary.absenteeism),
      absenteeismPercentage: cleanNumber(fallbackSummary.absenteeismPercentage),

      attrition: cleanNumber(fallbackSummary.attrition),
      attritionPercentage: cleanNumber(fallbackSummary.attritionPercentage),

      bufferPercentage: cleanNumber(fallbackSummary.bufferPercentage),
    };
  }

  return {
    absenteeism: cleanNumber(averages.absenteeism),
    absenteeismPercentage: cleanNumber(averages.absenteeismPercentage),

    attrition: cleanNumber(averages.attrition),
    attritionPercentage: cleanNumber(averages.attritionPercentage),

    bufferPercentage: cleanNumber(averages.bufferPercentage),
  };
}

function buildSummary(totals) {
  return {
    ...EMPTY_SUMMARY,
    requiredHeadcount: totals.requiredHeadcount,
    actualHeadcount: totals.actualHeadcount,
    bufferPercentage: totals.bufferPercentage,
    absenteeism: totals.absenteeism,
    absenteeismPercentage: totals.absenteeismPercentage,
    attrition: totals.attrition,
    attritionPercentage: totals.attritionPercentage,
    netActualHc: totals.netActualHc,
    hiringNeeded: totals.hiringNeeded,
    hiringRate: totals.hiringRate,
    hiredCount: totals.hiredCount,
    leadsToInterview: totals.leadsToInterview,
  };
}

function isAllSelected(values = []) {
  const cleanValues = Array.isArray(values) ? values : [values];

  return (
    !cleanValues.length ||
    cleanValues.includes("All") ||
    cleanValues.includes("All Clusters") ||
    cleanValues.includes("All Accounts")
  );
}

function filterPlansBySelectedFilters(plans = [], weeklyVersion = {}) {
  const selectedClusters = Array.isArray(weeklyVersion.selectedClusters)
    ? weeklyVersion.selectedClusters
    : [];

  const selectedAccounts = Array.isArray(weeklyVersion.selectedAccounts)
    ? weeklyVersion.selectedAccounts
    : [];

  return (plans || []).filter((row) => {
    const rowCluster = String(row.cluster || row.clusterName || "")
      .trim()
      .toLowerCase();

    const rowAccount = String(row.account || row.accountName || "")
      .trim()
      .toLowerCase();

    const clusterAllowed =
      isAllSelected(selectedClusters) ||
      selectedClusters.some(
        (cluster) =>
          String(cluster || "")
            .trim()
            .toLowerCase() === rowCluster,
      );

    const accountAllowed =
      isAllSelected(selectedAccounts) ||
      selectedAccounts.some(
        (account) =>
          String(account || "")
            .trim()
            .toLowerCase() === rowAccount,
      );

    return clusterAllowed && accountAllowed;
  });
}

export function useWorkforceHiringView(optional = false) {
  const plan = useWorkforceHiring(optional);

  const weeklyVersion = plan?.weeklyVersion || {};
  const tables = plan?.tables || {};

  const detailRows = buildDetailRows(tables.filteredPlans || []);
  const totals = buildTotals(detailRows);

  const summary = buildSummary(totals);

  const endpointTrends = buildTrendsFromEndpoint(tables.trendData);
  const endpointTrendWeeks = buildTrendWeeksFromEndpoint(tables.trendData);
  const trendSummary = buildTrendSummaryFromEndpoint(tables.trendData, summary);

  return {
    filters: {
      weeklyVersion: weeklyVersion.activeWeekId || "",
      cluster: normalizeSelectedPlanValues(
        weeklyVersion.selectedClusters,
        "All",
        "All Clusters",
      ),
      account: normalizeSelectedPlanValues(
        weeklyVersion.selectedAccounts,
        "All",
        "All Accounts",
      ),
      setWeeklyVersion: weeklyVersion.setActiveWeekId || (() => {}),
      setCluster: (nextValue) => {
        weeklyVersion.setSelectedClusters?.(
          normalizeOverviewValues(nextValue, "All"),
        );
      },
      setAccount: (nextValue) => {
        weeklyVersion.setSelectedAccounts?.(
          normalizeOverviewValues(nextValue, "All"),
        );
      },
      options: {
        weeklyVersions: weeklyVersion.filteredWeeklyVersions || [],
        clusters: WEEKLY_CLUSTER_OPTIONS,
        accounts: (weeklyVersion.filteredAccountOptions || [])
          .map((account) => account?.accountName || account?.account || "")
          .filter(Boolean),
      },
      selectedWeek: weeklyVersion.activeWeek || null,
      startDate: weeklyVersion.activeWeek?.startDate || "",
      endDate: weeklyVersion.activeWeek?.endDate || "",
    },

    overview: {
      summary,
      trendSummary,

      pipeline: buildPipeline(totals),
      attritionStages: buildAttritionStages(totals),

      trendWeeks: endpointTrendWeeks,
      trends: endpointTrends || buildTrends(detailRows),

      trendsLoading: Boolean(tables.trendsLoading),
      trendsError: tables.trendsError || "",
    },

    detailTable: {
      detailRows,
      totals,
    },

    status: {
      isLoading: Boolean(
        weeklyVersion.weeksLoading ||
        weeklyVersion.accountsLoading ||
        tables.trendsLoading,
      ),
      isLoadingWeeks: Boolean(weeklyVersion.weeksLoading),
      isLoadingFilters: false,
      isLoadingAccounts: Boolean(weeklyVersion.accountsLoading),
      isLoadingTrends: Boolean(tables.trendsLoading),
      error: "",
      refetch: () => {},
    },
  };
}

export default null;
