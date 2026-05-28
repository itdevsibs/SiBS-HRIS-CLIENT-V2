import {
  normalStageFlow,
  INTERNAL_CANDIDATES_STORAGE_KEY,
  PUBLIC_SUBMISSIONS_KEY,
  OFFER_RECORDS_STORAGE_KEY,
  OFFER_ELIGIBLE_STORAGE_KEY,
} from "./candidatePipelineConstants";

import { safeReadArray, safeWriteArray } from "./candidatePipelineStorage";

import {
  getCurrentDate,
  getCurrentTimestamp,
  formatCurrency,
} from "./candidatePipelineFormatters";

export function inputClass(extra = "") {
  return `h-11 w-full rounded-xl border border-[#D0D5DD] bg-white px-4 text-sm font-semibold text-sibs-primary-1 outline-none transition placeholder:text-sibs-tertiary-5 focus:border-sibs-primary-1 focus:ring-4 focus:ring-sibs-primary-1/10 disabled:cursor-not-allowed disabled:border-[#E6ECF2] disabled:bg-[#F8FAFC] disabled:text-sibs-tertiary-5 disabled:placeholder:text-sibs-tertiary-6 disabled:shadow-none disabled:focus:border-[#E6ECF2] disabled:focus:ring-0 ${extra}`;
}

export function textareaClass(extra = "") {
  return `w-full resize-none rounded-xl border border-[#E6ECF2] bg-white px-4 py-3 text-sm font-semibold outline-none transition focus:border-sibs-primary-1 focus:ring-4 focus:ring-sibs-primary-1/10 ${extra}`;
}

export function getRoleTitle(roleAccount = "") {
  return roleAccount.split(" - ")?.[0] || roleAccount || "";
}

export function getAccount(roleAccount = "") {
  return roleAccount.split(" - ")?.[1] || "Not assigned yet";
}

export function hasInterviewSchedule(candidate) {
  return Boolean(
    candidate?.interviewDate &&
    candidate?.interviewType &&
    candidate?.interviewType !== "-" &&
    candidate?.interviewStatus !== "For Scheduling" &&
    candidate?.interviewStatus !== "For Assessment",
  );
}

export function isPrfReviewed(candidate) {
  return Boolean(
    candidate?.prfReviewed ||
    candidate?.prfReviewedAt ||
    candidate?.currentStage !== "Initial Screening",
  );
}

export function getNextStage(currentStage) {
  const currentIndex = normalStageFlow.indexOf(currentStage);

  if (currentIndex === -1) return null;
  if (currentIndex === normalStageFlow.length - 1) return null;

  return normalStageFlow[currentIndex + 1];
}

export function getAssessmentStatus(candidate) {
  return candidate?.assessmentStatus || "Not Take";
}

export function getAssessmentResult(candidate) {
  return candidate?.assessmentResult || "";
}

export function getDisplayInterviewStatus(candidate) {
  if (!candidate) return "—";

  if (candidate.currentStage === "Initial Screening") return "For Assessment";

  if (candidate.currentStage === "Online Assessment") {
    return getAssessmentResult(candidate) ? "" : "For Assessment";
  }

  return candidate.interviewStatus || "—";
}

export function getDisplayInterviewType(candidate) {
  if (!candidate) return "—";

  if (
    candidate.currentStage === "Initial Screening" ||
    candidate.currentStage === "Online Assessment"
  ) {
    return "—";
  }

  return candidate.interviewType || "—";
}

export function canMoveToOnlineAssessment(candidate) {
  return (
    candidate?.currentStage === "Initial Screening" &&
    candidate?.prfStatus === "Matched"
  );
}

export function canScheduleInterview(candidate) {
  return (
    candidate?.currentStage === "Online Assessment" &&
    candidate?.assessmentStatus === "Taken" &&
    candidate?.assessmentResult === "Assessment Fit"
  );
}

export function canUpdateInterviewSchedule(candidate) {
  return (
    candidate?.currentStage === "Interview Scheduled" &&
    candidate?.interviewStatus !== "Completed" &&
    candidate?.interviewStatus !== "Cancelled"
  );
}

export function getStageClass(stage) {
  switch (stage) {
    case "Initial Screening":
      return "border-blue-100 bg-blue-50 text-blue-700";
    case "Online Assessment":
      return "border-cyan-100 bg-cyan-50 text-cyan-700";
    case "Interview Scheduled":
      return "border-sky-100 bg-sky-50 text-sky-700";
    case "Interviewed":
      return "border-violet-100 bg-violet-50 text-violet-700";
    case "Offered":
      return "border-amber-100 bg-amber-50 text-amber-700";
    case "Accepted":
      return "border-emerald-100 bg-emerald-50 text-emerald-700";
    case "Drop-off":
      return "border-red-100 bg-red-50 text-sibs-primary-1";
    default:
      return "border-gray-100 bg-gray-50 text-gray-600";
  }
}

export function getPrfStatusClass(status) {
  switch (status) {
    case "Matched":
      return "border-emerald-100 bg-emerald-50 text-emerald-700";
    case "Unmatched":
      return "border-red-100 bg-red-50 text-sibs-primary-1";
    case "Review":
    default:
      return "border-amber-100 bg-amber-50 text-amber-700";
  }
}

export function getInterviewStatusClass(status) {
  switch (status) {
    case "Scheduled":
      return "border-blue-100 bg-blue-50 text-blue-700";

    case "Interview in Progress":
      return "border-amber-100 bg-amber-50 text-amber-700";

    case "Rescheduled":
      return "border-emerald-100 bg-emerald-50 text-emerald-700";

    case "Completed":
      return "border-violet-100 bg-violet-50 text-violet-700";

    case "Cancelled":
      return "border-red-100 bg-red-50 text-sibs-primary-1";

    case "For Assessment":
      return "border-cyan-100 bg-cyan-50 text-cyan-700";

    case "For Scheduling":
      return "border-gray-100 bg-gray-50 text-gray-700";

    default:
      return "border-gray-100 bg-gray-50 text-gray-600";
  }
}

export function getAssessmentStatusClass(status) {
  switch (status) {
    case "Taken":
      return "border-emerald-100 bg-emerald-50 text-emerald-700";
    case "Not Take":
    default:
      return "border-amber-100 bg-amber-50 text-amber-700";
  }
}

export function getAssessmentResultClass(result) {
  switch (result) {
    case "Assessment Fit":
      return "border-emerald-100 bg-emerald-50 text-emerald-700";
    case "Assessment Not Fit":
      return "border-red-100 bg-red-50 text-sibs-primary-1";
    default:
      return "border-gray-100 bg-gray-50 text-gray-600";
  }
}

export function getOfferApprovalClass(status) {
  switch (status) {
    case "Approved":
      return "border-emerald-100 bg-emerald-50 text-emerald-700";
    case "Rejected":
      return "border-red-100 bg-red-50 text-sibs-primary-1";
    case "For Review":
    default:
      return "border-amber-100 bg-amber-50 text-amber-700";
  }
}

export function getOfferDecisionClass(status) {
  switch (status) {
    case "Accepted":
      return "border-emerald-100 bg-emerald-50 text-emerald-700";
    case "Rejected":
      return "border-red-100 bg-red-50 text-sibs-primary-1";
    case "Negotiate":
      return "border-blue-100 bg-blue-50 text-blue-700";
    default:
      return "border-gray-100 bg-gray-50 text-gray-600";
  }
}

export function getOfferApprovalSummary(candidate) {
  const approvals = candidate?.offerApprovals || {};
  const raulStatus = approvals?.["Raul Nadela"]?.status || "For Review";
  const haasanorStatus = approvals?.Haasanor?.status || "For Review";

  if (raulStatus === "Rejected" || haasanorStatus === "Rejected") {
    return "Rejected";
  }

  if (raulStatus === "Approved" && haasanorStatus === "Approved") {
    return "Approved";
  }

  return "For Review";
}

export function isOfferApproved(candidate) {
  return getOfferApprovalSummary(candidate) === "Approved";
}

export function buildAssessmentLink(candidate) {
  if (typeof window === "undefined") return "";

  const candidateId = encodeURIComponent(
    candidate?.candidateId || candidate?.id,
  );

  const email = encodeURIComponent(candidate?.email || "");

  return `${window.location.origin}/online-assessment?candidateId=${candidateId}&email=${email}`;
}

export async function triggerAssessmentEmail(candidate) {
  const assessmentLink = buildAssessmentLink(candidate);

  try {
    await fetch("/api/assessment/send-invite", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        candidateId: candidate.candidateId,
        candidateName: candidate.name,
        candidateEmail: candidate.email,
        roleAccount: candidate.roleAccount,
        assessmentLink,
      }),
    });

    return true;
  } catch {
    const subject = encodeURIComponent(
      `Online Assessment Invitation - ${getRoleTitle(candidate.roleAccount)}`,
    );

    const body = encodeURIComponent(
      `Hi ${candidate.name},

Thank you for passing the initial screening.

Please take your online assessment using the link below:

${assessmentLink}

Once completed, our Talent Acquisition team will review your assessment result.

Thank you,
SIBS Talent Acquisition`,
    );

    window.location.href = `mailto:${candidate.email}?subject=${subject}&body=${body}`;
    return true;
  }
}

export function buildOfferContractLink(candidate) {
  if (typeof window === "undefined") return "";

  const candidateId = encodeURIComponent(
    candidate?.candidateId || candidate?.id,
  );

  const email = encodeURIComponent(candidate?.email || "");

  return `${window.location.origin}/offer-contract?candidateId=${candidateId}&email=${email}`;
}

export async function triggerOfferEmail(candidate) {
  const offerLink = buildOfferContractLink(candidate);
  const offerDetails = candidate.offerDetails || {};

  try {
    await fetch("/api/offers/send-contract", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        candidateId: candidate.candidateId,
        candidateName: candidate.name,
        candidateEmail: candidate.email,
        roleAccount: candidate.roleAccount,
        offerAccount: offerDetails.account,
        compensation: offerDetails.compensation,
        basicPay: offerDetails.basicPay,
        deminimisDailyRate: offerDetails.deminimisDailyRate,
        offerLink,
      }),
    });

    return true;
  } catch {
    const subject = encodeURIComponent(
      `Offer Contract - ${getRoleTitle(candidate.roleAccount)}`,
    );

    const body = encodeURIComponent(
      `Hi ${candidate.name},

Congratulations. Your offer contract is ready for review.

Offer Account: ${offerDetails.account || getAccount(candidate.roleAccount)}
Compensation: ${formatCurrency(offerDetails.compensation)}
Basic Pay: ${formatCurrency(offerDetails.basicPay)}
Deminimis / Daily Rate: ${formatCurrency(offerDetails.deminimisDailyRate)}

Please review your contract using the link below:

${offerLink}

You may choose Accept, Reject, or Request to Negotiate after checking the contract.

Thank you,
SIBS Talent Acquisition`,
    );

    window.location.href = `mailto:${candidate.email}?subject=${subject}&body=${body}`;
    return true;
  }
}

export function getPipelineApplicationRoleAccount(candidate) {
  const offerRole =
    candidate?.offerDetails?.roleTitle || candidate?.offeredRoleTitle;

  const offerAccount =
    candidate?.offerDetails?.account || candidate?.offeredAccount;

  if (offerRole || offerAccount) {
    return `${offerRole || "Not assigned yet"} - ${
      offerAccount || "Not assigned yet"
    }`;
  }

  if (candidate?.roleAccount) return candidate.roleAccount;

  const roleTitle = candidate?.roleTitle || "Not assigned yet";
  const account = candidate?.account || "Not assigned yet";

  return `${roleTitle || "Not assigned yet"} - ${
    account || "Not assigned yet"
  }`;
}

export function getCandidateMasterStatusFromPipeline(candidate) {
  if (
    candidate?.currentStage === "Accepted" ||
    candidate?.offerDecision === "Accepted"
  ) {
    return "Hired / Active";
  }

  if (candidate?.currentStage === "Drop-off") {
    if (
      candidate?.dropOffCategory === "Failed Assessment" ||
      candidate?.dropOffCategory === "Failed Interview" ||
      candidate?.assessmentResult === "Assessment Not Fit"
    ) {
      return "Failed";
    }

    if (
      candidate?.dropOffCategory === "No Response" ||
      candidate?.dropOffCategory === "Personal Reason" ||
      candidate?.dropOffCategory === "Accepted Other Offer"
    ) {
      return "Withdrawn";
    }

    return "Recyclable";
  }

  return null;
}

export function buildPipelineSummaryForTalentPool(candidate) {
  const roleAccount = getPipelineApplicationRoleAccount(candidate);

  return {
    pipelineStatus:
      candidate?.currentStage === "Accepted" ||
      candidate?.currentStage === "Drop-off"
        ? "Closed"
        : candidate?.applicationStatus || "Active",
    currentApplicationId:
      candidate?.applicationId ||
      candidate?.candidateApplicationId ||
      candidate?.id ||
      "",
    currentHiringRequirementId: candidate?.hiringRequirementId || "",
    currentPipelineStage: candidate?.currentStage || "Initial Screening",
    currentApplicationStatus: candidate?.applicationStatus || "Active",
    currentAppliedRole:
      candidate?.currentStage === "Offered" ||
      candidate?.currentStage === "Accepted"
        ? candidate?.offerDetails?.roleTitle ||
          candidate?.roleTitle ||
          getRoleTitle(roleAccount) ||
          "Not assigned yet"
        : "Not assigned yet",
    currentAppliedAccount:
      candidate?.currentStage === "Offered" ||
      candidate?.currentStage === "Accepted"
        ? candidate?.offerDetails?.account ||
          candidate?.account ||
          getAccount(roleAccount) ||
          "Not assigned yet"
        : "Not assigned yet",
    currentTaOwner: candidate?.taOwner || candidate?.owner || "—",
    currentPrfStatus: candidate?.prfStatus || "Review",
    currentAssessmentStatus: candidate?.assessmentStatus || "Not Take",
    currentAssessmentResult: candidate?.assessmentResult || "",
    currentInterviewStatus: candidate?.interviewStatus || "—",
    currentOfferStatus:
      candidate?.offerApprovalStatus || getOfferApprovalSummary(candidate),
    currentOfferDecision: candidate?.offerDecision || "",
    currentInterviewDate: candidate?.interviewDate || "",
    currentDropOffCategory: candidate?.dropOffCategory || "",
    currentDropOffReason: candidate?.dropOffReason || "",
    lastPipelineUpdate:
      candidate?.updatedAt || candidate?.dateMoved || getCurrentDate(),
  };
}

export function buildTalentPoolApplicationHistoryEntry(candidate, summary) {
  const latestTimeline =
    Array.isArray(candidate?.timeline) && candidate.timeline.length
      ? candidate.timeline[candidate.timeline.length - 1]
      : null;

  const isDropOff = candidate?.currentStage === "Drop-off";
  const role = summary.currentAppliedRole || "Not assigned yet";
  const account = summary.currentAppliedAccount || "Not assigned yet";
  const date = summary.lastPipelineUpdate || getCurrentDate();

  if (isDropOff) {
    const reason =
      candidate?.dropOffReason ||
      latestTimeline?.dropOffReason ||
      "No drop-off reason provided.";

    const category =
      candidate?.dropOffCategory ||
      latestTimeline?.dropOffCategory ||
      "Drop-off";

    return {
      role,
      account,
      outcome: `Drop-off - ${category}: ${reason}`,
      date,
    };
  }

  if (latestTimeline) {
    return {
      role,
      account,
      outcome:
        latestTimeline.reason ||
        `Pipeline Update: ${summary.currentPipelineStage}`,
      date,
    };
  }

  return {
    role,
    account,
    outcome: `Pipeline Update: ${summary.currentPipelineStage}`,
    date,
  };
}

export function upsertTalentPoolApplicationHistory(
  existingHistory,
  candidate,
  summary,
) {
  const history = Array.isArray(existingHistory) ? existingHistory : [];
  const entry = buildTalentPoolApplicationHistoryEntry(candidate, summary);
  const entryKey = `${entry.date}|${entry.outcome}`;

  const alreadyExists = history.some(
    (item) => `${item.date}|${item.outcome}` === entryKey,
  );

  return alreadyExists ? history : [...history, entry];
}

export function syncTalentPoolFromPipelineApplication(candidate) {
  if (!candidate || typeof window === "undefined") return;

  const internalCandidates = safeReadArray(INTERNAL_CANDIDATES_STORAGE_KEY);
  if (!internalCandidates.length) return;

  const masterStatus = getCandidateMasterStatusFromPipeline(candidate);
  const summary = buildPipelineSummaryForTalentPool(candidate);

  const candidateEmail = String(
    candidate.email || candidate.candidateEmail || "",
  ).toLowerCase();

  let didUpdate = false;

  const nextCandidates = internalCandidates.map((item) => {
    const isMatch =
      String(item.id || "") ===
        String(
          candidate.candidateMasterId || candidate.masterCandidateId || "",
        ) ||
      String(item.candidateId || "") === String(candidate.candidateId || "") ||
      String(item.email || "").toLowerCase() === candidateEmail;

    if (!isMatch) return item;

    didUpdate = true;

    return {
      ...item,
      ...summary,
      status: masterStatus || item.status || "New Applicant",
      accountFit:
        candidate.currentStage === "Offered" ||
        candidate.currentStage === "Accepted"
          ? summary.currentAppliedAccount ||
            item.accountFit ||
            "Not assigned yet"
          : item.accountFit || "Not assigned yet",
      lastActivity: getCurrentDate(),
      applicationHistory: upsertTalentPoolApplicationHistory(
        item.applicationHistory,
        candidate,
        summary,
      ),
    };
  });

  if (didUpdate) {
    safeWriteArray(INTERNAL_CANDIDATES_STORAGE_KEY, nextCandidates);
  }
}

export function normalizeCandidate(candidate) {
  if (!candidate) return candidate;

  const candidateSnapshot = candidate.candidateSnapshot || {};

  const currentStage =
    candidate.currentStage === "QA Certified"
      ? "Interviewed"
      : candidate.currentStage || "Initial Screening";

  const roleAccount = getPipelineApplicationRoleAccount(candidate);

  const candidateName =
    candidate.name ||
    candidate.candidateName ||
    candidateSnapshot.name ||
    "Unnamed Candidate";

  const normalized = {
    ...candidateSnapshot,
    ...candidate,
    id:
      candidate.id ||
      candidate.candidateApplicationId ||
      candidate.applicationId ||
      Date.now(),
    candidateApplicationId:
      candidate.candidateApplicationId ||
      candidate.applicationId ||
      candidate.id,
    candidateMasterId:
      candidate.candidateMasterId ||
      candidate.masterCandidateId ||
      candidateSnapshot.id,
    name: candidateName,
    candidateName,
    email:
      candidate.email ||
      candidate.candidateEmail ||
      candidateSnapshot.email ||
      "",
    contactNumber:
      candidate.contactNumber ||
      candidateSnapshot.phoneNumber1 ||
      candidateSnapshot.contactNumber ||
      "",
    roleAccount,
    roleTitle:
      candidate.offerDetails?.roleTitle ||
      candidate.roleTitle ||
      getRoleTitle(roleAccount) ||
      "Not assigned yet",
    account:
      candidate.offerDetails?.account ||
      candidate.account ||
      getAccount(roleAccount) ||
      "Not assigned yet",
    owner:
      candidate.owner ||
      candidate.taOwner ||
      candidateSnapshot.taOwner ||
      candidateSnapshot.createdBy ||
      "Current User",
    taOwner:
      candidate.taOwner ||
      candidate.owner ||
      candidateSnapshot.taOwner ||
      candidateSnapshot.createdBy ||
      "Current User",
    source: candidate.source || candidateSnapshot.source || "Talent Pool",
    currentStage,
    applicationStatus: candidate.applicationStatus || "Active",
    assessmentStatus: candidate.assessmentStatus || "Not Take",
    assessmentResult: candidate.assessmentResult || "",
    assessmentEmailSent: Boolean(candidate.assessmentEmailSent),
    assessmentEmailSentAt: candidate.assessmentEmailSentAt || null,
    assessmentTakenAt: candidate.assessmentTakenAt || null,
    assessmentTaggedAt: candidate.assessmentTaggedAt || null,
    assessmentRemarks: candidate.assessmentRemarks || "",
    onlineInterviewLink: candidate.onlineInterviewLink || "",
    offerDetails: candidate.offerDetails || null,
    offerApprovals: candidate.offerApprovals || {
      "Raul Nadela": { status: "For Review", updatedAt: null, remarks: "" },
      Haasanor: { status: "For Review", updatedAt: null, remarks: "" },
    },
    offerApprovalStatus:
      candidate.offerApprovalStatus || getOfferApprovalSummary(candidate),
    offerEmailSent: Boolean(candidate.offerEmailSent),
    offerEmailSentAt: candidate.offerEmailSentAt || null,
    offerDecision: candidate.offerDecision || "",
    offerDecisionAt: candidate.offerDecisionAt || null,
    offerDecisionRemarks: candidate.offerDecisionRemarks || "",
    timeline: Array.isArray(candidate.timeline) ? candidate.timeline : [],
  };

  if (currentStage === "Initial Screening") {
    return {
      ...normalized,
      interviewDate: null,
      interviewType: "-",
      interviewStatus: "For Assessment",
      onlineInterviewLink: "",
    };
  }

  if (currentStage === "Online Assessment") {
    return {
      ...normalized,
      interviewDate: null,
      interviewType: "-",
      interviewStatus: "For Assessment",
      onlineInterviewLink: "",
    };
  }

  return normalized;
}

export function getOfferRecordStatusFromCandidate(candidate) {
  if (
    candidate?.offerDecision === "Accepted" ||
    candidate?.currentStage === "Accepted"
  ) {
    return "Accepted";
  }

  if (
    candidate?.offerDecision === "Rejected" ||
    candidate?.currentStage === "Drop-off"
  ) {
    return "Declined";
  }

  if (candidate?.offerDecision === "Negotiate") return "Negotiation";
  if (candidate?.offerEmailSent) return "Contract Sent";
  if (isOfferApproved(candidate)) return "Approved";

  if (
    (candidate?.offerApprovalStatus || getOfferApprovalSummary(candidate)) ===
    "Rejected"
  ) {
    return "Rejected";
  }

  return "For Review";
}

export function upsertOfferRecordFromPipeline(candidate) {
  if (!candidate || typeof window === "undefined") return;

  const current = safeReadArray(OFFER_RECORDS_STORAGE_KEY);

  const candidateApplicationId =
    candidate.candidateApplicationId || candidate.applicationId || candidate.id;

  const candidateEmail = String(
    candidate.email || candidate.candidateEmail || "",
  ).toLowerCase();

  const existingIndex = current.findIndex(
    (offer) =>
      String(offer.candidateApplicationId || "") ===
        String(candidateApplicationId || "") ||
      String(offer.candidateEmail || "").toLowerCase() === candidateEmail,
  );

  const existing = existingIndex >= 0 ? current[existingIndex] : null;

  const nextId =
    existing?.id ||
    current.reduce((max, offer) => Math.max(max, Number(offer.id) || 0), 0) + 1;

  const offerDetails = candidate.offerDetails || {};
  const basicPay = Number(offerDetails.basicPay || candidate.basicPay || 0);

  const deminimisDailyRate = Number(
    offerDetails.deminimisDailyRate || candidate.deminimisDailyRate || 0,
  );

  const candidateResponse =
    candidate.offerDecision === "Accepted"
      ? "Accepted"
      : candidate.offerDecision === "Rejected"
        ? "Declined"
        : candidate.offerDecision === "Negotiate"
          ? "Negotiation"
          : existing?.candidateResponse || "Pending";

  const payload = {
    ...(existing || {}),
    id: nextId,
    offerId: existing?.offerId || `OFF-${String(nextId).padStart(3, "0")}`,
    candidateApplicationId,
    candidateId: candidate.candidateId,
    candidateName: candidate.name || candidate.candidateName,
    candidateEmail: candidate.email || candidate.candidateEmail,
    roleTitle:
      offerDetails.roleTitle ||
      candidate.roleTitle ||
      getRoleTitle(candidate.roleAccount),
    account:
      offerDetails.account ||
      candidate.account ||
      getAccount(candidate.roleAccount),
    hiringRequirementId:
      offerDetails.hiringRequirementId || candidate.hiringRequirementId || "—",
    basicPay,
    deminimisDailyRate,
    dailyRate: basicPay + deminimisDailyRate,
    owner: candidate.taOwner || candidate.owner || "Current User",
    source: candidate.source || "Candidate Pipeline",
    status: getOfferRecordStatusFromCandidate(candidate),
    offerDate: existing?.offerDate || getCurrentDate(),
    contractSent: Boolean(candidate.offerEmailSent),
    contractSentAt:
      candidate.offerEmailSentAt || existing?.contractSentAt || null,
    candidateResponse,
    responseDate: candidate.offerDecisionAt || existing?.responseDate || null,
    declineCategory:
      candidate.dropOffCategory || existing?.declineCategory || "",
    declineReason: candidate.dropOffReason || existing?.declineReason || "",
    remarks:
      candidate.reasonForMovement ||
      existing?.remarks ||
      "Offer received from Candidate Pipeline.",
    approvals: candidate.offerApprovals ||
      existing?.approvals || {
        "Raul Nadela": { status: "For Review", updatedAt: null, remarks: "" },
        Haasanor: { status: "For Review", updatedAt: null, remarks: "" },
      },
  };

  const next =
    existingIndex >= 0
      ? current.map((offer, index) =>
          index === existingIndex ? payload : offer,
        )
      : [payload, ...current];

  safeWriteArray(OFFER_RECORDS_STORAGE_KEY, next);
}

export function upsertOfferEligibleCandidate(candidate) {
  const current = safeReadArray(OFFER_ELIGIBLE_STORAGE_KEY);

  const payload = {
    candidateApplicationId: candidate.candidateApplicationId || candidate.id,
    candidateId: candidate.candidateId,
    candidateName: candidate.name,
    candidateEmail: candidate.email,
    hiringRequirementId:
      candidate.hiringRequirementId ||
      candidate.offerDetails?.hiringRequirementId ||
      "",
    roleTitle: getRoleTitle(candidate.roleAccount),
    account: getAccount(candidate.roleAccount),
    roleAccount: candidate.roleAccount,
    owner: candidate.owner,
    currentStage: "Offered",
    source: candidate.source,
    assessmentStatus: candidate.assessmentStatus,
    assessmentResult: candidate.assessmentResult,
    offerDetails: candidate.offerDetails || null,
    offerApprovals: candidate.offerApprovals || null,
    offerApprovalStatus:
      candidate.offerApprovalStatus || getOfferApprovalSummary(candidate),
    offerEmailSent: Boolean(candidate.offerEmailSent),
    offerEmailSentAt: candidate.offerEmailSentAt || null,
    offerDecision: candidate.offerDecision || "",
  };

  const next = current.some(
    (item) =>
      String(item.candidateApplicationId) ===
        String(payload.candidateApplicationId) ||
      item.candidateEmail === payload.candidateEmail,
  )
    ? current.map((item) =>
        String(item.candidateApplicationId) ===
          String(payload.candidateApplicationId) ||
        item.candidateEmail === payload.candidateEmail
          ? payload
          : item,
      )
    : [payload, ...current];

  safeWriteArray(OFFER_ELIGIBLE_STORAGE_KEY, next);
  upsertOfferRecordFromPipeline(candidate);
}

export function removeOfferEligibleCandidate(candidate) {
  const current = safeReadArray(OFFER_ELIGIBLE_STORAGE_KEY);

  const next = current.filter(
    (item) =>
      String(item.candidateApplicationId) !==
        String(candidate.candidateApplicationId || candidate.id) &&
      item.candidateEmail !== candidate.email,
  );

  safeWriteArray(OFFER_ELIGIBLE_STORAGE_KEY, next);
}

export function asDisplayValue(value) {
  if (Array.isArray(value)) {
    return value.filter(Boolean).join(", ") || "—";
  }

  if (value === null || value === undefined || value === "") return "—";

  return String(value);
}

export function findTalentPoolProfile(candidate) {
  if (!candidate || typeof window === "undefined") return candidate || {};

  const internalCandidates = safeReadArray(INTERNAL_CANDIDATES_STORAGE_KEY);
  const publicSubmissions = safeReadArray(PUBLIC_SUBMISSIONS_KEY);

  const candidateMasterId =
    candidate.candidateMasterId || candidate.masterCandidateId;

  const candidateApplicationId =
    candidate.candidateApplicationId || candidate.id;

  const matchedInternal = internalCandidates.find((item) => {
    return (
      String(item.id) === String(candidateMasterId) ||
      String(item.candidateId) === String(candidate.candidateId) ||
      String(item.email || "").toLowerCase() ===
        String(candidate.email || "").toLowerCase()
    );
  });

  const matchedPublic = publicSubmissions.find((item) => {
    return (
      String(item.id) === String(candidateApplicationId) ||
      String(item.candidateId) === String(candidate.candidateId) ||
      String(item.email || "").toLowerCase() ===
        String(candidate.email || "").toLowerCase()
    );
  });

  return {
    ...(matchedPublic || {}),
    ...(matchedInternal || {}),
    ...candidate,
  };
}
