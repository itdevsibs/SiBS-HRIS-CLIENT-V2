import { formatHrisDateTimeLocalized } from "@/lib/axios/dateFormatter";
import React, {
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  AlertCircle,
  BarChart3,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  ClipboardList,
  ExternalLink,
  LayoutDashboard,
  Loader2,
  Sparkles,
} from "lucide-react";
import CandidatePipelineContext from "../../../services/context/CandidatePipelineContext";

import {
  deleteFinalInterviewDraft,
  getFinalInterviewDraft,
  saveFinalInterviewDraft,
} from "../../../lib/axios/getFinalInterviewDraft";

import api from "../../../lib/axios/api-template";
import {
  getFinalInterviewFormByPosition,
  getFinalInterviewForms,
} from "../../../lib/axios/getRecruitmentSettings";
import StatusModal from "../../../components/modals/StatusModal";
import ConfirmModal from "../../../components/ui/ConfirmModal";
import RichTextViewer from "../../../components/modals/jobDescription/RichTextViewer";
import FinalInterviewStandardWorkspace from "./FinalInterviewStandardWorkspace";
import FinalInterviewAiWorkspace from "./FinalInterviewAiWorkspace";
import {
  findMatchingFinalInterviewForm,
  getFinalInterviewFormFields,
  getFinalInterviewFormId,
  getFinalInterviewFormPositionId,
  getFinalInterviewFormPositionTitle,
  getRecruitmentSettingsSnapshot,
} from "../../../lib/utils/recruitment/finalInterviewFormMatching";
import {
  buildAuthorizedResumeDocumentUrl,
  getFinalInterviewResumeIntelligence,
  regenerateApplicationResumeIntelligence,
  reviewResumeIntelligenceQuestions,
} from "../../../lib/axios/resumeIntelligenceClient";

const RECRUITMENT_SETTINGS_STORAGE_KEY = "sibs_recruitment_settings_temp";
const DEFAULT_JOB_EVALUATION_FORM_ID = "default-job-evaluation";

function richTextToPlainText(value = "") {
  const source = String(value || "");

  if (typeof DOMParser === "undefined") {
    return source.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
  }

  const parsed = new DOMParser().parseFromString(source, "text/html");
  return String(parsed.body?.textContent || source).replace(/\s+/g, " ").trim();
}

const JOB_EVALUATION_FIELDS = {
  education: "je_education",
  experience: "je_experience",
  location: "je_location",
  duties: "je_duties",
  competencies: "je_competencies",
};

const educationOptions = [
  { label: "Senior High School", score: 5 },
  { label: "College Level", score: 10 },
  { label: "College - Non Bachelor's degree", score: 15 },
  { label: "College Graduate - Bachelor's Degree", score: 20 },
];

const experienceOptions = [
  { label: "No experience", score: 0 },
  { label: "1 - 6 months", score: 5 },
  { label: "7 months to 1 year", score: 10 },
  { label: "1 - 3 years", score: 15 },
  { label: "More than 3 years", score: 20 },
];

const locationOptions = [
  { label: "Davao", score: 10 },
  { label: "Tagum", score: 5 },
  { label: "WFH", score: 3 },
];

const dutiesOptions = [
  {
    label:
      "Handle inbound or outbound following standard operating procedures, call flows, and targets.",
    score: 5,
  },
  {
    label:
      "Manages multiple chat interactions simultaneously with high-quality responses.",
    score: 5,
  },
  {
    label:
      "Manages claims processing: filing, re-filing, verifying, and resolving discrepancies.",
    score: 6,
  },
  {
    label: "Multi-channel handling: chat, email, phone.",
    score: 7,
  },
  {
    label:
      "Performs all listed duties efficiently and accurately, including multi-tasking, troubleshooting, maintaining records, and following procedures.",
    score: 7,
  },
];

const competenciesOptions = [
  {
    label:
      "Proficient in English and capable of handling phone calls professionally.",
    score: 4,
  },
  {
    label:
      "Can quickly assess a situation, identify root cause, and provide an effective resolution.",
    score: 4,
  },
  {
    label:
      "Comprehensive understanding of client products, services, and requirements.",
    score: 6,
  },
  {
    label:
      "Highly proficient in navigating software and systems, handling multiple tasks, and maintaining service standards.",
    score: 6,
  },
];

function safeReadSettings() {
  return getRecruitmentSettingsSnapshot();
}

function normalizeText(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ");
}

function normalizeId(value) {
  return String(value || "").trim().toLowerCase();
}

function formatFinalInterviewDateTime(value) {
  if (!value) return "—";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);

  return formatHrisDateTimeLocalized(date, "en-PH", {
    month: "long",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}

function formatReapplyEligibilityDate(value) {
  const text = String(value || "").trim();
  const match = text.match(/^(\d{4})-(\d{2})-(\d{2})/);

  if (!match) return text || "the saved eligibility date";

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

function safeJsonParseValue(value, fallback) {
  if (value === null || value === undefined || value === "") return fallback;

  if (typeof value === "string") {
    try {
      return JSON.parse(value);
    } catch {
      return fallback;
    }
  }

  return value;
}

function safeArray(value) {
  const parsed = safeJsonParseValue(value, value);
  return Array.isArray(parsed) ? parsed.filter(Boolean) : [];
}

function getFirstNonEmptyFieldArray(...sources) {
  for (const source of sources) {
    const fields = safeArray(source);

    if (fields.length > 0) {
      return fields;
    }
  }

  return [];
}

function safeObject(value) {
  const parsed = safeJsonParseValue(value, value);

  return parsed && typeof parsed === "object" && !Array.isArray(parsed)
    ? parsed
    : {};
}

function cleanText(value) {
  return String(value ?? "").trim();
}

function getApiErrorMessage(error, fallback = "Request failed.") {
  return (
    error?.response?.data?.message ||
    error?.response?.data?.error ||
    error?.message ||
    fallback
  );
}

function objectHasData(value) {
  return Object.keys(safeObject(value)).length > 0;
}

function getCandidateApplicationId(candidate = {}) {
  return (
    candidate.effectiveCandidateApplicationId ||
    candidate.candidateApplicationId ||
    candidate.candidate_application_id ||
    candidate.applicationId ||
    candidate.application_id ||
    candidate.id ||
    candidate.candidateSnapshot?.effectiveCandidateApplicationId ||
    candidate.candidateSnapshot?.candidateApplicationId ||
    candidate.candidateSnapshot?.candidate_application_id ||
    candidate.candidateSnapshot?.applicationId ||
    candidate.candidateSnapshot?.application_id ||
    candidate.candidateSnapshot?.id ||
    ""
  );
}

function getCandidatePublicId(candidate = {}) {
  return (
    candidate.candidateId ||
    candidate.candidate_id ||
    candidate.publicId ||
    candidate.public_id ||
    candidate.candidateSnapshot?.candidateId ||
    candidate.candidateSnapshot?.candidate_id ||
    ""
  );
}

function normalizeSubmittedForm(form = {}) {
  const safeForm = safeObject(form);

  return {
    ...safeForm,
    id:
      safeForm.id ||
      safeForm.submissionId ||
      safeForm.submission_id ||
      safeForm.formSubmissionId ||
      safeForm.form_submission_id ||
      "",
    formId: safeForm.formId || safeForm.form_id || "",
    formName:
      safeForm.formName ||
      safeForm.form_name ||
      safeForm.name ||
      "Job Evaluation Form",
    submittedBy:
      safeForm.submittedBy ||
      safeForm.submitted_by ||
      safeForm.createdBy ||
      safeForm.created_by ||
      "Candidate",
    submittedAt:
      safeForm.submittedAt ||
      safeForm.submitted_at ||
      safeForm.submittedAtIso ||
      safeForm.submitted_at_iso ||
      safeForm.savedAt ||
      safeForm.saved_at ||
      safeForm.createdAt ||
      safeForm.created_at ||
      safeForm.updatedAt ||
      safeForm.updated_at ||
      "",
    answers: safeObject(
      safeForm.answers ||
        safeForm.answers_json ||
        safeForm.formAnswers ||
        safeForm.form_answers ||
        safeForm.response ||
        safeForm.responses,
    ),
    fieldsSnapshot: safeArray(
      safeForm.fieldsSnapshot ||
        safeForm.fields_snapshot ||
        safeForm.fields_snapshot_json ||
        safeForm.fields ||
        safeForm.questions,
    ),
    scoreSummary: safeObject(
      safeForm.scoreSummary ||
        safeForm.score_summary ||
        safeForm.score_summary_json ||
        safeForm.scores,
    ),
  };
}

function normalizeDraftAsForm(draft = {}) {
  const safeDraft = safeObject(draft);

  if (!objectHasData(safeDraft.answers || safeDraft.answers_json)) {
    return null;
  }

  return normalizeSubmittedForm({
    id: safeDraft.id ? `DRAFT-${safeDraft.id}` : "DRAFT-PUBLIC-ASSESSMENT",
    formId: safeDraft.formId || safeDraft.form_id || DEFAULT_JOB_EVALUATION_FORM_ID,
    formName: safeDraft.formName || safeDraft.form_name || "Job Evaluation Form",
    answers: safeDraft.answers || safeDraft.answers_json || {},
    fieldsSnapshot:
      safeDraft.fieldsSnapshot ||
      safeDraft.fields_snapshot ||
      safeDraft.fields_snapshot_json ||
      [],
    scoreSummary:
      safeDraft.scoreSummary ||
      safeDraft.score_summary ||
      safeDraft.score_summary_json ||
      {},
    submittedBy:
      safeDraft.savedBySibsId ||
      safeDraft.saved_by_sibs_id ||
      safeDraft.submittedBy ||
      "Candidate",
    submittedAt:
      safeDraft.savedAt ||
      safeDraft.saved_at ||
      safeDraft.updatedAt ||
      safeDraft.updated_at ||
      "",
    isDraftFallback: true,
  });
}

function getDraftPayloadFromResponse(response = {}) {
  const root = response?.data ?? response;

  const candidates = [
    root?.data?.draft,
    root?.draft,
    root?.data,
    root?.record,
    root,
  ];

  return (
    candidates.find((item) => {
      const safeItem = safeObject(item);

      return (
        objectHasData(safeItem.answers || safeItem.answers_json) ||
        objectHasData(safeItem.scoreSummary || safeItem.score_summary) ||
        safeArray(
          safeItem.fieldsSnapshot ||
            safeItem.fields_snapshot ||
            safeItem.fields_snapshot_json,
        ).length > 0 ||
        cleanText(safeItem.savedAt || safeItem.saved_at || safeItem.updatedAt)
      );
    }) || {}
  );
}

function getDraftAnswers(draftPayload = {}) {
  return safeObject(
    draftPayload.answers ||
      draftPayload.answers_json ||
      draftPayload.data?.answers ||
      draftPayload.data?.answers_json ||
      draftPayload.draft?.answers ||
      draftPayload.draft?.answers_json,
  );
}

function getDraftScoreSummary(draftPayload = {}) {
  return safeObject(
    draftPayload.scoreSummary ||
      draftPayload.score_summary ||
      draftPayload.score_summary_json ||
      draftPayload.data?.scoreSummary ||
      draftPayload.data?.score_summary ||
      draftPayload.data?.score_summary_json ||
      draftPayload.draft?.scoreSummary ||
      draftPayload.draft?.score_summary ||
      draftPayload.draft?.score_summary_json,
  );
}

function getDraftFieldsSnapshot(draftPayload = {}) {
  return safeArray(
    draftPayload.fieldsSnapshot ||
      draftPayload.fields_snapshot ||
      draftPayload.fields_snapshot_json ||
      draftPayload.data?.fieldsSnapshot ||
      draftPayload.data?.fields_snapshot ||
      draftPayload.data?.fields_snapshot_json ||
      draftPayload.draft?.fieldsSnapshot ||
      draftPayload.draft?.fields_snapshot ||
      draftPayload.draft?.fields_snapshot_json,
  );
}

function getDraftSavedAt(draftPayload = {}) {
  return (
    draftPayload.savedAt ||
    draftPayload.saved_at ||
    draftPayload.updatedAt ||
    draftPayload.updated_at ||
    draftPayload.createdAt ||
    draftPayload.created_at ||
    draftPayload.data?.savedAt ||
    draftPayload.data?.saved_at ||
    draftPayload.data?.updatedAt ||
    draftPayload.data?.updated_at ||
    draftPayload.draft?.savedAt ||
    draftPayload.draft?.saved_at ||
    draftPayload.draft?.updatedAt ||
    draftPayload.draft?.updated_at ||
    ""
  );
}

function normalizeDatabaseDraftAsSubmittedForm({
  draftPayload = {},
  effectiveFormId = DEFAULT_JOB_EVALUATION_FORM_ID,
  fallbackFormName = "Job Evaluation Form",
}) {
  const answers = getDraftAnswers(draftPayload);

  if (!objectHasData(answers)) return null;

  return normalizeSubmittedForm({
    id: draftPayload.id ? `DRAFT-${draftPayload.id}` : "DRAFT-DATABASE",
    formId: draftPayload.formId || draftPayload.form_id || effectiveFormId,
    formName: draftPayload.formName || draftPayload.form_name || fallbackFormName,
    answers,
    fieldsSnapshot: getDraftFieldsSnapshot(draftPayload),
    scoreSummary: getDraftScoreSummary(draftPayload),
    submittedBy:
      draftPayload.savedBySibsId ||
      draftPayload.saved_by_sibs_id ||
      draftPayload.submittedBy ||
      draftPayload.submitted_by ||
      "Candidate",
    submittedAt: getDraftSavedAt(draftPayload),
    isDraftFallback: true,
  });
}

function getSubmittedForms(candidate = {}) {
  const submittedForms = safeArray(
    candidate.finalInterviewSubmittedForms ||
      candidate.final_interview_submitted_forms ||
      candidate.submittedFinalInterviewForms ||
      candidate.submitted_final_interview_forms ||
      candidate.jobEvaluationSubmittedForms ||
      candidate.job_evaluation_submitted_forms,
  );

  const publicAssessment = safeObject(candidate.publicAssessment);

  const displayForm =
    publicAssessment.displayForm ||
    publicAssessment.submittedForm ||
    publicAssessment.finishedForm ||
    publicAssessment.form ||
    null;

  const draftForm = normalizeDraftAsForm(
    publicAssessment.draft || candidate.draft || candidate.publicDraft,
  );

  return [...submittedForms, displayForm, draftForm]
    .filter(Boolean)
    .map(normalizeSubmittedForm)
    .filter((form) => objectHasData(form.answers));
}

function mergeCandidateRecords(primary = {}, secondary = {}) {
  const first = safeObject(primary);
  const second = safeObject(secondary);

  const formMap = new Map();

  [...getSubmittedForms(first), ...getSubmittedForms(second)].forEach(
    (form, index) => {
      const key =
        form.id ||
        `${form.formId || "form"}-${form.submittedAt || index}-${index}`;

      formMap.set(String(key), form);
    },
  );

  return {
    ...first,
    ...second,
    finalInterviewSubmittedForms: Array.from(formMap.values()),
  };
}

function getCandidatePositionName(candidate = {}) {
  return (
    candidate.openPosition ||
    candidate.open_position ||
    candidate.roleCapability ||
    candidate.role_capability ||
    candidate.currentAppliedRole ||
    candidate.current_applied_role ||
    candidate.roleTitle ||
    candidate.role_title ||
    candidate.positionTitle ||
    candidate.position_title ||
    candidate.candidateSnapshot?.openPosition ||
    candidate.candidateSnapshot?.open_position ||
    candidate.candidateSnapshot?.roleCapability ||
    candidate.candidateSnapshot?.role_capability ||
    candidate.candidateSnapshot?.currentAppliedRole ||
    candidate.candidateSnapshot?.current_applied_role ||
    candidate.candidateSnapshot?.roleTitle ||
    candidate.candidateSnapshot?.role_title ||
    ""
  );
}

function getCandidatePositionId(candidate = {}) {
  return (
    candidate.positionId ||
    candidate.position_id ||
    candidate.currentPositionId ||
    candidate.current_position_id ||
    candidate.appliedPositionId ||
    candidate.applied_position_id ||
    candidate.jobPositionId ||
    candidate.job_position_id ||
    candidate.hiringRequirementPositionId ||
    candidate.hiring_requirement_position_id ||
    candidate.availablePositionId ||
    candidate.available_position_id ||
    candidate.candidateSnapshot?.positionId ||
    candidate.candidateSnapshot?.position_id ||
    candidate.candidateSnapshot?.currentPositionId ||
    candidate.candidateSnapshot?.current_position_id ||
    candidate.candidateSnapshot?.appliedPositionId ||
    candidate.candidateSnapshot?.applied_position_id ||
    candidate.candidateSnapshot?.jobPositionId ||
    candidate.candidateSnapshot?.job_position_id ||
    candidate.candidateSnapshot?.hiringRequirementPositionId ||
    candidate.candidateSnapshot?.hiring_requirement_position_id ||
    candidate.candidateSnapshot?.availablePositionId ||
    candidate.candidateSnapshot?.available_position_id ||
    ""
  );
}

function getFormPositionId(form = {}) {
  return (
    form.positionId ||
    form.position_id ||
    form.availablePositionId ||
    form.available_position_id ||
    form.selectedPositionId ||
    form.selected_position_id ||
    form.roleId ||
    form.role_id ||
    ""
  );
}

function getFormPositionName(form = {}) {
  return (
    form.positionTitle ||
    form.position_title ||
    form.positionName ||
    form.position_name ||
    form.roleTitle ||
    form.role_title ||
    form.roleName ||
    form.role_name ||
    form.selectedPositionTitle ||
    form.selected_position_title ||
    form.selectedPositionName ||
    form.selected_position_name ||
    form.availablePositionTitle ||
    form.available_position_title ||
    form.availablePositionName ||
    form.available_position_name ||
    form.formPosition ||
    form.form_position ||
    form.name ||
    ""
  );
}

function _formMatchesPosition(form = {}, target = {}) {
  const targetPositionId = normalizeId(target.positionId);
  const targetPositionName = normalizeText(target.positionName);

  const formPositionId = normalizeId(getFormPositionId(form));
  const formPositionName = normalizeText(getFormPositionName(form));

  if (targetPositionId && formPositionId && targetPositionId === formPositionId) {
    return true;
  }

  if (!targetPositionName || !formPositionName) {
    return false;
  }

  return (
    formPositionName === targetPositionName ||
    formPositionName.includes(targetPositionName) ||
    targetPositionName.includes(formPositionName)
  );
}

function groupFieldsBySection(fields = []) {
  const groups = new Map();

  fields
    .filter((field) => field.enabled !== false)
    .forEach((field) => {
      const section = field.section || "Untitled Section";

      if (!groups.has(section)) {
        groups.set(section, {
          section,
          questions: [],
        });
      }

      groups.get(section).questions.push(field);
    });

  return Array.from(groups.values());
}

function getPassingScore(form) {
  const rawValue =
    form?.passingScore ??
    form?.passing_score ??
    form?.passingRate ??
    form?.passing_rate ??
    form?.passing_percentage ??
    form?.passingPercentage ??
    80;

  const numericValue = Number(rawValue);

  if (!Number.isFinite(numericValue)) return 80;

  return Math.min(Math.max(numericValue, 0), 100);
}

function getJobEvaluationTitle(formName) {
  const cleanedName = String(formName || "Job Evaluation Form").trim();

  if (!cleanedName) return "Job Evaluation Form";

  return cleanedName
    .replace(/Final Interview Form/gi, "Job Evaluation Form")
    .replace(/Final Interview/gi, "Job Evaluation");
}

function getOptionScore(options = [], selectedLabel) {
  const option = options.find(
    (item) => String(item.label) === String(selectedLabel),
  );

  return option ? Number(option.score) || 0 : 0;
}

function getSelectedOptionDetail(options = [], selectedLabel = "") {
  return (
    options.find((option) => String(option.label) === String(selectedLabel)) ||
    null
  );
}

function getSelectedOptionDetails(options = [], selectedValues = []) {
  const safeValues = Array.isArray(selectedValues) ? selectedValues : [];

  return safeValues
    .map((value) => getSelectedOptionDetail(options, value))
    .filter(Boolean);
}

function getMultiSelectScore(options = [], selectedValues = []) {
  if (!Array.isArray(selectedValues)) return 0;

  return selectedValues.reduce((total, selectedLabel) => {
    return total + getOptionScore(options, selectedLabel);
  }, 0);
}

function getRankTone(rank) {
  switch (String(rank || "").toUpperCase()) {
    case "A":
      return "success";
    case "B":
      return "blue";
    case "C":
      return "warning";
    case "D":
      return "orange";
    case "E":
    default:
      return "danger";
  }
}

function getRankStatus(rank) {
  switch (String(rank || "").toUpperCase()) {
    case "A":
      return "Excellent";
    case "B":
      return "Good";
    case "C":
      return "Average";
    case "D":
      return "Needs Improvement";
    case "E":
    default:
      return "Failed";
  }
}

function getRank(totalScore) {
  if (totalScore >= 90) return "A";
  if (totalScore >= 80) return "B";
  if (totalScore >= 70) return "C";
  if (totalScore >= 60) return "D";
  return "E";
}

function calculateJobEvaluationScore(answers = {}) {
  const educationScore = getOptionScore(
    educationOptions,
    answers[JOB_EVALUATION_FIELDS.education],
  );

  const experienceScore = getOptionScore(
    experienceOptions,
    answers[JOB_EVALUATION_FIELDS.experience],
  );

  const locationScore = getOptionScore(
    locationOptions,
    answers[JOB_EVALUATION_FIELDS.location],
  );

  const dutiesScore = getMultiSelectScore(
    dutiesOptions,
    answers[JOB_EVALUATION_FIELDS.duties],
  );

  const competenciesScore = getMultiSelectScore(
    competenciesOptions,
    answers[JOB_EVALUATION_FIELDS.competencies],
  );

  const totalScore =
    educationScore +
    experienceScore +
    locationScore +
    dutiesScore +
    competenciesScore;

  return {
    educationScore,
    experienceScore,
    locationScore,
    dutiesScore,
    competenciesScore,
    totalScore,
    percentageScore: totalScore,
    rank: getRank(totalScore),
    maxScore: 100,
  };
}

function getFinalInterviewQuestionId(field = {}, index = 0) {
  const rawId =
    field.id ||
    field.fieldId ||
    field.field_id ||
    field.questionId ||
    field.question_id ||
    field.key ||
    field.name ||
    `final-interview-question-${index + 1}`;

  return String(rawId).trim();
}

function getQuestionRatingKey(questionId) {
  return `__final_interview_rating__${String(questionId || "").trim()}`;
}

function getQuestionRemarkKey(questionId) {
  return `__final_interview_remark__${String(questionId || "").trim()}`;
}

function calculateRatingScore(fields = [], answers = {}) {
  const scorableFields = fields.filter((field) => field.enabled !== false);

  const ratedValues = scorableFields
    .map((field, index) => {
      const questionId = getFinalInterviewQuestionId(field, index);
      const ratingKey = getQuestionRatingKey(questionId);

      return Number(answers[ratingKey]);
    })
    .filter((value) => Number.isFinite(value) && value >= 1 && value <= 5);

  const totalRatingFields = scorableFields.length;
  const answeredRatingFields = ratedValues.length;
  const totalScore = ratedValues.reduce((sum, value) => sum + value, 0);
  const maximumScore = totalRatingFields * 5;

  const averageRating =
    answeredRatingFields > 0 ? totalScore / answeredRatingFields : 0;

  const percentageScore =
    maximumScore > 0 ? (totalScore / maximumScore) * 100 : 0;

  return {
    totalRatingFields,
    answeredRatingFields,
    totalScore,
    maximumScore,
    averageRating,
    percentageScore,
  };
}

function normalizeScoreNumber(value, fallback = 0) {
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : fallback;
}

function normalizeSavedJobEvaluationScore(savedScore = {}, computedScore = {}) {
  const saved = safeObject(savedScore);

  if (!Object.keys(saved).length) {
    return computedScore;
  }

  const totalScore = normalizeScoreNumber(
    saved.totalScore ??
      saved.total_score ??
      saved.percentageScore ??
      saved.percentage_score ??
      saved.score,
    computedScore.totalScore,
  );

  return {
    educationScore: normalizeScoreNumber(
      saved.educationScore ?? saved.education_score ?? saved.education,
      computedScore.educationScore,
    ),
    experienceScore: normalizeScoreNumber(
      saved.experienceScore ?? saved.experience_score ?? saved.experience,
      computedScore.experienceScore,
    ),
    locationScore: normalizeScoreNumber(
      saved.locationScore ?? saved.location_score ?? saved.location,
      computedScore.locationScore,
    ),
    dutiesScore: normalizeScoreNumber(
      saved.dutiesScore ?? saved.duties_score ?? saved.duties,
      computedScore.dutiesScore,
    ),
    competenciesScore: normalizeScoreNumber(
      saved.competenciesScore ?? saved.competencies_score ?? saved.competencies,
      computedScore.competenciesScore,
    ),
    totalScore,
    percentageScore: normalizeScoreNumber(
      saved.percentageScore ??
        saved.percentage_score ??
        saved.totalScore ??
        saved.total_score ??
        saved.score,
      computedScore.percentageScore,
    ),
    rank: saved.rank || getRank(totalScore),
    maxScore: normalizeScoreNumber(saved.maxScore ?? saved.max_score, 100),
  };
}

function normalizeSavedFinalInterviewScore(savedScore = {}, computedScore = {}) {
  const saved = safeObject(savedScore);

  if (!Object.keys(saved).length) {
    return computedScore;
  }

  return {
    totalRatingFields: normalizeScoreNumber(
      saved.totalRatingFields ?? saved.total_rating_fields,
      computedScore.totalRatingFields,
    ),
    answeredRatingFields: normalizeScoreNumber(
      saved.answeredRatingFields ?? saved.answered_rating_fields,
      computedScore.answeredRatingFields,
    ),
    totalScore: normalizeScoreNumber(
      saved.totalScore ?? saved.total_score,
      computedScore.totalScore,
    ),
    maximumScore: normalizeScoreNumber(
      saved.maximumScore ??
        saved.maximum_score ??
        saved.maxScore ??
        saved.max_score,
      computedScore.maximumScore,
    ),
    averageRating: normalizeScoreNumber(
      saved.averageRating ?? saved.average_rating,
      computedScore.averageRating,
    ),
    percentageScore: normalizeScoreNumber(
      saved.percentageScore ?? saved.percentage_score,
      computedScore.percentageScore,
    ),
  };
}

function getSubmissionTimestamp(submission = {}) {
  const value =
    submission.submittedAt ||
    submission.submitted_at ||
    submission.submittedAtIso ||
    submission.submitted_at_iso ||
    submission.savedAt ||
    submission.saved_at ||
    submission.createdAt ||
    submission.created_at ||
    submission.updatedAt ||
    submission.updated_at ||
    "";

  const time = new Date(value).getTime();

  return Number.isFinite(time) ? time : 0;
}

function getLatestSubmittedForm(candidate = {}, submissionId = "") {
  const submittedForms = getSubmittedForms(candidate).filter(
    (form) => !form?.isDraftFallback,
  );

  if (!submittedForms.length) return null;

  if (submissionId) {
    const exact = submittedForms.find((item) => {
      const itemId =
        item?.id ||
        item?.submissionId ||
        item?.submission_id ||
        item?.formSubmissionId ||
        item?.form_submission_id ||
        "";

      return String(itemId) === String(submissionId);
    });

    return exact || null;
  }

  return [...submittedForms].sort(
    (a, b) => getSubmissionTimestamp(b) - getSubmissionTimestamp(a),
  )[0];
}

function StatusBadge({ label, tone = "default" }) {
  const styles = {
    success: "border-emerald-200 bg-emerald-50 text-emerald-700",
    blue: "border-blue-100 bg-blue-50 text-blue-700",
    warning: "border-amber-100 bg-amber-50 text-amber-700",
    orange: "border-orange-100 bg-orange-50 text-orange-700",
    danger: "border-red-200 bg-red-50 text-red-700",
    default: "border-sibs-border-subtle bg-sibs-canvas text-sibs-text-secondary",
  };

  return (
    <span
      className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-extrabold ${styles[tone]}`}
    >
      {label}
    </span>
  );
}

function SummaryMetricCard({
  title,
  value,
  subtext,
  tone = "default",
  progressValue = null,
  statusLabel = "",
  statusTone = "default",
}) {
  const toneClasses = {
    default: {
      value: "text-sibs-primary-1",
      iconWrap: "bg-sibs-canvas",
      border: "border-sibs-border",
      progress: "bg-sibs-primary-1",
    },
    success: {
      value: "text-emerald-700",
      iconWrap: "bg-emerald-50",
      border: "border-emerald-200",
      progress: "bg-emerald-600",
    },
    blue: {
      value: "text-blue-700",
      iconWrap: "bg-blue-50",
      border: "border-blue-100",
      progress: "bg-blue-600",
    },
    warning: {
      value: "text-amber-700",
      iconWrap: "bg-amber-50",
      border: "border-amber-100",
      progress: "bg-amber-500",
    },
    orange: {
      value: "text-orange-700",
      iconWrap: "bg-orange-50",
      border: "border-orange-100",
      progress: "bg-orange-500",
    },
    danger: {
      value: "text-red-700",
      iconWrap: "bg-red-50",
      border: "border-red-200",
      progress: "bg-red-600",
    },
  };

  const styles = toneClasses[tone] || toneClasses.default;

  const hasProgress =
    progressValue !== null &&
    progressValue !== undefined &&
    Number.isFinite(Number(progressValue));

  return (
    <div
      className={`rounded-xl border ${styles.border} bg-white p-4 shadow-2xs`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-[11px] font-extrabold uppercase tracking-wide text-sibs-muted">
              {title}
            </p>

            {statusLabel && (
              <StatusBadge label={statusLabel} tone={statusTone} />
            )}
          </div>

          <p
            className={`mt-2 text-2xl font-extrabold leading-none ${styles.value}`}
          >
            {value}
          </p>

          <p className="mt-1.5 text-xs font-semibold text-sibs-text-secondary">
            {subtext}
          </p>
        </div>

        <div
          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${styles.iconWrap}`}
          aria-hidden="true"
        >
          <BarChart3 size={18} />
        </div>
      </div>

      {hasProgress && (
        <div className="mt-3.5">
          <div className="mb-1.5 flex items-center justify-between">
            <span className="text-[10.5px] font-bold uppercase tracking-wide text-sibs-muted">
              Progress
            </span>

            <span className={`text-[11px] font-extrabold ${styles.value}`}>
              {Number(progressValue).toFixed(0)}%
            </span>
          </div>

          <div className="h-1.5 overflow-hidden rounded-full bg-slate-200">
            <div
              className={`h-full rounded-full transition-all duration-300 ${styles.progress}`}
              style={{
                width: `${Math.min(Math.max(Number(progressValue), 0), 100)}%`,
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
}

function BreakdownPanel({ title, subtitle, children }) {
  return (
    <div className="rounded-xl border border-sibs-border bg-sibs-surface/60 p-4">
      <div className="mb-3">
        <h3 className="text-[13px] font-extrabold text-sibs-navy">{title}</h3>

        {subtitle && (
          <p className="mt-0.5 text-[11.5px] font-medium leading-snug text-sibs-muted">
            {subtitle}
          </p>
        )}
      </div>

      <div className="space-y-2">{children}</div>
    </div>
  );
}

function BreakdownScoreLine({ label, subtext = "", value = 0, suffix = "pts" }) {
  return (
    <div className="rounded-xl border border-sibs-border bg-white px-3.5 py-2.5">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[10.5px] font-extrabold uppercase tracking-wide text-sibs-muted">
            {label}
          </p>

          {subtext && (
            <p className="mt-0.5 break-words text-[11.5px] font-semibold leading-snug text-sibs-text-secondary">
              {subtext}
            </p>
          )}
        </div>

        <p className="shrink-0 text-right text-sm font-extrabold text-sibs-navy">
          {value}
          {suffix && (
            <span className="ml-1 text-[11px] font-bold text-sibs-muted">
              {suffix}
            </span>
          )}
        </p>
      </div>
    </div>
  );
}

function BreakdownTextLine({ label, value = "—" }) {
  return (
    <div className="rounded-xl border border-sibs-border bg-white px-3.5 py-2.5">
      <div className="grid grid-cols-[minmax(90px,0.8fr)_minmax(0,1.6fr)] items-center gap-3">
        <p className="min-w-0 break-words text-[10.5px] font-extrabold uppercase tracking-wide text-sibs-muted">
          {label}
        </p>

        <p className="min-w-0 break-words text-right text-xs font-extrabold leading-snug text-sibs-navy">
          {value || "—"}
        </p>
      </div>
    </div>
  );
}

function BreakdownResultLine({ label, value = "—" }) {
  return (
    <div className="rounded-xl border border-sibs-border bg-white px-3.5 py-2.5">
      <p className="text-[10.5px] font-extrabold uppercase tracking-wide text-sibs-muted">
        {label}
      </p>

      <p className="mt-1 text-xs font-extrabold text-sibs-navy">
        {value || "—"}
      </p>
    </div>
  );
}

function ScoreSummaryCard({
  answers = {},
  jobEvaluationScore,
  finalInterviewRatingScore,
  passingScore,
  showBreakdown = true,
}) {
  const finalInterviewHasScore =
    finalInterviewRatingScore.answeredRatingFields > 0;

  const finalInterviewComplete =
    finalInterviewRatingScore.totalRatingFields > 0 &&
    finalInterviewRatingScore.answeredRatingFields >=
      finalInterviewRatingScore.totalRatingFields;

  const finalInterviewPassed =
    finalInterviewComplete &&
    finalInterviewRatingScore.percentageScore >= passingScore;

  const finalInterviewPercent = finalInterviewHasScore
    ? finalInterviewRatingScore.percentageScore.toFixed(0)
    : "—";

  const finalInterviewAverage = finalInterviewHasScore
    ? finalInterviewRatingScore.averageRating.toFixed(2)
    : "—";

  const jobEvaluationRankTone = getRankTone(jobEvaluationScore.rank);
  const jobEvaluationRankStatus = getRankStatus(jobEvaluationScore.rank);
  const jobEvaluationComplete = Boolean(
    cleanText(answers[JOB_EVALUATION_FIELDS.education]) &&
      cleanText(answers[JOB_EVALUATION_FIELDS.experience]) &&
      cleanText(answers[JOB_EVALUATION_FIELDS.location]) &&
      safeArray(answers[JOB_EVALUATION_FIELDS.duties]).length > 0 &&
      safeArray(answers[JOB_EVALUATION_FIELDS.competencies]).length > 0,
  );

  const selectedEducation = getSelectedOptionDetail(
    educationOptions,
    answers[JOB_EVALUATION_FIELDS.education],
  );

  const selectedExperience = getSelectedOptionDetail(
    experienceOptions,
    answers[JOB_EVALUATION_FIELDS.experience],
  );

  const selectedLocation = getSelectedOptionDetail(
    locationOptions,
    answers[JOB_EVALUATION_FIELDS.location],
  );

  return (
    <section className="sibs-card p-5">
      <div className="mb-4 border-b border-sibs-border pb-3">
        <h2 className="sibs-card-title text-sibs-navy">
          Evaluation Performance Summary
        </h2>

        <p className="sibs-card-subtitle mt-0.5">
          Combined overview of Job Evaluation and Final Interview results.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-3.5 xl:grid-cols-2">
        <SummaryMetricCard
          title="Job Evaluation Score"
          value={`${jobEvaluationScore.percentageScore.toFixed(0)}%`}
          subtext={
            jobEvaluationComplete
              ? `Rank ${jobEvaluationScore.rank} · ${jobEvaluationRankStatus}`
              : "Evaluation in progress"
          }
          tone={jobEvaluationComplete ? jobEvaluationRankTone : "default"}
          progressValue={jobEvaluationScore.percentageScore}
          statusLabel={
            jobEvaluationComplete ? `Rank ${jobEvaluationScore.rank}` : ""
          }
          statusTone={jobEvaluationRankTone}
        />

        <SummaryMetricCard
          title="Final Interview Score"
          value={finalInterviewHasScore ? `${finalInterviewPercent}%` : "—"}
          subtext={
            finalInterviewHasScore
              ? `${finalInterviewAverage} / 5 average rating`
              : "No rating recorded"
          }
          tone={
            !finalInterviewComplete
              ? "default"
              : finalInterviewPassed
                ? "success"
                : "danger"
          }
          progressValue={
            finalInterviewHasScore
              ? finalInterviewRatingScore.percentageScore
              : null
          }
          statusLabel={
            finalInterviewComplete
              ? finalInterviewPassed
                ? "Passed"
                : "Failed"
              : ""
          }
          statusTone={finalInterviewPassed ? "success" : "danger"}
        />
      </div>

      {showBreakdown && (
        <div className="mt-6 grid grid-cols-1 gap-5 xl:grid-cols-3">
        <BreakdownPanel
          title="Job Evaluation Breakdown"
          subtitle="Score distribution by default JE sections."
        >
          <BreakdownScoreLine
            label="Education"
            subtext={selectedEducation?.label || "No selected education"}
            value={jobEvaluationScore.educationScore}
          />

          <BreakdownScoreLine
            label="Experience"
            subtext={selectedExperience?.label || "No selected experience"}
            value={jobEvaluationScore.experienceScore}
          />

          <BreakdownScoreLine
            label="Location"
            subtext={selectedLocation?.label || "No selected location"}
            value={jobEvaluationScore.locationScore}
          />

          <BreakdownScoreLine
            label="Duties"
            subtext="Total score from selected duties."
            value={jobEvaluationScore.dutiesScore}
          />

          <BreakdownScoreLine
            label="Competencies"
            subtext="Total score from selected competencies."
            value={jobEvaluationScore.competenciesScore}
          />

          {jobEvaluationComplete && (
            <BreakdownResultLine
              label="Evaluation Result"
              value={jobEvaluationRankStatus}
            />
          )}
        </BreakdownPanel>

        <BreakdownPanel
          title="Final Interview Breakdown"
          subtitle="Computed from the interviewer rating assigned to every enabled question."
        >
          <BreakdownTextLine
            label="Total Points"
            value={
              finalInterviewHasScore
                ? `${finalInterviewRatingScore.totalScore}/${finalInterviewRatingScore.maximumScore}`
                : `0/${finalInterviewRatingScore.maximumScore || 0}`
            }
          />

          <BreakdownTextLine
            label="Average Rating"
            value={finalInterviewHasScore ? `${finalInterviewAverage} / 5` : "—"}
          />

          <BreakdownTextLine
            label="Rated Questions"
            value={`${finalInterviewRatingScore.answeredRatingFields}/${finalInterviewRatingScore.totalRatingFields}`}
          />

          {finalInterviewComplete && (
            <BreakdownTextLine
              label="Interview Result"
              value={finalInterviewPassed ? "Passed" : "Failed"}
            />
          )}
        </BreakdownPanel>

        <BreakdownPanel
          title="Score Notes"
          subtitle="Scoring basis used in this evaluation."
        >
          <BreakdownTextLine
            label="Job Evaluation"
            value="Default JE criteria"
          />

          <BreakdownTextLine
            label="Final Interview"
            value="Every enabled question is rated from 1 to 5"
          />

          <BreakdownTextLine
            label="Passing Rule"
            value={`${passingScore}% minimum`}
          />
        </BreakdownPanel>
      </div>
      )}
    </section>
  );
}

function ScoreLine({ label, value, subtext = "" }) {
  return (
    <div className="flex items-start justify-between gap-4 rounded-2xl bg-sibs-canvas px-4 py-3">
      <div className="min-w-0">
        <p className="text-[12px] font-extrabold uppercase tracking-wide text-sibs-primary-1">
          {label}
        </p>

        {subtext && (
          <p className="mt-1 break-words text-xs font-semibold leading-5 text-sibs-tertiary-5">
            {subtext}
          </p>
        )}
      </div>

      <p className="shrink-0 text-right text-base font-extrabold text-sibs-primary-1">
        {value}
      </p>
    </div>
  );
}

function SelectedAnswerCard({
  title,
  selectedItems = [],
  emptyText = "No selected answer yet.",
}) {
  return (
    <div className="rounded-2xl border border-sibs-border bg-white p-4">
      <div className="mb-3 flex items-center justify-between gap-3">
        <h4 className="text-sm font-extrabold text-sibs-primary-1">{title}</h4>

        <span className="rounded-full bg-sibs-canvas px-3 py-1 text-xs font-extrabold text-sibs-primary-1">
          {selectedItems.length} selected
        </span>
      </div>

      {selectedItems.length > 0 ? (
        <div className="space-y-2">
          {selectedItems.map((item) => (
            <div
              key={item.label}
              className="flex items-start justify-between gap-3 rounded-xl border border-blue-100 bg-blue-50 px-3 py-2"
            >
              <p className="min-w-0 flex-1 text-sm font-bold leading-6 text-sibs-primary-1">
                {item.label}
              </p>

              <span className="shrink-0 rounded-full bg-white px-2.5 py-1 text-xs font-extrabold text-sibs-primary-1">
                {item.score} pts
              </span>
            </div>
          ))}
        </div>
      ) : (
        <p className="rounded-xl border border-dashed border-sibs-border-subtle bg-sibs-canvas px-3 py-3 text-sm font-bold text-sibs-tertiary-5">
          {emptyText}
        </p>
      )}
    </div>
  );
}

function JobEvaluationSelectedAnswers({ answers = {} }) {
  const education = getSelectedOptionDetail(
    educationOptions,
    answers[JOB_EVALUATION_FIELDS.education],
  );

  const experience = getSelectedOptionDetail(
    experienceOptions,
    answers[JOB_EVALUATION_FIELDS.experience],
  );

  const location = getSelectedOptionDetail(
    locationOptions,
    answers[JOB_EVALUATION_FIELDS.location],
  );

  const selectedDuties = getSelectedOptionDetails(
    dutiesOptions,
    answers[JOB_EVALUATION_FIELDS.duties],
  );

  const selectedCompetencies = getSelectedOptionDetails(
    competenciesOptions,
    answers[JOB_EVALUATION_FIELDS.competencies],
  );

  return (
    <section className="rounded-[22px] border border-sibs-border bg-sibs-canvas p-5">
      <div className="mb-4">
        <h3 className="text-base font-extrabold text-sibs-primary-1">
          Selected Job Evaluation Answers
        </h3>

        <p className="mt-1 text-sm font-semibold text-sibs-tertiary-5">
          This displays the selected dropdowns and checked checkbox answers.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        <SelectedAnswerCard
          title="Education"
          selectedItems={education ? [education] : []}
          emptyText="No education selected."
        />

        <SelectedAnswerCard
          title="Experience"
          selectedItems={experience ? [experience] : []}
          emptyText="No experience selected."
        />

        <SelectedAnswerCard
          title="Location"
          selectedItems={location ? [location] : []}
          emptyText="No location selected."
        />

        <div className="xl:col-span-3">
          <SelectedAnswerCard
            title="Duties and Responsibilities"
            selectedItems={selectedDuties}
            emptyText="No duties selected."
          />
        </div>

        <div className="xl:col-span-3">
          <SelectedAnswerCard
            title="Competencies"
            selectedItems={selectedCompetencies}
            emptyText="No competencies selected."
          />
        </div>
      </div>
    </section>
  );
}


function AnimatedRecruitmentDropdown({
  open,
  children,
  className = "",
}) {
  return (
    <div
      className={`absolute left-0 right-0 top-full mt-2 grid transition-all duration-300 ease-out ${
        open
          ? "grid-rows-[1fr] opacity-100"
          : "pointer-events-none grid-rows-[0fr] opacity-0"
      } ${className}`}
    >
      <div className="min-h-0 overflow-hidden">
        <div
          className={`overflow-hidden rounded-xl border border-sibs-border-subtle bg-white shadow-2xl transition-all duration-300 ease-out ${
            open ? "translate-y-0 scale-100" : "-translate-y-2 scale-[0.98]"
          }`}
        >
          {children}
        </div>
      </div>
    </div>
  );
}

function RecruitmentStyleDropdown({
  value = "",
  options = [],
  onChange,
  placeholder = "Select",
  disabled = false,
  className = "",
  ariaLabel = "Select option",
}) {
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef(null);
  const isOpen = open && !disabled;

  const selectedOption =
    options.find((option) => String(option.value) === String(value)) || null;

  useEffect(() => {
    function handleClickOutside(event) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target)
      ) {
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

  return (
    <div
      ref={dropdownRef}
      className={`relative ${
        isOpen ? "z-[160]" : "z-10"
      } ${className}`}
    >
      <button
        type="button"
        aria-label={ariaLabel}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        disabled={disabled}
        onClick={() => {
          if (disabled) return;
          setOpen((previous) => !previous);
        }}
        className="flex h-9 2xl:h-10 w-full items-center justify-between rounded-xl border border-sibs-border-subtle bg-[#F8FAFC] px-3 text-left text-[11.5px] 2xl:text-[12px] font-semibold text-sibs-navy outline-none transition-all duration-200 hover:border-sibs-orange/40 hover:bg-white focus:border-sibs-orange focus:bg-white focus:ring-4 focus:ring-sibs-orange/10 disabled:cursor-not-allowed disabled:bg-gray-50 disabled:text-gray-400"
      >
        <span
          className={`truncate ${
            selectedOption ? "text-sibs-navy" : "text-sibs-faint"
          }`}
        >
          {selectedOption?.label || placeholder}
        </span>

        <ChevronDown
          size={16}
          className={`shrink-0 text-sibs-muted transition-transform duration-300 ${
            isOpen ? "rotate-180" : ""
          }`}
        />
      </button>

      <AnimatedRecruitmentDropdown open={isOpen} className="z-[170]">
        <div
          role="listbox"
          aria-label={ariaLabel}
          className="max-h-60 overflow-y-auto py-1.5 sibs-scrollbar"
        >
          {options.length > 0 ? (
            options.map((option) => {
              const selected =
                String(value) === String(option.value);

              return (
                <button
                  key={`${option.value}-${option.label}`}
                  type="button"
                  role="option"
                  aria-selected={selected}
                  onClick={() => {
                    onChange?.(option.value, option);
                    setOpen(false);
                  }}
                  className={`block w-full px-3 py-2 text-left text-[11.5px] 2xl:text-[12px] transition ${
                    selected
                      ? "bg-sibs-canvas font-bold text-sibs-navy"
                      : "font-medium text-sibs-text-secondary hover:bg-sibs-canvas"
                  }`}
                >
                  <span className="block truncate">
                    {option.label}
                  </span>
                </button>
              );
            })
          ) : (
            <div className="px-3 py-2 text-[11.5px] font-semibold text-sibs-muted">
              No options available.
            </div>
          )}
        </div>
      </AnimatedRecruitmentDropdown>
    </div>
  );
}

const FINAL_INTERVIEW_RATING_OPTIONS = [
  { value: "1", label: "1 - Poor" },
  { value: "2", label: "2 - Fair" },
  { value: "3", label: "3 - Good" },
  { value: "4", label: "4 - Very Good" },
  { value: "5", label: "5 - Excellent" },
];

const FINAL_INTERVIEW_RECOMMENDATION_OPTIONS = [
  { value: "Recommended", label: "Recommended" },
  { value: "For Review", label: "For Review" },
  { value: "Not Recommended", label: "Not Recommended" },
];

function AutoResizeTextarea({
  value = "",
  onChange,
  readOnly = false,
  minRows = 2,
  placeholder = "Type answer here...",
  className = "",
}) {
  const textareaRef = useRef(null);

  function resizeTextarea() {
    const textarea = textareaRef.current;

    if (!textarea) return;

    textarea.style.height = "auto";

    const computedStyle = window.getComputedStyle(textarea);
    const lineHeight = Number.parseFloat(computedStyle.lineHeight) || 20;
    const paddingTop = Number.parseFloat(computedStyle.paddingTop) || 0;
    const paddingBottom = Number.parseFloat(computedStyle.paddingBottom) || 0;
    const borderTop = Number.parseFloat(computedStyle.borderTopWidth) || 0;
    const borderBottom = Number.parseFloat(computedStyle.borderBottomWidth) || 0;

    const minimumHeight =
      lineHeight * Math.max(Number(minRows) || 1, 1) +
      paddingTop +
      paddingBottom +
      borderTop +
      borderBottom;

    textarea.style.height = `${Math.max(
      textarea.scrollHeight,
      minimumHeight,
    )}px`;
  }

  useLayoutEffect(() => {
    resizeTextarea();
  }, [value, minRows]);

  useEffect(() => {
    function handleWindowResize() {
      resizeTextarea();
    }

    window.addEventListener("resize", handleWindowResize);

    return () => {
      window.removeEventListener("resize", handleWindowResize);
    };
  }, []);

  return (
    <textarea
      ref={textareaRef}
      rows={minRows}
      value={value ?? ""}
      disabled={readOnly}
      onChange={(event) => {
        onChange?.(event.target.value);
        window.requestAnimationFrame(resizeTextarea);
      }}
      onInput={resizeTextarea}
      placeholder={placeholder}
      className={`w-full resize-none overflow-hidden ${className}`}
    />
  );
}

function FieldInput({ field, value, onChange, readOnly = false }) {
  const disabledClass =
    "disabled:cursor-not-allowed disabled:bg-sibs-canvas disabled:text-sibs-text-secondary";

  if (field.type === "Rating") {
    return (
      <RecruitmentStyleDropdown
        value={value || ""}
        disabled={readOnly}
        onChange={(nextValue) => onChange(nextValue)}
        options={FINAL_INTERVIEW_RATING_OPTIONS}
        placeholder="Select rating"
        ariaLabel={richTextToPlainText(field.label) || "Select rating"}
        className="mt-2"
      />
    );
  }

  if (field.type === "Paragraph") {
    return (
      <AutoResizeTextarea
        minRows={4}
        value={value || ""}
        readOnly={readOnly}
        onChange={onChange}
        placeholder="Type answer here..."
        className={`mt-2 min-h-[104px] rounded-lg border border-sibs-border-subtle bg-white px-3 py-3 text-sm font-semibold leading-6 text-sibs-text-secondary outline-none transition placeholder:text-sibs-muted focus:border-sibs-primary-1 focus:ring-4 focus:ring-sibs-primary-1/10 ${disabledClass}`}
      />
    );
  }

  if (field.type === "Dropdown") {
    return (
      <RecruitmentStyleDropdown
        value={value || ""}
        disabled={readOnly}
        onChange={(nextValue) => onChange(nextValue)}
        options={FINAL_INTERVIEW_RECOMMENDATION_OPTIONS}
        placeholder="Select answer"
        ariaLabel={richTextToPlainText(field.label) || "Select answer"}
        className="mt-2"
      />
    );
  }

  if (field.type === "Number") {
    return (
      <input
        type="number"
        value={value || ""}
        disabled={readOnly}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Enter number..."
        className={`mt-2 h-11 w-full rounded-lg border border-sibs-border-subtle bg-white px-3 text-sm font-semibold text-sibs-text-secondary outline-none transition placeholder:text-sibs-muted focus:border-sibs-primary-1 focus:ring-4 focus:ring-sibs-primary-1/10 ${disabledClass}`}
      />
    );
  }

  if (field.type === "Date") {
    return (
      <input
        type="date"
        value={value || ""}
        disabled={readOnly}
        onChange={(e) => onChange(e.target.value)}
        className={`mt-2 h-11 w-full rounded-lg border border-sibs-border-subtle bg-white px-3 text-sm font-semibold text-sibs-text-secondary outline-none transition focus:border-sibs-primary-1 focus:ring-4 focus:ring-sibs-primary-1/10 ${disabledClass}`}
      />
    );
  }

  if (field.type === "Checkbox") {
    return (
      <label className="mt-2 flex h-11 items-center gap-3 rounded-lg border border-sibs-border-subtle bg-white px-3 text-sm font-semibold text-sibs-text-secondary">
        <input
          type="checkbox"
          checked={Boolean(value)}
          disabled={readOnly}
          onChange={(e) => onChange(e.target.checked)}
          className="h-4 w-4 accent-sibs-primary-1 disabled:cursor-not-allowed"
        />
        Yes
      </label>
    );
  }

  return (
    <AutoResizeTextarea
      minRows={2}
      value={value || ""}
      readOnly={readOnly}
      onChange={onChange}
      placeholder="Type answer here..."
      className={`mt-2 min-h-[72px] rounded-lg border border-sibs-border-subtle bg-white px-3 py-3 text-sm font-semibold leading-6 text-sibs-text-secondary outline-none transition placeholder:text-sibs-muted focus:border-sibs-primary-1 focus:ring-4 focus:ring-sibs-primary-1/10 ${disabledClass}`}
    />
  );
}

function QuestionRatingInput({
  questionId,
  answers = {},
  onChange,
  readOnly = false,
}) {
  const ratingKey = getQuestionRatingKey(questionId);
  const remarkKey = getQuestionRemarkKey(questionId);

  const ratingValue = answers[ratingKey] || "";
  const remarkValue = answers[remarkKey] || "";

  return (
    <div className="mt-4 rounded-xl border border-sibs-border bg-sibs-surface p-3.5">
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[220px_minmax(0,1fr)]">
        <div>
          <label className="sibs-field-label block">
            Interviewer Rating
            <span className="ml-1 text-red-500">*</span>
          </label>

          <RecruitmentStyleDropdown
            value={ratingValue}
            disabled={readOnly}
            onChange={(nextValue) => onChange(ratingKey, nextValue)}
            options={FINAL_INTERVIEW_RATING_OPTIONS}
            placeholder="Select rating"
            ariaLabel="Select interviewer rating"
            className="mt-1.5"
          />

          {ratingValue && (
            <p className="mt-1.5 text-[11px] font-bold text-sibs-navy">
              {ratingValue} out of 5 points
            </p>
          )}
        </div>

        <div>
          <label
            htmlFor={`remark-${remarkKey}`}
            className="sibs-field-label block"
          >
            Interviewer Remarks
          </label>

          <AutoResizeTextarea
            id={`remark-${remarkKey}`}
            minRows={3}
            value={remarkValue}
            readOnly={readOnly}
            onChange={(value) => onChange(remarkKey, value)}
            placeholder="Enter remarks about the applicant's response..."
            className="sibs-modal-textarea mt-1.5 min-h-[84px] text-[11.5px] 2xl:text-[12px]"
          />
        </div>
      </div>
    </div>
  );
}

function JobEvaluationSelect({
  label,
  fieldKey,
  options,
  value,
  onChange,
  readOnly,
}) {
  const dropdownOptions = options.map((option) => ({
    value: option.label,
    label: `${option.label} (${option.score} pts)`,
  }));

  return (
    <div className="min-w-0">
      <label className="sibs-field-label block truncate">
        {label}
      </label>

      <RecruitmentStyleDropdown
        value={value || ""}
        disabled={readOnly}
        onChange={(nextValue) => onChange(fieldKey, nextValue)}
        options={dropdownOptions}
        placeholder={`Select ${label.toLowerCase()}`}
        ariaLabel={`Select ${label.toLowerCase()}`}
        className="mt-1.5"
      />
    </div>
  );
}

function JobEvaluationCheckboxGroup({
  title,
  fieldKey,
  options,
  values = [],
  onToggle,
  readOnly,
}) {
  const safeValues = Array.isArray(values) ? values : [];

  return (
    <div>
      <h4 className="sibs-field-label">{title}</h4>

      <div className="mt-2 space-y-1.5">
        {options.map((option) => {
          const checked = safeValues.includes(option.label);

          return (
            <label
              key={option.label}
              className={`flex items-start gap-2.5 rounded-xl border px-3 py-2 text-[11.5px] 2xl:text-[12px] font-semibold leading-relaxed transition ${
                checked
                  ? "border-blue-200 bg-blue-50/70 text-sibs-navy"
                  : "border-sibs-border bg-[#F8FAFC] text-sibs-text-secondary"
              } ${
                readOnly
                  ? "cursor-not-allowed opacity-80"
                  : "cursor-pointer hover:border-sibs-orange/40 hover:bg-white"
              }`}
            >
              <input
                type="checkbox"
                checked={checked}
                disabled={readOnly}
                onChange={() => onToggle(fieldKey, option.label)}
                className="mt-0.5 h-4 w-4 shrink-0 accent-[#042C51] disabled:cursor-not-allowed"
              />

              <span className="min-w-0 flex-1">
                {option.label}
                <span className="ml-2 whitespace-nowrap text-[10.5px] font-extrabold text-sibs-muted">
                  ({option.score} pts)
                </span>
              </span>
            </label>
          );
        })}
      </div>
    </div>
  );
}

export default function FinalInterviewForms({ publicMode = false }) {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const pipelineContext = React.useContext(CandidatePipelineContext) || {};
  const {
    candidateList = [],
    handleSubmitFinalInterview,
    refreshCandidatePipeline,
  } = pipelineContext;

  const candidateId = searchParams.get("candidateId") || "—";
  const candidateApplicationIdFromUrl =
    searchParams.get("candidateApplicationId") || "";
  const emailFromUrl = searchParams.get("email") || "";
  const positionId = searchParams.get("positionId") || "";
  const positionTitleFromUrl =
    searchParams.get("positionTitle") || "";
  const templateFormId =
    searchParams.get("templateFormId") ||
    searchParams.get("template_form_id") ||
    "";
  const formId = searchParams.get("formId") || "";
  const submissionId = searchParams.get("submissionId") || "";
  const mode = searchParams.get("mode") || "";
  const continueMode = searchParams.get("continue") === "1";

  const isEditMode = mode === "edit" || continueMode;
  const requestedViewMode = mode === "view" && !isEditMode;

  const [answers, setAnswers] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittedSuccessfully, setSubmittedSuccessfully] = useState(false);
  const [draftHydrated, setDraftHydrated] = useState(false);
  const [draftSavedAt, setDraftSavedAt] = useState("");
  const [draftSaveStatus, setDraftSaveStatus] = useState("");
  const [publicCandidate, setPublicCandidate] = useState(null);
  const [publicLoading, setPublicLoading] = useState(false);
  const [publicError, setPublicError] = useState("");
  const [hasUserChangedAnswers, setHasUserChangedAnswers] = useState(false);
  const pageTopRef = useRef(null);

  const [statusModal, setStatusModal] = useState({
    open: false,
    type: "error",
    title: "",
    message: "",
    afterClose: null,
  });

  useLayoutEffect(() => {
    if (typeof document === "undefined") return undefined;

    const body = document.body;
    const html = document.documentElement;

    /*
     * Candidate Pipeline modals lock document scrolling while open.
     * Navigation to this full-page Final Interview route can happen before
     * the modal cleanup restores overflow, which leaves the page unable to
     * scroll on first open. This route must always own normal document
     * scrolling when it mounts.
     */
    body.style.overflow = "";
    html.style.overflow = "";
    body.style.overflowY = "";
    html.style.overflowY = "";
    body.style.paddingRight = "";
    html.style.paddingRight = "";

    body.classList.remove("overflow-hidden");
    html.classList.remove("overflow-hidden");

    return undefined;
  }, []);

  function showStatusModal({
    type = "error",
    title = "Something went wrong",
    message = "Please try again.",
    afterClose = null,
  }) {
    setStatusModal({
      open: true,
      type,
      title,
      message,
      afterClose,
    });
  }

  function closeStatusModal() {
    const afterClose = statusModal.afterClose;

    setStatusModal({
      open: false,
      type: "error",
      title: "",
      message: "",
      afterClose: null,
    });

    if (typeof afterClose === "function") {
      window.setTimeout(afterClose, 0);
    }
  }

  useEffect(() => {
    let active = true;

    async function loadCandidateAssessmentFromApi() {
      if (!candidateId || candidateId === "—") {
        return;
      }

      const shouldLoadPublic = publicMode;
      const shouldLoadInternal =
        !publicMode && (requestedViewMode || submissionId);

      if (!shouldLoadPublic && !shouldLoadInternal) {
        return;
      }

      setPublicLoading(true);
      setPublicError("");

      try {
        const response = await api.get(
          publicMode
            ? `/api/candidate-pipeline/public-assessment/${encodeURIComponent(
                candidateId,
              )}`
            : `/api/candidate-pipeline/${encodeURIComponent(candidateId)}`,
          {
            params: publicMode
              ? {
                  email: emailFromUrl || undefined,
                  submissionId: submissionId || undefined,
                  formId: formId || undefined,
                  _t: Date.now(),
                }
              : {
                  _t: Date.now(),
                },
            withCredentials: !publicMode,
          },
        );

        const payload = response?.data || {};

        const rawCandidate =
          payload.candidate ||
          payload.data?.candidate ||
          payload.data ||
          payload.record ||
          null;

        if (payload.success === false || !rawCandidate) {
          throw new Error(
            payload.message || "Unable to load applicant assessment.",
          );
        }

        const assessment = safeObject(
          payload.assessment || rawCandidate.publicAssessment,
        );

        const payloadDisplayForm =
          payload.displayForm ||
          payload.submittedForm ||
          payload.finishedForm ||
          assessment.displayForm ||
          assessment.submittedForm ||
          assessment.finishedForm ||
          null;

        const payloadDraft = payload.draft || assessment.draft || null;

        const normalizedDisplayForm = payloadDisplayForm
          ? normalizeSubmittedForm(payloadDisplayForm)
          : null;

        const normalizedDraftForm = normalizeDraftAsForm(payloadDraft);

        const candidateWithFetchedData = {
          ...rawCandidate,
          publicAssessment: {
            ...assessment,
            displayForm: normalizedDisplayForm || normalizedDraftForm || null,
            draft: payloadDraft,
          },
          finalInterviewSubmittedForms: [
            ...getSubmittedForms(rawCandidate),
            normalizedDisplayForm,
            normalizedDraftForm,
          ].filter(Boolean),
        };

        if (active) {
          setPublicCandidate(candidateWithFetchedData);
        }
      } catch (error) {
        if (active) {
          setPublicError(
            getApiErrorMessage(
              error,
              "Unable to load applicant assessment data.",
            ),
          );
        }
      } finally {
        if (active) {
          setPublicLoading(false);
        }
      }
    }

    loadCandidateAssessmentFromApi();

    return () => {
      active = false;
    };
  }, [
    publicMode,
    requestedViewMode,
    candidateId,
    emailFromUrl,
    submissionId,
    formId,
  ]);

  const contextCandidate = useMemo(() => {
    return safeArray(candidateList).find((candidate) => {
      return (
        String(getCandidatePublicId(candidate) || "") ===
          String(candidateId || "") ||
        String(candidate.candidateSnapshot?.candidateId || "") ===
          String(candidateId || "") ||
        String(getCandidateApplicationId(candidate) || "") ===
          String(candidateApplicationIdFromUrl || "") ||
        String(candidate.id || "") === String(candidateApplicationIdFromUrl || "")
      );
    });
  }, [candidateList, candidateId, candidateApplicationIdFromUrl]);

  const currentCandidate = useMemo(() => {
    return mergeCandidateRecords(contextCandidate, publicCandidate);
  }, [contextCandidate, publicCandidate]);

  const effectiveCandidateApplicationId = useMemo(() => {
    return (
      candidateApplicationIdFromUrl ||
      getCandidateApplicationId(currentCandidate) ||
      "—"
    );
  }, [candidateApplicationIdFromUrl, currentCandidate]);

  function forceFinalInterviewScrollToTop() {
    if (typeof window === "undefined") return;

    window.scrollTo({
      top: 0,
      left: 0,
      behavior: "auto",
    });

    document.documentElement.scrollTop = 0;
    document.body.scrollTop = 0;

    pageTopRef.current?.scrollIntoView?.({
      block: "start",
      inline: "nearest",
      behavior: "auto",
    });

    const scrollContainers = document.querySelectorAll(
      [
        "main",
        "#root",
        "[data-final-interview-scroll-root='true']",
        ".overflow-y-auto",
        ".overflow-auto",
        ".overflow-y-scroll",
      ].join(", "),
    );

    scrollContainers.forEach((container) => {
      if (container && typeof container.scrollTo === "function") {
        container.scrollTo({
          top: 0,
          left: 0,
          behavior: "auto",
        });
      } else if (container) {
        container.scrollTop = 0;
        container.scrollLeft = 0;
      }
    });
  }

  useLayoutEffect(() => {
    const previousScrollRestoration = window.history.scrollRestoration;

    if ("scrollRestoration" in window.history) {
      window.history.scrollRestoration = "manual";
    }

    forceFinalInterviewScrollToTop();

    const animationFrameId = window.requestAnimationFrame(
      forceFinalInterviewScrollToTop,
    );

    const timeoutIds = [0, 100, 300, 600].map((delay) =>
      window.setTimeout(forceFinalInterviewScrollToTop, delay),
    );

    return () => {
      window.cancelAnimationFrame(animationFrameId);
      timeoutIds.forEach((timeoutId) => window.clearTimeout(timeoutId));

      if ("scrollRestoration" in window.history) {
        window.history.scrollRestoration = previousScrollRestoration;
      }
    };
  }, [
    candidateId,
    candidateApplicationIdFromUrl,
    positionId,
    positionTitleFromUrl,
    templateFormId,
    formId,
    submissionId,
    mode,
  ]);

  const settings = useMemo(() => safeReadSettings(), []);

  const [databaseForm, setDatabaseForm] = useState(null);
  const [databaseFormLoading, setDatabaseFormLoading] = useState(false);
  const [databaseFormError, setDatabaseFormError] = useState("");

  const databasePositionIdentifier = useMemo(() => {
    return (
      positionId ||
      getCandidatePositionId(currentCandidate) ||
      ""
    );
  }, [positionId, currentCandidate]);

  const databasePositionTitle = useMemo(() => {
    return (
      positionTitleFromUrl ||
      getCandidatePositionName(currentCandidate) ||
      ""
    );
  }, [positionTitleFromUrl, currentCandidate]);

  useEffect(() => {
    let cancelled = false;

    async function loadDatabaseFinalInterviewForm() {
      if (!databasePositionIdentifier && !databasePositionTitle) {
        setDatabaseForm(null);
        setDatabaseFormError("");
        return;
      }

      try {
        setDatabaseFormLoading(true);
        setDatabaseFormError("");

        let exactPositionForm = null;

        if (databasePositionIdentifier) {
          const response = await getFinalInterviewFormByPosition(
            databasePositionIdentifier,
          );

          if (cancelled) return;

          exactPositionForm = response?.success
            ? response.data || null
            : null;

          const exactPositionHasQuestions = Boolean(
            exactPositionForm &&
              getFinalInterviewFormFields(exactPositionForm).some(
                (field) => field?.enabled !== false,
              ),
          );

          if (exactPositionHasQuestions) {
            setDatabaseForm(exactPositionForm);
            return;
          }

          if (!databasePositionTitle) {
            setDatabaseForm(exactPositionForm);
            return;
          }
        }

        const formsResponse = await getFinalInterviewForms();

        if (cancelled) return;

        const databaseFinalInterviewForms = Array.isArray(
          formsResponse?.data,
        )
          ? formsResponse.data
          : Array.isArray(formsResponse?.data?.data)
            ? formsResponse.data.data
            : Array.isArray(formsResponse?.finalInterviewForms)
              ? formsResponse.finalInterviewForms
              : [];

        const preferredConfiguredFormId = [
          templateFormId,
          formId,
        ].find(
          (value) =>
            cleanText(value) &&
            cleanText(value) !== DEFAULT_JOB_EVALUATION_FORM_ID,
        ) || "";

        const configuredFallbackForm = findMatchingFinalInterviewForm({
          forms: databaseFinalInterviewForms,
          preferredFormId: preferredConfiguredFormId,
          positionId: databasePositionIdentifier,
          positionTitle: databasePositionTitle,
          requireConfiguredQuestions: true,
        });

        setDatabaseForm(
          configuredFallbackForm || exactPositionForm,
        );
      } catch (error) {
        if (cancelled) return;

        setDatabaseForm(null);
        setDatabaseFormError(
          getApiErrorMessage(
            error,
            "Failed to load the database Final Interview form.",
          ),
        );
      } finally {
        if (!cancelled) {
          setDatabaseFormLoading(false);
        }
      }
    }

    loadDatabaseFinalInterviewForm();

    return () => {
      cancelled = true;
    };
  }, [
    databasePositionIdentifier,
    databasePositionTitle,
    templateFormId,
    formId,
  ]);

  const activeForm = useMemo(() => {
    if (databaseForm) {
      return databaseForm;
    }
    const forms = safeArray(
      settings?.forms ||
        settings?.finalInterviewForms ||
        settings?.final_interview_forms,
    );

    if (!forms.length) return null;

    const candidatePositionId =
      getCandidatePositionId(currentCandidate);

    const candidatePositionName =
      positionTitleFromUrl ||
      getCandidatePositionName(currentCandidate);

    return findMatchingFinalInterviewForm({
      settings,
      forms,
      preferredFormId: templateFormId || formId,
      positionId:
        positionId ||
        candidatePositionId,
      positionTitle:
        candidatePositionName,
    });
  }, [
    settings,
    templateFormId,
    formId,
    positionId,
    positionTitleFromUrl,
    currentCandidate,
    databaseForm,
  ]);

  const activeFormPositionId = useMemo(() => {
    return activeForm
      ? getFinalInterviewFormPositionId(activeForm)
      : "";
  }, [activeForm]);

  const activeFormPositionTitle = useMemo(() => {
    return activeForm
      ? getFinalInterviewFormPositionTitle(activeForm)
      : "";
  }, [activeForm]);

  const activeFormId = useMemo(() => {
    return activeForm
      ? getFinalInterviewFormId(activeForm)
      : "";
  }, [activeForm]);

  const activeFormFields = useMemo(() => {
    return activeForm
      ? getFinalInterviewFormFields(activeForm)
      : [];
  }, [activeForm]);

  const effectivePositionId = useMemo(() => {
    return (
      positionId ||
      activeFormPositionId ||
      getCandidatePositionId(currentCandidate) ||
      ""
    );
  }, [
    positionId,
    activeFormPositionId,
    currentCandidate,
  ]);

  const effectiveFormId = useMemo(() => {
    const requestedFormId = cleanText(formId);
    const requestedTemplateFormId = cleanText(templateFormId);

    const concreteRequestedFormId =
      requestedFormId &&
      requestedFormId !== DEFAULT_JOB_EVALUATION_FORM_ID
        ? requestedFormId
        : "";

    const concreteRequestedTemplateFormId =
      requestedTemplateFormId &&
      requestedTemplateFormId !== DEFAULT_JOB_EVALUATION_FORM_ID
        ? requestedTemplateFormId
        : "";

    return (
      concreteRequestedFormId ||
      activeFormId ||
      concreteRequestedTemplateFormId ||
      requestedFormId ||
      requestedTemplateFormId ||
      (effectivePositionId
        ? `final-interview-${effectivePositionId}`
        : DEFAULT_JOB_EVALUATION_FORM_ID)
    );
  }, [
    formId,
    activeFormId,
    templateFormId,
    effectivePositionId,
  ]);

  const savedSubmission = useMemo(() => {
    return getLatestSubmittedForm(currentCandidate, submissionId);
  }, [submissionId, currentCandidate]);

  const effectiveSubmissionId = useMemo(() => {
    return (
      submissionId ||
      savedSubmission?.id ||
      savedSubmission?.submissionId ||
      savedSubmission?.submission_id ||
      savedSubmission?.formSubmissionId ||
      savedSubmission?.form_submission_id ||
      ""
    );
  }, [submissionId, savedSubmission]);

  const isSubmittedView =
    !isEditMode && (submittedSuccessfully || Boolean(savedSubmission));

  const openedWithoutSavedSubmission =
    requestedViewMode &&
    !publicLoading &&
    !savedSubmission &&
    Boolean(currentCandidate?.id || currentCandidate?.candidateId);

  const savedSubmissionScoreSummary = useMemo(() => {
    return safeObject(savedSubmission?.scoreSummary);
  }, [savedSubmission]);

  const jobEvaluationFormName = useMemo(() => {
    return getJobEvaluationTitle(activeForm?.name || savedSubmission?.formName);
  }, [activeForm?.name, savedSubmission?.formName]);

  const finalInterviewFields = useMemo(() => {
    const publicAssessment = safeObject(
      currentCandidate?.publicAssessment,
    );

    const displayForm = safeObject(
      publicAssessment.displayForm ||
        publicAssessment.submittedForm ||
        publicAssessment.finishedForm ||
        publicAssessment.form,
    );

    const draft = safeObject(
      publicAssessment.draft ||
        currentCandidate?.draft ||
        currentCandidate?.publicDraft,
    );

    return getFirstNonEmptyFieldArray(
      savedSubmission?.fieldsSnapshot,
      savedSubmission?.fields_snapshot,
      activeFormFields,
      activeForm?.fields,
      activeForm?.questions,
      displayForm.fieldsSnapshot,
      displayForm.fields_snapshot,
      displayForm.fields,
      displayForm.questions,
      draft.fieldsSnapshot,
      draft.fields_snapshot,
      draft.fields,
      draft.questions,
      currentCandidate?.finalInterviewFields,
      currentCandidate?.final_interview_fields,
      currentCandidate?.finalInterviewQuestions,
      currentCandidate?.final_interview_questions,
    ).map((field) => ({
      ...field,
      required: false,
    }));
  }, [
    activeForm,
    activeFormFields,
    savedSubmission,
    currentCandidate,
  ]);

  const groupedFields = useMemo(() => {
    return groupFieldsBySection(
      finalInterviewFields,
    );
  }, [finalInterviewFields]);

  const finalInterviewQuestionCount = useMemo(() => {
    return groupedFields.reduce(
      (total, group) =>
        total + safeArray(group.questions).length,
      0,
    );
  }, [groupedFields]);

  const passingScore = useMemo(() => {
    return getPassingScore(savedSubmission || activeForm);
  }, [activeForm, savedSubmission]);

  const computedJobEvaluationScore = useMemo(() => {
    return calculateJobEvaluationScore(answers);
  }, [answers]);

  const jobEvaluationScore = useMemo(() => {
    if (isEditMode || hasUserChangedAnswers) {
      return computedJobEvaluationScore;
    }

    const savedJobEvaluationScore =
      savedSubmissionScoreSummary.jobEvaluation ||
      savedSubmissionScoreSummary.job_evaluation ||
      savedSubmissionScoreSummary.jobEvaluationScore ||
      savedSubmissionScoreSummary.job_evaluation_score;

    return normalizeSavedJobEvaluationScore(
      savedJobEvaluationScore,
      computedJobEvaluationScore,
    );
  }, [
    isEditMode,
    hasUserChangedAnswers,
    savedSubmissionScoreSummary,
    computedJobEvaluationScore,
  ]);

  const computedFinalInterviewRatingScore = useMemo(() => {
    return calculateRatingScore(
      finalInterviewFields,
      answers,
    );
  }, [finalInterviewFields, answers]);

  const finalInterviewRatingScore = useMemo(() => {
    if (isEditMode || hasUserChangedAnswers) {
      return computedFinalInterviewRatingScore;
    }

    const savedFinalInterviewScore =
      savedSubmissionScoreSummary.finalInterview ||
      savedSubmissionScoreSummary.final_interview ||
      savedSubmissionScoreSummary.finalInterviewScore ||
      savedSubmissionScoreSummary.final_interview_score;

    return normalizeSavedFinalInterviewScore(
      savedFinalInterviewScore,
      computedFinalInterviewRatingScore,
    );
  }, [
    isEditMode,
    hasUserChangedAnswers,
    savedSubmissionScoreSummary,
    computedFinalInterviewRatingScore,
  ]);

  const pageShellClass = publicMode
    ? "fixed inset-0 z-[99999] min-h-screen overflow-y-auto bg-sibs-canvas px-3 py-5 sm:px-6 sm:py-6 font-jakarta text-sibs-primary-1"
    : "min-h-screen bg-sibs-canvas px-3 py-5 sm:px-6 sm:py-6 font-jakarta text-sibs-primary-1";

  // Workspace navigation & presentation state
  const [activeWorkspaceTab, setActiveWorkspaceTab] = useState("overview");
  const [activeStandardQuestionKey, setActiveStandardQuestionKey] = useState("");
  const [activeAiQuestionId, setActiveAiQuestionId] = useState("");
  const [resumeAlignmentExpanded, setResumeAlignmentExpanded] = useState(false);
  const [submitConfirmOpen, setSubmitConfirmOpen] = useState(false);

  // Resume Intelligence & Dynamic Final Interview state (internal authenticated HR/Interviewer view only)
  const [resumeIntelPayload, setResumeIntelPayload] = useState(null);
  const [resumeIntelPermissions, setResumeIntelPermissions] = useState({
    canView: false,
    canReviewQuestions: false,
  });
  const [resumeIntelLoading, setResumeIntelLoading] = useState(false);
  const [resumeIntelReviewBusy, setResumeIntelReviewBusy] = useState(false);

  const resumeIntelLookupIdentifier = useMemo(() => {
    if (publicMode) return "";
    const appId = cleanText(effectiveCandidateApplicationId);
    if (appId && appId !== "—") return appId;
    const candId = cleanText(candidateId);
    if (candId && candId !== "—") return candId;
    return "";
  }, [publicMode, effectiveCandidateApplicationId, candidateId]);

  useEffect(() => {
    if (publicMode || !resumeIntelLookupIdentifier) {
      setResumeIntelPayload(null);
      return undefined;
    }

    let cancelled = false;
    setResumeIntelLoading(true);

    getFinalInterviewResumeIntelligence(resumeIntelLookupIdentifier)
      .then((res) => {
        if (cancelled) return;
        if (res?.success) {
          setResumeIntelPayload(res.data || null);
          if (res.permissions) {
            setResumeIntelPermissions(res.permissions);
          }
        }
      })
      .catch(() => {
        // Keep standard Final Interview Form fully operational if Resume Intelligence is unavailable
      })
      .finally(() => {
        if (!cancelled) {
          setResumeIntelLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [publicMode, resumeIntelLookupIdentifier]);

  useEffect(() => {
    const status = resumeIntelPayload?.overallStatus;
    if (
      publicMode ||
      !resumeIntelLookupIdentifier ||
      !["queued", "extracting", "analyzing", "generating"].includes(status)
    ) {
      return undefined;
    }

    const timer = window.setInterval(() => {
      getFinalInterviewResumeIntelligence(resumeIntelLookupIdentifier)
        .then((res) => {
          if (res?.success) {
            setResumeIntelPayload(res.data || null);
            if (res.permissions) {
              setResumeIntelPermissions(res.permissions);
            }
          }
        })
        .catch(() => {});
    }, 4000);

    return () => window.clearInterval(timer);
  }, [publicMode, resumeIntelLookupIdentifier, resumeIntelPayload?.overallStatus]);

  const handleInlineAiQuestionReview = async ({
    questionIds = [],
    reviewAll = false,
    decision,
  }) => {
    if (!resumeIntelLookupIdentifier || resumeIntelReviewBusy) return;
    setResumeIntelReviewBusy(true);
    try {
      await reviewResumeIntelligenceQuestions(resumeIntelLookupIdentifier, {
        questionSetId:
          resumeIntelPayload?.questionSetSummary?.questionSetId || null,
        questionIds,
        reviewAll,
        decision,
      });
      const refreshed = await getFinalInterviewResumeIntelligence(
        resumeIntelLookupIdentifier
      );
      if (refreshed?.success) {
        setResumeIntelPayload(refreshed.data || null);
      }
    } catch {
      // Ignore inline review errors; main form remains usable
    } finally {
      setResumeIntelReviewBusy(false);
    }
  };

  const handleInlineRegenerateAiQuestions = async () => {
    if (!resumeIntelLookupIdentifier || resumeIntelReviewBusy) return;
    setResumeIntelReviewBusy(true);
    try {
      await regenerateApplicationResumeIntelligence(
        resumeIntelLookupIdentifier,
        {
          forceRegenerate: true,
          waitForCompletion: true,
        }
      );
      const refreshed = await getFinalInterviewResumeIntelligence(
        resumeIntelLookupIdentifier
      );
      if (refreshed?.success) {
        setResumeIntelPayload(refreshed.data || null);
      }
    } catch {
      // Ignore inline regenerate errors; main form remains usable
    } finally {
      setResumeIntelReviewBusy(false);
    }
  };

  // Resolve the active AI question set snapshot:
  // If viewing a completed historical submission that recorded an `aiQuestionSetSnapshot`,
  // preserve that exact historical snapshot so subsequent resume updates never alter completed interviews.
  const activeAiQuestionSetSnapshot = useMemo(() => {
    if (
      isSubmittedView &&
      savedSubmission?.aiQuestionSetSnapshot &&
      Array.isArray(savedSubmission.aiQuestionSetSnapshot.approvedQuestions)
    ) {
      return savedSubmission.aiQuestionSetSnapshot;
    }
    if (!resumeIntelPayload) return null;
    return {
      questionSetSummary: resumeIntelPayload.questionSetSummary || null,
      approvedQuestions: Array.isArray(resumeIntelPayload.approvedQuestions)
        ? resumeIntelPayload.approvedQuestions
        : [],
    };
  }, [isSubmittedView, savedSubmission, resumeIntelPayload]);

  const activeApprovedAiQuestions = useMemo(
    () => activeAiQuestionSetSnapshot?.approvedQuestions || [],
    [activeAiQuestionSetSnapshot]
  );

  const aiQuestionResponsesSnapshot = useMemo(() => {
    const map = {};
    for (const q of activeApprovedAiQuestions) {
      const qId = q.questionId || q.id;
      if (!qId) continue;
      map[qId] = {
        questionId: qId,
        questionText: q.questionText,
        category: q.category,
        sourceType: q.sourceType,
        interviewerRemarks: cleanText(answers[`ai_q_remarks_${qId}`] || ""),
        supplementaryNote: cleanText(answers[`ai_q_note_${qId}`] || ""),
      };
    }
    return map;
  }, [activeApprovedAiQuestions, answers]);

  const scoreSummary = useMemo(() => {
    const jobEvaluationPassed =
      jobEvaluationScore.percentageScore >= passingScore;

    const finalInterviewComplete =
      finalInterviewRatingScore.totalRatingFields > 0 &&
      finalInterviewRatingScore.answeredRatingFields >=
        finalInterviewRatingScore.totalRatingFields;

    const finalInterviewPassed =
      finalInterviewComplete &&
      finalInterviewRatingScore.percentageScore >= passingScore;

    return {
      passingScore,

      jobEvaluation: {
        ...jobEvaluationScore,
        status: jobEvaluationPassed ? "Passed" : "Failed",
        passed: jobEvaluationPassed,
      },

      finalInterview: {
        ...finalInterviewRatingScore,
        status: finalInterviewComplete
          ? finalInterviewPassed
            ? "Passed"
            : "Failed"
          : "In Progress",
        passed: finalInterviewComplete ? finalInterviewPassed : null,
      },
    };
  }, [jobEvaluationScore, finalInterviewRatingScore, passingScore]);

  useEffect(() => {
    let active = true;

    async function loadDatabaseDraftOrFinishedForm() {
      setDraftHydrated(false);
      setDraftSaveStatus("");

      if (
        savedSubmission?.answers &&
        Object.keys(savedSubmission.answers).length
      ) {
        setAnswers(savedSubmission.answers);
        setDraftSavedAt(
          savedSubmission.submittedAt ||
            savedSubmission.submitted_at ||
            savedSubmission.updatedAt ||
            savedSubmission.updated_at ||
            "",
        );
        setDraftHydrated(true);
        setHasUserChangedAnswers(false);
        return;
      }

      if (publicMode && publicLoading && !publicCandidate && !contextCandidate) {
        return;
      }

      if (
        !candidateId ||
        !effectiveCandidateApplicationId ||
        candidateId === "—" ||
        effectiveCandidateApplicationId === "—"
      ) {
        setAnswers({});
        setDraftSavedAt("");
        setDraftHydrated(true);
        setHasUserChangedAnswers(false);
        return;
      }

      try {
        const response = await getFinalInterviewDraft({
          candidateId,
          candidateApplicationId: effectiveCandidateApplicationId,
          formId: effectiveFormId,
        });

        if (!active) return;

        const draftPayload = getDraftPayloadFromResponse(response);
        const draftAnswers = getDraftAnswers(draftPayload);

        const databaseDraftForm = normalizeDatabaseDraftAsSubmittedForm({
          draftPayload,
          effectiveFormId,
          fallbackFormName: jobEvaluationFormName || "Job Evaluation Form",
        });

        if (objectHasData(draftAnswers)) {
          setAnswers(draftAnswers);
          setDraftSavedAt(getDraftSavedAt(draftPayload));

          if (
            databaseDraftForm &&
            !objectHasData(currentCandidate?.publicAssessment?.draft)
          ) {
            setPublicCandidate((previous) =>
              mergeCandidateRecords(previous || currentCandidate, {
                publicAssessment: {
                  ...(previous?.publicAssessment || {}),
                  draft: draftPayload,
                  displayForm: databaseDraftForm,
                },
              }),
            );
          }
        } else {
          setAnswers({});
          setDraftSavedAt("");
        }

        setHasUserChangedAnswers(false);
      } catch (error) {
        if (!active) return;

        console.error(
          "Load final interview database draft error:",
          error?.response?.data || error?.message,
        );

        setAnswers({});
        setDraftSavedAt("");
        setHasUserChangedAnswers(false);
      } finally {
        if (active) {
          setDraftHydrated(true);
        }
      }
    }

    loadDatabaseDraftOrFinishedForm();

    return () => {
      active = false;
    };
  }, [
    publicMode,
    publicLoading,
    publicCandidate,
    contextCandidate,
    candidateId,
    effectiveCandidateApplicationId,
    effectiveFormId,
    savedSubmission,
    currentCandidate,
    jobEvaluationFormName,
  ]);

  useEffect(() => {
    if (publicLoading || databaseFormLoading || !draftHydrated) return;

    const animationFrameId = window.requestAnimationFrame(
      forceFinalInterviewScrollToTop,
    );
    const timeoutId = window.setTimeout(
      forceFinalInterviewScrollToTop,
      120,
    );

    return () => {
      window.cancelAnimationFrame(animationFrameId);
      window.clearTimeout(timeoutId);
    };
  }, [
    publicLoading,
    databaseFormLoading,
    draftHydrated,
    effectiveSubmissionId,
    finalInterviewQuestionCount,
  ]);

  useEffect(() => {
    if (isSubmittedView || !draftHydrated) return;
    if (!hasUserChangedAnswers) return;

    if (
      !candidateId ||
      !effectiveCandidateApplicationId ||
      candidateId === "—" ||
      effectiveCandidateApplicationId === "—"
    ) {
      return;
    }

    const timeoutId = window.setTimeout(async () => {
      try {
        setDraftSaveStatus("Saving...");

        const response = await saveFinalInterviewDraft({
          candidateId,
          candidateApplicationId: effectiveCandidateApplicationId,
          positionId: effectivePositionId,
          formId: effectiveFormId,
          formName: jobEvaluationFormName || "Job Evaluation Form",
          answers,
          scoreSummary,
          fieldsSnapshot: finalInterviewFields,
        });

        const savedAt =
          response?.data?.savedAt ||
          response?.data?.updatedAt ||
          new Date().toISOString();

        setDraftSavedAt(savedAt);
        setDraftSaveStatus("Draft saved to database.");
      } catch (error) {
        console.error(
          "Save final interview database draft error:",
          error?.response?.data || error?.message,
        );

        setDraftSaveStatus("Draft save failed.");
      }
    }, 300);

    return () => window.clearTimeout(timeoutId);
  }, [
    answers,
    scoreSummary,
    draftHydrated,
    isSubmittedView,
    hasUserChangedAnswers,
    candidateId,
    effectiveCandidateApplicationId,
    effectivePositionId,
    effectiveFormId,
    activeForm,
    finalInterviewFields,
    jobEvaluationFormName,
  ]);

  function handleAnswerChange(fieldId, value) {
    if (requestedViewMode || isSubmittedView) return;

    setHasUserChangedAnswers(true);

    setAnswers((prev) => ({
      ...prev,
      [fieldId]: value,
    }));
  }

  function handleInterviewerScoringChange(fieldId, value) {
    if (requestedViewMode || publicMode) return;

    setHasUserChangedAnswers(true);

    setAnswers((prev) => ({
      ...prev,
      [fieldId]: value,
    }));
  }

  function handleJobEvaluationChange(fieldId, value) {
    if (requestedViewMode || isSubmittedView) return;

    setHasUserChangedAnswers(true);

    setAnswers((prev) => ({
      ...prev,
      [fieldId]: value,
    }));
  }

  function handleJobEvaluationToggle(fieldId, optionLabel) {
    if (requestedViewMode || isSubmittedView) return;

    setHasUserChangedAnswers(true);

    setAnswers((prev) => {
      const currentValues = Array.isArray(prev[fieldId]) ? prev[fieldId] : [];
      const alreadySelected = currentValues.includes(optionLabel);

      return {
        ...prev,
        [fieldId]: alreadySelected
          ? currentValues.filter((item) => item !== optionLabel)
          : [...currentValues, optionLabel],
      };
    });
  }

  const standardQuestionsList = useMemo(() => {
    const items = [];
    let runningNumber = 0;
    groupedFields.forEach((group, groupIndex) => {
      safeArray(group.questions).forEach((field, fieldIndex) => {
        runningNumber += 1;
        const questionId = getFinalInterviewQuestionId(field, runningNumber - 1);
        const questionKey = field.id || `${group.section}-${groupIndex}-${fieldIndex}`;
        const isRatingQuestion =
          String(field.type || "").trim().toLowerCase() === "rating";
        const ratingKey = getQuestionRatingKey(questionId);
        const ratingVal = Number(answers[ratingKey]);
        const hasRating = Number.isFinite(ratingVal) && ratingVal >= 1 && ratingVal <= 5;
        const answerVal = answers[field.id];
        const hasAnswer = Array.isArray(answerVal)
          ? answerVal.length > 0
          : Boolean(cleanText(answerVal));
        const isCompleted = publicMode ? hasAnswer : hasRating;

        items.push({
          questionKey,
          questionNumber: runningNumber,
          questionId,
          sectionTitle: group.section || "General Interview Questions",
          field,
          isRatingQuestion,
          ratingValue: hasRating ? ratingVal : null,
          isCompleted,
          previewText: richTextToPlainText(field.label || ""),
        });
      });
    });
    return items;
  }, [groupedFields, answers, publicMode]);

  const workspaceTabs = useMemo(() => {
    const completedStd = standardQuestionsList.filter((q) => q.isCompleted).length;
    const totalStd = standardQuestionsList.length;
    const tabs = [
      {
        id: "overview",
        label: "Overview",
        badge: null,
        icon: LayoutDashboard,
      },
      {
        id: "standard",
        label: "Standard Questions",
        badge: totalStd > 0 ? `${completedStd}/${totalStd}` : "0",
        incomplete: totalStd > 0 && completedStd < totalStd,
        icon: ClipboardList,
      },
    ];
    if (!publicMode) {
      tabs.push({
        id: "ai",
        label: "AI Interview Questions",
        badge: String(activeApprovedAiQuestions.length),
        incomplete: false,
        icon: Sparkles,
      });
    }
    tabs.push({
      id: "summary",
      label: "Evaluation & Summary",
      badge: finalInterviewRatingScore?.answeredRatingFields > 0
        ? `${Number(finalInterviewRatingScore.percentageScore || 0).toFixed(0)}%`
        : null,
      icon: BarChart3,
    });
    return tabs;
  }, [
    standardQuestionsList,
    publicMode,
    activeApprovedAiQuestions.length,
    finalInterviewRatingScore,
  ]);

  function validateQuestionRatings() {
    if (publicMode) return true;

    const enabledFields = finalInterviewFields.filter(
      (field) => field.enabled !== false,
    );

    const unratedIndex = enabledFields.findIndex((field, index) => {
      const questionId = getFinalInterviewQuestionId(field, index);
      const ratingKey = getQuestionRatingKey(questionId);
      const rating = Number(answers[ratingKey]);

      return !Number.isFinite(rating) || rating < 1 || rating > 5;
    });

    if (unratedIndex >= 0) {
      const unratedField = enabledFields[unratedIndex];
      const matchingItem = standardQuestionsList.find(
        (item) =>
          (item.field?.id && item.field.id === unratedField?.id) ||
          item.questionNumber === unratedIndex + 1,
      );
      setActiveWorkspaceTab("standard");
      if (matchingItem?.questionKey) {
        setActiveStandardQuestionKey(matchingItem.questionKey);
      }
      showStatusModal({
        type: "error",
        title: "Missing Question Rating",
        message: `Please rate: ${
          richTextToPlainText(unratedField.label) || "Untitled Final Interview question"
        }`,
      });

      return false;
    }

    return true;
  }


  async function handleSaveScoringChanges() {
    if (requestedViewMode || publicMode || isSubmitting) return;
    if (!validateQuestionRatings()) return;

    const candidateRecordId = cleanText(
      currentCandidate?.id ||
        currentCandidate?.candidatePipelineId ||
        currentCandidate?.candidate_pipeline_id ||
        currentCandidate?.recordId ||
        currentCandidate?.record_id ||
        effectiveCandidateApplicationId ||
        candidateId,
    );

    const databaseSubmissionId = cleanText(
      effectiveSubmissionId || submissionId,
    );

    if (!candidateRecordId || candidateRecordId === "—") {
      showStatusModal({
        type: "error",
        title: "Candidate Record Missing",
        message:
          "The candidate database record could not be identified. Refresh the Candidate Pipeline and open the saved Final Interview again.",
      });
      return;
    }

    if (!databaseSubmissionId) {
      showStatusModal({
        type: "error",
        title: "Submission Record Missing",
        message:
          "No saved Final Interview submission ID was found. Open this assessment using its View link before updating ratings and remarks.",
      });
      return;
    }

    setIsSubmitting(true);

    const finalFormId = effectiveFormId || DEFAULT_JOB_EVALUATION_FORM_ID;
    const finalFormName = jobEvaluationFormName || "Job Evaluation Form";

    try {
      const response = await api.post(
        `/api/candidate-pipeline/${encodeURIComponent(
          candidateRecordId,
        )}/final-interview/submit`,
        {
          candidateId,
          candidateApplicationId: effectiveCandidateApplicationId,
          positionId: effectivePositionId,
          formId: finalFormId,
          formName: finalFormName,
          submissionId: databaseSubmissionId,
          passingScore,
          answers,
          fieldsSnapshot: finalInterviewFields,
          scoreSummary,
          aiQuestionSetSnapshot: activeAiQuestionSetSnapshot,
          aiQuestionResponses: aiQuestionResponsesSnapshot,
          interviewNotes: "Final Interview ratings and remarks updated.",
          remarks: "Final Interview ratings and remarks updated.",
        },
        {
          withCredentials: true,
        },
      );

      const payload = response?.data || {};

      if (payload.success === false) {
        throw new Error(
          payload.message ||
            "The Final Interview database submission could not be updated.",
        );
      }

      const savedCandidate =
        payload.candidate ||
        payload.data?.candidate ||
        payload.data ||
        null;

      const savedSubmission =
        payload.submission ||
        payload.data?.submission ||
        null;

      if (savedCandidate) {
        setPublicCandidate(savedCandidate);
      }

      if (typeof refreshCandidatePipeline === "function") {
        await refreshCandidatePipeline();
      }

      const savedAt =
        savedSubmission?.submittedAtIso ||
        savedSubmission?.submitted_at_iso ||
        savedSubmission?.submittedAt ||
        savedSubmission?.submitted_at ||
        new Date().toISOString();

      setDraftSavedAt(savedAt);
      setDraftSaveStatus("Rating and remarks saved to database.");
      setHasUserChangedAnswers(false);

      showStatusModal({
        type: "success",
        title: "Saved to Database",
        message:
          "The Final Interview ratings, interviewer remarks, total points, percentage, and score summary were saved to the existing database submission.",
      });
    } catch (error) {
      console.error(
        "Save final interview database scoring changes error:",
        error?.response?.data || error?.message,
      );

      showStatusModal({
        type: "error",
        title: "Database Save Failed",
        message:
          error?.response?.data?.message ||
          error?.response?.data?.error ||
          error?.message ||
          "Failed to save the Final Interview score and remarks to the database.",
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();

    if (isSubmittedView) return;
    if (isSubmitting) return;
    if (!validateQuestionRatings()) return;

    setIsSubmitting(true);

    const finalFormId = effectiveFormId || DEFAULT_JOB_EVALUATION_FORM_ID;
    const finalFormName = jobEvaluationFormName || "Job Evaluation Form";

    try {
      if (publicMode) {
        const response = await api.post(
          `/api/candidate-pipeline/public-assessment/${encodeURIComponent(
            candidateId,
          )}`,
          {
            email: emailFromUrl,
            candidateApplicationId: effectiveCandidateApplicationId,
            positionId: effectivePositionId,
            formId: finalFormId,
            formName: finalFormName,
            passingScore,
            answers,
            fieldsSnapshot: finalInterviewFields,
            scoreSummary,
            assessmentStatus: "Taken",
            assessmentResult: "Submitted",
          },
          {
            withCredentials: false,
          },
        );

        const payload = response?.data || {};
        const nextCandidate =
          payload.candidate ||
          payload.data?.candidate ||
          payload.data ||
          payload.record ||
          null;

        if (nextCandidate) {
          setPublicCandidate(nextCandidate);
        }

        await deleteFinalInterviewDraft({
          candidateId,
          candidateApplicationId: effectiveCandidateApplicationId,
          formId: finalFormId,
        });

        setSubmittedSuccessfully(true);
        setHasUserChangedAnswers(false);

        showStatusModal({
          type: "success",
          title: "Job Evaluation Submitted",
          message: "Assessment submitted successfully.",
        });

        setIsSubmitting(false);
        return;
      }

      const submissionResponse = await handleSubmitFinalInterview({
        candidateId,
        candidateApplicationId: effectiveCandidateApplicationId,
        positionId: effectivePositionId,
        formId: finalFormId,
        formName: finalFormName,
        submissionId: submissionId || undefined,
        passingScore,
        answers,
        fieldsSnapshot: finalInterviewFields,
        scoreSummary,
        aiQuestionSetSnapshot: activeAiQuestionSetSnapshot,
        aiQuestionResponses: aiQuestionResponsesSnapshot,
      });

      if (!submissionResponse?.success) {
        showStatusModal({
          type: "error",
          title: "Submission Failed",
          message:
            submissionResponse?.message ||
            "Job evaluation form submitted, but the candidate record was not updated in the pipeline.",
        });

        setIsSubmitting(false);
        return;
      }

      await deleteFinalInterviewDraft({
        candidateId,
        candidateApplicationId: effectiveCandidateApplicationId,
        formId: finalFormId,
      });

      setSubmittedSuccessfully(true);
      setHasUserChangedAnswers(false);
      setIsSubmitting(false);

      const failedFinalInterview =
        submissionResponse?.outcome === "final-interview-failed" ||
        submissionResponse?.automaticDropOff === true;
      const reapplyEligibleAt =
        submissionResponse?.reapplyEligibleAt ||
        submissionResponse?.reapply_eligible_at ||
        "";

      showStatusModal({
        type: "success",
        title: failedFinalInterview
          ? "Final Interview Result: Failed"
          : "Job Evaluation Submitted",
        message: failedFinalInterview
          ? `Candidate moved to Drop-off because the Final Interview score did not meet the passing score. The candidate may reapply starting ${formatReapplyEligibilityDate(
              reapplyEligibleAt,
            )}.${
              submissionResponse?.emailWarning
                ? ` Email warning: ${submissionResponse.emailWarning}`
                : " The failure email was processed."
            }`
          : "Candidate moved to Interviewed.",
        afterClose: () => navigate(-1),
      });
    } catch (error) {
      console.error(
        "Submit job evaluation form error:",
        error?.response?.data || error?.message,
      );

      showStatusModal({
        type: "error",
        title: "Submit Failed",
        message:
          error?.response?.data?.message ||
          error?.message ||
          "Failed to submit job evaluation form.",
      });

      setIsSubmitting(false);
    }
  }

  const candidateDisplayName =
    resumeIntelPayload?.candidateName ||
    currentCandidate?.name ||
    currentCandidate?.fullName ||
    "—";
  const appliedPositionDisplay =
    positionTitleFromUrl ||
    getCandidatePositionName(currentCandidate) ||
    activeFormPositionTitle ||
    resumeIntelPayload?.appliedPosition ||
    "—";
  const recruitmentStageDisplay =
    currentCandidate?.stage ||
    currentCandidate?.status ||
    (isSubmittedView ? "Submitted" : "Active Evaluation");
  const interviewScheduleDisplay =
    currentCandidate?.interviewDate || currentCandidate?.interview_date
      ? formatFinalInterviewDateTime(
          currentCandidate.interviewDate || currentCandidate.interview_date,
        )
      : "Not scheduled";
  const assignedInterviewerDisplay =
    currentCandidate?.interviewerName ||
    currentCandidate?.interviewer ||
    currentCandidate?.assignedInterviewer ||
    savedSubmission?.submittedBy ||
    "—";
  const completedStandardCount = standardQuestionsList.filter(
    (q) => q.isCompleted,
  ).length;
  const allStandardCompleted =
    publicMode ||
    standardQuestionsList.length === 0 ||
    completedStandardCount >= standardQuestionsList.length;

  return (
    <>
      <div
        ref={pageTopRef}
        data-final-interview-scroll-root="true"
        className={pageShellClass}
        style={{ overflowAnchor: "none" }}
      >
        {isSubmitting && (
          <div
            className="fixed inset-0 z-[24000] cursor-wait bg-transparent"
            aria-hidden="true"
          />
        )}

        <div className="mx-auto max-w-[1380px] space-y-3.5">
          {/* 1. Interview Header & Candidate Identity */}
          <header className="sibs-card px-5 py-4">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <h1 className="sibs-page-title text-sibs-navy">
                    {isSubmittedView
                      ? "Final Interview Evaluation · Submitted"
                      : "Final Interview Evaluation"}
                  </h1>
                  <span
                    className={
                      isSubmittedView
                        ? "sibs-badge-success"
                        : requestedViewMode
                          ? "sibs-badge-neutral"
                          : "sibs-badge-info"
                    }
                  >
                    {recruitmentStageDisplay}
                  </span>
                </div>

                <p className="mt-1 text-[13px] 2xl:text-sm font-bold text-sibs-navy">
                  {candidateDisplayName}{" "}
                  <span className="font-normal text-slate-400">|</span>{" "}
                  <span className="font-semibold text-sibs-text-secondary">
                    {appliedPositionDisplay}
                  </span>
                </p>

                <div className="mt-1.5 flex flex-wrap items-center gap-x-4 gap-y-1 text-[11.5px] text-sibs-muted">
                  <span>
                    Candidate ID:{" "}
                    <strong className="font-bold text-sibs-navy">
                      {candidateId || "—"}
                    </strong>
                  </span>
                  <span>
                    App ID:{" "}
                    <strong className="font-bold text-sibs-navy">
                      {effectiveCandidateApplicationId || "—"}
                    </strong>
                  </span>
                  <span>
                    Interview Date:{" "}
                    <strong className="font-bold text-sibs-navy">
                      {interviewScheduleDisplay}
                    </strong>
                  </span>
                  {assignedInterviewerDisplay !== "—" && (
                    <span>
                      Interviewer:{" "}
                      <strong className="font-bold text-sibs-navy">
                        {assignedInterviewerDisplay}
                      </strong>
                    </span>
                  )}
                  <span>
                    Form:{" "}
                    <strong className="font-bold text-sibs-navy">
                      {activeForm?.name ||
                        activeForm?.formName ||
                        activeForm?.form_name ||
                        jobEvaluationFormName ||
                        "Job Evaluation Form"}
                    </strong>
                  </span>
                  {!publicMode && (
                    <span>
                      Passing:{" "}
                      <strong className="font-bold text-sibs-navy">
                        {passingScore}%
                      </strong>
                    </span>
                  )}
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2 shrink-0">
                {!isSubmittedView && draftSaveStatus && (
                  <span
                    className={`text-xs font-bold ${
                      draftSaveStatus.includes("failed")
                        ? "text-red-600"
                        : draftSaveStatus.includes("Saving")
                          ? "text-amber-600"
                          : "text-emerald-700"
                    }`}
                  >
                    {draftSaveStatus}
                  </span>
                )}
                {!publicMode && resumeIntelPayload?.resumeDocument ? (
                  <a
                    href={buildAuthorizedResumeDocumentUrl(
                      resumeIntelPayload.applicationId ||
                        resumeIntelLookupIdentifier,
                    )}
                    target="_blank"
                    rel="noreferrer"
                    data-testid="final-interview-open-resume-link"
                    className="inline-flex items-center gap-1.5 rounded-lg border border-sibs-border bg-sibs-canvas px-3 py-1.5 text-xs font-bold text-sibs-primary-1 transition hover:bg-slate-100"
                  >
                    <ExternalLink size={13} className="text-[#FF5C28]" />
                    Open Resume
                  </a>
                ) : null}
              </div>
            </div>

            {publicError && (
              <p className="mt-2 text-xs font-bold text-red-600">
                {publicError}
              </p>
            )}
            {publicMode && publicLoading && (
              <p className="mt-2 text-xs font-bold text-sibs-tertiary-5">
                Loading applicant assessment...
              </p>
            )}
            {openedWithoutSavedSubmission && (
              <div className="mt-3 rounded-lg border border-amber-200 bg-amber-50 px-3.5 py-2 text-xs font-bold text-amber-800">
                No saved Final Interview submission was found for this link. The
                active interview form is displayed in read-only mode.
              </div>
            )}
            {isSubmittedView && (
              <div className="mt-3 flex flex-wrap items-center justify-between gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-3.5 py-2 text-xs font-bold text-emerald-800">
                <span>
                  This evaluation has been submitted (read-only assessment).
                </span>
                {draftSavedAt && (
                  <span className="font-semibold">
                    Submitted: {formatFinalInterviewDateTime(draftSavedAt)}
                  </span>
                )}
              </div>
            )}
          </header>

          {/* 2. Interview Progress & Section Navigation */}
          <nav
            aria-label="Final Interview sections"
            className="flex items-center gap-1.5 overflow-x-auto rounded-xl border border-sibs-border bg-white p-1.5 shadow-2xs"
          >
            {workspaceTabs.map((tab) => {
              const TabIcon = tab.icon;
              const isActive = activeWorkspaceTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveWorkspaceTab(tab.id)}
                  aria-current={isActive ? "page" : undefined}
                  data-testid={`workspace-tab-${tab.id}`}
                  className={`inline-flex shrink-0 items-center gap-2 rounded-lg px-3.5 py-2 text-xs font-bold transition ${
                    isActive
                      ? "bg-sibs-primary-1 text-white shadow-2xs"
                      : "text-slate-700 hover:bg-sibs-canvas"
                  }`}
                >
                  <TabIcon
                    size={14}
                    className={isActive ? "text-[#FF5C28]" : "text-slate-500"}
                  />
                  <span>{tab.label}</span>
                  {tab.badge !== null && tab.badge !== undefined && (
                    <span
                      className={`rounded-full px-2 py-0.5 text-[10px] font-extrabold ${
                        isActive
                          ? "bg-white/15 text-white"
                          : tab.incomplete
                            ? "bg-amber-50 text-amber-800 border border-amber-200"
                            : "bg-slate-100 text-slate-700"
                      }`}
                    >
                      {tab.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>

          {/* Main Evaluation Form (wraps all tabs so form state is always preserved) */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (isSubmittedView || isSubmitting) return;
              if (!validateQuestionRatings()) return;
              if (publicMode) {
                handleSubmit(e);
              } else {
                setSubmitConfirmOpen(true);
              }
            }}
            className="space-y-4 pb-20"
          >
            {/* TAB 1: OVERVIEW */}
            {activeWorkspaceTab === "overview" && (
              <div className="space-y-3.5" data-testid="workspace-panel-overview">
                {/* Collapsible Resume & Job Alignment */}
                {!publicMode && resumeIntelPayload?.analysis && (
                  <section
                    data-testid="final-interview-resume-analysis-section"
                    className="sibs-card overflow-hidden"
                  >
                    <button
                      type="button"
                      aria-expanded={resumeAlignmentExpanded}
                      onClick={() =>
                        setResumeAlignmentExpanded((prev) => !prev)
                      }
                      className="flex w-full flex-wrap items-center justify-between gap-2 px-5 py-3 text-left transition hover:bg-sibs-surface"
                    >
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="sibs-card-title text-sibs-navy">
                          Resume & Approved Job Description Alignment
                        </span>
                        {resumeIntelPayload.analysis.approvedJobDescription && (
                          <span className="sibs-badge-success">
                            {resumeIntelPayload.analysis.approvedJobDescription
                              .jd_code ||
                              `JD #${resumeIntelPayload.analysis.approvedJobDescription.jd_id}`}{" "}
                            (Rev{" "}
                            {resumeIntelPayload.analysis.approvedJobDescription
                              .revision || 1}
                            )
                          </span>
                        )}
                      </div>
                      <span className="inline-flex items-center gap-1 text-[11.5px] font-bold text-sibs-navy">
                        {resumeAlignmentExpanded ? "Hide Details" : "View Details"}
                        {resumeAlignmentExpanded ? (
                          <ChevronUp size={15} />
                        ) : (
                          <ChevronDown size={15} />
                        )}
                      </span>
                    </button>

                    {resumeAlignmentExpanded && (
                      <div className="grid grid-cols-1 gap-4 border-t border-sibs-border p-4 lg:grid-cols-3">
                        <div className="rounded-lg border border-sibs-border bg-sibs-canvas/60 p-3">
                          <p className="text-[11px] font-extrabold text-sibs-primary-1 uppercase">
                            Work Experience & Education
                          </p>
                          <div className="mt-2 max-h-40 space-y-1.5 overflow-y-auto pr-1">
                            {[
                              ...(resumeIntelPayload.analysis
                                .structuredExperience || []),
                              ...(resumeIntelPayload.analysis.education || []),
                              ...(resumeIntelPayload.analysis.qualifications ||
                                []),
                            ]
                              .slice(0, 6)
                              .map((entry, idx) => (
                                <p
                                  key={idx}
                                  className="rounded border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-700"
                                >
                                  {entry.value}
                                </p>
                              ))}
                          </div>
                        </div>

                        <div className="rounded-lg border border-sibs-border bg-sibs-canvas/60 p-3">
                          <p className="text-[11px] font-extrabold text-sibs-primary-1 uppercase">
                            Skills & Clarifications
                          </p>
                          <div className="mt-2 flex flex-wrap gap-1.5">
                            {(resumeIntelPayload.analysis.skills || [])
                              .slice(0, 12)
                              .map((sk, idx) => (
                                <span
                                  key={idx}
                                  className="rounded border border-blue-200 bg-white px-2 py-0.5 text-[11px] font-bold text-sibs-primary-1"
                                >
                                  {sk.value}
                                </span>
                              ))}
                          </div>
                          {resumeIntelPayload.analysis.uncertainties?.length >
                            0 && (
                            <ul className="mt-2.5 list-disc space-y-1 border-t border-slate-200 pt-2 pl-4 text-[11px] text-amber-900">
                              {resumeIntelPayload.analysis.uncertainties
                                .slice(0, 3)
                                .map((u, idx) => (
                                  <li key={idx}>{u}</li>
                                ))}
                            </ul>
                          )}
                        </div>

                        <div className="rounded-lg border border-sibs-border bg-sibs-canvas/60 p-3">
                          <p className="text-[11px] font-extrabold text-sibs-primary-1 uppercase">
                            Approved JD Requirements
                          </p>
                          <div className="mt-2 max-h-40 space-y-1.5 overflow-y-auto pr-1">
                            {(
                              resumeIntelPayload.analysis.approvedJobDescription
                                ?.requirements || []
                            )
                              .slice(0, 6)
                              .map((req) => (
                                <div
                                  key={req.requirement_id}
                                  className="rounded border border-slate-200 bg-white px-2.5 py-1.5 text-xs text-slate-700"
                                >
                                  <span className="mr-1.5 rounded border border-emerald-200 bg-emerald-50 px-1.5 py-0.5 text-[10px] font-bold text-emerald-700">
                                    {req.requirement_id}
                                  </span>
                                  <span className="font-medium">
                                    {req.text}
                                  </span>
                                </div>
                              ))}
                          </div>
                        </div>
                      </div>
                    )}
                  </section>
                )}

                {/* Default Job Evaluation Criteria */}
                <section className="sibs-card p-5">
                  <div className="border-b border-sibs-border pb-3">
                    <h2 className="sibs-card-title text-sibs-navy">
                      Default Job Evaluation Criteria
                    </h2>
                    <p className="sibs-card-subtitle mt-0.5">
                      Standard job evaluation scoring criteria for this position.
                    </p>
                  </div>

                  <div className="mt-4 grid grid-cols-1 gap-4">
                    <div className="grid min-w-0 grid-cols-1 gap-4 md:grid-cols-3">
                      <JobEvaluationSelect
                        label="Education"
                        fieldKey={JOB_EVALUATION_FIELDS.education}
                        options={educationOptions}
                        value={answers[JOB_EVALUATION_FIELDS.education]}
                        onChange={handleJobEvaluationChange}
                        readOnly={requestedViewMode || isSubmittedView}
                      />
                      <JobEvaluationSelect
                        label="Experience"
                        fieldKey={JOB_EVALUATION_FIELDS.experience}
                        options={experienceOptions}
                        value={answers[JOB_EVALUATION_FIELDS.experience]}
                        onChange={handleJobEvaluationChange}
                        readOnly={requestedViewMode || isSubmittedView}
                      />
                      <JobEvaluationSelect
                        label="Location"
                        fieldKey={JOB_EVALUATION_FIELDS.location}
                        options={locationOptions}
                        value={answers[JOB_EVALUATION_FIELDS.location]}
                        onChange={handleJobEvaluationChange}
                        readOnly={requestedViewMode || isSubmittedView}
                      />
                    </div>

                    <JobEvaluationCheckboxGroup
                      title="Duties and Responsibilities"
                      fieldKey={JOB_EVALUATION_FIELDS.duties}
                      options={dutiesOptions}
                      values={answers[JOB_EVALUATION_FIELDS.duties]}
                      onToggle={handleJobEvaluationToggle}
                      readOnly={requestedViewMode || isSubmittedView}
                    />

                    <JobEvaluationCheckboxGroup
                      title="Competencies"
                      fieldKey={JOB_EVALUATION_FIELDS.competencies}
                      options={competenciesOptions}
                      values={answers[JOB_EVALUATION_FIELDS.competencies]}
                      onToggle={handleJobEvaluationToggle}
                      readOnly={requestedViewMode || isSubmittedView}
                    />
                  </div>
                </section>
              </div>
            )}

            {/* TAB 2: STANDARD QUESTIONS */}
            {activeWorkspaceTab === "standard" && (
              <div data-testid="workspace-panel-standard">
                <FinalInterviewStandardWorkspace
                  questions={standardQuestionsList}
                  finalInterviewRatingScore={finalInterviewRatingScore}
                  publicMode={publicMode}
                  isSubmittedView={isSubmittedView}
                  databaseFormLoading={databaseFormLoading}
                  databaseFormError={databaseFormError}
                  activeQuestionId={activeStandardQuestionKey}
                  onSelectQuestionId={setActiveStandardQuestionKey}
                  emptyStateMessage={
                    isSubmittedView
                      ? "No saved Final Interview questions were found for this submission."
                      : currentCandidate
                        ? `No Final Interview questions are configured for ${
                            getCandidatePositionName(currentCandidate) ||
                            "this position"
                          }. Check Recruitment Settings → Final Interview Form.`
                        : "No matching candidate or Final Interview questions were found."
                  }
                  renderQuestionInputs={(item) => (
                    <div className="space-y-4">
                      {(publicMode || !item.isRatingQuestion) && (
                        <div>
                          <p className="text-xs font-bold uppercase tracking-wide text-slate-600">
                            {publicMode
                              ? "Your Answer"
                              : "Candidate Answer / Interview Notes"}
                          </p>
                          <FieldInput
                            field={item.field}
                            value={answers[item.field.id]}
                            readOnly={requestedViewMode || isSubmittedView}
                            onChange={(value) =>
                              handleAnswerChange(item.field.id, value)
                            }
                          />
                        </div>
                      )}

                      {!publicMode && (
                        <QuestionRatingInput
                          questionId={item.questionId}
                          answers={answers}
                          readOnly={requestedViewMode || publicMode || isSubmitting}
                          onChange={handleInterviewerScoringChange}
                        />
                      )}
                    </div>
                  )}
                />
              </div>
            )}

            {/* TAB 3: AI INTERVIEW QUESTIONS */}
            {!publicMode && activeWorkspaceTab === "ai" && (
              <div data-testid="workspace-panel-ai">
                <FinalInterviewAiWorkspace
                  approvedQuestions={activeApprovedAiQuestions}
                  allQuestions={resumeIntelPayload?.allQuestionsForHrReview || []}
                  approvedJd={
                    resumeIntelPayload?.analysis?.approvedJobDescription || null
                  }
                  questionSetSummary={
                    activeAiQuestionSetSnapshot?.questionSetSummary || null
                  }
                  resumeDocument={resumeIntelPayload?.resumeDocument || null}
                  answers={answers}
                  savedSubmission={savedSubmission}
                  permissions={resumeIntelPermissions}
                  loading={resumeIntelLoading}
                  reviewBusy={resumeIntelReviewBusy}
                  isSubmittedView={isSubmittedView}
                  requestedViewMode={requestedViewMode}
                  isSubmitting={isSubmitting}
                  selectedQuestionId={activeAiQuestionId}
                  onSelectQuestionId={setActiveAiQuestionId}
                  onChangeRemarks={handleInterviewerScoringChange}
                  onReviewDecision={handleInlineAiQuestionReview}
                  onRegenerate={handleInlineRegenerateAiQuestions}
                />
              </div>
            )}

            {/* TAB 4: EVALUATION & SUMMARY */}
            {activeWorkspaceTab === "summary" && (
              <div className="space-y-4" data-testid="workspace-panel-summary">
                {!publicMode && (
                  <ScoreSummaryCard
                    answers={answers}
                    jobEvaluationScore={jobEvaluationScore}
                    finalInterviewRatingScore={finalInterviewRatingScore}
                    passingScore={passingScore}
                    showBreakdown={true}
                  />
                )}

                <section className="rounded-xl border border-sibs-border bg-white p-5 shadow-2xs">
                  <h2 className="text-sm font-extrabold text-sibs-primary-1">
                    Evaluation Readiness Check
                  </h2>
                  <div className="mt-3 flex flex-wrap items-center justify-between gap-3 rounded-lg border border-sibs-border bg-sibs-canvas/60 px-4 py-3">
                    <div className="flex items-center gap-2.5 text-xs font-semibold text-slate-700">
                      {completedStandardCount >=
                      standardQuestionsList.length ? (
                        <>
                          <CheckCircle2
                            size={16}
                            className="text-emerald-600 shrink-0"
                          />
                          <span>
                            All {standardQuestionsList.length} standard
                            interview questions have been completed.
                          </span>
                        </>
                      ) : (
                        <>
                          <AlertCircle
                            size={16}
                            className="text-amber-600 shrink-0"
                          />
                          <span>
                            {standardQuestionsList.length -
                              completedStandardCount}{" "}
                            {publicMode
                              ? "standard question(s) still need an answer before submission."
                              : "standard question(s) still need a rating before final submission."}
                          </span>
                        </>
                      )}
                    </div>
                    {completedStandardCount < standardQuestionsList.length && (
                      <button
                        type="button"
                        onClick={() => setActiveWorkspaceTab("standard")}
                        className="rounded-lg border border-sibs-border bg-white px-3 py-1.5 text-xs font-bold text-sibs-primary-1 hover:bg-slate-50"
                      >
                        Review Standard Questions
                      </button>
                    )}
                  </div>
                </section>
              </div>
            )}

            {/* Sticky Action Footer */}
            <div className="sticky bottom-0 z-30 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-sibs-border bg-white/95 px-4 py-3 shadow-md backdrop-blur-xs">
              <div className="flex flex-wrap items-center gap-2 text-xs text-sibs-muted">
                {!isSubmittedView && draftSaveStatus ? (
                  <span
                    className={`font-bold ${
                      draftSaveStatus.includes("failed")
                        ? "text-red-600"
                        : draftSaveStatus.includes("Saving")
                          ? "text-amber-600"
                          : "text-emerald-700"
                    }`}
                  >
                    {draftSaveStatus}
                  </span>
                ) : (
                  <span className="font-semibold">
                    {isSubmittedView
                      ? "Submitted evaluation"
                      : `${completedStandardCount} of ${standardQuestionsList.length} standard questions rated`}
                  </span>
                )}
              </div>

              <div className="flex flex-wrap items-center gap-2.5">
                {!isSubmittedView &&
                  !requestedViewMode &&
                  !publicMode &&
                  !allStandardCompleted && (
                    <span
                      className="text-[11px] font-bold text-amber-700"
                      data-testid="submit-readiness-hint"
                    >
                      Rate all standard questions ({completedStandardCount}/
                      {standardQuestionsList.length}) to submit
                    </span>
                  )}

                {isSubmittedView ? (
                  !publicMode &&
                  !requestedViewMode && (
                    <button
                      type="button"
                      disabled={isSubmitting}
                      onClick={handleSaveScoringChanges}
                      className="sibs-modal-btn-primary gap-2 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {isSubmitting ? (
                        <>
                          <Loader2 size={15} className="animate-spin" />
                          Saving...
                        </>
                      ) : (
                        "Save Rating & Remarks"
                      )}
                    </button>
                  )
                ) : !requestedViewMode ? (
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    aria-disabled={!allStandardCompleted || isSubmitting}
                    data-testid="submit-final-interview-btn"
                    className={
                      allStandardCompleted
                        ? "sibs-modal-btn-primary gap-2 disabled:cursor-not-allowed disabled:opacity-60"
                        : "inline-flex h-9 items-center justify-center gap-2 rounded-xl border border-slate-300 bg-slate-200 px-4 text-xs font-bold text-slate-600 transition hover:bg-slate-200/80"
                    }
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 size={15} className="animate-spin" />
                        Submitting...
                      </>
                    ) : (
                      "Submit Job Evaluation Form"
                    )}
                  </button>
                ) : null}
              </div>
            </div>
          </form>
        </div>
      </div>

      <ConfirmModal
        open={submitConfirmOpen}
        onClose={() => setSubmitConfirmOpen(false)}
        onConfirm={() => {
          setSubmitConfirmOpen(false);
          handleSubmit({ preventDefault: () => {} });
        }}
        loading={isSubmitting}
        variant="primary"
        closeOnEscape={true}
        title="Submit Final Interview Evaluation?"
        description="Once submitted, this evaluation will be recorded for the candidate's Final Interview stage. Ensure all ratings and remarks are accurate."
        confirmLabel="Confirm & Submit"
        cancelLabel="Review Answers"
      />

      <StatusModal
        open={statusModal.open}
        type={statusModal.type}
        title={statusModal.title}
        message={statusModal.message}
        onClose={closeStatusModal}
        variant="center"
        lockScroll={false}
      />
    </>
  );
}
