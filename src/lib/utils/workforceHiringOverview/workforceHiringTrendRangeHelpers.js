export const TREND_RANGE_OPTIONS = Object.freeze([
  { key: "6", label: "6 Weeks", weeks: 6 },
  { key: "12", label: "12 Weeks", weeks: 12 },
  { key: "24", label: "24 Weeks", weeks: 24 },
  { key: "custom", label: "Custom", weeks: null },
]);

function cleanText(value) {
  return String(value ?? "").trim();
}

function safeNumber(value, fallback = 0) {
  const numberValue = Number(value);
  return Number.isFinite(numberValue) ? numberValue : fallback;
}

function firstText(source = {}, keys = [], fallback = "") {
  for (const key of keys) {
    const value = cleanText(source?.[key]);
    if (value) return value;
  }
  return fallback;
}

function firstNumber(source = {}, keys = [], fallback = 0) {
  for (const key of keys) {
    const value = source?.[key];
    if (value === null || value === undefined || value === "") continue;
    const numberValue = Number(value);
    if (Number.isFinite(numberValue)) return numberValue;
  }
  return fallback;
}

function getWeekNumber(source = {}) {
  const direct = firstNumber(
    source,
    ["weekNumber", "week_number", "weekNo", "week_no", "week"],
    NaN,
  );
  if (Number.isFinite(direct) && direct > 0) return direct;

  const match = firstText(source, [
    "title",
    "label",
    "period",
    "weekLabel",
    "week_label",
    "value",
  ]).match(/(?:week|wk)\s*-?\s*(\d+)/i);

  return match?.[1] ? Number(match[1]) : null;
}

function getWeekYear(source = {}) {
  const direct = firstNumber(source, ["year", "weekYear", "week_year"], NaN);
  if (Number.isFinite(direct) && direct > 0) return direct;

  const sourceText = firstText(source, [
    "title",
    "label",
    "period",
    "weekLabel",
    "week_label",
    "value",
  ]);
  const match = sourceText.match(/\b(20\d{2})\b/);
  return match?.[1] ? Number(match[1]) : null;
}

function getDateTimestamp(value) {
  const cleanValue = cleanText(value).slice(0, 10);
  if (!cleanValue) return null;

  const timestamp = new Date(`${cleanValue}T00:00:00`).getTime();
  return Number.isFinite(timestamp) ? timestamp : null;
}

export function getWeekOptionId(option = {}, index = 0) {
  return cleanText(
    option.id ||
      option.value ||
      option.weekKey ||
      option.week_key ||
      `${option.weekStart || option.week_start || option.startDate || ""}__${
        option.weekEnd || option.week_end || option.endDate || ""
      }` ||
      `week-${index}`,
  );
}

export function sortWeekOptionsChronologically(options = []) {
  return [...(Array.isArray(options) ? options : [])].sort((first, second) => {
    const firstStart = getDateTimestamp(
      first.weekStart || first.week_start || first.startDate || first.start_date,
    );
    const secondStart = getDateTimestamp(
      second.weekStart || second.week_start || second.startDate || second.start_date,
    );

    if (firstStart !== null && secondStart !== null && firstStart !== secondStart) {
      return firstStart - secondStart;
    }

    const firstYear = getWeekYear(first) || 0;
    const secondYear = getWeekYear(second) || 0;
    if (firstYear !== secondYear) return firstYear - secondYear;

    const firstWeek = getWeekNumber(first) || 0;
    const secondWeek = getWeekNumber(second) || 0;
    if (firstWeek !== secondWeek) return firstWeek - secondWeek;

    return cleanText(first.value || first.label).localeCompare(
      cleanText(second.value || second.label),
      undefined,
      { numeric: true, sensitivity: "base" },
    );
  });
}

export function resolveTrendRangeSelection({
  options = [],
  mode = "6",
  startId = "",
  endId = "",
} = {}) {
  const sortedOptions = sortWeekOptionsChronologically(options);
  if (!sortedOptions.length) {
    return {
      options: [],
      startOption: null,
      endOption: null,
      selectedOptions: [],
      requestedWeeks: mode === "custom" ? 0 : Number(mode) || 6,
    };
  }

  const findIndexById = (targetId) =>
    sortedOptions.findIndex(
      (option, index) => getWeekOptionId(option, index) === cleanText(targetId),
    );

  let endIndex = findIndexById(endId);
  if (endIndex < 0) endIndex = sortedOptions.length - 1;

  let startIndex;
  if (mode === "custom") {
    startIndex = findIndexById(startId);
    if (startIndex < 0) startIndex = Math.max(0, endIndex - 5);
    if (startIndex > endIndex) [startIndex, endIndex] = [endIndex, startIndex];
  } else {
    const requestedWeeks = Math.max(1, Number(mode) || 6);
    startIndex = Math.max(0, endIndex - requestedWeeks + 1);
  }

  const selectedOptions = sortedOptions.slice(startIndex, endIndex + 1);

  return {
    options: sortedOptions,
    startOption: sortedOptions[startIndex] || null,
    endOption: sortedOptions[endIndex] || null,
    selectedOptions,
    requestedWeeks:
      mode === "custom" ? selectedOptions.length : Math.max(1, Number(mode) || 6),
  };
}

export function buildSixWeekRequestChunks(selectedOptions = []) {
  const options = sortWeekOptionsChronologically(selectedOptions);
  const chunks = [];

  for (let index = 0; index < options.length; index += 6) {
    const chunkOptions = options.slice(index, index + 6);
    const endOption = chunkOptions[chunkOptions.length - 1];
    if (!endOption) continue;

    chunks.push({
      options: chunkOptions,
      endOption,
      weekStart:
        endOption.weekStart ||
        endOption.week_start ||
        endOption.startDate ||
        endOption.start_date ||
        "",
      weekEnd:
        endOption.weekEnd ||
        endOption.week_end ||
        endOption.endDate ||
        endOption.end_date ||
        "",
      weight: chunkOptions.length,
    });
  }

  return chunks;
}

export function normalizeRequestFilterValue(value, fallback = "All") {
  const values = (Array.isArray(value) ? value : [value])
    .map(cleanText)
    .filter(Boolean)
    .filter(
      (item) =>
        !["all", "all clusters", "all accounts"].includes(item.toLowerCase()),
    );

  return values.length ? values.join(",") : fallback;
}

function getPointIdentity(source = {}, fallbackLabel = "") {
  const weekStart = firstText(source, [
    "weekStart",
    "week_start",
    "startDate",
    "start_date",
  ]);
  const weekEnd = firstText(source, [
    "weekEnd",
    "week_end",
    "endDate",
    "end_date",
  ]);
  const label = firstText(
    source,
    ["label", "period", "weekLabel", "week_label"],
    fallbackLabel,
  );
  const weekNumber = getWeekNumber(source);
  const year = getWeekYear(source);

  const key =
    weekStart ||
    (year && weekNumber ? `${year}-${weekNumber}` : "") ||
    (weekNumber ? `week-${weekNumber}` : "") ||
    label;

  return {
    key,
    label: label || (weekNumber ? `Week ${weekNumber}` : fallbackLabel || "Week"),
    weekStart,
    weekEnd,
    weekNumber,
    year,
  };
}

function normalizeTrendMetric(value) {
  const numberValue = Number(value);
  if (!Number.isFinite(numberValue)) return 0;
  if (numberValue !== 0 && Math.abs(numberValue) <= 1) return numberValue * 100;
  return numberValue;
}

export function normalizeTrendResponsePoints(response = {}) {
  const dataRows = Array.isArray(response?.data) ? response.data : [];
  const labels = Array.isArray(response?.labels) ? response.labels : [];
  const weeks = Array.isArray(response?.weeks) ? response.weeks : [];
  const series = response?.trends || {};
  const absenteeismSeries = Array.isArray(series.absenteeism)
    ? series.absenteeism
    : [];
  const attritionSeries = Array.isArray(series.attrition) ? series.attrition : [];
  const bufferSeries = Array.isArray(series.buffer) ? series.buffer : [];

  const length = Math.max(
    dataRows.length,
    labels.length,
    weeks.length,
    absenteeismSeries.length,
    attritionSeries.length,
    bufferSeries.length,
  );

  return Array.from({ length }, (_, index) => {
    const row = dataRows[index] || {};
    const week = weeks[index] || {};
    const identity = getPointIdentity(
      { ...week, ...row },
      labels[index] || firstText(week, ["label", "period"]),
    );

    return {
      ...identity,
      absenteeism: normalizeTrendMetric(
        row.absenteeismPercentage ??
          row.absenteeism_percentage ??
          row.absenteeismPercent ??
          row.absenteeism_percent ??
          absenteeismSeries[index] ??
          row.absenteeism,
      ),
      attrition: normalizeTrendMetric(
        row.attritionPercentage ??
          row.attrition_percentage ??
          row.attritionPercent ??
          row.attrition_percent ??
          attritionSeries[index] ??
          row.attrition,
      ),
      buffer: normalizeTrendMetric(
        row.bufferPercentage ??
          row.buffer_percentage ??
          row.bufferPercent ??
          row.buffer_percent ??
          bufferSeries[index] ??
          row.buffer,
      ),
    };
  }).filter((point) => point.label || point.weekStart || point.weekNumber);
}

function normalizeMatchKey(value) {
  return cleanText(value)
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "");
}

function pointMatchesOption(point = {}, option = {}) {
  const optionStart = firstText(option, [
    "weekStart",
    "week_start",
    "startDate",
    "start_date",
  ]);
  const optionEnd = firstText(option, [
    "weekEnd",
    "week_end",
    "endDate",
    "end_date",
  ]);

  if (optionStart && point.weekStart && optionStart === point.weekStart) return true;
  if (optionEnd && point.weekEnd && optionEnd === point.weekEnd) return true;

  const optionWeek = getWeekNumber(option);
  const optionYear = getWeekYear(option);
  if (
    optionWeek &&
    point.weekNumber === optionWeek &&
    (!optionYear || !point.year || point.year === optionYear)
  ) {
    return true;
  }

  return normalizeMatchKey(point.label) === normalizeMatchKey(
    firstText(option, ["title", "label", "period", "value"]),
  );
}

export function mergeTrendResponses(responses = [], selectedOptions = []) {
  const points = responses.flatMap(normalizeTrendResponsePoints);
  const unique = new Map();

  points.forEach((point, index) => {
    const key = point.weekStart || point.key || `${normalizeMatchKey(point.label)}-${index}`;
    unique.set(key, point);
  });

  const availablePoints = [...unique.values()];
  const ordered = [];

  sortWeekOptionsChronologically(selectedOptions).forEach((option) => {
    const match = availablePoints.find((point) => pointMatchesOption(point, option));
    if (match) ordered.push(match);
  });

  if (ordered.length) return ordered;

  return availablePoints.sort((first, second) => {
    const firstTime = getDateTimestamp(first.weekStart);
    const secondTime = getDateTimestamp(second.weekStart);
    if (firstTime !== null && secondTime !== null) return firstTime - secondTime;
    return (first.weekNumber || 0) - (second.weekNumber || 0);
  });
}

export function buildTrendSeries(points = []) {
  const safePoints = Array.isArray(points) ? points : [];
  return {
    weeks: safePoints.map((point) => point.label),
    trends: {
      absenteeism: safePoints.map((point) => safeNumber(point.absenteeism)),
      attrition: safePoints.map((point) => safeNumber(point.attrition)),
      buffer: safePoints.map((point) => safeNumber(point.buffer)),
    },
  };
}

function average(values = []) {
  const numericValues = values.map(Number).filter(Number.isFinite);
  if (!numericValues.length) return 0;
  return numericValues.reduce((total, value) => total + value, 0) / numericValues.length;
}

export function calculateTrendRangeSummary(points = [], fallback = {}) {
  const safePoints = Array.isArray(points) ? points : [];
  if (!safePoints.length) return { ...fallback };

  return {
    ...fallback,
    absenteeismPercentage: average(safePoints.map((point) => point.absenteeism)),
    attritionPercentage: average(safePoints.map((point) => point.attrition)),
    bufferPercentage: average(safePoints.map((point) => point.buffer)),
  };
}

function getRowAccountKey(row = {}) {
  return `${normalizeMatchKey(
    row.cluster || row.clusterName || row.cluster_name,
  )}::${normalizeMatchKey(
    row.account || row.accountName || row.account_name || row.gy_acc_name,
  )}`;
}

function readRowNumber(row = {}, keys = [], fallback = 0) {
  return firstNumber(row, keys, fallback);
}

function getPercent(numerator, denominator) {
  return denominator ? (numerator / denominator) * 100 : 0;
}

function normalizeTableRow(row = {}) {
  const requiredHeadcount = readRowNumber(row, ["requiredHeadcount", "required_headcount"]);
  const actualHeadcount = readRowNumber(row, ["actualHeadcount", "actual_headcount"]);
  const absenteeism = readRowNumber(row, [
    "absenteeism",
    "absenteeismCount",
    "absenteeism_count",
    "averageAbsentHeadcount",
    "average_absent_headcount",
  ]);
  const attrition = readRowNumber(row, [
    "attrition",
    "attritionCount",
    "attrition_count",
    "attritionPastCount",
    "attrition_past_count",
  ]);
  const netActualHeadcount = readRowNumber(
    row,
    ["netActualHeadcount", "net_actual_headcount", "netActualHc", "net_actual_hc"],
    actualHeadcount - absenteeism - attrition,
  );
  const hiringNeeded = readRowNumber(
    row,
    ["hiringNeeded", "hiring_needed", "actualHeadcountNeeds", "actual_headcount_needs"],
    Math.max(0, requiredHeadcount - netActualHeadcount),
  );
  const acceptedJo = readRowNumber(row, [
    "acceptedJo",
    "accepted_jo",
    "interviewCount",
    "interview_count",
    "interviewPopulationCount",
    "interview_population_count",
  ]);
  const nho = readRowNumber(row, ["nho", "nhoCount", "nho_count"]);
  const fst = readRowNumber(row, ["fst", "fstCount", "fst_count"]);
  const pst = readRowNumber(row, ["pst", "pstCount", "pst_count"]);
  const goLive = readRowNumber(row, [
    "goLive",
    "go_live",
    "projectedToBeEndorsed",
    "projected_to_be_endorsed",
  ]);
  const hiredCount = readRowNumber(row, ["hiredCount", "hired_count"], fst);
  const leadsToInterview = readRowNumber(row, ["leadsToInterview", "leads_to_interview"]);

  return {
    ...row,
    cluster: firstText(row, ["cluster", "clusterName", "cluster_name"], "—"),
    account: firstText(
      row,
      ["account", "accountName", "account_name", "gy_acc_name"],
      "—",
    ),
    requiredHeadcount,
    actualHeadcount,
    bufferPercent: readRowNumber(
      row,
      ["bufferPercent", "buffer_percentage", "bufferPercentage"],
      getPercent(netActualHeadcount - requiredHeadcount, requiredHeadcount),
    ),
    absenteeism,
    absenteeismPercent: readRowNumber(
      row,
      ["absenteeismPercent", "absenteeism_percentage", "absenteeismPercentage"],
      getPercent(absenteeism, actualHeadcount),
    ),
    attrition,
    attritionPercent: readRowNumber(
      row,
      ["attritionPercent", "attrition_percentage", "attritionPercentage"],
      getPercent(attrition, actualHeadcount),
    ),
    netActualHeadcount,
    hiringNeeded,
    acceptedJo,
    nho,
    fst,
    pst,
    goLive,
    joNhoCount: readRowNumber(row, ["joNhoCount", "jo_nho_count"]),
    nhoFstCount: readRowNumber(row, ["nhoFstCount", "nho_fst_count"]),
    fstPstCount: readRowNumber(row, ["fstPstCount", "fst_pst_count"]),
    nhoPstCount: readRowNumber(row, ["nhoPstCount", "nho_pst_count"]),
    pstGoLiveCount: readRowNumber(row, ["pstGoLiveCount", "pst_go_live_count"]),
    hiredCount,
    leadsToInterview,
  };
}

export function mergeRangeTableResponses(responseEntries = []) {
  const groups = new Map();

  responseEntries.forEach(({ response, weight = 6, order = 0 }) => {
    const rows = Array.isArray(response?.data) ? response.data : [];
    rows.forEach((rawRow) => {
      const row = normalizeTableRow(rawRow);
      const key = getRowAccountKey(row);
      if (!key || key === "::") return;

      const current = groups.get(key) || {
        latest: null,
        latestOrder: -1,
        totalWeight: 0,
        absenteeismWeighted: 0,
        attritionWeighted: 0,
        sums: {
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
          leadsToInterview: 0,
        },
      };

      if (order >= current.latestOrder) {
        current.latest = row;
        current.latestOrder = order;
      }

      current.totalWeight += weight;
      current.absenteeismWeighted += row.absenteeismPercent * weight;
      current.attritionWeighted += row.attritionPercent * weight;

      Object.keys(current.sums).forEach((field) => {
        current.sums[field] += safeNumber(row[field]);
      });

      groups.set(key, current);
    });
  });

  return [...groups.values()].map((group) => {
    const latest = group.latest || {};
    const sums = group.sums;
    const requiredHeadcount = safeNumber(latest.requiredHeadcount);
    const actualHeadcount = safeNumber(latest.actualHeadcount);
    const netActualHeadcount =
      actualHeadcount - sums.absenteeism / Math.max(1, group.totalWeight / 6) - sums.attrition;
    const hiringNeeded = Math.max(0, requiredHeadcount - netActualHeadcount);

    return {
      ...latest,
      requiredHeadcount,
      actualHeadcount,
      bufferPercent: getPercent(
        netActualHeadcount - requiredHeadcount,
        requiredHeadcount,
      ),
      absenteeism: sums.absenteeism,
      absenteeismPercent: group.totalWeight
        ? group.absenteeismWeighted / group.totalWeight
        : 0,
      attrition: sums.attrition,
      attritionPercent: group.totalWeight
        ? group.attritionWeighted / group.totalWeight
        : 0,
      netActualHeadcount,
      hiringNeeded,
      acceptedJo: sums.acceptedJo,
      nho: sums.nho,
      fst: sums.fst,
      pst: sums.pst,
      goLive: sums.goLive,
      joNhoCount: sums.joNhoCount,
      joNhoPercentage: getPercent(sums.joNhoCount, sums.acceptedJo),
      nhoFstCount: sums.nhoFstCount,
      nhoFstPercentage: getPercent(sums.nhoFstCount, sums.nho),
      fstPstCount: sums.fstPstCount,
      fstPstPercentage: getPercent(sums.fstPstCount, sums.fst),
      nhoPstCount: sums.nhoPstCount,
      nhoPstPercentage: getPercent(sums.nhoPstCount, sums.nho),
      pstGoLiveCount: sums.pstGoLiveCount,
      pstGoLivePercentage: getPercent(sums.pstGoLiveCount, sums.pst),
      hiredCount: sums.hiredCount,
      hiringRate: getPercent(
        sums.hiredCount,
        sums.leadsToInterview || sums.acceptedJo,
      ),
    };
  });
}

export function getTrendRangeDisplayLabel({ mode = "6", selectedOptions = [] } = {}) {
  const count = Array.isArray(selectedOptions) ? selectedOptions.length : 0;
  if (mode === "custom") return count ? `Custom ${count}-Week Range` : "Custom Range";
  return `${Number(mode) || count || 6}-Week Range`;
}
