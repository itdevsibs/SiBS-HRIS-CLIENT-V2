import { normalizeCandidateExperienceRecord } from "./normalizeCandidateExperience.js";

function text(value) {
  return String(value ?? "").toLowerCase();
}

export function filterCandidateExperienceRecords(records = [], filters = {}) {
  const search = text(filters.search).trim();
  const outcome = filters.outcome || "All";
  const surveyStatus = filters.surveyStatus || "All";
  const responseSource = filters.responseSource || "All";
  const rating = filters.rating || "All";

  return records.map(normalizeCandidateExperienceRecord).filter((item) => {
    const haystack = [
      item.candidateId,
      item.candidateName,
      item.candidateEmail,
      item.roleTitle,
      item.account,
      item.owner,
      item.finalStage,
      item.feedbackCategory,
      item.feedbackTag,
      item.feedback,
      item.outcome,
      item.surveyStatus,
      item.responseSource,
    ].map(text).join(" ");
    return (
      (!search || haystack.includes(search)) &&
      (outcome === "All" || item.outcome === outcome) &&
      (surveyStatus === "All" || item.surveyStatus === surveyStatus) &&
      (responseSource === "All" || item.responseSource === responseSource) &&
      (rating === "All" || String(item.experienceRating) === String(rating))
    );
  });
}
