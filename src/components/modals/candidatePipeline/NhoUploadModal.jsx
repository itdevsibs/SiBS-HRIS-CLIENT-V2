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

  if (/\.(jpg|jpeg|png|gif|webp|heic|heif)$/i.test(value)) return FileImage;
  if (/\.(xls|xlsx|csv)$/i.test(value)) return FileSpreadsheet;

  return FileText;
}

function isImageFile(file = {}) {
  const fileName = cleanText(file.fileName || file.name).toLowerCase();
  const fileType = cleanText(file.fileType || file.type).toLowerCase();

  return (
    fileType.startsWith("image/") ||
    /\.(jpg|jpeg|png|gif|webp)$/i.test(fileName)
  );
}

function getApiBaseUrl() {
  return cleanText(import.meta.env.VITE_API_URL).replace(/\/+$/, "");
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

  const apiBaseUrl = getApiBaseUrl();

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

function getApiErrorMessage(error, fallback = "Request failed.") {
  return (
    error?.response?.data?.message ||
    error?.response?.data?.error ||
    error?.message ||
    fallback
  );
}

function normalizeUploadedFile(file = {}) {
  const savedFileName =
    file.savedFileName ||
    file.saved_file_name ||
    file.filename ||
    file.storedFileName ||
    "";

  const fileName =
    file.fileName ||
    file.name ||
    file.originalName ||
    file.originalname ||
    savedFileName ||
    "";

  const fileUrl =
    file.fileUrl ||
    file.url ||
    file.dataUrl ||
    file.previewUrl ||
    file.downloadUrl ||
    "";

  const filePath = file.filePath || file.storedPath || file.path || "";

  return {
    id:
      file.id ||
      file.fileId ||
      `FILE-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    requirement: file.requirement || file.label || file.category || "",
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
    fileUrl,
    filePath,
    storedPath: file.storedPath || filePath,
    uploadedAt: file.uploadedAt || file.createdAt || file.updatedAt || "",
    uploadedBy: file.uploadedBy || file.createdBy || file.updatedBy || "",
    applicantFolderName: file.applicantFolderName || "",
    rawFile: file.rawFile || null,
  };
}

function stripRawFile(file = {}) {
  const normalized = normalizeUploadedFile(file);
  const { rawFile, ...rest } = normalized;

  return rest;
}

function isRawBrowserFile(file) {
  return typeof File !== "undefined" && file instanceof File;
}

function dedupeFiles(files = []) {
  const map = new Map();

  files.filter(Boolean).forEach((file) => {
    const normalizedFile = normalizeUploadedFile(file);

    const key =
      normalizeRequirement(normalizedFile.requirement) ||
      cleanText(normalizedFile.id).toLowerCase() ||
      [
        normalizedFile.fileName,
        normalizedFile.savedFileName,
        normalizedFile.fileUrl,
      ]
        .map((value) => cleanText(value).toLowerCase())
        .join("|");

    if (!key) return;

    map.set(key, {
      ...(map.get(key) || {}),
      ...normalizedFile,
    });
  });

  return Array.from(map.values());
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

  return responsePayload?.candidate || responsePayload?.data || null;
}

function calculateProgress(files = [], previousEmploymentEnabled = false) {
  const activeRequirements = getActiveRequirements(previousEmploymentEnabled);

  const uploadedRequirementMap = new Map();

  files.forEach((file) => {
    const key = normalizeRequirement(file?.requirement);

    if (key) {
      uploadedRequirementMap.set(key, file);
    }
  });

  const completed = activeRequirements.filter((requirement) =>
    uploadedRequirementMap.has(normalizeRequirement(requirement)),
  ).length;

  const total = activeRequirements.length;
  const percent = total ? Math.round((completed / total) * 100) : 0;

  return {
    completed,
    total,
    percent,
  };
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

  const hasFile = Boolean(uploadedFile?.fileName || uploadedFile?.fileUrl);
  const FileIcon = getFileIcon(uploadedFile?.fileName);

  async function handleFileChange(event) {
    const file = event.target.files?.[0];

    if (!file) return;

    try {
      const fileUrl = await readFileAsDataUrl(file);

      const nextFile = normalizeUploadedFile({
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

      onUpload(requirement, nextFile);
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
                  {uploadedFile.fileName || "Uploaded file"}
                </span>

                <span className="mt-0.5 block truncate text-[11px] font-bold text-emerald-700/80">
                  {formatFileSize(uploadedFile.fileSize)}
                </span>
              </span>
            </button>
          )}
        </div>
      </div>

      <div className="mt-4 flex flex-col gap-2 sm:flex-row">
        <button
          type="button"
          disabled={disabled}
          onClick={() => inputRef.current?.click()}
          className="inline-flex h-10 flex-1 items-center justify-center gap-2 rounded-xl border border-dashed border-[#B8CAE0] bg-white px-3 text-xs font-extrabold text-sibs-primary-1 transition hover:border-sibs-primary-1 hover:bg-sibs-primary-1/5 disabled:cursor-not-allowed disabled:opacity-60"
        >
          <UploadCloud size={16} />
          {hasFile ? "Replace file" : "Upload file for this requirement"}
        </button>

        {hasFile && (
          <button
            type="button"
            disabled={disabled}
            onClick={() => onRemove(requirement)}
            className="inline-flex h-10 items-center justify-center rounded-xl border border-red-100 bg-white px-3 text-red-600 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60"
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
        disabled={disabled}
        onChange={handleFileChange}
        className="hidden"
      />
    </div>
  );
}

function SelectedFilePreview({ file }) {
  if (!file) {
    return (
      <div className="flex min-h-[320px] flex-col items-center justify-center rounded-2xl border border-dashed border-[#B8CAE0] bg-[#F8FAFC] p-8 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white text-sibs-primary-1 shadow-sm">
          <FileText size={30} />
        </div>

        <p className="mt-5 text-lg font-extrabold text-[#101828]">
          No file selected
        </p>

        <p className="mt-2 max-w-xs text-sm font-semibold leading-6 text-sibs-primary-1">
          Select an uploaded file from the list to preview its details here.
        </p>
      </div>
    );
  }

  const FileIcon = getFileIcon(file.fileName);
  const resolvedFileUrl = getResolvedFileUrl(file.fileUrl);
  const isImage = isImageFile(file);

  return (
    <div className="rounded-2xl border border-[#D9E2EC] bg-[#F8FAFC] p-5">
      <div className="flex items-start gap-3">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-white text-sibs-primary-1 shadow-sm">
          <FileIcon size={24} />
        </div>

        <div className="min-w-0 flex-1">
          <p className="text-[11px] font-extrabold uppercase tracking-wide text-sibs-tertiary-5">
            Selected File
          </p>

          <p
            title={file.fileName}
            className="mt-1 break-words text-base font-extrabold text-[#101828]"
          >
            {file.fileName || "Uploaded file"}
          </p>

          <p className="mt-1 text-xs font-bold text-sibs-primary-1">
            {file.requirement || "Uploaded Requirement"}
          </p>
        </div>
      </div>

      <div className="mt-5 grid grid-cols-1 gap-4">
        <div>
          <p className="text-[11px] font-extrabold uppercase tracking-wide text-sibs-tertiary-5">
            File Type
          </p>

          <p className="mt-1 break-words text-sm font-bold text-[#344054]">
            {file.fileType || "—"}
          </p>
        </div>

        <div>
          <p className="text-[11px] font-extrabold uppercase tracking-wide text-sibs-tertiary-5">
            File Size
          </p>

          <p className="mt-1 break-words text-sm font-bold text-[#344054]">
            {formatFileSize(file.fileSize)}
          </p>
        </div>

        <div>
          <p className="text-[11px] font-extrabold uppercase tracking-wide text-sibs-tertiary-5">
            Uploaded At
          </p>

          <p className="mt-1 break-words text-sm font-bold text-[#344054]">
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

      {isImage && resolvedFileUrl && (
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
  const onSaveRef = useRef(onSave);
  const initialFilesRef = useRef(initialFiles);
  const currentFileRef = useRef(currentFile);
  const initialPreviousEmploymentEnabledRef = useRef(
    initialPreviousEmploymentEnabled,
  );
  const latestRequestRef = useRef(0);

  const [files, setFiles] = useState([]);
  const [selectedFile, setSelectedFile] = useState(null);
  const [previousEmploymentEnabled, setPreviousEmploymentEnabled] =
    useState(false);

  const [isLoadingFiles, setIsLoadingFiles] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [loadError, setLoadError] = useState("");
  const [saveError, setSaveError] = useState("");

  useEffect(() => {
    onSaveRef.current = onSave;
  }, [onSave]);

  useEffect(() => {
    initialFilesRef.current = initialFiles;
  }, [initialFiles]);

  useEffect(() => {
    currentFileRef.current = currentFile;
  }, [currentFile]);

  useEffect(() => {
    initialPreviousEmploymentEnabledRef.current =
      initialPreviousEmploymentEnabled;
  }, [initialPreviousEmploymentEnabled]);

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

  useEffect(() => {
    if (!open) return undefined;

    const requestId = Date.now();
    latestRequestRef.current = requestId;

    let isMounted = true;

    async function loadFiles() {
      setLoadError("");
      setSaveError("");
      setIsSaving(false);

      const normalizedInitialFiles = Array.isArray(initialFilesRef.current)
        ? initialFilesRef.current.map(normalizeUploadedFile)
        : [];

      const normalizedCurrentFile = currentFileRef.current
        ? normalizeUploadedFile(currentFileRef.current)
        : null;

      const hasPreviousEmploymentFromInitial = normalizedInitialFiles.some(
        (file) => isPreviousEmploymentRequirement(file.requirement),
      );

      const startingPreviousEmploymentEnabled =
        Boolean(initialPreviousEmploymentEnabledRef.current) ||
        hasPreviousEmploymentFromInitial;

      const startingFiles = startingPreviousEmploymentEnabled
        ? normalizedInitialFiles
        : normalizedInitialFiles.filter(
            (file) => !isPreviousEmploymentRequirement(file.requirement),
          );

      setPreviousEmploymentEnabled(startingPreviousEmploymentEnabled);
      setFiles(startingFiles);
      setSelectedFile(normalizedCurrentFile || startingFiles[0] || null);

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
              _t: Date.now(),
            },
          },
        );

        if (!isMounted || latestRequestRef.current !== requestId) return;

        const apiFiles = getFilesFromApiPayload(response).map(
          normalizeUploadedFile,
        );

        const apiPayload = response?.data ?? response;
        const apiData = apiPayload?.data || apiPayload || {};

        const hasPreviousEmploymentFromApi = apiFiles.some((file) =>
          isPreviousEmploymentRequirement(file.requirement),
        );

        const finalPreviousEmploymentEnabled =
          Boolean(apiData.previousEmploymentEnabled) ||
          startingPreviousEmploymentEnabled ||
          hasPreviousEmploymentFromApi;

        const mergedFiles = dedupeFiles([...startingFiles, ...apiFiles]);

        const finalFiles = finalPreviousEmploymentEnabled
          ? mergedFiles
          : mergedFiles.filter(
              (file) => !isPreviousEmploymentRequirement(file.requirement),
            );

        const selectedFromCurrent =
          normalizedCurrentFile &&
          finalFiles.find(
            (file) =>
              file.id === normalizedCurrentFile.id ||
              normalizeRequirement(file.requirement) ===
                normalizeRequirement(normalizedCurrentFile.requirement),
          );

        setPreviousEmploymentEnabled(finalPreviousEmploymentEnabled);
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

  function handleUpload(requirement, filePayload) {
    setFiles((previous) => {
      const requirementKey = normalizeRequirement(requirement);

      const withoutCurrentRequirement = previous.filter(
        (item) => normalizeRequirement(item.requirement) !== requirementKey,
      );

      const nextFile = normalizeUploadedFile(filePayload);
      const nextFiles = [nextFile, ...withoutCurrentRequirement];

      setSelectedFile(nextFile);

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

  function handlePreviousEmploymentToggle(nextValue) {
    setPreviousEmploymentEnabled(nextValue);

    setFiles((previous) => {
      const nextFiles = nextValue
        ? previous
        : previous.filter(
            (file) => !isPreviousEmploymentRequirement(file.requirement),
          );

      setSelectedFile((current) => {
        if (
          !nextValue &&
          current &&
          isPreviousEmploymentRequirement(current.requirement)
        ) {
          return nextFiles[0] || null;
        }

        return current;
      });

      return nextFiles;
    });
  }

  async function handleSaveUploads() {
    setSaveError("");

    const progress = calculateProgress(files, previousEmploymentEnabled);

    if (!candidateId) {
      onSaveRef.current?.({
        files,
        completed: progress.completed,
        total: progress.total,
        percent: progress.percent,
        previousEmploymentEnabled,
      });

      onClose?.();
      return;
    }

    setIsSaving(true);

    try {
      const rawUploadFiles = files.filter((file) =>
        isRawBrowserFile(file.rawFile),
      );

      const existingFiles = files
        .filter((file) => !isRawBrowserFile(file.rawFile))
        .map(stripRawFile);

      const formData = new FormData();

      formData.append(
        "previousEmploymentEnabled",
        previousEmploymentEnabled ? "true" : "false",
      );

      formData.append("existingFiles", JSON.stringify(existingFiles));

      rawUploadFiles.forEach((file) => {
        formData.append("nhoFiles", file.rawFile, file.fileName);
        formData.append("requirements", file.requirement || "");
        formData.append("clientFileIds", file.id || "");
      });

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

      const savedFilesFromApi = getFilesFromApiPayload(response).map(
        normalizeUploadedFile,
      );

      const nextFiles = savedFilesFromApi.length
        ? savedFilesFromApi
        : files.map(stripRawFile);

      const finalProgress = calculateProgress(
        nextFiles,
        previousEmploymentEnabled,
      );

      setFiles(nextFiles);

      setSelectedFile((current) => {
        if (!current) return nextFiles[0] || null;

        const currentRequirementKey = normalizeRequirement(current.requirement);

        return (
          nextFiles.find(
            (file) =>
              normalizeRequirement(file.requirement) === currentRequirementKey,
          ) ||
          nextFiles[0] ||
          null
        );
      });

      onSaveRef.current?.({
        files: nextFiles,
        completed: finalProgress.completed,
        total: finalProgress.total,
        percent: finalProgress.percent,
        previousEmploymentEnabled,
        candidate: getCandidateFromApiPayload(response),
      });

      window.dispatchEvent(new Event("ta-pipeline-candidates-updated"));

      onClose?.();
    } catch (error) {
      setSaveError(
        getApiErrorMessage(
          error,
          "Failed to save pre-employment files. Please try again.",
        ),
      );
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/45 px-4 py-6">
      <div className="flex max-h-[92vh] w-full max-w-6xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl">
        <div className="flex items-start justify-between gap-4 border-b border-[#E6ECF2] px-7 py-5">
          <div>
            <h2 className="text-2xl font-extrabold text-sibs-primary-1">
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
            className="rounded-xl p-2 text-sibs-primary-1 transition hover:bg-[#F3F8FF] disabled:cursor-not-allowed disabled:opacity-60"
          >
            <X size={22} />
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-7 py-6">
          <div className="grid grid-cols-1 gap-5 lg:grid-cols-[minmax(0,1fr)_360px]">
            <div className="space-y-5">
              <div className="rounded-2xl border border-[#D9E2EC] bg-white p-5 shadow-sm">
                <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                  <div className="min-w-0">
                    <p className="truncate text-lg font-extrabold text-[#101828]">
                      {candidateName || "Candidate"}
                    </p>

                    <p className="mt-2 truncate text-sm font-extrabold text-sibs-primary-1">
                      {candidateEmail || "No email provided"}
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <span className="rounded-full bg-[#EEF4FA] px-4 py-1.5 text-xs font-extrabold text-[#344054]">
                      Pre-Employment
                    </span>

                    <span className="rounded-full bg-emerald-50 px-4 py-1.5 text-xs font-extrabold text-emerald-700">
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

                  <div className="h-2 overflow-hidden rounded-full bg-[#EEF4FA]">
                    <div
                      className="h-full rounded-full bg-sibs-primary-1 transition-all duration-300"
                      style={{ width: `${progressPercent}%` }}
                    />
                  </div>
                </div>

                {isLoadingFiles && (
                  <div className="mt-4 flex items-center gap-2 rounded-xl border border-blue-100 bg-blue-50 px-4 py-3 text-sm font-bold text-blue-700">
                    <Loader2 size={16} className="animate-spin" />
                    Loading saved files from backend...
                  </div>
                )}

                {loadError && (
                  <div className="mt-4 rounded-xl border border-amber-100 bg-amber-50 px-4 py-3 text-sm font-bold text-amber-700">
                    {loadError}
                  </div>
                )}

                {saveError && (
                  <div className="mt-4 rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm font-bold text-red-700">
                    {saveError}
                  </div>
                )}
              </div>

              <div className="rounded-2xl border border-[#D9E2EC] bg-white p-5 shadow-sm">
                <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <h3 className="text-xl font-extrabold text-[#101828]">
                      Pre-Employment Requirements
                    </h3>

                    <p className="mt-1 text-sm font-semibold text-sibs-primary-1/75">
                      Existing uploaded files are shown below. Uploading again
                      will replace the file for that requirement.
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-xs font-extrabold uppercase tracking-wide text-sibs-primary-1">
                      Previous Employment
                    </span>

                    <ToggleSwitch
                      checked={previousEmploymentEnabled}
                      disabled={isSaving || isLoadingFiles}
                      onChange={handlePreviousEmploymentToggle}
                    />
                  </div>
                </div>

                <div className="space-y-6">
                  {activeRequirementGroups.map((group) => {
                    if (!group.requirements.length) return null;

                    const groupCompleted = group.requirements.filter(
                      (requirement) =>
                        uploadedRequirementMap.has(
                          normalizeRequirement(requirement),
                        ),
                    ).length;

                    return (
                      <div key={group.id}>
                        <div className="mb-4 flex items-center gap-3">
                          <h4 className="text-base font-extrabold text-sibs-primary-1">
                            {group.title}
                          </h4>

                          <span className="rounded-full bg-[#EEF4FA] px-3 py-1 text-xs font-extrabold text-sibs-primary-1">
                            {groupCompleted} / {group.requirements.length}
                          </span>
                        </div>

                        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                          {group.requirements.map((requirement) => {
                            const uploadedFile = uploadedRequirementMap.get(
                              normalizeRequirement(requirement),
                            );

                            return (
                              <RequirementCard
                                key={requirement}
                                requirement={requirement}
                                uploadedFile={uploadedFile}
                                disabled={isSaving || isLoadingFiles}
                                onUpload={handleUpload}
                                onSelect={setSelectedFile}
                                onRemove={handleRemove}
                              />
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            <div className="lg:sticky lg:top-0 lg:self-start">
              <SelectedFilePreview file={selectedFile} />
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-3 border-t border-[#E6ECF2] px-7 py-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm font-extrabold text-sibs-primary-1">
            {completedRequirements} of {activeRequirements.length} requirements
            submitted.
          </p>

          <div className="flex flex-col gap-2 sm:flex-row">
            <button
              type="button"
              disabled={isSaving}
              onClick={onClose}
              className="inline-flex h-11 items-center justify-center rounded-xl border border-[#D6DEE8] bg-white px-5 text-sm font-extrabold text-[#101828] transition hover:bg-[#F8FAFC] disabled:cursor-not-allowed disabled:opacity-60"
            >
              Cancel
            </button>

            <button
              type="button"
              disabled={isSaving || isLoadingFiles}
              onClick={handleSaveUploads}
              className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-sibs-primary-1 px-5 text-sm font-extrabold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSaving ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  Saving...
                </>
              ) : (
                "Save Uploads"
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}