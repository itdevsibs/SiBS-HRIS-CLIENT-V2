import React, { useRef } from "react";
import {
  buildAssessmentLink,
  getAssessmentResult,
  getAssessmentResultClass,
  getAssessmentStatus,
  getAssessmentStatusClass,
  inputClass,
  textareaClass,
} from "../../../lib/utils/candidatePipeline/candidatePipelineHelpers";
import DetailRow from "../../layout/common/DetailRow";
import {
  ClipboardCheck,
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
];

function readAssessmentFileAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;

    reader.readAsDataURL(file);
  });
}

function formatFileSize(size = 0) {
  if (!size) return "—";

  const kb = size / 1024;

  if (kb < 1024) {
    return `${kb.toFixed(1)} KB`;
  }

  return `${(kb / 1024).toFixed(1)} MB`;
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

  if (!open || !candidate) return null;

  const isTaken = form.assessmentStatus === "Taken";

  const assessmentFileName =
    form.assessmentFileName ||
    form.assessmentAttachmentName ||
    candidate.assessmentFileName ||
    candidate.assessmentAttachmentName ||
    "";

  const assessmentFileType =
    form.assessmentFileType ||
    form.assessmentAttachmentType ||
    candidate.assessmentFileType ||
    candidate.assessmentAttachmentType ||
    "";

  const assessmentFileSize =
    form.assessmentFileSize ||
    form.assessmentAttachmentSize ||
    candidate.assessmentFileSize ||
    candidate.assessmentAttachmentSize ||
    "";

  const assessmentFileUrl =
    form.assessmentFileUrl ||
    form.assessmentAttachmentUrl ||
    candidate.assessmentFileUrl ||
    candidate.assessmentAttachmentUrl ||
    "";

  const hasAssessmentFile = Boolean(assessmentFileName || assessmentFileUrl);

  async function handleAssessmentFileChange(event) {
    const file = event.target.files?.[0];

    if (!file) return;

    const isAcceptedType =
      ACCEPTED_ASSESSMENT_FILE_TYPES.includes(file.type) ||
      file.name.toLowerCase().endsWith(".pdf") ||
      file.name.toLowerCase().endsWith(".jpg") ||
      file.name.toLowerCase().endsWith(".jpeg") ||
      file.name.toLowerCase().endsWith(".png") ||
      file.name.toLowerCase().endsWith(".webp");

    if (!isAcceptedType) {
      alert("Please upload a PDF document or image file only.");

      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }

      return;
    }

    try {
      const fileUrl = await readAssessmentFileAsDataUrl(file);

      setForm({
        ...form,
        assessmentFileName: file.name,
        assessmentFileUrl: fileUrl,
        assessmentFileType: file.type || "application/octet-stream",
        assessmentFileSize: file.size,
        assessmentAttachmentName: file.name,
        assessmentAttachmentUrl: fileUrl,
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
    setForm({
      ...form,
      assessmentFileName: "",
      assessmentFileUrl: "",
      assessmentFileType: "",
      assessmentFileSize: "",
      assessmentAttachmentName: "",
      assessmentAttachmentUrl: "",
      assessmentAttachmentType: "",
      assessmentAttachmentSize: "",
    });

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }

  function handleStatusChange(value) {
    setForm({
      ...form,
      assessmentStatus: value,
      assessmentResult: value === "Taken" ? form.assessmentResult : "",
      assessmentFileName: value === "Taken" ? form.assessmentFileName : "",
      assessmentFileUrl: value === "Taken" ? form.assessmentFileUrl : "",
      assessmentFileType: value === "Taken" ? form.assessmentFileType : "",
      assessmentFileSize: value === "Taken" ? form.assessmentFileSize : "",
      assessmentAttachmentName:
        value === "Taken" ? form.assessmentAttachmentName : "",
      assessmentAttachmentUrl:
        value === "Taken" ? form.assessmentAttachmentUrl : "",
      assessmentAttachmentType:
        value === "Taken" ? form.assessmentAttachmentType : "",
      assessmentAttachmentSize:
        value === "Taken" ? form.assessmentAttachmentSize : "",
    });
  }

  function handleSubmit(event) {
    event?.preventDefault?.();

    if (isTaken && !form.assessmentResult) {
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
                {candidate.name}
              </h3>

              <p className="mt-1 text-sm font-semibold text-sibs-primary-1/80">
                {candidate.email}
              </p>

              <div className="mt-3 flex flex-wrap gap-2">
                <span
                  className={`inline-flex rounded-full border px-3 py-1 text-xs font-bold ${getAssessmentStatusClass(
                    getAssessmentStatus(candidate),
                  )}`}
                >
                  Assessment: {getAssessmentStatus(candidate)}
                </span>

                <span
                  className={`inline-flex rounded-full border px-3 py-1 text-xs font-bold ${getAssessmentResultClass(
                    getAssessmentResult(candidate),
                  )}`}
                >
                  {getAssessmentResult(candidate) || "No Result"}
                </span>
              </div>
            </div>

            <div className="rounded-xl border border-[#E6ECF2] bg-[#F8FAFC] p-4">
              <DetailRow
                label="Assessment Email Sent"
                value={candidate.assessmentEmailSent ? "Yes" : "No"}
              />

              <DetailRow
                label="Email Sent At"
                value={candidate.assessmentEmailSentAt}
              />

              <DetailRow
                label="Assessment Link"
                value={buildAssessmentLink(candidate)}
              />
            </div>

            <div>
              <label className="mb-1 block text-[11px] font-bold uppercase tracking-wide text-sibs-tertiary-5">
                Assessment Status <span className="text-red-500">*</span>
              </label>

              <select
                required
                value={form.assessmentStatus}
                onChange={(event) => handleStatusChange(event.target.value)}
                className={inputClass()}
              >
                {assessmentStatusOptions.map((status) => (
                  <option key={status} value={status}>
                    {status}
                  </option>
                ))}
              </select>
            </div>

            {isTaken && (
              <>
                <div>
                  <label className="mb-1 block text-[11px] font-bold uppercase tracking-wide text-sibs-tertiary-5">
                    Assessment Result <span className="text-red-500">*</span>
                  </label>

                  <select
                    required
                    value={form.assessmentResult}
                    onChange={(event) =>
                      setForm({
                        ...form,
                        assessmentResult: event.target.value,
                      })
                    }
                    className={inputClass()}
                  >
                    <option value="">Select result</option>

                    {assessmentResultOptions.map((result) => (
                      <option key={result} value={result}>
                        {result}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="mb-1 block text-[11px] font-bold uppercase tracking-wide text-sibs-tertiary-5">
                    Assessment Attachment
                  </label>

                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".pdf,image/png,image/jpeg,image/jpg,image/webp"
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
                        Accepted: PDF, PNG, JPG, JPEG, WEBP
                      </span>
                    </button>
                  ) : (
                    <div className="rounded-xl border border-[#D9E2EC] bg-[#F8FAFC] p-4">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex min-w-0 items-start gap-3">
                          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white text-sibs-primary-1 shadow-sm">
                            {String(assessmentFileType).includes("pdf") ||
                            assessmentFileName
                              .toLowerCase()
                              .endsWith(".pdf") ? (
                              <FileText size={22} />
                            ) : (
                              <FileImage size={22} />
                            )}
                          </div>

                          <div className="min-w-0">
                            <p
                              title={assessmentFileName}
                              className="truncate text-sm font-extrabold text-[#101828]"
                            >
                              {assessmentFileName}
                            </p>

                            <p className="mt-1 text-xs font-semibold text-sibs-tertiary-5">
                              {assessmentFileType || "File"} ·{" "}
                              {formatFileSize(assessmentFileSize)}
                            </p>

                            {assessmentFileUrl && (
                              <a
                                href={assessmentFileUrl}
                                target="_blank"
                                rel="noreferrer"
                                className="mt-2 inline-flex text-xs font-extrabold text-blue-700 underline"
                              >
                                View uploaded file
                              </a>
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
                value={form.assessmentRemarks}
                onChange={(event) =>
                  setForm({
                    ...form,
                    assessmentRemarks: event.target.value,
                  })
                }
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
