import React, { useState } from "react";
import { ArrowRight, Loader2 } from "lucide-react";

import {
  getNextStage,
  getStageClass,
  textareaClass,
} from "../../../lib/utils/candidatePipeline/candidatePipelineHelpers";
import CandidatePipelineModalShell, {
  CandidateModalPrimaryButton,
  CandidateModalSecondaryButton,
  CandidateModalSection,
} from "../../recruitment/candidatePipeline/CandidatePipelineModalShell";
import CandidateModalSummary from "../../recruitment/candidatePipeline/CandidateModalSummary";

const MoveStageModal = ({
  open,
  candidate,
  form,
  setForm,
  onClose,
  onSubmit,
}) => {
  const [processSubmitting, setProcessSubmitting] = useState(false);

  if (!open || !candidate) return null;

  const nextStage = getNextStage(candidate.currentStage);
  if (!nextStage) return null;

  async function handleSubmit(event) {
    event?.preventDefault?.();
    event?.stopPropagation?.();

    if (processSubmitting) return;

    setProcessSubmitting(true);
    try {
      await onSubmit?.(event);
    } finally {
      setProcessSubmitting(false);
    }
  }

  const footer = (
    <div className="flex flex-col-reverse justify-end gap-2 sm:flex-row">
      <CandidateModalSecondaryButton
        type="button"
        onClick={onClose}
        disabled={processSubmitting}
      >
        Cancel
      </CandidateModalSecondaryButton>

      <CandidateModalPrimaryButton
        type="button"
        onClick={handleSubmit}
        disabled={processSubmitting}
        aria-busy={processSubmitting}
        className="min-w-[142px]"
      >
        {processSubmitting ? (
          <Loader2 size={15} className="animate-spin" />
        ) : (
          <ArrowRight size={15} />
        )}
        {processSubmitting ? "Moving..." : "Confirm Move"}
      </CandidateModalPrimaryButton>
    </div>
  );

  return (
    <CandidatePipelineModalShell
      icon={ArrowRight}
      title="Move Candidate to Next Stage"
      subtitle="Record the movement reason before advancing the candidate through the recruitment pipeline."
      badge="Pipeline Movement"
      onClose={onClose}
      closeDisabled={processSubmitting}
      maxWidth="max-w-2xl"
      zIndex="z-[10001]"
      footer={footer}
    >
      <div className="space-y-4">
        <CandidateModalSummary
          candidate={candidate}
          stage={candidate.currentStage}
          statusClass={getStageClass(candidate.currentStage)}
        />

        <CandidateModalSection
          title="Stage Movement"
          subtitle="Confirm the current and next recruitment stages."
        >
          <div className="grid grid-cols-[1fr_auto_1fr] items-stretch gap-2 sm:gap-3">
            <div className="rounded-xl border border-[#D7DEE8] bg-[#F8FAFC] p-3 sm:p-4">
              <p className="sibs-kicker">Current Stage</p>
              <span
                className={`mt-2 inline-flex rounded-full border px-2.5 py-1 text-[10px] font-extrabold ${getStageClass(
                  candidate.currentStage,
                )}`}
              >
                {candidate.currentStage}
              </span>
            </div>

            <div className="flex items-center justify-center text-sibs-primary-1">
              <ArrowRight size={18} />
            </div>

            <div className="rounded-xl border border-[#FF5C28]/25 bg-[#FFF9F6] p-3 sm:p-4">
              <p className="sibs-kicker text-[#FF5C28]">Next Stage</p>
              <span
                className={`mt-2 inline-flex rounded-full border px-2.5 py-1 text-[10px] font-extrabold ${getStageClass(
                  nextStage,
                )}`}
              >
                {nextStage}
              </span>
            </div>
          </div>

          {nextStage === "Online Assessment" && (
            <div className="mt-4 rounded-xl border border-blue-100 bg-blue-50 px-4 py-3 sibs-text-xs font-semibold leading-5 text-sibs-primary-1">
              After confirmation, assessment status will be set to Not Take and
              the assessment email workflow will be triggered.
            </div>
          )}

          {nextStage === "Offered" && (
            <div className="mt-4 rounded-xl border border-amber-100 bg-amber-50 px-4 py-3 sibs-text-xs font-semibold leading-5 text-amber-800">
              Candidate will advance from Interviewed to Offered and continue to
              the offer preparation workflow.
            </div>
          )}
        </CandidateModalSection>

        <CandidateModalSection title="Movement Details">
          <form onSubmit={handleSubmit} className="space-y-4">
            <label className="block">
              <span className="mb-1.5 block sibs-kicker text-sibs-primary-1">
                Movement Reason <span className="text-red-500">*</span>
              </span>
              <textarea
                required
                rows={4}
                disabled={processSubmitting}
                value={form?.reason || ""}
                onChange={(event) =>
                  setForm({ ...form, reason: event.target.value })
                }
                className={textareaClass()}
                placeholder="Explain why the candidate is moving to the next stage."
              />
            </label>

            <label className="block">
              <span className="mb-1.5 block sibs-kicker text-sibs-primary-1">
                Internal Remarks
              </span>
              <textarea
                rows={3}
                disabled={processSubmitting}
                value={form?.remarks || ""}
                onChange={(event) =>
                  setForm({ ...form, remarks: event.target.value })
                }
                className={textareaClass()}
                placeholder="Add optional internal remarks."
              />
            </label>
          </form>
        </CandidateModalSection>
      </div>
    </CandidatePipelineModalShell>
  );
};

export default MoveStageModal;
