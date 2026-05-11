import React, { useEffect, useMemo, useState } from "react";
import Header from "../../../components/layout/Header";
import { useUser } from "../../../services/context/UserContext";
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
  ExternalLink,
  X,
  RotateCcw,
  Save,
  ArrowRight,
  FileText,
  Phone,
  Mail,
  MapPin,
  ClipboardList,
  GraduationCap,
  ShieldCheck,
  UserRound,
  Trash2,
  Pencil,
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

const hearAboutUsOptions = [
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

const openPositionOptions = [
  "Customer Service Representative",
  "QA Specialist",
  "RCM Analyst",
  "IT Support",
  "HR Assistant",
  "System Developer",
  "Accounting Staff",
];

const locationOptions = ["Davao Site", "Tagum Site", "Mabini Site"];

const accountOptions = [
  "All Accounts",
  "Collect IV",
  "Collect AR",
  "Connect",
  "DentistRX",
  "Reconciliation",
  "TeleDentistry",
  "Cash",
  "US Visa",
  "Channel Assist",
  "Yomdel",
];

const roleOptions = [
  "All",
  "Customer Service Representative",
  "QA Specialist",
  "RCM Analyst",
  "IT Support",
  "HR Assistant",
  "System Developer",
  "Accounting Staff",
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
  ...hearAboutUsOptions,
  "Public Application",
  "Talent Pool Reactivation",
];

const workExperienceOptions = [
  "Has work Experience (at least 6 months relevant work experience)",
  "No work Experience",
];

const lengthOfWorkExperienceOptions = [
  "6 months to 11 months",
  "1 year to 2 years",
  "3 years to 4 years",
  "5 years and above",
];

const educationalAttainmentOptions = [
  "Secondary (Grade 11 and Grade 12)",
  "Tertiary (College Level or College Degree Holder)",
  "Tertiary (Graduate School Level or Graduate Holder)",
  "Tertiary (Doctorate Level or Doctorate Holder or equivalent)",
];

const affiliationOptions = [
  "CPA",
  "LPT",
  "Master Degree Holder",
  "Doctorate Holder",
  "Lean Six Sigma Belt Holder",
  "NC II Holder",
  "Civil Service Eligible",
  "Others",
];

const yesNoOptions = ["Yes", "No"];

const employmentInterestOptions = [
  "Full Time",
  "Part Time",
  "Full Time or Part Time",
];

const initialCandidates = [
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
    workExperience: "Has work Experience (at least 6 months relevant work experience)",
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
    accountFit: "Collect IV",
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

const emptyExperience = {
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

const emptyCandidateForm = {
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
  attachmentFileName: "",
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
  initialStage: "Lead / Sourced",
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
    candidate.suffix || candidate.extension,
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


function formatList(value) {
  if (Array.isArray(value)) return value.filter(Boolean).join(", ") || "—";
  return value || "—";
}

function formatReferences(references) {
  if (!Array.isArray(references)) return references || "—";

  return references
    .filter((reference) => reference?.name || reference?.phone)
    .map((reference, index) =>
      `${index + 1}. ${reference?.name || "—"}${reference?.phone ? ` / ${reference.phone}` : ""}`
    )
    .join("\n") || "—";
}

function getPrimaryExperienceSummary(candidate) {
  if (candidate.workExperience === "No work Experience") return "No work Experience";

  const experiences = Array.isArray(candidate.workExperiences)
    ? candidate.workExperiences.filter(Boolean)
    : [];

  if (!experiences.length) return candidate.workExperience || "—";

  return experiences
    .map((experience, index) => {
      const parts = [
        experience.industry,
        experience.role,
        experience.company,
        experience.years ? `${experience.years} year(s)` : "",
        experience.monthlyCompensation ? `₱${experience.monthlyCompensation}` : "",
      ].filter(Boolean);

      return `${index + 1}. ${parts.join(" • ")}`;
    })
    .join("\n");
}

function getReadinessSummary(candidate) {
  return [
    `Vaccinated: ${candidate.fullyVaccinated || "—"}`,
    `On-site: ${candidate.comfortableOnSite || "—"}`,
    `Graveyard: ${candidate.willingGraveyard || "—"}`,
    `Employment: ${candidate.employmentInterest || "—"}`,
    `Remote: ${candidate.remoteWorkAccess || "—"}`,
    `Drug Test: ${candidate.willingDrugTest || "—"}`,
    `Background Check: ${candidate.willingBackgroundCheck || "—"}`,
  ].join("\n");
}

function formatCurrency(value) {
  if (!value) return "—";
  const numberValue = Number(String(value).replace(/,/g, ""));
  if (Number.isNaN(numberValue)) return value;
  return numberValue.toLocaleString("en-PH", {
    style: "currency",
    currency: "PHP",
    maximumFractionDigits: 0,
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

function normalizeCandidateRecord(candidate) {
  const openPosition = candidate.openPosition || candidate.roleCapability || "";
  const source =
    candidate.source ||
    (Array.isArray(candidate.hearAboutUs) && candidate.hearAboutUs.length
      ? candidate.hearAboutUs.join(", ")
      : "Public Application");

  return {
    ...candidate,
    suffix: candidate.suffix || candidate.extension || "",
    extension: candidate.extension || candidate.suffix || "",
    name: candidate.name || buildFullName(candidate),
    openPosition,
    roleCapability: candidate.roleCapability || openPosition,
    hearAboutUs: Array.isArray(candidate.hearAboutUs)
      ? candidate.hearAboutUs
      : candidate.hearAboutUs
        ? [candidate.hearAboutUs]
        : source
          ? [source]
          : [],
    contactNumber: candidate.phoneNumber1 || candidate.contactNumber || "",
    phoneNumber1: candidate.phoneNumber1 || candidate.contactNumber || "",
    phoneNumber2: candidate.phoneNumber2 || "",
    workExperience: candidate.workExperience || "",
    workExperiences: Array.isArray(candidate.workExperiences)
      ? candidate.workExperiences
      : [],
    educationalAttainment: candidate.educationalAttainment || "",
    affiliations: Array.isArray(candidate.affiliations)
      ? candidate.affiliations
      : [],
    references: Array.isArray(candidate.references)
      ? candidate.references
      : [
          { name: candidate.references || "", phone: "" },
          { name: "", phone: "" },
          { name: "", phone: "" },
        ],
    applyingLocation: candidate.applyingLocation || "",
    referredBy: candidate.referredBy || "",
    employeeId: candidate.employeeId || "",
    nickname: candidate.nickname || "",
    audioFileName: candidate.audioFileName || "",
    attachmentFileName: candidate.attachmentFileName || "",
    source,
    availability: candidate.availability || "Available",
    accountFit: candidate.accountFit || candidate.appliedAccount || "N/A",
    lastActivity: candidate.lastActivity || candidate.submittedAt || getTodayDate(),
    tags: candidate.tags || normalizeTags(openPosition, candidate.skillsLanguage),
  };
}


function candidateToForm(candidate) {
  const normalized = normalizeCandidateRecord(candidate || {});
  const references = Array.isArray(normalized.references)
    ? [...normalized.references]
    : [];

  while (references.length < 3) {
    references.push({ name: "", phone: "" });
  }

  return {
    ...emptyCandidateForm,
    ...normalized,
    hearAboutUs: Array.isArray(normalized.hearAboutUs) ? normalized.hearAboutUs : [],
    suffix: normalized.suffix || normalized.extension || "",
    workExperiences:
      Array.isArray(normalized.workExperiences) && normalized.workExperiences.length > 0
        ? normalized.workExperiences
        : [{ ...emptyExperience }],
    affiliations: Array.isArray(normalized.affiliations) ? normalized.affiliations : [],
    references: references.slice(0, 3).map((item) => ({
      name: item?.name || "",
      phone: item?.phone || "",
    })),
    accountFit: normalized.accountFit === "N/A" ? "" : normalized.accountFit || "",
    consent: Boolean(normalized.consent ?? true),
  };
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

function FieldLabel({ children }) {
  return (
    <label className="mb-1 block text-[11px] font-bold uppercase tracking-wide text-sibs-tertiary-5">
      {children}
    </label>
  );
}

function SectionTitle({ icon: Icon, title, description }) {
  return (
    <div className="mb-4 flex items-start gap-3">
      {Icon && (
        <div className="rounded-xl bg-sibs-primary-1/10 p-2 text-sibs-primary-1">
          <Icon size={18} />
        </div>
      )}
      <div>
        <h3 className="text-sm font-extrabold text-[#101828]">{title}</h3>
        {description && (
          <p className="mt-1 text-xs font-semibold leading-5 text-sibs-tertiary-5">
            {description}
          </p>
        )}
      </div>
    </div>
  );
}

function DetailRow({ label, value }) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-gray-100 py-3 last:border-b-0">
      <p className="text-[11px] font-bold uppercase tracking-wide text-sibs-tertiary-5">
        {label}
      </p>
      <p className="max-w-[62%] whitespace-pre-line break-words text-right text-sm font-bold text-[#344054]">
        {value || "—"}
      </p>
    </div>
  );
}

function MultiCheckGroup({ options, value, onChange, columns = "md:grid-cols-2" }) {
  const selected = Array.isArray(value) ? value : [];

  function toggle(option) {
    if (selected.includes(option)) {
      onChange(selected.filter((item) => item !== option));
      return;
    }
    onChange([...selected, option]);
  }

  return (
    <div className={`grid grid-cols-1 gap-2 ${columns}`}>
      {options.map((option) => (
        <label
          key={option}
          className="flex items-center gap-3 rounded-xl border border-[#E6ECF2] bg-[#F8FAFC] px-4 py-3 text-sm font-semibold text-[#344054]"
        >
          <input
            type="checkbox"
            checked={selected.includes(option)}
            onChange={() => toggle(option)}
            className="h-4 w-4"
          />
          {option}
        </label>
      ))}
    </div>
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
            Position
          </p>
          <p className="mt-1 text-xs font-bold text-[#344054]">
            {candidate.openPosition || candidate.roleCapability || "—"}
          </p>
        </div>

        <div className="rounded-lg bg-[#F8FAFC] p-3">
          <p className="text-[10px] font-bold uppercase text-sibs-tertiary-5">
            Location
          </p>
          <p className="mt-1 text-xs font-bold text-[#344054]">
            {candidate.applyingLocation || "—"}
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
    </button>
  );
}

function ExperienceFields({ experience, index, total, onChange, onRemove }) {
  function update(field, value) {
    onChange(index, { ...experience, [field]: value });
  }

  return (
    <div className="rounded-2xl border border-[#E6ECF2] bg-[#F8FAFC] p-4">
      <div className="mb-4 flex items-center justify-between gap-3">
        <h4 className="text-sm font-extrabold text-sibs-primary-1">
          Industry or Relevant Experience {index + 1}
        </h4>

        {total > 1 && (
          <button
            type="button"
            onClick={() => onRemove(index)}
            className="inline-flex h-9 items-center justify-center gap-2 rounded-xl border border-red-100 bg-red-50 px-3 text-xs font-bold text-red-700 transition hover:bg-red-100"
          >
            <Trash2 size={14} />
            Remove
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div>
          <FieldLabel>Industry or Relevant Experience</FieldLabel>
          <input
            value={experience.industry}
            onChange={(e) => update("industry", e.target.value)}
            placeholder="BPO, Healthcare, Accounting, IT"
            className={inputClass()}
          />
        </div>

        <div>
          <FieldLabel>
            Length of Work Experience <span className="text-red-500">*</span>
          </FieldLabel>
          <select
            required
            value={experience.lengthOfWorkExperience}
            onChange={(e) => update("lengthOfWorkExperience", e.target.value)}
            className={inputClass()}
          >
            <option value="">Select length</option>
            {lengthOfWorkExperienceOptions.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>
        </div>

        <div>
          <FieldLabel>
            Years <span className="text-red-500">*</span>
          </FieldLabel>
          <input
            required
            value={experience.years}
            onChange={(e) => update("years", e.target.value)}
            placeholder="Example: 2"
            className={inputClass()}
          />
        </div>

        <div>
          <FieldLabel>
            Role <span className="text-red-500">*</span>
          </FieldLabel>
          <input
            required
            value={experience.role}
            onChange={(e) => update("role", e.target.value)}
            placeholder="Example: CSR"
            className={inputClass()}
          />
        </div>

        <div>
          <FieldLabel>
            Company <span className="text-red-500">*</span>
          </FieldLabel>
          <input
            required
            value={experience.company}
            onChange={(e) => update("company", e.target.value)}
            placeholder="Company name"
            className={inputClass()}
          />
        </div>

        <div>
          <FieldLabel>
            Monthly Compensation <span className="text-red-500">*</span>
          </FieldLabel>
          <input
            required
            value={experience.monthlyCompensation}
            onChange={(e) => update("monthlyCompensation", e.target.value)}
            placeholder="Example: 18000"
            className={inputClass()}
          />
        </div>

        <div className="md:col-span-2">
          <FieldLabel>
            Reason for Leaving <span className="text-red-500">*</span>
          </FieldLabel>
          <textarea
            required
            rows={3}
            value={experience.reasonForLeaving}
            onChange={(e) => update("reasonForLeaving", e.target.value)}
            placeholder="Reason for leaving previous company"
            className={textareaClass()}
          />
        </div>

        <div className="md:col-span-2">
          <FieldLabel>Do you have other experience?</FieldLabel>
          <select
            value={experience.hasOtherExperience}
            onChange={(e) => update("hasOtherExperience", e.target.value)}
            className={inputClass()}
          >
            <option value="No">No</option>
            <option value="Yes">Yes</option>
          </select>
        </div>
      </div>
    </div>
  );
}

function AddCandidateModal({ open, form, setForm, onClose, onSubmit, onReset, mode = "add" }) {
  if (!open) return null;

  const age = calculateAge(form.dateOfBirth);
  const isMinor = age !== null && age < 18;
  const hasExperience = form.workExperience === workExperienceOptions[0];

  function updateExperience(index, nextExperience) {
    const nextExperiences = form.workExperiences.map((item, itemIndex) =>
      itemIndex === index ? nextExperience : item
    );

    const shouldAddAnother =
      nextExperience.hasOtherExperience === "Yes" &&
      index === form.workExperiences.length - 1;

    setForm({
      ...form,
      workExperiences: shouldAddAnother
        ? [
            ...nextExperiences,
            { ...emptyExperience, id: Date.now(), hasOtherExperience: "No" },
          ]
        : nextExperiences,
    });
  }

  function removeExperience(index) {
    const next = form.workExperiences.filter((_, itemIndex) => itemIndex !== index);
    setForm({
      ...form,
      workExperiences: next.length > 0 ? next : [{ ...emptyExperience }],
    });
  }

  function addExperience() {
    setForm({
      ...form,
      workExperiences: [
        ...form.workExperiences,
        { ...emptyExperience, id: Date.now(), hasOtherExperience: "No" },
      ],
    });
  }

  return (
    <div
      className="fixed inset-0 z-[10000] flex h-dvh items-center justify-center bg-black/40 px-4 py-4"
      onClick={onClose}
    >
      <div
        className="flex max-h-[94dvh] w-full max-w-6xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4 border-b border-gray-100 px-5 py-4 sm:px-6">
          <div>
            <h2 className="text-lg font-bold text-sibs-primary-1 sm:text-xl">
              {mode === "edit" ? "Edit Candidate Details" : "Add Candidate to Talent Pool"}
            </h2>
            <p className="mt-1 text-sm font-medium text-sibs-tertiary-5">
              {mode === "edit" ? "Update the candidate master profile using the same public form fields." : "Same input fields as the public candidate form."}
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-2 text-gray-400 transition hover:bg-gray-100 hover:text-gray-700"
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={onSubmit} className="flex-1 overflow-y-auto p-4 sm:p-6">
          <div className="space-y-5">
            <section className="rounded-2xl border border-[#E6ECF2] bg-white p-5 shadow-sm">
              <SectionTitle
                icon={ClipboardList}
                title="Application Source and Position"
                description="Capture how the applicant discovered the company and the opening they are applying for."
              />

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div className="md:col-span-2">
                  <FieldLabel>
                    How did you first hear about us? <span className="text-red-500">*</span>
                  </FieldLabel>
                  <MultiCheckGroup
                    options={hearAboutUsOptions}
                    value={form.hearAboutUs}
                    onChange={(value) => setForm({ ...form, hearAboutUs: value })}
                    columns="md:grid-cols-3"
                  />
                </div>

                <div>
                  <FieldLabel>
                    Check our open positions <span className="text-red-500">*</span>
                  </FieldLabel>
                  <select
                    required
                    value={form.openPosition}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        openPosition: e.target.value,
                        roleCapability: e.target.value,
                        appliedRole: e.target.value,
                      })
                    }
                    className={inputClass()}
                  >
                    <option value="">Select open position</option>
                    {openPositionOptions.map((position) => (
                      <option key={position} value={position}>
                        {position}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <FieldLabel>Nickname</FieldLabel>
                  <input
                    value={form.nickname}
                    onChange={(e) => setForm({ ...form, nickname: e.target.value })}
                    placeholder="Nickname"
                    className={inputClass()}
                  />
                </div>

                <div>
                  <FieldLabel>
                    Which location are you applying for? <span className="text-red-500">*</span>
                  </FieldLabel>
                  <select
                    required
                    value={form.applyingLocation}
                    onChange={(e) => setForm({ ...form, applyingLocation: e.target.value })}
                    className={inputClass()}
                  >
                    <option value="">Select location</option>
                    {locationOptions.map((location) => (
                      <option key={location} value={location}>
                        {location}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <FieldLabel>
                    Who referred you to us? <span className="text-red-500">*</span>
                  </FieldLabel>
                  <input
                    required
                    value={form.referredBy}
                    onChange={(e) => setForm({ ...form, referredBy: e.target.value })}
                    placeholder="Referral name or N/A"
                    className={inputClass()}
                  />
                </div>

                <div>
                  <FieldLabel>
                    Employee ID <span className="text-red-500">*</span>
                  </FieldLabel>
                  <input
                    required
                    value={form.employeeId}
                    onChange={(e) => setForm({ ...form, employeeId: e.target.value })}
                    placeholder="Referrer employee ID or N/A"
                    className={inputClass()}
                  />
                </div>
              </div>
            </section>

            <section className="rounded-2xl border border-[#E6ECF2] bg-white p-5 shadow-sm">
              <SectionTitle icon={UserRound} title="Personal Information" />

              <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
                <div>
                  <FieldLabel>
                    First Name <span className="text-red-500">*</span>
                  </FieldLabel>
                  <input
                    required
                    value={form.firstName}
                    onChange={(e) => setForm({ ...form, firstName: e.target.value })}
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
                    onChange={(e) => setForm({ ...form, lastName: e.target.value })}
                    className={inputClass()}
                  />
                </div>

                <div>
                  <FieldLabel>Middle Name</FieldLabel>
                  <input
                    value={form.middleName}
                    onChange={(e) => setForm({ ...form, middleName: e.target.value })}
                    className={inputClass()}
                  />
                </div>

                <div>
                  <FieldLabel>Suffix</FieldLabel>
                  <input
                    value={form.suffix}
                    onChange={(e) => setForm({ ...form, suffix: e.target.value })}
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
                    onChange={(e) => setForm({ ...form, dateOfBirth: e.target.value })}
                    className={`${inputClass()} ${
                      isMinor ? "border-red-300 focus:border-red-500 focus:ring-red-500/10" : ""
                    }`}
                  />
                  {age !== null && (
                    <p className={`mt-2 text-xs font-bold ${isMinor ? "text-red-600" : "text-emerald-600"}`}>
                      Age: {age}{isMinor ? " — below 18 years old" : ""}
                    </p>
                  )}
                </div>

                <div>
                  <FieldLabel>
                    Email <span className="text-red-500">*</span>
                  </FieldLabel>
                  <input
                    required
                    type="email"
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    className={inputClass()}
                  />
                </div>

                <div>
                  <FieldLabel>Phone 1</FieldLabel>
                  <input
                    value={form.phoneNumber1}
                    onChange={(e) => setForm({ ...form, phoneNumber1: e.target.value })}
                    className={inputClass()}
                  />
                </div>

                <div>
                  <FieldLabel>Phone 2</FieldLabel>
                  <input
                    value={form.phoneNumber2}
                    onChange={(e) => setForm({ ...form, phoneNumber2: e.target.value })}
                    className={inputClass()}
                  />
                </div>

                <div className="md:col-span-4">
                  <FieldLabel>
                    Physical Address <span className="text-red-500">*</span>
                  </FieldLabel>
                  <input
                    required
                    value={form.physicalAddress}
                    onChange={(e) => setForm({ ...form, physicalAddress: e.target.value })}
                    className={inputClass()}
                  />
                </div>
              </div>
            </section>

            <section className="rounded-2xl border border-[#E6ECF2] bg-white p-5 shadow-sm">
              <SectionTitle
                icon={BriefcaseBusiness}
                title="Work Experience"
                description="If the applicant has at least 6 months relevant work experience, additional experience fields will show."
              />

              <div className="grid grid-cols-1 gap-4">
                <div>
                  <FieldLabel>
                    Work Experience <span className="text-red-500">*</span>
                  </FieldLabel>
                  <select
                    required
                    value={form.workExperience}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        workExperience: e.target.value,
                        workExperiences:
                          e.target.value === workExperienceOptions[0]
                            ? form.workExperiences.length
                              ? form.workExperiences
                              : [{ ...emptyExperience }]
                            : [{ ...emptyExperience }],
                      })
                    }
                    className={inputClass()}
                  >
                    <option value="">Select work experience</option>
                    {workExperienceOptions.map((item) => (
                      <option key={item} value={item}>
                        {item}
                      </option>
                    ))}
                  </select>
                </div>

                {hasExperience && (
                  <div className="space-y-4">
                    {form.workExperiences.map((experience, index) => (
                      <ExperienceFields
                        key={experience.id || index}
                        experience={experience}
                        index={index}
                        total={form.workExperiences.length}
                        onChange={updateExperience}
                        onRemove={removeExperience}
                      />
                    ))}

                    <button
                      type="button"
                      onClick={addExperience}
                      className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-sibs-primary-1/20 bg-sibs-primary-1/5 px-4 text-sm font-bold text-sibs-primary-1 transition hover:bg-sibs-primary-1/10"
                    >
                      <Plus size={16} />
                      Add Other Experience
                    </button>
                  </div>
                )}
              </div>
            </section>

            <section className="rounded-2xl border border-[#E6ECF2] bg-white p-5 shadow-sm">
              <SectionTitle icon={GraduationCap} title="Education and Certifications" />

              <div className="grid grid-cols-1 gap-4">
                <div>
                  <FieldLabel>
                    Highest Educational Attainment <span className="text-red-500">*</span>
                  </FieldLabel>
                  <select
                    required
                    value={form.educationalAttainment}
                    onChange={(e) =>
                      setForm({ ...form, educationalAttainment: e.target.value })
                    }
                    className={inputClass()}
                  >
                    <option value="">Select educational attainment</option>
                    {educationalAttainmentOptions.map((item) => (
                      <option key={item} value={item}>
                        {item}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <FieldLabel>Affiliations and Certifications</FieldLabel>
                  <MultiCheckGroup
                    options={affiliationOptions}
                    value={form.affiliations}
                    onChange={(value) => setForm({ ...form, affiliations: value })}
                    columns="md:grid-cols-3"
                  />
                </div>

                <div>
                  <FieldLabel>Training Attended</FieldLabel>
                  <textarea
                    rows={4}
                    value={form.trainingAttended}
                    onChange={(e) =>
                      setForm({ ...form, trainingAttended: e.target.value })
                    }
                    className={textareaClass()}
                  />
                </div>
              </div>
            </section>

            <section className="rounded-2xl border border-[#E6ECF2] bg-white p-5 shadow-sm">
              <SectionTitle icon={ShieldCheck} title="Work Readiness Questions" />

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                {[
                  ["fullyVaccinated", "Are you fully vaccinated? *"],
                  ["comfortableOnSite", "Are you comfortable working on site? *"],
                  ["willingGraveyard", "Are you willing to work in graveyard shift? *"],
                  ["remoteWorkAccess", "If remote, do you have a computer, Internet connection and private space? *"],
                  ["willingDrugTest", "Are you willing to undertake a drug test? *"],
                  ["willingBackgroundCheck", "Are you willing to allow SiBS to undergo a background check? *"],
                ].map(([field, label]) => (
                  <div key={field}>
                    <FieldLabel>{label}</FieldLabel>
                    <select
                      required
                      value={form[field]}
                      onChange={(e) => setForm({ ...form, [field]: e.target.value })}
                      className={inputClass()}
                    >
                      <option value="">Select answer</option>
                      {yesNoOptions.map((item) => (
                        <option key={item} value={item}>
                          {item}
                        </option>
                      ))}
                    </select>
                  </div>
                ))}

                <div className="md:col-span-2">
                  <FieldLabel>
                    Are you interested in full-time employment, part-time or either?
                  </FieldLabel>
                  <select
                    value={form.employmentInterest}
                    onChange={(e) =>
                      setForm({ ...form, employmentInterest: e.target.value })
                    }
                    className={inputClass()}
                  >
                    <option value="">Select employment preference</option>
                    {employmentInterestOptions.map((item) => (
                      <option key={item} value={item}>
                        {item}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </section>

            <section className="rounded-2xl border border-[#E6ECF2] bg-white p-5 shadow-sm">
              <SectionTitle
                icon={Phone}
                title="References"
                description="Please list at least three references and their contact information."
              />

              <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                {form.references.map((reference, index) => (
                  <div key={index} className="rounded-2xl border border-[#E6ECF2] bg-[#F8FAFC] p-4">
                    <FieldLabel>
                      Reference {index + 1} <span className="text-red-500">*</span>
                    </FieldLabel>
                    <input
                      required
                      value={reference.name}
                      onChange={(e) => {
                        const next = [...form.references];
                        next[index] = { ...next[index], name: e.target.value };
                        setForm({ ...form, references: next });
                      }}
                      placeholder="Full name"
                      className={inputClass("mb-3")}
                    />

                    <FieldLabel>Phone</FieldLabel>
                    <input
                      value={reference.phone}
                      onChange={(e) => {
                        const next = [...form.references];
                        next[index] = { ...next[index], phone: e.target.value };
                        setForm({ ...form, references: next });
                      }}
                      placeholder="Phone number"
                      className={inputClass()}
                    />
                  </div>
                ))}
              </div>
            </section>

            <section className="rounded-2xl border border-[#E6ECF2] bg-white p-5 shadow-sm">
              <SectionTitle icon={FileText} title="Uploads and Consent" />

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div>
                  <FieldLabel>
                    Audio File <span className="text-red-500">*</span>
                  </FieldLabel>
                  <p className="mb-3 rounded-xl bg-[#F8FAFC] p-3 text-xs font-semibold leading-5 text-sibs-tertiary-5">
                    Upload a single audio file answering: why you applied, why you want to work with us, how this fits your long-term goals, and how you learned about the job.
                  </p>
                  <input
                    required={!form.audioFileName}
                    type="file"
                    accept="audio/*"
                    onChange={(e) =>
                      setForm({
                        ...form,
                        audioFileName: e.target.files?.[0]?.name || "",
                      })
                    }
                    className={inputClass("pt-2")}
                  />
                  {form.audioFileName && (
                    <p className="mt-2 text-xs font-bold text-sibs-primary-1">
                      Current file: {form.audioFileName}
                    </p>
                  )}
                </div>

                <div>
                  <FieldLabel>Supporting File</FieldLabel>
                  <p className="mb-3 rounded-xl bg-[#F8FAFC] p-3 text-xs font-semibold leading-5 text-sibs-tertiary-5">
                    Accepted: PDF, DOC/DOCX, XLS/CSV, JPG/JPEG, PNG, GIF.
                  </p>
                  <input
                    type="file"
                    accept=".pdf,.doc,.docx,.xls,.xlsx,.csv,.jpg,.jpeg,.png,.gif"
                    onChange={(e) =>
                      setForm({
                        ...form,
                        attachmentFileName: e.target.files?.[0]?.name || "",
                      })
                    }
                    className={inputClass("pt-2")}
                  />
                  {form.attachmentFileName && (
                    <p className="mt-2 text-xs font-bold text-sibs-primary-1">
                      Current file: {form.attachmentFileName}
                    </p>
                  )}
                </div>

                <div className="md:col-span-2">
                  <label className="flex items-start gap-3 rounded-2xl border border-[#E6ECF2] bg-[#F8FAFC] p-4">
                    <input
                      required
                      type="checkbox"
                      checked={form.consent}
                      onChange={(e) => setForm({ ...form, consent: e.target.checked })}
                      className="mt-1 h-4 w-4"
                    />
                    <span className="text-sm font-semibold leading-6 text-[#475467]">
                      I agree to terms & conditions provided by the company. By providing my phone number, I agree to receive text messages from the business.
                    </span>
                  </label>
                </div>
              </div>
            </section>

            <section className="rounded-2xl border border-[#E6ECF2] bg-white p-5 shadow-sm">
              <SectionTitle title="Internal Talent Pool Fields" />

              <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                <div>
                  <FieldLabel>Status</FieldLabel>
                  <select
                    value={form.status}
                    onChange={(e) => setForm({ ...form, status: e.target.value })}
                    className={inputClass()}
                  >
                    {statusOptions.filter((item) => item !== "All").map((item) => (
                      <option key={item} value={item}>
                        {item}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <FieldLabel>Source</FieldLabel>
                  <select
                    value={form.source}
                    onChange={(e) => setForm({ ...form, source: e.target.value })}
                    className={inputClass()}
                  >
                    <option value="">Select source</option>
                    {sourceOptions.map((item) => (
                      <option key={item} value={item}>
                        {item}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <FieldLabel>Availability</FieldLabel>
                  <select
                    value={form.availability}
                    onChange={(e) => setForm({ ...form, availability: e.target.value })}
                    className={inputClass()}
                  >
                    {availabilityOptions.filter((item) => item !== "All").map((item) => (
                      <option key={item} value={item}>
                        {item}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <FieldLabel>Account Fit</FieldLabel>
                  <select
                    value={form.accountFit}
                    onChange={(e) => setForm({ ...form, accountFit: e.target.value })}
                    className={inputClass()}
                  >
                    <option value="">Select account</option>
                    {accountOptions.filter((item) => item !== "All Accounts").map((account) => (
                      <option key={account} value={account}>
                        {account}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <FieldLabel>Skills / Language</FieldLabel>
                  <input
                    value={form.skillsLanguage}
                    onChange={(e) => setForm({ ...form, skillsLanguage: e.target.value })}
                    placeholder="English, Chat, RCM"
                    className={inputClass()}
                  />
                </div>

                <div className="md:col-span-3">
                  <FieldLabel>Remarks</FieldLabel>
                  <textarea
                    rows={3}
                    value={form.remarks}
                    onChange={(e) => setForm({ ...form, remarks: e.target.value })}
                    className={textareaClass()}
                  />
                </div>
              </div>
            </section>
          </div>
        </form>

        <div className="border-t border-gray-100 px-5 py-4 sm:px-6">
          <div className="flex flex-col justify-end gap-2 sm:flex-row">
            <button
              type="button"
              onClick={onReset}
              className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-[#E6ECF2] bg-white px-5 text-sm font-bold text-sibs-primary-1 transition hover:bg-[#F8FAFC]"
            >
              <RotateCcw size={16} />
              Reset
            </button>

            <button
              type="button"
              onClick={onClose}
              className="inline-flex h-11 items-center justify-center rounded-xl border border-[#E6ECF2] bg-white px-5 text-sm font-bold text-gray-600 transition hover:bg-gray-50"
            >
              Cancel
            </button>

            <button
              type="button"
              onClick={onSubmit}
              disabled={isMinor}
              className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-sibs-primary-1 px-5 text-sm font-bold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Save size={16} />
              {mode === "edit" ? "Update Candidate" : "Save Candidate"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function CandidateProfileModal({ open, candidate, onClose, onOpenStatus, onOpenMoveToPipeline, onOpenEditCandidate }) {
  if (!open || !candidate) return null;

  const workExperiences = Array.isArray(candidate.workExperiences)
    ? candidate.workExperiences
    : [];

  const references = Array.isArray(candidate.references) ? candidate.references : [];

  return (
    <div
      className="fixed inset-0 z-[9999] flex h-dvh items-center justify-center bg-black/40 px-4 py-4"
      onClick={onClose}
    >
      <div
        className="flex max-h-[92dvh] w-full max-w-5xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4 border-b border-gray-100 px-5 py-4 sm:px-6">
          <div>
            <h2 className="text-lg font-bold text-sibs-primary-1 sm:text-xl">
              Candidate Profile
            </h2>
            <p className="mt-1 text-sm font-medium text-sibs-tertiary-5">
              Complete Talent Pool profile and application details.
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-2 text-gray-400 transition hover:bg-gray-100 hover:text-gray-700"
          >
            <X size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 sm:p-6">
          <div className="grid grid-cols-1 gap-5 xl:grid-cols-[1fr_360px]">
            <div className="space-y-5">
              <section className="rounded-2xl border border-[#E6ECF2] bg-white p-5 shadow-sm">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <p className="text-xs font-bold text-sibs-primary-1">
                      {candidate.candidateId}
                    </p>
                    <h3 className="mt-1 text-2xl font-extrabold text-[#101828]">
                      {candidate.name}
                    </h3>
                    <p className="mt-1 text-sm font-semibold text-sibs-tertiary-5">
                      {candidate.openPosition || candidate.roleCapability || "—"}
                    </p>
                  </div>

                  <span className={`w-fit rounded-full border px-3 py-1 text-xs font-bold ${getStatusClass(candidate.status)}`}>
                    {candidate.status}
                  </span>
                </div>
              </section>

              <section className="rounded-2xl border border-[#E6ECF2] bg-white p-5 shadow-sm">
                <SectionTitle icon={ClipboardList} title="Application Source and Position" />
                <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                  <DetailRow label="Heard About Us" value={(candidate.hearAboutUs || []).join(", ")} />
                  <DetailRow label="Open Position" value={candidate.openPosition || candidate.roleCapability} />
                  <DetailRow label="Nickname" value={candidate.nickname} />
                  <DetailRow label="Applying Location" value={candidate.applyingLocation} />
                  <DetailRow label="Referred By" value={candidate.referredBy} />
                  <DetailRow label="Employee ID" value={candidate.employeeId} />
                </div>
              </section>

              <section className="rounded-2xl border border-[#E6ECF2] bg-white p-5 shadow-sm">
                <SectionTitle icon={UserRound} title="Personal Information" />
                <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                  <DetailRow label="Full Name" value={candidate.name} />
                  <DetailRow label="Date of Birth" value={formatDate(candidate.dateOfBirth)} />
                  <DetailRow label="Age" value={candidate.ageAsOfApplication} />
                  <DetailRow label="Email" value={candidate.email} />
                  <DetailRow label="Phone 1" value={candidate.phoneNumber1 || candidate.contactNumber} />
                  <DetailRow label="Phone 2" value={candidate.phoneNumber2} />
                  <DetailRow label="Address" value={candidate.physicalAddress} />
                  <DetailRow label="Work Experience" value={candidate.workExperience} />
                </div>
              </section>

              {workExperiences.length > 0 && (
                <section className="rounded-2xl border border-[#E6ECF2] bg-white p-5 shadow-sm">
                  <SectionTitle icon={BriefcaseBusiness} title="Industry or Relevant Experience" />
                  <div className="space-y-4">
                    {workExperiences.map((experience, index) => (
                      <div key={experience.id || index} className="rounded-2xl border border-[#E6ECF2] bg-[#F8FAFC] p-4">
                        <h4 className="mb-3 text-sm font-extrabold text-sibs-primary-1">
                          Experience {index + 1}
                        </h4>
                        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                          <DetailRow label="Industry" value={experience.industry} />
                          <DetailRow label="Length" value={experience.lengthOfWorkExperience} />
                          <DetailRow label="Years" value={experience.years} />
                          <DetailRow label="Role" value={experience.role} />
                          <DetailRow label="Company" value={experience.company} />
                          <DetailRow label="Monthly Compensation" value={formatCurrency(experience.monthlyCompensation)} />
                          <DetailRow label="Reason for Leaving" value={experience.reasonForLeaving} />
                        </div>
                      </div>
                    ))}
                  </div>
                </section>
              )}

              <section className="rounded-2xl border border-[#E6ECF2] bg-white p-5 shadow-sm">
                <SectionTitle icon={GraduationCap} title="Education, Certifications and Readiness" />
                <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                  <DetailRow label="Educational Attainment" value={candidate.educationalAttainment} />
                  <DetailRow label="Affiliations" value={(candidate.affiliations || []).join(", ")} />
                  <DetailRow label="Training" value={candidate.trainingAttended} />
                  <DetailRow label="Fully Vaccinated" value={candidate.fullyVaccinated} />
                  <DetailRow label="Comfortable On Site" value={candidate.comfortableOnSite} />
                  <DetailRow label="Graveyard Shift" value={candidate.willingGraveyard} />
                  <DetailRow label="Employment Interest" value={candidate.employmentInterest} />
                  <DetailRow label="Remote Work Access" value={candidate.remoteWorkAccess} />
                  <DetailRow label="Drug Test" value={candidate.willingDrugTest} />
                  <DetailRow label="Background Check" value={candidate.willingBackgroundCheck} />
                </div>
              </section>

              <section className="rounded-2xl border border-[#E6ECF2] bg-white p-5 shadow-sm">
                <SectionTitle icon={Phone} title="References and Uploads" />
                <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                  {references.map((reference, index) => (
                    <DetailRow
                      key={index}
                      label={`Reference ${index + 1}`}
                      value={`${reference.name || "—"}${reference.phone ? ` / ${reference.phone}` : ""}`}
                    />
                  ))}
                  <DetailRow label="Audio File" value={candidate.audioFileName} />
                  <DetailRow label="Supporting File" value={candidate.attachmentFileName} />
                </div>
              </section>
            </div>

            <div className="space-y-5">
              <section className="rounded-2xl border border-[#E6ECF2] bg-[#F8FAFC] p-5">
                <SectionTitle title="Talent Pool Status" />
                <DetailRow label="Status" value={candidate.status} />
                <DetailRow label="Source" value={candidate.source} />
                <DetailRow label="Availability" value={candidate.availability} />
                <DetailRow label="Account Fit" value={candidate.accountFit} />
                <DetailRow label="Last Activity" value={formatDate(candidate.lastActivity)} />
                <DetailRow label="Remarks" value={candidate.remarks} />
              </section>

              <section className="rounded-2xl border border-[#E6ECF2] bg-white p-5 shadow-sm">
                <SectionTitle title="Application History" />
                <div className="space-y-3">
                  {(candidate.applicationHistory || []).length > 0 ? (
                    candidate.applicationHistory.map((item, index) => (
                      <div key={index} className="rounded-xl border border-[#E6ECF2] bg-[#F8FAFC] p-3">
                        <p className="text-sm font-bold text-[#101828]">{item.role}</p>
                        <p className="mt-1 text-xs font-semibold text-sibs-tertiary-5">
                          {item.account} • {item.outcome} • {formatDate(item.date)}
                        </p>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm font-semibold text-sibs-tertiary-5">No history yet.</p>
                  )}
                </div>
              </section>
            </div>
          </div>
        </div>

        <div className="border-t border-gray-100 px-5 py-4 sm:px-6">
          <div className="flex flex-col justify-end gap-2 sm:flex-row">
            <button
              type="button"
              onClick={() => onOpenEditCandidate(candidate)}
              className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-[#E6ECF2] bg-white px-5 text-sm font-bold text-sibs-primary-1 transition hover:bg-[#F8FAFC]"
            >
              <Pencil size={16} />
              Edit Details
            </button>
            <button
              type="button"
              onClick={() => onOpenStatus(candidate)}
              className="inline-flex h-11 items-center justify-center rounded-xl border border-[#E6ECF2] bg-white px-5 text-sm font-bold text-sibs-primary-1 transition hover:bg-[#F8FAFC]"
            >
              Update Status
            </button>
            <button
              type="button"
              onClick={() => onOpenMoveToPipeline(candidate)}
              className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-sibs-primary-1 px-5 text-sm font-bold text-white transition hover:opacity-90"
            >
              <ArrowRight size={16} />
              Move to Pipeline
            </button>
            <button
              type="button"
              onClick={onClose}
              className="inline-flex h-11 items-center justify-center rounded-xl border border-[#E6ECF2] bg-white px-5 text-sm font-bold text-gray-600 transition hover:bg-gray-50"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function UpdateStatusModal({ open, candidate, form, setForm, onClose, onSubmit }) {
  if (!open || !candidate) return null;

  return (
    <div className="fixed inset-0 z-[10001] flex h-dvh items-center justify-center bg-black/40 px-4 py-4" onClick={onClose}>
      <div className="w-full max-w-xl rounded-2xl bg-white shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-start justify-between gap-4 border-b border-gray-100 px-5 py-4">
          <div>
            <h2 className="text-lg font-bold text-sibs-primary-1">Update Status</h2>
            <p className="mt-1 text-sm font-medium text-sibs-tertiary-5">{candidate.name}</p>
          </div>
          <button type="button" onClick={onClose} className="rounded-full p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-700">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={onSubmit} className="space-y-4 p-5">
          <div>
            <FieldLabel>Status</FieldLabel>
            <select
              required
              value={form.status}
              onChange={(e) => setForm({ ...form, status: e.target.value })}
              className={inputClass()}
            >
              {statusOptions.filter((item) => item !== "All").map((status) => (
                <option key={status} value={status}>{status}</option>
              ))}
            </select>
          </div>

          <div>
            <FieldLabel>Remarks</FieldLabel>
            <textarea
              rows={4}
              value={form.remarks}
              onChange={(e) => setForm({ ...form, remarks: e.target.value })}
              className={textareaClass()}
            />
          </div>
        </form>

        <div className="border-t border-gray-100 px-5 py-4">
          <div className="flex justify-end gap-2">
            <button type="button" onClick={onClose} className="inline-flex h-11 items-center justify-center rounded-xl border border-[#E6ECF2] bg-white px-5 text-sm font-bold text-gray-600">
              Cancel
            </button>
            <button type="button" onClick={onSubmit} className="inline-flex h-11 items-center justify-center rounded-xl bg-sibs-primary-1 px-5 text-sm font-bold text-white">
              Save Status
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function MoveToPipelineModal({ open, candidate, form, setForm, onClose, onSubmit, currentTaOwner }) {
  if (!open || !candidate) return null;

  function handleRequirementChange(requirementId) {
    const selectedRequirement = hiringRequirementOptions.find((item) => item.id === requirementId);

    setForm({
      ...form,
      hiringRequirementId: requirementId,
      jobDescriptionId: selectedRequirement?.jobDescriptionId || "",
      roleTitle: selectedRequirement?.roleTitle || "",
      account: selectedRequirement?.account || "",
      taOwner: currentTaOwner || selectedRequirement?.taOwner || "",
    });
  }

  return (
    <div className="fixed inset-0 z-[10002] flex h-dvh items-center justify-center bg-black/40 px-4 py-4" onClick={onClose}>
      <div className="w-full max-w-2xl rounded-2xl bg-white shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-start justify-between gap-4 border-b border-gray-100 px-5 py-4">
          <div>
            <h2 className="text-lg font-bold text-sibs-primary-1">Move to Candidate Pipeline</h2>
            <p className="mt-1 text-sm font-medium text-sibs-tertiary-5">{candidate.name}</p>
          </div>
          <button type="button" onClick={onClose} className="rounded-full p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-700">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={onSubmit} className="space-y-4 p-5">
          <div>
            <FieldLabel>Hiring Requirement</FieldLabel>
            <select
              required
              value={form.hiringRequirementId}
              onChange={(e) => handleRequirementChange(e.target.value)}
              className={inputClass()}
            >
              <option value="">Select hiring requirement</option>
              {hiringRequirementOptions.map((requirement) => (
                <option key={requirement.id} value={requirement.id}>
                  {requirement.id} — {requirement.roleTitle} / {requirement.account}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <FieldLabel>Role Title</FieldLabel>
              <input value={form.roleTitle} readOnly className={inputClass("bg-[#F8FAFC]")} />
            </div>
            <div>
              <FieldLabel>Account</FieldLabel>
              <input value={form.account} readOnly className={inputClass("bg-[#F8FAFC]")} />
            </div>
            <div>
              <FieldLabel>TA Owner</FieldLabel>
              <input
                value={form.taOwner || currentTaOwner || ""}
                readOnly
                className={inputClass("bg-[#F8FAFC]")}
              />
              <p className="mt-1 text-xs font-semibold text-sibs-tertiary-5">
                Automatically captured from the logged-in user.
              </p>
            </div>
            <div>
              <FieldLabel>Initial Stage</FieldLabel>
              <select
                value={form.initialStage}
                onChange={(e) => setForm({ ...form, initialStage: e.target.value })}
                className={inputClass()}
              >
                <option value="Lead / Sourced">Lead / Sourced</option>
                <option value="Initial Screening">Initial Screening</option>
              </select>
            </div>
          </div>

          <div>
            <FieldLabel>Remarks</FieldLabel>
            <textarea
              rows={4}
              value={form.remarks}
              onChange={(e) => setForm({ ...form, remarks: e.target.value })}
              className={textareaClass()}
            />
          </div>
        </form>

        <div className="border-t border-gray-100 px-5 py-4">
          <div className="flex justify-end gap-2">
            <button type="button" onClick={onClose} className="inline-flex h-11 items-center justify-center rounded-xl border border-[#E6ECF2] bg-white px-5 text-sm font-bold text-gray-600">
              Cancel
            </button>
            <button type="button" onClick={onSubmit} className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-sibs-primary-1 px-5 text-sm font-bold text-white">
              <ArrowRight size={16} />
              Move Candidate
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function TalentPoolPage() {
  const { user } = useUser();
  const currentTaOwner =
    user?.name ||
    user?.fullName ||
    user?.employeeName ||
    user?.username ||
    user?.email ||
    "Current User";

  const [candidateList, setCandidateList] = useState(initialCandidates.map(normalizeCandidateRecord));

  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("All");
  const [statusFilter, setStatusFilter] = useState("All");
  const [locationFilter, setLocationFilter] = useState("All");
  const [workExperienceFilter, setWorkExperienceFilter] = useState("All");
  const [sourceFilter, setSourceFilter] = useState("All");
  const [educationFilter, setEducationFilter] = useState("All");
  const [accountFilter, setAccountFilter] = useState("All Accounts");

  const [selectedCandidate, setSelectedCandidate] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [candidateForm, setCandidateForm] = useState(emptyCandidateForm);
  const [editCandidate, setEditCandidate] = useState(null);
  const [editCandidateForm, setEditCandidateForm] = useState(emptyCandidateForm);

  const [statusTarget, setStatusTarget] = useState(null);
  const [statusForm, setStatusForm] = useState(emptyStatusForm);

  const [pipelineTarget, setPipelineTarget] = useState(null);
  const [moveToPipelineForm, setMoveToPipelineForm] = useState(emptyMoveToPipelineForm);

  useEffect(() => {
    const savedCandidates = readLocalStorage(INTERNAL_CANDIDATES_KEY, null);

    if (savedCandidates && Array.isArray(savedCandidates)) {
      setCandidateList(savedCandidates.map(normalizeCandidateRecord));
      return;
    }

    const publicSubmissions = readLocalStorage(PUBLIC_SUBMISSIONS_KEY, []);

    if (publicSubmissions.length > 0) {
      const imported = publicSubmissions.map((submission, index) =>
        normalizeCandidateRecord({
          ...submission,
          id: initialCandidates.length + index + 1,
          candidateId:
            submission.candidateId || generateCandidateId(initialCandidates.length + index + 1),
          status: "New Applicant",
          source: submission.source || "Public Application",
          isPublicSubmission: true,
          applicationHistory: [
            {
              role: submission.openPosition || submission.roleCapability,
              account: submission.accountFit || "Unassigned",
              outcome: "Public Application Submitted",
              date: submission.submittedAt || getTodayDate(),
            },
          ],
          remarks: submission.remarks || "Submitted from public applicant form.",
        })
      );

      const merged = [...imported, ...initialCandidates.map(normalizeCandidateRecord)];
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
    window.open("/recruitment/talent-pool/apply", "_blank", "noopener,noreferrer");
  }

  function handleAddCandidate(e) {
    e.preventDefault();

    const age = calculateAge(candidateForm.dateOfBirth);

    if (age !== null && age < 18) {
      alert("Applicant is below 18 years old as of date of application.");
      return;
    }

    if (!candidateForm.hearAboutUs.length) {
      alert("Please select how the applicant first heard about us.");
      return;
    }

    if (!candidateForm.consent) {
      alert("Please confirm the terms and conditions consent.");
      return;
    }

    const hasExperience = candidateForm.workExperience === workExperienceOptions[0];
    const cleanedExperiences = hasExperience
      ? candidateForm.workExperiences.map((item, index) => ({
          ...item,
          id: item.id || index + 1,
          industry: item.industry.trim(),
          lengthOfWorkExperience: item.lengthOfWorkExperience,
          years: item.years.trim(),
          role: item.role.trim(),
          company: item.company.trim(),
          monthlyCompensation: item.monthlyCompensation.trim(),
          reasonForLeaving: item.reasonForLeaving.trim(),
          hasOtherExperience: item.hasOtherExperience || "No",
        }))
      : [];

    const nextId =
      candidateList.length > 0
        ? Math.max(...candidateList.map((candidate) => Number(candidate.id) || 0)) + 1
        : 1;

    const today = getTodayDate();
    const fullName = buildFullName(candidateForm);
    const source = candidateForm.source || candidateForm.hearAboutUs.join(", ");
    const roleCapability = candidateForm.openPosition;

    const applicationHistory = [
      {
        role: candidateForm.openPosition,
        account: candidateForm.accountFit || candidateForm.applyingLocation || "Unassigned",
        outcome: candidateForm.applicationOutcome || "Initial Entry",
        date: today,
      },
    ];

    const newCandidate = normalizeCandidateRecord({
      id: nextId,
      candidateId: generateCandidateId(nextId),
      hearAboutUs: candidateForm.hearAboutUs,
      openPosition: candidateForm.openPosition,
      nickname: candidateForm.nickname.trim(),
      applyingLocation: candidateForm.applyingLocation,
      referredBy: candidateForm.referredBy.trim(),
      employeeId: candidateForm.employeeId.trim(),
      firstName: candidateForm.firstName.trim(),
      lastName: candidateForm.lastName.trim(),
      middleName: candidateForm.middleName.trim(),
      suffix: candidateForm.suffix.trim(),
      extension: candidateForm.suffix.trim(),
      name: fullName,
      dateOfBirth: candidateForm.dateOfBirth,
      ageAsOfApplication: age,
      email: candidateForm.email.trim(),
      physicalAddress: candidateForm.physicalAddress.trim(),
      workExperience: candidateForm.workExperience,
      phoneNumber1: candidateForm.phoneNumber1.trim(),
      phoneNumber2: candidateForm.phoneNumber2.trim(),
      contactNumber: candidateForm.phoneNumber1.trim(),
      workExperiences: cleanedExperiences,
      roleCapability,
      skillsLanguage: candidateForm.skillsLanguage.trim(),
      educationalAttainment: candidateForm.educationalAttainment,
      affiliations: candidateForm.affiliations,
      trainingAttended: candidateForm.trainingAttended.trim(),
      fullyVaccinated: candidateForm.fullyVaccinated,
      comfortableOnSite: candidateForm.comfortableOnSite,
      willingGraveyard: candidateForm.willingGraveyard,
      employmentInterest: candidateForm.employmentInterest,
      remoteWorkAccess: candidateForm.remoteWorkAccess,
      willingDrugTest: candidateForm.willingDrugTest,
      willingBackgroundCheck: candidateForm.willingBackgroundCheck,
      references: candidateForm.references.map((item) => ({
        name: item.name.trim(),
        phone: item.phone.trim(),
      })),
      audioFileName: candidateForm.audioFileName,
      attachmentFileName: candidateForm.attachmentFileName,
      consent: candidateForm.consent,
      status: candidateForm.status || "New Applicant",
      source,
      availability: candidateForm.availability,
      accountFit: candidateForm.accountFit || candidateForm.applyingLocation || "N/A",
      lastActivity: today,
      tags: normalizeTags(roleCapability, candidateForm.skillsLanguage),
      isPublicSubmission: false,
      applicationHistory,
      remarks: candidateForm.remarks.trim(),
    });

    setCandidateList((prev) => [newCandidate, ...prev]);
    setSelectedCandidate(newCandidate);
    setCandidateForm(emptyCandidateForm);
    setShowAddModal(false);
  }


  function handleOpenEditCandidate(candidate) {
    setEditCandidate(candidate);
    setEditCandidateForm(candidateToForm(candidate));
    setSelectedCandidate(null);
  }

  function handleCloseEditCandidate() {
    setEditCandidate(null);
    setEditCandidateForm(emptyCandidateForm);
  }

  function handleResetEditCandidateForm() {
    if (!editCandidate) return;
    setEditCandidateForm(candidateToForm(editCandidate));
  }

  function handleSubmitEditCandidate(e) {
    e.preventDefault();

    if (!editCandidate) return;

    const age = calculateAge(editCandidateForm.dateOfBirth);

    if (age !== null && age < 18) {
      alert("Applicant is below 18 years old as of date of application.");
      return;
    }

    if (!editCandidateForm.hearAboutUs.length) {
      alert("Please select how the applicant first heard about us.");
      return;
    }

    if (!editCandidateForm.consent) {
      alert("Please confirm the terms and conditions consent.");
      return;
    }

    const today = getTodayDate();
    const hasExperience = editCandidateForm.workExperience === workExperienceOptions[0];
    const cleanedExperiences = hasExperience
      ? editCandidateForm.workExperiences.map((item, index) => ({
          ...item,
          id: item.id || index + 1,
          industry: String(item.industry || "").trim(),
          lengthOfWorkExperience: item.lengthOfWorkExperience,
          years: String(item.years || "").trim(),
          role: String(item.role || "").trim(),
          company: String(item.company || "").trim(),
          monthlyCompensation: String(item.monthlyCompensation || "").trim(),
          reasonForLeaving: String(item.reasonForLeaving || "").trim(),
          hasOtherExperience: item.hasOtherExperience || "No",
        }))
      : [];

    const roleCapability = editCandidateForm.openPosition;
    const updatedCandidate = normalizeCandidateRecord({
      ...editCandidate,
      hearAboutUs: editCandidateForm.hearAboutUs,
      openPosition: editCandidateForm.openPosition,
      nickname: editCandidateForm.nickname.trim(),
      applyingLocation: editCandidateForm.applyingLocation,
      referredBy: editCandidateForm.referredBy.trim(),
      employeeId: editCandidateForm.employeeId.trim(),
      firstName: editCandidateForm.firstName.trim(),
      lastName: editCandidateForm.lastName.trim(),
      middleName: editCandidateForm.middleName.trim(),
      suffix: editCandidateForm.suffix.trim(),
      extension: editCandidateForm.suffix.trim(),
      name: buildFullName(editCandidateForm),
      dateOfBirth: editCandidateForm.dateOfBirth,
      ageAsOfApplication: age,
      email: editCandidateForm.email.trim(),
      physicalAddress: editCandidateForm.physicalAddress.trim(),
      workExperience: editCandidateForm.workExperience,
      phoneNumber1: editCandidateForm.phoneNumber1.trim(),
      phoneNumber2: editCandidateForm.phoneNumber2.trim(),
      contactNumber: editCandidateForm.phoneNumber1.trim(),
      workExperiences: cleanedExperiences,
      roleCapability,
      skillsLanguage: editCandidateForm.skillsLanguage.trim(),
      educationalAttainment: editCandidateForm.educationalAttainment,
      affiliations: editCandidateForm.affiliations,
      trainingAttended: editCandidateForm.trainingAttended.trim(),
      fullyVaccinated: editCandidateForm.fullyVaccinated,
      comfortableOnSite: editCandidateForm.comfortableOnSite,
      willingGraveyard: editCandidateForm.willingGraveyard,
      employmentInterest: editCandidateForm.employmentInterest,
      remoteWorkAccess: editCandidateForm.remoteWorkAccess,
      willingDrugTest: editCandidateForm.willingDrugTest,
      willingBackgroundCheck: editCandidateForm.willingBackgroundCheck,
      references: editCandidateForm.references.map((item) => ({
        name: item.name.trim(),
        phone: item.phone.trim(),
      })),
      audioFileName: editCandidateForm.audioFileName,
      attachmentFileName: editCandidateForm.attachmentFileName,
      consent: editCandidateForm.consent,
      status: editCandidateForm.status || editCandidate.status || "New Applicant",
      source: editCandidateForm.source || editCandidateForm.hearAboutUs.join(", "),
      availability: editCandidateForm.availability,
      accountFit: editCandidateForm.accountFit || "N/A",
      lastActivity: today,
      tags: normalizeTags(roleCapability, editCandidateForm.skillsLanguage),
      applicationHistory: [
        ...(editCandidate.applicationHistory || []),
        {
          role: roleCapability,
          account: editCandidateForm.accountFit || "Unassigned",
          outcome: "Candidate Details Updated",
          date: today,
        },
      ],
      remarks: editCandidateForm.remarks.trim(),
    });

    setCandidateList((prev) =>
      prev.map((candidate) =>
        candidate.id === editCandidate.id ? updatedCandidate : candidate
      )
    );

    setSelectedCandidate(updatedCandidate);
    handleCloseEditCandidate();
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
      ? `${statusTarget.remarks || ""}\n\nStatus updated to ${statusForm.status} on ${today}: ${statusForm.remarks.trim()}`
      : statusTarget.remarks;

    const updatedCandidate = normalizeCandidateRecord({
      ...statusTarget,
      status: statusForm.status,
      lastActivity: today,
      remarks: updatedRemarks,
      applicationHistory: [
        ...(statusTarget.applicationHistory || []),
        {
          role: statusTarget.openPosition || statusTarget.roleCapability,
          account: statusTarget.accountFit || "Unassigned",
          outcome: `Status Updated: ${statusForm.status}`,
          date: today,
        },
      ],
    });

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
      roleTitle: candidate.openPosition || candidate.roleCapability || "",
      account: candidate.accountFit === "N/A" ? "" : candidate.accountFit,
      taOwner: currentTaOwner,
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
    const existingApplications = readLocalStorage(CANDIDATE_APPLICATIONS_KEY, []);

    const duplicateActiveApplication = existingApplications.some(
      (application) =>
        application.candidateId === pipelineTarget.candidateId &&
        application.hiringRequirementId === selectedRequirement.id &&
        application.applicationStatus === "Active"
    );

    if (duplicateActiveApplication) {
      alert("This candidate is already active in the pipeline for this requirement.");
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
      taOwner: currentTaOwner || moveToPipelineForm.taOwner || selectedRequirement.taOwner,
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
          owner: currentTaOwner || moveToPipelineForm.taOwner || selectedRequirement.taOwner,
          reason:
            moveToPipelineForm.remarks.trim() ||
            "Moved from Talent Pool to Candidate Pipeline",
          timestamp: new Date().toISOString(),
        },
      ],
      candidateSnapshot: pipelineTarget,
    };

    writeLocalStorage(CANDIDATE_APPLICATIONS_KEY, [
      newApplication,
      ...existingApplications,
    ]);

    const updatedCandidate = normalizeCandidateRecord({
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
    });

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

    return candidateList.map(normalizeCandidateRecord).filter((candidate) => {
      const roleValue = candidate.openPosition || candidate.roleCapability || "";
      const sourceValue = candidate.source || formatList(candidate.hearAboutUs);
      const referencesText = formatReferences(candidate.references);
      const workExperiencesText = getPrimaryExperienceSummary(candidate);
      const readinessText = getReadinessSummary(candidate);

      const searchableText = [
        candidate.candidateId,
        candidate.name,
        candidate.nickname,
        candidate.firstName,
        candidate.middleName,
        candidate.lastName,
        candidate.suffix,
        candidate.email,
        candidate.phoneNumber1,
        candidate.phoneNumber2,
        candidate.physicalAddress,
        roleValue,
        candidate.applyingLocation,
        candidate.accountFit,
        sourceValue,
        candidate.referredBy,
        candidate.employeeId,
        candidate.workExperience,
        workExperiencesText,
        candidate.educationalAttainment,
        formatList(candidate.affiliations),
        candidate.trainingAttended,
        readinessText,
        referencesText,
        candidate.audioFileName,
        candidate.attachmentFileName,
        candidate.status,
        candidate.remarks,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      const matchesSearch = !keyword || searchableText.includes(keyword);
      const matchesRole = roleFilter === "All" || roleValue === roleFilter;
      const matchesStatus = statusFilter === "All" || candidate.status === statusFilter;
      const matchesLocation =
        locationFilter === "All" || candidate.applyingLocation === locationFilter;
      const matchesWorkExperience =
        workExperienceFilter === "All" || candidate.workExperience === workExperienceFilter;
      const matchesSource =
        sourceFilter === "All" ||
        sourceValue.toLowerCase().includes(sourceFilter.toLowerCase()) ||
        (candidate.hearAboutUs || []).some((item) => item === sourceFilter);
      const matchesEducation =
        educationFilter === "All" || candidate.educationalAttainment === educationFilter;
      const matchesAccount =
        accountFilter === "All Accounts" || candidate.accountFit === accountFilter;

      return (
        matchesSearch &&
        matchesRole &&
        matchesStatus &&
        matchesLocation &&
        matchesWorkExperience &&
        matchesSource &&
        matchesEducation &&
        matchesAccount
      );
    });
  }, [
    candidateList,
    search,
    roleFilter,
    statusFilter,
    locationFilter,
    workExperienceFilter,
    sourceFilter,
    educationFilter,
    accountFilter,
  ]);

  const stats = useMemo(() => {
    return {
      total: candidateList.length,
      silverPool: candidateList.filter((candidate) => candidate.status === "Silver Pool").length,
      recyclable: candidateList.filter((candidate) => candidate.status === "Recyclable").length,
      doNotReprocess: candidateList.filter((candidate) => candidate.status === "Do Not Reprocess").length,
      hiredActive: candidateList.filter((candidate) => candidate.status === "Hired / Active").length,
      publicSubmissions: candidateList.filter((candidate) => candidate.isPublicSubmission).length,
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
            Build reusable candidate profiles using the same fields as the public application form.
          </p>
        </div>

        <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-6">
          <StatCard title="Total Candidates" value={stats.total} icon={UsersRound} description="Persistent profiles" />
          <StatCard title="Silver Pool" value={stats.silverPool} icon={UserCheck} description="Passed, no opening" />
          <StatCard title="Recyclable" value={stats.recyclable} icon={RefreshCcw} description="Can be reconsidered" />
          <StatCard title="Do Not Reprocess" value={stats.doNotReprocess} icon={Ban} description="Not fit" />
          <StatCard title="Hired / Active" value={stats.hiredActive} icon={BriefcaseBusiness} description="Converted" />
          <StatCard title="Public Entries" value={stats.publicSubmissions} icon={ExternalLink} description="From outside form" />
        </div>

        <div className="mb-6 rounded-xl bg-white p-4 shadow-sm">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="min-w-0">
              <h3 className="mb-2 font-semibold text-sibs-primary-1">
                Candidate Master Profiles
              </h3>
              <p className="text-sm text-sibs-tertiary-5">
                Talent Pool stores the complete candidate profile. Moving to Pipeline creates a separate application record.
              </p>
            </div>

            <div className="flex shrink-0 flex-col gap-2 sm:flex-row">
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
        </div>

        <section className="overflow-hidden rounded-xl bg-white shadow-sm">
          <div className="border-b border-gray-100 p-4 sm:p-6">
            <div className="grid grid-cols-1 gap-3 xl:grid-cols-[1fr_220px_170px_180px_170px_210px_180px_230px_auto] xl:items-center">
              <div className="relative">
                <Search size={17} className="absolute left-4 top-1/2 -translate-y-1/2 text-sibs-tertiary-5" />
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search any talent pool field: name, email, phone, source, location, work, education, references..."
                  className={inputClass("pl-11 pr-4")}
                />
              </div>

              <select value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)} className={inputClass()}>
                {roleOptions.map((role) => (
                  <option key={role} value={role}>{role === "All" ? "Open Position" : role}</option>
                ))}
              </select>

              <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className={inputClass()}>
                {statusOptions.map((status) => (
                  <option key={status} value={status}>{status === "All" ? "Status" : status}</option>
                ))}
              </select>


              <select value={accountFilter} onChange={(e) => setAccountFilter(e.target.value)} className={inputClass()}>
                {accountOptions.map((account) => (
                  <option key={account} value={account}>{account}</option>
                ))}
              </select>

              <select value={locationFilter} onChange={(e) => setLocationFilter(e.target.value)} className={inputClass()}>
                <option value="All">Location</option>
                {locationOptions.map((location) => (
                  <option key={location} value={location}>{location}</option>
                ))}
              </select>

              <select value={workExperienceFilter} onChange={(e) => setWorkExperienceFilter(e.target.value)} className={inputClass()}>
                <option value="All">Work Experience</option>
                {workExperienceOptions.map((item) => (
                  <option key={item} value={item}>{item}</option>
                ))}
              </select>

              <select value={sourceFilter} onChange={(e) => setSourceFilter(e.target.value)} className={inputClass()}>
                <option value="All">Source</option>
                {[...new Set([...sourceOptions, ...hearAboutUsOptions])].map((source) => (
                  <option key={source} value={source}>{source}</option>
                ))}
              </select>

              <select value={educationFilter} onChange={(e) => setEducationFilter(e.target.value)} className={inputClass()}>
                <option value="All">Educational Attainment</option>
                {educationalAttainmentOptions.map((education) => (
                  <option key={education} value={education}>{education}</option>
                ))}
              </select>

              <button
                type="button"
                onClick={() => {
                  setSearch("");
                  setRoleFilter("All");
                  setStatusFilter("All");
                  setLocationFilter("All");
                  setAccountFilter("All Accounts");
                  setWorkExperienceFilter("All");
                  setSourceFilter("All");
                  setEducationFilter("All");
                }}
                className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-[#E6ECF2] bg-white px-4 text-sm font-bold text-sibs-primary-1 transition hover:border-sibs-primary-1 hover:bg-sibs-primary-1/5"
              >
                <Filter size={17} />
                Reset
              </button>
            </div>
          </div>

          <div className="p-4 sm:p-6">
            <div className="space-y-3 lg:hidden">
              {filteredCandidates.length > 0 ? (
                filteredCandidates.map((candidate) => (
                  <TalentPoolMobileCard key={candidate.id} candidate={candidate} onView={() => setSelectedCandidate(candidate)} />
                ))
              ) : (
                <div className="rounded-xl border border-[#E6ECF2] bg-white px-5 py-10 text-center text-sm font-bold text-gray-500">
                  No candidate profiles found.
                </div>
              )}
            </div>

            <div className="hidden overflow-hidden rounded-xl border border-[#E6ECF2] lg:block">
              <div className="max-h-[520px] overflow-auto">
                <table className="w-full min-w-[2200px] border-collapse text-left">
                  <thead className="sticky top-0 z-10 bg-[#F8FAFC]">
                    <tr className="text-xs font-bold uppercase tracking-wide text-sibs-tertiary-5">
                      <th className="px-5 py-4">Candidate</th>
                      <th className="px-5 py-4">Open Position / Site</th>
                      <th className="px-5 py-4">Source / Referral</th>
                      <th className="px-5 py-4">Personal Details</th>
                      <th className="px-5 py-4">Contact / Address</th>
                      <th className="px-5 py-4">Work Experience</th>
                      <th className="px-5 py-4">Education / Certifications</th>
                      <th className="px-5 py-4">Readiness</th>
                      <th className="px-5 py-4">References</th>
                      <th className="px-5 py-4">Uploads</th>
                      <th className="px-5 py-4">Status</th>
                      <th className="px-5 py-4">Last Activity</th>
                      <th className="px-5 py-4 text-right">Actions</th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-gray-100 bg-white">
                    {filteredCandidates.length > 0 ? (
                      filteredCandidates.map((candidate) => (
                        <tr key={candidate.id} className="align-top transition hover:bg-[#F8FAFC]">
                          <td className="px-5 py-4">
                            <p className="text-sm font-bold text-[#101828]">{candidate.name}</p>
                            <p className="text-xs font-semibold text-sibs-tertiary-5">{candidate.email}</p>
                            <p className="mt-1 text-[11px] font-bold text-sibs-primary-1">{candidate.candidateId}</p>
                            {candidate.isPublicSubmission && (
                              <p className="mt-1 text-[11px] font-bold text-purple-600">Public Submission</p>
                            )}
                          </td>

                          <td className="px-5 py-4 text-sm font-semibold text-[#344054]">
                            <p className="font-bold text-sibs-primary-1">{candidate.openPosition || candidate.roleCapability || "—"}</p>
                            <p className="mt-1">{candidate.applyingLocation || "—"}</p>
                            <p className="mt-1 text-xs text-sibs-tertiary-5">Account: {candidate.accountFit || "—"}</p>
                          </td>

                          <td className="px-5 py-4 text-sm font-semibold text-[#344054]">
                            <p className="whitespace-pre-line">{formatList(candidate.hearAboutUs)}</p>
                            <p className="mt-2 text-xs text-sibs-tertiary-5">Referred by: {candidate.referredBy || "—"}</p>
                            <p className="text-xs text-sibs-tertiary-5">Employee ID: {candidate.employeeId || "—"}</p>
                          </td>

                          <td className="px-5 py-4 text-sm font-semibold text-[#344054]">
                            <p>Nickname: {candidate.nickname || "—"}</p>
                            <p>DOB: {formatDate(candidate.dateOfBirth)}</p>
                            <p>Age: {candidate.ageAsOfApplication || "—"}</p>
                          </td>

                          <td className="px-5 py-4 text-sm font-semibold text-[#344054]">
                            <p>{candidate.phoneNumber1 || "—"}</p>
                            <p>{candidate.phoneNumber2 || "—"}</p>
                            <p className="mt-2 max-w-[240px] whitespace-pre-line text-xs text-sibs-tertiary-5">{candidate.physicalAddress || "—"}</p>
                          </td>

                          <td className="px-5 py-4 text-sm font-semibold text-[#344054]">
                            <p className="font-bold">{candidate.workExperience || "—"}</p>
                            <p className="mt-2 max-w-[320px] whitespace-pre-line text-xs leading-5 text-sibs-tertiary-5">
                              {getPrimaryExperienceSummary(candidate)}
                            </p>
                          </td>

                          <td className="px-5 py-4 text-sm font-semibold text-[#344054]">
                            <p className="max-w-[260px]">{candidate.educationalAttainment || "—"}</p>
                            <p className="mt-2 max-w-[260px] whitespace-pre-line text-xs leading-5 text-sibs-tertiary-5">
                              {formatList(candidate.affiliations)}
                            </p>
                            <p className="mt-2 max-w-[260px] whitespace-pre-line text-xs leading-5 text-sibs-tertiary-5">
                              Training: {candidate.trainingAttended || "—"}
                            </p>
                          </td>

                          <td className="px-5 py-4 text-xs font-semibold leading-5 text-[#344054]">
                            <p className="max-w-[260px] whitespace-pre-line">{getReadinessSummary(candidate)}</p>
                          </td>

                          <td className="px-5 py-4 text-xs font-semibold leading-5 text-[#344054]">
                            <p className="max-w-[260px] whitespace-pre-line">{formatReferences(candidate.references)}</p>
                          </td>

                          <td className="px-5 py-4 text-xs font-semibold leading-5 text-[#344054]">
                            <p>Audio: {candidate.audioFileName || "—"}</p>
                            <p>File: {candidate.attachmentFileName || "—"}</p>
                          </td>

                          <td className="px-5 py-4">
                            <span className={`inline-flex rounded-full border px-3 py-1 text-xs font-bold ${getStatusClass(candidate.status)}`}>
                              {candidate.status}
                            </span>
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
                        <td colSpan={13} className="px-5 py-12 text-center text-sm font-bold text-gray-500">
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
                Showing 1 to {filteredCandidates.length} of {candidateList.length} candidate profiles
              </p>

              <div className="flex items-center gap-2">
                <button type="button" className="flex h-9 w-9 items-center justify-center rounded-lg border border-[#E6ECF2] text-gray-500 transition hover:bg-gray-50">
                  <ChevronLeft size={16} />
                </button>
                <button type="button" className="flex h-9 w-9 items-center justify-center rounded-lg bg-sibs-primary-1 text-sm font-bold text-white">
                  1
                </button>
                <button type="button" className="flex h-9 w-9 items-center justify-center rounded-lg border border-[#E6ECF2] text-gray-500 transition hover:bg-gray-50">
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>
          </div>
        </section>

        <section className="mt-6 rounded-xl border border-blue-100 bg-blue-50 p-5">
          <h3 className="text-sm font-bold text-sibs-primary-1">Talent Pool Design Note</h3>
          <p className="mt-2 text-sm leading-6 text-sibs-primary-1/80">
            Talent Pool stores the full candidate master profile using the same inputs as the public form. Move to Pipeline creates a separate candidate application tied to a hiring requirement.
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
        mode="add"
      />

      <AddCandidateModal
        open={!!editCandidate}
        form={editCandidateForm}
        setForm={setEditCandidateForm}
        onClose={handleCloseEditCandidate}
        onSubmit={handleSubmitEditCandidate}
        onReset={handleResetEditCandidateForm}
        mode="edit"
      />

      <CandidateProfileModal
        open={!!selectedCandidate}
        candidate={selectedCandidate}
        onClose={() => setSelectedCandidate(null)}
        onOpenStatus={handleOpenStatus}
        onOpenMoveToPipeline={handleOpenMoveToPipeline}
        onOpenEditCandidate={handleOpenEditCandidate}
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
        currentTaOwner={currentTaOwner}
      />
    </div>
  );
}
