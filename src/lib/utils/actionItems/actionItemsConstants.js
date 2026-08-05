export const ACTION_ITEMS_STORAGE_KEY = "ta_action_items";
export const PUBLIC_SUBMISSIONS_KEY = "ta_public_candidate_submissions";
export const INTERNAL_CANDIDATES_KEY = "ta_internal_candidates";
export const CANDIDATE_APPLICATIONS_KEY = "ta_candidate_applications";
export const PIPELINE_CANDIDATES_KEY = "ta_pipeline_candidates";
export const OFFER_RECORDS_KEY = "ta_offer_records";
export const ONBOARDING_RECORDS_KEY = "ta_onboarding_records";
export const HIRING_NEEDS_KEY = "ta_hiring_needs";
export const WORKFORCE_HIRING_PLAN_KEY = "ta_workforce_hiring_plan";
export const WEEKLY_HIRING_ACTION_ITEMS_KEY = "ta_weekly_hiring_action_items";

export const ACTION_ITEMS_PER_PAGE = 8;

export const STATUS_OPTIONS = [
  "All Status",
  "Planned",
  "Ongoing",
  "Completed",
];

export const RISK_OPTIONS = ["All Risk", "High", "Medium", "Low"];

export const MODULE_OPTIONS = [
  "All Modules",
  "Public Talent Pool",
  "Talent Pool",
  "Hiring Needs",
  "Job Description",
  "Candidate Pipeline",
  "Offers",
  "Onboarding",
  "Workforce Hiring Plan",
  "Reports",
];

export const GAP_OPTIONS = [
  "All Gaps",
  "Pipeline",
  "Screening",
  "Interview",
  "Offer",
  "JD",
  "Approval",
  "Capacity / Manpower",
  "Onboarding",
  "Reporting",
];

// Static special options only. Real TA owners are merged from live contexts.
export const OWNER_OPTIONS = [
  "All Owners",
  "Current User",
  "System Suggested",
];

export const EMPTY_ACTION_FORM = {
  weeklyPlanItemId: "",
  hiringNeedId: "",
  sourceModule: "Workforce Hiring Plan",
  sourceRecordId: "",
  currentStatusRowId: "",
  roleAccountKey: "",
  cluster: "",
  reportingWeek: "",
  roleAccount: "",
  roleTitle: "",
  account: "",
  requirement: 0,
  filled: 0,
  actionItem: "",
  owner: "",
  deadline: "",
  status: "Planned",
  riskLevel: "Medium",
  linkedGap: "Pipeline",
  remarks: "",
  atRiskReason: "",
  latestStatusNote: "",
};

export const ACTION_ITEM_SOURCE_ROUTES = {
  "Public Talent Pool": "/recruitment/talent-pool/apply",
  "Talent Pool": "/recruitment/talent-pool",
  "Hiring Needs": "/recruitment/hiring-needs",
  "Job Description": "/recruitment/job-description",
  "Candidate Pipeline": "/recruitment/candidate-pipeline",
  Offers: "/recruitment/offers",
  Onboarding: "/recruitment/onboarding",
  "Workforce Hiring Plan": "/recruitment/workforce-hiring-plan",
  Reports: "/recruitment/weekly-reports",
};

export const ACTION_ITEMS_REFRESH_EVENTS = [
  "storage",
  "focus",
  "ta-public-submission-created",
  "ta-pipeline-sync-updated",
  "ta-pipeline-candidates-updated",
  "ta-offers-updated",
  "ta-onboarding-updated",
  "ta-hiring-needs-updated",
  "ta-workforce-hiring-plan-updated",
  "ta-weekly-hiring-action-items-updated",
];
