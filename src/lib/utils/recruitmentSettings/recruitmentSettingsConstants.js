export const RECRUITMENT_SETTINGS_STORAGE_KEY =
  "sibs_recruitment_settings_temp";

export const AVAILABLE_POSITIONS_STORAGE_KEY = "sibs_available_positions_temp";

export const recruitmentTabs = [
  "Final Interview Form",
  "Pipeline Settings",
  "Assessment Settings",
  "Email Templates",
  "Holiday Calendar",
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

export const defaultAvailablePositions = [];

export const defaultFinalInterviewFields = [];

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
  activePositionId: "",
  activeFormId: "",
  forms: [],
};
