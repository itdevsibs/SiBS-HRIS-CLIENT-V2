export const PUBLIC_SUBMISSIONS_KEY = "ta_public_candidate_submissions";
export const INTERNAL_CANDIDATES_KEY = "ta_internal_candidates";
export const CANDIDATE_APPLICATIONS_KEY = "ta_candidate_applications";
export const PIPELINE_CANDIDATES_STORAGE_KEY = "ta_pipeline_candidates";
export const AVAILABLE_POSITIONS_STORAGE_KEY = "ta_available_positions";

export const hearAboutUsOptions = [
  "Employee Referral Program",
  "Print Ads (Billboards, Brochures, Flyers, Posters)",
  "Social Media Pages",
  "Social Media Ads",
  "Online Job Portals",
  "Walk In",
  "Word of Mouth",
  "Institutional Partnership",
  "External Referral Listings",
  "Job Fairs",
  "Employee Retention Program",
  "Outbound",
  "Others",
];

export const openPositionOptions = [];

export const locationOptions = ["Davao Site", "Tagum Site", "Mabini Site"];

export const statusOptions = [
  "All",
  "Silver Pool",
  "Recyclable",
  "Do Not Reprocess",
  "Hired / Active",
  "Withdrawn",
  "Failed",
  "New Applicant",
];

export const availabilityOptions = [
  "All",
  "Available",
  "Available in 2 weeks",
  "Available in 30 days",
  "Unavailable",
];

export const workExperienceOptions = [
  "Has work Experience (at least 6 months relevant work experience)",
  "No work Experience",
];

export const lengthOfWorkExperienceOptions = [
  "6 months to 11 months",
  "1 year to 2 years",
  "3 years to 4 years",
  "5 years and above",
];

export const educationalAttainmentOptions = [
  "Secondary (Grade 11 and Grade 12)",
  "Tertiary (College Level or College Degree Holder)",
  "Tertiary (Graduate School Level or Graduate Holder)",
  "Tertiary (Doctorate Level or Doctorate Holder or equivalent)",
];

export const affiliationOptions = [
  "CPA",
  "LPT",
  "Master Degree Holder",
  "Doctorate Holder",
  "Lean Six Sigma Belt Holder",
  "NC II Holder",
  "Civil Service Eligible",
  "Others",
];

export const yesNoOptions = ["Yes", "No"];

export const employmentInterestOptions = [
  "Full Time",
  "Part Time",
  "Full Time or Part Time",
];

export const leadUploadTemplateColumns = [
  "candidateId",
  "firstName",
  "middleName",
  "lastName",
  "suffix",
  "nickname",
  "email",
  "phoneNumber1",
  "phoneNumber2",
  "dateOfBirth",
  "physicalAddress",
  "openPosition",
  "applyingLocation",
  "hearAboutUs",
  "referredBy",
  "employeeId",
  "workExperience",
  "educationalAttainment",
  "skillsLanguage",
  "status",
  "availability",
  "remarks",
];

export const leadUploadTemplateRows = [
  {
    candidateId: "",
    firstName: "Ana",
    middleName: "",
    lastName: "Santos",
    suffix: "",
    nickname: "Ana",
    email: "ana.santos@email.com",
    phoneNumber1: "09171234567",
    phoneNumber2: "",
    dateOfBirth: "1999-04-14",
    physicalAddress: "Davao City",
    openPosition: "Customer Service Representative",
    applyingLocation: "Davao Site",
    hearAboutUs: "Social Media Ads",
    referredBy: "N/A",
    employeeId: "N/A",
    workExperience:
      "Has work Experience (at least 6 months relevant work experience)",
    educationalAttainment: "Tertiary (College Level or College Degree Holder)",
    skillsLanguage: "English, Chat",
    status: "New Applicant",
    availability: "Available",
    remarks: "Imported sample lead",
  },
];

export const emptyExperience = {
  id: 1,
  industry: "",
  lengthOfWorkExperience: "",
  years: "",
  role: "",
  company: "",
  monthlyCompensation: "",
  reasonForLeaving: "",
  hasOtherExperience: "No",
};

export const emptyCandidateForm = {
  hearAboutUs: [],
  openPosition: "",
  nickname: "",
  applyingLocation: "",
  referredBy: "",
  employeeId: "",
  firstName: "",
  lastName: "",
  middleName: "",
  suffix: "",
  dateOfBirth: "",
  email: "",
  physicalAddress: "",
  workExperience: "",
  phoneNumber1: "",
  phoneNumber2: "",
  workExperiences: [{ ...emptyExperience }],
  educationalAttainment: "",
  affiliations: [],
  trainingAttended: "",
  fullyVaccinated: "",
  comfortableOnSite: "",
  willingGraveyard: "",
  employmentInterest: "",
  remoteWorkAccess: "",
  willingDrugTest: "",
  willingBackgroundCheck: "",
  references: [
    { name: "", phone: "" },
    { name: "", phone: "" },
    { name: "", phone: "" },
  ],
  audioFileName: "",
  audioFileUrl: "",
  audioFileType: "",
  attachmentFileName: "",
  attachmentFileUrl: "",
  attachmentFileType: "",
  consent: false,
  status: "New Applicant",
  source: "",
  availability: "Available",
  accountFit: "",
  skillsLanguage: "",
  remarks: "",
  appliedRole: "",
  appliedAccount: "",
  applicationOutcome: "Initial Entry",

  pipelineStatus: "",
  currentPipelineStage: "",
  pipelineStage: "",
  currentStage: "",
  currentAppliedRole: "",
  currentAppliedAccount: "",
  currentTaOwner: "",
  movedToPipeline: false,
};
export const emptyStatusForm = {
  status: "",
  remarks: "",
};

export const emptyMoveToPipelineForm = {
  hiringRequirementId: "",
  jobDescriptionId: "",
  roleTitle: "",
  account: "",
  leadAccount: "",
  taOwner: "",
  initialStage: "Initial Screening",
  remarks: "",
};

export const initialCandidates = [];


export const fallbackAvailablePositions = [];
