import { OUTCOME, RESPONSE_SOURCE, SURVEY_STATUS } from "./constants.js";
import { normalizeCandidateExperienceRecord } from "./normalizeCandidateExperience.js";

export function getCandidateExperienceMetrics(records = []) {
  const normalized = records.map(normalizeCandidateExperienceRecord);
  const totalCases = normalized.length;
  const completed = normalized.filter((item) => item.outcome === OUTCOME.COMPLETED).length;
  const dropOffs = normalized.filter((item) => item.outcome === OUTCOME.DROP_OFF).length;
  const surveysSent = normalized.filter((item) => [SURVEY_STATUS.SENT, SURVEY_STATUS.OPENED, SURVEY_STATUS.SUBMITTED].includes(item.surveyStatus)).length;
  const responses = normalized.filter((item) => item.responseSource && item.experienceRating > 0);
  const responsesReceived = responses.length;
  const averageRating = responsesReceived
    ? (responses.reduce((sum, item) => sum + item.experienceRating, 0) / responsesReceived).toFixed(1)
    : "0.0";
  const positiveRatings = responses.filter((item) => item.experienceRating >= 4).length;
  const lowRatings = responses.filter((item) => item.experienceRating <= 2).length;
  const manualResponses = responses.filter((item) => item.responseSource === RESPONSE_SOURCE.TA_MANUAL).length;
  const candidateSurveyResponses = responses.filter((item) => item.responseSource === RESPONSE_SOURCE.CANDIDATE_SURVEY).length;
  const responseRate = surveysSent > 0 ? Math.round((candidateSurveyResponses / surveysSent) * 100) : 0;
  return {
    totalCases,
    completed,
    dropOffs,
    surveysSent,
    responsesReceived,
    averageRating,
    positiveRatings,
    lowRatings,
    manualResponses,
    candidateSurveyResponses,
    responseRate,
  };
}

export function buildDropOffStageBreakdown(records = []) {
  const counts = new Map();
  records.map(normalizeCandidateExperienceRecord).filter((item) => item.outcome === OUTCOME.DROP_OFF).forEach((item) => {
    const key = item.finalStage || "Unspecified";
    counts.set(key, (counts.get(key) || 0) + 1);
  });
  return [...counts.entries()].map(([label, value]) => ({ label, value })).sort((a, b) => b.value - a.value);
}

export function buildCategoryBreakdown(records = []) {
  const counts = new Map();
  records.map(normalizeCandidateExperienceRecord).filter((item) => item.feedbackCategory).forEach((item) => {
    counts.set(item.feedbackCategory, (counts.get(item.feedbackCategory) || 0) + 1);
  });
  return [...counts.entries()].map(([label, value]) => ({ label, value })).sort((a, b) => b.value - a.value);
}

export function buildRatingDistribution(records = []) {
  const counts = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  records.map(normalizeCandidateExperienceRecord).forEach((item) => {
    if (item.experienceRating >= 1 && item.experienceRating <= 5) counts[item.experienceRating] += 1;
  });
  return [5, 4, 3, 2, 1].map((rating) => ({ label: `${rating} Star`, value: counts[rating] }));
}
