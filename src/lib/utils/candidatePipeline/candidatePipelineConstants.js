/* ================================
   LEGACY STORAGE KEYS
   Kept only so old imports will not break.
   New Candidate Pipeline must NOT use localStorage.
================================ */
export const CANDIDATE_APPLICATIONS_STORAGE_KEY = "ta_candidate_applications";
export const PIPELINE_CANDIDATES_STORAGE_KEY = "ta_pipeline_candidates";
export const OFFER_ELIGIBLE_STORAGE_KEY = "ta_offer_eligible_candidates";
export const OFFER_RECORDS_STORAGE_KEY = "ta_offer_records";
export const INTERNAL_CANDIDATES_STORAGE_KEY = "ta_internal_candidates";
export const PUBLIC_SUBMISSIONS_KEY = "ta_public_candidate_submissions";
export const PIPELINE_SYNC_EVENTS_KEY = "ta_pipeline_sync_events";

/* ================================
   PIPELINE STAGES
================================ */
export const pipelineStages = [
  "Initial Screening",
  "Online Assessment",
  "Assessment Fit",
  "Interview Scheduled",
  "Interviewed",
  "Offered",
  "Accepted",
  "For NHO",
];

export const normalStageFlow = [
  "Initial Screening",
  "Online Assessment",
  "Assessment Fit",
  "Interview Scheduled",
  "Interviewed",
  "Offered",
  "Accepted",
];

export function canScheduleInterviewFromStage(
  currentStage = "",
  candidate = {},
) {
  return (
    String(currentStage || "").trim() === "Assessment Fit" &&
    candidate?.assessmentStatus === "Taken" &&
    candidate?.assessmentResult === "Assessment Fit"
  );
}

/* ================================
   FILTER DEFAULTS
   Role/account options must come from database records
   through CandidatePipelineContext.jsx.
================================ */
export const roleOptions = ["All Roles"];

export const accountOptions = ["All Accounts"];

/* ================================
   HIRING REQUIREMENTS
   Must be loaded from database.
   Keep this empty to remove static PRF data.
================================ */
export const hiringRequirementOptions = [];

/* ================================
   INTERVIEW
================================ */
export const interviewTypeOptions = ["Online", "Face-to-face"];

/* ================================
   OFFER
================================ */
export const offerApprovers = ["Raul Nadela", "Haasanor"];

export const offerApprovalStatusOptions = [
  "For Review",
  "Approved",
  "Rejected",
];

export const offerDecisionOptions = ["Negotiate", "Rejected", "Accepted"];

/* ================================
   PRF / ASSESSMENT
================================ */
export const prfStatusOptions = ["Unmatched", "Matched"];

export const assessmentStatusOptions = ["Not Take", "Taken"];

export const assessmentResultOptions = ["Assessment Fit", "Assessment Not Fit"];

/* ================================
   DROP-OFF
================================ */
export const dropOffCategoryOptions = [
  "No Show",
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

/* ================================
   SAMPLE DATA REMOVED
   This must stay empty.
   Candidate Pipeline cards must come from:
   GET /api/candidate-pipeline
================================ */
export const defaultPipelineCandidates = [];