import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowRight,
  BadgeCheck,
  BriefcaseBusiness,
  Check,
  ChevronDown,
  ChevronRight,
  Eye,
  FileImage,
  FileSpreadsheet,
  FileText,
  GraduationCap,
  Loader2,
  Mail,
  MapPin,
  Network,
  Phone,
  RefreshCcw,
  ShieldCheck,
  Sparkles,
  StickyNote,
  UploadCloud,
  UserRound,
  UserRoundPen,
  UserX,
  WalletCards,
  X,
} from "lucide-react";

import { useTalentPool } from "../../../services/context/TalentPoolContext";

import {
  formatCurrency,
  formatDate,
  formatList,
  getEncodedByName,
  getStatusClass,
  textareaClass,
  toDisplayPersonName,
} from "../../../lib/utils/talentPool/talentPoolHelpers";

import {
  FieldLabel,
  ReferenceCard,
  StatusTile,
  ViewableFileRow,
} from "../../recruitment/talentPool/TalentPoolShared";

import GetAssessmentTimelineFiles from "../../../lib/utils/candidatePipeline/react-utils/GetAssessmentTimelineFiles";
import StatusModal from "../StatusModal";
import NhoUploadModal from "../candidatePipeline/NhoUploadModal";
import api from "../../../lib/axios/api-template";
import {
  markTalentPoolCandidateAsDropOff,
  updateTalentPoolApplicationStatus,
} from "../../../lib/axios/getTalentPool";

const TALENT_POOL_ROUTE = "/recruitment/talent-pool";
const CANDIDATE_PIPELINE_ROUTE = "/recruitment/candidate-pipeline";
const ONBOARDING_ROUTE = "/recruitment/onboarding";

const INCOMPLETE_ONBOARDING_STAGE = "For Onboarding - Incomplete Requirements";
const ONBOARDING_STAGE = "Onboarding";

const TALENT_POOL_STATUS_OPTIONS = [
  { value: "New Applicant", label: "New Applicant" },
  { value: "Silver Pool", label: "Silver Pool" },
  { value: "Recyclable", label: "Recyclable" },
  { value: "Do Not Reprocess", label: "Do Not Reprocess" },
  { value: "Hired / Active", label: "Hired / Active" },
  { value: "Initial Screening", label: "Initial Screening" },
  { value: "Active", label: "Active" },
];

const MAJOR_PRE_EMPLOYMENT_REQUIREMENTS = [
  "Transcript of Records and/or Diploma",
  "Medical Records",
  "NBI Clearance",
  "Birth Certificate",
  "Valid ID",
];

const PREVIOUS_EMPLOYMENT_REQUIREMENTS = [
  "BIR 2316 Form",
  "Employment Certificate",
];

const PRE_EMPLOYMENT_REQUIREMENT_GROUPS = [
  {
    id: "major",
    title: "Major Requirements",
    requirements: MAJOR_PRE_EMPLOYMENT_REQUIREMENTS,
  },
  {
    id: "other",
    title: "Other Requirements",
    requirements: [
      "ID picture (2 pcs passport size)",
      "Urinalysis, Fecalysis, Pregnancy Test, Drug Test, Chest X-ray",
      "TIN Verification Slip",
      "SSS E1 Form",
      "PhilHealth MDR",
      "Pag-IBIG MDF",
      "Vaccination Card",
    ],
  },
  {
    id: "previous-employment",
    title: "Previous Employment",
    requirements: PREVIOUS_EMPLOYMENT_REQUIREMENTS,
  },
];

const OFFICIAL_PRE_EMPLOYMENT_REQUIREMENTS =
  PRE_EMPLOYMENT_REQUIREMENT_GROUPS.flatMap((group) => group.requirements);

function safeArray(value) {
  return Array.isArray(value) ? value.filter(Boolean) : [];
}

function safeObject(value) {
  return value && typeof value === "object" && !Array.isArray(value)
    ? value
    : {};
}

function cleanText(value) {
  return String(value ?? "").trim();
}

function getTalentPoolApplicationId(candidate = {}) {
  return cleanText(
    candidate.rawId ||
      candidate.applicationRawId ||
      candidate.applicationId ||
      candidate.application_id ||
      candidate.dbId ||
      candidate.databaseId ||
      candidate.id ||
      candidate.candidateId ||
      "",
  );
}

function getTalentPoolOwnerSibsId(value) {
  if (!value || typeof value !== "object") return "";

  return cleanText(
    value.sibsId ||
      value.sibs_id ||
      value.employeeId ||
      value.employee_id ||
      value.userId ||
      value.user_id ||
      "",
  );
}

function normalizeLower(value) {
  return cleanText(value).toLowerCase();
}

function isDropOffCandidateStatus(value = "") {
  return (
    normalizeLower(value)
      .replace(/[-_]+/g, " ")
      .replace(/\s+/g, " ")
      .trim() === "drop off"
  );
}

function hasCandidateValue(value) {
  if (Array.isArray(value)) {
    return value.some((item) => hasCandidateValue(item));
  }

  if (value && typeof value === "object") {
    return Object.values(value).some((item) => hasCandidateValue(item));
  }

  if (value === null || value === undefined) return false;

  const normalized = cleanText(value).toLowerCase();

  return !["", "—", "-", "n/a", "na", "none", "null", "undefined"].includes(
    normalized,
  );
}

function firstCandidateValue(...values) {
  return values.find((value) => hasCandidateValue(value)) ?? "";
}

function normalizeCandidateRecordList(value) {
  if (Array.isArray(value)) return value.filter(Boolean);

  if (typeof value === "string") {
    const trimmed = value.trim();

    if (!trimmed) return [];

    try {
      const parsed = JSON.parse(trimmed);
      return Array.isArray(parsed) ? parsed.filter(Boolean) : [parsed];
    } catch {
      return [trimmed];
    }
  }

  if (value && typeof value === "object") return [value];

  return [];
}


const CANDIDATE_EDUCATION_SECTION_DEFINITIONS = [
  { key: "elementary", label: "Elementary School" },
  { key: "highSchool", label: "High School" },
  { key: "seniorHighSchool", label: "Senior High School" },
  { key: "college", label: "College" },
  { key: "vocational", label: "Vocational / Technical School" },
  { key: "lawSchool", label: "Law School" },
  { key: "masters", label: "Master's Degree" },
  { key: "doctorate", label: "Doctorate Degree" },
];

function parseCandidateJsonObject(value) {
  if (value && typeof value === "object" && !Array.isArray(value)) {
    return value;
  }

  if (typeof value !== "string") return {};

  const trimmed = value.trim();

  if (!trimmed) return {};

  try {
    const parsed = JSON.parse(trimmed);

    return parsed && typeof parsed === "object" && !Array.isArray(parsed)
      ? parsed
      : {};
  } catch {
    return {};
  }
}

function getCandidateEducationDetails(candidate = {}) {
  const safeCandidate = safeObject(candidate);
  const metadata = safeObject(safeCandidate.metadata);
  const candidateSnapshot = safeObject(safeCandidate.candidateSnapshot);
  const pipelineCandidate = safeObject(safeCandidate.pipelineCandidate);
  const pipelineDetails = safeObject(safeCandidate.pipelineDetails);

  const sources = [
    safeCandidate.educationDetails,
    safeCandidate.education_details,
    safeCandidate.educationDetailsJson,
    safeCandidate.education_details_json,

    metadata.educationDetails,
    metadata.education_details,
    metadata.educationDetailsJson,
    metadata.education_details_json,

    candidateSnapshot.educationDetails,
    candidateSnapshot.education_details,
    candidateSnapshot.educationDetailsJson,
    candidateSnapshot.education_details_json,

    pipelineCandidate.educationDetails,
    pipelineCandidate.education_details,
    pipelineCandidate.educationDetailsJson,
    pipelineCandidate.education_details_json,

    pipelineDetails.educationDetails,
    pipelineDetails.education_details,
    pipelineDetails.educationDetailsJson,
    pipelineDetails.education_details_json,
  ];

  for (const source of sources) {
    const parsed = parseCandidateJsonObject(source);

    if (Object.keys(parsed).length > 0) {
      return parsed;
    }
  }

  return {};
}

function getCandidateEducationAttainment(candidate = {}) {
  return firstCandidateValue(
    candidate.highestEducationalAttainment,
    candidate.highest_educational_attainment,
    candidate.educationalAttainment,
    candidate.educational_attainment,
  );
}

function getEducationSectionDisplayLabel(sectionKey, attainment = "") {
  if (
    sectionKey === "college" &&
    normalizeLower(attainment) === "college level"
  ) {
    return "Current College";
  }

  return (
    CANDIDATE_EDUCATION_SECTION_DEFINITIONS.find(
      (section) => section.key === sectionKey,
    )?.label || sectionKey
  );
}

function normalizeCandidateEducationSchool(
  sectionKey,
  sectionValue,
  attainment = "",
) {
  const section = parseCandidateJsonObject(sectionValue);

  const record = {
    source: "educationDetails",
    sectionKey,
    level: getEducationSectionDisplayLabel(sectionKey, attainment),
    schoolName: firstCandidateValue(
      section.schoolName,
      section.school_name,
      section.school,
      section.name,
    ),
    address: firstCandidateValue(
      section.address,
      section.schoolAddress,
      section.school_address,
    ),
    course: firstCandidateValue(
      section.course,
      section.program,
      section.degree,
      section.degreeCourse,
      section.degree_course,
    ),
    schoolYearGraduated: firstCandidateValue(
      section.schoolYearGraduated,
      section.school_year_graduated,
      section.yearGraduated,
      section.year_graduated,
      section.schoolYear,
      section.school_year,
    ),
  };

  return hasCandidateValue({
    schoolName: record.schoolName,
    address: record.address,
    course: record.course,
    schoolYearGraduated: record.schoolYearGraduated,
  })
    ? record
    : null;
}

function getCandidateDetailedEducationRecords(candidate = {}) {
  const attainment = getCandidateEducationAttainment(candidate);
  const details = getCandidateEducationDetails(candidate);

  return CANDIDATE_EDUCATION_SECTION_DEFINITIONS.map((section) =>
    normalizeCandidateEducationSchool(
      section.key,
      details[section.key] || details[section.key.replace(/[A-Z]/g, (letter) => `_${letter.toLowerCase()}`)],
      attainment,
    ),
  ).filter(Boolean);
}

function normalizeLegacyEducationRecord(record, index = 0) {
  const item =
    record && typeof record === "object" && !Array.isArray(record)
      ? record
      : { degree: record };

  const normalizedRecord = {
    source: "legacy",
    sectionKey: cleanText(item.key || item.sectionKey || `legacy-${index}`),
    level: firstCandidateValue(
      item.level,
      item.educationLevel,
      item.education_level,
      item.type,
    ),
    schoolName: firstCandidateValue(
      item.school,
      item.schoolName,
      item.school_name,
      item.name,
    ),
    address: firstCandidateValue(
      item.address,
      item.schoolAddress,
      item.school_address,
    ),
    course: firstCandidateValue(
      item.degree,
      item.course,
      item.program,
      item.degreeCourse,
      item.degree_course,
    ),
    schoolYearGraduated: firstCandidateValue(
      item.schoolYearGraduated,
      item.school_year_graduated,
      item.yearGraduated,
      item.year_graduated,
      item.schoolYear,
      item.school_year,
    ),
  };

  return hasCandidateValue({
    level: normalizedRecord.level,
    schoolName: normalizedRecord.schoolName,
    address: normalizedRecord.address,
    course: normalizedRecord.course,
    schoolYearGraduated: normalizedRecord.schoolYearGraduated,
  })
    ? normalizedRecord
    : null;
}

function getCandidateLegacyEducationRecords(candidate = {}) {
  const sources = [
    candidate.education,
    candidate.educationalBackground,
    candidate.educational_background,
    candidate.academicRecords,
    candidate.academic_records,
  ];

  return sources
    .flatMap((source) => normalizeCandidateRecordList(source))
    .map(normalizeLegacyEducationRecord)
    .filter(Boolean);
}

function getCandidateEducationRecordKey(record = {}) {
  return [
    record.level,
    record.schoolName,
    record.address,
    record.course,
    record.schoolYearGraduated,
  ]
    .map((value) => normalizeLower(value))
    .join("|");
}

function getCandidateEducationRecords(candidate = {}) {
  const detailedRecords = getCandidateDetailedEducationRecords(candidate);
  const legacyRecords = getCandidateLegacyEducationRecords(candidate);
  const uniqueRecords = new Map();

  [...detailedRecords, ...legacyRecords].forEach((record) => {
    const key = getCandidateEducationRecordKey(record);

    if (!key.replace(/\|/g, "")) return;

    if (!uniqueRecords.has(key)) {
      uniqueRecords.set(key, record);
    }
  });

  return Array.from(uniqueRecords.values());
}

function getApiErrorMessage(error, fallback = "Request failed.") {
  return (
    error?.response?.data?.message ||
    error?.response?.data?.error ||
    error?.message ||
    fallback
  );
}

function normalizeRequirementKey(value = "") {
  return cleanText(value)
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
}

function normalizeRequirementText(value = "") {
  return cleanText(value).toLowerCase().replace(/\s+/g, " ");
}

function getOfficialRequirementMatch(value = "") {
  const key = normalizeRequirementKey(value);

  if (!key) return "";

  return (
    OFFICIAL_PRE_EMPLOYMENT_REQUIREMENTS.find((requirement) => {
      const requirementKey = normalizeRequirementKey(requirement);

      return (
        key === requirementKey ||
        key.startsWith(`${requirementKey}_`) ||
        key.includes(requirementKey)
      );
    }) || ""
  );
}

function getNormalizedPreEmploymentRequirement(file = {}) {
  const directRequirement =
    file.requirement || file.label || file.title || file.category || "";

  const directMatch = getOfficialRequirementMatch(directRequirement);

  if (directMatch) return directMatch;

  const filename =
    file.savedFileName ||
    file.filename ||
    file.saved_file_name ||
    file.storedFileName ||
    file.stored_file_name ||
    file.fileName ||
    file.name ||
    file.originalName ||
    file.originalname ||
    "";

  return getOfficialRequirementMatch(filename);
}

function getRequirementDisplayLabel(file = {}) {
  return (
    getNormalizedPreEmploymentRequirement(file) ||
    cleanText(file.requirement) ||
    cleanText(file.label) ||
    cleanText(file.title) ||
    cleanText(file.category) ||
    cleanText(file.folderName) ||
    cleanText(file.applicantFolderName) ||
    "NHO Uploaded File"
  );
}

function isOfficialPreEmploymentFile(file = {}) {
  return Boolean(getNormalizedPreEmploymentRequirement(file));
}

function isMajorPreEmploymentRequirement(requirement = "") {
  const key = normalizeRequirementKey(requirement);

  return MAJOR_PRE_EMPLOYMENT_REQUIREMENTS.some(
    (item) => normalizeRequirementKey(item) === key,
  );
}

function formatFileSize(size = 0) {
  const numberSize = Number(size || 0);

  if (!numberSize) return "—";

  const kb = numberSize / 1024;

  if (kb < 1024) return `${kb.toFixed(1)} KB`;

  return `${(kb / 1024).toFixed(1)} MB`;
}

function formatUploadedDate(value = "") {
  if (!value) return "—";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return String(value);
  }

  return date.toLocaleString("en-PH", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function getFileIcon(fileName = "") {
  const value = String(fileName || "").toLowerCase();

  if (/\.(jpg|jpeg|png|gif|webp|heic|heif)$/i.test(value)) return FileImage;
  if (/\.(xls|xlsx|csv)$/i.test(value)) return FileSpreadsheet;

  return FileText;
}

function getRequirementSortIndex(requirement = "") {
  const requirementKey = normalizeRequirementText(requirement);

  const index = OFFICIAL_PRE_EMPLOYMENT_REQUIREMENTS.findIndex(
    (item) => normalizeRequirementText(item) === requirementKey,
  );

  return index === -1 ? 9999 : index;
}

function calculateMajorRequirementProgress(files = []) {
  const uploadedRequirementKeys = new Set(
    files
      .filter(isOfficialPreEmploymentFile)
      .map((file) =>
        normalizeRequirementKey(getNormalizedPreEmploymentRequirement(file)),
      )
      .filter(Boolean),
  );

  const completed = MAJOR_PRE_EMPLOYMENT_REQUIREMENTS.filter((requirement) =>
    uploadedRequirementKeys.has(normalizeRequirementKey(requirement)),
  ).length;

  const total = MAJOR_PRE_EMPLOYMENT_REQUIREMENTS.length;
  const percent = total ? Math.round((completed / total) * 100) : 0;

  return {
    completed,
    total,
    percent,
    isComplete: total > 0 && completed >= total,
  };
}

function calculateTotalRequirementProgress(files = []) {
  const uploadedRequirementKeys = new Set(
    files
      .filter(isOfficialPreEmploymentFile)
      .map((file) =>
        normalizeRequirementKey(getNormalizedPreEmploymentRequirement(file)),
      )
      .filter(Boolean),
  );

  const completed = OFFICIAL_PRE_EMPLOYMENT_REQUIREMENTS.filter((requirement) =>
    uploadedRequirementKeys.has(normalizeRequirementKey(requirement)),
  ).length;

  const total = OFFICIAL_PRE_EMPLOYMENT_REQUIREMENTS.length;
  const percent = total ? Math.round((completed / total) * 100) : 0;

  return {
    completed,
    total,
    percent,
    isComplete: total > 0 && completed >= total,
  };
}

function getCandidateStageValue(candidate = {}) {
  /*
    Pipeline stage must come from verified Candidate Pipeline fields only.
    Do not fall back to talent pool status because statuses like
    "New Applicant", "Interviewed", or "Public Submission" can make an
    unlinked talent pool candidate look linked.
  */
  return cleanText(
    candidate.currentPipelineStage ||
      candidate.current_pipeline_stage ||
      candidate.currentStage ||
      candidate.current_stage ||
      candidate.pipelineStage ||
      candidate.pipeline_stage ||
      candidate.stage ||
      "",
  );
}

function getCandidatePublicId(candidate = {}) {
  return cleanText(
    candidate.candidateId ||
      candidate.candidate_id ||
      candidate.candidateApplicationId ||
      candidate.candidate_application_id ||
      candidate.applicationId ||
      candidate.application_id ||
      candidate.publicId ||
      candidate.public_id ||
      "",
  );
}

function AnimatedProfileTabPanel({ children }) {
  return (
    <div className="candidate-profile-tab-panel-in">
      {children}
    </div>
  );
}

function CandidateProfileSideNav({
  tabs = [],
  activeTab = "",
  onTabChange,
}) {
  const activeParent = String(activeTab || "").split(".")[0];
  const [openParent, setOpenParent] = useState(activeParent || "personal");

  useEffect(() => {
    if (activeParent) setOpenParent(activeParent);
  }, [activeParent]);

  function isParentActive(tab) {
    return (
      activeTab === tab.key ||
      String(activeTab || "").startsWith(`${tab.key}.`)
    );
  }

  function handleParentClick(tab) {
    const hasChildren = Array.isArray(tab.children) && tab.children.length > 0;

    if (!hasChildren) {
      setOpenParent("");
      onTabChange?.(tab.key);
      return;
    }

    const isActive = isParentActive(tab);
    setOpenParent((previous) =>
      previous === tab.key && isActive ? "" : tab.key,
    );

    if (!isActive) {
      onTabChange?.(tab.children[0].key);
    }
  }

  const activeParentTab = tabs.find((tab) => isParentActive(tab));
  const activeChildren = Array.isArray(activeParentTab?.children)
    ? activeParentTab.children
    : [];

  return (
    <aside className="border-b border-[#E6ECF2] bg-white p-4 lg:border-b-0 lg:border-r lg:p-5">
      {/* Mobile and tablet navigation */}
      <div className="lg:hidden">
        <div className="flex gap-2 overflow-x-auto pb-1">
          {tabs.map((tab) => {
            const Icon = tab.icon || FileText;
            const parentActive = isParentActive(tab);
            const hasChildren =
              Array.isArray(tab.children) && tab.children.length > 0;

            return (
              <button
                key={tab.key}
                type="button"
                onClick={() => handleParentClick(tab)}
                aria-current={parentActive ? "page" : undefined}
                aria-expanded={hasChildren ? parentActive : undefined}
                className={`group inline-flex min-w-max items-center gap-3 rounded-xl px-4 py-3 text-left text-sm font-extrabold transition-all duration-200 active:scale-[0.98] ${
                  parentActive
                    ? "bg-sibs-primary-1 text-white shadow-sm"
                    : "bg-white text-sibs-primary-1 hover:-translate-y-0.5 hover:bg-[#F2F6FA] hover:shadow-sm"
                }`}
              >
                {hasChildren && (
                  <ChevronRight
                    size={14}
                    className={`shrink-0 transition-transform duration-200 ${
                      parentActive ? "rotate-90" : ""
                    }`}
                  />
                )}

                <span
                  className={`inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-xl transition-all duration-200 ${
                    parentActive
                      ? "bg-white/15 text-white"
                      : "bg-[#F2F6FA] text-sibs-primary-1 group-hover:bg-white"
                  }`}
                >
                  <Icon size={16} />
                </span>

                <span className="truncate">{tab.label}</span>
              </button>
            );
          })}
        </div>

        {activeChildren.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-2 rounded-xl bg-[#F8FAFC] p-2">
            {activeChildren.map((child) => {
              const childActive = activeTab === child.key;

              return (
                <button
                  key={child.key}
                  type="button"
                  onClick={() => onTabChange?.(child.key)}
                  aria-current={childActive ? "page" : undefined}
                  className={`inline-flex h-9 min-w-0 items-center gap-2 rounded-full px-3 text-xs font-bold transition-all duration-200 active:scale-[0.98] ${
                    childActive
                      ? "bg-[#BDD0EE] text-sibs-primary-1 shadow-sm"
                      : "bg-white text-sibs-primary-1/80 hover:bg-[#EEF5FB]"
                  }`}
                >
                  <span
                    className={`h-1.5 w-1.5 shrink-0 rounded-full ${
                      childActive
                        ? "bg-sibs-primary-1"
                        : "bg-sibs-primary-1/40"
                    }`}
                  />
                  <span className="truncate">{child.label}</span>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Desktop navigation */}
      <div className="hidden flex-col gap-2 lg:flex">
        {tabs.map((tab) => {
          const Icon = tab.icon || FileText;
          const hasChildren =
            Array.isArray(tab.children) && tab.children.length > 0;
          const parentActive = isParentActive(tab);
          const isOpen = openParent === tab.key;

          return (
            <div key={tab.key} className="min-w-0">
              <button
                type="button"
                onClick={() => handleParentClick(tab)}
                aria-current={parentActive ? "page" : undefined}
                aria-expanded={hasChildren ? isOpen : undefined}
                className={`group flex w-full min-w-0 items-center gap-3 rounded-xl px-4 py-3 text-left text-sm font-extrabold transition-all duration-200 active:scale-[0.98] ${
                  parentActive
                    ? "bg-sibs-primary-1 text-white shadow-sm lg:translate-x-1"
                    : "bg-white text-sibs-primary-1 hover:translate-x-1 hover:bg-[#F2F6FA] hover:shadow-sm"
                }`}
              >
                {hasChildren ? (
                  <ChevronRight
                    size={14}
                    className={`shrink-0 transition-transform duration-200 ${
                      isOpen ? "rotate-90" : ""
                    }`}
                  />
                ) : (
                  <span className="w-[14px] shrink-0" />
                )}

                <span
                  className={`inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-xl transition-all duration-200 ${
                    parentActive
                      ? "bg-white/15 text-white"
                      : "bg-[#F2F6FA] text-sibs-primary-1 group-hover:bg-white"
                  }`}
                >
                  <Icon size={16} />
                </span>

                <span className="truncate">{tab.label}</span>
              </button>

              {hasChildren && (
                <div
                  className={`grid transition-all duration-200 ease-out ${
                    isOpen
                      ? "grid-rows-[1fr] opacity-100"
                      : "grid-rows-[0fr] opacity-0"
                  }`}
                >
                  <div className="overflow-hidden">
                    <div className="mt-1 space-y-1 pl-9 pr-1">
                      {tab.children.map((child) => {
                        const childActive = activeTab === child.key;

                        return (
                          <button
                            key={child.key}
                            type="button"
                            onClick={() => onTabChange?.(child.key)}
                            aria-current={childActive ? "page" : undefined}
                            className={`group/sub flex h-9 w-full min-w-0 items-center gap-2 rounded-full px-3 text-left text-xs font-bold transition-all duration-200 ${
                              childActive
                                ? "bg-[#BDD0EE] text-sibs-primary-1 shadow-sm"
                                : "text-sibs-primary-1/80 hover:translate-x-1 hover:bg-[#F8FAFC]"
                            }`}
                          >
                            <span
                              className={`h-1.5 w-1.5 shrink-0 rounded-full ${
                                childActive
                                  ? "bg-sibs-primary-1"
                                  : "bg-sibs-primary-1/40 group-hover/sub:bg-sibs-primary-1"
                              }`}
                            />
                            <span className="truncate">{child.label}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </aside>
  );
}

function getCandidatePipelineLookupId(candidate = {}) {
  const safeCandidate = safeObject(candidate);
  const metadata = safeObject(safeCandidate.metadata);
  const candidateSnapshot = safeObject(safeCandidate.candidateSnapshot);
  const pipelineCandidate = safeObject(safeCandidate.pipelineCandidate);
  const pipelineDetails = safeObject(safeCandidate.pipelineDetails);

  return cleanText(
    pipelineCandidate.dbId ||
      pipelineCandidate.id ||
      pipelineCandidate.rawId ||
      pipelineCandidate.pipelineId ||
      pipelineCandidate.pipeline_id ||
      pipelineDetails.dbId ||
      pipelineDetails.id ||
      pipelineDetails.rawId ||
      pipelineDetails.pipelineId ||
      pipelineDetails.pipeline_id ||
      safeCandidate.pipelineDbId ||
      safeCandidate.pipeline_db_id ||
      safeCandidate.pipelineId ||
      safeCandidate.pipeline_id ||
      safeCandidate.pipelineCandidateId ||
      safeCandidate.pipeline_candidate_id ||
      metadata.pipelineId ||
      metadata.pipeline_id ||
      metadata.pipelineDbId ||
      metadata.pipeline_db_id ||
      metadata.candidatePipelineId ||
      metadata.candidate_pipeline_id ||
      candidateSnapshot.pipelineId ||
      candidateSnapshot.pipeline_id ||
      candidateSnapshot.dbId ||
      candidateSnapshot.pipelineDbId ||
      "",
  );
}

function getResolvedPipelineId(candidate = {}, fallback = "") {
  const safeCandidate = safeObject(candidate);

  return cleanText(
    safeCandidate.dbId ||
      safeCandidate.id ||
      safeCandidate.pipelineId ||
      safeCandidate.pipeline_id ||
      safeCandidate.pipelineDbId ||
      safeCandidate.pipeline_db_id ||
      safeCandidate.candidatePipelineId ||
      safeCandidate.candidate_pipeline_id ||
      getCandidatePipelineLookupId(safeCandidate) ||
      fallback,
  );
}

function isTruthyFlag(value) {
  if (value === true) return true;
  if (value === 1) return true;

  const normalized = normalizeLower(value);

  return ["true", "1", "yes", "linked", "moved"].includes(normalized);
}

function isCandidateLinkedToPipeline(candidate = {}) {
  const safeCandidate = safeObject(candidate);
  const verifiedPipelineId = getCandidatePipelineLookupId(safeCandidate);

  /*
    A candidate is considered linked only when there is a real Candidate
    Pipeline identifier or an explicit linked flag. Stage/status text alone is
    not enough because another candidate can share the same email and appear in
    the pipeline search result.
  */
  return Boolean(
    verifiedPipelineId ||
      isTruthyFlag(safeCandidate.movedToPipeline) ||
      isTruthyFlag(safeCandidate.moved_to_pipeline),
  );
}

function getResolvedFileUrl(fileUrl = "") {
  const value = cleanText(fileUrl);

  if (!value) return "";

  if (
    value.startsWith("http://") ||
    value.startsWith("https://") ||
    value.startsWith("data:") ||
    value.startsWith("blob:")
  ) {
    return value;
  }

  const apiBaseUrl = cleanText(import.meta.env.VITE_API_URL).replace(/\/+$/, "");

  if (value.startsWith("/api/") && apiBaseUrl) {
    return `${apiBaseUrl}${value}`;
  }

  return value;
}

function buildCandidatePipelineFileUrl(candidate = {}, file = {}) {
  const lookupId = getResolvedPipelineId(candidate);

  const filename =
    file.savedFileName ||
    file.filename ||
    file.saved_file_name ||
    file.storedFileName ||
    file.stored_file_name ||
    file.fileName ||
    file.name ||
    "";

  if (!lookupId || !filename) return "";

  return `/api/candidate-pipeline/file/${encodeURIComponent(
    lookupId,
  )}/${encodeURIComponent(filename)}`;
}

function normalizeCandidateFile(file = {}, candidate = {}) {
  const safeFile = safeObject(file);

  const savedFileName =
    safeFile.savedFileName ||
    safeFile.filename ||
    safeFile.saved_file_name ||
    safeFile.storedFileName ||
    safeFile.stored_file_name ||
    "";

  const fileName =
    safeFile.fileName ||
    safeFile.name ||
    safeFile.originalName ||
    safeFile.originalname ||
    safeFile.attachmentFileName ||
    safeFile.audioFileName ||
    savedFileName ||
    "";

  const fileUrl =
    safeFile.fileUrl ||
    safeFile.url ||
    safeFile.dataUrl ||
    safeFile.previewUrl ||
    safeFile.downloadUrl ||
    safeFile.attachmentFileUrl ||
    safeFile.audioFileUrl ||
    buildCandidatePipelineFileUrl(candidate, {
      ...safeFile,
      fileName,
      savedFileName,
    });

  const requirement = getRequirementDisplayLabel({
    ...safeFile,
    fileName,
    savedFileName,
  });

  return {
    ...safeFile,
    id:
      safeFile.id ||
      safeFile.fileId ||
      safeFile.file_id ||
      `${requirement || "nho-file"}-${fileName}-${savedFileName}-${fileUrl}`,
    requirement,
    officialRequirement: getNormalizedPreEmploymentRequirement({
      ...safeFile,
      fileName,
      savedFileName,
    }),
    fileName,
    savedFileName,
    filename: safeFile.filename || savedFileName,
    fileUrl: getResolvedFileUrl(fileUrl),
    fileType:
      safeFile.fileType ||
      safeFile.type ||
      safeFile.mimetype ||
      safeFile.mimeType ||
      safeFile.attachmentFileType ||
      safeFile.audioFileType ||
      "",
    fileSize:
      safeFile.fileSize ||
      safeFile.size ||
      safeFile.attachmentFileSize ||
      safeFile.audioFileSize ||
      0,
    uploadedAt:
      safeFile.uploadedAt ||
      safeFile.uploaded_at ||
      safeFile.createdAt ||
      safeFile.created_at ||
      safeFile.updatedAt ||
      safeFile.updated_at ||
      "",
    uploadedBy:
      safeFile.uploadedBy ||
      safeFile.uploaded_by ||
      safeFile.createdBy ||
      safeFile.created_by ||
      safeFile.updatedBy ||
      safeFile.updated_by ||
      "",
    applicantFolderName:
      safeFile.applicantFolderName ||
      safeFile.applicant_folder_name ||
      safeFile.folderName ||
      "",
  };
}

function getCandidateFileUniqueKey(file = {}) {
  return [
    cleanText(file.requirement),
    cleanText(file.fileName),
    cleanText(file.savedFileName),
    cleanText(file.filename),
    cleanText(file.fileUrl),
    cleanText(file.uploadedAt),
  ]
    .filter(Boolean)
    .join("|")
    .toLowerCase();
}

function normalizeCandidateFiles(files = [], candidate = {}) {
  const map = new Map();

  files
    .filter(Boolean)
    .map((file) => normalizeCandidateFile(file, candidate))
    .filter((file) => file.fileName || file.savedFileName || file.fileUrl)
    .forEach((file) => {
      const key =
        getCandidateFileUniqueKey(file) ||
        `${file.requirement}-${file.fileName}`;

      if (!map.has(key)) {
        map.set(key, file);
      }
    });

  return Array.from(map.values()).sort((a, b) => {
    const aMajor = isMajorPreEmploymentRequirement(a.requirement) ? 0 : 1;
    const bMajor = isMajorPreEmploymentRequirement(b.requirement) ? 0 : 1;

    if (aMajor !== bMajor) return aMajor - bMajor;

    const aOfficial = isOfficialPreEmploymentFile(a) ? 0 : 1;
    const bOfficial = isOfficialPreEmploymentFile(b) ? 0 : 1;

    if (aOfficial !== bOfficial) return aOfficial - bOfficial;

    const requirementSort =
      getRequirementSortIndex(a.requirement) -
      getRequirementSortIndex(b.requirement);

    if (requirementSort !== 0) return requirementSort;

    const dateA = new Date(a.uploadedAt || 0).getTime();
    const dateB = new Date(b.uploadedAt || 0).getTime();

    if (Number.isFinite(dateA) && Number.isFinite(dateB) && dateA !== dateB) {
      return dateB - dateA;
    }

    return cleanText(a.fileName).localeCompare(cleanText(b.fileName));
  });
}

function getCandidatePreEmploymentFiles(candidate = {}) {
  const safeCandidate = safeObject(candidate);
  const metadata = safeObject(safeCandidate.metadata);
  const candidateSnapshot = safeObject(safeCandidate.candidateSnapshot);
  const pipelineCandidate = safeObject(safeCandidate.pipelineCandidate);
  const pipelineDetails = safeObject(safeCandidate.pipelineDetails);
  const pipelineMetadata = safeObject(pipelineCandidate.metadata);

  const sources = [
    safeCandidate.nhoFiles,
    safeCandidate.nho_files,
    safeCandidate.preEmploymentFiles,
    safeCandidate.pre_employment_files,
    safeCandidate.uploadedFiles,
    safeCandidate.files,

    metadata.nhoFiles,
    metadata.nho_files,
    metadata.preEmploymentFiles,
    metadata.pre_employment_files,
    metadata.uploadedFiles,
    metadata.files,

    candidateSnapshot.nhoFiles,
    candidateSnapshot.nho_files,
    candidateSnapshot.preEmploymentFiles,
    candidateSnapshot.pre_employment_files,
    candidateSnapshot.uploadedFiles,
    candidateSnapshot.files,

    pipelineCandidate.nhoFiles,
    pipelineCandidate.nho_files,
    pipelineCandidate.preEmploymentFiles,
    pipelineCandidate.pre_employment_files,
    pipelineCandidate.uploadedFiles,
    pipelineCandidate.files,

    pipelineDetails.nhoFiles,
    pipelineDetails.nho_files,
    pipelineDetails.preEmploymentFiles,
    pipelineDetails.pre_employment_files,
    pipelineDetails.uploadedFiles,
    pipelineDetails.files,

    pipelineMetadata.nhoFiles,
    pipelineMetadata.nho_files,
    pipelineMetadata.preEmploymentFiles,
    pipelineMetadata.pre_employment_files,
    pipelineMetadata.uploadedFiles,
    pipelineMetadata.files,
  ];

  return normalizeCandidateFiles(
    sources.flatMap((source) => safeArray(source)),
    safeCandidate,
  );
}

function getNhoFilesFromApiResponse(response) {
  const payload = response?.data ?? response;
  const data = payload?.data || {};

  return [
    ...safeArray(payload?.files),
    ...safeArray(data?.files),
    ...safeArray(payload?.nhoFiles),
    ...safeArray(payload?.nho_files),
    ...safeArray(data?.nhoFiles),
    ...safeArray(data?.nho_files),
    ...safeArray(payload?.candidate?.nhoFiles),
    ...safeArray(payload?.candidate?.nho_files),
    ...safeArray(data?.candidate?.nhoFiles),
    ...safeArray(data?.candidate?.nho_files),
  ];
}

function getPipelineCandidateFromResponse(response) {
  const payload = response?.data ?? response;

  return (
    payload?.data?.candidate ||
    payload?.candidate ||
    payload?.data ||
    payload ||
    null
  );
}

function getPipelineRowsFromListResponse(response) {
  const payload = response?.data ?? response;

  return safeArray(
    payload?.data ||
      payload?.candidates ||
      payload?.records ||
      payload?.rows ||
      [],
  );
}

function normalizeMatchText(value = "") {
  return normalizeLower(value)
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function namesMatchStrict(firstName = "", secondName = "") {
  const first = normalizeMatchText(firstName);
  const second = normalizeMatchText(secondName);

  if (!first || !second) return false;

  return first === second;
}

function collectCandidateIdentityIds(candidate = {}) {
  return [
    candidate.candidateId,
    candidate.candidate_id,
    candidate.candidateApplicationId,
    candidate.candidate_application_id,
    candidate.applicationId,
    candidate.application_id,
    candidate.publicId,
    candidate.public_id,
  ]
    .map(cleanText)
    .filter(Boolean);
}

function candidateMatchesPipeline(candidate = {}, pipelineCandidate = {}) {
  const sourceTalentPoolId = cleanText(
    pipelineCandidate.sourceTalentPoolId ||
      pipelineCandidate.source_talent_pool_id,
  );

  const talentPoolId = cleanText(candidate.id || candidate.rawId);

  if (sourceTalentPoolId && talentPoolId && sourceTalentPoolId === talentPoolId) {
    return true;
  }

  const candidateIds = collectCandidateIdentityIds(candidate);
  const pipelineCandidateIds = collectCandidateIdentityIds(pipelineCandidate);

  if (candidateIds.some((id) => pipelineCandidateIds.includes(id))) {
    return true;
  }

  const email = normalizeLower(candidate.email);
  const pipelineEmail = normalizeLower(pipelineCandidate.email);

  const name =
    candidate.name ||
    candidate.fullName ||
    [candidate.firstName, candidate.middleName, candidate.lastName]
      .filter(Boolean)
      .join(" ");

  const pipelineName =
    pipelineCandidate.name ||
    pipelineCandidate.fullName ||
    pipelineCandidate.candidateName ||
    [
      pipelineCandidate.firstName,
      pipelineCandidate.middleName,
      pipelineCandidate.lastName,
    ]
      .filter(Boolean)
      .join(" ");

  /*
    Email alone is not safe. The same email can be reused in test records or
    public submissions. Only treat an email match as linked when the candidate
    name also matches exactly after normalization.
  */
  return Boolean(
    email &&
      pipelineEmail &&
      email === pipelineEmail &&
      namesMatchStrict(name, pipelineName),
  );
}

async function fetchPipelineCandidateByAnyIdentity(candidate = {}) {
  const directLookupId = getCandidatePipelineLookupId(candidate);

  if (directLookupId) {
    try {
      const response = await api.get(
        `/api/candidate-pipeline/${encodeURIComponent(directLookupId)}`,
        {
          withCredentials: true,
          params: {
            _t: Date.now(),
          },
        },
      );

      const directCandidate = getPipelineCandidateFromResponse(response);

      if (directCandidate && directCandidate.success !== false) {
        return safeObject(directCandidate);
      }
    } catch {
      // Continue to list fallback.
    }
  }

  const searchTerms = [
    candidate.candidateId,
    candidate.candidate_id,
    candidate.candidateApplicationId,
    candidate.candidate_application_id,
    candidate.applicationId,
    candidate.application_id,
    candidate.email,
    candidate.name,
  ]
    .map(cleanText)
    .filter(Boolean);

  const uniqueSearchTerms = Array.from(new Set(searchTerms));

  for (const term of uniqueSearchTerms) {
    try {
      const response = await api.get("/api/candidate-pipeline", {
        withCredentials: true,
        params: {
          page: 1,
          limit: 500,
          search: term,
          _t: Date.now(),
        },
      });

      const rows = getPipelineRowsFromListResponse(response);
      const match = rows.find((row) =>
        candidateMatchesPipeline(candidate, row),
      );

      if (match) {
        return safeObject(match);
      }
    } catch {
      // Try next term.
    }
  }

  return null;
}

function mergeHistoryArrays(...sources) {
  return sources.flatMap((source) => safeArray(source));
}

function mergeCandidateWithPipelineDetails(candidate = {}, pipelineCandidate = {}) {
  const safeCandidate = safeObject(candidate);
  const safePipelineCandidate = safeObject(pipelineCandidate);

  if (!Object.keys(safePipelineCandidate).length) {
    return safeCandidate;
  }

  const candidateMetadata = safeObject(safeCandidate.metadata);
  const pipelineMetadata = safeObject(safePipelineCandidate.metadata);
  const existingPipelineCandidate = safeObject(safeCandidate.pipelineCandidate);
  const candidateSnapshot = safeObject(safeCandidate.candidateSnapshot);

  const pipelineTimeline = mergeHistoryArrays(
    safePipelineCandidate.timeline,
    safePipelineCandidate.movementTimeline,
    safePipelineCandidate.movementHistory,
    safePipelineCandidate.pipelineHistory,
    safePipelineCandidate.stageHistory,
    safePipelineCandidate.history,
    safePipelineCandidate.activityHistory,
    pipelineMetadata.timeline,
    pipelineMetadata.movementTimeline,
    pipelineMetadata.movementHistory,
    pipelineMetadata.pipelineHistory,
  );

  const applicationHistory = mergeHistoryArrays(
    safeCandidate.applicationHistory,
    safeCandidate.movementTimeline,
    safeCandidate.movementHistory,
    safeCandidate.pipelineHistory,
    safeCandidate.stageHistory,
    safeCandidate.timeline,
    safeCandidate.history,
    safeCandidate.activityHistory,

    candidateSnapshot.applicationHistory,
    candidateSnapshot.timeline,
    candidateSnapshot.movementTimeline,

    candidateMetadata.applicationHistory,
    candidateMetadata.timeline,
    candidateMetadata.movementTimeline,
    candidateMetadata.pipelineHistory,
    candidateMetadata.pipelineTimeline,

    pipelineTimeline,
  );

  const pipelineNhoFiles = mergeHistoryArrays(
    safePipelineCandidate.nhoFiles,
    safePipelineCandidate.nho_files,
    safePipelineCandidate.preEmploymentFiles,
    safePipelineCandidate.pre_employment_files,
    safePipelineCandidate.uploadedFiles,
    safePipelineCandidate.files,
    pipelineMetadata.nhoFiles,
    pipelineMetadata.nho_files,
    pipelineMetadata.preEmploymentFiles,
    pipelineMetadata.pre_employment_files,
    pipelineMetadata.uploadedFiles,
    pipelineMetadata.files,
  );

  return {
    ...safeCandidate,

    pipelineCandidate: {
      ...existingPipelineCandidate,
      ...safePipelineCandidate,
    },

    pipelineDetails: safePipelineCandidate,

    pipelineStatus:
      safePipelineCandidate.pipelineStatus ||
      safePipelineCandidate.pipeline_status ||
      safeCandidate.pipelineStatus ||
      (safePipelineCandidate.currentStage ||
      safePipelineCandidate.current_stage ||
      safePipelineCandidate.currentPipelineStage ||
      safePipelineCandidate.current_pipeline_stage
        ? "Active"
        : safeCandidate.pipelineStatus),

    currentPipelineStage:
      safePipelineCandidate.currentPipelineStage ||
      safePipelineCandidate.current_pipeline_stage ||
      safePipelineCandidate.currentStage ||
      safePipelineCandidate.current_stage ||
      safePipelineCandidate.pipelineStage ||
      safePipelineCandidate.pipeline_stage ||
      safePipelineCandidate.stage ||
      safeCandidate.currentPipelineStage ||
      safeCandidate.current_pipeline_stage ||
      safeCandidate.currentStage ||
      safeCandidate.current_stage ||
      safeCandidate.pipelineStage ||
      safeCandidate.pipeline_stage,

    currentStage:
      safePipelineCandidate.currentStage ||
      safePipelineCandidate.current_stage ||
      safePipelineCandidate.currentPipelineStage ||
      safePipelineCandidate.current_pipeline_stage ||
      safePipelineCandidate.pipelineStage ||
      safePipelineCandidate.pipeline_stage ||
      safePipelineCandidate.stage ||
      safeCandidate.currentStage ||
      safeCandidate.current_stage ||
      safeCandidate.currentPipelineStage ||
      safeCandidate.current_pipeline_stage ||
      safeCandidate.pipelineStage ||
      safeCandidate.pipeline_stage,

    pipelineStage:
      safePipelineCandidate.pipelineStage ||
      safePipelineCandidate.pipeline_stage ||
      safePipelineCandidate.currentStage ||
      safePipelineCandidate.current_stage ||
      safePipelineCandidate.currentPipelineStage ||
      safePipelineCandidate.current_pipeline_stage ||
      safeCandidate.pipelineStage ||
      safeCandidate.pipeline_stage,

    currentAppliedRole:
      safePipelineCandidate.currentAppliedRole ||
      safePipelineCandidate.current_applied_role ||
      safePipelineCandidate.roleTitle ||
      safePipelineCandidate.role_title ||
      safePipelineCandidate.openPosition ||
      safePipelineCandidate.open_position ||
      safePipelineCandidate.roleCapability ||
      safePipelineCandidate.role_capability ||
      safeCandidate.currentAppliedRole ||
      safeCandidate.current_applied_role,

    currentAppliedAccount:
      safePipelineCandidate.currentAppliedAccount ||
      safePipelineCandidate.current_applied_account ||
      safePipelineCandidate.account ||
      safePipelineCandidate.accountName ||
      safePipelineCandidate.leadAccount ||
      safePipelineCandidate.lead_account ||
      safeCandidate.currentAppliedAccount ||
      safeCandidate.current_applied_account,

    currentTaOwner:
      safePipelineCandidate.currentTaOwner ||
      safePipelineCandidate.current_ta_owner ||
      safePipelineCandidate.updatedBySibsId ||
      safePipelineCandidate.updated_by_sibs_id ||
      safeCandidate.currentTaOwner ||
      safeCandidate.current_ta_owner,

    nhoFiles: normalizeCandidateFiles(
      [...getCandidatePreEmploymentFiles(safeCandidate), ...pipelineNhoFiles],
      safePipelineCandidate,
    ),

    applicationHistory,
    timeline: pipelineTimeline.length ? pipelineTimeline : safeCandidate.timeline,

    finalInterviewSubmittedForms:
      safePipelineCandidate.finalInterviewSubmittedForms ||
      safePipelineCandidate.final_interview_submitted_forms ||
      safeCandidate.finalInterviewSubmittedForms,

    final_interview_submitted_forms:
      safePipelineCandidate.final_interview_submitted_forms ||
      safePipelineCandidate.finalInterviewSubmittedForms ||
      safeCandidate.final_interview_submitted_forms,

    metadata: {
      ...candidateMetadata,
      pipeline: safePipelineCandidate,
      pipelineTimeline,
      applicationHistory,
    },
  };
}

function getNormalizedHistoryDate(value) {
  if (!value) return "";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return cleanText(value);
  }

  return date.toISOString().slice(0, 16);
}

function getHistoryTitle(item = {}) {
  const rawTitle =
    item.stage ||
    item.pipelineStage ||
    item.pipeline_stage ||
    item.currentStage ||
    item.current_stage ||
    item.currentPipelineStage ||
    item.current_pipeline_stage ||
    item.outcome ||
    item.title ||
    "Application Update";

  const title = cleanText(rawTitle);

  if (title.includes("PRF status changed")) return "Initial Screening";
  if (title.includes("PRF status updated")) return "Initial Screening";
  if (title.includes("Assessment marked")) return "Online Assessment";
  if (title.includes("Assessment updated")) return "Online Assessment";
  if (title.includes("interview schedule")) return "Interview Scheduled";
  if (title.includes("Interview schedule")) return "Interview Scheduled";
  if (title.includes("Interview started")) return "Interview Scheduled";
  if (title.includes("Interview completed")) return "Interviewed";
  if (title.includes("Final interview")) return "Interviewed";
  if (title.includes("Offer details")) return "Offered";
  if (title.includes("Offer approved")) return "Accepted";
  if (title.includes("NHO schedule")) return "For NHO";
  if (title.includes("incomplete major")) return INCOMPLETE_ONBOARDING_STAGE;

  return title || "Application Update";
}

function getHistoryDate(item = {}) {
  return (
    item.date ||
    item.createdAt ||
    item.created_at ||
    item.updatedAt ||
    item.updated_at ||
    item.activityDate ||
    item.activity_date ||
    item.timestamp ||
    item.submittedAt ||
    item.submitted_at ||
    item.submittedAtIso ||
    ""
  );
}

function getHistoryOwner(item = {}, candidate = {}, fallbackOwner = "—") {
  return (
    item.owner ||
    item.taOwner ||
    item.ta_owner ||
    item.updatedBy ||
    item.updated_by ||
    item.createdBy ||
    item.created_by ||
    item.updatedBySibsId ||
    item.updated_by_sibs_id ||
    item.createdBySibsId ||
    item.created_by_sibs_id ||
    candidate.currentTaOwner ||
    candidate.current_ta_owner ||
    candidate.taOwner ||
    candidate.ta_owner ||
    candidate.owner ||
    fallbackOwner ||
    "—"
  );
}

function getHistoryDescription(item = {}) {
  const directDescription =
    item.description ||
    item.reason ||
    item.message ||
    item.note ||
    item.outcome ||
    "";

  if (directDescription) return directDescription;

  const title = getHistoryTitle(item);

  if (title === "Initial Screening") return "Candidate moved from Talent Pool.";
  if (title === "Online Assessment") return "Candidate moved to Online Assessment.";
  if (title === "Interview Scheduled") {
    return "Candidate interview schedule was set.";
  }
  if (title === "Interviewed") return "Final interview form was submitted.";
  if (title === "Offered") return "Offer details prepared for approval.";
  if (title === "Accepted") return "Candidate accepted the offer.";
  if (title === "For NHO") return "Candidate moved to For NHO.";
  if (title === INCOMPLETE_ONBOARDING_STAGE) {
    return "Candidate has fewer than 5 major requirements and was routed to Talent Pool for follow-up.";
  }
  if (title === ONBOARDING_STAGE) {
    return "Candidate completed the 5 major requirements and moved to Onboarding.";
  }

  return "Candidate application record updated.";
}

function getOfferDetail(item = {}) {
  const role =
    item.offerRole ||
    item.finalRole ||
    item.currentAppliedRole ||
    item.appliedRole ||
    item.role ||
    item.roleTitle ||
    item.offerDetails?.roleTitle ||
    item.extra?.offerDetails?.roleTitle ||
    "";

  const account =
    item.offerAccount ||
    item.finalAccount ||
    item.currentAppliedAccount ||
    item.appliedAccount ||
    item.account ||
    item.offerDetails?.account ||
    item.extra?.offerDetails?.account ||
    "";

  const basicPay =
    item.basicPay ||
    item.offerDetails?.basicPay ||
    item.extra?.offerDetails?.basicPay ||
    item.compensation ||
    "";

  const deminimisDailyRate =
    item.deminimisDailyRate ||
    item.offerDetails?.deminimisDailyRate ||
    item.extra?.offerDetails?.deminimisDailyRate ||
    "";

  const hiringRequirement =
    item.hiringRequirementId ||
    item.offerDetails?.hiringRequirementId ||
    item.extra?.offerDetails?.hiringRequirementId ||
    "";

  const details = [];

  if (hiringRequirement) details.push(`Hiring Requirement: ${hiringRequirement}`);
  if (role) details.push(`Final Role: ${role}`);
  if (account) details.push(`Final Account: ${account}`);
  if (basicPay) details.push(`Basic Pay: ${formatCurrency(basicPay)}`);
  if (deminimisDailyRate) {
    details.push(`Deminimis / Daily Rate: ${formatCurrency(deminimisDailyRate)}`);
  }

  return details.join(", ");
}

function normalizeHistoryItem(item = {}, candidate = {}, fallbackOwner = "—") {
  const historyTitle = getHistoryTitle(item);
  const historyDate = getHistoryDate(item);
  const historyDescription = getHistoryDescription(item);
  const historyRemarks = item.remarks || item.dropOffReason || "";
  const offerDetail = getOfferDetail(item);
  const savedFormLink =
    item.savedFormLink ||
    item.jobEvaluationLink ||
    item.extra?.savedFormLink ||
    item.extra?.jobEvaluationLink ||
    "";
  const sortDate = getNormalizedHistoryDate(historyDate);

  return {
    ...item,
    stage: historyTitle,
    date: historyDate,
    owner: getHistoryOwner(item, candidate, fallbackOwner),
    description: historyDescription,
    remarks: historyRemarks,
    offerDetail,
    savedFormLink,
    _dedupeKey: [
      historyTitle,
      sortDate,
      historyDescription,
      historyRemarks,
      offerDetail,
      savedFormLink,
    ]
      .join("|")
      .toLowerCase()
      .trim(),
    _sortDate: sortDate,
  };
}

function getCandidateApplicationHistory(candidate = {}, fallbackOwner = "—") {
  const safeCandidate = safeObject(candidate);
  const metadata = safeObject(safeCandidate.metadata);
  const pipelineCandidate = safeObject(safeCandidate.pipelineCandidate);
  const pipelineDetails = safeObject(safeCandidate.pipelineDetails);
  const candidateSnapshot = safeObject(safeCandidate.candidateSnapshot);

  const sources = [
    safeCandidate.applicationHistory,
    safeCandidate.movementTimeline,
    safeCandidate.movementHistory,
    safeCandidate.pipelineHistory,
    safeCandidate.stageHistory,
    safeCandidate.timeline,
    safeCandidate.history,
    safeCandidate.activityHistory,

    candidateSnapshot.applicationHistory,
    candidateSnapshot.timeline,
    candidateSnapshot.movementTimeline,

    metadata.applicationHistory,
    metadata.timeline,
    metadata.movementTimeline,
    metadata.pipelineHistory,
    metadata.pipelineTimeline,

    pipelineCandidate.timeline,
    pipelineCandidate.movementTimeline,
    pipelineCandidate.movementHistory,
    pipelineCandidate.pipelineHistory,
    pipelineCandidate.stageHistory,
    pipelineCandidate.history,
    pipelineCandidate.activityHistory,

    pipelineDetails.timeline,
    pipelineDetails.movementTimeline,
    pipelineDetails.movementHistory,
    pipelineDetails.pipelineHistory,
    pipelineDetails.stageHistory,
    pipelineDetails.history,
    pipelineDetails.activityHistory,
  ];

  const merged = sources
    .filter(Array.isArray)
    .flat()
    .filter(Boolean)
    .map((item) => normalizeHistoryItem(item, safeCandidate, fallbackOwner))
    .filter((item) => item.stage || item.description);

  const uniqueMap = new Map();

  merged.forEach((item) => {
    const key = item._dedupeKey;

    if (!key) return;

    if (!uniqueMap.has(key)) {
      uniqueMap.set(key, item);
    }
  });

  return Array.from(uniqueMap.values()).sort((a, b) => {
    const dateA = new Date(a.date || 0).getTime();
    const dateB = new Date(b.date || 0).getTime();

    if (Number.isNaN(dateA) && Number.isNaN(dateB)) return 0;
    if (Number.isNaN(dateA)) return -1;
    if (Number.isNaN(dateB)) return 1;

    return dateA - dateB;
  });
}

function getFilesForRequirement(files = [], requirement = "") {
  const requirementKey = normalizeRequirementKey(requirement);

  return files.filter((file) => {
    const officialKey = normalizeRequirementKey(file.officialRequirement);
    const displayKey = normalizeRequirementKey(file.requirement);

    return officialKey === requirementKey || displayKey === requirementKey;
  });
}

function getCompletedCountForGroup(files = [], requirements = []) {
  return requirements.filter(
    (requirement) => getFilesForRequirement(files, requirement).length > 0,
  ).length;
}

function buildCandidatePipelineNavigationUrl(candidate = {}, pipelineId = "") {
  const stage = getCandidateStageValue(candidate);
  const candidateId = getCandidatePublicId(candidate);
  const resolvedPipelineId = cleanText(
    pipelineId || getResolvedPipelineId(candidate),
  );

  const params = new URLSearchParams();

  if (stage) params.set("stage", stage);
  if (candidateId) params.set("candidateId", candidateId);
  if (resolvedPipelineId) params.set("pipelineId", resolvedPipelineId);

  return `${CANDIDATE_PIPELINE_ROUTE}${
    params.toString() ? `?${params.toString()}` : ""
  }`;
}

function buildOnboardingNavigationUrl(candidate = {}, pipelineId = "") {
  const candidateId = getCandidatePublicId(candidate);
  const resolvedPipelineId = cleanText(
    pipelineId || getResolvedPipelineId(candidate),
  );

  const params = new URLSearchParams();

  if (candidateId) params.set("candidateId", candidateId);
  if (resolvedPipelineId) params.set("pipelineId", resolvedPipelineId);

  return `${ONBOARDING_ROUTE}${params.toString() ? `?${params.toString()}` : ""}`;
}

function SectionTitle({ icon: Icon, title, description }) {
  return (
    <div className="mb-5 flex items-start justify-between gap-4">
      <div className="flex min-w-0 items-start gap-3">
        {Icon && (
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#EAF2FB] text-sibs-primary-1 sm:h-10 sm:w-10">
            <Icon size={18} className="h-[18px] w-[18px] sm:h-5 sm:w-5" />
          </div>
        )}

        <div className="min-w-0">
          <h3 className="break-words text-sm font-extrabold uppercase tracking-wide text-[#101828] sm:text-base">
            {title}
          </h3>

          {description && (
            <p className="mt-1 break-words text-xs font-medium leading-5 text-sibs-tertiary-5 sm:text-sm">
              {description}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

function ProfileGrid({ children, cols = "md:grid-cols-2" }) {
  return (
    <div className={`grid min-w-0 grid-cols-1 gap-3 ${cols}`}>
      {children}
    </div>
  );
}

function ProfileDetail({ label, value }) {
  const displayValue =
    value === null || value === undefined || value === "" ? "—" : value;

  const isLongText = [
    "email",
    "address",
    "physical address",
    "preferred location",
    "how did you hear about us",
    "training attended",
    "skills / language",
    "affiliations",
    "general remarks",
  ].includes(String(label || "").toLowerCase());

  return (
    <div className="flex min-h-[84px] min-w-0 flex-col justify-center rounded-[10px] bg-[#F8FAFC] px-3 py-2.5 sm:px-4">
      <p className="mb-1.5 break-words text-[10px] font-extrabold uppercase leading-4 tracking-wide text-sibs-primary-1/70 sm:text-[11px]">
        {label}
      </p>

      <p
        title={String(displayValue)}
        className={`flex min-h-9 min-w-0 items-center text-sm font-extrabold leading-[18px] text-[#344054] ${
          isLongText ? "break-all" : "break-words"
        }`}
      >
        {displayValue}
      </p>
    </div>
  );
}





function NhoRequirementCard({
  requirement,
  files = [],
  selectedFileId = "",
  onSelect,
}) {
  const hasFiles = files.length > 0;
  const isMajor = isMajorPreEmploymentRequirement(requirement);

  return (
    <div
      className={`rounded-xl border p-4 transition ${
        hasFiles
          ? "border-emerald-200 bg-emerald-50/50"
          : "border-[#D9E2EC] bg-[#F8FAFC]"
      }`}
    >
      <div className="flex min-w-0 items-start gap-3">
        <div
          className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-md border ${
            hasFiles
              ? "border-emerald-500 bg-emerald-500 text-white"
              : "border-[#B9C7D6] bg-white"
          }`}
        >
          {hasFiles && <Check size={14} strokeWidth={3} />}
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex min-w-0 items-start justify-between gap-2">
            <p
              title={requirement}
              className="truncate text-sm font-extrabold text-[#101828]"
            >
              {requirement}
            </p>

            {isMajor && (
              <span className="shrink-0 rounded-full border border-blue-100 bg-blue-50 px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-wide text-sibs-primary-1">
                Major
              </span>
            )}
          </div>

          {!hasFiles && (
            <div className="mt-3 rounded-xl border border-dashed border-[#C9D6E4] bg-white px-3 py-3 text-xs font-bold text-sibs-tertiary-5">
              No uploaded file yet.
            </div>
          )}

          {hasFiles && (
            <div className="mt-3 space-y-2">
              {files.map((file) => {
                const FileIcon = getFileIcon(file.fileName);
                const isSelected = selectedFileId && selectedFileId === file.id;

                return (
                  <button
                    key={`${file.id}-${file.fileName}-${file.fileUrl}`}
                    type="button"
                    onClick={() => onSelect?.(file)}
                    className={`flex w-full min-w-0 items-center gap-2 rounded-xl border px-3 py-2 text-left transition ${
                      isSelected
                        ? "border-sibs-primary-1 bg-blue-50"
                        : "border-emerald-100 bg-white hover:bg-emerald-50"
                    }`}
                  >
                    <FileIcon
                      size={17}
                      className={`shrink-0 ${
                        isSelected ? "text-sibs-primary-1" : "text-emerald-700"
                      }`}
                    />

                    <span className="min-w-0 flex-1">
                      <span
                        title={file.fileName || file.savedFileName}
                        className={`block truncate text-xs font-extrabold ${
                          isSelected
                            ? "text-sibs-primary-1"
                            : "text-emerald-800"
                        }`}
                      >
                        {file.fileName || file.savedFileName || "Uploaded file"}
                      </span>

                      <span
                        className={`mt-0.5 block truncate text-[11px] font-bold ${
                          isSelected
                            ? "text-sibs-primary-1/80"
                            : "text-emerald-700/80"
                        }`}
                      >
                        {formatFileSize(file.fileSize)}
                      </span>
                    </span>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function ProfileTextarea({ label, value }) {
  const displayValue =
    value === null || value === undefined || value === "" ? "—" : value;

  return (
    <div className="min-w-0 rounded-[10px] bg-[#F8FAFC] px-3 py-3 sm:px-4">
      <p className="mb-2 text-[10px] font-extrabold uppercase tracking-wide text-sibs-primary-1/70 sm:text-[11px]">
        {label}
      </p>

      <p className="whitespace-pre-wrap break-words text-sm font-extrabold leading-6 text-[#344054]">
        {displayValue}
      </p>
    </div>
  );
}

function DetailRow({ label, value }) {
  return <ProfileDetail label={label} value={value} />;
}

function EmptyState({ title, description }) {
  return (
    <div className="rounded-xl border border-dashed border-[#D9E2EC] bg-[#F8FAFC] px-4 py-8 text-center text-sm font-bold text-sibs-tertiary-5 sm:px-5">
      <p>{title}</p>

      {description && (
        <p className="mt-1 text-xs font-semibold leading-5 text-sibs-tertiary-5">
          {description}
        </p>
      )}
    </div>
  );
}

function NhoFilePreviewPanel({ file }) {
  if (!file) {
    return (
      <div className="flex min-h-[320px] flex-col items-center justify-center rounded-2xl border border-dashed border-[#B9C7D6] bg-[#F8FAFC] p-6 text-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-[#D9E2EC] bg-white text-sibs-primary-1 shadow-sm">
          <FileText size={27} />
        </div>

        <p className="mt-4 text-base font-extrabold text-[#101828]">
          No file selected
        </p>

        <p className="mt-2 max-w-xs text-sm font-semibold leading-6 text-sibs-tertiary-5">
          Select an uploaded NHO file from the requirements list to preview its
          details here.
        </p>
      </div>
    );
  }

  const FileIcon = getFileIcon(file.fileName);
  const resolvedFileUrl = getResolvedFileUrl(file.fileUrl);

  const isImageByType = String(file.fileType || "").startsWith("image/");
  const isImageByName = /\.(jpg|jpeg|png|gif|webp|heic|heif)$/i.test(
    file.fileName || "",
  );

  const isImage =
    resolvedFileUrl &&
    (isImageByType || isImageByName) &&
    !String(resolvedFileUrl).startsWith("blob:");

  return (
    <div className="rounded-2xl border border-[#D9E2EC] bg-[#F8FAFC] p-5">
      <div className="flex items-start gap-3">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-white text-sibs-primary-1 shadow-sm">
          <FileIcon size={24} />
        </div>

        <div className="min-w-0">
          <p className="text-xs font-extrabold uppercase tracking-wide text-sibs-primary-1">
            Selected File
          </p>

          <h3
            title={file.fileName || file.savedFileName}
            className="mt-1 break-words text-base font-extrabold text-[#101828]"
          >
            {file.fileName || file.savedFileName || "Uploaded file"}
          </h3>

          <p className="mt-1 text-xs font-bold text-sibs-tertiary-5">
            {formatFileSize(file.fileSize)}
          </p>
        </div>
      </div>

      <div className="mt-5 space-y-3 rounded-xl border border-[#E6ECF2] bg-white p-4">
        <div>
          <p className="text-[11px] font-extrabold uppercase tracking-wide text-sibs-tertiary-5">
            Requirement
          </p>

          <p className="mt-1 text-sm font-bold text-sibs-primary-1">
            {file.requirement || "NHO Uploaded File"}
          </p>
        </div>

        <div>
          <p className="text-[11px] font-extrabold uppercase tracking-wide text-sibs-tertiary-5">
            Uploaded At
          </p>

          <p className="mt-1 text-sm font-bold text-sibs-primary-1">
            {formatUploadedDate(file.uploadedAt)}
          </p>
        </div>

        {file.uploadedBy && (
          <div>
            <p className="text-[11px] font-extrabold uppercase tracking-wide text-sibs-tertiary-5">
              Uploaded By
            </p>

            <p className="mt-1 break-words text-sm font-bold text-sibs-primary-1">
              {file.uploadedBy}
            </p>
          </div>
        )}

        {file.applicantFolderName && (
          <div>
            <p className="text-[11px] font-extrabold uppercase tracking-wide text-sibs-tertiary-5">
              Server Folder
            </p>

            <p className="mt-1 break-words text-sm font-bold text-sibs-primary-1">
              {file.applicantFolderName}
            </p>
          </div>
        )}
      </div>

      {isImage && (
        <div className="mt-5 overflow-hidden rounded-xl border border-[#E6ECF2] bg-white">
          <img
            src={resolvedFileUrl}
            alt={file.fileName || "Uploaded file"}
            className="max-h-[280px] w-full object-contain"
          />
        </div>
      )}

      {resolvedFileUrl && (
        <a
          href={resolvedFileUrl}
          target="_blank"
          rel="noreferrer"
          className="mt-5 inline-flex h-11 w-full items-center justify-center rounded-xl bg-sibs-primary-1 px-4 text-sm font-extrabold text-white transition hover:opacity-90"
        >
          Open File
        </a>
      )}
    </div>
  );
}

function CandidateNhoFilesSection({
  files = [],
  selectedFile,
  onSelectFile,
  isLoading = false,
  error = "",
  canUpload = false,
  onUploadFollowUp,
}) {
  const majorProgress = useMemo(
    () => calculateMajorRequirementProgress(files),
    [files],
  );

  const totalProgress = useMemo(
    () => calculateTotalRequirementProgress(files),
    [files],
  );

  return (
    <section className="rounded-2xl border border-[#E6ECF2] bg-white p-5 shadow-sm">
      <div className="mb-5 flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <SectionTitle
          icon={FileText}
          title="Pre-Employment / NHO Files"
          description="Candidate Pipeline NHO uploaded files and follow-up requirements."
        />

        {canUpload && (
          <button
            type="button"
            onClick={onUploadFollowUp}
            className="inline-flex h-11 shrink-0 items-center justify-center gap-2 rounded-xl bg-sibs-primary-1 px-5 text-sm font-extrabold text-white shadow-sm transition hover:opacity-90 active:scale-[0.98]"
          >
            <UploadCloud size={17} />
            Upload Follow-up Requirements
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-[minmax(0,1fr)_340px]">
        <div className="min-w-0 space-y-5">
          <section className="rounded-2xl border border-[#D9E2EC] bg-white p-5 shadow-sm">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div className="min-w-0">
                <h3 className="text-lg font-extrabold text-[#101828]">
                  Candidate Pipeline NHO Uploaded Files
                </h3>

                <p className="mt-1 text-sm font-semibold text-sibs-primary-1/80">
                  Review and monitor candidate pre-employment requirements
                  uploaded from Candidate Pipeline.
                </p>
              </div>

              <div className="flex shrink-0 flex-wrap items-center gap-2">
                <span
                  className={`rounded-full px-3 py-1 text-xs font-extrabold ${
                    majorProgress.isComplete
                      ? "bg-emerald-50 text-emerald-700"
                      : "bg-amber-50 text-amber-700"
                  }`}
                >
                  {majorProgress.completed} / {majorProgress.total} Major
                </span>

                <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-extrabold text-sibs-primary-1">
                  {totalProgress.completed} / {totalProgress.total} Total
                </span>

                <span className="rounded-full bg-[#F2F6FA] px-3 py-1 text-xs font-extrabold text-[#344054]">
                  {isLoading
                    ? "Loading..."
                    : `${files.length} upload${files.length === 1 ? "" : "s"}`}
                </span>
              </div>
            </div>

            <div className="mt-5">
              <div className="mb-2 flex items-center justify-between text-xs font-extrabold uppercase tracking-wide text-sibs-primary-1">
                <span>Major Completion</span>
                <span>{majorProgress.percent}%</span>
              </div>

              <div className="h-3 overflow-hidden rounded-full bg-[#EEF4FA]">
                <div
                  className={`h-full rounded-full transition-all duration-300 ${
                    majorProgress.isComplete
                      ? "bg-emerald-600"
                      : "bg-sibs-primary-1"
                  }`}
                  style={{ width: `${majorProgress.percent}%` }}
                />
              </div>

              <div className="mb-2 mt-4 flex items-center justify-between text-xs font-extrabold uppercase tracking-wide text-sibs-primary-1">
                <span>Total Completion</span>
                <span>{totalProgress.percent}%</span>
              </div>

              <div className="h-2 overflow-hidden rounded-full bg-[#EEF4FA]">
                <div
                  className="h-full rounded-full bg-sibs-primary-1/70 transition-all duration-300"
                  style={{ width: `${totalProgress.percent}%` }}
                />
              </div>
            </div>

            {!majorProgress.isComplete && (
              <div className="mt-4 rounded-xl border border-amber-100 bg-amber-50 px-4 py-3 text-sm font-bold leading-6 text-amber-700">
                Candidate has fewer than 5 major requirements. Candidate should
                remain under{" "}
                <span className="font-extrabold">
                  For Onboarding - Incomplete Requirements
                </span>{" "}
                for Talent Pool follow-up.
              </div>
            )}

            {majorProgress.isComplete && (
              <div className="mt-4 rounded-xl border border-emerald-100 bg-emerald-50 px-4 py-3 text-sm font-bold leading-6 text-emerald-700">
                Candidate completed the 5 major requirements and can proceed to
                Onboarding.
              </div>
            )}

            {error && (
              <div className="mt-4 rounded-xl border border-amber-100 bg-amber-50 px-4 py-3 text-sm font-bold leading-6 text-amber-700">
                {error}
              </div>
            )}

            {isLoading && files.length === 0 && (
              <div className="mt-4 rounded-xl border border-blue-100 bg-blue-50 px-4 py-3 text-sm font-bold leading-6 text-blue-700">
                Loading Candidate Pipeline NHO uploaded files...
              </div>
            )}
          </section>

          <section className="rounded-2xl border border-[#D9E2EC] bg-white p-5 shadow-sm">
            <h3 className="text-lg font-extrabold text-[#101828]">
              Pre-Employment Requirements
            </h3>

            <div className="mt-5 space-y-6">
              {PRE_EMPLOYMENT_REQUIREMENT_GROUPS.map((group) => {
                const groupCompleted = getCompletedCountForGroup(
                  files,
                  group.requirements,
                );

                return (
                  <div
                    key={group.id}
                    className="border-t border-[#E6ECF2] pt-5 first:border-t-0 first:pt-0"
                  >
                    <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                      <div className="flex min-w-0 items-center gap-3">
                        <h4 className="text-base font-extrabold text-sibs-primary-1">
                          {group.title}
                        </h4>

                        <span className="rounded-full bg-[#F2F6FA] px-3 py-1 text-xs font-extrabold text-sibs-primary-1">
                          {groupCompleted} / {group.requirements.length}
                        </span>
                      </div>

                      {group.id === "major" && (
                        <span
                          className={`inline-flex w-fit rounded-full px-3 py-1 text-xs font-extrabold ${
                            groupCompleted >= group.requirements.length
                              ? "bg-emerald-50 text-emerald-700"
                              : "bg-amber-50 text-amber-700"
                          }`}
                        >
                          Required before Onboarding
                        </span>
                      )}
                    </div>

                    <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                      {group.requirements.map((requirement) => (
                        <NhoRequirementCard
                          key={requirement}
                          requirement={requirement}
                          files={getFilesForRequirement(files, requirement)}
                          selectedFileId={selectedFile?.id || ""}
                          onSelect={onSelectFile}
                        />
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        </div>

        <aside className="xl:sticky xl:top-0 xl:self-start">
          <NhoFilePreviewPanel file={selectedFile} />
        </aside>
      </div>
    </section>
  );
}

function TalentPoolStatusDropdown({
  value,
  onChange,
  options = [],
  placeholder = "Select status",
  disabled = false,
}) {
  const dropdownRef = useRef(null);
  const [open, setOpen] = useState(false);

  const selectedOption = options.find(
    (option) => String(option.value) === String(value || ""),
  );

  useEffect(() => {
    function handleClickOutside(event) {
      if (!dropdownRef.current) return;

      if (!dropdownRef.current.contains(event.target)) {
        setOpen(false);
      }
    }

    function handleEscape(event) {
      if (event.key === "Escape") {
        setOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, []);

  function handleSelect(nextValue) {
    onChange?.(nextValue);
    setOpen(false);
  }

  return (
    <div
      ref={dropdownRef}
      className={`relative min-w-0 ${open ? "z-[100050]" : "z-[1]"}`}
    >
      <button
        type="button"
        disabled={disabled}
        onClick={() => setOpen((previous) => !previous)}
        aria-haspopup="listbox"
        aria-expanded={open}
        className={`flex h-11 w-full min-w-0 items-center justify-between gap-3 rounded-xl border bg-white px-4 text-left text-sm font-bold shadow-sm outline-none transition ${
          open
            ? "border-[var(--sibs-primary-1)] ring-4 ring-[var(--sibs-primary-1)]/10"
            : "border-[#D0D5DD] hover:border-[var(--sibs-primary-1)]"
        } ${
          disabled
            ? "cursor-not-allowed bg-gray-50 text-gray-400 opacity-70"
            : "text-[#344054]"
        }`}
      >
        <span
          className={`min-w-0 flex-1 truncate ${
            selectedOption ? "text-[#344054]" : "text-gray-400"
          }`}
        >
          {selectedOption?.label || placeholder}
        </span>

        <ChevronDown
          size={18}
          className={`shrink-0 text-[var(--sibs-primary-1)] transition-transform duration-200 ${
            open ? "rotate-180" : ""
          }`}
        />
      </button>

      {open && !disabled && (
        <div className="absolute left-0 right-0 top-[calc(100%+8px)] z-[100060] overflow-hidden rounded-xl border border-[#D9E2EC] bg-white shadow-[0_18px_45px_rgba(15,23,42,0.18)]">
          <div className="max-h-72 overflow-y-auto" role="listbox">
            {options.length > 0 ? (
              options.map((option) => {
                const active =
                  String(option.value) === String(value || "");

                return (
                  <button
                    key={option.value}
                    type="button"
                    role="option"
                    aria-selected={active}
                    onClick={() => handleSelect(option.value)}
                    className={`block w-full px-4 py-3.5 text-left text-sm font-semibold transition ${
                      active
                        ? "bg-[#EAF4FF] text-sibs-primary-1"
                        : "bg-white text-gray-700 hover:bg-[#F5F9FF] hover:text-sibs-primary-1"
                    }`}
                  >
                    <span className="block min-w-0 truncate">
                      {option.label}
                    </span>
                  </button>
                );
              })
            ) : (
              <div className="px-4 py-3.5 text-sm font-semibold text-gray-400">
                No status options found.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default function CandidateProfileModal() {
  const navigate = useNavigate();

  const {
    selectedCandidate,
    setSelectedCandidate,
    currentTaOwner,
    openMoveToPipeline,
    refreshTalentPool,
    setCandidateList,
  } = useTalentPool();

  const [showFullApplicationHistory, setShowFullApplicationHistory] =
    useState(false);
  const [activeTab, setActiveTab] = useState("personal.basic");
  const [tabAnimationKey, setTabAnimationKey] = useState(0);

  const [statusModal, setStatusModal] = useState({
    open: false,
    type: "success",
    title: "",
    message: "",
    closeProfileOnClose: false,
  });

  const [pipelineCandidateDetails, setPipelineCandidateDetails] = useState(null);
  const [pipelineCandidateDetailsLoading, setPipelineCandidateDetailsLoading] =
    useState(false);
  const [pipelineCandidateDetailsError, setPipelineCandidateDetailsError] =
    useState("");

  const [resolvedPipelineId, setResolvedPipelineId] = useState("");

  const [candidatePipelineFiles, setCandidatePipelineFiles] = useState([]);
  const [candidatePipelineFilesLoading, setCandidatePipelineFilesLoading] =
    useState(false);
  const [candidatePipelineFilesError, setCandidatePipelineFilesError] =
    useState("");

  const [selectedNhoFile, setSelectedNhoFile] = useState(null);
  const [showNhoUploadModal, setShowNhoUploadModal] = useState(false);
  const [isMovingToOnboarding, setIsMovingToOnboarding] = useState(false);

  const [statusUpdateOpen, setStatusUpdateOpen] = useState(false);
  const [statusUpdateValue, setStatusUpdateValue] = useState("");
  const [statusUpdateSaving, setStatusUpdateSaving] = useState(false);
  const [statusUpdateValidation, setStatusUpdateValidation] = useState("");

  const [dropOffOpen, setDropOffOpen] = useState(false);
  const [dropOffReason, setDropOffReason] = useState("");
  const [dropOffSaving, setDropOffSaving] = useState(false);
  const [dropOffValidation, setDropOffValidation] = useState("");

  const candidatePipelineLookupId = useMemo(
    () => getCandidatePipelineLookupId(selectedCandidate),
    [selectedCandidate],
  );

  useEffect(() => {
    setActiveTab("personal.basic");
    setShowFullApplicationHistory(false);
    setSelectedNhoFile(null);
    setShowNhoUploadModal(false);
    setPipelineCandidateDetails(null);
    setResolvedPipelineId("");
    setCandidatePipelineFiles([]);
    setCandidatePipelineFilesError("");
    setPipelineCandidateDetailsError("");
    setStatusUpdateOpen(false);
    setStatusUpdateValue("");
    setStatusUpdateValidation("");
    setDropOffOpen(false);
    setDropOffReason("");
    setDropOffValidation("");
  }, [selectedCandidate?.id, selectedCandidate?.candidateId]);

  const loadCandidatePipelineNhoFiles = useCallback(async () => {
    if (!selectedCandidate) return;

    setPipelineCandidateDetailsLoading(true);
    setCandidatePipelineFilesLoading(true);
    setPipelineCandidateDetailsError("");
    setCandidatePipelineFilesError("");

    const localFiles = getCandidatePreEmploymentFiles(selectedCandidate);

    setCandidatePipelineFiles(localFiles);

    try {
      const resolvedPipelineCandidate =
        await fetchPipelineCandidateByAnyIdentity(selectedCandidate);

      const pipelineCandidate = safeObject(resolvedPipelineCandidate);
      const pipelineId =
        getResolvedPipelineId(pipelineCandidate) || candidatePipelineLookupId;

      if (Object.keys(pipelineCandidate).length) {
        setPipelineCandidateDetails(pipelineCandidate);
      }

      if (pipelineId) {
        setResolvedPipelineId(pipelineId);
      }

      const pipelineLocalFiles = getCandidatePreEmploymentFiles({
        ...selectedCandidate,
        pipelineCandidate,
        pipelineDetails: pipelineCandidate,
      });

      let responseFiles = [];

      if (pipelineId) {
        try {
          const nhoResponse = await api.get(
            `/api/candidate-pipeline/${encodeURIComponent(
              pipelineId,
            )}/nho/files`,
            {
              withCredentials: true,
              params: {
                _t: Date.now(),
              },
            },
          );

          responseFiles = getNhoFilesFromApiResponse(nhoResponse);
        } catch (error) {
          if (!pipelineLocalFiles.length && !localFiles.length) {
            setCandidatePipelineFilesError(
              getApiErrorMessage(
                error,
                "Unable to load pre-employment files from Candidate Pipeline.",
              ),
            );
          }
        }
      }

      const allFiles = normalizeCandidateFiles(
        [...localFiles, ...pipelineLocalFiles, ...responseFiles],
        {
          ...selectedCandidate,
          ...pipelineCandidate,
          id: pipelineId || pipelineCandidate.id || selectedCandidate.id,
          dbId: pipelineId || pipelineCandidate.dbId,
        },
      );

      setCandidatePipelineFiles(allFiles);
    } catch (error) {
      setPipelineCandidateDetailsError(
        getApiErrorMessage(error, "Unable to load Candidate Pipeline details."),
      );

      if (!localFiles.length) {
        setCandidatePipelineFilesError(
          getApiErrorMessage(
            error,
            "Unable to load pre-employment files from Candidate Pipeline.",
          ),
        );
      }
    } finally {
      setPipelineCandidateDetailsLoading(false);
      setCandidatePipelineFilesLoading(false);
    }
  }, [selectedCandidate, candidatePipelineLookupId]);

  useEffect(() => {
    loadCandidatePipelineNhoFiles();
  }, [loadCandidatePipelineNhoFiles]);

  useEffect(() => {
    function handlePipelineFilesUpdated(event) {
      const payload = event?.detail || {};
      const eventCandidate = payload?.candidate || payload;

      if (
        selectedCandidate &&
        eventCandidate &&
        candidateMatchesPipeline(selectedCandidate, eventCandidate)
      ) {
        const nextFiles = normalizeCandidateFiles(
          [
            ...candidatePipelineFiles,
            ...safeArray(payload.files),
            ...getCandidatePreEmploymentFiles(eventCandidate),
          ],
          eventCandidate,
        );

        setPipelineCandidateDetails((prev) => ({
          ...safeObject(prev),
          ...safeObject(eventCandidate),
        }));

        setCandidatePipelineFiles(nextFiles);
      }
    }

    window.addEventListener(
      "ta-pipeline-candidates-updated",
      handlePipelineFilesUpdated,
    );
    window.addEventListener("ta-talent-pool-updated", handlePipelineFilesUpdated);

    return () => {
      window.removeEventListener(
        "ta-pipeline-candidates-updated",
        handlePipelineFilesUpdated,
      );
      window.removeEventListener(
        "ta-talent-pool-updated",
        handlePipelineFilesUpdated,
      );
    };
  }, [selectedCandidate, candidatePipelineFiles]);

  const profileCandidate = useMemo(
    () =>
      mergeCandidateWithPipelineDetails(
        selectedCandidate,
        pipelineCandidateDetails,
      ),
    [selectedCandidate, pipelineCandidateDetails],
  );

  const displayedPreEmploymentFiles = useMemo(
    () =>
      normalizeCandidateFiles(
        [
          ...candidatePipelineFiles,
          ...getCandidatePreEmploymentFiles(profileCandidate),
        ],
        {
          ...profileCandidate,
          id: resolvedPipelineId || profileCandidate?.id,
          dbId: resolvedPipelineId || profileCandidate?.dbId,
        },
      ),
    [candidatePipelineFiles, profileCandidate, resolvedPipelineId],
  );

  const majorRequirementProgress = useMemo(
    () => calculateMajorRequirementProgress(displayedPreEmploymentFiles),
    [displayedPreEmploymentFiles],
  );

  const totalRequirementProgress = useMemo(
    () => calculateTotalRequirementProgress(displayedPreEmploymentFiles),
    [displayedPreEmploymentFiles],
  );

  const hasMissingPreEmploymentRequirements = useMemo(
    () =>
      totalRequirementProgress.total > 0 &&
      totalRequirementProgress.completed < totalRequirementProgress.total,
    [totalRequirementProgress],
  );

  useEffect(() => {
    if (!displayedPreEmploymentFiles.length) {
      setSelectedNhoFile(null);
      return;
    }

    setSelectedNhoFile((current) => {
      if (
        current &&
        displayedPreEmploymentFiles.some((file) => file.id === current.id)
      ) {
        return current;
      }

      return displayedPreEmploymentFiles[0] || null;
    });
  }, [displayedPreEmploymentFiles]);

  function showStatusModal({
    type = "success",
    title = "",
    message = "",
    closeProfileOnClose = false,
  }) {
    setStatusModal({
      open: true,
      type,
      title,
      message,
      closeProfileOnClose,
    });
  }

  function closeStatusModal() {
    const shouldCloseProfile = statusModal.closeProfileOnClose;

    setStatusModal((previous) => ({
      ...previous,
      open: false,
      closeProfileOnClose: false,
    }));

    if (shouldCloseProfile) {
      setSelectedCandidate(null);
    }
  }

  if (!selectedCandidate) return null;

  const activeCandidate = profileCandidate || selectedCandidate;
  const encodedBy = getEncodedByName(activeCandidate, currentTaOwner);
  const dropOffOwnerName = toDisplayPersonName(currentTaOwner, "Current User");
  const dropOffOwnerSibsId = getTalentPoolOwnerSibsId(currentTaOwner);
  const candidateDisplayName =
    cleanText(activeCandidate.name || activeCandidate.candidateName) ||
    "Candidate";
  const isDoNotReprocess = activeCandidate.status === "Do Not Reprocess";
  const isDropOffCandidate = isDropOffCandidateStatus(activeCandidate.status);

  const isAlreadyInPipeline = isCandidateLinkedToPipeline(activeCandidate);
  const hasActivePipelineLink = Boolean(
    isAlreadyInPipeline && !isDropOffCandidate
  );
  const currentStage = isAlreadyInPipeline
    ? getCandidateStageValue(activeCandidate)
    : "";
  const normalizedCurrentStage = normalizeLower(currentStage);

  const isIncompleteRequirementsStage =
    normalizedCurrentStage === normalizeLower(INCOMPLETE_ONBOARDING_STAGE);

  const isAlreadyOnboarding =
    normalizedCurrentStage === normalizeLower(ONBOARDING_STAGE);

  const canUploadFollowUpNhoRequirements = Boolean(
    (resolvedPipelineId || candidatePipelineLookupId) &&
      hasActivePipelineLink &&
      hasMissingPreEmploymentRequirements
  );

  const canMoveToOnboarding = Boolean(
    hasActivePipelineLink &&
      majorRequirementProgress.isComplete &&
      (resolvedPipelineId || candidatePipelineLookupId) &&
      !isAlreadyOnboarding,
  );

  const shouldShowLinkedButton = Boolean(
    hasActivePipelineLink &&
      !isIncompleteRequirementsStage &&
      !canMoveToOnboarding,
  );

  const candidateInitials =
    activeCandidate.name
      ?.split(" ")
      .map((part) => part[0])
      .slice(0, 2)
      .join("")
      .toUpperCase() || "C";

  const validReferences = Array.isArray(activeCandidate.references)
    ? activeCandidate.references.filter(
        (reference) => reference?.name || reference?.phone,
      )
    : [];

  const workExperiences = Array.isArray(activeCandidate.workExperiences)
    ? activeCandidate.workExperiences.filter(Boolean)
    : [];

  const applicationHistory = getCandidateApplicationHistory(
    activeCandidate,
    encodedBy,
  );

  const collapsedHistoryLimit = 3;

  const visibleApplicationHistory = showFullApplicationHistory
    ? applicationHistory
    : applicationHistory.slice(0, collapsedHistoryLimit);

  const hasMoreApplicationHistory =
    applicationHistory.length > collapsedHistoryLimit;

  const profileTabs = [
    {
      key: "personal",
      label: "Personal",
      icon: UserRound,
      children: [
        { key: "personal.basic", label: "Basic Info" },
        { key: "personal.contact", label: "Contact" },
        { key: "personal.address", label: "Address" },
        { key: "personal.ids", label: "Government IDs" },
      ],
    },
    {
      key: "family",
      label: "Family",
      icon: UserRoundPen,
      children: [
        { key: "family.spouse", label: "Spouse" },
        { key: "family.parents", label: "Parents" },
        { key: "family.children", label: "Children" },
        { key: "family.emergency", label: "Emergency Contact" },
      ],
    },
    {
      key: "education",
      label: "Education",
      icon: GraduationCap,
    },
    {
      key: "eligibility",
      label: "Eligibility",
      icon: BadgeCheck,
    },
    {
      key: "experience",
      label: "Experience",
      icon: BriefcaseBusiness,
    },
    {
      key: "training",
      label: "Training",
      icon: GraduationCap,
    },
    {
      key: "skills",
      label: "Skills",
      icon: Sparkles,
      children: [
        { key: "skills.skills", label: "Skills" },
        { key: "skills.recognitions", label: "Recognition" },
        { key: "skills.organizations", label: "Organizations" },
      ],
    },
    {
      key: "references",
      label: "References",
      icon: Phone,
    },
    {
      key: "application",
      label: "Application",
      icon: Network,
      children: [
        { key: "application.overview", label: "Overview" },
        { key: "application.pipeline", label: "Pipeline" },
        { key: "application.assessment", label: "Assessment" },
        { key: "application.readiness", label: "Readiness" },
        { key: "application.history", label: "Status History" },
      ],
    },
    {
      key: "documents",
      label: "Documents",
      icon: FileText,
      children: [
        { key: "documents.uploaded", label: "Uploaded Files" },
        { key: "documents.preEmployment", label: "Pre-Employment Files" },
      ],
    },
    {
      key: "notes",
      label: "Notes",
      icon: StickyNote,
    },
  ];

  function handleProfileTabChange(tabId) {
    if (activeTab === tabId) return;

    setActiveTab(tabId);
    setTabAnimationKey((previous) => previous + 1);
  }

  function handleCloseCandidateProfile() {
    setSelectedCandidate(null);
  }

  function handleUpdateCandidateStatus(event) {
    event?.preventDefault?.();
    event?.stopPropagation?.();

    const currentStatus = cleanText(activeCandidate.status);
    const isAllowedStatus = TALENT_POOL_STATUS_OPTIONS.some(
      (option) => option.value === currentStatus,
    );

    setStatusUpdateValue(isAllowedStatus ? currentStatus : "");
    setStatusUpdateValidation("");
    setStatusUpdateOpen(true);
  }

  function handleCloseStatusUpdate() {
    if (statusUpdateSaving) return;

    setStatusUpdateOpen(false);
    setStatusUpdateValue("");
    setStatusUpdateValidation("");
  }

  async function handleSaveCandidateStatus(event) {
    event?.preventDefault?.();
    event?.stopPropagation?.();

    if (statusUpdateSaving) return;

    const nextStatus = cleanText(statusUpdateValue);

    if (!nextStatus) {
      setStatusUpdateValidation("Please select a new status.");
      return;
    }

    if (normalizeLower(nextStatus) === "drop off") {
      setStatusUpdateValidation(
        "Drop Off is managed through the dedicated Mark as Drop Off action.",
      );
      return;
    }

    const applicationId = getTalentPoolApplicationId(activeCandidate);

    if (!applicationId) {
      setStatusUpdateValidation("Missing candidate application ID.");
      return;
    }

    setStatusUpdateSaving(true);
    setStatusUpdateValidation("");

    try {
      const response = await updateTalentPoolApplicationStatus(applicationId, {
        status: nextStatus,
      });

      if (!response?.success) {
        setStatusUpdateValidation(
          response?.message || "Failed to update candidate status.",
        );
        return;
      }

      const responseCandidate = safeObject(
        response?.candidate ||
          response?.data?.candidate ||
          response?.data ||
          {},
      );

      const nextCandidate = {
        ...activeCandidate,
        ...responseCandidate,
        status: responseCandidate.status || nextStatus,
      };

      applyLocalCandidateUpdate(nextCandidate);

      window.dispatchEvent(
        new CustomEvent("ta-talent-pool-updated", {
          detail: response?.data || nextCandidate,
        }),
      );

      if (typeof refreshTalentPool === "function") {
        try {
          await refreshTalentPool();
        } catch (refreshError) {
          console.error(
            "Refresh Talent Pool after status update error:",
            refreshError,
          );
        }
      }

      setStatusUpdateOpen(false);
      setStatusUpdateValue("");
      setStatusUpdateValidation("");
      setDropOffOpen(false);
      setShowNhoUploadModal(false);
      setStatusModal((previous) => ({
        ...previous,
        open: false,
        closeProfileOnClose: false,
      }));

      // Close Candidate Profile and return to the refreshed Talent Pool page.
      setSelectedCandidate(null);
      navigate(TALENT_POOL_ROUTE, { replace: true });
    } catch (error) {
      console.error("Update candidate status error:", error);

      setStatusUpdateValidation(
        error?.response?.data?.message ||
          error?.message ||
          "Failed to update candidate status.",
      );
    } finally {
      setStatusUpdateSaving(false);
    }
  }

  function handleOpenDropOff(event) {
    event?.preventDefault?.();
    event?.stopPropagation?.();

    if (
      dropOffSaving ||
      isAlreadyInPipeline ||
      isDoNotReprocess ||
      isDropOffCandidate
    ) {
      return;
    }

    setDropOffReason("");
    setDropOffValidation("");
    setDropOffOpen(true);
  }

  function handleCloseDropOff() {
    if (dropOffSaving) return;

    setDropOffOpen(false);
    setDropOffReason("");
    setDropOffValidation("");
  }

  async function handleConfirmDropOff(event) {
    event?.preventDefault?.();
    event?.stopPropagation?.();

    if (dropOffSaving) return;

    const reason = cleanText(dropOffReason);

    if (!reason) {
      setDropOffValidation("Drop Off Reason is required.");
      return;
    }

    const applicationId = getTalentPoolApplicationId(activeCandidate);

    if (!applicationId) {
      setDropOffValidation("Missing candidate application ID.");
      return;
    }

    setDropOffSaving(true);
    setDropOffValidation("");

    try {
      const response = await markTalentPoolCandidateAsDropOff(applicationId, {
        reason,
        droppedOffBySibsId: dropOffOwnerSibsId,
        droppedOffByName: dropOffOwnerName,
      });

      if (!response?.success) {
        setDropOffValidation(
          response?.message || "Failed to mark candidate as Drop Off.",
        );
        return;
      }

      const responseCandidate = safeObject(
        response?.candidate ||
          response?.data?.candidate ||
          response?.data ||
          {},
      );

      const nextCandidate = {
        ...activeCandidate,
        ...responseCandidate,
        status: responseCandidate.status || "Drop Off",
        dropOffReason: reason,
        drop_off_reason: reason,
      };

      applyLocalCandidateUpdate(nextCandidate);

      window.dispatchEvent(
        new CustomEvent("ta-talent-pool-updated", {
          detail: response?.data || nextCandidate,
        }),
      );

      if (typeof refreshTalentPool === "function") {
        try {
          await refreshTalentPool();
        } catch (refreshError) {
          console.error("Refresh Talent Pool after Drop Off error:", refreshError);
        }
      }

      setDropOffOpen(false);
      setDropOffReason("");

      showStatusModal({
        type: "success",
        title: "Candidate marked as Drop Off",
        message: `${candidateDisplayName} remains in Talent Pool with the Drop Off status.`,
        closeProfileOnClose: true,
      });
    } catch (error) {
      console.error("Mark candidate as Drop Off error:", error);

      setDropOffValidation(
        error?.response?.data?.message ||
          error?.message ||
          "Failed to mark candidate as Drop Off.",
      );
    } finally {
      setDropOffSaving(false);
    }
  }

  function handleOpenLinkedCandidateDestination() {
    const stage = getCandidateStageValue(activeCandidate);
    const pipelineId = cleanText(resolvedPipelineId || candidatePipelineLookupId);
    const candidateId = getCandidatePublicId(activeCandidate);
    const targetIsOnboarding = normalizeLower(stage) === "onboarding";

    const url = targetIsOnboarding
      ? buildOnboardingNavigationUrl(activeCandidate, pipelineId)
      : buildCandidatePipelineNavigationUrl(activeCandidate, pipelineId);

    const detail = {
      candidate: activeCandidate,
      candidateId,
      pipelineId,
      stage,
      focusStage: stage,
      focusCandidateId: candidateId,
      focusPipelineId: pipelineId,
    };

    window.dispatchEvent(
      new CustomEvent(
        targetIsOnboarding
          ? "ta-onboarding-focus"
          : "ta-candidate-pipeline-focus",
        { detail },
      ),
    );

    setSelectedCandidate(null);

    navigate(url, {
      state: {
        fromTalentPool: true,
        candidate: activeCandidate,
        focusCandidate: activeCandidate,
        candidateId,
        pipelineId,
        stage,
        focusStage: stage,
        focusCandidateId: candidateId,
        focusPipelineId: pipelineId,
      },
    });
  }

  function handleMoveToPipeline(event) {
    event?.preventDefault?.();
    event?.stopPropagation?.();

    if (isDropOffCandidate) {
      showStatusModal({
        type: "error",
        title: "Cannot Move Candidate",
        message:
          "This candidate is marked as Drop-off. Please update the candidate status before moving to the pipeline.",
      });
      return;
    }

    if (isDoNotReprocess) {
      showStatusModal({
        type: "error",
        title: "Cannot Move Candidate",
        message:
          "This candidate is marked as Do Not Reprocess. Please update the candidate status before moving to the pipeline.",
      });
      return;
    }

    if (isAlreadyInPipeline) {
      handleOpenLinkedCandidateDestination();
      return;
    }

    if (typeof openMoveToPipeline !== "function") {
      showStatusModal({
        type: "error",
        title: "Action Unavailable",
        message: "Move to Pipeline action is not available right now.",
      });
      return;
    }

    const candidateForMove = {
      ...(activeCandidate || selectedCandidate || {}),
    };

    openMoveToPipeline(candidateForMove);

    setTimeout(() => {
      setSelectedCandidate(null);
    }, 50);
  }

  function applyLocalCandidateUpdate(nextCandidate) {
    setSelectedCandidate(nextCandidate);

    if (typeof setCandidateList === "function") {
      setCandidateList((previousList = []) =>
        previousList.map((candidate) => {
          if (candidateMatchesPipeline(candidate, nextCandidate)) {
            return { ...candidate, ...nextCandidate };
          }

          return candidate;
        }),
      );
    }
  }

  async function handleMoveToOnboarding() {
    const pipelineId = cleanText(resolvedPipelineId || candidatePipelineLookupId);

    if (!pipelineId) {
      showStatusModal({
        type: "error",
        title: "Missing Candidate Pipeline ID",
        message:
          "Candidate Pipeline ID is missing. The candidate cannot be moved to Onboarding.",
      });
      return;
    }

    if (!majorRequirementProgress.isComplete) {
      showStatusModal({
        type: "error",
        title: "Incomplete Major Requirements",
        message:
          "The candidate must complete all 5 major requirements before moving to Onboarding.",
      });
      return;
    }

    if (isAlreadyOnboarding) {
      showStatusModal({
        type: "success",
        title: "Already in Onboarding",
        message: "This candidate is already under the Onboarding stage.",
      });
      return;
    }

    try {
      setIsMovingToOnboarding(true);

      const response = await api.post(
        `/api/candidate-pipeline/${encodeURIComponent(pipelineId)}/move`,
        {
          targetStage: ONBOARDING_STAGE,
          stage: ONBOARDING_STAGE,
          reason:
            "Candidate completed the 5 major pre-employment requirements from Talent Pool follow-up.",
          remarks:
            "Candidate completed the 5 major pre-employment requirements and was moved to Onboarding from Talent Pool.",
        },
        {
          withCredentials: true,
        },
      );

      const responsePayload = response?.data || {};

      if (responsePayload?.success === false) {
        throw new Error(
          responsePayload?.message ||
            "Failed to move candidate to Onboarding.",
        );
      }

      const responseCandidate = safeObject(
        responsePayload?.candidate ||
          responsePayload?.data?.candidate ||
          responsePayload?.data ||
          {},
      );

      const nextCandidateBase = {
        ...activeCandidate,
        ...responseCandidate,
        status: "Hired / Active",
        pipelineStatus:
          responseCandidate.pipelineStatus ||
          responseCandidate.pipeline_status ||
          activeCandidate.pipelineStatus ||
          "Active",
        currentPipelineStage: ONBOARDING_STAGE,
        current_pipeline_stage: ONBOARDING_STAGE,
        currentStage: ONBOARDING_STAGE,
        current_stage: ONBOARDING_STAGE,
        pipelineStage: ONBOARDING_STAGE,
        pipeline_stage: ONBOARDING_STAGE,
        stage: ONBOARDING_STAGE,
        nhoFiles: displayedPreEmploymentFiles,
        nho_files: displayedPreEmploymentFiles,
        preEmploymentFiles: displayedPreEmploymentFiles,
        pre_employment_files: displayedPreEmploymentFiles,
        uploadedFiles: displayedPreEmploymentFiles,
        files: displayedPreEmploymentFiles,
        majorNhoUploadProgress: majorRequirementProgress,
        major_nho_upload_progress: majorRequirementProgress,
      };

      const nextCandidate = mergeCandidateWithPipelineDetails(
        nextCandidateBase,
        responseCandidate,
      );

      applyLocalCandidateUpdate(nextCandidate);

      window.dispatchEvent(
        new CustomEvent("ta-talent-pool-updated", {
          detail: {
            candidate: nextCandidate,
            files: displayedPreEmploymentFiles,
            majorProgress: majorRequirementProgress,
            routedStage: ONBOARDING_STAGE,
          },
        }),
      );

      window.dispatchEvent(
        new CustomEvent("ta-pipeline-candidates-updated", {
          detail: {
            candidate: nextCandidate,
            files: displayedPreEmploymentFiles,
            majorProgress: majorRequirementProgress,
            routedStage: ONBOARDING_STAGE,
          },
        }),
      );

      window.dispatchEvent(
        new CustomEvent("ta-onboarding-updated", {
          detail: {
            candidate: nextCandidate,
            files: displayedPreEmploymentFiles,
            majorProgress: majorRequirementProgress,
          },
        }),
      );

      if (typeof refreshTalentPool === "function") {
        setTimeout(() => {
          refreshTalentPool();
        }, 300);
      }

      showStatusModal({
        type: "success",
        title: "Moved to Onboarding",
        message:
          "Candidate completed all 5 major requirements and was moved to Onboarding.",
        closeProfileOnClose: true,
      });
    } catch (error) {
      showStatusModal({
        type: "error",
        title: "Move to Onboarding Failed",
        message: getApiErrorMessage(
          error,
          "Failed to move candidate to Onboarding.",
        ),
      });
    } finally {
      setIsMovingToOnboarding(false);
    }
  }

  function handleTalentPoolNhoSave({
    files = [],
    candidate: updatedCandidate = null,
    majorProgress = null,
    routedStage = "",
    response = null,
  } = {}) {
    const savedFiles = normalizeCandidateFiles(
      [...displayedPreEmploymentFiles, ...files],
      activeCandidate,
    );

    const responseCandidate = safeObject(
      updatedCandidate || response?.candidate || response?.data || {},
    );

    const nextStage = cleanText(
      routedStage ||
        responseCandidate.currentStage ||
        responseCandidate.current_stage ||
        responseCandidate.currentPipelineStage ||
        responseCandidate.current_pipeline_stage ||
        responseCandidate.pipelineStage ||
        responseCandidate.pipeline_stage ||
        responseCandidate.stage ||
        activeCandidate.currentPipelineStage ||
        activeCandidate.current_stage ||
        activeCandidate.currentStage ||
        activeCandidate.current_stage ||
        activeCandidate.pipelineStage ||
        activeCandidate.pipeline_stage ||
        "",
    );

    const computedMajorProgress =
      majorProgress || calculateMajorRequirementProgress(savedFiles);

    const nextCandidateBase = {
      ...activeCandidate,
      ...responseCandidate,

      nhoFiles: savedFiles,
      nho_files: savedFiles,
      preEmploymentFiles: savedFiles,
      pre_employment_files: savedFiles,
      uploadedFiles: savedFiles,
      files: savedFiles,

      majorNhoUploadProgress: computedMajorProgress,
      major_nho_upload_progress: computedMajorProgress,

      ...(nextStage
        ? {
            status:
              nextStage === ONBOARDING_STAGE
                ? "Hired / Active"
                : activeCandidate.status,
            pipelineStatus:
              responseCandidate.pipelineStatus ||
              responseCandidate.pipeline_status ||
              activeCandidate.pipelineStatus ||
              "Active",
            currentPipelineStage: nextStage,
            current_pipeline_stage: nextStage,
            currentStage: nextStage,
            current_stage: nextStage,
            pipelineStage: nextStage,
            pipeline_stage: nextStage,
            stage: nextStage,
          }
        : {}),
    };

    const nextCandidate = mergeCandidateWithPipelineDetails(
      nextCandidateBase,
      responseCandidate,
    );

    setCandidatePipelineFiles(savedFiles);
    setSelectedNhoFile(savedFiles[0] || null);
    setShowNhoUploadModal(false);

    applyLocalCandidateUpdate(nextCandidate);

    window.dispatchEvent(
      new CustomEvent("ta-talent-pool-updated", {
        detail: {
          candidate: nextCandidate,
          files: savedFiles,
          majorProgress: computedMajorProgress,
          routedStage: nextStage,
        },
      }),
    );

    window.dispatchEvent(
      new CustomEvent("ta-pipeline-candidates-updated", {
        detail: {
          candidate: nextCandidate,
          files: savedFiles,
          majorProgress: computedMajorProgress,
          routedStage: nextStage,
        },
      }),
    );

    if (nextStage === ONBOARDING_STAGE) {
      window.dispatchEvent(
        new CustomEvent("ta-onboarding-updated", {
          detail: {
            candidate: nextCandidate,
            files: savedFiles,
            majorProgress: computedMajorProgress,
          },
        }),
      );
    }

    showStatusModal({
      type: "success",
      title:
        nextStage === ONBOARDING_STAGE
          ? "Moved to Onboarding"
          : "Requirements Saved",
      message:
        nextStage === ONBOARDING_STAGE
          ? "Candidate completed the 5 major requirements and was moved to Onboarding."
          : "NHO uploaded files were saved and displayed in the candidate profile.",
    });
  }

  function renderPersonalBasic() {
    return (
      <section className="rounded-2xl border border-[#E6ECF2] bg-white p-4 shadow-sm sm:p-5">
        <SectionTitle
          icon={UserRound}
          title="Personal Information"
          description="Basic identity and personal details."
        />

        <div className="space-y-3">
          <ProfileGrid cols="md:grid-cols-2">
            <ProfileDetail
              label="Candidate ID"
              value={getCandidatePublicId(activeCandidate)}
            />
            <ProfileDetail
              label="Candidate Status"
              value={activeCandidate.status}
            />
          </ProfileGrid>

          <ProfileGrid cols="sm:grid-cols-2 xl:grid-cols-4">
            <ProfileDetail label="First Name" value={activeCandidate.firstName} />
            <ProfileDetail
              label="Middle Name"
              value={activeCandidate.middleName}
            />
            <ProfileDetail label="Last Name" value={activeCandidate.lastName} />
            <ProfileDetail
              label="Name Extension"
              value={firstCandidateValue(
                activeCandidate.suffix,
                activeCandidate.nameExtension,
                activeCandidate.name_extension,
              )}
            />
          </ProfileGrid>

          <ProfileGrid cols="sm:grid-cols-2 xl:grid-cols-4">
            <ProfileDetail label="Preferred Name" value={activeCandidate.nickname} />
            <ProfileDetail
              label="Birth Date"
              value={formatDate(
                firstCandidateValue(
                  activeCandidate.dateOfBirth,
                  activeCandidate.birthdate,
                  activeCandidate.birthDate,
                ),
              )}
            />
            <ProfileDetail
              label="Age"
              value={firstCandidateValue(
                activeCandidate.ageAsOfApplication,
                activeCandidate.age,
              )}
            />
            <ProfileDetail label="Encoded By" value={encodedBy} />
          </ProfileGrid>

          <ProfileGrid cols="sm:grid-cols-2 xl:grid-cols-4">
            <ProfileDetail
              label="Place of Birth"
              value={firstCandidateValue(
                activeCandidate.placeOfBirth,
                activeCandidate.place_of_birth,
                activeCandidate.birthPlace,
              )}
            />
            <ProfileDetail label="Gender" value={activeCandidate.gender} />
            <ProfileDetail
              label="Civil Status"
              value={firstCandidateValue(
                activeCandidate.civilStatus,
                activeCandidate.civil_status,
                activeCandidate.maritalStatus,
              )}
            />
            <ProfileDetail
              label="Citizenship"
              value={firstCandidateValue(
                activeCandidate.citizenship,
                activeCandidate.nationality,
              )}
            />
          </ProfileGrid>

          <ProfileGrid cols="sm:grid-cols-2 xl:grid-cols-4">
            <ProfileDetail
              label="Blood Type"
              value={firstCandidateValue(
                activeCandidate.bloodType,
                activeCandidate.blood_type,
              )}
            />
            <ProfileDetail label="Height" value={activeCandidate.height} />
            <ProfileDetail label="Weight" value={activeCandidate.weight} />
            <ProfileDetail
              label="Created At"
              value={formatDate(activeCandidate.createdAt)}
            />
          </ProfileGrid>
        </div>
      </section>
    );
  }

  function renderPersonalContact() {
    return (
      <section className="rounded-2xl border border-[#E6ECF2] bg-white p-4 shadow-sm sm:p-5">
        <SectionTitle
          icon={Mail}
          title="Contact Information"
          description="Candidate email, mobile number, and telephone details."
        />

        <ProfileGrid cols="sm:grid-cols-2 xl:grid-cols-4">
          <ProfileDetail label="Email" value={activeCandidate.email} />
          <ProfileDetail
            label="Phone 1"
            value={firstCandidateValue(
              activeCandidate.phoneNumber1,
              activeCandidate.contactNumber,
              activeCandidate.phone,
            )}
          />
          <ProfileDetail label="Phone 2" value={activeCandidate.phoneNumber2} />
          <ProfileDetail
            label="Telephone"
            value={firstCandidateValue(
              activeCandidate.telephone,
              activeCandidate.telephoneNumber,
            )}
          />
        </ProfileGrid>
      </section>
    );
  }

  function renderPersonalAddress() {
    return (
      <section className="rounded-2xl border border-[#E6ECF2] bg-white p-4 shadow-sm sm:p-5">
        <SectionTitle
          icon={MapPin}
          title="Address Information"
          description="Candidate physical address and preferred work location."
        />

        <ProfileGrid cols="sm:grid-cols-2 xl:grid-cols-3">
          <ProfileDetail
            label="Physical Address"
            value={firstCandidateValue(
              activeCandidate.physicalAddress,
              activeCandidate.address,
            )}
          />
          <ProfileDetail
            label="Residential Address"
            value={firstCandidateValue(
              activeCandidate.residentialAddress,
              activeCandidate.residential_address,
            )}
          />
          <ProfileDetail
            label="Permanent Address"
            value={firstCandidateValue(
              activeCandidate.permanentAddress,
              activeCandidate.permanent_address,
            )}
          />
          <ProfileDetail
            label="Preferred Location"
            value={activeCandidate.applyingLocation}
          />
        </ProfileGrid>
      </section>
    );
  }

  function renderGovernmentIds() {
    const governmentIds = {
      gsis: firstCandidateValue(
        activeCandidate.gsis,
        activeCandidate.gsisNo,
        activeCandidate.gsis_no,
      ),
      sss: firstCandidateValue(
        activeCandidate.sss,
        activeCandidate.sssNo,
        activeCandidate.sss_no,
      ),
      philHealth: firstCandidateValue(
        activeCandidate.phic,
        activeCandidate.philhealth,
        activeCandidate.philhealthNo,
        activeCandidate.philhealth_no,
      ),
      pagIbig: firstCandidateValue(
        activeCandidate.hdmf,
        activeCandidate.pagibig,
        activeCandidate.pagibigNo,
        activeCandidate.pagibig_no,
      ),
      tin: firstCandidateValue(
        activeCandidate.tin,
        activeCandidate.tinNo,
        activeCandidate.tin_no,
      ),
    };

    const hasGovernmentId = Object.values(governmentIds).some(hasCandidateValue);

    return (
      <section className="rounded-2xl border border-[#E6ECF2] bg-white p-4 shadow-sm sm:p-5">
        <SectionTitle
          icon={WalletCards}
          title="Government IDs"
          description="Government identification numbers collected from the candidate."
        />

        {hasGovernmentId ? (
          <ProfileGrid cols="sm:grid-cols-2 xl:grid-cols-5">
            <ProfileDetail label="GSIS" value={governmentIds.gsis} />
            <ProfileDetail label="SSS" value={governmentIds.sss} />
            <ProfileDetail label="PhilHealth" value={governmentIds.philHealth} />
            <ProfileDetail label="PAG-IBIG / HDMF" value={governmentIds.pagIbig} />
            <ProfileDetail label="TIN" value={governmentIds.tin} />
          </ProfileGrid>
        ) : (
          <EmptyState
            title="No government ID information"
            description="Government ID information has not been collected at the candidate stage."
          />
        )}
      </section>
    );
  }

  function renderFamilySection(section) {
    if (section === "spouse") {
      const fields = [
        firstCandidateValue(activeCandidate.spouseSurname, activeCandidate.spouse_surname),
        firstCandidateValue(activeCandidate.spouseFirstName, activeCandidate.spouse_first_name),
        firstCandidateValue(activeCandidate.spouseMiddleName, activeCandidate.spouse_middle_name),
        firstCandidateValue(activeCandidate.spouseOccupation, activeCandidate.spouse_occupation),
        firstCandidateValue(activeCandidate.spouseEmployer, activeCandidate.spouse_employer),
        firstCandidateValue(activeCandidate.spouseTelephone, activeCandidate.spouse_telephone),
        firstCandidateValue(
          activeCandidate.spouseBusinessAddress,
          activeCandidate.spouse_business_address,
        ),
      ];

      return (
        <section className="rounded-2xl border border-[#E6ECF2] bg-white p-4 shadow-sm sm:p-5">
          <SectionTitle
            icon={UserRoundPen}
            title="Spouse Information"
            description="Candidate spouse and family background details."
          />

          {fields.some(hasCandidateValue) ? (
            <div className="space-y-3">
              <ProfileGrid cols="sm:grid-cols-2 xl:grid-cols-3">
                <ProfileDetail label="Surname" value={fields[0]} />
                <ProfileDetail label="First Name" value={fields[1]} />
                <ProfileDetail label="Middle Name" value={fields[2]} />
                <ProfileDetail label="Occupation" value={fields[3]} />
                <ProfileDetail label="Employer / Business" value={fields[4]} />
                <ProfileDetail label="Telephone" value={fields[5]} />
              </ProfileGrid>
              <ProfileTextarea label="Business Address" value={fields[6]} />
            </div>
          ) : (
            <EmptyState title="No spouse information provided." />
          )}
        </section>
      );
    }

    if (section === "parents") {
      const father = [
        firstCandidateValue(activeCandidate.fatherSurname, activeCandidate.father_surname),
        firstCandidateValue(activeCandidate.fatherFirstName, activeCandidate.father_first_name),
        firstCandidateValue(activeCandidate.fatherMiddleName, activeCandidate.father_middle_name),
      ];
      const mother = [
        firstCandidateValue(
          activeCandidate.motherMaidenSurname,
          activeCandidate.mother_maiden_surname,
          activeCandidate.motherSurname,
        ),
        firstCandidateValue(activeCandidate.motherFirstName, activeCandidate.mother_first_name),
        firstCandidateValue(activeCandidate.motherMiddleName, activeCandidate.mother_middle_name),
      ];

      return (
        <section className="rounded-2xl border border-[#E6ECF2] bg-white p-4 shadow-sm sm:p-5">
          <SectionTitle
            icon={UserRound}
            title="Parents Information"
            description="Candidate father and mother details."
          />

          {[...father, ...mother].some(hasCandidateValue) ? (
            <div className="space-y-5">
              <div>
                <p className="mb-3 text-xs font-extrabold uppercase tracking-wide text-sibs-primary-1">
                  Father
                </p>
                <ProfileGrid cols="sm:grid-cols-2 xl:grid-cols-3">
                  <ProfileDetail label="Surname" value={father[0]} />
                  <ProfileDetail label="First Name" value={father[1]} />
                  <ProfileDetail label="Middle Name" value={father[2]} />
                </ProfileGrid>
              </div>

              <div>
                <p className="mb-3 text-xs font-extrabold uppercase tracking-wide text-sibs-primary-1">
                  Mother
                </p>
                <ProfileGrid cols="sm:grid-cols-2 xl:grid-cols-3">
                  <ProfileDetail label="Maiden Surname" value={mother[0]} />
                  <ProfileDetail label="First Name" value={mother[1]} />
                  <ProfileDetail label="Middle Name" value={mother[2]} />
                </ProfileGrid>
              </div>
            </div>
          ) : (
            <EmptyState title="No parent information provided." />
          )}
        </section>
      );
    }

    if (section === "children") {
      const children = normalizeCandidateRecordList(activeCandidate.children);

      return (
        <section className="rounded-2xl border border-[#E6ECF2] bg-white p-4 shadow-sm sm:p-5">
          <SectionTitle
            icon={UserRound}
            title="Children"
            description="Candidate child records."
          />

          {children.length > 0 ? (
            <div className="space-y-3">
              {children.map((child, index) => {
                const item =
                  child && typeof child === "object" ? child : { name: child };

                return (
                  <div
                    key={`${item.name || "child"}-${index}`}
                    className="rounded-xl border border-[#D9E2EC] bg-[#F8FAFC] p-4"
                  >
                    <ProfileGrid cols="sm:grid-cols-2">
                      <ProfileDetail
                        label={`Child ${index + 1}`}
                        value={firstCandidateValue(
                          item.name,
                          item.fullName,
                          item.full_name,
                        )}
                      />
                      <ProfileDetail
                        label="Birth Date"
                        value={formatDate(
                          firstCandidateValue(
                            item.birthDate,
                            item.birth_date,
                            item.dateOfBirth,
                          ),
                        )}
                      />
                    </ProfileGrid>
                  </div>
                );
              })}
            </div>
          ) : (
            <EmptyState title="No children records provided." />
          )}
        </section>
      );
    }

    const emergencyFields = [
      firstCandidateValue(
        activeCandidate.emergencyName,
        activeCandidate.emergencyContactName,
        activeCandidate.emergency_contact_name,
      ),
      firstCandidateValue(
        activeCandidate.emergencyRelationship,
        activeCandidate.emergencyContactRelationship,
        activeCandidate.emergency_contact_relationship,
      ),
      firstCandidateValue(
        activeCandidate.emergencyPhone,
        activeCandidate.emergencyContactNumber,
        activeCandidate.emergency_contact_number,
      ),
      firstCandidateValue(
        activeCandidate.emergencyEmail,
        activeCandidate.emergency_contact_email,
      ),
    ];

    return (
      <section className="rounded-2xl border border-[#E6ECF2] bg-white p-4 shadow-sm sm:p-5">
        <SectionTitle
          icon={Phone}
          title="Emergency Contact"
          description="Candidate emergency contact details."
        />

        {emergencyFields.some(hasCandidateValue) ? (
          <ProfileGrid cols="sm:grid-cols-2">
            <ProfileDetail label="Name" value={emergencyFields[0]} />
            <ProfileDetail label="Relationship" value={emergencyFields[1]} />
            <ProfileDetail label="Phone Number" value={emergencyFields[2]} />
            <ProfileDetail label="Email" value={emergencyFields[3]} />
          </ProfileGrid>
        ) : (
          <EmptyState title="No emergency contact provided." />
        )}
      </section>
    );
  }

  function renderApplicationOverview() {
    return (
      <section className="rounded-2xl border border-[#E6ECF2] bg-white p-4 shadow-sm sm:p-5">
        <SectionTitle
          icon={BriefcaseBusiness}
          title="Application Overview"
          description="Candidate source, role preference, and recruitment application details."
        />

        <ProfileGrid cols="sm:grid-cols-2 xl:grid-cols-3">
          <ProfileDetail
            label="Applied Position"
            value={activeCandidate.openPosition || activeCandidate.roleCapability}
          />
          <ProfileDetail
            label="Preferred Location"
            value={activeCandidate.applyingLocation}
          />
          <ProfileDetail label="Source" value={activeCandidate.source} />
          <ProfileDetail
            label="How did you hear about us"
            value={formatList(activeCandidate.hearAboutUs)}
          />
          <ProfileDetail label="Referred By" value={activeCandidate.referredBy} />
          <ProfileDetail label="Employee ID" value={activeCandidate.employeeId} />
          <ProfileDetail
            label="Expected Salary"
            value={firstCandidateValue(
              activeCandidate.expectedSalary,
              activeCandidate.expected_salary,
            )}
          />
          <ProfileDetail
            label="Availability"
            value={firstCandidateValue(
              activeCandidate.availability,
              activeCandidate.availableDate,
            )}
          />
          <ProfileDetail
            label="Recruiter"
            value={firstCandidateValue(
              activeCandidate.recruiter,
              activeCandidate.recruiterName,
              activeCandidate.currentTaOwner,
            )}
          />
          <ProfileDetail
            label="Created At"
            value={formatDate(activeCandidate.createdAt)}
          />
        </ProfileGrid>
      </section>
    );
  }

  function renderPipelineLink() {
  return (
    <section className="rounded-2xl border border-[#E6ECF2] bg-white p-4 shadow-sm sm:p-5">
      <SectionTitle
        icon={Network}
        title="Pipeline Link"
        description="Current pipeline status, assignment, and TA ownership."
      />

      {pipelineCandidateDetailsLoading && (
        <div className="mb-4 rounded-xl border border-blue-100 bg-blue-50 px-4 py-3 text-sm font-bold text-blue-700">
          Loading Candidate Pipeline details...
        </div>
      )}

      {pipelineCandidateDetailsError && (
        <div className="mb-4 rounded-xl border border-amber-100 bg-amber-50 px-4 py-3 text-sm font-bold text-amber-700">
          {pipelineCandidateDetailsError}
        </div>
      )}

      <ProfileGrid cols="sm:grid-cols-2 xl:grid-cols-3">
        <ProfileDetail
          label="Pipeline ID"
          value={resolvedPipelineId || candidatePipelineLookupId || "—"}
        />

        <ProfileDetail
          label="Pipeline Status"
          value={activeCandidate.pipelineStatus || "—"}
        />

        <ProfileDetail label="Current Stage" value={currentStage || "—"} />

        <ProfileDetail
          label="Final Role"
          value={activeCandidate.currentAppliedRole || "Not assigned yet"}
        />

        <ProfileDetail
          label="Final Account"
          value={activeCandidate.currentAppliedAccount || "Not assigned yet"}
        />

        <ProfileDetail
          label="TA Owner"
          value={activeCandidate.currentTaOwner || "—"}
        />
      </ProfileGrid>
    </section>
  );
}

  function renderEducation() {
    const attainment = getCandidateEducationAttainment(activeCandidate);
    const records = getCandidateEducationRecords(activeCandidate);

    return (
      <section className="rounded-2xl border border-[#E6ECF2] bg-white p-4 shadow-sm sm:p-5">
        <SectionTitle
          icon={GraduationCap}
          title="Educational Background"
          description="Candidate educational attainment and complete academic history."
        />

        {hasCandidateValue(attainment) && (
          <div className="mb-4">
            <ProfileDetail
              label="Highest Educational Attainment"
              value={attainment}
            />
          </div>
        )}

        {records.length > 0 ? (
          <div className="space-y-4">
            {records.map((record, index) => (
              <article
                key={`${record.sectionKey || record.level || "education"}-${
                  record.schoolName || index
                }-${index}`}
                className="overflow-hidden rounded-2xl border border-[#D9E2EC] bg-white"
              >
                <div className="flex items-start gap-3 border-b border-[#E6ECF2] bg-[#F8FAFC] px-4 py-4 sm:px-5">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#EAF2FB] text-sibs-primary-1">
                    <GraduationCap size={19} />
                  </div>

                  <div className="min-w-0 flex-1">
                    <p className="text-[10px] font-extrabold uppercase tracking-wide text-sibs-primary-1/60 sm:text-[11px]">
                      Academic Record {index + 1}
                    </p>
                    <h4 className="mt-1 break-words text-sm font-extrabold text-[#101828] sm:text-base">
                      {record.level || "Educational Background"}
                    </h4>
                  </div>
                </div>

                <div className="space-y-3 p-4 sm:p-5">
                  <ProfileGrid cols="sm:grid-cols-2 xl:grid-cols-3">
                    <ProfileDetail
                      label="School Name"
                      value={record.schoolName}
                    />

                    {hasCandidateValue(record.course) && (
                      <ProfileDetail
                        label="Course / Program"
                        value={record.course}
                      />
                    )}

                    {hasCandidateValue(record.schoolYearGraduated) && (
                      <ProfileDetail
                        label="School Year Graduated"
                        value={record.schoolYearGraduated}
                      />
                    )}
                  </ProfileGrid>

                  {hasCandidateValue(record.address) && (
                    <ProfileTextarea
                      label="School Address"
                      value={record.address}
                    />
                  )}
                </div>
              </article>
            ))}
          </div>
        ) : !hasCandidateValue(attainment) ? (
          <EmptyState title="No education information provided." />
        ) : (
          <EmptyState
            title="No detailed school records provided."
            description="The candidate's highest educational attainment is available, but school-level details were not saved for this record."
          />
        )}
      </section>
    );
  }

  function renderEligibility() {
    const records = normalizeCandidateRecordList(
      firstCandidateValue(
        activeCandidate.eligibility,
        activeCandidate.certifications,
        activeCandidate.licenses,
        activeCandidate.licenseAndEligibility,
      ),
    );

    return (
      <section className="rounded-2xl border border-[#E6ECF2] bg-white p-4 shadow-sm sm:p-5">
        <SectionTitle
          icon={BadgeCheck}
          title="Eligibility"
          description="Candidate licenses, certifications, and eligibility records."
        />

        {records.length > 0 ? (
          <div className="space-y-3">
            {records.map((record, index) => {
              const item =
                record && typeof record === "object"
                  ? record
                  : { title: record };

              return (
                <div
                  key={`${item.title || item.name || "eligibility"}-${index}`}
                  className="rounded-xl border border-[#D9E2EC] bg-[#F8FAFC] p-4"
                >
                  <ProfileGrid cols="sm:grid-cols-2 xl:grid-cols-4">
                    <ProfileDetail
                      label="Eligibility / License"
                      value={firstCandidateValue(item.title, item.name)}
                    />
                    <ProfileDetail label="Rating" value={item.rating} />
                    <ProfileDetail
                      label="License Number"
                      value={firstCandidateValue(
                        item.licenseNumber,
                        item.license_number,
                      )}
                    />
                    <ProfileDetail
                      label="Validity Date"
                      value={formatDate(
                        firstCandidateValue(
                          item.validityDate,
                          item.validity_date,
                        ),
                      )}
                    />
                  </ProfileGrid>
                </div>
              );
            })}
          </div>
        ) : (
          <EmptyState title="No eligibility or license information provided." />
        )}
      </section>
    );
  }

  function renderTraining() {
    const records = normalizeCandidateRecordList(
      firstCandidateValue(
        activeCandidate.trainings,
        activeCandidate.training,
        activeCandidate.trainingRecords,
      ),
    );
    const attended = activeCandidate.trainingAttended;

    return (
      <section className="rounded-2xl border border-[#E6ECF2] bg-white p-4 shadow-sm sm:p-5">
        <SectionTitle
          icon={GraduationCap}
          title="Training"
          description="Candidate training programs, seminars, and interventions attended."
        />

        {hasCandidateValue(attended) && (
          <div className="mb-4">
            <ProfileTextarea label="Training Attended" value={attended} />
          </div>
        )}

        {records.length > 0 ? (
          <div className="space-y-3">
            {records.map((record, index) => {
              const item =
                record && typeof record === "object"
                  ? record
                  : { title: record };

              return (
                <div
                  key={`${item.title || "training"}-${index}`}
                  className="rounded-xl border border-[#D9E2EC] bg-[#F8FAFC] p-4"
                >
                  <ProfileGrid cols="sm:grid-cols-2 xl:grid-cols-4">
                    <ProfileDetail label="Training Title" value={item.title} />
                    <ProfileDetail
                      label="From"
                      value={formatDate(firstCandidateValue(item.from, item.startDate))}
                    />
                    <ProfileDetail
                      label="To"
                      value={formatDate(firstCandidateValue(item.to, item.endDate))}
                    />
                    <ProfileDetail
                      label="Conducted By"
                      value={firstCandidateValue(
                        item.conductedBy,
                        item.sponsor,
                        item.provider,
                      )}
                    />
                  </ProfileGrid>
                </div>
              );
            })}
          </div>
        ) : !hasCandidateValue(attended) ? (
          <EmptyState title="No training information provided." />
        ) : null}
      </section>
    );
  }

  function renderSkillsSection(section) {
    const skills = firstCandidateValue(
      activeCandidate.skillsLanguage,
      activeCandidate.skills,
      activeCandidate.languages,
    );
    const recognitions = firstCandidateValue(
      activeCandidate.recognitions,
      activeCandidate.awards,
      activeCandidate.distinctions,
    );
    const affiliations = firstCandidateValue(
      activeCandidate.affiliations,
      activeCandidate.organizations,
      activeCandidate.memberships,
    );

    if (section === "recognitions") {
      return (
        <section className="rounded-2xl border border-[#E6ECF2] bg-white p-4 shadow-sm sm:p-5">
          <SectionTitle
            icon={BadgeCheck}
            title="Recognition"
            description="Candidate awards, distinctions, and recognition received."
          />
          {hasCandidateValue(recognitions) ? (
            <ProfileTextarea
              label="Recognition"
              value={formatList(recognitions)}
            />
          ) : (
            <EmptyState title="No recognition information provided." />
          )}
        </section>
      );
    }

    if (section === "organizations") {
      return (
        <section className="rounded-2xl border border-[#E6ECF2] bg-white p-4 shadow-sm sm:p-5">
          <SectionTitle
            icon={UserRoundPen}
            title="Organizations"
            description="Candidate affiliations, organizations, and memberships."
          />
          {hasCandidateValue(affiliations) ? (
            <ProfileTextarea
              label="Affiliations / Organizations"
              value={formatList(affiliations)}
            />
          ) : (
            <EmptyState title="No organization information provided." />
          )}
        </section>
      );
    }

    return (
      <section className="rounded-2xl border border-[#E6ECF2] bg-white p-4 shadow-sm sm:p-5">
        <SectionTitle
          icon={Sparkles}
          title="Skills"
          description="Candidate skills, languages, and competencies."
        />
        {hasCandidateValue(skills) ? (
          <ProfileTextarea label="Skills / Language" value={formatList(skills)} />
        ) : (
          <EmptyState title="No skills information provided." />
        )}
      </section>
    );
  }

  function renderWorkExperience() {
    return (
      <section className="rounded-2xl border border-[#E6ECF2] bg-white p-5 shadow-sm">
        <SectionTitle
          icon={BriefcaseBusiness}
          title="Work Experience"
          description="Candidate employment background, previous role, company, and compensation."
        />

        <div className="mb-4">
          <span className="inline-flex w-fit rounded-full border border-blue-100 bg-blue-50 px-3 py-1 text-xs font-extrabold text-blue-700">
            {activeCandidate.workExperience || "—"}
          </span>
        </div>

        {workExperiences.length > 0 ? (
          <div className="space-y-4">
            {workExperiences.map((experience, index) => (
              <div
                key={`experience-${index}`}
                className="rounded-2xl border border-[#E6ECF2] bg-white p-4 shadow-sm"
              >
                <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0">
                    <p className="text-[11px] font-extrabold uppercase tracking-wide text-sibs-primary-1">
                      Experience {index + 1}
                    </p>

                    <h5 className="mt-1 break-words text-base font-extrabold text-[#101828]">
                      {experience.role || experience.industry || "—"}
                    </h5>

                    <p className="mt-1 break-words text-sm font-bold text-sibs-primary-1">
                      {experience.company || "Company not provided"}
                    </p>
                  </div>

                  <span className="inline-flex w-fit shrink-0 rounded-full border border-[#D6E9FF] bg-blue-50 px-3 py-1 text-xs font-extrabold text-blue-700">
                    {experience.years
                      ? `${experience.years} year(s)`
                      : "No duration"}
                  </span>
                </div>

                <div className="mt-4">
  <ProfileGrid cols="md:grid-cols-3">
    <ProfileDetail label="Industry" value={experience.industry} />

    <ProfileDetail
      label="Compensation"
      value={
        experience.monthlyCompensation
          ? formatCurrency(experience.monthlyCompensation)
          : "—"
      }
    />

    <ProfileDetail
      label="Length of Experience"
      value={experience.lengthOfWorkExperience}
    />

    <div className="md:col-span-3">
      <ProfileDetail
        label="Reason for Leaving"
        value={experience.reasonForLeaving}
      />
    </div>
  </ProfileGrid>
</div>
              </div>
            ))}
          </div>
        ) : (
          <EmptyState
            title="No work experience details"
            description={
              activeCandidate.workExperience || "No work experience provided."
            }
          />
        )}
      </section>
    );
  }

  function renderAssessment() {
    const assessmentStatus = firstCandidateValue(
      activeCandidate.assessmentStatus,
      activeCandidate.assessment_status,
    );
    const assessmentScore = firstCandidateValue(
      activeCandidate.assessmentScore,
      activeCandidate.assessment_score,
      activeCandidate.onlineAssessmentScore,
    );
    const assessmentResult = firstCandidateValue(
      activeCandidate.assessmentResult,
      activeCandidate.assessment_result,
      activeCandidate.onlineAssessmentResult,
    );
    const assessmentRemarks = firstCandidateValue(
      activeCandidate.assessmentRemarks,
      activeCandidate.assessment_remarks,
    );
    const hasAssessment = [
      assessmentStatus,
      assessmentScore,
      assessmentResult,
      assessmentRemarks,
    ].some(hasCandidateValue);

    return (
      <section className="rounded-2xl border border-[#E6ECF2] bg-white p-4 shadow-sm sm:p-5">
        <SectionTitle
          icon={BadgeCheck}
          title="Assessment"
          description="Candidate assessment status, score, and results."
        />

        {hasAssessment ? (
          <div className="space-y-3">
            <ProfileGrid cols="sm:grid-cols-2 xl:grid-cols-3">
              <ProfileDetail label="Assessment Status" value={assessmentStatus} />
              <ProfileDetail label="Assessment Score" value={assessmentScore} />
              <ProfileDetail label="Assessment Result" value={assessmentResult} />
            </ProfileGrid>
            {hasCandidateValue(assessmentRemarks) && (
              <ProfileTextarea
                label="Assessment Remarks"
                value={assessmentRemarks}
              />
            )}
          </div>
        ) : (
          <EmptyState title="No assessment information provided." />
        )}
      </section>
    );
  }

 function renderReadiness() {
  return (
    <section className="rounded-2xl border border-[#E6ECF2] bg-white p-4 shadow-sm sm:p-5">
      <SectionTitle
        icon={ShieldCheck}
        title="Readiness and Compliance"
        description="Availability, work setup, and compliance readiness."
      />

      <ProfileGrid cols="sm:grid-cols-2 xl:grid-cols-3">
        <ProfileDetail label="Vaccinated" value={activeCandidate.fullyVaccinated} />

        <ProfileDetail
          label="On-site Ready"
          value={activeCandidate.comfortableOnSite}
        />

        <ProfileDetail
          label="Graveyard Shift"
          value={activeCandidate.willingGraveyard}
        />

        <ProfileDetail
          label="Employment Type"
          value={activeCandidate.employmentInterest}
        />

        <ProfileDetail
          label="Remote Access"
          value={activeCandidate.remoteWorkAccess}
        />

        <ProfileDetail label="Drug Test" value={activeCandidate.willingDrugTest} />

        <div className="sm:col-span-2 xl:col-span-3">
          <ProfileDetail
            label="Background Check"
            value={activeCandidate.willingBackgroundCheck}
          />
        </div>
      </ProfileGrid>
    </section>
  );
}

  function renderReferences() {
    return (
      <section className="rounded-2xl border border-[#E6ECF2] bg-white p-5 shadow-sm">
        <SectionTitle
          icon={Phone}
          title="References"
          description="Candidate character or work references."
        />

        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          {validReferences.length > 0 ? (
            validReferences.map((reference, index) => (
              <ReferenceCard
                key={`reference-${index}`}
                reference={reference}
                index={index}
              />
            ))
          ) : (
            <div className="md:col-span-2">
              <EmptyState title="No references provided." />
            </div>
          )}
        </div>
      </section>
    );
  }

  function renderUploadedFiles() {
    const audioFileUrl = getResolvedFileUrl(activeCandidate.audioFileUrl);
    const attachmentFileUrl = getResolvedFileUrl(activeCandidate.attachmentFileUrl);

    function openFile(fileUrl) {
      const resolvedUrl = getResolvedFileUrl(fileUrl);

      if (!resolvedUrl) {
        showStatusModal({
          type: "error",
          title: "File Not Available",
          message: "This file has no saved file URL.",
        });
        return;
      }

      window.open(resolvedUrl, "_blank", "noopener,noreferrer");
    }

    return (
      <section className="rounded-2xl border border-[#E6ECF2] bg-white p-5 shadow-sm">
        <SectionTitle
          icon={FileText}
          title="Uploaded Files"
          description="Candidate audio recording and supporting attachments."
        />

        <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
          <div className="rounded-xl border border-[#D9E2EC] bg-[#F8FAFC] p-4">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-[11px] font-extrabold uppercase tracking-wide text-sibs-primary-1">
                  Audio Recording
                </p>

                <p
                  title={activeCandidate.audioFileName || "—"}
                  className="mt-2 truncate text-sm font-extrabold text-[#344054]"
                >
                  {activeCandidate.audioFileName || "—"}
                </p>
              </div>

              <button
                type="button"
                disabled={!audioFileUrl}
                onClick={() => openFile(audioFileUrl)}
                className="inline-flex h-10 shrink-0 items-center justify-center gap-2 rounded-xl border border-[#D6DEE8] bg-white px-4 text-sm font-extrabold text-sibs-primary-1 transition hover:bg-[#F8FAFC] disabled:cursor-not-allowed disabled:opacity-50"
              >
                <Eye size={16} />
                View
              </button>
            </div>

            {audioFileUrl ? (
              <audio
                controls
                src={audioFileUrl}
                className="mt-4 w-full"
              >
                Your browser does not support the audio element.
              </audio>
            ) : (
              <div className="mt-4 rounded-xl border border-dashed border-[#C9D6E4] bg-white px-4 py-3 text-sm font-bold text-sibs-tertiary-5">
                No audio recording uploaded.
              </div>
            )}
          </div>

          <div className="rounded-xl border border-[#D9E2EC] bg-[#F8FAFC] p-4">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-[11px] font-extrabold uppercase tracking-wide text-sibs-primary-1">
                  Attachment
                </p>

                <p
                  title={activeCandidate.attachmentFileName || "—"}
                  className="mt-2 truncate text-sm font-extrabold text-[#344054]"
                >
                  {activeCandidate.attachmentFileName || "—"}
                </p>
              </div>

              <button
                type="button"
                disabled={!attachmentFileUrl}
                onClick={() => openFile(attachmentFileUrl)}
                className="inline-flex h-10 shrink-0 items-center justify-center gap-2 rounded-xl border border-[#D6DEE8] bg-white px-4 text-sm font-extrabold text-sibs-primary-1 transition hover:bg-[#F8FAFC] disabled:cursor-not-allowed disabled:opacity-50"
              >
                <Eye size={16} />
                View
              </button>
            </div>

            {attachmentFileUrl ? (
              <div className="mt-4 rounded-xl border border-[#E6ECF2] bg-white px-4 py-3 text-sm font-bold text-sibs-primary-1">
                Click View to open the uploaded attachment.
              </div>
            ) : (
              <div className="mt-4 rounded-xl border border-dashed border-[#C9D6E4] bg-white px-4 py-3 text-sm font-bold text-sibs-tertiary-5">
                No attachment uploaded.
              </div>
            )}
          </div>
        </div>
      </section>
    );
  }

  function renderPreEmploymentFiles() {
    return (
      <CandidateNhoFilesSection
        files={displayedPreEmploymentFiles}
        selectedFile={selectedNhoFile}
        onSelectFile={setSelectedNhoFile}
        isLoading={candidatePipelineFilesLoading}
        error={candidatePipelineFilesError}
        canUpload={canUploadFollowUpNhoRequirements}
        onUploadFollowUp={() => setShowNhoUploadModal(true)}
      />
    );
  }

  function renderApplicationHistory() {
    return (
      <section className="rounded-2xl border border-[#E6ECF2] bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <SectionTitle
            icon={Network}
            title="Application History"
            description="Candidate movement and application timeline, including Candidate Pipeline process."
          />

          {applicationHistory.length > 0 && (
            <span className="inline-flex w-fit rounded-full border border-blue-100 bg-blue-50 px-3 py-1 text-xs font-extrabold text-blue-700">
              {applicationHistory.length} record
              {applicationHistory.length > 1 ? "s" : ""}
            </span>
          )}
        </div>

        <div className="mt-5">
          {applicationHistory.length > 0 ? (
            <>
              <div className="relative space-y-4">
                {visibleApplicationHistory.map((item, index) => {
                  const historyTitle = item.stage || "Application Update";
                  const historyDate = item.date || activeCandidate.lastActivity;
                  const historyOwner = item.owner || encodedBy || "—";
                  const historyDescription = item.description;

                  return (
                    <div
                      key={`${item._dedupeKey}-${historyDate}-${index}`}
                      className="relative grid grid-cols-[42px_minmax(0,1fr)] gap-4"
                    >
                      <div className="relative flex justify-center">
                        {index < visibleApplicationHistory.length - 1 && (
                          <span className="absolute left-1/2 top-10 -bottom-4 w-px -translate-x-1/2 bg-[#DCE8F5]" />
                        )}

                        <div className="relative z-10 flex h-10 w-10 items-center justify-center rounded-full border border-blue-100 bg-blue-50 text-sm font-extrabold text-blue-700 shadow-[0_0_0_6px_#FFFFFF]">
                          {index + 1}
                        </div>
                      </div>

                      <div className="rounded-2xl border border-[#D9E2EC] bg-[#F8FAFC] p-4 transition hover:border-sibs-primary-1/30 hover:bg-white hover:shadow-sm">
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                          <div className="min-w-0">
                            <h5
                              title={historyTitle}
                              className="line-clamp-2 text-sm font-extrabold leading-6 text-[#101828]"
                            >
                              {historyTitle}
                            </h5>

                            <p className="mt-1 text-sm font-bold text-sibs-primary-1">
                              {formatDate(historyDate)}
                            </p>
                          </div>

                          <span
                            title={historyOwner}
                            className="inline-flex max-w-full shrink-0 items-center justify-center truncate rounded-full border border-[#D6DEE8] bg-white px-3 py-1 text-xs font-bold text-[#475467]"
                          >
                            {historyOwner}
                          </span>
                        </div>

                        <p className="mt-4 whitespace-pre-line break-words text-sm font-medium leading-6 text-[#475467]">
                          {historyDescription}
                        </p>

                        {item.remarks && (
                          <div className="mt-4 rounded-xl bg-white px-4 py-3 text-sm font-semibold leading-6 text-[#344054]">
                            {item.remarks}
                          </div>
                        )}

                        <GetAssessmentTimelineFiles
                          item={item}
                          candidate={activeCandidate}
                        />

                        {item.offerDetail && (
                          <div className="mt-4 rounded-xl bg-white px-4 py-3 text-sm font-semibold leading-6 text-[#344054]">
                            {item.offerDetail}
                          </div>
                        )}

                        {item.savedFormLink && (
                          <div className="mt-4 min-w-0">
                            <p className="text-[11px] font-extrabold uppercase tracking-wide text-sibs-primary-1">
                              Job Evaluation Link
                            </p>

                            <a
                              href={item.savedFormLink}
                              target="_blank"
                              rel="noreferrer"
                              title={item.savedFormLink}
                              dir="ltr"
                              className="mt-2 block w-full min-w-0 overflow-hidden text-ellipsis whitespace-nowrap rounded-xl border border-[#D9E2EC] bg-white px-3 py-2 text-left text-sm text-blue-700 underline"
                            >
                              {item.savedFormLink.startsWith("http")
                                ? item.savedFormLink
                                : `${window.location.origin}${item.savedFormLink}`}
                            </a>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {hasMoreApplicationHistory && (
                <div className="mt-5 flex justify-center border-t border-[#E6ECF2] pt-4">
                  <button
                    type="button"
                    onClick={() =>
                      setShowFullApplicationHistory(
                        (previousValue) => !previousValue,
                      )
                    }
                    className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-[#D6DEE8] bg-white px-5 text-sm font-extrabold text-sibs-primary-1 transition hover:border-sibs-primary-1/30 hover:bg-[#F8FAFC]"
                  >
                    {showFullApplicationHistory
                      ? "Show Less History"
                      : "View Full History"}

                    <ChevronDown
                      size={16}
                      className={`transition ${
                        showFullApplicationHistory ? "rotate-180" : ""
                      }`}
                    />
                  </button>
                </div>
              )}
            </>
          ) : (
            <EmptyState title="No application history yet." />
          )}
        </div>
      </section>
    );
  }

  function renderRemarks() {
  return (
    <section className="rounded-2xl border border-[#E6ECF2] bg-white p-4 shadow-sm sm:p-5">
      <SectionTitle
        icon={FileText}
        title="Notes"
        description="Candidate profile notes and general remarks."
      />

      <ProfileTextarea
        label="Notes"
        value={activeCandidate.remarks || "No additional notes."}
      />
    </section>
  );
}

  function renderActiveTabContent() {
    if (activeTab === "personal.basic") return renderPersonalBasic();
    if (activeTab === "personal.contact") return renderPersonalContact();
    if (activeTab === "personal.address") return renderPersonalAddress();
    if (activeTab === "personal.ids") return renderGovernmentIds();

    if (activeTab === "family.spouse") return renderFamilySection("spouse");
    if (activeTab === "family.parents") return renderFamilySection("parents");
    if (activeTab === "family.children") return renderFamilySection("children");
    if (activeTab === "family.emergency") return renderFamilySection("emergency");

    if (activeTab === "education") return renderEducation();
    if (activeTab === "eligibility") return renderEligibility();
    if (activeTab === "experience") return renderWorkExperience();
    if (activeTab === "training") return renderTraining();

    if (activeTab === "skills.skills") return renderSkillsSection("skills");
    if (activeTab === "skills.recognitions") {
      return renderSkillsSection("recognitions");
    }
    if (activeTab === "skills.organizations") {
      return renderSkillsSection("organizations");
    }

    if (activeTab === "references") return renderReferences();

    if (activeTab === "application.overview") {
      return renderApplicationOverview();
    }
    if (activeTab === "application.pipeline") return renderPipelineLink();
    if (activeTab === "application.assessment") return renderAssessment();
    if (activeTab === "application.readiness") return renderReadiness();
    if (activeTab === "application.history") return renderApplicationHistory();

    if (activeTab === "documents.uploaded") return renderUploadedFiles();
    if (activeTab === "documents.preEmployment") {
      return renderPreEmploymentFiles();
    }

    if (activeTab === "notes") return renderRemarks();

    return renderPersonalBasic();
  }

  return (
    <>
      <style>
        {`
          @keyframes candidateProfileTabPanelIn {
            0% {
              opacity: 0;
              transform: translateY(16px) scale(0.985);
              filter: blur(2px);
            }

            100% {
              opacity: 1;
              transform: translateY(0) scale(1);
              filter: blur(0);
            }
          }

          .candidate-profile-tab-panel-in {
            animation: candidateProfileTabPanelIn 280ms cubic-bezier(0.16, 1, 0.3, 1) both;
            will-change: opacity, transform, filter;
          }

          @media (prefers-reduced-motion: reduce) {
            .candidate-profile-tab-panel-in {
              animation: none;
            }
          }
        `}
      </style>

      <div
        className="fixed inset-0 z-[10000] flex h-dvh items-center justify-center bg-black/45 px-3 py-3 sm:px-4"
        onClick={handleCloseCandidateProfile}
      >
        <div
          className="flex h-[calc(100dvh-24px)] w-[calc(100vw-24px)] max-w-[92rem] flex-col overflow-hidden rounded-2xl bg-white shadow-2xl sm:h-[94dvh] sm:w-full"
          onClick={(event) => event.stopPropagation()}
        >
          <div className="flex items-start justify-between gap-4 border-b border-[#E6ECF2] bg-white px-5 py-4 sm:px-7">
            <div className="min-w-0">
              <h2 className="line-clamp-1 text-xl font-extrabold text-sibs-primary-1 sm:text-2xl">
                Candidate Profile
              </h2>

              <p className="mt-1 line-clamp-3 text-sm font-semibold leading-5 text-sibs-primary-1/80 sm:line-clamp-none">
                View the master candidate profile before moving to the pipeline.
              </p>
            </div>

            <button
              type="button"
              onClick={handleCloseCandidateProfile}
              className="shrink-0 rounded-full p-2 text-gray-400 transition hover:bg-gray-100 hover:text-gray-700"
            >
              <X size={21} />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto bg-[#F8FAFC] p-4 pb-6 sm:p-6 sm:pb-6">
            <div className="space-y-5">
              <section className="overflow-hidden rounded-2xl border border-[#DDE7F1] bg-white shadow-sm">
                <div className="border-b border-[#E6ECF2] bg-white px-5 py-6 sm:px-7">
                  <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
                    <div className="flex min-w-0 flex-col items-center gap-4 text-center sm:flex-row sm:items-start sm:text-left">
                      <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-full bg-sibs-primary-1 text-2xl font-extrabold text-white shadow-sm sm:h-24 sm:w-24 sm:text-3xl">
                        {candidateInitials}
                      </div>

                      <div className="min-w-0 max-w-full">
                        <h3 className="line-clamp-4 break-words text-xl font-extrabold uppercase leading-tight tracking-wide text-[#101828] sm:line-clamp-3 sm:text-2xl">
                          {activeCandidate.name || "Unnamed Candidate"}
                        </h3>

                        <p className="mt-2 break-words text-sm font-extrabold text-sibs-primary-1">
                          {activeCandidate.email || "No email provided"}
                        </p>

                        <div className="mt-3 flex flex-wrap justify-center gap-2 sm:justify-start">
                          <span className="inline-flex rounded-full border border-blue-100 bg-blue-50 px-3 py-1 text-xs font-bold text-blue-700">
                            {activeCandidate.candidateId || "—"}
                          </span>

                          <span
                            className={`inline-flex rounded-full border px-3 py-1 text-xs font-bold ${getStatusClass(
                              activeCandidate.status,
                            )}`}
                          >
                            {activeCandidate.status || "—"}
                          </span>

                          {currentStage &&
                            normalizeLower(currentStage) !==
                              normalizeLower(activeCandidate.status) && (
                              <span className="inline-flex rounded-full border border-cyan-100 bg-cyan-50 px-3 py-1 text-xs font-bold text-cyan-700">
                                {currentStage}
                              </span>
                            )}

                          {activeCandidate.isPublicSubmission && (
                            <span className="inline-flex rounded-full border border-purple-200 bg-purple-50 px-3 py-1 text-xs font-bold text-purple-700">
                              Public Submission
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex shrink-0 flex-col gap-2 sm:flex-row xl:items-center">
                      <button
                        type="button"
                        onClick={handleUpdateCandidateStatus}
                        className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-[#F3D8A8] bg-[#FFF8E8] px-5 text-sm font-extrabold text-[#B45309] transition hover:bg-[#FFF3D6] hover:shadow-sm"
                      >
                        <RefreshCcw size={16} />
                        Update Status
                      </button>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 divide-y divide-[#E6ECF2] md:grid-cols-3 md:divide-x md:divide-y-0">
                  <div className="px-5 py-4">
                    <p className="text-xs font-bold uppercase tracking-wide text-sibs-tertiary-5">
                      Applied Position
                    </p>

                    <p
                      title={
                        activeCandidate.openPosition ||
                        activeCandidate.roleCapability ||
                        "—"
                      }
                      className="mt-1 truncate text-sm font-extrabold text-[#101828]"
                    >
                      {activeCandidate.openPosition ||
                        activeCandidate.roleCapability ||
                        "—"}
                    </p>
                  </div>

                  <div className="px-5 py-4">
                    <p className="text-xs font-bold uppercase tracking-wide text-sibs-tertiary-5">
                      Preferred Location
                    </p>

                    <p
                      title={activeCandidate.applyingLocation || "—"}
                      className="mt-1 truncate text-sm font-extrabold text-[#101828]"
                    >
                      {activeCandidate.applyingLocation || "—"}
                    </p>
                  </div>

                  <div className="px-5 py-4">
                    <p className="text-xs font-bold uppercase tracking-wide text-sibs-tertiary-5">
                      Last Activity
                    </p>

                    <p
                      title={formatDate(activeCandidate.lastActivity)}
                      className="mt-1 truncate text-sm font-extrabold text-[#101828]"
                    >
                      {formatDate(activeCandidate.lastActivity)}
                    </p>
                  </div>
                </div>

                {isDoNotReprocess && (
                  <div className="border-t border-red-100 bg-red-50 px-5 py-4 text-sm font-semibold text-red-700">
                    This candidate is marked as Do Not Reprocess and cannot be
                    moved to the pipeline unless the status is updated.
                  </div>
                )}
              </section>

              <section className="overflow-hidden rounded-2xl border border-[#DDE7F1] bg-white shadow-sm">
                <div className="grid grid-cols-1 lg:grid-cols-[240px_minmax(0,1fr)]">
                  {/* LEFT TABS */}
                  <CandidateProfileSideNav
                    tabs={profileTabs}
                    activeTab={activeTab}
                    onTabChange={handleProfileTabChange}
                  />

                  {/* RIGHT TAB CONTENT */}
                  <div className="min-w-0 bg-[#F8FAFC] p-4 sm:p-5">
                    <AnimatedProfileTabPanel key={`${activeTab}-${tabAnimationKey}`}>
                      {renderActiveTabContent()}
                    </AnimatedProfileTabPanel>
                  </div>
                </div>
              </section>
            </div>
          </div>

          <div className="relative z-[40] flex flex-col-reverse gap-4 border-t border-[#E6ECF2] bg-white px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-7">
            <p className="text-xs font-bold leading-5 text-sibs-tertiary-5">
              {isDropOffCandidate ? (
                <span className="font-extrabold text-red-600">
                  Candidate is marked as Drop-off. Update the candidate status
                  before using Candidate Pipeline actions.
                </span>
              ) : canMoveToOnboarding ? (
                <span className="font-extrabold text-emerald-600">
                  Candidate completed the 5 major requirements and can be moved
                  to Onboarding.
                </span>
              ) : isIncompleteRequirementsStage ? (
                <span className="font-extrabold text-amber-700">
                  Candidate is linked to the pipeline and pending onboarding
                  requirements.
                </span>
              ) : isAlreadyOnboarding ? (
                <span className="font-extrabold text-emerald-600">
                  Candidate is already under Onboarding.
                </span>
              ) : isAlreadyInPipeline ? (
                <span className="font-extrabold text-emerald-600">
                  Candidate is already linked to the Candidate Pipeline.
                </span>
              ) : isDoNotReprocess ? (
                <span className="font-extrabold text-red-600">
                  Update the candidate status before moving to pipeline.
                </span>
              ) : (
                "Review all candidate details before moving to pipeline."
              )}
            </p>

            <div className="relative z-[50] flex flex-col gap-2 sm:flex-row sm:items-center">
              <button
                type="button"
                onClick={handleCloseCandidateProfile}
                className="inline-flex h-11 items-center justify-center rounded-xl border border-[#D6DEE8] bg-white px-5 text-sm font-extrabold text-[#475467] transition hover:bg-[#F8FAFC] hover:shadow-sm"
              >
                Close
              </button>


              {!isAlreadyInPipeline &&
                !isDoNotReprocess &&
                !isDropOffCandidate && (
                <button
                  type="button"
                  onClick={handleOpenDropOff}
                  disabled={dropOffSaving}
                  className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-red-200 bg-red-50 px-5 text-sm font-extrabold text-red-700 transition hover:-translate-y-0.5 hover:border-red-300 hover:bg-red-100 hover:shadow-sm disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <UserX size={17} />
                  {dropOffSaving ? "Saving..." : "Mark as Drop Off"}
                </button>
              )}

              {canMoveToOnboarding && (
                <button
                  type="button"
                  disabled={isMovingToOnboarding}
                  onClick={handleMoveToOnboarding}
                  className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-sibs-primary-1 px-5 text-sm font-extrabold text-white shadow-sm transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isMovingToOnboarding ? (
                    <Loader2 size={16} className="animate-spin" />
                  ) : (
                    <ArrowRight size={16} />
                  )}
                  {isMovingToOnboarding ? "Moving..." : "Move to Onboarding"}
                </button>
              )}

              {shouldShowLinkedButton && (
                <button
                  type="button"
                  onClick={handleOpenLinkedCandidateDestination}
                  className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-sibs-primary-1 px-5 text-sm font-extrabold text-white shadow-sm transition hover:opacity-90"
                >
                  <ArrowRight size={16} />
                  Already Linked
                </button>
              )}

              {!isAlreadyInPipeline &&
                !isDoNotReprocess &&
                !isDropOffCandidate && (
                <button
                  type="button"
                  onClick={handleMoveToPipeline}
                  className="relative z-[60] inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-sibs-primary-1 px-5 text-sm font-extrabold text-white shadow-sm transition hover:opacity-90 active:scale-[0.98]"
                >
                  <ArrowRight size={16} />
                  Move to Pipeline
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {statusUpdateOpen && (
        <div
          className="fixed inset-0 z-[10025] flex h-dvh items-center justify-center bg-black/50 px-4 py-4"
          onClick={(event) => {
            event.stopPropagation();
            handleCloseStatusUpdate();
          }}
        >
          <div
            className="w-full max-w-lg overflow-visible rounded-2xl bg-white shadow-2xl"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-4 border-b border-[#E6ECF2] px-5 py-4">
              <div className="min-w-0">
                <h3 className="text-lg font-extrabold text-sibs-primary-1">
                  Update Candidate Status
                </h3>
                <p className="mt-1 truncate text-sm font-medium text-sibs-tertiary-5">
                  {candidateDisplayName}
                </p>
              </div>

              <button
                type="button"
                onClick={handleCloseStatusUpdate}
                disabled={statusUpdateSaving}
                className="rounded-full p-2 text-gray-400 transition hover:bg-gray-100 hover:text-gray-700 disabled:cursor-not-allowed disabled:opacity-60"
                aria-label="Close update candidate status modal"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSaveCandidateStatus} className="space-y-4 p-5">
              <div className="rounded-xl border border-[#D9E2EC] bg-[#F8FAFC] px-4 py-4">
                <p className="text-[11px] font-extrabold uppercase tracking-wide text-sibs-primary-1/70">
                  Current Status
                </p>
                <p className="mt-1 text-sm font-extrabold text-[#101828]">
                  {activeCandidate.status || "—"}
                </p>
              </div>

              <div className="relative z-[100040]">
                <FieldLabel>New Status</FieldLabel>
                <TalentPoolStatusDropdown
                  value={statusUpdateValue}
                  options={TALENT_POOL_STATUS_OPTIONS}
                  disabled={statusUpdateSaving}
                  placeholder="Select status"
                  onChange={(nextValue) => {
                    setStatusUpdateValue(nextValue);

                    if (statusUpdateValidation) {
                      setStatusUpdateValidation("");
                    }
                  }}
                />

                {statusUpdateValidation && (
                  <p className="mt-2 text-xs font-bold text-red-600">
                    {statusUpdateValidation}
                  </p>
                )}
              </div>
            </form>

            <div className="border-t border-[#E6ECF2] px-5 py-4">
              <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={handleCloseStatusUpdate}
                  disabled={statusUpdateSaving}
                  className="inline-flex h-11 items-center justify-center rounded-xl border border-[#E6ECF2] bg-white px-5 text-sm font-bold text-gray-600 transition hover:bg-[#F8FAFC] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  Cancel
                </button>

                <button
                  type="button"
                  onClick={handleSaveCandidateStatus}
                  disabled={statusUpdateSaving || !cleanText(statusUpdateValue)}
                  className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-sibs-primary-1 px-5 text-sm font-bold text-white transition hover:-translate-y-0.5 hover:shadow-md hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {statusUpdateSaving ? (
                    <Loader2 size={16} className="animate-spin" />
                  ) : (
                    <RefreshCcw size={16} />
                  )}
                  {statusUpdateSaving ? "Saving..." : "Save Status"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {dropOffOpen && (
        <div
          className="fixed inset-0 z-[10030] flex h-dvh items-center justify-center bg-black/50 px-4 py-4"
          onClick={(event) => {
            event.stopPropagation();
            handleCloseDropOff();
          }}
        >
          <div
            className="w-full max-w-lg overflow-hidden rounded-2xl bg-white shadow-2xl"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-4 border-b border-gray-100 px-5 py-4">
              <div>
                <h3 className="text-lg font-bold text-[#B42318]">
                  Mark as Drop Off
                </h3>
                <p className="mt-1 text-sm font-medium text-sibs-tertiary-5">
                  {candidateDisplayName}
                </p>
              </div>

              <button
                type="button"
                onClick={handleCloseDropOff}
                disabled={dropOffSaving}
                className="rounded-full p-2 text-gray-400 transition hover:bg-gray-100 hover:text-gray-700 disabled:cursor-not-allowed disabled:opacity-60"
                aria-label="Close Drop Off reason modal"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleConfirmDropOff} className="space-y-4 p-5">
              <div className="rounded-xl border border-red-100 bg-red-50 p-4 text-sm font-semibold leading-6 text-[#B42318]">
                The candidate will remain visible in Talent Pool with the Drop
                Off status. Enter the reason before confirming.
              </div>

              <div>
                <FieldLabel>Drop Off Reason</FieldLabel>
                <textarea
                  autoFocus
                  rows={5}
                  value={dropOffReason}
                  onChange={(event) => {
                    setDropOffReason(event.target.value);

                    if (dropOffValidation) {
                      setDropOffValidation("");
                    }
                  }}
                  disabled={dropOffSaving}
                  className={`${textareaClass()} ${
                    dropOffValidation
                      ? "border-red-400 focus:border-red-500 focus:ring-red-100"
                      : ""
                  }`}
                  placeholder="Enter the reason for dropping off this candidate."
                />

                {dropOffValidation && (
                  <p className="mt-1.5 text-xs font-bold text-red-600">
                    {dropOffValidation}
                  </p>
                )}
              </div>
            </form>

            <div className="border-t border-gray-100 px-5 py-4">
              <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={handleCloseDropOff}
                  disabled={dropOffSaving}
                  className="inline-flex h-11 items-center justify-center rounded-xl border border-[#E6ECF2] bg-white px-5 text-sm font-bold text-gray-600 transition hover:bg-[#F8FAFC] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  Cancel
                </button>

                <button
                  type="button"
                  onClick={handleConfirmDropOff}
                  disabled={dropOffSaving || !cleanText(dropOffReason)}
                  className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-red-600 px-5 text-sm font-bold text-white transition hover:-translate-y-0.5 hover:bg-red-700 hover:shadow-md disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <UserX size={17} />
                  {dropOffSaving ? "Saving..." : "Confirm Drop Off"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {canUploadFollowUpNhoRequirements && (
        <NhoUploadModal
          open={showNhoUploadModal}
          onClose={() => setShowNhoUploadModal(false)}
          candidateId={resolvedPipelineId || candidatePipelineLookupId}
          candidateName={activeCandidate.name || "Candidate"}
          candidateEmail={activeCandidate.email || ""}
          initialFiles={displayedPreEmploymentFiles}
          currentFile={selectedNhoFile || displayedPreEmploymentFiles[0] || null}
          previousEmploymentEnabled
          onSave={handleTalentPoolNhoSave}
        />
      )}

      <StatusModal
        open={statusModal.open}
        type={statusModal.type}
        title={statusModal.title}
        message={statusModal.message}
        variant="center"
        onClose={closeStatusModal}
        lockScroll={false}
      />
    </>
  );
}