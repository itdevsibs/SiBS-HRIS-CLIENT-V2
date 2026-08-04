import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowRight,
  CalendarDays,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  X,
  UserX,
  Eye,
  ClipboardCheck,
  Mail,
  CirclePlay,
  UploadCloud,
  FileText,
  FileImage,
  FileSpreadsheet,
  Trash2,
  Check,
  Loader2,
} from "lucide-react";

import DetailRow from "../../layout/common/DetailRow";
import CandidateAvatar from "../../recruitment/candidatePipeline/CandidateAvatar";
import CandidateTalentPoolDetailsPanel from "../../recruitment/candidatePipeline/CandidateTalentPoolDetailsPanel";
import LeadPrfReviewCard from "../../recruitment/candidatePipeline/LeadPrfReviewCard";

import {
  offerApprovers,
  offerDecisionOptions,
} from "../../../lib/utils/candidatePipeline/candidatePipelineConstants";

import {
  formatDateTime,
  formatCurrency,
} from "../../../lib/utils/candidatePipeline/candidatePipelineFormatters";

import {
  getNextStage,
  hasInterviewSchedule,
  getAssessmentResult,
  getDisplayInterviewStatus,
  getDisplayInterviewType,
  canScheduleInterview,
  getStageClass,
  getPrfStatusClass,
  getInterviewStatusClass,
  getAssessmentResultClass,
  getOfferApprovalClass,
  getOfferDecisionClass,
  getOfferApprovalSummary,
  isOfferApproved,
  buildOfferContractLink,
} from "../../../lib/utils/candidatePipeline/candidatePipelineHelpers";

import {
  getVisibleCandidateTimeline,
  getVisibleMovementReason,
  isPipelineStageAtOrAfter,
  normalizePipelineStageForVisibility,
  shouldShowAssessmentArtifactsForTimelineEntry,
} from "../../../lib/utils/candidatePipeline/candidatePipelineStageVisibility";

import {
  getCandidatePipelineIdentityKey,
  getCandidatePipelineRecordId,
  isSameCandidatePipelineRecord,
  mergeCandidatePipelineRecord,
} from "../../../lib/utils/candidatePipeline/candidatePipelineIdentity";

import { useNavigate } from "react-router-dom";
import { useCandidatePipeline } from "../../../services/context/CandidatePipelineContext";
import GetAssessmentTimelineFiles from "../../../lib/utils/candidatePipeline/react-utils/GetAssessmentTimelineFiles";
import StatusModal from "../StatusModal";
import api from "../../../lib/axios/api-template";
import {
  findMatchingFinalInterviewForm,
  getCandidateAppliedPositionId,
  getCandidateAppliedPositionTitle,
  getFinalInterviewFormId,
  getFinalInterviewFormPositionId,
  getFinalInterviewFormPositionTitle,
} from "../../../lib/utils/recruitment/finalInterviewFormMatching";

const INCOMPLETE_ONBOARDING_STAGE = "For Onboarding - Incomplete Requirements";
const ONBOARDING_STAGE = "Onboarding";

const ACCEPTED_FILE_TYPES =
  ".pdf,.doc,.docx,.xls,.xlsx,.csv,.jpg,.jpeg,.png,.gif,.webp,.heic,.heif,.txt";

const SIBS_ASSESSMENT_LOGO_PREVIEW_URL = "/SiBSLogoNavy.png";

function formatCandidateDateOnly(value) {
  const text = String(value || "").trim();
  const match = text.match(/^(\d{4})-(\d{2})-(\d{2})/);

  if (!match) return formatDateTime(value) || "—";

  const date = new Date(
    Date.UTC(Number(match[1]), Number(match[2]) - 1, Number(match[3])),
  );

  return new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
    timeZone: "UTC",
  }).format(date);
}

const MAJOR_REQUIREMENTS = [
  "Transcript of Records and/or Diploma",
  "Medical Records",
  "NBI Clearance",
  "Birth Certificate",
  "Valid ID",
];

const PRE_EMPLOYMENT_REQUIREMENT_GROUPS = [
  {
    id: "major",
    title: "Major Requirements",
    badge: "Required before Onboarding",
    requirements: MAJOR_REQUIREMENTS,
  },
  {
    id: "other",
    title: "Other Requirements",
    badge: "",
    requirements: [
      "ID picture (2 pcs passport size)",
      "Urinalysis, Fecalysis, Pregnancy Test, Drug Test, Chest X-ray",
      "TIN Verification Slip",
      "SSS E1 Form",
      "PhilHealth MDR",
      "Pag-IBIG MDF",
      "Vaccination Card",
    ],
  },
  {
    id: "previous-employment",
    title: "Previous Employment",
    badge: "",
    requirements: ["BIR 2316 Form", "Employment Certificate"],
  },
];

const ALL_REQUIREMENTS = PRE_EMPLOYMENT_REQUIREMENT_GROUPS.flatMap(
  (group) => group.requirements,
);

const ASSESSMENT_STATUS_OPTIONS = ["Not Take", "Taken"];
const ASSESSMENT_FAILURE_THRESHOLD = 30;
const ASSESSMENT_FAILURE_RESULT = "Assessment Not Fit";
const ASSESSMENT_PASS_RESULT = "Assessment Fit";

const ASSESSMENT_RESULT_OPTIONS = [
  "Assessment Fit",
  "Assessment Not Fit",
  "For Reassessment",
];

const ASSESSMENT_STATUS_DROPDOWN_OPTIONS = ASSESSMENT_STATUS_OPTIONS.map(
  (option) => ({
    value: option,
    label: option,
  }),
);

const ASSESSMENT_RESULT_DROPDOWN_OPTIONS = [
  {
    value: "",
    label: "Select assessment result",
  },
  ...ASSESSMENT_RESULT_OPTIONS.map((option) => ({
    value: option,
    label: option,
  })),
];

function getSuggestedAssessmentResult(scoreValue) {
  const cleanScore = cleanText(scoreValue);

  if (cleanScore === "") return "";

  const numericScore = Number(cleanScore);

  if (
    !Number.isFinite(numericScore) ||
    numericScore < 0 ||
    numericScore > 100
  ) {
    return "";
  }

  return numericScore < ASSESSMENT_FAILURE_THRESHOLD
    ? ASSESSMENT_FAILURE_RESULT
    : ASSESSMENT_PASS_RESULT;
}

function safeJsonParseValue(value, fallback = null) {
  if (!value) return fallback;

  if (typeof value === "object") return value;

  try {
    return JSON.parse(value);
  } catch {
    return fallback;
  }
}

function getLatestFinalInterviewSubmission(candidate = {}) {
  const submittedForms =
    candidate.finalInterviewSubmittedForms ||
    candidate.final_interview_submitted_forms ||
    candidate.finalInterviewSubmissions ||
    candidate.final_interview_submissions ||
    candidate.submittedFinalInterviewForms ||
    candidate.final_interview_submissions_json ||
    [];

  const parsedForms = Array.isArray(submittedForms)
    ? submittedForms
    : safeJsonParseValue(submittedForms, []);

  return [...(parsedForms || [])]
    .filter(Boolean)
    .sort((a, b) => {
      const aTime = new Date(
        a.submittedAtIso ||
          a.submitted_at_iso ||
          a.submittedAt ||
          a.submitted_at ||
          a.createdAt ||
          a.created_at ||
          0,
      ).getTime();

      const bTime = new Date(
        b.submittedAtIso ||
          b.submitted_at_iso ||
          b.submittedAt ||
          b.submitted_at ||
          b.createdAt ||
          b.created_at ||
          0,
      ).getTime();

      return (
        (Number.isFinite(bTime) ? bTime : 0) -
        (Number.isFinite(aTime) ? aTime : 0)
      );
    })[0];
}

function getTimelineFinalInterviewScoreSummary(item = {}, candidate = {}) {
  const latestSubmission = getLatestFinalInterviewSubmission(candidate) || {};

  const directSummary =
    item.scoreSummary ||
    item.score_summary ||
    item.extra?.scoreSummary ||
    item.extra?.score_summary ||
    item.finalInterviewScoreSummary ||
    item.final_interview_score_summary ||
    latestSubmission.scoreSummary ||
    latestSubmission.score_summary ||
    latestSubmission.finalInterviewScoreSummary ||
    latestSubmission.final_interview_score_summary ||
    {};

  const parsedSummary = safeJsonParseValue(directSummary, directSummary) || {};

  const finalInterviewSummary =
    parsedSummary.finalInterview ||
    parsedSummary.final_interview ||
    parsedSummary.finalInterviewSummary ||
    parsedSummary.final_interview_summary ||
    parsedSummary.finalInterviewScoreSummary ||
    parsedSummary.final_interview_score_summary ||
    {};

  const parsedFinalInterviewSummary =
    safeJsonParseValue(finalInterviewSummary, finalInterviewSummary) || {};

  const directResult =
    item.finalInterviewResult ||
    item.final_interview_result ||
    item.interviewResult ||
    item.interview_result ||
    item.extra?.finalInterviewResult ||
    item.extra?.final_interview_result ||
    item.extra?.interviewResult ||
    item.extra?.interview_result ||
    parsedFinalInterviewSummary.finalInterviewResult ||
    parsedFinalInterviewSummary.final_interview_result ||
    parsedFinalInterviewSummary.finalResult ||
    parsedFinalInterviewSummary.final_result ||
    parsedFinalInterviewSummary.interviewResult ||
    parsedFinalInterviewSummary.interview_result ||
    parsedFinalInterviewSummary.result ||
    latestSubmission.finalInterviewResult ||
    latestSubmission.final_interview_result ||
    latestSubmission.interviewResult ||
    latestSubmission.interview_result ||
    "";

  const directScore =
    item.finalInterviewScore ||
    item.final_interview_score ||
    item.interviewScore ||
    item.interview_score ||
    item.extra?.finalInterviewScore ||
    item.extra?.final_interview_score ||
    item.extra?.interviewScore ||
    item.extra?.interview_score ||
    parsedFinalInterviewSummary.finalInterviewScore ||
    parsedFinalInterviewSummary.final_interview_score ||
    parsedFinalInterviewSummary.interviewScore ||
    parsedFinalInterviewSummary.interview_score ||
    parsedFinalInterviewSummary.totalScore ||
    parsedFinalInterviewSummary.total_score ||
    parsedFinalInterviewSummary.score ||
    latestSubmission.finalInterviewScore ||
    latestSubmission.final_interview_score ||
    latestSubmission.interviewScore ||
    latestSubmission.interview_score ||
    "";

  const directMaxScore =
    item.finalInterviewMaxScore ||
    item.final_interview_max_score ||
    item.extra?.finalInterviewMaxScore ||
    item.extra?.final_interview_max_score ||
    parsedFinalInterviewSummary.finalInterviewMaxScore ||
    parsedFinalInterviewSummary.final_interview_max_score ||
    parsedFinalInterviewSummary.maxScore ||
    parsedFinalInterviewSummary.max_score ||
    parsedFinalInterviewSummary.totalPossibleScore ||
    parsedFinalInterviewSummary.total_possible_score ||
    latestSubmission.finalInterviewMaxScore ||
    latestSubmission.final_interview_max_score ||
    "";

  const directPercentage =
    item.finalInterviewPercentage ||
    item.final_interview_percentage ||
    item.extra?.finalInterviewPercentage ||
    item.extra?.final_interview_percentage ||
    parsedFinalInterviewSummary.finalInterviewPercentage ||
    parsedFinalInterviewSummary.final_interview_percentage ||
    parsedFinalInterviewSummary.percentage ||
    parsedFinalInterviewSummary.percent ||
    parsedFinalInterviewSummary.scorePercentage ||
    parsedFinalInterviewSummary.score_percentage ||
    latestSubmission.finalInterviewPercentage ||
    latestSubmission.final_interview_percentage ||
    "";

  const ratingCount =
    item.finalInterviewRatingCount ||
    item.final_interview_rating_count ||
    item.extra?.finalInterviewRatingCount ||
    item.extra?.final_interview_rating_count ||
    parsedFinalInterviewSummary.finalInterviewRatingCount ||
    parsedFinalInterviewSummary.final_interview_rating_count ||
    parsedFinalInterviewSummary.answeredRatingFields ||
    parsedFinalInterviewSummary.answered_rating_fields ||
    parsedFinalInterviewSummary.ratingCount ||
    parsedFinalInterviewSummary.rating_count ||
    parsedSummary.finalInterviewRatingCount ||
    parsedSummary.final_interview_rating_count ||
    parsedSummary.finalInterviewAnsweredRatingFields ||
    parsedSummary.final_interview_answered_rating_fields ||
    latestSubmission.finalInterviewRatingCount ||
    latestSubmission.final_interview_rating_count ||
    "";

  return {
    ...parsedSummary,
    ...parsedFinalInterviewSummary,
    finalInterviewResult: directResult,
    final_interview_result: directResult,
    finalResult: directResult,
    final_result: directResult,
    result: directResult,
    finalInterviewScore: directScore,
    final_interview_score: directScore,
    totalScore: directScore,
    total_score: directScore,
    score: directScore,
    finalInterviewMaxScore: directMaxScore,
    final_interview_max_score: directMaxScore,
    maxScore: directMaxScore,
    max_score: directMaxScore,
    finalInterviewPercentage: directPercentage,
    final_interview_percentage: directPercentage,
    percentage: directPercentage,
    percent: directPercentage,
    finalInterviewRatingCount: ratingCount,
    final_interview_rating_count: ratingCount,
  };
}

function isNoRatingFinalInterviewValue(value = "") {
  const text = cleanText(value).toLowerCase();

  return (
    !text ||
    text === "no rating" ||
    text === "no rating recorded" ||
    text === "not rated" ||
    text === "n/a" ||
    text === "na" ||
    text === "none" ||
    text === "—" ||
    text === "-"
  );
}

function hasFinalInterviewRating(scoreSummary = {}) {
  const directResult =
    scoreSummary.finalInterviewResult ||
    scoreSummary.final_interview_result ||
    scoreSummary.finalResult ||
    scoreSummary.final_result ||
    scoreSummary.interviewResult ||
    scoreSummary.interview_result ||
    "";

  if (directResult && !isNoRatingFinalInterviewValue(directResult)) {
    return true;
  }

  const ratingCount = Number(
    scoreSummary.finalInterviewRatingCount ??
      scoreSummary.final_interview_rating_count ??
      scoreSummary.answeredRatingFields ??
      scoreSummary.answered_rating_fields ??
      scoreSummary.ratingCount ??
      scoreSummary.rating_count ??
      "",
  );

  if (Number.isFinite(ratingCount) && ratingCount > 0) {
    return true;
  }

  const finalScore =
    scoreSummary.finalInterviewScore ??
    scoreSummary.final_interview_score ??
    scoreSummary.interviewScore ??
    scoreSummary.interview_score ??
    "";

  const finalPercentage =
    scoreSummary.finalInterviewPercentage ??
    scoreSummary.final_interview_percentage ??
    "";

  return cleanText(finalScore) !== "" || cleanText(finalPercentage) !== "";
}

function getFinalInterviewResult(scoreSummary = {}) {
  const directResult =
    scoreSummary.finalInterviewResult ||
    scoreSummary.final_interview_result ||
    scoreSummary.finalResult ||
    scoreSummary.final_result ||
    scoreSummary.interviewResult ||
    scoreSummary.interview_result ||
    "";

  if (directResult && !isNoRatingFinalInterviewValue(directResult)) {
    return cleanText(directResult);
  }

  if (!hasFinalInterviewRating(scoreSummary)) {
    return "";
  }

  if (typeof scoreSummary.passed === "boolean") {
    return scoreSummary.passed ? "Passed" : "Failed";
  }

  const totalScore = Number(
    scoreSummary.finalInterviewScore ??
      scoreSummary.final_interview_score ??
      scoreSummary.interviewScore ??
      scoreSummary.interview_score,
  );

  const passingScore = Number(
    scoreSummary.finalInterviewPassingScore ??
      scoreSummary.final_interview_passing_score ??
      scoreSummary.passingScore ??
      scoreSummary.passing_score ??
      80,
  );

  if (Number.isFinite(totalScore) && Number.isFinite(passingScore)) {
    return totalScore >= passingScore ? "Passed" : "Failed";
  }

  return "";
}

function getFinalInterviewScoreDisplay(scoreSummary = {}) {
  if (!hasFinalInterviewRating(scoreSummary)) {
    return "";
  }

  const totalScore =
    scoreSummary.finalInterviewScore ??
    scoreSummary.final_interview_score ??
    scoreSummary.interviewScore ??
    scoreSummary.interview_score ??
    "";

  const maxScore =
    scoreSummary.finalInterviewMaxScore ??
    scoreSummary.final_interview_max_score ??
    scoreSummary.maxScore ??
    scoreSummary.max_score ??
    "";

  const percentage =
    scoreSummary.finalInterviewPercentage ??
    scoreSummary.final_interview_percentage ??
    scoreSummary.percentage ??
    scoreSummary.percent ??
    "";

  if (totalScore !== "" && maxScore !== "") {
    return `${totalScore} / ${maxScore}`;
  }

  if (percentage !== "") {
    return `${percentage}%`;
  }

  if (totalScore !== "") {
    return String(totalScore);
  }

  return "";
}


function getJobEvaluationScoreDisplay(scoreSummary = {}) {
  const directSummary =
    scoreSummary.jobEvaluation ||
    scoreSummary.job_evaluation ||
    scoreSummary.jobEvaluationScore ||
    scoreSummary.job_evaluation_score ||
    {};

  const parsedSummary =
    safeJsonParseValue(directSummary, directSummary) || {};

  const totalScore =
    parsedSummary.totalScore ??
    parsedSummary.total_score ??
    parsedSummary.percentageScore ??
    parsedSummary.percentage_score ??
    parsedSummary.score ??
    scoreSummary.jobEvaluationTotalScore ??
    scoreSummary.job_evaluation_total_score ??
    scoreSummary.jobEvaluationPercentage ??
    scoreSummary.job_evaluation_percentage ??
    "";

  if (cleanText(totalScore) === "") {
    return "";
  }

  const maximumScore =
    parsedSummary.maxScore ??
    parsedSummary.max_score ??
    parsedSummary.maximumScore ??
    parsedSummary.maximum_score ??
    scoreSummary.jobEvaluationMaxScore ??
    scoreSummary.job_evaluation_max_score ??
    100;

  const rankValue =
    parsedSummary.rank ??
    parsedSummary.jobEvaluationRank ??
    parsedSummary.job_evaluation_rank ??
    scoreSummary.jobEvaluationRank ??
    scoreSummary.job_evaluation_rank ??
    "";

  function formatScoreValue(value, fallback = "") {
    if (value === null || value === undefined || value === "") {
      return fallback;
    }

    const numberValue = Number(value);

    if (!Number.isFinite(numberValue)) {
      return cleanText(value);
    }

    return numberValue.toLocaleString("en-PH", {
      maximumFractionDigits: 2,
    });
  }

  const scoreText = formatScoreValue(totalScore);
  const maximumText = formatScoreValue(maximumScore, "100");
  const cleanRank = cleanText(rankValue).replace(/^rank\s+/i, "");

  return `${scoreText} / ${maximumText}${
    cleanRank ? ` · Rank ${cleanRank}` : ""
  }`;
}

function getFinalInterviewResultClass(result = "") {
  const value = cleanText(result).toLowerCase();

  if (
    value.includes("pass") ||
    value.includes("fit") ||
    value.includes("recommended") ||
    value.includes("hire")
  ) {
    return "border-emerald-100 bg-emerald-50 text-emerald-700";
  }

  if (
    value.includes("fail") ||
    value.includes("not") ||
    value.includes("reject") ||
    value.includes("decline")
  ) {
    return "border-red-100 bg-red-50 text-red-700";
  }

  return "border-blue-100 bg-blue-50 text-sibs-primary-1";
}

function formatAssessmentScoreDisplay(value) {
  const text = cleanText(value);

  if (!text) return "";

  const numberValue = Number(text);

  if (!Number.isFinite(numberValue)) return text;

  return `${numberValue.toLocaleString("en-PH", {
    maximumFractionDigits: 2,
  })} / 100`;
}

function getTimelineAssessmentScore(item = {}) {
  return (
    item.assessmentScore ??
    item.assessment_score ??
    item.extra?.assessmentScore ??
    item.extra?.assessment_score ??
    ""
  );
}

function cleanText(value) {
  return String(value ?? "").trim();
}

function getHistoryTitle(item = {}) {
  return cleanText(
    item.stage ||
      item.title ||
      item.pipelineStage ||
      item.pipeline_stage ||
      item.currentStage ||
      item.current_stage ||
      item.status ||
      "",
  );
}

function isUncommittedPrfStatusTimelineEntry(item = {}) {
  const reasonText = cleanText(
    item.reason ||
      item.description ||
      item.message ||
      item.note ||
      "",
  ).toLowerCase();

  const remarksText = cleanText(item.remarks).toLowerCase();
  const stageText = getHistoryTitle(item).toLowerCase();

  const isPrfSelectionOnly =
    /^prf status (?:updated|changed) to (?:matched|not matched)\.?$/.test(
      reasonText,
    ) ||
    /^prf status:\s*(?:matched|not matched)\.?$/.test(remarksText);

  const hasCommittedMovement = Boolean(
    cleanText(
      item.toStage ||
        item.to_stage ||
        item.extra?.toStage ||
        item.extra?.to_stage ||
        "",
    ),
  );

  const isCommittedStage = [
    "online assessment",
    "drop-off",
    "drop off",
  ].includes(stageText);

  return isPrfSelectionOnly && !hasCommittedMovement && !isCommittedStage;
}

function isFinalInterviewTimelineItem(item = {}) {
  const stageText = getHistoryTitle(item).toLowerCase();
  const reasonText = cleanText(item.reason).toLowerCase();
  const remarksText = cleanText(item.remarks).toLowerCase();

  return (
    stageText === "interviewed" ||
    stageText.includes("final interview") ||
    reasonText.includes("final interview") ||
    reasonText.includes("job evaluation") ||
    remarksText.includes("final interview") ||
    remarksText.includes("job evaluation")
  );
}


function getLatestFinalInterviewTimelineIndex(items = []) {
  const safeItems = Array.isArray(items)
    ? items
    : [];

  for (
    let index = safeItems.length - 1;
    index >= 0;
    index -= 1
  ) {
    if (isFinalInterviewTimelineItem(safeItems[index])) {
      return index;
    }
  }

  return -1;
}

function normalizeRequirement(value = "") {
  return cleanText(value).toLowerCase().replace(/\s+/g, " ");
}

function normalizeRequirementSlug(value = "") {
  return cleanText(value)
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
}

function getOfficialRequirementMatch(value = "") {
  const key = normalizeRequirementSlug(value);

  if (!key) return "";

  return (
    ALL_REQUIREMENTS.find((requirement) => {
      const requirementKey = normalizeRequirementSlug(requirement);

      return (
        key === requirementKey ||
        key.startsWith(`${requirementKey}_`) ||
        key.includes(requirementKey)
      );
    }) || ""
  );
}

function getOfficialRequirementFromFile(file = {}) {
  const directRequirement =
    file.requirement || file.label || file.category || file.title || "";

  const directMatch = getOfficialRequirementMatch(directRequirement);

  if (directMatch) return directMatch;

  const filename =
    file.savedFileName ||
    file.saved_file_name ||
    file.filename ||
    file.storedFileName ||
    file.stored_file_name ||
    file.fileName ||
    file.name ||
    file.originalName ||
    file.originalname ||
    file.filePath ||
    file.storedPath ||
    "";

  return getOfficialRequirementMatch(filename);
}

function isOfficialNhoFile(file = {}) {
  return Boolean(getOfficialRequirementFromFile(file));
}

function isMajorRequirement(requirement = "") {
  const key = normalizeRequirement(requirement);

  return MAJOR_REQUIREMENTS.some(
    (item) => normalizeRequirement(item) === key,
  );
}

function formatFileSize(size = 0) {
  const numberSize = Number(size || 0);

  if (!numberSize) return "—";

  const kb = numberSize / 1024;

  if (kb < 1024) return `${kb.toFixed(1)} KB`;

  return `${(kb / 1024).toFixed(1)} MB`;
}

function getFileIcon(fileName = "") {
  const value = String(fileName || "").toLowerCase();

  if (/\.(jpg|jpeg|png|gif|webp|heic|heif)$/i.test(value)) return FileImage;
  if (/\.(xls|xlsx|csv)$/i.test(value)) return FileSpreadsheet;

  return FileText;
}

function getCurrentTimestamp() {
  return new Date().toLocaleString("en-PH", {
    year: "numeric",
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function getApiErrorMessage(error, fallback = "Request failed.") {
  return (
    error?.response?.data?.message ||
    error?.response?.data?.error ||
    error?.message ||
    fallback
  );
}

function getResolvedFileUrl(fileUrl = "") {
  const value = cleanText(fileUrl);

  if (!value) return "";

  if (
    value.startsWith("http://") ||
    value.startsWith("https://") ||
    value.startsWith("data:") ||
    value.startsWith("blob:")
  ) {
    return value;
  }

  const apiBaseUrl = cleanText(import.meta.env.VITE_API_URL).replace(/\/+$/, "");

  if (value.startsWith("/api/") && apiBaseUrl) {
    return `${apiBaseUrl}${value}`;
  }

  return value;
}

function isRawBrowserFile(file) {
  return typeof File !== "undefined" && file instanceof File;
}

function buildCandidatePipelineFileUrl(candidateId = "", file = {}) {
  const filename =
    file.savedFileName ||
    file.saved_file_name ||
    file.filename ||
    file.storedFileName ||
    file.stored_file_name ||
    file.fileName ||
    file.name ||
    "";

  if (!candidateId || !filename) return "";

  return `/api/candidate-pipeline/file/${encodeURIComponent(
    candidateId,
  )}/${encodeURIComponent(filename)}`;
}

function normalizeUploadedFile(file = {}, candidateId = "") {
  const savedFileName =
    file.savedFileName ||
    file.saved_file_name ||
    file.filename ||
    file.storedFileName ||
    file.stored_file_name ||
    "";

  const fileName =
    file.fileName ||
    file.name ||
    file.originalName ||
    file.originalname ||
    savedFileName ||
    "";

  const rawFileUrl =
    file.fileUrl ||
    file.url ||
    file.dataUrl ||
    file.previewUrl ||
    file.downloadUrl ||
    buildCandidatePipelineFileUrl(candidateId, {
      ...file,
      fileName,
      savedFileName,
    });

  const officialRequirement = getOfficialRequirementFromFile({
    ...file,
    savedFileName,
    fileName,
  });

  return {
    ...file,
    id:
      file.id ||
      file.fileId ||
      file.file_id ||
      `NHO-FILE-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    requirement:
      officialRequirement ||
      file.requirement ||
      file.label ||
      file.category ||
      "",
    fileName,
    savedFileName,
    filename: file.filename || savedFileName,
    fileSize: file.fileSize || file.size || 0,
    fileType:
      file.fileType ||
      file.type ||
      file.mimetype ||
      file.mimeType ||
      "application/octet-stream",
    fileUrl: getResolvedFileUrl(rawFileUrl),
    filePath: file.filePath || file.storedPath || file.path || "",
    storedPath: file.storedPath || file.filePath || file.path || "",
    uploadedAt:
      file.uploadedAt ||
      file.uploaded_at ||
      file.createdAt ||
      file.created_at ||
      file.updatedAt ||
      file.updated_at ||
      "",
    uploadedBy:
      file.uploadedBy ||
      file.uploaded_by ||
      file.createdBy ||
      file.created_by ||
      file.updatedBy ||
      file.updated_by ||
      "",
    applicantFolderName:
      file.applicantFolderName ||
      file.applicant_folder_name ||
      file.folderName ||
      "",
    candidatePipelineId:
      file.candidatePipelineId ||
      file.candidate_pipeline_id ||
      file.ownerCandidatePipelineId ||
      file.owner_candidate_pipeline_id ||
      candidateId ||
      "",
    candidate_pipeline_id:
      file.candidate_pipeline_id ||
      file.candidatePipelineId ||
      file.owner_candidate_pipeline_id ||
      file.ownerCandidatePipelineId ||
      candidateId ||
      "",
    ownerCandidatePipelineId:
      file.ownerCandidatePipelineId ||
      file.owner_candidate_pipeline_id ||
      file.candidatePipelineId ||
      file.candidate_pipeline_id ||
      candidateId ||
      "",
    owner_candidate_pipeline_id:
      file.owner_candidate_pipeline_id ||
      file.ownerCandidatePipelineId ||
      file.candidate_pipeline_id ||
      file.candidatePipelineId ||
      candidateId ||
      "",
    rawFile: file.rawFile || null,
  };
}

function getNhoFileOwnerRecordId(file = {}) {
  return cleanText(
    file.ownerCandidatePipelineId ||
      file.owner_candidate_pipeline_id ||
      file.candidatePipelineId ||
      file.candidate_pipeline_id,
  );
}

function isNhoFileOwnedByCandidate(
  file = {},
  candidateRecordId = "",
) {
  const expectedRecordId = cleanText(
    candidateRecordId,
  ).toLowerCase();

  const ownerRecordId = getNhoFileOwnerRecordId(
    file,
  ).toLowerCase();

  if (!expectedRecordId || !ownerRecordId) {
    return true;
  }

  return ownerRecordId === expectedRecordId;
}

function normalizeOfficialUploadedFile(file = {}, candidateId = "") {
  if (!isOfficialNhoFile(file)) return null;

  return normalizeUploadedFile(file, candidateId);
}

function filterOfficialUploadedFiles(files = [], candidateId = "") {
  return files
    .filter(Boolean)
    .filter((file) =>
      isNhoFileOwnedByCandidate(
        file,
        candidateId,
      ),
    )
    .map((file) => normalizeOfficialUploadedFile(file, candidateId))
    .filter(Boolean)
    .filter((file) =>
      isNhoFileOwnedByCandidate(
        file,
        candidateId,
      ),
    );
}

function getRequirementSortIndex(requirement = "") {
  const key = normalizeRequirement(requirement);

  const index = ALL_REQUIREMENTS.findIndex(
    (item) => normalizeRequirement(item) === key,
  );

  return index === -1 ? 9999 : index;
}

function getNhoFileIdentity(file = {}) {
  const safeFile = file && typeof file === "object" ? file : {};

  return cleanText(
    safeFile.storedPath ||
      safeFile.stored_path ||
      safeFile.filePath ||
      safeFile.file_path ||
      safeFile.savedFileName ||
      safeFile.saved_file_name ||
      safeFile.filename ||
      safeFile.fileUrl ||
      safeFile.url ||
      safeFile.id ||
      `${safeFile.fileName || safeFile.name || "file"}:${safeFile.fileSize || safeFile.size || 0}`,
  ).toLowerCase();
}

function dedupeFiles(files = [], candidateId = "") {
  const map = new Map();

  filterOfficialUploadedFiles(files, candidateId).forEach((file) => {
    const requirementKey = normalizeRequirement(file.requirement);
    const fileIdentity = getNhoFileIdentity(file);

    if (!requirementKey || !fileIdentity) return;

    const key = `${requirementKey}::${fileIdentity}`;
    const current = map.get(key);

    if (!current) {
      map.set(key, file);
      return;
    }

    const currentPersisted = isPersistedNhoFile(current);
    const nextPersisted = isPersistedNhoFile(file);

    if (!currentPersisted && nextPersisted) {
      map.set(key, {
        ...current,
        ...file,
      });
      return;
    }

    const currentDate = new Date(current.uploadedAt || 0).getTime();
    const nextDate = new Date(file.uploadedAt || 0).getTime();

    if (!Number.isFinite(currentDate) || nextDate >= currentDate) {
      map.set(key, {
        ...current,
        ...file,
      });
    }
  });

  return Array.from(map.values()).sort((a, b) => {
    const aMajor = isMajorRequirement(a.requirement) ? 0 : 1;
    const bMajor = isMajorRequirement(b.requirement) ? 0 : 1;

    if (aMajor !== bMajor) return aMajor - bMajor;

    const requirementSort =
      getRequirementSortIndex(a.requirement) -
      getRequirementSortIndex(b.requirement);

    if (requirementSort !== 0) return requirementSort;

    const dateSort =
      new Date(a.uploadedAt || 0).getTime() -
      new Date(b.uploadedAt || 0).getTime();

    if (Number.isFinite(dateSort) && dateSort !== 0) return dateSort;

    return cleanText(a.fileName).localeCompare(cleanText(b.fileName));
  });
}


function mergeLoadedNhoFilesWithPendingFiles(
  loadedFiles = [],
  currentFiles = [],
  candidateId = "",
) {
  const pendingFiles = currentFiles.filter((file) =>
    isRawBrowserFile(file?.rawFile),
  );

  return dedupeFiles(
    [
      ...pendingFiles,
      ...loadedFiles,
    ],
    candidateId,
  );
}

function getNhoRoutedStageFromPayload(
  payload = {},
  candidate = {},
  savedMajorProgress = {},
) {
  const responsePayload = payload?.data ?? payload;

  const payloadStage =
    cleanText(payload.routedStage) ||
    cleanText(payload.routed_stage) ||
    cleanText(payload.nextStage) ||
    cleanText(payload.next_stage) ||
    cleanText(responsePayload?.routedStage) ||
    cleanText(responsePayload?.routed_stage) ||
    cleanText(responsePayload?.nextStage) ||
    cleanText(responsePayload?.next_stage);

  const candidateStage =
    cleanText(candidate?.currentStage) ||
    cleanText(candidate?.current_stage) ||
    cleanText(candidate?.currentPipelineStage) ||
    cleanText(candidate?.current_pipeline_stage) ||
    cleanText(candidate?.pipelineStage) ||
    cleanText(candidate?.pipeline_stage) ||
    cleanText(candidate?.stage);

  if (payloadStage) return payloadStage;
  if (candidateStage) return candidateStage;

  return savedMajorProgress?.isComplete
    ? ONBOARDING_STAGE
    : INCOMPLETE_ONBOARDING_STAGE;
}

function sortUploadedFiles(files = []) {
  return files.slice().sort((a, b) => {
    const requirementSort =
      getRequirementSortIndex(a.requirement) -
      getRequirementSortIndex(b.requirement);

    if (requirementSort !== 0) return requirementSort;

    return cleanText(a.fileName).localeCompare(cleanText(b.fileName));
  });
}

function calculateProgress(files = [], requirements = ALL_REQUIREMENTS) {
  const uploadedMap = new Map();

  filterOfficialUploadedFiles(files).forEach((file) => {
    const key = normalizeRequirement(file.requirement);
    if (key) uploadedMap.set(key, file);
  });

  const completed = requirements.filter((requirement) =>
    uploadedMap.has(normalizeRequirement(requirement)),
  ).length;

  const total = requirements.length;
  const percent = total ? Math.round((completed / total) * 100) : 0;

  return {
    completed,
    total,
    percent,
    isComplete: total > 0 && completed >= total,
  };
}

function getFilesFromApiPayload(payload) {
  const responsePayload = payload?.data ?? payload;

  if (Array.isArray(responsePayload)) return responsePayload;
  if (Array.isArray(responsePayload?.files)) return responsePayload.files;
  if (Array.isArray(responsePayload?.data?.files)) {
    return responsePayload.data.files;
  }
  if (Array.isArray(responsePayload?.candidate?.nhoFiles)) {
    return responsePayload.candidate.nhoFiles;
  }
  if (Array.isArray(responsePayload?.candidate?.nho_files)) {
    return responsePayload.candidate.nho_files;
  }
  if (Array.isArray(responsePayload?.data?.nhoFiles)) {
    return responsePayload.data.nhoFiles;
  }
  if (Array.isArray(responsePayload?.data?.nho_files)) {
    return responsePayload.data.nho_files;
  }

  return [];
}

function getCandidateFromApiPayload(payload) {
  const responsePayload = payload?.data ?? payload;

  if (!responsePayload || typeof responsePayload !== "object") {
    return null;
  }

  return (
    responsePayload.candidate ||
    responsePayload.data?.candidate ||
    responsePayload.data ||
    responsePayload
  );
}


function unwrapCandidatePipelineResponse(response) {
  if (!response || typeof response !== "object") {
    return {};
  }

  const isAxiosResponse =
    Object.prototype.hasOwnProperty.call(response, "status") ||
    Object.prototype.hasOwnProperty.call(response, "headers") ||
    Object.prototype.hasOwnProperty.call(response, "config") ||
    Object.prototype.hasOwnProperty.call(response, "request");

  if (isAxiosResponse && response.data !== undefined) {
    return response.data || {};
  }

  return response;
}

function isPersistedNhoFile(file = {}) {
  const savedName = cleanText(
    file.savedFileName ||
      file.saved_file_name ||
      file.filename ||
      file.storedFileName ||
      file.stored_file_name,
  );

  const savedPath = cleanText(
    file.storedPath ||
      file.stored_path ||
      file.filePath ||
      file.file_path ||
      file.path,
  );

  const fileUrl = cleanText(
    file.fileUrl ||
      file.url ||
      file.downloadUrl ||
      file.download_url,
  );

  return Boolean(
    savedName ||
      savedPath ||
      (fileUrl &&
        !fileUrl.startsWith("blob:") &&
        !fileUrl.startsWith("data:")),
  );
}

function isSameNhoReadBackFile(
  pendingFile = {},
  savedFile = {},
) {
  if (
    normalizeRequirement(pendingFile.requirement) !==
      normalizeRequirement(savedFile.requirement) ||
    !isPersistedNhoFile(savedFile)
  ) {
    return false;
  }

  const pendingName = cleanText(
    pendingFile.fileName ||
      pendingFile.name,
  ).toLowerCase();

  const savedName = cleanText(
    savedFile.fileName ||
      savedFile.originalName ||
      savedFile.original_name,
  ).toLowerCase();

  const pendingSize = Number(
    pendingFile.fileSize ||
      pendingFile.size ||
      0,
  );

  const savedSize = Number(
    savedFile.fileSize ||
      savedFile.size ||
      0,
  );

  return Boolean(
    (pendingName &&
      savedName &&
      pendingName === savedName) ||
      (pendingSize > 0 &&
        savedSize > 0 &&
        pendingSize === savedSize),
  );
}

function getMissingReadBackNhoFiles(
  pendingFiles = [],
  savedFiles = [],
) {
  return pendingFiles.filter(
    (pendingFile) =>
      !savedFiles.some((savedFile) =>
        isSameNhoReadBackFile(
          pendingFile,
          savedFile,
        ),
      ),
  );
}

async function verifyNhoFilesByReadBack({
  candidateId,
  pendingFiles = [],
}) {
  const response = await api.get(
    `/api/candidate-pipeline/${encodeURIComponent(
      candidateId,
    )}/nho/files`,
    {
      withCredentials: true,
      params: {
        _t: Date.now(),
        verification: "read-back",
      },
    },
  );

  const payload =
    unwrapCandidatePipelineResponse(response);

  if (payload?.success === false) {
    throw new Error(
      payload?.message ||
        "Unable to verify the uploaded files.",
    );
  }

  const savedFiles = dedupeFiles(
    getFilesFromApiPayload(payload),
    candidateId,
  );

  const missingFiles =
    getMissingReadBackNhoFiles(
      pendingFiles,
      savedFiles,
    );

  if (missingFiles.length) {
    const missingRequirements = missingFiles
      .map((file) => file.requirement)
      .filter(Boolean)
      .join(", ");

    throw new Error(
      `The server did not return the saved file${
        missingFiles.length === 1 ? "" : "s"
      } for: ${
        missingRequirements ||
        "the selected requirements"
      }.`,
    );
  }

  return {
    payload,
    files: savedFiles,
    candidate:
      getCandidateFromApiPayload(payload) ||
      {},
  };
}

function getCandidateStageValue(candidate = {}) {
  return cleanText(
    candidate.currentStage ||
      candidate.current_stage ||
      candidate.currentPipelineStage ||
      candidate.current_pipeline_stage ||
      candidate.pipelineStage ||
      candidate.pipeline_stage ||
      candidate.stage,
  );
}

async function refreshNhoCandidate(candidateId) {
  const response = await api.get(
    `/api/candidate-pipeline/${encodeURIComponent(
      candidateId,
    )}`,
    {
      withCredentials: true,
      params: {
        _t: Date.now(),
      },
    },
  );

  const payload =
    unwrapCandidatePipelineResponse(response);

  return (
    getCandidateFromApiPayload(payload) ||
    {}
  );
}

async function ensureNhoCandidateStage({
  candidateId,
  candidate,
  majorProgress,
  files,
}) {
  const expectedStage =
    majorProgress?.isComplete
      ? ONBOARDING_STAGE
      : INCOMPLETE_ONBOARDING_STAGE;

  if (
    getCandidateStageValue(candidate) ===
    expectedStage
  ) {
    return candidate;
  }

  const response = await api.post(
    `/api/candidate-pipeline/${encodeURIComponent(
      candidateId,
    )}/move`,
    {
      targetStage: expectedStage,
      nextStage: expectedStage,
      stage: expectedStage,
      reason:
        expectedStage === ONBOARDING_STAGE
          ? "Candidate completed all 5 major pre-employment requirements."
          : "Candidate has incomplete major pre-employment requirements.",
      remarks:
        `${majorProgress.completed || 0} / ${
          majorProgress.total || 5
        } major requirements saved.`,
      nhoFiles: files,
      majorProgress,
    },
    {
      withCredentials: true,
    },
  );

  const payload =
    unwrapCandidatePipelineResponse(response);

  if (payload?.success === false) {
    throw new Error(
      payload?.message ||
        "Files were saved, but the candidate stage could not be updated.",
    );
  }

  return (
    getCandidateFromApiPayload(payload) ||
    candidate
  );
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

function getPrfReviewCardDisplayStatus(value) {
  const normalizedStatus = normalizePrfStatus(value);

  return normalizedStatus === "Not Matched"
    ? "Unmatched"
    : normalizedStatus;
}

function FormDropdown({
  label,
  value,
  options = [],
  placeholder = "Select option...",
  disabled = false,
  dropdownId = "",
  openDropdownId = "",
  onOpenDropdownChange,
  onChange,
}) {
  const dropdownRef = useRef(null);
  const [internalOpen, setInternalOpen] = useState(false);

  const isControlled = Boolean(
    dropdownId && typeof onOpenDropdownChange === "function",
  );

  const open = isControlled
    ? openDropdownId === dropdownId
    : internalOpen;

  const selectedOption = options.find((option) => option.value === value);

  useEffect(() => {
    function closeDropdown() {
      if (isControlled) {
        onOpenDropdownChange("");
        return;
      }

      setInternalOpen(false);
    }

    function handleClickOutside(event) {
      if (!dropdownRef.current) return;

      if (!dropdownRef.current.contains(event.target)) {
        closeDropdown();
      }
    }

    function handleEscape(event) {
      if (event.key === "Escape") {
        closeDropdown();
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [isControlled, onOpenDropdownChange]);

  function handleToggle() {
    if (disabled) return;

    if (isControlled) {
      onOpenDropdownChange(open ? "" : dropdownId);
      return;
    }

    setInternalOpen((previous) => !previous);
  }

  function handleSelect(option) {
    if (disabled) return;

    onChange?.(option.value);

    if (isControlled) {
      onOpenDropdownChange("");
      return;
    }

    setInternalOpen(false);
  }

  return (
    <label className="block">
      {label && (
        <span className="text-xs font-extrabold uppercase tracking-wide text-sibs-primary-1">
          {label}
        </span>
      )}

      <div ref={dropdownRef} className="relative mt-2">
        <button
          type="button"
          disabled={disabled}
          onClick={handleToggle}
          className={`flex h-11 w-full items-center justify-between gap-3 rounded-xl border bg-white px-4 text-left text-sm font-bold shadow-sm outline-none transition ${
            open
              ? "border-sibs-primary-1 ring-4 ring-sibs-primary-1/10"
              : "border-[#D6DEE8] hover:border-sibs-primary-1"
          } ${
            disabled
              ? "cursor-not-allowed bg-slate-100 text-slate-400 opacity-70"
              : "text-[#344054]"
          }`}
        >
          <span
            className={`min-w-0 flex-1 truncate ${
              selectedOption ? "text-[#344054]" : "text-[#98A2B3]"
            }`}
          >
            {selectedOption?.label || placeholder}
          </span>

          <ChevronDown
            size={18}
            className={`shrink-0 text-sibs-primary-1 transition-transform duration-200 ${
              open ? "rotate-180" : ""
            }`}
          />
        </button>

        {open && !disabled && (
          <div className="absolute left-0 top-[calc(100%+8px)] z-[99999] max-h-[260px] w-full overflow-hidden rounded-xl border border-[#D6DEE8] bg-white shadow-[0_18px_45px_rgba(15,23,42,0.16)]">
            <div className="max-h-[260px] overflow-y-auto py-1">
              {options.map((option) => {
                const active = option.value === value;

                return (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => handleSelect(option)}
                    className={`flex min-h-[44px] w-full items-center px-4 text-left text-sm font-semibold transition ${
                      active
                        ? "bg-[#EAF2FB] text-sibs-primary-1"
                        : "bg-white text-[#475467] hover:bg-[#F8FAFC] hover:text-sibs-primary-1"
                    }`}
                  >
                    {option.label}
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </label>
  );
}

function getCandidateRecordId(candidate = {}) {
  return getCandidatePipelineRecordId(candidate);
}

/*
 * NHO file routes accept only candidate_pipeline.id.
 * Public candidate IDs, application IDs, and Talent Pool IDs may be numeric
 * and can collide with another Candidate Pipeline row, so they must never be
 * used as a fallback for an upload route.
 */
function getStrictCandidatePipelineRecordId(candidate = {}) {
  const safeCandidate =
    candidate && typeof candidate === "object"
      ? candidate
      : {};

  /*
   * Use the exact same database-record resolver used by Assessment and the
   * other Candidate Pipeline actions. In normalized board records, `id` can
   * contain the public/application identifier (for example 21), while
   * `dbId` / candidatePipelineId contains candidate_pipeline.id (for example
   * 10). Never read generic `id` directly for NHO routes.
   */
  const recordId = cleanText(
    safeCandidate.candidatePipelineRowId ||
      safeCandidate.candidate_pipeline_row_id ||
      getCandidatePipelineRecordId(safeCandidate),
  );

  /*
   * Do not fall back to generic id, candidateId, applicationId, or
   * sourceTalentPoolId. A missing pipeline primary key must stop the upload
   * instead of silently routing it to another numeric namespace.
   */
  return /^\d+$/.test(recordId) ? recordId : "";
}

function getCandidateNhoUploadIdentity(candidate = {}) {
  const recordId = getStrictCandidatePipelineRecordId(
    candidate,
  );

  const identityKey = cleanText(
    getCandidatePipelineIdentityKey(candidate),
  );

  const candidateId =
    cleanText(candidate.candidateId) ||
    cleanText(candidate.candidate_id);

  const applicationId =
    cleanText(candidate.candidateApplicationId) ||
    cleanText(candidate.candidate_application_id) ||
    cleanText(candidate.applicationId) ||
    cleanText(candidate.application_id);

  return {
    recordId,
    stateKey: recordId
      ? `record:${recordId.toLowerCase()}`
      : identityKey,
    candidateId,
    applicationId,
    candidateName:
      cleanText(candidate.name) ||
      cleanText(candidate.candidateName),
    candidateEmail:
      cleanText(candidate.email) ||
      cleanText(candidate.candidateEmail) ||
      cleanText(candidate.candidate_email),
  };
}

/*
 * API payloads can contain public/application/source IDs. For an open NHO
 * session, the selected candidate_pipeline primary key is authoritative and
 * must survive every response merge and local board update.
 */
function lockCandidatePipelinePrimaryKey(
  candidate = {},
  recordId = "",
) {
  const lockedRecordId = cleanText(recordId);

  if (!lockedRecordId) {
    return candidate && typeof candidate === "object"
      ? { ...candidate }
      : {};
  }

  const primaryKeyValue = /^\d+$/.test(lockedRecordId)
    ? Number(lockedRecordId)
    : lockedRecordId;

  return {
    ...(candidate && typeof candidate === "object"
      ? candidate
      : {}),
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

function isSameCandidateNhoUploadIdentity(
  firstIdentity = {},
  secondIdentity = {},
) {
  const firstRecordId = cleanText(
    firstIdentity.recordId,
  ).toLowerCase();

  const secondRecordId = cleanText(
    secondIdentity.recordId,
  ).toLowerCase();

  if (firstRecordId && secondRecordId) {
    return firstRecordId === secondRecordId;
  }

  const firstStateKey = cleanText(
    firstIdentity.stateKey,
  ).toLowerCase();

  const secondStateKey = cleanText(
    secondIdentity.stateKey,
  ).toLowerCase();

  return Boolean(
    firstStateKey &&
    secondStateKey &&
    firstStateKey === secondStateKey,
  );
}


function buildOffersPageCandidateParams(candidate = {}) {
  const params = new URLSearchParams();

  const candidatePipelineId =
    cleanText(getCandidateRecordId(candidate));

  const candidateApplicationId =
    cleanText(candidate.candidateApplicationId) ||
    cleanText(candidate.candidate_application_id) ||
    cleanText(candidate.applicationId) ||
    cleanText(candidate.application_id);

  const candidateId =
    cleanText(candidate.candidateId) ||
    cleanText(candidate.candidate_id);

  const candidateName =
    cleanText(candidate.name) ||
    cleanText(candidate.candidateName) ||
    cleanText(candidate.fullName) ||
    cleanText(candidate.full_name);

  const candidateEmail =
    cleanText(candidate.email) ||
    cleanText(candidate.candidateEmail) ||
    cleanText(candidate.candidate_email);

  if (candidatePipelineId) {
    params.set(
      "candidatePipelineId",
      candidatePipelineId,
    );
  }

  if (candidateApplicationId) {
    params.set(
      "candidateApplicationId",
      candidateApplicationId,
    );
  }

  if (candidateId) {
    params.set("candidateId", candidateId);
  }

  if (candidateName) {
    params.set("candidateName", candidateName);
  }

  if (candidateEmail) {
    params.set("candidateEmail", candidateEmail);
  }

  params.set("source", "candidate-pipeline");

  return params;
}

function isSameCandidateRecord(
  firstCandidate = {},
  secondCandidate = {},
) {
  return isSameCandidatePipelineRecord(
    firstCandidate,
    secondCandidate,
  );
}

function getCandidateTimeline(candidate = {}) {
  const safeCandidate =
    candidate && typeof candidate === "object"
      ? candidate
      : {};

  const rawTimeline =
    safeCandidate.timeline ||
    safeCandidate.movementTimeline ||
    safeCandidate.movement_timeline ||
    safeCandidate.pipelineTimeline ||
    safeCandidate.pipeline_timeline ||
    safeCandidate.history ||
    safeCandidate.pipelineHistory ||
    safeCandidate.pipeline_history ||
    [];

  const parsedTimeline = Array.isArray(rawTimeline)
    ? rawTimeline
    : safeJsonParseValue(rawTimeline, []);

  return Array.isArray(parsedTimeline)
    ? parsedTimeline.filter(Boolean)
    : [];
}

function getCandidateFromRealtimePayload(payload = {}) {
  if (!payload || typeof payload !== "object") {
    return null;
  }

  return (
    payload.candidate ||
    payload.data?.candidate ||
    payload.data?.data?.candidate ||
    payload.updatedCandidate ||
    payload.updated_candidate ||
    payload.data ||
    payload
  );
}

function mergeCandidateRealtimeUpdate(
  currentCandidate = {},
  incomingCandidate = {},
) {
  const currentTimeline = getCandidateTimeline(currentCandidate);
  const incomingTimeline = getCandidateTimeline(incomingCandidate);

  const resolvedTimeline = incomingTimeline.length
    ? incomingTimeline
    : currentTimeline;

  return {
    ...(currentCandidate || {}),
    ...(incomingCandidate || {}),
    timeline: resolvedTimeline,
    movementTimeline: resolvedTimeline,
    movement_timeline: resolvedTimeline,
    pipelineTimeline: resolvedTimeline,
    pipeline_timeline: resolvedTimeline,
  };
}

function RequirementCard({
  requirement,
  uploadedFiles = [],
  disabled = false,
  onUpload,
  onSelect,
  onRemove,
}) {
  const inputRef = useRef(null);
  const hasFiles = uploadedFiles.length > 0;

  async function handleFileChange(event) {
    const selectedFiles = Array.from(event.target.files || []);

    if (!selectedFiles.length) return;

    const filePayloads = selectedFiles.map((file) => ({
      id: `NHO-FILE-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      requirement,
      fileName: file.name,
      fileSize: file.size,
      fileType: file.type || "application/octet-stream",
      fileUrl: URL.createObjectURL(file),
      uploadedAt: new Date().toISOString(),
      uploadedBy: "Current User",
      rawFile: file,
    }));

    onUpload?.(requirement, filePayloads);
    event.target.value = "";
  }

  return (
    <div
      className={`rounded-xl border p-4 transition ${
        hasFiles
          ? "border-emerald-200 bg-emerald-50/50"
          : "border-[#D9E2EC] bg-[#F8FAFC]"
      }`}
    >
      <div className="flex min-w-0 items-start gap-3">
        <div
          className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-md border ${
            hasFiles
              ? "border-emerald-500 bg-emerald-500 text-white"
              : "border-[#B9C7D6] bg-white"
          }`}
        >
          {hasFiles && <Check size={14} strokeWidth={3} />}
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex min-w-0 items-start justify-between gap-2">
            <p
              title={requirement}
              className="truncate text-sm font-extrabold text-[#101828]"
            >
              {requirement}
            </p>

            <div className="flex shrink-0 items-center gap-2">
              {isMajorRequirement(requirement) && (
                <span className="rounded-full border border-blue-100 bg-blue-50 px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-wide text-sibs-primary-1">
                  Major
                </span>
              )}

              {hasFiles && (
                <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-extrabold text-emerald-700">
                  {uploadedFiles.length} file{uploadedFiles.length === 1 ? "" : "s"}
                </span>
              )}
            </div>
          </div>

          {hasFiles ? (
            <div className="mt-3 space-y-2">
              {uploadedFiles.map((uploadedFile) => {
                const FileIcon = getFileIcon(
                  uploadedFile.fileName || uploadedFile.savedFileName,
                );

                return (
                  <div
                    key={`${uploadedFile.id}-${getNhoFileIdentity(uploadedFile)}`}
                    className="flex min-w-0 items-center gap-2 rounded-xl border border-emerald-100 bg-white p-3"
                  >
                    <button
                      type="button"
                      onClick={() => onSelect?.(uploadedFile)}
                      className="flex min-w-0 flex-1 items-center gap-3 text-left"
                    >
                      <FileIcon size={18} className="shrink-0 text-emerald-700" />

                      <span className="min-w-0 flex-1">
                        <span
                          title={
                            uploadedFile.fileName ||
                            uploadedFile.savedFileName
                          }
                          className="block truncate text-xs font-extrabold text-emerald-800"
                        >
                          {uploadedFile.fileName ||
                            uploadedFile.savedFileName ||
                            "Uploaded file"}
                        </span>

                        <span className="mt-0.5 block text-[11px] font-bold text-emerald-700/80">
                          {formatFileSize(uploadedFile.fileSize)}
                        </span>
                      </span>
                    </button>

                    <button
                      type="button"
                      disabled={disabled}
                      onClick={() => onRemove?.(uploadedFile)}
                      className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-red-100 bg-red-50 text-red-600 transition hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-70"
                      title="Remove this file"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                );
              })}

              <button
                type="button"
                disabled={disabled}
                onClick={() => inputRef.current?.click()}
                className="flex h-10 w-full items-center justify-center gap-2 rounded-xl border border-dashed border-emerald-300 bg-emerald-50 px-3 text-xs font-extrabold text-emerald-700 transition hover:bg-emerald-100 disabled:cursor-not-allowed disabled:opacity-70"
              >
                Add more files
                <UploadCloud size={15} />
              </button>
            </div>
          ) : (
            <button
              type="button"
              disabled={disabled}
              onClick={() => inputRef.current?.click()}
              className="mt-3 flex w-full items-center justify-between rounded-xl border border-dashed border-[#B9C7D6] bg-white px-3 py-3 text-left text-xs font-extrabold text-sibs-primary-1 transition hover:border-sibs-primary-1 disabled:cursor-not-allowed disabled:opacity-70"
            >
              Upload files for this requirement
              <UploadCloud size={16} />
            </button>
          )}

          <input
            ref={inputRef}
            type="file"
            multiple
            className="hidden"
            accept={ACCEPTED_FILE_TYPES}
            disabled={disabled}
            onChange={handleFileChange}
          />
        </div>
      </div>
    </div>
  );
}

function FilePreviewPanel({ file }) {
  if (!file) {
    return (
      <div className="flex min-h-[320px] flex-col items-center justify-center rounded-2xl border border-dashed border-[#B9C7D6] bg-[#F8FAFC] p-6 text-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-[#D9E2EC] bg-white text-sibs-primary-1 shadow-sm">
          <FileText size={27} />
        </div>

        <p className="mt-4 text-base font-extrabold text-[#101828]">
          No file selected
        </p>

        <p className="mt-2 max-w-xs text-sm font-semibold leading-6 text-sibs-tertiary-5">
          Select an uploaded requirement file to preview details here.
        </p>
      </div>
    );
  }

  const FileIcon = getFileIcon(file.fileName);
  const resolvedFileUrl = getResolvedFileUrl(file.fileUrl);
  const isImage =
    resolvedFileUrl &&
    !String(resolvedFileUrl).startsWith("blob:") &&
    (/^image\//i.test(file.fileType || "") ||
      /\.(jpg|jpeg|png|gif|webp)$/i.test(file.fileName || ""));

  return (
    <div className="rounded-2xl border border-[#D9E2EC] bg-[#F8FAFC] p-5">
      <div className="flex items-start gap-3">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-white text-sibs-primary-1 shadow-sm">
          <FileIcon size={24} />
        </div>

        <div className="min-w-0">
          <p className="text-xs font-extrabold uppercase tracking-wide text-sibs-primary-1">
            Selected File
          </p>

          <h3
            title={file.fileName || file.savedFileName}
            className="mt-1 break-words text-base font-extrabold text-[#101828]"
          >
            {file.fileName || file.savedFileName || "Uploaded file"}
          </h3>

          <p className="mt-1 text-xs font-bold text-sibs-tertiary-5">
            {formatFileSize(file.fileSize)}
          </p>
        </div>
      </div>

      <div className="mt-5 space-y-3 rounded-xl border border-[#E6ECF2] bg-white p-4">
        <div>
          <p className="text-[11px] font-extrabold uppercase tracking-wide text-sibs-tertiary-5">
            Requirement
          </p>

          <p className="mt-1 text-sm font-bold text-sibs-primary-1">
            {file.requirement || "NHO Uploaded File"}
          </p>
        </div>

        <div>
          <p className="text-[11px] font-extrabold uppercase tracking-wide text-sibs-tertiary-5">
            Uploaded At
          </p>

          <p className="mt-1 text-sm font-bold text-sibs-primary-1">
            {file.uploadedAt ? formatDateTime(file.uploadedAt) : "Not saved yet"}
          </p>
        </div>

        {file.uploadedBy && (
          <div>
            <p className="text-[11px] font-extrabold uppercase tracking-wide text-sibs-tertiary-5">
              Uploaded By
            </p>

            <p className="mt-1 break-words text-sm font-bold text-sibs-primary-1">
              {file.uploadedBy}
            </p>
          </div>
        )}

        {file.applicantFolderName && (
          <div>
            <p className="text-[11px] font-extrabold uppercase tracking-wide text-sibs-tertiary-5">
              Server Folder
            </p>

            <p className="mt-1 break-words text-sm font-bold text-sibs-primary-1">
              {file.applicantFolderName}
            </p>
          </div>
        )}
      </div>

      {isImage && (
        <div className="mt-5 overflow-hidden rounded-xl border border-[#E6ECF2] bg-white">
          <img
            src={resolvedFileUrl}
            alt={file.fileName || "Uploaded file"}
            className="max-h-[280px] w-full object-contain"
          />
        </div>
      )}

      {resolvedFileUrl && (
        <a
          href={resolvedFileUrl}
          target="_blank"
          rel="noreferrer"
          className="mt-5 inline-flex h-11 w-full items-center justify-center rounded-xl bg-sibs-primary-1 px-4 text-sm font-extrabold text-white transition hover:opacity-90"
        >
          Open File
        </a>
      )}
    </div>
  );
}

function PreEmploymentRequirementsPanel({
  candidateName = "",
  candidateEmail = "",
  files = [],
  selectedFile = null,
  disabled = false,
  saveError = "",
  saveSuccess = "",
  onUpload,
  onRemove,
  onSelectFile,
}) {
  const uploadedMap = useMemo(() => {
    const map = new Map();

    filterOfficialUploadedFiles(files).forEach((file) => {
      const key = normalizeRequirement(file.requirement);

      if (!key) return;

      if (!map.has(key)) {
        map.set(key, []);
      }

      map.get(key).push(file);
    });

    return map;
  }, [files]);

  const majorProgress = useMemo(
    () => calculateProgress(files, MAJOR_REQUIREMENTS),
    [files],
  );

  const totalProgress = useMemo(
    () => calculateProgress(files, ALL_REQUIREMENTS),
    [files],
  );

  return (
    <div className="rounded-xl border border-[#E6ECF2] bg-white p-5 shadow-sm">
      <div className="grid grid-cols-1 gap-5 xl:grid-cols-[minmax(0,1fr)_320px]">
        <div className="min-w-0 space-y-5">
          <section className="rounded-2xl border border-[#D9E2EC] bg-white p-5 shadow-sm">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div className="min-w-0">
                <h3 className="break-words text-lg font-extrabold uppercase text-[#101828]">
                  {candidateName || "Candidate"}
                </h3>

                <p className="mt-1 break-words text-sm font-extrabold uppercase text-sibs-primary-1">
                  {candidateEmail || "No email provided"}
                </p>
              </div>

              <div className="flex shrink-0 flex-wrap gap-2">
                <span className="rounded-full bg-[#F2F6FA] px-3 py-1 text-xs font-extrabold text-[#344054]">
                  Pre-Employment
                </span>

                <span
                  className={`rounded-full px-3 py-1 text-xs font-extrabold ${
                    majorProgress.isComplete
                      ? "bg-emerald-50 text-emerald-700"
                      : "bg-amber-50 text-amber-700"
                  }`}
                >
                  {majorProgress.completed} / {majorProgress.total} Major
                </span>

                <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-extrabold text-sibs-primary-1">
                  {totalProgress.completed} / {totalProgress.total} Total
                </span>
              </div>
            </div>

            <div className="mt-5">
              <div className="mb-2 flex items-center justify-between text-xs font-extrabold uppercase tracking-wide text-sibs-primary-1">
                <span>Major Completion</span>
                <span>{majorProgress.percent}%</span>
              </div>

              <div className="h-3 overflow-hidden rounded-full bg-[#EEF4FA]">
                <div
                  className={`h-full rounded-full transition-all duration-300 ${
                    majorProgress.isComplete
                      ? "bg-emerald-600"
                      : "bg-sibs-primary-1"
                  }`}
                  style={{ width: `${majorProgress.percent}%` }}
                />
              </div>

              <div className="mt-4 mb-2 flex items-center justify-between text-xs font-extrabold uppercase tracking-wide text-sibs-primary-1">
                <span>Total Completion</span>
                <span>{totalProgress.percent}%</span>
              </div>

              <div className="h-2 overflow-hidden rounded-full bg-[#EEF4FA]">
                <div
                  className="h-full rounded-full bg-sibs-primary-1/70 transition-all duration-300"
                  style={{ width: `${totalProgress.percent}%` }}
                />
              </div>
            </div>

            {!majorProgress.isComplete && (
              <div className="mt-4 rounded-xl border border-amber-100 bg-amber-50 px-4 py-3 text-sm font-bold leading-6 text-amber-700">
                Candidate has fewer than 5 major requirements. After saving,
                this candidate will be moved to{" "}
                <span className="font-extrabold">
                  For Onboarding - Incomplete Requirements
                </span>{" "}
                for Talent Pool follow-up.
              </div>
            )}

            {majorProgress.isComplete && (
              <div className="mt-4 rounded-xl border border-emerald-100 bg-emerald-50 px-4 py-3 text-sm font-bold leading-6 text-emerald-700">
                Candidate completed the 5 major requirements and can proceed to
                Onboarding.
              </div>
            )}

            {saveError && (
              <div className="mt-4 rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm font-bold leading-6 text-red-600">
                {saveError}
              </div>
            )}

            {saveSuccess && (
              <div className="mt-4 rounded-xl border border-emerald-100 bg-emerald-50 px-4 py-3 text-sm font-bold leading-6 text-emerald-700">
                {saveSuccess}
              </div>
            )}
          </section>

          <section className="rounded-2xl border border-[#D9E2EC] bg-white p-5 shadow-sm">
            <h3 className="text-lg font-extrabold text-[#101828]">
              Pre-Employment Requirements
            </h3>

            <div className="mt-5 space-y-6">
              {PRE_EMPLOYMENT_REQUIREMENT_GROUPS.map((group) => {
                const groupProgress = calculateProgress(
                  files,
                  group.requirements,
                );

                return (
                  <div
                    key={group.id}
                    className="border-t border-[#E6ECF2] pt-5 first:border-t-0 first:pt-0"
                  >
                    <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                      <div className="flex min-w-0 items-center gap-3">
                        <h4 className="text-base font-extrabold text-sibs-primary-1">
                          {group.title}
                        </h4>

                        <span className="rounded-full bg-[#F2F6FA] px-3 py-1 text-xs font-extrabold text-sibs-primary-1">
                          {groupProgress.completed} / {groupProgress.total}
                        </span>
                      </div>

                      {group.badge && (
                        <span
                          className={`inline-flex w-fit rounded-full px-3 py-1 text-xs font-extrabold ${
                            groupProgress.isComplete
                              ? "bg-emerald-50 text-emerald-700"
                              : "bg-amber-50 text-amber-700"
                          }`}
                        >
                          {group.badge}
                        </span>
                      )}
                    </div>

                    <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                      {group.requirements.map((requirement) => {
                        const uploadedFiles =
                          uploadedMap.get(normalizeRequirement(requirement)) ||
                          [];

                        return (
                          <RequirementCard
                            key={requirement}
                            requirement={requirement}
                            uploadedFiles={uploadedFiles}
                            disabled={disabled}
                            onUpload={onUpload}
                            onRemove={onRemove}
                            onSelect={onSelectFile}
                          />
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        </div>

        <aside className="xl:sticky xl:top-0 xl:self-start">
          <FilePreviewPanel file={selectedFile} />
        </aside>
      </div>
    </div>
  );
}

function UpdateAssessmentModal({
  open,
  candidate,
  candidateId,
  onClose,
  onSaved,
}) {
  const [assessmentStatus, setAssessmentStatus] = useState("Not Take");
  const [assessmentResult, setAssessmentResult] = useState("");
  const [assessmentScore, setAssessmentScore] = useState("");
  const [assessmentRemarks, setAssessmentRemarks] = useState("");
  const [assessmentFile, setAssessmentFile] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [openAssessmentDropdown, setOpenAssessmentDropdown] = useState("");

  const assessmentScoreNumber = Number(assessmentScore);
  const hasValidAssessmentScore = Boolean(
    assessmentStatus === "Taken" &&
      assessmentScore !== "" &&
      Number.isFinite(assessmentScoreNumber) &&
      assessmentScoreNumber >= 0 &&
      assessmentScoreNumber <= 100,
  );

  const isAutomaticAssessmentFailure = Boolean(
    hasValidAssessmentScore &&
      assessmentScoreNumber < ASSESSMENT_FAILURE_THRESHOLD,
  );

  useEffect(() => {
    if (!open) return;

    const initialStatus =
      candidate?.assessmentStatus || candidate?.assessment_status || "Not Take";

    const initialScore =
      candidate?.assessmentScore ??
      candidate?.assessment_score ??
      candidate?.assessmentScorePercent ??
      candidate?.assessment_score_percent ??
      "";

    const initialScoreText =
      initialScore === null || initialScore === undefined
        ? ""
        : String(initialScore);

    const initialResult = cleanText(
      candidate?.assessmentResult || candidate?.assessment_result || "",
    );

    setAssessmentStatus(initialStatus);
    setAssessmentScore(initialScoreText);
    setAssessmentResult(
      initialStatus === "Taken"
        ? initialResult || getSuggestedAssessmentResult(initialScoreText)
        : "",
    );
    setAssessmentRemarks(candidate?.assessmentRemarks || candidate?.assessment_remarks || "");
    setAssessmentFile(null);
    setErrorMessage("");
    setOpenAssessmentDropdown("");
  }, [
    open,
    candidate?.id,
    candidate?.candidateId,
    candidate?.assessmentStatus,
    candidate?.assessment_status,
    candidate?.assessmentResult,
    candidate?.assessment_result,
    candidate?.assessmentScore,
    candidate?.assessment_score,
    candidate?.assessmentRemarks,
    candidate?.assessment_remarks,
  ]);

  if (!open) return null;

  function handleAssessmentScoreChange(value) {
    const cleanValue = cleanText(value);

    if (cleanValue === "") {
      setAssessmentScore("");
      setAssessmentResult("");
      return;
    }

    const numberValue = Number(cleanValue);

    if (!Number.isFinite(numberValue)) return;
    if (numberValue < 0) return;
    if (numberValue > 100) return;

    setAssessmentScore(cleanValue);
    setAssessmentResult(getSuggestedAssessmentResult(cleanValue));
  }

  function handleAssessmentScoreWheel(event) {
    event.preventDefault();
    event.currentTarget.blur();
  }

  function handleAssessmentScoreKeyDown(event) {
    if (event.key === "ArrowUp" || event.key === "ArrowDown") {
      event.preventDefault();
    }
  }

  async function handleSubmit(event) {
    event.preventDefault();
    event.stopPropagation();

    const resolvedCandidateId = cleanText(candidateId);

    if (!resolvedCandidateId) {
      setErrorMessage("Candidate Pipeline ID is missing.");
      return;
    }

    if (assessmentStatus === "Taken" && assessmentScore === "") {
      setErrorMessage("Assessment score is required when status is Taken.");
      return;
    }

    if (assessmentScore !== "") {
      const scoreValue = Number(assessmentScore);

      if (!Number.isFinite(scoreValue) || scoreValue < 0 || scoreValue > 100) {
        setErrorMessage("Assessment score must be from 0 to 100.");
        return;
      }
    }

    if (
      assessmentStatus === "Taken" &&
      !cleanText(assessmentResult)
    ) {
      setErrorMessage("Assessment result is required when status is Taken.");
      return;
    }

    setIsSaving(true);
    setErrorMessage("");

    try {
      const formData = new FormData();

      formData.append("assessmentStatus", assessmentStatus);
      formData.append("assessment_status", assessmentStatus);

      formData.append(
        "assessmentResult",
        assessmentStatus === "Taken" ? assessmentResult : "",
      );
      formData.append(
        "assessment_result",
        assessmentStatus === "Taken" ? assessmentResult : "",
      );

      formData.append(
        "assessmentScore",
        assessmentStatus === "Taken" ? assessmentScore : "",
      );
      formData.append(
        "assessment_score",
        assessmentStatus === "Taken" ? assessmentScore : "",
      );

      formData.append("assessmentRemarks", assessmentRemarks);
      formData.append("assessment_remarks", assessmentRemarks);

      if (assessmentFile) {
        formData.append("assessmentFile", assessmentFile, assessmentFile.name);
      }

      const response = await api.post(
        `/api/candidate-pipeline/${encodeURIComponent(
          resolvedCandidateId,
        )}/assessment`,
        formData,
        {
          withCredentials: true,
          headers: {
            "Content-Type": "multipart/form-data",
          },
        },
      );

      const payload = response?.data || {};

      if (payload?.success === false) {
        throw new Error(payload?.message || "Failed to save assessment.");
      }

      const apiCandidate = getCandidateFromApiPayload(payload) || {};

      const nextCandidate = {
        ...(candidate || {}),
        ...apiCandidate,
        assessmentStatus:
          apiCandidate.assessmentStatus ||
          apiCandidate.assessment_status ||
          assessmentStatus,
        assessmentResult:
          apiCandidate.assessmentResult ||
          apiCandidate.assessment_result ||
          (assessmentStatus === "Taken" ? assessmentResult : ""),
        assessmentScore:
          apiCandidate.assessmentScore ??
          apiCandidate.assessment_score ??
          (assessmentStatus === "Taken" ? assessmentScore : ""),
        assessment_score:
          apiCandidate.assessment_score ??
          apiCandidate.assessmentScore ??
          (assessmentStatus === "Taken" ? assessmentScore : ""),
        assessmentRemarks:
          apiCandidate.assessmentRemarks ||
          apiCandidate.assessment_remarks ||
          assessmentRemarks,
      };

      onSaved?.(nextCandidate, payload);
    } catch (error) {
      setErrorMessage(
        getApiErrorMessage(error, "Failed to save assessment."),
      );
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div
      className="sibs-modal-blur fixed inset-0 z-[11000] flex h-dvh items-center justify-center px-4 py-4"
      onClick={(event) => event.stopPropagation()}
      onMouseDown={(event) => event.stopPropagation()}
    >
      <form
        onSubmit={handleSubmit}
        onClick={(event) => event.stopPropagation()}
        className="flex max-h-[92dvh] w-full max-w-xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl"
      >
        <div className="flex items-start justify-between gap-4 border-b border-[#E6ECF2] px-5 py-4 sm:px-6">
          <div>
            <h2 className="text-lg font-extrabold text-sibs-primary-1">
              Update Assessment
            </h2>

            <p className="mt-1 text-sm font-semibold leading-5 text-sibs-tertiary-5">
              Save the candidate&apos;s online assessment status, result, score,
              and attachment.
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={isSaving}
            className="rounded-full p-2 text-gray-400 transition hover:bg-gray-100 hover:text-gray-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <X size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto bg-[#F8FAFC] p-5 sm:p-6">
          <div className="rounded-2xl border border-[#E6ECF2] bg-white p-4">
            <p className="text-[11px] font-extrabold uppercase tracking-wide text-sibs-primary-1">
              Candidate
            </p>

            <p className="mt-1 break-words text-base font-extrabold text-[#101828]">
              {candidate?.name || candidate?.candidateName || "Candidate"}
            </p>

            <p className="mt-1 break-words text-sm font-bold text-sibs-tertiary-5">
              {candidate?.email || "No email provided"}
            </p>
          </div>

          <div className="mt-5 space-y-4">
            <FormDropdown
              label="Assessment Status"
              value={assessmentStatus}
              options={ASSESSMENT_STATUS_DROPDOWN_OPTIONS}
              disabled={isSaving}
              dropdownId="assessment-status"
              openDropdownId={openAssessmentDropdown}
              onOpenDropdownChange={setOpenAssessmentDropdown}
              placeholder="Select assessment status"
              onChange={(value) => {
                setAssessmentStatus(value);

                if (value !== "Taken") {
                  setAssessmentResult("");
                  setAssessmentScore("");
                }
              }}
            />

            <label className="block">
              <span className="text-xs font-extrabold uppercase tracking-wide text-sibs-primary-1">
                Assessment Score
              </span>

              <input
                type="number"
                min="0"
                max="100"
                step="0.01"
                inputMode="decimal"
                value={assessmentScore}
                disabled={isSaving || assessmentStatus !== "Taken"}
                onChange={(event) =>
                  handleAssessmentScoreChange(event.target.value)
                }
                onWheel={handleAssessmentScoreWheel}
                onKeyDown={handleAssessmentScoreKeyDown}
                placeholder="Enter score from 0 to 100"
                className="mt-2 h-11 w-full rounded-xl border border-[#D6DEE8] bg-white px-3 text-sm font-bold text-[#344054] outline-none transition [appearance:textfield] placeholder:text-slate-400 focus:border-sibs-primary-1 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400 [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
              />

              <p className="mt-1 text-xs font-semibold leading-5 text-sibs-tertiary-5">
                Enter the score first. The suggested result is selected automatically.
              </p>
            </label>

            <div>
              <FormDropdown
                label="Assessment Result"
                value={assessmentResult}
                options={ASSESSMENT_RESULT_DROPDOWN_OPTIONS}
                disabled={
                  isSaving ||
                  assessmentStatus !== "Taken" ||
                  !hasValidAssessmentScore
                }
                dropdownId="assessment-result"
                openDropdownId={openAssessmentDropdown}
                onOpenDropdownChange={setOpenAssessmentDropdown}
                placeholder="Select assessment result"
                onChange={setAssessmentResult}
              />

              {hasValidAssessmentScore && (
                <p className="mt-1 text-xs font-semibold leading-5 text-sibs-tertiary-5">
                  Suggested from the score. You can still select another assessment result.
                </p>
              )}
            </div>

            {isAutomaticAssessmentFailure && (
              <div className="rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm font-bold leading-6 text-red-700">
                This score is below {ASSESSMENT_FAILURE_THRESHOLD}. The result
                will be set to <span className="font-extrabold">Assessment Not Fit</span>,
                the candidate will be marked as Drop-off automatically, and a
                notification email will be attempted after saving.
              </div>
            )}

            <label className="block">
              <span className="text-xs font-extrabold uppercase tracking-wide text-sibs-primary-1">
                Remarks
              </span>

              <textarea
                value={assessmentRemarks}
                disabled={isSaving}
                onChange={(event) => setAssessmentRemarks(event.target.value)}
                rows={4}
                placeholder="Add assessment remarks..."
                className="mt-2 w-full resize-none rounded-xl border border-[#D6DEE8] bg-white px-3 py-3 text-sm font-semibold leading-6 text-[#344054] outline-none transition placeholder:text-slate-400 focus:border-sibs-primary-1"
              />
            </label>

            <label className="block">
              <span className="text-xs font-extrabold uppercase tracking-wide text-sibs-primary-1">
                Assessment Attachment
              </span>

              <div className="mt-2 rounded-xl border border-dashed border-[#B9C7D6] bg-white p-4">
                <input
                  type="file"
                  disabled={isSaving}
                  accept={ACCEPTED_FILE_TYPES}
                  onChange={(event) =>
                    setAssessmentFile(event.target.files?.[0] || null)
                  }
                  className="block w-full text-sm font-bold text-[#344054] file:mr-4 file:rounded-xl file:border-0 file:bg-sibs-primary-1 file:px-4 file:py-2 file:text-sm file:font-extrabold file:text-white"
                />

                <p className="mt-2 text-xs font-semibold leading-5 text-sibs-tertiary-5">
                  Allowed: PDF, DOC, DOCX, XLS, XLSX, CSV, JPG, PNG, WEBP,
                  HEIC.
                </p>

                {assessmentFile && (
                  <p className="mt-2 break-words text-xs font-extrabold text-sibs-primary-1">
                    Selected: {assessmentFile.name}
                  </p>
                )}
              </div>
            </label>

            {errorMessage && (
              <div className="rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm font-bold leading-6 text-red-600">
                {errorMessage}
              </div>
            )}
          </div>
        </div>

        <div className="flex flex-col-reverse gap-2 border-t border-[#E6ECF2] bg-white px-5 py-4 sm:flex-row sm:justify-end sm:px-6">
          <button
            type="button"
            onClick={onClose}
            disabled={isSaving}
            className="inline-flex h-11 items-center justify-center rounded-xl border border-[#D6DEE8] bg-white px-5 text-sm font-extrabold text-[#475467] transition hover:bg-[#F8FAFC] disabled:cursor-not-allowed disabled:opacity-60"
          >
            Cancel
          </button>

          <button
            type="submit"
            disabled={isSaving}
            className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-sibs-primary-1 px-5 text-sm font-extrabold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSaving ? <Loader2 size={16} className="animate-spin" /> : null}
            {isSaving ? "Saving..." : "Save Assessment"}
          </button>
        </div>
      </form>
    </div>
  );
}


function getAssessmentEmailCandidateName(candidate = {}) {
  return (
    cleanText(candidate.name) ||
    cleanText(candidate.candidateName) ||
    cleanText(candidate.fullName) ||
    cleanText(candidate.full_name) ||
    "Candidate"
  );
}

function getAssessmentEmailRole(candidate = {}) {
  return (
    cleanText(candidate.roleCapability) ||
    cleanText(candidate.role_capability) ||
    cleanText(candidate.currentAppliedRole) ||
    cleanText(candidate.current_applied_role) ||
    cleanText(candidate.openPosition) ||
    cleanText(candidate.open_position) ||
    cleanText(candidate.positionTitle) ||
    cleanText(candidate.position_title) ||
    cleanText(candidate.position) ||
    "the available"
  );
}

function addDaysToInputDate(days = 7) {
  const date = new Date();
  date.setDate(date.getDate() + days);

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function formatPreviewDeadline(value) {
  if (!value) return "the scheduled deadline";

  const date = new Date(`${value}T00:00:00`);

  if (Number.isNaN(date.getTime())) return value;

  return date.toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

const assessmentEmailMonthNames = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

const assessmentEmailWeekdayLabels = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

function padDateNumber(value) {
  return String(value).padStart(2, "0");
}

function toDateInputValue(date) {
  if (!(date instanceof Date) || Number.isNaN(date.getTime())) return "";

  return `${date.getFullYear()}-${padDateNumber(date.getMonth() + 1)}-${padDateNumber(
    date.getDate(),
  )}`;
}

function parseDateInputValue(value) {
  if (!value) return null;

  const rawValue = String(value).trim();

  if (/^\d{4}-\d{2}-\d{2}$/.test(rawValue)) {
    const parts = rawValue.split("-");
    const year = Number(parts[0]);
    const month = Number(parts[1]) - 1;
    const day = Number(parts[2]);

    const date = new Date(year, month, day);

    if (Number.isNaN(date.getTime())) return null;

    return date;
  }

  if (/^\d{2}\/\d{2}\/\d{4}$/.test(rawValue)) {
    const parts = rawValue.split("/");
    const month = Number(parts[0]) - 1;
    const day = Number(parts[1]);
    const year = Number(parts[2]);

    const date = new Date(year, month, day);

    if (Number.isNaN(date.getTime())) return null;

    return date;
  }

  const fallbackDate = new Date(rawValue);

  if (Number.isNaN(fallbackDate.getTime())) return null;

  return fallbackDate;
}

function formatAssessmentDateDisplay(value) {
  const date = parseDateInputValue(value);

  if (!date) return "Select deadline";

  return date.toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

function isSameAssessmentDate(firstDate, secondDate) {
  if (!firstDate || !secondDate) return false;

  return (
    firstDate.getFullYear() === secondDate.getFullYear() &&
    firstDate.getMonth() === secondDate.getMonth() &&
    firstDate.getDate() === secondDate.getDate()
  );
}

function buildAssessmentCalendarDays(displayDate) {
  const year = displayDate.getFullYear();
  const month = displayDate.getMonth();

  const firstDayOfMonth = new Date(year, month, 1);
  const startDay = firstDayOfMonth.getDay();

  const calendarStart = new Date(year, month, 1 - startDay);
  const days = [];

  for (let index = 0; index < 42; index += 1) {
    const date = new Date(calendarStart);
    date.setDate(calendarStart.getDate() + index);

    days.push({
      date,
      dateValue: toDateInputValue(date),
      dayNumber: date.getDate(),
      isCurrentMonth: date.getMonth() === month,
    });
  }

  return days;
}

function isPastAssessmentDate(date) {
  if (!(date instanceof Date) || Number.isNaN(date.getTime())) return true;

  const today = new Date();

  const todayStart = new Date(
    today.getFullYear(),
    today.getMonth(),
    today.getDate(),
  );

  const targetStart = new Date(
    date.getFullYear(),
    date.getMonth(),
    date.getDate(),
  );

  return targetStart < todayStart;
}

function AssessmentDeadlineDatePicker({
  value,
  onChange,
  placeholder = "Select deadline",
  disabled = false,
}) {
  const calendarRef = useRef(null);
  const selectedDate = parseDateInputValue(value);
  const today = new Date();

  const [open, setOpen] = useState(false);
  const [displayDate, setDisplayDate] = useState(() => {
    if (selectedDate) {
      return new Date(
        selectedDate.getFullYear(),
        selectedDate.getMonth(),
        1,
      );
    }

    return new Date(today.getFullYear(), today.getMonth(), 1);
  });

  const currentMonthStart = new Date(
    today.getFullYear(),
    today.getMonth(),
    1,
  );

  const displayMonthStart = new Date(
    displayDate.getFullYear(),
    displayDate.getMonth(),
    1,
  );

  const disablePreviousMonth = displayMonthStart <= currentMonthStart;

  const calendarDays = useMemo(
    () => buildAssessmentCalendarDays(displayDate),
    [displayDate],
  );

  useEffect(() => {
    if (selectedDate) {
      setDisplayDate(
        new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 1),
      );
    }
  }, [value]);

  useEffect(() => {
    function handleClickOutside(event) {
      if (!calendarRef.current) return;

      if (!calendarRef.current.contains(event.target)) {
        setOpen(false);
      }
    }

    function handleEscape(event) {
      if (event.key === "Escape") {
        setOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, []);

  function goPreviousMonth() {
    setDisplayDate(
      (previous) =>
        new Date(previous.getFullYear(), previous.getMonth() - 1, 1),
    );
  }

  function goNextMonth() {
    setDisplayDate(
      (previous) =>
        new Date(previous.getFullYear(), previous.getMonth() + 1, 1),
    );
  }

  function handleSelectDate(date) {
    if (isPastAssessmentDate(date)) return;

    onChange(toDateInputValue(date));
    setOpen(false);
  }

  function handleClear() {
    onChange("");
    setOpen(false);
  }

  function handleToday() {
    onChange(toDateInputValue(today));
    setDisplayDate(new Date(today.getFullYear(), today.getMonth(), 1));
    setOpen(false);
  }

  return (
    <div ref={calendarRef} className="relative z-[300] min-w-0">
      <button
        type="button"
        disabled={disabled}
        onClick={() => setOpen((previous) => !previous)}
        className={`flex h-11 w-full min-w-0 items-center justify-between gap-3 rounded-xl border bg-white px-4 text-left text-sm font-bold shadow-sm outline-none transition ${
          open
            ? "border-sibs-primary-1 ring-4 ring-sibs-primary-1/10"
            : "border-[#D6DEE8] hover:border-sibs-primary-1"
        } ${
          disabled
            ? "cursor-not-allowed bg-gray-50 text-gray-400 opacity-70"
            : "text-[#344054]"
        }`}
      >
        <span className="inline-flex min-w-0 flex-1 items-center gap-2 truncate">
          <CalendarDays
            size={16}
            className="shrink-0 text-sibs-primary-1"
          />

          <span
            className={`min-w-0 truncate ${
              value ? "text-[#344054]" : "text-gray-400"
            }`}
          >
            {value ? formatAssessmentDateDisplay(value) : placeholder}
          </span>
        </span>

        <ChevronDown
          size={18}
          className={`shrink-0 text-sibs-primary-1 transition-transform duration-200 ${
            open ? "rotate-180" : ""
          }`}
        />
      </button>

      {open && !disabled && (
        <div className="absolute left-0 top-[calc(100%+8px)] z-[99999] w-[340px] overflow-hidden rounded-2xl border border-[#D9E2EC] bg-white shadow-[0_18px_45px_rgba(15,23,42,0.18)]">
          <div className="flex items-center justify-between border-b border-[#E6ECF2] px-4 py-3">
            <button
              type="button"
              onClick={goPreviousMonth}
              disabled={disablePreviousMonth}
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sibs-primary-1 transition hover:bg-[#EAF2FB] disabled:cursor-not-allowed disabled:opacity-35 disabled:hover:bg-transparent"
            >
              <ChevronLeft size={18} />
            </button>

            <p className="min-w-0 flex-1 text-center text-sm font-extrabold text-sibs-primary-1">
              {assessmentEmailMonthNames[displayDate.getMonth()]}{" "}
              {displayDate.getFullYear()}
            </p>

            <button
              type="button"
              onClick={goNextMonth}
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sibs-primary-1 transition hover:bg-[#EAF2FB]"
            >
              <ChevronRight size={18} />
            </button>
          </div>

          <div className="px-4 py-4">
            <div className="grid grid-cols-7 gap-1">
              {assessmentEmailWeekdayLabels.map((dayLabel) => (
                <div
                  key={dayLabel}
                  className="flex h-8 items-center justify-center text-xs font-extrabold text-[#174A7C]"
                >
                  {dayLabel}
                </div>
              ))}

              {calendarDays.map((day) => {
                  const active =
                    selectedDate && isSameAssessmentDate(day.date, selectedDate);
                  const currentDay = isSameAssessmentDate(day.date, today);
                  const disabledDay = isPastAssessmentDate(day.date);

                  return (
                    <button
                      key={day.dateValue}
                      type="button"
                      disabled={disabledDay}
                      onClick={() => handleSelectDate(day.date)}
                      className={`flex h-9 w-9 items-center justify-center rounded-full text-sm font-extrabold transition ${
                        disabledDay
                          ? "cursor-not-allowed text-[#CBD5E1] opacity-45"
                          : active
                            ? "bg-sibs-primary-1 text-white"
                            : currentDay
                              ? "bg-[#F2F6FA] text-sibs-primary-1"
                              : day.isCurrentMonth
                                ? "text-sibs-primary-1 hover:bg-[#EAF2FB]"
                                : "text-[#98A7BA] hover:bg-[#F7FAFC]"
                      }`}
                    >
                      {day.dayNumber}
                    </button>
                  );
                })}
            </div>
          </div>

          <div className="flex items-center justify-between border-t border-[#E6ECF2] px-5 py-3">
            <button
              type="button"
              onClick={handleClear}
              className="rounded-lg px-2 py-1 text-xs font-extrabold text-sibs-primary-1 transition hover:bg-[#F2F6FA]"
            >
              Clear
            </button>

            <button
              type="button"
              onClick={handleToday}
              className="rounded-lg px-2 py-1 text-xs font-extrabold text-sibs-primary-1 transition hover:bg-[#F2F6FA]"
            >
              Today
            </button>
          </div>
        </div>
      )}
    </div>
  );
}


function getFirstSelectableNhoFriday(referenceDate = new Date()) {
  const sourceDate =
    referenceDate instanceof Date
      ? referenceDate
      : new Date(referenceDate);

  const safeDate = Number.isNaN(sourceDate.getTime())
    ? new Date()
    : sourceDate;

  const result = new Date(
    safeDate.getFullYear(),
    safeDate.getMonth(),
    safeDate.getDate(),
  );

  const daysUntilFriday =
    (5 - result.getDay() + 7) % 7;

  result.setDate(
    result.getDate() + daysUntilFriday,
  );

  return result;
}

function isSelectableNhoFriday(
  date,
  referenceDate = new Date(),
) {
  if (
    !(date instanceof Date) ||
    Number.isNaN(date.getTime())
  ) {
    return false;
  }

  const dateOnly = new Date(
    date.getFullYear(),
    date.getMonth(),
    date.getDate(),
  );

  const earliestFriday =
    getFirstSelectableNhoFriday(
      referenceDate,
    );

  return (
    dateOnly.getDay() === 5 &&
    dateOnly.getTime() >=
      earliestFriday.getTime()
  );
}

function formatNhoScheduleDateDisplay(
  value,
) {
  const date = parseDateInputValue(value);

  if (!date) {
    return "Select a Friday";
  }

  return date.toLocaleDateString(
    "en-PH",
    {
      weekday: "long",
      month: "long",
      day: "numeric",
      year: "numeric",
    },
  );
}

function getCandidateNhoStartDateInput(
  candidate = {},
) {
  const schedule =
    candidate.nhoSchedule ||
    candidate.nho_schedule ||
    {};

  const existingValue =
    schedule.startDate ||
    schedule.start_date ||
    schedule.date ||
    candidate.nhoStartDate ||
    candidate.nho_start_date ||
    candidate.nhoDate ||
    candidate.nho_date ||
    "";

  const existingDate =
    parseDateInputValue(
      existingValue,
    );

  if (
    existingDate &&
    isSelectableNhoFriday(existingDate)
  ) {
    return toDateInputValue(existingDate);
  }

  return toDateInputValue(
    getFirstSelectableNhoFriday(),
  );
}

function NhoScheduleModal({
  open,
  candidate,
  value,
  isSaving = false,
  onChange,
  onClose,
  onSubmit,
}) {
  const selectedDate =
    parseDateInputValue(value);

  const earliestFriday =
    getFirstSelectableNhoFriday();

  const [
    displayDate,
    setDisplayDate,
  ] = useState(() => {
    const source =
      selectedDate || earliestFriday;

    return new Date(
      source.getFullYear(),
      source.getMonth(),
      1,
    );
  });

  useEffect(() => {
    if (!open) return;

    const source =
      parseDateInputValue(value) ||
      earliestFriday;

    setDisplayDate(
      new Date(
        source.getFullYear(),
        source.getMonth(),
        1,
      ),
    );
  }, [open, value]);

  const calendarDays = useMemo(
    () =>
      buildAssessmentCalendarDays(
        displayDate,
      ),
    [displayDate],
  );

  const earliestMonth = new Date(
    earliestFriday.getFullYear(),
    earliestFriday.getMonth(),
    1,
  );

  const displayedMonth = new Date(
    displayDate.getFullYear(),
    displayDate.getMonth(),
    1,
  );

  const disablePreviousMonth =
    displayedMonth.getTime() <=
    earliestMonth.getTime();

  if (!open) return null;

  function handleClose() {
    if (isSaving) return;
    onClose?.();
  }

  function handleSelectDate(date) {
    if (
      !isSelectableNhoFriday(date)
    ) {
      return;
    }

    onChange?.(
      toDateInputValue(date),
    );
  }

  return (
    <div
      className="sibs-modal-blur fixed inset-0 z-[11500] flex h-dvh items-center justify-center px-4 py-4"
      onClick={handleClose}
    >
      <div
        className="flex max-h-[92dvh] w-full max-w-xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl"
        onClick={(event) =>
          event.stopPropagation()
        }
      >
        <div className="flex items-start justify-between gap-4 border-b border-[#E6ECF2] px-5 py-4 sm:px-6">
          <div className="min-w-0">
            <h2 className="text-xl font-extrabold text-sibs-primary-1">
              Schedule NHO
            </h2>

            <p className="mt-1 text-sm font-semibold leading-6 text-sibs-tertiary-5">
              Choose the candidate&apos;s
              NHO start date. Only Fridays
              are available.
            </p>
          </div>

          <button
            type="button"
            onClick={handleClose}
            disabled={isSaving}
            className="rounded-full p-2 text-gray-400 transition hover:bg-gray-100 hover:text-gray-700 disabled:cursor-not-allowed disabled:opacity-60"
            aria-label="Close NHO schedule modal"
          >
            <X size={20} />
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto bg-[#F8FAFC] p-5 sm:p-6">
          <div className="rounded-2xl border border-[#D9E2EC] bg-white p-4">
            <p className="text-[11px] font-extrabold uppercase tracking-wide text-sibs-primary-1">
              Candidate
            </p>

            <p className="mt-1 break-words text-base font-extrabold text-[#101828]">
              {candidate?.name ||
                candidate?.candidateName ||
                "Candidate"}
            </p>

            <p className="mt-1 break-words text-sm font-bold text-sibs-tertiary-5">
              {candidate?.email ||
                candidate?.candidateEmail ||
                "No email provided"}
            </p>
          </div>

          <div className="mt-4 rounded-2xl border border-blue-100 bg-blue-50 px-4 py-3">
            <p className="text-sm font-bold leading-6 text-sibs-primary-1">
              Earliest selectable date:{" "}
              <span className="font-extrabold">
                {formatNhoScheduleDateDisplay(
                  toDateInputValue(
                    earliestFriday,
                  ),
                )}
              </span>
            </p>

            <p className="mt-1 text-xs font-semibold leading-5 text-sibs-tertiary-5">
              This week&apos;s Friday is
              used when it has not passed.
              Otherwise, selection begins
              next Friday.
            </p>
          </div>

          <div className="mt-4 overflow-hidden rounded-2xl border border-[#D9E2EC] bg-white shadow-sm">
            <div className="flex items-center justify-between border-b border-[#E6ECF2] px-4 py-3">
              <button
                type="button"
                disabled={
                  disablePreviousMonth ||
                  isSaving
                }
                onClick={() =>
                  setDisplayDate(
                    (previous) =>
                      new Date(
                        previous.getFullYear(),
                        previous.getMonth() - 1,
                        1,
                      ),
                  )
                }
                className="flex h-9 w-9 items-center justify-center rounded-full text-sibs-primary-1 transition hover:bg-[#EAF2FB] disabled:cursor-not-allowed disabled:opacity-30"
              >
                <ChevronLeft size={18} />
              </button>

              <p className="text-sm font-extrabold text-sibs-primary-1">
                {
                  assessmentEmailMonthNames[
                    displayDate.getMonth()
                  ]
                }{" "}
                {displayDate.getFullYear()}
              </p>

              <button
                type="button"
                disabled={isSaving}
                onClick={() =>
                  setDisplayDate(
                    (previous) =>
                      new Date(
                        previous.getFullYear(),
                        previous.getMonth() + 1,
                        1,
                      ),
                  )
                }
                className="flex h-9 w-9 items-center justify-center rounded-full text-sibs-primary-1 transition hover:bg-[#EAF2FB] disabled:cursor-not-allowed disabled:opacity-60"
              >
                <ChevronRight size={18} />
              </button>
            </div>

            <div className="p-4">
              <div className="grid grid-cols-7 gap-1">
                {assessmentEmailWeekdayLabels.map(
                  (dayLabel) => (
                    <div
                      key={dayLabel}
                      className="flex h-8 items-center justify-center text-xs font-extrabold text-[#174A7C]"
                    >
                      {dayLabel}
                    </div>
                  ),
                )}

                {calendarDays.map((day) => {
                  const isFriday =
                    day.date.getDay() === 5;

                  const selectable =
                    isSelectableNhoFriday(
                      day.date,
                    );

                  const active =
                    selectedDate &&
                    isSameAssessmentDate(
                      day.date,
                      selectedDate,
                    );

                  return (
                    <button
                      key={day.dateValue}
                      type="button"
                      disabled={
                        !selectable ||
                        isSaving
                      }
                      onClick={() =>
                        handleSelectDate(
                          day.date,
                        )
                      }
                      className={`flex h-10 w-10 items-center justify-center rounded-full text-sm font-extrabold transition ${
                        active
                          ? "bg-sibs-primary-1 text-white shadow-sm"
                          : selectable
                            ? "bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
                            : isFriday
                              ? "cursor-not-allowed bg-amber-50 text-amber-300"
                              : day.isCurrentMonth
                                ? "cursor-not-allowed text-[#CBD5E1]"
                                : "cursor-not-allowed text-[#E2E8F0]"
                      }`}
                      title={
                        selectable
                          ? "Select this Friday"
                          : "Only upcoming Fridays can be selected"
                      }
                    >
                      {day.dayNumber}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="mt-4 rounded-2xl border border-emerald-100 bg-emerald-50 p-4">
            <p className="text-[11px] font-extrabold uppercase tracking-wide text-emerald-700">
              Selected NHO Start Date
            </p>

            <p className="mt-1 text-base font-extrabold text-emerald-800">
              {formatNhoScheduleDateDisplay(
                value,
              )}
            </p>
          </div>
        </div>

        <div className="flex flex-col-reverse gap-2 border-t border-[#E6ECF2] bg-white px-5 py-4 sm:flex-row sm:justify-end sm:px-6">
          <button
            type="button"
            onClick={handleClose}
            disabled={isSaving}
            className="inline-flex h-11 items-center justify-center rounded-xl border border-[#D6DEE8] bg-white px-5 text-sm font-extrabold text-[#475467] transition hover:bg-[#F8FAFC] disabled:cursor-not-allowed disabled:opacity-60"
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={onSubmit}
            disabled={
              isSaving ||
              !selectedDate ||
              !isSelectableNhoFriday(
                selectedDate,
              )
            }
            className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-sibs-primary-1 px-5 text-sm font-extrabold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSaving ? (
              <Loader2
                size={16}
                className="animate-spin"
              />
            ) : (
              <CalendarDays size={16} />
            )}

            {isSaving
              ? "Scheduling..."
              : "Schedule NHO"}
          </button>
        </div>
      </div>
    </div>
  );
}

function getAssessmentClientBaseUrl() {
  const configuredUrl = cleanText(
    import.meta.env.VITE_CLIENT_APP_URL ||
      import.meta.env.VITE_APP_URL ||
      import.meta.env.VITE_PUBLIC_APP_URL ||
      import.meta.env.VITE_FRONTEND_URL,
  );

  if (configuredUrl) {
    return configuredUrl.replace(/\/+$/, "");
  }

  return "https://sibs-hris.getleadsource.com";
}

function buildAssessmentPreviewLink() {
  return SIBS_ASSESSMENT_PUBLIC_LINK;
}

const SIBS_ASSESSMENT_PUBLIC_LINK =
  "https://link.sibscareers.online/l/4HqL27kZ3";

function getCurrentAppOrigin() {
  const configuredOrigin = getAssessmentClientBaseUrl();

  try {
    const parsedOrigin = new URL(configuredOrigin);
    const hostname = parsedOrigin.hostname.toLowerCase();

    if (!["localhost", "127.0.0.1", "0.0.0.0"].includes(hostname)) {
      return configuredOrigin;
    }
  } catch {
    // Fall through to the production client URL.
  }

  return "https://sibs-hris.getleadsource.com";
}

function safeArray(value) {
  return Array.isArray(value) ? value : [];
}

function getLatestFinalInterviewSubmittedForm(candidate = {}) {
  const forms = safeArray(
    candidate.finalInterviewSubmittedForms ||
      candidate.final_interview_submissions ||
      candidate.finalInterviewSubmissions ||
      candidate.submittedFinalInterviewForms ||
      candidate.submitted_final_interview_forms,
  );

  if (!forms.length) return null;

  return [...forms]
    .filter(Boolean)
    .sort((a, b) => {
      const aTime = new Date(
        a.submittedAtIso ||
          a.submitted_at_iso ||
          a.submittedAt ||
          a.submitted_at ||
          a.createdAt ||
          a.created_at ||
          0,
      ).getTime();

      const bTime = new Date(
        b.submittedAtIso ||
          b.submitted_at_iso ||
          b.submittedAt ||
          b.submitted_at ||
          b.createdAt ||
          b.created_at ||
          0,
      ).getTime();

      return (
        (Number.isFinite(bTime) ? bTime : 0) -
        (Number.isFinite(aTime) ? aTime : 0)
      );
    })[0];
}

function isFinalInterviewFormLink(link = "") {
  return cleanText(link).includes("/recruitment/final-interview-form");
}

function finalInterviewLinkHasSavedDataParams(link = "") {
  const value = cleanText(link);

  if (!value) return false;

  try {
    const parsedUrl = new URL(
      value,
      typeof window !== "undefined"
        ? window.location.origin
        : "https://sibs-hris.getleadsource.com",
    );

    return Boolean(
      parsedUrl.searchParams.get("submissionId") ||
        parsedUrl.searchParams.get("formId"),
    );
  } catch {
    return value.includes("submissionId=") || value.includes("formId=");
  }
}

function resolveFinalInterviewFormLink(link = "") {
  const value = cleanText(link);
  const appOrigin = getCurrentAppOrigin();

  if (!value) return "";

  if (value.startsWith("http://") || value.startsWith("https://")) {
    try {
      const parsedUrl = new URL(value);

      if (parsedUrl.pathname === "/recruitment/final-interview-form") {
        return `${appOrigin}${parsedUrl.pathname}${parsedUrl.search}${parsedUrl.hash}`;
      }

      return value;
    } catch {
      return value;
    }
  }

  if (value.startsWith("/")) {
    return `${appOrigin}${value}`;
  }

  return `${appOrigin}/${value}`;
}

function buildFinalInterviewFormLink(candidate = {}, item = {}) {
  const appOrigin = getCurrentAppOrigin();
  const latestSubmission = getLatestFinalInterviewSubmittedForm(candidate) || {};

  const candidateId =
    cleanText(candidate.candidateId) ||
    cleanText(candidate.candidate_id) ||
    cleanText(latestSubmission.candidateId) ||
    cleanText(latestSubmission.candidate_id) ||
    "";

  const candidateApplicationId =
    cleanText(candidate.candidateApplicationId) ||
    cleanText(candidate.candidate_application_id) ||
    cleanText(candidate.applicationId) ||
    cleanText(candidate.application_id) ||
    cleanText(latestSubmission.candidateApplicationId) ||
    cleanText(latestSubmission.candidate_application_id) ||
    cleanText(candidate.id) ||
    "";

  const positionId =
    cleanText(item.positionId) ||
    cleanText(item.position_id) ||
    cleanText(item.extra?.positionId) ||
    cleanText(item.extra?.position_id) ||
    cleanText(latestSubmission.positionId) ||
    cleanText(latestSubmission.position_id) ||
    cleanText(candidate.positionId) ||
    cleanText(candidate.position_id) ||
    cleanText(candidate.finalInterviewPositionId) ||
    cleanText(candidate.final_interview_position_id) ||
    cleanText(candidate.offerDetails?.positionId) ||
    cleanText(candidate.hiringRequirementId) ||
    "";

  const formId =
    cleanText(item.formId) ||
    cleanText(item.form_id) ||
    cleanText(item.extra?.formId) ||
    cleanText(item.extra?.form_id) ||
    cleanText(latestSubmission.formId) ||
    cleanText(latestSubmission.form_id) ||
    cleanText(candidate.finalInterviewFormId) ||
    cleanText(candidate.final_interview_form_id) ||
    "";

  const submissionId =
    cleanText(item.submissionId) ||
    cleanText(item.submission_id) ||
    cleanText(item.extra?.submissionId) ||
    cleanText(item.extra?.submission_id) ||
    cleanText(latestSubmission.id) ||
    cleanText(latestSubmission.submissionId) ||
    cleanText(latestSubmission.submission_id) ||
    "";

  if (!candidateId && !candidateApplicationId) return "";

  const params = new URLSearchParams();

  if (candidateId) params.set("candidateId", candidateId);
  if (candidateApplicationId) {
    params.set("candidateApplicationId", candidateApplicationId);
  }
  if (positionId) params.set("positionId", positionId);
  if (formId) params.set("formId", formId);
  if (submissionId) params.set("submissionId", submissionId);

  params.set("mode", "view");

  return `${appOrigin}/recruitment/final-interview-form?${params.toString()}`;
}

function getTimelineFinalInterviewFormLink(item = {}, candidate = {}) {
  const possibleSavedLinks = [
    item.savedFormLink,
    item.saved_form_link,
    item.finalInterviewLink,
    item.final_interview_link,
    item.extra?.savedFormLink,
    item.extra?.saved_form_link,
    item.extra?.finalInterviewLink,
    item.extra?.final_interview_link,
  ];

  const savedFinalInterviewLink = possibleSavedLinks.find((link) =>
    isFinalInterviewFormLink(link),
  );

  if (
    savedFinalInterviewLink &&
    finalInterviewLinkHasSavedDataParams(savedFinalInterviewLink)
  ) {
    return resolveFinalInterviewFormLink(savedFinalInterviewLink);
  }

  const stageText = cleanText(item.stage).toLowerCase();
  const reasonText = cleanText(item.reason).toLowerCase();

  const isInterviewLog =
    stageText.includes("interview") ||
    reasonText.includes("interview") ||
    reasonText.includes("job evaluation");

  if (!isInterviewLog && !savedFinalInterviewLink) return "";

  return buildFinalInterviewFormLink(candidate, item);
}

function buildTimelineItemWithFinalInterviewLink(item = {}, candidate = {}) {
  const finalInterviewFormLink = getTimelineFinalInterviewFormLink(
    item,
    candidate,
  );

  if (!finalInterviewFormLink) return item;

  return {
    ...item,
    savedFormLink: finalInterviewFormLink,
    saved_form_link: finalInterviewFormLink,
    assessmentLink: finalInterviewFormLink,
    assessment_link: finalInterviewFormLink,
    extra: {
      ...(item.extra || {}),
      savedFormLink: finalInterviewFormLink,
      saved_form_link: finalInterviewFormLink,
      assessmentLink: finalInterviewFormLink,
      assessment_link: finalInterviewFormLink,
    },
  };
}

function AssessmentEmailFormatModal({
  open,
  candidate,
  form,
  isSending = false,
  onChange,
  onClose,
  onSend,
}) {
  if (!open) return null;

  const candidateName = getAssessmentEmailCandidateName(candidate);
  const roleName = form.roleName || getAssessmentEmailRole(candidate);
  const deadlineText = formatPreviewDeadline(form.emailDeadline);
  const assessmentLink = buildAssessmentPreviewLink(
    candidate,
    form.recipientEmail,
  );

  return (
    <div
      className="sibs-modal-blur fixed inset-0 z-[12000] flex h-dvh items-center justify-center px-4 py-4"
    >
      <div
        onClick={(event) => event.stopPropagation()}
        className="flex max-h-[92dvh] w-full max-w-[760px] flex-col overflow-hidden rounded-2xl bg-white shadow-2xl"
      >
        <div className="flex items-start justify-between gap-4 border-b border-[#E6ECF2] bg-white px-6 py-5">
          <div className="min-w-0">
            <h2 className="text-xl font-extrabold text-sibs-primary-1">
              Assessment Email Format
            </h2>
            <p className="mt-1 text-sm font-semibold leading-6 text-sibs-tertiary-5">
              Review the message before sending the online assessment invitation.
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={isSending}
            className="rounded-full p-2 text-[#98A2B3] transition hover:bg-gray-100 hover:text-[#475467] disabled:cursor-not-allowed disabled:opacity-60"
            aria-label="Close assessment email format modal"
          >
            <X size={20} />
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto bg-[#F8FAFC] px-6 py-5">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <label className="block">
              <span className="text-xs font-extrabold uppercase tracking-wide text-sibs-primary-1">
                Recipient Email
              </span>
              <input
                type="email"
                value={form.recipientEmail}
                onChange={(event) =>
                  onChange({
                    ...form,
                    recipientEmail: event.target.value,
                  })
                }
                className="mt-2 h-11 w-full rounded-xl border border-[#D6DEE8] bg-white px-3 text-sm font-bold text-[#344054] outline-none focus:border-sibs-primary-1 focus:ring-4 focus:ring-sibs-primary-1/10"
              />
            </label>

            <label className="block">
              <span className="text-xs font-extrabold uppercase tracking-wide text-sibs-primary-1">
                Assessment Deadline
              </span>
                <div className="mt-2">
                  <AssessmentDeadlineDatePicker
                    value={form.emailDeadline}
                    disabled={isSending}
                    placeholder="Select deadline"
                    onChange={(nextDate) =>
                      onChange({
                        ...form,
                        emailDeadline: nextDate,
                      })
                    }
                  />
                </div>
            </label>

            <label className="block md:col-span-2">
              <span className="text-xs font-extrabold uppercase tracking-wide text-sibs-primary-1">
                Subject
              </span>
              <input
                value={form.emailSubject}
                onChange={(event) =>
                  onChange({
                    ...form,
                    emailSubject: event.target.value,
                  })
                }
                className="mt-2 h-11 w-full rounded-xl border border-[#D6DEE8] bg-white px-3 text-sm font-bold text-[#344054] outline-none focus:border-sibs-primary-1 focus:ring-4 focus:ring-sibs-primary-1/10"
              />
            </label>

            <label className="block md:col-span-2">
              <span className="text-xs font-extrabold uppercase tracking-wide text-sibs-primary-1">
                Role / Position
              </span>
              <input
                value={form.roleName}
                onChange={(event) =>
                  onChange({
                    ...form,
                    roleName: event.target.value,
                  })
                }
                className="mt-2 h-11 w-full rounded-xl border border-[#D6DEE8] bg-white px-3 text-sm font-bold text-[#344054] outline-none focus:border-sibs-primary-1 focus:ring-4 focus:ring-sibs-primary-1/10"
              />
            </label>
          </div>

          <div className="mt-5 rounded-2xl border border-[#D9E2EC] bg-white p-5">
            <div className="mx-auto max-w-[560px] overflow-hidden rounded-sm bg-[#FFF8EF] shadow-sm">
              <div className="bg-white px-8 py-5 text-center">
                <img
                  src={SIBS_ASSESSMENT_LOGO_PREVIEW_URL}
                  alt="SiBS - Practice. Purpose. Philosophy."
                  width={360}
                  className="mx-auto block h-auto w-[360px] max-w-full object-contain"
                  draggable={false}
                />
              </div>

              <div className="px-8 py-6 text-sm leading-6 text-black">
                <p>
                  Hi <span className="font-bold">{candidateName}</span>,
                </p>

                <p className="mt-4">
                  Thank you for your interest in the {roleName} role at SiBS
                  Contact Center! We're thrilled to have you take the next step
                  in our selection process.
                </p>

                <p className="mt-4">
                  Your next step is to complete our online assessment. This is a
                  fantastic opportunity for you to showcase your skills and
                  demonstrate how you handle various customer service scenarios.
                  By completing this assessment, we will get to know you better
                  and understand how we can best support you when you join our
                  team.
                </p>

                <p className="mt-4 font-bold">Here's how to proceed:</p>
                <ol className="ml-5 list-decimal">
                  <li>
                    Click on the following link to access the assessment:{" "}
                    <a
                      href={assessmentLink}
                      target="_blank"
                      rel="noreferrer"
                      className="text-blue-700 underline"
                    >
                      SiBS - Online Assessment
                    </a>
                  </li>
                  <li>Complete the assessment by {deadlineText}.</li>
                  <li>
                    Ensure you have a quiet space and a stable internet
                    connection.
                  </li>
                </ol>

                <p className="mt-4 font-bold">Tips for Success:</p>
                <ul className="ml-5 list-disc">
                  <li>Take your time to read each question carefully.</li>
                  <li>
                    Keep your browser window open and stay within the assessment
                    area during the test. Stepping away too many times could
                    result in being locked out for security reasons.
                  </li>
                  <li>
                    For the best experience, use a laptop or computer in a
                    quiet, distraction-free space throughout the assessment.
                  </li>
                </ul>

                <p className="mt-4">
                  If you have any questions or encounter any issues, feel free to
                  reach out to us at{" "}
                  <span className="text-blue-700 underline">
                    careers@thesiblingssolutions.com
                  </span>{" "}
                  or call us at 09178303126.
                </p>

                <p className="mt-4">
                  We're looking forward to seeing your responses and moving
                  further in the selection process!
                </p>

                <p className="mt-8">
                  Best regards,
                  <br />
                  <span className="font-bold">
                    Talent Acquisition Team
                  </span>
                  <br />
                  SiBS Contact Center
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="flex flex-col-reverse gap-2 border-t border-[#E6ECF2] bg-white px-6 py-4 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={onClose}
            disabled={isSending}
            className="inline-flex h-11 items-center justify-center rounded-xl border border-[#D6DEE8] bg-white px-5 text-sm font-extrabold text-[#475467] transition hover:bg-[#F8FAFC] disabled:cursor-not-allowed disabled:opacity-60"
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={onSend}
            disabled={isSending}
            className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-sibs-primary-1 px-5 text-sm font-extrabold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSending ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              <Mail size={16} />
            )}
            {isSending ? "Sending..." : "Send Assessment Email"}
          </button>
        </div>
      </div>
    </div>
  );
}

const CandidatePipelineModal = ({
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
  onSendOfferEmail,
  onOfferDecision,
}) => {
  const [showTalentPoolDetails, setShowTalentPoolDetails] = useState(false);
  const [interviewNotesDraft, setInterviewNotesDraft] = useState("");
  const [candidateFilesById, setCandidateFilesById] = useState({});
  const [localCandidate, setLocalCandidate] = useState(null);
  const activeCandidateRef = useRef(null);

  /*
   * Lock NHO ownership to the candidate that opened this modal session.
   * A board refresh can reorder/remove cards while the file picker or save
   * request is open. The upload must keep the original candidate identity.
   */
  const nhoUploadSessionIdentityRef = useRef(null);
  const nhoUploadSessionCandidateRef = useRef(null);
  const nhoModalWasOpenRef = useRef(false);

  if (
    open &&
    (
      !nhoModalWasOpenRef.current ||
      !nhoUploadSessionIdentityRef.current?.recordId
    )
  ) {
    const rawOpenedCandidate =
      candidate && typeof candidate === "object"
        ? { ...candidate }
        : null;

    const openedIdentity =
      getCandidateNhoUploadIdentity(
        rawOpenedCandidate || {},
      );

    const openedCandidate =
      rawOpenedCandidate
        ? lockCandidatePipelinePrimaryKey(
            rawOpenedCandidate,
            openedIdentity.recordId,
          )
        : null;

    nhoUploadSessionCandidateRef.current =
      openedCandidate;
    nhoUploadSessionIdentityRef.current =
      openedIdentity;
  }

  if (!open && nhoModalWasOpenRef.current) {
    nhoUploadSessionCandidateRef.current = null;
    nhoUploadSessionIdentityRef.current = null;
  }

  nhoModalWasOpenRef.current = open;

  const nhoUploadSessionIdentity =
    nhoUploadSessionIdentityRef.current || {};

  const nhoUploadSessionKey =
    nhoUploadSessionIdentity.stateKey || "";

  const openedModalCandidate =
    nhoUploadSessionCandidateRef.current ||
    candidate ||
    null;

  const [selectedNhoFile, setSelectedNhoFile] = useState(null);
  const [isLoadingNhoFiles, setIsLoadingNhoFiles] = useState(false);
  const [isSavingNhoFiles, setIsSavingNhoFiles] = useState(false);
  const [isSendingAssessmentEmail, setIsSendingAssessmentEmail] =
    useState(false);
  const [isProceedingInitialScreening, setIsProceedingInitialScreening] =
    useState(false);
  const [
    hasSelectedPrfStatusThisSession,
    setHasSelectedPrfStatusThisSession,
  ] = useState(false);
  const [isResendingAssessmentEmail, setIsResendingAssessmentEmail] =
    useState(false);
  const [isResendingDropOffEmail, setIsResendingDropOffEmail] =
    useState(false);
  const [showAssessmentEmailModal, setShowAssessmentEmailModal] = useState(false);
  const [assessmentEmailForm, setAssessmentEmailForm] = useState({
    recipientEmail: "",
    emailSubject: "SiBS Online Assessment Invitation",
    emailDeadline: addDaysToInputDate(7),
    roleName: "",
  });
  const [showAssessmentModal, setShowAssessmentModal] = useState(false);
  const [showNhoScheduleModal, setShowNhoScheduleModal] = useState(false);
  const [nhoScheduleDate, setNhoScheduleDate] = useState(() =>
    toDateInputValue(getFirstSelectableNhoFriday()),
  );
  const [isSchedulingNho, setIsSchedulingNho] = useState(false);
  const [nhoFilesError, setNhoFilesError] = useState("");
  const [nhoFilesSuccess, setNhoFilesSuccess] = useState("");
  const [deleteFileConfirmation, setDeleteFileConfirmation] = useState({
    open: false,
    file: null,
  });

  const [statusModal, setStatusModal] = useState({
    open: false,
    type: "success",
    title: "",
    message: "",
    closeParentOnClose: false,
    afterClose: null,
  });

  const {
    handleStartInterview,
    handleResendDropOffEmail,
    setCandidateList,
    syncSelectedCandidate,
  } = useCandidatePipeline();

  const navigate = useNavigate();

  async function handleResendDropOffNotification() {
    if (!activeCandidate || isResendingDropOffEmail) return;

    setIsResendingDropOffEmail(true);

    try {
      await handleResendDropOffEmail(activeCandidate);
    } finally {
      setIsResendingDropOffEmail(false);
    }
  }

  function showStatusModal({
    type = "success",
    title = "",
    message = "",
    closeParentOnClose = false,
    afterClose = null,
  }) {
    setStatusModal({
      open: true,
      type,
      title,
      message,
      closeParentOnClose:
        Boolean(closeParentOnClose),
      afterClose:
        typeof afterClose === "function"
          ? afterClose
          : null,
    });
  }

  function closeStatusModal() {
    const shouldCloseParent =
      statusModal.type === "success" &&
      statusModal.closeParentOnClose;

    const afterClose =
      typeof statusModal.afterClose === "function"
        ? statusModal.afterClose
        : null;

    setStatusModal((previous) => ({
      ...previous,
      open: false,
      closeParentOnClose: false,
      afterClose: null,
    }));

    if (shouldCloseParent) {
      /*
       * Close Candidate Pipeline Details in the same render cycle as the
       * success modal. The previous 150 ms delay briefly rendered the parent
       * details modal again after the user pressed OK.
       */
      onClose?.();
      afterClose?.();
      return;
    }

    /*
     * Errors close only the Failed modal. Candidate details and all
     * write forms remain available and reappear so the user can correct
     * the issue and retry.
     */
    afterClose?.();
  }

  useEffect(() => {
    if (!open) return;

    const sessionCandidate =
      nhoUploadSessionCandidateRef.current ||
      openedModalCandidate ||
      null;

    setShowTalentPoolDetails(false);
    setInterviewNotesDraft(
      sessionCandidate?.interviewNotes || "",
    );
    setLocalCandidate(sessionCandidate);
    setSelectedNhoFile(null);
    setIsSendingAssessmentEmail(false);
    setIsProceedingInitialScreening(false);
    setHasSelectedPrfStatusThisSession(false);
    setIsResendingAssessmentEmail(false);
    setShowAssessmentModal(false);
    setShowNhoScheduleModal(false);
    setIsSchedulingNho(false);
    setNhoScheduleDate(
      getCandidateNhoStartDateInput(
        sessionCandidate || {},
      ),
    );
    setNhoFilesError("");
    setNhoFilesSuccess("");
    setStatusModal({
      open: false,
      type: "success",
      title: "",
      message: "",
      closeParentOnClose: false,
      afterClose: null,
    });
  }, [
    open,
    nhoUploadSessionKey,
  ]);

  const activeCandidate = useMemo(() => {
    const sessionCandidate =
      openedModalCandidate || {};

    if (!localCandidate) {
      return sessionCandidate;
    }

    if (
      !isSameCandidatePipelineRecord(
        sessionCandidate,
        localCandidate,
      )
    ) {
      /*
       * Keep the candidate that opened the modal. Never switch the open
       * details modal to the next card after a board reorder or refresh.
       */
      return sessionCandidate;
    }

    return mergeCandidatePipelineRecord(
      sessionCandidate,
      localCandidate,
    );
  }, [openedModalCandidate, localCandidate]);

  const candidateRealtimeSignature = useMemo(
    () =>
      JSON.stringify({
        identity:
          getCandidatePipelineIdentityKey(candidate),
        interviewDate:
          candidate?.interviewDate ||
          candidate?.interview_date ||
          "",
        interviewType:
          candidate?.interviewType ||
          candidate?.interview_type ||
          "",
        interviewStatus:
          candidate?.interviewStatus ||
          candidate?.interview_status ||
          "",
        onlineInterviewLink:
          candidate?.onlineInterviewLink ||
          candidate?.online_interview_link ||
          "",
        timeline: getCandidateTimeline(candidate),
      }),
    [candidate],
  );

  useEffect(() => {
    activeCandidateRef.current = activeCandidate;
  }, [activeCandidate]);

  useEffect(() => {
    if (!open || !candidate) return;

    setLocalCandidate((previousCandidate) => {
      if (
        previousCandidate &&
        !isSameCandidateRecord(previousCandidate, candidate)
      ) {
        /* Ignore a different card injected by a board reorder. */
        return previousCandidate;
      }

      return mergeCandidateRealtimeUpdate(
        previousCandidate || candidate,
        candidate,
      );
    });
  }, [open, candidateRealtimeSignature]);

  useEffect(() => {
    if (!open) return undefined;

    function handleCandidateRealtimeUpdate(event) {
      const incomingCandidate = getCandidateFromRealtimePayload(
        event?.detail || {},
      );

      if (
        !incomingCandidate ||
        typeof incomingCandidate !== "object"
      ) {
        return;
      }

      const currentCandidate =
        activeCandidateRef.current || {};

      if (!isSameCandidateRecord(currentCandidate, incomingCandidate)) {
        return;
      }

      setLocalCandidate((previousCandidate) =>
        mergeCandidateRealtimeUpdate(
          previousCandidate || currentCandidate,
          incomingCandidate,
        ),
      );
    }

    window.addEventListener(
      "ta-pipeline-candidates-updated",
      handleCandidateRealtimeUpdate,
    );

    window.addEventListener(
      "ta-interview-schedule-updated",
      handleCandidateRealtimeUpdate,
    );

    return () => {
      window.removeEventListener(
        "ta-pipeline-candidates-updated",
        handleCandidateRealtimeUpdate,
      );

      window.removeEventListener(
        "ta-interview-schedule-updated",
        handleCandidateRealtimeUpdate,
      );
    };
  }, [open]);

  const activePrfStatus = normalizePrfStatus(
    activeCandidate.prfStatus || activeCandidate.prf_status,
  );

  const prfReviewCardDisplayStatus =
    getPrfReviewCardDisplayStatus(activePrfStatus);

  const candidateNhoUploadIdentity =
    nhoUploadSessionIdentityRef.current ||
    getCandidateNhoUploadIdentity(
      openedModalCandidate || {},
    );

  const candidateNhoUploadId =
    candidateNhoUploadIdentity.recordId;

  const candidateUploadKey =
    candidateNhoUploadIdentity.stateKey;

  const candidateFiles = useMemo(() => {
    if (!candidateUploadKey) return [];
    return candidateFilesById[candidateUploadKey] || [];
  }, [candidateFilesById, candidateUploadKey]);

  const sortedCandidateFiles = useMemo(
    () => sortUploadedFiles(candidateFiles),
    [candidateFiles],
  );

  const majorNhoProgress = useMemo(
    () => calculateProgress(sortedCandidateFiles, MAJOR_REQUIREMENTS),
    [sortedCandidateFiles],
  );

  const totalNhoProgress = useMemo(
    () => calculateProgress(sortedCandidateFiles, ALL_REQUIREMENTS),
    [sortedCandidateFiles],
  );

  useEffect(() => {
    if (!sortedCandidateFiles.length) {
      setSelectedNhoFile(null);
      return;
    }

    setSelectedNhoFile((current) => {
      if (
        current &&
        sortedCandidateFiles.some((file) => file.id === current.id)
      ) {
        return current;
      }

      return sortedCandidateFiles[0] || null;
    });
  }, [sortedCandidateFiles]);

  const rawCurrentStage =
    activeCandidate?.currentStage ||
    activeCandidate?.currentPipelineStage ||
    activeCandidate?.pipelineStage ||
    activeCandidate?.stage ||
    "";

  const currentStage =
    normalizePipelineStageForVisibility(rawCurrentStage) ||
    rawCurrentStage;

  const nextStage = getNextStage(currentStage);

  const isLeadStage = false;
  const isInitialScreening = currentStage === "Initial Screening";
  const canProceedInitialScreening =
    isInitialScreening &&
    hasSelectedPrfStatusThisSession &&
    ["Matched", "Not Matched"].includes(activePrfStatus);
  const isOnlineAssessment = currentStage === "Online Assessment";
  const isAssessmentFit = currentStage === "Assessment Fit";
  const isInterviewScheduled = currentStage === "Interview Scheduled";
  const isInterviewed = currentStage === "Interviewed";
  const isOffered = currentStage === "Offered";
  const isAccepted =
    currentStage === "Accepted" ||
    currentStage === "Accepted (For NHO)";
  const forNHO = currentStage === "For NHO";
  const isIncompleteOnboarding =
    currentStage === INCOMPLETE_ONBOARDING_STAGE;
  const isOnboarding = currentStage === ONBOARDING_STAGE;

  /*
   * Stage-gated display values prevent stale fields from later
   * processes from appearing while the candidate is still in an
   * earlier stage.
   */
  const canShowAssessmentStageData =
    isPipelineStageAtOrAfter(
      currentStage,
      "Online Assessment",
    );

  const visibleTimeline = useMemo(
    () =>
      getVisibleCandidateTimeline(
        getCandidateTimeline(activeCandidate),
        currentStage,
      ).filter(
        (item) => !isUncommittedPrfStatusTimelineEntry(item),
      ),
    [activeCandidate, currentStage],
  );

  const latestFinalInterviewTimelineIndex = useMemo(
    () =>
      getLatestFinalInterviewTimelineIndex(
        visibleTimeline,
      ),
    [visibleTimeline],
  );

  const visibleMovementReason = useMemo(
    () =>
      getVisibleMovementReason(
        visibleTimeline,
        activeCandidate.reasonForMovement,
      ),
    [
      visibleTimeline,
      activeCandidate.reasonForMovement,
    ],
  );

  const canShowNhoUploads =
    forNHO ||
    isIncompleteOnboarding ||
    isOnboarding;

  useEffect(() => {
    let isActive = true;
    const abortController =
      new AbortController();

    const requestIdentity =
      getCandidateNhoUploadIdentity(
        activeCandidate,
      );

    async function loadSavedNhoFiles() {
      if (
        !open ||
        !requestIdentity.recordId ||
        !requestIdentity.stateKey ||
        !canShowNhoUploads
      ) {
        return;
      }

      setIsLoadingNhoFiles(true);
      setNhoFilesError("");
      setNhoFilesSuccess("");

      try {
        const response = await api.get(
          `/api/candidate-pipeline/${encodeURIComponent(
            requestIdentity.recordId,
          )}/nho/files`,
          {
            withCredentials: true,
            signal: abortController.signal,
            params: {
              _t: Date.now(),
              candidatePipelineId:
                requestIdentity.recordId,
              candidateId:
                requestIdentity.candidateId,
              candidateApplicationId:
                requestIdentity.applicationId,
              candidateName:
                requestIdentity.candidateName,
              candidateEmail:
                requestIdentity.candidateEmail,
            },
          },
        );

        if (
          !isActive ||
          abortController.signal.aborted
        ) {
          return;
        }

        const responseCandidate =
          getCandidateFromApiPayload(
            response,
          );

        const responseIdentity =
          getCandidateNhoUploadIdentity(
            responseCandidate || {},
          );

        if (
          responseIdentity.recordId &&
          !isSameCandidateNhoUploadIdentity(
            requestIdentity,
            responseIdentity,
          )
        ) {
          const ownershipError =
            new Error(
              "The server returned pre-employment files for a different candidate.",
            );

          ownershipError.code =
            "NHO_CANDIDATE_OWNERSHIP_MISMATCH";

          throw ownershipError;
        }

        const currentIdentity =
          getCandidateNhoUploadIdentity(
            activeCandidateRef.current || {},
          );

        if (
          !isSameCandidateNhoUploadIdentity(
            requestIdentity,
            currentIdentity,
          )
        ) {
          return;
        }

        const responseFiles =
          getFilesFromApiPayload(
            response,
          );

        const normalizedFiles =
          dedupeFiles(
            responseFiles,
            requestIdentity.recordId,
          );

        setCandidateFilesById(
          (previous) => {
            const currentFiles =
              previous[
                requestIdentity.stateKey
              ] || [];

            const mergedFiles =
              mergeLoadedNhoFilesWithPendingFiles(
                normalizedFiles,
                currentFiles,
                requestIdentity.recordId,
              );

            return {
              ...previous,
              [requestIdentity.stateKey]:
                mergedFiles,
            };
          },
        );

        if (
          responseCandidate &&
          typeof responseCandidate === "object" &&
          responseIdentity.recordId
        ) {
          setLocalCandidate(
            (previous) => ({
              ...(previous ||
                activeCandidate),
              ...responseCandidate,
            }),
          );
        }
      } catch (error) {
        if (
          !isActive ||
          abortController.signal.aborted ||
          error?.code === "ERR_CANCELED" ||
          error?.name === "CanceledError"
        ) {
          return;
        }

        const message = getApiErrorMessage(
          error,
          "Unable to load saved pre-employment files.",
        );

        setNhoFilesError(message);

        showStatusModal({
          type: "error",
          title: "Unable to Load Files",
          message,
        });
      } finally {
        if (
          isActive &&
          !abortController.signal.aborted
        ) {
          setIsLoadingNhoFiles(false);
        }
      }
    }

    loadSavedNhoFiles();

    return () => {
      isActive = false;
      abortController.abort();
    };
  }, [
    open,
    candidateNhoUploadId,
    candidateUploadKey,
    canShowNhoUploads,
  ]);

  const nhoScheduleDetails = useMemo(() => {
    const schedule = activeCandidate?.nhoSchedule || {};

    return {
      startDate:
        schedule.startDate ||
        schedule.date ||
        activeCandidate?.nhoStartDate ||
        activeCandidate?.nhoDate ||
        "",
      account:
        schedule.account ||
        activeCandidate?.nhoAccount ||
        activeCandidate?.offerDetails?.account ||
        activeCandidate?.roleAccount ||
        "—",
      trainer:
        schedule.trainer ||
        activeCandidate?.nhoTrainer ||
        activeCandidate?.trainer ||
        "—",
      updatedShiftSchedule:
        schedule.updatedShiftSchedule ||
        schedule.shiftSchedule ||
        activeCandidate?.updatedShiftSchedule ||
        activeCandidate?.nhoShiftSchedule ||
        "—",
      endorsementStatus:
        schedule.endorsementStatus ||
        activeCandidate?.endorsementStatus ||
        activeCandidate?.nhoEndorsementStatus ||
        "Pending",
      location:
        schedule.location ||
        activeCandidate?.nhoLocation ||
        activeCandidate?.workLocation ||
        "—",
      remarks: schedule.remarks || activeCandidate?.nhoRemarks || "",
      status:
        schedule.status ||
        activeCandidate?.nhoStatus ||
        (schedule.startDate ||
        schedule.date ||
        activeCandidate?.nhoStartDate ||
        activeCandidate?.nhoDate
          ? "Scheduled"
          : "Not Scheduled"),
    };
  }, [activeCandidate]);

  const hasNhoSchedule = useMemo(() => {
    return Boolean(
      nhoScheduleDetails.startDate && nhoScheduleDetails.startDate !== "—",
    );
  }, [nhoScheduleDetails]);

  const candidateHasSchedule = hasInterviewSchedule(activeCandidate);
  const modalStatus = getDisplayInterviewStatus(activeCandidate);
  const isInterviewInProgress =
    isInterviewScheduled && modalStatus === "Interview in Progress";

  function syncCandidateAfterAction(nextCandidate = {}, detail = {}) {
    const mergedCandidate = {
      ...activeCandidate,
      ...nextCandidate,
    };

    setLocalCandidate(mergedCandidate);

    window.dispatchEvent(
      new CustomEvent("ta-pipeline-candidates-updated", {
        detail: {
          candidate: mergedCandidate,
          ...detail,
        },
      }),
    );

    return mergedCandidate;
  }

  async function handleProceedInitialScreening(event) {
    event?.preventDefault?.();
    event?.stopPropagation?.();

    if (isProceedingInitialScreening) return;

    if (!candidateNhoUploadId) {
      showStatusModal({
        type: "error",
        title: "Unable to Proceed",
        message: "Candidate Pipeline ID is missing.",
      });
      return;
    }

    if (!["Matched", "Not Matched"].includes(activePrfStatus)) {
      showStatusModal({
        type: "error",
        title: "PRF Status Required",
        message: "Select Matched or Unmatched before proceeding.",
      });
      return;
    }

    const recipientEmail = cleanText(activeCandidate.email);

    if (!recipientEmail) {
      showStatusModal({
        type: "error",
        title: "Candidate Email Required",
        message: "Add the candidate email before proceeding.",
      });
      return;
    }

    setIsProceedingInitialScreening(true);

    try {
      const response = await api.post(
        `/api/candidate-pipeline/${encodeURIComponent(
          candidateNhoUploadId,
        )}/initial-screening/proceed`,
        {
          prfStatus: activePrfStatus,
          prf_status: activePrfStatus,
          recipientEmail,
          email: recipientEmail,
          roleName: getAssessmentEmailRole(activeCandidate),
          emailSubject:
            activePrfStatus === "Matched"
              ? "SiBS Online Assessment Invitation"
              : `Application Update - ${getAssessmentEmailRole(
                  activeCandidate,
                )}`,
          emailDeadline: addDaysToInputDate(7),
          assessmentLink: SIBS_ASSESSMENT_PUBLIC_LINK,
        },
        {
          withCredentials: true,
        },
      );

      const payload = response?.data || {};

      if (payload?.success === false) {
        throw new Error(
          payload?.message || "Failed to proceed with initial screening.",
        );
      }

      const apiCandidate = getCandidateFromApiPayload(payload) || {};
      syncCandidateAfterAction(apiCandidate, { payload });
      const isUnmatched = payload?.outcome === "unmatched";

      showStatusModal({
        type: "success",
        title: isUnmatched
          ? "Candidate Moved to Drop-off"
          : "Candidate Moved to Online Assessment",
        message:
          payload?.message ||
          (isUnmatched
            ? "The unmatched notification was sent and the candidate was moved to Drop-off."
            : "The assessment invitation was sent and the candidate was moved to Online Assessment."),
        closeParentOnClose: true,
      });
    } catch (error) {
      showStatusModal({
        type: "error",
        title: "Initial Screening Failed",
        message: getApiErrorMessage(
          error,
          "Failed to proceed with initial screening.",
        ),
      });
    } finally {
      setIsProceedingInitialScreening(false);
    }
  }

  async function handleResendAssessmentEmail(event) {
    event?.preventDefault?.();
    event?.stopPropagation?.();

    if (isResendingAssessmentEmail) return;

    if (!candidateNhoUploadId) {
      showStatusModal({
        type: "error",
        title: "Unable to Resend",
        message: "Candidate Pipeline ID is missing.",
      });
      return;
    }

    const recipientEmail =
      cleanText(
        activeCandidate.assessmentEmailRecipient ||
          activeCandidate.assessment_email_recipient,
      ) || cleanText(activeCandidate.email);

    if (!recipientEmail) {
      showStatusModal({
        type: "error",
        title: "Candidate Email Required",
        message: "Add the candidate email before resending the assessment.",
      });
      return;
    }

    setIsResendingAssessmentEmail(true);

    try {
      const response = await api.post(
        `/api/candidate-pipeline/${encodeURIComponent(
          candidateNhoUploadId,
        )}/assessment/send-email`,
        {
          recipientEmail,
          email: recipientEmail,
          emailSubject: "SiBS Online Assessment Invitation",
          subject: "SiBS Online Assessment Invitation",
          emailDeadline: addDaysToInputDate(7),
          deadline: addDaysToInputDate(7),
          roleName: getAssessmentEmailRole(activeCandidate),
          assessmentLink: SIBS_ASSESSMENT_PUBLIC_LINK,
          resend: true,
        },
        {
          withCredentials: true,
        },
      );

      const payload = response?.data || {};

      if (payload?.success === false) {
        throw new Error(payload?.message || "Failed to resend assessment email.");
      }

      const apiCandidate = getCandidateFromApiPayload(payload) || {};
      syncCandidateAfterAction(apiCandidate, { payload });

      showStatusModal({
        type: "success",
        title: "Assessment Email Resent",
        message:
          payload?.message ||
          `Assessment email resent successfully to ${recipientEmail}.`,
      });
    } catch (error) {
      showStatusModal({
        type: "error",
        title: "Resend Assessment Email Failed",
        message: getApiErrorMessage(
          error,
          "Failed to resend assessment email.",
        ),
      });
    } finally {
      setIsResendingAssessmentEmail(false);
    }
  }

  function handleSendAssessmentEmailClick(event) {
    event.preventDefault();
    event.stopPropagation();

    setAssessmentEmailForm({
      recipientEmail:
        cleanText(
          activeCandidate.assessmentEmailRecipient ||
            activeCandidate.assessment_email_recipient,
        ) ||
        cleanText(activeCandidate.email) ||
        "",
      emailSubject: "SiBS Online Assessment Invitation",
      emailDeadline: addDaysToInputDate(7),
      roleName: getAssessmentEmailRole(activeCandidate),
    });

    setShowAssessmentEmailModal(true);
  }

  async function handleConfirmSendAssessmentEmail(event) {
    event?.preventDefault?.();
    event?.stopPropagation?.();

    if (!candidateNhoUploadId) {
      showStatusModal({
        type: "error",
        title: "Unable to Send",
        message: "Candidate Pipeline ID is missing.",
      });
      return;
    }

    if (!cleanText(assessmentEmailForm.recipientEmail)) {
      showStatusModal({
        type: "error",
        title: "Recipient Required",
        message: "Please enter the recipient email address.",
      });
      return;
    }

    setIsSendingAssessmentEmail(true);

    try {
      const response = await api.post(
        `/api/candidate-pipeline/${encodeURIComponent(
          candidateNhoUploadId,
        )}/assessment/send-email`,
        {
          recipientEmail: assessmentEmailForm.recipientEmail,
          email: assessmentEmailForm.recipientEmail,
          emailSubject: assessmentEmailForm.emailSubject,
          subject: assessmentEmailForm.emailSubject,
          emailDeadline: assessmentEmailForm.emailDeadline,
          deadline: assessmentEmailForm.emailDeadline,
          roleName: assessmentEmailForm.roleName,
          assessmentLink: SIBS_ASSESSMENT_PUBLIC_LINK,
        },
        {
          withCredentials: true,
        },
      );

      const payload = response?.data || {};

      if (payload?.success === false) {
        throw new Error(payload?.message || "Failed to send assessment email.");
      }

      const apiCandidate = getCandidateFromApiPayload(payload) || {};

      syncCandidateAfterAction({
        ...apiCandidate,
        assessmentEmailSent:
          apiCandidate.assessmentEmailSent ??
          apiCandidate.assessment_email_sent ??
          true,
        assessment_email_sent:
          apiCandidate.assessment_email_sent ??
          apiCandidate.assessmentEmailSent ??
          true,
        assessmentEmailSentAt:
          apiCandidate.assessmentEmailSentAt ||
          apiCandidate.assessment_email_sent_at ||
          new Date().toISOString(),
        assessment_email_sent_at:
          apiCandidate.assessment_email_sent_at ||
          apiCandidate.assessmentEmailSentAt ||
          new Date().toISOString(),
        assessmentEmailRecipient:
          apiCandidate.assessmentEmailRecipient ||
          apiCandidate.assessment_email_recipient ||
          assessmentEmailForm.recipientEmail,
        assessment_email_recipient:
          apiCandidate.assessment_email_recipient ||
          apiCandidate.assessmentEmailRecipient ||
          assessmentEmailForm.recipientEmail,
      });

      setShowAssessmentEmailModal(false);

      showStatusModal({
        type: "success",
        title: "Assessment Email Sent",
        message:
          payload?.message ||
          `Assessment email sent successfully to ${assessmentEmailForm.recipientEmail}.`,
      });
    } catch (error) {
      showStatusModal({
        type: "error",
        title: "Send Assessment Email Failed",
        message: getApiErrorMessage(error, "Failed to send assessment email."),
      });
    } finally {
      setIsSendingAssessmentEmail(false);
    }
  }

  function handleOpenAssessmentModalClick(event) {
    event.preventDefault();
    event.stopPropagation();
    setShowAssessmentModal(true);
  }

  function handleAssessmentSaved(nextCandidate, payload = {}) {
    const mergedCandidate = syncCandidateAfterAction(nextCandidate || {});
    const automaticallyDropped = Boolean(
      payload?.automaticDropOff || payload?.automatic_drop_off,
    );
    const emailWarning = cleanText(
      payload?.emailWarning || payload?.email_warning,
    );

    setShowAssessmentModal(false);

    if (typeof onOpenAssessmentModal === "function") {
      try {
        window.dispatchEvent(
          new CustomEvent("ta-assessment-updated", {
            detail: {
              candidate: mergedCandidate,
              payload,
            },
          }),
        );
      } catch {
        // Ignore event dispatch warning.
      }
    }

    showStatusModal({
      type: "success",
      title: automaticallyDropped
        ? "Candidate Moved to Drop-off"
        : "Assessment Saved",
      message:
        payload?.message ||
        emailWarning ||
        (automaticallyDropped
          ? "The assessment was saved and the candidate was automatically marked as Drop-off."
          : "Assessment details were saved successfully."),
      closeParentOnClose: automaticallyDropped,
    });
  }

  async function handleLocalPrfStatusUpdate(firstArg, secondArg) {
    const nextPrfStatus =
      secondArg ||
      firstArg?.prfStatus ||
      firstArg?.prf_status ||
      firstArg ||
      "Review";

    const normalizedStatus = normalizePrfStatus(nextPrfStatus);

    setHasSelectedPrfStatusThisSession(false);

    const currentTimeline = Array.isArray(activeCandidate.timeline)
      ? activeCandidate.timeline
      : [];

    const movementReason =
      normalizedStatus === "Matched"
        ? "PRF status changed to Matched. Candidate is ready to move to Online Assessment."
        : `PRF status set to ${normalizedStatus}.`;

    const incomingCandidatePatch =
      typeof firstArg === "object" &&
      firstArg !== null &&
      isSameCandidatePipelineRecord(
        activeCandidate,
        firstArg,
      )
        ? firstArg
        : {};

    const nextCandidate = {
      ...activeCandidate,
      ...incomingCandidatePatch,

      /*
       * A PRF dropdown change may update PRF fields only. Keep the
       * exact candidate profile currently open in the modal.
       */
      id: activeCandidate.id,
      dbId:
        activeCandidate.dbId ||
        activeCandidate.id,
      candidateId:
        activeCandidate.candidateId,
      candidateApplicationId:
        activeCandidate.candidateApplicationId,
      applicationId:
        activeCandidate.applicationId ||
        activeCandidate.candidateApplicationId,
      sourceTalentPoolId:
        activeCandidate.sourceTalentPoolId,
      name: activeCandidate.name,
      candidateName:
        activeCandidate.candidateName ||
        activeCandidate.name,
      email: activeCandidate.email,

      prfStatus: normalizedStatus,
      prf_status: normalizedStatus,
      prfReviewed: normalizedStatus === "Matched",
      prf_reviewed: normalizedStatus === "Matched",
      prfReviewedAt:
        normalizedStatus === "Matched"
          ? new Date().toISOString()
          : activeCandidate.prfReviewedAt,
      prf_reviewed_at:
        normalizedStatus === "Matched"
          ? new Date().toISOString()
          : activeCandidate.prf_reviewed_at,
      currentStage: "Initial Screening",
      currentPipelineStage: "Initial Screening",
      pipelineStage: "Initial Screening",
      stage: "Initial Screening",
      reasonForMovement: movementReason,
      timeline: [
        ...currentTimeline,
        {
          stage: "Initial Screening",
          owner: "Current User",
          source: "PRF Review",
          timestamp: getCurrentTimestamp(),
          reason: movementReason,
          remarks: `PRF Status: ${normalizedStatus}`,
        },
      ],
    };

    setLocalCandidate(nextCandidate);

    try {
      const response = await onUpdatePrfStatus?.(
        nextCandidate,
        normalizedStatus,
      );

      if (response === null || response?.success === false) {
        setLocalCandidate(activeCandidate);
        setHasSelectedPrfStatusThisSession(false);
        return response;
      }

      setHasSelectedPrfStatusThisSession(
        ["Matched", "Not Matched"].includes(normalizedStatus),
      );

      return response;
    } catch (error) {
      console.error("Update PRF status from modal error:", error);
      setLocalCandidate(activeCandidate);
      setHasSelectedPrfStatusThisSession(false);
      return null;
    }
  }

  function handleOpenInterviewSchedule() {
    activeCandidateRef.current = activeCandidate;
    onOpenScheduleModal?.(activeCandidate);
  }

  function handleGoToOffer() {
    const params =
      buildOffersPageCandidateParams(activeCandidate);

    const nextPath =
      `/recruitment/offers?${params.toString()}`;

    const navigationState = {
      selectedOfferCandidate: {
        candidatePipelineId:
          getCandidateRecordId(activeCandidate),
        candidateApplicationId:
          activeCandidate.candidateApplicationId ||
          activeCandidate.candidate_application_id ||
          activeCandidate.applicationId ||
          activeCandidate.application_id ||
          "",
        candidateId:
          activeCandidate.candidateId ||
          activeCandidate.candidate_id ||
          "",
        candidateName:
          activeCandidate.name ||
          activeCandidate.candidateName ||
          "",
        candidateEmail:
          activeCandidate.email ||
          activeCandidate.candidateEmail ||
          "",
      },
    };

    /*
     * Close every modal or temporary overlay owned by Candidate Pipeline
     * before changing routes. This prevents the Candidate Details overlay,
     * assessment modal, email modal, or status modal from remaining visible
     * on the Offers page.
     */
    setShowAssessmentModal(false);
    setShowAssessmentEmailModal(false);
    setShowTalentPoolDetails(false);
    setSelectedNhoFile(null);
    setNhoFilesError("");
    setNhoFilesSuccess("");
    setStatusModal({
      open: false,
      type: "success",
      title: "",
      message: "",
      closeParentOnClose: false,
      afterClose: null,
    });

    onClose?.();

    /*
     * Let React apply the close state first, then navigate to the selected
     * candidate filter on the Offers page.
     */
    requestAnimationFrame(() => {
      navigate(nextPath, {
        state: navigationState,
      });
    });
  }

  function handleMoveToNextStage() {
    const candidateForMove = {
      ...activeCandidate,
      prfStatus: activePrfStatus,
      prf_status: activePrfStatus,
      prfReviewed: activePrfStatus === "Matched",
      prf_reviewed: activePrfStatus === "Matched",
      currentStage: activeCandidate.currentStage || "Initial Screening",
      currentPipelineStage:
        activeCandidate.currentPipelineStage ||
        activeCandidate.currentStage ||
        "Initial Screening",
      pipelineStage:
        activeCandidate.pipelineStage ||
        activeCandidate.currentStage ||
        "Initial Screening",
      stage: activeCandidate.stage || activeCandidate.currentStage,
    };

    onOpenMoveModal?.(candidateForMove);
  }

  function handleRequirementUpload(requirement, filePayloads = []) {
    const uploadIdentity =
      nhoUploadSessionIdentityRef.current ||
      {};

    if (
      !uploadIdentity.recordId ||
      !uploadIdentity.stateKey
    ) {
      return;
    }

    setNhoFilesError("");
    setNhoFilesSuccess("");

    setCandidateFilesById((previous) => {
      const currentFiles =
        previous[
          uploadIdentity.stateKey
        ] || [];

      const nextUploadedFiles = (
        Array.isArray(filePayloads)
          ? filePayloads
          : [filePayloads]
      ).map((filePayload) =>
        normalizeUploadedFile(
          {
            ...filePayload,
            requirement,
            candidatePipelineId:
              uploadIdentity.recordId,
            candidate_pipeline_id:
              uploadIdentity.recordId,
            ownerCandidatePipelineId:
              uploadIdentity.recordId,
            owner_candidate_pipeline_id:
              uploadIdentity.recordId,
          },
          uploadIdentity.recordId,
        ),
      );

      const nextFiles = dedupeFiles(
        [
          ...currentFiles,
          ...nextUploadedFiles,
        ],
        uploadIdentity.recordId,
      );

      setSelectedNhoFile(
        nextUploadedFiles[0] ||
          nextFiles[0] ||
          null,
      );

      return {
        ...previous,
        [uploadIdentity.stateKey]:
          nextFiles,
      };
    });
  }

  function requestRequirementFileDelete(fileToRemove) {
    if (!fileToRemove) return;

    setDeleteFileConfirmation({
      open: true,
      file: fileToRemove,
    });
  }

  function cancelRequirementFileDelete() {
    setDeleteFileConfirmation({
      open: false,
      file: null,
    });
  }

  async function confirmRequirementFileDelete() {
    const fileToRemove = deleteFileConfirmation.file;

    setDeleteFileConfirmation({
      open: false,
      file: null,
    });

    if (!fileToRemove) return;

    await permanentlyRemoveRequirementFile(fileToRemove);
  }

  async function permanentlyRemoveRequirementFile(fileToRemove) {
    const uploadIdentity =
      nhoUploadSessionIdentityRef.current ||
      {};

    if (
      !uploadIdentity.recordId ||
      !uploadIdentity.stateKey
    ) {
      return;
    }

    const fileName =
      cleanText(
        fileToRemove?.fileName ||
          fileToRemove?.savedFileName ||
          fileToRemove?.filename,
      ) ||
      "this file";

    setNhoFilesError("");
    setNhoFilesSuccess("");

    const removeFileFromLocalState = (
      responseFiles = null,
    ) => {
      const targetIdentity =
        getNhoFileIdentity(fileToRemove);

      const targetId =
        cleanText(fileToRemove?.id);

      setCandidateFilesById(
        (previous) => {
          const currentFiles =
            previous[
              uploadIdentity.stateKey
            ] || [];

          const nextFiles =
            Array.isArray(responseFiles)
              ? dedupeFiles(
                  responseFiles,
                  uploadIdentity.recordId,
                )
              : currentFiles.filter(
                  (file) => {
                    if (
                      targetId &&
                      cleanText(file?.id) ===
                        targetId
                    ) {
                      return false;
                    }

                    return (
                      getNhoFileIdentity(file) !==
                      targetIdentity
                    );
                  },
                );

          setSelectedNhoFile(
            (current) => {
              const currentRemoved =
                (targetId &&
                  cleanText(current?.id) ===
                    targetId) ||
                (targetIdentity &&
                  getNhoFileIdentity(
                    current,
                  ) ===
                    targetIdentity);

              return currentRemoved
                ? nextFiles[0] ||
                    null
                : current;
            },
          );

          return {
            ...previous,
            [uploadIdentity.stateKey]:
              nextFiles,
          };
        },
      );
    };

    /*
     * Pending files have not reached the server yet, so they only need
     * to be removed from local state.
     */
    if (
      fileToRemove?.rawFile ||
      !isPersistedNhoFile(
        fileToRemove,
      )
    ) {
      removeFileFromLocalState();

      setNhoFilesSuccess(
        `${fileName} was removed from the pending upload list.`,
      );

      return;
    }

    setIsSavingNhoFiles(true);

    try {
      const fileIdentity =
        getNhoFileIdentity(
          fileToRemove,
        );

      const response =
        await api.delete(
          `/api/candidate-pipeline/${encodeURIComponent(
            uploadIdentity.recordId,
          )}/nho/files/${encodeURIComponent(
            cleanText(fileToRemove?.id) ||
              fileIdentity,
          )}`,
          {
            withCredentials: true,
            data: {
              fileIdentity,
              storedPath:
                fileToRemove?.storedPath ||
                "",
              filePath:
                fileToRemove?.filePath ||
                "",
              savedFileName:
                fileToRemove?.savedFileName ||
                fileToRemove?.filename ||
                "",
              requirement:
                fileToRemove?.requirement ||
                "",
            },
          },
        );

      const payload =
        unwrapCandidatePipelineResponse(
          response,
        );

      if (payload?.success === false) {
        throw new Error(
          payload?.message ||
            "Unable to permanently delete the selected file.",
        );
      }

      const responseFiles =
        getFilesFromApiPayload(
          payload,
        );

      removeFileFromLocalState(
        responseFiles,
      );

      const responseCandidate =
        lockCandidatePipelinePrimaryKey(
          getCandidateFromApiPayload(
            payload,
          ) || {},
          uploadIdentity.recordId,
        );

      if (
        responseCandidate &&
        typeof responseCandidate ===
          "object"
      ) {
        setLocalCandidate(
          (previous) => ({
            ...(previous ||
              activeCandidate),
            ...responseCandidate,
          }),
        );

        applyScheduledCandidateToPipelineState(
          responseCandidate,
        );
      }

      const successMessage =
        payload?.message ||
        `${fileName} was permanently deleted.`;

      setNhoFilesSuccess(
        successMessage,
      );

      showStatusModal({
        type: "success",
        title: "File Deleted",
        message:
          successMessage,
      });
    } catch (error) {
      const message =
        getApiErrorMessage(
          error,
          "Unable to delete the physical file. No changes were made.",
        );

      setNhoFilesError(
        message,
      );

      showStatusModal({
        type: "error",
        title: "Delete Failed",
        message,
      });
    } finally {
      setIsSavingNhoFiles(false);
    }
  }

  async function moveCandidateToStage(
    targetStage,
    savedFiles,
    savedMajorProgress,
  ) {
    if (!candidateNhoUploadId || !targetStage) return null;

    const reason =
      targetStage === INCOMPLETE_ONBOARDING_STAGE
        ? "Candidate has fewer than 5 major pre-employment requirements."
        : "Candidate completed the 5 major pre-employment requirements and is ready for onboarding.";

    const response = await api.post(
      `/api/candidate-pipeline/${encodeURIComponent(candidateNhoUploadId)}/move`,
      {
        targetStage,
        nextStage: targetStage,
        stage: targetStage,
        requestedStage: targetStage,
        reason,
        reasonForMovement: reason,
        remarks:
          targetStage === INCOMPLETE_ONBOARDING_STAGE
            ? "Candidate saved with incomplete major requirements."
            : "Candidate completed all major requirements.",
      },
      {
        withCredentials: true,
      },
    );

    const payload = response?.data || {};

    if (payload?.success === false) {
      throw new Error(payload?.message || `Failed to move to ${targetStage}.`);
    }

    const apiCandidate = getCandidateFromApiPayload(payload) || {};

    const nextCandidate = {
      ...activeCandidate,
      ...apiCandidate,
      currentStage: targetStage,
      currentPipelineStage: targetStage,
      pipelineStage: targetStage,
      stage: targetStage,
      reasonForMovement: reason,
      nhoFiles: savedFiles,
      nho_files: savedFiles,
      preEmploymentFiles: savedFiles,
      pre_employment_files: savedFiles,
      uploadedFiles: savedFiles,
      files: savedFiles,
      majorNhoUploadProgress: savedMajorProgress,
      major_nho_upload_progress: savedMajorProgress,
    };

    setLocalCandidate(nextCandidate);

    window.dispatchEvent(
      new CustomEvent("ta-pipeline-candidates-updated", {
        detail: {
          candidate: nextCandidate,
          files: savedFiles,
          majorProgress: savedMajorProgress,
          routedStage: targetStage,
        },
      }),
    );

    window.dispatchEvent(
      new CustomEvent("ta-talent-pool-updated", {
        detail: {
          candidate: nextCandidate,
          files: savedFiles,
          majorProgress: savedMajorProgress,
          routedStage: targetStage,
        },
      }),
    );

    if (targetStage === ONBOARDING_STAGE) {
      window.dispatchEvent(
        new CustomEvent("ta-onboarding-updated", {
          detail: {
            candidate: nextCandidate,
            files: savedFiles,
            majorProgress: savedMajorProgress,
          },
        }),
      );
    }

    return nextCandidate;
  }

  function dispatchNhoSaveRefreshEvents(
    refreshDetail,
  ) {
    if (
      typeof window === "undefined" ||
      !refreshDetail
    ) {
      return;
    }

    /*
     * Candidate Pipeline state is already updated locally. Do not dispatch
     * the global pipeline/talent events here because their current listeners
     * perform a full GET /api/candidate-pipeline reload. That legacy read used
     * to create duplicate rows and also kept the board loading after Save.
     */
    if (
      cleanText(refreshDetail.routedStage) ===
      ONBOARDING_STAGE
    ) {
      window.dispatchEvent(
        new CustomEvent(
          "ta-onboarding-updated",
          {
            detail: refreshDetail,
          },
        ),
      );
    }
  }

  async function handleSavePreEmploymentRequirements() {
    const saveIdentity =
      nhoUploadSessionIdentityRef.current ||
      {};

    if (
      !saveIdentity.recordId ||
      !saveIdentity.stateKey
    ) {
      const message = "Candidate Pipeline ID is missing.";

      setNhoFilesError(message);

      showStatusModal({
        type: "error",
        title: "Unable to Save",
        message,
      });

      return;
    }

    const officialFiles = filterOfficialUploadedFiles(
      sortedCandidateFiles,
      saveIdentity.recordId,
    );

    const newFiles = officialFiles.filter((file) =>
      isRawBrowserFile(file.rawFile),
    );

    if (!officialFiles.length) {
      const message =
        "Please select at least one pre-employment requirement file before saving.";

      setNhoFilesError(message);

      showStatusModal({
        type: "error",
        title: "No Files Selected",
        message,
      });

      return;
    }

    const currentMajorProgress = calculateProgress(
      officialFiles,
      MAJOR_REQUIREMENTS,
    );

    const currentTotalProgress = calculateProgress(
      officialFiles,
      ALL_REQUIREMENTS,
    );

    setIsSavingNhoFiles(true);
    setNhoFilesError("");
    setNhoFilesSuccess("");

    try {
      const formData = new FormData();

      const filePayloads = officialFiles.map((file) => {
        const hasNewFile = isRawBrowserFile(file.rawFile);

        if (hasNewFile) {
          formData.append(
            "nhoFiles",
            file.rawFile,
            file.fileName,
          );
        }

        return {
          id: file.id,
          requirement: file.requirement,
          fileName: file.fileName,
          savedFileName: file.savedFileName,
          filename: file.filename,
          fileUrl: hasNewFile ? "" : file.fileUrl,
          filePath: file.filePath,
          storedPath: file.storedPath,
          fileType: file.fileType,
          fileSize: file.fileSize,
          uploadedAt: file.uploadedAt,
          uploadedBy: file.uploadedBy,
          applicantFolderName:
            file.applicantFolderName,
          candidatePipelineId:
            saveIdentity.recordId,
          candidate_pipeline_id:
            saveIdentity.recordId,
          ownerCandidatePipelineId:
            saveIdentity.recordId,
          owner_candidate_pipeline_id:
            saveIdentity.recordId,
          hasNewFile,
        };
      });

      formData.append(
        "filePayloads",
        JSON.stringify(filePayloads),
      );

      formData.append(
        "completed",
        String(currentTotalProgress.completed),
      );

      formData.append(
        "total",
        String(currentTotalProgress.total),
      );

      formData.append(
        "percent",
        String(currentTotalProgress.percent),
      );

      formData.append(
        "majorCompleted",
        String(currentMajorProgress.completed),
      );

      formData.append(
        "majorTotal",
        String(currentMajorProgress.total),
      );

      formData.append(
        "majorPercent",
        String(currentMajorProgress.percent),
      );

      formData.append(
        "majorComplete",
        String(currentMajorProgress.isComplete),
      );

      formData.append(
        "previousEmploymentEnabled",
        "true",
      );

      formData.append(
        "candidatePipelineId",
        saveIdentity.recordId,
      );

      formData.append(
        "candidate_pipeline_id",
        saveIdentity.recordId,
      );

      formData.append(
        "candidateIdentityKey",
        saveIdentity.stateKey,
      );

      formData.append(
        "candidateId",
        saveIdentity.candidateId,
      );

      formData.append(
        "candidateApplicationId",
        saveIdentity.applicationId,
      );

      formData.append(
        "candidateName",
        saveIdentity.candidateName,
      );

      formData.append(
        "candidateEmail",
        saveIdentity.candidateEmail,
      );

      /*
       * Leave Content-Type unset so the browser generates the multipart
       * boundary. Remove the shared Axios JSON header for this FormData.
       */
      const saveResponse = await api.post(
        `/api/candidate-pipeline/${encodeURIComponent(
          saveIdentity.recordId,
        )}/nho/files`,
        formData,
        {
          withCredentials: true,
          timeout: 90000,
          headers: {
            "Content-Type": undefined,
          },
          transformRequest: [
            (data, headers) => {
              if (headers?.delete) {
                headers.delete("Content-Type");
              } else if (headers) {
                delete headers["Content-Type"];
                delete headers["content-type"];
              }

              return data;
            },
          ],
        },
      );

      let savePayload =
        unwrapCandidatePipelineResponse(
          saveResponse,
        );

      if (savePayload?.success === false) {
        throw new Error(
          savePayload?.message ||
            "Failed to save uploads.",
        );
      }

      let responseFiles = dedupeFiles(
        getFilesFromApiPayload(savePayload),
        saveIdentity.recordId,
      );

      let saveCandidate =
        lockCandidatePipelinePrimaryKey(
          getCandidateFromApiPayload(
            savePayload,
          ) || {},
          saveIdentity.recordId,
        );

      const saveResponseIdentity =
        getCandidateNhoUploadIdentity(
          saveCandidate,
        );

      if (
        saveResponseIdentity.recordId &&
        !isSameCandidateNhoUploadIdentity(
          saveIdentity,
          saveResponseIdentity,
        )
      ) {
        const ownershipError =
          new Error(
            "The server saved or returned files for a different candidate.",
          );

        ownershipError.code =
          "NHO_CANDIDATE_OWNERSHIP_MISMATCH";

        throw ownershipError;
      }

      const responseVerified =
        savePayload?.fileServerVerified === true ||
        savePayload?.data?.fileServerVerified === true;

      /*
       * Older deployed routes may save successfully without returning
       * fileServerVerified. Confirm the actual saved server files by
       * reading them back instead of showing a false Save Failed modal.
       */
      if (
        newFiles.length > 0 &&
        (
          !responseVerified ||
          getMissingReadBackNhoFiles(
            newFiles,
            responseFiles,
          ).length > 0
        )
      ) {
        const readBack =
          await verifyNhoFilesByReadBack({
            candidateId:
              saveIdentity.recordId,
            pendingFiles: newFiles,
          });

        responseFiles =
          readBack.files;

        saveCandidate =
          lockCandidatePipelinePrimaryKey(
            readBack.candidate ||
              saveCandidate,
            saveIdentity.recordId,
          );

        savePayload = {
          ...savePayload,
          fileServerVerified: true,
          files: responseFiles,
          candidate: saveCandidate,
        };
      }

      const savedFiles = dedupeFiles(
        responseFiles.length
          ? responseFiles
          : officialFiles.map((file) => ({
              ...file,
              rawFile: null,
            })),
        saveIdentity.recordId,
      );

      const savedMajorProgress = calculateProgress(
        savedFiles,
        MAJOR_REQUIREMENTS,
      );

      const savedTotalProgress = calculateProgress(
        savedFiles,
        ALL_REQUIREMENTS,
      );

      let refreshedCandidate = {};

      try {
        refreshedCandidate =
          await refreshNhoCandidate(
            saveIdentity.recordId,
          );
      } catch {
        refreshedCandidate = {};
      }

      const candidateAfterRefresh =
        lockCandidatePipelinePrimaryKey(
          {
            ...saveCandidate,
            ...refreshedCandidate,
          },
          saveIdentity.recordId,
        );

      const stageCheckedCandidate =
        await ensureNhoCandidateStage({
          candidateId:
            saveIdentity.recordId,
          candidate:
            candidateAfterRefresh,
          majorProgress:
            savedMajorProgress,
          files: savedFiles,
        });

      const routedStage =
        getCandidateStageValue(
          stageCheckedCandidate,
        ) ||
        getNhoRoutedStageFromPayload(
          savePayload,
          candidateAfterRefresh,
          savedMajorProgress,
        );

      const nextCandidate =
        lockCandidatePipelinePrimaryKey(
          {
            ...activeCandidate,
            ...candidateAfterRefresh,
            ...stageCheckedCandidate,
            currentStage:
              routedStage ||
              saveCandidate.currentStage ||
              activeCandidate.currentStage,
            currentPipelineStage:
              routedStage ||
              saveCandidate.currentPipelineStage ||
              activeCandidate.currentPipelineStage,
            pipelineStage:
              routedStage ||
              saveCandidate.pipelineStage ||
              activeCandidate.pipelineStage,
            stage:
              routedStage ||
              saveCandidate.stage ||
              activeCandidate.stage,
            nhoFiles: savedFiles,
            nho_files: savedFiles,
            preEmploymentFiles: savedFiles,
            pre_employment_files: savedFiles,
            uploadedFiles: savedFiles,
            files: savedFiles,
            majorNhoUploadProgress:
              savedMajorProgress,
            major_nho_upload_progress:
              savedMajorProgress,
          },
          saveIdentity.recordId,
        );

      const currentUploadIdentity =
        getCandidateNhoUploadIdentity(
          activeCandidateRef.current ||
            {},
        );

      if (
        !isSameCandidateNhoUploadIdentity(
          saveIdentity,
          currentUploadIdentity,
        )
      ) {
        return;
      }

      setCandidateFilesById((previous) => ({
        ...previous,
        [saveIdentity.stateKey]: savedFiles,
      }));

      setSelectedNhoFile(savedFiles[0] || null);
      setLocalCandidate(nextCandidate);

      const movedToIncompleteStage =
        routedStage ===
        INCOMPLETE_ONBOARDING_STAGE;

      const movedToOnboarding =
        routedStage === ONBOARDING_STAGE;

      const savedNewFileText =
        newFiles.length > 0
          ? `${newFiles.length} new file${
              newFiles.length === 1 ? "" : "s"
            }`
          : "requirements";

      const successMessage = movedToIncompleteStage
        ? `Saved ${savedNewFileText}. Candidate has fewer than 5 major requirements and was moved to ${INCOMPLETE_ONBOARDING_STAGE}.`
        : movedToOnboarding
          ? `Saved ${savedNewFileText}. Candidate completed all 5 major requirements and was moved to Onboarding.`
          : `Saved successfully. ${savedMajorProgress.completed} of ${savedMajorProgress.total} major requirements completed. ${savedTotalProgress.completed} of ${savedTotalProgress.total} total requirements completed.`;

      setNhoFilesSuccess(successMessage);

      applyScheduledCandidateToPipelineState(
        nextCandidate,
      );

      const refreshDetail = {
        candidate: nextCandidate,
        files: savedFiles,
        majorProgress:
          savedMajorProgress,
        routedStage,
        fileServerVerified: true,
        onboardingInserted:
          savePayload?.onboardingInserted ??
          savePayload?.data
            ?.onboardingInserted ??
          false,
        onboardingRecord:
          savePayload?.onboardingRecord ||
          savePayload?.data
            ?.onboardingRecord ||
          null,
      };

      /*
       * Keep the result modal mounted and visible first.
       *
       * Dispatching the pipeline refresh immediately can change the
       * selected candidate's stage in the parent page. The old reset
       * effect then closed the StatusModal before React painted it.
       *
       * Refresh Candidate Pipeline, Talent Pool, and Onboarding only
       * after the user closes the result modal.
       */
      showStatusModal({
        type: "success",
        title: movedToIncompleteStage
          ? "Moved to Talent Pool"
          : movedToOnboarding
            ? "Moved to Onboarding"
            : "Requirements Saved",
        message: successMessage,
        closeParentOnClose:
          movedToIncompleteStage ||
          movedToOnboarding,
        afterClose: () => {
          dispatchNhoSaveRefreshEvents(
            refreshDetail,
          );
        },
      });
    } catch (error) {
      const errorText =
        cleanText(error?.message).toLowerCase();

      const isTimeout =
        error?.code === "ECONNABORTED" ||
        errorText.includes("timeout");

      const message = isTimeout
        ? "Saving took too long. Please check the file server connection and try again."
        : getApiErrorMessage(
            error,
            "Failed to save pre-employment files.",
          );

      setNhoFilesError(message);

      showStatusModal({
        type: "error",
        title: isTimeout
          ? "Save Timed Out"
          : "Save Failed",
        message,
      });
    } finally {
      setIsSavingNhoFiles(false);
    }
  }

  async function handleMoveToOnboarding() {
    if (!majorNhoProgress.isComplete) {
      const message =
        "Candidate must complete all 5 major requirements before moving to Onboarding.";

      setNhoFilesError(message);

      showStatusModal({
        type: "error",
        title: "Incomplete Major Requirements",
        message,
      });

      return;
    }

    setIsSavingNhoFiles(true);
    setNhoFilesError("");
    setNhoFilesSuccess("");

    try {
      await moveCandidateToStage(
        ONBOARDING_STAGE,
        sortedCandidateFiles,
        majorNhoProgress,
      );

      const successMessage =
        "Candidate completed the 5 major requirements and was moved to Onboarding.";

      setNhoFilesSuccess(successMessage);

      showStatusModal({
        type: "success",
        title: "Moved to Onboarding",
        message: successMessage,
      });
    } catch (error) {
      const message = getApiErrorMessage(
        error,
        "Failed to move to Onboarding.",
      );

      setNhoFilesError(message);

      showStatusModal({
        type: "error",
        title: "Move to Onboarding Failed",
        message,
      });
    } finally {
      setIsSavingNhoFiles(false);
    }
  }

  function applyScheduledCandidateToPipelineState(nextCandidate) {
    if (!nextCandidate || typeof nextCandidate !== "object") return;

    if (typeof setCandidateList === "function") {
      setCandidateList((previousCandidates = []) => {
        let foundCandidate = false;

        const nextCandidates = previousCandidates.map((item) => {
          if (!isSameCandidatePipelineRecord(item, nextCandidate)) {
            return item;
          }

          foundCandidate = true;

          return mergeCandidatePipelineRecord(
            item,
            nextCandidate,
          );
        });

        return foundCandidate
          ? nextCandidates
          : previousCandidates;
      });
    }

    if (typeof syncSelectedCandidate === "function") {
      syncSelectedCandidate(nextCandidate);
    }
  }

  function handleScheduleNhoClick() {
    setNhoScheduleDate(
      getCandidateNhoStartDateInput(
        activeCandidate,
      ),
    );

    setShowNhoScheduleModal(true);
  }

  async function handleConfirmScheduleNho() {
    const candidateId =
      cleanText(candidateNhoUploadId);

    const selectedDate =
      parseDateInputValue(
        nhoScheduleDate,
      );

    if (!candidateId) {
      setShowNhoScheduleModal(false);

      showStatusModal({
        type: "error",
        title: "NHO Scheduling Failed",
        message:
          "Candidate Pipeline ID is missing.",
      });

      return;
    }

    if (
      !selectedDate ||
      !isSelectableNhoFriday(
        selectedDate,
      )
    ) {
      setShowNhoScheduleModal(false);

      showStatusModal({
        type: "error",
        title: "Invalid NHO Start Date",
        message:
          "Please select an available Friday starting from the current week's Friday.",
      });

      return;
    }

    const normalizedStage =
      cleanText(currentStage);

    if (
      normalizedStage !== "Accepted" &&
      normalizedStage !==
        "Accepted (For NHO)"
    ) {
      setShowNhoScheduleModal(false);

      showStatusModal({
        type: "error",
        title: "NHO Scheduling Failed",
        message:
          "Only accepted candidates can be scheduled for NHO.",
      });

      return;
    }

    setIsSchedulingNho(true);

    try {
      const selectedDateDisplay =
        formatNhoScheduleDateDisplay(
          nhoScheduleDate,
        );

      const schedulePayload = {
        candidatePipelineId:
          candidateNhoUploadIdentity.recordId,
        candidateId:
          candidateNhoUploadIdentity.candidateId,
        candidateApplicationId:
          candidateNhoUploadIdentity.applicationId,
        candidateName:
          candidateNhoUploadIdentity.candidateName,
        candidateEmail:
          candidateNhoUploadIdentity.candidateEmail,
        startDate: nhoScheduleDate,
        date: nhoScheduleDate,
        account:
          activeCandidate
            ?.offerDetails
            ?.account ||
          activeCandidate?.account ||
          activeCandidate
            ?.nhoAccount ||
          "—",
        trainer:
          activeCandidate?.trainer ||
          activeCandidate?.nhoTrainer ||
          "To be assigned",
        updatedShiftSchedule:
          activeCandidate
            ?.updatedShiftSchedule ||
          activeCandidate
            ?.nhoShiftSchedule ||
          "To be assigned",
        shiftSchedule:
          activeCandidate
            ?.updatedShiftSchedule ||
          activeCandidate
            ?.nhoShiftSchedule ||
          "To be assigned",
        endorsementStatus:
          "For Endorsement",
        location:
          activeCandidate
            ?.workLocation ||
          activeCandidate
            ?.nhoLocation ||
          activeCandidate
            ?.applyingLocation ||
          "—",
        status: "Scheduled",
        remarks:
          `NHO scheduled for ${selectedDateDisplay}.`,
      };

      const response = await api.post(
        `/api/candidate-pipeline/${encodeURIComponent(
          candidateId,
        )}/nho/schedule`,
        schedulePayload,
        {
          withCredentials: true,
        },
      );

      const payload =
        unwrapCandidatePipelineResponse(
          response,
        );

      if (payload?.success === false) {
        throw new Error(
          payload?.message ||
            "Failed to schedule NHO.",
        );
      }

      const apiCandidate =
        lockCandidatePipelinePrimaryKey(
          getCandidateFromApiPayload(
            payload,
          ) || {},
          candidateNhoUploadIdentity.recordId,
        );

      const responseSchedule =
        apiCandidate.nhoSchedule ||
        apiCandidate.nho_schedule ||
        payload.nhoSchedule ||
        payload.nho_schedule ||
        schedulePayload;

      const nextCandidate =
        lockCandidatePipelinePrimaryKey(
          {
            ...activeCandidate,
            ...apiCandidate,
            currentStage: "For NHO",
            current_stage: "For NHO",
            currentPipelineStage:
              "For NHO",
            current_pipeline_stage:
              "For NHO",
            pipelineStage: "For NHO",
            pipeline_stage: "For NHO",
            stage: "For NHO",
            nhoSchedule:
              responseSchedule,
            nho_schedule:
              responseSchedule,
            nhoStartDate:
              responseSchedule.startDate ||
              responseSchedule.date ||
              nhoScheduleDate,
            nho_start_date:
              responseSchedule.startDate ||
              responseSchedule.date ||
              nhoScheduleDate,
          },
          candidateNhoUploadIdentity.recordId,
        );

      setLocalCandidate(
        nextCandidate,
      );

      /*
       * Update the Candidate Pipeline board immediately from the successful
       * response. This avoids dispatching the global refresh event, which
       * reloads up to 500 candidates and keeps the page in a loading state.
       */
      applyScheduledCandidateToPipelineState(
        nextCandidate,
      );

      setShowNhoScheduleModal(
        false,
      );

      showStatusModal({
        type: "success",
        title: "NHO Scheduled",
        message:
          payload?.message ||
          `${activeCandidate.name || "Candidate"}'s NHO was scheduled successfully for ${selectedDateDisplay}.`,
        /*
         * Clicking OK closes Candidate Pipeline Details. The board was
         * already updated locally above, so no full pipeline reload is needed.
         */
        closeParentOnClose: true,
      });
    } catch (error) {
      setShowNhoScheduleModal(
        false,
      );

      showStatusModal({
        type: "error",
        title: "NHO Scheduling Failed",
        message: getApiErrorMessage(
          error,
          "Failed to schedule NHO.",
        ),
      });
    } finally {
      setIsSchedulingNho(false);
    }
  }

 function openFinalInterviewForm() {
    const submittedForms = Array.isArray(
      activeCandidate.finalInterviewSubmittedForms,
    )
      ? activeCandidate.finalInterviewSubmittedForms
      : [];

    const latestSubmission = [...submittedForms].sort((a, b) => {
      const aTime = new Date(
        a.submittedAtIso ||
          a.submittedAt ||
          a.submitted_at ||
          a.createdAt ||
          a.created_at ||
          0,
      ).getTime();

      const bTime = new Date(
        b.submittedAtIso ||
          b.submittedAt ||
          b.submitted_at ||
          b.createdAt ||
          b.created_at ||
          0,
      ).getTime();

      return (
        (Number.isFinite(bTime) ? bTime : 0) -
        (Number.isFinite(aTime) ? aTime : 0)
      );
    })[0];

    const candidatePositionId =
      getCandidateAppliedPositionId(
        activeCandidate,
        latestSubmission?.positionId ||
          latestSubmission?.position_id ||
          "",
      );

    const candidatePositionTitle =
      getCandidateAppliedPositionTitle(
        activeCandidate,
        latestSubmission?.positionTitle ||
          latestSubmission?.position_title ||
          "",
      );

    const preferredFormId =
      activeCandidate.finalInterviewFormId ||
      activeCandidate.final_interview_form_id ||
      latestSubmission?.formId ||
      latestSubmission?.form_id ||
      "";

    const matchedSettingsForm =
      findMatchingFinalInterviewForm({
        preferredFormId,
        positionId: candidatePositionId,
        positionTitle: candidatePositionTitle,
      });

    const positionId =
      getFinalInterviewFormPositionId(
        matchedSettingsForm,
      ) ||
      candidatePositionId ||
      "";

    const positionTitle =
      getFinalInterviewFormPositionTitle(
        matchedSettingsForm,
      ) ||
      candidatePositionTitle ||
      "";

    const formId =
      getFinalInterviewFormId(
        matchedSettingsForm,
      ) ||
      preferredFormId ||
      (
        positionId
          ? `final-interview-${positionId}`
          : "default-job-evaluation"
      );

    const submissionId =
      latestSubmission?.id ||
      latestSubmission?.submissionId ||
      latestSubmission?.submission_id ||
      "";

    const params = new URLSearchParams();

    params.set(
      "candidateId",
      activeCandidate.candidateId || "",
    );

    params.set(
      "candidateApplicationId",
      activeCandidate.candidateApplicationId ||
        activeCandidate.id ||
        "",
    );

    if (positionId) {
      params.set("positionId", positionId);
    }

    if (positionTitle) {
      params.set("positionTitle", positionTitle);
    }

    if (formId) {
      params.set("formId", formId);
    }

    params.set("mode", "edit");
    params.set("continue", "1");

    if (submissionId) {
      params.set("submissionId", submissionId);
    }

    navigate(
      `/recruitment/final-interview-form?${params.toString()}`,
      {
        state: {
          candidate: {
            ...activeCandidate,
            positionId,
            openPosition:
              positionTitle ||
              activeCandidate.openPosition,
            finalInterviewPositionId: positionId,
            finalInterviewPositionTitle:
              positionTitle,
            finalInterviewFormId: formId,
          },
          matchedFinalInterviewForm:
            matchedSettingsForm,
          allowEditSubmitted: true,
        },
      },
    );
  }

  async function handleStartOrContinueInterview() {
    if (isInterviewInProgress) {
      openFinalInterviewForm();
      return;
    }

    const response = await handleStartInterview(
      activeCandidate,
    );

    if (!response?.success) {
      /*
       * handleStartInterview keeps the existing failure handling.
       * Do not navigate when the API request fails.
       */
      return;
    }

    /*
     * Start Interview is a direct transition.
     * Do not show a success modal before opening the interview form.
     */
    openFinalInterviewForm();
  }

  const nhoScheduleSection = (
    <div className="rounded-xl border border-[#E6ECF2] bg-[#F8FAFC] p-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <h3 className="truncate text-sm font-bold text-sibs-primary-1">
            NHO Schedule
          </h3>

          <p className="mt-1 line-clamp-2 text-xs font-medium leading-5 text-sibs-tertiary-5">
            Review and manage the candidate’s new hire onboarding schedule.
          </p>
        </div>

        <span
          className={`w-fit shrink-0 rounded-full border px-3 py-1 text-xs font-bold ${
            hasNhoSchedule
              ? "border-emerald-200 bg-emerald-50 text-emerald-700"
              : "border-amber-200 bg-amber-50 text-amber-700"
          }`}
        >
          {nhoScheduleDetails.status}
        </span>
      </div>

      {hasNhoSchedule ? (
        <>
          <div className="mt-4 rounded-xl bg-white p-4">
            <DetailRow
              label="Start Date"
              value={formatDateTime(nhoScheduleDetails.startDate) || "—"}
            />
            <DetailRow label="Account" value={nhoScheduleDetails.account} />
            <DetailRow label="Trainer" value={nhoScheduleDetails.trainer} />
            <DetailRow
              label="Updated Shift Schedule"
              value={nhoScheduleDetails.updatedShiftSchedule}
            />
            <DetailRow
              label="Endorsement Status"
              value={nhoScheduleDetails.endorsementStatus}
            />
            <DetailRow label="Location" value={nhoScheduleDetails.location} />
          </div>

          {nhoScheduleDetails.remarks && (
            <div className="mt-4 rounded-xl border border-[#E6ECF2] bg-white p-4">
              <p className="text-[11px] font-extrabold uppercase tracking-wide text-sibs-primary-1">
                Remarks
              </p>
              <p className="mt-2 text-sm font-medium leading-6 text-[#475467]">
                {nhoScheduleDetails.remarks}
              </p>
            </div>
          )}
        </>
      ) : (
        <div className="mt-4 rounded-xl border border-dashed border-[#C9D6E4] bg-white p-5 text-center">
          <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-xl bg-[#F8FAFC] text-sibs-primary-1 shadow-sm">
            <CalendarDays size={22} />
          </div>

          <p className="mt-3 text-sm font-bold text-[#101828]">
            NHO schedule not set
          </p>

          <p className="mt-1 text-xs font-medium leading-5 text-[#667085]">
            Set the candidate’s start date, trainer, and schedule details for
            onboarding.
          </p>
        </div>
      )}
    </div>
  );

  if (!open || !candidate) return null;

  return (
    <>
      {(
        <>
          <div
            className="sibs-modal-blur fixed inset-0 z-[9999] flex h-dvh items-center justify-center px-4 py-4"
      >
        <div
          className="flex max-h-[92dvh] w-full max-w-6xl flex-col overflow-hidden rounded-2xl bg-white shadow-xl"
          onClick={(event) => event.stopPropagation()}
        >
          <div className="flex items-start justify-between gap-4 border-b border-gray-100 px-5 py-4 sm:px-6 sm:py-5">
            <div>
              <h2 className="text-lg font-bold text-sibs-primary-1 sm:text-xl">
                Candidate Pipeline Details
              </h2>

              <p className="mt-1 text-sm font-medium text-sibs-tertiary-5">
                View candidate movement, online assessment, interview status,
                and pre-employment requirements.
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
            <div className="grid grid-cols-1 gap-5">
              <div className="min-w-0 space-y-5">
                <div className="rounded-xl border border-[#E6ECF2] bg-white p-5 shadow-sm">
                  <div className="flex items-start gap-4">
                    <CandidateAvatar candidate={activeCandidate} />

                    <div className="min-w-0 flex-1">
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                        <div className="min-w-0">
                          <h3 className="break-words text-xl font-bold text-[#101828]">
                            {activeCandidate.name}
                          </h3>

                          <p className="mt-1 break-words text-sm font-semibold text-sibs-tertiary-5">
                            {activeCandidate.email}
                          </p>
                        </div>

                        <button
                          type="button"
                          onClick={() =>
                            setShowTalentPoolDetails((previous) => !previous)
                          }
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
                            currentStage,
                          )}`}
                        >
                          {currentStage}
                        </span>

                        <span
                          className={`inline-flex rounded-full border px-3 py-1 text-xs font-bold ${getPrfStatusClass(
                            activePrfStatus,
                          )}`}
                        >
                          PRF: {activePrfStatus}
                        </span>

                        {canShowAssessmentStageData && modalStatus && (
                          <span
                            className={`inline-flex rounded-full border px-3 py-1 text-xs font-bold ${getInterviewStatusClass(
                              modalStatus,
                            )}`}
                          >
                            {modalStatus}
                          </span>
                        )}

                        {!isLeadStage &&
                          canShowAssessmentStageData &&
                          activeCandidate.assessmentResult && (
                          <span
                            className={`inline-flex rounded-full border px-3 py-1 text-xs font-bold ${getAssessmentResultClass(
                              activeCandidate.assessmentResult,
                            )}`}
                          >
                            {activeCandidate.assessmentResult}
                          </span>
                        )}

                        {canShowNhoUploads && (
                          <span
                            className={`inline-flex rounded-full border px-3 py-1 text-xs font-bold ${
                              majorNhoProgress.isComplete
                                ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                                : "border-amber-200 bg-amber-50 text-amber-700"
                            }`}
                          >
                            Major: {majorNhoProgress.completed} /{" "}
                            {majorNhoProgress.total}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {showTalentPoolDetails && (
                  <CandidateTalentPoolDetailsPanel candidate={activeCandidate} />
                )}

                {isInitialScreening && (
                  <LeadPrfReviewCard
                    candidate={{
                      ...activeCandidate,
                      prfStatus: prfReviewCardDisplayStatus,
                      prf_status: prfReviewCardDisplayStatus,
                    }}
                    onUpdatePrfStatus={handleLocalPrfStatusUpdate}
                  />
                )}

                <div
                  className={`grid grid-cols-1 gap-5 ${
                    isLeadStage || isInitialScreening
                      ? ""
                      : "xl:grid-cols-[1fr_360px]"
                  }`}
                >
                  <div className="min-w-0 space-y-5">
                    <div className="rounded-xl border border-[#E6ECF2] bg-white p-5 shadow-sm">
                      <h3 className="text-sm font-bold text-[#101828]">
                        Movement Timeline
                      </h3>

                      <div className="mt-5 space-y-4">
                        {!visibleTimeline.length && (
                          <div className="rounded-xl border border-dashed border-[#D6DEE8] bg-[#F8FAFC] px-4 py-6 text-center text-sm font-semibold text-sibs-tertiary-5">
                            No movement records are available for the current stage.
                          </div>
                        )}

                        {visibleTimeline.map(
                          (item, index) => {
                          const finalInterviewFormLink = getTimelineFinalInterviewFormLink(
                            item,
                            activeCandidate,
                          );

                          const timelineItem = buildTimelineItemWithFinalInterviewLink(
                            item,
                            activeCandidate,
                          );

                          const finalInterviewScoreSummary = getTimelineFinalInterviewScoreSummary(
                            timelineItem,
                            activeCandidate,
                          );

                          const finalInterviewResult = getFinalInterviewResult(
                            finalInterviewScoreSummary,
                          );

                          const finalInterviewScore = getFinalInterviewScoreDisplay(
                            finalInterviewScoreSummary,
                          );

                          const jobEvaluationScore =
                            getJobEvaluationScoreDisplay(
                              finalInterviewScoreSummary,
                            );

                          const isLatestFinalInterviewTimelineItem =
                            index === latestFinalInterviewTimelineIndex &&
                            isFinalInterviewTimelineItem(
                              timelineItem,
                            );

                          const shouldShowJobEvaluationScore =
                            isLatestFinalInterviewTimelineItem &&
                            Boolean(jobEvaluationScore);

                          const shouldShowFinalInterviewResult =
                            isLatestFinalInterviewTimelineItem &&
                            Boolean(
                              finalInterviewResult ||
                                finalInterviewScore,
                            );

                          const shouldShowAssessmentArtifacts =
                            shouldShowAssessmentArtifactsForTimelineEntry(
                              timelineItem,
                            );

                          const timelineAssessmentScore =
                            shouldShowAssessmentArtifacts
                              ? formatAssessmentScoreDisplay(
                                  getTimelineAssessmentScore(
                                    timelineItem,
                                  ),
                                )
                              : "";

                          return (
                            <div
                              key={`${item.stage}-${index}`}
                              className="flex min-w-0 gap-4"
                            >
                              <div
                                className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full border text-xs font-bold ${getStageClass(
                                  item.stage,
                                )}`}
                              >
                                {index + 1}
                              </div>

                              <div className="min-w-0 flex-1 rounded-xl border border-[#E6ECF2] bg-[#F8FAFC] p-4">
                                <div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-center">
                                  <div className="min-w-0">
                                    <p className="truncate text-sm font-bold text-[#101828]">
                                      {item.stage}
                                    </p>
                                    <p className="truncate text-xs font-semibold text-sibs-tertiary-5">
                                      {item.timestamp}
                                    </p>
                                  </div>

                                  <span className="w-fit shrink-0 rounded-full border border-gray-200 bg-white px-3 py-1 text-xs font-bold text-gray-600">
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

                                {timelineAssessmentScore && (
                                  <div className="mt-3 rounded-lg border border-blue-100 bg-blue-50 px-3 py-3">
                                    <p className="text-[11px] font-extrabold uppercase tracking-wide text-sibs-primary-1">
                                      Assessment Score
                                    </p>

                                    <p className="mt-1 text-sm font-extrabold text-sibs-primary-1">
                                      {timelineAssessmentScore}
                                    </p>
                                  </div>
                                )}

                                {shouldShowAssessmentArtifacts && (
                                  <GetAssessmentTimelineFiles
                                    item={timelineItem}
                                    candidate={activeCandidate}
                                  />
                                )}

                                {shouldShowJobEvaluationScore && (
                                  <div className="mt-3 rounded-xl border border-violet-100 bg-violet-50 p-3">
                                    <p className="text-[11px] font-extrabold uppercase tracking-wide text-violet-700">
                                      Job Evaluation Score
                                    </p>

                                    <div className="mt-2 flex flex-wrap items-center gap-2">
                                      <span className="inline-flex rounded-full border border-violet-100 bg-white px-3 py-1 text-xs font-extrabold text-violet-700">
                                        {jobEvaluationScore}
                                      </span>
                                    </div>
                                  </div>
                                )}

                                {shouldShowFinalInterviewResult && (
                                  <div className="mt-3 rounded-xl border border-blue-100 bg-blue-50 p-3">
                                    <p className="text-[11px] font-extrabold uppercase tracking-wide text-sibs-primary-1">
                                      Final Interview Result
                                    </p>

                                    <div className="mt-2 flex flex-wrap items-center gap-2">
                                      {finalInterviewResult && (
                                        <span
                                          className={`inline-flex rounded-full border px-3 py-1 text-xs font-extrabold ${getFinalInterviewResultClass(
                                            finalInterviewResult,
                                          )}`}
                                        >
                                          {finalInterviewResult}
                                        </span>
                                      )}

                                      {finalInterviewScore && (
                                        <span className="inline-flex rounded-full border border-blue-100 bg-white px-3 py-1 text-xs font-extrabold text-sibs-primary-1">
                                          Score: {finalInterviewScore}
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                )}

                                {finalInterviewFormLink && (
                                  <div className="mt-3">
                                    <p className="text-[11px] font-extrabold uppercase tracking-wide text-sibs-primary-1">
                                      Job Evaluation Link
                                    </p>

                                    <button
                                      type="button"
                                      title={finalInterviewFormLink}
                                      onClick={() => {
                                        window.open(
                                          finalInterviewFormLink,
                                          "_blank",
                                          "noopener,noreferrer",
                                        );
                                      }}
                                      className="mt-2 block w-full min-w-0 truncate rounded-lg border border-blue-100 bg-white px-3 py-2 text-left text-xs font-semibold text-blue-600 underline transition hover:cursor-pointer hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700"
                                    >
                                      {finalInterviewFormLink}
                                    </button>
                                  </div>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    <div className="rounded-xl border border-[#E6ECF2] bg-white p-5 shadow-sm">
                      <h3 className="text-sm font-bold text-[#101828]">
                        Reason for Movement
                      </h3>

                      <p className="mt-3 rounded-xl border border-[#E6ECF2] bg-[#F8FAFC] p-4 text-sm leading-6 text-[#344054]">
                        {visibleMovementReason || "—"}
                      </p>
                    </div>
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
                            value={getAssessmentResult(activeCandidate) || "—"}
                          />
                          <DetailRow
                            label="Assessment Score"
                            value={
                              formatAssessmentScoreDisplay(
                                activeCandidate.assessmentScore ||
                                  activeCandidate.assessment_score,
                              ) || "—"
                            }
                          />
                          <DetailRow
                            label="Email Sent"
                            value={
                              activeCandidate.assessmentEmailSent ||
                              activeCandidate.assessment_email_sent
                                ? "Yes"
                                : "No"
                            }
                          />
                          <DetailRow
                            label="Email Sent At"
                            value={
                              activeCandidate.assessmentEmailSentAt ||
                              activeCandidate.assessment_email_sent_at
                            }
                          />
                        </div>

                        {isOnlineAssessment && (
                          <div className="mt-4 grid grid-cols-1 gap-2">
                            <button
                              type="button"
                              disabled={isResendingAssessmentEmail}
                              onClick={handleResendAssessmentEmail}
                              className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-xl border border-blue-100 bg-blue-50 text-sm font-bold text-blue-700 transition hover:bg-blue-100 disabled:cursor-not-allowed disabled:opacity-70"
                            >
                              {isResendingAssessmentEmail ? (
                                <Loader2 size={16} className="animate-spin" />
                              ) : (
                                <Mail size={16} />
                              )}
                              {isResendingAssessmentEmail
                                ? "Resending..."
                                : "Resend Assessment Email"}
                            </button>

                            <button
                              type="button"
                              onClick={handleOpenAssessmentModalClick}
                              className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-xl bg-sibs-primary-1 text-sm font-bold text-white transition hover:opacity-90"
                            >
                              <ClipboardCheck size={16} />
                              Update Assessment
                            </button>
                          </div>
                        )}
                      </div>

                      <div className="rounded-xl border border-[#E6ECF2] bg-[#F8FAFC] p-5">
                        <h3 className="text-sm font-bold text-[#101828]">
                          Interview Details
                        </h3>

                        <div className="mt-4 rounded-xl bg-white p-4">
                          <DetailRow
                            label="Candidate ID"
                            value={activeCandidate.candidateId}
                          />
                          <DetailRow
                            label="Role / Account"
                            value={activeCandidate.roleAccount}
                          />
                          <DetailRow
                            label="Interview Date"
                            value={formatDateTime(activeCandidate.interviewDate)}
                          />
                          <DetailRow
                            label="Interview Type"
                            value={getDisplayInterviewType(activeCandidate)}
                          />
                          <DetailRow
                            label="Interview Status"
                            value={
                              getDisplayInterviewStatus(activeCandidate) || "—"
                            }
                          />

                          {(activeCandidate.finalInterviewResult ||
                            activeCandidate.final_interview_result ||
                            activeCandidate.reapplyEligibleAt ||
                            activeCandidate.reapply_eligible_at) && (
                            <>
                              <DetailRow
                                label="Final Interview Result"
                                value={
                                  activeCandidate.finalInterviewResult ||
                                  activeCandidate.final_interview_result ||
                                  "—"
                                }
                              />
                              <DetailRow
                                label="Final Interview Score"
                                value={
                                  activeCandidate.finalInterviewScore !== null &&
                                  activeCandidate.finalInterviewScore !== undefined &&
                                  activeCandidate.finalInterviewScore !== ""
                                    ? `${activeCandidate.finalInterviewScore}%`
                                    : activeCandidate.final_interview_score !== null &&
                                        activeCandidate.final_interview_score !== undefined &&
                                        activeCandidate.final_interview_score !== ""
                                      ? `${activeCandidate.final_interview_score}%`
                                      : "—"
                                }
                              />
                              <DetailRow
                                label="Required Passing Score"
                                value={
                                  activeCandidate.finalInterviewPassingScore !== null &&
                                  activeCandidate.finalInterviewPassingScore !== undefined &&
                                  activeCandidate.finalInterviewPassingScore !== ""
                                    ? `${activeCandidate.finalInterviewPassingScore}%`
                                    : activeCandidate.final_interview_passing_score !== null &&
                                        activeCandidate.final_interview_passing_score !== undefined &&
                                        activeCandidate.final_interview_passing_score !== ""
                                      ? `${activeCandidate.final_interview_passing_score}%`
                                      : "—"
                                }
                              />
                              <DetailRow
                                label="Failed Assessment Date"
                                value={
                                  formatDateTime(
                                    activeCandidate.finalInterviewFailedAt ||
                                      activeCandidate.final_interview_failed_at,
                                  ) || "—"
                                }
                              />
                              <DetailRow
                                label="Reapply Eligibility Date"
                                value={formatCandidateDateOnly(
                                  activeCandidate.reapplyEligibleAt ||
                                    activeCandidate.reapply_eligible_at,
                                )}
                              />
                              <DetailRow
                                label="Restriction Status"
                                value={
                                  activeCandidate.reapplicationRestrictionStatus ||
                                  activeCandidate.reapplication_restriction_status ||
                                  "—"
                                }
                              />
                            </>
                          )}

                          <div className="mt-4 flex items-center justify-between gap-4 text-[12px]">
                            <span className="shrink-0 font-bold uppercase text-sibs-tertiary-5">
                              Interview Link
                            </span>

                            <span
                              title={activeCandidate.onlineInterviewLink}
                              className={`block max-w-[60%] min-w-0 overflow-hidden truncate text-right ${
                                activeCandidate.onlineInterviewLink
                                  ? "text-blue-600 underline hover:cursor-pointer"
                                  : "text-sm font-bold text-[#344054]"
                              }`}
                              onClick={() => {
                                if (activeCandidate.onlineInterviewLink) {
                                  window.open(
                                    activeCandidate.onlineInterviewLink,
                                    "_blank",
                                  );
                                }
                              }}
                            >
                              <span className="inline-block max-w-full overflow-hidden truncate align-bottom">
                                {activeCandidate.onlineInterviewLink || "—"}
                              </span>
                            </span>
                          </div>

                          {activeCandidate.interviewStatus === "Cancelled" && (
                            <DetailRow
                              label="Cancellation Reason"
                              value={activeCandidate.cancellationReason || "—"}
                            />
                          )}
                        </div>

                        {isInterviewScheduled && candidateHasSchedule && (
                          <div className="mt-4 grid grid-cols-1 gap-2">
                            <button
                              type="button"
                              onClick={handleOpenInterviewSchedule}
                              className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-xl border border-blue-100 bg-blue-50 text-sm font-bold text-blue-700 transition hover:bg-blue-100"
                            >
                              <CalendarDays size={16} />
                              Update Interview Schedule
                            </button>

                            <button
                              type="button"
                              onClick={handleStartOrContinueInterview}
                              className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-xl bg-sibs-primary-1 text-sm font-bold text-white transition hover:opacity-90"
                            >
                              <CirclePlay size={16} />
                              {isInterviewInProgress
                                ? "Continue Interview"
                                : "Start Interview"}
                            </button>

                            <button
                              type="button"
                              onClick={() =>
                                onCompleteInterview?.(activeCandidate)
                              }
                              className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-xl border border-emerald-100 bg-emerald-50 text-sm font-bold text-emerald-700 transition hover:bg-emerald-100"
                            >
                              <ClipboardCheck size={16} />
                              Mark Interview Completed
                            </button>

                            <button
                              type="button"
                              onClick={() => onCancelInterview?.(activeCandidate)}
                              className="inline-flex h-10 w-full items-center justify-center rounded-xl border border-red-100 bg-red-50 text-sm font-bold text-red-600 transition hover:bg-red-100"
                            >
                              Cancel Interview
                            </button>
                          </div>
                        )}

                        {isAssessmentFit &&
                          canScheduleInterview(activeCandidate) && (
                            <button
                              type="button"
                              onClick={handleOpenInterviewSchedule}
                              className="mt-4 inline-flex h-10 w-full items-center justify-center gap-2 rounded-xl bg-sibs-primary-1 text-sm font-bold text-white transition hover:opacity-90"
                            >
                              <CalendarDays size={16} />
                              Schedule Interview
                            </button>
                          )}
                      </div>

                      {(isOffered ||
                        isAccepted ||
                        forNHO ||
                        isIncompleteOnboarding ||
                        isOnboarding) && (
                        <div className="rounded-xl border border-[#E6ECF2] bg-[#F8FAFC] p-4">
                          <h3 className="text-sm font-bold text-sibs-primary-1">
                            Offer and Approval
                          </h3>

                          <div className="mt-4 rounded-xl bg-white p-4">
                            <DetailRow
                              label="Offer Role"
                              value={
                                activeCandidate.offerDetails?.roleTitle ||
                                activeCandidate.roleTitle
                              }
                            />
                            <DetailRow
                              label="Hiring Requirement"
                              value={
                                activeCandidate.offerDetails
                                  ?.hiringRequirementId ||
                                activeCandidate.hiringRequirementId
                              }
                            />
                            <DetailRow
                              label="Final Role"
                              value={
                                activeCandidate.offerDetails?.roleTitle ||
                                activeCandidate.roleTitle
                              }
                            />
                            <DetailRow
                              label="Final Account"
                              value={activeCandidate.offerDetails?.account}
                            />
                            <DetailRow
                              label="Basic Daily Rate"
                              value={formatCurrency(
                                activeCandidate.offerDetails?.basicPay,
                              )}
                            />
                            <DetailRow
                              label="Daily De Minimis"
                              value={formatCurrency(
                                activeCandidate.offerDetails?.deminimisDailyRate,
                              )}
                            />
                            <DetailRow
                              label="Approval Status"
                              value={
                                activeCandidate.offerApprovalStatus ||
                                getOfferApprovalSummary(activeCandidate)
                              }
                            />
                            <DetailRow
                              label="Offer Email Sent"
                              value={
                                activeCandidate.offerEmailSent ? "Yes" : "No"
                              }
                            />
                            <DetailRow
                              label="Candidate Response"
                              value={activeCandidate.offerDecision || "—"}
                            />
                          </div>

                          {isOffered && (
                            <div className="mt-4 space-y-4">
                              {(() => {
                                const approvedBy = offerApprovers.filter(
                                  (approver) => {
                                    const approval =
                                      activeCandidate.offerApprovals?.[approver];

                                    return approval?.status === "Approved";
                                  },
                                );

                                const isRejected = offerApprovers.some(
                                  (approver) => {
                                    const approval =
                                      activeCandidate.offerApprovals?.[approver];

                                    return approval?.status === "Rejected";
                                  },
                                );

                                const approvalStatus =
                                  activeCandidate.offerApprovalStatus ||
                                  getOfferApprovalSummary(activeCandidate);

                                return (
                                  <div className="rounded-xl border border-[#E6ECF2] bg-white p-4">
                                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                                      <div>
                                        <p className="text-xs font-extrabold uppercase tracking-wide text-sibs-tertiary-5">
                                          Offer Approval
                                        </p>

                                        <h4 className="mt-1 text-base font-extrabold text-[#101828]">
                                          {approvalStatus === "Approved"
                                            ? "Offer Approved"
                                            : isRejected
                                              ? "Offer Rejected"
                                              : "For Review"}
                                        </h4>
                                      </div>

                                      <span
                                        className={`w-fit rounded-full border px-3 py-1 text-xs font-extrabold ${getOfferApprovalClass(
                                          approvalStatus || "For Review",
                                        )}`}
                                      >
                                        {approvalStatus || "For Review"}
                                      </span>
                                    </div>

                                    <div className="mt-4 rounded-xl border border-[#E6ECF2] bg-[#F8FAFC] p-4">
                                      <p className="text-xs font-extrabold uppercase tracking-wide text-sibs-tertiary-5">
                                        Approved By
                                      </p>

                                      <p className="mt-2 text-sm font-bold leading-6 text-sibs-primary-1">
                                        {approvedBy.length > 0
                                          ? approvedBy.join(", ")
                                          : "Waiting for approval"}
                                      </p>
                                    </div>

                                    {approvalStatus !== "Approved" &&
                                      !isRejected && (
                                        <p className="mt-3 rounded-xl border border-amber-100 bg-amber-50 p-3 text-sm font-semibold leading-6 text-sibs-primary-1">
                                          Offer is still for review. The email
                                          button will be enabled once all
                                          required approvals are completed in the
                                          Offers page.
                                        </p>
                                      )}

                                    {isRejected && (
                                      <p className="mt-3 rounded-xl border border-red-100 bg-red-50 p-3 text-sm font-semibold leading-6 text-red-600">
                                        Offer approval was rejected. Please
                                        review the approval details in the
                                        Offers page.
                                      </p>
                                    )}
                                  </div>
                                );
                              })()}

                              {isOfferApproved(activeCandidate) &&
                                !activeCandidate.offerEmailSent && (
                                  <button
                                    type="button"
                                    onClick={() =>
                                      onSendOfferEmail?.(activeCandidate)
                                    }
                                    className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-xl bg-sibs-primary-1 text-sm font-bold text-white transition hover:opacity-90"
                                  >
                                    <Mail size={16} />
                                    Send Offer Email to Candidate
                                  </button>
                                )}

                              {isOfferApproved(activeCandidate) && (
                                <button
                                  type="button"
                                  onClick={() =>
                                    window.open(
                                      buildOfferContractLink(activeCandidate),
                                      "_blank",
                                      "noopener,noreferrer",
                                    )
                                  }
                                  className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-xl border border-blue-100 bg-blue-50 text-sm font-bold text-blue-700 transition hover:bg-blue-100"
                                >
                                  <Eye size={16} />
                                  Open Candidate Offer Link Manually
                                </button>
                              )}

                              {activeCandidate.offerEmailSent && (
                                <div className="rounded-xl border border-[#E6ECF2] bg-white p-4">
                                  <p className="text-xs font-bold uppercase tracking-wide text-sibs-tertiary-5">
                                    Candidate Offer Response
                                  </p>
                                  <p className="mt-2 text-xs font-semibold leading-5 text-sibs-tertiary-5">
                                    Use these buttons only when the candidate
                                    cannot access the email link or TA needs to
                                    record the response manually.
                                  </p>
                                  <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-3">
                                    {offerDecisionOptions.map((decision) => (
                                      <button
                                        key={decision}
                                        type="button"
                                        onClick={() =>
                                          onOfferDecision?.(
                                            activeCandidate,
                                            decision,
                                          )
                                        }
                                        className={`inline-flex h-9 items-center justify-center rounded-xl border px-3 text-xs font-bold transition ${getOfferDecisionClass(
                                          decision,
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

                      {(isAccepted ||
                        forNHO ||
                        isIncompleteOnboarding ||
                        isOnboarding) &&
                        nhoScheduleSection}
                    </div>
                  )}
                </div>

                {canShowNhoUploads && (
                  <PreEmploymentRequirementsPanel
                    candidateName={activeCandidate.name}
                    candidateEmail={activeCandidate.email}
                    files={sortedCandidateFiles}
                    selectedFile={selectedNhoFile}
                    disabled={isSavingNhoFiles}
                    saveError={nhoFilesError}
                    saveSuccess={nhoFilesSuccess}
                    onUpload={handleRequirementUpload}
                    onRemove={requestRequirementFileDelete}
                    onSelectFile={setSelectedNhoFile}
                  />
                )}
              </div>
            </div>
          </div>

          {currentStage === "Drop-off" && (
            <div className="border-t border-gray-100 px-5 py-5 sm:px-6">
              <div className="rounded-xl border border-[#E6ECF2] bg-[#F8FAFC] p-5">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <h3 className="text-sm font-bold text-[#101828]">
                      Drop-off Email Notification
                    </h3>
                    <p className="mt-1 text-xs font-semibold text-[#667085]">
                      Automatic application update delivery status
                    </p>
                  </div>

                  <span className="inline-flex w-fit rounded-full border border-blue-100 bg-white px-3 py-1 text-xs font-extrabold text-sibs-primary-1">
                    {activeCandidate.dropOffEmailStatus ||
                      activeCandidate.drop_off_email_status ||
                      "Not Sent"}
                  </span>
                </div>

                <div className="mt-4 rounded-xl bg-white p-4">
                  <DetailRow
                    label="Recipient"
                    value={
                      activeCandidate.dropOffEmailRecipient ||
                      activeCandidate.drop_off_email_recipient ||
                      activeCandidate.email ||
                      "No email saved"
                    }
                  />
                  <DetailRow
                    label="Attempt Count"
                    value={
                      activeCandidate.dropOffEmailAttemptCount ??
                      activeCandidate.drop_off_email_attempt_count ??
                      0
                    }
                  />
                  <DetailRow
                    label="Sent At"
                    value={
                      formatDateTime(
                        activeCandidate.dropOffEmailSentAt ||
                          activeCandidate.drop_off_email_sent_at,
                      ) || "—"
                    }
                  />
                  <DetailRow
                    label="Last Attempt"
                    value={
                      formatDateTime(
                        activeCandidate.dropOffEmailLastAttemptAt ||
                          activeCandidate.drop_off_email_last_attempt_at,
                      ) || "—"
                    }
                  />
                  <DetailRow
                    label="Delivery Error"
                    value={
                      activeCandidate.dropOffEmailError ||
                      activeCandidate.drop_off_email_error ||
                      "—"
                    }
                  />
                </div>

                <button
                  type="button"
                  disabled={isResendingDropOffEmail}
                  onClick={handleResendDropOffNotification}
                  className="mt-4 inline-flex h-10 w-full items-center justify-center gap-2 rounded-xl border border-blue-100 bg-blue-50 text-sm font-bold text-blue-700 transition hover:bg-blue-100 disabled:cursor-not-allowed disabled:opacity-70"
                >
                  {isResendingDropOffEmail ? (
                    <Loader2 size={16} className="animate-spin" />
                  ) : (
                    <Mail size={16} />
                  )}
                  {isResendingDropOffEmail
                    ? "Resending..."
                    : "Resend Drop-off Email"}
                </button>
              </div>
            </div>
          )}

          <div className="border-t border-gray-100 px-5 py-4 sm:px-6">
            <div className="flex flex-col justify-end gap-2 sm:flex-row">
              {!isInitialScreening && currentStage !== "Drop-off" && (
                <button
                  type="button"
                  onClick={() => onOpenDropOffModal?.(activeCandidate)}
                  className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-red-200 bg-red-50 px-5 text-sm font-bold text-red-500 transition hover:bg-red-100"
                >
                  <UserX size={16} />
                  Mark Drop-off
                </button>
              )}

              {isOffered && (
                <button
                  type="button"
                  onClick={handleGoToOffer}
                  className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-sibs-primary-1 px-5 text-sm font-bold text-white transition hover:opacity-90"
                >
                  <ArrowRight size={16} />
                  Go to Offer
                </button>
              )}

              {isAccepted && (
                <button
                  type="button"
                  disabled={isSchedulingNho}
                  onClick={handleScheduleNhoClick}
                  className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-sibs-primary-1 px-5 text-sm font-bold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isSchedulingNho ? (
                    <Loader2
                      size={16}
                      className="animate-spin"
                    />
                  ) : (
                    <CalendarDays size={16} />
                  )}
                  {isSchedulingNho
                    ? "Scheduling..."
                    : "Schedule NHO"}
                </button>
              )}

              {canShowNhoUploads && (
                <button
                  type="button"
                  disabled={isSavingNhoFiles}
                  onClick={handleSavePreEmploymentRequirements}
                  className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-sibs-primary-1 px-5 text-sm font-bold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-70"
                >
                  {isSavingNhoFiles ? (
                    <Loader2 size={16} className="animate-spin" />
                  ) : (
                    <UploadCloud size={16} />
                  )}
                  {isSavingNhoFiles ? "Saving..." : "Save"}
                </button>
              )}

              {canShowNhoUploads &&
                majorNhoProgress.isComplete &&
                !isOnboarding && (
                  <button
                    type="button"
                    disabled={isSavingNhoFiles || isLoadingNhoFiles}
                    onClick={handleMoveToOnboarding}
                    className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-5 text-sm font-bold text-emerald-700 transition hover:bg-emerald-100 disabled:cursor-not-allowed disabled:opacity-70"
                  >
                    <ArrowRight size={16} />
                    Move to Onboarding
                  </button>
                )}

              {isInterviewed && nextStage && (
                <button
                  type="button"
                  onClick={handleMoveToNextStage}
                  className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-sibs-primary-1 px-5 text-sm font-bold text-white transition hover:opacity-90"
                >
                  <ArrowRight size={16} />
                  Move to {nextStage}
                </button>
              )}

              {canProceedInitialScreening && (
                <button
                  type="button"
                  disabled={isProceedingInitialScreening}
                  onClick={handleProceedInitialScreening}
                  className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-sibs-primary-1 px-5 text-sm font-bold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isProceedingInitialScreening ? (
                    <Loader2 size={16} className="animate-spin" />
                  ) : (
                    <ArrowRight size={16} />
                  )}
                  {isProceedingInitialScreening
                    ? "Processing..."
                    : activePrfStatus === "Not Matched"
                      ? "Proceed"
                      : "Proceed on Initial Screening"}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      <NhoScheduleModal
        open={showNhoScheduleModal}
        candidate={activeCandidate}
        value={nhoScheduleDate}
        isSaving={isSchedulingNho}
        onChange={setNhoScheduleDate}
        onClose={() => {
          if (!isSchedulingNho) {
            setShowNhoScheduleModal(false);
          }
        }}
        onSubmit={handleConfirmScheduleNho}
      />

      <UpdateAssessmentModal
        open={showAssessmentModal}
        candidate={activeCandidate}
        candidateId={candidateNhoUploadId}
        onClose={() => setShowAssessmentModal(false)}
        onSaved={handleAssessmentSaved}
      />

          <AssessmentEmailFormatModal
            open={showAssessmentEmailModal}
            candidate={activeCandidate}
            form={assessmentEmailForm}
            isSending={isSendingAssessmentEmail}
            onChange={setAssessmentEmailForm}
            onClose={() => {
              if (!isSendingAssessmentEmail) {
                setShowAssessmentEmailModal(false);
              }
            }}
            onSend={handleConfirmSendAssessmentEmail}
          />
        </>
      )}

      <StatusModal
        open={deleteFileConfirmation.open}
        type="confirm"
        title="Delete File?"
        message={`This will permanently remove ${
          deleteFileConfirmation.file?.fileName ||
          deleteFileConfirmation.file?.savedFileName ||
          deleteFileConfirmation.file?.filename ||
          "the selected document"
        } from the Candidate Pipeline server folder. This action cannot be undone.`}
        confirmLabel="Delete Permanently"
        cancelLabel="Cancel"
        variant="center"
        onConfirm={confirmRequirementFileDelete}
        onCancel={cancelRequirementFileDelete}
        lockScroll={false}
      />

      <StatusModal
        open={statusModal.open}
        type={statusModal.type}
        title={statusModal.title}
        message={statusModal.message}
        variant="center"
        onClose={closeStatusModal}
        lockScroll={false}
      />
    </>
  );
};

export default CandidatePipelineModal;
