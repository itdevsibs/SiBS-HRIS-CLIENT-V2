import React, { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { Info, X } from "lucide-react";

const EDGE = "rounded-[10px]";
const FALLBACK_WEEK_LABELS = ["W1", "W2", "W3", "W4", "W5", "W6"];

function toNumber(value) {
  if (value === undefined || value === null || value === "") return 0;

  if (typeof value === "number") {
    return Number.isFinite(value) ? value : 0;
  }

  const cleanValue = String(value)
    .trim()
    .replace(/,/g, "")
    .replace(/%/g, "");

  if (!cleanValue) return 0;

  const numberValue = Number(cleanValue);

  return Number.isFinite(numberValue) ? numberValue : 0;
}

function formatNumber(value, decimals = 0) {
  return toNumber(value).toLocaleString("en-PH", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}

function formatPercent(value, decimals = 2) {
  return `${toNumber(value).toFixed(decimals)}%`;
}

function getNestedValue(item, key) {
  if (!item || !key) return undefined;

  if (!String(key).includes(".")) return item?.[key];

  return String(key)
    .split(".")
    .reduce((value, pathKey) => value?.[pathKey], item);
}

function getNumberValue(item, keys = [], fallback = 0) {
  for (const key of keys) {
    const value = getNestedValue(item, key);

    if (value !== undefined && value !== null && value !== "") {
      const numberValue = toNumber(value);

      if (Number.isFinite(numberValue)) return numberValue;
    }
  }

  return toNumber(fallback);
}

function getWeekNumberFromAny(value) {
  const rawValue = String(value ?? "").trim();

  if (!rawValue) return 0;

  const directNumber = Number(rawValue);

  if (Number.isFinite(directNumber) && directNumber > 0) {
    return directNumber;
  }

  const match = rawValue.match(/week\s*(\d+)/i) || rawValue.match(/w(\d+)/i);

  if (!match) return 0;

  const weekNumber = Number(match[1]);

  return Number.isFinite(weekNumber) && weekNumber > 0 ? weekNumber : 0;
}

function normalizeWeekLabels(labels = []) {
  const cleanLabels = labels
    .map((label) => String(label || "").trim())
    .filter(Boolean);

  if (cleanLabels.length >= 6) return cleanLabels.slice(-6);

  return [];
}

function getWeekLabelsFromRows(rows = []) {
  for (const row of rows) {
    const possibleLabels = [
      row?.weekLabels,
      row?.week_labels,
      row?.pastSixWeekLabels,
      row?.past_six_week_labels,
      row?.trendWeekLabels,
      row?.trend_week_labels,
      row?.weeklyLabels,
      row?.weekly_labels,
    ];

    for (const value of possibleLabels) {
      if (Array.isArray(value)) {
        const labels = normalizeWeekLabels(value);
        if (labels.length === 6) return labels;
      }

      if (typeof value === "string" && value.trim()) {
        try {
          const parsed = JSON.parse(value);
          const labels = Array.isArray(parsed)
            ? normalizeWeekLabels(parsed)
            : [];

          if (labels.length === 6) return labels;
        } catch {
          const labels = normalizeWeekLabels(value.split(","));
          if (labels.length === 6) return labels;
        }
      }
    }
  }

  return [];
}

function buildWeekLabels(activeWeek, rows = []) {
  const rowLabels = getWeekLabelsFromRows(rows);

  if (rowLabels.length === 6) return rowLabels;

  const firstRow = rows.find(Boolean) || {};

  const currentWeekNumber = getWeekNumberFromAny(
    activeWeek?.weekNumber ||
      activeWeek?.week_number ||
      activeWeek?.label ||
      activeWeek?.weekLabel ||
      activeWeek?.week_label ||
      firstRow?.weekNumber ||
      firstRow?.week_number ||
      firstRow?.week ||
      firstRow?.weekLabel ||
      firstRow?.week_label ||
      firstRow?.label,
  );

  if (currentWeekNumber > 0) {
    return Array.from({ length: 6 }, (_, index) => {
      const weekNumber = currentWeekNumber - 5 + index;
      return `W${weekNumber > 0 ? weekNumber : index + 1}`;
    });
  }

  return FALLBACK_WEEK_LABELS;
}

function cleanSeries(values = []) {
  const cleaned = values
    .map((value) => Number(value || 0))
    .filter((value) => Number.isFinite(value));

  if (cleaned.length >= 6) return cleaned.slice(-6);

  if (cleaned.length > 0) {
    return [...Array.from({ length: 6 - cleaned.length }, () => 0), ...cleaned];
  }

  return [];
}

function extractSeries(value, type = "") {
  if (Array.isArray(value)) {
    if (!value.length) return [];

    if (typeof value[0] === "object" && value[0] !== null) {
      return cleanSeries(
        value.map((entry) => {
          if (type === "absenteeism") {
            return (
              entry.absenteeism ??
              entry.absenteeismCount ??
              entry.absenteeism_count ??
              entry.total ??
              entry.count ??
              entry.value ??
              0
            );
          }

          if (type === "attrition") {
            return (
              entry.attrition ??
              entry.attritionCount ??
              entry.attrition_count ??
              entry.total ??
              entry.count ??
              entry.value ??
              0
            );
          }

          return entry.total ?? entry.count ?? entry.value ?? 0;
        }),
      );
    }

    return cleanSeries(value);
  }

  if (value && typeof value === "object") {
    return cleanSeries([
      value.w1 ?? value.W1 ?? value.week1 ?? value.week_1,
      value.w2 ?? value.W2 ?? value.week2 ?? value.week_2,
      value.w3 ?? value.W3 ?? value.week3 ?? value.week_3,
      value.w4 ?? value.W4 ?? value.week4 ?? value.week_4,
      value.w5 ?? value.W5 ?? value.week5 ?? value.week_5,
      value.w6 ?? value.W6 ?? value.week6 ?? value.week_6,
    ]);
  }

  if (typeof value === "string" && value.trim()) {
    try {
      return extractSeries(JSON.parse(value), type);
    } catch {
      return cleanSeries(
        value
          .split(",")
          .map((entry) => Number(String(entry).trim()))
          .filter((entry) => Number.isFinite(entry)),
      );
    }
  }

  return [];
}

function getArrayValue(item, keys = [], type = "") {
  for (const key of keys) {
    const series = extractSeries(item?.[key], type);

    if (series.length > 0) return series;
  }

  return [];
}

function getActualHeadcount(item = {}) {
  return getNumberValue(item, [
    "actualHeadcount",
    "actual_headcount",
    "actualHC",
    "actual_hc",
    "endorsedHeadcount",
    "endorsed_headcount",
  ]);
}

function getRateStatusClass(rate = 0) {
  return toNumber(rate) <= 25 ? "text-emerald-600" : "text-red-600";
}

function getSignedPercentClass(value = 0) {
  const cleanValue = toNumber(value);

  if (cleanValue < 0) return "text-red-600";
  if (cleanValue > 0) return "text-emerald-600";

  return "text-slate-700";
}

function getSignedCountClass(value = 0, positiveClass = "text-sibs-primary-1") {
  const cleanValue = toNumber(value);

  if (cleanValue < 0) return "text-red-600";
  if (cleanValue > 0) return positiveClass;

  return "text-slate-700";
}

function getExcelBufferPercentage(item = {}) {
  const requiredHeadcount = getRequiredHeadcount(item);
  const actualHeadcount = getActualHeadcount(item);
  const absenteeism = getRowTotal(item, "absenteeism");
  const attrition = getRowTotal(item, "attrition");

  /*
    Excel equivalent:
    =IF(AND(D2="",E2="",G2="",I2=""),"",IFERROR(((E2-G2-I2)-D2)/D2,0))

    JavaScript percentage:
    (((Actual HC - Absenteeism - Attrition) - Required HC) / Required HC) * 100
  */
  if (
    requiredHeadcount === 0 &&
    actualHeadcount === 0 &&
    absenteeism === 0 &&
    attrition === 0
  ) {
    return "";
  }

  if (requiredHeadcount <= 0) return 0;

  return (
    ((actualHeadcount - absenteeism - attrition) - requiredHeadcount) /
    requiredHeadcount
  ) * 100;
}

function formatSignedPercent(value, decimals = 2) {
  if (value === "") return "";

  return `${toNumber(value).toFixed(decimals)}%`;
}

function getRowTotal(item, type) {
  if (type === "absenteeism") {
    return getNumberValue(item, [
      "absenteeismCount",
      "absenteeism_count",
      "absenteeismPastSixWeeks",
      "absenteeism_past_six_weeks",
      "absenteeismSixWeeks",
      "absenteeism_6_weeks",
      "totalAbsenteeism",
      "total_absenteeism",
    ]);
  }

  if (type === "attrition") {
    return getNumberValue(item, [
      "attritionPastCount",
      "attrition_past_count",
      "attritionCount",
      "attrition_count",
      "attritionPastSixWeeks",
      "attrition_past_six_weeks",
      "attritionSixWeeks",
      "attrition_6_weeks",
      "totalAttrition",
      "total_attrition",
    ]);
  }

  return 0;
}

function getPerWeekSeries(item, type) {
  if (type === "absenteeism") {
    const directSeries = getArrayValue(
      item,
      [
        "absenteeismTrend",
        "absenteeism_trend",
        "absenteeismWeeklyCounts",
        "absenteeism_weekly_counts",
        "absenteeismPastSixWeeksTrend",
        "absenteeism_past_six_weeks_trend",
        "absenteeismSixWeeksBreakdown",
        "absenteeism_six_weeks_breakdown",
        "weeklyAbsenteeism",
        "weekly_absenteeism",
      ],
      "absenteeism",
    );

    if (directSeries.length > 0) {
      return {
        values: directSeries,
        hasRealWeeklyData: true,
      };
    }

    const keyedSeries = cleanSeries([
      getNumberValue(item, [
        "absenteeismWeek1",
        "absenteeism_week_1",
        "week1Absenteeism",
        "week_1_absenteeism",
        "w1Absenteeism",
        "absenteeismW1",
      ]),
      getNumberValue(item, [
        "absenteeismWeek2",
        "absenteeism_week_2",
        "week2Absenteeism",
        "week_2_absenteeism",
        "w2Absenteeism",
        "absenteeismW2",
      ]),
      getNumberValue(item, [
        "absenteeismWeek3",
        "absenteeism_week_3",
        "week3Absenteeism",
        "week_3_absenteeism",
        "w3Absenteeism",
        "absenteeismW3",
      ]),
      getNumberValue(item, [
        "absenteeismWeek4",
        "absenteeism_week_4",
        "week4Absenteeism",
        "week_4_absenteeism",
        "w4Absenteeism",
        "absenteeismW4",
      ]),
      getNumberValue(item, [
        "absenteeismWeek5",
        "absenteeism_week_5",
        "week5Absenteeism",
        "week_5_absenteeism",
        "w5Absenteeism",
        "absenteeismW5",
      ]),
      getNumberValue(item, [
        "absenteeismWeek6",
        "absenteeism_week_6",
        "week6Absenteeism",
        "week_6_absenteeism",
        "w6Absenteeism",
        "absenteeismW6",
      ]),
    ]);

    const hasKeyedData = keyedSeries.some((value) => value > 0);

    return {
      values: hasKeyedData ? keyedSeries : [0, 0, 0, 0, 0, 0],
      hasRealWeeklyData: hasKeyedData,
    };
  }

  const directSeries = getArrayValue(
    item,
    [
      "attritionTrend",
      "attrition_trend",
      "attritionWeeklyCounts",
      "attrition_weekly_counts",
      "attritionPastSixWeeksTrend",
      "attrition_past_six_weeks_trend",
      "attritionSixWeeksBreakdown",
      "attrition_six_weeks_breakdown",
      "weeklyAttrition",
      "weekly_attrition",
    ],
    "attrition",
  );

  if (directSeries.length > 0) {
    return {
      values: directSeries,
      hasRealWeeklyData: true,
    };
  }

  const keyedSeries = cleanSeries([
    getNumberValue(item, [
      "attritionWeek1",
      "attrition_week_1",
      "week1Attrition",
      "week_1_attrition",
      "w1Attrition",
      "attritionW1",
    ]),
    getNumberValue(item, [
      "attritionWeek2",
      "attrition_week_2",
      "week2Attrition",
      "week_2_attrition",
      "w2Attrition",
      "attritionW2",
    ]),
    getNumberValue(item, [
      "attritionWeek3",
      "attrition_week_3",
      "week3Attrition",
      "week_3_attrition",
      "w3Attrition",
      "attritionW3",
    ]),
    getNumberValue(item, [
      "attritionWeek4",
      "attrition_week_4",
      "week4Attrition",
      "week_4_attrition",
      "w4Attrition",
      "attritionW4",
    ]),
    getNumberValue(item, [
      "attritionWeek5",
      "attrition_week_5",
      "week5Attrition",
      "week_5_attrition",
      "w5Attrition",
      "attritionW5",
    ]),
    getNumberValue(item, [
      "attritionWeek6",
      "attrition_week_6",
      "week6Attrition",
      "week_6_attrition",
      "w6Attrition",
      "attritionW6",
    ]),
  ]);

  const hasKeyedData = keyedSeries.some((value) => value > 0);

  return {
    values: hasKeyedData ? keyedSeries : [0, 0, 0, 0, 0, 0],
    hasRealWeeklyData: hasKeyedData,
  };
}

function buildAggregateTrend(rows = [], type) {
  let hasRealWeeklyData = false;

  const values = rows.reduce(
    (sum, item) => {
      const series = getPerWeekSeries(item, type);

      if (series.hasRealWeeklyData) {
        hasRealWeeklyData = true;
        return sum.map((value, index) => value + toNumber(series.values[index]));
      }

      return sum;
    },
    [0, 0, 0, 0, 0, 0],
  );

  return {
    values,
    hasRealWeeklyData,
  };
}

function getNhoCount(item = {}) {
  return getNumberValue(item, [
    "nho",
    "NHO",
    "nhoCount",
    "nho_count",
    "nhoTotal",
    "nho_total",
    "nhoPopulationCount",
    "nho_population_count",
    "newHireOrientation",
    "new_hire_orientation",
    "newHireOrientationCount",
    "new_hire_orientation_count",
    "trainingNho",
    "training_nho",
    "pipelineNho",
    "pipeline_nho",
    "pipelineNhoCount",
    "pipeline_nho_count",
    "candidateNhoCount",
    "candidate_nho_count",
    "training.nho",
    "training.nhoCount",
    "training.nho_count",
    "training.nhoPopulationCount",
  ]);
}

function getFstCount(item = {}) {
  return getNumberValue(item, [
    "fst",
    "FST",
    "fstCount",
    "fst_count",
    "fstTotal",
    "fst_total",
    "fstPopulationCount",
    "fst_population_count",
    "firstStageTraining",
    "first_stage_training",
    "firstStageTrainingCount",
    "first_stage_training_count",
    "trainingFst",
    "training_fst",
    "pipelineFst",
    "pipeline_fst",
    "pipelineFstCount",
    "pipeline_fst_count",
    "candidateFstCount",
    "candidate_fst_count",
    "training.fst",
    "training.fstCount",
    "training.fst_count",
    "training.fstPopulationCount",
  ]);
}

function getPstCount(item = {}) {
  return getNumberValue(item, [
    "pst",
    "PST",
    "pstCount",
    "pst_count",
    "pstTotal",
    "pst_total",
    "pstPopulationCount",
    "pst_population_count",
    "productionStageTraining",
    "production_stage_training",
    "productionStageTrainingCount",
    "production_stage_training_count",
    "trainingPst",
    "training_pst",
    "pipelinePst",
    "pipeline_pst",
    "pipelinePstCount",
    "pipeline_pst_count",
    "candidatePstCount",
    "candidate_pst_count",
    "training.pst",
    "training.pstCount",
    "training.pst_count",
    "training.pstPopulationCount",
  ]);
}

function getProjectedEndorsedCount(item = {}) {
  const explicitValue = getNumberValue(
    item,
    [
      "projectedToBeEndorsed",
      "projected_to_be_endorsed",
      "projectedToBeEndorsedCount",
      "projected_to_be_endorsed_count",
      "projectedEndorsed",
      "projected_endorsed",
      "projectEndorsed",
      "project_endorsed",
      "projectedEndorsement",
      "projected_endorsement",
      "toBeEndorsed",
      "to_be_endorsed",
      "endorsedProjected",
      "endorsed_projected",
      "endorsedCount",
      "endorsed_count",
      "endorsementCount",
      "endorsement_count",
      "pstEndorsedCount",
      "pst_endorsed_count",
      "training.projectedToBeEndorsed",
      "training.projected_to_be_endorsed",
      "training.projectedEndorsed",
      "training.projected_endorsed",
      "training.projectEndorsed",
    ],
    null,
  );

  if (explicitValue > 0) return explicitValue;

  const pstCount = getPstCount(item);
  const fstToPstAttrition = getNumberValue(item, [
    "attritionFstToPstCount",
    "attrition_fst_to_pst_count",
    "fstToPstAttritionCount",
    "fst_to_pst_attrition_count",
  ]);

  return Math.max(0, pstCount - fstToPstAttrition);
}

function getTrainingMetrics(item = {}) {
  const nhoCount = getNhoCount(item);
  const fstCount = getFstCount(item);
  const pstCount = getPstCount(item);
  const projectedToBeEndorsed = getProjectedEndorsedCount(item);

  return {
    nhoCount,
    fstCount,
    pstCount,
    projectedToBeEndorsed,
    totalTrainingPipeline:
      nhoCount + fstCount + pstCount + projectedToBeEndorsed,
  };
}

function getHiringMetrics(item = {}) {
  const hiringNeeded = getNumberValue(item, [
    "actualHeadcountNeeds",
    "actual_headcount_needs",
    "hiringNeeded",
    "hiring_needed",
    "opsPrf",
    "ops_prf",
  ]);

  const leadsToInterview = getNumberValue(item, [
    "leadsToInterview",
    "leads_to_interview",
    "leadsNeeded",
    "leads_needed",
  ]);

  const interviewCount = getNumberValue(item, [
    "interviewCount",
    "interview_count",
    "interviewPopulationCount",
    "interview_population_count",
    "alreadyInterviewed",
    "already_interviewed",
  ]);

  const hiredCount = getNumberValue(
    item,
    ["hiredCount", "hired_count", "hired"],
    getFstCount(item) + getPstCount(item),
  );

  const hiringRate = interviewCount > 0 ? (hiredCount / interviewCount) * 100 : 0;
  const remainingLeadsToGenerate = Math.max(0, leadsToInterview - interviewCount);

  return {
    hiringNeeded,
    leadsToInterview,
    interviewCount,
    hiredCount,
    hiringRate,
    remainingLeadsToGenerate,
  };
}


function getRequiredHeadcount(item = {}) {
  return getNumberValue(item, [
    "requiredHeadcount",
    "required_headcount",
    "requiredHC",
    "required_hc",
    "clientPlan",
    "client_plan",
  ]);
}

function getSignedNumber(value) {
  const numberValue = toNumber(value);

  if (!Number.isFinite(numberValue)) return 0;

  return numberValue;
}

function getStageAttritionDirectCount(item = {}, keys = []) {
  return getNumberValue(item, keys, 0);
}

function getStageAttritionMetrics(item = {}) {
  const interviewCount = getSignedNumber(
    getNumberValue(item, [
      "interviewCount",
      "interview_count",
      "interviewPopulationCount",
      "interview_population_count",
      "alreadyInterviewed",
      "already_interviewed",
    ]),
  );

  const nhoCount = getSignedNumber(getNhoCount(item));
  const fstCount = getSignedNumber(getFstCount(item));
  const pstCount = getSignedNumber(getPstCount(item));

  const interviewToNhoDirect = getStageAttritionDirectCount(item, [
    "attritionInterviewToNhoCount",
    "attrition_interview_to_nho_count",
    "interviewToNhoAttritionCount",
    "interview_to_nho_attrition_count",
  ]);

  const nhoToFstDirect = getStageAttritionDirectCount(item, [
    "attritionNhoToFstCount",
    "attrition_nho_to_fst_count",
    "nhoToFstAttritionCount",
    "nho_to_fst_attrition_count",
  ]);

  const fstToPstDirect = getStageAttritionDirectCount(item, [
    "attritionFstToPstCount",
    "attrition_fst_to_pst_count",
    "fstToPstAttritionCount",
    "fst_to_pst_attrition_count",
  ]);

  const nhoToPstDirect = getStageAttritionDirectCount(item, [
    "attritionNhoToPstCount",
    "attrition_nho_to_pst_count",
    "nhoToPstAttritionCount",
    "nho_to_pst_attrition_count",
  ]);

  const signedInterviewToNhoCount = interviewCount - nhoCount;
  const signedNhoToFstCount = nhoCount - fstCount;
  const signedFstToPstCount = fstCount - pstCount;
  const signedNhoToPstCount = nhoCount - pstCount;

  const interviewToNhoCount =
    interviewToNhoDirect !== 0
      ? Math.abs(interviewToNhoDirect)
      : Math.abs(signedInterviewToNhoCount);

  const nhoToFstCount =
    nhoToFstDirect !== 0 ? Math.abs(nhoToFstDirect) : Math.abs(signedNhoToFstCount);

  const fstToPstCount =
    fstToPstDirect !== 0 ? Math.abs(fstToPstDirect) : Math.abs(signedFstToPstCount);

  const nhoToPstCount =
    nhoToPstDirect !== 0 ? Math.abs(nhoToPstDirect) : Math.abs(signedNhoToPstCount);

  return {
    interviewCount,
    nhoCount,
    fstCount,
    pstCount,
    interviewToNhoCount,
    nhoToFstCount,
    fstToPstCount,
    nhoToPstCount,
    signedInterviewToNhoCount,
    signedNhoToFstCount,
    signedFstToPstCount,
    signedNhoToPstCount,
  };
}

function getStageRate(count, denominator) {
  const cleanCount = toNumber(count);
  const cleanDenominator = toNumber(denominator);

  return cleanDenominator !== 0 ? (cleanCount / cleanDenominator) * 100 : 0;
}

function getAttritionStatus(rate = 0) {
  return toNumber(rate) <= 25 ? "Healthy" : "High";
}

function getAttritionStatusClass(rate = 0) {
  const cleanRate = toNumber(rate);

  if (cleanRate < 0) {
    return "bg-red-50 text-red-600 border-red-100";
  }

  return cleanRate <= 25
    ? "bg-emerald-50 text-emerald-700 border-emerald-100"
    : "bg-red-50 text-red-600 border-red-100";
}

function getRowCoverageStatus(item = {}) {
  const required = getRequiredHeadcount(item);
  const actual = getActualHeadcount(item);
  const training = getTrainingMetrics(item);
  const absenteeismBuffer = Math.ceil(getRowTotal(item, "absenteeism") / 6);
  const attritionBuffer = Math.ceil(getRowTotal(item, "attrition") / 6);
  const buffer = absenteeismBuffer + attritionBuffer;
  const effectiveDemand = required + buffer;
  const projectedCoverage = actual + training.projectedToBeEndorsed;

  if (effectiveDemand <= 0) {
    return {
      status: "fullyCovered",
      required,
      actual,
      buffer,
      effectiveDemand,
      projectedCoverage,
    };
  }

  if (projectedCoverage >= effectiveDemand) {
    return {
      status: "fullyCovered",
      required,
      actual,
      buffer,
      effectiveDemand,
      projectedCoverage,
    };
  }

  if (projectedCoverage >= required) {
    return {
      status: "atRisk",
      required,
      actual,
      buffer,
      effectiveDemand,
      projectedCoverage,
    };
  }

  return {
    status: "underCovered",
    required,
    actual,
    buffer,
    effectiveDemand,
    projectedCoverage,
  };
}


function buildLinePoints(values = [], width = 300, height = 132) {
  const paddingX = 24;
  const paddingTop = 18;
  const paddingBottom = 28;
  const cleanValues = values.map((value) => toNumber(value));
  const maxValue = Math.max(...cleanValues, 1);
  const usableWidth = width - paddingX * 2;
  const usableHeight = height - paddingTop - paddingBottom;

  return cleanValues.map((value, index) => {
    const x =
      paddingX +
      (cleanValues.length <= 1
        ? usableWidth / 2
        : (usableWidth / (cleanValues.length - 1)) * index);

    const y = paddingTop + usableHeight - (value / maxValue) * usableHeight;

    return {
      x,
      y,
      value,
    };
  });
}

function MiniLineChart({
  values = [],
  hasRealWeeklyData = false,
  labels = FALLBACK_WEEK_LABELS,
  color = "#155EEF",
}) {
  const width = 300;
  const height = 132;
  const points = buildLinePoints(values, width, height);
  const pathData = points
    .map((point, index) => `${index === 0 ? "M" : "L"} ${point.x} ${point.y}`)
    .join(" ");

  const maxValue = Math.max(...values.map((value) => toNumber(value)), 1);
  const yAxisLabels = [maxValue, maxValue / 2, 0];

  return (
    <div className="relative mt-3 w-full">
      <svg
        key={`${color}-${values.join("-")}-${hasRealWeeklyData}-${labels.join("-")}`}
        viewBox={`0 0 ${width} ${height}`}
        className="h-[138px] w-full overflow-visible"
        role="img"
      >
        {yAxisLabels.map((label, index) => {
          const y = 18 + ((height - 46) / 2) * index;

          return (
            <g key={index}>
              <text
                x="0"
                y={y + 4}
                className="fill-slate-700 text-[10px] font-bold"
              >
                {formatNumber(label)}
              </text>

              <line
                x1="34"
                x2={width - 8}
                y1={y}
                y2={y}
                stroke="#EEF2F6"
                strokeWidth="1"
              />
            </g>
          );
        })}

        {hasRealWeeklyData && (
          <>
            <path
              d={pathData}
              fill="none"
              stroke={color}
              strokeWidth="3"
              strokeLinecap="round"
              strokeLinejoin="round"
              pathLength="1"
              className="whp-line-draw"
            />

            {points.map((point, index) => (
              <g
                key={index}
                className="whp-point-pop"
                style={{ animationDelay: `${250 + index * 90}ms` }}
              >
                <circle
                  cx={point.x}
                  cy={point.y}
                  r="4.5"
                  fill={color}
                  stroke="white"
                  strokeWidth="2"
                />

                <text
                  x={point.x}
                  y={point.y - 12}
                  textAnchor="middle"
                  className="fill-slate-900 text-[11px] font-extrabold"
                >
                  {formatNumber(point.value)}
                </text>
              </g>
            ))}
          </>
        )}

        {labels.map((label, index) => {
          const x = points[index]?.x || 24;

          return (
            <text
              key={`${label}-${index}`}
              x={x}
              y={height - 5}
              textAnchor="middle"
              className="fill-slate-700 text-[10px] font-bold"
            >
              {label}
            </text>
          );
        })}
      </svg>

      {!hasRealWeeklyData && (
        <div className="absolute inset-x-4 top-9 rounded-[10px] border border-amber-200 bg-amber-50 px-3 py-2 text-center text-[11px] font-bold leading-5 text-amber-700">
          Per-week data is not returned yet.
        </div>
      )}
    </div>
  );
}

function AnimatedCard({ children, className = "", delay = 0, onClick }) {
  const Component = onClick ? "button" : "div";

  return (
    <Component
      type={onClick ? "button" : undefined}
      onClick={onClick}
      className={`${EDGE} whp-animate-card whp-hover-lift h-full w-full border border-[#E6ECF2] bg-white p-4 text-left shadow-sm ${
        onClick ? "cursor-pointer focus:outline-none focus:ring-4 focus:ring-sibs-primary-1/10" : ""
      } ${className}`}
      style={{ animationDelay: `${delay}ms` }}
    >
      {children}
    </Component>
  );
}

function TrendCard({
  type,
  title,
  subtitle,
  values,
  total,
  average,
  buffer,
  percentageRate = 0,
  color,
  accentClassName,
  hasRealWeeklyData,
  labels = FALLBACK_WEEK_LABELS,
  onClick,
  delay,
}) {
  return (
    <AnimatedCard delay={delay} onClick={() => onClick?.(type)}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="text-sm font-extrabold uppercase tracking-wide text-[#101828]">
            {title}
          </h3>

          <p className="mt-1 text-xs font-bold text-slate-500">{subtitle}</p>
        </div>

        <span className="rounded-full border border-blue-100 bg-blue-50 px-3 py-1 text-[10px] font-extrabold uppercase tracking-wide text-sibs-primary-1">
          Click
        </span>
      </div>

      <MiniLineChart
        values={values}
        color={color}
        labels={labels}
        hasRealWeeklyData={hasRealWeeklyData}
      />

      <div
        className={`mt-2 grid grid-cols-2 overflow-hidden ${EDGE} border sm:grid-cols-4 ${accentClassName}`}
      >
        <div className="border-b border-r border-inherit bg-white/70 px-2 py-3 text-center sm:border-b-0">
          <p className="text-[9px] font-extrabold text-slate-600">
            Total (6 Weeks)
          </p>

          <p className="mt-1 text-lg font-extrabold text-sibs-primary-1">
            {formatNumber(total)}
          </p>
        </div>

        <div className="border-b border-inherit bg-white/70 px-2 py-3 text-center sm:border-b-0 sm:border-r">
          <p className="text-[9px] font-extrabold text-slate-600">
            Average / Week
          </p>

          <p className="mt-1 text-lg font-extrabold text-sibs-primary-1">
            {formatNumber(average, 2)}
          </p>
        </div>

        <div className="border-r border-inherit bg-white/70 px-2 py-3 text-center">
          <p className="text-[9px] font-extrabold text-sibs-primary-1">
            Buffer HC
          </p>

          <p className="text-[9px] font-extrabold text-sibs-primary-1">
            (Ceiling)
          </p>

          <p className="mt-1 text-lg font-extrabold text-sibs-primary-1">
            {formatNumber(buffer)}
          </p>
        </div>

        <div className="bg-white/70 px-2 py-3 text-center">
          <p className="text-[9px] font-extrabold text-slate-600">
            % vs Actual HC
          </p>

          <p className={`mt-1 text-lg font-extrabold ${getRateStatusClass(percentageRate)}`}>
            {formatPercent(percentageRate, 2)}
          </p>

          <p className="mt-0.5 text-[9px] font-extrabold text-slate-500">
            Max 25%
          </p>
        </div>
      </div>
    </AnimatedCard>
  );
}

function TrainingPipelineCard({
  nho,
  fst,
  pst,
  projectedToBeEndorsed,
  delay,
  onClick,
}) {
  return (
    <AnimatedCard delay={delay} onClick={onClick}>
      <div>
        <h3 className="text-sm font-extrabold uppercase tracking-wide text-[#101828]">
          Training Pipeline
        </h3>
        <p className="mt-1 text-xs font-bold text-slate-500">
          Not Yet in Actual HC
        </p>
      </div>

      <div className="mt-4 flex items-center justify-center">
        <div className="w-full max-w-[230px]">
          <div className="whp-funnel-segment mx-auto flex h-[46px] w-full items-center justify-between rounded-t-[10px] bg-[#155EEF] px-4 text-white">
            <div>
              <p className="text-sm font-extrabold">NHO</p>
              <p className="text-[9px] font-semibold opacity-90">
                New Hire Orientation
              </p>
            </div>
            <p className="text-lg font-extrabold">{formatNumber(nho)}</p>
          </div>

          <div className="whp-funnel-segment mx-auto mt-[2px] flex h-[46px] w-[86%] items-center justify-between bg-[#16A34A] px-4 text-white">
            <div>
              <p className="text-sm font-extrabold">FST</p>
              <p className="text-[9px] font-semibold opacity-90">Week 1 to 2</p>
            </div>
            <p className="text-lg font-extrabold">{formatNumber(fst)}</p>
          </div>

          <div className="whp-funnel-segment mx-auto mt-[2px] flex h-[46px] w-[74%] items-center justify-between bg-[#F59E0B] px-4 text-white">
            <div>
              <p className="text-sm font-extrabold">PST</p>
              <p className="text-[9px] font-semibold opacity-90">Week 3 to 4</p>
            </div>
            <p className="text-lg font-extrabold">{formatNumber(pst)}</p>
          </div>

          <div className="whp-funnel-segment mx-auto mt-[2px] flex h-[46px] w-[62%] items-center justify-between rounded-b-[10px] bg-[#7C3AED] px-4 text-white">
            <div>
              <p className="text-[11px] font-extrabold">Projected</p>
              <p className="text-[9px] font-semibold opacity-90">
                To be Endorsed
              </p>
            </div>
            <p className="text-lg font-extrabold">
              {formatNumber(projectedToBeEndorsed)}
            </p>
          </div>
        </div>
      </div>

      <div className="mt-4 text-center text-xs font-extrabold text-[#155EEF]">
        View Pipeline Details →
      </div>
    </AnimatedCard>
  );
}

function HiringForecastCard({
  hiringNeeded,
  hiringRate,
  leadsToInterview,
  alreadyInterviewed,
  remainingLeadsToGenerate,
  delay,
  onClick,
}) {
  return (
    <AnimatedCard delay={delay} onClick={onClick}>
      <div>
        <h3 className="text-sm font-extrabold uppercase tracking-wide text-[#101828]">
          Hiring Forecast
        </h3>
        <p className="mt-1 text-xs font-bold text-slate-500">Current Week</p>
      </div>

      <div className="mt-5 space-y-3">
        <div className="flex items-center justify-between gap-3">
          <p className="text-xs font-bold text-slate-600">Hiring Needed</p>
          <p className="text-base font-extrabold text-red-600">
            {formatNumber(hiringNeeded)}
          </p>
        </div>

        <div className="flex items-center justify-between gap-3">
          <p className="text-xs font-bold text-slate-600">
            Hiring Rate (Conversion)
          </p>
          <p className="text-base font-extrabold text-slate-900">
            {formatPercent(hiringRate, 0)}
          </p>
        </div>

        <div className="flex items-center justify-between gap-3 border-t border-[#E6ECF2] pt-3">
          <p className="text-xs font-bold text-slate-600">
            Leads to Interview Needed
          </p>
          <p className="text-base font-extrabold text-blue-700">
            {formatNumber(leadsToInterview)}
          </p>
        </div>

        <div className="flex items-center justify-between gap-3">
          <p className="text-xs font-bold text-slate-600">
            Already Interviewed
          </p>
          <p className="text-base font-extrabold text-slate-900">
            {formatNumber(alreadyInterviewed)}
          </p>
        </div>

        <div className="flex items-center justify-between gap-3">
          <p className="text-xs font-bold text-slate-600">Remaining Leads</p>
          <p className="text-base font-extrabold text-red-600">
            {formatNumber(remainingLeadsToGenerate)}
          </p>
        </div>
      </div>

      <div className="mt-4 text-center text-xs font-extrabold text-[#155EEF]">
        View Forecast Details →
      </div>
    </AnimatedCard>
  );
}

function SummaryBox({
  label,
  value,
  decimals = 0,
  suffix = "",
  colorClass = "text-blue-700",
  borderClass = "border-blue-100",
  children,
}) {
  return (
    <div className={`${EDGE} border ${borderClass} bg-white px-4 py-3`}>
      <p className="text-xs font-extrabold uppercase text-slate-500">
        {label}
      </p>

      <p className={`mt-1 text-2xl font-extrabold ${colorClass}`}>
        {formatNumber(value, decimals)}
        {suffix}
      </p>

      {children}
    </div>
  );
}


function SimpleMetricRow({ icon, label, value, valueClassName = "text-sibs-primary-1" }) {
  return (
    <div className="flex items-center justify-between gap-4 border-b border-[#E6ECF2] py-3 last:border-b-0">
      <div className="flex min-w-0 items-center gap-3">
        <div className="flex h-9 w-12 shrink-0 items-center justify-center rounded-[10px] bg-blue-50 text-sm font-extrabold text-blue-700">
          {icon}
        </div>

        <p className="truncate text-sm font-semibold text-slate-700">{label}</p>
      </div>

      <p className={`text-base font-extrabold ${valueClassName}`}>{value}</p>
    </div>
  );
}

function TrainingAttritionCountsCard({ metrics, delay = 0 }) {
  return (
    <AnimatedCard delay={delay}>
      <div>
        <h3 className="text-sm font-extrabold text-[#101828]">
          Training Attrition Counts
        </h3>
        <p className="mt-1 text-xs font-bold text-slate-500">Past 6 Weeks</p>
      </div>

      <div className="mt-3">
        <SimpleMetricRow
          icon="IN"
          label="Interview to NHO"
          value={formatNumber(metrics.interviewToNhoCount)}
          valueClassName="text-blue-700"
        />
        <SimpleMetricRow
          icon="NF"
          label="NHO to FST"
          value={formatNumber(metrics.nhoToFstCount)}
          valueClassName="text-violet-700"
        />
        <SimpleMetricRow
          icon="FP"
          label="FST to PST"
          value={formatNumber(metrics.fstToPstCount)}
          valueClassName="text-emerald-700"
        />
        <SimpleMetricRow
          icon="NP"
          label="NHO to PST"
          value={formatNumber(metrics.nhoToPstCount)}
          valueClassName="text-red-600"
        />
      </div>
    </AnimatedCard>
  );
}

function TrainingAttritionRatesCard({ metrics, delay = 0 }) {
  const rows = [
    {
      icon: "IN",
      label: "Interview to NHO",
      rate: metrics.interviewToNhoRate,
    },
    {
      icon: "NF",
      label: "NHO to FST",
      rate: metrics.nhoToFstRate,
    },
    {
      icon: "FP",
      label: "FST to PST",
      rate: metrics.fstToPstRate,
    },
    {
      icon: "NP",
      label: "NHO to PST",
      rate: metrics.nhoToPstRate,
    },
  ];

  return (
    <AnimatedCard delay={delay}>
      <div>
        <h3 className="text-sm font-extrabold text-[#101828]">
          Training Attrition Rates
        </h3>
        <p className="mt-1 text-xs font-bold text-slate-500">
          Past 6 Weeks · Max 25%
        </p>
      </div>

      <div className="mt-3">
        {rows.map((row) => (
          <div
            key={row.label}
            className="flex items-center justify-between gap-4 border-b border-[#E6ECF2] py-3 last:border-b-0"
          >
            <div className="flex min-w-0 items-center gap-3">
              <div className="flex h-9 w-12 shrink-0 items-center justify-center rounded-[10px] bg-violet-50 text-sm font-extrabold text-violet-700">
                {row.icon}
              </div>

              <p className="truncate text-sm font-semibold text-slate-700">
                {row.label}
              </p>
            </div>

            <span
              className={`rounded-[8px] border px-3 py-1 text-sm font-extrabold ${getAttritionStatusClass(row.rate)}`}
            >
              {formatPercent(row.rate, 0)}
            </span>
          </div>
        ))}
      </div>
    </AnimatedCard>
  );
}

function CoverageSummaryCard({ coverage, delay = 0 }) {
  const total = Math.max(coverage.totalAccounts, 1);
  const fullyPercent = (coverage.fullyCovered / total) * 100;
  const atRiskPercent = (coverage.atRisk / total) * 100;
  const underPercent = (coverage.underCovered / total) * 100;

  const background = `conic-gradient(#16A34A 0 ${fullyPercent}%, #F59E0B ${fullyPercent}% ${
    fullyPercent + atRiskPercent
  }%, #EF4444 ${fullyPercent + atRiskPercent}% 100%)`;

  return (
    <AnimatedCard delay={delay}>
      <div>
        <h3 className="text-sm font-extrabold text-[#101828]">
          Coverage Summary
        </h3>
      </div>

      <div className="mt-5 grid grid-cols-1 items-center gap-5 sm:grid-cols-[150px_1fr]">
        <div className="relative mx-auto h-[132px] w-[132px] rounded-full" style={{ background }}>
          <div className="absolute inset-[28px] flex flex-col items-center justify-center rounded-full bg-white">
            <p className="text-2xl font-extrabold text-[#101828]">
              {formatNumber(coverage.totalAccounts)}
            </p>
            <p className="text-xs font-semibold text-slate-600">Accounts</p>
          </div>
        </div>

        <div className="space-y-3">
          <CoverageLegendRow
            color="bg-emerald-600"
            label="Fully Covered"
            count={coverage.fullyCovered}
            total={coverage.totalAccounts}
          />
          <CoverageLegendRow
            color="bg-amber-500"
            label="At Risk"
            count={coverage.atRisk}
            total={coverage.totalAccounts}
          />
          <CoverageLegendRow
            color="bg-red-500"
            label="Under Covered"
            count={coverage.underCovered}
            total={coverage.totalAccounts}
          />
        </div>
      </div>

      <div className="mt-4 border-t border-[#E6ECF2] pt-3 text-center text-xs font-extrabold text-red-600">
        Under Covered Accounts:{" "}
        {coverage.underCoveredAccounts.length > 0
          ? coverage.underCoveredAccounts.join(", ")
          : "None"}
      </div>
    </AnimatedCard>
  );
}

function CoverageLegendRow({ color, label, count, total }) {
  const percent = total > 0 ? (count / total) * 100 : 0;

  return (
    <div className="flex items-center justify-between gap-3 text-sm">
      <div className="flex min-w-0 items-center gap-3">
        <span className={`h-3 w-3 shrink-0 rounded-full ${color}`} />
        <span className="truncate font-semibold text-slate-700">{label}</span>
      </div>

      <span className="font-extrabold text-[#101828]">
        {formatNumber(count)} ({formatPercent(percent, 0)})
      </span>
    </div>
  );
}

function BufferBreakdownCard({ absenteeism, attrition, totalBuffer, delay = 0 }) {
  return (
    <AnimatedCard delay={delay}>
      <div className="mb-4 flex items-center gap-2">
        <h3 className="text-sm font-extrabold text-[#101828]">
          Buffer HC Breakdown
        </h3>
        <span className="text-xs font-bold text-slate-500">
          (Based on Past 6 Weeks)
        </span>
      </div>

      <div className="grid grid-cols-1 items-stretch gap-3 md:grid-cols-[1fr_auto_1fr_auto_0.75fr]">
        <BufferMiniCard
          title="Absenteeism Buffer"
          subtitle="Total Absences (6 Weeks)"
          total={absenteeism.total}
          average={absenteeism.average}
          buffer={absenteeism.buffer}
          colorClass="text-blue-700"
          bgClass="bg-blue-50/60"
          borderClass="border-blue-100"
        />

        <MathCircle symbol="+" />

        <BufferMiniCard
          title="Attrition Buffer"
          subtitle="Total Attritions (6 Weeks)"
          total={attrition.total}
          average={attrition.average}
          buffer={attrition.buffer}
          colorClass="text-violet-700"
          bgClass="bg-violet-50/60"
          borderClass="border-violet-100"
        />

        <MathCircle symbol="=" />

        <div className={`${EDGE} flex flex-col items-center justify-center border border-blue-100 bg-blue-50/60 px-4 py-5 text-center`}>
          <p className="text-sm font-extrabold uppercase text-[#101828]">
            Total Buffer HC
          </p>
          <p className="mt-1 text-xs font-bold text-slate-700">
            (Abs + Attrition)
          </p>
          <p className="mt-4 text-4xl font-extrabold text-blue-700">
            {formatNumber(totalBuffer)}
          </p>
        </div>
      </div>
    </AnimatedCard>
  );
}

function BufferMiniCard({
  title,
  subtitle,
  total,
  average,
  buffer,
  colorClass,
  bgClass,
  borderClass,
}) {
  return (
    <div className={`${EDGE} border ${borderClass} ${bgClass} p-4 text-center`}>
      <p className={`text-xs font-extrabold ${colorClass}`}>{title}</p>
      <p className="mt-2 text-xs font-semibold text-[#101828]">{subtitle}</p>
      <p className={`mt-2 text-3xl font-extrabold ${colorClass}`}>
        {formatNumber(total)}
      </p>

      <div className="mt-4 grid grid-cols-2 border-t border-slate-200 pt-3">
        <div className="border-r border-slate-200">
          <p className="text-xs font-semibold text-[#101828]">Average / Week</p>
          <p className={`mt-1 text-xl font-extrabold ${colorClass}`}>
            {formatNumber(average, 2)}
          </p>
        </div>

        <div>
          <p className="text-xs font-semibold text-[#101828]">Buffer HC</p>
          <p className="text-[10px] font-bold text-[#101828]">(EXCL NHO)</p>
          <p className={`mt-1 text-xl font-extrabold ${colorClass}`}>
            {formatNumber(buffer)}
          </p>
        </div>
      </div>
    </div>
  );
}

function MathCircle({ symbol }) {
  return (
    <div className="hidden items-center justify-center md:flex">
      <span className="flex h-9 w-9 items-center justify-center rounded-full border border-[#D8E2EE] bg-white text-xl font-extrabold text-sibs-primary-1 shadow-sm">
        {symbol}
      </span>
    </div>
  );
}


function normalizeHiringReason(value) {
  const cleanValue = String(value || "").trim();

  if (!cleanValue) return "Unspecified";

  const lowerValue = cleanValue.toLowerCase();

  if (lowerValue.includes("new")) return "New Position";
  if (lowerValue.includes("forecast")) return "Forecasted Growth";
  if (lowerValue.includes("growth")) return "Forecasted Growth";
  if (lowerValue.includes("ramp")) return "Ramp-up";
  if (lowerValue.includes("replacement")) return "Replacement";

  return cleanValue;
}

function getHiringReasonValue(item = {}) {
  return (
    item.reasonForHiring ||
    item.reason_for_hiring ||
    item.hiringReason ||
    item.hiring_reason ||
    item.requisitionReason ||
    item.requisition_reason ||
    item.prfReason ||
    item.prf_reason ||
    item.requestReason ||
    item.request_reason ||
    item.reason ||
    ""
  );
}

function getHiringReasonCount(item = {}) {
  return getNumberValue(item, [
    "reasonCount",
    "reason_count",
    "hiringReasonCount",
    "hiring_reason_count",
    "requisitionReasonCount",
    "requisition_reason_count",
    "prfCount",
    "prf_count",
    "totalPrf",
    "total_prf",
    "totalPRF",
  ]);
}

function getHiringReasonBreakdownFromRow(item = {}) {
  const possibleBreakdowns = [
    item.hiringReasonBreakdown,
    item.hiring_reason_breakdown,
    item.requisitionReasonBreakdown,
    item.requisition_reason_breakdown,
    item.reasonForHiringBreakdown,
    item.reason_for_hiring_breakdown,
  ];

  for (const value of possibleBreakdowns) {
    if (!value) continue;

    if (Array.isArray(value)) {
      return value
        .map((entry) => ({
          label: normalizeHiringReason(
            entry.label ||
              entry.reason ||
              entry.reasonForHiring ||
              entry.reason_for_hiring ||
              entry.hiringReason ||
              entry.hiring_reason,
          ),
          count: getNumberValue(entry, [
            "count",
            "total",
            "value",
            "prfCount",
            "prf_count",
          ]),
        }))
        .filter((entry) => entry.count > 0);
    }

    if (typeof value === "object") {
      return Object.entries(value)
        .map(([key, count]) => ({
          label: normalizeHiringReason(key),
          count: Number(count || 0),
        }))
        .filter((entry) => Number.isFinite(entry.count) && entry.count > 0);
    }

    if (typeof value === "string" && value.trim()) {
      try {
        return getHiringReasonBreakdownFromRow({
          hiringReasonBreakdown: JSON.parse(value),
        });
      } catch {
        return [];
      }
    }
  }

  return [];
}

function HiringReasonChartCard({ reasons = [], delay = 0 }) {
  const total = reasons.reduce((sum, item) => sum + toNumber(item.count), 0);
  const safeTotal = Math.max(total, 1);

  const palette = [
    { dot: "bg-blue-600", color: "#2563EB" },
    { dot: "bg-cyan-500", color: "#06B6D4" },
    { dot: "bg-emerald-500", color: "#22C55E" },
    { dot: "bg-amber-500", color: "#F59E0B" },
    { dot: "bg-violet-500", color: "#8B5CF6" },
    { dot: "bg-red-500", color: "#EF4444" },
  ];

  let accumulatedPercent = 0;

  const gradientStops =
    reasons.length > 0
      ? reasons
          .map((item, index) => {
            const percent = (toNumber(item.count) / safeTotal) * 100;
            const start = accumulatedPercent;
            const end = accumulatedPercent + percent;
            accumulatedPercent = end;

            return `${palette[index % palette.length].color} ${start}% ${end}%`;
          })
          .join(", ")
      : "#E5E7EB 0% 100%";

  return (
    <AnimatedCard delay={delay}>
      <div>
        <h3 className="text-sm font-extrabold text-[#101828]">
          Requisition by Reason for Hiring
        </h3>
        <p className="mt-1 text-xs font-bold text-slate-500">
          Based on Filtered Account
        </p>
      </div>

      <div className="mt-5 grid grid-cols-1 items-center gap-5 sm:grid-cols-[150px_1fr]">
        <div
          className="relative mx-auto h-[132px] w-[132px] rounded-full"
          style={{ background: `conic-gradient(${gradientStops})` }}
        >
          <div className="absolute inset-[28px] flex flex-col items-center justify-center rounded-full bg-white">
            <p className="text-2xl font-extrabold text-[#101828]">
              {formatNumber(total)}
            </p>
            <p className="text-xs font-semibold text-slate-600">PRF</p>
          </div>
        </div>

        <div className="space-y-3">
          {reasons.length > 0 ? (
            reasons.map((item, index) => {
              const percent = total > 0 ? (toNumber(item.count) / total) * 100 : 0;

              return (
                <div
                  key={`${item.label}-${index}`}
                  className="flex items-center justify-between gap-3 text-sm"
                >
                  <div className="flex min-w-0 items-center gap-3">
                    <span
                      className={`h-3 w-3 shrink-0 rounded-full ${
                        palette[index % palette.length].dot
                      }`}
                    />
                    <span className="truncate font-semibold text-slate-700">
                      {item.label}
                    </span>
                  </div>

                  <span className="font-extrabold text-[#101828]">
                    {formatNumber(item.count)}{" "}
                    <span className="text-xs font-bold text-slate-500">
                      ({formatPercent(percent, 0)})
                    </span>
                  </span>
                </div>
              );
            })
          ) : (
            <div className="rounded-[10px] border border-[#E6ECF2] bg-[#F8FAFC] px-4 py-5 text-center text-sm font-bold text-slate-500">
              No requisition reason data available.
            </div>
          )}
        </div>
      </div>
    </AnimatedCard>
  );
}


function EffectiveCoverageCard({ coverage, delay = 0 }) {
  const maxValue = Math.max(coverage.effectiveDemand, coverage.projectedCoverage, 1);
  const effectiveWidth = Math.min(100, (coverage.effectiveDemand / maxValue) * 100);
  const projectedWidth = Math.min(100, (coverage.projectedCoverage / maxValue) * 100);

  return (
    <AnimatedCard delay={delay}>
      <div className="mb-5 flex items-center gap-2">
        <h3 className="text-sm font-extrabold text-[#101828]">
          Effective Demand vs Projected Coverage
        </h3>
      </div>

      <div className="space-y-5">
        <BarComparisonRow
          label="Effective Demand"
          subtitle="(Required + Buffer)"
          value={coverage.effectiveDemand}
          width={effectiveWidth}
          barClassName="bg-blue-700"
        />

        <BarComparisonRow
          label="Projected Coverage"
          subtitle="(Actual + Projected)"
          value={coverage.projectedCoverage}
          width={projectedWidth}
          barClassName="bg-emerald-600"
        />

        <div className="rounded-[8px] border border-[#E6ECF2] bg-[#F8FAFC] px-4 py-3 text-center">
          <span className="text-sm font-semibold text-[#101828]">
            Gap (Hiring Needed)
          </span>
          <span className="ml-6 text-lg font-extrabold text-red-600">
            {formatNumber(coverage.gap)}
          </span>
        </div>
      </div>
    </AnimatedCard>
  );
}

function BarComparisonRow({ label, subtitle, value, width, barClassName }) {
  return (
    <div className="grid grid-cols-[145px_1fr_64px] items-center gap-3">
      <div>
        <p className="text-xs font-bold text-[#101828]">{label}</p>
        <p className="text-xs font-semibold text-slate-600">{subtitle}</p>
      </div>

      <div className="h-7 overflow-hidden rounded-sm bg-slate-100">
        <div
          className={`h-full rounded-sm ${barClassName}`}
          style={{ width: `${width}%` }}
        />
      </div>

      <p className="text-lg font-extrabold text-[#101828]">
        {formatNumber(value)}
      </p>
    </div>
  );
}


function DetailModal({
  open,
  type,
  rows = [],
  summary,
  weekLabels = FALLBACK_WEEK_LABELS,
  onClose,
}) {
  useEffect(() => {
    if (!open) return undefined;

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    function handleKeyDown(e) {
      if (e.key === "Escape") onClose?.();
    }

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = originalOverflow;
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [open, onClose]);

  if (!open || !type || typeof document === "undefined") return null;

  const isAbsenteeism = type === "absenteeism";
  const isAttrition = type === "attrition";
  const isTraining = type === "training";
  const isForecast = type === "forecast";

  const title = isAbsenteeism
    ? "Absenteeism Details"
    : isAttrition
      ? "Attrition Details"
      : isTraining
        ? "Training Pipeline Details"
        : "Hiring Forecast Details";

  const description = isAbsenteeism
    ? "Specific account breakdown for actual absenteeism."
    : isAttrition
      ? "Specific account breakdown for actual attrition."
      : isTraining
        ? "NHO, FST, PST, and projected endorsement details by account."
        : "Hiring needed, hiring rate, leads, and remaining lead generation by account.";

  const colorClass = isAbsenteeism
    ? "text-blue-700"
    : isAttrition
      ? "text-violet-700"
      : isTraining
        ? "text-emerald-700"
        : "text-orange-700";

  const bgClass = isAbsenteeism
    ? "bg-blue-50"
    : isAttrition
      ? "bg-violet-50"
      : isTraining
        ? "bg-emerald-50"
        : "bg-orange-50";

  const borderClass = isAbsenteeism
    ? "border-blue-100"
    : isAttrition
      ? "border-violet-100"
      : isTraining
        ? "border-emerald-100"
        : "border-orange-100";

  const trendRows =
    isAbsenteeism || isAttrition
      ? rows
          .map((item) => {
            const total = getRowTotal(item, type);
            const average = total / 6;
            const buffer = Math.ceil(average);
            const actualHeadcount = getActualHeadcount(item);
            const percentage =
              actualHeadcount > 0 ? (total / actualHeadcount) * 100 : 0;
            const weekly = getPerWeekSeries(item, type);

            return {
              ...item,
              detailTotal: total,
              detailAverage: average,
              detailBuffer: buffer,
              detailActualHeadcount: actualHeadcount,
              detailPercentage: percentage,
              detailSeries: weekly.values,
              hasRealWeeklyData: weekly.hasRealWeeklyData,
            };
          })
          .sort((a, b) => Number(b.detailTotal || 0) - Number(a.detailTotal || 0))
      : [];

  const trainingRows = isTraining
    ? rows
        .map((item) => ({
          ...item,
          training: getTrainingMetrics(item),
        }))
        .sort(
          (a, b) =>
            b.training.totalTrainingPipeline - a.training.totalTrainingPipeline ||
            String(a.account || a.accountName || "").localeCompare(
              String(b.account || b.accountName || ""),
            ),
        )
    : [];

  const forecastRows = isForecast
    ? rows
        .map((item) => ({
          ...item,
          forecast: getHiringMetrics(item),
        }))
        .sort((a, b) => b.forecast.hiringNeeded - a.forecast.hiringNeeded)
    : [];

  return createPortal(
    <div className="fixed inset-0 z-[2147483647] isolate flex items-center justify-center bg-slate-950/55 px-3 py-4">
      <div className="whp-modal-in flex max-h-[92vh] w-full max-w-6xl flex-col overflow-hidden rounded-[16px] bg-white shadow-2xl">
        <div className="flex items-start justify-between gap-4 border-b border-[#E6ECF2] px-5 py-4">
          <div className="min-w-0">
            <div
              className={`inline-flex rounded-full border px-3 py-1 text-xs font-extrabold uppercase tracking-wide ${borderClass} ${bgClass} ${colorClass}`}
            >
              Weekly Hiring Plan Report
            </div>

            <h2 className="mt-3 text-xl font-extrabold text-sibs-primary-1">
              {title}
            </h2>

            <p className="mt-1 text-sm font-semibold text-slate-500">
              {description}
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-[#E6ECF2] bg-white text-slate-500 transition hover:bg-slate-50 hover:text-slate-800"
            aria-label="Close details"
          >
            <X size={20} />
          </button>
        </div>

        <div className="grid grid-cols-1 gap-3 border-b border-[#E6ECF2] bg-[#F8FAFC] px-5 py-4 sm:grid-cols-2 xl:grid-cols-4">
          {(isAbsenteeism || isAttrition) && (
            <>
              <SummaryBox
                label={isAbsenteeism ? "Total Absences" : "Total Attritions"}
                value={summary?.total}
                colorClass={colorClass}
                borderClass={borderClass}
              />

              <SummaryBox
                label="Average / Week"
                value={summary?.average}
                decimals={2}
                colorClass={colorClass}
                borderClass={borderClass}
              />

              <SummaryBox
                label="Buffer HC Ceiling"
                value={summary?.buffer}
                colorClass={colorClass}
                borderClass={borderClass}
              />

              <SummaryBox
                label={`${isAbsenteeism ? "Absenteeism" : "Attrition"} % vs Actual HC`}
                value={summary?.percentage}
                decimals={2}
                suffix="%"
                colorClass={getRateStatusClass(summary?.percentage)}
                borderClass={borderClass}
              >
                <p className="mt-1 text-xs font-bold text-slate-500">
                  Formula: Total / Actual HC. Max 25%.
                </p>
              </SummaryBox>
            </>
          )}

          {isTraining && (
            <>
              <SummaryBox
                label="NHO"
                value={summary?.nho}
                colorClass="text-blue-700"
                borderClass="border-blue-100"
              />

              <SummaryBox
                label="FST"
                value={summary?.fst}
                colorClass="text-emerald-700"
                borderClass="border-emerald-100"
              />

              <SummaryBox
                label="PST"
                value={summary?.pst}
                colorClass="text-orange-700"
                borderClass="border-orange-100"
              />

              <SummaryBox
                label="Projected Endorsed"
                value={summary?.projectedToBeEndorsed}
                colorClass="text-violet-700"
                borderClass="border-violet-100"
              />
            </>
          )}

          {isForecast && (
            <>
              <SummaryBox
                label="Hiring Needed"
                value={summary?.hiringNeeded}
                colorClass="text-red-600"
                borderClass="border-red-100"
              />

              <SummaryBox
                label="Hiring Rate"
                value={summary?.hiringRate}
                suffix="%"
                decimals={0}
                colorClass="text-slate-900"
                borderClass="border-slate-200"
              />

              <SummaryBox
                label="Leads Needed"
                value={summary?.leadsToInterview}
                colorClass="text-blue-700"
                borderClass="border-blue-100"
              />

              <SummaryBox
                label="Remaining Leads"
                value={summary?.remainingLeadsToGenerate}
                colorClass="text-red-600"
                borderClass="border-red-100"
              />
            </>
          )}
        </div>

        {(isAbsenteeism || isAttrition) && !summary?.hasRealWeeklyData && (
          <div className="border-b border-amber-200 bg-amber-50 px-5 py-3 text-sm font-bold text-amber-700">
            <div className="flex items-start gap-2">
              <Info size={18} className="mt-0.5 shrink-0" />
              <p>
                The API is only returning the 6-week total. To show week-by-week
                movement, return weekly breakdown fields like{" "}
                <span className="font-extrabold">absenteeismWeeklyCounts</span>{" "}
                or <span className="font-extrabold">attritionWeeklyCounts</span>.
              </p>
            </div>
          </div>
        )}

        <div className="min-h-0 flex-1 overflow-auto p-5">
          {(isAbsenteeism || isAttrition) && (
            <TrendDetailsTable
              rows={trendRows}
              type={type}
              colorClass={colorClass}
              summary={summary}
              weekLabels={weekLabels}
              isAbsenteeism={isAbsenteeism}
            />
          )}

          {isTraining && <TrainingDetailsTable rows={trainingRows} />}

          {isForecast && <ForecastDetailsTable rows={forecastRows} />}
        </div>
      </div>
    </div>,
    document.body,
  );
}

function TrendDetailsTable({
  rows = [],
  type,
  colorClass,
  summary,
  weekLabels = FALLBACK_WEEK_LABELS,
  isAbsenteeism,
}) {
  const totalLabel =
    type === "absenteeism" ? "Total Absences" : "Total Attritions";

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[1040px] border-separate border-spacing-0 overflow-hidden rounded-[12px] border border-[#E1E7EF] text-left">
        <thead>
          <tr className="bg-[#F5F7FA] text-xs font-extrabold uppercase tracking-wide text-sibs-primary-1">
            <th className="border-b border-[#E1E7EF] px-4 py-3">Account</th>
            <th className="border-b border-[#E1E7EF] px-4 py-3">Cluster</th>
            <th className="border-b border-[#E1E7EF] px-4 py-3 text-center">
              {totalLabel}
            </th>
            <th className="border-b border-[#E1E7EF] px-4 py-3 text-center">
              Average / Week
            </th>
            <th className="border-b border-[#E1E7EF] px-4 py-3 text-center">
              Buffer HC
            </th>
            <th className="border-b border-[#E1E7EF] px-4 py-3 text-center">
              Actual HC
            </th>
            <th className="border-b border-[#E1E7EF] px-4 py-3 text-center">
              {isAbsenteeism ? "Absenteeism %" : "Attrition %"}
            </th>

            <th className="border-b border-[#E1E7EF] px-4 py-3 text-center">
              Buffer %
            </th>

            {weekLabels.map((label) => (
              <th
                key={label}
                className="border-b border-[#E1E7EF] px-4 py-3 text-center"
              >
                {label}
              </th>
            ))}
          </tr>
        </thead>

        <tbody>
          {rows.map((item, index) => (
            <tr
              key={`${type}-${item.id || item.account || index}`}
              className="transition hover:bg-[#FAFBFC]"
            >
              <td className="border-b border-[#EDF1F5] px-4 py-3">
                <p className="text-sm font-extrabold text-[#101828]">
                  {item.account || item.accountName || "—"}
                </p>
              </td>

              <td className="border-b border-[#EDF1F5] px-4 py-3">
                <p className="text-sm font-semibold text-slate-600">
                  {item.cluster || item.clusterName || "—"}
                </p>
              </td>

              <td
                className={`border-b border-[#EDF1F5] px-4 py-3 text-center text-sm font-extrabold ${colorClass}`}
              >
                {formatNumber(item.detailTotal)}
              </td>

              <td className="border-b border-[#EDF1F5] px-4 py-3 text-center text-sm font-bold text-slate-700">
                {formatNumber(item.detailAverage, 2)}
              </td>

              <td className="border-b border-[#EDF1F5] px-4 py-3 text-center text-sm font-extrabold text-sibs-primary-1">
                {formatNumber(item.detailBuffer)}
              </td>

              <td className="border-b border-[#EDF1F5] px-4 py-3 text-center text-sm font-bold text-slate-700">
                {formatNumber(item.detailActualHeadcount)}
              </td>

              <td
                className={`border-b border-[#EDF1F5] px-4 py-3 text-center text-sm font-extrabold ${getRateStatusClass(item.detailPercentage)}`}
              >
                {formatPercent(item.detailPercentage, 2)}
              </td>

              <td
                className={`border-b border-[#EDF1F5] px-4 py-3 text-center text-sm font-extrabold ${getSignedPercentClass(
                  getExcelBufferPercentage(item),
                )}`}
              >
                {formatSignedPercent(getExcelBufferPercentage(item), 2)}
              </td>

              {weekLabels.map((label, weekIndex) => (
                <td
                  key={label}
                  className="border-b border-[#EDF1F5] px-4 py-3 text-center text-sm font-bold text-slate-700"
                >
                  {item.hasRealWeeklyData
                    ? formatNumber(item.detailSeries[weekIndex])
                    : "—"}
                </td>
              ))}
            </tr>
          ))}

          {!rows.length && (
            <tr>
              <td
                colSpan={14}
                className="px-4 py-10 text-center text-sm font-bold text-slate-500"
              >
                No details available.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

function TrainingDetailsTable({ rows = [] }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[760px] border-separate border-spacing-0 overflow-hidden rounded-[12px] border border-[#E1E7EF] text-left">
        <thead>
          <tr className="bg-[#F5F7FA] text-xs font-extrabold uppercase tracking-wide text-sibs-primary-1">
            <th className="border-b border-[#E1E7EF] px-4 py-3">Account</th>
            <th className="border-b border-[#E1E7EF] px-4 py-3">Cluster</th>
            <th className="border-b border-[#E1E7EF] px-4 py-3 text-center">
              NHO
            </th>
            <th className="border-b border-[#E1E7EF] px-4 py-3 text-center">
              FST
            </th>
            <th className="border-b border-[#E1E7EF] px-4 py-3 text-center">
              PST
            </th>
            <th className="border-b border-[#E1E7EF] px-4 py-3 text-center">
              Projected Endorsed
            </th>
          </tr>
        </thead>

        <tbody>
          {rows.map((item, index) => (
            <tr
              key={`training-${item.id || item.account || index}`}
              className="transition hover:bg-[#FAFBFC]"
            >
              <td className="border-b border-[#EDF1F5] px-4 py-3 text-sm font-extrabold text-[#101828]">
                {item.account || item.accountName || "—"}
              </td>

              <td className="border-b border-[#EDF1F5] px-4 py-3 text-sm font-semibold text-slate-600">
                {item.cluster || item.clusterName || "—"}
              </td>

              <td className="border-b border-[#EDF1F5] px-4 py-3 text-center text-sm font-extrabold text-blue-700">
                {formatNumber(item.training.nhoCount)}
              </td>

              <td className="border-b border-[#EDF1F5] px-4 py-3 text-center text-sm font-extrabold text-emerald-700">
                {formatNumber(item.training.fstCount)}
              </td>

              <td className="border-b border-[#EDF1F5] px-4 py-3 text-center text-sm font-extrabold text-orange-700">
                {formatNumber(item.training.pstCount)}
              </td>

              <td className="border-b border-[#EDF1F5] px-4 py-3 text-center text-sm font-extrabold text-violet-700">
                {formatNumber(item.training.projectedToBeEndorsed)}
              </td>
            </tr>
          ))}

          {!rows.length && (
            <tr>
              <td
                colSpan={6}
                className="px-4 py-10 text-center text-sm font-bold text-slate-500"
              >
                No training pipeline details available.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

function ForecastDetailsTable({ rows = [] }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[880px] border-separate border-spacing-0 overflow-hidden rounded-[12px] border border-[#E1E7EF] text-left">
        <thead>
          <tr className="bg-[#F5F7FA] text-xs font-extrabold uppercase tracking-wide text-sibs-primary-1">
            <th className="border-b border-[#E1E7EF] px-4 py-3">Account</th>
            <th className="border-b border-[#E1E7EF] px-4 py-3">Cluster</th>
            <th className="border-b border-[#E1E7EF] px-4 py-3 text-center">
              Hiring Needed
            </th>
            <th className="border-b border-[#E1E7EF] px-4 py-3 text-center">
              Hiring Rate
            </th>
            <th className="border-b border-[#E1E7EF] px-4 py-3 text-center">
              Leads Needed
            </th>
            <th className="border-b border-[#E1E7EF] px-4 py-3 text-center">
              Interviewed
            </th>
            <th className="border-b border-[#E1E7EF] px-4 py-3 text-center">
              Hired
            </th>
            <th className="border-b border-[#E1E7EF] px-4 py-3 text-center">
              Remaining Leads
            </th>
          </tr>
        </thead>

        <tbody>
          {rows.map((item, index) => (
            <tr
              key={`forecast-${item.id || item.account || index}`}
              className="transition hover:bg-[#FAFBFC]"
            >
              <td className="border-b border-[#EDF1F5] px-4 py-3 text-sm font-extrabold text-[#101828]">
                {item.account || item.accountName || "—"}
              </td>

              <td className="border-b border-[#EDF1F5] px-4 py-3 text-sm font-semibold text-slate-600">
                {item.cluster || item.clusterName || "—"}
              </td>

              <td className="border-b border-[#EDF1F5] px-4 py-3 text-center text-sm font-extrabold text-red-600">
                {formatNumber(item.forecast.hiringNeeded)}
              </td>

              <td className="border-b border-[#EDF1F5] px-4 py-3 text-center text-sm font-extrabold text-slate-900">
                {formatPercent(item.forecast.hiringRate, 0)}
              </td>

              <td className="border-b border-[#EDF1F5] px-4 py-3 text-center text-sm font-extrabold text-blue-700">
                {formatNumber(item.forecast.leadsToInterview)}
              </td>

              <td className="border-b border-[#EDF1F5] px-4 py-3 text-center text-sm font-extrabold text-slate-900">
                {formatNumber(item.forecast.interviewCount)}
              </td>

              <td className="border-b border-[#EDF1F5] px-4 py-3 text-center text-sm font-extrabold text-emerald-700">
                {formatNumber(item.forecast.hiredCount)}
              </td>

              <td className="border-b border-[#EDF1F5] px-4 py-3 text-center text-sm font-extrabold text-red-600">
                {formatNumber(item.forecast.remainingLeadsToGenerate)}
              </td>
            </tr>
          ))}

          {!rows.length && (
            <tr>
              <td
                colSpan={8}
                className="px-4 py-10 text-center text-sm font-bold text-slate-500"
              >
                No hiring forecast details available.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

export default function PercentageRiskGraphTable({
  filteredPlans = [],
  activeWeek = null,
}) {
  const [activeDetailsType, setActiveDetailsType] = useState("");

  const validPlans = useMemo(
    () => (filteredPlans || []).filter((item) => !item.isAssignedEmptyRow),
    [filteredPlans],
  );

  const weekLabels = useMemo(
    () => buildWeekLabels(activeWeek, validPlans),
    [activeWeek, validPlans],
  );

  const data = useMemo(() => {
    const absenteeismTotal = validPlans.reduce(
      (sum, item) => sum + getRowTotal(item, "absenteeism"),
      0,
    );

    const attritionTotal = validPlans.reduce(
      (sum, item) => sum + getRowTotal(item, "attrition"),
      0,
    );

    const actualHeadcountTotal = validPlans.reduce(
      (sum, item) => sum + getActualHeadcount(item),
      0,
    );

    const absenteeismAggregate = buildAggregateTrend(
      validPlans,
      "absenteeism",
    );

    const attritionAggregate = buildAggregateTrend(validPlans, "attrition");

    const absenteeismPercentage =
      actualHeadcountTotal > 0
        ? (absenteeismTotal / actualHeadcountTotal) * 100
        : 0;

    const attritionPercentage =
      actualHeadcountTotal > 0
        ? (attritionTotal / actualHeadcountTotal) * 100
        : 0;

    const training = validPlans.reduce(
      (sum, item) => {
        const metrics = getTrainingMetrics(item);

        sum.nho += metrics.nhoCount;
        sum.fst += metrics.fstCount;
        sum.pst += metrics.pstCount;
        sum.projectedToBeEndorsed += metrics.projectedToBeEndorsed;

        return sum;
      },
      {
        nho: 0,
        fst: 0,
        pst: 0,
        projectedToBeEndorsed: 0,
      },
    );

    const forecastBase = validPlans.reduce(
      (sum, item) => {
        const metrics = getHiringMetrics(item);

        sum.hiringNeeded += metrics.hiringNeeded;
        sum.leadsToInterview += metrics.leadsToInterview;
        sum.alreadyInterviewed += metrics.interviewCount;
        sum.hiredCount += metrics.hiredCount;

        return sum;
      },
      {
        hiringNeeded: 0,
        leadsToInterview: 0,
        alreadyInterviewed: 0,
        hiredCount: 0,
      },
    );

    const hiringRate =
      forecastBase.alreadyInterviewed > 0
        ? (forecastBase.hiredCount / forecastBase.alreadyInterviewed) * 100
        : 0;

    const forecast = {
      ...forecastBase,
      hiringRate,
      remainingLeadsToGenerate: Math.max(
        0,
        forecastBase.leadsToInterview - forecastBase.alreadyInterviewed,
      ),
    };

    const stageBase = validPlans.reduce(
      (sum, item) => {
        const metrics = getStageAttritionMetrics(item);

        sum.interviewCount += metrics.interviewCount;
        sum.nhoCount += metrics.nhoCount;
        sum.fstCount += metrics.fstCount;
        sum.pstCount += metrics.pstCount;
        sum.interviewToNhoCount += metrics.interviewToNhoCount;
        sum.nhoToFstCount += metrics.nhoToFstCount;
        sum.fstToPstCount += metrics.fstToPstCount;
        sum.nhoToPstCount += metrics.nhoToPstCount;
        sum.signedInterviewToNhoCount += metrics.signedInterviewToNhoCount;
        sum.signedNhoToFstCount += metrics.signedNhoToFstCount;
        sum.signedFstToPstCount += metrics.signedFstToPstCount;
        sum.signedNhoToPstCount += metrics.signedNhoToPstCount;

        return sum;
      },
      {
        interviewCount: 0,
        nhoCount: 0,
        fstCount: 0,
        pstCount: 0,
        interviewToNhoCount: 0,
        nhoToFstCount: 0,
        fstToPstCount: 0,
        nhoToPstCount: 0,
        signedInterviewToNhoCount: 0,
        signedNhoToFstCount: 0,
        signedFstToPstCount: 0,
        signedNhoToPstCount: 0,
      },
    );

    const trainingAttrition = {
      ...stageBase,
      interviewToNhoRate: getStageRate(
        stageBase.signedInterviewToNhoCount,
        stageBase.interviewCount,
      ),
      nhoToFstRate: getStageRate(stageBase.signedNhoToFstCount, stageBase.nhoCount),
      fstToPstRate: getStageRate(stageBase.signedFstToPstCount, stageBase.fstCount),
      nhoToPstRate: getStageRate(stageBase.signedNhoToPstCount, stageBase.nhoCount),
    };

    const coverageBase = validPlans.reduce(
      (sum, item) => {
        const coverageStatus = getRowCoverageStatus(item);
        const accountName = item.account || item.accountName || item.account_name || "—";

        sum.effectiveDemand += coverageStatus.effectiveDemand;
        sum.projectedCoverage += coverageStatus.projectedCoverage;

        if (coverageStatus.status === "fullyCovered") {
          sum.fullyCovered += 1;
        } else if (coverageStatus.status === "atRisk") {
          sum.atRisk += 1;
        } else {
          sum.underCovered += 1;
          if (accountName && accountName !== "—") {
            sum.underCoveredAccounts.push(accountName);
          }
        }

        return sum;
      },
      {
        totalAccounts: validPlans.length,
        fullyCovered: 0,
        atRisk: 0,
        underCovered: 0,
        underCoveredAccounts: [],
        effectiveDemand: 0,
        projectedCoverage: 0,
      },
    );

    const coverage = {
      ...coverageBase,
      gap: Math.max(0, coverageBase.effectiveDemand - coverageBase.projectedCoverage),
    };

    const hiringReasonMap = new Map();

    validPlans.forEach((item) => {
      const rowBreakdown = getHiringReasonBreakdownFromRow(item);

      if (rowBreakdown.length > 0) {
        rowBreakdown.forEach((entry) => {
          const label = normalizeHiringReason(entry.label);
          hiringReasonMap.set(
            label,
            toNumber(hiringReasonMap.get(label)) + toNumber(entry.count),
          );
        });

        return;
      }

      const reason = normalizeHiringReason(getHiringReasonValue(item));
      const directCount = getHiringReasonCount(item);
      const count = directCount > 0 ? directCount : reason === "Unspecified" ? 0 : 1;

      if (count > 0) {
        hiringReasonMap.set(reason, toNumber(hiringReasonMap.get(reason)) + count);
      }
    });

    const hiringReasons = Array.from(hiringReasonMap.entries())
      .map(([label, count]) => ({
        label,
        count,
      }))
      .sort((a, b) => toNumber(b.count) - toNumber(a.count));

    return {
      absenteeism: {
        total: absenteeismTotal,
        average: absenteeismTotal / 6,
        buffer: Math.ceil(absenteeismTotal / 6),
        percentage: absenteeismPercentage,
        actualHeadcountTotal,
        series: absenteeismAggregate.values,
        hasRealWeeklyData: absenteeismAggregate.hasRealWeeklyData,
      },
      attrition: {
        total: attritionTotal,
        average: attritionTotal / 6,
        buffer: Math.ceil(attritionTotal / 6),
        percentage: attritionPercentage,
        actualHeadcountTotal,
        series: attritionAggregate.values,
        hasRealWeeklyData: attritionAggregate.hasRealWeeklyData,
      },
      training,
      forecast,
      trainingAttrition,
      coverage,
      hiringReasons,
    };
  }, [validPlans]);

  if (!validPlans.length) {
    return (
      <div className="bg-white p-4 sm:p-5">
        <div
          className={`${EDGE} border border-[#E6ECF2] bg-[#F8FAFC] px-5 py-12 text-center text-sm font-bold text-gray-500`}
        >
          No weekly hiring data available for the selected filter.
        </div>
      </div>
    );
  }

  return (
    <>
      <style>
        {`
          @keyframes whpFadeUp {
            from {
              opacity: 0;
              transform: translateY(18px);
            }
            to {
              opacity: 1;
              transform: translateY(0);
            }
          }

          @keyframes whpModalIn {
            from {
              opacity: 0;
              transform: translateY(14px) scale(0.98);
            }
            to {
              opacity: 1;
              transform: translateY(0) scale(1);
            }
          }

          @keyframes whpLineDraw {
            from {
              stroke-dashoffset: 1;
            }
            to {
              stroke-dashoffset: 0;
            }
          }

          @keyframes whpPointPop {
            0% {
              opacity: 0;
              transform: scale(0.45);
            }
            70% {
              opacity: 1;
              transform: scale(1.14);
            }
            100% {
              opacity: 1;
              transform: scale(1);
            }
          }

          .whp-animate-card {
            animation: whpFadeUp 0.45s ease-out both;
          }

          .whp-hover-lift {
            transition:
              transform 0.2s ease,
              box-shadow 0.2s ease,
              border-color 0.2s ease;
          }

          .whp-hover-lift:hover {
            transform: translateY(-3px);
            box-shadow: 0 14px 32px rgba(15, 23, 42, 0.08);
            border-color: rgba(13, 70, 118, 0.25);
          }

          .whp-line-draw {
            stroke-dasharray: 1;
            stroke-dashoffset: 1;
            animation: whpLineDraw 1s ease-out forwards;
          }

          .whp-point-pop {
            opacity: 0;
            transform-box: fill-box;
            transform-origin: center;
            animation: whpPointPop 0.35s ease-out both;
          }

          .whp-funnel-segment {
            transition:
              transform 0.18s ease,
              filter 0.18s ease;
          }

          .whp-funnel-segment:hover {
            transform: scale(1.02);
            filter: brightness(1.04);
          }

          .whp-modal-in {
            animation: whpModalIn 0.22s ease-out both;
          }
        `}
      </style>

      <div className="bg-white p-4 sm:p-5">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
          <TrendCard
            type="absenteeism"
            title="Absenteeism Trend"
            subtitle="Past 6 Weeks Actual"
            values={data.absenteeism.series}
            total={data.absenteeism.total}
            average={data.absenteeism.average}
            buffer={data.absenteeism.buffer}
            percentageRate={data.absenteeism.percentage}
            color="#155EEF"
            accentClassName="border-blue-100 bg-blue-50"
            hasRealWeeklyData={data.absenteeism.hasRealWeeklyData}
            labels={weekLabels}
            onClick={setActiveDetailsType}
            delay={0}
          />

          <TrendCard
            type="attrition"
            title="Attrition Trend"
            subtitle="Past 6 Weeks Actual"
            values={data.attrition.series}
            total={data.attrition.total}
            average={data.attrition.average}
            buffer={data.attrition.buffer}
            percentageRate={data.attrition.percentage}
            color="#6938EF"
            accentClassName="border-violet-100 bg-violet-50"
            hasRealWeeklyData={data.attrition.hasRealWeeklyData}
            labels={weekLabels}
            onClick={setActiveDetailsType}
            delay={90}
          />

          <TrainingPipelineCard
            nho={data.training.nho}
            fst={data.training.fst}
            pst={data.training.pst}
            projectedToBeEndorsed={data.training.projectedToBeEndorsed}
            onClick={() => setActiveDetailsType("training")}
            delay={180}
          />

          <HiringForecastCard
            hiringNeeded={data.forecast.hiringNeeded}
            hiringRate={data.forecast.hiringRate}
            leadsToInterview={data.forecast.leadsToInterview}
            alreadyInterviewed={data.forecast.alreadyInterviewed}
            remainingLeadsToGenerate={data.forecast.remainingLeadsToGenerate}
            onClick={() => setActiveDetailsType("forecast")}
            delay={270}
          />
        </div>

        <div className="mt-4 grid grid-cols-1 gap-4 xl:grid-cols-[1fr_1fr_1.25fr]">
          <TrainingAttritionCountsCard
            metrics={data.trainingAttrition}
            delay={320}
          />

          <TrainingAttritionRatesCard
            metrics={data.trainingAttrition}
            delay={380}
          />

          <CoverageSummaryCard coverage={data.coverage} delay={440} />
        </div>

        <div className="mt-4 grid grid-cols-1 gap-4 xl:grid-cols-[1.35fr_1fr]">
          <BufferBreakdownCard
            absenteeism={data.absenteeism}
            attrition={data.attrition}
            totalBuffer={data.absenteeism.buffer + data.attrition.buffer}
            delay={500}
          />

          <HiringReasonChartCard reasons={data.hiringReasons} delay={560} />
        </div>
      </div>

      <DetailModal
        open={!!activeDetailsType}
        type={activeDetailsType}
        rows={validPlans}
        summary={activeDetailsType ? data[activeDetailsType] : null}
        weekLabels={weekLabels}
        onClose={() => setActiveDetailsType("")}
      />
    </>
  );
}
