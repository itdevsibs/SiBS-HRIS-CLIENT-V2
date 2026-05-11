import React, { useEffect, useMemo, useState } from "react";
import Header from "../../components/layout/Header";

import {
  Search,
  Eye,
  ArrowRight,
  X,
  UserX,
  CalendarDays,
  ClipboardCheck,
  Mail,
  RotateCcw,
  Plus,
  SlidersHorizontal,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
} from "lucide-react";

const CANDIDATE_APPLICATIONS_STORAGE_KEY = "ta_candidate_applications";
const PIPELINE_CANDIDATES_STORAGE_KEY = "ta_pipeline_candidates";
const OFFER_ELIGIBLE_STORAGE_KEY = "ta_offer_eligible_candidates";
const INTERNAL_CANDIDATES_STORAGE_KEY = "ta_internal_candidates";
const PUBLIC_SUBMISSIONS_KEY = "ta_public_candidate_submissions";

const pipelineStages = [
  "Lead / Sourced",
  "Initial Screening",
  "Online Assessment",
  "Interview Scheduled",
  "Interviewed",
  "Offered",
  "Accepted",
  "Drop-off",
];

const normalStageFlow = [
  "Lead / Sourced",
  "Initial Screening",
  "Online Assessment",
  "Interview Scheduled",
  "Interviewed",
  "Offered",
  "Accepted",
];

const roleOptions = ["All Roles", "CSR", "QA", "RCM Analyst", "IT Support"];

const accountOptions = [
  "All Accounts",
  "Client A",
  "Client B",
  "Client C",
  "SIBS",
];

const interviewTypeOptions = ["Online", "Face-to-face"];

const offerApprovers = ["Raul Nadela", "Haasanor"];

const offerApprovalStatusOptions = ["For Review", "Approved", "Rejected"];

const offerDecisionOptions = ["Negotiate", "Rejected", "Accepted"];

const prfStatusOptions = ["Review", "Matched", "Unmatched"];

const assessmentStatusOptions = ["Not Take", "Taken"];

const assessmentResultOptions = ["Assessment Fit", "Assessment Not Fit"];

const dropOffCategoryOptions = [
  "Compensation",
  "Schedule",
  "Process Delay",
  "No Response",
  "Failed Assessment",
  "Failed Interview",
  "Accepted Other Offer",
  "Location Issue",
  "Personal Reason",
  "Incomplete Requirements",
  "Others",
];

function inputClass(extra = "") {
  return `h-11 w-full rounded-xl border border-[#D0D5DD] bg-white px-4 text-sm font-semibold text-sibs-primary-1 outline-none transition placeholder:text-sibs-tertiary-5 focus:border-sibs-primary-1 focus:ring-4 focus:ring-sibs-primary-1/10 ${extra}`;
}

function textareaClass(extra = "") {
  return `w-full resize-none rounded-xl border border-[#E6ECF2] bg-white px-4 py-3 text-sm font-semibold outline-none transition focus:border-sibs-primary-1 focus:ring-4 focus:ring-sibs-primary-1/10 ${extra}`;
}

function safeReadArray(key) {
  if (typeof window === "undefined") return [];

  try {
    const raw = window.localStorage.getItem(key);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function safeWriteArray(key, value) {
  if (typeof window === "undefined") return;

  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // localStorage only
  }
}

function getCurrentTimestamp() {
  return new Date().toLocaleString("en-PH", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function getCurrentDate() {
  return new Date().toISOString().split("T")[0];
}

function getRoleTitle(roleAccount = "") {
  return roleAccount.split(" - ")?.[0] || roleAccount || "";
}

function getAccount(roleAccount = "") {
  return roleAccount.split(" - ")?.[1] || "SIBS";
}

function formatDateTime(date) {
  if (!date) return "—";

  return new Date(date).toLocaleDateString("en-PH", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function formatTime(date) {
  if (!date) return "—";

  return new Date(date).toLocaleTimeString("en-PH", {
    hour: "numeric",
    minute: "2-digit",
  });
}

function formatMonthYear(date) {
  return date.toLocaleDateString("en-PH", {
    month: "long",
    year: "numeric",
  });
}

function toDateInputValue(date) {
  if (!date) return "";
  return String(date).slice(0, 16);
}

function getMonthKey(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  return `${year}-${month}`;
}

function getDateKey(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function hasInterviewSchedule(candidate) {
  return Boolean(
    candidate?.interviewDate &&
      candidate?.interviewType &&
      candidate?.interviewType !== "-" &&
      candidate?.interviewStatus !== "For Scheduling" &&
      candidate?.interviewStatus !== "Not Screened"
  );
}

function isPrfReviewed(candidate) {
  return Boolean(
    candidate?.prfReviewed ||
      candidate?.prfReviewedAt ||
      candidate?.currentStage !== "Lead / Sourced"
  );
}

function getNextStage(currentStage) {
  const currentIndex = normalStageFlow.indexOf(currentStage);

  if (currentIndex === -1) return null;
  if (currentIndex === normalStageFlow.length - 1) return null;

  return normalStageFlow[currentIndex + 1];
}

function getAssessmentStatus(candidate) {
  return candidate?.assessmentStatus || "Not Take";
}

function getAssessmentResult(candidate) {
  return candidate?.assessmentResult || "";
}

function getDisplayInterviewStatus(candidate) {
  if (!candidate) return "—";

  if (candidate.currentStage === "Lead / Sourced") return "Not Screened";
  if (candidate.currentStage === "Initial Screening") return "For Assessment";

  if (candidate.currentStage === "Online Assessment") {
    return getAssessmentResult(candidate) ? "" : "For Assessment";
  }

  return candidate.interviewStatus || "—";
}

function getDisplayInterviewType(candidate) {
  if (!candidate) return "—";

  if (
    candidate.currentStage === "Lead / Sourced" ||
    candidate.currentStage === "Initial Screening" ||
    candidate.currentStage === "Online Assessment"
  ) {
    return "—";
  }

  return candidate.interviewType || "—";
}

function canMoveToOnlineAssessment(candidate) {
  return (
    candidate?.currentStage === "Initial Screening" &&
    candidate?.prfStatus === "Matched"
  );
}

function canScheduleInterview(candidate) {
  return (
    candidate?.currentStage === "Online Assessment" &&
    candidate?.assessmentStatus === "Taken" &&
    candidate?.assessmentResult === "Assessment Fit"
  );
}

function canUpdateInterviewSchedule(candidate) {
  return (
    candidate?.currentStage === "Interview Scheduled" &&
    candidate?.interviewStatus !== "Completed" &&
    candidate?.interviewStatus !== "Cancelled"
  );
}

function getStageClass(stage) {
  switch (stage) {
    case "Lead / Sourced":
      return "border-blue-100 bg-blue-50 text-blue-700";
    case "Initial Screening":
      return "border-indigo-100 bg-indigo-50 text-indigo-700";
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
      return "border-red-100 bg-red-50 text-red-700";
    default:
      return "border-gray-100 bg-gray-50 text-gray-600";
  }
}

function getPrfStatusClass(status) {
  switch (status) {
    case "Matched":
      return "border-emerald-100 bg-emerald-50 text-emerald-700";
    case "Unmatched":
      return "border-red-100 bg-red-50 text-red-700";
    case "Review":
    default:
      return "border-amber-100 bg-amber-50 text-amber-700";
  }
}

function getInterviewStatusClass(status) {
  switch (status) {
    case "Scheduled":
      return "border-blue-100 bg-blue-50 text-blue-700";
    case "Rescheduled":
      return "border-emerald-100 bg-emerald-50 text-emerald-700";
    case "Completed":
      return "border-violet-100 bg-violet-50 text-violet-700";
    case "Cancelled":
      return "border-red-100 bg-red-50 text-red-700";
    case "For Assessment":
      return "border-cyan-100 bg-cyan-50 text-cyan-700";
    case "For Scheduling":
      return "border-gray-100 bg-gray-50 text-gray-700";
    case "Not Screened":
      return "border-slate-100 bg-slate-50 text-slate-600";
    default:
      return "border-gray-100 bg-gray-50 text-gray-600";
  }
}

function getAssessmentStatusClass(status) {
  switch (status) {
    case "Taken":
      return "border-emerald-100 bg-emerald-50 text-emerald-700";
    case "Not Take":
    default:
      return "border-amber-100 bg-amber-50 text-amber-700";
  }
}

function getAssessmentResultClass(result) {
  switch (result) {
    case "Assessment Fit":
      return "border-emerald-100 bg-emerald-50 text-emerald-700";
    case "Assessment Not Fit":
      return "border-red-100 bg-red-50 text-red-700";
    default:
      return "border-gray-100 bg-gray-50 text-gray-600";
  }
}

function getOfferApprovalClass(status) {
  switch (status) {
    case "Approved":
      return "border-emerald-100 bg-emerald-50 text-emerald-700";
    case "Rejected":
      return "border-red-100 bg-red-50 text-red-700";
    case "For Review":
    default:
      return "border-amber-100 bg-amber-50 text-amber-700";
  }
}

function getOfferDecisionClass(status) {
  switch (status) {
    case "Accepted":
      return "border-emerald-100 bg-emerald-50 text-emerald-700";
    case "Rejected":
      return "border-red-100 bg-red-50 text-red-700";
    case "Negotiate":
      return "border-blue-100 bg-blue-50 text-blue-700";
    default:
      return "border-gray-100 bg-gray-50 text-gray-600";
  }
}

function formatCurrency(value) {
  const amount = Number(value || 0);

  if (!amount) return "—";

  return amount.toLocaleString("en-PH", {
    style: "currency",
    currency: "PHP",
    minimumFractionDigits: 2,
  });
}

function getOfferApprovalSummary(candidate) {
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

function isOfferApproved(candidate) {
  return getOfferApprovalSummary(candidate) === "Approved";
}

function buildAssessmentLink(candidate) {
  if (typeof window === "undefined") return "";

  const candidateId = encodeURIComponent(candidate?.candidateId || candidate?.id);
  const email = encodeURIComponent(candidate?.email || "");

  return `${window.location.origin}/online-assessment?candidateId=${candidateId}&email=${email}`;
}

async function triggerAssessmentEmail(candidate) {
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
      `Online Assessment Invitation - ${getRoleTitle(candidate.roleAccount)}`
    );

    const body = encodeURIComponent(
      `Hi ${candidate.name},

Thank you for passing the initial screening.

Please take your online assessment using the link below:

${assessmentLink}

Once completed, our Talent Acquisition team will review your assessment result.

Thank you,
SIBS Talent Acquisition`
    );

    window.location.href = `mailto:${candidate.email}?subject=${subject}&body=${body}`;
    return true;
  }
}

function buildOfferContractLink(candidate) {
  if (typeof window === "undefined") return "";

  const candidateId = encodeURIComponent(candidate?.candidateId || candidate?.id);
  const email = encodeURIComponent(candidate?.email || "");

  return `${window.location.origin}/offer-contract?candidateId=${candidateId}&email=${email}`;
}

async function triggerOfferEmail(candidate) {
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
      `Offer Contract - ${getRoleTitle(candidate.roleAccount)}`
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

You may choose Negotiate, Reject, or Accepted after checking the contract.

Thank you,
SIBS Talent Acquisition`
    );

    window.location.href = `mailto:${candidate.email}?subject=${subject}&body=${body}`;
    return true;
  }
}

const defaultPipelineCandidates = [
  {
    id: 1,
    candidateApplicationId: 1,
    candidateId: "CAND-001",
    name: "Juan Dela Cruz",
    email: "juan.delacruz@email.com",
    roleAccount: "CSR - Client A",
    source: "Referral",
    owner: "Maria Reyes",
    currentStage: "Lead / Sourced",
    previousStage: null,
    prfStatus: "Review",
    prfReviewed: false,
    prfReviewedAt: null,
    interviewDate: null,
    interviewType: "-",
    interviewStatus: "Not Screened",
    assessmentStatus: "Not Take",
    assessmentResult: "",
    assessmentEmailSent: false,
    assessmentEmailSentAt: null,
    assessmentTakenAt: null,
    assessmentTaggedAt: null,
    assessmentRemarks: "",
    dateMoved: getCurrentDate(),
    reasonForMovement: "Candidate was added to the talent pool.",
    avatarColor: "bg-blue-600",
    dropOffReason: null,
    dropOffCategory: null,
    dropOffRemarks: null,
    timeline: [
      {
        stage: "Lead / Sourced",
        owner: "Maria Reyes",
        source: "Referral",
        timestamp: getCurrentTimestamp(),
        reason: "Candidate was added to the talent pool.",
      },
    ],
  },
  {
    id: 2,
    candidateApplicationId: 2,
    candidateId: "CAND-002",
    name: "Maria Santos",
    email: "maria.santos@email.com",
    roleAccount: "QA - Client B",
    source: "JobStreet",
    owner: "John Dela Cruz",
    currentStage: "Initial Screening",
    previousStage: "Lead / Sourced",
    prfStatus: "Matched",
    prfReviewed: true,
    prfReviewedAt: getCurrentTimestamp(),
    interviewDate: null,
    interviewType: "-",
    interviewStatus: "For Assessment",
    assessmentStatus: "Not Take",
    assessmentResult: "",
    assessmentEmailSent: false,
    assessmentEmailSentAt: null,
    assessmentTakenAt: null,
    assessmentTaggedAt: null,
    assessmentRemarks: "",
    dateMoved: getCurrentDate(),
    reasonForMovement:
      "PRF status changed to Matched. Candidate moved to Initial Screening.",
    avatarColor: "bg-cyan-600",
    dropOffReason: null,
    dropOffCategory: null,
    dropOffRemarks: null,
    timeline: [
      {
        stage: "Lead / Sourced",
        owner: "John Dela Cruz",
        source: "JobStreet",
        timestamp: getCurrentTimestamp(),
        reason: "Candidate was added to the talent pool.",
      },
      {
        stage: "Initial Screening",
        owner: "John Dela Cruz",
        source: "PRF Review",
        timestamp: getCurrentTimestamp(),
        reason:
          "PRF status changed to Matched. Candidate moved to Initial Screening.",
      },
    ],
  },
  {
    id: 3,
    candidateApplicationId: 3,
    candidateId: "CAND-003",
    name: "Mark Reyes",
    email: "mark.reyes@email.com",
    roleAccount: "RCM Analyst - Client C",
    source: "LinkedIn",
    owner: "Kim Domingo",
    currentStage: "Interview Scheduled",
    previousStage: "Online Assessment",
    prfStatus: "Matched",
    prfReviewed: true,
    prfReviewedAt: getCurrentTimestamp(),
    interviewDate: "2025-04-29T11:00",
    interviewType: "Online",
    interviewStatus: "Scheduled",
    assessmentStatus: "Taken",
    assessmentResult: "Assessment Fit",
    assessmentEmailSent: true,
    assessmentEmailSentAt: getCurrentTimestamp(),
    assessmentTakenAt: getCurrentTimestamp(),
    assessmentTaggedAt: getCurrentTimestamp(),
    assessmentRemarks: "Candidate passed online assessment.",
    dateMoved: getCurrentDate(),
    reasonForMovement:
      "Candidate passed online assessment. Interview schedule has been set.",
    avatarColor: "bg-orange-600",
    dropOffReason: null,
    dropOffCategory: null,
    dropOffRemarks: null,
    timeline: [
      {
        stage: "Lead / Sourced",
        owner: "Kim Domingo",
        source: "LinkedIn",
        timestamp: getCurrentTimestamp(),
        reason: "Candidate was added to the talent pool.",
      },
      {
        stage: "Initial Screening",
        owner: "Kim Domingo",
        source: "PRF Review",
        timestamp: getCurrentTimestamp(),
        reason:
          "PRF status changed to Matched. Candidate moved to Initial Screening.",
      },
      {
        stage: "Online Assessment",
        owner: "Kim Domingo",
        source: "Online Assessment",
        timestamp: getCurrentTimestamp(),
        reason:
          "Candidate moved from Initial Screening to Online Assessment. Assessment email sent.",
      },
      {
        stage: "Interview Scheduled",
        owner: "Kim Domingo",
        source: "Interview Scheduling",
        timestamp: getCurrentTimestamp(),
        reason:
          "Candidate passed online assessment. Interview schedule has been set.",
      },
    ],
  },
];

function normalizeCandidate(candidate) {
  if (!candidate) return candidate;

  const currentStage =
    candidate.currentStage === "QA Certified"
      ? "Interviewed"
      : candidate.currentStage;

  const normalized = {
    ...candidate,
    currentStage,
    assessmentStatus: candidate.assessmentStatus || "Not Take",
    assessmentResult: candidate.assessmentResult || "",
    assessmentEmailSent: Boolean(candidate.assessmentEmailSent),
    assessmentEmailSentAt: candidate.assessmentEmailSentAt || null,
    assessmentTakenAt: candidate.assessmentTakenAt || null,
    assessmentTaggedAt: candidate.assessmentTaggedAt || null,
    assessmentRemarks: candidate.assessmentRemarks || "",
    offerDetails: candidate.offerDetails || null,
    offerApprovals: candidate.offerApprovals || {
      "Raul Nadela": { status: "For Review", updatedAt: null, remarks: "" },
      Haasanor: { status: "For Review", updatedAt: null, remarks: "" },
    },
    offerApprovalStatus: candidate.offerApprovalStatus || getOfferApprovalSummary(candidate),
    offerEmailSent: Boolean(candidate.offerEmailSent),
    offerEmailSentAt: candidate.offerEmailSentAt || null,
    offerDecision: candidate.offerDecision || "",
    offerDecisionAt: candidate.offerDecisionAt || null,
    offerDecisionRemarks: candidate.offerDecisionRemarks || "",
    timeline: Array.isArray(candidate.timeline) ? candidate.timeline : [],
  };

  if (currentStage === "Lead / Sourced") {
    return {
      ...normalized,
      interviewDate: null,
      interviewType: "-",
      interviewStatus: "Not Screened",
    };
  }

  if (currentStage === "Initial Screening") {
    return {
      ...normalized,
      interviewDate: null,
      interviewType: "-",
      interviewStatus: "For Assessment",
    };
  }

  if (currentStage === "Online Assessment") {
    return {
      ...normalized,
      interviewDate: null,
      interviewType: "-",
      interviewStatus: "For Assessment",
    };
  }

  return normalized;
}

function loadPipelineCandidateData() {
  const applicationCandidates = safeReadArray(
    CANDIDATE_APPLICATIONS_STORAGE_KEY
  );

  const pipelineCandidatesFromStorage = safeReadArray(
    PIPELINE_CANDIDATES_STORAGE_KEY
  );

  return applicationCandidates.length > 0
    ? applicationCandidates
    : pipelineCandidatesFromStorage;
}

function savePipelineCandidateData(candidates) {
  safeWriteArray(PIPELINE_CANDIDATES_STORAGE_KEY, candidates);
  safeWriteArray(CANDIDATE_APPLICATIONS_STORAGE_KEY, candidates);
}

function upsertOfferEligibleCandidate(candidate) {
  const current = safeReadArray(OFFER_ELIGIBLE_STORAGE_KEY);

  const payload = {
    candidateApplicationId: candidate.candidateApplicationId || candidate.id,
    candidateId: candidate.candidateId,
    candidateName: candidate.name,
    candidateEmail: candidate.email,
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
    offerApprovalStatus: candidate.offerApprovalStatus || getOfferApprovalSummary(candidate),
    offerEmailSent: Boolean(candidate.offerEmailSent),
    offerEmailSentAt: candidate.offerEmailSentAt || null,
    offerDecision: candidate.offerDecision || "",
  };

  const next = current.some(
    (item) =>
      String(item.candidateApplicationId) ===
        String(payload.candidateApplicationId) ||
      item.candidateEmail === payload.candidateEmail
  )
    ? current.map((item) =>
        String(item.candidateApplicationId) ===
          String(payload.candidateApplicationId) ||
        item.candidateEmail === payload.candidateEmail
          ? payload
          : item
      )
    : [payload, ...current];

  safeWriteArray(OFFER_ELIGIBLE_STORAGE_KEY, next);
}

function removeOfferEligibleCandidate(candidate) {
  const current = safeReadArray(OFFER_ELIGIBLE_STORAGE_KEY);

  const next = current.filter(
    (item) =>
      String(item.candidateApplicationId) !==
        String(candidate.candidateApplicationId || candidate.id) &&
      item.candidateEmail !== candidate.email
  );

  safeWriteArray(OFFER_ELIGIBLE_STORAGE_KEY, next);
}

function CandidateAvatar({ candidate }) {
  const initials = String(candidate.name || "?")
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <div
      className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white ${
        candidate.avatarColor || "bg-sibs-primary-1"
      }`}
    >
      {initials}
    </div>
  );
}

function DashboardMetric({ label, value }) {
  return (
    <div className="rounded-xl border border-[#E6ECF2] bg-white px-4 py-5 text-center shadow-sm">
      <p className="text-xs font-bold text-[#475467]">{label}</p>
      <p className="mt-3 text-3xl font-extrabold text-sibs-primary-1">
        {value}
      </p>
    </div>
  );
}

function DetailRow({ label, value }) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-gray-100 py-3 last:border-b-0">
      <p className="text-[11px] font-bold uppercase tracking-wide text-sibs-tertiary-5">
        {label}
      </p>

      <div className="max-w-[62%] break-words text-right text-sm font-bold text-[#344054]">
        {value || "—"}
      </div>
    </div>
  );
}

function asDisplayValue(value) {
  if (Array.isArray(value)) {
    return value.filter(Boolean).join(", ") || "—";
  }

  if (value === null || value === undefined || value === "") return "—";

  return String(value);
}

function findTalentPoolProfile(candidate) {
  if (!candidate || typeof window === "undefined") return candidate || {};

  const internalCandidates = safeReadArray(INTERNAL_CANDIDATES_STORAGE_KEY);
  const publicSubmissions = safeReadArray(PUBLIC_SUBMISSIONS_KEY);
  const candidateMasterId = candidate.candidateMasterId || candidate.masterCandidateId;
  const candidateApplicationId = candidate.candidateApplicationId || candidate.id;

  const matchedInternal = internalCandidates.find((item) => {
    return (
      String(item.id) === String(candidateMasterId) ||
      String(item.candidateId) === String(candidate.candidateId) ||
      String(item.email || "").toLowerCase() === String(candidate.email || "").toLowerCase()
    );
  });

  const matchedPublic = publicSubmissions.find((item) => {
    return (
      String(item.id) === String(candidateApplicationId) ||
      String(item.candidateId) === String(candidate.candidateId) ||
      String(item.email || "").toLowerCase() === String(candidate.email || "").toLowerCase()
    );
  });

  return {
    ...(matchedPublic || {}),
    ...(matchedInternal || {}),
    ...candidate,
  };
}

function ProfileDetailCard({ title, children }) {
  return (
    <div className="rounded-xl border border-[#E6ECF2] bg-white p-4 shadow-sm">
      <h4 className="mb-3 text-xs font-extrabold uppercase tracking-wide text-sibs-primary-1">
        {title}
      </h4>
      <div className="space-y-1">{children}</div>
    </div>
  );
}

function CandidateTalentPoolDetailsPanel({ candidate }) {
  const profile = findTalentPoolProfile(candidate);
  const workExperiences = Array.isArray(profile.workExperiences)
    ? profile.workExperiences
    : Array.isArray(profile.otherExperiences)
      ? profile.otherExperiences
      : [];

  const references = Array.isArray(profile.references)
    ? profile.references
    : [
        profile.reference1 || profile.referenceName1
          ? {
              name: profile.reference1 || profile.referenceName1,
              phone: profile.reference1Phone || profile.referencePhone1,
            }
          : null,
        profile.reference2 || profile.referenceName2
          ? {
              name: profile.reference2 || profile.referenceName2,
              phone: profile.reference2Phone || profile.referencePhone2,
            }
          : null,
        profile.reference3 || profile.referenceName3
          ? {
              name: profile.reference3 || profile.referenceName3,
              phone: profile.reference3Phone || profile.referencePhone3,
            }
          : null,
      ].filter(Boolean);

  return (
    <div className="rounded-xl border border-blue-100 bg-blue-50 p-5 shadow-sm">
      <div className="mb-4 flex flex-col gap-1">
        <h3 className="text-sm font-extrabold text-sibs-primary-1">
          Talent Pool Submitted Details
        </h3>
        <p className="text-xs font-semibold leading-5 text-sibs-primary-1/75">
          This shows the details captured from the Talent Pool / Public Form for TA review.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        <ProfileDetailCard title="Application Source">
          <DetailRow label="How Heard About Us" value={asDisplayValue(profile.heardFrom || profile.howHeard || profile.howDidYouHearAboutUs || profile.sources)} />
          <DetailRow label="Open Position" value={profile.openPosition || profile.appliedPosition || profile.roleCapability || getRoleTitle(profile.roleAccount)} />
          <DetailRow label="Nickname" value={profile.nickname} />
          <DetailRow label="Applying Location" value={profile.applicationLocation || profile.locationApplyingFor || profile.site || profile.location} />
          <DetailRow label="Referred By" value={profile.referredBy || profile.whoReferredYou || profile.referrer || profile.source} />
          <DetailRow label="Employee ID" value={profile.employeeId || profile.referrerEmployeeId} />
        </ProfileDetailCard>

        <ProfileDetailCard title="Personal Information">
          <DetailRow label="First Name" value={profile.firstName} />
          <DetailRow label="Last Name" value={profile.lastName} />
          <DetailRow label="Middle Name" value={profile.middleName} />
          <DetailRow label="Suffix" value={profile.suffix || profile.extension} />
          <DetailRow label="Date of Birth" value={profile.dateOfBirth} />
          <DetailRow label="Email" value={profile.email} />
          <DetailRow label="Phone 1" value={profile.phone1 || profile.phoneNumber1 || profile.contactNumber} />
          <DetailRow label="Phone 2" value={profile.phone2 || profile.phoneNumber2} />
          <DetailRow label="Physical Address" value={profile.physicalAddress} />
        </ProfileDetailCard>

        <ProfileDetailCard title="Work Experience">
          <DetailRow label="Work Experience" value={profile.workExperience || profile.hasWorkExperience} />
          {workExperiences.length > 0 ? (
            <div className="space-y-3 pt-2">
              {workExperiences.map((experience, index) => (
                <div
                  key={`experience-${index}`}
                  className="rounded-xl border border-[#E6ECF2] bg-[#F8FAFC] p-3"
                >
                  <p className="mb-2 text-xs font-extrabold text-sibs-primary-1">
                    Experience {index + 1}
                  </p>
                  <DetailRow label="Industry" value={experience.industry || experience.relevantExperience || experience.industryExperience} />
                  <DetailRow label="Length" value={experience.lengthOfWorkExperience || experience.length || experience.experienceLength} />
                  <DetailRow label="Years" value={experience.years} />
                  <DetailRow label="Role" value={experience.role} />
                  <DetailRow label="Company" value={experience.company} />
                  <DetailRow label="Monthly Compensation" value={experience.monthlyCompensation} />
                  <DetailRow label="Reason for Leaving" value={experience.reasonForLeaving} />
                </div>
              ))}
            </div>
          ) : (
            <>
              <DetailRow label="Industry" value={profile.industry || profile.industryExperience} />
              <DetailRow label="Length" value={profile.lengthOfWorkExperience || profile.experienceLength} />
              <DetailRow label="Years" value={profile.years} />
              <DetailRow label="Role" value={profile.experienceRole || profile.role} />
              <DetailRow label="Company" value={profile.company} />
              <DetailRow label="Monthly Compensation" value={profile.monthlyCompensation} />
              <DetailRow label="Reason for Leaving" value={profile.reasonForLeaving} />
            </>
          )}
        </ProfileDetailCard>

        <ProfileDetailCard title="Education and Certifications">
          <DetailRow label="Highest Educational Attainment" value={profile.educationalAttainment || profile.highestEducationalAttainment} />
          <DetailRow label="Affiliations / Certifications" value={asDisplayValue(profile.affiliations || profile.certifications)} />
          <DetailRow label="Training Attended" value={profile.trainingAttended} />
        </ProfileDetailCard>

        <ProfileDetailCard title="Work Readiness">
          <DetailRow label="Fully Vaccinated" value={profile.fullyVaccinated} />
          <DetailRow label="Comfortable On Site" value={profile.comfortableOnSite} />
          <DetailRow label="Willing Graveyard" value={profile.willingGraveyard} />
          <DetailRow label="Employment Interest" value={profile.employmentInterest} />
          <DetailRow label="Remote Work Access" value={profile.remoteWorkAccess} />
          <DetailRow label="Willing Drug Test" value={profile.willingDrugTest} />
          <DetailRow label="Background Check Consent" value={profile.willingBackgroundCheck} />
        </ProfileDetailCard>

        <ProfileDetailCard title="References and Uploads">
          {references.length > 0 ? (
            references.map((reference, index) => (
              <DetailRow
                key={`reference-${index}`}
                label={`Reference ${index + 1}`}
                value={`${reference.name || "—"}${reference.phone ? ` / ${reference.phone}` : ""}`}
              />
            ))
          ) : (
            <DetailRow label="References" value={profile.references} />
          )}
          <DetailRow label="Audio File" value={profile.audioFileName || profile.audioFile?.name || profile.audioUploadName} />
          <DetailRow label="Attachment" value={profile.attachmentFileName || profile.supportingFileName || profile.resumeFileName || profile.fileUploadName} />
          <DetailRow label="Terms Accepted" value={profile.consent || profile.termsAccepted ? "Yes" : "—"} />
        </ProfileDetailCard>
      </div>
    </div>
  );
}

function MoveStageModal({
  open,
  candidate,
  form,
  setForm,
  onClose,
  onSubmit,
}) {
  if (!open || !candidate) return null;

  const nextStage = getNextStage(candidate.currentStage);
  if (!nextStage) return null;

  return (
    <div
      className="fixed inset-0 z-[10000] flex h-dvh items-center justify-center bg-black/40 px-4 py-4"
      onClick={onClose}
    >
      <div
        className="flex max-h-[92dvh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4 border-b border-gray-100 px-5 py-4 sm:px-6 sm:py-5">
          <div>
            <h2 className="text-lg font-bold text-sibs-primary-1 sm:text-xl">
              Move Candidate
            </h2>
            <p className="mt-1 text-sm font-medium text-sibs-tertiary-5">
              Confirm movement from {candidate.currentStage} to {nextStage}.
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-2 text-gray-400 transition hover:bg-gray-100 hover:text-gray-700"
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={onSubmit} className="flex-1 overflow-y-auto p-4 sm:p-6">
          <div className="space-y-5">
            <div className="rounded-xl border border-blue-100 bg-blue-50 p-5">
              <h3 className="text-lg font-bold text-sibs-primary-1">
                {candidate.name}
              </h3>
              <p className="mt-1 text-sm font-semibold text-sibs-primary-1/80">
                {candidate.roleAccount}
              </p>

              <div className="mt-3 flex flex-wrap items-center gap-2">
                <span
                  className={`inline-flex rounded-full border px-3 py-1 text-xs font-bold ${getStageClass(
                    candidate.currentStage
                  )}`}
                >
                  From: {candidate.currentStage}
                </span>

                <ArrowRight size={15} className="text-sibs-primary-1" />

                <span
                  className={`inline-flex rounded-full border px-3 py-1 text-xs font-bold ${getStageClass(
                    nextStage
                  )}`}
                >
                  To: {nextStage}
                </span>
              </div>
            </div>

            {nextStage === "Online Assessment" && (
              <div className="rounded-xl border border-cyan-100 bg-cyan-50 p-4 text-sm font-semibold leading-6 text-cyan-800">
                After confirming, the candidate will move to Online Assessment,
                assessment status will be set to Not Take, and the assessment
                email will be triggered.
              </div>
            )}

            {nextStage === "Offered" && (
              <div className="rounded-xl border border-amber-100 bg-amber-50 p-4 text-sm font-semibold leading-6 text-amber-800">
                Candidate will move from Interviewed to Offered.
              </div>
            )}

            <div>
              <label className="mb-1 block text-[11px] font-bold uppercase tracking-wide text-sibs-tertiary-5">
                Movement Reason <span className="text-red-500">*</span>
              </label>

              <textarea
                required
                rows={4}
                value={form.reason}
                onChange={(e) => setForm({ ...form, reason: e.target.value })}
                className={textareaClass()}
              />
            </div>

            <div>
              <label className="mb-1 block text-[11px] font-bold uppercase tracking-wide text-sibs-tertiary-5">
                Internal Remarks
              </label>

              <textarea
                rows={3}
                value={form.remarks}
                onChange={(e) => setForm({ ...form, remarks: e.target.value })}
                className={textareaClass()}
              />
            </div>
          </div>
        </form>

        <div className="border-t border-gray-100 px-5 py-4 sm:px-6">
          <div className="flex flex-col justify-end gap-2 sm:flex-row">
            <button
              type="button"
              onClick={onClose}
              className="inline-flex h-11 items-center justify-center rounded-xl border border-[#E6ECF2] bg-white px-5 text-sm font-bold text-gray-600 transition hover:bg-gray-50"
            >
              Cancel
            </button>

            <button
              type="button"
              onClick={onSubmit}
              className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-sibs-primary-1 px-5 text-sm font-bold text-white transition hover:opacity-90"
            >
              <ArrowRight size={16} />
              Confirm Move
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function ScheduleInterviewModal({
  open,
  candidate,
  form,
  setForm,
  onClose,
  onSubmit,
}) {
  if (!open || !candidate) return null;

  const isUpdatingSchedule = candidate.currentStage === "Interview Scheduled";

  return (
    <div
      className="fixed inset-0 z-[10001] flex h-dvh items-center justify-center bg-black/40 px-4 py-4"
      onClick={onClose}
    >
      <div
        className="flex max-h-[92dvh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4 border-b border-gray-100 px-5 py-4 sm:px-6 sm:py-5">
          <div>
            <h2 className="text-lg font-bold text-sibs-primary-1 sm:text-xl">
              {isUpdatingSchedule ? "Update Interview Schedule" : "Schedule Interview"}
            </h2>
            <p className="mt-1 text-sm font-medium text-sibs-tertiary-5">
              {isUpdatingSchedule
                ? "Update the interview date, time, and interview type."
                : "Only candidates tagged as Assessment Fit can be scheduled."}
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-2 text-gray-400 transition hover:bg-gray-100 hover:text-gray-700"
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={onSubmit} className="flex-1 overflow-y-auto p-4 sm:p-6">
          <div className="space-y-5">
            <div className="rounded-xl border border-blue-100 bg-blue-50 p-5">
              <h3 className="text-lg font-bold text-sibs-primary-1">
                {candidate.name}
              </h3>
              <p className="mt-1 text-sm font-semibold text-sibs-primary-1/80">
                {candidate.roleAccount}
              </p>

              <div className="mt-3 flex flex-wrap gap-2">
                <span
                  className={`inline-flex rounded-full border px-3 py-1 text-xs font-bold ${getAssessmentResultClass(
                    getAssessmentResult(candidate)
                  )}`}
                >
                  {getAssessmentResult(candidate) || "No Result"}
                </span>

                {isUpdatingSchedule && (
                  <span
                    className={`inline-flex rounded-full border px-3 py-1 text-xs font-bold ${getInterviewStatusClass(
                      candidate.interviewStatus
                    )}`}
                  >
                    {candidate.interviewStatus || "Scheduled"}
                  </span>
                )}
              </div>
            </div>

            {!isUpdatingSchedule && !canScheduleInterview(candidate) && (
              <div className="rounded-xl border border-red-100 bg-red-50 p-4 text-sm font-semibold leading-6 text-red-700">
                This candidate cannot be scheduled yet. Assessment must be Taken
                and tagged as Assessment Fit.
              </div>
            )}

            <div>
              <label className="mb-1 block text-[11px] font-bold uppercase tracking-wide text-sibs-tertiary-5">
                Interview Date and Time <span className="text-red-500">*</span>
              </label>

              <input
                required
                type="datetime-local"
                value={form.interviewDate}
                onChange={(e) =>
                  setForm({ ...form, interviewDate: e.target.value })
                }
                className={inputClass()}
              />
            </div>

            <div>
              <label className="mb-1 block text-[11px] font-bold uppercase tracking-wide text-sibs-tertiary-5">
                Interview Type <span className="text-red-500">*</span>
              </label>

              <select
                required
                value={form.interviewType}
                onChange={(e) =>
                  setForm({ ...form, interviewType: e.target.value })
                }
                className={inputClass()}
              >
                <option value="">Select interview type</option>
                {interviewTypeOptions.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-1 block text-[11px] font-bold uppercase tracking-wide text-sibs-tertiary-5">
                Remarks
              </label>

              <textarea
                rows={3}
                value={form.remarks}
                onChange={(e) =>
                  setForm({ ...form, remarks: e.target.value })
                }
                className={textareaClass()}
                placeholder={
                  isUpdatingSchedule
                    ? "Example: Candidate requested to reschedule."
                    : "Example: Initial interview schedule created."
                }
              />
            </div>
          </div>
        </form>

        <div className="border-t border-gray-100 px-5 py-4 sm:px-6">
          <div className="flex flex-col justify-end gap-2 sm:flex-row">
            <button
              type="button"
              onClick={onClose}
              className="inline-flex h-11 items-center justify-center rounded-xl border border-[#E6ECF2] bg-white px-5 text-sm font-bold text-gray-600 transition hover:bg-gray-50"
            >
              Cancel
            </button>

            <button
              type="button"
              onClick={onSubmit}
              className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-sibs-primary-1 px-5 text-sm font-bold text-white transition hover:opacity-90"
            >
              <CalendarDays size={16} />
              {isUpdatingSchedule ? "Update Schedule" : "Save Schedule"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function AssessmentModal({
  open,
  candidate,
  form,
  setForm,
  onClose,
  onSubmit,
  onSendEmail,
}) {
  if (!open || !candidate) return null;

  const isTaken = form.assessmentStatus === "Taken";

  return (
    <div
      className="fixed inset-0 z-[10002] flex h-dvh items-center justify-center bg-black/40 px-4 py-4"
      onClick={onClose}
    >
      <div
        className="flex max-h-[92dvh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4 border-b border-gray-100 px-5 py-4 sm:px-6 sm:py-5">
          <div>
            <h2 className="text-lg font-bold text-sibs-primary-1 sm:text-xl">
              Online Assessment
            </h2>
            <p className="mt-1 text-sm font-medium text-sibs-tertiary-5">
              Update status and tag result after candidate takes assessment.
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-2 text-gray-400 transition hover:bg-gray-100 hover:text-gray-700"
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={onSubmit} className="flex-1 overflow-y-auto p-4 sm:p-6">
          <div className="space-y-5">
            <div className="rounded-xl border border-cyan-100 bg-cyan-50 p-5">
              <h3 className="text-lg font-bold text-cyan-800">
                {candidate.name}
              </h3>
              <p className="mt-1 text-sm font-semibold text-cyan-800/80">
                {candidate.email}
              </p>

              <div className="mt-3 flex flex-wrap gap-2">
                <span
                  className={`inline-flex rounded-full border px-3 py-1 text-xs font-bold ${getAssessmentStatusClass(
                    getAssessmentStatus(candidate)
                  )}`}
                >
                  Assessment: {getAssessmentStatus(candidate)}
                </span>

                <span
                  className={`inline-flex rounded-full border px-3 py-1 text-xs font-bold ${getAssessmentResultClass(
                    getAssessmentResult(candidate)
                  )}`}
                >
                  {getAssessmentResult(candidate) || "No Result"}
                </span>
              </div>
            </div>

            <div className="rounded-xl border border-[#E6ECF2] bg-[#F8FAFC] p-4">
              <DetailRow
                label="Assessment Email Sent"
                value={candidate.assessmentEmailSent ? "Yes" : "No"}
              />
              <DetailRow
                label="Email Sent At"
                value={candidate.assessmentEmailSentAt}
              />
              <DetailRow
                label="Assessment Link"
                value={buildAssessmentLink(candidate)}
              />
            </div>

            <button
              type="button"
              onClick={() => onSendEmail(candidate)}
              className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl border border-cyan-100 bg-cyan-50 px-5 text-sm font-bold text-cyan-700 transition hover:bg-cyan-100"
            >
              <Mail size={16} />
              Resend Assessment Email
            </button>

            <div>
              <label className="mb-1 block text-[11px] font-bold uppercase tracking-wide text-sibs-tertiary-5">
                Assessment Status <span className="text-red-500">*</span>
              </label>

              <select
                required
                value={form.assessmentStatus}
                onChange={(e) =>
                  setForm({
                    ...form,
                    assessmentStatus: e.target.value,
                    assessmentResult:
                      e.target.value === "Taken" ? form.assessmentResult : "",
                  })
                }
                className={inputClass()}
              >
                {assessmentStatusOptions.map((status) => (
                  <option key={status} value={status}>
                    {status}
                  </option>
                ))}
              </select>
            </div>

            {isTaken && (
              <div>
                <label className="mb-1 block text-[11px] font-bold uppercase tracking-wide text-sibs-tertiary-5">
                  Assessment Result <span className="text-red-500">*</span>
                </label>

                <select
                  required
                  value={form.assessmentResult}
                  onChange={(e) =>
                    setForm({ ...form, assessmentResult: e.target.value })
                  }
                  className={inputClass()}
                >
                  <option value="">Select result</option>
                  {assessmentResultOptions.map((result) => (
                    <option key={result} value={result}>
                      {result}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div>
              <label className="mb-1 block text-[11px] font-bold uppercase tracking-wide text-sibs-tertiary-5">
                Assessment Remarks
              </label>

              <textarea
                rows={4}
                value={form.assessmentRemarks}
                onChange={(e) =>
                  setForm({ ...form, assessmentRemarks: e.target.value })
                }
                placeholder="Example: Candidate completed assessment and passed required score."
                className={textareaClass()}
              />
            </div>
          </div>
        </form>

        <div className="border-t border-gray-100 px-5 py-4 sm:px-6">
          <div className="flex flex-col justify-end gap-2 sm:flex-row">
            <button
              type="button"
              onClick={onClose}
              className="inline-flex h-11 items-center justify-center rounded-xl border border-[#E6ECF2] bg-white px-5 text-sm font-bold text-gray-600 transition hover:bg-gray-50"
            >
              Cancel
            </button>

            <button
              type="button"
              onClick={onSubmit}
              className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-sibs-primary-1 px-5 text-sm font-bold text-white transition hover:opacity-90"
            >
              <ClipboardCheck size={16} />
              Save Assessment
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function DropOffModal({
  open,
  candidate,
  form,
  setForm,
  onClose,
  onSubmit,
}) {
  if (!open || !candidate) return null;

  return (
    <div
      className="fixed inset-0 z-[10003] flex h-dvh items-center justify-center bg-black/40 px-4 py-4"
      onClick={onClose}
    >
      <div
        className="flex max-h-[92dvh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4 border-b border-gray-100 px-5 py-4 sm:px-6 sm:py-5">
          <div>
            <h2 className="text-lg font-bold text-red-700 sm:text-xl">
              Mark Candidate as Drop-off
            </h2>
            <p className="mt-1 text-sm font-medium text-sibs-tertiary-5">
              Capture reason before removing from active pipeline.
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-2 text-gray-400 transition hover:bg-gray-100 hover:text-gray-700"
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={onSubmit} className="flex-1 overflow-y-auto p-4 sm:p-6">
          <div className="space-y-5">
            <div className="rounded-xl border border-red-100 bg-red-50 p-5">
              <h3 className="text-lg font-bold text-red-700">
                {candidate.name}
              </h3>
              <p className="mt-1 text-sm font-semibold text-red-700/80">
                {candidate.roleAccount}
              </p>
            </div>

            <div>
              <label className="mb-1 block text-[11px] font-bold uppercase tracking-wide text-sibs-tertiary-5">
                Reason Category <span className="text-red-500">*</span>
              </label>

              <select
                required
                value={form.category}
                onChange={(e) =>
                  setForm({ ...form, category: e.target.value })
                }
                className={inputClass()}
              >
                <option value="">Select category</option>
                {dropOffCategoryOptions.map((category) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-1 block text-[11px] font-bold uppercase tracking-wide text-sibs-tertiary-5">
                Drop-off Reason <span className="text-red-500">*</span>
              </label>

              <textarea
                required
                rows={4}
                value={form.reason}
                onChange={(e) => setForm({ ...form, reason: e.target.value })}
                className={textareaClass()}
              />
            </div>

            <div>
              <label className="mb-1 block text-[11px] font-bold uppercase tracking-wide text-sibs-tertiary-5">
                Remarks
              </label>

              <textarea
                rows={3}
                value={form.remarks}
                onChange={(e) => setForm({ ...form, remarks: e.target.value })}
                className={textareaClass()}
              />
            </div>
          </div>
        </form>

        <div className="border-t border-gray-100 px-5 py-4 sm:px-6">
          <div className="flex flex-col justify-end gap-2 sm:flex-row">
            <button
              type="button"
              onClick={onClose}
              className="inline-flex h-11 items-center justify-center rounded-xl border border-[#E6ECF2] bg-white px-5 text-sm font-bold text-gray-600 transition hover:bg-gray-50"
            >
              Cancel
            </button>

            <button
              type="button"
              onClick={onSubmit}
              className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-red-600 px-5 text-sm font-bold text-white transition hover:bg-red-700"
            >
              <UserX size={16} />
              Confirm Drop-off
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function OfferDetailsModal({
  open,
  candidate,
  form,
  setForm,
  onClose,
  onSubmit,
}) {
  if (!open || !candidate) return null;

  return (
    <div
      className="fixed inset-0 z-[10004] flex h-dvh items-center justify-center bg-black/40 px-4 py-4"
      onClick={onClose}
    >
      <div
        className="flex max-h-[92dvh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4 border-b border-gray-100 px-5 py-4 sm:px-6 sm:py-5">
          <div>
            <h2 className="text-lg font-bold text-sibs-primary-1 sm:text-xl">
              Offer Details for Approval
            </h2>
            <p className="mt-1 text-sm font-medium text-sibs-tertiary-5">
              Add the account and compensation before sending the offer to Raul Nadela and Haasanor for approval.
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-2 text-gray-400 transition hover:bg-gray-100 hover:text-gray-700"
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={onSubmit} className="flex-1 overflow-y-auto p-4 sm:p-6">
          <div className="space-y-5">
            <div className="rounded-xl border border-amber-100 bg-amber-50 p-5">
              <h3 className="text-lg font-bold text-amber-800">
                {candidate.name}
              </h3>
              <p className="mt-1 text-sm font-semibold text-amber-800/80">
                {candidate.roleAccount}
              </p>
            </div>

            <div>
              <label className="mb-1 block text-[11px] font-bold uppercase tracking-wide text-sibs-tertiary-5">
                Offer Account <span className="text-red-500">*</span>
              </label>
              <select
                required
                value={form.account}
                onChange={(e) => setForm({ ...form, account: e.target.value })}
                className={inputClass()}
              >
                <option value="">Select account</option>
                {accountOptions
                  .filter((account) => account !== "All Accounts")
                  .map((account) => (
                    <option key={account} value={account}>
                      {account}
                    </option>
                  ))}
              </select>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <div>
                <label className="mb-1 block text-[11px] font-bold uppercase tracking-wide text-sibs-tertiary-5">
                  Compensation <span className="text-red-500">*</span>
                </label>
                <input
                  required
                  type="number"
                  min="0"
                  step="0.01"
                  value={form.compensation}
                  onChange={(e) => setForm({ ...form, compensation: e.target.value })}
                  className={inputClass()}
                  placeholder="0.00"
                />
              </div>

              <div>
                <label className="mb-1 block text-[11px] font-bold uppercase tracking-wide text-sibs-tertiary-5">
                  Basic Pay <span className="text-red-500">*</span>
                </label>
                <input
                  required
                  type="number"
                  min="0"
                  step="0.01"
                  value={form.basicPay}
                  onChange={(e) => setForm({ ...form, basicPay: e.target.value })}
                  className={inputClass()}
                  placeholder="0.00"
                />
              </div>

              <div>
                <label className="mb-1 block text-[11px] font-bold uppercase tracking-wide text-sibs-tertiary-5">
                  Deminimis / Daily Rate <span className="text-red-500">*</span>
                </label>
                <input
                  required
                  type="number"
                  min="0"
                  step="0.01"
                  value={form.deminimisDailyRate}
                  onChange={(e) =>
                    setForm({ ...form, deminimisDailyRate: e.target.value })
                  }
                  className={inputClass()}
                  placeholder="0.00"
                />
              </div>
            </div>

            <div>
              <label className="mb-1 block text-[11px] font-bold uppercase tracking-wide text-sibs-tertiary-5">
                Remarks
              </label>
              <textarea
                rows={3}
                value={form.remarks}
                onChange={(e) => setForm({ ...form, remarks: e.target.value })}
                className={textareaClass()}
                placeholder="Example: Offer prepared after passed interview."
              />
            </div>

            <div className="rounded-xl border border-amber-100 bg-amber-50 p-4 text-sm font-semibold leading-6 text-amber-800">
              After proceeding, the offer will move to Offered with Raul Nadela and Haasanor marked as For Review.
            </div>
          </div>
        </form>

        <div className="border-t border-gray-100 px-5 py-4 sm:px-6">
          <div className="flex flex-col justify-end gap-2 sm:flex-row">
            <button
              type="button"
              onClick={onClose}
              className="inline-flex h-11 items-center justify-center rounded-xl border border-[#E6ECF2] bg-white px-5 text-sm font-bold text-gray-600 transition hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={onSubmit}
              className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-sibs-primary-1 px-5 text-sm font-bold text-white transition hover:opacity-90"
            >
              <ArrowRight size={16} />
              Proceed for Approval
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function LeadPrfReviewCard({ candidate, onUpdatePrfStatus }) {
  return (
    <div className="rounded-xl border border-[#E6ECF2] bg-white p-5 shadow-sm">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h3 className="text-sm font-bold text-[#101828]">PRF Review</h3>
          <p className="mt-1 text-xs font-semibold leading-5 text-sibs-tertiary-5">
            Tag the lead as Review, Matched, or Unmatched before moving forward.
          </p>
        </div>

        <span
          className={`w-fit rounded-full border px-3 py-1 text-xs font-bold ${getPrfStatusClass(
            candidate.prfStatus || "Review"
          )}`}
        >
          Current: {candidate.prfStatus || "Review"}
        </span>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-3">
        {prfStatusOptions.map((status) => (
          <button
            key={status}
            type="button"
            onClick={() => onUpdatePrfStatus(candidate, status)}
            className={`inline-flex h-10 items-center justify-center rounded-xl border px-4 text-sm font-bold transition ${getPrfStatusClass(
              status
            )}`}
          >
            Set as {status}
          </button>
        ))}
      </div>
    </div>
  );
}

function CandidatePipelineModal({
  open,
  candidate,
  onClose,
  onUpdatePrfStatus,
  onOpenScheduleModal,
  onOpenMoveModal,
  onOpenAssessmentModal,
  onOpenDropOffModal,
  onCompleteInterview,
  onSendAssessmentEmail,
  onCancelInterview,
  onUpdateOfferApproval,
  onSendOfferEmail,
  onOfferDecision,
}) {
  const [showTalentPoolDetails, setShowTalentPoolDetails] = useState(false);

  useEffect(() => {
    setShowTalentPoolDetails(false);
  }, [candidate?.id, open]);

  if (!open || !candidate) return null;

  const nextStage = getNextStage(candidate.currentStage);

  const isLeadStage = candidate.currentStage === "Lead / Sourced";
  const isInitialScreening = candidate.currentStage === "Initial Screening";
  const isOnlineAssessment = candidate.currentStage === "Online Assessment";
  const isInterviewScheduled = candidate.currentStage === "Interview Scheduled";
  const isOffered = candidate.currentStage === "Offered";
  const isAccepted = candidate.currentStage === "Accepted";
  const candidateHasSchedule = hasInterviewSchedule(candidate);
  const modalStatus = getDisplayInterviewStatus(candidate);

  return (
    <div
      className="fixed inset-0 z-[9999] flex h-dvh items-center justify-center bg-black/40 px-4 py-4"
      onClick={onClose}
    >
      <div
        className="flex max-h-[92dvh] w-full max-w-5xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4 border-b border-gray-100 px-5 py-4 sm:px-6 sm:py-5">
          <div>
            <h2 className="text-lg font-bold text-sibs-primary-1 sm:text-xl">
              Candidate Pipeline Details
            </h2>
            <p className="mt-1 text-sm font-medium text-sibs-tertiary-5">
              View candidate movement, online assessment, and interview status.
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-2 text-gray-400 transition hover:bg-gray-100 hover:text-gray-700"
          >
            <X size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 sm:p-6">
          <div
            className={`grid grid-cols-1 gap-5 ${
              isLeadStage || isInitialScreening ? "" : "xl:grid-cols-[1fr_360px]"
            }`}
          >
            <div className="space-y-5">
              <div className="rounded-xl border border-[#E6ECF2] bg-white p-5 shadow-sm">
                <div className="flex items-start gap-4">
                  <CandidateAvatar candidate={candidate} />

                  <div className="min-w-0 flex-1">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                      <div className="min-w-0">
                        <h3 className="break-words text-xl font-bold text-[#101828]">
                          {candidate.name}
                        </h3>
                        <p className="mt-1 break-words text-sm font-semibold text-sibs-tertiary-5">
                          {candidate.email}
                        </p>
                      </div>

                      <button
                        type="button"
                        onClick={() => setShowTalentPoolDetails((prev) => !prev)}
                        className="inline-flex h-10 shrink-0 items-center justify-center gap-2 rounded-xl border border-blue-100 bg-blue-50 px-4 text-sm font-bold text-blue-700 transition hover:bg-blue-100"
                      >
                        Talent Details
                        <ChevronDown
                          size={16}
                          className={`transition-transform ${
                            showTalentPoolDetails ? "rotate-180" : ""
                          }`}
                        />
                      </button>
                    </div>

                    <div className="mt-3 flex flex-wrap gap-2">
                      <span
                        className={`inline-flex rounded-full border px-3 py-1 text-xs font-bold ${getStageClass(
                          candidate.currentStage
                        )}`}
                      >
                        {candidate.currentStage}
                      </span>

                      <span
                        className={`inline-flex rounded-full border px-3 py-1 text-xs font-bold ${getPrfStatusClass(
                          candidate.prfStatus || "Review"
                        )}`}
                      >
                        PRF: {candidate.prfStatus || "Review"}
                      </span>

                      {modalStatus && (
                        <span
                          className={`inline-flex rounded-full border px-3 py-1 text-xs font-bold ${getInterviewStatusClass(
                            modalStatus
                          )}`}
                        >
                          {modalStatus}
                        </span>
                      )}

                      {!isLeadStage && candidate.assessmentResult && (
                        <span
                          className={`inline-flex rounded-full border px-3 py-1 text-xs font-bold ${getAssessmentResultClass(
                            candidate.assessmentResult
                          )}`}
                        >
                          {candidate.assessmentResult}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {showTalentPoolDetails && (
                <CandidateTalentPoolDetailsPanel candidate={candidate} />
              )}

              {(isLeadStage || isInitialScreening) && (
                <LeadPrfReviewCard
                  candidate={candidate}
                  onUpdatePrfStatus={onUpdatePrfStatus}
                />
              )}

              <div className="rounded-xl border border-[#E6ECF2] bg-white p-5 shadow-sm">
                <h3 className="text-sm font-bold text-[#101828]">
                  Movement Timeline
                </h3>

                <div className="mt-5 space-y-4">
                  {(candidate.timeline || []).map((item, index) => (
                    <div key={`${item.stage}-${index}`} className="flex gap-4">
                      <div
                        className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full border text-xs font-bold ${getStageClass(
                          item.stage
                        )}`}
                      >
                        {index + 1}
                      </div>

                      <div className="flex-1 rounded-xl border border-[#E6ECF2] bg-[#F8FAFC] p-4">
                        <div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-center">
                          <div>
                            <p className="text-sm font-bold text-[#101828]">
                              {item.stage}
                            </p>
                            <p className="text-xs font-semibold text-sibs-tertiary-5">
                              {item.timestamp}
                            </p>
                          </div>

                          <span className="w-fit rounded-full border border-gray-200 bg-white px-3 py-1 text-xs font-bold text-gray-600">
                            {item.owner}
                          </span>
                        </div>

                        <p className="mt-3 text-sm leading-6 text-[#344054]">
                          {item.reason}
                        </p>

                        {item.remarks && (
                          <p className="mt-3 rounded-lg bg-white p-3 text-xs font-semibold leading-5 text-[#475467]">
                            {item.remarks}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {isLeadStage && (
                <div className="rounded-xl border border-[#E6ECF2] bg-white p-5 shadow-sm">
                  <h3 className="text-sm font-bold text-[#101828]">
                    Reason for Movement
                  </h3>

                  <p className="mt-3 rounded-xl border border-[#E6ECF2] bg-[#F8FAFC] p-4 text-sm leading-6 text-[#344054]">
                    {candidate.reasonForMovement || "—"}
                  </p>
                </div>
              )}
            </div>

            {!isLeadStage && !isInitialScreening && (
              <div className="space-y-5">
                <div className="rounded-xl border border-cyan-100 bg-cyan-50 p-5">
                  <h3 className="text-sm font-bold text-cyan-800">
                    Online Assessment
                  </h3>

                  <div className="mt-4 rounded-xl bg-white p-4">
                    <DetailRow
                      label="Assessment Result"
                      value={getAssessmentResult(candidate) || "—"}
                    />
                    <DetailRow
                      label="Email Sent"
                      value={candidate.assessmentEmailSent ? "Yes" : "No"}
                    />
                    <DetailRow
                      label="Email Sent At"
                      value={candidate.assessmentEmailSentAt}
                    />
                  </div>

                  {isOnlineAssessment && (
                    <>
                      <button
                        type="button"
                        onClick={() => onOpenAssessmentModal(candidate)}
                        className="mt-4 inline-flex h-10 w-full items-center justify-center gap-2 rounded-xl bg-cyan-600 text-sm font-bold text-white transition hover:bg-cyan-700"
                      >
                        <ClipboardCheck size={16} />
                        Update Assessment
                      </button>

                      <button
                        type="button"
                        onClick={() => onSendAssessmentEmail(candidate)}
                        className="mt-2 inline-flex h-10 w-full items-center justify-center gap-2 rounded-xl border border-cyan-100 bg-white text-sm font-bold text-cyan-700 transition hover:bg-cyan-50"
                      >
                        <Mail size={16} />
                        Resend Assessment Email
                      </button>
                    </>
                  )}
                </div>

                <div className="rounded-xl border border-[#E6ECF2] bg-[#F8FAFC] p-5">
                  <h3 className="text-sm font-bold text-[#101828]">
                    Interview Details
                  </h3>

                  <div className="mt-4">
                    <DetailRow
                      label="Candidate ID"
                      value={candidate.candidateId}
                    />
                    <DetailRow
                      label="Role / Account"
                      value={candidate.roleAccount}
                    />
                    <DetailRow
                      label="Interview Date"
                      value={formatDateTime(candidate.interviewDate)}
                    />
                    <DetailRow
                      label="Interview Type"
                      value={getDisplayInterviewType(candidate)}
                    />
                    <DetailRow
                      label="Interview Status"
                      value={getDisplayInterviewStatus(candidate) || "—"}
                    />
                  </div>

                  {isOnlineAssessment && canScheduleInterview(candidate) && (
                    <button
                      type="button"
                      onClick={() => onOpenScheduleModal(candidate)}
                      className="mt-4 inline-flex h-10 w-full items-center justify-center gap-2 rounded-xl bg-sibs-primary-1 text-sm font-bold text-white transition hover:opacity-90"
                    >
                      <CalendarDays size={16} />
                      Schedule Interview
                    </button>
                  )}

                  {isInterviewScheduled && candidateHasSchedule && (
                    <div className="mt-4 grid grid-cols-1 gap-2">
                      <button
                        type="button"
                        onClick={() => onOpenScheduleModal(candidate)}
                        className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-xl border border-blue-100 bg-blue-50 text-sm font-bold text-blue-700 transition hover:bg-blue-100"
                      >
                        <CalendarDays size={16} />
                        Update Interview Schedule
                      </button>

                      <button
                        type="button"
                        onClick={() => onCancelInterview(candidate)}
                        className="inline-flex h-10 w-full items-center justify-center rounded-xl border border-red-100 bg-red-50 text-sm font-bold text-red-700 transition hover:bg-red-100"
                      >
                        Cancel Interview
                      </button>

                      {candidate.interviewStatus !== "Completed" && (
                        <button
                          type="button"
                          onClick={() => onCompleteInterview(candidate)}
                          className="inline-flex h-10 w-full items-center justify-center rounded-xl border border-emerald-100 bg-emerald-50 text-sm font-bold text-emerald-700 transition hover:bg-emerald-100"
                        >
                          Mark Interview Completed
                        </button>
                      )}
                    </div>
                  )}
                </div>

                {(isOffered || isAccepted) && (
                  <div className="rounded-xl border border-amber-100 bg-amber-50 p-5">
                    <h3 className="text-sm font-bold text-amber-800">
                      Offer and Approval
                    </h3>

                    <div className="mt-4 rounded-xl bg-white p-4">
                      <DetailRow
                        label="Offer Account"
                        value={candidate.offerDetails?.account}
                      />
                      <DetailRow
                        label="Compensation"
                        value={formatCurrency(candidate.offerDetails?.compensation)}
                      />
                      <DetailRow
                        label="Basic Pay"
                        value={formatCurrency(candidate.offerDetails?.basicPay)}
                      />
                      <DetailRow
                        label="Deminimis / Daily Rate"
                        value={formatCurrency(candidate.offerDetails?.deminimisDailyRate)}
                      />
                      <DetailRow
                        label="Approval Status"
                        value={candidate.offerApprovalStatus || getOfferApprovalSummary(candidate)}
                      />
                      <DetailRow
                        label="Offer Email Sent"
                        value={candidate.offerEmailSent ? "Yes" : "No"}
                      />
                      <DetailRow
                        label="Candidate Response"
                        value={candidate.offerDecision || "—"}
                      />
                    </div>

                    {isOffered && (
                      <div className="mt-4 space-y-4">
                        {offerApprovers.map((approver) => {
                          const approval = candidate.offerApprovals?.[approver] || {
                            status: "For Review",
                          };

                          return (
                            <div
                              key={approver}
                              className="rounded-xl border border-amber-100 bg-white p-4"
                            >
                              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                                <p className="text-sm font-bold text-[#101828]">
                                  {approver}
                                </p>
                                <span
                                  className={`w-fit rounded-full border px-3 py-1 text-xs font-bold ${getOfferApprovalClass(
                                    approval.status
                                  )}`}
                                >
                                  {approval.status || "For Review"}
                                </span>
                              </div>

                              <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-3">
                                {offerApprovalStatusOptions.map((status) => (
                                  <button
                                    key={`${approver}-${status}`}
                                    type="button"
                                    onClick={() =>
                                      onUpdateOfferApproval(candidate, approver, status)
                                    }
                                    className={`inline-flex h-9 items-center justify-center rounded-xl border px-3 text-xs font-bold transition ${getOfferApprovalClass(
                                      status
                                    )}`}
                                  >
                                    {status}
                                  </button>
                                ))}
                              </div>
                            </div>
                          );
                        })}

                        {isOfferApproved(candidate) && !candidate.offerEmailSent && (
                          <button
                            type="button"
                            onClick={() => onSendOfferEmail(candidate)}
                            className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-xl bg-sibs-primary-1 text-sm font-bold text-white transition hover:opacity-90"
                          >
                            <Mail size={16} />
                            Send Contract Email to Lead
                          </button>
                        )}

                        {candidate.offerEmailSent && (
                          <div className="rounded-xl border border-[#E6ECF2] bg-white p-4">
                            <p className="text-xs font-bold uppercase tracking-wide text-sibs-tertiary-5">
                              Candidate Contract Response
                            </p>
                            <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-3">
                              {offerDecisionOptions.map((decision) => (
                                <button
                                  key={decision}
                                  type="button"
                                  onClick={() =>
                                    onOfferDecision(candidate, decision)
                                  }
                                  className={`inline-flex h-9 items-center justify-center rounded-xl border px-3 text-xs font-bold transition ${getOfferDecisionClass(
                                    decision
                                  )}`}
                                >
                                  {decision}
                                </button>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}

                <div className="rounded-xl border border-[#E6ECF2] bg-white p-5 shadow-sm">
                  <h3 className="text-sm font-bold text-[#101828]">
                    Reason for Movement
                  </h3>

                  <p className="mt-3 rounded-xl border border-[#E6ECF2] bg-[#F8FAFC] p-4 text-sm leading-6 text-[#344054]">
                    {candidate.reasonForMovement || "—"}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="border-t border-gray-100 px-5 py-4 sm:px-6">
          <div className="flex flex-col justify-end gap-2 sm:flex-row">
            {candidate.currentStage !== "Drop-off" &&
              candidate.currentStage !== "Accepted" && (
                <button
                  type="button"
                  onClick={() => onOpenDropOffModal(candidate)}
                  className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-red-200 bg-red-50 px-5 text-sm font-bold text-red-700 transition hover:bg-red-100"
                >
                  <UserX size={16} />
                  Mark Drop-off
                </button>
              )}

            {isOnlineAssessment && (
              <button
                type="button"
                onClick={() => onOpenAssessmentModal(candidate)}
                className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-cyan-600 px-5 text-sm font-bold text-white transition hover:bg-cyan-700"
              >
                <ClipboardCheck size={16} />
                Update Assessment
              </button>
            )}

            {isOnlineAssessment && canScheduleInterview(candidate) && (
              <button
                type="button"
                onClick={() => onOpenScheduleModal(candidate)}
                className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-sibs-primary-1 px-5 text-sm font-bold text-white transition hover:opacity-90"
              >
                <CalendarDays size={16} />
                Schedule Interview
              </button>
            )}

            {isInterviewScheduled && canUpdateInterviewSchedule(candidate) && (
              <button
                type="button"
                onClick={() => onOpenScheduleModal(candidate)}
                className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-sibs-primary-1 px-5 text-sm font-bold text-white transition hover:opacity-90"
              >
                <CalendarDays size={16} />
                Update Interview Schedule
              </button>
            )}

            {!isLeadStage &&
              !isInitialScreening &&
              !isOnlineAssessment &&
              !isInterviewScheduled &&
              nextStage && (
                <button
                  type="button"
                  onClick={() => onOpenMoveModal(candidate)}
                  className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-sibs-primary-1 px-5 text-sm font-bold text-white transition hover:opacity-90"
                >
                  <ArrowRight size={16} />
                  Move to {nextStage}
                </button>
              )}

            {isInitialScreening && nextStage && (
              <button
                type="button"
                onClick={() => onOpenMoveModal(candidate)}
                className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-sibs-primary-1 px-5 text-sm font-bold text-white transition hover:opacity-90"
              >
                <ArrowRight size={16} />
                Move to Online Assessment
              </button>
            )}

            <button
              type="button"
              onClick={onClose}
              className="inline-flex h-11 items-center justify-center rounded-xl border border-[#E6ECF2] bg-white px-5 text-sm font-bold text-sibs-primary-1 transition hover:border-sibs-primary-1 hover:bg-sibs-primary-1/5"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function InterviewCalendar({ candidates, onViewCandidate }) {
  const scheduledCandidates = useMemo(() => {
    return candidates
      .filter((candidate) => {
        if (candidate.currentStage !== "Interview Scheduled") return false;
        if (!hasInterviewSchedule(candidate)) return false;
        if (!candidate.interviewDate) return false;
        if (candidate.interviewStatus === "Cancelled") return false;
        return true;
      })
      .sort(
        (a, b) =>
          new Date(a.interviewDate).getTime() -
          new Date(b.interviewDate).getTime()
      );
  }, [candidates]);

  const initialCalendarDate = useMemo(() => {
    if (scheduledCandidates.length > 0) {
      return new Date(scheduledCandidates[0].interviewDate);
    }

    return new Date();
  }, [scheduledCandidates]);

  const [visibleMonth, setVisibleMonth] = useState(
    new Date(initialCalendarDate.getFullYear(), initialCalendarDate.getMonth(), 1)
  );

  useEffect(() => {
    setVisibleMonth(
      new Date(initialCalendarDate.getFullYear(), initialCalendarDate.getMonth(), 1)
    );
  }, [initialCalendarDate]);

  const monthDays = useMemo(() => {
    const year = visibleMonth.getFullYear();
    const month = visibleMonth.getMonth();

    const firstDay = new Date(year, month, 1);
    const firstGridDate = new Date(firstDay);
    firstGridDate.setDate(firstGridDate.getDate() - firstGridDate.getDay());

    return Array.from({ length: 42 }, (_, index) => {
      const date = new Date(firstGridDate);
      date.setDate(firstGridDate.getDate() + index);
      return date;
    });
  }, [visibleMonth]);

  const candidatesByDate = useMemo(() => {
    return scheduledCandidates.reduce((acc, candidate) => {
      const key = String(candidate.interviewDate).slice(0, 10);
      acc[key] = acc[key] ? [...acc[key], candidate] : [candidate];
      return acc;
    }, {});
  }, [scheduledCandidates]);

  function handlePreviousMonth() {
    setVisibleMonth(
      (prev) => new Date(prev.getFullYear(), prev.getMonth() - 1, 1)
    );
  }

  function handleNextMonth() {
    setVisibleMonth(
      (prev) => new Date(prev.getFullYear(), prev.getMonth() + 1, 1)
    );
  }

  function handleTodayMonth() {
    const today = new Date();
    setVisibleMonth(new Date(today.getFullYear(), today.getMonth(), 1));
  }

  return (
    <section className="rounded-xl border border-[#E6ECF2] bg-white p-4 shadow-sm">
      <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-center gap-2">
          <CalendarDays size={17} className="text-sibs-primary-1" />

          <h2 className="text-sm font-bold text-[#101828]">
            Interview Calendar - {formatMonthYear(visibleMonth)}
          </h2>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={handlePreviousMonth}
            className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-[#D6DEE8] bg-white text-sibs-primary-1 transition hover:bg-[#F8FAFC]"
            title="Previous Month"
          >
            <ChevronLeft size={17} />
          </button>

          <button
            type="button"
            onClick={handleTodayMonth}
            className="inline-flex h-9 items-center justify-center rounded-xl border border-[#D6DEE8] bg-white px-4 text-xs font-bold text-sibs-primary-1 transition hover:bg-[#F8FAFC]"
          >
            Today
          </button>

          <button
            type="button"
            onClick={handleNextMonth}
            className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-[#D6DEE8] bg-white text-sibs-primary-1 transition hover:bg-[#F8FAFC]"
            title="Next Month"
          >
            <ChevronRight size={17} />
          </button>
        </div>
      </div>

      <div className="overflow-x-auto">
        <div className="min-w-[1120px] overflow-hidden rounded-xl border border-[#E6ECF2]">
          <div className="grid grid-cols-7 border-b border-[#E6ECF2] bg-[#F8FAFC]">
            {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
              <div
                key={day}
                className="border-r border-[#E6ECF2] px-3 py-3 text-center text-xs font-bold text-[#174A7C] last:border-r-0"
              >
                {day}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-7">
            {monthDays.map((date) => {
              const dateKey = getDateKey(date);
              const dayCandidates = candidatesByDate[dateKey] || [];
              const isCurrentMonth =
                date.getMonth() === visibleMonth.getMonth() &&
                date.getFullYear() === visibleMonth.getFullYear();
              const isToday = dateKey === getDateKey(new Date());

              return (
                <div
                  key={dateKey}
                  className={`min-h-[150px] border-r border-b border-[#E6ECF2] p-3 ${
                    isCurrentMonth ? "bg-white" : "bg-[#F8FAFC]"
                  }`}
                >
                  <div className="mb-2 flex items-center justify-between">
                    <span
                      className={`inline-flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold ${
                        isToday
                          ? "bg-sibs-primary-1 text-white"
                          : isCurrentMonth
                            ? "text-[#101828]"
                            : "text-[#98A2B3]"
                      }`}
                    >
                      {date.getDate()}
                    </span>

                    {dayCandidates.length > 0 && (
                      <span className="rounded-full bg-blue-50 px-2 py-0.5 text-[10px] font-bold text-blue-700">
                        {dayCandidates.length}
                      </span>
                    )}
                  </div>

                  <div className="space-y-2">
                    {dayCandidates.slice(0, 3).map((candidate) => (
                      <button
                        key={candidate.id}
                        type="button"
                        onClick={() => onViewCandidate(candidate)}
                        className="w-full rounded-lg border border-cyan-100 bg-cyan-50 px-2 py-2 text-left text-xs font-semibold text-cyan-800 transition hover:bg-cyan-100"
                      >
                        <p className="truncate font-bold">{candidate.name}</p>
                        <p>{formatTime(candidate.interviewDate)}</p>
                        <p>
                          {candidate.interviewType === "Online"
                            ? "Online"
                            : "Face-to-face"}
                        </p>
                      </button>
                    ))}

                    {dayCandidates.length > 3 && (
                      <div className="rounded-lg border border-gray-100 bg-gray-50 px-2 py-2 text-center text-xs font-bold text-gray-600">
                        +{dayCandidates.length - 3} more
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}

export default function CandidatePipelinePage() {
  const [candidateList, setCandidateList] = useState(defaultPipelineCandidates);
  const [hasLoadedStorage, setHasLoadedStorage] = useState(false);

  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("All Roles");
  const [accountFilter, setAccountFilter] = useState("All Accounts");
  const [activeStage, setActiveStage] = useState("Lead / Sourced");

  const [selectedCandidate, setSelectedCandidate] = useState(null);

  const [moveCandidate, setMoveCandidate] = useState(null);
  const [moveForm, setMoveForm] = useState({
    reason: "",
    remarks: "",
  });

  const [scheduleCandidate, setScheduleCandidate] = useState(null);
  const [scheduleForm, setScheduleForm] = useState({
    interviewDate: "",
    interviewType: "",
    remarks: "",
  });

  const [assessmentCandidate, setAssessmentCandidate] = useState(null);
  const [assessmentForm, setAssessmentForm] = useState({
    assessmentStatus: "Not Take",
    assessmentResult: "",
    assessmentRemarks: "",
  });

  const [dropOffCandidate, setDropOffCandidate] = useState(null);
  const [dropOffForm, setDropOffForm] = useState({
    category: "",
    reason: "",
    remarks: "",
  });

  const [offerCandidate, setOfferCandidate] = useState(null);
  const [offerForm, setOfferForm] = useState({
    account: "",
    compensation: "",
    basicPay: "",
    deminimisDailyRate: "",
    remarks: "",
  });

  const hideInterviewColumns =
    activeStage === "Lead / Sourced" ||
    activeStage === "Initial Screening" ||
    activeStage === "Online Assessment";

  const showAssessmentStatusColumn = false;

  const showAssessmentResultColumn = activeStage === "Online Assessment";

  useEffect(() => {
    const storedCandidates = loadPipelineCandidateData();

    const baseCandidates =
      storedCandidates.length > 0
        ? storedCandidates
        : defaultPipelineCandidates;

    const normalizedCandidates = baseCandidates.map(normalizeCandidate);

    setCandidateList(normalizedCandidates);
    savePipelineCandidateData(normalizedCandidates);
    setHasLoadedStorage(true);
  }, []);

  useEffect(() => {
    if (!hasLoadedStorage) return;
    savePipelineCandidateData(candidateList);
  }, [candidateList, hasLoadedStorage]);

  function syncSelectedCandidate(updatedCandidate) {
    setSelectedCandidate((prev) =>
      prev?.id === updatedCandidate.id ? updatedCandidate : prev
    );

    setMoveCandidate((prev) =>
      prev?.id === updatedCandidate.id ? updatedCandidate : prev
    );

    setScheduleCandidate((prev) =>
      prev?.id === updatedCandidate.id ? updatedCandidate : prev
    );

    setAssessmentCandidate((prev) =>
      prev?.id === updatedCandidate.id ? updatedCandidate : prev
    );

    setOfferCandidate((prev) =>
      prev?.id === updatedCandidate.id ? updatedCandidate : prev
    );
  }

  function updateCandidateRecord(updatedCandidate) {
    const normalizedCandidate = normalizeCandidate(updatedCandidate);

    setCandidateList((prev) => {
      const next = prev.map((candidate) =>
        candidate.id === normalizedCandidate.id ? normalizedCandidate : candidate
      );

      savePipelineCandidateData(next);
      return next;
    });

    syncSelectedCandidate(normalizedCandidate);
  }

  function handleUpdatePrfStatus(candidate, nextPrfStatus) {
    const shouldMoveToInitialScreening =
      candidate.currentStage === "Lead / Sourced";

    const movementReason = shouldMoveToInitialScreening
      ? `PRF status changed to ${nextPrfStatus}. Candidate moved from Lead / Sourced to Initial Screening.`
      : `PRF status changed to ${nextPrfStatus}.`;

    const updatedCandidate = {
      ...candidate,
      prfStatus: nextPrfStatus,
      prfReviewed: true,
      prfReviewedAt: getCurrentTimestamp(),
      previousStage: shouldMoveToInitialScreening
        ? candidate.currentStage
        : candidate.previousStage,
      currentStage: shouldMoveToInitialScreening
        ? "Initial Screening"
        : candidate.currentStage,
      interviewDate: shouldMoveToInitialScreening ? null : candidate.interviewDate,
      interviewType: shouldMoveToInitialScreening ? "-" : candidate.interviewType,
      interviewStatus: shouldMoveToInitialScreening
        ? "For Assessment"
        : candidate.interviewStatus,
      dateMoved: getCurrentDate(),
      reasonForMovement: movementReason,
      timeline: [
        ...(candidate.timeline || []),
        {
          stage: shouldMoveToInitialScreening
            ? "Initial Screening"
            : candidate.currentStage,
          owner: candidate.owner,
          source: "PRF Review",
          timestamp: getCurrentTimestamp(),
          reason: movementReason,
          remarks: `PRF Status: ${nextPrfStatus}`,
        },
      ],
    };

    updateCandidateRecord(updatedCandidate);
    setSelectedCandidate(updatedCandidate);

    if (shouldMoveToInitialScreening) {
      setActiveStage("Initial Screening");
    }
  }

  function handleOpenScheduleInterview(candidate) {
    const isUpdatingSchedule = candidate.currentStage === "Interview Scheduled";

    if (!isUpdatingSchedule && !canScheduleInterview(candidate)) {
      alert(
        "Candidate must be Assessment Taken and Assessment Fit before interview scheduling."
      );
      return;
    }

    if (isUpdatingSchedule && !canUpdateInterviewSchedule(candidate)) {
      alert("This interview schedule cannot be updated.");
      return;
    }

    setScheduleCandidate(candidate);
    setScheduleForm({
      interviewDate: isUpdatingSchedule ? toDateInputValue(candidate.interviewDate) : "",
      interviewType:
        isUpdatingSchedule && candidate.interviewType !== "-"
          ? candidate.interviewType
          : "",
      remarks: "",
    });
  }

  function handleCloseScheduleInterview() {
    setScheduleCandidate(null);
    setScheduleForm({
      interviewDate: "",
      interviewType: "",
      remarks: "",
    });
  }

  function handleSubmitScheduleInterview(e) {
    e.preventDefault();

    if (!scheduleCandidate) return;

    const isUpdatingSchedule =
      scheduleCandidate.currentStage === "Interview Scheduled";

    if (!isUpdatingSchedule && !canScheduleInterview(scheduleCandidate)) {
      alert(
        "Only candidates tagged as Assessment Fit can be scheduled for interview."
      );
      return;
    }

    if (isUpdatingSchedule && !canUpdateInterviewSchedule(scheduleCandidate)) {
      alert("This interview schedule cannot be updated.");
      return;
    }

    if (!scheduleForm.interviewDate || !scheduleForm.interviewType) {
      alert("Interview date and interview type are required.");
      return;
    }

    if (isUpdatingSchedule) {
      const previousSchedule = formatDateTime(scheduleCandidate.interviewDate);
      const previousType = scheduleCandidate.interviewType || "—";

      const movementReason = `Interview schedule updated from ${previousSchedule} (${previousType}) to ${formatDateTime(
        scheduleForm.interviewDate
      )} (${scheduleForm.interviewType}).`;

      const updatedCandidate = {
        ...scheduleCandidate,
        interviewDate: scheduleForm.interviewDate,
        interviewType: scheduleForm.interviewType,
        interviewStatus:
          scheduleCandidate.interviewStatus === "Completed"
            ? "Completed"
            : "Rescheduled",
        reasonForMovement: movementReason,
        timeline: [
          ...(scheduleCandidate.timeline || []),
          {
            stage: "Interview Scheduled",
            owner: scheduleCandidate.owner,
            source: "Interview Scheduling",
            timestamp: getCurrentTimestamp(),
            reason: movementReason,
            remarks: scheduleForm.remarks.trim(),
          },
        ],
      };

      updateCandidateRecord(updatedCandidate);
      setSelectedCandidate(updatedCandidate);
      setActiveStage("Interview Scheduled");
      handleCloseScheduleInterview();
      return;
    }

    const movementReason =
      "Candidate passed online assessment. Interview schedule has been set and candidate moved to Interview Scheduled.";

    const updatedCandidate = {
      ...scheduleCandidate,
      previousStage: "Online Assessment",
      currentStage: "Interview Scheduled",
      dateMoved: getCurrentDate(),
      interviewDate: scheduleForm.interviewDate,
      interviewType: scheduleForm.interviewType,
      interviewStatus: "Scheduled",
      reasonForMovement: movementReason,
      timeline: [
        ...(scheduleCandidate.timeline || []),
        {
          stage: "Interview Scheduled",
          owner: scheduleCandidate.owner,
          source: "Interview Scheduling",
          timestamp: getCurrentTimestamp(),
          reason: movementReason,
          remarks:
            scheduleForm.remarks.trim() ||
            `Schedule: ${formatDateTime(
              scheduleForm.interviewDate
            )}, Type: ${scheduleForm.interviewType}`,
        },
      ],
    };

    updateCandidateRecord(updatedCandidate);
    setSelectedCandidate(updatedCandidate);
    setActiveStage("Interview Scheduled");
    handleCloseScheduleInterview();
  }

  function handleCancelInterview(candidate) {
    if (candidate.currentStage !== "Interview Scheduled") {
      alert("Only scheduled interviews can be cancelled.");
      return;
    }

    const confirmed = window.confirm(
      `Cancel interview schedule for ${candidate.name}?`
    );

    if (!confirmed) return;

    const movementReason =
      "Interview was cancelled. Candidate returned to Online Assessment for re-scheduling.";

    const updatedCandidate = {
      ...candidate,
      previousStage: "Interview Scheduled",
      currentStage: "Online Assessment",
      dateMoved: getCurrentDate(),
      interviewDate: null,
      interviewType: "-",
      interviewStatus: "For Assessment",
      reasonForMovement: movementReason,
      timeline: [
        ...(candidate.timeline || []),
        {
          stage: "Online Assessment",
          owner: candidate.owner,
          source: "Interview Scheduling",
          timestamp: getCurrentTimestamp(),
          reason: movementReason,
          remarks: "Previous interview schedule was cancelled.",
        },
      ],
    };

    updateCandidateRecord(updatedCandidate);
    setSelectedCandidate(updatedCandidate);
    setActiveStage("Online Assessment");
  }

  function handleCompleteInterview(candidate) {
    if (!hasInterviewSchedule(candidate)) {
      alert("Create the interview schedule first.");
      return;
    }

    const shouldMoveToInterviewed =
      candidate.currentStage === "Interview Scheduled";

    const movementReason = shouldMoveToInterviewed
      ? "Interview completed. Candidate moved from Interview Scheduled to Interviewed."
      : "Interview marked as completed.";

    const updatedCandidate = {
      ...candidate,
      previousStage: shouldMoveToInterviewed
        ? "Interview Scheduled"
        : candidate.previousStage,
      currentStage: shouldMoveToInterviewed
        ? "Interviewed"
        : candidate.currentStage,
      dateMoved: shouldMoveToInterviewed ? getCurrentDate() : candidate.dateMoved,
      interviewStatus: "Completed",
      reasonForMovement: movementReason,
      timeline: [
        ...(candidate.timeline || []),
        {
          stage: shouldMoveToInterviewed ? "Interviewed" : candidate.currentStage,
          owner: candidate.owner,
          source: "Interview",
          timestamp: getCurrentTimestamp(),
          reason: movementReason,
        },
      ],
    };

    updateCandidateRecord(updatedCandidate);
    setSelectedCandidate(updatedCandidate);

    if (shouldMoveToInterviewed) {
      setActiveStage("Interviewed");
    }
  }

  function handleOpenOfferModal(candidate) {
    if (candidate.currentStage !== "Interviewed") {
      alert("Offer details can only be prepared after the interview is completed.");
      return;
    }

    const offerDetails = candidate.offerDetails || {};

    setOfferCandidate(candidate);
    setOfferForm({
      account: offerDetails.account || getAccount(candidate.roleAccount),
      compensation: offerDetails.compensation || "",
      basicPay: offerDetails.basicPay || "",
      deminimisDailyRate: offerDetails.deminimisDailyRate || "",
      remarks: "",
    });
  }

  function handleCloseOfferModal() {
    setOfferCandidate(null);
    setOfferForm({
      account: "",
      compensation: "",
      basicPay: "",
      deminimisDailyRate: "",
      remarks: "",
    });
  }

  function handleSubmitOfferDetails(e) {
    e.preventDefault();

    if (!offerCandidate) return;

    if (
      !offerForm.account ||
      !offerForm.compensation ||
      !offerForm.basicPay ||
      !offerForm.deminimisDailyRate
    ) {
      alert("Account, compensation, basic pay, and deminimis / daily rate are required.");
      return;
    }

    const movementReason =
      "Interview completed. Offer details prepared and sent for approval of Raul Nadela and Haasanor.";

    const updatedCandidate = {
      ...offerCandidate,
      previousStage: offerCandidate.currentStage,
      currentStage: "Offered",
      dateMoved: getCurrentDate(),
      offerDetails: {
        account: offerForm.account,
        compensation: Number(offerForm.compensation),
        basicPay: Number(offerForm.basicPay),
        deminimisDailyRate: Number(offerForm.deminimisDailyRate),
        preparedAt: getCurrentTimestamp(),
        preparedBy: offerCandidate.owner,
      },
      offerApprovals: {
        "Raul Nadela": { status: "For Review", updatedAt: null, remarks: "" },
        Haasanor: { status: "For Review", updatedAt: null, remarks: "" },
      },
      offerApprovalStatus: "For Review",
      offerEmailSent: false,
      offerEmailSentAt: null,
      offerDecision: "",
      offerDecisionAt: null,
      offerDecisionRemarks: "",
      reasonForMovement: movementReason,
      timeline: [
        ...(offerCandidate.timeline || []),
        {
          stage: "Offered",
          owner: offerCandidate.owner,
          source: "Offer Approval",
          timestamp: getCurrentTimestamp(),
          reason: movementReason,
          remarks:
            offerForm.remarks.trim() ||
            `Offer Account: ${offerForm.account}, Compensation: ${formatCurrency(
              offerForm.compensation
            )}, Basic Pay: ${formatCurrency(
              offerForm.basicPay
            )}, Deminimis / Daily Rate: ${formatCurrency(
              offerForm.deminimisDailyRate
            )}`,
        },
      ],
    };

    updateCandidateRecord(updatedCandidate);
    upsertOfferEligibleCandidate(updatedCandidate);
    setSelectedCandidate(updatedCandidate);
    setActiveStage("Offered");
    handleCloseOfferModal();
  }

  function handleUpdateOfferApproval(candidate, approver, status) {
    if (candidate.currentStage !== "Offered") return;

    const nextApprovals = {
      ...(candidate.offerApprovals || {}),
      [approver]: {
        status,
        updatedAt: getCurrentTimestamp(),
        remarks: "",
      },
    };

    const approvalSummary = getOfferApprovalSummary({
      ...candidate,
      offerApprovals: nextApprovals,
    });

    const movementReason = `${approver} tagged the offer as ${status}. Overall offer approval status: ${approvalSummary}.`;

    const updatedCandidate = {
      ...candidate,
      offerApprovals: nextApprovals,
      offerApprovalStatus: approvalSummary,
      reasonForMovement: movementReason,
      timeline: [
        ...(candidate.timeline || []),
        {
          stage: "Offered",
          owner: approver,
          source: "Offer Approval",
          timestamp: getCurrentTimestamp(),
          reason: movementReason,
        },
      ],
    };

    updateCandidateRecord(updatedCandidate);
    upsertOfferEligibleCandidate(updatedCandidate);
    setSelectedCandidate(updatedCandidate);
  }

  async function handleSendOfferEmail(candidate) {
    if (!isOfferApproved(candidate)) {
      alert("Offer must be approved by Raul Nadela and Haasanor before sending the contract email.");
      return;
    }

    const movementReason =
      "Offer contract email was sent to the lead for contract review and response.";

    const updatedCandidate = {
      ...candidate,
      offerEmailSent: true,
      offerEmailSentAt: getCurrentTimestamp(),
      reasonForMovement: movementReason,
      timeline: [
        ...(candidate.timeline || []),
        {
          stage: "Offered",
          owner: candidate.owner,
          source: "Offer Contract",
          timestamp: getCurrentTimestamp(),
          reason: movementReason,
          remarks: buildOfferContractLink(candidate),
        },
      ],
    };

    updateCandidateRecord(updatedCandidate);
    upsertOfferEligibleCandidate(updatedCandidate);
    setSelectedCandidate(updatedCandidate);
    await triggerOfferEmail(updatedCandidate);
  }

  function handleOfferDecision(candidate, decision) {
    if (!candidate.offerEmailSent) {
      alert("Send the approved contract email first before recording the lead response.");
      return;
    }

    if (decision === "Accepted") {
      const movementReason = "Lead accepted the offer contract. Candidate moved to Accepted.";
      const updatedCandidate = {
        ...candidate,
        previousStage: "Offered",
        currentStage: "Accepted",
        dateMoved: getCurrentDate(),
        offerDecision: "Accepted",
        offerDecisionAt: getCurrentTimestamp(),
        reasonForMovement: movementReason,
        timeline: [
          ...(candidate.timeline || []),
          {
            stage: "Accepted",
            owner: candidate.owner,
            source: "Offer Contract",
            timestamp: getCurrentTimestamp(),
            reason: movementReason,
          },
        ],
      };

      updateCandidateRecord(updatedCandidate);
      upsertOfferEligibleCandidate(updatedCandidate);
      setSelectedCandidate(updatedCandidate);
      setActiveStage("Accepted");
      return;
    }

    if (decision === "Rejected") {
      const movementReason = "Lead rejected the offer contract. Candidate moved to Drop-off.";
      const updatedCandidate = {
        ...candidate,
        previousStage: "Offered",
        currentStage: "Drop-off",
        dateMoved: getCurrentDate(),
        offerDecision: "Rejected",
        offerDecisionAt: getCurrentTimestamp(),
        reasonForMovement: movementReason,
        dropOffCategory: "Compensation",
        dropOffReason: "Candidate rejected the offer contract.",
        dropOffRemarks: "Offer response: Rejected",
        timeline: [
          ...(candidate.timeline || []),
          {
            stage: "Drop-off",
            owner: candidate.owner,
            source: "Offer Contract",
            timestamp: getCurrentTimestamp(),
            reason: movementReason,
            remarks: "Offer response: Rejected",
          },
        ],
      };

      updateCandidateRecord(updatedCandidate);
      removeOfferEligibleCandidate(updatedCandidate);
      setSelectedCandidate(updatedCandidate);
      setActiveStage("Drop-off");
      return;
    }

    const movementReason = "Lead requested offer negotiation.";
    const updatedCandidate = {
      ...candidate,
      offerDecision: "Negotiate",
      offerDecisionAt: getCurrentTimestamp(),
      reasonForMovement: movementReason,
      timeline: [
        ...(candidate.timeline || []),
        {
          stage: "Offered",
          owner: candidate.owner,
          source: "Offer Contract",
          timestamp: getCurrentTimestamp(),
          reason: movementReason,
        },
      ],
    };

    updateCandidateRecord(updatedCandidate);
    upsertOfferEligibleCandidate(updatedCandidate);
    setSelectedCandidate(updatedCandidate);
  }

  function handleOpenMoveModal(candidate) {
    const nextStage = getNextStage(candidate.currentStage);

    if (!nextStage) return;

    if (candidate.currentStage === "Initial Screening") {
      if (!canMoveToOnlineAssessment(candidate)) {
        alert("Only PRF Matched candidates can move to Online Assessment.");
        return;
      }
    }

    if (candidate.currentStage === "Online Assessment") {
      handleOpenScheduleInterview(candidate);
      return;
    }

    if (nextStage === "Offered") {
      handleOpenOfferModal(candidate);
      return;
    }

    setMoveCandidate(candidate);
    setMoveForm({
      reason:
        nextStage === "Online Assessment"
          ? "PRF matched. Candidate moved from Initial Screening to Online Assessment and assessment email will be sent."
          : `Candidate moved from ${candidate.currentStage} to ${nextStage}.`,
      remarks: "",
    });
  }

  function handleCloseMoveModal() {
    setMoveCandidate(null);
    setMoveForm({
      reason: "",
      remarks: "",
    });
  }

  async function handleSubmitMove(e) {
    e.preventDefault();

    if (!moveCandidate) return;

    const nextStage = getNextStage(moveCandidate.currentStage);

    if (!nextStage) {
      alert("This candidate cannot be moved forward.");
      return;
    }

    if (moveCandidate.currentStage === "Initial Screening") {
      if (!canMoveToOnlineAssessment(moveCandidate)) {
        alert("Only PRF Matched candidates can move to Online Assessment.");
        return;
      }
    }

    if (!moveForm.reason.trim()) {
      alert("Movement reason is required.");
      return;
    }

    const movingToOnlineAssessment = nextStage === "Online Assessment";
    const movingToOffered = nextStage === "Offered";
    const movementReason = moveForm.reason.trim();

    const updatedCandidate = {
      ...moveCandidate,
      previousStage: moveCandidate.currentStage,
      currentStage: nextStage,
      dateMoved: getCurrentDate(),
      reasonForMovement: movementReason,
      assessmentStatus: movingToOnlineAssessment
        ? "Not Take"
        : moveCandidate.assessmentStatus || "Not Take",
      assessmentResult: movingToOnlineAssessment
        ? ""
        : moveCandidate.assessmentResult || "",
      assessmentEmailSent: movingToOnlineAssessment
        ? true
        : moveCandidate.assessmentEmailSent,
      assessmentEmailSentAt: movingToOnlineAssessment
        ? getCurrentTimestamp()
        : moveCandidate.assessmentEmailSentAt,
      interviewDate: movingToOnlineAssessment ? null : moveCandidate.interviewDate,
      interviewType: movingToOnlineAssessment ? "-" : moveCandidate.interviewType,
      interviewStatus: movingToOnlineAssessment
        ? "For Assessment"
        : moveCandidate.interviewStatus,
      timeline: [
        ...(moveCandidate.timeline || []),
        {
          stage: nextStage,
          owner: moveCandidate.owner,
          source: movingToOnlineAssessment
            ? "Online Assessment"
            : moveCandidate.source,
          timestamp: getCurrentTimestamp(),
          reason: movementReason,
          remarks: movingToOnlineAssessment
            ? moveForm.remarks.trim() ||
              "Assessment email has been triggered to the candidate."
            : moveForm.remarks.trim(),
        },
      ],
    };

    updateCandidateRecord(updatedCandidate);

    if (movingToOnlineAssessment) {
      await triggerAssessmentEmail(updatedCandidate);
      setActiveStage("Online Assessment");
    }

    if (movingToOffered) {
      upsertOfferEligibleCandidate(updatedCandidate);
    } else {
      removeOfferEligibleCandidate(updatedCandidate);
    }

    setSelectedCandidate(updatedCandidate);
    handleCloseMoveModal();
  }

  function handleOpenAssessmentModal(candidate) {
    if (candidate.currentStage !== "Online Assessment") {
      alert("Assessment update is only available in Online Assessment stage.");
      return;
    }

    setAssessmentCandidate(candidate);
    setAssessmentForm({
      assessmentStatus: candidate.assessmentStatus || "Not Take",
      assessmentResult: candidate.assessmentResult || "",
      assessmentRemarks: candidate.assessmentRemarks || "",
    });
  }

  function handleCloseAssessmentModal() {
    setAssessmentCandidate(null);
    setAssessmentForm({
      assessmentStatus: "Not Take",
      assessmentResult: "",
      assessmentRemarks: "",
    });
  }

  async function handleSendAssessmentEmail(candidate) {
    const updatedCandidate = {
      ...candidate,
      assessmentEmailSent: true,
      assessmentEmailSentAt: getCurrentTimestamp(),
      timeline: [
        ...(candidate.timeline || []),
        {
          stage: candidate.currentStage,
          owner: candidate.owner,
          source: "Online Assessment",
          timestamp: getCurrentTimestamp(),
          reason: "Assessment email was sent to the candidate.",
          remarks: buildAssessmentLink(candidate),
        },
      ],
    };

    updateCandidateRecord(updatedCandidate);
    setSelectedCandidate(updatedCandidate);

    await triggerAssessmentEmail(updatedCandidate);
  }

  function handleSubmitAssessment(e) {
    e.preventDefault();

    if (!assessmentCandidate) return;

    if (!assessmentForm.assessmentStatus) {
      alert("Assessment status is required.");
      return;
    }

    if (
      assessmentForm.assessmentStatus === "Taken" &&
      !assessmentForm.assessmentResult
    ) {
      alert("Assessment result is required when assessment status is Taken.");
      return;
    }

    const isTaken = assessmentForm.assessmentStatus === "Taken";

    const movementReason = isTaken
      ? `Assessment marked as Taken and tagged as ${assessmentForm.assessmentResult}.`
      : "Assessment marked as Not Take.";

    const updatedCandidate = {
      ...assessmentCandidate,
      assessmentStatus: assessmentForm.assessmentStatus,
      assessmentResult: isTaken ? assessmentForm.assessmentResult : "",
      assessmentRemarks: assessmentForm.assessmentRemarks.trim(),
      assessmentTakenAt: isTaken ? getCurrentTimestamp() : null,
      assessmentTaggedAt: isTaken ? getCurrentTimestamp() : null,
      reasonForMovement: movementReason,
      timeline: [
        ...(assessmentCandidate.timeline || []),
        {
          stage: "Online Assessment",
          owner: assessmentCandidate.owner,
          source: "Online Assessment",
          timestamp: getCurrentTimestamp(),
          reason: movementReason,
          remarks: assessmentForm.assessmentRemarks.trim(),
        },
      ],
    };

    updateCandidateRecord(updatedCandidate);
    setSelectedCandidate(updatedCandidate);
    handleCloseAssessmentModal();
  }

  function handleOpenDropOffModal(candidate) {
    setDropOffCandidate(candidate);
    setDropOffForm({
      category:
        candidate.assessmentResult === "Assessment Not Fit"
          ? "Failed Assessment"
          : "",
      reason:
        candidate.assessmentResult === "Assessment Not Fit"
          ? "Candidate was tagged as Assessment Not Fit."
          : "",
      remarks: "",
    });
  }

  function handleCloseDropOffModal() {
    setDropOffCandidate(null);
    setDropOffForm({
      category: "",
      reason: "",
      remarks: "",
    });
  }

  function handleSubmitDropOff(e) {
    e.preventDefault();

    if (!dropOffCandidate) return;

    if (!dropOffForm.category.trim()) {
      alert("Drop-off category is required.");
      return;
    }

    if (!dropOffForm.reason.trim()) {
      alert("Drop-off reason is required.");
      return;
    }

    const movementReason = `Candidate moved from ${dropOffCandidate.currentStage} to Drop-off.`;

    const updatedCandidate = {
      ...dropOffCandidate,
      previousStage: dropOffCandidate.currentStage,
      currentStage: "Drop-off",
      dateMoved: getCurrentDate(),
      reasonForMovement: movementReason,
      dropOffCategory: dropOffForm.category.trim(),
      dropOffReason: dropOffForm.reason.trim(),
      dropOffRemarks: dropOffForm.remarks.trim(),
      timeline: [
        ...(dropOffCandidate.timeline || []),
        {
          stage: "Drop-off",
          owner: dropOffCandidate.owner,
          source: dropOffCandidate.source,
          timestamp: getCurrentTimestamp(),
          reason: movementReason,
          dropOffReason: dropOffForm.reason.trim(),
          dropOffCategory: dropOffForm.category.trim(),
          remarks: dropOffForm.remarks.trim(),
        },
      ],
    };

    updateCandidateRecord(updatedCandidate);
    removeOfferEligibleCandidate(dropOffCandidate);
    setSelectedCandidate(updatedCandidate);
    handleCloseDropOffModal();
  }

  const filteredCandidates = useMemo(() => {
    const keyword = search.trim().toLowerCase();

    return candidateList.map(normalizeCandidate).filter((candidate) => {
      const role = getRoleTitle(candidate.roleAccount);
      const account = getAccount(candidate.roleAccount);

      const matchesSearch =
        !keyword ||
        String(candidate.name || "").toLowerCase().includes(keyword) ||
        String(candidate.email || "").toLowerCase().includes(keyword) ||
        String(candidate.candidateId || "").toLowerCase().includes(keyword) ||
        String(candidate.roleAccount || "").toLowerCase().includes(keyword) ||
        String(candidate.source || "").toLowerCase().includes(keyword) ||
        String(candidate.prfStatus || "").toLowerCase().includes(keyword) ||
        String(candidate.assessmentStatus || "")
          .toLowerCase()
          .includes(keyword) ||
        String(candidate.assessmentResult || "")
          .toLowerCase()
          .includes(keyword) ||
        String(candidate.offerApprovalStatus || "")
          .toLowerCase()
          .includes(keyword) ||
        String(candidate.offerDecision || "")
          .toLowerCase()
          .includes(keyword) ||
        String(candidate.offerDetails?.account || "")
          .toLowerCase()
          .includes(keyword);

      const matchesRole = roleFilter === "All Roles" || role === roleFilter;
      const matchesAccount =
        accountFilter === "All Accounts" || account === accountFilter;

      return matchesSearch && matchesRole && matchesAccount;
    });
  }, [candidateList, search, roleFilter, accountFilter]);

  const stageVisibleCandidates = useMemo(() => {
    return filteredCandidates.filter((candidate) => {
      if (candidate.currentStage === "Lead / Sourced") {
        return candidate.prfStatus === "Review";
      }

      if (candidate.currentStage === "Initial Screening") {
        return isPrfReviewed(candidate);
      }

      if (candidate.currentStage === "Online Assessment") {
        return candidate.prfStatus === "Matched";
      }

      if (candidate.currentStage === "Interview Scheduled") {
        return (
          candidate.assessmentStatus === "Taken" &&
          candidate.assessmentResult === "Assessment Fit" &&
          hasInterviewSchedule(candidate) &&
          candidate.interviewStatus !== "Completed" &&
          candidate.interviewStatus !== "Cancelled"
        );
      }

      return true;
    });
  }, [filteredCandidates]);

  const stageCounts = useMemo(() => {
    return pipelineStages.reduce((acc, stage) => {
      acc[stage] = stageVisibleCandidates.filter(
        (candidate) => candidate.currentStage === stage
      ).length;

      return acc;
    }, {});
  }, [stageVisibleCandidates]);

  const metrics = useMemo(() => {
    return {
      leads: stageCounts["Lead / Sourced"] || 0,
      initialScreening: stageCounts["Initial Screening"] || 0,
      onlineAssessment: stageCounts["Online Assessment"] || 0,
      interviewScheduled: stageCounts["Interview Scheduled"] || 0,
      interviewed: stageCounts["Interviewed"] || 0,
      offered: stageCounts["Offered"] || 0,
      accepted: stageCounts["Accepted"] || 0,
    };
  }, [stageCounts]);

  const stageFilteredCandidates = useMemo(() => {
    return stageVisibleCandidates.filter(
      (candidate) => candidate.currentStage === activeStage
    );
  }, [stageVisibleCandidates, activeStage]);

  const showStatusColumn = useMemo(() => {
    if (activeStage === "Online Assessment") return false;
    return true;
  }, [activeStage]);

  function handleResetSampleData() {
    localStorage.removeItem(CANDIDATE_APPLICATIONS_STORAGE_KEY);
    localStorage.removeItem(PIPELINE_CANDIDATES_STORAGE_KEY);
    localStorage.removeItem(OFFER_ELIGIBLE_STORAGE_KEY);

    const normalizedCandidates = defaultPipelineCandidates.map(normalizeCandidate);

    setCandidateList(normalizedCandidates);
    savePipelineCandidateData(normalizedCandidates);
    setActiveStage("Lead / Sourced");
    setSelectedCandidate(null);

    alert("Sample candidate pipeline data has been reset.");
  }

  function handleAddCandidate() {
    alert("Connect this button to your Add Candidate modal.");
  }

  return (
    <div className="flex h-full min-h-0 min-w-0 flex-1 flex-col overflow-hidden bg-sibs-tertiary-10 font-jakarta">
      <Header />

      <main className="min-h-0 min-w-0 flex-1 overflow-y-auto overflow-x-hidden bg-sibs-tertiary-10 p-4 sm:p-6">
        <div className="mx-auto max-w-[1600px] space-y-5">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
            <div>
              <h1 className="text-2xl font-bold text-sibs-primary-1 sm:text-3xl">
                Talent Pool / Candidate Pipeline
              </h1>

              <p className="mt-1 text-sm font-medium text-sibs-tertiary-5">
                New flow: Initial Screening → Online Assessment → Interview
                Scheduled → Interviewed → Offered.
              </p>
            </div>

            <button
              type="button"
              onClick={handleResetSampleData}
              className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-[#D6DEE8] bg-white px-4 text-sm font-bold text-sibs-primary-1 transition hover:bg-[#F8FAFC]"
            >
              <RotateCcw size={16} />
              Reset Sample Data
            </button>
          </div>

          <div className="grid grid-cols-2 gap-3 md:grid-cols-4 xl:grid-cols-7">
            <DashboardMetric label="Leads" value={metrics.leads} />
            <DashboardMetric
              label="Initial Screening"
              value={metrics.initialScreening}
            />
            <DashboardMetric
              label="Online Assessment"
              value={metrics.onlineAssessment}
            />
            <DashboardMetric
              label="Interview Scheduled"
              value={metrics.interviewScheduled}
            />
            <DashboardMetric label="Interviewed" value={metrics.interviewed} />
            <DashboardMetric label="Offered" value={metrics.offered} />
            <DashboardMetric label="Accepted" value={metrics.accepted} />
          </div>

          <section className="overflow-hidden rounded-xl border border-[#E6ECF2] bg-white shadow-sm">
            <div className="overflow-x-auto border-b border-[#E6ECF2]">
              <div className="flex min-w-[1180px] items-center">
                {pipelineStages.map((stage) => (
                  <button
                    key={stage}
                    type="button"
                    onClick={() => setActiveStage(stage)}
                    className={`h-12 flex-1 whitespace-nowrap border-b-2 px-4 text-sm font-bold transition ${
                      activeStage === stage
                        ? "border-[#1473E6] text-[#1473E6]"
                        : "border-transparent text-[#344054] hover:bg-[#F8FAFC]"
                    }`}
                  >
                    {stage}
                    <span className="ml-2 rounded-full bg-[#F2F4F7] px-2 py-0.5 text-xs text-[#475467]">
                      {stageCounts[stage] || 0}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            <div className="border-b border-[#E6ECF2] p-4">
              <div className="grid grid-cols-1 gap-3 xl:grid-cols-[1fr_180px_180px_auto_auto] xl:items-center">
                <div className="relative">
                  <Search
                    size={17}
                    className="absolute left-4 top-1/2 -translate-y-1/2 text-sibs-tertiary-5"
                  />

                  <input
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search candidate, PRF, assessment, role, account..."
                    className={inputClass("pl-11 pr-4")}
                  />
                </div>

                <select
                  value={roleFilter}
                  onChange={(e) => setRoleFilter(e.target.value)}
                  className={inputClass()}
                >
                  {roleOptions.map((role) => (
                    <option key={role} value={role}>
                      {role}
                    </option>
                  ))}
                </select>

                <select
                  value={accountFilter}
                  onChange={(e) => setAccountFilter(e.target.value)}
                  className={inputClass()}
                >
                  {accountOptions.map((account) => (
                    <option key={account} value={account}>
                      {account}
                    </option>
                  ))}
                </select>

                <button
                  type="button"
                  className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-[#D6DEE8] bg-white px-4 text-sm font-bold text-sibs-primary-1 transition hover:bg-[#F8FAFC]"
                >
                  <SlidersHorizontal size={16} />
                  Filter
                </button>

                <button
                  type="button"
                  onClick={handleAddCandidate}
                  className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-sibs-primary-1 px-4 text-sm font-bold text-white shadow-sm transition hover:opacity-90"
                >
                  <Plus size={17} />
                  Add Candidate
                </button>
              </div>
            </div>

            <div className="hidden lg:block">
              <div className="overflow-x-auto">
                <table className="w-full min-w-[1500px] border-collapse text-left">
                  <thead>
                    <tr className="bg-[#F8FAFC] text-xs font-bold text-[#174A7C]">
                      <th className="px-4 py-3">Candidate</th>
                      <th className="px-4 py-3">Role / Position</th>
                      <th className="px-4 py-3">Account</th>
                      <th className="px-4 py-3">PRF Status</th>

                      {showAssessmentStatusColumn && (
                        <th className="px-4 py-3">Assessment</th>
                      )}

                      {showAssessmentResultColumn && (
                        <th className="px-4 py-3">Assessment Result</th>
                      )}

                      {!hideInterviewColumns && (
                        <>
                          <th className="px-4 py-3">Interview Date</th>
                          <th className="px-4 py-3">Interview Type</th>
                        </>
                      )}

                      {showStatusColumn && (
                        <th className="px-4 py-3">Status</th>
                      )}

                      {(activeStage === "Offered" || activeStage === "Accepted") && (
                        <>
                          <th className="px-4 py-3">Offer Account</th>
                          <th className="px-4 py-3">Compensation</th>
                          <th className="px-4 py-3">Approval</th>
                          <th className="px-4 py-3">Lead Response</th>
                        </>
                      )}

                      <th className="px-4 py-3 text-right">Action</th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-[#E6ECF2] bg-white">
                    {stageFilteredCandidates.length > 0 ? (
                      stageFilteredCandidates.map((candidate) => {
                        const rowStatus = getDisplayInterviewStatus(candidate);

                        return (
                          <tr
                            key={candidate.id}
                            className="cursor-pointer transition hover:bg-[#FAFBFC]"
                            onClick={() => setSelectedCandidate(candidate)}
                          >
                            <td className="px-4 py-3">
                              <div className="flex items-center gap-3">
                                <CandidateAvatar candidate={candidate} />

                                <div>
                                  <p className="text-sm font-bold text-[#101828]">
                                    {candidate.name}
                                  </p>
                                  <p className="text-xs font-semibold text-sibs-tertiary-5">
                                    {candidate.email}
                                  </p>
                                </div>
                              </div>
                            </td>

                            <td className="px-4 py-3 text-sm font-bold text-[#344054]">
                              {getRoleTitle(candidate.roleAccount)}
                            </td>

                            <td className="px-4 py-3 text-sm font-semibold text-[#344054]">
                              {getAccount(candidate.roleAccount)}
                            </td>

                            <td className="px-4 py-3">
                              <span
                                className={`inline-flex rounded-full border px-3 py-1 text-xs font-bold ${getPrfStatusClass(
                                  candidate.prfStatus || "Review"
                                )}`}
                              >
                                {candidate.prfStatus || "Review"}
                              </span>
                            </td>

                            {showAssessmentStatusColumn && (
                              <td className="px-4 py-3">
                                {!candidate.assessmentResult ? (
                                  <span
                                    className={`inline-flex rounded-full border px-3 py-1 text-xs font-bold ${getAssessmentStatusClass(
                                      getAssessmentStatus(candidate)
                                    )}`}
                                  >
                                    {getAssessmentStatus(candidate)}
                                  </span>
                                ) : (
                                  <span className="text-sm font-bold text-[#98A2B3]">
                                    —
                                  </span>
                                )}
                              </td>
                            )}

                            {showAssessmentResultColumn && (
                              <td className="px-4 py-3">
                                <span
                                  className={`inline-flex rounded-full border px-3 py-1 text-xs font-bold ${getAssessmentResultClass(
                                    getAssessmentResult(candidate)
                                  )}`}
                                >
                                  {getAssessmentResult(candidate) || "—"}
                                </span>
                              </td>
                            )}

                            {!hideInterviewColumns && (
                              <>
                                <td className="px-4 py-3 text-sm font-semibold text-[#344054]">
                                  {formatDateTime(candidate.interviewDate)}
                                </td>

                                <td className="px-4 py-3 text-sm font-semibold text-[#344054]">
                                  {getDisplayInterviewType(candidate)}
                                </td>
                              </>
                            )}

                            {showStatusColumn && (
                              <td className="px-4 py-3">
                                {rowStatus ? (
                                  <span
                                    className={`inline-flex rounded-full border px-3 py-1 text-xs font-bold ${getInterviewStatusClass(
                                      rowStatus
                                    )}`}
                                  >
                                    {rowStatus}
                                  </span>
                                ) : (
                                  <span className="text-sm font-bold text-[#98A2B3]">
                                    —
                                  </span>
                                )}
                              </td>
                            )}

                            {(activeStage === "Offered" || activeStage === "Accepted") && (
                              <>
                                <td className="px-4 py-3 text-sm font-semibold text-[#344054]">
                                  {candidate.offerDetails?.account || "—"}
                                </td>
                                <td className="px-4 py-3 text-sm font-semibold text-[#344054]">
                                  {formatCurrency(candidate.offerDetails?.compensation)}
                                </td>
                                <td className="px-4 py-3">
                                  <span
                                    className={`inline-flex rounded-full border px-3 py-1 text-xs font-bold ${getOfferApprovalClass(
                                      candidate.offerApprovalStatus ||
                                        getOfferApprovalSummary(candidate)
                                    )}`}
                                  >
                                    {candidate.offerApprovalStatus ||
                                      getOfferApprovalSummary(candidate)}
                                  </span>
                                </td>
                                <td className="px-4 py-3">
                                  <span
                                    className={`inline-flex rounded-full border px-3 py-1 text-xs font-bold ${getOfferDecisionClass(
                                      candidate.offerDecision
                                    )}`}
                                  >
                                    {candidate.offerDecision || "—"}
                                  </span>
                                </td>
                              </>
                            )}

                            <td className="px-4 py-3 text-right">
                              <div className="inline-flex items-center gap-2">
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setSelectedCandidate(candidate);
                                  }}
                                  className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-[#D6DEE8] bg-white text-sibs-primary-1 transition hover:bg-[#F8FAFC]"
                                  title="View"
                                >
                                  <Eye size={16} />
                                </button>

                                {candidate.currentStage ===
                                  "Online Assessment" && (
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleOpenAssessmentModal(candidate);
                                    }}
                                    className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-cyan-100 bg-cyan-50 text-cyan-700 transition hover:bg-cyan-100"
                                    title="Update Assessment"
                                  >
                                    <ClipboardCheck size={16} />
                                  </button>
                                )}

                                {candidate.currentStage ===
                                  "Online Assessment" &&
                                  canScheduleInterview(candidate) && (
                                    <button
                                      type="button"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleOpenScheduleInterview(candidate);
                                      }}
                                      className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-blue-100 bg-blue-50 text-blue-700 transition hover:bg-blue-100"
                                      title="Schedule Interview"
                                    >
                                      <CalendarDays size={16} />
                                    </button>
                                  )}

                                {candidate.currentStage ===
                                  "Interview Scheduled" && (
                                  <>
                                    <button
                                      type="button"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleOpenScheduleInterview(candidate);
                                      }}
                                      className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-blue-100 bg-blue-50 text-blue-700 transition hover:bg-blue-100"
                                      title="Update Interview Schedule"
                                    >
                                      <CalendarDays size={16} />
                                    </button>

                                    <button
                                      type="button"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleCancelInterview(candidate);
                                      }}
                                      className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-red-100 bg-red-50 text-red-700 transition hover:bg-red-100"
                                      title="Cancel Interview"
                                    >
                                      <X size={16} />
                                    </button>
                                  </>
                                )}

                                {candidate.currentStage !== "Lead / Sourced" &&
                                  candidate.currentStage !==
                                    "Initial Screening" &&
                                  candidate.currentStage !==
                                    "Online Assessment" &&
                                  candidate.currentStage !==
                                    "Interview Scheduled" &&
                                  getNextStage(candidate.currentStage) && (
                                    <button
                                      type="button"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleOpenMoveModal(candidate);
                                      }}
                                      className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-[#D6DEE8] bg-white text-sibs-primary-1 transition hover:bg-[#F8FAFC]"
                                      title="Move Next"
                                    >
                                      <ArrowRight size={16} />
                                    </button>
                                  )}

                                {candidate.currentStage ===
                                  "Initial Screening" && (
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleOpenMoveModal(candidate);
                                    }}
                                    className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-[#D6DEE8] bg-white text-sibs-primary-1 transition hover:bg-[#F8FAFC]"
                                    title="Move to Online Assessment"
                                  >
                                    <ArrowRight size={16} />
                                  </button>
                                )}
                              </div>
                            </td>
                          </tr>
                        );
                      })
                    ) : (
                      <tr>
                        <td
                          colSpan={10}
                          className="px-5 py-12 text-center text-sm font-bold text-gray-500"
                        >
                          No candidate records found.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="space-y-3 p-4 lg:hidden">
              {stageFilteredCandidates.length > 0 ? (
                stageFilteredCandidates.map((candidate) => (
                  <button
                    key={candidate.id}
                    type="button"
                    onClick={() => setSelectedCandidate(candidate)}
                    className="w-full rounded-2xl border border-[#E6ECF2] bg-white p-4 text-left shadow-sm transition hover:border-[var(--sibs-primary-1)]/40 hover:bg-[#FAFBFC]"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex min-w-0 items-center gap-3">
                        <CandidateAvatar candidate={candidate} />

                        <div>
                          <h3 className="text-sm font-bold text-[#0F172A]">
                            {candidate.name}
                          </h3>
                          <p className="mt-1 text-xs font-medium text-sibs-tertiary-5">
                            {getRoleTitle(candidate.roleAccount)} /{" "}
                            {getAccount(candidate.roleAccount)}
                          </p>
                        </div>
                      </div>

                      <span
                        className={`shrink-0 rounded-full border px-2.5 py-1 text-[10px] font-bold ${getStageClass(
                          candidate.currentStage
                        )}`}
                      >
                        {candidate.currentStage}
                      </span>
                    </div>

                    <div className="mt-4 grid grid-cols-2 gap-2">
                      <div className="rounded-xl bg-[#F8FAFC] p-3">
                        <p className="text-[10px] font-bold uppercase text-sibs-tertiary-5">
                          PRF
                        </p>
                        <span
                          className={`mt-1 inline-flex rounded-full border px-2 py-0.5 text-[10px] font-bold ${getPrfStatusClass(
                            candidate.prfStatus || "Review"
                          )}`}
                        >
                          {candidate.prfStatus || "Review"}
                        </span>
                      </div>

                      <div className="rounded-xl bg-[#F8FAFC] p-3">
                        <p className="text-[10px] font-bold uppercase text-sibs-tertiary-5">
                          Assessment Result
                        </p>
                        <span
                          className={`mt-1 inline-flex rounded-full border px-2 py-0.5 text-[10px] font-bold ${getAssessmentResultClass(
                            getAssessmentResult(candidate)
                          )}`}
                        >
                          {candidate.assessmentResult || "—"}
                        </span>
                      </div>
                    </div>
                  </button>
                ))
              ) : (
                <div className="rounded-xl border border-[#E6ECF2] bg-white px-5 py-10 text-center text-sm font-bold text-gray-500">
                  No candidate records found.
                </div>
              )}
            </div>
          </section>

          <InterviewCalendar
            candidates={filteredCandidates}
            onViewCandidate={(candidate) => setSelectedCandidate(candidate)}
          />
        </div>
      </main>

      <CandidatePipelineModal
        open={!!selectedCandidate}
        candidate={selectedCandidate}
        onClose={() => setSelectedCandidate(null)}
        onUpdatePrfStatus={handleUpdatePrfStatus}
        onOpenScheduleModal={handleOpenScheduleInterview}
        onOpenMoveModal={handleOpenMoveModal}
        onOpenAssessmentModal={handleOpenAssessmentModal}
        onOpenDropOffModal={handleOpenDropOffModal}
        onCompleteInterview={handleCompleteInterview}
        onSendAssessmentEmail={handleSendAssessmentEmail}
        onCancelInterview={handleCancelInterview}
        onUpdateOfferApproval={handleUpdateOfferApproval}
        onSendOfferEmail={handleSendOfferEmail}
        onOfferDecision={handleOfferDecision}
      />

      <MoveStageModal
        open={!!moveCandidate}
        candidate={moveCandidate}
        form={moveForm}
        setForm={setMoveForm}
        onClose={handleCloseMoveModal}
        onSubmit={handleSubmitMove}
      />

      <ScheduleInterviewModal
        open={!!scheduleCandidate}
        candidate={scheduleCandidate}
        form={scheduleForm}
        setForm={setScheduleForm}
        onClose={handleCloseScheduleInterview}
        onSubmit={handleSubmitScheduleInterview}
      />

      <AssessmentModal
        open={!!assessmentCandidate}
        candidate={assessmentCandidate}
        form={assessmentForm}
        setForm={setAssessmentForm}
        onClose={handleCloseAssessmentModal}
        onSubmit={handleSubmitAssessment}
        onSendEmail={handleSendAssessmentEmail}
      />

      <OfferDetailsModal
        open={!!offerCandidate}
        candidate={offerCandidate}
        form={offerForm}
        setForm={setOfferForm}
        onClose={handleCloseOfferModal}
        onSubmit={handleSubmitOfferDetails}
      />

      <DropOffModal
        open={!!dropOffCandidate}
        candidate={dropOffCandidate}
        form={dropOffForm}
        setForm={setDropOffForm}
        onClose={handleCloseDropOffModal}
        onSubmit={handleSubmitDropOff}
      />
    </div>
  );
}