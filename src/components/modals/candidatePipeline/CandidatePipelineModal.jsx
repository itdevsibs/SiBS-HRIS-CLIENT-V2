import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowRight,
  X,
  UserX,
  Eye,
  CalendarDays,
  ClipboardCheck,
  Mail,
  ChevronDown,
  CirclePlay,
  UploadCloud,
  FileText,
  FileImage,
  FileSpreadsheet,
  Trash2,
  Check,
  Loader2,
} from "lucide-react";

import DetailRow from "../../layout/common/DetailRow";
import CandidateAvatar from "../../recruitment/candidatePipeline/CandidateAvatar";
import CandidateTalentPoolDetailsPanel from "../../recruitment/candidatePipeline/CandidateTalentPoolDetailsPanel";
import LeadPrfReviewCard from "../../recruitment/candidatePipeline/LeadPrfReviewCard";

import {
  offerApprovers,
  offerDecisionOptions,
} from "../../../lib/utils/candidatePipeline/candidatePipelineConstants";

import {
  formatDateTime,
  formatCurrency,
} from "../../../lib/utils/candidatePipeline/candidatePipelineFormatters";

import {
  getNextStage,
  hasInterviewSchedule,
  getAssessmentResult,
  getDisplayInterviewStatus,
  getDisplayInterviewType,
  canScheduleInterview,
  getStageClass,
  getPrfStatusClass,
  getInterviewStatusClass,
  getAssessmentResultClass,
  getOfferApprovalClass,
  getOfferDecisionClass,
  getOfferApprovalSummary,
  isOfferApproved,
  buildAssessmentLink,
  buildOfferContractLink,
} from "../../../lib/utils/candidatePipeline/candidatePipelineHelpers";

import { useNavigate } from "react-router-dom";
import { useCandidatePipeline } from "../../../services/context/CandidatePipelineContext";
import GetAssessmentTimelineFiles from "../../../lib/utils/candidatePipeline/react-utils/GetAssessmentTimelineFiles";
import StatusModal from "../StatusModal";
import api from "../../../lib/axios/api-template";

const INCOMPLETE_ONBOARDING_STAGE = "For Onboarding - Incomplete Requirements";
const ONBOARDING_STAGE = "Onboarding";

const ACCEPTED_FILE_TYPES =
  ".pdf,.doc,.docx,.xls,.xlsx,.csv,.jpg,.jpeg,.png,.gif,.webp,.heic,.heif";

const MAJOR_REQUIREMENTS = [
  "Transcript of Records and/or Diploma",
  "Medical Records",
  "NBI Clearance",
  "Birth Certificate",
  "Valid ID",
];

const PRE_EMPLOYMENT_REQUIREMENT_GROUPS = [
  {
    id: "major",
    title: "Major Requirements",
    badge: "Required before Onboarding",
    requirements: MAJOR_REQUIREMENTS,
  },
  {
    id: "other",
    title: "Other Requirements",
    badge: "",
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
    badge: "",
    requirements: ["BIR 2316 Form", "Employment Certificate"],
  },
];

const ALL_REQUIREMENTS = PRE_EMPLOYMENT_REQUIREMENT_GROUPS.flatMap(
  (group) => group.requirements,
);

const ASSESSMENT_STATUS_OPTIONS = ["Not Take", "Taken"];

const ASSESSMENT_RESULT_OPTIONS = [
  "Assessment Fit",
  "Assessment Not Fit",
  "For Reassessment",
];

function cleanText(value) {
  return String(value ?? "").trim();
}

function normalizeRequirement(value = "") {
  return cleanText(value).toLowerCase().replace(/\s+/g, " ");
}

function normalizeRequirementSlug(value = "") {
  return cleanText(value)
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
}

function getOfficialRequirementMatch(value = "") {
  const key = normalizeRequirementSlug(value);

  if (!key) return "";

  return (
    ALL_REQUIREMENTS.find((requirement) => {
      const requirementKey = normalizeRequirementSlug(requirement);

      return (
        key === requirementKey ||
        key.startsWith(`${requirementKey}_`) ||
        key.includes(requirementKey)
      );
    }) || ""
  );
}

function getOfficialRequirementFromFile(file = {}) {
  const directRequirement =
    file.requirement || file.label || file.category || file.title || "";

  const directMatch = getOfficialRequirementMatch(directRequirement);

  if (directMatch) return directMatch;

  const filename =
    file.savedFileName ||
    file.saved_file_name ||
    file.filename ||
    file.storedFileName ||
    file.stored_file_name ||
    file.fileName ||
    file.name ||
    file.originalName ||
    file.originalname ||
    file.filePath ||
    file.storedPath ||
    "";

  return getOfficialRequirementMatch(filename);
}

function isOfficialNhoFile(file = {}) {
  return Boolean(getOfficialRequirementFromFile(file));
}

function isMajorRequirement(requirement = "") {
  const key = normalizeRequirement(requirement);

  return MAJOR_REQUIREMENTS.some(
    (item) => normalizeRequirement(item) === key,
  );
}

function formatFileSize(size = 0) {
  const numberSize = Number(size || 0);

  if (!numberSize) return "—";

  const kb = numberSize / 1024;

  if (kb < 1024) return `${kb.toFixed(1)} KB`;

  return `${(kb / 1024).toFixed(1)} MB`;
}

function getFileIcon(fileName = "") {
  const value = String(fileName || "").toLowerCase();

  if (/\.(jpg|jpeg|png|gif|webp|heic|heif)$/i.test(value)) return FileImage;
  if (/\.(xls|xlsx|csv)$/i.test(value)) return FileSpreadsheet;

  return FileText;
}

function getCurrentTimestamp() {
  return new Date().toLocaleString("en-PH", {
    year: "numeric",
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function getApiErrorMessage(error, fallback = "Request failed.") {
  return (
    error?.response?.data?.message ||
    error?.response?.data?.error ||
    error?.message ||
    fallback
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

function isRawBrowserFile(file) {
  return typeof File !== "undefined" && file instanceof File;
}

function buildCandidatePipelineFileUrl(candidateId = "", file = {}) {
  const filename =
    file.savedFileName ||
    file.saved_file_name ||
    file.filename ||
    file.storedFileName ||
    file.stored_file_name ||
    file.fileName ||
    file.name ||
    "";

  if (!candidateId || !filename) return "";

  return `/api/candidate-pipeline/file/${encodeURIComponent(
    candidateId,
  )}/${encodeURIComponent(filename)}`;
}

function normalizeUploadedFile(file = {}, candidateId = "") {
  const savedFileName =
    file.savedFileName ||
    file.saved_file_name ||
    file.filename ||
    file.storedFileName ||
    file.stored_file_name ||
    "";

  const fileName =
    file.fileName ||
    file.name ||
    file.originalName ||
    file.originalname ||
    savedFileName ||
    "";

  const rawFileUrl =
    file.fileUrl ||
    file.url ||
    file.dataUrl ||
    file.previewUrl ||
    file.downloadUrl ||
    buildCandidatePipelineFileUrl(candidateId, {
      ...file,
      fileName,
      savedFileName,
    });

  const officialRequirement = getOfficialRequirementFromFile({
    ...file,
    savedFileName,
    fileName,
  });

  return {
    ...file,
    id:
      file.id ||
      file.fileId ||
      file.file_id ||
      `NHO-FILE-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    requirement:
      officialRequirement ||
      file.requirement ||
      file.label ||
      file.category ||
      "",
    fileName,
    savedFileName,
    filename: file.filename || savedFileName,
    fileSize: file.fileSize || file.size || 0,
    fileType:
      file.fileType ||
      file.type ||
      file.mimetype ||
      file.mimeType ||
      "application/octet-stream",
    fileUrl: getResolvedFileUrl(rawFileUrl),
    filePath: file.filePath || file.storedPath || file.path || "",
    storedPath: file.storedPath || file.filePath || file.path || "",
    uploadedAt:
      file.uploadedAt ||
      file.uploaded_at ||
      file.createdAt ||
      file.created_at ||
      file.updatedAt ||
      file.updated_at ||
      "",
    uploadedBy:
      file.uploadedBy ||
      file.uploaded_by ||
      file.createdBy ||
      file.created_by ||
      file.updatedBy ||
      file.updated_by ||
      "",
    applicantFolderName:
      file.applicantFolderName ||
      file.applicant_folder_name ||
      file.folderName ||
      "",
    rawFile: file.rawFile || null,
  };
}

function normalizeOfficialUploadedFile(file = {}, candidateId = "") {
  if (!isOfficialNhoFile(file)) return null;

  return normalizeUploadedFile(file, candidateId);
}

function filterOfficialUploadedFiles(files = [], candidateId = "") {
  return files
    .filter(Boolean)
    .map((file) => normalizeOfficialUploadedFile(file, candidateId))
    .filter(Boolean);
}

function getRequirementSortIndex(requirement = "") {
  const key = normalizeRequirement(requirement);

  const index = ALL_REQUIREMENTS.findIndex(
    (item) => normalizeRequirement(item) === key,
  );

  return index === -1 ? 9999 : index;
}

function dedupeFiles(files = [], candidateId = "") {
  const map = new Map();

  filterOfficialUploadedFiles(files, candidateId).forEach((file) => {
    const key = normalizeRequirement(file.requirement);

    if (!key) return;

    const current = map.get(key);

    if (!current) {
      map.set(key, file);
      return;
    }

    const currentDate = new Date(current.uploadedAt || 0).getTime();
    const nextDate = new Date(file.uploadedAt || 0).getTime();

    if (!Number.isFinite(currentDate) || nextDate >= currentDate) {
      map.set(key, {
        ...current,
        ...file,
      });
    }
  });

  return Array.from(map.values()).sort((a, b) => {
    const aMajor = isMajorRequirement(a.requirement) ? 0 : 1;
    const bMajor = isMajorRequirement(b.requirement) ? 0 : 1;

    if (aMajor !== bMajor) return aMajor - bMajor;

    const requirementSort =
      getRequirementSortIndex(a.requirement) -
      getRequirementSortIndex(b.requirement);

    if (requirementSort !== 0) return requirementSort;

    return cleanText(a.fileName).localeCompare(cleanText(b.fileName));
  });
}

function sortUploadedFiles(files = []) {
  return files.slice().sort((a, b) => {
    const requirementSort =
      getRequirementSortIndex(a.requirement) -
      getRequirementSortIndex(b.requirement);

    if (requirementSort !== 0) return requirementSort;

    return cleanText(a.fileName).localeCompare(cleanText(b.fileName));
  });
}

function calculateProgress(files = [], requirements = ALL_REQUIREMENTS) {
  const uploadedMap = new Map();

  filterOfficialUploadedFiles(files).forEach((file) => {
    const key = normalizeRequirement(file.requirement);
    if (key) uploadedMap.set(key, file);
  });

  const completed = requirements.filter((requirement) =>
    uploadedMap.has(normalizeRequirement(requirement)),
  ).length;

  const total = requirements.length;
  const percent = total ? Math.round((completed / total) * 100) : 0;

  return {
    completed,
    total,
    percent,
    isComplete: total > 0 && completed >= total,
  };
}

function getFilesFromApiPayload(payload) {
  const responsePayload = payload?.data ?? payload;

  if (Array.isArray(responsePayload)) return responsePayload;
  if (Array.isArray(responsePayload?.files)) return responsePayload.files;
  if (Array.isArray(responsePayload?.data?.files)) {
    return responsePayload.data.files;
  }
  if (Array.isArray(responsePayload?.candidate?.nhoFiles)) {
    return responsePayload.candidate.nhoFiles;
  }
  if (Array.isArray(responsePayload?.candidate?.nho_files)) {
    return responsePayload.candidate.nho_files;
  }
  if (Array.isArray(responsePayload?.data?.nhoFiles)) {
    return responsePayload.data.nhoFiles;
  }
  if (Array.isArray(responsePayload?.data?.nho_files)) {
    return responsePayload.data.nho_files;
  }

  return [];
}

function getCandidateFromApiPayload(payload) {
  const responsePayload = payload?.data ?? payload;

  return (
    responsePayload?.candidate ||
    responsePayload?.data?.candidate ||
    responsePayload?.data ||
    null
  );
}

function normalizePrfStatus(value) {
  const text = cleanText(value);

  if (!text) return "Review";

  const key = text.toLowerCase();

  if (
    key === "matched" ||
    key === "match" ||
    key === "prf matched" ||
    key === "approved"
  ) {
    return "Matched";
  }

  if (
    key === "not matched" ||
    key === "unmatched" ||
    key === "not_match" ||
    key === "not-match"
  ) {
    return "Not Matched";
  }

  if (
    key === "review" ||
    key === "for review" ||
    key === "pending" ||
    key === "prf review"
  ) {
    return "Review";
  }

  return text;
}

function getCandidateRecordId(candidate = {}) {
  return (
    candidate?.dbId ||
    candidate?.id ||
    candidate?.candidatePipelineId ||
    candidate?.candidateId ||
    candidate?.candidateApplicationId ||
    candidate?.applicationId ||
    ""
  );
}

function RequirementCard({
  requirement,
  uploadedFile,
  disabled = false,
  onUpload,
  onSelect,
  onRemove,
}) {
  const inputRef = useRef(null);
  const hasFile = Boolean(uploadedFile?.fileName || uploadedFile?.fileUrl);
  const FileIcon = getFileIcon(uploadedFile?.fileName);

  function handleFileChange(event) {
    const file = event.target.files?.[0];

    if (!file) return;

    const previewUrl = URL.createObjectURL(file);

    onUpload?.(requirement, {
      id: `NHO-FILE-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      requirement,
      fileName: file.name,
      fileSize: file.size,
      fileType: file.type || "application/octet-stream",
      fileUrl: previewUrl,
      uploadedAt: new Date().toISOString(),
      uploadedBy: "Current User",
      rawFile: file,
    });

    event.target.value = "";
  }

  return (
    <div
      className={`rounded-xl border p-4 transition ${
        hasFile
          ? "border-emerald-200 bg-emerald-50/50"
          : "border-[#D9E2EC] bg-[#F8FAFC]"
      }`}
    >
      <div className="flex min-w-0 items-start gap-3">
        <div
          className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-md border ${
            hasFile
              ? "border-emerald-500 bg-emerald-500 text-white"
              : "border-[#B9C7D6] bg-white"
          }`}
        >
          {hasFile && <Check size={14} strokeWidth={3} />}
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex min-w-0 items-start justify-between gap-2">
            <p
              title={requirement}
              className="truncate text-sm font-extrabold text-[#101828]"
            >
              {requirement}
            </p>

            {isMajorRequirement(requirement) && (
              <span className="shrink-0 rounded-full border border-blue-100 bg-blue-50 px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-wide text-sibs-primary-1">
                Major
              </span>
            )}
          </div>

          {hasFile ? (
            <div className="mt-3 rounded-xl border border-emerald-100 bg-white p-3">
              <button
                type="button"
                onClick={() => onSelect?.(uploadedFile)}
                className="flex w-full min-w-0 items-center gap-3 text-left"
              >
                <FileIcon size={18} className="shrink-0 text-emerald-700" />

                <span className="min-w-0 flex-1">
                  <span
                    title={uploadedFile.fileName || uploadedFile.savedFileName}
                    className="block truncate text-xs font-extrabold text-emerald-800"
                  >
                    {uploadedFile.fileName ||
                      uploadedFile.savedFileName ||
                      "Uploaded file"}
                  </span>

                  <span className="mt-0.5 block text-[11px] font-bold text-emerald-700/80">
                    {formatFileSize(uploadedFile.fileSize)}
                  </span>
                </span>
              </button>

              <div className="mt-3 flex items-center gap-2">
                <button
                  type="button"
                  disabled={disabled}
                  onClick={() => inputRef.current?.click()}
                  className="inline-flex h-10 flex-1 items-center justify-center gap-2 rounded-xl border border-dashed border-emerald-300 bg-emerald-50 px-3 text-xs font-extrabold text-emerald-700 transition hover:bg-emerald-100 disabled:cursor-not-allowed disabled:opacity-70"
                >
                  Replace uploaded file
                  <UploadCloud size={15} />
                </button>

                <button
                  type="button"
                  disabled={disabled}
                  onClick={() => onRemove?.(requirement)}
                  className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-red-100 bg-red-50 text-red-600 transition hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-70"
                  title="Remove file"
                >
                  <Trash2 size={15} />
                </button>
              </div>
            </div>
          ) : (
            <button
              type="button"
              disabled={disabled}
              onClick={() => inputRef.current?.click()}
              className="mt-3 flex w-full items-center justify-between rounded-xl border border-dashed border-[#B9C7D6] bg-white px-3 py-3 text-left text-xs font-extrabold text-sibs-primary-1 transition hover:border-sibs-primary-1 disabled:cursor-not-allowed disabled:opacity-70"
            >
              Upload file for this requirement
              <UploadCloud size={16} />
            </button>
          )}

          <input
            ref={inputRef}
            type="file"
            className="hidden"
            accept={ACCEPTED_FILE_TYPES}
            disabled={disabled}
            onChange={handleFileChange}
          />
        </div>
      </div>
    </div>
  );
}

function FilePreviewPanel({ file }) {
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
          Select an uploaded requirement file to preview details here.
        </p>
      </div>
    );
  }

  const FileIcon = getFileIcon(file.fileName);
  const resolvedFileUrl = getResolvedFileUrl(file.fileUrl);
  const isImage =
    resolvedFileUrl &&
    !String(resolvedFileUrl).startsWith("blob:") &&
    (/^image\//i.test(file.fileType || "") ||
      /\.(jpg|jpeg|png|gif|webp)$/i.test(file.fileName || ""));

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
            {file.uploadedAt ? formatDateTime(file.uploadedAt) : "Not saved yet"}
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

function PreEmploymentRequirementsPanel({
  candidateName = "",
  candidateEmail = "",
  files = [],
  selectedFile = null,
  disabled = false,
  saveError = "",
  saveSuccess = "",
  onUpload,
  onRemove,
  onSelectFile,
}) {
  const uploadedMap = useMemo(() => {
    const map = new Map();

    filterOfficialUploadedFiles(files).forEach((file) => {
      const key = normalizeRequirement(file.requirement);
      if (key) map.set(key, file);
    });

    return map;
  }, [files]);

  const majorProgress = useMemo(
    () => calculateProgress(files, MAJOR_REQUIREMENTS),
    [files],
  );

  const totalProgress = useMemo(
    () => calculateProgress(files, ALL_REQUIREMENTS),
    [files],
  );

  return (
    <div className="rounded-xl border border-[#E6ECF2] bg-white p-5 shadow-sm">
      <div className="grid grid-cols-1 gap-5 xl:grid-cols-[minmax(0,1fr)_320px]">
        <div className="min-w-0 space-y-5">
          <section className="rounded-2xl border border-[#D9E2EC] bg-white p-5 shadow-sm">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div className="min-w-0">
                <h3 className="break-words text-lg font-extrabold uppercase text-[#101828]">
                  {candidateName || "Candidate"}
                </h3>

                <p className="mt-1 break-words text-sm font-extrabold uppercase text-sibs-primary-1">
                  {candidateEmail || "No email provided"}
                </p>
              </div>

              <div className="flex shrink-0 flex-wrap gap-2">
                <span className="rounded-full bg-[#F2F6FA] px-3 py-1 text-xs font-extrabold text-[#344054]">
                  Pre-Employment
                </span>

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
                Candidate has fewer than 5 major requirements. After saving,
                this candidate will be moved to{" "}
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

            {saveError && (
              <div className="mt-4 rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm font-bold leading-6 text-red-600">
                {saveError}
              </div>
            )}

            {saveSuccess && (
              <div className="mt-4 rounded-xl border border-emerald-100 bg-emerald-50 px-4 py-3 text-sm font-bold leading-6 text-emerald-700">
                {saveSuccess}
              </div>
            )}
          </section>

          <section className="rounded-2xl border border-[#D9E2EC] bg-white p-5 shadow-sm">
            <h3 className="text-lg font-extrabold text-[#101828]">
              Pre-Employment Requirements
            </h3>

            <div className="mt-5 space-y-6">
              {PRE_EMPLOYMENT_REQUIREMENT_GROUPS.map((group) => {
                const groupProgress = calculateProgress(
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
                          {groupProgress.completed} / {groupProgress.total}
                        </span>
                      </div>

                      {group.badge && (
                        <span
                          className={`inline-flex w-fit rounded-full px-3 py-1 text-xs font-extrabold ${
                            groupProgress.isComplete
                              ? "bg-emerald-50 text-emerald-700"
                              : "bg-amber-50 text-amber-700"
                          }`}
                        >
                          {group.badge}
                        </span>
                      )}
                    </div>

                    <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                      {group.requirements.map((requirement) => {
                        const uploadedFile =
                          uploadedMap.get(normalizeRequirement(requirement)) ||
                          null;

                        return (
                          <RequirementCard
                            key={requirement}
                            requirement={requirement}
                            uploadedFile={uploadedFile}
                            disabled={disabled}
                            onUpload={onUpload}
                            onRemove={onRemove}
                            onSelect={onSelectFile}
                          />
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        </div>

        <aside className="xl:sticky xl:top-0 xl:self-start">
          <FilePreviewPanel file={selectedFile} />
        </aside>
      </div>
    </div>
  );
}

function AssessmentModalDropdown({
  label,
  required = false,
  value,
  options = [],
  placeholder = "Select",
  disabled = false,
  onChange,
}) {
  const dropdownRef = useRef(null);
  const [open, setOpen] = useState(false);

  const selectedLabel = cleanText(value) || placeholder;

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

  function handleSelect(option) {
    onChange?.(option);
    setOpen(false);
  }

  return (
    <div ref={dropdownRef} className={`relative ${open ? "z-[120]" : "z-[1]"}`}>
      <span className="text-xs font-extrabold uppercase tracking-wide text-sibs-primary-1">
        {label} {required && <span className="text-red-500">*</span>}
      </span>

      <button
        type="button"
        disabled={disabled}
        onClick={() => setOpen((previous) => !previous)}
        className={`mt-2 flex h-11 w-full items-center justify-between gap-3 rounded-xl border bg-white px-4 text-left text-sm font-extrabold text-[#344054] shadow-sm outline-none transition ${
          open
            ? "border-sibs-primary-1 ring-4 ring-sibs-primary-1/10"
            : "border-[#D6DEE8] hover:border-sibs-primary-1"
        } ${
          disabled
            ? "cursor-not-allowed bg-slate-100 text-slate-400 opacity-70"
            : ""
        }`}
      >
        <span className="min-w-0 flex-1 truncate">{selectedLabel}</span>

        <ChevronDown
          size={18}
          className={`shrink-0 text-sibs-primary-1 transition-transform duration-200 ${
            open ? "rotate-180" : ""
          }`}
        />
      </button>

      {open && !disabled && (
        <div className="absolute left-0 right-0 top-[calc(100%+8px)] z-[130] overflow-hidden rounded-xl border border-[#D9E2EC] bg-white shadow-[0_18px_45px_rgba(15,23,42,0.16)]">
          <div className="max-h-64 overflow-y-auto py-1">
            {options.map((option) => {
              const active = String(option) === String(value);

              return (
                <button
                  key={option}
                  type="button"
                  onClick={() => handleSelect(option)}
                  className={`block w-full px-4 py-3.5 text-left text-sm font-extrabold transition ${
                    active
                      ? "bg-[#EAF4FF] text-sibs-primary-1"
                      : "bg-white text-[#344054] hover:bg-[#F5F9FF] hover:text-sibs-primary-1"
                  }`}
                >
                  <span className="block min-w-0 truncate">{option}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

function UpdateAssessmentModal({
  open,
  candidate,
  candidateId,
  onClose,
  onSaved,
}) {
  const [assessmentStatus, setAssessmentStatus] = useState("Not Take");
  const [assessmentResult, setAssessmentResult] = useState("");
  const [assessmentRemarks, setAssessmentRemarks] = useState("");
  const [assessmentFile, setAssessmentFile] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const assessmentFileInputRef = useRef(null);

  useEffect(() => {
    if (!open) return;

    const initialStatus =
      candidate?.assessmentStatus ||
      candidate?.assessment_status ||
      "Not Take";

    setAssessmentStatus(initialStatus);
    setAssessmentResult(
      candidate?.assessmentResult || candidate?.assessment_result || "",
    );
    setAssessmentRemarks(
      candidate?.assessmentRemarks || candidate?.assessment_remarks || "",
    );
    setAssessmentFile(null);
    setErrorMessage("");
  }, [
    open,
    candidate?.id,
    candidate?.candidateId,
    candidate?.assessmentStatus,
    candidate?.assessment_status,
    candidate?.assessmentResult,
    candidate?.assessment_result,
    candidate?.assessmentRemarks,
    candidate?.assessment_remarks,
  ]);

  useEffect(() => {
    if (assessmentStatus !== "Taken") {
      setAssessmentFile(null);

      if (assessmentFileInputRef.current) {
        assessmentFileInputRef.current.value = "";
      }
    }
  }, [assessmentStatus]);

  if (!open) return null;

  const resolvedCandidateId = cleanText(candidateId);

  const assessmentEmailSent = Boolean(
    candidate?.assessmentEmailSent || candidate?.assessment_email_sent,
  );

  const assessmentEmailSentAt =
    candidate?.assessmentEmailSentAt ||
    candidate?.assessment_email_sent_at ||
    "—";

  const assessmentLink = buildAssessmentLink
    ? buildAssessmentLink(candidate || {})
    : "";

  const displayName =
    candidate?.name ||
    candidate?.candidateName ||
    candidate?.candidate_name ||
    "Candidate";

  const displayEmail = candidate?.email || "No email provided";

  async function handleSubmit(event) {
    event.preventDefault();
    event.stopPropagation();

    if (!resolvedCandidateId) {
      setErrorMessage("Candidate Pipeline ID is missing.");
      return;
    }

    if (assessmentStatus === "Taken" && !cleanText(assessmentResult)) {
      setErrorMessage("Assessment result is required when status is Taken.");
      return;
    }

    setIsSaving(true);
    setErrorMessage("");

    try {
      const formData = new FormData();

      formData.append("assessmentStatus", assessmentStatus);
      formData.append("assessment_status", assessmentStatus);
      formData.append(
        "assessmentResult",
        assessmentStatus === "Taken" ? assessmentResult : "",
      );
      formData.append(
        "assessment_result",
        assessmentStatus === "Taken" ? assessmentResult : "",
      );
      formData.append("assessmentRemarks", assessmentRemarks);
      formData.append("assessment_remarks", assessmentRemarks);

      if (assessmentFile) {
        formData.append("assessmentFile", assessmentFile, assessmentFile.name);
      }

      const response = await api.post(
        `/api/candidate-pipeline/${encodeURIComponent(
          resolvedCandidateId,
        )}/assessment`,
        formData,
        {
          withCredentials: true,
          headers: {
            "Content-Type": "multipart/form-data",
          },
        },
      );

      const payload = response?.data || {};

      if (payload?.success === false) {
        throw new Error(payload?.message || "Failed to save assessment.");
      }

      const apiCandidate = getCandidateFromApiPayload(payload) || {};

      const nextCandidate = {
        ...(candidate || {}),
        ...apiCandidate,
        assessmentStatus:
          apiCandidate.assessmentStatus ||
          apiCandidate.assessment_status ||
          assessmentStatus,
        assessment_status:
          apiCandidate.assessment_status ||
          apiCandidate.assessmentStatus ||
          assessmentStatus,
        assessmentResult:
          apiCandidate.assessmentResult ||
          apiCandidate.assessment_result ||
          (assessmentStatus === "Taken" ? assessmentResult : ""),
        assessment_result:
          apiCandidate.assessment_result ||
          apiCandidate.assessmentResult ||
          (assessmentStatus === "Taken" ? assessmentResult : ""),
        assessmentRemarks:
          apiCandidate.assessmentRemarks ||
          apiCandidate.assessment_remarks ||
          assessmentRemarks,
        assessment_remarks:
          apiCandidate.assessment_remarks ||
          apiCandidate.assessmentRemarks ||
          assessmentRemarks,
      };

      onSaved?.(nextCandidate, payload);
    } catch (error) {
      setErrorMessage(
        getApiErrorMessage(error, "Failed to save assessment."),
      );
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-[11000] flex h-dvh items-center justify-center bg-black/45 px-4 py-4"
      onClick={onClose}
    >
      <form
        onSubmit={handleSubmit}
        onClick={(event) => event.stopPropagation()}
        className="flex max-h-[92dvh] w-full max-w-[620px] flex-col overflow-hidden rounded-2xl bg-white shadow-2xl"
      >
        <div className="flex items-start justify-between gap-4 border-b border-[#E6ECF2] bg-white px-5 py-5 sm:px-6">
          <div className="min-w-0">
            <h2 className="text-xl font-extrabold leading-tight text-sibs-primary-1">
              Online Assessment
            </h2>

            <p className="mt-2 max-w-[500px] text-sm font-semibold leading-5 text-sibs-primary-1/90">
              Update status, tag result, and attach assessment proof after the
              candidate takes the assessment.
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={isSaving}
            className="shrink-0 rounded-full p-2 text-[#98A2B3] transition hover:bg-gray-100 hover:text-[#475467] disabled:cursor-not-allowed disabled:opacity-60"
            aria-label="Close assessment modal"
          >
            <X size={20} />
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto bg-white px-5 py-5 sm:px-6">
          <div className="rounded-2xl border border-[#D9E2EC] bg-[#F8FAFC] p-4">
            <h3 className="break-words text-lg font-extrabold text-sibs-primary-1">
              {displayName}
            </h3>

            <p className="mt-1 break-words text-sm font-extrabold text-sibs-primary-1/80">
              {displayEmail}
            </p>

            <div className="mt-4 flex flex-wrap gap-2">
              <span className="inline-flex rounded-full border border-orange-100 bg-orange-50 px-3 py-1 text-xs font-extrabold text-orange-600">
                Assessment: {assessmentStatus || "Not Take"}
              </span>

              <span className="inline-flex rounded-full border border-[#E6ECF2] bg-white px-3 py-1 text-xs font-extrabold text-[#475467]">
                {assessmentResult || "No Result"}
              </span>
            </div>
          </div>

          <div className="mt-5 rounded-2xl border border-[#D9E2EC] bg-[#F8FAFC] p-4">
            <div className="rounded-2xl bg-white px-4">
              <div className="grid grid-cols-[150px_minmax(0,1fr)] gap-4 border-b border-[#E6ECF2] py-4">
                <p className="text-xs font-extrabold uppercase tracking-wide text-sibs-primary-1">
                  Assessment Email Sent
                </p>

                <p className="break-words text-right text-sm font-extrabold text-[#344054]">
                  {assessmentEmailSent ? "Yes" : "No"}
                </p>
              </div>

              <div className="grid grid-cols-[150px_minmax(0,1fr)] gap-4 border-b border-[#E6ECF2] py-4">
                <p className="text-xs font-extrabold uppercase tracking-wide text-sibs-primary-1">
                  Email Sent At
                </p>

                <p className="break-words text-right text-sm font-extrabold text-[#344054]">
                  {assessmentEmailSentAt || "—"}
                </p>
              </div>

              <div className="grid grid-cols-[150px_minmax(0,1fr)] gap-4 py-4">
                <p className="text-xs font-extrabold uppercase tracking-wide text-sibs-primary-1">
                  Assessment Link
                </p>

                {assessmentLink ? (
                  <a
                    href={assessmentLink}
                    target="_blank"
                    rel="noreferrer"
                    title={assessmentLink}
                    className="min-w-0 break-words text-right text-sm font-extrabold leading-5 text-sibs-primary-1 underline decoration-sibs-primary-1/30 underline-offset-2"
                  >
                    {assessmentLink}
                  </a>
                ) : (
                  <p className="text-right text-sm font-extrabold text-[#344054]">
                    —
                  </p>
                )}
              </div>
            </div>
          </div>

          <div className="mt-5 space-y-4">
            <AssessmentModalDropdown
              label="Assessment Status"
              required
              value={assessmentStatus}
              options={ASSESSMENT_STATUS_OPTIONS}
              disabled={isSaving}
              onChange={(value) => {
                setAssessmentStatus(value);

                if (value !== "Taken") {
                  setAssessmentResult("");
                  setAssessmentFile(null);

                  if (assessmentFileInputRef.current) {
                    assessmentFileInputRef.current.value = "";
                  }
                }
              }}
            />

            {assessmentStatus === "Taken" && (
              <>
                <AssessmentModalDropdown
                  label="Assessment Result"
                  required
                  value={assessmentResult}
                  options={ASSESSMENT_RESULT_OPTIONS}
                  placeholder="Select result"
                  disabled={isSaving}
                  onChange={setAssessmentResult}
                />

                <label className="block">
                  <span className="text-xs font-extrabold uppercase tracking-wide text-sibs-primary-1">
                    Assessment Attachment
                  </span>

                  <input
                    ref={assessmentFileInputRef}
                    type="file"
                    disabled={isSaving}
                    accept=".pdf,.png,.jpg,.jpeg,.webp"
                    onChange={(event) =>
                      setAssessmentFile(event.target.files?.[0] || null)
                    }
                    className="hidden"
                  />

                  <button
                    type="button"
                    disabled={isSaving}
                    onClick={() => assessmentFileInputRef.current?.click()}
                    className="mt-2 flex min-h-[170px] w-full flex-col items-center justify-center rounded-xl border border-dashed border-sibs-primary-1 bg-[#EEF6FF] px-5 py-6 text-center transition hover:bg-[#E7F1FF] disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    <span className="flex h-14 w-14 items-center justify-center rounded-full bg-white text-sibs-primary-1 shadow-sm">
                      <UploadCloud size={26} strokeWidth={2.4} />
                    </span>

                    <span className="mt-4 max-w-full break-words text-base font-extrabold text-sibs-primary-1">
                      {assessmentFile ? assessmentFile.name : "Choose assessment file"}
                    </span>

                    <span className="mt-1 text-sm font-semibold text-sibs-primary-1">
                      Accepted: PDF, PNG, JPG, JPEG, WEBP
                    </span>

                    {assessmentFile && (
                      <span className="mt-3 rounded-full border border-blue-100 bg-white px-3 py-1 text-xs font-extrabold text-sibs-primary-1">
                        {(assessmentFile.size / 1024).toFixed(1)} KB
                      </span>
                    )}
                  </button>
                </label>
              </>
            )}

            <label className="block">
              <span className="text-xs font-extrabold uppercase tracking-wide text-sibs-primary-1">
                Assessment Remarks
              </span>

              <textarea
                value={assessmentRemarks}
                disabled={isSaving}
                onChange={(event) => setAssessmentRemarks(event.target.value)}
                rows={5}
                placeholder="Example: Candidate completed assessment and passed required score."
                className="mt-2 w-full resize-none rounded-xl border border-[#D6DEE8] bg-white px-4 py-3 text-sm font-semibold leading-6 text-[#344054] shadow-sm outline-none transition placeholder:text-sibs-tertiary-5 focus:border-sibs-primary-1 focus:ring-4 focus:ring-sibs-primary-1/10 disabled:cursor-not-allowed disabled:bg-slate-100"
              />
            </label>

            {errorMessage && (
              <div className="rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm font-bold leading-6 text-red-600">
                {errorMessage}
              </div>
            )}
          </div>
        </div>

        <div className="flex flex-col-reverse gap-2 border-t border-[#E6ECF2] bg-white px-5 py-4 sm:flex-row sm:justify-end sm:px-6">
          <button
            type="button"
            onClick={onClose}
            disabled={isSaving}
            className="inline-flex h-11 min-w-[92px] items-center justify-center rounded-xl border border-[#D6DEE8] bg-white px-5 text-sm font-extrabold text-[#475467] transition hover:bg-[#F8FAFC] disabled:cursor-not-allowed disabled:opacity-60"
          >
            Cancel
          </button>

          <button
            type="submit"
            disabled={isSaving}
            className="inline-flex h-11 min-w-[160px] items-center justify-center gap-2 rounded-xl bg-sibs-primary-1 px-5 text-sm font-extrabold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSaving ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              <ClipboardCheck size={16} />
            )}
            {isSaving ? "Saving..." : "Save Assessment"}
          </button>
        </div>
      </form>
    </div>
  );
}

const CandidatePipelineModal = ({
  open,
  candidate,
  onClose,
  onUpdatePrfStatus,
  onOpenScheduleModal,
  onOpenMoveModal,
  onOpenAssessmentModal,
  onOpenDropOffModal,
  onCompleteInterview,
  onSendAssessmentEmail,
  onCancelInterview,
  onSendOfferEmail,
  onOfferDecision,
}) => {
  const [showTalentPoolDetails, setShowTalentPoolDetails] = useState(false);
  const [interviewNotesDraft, setInterviewNotesDraft] = useState("");
  const [candidateFilesById, setCandidateFilesById] = useState({});
  const [localCandidate, setLocalCandidate] = useState(null);
  const [selectedNhoFile, setSelectedNhoFile] = useState(null);
  const [isLoadingNhoFiles, setIsLoadingNhoFiles] = useState(false);
  const [isSavingNhoFiles, setIsSavingNhoFiles] = useState(false);
  const [isSendingAssessmentEmail, setIsSendingAssessmentEmail] =
    useState(false);
  const [showAssessmentModal, setShowAssessmentModal] = useState(false);
  const [nhoFilesError, setNhoFilesError] = useState("");
  const [nhoFilesSuccess, setNhoFilesSuccess] = useState("");

  const [statusModal, setStatusModal] = useState({
    open: false,
    type: "success",
    title: "",
    message: "",
    closeParentOnClose: false,
  });

  const { handleStartInterview, handleScheduleNhoAuto } =
    useCandidatePipeline();

  const navigate = useNavigate();

  function showStatusModal({
    type = "success",
    title = "",
    message = "",
    closeParentOnClose = false,
  }) {
    setStatusModal({
      open: true,
      type,
      title,
      message,
      closeParentOnClose,
    });
  }

  function closeStatusModal() {
    const shouldCloseParent = statusModal.closeParentOnClose;

    setStatusModal((previous) => ({
      ...previous,
      open: false,
      closeParentOnClose: false,
    }));

    if (shouldCloseParent) {
      setTimeout(() => {
        onClose?.();
      }, 150);
    }
  }

  useEffect(() => {
    setShowTalentPoolDetails(false);
    setInterviewNotesDraft(candidate?.interviewNotes || "");
    setLocalCandidate(candidate || null);
    setSelectedNhoFile(null);
    setIsSendingAssessmentEmail(false);
    setShowAssessmentModal(false);
    setNhoFilesError("");
    setNhoFilesSuccess("");
    setStatusModal({
      open: false,
      type: "success",
      title: "",
      message: "",
      closeParentOnClose: false,
    });
  }, [
    candidate?.id,
    candidate?.candidateId,
    candidate?.candidateApplicationId,
    candidate?.prfStatus,
    candidate?.prf_status,
    candidate?.currentStage,
    open,
  ]);

  const activeCandidate = useMemo(() => {
    return {
      ...(candidate || {}),
      ...(localCandidate || {}),
    };
  }, [candidate, localCandidate]);

  const activePrfStatus = normalizePrfStatus(
    activeCandidate.prfStatus || activeCandidate.prf_status,
  );

  const candidateUploadKey =
    activeCandidate?.candidateId ||
    activeCandidate?.candidateApplicationId ||
    activeCandidate?.id;

  const candidateNhoUploadId = getCandidateRecordId(activeCandidate);

  const candidateFiles = useMemo(() => {
    if (!candidateUploadKey) return [];
    return candidateFilesById[candidateUploadKey] || [];
  }, [candidateFilesById, candidateUploadKey]);

  const sortedCandidateFiles = useMemo(
    () => sortUploadedFiles(candidateFiles),
    [candidateFiles],
  );

  const majorNhoProgress = useMemo(
    () => calculateProgress(sortedCandidateFiles, MAJOR_REQUIREMENTS),
    [sortedCandidateFiles],
  );

  const totalNhoProgress = useMemo(
    () => calculateProgress(sortedCandidateFiles, ALL_REQUIREMENTS),
    [sortedCandidateFiles],
  );

  useEffect(() => {
    if (!sortedCandidateFiles.length) {
      setSelectedNhoFile(null);
      return;
    }

    setSelectedNhoFile((current) => {
      if (
        current &&
        sortedCandidateFiles.some((file) => file.id === current.id)
      ) {
        return current;
      }

      return sortedCandidateFiles[0] || null;
    });
  }, [sortedCandidateFiles]);

  const currentStage =
    activeCandidate?.currentStage ||
    activeCandidate?.currentPipelineStage ||
    activeCandidate?.pipelineStage ||
    activeCandidate?.stage ||
    "";

  const nextStage = getNextStage(currentStage);

  const isLeadStage = false;
  const isInitialScreening = currentStage === "Initial Screening";
  const isOnlineAssessment = currentStage === "Online Assessment";
  const isInterviewScheduled = currentStage === "Interview Scheduled";
  const isInterviewed = currentStage === "Interviewed";
  const isOffered = currentStage === "Offered";
  const isAccepted =
    currentStage === "Accepted" || currentStage === "Accepted (For NHO)";
  const forNHO = currentStage === "For NHO";
  const isIncompleteOnboarding = currentStage === INCOMPLETE_ONBOARDING_STAGE;
  const isOnboarding = currentStage === ONBOARDING_STAGE;

  const canShowNhoUploads = forNHO || isIncompleteOnboarding || isOnboarding;

  useEffect(() => {
    let isActive = true;

    async function loadSavedNhoFiles() {
      if (!open || !candidateNhoUploadId || !canShowNhoUploads) return;

      setIsLoadingNhoFiles(true);
      setNhoFilesError("");
      setNhoFilesSuccess("");

      try {
        const response = await api.get(
          `/api/candidate-pipeline/${encodeURIComponent(
            candidateNhoUploadId,
          )}/nho/files`,
          {
            withCredentials: true,
            params: {
              _t: Date.now(),
            },
          },
        );

        if (!isActive) return;

        const responseFiles = getFilesFromApiPayload(response);
        const normalizedFiles = dedupeFiles(responseFiles, candidateNhoUploadId);

        setCandidateFilesById((previous) => ({
          ...previous,
          [candidateUploadKey]: normalizedFiles,
        }));

        const responseCandidate = getCandidateFromApiPayload(response);

        if (responseCandidate && typeof responseCandidate === "object") {
          setLocalCandidate((previous) => ({
            ...(previous || activeCandidate),
            ...responseCandidate,
          }));
        }
      } catch (error) {
        if (!isActive) return;

        const message = getApiErrorMessage(
          error,
          "Unable to load saved pre-employment files.",
        );

        setNhoFilesError(message);

        showStatusModal({
          type: "error",
          title: "Unable to Load Files",
          message,
        });
      } finally {
        if (isActive) {
          setIsLoadingNhoFiles(false);
        }
      }
    }

    loadSavedNhoFiles();

    return () => {
      isActive = false;
    };
  }, [open, candidateNhoUploadId, candidateUploadKey, canShowNhoUploads]);

  const nhoScheduleDetails = useMemo(() => {
    const schedule = activeCandidate?.nhoSchedule || {};

    return {
      startDate:
        schedule.startDate ||
        schedule.date ||
        activeCandidate?.nhoStartDate ||
        activeCandidate?.nhoDate ||
        "",
      account:
        schedule.account ||
        activeCandidate?.nhoAccount ||
        activeCandidate?.offerDetails?.account ||
        activeCandidate?.roleAccount ||
        "—",
      trainer:
        schedule.trainer ||
        activeCandidate?.nhoTrainer ||
        activeCandidate?.trainer ||
        "—",
      updatedShiftSchedule:
        schedule.updatedShiftSchedule ||
        schedule.shiftSchedule ||
        activeCandidate?.updatedShiftSchedule ||
        activeCandidate?.nhoShiftSchedule ||
        "—",
      endorsementStatus:
        schedule.endorsementStatus ||
        activeCandidate?.endorsementStatus ||
        activeCandidate?.nhoEndorsementStatus ||
        "Pending",
      location:
        schedule.location ||
        activeCandidate?.nhoLocation ||
        activeCandidate?.workLocation ||
        "—",
      remarks: schedule.remarks || activeCandidate?.nhoRemarks || "",
      status:
        schedule.status ||
        activeCandidate?.nhoStatus ||
        (schedule.startDate ||
        schedule.date ||
        activeCandidate?.nhoStartDate ||
        activeCandidate?.nhoDate
          ? "Scheduled"
          : "Not Scheduled"),
    };
  }, [activeCandidate]);

  const hasNhoSchedule = useMemo(() => {
    return Boolean(
      nhoScheduleDetails.startDate && nhoScheduleDetails.startDate !== "—",
    );
  }, [nhoScheduleDetails]);

  const candidateHasSchedule = hasInterviewSchedule(activeCandidate);
  const modalStatus = getDisplayInterviewStatus(activeCandidate);
  const isInterviewInProgress =
    isInterviewScheduled && modalStatus === "Interview in Progress";

  function syncCandidateAfterAction(nextCandidate = {}, detail = {}) {
    const mergedCandidate = {
      ...activeCandidate,
      ...nextCandidate,
    };

    setLocalCandidate(mergedCandidate);

    window.dispatchEvent(
      new CustomEvent("ta-pipeline-candidates-updated", {
        detail: {
          candidate: mergedCandidate,
          ...detail,
        },
      }),
    );

    return mergedCandidate;
  }

  async function handleSendAssessmentEmailClick(event) {
    event.preventDefault();
    event.stopPropagation();

    if (!candidateNhoUploadId) {
      showStatusModal({
        type: "error",
        title: "Unable to Send",
        message: "Candidate Pipeline ID is missing.",
      });
      return;
    }

    setIsSendingAssessmentEmail(true);

    try {
      const response = await api.post(
        `/api/candidate-pipeline/${encodeURIComponent(
          candidateNhoUploadId,
        )}/assessment/send-email`,
        {},
        {
          withCredentials: true,
        },
      );

      const payload = response?.data || {};

      if (payload?.success === false) {
        throw new Error(
          payload?.message || "Failed to send assessment email.",
        );
      }

      const apiCandidate = getCandidateFromApiPayload(payload) || {};

      const nextCandidate = syncCandidateAfterAction({
        ...apiCandidate,
        assessmentEmailSent:
          apiCandidate.assessmentEmailSent ??
          apiCandidate.assessment_email_sent ??
          true,
        assessment_email_sent:
          apiCandidate.assessment_email_sent ??
          apiCandidate.assessmentEmailSent ??
          true,
        assessmentEmailSentAt:
          apiCandidate.assessmentEmailSentAt ||
          apiCandidate.assessment_email_sent_at ||
          new Date().toISOString(),
        assessment_email_sent_at:
          apiCandidate.assessment_email_sent_at ||
          apiCandidate.assessmentEmailSentAt ||
          new Date().toISOString(),
      });

      showStatusModal({
        type: "success",
        title: "Assessment Email Sent",
        message:
          payload?.message ||
          "Assessment email was marked as sent successfully.",
      });
    } catch (error) {
      showStatusModal({
        type: "error",
        title: "Send Assessment Email Failed",
        message: getApiErrorMessage(
          error,
          "Failed to send assessment email.",
        ),
      });
    } finally {
      setIsSendingAssessmentEmail(false);
    }
  }

  function handleOpenAssessmentModalClick(event) {
    event.preventDefault();
    event.stopPropagation();
    setShowAssessmentModal(true);
  }

  function handleAssessmentSaved(nextCandidate, payload = {}) {
    const mergedCandidate = syncCandidateAfterAction(nextCandidate || {});

    setShowAssessmentModal(false);

    if (typeof onOpenAssessmentModal === "function") {
      try {
        window.dispatchEvent(
          new CustomEvent("ta-assessment-updated", {
            detail: {
              candidate: mergedCandidate,
              payload,
            },
          }),
        );
      } catch {
        // Ignore event dispatch warning.
      }
    }

    showStatusModal({
      type: "success",
      title: "Assessment Saved",
      message: payload?.message || "Assessment details were saved successfully.",
    });
  }

  async function handleLocalPrfStatusUpdate(firstArg, secondArg) {
    const nextPrfStatus =
      secondArg ||
      firstArg?.prfStatus ||
      firstArg?.prf_status ||
      firstArg ||
      "Review";

    const normalizedStatus = normalizePrfStatus(nextPrfStatus);

    const currentTimeline = Array.isArray(activeCandidate.timeline)
      ? activeCandidate.timeline
      : [];

    const movementReason =
      normalizedStatus === "Matched"
        ? "PRF status changed to Matched. Candidate is ready to move to Online Assessment."
        : `PRF status set to ${normalizedStatus}.`;

    const nextCandidate = {
      ...activeCandidate,
      ...(typeof firstArg === "object" && firstArg !== null ? firstArg : {}),
      prfStatus: normalizedStatus,
      prf_status: normalizedStatus,
      prfReviewed: normalizedStatus === "Matched",
      prf_reviewed: normalizedStatus === "Matched",
      prfReviewedAt:
        normalizedStatus === "Matched"
          ? new Date().toISOString()
          : activeCandidate.prfReviewedAt,
      prf_reviewed_at:
        normalizedStatus === "Matched"
          ? new Date().toISOString()
          : activeCandidate.prf_reviewed_at,
      currentStage: "Initial Screening",
      currentPipelineStage: "Initial Screening",
      pipelineStage: "Initial Screening",
      stage: "Initial Screening",
      reasonForMovement: movementReason,
      timeline: [
        ...currentTimeline,
        {
          stage: "Initial Screening",
          owner: "Current User",
          source: "PRF Review",
          timestamp: getCurrentTimestamp(),
          reason: movementReason,
          remarks: `PRF Status: ${normalizedStatus}`,
        },
      ],
    };

    setLocalCandidate(nextCandidate);

    try {
      const response = await onUpdatePrfStatus?.(
        nextCandidate,
        normalizedStatus,
      );

      if (response === null || response?.success === false) {
        setLocalCandidate(activeCandidate);
      }

      return response;
    } catch (error) {
      console.error("Update PRF status from modal error:", error);
      setLocalCandidate(activeCandidate);
      return null;
    }
  }

  function handleMoveToNextStage() {
    const candidateForMove = {
      ...activeCandidate,
      prfStatus: activePrfStatus,
      prf_status: activePrfStatus,
      prfReviewed: activePrfStatus === "Matched",
      prf_reviewed: activePrfStatus === "Matched",
      currentStage: activeCandidate.currentStage || "Initial Screening",
      currentPipelineStage:
        activeCandidate.currentPipelineStage ||
        activeCandidate.currentStage ||
        "Initial Screening",
      pipelineStage:
        activeCandidate.pipelineStage ||
        activeCandidate.currentStage ||
        "Initial Screening",
      stage: activeCandidate.stage || activeCandidate.currentStage,
    };

    onOpenMoveModal?.(candidateForMove);
  }

  function handleRequirementUpload(requirement, filePayload) {
    if (!candidateUploadKey) return;

    setNhoFilesError("");
    setNhoFilesSuccess("");

    setCandidateFilesById((previous) => {
      const currentFiles = previous[candidateUploadKey] || [];
      const requirementKey = normalizeRequirement(requirement);

      const withoutCurrentRequirement = currentFiles.filter(
        (file) => normalizeRequirement(file.requirement) !== requirementKey,
      );

      const nextFile = normalizeUploadedFile(
        {
          ...filePayload,
          requirement,
        },
        candidateNhoUploadId,
      );

      const nextFiles = dedupeFiles(
        [nextFile, ...withoutCurrentRequirement],
        candidateNhoUploadId,
      );

      setSelectedNhoFile(nextFile);

      return {
        ...previous,
        [candidateUploadKey]: nextFiles,
      };
    });
  }

  function handleRequirementRemove(requirement) {
    if (!candidateUploadKey) return;

    setNhoFilesError("");
    setNhoFilesSuccess("");

    setCandidateFilesById((previous) => {
      const currentFiles = previous[candidateUploadKey] || [];
      const requirementKey = normalizeRequirement(requirement);

      const nextFiles = currentFiles.filter(
        (file) => normalizeRequirement(file.requirement) !== requirementKey,
      );

      setSelectedNhoFile((current) => {
        if (normalizeRequirement(current?.requirement) === requirementKey) {
          return nextFiles[0] || null;
        }

        return current;
      });

      return {
        ...previous,
        [candidateUploadKey]: nextFiles,
      };
    });
  }

  async function moveCandidateToStage(
    targetStage,
    savedFiles,
    savedMajorProgress,
  ) {
    if (!candidateNhoUploadId || !targetStage) return null;

    const reason =
      targetStage === INCOMPLETE_ONBOARDING_STAGE
        ? "Candidate has fewer than 5 major pre-employment requirements."
        : "Candidate completed the 5 major pre-employment requirements and is ready for onboarding.";

    const response = await api.post(
      `/api/candidate-pipeline/${encodeURIComponent(candidateNhoUploadId)}/move`,
      {
        targetStage,
        nextStage: targetStage,
        stage: targetStage,
        requestedStage: targetStage,
        reason,
        reasonForMovement: reason,
        remarks:
          targetStage === INCOMPLETE_ONBOARDING_STAGE
            ? "Candidate saved with incomplete major requirements."
            : "Candidate completed all major requirements.",
      },
      {
        withCredentials: true,
      },
    );

    const payload = response?.data || {};

    if (payload?.success === false) {
      throw new Error(payload?.message || `Failed to move to ${targetStage}.`);
    }

    const apiCandidate = getCandidateFromApiPayload(payload) || {};

    const nextCandidate = {
      ...activeCandidate,
      ...apiCandidate,
      currentStage: targetStage,
      currentPipelineStage: targetStage,
      pipelineStage: targetStage,
      stage: targetStage,
      reasonForMovement: reason,
      nhoFiles: savedFiles,
      nho_files: savedFiles,
      preEmploymentFiles: savedFiles,
      pre_employment_files: savedFiles,
      uploadedFiles: savedFiles,
      files: savedFiles,
      majorNhoUploadProgress: savedMajorProgress,
      major_nho_upload_progress: savedMajorProgress,
    };

    setLocalCandidate(nextCandidate);

    window.dispatchEvent(
      new CustomEvent("ta-pipeline-candidates-updated", {
        detail: {
          candidate: nextCandidate,
          files: savedFiles,
          majorProgress: savedMajorProgress,
          routedStage: targetStage,
        },
      }),
    );

    window.dispatchEvent(
      new CustomEvent("ta-talent-pool-updated", {
        detail: {
          candidate: nextCandidate,
          files: savedFiles,
          majorProgress: savedMajorProgress,
          routedStage: targetStage,
        },
      }),
    );

    if (targetStage === ONBOARDING_STAGE) {
      window.dispatchEvent(
        new CustomEvent("ta-onboarding-updated", {
          detail: {
            candidate: nextCandidate,
            files: savedFiles,
            majorProgress: savedMajorProgress,
          },
        }),
      );
    }

    return nextCandidate;
  }

  async function handleSavePreEmploymentRequirements() {
    if (!candidateNhoUploadId) {
      const message = "Candidate Pipeline ID is missing.";

      setNhoFilesError(message);

      showStatusModal({
        type: "error",
        title: "Unable to Save",
        message,
      });

      return;
    }

    const officialFiles = filterOfficialUploadedFiles(
      sortedCandidateFiles,
      candidateNhoUploadId,
    );

    const currentMajorProgress = calculateProgress(
      officialFiles,
      MAJOR_REQUIREMENTS,
    );

    const currentTotalProgress = calculateProgress(
      officialFiles,
      ALL_REQUIREMENTS,
    );

    setIsSavingNhoFiles(true);
    setNhoFilesError("");
    setNhoFilesSuccess("");

    try {
      const formData = new FormData();

      const filePayloads = officialFiles.map((file) => {
        const hasNewFile = isRawBrowserFile(file.rawFile);

        if (hasNewFile) {
          formData.append("nhoFiles", file.rawFile, file.fileName);
        }

        return {
          id: file.id,
          requirement: file.requirement,
          fileName: file.fileName,
          savedFileName: file.savedFileName,
          filename: file.filename,
          fileUrl: hasNewFile ? "" : file.fileUrl,
          filePath: file.filePath,
          storedPath: file.storedPath,
          fileType: file.fileType,
          fileSize: file.fileSize,
          uploadedAt: file.uploadedAt,
          uploadedBy: file.uploadedBy,
          applicantFolderName: file.applicantFolderName,
          hasNewFile,
        };
      });

      formData.append("filePayloads", JSON.stringify(filePayloads));
      formData.append("completed", String(currentTotalProgress.completed));
      formData.append("total", String(currentTotalProgress.total));
      formData.append("percent", String(currentTotalProgress.percent));
      formData.append("majorCompleted", String(currentMajorProgress.completed));
      formData.append("majorTotal", String(currentMajorProgress.total));
      formData.append("majorPercent", String(currentMajorProgress.percent));
      formData.append("majorComplete", String(currentMajorProgress.isComplete));
      formData.append("previousEmploymentEnabled", "true");

      const saveResponse = await api.post(
        `/api/candidate-pipeline/${encodeURIComponent(
          candidateNhoUploadId,
        )}/nho/files`,
        formData,
        {
          withCredentials: true,
          headers: {
            "Content-Type": "multipart/form-data",
          },
        },
      );

      const savePayload = saveResponse?.data || {};

      if (savePayload?.success === false) {
        throw new Error(savePayload?.message || "Failed to save uploads.");
      }

      const savedFiles = dedupeFiles(
        getFilesFromApiPayload(savePayload).length
          ? getFilesFromApiPayload(savePayload)
          : officialFiles,
        candidateNhoUploadId,
      );

      const savedMajorProgress = calculateProgress(
        savedFiles,
        MAJOR_REQUIREMENTS,
      );

      const savedTotalProgress = calculateProgress(savedFiles, ALL_REQUIREMENTS);

      setCandidateFilesById((previous) => ({
        ...previous,
        [candidateUploadKey]: savedFiles,
      }));

      setSelectedNhoFile(savedFiles[0] || null);

      const saveCandidate = getCandidateFromApiPayload(savePayload);

      if (saveCandidate && typeof saveCandidate === "object") {
        setLocalCandidate((previous) => ({
          ...(previous || activeCandidate),
          ...saveCandidate,
          nhoFiles: savedFiles,
          nho_files: savedFiles,
          majorNhoUploadProgress: savedMajorProgress,
        }));
      }

      let routedStage = "";

      if (!savedMajorProgress.isComplete) {
        routedStage = INCOMPLETE_ONBOARDING_STAGE;

        await moveCandidateToStage(
          INCOMPLETE_ONBOARDING_STAGE,
          savedFiles,
          savedMajorProgress,
        );
      }

      const successMessage =
        routedStage === INCOMPLETE_ONBOARDING_STAGE
          ? `Saved successfully. Candidate has fewer than 5 major requirements and was moved to Talent Pool under ${INCOMPLETE_ONBOARDING_STAGE}.`
          : `Saved successfully. ${savedMajorProgress.completed} of ${savedMajorProgress.total} major requirements completed. ${savedTotalProgress.completed} of ${savedTotalProgress.total} total requirements completed.`;

      setNhoFilesSuccess(successMessage);

      showStatusModal({
        type: "success",
        title:
          routedStage === INCOMPLETE_ONBOARDING_STAGE
            ? "Moved to Talent Pool"
            : "Requirements Saved",
        message:
          routedStage === INCOMPLETE_ONBOARDING_STAGE
            ? `Saved successfully. Candidate has fewer than 5 major requirements and was moved to Talent Pool under ${INCOMPLETE_ONBOARDING_STAGE}.`
            : successMessage,
        closeParentOnClose: routedStage === INCOMPLETE_ONBOARDING_STAGE,
      });

      window.dispatchEvent(
        new CustomEvent("ta-pipeline-candidates-updated", {
          detail: {
            candidate: saveCandidate || activeCandidate,
            files: savedFiles,
            majorProgress: savedMajorProgress,
            routedStage,
          },
        }),
      );

      window.dispatchEvent(
        new CustomEvent("ta-talent-pool-updated", {
          detail: {
            candidate: saveCandidate || activeCandidate,
            files: savedFiles,
            majorProgress: savedMajorProgress,
            routedStage,
          },
        }),
      );
    } catch (error) {
      const message = getApiErrorMessage(
        error,
        "Failed to save pre-employment files.",
      );

      setNhoFilesError(message);

      showStatusModal({
        type: "error",
        title: "Save Failed",
        message,
      });
    } finally {
      setIsSavingNhoFiles(false);
    }
  }

  async function handleMoveToOnboarding() {
    if (!majorNhoProgress.isComplete) {
      const message =
        "Candidate must complete all 5 major requirements before moving to Onboarding.";

      setNhoFilesError(message);

      showStatusModal({
        type: "error",
        title: "Incomplete Major Requirements",
        message,
      });

      return;
    }

    setIsSavingNhoFiles(true);
    setNhoFilesError("");
    setNhoFilesSuccess("");

    try {
      await moveCandidateToStage(
        ONBOARDING_STAGE,
        sortedCandidateFiles,
        majorNhoProgress,
      );

      const successMessage =
        "Candidate completed the 5 major requirements and was moved to Onboarding.";

      setNhoFilesSuccess(successMessage);

      showStatusModal({
        type: "success",
        title: "Moved to Onboarding",
        message: successMessage,
      });
    } catch (error) {
      const message = getApiErrorMessage(
        error,
        "Failed to move to Onboarding.",
      );

      setNhoFilesError(message);

      showStatusModal({
        type: "error",
        title: "Move to Onboarding Failed",
        message,
      });
    } finally {
      setIsSavingNhoFiles(false);
    }
  }

  async function handleScheduleNhoClick() {
    await handleScheduleNhoAuto(activeCandidate);
    onClose?.();
  }

  async function handleStartOrContinueInterview() {
    if (!isInterviewInProgress) {
      await handleStartInterview(activeCandidate);
    }

    if (activeCandidate.onlineInterviewLink) {
      window.open(
        activeCandidate.onlineInterviewLink,
        "_blank",
        "noopener,noreferrer",
      );
    }

    onClose?.();

    const positionId =
      activeCandidate.positionId ||
      activeCandidate.finalInterviewPositionId ||
      activeCandidate.offerDetails?.positionId ||
      activeCandidate.hiringRequirementId ||
      "";

    const formId =
      activeCandidate.finalInterviewFormId ||
      (positionId ? `final-interview-${positionId}` : "");

    navigate(
      `/recruitment/final-interview-form?candidateId=${encodeURIComponent(
        activeCandidate.candidateId || "",
      )}&candidateApplicationId=${encodeURIComponent(
        activeCandidate.candidateApplicationId || activeCandidate.id || "",
      )}&positionId=${encodeURIComponent(positionId)}&formId=${encodeURIComponent(
        formId,
      )}`,
      {
        state: {
          candidate: activeCandidate,
        },
      },
    );
  }

  const nhoScheduleSection = (
    <div className="rounded-xl border border-[#E6ECF2] bg-[#F8FAFC] p-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <h3 className="truncate text-sm font-bold text-sibs-primary-1">
            NHO Schedule
          </h3>

          <p className="mt-1 line-clamp-2 text-xs font-medium leading-5 text-sibs-tertiary-5">
            Review and manage the candidate’s new hire onboarding schedule.
          </p>
        </div>

        <span
          className={`w-fit shrink-0 rounded-full border px-3 py-1 text-xs font-bold ${
            hasNhoSchedule
              ? "border-emerald-200 bg-emerald-50 text-emerald-700"
              : "border-amber-200 bg-amber-50 text-amber-700"
          }`}
        >
          {nhoScheduleDetails.status}
        </span>
      </div>

      {hasNhoSchedule ? (
        <>
          <div className="mt-4 rounded-xl bg-white p-4">
            <DetailRow
              label="Start Date"
              value={formatDateTime(nhoScheduleDetails.startDate) || "—"}
            />
            <DetailRow label="Account" value={nhoScheduleDetails.account} />
            <DetailRow label="Trainer" value={nhoScheduleDetails.trainer} />
            <DetailRow
              label="Updated Shift Schedule"
              value={nhoScheduleDetails.updatedShiftSchedule}
            />
            <DetailRow
              label="Endorsement Status"
              value={nhoScheduleDetails.endorsementStatus}
            />
            <DetailRow label="Location" value={nhoScheduleDetails.location} />
          </div>

          {nhoScheduleDetails.remarks && (
            <div className="mt-4 rounded-xl border border-[#E6ECF2] bg-white p-4">
              <p className="text-[11px] font-extrabold uppercase tracking-wide text-sibs-primary-1">
                Remarks
              </p>
              <p className="mt-2 text-sm font-medium leading-6 text-[#475467]">
                {nhoScheduleDetails.remarks}
              </p>
            </div>
          )}
        </>
      ) : (
        <div className="mt-4 rounded-xl border border-dashed border-[#C9D6E4] bg-white p-5 text-center">
          <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-xl bg-[#F8FAFC] text-sibs-primary-1 shadow-sm">
            <CalendarDays size={22} />
          </div>

          <p className="mt-3 text-sm font-bold text-[#101828]">
            NHO schedule not set
          </p>

          <p className="mt-1 text-xs font-medium leading-5 text-[#667085]">
            Set the candidate’s start date, trainer, and schedule details for
            onboarding.
          </p>
        </div>
      )}
    </div>
  );

  if (!open || !candidate) return null;

  return (
    <>
      <div
        className="fixed inset-0 z-[9999] flex h-dvh items-center justify-center bg-black/40 px-4 py-4"
        onClick={onClose}
      >
        <div
          className="flex max-h-[92dvh] w-full max-w-6xl flex-col overflow-hidden rounded-2xl bg-white shadow-xl"
          onClick={(event) => event.stopPropagation()}
        >
          <div className="flex items-start justify-between gap-4 border-b border-gray-100 px-5 py-4 sm:px-6 sm:py-5">
            <div>
              <h2 className="text-lg font-bold text-sibs-primary-1 sm:text-xl">
                Candidate Pipeline Details
              </h2>

              <p className="mt-1 text-sm font-medium text-sibs-tertiary-5">
                View candidate movement, online assessment, interview status,
                and pre-employment requirements.
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
            <div className="grid grid-cols-1 gap-5">
              <div className="min-w-0 space-y-5">
                <div className="rounded-xl border border-[#E6ECF2] bg-white p-5 shadow-sm">
                  <div className="flex items-start gap-4">
                    <CandidateAvatar candidate={activeCandidate} />

                    <div className="min-w-0 flex-1">
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                        <div className="min-w-0">
                          <h3 className="break-words text-xl font-bold text-[#101828]">
                            {activeCandidate.name}
                          </h3>

                          <p className="mt-1 break-words text-sm font-semibold text-sibs-tertiary-5">
                            {activeCandidate.email}
                          </p>
                        </div>

                        <button
                          type="button"
                          onClick={() =>
                            setShowTalentPoolDetails((previous) => !previous)
                          }
                          className="inline-flex h-10 shrink-0 items-center justify-center gap-2 rounded-xl border border-blue-100 bg-blue-50 px-4 text-sm font-bold text-blue-700 transition hover:bg-blue-100"
                        >
                          Talent Details
                          <ChevronDown
                            size={16}
                            className={`transition-transform ${
                              showTalentPoolDetails ? "rotate-180" : ""
                            }`}
                          />
                        </button>
                      </div>

                      <div className="mt-3 flex flex-wrap gap-2">
                        <span
                          className={`inline-flex rounded-full border px-3 py-1 text-xs font-bold ${getStageClass(
                            currentStage,
                          )}`}
                        >
                          {currentStage}
                        </span>

                        <span
                          className={`inline-flex rounded-full border px-3 py-1 text-xs font-bold ${getPrfStatusClass(
                            activePrfStatus,
                          )}`}
                        >
                          PRF: {activePrfStatus}
                        </span>

                        {modalStatus && (
                          <span
                            className={`inline-flex rounded-full border px-3 py-1 text-xs font-bold ${getInterviewStatusClass(
                              modalStatus,
                            )}`}
                          >
                            {modalStatus}
                          </span>
                        )}

                        {!isLeadStage && activeCandidate.assessmentResult && (
                          <span
                            className={`inline-flex rounded-full border px-3 py-1 text-xs font-bold ${getAssessmentResultClass(
                              activeCandidate.assessmentResult,
                            )}`}
                          >
                            {activeCandidate.assessmentResult}
                          </span>
                        )}

                        {canShowNhoUploads && (
                          <span
                            className={`inline-flex rounded-full border px-3 py-1 text-xs font-bold ${
                              majorNhoProgress.isComplete
                                ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                                : "border-amber-200 bg-amber-50 text-amber-700"
                            }`}
                          >
                            Major: {majorNhoProgress.completed} /{" "}
                            {majorNhoProgress.total}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {showTalentPoolDetails && (
                  <CandidateTalentPoolDetailsPanel candidate={activeCandidate} />
                )}

                {isInitialScreening && (
                  <LeadPrfReviewCard
                    candidate={{
                      ...activeCandidate,
                      prfStatus: activePrfStatus,
                      prf_status: activePrfStatus,
                    }}
                    onUpdatePrfStatus={handleLocalPrfStatusUpdate}
                  />
                )}

                <div
                  className={`grid grid-cols-1 gap-5 ${
                    isLeadStage || isInitialScreening
                      ? ""
                      : "xl:grid-cols-[1fr_360px]"
                  }`}
                >
                  <div className="min-w-0 space-y-5">
                    <div className="rounded-xl border border-[#E6ECF2] bg-white p-5 shadow-sm">
                      <h3 className="text-sm font-bold text-[#101828]">
                        Movement Timeline
                      </h3>

                      <div className="mt-5 space-y-4">
                        {(activeCandidate.timeline || []).map((item, index) => {
                          const savedFormFullLink = item.savedFormLink
                            ? `${window.location.origin}${item.savedFormLink}`
                            : "";

                          return (
                            <div
                              key={`${item.stage}-${index}`}
                              className="flex min-w-0 gap-4"
                            >
                              <div
                                className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full border text-xs font-bold ${getStageClass(
                                  item.stage,
                                )}`}
                              >
                                {index + 1}
                              </div>

                              <div className="min-w-0 flex-1 rounded-xl border border-[#E6ECF2] bg-[#F8FAFC] p-4">
                                <div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-center">
                                  <div className="min-w-0">
                                    <p className="truncate text-sm font-bold text-[#101828]">
                                      {item.stage}
                                    </p>
                                    <p className="truncate text-xs font-semibold text-sibs-tertiary-5">
                                      {item.timestamp}
                                    </p>
                                  </div>

                                  <span className="w-fit shrink-0 rounded-full border border-gray-200 bg-white px-3 py-1 text-xs font-bold text-gray-600">
                                    {item.owner}
                                  </span>
                                </div>

                                <p className="mt-3 text-sm leading-6 text-[#344054]">
                                  {item.reason}
                                </p>

                                {item.remarks && (
                                  <p className="mt-3 rounded-lg bg-white p-3 text-xs font-semibold leading-5 text-[#475467]">
                                    {item.remarks}
                                  </p>
                                )}

                                <GetAssessmentTimelineFiles
                                  item={item}
                                  candidate={activeCandidate}
                                />

                                {item.savedFormLink && (
                                  <div className="mt-3">
                                    <p className="text-[11px] font-extrabold uppercase tracking-wide text-sibs-primary-1">
                                      Job Evaluation Link
                                    </p>

                                    <button
                                      type="button"
                                      title={savedFormFullLink}
                                      onClick={() => {
                                        window.open(
                                          item.savedFormLink,
                                          "_blank",
                                          "noopener,noreferrer",
                                        );
                                      }}
                                      className="mt-2 block w-full min-w-0 truncate rounded-lg border border-blue-100 bg-white px-3 py-2 text-left text-xs font-semibold text-blue-600 underline transition hover:cursor-pointer hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700"
                                    >
                                      {savedFormFullLink}
                                    </button>
                                  </div>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    <div className="rounded-xl border border-[#E6ECF2] bg-white p-5 shadow-sm">
                      <h3 className="text-sm font-bold text-[#101828]">
                        Reason for Movement
                      </h3>

                      <p className="mt-3 rounded-xl border border-[#E6ECF2] bg-[#F8FAFC] p-4 text-sm leading-6 text-[#344054]">
                        {activeCandidate.reasonForMovement || "—"}
                      </p>
                    </div>
                  </div>

                  {!isLeadStage && !isInitialScreening && (
                    <div className="space-y-5">
                      <div className="rounded-xl border border-[#E6ECF2] bg-[#F8FAFC] p-4">
                        <h3 className="text-sm font-bold text-sibs-primary-1">
                          Online Assessment
                        </h3>

                        <div className="mt-4 rounded-xl bg-white p-4">
                          <DetailRow
                            label="Assessment Result"
                            value={getAssessmentResult(activeCandidate) || "—"}
                          />
                          <DetailRow
                            label="Email Sent"
                            value={
                              activeCandidate.assessmentEmailSent ||
                              activeCandidate.assessment_email_sent
                                ? "Yes"
                                : "No"
                            }
                          />
                          <DetailRow
                            label="Email Sent At"
                            value={
                              activeCandidate.assessmentEmailSentAt ||
                              activeCandidate.assessment_email_sent_at
                            }
                          />
                        </div>

                        {isOnlineAssessment && (
                          <div className="mt-4 grid grid-cols-1 gap-2">
                            <button
                              type="button"
                              disabled={isSendingAssessmentEmail}
                              onClick={handleSendAssessmentEmailClick}
                              className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-xl border border-blue-100 bg-blue-50 text-sm font-bold text-blue-700 transition hover:bg-blue-100 disabled:cursor-not-allowed disabled:opacity-70"
                            >
                              {isSendingAssessmentEmail ? (
                                <Loader2 size={16} className="animate-spin" />
                              ) : (
                                <Mail size={16} />
                              )}
                              {isSendingAssessmentEmail
                                ? "Sending..."
                                : "Send Assessment Email"}
                            </button>

                            <button
                              type="button"
                              onClick={handleOpenAssessmentModalClick}
                              className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-xl bg-sibs-primary-1 text-sm font-bold text-white transition hover:opacity-90"
                            >
                              <ClipboardCheck size={16} />
                              Update Assessment
                            </button>
                          </div>
                        )}
                      </div>

                      <div className="rounded-xl border border-[#E6ECF2] bg-[#F8FAFC] p-5">
                        <h3 className="text-sm font-bold text-[#101828]">
                          Interview Details
                        </h3>

                        <div className="mt-4 rounded-xl bg-white p-4">
                          <DetailRow
                            label="Candidate ID"
                            value={activeCandidate.candidateId}
                          />
                          <DetailRow
                            label="Role / Account"
                            value={activeCandidate.roleAccount}
                          />
                          <DetailRow
                            label="Interview Date"
                            value={formatDateTime(activeCandidate.interviewDate)}
                          />
                          <DetailRow
                            label="Interview Type"
                            value={getDisplayInterviewType(activeCandidate)}
                          />
                          <DetailRow
                            label="Interview Status"
                            value={
                              getDisplayInterviewStatus(activeCandidate) || "—"
                            }
                          />

                          <div className="mt-4 flex items-center justify-between gap-4 text-[12px]">
                            <span className="shrink-0 font-bold uppercase text-sibs-tertiary-5">
                              Interview Link
                            </span>

                            <span
                              title={activeCandidate.onlineInterviewLink}
                              className={`block max-w-[60%] min-w-0 overflow-hidden truncate text-right ${
                                activeCandidate.onlineInterviewLink
                                  ? "text-blue-600 underline hover:cursor-pointer"
                                  : "text-sm font-bold text-[#344054]"
                              }`}
                              onClick={() => {
                                if (activeCandidate.onlineInterviewLink) {
                                  window.open(
                                    activeCandidate.onlineInterviewLink,
                                    "_blank",
                                  );
                                }
                              }}
                            >
                              <span className="inline-block max-w-full overflow-hidden truncate align-bottom">
                                {activeCandidate.onlineInterviewLink || "—"}
                              </span>
                            </span>
                          </div>

                          {activeCandidate.interviewStatus === "Cancelled" && (
                            <DetailRow
                              label="Cancellation Reason"
                              value={activeCandidate.cancellationReason || "—"}
                            />
                          )}
                        </div>

                        {isInterviewScheduled && candidateHasSchedule && (
                          <div className="mt-4 grid grid-cols-1 gap-2">
                            <button
                              type="button"
                              onClick={() =>
                                onOpenScheduleModal?.(activeCandidate)
                              }
                              className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-xl border border-blue-100 bg-blue-50 text-sm font-bold text-blue-700 transition hover:bg-blue-100"
                            >
                              <CalendarDays size={16} />
                              Update Interview Schedule
                            </button>

                            <button
                              type="button"
                              onClick={handleStartOrContinueInterview}
                              className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-xl bg-sibs-primary-1 text-sm font-bold text-white transition hover:opacity-90"
                            >
                              <CirclePlay size={16} />
                              {isInterviewInProgress
                                ? "Continue Interview"
                                : "Start Interview"}
                            </button>

                            <button
                              type="button"
                              onClick={() =>
                                onCompleteInterview?.(activeCandidate)
                              }
                              className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-xl border border-emerald-100 bg-emerald-50 text-sm font-bold text-emerald-700 transition hover:bg-emerald-100"
                            >
                              <ClipboardCheck size={16} />
                              Mark Interview Completed
                            </button>

                            <button
                              type="button"
                              onClick={() => onCancelInterview?.(activeCandidate)}
                              className="inline-flex h-10 w-full items-center justify-center rounded-xl border border-red-100 bg-red-50 text-sm font-bold text-red-600 transition hover:bg-red-100"
                            >
                              Cancel Interview
                            </button>
                          </div>
                        )}

                        {isOnlineAssessment &&
                          canScheduleInterview(activeCandidate) && (
                            <button
                              type="button"
                              onClick={() =>
                                onOpenScheduleModal?.(activeCandidate)
                              }
                              className="mt-4 inline-flex h-10 w-full items-center justify-center gap-2 rounded-xl bg-sibs-primary-1 text-sm font-bold text-white transition hover:opacity-90"
                            >
                              <CalendarDays size={16} />
                              Schedule Interview
                            </button>
                          )}
                      </div>

                      {(isOffered ||
                        isAccepted ||
                        forNHO ||
                        isIncompleteOnboarding ||
                        isOnboarding) && (
                        <div className="rounded-xl border border-[#E6ECF2] bg-[#F8FAFC] p-4">
                          <h3 className="text-sm font-bold text-sibs-primary-1">
                            Offer and Approval
                          </h3>

                          <div className="mt-4 rounded-xl bg-white p-4">
                            <DetailRow
                              label="Offer Role"
                              value={
                                activeCandidate.offerDetails?.roleTitle ||
                                activeCandidate.roleTitle
                              }
                            />
                            <DetailRow
                              label="Hiring Requirement"
                              value={
                                activeCandidate.offerDetails
                                  ?.hiringRequirementId ||
                                activeCandidate.hiringRequirementId
                              }
                            />
                            <DetailRow
                              label="Final Role"
                              value={
                                activeCandidate.offerDetails?.roleTitle ||
                                activeCandidate.roleTitle
                              }
                            />
                            <DetailRow
                              label="Final Account"
                              value={activeCandidate.offerDetails?.account}
                            />
                            <DetailRow
                              label="Basic Pay"
                              value={formatCurrency(
                                activeCandidate.offerDetails?.basicPay,
                              )}
                            />
                            <DetailRow
                              label="Deminimis / Daily Rate"
                              value={formatCurrency(
                                activeCandidate.offerDetails?.deminimisDailyRate,
                              )}
                            />
                            <DetailRow
                              label="Approval Status"
                              value={
                                activeCandidate.offerApprovalStatus ||
                                getOfferApprovalSummary(activeCandidate)
                              }
                            />
                            <DetailRow
                              label="Offer Email Sent"
                              value={
                                activeCandidate.offerEmailSent ? "Yes" : "No"
                              }
                            />
                            <DetailRow
                              label="Candidate Response"
                              value={activeCandidate.offerDecision || "—"}
                            />
                          </div>

                          {isOffered && (
                            <div className="mt-4 space-y-4">
                              {(() => {
                                const approvedBy = offerApprovers.filter(
                                  (approver) => {
                                    const approval =
                                      activeCandidate.offerApprovals?.[approver];

                                    return approval?.status === "Approved";
                                  },
                                );

                                const isRejected = offerApprovers.some(
                                  (approver) => {
                                    const approval =
                                      activeCandidate.offerApprovals?.[approver];

                                    return approval?.status === "Rejected";
                                  },
                                );

                                const approvalStatus =
                                  activeCandidate.offerApprovalStatus ||
                                  getOfferApprovalSummary(activeCandidate);

                                return (
                                  <div className="rounded-xl border border-[#E6ECF2] bg-white p-4">
                                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                                      <div>
                                        <p className="text-xs font-extrabold uppercase tracking-wide text-sibs-tertiary-5">
                                          Offer Approval
                                        </p>

                                        <h4 className="mt-1 text-base font-extrabold text-[#101828]">
                                          {approvalStatus === "Approved"
                                            ? "Offer Approved"
                                            : isRejected
                                              ? "Offer Rejected"
                                              : "For Review"}
                                        </h4>
                                      </div>

                                      <span
                                        className={`w-fit rounded-full border px-3 py-1 text-xs font-extrabold ${getOfferApprovalClass(
                                          approvalStatus || "For Review",
                                        )}`}
                                      >
                                        {approvalStatus || "For Review"}
                                      </span>
                                    </div>

                                    <div className="mt-4 rounded-xl border border-[#E6ECF2] bg-[#F8FAFC] p-4">
                                      <p className="text-xs font-extrabold uppercase tracking-wide text-sibs-tertiary-5">
                                        Approved By
                                      </p>

                                      <p className="mt-2 text-sm font-bold leading-6 text-sibs-primary-1">
                                        {approvedBy.length > 0
                                          ? approvedBy.join(", ")
                                          : "Waiting for approval"}
                                      </p>
                                    </div>

                                    {approvalStatus !== "Approved" &&
                                      !isRejected && (
                                        <p className="mt-3 rounded-xl border border-amber-100 bg-amber-50 p-3 text-sm font-semibold leading-6 text-sibs-primary-1">
                                          Offer is still for review. The email
                                          button will be enabled once all
                                          required approvals are completed in the
                                          Offers page.
                                        </p>
                                      )}

                                    {isRejected && (
                                      <p className="mt-3 rounded-xl border border-red-100 bg-red-50 p-3 text-sm font-semibold leading-6 text-red-600">
                                        Offer approval was rejected. Please
                                        review the approval details in the
                                        Offers page.
                                      </p>
                                    )}
                                  </div>
                                );
                              })()}

                              {isOfferApproved(activeCandidate) &&
                                !activeCandidate.offerEmailSent && (
                                  <button
                                    type="button"
                                    onClick={() =>
                                      onSendOfferEmail?.(activeCandidate)
                                    }
                                    className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-xl bg-sibs-primary-1 text-sm font-bold text-white transition hover:opacity-90"
                                  >
                                    <Mail size={16} />
                                    Send Offer Email to Candidate
                                  </button>
                                )}

                              {isOfferApproved(activeCandidate) && (
                                <button
                                  type="button"
                                  onClick={() =>
                                    window.open(
                                      buildOfferContractLink(activeCandidate),
                                      "_blank",
                                      "noopener,noreferrer",
                                    )
                                  }
                                  className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-xl border border-blue-100 bg-blue-50 text-sm font-bold text-blue-700 transition hover:bg-blue-100"
                                >
                                  <Eye size={16} />
                                  Open Candidate Offer Link Manually
                                </button>
                              )}

                              {activeCandidate.offerEmailSent && (
                                <div className="rounded-xl border border-[#E6ECF2] bg-white p-4">
                                  <p className="text-xs font-bold uppercase tracking-wide text-sibs-tertiary-5">
                                    Candidate Offer Response
                                  </p>
                                  <p className="mt-2 text-xs font-semibold leading-5 text-sibs-tertiary-5">
                                    Use these buttons only when the candidate
                                    cannot access the email link or TA needs to
                                    record the response manually.
                                  </p>
                                  <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-3">
                                    {offerDecisionOptions.map((decision) => (
                                      <button
                                        key={decision}
                                        type="button"
                                        onClick={() =>
                                          onOfferDecision?.(
                                            activeCandidate,
                                            decision,
                                          )
                                        }
                                        className={`inline-flex h-9 items-center justify-center rounded-xl border px-3 text-xs font-bold transition ${getOfferDecisionClass(
                                          decision,
                                        )}`}
                                      >
                                        {decision}
                                      </button>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      )}

                      {(isAccepted ||
                        forNHO ||
                        isIncompleteOnboarding ||
                        isOnboarding) &&
                        nhoScheduleSection}
                    </div>
                  )}
                </div>

                {canShowNhoUploads && (
                  <PreEmploymentRequirementsPanel
                    candidateName={activeCandidate.name}
                    candidateEmail={activeCandidate.email}
                    files={sortedCandidateFiles}
                    selectedFile={selectedNhoFile}
                    disabled={isSavingNhoFiles || isLoadingNhoFiles}
                    saveError={nhoFilesError}
                    saveSuccess={nhoFilesSuccess}
                    onUpload={handleRequirementUpload}
                    onRemove={handleRequirementRemove}
                    onSelectFile={setSelectedNhoFile}
                  />
                )}
              </div>
            </div>
          </div>

          <div className="border-t border-gray-100 px-5 py-4 sm:px-6">
            <div className="flex flex-col justify-end gap-2 sm:flex-row">
              {activeCandidate.currentStage !== "Drop-off" && (
                <button
                  type="button"
                  onClick={() => onOpenDropOffModal?.(activeCandidate)}
                  className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-red-200 bg-red-50 px-5 text-sm font-bold text-red-500 transition hover:bg-red-100"
                >
                  <UserX size={16} />
                  Mark Drop-off
                </button>
              )}

              {isAccepted && (
                <button
                  type="button"
                  onClick={handleScheduleNhoClick}
                  className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-sibs-primary-1 px-5 text-sm font-bold text-white transition hover:opacity-90"
                >
                  <CalendarDays size={16} />
                  Schedule NHO
                </button>
              )}

              {canShowNhoUploads && (
                <button
                  type="button"
                  disabled={isSavingNhoFiles || isLoadingNhoFiles}
                  onClick={handleSavePreEmploymentRequirements}
                  className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-sibs-primary-1 px-5 text-sm font-bold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-70"
                >
                  {isSavingNhoFiles ? (
                    <Loader2 size={16} className="animate-spin" />
                  ) : (
                    <UploadCloud size={16} />
                  )}
                  {isSavingNhoFiles ? "Saving..." : "Save"}
                </button>
              )}

              {canShowNhoUploads &&
                majorNhoProgress.isComplete &&
                !isOnboarding && (
                  <button
                    type="button"
                    disabled={isSavingNhoFiles || isLoadingNhoFiles}
                    onClick={handleMoveToOnboarding}
                    className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-5 text-sm font-bold text-emerald-700 transition hover:bg-emerald-100 disabled:cursor-not-allowed disabled:opacity-70"
                  >
                    <ArrowRight size={16} />
                    Move to Onboarding
                  </button>
                )}

              {isInterviewed && nextStage && (
                <button
                  type="button"
                  onClick={handleMoveToNextStage}
                  className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-sibs-primary-1 px-5 text-sm font-bold text-white transition hover:opacity-90"
                >
                  <ArrowRight size={16} />
                  Move to {nextStage}
                </button>
              )}

              {isInitialScreening && nextStage && (
                <button
                  type="button"
                  onClick={handleMoveToNextStage}
                  className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-sibs-primary-1 px-5 text-sm font-bold text-white transition hover:opacity-90"
                >
                  <ArrowRight size={16} />
                  Move to Online Assessment
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      <UpdateAssessmentModal
        open={showAssessmentModal}
        candidate={activeCandidate}
        candidateId={candidateNhoUploadId}
        onClose={() => setShowAssessmentModal(false)}
        onSaved={handleAssessmentSaved}
      />

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
};

export default CandidatePipelineModal;