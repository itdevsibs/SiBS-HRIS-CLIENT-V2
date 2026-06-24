import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useCandidatePipeline } from "../../../services/context/CandidatePipelineContext";

import {
  deleteFinalInterviewDraft,
  getFinalInterviewDraft,
  saveFinalInterviewDraft,
} from "../../../lib/axios/getFinalInterviewDraft";

import api from "../../../lib/axios/api-template";
import StatusModal from "../../../components/modals/StatusModal";

const RECRUITMENT_SETTINGS_STORAGE_KEY = "sibs_recruitment_settings_temp";
const DEFAULT_JOB_EVALUATION_FORM_ID = "default-job-evaluation";

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
  try {
    const raw = localStorage.getItem(RECRUITMENT_SETTINGS_STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
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

function formMatchesPosition(form = {}, target = {}) {
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

function calculateRatingScore(fields = [], answers = {}) {
  const ratingFields = fields.filter(
    (field) => field.enabled !== false && field.type === "Rating",
  );

  const ratedValues = ratingFields
    .map((field) => Number(answers[field.id]))
    .filter((value) => Number.isFinite(value) && value >= 1 && value <= 5);

  if (!ratedValues.length) {
    return {
      totalRatingFields: ratingFields.length,
      answeredRatingFields: 0,
      totalScore: 0,
      averageRating: 0,
      percentageScore: 0,
    };
  }

  const totalScore = ratedValues.reduce((sum, value) => sum + value, 0);
  const averageRating = totalScore / ratedValues.length;
  const percentageScore = (averageRating / 5) * 100;

  return {
    totalRatingFields: ratingFields.length,
    answeredRatingFields: ratedValues.length,
    totalScore,
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
  const submittedForms = getSubmittedForms(candidate);

  if (!submittedForms.length) return null;

  if (submissionId) {
    const exact = submittedForms.find(
      (item) => String(item.id) === String(submissionId),
    );

    if (exact) return exact;
  }

  return [...submittedForms].sort(
    (a, b) => getSubmissionTimestamp(b) - getSubmissionTimestamp(a),
  )[0];
}

function StatusBadge({ label, tone = "default" }) {
  const styles = {
    success: "border-[#ABEFC6] bg-[#ECFDF3] text-[#067647]",
    blue: "border-blue-100 bg-blue-50 text-blue-700",
    warning: "border-amber-100 bg-amber-50 text-amber-700",
    orange: "border-orange-100 bg-orange-50 text-orange-700",
    danger: "border-[#FECDCA] bg-[#FEF3F2] text-[#D92D20]",
    default: "border-[#D0D5DD] bg-[#F9FAFB] text-[#344054]",
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
      iconWrap: "bg-[#F2F4F7]",
      border: "border-[#E4E7EC]",
      progress: "bg-sibs-primary-1",
    },
    success: {
      value: "text-[#079455]",
      iconWrap: "bg-[#ECFDF3]",
      border: "border-[#D0F0DD]",
      progress: "bg-[#12B76A]",
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
      value: "text-[#D92D20]",
      iconWrap: "bg-[#FEF3F2]",
      border: "border-[#F5D3CF]",
      progress: "bg-[#F04438]",
    },
  };

  const styles = toneClasses[tone] || toneClasses.default;

  const hasProgress =
    progressValue !== null &&
    progressValue !== undefined &&
    Number.isFinite(Number(progressValue));

  return (
    <div
      className={`rounded-[22px] border ${styles.border} bg-white px-6 py-5 shadow-[0_1px_6px_rgba(16,24,40,0.04)]`}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-[13px] font-extrabold uppercase tracking-[0.02em] text-[#17406D]">
              {title}
            </p>

            {statusLabel && (
              <StatusBadge label={statusLabel} tone={statusTone} />
            )}
          </div>

          <p
            className={`mt-3 text-[30px] font-extrabold leading-none ${styles.value}`}
          >
            {value}
          </p>

          <p className="mt-3 text-[14px] font-semibold leading-5 text-[#365B85]">
            {subtext}
          </p>
        </div>

        <div
          className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-[18px] ${styles.iconWrap}`}
        >
          <div className="h-5 w-5 rounded-full border-2 border-[#123B67]" />
        </div>
      </div>

      {hasProgress && (
        <div className="mt-5">
          <div className="mb-2 flex items-center justify-between">
            <span className="text-[11px] font-extrabold uppercase tracking-[0.04em] text-[#667085]">
              Progress
            </span>

            <span className={`text-xs font-extrabold ${styles.value}`}>
              {Number(progressValue).toFixed(0)}%
            </span>
          </div>

          <div className="h-2.5 overflow-hidden rounded-full bg-[#E4E7EC]">
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

function BreakdownPanel({ title, subtitle, items = [], type = "score" }) {
  return (
    <div className="rounded-[22px] border border-[#D9E2EC] bg-white px-5 py-5 shadow-[0_1px_6px_rgba(16,24,40,0.04)]">
      <div className="mb-4 flex items-start justify-between gap-3">
        <div>
          <h3 className="text-[16px] font-extrabold text-[#101828]">{title}</h3>
          <p className="mt-1 text-[14px] font-medium text-[#3B6E9F]">
            {subtitle}
          </p>
        </div>

        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#F2F4F7]">
          <div className="h-4 w-4 rounded-full border-2 border-[#98A2B3]" />
        </div>
      </div>

      <div className="space-y-3">
        {items.map((item, index) => (
          <div
            key={`${item.label}-${index}`}
            className="flex items-center justify-between gap-4 rounded-[16px] bg-[#F8FAFC] px-4 py-3"
          >
            <div className="min-w-0">
              <p className="text-[14px] font-bold text-[#101828]">
                {item.label}
              </p>
            </div>

            <div className="shrink-0 text-right">
              <p
                className={`text-[15px] font-extrabold ${
                  type === "score"
                    ? "text-sibs-primary-1"
                    : type === "text"
                      ? "text-[#101828]"
                      : "text-[#365B85]"
                }`}
              >
                {item.value}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function ScoreSummaryCard({
  jobEvaluationScore,
  finalInterviewRatingScore,
  passingScore,
}) {
  const finalInterviewHasScore =
    finalInterviewRatingScore.answeredRatingFields > 0;

  const finalInterviewPassed =
    finalInterviewHasScore &&
    finalInterviewRatingScore.percentageScore >= passingScore;

  const finalInterviewPercent = finalInterviewHasScore
    ? finalInterviewRatingScore.percentageScore.toFixed(0)
    : "—";

  const finalInterviewAverage = finalInterviewHasScore
    ? finalInterviewRatingScore.averageRating.toFixed(2)
    : "—";

  const jobEvaluationRankTone = getRankTone(jobEvaluationScore.rank);
  const jobEvaluationRankStatus = getRankStatus(jobEvaluationScore.rank);

  return (
    <section className="rounded-[24px] border border-[#D9E2EC] bg-white p-6 shadow-[0_2px_10px_rgba(16,24,40,0.04)]">
      <div className="mb-6">
        <h2 className="text-[18px] font-extrabold text-[#101828]">
          Evaluation Performance Summary
        </h2>
        <p className="mt-1 text-[14px] font-medium text-[#3B6E9F]">
          Combined overview of Job Evaluation and Final Interview results.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        <SummaryMetricCard
          title="Job Evaluation Score"
          value={`${jobEvaluationScore.percentageScore.toFixed(0)}%`}
          subtext={`Rank ${jobEvaluationScore.rank} · ${jobEvaluationRankStatus}`}
          tone={jobEvaluationRankTone}
          progressValue={jobEvaluationScore.percentageScore}
          statusLabel={`Rank ${jobEvaluationScore.rank}`}
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
            !finalInterviewHasScore
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
            finalInterviewHasScore
              ? finalInterviewPassed
                ? "Passed"
                : "Failed"
              : ""
          }
          statusTone={finalInterviewPassed ? "success" : "danger"}
        />
      </div>

      <div className="mt-6 grid grid-cols-1 gap-5 xl:grid-cols-3">
        <BreakdownPanel
          title="Job Evaluation Breakdown"
          subtitle="Score distribution by default JE sections."
          type="score"
          items={[
            { label: "Education", value: jobEvaluationScore.educationScore },
            { label: "Experience", value: jobEvaluationScore.experienceScore },
            { label: "Location", value: jobEvaluationScore.locationScore },
            {
              label: "Duties and Responsibilities",
              value: jobEvaluationScore.dutiesScore,
            },
            {
              label: "Competencies",
              value: jobEvaluationScore.competenciesScore,
            },
          ]}
        />

        <BreakdownPanel
          title="Final Interview Breakdown"
          subtitle="Computed only from rating-type questions."
          type="text"
          items={[
            {
              label: "Average Rating",
              value: finalInterviewHasScore
                ? `${finalInterviewAverage} / 5`
                : "—",
            },
            {
              label: "Answered Rating Fields",
              value: `${finalInterviewRatingScore.answeredRatingFields}/${finalInterviewRatingScore.totalRatingFields}`,
            },
            {
              label: "Interview Result",
              value: finalInterviewHasScore
                ? finalInterviewPassed
                  ? "Passed"
                  : "Failed"
                : "No rating",
            },
          ]}
        />

        <BreakdownPanel
          title="Score Notes"
          subtitle="Scoring basis used in this evaluation."
          type="note"
          items={[
            { label: "Job Evaluation", value: "Default JE criteria" },
            { label: "Final Interview", value: "Rating questions only" },
            { label: "Passing Rule", value: `${passingScore}% minimum` },
          ]}
        />
      </div>
    </section>
  );
}

function ScoreLine({ label, value, subtext = "" }) {
  return (
    <div className="flex items-start justify-between gap-4 rounded-2xl bg-[#F8FAFC] px-4 py-3">
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

      <p className="shrink-0 text-right text-base font-extrabold text-[#101828]">
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
    <div className="rounded-2xl border border-[#E6ECF2] bg-white p-4">
      <div className="mb-3 flex items-center justify-between gap-3">
        <h4 className="text-sm font-extrabold text-sibs-primary-1">{title}</h4>

        <span className="rounded-full bg-[#F2F6FA] px-3 py-1 text-xs font-extrabold text-sibs-primary-1">
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
        <p className="rounded-xl border border-dashed border-[#D6DEE8] bg-[#F8FAFC] px-3 py-3 text-sm font-bold text-sibs-tertiary-5">
          {emptyText}
        </p>
      )}
    </div>
  );
}

function JobEvaluationScorePanel({
  answers = {},
  jobEvaluationScore,
  passingScore,
}) {
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

  const rankTone = getRankTone(jobEvaluationScore.rank);
  const rankStatus = getRankStatus(jobEvaluationScore.rank);

  return (
    <aside className="rounded-[22px] border border-[#D9E2EC] bg-white p-5 shadow-[0_1px_6px_rgba(16,24,40,0.04)] xl:sticky xl:top-4 xl:self-start">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-[12px] font-extrabold uppercase tracking-wide text-sibs-primary-1">
            Job Evaluation Score
          </p>

          <h3 className="mt-2 text-4xl font-extrabold leading-none text-[#101828]">
            {jobEvaluationScore.totalScore}
            <span className="text-xl text-sibs-tertiary-5">/100</span>
          </h3>

          <p className="mt-2 text-sm font-bold text-sibs-tertiary-5">
            Passing score: {passingScore}%
          </p>
        </div>

        <StatusBadge label={`Rank ${jobEvaluationScore.rank}`} tone={rankTone} />
      </div>

      <div className="mt-5">
        <div className="mb-2 flex items-center justify-between">
          <span className="text-[11px] font-extrabold uppercase tracking-[0.04em] text-[#667085]">
            Total Progress
          </span>

          <span className="text-xs font-extrabold text-sibs-primary-1">
            {jobEvaluationScore.percentageScore.toFixed(0)}%
          </span>
        </div>

        <div className="h-2.5 overflow-hidden rounded-full bg-[#E4E7EC]">
          <div
            className="h-full rounded-full bg-sibs-primary-1 transition-all duration-300"
            style={{
              width: `${Math.min(
                Math.max(Number(jobEvaluationScore.percentageScore), 0),
                100,
              )}%`,
            }}
          />
        </div>
      </div>

      <div className="mt-5 space-y-3">
        <ScoreLine
          label="Education"
          value={`${jobEvaluationScore.educationScore} pts`}
          subtext={education?.label || "No selected answer"}
        />

        <ScoreLine
          label="Experience"
          value={`${jobEvaluationScore.experienceScore} pts`}
          subtext={experience?.label || "No selected answer"}
        />

        <ScoreLine
          label="Location"
          value={`${jobEvaluationScore.locationScore} pts`}
          subtext={location?.label || "No selected answer"}
        />

        <ScoreLine
          label="Duties"
          value={`${jobEvaluationScore.dutiesScore} pts`}
          subtext="Total score from selected duties."
        />

        <ScoreLine
          label="Competencies"
          value={`${jobEvaluationScore.competenciesScore} pts`}
          subtext="Total score from selected competencies."
        />
      </div>

      <div className="mt-5 rounded-2xl border border-[#E6ECF2] bg-[#F8FAFC] px-4 py-3">
        <p className="text-xs font-extrabold uppercase tracking-wide text-sibs-primary-1">
          Evaluation Result
        </p>

        <p className="mt-1 text-sm font-extrabold text-[#101828]">
          {rankStatus}
        </p>
      </div>
    </aside>
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
    <section className="rounded-[22px] border border-[#D9E2EC] bg-[#F8FAFC] p-5">
      <div className="mb-4">
        <h3 className="text-base font-extrabold text-[#101828]">
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

function FieldInput({ field, value, onChange, readOnly = false }) {
  const disabledClass =
    "disabled:cursor-not-allowed disabled:bg-[#F8FAFC] disabled:text-[#475467]";

  if (field.type === "Rating") {
    return (
      <select
        value={value || ""}
        disabled={readOnly}
        onChange={(e) => onChange(e.target.value)}
        className={`mt-2 h-11 w-full rounded-lg border border-[#B8C2CF] bg-white px-3 text-sm font-semibold text-[#344054] outline-none transition focus:border-sibs-primary-1 focus:ring-4 focus:ring-sibs-primary-1/10 ${disabledClass}`}
      >
        <option value="">Select rating</option>
        <option value="1">1 - Poor</option>
        <option value="2">2 - Fair</option>
        <option value="3">3 - Good</option>
        <option value="4">4 - Very Good</option>
        <option value="5">5 - Excellent</option>
      </select>
    );
  }

  if (field.type === "Paragraph") {
    return (
      <textarea
        rows={4}
        value={value || ""}
        disabled={readOnly}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Type answer here..."
        className={`mt-2 w-full resize-none rounded-lg border border-[#B8C2CF] bg-white px-3 py-2 text-sm font-semibold text-[#344054] outline-none transition placeholder:text-[#98A2B3] focus:border-sibs-primary-1 focus:ring-4 focus:ring-sibs-primary-1/10 ${disabledClass}`}
      />
    );
  }

  if (field.type === "Dropdown") {
    return (
      <select
        value={value || ""}
        disabled={readOnly}
        onChange={(e) => onChange(e.target.value)}
        className={`mt-2 h-11 w-full rounded-lg border border-[#B8C2CF] bg-white px-3 text-sm font-semibold text-[#344054] outline-none transition focus:border-sibs-primary-1 focus:ring-4 focus:ring-sibs-primary-1/10 ${disabledClass}`}
      >
        <option value="">Select answer</option>
        <option value="Recommended">Recommended</option>
        <option value="For Review">For Review</option>
        <option value="Not Recommended">Not Recommended</option>
      </select>
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
        className={`mt-2 h-11 w-full rounded-lg border border-[#B8C2CF] bg-white px-3 text-sm font-semibold text-[#344054] outline-none transition placeholder:text-[#98A2B3] focus:border-sibs-primary-1 focus:ring-4 focus:ring-sibs-primary-1/10 ${disabledClass}`}
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
        className={`mt-2 h-11 w-full rounded-lg border border-[#B8C2CF] bg-white px-3 text-sm font-semibold text-[#344054] outline-none transition focus:border-sibs-primary-1 focus:ring-4 focus:ring-sibs-primary-1/10 ${disabledClass}`}
      />
    );
  }

  if (field.type === "Checkbox") {
    return (
      <label className="mt-2 flex h-11 items-center gap-3 rounded-lg border border-[#B8C2CF] bg-white px-3 text-sm font-semibold text-[#344054]">
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
    <input
      value={value || ""}
      disabled={readOnly}
      onChange={(e) => onChange(e.target.value)}
      placeholder="Type answer here..."
      className={`mt-2 h-11 w-full rounded-lg border border-[#B8C2CF] bg-white px-3 text-sm font-semibold text-[#344054] outline-none transition placeholder:text-[#98A2B3] focus:border-sibs-primary-1 focus:ring-4 focus:ring-sibs-primary-1/10 ${disabledClass}`}
    />
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
  return (
    <div className="min-w-0">
      <label className="block truncate text-sm font-extrabold text-sibs-primary-1">
        {label}
      </label>

      <select
        value={value || ""}
        disabled={readOnly}
        title={value || `Select ${label.toLowerCase()}`}
        onChange={(e) => onChange(fieldKey, e.target.value)}
        className="mt-2 block h-11 w-full min-w-0 truncate rounded-lg border border-[#B8C2CF] bg-white pl-3 pr-7 text-sm font-semibold text-[#344054] outline-none transition disabled:cursor-not-allowed disabled:bg-[#F8FAFC] disabled:text-[#475467] focus:border-sibs-primary-1 focus:ring-4 focus:ring-sibs-primary-1/10"
      >
        <option value="">Select {label.toLowerCase()}</option>

        {options.map((option) => (
          <option key={option.label} value={option.label}>
            {option.label} ({option.score} pts)
          </option>
        ))}
      </select>
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
      <h4 className="text-sm font-extrabold text-sibs-primary-1">{title}</h4>

      <div className="mt-3 space-y-2">
        {options.map((option) => {
          const checked = safeValues.includes(option.label);

          return (
            <label
              key={option.label}
              className={`flex gap-3 rounded-xl border p-3 text-sm font-semibold leading-6 transition ${
                checked
                  ? "border-blue-100 bg-blue-50 text-sibs-primary-1"
                  : "border-[#E6ECF2] bg-white text-[#344054]"
              } ${
                readOnly
                  ? "cursor-not-allowed opacity-80"
                  : "cursor-pointer hover:border-blue-100 hover:bg-blue-50"
              }`}
            >
              <input
                type="checkbox"
                checked={checked}
                disabled={readOnly}
                onChange={() => onToggle(fieldKey, option.label)}
                className="mt-1 h-4 w-4 shrink-0 accent-sibs-primary-1 disabled:cursor-not-allowed"
              />

              <span className="min-w-0 flex-1">
                {option.label}
                <span className="ml-2 whitespace-nowrap text-xs font-extrabold text-sibs-tertiary-5">
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

  const { candidateList, handleSubmitFinalInterview } = useCandidatePipeline();

  const candidateId = searchParams.get("candidateId") || "—";
  const candidateApplicationIdFromUrl =
    searchParams.get("candidateApplicationId") || "";
  const emailFromUrl = searchParams.get("email") || "";
  const positionId = searchParams.get("positionId") || "";
  const formId = searchParams.get("formId") || "";
  const submissionId = searchParams.get("submissionId") || "";
  const mode = searchParams.get("mode");

  const isViewMode = mode === "view";

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

  const [statusModal, setStatusModal] = useState({
    open: false,
    type: "error",
    title: "",
    message: "",
    afterClose: null,
  });

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

    async function loadPublicCandidateAssessment() {
      if (!publicMode) return;

      setPublicLoading(true);
      setPublicError("");

      try {
        if (!candidateId || candidateId === "—") {
          throw new Error("Candidate ID is missing from the assessment link.");
        }

        const response = await api.get(
          `/api/candidate-pipeline/public-assessment/${encodeURIComponent(
            candidateId,
          )}`,
          {
            params: {
              email: emailFromUrl || undefined,
              submissionId: submissionId || undefined,
              formId: formId || undefined,
            },
            withCredentials: false,
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

        const assessment = safeObject(payload.assessment || rawCandidate.publicAssessment);
        const payloadDisplayForm =
          payload.displayForm ||
          payload.submittedForm ||
          assessment.displayForm ||
          assessment.submittedForm ||
          null;
        const payloadDraft = payload.draft || assessment.draft || null;
        const normalizedDisplayForm = payloadDisplayForm
          ? normalizeSubmittedForm(payloadDisplayForm)
          : null;
        const normalizedDraftForm = normalizeDraftAsForm(payloadDraft);

        const candidateWithPublicData = {
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
          setPublicCandidate(candidateWithPublicData);
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

    loadPublicCandidateAssessment();

    return () => {
      active = false;
    };
  }, [publicMode, candidateId, emailFromUrl, submissionId, formId]);

  const contextCandidate = useMemo(() => {
    return candidateList.find((candidate) => {
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

  useEffect(() => {
    const previousScrollRestoration = window.history.scrollRestoration;

    if ("scrollRestoration" in window.history) {
      window.history.scrollRestoration = "manual";
    }

    function scrollToTop() {
      window.scrollTo({
        top: 0,
        left: 0,
        behavior: "auto",
      });

      document.documentElement.scrollTop = 0;
      document.body.scrollTop = 0;

      const scrollContainers = document.querySelectorAll(
        "main, #root, .overflow-y-auto, .overflow-auto",
      );

      scrollContainers.forEach((container) => {
        if (container && typeof container.scrollTo === "function") {
          container.scrollTo({
            top: 0,
            left: 0,
            behavior: "auto",
          });
        }
      });
    }

    scrollToTop();

    const animationFrameId = window.requestAnimationFrame(scrollToTop);
    const timeoutId = window.setTimeout(scrollToTop, 100);

    return () => {
      window.cancelAnimationFrame(animationFrameId);
      window.clearTimeout(timeoutId);

      if ("scrollRestoration" in window.history) {
        window.history.scrollRestoration = previousScrollRestoration;
      }
    };
  }, [
    candidateId,
    candidateApplicationIdFromUrl,
    positionId,
    formId,
    submissionId,
    mode,
  ]);

  const settings = useMemo(() => safeReadSettings(), []);

  const activeForm = useMemo(() => {
    if (!settings?.forms?.length) return null;

    const forms = settings.forms;

    const candidatePositionId = getCandidatePositionId(currentCandidate);
    const candidatePositionName = getCandidatePositionName(currentCandidate);

    const targetPositionId = positionId || candidatePositionId;
    const targetPositionName = candidatePositionName;

    const hasTarget = Boolean(targetPositionId || targetPositionName);

    const formByExactId = forms.find(
      (form) => String(form.id) === String(formId),
    );

    if (
      formByExactId &&
      (!hasTarget ||
        formMatchesPosition(formByExactId, {
          positionId: targetPositionId,
          positionName: targetPositionName,
        }))
    ) {
      return formByExactId;
    }

    const activeFormForPosition = forms.find((form) => {
      if (form.status !== "Active") return false;

      return formMatchesPosition(form, {
        positionId: targetPositionId,
        positionName: targetPositionName,
      });
    });

    if (activeFormForPosition) return activeFormForPosition;

    const formByPosition = forms.find((form) =>
      formMatchesPosition(form, {
        positionId: targetPositionId,
        positionName: targetPositionName,
      }),
    );

    if (formByPosition) return formByPosition;

    return null;
  }, [settings, formId, positionId, currentCandidate]);

  const effectivePositionId = useMemo(() => {
    return positionId || getCandidatePositionId(currentCandidate);
  }, [positionId, currentCandidate]);

  const effectiveFormId = useMemo(() => {
    return formId || activeForm?.id || DEFAULT_JOB_EVALUATION_FORM_ID;
  }, [formId, activeForm]);

  const savedSubmission = useMemo(() => {
    return getLatestSubmittedForm(currentCandidate, submissionId);
  }, [submissionId, currentCandidate]);

  const isSubmittedView = Boolean(
    isViewMode || submittedSuccessfully || savedSubmission,
  );

  const savedSubmissionScoreSummary = useMemo(() => {
    return safeObject(savedSubmission?.scoreSummary);
  }, [savedSubmission]);

  const jobEvaluationFormName = useMemo(() => {
    return getJobEvaluationTitle(activeForm?.name || savedSubmission?.formName);
  }, [activeForm?.name, savedSubmission?.formName]);

  const groupedFields = useMemo(() => {
    return groupFieldsBySection(
      savedSubmission?.fieldsSnapshot || activeForm?.fields || [],
    );
  }, [activeForm, savedSubmission]);

  const passingScore = useMemo(() => {
    return getPassingScore(savedSubmission || activeForm);
  }, [activeForm, savedSubmission]);

  const computedJobEvaluationScore = useMemo(() => {
    return calculateJobEvaluationScore(answers);
  }, [answers]);

  const jobEvaluationScore = useMemo(() => {
    const savedJobEvaluationScore =
      savedSubmissionScoreSummary.jobEvaluation ||
      savedSubmissionScoreSummary.job_evaluation ||
      savedSubmissionScoreSummary.jobEvaluationScore ||
      savedSubmissionScoreSummary.job_evaluation_score;

    return normalizeSavedJobEvaluationScore(
      savedJobEvaluationScore,
      computedJobEvaluationScore,
    );
  }, [savedSubmissionScoreSummary, computedJobEvaluationScore]);

  const computedFinalInterviewRatingScore = useMemo(() => {
    return calculateRatingScore(
      savedSubmission?.fieldsSnapshot || activeForm?.fields || [],
      answers,
    );
  }, [activeForm, savedSubmission, answers]);

  const finalInterviewRatingScore = useMemo(() => {
    const savedFinalInterviewScore =
      savedSubmissionScoreSummary.finalInterview ||
      savedSubmissionScoreSummary.final_interview ||
      savedSubmissionScoreSummary.finalInterviewScore ||
      savedSubmissionScoreSummary.final_interview_score;

    return normalizeSavedFinalInterviewScore(
      savedFinalInterviewScore,
      computedFinalInterviewRatingScore,
    );
  }, [savedSubmissionScoreSummary, computedFinalInterviewRatingScore]);

  const pageShellClass = publicMode
    ? "fixed inset-0 z-[99999] min-h-screen overflow-y-auto bg-[#E9EEF5] px-4 py-8 font-jakarta text-sibs-primary-1"
    : "min-h-screen bg-[#E9EEF5] px-4 py-8 font-jakarta text-sibs-primary-1";

  const scoreSummary = useMemo(() => {
    const jobEvaluationPassed =
      jobEvaluationScore.percentageScore >= passingScore;

    const finalInterviewPassed =
      finalInterviewRatingScore.answeredRatingFields > 0 &&
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
        status: finalInterviewPassed ? "Passed" : "Failed",
        passed: finalInterviewPassed,
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

        const draftAnswers =
          response?.data?.answers ||
          response?.data?.data?.answers ||
          response?.data?.draft?.answers ||
          null;

        if (draftAnswers && typeof draftAnswers === "object") {
          setAnswers(draftAnswers);
          setDraftSavedAt(
            response?.data?.savedAt ||
              response?.data?.data?.savedAt ||
              response?.data?.draft?.savedAt ||
              "",
          );
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
          fieldsSnapshot: activeForm?.fields || [],
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
    jobEvaluationFormName,
  ]);

  function handleAnswerChange(fieldId, value) {
    if (isSubmittedView) return;

    setHasUserChangedAnswers(true);

    setAnswers((prev) => ({
      ...prev,
      [fieldId]: value,
    }));
  }

  function handleJobEvaluationChange(fieldId, value) {
    if (isSubmittedView) return;

    setHasUserChangedAnswers(true);

    setAnswers((prev) => ({
      ...prev,
      [fieldId]: value,
    }));
  }

  function handleJobEvaluationToggle(fieldId, optionLabel) {
    if (isSubmittedView) return;

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

  function validateRequiredFields() {
    const requiredFields = (activeForm?.fields || []).filter(
      (field) => field.enabled !== false && field.required,
    );

    const missingField = requiredFields.find((field) => {
      const value = answers[field.id];

      if (typeof value === "boolean") return false;

      return (
        value === undefined || value === null || String(value).trim() === ""
      );
    });

    if (missingField) {
      showStatusModal({
        type: "error",
        title: "Required Question",
        message: `Please answer required question: ${missingField.label}`,
      });

      return false;
    }

    return true;
  }

  async function handleSubmit(e) {
    e.preventDefault();

    if (isSubmittedView) return;
    if (isSubmitting) return;
    if (!validateRequiredFields()) return;

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
            fieldsSnapshot: activeForm?.fields || [],
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

      const didUpdateCandidate = await handleSubmitFinalInterview({
        candidateId,
        candidateApplicationId: effectiveCandidateApplicationId,
        positionId: effectivePositionId,
        formId: finalFormId,
        formName: finalFormName,
        passingScore,
        answers,
        fieldsSnapshot: activeForm?.fields || [],
        scoreSummary,
      });

      if (!didUpdateCandidate) {
        showStatusModal({
          type: "error",
          title: "Candidate Not Found",
          message:
            "Job evaluation form submitted, but the candidate record was not found in the pipeline.",
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

      showStatusModal({
        type: "success",
        title: "Job Evaluation Submitted",
        message: "Candidate moved to Interviewed.",
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

  return (
    <>
      <div className={pageShellClass}>
        <div className="mx-auto max-w-[1180px] space-y-5">
          <section className="rounded-2xl border border-[#E6ECF2] bg-white p-6 shadow-sm">
            <div className="inline-flex rounded-full border border-blue-100 bg-blue-50 px-3 py-1 text-xs font-extrabold uppercase tracking-wide text-sibs-primary-1">
              {isSubmittedView ? "Finished Assessment" : "Job Evaluation"}
            </div>

            <h1 className="mt-4 text-2xl font-extrabold text-sibs-primary-1">
              {jobEvaluationFormName || "Job Evaluation Form"}
            </h1>

            <p className="mt-2 text-sm font-semibold text-sibs-primary-1">
              Candidate ID: {candidateId} · Application ID:{" "}
              {effectiveCandidateApplicationId}
            </p>

            {currentCandidate && (
              <p className="mt-2 text-xs font-bold text-sibs-tertiary-5">
                Position: {getCandidatePositionName(currentCandidate) || "—"}
              </p>
            )}

            {publicMode && publicError && (
              <p className="mt-2 text-xs font-bold text-red-600">
                {publicError}
              </p>
            )}

            {publicMode && publicLoading && (
              <p className="mt-2 text-xs font-bold text-sibs-tertiary-5">
                Loading applicant assessment...
              </p>
            )}

            {isSubmittedView && (
              <div className="mt-4 rounded-2xl border border-emerald-100 bg-emerald-50 px-4 py-3">
                <p className="text-sm font-extrabold text-emerald-700">
                  This assessment has already been submitted. The finished
                  assessment is displayed below as read-only.
                </p>

                {draftSavedAt && (
                  <p className="mt-1 text-xs font-bold text-emerald-700/80">
                    Submitted at: {new Date(draftSavedAt).toLocaleString("en-PH")}
                  </p>
                )}
              </div>
            )}

            {!isSubmittedView && (
              <div className="mt-2 flex flex-wrap items-center gap-2">
                {draftSaveStatus && (
                  <p
                    className={`text-xs font-bold ${
                      draftSaveStatus.includes("failed")
                        ? "text-red-500"
                        : draftSaveStatus.includes("Saving")
                          ? "text-amber-600"
                          : "text-emerald-600"
                    }`}
                  >
                    {draftSaveStatus}
                  </p>
                )}

                {draftSavedAt && (
                  <p className="text-xs font-bold text-sibs-tertiary-5">
                    Last saved: {new Date(draftSavedAt).toLocaleString("en-PH")}
                  </p>
                )}
              </div>
            )}

            {savedSubmission && (
              <p className="mt-2 text-xs font-bold text-sibs-tertiary-5">
                Submitted by {savedSubmission.submittedBy || "Candidate"} ·{" "}
                {savedSubmission.submittedAt ||
                  savedSubmission.submitted_at ||
                  savedSubmission.updatedAt ||
                  savedSubmission.updated_at ||
                  "—"}
              </p>
            )}
          </section>

          {isSubmittedView && (
            <ScoreSummaryCard
              jobEvaluationScore={jobEvaluationScore}
              finalInterviewRatingScore={finalInterviewRatingScore}
              passingScore={passingScore}
            />
          )}

          <form
            onSubmit={handleSubmit}
            className="rounded-2xl border border-[#E6ECF2] bg-white p-8 shadow-sm"
          >
            <section>
              <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_340px]">
                <div className="min-w-0">
                  <div>
                    <h2 className="text-base font-extrabold text-[#101828]">
                      Default Job Evaluation Contents
                    </h2>
                    <p className="mt-1 text-sm font-semibold text-sibs-tertiary-5">
                      These default fields follow the standard job evaluation
                      scoring computation.
                    </p>
                  </div>

                  <div className="mt-6 grid grid-cols-1 gap-5">
                    <div className="grid min-w-0 grid-cols-1 gap-5 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_minmax(0,1fr)]">
                      <JobEvaluationSelect
                        label="Education"
                        fieldKey={JOB_EVALUATION_FIELDS.education}
                        options={educationOptions}
                        value={answers[JOB_EVALUATION_FIELDS.education]}
                        onChange={handleJobEvaluationChange}
                        readOnly={isSubmittedView}
                      />

                      <JobEvaluationSelect
                        label="Experience"
                        fieldKey={JOB_EVALUATION_FIELDS.experience}
                        options={experienceOptions}
                        value={answers[JOB_EVALUATION_FIELDS.experience]}
                        onChange={handleJobEvaluationChange}
                        readOnly={isSubmittedView}
                      />

                      <JobEvaluationSelect
                        label="Location"
                        fieldKey={JOB_EVALUATION_FIELDS.location}
                        options={locationOptions}
                        value={answers[JOB_EVALUATION_FIELDS.location]}
                        onChange={handleJobEvaluationChange}
                        readOnly={isSubmittedView}
                      />
                    </div>

                    <JobEvaluationCheckboxGroup
                      title="Duties and Responsibilities"
                      fieldKey={JOB_EVALUATION_FIELDS.duties}
                      options={dutiesOptions}
                      values={answers[JOB_EVALUATION_FIELDS.duties]}
                      onToggle={handleJobEvaluationToggle}
                      readOnly={isSubmittedView}
                    />

                    <JobEvaluationCheckboxGroup
                      title="Competencies"
                      fieldKey={JOB_EVALUATION_FIELDS.competencies}
                      options={competenciesOptions}
                      values={answers[JOB_EVALUATION_FIELDS.competencies]}
                      onToggle={handleJobEvaluationToggle}
                      readOnly={isSubmittedView}
                    />

                    <JobEvaluationSelectedAnswers answers={answers} />
                  </div>
                </div>

                <JobEvaluationScorePanel
                  answers={answers}
                  jobEvaluationScore={jobEvaluationScore}
                  passingScore={passingScore}
                />
              </div>
            </section>

            <section className="mt-10 border-t border-[#E6ECF2] pt-8">
              <div>
                <h2 className="text-base font-extrabold text-[#101828]">
                  Final Interview Form
                </h2>
                <p className="mt-1 text-sm font-semibold text-sibs-tertiary-5">
                  Additional role-based questions configured from Recruitment
                  Settings.
                </p>
              </div>

              {groupedFields.length > 0 ? (
                <div className="mt-6 space-y-8">
                  {groupedFields.map((group) => (
                    <section key={group.section}>
                      <h3 className="text-sm font-extrabold uppercase tracking-wide text-[#101828]">
                        {group.section}:
                      </h3>

                      <div className="mt-6 space-y-6">
                        {group.questions.map((field) => (
                          <div key={field.id}>
                            <label className="block text-base font-medium leading-8 text-sibs-primary-1">
                              {field.label}
                              {field.required && (
                                <span className="text-red-500"> *</span>
                              )}
                            </label>

                            <FieldInput
                              field={field}
                              value={answers[field.id]}
                              readOnly={isSubmittedView}
                              onChange={(value) =>
                                handleAnswerChange(field.id, value)
                              }
                            />
                          </div>
                        ))}
                      </div>
                    </section>
                  ))}
                </div>
              ) : (
                <div className="mt-6 rounded-xl border border-dashed border-[#D6DEE8] bg-white px-4 py-10 text-center">
                  <p className="text-sm font-extrabold text-sibs-tertiary-5">
                    {isSubmittedView
                      ? "No saved final interview questions found."
                      : currentCandidate
                        ? `No final interview questions configured for ${
                            getCandidatePositionName(currentCandidate) ||
                            "this position"
                          }.`
                        : "No matching candidate or final interview questions found."}
                  </p>
                </div>
              )}
            </section>

            {!isSubmittedView && (
              <div className="mt-8 flex justify-end">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="inline-flex h-11 items-center justify-center rounded-xl bg-sibs-primary-1 px-6 text-sm font-extrabold text-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0 disabled:hover:shadow-sm"
                >
                  {isSubmitting ? "Submitting..." : "Submit Job Evaluation Form"}
                </button>
              </div>
            )}
          </form>
        </div>
      </div>

      <StatusModal
        open={statusModal.open}
        type={statusModal.type}
        title={statusModal.title}
        message={statusModal.message}
        onClose={closeStatusModal}
        variant="center"
        lockScroll
      />
    </>
  );
}