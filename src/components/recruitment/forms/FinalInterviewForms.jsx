import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useCandidatePipeline } from "../../../services/context/CandidatePipelineContext";

const RECRUITMENT_SETTINGS_STORAGE_KEY = "sibs_recruitment_settings_temp";

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
    form?.passingRate ??
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
  const jobEvaluationPassed =
    jobEvaluationScore.percentageScore >= passingScore;

  const finalInterviewHasScore =
    finalInterviewRatingScore.answeredRatingFields > 0;

  const finalInterviewPassed =
    finalInterviewHasScore &&
    finalInterviewRatingScore.percentageScore >= passingScore;

  const overallPassed = jobEvaluationPassed && finalInterviewPassed;
  const overallStatusLabel = overallPassed ? "Passed" : "Needs Review";

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
            {
              label: "Education",
              value: jobEvaluationScore.educationScore,
            },
            {
              label: "Experience",
              value: jobEvaluationScore.experienceScore,
            },
            {
              label: "Location",
              value: jobEvaluationScore.locationScore,
            },
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
            {
              label: "Job Evaluation",
              value: "Default JE criteria",
            },
            {
              label: "Final Interview",
              value: "Rating questions only",
            },
            {
              label: "Passing Rule",
              value: `${passingScore}% minimum`,
            },
          ]}
        />
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
        <option value="1">1</option>
        <option value="2">2</option>
        <option value="3">3</option>
        <option value="4">4</option>
        <option value="5">5</option>
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

export default function FinalInterviewForms() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const { candidateList, handleSubmitFinalInterview } = useCandidatePipeline();

  const candidateId = searchParams.get("candidateId") || "—";
  const candidateApplicationId =
    searchParams.get("candidateApplicationId") || "—";
  const positionId = searchParams.get("positionId");
  const formId = searchParams.get("formId");
  const submissionId = searchParams.get("submissionId");
  const mode = searchParams.get("mode");

  const isViewMode = mode === "view";

  const [answers, setAnswers] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const currentCandidate = useMemo(() => {
    return candidateList.find((candidate) => {
      return (
        String(candidate.candidateId || "") === String(candidateId || "") ||
        String(candidate.candidateApplicationId || "") ===
          String(candidateApplicationId || "") ||
        String(candidate.applicationId || "") ===
          String(candidateApplicationId || "") ||
        String(candidate.id || "") === String(candidateApplicationId || "")
      );
    });
  }, [candidateList, candidateId, candidateApplicationId]);

  const savedSubmission = useMemo(() => {
    if (!isViewMode || !submissionId || !currentCandidate) return null;

    return (currentCandidate.finalInterviewSubmittedForms || []).find(
      (item) => String(item.id) === String(submissionId),
    );
  }, [isViewMode, submissionId, currentCandidate]);

  const settings = useMemo(() => safeReadSettings(), []);

  const activeForm = useMemo(() => {
    if (savedSubmission) {
      return {
        id: savedSubmission.formId,
        name: savedSubmission.formName,
        passingScore: savedSubmission.passingScore,
        fields: savedSubmission.fieldsSnapshot || [],
      };
    }

    if (!settings?.forms?.length) return null;

    const forms = settings.forms;

    const formById = forms.find((form) => String(form.id) === String(formId));

    if (formById) return formById;

    const formByPositionId = forms.find(
      (form) => String(form.positionId) === String(positionId),
    );

    if (formByPositionId) return formByPositionId;

    const activeFormWithFields = forms.find(
      (form) =>
        form.status === "Active" &&
        Array.isArray(form.fields) &&
        form.fields.length > 0,
    );

    if (activeFormWithFields) return activeFormWithFields;

    const anyFormWithFields = forms.find(
      (form) => Array.isArray(form.fields) && form.fields.length > 0,
    );

    if (anyFormWithFields) return anyFormWithFields;

    return forms[0];
  }, [settings, formId, positionId, savedSubmission]);

  const jobEvaluationFormName = useMemo(() => {
    return getJobEvaluationTitle(activeForm?.name);
  }, [activeForm?.name]);

  const groupedFields = useMemo(() => {
    return groupFieldsBySection(activeForm?.fields || []);
  }, [activeForm]);

  const passingScore = useMemo(() => {
    return getPassingScore(activeForm);
  }, [activeForm]);

  const jobEvaluationScore = useMemo(() => {
    return calculateJobEvaluationScore(answers);
  }, [answers]);

  const finalInterviewRatingScore = useMemo(() => {
    return calculateRatingScore(activeForm?.fields || [], answers);
  }, [activeForm, answers]);

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
    if (savedSubmission?.answers) {
      setAnswers(savedSubmission.answers);
    }
  }, [savedSubmission]);

  function handleAnswerChange(fieldId, value) {
    if (isViewMode) return;

    setAnswers((prev) => ({
      ...prev,
      [fieldId]: value,
    }));
  }

  function handleJobEvaluationChange(fieldId, value) {
    if (isViewMode) return;

    setAnswers((prev) => ({
      ...prev,
      [fieldId]: value,
    }));
  }

  function handleJobEvaluationToggle(fieldId, optionLabel) {
    if (isViewMode) return;

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
      alert(`Please answer required question: ${missingField.label}`);
      return false;
    }

    return true;
  }

  function handleSubmit(e) {
    e.preventDefault();

    if (isViewMode) {
      navigate(-1);
      return;
    }

    if (isSubmitting) return;

    if (!validateRequiredFields()) return;

    setIsSubmitting(true);

    const didUpdateCandidate = handleSubmitFinalInterview({
      candidateId,
      candidateApplicationId,
      positionId,
      formId: formId || activeForm?.id || "",
      formName: jobEvaluationFormName || "Job Evaluation Form",
      passingScore,
      answers,
      fieldsSnapshot: activeForm?.fields || [],
      scoreSummary,
    });

    console.log("Job Evaluation Answers:", {
      candidateId,
      candidateApplicationId,
      positionId,
      formId: formId || activeForm?.id || "",
      formName: jobEvaluationFormName || "Job Evaluation Form",
      passingScore,
      answers,
      scoreSummary,
      didUpdateCandidate,
    });

    if (!didUpdateCandidate) {
      alert(
        "Job evaluation form submitted, but the candidate record was not found in the pipeline.",
      );
      setIsSubmitting(false);
      return;
    }

    alert("Job evaluation form submitted. Candidate moved to Interviewed.");

    navigate(-1);
  }

  return (
    <div className="min-h-screen bg-[#E9EEF5] px-4 py-8 font-jakarta text-sibs-primary-1">
      <div className="mx-auto max-w-[1180px] space-y-5">
        <section className="rounded-2xl border border-[#E6ECF2] bg-white p-6 shadow-sm">
          <div className="inline-flex rounded-full border border-blue-100 bg-blue-50 px-3 py-1 text-xs font-extrabold uppercase tracking-wide text-sibs-primary-1">
            {isViewMode ? "Submitted Job Evaluation" : "Job Evaluation"}
          </div>

          <h1 className="mt-4 text-2xl font-extrabold text-sibs-primary-1">
            {jobEvaluationFormName || "Job Evaluation Form"}
          </h1>

          <p className="mt-2 text-sm font-semibold text-sibs-primary-1">
            Candidate ID: {candidateId} · Application ID:{" "}
            {candidateApplicationId}
          </p>

          {savedSubmission && (
            <p className="mt-2 text-xs font-bold text-sibs-tertiary-5">
              Submitted by {savedSubmission.submittedBy} ·{" "}
              {savedSubmission.submittedAt}
            </p>
          )}
        </section>

        {isViewMode && (
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
            <div>
              <h2 className="text-base font-extrabold text-[#101828]">
                Default Job Evaluation Contents
              </h2>
              <p className="mt-1 text-sm font-semibold text-sibs-tertiary-5">
                These default fields follow the standard job evaluation scoring
                computation.
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
                  readOnly={isViewMode}
                />

                <JobEvaluationSelect
                  label="Experience"
                  fieldKey={JOB_EVALUATION_FIELDS.experience}
                  options={experienceOptions}
                  value={answers[JOB_EVALUATION_FIELDS.experience]}
                  onChange={handleJobEvaluationChange}
                  readOnly={isViewMode}
                />

                <JobEvaluationSelect
                  label="Location"
                  fieldKey={JOB_EVALUATION_FIELDS.location}
                  options={locationOptions}
                  value={answers[JOB_EVALUATION_FIELDS.location]}
                  onChange={handleJobEvaluationChange}
                  readOnly={isViewMode}
                />
              </div>

              <JobEvaluationCheckboxGroup
                title="Duties and Responsibilities"
                fieldKey={JOB_EVALUATION_FIELDS.duties}
                options={dutiesOptions}
                values={answers[JOB_EVALUATION_FIELDS.duties]}
                onToggle={handleJobEvaluationToggle}
                readOnly={isViewMode}
              />

              <JobEvaluationCheckboxGroup
                title="Competencies"
                fieldKey={JOB_EVALUATION_FIELDS.competencies}
                options={competenciesOptions}
                values={answers[JOB_EVALUATION_FIELDS.competencies]}
                onToggle={handleJobEvaluationToggle}
                readOnly={isViewMode}
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
                            readOnly={isViewMode}
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
                  {isViewMode
                    ? "No saved final interview questions found."
                    : "No final interview questions available."}
                </p>
              </div>
            )}
          </section>

          <div className="mt-8 flex justify-end">
            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex h-11 items-center justify-center rounded-xl bg-sibs-primary-1 px-6 text-sm font-extrabold text-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0 disabled:hover:shadow-sm"
            >
              {isViewMode
                ? "Back"
                : isSubmitting
                  ? "Submitting..."
                  : "Submit Job Evaluation Form"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
