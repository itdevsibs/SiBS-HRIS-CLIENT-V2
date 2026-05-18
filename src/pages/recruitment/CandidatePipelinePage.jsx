import React, { useEffect, useMemo, useState } from "react";
import Header from "../../components/layout/Header";
import { useUser } from "../../services/context/UserContext";

import {
  Search,
  Eye,
  ArrowRight,
  X,
  UserX,
  UsersRound,
  UserCheck,
  BriefcaseBusiness,
  ShieldCheck,
  Filter,
  CalendarDays,
  ClipboardCheck,
  Mail,
  RotateCcw,
  SlidersHorizontal,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
} from "lucide-react";

const CANDIDATE_APPLICATIONS_STORAGE_KEY = "ta_candidate_applications";
const PIPELINE_CANDIDATES_STORAGE_KEY = "ta_pipeline_candidates";
const OFFER_ELIGIBLE_STORAGE_KEY = "ta_offer_eligible_candidates";
const OFFER_RECORDS_STORAGE_KEY = "ta_offer_records";
const INTERNAL_CANDIDATES_STORAGE_KEY = "ta_internal_candidates";
const PUBLIC_SUBMISSIONS_KEY = "ta_public_candidate_submissions";
const PIPELINE_SYNC_EVENTS_KEY = "ta_pipeline_sync_events";

const pipelineStages = [
  "Initial Screening",
  "Online Assessment",
  "Interview Scheduled",
  "Interviewed",
  "Offered",
  "Accepted",
  "Drop-off",
];

const normalStageFlow = [
  "Initial Screening",
  "Online Assessment",
  "Interview Scheduled",
  "Interviewed",
  "Offered",
  "Accepted",
];

const roleOptions = [
  "All Roles",
  "Not assigned yet",
  "Customer Service Representative",
  "QA Specialist",
  "RCM Analyst",
  "IT Support",
  "HR Assistant",
  "System Developer",
  "Accounting Staff",
];

const accountOptions = [
  "All Accounts",
  "Not assigned yet",
  "Collect IV",
  "Collect AR",
  "Connect",
  "DentistRX",
  "Reconciliation",
  "TeleDentistry",
  "Cash",
  "US Visa",
  "Channel Assist",
  "Yomdel",
];

const hiringRequirementOptions = [
  { id: "HIR-001", label: "HIR-001 — Customer Service Representative / Collect IV", roleTitle: "Customer Service Representative", account: "Collect IV" },
  { id: "HIR-002", label: "HIR-002 — QA Specialist / Connect", roleTitle: "QA Specialist", account: "Connect" },
  { id: "HIR-003", label: "HIR-003 — RCM Analyst / Reconciliation", roleTitle: "RCM Analyst", account: "Reconciliation" },
  { id: "HIR-004", label: "HIR-004 — IT Support / SIBS", roleTitle: "IT Support", account: "SIBS" },
  { id: "HIR-005", label: "HIR-005 — Customer Service Representative / US Visa", roleTitle: "Customer Service Representative", account: "US Visa" },
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

function ConfirmationModal({ open, title = "Confirm Action", message, confirmLabel = "Continue", cancelLabel = "Cancel", onCancel, onConfirm }) {
  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[12000] flex h-dvh items-center justify-center bg-slate-950/40 px-4 py-4 backdrop-blur-[1px]"
      onClick={onCancel}
    >
      <div
        className="w-full max-w-md overflow-hidden rounded-2xl border border-[#E6ECF2] bg-white shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="border-b border-[#EEF2F6] px-5 py-4">
          <h3 className="text-base font-extrabold text-sibs-primary-1">{title}</h3>
          <p className="mt-1 text-sm font-semibold leading-6 text-[#667085]">{message}</p>
        </div>

        <div className="flex flex-col-reverse gap-2 px-5 py-4 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={onCancel}
            className="inline-flex h-11 items-center justify-center rounded-xl border border-[#D9E2EC] bg-white px-5 text-sm font-bold text-[#344054] transition hover:border-[#B8C4D2] hover:bg-[#F8FAFC] focus:outline-none focus:ring-4 focus:ring-sibs-primary-1/10"
          >
            {cancelLabel}
          </button>

          <button
            type="button"
            onClick={onConfirm}
            className="inline-flex h-11 items-center justify-center rounded-xl bg-sibs-primary-1 px-5 text-sm font-bold text-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md hover:opacity-95 focus:outline-none focus:ring-4 focus:ring-sibs-primary-1/20"
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

function useConfirmDialog() {
  const [confirmState, setConfirmState] = useState(null);

  function confirmAction(message, options = {}) {
    return new Promise((resolve) => {
      setConfirmState({
        message,
        title: options.title || "Confirm Action",
        confirmLabel: options.confirmLabel || "Continue",
        cancelLabel: options.cancelLabel || "Cancel",
        resolve,
      });
    });
  }

  function closeConfirm(result) {
    if (confirmState?.resolve) confirmState.resolve(result);
    setConfirmState(null);
  }

  const ConfirmationDialog = (
    <ConfirmationModal
      open={Boolean(confirmState)}
      title={confirmState?.title}
      message={confirmState?.message}
      confirmLabel={confirmState?.confirmLabel}
      cancelLabel={confirmState?.cancelLabel}
      onCancel={() => closeConfirm(false)}
      onConfirm={() => closeConfirm(true)}
    />
  );

  return { confirmAction, ConfirmationDialog };
}

function getRoleTitle(roleAccount = "") {
  return roleAccount.split(" - ")?.[0] || roleAccount || "";
}

function getAccount(roleAccount = "") {
  return roleAccount.split(" - ")?.[1] || "Not assigned yet";
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
      candidate?.interviewStatus !== "For Assessment"
  );
}

function isPrfReviewed(candidate) {
  return Boolean(
    candidate?.prfReviewed ||
      candidate?.prfReviewedAt ||
      candidate?.currentStage !== "Initial Screening"
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

  if (candidate.currentStage === "Initial Screening") return "For Assessment";
  if (candidate.currentStage === "Initial Screening") return "For Assessment";

  if (candidate.currentStage === "Online Assessment") {
    return getAssessmentResult(candidate) ? "" : "For Assessment";
  }

  return candidate.interviewStatus || "—";
}

function getDisplayInterviewType(candidate) {
  if (!candidate) return "—";

  if (
    candidate.currentStage === "Initial Screening" ||
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
    case "Initial Screening":
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
      return "border-red-100 bg-red-50 text-sibs-primary-1";
    default:
      return "border-gray-100 bg-gray-50 text-gray-600";
  }
}

function getPrfStatusClass(status) {
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

function getInterviewStatusClass(status) {
  switch (status) {
    case "Scheduled":
      return "border-blue-100 bg-blue-50 text-blue-700";
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
    case "For Assessment":
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
      return "border-red-100 bg-red-50 text-sibs-primary-1";
    default:
      return "border-gray-100 bg-gray-50 text-gray-600";
  }
}

function getOfferApprovalClass(status) {
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

function getOfferDecisionClass(status) {
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

You may choose Accept, Reject, or Request to Negotiate after checking the contract.

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
    candidateApplicationId: "APP-001",
    applicationId: "APP-001",
    candidateMasterId: 1,
    candidateId: "CAND-001",
    name: "Juan Santos Dela Cruz",
    candidateName: "Juan Santos Dela Cruz",
    email: "juan.delacruz@email.com",
    contactNumber: "09123456789",
    roleTitle: "Not assigned yet",
    account: "Not assigned yet",
    roleAccount: "Not assigned yet - Not assigned yet",
    source: "Employee Referral Program",
    owner: "Maria Reyes",
    taOwner: "Maria Reyes",
    currentStage: "Initial Screening",
    previousStage: null,
    applicationStatus: "Active",
    prfStatus: "Review",
    prfReviewed: false,
    prfReviewedAt: null,
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
    dateMoved: "2026-05-02",
    updatedAt: "2026-05-02",
    reasonForMovement: "Candidate moved from Talent Pool without final role, account, or hiring requirement assignment.",
    avatarColor: "bg-blue-600",
    dropOffReason: null,
    dropOffCategory: null,
    dropOffRemarks: null,
    candidateSnapshot: {
      id: 1,
      candidateId: "CAND-001",
      name: "Juan Santos Dela Cruz",
      firstName: "Juan",
      middleName: "Santos",
      lastName: "Dela Cruz",
      email: "juan.delacruz@email.com",
      phoneNumber1: "09123456789",
      openPosition: "Customer Service Representative",
      applyingLocation: "Davao Site",
      source: "Employee Referral Program",
      skillsLanguage: "English, Chat Support, Customer Service",
    },
    timeline: [
      {
        stage: "Initial Screening",
        owner: "Maria Reyes",
        source: "Talent Pool",
        timestamp: "May 2, 2026, 9:00 AM",
        reason: "Candidate moved from Talent Pool. Final role/account assignment is pending until Offered stage.",
      },
    ],
  },
{
    id: 2,
    candidateApplicationId: "APP-002",
    applicationId: "APP-002",
    candidateMasterId: 2,
    candidateId: "CAND-002",
    name: "Maria Lopez Santos",
    candidateName: "Maria Lopez Santos",
    email: "maria.santos@email.com",
    contactNumber: "09171234567",
    roleTitle: "Not assigned yet",
    account: "Not assigned yet",
    roleAccount: "Not assigned yet - Not assigned yet",
    source: "Social Media Ads",
    owner: "John Dela Cruz",
    taOwner: "John Dela Cruz",
    currentStage: "Initial Screening",
    previousStage: "Initial Screening",
    applicationStatus: "Active",
    prfStatus: "Matched",
    prfReviewed: true,
    prfReviewedAt: "May 4, 2026, 10:30 AM",
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
    dateMoved: "2026-05-04",
    updatedAt: "2026-05-04",
    reasonForMovement: "PRF status changed to Matched. Candidate moved from Initial Screening to Initial Screening.",
    avatarColor: "bg-cyan-600",
    dropOffReason: null,
    dropOffCategory: null,
    dropOffRemarks: null,
    candidateSnapshot: {
      id: 2,
      candidateId: "CAND-002",
      name: "Maria Lopez Santos",
      firstName: "Maria",
      middleName: "Lopez",
      lastName: "Santos",
      email: "maria.santos@email.com",
      phoneNumber1: "09171234567",
      openPosition: "QA Specialist",
      applyingLocation: "Davao Site",
      source: "Social Media Ads",
      skillsLanguage: "QA, English, Documentation",
    },
    timeline: [
      {
        stage: "Initial Screening",
        owner: "John Dela Cruz",
        source: "Talent Pool",
        timestamp: "May 4, 2026, 9:15 AM",
        reason: "Candidate moved from Talent Pool without final assignment.",
      },
      {
        stage: "Initial Screening",
        owner: "John Dela Cruz",
        source: "PRF Review",
        timestamp: "May 4, 2026, 10:30 AM",
        reason: "PRF status changed to Matched. Candidate moved to Initial Screening.",
        remarks: "PRF Status: Matched",
      },
    ],
  },
{
    id: 3,
    candidateApplicationId: "APP-003",
    applicationId: "APP-003",
    candidateMasterId: 3,
    candidateId: "CAND-003",
    name: "Mark Villanueva Reyes",
    candidateName: "Mark Villanueva Reyes",
    email: "mark.reyes@email.com",
    contactNumber: "09281234567",
    roleTitle: "Not assigned yet",
    account: "Not assigned yet",
    roleAccount: "Not assigned yet - Not assigned yet",
    source: "Online Job Portals",
    owner: "Kim Domingo",
    taOwner: "Kim Domingo",
    currentStage: "Online Assessment",
    previousStage: "Initial Screening",
    applicationStatus: "Active",
    prfStatus: "Matched",
    prfReviewed: true,
    prfReviewedAt: "May 6, 2026, 11:00 AM",
    interviewDate: null,
    interviewType: "-",
    interviewStatus: "For Assessment",
    assessmentStatus: "Taken",
    assessmentResult: "Assessment Fit",
    assessmentEmailSent: true,
    assessmentEmailSentAt: "May 6, 2026, 11:15 AM",
    assessmentTakenAt: "May 6, 2026, 3:00 PM",
    assessmentTaggedAt: "May 6, 2026, 4:00 PM",
    assessmentRemarks: "Candidate passed online assessment and is ready for interview scheduling.",
    dateMoved: "2026-05-06",
    updatedAt: "2026-05-06",
    reasonForMovement: "Assessment marked as Taken and tagged as Assessment Fit.",
    avatarColor: "bg-orange-600",
    dropOffReason: null,
    dropOffCategory: null,
    dropOffRemarks: null,
    candidateSnapshot: {
      id: 3,
      candidateId: "CAND-003",
      name: "Mark Villanueva Reyes",
      firstName: "Mark",
      middleName: "Villanueva",
      lastName: "Reyes",
      email: "mark.reyes@email.com",
      phoneNumber1: "09281234567",
      openPosition: "RCM Analyst",
      applyingLocation: "Tagum Site",
      source: "Online Job Portals",
      skillsLanguage: "RCM, Healthcare, Documentation",
    },
    timeline: [
      {
        stage: "Initial Screening",
        owner: "Kim Domingo",
        source: "Talent Pool",
        timestamp: "May 6, 2026, 9:00 AM",
        reason: "Candidate moved from Talent Pool without final assignment.",
      },
      {
        stage: "Initial Screening",
        owner: "Kim Domingo",
        source: "PRF Review",
        timestamp: "May 6, 2026, 11:00 AM",
        reason: "PRF status changed to Matched. Candidate moved to Initial Screening.",
      },
      {
        stage: "Online Assessment",
        owner: "Kim Domingo",
        source: "Online Assessment",
        timestamp: "May 6, 2026, 11:15 AM",
        reason: "Candidate moved to Online Assessment. Assessment email sent.",
      },
      {
        stage: "Online Assessment",
        owner: "Kim Domingo",
        source: "Online Assessment",
        timestamp: "May 6, 2026, 4:00 PM",
        reason: "Assessment marked as Taken and tagged as Assessment Fit.",
      },
    ],
  },
  {
    id: 4,
    candidateApplicationId: "APP-004",
    applicationId: "APP-004",
    candidateMasterId: 4,
    candidateId: "CAND-004",
    name: "Ana Garcia Lim",
    candidateName: "Ana Garcia Lim",
    email: "ana.lim@email.com",
    contactNumber: "09351234567",
    roleTitle: "IT Support",
    account: "SIBS IT",
    roleAccount: "IT Support - SIBS IT",
    source: "Walk In",
    owner: "Paul Garcia",
    taOwner: "Paul Garcia",
    currentStage: "Offered",
    previousStage: "Interviewed",
    applicationStatus: "Active",
    prfStatus: "Matched",
    prfReviewed: true,
    prfReviewedAt: "May 8, 2026, 9:30 AM",
    interviewDate: "2026-05-10T10:30",
    interviewType: "Face-to-face",
    interviewStatus: "Completed",
    assessmentStatus: "Taken",
    assessmentResult: "Assessment Fit",
    assessmentEmailSent: true,
    assessmentEmailSentAt: "May 8, 2026, 10:00 AM",
    assessmentTakenAt: "May 8, 2026, 2:30 PM",
    assessmentTaggedAt: "May 8, 2026, 3:00 PM",
    assessmentRemarks: "Candidate passed the online assessment.",
    dateMoved: "2026-05-10",
    updatedAt: "2026-05-10",
    reasonForMovement: "Offer details prepared. Final role and account were assigned during Offered stage.",
    avatarColor: "bg-violet-600",
    offerDetails: {
      roleTitle: "IT Support",
      account: "SIBS IT",
      compensation: 27000,
      basicPay: 24000,
      deminimisDailyRate: 3000,
      preparedAt: "May 10, 2026, 4:00 PM",
      preparedBy: "Paul Garcia",
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
    dropOffReason: null,
    dropOffCategory: null,
    dropOffRemarks: null,
    candidateSnapshot: {
      id: 4,
      candidateId: "CAND-004",
      name: "Ana Garcia Lim",
      firstName: "Ana",
      middleName: "Garcia",
      lastName: "Lim",
      email: "ana.lim@email.com",
      phoneNumber1: "09351234567",
      openPosition: "IT Support",
      applyingLocation: "Mabini Site",
      source: "Walk In",
      skillsLanguage: "Tech, Troubleshooting, English",
    },
    timeline: [
      {
        stage: "Initial Screening",
        owner: "Paul Garcia",
        source: "Talent Pool",
        timestamp: "May 8, 2026, 8:45 AM",
        reason: "Candidate moved from Talent Pool without final role or account assignment.",
      },
      {
        stage: "Initial Screening",
        owner: "Paul Garcia",
        source: "PRF Review",
        timestamp: "May 8, 2026, 9:30 AM",
        reason: "PRF status changed to Matched. Candidate moved to Initial Screening.",
      },
      {
        stage: "Online Assessment",
        owner: "Paul Garcia",
        source: "Online Assessment",
        timestamp: "May 8, 2026, 10:00 AM",
        reason: "Candidate moved to Online Assessment and assessment email was sent.",
      },
      {
        stage: "Online Assessment",
        owner: "Paul Garcia",
        source: "Online Assessment",
        timestamp: "May 8, 2026, 3:00 PM",
        reason: "Assessment marked as Taken and tagged as Assessment Fit.",
      },
      {
        stage: "Interview Scheduled",
        owner: "Paul Garcia",
        source: "Interview Scheduling",
        timestamp: "May 9, 2026, 2:00 PM",
        reason: "Candidate passed assessment and interview schedule was set.",
      },
      {
        stage: "Interviewed",
        owner: "Paul Garcia",
        source: "Interview",
        timestamp: "May 10, 2026, 11:30 AM",
        reason: "Interview completed. Candidate moved to Interviewed.",
      },
      {
        stage: "Offered",
        owner: "Paul Garcia",
        source: "Offer Approval",
        timestamp: "May 10, 2026, 4:00 PM",
        reason: "Final role and account assigned during Offered stage.",
        remarks: "Offer Role: IT Support, Offer Account: SIBS IT, Compensation: ₱27,000",
      },
    ],
  },
  {
    id: 5,
    candidateApplicationId: "APP-005",
    applicationId: "APP-005",
    candidateMasterId: 5,
    candidateId: "CAND-005",
    name: "Leonardo Ramos Cruz",
    candidateName: "Leonardo Ramos Cruz",
    email: "leo.cruz@email.com",
    contactNumber: "09451234567",
    roleTitle: "Not assigned yet",
    account: "Not assigned yet",
    roleAccount: "Not assigned yet - Not assigned yet",
    source: "Institutional Partnership",
    owner: "Maria Reyes",
    taOwner: "Maria Reyes",
    currentStage: "Drop-off",
    previousStage: "Initial Screening",
    applicationStatus: "Closed",
    prfStatus: "Matched",
    prfReviewed: true,
    prfReviewedAt: "May 12, 2026, 10:00 AM",
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
    dateMoved: "2026-05-13",
    updatedAt: "2026-05-13",
    reasonForMovement: "Candidate moved from Initial Screening to Drop-off. Reason: No response after follow-up calls and messages.",
    avatarColor: "bg-red-600",
    offerDetails: null,
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
    dropOffReason: "No response after follow-up calls and messages.",
    dropOffCategory: "No Response",
    dropOffRemarks: "TA attempted to reach candidate on May 12 and May 13, but candidate did not respond.",
    candidateSnapshot: {
      id: 5,
      candidateId: "CAND-005",
      name: "Leonardo Ramos Cruz",
      firstName: "Leonardo",
      middleName: "Ramos",
      lastName: "Cruz",
      email: "leo.cruz@email.com",
      phoneNumber1: "09451234567",
      openPosition: "Accounting Staff",
      applyingLocation: "Davao Site",
      source: "Institutional Partnership",
      skillsLanguage: "Accounting, Documentation, Excel",
    },
    timeline: [
      {
        stage: "Initial Screening",
        owner: "Maria Reyes",
        source: "Talent Pool",
        timestamp: "May 12, 2026, 8:30 AM",
        reason: "Candidate moved from Talent Pool without final role or account assignment.",
      },
      {
        stage: "Initial Screening",
        owner: "Maria Reyes",
        source: "PRF Review",
        timestamp: "May 12, 2026, 10:00 AM",
        reason: "PRF status changed to Matched. Candidate moved to Initial Screening.",
      },
      {
        stage: "Drop-off",
        owner: "Maria Reyes",
        source: "Candidate Follow-up",
        timestamp: "May 13, 2026, 4:30 PM",
        reason: "Candidate moved from Initial Screening to Drop-off. Reason: No response after follow-up calls and messages.",
        dropOffCategory: "No Response",
        dropOffReason: "No response after follow-up calls and messages.",
        remarks: "TA attempted to reach candidate on May 12 and May 13, but candidate did not respond.",
      },
    ],
  }

];

function getPipelineApplicationRoleAccount(candidate) {
  const offerRole = candidate?.offerDetails?.roleTitle || candidate?.offeredRoleTitle;
  const offerAccount = candidate?.offerDetails?.account || candidate?.offeredAccount;

  if (offerRole || offerAccount) {
    return `${offerRole || "Not assigned yet"} - ${offerAccount || "Not assigned yet"}`;
  }

  if (candidate?.roleAccount) return candidate.roleAccount;

  const roleTitle = candidate?.roleTitle || "Not assigned yet";
  const account = candidate?.account || "Not assigned yet";

  return `${roleTitle || "Not assigned yet"} - ${account || "Not assigned yet"}`;
}

function getCandidateMasterStatusFromPipeline(candidate) {
  if (candidate?.currentStage === "Accepted" || candidate?.offerDecision === "Accepted") {
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

function buildPipelineSummaryForTalentPool(candidate) {
  const roleAccount = getPipelineApplicationRoleAccount(candidate);

  return {
    pipelineStatus:
      candidate?.currentStage === "Accepted" || candidate?.currentStage === "Drop-off"
        ? "Closed"
        : candidate?.applicationStatus || "Active",
    currentApplicationId: candidate?.applicationId || candidate?.candidateApplicationId || candidate?.id || "",
    currentHiringRequirementId: candidate?.hiringRequirementId || "",
    currentPipelineStage: candidate?.currentStage || "Initial Screening",
    currentApplicationStatus: candidate?.applicationStatus || "Active",
    currentAppliedRole:
      candidate?.currentStage === "Offered" || candidate?.currentStage === "Accepted"
        ? candidate?.offerDetails?.roleTitle || candidate?.roleTitle || getRoleTitle(roleAccount) || "Not assigned yet"
        : "Not assigned yet",
    currentAppliedAccount:
      candidate?.currentStage === "Offered" || candidate?.currentStage === "Accepted"
        ? candidate?.offerDetails?.account || candidate?.account || getAccount(roleAccount) || "Not assigned yet"
        : "Not assigned yet",
    currentTaOwner: candidate?.taOwner || candidate?.owner || "—",
    currentPrfStatus: candidate?.prfStatus || "Review",
    currentAssessmentStatus: candidate?.assessmentStatus || "Not Take",
    currentAssessmentResult: candidate?.assessmentResult || "",
    currentInterviewStatus: candidate?.interviewStatus || "—",
    currentOfferStatus: candidate?.offerApprovalStatus || getOfferApprovalSummary(candidate),
    currentOfferDecision: candidate?.offerDecision || "",
    currentInterviewDate: candidate?.interviewDate || "",
    currentDropOffCategory: candidate?.dropOffCategory || "",
    currentDropOffReason: candidate?.dropOffReason || "",
    lastPipelineUpdate: candidate?.updatedAt || candidate?.dateMoved || getCurrentDate(),
  };
}


function buildTalentPoolApplicationHistoryEntry(candidate, summary) {
  const latestTimeline = Array.isArray(candidate?.timeline) && candidate.timeline.length
    ? candidate.timeline[candidate.timeline.length - 1]
    : null;

  const isDropOff = candidate?.currentStage === "Drop-off";
  const role = summary.currentAppliedRole || "Not assigned yet";
  const account = summary.currentAppliedAccount || "Not assigned yet";
  const date = summary.lastPipelineUpdate || getCurrentDate();

  if (isDropOff) {
    const reason = candidate?.dropOffReason || latestTimeline?.dropOffReason || "No drop-off reason provided.";
    const category = candidate?.dropOffCategory || latestTimeline?.dropOffCategory || "Drop-off";

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
      outcome: latestTimeline.reason || `Pipeline Update: ${summary.currentPipelineStage}`,
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

function upsertTalentPoolApplicationHistory(existingHistory, candidate, summary) {
  const history = Array.isArray(existingHistory) ? existingHistory : [];
  const entry = buildTalentPoolApplicationHistoryEntry(candidate, summary);
  const entryKey = `${entry.date}|${entry.outcome}`;
  const alreadyExists = history.some((item) => `${item.date}|${item.outcome}` === entryKey);

  return alreadyExists ? history : [...history, entry];
}

function syncTalentPoolFromPipelineApplication(candidate) {
  if (!candidate || typeof window === "undefined") return;

  const internalCandidates = safeReadArray(INTERNAL_CANDIDATES_STORAGE_KEY);
  if (!internalCandidates.length) return;

  const masterStatus = getCandidateMasterStatusFromPipeline(candidate);
  const summary = buildPipelineSummaryForTalentPool(candidate);
  const candidateEmail = String(candidate.email || candidate.candidateEmail || "").toLowerCase();

  let didUpdate = false;

  const nextCandidates = internalCandidates.map((item) => {
    const isMatch =
      String(item.id || "") === String(candidate.candidateMasterId || candidate.masterCandidateId || "") ||
      String(item.candidateId || "") === String(candidate.candidateId || "") ||
      String(item.email || "").toLowerCase() === candidateEmail;

    if (!isMatch) return item;

    didUpdate = true;

    return {
      ...item,
      ...summary,
      status: masterStatus || item.status || "New Applicant",
      accountFit:
        candidate.currentStage === "Offered" || candidate.currentStage === "Accepted"
          ? summary.currentAppliedAccount || item.accountFit || "Not assigned yet"
          : item.accountFit || "Not assigned yet",
      lastActivity: getCurrentDate(),
      applicationHistory: upsertTalentPoolApplicationHistory(item.applicationHistory, candidate, summary),
    };
  });

  if (didUpdate) {
    safeWriteArray(INTERNAL_CANDIDATES_STORAGE_KEY, nextCandidates);
  }
}


function normalizeCandidate(candidate) {
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
    id: candidate.id || candidate.candidateApplicationId || candidate.applicationId || Date.now(),
    candidateApplicationId:
      candidate.candidateApplicationId || candidate.applicationId || candidate.id,
    candidateMasterId:
      candidate.candidateMasterId || candidate.masterCandidateId || candidateSnapshot.id,
    name: candidateName,
    candidateName,
    email: candidate.email || candidate.candidateEmail || candidateSnapshot.email || "",
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
    owner: candidate.owner || candidate.taOwner || candidateSnapshot.taOwner || candidateSnapshot.createdBy || "Current User",
    taOwner: candidate.taOwner || candidate.owner || candidateSnapshot.taOwner || candidateSnapshot.createdBy || "Current User",
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

  if (false && currentStage === "Initial Screening") {
    return {
      ...normalized,
      interviewDate: null,
      interviewType: "-",
      interviewStatus: "For Assessment",
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


function getOfferRecordStatusFromCandidate(candidate) {
  if (candidate?.offerDecision === "Accepted" || candidate?.currentStage === "Accepted") return "Accepted";
  if (candidate?.offerDecision === "Rejected" || candidate?.currentStage === "Drop-off") return "Declined";
  if (candidate?.offerDecision === "Negotiate") return "Negotiation";
  if (candidate?.offerEmailSent) return "Contract Sent";
  if (isOfferApproved(candidate)) return "Approved";
  if ((candidate?.offerApprovalStatus || getOfferApprovalSummary(candidate)) === "Rejected") return "Rejected";
  return "For Review";
}

function upsertOfferRecordFromPipeline(candidate) {
  if (!candidate || typeof window === "undefined") return;

  const current = safeReadArray(OFFER_RECORDS_STORAGE_KEY);
  const candidateApplicationId = candidate.candidateApplicationId || candidate.applicationId || candidate.id;
  const candidateEmail = String(candidate.email || candidate.candidateEmail || "").toLowerCase();
  const existingIndex = current.findIndex((offer) =>
    String(offer.candidateApplicationId || "") === String(candidateApplicationId || "") ||
    String(offer.candidateEmail || "").toLowerCase() === candidateEmail
  );
  const existing = existingIndex >= 0 ? current[existingIndex] : null;
  const nextId = existing?.id || current.reduce((max, offer) => Math.max(max, Number(offer.id) || 0), 0) + 1;
  const offerDetails = candidate.offerDetails || {};
  const basicPay = Number(offerDetails.basicPay || candidate.basicPay || 0);
  const deminimisDailyRate = Number(offerDetails.deminimisDailyRate || candidate.deminimisDailyRate || 0);
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
    roleTitle: offerDetails.roleTitle || candidate.roleTitle || getRoleTitle(candidate.roleAccount),
    account: offerDetails.account || candidate.account || getAccount(candidate.roleAccount),
    hiringRequirementId: offerDetails.hiringRequirementId || candidate.hiringRequirementId || "—",
    basicPay,
    deminimisDailyRate,
    dailyRate: basicPay + deminimisDailyRate,
    owner: candidate.taOwner || candidate.owner || "Current User",
    source: candidate.source || "Candidate Pipeline",
    status: getOfferRecordStatusFromCandidate(candidate),
    offerDate: existing?.offerDate || getCurrentDate(),
    contractSent: Boolean(candidate.offerEmailSent),
    contractSentAt: candidate.offerEmailSentAt || existing?.contractSentAt || null,
    candidateResponse,
    responseDate: candidate.offerDecisionAt || existing?.responseDate || null,
    declineCategory: candidate.dropOffCategory || existing?.declineCategory || "",
    declineReason: candidate.dropOffReason || existing?.declineReason || "",
    remarks: candidate.reasonForMovement || existing?.remarks || "Offer received from Candidate Pipeline.",
    approvals: candidate.offerApprovals || existing?.approvals || {
      "Raul Nadela": { status: "For Review", updatedAt: null, remarks: "" },
      Haasanor: { status: "For Review", updatedAt: null, remarks: "" },
    },
  };

  const next = existingIndex >= 0
    ? current.map((offer, index) => index === existingIndex ? payload : offer)
    : [payload, ...current];

  safeWriteArray(OFFER_RECORDS_STORAGE_KEY, next);
}

function upsertOfferEligibleCandidate(candidate) {
  const current = safeReadArray(OFFER_ELIGIBLE_STORAGE_KEY);

  const payload = {
    candidateApplicationId: candidate.candidateApplicationId || candidate.id,
    candidateId: candidate.candidateId,
    candidateName: candidate.name,
    candidateEmail: candidate.email,
    hiringRequirementId: candidate.hiringRequirementId || candidate.offerDetails?.hiringRequirementId || "",
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
  upsertOfferRecordFromPipeline(candidate);
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

function DashboardMetric({ label, value, icon: Icon, description, valueClassName = "text-sibs-primary-1" }) {
  return (
    <div className="rounded-2xl border border-[#E6ECF2] bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="text-xs font-bold uppercase tracking-wide text-[#475467]">{label}</p>
          <p className={`mt-3 text-3xl font-extrabold ${valueClassName}`}>{value}</p>
          {description && <p className="mt-1 text-xs font-semibold text-sibs-tertiary-5">{description}</p>}
        </div>
        {Icon && (
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#F2F6FA] text-sibs-primary-1">
            <Icon size={22} />
          </div>
        )}
      </div>
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
    <div className="rounded-xl border border-[#E6ECF2] bg-[#F8FAFC] p-4 shadow-sm">
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
        className="flex max-h-[92dvh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl bg-white shadow-xl"
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
            <div className="rounded-xl border border-[#E6ECF2] bg-[#F8FAFC] p-4">
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
              <div className="rounded-xl border border-cyan-100 bg-cyan-50 p-4 text-sm font-semibold leading-6 text-sibs-primary-1">
                After confirming, the candidate will move to Online Assessment,
                assessment status will be set to Not Take, and the assessment
                email will be triggered.
              </div>
            )}

            {nextStage === "Offered" && (
              <div className="rounded-xl border border-amber-100 bg-amber-50 p-4 text-sm font-semibold leading-6 text-sibs-primary-1">
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
        className="flex max-h-[92dvh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl bg-white shadow-xl"
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
            <div className="rounded-xl border border-[#E6ECF2] bg-[#F8FAFC] p-4">
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
              <div className="rounded-xl border border-red-100 bg-red-50 p-4 text-sm font-semibold leading-6 text-sibs-primary-1">
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
        className="flex max-h-[92dvh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl bg-white shadow-xl"
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
            <div className="rounded-xl border border-[#E6ECF2] bg-[#F8FAFC] p-4">
              <h3 className="text-lg font-bold text-sibs-primary-1">
                {candidate.name}
              </h3>
              <p className="mt-1 text-sm font-semibold text-sibs-primary-1/80">
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
        className="flex max-h-[92dvh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl bg-white shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4 border-b border-gray-100 px-5 py-4 sm:px-6 sm:py-5">
          <div>
            <h2 className="text-lg font-bold text-sibs-primary-1 sm:text-xl">
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
            <div className="rounded-xl border border-[#E6ECF2] bg-[#F8FAFC] p-4">
              <h3 className="text-lg font-bold text-sibs-primary-1">
                {candidate.name}
              </h3>
              <p className="mt-1 text-sm font-semibold text-sibs-primary-1/80">
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
        className="flex max-h-[92dvh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl bg-white shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4 border-b border-gray-100 px-5 py-4 sm:px-6 sm:py-5">
          <div>
            <h2 className="text-lg font-bold text-sibs-primary-1 sm:text-xl">
              Offer Details for Approval
            </h2>
            <p className="mt-1 text-sm font-medium text-sibs-tertiary-5">
              Add the final assignment and pay details. Approval will be managed in the Offers page.
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
            <div className="rounded-xl border border-[#E6ECF2] bg-[#F8FAFC] p-4">
              <h3 className="text-lg font-bold text-sibs-primary-1">
                {candidate.name}
              </h3>
              <p className="mt-1 text-sm font-semibold text-sibs-primary-1/80">
                {candidate.roleAccount}
              </p>
            </div>

            <div>
              <label className="mb-1 block text-[11px] font-bold uppercase tracking-wide text-sibs-tertiary-5">
                Hiring Requirement / PRF <span className="text-red-500">*</span>
              </label>
              <select
                required
                value={form.hiringRequirementId}
                onChange={(e) => {
                  const selectedRequirement = hiringRequirementOptions.find((item) => item.id === e.target.value);
                  setForm({
                    ...form,
                    hiringRequirementId: e.target.value,
                    roleTitle: selectedRequirement?.roleTitle || form.roleTitle,
                    account: selectedRequirement?.account || form.account,
                  });
                }}
                className={inputClass()}
              >
                <option value="">Select hiring requirement / PRF</option>
                {hiringRequirementOptions.map((item) => (
                  <option key={item.id} value={item.id}>{item.label}</option>
                ))}
              </select>
              <p className="mt-1 text-xs font-semibold text-sibs-tertiary-5">
                Final role and final account are assigned here, not when the candidate enters the pipeline.
              </p>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1 block text-[11px] font-bold uppercase tracking-wide text-sibs-tertiary-5">
                  Final Role Title <span className="text-red-500">*</span>
                </label>
                <input
                  required
                  value={form.roleTitle}
                  onChange={(e) => setForm({ ...form, roleTitle: e.target.value })}
                  className={inputClass()}
                  placeholder="Example: Customer Service Representative"
                />
              </div>

              <div>
                <label className="mb-1 block text-[11px] font-bold uppercase tracking-wide text-sibs-tertiary-5">
                  Final Account <span className="text-red-500">*</span>
                </label>
                <select
                  required
                  value={form.account}
                  onChange={(e) => setForm({ ...form, account: e.target.value })}
                  className={inputClass()}
                >
                  <option value="">Select account</option>
                  {accountOptions
                    .filter((account) => account !== "All Accounts" && account !== "Not assigned yet")
                    .map((account) => (
                      <option key={account} value={account}>
                        {account}
                      </option>
                    ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
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

            <div className="rounded-xl border border-amber-100 bg-amber-50 p-4 text-sm font-semibold leading-6 text-sibs-primary-1">
              After proceeding, the candidate will move to Offered and will be available in the Offers page for approval and contract sending.
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
            className={`group inline-flex h-11 cursor-pointer items-center justify-center rounded-xl border px-4 text-sm font-extrabold shadow-sm transition duration-150 hover:-translate-y-0.5 hover:shadow-md focus:outline-none focus:ring-4 focus:ring-sibs-primary-1/10 ${getPrfStatusClass(
              status
            )}`}
          >
            <span className="transition group-hover:tracking-wide">Set as {status}</span>
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
  onSaveInterviewNotes,
}) {
  const [showTalentPoolDetails, setShowTalentPoolDetails] = useState(false);
  const [interviewNotesDraft, setInterviewNotesDraft] = useState("");

  useEffect(() => {
    setShowTalentPoolDetails(false);
    setInterviewNotesDraft(candidate?.interviewNotes || "");
  }, [candidate?.id, open]);

  if (!open || !candidate) return null;

  const nextStage = getNextStage(candidate.currentStage);

  const isLeadStage = false;
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
        className="flex max-h-[92dvh] w-full max-w-5xl flex-col overflow-hidden rounded-2xl bg-white shadow-xl"
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

              {isInitialScreening && (
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
                <div className="rounded-xl border border-[#E6ECF2] bg-[#F8FAFC] p-4">
                  <h3 className="text-sm font-bold text-sibs-primary-1">
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

                    {candidate.interviewStatus === "Cancelled" && (
                      <DetailRow
                        label="Cancellation Reason"
                        value={candidate.cancellationReason || "—"}
                      />
                    )}
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
                        className="inline-flex h-10 w-full items-center justify-center rounded-xl border border-red-100 bg-red-50 text-sm font-bold text-sibs-primary-1 transition hover:bg-red-100"
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
                  <div className="rounded-xl border border-[#E6ECF2] bg-[#F8FAFC] p-4">
                    <h3 className="text-sm font-bold text-sibs-primary-1">
                      Offer and Approval
                    </h3>

                    <div className="mt-4 rounded-xl bg-white p-4">
                      <DetailRow
                        label="Offer Role"
                        value={candidate.offerDetails?.roleTitle || candidate.roleTitle}
                      />
                      <DetailRow
                        label="Hiring Requirement"
                        value={candidate.offerDetails?.hiringRequirementId || candidate.hiringRequirementId}
                      />
                      <DetailRow
                        label="Final Role"
                        value={candidate.offerDetails?.roleTitle || candidate.roleTitle}
                      />
                      <DetailRow
                        label="Final Account"
                        value={candidate.offerDetails?.account}
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
                      <p className="mt-4 rounded-xl border border-blue-100 bg-white p-4 text-sm font-semibold leading-6 text-sibs-primary-1">
                        Offer approval is managed in the Offers page. Once Raul Nadela and Haasanor approve, TA/user can send or manually open the offer email here.
                      </p>
                    )}

                    {isOffered && (
                      <div className="mt-4 space-y-4">
                        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                          {offerApprovers.map((approver) => {
                            const approval = candidate.offerApprovals?.[approver] || {
                              status: "For Review",
                              updatedAt: null,
                              remarks: "",
                            };

                            return (
                              <div
                                key={approver}
                                className="rounded-xl border border-[#E6ECF2] bg-white p-4"
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
                                <p className="mt-2 text-xs font-semibold leading-5 text-sibs-tertiary-5">
                                  {approval.updatedAt || "Waiting for approval update from Offers page."}
                                </p>
                                {approval.remarks && (
                                  <p className="mt-2 rounded-lg bg-[#F8FAFC] p-2 text-xs font-semibold leading-5 text-[#475467]">
                                    {approval.remarks}
                                  </p>
                                )}
                              </div>
                            );
                          })}
                        </div>

                        {(candidate.offerApprovalStatus || getOfferApprovalSummary(candidate)) === "Rejected" && (
                          <div className="rounded-xl border border-red-100 bg-red-50 p-4 text-sm font-semibold leading-6 text-sibs-primary-1">
                            Offer was not approved. Check the Offers page approval cards for the approver status.
                          </div>
                        )}

                        {!isOfferApproved(candidate) &&
                          (candidate.offerApprovalStatus || getOfferApprovalSummary(candidate)) !== "Rejected" && (
                            <div className="rounded-xl border border-amber-100 bg-amber-50 p-4 text-sm font-semibold leading-6 text-sibs-primary-1">
                              Offer is still for review. The email button will be enabled after Raul Nadela and Haasanor both approve the offer in the Offers page.
                            </div>
                          )}

                        {isOfferApproved(candidate) && !candidate.offerEmailSent && (
                          <button
                            type="button"
                            onClick={() => onSendOfferEmail(candidate)}
                            className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-xl bg-sibs-primary-1 text-sm font-bold text-white transition hover:opacity-90"
                          >
                            <Mail size={16} />
                            Send Offer Email to Candidate
                          </button>
                        )}

                        {isOfferApproved(candidate) && (
                          <button
                            type="button"
                            onClick={() => window.open(buildOfferContractLink(candidate), "_blank", "noopener,noreferrer")}
                            className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-xl border border-blue-100 bg-blue-50 text-sm font-bold text-blue-700 transition hover:bg-blue-100"
                          >
                            <Eye size={16} />
                            Open Candidate Offer Link Manually
                          </button>
                        )}

                        {candidate.offerEmailSent && (
                          <div className="rounded-xl border border-[#E6ECF2] bg-white p-4">
                            <p className="text-xs font-bold uppercase tracking-wide text-sibs-tertiary-5">
                              Candidate Offer Response
                            </p>
                            <p className="mt-2 text-xs font-semibold leading-5 text-sibs-tertiary-5">
                              Use these buttons only when the candidate cannot access the email link or TA needs to record the response manually.
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
                  className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-red-200 bg-red-50 px-5 text-sm font-bold text-sibs-primary-1 transition hover:bg-red-100"
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
              !isOffered &&
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
                        className="w-full rounded-lg border border-cyan-100 bg-cyan-50 px-2 py-2 text-left text-xs font-semibold text-sibs-primary-1 transition hover:bg-cyan-100"
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
  const { user } = useUser();
  const { confirmAction, ConfirmationDialog } = useConfirmDialog();
  const currentUserName =
    user?.name ||
    user?.fullName ||
    user?.employeeName ||
    user?.displayName ||
    user?.username ||
    "Current User";
  const [candidateList, setCandidateList] = useState(defaultPipelineCandidates);
  const [hasLoadedStorage, setHasLoadedStorage] = useState(false);

  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("All Roles");
  const [accountFilter, setAccountFilter] = useState("All Accounts");
  const [activeStage, setActiveStage] = useState("Initial Screening");

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
    hiringRequirementId: "",
    roleTitle: "",
    account: "",
    basicPay: "",
    deminimisDailyRate: "",
    remarks: "",
  });

  const hideInterviewColumns =
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

  useEffect(() => {
    if (!hasLoadedStorage) return;

    const syncEvents = safeReadArray(PIPELINE_SYNC_EVENTS_KEY);
    if (!syncEvents.length) return;

    let changed = false;
    const nextCandidates = candidateList.map((candidate) => {
      const event = syncEvents.find((item) =>
        String(item.candidateApplicationId) === String(candidate.candidateApplicationId || candidate.id) ||
        String(item.candidateId || "") === String(candidate.candidateId || "") ||
        String(item.candidateEmail || "").toLowerCase() === String(candidate.email || "").toLowerCase()
      );

      if (!event) return candidate;
      changed = true;

      if (event.type === "offer_approval_update" || event.offerApprovals) {
        const approvalStatus = event.offerApprovalStatus || getOfferApprovalSummary({
          ...candidate,
          offerApprovals: event.offerApprovals || candidate.offerApprovals,
        });
        return normalizeCandidate({
          ...candidate,
          offerApprovals: event.offerApprovals || candidate.offerApprovals,
          offerApprovalStatus: approvalStatus,
          reasonForMovement: event.reasonForMovement || `Offer approval status updated to ${approvalStatus}.`,
          timeline: [
            ...(candidate.timeline || []),
            {
              stage: "Offered",
              owner: event.owner || currentUserName,
              source: "Offers Page",
              timestamp: event.timestamp || getCurrentTimestamp(),
              reason: event.reasonForMovement || `Offer approval status updated to ${approvalStatus}.`,
              remarks: event.remarks || "Approval update synced from Offers page.",
            },
          ],
        });
      }

      if (event.type === "offer_contract_sent") {
        return normalizeCandidate({
          ...candidate,
          offerEmailSent: true,
          offerEmailSentAt: event.timestamp || getCurrentTimestamp(),
          reasonForMovement: event.reasonForMovement || "Offer contract email was sent to the candidate.",
          timeline: [
            ...(candidate.timeline || []),
            {
              stage: "Offered",
              owner: event.owner || currentUserName,
              source: "Offer Contract",
              timestamp: event.timestamp || getCurrentTimestamp(),
              reason: event.reasonForMovement || "Offer contract email was sent to the candidate.",
              remarks: event.remarks || "Contract sent from Candidate Pipeline.",
            },
          ],
        });
      }

      if (event.status === "Negotiate" || event.status === "Negotiation") {
        return normalizeCandidate({
          ...candidate,
          offerDecision: "Negotiate",
          offerDecisionAt: event.timestamp || getCurrentTimestamp(),
          reasonForMovement: event.reasonForMovement || "Candidate requested offer negotiation.",
          timeline: [
            ...(candidate.timeline || []),
            {
              stage: "Offered",
              owner: event.owner || currentUserName,
              source: "Offer Contract",
              timestamp: event.timestamp || getCurrentTimestamp(),
              reason: event.reasonForMovement || "Candidate requested offer negotiation.",
              remarks: event.remarks || "Negotiation request synced from offer link.",
            },
          ],
        });
      }

      if (event.status === "Accepted" || event.toStage === "Accepted") {
        return normalizeCandidate({
          ...candidate,
          previousStage: candidate.currentStage,
          currentStage: "Accepted",
          offerApprovalStatus: "Approved",
          offerEmailSent: true,
          offerDecision: "Accepted",
          offerDecisionAt: event.timestamp,
          dateMoved: event.dateMoved || getCurrentDate(),
          reasonForMovement: event.reasonForMovement || "Candidate accepted the offer.",
          timeline: [
            ...(candidate.timeline || []),
            {
              stage: "Accepted",
              owner: event.owner || currentUserName,
              source: "Offers Page",
              timestamp: event.timestamp || getCurrentTimestamp(),
              reason: event.reasonForMovement || "Candidate accepted the offer.",
              remarks: event.remarks || "Accepted from candidate contract response.",
            },
          ],
        });
      }

      if (event.status === "Declined" || event.toStage === "Drop-off" || event.toStage === "Drop-offs") {
        return normalizeCandidate({
          ...candidate,
          previousStage: candidate.currentStage,
          currentStage: "Drop-off",
          offerDecision: "Rejected",
          offerDecisionAt: event.timestamp,
          dropOffCategory: event.dropOffCategory || "Offer Declined",
          dropOffReason: event.dropOffReason || event.reasonForMovement || "Candidate declined the offer.",
          dropOffRemarks: event.remarks || "Declined from candidate contract response.",
          dateMoved: event.dateMoved || getCurrentDate(),
          reasonForMovement: event.reasonForMovement || "Candidate declined the offer.",
          timeline: [
            ...(candidate.timeline || []),
            {
              stage: "Drop-off",
              owner: event.owner || currentUserName,
              source: "Offers Page",
              timestamp: event.timestamp || getCurrentTimestamp(),
              reason: event.reasonForMovement || "Candidate declined the offer.",
              remarks: event.dropOffReason || event.remarks || "Candidate declined the contract.",
            },
          ],
        });
      }

      return candidate;
    });

    if (changed) {
      setCandidateList(nextCandidates);
      savePipelineCandidateData(nextCandidates);
      safeWriteArray(PIPELINE_SYNC_EVENTS_KEY, []);
    }
  }, [candidateList, currentUserName, hasLoadedStorage]);


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
    syncTalentPoolFromPipelineApplication(normalizedCandidate);
  }

  async function handleUpdatePrfStatus(candidate, nextPrfStatus) {
    if (!(await confirmAction(`Set PRF status of ${candidate.name} to ${nextPrfStatus}?`))) {
      return;
    }

    const movementReason = `PRF status set to ${nextPrfStatus}.`;

    const updatedCandidate = {
      ...candidate,
      prfStatus: nextPrfStatus,
      prfReviewed: true,
      prfReviewedAt: getCurrentTimestamp(),
      currentStage: "Initial Screening",
      interviewDate: null,
      interviewType: "-",
      interviewStatus: "For Assessment",
      dateMoved: getCurrentDate(),
      reasonForMovement: movementReason,
      timeline: [
        ...(candidate.timeline || []),
        {
          stage: "Initial Screening",
          owner: currentUserName,
          source: "PRF Review",
          timestamp: getCurrentTimestamp(),
          reason: movementReason,
          remarks: `Match Type: ${nextPrfStatus}`,
        },
      ],
    };

    updateCandidateRecord(updatedCandidate);
    setSelectedCandidate(updatedCandidate);
    setActiveStage("Initial Screening");
  }

  async function handleOpenScheduleInterview(candidate) {
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

  async function handleCloseScheduleInterview() {
    setScheduleCandidate(null);
    setScheduleForm({
      interviewDate: "",
      interviewType: "",
      remarks: "",
    });
  }

  async function handleSubmitScheduleInterview(e) {
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

    if (!(await confirmAction(`${isUpdatingSchedule ? "Update" : "Save"} interview schedule for ${scheduleCandidate.name}?`))) {
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
            owner: currentUserName,
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
          owner: currentUserName,
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

  async function handleCancelInterview(candidate) {
    if (candidate.currentStage !== "Interview Scheduled") {
      alert("Only scheduled interviews can be cancelled.");
      return;
    }

    if (!(await confirmAction(`Cancel interview for ${candidate.name}?`))) {
      return;
    }

    const cancellationReason = window.prompt(
      `Enter cancellation reason for ${candidate.name}:`,
      candidate.cancellationReason || "Candidate requested to cancel the interview."
    );

    if (cancellationReason === null) return;

    const cleanedReason = cancellationReason.trim();

    if (!cleanedReason) {
      alert("Cancellation reason is required.");
      return;
    }

    const movementReason = `Interview was cancelled. Reason: ${cleanedReason}`;

    const updatedCandidate = {
      ...candidate,
      currentStage: "Interview Scheduled",
      previousStage: candidate.previousStage || "Online Assessment",
      dateMoved: getCurrentDate(),
      updatedAt: getCurrentDate(),
      interviewStatus: "Cancelled",
      cancellationReason: cleanedReason,
      reasonForMovement: movementReason,
      timeline: [
        ...(candidate.timeline || []),
        {
          stage: "Interview Scheduled",
          owner: candidate.owner,
          source: "Interview Cancellation",
          timestamp: getCurrentTimestamp(),
          reason: movementReason,
          remarks: cleanedReason,
        },
      ],
    };

    updateCandidateRecord(updatedCandidate);
    setSelectedCandidate(updatedCandidate);
    setActiveStage("Interview Scheduled");
  }

  async function handleCompleteInterview(candidate) {
    if (!hasInterviewSchedule(candidate)) {
      alert("Create the interview schedule first.");
      return;
    }

    if (!(await confirmAction(`Mark interview as completed for ${candidate.name}?`))) {
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
          owner: currentUserName,
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


  async function handleSaveInterviewNotes(candidate, notes) {
    if (!(await confirmAction(`Save interview notes for ${candidate.name}?`))) {
      return;
    }

    const updatedCandidate = {
      ...candidate,
      interviewNotes: String(notes || "").trim(),
      interviewNotesUpdatedAt: getCurrentTimestamp(),
      interviewNotesUpdatedBy: currentUserName,
      timeline: [
        ...(candidate.timeline || []),
        {
          stage: candidate.currentStage,
          owner: currentUserName,
          source: "Interview Notes",
          timestamp: getCurrentTimestamp(),
          reason: "TA interview notes were updated.",
          remarks: String(notes || "").trim(),
        },
      ],
    };

    updateCandidateRecord(updatedCandidate);
    setSelectedCandidate(updatedCandidate);
  }

  async function handleOpenOfferModal(candidate) {
    if (candidate.currentStage !== "Interviewed") {
      alert("Offer details can only be prepared after the interview is completed.");
      return;
    }

    const offerDetails = candidate.offerDetails || {};

    setOfferCandidate(candidate);
    const currentRoleTitle = getRoleTitle(candidate.roleAccount);
    const currentAccount = getAccount(candidate.roleAccount);

    setOfferForm({
      hiringRequirementId: offerDetails.hiringRequirementId || candidate.hiringRequirementId || "",
      roleTitle:
        offerDetails.roleTitle ||
        (currentRoleTitle === "Not assigned yet" ? "" : currentRoleTitle),
      account:
        offerDetails.account ||
        (currentAccount === "Not assigned yet" ? "" : currentAccount),
      basicPay: offerDetails.basicPay || "",
      deminimisDailyRate: offerDetails.deminimisDailyRate || "",
      remarks: "",
    });
  }

  async function handleCloseOfferModal() {
    setOfferCandidate(null);
    setOfferForm({
      hiringRequirementId: "",
      roleTitle: "",
      account: "",
        basicPay: "",
      deminimisDailyRate: "",
      remarks: "",
    });
  }

  async function handleSubmitOfferDetails(e) {
    e.preventDefault();

    if (!offerCandidate) return;

    if (
      !offerForm.hiringRequirementId ||
      !offerForm.roleTitle ||
      !offerForm.account ||
      !offerForm.basicPay ||
      !offerForm.deminimisDailyRate
    ) {
      alert("Hiring requirement, final role, final account, basic pay, and deminimis / daily rate are required.");
      return;
    }

    if (!(await confirmAction(`Proceed with offer assignment for ${offerCandidate.name}?`))) {
      return;
    }

    const movementReason =
      "Interview completed. Offer details prepared and sent for approval of Raul Nadela and Haasanor.";

    const updatedCandidate = {
      ...offerCandidate,
      previousStage: offerCandidate.currentStage,
      currentStage: "Offered",
      dateMoved: getCurrentDate(),
      hiringRequirementId: offerForm.hiringRequirementId,
      roleTitle: offerForm.roleTitle,
      account: offerForm.account,
      roleAccount: `${offerForm.roleTitle} - ${offerForm.account}`,
      offerDetails: {
        hiringRequirementId: offerForm.hiringRequirementId,
        roleTitle: offerForm.roleTitle,
        account: offerForm.account,
        basicPay: Number(offerForm.basicPay),
        deminimisDailyRate: Number(offerForm.deminimisDailyRate),
        preparedAt: getCurrentTimestamp(),
        preparedBy: currentUserName,
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
          owner: currentUserName,
          source: "Offer Approval",
          timestamp: getCurrentTimestamp(),
          reason: movementReason,
          remarks:
            offerForm.remarks.trim() ||
            `Hiring Requirement: ${offerForm.hiringRequirementId}, Final Role: ${offerForm.roleTitle}, Final Account: ${offerForm.account}, Basic Pay: ${formatCurrency(offerForm.basicPay)}, Deminimis / Daily Rate: ${formatCurrency(offerForm.deminimisDailyRate)}`,
        },
      ],
    };

    updateCandidateRecord(updatedCandidate);
    upsertOfferEligibleCandidate(updatedCandidate);
    setSelectedCandidate(updatedCandidate);
    setActiveStage("Offered");
    handleCloseOfferModal();
  }

  async function handleUpdateOfferApproval(candidate, approver, status) {
    if (candidate.currentStage !== "Offered") return;

    if (!(await confirmAction(`Set ${approver} offer approval to ${status} for ${candidate.name}?`))) {
      return;
    }

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

    if (!(await confirmAction(`Send offer contract email for ${candidate.name}?`))) {
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
          owner: currentUserName,
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

  async function handleOfferDecision(candidate, decision) {
    if (!candidate.offerEmailSent) {
      alert("Send the approved contract email first before recording the lead response.");
      return;
    }

    if (!(await confirmAction(`Record candidate response as ${decision} for ${candidate.name}?`))) {
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
      upsertOfferRecordFromPipeline(updatedCandidate);
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
          owner: currentUserName,
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

  async function handleOpenMoveModal(candidate) {
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

  async function handleCloseMoveModal() {
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

    if (!(await confirmAction(`Move ${moveCandidate.name} from ${moveCandidate.currentStage} to ${nextStage}?`))) {
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
          owner: currentUserName,
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

  async function handleOpenAssessmentModal(candidate) {
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

  async function handleCloseAssessmentModal() {
    setAssessmentCandidate(null);
    setAssessmentForm({
      assessmentStatus: "Not Take",
      assessmentResult: "",
      assessmentRemarks: "",
    });
  }

  async function handleSendAssessmentEmail(candidate) {
    if (!(await confirmAction(`Send assessment email to ${candidate.name}?`))) {
      return;
    }

    const updatedCandidate = {
      ...candidate,
      assessmentEmailSent: true,
      assessmentEmailSentAt: getCurrentTimestamp(),
      timeline: [
        ...(candidate.timeline || []),
        {
          stage: candidate.currentStage,
          owner: currentUserName,
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

  async function handleSubmitAssessment(e) {
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

    if (!(await confirmAction(`Save assessment update for ${assessmentCandidate.name}?`))) {
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
          owner: currentUserName,
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

  async function handleOpenDropOffModal(candidate) {
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

  async function handleCloseDropOffModal() {
    setDropOffCandidate(null);
    setDropOffForm({
      category: "",
      reason: "",
      remarks: "",
    });
  }

  async function handleSubmitDropOff(e) {
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

    if (!(await confirmAction(`Move ${dropOffCandidate.name} to Drop-off?`))) {
      return;
    }

    const movementReason = `Candidate moved from ${dropOffCandidate.currentStage} to Drop-off. Reason: ${dropOffForm.reason.trim()}`;

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
          owner: currentUserName,
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
          candidate.interviewStatus !== "Completed"
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
    setActiveStage("Initial Screening");
    setSelectedCandidate(null);

    confirmAction("Sample candidate pipeline data has been reset.", { title: "Reset Complete", confirmText: "OK", variant: "default" });
  }


  return (
    <div className="flex h-full min-h-0 min-w-0 flex-1 flex-col overflow-hidden bg-sibs-tertiary-10 font-jakarta">
      <Header />

      <main className="min-h-0 min-w-0 flex-1 overflow-y-auto overflow-x-hidden bg-sibs-tertiary-10 p-4 sm:p-6">
        <div className="mx-auto max-w-[1600px] space-y-5">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
            <div className="min-w-0">
              <div className="inline-flex items-center gap-2 rounded-full border border-blue-100 bg-blue-50 px-3 py-1 text-xs font-extrabold uppercase tracking-wide text-sibs-primary-1">
                <ClipboardCheck size={14} />
                Candidate Pipeline
              </div>

              <h1 className="mt-3 text-2xl font-extrabold text-sibs-primary-1 sm:text-3xl">
                Candidate Pipeline
              </h1>

              <p className="mt-1 text-sm font-medium text-sibs-tertiary-5">
                Track candidates from Initial Screening to Accepted. Final role, hiring requirement, and account are assigned during the offer stage.
              </p>
            </div>

            <div className="flex flex-col gap-2 sm:flex-row">
              <button
                type="button"
                onClick={handleResetSampleData}
                className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-[#D6DEE8] bg-white px-5 text-sm font-bold text-sibs-primary-1 transition hover:bg-[#F8FAFC]"
              >
                <RotateCcw size={18} />
                Reset Sample Data
              </button>
            </div>
          </div>

          <section className="rounded-xl border border-[#E6ECF2] bg-white p-4 shadow-sm sm:p-5">
            <h2 className="text-base font-bold text-[#101828]">Pipeline Summary</h2>

            <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-6">
              <DashboardMetric label="Initial Screening" value={metrics.initialScreening} icon={UserCheck} description="PRF reviewed" />
              <DashboardMetric label="Online Assessment" value={metrics.onlineAssessment} icon={ClipboardCheck} description="Assessment stage" />
              <DashboardMetric label="Interview Scheduled" value={metrics.interviewScheduled} icon={CalendarDays} description="Calendar booked" />
              <DashboardMetric label="Interviewed" value={metrics.interviewed} icon={ShieldCheck} description="Interview done" />
              <DashboardMetric label="Offered" value={metrics.offered} icon={BriefcaseBusiness} description="Offer processing" />
              <DashboardMetric label="Accepted" value={metrics.accepted} icon={UserCheck} description="Converted" valueClassName="text-emerald-600" />
            </div>
          </section>

          <section className="overflow-hidden rounded-2xl border border-[#D9E2EC] bg-white shadow-sm">
            <div className="overflow-x-auto border-b border-[#E6ECF2] bg-white">
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

            <div className="border-b border-[#E6ECF2] p-4 sm:p-5">
              <div className="grid grid-cols-1 gap-3 xl:grid-cols-[1fr_220px_220px_auto] xl:items-end">
                <div>
                  <label className="mb-1 block text-sm font-bold text-[#101828]">Search</label>
                  <div className="relative">
                    <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-sibs-tertiary-5" />
                    <input
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      placeholder="Search candidate, PRF, assessment, role, account..."
                      className="h-12 w-full rounded-xl border border-[#D0D5DD] bg-white px-4 pl-11 text-sm font-semibold text-sibs-primary-1 outline-none transition placeholder:text-sibs-tertiary-5 focus:border-sibs-primary-1 focus:ring-4 focus:ring-sibs-primary-1/10"
                    />
                  </div>
                </div>

                <div>
                  <label className="mb-1 block text-sm font-bold text-[#101828]">Role</label>
                  <select
                    value={roleFilter}
                    onChange={(e) => setRoleFilter(e.target.value)}
                    className="h-12 w-full rounded-xl border border-[#D0D5DD] bg-white px-4 text-sm font-bold text-[#344054] outline-none transition focus:border-sibs-primary-1 focus:ring-4 focus:ring-sibs-primary-1/10"
                  >
                    {roleOptions.map((role) => (
                      <option key={role} value={role}>
                        {role}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="mb-1 block text-sm font-bold text-[#101828]">Account</label>
                  <select
                    value={accountFilter}
                    onChange={(e) => setAccountFilter(e.target.value)}
                    className="h-12 w-full rounded-xl border border-[#D0D5DD] bg-white px-4 text-sm font-bold text-[#344054] outline-none transition focus:border-sibs-primary-1 focus:ring-4 focus:ring-sibs-primary-1/10"
                  >
                    {accountOptions.map((account) => (
                      <option key={account} value={account}>
                        {account}
                      </option>
                    ))}
                  </select>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setSearch("");
                    setRoleFilter("All Roles");
                    setAccountFilter("All Accounts");
                  }}
                  className="inline-flex h-12 items-center justify-center gap-2 rounded-xl border border-[#D6DEE8] bg-white px-5 text-sm font-bold text-sibs-primary-1 transition hover:bg-[#F8FAFC]"
                >
                  <Filter size={17} />
                  Clear
                </button>
              </div>
            </div>

            <div className="p-4 sm:p-6">
              <div className="hidden lg:block">
                <div className="overflow-x-auto p-0">
                  <table className="w-full min-w-[1500px] border-separate border-spacing-0 overflow-hidden rounded-2xl border border-[#D9E2EC] text-left">
                    <thead>
                      <tr className="bg-[#F5F7FA] text-xs font-bold uppercase tracking-wide text-[#174A7C]">
                      <th className="px-5 py-4 first:rounded-tl-2xl">Candidate</th>
                      <th className="px-5 py-4">Role / Position</th>
                      <th className="px-5 py-4">Account</th>
                      <th className="px-5 py-4">PRF Status</th>

                      {showAssessmentStatusColumn && (
                        <th className="px-5 py-4">Assessment</th>
                      )}

                      {showAssessmentResultColumn && (
                        <th className="px-5 py-4">Assessment Result</th>
                      )}

                      {!hideInterviewColumns && (
                        <>
                          <th className="px-5 py-4">Interview Date</th>
                          <th className="px-5 py-4">Interview Type</th>
                        </>
                      )}

                      {showStatusColumn && (
                        <th className="px-5 py-4">Status</th>
                      )}

                      {(activeStage === "Offered" || activeStage === "Accepted") && (
                        <>
                          <th className="px-5 py-4">Offer Account</th>
                          <th className="px-5 py-4">Approval</th>
                          <th className="px-5 py-4">Lead Response</th>
                        </>
                      )}

                      <th className="px-5 py-4 text-right last:rounded-tr-2xl">Actions</th>
                    </tr>
                  </thead>

                    <tbody>
                    {stageFilteredCandidates.length > 0 ? (
                      stageFilteredCandidates.map((candidate) => {
                        const rowStatus = getDisplayInterviewStatus(candidate);

                        return (
                          <tr
                            key={candidate.id}
                            className="cursor-pointer transition hover:bg-[#FAFBFC]"
                            onClick={() => setSelectedCandidate(candidate)}
                          >
                            <td className="border-b border-[#E6ECF2] px-5 py-5">
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

                            <td className="border-b border-[#E6ECF2] px-5 py-5 text-sm font-bold text-[#344054]">
                              {getRoleTitle(candidate.roleAccount)}
                            </td>

                            <td className="border-b border-[#E6ECF2] px-5 py-5 text-sm font-semibold text-[#344054]">
                              {getAccount(candidate.roleAccount)}
                            </td>

                            <td className="border-b border-[#E6ECF2] px-5 py-5">
                              <span
                                className={`inline-flex rounded-full border px-3 py-1 text-xs font-bold ${getPrfStatusClass(
                                  candidate.prfStatus || "Review"
                                )}`}
                              >
                                {candidate.prfStatus || "Review"}
                              </span>
                            </td>

                            {showAssessmentStatusColumn && (
                              <td className="border-b border-[#E6ECF2] px-5 py-5">
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
                              <td className="border-b border-[#E6ECF2] px-5 py-5">
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
                                <td className="border-b border-[#E6ECF2] px-5 py-5 text-sm font-semibold text-[#344054]">
                                  {formatDateTime(candidate.interviewDate)}
                                </td>

                                <td className="border-b border-[#E6ECF2] px-5 py-5 text-sm font-semibold text-[#344054]">
                                  {getDisplayInterviewType(candidate)}
                                </td>
                              </>
                            )}

                            {showStatusColumn && (
                              <td className="border-b border-[#E6ECF2] px-5 py-5">
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
                                <td className="border-b border-[#E6ECF2] px-5 py-5 text-sm font-semibold text-[#344054]">
                                  {candidate.offerDetails?.account || "—"}
                                </td>
                                <td className="border-b border-[#E6ECF2] px-5 py-5">
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
                                <td className="border-b border-[#E6ECF2] px-5 py-5">
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

                            <td className="border-b border-[#E6ECF2] px-5 py-5 text-right">
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
                                      className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-red-100 bg-red-50 text-sibs-primary-1 transition hover:bg-red-100"
                                      title="Cancel Interview"
                                    >
                                      <X size={16} />
                                    </button>
                                  </>
                                )}

                                {candidate.currentStage !== "Initial Screening" &&
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

              <div className="space-y-3 lg:hidden">
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

              <div className="mt-5 flex flex-col justify-between gap-4 md:flex-row md:items-center">
                <p className="text-sm font-semibold text-sibs-tertiary-5">
                  Showing {stageFilteredCandidates.length} of {stageVisibleCandidates.length} candidate applications
                </p>

                <div className="flex items-center gap-2">
                  <button type="button" className="flex h-9 w-9 items-center justify-center rounded-lg border border-[#E6ECF2] text-gray-500 transition hover:bg-gray-50">
                    <ChevronLeft size={16} />
                  </button>
                  <button type="button" className="flex h-9 w-9 items-center justify-center rounded-lg bg-sibs-primary-1 text-sm font-bold text-white">
                    1
                  </button>
                  <button type="button" className="flex h-9 w-9 items-center justify-center rounded-lg border border-[#E6ECF2] text-gray-500 transition hover:bg-gray-50">
                    <ChevronRight size={16} />
                  </button>
                </div>
              </div>
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
        onSaveInterviewNotes={handleSaveInterviewNotes}
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
      {ConfirmationDialog}
    </div>
  );
}
