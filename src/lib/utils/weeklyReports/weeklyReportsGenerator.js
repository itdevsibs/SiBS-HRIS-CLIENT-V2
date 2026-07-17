import {
  generateReportId,
  getCurrentWeekDateRange,
  getCurrentWeekLabel,
  getTodayDate,
} from "./weeklyReportsHelpers.js";

export function buildCurrentReportFromModules(context) {
  const hasLiveData =
    context.publicSubmissions.length > 0 ||
    context.internalCandidates.length > 0 ||
    context.candidateApplications.length > 0 ||
    context.pipelineCandidates.length > 0 ||
    context.offers.length > 0 ||
    context.onboarding.length > 0 ||
    context.hiringNeeds.length > 0 ||
    context.weeklyPlan.length > 0 ||
    context.actionItems.length > 0;

  if (!hasLiveData) return null;

  const summaryParts = [];

  if (context.totalRequirement > 0) {
    summaryParts.push(
      `Current filled headcount is ${context.totalFilled}/${context.totalRequirement}.`,
    );
  }

  if (context.atRiskRoles > 0) {
    summaryParts.push(`${context.atRiskRoles} role/account group/s are at risk.`);
  }

  if (context.delayedRoles > 0) {
    summaryParts.push(`${context.delayedRoles} role/account group/s are delayed.`);
  }

  if (context.openActionItems.length > 0) {
    summaryParts.push(
      `${context.openActionItems.length} action item/s require follow-up.`,
    );
  }

  if (context.pendingOffers.length > 0) {
    summaryParts.push(
      `${context.pendingOffers.length} offer/s are pending review or acceptance.`,
    );
  }

  if (context.pendingOnboarding.length > 0) {
    summaryParts.push(
      `${context.pendingOnboarding.length} onboarding record/s need start confirmation.`,
    );
  }

  return {
    id: Date.now(),
    reportId: generateReportId(),
    weekLabel: getCurrentWeekLabel(),
    dateRange: getCurrentWeekDateRange(),
    status: "Generated",
    generatedDate: getTodayDate(),
    generatedBy: "System",
    totalOpenRoles: context.weeklyRoles.length,
    totalRequirement: context.totalRequirement,
    totalFilled: context.totalFilled,
    atRiskRoles: context.atRiskRoles,
    delayedRoles: context.delayedRoles,
    dropOffs: context.dropOffs,
    sourced: context.sourced,
    screened: context.screened,
    interviewed: context.interviewed,
    offered: context.offered,
    accepted: context.accepted,
    hired: context.hired,
    missingDataCount: context.missingData.length,
    actionItemsCount: context.openActionItems.length,
    publicApplicants: context.publicSubmissions.length,
    talentPoolCount: context.allCandidates.length,
    pendingHiringNeeds: context.pendingHiringNeeds.length,
    pendingOffers: context.pendingOffers.length,
    pendingOnboarding: context.pendingOnboarding.length,
    summary:
      summaryParts.length > 0
        ? summaryParts.join(" ")
        : "No major recruitment risk detected from the current local module data.",
    roles:
      context.weeklyRoles.length > 0
        ? context.weeklyRoles
        : [
            {
              role: "No active weekly plan",
              account: "Recruitment",
              requirement: 0,
              filled: 0,
              status: "On Track",
              owner: "System",
            },
          ],
    actionItems: context.actionItemTitles,
    missingData:
      context.missingData.length > 0
        ? context.missingData
        : ["No missing data recorded."],
    generatedFromModules: true,
  };
}

export function buildEmailPreview(report) {
  if (!report) return "";

  const roleSummary = report.roles
    .map(
      (role) =>
        `- ${role.role} / ${role.account}: ${role.filled}/${role.requirement} filled, ${role.status}, Owner: ${role.owner}`,
    )
    .join("\n");

  const actionItems = report.actionItems.map((item) => `- ${item}`).join("\n");

  const missingData =
    report.missingData.length > 0
      ? report.missingData.map((item) => `- ${item}`).join("\n")
      : "- No missing data recorded.";

  return `Subject: Weekly Hiring Report - ${report.weekLabel}

Hi Team,

Please see the auto-generated weekly hiring report for ${report.dateRange}.

1. Summary
${report.summary}

2. Hiring Plan Snapshot
Total Open Roles: ${report.totalOpenRoles}
Approved Hiring Requirement: ${report.totalRequirement}
Current Filled: ${report.totalFilled}
At-Risk Roles: ${report.atRiskRoles}
Delayed Roles: ${report.delayedRoles}

3. Weekly KPI Snapshot
Sourced: ${report.sourced}
Screened: ${report.screened}
Interviewed: ${report.interviewed}
Offered: ${report.offered}
Accepted: ${report.accepted}
Hired: ${report.hired}
Drop-offs: ${report.dropOffs}

4. Recruitment Module Signals
Public Applicants: ${report.publicApplicants || 0}
Talent Pool Records: ${report.talentPoolCount || 0}
Pending Hiring Needs: ${report.pendingHiringNeeds || 0}
Pending Offers: ${report.pendingOffers || 0}
Pending Onboarding: ${report.pendingOnboarding || 0}

5. Current Status by Role / Account
${roleSummary}

6. Action Items
${actionItems}

7. Missing Data Explanation
${missingData}

Thank you.`;
}
