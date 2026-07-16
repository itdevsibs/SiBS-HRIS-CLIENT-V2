export const WEEKLY_REPORTS_STORAGE_KEY = "ta_weekly_reports";
export const ACTION_ITEMS_STORAGE_KEY = "ta_action_items";
export const PUBLIC_SUBMISSIONS_KEY = "ta_public_candidate_submissions";
export const INTERNAL_CANDIDATES_KEY = "ta_internal_candidates";
export const CANDIDATE_APPLICATIONS_KEY = "ta_candidate_applications";
export const PIPELINE_CANDIDATES_KEY = "ta_pipeline_candidates";
export const OFFER_RECORDS_KEY = "ta_offer_records";
export const ONBOARDING_RECORDS_KEY = "ta_onboarding_records";
export const HIRING_NEEDS_KEY = "ta_hiring_needs";
export const WORKFORCE_HIRING_PLAN_KEY = "ta_workforce_hiring_plan";

export const REPORTS_PER_PAGE = 8;

export const WEEKLY_REPORT_STATUS_OPTIONS = [
  "All Status",
  "Generated",
  "Sent",
  "Archived",
];

export const WEEKLY_REPORT_REFRESH_EVENTS = [
  "storage",
  "focus",
  "ta-public-submission-created",
  "ta-pipeline-sync-updated",
  "ta-offers-updated",
  "ta-onboarding-updated",
];
