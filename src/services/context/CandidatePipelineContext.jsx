import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

import { useUser } from "./UserContext";

import api from "../../lib/axios/api-template";

import { pipelineStages } from "../../lib/utils/candidatePipeline/candidatePipelineConstants";

import {
  toDateInputValue,
  formatCurrency,
} from "../../lib/utils/candidatePipeline/candidatePipelineFormatters";

import StatusModal from "../../components/modals/StatusModal";

import {
  normalizeCandidate,
  getCandidateStage,
  getRoleTitle,
  getAccount,
  cleanAssignmentValue,
  getNextStage,
  canMoveToOnlineAssessment,
  canScheduleInterview,
  canUpdateInterviewSchedule,
  hasInterviewSchedule,
  isOfferApproved,
  triggerAssessmentEmail,
  triggerOfferEmail,
  buildAssessmentLink,
  buildOfferContractLink,
  getFridayOfCurrentWeek,
  formatNhoScheduleDate,
} from "../../lib/utils/candidatePipeline/candidatePipelineHelpers";

import {
  getCandidatePipelineRecordId,
  isSameCandidatePipelineRecord,
  mergeCandidatePipelineRecord,
} from "../../lib/utils/candidatePipeline/candidatePipelineIdentity";

import { useConfirmDialog } from "../../components/layout/common/ConfirmationModal";
import { generateEmploymentOfferPdf } from "../../lib/utils/candidatePipeline/employmentOfferPdf";
import { STATIC_PIPELINE_CANDIDATES } from "../../lib/utils/candidatePipeline/mockPipelineCandidates";

const CandidatePipelineContext = createContext(null);

const INCOMPLETE_REQUIREMENTS_STAGE =
  "For Onboarding - Incomplete Requirements";
const ONBOARDING_STAGE = "Onboarding";
const HIRED_ACTIVE_STAGE = "Hired / Active";

const emptyMoveForm = {
  reason: "",
  remarks: "",
  nextStage: "",
  targetStage: "",
  stage: "",
};

const emptyScheduleForm = {
  interviewDate: "",
  interviewType: "",
  onlineInterviewLink: "",
  remarks: "",
};

const emptyAssessmentForm = {
  assessmentStatus: "Not Take",
  assessmentResult: "",
  assessmentRemarks: "",
  assessmentFileName: "",
  assessmentFileUrl: "",
  assessmentFileType: "",
  assessmentFileSize: "",
  assessmentAttachmentName: "",
  assessmentAttachmentUrl: "",
  assessmentAttachmentType: "",
  assessmentAttachmentSize: "",
};

const emptyDropOffForm = {
  category: "",
  reason: "",
  remarks: "",
};

const emptyOfferForm = {
  hiringRequirementId: "",
  roleTitle: "",
  account: "",
  basicPay: "",
  deminimisDailyRate: "",
  startDate: "",
  remarks: "",
};

function cleanText(value) {
  return String(value ?? "").trim();
}

function normalizeStageKey(value) {
  return cleanText(value)
    .toLowerCase()
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ");
}

function normalizePipelineStageName(value, fallback = "Initial Screening") {
  const text = cleanText(value);

  if (!text) return fallback;

  const key = normalizeStageKey(text);

  if (
    key === "incomplete requirements" ||
    key === "for incomplete requirements" ||
    key === "for onboarding incomplete requirements" ||
    key === "for onboarding requirements incomplete" ||
    key === "for onboarding with incomplete requirements"
  ) {
    return INCOMPLETE_REQUIREMENTS_STAGE;
  }

  if (key === "onboarding" || key === "for onboarding") {
    return ONBOARDING_STAGE;
  }

  if (
    key === "hired" ||
    key === "hired active" ||
    key === "hired / active" ||
    key === "active"
  ) {
    return HIRED_ACTIVE_STAGE;
  }

  if (key === "drop off" || key === "drop offs" || key === "dropoff") {
    return "Drop-off";
  }

  return text;
}

function normalizePrfStatus(value) {
  const text = cleanText(value);

  if (!text) return "Review";

  const key = text.toLowerCase();

  if (
    key === "matched" ||
    key === "match" ||
    key === "prf matched" ||
    key === "approved"
  ) {
    return "Matched";
  }

  if (
    key === "not matched" ||
    key === "unmatched" ||
    key === "not_match" ||
    key === "not-match"
  ) {
    return "Not Matched";
  }

  if (
    key === "review" ||
    key === "for review" ||
    key === "pending" ||
    key === "prf review"
  ) {
    return "Review";
  }

  return text;
}

function getCandidatePrfStatus(candidate = {}) {
  return normalizePrfStatus(
    candidate.prfStatus ||
      candidate.prf_status ||
      candidate.prfReviewStatus ||
      candidate.prf_review_status ||
      candidate.prf ||
      candidate.candidateSnapshot?.prfStatus ||
      candidate.candidateSnapshot?.prf_status ||
      "Review",
  );
}

function getCandidateOfferApprovalStatus(candidate = {}) {
  return cleanText(
    candidate.latestOfferVersion?.approvalStatus ||
      candidate.latestOfferVersion?.approval_status ||
      candidate.offerApprovalStatus ||
      candidate.offer_approval_status ||
      candidate.offerRevisionStatus ||
      candidate.offer_revision_status ||
      "",
  ).toLowerCase();
}

function toBooleanFlag(value, fallback = false) {
  if (value === true || value === false) return value;

  if (value === 1 || value === "1") return true;
  if (value === 0 || value === "0") return false;

  const text = cleanText(value).toLowerCase();

  if (["true", "yes", "y"].includes(text)) return true;
  if (["false", "no", "n"].includes(text)) return false;

  return fallback;
}

function getErrorMessage(error, fallback) {
  return (
    error?.response?.data?.message ||
    error?.response?.data?.error ||
    error?.message ||
    fallback
  );
}

function apiErrorResponse(error, fallback, data = null) {
  return {
    success: false,
    data,
    candidate: null,
    message: getErrorMessage(error, fallback),
  };
}

function getLoggedInUserIdentifier(user) {
  return cleanText(
    user?.id ||
      user?.userId ||
      user?.sibs_id ||
      user?.sibsId ||
      user?.userCode ||
      user?.username ||
      user?.email ||
      user?.fullName ||
      user?.name,
  );
}

/* ================================
   LOCAL API FUNCTIONS
================================ */

async function getCandidatePipelineCandidates(params = {}) {
  try {
    const res = await api.get("/api/candidate-pipeline", {
      params: {
        limit: 500,
        _t: Date.now(),
        ...params,
      },
      withCredentials: true,
    });

    return res.data;
  } catch (error) {
    console.error(
      "Axios getCandidatePipelineCandidates API error:",
      error?.response?.status,
      error?.response?.data || error?.message,
    );

    return {
      success: false,
      data: [],
      candidates: [],
      stageCounts: {},
      metrics: {},
      message: getErrorMessage(error, "Failed to load candidate pipeline."),
    };
  }
}

async function moveCandidatePipelineStage(id, payload = {}) {
  try {
    const res = await api.post(`/api/candidate-pipeline/${id}/move`, payload, {
      withCredentials: true,
    });

    return res.data;
  } catch (error) {
    console.error(
      "Axios moveCandidatePipelineStage API error:",
      error?.response?.status,
      error?.response?.data || error?.message,
    );

    return apiErrorResponse(error, "Failed to move candidate.");
  }
}

async function updateCandidatePipelinePrfStatus(id, payload = {}) {
  try {
    const res = await api.post(
      `/api/candidate-pipeline/${id}/prf-status`,
      payload,
      {
        withCredentials: true,
      },
    );

    return res.data;
  } catch (error) {
    console.error(
      "Axios updateCandidatePipelinePrfStatus API error:",
      error?.response?.status,
      error?.response?.data || error?.message,
    );

    return apiErrorResponse(error, "Failed to update PRF status.");
  }
}

async function scheduleCandidatePipelineInterview(id, payload = {}) {
  try {
    const res = await api.post(
      `/api/candidate-pipeline/${id}/schedule-interview`,
      payload,
      {
        withCredentials: true,
      },
    );

    return res.data;
  } catch (error) {
    console.error(
      "Axios scheduleCandidatePipelineInterview API error:",
      error?.response?.status,
      error?.response?.data || error?.message,
    );

    return apiErrorResponse(error, "Failed to schedule interview.");
  }
}

async function startCandidatePipelineInterview(id, payload = {}) {
  try {
    const res = await api.post(
      `/api/candidate-pipeline/${id}/interview/start`,
      payload,
      {
        withCredentials: true,
      },
    );

    return res.data;
  } catch (error) {
    console.error(
      "Axios startCandidatePipelineInterview API error:",
      error?.response?.status,
      error?.response?.data || error?.message,
    );

    return apiErrorResponse(error, "Failed to start interview.");
  }
}

async function completeCandidatePipelineInterview(id, payload = {}) {
  try {
    const res = await api.post(
      `/api/candidate-pipeline/${id}/interview/complete`,
      payload,
      {
        withCredentials: true,
      },
    );

    return res.data;
  } catch (error) {
    console.error(
      "Axios completeCandidatePipelineInterview API error:",
      error?.response?.status,
      error?.response?.data || error?.message,
    );

    return apiErrorResponse(error, "Failed to complete interview.");
  }
}


async function submitCandidatePipelineFinalInterview(id, payload = {}) {
  try {
    const res = await api.post(
      `/api/candidate-pipeline/${id}/final-interview/submit`,
      payload,
      {
        withCredentials: true,
      },
    );

    return res.data;
  } catch (error) {
    console.error(
      "Axios submitCandidatePipelineFinalInterview API error:",
      error?.response?.status,
      error?.response?.data || error?.message,
    );

    return apiErrorResponse(error, "Failed to submit final interview.");
  }
}

async function cancelCandidatePipelineInterview(id, payload = {}) {
  try {
    const res = await api.post(
      `/api/candidate-pipeline/${id}/interview/cancel`,
      payload,
      {
        withCredentials: true,
      },
    );

    return res.data;
  } catch (error) {
    console.error(
      "Axios cancelCandidatePipelineInterview API error:",
      error?.response?.status,
      error?.response?.data || error?.message,
    );

    return apiErrorResponse(error, "Failed to cancel interview.");
  }
}

async function saveCandidatePipelineInterviewNotes(id, payload = {}) {
  try {
    const res = await api.post(
      `/api/candidate-pipeline/${id}/interview/notes`,
      payload,
      {
        withCredentials: true,
      },
    );

    return res.data;
  } catch (error) {
    console.error(
      "Axios saveCandidatePipelineInterviewNotes API error:",
      error?.response?.status,
      error?.response?.data || error?.message,
    );

    return apiErrorResponse(error, "Failed to save interview notes.");
  }
}

async function sendCandidatePipelineAssessmentEmail(id, payload = {}) {
  try {
    const res = await api.post(
      `/api/candidate-pipeline/${id}/assessment/send-email`,
      payload,
      {
        withCredentials: true,
      },
    );

    return res.data;
  } catch (error) {
    console.error(
      "Axios sendCandidatePipelineAssessmentEmail API error:",
      error?.response?.status,
      error?.response?.data || error?.message,
    );

    return apiErrorResponse(error, "Failed to send assessment email.");
  }
}

async function saveCandidatePipelineAssessment(id, payload = {}) {
  try {
    const res = await api.post(
      `/api/candidate-pipeline/${id}/assessment`,
      payload,
      {
        withCredentials: true,
      },
    );

    return res.data;
  } catch (error) {
    console.error(
      "Axios saveCandidatePipelineAssessment API error:",
      error?.response?.status,
      error?.response?.data || error?.message,
    );

    return apiErrorResponse(error, "Failed to save assessment.");
  }
}

async function dropOffCandidatePipelineCandidate(id, payload = {}) {
  try {
    const res = await api.post(
      `/api/candidate-pipeline/${id}/drop-off`,
      payload,
      {
        withCredentials: true,
      },
    );

    return res.data;
  } catch (error) {
    console.error(
      "Axios dropOffCandidatePipelineCandidate API error:",
      error?.response?.status,
      error?.response?.data || error?.message,
    );

    return apiErrorResponse(error, "Failed to mark candidate as drop-off.");
  }
}

async function resendCandidatePipelineDropOffEmail(id) {
  try {
    const res = await api.post(
      `/api/candidate-pipeline/${encodeURIComponent(id)}/drop-off-email/resend`,
      {},
      { withCredentials: true },
    );

    return res.data;
  } catch (error) {
    console.error(
      "Axios resendCandidatePipelineDropOffEmail API error:",
      error?.response?.status,
      error?.response?.data || error?.message,
    );

    return apiErrorResponse(error, "Failed to resend the Drop-off email.");
  }
}

async function saveCandidatePipelineOffer(id, payload = {}) {
  try {
    const res = await api.post(`/api/candidate-pipeline/${id}/offer`, payload, {
      withCredentials: true,
    });

    return res.data;
  } catch (error) {
    console.error(
      "Axios saveCandidatePipelineOffer API error:",
      error?.response?.status,
      error?.response?.data || error?.message,
    );

    return apiErrorResponse(error, "Failed to save offer details.");
  }
}

async function reprofileCandidatePipelineAccount(id, payload = {}) {
  try {
    const res = await api.post(
      `/api/candidate-pipeline/${id}/reprofile-account`,
      payload,
      { withCredentials: true },
    );
    return res.data;
  } catch (error) {
    console.error(
      "Axios reprofileCandidatePipelineAccount API error:",
      error?.response?.status,
      error?.response?.data || error?.message,
    );
    return apiErrorResponse(error, "Failed to reprofile candidate account.");
  }
}

async function updateCandidatePipelineOfferApproval(id, payload = {}) {
  try {
    const res = await api.post(
      `/api/candidate-pipeline/${id}/offer-approval`,
      payload,
      {
        withCredentials: true,
      },
    );

    return res.data;
  } catch (error) {
    console.error(
      "Axios updateCandidatePipelineOfferApproval API error:",
      error?.response?.status,
      error?.response?.data || error?.message,
    );

    return apiErrorResponse(error, "Failed to update offer approval.");
  }
}

async function sendCandidatePipelineOfferEmail(id, payload = {}) {
  try {
    const res = await api.post(
      `/api/candidate-pipeline/${id}/offer-send-email`,
      payload,
      {
        withCredentials: true,
      },
    );

    return res.data;
  } catch (error) {
    console.error(
      "Axios sendCandidatePipelineOfferEmail API error:",
      error?.response?.status,
      error?.response?.data || error?.message,
    );

    return apiErrorResponse(error, "Failed to send offer email.");
  }
}

async function saveCandidatePipelineOfferDecision(id, payload = {}) {
  try {
    const res = await api.post(
      `/api/candidate-pipeline/${id}/offer-decision`,
      payload,
      {
        withCredentials: true,
      },
    );

    return res.data;
  } catch (error) {
    console.error(
      "Axios saveCandidatePipelineOfferDecision API error:",
      error?.response?.status,
      error?.response?.data || error?.message,
    );

    return apiErrorResponse(error, "Failed to save offer decision.");
  }
}

async function scheduleCandidatePipelineNho(id, payload = {}) {
  try {
    const res = await api.post(
      `/api/candidate-pipeline/${id}/nho/schedule`,
      payload,
      {
        withCredentials: true,
      },
    );

    return res.data;
  } catch (error) {
    console.error(
      "Axios scheduleCandidatePipelineNho API error:",
      error?.response?.status,
      error?.response?.data || error?.message,
    );

    return apiErrorResponse(error, "Failed to schedule NHO.");
  }
}

function getApiCandidate(response) {
  return response?.data || response?.candidate || null;
}

function isSamePipelineCandidate(
  candidateA = {},
  candidateB = {},
) {
  return isSameCandidatePipelineRecord(
    candidateA,
    candidateB,
  );
}

function getCandidateRecordId(candidate = {}) {
  return getCandidatePipelineRecordId(candidate);
}

function normalizeRoleAccount(roleTitle, account) {
  const role = cleanAssignmentValue(roleTitle);
  const accountName = cleanAssignmentValue(account);

  return [role, accountName].filter(Boolean).join(" - ");
}

function firstAssignmentValue(...values) {
  for (const value of values) {
    const cleaned = cleanAssignmentValue(value);
    if (cleaned) return cleaned;
  }

  return "";
}

function normalizePipelineCandidateForBoard(candidate = {}) {
  const currentStage = normalizePipelineStageName(
    candidate.currentStage ||
      candidate.currentPipelineStage ||
      candidate.pipelineStage ||
      candidate.stage ||
      candidate.current_stage ||
      "Initial Screening",
  );

  const roleTitle = firstAssignmentValue(
    candidate.roleTitle,
    candidate.role_title,
    candidate.currentAppliedRole,
    candidate.current_applied_role,
    candidate.openPosition,
    candidate.open_position,
    candidate.roleCapability,
    getRoleTitle(candidate.roleAccount || candidate.role_account),
  );

  const account = firstAssignmentValue(
    candidate.account,
    candidate.currentAppliedAccount,
    candidate.current_applied_account,
    candidate.leadAccount,
    candidate.lead_account,
    candidate.accountFit,
    candidate.account_fit,
    getAccount(candidate.roleAccount || candidate.role_account),
  );

  const roleAccount = normalizeRoleAccount(roleTitle, account);

  const prfStatus = getCandidatePrfStatus(candidate);

  const prfReviewed = toBooleanFlag(
    candidate.prfReviewed ?? candidate.prf_reviewed,
    prfStatus === "Matched",
  );

  /*
   * Preserve the real candidate_pipeline primary key before normalizeCandidate
   * reshapes the public/application identifiers used by the board.
   */
  const pipelineRecordId = cleanText(
    getCandidatePipelineRecordId(candidate),
  );

  const normalizedCandidate = normalizeCandidate({
    ...candidate,

    currentStage,
    currentPipelineStage: currentStage,
    stage: currentStage,
    pipelineStage: currentStage,

    applicationStatus:
      candidate.applicationStatus ||
      candidate.application_status ||
      "Active",

    pipelineStatus:
      candidate.pipelineStatus || candidate.pipeline_status || "Active",

    prfStatus,
    prf_status: prfStatus,
    prfReviewed,
    prf_reviewed: prfReviewed,
    prfReviewedAt:
      candidate.prfReviewedAt || candidate.prf_reviewed_at || null,

    assessmentStatus:
      candidate.assessmentStatus ||
      candidate.assessment_status ||
      "Not Take",

    assessmentResult:
      candidate.assessmentResult || candidate.assessment_result || "",

    interviewStatus:
      candidate.interviewStatus ||
      candidate.interview_status ||
      "For Assessment",

    roleTitle,
    currentAppliedRole: candidate.currentAppliedRole || roleTitle,
    openPosition: candidate.openPosition || roleTitle,
    roleCapability: candidate.roleCapability || roleTitle,

    account,
    currentAppliedAccount: candidate.currentAppliedAccount || account,
    leadAccount: candidate.leadAccount || account,
    accountFit: candidate.accountFit || account,
    roleAccount,

    contactNumber:
      candidate.contactNumber ||
      candidate.phone ||
      candidate.phoneNumber1 ||
      candidate.phone_number_1 ||
      "",

    candidateSnapshot: {
      ...(candidate.candidateSnapshot || {}),
      candidateId:
        candidate.candidateId ||
        candidate.candidate_id ||
        candidate.candidateSnapshot?.candidateId,
      name:
        candidate.name ||
        candidate.candidateName ||
        candidate.candidate_name ||
        candidate.candidateSnapshot?.name ||
        "Unnamed Candidate",
      email: candidate.email || candidate.candidateSnapshot?.email || "",
      roleTitle,
      account,
      roleAccount,
      prfStatus,
      prf_status: prfStatus,
      currentStage,
      currentPipelineStage: currentStage,
      pipelineStage: currentStage,
      pipelineStatus:
        candidate.pipelineStatus || candidate.pipeline_status || "Active",
      movedToPipeline: true,
    },
  });

  if (!pipelineRecordId) {
    return normalizedCandidate;
  }

  const primaryKeyValue = /^\d+$/.test(pipelineRecordId)
    ? Number(pipelineRecordId)
    : pipelineRecordId;

  return {
    ...normalizedCandidate,

    /*
     * The Candidate Pipeline board must expose candidate_pipeline.id in every
     * pipeline-record alias. `candidateApplicationId` and
     * `sourceTalentPoolId` remain separate and can never replace this value.
     */
    id: primaryKeyValue,
    candidatePipelineRowId: primaryKeyValue,
    candidate_pipeline_row_id: primaryKeyValue,
    dbId: primaryKeyValue,
    db_id: primaryKeyValue,
    candidatePipelineId: primaryKeyValue,
    candidate_pipeline_id: primaryKeyValue,
    pipelineRecordId: primaryKeyValue,
    pipeline_record_id: primaryKeyValue,
  };
}

function mergeUpdatedCandidateList(list = [], updatedCandidate = {}) {
  const normalizedUpdated =
    normalizePipelineCandidateForBoard(updatedCandidate);

  const existingIndex = list.findIndex((candidate) =>
    isSamePipelineCandidate(candidate, normalizedUpdated),
  );

  if (existingIndex === -1) {
    return [normalizedUpdated, ...list];
  }

  return list.map((candidate, index) => {
    if (index !== existingIndex) return candidate;

    const lockedPipelineRecordId =
      getCandidatePipelineRecordId(candidate) ||
      getCandidatePipelineRecordId(normalizedUpdated);

    const primaryKeyValue = /^\d+$/.test(lockedPipelineRecordId)
      ? Number(lockedPipelineRecordId)
      : lockedPipelineRecordId;

    return normalizePipelineCandidateForBoard({
      ...candidate,
      ...normalizedUpdated,

      /* Never let an application/Talent Pool event replace the row ID. */
      ...(lockedPipelineRecordId
        ? {
            id: primaryKeyValue,
            candidatePipelineRowId: primaryKeyValue,
            candidate_pipeline_row_id: primaryKeyValue,
            dbId: primaryKeyValue,
            db_id: primaryKeyValue,
            candidatePipelineId: primaryKeyValue,
            candidate_pipeline_id: primaryKeyValue,
            pipelineRecordId: primaryKeyValue,
            pipeline_record_id: primaryKeyValue,
          }
        : {}),

      candidateId: candidate.candidateId || normalizedUpdated.candidateId,
      candidateApplicationId:
        candidate.candidateApplicationId ||
        normalizedUpdated.candidateApplicationId,
      applicationId:
        candidate.applicationId || normalizedUpdated.applicationId,
      timeline: Array.isArray(normalizedUpdated.timeline)
        ? normalizedUpdated.timeline
        : candidate.timeline || [],
    });
  });
}

function buildOptionList(values = [], defaultLabel) {
  const uniqueValues = Array.from(
    new Set(
      values
        .map((value) => cleanText(value))
        .filter(Boolean)
        .filter((value) => value !== "—"),
    ),
  ).sort((a, b) => a.localeCompare(b));

  return [defaultLabel, ...uniqueValues];
}

function getCandidateRoleForFilter(candidate = {}) {
  return (
    candidate.currentAppliedRole ||
    candidate.roleTitle ||
    candidate.openPosition ||
    candidate.roleCapability ||
    getRoleTitle(candidate.roleAccount) ||
    ""
  );
}

function getCandidateAccountForFilter(candidate = {}) {
  return (
    candidate.currentAppliedAccount ||
    candidate.account ||
    candidate.leadAccount ||
    candidate.accountFit ||
    getAccount(candidate.roleAccount) ||
    ""
  );
}

function buildSearchText(candidate = {}) {
  return [
    candidate.id,
    candidate.dbId,
    candidate.candidateId,
    candidate.candidateApplicationId,
    candidate.applicationId,
    candidate.name,
    candidate.candidateName,
    candidate.email,
    candidate.phone,
    candidate.contactNumber,
    candidate.roleTitle,
    candidate.currentAppliedRole,
    candidate.openPosition,
    candidate.roleCapability,
    candidate.account,
    candidate.currentAppliedAccount,
    candidate.leadAccount,
    candidate.accountFit,
    candidate.roleAccount,
    candidate.source,
    candidate.applyingLocation,
    candidate.skillsLanguage,
    candidate.prfStatus,
    candidate.prf_status,
    candidate.assessmentStatus,
    candidate.assessment_status,
    candidate.assessmentResult,
    candidate.assessment_result,
    candidate.interviewStatus,
    candidate.interview_status,
    candidate.offerApprovalStatus,
    candidate.offerDecision,
    candidate.offerDetails?.account,
    candidate.offerDetails?.roleTitle,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
}

function getNextPipelineStage(candidate = {}) {
  const currentStage = normalizePipelineStageName(getCandidateStage(candidate));
  const forcedStage = normalizePipelineStageName(
    candidate.targetStage || candidate.requestedStage,
    "",
  );

  if (forcedStage) return forcedStage;

  return normalizePipelineStageName(getNextStage(currentStage) || "", "");
}

function applyStageAliases(candidate = {}, stage) {
  const normalizedStage = normalizePipelineStageName(stage);

  return {
    ...candidate,
    currentStage: normalizedStage,
    currentPipelineStage: normalizedStage,
    pipelineStage: normalizedStage,
    stage: normalizedStage,
  };
}

function normalizeDateTimeInput(value) {
  if (!value) return "";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return String(value).slice(0, 16);
  }

  return toDateInputValue(date);
}

export function CandidatePipelineProvider({ children }) {
  const { user } = useUser();
  const { confirmAction, ConfirmationDialog } = useConfirmDialog();

  const loggedInUserIdentifier = useMemo(
    () => getLoggedInUserIdentifier(user),
    [user],
  );

  const isAuthenticated = Boolean(loggedInUserIdentifier);

  const currentUserName =
    user?.name ||
    user?.fullName ||
    user?.employeeName ||
    user?.displayName ||
    user?.username ||
    "Current User";

  const [candidateList, setCandidateList] = useState([]);
  const [hasLoadedStorage, setHasLoadedStorage] = useState(true);

  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [loadError, setLoadError] = useState("");

  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("All Roles");
  const [accountFilter, setAccountFilter] = useState("All Accounts");
  const [activeStage, setActiveStage] = useState("Initial Screening");
  const [pageView, setPageView] = useState("pipeline");

  const [selectedCandidate, setSelectedCandidate] = useState(null);

  const [moveCandidate, setMoveCandidate] = useState(null);
  const [moveForm, setMoveForm] = useState(emptyMoveForm);

  const [scheduleCandidate, setScheduleCandidate] = useState(null);
  const [scheduleForm, setScheduleForm] = useState(emptyScheduleForm);

  const [assessmentCandidate, setAssessmentCandidate] = useState(null);
  const [assessmentForm, setAssessmentForm] = useState(emptyAssessmentForm);

  const [dropOffCandidate, setDropOffCandidate] = useState(null);
  const [dropOffForm, setDropOffForm] = useState(emptyDropOffForm);

  const [offerCandidate, setOfferCandidate] = useState(null);
  const [offerForm, setOfferForm] = useState(emptyOfferForm);
  const [offerSubmitting, setOfferSubmitting] = useState(false);

  const [statusModal, setStatusModal] = useState({
    open: false,
    type: "error",
    title: "",
    message: "",
    closePipelineModals: false,
  });

  const normalizedActiveStage = normalizePipelineStageName(activeStage);

  const hideInterviewColumns =
    normalizedActiveStage === "Initial Screening" ||
    normalizedActiveStage === "Online Assessment";

  const showAssessmentStatusColumn = false;
  const showAssessmentResultColumn =
    normalizedActiveStage === "Online Assessment";

  function openStatusModal(type, title, message, options = {}) {
    const isSuccess = type === "success";
    const shouldClosePipelineModals =
      isSuccess || Boolean(options.closePipelineModals);

    /*
     * A success result must be the only modal visible. Clear Candidate
     * Pipeline Details and every action modal before opening StatusModal.
     * Error modals keep the current form open so the user can correct it.
     */
    if (shouldClosePipelineModals) {
      closeAllPipelineModals();
    }

    setStatusModal({
      open: true,
      type,
      title,
      message,
      closePipelineModals: false,
    });
  }

  function closeStatusModal() {
    setStatusModal((prev) => ({
      ...prev,
      open: false,
      closePipelineModals: false,
    }));
  }

  function showError(
    message,
    title = "Action Failed",
    options = {},
  ) {
    openStatusModal("error", title, message, {
      ...options,
      /*
       * Failed API calls and validation errors must keep every
       * Candidate Pipeline form open so the user can correct and retry.
       */
      closePipelineModals: false,
    });
  }

  function showSuccess(
    message,
    title = "Process Completed",
    options = {},
  ) {
    openStatusModal("success", title, message, {
      ...options,
      /*
       * Success always closes all underlying Candidate Pipeline modals
       * immediately. StatusModal remains mounted by this provider.
       */
      closePipelineModals: false,
    });
  }

  const refreshCandidatePipeline = useCallback(async () => {
    if (!isAuthenticated) {
      setIsLoading(false);
      setLoadError("");
      setCandidateList([]);
      setHasLoadedStorage(true);
      return {
        success: false,
        skipped: true,
        message:
          "Candidate pipeline refresh skipped because user is not logged in.",
      };
    }

    setIsLoading(true);
    setLoadError("");

    try {
      const response = await getCandidatePipelineCandidates({
        limit: 500,
      });

      if (!response?.success) {
        throw new Error(
          response?.message || "Failed to load candidate pipeline.",
        );
      }

      const apiRows = Array.isArray(response?.data)
        ? response.data
        : Array.isArray(response?.candidates)
          ? response.candidates
          : [];

      const rows = apiRows.length > 0 ? apiRows : STATIC_PIPELINE_CANDIDATES;

      const normalizedRows = rows.map(normalizePipelineCandidateForBoard);

      setCandidateList(normalizedRows);
      setHasLoadedStorage(true);

      return {
        success: true,
        data: normalizedRows,
      };
    } catch (error) {
      console.warn(
        "Candidate pipeline API returned error/empty, falling back to static pipeline candidates:",
        error?.message,
      );

      const staticRows = STATIC_PIPELINE_CANDIDATES.map(
        normalizePipelineCandidateForBoard,
      );

      setCandidateList(staticRows);
      setHasLoadedStorage(true);
      setLoadError("");

      return {
        success: true,
        data: staticRows,
      };
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    if (!isAuthenticated) {
      setCandidateList([]);
      setIsLoading(false);
      setLoadError("");
      setHasLoadedStorage(true);
      closeAllPipelineModals();

      setStatusModal((prev) => ({
        ...prev,
        open: false,
        closePipelineModals: false,
      }));

      return;
    }

    refreshCandidatePipeline();
  }, [isAuthenticated, refreshCandidatePipeline]);

  useEffect(() => {
    if (!isAuthenticated) return undefined;

    function handleRefreshEvent(event) {
      if (event?.type === "focus") {
        return;
      }

      const payload = event?.detail || {};
      const eventCandidate = payload?.candidate || payload;
      let updatedLocally = false;

      if (eventCandidate && typeof eventCandidate === "object") {
        const normalizedCandidate =
          normalizePipelineCandidateForBoard(eventCandidate);

        if (
          normalizedCandidate.id ||
          normalizedCandidate.candidateId ||
          normalizedCandidate.candidateApplicationId ||
          normalizedCandidate.email
        ) {
          setCandidateList((prev) =>
            mergeUpdatedCandidateList(prev, normalizedCandidate),
          );

          syncSelectedCandidate(normalizedCandidate);
          updatedLocally = true;
        }
      }

      if (!updatedLocally || payload?.forceRefresh || payload?.refresh === true) {
        refreshCandidatePipeline();
      }
    }

    window.addEventListener(
      "ta-pipeline-candidates-updated",
      handleRefreshEvent,
    );
    window.addEventListener("ta-talent-pool-updated", handleRefreshEvent);
    window.addEventListener("focus", handleRefreshEvent);

    return () => {
      window.removeEventListener(
        "ta-pipeline-candidates-updated",
        handleRefreshEvent,
      );
      window.removeEventListener("ta-talent-pool-updated", handleRefreshEvent);
      window.removeEventListener("focus", handleRefreshEvent);
    };
  }, [isAuthenticated, refreshCandidatePipeline]);

  const roleOptions = useMemo(() => {
    return buildOptionList(
      candidateList.map((candidate) => getCandidateRoleForFilter(candidate)),
      "All Roles",
    );
  }, [candidateList]);

  const accountOptions = useMemo(() => {
    return buildOptionList(
      candidateList.map((candidate) => getCandidateAccountForFilter(candidate)),
      "All Accounts",
    );
  }, [candidateList]);

  const filteredCandidates = useMemo(() => {
    const keyword = search.trim().toLowerCase();

    return candidateList
      .map(normalizePipelineCandidateForBoard)
      .filter((candidate) => {
        const role = getCandidateRoleForFilter(candidate);
        const account = getCandidateAccountForFilter(candidate);
        const text = buildSearchText(candidate);

        const matchesSearch = !keyword || text.includes(keyword);
        const matchesRole = roleFilter === "All Roles" || role === roleFilter;
        const matchesAccount =
          accountFilter === "All Accounts" || account === accountFilter;

        return matchesSearch && matchesRole && matchesAccount;
      });
  }, [candidateList, search, roleFilter, accountFilter]);

  const stageVisibleCandidates = useMemo(() => {
    return filteredCandidates.filter((candidate) => {
      const currentStage = normalizePipelineStageName(
        getCandidateStage(candidate),
      );

      if (currentStage === "Initial Screening") {
        return true;
      }

      if (currentStage === "Online Assessment") {
        return getCandidatePrfStatus(candidate) === "Matched";
      }

      if (currentStage === "Interview Scheduled") {
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

  const allPipelineStages = useMemo(() => {
    return Array.from(
      new Set([
        ...pipelineStages,
        INCOMPLETE_REQUIREMENTS_STAGE,
        ONBOARDING_STAGE,
        HIRED_ACTIVE_STAGE,
      ]),
    );
  }, []);

  const stageCounts = useMemo(() => {
    return allPipelineStages.reduce((acc, stage) => {
      acc[stage] = stageVisibleCandidates.filter(
        (candidate) =>
          normalizePipelineStageName(getCandidateStage(candidate)) === stage,
      ).length;

      return acc;
    }, {});
  }, [allPipelineStages, stageVisibleCandidates]);

  const metrics = useMemo(() => {
    return {
      initialScreening: stageCounts["Initial Screening"] || 0,
      onlineAssessment: stageCounts["Online Assessment"] || 0,
      interviewScheduled: stageCounts["Interview Scheduled"] || 0,
      interviewed: stageCounts.Interviewed || 0,
      offered: stageCounts.Offered || 0,
      accepted: stageCounts.Accepted || 0,
      forNho: stageCounts["For NHO"] || 0,
      incompleteRequirements:
        stageCounts[INCOMPLETE_REQUIREMENTS_STAGE] || 0,
      onboarding: stageCounts[ONBOARDING_STAGE] || 0,
      hiredActive: stageCounts[HIRED_ACTIVE_STAGE] || 0,
      dropOff:
        filteredCandidates.filter((candidate) => {
          const currentStage = normalizePipelineStageName(
            getCandidateStage(candidate),
          );
          return currentStage === "Drop-off" || currentStage === "Drop-offs";
        }).length || 0,
    };
  }, [stageCounts, filteredCandidates]);

  const stageFilteredCandidates = useMemo(() => {
    return stageVisibleCandidates.filter(
      (candidate) =>
        normalizePipelineStageName(getCandidateStage(candidate)) ===
        normalizedActiveStage,
    );
  }, [stageVisibleCandidates, normalizedActiveStage]);

  const showStatusColumn = useMemo(() => {
    if (normalizedActiveStage === "Online Assessment") return false;
    return true;
  }, [normalizedActiveStage]);

  function getLatestCandidateRecord(candidate = {}) {
    if (!candidate) return null;

    const matchedFromList = candidateList.find((item) =>
      isSamePipelineCandidate(item, candidate),
    );

    const matchedSelected =
      selectedCandidate && isSamePipelineCandidate(selectedCandidate, candidate)
        ? selectedCandidate
        : null;

    const possibleStatuses = [
      getCandidatePrfStatus(candidate),
      getCandidatePrfStatus(matchedSelected || {}),
      getCandidatePrfStatus(matchedFromList || {}),
    ];

    const bestPrfStatus =
      possibleStatuses.find((status) => status === "Matched") ||
      possibleStatuses.find(Boolean) ||
      "Review";

    return normalizePipelineCandidateForBoard({
      ...(matchedFromList || {}),
      ...candidate,
      ...(matchedSelected || {}),
      prfStatus: bestPrfStatus,
      prf_status: bestPrfStatus,
    });
  }

  function syncSelectedCandidate(updatedCandidate) {
    if (!updatedCandidate) return;

    const normalizedCandidate =
      normalizePipelineCandidateForBoard(updatedCandidate);

    setSelectedCandidate((prev) =>
      prev && isSamePipelineCandidate(prev, normalizedCandidate)
        ? normalizePipelineCandidateForBoard({
            ...prev,
            ...normalizedCandidate,
          })
        : prev,
    );

    setMoveCandidate((prev) =>
      prev && isSamePipelineCandidate(prev, normalizedCandidate)
        ? normalizePipelineCandidateForBoard({
            ...prev,
            ...normalizedCandidate,
          })
        : prev,
    );

    setScheduleCandidate((prev) =>
      prev && isSamePipelineCandidate(prev, normalizedCandidate)
        ? normalizePipelineCandidateForBoard({
            ...prev,
            ...normalizedCandidate,
          })
        : prev,
    );

    setAssessmentCandidate((prev) =>
      prev && isSamePipelineCandidate(prev, normalizedCandidate)
        ? normalizePipelineCandidateForBoard({
            ...prev,
            ...normalizedCandidate,
          })
        : prev,
    );

    setOfferCandidate((prev) =>
      prev && isSamePipelineCandidate(prev, normalizedCandidate)
        ? normalizePipelineCandidateForBoard({
            ...prev,
            ...normalizedCandidate,
          })
        : prev,
    );

    setDropOffCandidate((prev) =>
      prev && isSamePipelineCandidate(prev, normalizedCandidate)
        ? normalizePipelineCandidateForBoard({
            ...prev,
            ...normalizedCandidate,
          })
        : prev,
    );
  }

  function updateCandidateRecord(updatedCandidate) {
    if (!updatedCandidate) return null;

    const normalizedCandidate =
      normalizePipelineCandidateForBoard(updatedCandidate);

    setCandidateList((prev) =>
      mergeUpdatedCandidateList(prev, normalizedCandidate),
    );
    syncSelectedCandidate(normalizedCandidate);

    window.dispatchEvent(
      new CustomEvent("ta-pipeline-candidates-updated", {
        detail: normalizedCandidate,
      }),
    );

    return normalizedCandidate;
  }

  function handleNhoUploadsSaved({
    files = [],
    candidate = null,
    majorProgress = null,
    routedStage = "",
    response = null,
  } = {}) {
    const sourceCandidate =
      candidate || response?.candidate || response?.data || selectedCandidate;

    if (!sourceCandidate) {
      refreshCandidatePipeline();
      return null;
    }

    const nextStage = normalizePipelineStageName(
      routedStage ||
        sourceCandidate.currentStage ||
        sourceCandidate.current_stage ||
        sourceCandidate.currentPipelineStage ||
        sourceCandidate.current_pipeline_stage ||
        sourceCandidate.pipelineStage ||
        sourceCandidate.stage ||
        "",
      "",
    );

    const normalizedCandidate = normalizePipelineCandidateForBoard({
      ...sourceCandidate,
      nhoFiles: files,
      nho_files: files,
      majorNhoUploadProgress: majorProgress,
      major_nho_upload_progress: majorProgress,
      ...(nextStage
        ? {
            currentStage: nextStage,
            currentPipelineStage: nextStage,
            pipelineStage: nextStage,
            stage: nextStage,
          }
        : {}),
    });

    setCandidateList((prev) =>
      mergeUpdatedCandidateList(prev, normalizedCandidate),
    );

    syncSelectedCandidate(normalizedCandidate);

    if (nextStage) {
      setActiveStage(nextStage);
    }

    if (nextStage === ONBOARDING_STAGE) {
      showSuccess(
        "Candidate completed the 5 major requirements and was moved to Onboarding.",
        "Moved to Onboarding",
      );
    } else if (nextStage === INCOMPLETE_REQUIREMENTS_STAGE) {
      showSuccess(
        "Candidate has incomplete major requirements and was moved to Talent Pool for follow-up.",
        "Moved to Talent Pool",
      );
    }

    window.dispatchEvent(
      new CustomEvent("ta-pipeline-candidates-updated", {
        detail: {
          candidate: normalizedCandidate,
          files,
          majorProgress,
          routedStage: nextStage,
        },
      }),
    );

    window.dispatchEvent(
      new CustomEvent("ta-talent-pool-updated", {
        detail: {
          candidate: normalizedCandidate,
          files,
          majorProgress,
          routedStage: nextStage,
        },
      }),
    );

    return normalizedCandidate;
  }

  async function runCandidateAction(action, options = {}) {
    const {
      activeStageAfter,
      setSelected = true,
      refresh = true,
      successEvent = true,
      showSuccessModal = true,
      mergeResponseCandidate = true,
      successTitle = "Process Completed",
      successMessage = "",
      errorTitle = "Candidate Pipeline Error",
      errorMessage = "Candidate action failed.",
    } = options;

    if (!isAuthenticated) {
      showError(
        "Please login first before using Candidate Pipeline.",
        "Authentication Required",
      );

      return {
        success: false,
        message: "User is not logged in.",
      };
    }

    setIsSaving(true);
    setLoadError("");

    try {
      const response = await action();

      if (!response?.success) {
        throw new Error(
          response?.message ||
            errorMessage ||
            "Candidate action failed.",
        );
      }

      const apiCandidate = getApiCandidate(response);

      const updatedCandidate =
        mergeResponseCandidate
          ? apiCandidate
          : null;

      if (updatedCandidate) {
        const normalizedCandidate =
          normalizePipelineCandidateForBoard(updatedCandidate);

        setCandidateList((previous) =>
          mergeUpdatedCandidateList(
            previous,
            normalizedCandidate,
          ),
        );

        if (setSelected) {
          syncSelectedCandidate(normalizedCandidate);

          setSelectedCandidate((previous) =>
            previous &&
            isSamePipelineCandidate(
              previous,
              normalizedCandidate,
            )
              ? normalizePipelineCandidateForBoard({
                  ...previous,
                  ...normalizedCandidate,
                })
              : previous,
          );
        }
      }

      if (activeStageAfter) {
        setActiveStage(
          normalizePipelineStageName(activeStageAfter),
        );
      }

      if (successEvent) {
        window.dispatchEvent(
          new CustomEvent(
            "ta-pipeline-candidates-updated",
            {
              detail: updatedCandidate || response,
            },
          ),
        );
      }

      if (refresh) {
        await refreshCandidatePipeline();
      }

      if (showSuccessModal) {
        const resolvedSuccessMessage =
          typeof successMessage === "function"
            ? successMessage(response, updatedCandidate)
            : successMessage;

        showSuccess(
          resolvedSuccessMessage ||
            response?.message ||
            "The Candidate Pipeline process was completed successfully.",
          successTitle,
        );
      }

      return response;
    } catch (error) {
      const message =
        error?.response?.data?.message ||
        error?.response?.data?.error ||
        error?.message ||
        errorMessage ||
        "Candidate action failed.";

      console.error(
        "Candidate pipeline action error:",
        error,
      );

      setLoadError(message);
      showError(message, errorTitle);

      return {
        success: false,
        message,
      };
    } finally {
      setIsSaving(false);
    }
  }

  function closeAllPipelineModals() {
    setSelectedCandidate(null);

    setMoveCandidate(null);
    setMoveForm(emptyMoveForm);

    setScheduleCandidate(null);
    setScheduleForm(emptyScheduleForm);

    setAssessmentCandidate(null);
    setAssessmentForm(emptyAssessmentForm);

    setDropOffCandidate(null);
    setDropOffForm(emptyDropOffForm);

    setOfferCandidate(null);
    setOfferForm(emptyOfferForm);

    /*
     * Keep the Candidate Pipeline route mounted and return to its
     * primary board view before displaying the success result.
     */
    setPageView("pipeline");
  }

  async function handleUpdatePrfStatus(
    candidate,
    nextPrfStatus,
  ) {
    if (!candidate) {
      showError(
        "Candidate information is missing.",
        "Unable to Update PRF Status",
      );

      return {
        success: false,
        message: "Candidate information is missing.",
      };
    }

    const normalizedNextPrfStatus =
      normalizePrfStatus(nextPrfStatus);

    /*
     * Keep a strict snapshot of the candidate that the user actually
     * opened. PRF status is the only profile field allowed to change.
     */
    const submittedCandidate =
      normalizePipelineCandidateForBoard(candidate);

    const latestCandidate =
      getLatestCandidateRecord(
        submittedCandidate,
      ) || submittedCandidate;

    const currentStage =
      normalizePipelineStageName(
        getCandidateStage(latestCandidate),
      );

    const id =
      getCandidateRecordId(latestCandidate);

    if (!id) {
      showError(
        "Candidate Pipeline database ID is missing.",
        "Unable to Update PRF Status",
      );

      return {
        success: false,
        message:
          "Candidate Pipeline database ID is missing.",
      };
    }

    const optimisticCandidate =
      normalizePipelineCandidateForBoard({
        ...latestCandidate,

        /*
         * Preserve the exact opened candidate identity and profile.
         */
        id: submittedCandidate.id,
        dbId:
          submittedCandidate.dbId ||
          submittedCandidate.id,
        candidateId:
          submittedCandidate.candidateId,
        candidateApplicationId:
          submittedCandidate.candidateApplicationId,
        applicationId:
          submittedCandidate.applicationId ||
          submittedCandidate.candidateApplicationId,
        sourceTalentPoolId:
          submittedCandidate.sourceTalentPoolId,
        name: submittedCandidate.name,
        candidateName:
          submittedCandidate.candidateName ||
          submittedCandidate.name,
        email: submittedCandidate.email,

        prfStatus: normalizedNextPrfStatus,
        prf_status: normalizedNextPrfStatus,
        prfReviewed:
          normalizedNextPrfStatus === "Matched",
        prf_reviewed:
          normalizedNextPrfStatus === "Matched",
        prfReviewedAt:
          new Date().toISOString(),
        prf_reviewed_at:
          new Date().toISOString(),

        currentStage,
        currentPipelineStage: currentStage,
        stage: currentStage,
        pipelineStage: currentStage,

        candidateSnapshot: {
          ...(latestCandidate.candidateSnapshot || {}),
          candidateId:
            submittedCandidate.candidateId,
          candidateApplicationId:
            submittedCandidate.candidateApplicationId,
          applicationId:
            submittedCandidate.applicationId ||
            submittedCandidate.candidateApplicationId,
          name: submittedCandidate.name,
          email: submittedCandidate.email,
          prfStatus:
            normalizedNextPrfStatus,
          prf_status:
            normalizedNextPrfStatus,
          prfReviewed:
            normalizedNextPrfStatus === "Matched",
          prf_reviewed:
            normalizedNextPrfStatus === "Matched",
          currentStage,
          currentPipelineStage: currentStage,
          pipelineStage: currentStage,
        },
      });

    setCandidateList((previous) =>
      mergeUpdatedCandidateList(
        previous,
        optimisticCandidate,
      ),
    );

    syncSelectedCandidate(
      optimisticCandidate,
    );

    setSelectedCandidate((previous) =>
      previous &&
      isSameCandidatePipelineRecord(
        previous,
        optimisticCandidate,
      )
        ? normalizePipelineCandidateForBoard({
            ...previous,
            ...optimisticCandidate,
          })
        : previous,
    );

    const response =
      await runCandidateAction(
        () =>
          updateCandidatePipelinePrfStatus(
            id,
            {
              prfStatus:
                normalizedNextPrfStatus,
              prf_status:
                normalizedNextPrfStatus,
              prfReviewStatus:
                normalizedNextPrfStatus,
              prf_review_status:
                normalizedNextPrfStatus,
              status:
                normalizedNextPrfStatus,
              remarks:
                `PRF Status: ${normalizedNextPrfStatus}`,
            },
          ),
        {
          activeStageAfter: currentStage,
          refresh: false,
          setSelected: false,

          /*
           * The response is validated below before it may touch local
           * Candidate Pipeline state. This prevents another candidate
           * returned by an ambiguous backend identifier from replacing
           * the selected candidate.
           */
          mergeResponseCandidate: false,
          successEvent: false,

          /*
           * Matched / Unmatched remains an immediate dropdown update.
           */
          showSuccessModal: false,
        },
      );

    if (!response?.success) {
      setCandidateList((previous) =>
        mergeUpdatedCandidateList(
          previous,
          latestCandidate,
        ),
      );

      syncSelectedCandidate(
        latestCandidate,
      );

      setSelectedCandidate((previous) =>
        previous &&
        isSameCandidatePipelineRecord(
          previous,
          optimisticCandidate,
        )
          ? normalizePipelineCandidateForBoard({
              ...previous,
              ...latestCandidate,
            })
          : previous,
      );

      return response;
    }

    const apiCandidate =
      getApiCandidate(response);

    const safeApiCandidate =
      apiCandidate &&
      isSameCandidatePipelineRecord(
        optimisticCandidate,
        apiCandidate,
      )
        ? apiCandidate
        : null;

    if (
      apiCandidate &&
      !safeApiCandidate
    ) {
      console.warn(
        "Ignored mismatched PRF update response.",
        {
          requestedCandidate:
            optimisticCandidate,
          responseCandidate:
            apiCandidate,
        },
      );
    }

    const responseCandidate =
      normalizePipelineCandidateForBoard(
        mergeCandidatePipelineRecord(
          optimisticCandidate,
          safeApiCandidate || {},
          {
            preserveProfile: true,
          },
        ),
      );

    const finalCandidate =
      normalizePipelineCandidateForBoard({
        ...responseCandidate,

        /*
         * PRF updates must never replace the candidate's identity,
         * name, or email.
         */
        id: optimisticCandidate.id,
        dbId:
          optimisticCandidate.dbId ||
          optimisticCandidate.id,
        candidateId:
          optimisticCandidate.candidateId,
        candidateApplicationId:
          optimisticCandidate.candidateApplicationId,
        applicationId:
          optimisticCandidate.applicationId ||
          optimisticCandidate.candidateApplicationId,
        sourceTalentPoolId:
          optimisticCandidate.sourceTalentPoolId,
        name: optimisticCandidate.name,
        candidateName:
          optimisticCandidate.candidateName ||
          optimisticCandidate.name,
        email: optimisticCandidate.email,

        prfStatus:
          normalizedNextPrfStatus,
        prf_status:
          normalizedNextPrfStatus,
        prfReviewed:
          normalizedNextPrfStatus === "Matched",
        prf_reviewed:
          normalizedNextPrfStatus === "Matched",

        currentStage,
        currentPipelineStage: currentStage,
        stage: currentStage,
        pipelineStage: currentStage,
      });

    setCandidateList((previous) =>
      mergeUpdatedCandidateList(
        previous,
        finalCandidate,
      ),
    );

    syncSelectedCandidate(
      finalCandidate,
    );

    setSelectedCandidate((previous) =>
      previous &&
      isSameCandidatePipelineRecord(
        previous,
        finalCandidate,
      )
        ? normalizePipelineCandidateForBoard({
            ...previous,
            ...finalCandidate,
          })
        : previous,
    );

    window.dispatchEvent(
      new CustomEvent(
        "ta-pipeline-candidates-updated",
        {
          detail: finalCandidate,
        },
      ),
    );

    return {
      ...response,
      data: finalCandidate,
      candidate: finalCandidate,
    };
  }


  async function handleOpenScheduleInterview(candidate) {
    if (!candidate) return;

    const currentStage = normalizePipelineStageName(getCandidateStage(candidate));
    const normalizedCandidate = normalizePipelineCandidateForBoard({
      ...candidate,
      ...applyStageAliases(candidate, currentStage),
    });

    const isUpdatingSchedule = currentStage === "Interview Scheduled";

    setScheduleCandidate(normalizedCandidate);
    setScheduleForm({
      interviewDate: isUpdatingSchedule
        ? normalizeDateTimeInput(normalizedCandidate.interviewDate)
        : "",
      interviewType:
        isUpdatingSchedule && normalizedCandidate.interviewType !== "-"
          ? normalizedCandidate.interviewType
          : "",
      onlineInterviewLink:
        isUpdatingSchedule && normalizedCandidate.interviewType === "Online"
          ? normalizedCandidate.onlineInterviewLink || ""
          : "",
      remarks: "",
    });
  }

  async function handleCloseScheduleInterview() {
    setScheduleCandidate(null);
    setScheduleForm(emptyScheduleForm);
  }

  async function handleSubmitScheduleInterview(e) {
    e?.preventDefault?.();

    if (!scheduleCandidate) {
      showError(
        "No candidate is selected for interview scheduling.",
        "Unable to Save Interview Schedule",
      );
      return null;
    }

    const currentStage = normalizePipelineStageName(
      getCandidateStage(scheduleCandidate),
    );
    const isUpdatingSchedule = currentStage === "Interview Scheduled";

    if (!isUpdatingSchedule && !canScheduleInterview(scheduleCandidate)) {
      showError(
        "Only candidates tagged as Assessment Fit can be scheduled for interview.",
      );
      return null;
    }

    if (isUpdatingSchedule && !canUpdateInterviewSchedule(scheduleCandidate)) {
      showError("This interview schedule cannot be updated.");
      return null;
    }

    if (!scheduleForm.interviewDate || !scheduleForm.interviewType) {
      showError("Interview date and interview type are required.");
      return null;
    }

    if (
      scheduleForm.interviewType === "Online" &&
      !String(scheduleForm.onlineInterviewLink || "").trim()
    ) {
      showError("Online interview link is required for online interviews.");
      return null;
    }

    if (
      !(await confirmAction(
        `${isUpdatingSchedule ? "Update" : "Save"} interview schedule for ${
          scheduleCandidate.name
        }?`,
      ))
    ) {
      return null;
    }

    const id = getCandidateRecordId(scheduleCandidate);

    return runCandidateAction(
      () =>
        scheduleCandidatePipelineInterview(id, {
          interviewDate: scheduleForm.interviewDate,
          interviewType: scheduleForm.interviewType,
          onlineInterviewLink:
            scheduleForm.interviewType === "Online"
              ? scheduleForm.onlineInterviewLink
              : "",
          remarks: scheduleForm.remarks,
          taEmail: String(
            user?.email ||
              user?.workEmail ||
              user?.work_email ||
              user?.emailAddress ||
              user?.email_address ||
              "",
          ).trim(),
          taName: [
            user?.firstName || user?.first_name,
            user?.middleName || user?.middle_name,
            user?.lastName || user?.last_name,
          ]
            .filter(Boolean)
            .join(" ")
            .trim() ||
            user?.name ||
            user?.fullName ||
            user?.full_name ||
            user?.sibs_id ||
            user?.username ||
            "Talent Acquisition",
        }),
      {
        activeStageAfter: "Interview Scheduled",
        successTitle: isUpdatingSchedule
          ? "Interview Schedule Updated"
          : "Interview Scheduled",
        successMessage: isUpdatingSchedule
          ? `${scheduleCandidate.name}'s interview schedule was updated successfully.`
          : `${scheduleCandidate.name}'s interview was scheduled successfully.`,
      },
    );
  }

  async function handleCancelInterview(candidate) {
    if (!candidate) {
      showError(
        "Candidate information is missing.",
        "Unable to Cancel Interview",
      );
      return null;
    }

    const currentStage = normalizePipelineStageName(getCandidateStage(candidate));

    if (currentStage !== "Interview Scheduled") {
      showError("Only scheduled interviews can be cancelled.");
      return null;
    }

    if (!(await confirmAction(`Cancel interview for ${candidate.name}?`))) {
      return null;
    }

    const cleanedReason =
      candidate.cancellationReason ||
      "Candidate requested to cancel the interview.";

    const id = getCandidateRecordId(candidate);

    return runCandidateAction(
      () =>
        cancelCandidatePipelineInterview(id, {
          reason: cleanedReason,
          cancellationReason: cleanedReason,
        }),
      {
        successTitle: "Interview Cancelled",
        successMessage: `${candidate.name}'s interview was cancelled successfully.`,
        errorTitle: "Interview Cancellation Failed",
      },
    );
  }

  async function handleCompleteInterview(candidate) {
    if (!candidate) {
      showError(
        "Candidate information is missing.",
        "Unable to Complete Interview",
      );
      return null;
    }

    if (!hasInterviewSchedule(candidate)) {
      showError("Create the interview schedule first.");
      return null;
    }

    if (
      !(await confirmAction(
        `Mark interview as completed for ${candidate.name}?`,
      ))
    ) {
      return null;
    }

    const id = getCandidateRecordId(candidate);

    return runCandidateAction(
      () =>
        completeCandidatePipelineInterview(id, {
          interviewNotes: candidate.interviewNotes || "",
          remarks: "Interview marked as completed.",
        }),
      {
        activeStageAfter: "Interviewed",
        successTitle: "Interview Completed",
        successMessage: `${candidate.name}'s interview was marked as completed.`,
        errorTitle: "Interview Completion Failed",
      },
    );
  }

  async function handleSaveInterviewNotes(candidate, notes) {
    if (!candidate) return null;

    if (!(await confirmAction(`Save interview notes for ${candidate.name}?`))) {
      return null;
    }

    const id = getCandidateRecordId(candidate);

    return runCandidateAction(
      () =>
        saveCandidatePipelineInterviewNotes(id, {
          interviewNotes: String(notes || "").trim(),
          notes: String(notes || "").trim(),
        }),
      {
        successTitle: "Interview Notes Saved",
        successMessage: `${candidate.name}'s interview notes were saved successfully.`,
        errorTitle: "Interview Notes Save Failed",
      },
    );
  }

  async function handleOpenOfferModal(candidate) {
    if (!candidate) return;

    const currentStage =
      normalizePipelineStageName(
        getCandidateStage(candidate),
      );

    const normalizedCandidate =
      normalizePipelineCandidateForBoard(
        candidate,
      );

    const isRejectedOfferRevision =
      currentStage === "Offered" &&
      getCandidateOfferApprovalStatus(
        normalizedCandidate,
      ) === "rejected";

    if (
      currentStage !== "Interviewed" &&
      !isRejectedOfferRevision
    ) {
      showError(
        currentStage === "Offered"
          ? "A new offer can only be created after the current offer is rejected by an approver."
          : "Offer details can only be prepared after the interview is completed.",
      );
      return;
    }

    const offerDetails =
      normalizedCandidate.offerDetails || {};

    const currentRoleTitle =
      getRoleTitle(
        normalizedCandidate.roleAccount,
      );

    const currentAccount =
      getAccount(
        normalizedCandidate.roleAccount,
      );

    /*
     * A rejected approver version starts a fresh compensation proposal while
     * preserving the approved assignment / PRF. The backend will create the
     * next candidate_offer_versions row instead of overwriting the rejected
     * version.
     */
    setOfferCandidate(normalizedCandidate);
    setOfferForm({
      hiringRequirementId:
        offerDetails.hiringRequirementId ||
        normalizedCandidate.hiringRequirementId ||
        "",
      roleTitle:
        offerDetails.roleTitle ||
        (currentRoleTitle === ""
          ? ""
          : currentRoleTitle),
      account:
        offerDetails.account ||
        (currentAccount === ""
          ? ""
          : currentAccount),
      basicPay:
        isRejectedOfferRevision
          ? ""
          : offerDetails.basicPay || "",
      deminimisDailyRate:
        isRejectedOfferRevision
          ? ""
          : offerDetails.deminimisDailyRate || "",
      startDate:
        isRejectedOfferRevision
          ? ""
          : (
              offerDetails.startDate ||
              offerDetails.start_date ||
              ""
            ),
      remarks: "",
    });
  }

  async function handleCloseOfferModal() {
    setOfferCandidate(null);
    setOfferForm(emptyOfferForm);
  }

  async function handleReprofileOfferAccount({ hiringRequirementId, account }) {
    if (!offerCandidate) {
      return { success: false, message: "No candidate is selected." };
    }

    const id = getCandidateRecordId(offerCandidate);
    const response = await reprofileCandidatePipelineAccount(id, {
      hiringRequirementId,
    });

    if (!response?.success) {
      showError(
        response?.message || "Failed to reprofile candidate account.",
        "Reprofile Failed",
      );
      return response;
    }

    const updatedCandidate = normalizePipelineCandidateForBoard(
      response.candidate || response.data,
    );

    syncSelectedCandidate(updatedCandidate);
    setOfferCandidate(updatedCandidate);
    setOfferForm((previous) => ({
      ...previous,
      hiringRequirementId,
      account,
      finalAccount: account,
      roleTitle: previous.roleTitle || updatedCandidate.roleTitle,
      finalRole: previous.roleTitle || updatedCandidate.roleTitle,
    }));

    return response;
  }

  async function handleSubmitOfferDetails(event) {
    event?.preventDefault?.();

    if (!offerCandidate) {
      showError(
        "No candidate is selected for offer preparation.",
        "Unable to Proceed",
      );

      return {
        success: false,
        message: "No candidate is selected.",
      };
    }

    if (
      !offerForm.hiringRequirementId ||
      !offerForm.roleTitle ||
      !offerForm.account ||
      !offerForm.basicPay ||
      !offerForm.deminimisDailyRate
    ) {
      showError(
        "An approved PRF for the same role, final account, basic pay, and deminimis / daily rate are required.",
        "Incomplete Offer Details",
      );

      return {
        success: false,
        message: "Required offer details are incomplete.",
      };
    }

    const confirmed = await confirmAction(
      `Proceed with offer assignment for ${offerCandidate.name}?`,
    );

    if (!confirmed) {
      return {
        success: false,
        cancelled: true,
        message: "Offer submission was cancelled.",
      };
    }

    const id = getCandidateRecordId(offerCandidate);

    const isRejectedOfferRevision =
      normalizePipelineStageName(
        getCandidateStage(offerCandidate),
      ) === "Offered" &&
      getCandidateOfferApprovalStatus(
        offerCandidate,
      ) === "rejected";

    setOfferSubmitting(true);

    let employmentOfferPdf = null;
    let response;

    try {
      try {
        employmentOfferPdf = await generateEmploymentOfferPdf({
          candidate: offerCandidate,
          offer: offerForm,
        });
      } catch (pdfError) {
        console.error("Employment offer PDF generation failed:", pdfError);
      }

      response = await runCandidateAction(
      () =>
        saveCandidatePipelineOffer(id, {
          hiringRequirementId: offerForm.hiringRequirementId,
          roleTitle: offerForm.roleTitle,
          finalRole: offerForm.roleTitle,
          account: offerForm.account,
          finalAccount: offerForm.account,
          basicPay: Number(offerForm.basicPay),
          deminimisDailyRate: Number(
            offerForm.deminimisDailyRate,
          ),
          ...(offerForm.startDate
            ? { startDate: offerForm.startDate }
            : {}),
          ...(employmentOfferPdf?.base64
            ? {
                employmentOfferPdfBase64: employmentOfferPdf.base64,
                employmentOfferPdfFilename: employmentOfferPdf.filename,
              }
            : {}),
          remarks:
            offerForm.remarks ||
            `Hiring Requirement: ${
              offerForm.hiringRequirementId
            }, Final Role: ${offerForm.roleTitle}, Final Account: ${
              offerForm.account
            }, Basic Pay: ${formatCurrency(
              offerForm.basicPay,
            )}, Deminimis / Daily Rate: ${formatCurrency(
              offerForm.deminimisDailyRate,
            )}`,
        }),
      {
        activeStageAfter: "Offered",
        successTitle:
          isRejectedOfferRevision
            ? "New Offer Submitted for Approval"
            : "Offer Submitted for Approval",
        successMessage:
          isRejectedOfferRevision
            ? `${offerCandidate.name}'s new offer version was submitted for approval successfully.`
            : `${offerCandidate.name}'s offer was submitted for approval successfully.`,
        errorTitle: "Offer Submission Failed",
      },
      );
    } finally {
      setOfferSubmitting(false);
    }

    if (!response?.success) {
      return response;
    }

    showSuccess(
      response?.emailWarning ||
        response?.message ||
        `${offerCandidate.name}'s offer was submitted for approval successfully.`,
      response?.emailSent === false
        ? "Offer Saved - Email Not Sent"
        : "Offer Submitted for Approval",
      {
        /*
         * closeStatusModal() reads this flag. When the user clicks OK,
         * closeAllPipelineModals() clears selectedCandidate,
         * offerCandidate, and every other pipeline modal state.
         */
        closePipelineModals: true,
      },
    );

    return response;
  }


  async function handleOpenMoveModal(candidate, forcedStage = "") {
    if (!candidate) return;

    const latestCandidate = getLatestCandidateRecord(candidate);
    const currentStage = getCandidateStage(latestCandidate);

    const nextStage =
      cleanText(forcedStage) || getNextPipelineStage(latestCandidate);

    if (!nextStage) return;

    const normalizedCandidate =
      normalizePipelineCandidateForBoard(latestCandidate);

    if (currentStage === "Initial Screening") {
      if (!canMoveToOnlineAssessment(normalizedCandidate)) {
        showError(
          "Please set PRF Status to Matched before moving this candidate to Online Assessment.",
        );
        return;
      }

      const movementReason =
        "PRF matched. Candidate moved from Initial Screening to Online Assessment and assessment email will be sent.";

      if (
        !(await confirmAction(
          `Move ${normalizedCandidate.name} from Initial Screening to Online Assessment?`,
        ))
      ) {
        return;
      }

      const id = getCandidateRecordId(normalizedCandidate);

      const optimisticCandidate = normalizePipelineCandidateForBoard({
        ...normalizedCandidate,
        previousStage: "Initial Screening",
        currentStage: "Online Assessment",
        currentPipelineStage: "Online Assessment",
        stage: "Online Assessment",
        pipelineStage: "Online Assessment",
        reasonForMovement: movementReason,
        assessmentStatus: "Not Take",
        assessment_status: "Not Take",
        assessmentResult: "",
        assessment_result: "",
        assessmentEmailSent: true,
        assessment_email_sent: true,
        assessmentEmailSentAt: new Date().toISOString(),
        assessment_email_sent_at: new Date().toISOString(),
        interviewStatus: "For Assessment",
        interview_status: "For Assessment",
      });

      setCandidateList((prev) =>
        mergeUpdatedCandidateList(prev, optimisticCandidate),
      );

      syncSelectedCandidate(optimisticCandidate);
      setSelectedCandidate(optimisticCandidate);

      setMoveCandidate(null);
      setMoveForm(emptyMoveForm);
      setActiveStage("Online Assessment");

      const response = await runCandidateAction(
        () =>
          moveCandidatePipelineStage(id, {
            targetStage: "Online Assessment",
            nextStage: "Online Assessment",
            stage: "Online Assessment",
            currentStage: "Online Assessment",
            current_stage: "Online Assessment",
            reason: movementReason,
            reasonForMovement: movementReason,
            remarks: "Assessment email has been triggered to the candidate.",
          }),
        {
          activeStageAfter: "Online Assessment",
          refresh: false,
        },
      );

      if (response?.success) {
        const updatedCandidate = normalizePipelineCandidateForBoard({
          ...optimisticCandidate,
          ...(getApiCandidate(response) || {}),
          prfStatus: "Matched",
          prf_status: "Matched",
          prfReviewed: true,
          prf_reviewed: true,
          currentStage: "Online Assessment",
          currentPipelineStage: "Online Assessment",
          stage: "Online Assessment",
          pipelineStage: "Online Assessment",
        });

        setCandidateList((prev) =>
          mergeUpdatedCandidateList(prev, updatedCandidate),
        );

        syncSelectedCandidate(updatedCandidate);
        setSelectedCandidate(updatedCandidate);

        triggerAssessmentEmail(updatedCandidate);

        showSuccess(
          `${normalizedCandidate.name} was moved to Online Assessment.`,
          "Candidate Moved",
          {
            closePipelineModals: false,
          },
        );

        window.dispatchEvent(
          new CustomEvent("ta-pipeline-candidates-updated", {
            detail: updatedCandidate,
          }),
        );
      }

      return response;
    }

    if (currentStage === "Online Assessment") {
      handleOpenScheduleInterview(normalizedCandidate);
      return;
    }

    if (nextStage === "Offered") {
      handleOpenOfferModal(normalizedCandidate);
      return;
    }

    setSelectedCandidate(null);
    setMoveCandidate(normalizedCandidate);

    setMoveForm({
      reason:
        normalizedCandidate.reasonForMovement ||
        `Candidate moved from ${currentStage} to ${nextStage}.`,
      remarks: "",
      nextStage,
      targetStage: nextStage,
      stage: nextStage,
    });
  }

  async function handleCloseMoveModal() {
    setMoveCandidate(null);
    setMoveForm(emptyMoveForm);
  }

  async function handleSubmitMove(e) {
    e?.preventDefault?.();

    if (!moveCandidate) {
      showError(
        "No candidate is selected for movement.",
        "Unable to Move Candidate",
      );
      return null;
    }

    const latestMoveCandidate = getLatestCandidateRecord(moveCandidate);
    const normalizedMoveCandidate =
      normalizePipelineCandidateForBoard(latestMoveCandidate);

    const currentStage = getCandidateStage(normalizedMoveCandidate);

    const nextStage =
      moveForm.targetStage ||
      moveForm.nextStage ||
      moveForm.stage ||
      getNextPipelineStage(normalizedMoveCandidate);

    if (!nextStage) {
      showError("This candidate cannot be moved forward.");
      return null;
    }

    if (currentStage === "Initial Screening") {
      if (!canMoveToOnlineAssessment(normalizedMoveCandidate)) {
        showError(
          "Please set PRF Status to Matched before moving this candidate to Online Assessment.",
        );
        return null;
      }
    }

    const finalReason =
      cleanText(moveForm.reason) ||
      (nextStage === "Online Assessment"
        ? "PRF matched. Candidate moved from Initial Screening to Online Assessment and assessment email will be sent."
        : `Candidate moved from ${currentStage} to ${nextStage}.`);

    if (
      !(await confirmAction(
        `Move ${normalizedMoveCandidate.name} from ${currentStage} to ${nextStage}?`,
      ))
    ) {
      return null;
    }

    const id = getCandidateRecordId(normalizedMoveCandidate);
    const movingToOnlineAssessment = nextStage === "Online Assessment";

    const optimisticCandidate = normalizePipelineCandidateForBoard({
      ...normalizedMoveCandidate,
      previousStage: currentStage,
      currentStage: nextStage,
      currentPipelineStage: nextStage,
      stage: nextStage,
      pipelineStage: nextStage,
      reasonForMovement: finalReason,
      assessmentStatus: movingToOnlineAssessment
        ? "Not Take"
        : normalizedMoveCandidate.assessmentStatus,
      assessment_status: movingToOnlineAssessment
        ? "Not Take"
        : normalizedMoveCandidate.assessment_status,
      assessmentResult: movingToOnlineAssessment
        ? ""
        : normalizedMoveCandidate.assessmentResult,
      assessment_result: movingToOnlineAssessment
        ? ""
        : normalizedMoveCandidate.assessment_result,
      assessmentEmailSent: movingToOnlineAssessment
        ? true
        : normalizedMoveCandidate.assessmentEmailSent,
      assessment_email_sent: movingToOnlineAssessment
        ? true
        : normalizedMoveCandidate.assessment_email_sent,
      assessmentEmailSentAt: movingToOnlineAssessment
        ? new Date().toISOString()
        : normalizedMoveCandidate.assessmentEmailSentAt,
      assessment_email_sent_at: movingToOnlineAssessment
        ? new Date().toISOString()
        : normalizedMoveCandidate.assessment_email_sent_at,
      interviewStatus: movingToOnlineAssessment
        ? "For Assessment"
        : normalizedMoveCandidate.interviewStatus,
      interview_status: movingToOnlineAssessment
        ? "For Assessment"
        : normalizedMoveCandidate.interview_status,
    });

    setCandidateList((prev) =>
      mergeUpdatedCandidateList(prev, optimisticCandidate),
    );

    syncSelectedCandidate(optimisticCandidate);

    if (movingToOnlineAssessment) {
      setSelectedCandidate(optimisticCandidate);
    } else {
      setSelectedCandidate(null);
    }

    setActiveStage(nextStage);

    const response = await runCandidateAction(
      () =>
        moveCandidatePipelineStage(id, {
          targetStage: nextStage,
          nextStage,
          stage: nextStage,
          currentStage: nextStage,
          current_stage: nextStage,
          reason: finalReason,
          reasonForMovement: finalReason,
          remarks: moveForm.remarks.trim(),
        }),
      {
        activeStageAfter: nextStage,
        refresh: false,
      },
    );

    if (response?.success) {
      const updatedCandidate = normalizePipelineCandidateForBoard({
        ...optimisticCandidate,
        ...(getApiCandidate(response) || {}),
        currentStage: nextStage,
        currentPipelineStage: nextStage,
        stage: nextStage,
        pipelineStage: nextStage,
      });

      setCandidateList((prev) =>
        mergeUpdatedCandidateList(prev, updatedCandidate),
      );

      syncSelectedCandidate(updatedCandidate);

      if (movingToOnlineAssessment) {
        setSelectedCandidate(updatedCandidate);
        triggerAssessmentEmail(updatedCandidate);
      }

      showSuccess(
        `${normalizedMoveCandidate.name} was moved to ${nextStage}.`,
        "Candidate Moved",
        {
          closePipelineModals: false,
        },
      );

      window.dispatchEvent(
        new CustomEvent("ta-pipeline-candidates-updated", {
          detail: updatedCandidate,
        }),
      );
    }

    return response;
  }

  async function handleOpenAssessmentModal(candidate) {
    if (!candidate) return;

    const currentStage = normalizePipelineStageName(getCandidateStage(candidate));

    if (currentStage !== "Online Assessment") {
      showError(
        "Assessment update is only available in Online Assessment stage.",
      );
      return;
    }

    const normalizedCandidate = normalizePipelineCandidateForBoard(candidate);

    setAssessmentCandidate(normalizedCandidate);
    setAssessmentForm({
      assessmentStatus: normalizedCandidate.assessmentStatus || "Not Take",
      assessmentResult: normalizedCandidate.assessmentResult || "",
      assessmentRemarks: normalizedCandidate.assessmentRemarks || "",
      assessmentFileName: normalizedCandidate.assessmentFileName || "",
      assessmentFileUrl: normalizedCandidate.assessmentFileUrl || "",
      assessmentFileType: normalizedCandidate.assessmentFileType || "",
      assessmentFileSize: normalizedCandidate.assessmentFileSize || "",
      assessmentAttachmentName:
        normalizedCandidate.assessmentAttachmentName || "",
      assessmentAttachmentUrl:
        normalizedCandidate.assessmentAttachmentUrl || "",
      assessmentAttachmentType:
        normalizedCandidate.assessmentAttachmentType || "",
      assessmentAttachmentSize:
        normalizedCandidate.assessmentAttachmentSize || "",
    });
  }

  async function handleCloseAssessmentModal() {
    setAssessmentCandidate(null);
    setAssessmentForm(emptyAssessmentForm);
  }

  async function handleSendAssessmentEmail(candidate) {
    if (!candidate) return null;

    if (!(await confirmAction(`Send assessment email to ${candidate.name}?`))) {
      return null;
    }

    const id = getCandidateRecordId(candidate);

    const response = await runCandidateAction(
      () =>
        sendCandidatePipelineAssessmentEmail(id, {
          remarks: buildAssessmentLink(candidate),
        }),
      {
        successTitle: "Assessment Email Sent",
        successMessage: `Assessment email was sent to ${candidate.name}.`,
        errorTitle: "Assessment Email Failed",
      },
    );

    if (response?.success) {
      triggerAssessmentEmail(getApiCandidate(response) || candidate);
    }

    return response;
  }

  async function handleSubmitAssessment(e) {
    e?.preventDefault?.();

    if (!assessmentCandidate) {
      showError(
        "No candidate is selected for assessment.",
        "Unable to Save Assessment",
      );
      return null;
    }

    if (!assessmentForm.assessmentStatus) {
      showError("Assessment status is required.");
      return null;
    }

    if (
      assessmentForm.assessmentStatus === "Taken" &&
      !assessmentForm.assessmentResult
    ) {
      showError("Assessment result is required when assessment status is Taken.");
      return null;
    }

    if (
      !(await confirmAction(
        `Save assessment update for ${assessmentCandidate.name}?`,
      ))
    ) {
      return null;
    }

    const id = getCandidateRecordId(assessmentCandidate);

    return runCandidateAction(
      () =>
        saveCandidatePipelineAssessment(id, {
          ...assessmentForm,
          assessmentRemarks: assessmentForm.assessmentRemarks.trim(),
        }),
      {
        activeStageAfter: "Online Assessment",
        successTitle: "Assessment Saved",
        successMessage:
          `${assessmentCandidate.name}'s assessment was saved successfully.`,
        errorTitle: "Assessment Save Failed",
      },
    );
  }

  async function handleOpenDropOffModal(candidate) {
    if (!candidate) return;

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
    setDropOffForm(emptyDropOffForm);
  }

  async function handleSubmitDropOff(e) {
    e?.preventDefault?.();

    if (!dropOffCandidate) {
      showError(
        "No candidate is selected for Drop-off.",
        "Unable to Save Drop-off",
      );
      return null;
    }

    const currentStage = normalizePipelineStageName(
      getCandidateStage(dropOffCandidate),
    );

    if (!dropOffForm.category.trim()) {
      showError("Drop-off category is required.");
      return null;
    }

    if (!dropOffForm.reason.trim()) {
      showError("Drop-off reason is required.");
      return null;
    }

    if (!(await confirmAction(`Move ${dropOffCandidate.name} to Drop-off?`))) {
      return null;
    }

    const id = getCandidateRecordId(dropOffCandidate);

    return runCandidateAction(
      () =>
        dropOffCandidatePipelineCandidate(id, {
          category: dropOffForm.category.trim(),
          dropOffCategory: dropOffForm.category.trim(),
          reason: dropOffForm.reason.trim(),
          dropOffReason: dropOffForm.reason.trim(),
          remarks: dropOffForm.remarks.trim(),
          previousStage: currentStage,
        }),
      {
        activeStageAfter: "Drop-off",
        successTitle: "Candidate Moved to Drop-off",
        successMessage:
          `${dropOffCandidate.name} was moved to Drop-off successfully.`,
        errorTitle: "Drop-off Failed",
      },
    );
  }

  async function handleUpdateOfferApproval(
    candidate,
    approverOrStatus,
    statusArg,
  ) {
    if (!candidate) return null;

    const currentStage = normalizePipelineStageName(getCandidateStage(candidate));

    if (currentStage !== "Offered") return null;

    const approvalStatuses = ["For Review", "Pending", "Approved", "Rejected"];

    const approver = statusArg
      ? approverOrStatus
      : currentUserName || "Current User";

    const status = statusArg || approverOrStatus;

    if (!approvalStatuses.includes(status)) {
      showError("Valid approval status is required.");
      return null;
    }

    if (
      !(await confirmAction(
        `Set ${approver} offer approval to ${status} for ${candidate.name}?`,
      ))
    ) {
      return null;
    }

    const id = getCandidateRecordId(candidate);

    return runCandidateAction(
      () =>
        updateCandidatePipelineOfferApproval(id, {
          approver,
          approvedBy: approver,
          status,
          approvalStatus: status,
        }),
      {
        successTitle: "Offer Approval Updated",
        successMessage:
          `${candidate.name}'s offer approval was updated to ${status}.`,
        errorTitle: "Offer Approval Update Failed",
      },
    );
  }

  async function handleSendOfferEmail(candidate) {
    if (!candidate) return null;

    if (!isOfferApproved(candidate)) {
      showError("Offer must be approved before sending the contract email.");
      return null;
    }

    if (
      !(await confirmAction(`Send offer contract email for ${candidate.name}?`))
    ) {
      return null;
    }

    const id = getCandidateRecordId(candidate);

    const response = await runCandidateAction(
      () =>
        sendCandidatePipelineOfferEmail(id, {
          remarks: buildOfferContractLink(candidate),
        }),
      {
        successTitle: "Offer Email Sent",
        successMessage:
          `The approved offer email was sent to ${candidate.name}.`,
        errorTitle: "Offer Email Failed",
      },
    );

    if (response?.success) {
      triggerOfferEmail(getApiCandidate(response) || candidate);
    }

    return response;
  }

  async function handleOfferDecision(candidate, decision) {
    if (!candidate) return null;

    if (!candidate.offerEmailSent) {
      showError(
        "Send the approved contract email first before recording the lead response.",
      );
      return null;
    }

    if (
      !(await confirmAction(
        `Record candidate response as ${decision} for ${candidate.name}?`,
      ))
    ) {
      return null;
    }

    const id = getCandidateRecordId(candidate);

    const nextStage = normalizePipelineStageName(
      decision === "Accepted"
        ? "Accepted"
        : decision === "Rejected"
          ? "Drop-off"
          : getCandidateStage(candidate),
    );

    return runCandidateAction(
      () =>
        saveCandidatePipelineOfferDecision(id, {
          decision,
          offerDecision: decision,
        }),
      {
        activeStageAfter: nextStage,
        successTitle: "Offer Decision Saved",
        successMessage:
          `${candidate.name}'s offer response was recorded as ${decision}.`,
        errorTitle: "Offer Decision Save Failed",
      },
    );
  }

  async function handleScheduleNhoAuto(candidate) {
    if (!candidate) return null;

    const currentStage = normalizePipelineStageName(getCandidateStage(candidate));

    if (currentStage !== "Accepted" && currentStage !== "Accepted (For NHO)") {
      showError("Only accepted candidates can be scheduled for NHO.");
      return null;
    }

    const fridaySchedule = getFridayOfCurrentWeek();

    if (
      !(await confirmAction(
        `Schedule NHO for ${candidate.name} on ${formatNhoScheduleDate(
          fridaySchedule,
        )} and move candidate to For NHO?`,
      ))
    ) {
      return null;
    }

    const id = getCandidateRecordId(candidate);

    return runCandidateAction(
      () =>
        scheduleCandidatePipelineNho(id, {
          startDate: fridaySchedule.toISOString(),
          date: fridaySchedule.toISOString(),
          account:
            candidate?.offerDetails?.account ||
            candidate?.account ||
            getAccount(candidate?.roleAccount) ||
            "—",
          trainer: candidate?.trainer || "To be assigned",
          updatedShiftSchedule:
            candidate?.updatedShiftSchedule ||
            candidate?.nhoShiftSchedule ||
            "To be assigned",
          shiftSchedule:
            candidate?.updatedShiftSchedule ||
            candidate?.nhoShiftSchedule ||
            "To be assigned",
          endorsementStatus: "For Endorsement",
          location: candidate?.workLocation || candidate?.nhoLocation || "—",
          status: "Scheduled",
          remarks: `NHO automatically scheduled for ${formatNhoScheduleDate(
            fridaySchedule,
          )}.`,
        }),
      {
        activeStageAfter: "For NHO",
        successTitle: "NHO Scheduled",
        successMessage:
          `${candidate.name}'s NHO was scheduled successfully.`,
        errorTitle: "NHO Scheduling Failed",
      },
    );
  }

  async function handleResendDropOffEmail(candidate) {
    if (!candidate) {
      showError("Candidate information is missing.", "Unable to Resend Email");
      return null;
    }

    if (normalizePipelineStageName(getCandidateStage(candidate)) !== "Drop-off") {
      showError(
        "Only candidates currently in Drop-off can receive this email.",
        "Unable to Resend Email",
      );
      return null;
    }

    if (
      !(await confirmAction(
        `Resend the Drop-off application update email to ${candidate.name}?`,
      ))
    ) {
      return null;
    }

    const id = getCandidateRecordId(candidate);

    return runCandidateAction(
      () => resendCandidatePipelineDropOffEmail(id),
      {
        refresh: true,
        successTitle: "Drop-off Email Sent",
        successMessage: (response) =>
          response?.message ||
          `The Drop-off application update email was sent to ${candidate.name}.`,
        errorTitle: "Drop-off Email Failed",
      },
    );
  }

  async function handleStartInterview(candidate) {
    if (!candidate) {
      showError(
        "Candidate information is missing.",
        "Unable to Start Interview",
      );

      return {
        success: false,
        message: "Candidate information is missing.",
      };
    }

    const id = getCandidateRecordId(candidate);

    return runCandidateAction(
      () =>
        startCandidatePipelineInterview(id, {
          candidateId: candidate.candidateId || candidate.candidate_id || "",
          candidateApplicationId:
            candidate.candidateApplicationId ||
            candidate.candidate_application_id ||
            candidate.applicationId ||
            candidate.id ||
            "",
          positionId:
            candidate.positionId ||
            candidate.position_id ||
            candidate.openPositionId ||
            candidate.open_position_id ||
            "",
          templateFormId:
            candidate.finalInterviewTemplateFormId ||
            candidate.final_interview_template_form_id ||
            candidate.finalInterviewFormId ||
            candidate.final_interview_form_id ||
            "",
        }),
      {
        refresh: true,
        /*
         * CandidatePipelineModal displays this Success modal locally
         * because it navigates to the final interview form after OK.
         */
        showSuccessModal: false,
      },
    );
  }

  async function handleSubmitFinalInterview({
    candidateId,
    candidateApplicationId,
    effectiveCandidateApplicationId,
    positionId,
    formId,
    submissionId,
    formName = "",
    passingScore = 80,
    answers = {},
    fieldsSnapshot = [],
    scoreSummary = {},
  }) {
    const resolvedCandidateApplicationId =
      candidateApplicationId || effectiveCandidateApplicationId || "";

    const matchedCandidate = candidateList.find((candidate) => {
      return (
        String(candidate.candidateId || "") === String(candidateId || "") ||
        String(candidate.candidateApplicationId || "") ===
          String(resolvedCandidateApplicationId || "") ||
        String(candidate.applicationId || "") ===
          String(resolvedCandidateApplicationId || "") ||
        String(candidate.id || "") === String(resolvedCandidateApplicationId || "")
      );
    });

    if (!matchedCandidate) {
      console.warn("FINAL INTERVIEW SUBMIT: Candidate not found", {
        candidateId,
        candidateApplicationId: resolvedCandidateApplicationId,
      });

      const message = "Candidate was not found for final interview submission.";
      showError(message);
      return {
        success: false,
        message,
      };
    }

    const id = getCandidateRecordId(matchedCandidate);
    const finalFormId = formId || "default-job-evaluation";
    const finalFormName = formName || "Job Evaluation Form";

    const response = await runCandidateAction(
      () =>
        submitCandidatePipelineFinalInterview(id, {
          candidateId: matchedCandidate.candidateId || candidateId || "",
          candidateApplicationId:
            matchedCandidate.candidateApplicationId ||
            matchedCandidate.id ||
            resolvedCandidateApplicationId ||
            "",
          positionId: positionId || "",
          formId: finalFormId,
          submissionId: submissionId || undefined,
          formName: finalFormName,
          passingScore,
          answers,
          fieldsSnapshot,
          scoreSummary,
          interviewNotes: "Final interview form was submitted.",
          remarks: "Final interview / job evaluation submitted.",
        }),
      {
        showSuccessModal: false,
      },
    );

    if (response?.success) {
      const finalStage = normalizePipelineStageName(
        response?.finalStage ||
          response?.final_stage ||
          (response?.outcome === "final-interview-failed"
            ? "Drop-off"
            : "Interviewed"),
      );

      setActiveStage(finalStage);
    }

    return response;
  }

  function updateCandidateFromOffer(updatedCandidatePayload) {
    if (!updatedCandidatePayload) return;

    const normalizedCandidate =
      normalizePipelineCandidateForBoard(updatedCandidatePayload);

    setCandidateList((prev) =>
      mergeUpdatedCandidateList(prev, normalizedCandidate),
    );
    syncSelectedCandidate(normalizedCandidate);

    if (
      normalizedCandidate.currentStage === "Accepted" ||
      normalizedCandidate.stage === "Accepted" ||
      normalizedCandidate.pipelineStage === "Accepted"
    ) {
      setActiveStage("Accepted");
    }

    window.dispatchEvent(
      new CustomEvent("ta-pipeline-candidates-updated", {
        detail: normalizedCandidate,
      }),
    );
  }

  function resetConnectedRecruitmentStorage() {
    refreshCandidatePipeline();
  }

  async function handleResetSampleData() {
    await refreshCandidatePipeline();
  }

  const value = {
    user,
    currentUserName,

    candidateList,
    setCandidateList,
    candidates: candidateList,
    hasLoadedStorage,

    isLoading,
    isSaving,
    loadError,
    refreshCandidatePipeline,

    search,
    setSearch,
    roleFilter,
    setRoleFilter,
    accountFilter,
    setAccountFilter,
    activeStage: normalizedActiveStage,
    setActiveStage: (stage) => setActiveStage(normalizePipelineStageName(stage)),
    pageView,
    setPageView,

    roleOptions,
    accountOptions,

    selectedCandidate,
    setSelectedCandidate,

    moveCandidate,
    setMoveCandidate,
    moveForm,
    setMoveForm,

    scheduleCandidate,
    setScheduleCandidate,
    scheduleForm,
    setScheduleForm,

    assessmentCandidate,
    setAssessmentCandidate,
    assessmentForm,
    setAssessmentForm,

    dropOffCandidate,
    setDropOffCandidate,
    dropOffForm,
    setDropOffForm,

    offerCandidate,
    setOfferCandidate,
    offerForm,
    setOfferForm,
    offerSubmitting,

    hideInterviewColumns,
    showAssessmentStatusColumn,
    showAssessmentResultColumn,
    showStatusColumn,

    filteredCandidates,
    stageVisibleCandidates,
    stageCounts,
    metrics,
    stageFilteredCandidates,

    incompleteRequirementsStage: INCOMPLETE_REQUIREMENTS_STAGE,
    onboardingStage: ONBOARDING_STAGE,

    syncSelectedCandidate,
    updateCandidateRecord,
    updateCandidateFromOffer,
    handleNhoUploadsSaved,

    handleUpdatePrfStatus,
    handleOpenScheduleInterview,
    handleCloseScheduleInterview,
    handleSubmitScheduleInterview,
    handleCancelInterview,
    handleCompleteInterview,
    handleSaveInterviewNotes,

    handleOpenOfferModal,
    handleCloseOfferModal,
    handleReprofileOfferAccount,
    handleSubmitOfferDetails,
    handleUpdateOfferApproval,
    handleSendOfferEmail,
    handleOfferDecision,
    handleScheduleNhoAuto,

    handleOpenMoveModal,
    handleCloseMoveModal,
    handleSubmitMove,

    handleOpenAssessmentModal,
    handleCloseAssessmentModal,
    handleSendAssessmentEmail,
    handleSubmitAssessment,

    handleOpenDropOffModal,
    handleCloseDropOffModal,
    handleSubmitDropOff,

    handleResetSampleData,

    handleStartInterview,
    handleResendDropOffEmail,
    handleSubmitFinalInterview,

    resetConnectedRecruitmentStorage,

    closeAllPipelineModals,

    ConfirmationDialog,
  };

  return (
    <CandidatePipelineContext.Provider value={value}>
      {children}
      {ConfirmationDialog}

      <StatusModal
        open={statusModal.open}
        type={statusModal.type}
        title={statusModal.title}
        message={statusModal.message}
        onClose={closeStatusModal}
        variant="center"
        lockScroll
      />
    </CandidatePipelineContext.Provider>
  );
}

export function useCandidatePipeline() {
  const context = useContext(CandidatePipelineContext);

  if (!context) {
    throw new Error(
      "useCandidatePipeline must be used inside CandidatePipelineProvider",
    );
  }

  return context;
}

export default CandidatePipelineContext;