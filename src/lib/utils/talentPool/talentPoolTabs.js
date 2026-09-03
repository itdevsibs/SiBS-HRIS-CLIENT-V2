export const TALENT_POOL_TABS = Object.freeze({
  ALL: "all",
  NEW_APPLICANT: "new-applicant",
  APPLICANT_PIPELINE: "applicant-pipeline",
  BELOW_18: "below-18",
  INCOMPLETE_REQUIREMENTS: "incomplete-requirements",
  DROP_OFF: "drop-off",
  LEADS_CONVERTED: "leads-converted",
});

export function getTalentPoolTabFromSearchParams(searchParams) {
  const requestedTab = cleanText(searchParams?.get?.("tab")).toLowerCase();
  const validTabs = Object.values(TALENT_POOL_TABS);

  return validTabs.includes(requestedTab)
    ? requestedTab
    : TALENT_POOL_TABS.ALL;
}

function cleanText(value) {
  return String(value ?? "").trim();
}

function normalizeText(value) {
  return cleanText(value)
    .toLowerCase()
    .replace(/[-_]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function parseDateOnly(value) {
  if (!value) return null;

  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? null : value;
  }

  const text = cleanText(value);
  const dateOnlyMatch = text.match(/^(\d{4})-(\d{2})-(\d{2})$/);

  if (dateOnlyMatch) {
    const [, year, month, day] = dateOnlyMatch;
    const parsed = new Date(Number(year), Number(month) - 1, Number(day));
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  }

  const parsed = new Date(text);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

export function getCurrentAge(dateOfBirth, today = new Date()) {
  const birthDate = parseDateOnly(dateOfBirth);
  const referenceDate = parseDateOnly(today);

  if (!birthDate || !referenceDate) return null;

  let age = referenceDate.getFullYear() - birthDate.getFullYear();
  const monthDifference = referenceDate.getMonth() - birthDate.getMonth();

  if (
    monthDifference < 0 ||
    (monthDifference === 0 && referenceDate.getDate() < birthDate.getDate())
  ) {
    age -= 1;
  }

  return age >= 0 ? age : null;
}

export function getCandidateDateOfBirth(candidate = {}) {
  return (
    candidate.dateOfBirth ||
    candidate.date_of_birth ||
    candidate.birthDate ||
    candidate.birth_date ||
    candidate.birthdate ||
    ""
  );
}

export function isUnder18Candidate(candidate = {}, today = new Date()) {
  const age = getCurrentAge(getCandidateDateOfBirth(candidate), today);
  return age !== null && age < 18;
}

export function isIncompleteRequirementsCandidate(candidate = {}) {
  const currentStage = normalizeText(
    candidate.currentPipelineStage ||
      candidate.current_pipeline_stage ||
      candidate.pipelineStage ||
      candidate.pipeline_stage ||
      candidate.currentStage ||
      candidate.current_stage ||
      candidate.status ||
      candidate.pipelineStatus ||
      candidate.pipeline_status,
  );

  if (!currentStage) return false;

  return (
    currentStage === "incomplete requirements" ||
    currentStage === "for onboarding incomplete requirements" ||
    currentStage === "onboarding incomplete requirements" ||
    (currentStage.includes("incomplete requirements") &&
      (currentStage.includes("onboarding") || currentStage.includes("nho")))
  );
}

export function isDropOffCandidateValue(candidate = {}) {
  const values = [
    candidate.status,
    candidate.pipelineStatus,
    candidate.pipeline_status,
    candidate.currentPipelineStage,
    candidate.current_pipeline_stage,
    candidate.currentStage,
    candidate.current_stage,
    candidate.pipelineStage,
    candidate.pipeline_stage,
    candidate.dropOffCategory,
    candidate.drop_off_category,
  ]
    .map(normalizeText)
    .filter(Boolean);

  return values.some((value) => value === "drop off" || value === "dropped off");
}

export function isCandidateInPipeline(candidate = {}) {
  if (
    candidate.movedToPipeline === true ||
    candidate.moved_to_pipeline === true ||
    Number(candidate.movedToPipeline || candidate.moved_to_pipeline || 0) === 1
  ) {
    return true;
  }

  const pipelineValues = [
    candidate.currentPipelineStage,
    candidate.current_pipeline_stage,
    candidate.currentStage,
    candidate.current_stage,
    candidate.pipelineStage,
    candidate.pipeline_stage,
    candidate.pipelineStatus,
    candidate.pipeline_status,
  ]
    .map(normalizeText)
    .filter(Boolean);

  return pipelineValues.some(
    (value) =>
      value !== "new applicant" &&
      value !== "not processed" &&
      value !== "not started",
  );
}

export function getCurrentCandidateStatus(candidate = {}) {
  return normalizeText(
    candidate.currentPipelineStage ||
      candidate.current_pipeline_stage ||
      candidate.currentStage ||
      candidate.current_stage ||
      candidate.pipelineStage ||
      candidate.pipeline_stage ||
      candidate.pipelineStatus ||
      candidate.pipeline_status ||
      candidate.status,
  );
}

export function isNewApplicantCandidate(candidate = {}, today = new Date()) {
  return (
    !isUnder18Candidate(candidate, today) &&
    getCurrentCandidateStatus(candidate) === "new applicant"
  );
}

export function isApplicantPipelineCandidate(candidate = {}) {
  return (
    isCandidateInPipeline(candidate) &&
    !isIncompleteRequirementsCandidate(candidate) &&
    !isDropOffCandidateValue(candidate)
  );
}

export function shouldShowMoveToPipelineAction(
  candidate = {},
  { isAlreadyInPipeline = false, isDoNotReprocess = false } = {},
  today = new Date(),
) {
  return (
    !isAlreadyInPipeline &&
    !isDoNotReprocess &&
    !isUnder18Candidate(candidate, today)
  );
}

export function filterTalentPoolCandidatesForTab(
  candidates = [],
  tab,
  today = new Date(),
) {
  const list = Array.isArray(candidates) ? candidates : [];

  if (tab === TALENT_POOL_TABS.BELOW_18) {
    return list.filter((candidate) => isUnder18Candidate(candidate, today));
  }

  if (tab === TALENT_POOL_TABS.INCOMPLETE_REQUIREMENTS) {
    return list.filter(isIncompleteRequirementsCandidate);
  }

  if (tab === TALENT_POOL_TABS.NEW_APPLICANT) {
    return list.filter((candidate) =>
      isNewApplicantCandidate(candidate, today),
    );
  }

  if (tab === TALENT_POOL_TABS.APPLICANT_PIPELINE) {
    return list.filter(isApplicantPipelineCandidate);
  }

  if (tab === TALENT_POOL_TABS.ALL) {
    return list;
  }

  return list;
}
