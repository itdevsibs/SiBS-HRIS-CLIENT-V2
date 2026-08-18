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

function cleanArray(value) {
  return Array.isArray(value) ? value.filter(Boolean) : [];
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

function isDownsizeRecord(record = {}) {
  const requestType = normalizeText(
    firstValue(record, [
      "requestType",
      "request_type",
      "hiringRequestType",
      "hiring_request_type",
      "type",
    ]),
  ).toLowerCase();

  const role = normalizeText(
    firstValue(record, [
      "roleTitle",
      "role_title",
      "positionTitle",
      "position_title",
      "jobTitle",
      "job_title",
      "role",
    ]),
  ).toLowerCase();

  return ["downsize", "reduction", "decrease"].some(
    (term) => requestType.includes(term) || role.includes(term),
  );
}

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
  sourceState = {},
} = {}) {
  const safePublicSubmissions = cleanArray(publicSubmissions);
  const safeInternalCandidates = cleanArray(internalCandidates);
  const safeCandidateApplications = cleanArray(candidateApplications);
  const safePipelineCandidates = cleanArray(pipelineCandidates);
  const safeOffers = cleanArray(offers);
  const safeOnboarding = cleanArray(onboarding);
  const safeHiringNeeds = cleanArray(hiringNeeds);
  const safeWeeklyPlan = cleanArray(weeklyPlan);
  const safeWeeklyActionItems = cleanArray(weeklyActionItems);

  const allCandidates = [
    ...safePublicSubmissions,
    ...safeInternalCandidates,
  ];

  const newPublicApplicants = safePublicSubmissions.filter(
    (item) =>
      getCandidateStatus(item) === "New Applicant" || item?.isPublicSubmission,
  );

  const newTalentPoolApplicants = allCandidates.filter(
    (item) => getCandidateStatus(item) === "New Applicant",
  );

  const pipelineSource = [
    ...safeCandidateApplications,
    ...safePipelineCandidates,
  ];

  const screeningCandidates = pipelineSource.filter((item) => {
    const status = getCandidateStatus(item).toLowerCase();
    return (
      status.includes("screen") ||
      status.includes("initial") ||
      status.includes("matched")
    );
  });

  const assessmentCandidates = pipelineSource.filter((item) => {
    const status = getCandidateStatus(item).toLowerCase();
    return (
      status.includes("assess") ||
      status.includes("exam") ||
      status.includes("test")
    );
  });

  const interviewCandidates = pipelineSource.filter((item) =>
    getCandidateStatus(item).toLowerCase().includes("interview"),
  );

  const offeredCandidates = [
    ...pipelineSource,
    ...safeOffers,
  ].filter((item) => {
    const status = getCandidateStatus(item).toLowerCase();
    return status.includes("offer") || status.includes("offered");
  });

  const pendingOffers = safeOffers.filter((item) => {
    const status = normalizeText(
      item.status ||
        item.offerStatus ||
        item.offerApprovalStatus ||
        item.approvalStatus ||
        item.finalStatus,
    ).toLowerCase();

    return (
      status.includes("for review") ||
      status.includes("pending") ||
      status.includes("offered") ||
      status.includes("for approval")
    );
  });

  const acceptedOffers = safeOffers.filter((item) => {
    const status = normalizeText(
      item.offerDecision ||
        item.candidateResponse ||
        item.status ||
        item.offerStatus ||
        item.approvalStatus ||
        item.finalStatus,
    ).toLowerCase();

    return status.includes("accepted") || status === "approved";
  });

  const pendingOnboarding = safeOnboarding.filter((item) => {
    const status = normalizeText(
      item.showStatus ||
        item.finalOutcome ||
        item.status ||
        item.onboardingStatus,
    ).toLowerCase();

    return status.includes("pending") || status.includes("waiting");
  });

  const onboardingRisks = safeOnboarding.filter((item) => {
    const status = normalizeText(
      item.showStatus ||
        item.finalOutcome ||
        item.status ||
        item.onboardingStatus,
    ).toLowerCase();

    return (
      status.includes("no show") ||
      status.includes("withdrawn") ||
      status.includes("withdrawal")
    );
  });

  const pendingHiringNeeds = safeHiringNeeds.filter((item) => {
    if (isDownsizeRecord(item)) return false;

    const status = normalizeText(
      item.approvalStatus || item.approval_status || item.status,
    ).toLowerCase();

    return (
      !status ||
      status.includes("for approval") ||
      status.includes("pending") ||
      status.includes("under review") ||
      status.includes("for validation")
    );
  });

  const weeklyAtRisk = safeWeeklyPlan.filter((item) => {
    if (isDownsizeRecord(item)) return false;

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
    publicSubmissions: safePublicSubmissions,
    internalCandidates: safeInternalCandidates,
    allCandidates,
    candidateApplications: safeCandidateApplications,
    pipelineCandidates: safePipelineCandidates,
    offers: safeOffers,
    onboarding: safeOnboarding,
    hiringNeeds: safeHiringNeeds,
    weeklyPlan: safeWeeklyPlan,
    weeklyActionItems: safeWeeklyActionItems,
    sourceState:
      sourceState && typeof sourceState === "object" ? sourceState : {},
    newPublicApplicants,
    newTalentPoolApplicants,
    screeningCandidates,
    assessmentCandidates,
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

function getDepartmentParts(record = {}) {
  return normalizeText(
    firstValue(record, ["departmentAccount", "department_account"]),
  )
    .split("/")
    .map((part) => part.trim())
    .filter(Boolean);
}

function normalizeKeyPart(value) {
  return normalizeText(value)
    .toLowerCase()
    .replace(/[–—−]/g, "-")
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function makeRoleAccountKey(role, account) {
  return `${normalizeKeyPart(role)}::${normalizeKeyPart(account)}`;
}

export function getLinkedActionOptions(context) {
  const weeklyOptions = (context?.weeklyPlan || [])
    .filter((item) => !isDownsizeRecord(item))
    .map((item, index) => {
      const departmentParts = getDepartmentParts(item);
      const label =
        normalizeText(
          firstValue(
            item,
            [
              "roleTitle",
              "role_title",
              "positionTitle",
              "position_title",
              "jobTitle",
              "job_title",
              "role",
              "position",
            ],
            "Weekly Plan Role",
          ),
        ) || "Weekly Plan Role";
      const account =
        normalizeText(
          firstValue(
            item,
            ["account", "accountName", "account_name", "client"],
            departmentParts.at(-1) || "Recruitment",
          ),
        ) || "Recruitment";
      const id = String(
        firstValue(item, ["id", "weeklyPlanItemId", "weekly_plan_item_id"], index),
      );

      return {
        key: `weekly-${id}`,
        source: "weekly",
        id,
        label,
        account,
        requirement: Number(
          firstValue(item, ["requiredHeadcount", "requirement", "headcount"], 0),
        ),
        filled: Number(
          firstValue(item, ["actualHeadcount", "filled", "currentFilled"], 0),
        ),
        cluster: normalizeText(
          firstValue(
            item,
            ["cluster", "clusterName", "businessUnit"],
            departmentParts.length > 1
              ? departmentParts[0]
              : "Unassigned Cluster",
          ),
        ),
        reportingWeek: normalizeText(
          firstValue(item, ["reportingWeek", "weekLabel", "week"], ""),
        ),
        owner: normalizeText(
          firstValue(
            item,
            ["taOwner", "ta_owner", "owner", "recruiter"],
            "",
          ),
        ),
      };
    });

  const hiringNeedOptions = (context?.hiringNeeds || [])
    .filter((item) => !isDownsizeRecord(item))
    .map((item, index) => {
      const departmentParts = getDepartmentParts(item);
      const label =
        normalizeText(
          firstValue(
            item,
            [
              "positionTitle",
              "position_title",
              "roleTitle",
              "role_title",
              "jobDescriptionTitle",
              "jobTitle",
            ],
            "Hiring Need",
          ),
        ) || "Hiring Need";
      const account =
        normalizeText(
          firstValue(
            item,
            ["account", "accountName", "account_name"],
            departmentParts.at(-1) || "Recruitment",
          ),
        ) || "Recruitment";
      const id = String(
        firstValue(
          item,
          ["id", "rawId", "raw_id", "hiringNeedId", "hiring_need_id"],
          index,
        ),
      );

      return {
        key: `hiring-${id}`,
        source: "hiring",
        id,
        label,
        account,
        requirement: Number(
          firstValue(item, ["requiredHeadcount", "headcount", "requirement"], 0),
        ),
        filled: Number(
          firstValue(item, ["filled", "actualHeadcount", "currentFilled"], 0),
        ),
        cluster: normalizeText(
          firstValue(
            item,
            ["cluster", "clusterName", "businessUnit"],
            departmentParts.length > 1
              ? departmentParts[0]
              : "Unassigned Cluster",
          ),
        ),
        reportingWeek: normalizeText(
          firstValue(item, ["reportingWeek", "weekLabel", "week"], ""),
        ),
        owner: normalizeText(
          firstValue(
            item,
            [
              "taOwner",
              "ta_owner",
              "owner",
              "preparedBy",
              "prepared_by",
              "requestedBy",
              "requested_by",
            ],
            "",
          ),
        ),
      };
    });

  return [...weeklyOptions, ...hiringNeedOptions].map((option) => ({
    ...option,
    roleAccount: `${option.label} - ${option.account}`,
    displayLabel: `${option.label} / ${option.account}`,
    roleAccountKey: makeRoleAccountKey(option.label, option.account),
  }));
}
