// import { offerApprovers } from "./offerConstants";
import { getOfferApprovalUsers } from "./offerApprovalSettings";
import { getTodayDate, toNumber } from "./offerFormatters";

export function inputClass(extra = "") {
  return `h-11 w-full rounded-xl border border-[#E6ECF2] bg-white px-4 text-sm font-semibold outline-none transition focus:border-sibs-primary-1 focus:ring-4 focus:ring-sibs-primary-1/10 ${extra}`;
}

export function calculateDailyRate(basicPay, deminimisDailyRate) {
  return toNumber(basicPay) + toNumber(deminimisDailyRate);
}

export function getCandidateKey(candidateOrOffer) {
  return String(
    candidateOrOffer?.candidateApplicationId ||
      candidateOrOffer?.applicationId ||
      candidateOrOffer?.id ||
      candidateOrOffer?.candidateEmail ||
      candidateOrOffer?.email ||
      candidateOrOffer?.candidateId ||
      "",
  );
}

export function getOfferId(candidateOrOffer, index = 0) {
  const existingOfferId =
    candidateOrOffer?.offerId || candidateOrOffer?.offerDetails?.offerId;

  if (existingOfferId) return existingOfferId;

  const candidateId = String(candidateOrOffer?.candidateId || "").replace(
    /[^0-9]/g,
    "",
  );

  if (candidateId) {
    return `OFF-${candidateId.padStart(3, "0")}`;
  }

  return `OFF-${String(index + 1).padStart(3, "0")}`;
}

export function getOfferApprovalSummary(offer) {
  const approvalUsers = getOfferApprovalUsers();
  const approvals = offer?.approvals || offer?.offerApprovals || {};

  const statuses = approvalUsers.map(
    (name) => approvals?.[name]?.status || "For Review",
  );

  if (statuses.includes("Rejected")) return "Rejected";

  if (
    approvalUsers.length > 0 &&
    statuses.every((status) => status === "Approved")
  ) {
    return "Approved";
  }

  return "For Review";
}

export function isOfferedCandidate(candidate) {
  const stage = String(
    candidate?.currentStage ||
      candidate?.stage ||
      candidate?.pipelineStage ||
      candidate?.status ||
      "",
  ).toLowerCase();

  return stage === "offered" || stage === "offer" || stage === "offer approval";
}

export function buildDefaultApprovals(candidate = {}) {
  if (candidate.offerApprovals || candidate.approvals) {
    return candidate.offerApprovals || candidate.approvals;
  }

  const approvalUsers = getOfferApprovalUsers();

  return approvalUsers.reduce((result, name) => {
    result[name] = {
      status: "For Review",
      updatedAt: null,
      remarks: "",
    };

    return result;
  }, {});
}

export function normalizePipelineCandidateToOffer(
  candidate,
  index = 0,
  override = {},
) {
  const offerDetails = {
    ...(candidate.offerDetails || {}),
    ...(override.offerDetails || {}),
  };

  const basicPay = toNumber(
    override.basicPay || offerDetails.basicPay || candidate.basicPay,
  );

  const deminimisDailyRate = toNumber(
    override.deminimisDailyRate ||
      offerDetails.deminimisDailyRate ||
      candidate.deminimisDailyRate ||
      candidate.deMinimis,
  );

  const approvals = override.approvals || buildDefaultApprovals(candidate);

  const contractSent = Boolean(
    override.contractSent ?? candidate.offerEmailSent,
  );

  const candidateResponse =
    override.candidateResponse ||
    candidate.offerDecision ||
    candidate.candidateResponse ||
    "Pending";

  const approvalSummary = getOfferApprovalSummary({ approvals });

  let status =
    override.status || candidate.offerApprovalStatus || approvalSummary;

  if (candidateResponse === "Accepted") status = "Accepted";
  if (candidateResponse === "Declined" || candidateResponse === "Rejected") {
    status = "Declined";
  }
  if (
    candidateResponse === "Negotiation" ||
    candidateResponse === "Negotiate"
  ) {
    status = "Negotiation";
  }
  if (contractSent && candidateResponse === "Pending") {
    status = "Contract Sent";
  }
  if (
    !contractSent &&
    approvalSummary === "Approved" &&
    candidateResponse === "Pending"
  ) {
    status = "Approved";
  }
  if (approvalSummary === "Rejected") {
    status = "Rejected";
  }

  return {
    id: getCandidateKey(candidate) || index + 1,
    offerId: getOfferId(candidate, index),

    candidateApplicationId:
      candidate.candidateApplicationId ||
      candidate.applicationId ||
      candidate.id,
    candidateId: candidate.candidateId,
    candidateName:
      candidate.candidateName || candidate.name || "Unnamed Candidate",
    candidateEmail: candidate.candidateEmail || candidate.email || "",

    roleTitle:
      offerDetails.roleTitle ||
      candidate.roleTitle ||
      candidate.position ||
      candidate.finalRole ||
      "Not assigned yet",

    account:
      offerDetails.account ||
      candidate.account ||
      candidate.finalAccount ||
      "Not assigned yet",

    hiringRequirementId:
      offerDetails.hiringRequirementId ||
      candidate.hiringRequirementId ||
      candidate.prfId ||
      "—",

    basicPay,
    deminimisDailyRate,
    dailyRate: calculateDailyRate(basicPay, deminimisDailyRate),

    owner:
      candidate.owner ||
      candidate.taOwner ||
      candidate.preparedBy ||
      "Current User",

    source: candidate.source || "Candidate Pipeline",
    status,

    offerDate: offerDetails.preparedAt || candidate.offerDate || getTodayDate(),

    contractSent,
    contractSentAt:
      override.contractSentAt || candidate.offerEmailSentAt || null,

    candidateResponse,
    responseDate: override.responseDate || candidate.offerDecisionAt || null,

    declineCategory: candidate.dropOffCategory || "",
    declineReason: candidate.dropOffReason || "",

    remarks:
      override.remarks ||
      candidate.offerRemarks ||
      "Offer received from Candidate Pipeline.",

    approvals,
  };
}

export function getStatusClass(status) {
  switch (status) {
    case "Accepted":
    case "Approved":
      return "border-emerald-200 bg-emerald-50 text-emerald-700";

    case "Declined":
    case "Rejected":
      return "border-red-200 bg-red-50 text-red-700";

    case "Contract Sent":
    case "Negotiation":
      return "border-blue-200 bg-blue-50 text-blue-700";

    case "For Review":
    default:
      return "border-amber-200 bg-amber-50 text-amber-700";
  }
}

export function buildPipelineOfferPayload(offer) {
  return {
    candidateApplicationId: offer.candidateApplicationId,
    candidateId: offer.candidateId,
    candidateName: offer.candidateName,
    candidateEmail: offer.candidateEmail,

    hiringRequirementId: offer.hiringRequirementId || "",
    roleTitle: offer.roleTitle || "Not assigned yet",
    account: offer.account || "Not assigned yet",
    roleAccount: `${offer.roleTitle || "Not assigned yet"} - ${
      offer.account || "Not assigned yet"
    }`,

    owner: offer.owner || "Current User",
    currentStage: "Offered",
    source: offer.source || "Offers Page",

    offerDetails: {
      hiringRequirementId: offer.hiringRequirementId || "",
      roleTitle: offer.roleTitle || "Not assigned yet",
      account: offer.account || "Not assigned yet",
      basicPay: offer.basicPay || 0,
      deminimisDailyRate: offer.deminimisDailyRate || 0,
      preparedAt: offer.offerDate || null,
      preparedBy: offer.owner || "Current User",
    },

    offerApprovals: offer.approvals || {},
    offerApprovalStatus: getOfferApprovalSummary(offer),

    offerEmailSent: Boolean(offer.contractSent),
    offerEmailSentAt: offer.contractSentAt || null,
    offerDecision: offer.candidateResponse || "Pending",
  };
}
