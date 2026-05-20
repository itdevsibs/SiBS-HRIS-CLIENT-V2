import React from "react";
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
import { ClipboardCheck, Mail, X } from "lucide-react";
import {
  assessmentResultOptions,
  assessmentStatusOptions,
} from "../../../lib/utils/candidatePipeline/candidatePipelineConstants";

const AssessmentModal = ({
  open,
  candidate,
  form,
  setForm,
  onClose,
  onSubmit,
  onSendEmail,
}) => {
  if (!open || !candidate) return null;

  const isTaken = form.assessmentStatus === "Taken";

  return (
    <div
      className="fixed inset-0 z-[10002] flex h-dvh items-center justify-center bg-black/40 px-4 py-4"
      onClick={onClose}
    >
      <div
        className="flex max-h-[92dvh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl bg-white shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4 border-b border-gray-100 px-5 py-4 sm:px-6 sm:py-5">
          <div>
            <h2 className="text-lg font-bold text-sibs-primary-1 sm:text-xl">
              Online Assessment
            </h2>
            <p className="mt-1 text-sm font-medium text-sibs-tertiary-5">
              Update status and tag result after candidate takes assessment.
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

        <form onSubmit={onSubmit} className="flex-1 overflow-y-auto p-4 sm:p-6">
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

            <button
              type="button"
              onClick={() => onSendEmail(candidate)}
              className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl border border-cyan-100 bg-cyan-50 px-5 text-sm font-bold text-cyan-700 transition hover:bg-cyan-100"
            >
              <Mail size={16} />
              Resend Assessment Email
            </button>

            <div>
              <label className="mb-1 block text-[11px] font-bold uppercase tracking-wide text-sibs-tertiary-5">
                Assessment Status <span className="text-red-500">*</span>
              </label>

              <select
                required
                value={form.assessmentStatus}
                onChange={(e) =>
                  setForm({
                    ...form,
                    assessmentStatus: e.target.value,
                    assessmentResult:
                      e.target.value === "Taken" ? form.assessmentResult : "",
                  })
                }
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
              <div>
                <label className="mb-1 block text-[11px] font-bold uppercase tracking-wide text-sibs-tertiary-5">
                  Assessment Result <span className="text-red-500">*</span>
                </label>

                <select
                  required
                  value={form.assessmentResult}
                  onChange={(e) =>
                    setForm({ ...form, assessmentResult: e.target.value })
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
            )}

            <div>
              <label className="mb-1 block text-[11px] font-bold uppercase tracking-wide text-sibs-tertiary-5">
                Assessment Remarks
              </label>

              <textarea
                rows={4}
                value={form.assessmentRemarks}
                onChange={(e) =>
                  setForm({ ...form, assessmentRemarks: e.target.value })
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
              type="button"
              onClick={onSubmit}
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
