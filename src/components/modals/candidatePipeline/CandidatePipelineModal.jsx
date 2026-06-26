import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowRight,
  CalendarDays,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  X,
  UserX,
  Eye,
  ClipboardCheck,
  Mail,
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

  useEffect(() => {
    if (!open) return;

    const initialStatus =
      candidate?.assessmentStatus || candidate?.assessment_status || "Not Take";

    setAssessmentStatus(initialStatus);
    setAssessmentResult(candidate?.assessmentResult || "");
    setAssessmentRemarks(candidate?.assessmentRemarks || "");
    setAssessmentFile(null);
    setErrorMessage("");
  }, [
    open,
    candidate?.id,
    candidate?.candidateId,
    candidate?.assessmentStatus,
    candidate?.assessmentResult,
    candidate?.assessmentRemarks,
  ]);

  if (!open) return null;

  async function handleSubmit(event) {
    event.preventDefault();
    event.stopPropagation();

    const resolvedCandidateId = cleanText(candidateId);

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
        assessmentResult:
          apiCandidate.assessmentResult ||
          apiCandidate.assessment_result ||
          (assessmentStatus === "Taken" ? assessmentResult : ""),
        assessmentRemarks:
          apiCandidate.assessmentRemarks ||
          apiCandidate.assessment_remarks ||
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
      onClick={(event) => event.stopPropagation()}
      onMouseDown={(event) => event.stopPropagation()}
    >
      <form
        onSubmit={handleSubmit}
        onClick={(event) => event.stopPropagation()}
        className="flex max-h-[92dvh] w-full max-w-xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl"
      >
        <div className="flex items-start justify-between gap-4 border-b border-[#E6ECF2] px-5 py-4 sm:px-6">
          <div>
            <h2 className="text-lg font-extrabold text-sibs-primary-1">
              Update Assessment
            </h2>

            <p className="mt-1 text-sm font-semibold leading-5 text-sibs-tertiary-5">
              Save the candidate&apos;s online assessment status, result, and
              attachment.
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={isSaving}
            className="rounded-full p-2 text-gray-400 transition hover:bg-gray-100 hover:text-gray-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <X size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto bg-[#F8FAFC] p-5 sm:p-6">
          <div className="rounded-2xl border border-[#E6ECF2] bg-white p-4">
            <p className="text-[11px] font-extrabold uppercase tracking-wide text-sibs-primary-1">
              Candidate
            </p>

            <p className="mt-1 break-words text-base font-extrabold text-[#101828]">
              {candidate?.name || candidate?.candidateName || "Candidate"}
            </p>

            <p className="mt-1 break-words text-sm font-bold text-sibs-tertiary-5">
              {candidate?.email || "No email provided"}
            </p>
          </div>

          <div className="mt-5 space-y-4">
            <label className="block">
              <span className="text-xs font-extrabold uppercase tracking-wide text-sibs-primary-1">
                Assessment Status
              </span>

              <select
                value={assessmentStatus}
                disabled={isSaving}
                onChange={(event) => {
                  const value = event.target.value;
                  setAssessmentStatus(value);

                  if (value !== "Taken") {
                    setAssessmentResult("");
                  }
                }}
                className="mt-2 h-11 w-full rounded-xl border border-[#D6DEE8] bg-white px-3 text-sm font-bold text-[#344054] outline-none transition focus:border-sibs-primary-1"
              >
                {ASSESSMENT_STATUS_OPTIONS.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </label>

            <label className="block">
              <span className="text-xs font-extrabold uppercase tracking-wide text-sibs-primary-1">
                Assessment Result
              </span>

              <select
                value={assessmentResult}
                disabled={isSaving || assessmentStatus !== "Taken"}
                onChange={(event) => setAssessmentResult(event.target.value)}
                className="mt-2 h-11 w-full rounded-xl border border-[#D6DEE8] bg-white px-3 text-sm font-bold text-[#344054] outline-none transition focus:border-sibs-primary-1 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400"
              >
                <option value="">Select assessment result</option>
                {ASSESSMENT_RESULT_OPTIONS.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </label>

            <label className="block">
              <span className="text-xs font-extrabold uppercase tracking-wide text-sibs-primary-1">
                Remarks
              </span>

              <textarea
                value={assessmentRemarks}
                disabled={isSaving}
                onChange={(event) => setAssessmentRemarks(event.target.value)}
                rows={4}
                placeholder="Add assessment remarks..."
                className="mt-2 w-full resize-none rounded-xl border border-[#D6DEE8] bg-white px-3 py-3 text-sm font-semibold leading-6 text-[#344054] outline-none transition placeholder:text-slate-400 focus:border-sibs-primary-1"
              />
            </label>

            <label className="block">
              <span className="text-xs font-extrabold uppercase tracking-wide text-sibs-primary-1">
                Assessment Attachment
              </span>

              <div className="mt-2 rounded-xl border border-dashed border-[#B9C7D6] bg-white p-4">
                <input
                  type="file"
                  disabled={isSaving}
                  accept={ACCEPTED_FILE_TYPES}
                  onChange={(event) =>
                    setAssessmentFile(event.target.files?.[0] || null)
                  }
                  className="block w-full text-sm font-bold text-[#344054] file:mr-4 file:rounded-xl file:border-0 file:bg-sibs-primary-1 file:px-4 file:py-2 file:text-sm file:font-extrabold file:text-white"
                />

                <p className="mt-2 text-xs font-semibold leading-5 text-sibs-tertiary-5">
                  Allowed: PDF, DOC, DOCX, XLS, XLSX, CSV, JPG, PNG, WEBP,
                  HEIC.
                </p>

                {assessmentFile && (
                  <p className="mt-2 break-words text-xs font-extrabold text-sibs-primary-1">
                    Selected: {assessmentFile.name}
                  </p>
                )}
              </div>
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
            className="inline-flex h-11 items-center justify-center rounded-xl border border-[#D6DEE8] bg-white px-5 text-sm font-extrabold text-[#475467] transition hover:bg-[#F8FAFC] disabled:cursor-not-allowed disabled:opacity-60"
          >
            Cancel
          </button>

          <button
            type="submit"
            disabled={isSaving}
            className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-sibs-primary-1 px-5 text-sm font-extrabold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSaving ? <Loader2 size={16} className="animate-spin" /> : null}
            {isSaving ? "Saving..." : "Save Assessment"}
          </button>
        </div>
      </form>
    </div>
  );
}


function getAssessmentEmailCandidateName(candidate = {}) {
  return (
    cleanText(candidate.name) ||
    cleanText(candidate.candidateName) ||
    cleanText(candidate.fullName) ||
    cleanText(candidate.full_name) ||
    "Candidate"
  );
}

function getAssessmentEmailRole(candidate = {}) {
  return (
    cleanText(candidate.roleCapability) ||
    cleanText(candidate.role_capability) ||
    cleanText(candidate.currentAppliedRole) ||
    cleanText(candidate.current_applied_role) ||
    cleanText(candidate.openPosition) ||
    cleanText(candidate.open_position) ||
    cleanText(candidate.positionTitle) ||
    cleanText(candidate.position_title) ||
    cleanText(candidate.position) ||
    "the available"
  );
}

function addDaysToInputDate(days = 7) {
  const date = new Date();
  date.setDate(date.getDate() + days);

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function formatPreviewDeadline(value) {
  if (!value) return "the scheduled deadline";

  const date = new Date(`${value}T00:00:00`);

  if (Number.isNaN(date.getTime())) return value;

  return date.toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

const assessmentEmailMonthNames = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

const assessmentEmailWeekdayLabels = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

function padDateNumber(value) {
  return String(value).padStart(2, "0");
}

function toDateInputValue(date) {
  if (!(date instanceof Date) || Number.isNaN(date.getTime())) return "";

  return `${date.getFullYear()}-${padDateNumber(date.getMonth() + 1)}-${padDateNumber(
    date.getDate(),
  )}`;
}

function parseDateInputValue(value) {
  if (!value) return null;

  const rawValue = String(value).trim();

  if (/^\d{4}-\d{2}-\d{2}$/.test(rawValue)) {
    const parts = rawValue.split("-");
    const year = Number(parts[0]);
    const month = Number(parts[1]) - 1;
    const day = Number(parts[2]);

    const date = new Date(year, month, day);

    if (Number.isNaN(date.getTime())) return null;

    return date;
  }

  if (/^\d{2}\/\d{2}\/\d{4}$/.test(rawValue)) {
    const parts = rawValue.split("/");
    const month = Number(parts[0]) - 1;
    const day = Number(parts[1]);
    const year = Number(parts[2]);

    const date = new Date(year, month, day);

    if (Number.isNaN(date.getTime())) return null;

    return date;
  }

  const fallbackDate = new Date(rawValue);

  if (Number.isNaN(fallbackDate.getTime())) return null;

  return fallbackDate;
}

function formatAssessmentDateDisplay(value) {
  const date = parseDateInputValue(value);

  if (!date) return "Select deadline";

  return date.toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

function isSameAssessmentDate(firstDate, secondDate) {
  if (!firstDate || !secondDate) return false;

  return (
    firstDate.getFullYear() === secondDate.getFullYear() &&
    firstDate.getMonth() === secondDate.getMonth() &&
    firstDate.getDate() === secondDate.getDate()
  );
}

function buildAssessmentCalendarDays(displayDate) {
  const year = displayDate.getFullYear();
  const month = displayDate.getMonth();

  const firstDayOfMonth = new Date(year, month, 1);
  const startDay = firstDayOfMonth.getDay();

  const calendarStart = new Date(year, month, 1 - startDay);
  const days = [];

  for (let index = 0; index < 42; index += 1) {
    const date = new Date(calendarStart);
    date.setDate(calendarStart.getDate() + index);

    days.push({
      date,
      dateValue: toDateInputValue(date),
      dayNumber: date.getDate(),
      isCurrentMonth: date.getMonth() === month,
    });
  }

  return days;
}

function isPastAssessmentDate(date) {
  if (!(date instanceof Date) || Number.isNaN(date.getTime())) return true;

  const today = new Date();

  const todayStart = new Date(
    today.getFullYear(),
    today.getMonth(),
    today.getDate(),
  );

  const targetStart = new Date(
    date.getFullYear(),
    date.getMonth(),
    date.getDate(),
  );

  return targetStart < todayStart;
}

function AssessmentDeadlineDatePicker({
  value,
  onChange,
  placeholder = "Select deadline",
  disabled = false,
}) {
  const calendarRef = useRef(null);
  const selectedDate = parseDateInputValue(value);
  const today = new Date();

  const [open, setOpen] = useState(false);
  const [displayDate, setDisplayDate] = useState(() => {
    if (selectedDate) {
      return new Date(
        selectedDate.getFullYear(),
        selectedDate.getMonth(),
        1,
      );
    }

    return new Date(today.getFullYear(), today.getMonth(), 1);
  });

  const currentMonthStart = new Date(
    today.getFullYear(),
    today.getMonth(),
    1,
  );

  const displayMonthStart = new Date(
    displayDate.getFullYear(),
    displayDate.getMonth(),
    1,
  );

  const disablePreviousMonth = displayMonthStart <= currentMonthStart;

  const calendarDays = useMemo(
    () => buildAssessmentCalendarDays(displayDate),
    [displayDate],
  );

  useEffect(() => {
    if (selectedDate) {
      setDisplayDate(
        new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 1),
      );
    }
  }, [value]);

  useEffect(() => {
    function handleClickOutside(event) {
      if (!calendarRef.current) return;

      if (!calendarRef.current.contains(event.target)) {
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

  function goPreviousMonth() {
    setDisplayDate(
      (previous) =>
        new Date(previous.getFullYear(), previous.getMonth() - 1, 1),
    );
  }

  function goNextMonth() {
    setDisplayDate(
      (previous) =>
        new Date(previous.getFullYear(), previous.getMonth() + 1, 1),
    );
  }

  function handleSelectDate(date) {
    if (isPastAssessmentDate(date)) return;

    onChange(toDateInputValue(date));
    setOpen(false);
  }

  function handleClear() {
    onChange("");
    setOpen(false);
  }

  function handleToday() {
    onChange(toDateInputValue(today));
    setDisplayDate(new Date(today.getFullYear(), today.getMonth(), 1));
    setOpen(false);
  }

  return (
    <div ref={calendarRef} className="relative z-[300] min-w-0">
      <button
        type="button"
        disabled={disabled}
        onClick={() => setOpen((previous) => !previous)}
        className={`flex h-11 w-full min-w-0 items-center justify-between gap-3 rounded-xl border bg-white px-4 text-left text-sm font-bold shadow-sm outline-none transition ${
          open
            ? "border-sibs-primary-1 ring-4 ring-sibs-primary-1/10"
            : "border-[#D6DEE8] hover:border-sibs-primary-1"
        } ${
          disabled
            ? "cursor-not-allowed bg-gray-50 text-gray-400 opacity-70"
            : "text-[#344054]"
        }`}
      >
        <span className="inline-flex min-w-0 flex-1 items-center gap-2 truncate">
          <CalendarDays
            size={16}
            className="shrink-0 text-sibs-primary-1"
          />

          <span
            className={`min-w-0 truncate ${
              value ? "text-[#344054]" : "text-gray-400"
            }`}
          >
            {value ? formatAssessmentDateDisplay(value) : placeholder}
          </span>
        </span>

        <ChevronDown
          size={18}
          className={`shrink-0 text-sibs-primary-1 transition-transform duration-200 ${
            open ? "rotate-180" : ""
          }`}
        />
      </button>

      {open && !disabled && (
        <div className="absolute left-0 top-[calc(100%+8px)] z-[99999] w-[340px] overflow-hidden rounded-2xl border border-[#D9E2EC] bg-white shadow-[0_18px_45px_rgba(15,23,42,0.18)]">
          <div className="flex items-center justify-between border-b border-[#E6ECF2] px-4 py-3">
            <button
              type="button"
              onClick={goPreviousMonth}
              disabled={disablePreviousMonth}
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sibs-primary-1 transition hover:bg-[#EAF2FB] disabled:cursor-not-allowed disabled:opacity-35 disabled:hover:bg-transparent"
            >
              <ChevronLeft size={18} />
            </button>

            <p className="min-w-0 flex-1 text-center text-sm font-extrabold text-sibs-primary-1">
              {assessmentEmailMonthNames[displayDate.getMonth()]}{" "}
              {displayDate.getFullYear()}
            </p>

            <button
              type="button"
              onClick={goNextMonth}
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sibs-primary-1 transition hover:bg-[#EAF2FB]"
            >
              <ChevronRight size={18} />
            </button>
          </div>

          <div className="px-4 py-4">
            <div className="grid grid-cols-7 gap-1">
              {assessmentEmailWeekdayLabels.map((dayLabel) => (
                <div
                  key={dayLabel}
                  className="flex h-8 items-center justify-center text-xs font-extrabold text-[#174A7C]"
                >
                  {dayLabel}
                </div>
              ))}

              {calendarDays.map((day) => {
                  const active =
                    selectedDate && isSameAssessmentDate(day.date, selectedDate);
                  const currentDay = isSameAssessmentDate(day.date, today);
                  const disabledDay = isPastAssessmentDate(day.date);

                  return (
                    <button
                      key={day.dateValue}
                      type="button"
                      disabled={disabledDay}
                      onClick={() => handleSelectDate(day.date)}
                      className={`flex h-9 w-9 items-center justify-center rounded-full text-sm font-extrabold transition ${
                        disabledDay
                          ? "cursor-not-allowed text-[#CBD5E1] opacity-45"
                          : active
                            ? "bg-sibs-primary-1 text-white"
                            : currentDay
                              ? "bg-[#F2F6FA] text-sibs-primary-1"
                              : day.isCurrentMonth
                                ? "text-sibs-primary-1 hover:bg-[#EAF2FB]"
                                : "text-[#98A7BA] hover:bg-[#F7FAFC]"
                      }`}
                    >
                      {day.dayNumber}
                    </button>
                  );
                })}
            </div>
          </div>

          <div className="flex items-center justify-between border-t border-[#E6ECF2] px-5 py-3">
            <button
              type="button"
              onClick={handleClear}
              className="rounded-lg px-2 py-1 text-xs font-extrabold text-sibs-primary-1 transition hover:bg-[#F2F6FA]"
            >
              Clear
            </button>

            <button
              type="button"
              onClick={handleToday}
              className="rounded-lg px-2 py-1 text-xs font-extrabold text-sibs-primary-1 transition hover:bg-[#F2F6FA]"
            >
              Today
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function getAssessmentClientBaseUrl() {
  const configuredUrl = cleanText(
    import.meta.env.VITE_CLIENT_APP_URL ||
      import.meta.env.VITE_APP_URL ||
      import.meta.env.VITE_PUBLIC_APP_URL ||
      import.meta.env.VITE_FRONTEND_URL,
  );

  if (configuredUrl) {
    return configuredUrl.replace(/\/+$/, "");
  }

  return "https://sibs-hris.getleadsource.com";
}

function buildAssessmentPreviewLink() {
  return SIBS_ASSESSMENT_PUBLIC_LINK;
}

const SIBS_ASSESSMENT_PUBLIC_LINK =
  "https://link.sibscareers.online/l/4HqL27kZ3";

function getCurrentAppOrigin() {
  if (typeof window !== "undefined" && window.location?.origin) {
    return window.location.origin.replace(/\/+$/, "");
  }

  return "https://sibs-hris.getleadsource.com";
}

function safeArray(value) {
  return Array.isArray(value) ? value : [];
}

function getLatestFinalInterviewSubmittedForm(candidate = {}) {
  const forms = safeArray(
    candidate.finalInterviewSubmittedForms ||
      candidate.final_interview_submissions ||
      candidate.finalInterviewSubmissions ||
      candidate.submittedFinalInterviewForms ||
      candidate.submitted_final_interview_forms,
  );

  if (!forms.length) return null;

  return [...forms]
    .filter(Boolean)
    .sort((a, b) => {
      const aTime = new Date(
        a.submittedAtIso ||
          a.submitted_at_iso ||
          a.submittedAt ||
          a.submitted_at ||
          a.createdAt ||
          a.created_at ||
          0,
      ).getTime();

      const bTime = new Date(
        b.submittedAtIso ||
          b.submitted_at_iso ||
          b.submittedAt ||
          b.submitted_at ||
          b.createdAt ||
          b.created_at ||
          0,
      ).getTime();

      return (
        (Number.isFinite(bTime) ? bTime : 0) -
        (Number.isFinite(aTime) ? aTime : 0)
      );
    })[0];
}

function isFinalInterviewFormLink(link = "") {
  return cleanText(link).includes("/recruitment/final-interview-form");
}

function finalInterviewLinkHasSavedDataParams(link = "") {
  const value = cleanText(link);

  if (!value) return false;

  try {
    const parsedUrl = new URL(
      value,
      typeof window !== "undefined"
        ? window.location.origin
        : "https://sibs-hris.getleadsource.com",
    );

    return Boolean(
      parsedUrl.searchParams.get("submissionId") ||
        parsedUrl.searchParams.get("formId"),
    );
  } catch {
    return value.includes("submissionId=") || value.includes("formId=");
  }
}

function resolveFinalInterviewFormLink(link = "") {
  const value = cleanText(link);
  const appOrigin = getCurrentAppOrigin();

  if (!value) return "";

  if (value.startsWith("http://") || value.startsWith("https://")) {
    try {
      const parsedUrl = new URL(value);

      if (parsedUrl.pathname === "/recruitment/final-interview-form") {
        return `${appOrigin}${parsedUrl.pathname}${parsedUrl.search}${parsedUrl.hash}`;
      }

      return value;
    } catch {
      return value;
    }
  }

  if (value.startsWith("/")) {
    return `${appOrigin}${value}`;
  }

  return `${appOrigin}/${value}`;
}

function buildFinalInterviewFormLink(candidate = {}, item = {}) {
  const appOrigin = getCurrentAppOrigin();
  const latestSubmission = getLatestFinalInterviewSubmittedForm(candidate) || {};

  const candidateId =
    cleanText(candidate.candidateId) ||
    cleanText(candidate.candidate_id) ||
    cleanText(latestSubmission.candidateId) ||
    cleanText(latestSubmission.candidate_id) ||
    "";

  const candidateApplicationId =
    cleanText(candidate.candidateApplicationId) ||
    cleanText(candidate.candidate_application_id) ||
    cleanText(candidate.applicationId) ||
    cleanText(candidate.application_id) ||
    cleanText(latestSubmission.candidateApplicationId) ||
    cleanText(latestSubmission.candidate_application_id) ||
    cleanText(candidate.id) ||
    "";

  const positionId =
    cleanText(item.positionId) ||
    cleanText(item.position_id) ||
    cleanText(item.extra?.positionId) ||
    cleanText(item.extra?.position_id) ||
    cleanText(latestSubmission.positionId) ||
    cleanText(latestSubmission.position_id) ||
    cleanText(candidate.positionId) ||
    cleanText(candidate.position_id) ||
    cleanText(candidate.finalInterviewPositionId) ||
    cleanText(candidate.final_interview_position_id) ||
    cleanText(candidate.offerDetails?.positionId) ||
    cleanText(candidate.hiringRequirementId) ||
    "";

  const formId =
    cleanText(item.formId) ||
    cleanText(item.form_id) ||
    cleanText(item.extra?.formId) ||
    cleanText(item.extra?.form_id) ||
    cleanText(latestSubmission.formId) ||
    cleanText(latestSubmission.form_id) ||
    cleanText(candidate.finalInterviewFormId) ||
    cleanText(candidate.final_interview_form_id) ||
    "";

  const submissionId =
    cleanText(item.submissionId) ||
    cleanText(item.submission_id) ||
    cleanText(item.extra?.submissionId) ||
    cleanText(item.extra?.submission_id) ||
    cleanText(latestSubmission.id) ||
    cleanText(latestSubmission.submissionId) ||
    cleanText(latestSubmission.submission_id) ||
    "";

  if (!candidateId && !candidateApplicationId) return "";

  const params = new URLSearchParams();

  if (candidateId) params.set("candidateId", candidateId);
  if (candidateApplicationId) {
    params.set("candidateApplicationId", candidateApplicationId);
  }
  if (positionId) params.set("positionId", positionId);
  if (formId) params.set("formId", formId);
  if (submissionId) params.set("submissionId", submissionId);

  params.set("mode", "view");

  return `${appOrigin}/recruitment/final-interview-form?${params.toString()}`;
}

function getTimelineFinalInterviewFormLink(item = {}, candidate = {}) {
  const possibleSavedLinks = [
    item.savedFormLink,
    item.saved_form_link,
    item.finalInterviewLink,
    item.final_interview_link,
    item.extra?.savedFormLink,
    item.extra?.saved_form_link,
    item.extra?.finalInterviewLink,
    item.extra?.final_interview_link,
  ];

  const savedFinalInterviewLink = possibleSavedLinks.find((link) =>
    isFinalInterviewFormLink(link),
  );

  if (
    savedFinalInterviewLink &&
    finalInterviewLinkHasSavedDataParams(savedFinalInterviewLink)
  ) {
    return resolveFinalInterviewFormLink(savedFinalInterviewLink);
  }

  const stageText = cleanText(item.stage).toLowerCase();
  const reasonText = cleanText(item.reason).toLowerCase();

  const isInterviewLog =
    stageText.includes("interview") ||
    reasonText.includes("interview") ||
    reasonText.includes("job evaluation");

  if (!isInterviewLog && !savedFinalInterviewLink) return "";

  return buildFinalInterviewFormLink(candidate, item);
}

function buildTimelineItemWithFinalInterviewLink(item = {}, candidate = {}) {
  const finalInterviewFormLink = getTimelineFinalInterviewFormLink(
    item,
    candidate,
  );

  if (!finalInterviewFormLink) return item;

  return {
    ...item,
    savedFormLink: finalInterviewFormLink,
    saved_form_link: finalInterviewFormLink,
    assessmentLink: finalInterviewFormLink,
    assessment_link: finalInterviewFormLink,
    extra: {
      ...(item.extra || {}),
      savedFormLink: finalInterviewFormLink,
      saved_form_link: finalInterviewFormLink,
      assessmentLink: finalInterviewFormLink,
      assessment_link: finalInterviewFormLink,
    },
  };
}

function AssessmentEmailFormatModal({
  open,
  candidate,
  form,
  isSending = false,
  onChange,
  onClose,
  onSend,
}) {
  if (!open) return null;

  const candidateName = getAssessmentEmailCandidateName(candidate);
  const roleName = form.roleName || getAssessmentEmailRole(candidate);
  const deadlineText = formatPreviewDeadline(form.emailDeadline);
  const assessmentLink = buildAssessmentPreviewLink(
    candidate,
    form.recipientEmail,
  );

  return (
    <div
      className="fixed inset-0 z-[12000] flex h-dvh items-center justify-center bg-black/45 px-4 py-4"
      onClick={onClose}
    >
      <div
        onClick={(event) => event.stopPropagation()}
        className="flex max-h-[92dvh] w-full max-w-[760px] flex-col overflow-hidden rounded-2xl bg-white shadow-2xl"
      >
        <div className="flex items-start justify-between gap-4 border-b border-[#E6ECF2] bg-white px-6 py-5">
          <div className="min-w-0">
            <h2 className="text-xl font-extrabold text-sibs-primary-1">
              Assessment Email Format
            </h2>
            <p className="mt-1 text-sm font-semibold leading-6 text-sibs-tertiary-5">
              Review the message before sending the online assessment invitation.
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={isSending}
            className="rounded-full p-2 text-[#98A2B3] transition hover:bg-gray-100 hover:text-[#475467] disabled:cursor-not-allowed disabled:opacity-60"
            aria-label="Close assessment email format modal"
          >
            <X size={20} />
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto bg-[#F8FAFC] px-6 py-5">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <label className="block">
              <span className="text-xs font-extrabold uppercase tracking-wide text-sibs-primary-1">
                Recipient Email
              </span>
              <input
                type="email"
                value={form.recipientEmail}
                onChange={(event) =>
                  onChange({
                    ...form,
                    recipientEmail: event.target.value,
                  })
                }
                className="mt-2 h-11 w-full rounded-xl border border-[#D6DEE8] bg-white px-3 text-sm font-bold text-[#344054] outline-none focus:border-sibs-primary-1 focus:ring-4 focus:ring-sibs-primary-1/10"
              />
            </label>

            <label className="block">
              <span className="text-xs font-extrabold uppercase tracking-wide text-sibs-primary-1">
                Assessment Deadline
              </span>
                <div className="mt-2">
                  <AssessmentDeadlineDatePicker
                    value={form.emailDeadline}
                    disabled={isSending}
                    placeholder="Select deadline"
                    onChange={(nextDate) =>
                      onChange({
                        ...form,
                        emailDeadline: nextDate,
                      })
                    }
                  />
                </div>
            </label>

            <label className="block md:col-span-2">
              <span className="text-xs font-extrabold uppercase tracking-wide text-sibs-primary-1">
                Subject
              </span>
              <input
                value={form.emailSubject}
                onChange={(event) =>
                  onChange({
                    ...form,
                    emailSubject: event.target.value,
                  })
                }
                className="mt-2 h-11 w-full rounded-xl border border-[#D6DEE8] bg-white px-3 text-sm font-bold text-[#344054] outline-none focus:border-sibs-primary-1 focus:ring-4 focus:ring-sibs-primary-1/10"
              />
            </label>

            <label className="block md:col-span-2">
              <span className="text-xs font-extrabold uppercase tracking-wide text-sibs-primary-1">
                Role / Position
              </span>
              <input
                value={form.roleName}
                onChange={(event) =>
                  onChange({
                    ...form,
                    roleName: event.target.value,
                  })
                }
                className="mt-2 h-11 w-full rounded-xl border border-[#D6DEE8] bg-white px-3 text-sm font-bold text-[#344054] outline-none focus:border-sibs-primary-1 focus:ring-4 focus:ring-sibs-primary-1/10"
              />
            </label>
          </div>

          <div className="mt-5 rounded-2xl border border-[#D9E2EC] bg-white p-5">
            <div className="mx-auto max-w-[560px] overflow-hidden rounded-sm bg-[#FFF8EF] shadow-sm">
              <div className="bg-white px-8 py-5 text-center">
                <img
                  src="/sibs-logo-navy.svg"
                  alt="SiBS"
                  className="mx-auto h-auto w-[360px] max-w-full"
                  onError={(event) => {
                    event.currentTarget.outerHTML =
                      '<div style="font-size:32px;font-weight:800;color:#003B6F;">SiBS</div>';
                  }}
                />
              </div>

              <div className="px-8 py-6 text-sm leading-6 text-black">
                <p>Hi {candidateName},</p>

                <p className="mt-4">
                  Thank you for your interest in the {roleName} role at SiBS
                  Contact Center! We're thrilled to have you take the next step
                  in our selection process.
                </p>

                <p className="mt-4">
                  Your next step is to complete our online assessment. This is a
                  fantastic opportunity for you to showcase your skills and
                  demonstrate how you handle various customer service scenarios.
                  By completing this assessment, we will get to know you better
                  and understand how we can best support you when you join our
                  team.
                </p>

                <p className="mt-4 font-bold">Here's how to proceed:</p>
                <ol className="ml-5 list-decimal">
                  <li>
                    Click on the following link to access the assessment:{" "}
                    <a
                      href={assessmentLink}
                      target="_blank"
                      rel="noreferrer"
                      className="text-blue-700 underline"
                    >
                      SiBS - Online Assessment
                    </a>
                  </li>
                  <li>Complete the assessment by {deadlineText}.</li>
                  <li>
                    Ensure you have a quiet space and a stable internet
                    connection.
                  </li>
                </ol>

                <p className="mt-4 font-bold">Tips for Success:</p>
                <ul className="ml-5 list-disc">
                  <li>Take your time to read each question carefully.</li>
                  <li>
                    Keep your browser window open and stay within the assessment
                    area during the test. Stepping away too many times could
                    result in being locked out for security reasons.
                  </li>
                  <li>
                    For the best experience, use a laptop or computer in a
                    quiet, distraction-free space throughout the assessment.
                  </li>
                </ul>

                <p className="mt-4">
                  If you have any questions or encounter any issues, feel free to
                  reach out to us at{" "}
                  <span className="text-blue-700 underline">
                    careers@thesiblingssolutions.com
                  </span>{" "}
                  or call us at 09178303126.
                </p>

                <p className="mt-4">
                  We're looking forward to seeing your responses and moving
                  further in the selection process!
                </p>

                <p className="mt-8">
                  Best regards,
                  <br />
                  Talent Acquisition Team
                  <br />
                  SiBS Contact Center
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="flex flex-col-reverse gap-2 border-t border-[#E6ECF2] bg-white px-6 py-4 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={onClose}
            disabled={isSending}
            className="inline-flex h-11 items-center justify-center rounded-xl border border-[#D6DEE8] bg-white px-5 text-sm font-extrabold text-[#475467] transition hover:bg-[#F8FAFC] disabled:cursor-not-allowed disabled:opacity-60"
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={onSend}
            disabled={isSending}
            className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-sibs-primary-1 px-5 text-sm font-extrabold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSending ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              <Mail size={16} />
            )}
            {isSending ? "Sending..." : "Send Assessment Email"}
          </button>
        </div>
      </div>
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
  const [showAssessmentEmailModal, setShowAssessmentEmailModal] = useState(false);
  const [assessmentEmailForm, setAssessmentEmailForm] = useState({
    recipientEmail: "",
    emailSubject: "SiBS Online Assessment Invitation",
    emailDeadline: addDaysToInputDate(7),
    roleName: "",
  });
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

  function handleSendAssessmentEmailClick(event) {
    event.preventDefault();
    event.stopPropagation();

    setAssessmentEmailForm({
      recipientEmail:
        cleanText(
          activeCandidate.assessmentEmailRecipient ||
            activeCandidate.assessment_email_recipient,
        ) ||
        cleanText(activeCandidate.email) ||
        "",
      emailSubject: "SiBS Online Assessment Invitation",
      emailDeadline: addDaysToInputDate(7),
      roleName: getAssessmentEmailRole(activeCandidate),
    });

    setShowAssessmentEmailModal(true);
  }

  async function handleConfirmSendAssessmentEmail(event) {
    event?.preventDefault?.();
    event?.stopPropagation?.();

    if (!candidateNhoUploadId) {
      showStatusModal({
        type: "error",
        title: "Unable to Send",
        message: "Candidate Pipeline ID is missing.",
      });
      return;
    }

    if (!cleanText(assessmentEmailForm.recipientEmail)) {
      showStatusModal({
        type: "error",
        title: "Recipient Required",
        message: "Please enter the recipient email address.",
      });
      return;
    }

    setIsSendingAssessmentEmail(true);

    try {
      const response = await api.post(
        `/api/candidate-pipeline/${encodeURIComponent(
          candidateNhoUploadId,
        )}/assessment/send-email`,
        {
          recipientEmail: assessmentEmailForm.recipientEmail,
          email: assessmentEmailForm.recipientEmail,
          emailSubject: assessmentEmailForm.emailSubject,
          subject: assessmentEmailForm.emailSubject,
          emailDeadline: assessmentEmailForm.emailDeadline,
          deadline: assessmentEmailForm.emailDeadline,
          roleName: assessmentEmailForm.roleName,
          assessmentLink: SIBS_ASSESSMENT_PUBLIC_LINK,
        },
        {
          withCredentials: true,
        },
      );

      const payload = response?.data || {};

      if (payload?.success === false) {
        throw new Error(payload?.message || "Failed to send assessment email.");
      }

      const apiCandidate = getCandidateFromApiPayload(payload) || {};

      syncCandidateAfterAction({
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
        assessmentEmailRecipient:
          apiCandidate.assessmentEmailRecipient ||
          apiCandidate.assessment_email_recipient ||
          assessmentEmailForm.recipientEmail,
        assessment_email_recipient:
          apiCandidate.assessment_email_recipient ||
          apiCandidate.assessmentEmailRecipient ||
          assessmentEmailForm.recipientEmail,
      });

      setShowAssessmentEmailModal(false);

      showStatusModal({
        type: "success",
        title: "Assessment Email Sent",
        message:
          payload?.message ||
          `Assessment email sent successfully to ${assessmentEmailForm.recipientEmail}.`,
      });
    } catch (error) {
      showStatusModal({
        type: "error",
        title: "Send Assessment Email Failed",
        message: getApiErrorMessage(error, "Failed to send assessment email."),
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

  const submittedForms = Array.isArray(activeCandidate.finalInterviewSubmittedForms)
    ? activeCandidate.finalInterviewSubmittedForms
    : [];

  const latestSubmission = [...submittedForms].sort((a, b) => {
    const aTime = new Date(
      a.submittedAtIso ||
        a.submittedAt ||
        a.submitted_at ||
        a.createdAt ||
        a.created_at ||
        0,
    ).getTime();

    const bTime = new Date(
      b.submittedAtIso ||
        b.submittedAt ||
        b.submitted_at ||
        b.createdAt ||
        b.created_at ||
        0,
    ).getTime();

    return (Number.isFinite(bTime) ? bTime : 0) - (Number.isFinite(aTime) ? aTime : 0);
  })[0];

  const positionId =
    activeCandidate.positionId ||
    activeCandidate.finalInterviewPositionId ||
    activeCandidate.offerDetails?.positionId ||
    activeCandidate.hiringRequirementId ||
    latestSubmission?.positionId ||
    latestSubmission?.position_id ||
    "";

  const formId =
    activeCandidate.finalInterviewFormId ||
    activeCandidate.final_interview_form_id ||
    latestSubmission?.formId ||
    latestSubmission?.form_id ||
    (positionId ? `final-interview-${positionId}` : "default-job-evaluation");

  const submissionId =
    latestSubmission?.id ||
    latestSubmission?.submissionId ||
    latestSubmission?.submission_id ||
    "";

  const params = new URLSearchParams();

  params.set("candidateId", activeCandidate.candidateId || "");
  params.set(
    "candidateApplicationId",
    activeCandidate.candidateApplicationId || activeCandidate.id || "",
  );
  params.set("positionId", positionId);
  params.set("formId", formId);
  params.set("mode", "edit");
  params.set("continue", "1");

  if (submissionId) {
    params.set("submissionId", submissionId);
  }

  navigate(`/recruitment/final-interview-form?${params.toString()}`, {
    state: {
      candidate: activeCandidate,
      allowEditSubmitted: true,
    },
  });
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
                          const finalInterviewFormLink = getTimelineFinalInterviewFormLink(
                            item,
                            activeCandidate,
                          );

                          const timelineItem = buildTimelineItemWithFinalInterviewLink(
                            item,
                            activeCandidate,
                          );

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
                                  item={timelineItem}
                                  candidate={activeCandidate}
                                />

                                {finalInterviewFormLink && (
                                  <div className="mt-3">
                                    <p className="text-[11px] font-extrabold uppercase tracking-wide text-sibs-primary-1">
                                      Job Evaluation Link
                                    </p>

                                    <button
                                      type="button"
                                      title={finalInterviewFormLink}
                                      onClick={() => {
                                        window.open(
                                          finalInterviewFormLink,
                                          "_blank",
                                          "noopener,noreferrer",
                                        );
                                      }}
                                      className="mt-2 block w-full min-w-0 truncate rounded-lg border border-blue-100 bg-white px-3 py-2 text-left text-xs font-semibold text-blue-600 underline transition hover:cursor-pointer hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700"
                                    >
                                      {finalInterviewFormLink}
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

      <AssessmentEmailFormatModal
        open={showAssessmentEmailModal}
        candidate={activeCandidate}
        form={assessmentEmailForm}
        isSending={isSendingAssessmentEmail}
        onChange={setAssessmentEmailForm}
        onClose={() => {
          if (!isSendingAssessmentEmail) {
            setShowAssessmentEmailModal(false);
          }
        }}
        onSend={handleConfirmSendAssessmentEmail}
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