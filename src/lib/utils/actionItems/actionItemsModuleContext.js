import {
  CANDIDATE_APPLICATIONS_KEY,
  HIRING_NEEDS_KEY,
  INTERNAL_CANDIDATES_KEY,
  OFFER_RECORDS_KEY,
  ONBOARDING_RECORDS_KEY,
  PIPELINE_CANDIDATES_KEY,
  PUBLIC_SUBMISSIONS_KEY,
  WEEKLY_HIRING_ACTION_ITEMS_KEY,
  WORKFORCE_HIRING_PLAN_KEY,
} from "./actionItemsConstants.js";
import { getCandidateStatus, normalizeText } from "./actionItemsHelpers.js";
import { safeReadArray } from "./actionItemsStorage.js";

export function buildModuleContextFromRecords({
  publicSubmissions = [],
  internalCandidates = [],
  candidateApplications = [],
  pipelineCandidates = [],
  offers = [],
  onboarding = [],
  hiringNeeds = [],
  weeklyPlan = [],
  weeklyActionItems = [],
} = {}) {
  const allCandidates = [...publicSubmissions, ...internalCandidates];

  const newPublicApplicants = publicSubmissions.filter(
    (item) =>
      getCandidateStatus(item) === "New Applicant" || item?.isPublicSubmission,
  );

  const newTalentPoolApplicants = allCandidates.filter(
    (item) => getCandidateStatus(item) === "New Applicant",
  );

  const screeningCandidates = [
    ...candidateApplications,
    ...pipelineCandidates,
  ].filter((item) => {
    const status = getCandidateStatus(item).toLowerCase();
    return status.includes("screen") || status.includes("initial");
  });

  const interviewCandidates = [
    ...candidateApplications,
    ...pipelineCandidates,
  ].filter((item) => getCandidateStatus(item).toLowerCase().includes("interview"));

  const offeredCandidates = [
    ...candidateApplications,
    ...pipelineCandidates,
    ...offers,
  ].filter((item) => {
    const status = getCandidateStatus(item).toLowerCase();
    return status.includes("offer") || status.includes("offered");
  });

  const pendingOffers = offers.filter((item) => {
    const status = normalizeText(
      item.status || item.offerStatus || item.approvalStatus || item.finalStatus,
    ).toLowerCase();

    return (
      status.includes("for review") ||
      status.includes("pending") ||
      status.includes("offered") ||
      status.includes("for approval")
    );
  });

  const acceptedOffers = offers.filter((item) => {
    const status = normalizeText(
      item.status || item.offerStatus || item.approvalStatus || item.finalStatus,
    ).toLowerCase();

    return status.includes("accepted") || status.includes("approved");
  });

  const pendingOnboarding = onboarding.filter((item) => {
    const status = normalizeText(
      item.showStatus || item.finalOutcome || item.status || item.onboardingStatus,
    ).toLowerCase();

    return status.includes("pending") || status.includes("waiting");
  });

  const onboardingRisks = onboarding.filter((item) => {
    const status = normalizeText(
      item.showStatus || item.finalOutcome || item.status || item.onboardingStatus,
    ).toLowerCase();

    return (
      status.includes("no show") ||
      status.includes("withdrawn") ||
      status.includes("withdrawal")
    );
  });

  const pendingHiringNeeds = hiringNeeds.filter((item) => {
    const status = normalizeText(item.approvalStatus || item.status).toLowerCase();

    return (
      !status ||
      status.includes("for approval") ||
      status.includes("pending") ||
      status.includes("under review")
    );
  });

  const weeklyAtRisk = weeklyPlan.filter((item) => {
    const status = normalizeText(
      item.status || item.pipelineStatus || item.overallStatus,
    ).toLowerCase();

    const required = Number(
      item.requiredHeadcount || item.requirement || item.headcount || 0,
    );

    const actual = Number(
      item.actualHeadcount || item.filled || item.currentFilled || 0,
    );

    return (
      status.includes("risk") ||
      status.includes("delay") ||
      (required > 0 && actual < required)
    );
  });

  return {
    publicSubmissions,
    internalCandidates,
    allCandidates,
    candidateApplications,
    pipelineCandidates,
    offers,
    onboarding,
    hiringNeeds,
    weeklyPlan,
    weeklyActionItems,
    newPublicApplicants,
    newTalentPoolApplicants,
    screeningCandidates,
    interviewCandidates,
    offeredCandidates,
    pendingOffers,
    acceptedOffers,
    pendingOnboarding,
    onboardingRisks,
    pendingHiringNeeds,
    weeklyAtRisk,
  };
}

export function buildModuleContext() {
  return buildModuleContextFromRecords({
    publicSubmissions: safeReadArray(PUBLIC_SUBMISSIONS_KEY),
    internalCandidates: safeReadArray(INTERNAL_CANDIDATES_KEY),
    candidateApplications: safeReadArray(CANDIDATE_APPLICATIONS_KEY),
    pipelineCandidates: safeReadArray(PIPELINE_CANDIDATES_KEY),
    offers: safeReadArray(OFFER_RECORDS_KEY),
    onboarding: safeReadArray(ONBOARDING_RECORDS_KEY),
    hiringNeeds: safeReadArray(HIRING_NEEDS_KEY),
    weeklyPlan: safeReadArray(WORKFORCE_HIRING_PLAN_KEY),
    weeklyActionItems: safeReadArray(WEEKLY_HIRING_ACTION_ITEMS_KEY),
  });
}

function firstValue(record, keys, fallback = "") {
  for (const key of keys) {
    const value = record?.[key];
    if (value !== undefined && value !== null && String(value).trim() !== "") {
      return value;
    }
  }
  return fallback;
}

export function getLinkedActionOptions(context) {
  const weeklyOptions = (context?.weeklyPlan || []).map((item, index) => ({
    key: `weekly-${firstValue(item, ["id", "weeklyPlanItemId", "weekly_plan_item_id"], index)}`,
    source: "weekly",
    id: String(firstValue(item, ["id", "weeklyPlanItemId", "weekly_plan_item_id"], index)),
    label:
      normalizeText(
        firstValue(item, ["roleTitle", "positionTitle", "jobTitle", "role", "position"], "Weekly Plan Role"),
      ) || "Weekly Plan Role",
    account:
      normalizeText(firstValue(item, ["account", "accountName", "department", "cluster"], "Recruitment")) ||
      "Recruitment",
    requirement: Number(
      firstValue(item, ["requiredHeadcount", "requirement", "headcount"], 0),
    ),
    filled: Number(
      firstValue(item, ["actualHeadcount", "filled", "currentFilled"], 0),
    ),
  }));

  const hiringNeedOptions = (context?.hiringNeeds || []).map((item, index) => ({
    key: `hiring-${firstValue(item, ["id", "hiringNeedId", "hiring_need_id"], index)}`,
    source: "hiring",
    id: String(firstValue(item, ["id", "hiringNeedId", "hiring_need_id"], index)),
    label:
      normalizeText(
        firstValue(item, ["positionTitle", "roleTitle", "jobDescriptionTitle", "jobTitle"], "Hiring Need"),
      ) || "Hiring Need",
    account:
      normalizeText(
        firstValue(item, ["account", "accountName", "departmentAccount", "department"], "Recruitment"),
      ) || "Recruitment",
    requirement: Number(
      firstValue(item, ["requiredHeadcount", "headcount", "requirement"], 0),
    ),
    filled: Number(firstValue(item, ["filled", "actualHeadcount", "currentFilled"], 0)),
  }));

  return [...weeklyOptions, ...hiringNeedOptions].map((option) => ({
    ...option,
    roleAccount: `${option.label} - ${option.account}`,
    displayLabel: `${option.label} / ${option.account}`,
  }));
}
