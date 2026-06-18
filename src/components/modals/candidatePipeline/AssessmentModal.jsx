import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  getAssessmentResult,
  getAssessmentResultClass,
  getAssessmentStatus,
  getAssessmentStatusClass,
  textareaClass,
} from "../../../lib/utils/candidatePipeline/candidatePipelineHelpers";
import DetailRow from "../../layout/common/DetailRow";
import {
  Check,
  ChevronDown,
  ClipboardCheck,
  ExternalLink,
  FileImage,
  FileText,
  UploadCloud,
  X,
} from "lucide-react";
import {
  assessmentResultOptions,
  assessmentStatusOptions,
} from "../../../lib/utils/candidatePipeline/candidatePipelineConstants";

const ACCEPTED_ASSESSMENT_FILE_TYPES = [
  "application/pdf",
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
  "image/gif",
];

const PRODUCTION_APP_URL = "https://sibs-hris.getleadsource.com";
const LOCAL_APP_URL = "http://localhost:5173";

function cleanText(value) {
  return String(value ?? "").trim();
}

function getAppBaseUrl() {
  const envAppUrl =
    cleanText(import.meta.env.VITE_PUBLIC_APP_URL) ||
    cleanText(import.meta.env.VITE_APP_URL) ||
    cleanText(import.meta.env.VITE_FRONTEND_URL) ||
    cleanText(import.meta.env.VITE_CLIENT_URL);

  if (envAppUrl) {
    return envAppUrl.replace(/\/+$/, "");
  }

  if (typeof window !== "undefined") {
    const hostname = window.location.hostname;

    if (hostname === "localhost" || hostname === "127.0.0.1") {
      return LOCAL_APP_URL;
    }

    return PRODUCTION_APP_URL;
  }

  return PRODUCTION_APP_URL;
}

function getApiBaseUrl() {
  const apiUrl = cleanText(import.meta.env.VITE_API_URL).replace(/\/+$/, "");

  if (apiUrl) return apiUrl;

  if (typeof window !== "undefined") {
    return window.location.origin;
  }

  return "";
}

function buildAssessmentLink(candidate = {}) {
  const baseUrl = getAppBaseUrl();

  const candidateId =
    candidate.candidateId ||
    candidate.candidate_id ||
    candidate.candidateApplicationId ||
    candidate.applicationId ||
    candidate.id ||
    "";

  const email = candidate.email || candidate.candidateEmail || "";

  if (!candidateId) return "";

  const params = new URLSearchParams();

  params.set("candidateId", candidateId);

  if (email) {
    params.set("email", email);
  }

  return `${baseUrl}/online-assessment?${params.toString()}`;
}

function readAssessmentFileAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;

    reader.readAsDataURL(file);
  });
}

function formatFileSize(size = 0) {
  const numberSize = Number(size || 0);

  if (!numberSize || Number.isNaN(numberSize)) return "—";

  const kb = numberSize / 1024;

  if (kb < 1024) {
    return `${kb.toFixed(1)} KB`;
  }

  return `${(kb / 1024).toFixed(1)} MB`;
}

function getFileNameFromUrl(value = "") {
  const text = cleanText(value);

  if (!text) return "";

  try {
    const url = new URL(text);
    return decodeURIComponent(url.pathname.split("/").pop() || "");
  } catch {
    return decodeURIComponent(text.split(/[\\/]/).pop() || "");
  }
}

function getResolvedUrl(value = "") {
  const text = cleanText(value);

  if (!text) return "";

  if (
    text.startsWith("http://") ||
    text.startsWith("https://") ||
    text.startsWith("data:") ||
    text.startsWith("blob:")
  ) {
    return text;
  }

  if (text.startsWith("/api/")) {
    return `${getApiBaseUrl()}${text}`;
  }

  if (text.startsWith("/")) {
    return `${getAppBaseUrl()}${text}`;
  }

  return text;
}

function isImageFile(fileName = "", fileType = "", fileUrl = "") {
  const name = cleanText(fileName || getFileNameFromUrl(fileUrl)).toLowerCase();
  const type = cleanText(fileType).toLowerCase();
  const url = cleanText(fileUrl).toLowerCase();

  return (
    type.startsWith("image/") ||
    url.startsWith("data:image/") ||
    /\.(jpg|jpeg|png|gif|webp|heic|heif)$/i.test(name)
  );
}

function isPdfFile(fileName = "", fileType = "", fileUrl = "") {
  const name = cleanText(fileName || getFileNameFromUrl(fileUrl)).toLowerCase();
  const type = cleanText(fileType).toLowerCase();
  const url = cleanText(fileUrl).toLowerCase();

  return (
    type.includes("pdf") ||
    url.startsWith("data:application/pdf") ||
    name.endsWith(".pdf")
  );
}

function getAttachmentFromFormAndCandidate(form = {}, candidate = {}) {
  const fileName =
    form.assessmentFileName ||
    form.assessmentAttachmentName ||
    candidate.assessmentFileName ||
    candidate.assessmentAttachmentName ||
    "";

  const savedFileName =
    form.assessmentSavedFileName ||
    form.assessmentAttachmentSavedFileName ||
    candidate.assessmentSavedFileName ||
    candidate.assessmentAttachmentSavedFileName ||
    "";

  const fileUrl =
    form.assessmentFileUrl ||
    form.assessmentAttachmentUrl ||
    candidate.assessmentFileUrl ||
    candidate.assessmentAttachmentUrl ||
    "";

  const filePath =
    form.assessmentFilePath ||
    form.assessmentAttachmentPath ||
    candidate.assessmentFilePath ||
    candidate.assessmentAttachmentPath ||
    "";

  const fileType =
    form.assessmentFileType ||
    form.assessmentAttachmentType ||
    candidate.assessmentFileType ||
    candidate.assessmentAttachmentType ||
    "";

  const fileSize =
    form.assessmentFileSize ||
    form.assessmentAttachmentSize ||
    candidate.assessmentFileSize ||
    candidate.assessmentAttachmentSize ||
    "";

  const finalFileName =
    fileName ||
    savedFileName ||
    getFileNameFromUrl(fileUrl) ||
    getFileNameFromUrl(filePath) ||
    "";

  if (!finalFileName && !fileUrl && !filePath) return null;

  return {
    fileName: finalFileName || "Assessment attachment",
    savedFileName,
    fileUrl,
    filePath,
    fileType,
    fileSize,
    resolvedUrl: getResolvedUrl(fileUrl),
  };
}

function CustomDropdown({
  label,
  required = false,
  value = "",
  placeholder = "Select",
  options = [],
  disabled = false,
  onChange,
}) {
  const dropdownRef = useRef(null);
  const [open, setOpen] = useState(false);

  const selectedValue = cleanText(value);
  const displayValue = selectedValue || placeholder;

  useEffect(() => {
    function handleClickOutside(event) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target)
      ) {
        setOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  return (
    <div className="relative" ref={dropdownRef}>
      <label className="mb-2 block text-[11px] font-extrabold uppercase tracking-wide text-sibs-primary-1">
        {label} {required && <span className="text-red-500">*</span>}
      </label>

      <button
        type="button"
        disabled={disabled}
        onClick={() => setOpen((previous) => !previous)}
        className={`flex h-12 w-full items-center justify-between gap-3 rounded-xl border bg-white px-4 text-left text-sm font-extrabold shadow-sm outline-none transition ${
          open
            ? "border-sibs-primary-1 ring-4 ring-sibs-primary-1/10"
            : "border-[#D6DEE8] hover:border-sibs-primary-1/50"
        } ${
          disabled
            ? "cursor-not-allowed bg-[#F8FAFC] text-[#98A2B3] opacity-70"
            : "text-[#101828]"
        }`}
      >
        <span
          className={`min-w-0 flex-1 truncate ${
            selectedValue ? "text-[#101828]" : "text-[#667085]"
          }`}
        >
          {displayValue}
        </span>

        <ChevronDown
          size={18}
          className={`shrink-0 text-sibs-primary-1 transition-transform duration-200 ${
            open ? "rotate-180" : ""
          }`}
        />
      </button>

      {open && !disabled && (
        <div className="absolute left-0 right-0 top-[calc(100%+8px)] z-[10050] overflow-hidden rounded-xl border border-[#D6DEE8] bg-white shadow-xl">
          <div className="max-h-60 overflow-y-auto p-1">
            {options.map((option) => {
              const isSelected = selectedValue === option;

              return (
                <button
                  key={option}
                  type="button"
                  onClick={() => {
                    onChange?.(option);
                    setOpen(false);
                  }}
                  className={`flex w-full items-center justify-between gap-3 rounded-lg px-3 py-2.5 text-left text-sm font-extrabold transition ${
                    isSelected
                      ? "bg-sibs-primary-1 text-white"
                      : "text-[#344054] hover:bg-[#F3F8FF] hover:text-sibs-primary-1"
                  }`}
                >
                  <span className="truncate">{option}</span>

                  {isSelected && <Check size={16} className="shrink-0" />}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

function AssessmentAttachmentPreview({ attachment }) {
  if (!attachment?.resolvedUrl) return null;

  const image = isImageFile(
    attachment.fileName,
    attachment.fileType,
    attachment.resolvedUrl,
  );

  const pdf = isPdfFile(
    attachment.fileName,
    attachment.fileType,
    attachment.resolvedUrl,
  );

  if (image) {
    return (
      <div className="mt-4 overflow-hidden rounded-xl border border-[#D9E2EC] bg-white">
        <img
          src={attachment.resolvedUrl}
          alt={attachment.fileName || "Assessment attachment"}
          className="max-h-[320px] w-full object-contain"
        />
      </div>
    );
  }

  if (pdf) {
    return (
      <div className="mt-4 overflow-hidden rounded-xl border border-[#D9E2EC] bg-white">
        <iframe
          src={attachment.resolvedUrl}
          title={attachment.fileName || "Assessment PDF"}
          className="h-[320px] w-full"
        />
      </div>
    );
  }

  return (
    <div className="mt-4 rounded-xl border border-[#D9E2EC] bg-white p-4 text-center">
      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-[#F3F8FF] text-sibs-primary-1">
        <FileText size={24} />
      </div>

      <p className="mt-3 text-sm font-extrabold text-[#101828]">
        Preview is not available for this file type.
      </p>

      <p className="mt-1 text-xs font-semibold text-[#667085]">
        Click View uploaded file to open it.
      </p>
    </div>
  );
}

const AssessmentModal = ({
  open,
  candidate,
  form,
  setForm,
  onClose,
  onSubmit,
  onSendEmail,
}) => {
  const fileInputRef = useRef(null);

  const safeForm = form || {};
  const safeCandidate = candidate || {};

  const assessmentStatus =
    safeForm.assessmentStatus ||
    getAssessmentStatus(safeCandidate) ||
    "Not Take";

  const assessmentResult =
    safeForm.assessmentResult || getAssessmentResult(safeCandidate) || "";

  const isTaken = assessmentStatus === "Taken";

  const attachment = useMemo(
    () => getAttachmentFromFormAndCandidate(safeForm, safeCandidate),
    [safeForm, safeCandidate],
  );

  const hasAssessmentFile = Boolean(attachment);
  const assessmentLink = useMemo(
    () => buildAssessmentLink(safeCandidate),
    [safeCandidate],
  );
  const resolvedAssessmentLink = getResolvedUrl(assessmentLink);

  if (!open || !candidate) return null;

  function updateForm(nextValues) {
    if (typeof setForm !== "function") return;

    setForm((previous) => ({
      ...(previous || {}),
      ...nextValues,
    }));
  }

  async function handleAssessmentFileChange(event) {
    const file = event.target.files?.[0];

    if (!file) return;

    const lowerName = file.name.toLowerCase();

    const isAcceptedType =
      ACCEPTED_ASSESSMENT_FILE_TYPES.includes(file.type) ||
      lowerName.endsWith(".pdf") ||
      lowerName.endsWith(".jpg") ||
      lowerName.endsWith(".jpeg") ||
      lowerName.endsWith(".png") ||
      lowerName.endsWith(".webp") ||
      lowerName.endsWith(".gif");

    if (!isAcceptedType) {
      alert("Please upload a PDF document or image file only.");

      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }

      return;
    }

    try {
      const fileUrl = await readAssessmentFileAsDataUrl(file);

      updateForm({
        assessmentFileName: file.name,
        assessmentSavedFileName: "",
        assessmentFileUrl: fileUrl,
        assessmentFilePath: "",
        assessmentFileType: file.type || "application/octet-stream",
        assessmentFileSize: file.size,

        assessmentAttachmentName: file.name,
        assessmentAttachmentSavedFileName: "",
        assessmentAttachmentUrl: fileUrl,
        assessmentAttachmentPath: "",
        assessmentAttachmentType: file.type || "application/octet-stream",
        assessmentAttachmentSize: file.size,
      });
    } catch (error) {
      console.error("ASSESSMENT FILE UPLOAD ERROR:", error);
      alert("Unable to prepare file preview. Please try uploading again.");
    } finally {
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  }

  function handleRemoveAssessmentFile() {
    updateForm({
      assessmentFileName: "",
      assessmentSavedFileName: "",
      assessmentFileUrl: "",
      assessmentFilePath: "",
      assessmentFileType: "",
      assessmentFileSize: "",

      assessmentAttachmentName: "",
      assessmentAttachmentSavedFileName: "",
      assessmentAttachmentUrl: "",
      assessmentAttachmentPath: "",
      assessmentAttachmentType: "",
      assessmentAttachmentSize: "",
    });

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }

  function handleStatusChange(value) {
    updateForm({
      assessmentStatus: value,
      assessmentResult: value === "Taken" ? safeForm.assessmentResult : "",
      ...(value === "Taken"
        ? {}
        : {
            assessmentFileName: "",
            assessmentSavedFileName: "",
            assessmentFileUrl: "",
            assessmentFilePath: "",
            assessmentFileType: "",
            assessmentFileSize: "",
            assessmentAttachmentName: "",
            assessmentAttachmentSavedFileName: "",
            assessmentAttachmentUrl: "",
            assessmentAttachmentPath: "",
            assessmentAttachmentType: "",
            assessmentAttachmentSize: "",
          }),
    });
  }

  function handleResultChange(value) {
    updateForm({
      assessmentResult: value,
    });
  }

  function handleRemarksChange(value) {
    updateForm({
      assessmentRemarks: value,
    });
  }

  function handleSubmit(event) {
    event?.preventDefault?.();

    if (isTaken && !assessmentResult) {
      alert("Please select the assessment result.");
      return;
    }

    onSubmit(event);
  }

  return (
    <div
      className="fixed inset-0 z-[10002] flex h-dvh items-center justify-center bg-black/40 px-4 py-4"
      onClick={onClose}
    >
      <div
        className="flex max-h-[92dvh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl bg-white shadow-xl"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4 border-b border-gray-100 px-5 py-4 sm:px-6 sm:py-5">
          <div>
            <h2 className="text-lg font-bold text-sibs-primary-1 sm:text-xl">
              Online Assessment
            </h2>

            <p className="mt-1 text-sm font-medium text-sibs-tertiary-5">
              Update status, tag result, and attach assessment proof after the
              candidate takes the assessment.
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

        <form
          id="assessment-form"
          onSubmit={handleSubmit}
          className="flex-1 overflow-y-auto p-4 sm:p-6"
        >
          <div className="space-y-5">
            <div className="rounded-xl border border-[#E6ECF2] bg-[#F8FAFC] p-4">
              <h3 className="text-lg font-bold text-sibs-primary-1">
                {safeCandidate.name || safeCandidate.candidateName || "Candidate"}
              </h3>

              <p className="mt-1 text-sm font-semibold text-sibs-primary-1/80">
                {safeCandidate.email || "No email"}
              </p>

              <div className="mt-3 flex flex-wrap gap-2">
                <span
                  className={`inline-flex rounded-full border px-3 py-1 text-xs font-bold ${getAssessmentStatusClass(
                    assessmentStatus,
                  )}`}
                >
                  Assessment: {assessmentStatus}
                </span>

                <span
                  className={`inline-flex rounded-full border px-3 py-1 text-xs font-bold ${getAssessmentResultClass(
                    assessmentResult,
                  )}`}
                >
                  {assessmentResult || "No Result"}
                </span>
              </div>
            </div>

            <div className="rounded-xl border border-[#E6ECF2] bg-[#F8FAFC] p-4">
              <DetailRow
                label="Assessment Email Sent"
                value={safeCandidate.assessmentEmailSent ? "Yes" : "No"}
              />

              <DetailRow
                label="Email Sent At"
                value={safeCandidate.assessmentEmailSentAt}
              />

              <div className="grid grid-cols-1 gap-2 border-b border-[#E6ECF2] py-3 last:border-b-0 sm:grid-cols-[180px_minmax(0,1fr)] sm:items-start">
                <p className="text-[11px] font-bold uppercase tracking-wide text-sibs-tertiary-5">
                  Assessment Link
                </p>

                {assessmentLink ? (
                  <button
                    type="button"
                    title={assessmentLink}
                    onClick={() => {
                      window.open(
                        resolvedAssessmentLink,
                        "_blank",
                        "noopener,noreferrer",
                      );
                    }}
                    className="min-w-0 break-all text-left text-sm font-bold leading-6 text-sibs-primary-1 underline underline-offset-2 transition hover:text-blue-700 sm:text-right"
                  >
                    {assessmentLink}
                  </button>
                ) : (
                  <p className="text-sm font-bold text-[#344054] sm:text-right">
                    —
                  </p>
                )}
              </div>
            </div>

            <CustomDropdown
              label="Assessment Status"
              required
              value={assessmentStatus}
              options={assessmentStatusOptions}
              placeholder="Select status"
              onChange={handleStatusChange}
            />

            {isTaken && (
              <>
                <CustomDropdown
                  label="Assessment Result"
                  required
                  value={assessmentResult}
                  options={assessmentResultOptions}
                  placeholder="Select result"
                  onChange={handleResultChange}
                />

                <div>
                  <label className="mb-1 block text-[11px] font-bold uppercase tracking-wide text-sibs-tertiary-5">
                    Assessment Attachment
                  </label>

                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".pdf,image/png,image/jpeg,image/jpg,image/webp,image/gif"
                    onChange={handleAssessmentFileChange}
                    className="hidden"
                  />

                  {!hasAssessmentFile ? (
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="flex w-full flex-col items-center justify-center rounded-xl border border-dashed border-sibs-primary-1/40 bg-[#F8FAFC] px-5 py-8 text-center transition hover:border-sibs-primary-1 hover:bg-blue-50"
                    >
                      <span className="flex h-12 w-12 items-center justify-center rounded-full bg-white text-sibs-primary-1 shadow-sm">
                        <UploadCloud size={24} />
                      </span>

                      <span className="mt-3 text-sm font-extrabold text-sibs-primary-1">
                        Choose assessment file
                      </span>

                      <span className="mt-1 text-xs font-semibold text-sibs-tertiary-5">
                        Accepted: PDF, PNG, JPG, JPEG, WEBP, GIF
                      </span>
                    </button>
                  ) : (
                    <div className="rounded-xl border border-[#D9E2EC] bg-[#F8FAFC] p-4">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex min-w-0 items-start gap-3">
                          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white text-sibs-primary-1 shadow-sm">
                            {isImageFile(
                              attachment.fileName,
                              attachment.fileType,
                              attachment.resolvedUrl,
                            ) ? (
                              <FileImage size={22} />
                            ) : (
                              <FileText size={22} />
                            )}
                          </div>

                          <div className="min-w-0">
                            <p
                              title={attachment.fileName}
                              className="truncate text-sm font-extrabold text-[#101828]"
                            >
                              {attachment.fileName}
                            </p>

                            <p className="mt-1 text-xs font-semibold text-sibs-tertiary-5">
                              {attachment.fileType || "File"} ·{" "}
                              {formatFileSize(attachment.fileSize)}
                            </p>

                            {attachment.resolvedUrl && (
                              <button
                                type="button"
                                onClick={() => {
                                  window.open(
                                    attachment.resolvedUrl,
                                    "_blank",
                                    "noopener,noreferrer",
                                  );
                                }}
                                className="mt-2 inline-flex items-center gap-1 text-xs font-extrabold text-blue-700 underline"
                              >
                                <ExternalLink size={13} />
                                View uploaded file
                              </button>
                            )}
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={handleRemoveAssessmentFile}
                          className="shrink-0 rounded-full p-2 text-gray-400 transition hover:bg-red-50 hover:text-red-600"
                        >
                          <X size={18} />
                        </button>
                      </div>

                      <AssessmentAttachmentPreview attachment={attachment} />

                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="mt-4 inline-flex h-10 items-center justify-center rounded-xl border border-[#D6DEE8] bg-white px-4 text-xs font-extrabold text-sibs-primary-1 transition hover:bg-[#F8FAFC]"
                      >
                        Replace File
                      </button>
                    </div>
                  )}
                </div>
              </>
            )}

            <div>
              <label className="mb-1 block text-[11px] font-bold uppercase tracking-wide text-sibs-tertiary-5">
                Assessment Remarks
              </label>

              <textarea
                rows={4}
                value={safeForm.assessmentRemarks || ""}
                onChange={(event) => handleRemarksChange(event.target.value)}
                placeholder="Example: Candidate completed assessment and passed required score."
                className={textareaClass()}
              />
            </div>
          </div>
        </form>

        <div className="border-t border-gray-100 px-5 py-4 sm:px-6">
          <div className="flex flex-col justify-end gap-2 sm:flex-row">
            <button
              type="button"
              onClick={onClose}
              className="inline-flex h-11 items-center justify-center rounded-xl border border-[#E6ECF2] bg-white px-5 text-sm font-bold text-gray-600 transition hover:bg-gray-50"
            >
              Cancel
            </button>

            <button
              type="submit"
              form="assessment-form"
              className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-sibs-primary-1 px-5 text-sm font-bold text-white transition hover:opacity-90"
            >
              <ClipboardCheck size={16} />
              Save Assessment
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AssessmentModal;