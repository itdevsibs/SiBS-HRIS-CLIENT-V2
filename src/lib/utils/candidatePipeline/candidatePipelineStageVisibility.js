const PIPELINE_STAGE_RANKS = Object.freeze({
  "Talent Pool": -1,
  "Initial Screening": 0,
  "Online Assessment": 1,
  "Interview Scheduled": 2,
  Interviewed: 3,
  Offered: 4,
  Accepted: 5,
  "For NHO": 6,
  "For Onboarding - Incomplete Requirements": 7,
  Onboarding: 8,
  "Hired / Active": 9,
  "Drop-off": 99,
});

function cleanText(value) {
  return String(value ?? "").trim();
}

function normalizeStageKey(value) {
  return cleanText(value)
    .toLowerCase()
    .replace(/[_/()-]+/g, " ")
    .replace(/[^a-z0-9\s]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function getTimelineText(item = {}) {
  return [
    item.stage,
    item.title,
    item.pipelineStage,
    item.pipeline_stage,
    item.currentStage,
    item.current_stage,
    item.status,
    item.reason,
    item.remarks,
    item.source,
    item.event,
    item.action,
    item.extra?.stage,
    item.extra?.title,
    item.extra?.reason,
    item.extra?.remarks,
  ]
    .filter(Boolean)
    .join(" ");
}

function parseTimeline(value) {
  if (Array.isArray(value)) {
    return value.filter(Boolean);
  }

  if (!value) return [];

  if (typeof value === "string") {
    try {
      const parsed = JSON.parse(value);

      return Array.isArray(parsed)
        ? parsed.filter(Boolean)
        : [];
    } catch {
      return [];
    }
  }

  return [];
}

export function normalizePipelineStageForVisibility(value) {
  const key = normalizeStageKey(value);

  if (!key) return "";

  if (
    key.includes("drop off") ||
    key.includes("dropoff")
  ) {
    return "Drop-off";
  }

  if (
    key.includes("hired active") ||
    key === "hired" ||
    key === "active"
  ) {
    return "Hired / Active";
  }

  if (
    key.includes("incomplete requirement") ||
    key.includes("requirements incomplete")
  ) {
    return "For Onboarding - Incomplete Requirements";
  }

  if (key.includes("onboarding")) {
    return "Onboarding";
  }

  /*
   * Accepted (For NHO) is still the Accepted stage.
   * Check Accepted before the broader NHO match.
   */
  if (key.includes("accepted")) {
    return "Accepted";
  }

  if (
    key === "for nho" ||
    key.includes("nho schedule") ||
    key.includes("new hire orientation") ||
    key.includes(" nho ")
  ) {
    return "For NHO";
  }

  if (
    key.includes("offer") ||
    key.includes("approval")
  ) {
    return "Offered";
  }

  if (
    key === "interviewed" ||
    key.includes("final interview") ||
    key.includes("job evaluation") ||
    key.includes("interview completed") ||
    key.includes("completed interview")
  ) {
    return "Interviewed";
  }

  if (
    key.includes("interview scheduled") ||
    key.includes("schedule interview") ||
    key.includes("interview schedule") ||
    key.includes("interview in progress") ||
    key === "interview"
  ) {
    return "Interview Scheduled";
  }

  if (
    key.includes("online assessment") ||
    key.includes("assessment")
  ) {
    return "Online Assessment";
  }

  if (
    key.includes("initial screening") ||
    key.includes("prf")
  ) {
    return "Initial Screening";
  }

  if (key.includes("talent pool")) {
    return "Talent Pool";
  }

  return cleanText(value);
}

export function getPipelineStageVisibilityRank(value) {
  const normalized =
    normalizePipelineStageForVisibility(value);

  if (
    Object.prototype.hasOwnProperty.call(
      PIPELINE_STAGE_RANKS,
      normalized,
    )
  ) {
    return PIPELINE_STAGE_RANKS[normalized];
  }

  return null;
}

export function getTimelineEntryVisibilityRank(item = {}) {
  const directStage =
    item.stage ||
    item.title ||
    item.pipelineStage ||
    item.pipeline_stage ||
    item.currentStage ||
    item.current_stage ||
    item.status ||
    "";

  const directRank =
    getPipelineStageVisibilityRank(directStage);

  if (directRank !== null) {
    return directRank;
  }

  return getPipelineStageVisibilityRank(
    getTimelineText(item),
  );
}

export function getVisibleCandidateTimeline(
  timeline,
  currentStage,
) {
  const rows = parseTimeline(timeline);
  const currentRank =
    getPipelineStageVisibilityRank(currentStage);

  /*
   * Unknown custom stages keep their full timeline because filtering
   * without a known stage order could hide legitimate information.
   */
  if (currentRank === null) {
    return rows;
  }

  return rows.filter((item) => {
    const itemRank =
      getTimelineEntryVisibilityRank(item);

    /*
     * Generic records with no stage evidence are considered shared
     * candidate-history entries and remain visible.
     */
    if (itemRank === null) {
      return true;
    }

    return itemRank <= currentRank;
  });
}

export function isPipelineStageAtOrAfter(
  currentStage,
  targetStage,
) {
  const currentRank =
    getPipelineStageVisibilityRank(currentStage);

  const targetRank =
    getPipelineStageVisibilityRank(targetStage);

  if (
    currentRank === null ||
    targetRank === null
  ) {
    return false;
  }

  return currentRank >= targetRank;
}

export function isTimelineEntryForStage(
  item,
  targetStage,
) {
  const itemRank =
    getTimelineEntryVisibilityRank(item);

  const targetRank =
    getPipelineStageVisibilityRank(targetStage);

  return (
    itemRank !== null &&
    targetRank !== null &&
    itemRank === targetRank
  );
}

function hasDirectAssessmentPayload(item = {}) {
  const extra = item.extra || {};

  const values = [
    item.assessmentScore,
    item.assessment_score,
    item.assessmentResult,
    item.assessment_result,
    item.assessmentFileName,
    item.assessment_file_name,
    item.assessmentFileUrl,
    item.assessment_file_url,
    item.assessmentAttachmentName,
    item.assessment_attachment_name,
    item.assessmentAttachmentUrl,
    item.assessment_attachment_url,
    item.assessmentFiles,
    item.assessment_files,
    item.attachments,
    item.files,
    extra.assessmentScore,
    extra.assessment_score,
    extra.assessmentResult,
    extra.assessment_result,
    extra.assessmentFileName,
    extra.assessment_file_name,
    extra.assessmentFileUrl,
    extra.assessment_file_url,
    extra.assessmentAttachmentName,
    extra.assessment_attachment_name,
    extra.assessmentAttachmentUrl,
    extra.assessment_attachment_url,
    extra.assessmentFiles,
    extra.assessment_files,
    extra.attachments,
    extra.files,
  ];

  return values.some((value) => {
    if (Array.isArray(value)) {
      return value.length > 0;
    }

    return cleanText(value) !== "";
  });
}

export function shouldShowAssessmentArtifactsForTimelineEntry(
  item = {},
) {
  if (
    !isTimelineEntryForStage(
      item,
      "Online Assessment",
    )
  ) {
    return false;
  }

  if (hasDirectAssessmentPayload(item)) {
    return true;
  }

  const text = normalizeStageKey(
    getTimelineText(item),
  );

  return (
    text.includes("assessment saved") ||
    text.includes("assessment updated") ||
    text.includes("assessment completed") ||
    text.includes("assessment result") ||
    text.includes("assessment score") ||
    text.includes("assessment attachment") ||
    text.includes("assessment uploaded")
  );
}

function getTimelineTimestamp(item = {}) {
  const rawValue =
    item.timestamp ||
    item.createdAt ||
    item.created_at ||
    item.updatedAt ||
    item.updated_at ||
    item.date ||
    "";

  const timestamp = new Date(rawValue).getTime();

  return Number.isFinite(timestamp)
    ? timestamp
    : Number.NEGATIVE_INFINITY;
}

export function getVisibleMovementReason(
  visibleTimeline = [],
  fallback = "",
) {
  const withReason = parseTimeline(visibleTimeline)
    .map((item, index) => ({
      item,
      index,
      reason: cleanText(item.reason),
      timestamp: getTimelineTimestamp(item),
    }))
    .filter((entry) => entry.reason);

  if (!withReason.length) {
    return cleanText(fallback);
  }

  withReason.sort((left, right) => {
    if (left.timestamp !== right.timestamp) {
      return right.timestamp - left.timestamp;
    }

    return left.index - right.index;
  });

  return withReason[0].reason;
}
