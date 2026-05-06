import React, { useEffect, useMemo, useState } from "react";
import Header from "../../../components/layout/Header";
import {
  Search,
  Filter,
  Eye,
  UsersRound,
  UserCheck,
  RefreshCcw,
  Ban,
  BriefcaseBusiness,
  Plus,
  ChevronLeft,
  ChevronRight,
  X,
  Tags,
  History,
  Mail,
  Phone,
  CalendarDays,
  UserPlus,
  RotateCcw,
  ExternalLink,
  Pencil,
  ArrowRight,
  KanbanSquare,
  MapPin,
  GraduationCap,
  ShieldCheck,
  ClipboardList,
} from "lucide-react";

const PUBLIC_SUBMISSIONS_KEY = "ta_public_candidate_submissions";
const INTERNAL_CANDIDATES_KEY = "ta_internal_candidates";
const CANDIDATE_APPLICATIONS_KEY = "ta_candidate_applications";

const hiringRequirementOptions = [
  {
    id: "HIR-001",
    roleTitle: "Customer Service Representative",
    account: "SIBS Operations",
    jobDescriptionId: "JD-001",
    jobDescription: "JD-001 — Customer Service Representative",
    taOwner: "Maria Reyes",
  },
  {
    id: "HIR-002",
    roleTitle: "QA Specialist",
    account: "SIBS Operations",
    jobDescriptionId: "JD-002",
    jobDescription: "JD-002 — QA Specialist",
    taOwner: "John Dela Cruz",
  },
  {
    id: "HIR-003",
    roleTitle: "RCM Analyst",
    account: "SIBS RCM",
    jobDescriptionId: "JD-003",
    jobDescription: "JD-003 — RCM Analyst",
    taOwner: "Kim Domingo",
  },
  {
    id: "HIR-004",
    roleTitle: "System Developer",
    account: "SIBS IT",
    jobDescriptionId: "JD-004",
    jobDescription: "JD-004 — System Developer",
    taOwner: "Paul Garcia",
  },
];

const initialCandidates = [
  {
    id: 1,
    candidateId: "CAND-001",
    firstName: "Juan",
    middleName: "",
    lastName: "Dela Cruz",
    extension: "",
    name: "Juan Dela Cruz",
    dateOfBirth: "1998-04-12",
    ageAsOfApplication: 28,
    physicalAddress: "Davao City",
    email: "juan.delacruz@email.com",
    contactNumber: "09123456789",
    phoneNumber1: "09123456789",
    phoneNumber2: "",
    roleCapability: "CSR",
    skillsLanguage: "English, Chat",
    educationalAttainment: "Tertiary (College Level or College Degree Holder)",
    affiliations: ["Lean Six Sigma Belt Holder"],
    cpa: false,
    lpt: false,
    masterDegreeHolder: false,
    doctorateHolder: false,
    leanSixSigmaBeltHolder: true,
    otherAffiliation: "",
    trainingAttended: "Customer service training",
    fullyVaccinated: "Yes",
    comfortableOnSite: "Yes",
    willingGraveyard: "Yes",
    employmentInterest: "Full-time",
    remoteWorkAccess: "Yes",
    willingDrugTest: "Yes",
    willingBackgroundCheck: "Yes",
    references: "Reference 1: Sample / 09111111111 / Former Supervisor",
    status: "Silver Pool",
    source: "Referral",
    availability: "Available",
    accountFit: "SIBS Operations",
    lastActivity: "2026-05-02",
    tags: ["CSR", "Chat Support", "English"],
    isPublicSubmission: false,
    applicationHistory: [
      {
        role: "Customer Service Representative",
        account: "SIBS Operations",
        outcome: "Passed - No Opening",
        date: "2026-04-20",
      },
    ],
    remarks: "Passed screening and interview but no available opening yet.",
  },
  {
    id: 2,
    candidateId: "CAND-002",
    firstName: "Maria",
    middleName: "",
    lastName: "Santos",
    extension: "",
    name: "Maria Santos",
    dateOfBirth: "1996-08-20",
    ageAsOfApplication: 29,
    physicalAddress: "Davao City",
    email: "maria.santos@email.com",
    contactNumber: "09987654321",
    phoneNumber1: "09987654321",
    phoneNumber2: "",
    roleCapability: "QA",
    skillsLanguage: "English, Process",
    educationalAttainment: "Tertiary (College Level or College Degree Holder)",
    affiliations: [],
    cpa: false,
    lpt: false,
    masterDegreeHolder: false,
    doctorateHolder: false,
    leanSixSigmaBeltHolder: false,
    otherAffiliation: "",
    trainingAttended: "QA calibration training",
    fullyVaccinated: "Yes",
    comfortableOnSite: "Yes",
    willingGraveyard: "Yes",
    employmentInterest: "Full-time",
    remoteWorkAccess: "Yes",
    willingDrugTest: "Yes",
    willingBackgroundCheck: "Yes",
    references: "",
    status: "Recyclable",
    source: "JobStreet",
    availability: "Available in 2 weeks",
    accountFit: "SIBS QA",
    lastActivity: "2026-04-29",
    tags: ["QA", "Process", "Documentation"],
    isPublicSubmission: false,
    applicationHistory: [
      {
        role: "QA Specialist",
        account: "SIBS Operations",
        outcome: "Not Selected",
        date: "2026-04-10",
      },
    ],
    remarks: "Can be reconsidered for future QA openings.",
  },
  {
    id: 3,
    candidateId: "CAND-003",
    firstName: "Carlo",
    middleName: "",
    lastName: "Reyes",
    extension: "",
    name: "Carlo Reyes",
    dateOfBirth: "1997-11-05",
    ageAsOfApplication: 28,
    physicalAddress: "Davao City",
    email: "carlo.reyes@email.com",
    contactNumber: "09221234567",
    phoneNumber1: "09221234567",
    phoneNumber2: "",
    roleCapability: "RCM Analyst",
    skillsLanguage: "English, RCM",
    educationalAttainment: "Tertiary (College Level or College Degree Holder)",
    affiliations: [],
    cpa: false,
    lpt: false,
    masterDegreeHolder: false,
    doctorateHolder: false,
    leanSixSigmaBeltHolder: false,
    otherAffiliation: "",
    trainingAttended: "Healthcare billing training",
    fullyVaccinated: "Yes",
    comfortableOnSite: "Yes",
    willingGraveyard: "Yes",
    employmentInterest: "Full-time",
    remoteWorkAccess: "Yes",
    willingDrugTest: "Yes",
    willingBackgroundCheck: "Yes",
    references: "",
    status: "Silver Pool",
    source: "LinkedIn",
    availability: "Available",
    accountFit: "SIBS RCM",
    lastActivity: "2026-04-21",
    tags: ["RCM", "Healthcare", "English"],
    isPublicSubmission: false,
    applicationHistory: [
      {
        role: "RCM Analyst",
        account: "SIBS RCM",
        outcome: "Passed",
        date: "2026-04-18",
      },
    ],
    remarks: "Strong healthcare billing background.",
  },
  {
    id: 4,
    candidateId: "CAND-004",
    firstName: "Angela",
    middleName: "",
    lastName: "Lim",
    extension: "",
    name: "Angela Lim",
    dateOfBirth: "1999-01-14",
    ageAsOfApplication: 27,
    physicalAddress: "Davao City",
    email: "angela.lim@email.com",
    contactNumber: "09331234567",
    phoneNumber1: "09331234567",
    phoneNumber2: "",
    roleCapability: "CSR",
    skillsLanguage: "English, Chat",
    educationalAttainment: "Secondary (Grade 11 and Grade 12)",
    affiliations: [],
    cpa: false,
    lpt: false,
    masterDegreeHolder: false,
    doctorateHolder: false,
    leanSixSigmaBeltHolder: false,
    otherAffiliation: "",
    trainingAttended: "",
    fullyVaccinated: "Yes",
    comfortableOnSite: "No",
    willingGraveyard: "No",
    employmentInterest: "Part-time",
    remoteWorkAccess: "Yes",
    willingDrugTest: "Yes",
    willingBackgroundCheck: "Yes",
    references: "",
    status: "Do Not Reprocess",
    source: "Walk-in",
    availability: "Unavailable",
    accountFit: "N/A",
    lastActivity: "2026-04-20",
    tags: ["CSR", "Chat"],
    isPublicSubmission: false,
    applicationHistory: [
      {
        role: "Customer Service Representative",
        account: "SIBS Operations",
        outcome: "Failed Interview",
        date: "2026-04-17",
      },
    ],
    remarks: "Marked not fit for future reprocessing.",
  },
];

const roleOptions = [
  "All",
  "CSR",
  "QA",
  "RCM Analyst",
  "IT Support",
  "HR Assistant",
  "System Developer",
  "Accounting",
];

const statusOptions = [
  "All",
  "Silver Pool",
  "Recyclable",
  "Do Not Reprocess",
  "Hired / Active",
  "Withdrawn",
  "Failed",
  "New Applicant",
];

const skillOptions = [
  "All",
  "English",
  "Chat",
  "Process",
  "RCM",
  "Tech",
  "Documentation",
  "Healthcare",
  "Accounting",
];

const availabilityOptions = [
  "All",
  "Available",
  "Available in 2 weeks",
  "Available in 30 days",
  "Unavailable",
];

const sourceOptions = [
  "Referral",
  "JobStreet",
  "LinkedIn",
  "Facebook",
  "Walk-in",
  "Public Application",
  "Talent Pool Reactivation",
];

const educationalAttainmentOptions = [
  "Secondary (Grade 11 and Grade 12)",
  "Tertiary (College Level or College Degree Holder)",
  "Tertiary (Graduate School Level or Graduate Holder)",
  "Tertiary (Doctorate Level or Doctorate Holder or equivalent)",
];

const emptyCandidateForm = {
  firstName: "",
  middleName: "",
  lastName: "",
  extension: "",
  dateOfBirth: "",
  physicalAddress: "",
  email: "",
  phoneNumber1: "",
  phoneNumber2: "",
  roleCapability: "",
  skillsLanguage: "",
  educationalAttainment: "",
  cpa: false,
  lpt: false,
  masterDegreeHolder: false,
  doctorateHolder: false,
  leanSixSigmaBeltHolder: false,
  otherAffiliation: "",
  trainingAttended: "",
  fullyVaccinated: "",
  comfortableOnSite: "",
  willingGraveyard: "",
  employmentInterest: "",
  remoteWorkAccess: "",
  willingDrugTest: "",
  willingBackgroundCheck: "",
  references: "",
  status: "New Applicant",
  source: "",
  availability: "Available",
  accountFit: "",
  remarks: "",
  appliedRole: "",
  appliedAccount: "",
  applicationOutcome: "Initial Entry",
};

const emptyStatusForm = {
  status: "",
  remarks: "",
};

const emptyMoveToPipelineForm = {
  hiringRequirementId: "",
  jobDescriptionId: "",
  roleTitle: "",
  account: "",
  taOwner: "",
  initialStage: "Sourced",
  remarks: "",
};

function inputClass(extra = "") {
  return `h-11 w-full rounded-xl border border-[#E6ECF2] bg-white px-4 text-sm font-semibold outline-none transition focus:border-sibs-primary-1 focus:ring-4 focus:ring-sibs-primary-1/10 ${extra}`;
}

function textareaClass(extra = "") {
  return `w-full resize-none rounded-xl border border-[#E6ECF2] bg-white px-4 py-3 text-sm font-semibold outline-none transition focus:border-sibs-primary-1 focus:ring-4 focus:ring-sibs-primary-1/10 ${extra}`;
}

function getTodayDate() {
  return new Date().toISOString().split("T")[0];
}

function generateCandidateId(nextNumber) {
  return `CAND-${String(nextNumber).padStart(3, "0")}`;
}

function generateApplicationId() {
  return `APP-${Date.now()}`;
}

function calculateAge(dateOfBirth) {
  if (!dateOfBirth) return null;

  const today = new Date();
  const birthDate = new Date(dateOfBirth);

  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDifference = today.getMonth() - birthDate.getMonth();

  if (
    monthDifference < 0 ||
    (monthDifference === 0 && today.getDate() < birthDate.getDate())
  ) {
    age--;
  }

  return age;
}

function buildFullName(candidate) {
  return [
    candidate.firstName,
    candidate.middleName,
    candidate.lastName,
    candidate.extension,
  ]
    .filter(Boolean)
    .join(" ")
    .replace(/\s+/g, " ")
    .trim();
}

function normalizeTags(roleCapability, skillsLanguage) {
  const tags = [
    roleCapability,
    ...String(skillsLanguage || "")
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean),
  ];

  return [...new Set(tags.filter(Boolean))];
}

function formatDate(date) {
  if (!date) return "—";

  return new Date(date).toLocaleDateString("en-PH", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function getStatusClass(status) {
  switch (status) {
    case "Silver Pool":
      return "border-blue-200 bg-blue-50 text-blue-700";
    case "Recyclable":
      return "border-amber-200 bg-amber-50 text-amber-700";
    case "Do Not Reprocess":
      return "border-red-200 bg-red-50 text-red-700";
    case "Hired / Active":
      return "border-emerald-200 bg-emerald-50 text-emerald-700";
    case "Withdrawn":
      return "border-gray-200 bg-gray-50 text-gray-600";
    case "Failed":
      return "border-red-200 bg-red-50 text-red-700";
    case "New Applicant":
      return "border-purple-200 bg-purple-50 text-purple-700";
    default:
      return "border-gray-200 bg-gray-50 text-gray-600";
  }
}

function readLocalStorage(key, fallback) {
  if (typeof window === "undefined") return fallback;

  try {
    const raw = window.localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function writeLocalStorage(key, value) {
  if (typeof window === "undefined") return;

  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Temporary frontend-only storage.
  }
}

function StatCard({ title, value, icon: Icon, description }) {
  return (
    <div className="flex min-w-0 items-center gap-4 rounded-xl bg-white p-4 shadow-sm">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-sibs-primary-1 text-white">
        <Icon size={18} />
      </div>

      <div className="min-w-0">
        <p className="truncate text-xs text-sibs-tertiary-5">{title}</p>

        <h2 className="truncate text-lg font-bold text-sibs-primary-1">
          {value}
        </h2>

        {description && (
          <p className="truncate text-xs text-sibs-tertiary-5">
            {description}
          </p>
        )}
      </div>
    </div>
  );
}

function InfoBox({ icon: Icon, label, value }) {
  return (
    <div className="rounded-xl border border-[#E6ECF2] bg-white p-4 shadow-sm">
      <div className="mb-2 flex items-center gap-2">
        <Icon size={16} className="text-sibs-primary-1" />

        <p className="text-[11px] font-bold uppercase tracking-wide text-sibs-tertiary-5">
          {label}
        </p>
      </div>

      <p className="whitespace-pre-line break-words text-sm font-bold text-[#344054]">
        {value || "—"}
      </p>
    </div>
  );
}

function DetailRow({ label, value }) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-gray-100 py-3 last:border-b-0">
      <p className="text-[11px] font-bold uppercase tracking-wide text-sibs-tertiary-5">
        {label}
      </p>

      <p className="max-w-[60%] break-words text-right text-sm font-bold text-[#344054]">
        {value || "—"}
      </p>
    </div>
  );
}

function FieldLabel({ children }) {
  return (
    <label className="mb-1 block text-[11px] font-bold uppercase tracking-wide text-sibs-tertiary-5">
      {children}
    </label>
  );
}

function TalentPoolMobileCard({ candidate, onView }) {
  return (
    <button
      type="button"
      onClick={onView}
      className="w-full rounded-xl border border-[#E6ECF2] bg-white p-4 text-left shadow-sm transition hover:border-sibs-primary-1/40 hover:bg-[#F8FAFC]"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-bold text-sibs-primary-1">
            {candidate.candidateId}
          </p>

          <h3 className="mt-1 text-sm font-bold text-[#101828]">
            {candidate.name}
          </h3>

          <p className="mt-1 truncate text-xs font-semibold text-sibs-tertiary-5">
            {candidate.email}
          </p>
        </div>

        <span
          className={`shrink-0 rounded-full border px-2.5 py-1 text-[10px] font-bold ${getStatusClass(
            candidate.status
          )}`}
        >
          {candidate.status}
        </span>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-2">
        <div className="rounded-lg bg-[#F8FAFC] p-3">
          <p className="text-[10px] font-bold uppercase text-sibs-tertiary-5">
            Role
          </p>

          <p className="mt-1 text-xs font-bold text-[#344054]">
            {candidate.roleCapability || "—"}
          </p>
        </div>

        <div className="rounded-lg bg-[#F8FAFC] p-3">
          <p className="text-[10px] font-bold uppercase text-sibs-tertiary-5">
            Availability
          </p>

          <p className="mt-1 text-xs font-bold text-[#344054]">
            {candidate.availability || "—"}
          </p>
        </div>
      </div>

      <div className="mt-3 flex flex-wrap gap-2">
        <span className="inline-flex rounded-full border border-gray-200 bg-gray-50 px-2.5 py-1 text-[10px] font-bold text-gray-600">
          {candidate.source || "—"}
        </span>

        {candidate.isPublicSubmission && (
          <span className="inline-flex rounded-full border border-purple-200 bg-purple-50 px-2.5 py-1 text-[10px] font-bold text-purple-700">
            Public Submission
          </span>
        )}
      </div>

      <p className="mt-3 line-clamp-2 text-xs font-semibold text-sibs-tertiary-5">
        {candidate.skillsLanguage || "No skills/language recorded"}
      </p>
    </button>
  );
}

function AddCandidateModal({ open, form, setForm, onClose, onSubmit, onReset }) {
  if (!open) return null;

  const age = calculateAge(form.dateOfBirth);
  const isMinor = age !== null && age < 18;

  function updateCheckbox(field, checked) {
    setForm({
      ...form,
      [field]: checked,
    });
  }

  return (
    <div
      className="fixed inset-0 z-[9999] flex h-dvh items-center justify-center bg-black/40 px-4 py-4"
      onClick={onClose}
    >
      <div
        className="flex max-h-[92dvh] w-full max-w-6xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4 border-b border-gray-100 px-5 py-4 sm:px-6 sm:py-5">
          <div className="min-w-0">
            <h2 className="text-lg font-bold text-sibs-primary-1 sm:text-xl">
              Add Candidate
            </h2>

            <p className="mt-1 text-sm font-medium text-sibs-tertiary-5">
              New candidates are saved as New Applicant first, then TA can
              update the classification after review.
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="shrink-0 rounded-full p-2 text-gray-400 transition hover:bg-gray-100 hover:text-gray-700"
            aria-label="Close modal"
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={onSubmit} className="flex-1 overflow-y-auto p-4 sm:p-6">
          <div className="grid grid-cols-1 gap-5 xl:grid-cols-[1fr_340px]">
            <div className="space-y-5">
              <div className="rounded-xl border border-[#E6ECF2] bg-white p-5 shadow-sm">
                <h3 className="mb-4 text-sm font-bold text-[#101828]">
                  Personal Information
                </h3>

                <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
                  <div>
                    <FieldLabel>
                      First Name <span className="text-red-500">*</span>
                    </FieldLabel>

                    <input
                      required
                      value={form.firstName}
                      onChange={(e) =>
                        setForm({ ...form, firstName: e.target.value })
                      }
                      placeholder="Juan"
                      className={inputClass()}
                    />
                  </div>

                  <div>
                    <FieldLabel>Middle Name</FieldLabel>

                    <input
                      value={form.middleName}
                      onChange={(e) =>
                        setForm({ ...form, middleName: e.target.value })
                      }
                      placeholder="Santos"
                      className={inputClass()}
                    />
                  </div>

                  <div>
                    <FieldLabel>
                      Last Name <span className="text-red-500">*</span>
                    </FieldLabel>

                    <input
                      required
                      value={form.lastName}
                      onChange={(e) =>
                        setForm({ ...form, lastName: e.target.value })
                      }
                      placeholder="Dela Cruz"
                      className={inputClass()}
                    />
                  </div>

                  <div>
                    <FieldLabel>Extension</FieldLabel>

                    <input
                      value={form.extension}
                      onChange={(e) =>
                        setForm({ ...form, extension: e.target.value })
                      }
                      placeholder="Jr., Sr., III"
                      className={inputClass()}
                    />
                  </div>

                  <div>
                    <FieldLabel>
                      Date of Birth <span className="text-red-500">*</span>
                    </FieldLabel>

                    <input
                      required
                      type="date"
                      value={form.dateOfBirth}
                      onChange={(e) =>
                        setForm({ ...form, dateOfBirth: e.target.value })
                      }
                      className={`h-11 w-full rounded-xl border bg-white px-4 text-sm font-semibold outline-none transition focus:ring-4 ${
                        isMinor
                          ? "border-red-300 focus:border-red-500 focus:ring-red-500/10"
                          : "border-[#E6ECF2] focus:border-sibs-primary-1 focus:ring-sibs-primary-1/10"
                      }`}
                    />

                    {age !== null && (
                      <p
                        className={`mt-2 text-xs font-bold ${
                          isMinor ? "text-red-600" : "text-emerald-600"
                        }`}
                      >
                        Age as of application date: {age}
                        {isMinor ? " — Applicant is below 18 years old." : ""}
                      </p>
                    )}
                  </div>

                  <div className="md:col-span-3">
                    <FieldLabel>
                      Physical Address <span className="text-red-500">*</span>
                    </FieldLabel>

                    <input
                      required
                      value={form.physicalAddress}
                      onChange={(e) =>
                        setForm({ ...form, physicalAddress: e.target.value })
                      }
                      placeholder="Complete physical address"
                      className={inputClass()}
                    />
                  </div>

                  <div>
                    <FieldLabel>
                      Email Address <span className="text-red-500">*</span>
                    </FieldLabel>

                    <input
                      required
                      type="email"
                      value={form.email}
                      onChange={(e) =>
                        setForm({ ...form, email: e.target.value })
                      }
                      placeholder="candidate@email.com"
                      className={inputClass()}
                    />
                  </div>

                  <div>
                    <FieldLabel>
                      Phone Number 1 <span className="text-red-500">*</span>
                    </FieldLabel>

                    <input
                      required
                      value={form.phoneNumber1}
                      onChange={(e) =>
                        setForm({ ...form, phoneNumber1: e.target.value })
                      }
                      placeholder="09xxxxxxxxx"
                      className={inputClass()}
                    />
                  </div>

                  <div>
                    <FieldLabel>Phone Number 2</FieldLabel>

                    <input
                      value={form.phoneNumber2}
                      onChange={(e) =>
                        setForm({ ...form, phoneNumber2: e.target.value })
                      }
                      placeholder="Optional"
                      className={inputClass()}
                    />
                  </div>
                </div>
              </div>

              <div className="rounded-xl border border-[#E6ECF2] bg-white p-5 shadow-sm">
                <h3 className="mb-4 text-sm font-bold text-[#101828]">
                  Candidate Classification
                </h3>

                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div>
                    <FieldLabel>
                      Role Capability <span className="text-red-500">*</span>
                    </FieldLabel>

                    <select
                      required
                      value={form.roleCapability}
                      onChange={(e) =>
                        setForm({ ...form, roleCapability: e.target.value })
                      }
                      className={inputClass()}
                    >
                      <option value="">Select role capability</option>
                      {roleOptions
                        .filter((role) => role !== "All")
                        .map((role) => (
                          <option key={role} value={role}>
                            {role}
                          </option>
                        ))}
                    </select>
                  </div>

                  <div>
                    <FieldLabel>
                      Skills / Language <span className="text-red-500">*</span>
                    </FieldLabel>

                    <input
                      required
                      value={form.skillsLanguage}
                      onChange={(e) =>
                        setForm({ ...form, skillsLanguage: e.target.value })
                      }
                      placeholder="English, Chat, RCM"
                      className={inputClass()}
                    />
                  </div>

                  <div>
                    <FieldLabel>Status Classification</FieldLabel>

                    <input
                      readOnly
                      value="New Applicant"
                      className="h-11 w-full cursor-not-allowed rounded-xl border border-purple-200 bg-purple-50 px-4 text-sm font-bold text-purple-700 outline-none"
                    />
                  </div>

                  <div>
                    <FieldLabel>Availability</FieldLabel>

                    <select
                      required
                      value={form.availability}
                      onChange={(e) =>
                        setForm({ ...form, availability: e.target.value })
                      }
                      className={inputClass()}
                    >
                      {availabilityOptions
                        .filter((availability) => availability !== "All")
                        .map((availability) => (
                          <option key={availability} value={availability}>
                            {availability}
                          </option>
                        ))}
                    </select>
                  </div>

                  <div>
                    <FieldLabel>
                      Source <span className="text-red-500">*</span>
                    </FieldLabel>

                    <select
                      required
                      value={form.source}
                      onChange={(e) =>
                        setForm({ ...form, source: e.target.value })
                      }
                      className={inputClass()}
                    >
                      <option value="">Select source</option>
                      {sourceOptions.map((source) => (
                        <option key={source} value={source}>
                          {source}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <FieldLabel>Account Fit</FieldLabel>

                    <input
                      value={form.accountFit}
                      onChange={(e) =>
                        setForm({ ...form, accountFit: e.target.value })
                      }
                      placeholder="SIBS Operations"
                      className={inputClass()}
                    />
                  </div>
                </div>
              </div>

              <div className="rounded-xl border border-[#E6ECF2] bg-white p-5 shadow-sm">
                <h3 className="mb-4 text-sm font-bold text-[#101828]">
                  Educational Attainment
                </h3>

                <div className="grid grid-cols-1 gap-3">
                  {educationalAttainmentOptions.map((item) => (
                    <label
                      key={item}
                      className="flex items-center gap-3 rounded-xl border border-[#E6ECF2] bg-[#F8FAFC] p-4"
                    >
                      <input
                        type="radio"
                        name="educationalAttainment"
                        value={item}
                        checked={form.educationalAttainment === item}
                        onChange={(e) =>
                          setForm({
                            ...form,
                            educationalAttainment: e.target.value,
                          })
                        }
                        className="h-4 w-4"
                      />

                      <span className="text-sm font-semibold text-[#344054]">
                        {item}
                      </span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="rounded-xl border border-[#E6ECF2] bg-white p-5 shadow-sm">
                <h3 className="mb-4 text-sm font-bold text-[#101828]">
                  Affiliations and Certifications
                </h3>

                <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                  {[
                    ["cpa", "CPA"],
                    ["lpt", "LPT"],
                    ["masterDegreeHolder", "Master Degree Holder"],
                    ["doctorateHolder", "Doctorate Holder"],
                    ["leanSixSigmaBeltHolder", "Lean Six Sigma Belt Holder"],
                  ].map(([field, label]) => (
                    <label
                      key={field}
                      className="flex items-center gap-3 rounded-xl border border-[#E6ECF2] bg-[#F8FAFC] p-4"
                    >
                      <input
                        type="checkbox"
                        checked={form[field]}
                        onChange={(e) =>
                          updateCheckbox(field, e.target.checked)
                        }
                        className="h-4 w-4"
                      />

                      <span className="text-sm font-semibold text-[#344054]">
                        {label}
                      </span>
                    </label>
                  ))}

                  <div className="md:col-span-2">
                    <FieldLabel>Other Specify</FieldLabel>

                    <input
                      value={form.otherAffiliation}
                      onChange={(e) =>
                        setForm({ ...form, otherAffiliation: e.target.value })
                      }
                      placeholder="Other affiliation or certification"
                      className={inputClass()}
                    />
                  </div>
                </div>
              </div>

              <div className="rounded-xl border border-[#E6ECF2] bg-white p-5 shadow-sm">
                <h3 className="mb-4 text-sm font-bold text-[#101828]">
                  Training Attended
                </h3>

                <textarea
                  value={form.trainingAttended}
                  onChange={(e) =>
                    setForm({ ...form, trainingAttended: e.target.value })
                  }
                  placeholder="List trainings attended"
                  rows={4}
                  className={textareaClass()}
                />
              </div>

              <div className="rounded-xl border border-[#E6ECF2] bg-white p-5 shadow-sm">
                <h3 className="mb-4 text-sm font-bold text-[#101828]">
                  Work Readiness Questions
                </h3>

                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  {[
                    ["fullyVaccinated", "Are you fully vaccinated?"],
                    ["comfortableOnSite", "Are you comfortable working on site?"],
                    [
                      "willingGraveyard",
                      "Are you willing to work in graveyard shift?",
                    ],
                    [
                      "remoteWorkAccess",
                      "If this is a remote position, do you have access to a computer, Internet connection, and a private space?",
                    ],
                    [
                      "willingDrugTest",
                      "Are you willing to undertake a drug test as part of this hiring process?",
                    ],
                    [
                      "willingBackgroundCheck",
                      "Are you willing to undergo a background check as part of this hiring process?",
                    ],
                  ].map(([field, label]) => (
                    <div key={field}>
                      <FieldLabel>{label}</FieldLabel>

                      <select
                        value={form[field]}
                        onChange={(e) =>
                          setForm({ ...form, [field]: e.target.value })
                        }
                        className={inputClass()}
                      >
                        <option value="">Select answer</option>
                        <option value="Yes">Yes</option>
                        <option value="No">No</option>
                      </select>
                    </div>
                  ))}

                  <div className="md:col-span-2">
                    <FieldLabel>
                      Are you interested in full-time employment, part-time, or
                      either?
                    </FieldLabel>

                    <select
                      value={form.employmentInterest}
                      onChange={(e) =>
                        setForm({
                          ...form,
                          employmentInterest: e.target.value,
                        })
                      }
                      className={inputClass()}
                    >
                      <option value="">Select employment preference</option>
                      <option value="Full-time">Full-time</option>
                      <option value="Part-time">Part-time</option>
                      <option value="Either">Either</option>
                    </select>
                  </div>

                  <div className="md:col-span-2">
                    <FieldLabel>
                      Please list three references and their contact information
                    </FieldLabel>

                    <textarea
                      value={form.references}
                      onChange={(e) =>
                        setForm({ ...form, references: e.target.value })
                      }
                      placeholder={
                        "Reference 1: Name / Contact / Relationship\nReference 2: Name / Contact / Relationship\nReference 3: Name / Contact / Relationship"
                      }
                      rows={5}
                      className={textareaClass()}
                    />
                  </div>

                  <div className="md:col-span-2">
                    <FieldLabel>Recruiter Remarks</FieldLabel>

                    <textarea
                      value={form.remarks}
                      onChange={(e) =>
                        setForm({ ...form, remarks: e.target.value })
                      }
                      placeholder="Internal TA notes."
                      rows={4}
                      className={textareaClass()}
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-5">
              <div
                className={`rounded-xl border p-5 ${
                  isMinor
                    ? "border-red-100 bg-red-50"
                    : "border-blue-100 bg-blue-50"
                }`}
              >
                <h3
                  className={`text-sm font-bold ${
                    isMinor ? "text-red-700" : "text-sibs-primary-1"
                  }`}
                >
                  Age Validation
                </h3>

                <p
                  className={`mt-2 text-sm leading-6 ${
                    isMinor ? "text-red-700/90" : "text-sibs-primary-1/80"
                  }`}
                >
                  {age === null
                    ? "Enter date of birth to calculate age as of application date."
                    : isMinor
                      ? `Applicant is ${age} years old and below 18 years old. The system will prevent saving.`
                      : `Applicant is ${age} years old and meets the 18 years old age validation.`}
                </p>
              </div>

              <div className="rounded-xl border border-blue-100 bg-blue-50 p-5">
                <h3 className="text-sm font-bold text-sibs-primary-1">
                  Candidate Entry Rule
                </h3>

                <p className="mt-2 text-sm leading-6 text-sibs-primary-1/80">
                  Every manually added candidate starts as{" "}
                  <span className="font-bold">New Applicant</span>. TA should
                  update the classification only after review.
                </p>
              </div>

              <div className="rounded-xl border border-amber-100 bg-amber-50 p-5">
                <h3 className="text-sm font-bold text-amber-700">
                  Backend Later
                </h3>

                <p className="mt-2 text-sm leading-6 text-amber-700/90">
                  The backend should also validate age using date of birth and
                  application date, not only frontend validation.
                </p>
              </div>
            </div>
          </div>
        </form>

        <div className="border-t border-gray-100 px-5 py-4 sm:px-6">
          <div className="flex flex-col justify-end gap-2 sm:flex-row">
            <button
              type="button"
              onClick={onReset}
              className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-[#E6ECF2] bg-white px-5 text-sm font-bold text-sibs-primary-1 transition hover:border-sibs-primary-1 hover:bg-sibs-primary-1/5"
            >
              <RotateCcw size={16} />
              Reset
            </button>

            <button
              type="submit"
              onClick={onSubmit}
              disabled={isMinor}
              className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-sibs-primary-1 px-5 text-sm font-bold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <UserPlus size={16} />
              Save Candidate
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function MoveToPipelineModal({
  open,
  candidate,
  form,
  setForm,
  onClose,
  onSubmit,
}) {
  if (!open || !candidate) return null;

  function handleRequirementChange(hiringRequirementId) {
    const selectedRequirement = hiringRequirementOptions.find(
      (item) => item.id === hiringRequirementId
    );

    if (!selectedRequirement) {
      setForm({
        ...form,
        hiringRequirementId: "",
        jobDescriptionId: "",
        roleTitle: "",
        account: "",
        taOwner: "",
      });
      return;
    }

    setForm({
      ...form,
      hiringRequirementId: selectedRequirement.id,
      jobDescriptionId: selectedRequirement.jobDescriptionId,
      roleTitle: selectedRequirement.roleTitle,
      account: selectedRequirement.account,
      taOwner: selectedRequirement.taOwner,
    });
  }

  const selectedRequirement = hiringRequirementOptions.find(
    (item) => item.id === form.hiringRequirementId
  );

  return (
    <div
      className="fixed inset-0 z-[10000] flex h-dvh items-center justify-center bg-black/40 px-4 py-4"
      onClick={onClose}
    >
      <div
        className="flex max-h-[92dvh] w-full max-w-4xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4 border-b border-gray-100 px-5 py-4 sm:px-6 sm:py-5">
          <div className="min-w-0">
            <h2 className="text-lg font-bold text-sibs-primary-1 sm:text-xl">
              Move Candidate to Pipeline
            </h2>

            <p className="mt-1 text-sm font-medium text-sibs-tertiary-5">
              This creates an active candidate application for a specific hiring
              requirement.
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="shrink-0 rounded-full p-2 text-gray-400 transition hover:bg-gray-100 hover:text-gray-700"
            aria-label="Close modal"
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={onSubmit} className="flex-1 overflow-y-auto p-4 sm:p-6">
          <div className="grid grid-cols-1 gap-5 xl:grid-cols-[1fr_320px]">
            <div className="space-y-5">
              <div className="rounded-xl border border-blue-100 bg-blue-50 p-5">
                <p className="text-sm font-bold text-sibs-primary-1">
                  {candidate.candidateId} — {candidate.name}
                </p>

                <p className="mt-1 text-xs font-semibold text-sibs-primary-1/70">
                  {candidate.roleCapability} / {candidate.skillsLanguage} /
                  Source: {candidate.source}
                </p>
              </div>

              <div className="rounded-xl border border-[#E6ECF2] bg-white p-5 shadow-sm">
                <h3 className="mb-4 text-sm font-bold text-[#101828]">
                  Pipeline Assignment
                </h3>

                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div className="md:col-span-2">
                    <FieldLabel>
                      Hiring Requirement <span className="text-red-500">*</span>
                    </FieldLabel>

                    <select
                      required
                      value={form.hiringRequirementId}
                      onChange={(e) => handleRequirementChange(e.target.value)}
                      className={inputClass()}
                    >
                      <option value="">Select hiring requirement</option>
                      {hiringRequirementOptions.map((item) => (
                        <option key={item.id} value={item.id}>
                          {item.id} — {item.roleTitle} / {item.account}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <FieldLabel>Role Title</FieldLabel>

                    <input
                      readOnly
                      value={form.roleTitle}
                      className="h-11 w-full cursor-not-allowed rounded-xl border border-[#E6ECF2] bg-[#F8FAFC] px-4 text-sm font-semibold text-gray-500 outline-none"
                    />
                  </div>

                  <div>
                    <FieldLabel>Account</FieldLabel>

                    <input
                      readOnly
                      value={form.account}
                      className="h-11 w-full cursor-not-allowed rounded-xl border border-[#E6ECF2] bg-[#F8FAFC] px-4 text-sm font-semibold text-gray-500 outline-none"
                    />
                  </div>

                  <div>
                    <FieldLabel>Job Description</FieldLabel>

                    <input
                      readOnly
                      value={selectedRequirement?.jobDescription || ""}
                      className="h-11 w-full cursor-not-allowed rounded-xl border border-[#E6ECF2] bg-[#F8FAFC] px-4 text-sm font-semibold text-gray-500 outline-none"
                    />
                  </div>

                  <div>
                    <FieldLabel>
                      TA Owner <span className="text-red-500">*</span>
                    </FieldLabel>

                    <input
                      required
                      value={form.taOwner}
                      onChange={(e) =>
                        setForm({ ...form, taOwner: e.target.value })
                      }
                      placeholder="Recruiter / TA Owner"
                      className={inputClass()}
                    />
                  </div>

                  <div>
                    <FieldLabel>Initial Stage</FieldLabel>

                    <select
                      value={form.initialStage}
                      onChange={(e) =>
                        setForm({ ...form, initialStage: e.target.value })
                      }
                      className={inputClass()}
                    >
                      <option value="Sourced">Sourced</option>
                      <option value="Screened">Screened</option>
                      <option value="Interviewed">Interviewed</option>
                    </select>
                  </div>

                  <div className="md:col-span-2">
                    <FieldLabel>Remarks</FieldLabel>

                    <textarea
                      rows={4}
                      value={form.remarks}
                      onChange={(e) =>
                        setForm({ ...form, remarks: e.target.value })
                      }
                      placeholder="Example: Reactivated from New Applicant for urgent CSR backfill."
                      className={textareaClass()}
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-5">
              <div className="rounded-xl border border-[#E6ECF2] bg-[#F8FAFC] p-5">
                <h3 className="text-sm font-bold text-[#101828]">
                  What will happen?
                </h3>

                <div className="mt-4">
                  <DetailRow
                    label="Candidate Master"
                    value="Kept as one record"
                  />
                  <DetailRow
                    label="Application Record"
                    value="Created in Pipeline"
                  />
                  <DetailRow label="Initial Stage" value={form.initialStage} />
                  <DetailRow
                    label="Status"
                    value="Active candidate application"
                  />
                </div>
              </div>

              <div className="rounded-xl border border-amber-100 bg-amber-50 p-5">
                <h3 className="text-sm font-bold text-amber-700">Important</h3>

                <p className="mt-2 text-sm leading-6 text-amber-700/90">
                  This does not duplicate the candidate. It only creates a new
                  application record connected to the selected hiring
                  requirement.
                </p>
              </div>
            </div>
          </div>
        </form>

        <div className="border-t border-gray-100 px-5 py-4 sm:px-6">
          <div className="flex flex-col justify-end gap-2 sm:flex-row">
            <button
              type="button"
              onClick={onClose}
              className="inline-flex h-11 items-center justify-center rounded-xl border border-[#E6ECF2] bg-white px-5 text-sm font-bold text-gray-600 transition hover:bg-gray-50"
            >
              Cancel
            </button>

            <button
              type="submit"
              onClick={onSubmit}
              className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-sibs-primary-1 px-5 text-sm font-bold text-white transition hover:opacity-90"
            >
              <ArrowRight size={16} />
              Move to Pipeline
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function CandidateProfileModal({
  open,
  candidate,
  onClose,
  onOpenStatus,
  onOpenMoveToPipeline,
}) {
  if (!open || !candidate) return null;

  const affiliationsText =
    candidate.affiliations && candidate.affiliations.length > 0
      ? candidate.affiliations.join(", ")
      : "—";

  return (
    <div
      className="fixed inset-0 z-[9999] flex h-dvh items-center justify-center bg-black/40 px-4 py-4"
      onClick={onClose}
    >
      <div
        className="flex max-h-[92dvh] w-full max-w-6xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4 border-b border-gray-100 px-5 py-4 sm:px-6 sm:py-5">
          <div className="min-w-0">
            <h2 className="text-lg font-bold text-sibs-primary-1 sm:text-xl">
              Candidate Profile
            </h2>

            <p className="mt-1 text-sm font-medium text-sibs-tertiary-5">
              Persistent candidate record and reusable talent profile.
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="shrink-0 rounded-full p-2 text-gray-400 transition hover:bg-gray-100 hover:text-gray-700"
            aria-label="Close modal"
          >
            <X size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 sm:p-6">
          <div className="grid grid-cols-1 gap-5 xl:grid-cols-[1fr_340px]">
            <div className="space-y-5">
              <div className="rounded-xl border border-[#E6ECF2] bg-white p-5 shadow-sm">
                <div className="flex flex-col gap-4 md:flex-row md:items-center">
                  <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-xl bg-sibs-primary-1 text-xl font-bold text-white">
                    {candidate.name
                      .split(" ")
                      .map((word) => word[0])
                      .join("")
                      .slice(0, 2)}
                  </div>

                  <div className="min-w-0 flex-1">
                    <h3 className="break-words text-xl font-bold text-[#101828]">
                      {candidate.name}
                    </h3>

                    <p className="mt-1 text-sm font-semibold text-sibs-tertiary-5">
                      {candidate.candidateId}
                    </p>

                    <div className="mt-3 flex flex-wrap gap-2">
                      <span
                        className={`inline-flex rounded-full border px-3 py-1 text-xs font-bold ${getStatusClass(
                          candidate.status
                        )}`}
                      >
                        {candidate.status}
                      </span>

                      <span className="inline-flex rounded-full border border-gray-200 bg-gray-50 px-3 py-1 text-xs font-bold text-gray-600">
                        {candidate.roleCapability}
                      </span>

                      <span className="inline-flex rounded-full border border-gray-200 bg-gray-50 px-3 py-1 text-xs font-bold text-gray-600">
                        {candidate.source}
                      </span>

                      {candidate.isPublicSubmission && (
                        <span className="inline-flex rounded-full border border-purple-200 bg-purple-50 px-3 py-1 text-xs font-bold text-purple-700">
                          Public Submission
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <InfoBox icon={Mail} label="Email" value={candidate.email} />
                <InfoBox
                  icon={Phone}
                  label="Phone Number 1"
                  value={candidate.phoneNumber1 || candidate.contactNumber}
                />
                <InfoBox
                  icon={Phone}
                  label="Phone Number 2"
                  value={candidate.phoneNumber2}
                />
                <InfoBox
                  icon={CalendarDays}
                  label="Date of Birth / Age"
                  value={`${formatDate(candidate.dateOfBirth)} / ${
                    candidate.ageAsOfApplication || "—"
                  }`}
                />
                <InfoBox
                  icon={MapPin}
                  label="Physical Address"
                  value={candidate.physicalAddress}
                />
                <InfoBox
                  icon={BriefcaseBusiness}
                  label="Role Capability"
                  value={candidate.roleCapability}
                />
              </div>

              <div className="rounded-xl border border-[#E6ECF2] bg-white p-5 shadow-sm">
                <div className="mb-4 flex items-center gap-2">
                  <GraduationCap size={18} className="text-sibs-primary-1" />
                  <h3 className="text-sm font-bold text-[#101828]">
                    Education, Certifications, and Trainings
                  </h3>
                </div>

                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <InfoBox
                    icon={GraduationCap}
                    label="Educational Attainment"
                    value={candidate.educationalAttainment}
                  />
                  <InfoBox
                    icon={ShieldCheck}
                    label="Affiliations / Certifications"
                    value={affiliationsText}
                  />
                  <InfoBox
                    icon={ClipboardList}
                    label="Training Attended"
                    value={candidate.trainingAttended}
                  />
                </div>
              </div>

              <div className="rounded-xl border border-[#E6ECF2] bg-white p-5 shadow-sm">
                <div className="mb-4 flex items-center gap-2">
                  <Tags size={18} className="text-sibs-primary-1" />
                  <h3 className="text-sm font-bold text-[#101828]">
                    Skills / Language Tags
                  </h3>
                </div>

                <div className="flex flex-wrap gap-2">
                  {(candidate.tags || []).map((tag) => (
                    <span
                      key={tag}
                      className="rounded-full border border-blue-100 bg-blue-50 px-3 py-1 text-xs font-bold text-blue-700"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>

              <div className="rounded-xl border border-[#E6ECF2] bg-white p-5 shadow-sm">
                <div className="mb-4 flex items-center gap-2">
                  <History size={18} className="text-sibs-primary-1" />
                  <h3 className="text-sm font-bold text-[#101828]">
                    Application History
                  </h3>
                </div>

                <div className="space-y-3">
                  {candidate.applicationHistory &&
                  candidate.applicationHistory.length > 0 ? (
                    candidate.applicationHistory.map((item, index) => (
                      <div
                        key={`${item.role}-${index}`}
                        className="rounded-xl border border-[#E6ECF2] bg-[#F8FAFC] p-4"
                      >
                        <div className="flex flex-col justify-between gap-2 md:flex-row md:items-center">
                          <div>
                            <p className="text-sm font-bold text-[#101828]">
                              {item.role}
                            </p>

                            <p className="text-xs font-semibold text-sibs-tertiary-5">
                              {item.account}
                            </p>
                          </div>

                          <div className="text-left md:text-right">
                            <p className="text-xs font-bold text-sibs-primary-1">
                              {item.outcome}
                            </p>

                            <p className="text-xs text-sibs-tertiary-5">
                              {formatDate(item.date)}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="rounded-xl border border-dashed border-[#E6ECF2] bg-[#F8FAFC] p-5 text-center text-xs font-bold text-sibs-tertiary-5">
                      No application history yet.
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="space-y-5">
              <div className="rounded-xl border border-[#E6ECF2] bg-[#F8FAFC] p-5">
                <h3 className="text-sm font-bold text-[#101828]">
                  Talent Pool Details
                </h3>

                <div className="mt-4">
                  <DetailRow label="Account Fit" value={candidate.accountFit} />
                  <DetailRow
                    label="Availability"
                    value={candidate.availability}
                  />
                  <DetailRow label="Source" value={candidate.source} />
                  <DetailRow label="Status" value={candidate.status} />
                  <DetailRow
                    label="Last Activity"
                    value={formatDate(candidate.lastActivity)}
                  />
                </div>
              </div>

              <div className="rounded-xl border border-[#E6ECF2] bg-[#F8FAFC] p-5">
                <h3 className="text-sm font-bold text-[#101828]">
                  Work Readiness
                </h3>

                <div className="mt-4">
                  <DetailRow
                    label="Fully Vaccinated"
                    value={candidate.fullyVaccinated}
                  />
                  <DetailRow
                    label="Comfortable On Site"
                    value={candidate.comfortableOnSite}
                  />
                  <DetailRow
                    label="Graveyard Shift"
                    value={candidate.willingGraveyard}
                  />
                  <DetailRow
                    label="Employment Interest"
                    value={candidate.employmentInterest}
                  />
                  <DetailRow
                    label="Remote Access"
                    value={candidate.remoteWorkAccess}
                  />
                  <DetailRow
                    label="Drug Test"
                    value={candidate.willingDrugTest}
                  />
                  <DetailRow
                    label="Background Check"
                    value={candidate.willingBackgroundCheck}
                  />
                </div>
              </div>

              <div className="rounded-xl border border-[#E6ECF2] bg-white p-5 shadow-sm">
                <h3 className="text-sm font-bold text-[#101828]">References</h3>

                <p className="mt-3 whitespace-pre-line rounded-xl border border-[#E6ECF2] bg-[#F8FAFC] p-4 text-sm leading-6 text-[#344054]">
                  {candidate.references || "No references provided."}
                </p>
              </div>

              <div className="rounded-xl border border-[#E6ECF2] bg-white p-5 shadow-sm">
                <h3 className="text-sm font-bold text-[#101828]">
                  Recruiter Remarks
                </h3>

                <p className="mt-3 whitespace-pre-line rounded-xl border border-[#E6ECF2] bg-[#F8FAFC] p-4 text-sm leading-6 text-[#344054]">
                  {candidate.remarks || "No remarks provided."}
                </p>
              </div>

              <div className="rounded-xl border border-blue-100 bg-blue-50 p-5">
                <h3 className="text-sm font-bold text-sibs-primary-1">
                  Pipeline Rule
                </h3>

                <p className="mt-2 text-sm leading-6 text-sibs-primary-1/80">
                  Move to Pipeline creates an active application for a specific
                  hiring requirement. The candidate master profile remains here.
                </p>
              </div>

              <div className="rounded-xl border border-[#E6ECF2] bg-white p-5 shadow-sm">
                <h3 className="text-sm font-bold text-[#101828]">Actions</h3>

                <div className="mt-4 space-y-2">
                  <button
                    type="button"
                    onClick={() => onOpenStatus(candidate)}
                    className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl border border-[#E6ECF2] bg-white px-5 text-sm font-bold text-sibs-primary-1 transition hover:border-sibs-primary-1 hover:bg-sibs-primary-1/5"
                  >
                    <Pencil size={16} />
                    Update Status
                  </button>

                  {candidate.status !== "Do Not Reprocess" ? (
                    <button
                      type="button"
                      onClick={() => onOpenMoveToPipeline(candidate)}
                      className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-sibs-primary-1 px-5 text-sm font-bold text-white transition hover:opacity-90"
                    >
                      <KanbanSquare size={16} />
                      Move to Pipeline
                    </button>
                  ) : (
                    <div className="rounded-xl border border-red-100 bg-red-50 p-4">
                      <p className="text-xs font-bold text-red-700">
                        This candidate is marked Do Not Reprocess and cannot be
                        moved to pipeline.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="border-t border-gray-100 px-5 py-4 sm:px-6">
          <div className="flex justify-end">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl bg-sibs-primary-1 px-5 py-2.5 text-sm font-bold text-white transition hover:opacity-90"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function UpdateStatusModal({
  open,
  candidate,
  form,
  setForm,
  onClose,
  onSubmit,
}) {
  if (!open || !candidate) return null;

  return (
    <div
      className="fixed inset-0 z-[10000] flex h-dvh items-center justify-center bg-black/40 px-4 py-4"
      onClick={onClose}
    >
      <div
        className="flex max-h-[92dvh] w-full max-w-xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4 border-b border-gray-100 px-5 py-4 sm:px-6 sm:py-5">
          <div className="min-w-0">
            <h2 className="text-lg font-bold text-sibs-primary-1 sm:text-xl">
              Update Candidate Status
            </h2>

            <p className="mt-1 text-sm font-medium text-sibs-tertiary-5">
              Change candidate classification after TA review.
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="shrink-0 rounded-full p-2 text-gray-400 transition hover:bg-gray-100 hover:text-gray-700"
            aria-label="Close modal"
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={onSubmit} className="flex-1 overflow-y-auto p-4 sm:p-6">
          <div className="rounded-xl border border-blue-100 bg-blue-50 p-4">
            <p className="text-sm font-bold text-sibs-primary-1">
              {candidate.candidateId} — {candidate.name}
            </p>

            <p className="mt-1 text-xs font-semibold text-sibs-primary-1/70">
              Current Status: {candidate.status}
            </p>
          </div>

          <div className="mt-5">
            <FieldLabel>Status</FieldLabel>

            <select
              required
              value={form.status}
              onChange={(e) => setForm({ ...form, status: e.target.value })}
              className={inputClass()}
            >
              {statusOptions
                .filter((status) => status !== "All")
                .map((status) => (
                  <option key={status} value={status}>
                    {status}
                  </option>
                ))}
            </select>
          </div>

          <div className="mt-5">
            <FieldLabel>Status Remarks</FieldLabel>

            <textarea
              rows={4}
              value={form.remarks}
              onChange={(e) => setForm({ ...form, remarks: e.target.value })}
              placeholder="Explain why this status was changed."
              className={textareaClass()}
            />
          </div>

          <div className="mt-6 flex flex-col justify-end gap-2 sm:flex-row">
            <button
              type="button"
              onClick={onClose}
              className="inline-flex h-11 items-center justify-center rounded-xl border border-[#E6ECF2] bg-white px-5 text-sm font-bold text-gray-600 transition hover:bg-gray-50"
            >
              Cancel
            </button>

            <button
              type="submit"
              className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-sibs-primary-1 px-5 text-sm font-bold text-white transition hover:opacity-90"
            >
              <Pencil size={16} />
              Save Status
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function TalentPoolPage() {
  const [candidateList, setCandidateList] = useState(initialCandidates);

  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("All");
  const [statusFilter, setStatusFilter] = useState("All");
  const [skillFilter, setSkillFilter] = useState("All");
  const [availabilityFilter, setAvailabilityFilter] = useState("All");

  const [selectedCandidate, setSelectedCandidate] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [candidateForm, setCandidateForm] = useState(emptyCandidateForm);

  const [statusTarget, setStatusTarget] = useState(null);
  const [statusForm, setStatusForm] = useState(emptyStatusForm);

  const [pipelineTarget, setPipelineTarget] = useState(null);
  const [moveToPipelineForm, setMoveToPipelineForm] = useState(
    emptyMoveToPipelineForm
  );

  useEffect(() => {
    const savedCandidates = readLocalStorage(INTERNAL_CANDIDATES_KEY, null);

    if (savedCandidates && Array.isArray(savedCandidates)) {
      setCandidateList(savedCandidates);
      return;
    }

    const publicSubmissions = readLocalStorage(PUBLIC_SUBMISSIONS_KEY, []);

    if (publicSubmissions.length > 0) {
      const imported = publicSubmissions.map((submission, index) => ({
        id: initialCandidates.length + index + 1,
        candidateId:
          submission.candidateId ||
          generateCandidateId(initialCandidates.length + index + 1),
        firstName: submission.firstName || "",
        middleName: submission.middleName || "",
        lastName: submission.lastName || "",
        extension: submission.extension || "",
        name:
          submission.name ||
          buildFullName({
            firstName: submission.firstName || "",
            middleName: submission.middleName || "",
            lastName: submission.lastName || "",
            extension: submission.extension || "",
          }),
        dateOfBirth: submission.dateOfBirth || "",
        ageAsOfApplication: submission.dateOfBirth
          ? calculateAge(submission.dateOfBirth)
          : null,
        physicalAddress: submission.physicalAddress || "",
        email: submission.email,
        contactNumber: submission.phoneNumber1 || submission.contactNumber,
        phoneNumber1: submission.phoneNumber1 || submission.contactNumber,
        phoneNumber2: submission.phoneNumber2 || "",
        roleCapability: submission.roleCapability,
        skillsLanguage: submission.skillsLanguage,
        educationalAttainment: submission.educationalAttainment || "",
        affiliations: submission.affiliations || [],
        cpa: submission.cpa || false,
        lpt: submission.lpt || false,
        masterDegreeHolder: submission.masterDegreeHolder || false,
        doctorateHolder: submission.doctorateHolder || false,
        leanSixSigmaBeltHolder: submission.leanSixSigmaBeltHolder || false,
        otherAffiliation: submission.otherAffiliation || "",
        trainingAttended: submission.trainingAttended || "",
        fullyVaccinated: submission.fullyVaccinated || "",
        comfortableOnSite: submission.comfortableOnSite || "",
        willingGraveyard: submission.willingGraveyard || "",
        employmentInterest: submission.employmentInterest || "",
        remoteWorkAccess: submission.remoteWorkAccess || "",
        willingDrugTest: submission.willingDrugTest || "",
        willingBackgroundCheck: submission.willingBackgroundCheck || "",
        references: submission.references || "",
        status: "New Applicant",
        source: submission.source || "Public Application",
        availability: submission.availability,
        accountFit: submission.accountFit || "N/A",
        lastActivity: submission.submittedAt || getTodayDate(),
        tags: normalizeTags(submission.roleCapability, submission.skillsLanguage),
        isPublicSubmission: true,
        applicationHistory: [
          {
            role: submission.appliedRole || submission.roleCapability,
            account: submission.accountFit || "Unassigned",
            outcome: "Public Application Submitted",
            date: submission.submittedAt || getTodayDate(),
          },
        ],
        remarks: submission.remarks || "Submitted from public applicant form.",
      }));

      const merged = [...imported, ...initialCandidates];
      setCandidateList(merged);
      writeLocalStorage(INTERNAL_CANDIDATES_KEY, merged);
    }
  }, []);

  useEffect(() => {
    writeLocalStorage(INTERNAL_CANDIDATES_KEY, candidateList);
  }, [candidateList]);

  function handleResetCandidateForm() {
    setCandidateForm(emptyCandidateForm);
  }

  function handleOpenPublicForm() {
    window.open(
      "/recruitment/talent-pool/apply",
      "_blank",
      "noopener,noreferrer"
    );
  }

  function handleAddCandidate(e) {
    e.preventDefault();

    const age = calculateAge(candidateForm.dateOfBirth);

    if (age !== null && age < 18) {
      alert("Applicant is below 18 years old as of date of application.");
      return;
    }

    const nextId =
      candidateList.length > 0
        ? Math.max(...candidateList.map((candidate) => candidate.id)) + 1
        : 1;

    const today = getTodayDate();
    const fullName = buildFullName(candidateForm);

    const affiliations = [
      candidateForm.cpa ? "CPA" : null,
      candidateForm.lpt ? "LPT" : null,
      candidateForm.masterDegreeHolder ? "Master Degree Holder" : null,
      candidateForm.doctorateHolder ? "Doctorate Holder" : null,
      candidateForm.leanSixSigmaBeltHolder
        ? "Lean Six Sigma Belt Holder"
        : null,
      candidateForm.otherAffiliation?.trim() || null,
    ].filter(Boolean);

    const applicationHistory =
      candidateForm.appliedRole || candidateForm.appliedAccount
        ? [
            {
              role: candidateForm.appliedRole || candidateForm.roleCapability,
              account:
                candidateForm.appliedAccount ||
                candidateForm.accountFit ||
                "Unassigned",
              outcome: candidateForm.applicationOutcome,
              date: today,
            },
          ]
        : [];

    const newCandidate = {
      id: nextId,
      candidateId: generateCandidateId(nextId),
      firstName: candidateForm.firstName.trim(),
      middleName: candidateForm.middleName.trim(),
      lastName: candidateForm.lastName.trim(),
      extension: candidateForm.extension.trim(),
      name: fullName,
      dateOfBirth: candidateForm.dateOfBirth,
      ageAsOfApplication: age,
      physicalAddress: candidateForm.physicalAddress.trim(),
      email: candidateForm.email.trim(),
      contactNumber: candidateForm.phoneNumber1.trim(),
      phoneNumber1: candidateForm.phoneNumber1.trim(),
      phoneNumber2: candidateForm.phoneNumber2.trim(),
      roleCapability: candidateForm.roleCapability,
      skillsLanguage: candidateForm.skillsLanguage,
      educationalAttainment: candidateForm.educationalAttainment,
      affiliations,
      cpa: candidateForm.cpa,
      lpt: candidateForm.lpt,
      masterDegreeHolder: candidateForm.masterDegreeHolder,
      doctorateHolder: candidateForm.doctorateHolder,
      leanSixSigmaBeltHolder: candidateForm.leanSixSigmaBeltHolder,
      otherAffiliation: candidateForm.otherAffiliation.trim(),
      trainingAttended: candidateForm.trainingAttended.trim(),
      fullyVaccinated: candidateForm.fullyVaccinated,
      comfortableOnSite: candidateForm.comfortableOnSite,
      willingGraveyard: candidateForm.willingGraveyard,
      employmentInterest: candidateForm.employmentInterest,
      remoteWorkAccess: candidateForm.remoteWorkAccess,
      willingDrugTest: candidateForm.willingDrugTest,
      willingBackgroundCheck: candidateForm.willingBackgroundCheck,
      references: candidateForm.references.trim(),
      status: "New Applicant",
      source: candidateForm.source,
      availability: candidateForm.availability,
      accountFit: candidateForm.accountFit || "N/A",
      lastActivity: today,
      tags: normalizeTags(
        candidateForm.roleCapability,
        candidateForm.skillsLanguage
      ),
      isPublicSubmission: false,
      applicationHistory,
      remarks: candidateForm.remarks,
    };

    setCandidateList((prev) => [newCandidate, ...prev]);
    setSelectedCandidate(newCandidate);
    setCandidateForm(emptyCandidateForm);
    setShowAddModal(false);
  }

  function handleOpenStatus(candidate) {
    setStatusTarget(candidate);
    setStatusForm({
      status: candidate.status,
      remarks: "",
    });
  }

  function handleCloseStatus() {
    setStatusTarget(null);
    setStatusForm(emptyStatusForm);
  }

  function handleSubmitStatus(e) {
    e.preventDefault();

    if (!statusTarget) return;

    const today = getTodayDate();

    const updatedRemarks = statusForm.remarks.trim()
      ? `${statusTarget.remarks || ""}\n\nStatus updated to ${
          statusForm.status
        } on ${today}: ${statusForm.remarks.trim()}`
      : statusTarget.remarks;

    const updatedCandidate = {
      ...statusTarget,
      status: statusForm.status,
      lastActivity: today,
      remarks: updatedRemarks,
      applicationHistory: [
        ...(statusTarget.applicationHistory || []),
        {
          role: statusTarget.roleCapability,
          account: statusTarget.accountFit || "Unassigned",
          outcome: `Status Updated: ${statusForm.status}`,
          date: today,
        },
      ],
    };

    setCandidateList((prev) =>
      prev.map((candidate) =>
        candidate.id === statusTarget.id ? updatedCandidate : candidate
      )
    );

    setSelectedCandidate(updatedCandidate);
    handleCloseStatus();
  }

  function handleOpenMoveToPipeline(candidate) {
    setPipelineTarget(candidate);
    setMoveToPipelineForm({
      ...emptyMoveToPipelineForm,
      roleTitle: candidate.roleCapability || "",
      account: candidate.accountFit === "N/A" ? "" : candidate.accountFit,
    });
  }

  function handleCloseMoveToPipeline() {
    setPipelineTarget(null);
    setMoveToPipelineForm(emptyMoveToPipelineForm);
  }

  function handleSubmitMoveToPipeline(e) {
    e.preventDefault();

    if (!pipelineTarget) return;

    if (pipelineTarget.status === "Do Not Reprocess") {
      alert("This candidate is marked Do Not Reprocess.");
      return;
    }

    if (!moveToPipelineForm.hiringRequirementId) {
      alert("Hiring Requirement is required.");
      return;
    }

    const selectedRequirement = hiringRequirementOptions.find(
      (item) => item.id === moveToPipelineForm.hiringRequirementId
    );

    if (!selectedRequirement) {
      alert("Selected hiring requirement is invalid.");
      return;
    }

    const today = getTodayDate();
    const existingApplications = readLocalStorage(
      CANDIDATE_APPLICATIONS_KEY,
      []
    );

    const duplicateActiveApplication = existingApplications.some(
      (application) =>
        application.candidateId === pipelineTarget.candidateId &&
        application.hiringRequirementId === selectedRequirement.id &&
        application.applicationStatus === "Active"
    );

    if (duplicateActiveApplication) {
      alert(
        "This candidate is already active in the pipeline for this requirement."
      );
      return;
    }

    const newApplication = {
      id: Date.now(),
      applicationId: generateApplicationId(),
      candidateId: pipelineTarget.candidateId,
      candidateMasterId: pipelineTarget.id,
      candidateName: pipelineTarget.name,
      email: pipelineTarget.email,
      contactNumber: pipelineTarget.phoneNumber1 || pipelineTarget.contactNumber,
      hiringRequirementId: selectedRequirement.id,
      jobDescriptionId: selectedRequirement.jobDescriptionId,
      jobDescription: selectedRequirement.jobDescription,
      roleTitle: selectedRequirement.roleTitle,
      account: selectedRequirement.account,
      taOwner: moveToPipelineForm.taOwner || selectedRequirement.taOwner,
      currentStage: moveToPipelineForm.initialStage,
      applicationStatus: "Active",
      source: pipelineTarget.source,
      fromTalentPool: true,
      remarks: moveToPipelineForm.remarks.trim(),
      createdAt: today,
      updatedAt: today,
      stageHistory: [
        {
          fromStage: "Talent Pool",
          toStage: moveToPipelineForm.initialStage,
          owner: moveToPipelineForm.taOwner || selectedRequirement.taOwner,
          reason:
            moveToPipelineForm.remarks.trim() ||
            "Moved from Talent Pool to Candidate Pipeline",
          timestamp: new Date().toISOString(),
        },
      ],
    };

    const updatedApplications = [newApplication, ...existingApplications];

    writeLocalStorage(CANDIDATE_APPLICATIONS_KEY, updatedApplications);

    const updatedCandidate = {
      ...pipelineTarget,
      status:
        pipelineTarget.status === "New Applicant"
          ? "Recyclable"
          : pipelineTarget.status,
      lastActivity: today,
      applicationHistory: [
        ...(pipelineTarget.applicationHistory || []),
        {
          role: selectedRequirement.roleTitle,
          account: selectedRequirement.account,
          outcome: `Moved to Pipeline - ${moveToPipelineForm.initialStage}`,
          date: today,
        },
      ],
      remarks: moveToPipelineForm.remarks.trim()
        ? `${pipelineTarget.remarks || ""}\n\nMoved to Pipeline (${today}): ${moveToPipelineForm.remarks.trim()}`
        : pipelineTarget.remarks,
    };

    setCandidateList((prev) =>
      prev.map((candidate) =>
        candidate.id === pipelineTarget.id ? updatedCandidate : candidate
      )
    );

    setSelectedCandidate(updatedCandidate);
    handleCloseMoveToPipeline();

    alert("Candidate moved to Candidate Pipeline.");
  }

  const filteredCandidates = useMemo(() => {
    const keyword = search.trim().toLowerCase();

    return candidateList.filter((candidate) => {
      const matchesSearch =
        !keyword ||
        String(candidate.name || "").toLowerCase().includes(keyword) ||
        String(candidate.email || "").toLowerCase().includes(keyword) ||
        String(candidate.candidateId || "").toLowerCase().includes(keyword) ||
        String(candidate.roleCapability || "").toLowerCase().includes(keyword) ||
        String(candidate.skillsLanguage || "").toLowerCase().includes(keyword) ||
        String(candidate.source || "").toLowerCase().includes(keyword);

      const matchesRole =
        roleFilter === "All" || candidate.roleCapability === roleFilter;

      const matchesStatus =
        statusFilter === "All" || candidate.status === statusFilter;

      const matchesSkill =
        skillFilter === "All" ||
        String(candidate.skillsLanguage || "")
          .toLowerCase()
          .includes(skillFilter.toLowerCase()) ||
        (candidate.tags || []).some((tag) =>
          tag.toLowerCase().includes(skillFilter.toLowerCase())
        );

      const matchesAvailability =
        availabilityFilter === "All" ||
        candidate.availability === availabilityFilter;

      return (
        matchesSearch &&
        matchesRole &&
        matchesStatus &&
        matchesSkill &&
        matchesAvailability
      );
    });
  }, [
    candidateList,
    search,
    roleFilter,
    statusFilter,
    skillFilter,
    availabilityFilter,
  ]);

  const stats = useMemo(() => {
    return {
      total: candidateList.length,
      silverPool: candidateList.filter(
        (candidate) => candidate.status === "Silver Pool"
      ).length,
      recyclable: candidateList.filter(
        (candidate) => candidate.status === "Recyclable"
      ).length,
      doNotReprocess: candidateList.filter(
        (candidate) => candidate.status === "Do Not Reprocess"
      ).length,
      hiredActive: candidateList.filter(
        (candidate) => candidate.status === "Hired / Active"
      ).length,
      publicSubmissions: candidateList.filter(
        (candidate) => candidate.isPublicSubmission
      ).length,
    };
  }, [candidateList]);

  return (
    <div className="flex h-full min-h-0 min-w-0 flex-1 flex-col overflow-hidden bg-sibs-tertiary-10 font-jakarta">
      <Header />

      <main className="min-h-0 min-w-0 flex-1 overflow-y-auto overflow-x-hidden bg-sibs-tertiary-10 p-4 sm:p-6">
        <div className="mb-6">
          <div className="flex items-center gap-2">
            <UsersRound size={28} className="shrink-0 text-sibs-primary-1" />

            <h1 className="min-w-0 break-words text-2xl font-bold text-sibs-primary-1 sm:text-4xl">
              Talent Pool / Candidate Database
            </h1>
          </div>

          <p className="mt-1 text-sm text-sibs-tertiary-5">
            Build reusable candidate profiles and move qualified candidates to
            active pipeline
          </p>
        </div>

        <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-6">
          <StatCard
            title="Total Candidates"
            value={stats.total}
            icon={UsersRound}
            description="Persistent profiles"
          />
          <StatCard
            title="Silver Pool"
            value={stats.silverPool}
            icon={UserCheck}
            description="Passed, no opening"
          />
          <StatCard
            title="Recyclable"
            value={stats.recyclable}
            icon={RefreshCcw}
            description="Can be reconsidered"
          />
          <StatCard
            title="Do Not Reprocess"
            value={stats.doNotReprocess}
            icon={Ban}
            description="Not fit"
          />
          <StatCard
            title="Hired / Active"
            value={stats.hiredActive}
            icon={BriefcaseBusiness}
            description="Converted"
          />
          <StatCard
            title="Public Entries"
            value={stats.publicSubmissions}
            icon={ExternalLink}
            description="From outside form"
          />
        </div>

        <div className="mb-6 grid grid-cols-1 gap-4 lg:grid-cols-[1fr_auto] lg:items-center">
          <div className="rounded-xl bg-white p-4 shadow-sm">
            <h3 className="mb-2 font-semibold text-sibs-primary-1">
              Candidate Master Profiles
            </h3>

            <p className="text-sm text-sibs-tertiary-5">
              Talent Pool stores the master candidate profile. Moving to
              Pipeline creates a separate application record.
            </p>
          </div>

          <div className="flex flex-col gap-2 sm:flex-row">
            <button
              type="button"
              onClick={handleOpenPublicForm}
              className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-[#E6ECF2] bg-white px-5 text-sm font-bold text-sibs-primary-1 transition hover:border-sibs-primary-1 hover:bg-sibs-primary-1/5"
            >
              <ExternalLink size={18} />
              Public Form
            </button>

            <button
              type="button"
              onClick={() => setShowAddModal(true)}
              className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-sibs-primary-1 px-5 text-sm font-bold text-white shadow-sm transition hover:opacity-90"
            >
              <Plus size={18} />
              Add Candidate
            </button>
          </div>
        </div>

        <section className="overflow-hidden rounded-xl bg-white shadow-sm">
          <div className="border-b border-gray-100 p-4 sm:p-6">
            <div className="grid grid-cols-1 gap-3 xl:grid-cols-[1fr_180px_190px_190px_190px_auto] xl:items-center">
              <div className="relative">
                <Search
                  size={17}
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-sibs-tertiary-5"
                />

                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search candidate by name, email, ID, role, source, or skills..."
                  className={inputClass("pl-11 pr-4")}
                />
              </div>

              <select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
                className={inputClass()}
              >
                {roleOptions.map((role) => (
                  <option key={role} value={role}>
                    {role === "All" ? "Role Capability" : role}
                  </option>
                ))}
              </select>

              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className={inputClass()}
              >
                {statusOptions.map((status) => (
                  <option key={status} value={status}>
                    {status === "All" ? "Status" : status}
                  </option>
                ))}
              </select>

              <select
                value={skillFilter}
                onChange={(e) => setSkillFilter(e.target.value)}
                className={inputClass()}
              >
                {skillOptions.map((skill) => (
                  <option key={skill} value={skill}>
                    {skill === "All" ? "Skills / Language" : skill}
                  </option>
                ))}
              </select>

              <select
                value={availabilityFilter}
                onChange={(e) => setAvailabilityFilter(e.target.value)}
                className={inputClass()}
              >
                {availabilityOptions.map((availability) => (
                  <option key={availability} value={availability}>
                    {availability === "All" ? "Availability" : availability}
                  </option>
                ))}
              </select>

              <button
                type="button"
                className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-[#E6ECF2] bg-white px-4 text-sm font-bold text-sibs-primary-1 transition hover:border-sibs-primary-1 hover:bg-sibs-primary-1/5"
              >
                <Filter size={17} />
                Filters
              </button>
            </div>
          </div>

          <div className="p-4 sm:p-6">
            <div className="space-y-3 lg:hidden">
              {filteredCandidates.length > 0 ? (
                filteredCandidates.map((candidate) => (
                  <TalentPoolMobileCard
                    key={candidate.id}
                    candidate={candidate}
                    onView={() => setSelectedCandidate(candidate)}
                  />
                ))
              ) : (
                <div className="rounded-xl border border-[#E6ECF2] bg-white px-5 py-10 text-center text-sm font-bold text-gray-500">
                  No candidate profiles found.
                </div>
              )}
            </div>

            <div className="hidden overflow-hidden rounded-xl border border-[#E6ECF2] lg:block">
              <div className="max-h-[520px] overflow-auto">
                <table className="w-full min-w-[1180px] border-collapse text-left">
                  <thead className="sticky top-0 z-10 bg-[#F8FAFC]">
                    <tr className="text-xs font-bold uppercase tracking-wide text-sibs-tertiary-5">
                      <th className="px-5 py-4">Candidate</th>
                      <th className="px-5 py-4">Role Capability</th>
                      <th className="px-5 py-4">Skills / Language</th>
                      <th className="px-5 py-4">Status</th>
                      <th className="px-5 py-4">Source</th>
                      <th className="px-5 py-4">Availability</th>
                      <th className="px-5 py-4">Last Activity</th>
                      <th className="px-5 py-4 text-right">Actions</th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-gray-100 bg-white">
                    {filteredCandidates.length > 0 ? (
                      filteredCandidates.map((candidate) => (
                        <tr
                          key={candidate.id}
                          className="transition hover:bg-[#F8FAFC]"
                        >
                          <td className="px-5 py-4">
                            <p className="text-sm font-bold text-[#101828]">
                              {candidate.name}
                            </p>

                            <p className="text-xs font-semibold text-sibs-tertiary-5">
                              {candidate.email}
                            </p>

                            {candidate.isPublicSubmission && (
                              <p className="mt-1 text-[11px] font-bold text-purple-600">
                                Public Submission
                              </p>
                            )}
                          </td>

                          <td className="px-5 py-4 text-sm font-bold text-sibs-primary-1">
                            {candidate.roleCapability}
                          </td>

                          <td className="px-5 py-4 text-sm font-semibold text-[#344054]">
                            {candidate.skillsLanguage}
                          </td>

                          <td className="px-5 py-4">
                            <span
                              className={`inline-flex rounded-full border px-3 py-1 text-xs font-bold ${getStatusClass(
                                candidate.status
                              )}`}
                            >
                              {candidate.status}
                            </span>
                          </td>

                          <td className="px-5 py-4 text-sm font-semibold text-[#344054]">
                            {candidate.source}
                          </td>

                          <td className="px-5 py-4 text-sm font-semibold text-[#344054]">
                            {candidate.availability}
                          </td>

                          <td className="px-5 py-4 text-sm font-semibold text-[#344054]">
                            {formatDate(candidate.lastActivity)}
                          </td>

                          <td className="px-5 py-4 text-right">
                            <button
                              type="button"
                              onClick={() => setSelectedCandidate(candidate)}
                              className="inline-flex items-center justify-center gap-2 rounded-xl border border-[#E6ECF2] bg-white px-4 py-2 text-xs font-bold text-sibs-primary-1 transition hover:border-sibs-primary-1 hover:bg-sibs-primary-1/5"
                            >
                              <Eye size={15} />
                              View
                            </button>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td
                          colSpan={8}
                          className="px-5 py-12 text-center text-sm font-bold text-gray-500"
                        >
                          No candidate profiles found.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="mt-5 flex flex-col justify-between gap-4 md:flex-row md:items-center">
              <p className="text-sm font-semibold text-sibs-tertiary-5">
                Showing 1 to {filteredCandidates.length} of{" "}
                {candidateList.length} candidate profiles
              </p>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  className="flex h-9 w-9 items-center justify-center rounded-lg border border-[#E6ECF2] text-gray-500 transition hover:bg-gray-50"
                >
                  <ChevronLeft size={16} />
                </button>

                <button
                  type="button"
                  className="flex h-9 w-9 items-center justify-center rounded-lg bg-sibs-primary-1 text-sm font-bold text-white"
                >
                  1
                </button>

                <button
                  type="button"
                  className="flex h-9 w-9 items-center justify-center rounded-lg border border-[#E6ECF2] text-sm font-bold text-gray-600 transition hover:bg-gray-50"
                >
                  2
                </button>

                <button
                  type="button"
                  className="flex h-9 w-9 items-center justify-center rounded-lg border border-[#E6ECF2] text-gray-500 transition hover:bg-gray-50"
                >
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>
          </div>
        </section>

        <section className="mt-6 rounded-xl border border-blue-100 bg-blue-50 p-5">
          <h3 className="text-sm font-bold text-sibs-primary-1">
            Talent Pool Design Note
          </h3>

          <p className="mt-2 text-sm leading-6 text-sibs-primary-1/80">
            Talent Pool stores the candidate master profile. Move to Pipeline
            creates a separate candidate application tied to a hiring
            requirement.
          </p>
        </section>
      </main>

      <AddCandidateModal
        open={showAddModal}
        form={candidateForm}
        setForm={setCandidateForm}
        onClose={() => setShowAddModal(false)}
        onSubmit={handleAddCandidate}
        onReset={handleResetCandidateForm}
      />

      <CandidateProfileModal
        open={!!selectedCandidate}
        candidate={selectedCandidate}
        onClose={() => setSelectedCandidate(null)}
        onOpenStatus={handleOpenStatus}
        onOpenMoveToPipeline={handleOpenMoveToPipeline}
      />

      <UpdateStatusModal
        open={!!statusTarget}
        candidate={statusTarget}
        form={statusForm}
        setForm={setStatusForm}
        onClose={handleCloseStatus}
        onSubmit={handleSubmitStatus}
      />

      <MoveToPipelineModal
        open={!!pipelineTarget}
        candidate={pipelineTarget}
        form={moveToPipelineForm}
        setForm={setMoveToPipelineForm}
        onClose={handleCloseMoveToPipeline}
        onSubmit={handleSubmitMoveToPipeline}
      />
    </div>
  );
}