import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  X,
  UploadCloud,
  FileText,
  Image as ImageIcon,
  FileSpreadsheet,
  FileArchive,
  Trash2,
  Eye,
  Download,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";

const ACCEPTED_FILE_TYPES =
  ".pdf,.doc,.docx,.xls,.xlsx,.csv,.jpg,.jpeg,.png,.gif";

const DEFAULT_REQUIREMENTS = [
  "ID picture (2 pcs passport size)",
  "Transcript of Records and/or Diploma",
  "Medical Records",
  "Urinalysis, Fecalysis, Pregnancy Test, Drug Test, Chest X-Ray and Hepa B",
  "NBI Clearance",
  "BIR 2316 Form",
  "TIN Verification Slip",
  "SSS E1 Form",
  "PhilHealth Member's Data Record / PMRF",
  "Pag-IBIG Member's Data Form",
  "Birth Certificate / Marriage Certificate / Children's Birth Certificate",
  "Employment Certificate",
  "Occupational Permit",
  "1 Valid ID",
];

function formatFileSize(bytes = 0) {
  if (!bytes) return "0 KB";

  const sizes = ["Bytes", "KB", "MB", "GB"];
  const index = Math.floor(Math.log(bytes) / Math.log(1024));

  return `${(bytes / Math.pow(1024, index)).toFixed(index === 0 ? 0 : 2)} ${
    sizes[index]
  }`;
}

function getFileIcon(fileName = "") {
  const ext = fileName.split(".").pop()?.toLowerCase();

  if (["jpg", "jpeg", "png", "gif", "webp"].includes(ext)) {
    return ImageIcon;
  }

  if (["xls", "xlsx", "csv"].includes(ext)) {
    return FileSpreadsheet;
  }

  if (["zip", "rar", "7z"].includes(ext)) {
    return FileArchive;
  }

  return FileText;
}

function getFileTypeLabel(fileName = "") {
  const ext = fileName.split(".").pop()?.toUpperCase();
  return ext || "FILE";
}

const NhoUploadModal = ({
  open,
  onClose,
  candidateName = "Candidate",
  candidateEmail = "",
  title = "Pre-Employment File Uploads",
  subtitle = "Upload, review, and monitor candidate pre-employment requirements.",
  requirements = DEFAULT_REQUIREMENTS,
  initialFiles = [],
  currentFile = null,
  onSave,
}) => {
  const requirementFileInputRefs = useRef({});

  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [viewingFile, setViewingFile] = useState(null);
  const [checkedRequirements, setCheckedRequirements] = useState({});

  useEffect(() => {
    if (open) {
      setUploadedFiles(initialFiles || []);
      setViewingFile(currentFile || initialFiles?.[0] || null);

      const checks = {};
      (initialFiles || []).forEach((file) => {
        if (file.requirement) checks[file.requirement] = true;
      });

      setCheckedRequirements(checks);
    }
  }, [open, initialFiles, currentFile]);

  const filesByRequirement = useMemo(() => {
    const map = {};

    uploadedFiles.forEach((file) => {
      if (file.requirement) {
        map[file.requirement] = file;
      }
    });

    return map;
  }, [uploadedFiles]);

  const completion = useMemo(() => {
    const total = requirements.length || 0;
    const completed = Object.values(checkedRequirements).filter(Boolean).length;

    return {
      total,
      completed,
      percent: total ? Math.round((completed / total) * 100) : 0,
    };
  }, [requirements, checkedRequirements]);

  if (!open) return null;

  const handleRequirementFileUpload = (requirement, event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const newFile = {
      id: `file-${Date.now()}-${requirement}`,
      file,
      fileName: file.name,
      fileSize: file.size,
      fileType: file.type,
      requirement,
      uploadedAt: new Date().toISOString(),
      previewUrl: URL.createObjectURL(file),
      status: "Uploaded",
    };

    setUploadedFiles((prev) => {
      const withoutSameRequirement = prev.filter(
        (item) => item.requirement !== requirement,
      );

      return [newFile, ...withoutSameRequirement];
    });

    setViewingFile(newFile);

    setCheckedRequirements((prev) => ({
      ...prev,
      [requirement]: true,
    }));

    if (requirementFileInputRefs.current[requirement]) {
      requirementFileInputRefs.current[requirement].value = "";
    }
  };

  const handleRemoveFile = (fileId) => {
    const targetFile = uploadedFiles.find((item) => item.id === fileId);
    const nextFiles = uploadedFiles.filter((item) => item.id !== fileId);

    setUploadedFiles(nextFiles);

    if (targetFile?.requirement) {
      setCheckedRequirements((prev) => ({
        ...prev,
        [targetFile.requirement]: false,
      }));
    }

    if (viewingFile?.id === fileId) {
      setViewingFile(nextFiles[0] || null);
    }
  };

  const handleSave = () => {
    onSave?.({
      files: uploadedFiles,
      checkedRequirements,
      completion,
    });

    onClose?.();
  };

  const renderPreview = () => {
    if (!viewingFile) {
      return (
        <div className="flex min-h-[320px] flex-col items-center justify-center rounded-2xl border border-dashed border-[#C9D6E4] bg-[#F8FBFF] px-6 text-center">
          <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-white text-[#1E5A91] shadow-sm">
            <FileText size={28} />
          </div>

          <h4 className="text-base font-extrabold text-[#101828]">
            No file selected
          </h4>

          <p className="mt-2 max-w-[260px] text-sm leading-6 text-[#667085]">
            Select an uploaded file from the list to preview its details here.
          </p>
        </div>
      );
    }

    const Icon = getFileIcon(viewingFile.fileName);
    const isImage =
      viewingFile.previewUrl &&
      /\.(jpg|jpeg|png|gif|webp)$/i.test(viewingFile.fileName || "");

    return (
      <div className="overflow-hidden rounded-2xl border border-[#D9E4EF] bg-white">
        <div className="border-b border-[#E6ECF2] px-5 py-4">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0 flex-1">
              <p className="text-xs font-extrabold uppercase tracking-wide text-[#1E5A91]">
                Current File
              </p>

              <h4
                title={viewingFile.fileName}
                className="mt-1 truncate text-base font-extrabold text-[#101828]"
              >
                {viewingFile.fileName}
              </h4>
            </div>

            <span className="shrink-0 rounded-full bg-[#ECFDF3] px-3 py-1 text-xs font-extrabold text-[#027A48]">
              {viewingFile.status || "Uploaded"}
            </span>
          </div>
        </div>

        <div className="p-5">
          <div className="mb-4 overflow-hidden rounded-2xl border border-[#E6ECF2] bg-[#F8FBFF]">
            {isImage ? (
              <img
                src={viewingFile.previewUrl}
                alt={viewingFile.fileName}
                className="h-[220px] w-full object-contain sm:h-[260px]"
              />
            ) : (
              <div className="flex h-[220px] flex-col items-center justify-center px-6 text-center sm:h-[260px]">
                <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-white text-[#1E5A91] shadow-sm">
                  <Icon size={34} />
                </div>

                <p className="text-sm font-extrabold text-[#101828]">
                  {getFileTypeLabel(viewingFile.fileName)} File Preview
                </p>

                <p className="mt-2 text-xs text-[#667085]">
                  Preview is available for image files. Other file types can be
                  viewed or downloaded.
                </p>
              </div>
            )}
          </div>

          <div className="space-y-3 rounded-2xl bg-[#F8FBFF] p-4">
            <div className="flex items-center justify-between gap-4">
              <span className="shrink-0 text-xs font-extrabold uppercase text-[#1E5A91]">
                Requirement
              </span>

              <span
                title={viewingFile.requirement || "Not assigned"}
                className="min-w-0 truncate text-right text-sm font-bold text-[#344054]"
              >
                {viewingFile.requirement || "Not assigned"}
              </span>
            </div>

            <div className="h-px bg-[#E6ECF2]" />

            <div className="flex items-center justify-between gap-4">
              <span className="shrink-0 text-xs font-extrabold uppercase text-[#1E5A91]">
                File Size
              </span>

              <span className="text-sm font-bold text-[#344054]">
                {formatFileSize(viewingFile.fileSize)}
              </span>
            </div>

            <div className="h-px bg-[#E6ECF2]" />

            <div className="flex items-center justify-between gap-4">
              <span className="shrink-0 text-xs font-extrabold uppercase text-[#1E5A91]">
                Uploaded At
              </span>

              <span className="text-right text-sm font-bold text-[#344054]">
                {viewingFile.uploadedAt
                  ? new Date(viewingFile.uploadedAt).toLocaleString()
                  : "—"}
              </span>
            </div>
          </div>

          <div className="mt-4 flex flex-col gap-3 sm:flex-row">
            {viewingFile.previewUrl && (
              <a
                href={viewingFile.previewUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl border border-[#C9D6E4] bg-white px-4 py-3 text-sm font-extrabold text-[#042C51] transition hover:bg-[#F8FBFF]"
              >
                <Eye size={16} />
                View
              </a>
            )}

            {viewingFile.previewUrl && (
              <a
                href={viewingFile.previewUrl}
                download={viewingFile.fileName}
                className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-[#042C51] px-4 py-3 text-sm font-extrabold text-white transition hover:bg-[#06406F]"
              >
                <Download size={16} />
                Download
              </a>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/45 px-3 py-4 sm:px-4 sm:py-6">
      <div className="flex max-h-[94vh] w-[min(96vw,1360px)] flex-col overflow-hidden rounded-2xl bg-white shadow-2xl">
        <div className="flex items-start justify-between gap-6 border-b border-[#E6ECF2] px-4 py-5 sm:px-6 lg:px-7 lg:py-6">
          <div className="min-w-0">
            <h2 className="truncate text-xl font-extrabold text-[#042C51] sm:text-2xl">
              {title}
            </h2>

            <p className="mt-1 truncate text-sm font-medium text-[#1E5A91]">
              {subtitle}
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="shrink-0 rounded-xl p-2 text-[#98A2B3] transition hover:bg-[#F2F4F7] hover:text-[#101828]"
          >
            <X size={22} />
          </button>
        </div>

        <div className="grid flex-1 grid-cols-1 gap-5 overflow-y-auto overflow-x-hidden bg-white px-4 py-5 sm:px-6 lg:grid-cols-[70fr_30fr] xl:px-7">
          <div className="min-w-0 space-y-5">
            <div className="rounded-2xl border border-[#D9E4EF] bg-white p-4 shadow-sm sm:p-5">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0">
                  <h3
                    title={candidateName}
                    className="truncate text-lg font-extrabold text-[#101828]"
                  >
                    {candidateName}
                  </h3>

                  {candidateEmail && (
                    <p
                      title={candidateEmail}
                      className="mt-1 truncate text-sm font-semibold text-[#1E5A91]"
                    >
                      {candidateEmail}
                    </p>
                  )}
                </div>

                <div className="flex shrink-0 flex-wrap gap-2">
                  <span className="rounded-full bg-[#F2F4F7] px-3 py-1 text-xs font-extrabold text-[#344054]">
                    Pre-Employment
                  </span>

                  <span className="rounded-full bg-[#ECFDF3] px-3 py-1 text-xs font-extrabold text-[#027A48]">
                    {completion.completed} / {completion.total} Submitted
                  </span>
                </div>
              </div>

              <div className="mt-5">
                <div className="mb-2 flex items-center justify-between text-xs font-extrabold uppercase tracking-wide text-[#1E5A91]">
                  <span>Completion</span>
                  <span>{completion.percent}%</span>
                </div>

                <div className="h-3 overflow-hidden rounded-full bg-[#EEF4FA]">
                  <div
                    className="h-full rounded-full bg-[#042C51] transition-all duration-300"
                    style={{ width: `${completion.percent}%` }}
                  />
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-[#D9E4EF] bg-white p-4 sm:p-5">
              <div className="mb-4">
                <h3 className="text-base font-extrabold text-[#101828]">
                  Pre-Employment Requirements
                </h3>

                <p className="mt-1 text-sm text-[#667085]">
                  Upload the supporting file under each requirement. The item is
                  automatically checked once a file is uploaded.
                </p>
              </div>

              <div className="grid gap-3 xl:grid-cols-2">
                {requirements.map((item) => {
                  const uploadedFile = filesByRequirement[item];
                  const checked = !!checkedRequirements[item];

                  return (
                    <div
                      key={item}
                      className={`min-w-0 rounded-xl border px-4 py-3 transition ${
                        checked
                          ? "border-[#A6F4C5] bg-[#ECFDF3]"
                          : "border-[#E6ECF2] bg-[#F8FBFF]"
                      }`}
                    >
                      <div className="flex min-w-0 items-center gap-3">
                        <div
                          className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-md border ${
                            checked
                              ? "border-[#12B76A] bg-[#12B76A] text-white"
                              : "border-[#C9D6E4] bg-white"
                          }`}
                        >
                          {checked && <CheckCircle2 size={14} />}
                        </div>

                        <span
                          title={item}
                          className={`block min-w-0 flex-1 truncate text-sm font-semibold ${
                            checked ? "text-[#027A48]" : "text-[#344054]"
                          }`}
                        >
                          {item}
                        </span>
                      </div>

                      {uploadedFile ? (
                        <div className="mt-3 rounded-xl border border-[#D9E4EF] bg-white p-3">
                          <div className="flex min-w-0 items-center gap-3">
                            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#F8FBFF] text-[#1E5A91]">
                              {React.createElement(
                                getFileIcon(uploadedFile.fileName),
                                {
                                  size: 19,
                                },
                              )}
                            </div>

                            <button
                              type="button"
                              onClick={() => setViewingFile(uploadedFile)}
                              className="min-w-0 flex-1 text-left"
                            >
                              <p
                                title={uploadedFile.fileName}
                                className="truncate text-xs font-extrabold text-[#101828]"
                              >
                                {uploadedFile.fileName}
                              </p>

                              <p className="mt-0.5 text-[11px] font-semibold text-[#667085]">
                                {formatFileSize(uploadedFile.fileSize)}
                              </p>
                            </button>

                            <button
                              type="button"
                              onClick={() => setViewingFile(uploadedFile)}
                              className="shrink-0 rounded-lg p-2 text-[#1E5A91] transition hover:bg-[#F8FBFF]"
                              title="View file"
                            >
                              <Eye size={16} />
                            </button>

                            <button
                              type="button"
                              onClick={() => handleRemoveFile(uploadedFile.id)}
                              className="shrink-0 rounded-lg p-2 text-[#F04438] transition hover:bg-[#FEF3F2]"
                              title="Remove file"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </div>
                      ) : (
                        <label className="mt-3 flex h-11 min-w-0 cursor-pointer items-center justify-between gap-3 rounded-xl border border-dashed border-[#C9D6E4] bg-white px-3 text-xs font-bold text-[#1E5A91] transition hover:bg-[#F8FBFF]">
                          <span className="min-w-0 flex-1 truncate">
                            Upload file for this requirement
                          </span>

                          <UploadCloud size={17} className="shrink-0" />

                          <input
                            ref={(el) => {
                              requirementFileInputRefs.current[item] = el;
                            }}
                            type="file"
                            accept={ACCEPTED_FILE_TYPES}
                            onChange={(event) =>
                              handleRequirementFileUpload(item, event)
                            }
                            className="hidden"
                          />
                        </label>
                      )}
                    </div>
                  );
                })}
              </div>

              <p className="mt-4 text-xs font-medium text-[#667085]">
                Accepted file types: PDF, Word, Excel, CSV, JPG, JPEG, PNG, and
                GIF.
              </p>
            </div>

            <div className="rounded-2xl border border-[#D9E4EF] bg-white p-4 sm:p-5">
              <div className="mb-4">
                <h3 className="text-base font-extrabold text-[#101828]">
                  Uploaded Files
                </h3>

                <p className="mt-1 text-sm text-[#667085]">
                  Click a file to view it on the current file section.
                </p>
              </div>

              {uploadedFiles.length === 0 ? (
                <div className="flex min-h-[160px] flex-col items-center justify-center rounded-2xl border border-dashed border-[#C9D6E4] bg-[#F8FBFF] px-6 text-center">
                  <AlertCircle size={28} className="text-[#98A2B3]" />

                  <p className="mt-3 text-sm font-extrabold text-[#344054]">
                    No uploaded files yet
                  </p>

                  <p className="mt-1 text-xs text-[#667085]">
                    Uploaded requirements will appear here.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {uploadedFiles.map((file) => {
                    const Icon = getFileIcon(file.fileName);
                    const active = viewingFile?.id === file.id;

                    return (
                      <div
                        key={file.id}
                        className={`flex min-w-0 items-center gap-4 rounded-2xl border p-4 transition ${
                          active
                            ? "border-[#1E5A91] bg-[#F0F7FF]"
                            : "border-[#E6ECF2] bg-white hover:bg-[#F8FBFF]"
                        }`}
                      >
                        <button
                          type="button"
                          onClick={() => setViewingFile(file)}
                          className="flex min-w-0 flex-1 items-center gap-4 text-left"
                        >
                          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#F2F4F7] text-[#1E5A91]">
                            <Icon size={22} />
                          </div>

                          <div className="min-w-0 flex-1">
                            <div className="flex min-w-0 items-center gap-2">
                              <p
                                title={file.fileName}
                                className="min-w-0 truncate text-sm font-extrabold text-[#101828]"
                              >
                                {file.fileName}
                              </p>

                              <span className="shrink-0 rounded-full bg-[#EEF4FA] px-2.5 py-1 text-[11px] font-extrabold text-[#1E5A91]">
                                {getFileTypeLabel(file.fileName)}
                              </span>
                            </div>

                            <p
                              title={file.requirement}
                              className="mt-1 truncate text-xs font-medium text-[#667085]"
                            >
                              {file.requirement}
                            </p>
                          </div>
                        </button>

                        <div className="hidden shrink-0 text-right md:block">
                          <p className="text-xs font-bold text-[#344054]">
                            {formatFileSize(file.fileSize)}
                          </p>

                          <p className="mt-1 text-[11px] text-[#667085]">
                            {file.uploadedAt
                              ? new Date(file.uploadedAt).toLocaleDateString()
                              : "—"}
                          </p>
                        </div>

                        <button
                          type="button"
                          onClick={() => handleRemoveFile(file.id)}
                          className="shrink-0 rounded-xl p-2 text-[#F04438] transition hover:bg-[#FEF3F2]"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          <div className="min-w-0 space-y-5 lg:sticky lg:top-0 lg:self-start">
            {renderPreview()}
          </div>
        </div>

        <div className="flex flex-col gap-4 border-t border-[#E6ECF2] bg-white px-4 py-4 sm:px-6 lg:flex-row lg:items-center lg:justify-between xl:px-7">
          <div className="text-sm font-semibold text-[#667085]">
            {completion.completed} of {completion.total} requirements submitted.
          </div>

          <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row">
            <button
              type="button"
              onClick={onClose}
              className="w-full rounded-xl border border-[#C9D6E4] bg-white px-5 py-3 text-sm font-extrabold text-[#344054] transition hover:bg-[#F8FBFF] sm:w-auto"
            >
              Cancel
            </button>

            <button
              type="button"
              onClick={handleSave}
              className="w-full rounded-xl bg-[#042C51] px-5 py-3 text-sm font-extrabold text-white transition hover:bg-[#06406F] sm:w-auto"
            >
              Save Uploads
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NhoUploadModal;
