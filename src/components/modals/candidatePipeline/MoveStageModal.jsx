import React from "react";
import { ArrowRight, X } from "lucide-react";

import {
  getNextStage,
  getStageClass,
  textareaClass,
} from "../../../lib/utils/candidatePipeline/candidatePipelineHelpers";

const MoveStageModal = ({
  open,
  candidate,
  form,
  setForm,
  onClose,
  onSubmit,
}) => {
  if (!open || !candidate) return null;

  const nextStage = getNextStage(candidate.currentStage);
  if (!nextStage) return null;

  return (
    <div
      className="fixed inset-0 z-[10000] flex h-dvh items-center justify-center bg-black/40 px-4 py-4"
      onClick={onClose}
    >
      <div
        className="flex max-h-[92dvh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl bg-white shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4 border-b border-gray-100 px-5 py-4 sm:px-6 sm:py-5">
          <div>
            <h2 className="text-lg font-bold text-sibs-primary-1 sm:text-xl">
              Move Candidate
            </h2>
            <p className="mt-1 text-sm font-medium text-sibs-tertiary-5">
              Confirm movement from {candidate.currentStage} to {nextStage}.
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

              <div className="mt-3 flex flex-wrap items-center gap-2">
                <span
                  className={`inline-flex rounded-full border px-3 py-1 text-xs font-bold ${getStageClass(
                    candidate.currentStage,
                  )}`}
                >
                  From: {candidate.currentStage}
                </span>

                <ArrowRight size={15} className="text-sibs-primary-1" />

                <span
                  className={`inline-flex rounded-full border px-3 py-1 text-xs font-bold ${getStageClass(
                    nextStage,
                  )}`}
                >
                  To: {nextStage}
                </span>
              </div>
            </div>

            {nextStage === "Online Assessment" && (
              <div className="rounded-xl border border-cyan-100 bg-cyan-50 p-4 text-sm font-semibold leading-6 text-sibs-primary-1">
                After confirming, the candidate will move to Online Assessment,
                assessment status will be set to Not Take, and the assessment
                email will be triggered.
              </div>
            )}

            {nextStage === "Offered" && (
              <div className="rounded-xl border border-amber-100 bg-amber-50 p-4 text-sm font-semibold leading-6 text-sibs-primary-1">
                Candidate will move from Interviewed to Offered.
              </div>
            )}

            <div>
              <label className="mb-1 block text-[11px] font-bold uppercase tracking-wide text-sibs-tertiary-5">
                Movement Reason <span className="text-red-500">*</span>
              </label>

              <textarea
                required
                rows={4}
                value={form.reason}
                onChange={(e) => setForm({ ...form, reason: e.target.value })}
                className={textareaClass()}
              />
            </div>

            <div>
              <label className="mb-1 block text-[11px] font-bold uppercase tracking-wide text-sibs-tertiary-5">
                Internal Remarks
              </label>

              <textarea
                rows={3}
                value={form.remarks}
                onChange={(e) => setForm({ ...form, remarks: e.target.value })}
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
              <ArrowRight size={16} />
              Confirm Move
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MoveStageModal;
