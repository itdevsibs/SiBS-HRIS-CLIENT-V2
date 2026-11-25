export const RESUME_STATUS_META = {
  queued: {
    label: "Queued",
    tone: "bg-slate-100 text-slate-700 border-slate-200",
    description: "Resume intelligence processing is queued in the background.",
  },
  extracting: {
    label: "Extracting Resume",
    tone: "bg-blue-50 text-blue-700 border-blue-200",
    description: "Reading and extracting structured segments from the uploaded resume.",
  },
  analyzing: {
    label: "Analyzing Profile & JD",
    tone: "bg-indigo-50 text-indigo-700 border-indigo-200",
    description: "Matching resume claims against the Approved Job Description.",
  },
  generating: {
    label: "Generating Questions",
    tone: "bg-purple-50 text-purple-700 border-purple-200",
    description: "Generating evidence-backed interview questions via Hermes AI.",
  },
  pending_review: {
    label: "Pending HR Review",
    tone: "bg-amber-50 text-amber-800 border-amber-200",
    description: "AI interview questions are ready and awaiting HR review and approval.",
  },
  ready: {
    label: "Approved & Ready",
    tone: "bg-emerald-50 text-emerald-700 border-emerald-200",
    description: "Approved AI interview questions are active in the Final Interview Form.",
  },
  needs_review: {
    label: "Needs HR Review",
    tone: "bg-orange-50 text-orange-800 border-orange-200",
    description: "Manual review required (e.g. non-text attachment or unapproved JD).",
  },
  failed: {
    label: "Processing Failed",
    tone: "bg-rose-50 text-rose-700 border-rose-200",
    description: "Background processing encountered an error. You can retry anytime.",
  },
  no_resume_available: {
    label: "No Resume Available",
    tone: "bg-slate-100 text-slate-600 border-slate-200",
    description: "No usable resume document was uploaded for this application.",
  },
};

export const QUESTION_CATEGORY_LABELS = {
  experience_verification: {
    label: "Experience Verification",
    badgeClass: "bg-blue-50 text-blue-700 border-blue-200",
  },
  role_specific_skill: {
    label: "Role-Specific Technical / Operational",
    badgeClass: "bg-indigo-50 text-indigo-700 border-indigo-200",
  },
  situational_behavioral: {
    label: "Situational / Behavioral",
    badgeClass: "bg-emerald-50 text-emerald-700 border-emerald-200",
  },
  clarification: {
    label: "Clarification & Verification",
    badgeClass: "bg-amber-50 text-amber-800 border-amber-200",
  },
};

export const QUESTION_REVIEW_BADGES = {
  approved: {
    label: "Approved",
    badgeClass: "bg-emerald-50 text-emerald-700 border-emerald-200",
  },
  pending_review: {
    label: "Pending Review",
    badgeClass: "bg-amber-50 text-amber-800 border-amber-200",
  },
  rejected: {
    label: "Rejected",
    badgeClass: "bg-rose-50 text-rose-700 border-rose-200",
  },
};

export function getResumeIntelligenceStatusMeta(status) {
  const key = String(status || "no_resume_available")
    .trim()
    .toLowerCase();
  return RESUME_STATUS_META[key] || RESUME_STATUS_META.no_resume_available;
}

export function getQuestionCategoryMeta(category) {
  const key = String(category || "")
    .trim()
    .toLowerCase();
  return (
    QUESTION_CATEGORY_LABELS[key] || {
      label: category || "General Question",
      badgeClass: "bg-slate-100 text-slate-700 border-slate-200",
    }
  );
}

export function getQuestionReviewMeta(reviewStatus) {
  const key = String(reviewStatus || "pending_review")
    .trim()
    .toLowerCase();
  return QUESTION_REVIEW_BADGES[key] || QUESTION_REVIEW_BADGES.pending_review;
}

export function formatResumeFileSize(bytes) {
  const size = Number(bytes || 0);
  if (!Number.isFinite(size) || size <= 0) return "0 B";
  if (size < 1024) return `${size} B`;
  if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`;
  return `${(size / (1024 * 1024)).toFixed(2)} MB`;
}

export function resolveCandidateApplicationIdentifier(candidate = {}) {
  return (
    candidate?.sourceTalentPoolId ||
    candidate?.source_talent_pool_id ||
    candidate?.candidateApplicationId ||
    candidate?.candidate_application_id ||
    candidate?.applicationId ||
    candidate?.application_id ||
    candidate?.candidateId ||
    candidate?.candidate_id ||
    candidate?.id ||
    ""
  );
}
