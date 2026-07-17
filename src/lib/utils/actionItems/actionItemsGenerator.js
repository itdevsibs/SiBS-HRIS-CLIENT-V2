import {
  generateActionId,
  getDateAfterDays,
  getTodayDate,
} from "./actionItemsHelpers.js";

export function buildSystemGeneratedActions(
  context,
  { today = getTodayDate(), dateAfterDays = getDateAfterDays } = {},
) {
  const actions = [];

  if (context.newPublicApplicants.length > 0) {
    actions.push({
      id: "SYS-PUBLIC-001",
      actionId: "SYS-001",
      actionItem: `Review ${context.newPublicApplicants.length} new public applicant/s and tag them for screening or talent pool status.`,
      roleAccount: "Public Talent Pool Intake",
      roleTitle: "Public Applicants",
      account: "Recruitment",
      owner: "System Suggested",
      deadline: dateAfterDays(1),
      status: "Planned",
      riskLevel: context.newPublicApplicants.length >= 10 ? "High" : "Medium",
      linkedGap: "Screening",
      module: "Public Talent Pool",
      sourceType: "System Suggested",
      remarks:
        "Public submissions should be reviewed quickly so qualified applicants can move into the Candidate Pipeline or remain in Talent Pool.",
      requirement: context.newPublicApplicants.length,
      filled: 0,
      createdDate: today,
      completedDate: null,
      systemGenerated: true,
    });
  }

  if (context.newTalentPoolApplicants.length > 0) {
    actions.push({
      id: "SYS-TALENT-002",
      actionId: "SYS-002",
      actionItem: `Classify ${context.newTalentPoolApplicants.length} new talent pool applicant/s into Silver Pool, Recyclable, Do Not Reprocess, or Failed.`,
      roleAccount: "Talent Pool Classification",
      roleTitle: "Talent Pool",
      account: "Recruitment",
      owner: "System Suggested",
      deadline: dateAfterDays(2),
      status: "Planned",
      riskLevel:
        context.newTalentPoolApplicants.length >= 15 ? "High" : "Medium",
      linkedGap: "Pipeline",
      module: "Talent Pool",
      sourceType: "System Suggested",
      remarks:
        "Talent Pool records must be classified so recruiters can reuse candidates and avoid losing qualified leads.",
      requirement: context.newTalentPoolApplicants.length,
      filled: 0,
      createdDate: today,
      completedDate: null,
      systemGenerated: true,
    });
  }

  if (context.pendingHiringNeeds.length > 0) {
    actions.push({
      id: "SYS-HIRING-003",
      actionId: "SYS-003",
      actionItem: `Follow up ${context.pendingHiringNeeds.length} hiring need/s still waiting for approval or validation.`,
      roleAccount: "Hiring Needs Approval",
      roleTitle: "Hiring Needs",
      account: "HR / Operations",
      owner: "System Suggested",
      deadline: dateAfterDays(1),
      status: "Planned",
      riskLevel: "High",
      linkedGap: "Approval",
      module: "Hiring Needs",
      sourceType: "System Suggested",
      remarks:
        "Hiring cannot move properly unless the approved headcount and required roles are confirmed.",
      requirement: context.pendingHiringNeeds.length,
      filled: 0,
      createdDate: today,
      completedDate: null,
      systemGenerated: true,
    });
  }

  if (context.screeningCandidates.length > 0) {
    actions.push({
      id: "SYS-SCREEN-004",
      actionId: "SYS-004",
      actionItem: `Complete initial screening movement for ${context.screeningCandidates.length} candidate/s in screening stage.`,
      roleAccount: "Candidate Screening",
      roleTitle: "Pipeline Candidates",
      account: "Recruitment",
      owner: "System Suggested",
      deadline: dateAfterDays(2),
      status: "Planned",
      riskLevel: context.screeningCandidates.length >= 10 ? "High" : "Medium",
      linkedGap: "Screening",
      module: "Candidate Pipeline",
      sourceType: "System Suggested",
      remarks:
        "Candidates in screening should either move forward, be tagged as not fit, or be retained in Talent Pool.",
      requirement: context.screeningCandidates.length,
      filled: 0,
      createdDate: today,
      completedDate: null,
      systemGenerated: true,
    });
  }

  if (context.interviewCandidates.length > 0) {
    actions.push({
      id: "SYS-INTERVIEW-005",
      actionId: "SYS-005",
      actionItem: `Check interview schedules and feedback for ${context.interviewCandidates.length} candidate/s.`,
      roleAccount: "Interview Queue",
      roleTitle: "Interview Candidates",
      account: "Recruitment / Operations",
      owner: "System Suggested",
      deadline: dateAfterDays(1),
      status: "Planned",
      riskLevel: "High",
      linkedGap: "Interview",
      module: "Candidate Pipeline",
      sourceType: "System Suggested",
      remarks:
        "Interview delays affect weekly hiring delivery and can cause candidate drop-off.",
      requirement: context.interviewCandidates.length,
      filled: 0,
      createdDate: today,
      completedDate: null,
      systemGenerated: true,
    });
  }

  if (context.pendingOffers.length > 0 || context.offeredCandidates.length > 0) {
    const count = Math.max(
      context.pendingOffers.length,
      context.offeredCandidates.length,
    );

    actions.push({
      id: "SYS-OFFER-006",
      actionId: "SYS-006",
      actionItem: `Review ${count} offered or pending offer candidate/s and confirm approval, acceptance, or negotiation status.`,
      roleAccount: "Offer Management",
      roleTitle: "Offered Candidates",
      account: "Recruitment / Compensation",
      owner: "System Suggested",
      deadline: dateAfterDays(1),
      status: "Planned",
      riskLevel: "Medium",
      linkedGap: "Offer",
      module: "Offers",
      sourceType: "System Suggested",
      remarks:
        "Offer records must be monitored to prevent offer delays, declined offers, and inaccurate hiring conversion.",
      requirement: count,
      filled: context.acceptedOffers.length,
      createdDate: today,
      completedDate: null,
      systemGenerated: true,
    });
  }

  if (context.pendingOnboarding.length > 0 || context.onboardingRisks.length > 0) {
    const total = context.pendingOnboarding.length + context.onboardingRisks.length;

    actions.push({
      id: "SYS-ONBOARD-007",
      actionId: "SYS-007",
      actionItem: `Monitor ${total} onboarding record/s for pending start, no-show, or pre-start withdrawal risk.`,
      roleAccount: "Onboarding Monitoring",
      roleTitle: "Accepted Candidates",
      account: "Recruitment / HR",
      owner: "System Suggested",
      deadline: dateAfterDays(2),
      status: "Planned",
      riskLevel: context.onboardingRisks.length > 0 ? "High" : "Medium",
      linkedGap: "Onboarding",
      module: "Onboarding",
      sourceType: "System Suggested",
      remarks:
        "Accepted candidates should be tracked until confirmed show-up or final onboarding outcome.",
      requirement: total,
      filled: Math.max(0, context.acceptedOffers.length - total),
      createdDate: today,
      completedDate: null,
      systemGenerated: true,
    });
  }

  if (context.weeklyAtRisk.length > 0) {
    actions.push({
      id: "SYS-WEEKLY-008",
      actionId: "SYS-008",
      actionItem: `Create or update action items for ${context.weeklyAtRisk.length} workforce hiring plan account/s with headcount gap or risk status.`,
      roleAccount: "Weekly Hiring Delivery",
      roleTitle: "Workforce Hiring Plan",
      account: "Operations / TA",
      owner: "System Suggested",
      deadline: dateAfterDays(1),
      status: "Planned",
      riskLevel: "High",
      linkedGap: "Capacity / Manpower",
      module: "Workforce Hiring Plan",
      sourceType: "System Suggested",
      remarks:
        "Every role or account not fully hired must have at least one linked action item before reporting.",
      requirement: context.weeklyAtRisk.length,
      filled: 0,
      createdDate: today,
      completedDate: null,
      systemGenerated: true,
    });
  }

  return actions;
}

export function getModuleInsightCards(context) {
  return [
    {
      module: "Public Talent Pool",
      iconKey: "UsersRound",
      value: context.publicSubmissions.length,
      riskValue: context.newPublicApplicants.length,
      description: `${context.newPublicApplicants.length} new applicant/s need review`,
    },
    {
      module: "Talent Pool",
      iconKey: "UserCheck",
      value: context.allCandidates.length,
      riskValue: context.newTalentPoolApplicants.length,
      description: `${context.newTalentPoolApplicants.length} new record/s need classification`,
    },
    {
      module: "Hiring Needs",
      iconKey: "BriefcaseBusiness",
      value: context.hiringNeeds.length,
      riskValue: context.pendingHiringNeeds.length,
      description: `${context.pendingHiringNeeds.length} pending approval/s`,
    },
    {
      module: "Candidate Pipeline",
      iconKey: "Layers3",
      value: context.candidateApplications.length + context.pipelineCandidates.length,
      riskValue:
        context.screeningCandidates.length + context.interviewCandidates.length,
      description: `${context.interviewCandidates.length} interview-stage candidate/s`,
    },
    {
      module: "Offers",
      iconKey: "ShieldCheck",
      value: context.offers.length,
      riskValue: context.pendingOffers.length,
      description: `${context.pendingOffers.length} pending offer review/s`,
    },
    {
      module: "Onboarding",
      iconKey: "CheckCircle2",
      value: context.onboarding.length,
      riskValue: context.pendingOnboarding.length + context.onboardingRisks.length,
      description: `${context.onboardingRisks.length} onboarding risk/s`,
    },
    {
      module: "Workforce Hiring Plan",
      iconKey: "BarChart3",
      value: context.weeklyPlan.length,
      riskValue: context.weeklyAtRisk.length,
      description: `${context.weeklyAtRisk.length} account/s at risk`,
    },
  ];
}

export function buildManualActionItem({
  form,
  nextNumber,
  now = Date.now(),
  today = getTodayDate(),
}) {
  const linkedModule =
    form.linkedGap === "Approval"
      ? "Hiring Needs"
      : form.linkedGap === "JD"
        ? "Job Description"
        : form.linkedGap === "Offer"
          ? "Offers"
          : form.linkedGap === "Onboarding"
            ? "Onboarding"
            : form.weeklyPlanItemId
              ? "Workforce Hiring Plan"
              : "Candidate Pipeline";

  return {
    id: now,
    actionId: generateActionId(nextNumber),
    actionItem: form.actionItem.trim(),
    roleAccount: form.roleAccount,
    roleTitle: form.roleTitle,
    account: form.account,
    owner: form.owner,
    deadline: form.deadline,
    status: form.status,
    riskLevel: form.riskLevel,
    linkedGap: form.linkedGap,
    module: linkedModule,
    sourceType: "Manual",
    remarks: form.remarks.trim(),
    requirement: Number(form.requirement || 0),
    filled: Number(form.filled || 0),
    createdDate: today,
    completedDate: form.status === "Completed" ? today : null,
    weeklyPlanItemId: form.weeklyPlanItemId,
    hiringNeedId: form.hiringNeedId,
  };
}
