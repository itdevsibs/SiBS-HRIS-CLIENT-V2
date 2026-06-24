import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowRight,
  BriefcaseBusiness,
  Check,
  ChevronDown,
  FileImage,
  FileSpreadsheet,
  FileText,
  GraduationCap,
  Loader2,
  Network,
  Pencil,
  Phone,
  RefreshCcw,
  ShieldCheck,
  UploadCloud,
  UserRound,
  X,
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
  ReferenceCard,
  StatusTile,
  ViewableFileRow,
} from "../../recruitment/talentPool/TalentPoolShared";

import GetAssessmentTimelineFiles from "../../../lib/utils/candidatePipeline/react-utils/GetAssessmentTimelineFiles";
import StatusModal from "../StatusModal";
import NhoUploadModal from "../candidatePipeline/NhoUploadModal";
import api from "../../../lib/axios/api-template";

const CANDIDATE_PIPELINE_ROUTE = "/recruitment/candidate-pipeline";
const ONBOARDING_ROUTE = "/recruitment/onboarding";

const INCOMPLETE_ONBOARDING_STAGE = "For Onboarding - Incomplete Requirements";
const ONBOARDING_STAGE = "Onboarding";

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

function normalizeLower(value) {
  return cleanText(value).toLowerCase();
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
  return cleanText(
    candidate.currentPipelineStage ||
      candidate.current_pipeline_stage ||
      candidate.currentStage ||
      candidate.current_stage ||
      candidate.pipelineStage ||
      candidate.pipeline_stage ||
      candidate.stage ||
      candidate.status ||
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

function isCandidateLinkedToPipeline(candidate = {}) {
  const safeCandidate = safeObject(candidate);
  const pipelineCandidate = safeObject(safeCandidate.pipelineCandidate);
  const pipelineDetails = safeObject(safeCandidate.pipelineDetails);

  return Boolean(
    safeCandidate.pipelineStatus ||
      safeCandidate.pipeline_status ||
      safeCandidate.currentPipelineStage ||
      safeCandidate.current_pipeline_stage ||
      safeCandidate.currentTaOwner ||
      safeCandidate.current_ta_owner ||
      safeCandidate.pipelineStage ||
      safeCandidate.pipeline_stage ||
      safeCandidate.currentStage ||
      safeCandidate.current_stage ||
      safeCandidate.movedToPipeline ||
      safeCandidate.moved_to_pipeline ||
      safeCandidate.pipelineId ||
      safeCandidate.pipeline_id ||
      safeCandidate.pipelineDbId ||
      safeCandidate.pipeline_db_id ||
      pipelineCandidate.id ||
      pipelineCandidate.dbId ||
      pipelineDetails.id ||
      pipelineDetails.dbId ||
      getCandidatePipelineLookupId(candidate),
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

function candidateMatchesPipeline(candidate = {}, pipelineCandidate = {}) {
  const sourceTalentPoolId = cleanText(
    pipelineCandidate.sourceTalentPoolId ||
      pipelineCandidate.source_talent_pool_id,
  );

  const talentPoolId = cleanText(candidate.id || candidate.rawId);

  const candidateIds = [
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

  const pipelineCandidateIds = [
    pipelineCandidate.candidateId,
    pipelineCandidate.candidate_id,
    pipelineCandidate.candidateApplicationId,
    pipelineCandidate.candidate_application_id,
    pipelineCandidate.applicationId,
    pipelineCandidate.application_id,
    pipelineCandidate.publicId,
    pipelineCandidate.public_id,
  ]
    .map(cleanText)
    .filter(Boolean);

  const email = normalizeLower(candidate.email);
  const pipelineEmail = normalizeLower(pipelineCandidate.email);

  const name = normalizeLower(candidate.name || candidate.fullName);
  const pipelineName = normalizeLower(
    pipelineCandidate.name ||
      pipelineCandidate.fullName ||
      pipelineCandidate.candidateName,
  );

  return Boolean(
    (sourceTalentPoolId && talentPoolId && sourceTalentPoolId === talentPoolId) ||
      candidateIds.some((id) => pipelineCandidateIds.includes(id)) ||
      (email && pipelineEmail && email === pipelineEmail) ||
      (name && pipelineName && name === pipelineName),
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
      const match =
        rows.find((row) => candidateMatchesPipeline(candidate, row)) ||
        rows[0] ||
        null;

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
    <div className="mb-5 flex min-w-0 items-start gap-3">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#EEF2F6] text-sibs-primary-1">
        <Icon size={20} />
      </div>

      <div className="min-w-0">
        <h3 className="text-base font-extrabold uppercase tracking-wide text-sibs-primary-1">
          {title}
        </h3>

        {description && (
          <p className="mt-1 text-sm font-semibold leading-5 text-sibs-primary-1/80">
            {description}
          </p>
        )}
      </div>
    </div>
  );
}

function DetailRow({ label, value }) {
  const displayValue =
    value === null || value === undefined || value === "" ? "—" : value;

  return (
    <div className="flex min-w-0 items-start justify-between gap-4 border-b border-[#E6ECF2] py-3 last:border-b-0">
      <p className="shrink-0 text-[11px] font-extrabold uppercase tracking-wide text-sibs-primary-1">
        {label}
      </p>

      <p
        title={String(displayValue)}
        className="min-w-0 break-words text-right text-sm font-extrabold leading-6 text-[#101828]"
      >
        {displayValue}
      </p>
    </div>
  );
}

function EmptyState({ title, description }) {
  return (
    <div className="rounded-xl border border-dashed border-[#C9D6E4] bg-[#F8FAFC] p-5 text-center">
      <p className="text-sm font-extrabold text-[#101828]">{title}</p>
      {description && (
        <p className="mt-1 text-xs font-semibold leading-5 text-sibs-tertiary-5">
          {description}
        </p>
      )}
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

export default function CandidateProfileModal() {
  const navigate = useNavigate();

  const {
    selectedCandidate,
    setSelectedCandidate,
    currentTaOwner,
    openEditCandidate,
    openStatus,
    openMoveToPipeline,
    refreshTalentPool,
    setCandidateList,
  } = useTalentPool();

  const [showFullApplicationHistory, setShowFullApplicationHistory] =
    useState(false);
  const [activeTab, setActiveTab] = useState("personal");

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

  const candidatePipelineLookupId = useMemo(
    () => getCandidatePipelineLookupId(selectedCandidate),
    [selectedCandidate],
  );

  useEffect(() => {
    setActiveTab("personal");
    setShowFullApplicationHistory(false);
    setSelectedNhoFile(null);
    setShowNhoUploadModal(false);
    setPipelineCandidateDetails(null);
    setResolvedPipelineId("");
    setCandidatePipelineFiles([]);
    setCandidatePipelineFilesError("");
    setPipelineCandidateDetailsError("");
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
  const isDoNotReprocess = activeCandidate.status === "Do Not Reprocess";

  const currentStage = getCandidateStageValue(activeCandidate);
  const normalizedCurrentStage = normalizeLower(currentStage);

  const isIncompleteRequirementsStage =
    normalizedCurrentStage === normalizeLower(INCOMPLETE_ONBOARDING_STAGE);

  const isAlreadyOnboarding =
    normalizedCurrentStage === normalizeLower(ONBOARDING_STAGE);

  const isAlreadyInPipeline = isCandidateLinkedToPipeline(activeCandidate);

  const canUploadFollowUpNhoRequirements = Boolean(
    (resolvedPipelineId || candidatePipelineLookupId) &&
      isAlreadyInPipeline &&
      (isIncompleteRequirementsStage || normalizedCurrentStage === "for nho"),
  );

  const canMoveToOnboarding = Boolean(
    isAlreadyInPipeline &&
      majorRequirementProgress.isComplete &&
      (resolvedPipelineId || candidatePipelineLookupId) &&
      !isAlreadyOnboarding,
  );

  const shouldShowLinkedButton = Boolean(
    isAlreadyInPipeline && !isIncompleteRequirementsStage && !canMoveToOnboarding,
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
      id: "personal",
      label: "Personal Information",
      icon: UserRound,
    },
    {
      id: "applicationSource",
      label: "Application Source",
      icon: BriefcaseBusiness,
    },
    {
      id: "pipeline",
      label: "Pipeline Link",
      icon: Network,
    },
    {
      id: "qualifications",
      label: "Qualifications",
      icon: GraduationCap,
    },
    {
      id: "workExperience",
      label: "Work Experience",
      icon: BriefcaseBusiness,
    },
    {
      id: "readiness",
      label: "Readiness",
      icon: ShieldCheck,
    },
    {
      id: "references",
      label: "References",
      icon: Phone,
    },
    {
      id: "files",
      label: "Files",
      icon: FileText,
    },
    {
      id: "preEmploymentFiles",
      label: "Pre-Employment Files",
      icon: FileText,
    },
    {
      id: "applicationHistory",
      label: "Application History",
      icon: Network,
    },
    {
      id: "remarks",
      label: "General Remarks",
      icon: FileText,
    },
  ];

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

  function renderPersonalInformation() {
    return (
      <section className="rounded-2xl border border-[#E6ECF2] bg-white p-5 shadow-sm">
        <SectionTitle
          icon={UserRound}
          title="Personal Information"
          description="Candidate master profile and contact information."
        />

        <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
          <div className="rounded-xl bg-[#F8FAFC] p-4">
            <DetailRow label="First Name" value={activeCandidate.firstName} />
            <DetailRow label="Middle Name" value={activeCandidate.middleName} />
            <DetailRow label="Last Name" value={activeCandidate.lastName} />
            <DetailRow label="Suffix" value={activeCandidate.suffix} />
            <DetailRow label="Nickname" value={activeCandidate.nickname} />
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
            <DetailRow label="Phone 2" value={activeCandidate.phoneNumber2} />
            <DetailRow label="Address" value={activeCandidate.physicalAddress} />
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
    );
  }

  function renderApplicationSource() {
    return (
      <section className="rounded-2xl border border-[#E6ECF2] bg-white p-5 shadow-sm">
        <SectionTitle
          icon={BriefcaseBusiness}
          title="Application Source"
          description="Candidate source information and referral details."
        />

        <div className="rounded-xl bg-[#F8FAFC] p-4">
          <DetailRow
            label="Applied Position"
            value={activeCandidate.openPosition || activeCandidate.roleCapability}
          />
          <DetailRow
            label="How Heard About Us"
            value={formatList(activeCandidate.hearAboutUs)}
          />
          <DetailRow label="Source" value={activeCandidate.source} />
          <DetailRow label="Referred By" value={activeCandidate.referredBy} />
          <DetailRow label="Employee ID" value={activeCandidate.employeeId} />
        </div>
      </section>
    );
  }

  function renderPipelineLink() {
    return (
      <section className="rounded-2xl border border-[#E6ECF2] bg-white p-5 shadow-sm">
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

        <div className="rounded-xl bg-[#F8FAFC] p-4">
          <DetailRow
            label="Pipeline ID"
            value={resolvedPipelineId || candidatePipelineLookupId || "—"}
          />
          <DetailRow
            label="Pipeline Status"
            value={activeCandidate.pipelineStatus || "—"}
          />
          <DetailRow label="Current Stage" value={currentStage || "—"} />
          <DetailRow
            label="Final Role"
            value={activeCandidate.currentAppliedRole || "Not assigned yet"}
          />
          <DetailRow
            label="Final Account"
            value={activeCandidate.currentAppliedAccount || "Not assigned yet"}
          />
          <DetailRow
            label="TA Owner"
            value={activeCandidate.currentTaOwner || "—"}
          />
        </div>
      </section>
    );
  }

  function renderQualifications() {
    return (
      <section className="rounded-2xl border border-[#E6ECF2] bg-white p-5 shadow-sm">
        <SectionTitle
          icon={GraduationCap}
          title="Qualifications"
          description="Education, skills, trainings, and certifications."
        />

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <StatusTile
            label="Educational Attainment"
            value={activeCandidate.educationalAttainment}
          />
          <StatusTile
            label="Skills / Language"
            value={activeCandidate.skillsLanguage}
          />
          <StatusTile
            label="Affiliations"
            value={formatList(activeCandidate.affiliations)}
          />
          <StatusTile
            label="Training Attended"
            value={activeCandidate.trainingAttended}
          />
        </div>
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

                <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-3">
                  <StatusTile label="Industry" value={experience.industry} />
                  <StatusTile
                    label="Compensation"
                    value={
                      experience.monthlyCompensation
                        ? formatCurrency(experience.monthlyCompensation)
                        : "—"
                    }
                  />
                  <StatusTile
                    label="Length of Experience"
                    value={experience.lengthOfWorkExperience}
                  />

                  <div className="md:col-span-3">
                    <StatusTile
                      label="Reason for Leaving"
                      value={experience.reasonForLeaving}
                    />
                  </div>
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

  function renderReadiness() {
    return (
      <section className="rounded-2xl border border-[#E6ECF2] bg-white p-5 shadow-sm">
        <SectionTitle
          icon={ShieldCheck}
          title="Readiness and Compliance"
          description="Availability, work setup, and compliance readiness."
        />

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
          <StatusTile label="Vaccinated" value={activeCandidate.fullyVaccinated} />
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
          <StatusTile label="Drug Test" value={activeCandidate.willingDrugTest} />

          <div className="sm:col-span-2 xl:col-span-3">
            <StatusTile
              label="Background Check"
              value={activeCandidate.willingBackgroundCheck}
            />
          </div>
        </div>
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

  function renderFiles() {
    return (
      <section className="rounded-2xl border border-[#E6ECF2] bg-white p-5 shadow-sm">
        <SectionTitle
          icon={FileText}
          title="Files"
          description="Uploaded audio and supporting attachments."
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
      <section className="rounded-2xl border border-[#E6ECF2] bg-white p-5 shadow-sm">
        <SectionTitle
          icon={FileText}
          title="General Remarks"
          description="Additional notes for this candidate."
        />

        <div className="rounded-2xl border border-[#E6ECF2] bg-[#F8FAFC] p-4 text-sm font-medium leading-6 text-[#475467]">
          {activeCandidate.remarks || "No additional remarks."}
        </div>
      </section>
    );
  }

  function renderActiveTabContent() {
    if (activeTab === "personal") return renderPersonalInformation();
    if (activeTab === "applicationSource") return renderApplicationSource();
    if (activeTab === "pipeline") return renderPipelineLink();
    if (activeTab === "qualifications") return renderQualifications();
    if (activeTab === "workExperience") return renderWorkExperience();
    if (activeTab === "readiness") return renderReadiness();
    if (activeTab === "references") return renderReferences();
    if (activeTab === "files") return renderFiles();
    if (activeTab === "preEmploymentFiles") return renderPreEmploymentFiles();
    if (activeTab === "applicationHistory") return renderApplicationHistory();
    if (activeTab === "remarks") return renderRemarks();

    return null;
  }

  return (
    <>
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

                    <div className="flex shrink-0 flex-col gap-2 sm:flex-row xl:items-center">
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

              <div className="grid grid-cols-1 gap-5 lg:grid-cols-[230px_minmax(0,1fr)]">
                <section className="rounded-2xl border border-[#E6ECF2] bg-white p-3 shadow-sm lg:sticky lg:top-0 lg:self-start">
                  <div className="flex gap-2 overflow-x-auto pb-1 lg:flex-col lg:overflow-visible lg:pb-0">
                    {profileTabs.map((tab) => {
                      const Icon = tab.icon;
                      const active = activeTab === tab.id;

                      return (
                        <button
                          key={tab.id}
                          type="button"
                          onClick={() => setActiveTab(tab.id)}
                          className={`inline-flex min-h-11 shrink-0 items-center justify-start gap-3 rounded-xl px-4 py-3 text-left text-xs font-extrabold transition lg:w-full ${
                            active
                              ? "bg-sibs-primary-1 text-white shadow-sm"
                              : "bg-white text-sibs-primary-1 hover:bg-[#F8FAFC]"
                          }`}
                        >
                          <Icon size={16} className="shrink-0" />
                          <span className="whitespace-nowrap lg:whitespace-normal">
                            {tab.label}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </section>

                <div className="min-w-0">{renderActiveTabContent()}</div>
              </div>
            </div>
          </div>

          <div className="relative z-[40] flex flex-col-reverse gap-4 border-t border-[#E6ECF2] bg-white px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-7">
            <p className="text-xs font-bold leading-5 text-sibs-tertiary-5">
              {canMoveToOnboarding ? (
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

              {!isAlreadyInPipeline && !isDoNotReprocess && (
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