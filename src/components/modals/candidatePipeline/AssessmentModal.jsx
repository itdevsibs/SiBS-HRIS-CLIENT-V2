import { useEffect, useMemo, useState } from "react";
import {
  X,
  ArrowRight,
  Pencil,
  RefreshCcw,
  UserRound,
  BriefcaseBusiness,
  GraduationCap,
  ShieldCheck,
  Phone,
  FileText,
  ChevronDown,
  Network,
  UploadCloud,
  Check,
  Eye,
  ExternalLink,
  FileImage,
  FileSpreadsheet,
} from "lucide-react";

import { useTalentPool } from "../../../services/context/TalentPoolContext";
import {
  formatCurrency,
  formatDate,
  formatList,
  getEncodedByName,
  getStatusClass,
} from "../../../lib/utils/talentPool/talentPoolHelpers";

import {
  DetailRow,
  ReferenceCard,
  SectionTitle,
  StatusTile,
  ViewableFileRow,
} from "../../recruitment/talentPool/TalentPoolShared";

import GetAssessmentTimelineFiles from "../../../lib/utils/candidatePipeline/react-utils/GetAssessmentTimelineFiles";
import StatusModal from "../StatusModal";
import NhoUploadModal from "../candidatePipeline/NhoUploadModal";
import api from "../../../lib/axios/api-template";

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

function getNormalizedHistoryDate(value) {
  if (!value) return "";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return String(value).trim();
  }

  return date.toISOString().slice(0, 16);
}

function getCandidateStageValue(candidate = {}) {
  return (
    candidate.currentStage ||
    candidate.currentPipelineStage ||
    candidate.pipelineStage ||
    candidate.stage ||
    candidate.pipelineStatus ||
    candidate.status ||
    ""
  );
}

function isCandidateLinkedToPipeline(candidate = {}) {
  const safeCandidate = safeObject(candidate);
  const pipelineCandidate = safeObject(safeCandidate.pipelineCandidate);

  return Boolean(
    safeCandidate.pipelineStatus ||
      safeCandidate.currentPipelineStage ||
      safeCandidate.currentTaOwner ||
      safeCandidate.pipelineStage ||
      safeCandidate.currentStage ||
      safeCandidate.movedToPipeline ||
      safeCandidate.pipelineCandidate ||
      safeCandidate.pipelineId ||
      safeCandidate.pipelineDbId ||
      pipelineCandidate.id ||
      pipelineCandidate.dbId,
  );
}

function getCandidatePipelineLookupId(candidate = {}) {
  const safeCandidate = safeObject(candidate);
  const pipelineCandidate = safeObject(safeCandidate.pipelineCandidate);
  const metadata = safeObject(safeCandidate.metadata);
  const candidateSnapshot = safeObject(safeCandidate.candidateSnapshot);

  return (
    pipelineCandidate.dbId ||
    pipelineCandidate.id ||
    safeCandidate.pipelineDbId ||
    safeCandidate.pipelineId ||
    safeCandidate.dbId ||
    safeCandidate.pipelineCandidateId ||
    metadata.pipelineId ||
    metadata.pipelineDbId ||
    metadata.candidatePipelineId ||
    candidateSnapshot.pipelineId ||
    candidateSnapshot.dbId ||
    safeCandidate.candidateId ||
    safeCandidate.candidateApplicationId ||
    safeCandidate.applicationId ||
    safeCandidate.id ||
    ""
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
  const lookupId = getCandidatePipelineLookupId(candidate);

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
    cleanText(file.id),
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
        `${file.requirement}-${file.fileName}-${Math.random()}`;

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
  return (
    response?.data?.data?.candidate ||
    response?.data?.candidate ||
    response?.data?.data ||
    response?.data ||
    null
  );
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
      (safePipelineCandidate.currentStage
        ? "Active"
        : safeCandidate.pipelineStatus),

    currentPipelineStage:
      safePipelineCandidate.currentPipelineStage ||
      safePipelineCandidate.currentStage ||
      safePipelineCandidate.pipelineStage ||
      safePipelineCandidate.stage ||
      safeCandidate.currentPipelineStage ||
      safeCandidate.currentStage ||
      safeCandidate.pipelineStage,

    currentStage:
      safePipelineCandidate.currentStage ||
      safePipelineCandidate.currentPipelineStage ||
      safePipelineCandidate.pipelineStage ||
      safePipelineCandidate.stage ||
      safeCandidate.currentStage ||
      safeCandidate.currentPipelineStage ||
      safeCandidate.pipelineStage,

    pipelineStage:
      safePipelineCandidate.pipelineStage ||
      safePipelineCandidate.currentStage ||
      safePipelineCandidate.currentPipelineStage ||
      safeCandidate.pipelineStage,

    currentAppliedRole:
      safePipelineCandidate.currentAppliedRole ||
      safePipelineCandidate.roleTitle ||
      safePipelineCandidate.openPosition ||
      safePipelineCandidate.roleCapability ||
      safeCandidate.currentAppliedRole,

    currentAppliedAccount:
      safePipelineCandidate.currentAppliedAccount ||
      safePipelineCandidate.account ||
      safePipelineCandidate.leadAccount ||
      safeCandidate.currentAppliedAccount,

    currentTaOwner:
      safePipelineCandidate.currentTaOwner ||
      safePipelineCandidate.updatedBySibsId ||
      safePipelineCandidate.updated_by_sibs_id ||
      safeCandidate.currentTaOwner,

    nhoFiles: normalizeCandidateFiles(
      [...getCandidatePreEmploymentFiles(safeCandidate), ...pipelineNhoFiles],
      safePipelineCandidate,
    ),

    applicationHistory,
    timeline: pipelineTimeline.length ? pipelineTimeline : safeCandidate.timeline,

    finalInterviewSubmittedForms:
      safePipelineCandidate.finalInterviewSubmittedForms ||
      safeCandidate.finalInterviewSubmittedForms,

    final_interview_submitted_forms:
      safePipelineCandidate.final_interview_submitted_forms ||
      safeCandidate.final_interview_submitted_forms,

    metadata: {
      ...candidateMetadata,
      pipeline: safePipelineCandidate,
      pipelineTimeline,
      applicationHistory,
    },
  };
}

function isValidTimelineValue(value) {
  const text = String(value || "")
    .trim()
    .toLowerCase();

  return (
    text &&
    text !== "—" &&
    text !== "--" &&
    text !== "not assigned yet" &&
    text !== "n/a" &&
    text !== "na" &&
    text !== "null" &&
    text !== "undefined"
  );
}

function getHistoryTitle(item = {}) {
  const rawTitle =
    item.stage ||
    item.pipelineStage ||
    item.currentStage ||
    item.outcome ||
    item.title ||
    "Application Update";

  const title = String(rawTitle || "").trim();

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
  if (title.includes("incomplete major")) {
    return "For Onboarding - Incomplete Requirements";
  }

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
    item.timestamp ||
    item.submittedAt ||
    item.submittedAtIso ||
    ""
  );
}

function getHistoryOwner(item = {}, candidate = {}, fallbackOwner = "—") {
  return (
    item.owner ||
    item.taOwner ||
    item.updatedBy ||
    item.createdBy ||
    item.updatedBySibsId ||
    item.createdBySibsId ||
    candidate.currentTaOwner ||
    candidate.taOwner ||
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

  if (title === "Initial Screening") {
    return "PRF status changed to Matched. Candidate is ready to move to Online Assessment.";
  }

  if (title === "Online Assessment") {
    return "Assessment marked as Taken and tagged as Assessment Fit.";
  }

  if (title === "Interview Scheduled") {
    return "Candidate passed assessment and interview schedule was set.";
  }

  if (title === "Interviewed") {
    return "Final interview form was submitted. Candidate moved from Interview Scheduled to Interviewed.";
  }

  if (title === "Offered") {
    return "Interview completed. Offer details prepared and sent for approval.";
  }

  if (title === "Accepted") {
    return "Candidate accepted the offer and moved to Accepted.";
  }

  if (title === "For NHO") {
    return "Candidate moved to For NHO.";
  }

  if (title === "For Onboarding - Incomplete Requirements") {
    return "Candidate has fewer than 5 major requirements and was routed to Talent Pool for follow-up.";
  }

  if (title === "Onboarding") {
    return "Candidate completed the 5 major requirements and moved to Onboarding.";
  }

  if (title === "Drop-off" || title === "Drop-offs") {
    return "Candidate was moved to Drop-off.";
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

  if (isValidTimelineValue(hiringRequirement)) {
    details.push(`Hiring Requirement: ${hiringRequirement}`);
  }

  if (isValidTimelineValue(role)) {
    details.push(`Final Role: ${role}`);
  }

  if (isValidTimelineValue(account)) {
    details.push(`Final Account: ${account}`);
  }

  if (isValidTimelineValue(basicPay)) {
    details.push(
      `Basic Pay: ${
        String(basicPay).includes("₱") ? basicPay : formatCurrency(basicPay)
      }`,
    );
  }

  if (isValidTimelineValue(deminimisDailyRate)) {
    details.push(
      `Deminimis / Daily Rate: ${
        String(deminimisDailyRate).includes("₱")
          ? deminimisDailyRate
          : formatCurrency(deminimisDailyRate)
      }`,
    );
  }

  return details.join(", ");
}

function getHistoryRemarks(item = {}) {
  return (
    item.remarks ||
    item.dropOffReason ||
    item.dropOffCategory ||
    item.extra?.remarks ||
    ""
  );
}

function normalizeHistoryItem(item = {}, candidate = {}, fallbackOwner = "—") {
  const historyTitle = getHistoryTitle(item);
  const historyDate = getHistoryDate(item);
  const historyDescription = getHistoryDescription(item);
  const historyRemarks = getHistoryRemarks(item);
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

    const existing = uniqueMap.get(key);

    if (!existing) {
      uniqueMap.set(key, item);
      return;
    }

    const existingDate = new Date(existing.date || 0).getTime();
    const itemDate = new Date(item.date || 0).getTime();

    if (
      Number.isFinite(itemDate) &&
      (!Number.isFinite(existingDate) || itemDate > existingDate)
    ) {
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

function NhoUploadedFilesList({ files = [], onSelect }) {
  if (!files.length) {
    return (
      <div className="rounded-xl border border-dashed border-[#C9D6E4] bg-[#F8FAFC] p-5 text-center">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-white text-sibs-primary-1 shadow-sm">
          <FileText size={23} />
        </div>

        <p className="mt-3 text-sm font-extrabold text-[#101828]">
          No Candidate Pipeline NHO files yet
        </p>

        <p className="mt-1 text-xs font-semibold leading-5 text-sibs-tertiary-5">
          Uploaded files from the Candidate Pipeline NHO modal will appear here.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {files.map((file) => {
        const FileIcon = getFileIcon(file.fileName);
        const resolvedFileUrl = getResolvedFileUrl(file.fileUrl);

        return (
          <div
            key={`${file.id}-${file.requirement}-${file.fileName}-${file.fileUrl}`}
            className="rounded-xl border border-[#E6ECF2] bg-[#F8FAFC] p-3 transition hover:border-sibs-primary-1/30 hover:bg-white"
          >
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
              <button
                type="button"
                onClick={() => onSelect?.(file)}
                className="flex min-w-0 flex-1 items-start gap-3 text-left"
              >
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white text-sibs-primary-1 shadow-sm">
                  <FileIcon size={21} />
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex min-w-0 flex-wrap items-center gap-2">
                    <p
                      title={file.requirement}
                      className="truncate text-[11px] font-extrabold uppercase tracking-wide text-sibs-primary-1"
                    >
                      {file.requirement || "NHO Uploaded File"}
                    </p>

                    {isMajorPreEmploymentRequirement(file.requirement) && (
                      <span className="rounded-full border border-blue-100 bg-blue-50 px-2 py-0.5 text-[9px] font-extrabold uppercase text-sibs-primary-1">
                        Major
                      </span>
                    )}
                  </div>

                  <p
                    title={file.fileName || file.savedFileName}
                    className="mt-1 truncate text-sm font-extrabold text-[#101828]"
                  >
                    {file.fileName || file.savedFileName || "Uploaded file"}
                  </p>

                  <div className="mt-1 flex flex-wrap items-center gap-2 text-[11px] font-bold text-sibs-tertiary-5">
                    <span>{formatFileSize(file.fileSize)}</span>
                    <span>•</span>
                    <span>{formatUploadedDate(file.uploadedAt)}</span>
                  </div>
                </div>
              </button>

              <div className="flex shrink-0 items-center gap-2">
                <button
                  type="button"
                  onClick={() => onSelect?.(file)}
                  className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-[#D6DEE8] bg-white px-4 text-xs font-extrabold text-sibs-primary-1 transition hover:bg-[#F3F8FF]"
                >
                  <Eye size={15} />
                  View
                </button>

                {resolvedFileUrl && (
                  <a
                    href={resolvedFileUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-[#D6DEE8] bg-white px-4 text-xs font-extrabold text-sibs-primary-1 transition hover:bg-[#F3F8FF]"
                  >
                    <ExternalLink size={15} />
                    Open
                  </a>
                )}
              </div>
            </div>
          </div>
        );
      })}
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
          title="Files"
          description="Uploaded audio, supporting attachments, and NHO pre-employment files."
        />
      </div>

      <div className="rounded-2xl border border-[#D9E2EC] bg-white p-5 shadow-sm">
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

                <div className="mt-4 mb-2 flex items-center justify-between text-xs font-extrabold uppercase tracking-wide text-sibs-primary-1">
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
                  Candidate has fewer than 5 major requirements. Candidate
                  should remain under{" "}
                  <span className="font-extrabold">
                    For Onboarding - Incomplete Requirements
                  </span>{" "}
                  for Talent Pool follow-up.
                </div>
              )}

              {majorProgress.isComplete && (
                <div className="mt-4 rounded-xl border border-emerald-100 bg-emerald-50 px-4 py-3 text-sm font-bold leading-6 text-emerald-700">
                  Candidate completed the 5 major requirements and can proceed
                  to Onboarding.
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

              {canUpload && (
                <div className="mt-4 flex justify-end">
                  <button
                    type="button"
                    onClick={onUploadFollowUp}
                    className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-sibs-primary-1 px-5 text-sm font-extrabold text-white shadow-sm transition hover:opacity-90 active:scale-[0.98]"
                  >
                    <UploadCloud size={17} />
                    Upload Follow-up Requirements
                  </button>
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

            <section className="rounded-2xl border border-[#D9E2EC] bg-white p-5 shadow-sm">
              <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h3 className="text-lg font-extrabold text-sibs-primary-1">
                    Uploaded Files List
                  </h3>

                  <p className="mt-1 text-sm font-semibold leading-6 text-sibs-tertiary-5">
                    Complete list of all Candidate Pipeline NHO uploaded files.
                  </p>
                </div>

                <span className="inline-flex w-fit rounded-full bg-[#F2F6FA] px-3 py-1 text-xs font-extrabold text-sibs-primary-1">
                  {files.length} upload{files.length === 1 ? "" : "s"}
                </span>
              </div>

              <NhoUploadedFilesList files={files} onSelect={onSelectFile} />
            </section>
          </div>

          <aside className="xl:sticky xl:top-0 xl:self-start">
            <NhoFilePreviewPanel file={selectedFile} />
          </aside>
        </div>
      </div>
    </section>
  );
}

export default function CandidateProfileModal() {
  const {
    selectedCandidate,
    setSelectedCandidate,
    currentTaOwner,
    openEditCandidate,
    openStatus,
    openMoveToPipeline,
  } = useTalentPool();

  const [showFullApplicationHistory, setShowFullApplicationHistory] =
    useState(false);
  const [showNhoUploadModal, setShowNhoUploadModal] = useState(false);
  const [selectedNhoFile, setSelectedNhoFile] = useState(null);
  const [isMovingToOnboarding, setIsMovingToOnboarding] = useState(false);

  const [statusModal, setStatusModal] = useState({
    open: false,
    type: "success",
    title: "",
    message: "",
  });

  const [pipelineCandidateDetails, setPipelineCandidateDetails] = useState(null);
  const [pipelineCandidateDetailsLoading, setPipelineCandidateDetailsLoading] =
    useState(false);
  const [pipelineCandidateDetailsError, setPipelineCandidateDetailsError] =
    useState("");

  const [candidatePipelineFiles, setCandidatePipelineFiles] = useState([]);
  const [candidatePipelineFilesLoading, setCandidatePipelineFilesLoading] =
    useState(false);
  const [candidatePipelineFilesError, setCandidatePipelineFilesError] =
    useState("");

  const candidatePipelineLookupId = useMemo(
    () => getCandidatePipelineLookupId(selectedCandidate),
    [selectedCandidate],
  );

  const isPipelineLinkedForFiles = useMemo(
    () => isCandidateLinkedToPipeline(selectedCandidate),
    [selectedCandidate],
  );

  useEffect(() => {
    let isActive = true;

    setPipelineCandidateDetails(null);
    setPipelineCandidateDetailsError("");

    if (
      !selectedCandidate ||
      !candidatePipelineLookupId ||
      !isPipelineLinkedForFiles
    ) {
      setPipelineCandidateDetailsLoading(false);

      return () => {
        isActive = false;
      };
    }

    setPipelineCandidateDetailsLoading(true);

    api
      .get(
        `/api/candidate-pipeline/${encodeURIComponent(
          candidatePipelineLookupId,
        )}`,
        {
          withCredentials: true,
          params: {
            _t: Date.now(),
          },
        },
      )
      .then((response) => {
        if (!isActive) return;

        const pipelineCandidate = getPipelineCandidateFromResponse(response);

        setPipelineCandidateDetails(safeObject(pipelineCandidate));
      })
      .catch((error) => {
        if (!isActive) return;

        setPipelineCandidateDetails(null);
        setPipelineCandidateDetailsError(
          getApiErrorMessage(
            error,
            "Unable to load Candidate Pipeline process history.",
          ),
        );
      })
      .finally(() => {
        if (isActive) {
          setPipelineCandidateDetailsLoading(false);
        }
      });

    return () => {
      isActive = false;
    };
  }, [selectedCandidate, candidatePipelineLookupId, isPipelineLinkedForFiles]);

  const profileCandidate = useMemo(
    () =>
      mergeCandidateWithPipelineDetails(
        selectedCandidate,
        pipelineCandidateDetails,
      ),
    [selectedCandidate, pipelineCandidateDetails],
  );

  const profilePreEmploymentFiles = useMemo(
    () => getCandidatePreEmploymentFiles(profileCandidate),
    [profileCandidate],
  );

  useEffect(() => {
    let isActive = true;

    const localProfileFiles = profilePreEmploymentFiles;

    setCandidatePipelineFiles(localProfileFiles);
    setCandidatePipelineFilesError("");

    if (
      !selectedCandidate ||
      !candidatePipelineLookupId ||
      !isPipelineLinkedForFiles
    ) {
      setCandidatePipelineFilesLoading(false);

      return () => {
        isActive = false;
      };
    }

    setCandidatePipelineFilesLoading(true);

    api
      .get(
        `/api/candidate-pipeline/${encodeURIComponent(
          candidatePipelineLookupId,
        )}/nho/files`,
        {
          withCredentials: true,
          params: {
            _t: Date.now(),
          },
        },
      )
      .then((response) => {
        if (!isActive) return;

        const responseFiles = getNhoFilesFromApiResponse(response);

        const normalizedFiles = normalizeCandidateFiles(
          responseFiles,
          profileCandidate,
        );

        setCandidatePipelineFiles(
          normalizeCandidateFiles(
            [...localProfileFiles, ...normalizedFiles],
            profileCandidate,
          ),
        );
      })
      .catch((error) => {
        if (!isActive) return;

        if (localProfileFiles.length > 0) {
          setCandidatePipelineFiles(localProfileFiles);
          setCandidatePipelineFilesError("");
          return;
        }

        setCandidatePipelineFilesError(
          getApiErrorMessage(
            error,
            "Unable to load pre-employment files from Candidate Pipeline.",
          ),
        );
      })
      .finally(() => {
        if (isActive) {
          setCandidatePipelineFilesLoading(false);
        }
      });

    return () => {
      isActive = false;
    };
  }, [
    selectedCandidate,
    profileCandidate,
    candidatePipelineLookupId,
    isPipelineLinkedForFiles,
    profilePreEmploymentFiles,
  ]);

  const displayedPreEmploymentFiles = useMemo(
    () => normalizeCandidateFiles(candidatePipelineFiles, profileCandidate),
    [candidatePipelineFiles, profileCandidate],
  );

  const majorRequirementProgress = useMemo(
    () => calculateMajorRequirementProgress(displayedPreEmploymentFiles),
    [displayedPreEmploymentFiles],
  );

  const talentPoolStage = useMemo(
    () => cleanText(getCandidateStageValue(profileCandidate || selectedCandidate)),
    [profileCandidate, selectedCandidate],
  );

  const canUploadFollowUpNhoRequirements = useMemo(() => {
    const stage = talentPoolStage.toLowerCase();

    return Boolean(
      candidatePipelineLookupId &&
        isPipelineLinkedForFiles &&
        (stage === "for onboarding - incomplete requirements" ||
          stage === "for nho"),
    );
  }, [candidatePipelineLookupId, isPipelineLinkedForFiles, talentPoolStage]);

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

  function showStatusModal({ type = "success", title = "", message = "" }) {
    setStatusModal({
      open: true,
      type,
      title,
      message,
    });
  }

  function closeStatusModal() {
    setStatusModal((previous) => ({
      ...previous,
      open: false,
    }));
  }

  if (!selectedCandidate) return null;

  const activeCandidate = profileCandidate || selectedCandidate;

  const encodedBy = getEncodedByName(activeCandidate, currentTaOwner);
  const isDoNotReprocess = activeCandidate.status === "Do Not Reprocess";

  const candidateInitials =
    activeCandidate.name
      ?.split(" ")
      .map((part) => part[0])
      .slice(0, 2)
      .join("") || "C";

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

  const currentStage = getCandidateStageValue(activeCandidate);
  const isAlreadyInPipeline = isPipelineLinkedForFiles;
  const isAlreadyOnboarding =
    cleanText(currentStage).toLowerCase() === "onboarding";

  const canMoveToOnboarding = Boolean(
    isAlreadyInPipeline &&
      majorRequirementProgress.isComplete &&
      candidatePipelineLookupId &&
      !isAlreadyOnboarding,
  );

  function handleCloseCandidateProfile() {
    setSelectedCandidate(null);
  }

  function handleEditCandidate() {
    if (typeof openEditCandidate !== "function") {
      showStatusModal({
        type: "error",
        title: "Action Unavailable",
        message: "Edit Profile action is not available right now.",
      });
      return;
    }

    openEditCandidate(selectedCandidate);
  }

  function handleUpdateCandidateStatus() {
    if (typeof openStatus !== "function") {
      showStatusModal({
        type: "error",
        title: "Action Unavailable",
        message: "Update Status action is not available right now.",
      });
      return;
    }

    openStatus(selectedCandidate);
  }

  function handleMoveToPipeline() {
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
      showStatusModal({
        type: "success",
        title: "Already Linked",
        message: "This candidate is already linked to the Candidate Pipeline.",
      });
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

    openMoveToPipeline(selectedCandidate);
  }

  async function handleMoveToOnboarding() {
    if (!candidatePipelineLookupId) {
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
        `/api/candidate-pipeline/${encodeURIComponent(
          candidatePipelineLookupId,
        )}/move`,
        {
          targetStage: "Onboarding",
          stage: "Onboarding",
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
        currentPipelineStage: "Onboarding",
        currentStage: "Onboarding",
        pipelineStage: "Onboarding",
        stage: "Onboarding",
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

      setSelectedCandidate(nextCandidate);

      window.dispatchEvent(
        new CustomEvent("ta-talent-pool-updated", {
          detail: {
            candidate: nextCandidate,
            files: displayedPreEmploymentFiles,
            majorProgress: majorRequirementProgress,
            routedStage: "Onboarding",
          },
        }),
      );

      window.dispatchEvent(
        new CustomEvent("ta-pipeline-candidates-updated", {
          detail: {
            candidate: nextCandidate,
            files: displayedPreEmploymentFiles,
            majorProgress: majorRequirementProgress,
            routedStage: "Onboarding",
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

      showStatusModal({
        type: "success",
        title: "Moved to Onboarding",
        message:
          "Candidate completed all 5 major requirements and was moved to Onboarding.",
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
        responseCandidate.stage ||
        activeCandidate.currentPipelineStage ||
        activeCandidate.currentStage ||
        activeCandidate.pipelineStage ||
        "",
    );

    const nextCandidateBase = {
      ...activeCandidate,
      ...responseCandidate,

      nhoFiles: savedFiles,
      nho_files: savedFiles,
      preEmploymentFiles: savedFiles,
      pre_employment_files: savedFiles,
      uploadedFiles: savedFiles,
      files: savedFiles,

      majorNhoUploadProgress:
        majorProgress || calculateMajorRequirementProgress(savedFiles),
      major_nho_upload_progress:
        majorProgress || calculateMajorRequirementProgress(savedFiles),

      ...(nextStage
        ? {
            status:
              nextStage === "Onboarding"
                ? "Hired / Active"
                : activeCandidate.status,
            pipelineStatus:
              responseCandidate.pipelineStatus ||
              responseCandidate.pipeline_status ||
              activeCandidate.pipelineStatus ||
              "Active",
            currentPipelineStage: nextStage,
            currentStage: nextStage,
            pipelineStage: nextStage,
            stage: nextStage,
          }
        : {}),
    };

    const nextCandidate = mergeCandidateWithPipelineDetails(
      nextCandidateBase,
      responseCandidate,
    );

    setCandidatePipelineFiles(savedFiles);
    setSelectedCandidate(nextCandidate);
    setSelectedNhoFile(savedFiles[0] || null);
    setShowNhoUploadModal(false);

    window.dispatchEvent(
      new CustomEvent("ta-talent-pool-updated", {
        detail: {
          candidate: nextCandidate,
          files: savedFiles,
          majorProgress:
            majorProgress || calculateMajorRequirementProgress(savedFiles),
          routedStage: nextStage,
        },
      }),
    );

    window.dispatchEvent(
      new CustomEvent("ta-pipeline-candidates-updated", {
        detail: {
          candidate: nextCandidate,
          files: savedFiles,
          majorProgress:
            majorProgress || calculateMajorRequirementProgress(savedFiles),
          routedStage: nextStage,
        },
      }),
    );

    if (nextStage === "Onboarding") {
      window.dispatchEvent(
        new CustomEvent("ta-onboarding-updated", {
          detail: {
            candidate: nextCandidate,
            files: savedFiles,
            majorProgress:
              majorProgress || calculateMajorRequirementProgress(savedFiles),
          },
        }),
      );
    }

    showStatusModal({
      type: "success",
      title:
        nextStage === "Onboarding"
          ? "Moved to Onboarding"
          : "Requirements Saved",
      message:
        nextStage === "Onboarding"
          ? "Candidate completed the 5 major requirements and was moved to Onboarding."
          : "NHO uploaded files were saved and displayed in the candidate profile.",
    });
  }

  return (
    <>
      <div
        className="fixed inset-0 z-[10000] flex h-dvh items-center justify-center bg-black/40 px-4 py-4"
        onClick={handleCloseCandidateProfile}
      >
        <div
          className="flex max-h-[92dvh] w-full max-w-6xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl"
          onClick={(event) => event.stopPropagation()}
        >
          <div className="flex items-start justify-between gap-4 border-b border-gray-100 bg-white px-5 py-4 sm:px-6">
            <div className="min-w-0">
              <h2 className="truncate text-xl font-extrabold text-sibs-primary-1">
                Candidate Profile
              </h2>

              <p className="mt-1 text-sm font-medium text-sibs-tertiary-5">
                View the master candidate profile before moving to the pipeline.
              </p>
            </div>

            <button
              type="button"
              onClick={handleCloseCandidateProfile}
              className="rounded-full p-2 text-gray-400 transition hover:bg-gray-100 hover:text-gray-700"
            >
              <X size={20} />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto bg-[#F8FAFC] p-4 sm:p-6">
            <div className="grid grid-cols-1 gap-5">
              <div className="min-w-0 space-y-5">
                <section className="overflow-hidden rounded-2xl border border-[#E6ECF2] bg-white shadow-sm">
                  <div className="border-b border-[#E6ECF2] bg-[#F8FAFC] px-5 py-4">
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                      <div className="flex min-w-0 items-center gap-4">
                        <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-sibs-primary-1 text-lg font-extrabold text-white shadow-sm">
                          {candidateInitials}
                        </div>

                        <div className="min-w-0">
                          <h3 className="truncate text-xl font-extrabold text-[#101828]">
                            {activeCandidate.name || "Unnamed Candidate"}
                          </h3>

                          <p className="mt-1 truncate text-sm font-semibold text-sibs-primary-1">
                            {activeCandidate.email || "No email provided"}
                          </p>

                          <div className="mt-3 flex flex-wrap gap-2">
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

                            {currentStage && (
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

                      <div className="flex shrink-0 flex-col gap-2 sm:flex-row lg:items-center">
                        <button
                          type="button"
                          onClick={handleEditCandidate}
                          className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-[#D6DEE8] bg-white px-5 text-sm font-extrabold text-sibs-primary-1 transition hover:bg-[#F8FAFC] hover:shadow-sm"
                        >
                          <Pencil size={16} />
                          Edit Profile
                        </button>

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

                <section className="rounded-2xl border border-[#E6ECF2] bg-white p-5 shadow-sm">
                  <SectionTitle
                    icon={UserRound}
                    title="Personal Information"
                    description="Candidate master profile and contact information."
                  />

                  <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
                    <div className="rounded-xl bg-[#F8FAFC] p-4">
                      <DetailRow
                        label="First Name"
                        value={activeCandidate.firstName}
                      />
                      <DetailRow
                        label="Middle Name"
                        value={activeCandidate.middleName}
                      />
                      <DetailRow
                        label="Last Name"
                        value={activeCandidate.lastName}
                      />
                      <DetailRow label="Suffix" value={activeCandidate.suffix} />
                      <DetailRow
                        label="Nickname"
                        value={activeCandidate.nickname}
                      />
                      <DetailRow
                        label="Date of Birth"
                        value={formatDate(activeCandidate.dateOfBirth)}
                      />
                      <DetailRow
                        label="Age"
                        value={
                          activeCandidate.ageAsOfApplication
                            ? `${activeCandidate.ageAsOfApplication}`
                            : "—"
                        }
                      />
                    </div>

                    <div className="rounded-xl bg-[#F8FAFC] p-4">
                      <DetailRow label="Email" value={activeCandidate.email} />
                      <DetailRow
                        label="Phone 1"
                        value={
                          activeCandidate.phoneNumber1 ||
                          activeCandidate.contactNumber ||
                          activeCandidate.phone
                        }
                      />
                      <DetailRow
                        label="Phone 2"
                        value={activeCandidate.phoneNumber2}
                      />
                      <DetailRow
                        label="Address"
                        value={activeCandidate.physicalAddress}
                      />
                      <DetailRow
                        label="Preferred Location"
                        value={activeCandidate.applyingLocation}
                      />
                      <DetailRow label="Encoded By" value={encodedBy} />
                      <DetailRow
                        label="Created At"
                        value={formatDate(activeCandidate.createdAt)}
                      />
                    </div>
                  </div>
                </section>

                <section className="rounded-2xl border border-[#E6ECF2] bg-white p-5 shadow-sm">
                  <SectionTitle
                    icon={BriefcaseBusiness}
                    title="Application Source"
                    description="Candidate source information and referral details."
                  />

                  <div className="rounded-xl bg-[#F8FAFC] p-4">
                    <DetailRow
                      label="Applied Position"
                      value={
                        activeCandidate.openPosition ||
                        activeCandidate.roleCapability
                      }
                    />
                    <DetailRow
                      label="How Heard About Us"
                      value={formatList(activeCandidate.hearAboutUs)}
                    />
                    <DetailRow label="Source" value={activeCandidate.source} />
                    <DetailRow
                      label="Referred By"
                      value={activeCandidate.referredBy}
                    />
                    <DetailRow
                      label="Employee ID"
                      value={activeCandidate.employeeId}
                    />
                  </div>
                </section>

                <section className="rounded-2xl border border-[#E6ECF2] bg-white p-5 shadow-sm">
                  <SectionTitle
                    icon={Network}
                    title="Pipeline Link"
                    description="Current pipeline status, assignment, and TA ownership."
                  />

                  <div className="rounded-xl bg-[#F8FAFC] p-4">
                    <DetailRow
                      label="Pipeline Status"
                      value={activeCandidate.pipelineStatus || "—"}
                    />
                    <DetailRow
                      label="Current Stage"
                      value={
                        activeCandidate.currentPipelineStage ||
                        activeCandidate.currentStage ||
                        activeCandidate.pipelineStage ||
                        "—"
                      }
                    />
                    <DetailRow
                      label="Final Role"
                      value={
                        activeCandidate.currentAppliedRole || "Not assigned yet"
                      }
                    />
                    <DetailRow
                      label="Final Account"
                      value={
                        activeCandidate.currentAppliedAccount ||
                        "Not assigned yet"
                      }
                    />
                    <DetailRow
                      label="TA Owner"
                      value={activeCandidate.currentTaOwner || "—"}
                    />
                  </div>
                </section>

                <section className="rounded-2xl border border-[#E6ECF2] bg-white p-5 shadow-sm">
                  <SectionTitle
                    icon={GraduationCap}
                    title="Qualifications"
                    description="Education, work experience, skills, and certifications."
                  />

                  <div className="space-y-4">
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
                      <div className="rounded-2xl border border-[#E6ECF2] bg-[#F8FAFC] p-4">
                        <p className="text-[11px] font-extrabold uppercase tracking-wide text-sibs-primary-1">
                          Educational Attainment
                        </p>

                        <p className="mt-2 text-sm font-extrabold leading-6 text-[#101828]">
                          {activeCandidate.educationalAttainment || "—"}
                        </p>
                      </div>

                      <div className="rounded-2xl border border-[#E6ECF2] bg-[#F8FAFC] p-4">
                        <p className="text-[11px] font-extrabold uppercase tracking-wide text-sibs-primary-1">
                          Skills / Language
                        </p>

                        <p className="mt-2 text-sm font-extrabold leading-6 text-[#101828]">
                          {activeCandidate.skillsLanguage || "—"}
                        </p>
                      </div>

                      <div className="rounded-2xl border border-[#E6ECF2] bg-[#F8FAFC] p-4">
                        <p className="text-[11px] font-extrabold uppercase tracking-wide text-sibs-primary-1">
                          Affiliations
                        </p>

                        <p className="mt-2 text-sm font-extrabold leading-6 text-[#101828]">
                          {formatList(activeCandidate.affiliations)}
                        </p>
                      </div>

                      <div className="rounded-2xl border border-[#E6ECF2] bg-[#F8FAFC] p-4">
                        <p className="text-[11px] font-extrabold uppercase tracking-wide text-sibs-primary-1">
                          Training Attended
                        </p>

                        <p className="mt-2 text-sm font-extrabold leading-6 text-[#101828]">
                          {activeCandidate.trainingAttended || "—"}
                        </p>
                      </div>
                    </div>

                    <div className="overflow-hidden rounded-2xl border border-[#E6ECF2] bg-white">
                      <div className="flex flex-col gap-3 border-b border-[#E6ECF2] bg-[#F8FAFC] px-4 py-4 lg:flex-row lg:items-center lg:justify-between">
                        <div>
                          <h4 className="text-sm font-extrabold text-[#101828]">
                            Work Experience
                          </h4>

                          <p className="mt-1 text-xs font-semibold leading-5 text-sibs-tertiary-5">
                            Candidate employment background, previous role,
                            company, and compensation.
                          </p>
                        </div>

                        <span className="inline-flex w-fit rounded-full border border-blue-100 bg-blue-50 px-3 py-1 text-xs font-extrabold text-blue-700">
                          {activeCandidate.workExperience || "—"}
                        </span>
                      </div>

                      <div className="p-4">
                        {workExperiences.length > 0 ? (
                          <div className="space-y-4">
                            {workExperiences.map((experience, index) => (
                              <div
                                key={`experience-${index}`}
                                className="rounded-2xl border border-[#E6ECF2] bg-[#F8FAFC] p-4"
                              >
                                <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                                  <div className="min-w-0">
                                    <p className="text-[11px] font-extrabold uppercase tracking-wide text-sibs-primary-1">
                                      Experience {index + 1}
                                    </p>

                                    <h5 className="mt-1 text-base font-extrabold text-[#101828]">
                                      {experience.role ||
                                        experience.industry ||
                                        "—"}
                                    </h5>

                                    <p className="mt-1 text-sm font-semibold text-sibs-tertiary-5">
                                      {experience.company ||
                                        "Company not provided"}
                                    </p>
                                  </div>

                                  <span className="inline-flex w-fit shrink-0 rounded-full border border-[#D6E9FF] bg-blue-50 px-3 py-1 text-xs font-extrabold text-blue-700">
                                    {experience.years
                                      ? `${experience.years} year(s)`
                                      : "No duration"}
                                  </span>
                                </div>

                                <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-3">
                                  <div className="rounded-xl bg-white p-3">
                                    <p className="text-[11px] font-extrabold uppercase tracking-wide text-sibs-tertiary-5">
                                      Industry
                                    </p>

                                    <p className="mt-1 text-sm font-bold text-[#344054]">
                                      {experience.industry || "—"}
                                    </p>
                                  </div>

                                  <div className="rounded-xl bg-white p-3">
                                    <p className="text-[11px] font-extrabold uppercase tracking-wide text-sibs-tertiary-5">
                                      Compensation
                                    </p>

                                    <p className="mt-1 text-sm font-bold text-[#344054]">
                                      {experience.monthlyCompensation
                                        ? formatCurrency(
                                            experience.monthlyCompensation,
                                          )
                                        : "—"}
                                    </p>
                                  </div>

                                  <div className="rounded-xl bg-white p-3">
                                    <p className="text-[11px] font-extrabold uppercase tracking-wide text-sibs-tertiary-5">
                                      Length of Experience
                                    </p>

                                    <p className="mt-1 text-sm font-bold text-[#344054]">
                                      {experience.lengthOfWorkExperience || "—"}
                                    </p>
                                  </div>

                                  <div className="rounded-xl bg-white p-3 md:col-span-3">
                                    <p className="text-[11px] font-extrabold uppercase tracking-wide text-sibs-tertiary-5">
                                      Reason for Leaving
                                    </p>

                                    <p className="mt-1 text-sm font-bold leading-6 text-[#344054]">
                                      {experience.reasonForLeaving || "—"}
                                    </p>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="rounded-xl border border-dashed border-[#C9D6E4] bg-[#F8FAFC] p-5 text-center text-sm font-bold text-gray-500">
                            {activeCandidate.workExperience ||
                              "No work experience provided."}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </section>

                <section className="rounded-2xl border border-[#E6ECF2] bg-white p-5 shadow-sm">
                  <SectionTitle
                    icon={ShieldCheck}
                    title="Readiness and Compliance"
                    description="Availability, work setup, and compliance readiness."
                  />

                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
                    <StatusTile
                      label="Vaccinated"
                      value={activeCandidate.fullyVaccinated}
                    />

                    <StatusTile
                      label="On-site Ready"
                      value={activeCandidate.comfortableOnSite}
                    />

                    <StatusTile
                      label="Graveyard Shift"
                      value={activeCandidate.willingGraveyard}
                    />

                    <StatusTile
                      label="Employment Type"
                      value={activeCandidate.employmentInterest}
                    />

                    <StatusTile
                      label="Remote Access"
                      value={activeCandidate.remoteWorkAccess}
                    />

                    <StatusTile
                      label="Drug Test"
                      value={activeCandidate.willingDrugTest}
                    />

                    <div className="sm:col-span-2 xl:col-span-3">
                      <StatusTile
                        label="Background Check"
                        value={activeCandidate.willingBackgroundCheck}
                      />
                    </div>
                  </div>
                </section>

                <section className="rounded-2xl border border-[#E6ECF2] bg-white p-5 shadow-sm">
                  <SectionTitle
                    icon={Phone}
                    title="References"
                    description="Candidate character or work references."
                  />

                  <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
                    {validReferences.length > 0 ? (
                      validReferences.map((reference, index) => (
                        <ReferenceCard
                          key={`reference-${index}`}
                          reference={reference}
                          index={index}
                        />
                      ))
                    ) : (
                      <div className="rounded-xl border border-dashed border-[#C9D6E4] bg-[#F8FAFC] p-5 text-center text-sm font-bold text-gray-500 md:col-span-3">
                        No references provided.
                      </div>
                    )}
                  </div>
                </section>

                <section className="rounded-2xl border border-[#E6ECF2] bg-white p-5 shadow-sm">
                  <SectionTitle
                    icon={FileText}
                    title="Candidate Attachments"
                    description="Uploaded audio and supporting attachments from the candidate profile."
                  />

                  <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
                    <ViewableFileRow
                      label="Audio Recording"
                      fileName={activeCandidate.audioFileName}
                      fileUrl={activeCandidate.audioFileUrl}
                      fileType={activeCandidate.audioFileType}
                      audio
                    />

                    <ViewableFileRow
                      label="Attachment"
                      fileName={activeCandidate.attachmentFileName}
                      fileUrl={activeCandidate.attachmentFileUrl}
                      fileType={activeCandidate.attachmentFileType}
                    />
                  </div>
                </section>

                <CandidateNhoFilesSection
                  files={displayedPreEmploymentFiles}
                  selectedFile={selectedNhoFile}
                  onSelectFile={setSelectedNhoFile}
                  isLoading={candidatePipelineFilesLoading}
                  error={candidatePipelineFilesError}
                  canUpload={canUploadFollowUpNhoRequirements}
                  onUploadFollowUp={() => setShowNhoUploadModal(true)}
                />

                <section className="rounded-2xl border border-[#E6ECF2] bg-white p-5 shadow-sm">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <h3 className="text-sm font-extrabold text-[#101828]">
                        Application History
                      </h3>

                      <p className="mt-1 text-sm font-medium text-sibs-tertiary-5">
                        Candidate movement and application timeline, including
                        Candidate Pipeline process.
                      </p>
                    </div>

                    {applicationHistory.length > 0 && (
                      <span className="inline-flex w-fit rounded-full border border-blue-100 bg-blue-50 px-3 py-1 text-xs font-extrabold text-blue-700">
                        {applicationHistory.length} record
                        {applicationHistory.length > 1 ? "s" : ""}
                      </span>
                    )}
                  </div>

                  {pipelineCandidateDetailsError && (
                    <div className="mt-4 rounded-xl border border-amber-100 bg-amber-50 px-4 py-3 text-sm font-bold leading-6 text-amber-700">
                      {pipelineCandidateDetailsError}
                    </div>
                  )}

                  {pipelineCandidateDetailsLoading && (
                    <div className="mt-4 rounded-xl border border-blue-100 bg-blue-50 px-4 py-3 text-sm font-bold leading-6 text-blue-700">
                      Loading Candidate Pipeline process history...
                    </div>
                  )}

                  <div className="mt-5">
                    {applicationHistory.length > 0 ? (
                      <>
                        <div className="relative space-y-4">
                          {visibleApplicationHistory.map((item, index) => {
                            const historyTitle =
                              item.stage || "Application Update";

                            const historyDate =
                              item.date || activeCandidate.lastActivity;

                            const historyOwner = item.owner || encodedBy || "—";
                            const historyDescription = item.description;
                            const offerDetail = item.offerDetail;

                            const absoluteHistoryIndex =
                              applicationHistory.findIndex(
                                (historyItem) =>
                                  historyItem._dedupeKey === item._dedupeKey,
                              );

                            const safeHistoryIndex =
                              absoluteHistoryIndex >= 0
                                ? absoluteHistoryIndex
                                : index;

                            const isRealLastNode =
                              safeHistoryIndex === applicationHistory.length - 1;

                            const isLastVisibleNode =
                              index === visibleApplicationHistory.length - 1;

                            const shouldShowLine = !isRealLastNode;

                            const lineClass =
                              isLastVisibleNode && !showFullApplicationHistory
                                ? "absolute left-1/2 top-10 bottom-0 w-px -translate-x-1/2 bg-[#DCE8F5]"
                                : "absolute left-1/2 top-10 -bottom-4 w-px -translate-x-1/2 bg-[#DCE8F5]";

                            return (
                              <div
                                key={`${item._dedupeKey}-${historyDate}-${index}`}
                                className="relative grid grid-cols-[42px_minmax(0,1fr)] gap-4"
                              >
                                <div className="relative flex justify-center">
                                  {shouldShowLine && (
                                    <span className={lineClass} />
                                  )}

                                  <div className="relative z-10 flex h-10 w-10 items-center justify-center rounded-full border border-blue-100 bg-blue-50 text-sm font-extrabold text-blue-700 shadow-[0_0_0_6px_#FFFFFF]">
                                    {safeHistoryIndex + 1}
                                  </div>
                                </div>

                                <div className="rounded-2xl border border-[#D9E2EC] bg-[#F8FAFC] p-4 transition hover:border-sibs-primary-1/30 hover:bg-white hover:shadow-sm">
                                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                                    <div className="min-w-0">
                                      <h4
                                        title={historyTitle}
                                        className="line-clamp-2 text-sm font-extrabold leading-6 text-[#101828]"
                                      >
                                        {historyTitle}
                                      </h4>

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

                                  <p className="mt-4 whitespace-pre-line text-sm font-medium leading-6 text-[#475467]">
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

                                  {offerDetail && (
                                    <div className="mt-4 rounded-xl bg-white px-4 py-3 text-sm font-semibold leading-6 text-[#344054]">
                                      {offerDetail}
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
                              className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-[#D6DEE8] bg-white px-5 text-sm font-extrabold text-sibs-primary-1 transition hover:border-sibs-primary-1/30 hover:bg-[#F8FAFC] hover:shadow-sm active:scale-[0.98]"
                            >
                              {showFullApplicationHistory
                                ? "Show Less"
                                : "Show All"}

                              <ChevronDown
                                size={17}
                                className={`transition-transform duration-200 ${
                                  showFullApplicationHistory ? "rotate-180" : ""
                                }`}
                              />
                            </button>
                          </div>
                        )}
                      </>
                    ) : (
                      <div className="rounded-xl border border-dashed border-[#C9D6E4] bg-[#F8FAFC] p-5 text-center text-sm font-bold text-gray-500">
                        No application history yet.
                      </div>
                    )}
                  </div>
                </section>

                <section className="rounded-2xl border border-[#E6ECF2] bg-white p-5 shadow-sm">
                  <h3 className="text-sm font-extrabold text-[#101828]">
                    Remarks
                  </h3>

                  <p className="mt-3 whitespace-pre-line rounded-xl bg-[#F8FAFC] p-4 text-sm font-medium leading-6 text-[#475467]">
                    {activeCandidate.remarks || "—"}
                  </p>
                </section>
              </div>
            </div>
          </div>

          <div className="border-t border-gray-100 bg-white px-5 py-4 sm:px-6">
            <div className="flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-xs font-semibold text-sibs-tertiary-5">
                {isAlreadyInPipeline
                  ? "Candidate is already linked to the pipeline."
                  : "Review candidate details before moving to the pipeline."}
              </p>

              <div className="flex flex-col-reverse gap-2 sm:flex-row">
                <button
                  type="button"
                  onClick={handleCloseCandidateProfile}
                  className="inline-flex h-11 items-center justify-center rounded-xl border border-[#E6ECF2] bg-white px-5 text-sm font-extrabold text-[#475467] transition hover:bg-[#F8FAFC]"
                >
                  Close
                </button>

                {!isAlreadyInPipeline && (
                  <button
                    type="button"
                    disabled={isDoNotReprocess}
                    onClick={handleMoveToPipeline}
                    className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-sibs-primary-1 px-5 text-sm font-extrabold text-white shadow-sm transition hover:opacity-90 disabled:cursor-not-allowed disabled:bg-gray-300 disabled:text-white"
                  >
                    <ArrowRight size={16} />
                    Move to Pipeline
                  </button>
                )}

                {isAlreadyInPipeline && (
                  <button
                    type="button"
                    onClick={handleMoveToPipeline}
                    className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-blue-100 bg-blue-50 px-5 text-sm font-extrabold text-blue-700 transition hover:bg-blue-100"
                  >
                    <ArrowRight size={16} />
                    Already Linked
                  </button>
                )}

                {canMoveToOnboarding && (
                  <button
                    type="button"
                    disabled={isMovingToOnboarding}
                    onClick={handleMoveToOnboarding}
                    className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-sibs-primary-1 px-5 text-sm font-extrabold text-white shadow-sm transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-70"
                  >
                    <ArrowRight size={16} />
                    {isMovingToOnboarding ? "Moving..." : "Move to Onboarding"}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {canUploadFollowUpNhoRequirements && (
        <NhoUploadModal
          open={showNhoUploadModal}
          onClose={() => setShowNhoUploadModal(false)}
          candidateId={candidatePipelineLookupId}
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