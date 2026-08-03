export function safeNumber(value) {
  const normalizedValue =
    typeof value === "string"
      ? value.replace(/,/g, "").replace(/%/g, "").trim()
      : value;
  const numberValue = Number(normalizedValue || 0);

  return Number.isFinite(numberValue) ? numberValue : 0;
}

export function getRowNumber(row = {}, keys = [], fallback = 0) {
  for (const key of keys) {
    const value = row?.[key];

    if (value !== null && value !== undefined && value !== "") {
      return safeNumber(value);
    }
  }

  return safeNumber(fallback);
}

export function getRowText(row = {}, keys = [], fallback = "") {
  for (const key of keys) {
    const value = row?.[key];

    if (value !== null && value !== undefined && String(value).trim() !== "") {
      return String(value).trim();
    }
  }

  return fallback;
}

function deriveForecastMetrics(source = {}) {
  const requiredHeadcount = Math.round(safeNumber(source.requiredHeadcount));
  const actualHeadcount = Math.round(safeNumber(source.actualHeadcount));
  const absenteeism = Math.round(safeNumber(source.absenteeism));
  const attrition = Math.round(safeNumber(source.attrition));

  const acceptedJo = Math.round(safeNumber(source.acceptedJo));
  const nho = Math.round(safeNumber(source.nho));
  const fst = Math.round(safeNumber(source.fst));
  const pst = Math.round(safeNumber(source.pst));
  const goLive = Math.round(safeNumber(source.goLive));
  const hiredCount = Math.round(safeNumber(source.hiredCount));

  const netActualHc = Math.max(
    0,
    actualHeadcount - absenteeism - attrition,
  );

  const bufferPercentage =
    requiredHeadcount > 0
      ? ((netActualHc - requiredHeadcount) / requiredHeadcount) * 100
      : 0;

  const absenteeismPercentage =
    actualHeadcount > 0 ? (absenteeism / actualHeadcount) * 100 : 0;

  const attritionPercentage =
    actualHeadcount > 0 ? (attrition / actualHeadcount) * 100 : 0;

  const hiringNeeded = Math.max(0, requiredHeadcount - netActualHc);

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
    bufferPercentage,
    absenteeism,
    absenteeismPercentage,
    attrition,
    attritionPercentage,
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

export function normalizeForecastAccountRow(row = {}) {
  return {
    id: row?.id,
    cluster: getRowText(
      row,
      ["clusterName", "cluster_name", "cluster"],
      "Unassigned",
    ),
    account: getRowText(
      row,
      ["accountName", "account_name", "account", "ghlName", "ghl_name"],
      "Unassigned",
    ),
    requiredHeadcount: getRowNumber(row, [
      "requiredHeadcount",
      "required_headcount",
    ]),
    actualHeadcount: getRowNumber(row, [
      "actualHeadcount",
      "actual_headcount",
    ]),
    absenteeism: getRowNumber(row, [
      "absenteeism",
      "absenteeismCount",
      "absenteeism_count",
      "averageAbsentHeadcount",
      "average_absent_headcount",
    ]),
    attrition: getRowNumber(row, [
      "attrition",
      "attritionCount",
      "attrition_count",
      "attritionPastCount",
      "attrition_past_count",
    ]),
    acceptedJo: getRowNumber(row, [
      "acceptedJo",
      "acceptedJO",
      "accepted_jo",
      "acceptedJobOffer",
      "accepted_job_offer",
      "interviewCount",
      "interview_count",
    ]),
    nho: getRowNumber(row, ["nho", "nhoCount", "nho_count"]),
    fst: getRowNumber(row, ["fst", "fstCount", "fst_count"]),
    pst: getRowNumber(row, ["pst", "pstCount", "pst_count"]),
    goLive: getRowNumber(row, [
      "goLive",
      "go_live",
      "goLiveCount",
      "go_live_count",
      "projectedToBeEndorsed",
      "projected_to_be_endorsed",
    ]),
    hiredCount: getRowNumber(row, ["hiredCount", "hired_count", "hired"]),
  };
}

export function buildForecastAccountAverageRows(
  groups = [],
  requestedForecastWeekCount = 0,
) {
  const safeGroups = Array.isArray(groups) ? groups : [];
  const forecastWeekCount = Math.max(
    safeNumber(requestedForecastWeekCount),
    safeGroups.length,
  );

  if (!forecastWeekCount) return [];

  const accountMap = new Map();

  safeGroups.forEach((group) => {
    const rows = Array.isArray(group?.rows) ? group.rows : [];

    rows.forEach((rawRow) => {
      const row = normalizeForecastAccountRow(rawRow);
      const key = `${row.cluster.toLowerCase()}::${row.account.toLowerCase()}`;

      if (!accountMap.has(key)) {
        accountMap.set(key, {
          cluster: row.cluster,
          account: row.account,
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
        });
      }

      const accumulator = accountMap.get(key);

      accumulator.requiredHeadcount += row.requiredHeadcount;
      accumulator.actualHeadcount += row.actualHeadcount;
      accumulator.absenteeism += row.absenteeism;
      accumulator.attrition += row.attrition;
      accumulator.acceptedJo += row.acceptedJo;
      accumulator.nho += row.nho;
      accumulator.fst += row.fst;
      accumulator.pst += row.pst;
      accumulator.goLive += row.goLive;
      accumulator.hiredCount += row.hiredCount;
    });
  });

  return Array.from(accountMap.values())
    .map((source) => ({
      cluster: source.cluster,
      account: source.account,
      ...deriveForecastMetrics({
        requiredHeadcount: source.requiredHeadcount / forecastWeekCount,
        actualHeadcount: source.actualHeadcount / forecastWeekCount,
        absenteeism: source.absenteeism / forecastWeekCount,
        attrition: source.attrition / forecastWeekCount,
        acceptedJo: source.acceptedJo / forecastWeekCount,
        nho: source.nho / forecastWeekCount,
        fst: source.fst / forecastWeekCount,
        pst: source.pst / forecastWeekCount,
        goLive: source.goLive / forecastWeekCount,
        hiredCount: source.hiredCount / forecastWeekCount,
      }),
    }))
    .sort((left, right) => {
      const clusterCompare = left.cluster.localeCompare(right.cluster);
      return clusterCompare || left.account.localeCompare(right.account);
    });
}

export function buildForecastAccountTotals(rows = []) {
  const safeRows = Array.isArray(rows) ? rows : [];

  const source = safeRows.reduce(
    (total, row) => {
      total.requiredHeadcount += safeNumber(row?.requiredHeadcount);
      total.actualHeadcount += safeNumber(row?.actualHeadcount);
      total.absenteeism += safeNumber(row?.absenteeism);
      total.attrition += safeNumber(row?.attrition);
      total.acceptedJo += safeNumber(row?.acceptedJo);
      total.nho += safeNumber(row?.nho);
      total.fst += safeNumber(row?.fst);
      total.pst += safeNumber(row?.pst);
      total.goLive += safeNumber(row?.goLive);
      total.hiredCount += safeNumber(row?.hiredCount);

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
      hiredCount: 0,
    },
  );

  return deriveForecastMetrics(source);
}
