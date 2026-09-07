import { useEffect, useMemo, useRef, useState } from "react";
import { ClipboardCheck, Loader2, UploadCloud } from "lucide-react";
import api from "../../../lib/axios/api-template";

import CandidatePipelineModalShell, {
  CandidateModalPrimaryButton,
  CandidateModalSecondaryButton,
  CandidateModalSection,
} from "../../recruitment/candidatePipeline/CandidatePipelineModalShell";
import DropdownField from "../../recruitment/availablePositions/DropdownField";
import CandidateModalSummary from "../../recruitment/candidatePipeline/CandidateModalSummary";

const ASSESSMENT_STATUS_OPTIONS = ["Not Take", "Taken"];

const ASSESSMENT_RESULT_OPTIONS = [
  "Assessment Fit",
  "Assessment Not Fit",
  "For Reassessment",
];

const INPUT_CLASS =
  "h-8.5 2xl:h-10 w-full rounded-xl border border-[#D7DEE8] bg-[#F8FAFC] px-3 font-jakarta sibs-text-xs font-semibold text-[#042C51] outline-none transition placeholder:text-[#6B88A8] hover:border-[#FF5C28]/40 hover:bg-white focus:border-[#FF5C28] focus:bg-white focus:ring-4 focus:ring-[#FF5C28]/10 disabled:cursor-not-allowed disabled:border-[#E6ECF2] disabled:bg-[#F2F4F7] disabled:text-[#98A2B3] disabled:hover:border-[#E6ECF2] disabled:hover:bg-[#F2F4F7] disabled:focus:ring-0";

const TEXTAREA_CLASS =
  "min-h-18 2xl:min-h-24 w-full resize-none rounded-xl border border-[#D7DEE8] bg-[#F8FAFC] px-3 py-2 font-jakarta sibs-text-xs font-semibold leading-5 text-[#042C51] outline-none transition placeholder:text-[#6B88A8] hover:border-[#FF5C28]/40 hover:bg-white focus:border-[#FF5C28] focus:bg-white focus:ring-4 focus:ring-[#FF5C28]/10 disabled:cursor-not-allowed disabled:border-[#E6ECF2] disabled:bg-[#F2F4F7] disabled:text-[#98A2B3]";

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
    <label className="mb-1.5 block font-jakarta text-[8.5px] 2xl:text-[9px] font-extrabold uppercase tracking-wide text-[#98A2B3]">
      {children}
      {required ? <span className="text-[#FF5C28]"> *</span> : null}
    </label>
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
  const existingAttachmentName = getExistingAttachmentName(activeCandidate);

  useEffect(() => {
    if (!open) return;

    const initialStatus =
      cleanText(activeCandidate.assessmentStatus) ||
      cleanText(activeCandidate.assessment_status) ||
      "Not Take";

    const initialRemarks =
      cleanText(activeCandidate.assessmentRemarks) ||
      cleanText(activeCandidate.assessment_remarks) ||
      "";

    setAssessmentStatus(initialStatus || "Not Take");
    setAssessmentResult("");
    setAssessmentScore("");
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

    // Auto-suggest Assessment Result based on score
    if (numberValue >= 80) {
      setAssessmentResult("Assessment Fit");
    } else if (numberValue >= 50) {
      setAssessmentResult("For Reassessment");
    } else {
      setAssessmentResult("Assessment Not Fit");
    }
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

      if (updatedCandidate && typeof updatedCandidate === "object") {
        window.dispatchEvent(
          new CustomEvent("ta-pipeline-candidates-updated", {
            detail: updatedCandidate,
          }),
        );
      }

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

  const footer = (
    <div className="flex flex-col-reverse justify-end gap-2.5 sm:flex-row">
      <CandidateModalSecondaryButton
        type="button"
        onClick={onClose}
        disabled={saving}
      >
        Cancel
      </CandidateModalSecondaryButton>
      <CandidateModalPrimaryButton
        type="submit"
        form="candidate-assessment-form"
        disabled={saving}
        className="min-w-[150px]"
      >
        {saving ? (
          <Loader2 size={15} className="animate-spin" />
        ) : (
          <ClipboardCheck size={15} />
        )}
        {saving ? "Saving..." : "Save Assessment"}
      </CandidateModalPrimaryButton>
    </div>
  );

  return (
    <CandidatePipelineModalShell
      open={open}
      title="Update Assessment"
      subtitle="Save the candidate's online assessment status, result, score, and attachment."
      icon={ClipboardCheck}
      onClose={onClose}
      closeDisabled={saving}
      maxWidth="max-w-xl"
      zIndex="z-[10001]"
      footer={footer}
    >
      {saving && (
        <div
          className="fixed inset-0 z-[24000] cursor-wait bg-transparent"
          aria-hidden="true"
        />
      )}

      <form
        id="candidate-assessment-form"
        onSubmit={handleSubmit}
        className={`space-y-4 font-jakarta ${saving ? "pointer-events-none opacity-70" : ""}`}
      >
        <CandidateModalSummary
          candidate={activeCandidate}
          stage={activeCandidate.currentStage || activeCandidate.currentPipelineStage || "Online Assessment"}
        />

        <CandidateModalSection
          title="Assessment Details"
          subtitle="Enter a fresh assessment result for this assessment attempt."
        >
          <div className="space-y-4">
            <DropdownField
              label="Assessment Status"
              required
              value={assessmentStatus}
              onChange={(val) => handleStatusChange(val)}
              options={ASSESSMENT_STATUS_OPTIONS}
              placeholder="Select status"
              searchable={false}
              disabled={saving}
              zIndex="z-[300]"
            />

            <div>
              <ModalFieldLabel>Assessment Score</ModalFieldLabel>
              <div className="relative">
                <input
                  type="number"
                  min="0"
                  max="100"
                  step="0.01"
                  value={assessmentScore}
                  onChange={(e) => handleScoreChange(e.target.value)}
                  placeholder="Enter score from 0 to 100"
                  disabled={saving || !isTaken}
                  className={`${INPUT_CLASS} pr-16 tabular-nums`}
                />
                <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center sibs-text-xs font-extrabold text-[#94A9C1]">
                  / 100
                </span>
              </div>
              <p className="mt-1.5 sibs-text-xs font-semibold leading-5 text-[#174A7C]">
                Enter the score first. The suggested result is selected automatically.
              </p>
            </div>

            <DropdownField
              label="Assessment Result"
              required={isTaken}
              value={assessmentResult}
              onChange={(val) => setAssessmentResult(val)}
              options={ASSESSMENT_RESULT_OPTIONS}
              placeholder={isTaken ? "Select assessment result" : "Not required"}
              searchable={false}
              disabled={saving || !isTaken}
              zIndex="z-[200]"
            />

            <div>
              <ModalFieldLabel>Remarks</ModalFieldLabel>
              <textarea
                value={assessmentRemarks}
                onChange={(e) => setAssessmentRemarks(e.target.value)}
                placeholder="Add assessment remarks..."
                disabled={saving}
                className={TEXTAREA_CLASS}
              />
            </div>

            <div>
              <ModalFieldLabel>Assessment Attachment</ModalFieldLabel>
              <div className="rounded-xl border border-dashed border-[#BFD0E2] bg-[#F8FAFC] p-3 transition hover:border-[#FF5C28]/35 hover:bg-white">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={saving || !isTaken}
                    className="inline-flex h-8.5 2xl:h-9 w-fit shrink-0 items-center justify-center gap-1.5 rounded-lg border border-[#D6E0EA] bg-white px-3 sibs-text-micro font-extrabold text-[#042C51] transition hover:border-[#FF5C28]/35 hover:bg-[#FFF8F5] hover:text-[#FF5C28] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#FF5C28]/15 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <UploadCloud size={14} />
                    Choose File
                  </button>
                  <p className="min-w-0 flex-1 truncate sibs-text-xs font-extrabold text-[#344054]">
                    {assessmentFile?.name || existingAttachmentName || "No file chosen"}
                  </p>
                </div>
                <p className="mt-2.5 sibs-text-xs font-semibold leading-5 text-[#174A7C]">
                  Allowed: PDF, DOC, DOCX, XLS, XLSX, CSV, JPG, PNG, WEBP, HEIC.
                </p>
                <input
                  ref={fileInputRef}
                  type="file"
                  className="hidden"
                  accept=".pdf,.doc,.docx,.xls,.xlsx,.csv,.jpg,.jpeg,.png,.webp,.heic,.heif"
                  onChange={handleFileChange}
                  disabled={saving || !isTaken}
                />
              </div>
            </div>
          </div>
        </CandidateModalSection>
      </form>
    </CandidatePipelineModalShell>
  );
}
