import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  Check,
  FileImage,
  FileSpreadsheet,
  FileText,
  Loader2,
  Trash2,
  UploadCloud,
  X,
} from "lucide-react";

import api from "../../../lib/axios/api-template";

const PREVIOUS_EMPLOYMENT_REQUIREMENTS = [
  "BIR 2316 Form",
  "Employment Certificate",
];

const PRE_EMPLOYMENT_REQUIREMENT_GROUPS = [
  {
    id: "major",
    title: "Major Requirements",
    requirements: [
      "Transcript of Records and/or Diploma",
      "Medical Records",
      "NBI Clearance",
      "Birth Certificate",
      "Valid ID",
    ],
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

const ACCEPTED_FILE_TYPES =
  ".pdf,.doc,.docx,.xls,.xlsx,.csv,.jpg,.jpeg,.png,.gif,.webp,.heic,.heif";

function cleanText(value) {
  return String(value ?? "").trim();
}

function normalizeRequirement(value) {
  return cleanText(value).toLowerCase().replace(/\s+/g, " ");
}

function isPreviousEmploymentRequirement(requirement) {
  const requirementKey = normalizeRequirement(requirement);

  return PREVIOUS_EMPLOYMENT_REQUIREMENTS.some(
    (item) => normalizeRequirement(item) === requirementKey,
  );
}

function getActiveRequirementGroups(previousEmploymentEnabled) {
  return PRE_EMPLOYMENT_REQUIREMENT_GROUPS.map((group) => {
    if (group.id !== "previous-employment") return group;

    return {
      ...group,
      requirements: previousEmploymentEnabled ? group.requirements : [],
    };
  });
}

function getActiveRequirements(previousEmploymentEnabled) {
  return getActiveRequirementGroups(previousEmploymentEnabled).flatMap(
    (group) => group.requirements,
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

function getFileIcon(fileName = "") {
  const value = String(fileName || "").toLowerCase();

  if (/\.(jpg|jpeg|png|gif|webp|heic|heif)$/i.test(value)) {
    return FileImage;
  }

  if (/\.(xls|xlsx|csv)$/i.test(value)) {
    return FileSpreadsheet;
  }

  return FileText;
}

function readFileAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;

    reader.readAsDataURL(file);
  });
}

function normalizeUploadedFile(file = {}) {
  return {
    id:
      file.id ||
      `FILE-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    requirement: file.requirement || "",
    fileName: file.fileName || file.name || "",
    savedFileName: file.savedFileName || file.filename || "",
    filename: file.filename || file.savedFileName || "",
    fileSize: file.fileSize || file.size || 0,
    fileType: file.fileType || file.type || "",
    fileUrl: file.fileUrl || file.url || file.dataUrl || "",
    filePath: file.filePath || file.storedPath || file.path || "",
    storedPath: file.storedPath || file.filePath || file.path || "",
    uploadedAt: file.uploadedAt || new Date().toISOString(),
    uploadedBy: file.uploadedBy || "",
    applicantFolderName: file.applicantFolderName || "",
    rawFile: file.rawFile || null,
  };
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

function ToggleSwitch({ checked, disabled = false, onChange }) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={() => onChange?.(!checked)}
      className={`inline-flex h-8 items-center gap-2 rounded-full border px-2 text-xs font-extrabold transition ${
        checked
          ? "border-emerald-200 bg-emerald-50 text-emerald-700"
          : "border-slate-200 bg-slate-50 text-slate-600"
      } disabled:cursor-not-allowed disabled:opacity-60`}
    >
      <span
        className={`relative h-5 w-9 rounded-full transition ${
          checked ? "bg-emerald-500" : "bg-slate-300"
        }`}
      >
        <span
          className={`absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition ${
            checked ? "left-4" : "left-0.5"
          }`}
        />
      </span>

      {checked ? "Enabled" : "Disabled"}
    </button>
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

  const hasFile = Boolean(uploadedFile?.fileName);
  const FileIcon = getFileIcon(uploadedFile?.fileName);

  async function handleFileChange(event) {
    const file = event.target.files?.[0];

    if (!file) return;

    try {
      const fileUrl = await readFileAsDataUrl(file);

      onUpload(requirement, {
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
      });
    } finally {
      event.target.value = "";
    }
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
        <button
          type="button"
          disabled={!hasFile || disabled}
          onClick={() => {
            if (hasFile) onSelect(uploadedFile);
          }}
          className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-md border transition disabled:cursor-not-allowed ${
            hasFile
              ? "border-emerald-500 bg-emerald-500 text-white"
              : "border-[#B9C7D6] bg-white"
          }`}
          title={hasFile ? "View uploaded file" : "No file uploaded"}
        >
          {hasFile && <Check size={14} strokeWidth={3} />}
        </button>

        <div className="min-w-0 flex-1">
          <p
            title={requirement}
            className="truncate text-sm font-extrabold text-[#101828]"
          >
            {requirement}
          </p>

          {hasFile && (
            <button
              type="button"
              disabled={disabled}
              onClick={() => onSelect(uploadedFile)}
              className="mt-2 flex w-full min-w-0 items-center gap-2 rounded-xl border border-emerald-100 bg-white px-3 py-2 text-left transition hover:bg-emerald-50 disabled:cursor-not-allowed disabled:opacity-70"
            >
              <FileIcon size={17} className="shrink-0 text-emerald-700" />

              <span className="min-w-0 flex-1">
                <span className="block truncate text-xs font-extrabold text-emerald-800">
                  {uploadedFile.fileName}
                </span>

                <span className="mt-0.5 block truncate text-[11px] font-bold text-emerald-700/80">
                  {formatFileSize(uploadedFile.fileSize)}
                </span>
              </span>
            </button>
          )}
        </div>
      </div>

      <div className="mt-3 flex items-center gap-2">
        <button
          type="button"
          disabled={disabled}
          onClick={() => inputRef.current?.click()}
          className={`flex h-11 min-w-0 flex-1 items-center justify-between rounded-xl border border-dashed px-3 text-left text-xs font-extrabold transition disabled:cursor-not-allowed disabled:opacity-70 ${
            hasFile
              ? "border-emerald-200 bg-white text-emerald-700 hover:bg-emerald-50"
              : "border-[#B9C7D6] bg-white text-sibs-primary-1 hover:bg-[#F3F8FF]"
          }`}
        >
          <span className="truncate">
            {hasFile
              ? "Replace uploaded file"
              : "Upload file for this requirement"}
          </span>

          <UploadCloud size={17} className="shrink-0" />
        </button>

        {hasFile && (
          <button
            type="button"
            disabled={disabled}
            onClick={() => onRemove(requirement)}
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-red-100 bg-red-50 text-red-600 transition hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-70"
            title="Remove file"
          >
            <Trash2 size={16} />
          </button>
        )}
      </div>

      <input
        ref={inputRef}
        type="file"
        accept={ACCEPTED_FILE_TYPES}
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

  const isImage =
    resolvedFileUrl &&
    String(file.fileType || "").startsWith("image/") &&
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
            {file.fileName}
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
            {file.uploadedAt
              ? new Date(file.uploadedAt).toLocaleString("en-PH", {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                  hour: "numeric",
                  minute: "2-digit",
                })
              : "—"}
          </p>
        </div>

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

export default function NhoUploadModal({
  open,
  onClose,
  candidateId = "",
  candidateName = "Candidate",
  candidateEmail = "",
  initialFiles = [],
  currentFile = null,
  previousEmploymentEnabled: initialPreviousEmploymentEnabled = false,
  onSave,
}) {
  const [files, setFiles] = useState([]);
  const [selectedFile, setSelectedFile] = useState(null);
  const [previousEmploymentEnabled, setPreviousEmploymentEnabled] =
    useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState("");

  useEffect(() => {
    if (!open) return;

    const normalizedFiles = Array.isArray(initialFiles)
      ? initialFiles.map(normalizeUploadedFile)
      : [];

    const hasPreviousEmploymentFile = normalizedFiles.some((file) =>
      isPreviousEmploymentRequirement(file.requirement),
    );

    const nextPreviousEmploymentEnabled =
      Boolean(initialPreviousEmploymentEnabled) || hasPreviousEmploymentFile;

    setPreviousEmploymentEnabled(nextPreviousEmploymentEnabled);

    const nextFiles = nextPreviousEmploymentEnabled
      ? normalizedFiles
      : normalizedFiles.filter(
          (file) => !isPreviousEmploymentRequirement(file.requirement),
        );

    setFiles(nextFiles);

    const normalizedCurrentFile = currentFile
      ? normalizeUploadedFile(currentFile)
      : nextFiles[0] || null;

    setSelectedFile(
      normalizedCurrentFile &&
        !nextPreviousEmploymentEnabled &&
        isPreviousEmploymentRequirement(normalizedCurrentFile.requirement)
        ? nextFiles[0] || null
        : normalizedCurrentFile,
    );

    setSaveError("");
    setIsSaving(false);
  }, [open, initialFiles, currentFile, initialPreviousEmploymentEnabled]);

  const activeRequirementGroups = useMemo(() => {
    return getActiveRequirementGroups(previousEmploymentEnabled);
  }, [previousEmploymentEnabled]);

  const activeRequirements = useMemo(() => {
    return getActiveRequirements(previousEmploymentEnabled);
  }, [previousEmploymentEnabled]);

  const uploadedRequirementMap = useMemo(() => {
    const map = new Map();

    files.forEach((file) => {
      const key = normalizeRequirement(file.requirement);

      if (key) {
        map.set(key, file);
      }
    });

    return map;
  }, [files]);

  const completedRequirements = useMemo(() => {
    return activeRequirements.filter((requirement) =>
      uploadedRequirementMap.has(normalizeRequirement(requirement)),
    ).length;
  }, [activeRequirements, uploadedRequirementMap]);

  const progressPercent = activeRequirements.length
    ? Math.round((completedRequirements / activeRequirements.length) * 100)
    : 0;

  if (!open) return null;

  function handlePreviousEmploymentToggle(enabled) {
    setPreviousEmploymentEnabled(enabled);

    if (!enabled) {
      setFiles((previous) => {
        const nextFiles = previous.filter(
          (file) => !isPreviousEmploymentRequirement(file.requirement),
        );

        setSelectedFile((current) => {
          if (isPreviousEmploymentRequirement(current?.requirement)) {
            return nextFiles[0] || null;
          }

          return current;
        });

        return nextFiles;
      });
    }
  }

  function handleUpload(requirement, filePayload) {
    setFiles((previous) => {
      const requirementKey = normalizeRequirement(requirement);

      const withoutCurrentRequirement = previous.filter(
        (item) => normalizeRequirement(item.requirement) !== requirementKey,
      );

      const nextFiles = [filePayload, ...withoutCurrentRequirement];

      setSelectedFile(filePayload);

      return nextFiles;
    });
  }

  function handleRemove(requirement) {
    const requirementKey = normalizeRequirement(requirement);

    setFiles((previous) => {
      const nextFiles = previous.filter(
        (item) => normalizeRequirement(item.requirement) !== requirementKey,
      );

      setSelectedFile((current) => {
        if (normalizeRequirement(current?.requirement) === requirementKey) {
          return nextFiles[0] || null;
        }

        return current;
      });

      return nextFiles;
    });
  }

  async function saveUploadsToBackend() {
    const formData = new FormData();

    const filePayloads = files.map((file) => {
      const hasNewFile = Boolean(file.rawFile);

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
    formData.append("completed", String(completedRequirements));
    formData.append("total", String(activeRequirements.length));
    formData.append("percent", String(progressPercent));
    formData.append(
      "previousEmploymentEnabled",
      String(previousEmploymentEnabled),
    );

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

      if (candidateId) {
        const response = await saveUploadsToBackend();

        if (!response?.success) {
          throw new Error(response?.message || "Failed to save uploads.");
        }

        const savedFiles = Array.isArray(response.files)
          ? response.files.map(normalizeUploadedFile)
          : Array.isArray(response?.data?.files)
            ? response.data.files.map(normalizeUploadedFile)
            : files;

        onSave?.({
          files: savedFiles,
          completed:
            response?.data?.progress?.completed ?? completedRequirements,
          total: response?.data?.progress?.total ?? activeRequirements.length,
          percent: response?.data?.progress?.percent ?? progressPercent,
          previousEmploymentEnabled:
            response?.data?.previousEmploymentEnabled ??
            previousEmploymentEnabled,
          response,
        });

        onClose?.();
        return;
      }

      onSave?.({
        files,
        completed: completedRequirements,
        total: activeRequirements.length,
        percent: progressPercent,
        previousEmploymentEnabled,
      });

      onClose?.();
    } catch (error) {
      setSaveError(getApiErrorMessage(error, "Failed to save uploads."));
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-[10010] flex h-dvh items-center justify-center bg-black/50 px-4 py-4"
      onClick={() => {
        if (!isSaving) onClose?.();
      }}
    >
      <div
        className="flex max-h-[92dvh] w-full max-w-6xl flex-col overflow-hidden rounded-2xl bg-white shadow-xl"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4 border-b border-[#E6ECF2] px-5 py-4 sm:px-7">
          <div className="min-w-0">
            <h2 className="text-xl font-extrabold text-sibs-primary-1 sm:text-2xl">
              Pre-Employment File Uploads
            </h2>

            <p className="mt-1 text-sm font-semibold text-sibs-primary-1/80">
              Upload, review, and monitor candidate pre-employment requirements.
            </p>
          </div>

          <button
            type="button"
            disabled={isSaving}
            onClick={onClose}
            className="rounded-xl p-2 text-sibs-tertiary-5 transition hover:bg-[#F8FAFC] hover:text-sibs-primary-1 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <X size={22} />
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto p-5 sm:p-7">
          <div className="grid grid-cols-1 gap-5 xl:grid-cols-[minmax(0,1fr)_360px]">
            <div className="min-w-0 space-y-5">
              <section className="rounded-2xl border border-[#D9E2EC] bg-white p-5 shadow-sm">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0">
                    <h3 className="truncate text-lg font-extrabold text-[#101828]">
                      {candidateName}
                    </h3>

                    <p className="mt-1 truncate text-sm font-bold text-sibs-primary-1">
                      {candidateEmail || "No email provided"}
                    </p>
                  </div>

                  <div className="flex shrink-0 flex-wrap items-center gap-2">
                    <span className="rounded-full bg-[#F2F6FA] px-3 py-1 text-xs font-extrabold text-[#344054]">
                      Pre-Employment
                    </span>

                    <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-extrabold text-emerald-700">
                      {completedRequirements} / {activeRequirements.length}{" "}
                      Submitted
                    </span>
                  </div>
                </div>

                <div className="mt-5">
                  <div className="mb-2 flex items-center justify-between text-xs font-extrabold uppercase tracking-wide text-sibs-primary-1">
                    <span>Completion</span>
                    <span>{progressPercent}%</span>
                  </div>

                  <div className="h-3 overflow-hidden rounded-full bg-[#EEF4FA]">
                    <div
                      className="h-full rounded-full bg-sibs-primary-1 transition-all duration-300"
                      style={{ width: `${progressPercent}%` }}
                    />
                  </div>
                </div>

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
                  {activeRequirementGroups.map((group) => {
                    const groupCompleted = group.requirements.filter(
                      (requirement) =>
                        uploadedRequirementMap.has(
                          normalizeRequirement(requirement),
                        ),
                    ).length;

                    const isPreviousEmployment =
                      group.id === "previous-employment";

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

                          {isPreviousEmployment && (
                            <ToggleSwitch
                              checked={previousEmploymentEnabled}
                              disabled={isSaving}
                              onChange={handlePreviousEmploymentToggle}
                            />
                          )}
                        </div>

                        {isPreviousEmployment && !previousEmploymentEnabled ? (
                          <div className="rounded-xl border border-[#D9E2EC] bg-[#F8FAFC] px-4 py-5 text-sm font-bold text-sibs-tertiary-5">
                            Previous employment requirements are disabled for
                            this candidate.
                          </div>
                        ) : (
                          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                            {group.requirements.map((requirement) => {
                              const uploadedFile = uploadedRequirementMap.get(
                                normalizeRequirement(requirement),
                              );

                              return (
                                <RequirementCard
                                  key={requirement}
                                  requirement={requirement}
                                  uploadedFile={uploadedFile}
                                  disabled={isSaving}
                                  onUpload={handleUpload}
                                  onSelect={setSelectedFile}
                                  onRemove={handleRemove}
                                />
                              );
                            })}
                          </div>
                        )}
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

        <div className="border-t border-[#E6ECF2] bg-white px-5 py-4 sm:px-7">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm font-bold text-sibs-tertiary-5">
              {completedRequirements} of {activeRequirements.length}{" "}
              requirements submitted.
            </p>

            <div className="flex flex-col gap-2 sm:flex-row">
              <button
                type="button"
                disabled={isSaving}
                onClick={onClose}
                className="inline-flex h-11 items-center justify-center rounded-xl border border-[#D6DEE8] bg-white px-5 text-sm font-extrabold text-[#344054] transition hover:bg-[#F8FAFC] disabled:cursor-not-allowed disabled:opacity-60"
              >
                Cancel
              </button>

              <button
                type="button"
                disabled={isSaving}
                onClick={handleSaveUploads}
                className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-sibs-primary-1 px-5 text-sm font-extrabold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-70"
              >
                {isSaving && <Loader2 size={17} className="animate-spin" />}
                {isSaving ? "Saving..." : "Save Uploads"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}