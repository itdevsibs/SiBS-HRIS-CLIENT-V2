import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  Check,
  Eye,
  ExternalLink,
  FileImage,
  FileSpreadsheet,
  FileText,
  Loader2,
  Trash2,
  UploadCloud,
} from "lucide-react";

import api from "../../../lib/axios/api-template";
import StatusModal from "../StatusModal";

import CandidateModalSummary from "../../recruitment/candidatePipeline/CandidateModalSummary";
import CandidatePipelineModalShell, {
  CandidateModalPrimaryButton,
  CandidateModalSecondaryButton,
} from "../../recruitment/candidatePipeline/CandidatePipelineModalShell";

const PREVIOUS_EMPLOYMENT_REQUIREMENTS = [
  "BIR 2316 Form",
  "Employment Certificate",
];

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
    requirements: MAJOR_REQUIREMENTS,
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

const ALL_REQUIREMENTS = PRE_EMPLOYMENT_REQUIREMENT_GROUPS.flatMap(
  (group) => group.requirements,
);

const ACCEPTED_FILE_TYPES =
  ".pdf,.doc,.docx,.xls,.xlsx,.csv,.jpg,.jpeg,.png,.gif,.webp,.heic,.heif,.txt";

const MAX_FILE_SIZE_BYTES = 25 * 1024 * 1024;
const ACCEPTED_FILE_EXTENSIONS = new Set(
  ACCEPTED_FILE_TYPES.split(",").map((extension) => extension.trim().toLowerCase()),
);

function getFileExtension(fileName = "") {
  const value = cleanText(fileName).toLowerCase();
  const dotIndex = value.lastIndexOf(".");
  return dotIndex >= 0 ? value.slice(dotIndex) : "";
}

function validateSelectedRequirementFile(file) {
  if (!file) return "No file selected.";

  const extension = getFileExtension(file.name);

  if (!ACCEPTED_FILE_EXTENSIONS.has(extension)) {
    return `Unsupported file: ${file.name}. Allowed: PDF, DOC, DOCX, XLS, XLSX, CSV, JPG, JPEG, PNG, GIF, WEBP, HEIC, HEIF, and TXT.`;
  }

  if (!Number(file.size || 0)) {
    return `Empty file: ${file.name}.`;
  }

  if (Number(file.size) > MAX_FILE_SIZE_BYTES) {
    return `${file.name} exceeds the 25 MB per-file limit.`;
  }

  return "";
}

function cleanText(value) {
  return String(value ?? "").trim();
}

function normalizeRequirement(value) {
  return cleanText(value).toLowerCase().replace(/\s+/g, " ");
}

function normalizeRequirementSlug(value) {
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
    "";

  return getOfficialRequirementMatch(filename);
}

function isOfficialNhoFile(file = {}) {
  return Boolean(getOfficialRequirementFromFile(file));
}

function isMajorRequirement(requirement = "") {
  const key = normalizeRequirement(requirement);

  return MAJOR_REQUIREMENTS.some(
    (majorRequirement) => normalizeRequirement(majorRequirement) === key,
  );
}

function formatFileSize(size = 0) {
  const numberSize = Number(size || 0);

  if (!numberSize) return "—";

  const kb = numberSize / 1024;

  if (kb < 1024) {
    return `${kb.toFixed(1)} KB`;
  }

  return `${(kb / 1024).toFixed(1)} MB`;
}

function formatUploadedDate(value = "") {
  if (!value) return "—";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return String(value);

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

function readFileAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;

    reader.readAsDataURL(file);
  });
}

function isRawBrowserFile(file) {
  return typeof File !== "undefined" && file instanceof File;
}

function normalizeUploadedFile(file = {}) {
  const savedFileName =
    file.savedFileName ||
    file.saved_file_name ||
    file.filename ||
    file.storedFileName ||
    file.stored_file_name ||
    "";

  /*
   * Use the physical server filename for persisted files. Pending browser
   * uploads do not have savedFileName yet, so they continue to show their
   * original local filename until Save completes.
   */
  const fileName =
    savedFileName ||
    file.fileName ||
    file.name ||
    file.originalName ||
    file.originalname ||
    "";

  const fileUrl =
    file.fileUrl ||
    file.url ||
    file.dataUrl ||
    file.previewUrl ||
    file.downloadUrl ||
    "";

  const filePath =
    file.filePath || file.storedPath || file.stored_path || file.path || "";

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
      `${officialRequirement || "FILE"}-${Date.now()}-${Math.random()
        .toString(36)
        .slice(2, 8)}`,
    requirement:
      officialRequirement ||
      file.requirement ||
      file.label ||
      file.category ||
      "",
    fileName,
    savedFileName,
    filename: file.filename || savedFileName,
    fileSize: file.fileSize || file.size || file.file_size || 0,
    fileType:
      file.fileType ||
      file.type ||
      file.mimetype ||
      file.mimeType ||
      file.file_type ||
      "application/octet-stream",
    fileUrl,
    filePath,
    storedPath: file.storedPath || file.stored_path || filePath,
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
      file.folder_name ||
      "",
    rawFile: file.rawFile || null,
  };
}

function normalizeOfficialUploadedFile(file = {}) {
  if (!isOfficialNhoFile(file)) return null;

  return normalizeUploadedFile(file);
}

function filterOfficialUploadedFiles(files = []) {
  return files
    .filter(Boolean)
    .map(normalizeOfficialUploadedFile)
    .filter(Boolean);
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
  if (Array.isArray(responsePayload?.data?.candidate?.nhoFiles)) {
    return responsePayload.data.candidate.nhoFiles;
  }
  if (Array.isArray(responsePayload?.data?.candidate?.nho_files)) {
    return responsePayload.data.candidate.nho_files;
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

function calculateProgress(files = [], requirements = ALL_REQUIREMENTS) {
  const uploadedRequirementMap = new Map();

  filterOfficialUploadedFiles(files).forEach((file) => {
    const key = normalizeRequirement(file?.requirement);

    if (key) {
      uploadedRequirementMap.set(key, file);
    }
  });

  const completed = requirements.filter((requirement) =>
    uploadedRequirementMap.has(normalizeRequirement(requirement)),
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

function calculateMajorProgress(files = []) {
  return calculateProgress(files, MAJOR_REQUIREMENTS);
}

function getMajorProgressFromApiPayload(payload, fallbackFiles = []) {
  const responsePayload = payload?.data ?? payload;

  return (
    responsePayload?.majorProgress ||
    responsePayload?.data?.majorProgress ||
    responsePayload?.candidate?.majorNhoUploadProgress ||
    responsePayload?.candidate?.major_nho_upload_progress ||
    responsePayload?.data?.candidate?.majorNhoUploadProgress ||
    responsePayload?.data?.candidate?.major_nho_upload_progress ||
    calculateMajorProgress(fallbackFiles)
  );
}

function getRoutedStageFromApiPayload(payload) {
  const responsePayload = payload?.data ?? payload;

  return (
    responsePayload?.routedStage ||
    responsePayload?.data?.routedStage ||
    responsePayload?.candidate?.currentStage ||
    responsePayload?.candidate?.current_stage ||
    responsePayload?.candidate?.currentPipelineStage ||
    responsePayload?.candidate?.current_pipeline_stage ||
    responsePayload?.data?.candidate?.currentStage ||
    responsePayload?.data?.candidate?.current_stage ||
    responsePayload?.data?.candidate?.currentPipelineStage ||
    responsePayload?.data?.candidate?.current_pipeline_stage ||
    responsePayload?.data?.currentStage ||
    responsePayload?.data?.current_stage ||
    ""
  );
}

function dedupeFiles(files = []) {
  const map = new Map();

  filterOfficialUploadedFiles(files).forEach((normalizedFile) => {
    const requirementKey = normalizeRequirement(normalizedFile.requirement);
    const fileIdentity = cleanText(
      normalizedFile.storedPath ||
        normalizedFile.filePath ||
        normalizedFile.savedFileName ||
        normalizedFile.filename ||
        normalizedFile.fileUrl ||
        normalizedFile.id ||
        normalizedFile.fileName,
    ).toLowerCase();

    if (!requirementKey || !fileIdentity) return;

    const key = `${requirementKey}::${fileIdentity}`;

    if (!map.has(key)) {
      map.set(key, normalizedFile);
    }
  });

  return Array.from(map.values());
}

function getRequirementSortIndex(requirement = "") {
  const requirementKey = normalizeRequirement(requirement);

  const index = ALL_REQUIREMENTS.findIndex(
    (item) => normalizeRequirement(item) === requirementKey,
  );

  return index === -1 ? 9999 : index;
}

function sortUploadedFiles(files = []) {
  return filterOfficialUploadedFiles(files)
    .filter((file) => file?.fileName || file?.fileUrl)
    .slice()
    .sort((a, b) => {
      const requirementSort =
        getRequirementSortIndex(a.requirement) -
        getRequirementSortIndex(b.requirement);

      if (requirementSort !== 0) return requirementSort;

      return cleanText(a.fileName).localeCompare(cleanText(b.fileName));
    });
}

function RequirementCard({
  requirement,
  uploadedFiles = [],
  disabled = false,
  onUpload,
  onSelect,
  onRemove,
  onValidationError,
}) {
  const inputRef = useRef(null);
  const hasFiles = uploadedFiles.length > 0;
  const major = isMajorRequirement(requirement);

  async function handleFileChange(event) {
    const selectedFiles = Array.from(event.target.files || []);

    if (selectedFiles.length === 0) return;

    const validFiles = [];
    const errors = [];

    for (const file of selectedFiles) {
      const validationError = validateSelectedRequirementFile(file);

      if (validationError) {
        errors.push(validationError);
        continue;
      }

      const fileUrl = await readFileAsDataUrl(file);

      validFiles.push(
        normalizeUploadedFile({
          id: `FILE-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
          requirement,
          fileName: file.name,
          savedFileName: "",
          filename: "",
          fileSize: file.size,
          fileType: file.type || "application/octet-stream",
          fileUrl,
          filePath: "",
          storedPath: "",
          uploadedAt: new Date().toISOString(),
          rawFile: file,
        }),
      );
    }

    if (validFiles.length > 0) {
      onUpload(requirement, validFiles);
    }

    if (errors.length > 0) {
      onValidationError?.(errors.join("\n"));
    }

    event.target.value = "";
  }

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

            <div className="flex shrink-0 items-center gap-2">
              {major && (
                <span className="rounded-full border border-blue-100 bg-blue-50 px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-wide text-sibs-primary-1">
                  Major
                </span>
              )}

              {hasFiles && (
                <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-extrabold text-emerald-700">
                  {uploadedFiles.length} file{uploadedFiles.length === 1 ? "" : "s"}
                </span>
              )}
            </div>
          </div>

          {hasFiles ? (
            <div className="mt-3 space-y-2">
              {uploadedFiles.map((uploadedFile) => {
                const FileIcon = getFileIcon(uploadedFile.fileName);

                return (
                  <div
                    key={`${uploadedFile.id}-${uploadedFile.fileName}-${uploadedFile.fileUrl}`}
                    className="flex min-w-0 items-center gap-2 rounded-xl border border-emerald-100 bg-white px-3 py-2"
                  >
                    <button
                      type="button"
                      disabled={disabled}
                      onClick={() => onSelect(uploadedFile)}
                      className="flex min-w-0 flex-1 items-center gap-2 text-left disabled:cursor-not-allowed disabled:opacity-70"
                    >
                      <FileIcon size={17} className="shrink-0 text-emerald-700" />

                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-xs font-extrabold text-emerald-800">
                          {uploadedFile.fileName || "Uploaded file"}
                        </span>

                        <span className="mt-0.5 block truncate text-[11px] font-bold text-emerald-700/80">
                          {formatFileSize(uploadedFile.fileSize)}
                        </span>
                      </span>
                    </button>

                    <button
                      type="button"
                      disabled={disabled}
                      onClick={() => onRemove(uploadedFile)}
                      className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-red-100 bg-red-50 text-red-600 transition hover:bg-red-100 disabled:opacity-60"
                      title="Remove this file"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="mt-3 rounded-xl border border-dashed border-[#C9D6E4] bg-white px-3 py-3 text-xs font-bold text-sibs-tertiary-5">
              No uploaded file yet.
            </div>
          )}
        </div>
      </div>

      <button
        type="button"
        disabled={disabled}
        onClick={() => inputRef.current?.click()}
        className={`mt-3 flex h-11 w-full items-center justify-between rounded-xl border border-dashed px-3 text-left text-xs font-extrabold transition disabled:cursor-not-allowed disabled:opacity-70 ${
          hasFiles
            ? "border-emerald-200 bg-white text-emerald-700 hover:bg-emerald-50"
            : "border-[#B9C7D6] bg-white text-sibs-primary-1 hover:bg-[#F3F8FF]"
        }`}
      >
        <span className="truncate">
          {hasFiles ? "Add more files" : "Upload files for this requirement"}
        </span>

        <UploadCloud size={17} className="shrink-0" />
      </button>

      <input
        ref={inputRef}
        type="file"
        multiple
        accept={ACCEPTED_FILE_TYPES}
        disabled={disabled}
        onChange={handleFileChange}
        className="hidden"
      />
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
          Select an uploaded file from the list to preview its details here.
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
            title={file.fileName}
            className="mt-1 break-words text-base font-extrabold text-[#101828]"
          >
            {file.fileName || "Uploaded file"}
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
            {file.requirement || "—"}
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
            alt={file.fileName}
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

function UploadedFilesList({ files = [], disabled = false, onSelect, onRemove }) {
  const uploadedFiles = useMemo(() => sortUploadedFiles(files), [files]);

  return (
    <div className="border-t border-[#E6ECF2] pt-5">
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h4 className="text-base font-extrabold text-sibs-primary-1">
            Uploaded Files List
          </h4>

          <p className="mt-1 text-sm font-semibold leading-6 text-sibs-tertiary-5">
            Complete list of official NHO files uploaded under the
            pre-employment requirements.
          </p>
        </div>

        <span className="inline-flex w-fit rounded-full bg-[#F2F6FA] px-3 py-1 text-xs font-extrabold text-sibs-primary-1">
          {uploadedFiles.length} upload{uploadedFiles.length === 1 ? "" : "s"}
        </span>
      </div>

      {uploadedFiles.length === 0 ? (
        <div className="rounded-xl border border-dashed border-[#C9D6E4] bg-[#F8FAFC] p-5 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-white text-sibs-primary-1 shadow-sm">
            <FileText size={23} />
          </div>

          <p className="mt-3 text-sm font-extrabold text-[#101828]">
            No uploaded files yet
          </p>

          <p className="mt-1 text-xs font-semibold leading-5 text-sibs-tertiary-5">
            Official uploaded files will appear here after selecting a
            requirement file.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {uploadedFiles.map((file) => {
            const FileIcon = getFileIcon(file.fileName);
            const resolvedFileUrl = getResolvedFileUrl(file.fileUrl);

            return (
              <div
                key={`${file.requirement}-${file.id}-${file.fileName}`}
                className="rounded-xl border border-[#E6ECF2] bg-[#F8FAFC] p-3 transition hover:border-sibs-primary-1/30 hover:bg-white"
              >
                <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                  <button
                    type="button"
                    disabled={disabled}
                    onClick={() => onSelect?.(file)}
                    className="flex min-w-0 flex-1 items-start gap-3 text-left disabled:cursor-not-allowed disabled:opacity-70"
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
                          {file.requirement || "Uploaded Requirement"}
                        </p>

                        {isMajorRequirement(file.requirement) && (
                          <span className="rounded-full border border-blue-100 bg-blue-50 px-2 py-0.5 text-[9px] font-extrabold uppercase text-sibs-primary-1">
                            Major
                          </span>
                        )}
                      </div>

                      <p
                        title={file.fileName}
                        className="mt-1 truncate text-sm font-extrabold text-[#101828]"
                      >
                        {file.fileName || "Uploaded file"}
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
                      disabled={disabled}
                      onClick={() => onSelect?.(file)}
                      className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-[#D6DEE8] bg-white px-4 text-xs font-extrabold text-sibs-primary-1 transition hover:bg-[#F3F8FF] disabled:cursor-not-allowed disabled:opacity-70"
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

                    <button
                      type="button"
                      disabled={disabled}
                      onClick={() => onRemove?.(file)}
                      className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-red-100 bg-red-50 text-red-600 transition hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-70"
                      title="Remove file"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default function NhoUploadModal({
  open,
  onClose,
  candidateId = "",
  candidateName = "Candidate",
  candidateEmail = "",
  initialFiles = [],
  currentFile = null,
  previousEmploymentEnabled: _initialPreviousEmploymentEnabled = true,
  onSave,
}) {
  const onSaveRef = useRef(onSave);
  const initialFilesRef = useRef(initialFiles);
  const currentFileRef = useRef(currentFile);
  const latestRequestRef = useRef(0);
  const previewPanelRef = useRef(null);

  const [files, setFiles] = useState([]);
  const [selectedFile, setSelectedFile] = useState(null);
  const [isLoadingFiles, setIsLoadingFiles] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [loadError, setLoadError] = useState("");
  const [saveError, setSaveError] = useState("");
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deletingFile, setDeletingFile] = useState(false);
  const [deleteStatus, setDeleteStatus] = useState({ open: false, type: "success", title: "", message: "" });

  useEffect(() => {
    onSaveRef.current = onSave;
  }, [onSave]);

  useEffect(() => {
    initialFilesRef.current = initialFiles;
  }, [initialFiles]);

  useEffect(() => {
    currentFileRef.current = currentFile;
  }, [currentFile]);

  const uploadedRequirementMap = useMemo(() => {
    const map = new Map();

    filterOfficialUploadedFiles(files).forEach((file) => {
      const key = normalizeRequirement(file.requirement);

      if (!key) return;

      if (!map.has(key)) {
        map.set(key, []);
      }

      map.get(key).push(file);
    });

    return map;
  }, [files]);

  const overallProgress = useMemo(() => {
    return calculateProgress(files, ALL_REQUIREMENTS);
  }, [files]);

  const majorProgress = useMemo(() => {
    return calculateMajorProgress(files);
  }, [files]);

  const completedRequirements = overallProgress.completed;
  const progressPercent = overallProgress.percent;

  useEffect(() => {
    if (!open) return undefined;

    const requestId = Date.now();
    latestRequestRef.current = requestId;

    let isMounted = true;

    async function loadFiles() {
      setLoadError("");
      setSaveError("");
      setIsSaving(false);

      const normalizedInitialFiles = filterOfficialUploadedFiles(
        Array.isArray(initialFilesRef.current) ? initialFilesRef.current : [],
      );

      const normalizedCurrentFile =
        currentFileRef.current && isOfficialNhoFile(currentFileRef.current)
          ? normalizeUploadedFile(currentFileRef.current)
          : null;

      setFiles(normalizedInitialFiles);
      setSelectedFile(normalizedCurrentFile || normalizedInitialFiles[0] || null);

      if (!candidateId) {
        setLoadError(
          "Candidate ID is missing. Saved backend files cannot be loaded.",
        );
        return;
      }

      setIsLoadingFiles(true);

      try {
        const response = await api.get(
          `/api/candidate-pipeline/${encodeURIComponent(candidateId)}/nho/files`,
          {
            withCredentials: true,
            params: {
              /*
               * Pre-Employment File Uploads supports multiple files per
               * requirement. Request every physical file saved for the
               * candidate instead of the default one-current-file-per-
               * requirement response.
               */
              includeAllFiles: 1,
              _t: Date.now(),
            },
          },
        );

        if (!isMounted || latestRequestRef.current !== requestId) return;

        const apiFiles = filterOfficialUploadedFiles(
          getFilesFromApiPayload(response),
        );

        const finalFiles = dedupeFiles([...normalizedInitialFiles, ...apiFiles]);

        const selectedFromCurrent =
          normalizedCurrentFile &&
          finalFiles.find(
            (file) =>
              file.id === normalizedCurrentFile.id ||
              normalizeRequirement(file.requirement) ===
                normalizeRequirement(normalizedCurrentFile.requirement),
          );

        setFiles(finalFiles);
        setSelectedFile(selectedFromCurrent || finalFiles[0] || null);
      } catch (error) {
        if (!isMounted || latestRequestRef.current !== requestId) return;

        setLoadError(
          getApiErrorMessage(
            error,
            "Unable to load saved pre-employment files.",
          ),
        );
      } finally {
        if (isMounted && latestRequestRef.current === requestId) {
          setIsLoadingFiles(false);
        }
      }
    }

    loadFiles();

    return () => {
      isMounted = false;
    };
  }, [open, candidateId]);

  if (!open) return null;

  function handleUpload(requirement, filePayloads = []) {
    setFiles((previous) => {
      const nextFilesForRequirement = (Array.isArray(filePayloads)
        ? filePayloads
        : [filePayloads]
      ).map((filePayload) =>
        normalizeUploadedFile({
          ...filePayload,
          requirement,
        }),
      );

      const nextFiles = dedupeFiles([
        ...previous,
        ...nextFilesForRequirement,
      ]);

      setSelectedFile(nextFilesForRequirement[0] || nextFiles[0] || null);

      return nextFiles;
    });
  }

  function removeLocalFile(
    fileToRemove,
    responseFiles = null,
  ) {
    const id =
      cleanText(fileToRemove?.id);

    const identity =
      cleanText(
        fileToRemove?.storedPath ||
          fileToRemove?.filePath ||
          fileToRemove?.savedFileName ||
          fileToRemove?.filename ||
          fileToRemove?.fileUrl ||
          fileToRemove?.fileName,
      ).toLowerCase();

    const nextFromResponse =
      Array.isArray(responseFiles)
        ? dedupeFiles(responseFiles)
        : null;

    setFiles((previous) => {
      const next =
        nextFromResponse ||
        previous.filter((file) => {
          if (
            id &&
            cleanText(file?.id) ===
              id
          ) {
            return false;
          }

          const itemIdentity =
            cleanText(
              file?.storedPath ||
                file?.filePath ||
                file?.savedFileName ||
                file?.filename ||
                file?.fileUrl ||
                file?.fileName,
            ).toLowerCase();

          return (
            itemIdentity !==
            identity
          );
        });

      setSelectedFile(
        (current) => {
          const currentIdentity =
            cleanText(
              current?.storedPath ||
                current?.filePath ||
                current?.savedFileName ||
                current?.filename ||
                current?.fileUrl ||
                current?.fileName,
            ).toLowerCase();

          const currentRemoved =
            (id &&
              cleanText(current?.id) ===
                id) ||
            (identity &&
              currentIdentity ===
                identity);

          if (currentRemoved) {
            /*
             * Prefer another remaining file from the SAME requirement so the
             * preview does not jump to an unrelated requirement.
             */
            const sameRequirementFile =
              next.find(
                (candidateFile) =>
                  normalizeRequirement(
                    candidateFile.requirement,
                  ) ===
                  normalizeRequirement(
                    fileToRemove?.requirement,
                  ),
              );

            return (
              sameRequirementFile ||
              next[0] ||
              null
            );
          }

          /*
           * If the response replaced objects with freshly loaded versions,
           * keep the selected file only when it still exists.
           */
          if (current) {
            const stillExists =
              next.find(
                (candidateFile) => {
                  const candidateIdentity =
                    cleanText(
                      candidateFile?.storedPath ||
                        candidateFile?.filePath ||
                        candidateFile?.savedFileName ||
                        candidateFile?.filename ||
                        candidateFile?.fileUrl ||
                        candidateFile?.fileName,
                    ).toLowerCase();

                  return (
                    (cleanText(current?.id) &&
                      cleanText(candidateFile?.id) ===
                        cleanText(current?.id)) ||
                    (currentIdentity &&
                      candidateIdentity ===
                        currentIdentity)
                  );
                },
              );

            if (stillExists) {
              return stillExists;
            }
          }

          return (
            next[0] ||
            null
          );
        },
      );

      return next;
    });
  }

  function handleRemove(fileToRemove) {
    if (fileToRemove) setDeleteTarget(fileToRemove);
  }

  async function confirmDeleteFile() {
    const file = deleteTarget;
    if (!file || deletingFile) return;
    setDeleteTarget(null);

    if (file.rawFile) {
      removeLocalFile(file);
      setDeleteStatus({ open: true, type: "success", title: "File Removed", message: "The pending file was removed from the upload list." });
      return;
    }

    setDeletingFile(true);
    try {
      const identity = cleanText(file?.storedPath || file?.filePath || file?.savedFileName || file?.filename || file?.fileUrl || file?.fileName).toLowerCase();
      const response = await api.delete(
        `/api/candidate-pipeline/${encodeURIComponent(
          candidateId,
        )}/nho/files/${encodeURIComponent(
          cleanText(file?.id) ||
            identity,
        )}`,
        {
          withCredentials: true,
          data: {
            fileIdentity:
              identity,
            storedPath:
              file?.storedPath ||
              "",
            filePath:
              file?.filePath ||
              "",
            savedFileName:
              file?.savedFileName ||
              file?.filename ||
              "",
            requirement:
              file?.requirement ||
              "",
          },
        },
      );

      const payload =
        response?.data ??
        response;

      if (payload?.success === false) {
        throw new Error(
          payload?.message ||
            "Unable to delete file.",
        );
      }

      /*
       * Always refresh the complete physical file list after a permanent
       * delete. The normal DELETE metadata response may come from an older
       * deployment or historical DB state that previously collapsed multiple
       * files under one requirement.
       */
      const refreshedResponse =
        await api.get(
          `/api/candidate-pipeline/${encodeURIComponent(
            candidateId,
          )}/nho/files`,
          {
            withCredentials: true,
            params: {
              includeAllFiles: 1,
              _t: Date.now(),
            },
          },
        );

      const refreshedFiles =
        filterOfficialUploadedFiles(
          getFilesFromApiPayload(
            refreshedResponse,
          ),
        );

      removeLocalFile(
        file,
        refreshedFiles,
      );

      setDeleteStatus({
        open: true,
        type: "success",
        title: "File Deleted",
        message:
          payload?.message ||
          "The file was permanently deleted.",
      });
    } catch (error) {
      setDeleteStatus({ open: true, type: "error", title: "Delete Failed", message: getApiErrorMessage(error, "Unable to delete the physical file. No changes were made.") });
    } finally {
      setDeletingFile(false);
    }
  }

  function handleSelectFileForPreview(file) {
    setSelectedFile(file);

    window.setTimeout(() => {
      previewPanelRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "nearest",
      });
    }, 50);
  }

  async function saveUploadsToBackend() {
    const officialFiles = filterOfficialUploadedFiles(files);
    const currentOverallProgress = calculateProgress(officialFiles);
    const currentMajorProgress = calculateMajorProgress(officialFiles);

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

    formData.append("completed", String(currentOverallProgress.completed));
    formData.append("total", String(currentOverallProgress.total));
    formData.append("percent", String(currentOverallProgress.percent));

    formData.append("majorCompleted", String(currentMajorProgress.completed));
    formData.append("majorTotal", String(currentMajorProgress.total));
    formData.append("majorPercent", String(currentMajorProgress.percent));
    formData.append("majorComplete", String(currentMajorProgress.isComplete));

    formData.append("previousEmploymentEnabled", "true");

    const response = await api.post(
      `/api/candidate-pipeline/${encodeURIComponent(candidateId)}/nho/files`,
      formData,
      {
        withCredentials: true,
        headers: {
          "Content-Type": "multipart/form-data",
        },
      },
    );

    return response?.data;
  }

  async function handleSaveUploads() {
    setSaveError("");

    try {
      setIsSaving(true);

      const officialFiles = filterOfficialUploadedFiles(files);

      if (candidateId) {
        const response = await saveUploadsToBackend();

        if (!response?.success) {
          throw new Error(response?.message || "Failed to save uploads.");
        }

        const responseFiles = getFilesFromApiPayload(response);
        const savedFiles = responseFiles.length
          ? filterOfficialUploadedFiles(responseFiles)
          : officialFiles;

        const savedProgress = calculateProgress(savedFiles);
        const savedMajorProgress =
          getMajorProgressFromApiPayload(response, savedFiles) ||
          calculateMajorProgress(savedFiles);

        const routedStage = getRoutedStageFromApiPayload(response);

        onSaveRef.current?.({
          files: savedFiles,

          completed:
            response?.data?.progress?.completed ?? savedProgress.completed,
          total: response?.data?.progress?.total ?? savedProgress.total,
          percent: response?.data?.progress?.percent ?? savedProgress.percent,

          majorCompleted:
            response?.data?.majorProgress?.completed ??
            savedMajorProgress.completed,
          majorTotal:
            response?.data?.majorProgress?.total ?? savedMajorProgress.total,
          majorPercent:
            response?.data?.majorProgress?.percent ??
            savedMajorProgress.percent,
          majorProgress: savedMajorProgress,

          routedStage,
          previousEmploymentEnabled: true,
          candidate: getCandidateFromApiPayload(response),
          response,
        });

        window.dispatchEvent(
          new CustomEvent("ta-pipeline-candidates-updated", {
            detail: {
              candidate: getCandidateFromApiPayload(response),
              files: savedFiles,
              majorProgress: savedMajorProgress,
              routedStage,
            },
          }),
        );

        window.dispatchEvent(
          new CustomEvent("ta-talent-pool-updated", {
            detail: {
              candidate: getCandidateFromApiPayload(response),
              files: savedFiles,
              majorProgress: savedMajorProgress,
              routedStage,
            },
          }),
        );

        onClose?.();
        return;
      }

      const progress = calculateProgress(officialFiles);
      const fallbackMajorProgress = calculateMajorProgress(officialFiles);

      onSaveRef.current?.({
        files: officialFiles,
        completed: progress.completed,
        total: progress.total,
        percent: progress.percent,
        majorCompleted: fallbackMajorProgress.completed,
        majorTotal: fallbackMajorProgress.total,
        majorPercent: fallbackMajorProgress.percent,
        majorProgress: fallbackMajorProgress,
        previousEmploymentEnabled: true,
      });

      onClose?.();
    } catch (error) {
      setSaveError(getApiErrorMessage(error, "Failed to save uploads."));
    } finally {
      setIsSaving(false);
    }
  }

  const busy = isSaving || deletingFile;

  const footer = (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <p className="min-w-0 text-xs font-bold leading-5 text-sibs-tertiary-5">
        {majorProgress.completed} of {majorProgress.total} major requirements submitted. {completedRequirements} of {ALL_REQUIREMENTS.length} total requirements submitted.
      </p>

      <div className="flex shrink-0 flex-col-reverse gap-2 sm:flex-row">
        <CandidateModalSecondaryButton
          type="button"
          disabled={busy}
          onClick={onClose}
        >
          Cancel
        </CandidateModalSecondaryButton>

        <CandidateModalPrimaryButton
          type="button"
          disabled={busy || isLoadingFiles}
          onClick={handleSaveUploads}
          className="min-w-[132px]"
        >
          {isSaving && <Loader2 size={15} className="animate-spin" />}
          {isSaving ? "Saving..." : "Save Uploads"}
        </CandidateModalPrimaryButton>
      </div>
    </div>
  );

  return (
    <>
      <CandidatePipelineModalShell
        open={open}
        icon={UploadCloud}
        title="Pre-Employment Requirements"
        subtitle="Upload, review, and monitor candidate pre-employment requirements."
        badge="NHO Files"
        onClose={onClose}
        closeDisabled={busy}
        maxWidth="max-w-6xl"
        zIndex="z-[10010]"
        footer={footer}
      >
        <div className={busy ? "pointer-events-none opacity-70" : ""}>
          <div className="grid grid-cols-1 gap-5 xl:grid-cols-[minmax(0,1fr)_360px]">
            <div className="min-w-0 space-y-5">
              <section className="rounded-2xl border border-[#D9E2EC] bg-white p-5 shadow-sm">
                <CandidateModalSummary
                  candidate={{
                    name: candidateName,
                    email: candidateEmail,
                    candidateId,
                    currentStage: "For NHO",
                  }}
                  stage="For NHO"
                  showAssignment={false}
                />

                <div className="mt-4 flex flex-wrap items-center gap-2">
                  <span className={`rounded-full px-3 py-1 text-[10px] font-extrabold ${majorProgress.isComplete ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"}`}>
                    {majorProgress.completed} / {majorProgress.total} Major
                  </span>
                  <span className="rounded-full bg-blue-50 px-3 py-1 text-[10px] font-extrabold text-sibs-primary-1">
                    {completedRequirements} / {ALL_REQUIREMENTS.length} Total
                  </span>
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
                    <span>{progressPercent}%</span>
                  </div>

                  <div className="h-2 overflow-hidden rounded-full bg-[#EEF4FA]">
                    <div
                      className="h-full rounded-full bg-sibs-primary-1/70 transition-all duration-300"
                      style={{ width: `${progressPercent}%` }}
                    />
                  </div>
                </div>

                {!majorProgress.isComplete && (
                  <div className="mt-4 rounded-xl border border-amber-100 bg-amber-50 px-4 py-3 text-sm font-bold leading-6 text-amber-700">
                    Candidate has fewer than 5 major requirements. After saving,
                    this candidate should stay under{" "}
                    <span className="font-extrabold">
                      For Onboarding - Incomplete Requirements
                    </span>{" "}
                    for Talent Pool follow-up.
                  </div>
                )}

                {majorProgress.isComplete && (
                  <div className="mt-4 rounded-xl border border-emerald-100 bg-emerald-50 px-4 py-3 text-sm font-bold leading-6 text-emerald-700">
                    Candidate completed the 5 major requirements. After saving,
                    this candidate can proceed to Onboarding.
                  </div>
                )}

                {isLoadingFiles && (
                  <div className="mt-4 flex items-center gap-2 rounded-xl border border-blue-100 bg-blue-50 px-4 py-3 text-sm font-bold text-blue-700">
                    <Loader2 size={16} className="animate-spin" />
                    Loading saved official files from backend...
                  </div>
                )}

                {loadError && (
                  <div className="mt-4 rounded-xl border border-amber-100 bg-amber-50 px-4 py-3 text-sm font-bold leading-6 text-amber-700">
                    {loadError}
                  </div>
                )}

                {saveError && (
                  <div className="mt-4 rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm font-bold leading-6 text-red-600">
                    {saveError}
                  </div>
                )}

                {!candidateId && (
                  <div className="mt-4 rounded-xl border border-amber-100 bg-amber-50 px-4 py-3 text-sm font-bold leading-6 text-amber-700">
                    Candidate ID is missing. Uploads will only be saved through
                    the parent component fallback.
                  </div>
                )}
              </section>

              <section className="rounded-2xl border border-[#D9E2EC] bg-white p-5 shadow-sm">
                <h3 className="text-lg font-extrabold text-[#101828]">
                  Pre-Employment Requirements
                </h3>

                <div className="mt-5 space-y-6">
                  {PRE_EMPLOYMENT_REQUIREMENT_GROUPS.map((group) => {
                    const groupCompleted = group.requirements.filter(
                      (requirement) =>
                        uploadedRequirementMap.has(
                          normalizeRequirement(requirement),
                        ),
                    ).length;

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
                          {group.requirements.map((requirement) => {
                            const uploadedFiles =
                              uploadedRequirementMap.get(
                                normalizeRequirement(requirement),
                              ) || [];

                            return (
                              <RequirementCard
                                key={requirement}
                                requirement={requirement}
                                uploadedFiles={uploadedFiles}
                                disabled={isSaving || deletingFile || isLoadingFiles}
                                onUpload={handleUpload}
                                onSelect={handleSelectFileForPreview}
                                onRemove={handleRemove}
                                onValidationError={setSaveError}
                              />
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}

                  <UploadedFilesList
                    files={files}
                    disabled={isSaving || deletingFile || isLoadingFiles}
                    onSelect={handleSelectFileForPreview}
                    onRemove={handleRemove}
                  />
                </div>
              </section>
            </div>

            <aside ref={previewPanelRef} className="xl:sticky xl:top-0 xl:self-start">
              <FilePreviewPanel file={selectedFile} />
            </aside>
          </div>
        </div>
      </CandidatePipelineModalShell>

          <StatusModal open={Boolean(deleteTarget)} type="confirm" title="Delete File?" message={`This will permanently remove ${deleteTarget?.fileName || deleteTarget?.savedFileName || "the selected document"} from the Candidate Pipeline server folder. This action cannot be undone.`} confirmLabel="Delete Permanently" cancelLabel="Cancel" variant="center" onConfirm={confirmDeleteFile} onCancel={() => setDeleteTarget(null)} lockScroll={false} />
      <StatusModal open={deleteStatus.open} type={deleteStatus.type} title={deleteStatus.title} message={deleteStatus.message} variant="center" onClose={() => setDeleteStatus((value) => ({ ...value, open: false }))} lockScroll={false} />
    </>
  );
}
