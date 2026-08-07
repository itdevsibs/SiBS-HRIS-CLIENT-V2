import { OUTCOME, RESPONSE_SOURCE, SURVEY_STATUS } from "./constants.js";

export function cleanText(value) {
  return String(value ?? "").trim();
}

export function normalizeSurveyStatus(value) {
  const key = cleanText(value).toLowerCase().replace(/[\s-]+/g, "_");
  if (["not_sent", "notsent", "not_sent_yet"].includes(key)) return SURVEY_STATUS.NOT_SENT;
  if (["pending", "queued"].includes(key)) return SURVEY_STATUS.PENDING;
  if (["sent", "delivered"].includes(key)) return SURVEY_STATUS.SENT;
  if (["opened", "viewed"].includes(key)) return SURVEY_STATUS.OPENED;
  if (["submitted", "completed", "responded"].includes(key)) return SURVEY_STATUS.SUBMITTED;
  if (["expired", "closed"].includes(key)) return SURVEY_STATUS.EXPIRED;
  return SURVEY_STATUS.NOT_SENT;
}

export function normalizeOutcome(value, record = {}) {
  const key = cleanText(value || record.finalStatus || record.status || record.final_outcome).toLowerCase();
  if (key.includes("drop")) return OUTCOME.DROP_OFF;
  if (["completed", "hired", "active", "show", "true hire"].some((item) => key.includes(item))) {
    return OUTCOME.COMPLETED;
  }
  const stage = cleanText(record.currentStage || record.current_stage || record.finalStage || record.final_stage).toLowerCase();
  return stage.includes("drop") ? OUTCOME.DROP_OFF : OUTCOME.COMPLETED;
}

export function normalizeResponseSource(value, record = {}) {
  const key = cleanText(value).toLowerCase().replace(/[\s-]+/g, "_");
  if (["candidate_survey", "survey", "candidate", "public_survey"].includes(key)) {
    return RESPONSE_SOURCE.CANDIDATE_SURVEY;
  }
  if (["ta_manual", "manual", "manual_entry", "ta"].includes(key)) {
    return RESPONSE_SOURCE.TA_MANUAL;
  }
  const hasLegacyResponse = Number(record.experienceRating || record.rating || 0) > 0 || cleanText(record.feedback || record.qualitativeFeedback);
  return hasLegacyResponse ? RESPONSE_SOURCE.TA_MANUAL : null;
}

export function normalizeTimeline(value) {
  const input = Array.isArray(value) ? value : [];
  return input.map((item, index) => ({
    id: cleanText(item?.id) || `timeline-${index}`,
    stage: cleanText(item?.stage || item?.name || item?.label) || "Unknown Stage",
    status: cleanText(item?.status || item?.result) || "Completed",
    date: item?.date || item?.timestamp || item?.createdAt || item?.created_at || "",
  }));
}

export function normalizeCandidateExperienceRecord(record = {}) {
  const id = cleanText(record.id || record.experienceId || record.experience_id) || `EXP-${Date.now()}`;
  const outcome = normalizeOutcome(record.outcome, record);
  const rating = Number(record.experienceRating ?? record.rating ?? 0);
  const responseSource = normalizeResponseSource(record.responseSource || record.response_source, record);
  const rawSurveyStatus = record.surveyStatus || record.survey_status;
  const surveyStatus = rawSurveyStatus
    ? normalizeSurveyStatus(rawSurveyStatus)
    : responseSource === RESPONSE_SOURCE.CANDIDATE_SURVEY
      ? SURVEY_STATUS.SUBMITTED
      : SURVEY_STATUS.NOT_SENT;

  const finalStage = cleanText(
    record.finalStage ||
      record.final_stage ||
      record.dropOffStage ||
      record.drop_off_stage ||
      record.currentStage ||
      record.current_stage ||
      record.exitStage ||
      record.exit_stage,
  );

  const feedbackCategory = cleanText(
    record.feedbackCategory ||
      record.feedback_category ||
      record.dropOffCategory ||
      record.drop_off_category ||
      record.reasonCategory ||
      record.reason_category,
  );

  const feedback = cleanText(
    record.feedback ||
      record.qualitativeFeedback ||
      record.qualitative_feedback ||
      record.candidateFeedback ||
      record.candidate_feedback,
  );

  return {
    ...record,
    id,
    experienceId: id,
    candidatePipelineId: cleanText(record.candidatePipelineId || record.candidate_pipeline_id || record.pipelineId || record.pipeline_id),
    candidateId: cleanText(record.candidateId || record.candidate_id || record.candidateCode || record.candidate_code),
    applicationId: cleanText(record.applicationId || record.application_id || record.candidateApplicationId || record.candidate_application_id),
    candidateName: cleanText(record.candidateName || record.candidate_name || record.name),
    candidateEmail: cleanText(record.candidateEmail || record.candidate_email || record.email),
    roleTitle: cleanText(record.roleTitle || record.role_title || record.role || record.openPosition || record.open_position),
    account: cleanText(record.account || record.finalAccount || record.final_account),
    source: cleanText(record.source || record.candidateSource || record.candidate_source) || "Recruitment",
    owner: cleanText(record.owner || record.taOwner || record.ta_owner || record.recruiter) || "Unassigned",
    outcome,
    eventType: cleanText(record.eventType || record.event_type) || (outcome === OUTCOME.DROP_OFF ? "Pipeline Drop-off" : "Process Completed"),
    finalStage: finalStage || (outcome === OUTCOME.DROP_OFF ? "Drop-off" : "Completed"),
    finalStatus: outcome,
    dropOffStage: outcome === OUTCOME.DROP_OFF ? finalStage : null,
    dropOffCategory: outcome === OUTCOME.DROP_OFF ? feedbackCategory : null,
    dropOffReason: outcome === OUTCOME.DROP_OFF
      ? cleanText(record.dropOffReason || record.drop_off_reason || record.reasonDescription || record.reason_description || record.reason)
      : null,
    stageTimeline: normalizeTimeline(record.stageTimeline || record.stage_timeline || record.stagesPassed || record.stages_passed),
    surveyStatus,
    responseSource,
    surveySentAt: record.surveySentAt || record.survey_sent_at || null,
    surveyOpenedAt: record.surveyOpenedAt || record.survey_opened_at || null,
    surveySubmittedAt: record.surveySubmittedAt || record.survey_submitted_at || record.submittedAt || record.submitted_at || null,
    surveyExpiresAt: record.surveyExpiresAt || record.survey_expires_at || null,
    experienceRating: Number.isFinite(rating) && rating >= 1 && rating <= 5 ? rating : 0,
    feedbackCategory,
    feedback,
    feedbackTag: cleanText(record.feedbackTag || record.feedback_tag) || feedbackCategory,
    internalNote: cleanText(record.internalNote || record.internal_note || record.recordingNote || record.recording_note),
    recordedBy: cleanText(record.recordedBy || record.recorded_by || record.owner || record.taOwner || record.ta_owner),
    dateRecorded: record.dateRecorded || record.date_recorded || record.createdAt || record.created_at || "",
    createdAt: record.createdAt || record.created_at || record.dateRecorded || record.date_recorded || "",
    updatedAt: record.updatedAt || record.updated_at || "",
  };
}

export function getResponseSourceLabel(value) {
  if (value === RESPONSE_SOURCE.CANDIDATE_SURVEY) return "Candidate Survey";
  if (value === RESPONSE_SOURCE.TA_MANUAL) return "TA Manual Entry";
  return "Awaiting Response";
}

export function getSurveyStatusLabel(value) {
  const status = normalizeSurveyStatus(value);
  return {
    [SURVEY_STATUS.NOT_SENT]: "Not Sent",
    [SURVEY_STATUS.PENDING]: "Pending",
    [SURVEY_STATUS.SENT]: "Sent",
    [SURVEY_STATUS.OPENED]: "Opened",
    [SURVEY_STATUS.SUBMITTED]: "Submitted",
    [SURVEY_STATUS.EXPIRED]: "Expired",
  }[status];
}
