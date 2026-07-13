import {
  workforceHiringOverviewDetailRows,
  workforceHiringOverviewSummary,
} from "./workforceHiringOverviewConstants";

export function formatOverviewNumber(value) {
  return Number(value || 0).toLocaleString("en-US");
}

export function formatOverviewPercent(value) {
  return `${Number(value || 0).toFixed(2)}%`;
}

export function buildWorkforceHiringOverviewTotals({
  detailRows = workforceHiringOverviewDetailRows,
  summary = workforceHiringOverviewSummary,
} = {}) {
  return {
    cluster: "TOTAL / AVERAGE",
    account: "",
    requiredHeadcount: summary.requiredHeadcount,
    actualHeadcount: summary.actualHeadcount,
    bufferPercentage: summary.bufferPercentage,
    absenteeism: summary.absenteeism,
    absenteeismPercentage: summary.absenteeismPercentage,
    attrition: summary.attrition,
    attritionPercentage: summary.attritionPercentage,
    netActualHc: summary.netActualHc,
    hiringNeeded: summary.hiringNeeded,
    acceptedJo: detailRows.reduce((total, row) => total + Number(row.acceptedJo || 0), 0),
    nho: detailRows.reduce((total, row) => total + Number(row.nho || 0), 0),
    fst: detailRows.reduce((total, row) => total + Number(row.fst || 0), 0),
    pst: detailRows.reduce((total, row) => total + Number(row.pst || 0), 0),
    goLive: detailRows.reduce((total, row) => total + Number(row.goLive || 0), 0),
    joNhoCount: detailRows.reduce((total, row) => total + Number(row.joNhoCount || 0), 0),
    joNhoPercentage: 22.78,
    nhoFstCount: detailRows.reduce((total, row) => total + Number(row.nhoFstCount || 0), 0),
    nhoFstPercentage: 19.67,
    fstPstCount: detailRows.reduce((total, row) => total + Number(row.fstPstCount || 0), 0),
    fstPstPercentage: 24.49,
    nhoPstCount: detailRows.reduce((total, row) => total + Number(row.nhoPstCount || 0), 0),
    nhoPstPercentage: 14.75,
    pstGoLiveCount: detailRows.reduce((total, row) => total + Number(row.pstGoLiveCount || 0), 0),
    pstGoLivePercentage: 21.62,
    hiredCount: summary.hiredCount,
    hiringRate: summary.hiringRate,
  };
}
