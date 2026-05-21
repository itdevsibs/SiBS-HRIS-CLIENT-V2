export const RECRUITMENT_SETTINGS_STORAGE_KEY =
  "sibs_recruitment_settings_temp";

export const AVAILABLE_POSITIONS_STORAGE_KEY = "sibs_available_positions_temp";

export const recruitmentTabs = [
  "Final Interview Form",
  "Pipeline Settings",
  "Assessment Settings",
  "Email Templates",
  "Approval Rules",
];

export const fieldTypes = [
  "Short Text",
  "Paragraph",
  "Dropdown",
  "Rating",
  "Date",
  "Number",
  "Checkbox",
];

export const pipelineStages = [
  "Initial Screening",
  "Online Assessment",
  "Interview Scheduled",
  "Interviewed",
  "Offered",
  "Accepted",
  "Drop-off",
];

export const defaultAvailablePositions = [
  {
    id: "POS-001",
    code: "POS-001",
    position: "Customer Service Representative",
    department: "Operations",
    location: "Davao Site",
    skills: "English, Customer Service, Chat Support, Voice Support",
    status: "Active",
    visibility: "Shown in Public Form / Talent Pool",
    updatedAt: "May 1, 2026",
    updatedBy: "Alena Batacan",
  },
  {
    id: "POS-002",
    code: "POS-002",
    position: "QA Specialist",
    department: "Quality Assurance",
    location: "Davao Site",
    skills: "QA, Documentation, Coaching, English",
    status: "Active",
    visibility: "Shown in Public Form / Talent Pool",
    updatedAt: "May 1, 2026",
    updatedBy: "Alena Batacan",
  },
  {
    id: "POS-003",
    code: "POS-003",
    position: "RCM Analyst",
    department: "Operations",
    location: "Tagum Site",
    skills: "RCM, Healthcare, Documentation, Excel",
    status: "Active",
    visibility: "Shown in Public Form / Talent Pool",
    updatedAt: "May 1, 2026",
    updatedBy: "Alena Batacan",
  },
  {
    id: "POS-004",
    code: "POS-004",
    position: "IT Support",
    department: "Information Technology",
    location: "Any Site",
    skills: "Technical Support, Troubleshooting, Hardware, Networking",
    status: "Inactive",
    visibility: "Hidden from applicant forms",
    updatedAt: "May 1, 2026",
    updatedBy: "Alena Batacan",
  },
  {
    id: "POS-005",
    code: "POS-005",
    position: "Accounting Staff",
    department: "Accounting",
    location: "Davao Site",
    skills: "Accounting, Excel, Documentation, Reconciliation",
    status: "Draft",
    visibility: "Hidden from applicant forms",
    updatedAt: "May 1, 2026",
    updatedBy: "Alena Batacan",
  },
];

export const defaultFinalInterviewFields = [
  {
    id: 1,
    label: "Candidate Name",
    type: "Short Text",
    required: true,
    section: "Candidate Information",
    enabled: true,
  },
  {
    id: 2,
    label: "Position Applied",
    type: "Short Text",
    required: true,
    section: "Candidate Information",
    enabled: true,
  },
  {
    id: 3,
    label: "Communication Skills",
    type: "Rating",
    required: true,
    section: "Interview Assessment",
    enabled: true,
  },
  {
    id: 4,
    label: "Technical / Role Fit",
    type: "Rating",
    required: true,
    section: "Interview Assessment",
    enabled: true,
  },
  {
    id: 5,
    label: "Culture Fit",
    type: "Rating",
    required: true,
    section: "Interview Assessment",
    enabled: true,
  },
  {
    id: 6,
    label: "Final Recommendation",
    type: "Dropdown",
    required: true,
    section: "Final Decision",
    enabled: true,
  },
  {
    id: 7,
    label: "Interview Remarks",
    type: "Paragraph",
    required: false,
    section: "Final Decision",
    enabled: true,
  },
];

export function createDefaultFormForPosition(position) {
  return {
    id: `final-interview-${position.id}`,
    positionId: position.id,
    positionCode: position.code,
    positionTitle: position.position,
    department: position.department,
    name: `${position.position} - Final Interview Form`,
    status: position.status === "Active" ? "Active" : "Draft",
    passingScore: "80",
    description: `Final interview assessment form for ${position.position}.`,
    fields: defaultFinalInterviewFields.map((field) => ({
      ...field,
      id: `${position.id}-${field.id}`,
    })),
    updatedAt: null,
  };
}

export const defaultRecruitmentSettings = {
  activePositionId: "POS-001",
  activeFormId: "final-interview-POS-001",
  forms: defaultAvailablePositions.map((position) =>
    createDefaultFormForPosition(position),
  ),
};
