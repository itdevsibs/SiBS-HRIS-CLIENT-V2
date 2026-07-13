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
  const parsed = Number(value || 0);
  return Number.isFinite(parsed) ? parsed : 0;
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
    const requiredHeadcount = cleanNumber(row.requiredHeadcount);
    const actualHeadcount = cleanNumber(row.actualHeadcount);
    const absenteeism = cleanNumber(row.absenteeismCount);
    const attrition = cleanNumber(row.attritionPastCount);
    const netActualHc = cleanNumber(row.netActualHeadcount);
    const acceptedJo = cleanNumber(row.interviewCount);
    const nho = cleanNumber(row.nhoCount);
    const fst = cleanNumber(row.fstCount);
    const pst = cleanNumber(row.pstCount);
    const goLive = cleanNumber(row.projectedToBeEndorsed);
    const leadsToInterview = cleanNumber(row.leadsToInterview);

    console.log("row netActualHc:", row.netActualHeadcount);

    return {
      cluster: row.cluster || row.clusterName || "",
      account: row.account || row.accountName || "",
      requiredHeadcount,
      actualHeadcount,
      bufferPercentage: cleanNumber(row.bufferPercent),
      absenteeism,
      absenteeismPercentage: cleanNumber(row.absenteeismPercent),
      attrition,
      attritionPercentage: cleanNumber(row.attritionPastPercent),
      netActualHc,
      hiringNeeded: cleanNumber(row.hiringNeeded || row.actualHeadcountNeeds),
      acceptedJo,
      nho,
      fst,
      pst,
      goLive,
      joNhoCount: cleanNumber(row.attritionInterviewToNhoCount),
      joNhoPercentage: cleanNumber(row.attritionInterviewToNhoPercent),
      nhoFstCount: cleanNumber(row.attritionNhoToFstPstCount),
      nhoFstPercentage: cleanNumber(row.attritionNhoToFstPstPercent),
      fstPstCount: cleanNumber(row.attritionFstToPstCount),
      fstPstPercentage: cleanNumber(row.attritionFstToPstPercent),
      nhoPstCount: 0,
      nhoPstPercentage: 0,
      pstGoLiveCount: 0,
      pstGoLivePercentage: 0,
      hiredCount: cleanNumber(row.hiredCount),
      hiringRate: cleanNumber(row.hiringRate) * 100,
      leadsToInterview,
      absenteeismTrend: cleanArray(row.absenteeismTrend),
      attritionTrend: cleanArray(row.attritionTrend),
    };
  });
}

function buildTotals(detailRows = []) {
  const requiredHeadcount = sumRows(detailRows, "requiredHeadcount");
  const actualHeadcount = sumRows(detailRows, "actualHeadcount");
  const absenteeism = sumRows(detailRows, "absenteeism");
  const attrition = sumRows(detailRows, "attrition");
  const acceptedJo = sumRows(detailRows, "acceptedJo");
  const nho = sumRows(detailRows, "nho");
  const fst = sumRows(detailRows, "fst");
  const pst = sumRows(detailRows, "pst");
  const leadsToInterview = sumRows(detailRows, "leadsToInterview");

  return {
    cluster: "TOTAL / AVERAGE",
    account: "",
    requiredHeadcount,
    actualHeadcount,
    bufferPercentage: getAveragePercent(
      actualHeadcount - requiredHeadcount,
      requiredHeadcount,
    ),
    absenteeism,
    absenteeismPercentage: getAveragePercent(absenteeism, actualHeadcount),
    attrition,
    attritionPercentage: getAveragePercent(attrition, actualHeadcount),
    netActualHc: sumRows(detailRows, "netActualHc"),
    hiringNeeded: sumRows(detailRows, "hiringNeeded"),
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

function buildTrends(detailRows = []) {
  const averageSeries = (key) =>
    TREND_WEEKS.map((_, index) => {
      const values = detailRows
        .map((row) => cleanNumber(row[key]?.[index]))
        .filter((value) => value > 0);

      if (!values.length) return 0;

      return values.reduce((total, value) => total + value, 0) / values.length;
    });

  return {
    absenteeism: averageSeries("absenteeismTrend"),
    attrition: averageSeries("attritionTrend"),
    buffer: TREND_WEEKS.map(() => 0),
  };
}

function buildSummary(totals) {
  console.log("buildSummary totals:", totals);

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

export function useWorkforceHiringView(optional = false) {
  const plan = useWorkforceHiring(optional);

  const weeklyVersion = plan?.weeklyVersion || {};
  const tables = plan?.tables || {};
  const detailRows = buildDetailRows(tables.filteredPlans || []);
  const totals = buildTotals(detailRows);

  console.log("totals", totals);
  console.log("detailRows", detailRows);

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
      summary: buildSummary(totals),
      pipeline: buildPipeline(totals),
      attritionStages: buildAttritionStages(totals),
      trendWeeks: TREND_WEEKS,
      trends: buildTrends(detailRows),
    },
    detailTable: {
      detailRows,
      totals,
    },
    status: {
      isLoading: Boolean(
        weeklyVersion.weeksLoading || weeklyVersion.accountsLoading,
      ),
      isLoadingWeeks: Boolean(weeklyVersion.weeksLoading),
      isLoadingFilters: false,
      isLoadingAccounts: Boolean(weeklyVersion.accountsLoading),
      error: "",
      refetch: () => {},
    },
  };
}

export default null;
