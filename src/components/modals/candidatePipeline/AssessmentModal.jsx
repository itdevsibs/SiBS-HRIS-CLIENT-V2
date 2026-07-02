import { useEffect, useMemo, useRef, useState } from "react";
import { Loader2, UploadCloud, X } from "lucide-react";
import api from "../../../lib/axios/api-template";

const ASSESSMENT_STATUS_OPTIONS = ["Not Take", "Taken"];

const ASSESSMENT_RESULT_OPTIONS = [
  "Assessment Fit",
  "Assessment Not Fit",
  "For Reassessment",
];

function cleanText(value) {
  return String(value ?? "").trim();
}

function getCandidateId(candidate = {}) {
  return (
    candidate.id ||
    candidate.dbId ||
    candidate.candidateId ||
    candidate.candidate_id ||
    candidate.candidateApplicationId ||
    candidate.candidate_application_id ||
    ""
  );
}

function getCandidateName(candidate = {}) {
  return (
    cleanText(candidate.name) ||
    cleanText(candidate.candidateName) ||
    cleanText(candidate.fullName) ||
    "Unnamed Candidate"
  );
}

function getCandidateEmail(candidate = {}) {
  return cleanText(candidate.email) || "No email saved";
}

function getInitialScore(candidate = {}) {
  const value =
    candidate.assessmentScore ??
    candidate.assessment_score ??
    candidate.assessmentScorePercent ??
    candidate.assessment_score_percent ??
    "";

  if (value === null || value === undefined || value === "") return "";

  return String(value);
}

function getExistingAttachmentName(candidate = {}) {
  return (
    cleanText(candidate.assessmentFileName) ||
    cleanText(candidate.assessment_file_name) ||
    cleanText(candidate.assessmentAttachmentName) ||
    cleanText(candidate.assessment_attachment_name) ||
    ""
  );
}

function ModalFieldLabel({ children, required = false }) {
  return (
    <label className="mb-2 block text-[12px] font-extrabold uppercase tracking-wide text-sibs-primary-1">
      {children}
      {required && <span className="text-red-500"> *</span>}
    </label>
  );
}

function ModalSelect({ value, onChange, disabled = false, children }) {
  return (
    <select
      value={value}
      onChange={onChange}
      disabled={disabled}
      className="h-11 w-full rounded-xl border border-[#D0D5DD] bg-white px-4 text-sm font-bold text-[#344054] outline-none transition focus:border-sibs-primary-1 focus:ring-4 focus:ring-sibs-primary-1/10 disabled:cursor-not-allowed disabled:bg-[#F8FAFC] disabled:text-[#667085]"
    >
      {children}
    </select>
  );
}

function ModalInput({ className = "", ...props }) {
  return (
    <input
      {...props}
      className={`h-11 w-full rounded-xl border border-[#D0D5DD] bg-white px-4 text-sm font-bold text-[#344054] outline-none transition placeholder:text-[#98A2B3] focus:border-sibs-primary-1 focus:ring-4 focus:ring-sibs-primary-1/10 disabled:cursor-not-allowed disabled:bg-[#F8FAFC] disabled:text-[#667085] ${className}`}
    />
  );
}

function ModalTextarea({ className = "", ...props }) {
  return (
    <textarea
      {...props}
      className={`min-h-[120px] w-full resize-none rounded-xl border border-[#D0D5DD] bg-white px-4 py-3 text-sm font-semibold text-[#344054] outline-none transition placeholder:text-[#98A2B3] focus:border-sibs-primary-1 focus:ring-4 focus:ring-sibs-primary-1/10 disabled:cursor-not-allowed disabled:bg-[#F8FAFC] disabled:text-[#667085] ${className}`}
    />
  );
}

export default function AssessmentModal({
  open,
  candidate,
  selectedCandidate,
  onClose,
  onSaved,
  onSuccess,
}) {
  const activeCandidate = useMemo(
    () => candidate || selectedCandidate || {},
    [candidate, selectedCandidate],
  );

  const fileInputRef = useRef(null);

  const [assessmentStatus, setAssessmentStatus] = useState("Not Take");
  const [assessmentResult, setAssessmentResult] = useState("");
  const [assessmentScore, setAssessmentScore] = useState("");
  const [assessmentRemarks, setAssessmentRemarks] = useState("");
  const [assessmentFile, setAssessmentFile] = useState(null);
  const [saving, setSaving] = useState(false);

  const candidateId = getCandidateId(activeCandidate);
  const candidateName = getCandidateName(activeCandidate);
  const candidateEmail = getCandidateEmail(activeCandidate);
  const existingAttachmentName = getExistingAttachmentName(activeCandidate);

  useEffect(() => {
    if (!open) return;

    const initialStatus =
      cleanText(activeCandidate.assessmentStatus) ||
      cleanText(activeCandidate.assessment_status) ||
      "Not Take";

    const initialResult =
      cleanText(activeCandidate.assessmentResult) ||
      cleanText(activeCandidate.assessment_result) ||
      "";

    const initialRemarks =
      cleanText(activeCandidate.assessmentRemarks) ||
      cleanText(activeCandidate.assessment_remarks) ||
      "";

    setAssessmentStatus(initialStatus || "Not Take");
    setAssessmentResult(initialResult);
    setAssessmentScore(getInitialScore(activeCandidate));
    setAssessmentRemarks(initialRemarks);
    setAssessmentFile(null);

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }, [open, activeCandidate]);

  if (!open) return null;

  const isTaken = assessmentStatus === "Taken";

  function handleStatusChange(value) {
    setAssessmentStatus(value);

    if (value !== "Taken") {
      setAssessmentResult("");
      setAssessmentScore("");
      setAssessmentFile(null);

      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  }

  function handleScoreChange(value) {
    const rawValue = cleanText(value);

    if (rawValue === "") {
      setAssessmentScore("");
      return;
    }

    const numberValue = Number(rawValue);

    if (!Number.isFinite(numberValue)) return;
    if (numberValue < 0) return;
    if (numberValue > 100) return;

    setAssessmentScore(rawValue);
  }

  function handleFileChange(e) {
    const file = e.target.files?.[0] || null;
    setAssessmentFile(file);
  }

  async function handleSubmit(e) {
    e.preventDefault();

    if (!candidateId) {
      window.alert("Candidate ID is missing.");
      return;
    }

    if (assessmentStatus === "Taken" && !assessmentResult) {
      window.alert("Assessment result is required when status is Taken.");
      return;
    }

    if (assessmentScore !== "") {
      const scoreValue = Number(assessmentScore);

      if (!Number.isFinite(scoreValue) || scoreValue < 0 || scoreValue > 100) {
        window.alert("Assessment score must be from 0 to 100.");
        return;
      }
    }

    try {
      setSaving(true);

      const formData = new FormData();

      formData.append("assessmentStatus", assessmentStatus);
      formData.append("assessmentResult", isTaken ? assessmentResult : "");
      formData.append("assessmentScore", isTaken ? assessmentScore : "");
      formData.append("assessmentRemarks", assessmentRemarks || "");

      if (assessmentFile) {
        formData.append("assessmentFile", assessmentFile);
      }

      const res = await api.post(
        `/api/candidate-pipeline/${candidateId}/assessment`,
        formData,
        {
          withCredentials: true,
          headers: {
            "Content-Type": "multipart/form-data",
          },
        },
      );

      const updatedCandidate = res.data?.candidate || res.data?.data || null;

      onSaved?.(updatedCandidate);
      onSuccess?.(updatedCandidate);
      onClose?.();
    } catch (error) {
      console.error("SAVE ASSESSMENT ERROR:", error);

      window.alert(
        error?.response?.data?.message ||
          error?.response?.data?.error ||
          error?.message ||
          "Failed to save assessment.",
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/45 px-4 py-6">
      <form
        onSubmit={handleSubmit}
        className="flex max-h-[92vh] w-full max-w-[580px] flex-col overflow-hidden rounded-2xl bg-white shadow-2xl"
      >
        <div className="shrink-0 border-b border-[#E6ECF2] bg-white px-6 py-5">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <h2 className="text-xl font-extrabold text-sibs-primary-1">
                Update Assessment
              </h2>

              <p className="mt-1 text-sm font-semibold leading-6 text-sibs-tertiary-5">
                Save the candidate&apos;s online assessment status, result,
                score, and attachment.
              </p>
            </div>

            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className="rounded-full p-2 text-gray-400 transition hover:bg-gray-100 hover:text-gray-700 disabled:cursor-not-allowed disabled:opacity-60"
              aria-label="Close assessment modal"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto bg-[#F8FAFC] px-6 py-6">
          <div className="rounded-2xl border border-[#E2E8F0] bg-white p-4">
            <p className="text-[11px] font-extrabold uppercase tracking-wide text-sibs-primary-1">
              Candidate
            </p>

            <p className="mt-2 text-base font-extrabold uppercase text-[#111827]">
              {candidateName}
            </p>

            <p className="mt-1 break-all text-sm font-bold text-[#0D4676]">
              {candidateEmail}
            </p>
          </div>

          <div className="mt-5">
            <ModalFieldLabel required>Assessment Status</ModalFieldLabel>

            <ModalSelect
              value={assessmentStatus}
              onChange={(e) => handleStatusChange(e.target.value)}
              disabled={saving}
            >
              {ASSESSMENT_STATUS_OPTIONS.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </ModalSelect>
          </div>

          <div className="mt-5">
            <ModalFieldLabel required={isTaken}>Assessment Result</ModalFieldLabel>

            <ModalSelect
              value={assessmentResult}
              onChange={(e) => setAssessmentResult(e.target.value)}
              disabled={saving || !isTaken}
            >
              <option value="">
                {isTaken ? "Select assessment result" : "Not required"}
              </option>

              {ASSESSMENT_RESULT_OPTIONS.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </ModalSelect>
          </div>

          <div className="mt-5">
            <ModalFieldLabel>Assessment Score</ModalFieldLabel>

            <ModalInput
              type="number"
              min="0"
              max="100"
              step="0.01"
              value={assessmentScore}
              onChange={(e) => handleScoreChange(e.target.value)}
              placeholder="Enter score from 0 to 100"
              disabled={saving || !isTaken}
            />

            <p className="mt-1 text-[11px] font-semibold text-sibs-tertiary-5">
              Example: 85, 92.5, or 100.
            </p>
          </div>

          <div className="mt-5">
            <ModalFieldLabel>Remarks</ModalFieldLabel>

            <ModalTextarea
              value={assessmentRemarks}
              onChange={(e) => setAssessmentRemarks(e.target.value)}
              placeholder="Add assessment remarks."
              disabled={saving}
            />
          </div>

          <div className="mt-5">
            <ModalFieldLabel>Assessment Attachment</ModalFieldLabel>

            <div className="rounded-2xl border border-dashed border-[#BFD0E4] bg-white p-4">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={saving || !isTaken}
                  className="inline-flex h-10 w-fit items-center justify-center gap-2 rounded-xl bg-sibs-primary-1 px-4 text-sm font-extrabold text-white transition hover:bg-sibs-primary-1/90 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <UploadCloud size={17} />
                  Choose File
                </button>

                <p className="min-w-0 truncate text-sm font-bold text-[#344054]">
                  {assessmentFile?.name ||
                    existingAttachmentName ||
                    "No file chosen"}
                </p>
              </div>

              <input
                ref={fileInputRef}
                type="file"
                className="hidden"
                accept=".pdf,.doc,.docx,.xls,.xlsx,.csv,.jpg,.jpeg,.png,.webp,.heic,.heif"
                onChange={handleFileChange}
                disabled={saving || !isTaken}
              />

              <p className="mt-3 text-xs font-semibold text-[#0D4676]">
                Allowed: PDF, DOC, DOCX, XLS, XLSX, CSV, JPG, PNG, WEBP, HEIC.
              </p>
            </div>
          </div>
        </div>

        <div className="shrink-0 border-t border-[#E6ECF2] bg-white px-6 py-4">
          <div className="flex flex-col justify-end gap-3 sm:flex-row">
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className="inline-flex h-11 items-center justify-center rounded-xl border border-[#D6DEE8] bg-white px-5 text-sm font-bold text-gray-600 transition hover:bg-[#F8FAFC] hover:text-sibs-primary-1 disabled:cursor-not-allowed disabled:opacity-60"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={saving}
              className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-sibs-primary-1 px-5 text-sm font-extrabold text-white shadow-sm transition hover:bg-sibs-primary-1/90 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {saving && <Loader2 size={17} className="animate-spin" />}
              {saving ? "Saving..." : "Save Assessment"}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
