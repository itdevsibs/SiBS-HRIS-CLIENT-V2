import {
  ACTION_ITEMS_STORAGE_KEY,
  CANDIDATE_APPLICATIONS_KEY,
  HIRING_NEEDS_KEY,
  INTERNAL_CANDIDATES_KEY,
  OFFER_RECORDS_KEY,
  ONBOARDING_RECORDS_KEY,
  PIPELINE_CANDIDATES_KEY,
  PUBLIC_SUBMISSIONS_KEY,
  WORKFORCE_HIRING_PLAN_KEY,
} from "./weeklyReportsConstants.js";
import { safeReadArray } from "./weeklyReportsStorage.js";
import {
  getAccountFromRecord,
  getCandidateStatus,
  getOwnerFromRecord,
  getPriorityStatus,
  getRoleFromRecord,
  normalizeText,
} from "./weeklyReportsHelpers.js";

export function buildModuleContext() {
  const publicSubmissions = safeReadArray(PUBLIC_SUBMISSIONS_KEY);
  const internalCandidates = safeReadArray(INTERNAL_CANDIDATES_KEY);
  const candidateApplications = safeReadArray(CANDIDATE_APPLICATIONS_KEY);
  const pipelineCandidates = safeReadArray(PIPELINE_CANDIDATES_KEY);
  const offers = safeReadArray(OFFER_RECORDS_KEY);
  const onboarding = safeReadArray(ONBOARDING_RECORDS_KEY);
  const hiringNeeds = safeReadArray(HIRING_NEEDS_KEY);
  const weeklyPlan = safeReadArray(WORKFORCE_HIRING_PLAN_KEY);
  const actionItems = safeReadArray(ACTION_ITEMS_STORAGE_KEY);

  const allCandidates = [...publicSubmissions, ...internalCandidates];
  const allPipeline = [...candidateApplications, ...pipelineCandidates];

  const sourced = allCandidates.length + allPipeline.length;

  const screened = allPipeline.filter((item) => {
    const status = getCandidateStatus(item).toLowerCase();
    return (
      status.includes("screen") ||
      status.includes("interview") ||
      status.includes("offer") ||
      status.includes("accepted") ||
      status.includes("hired")
    );
  }).length;

  const interviewed = allPipeline.filter((item) => {
    const status = getCandidateStatus(item).toLowerCase();
    return (
      status.includes("interview") ||
      status.includes("offer") ||
      status.includes("accepted") ||
      status.includes("hired")
    );
  }).length;

  const offeredFromPipeline = allPipeline.filter((item) => {
    const status = getCandidateStatus(item).toLowerCase();
    return (
      status.includes("offer") ||
      status.includes("offered") ||
      status.includes("accepted") ||
      status.includes("hired")
    );
  }).length;

  const offered = Math.max(offers.length, offeredFromPipeline);

  const accepted = offers.filter((item) => {
    const status = normalizeText(
      item.status || item.offerStatus || item.approvalStatus || item.finalStatus,
    ).toLowerCase();

    return status.includes("accepted") || status.includes("approved");
  }).length;

  const hiredFromPipeline = allPipeline.filter((item) => {
    const status = getCandidateStatus(item).toLowerCase();
    return status.includes("hired") || status.includes("active");
  }).length;

  const trueHires = onboarding.filter((item) => {
    const status = normalizeText(
      item.finalOutcome ||
        item.showStatus ||
        item.status ||
        item.onboardingStatus,
    ).toLowerCase();

    return status.includes("true hire") || status.includes("show");
  }).length;

  const hired = Math.max(hiredFromPipeline, trueHires);

  const dropOffs =
    allPipeline.filter((item) => {
      const status = getCandidateStatus(item).toLowerCase();
      return (
        status.includes("failed") ||
        status.includes("drop") ||
        status.includes("withdraw") ||
        status.includes("declined") ||
        status.includes("rejected") ||
        status.includes("cancelled")
      );
    }).length +
    offers.filter((item) => {
      const status = normalizeText(
        item.status || item.offerStatus || item.finalStatus,
      ).toLowerCase();

      return (
        status.includes("declined") ||
        status.includes("rejected") ||
        status.includes("withdraw")
      );
    }).length +
    onboarding.filter((item) => {
      const status = normalizeText(
        item.finalOutcome ||
          item.showStatus ||
          item.status ||
          item.onboardingStatus,
      ).toLowerCase();

      return (
        status.includes("no show") ||
        status.includes("withdraw") ||
        status.includes("pre-start")
      );
    }).length;

  const pendingHiringNeeds = hiringNeeds.filter((item) => {
    const status = normalizeText(item.approvalStatus || item.status).toLowerCase();

    return (
      !status ||
      status.includes("for approval") ||
      status.includes("pending") ||
      status.includes("under review")
    );
  });

  const pendingOffers = offers.filter((item) => {
    const status = normalizeText(
      item.status || item.offerStatus || item.approvalStatus || item.finalStatus,
    ).toLowerCase();

    return (
      status.includes("pending") ||
      status.includes("for review") ||
      status.includes("for approval") ||
      status.includes("offered")
    );
  });

  const pendingOnboarding = onboarding.filter((item) => {
    const status = normalizeText(
      item.finalOutcome ||
        item.showStatus ||
        item.status ||
        item.onboardingStatus,
    ).toLowerCase();

    return status.includes("pending") || status.includes("waiting");
  });

  const openActionItems = actionItems.filter(
    (item) => normalizeText(item.status) !== "Completed",
  );

  const missingData = [];

  if (pendingHiringNeeds.length > 0) {
    missingData.push(
      `${pendingHiringNeeds.length} hiring need/s still pending approval.`,
    );
  }

  if (pendingOffers.length > 0) {
    missingData.push(
      `${pendingOffers.length} offer record/s still pending review or acceptance.`,
    );
  }

  if (pendingOnboarding.length > 0) {
    missingData.push(
      `${pendingOnboarding.length} onboarding record/s still pending start confirmation.`,
    );
  }

  if (openActionItems.length > 0) {
    missingData.push(`${openActionItems.length} action item/s remain open.`);
  }

  const weeklyRoles =
    weeklyPlan.length > 0
      ? weeklyPlan.map((item, index) => {
          const role = getRoleFromRecord(item);
          const account = getAccountFromRecord(item);

          const requirement = Number(
            item.requiredHeadcount || item.requirement || item.headcount || 0,
          );

          const filled = Number(
            item.actualHeadcount || item.filled || item.currentFilled || 0,
          );

          const status = normalizeText(
            item.overallStatus || item.pipelineStatus || item.status,
          );

          return {
            id: item.id || item.weeklyPlanItemId || index + 1,
            role,
            account,
            requirement,
            filled,
            status: status || getPriorityStatus(requirement, filled),
            owner: getOwnerFromRecord(item),
          };
        })
      : hiringNeeds.map((item, index) => {
          const role = getRoleFromRecord(item);
          const account = getAccountFromRecord(item);
          const requirement = Number(
            item.headcount || item.requiredHeadcount || 0,
          );

          return {
            id: item.id || item.hiringNeedId || index + 1,
            role,
            account,
            requirement,
            filled: 0,
            status: getPriorityStatus(requirement, 0),
            owner: getOwnerFromRecord(item),
          };
        });

  const totalRequirement = weeklyRoles.reduce(
    (sum, item) => sum + Number(item.requirement || 0),
    0,
  );

  const totalFilled = weeklyRoles.reduce(
    (sum, item) => sum + Number(item.filled || 0),
    0,
  );

  const atRiskRoles = weeklyRoles.filter((item) => item.status === "At Risk")
    .length;

  const delayedRoles = weeklyRoles.filter((item) => item.status === "Delayed")
    .length;

  const actionItemTitles =
    openActionItems.length > 0
      ? openActionItems.slice(0, 8).map((item) => item.actionItem)
      : ["No open action items recorded for the current week."];

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
    actionItems,
    sourced,
    screened,
    interviewed,
    offered,
    accepted,
    hired,
    dropOffs,
    pendingHiringNeeds,
    pendingOffers,
    pendingOnboarding,
    openActionItems,
    missingData,
    weeklyRoles,
    totalRequirement,
    totalFilled,
    atRiskRoles,
    delayedRoles,
    actionItemTitles,
  };
}

export function getModuleSignalCards(context) {
  return [
    {
      title: "Public Talent Pool",
      value: context.publicSubmissions.length,
      description: "Public applicants",
      iconKey: "publicTalentPool",
      hasRisk: context.publicSubmissions.some(
        (item) => getCandidateStatus(item) === "New Applicant",
      ),
    },
    {
      title: "Talent Pool",
      value: context.allCandidates.length,
      description: "Candidate records",
      iconKey: "talentPool",
      hasRisk: context.allCandidates.some(
        (item) => getCandidateStatus(item) === "New Applicant",
      ),
    },
    {
      title: "Hiring Needs",
      value: context.hiringNeeds.length,
      description: `${context.pendingHiringNeeds.length} pending approval`,
      iconKey: "hiringNeeds",
      hasRisk: context.pendingHiringNeeds.length > 0,
    },
    {
      title: "Candidate Pipeline",
      value:
        context.candidateApplications.length + context.pipelineCandidates.length,
      description: "Pipeline records",
      iconKey: "candidatePipeline",
      hasRisk: context.dropOffs > 0,
    },
    {
      title: "Offers",
      value: context.offers.length,
      description: `${context.pendingOffers.length} pending offer`,
      iconKey: "offers",
      hasRisk: context.pendingOffers.length > 0,
    },
    {
      title: "Onboarding",
      value: context.onboarding.length,
      description: `${context.pendingOnboarding.length} pending start`,
      iconKey: "onboarding",
      hasRisk: context.pendingOnboarding.length > 0,
    },
    {
      title: "Action Items",
      value: context.openActionItems.length,
      description: "Open follow-ups",
      iconKey: "actionItems",
      hasRisk: context.openActionItems.length > 0,
    },
  ];
}
