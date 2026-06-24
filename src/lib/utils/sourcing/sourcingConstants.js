export const PUBLIC_SUBMISSIONS_KEY = "ta_public_candidate_submissions";
export const SOURCE_COST_ENTRIES_KEY = "ta_sourcing_cost_entries";

export const SOURCING_RECORDS_PER_PAGE = 8;

export const sourcingOptions = [
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

export const initialSourceCostForm = {
  source: "",
  description: "",
  amount: "",
  dateSpent: "",
};

export const samplePublicSubmissions = [
  {
    id: 1001,
    candidateId: "PUB-SAMPLE-001",
    name: "Juan Dela Cruz",
    email: "juan.delacruz@email.com",
    hearAboutUs: ["Social Media Ads"],
    openPosition: "CSR",
    applyingLocation: "Davao Site",
    status: "Hired",
    submittedAt: "2026-05-01",
    isPublicSubmission: true,
  },
  {
    id: 1002,
    candidateId: "PUB-SAMPLE-002",
    name: "Maria Santos",
    email: "maria.santos@email.com",
    hearAboutUs: ["Social Media Ads", "Online Job Portals"],
    openPosition: "CSR",
    applyingLocation: "Davao Site",
    status: "Hired",
    submittedAt: "2026-05-02",
    isPublicSubmission: true,
  },
  {
    id: 1003,
    candidateId: "PUB-SAMPLE-003",
    name: "Carlo Reyes",
    email: "carlo.reyes@email.com",
    hearAboutUs: ["Employee Referral Program"],
    openPosition: "RCM Analyst",
    applyingLocation: "Tagum Site",
    status: "Interviewed",
    submittedAt: "2026-05-03",
    isPublicSubmission: true,
  },
  {
    id: 1004,
    candidateId: "PUB-SAMPLE-004",
    name: "Angela Lim",
    email: "angela.lim@email.com",
    hearAboutUs: ["Walk In"],
    openPosition: "HR Assistant",
    applyingLocation: "Davao Site",
    status: "Initial Screening",
    submittedAt: "2026-05-04",
    isPublicSubmission: true,
  },
  {
    id: 1005,
    candidateId: "PUB-SAMPLE-005",
    name: "Mark Villanueva",
    email: "mark.villanueva@email.com",
    hearAboutUs: ["Job Fairs"],
    openPosition: "CSR",
    applyingLocation: "Mabini Site",
    status: "Hired",
    submittedAt: "2026-05-05",
    isPublicSubmission: true,
  },
];

export const sampleSourceCostEntries = [
  {
    id: 2001,
    source: "Social Media Ads",
    description: "Facebook Ads - CSR Hiring Campaign May 2026",
    amount: 10000,
    dateSpent: "2026-05-01",
    createdAt: "2026-05-01",
  },
  {
    id: 2002,
    source: "Online Job Portals",
    description: "Job portal posting package for CSR hiring",
    amount: 7500,
    dateSpent: "2026-05-02",
    createdAt: "2026-05-02",
  },
  {
    id: 2003,
    source: "Job Fairs",
    description: "Booth setup and materials for local job fair",
    amount: 5000,
    dateSpent: "2026-05-05",
    createdAt: "2026-05-05",
  },
];