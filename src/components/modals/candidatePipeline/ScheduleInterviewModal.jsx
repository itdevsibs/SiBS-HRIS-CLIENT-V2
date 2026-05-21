import React from "react";
import {
  canScheduleInterview,
  getAssessmentResult,
  getAssessmentResultClass,
  getInterviewStatusClass,
  inputClass,
  textareaClass,
} from "../../../lib/utils/candidatePipeline/candidatePipelineHelpers";
import { interviewTypeOptions } from "../../../lib/utils/candidatePipeline/candidatePipelineConstants";
import { CalendarDays, X } from "lucide-react";

const ScheduleInterviewModal = ({
  open,
  candidate,
  form,
  setForm,
  onClose,
  onSubmit,
}) => {
  if (!open || !candidate) return null;

  const isUpdatingSchedule = candidate.currentStage === "Interview Scheduled";

  return (
    <div
      className="fixed inset-0 z-[10001] flex h-dvh items-center justify-center bg-black/40 px-4 py-4"
      onClick={onClose}
    >
      <div
        className="flex max-h-[92dvh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl bg-white shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4 border-b border-gray-100 px-5 py-4 sm:px-6 sm:py-5">
          <div>
            <h2 className="text-lg font-bold text-sibs-primary-1 sm:text-xl">
              {isUpdatingSchedule
                ? "Update Interview Schedule"
                : "Schedule Interview"}
            </h2>
            <p className="mt-1 text-sm font-medium text-sibs-tertiary-5">
              {isUpdatingSchedule
                ? "Update the interview date, time, and interview type."
                : "Only candidates tagged as Assessment Fit can be scheduled."}
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
                {candidate.roleAccount}
              </p>

              <div className="mt-3 flex flex-wrap gap-2">
                <span
                  className={`inline-flex rounded-full border px-3 py-1 text-xs font-bold ${getAssessmentResultClass(
                    getAssessmentResult(candidate),
                  )}`}
                >
                  {getAssessmentResult(candidate) || "No Result"}
                </span>

                {isUpdatingSchedule && (
                  <span
                    className={`inline-flex rounded-full border px-3 py-1 text-xs font-bold ${getInterviewStatusClass(
                      candidate.interviewStatus,
                    )}`}
                  >
                    {candidate.interviewStatus || "Scheduled"}
                  </span>
                )}
              </div>
            </div>

            {!isUpdatingSchedule && !canScheduleInterview(candidate) && (
              <div className="rounded-xl border border-red-100 bg-red-50 p-4 text-sm font-semibold leading-6 text-sibs-primary-1">
                This candidate cannot be scheduled yet. Assessment must be Taken
                and tagged as Assessment Fit.
              </div>
            )}

            <div>
              <label className="mb-1 block text-[11px] font-bold uppercase tracking-wide text-sibs-tertiary-5">
                Interview Date and Time <span className="text-red-500">*</span>
              </label>

              <input
                required
                type="datetime-local"
                value={form.interviewDate}
                onChange={(e) =>
                  setForm({ ...form, interviewDate: e.target.value })
                }
                className={inputClass()}
              />
            </div>

            <div>
              <label className="mb-1 block text-[11px] font-bold uppercase tracking-wide text-sibs-tertiary-5">
                Interview Type <span className="text-red-500">*</span>
              </label>

              <select
                required
                value={form.interviewType}
                onChange={(e) =>
                  setForm({ ...form, interviewType: e.target.value })
                }
                className={inputClass()}
              >
                <option value="">Select interview type</option>
                {interviewTypeOptions.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-1 block text-[11px] font-bold uppercase tracking-wide text-sibs-tertiary-5">
                Online Interview Link <span className="text-red-500">*</span>
              </label>

              <input
                type="text"
                disabled={form.interviewType !== "Online"}
                placeholder="Paste Online Interview Link Here..."
                value={form.onlineInterviewLink}
                onChange={(e) =>
                  setForm({ ...form, onlineInterviewLink: e.target.value })
                }
                className={inputClass()}
              />
            </div>

            <div>
              <label className="mb-1 block text-[11px] font-bold uppercase tracking-wide text-sibs-tertiary-5">
                Remarks
              </label>

              <textarea
                rows={3}
                value={form.remarks}
                onChange={(e) => setForm({ ...form, remarks: e.target.value })}
                className={textareaClass()}
                placeholder={
                  isUpdatingSchedule
                    ? "Example: Candidate requested to reschedule."
                    : "Example: Initial interview schedule created."
                }
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
              <CalendarDays size={16} />
              {isUpdatingSchedule ? "Update Schedule" : "Save Schedule"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ScheduleInterviewModal;
