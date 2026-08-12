export const APPLICANT_LEAD_DEPARTMENT_OPTIONS = [
  "Call Center Operations",
  "Facility Management",
  "Finance & Accounting",
  "Human Resource",
  "IT (Information and Communications Technology)",
  "Management Team",
  "Process Excellence Management",
  "Training Management",
];

export const APPLICANT_LEAD_ACCOUNT_OPTIONS = [
  "Accountants 2.0",
  "Admin",
  "AHG Auditor",
  "AHG Inbound/Outbound",
  "Bayshore Dental Studio",
  "BOD",
  "Comcast Technical",
  "Verizon Tech",
];

export const APPLICANT_LEAD_SOURCE_OPTIONS = [
  "Walk-in",
  "Job Fair",
  "Facebook / Social Media",
  "Phone Call Inquiry",
  "Employee Referral",
  "SMS Inquiry",
  "LinkedIn",
  "Other",
];

export const APPLICANT_LEAD_SITE_OPTIONS = [
  "Tagum City",
  "Davao City",
  "Municipality of Mabini",
];

export const APPLICANT_LEAD_STATUS_OPTIONS = [
  "New Lead",
  "Contacted",
  "Application Link Sent",
  "Converted to Applicant",
  "Not Interested",
  "On Hold",
];

export const EMPTY_APPLICANT_LEAD_FORM = {
  firstName: "",
  lastName: "",
  middleName: "",
  suffix: "",
  cpNum: "",
  email: "",
  departmentId: "",
  department: "Call Center Operations",
  accountId: "",
  specificAccount: "AHG Inbound/Outbound",
  sourcingId: "",
  source: "Walk-in",
  preferredSite: "Tagum City",
  status: "New Lead",
  notes: "",
};

export const INITIAL_APPLICANT_LEADS = [
  {
    id: "LEAD-2026-101",
    fullName: "Maria Clara Santos",
    cpNum: "0917-889-1234",
    email: "maria.santos@gmail.com",
    department: "Call Center Operations",
    specificAccount: "AHG Inbound/Outbound",
    source: "Walk-in",
    preferredSite: "Tagum City",
    status: "New Lead",
    inputtedBy: "Crister Canitan",
    dateLogged: "2026-08-11",
    notes:
      "Walked in inquiring about night shift roles. Expressed strong interest in voice accounts.",
  },
  {
    id: "LEAD-2026-102",
    fullName: "Juan Lorenzo Dela Cruz",
    cpNum: "0928-554-9876",
    email: "juan.delacruz@yahoo.com",
    department: "IT (Information and Communications Technology)",
    specificAccount: "Admin",
    source: "Facebook / Social Media",
    preferredSite: "Davao City",
    status: "Contacted",
    inputtedBy: "Crister Canitan",
    dateLogged: "2026-08-10",
    lastContactDate: "2026-08-10",
    notes:
      "Inquired via FB Messenger ad. Has 2 years tech support experience.",
  },
  {
    id: "LEAD-2026-103",
    fullName: "Bea Alonzo Reyes",
    cpNum: "0998-123-4567",
    email: "bea.reyes@gmail.com",
    department: "Finance & Accounting",
    specificAccount: "Accountants 2.0",
    source: "Job Fair",
    preferredSite: "Tagum City",
    status: "Application Link Sent",
    inputtedBy: "Alena Batacan",
    dateLogged: "2026-08-09",
    lastContactDate: "2026-08-10",
    notes: "Met during Job Fair. Sent application form link via email.",
  },
  {
    id: "LEAD-2026-104",
    fullName: "Gabriel Jose Concepcion",
    cpNum: "0915-777-3322",
    email: "gab.concepcion@outlook.com",
    department: "Human Resource",
    specificAccount: "AHG Auditor",
    source: "Employee Referral",
    preferredSite: "Municipality of Mabini",
    status: "Converted to Applicant",
    inputtedBy: "Crister Canitan",
    dateLogged: "2026-08-08",
    lastContactDate: "2026-08-09",
    notes:
      "Referred by John Concepcion. Completed full candidate registration in Talent Pool.",
  },
];
