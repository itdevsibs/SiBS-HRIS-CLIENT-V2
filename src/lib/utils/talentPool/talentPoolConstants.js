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
  "Others",
];

export const openPositionOptions = [
  "Customer Service Representative",
  "QA Specialist",
  "RCM Analyst",
  "IT Support",
  "HR Assistant",
  "System Developer",
  "Accounting Staff",
];

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
  taOwner: "",
  initialStage: "Initial Screening",
  remarks: "",
};

export const initialCandidates = [
  {
    id: 1,
    candidateId: "CAND-001",
    hearAboutUs: ["Employee Referral Program"],
    openPosition: "Customer Service Representative",
    nickname: "Juan",
    applyingLocation: "Davao Site",
    referredBy: "Maria Reyes",
    employeeId: "EMP-0001",
    firstName: "Juan",
    middleName: "",
    lastName: "Dela Cruz",
    suffix: "",
    name: "Juan Dela Cruz",
    dateOfBirth: "1998-04-12",
    ageAsOfApplication: 28,
    physicalAddress: "Davao City",
    email: "juan.delacruz@email.com",
    workExperience:
      "Has work Experience (at least 6 months relevant work experience)",
    workExperiences: [
      {
        id: 1,
        industry: "BPO",
        lengthOfWorkExperience: "1 year to 2 years",
        years: "2",
        role: "CSR",
        company: "Sample BPO",
        monthlyCompensation: "18000",
        reasonForLeaving: "Career growth",
        hasOtherExperience: "No",
      },
    ],
    contactNumber: "09123456789",
    phoneNumber1: "09123456789",
    phoneNumber2: "",
    roleCapability: "Customer Service Representative",
    skillsLanguage: "English, Chat",
    educationalAttainment: "Tertiary (College Level or College Degree Holder)",
    affiliations: ["Lean Six Sigma Belt Holder"],
    trainingAttended: "Customer service training",
    fullyVaccinated: "Yes",
    comfortableOnSite: "Yes",
    willingGraveyard: "Yes",
    employmentInterest: "Full Time",
    remoteWorkAccess: "Yes",
    willingDrugTest: "Yes",
    willingBackgroundCheck: "Yes",
    references: [
      { name: "Sample Reference 1", phone: "09111111111" },
      { name: "Sample Reference 2", phone: "09222222222" },
      { name: "Sample Reference 3", phone: "09333333333" },
    ],
    audioFileName: "",
    attachmentFileName: "",
    consent: true,
    status: "Silver Pool",
    source: "Employee Referral Program",
    availability: "Available",
    lastActivity: "2026-05-02",
    tags: ["Customer Service Representative", "Chat Support", "English"],
    isPublicSubmission: false,
    applicationHistory: [
      {
        role: "Customer Service Representative",
        account: "Collect IV",
        outcome: "Passed - No Opening",
        date: "2026-04-20",
      },
    ],
    remarks: "Passed screening and interview but no available opening yet.",
  },
];

export const fallbackAvailablePositions = [
  {
    id: 1,
    positionId: "POS-001",
    positionTitle: "Customer Service Representative",
    department: "Operations",
    locationSite: "Davao Site",
    status: "Active",
  },
  {
    id: 2,
    positionId: "POS-002",
    positionTitle: "QA Specialist",
    department: "Quality Assurance",
    locationSite: "Davao Site",
    status: "Active",
  },
  {
    id: 3,
    positionId: "POS-003",
    positionTitle: "RCM Analyst",
    department: "Operations",
    locationSite: "Tagum Site",
    status: "Active",
  },
  {
    id: 4,
    positionId: "POS-004",
    positionTitle: "IT Support",
    department: "Information Technology",
    locationSite: "Any Site",
    status: "Active",
  },
  {
    id: 5,
    positionId: "POS-005",
    positionTitle: "HR Assistant",
    department: "Human Resources",
    locationSite: "Davao Site",
    status: "Active",
  },
  {
    id: 6,
    positionId: "POS-006",
    positionTitle: "System Developer",
    department: "Information Technology",
    locationSite: "Davao Site",
    status: "Active",
  },
  {
    id: 7,
    positionId: "POS-007",
    positionTitle: "Accounting Staff",
    department: "Accounting",
    locationSite: "Davao Site",
    status: "Active",
  },
];
