import React, { useEffect, useMemo, useState } from "react";
import { DollarSign, Loader2 } from "lucide-react";

import CandidatePipelineModalShell, {
  CandidateModalPrimaryButton,
  CandidateModalSecondaryButton,
  CandidateModalSection,
} from "../../recruitment/candidatePipeline/CandidatePipelineModalShell";
import CandidateModalSummary from "../../recruitment/candidatePipeline/CandidateModalSummary";

function toNumber(value) {
  const numberValue = Number(value);
  return Number.isFinite(numberValue) ? numberValue : 0;
}

function formatCurrency(value) {
  return new Intl.NumberFormat("en-PH", {
    style: "currency",
    currency: "PHP",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(toNumber(value));
}

export default function RevisedOfferModal({
  open,
  candidate,
  currentBasicDailyRate = 0,
  currentDailyDeMinimis = 0,
  isSubmitting = false,
  onClose,
  onSubmit,
}) {
  const [basicDailyRate, setBasicDailyRate] = useState("");
  const [dailyDeMinimis, setDailyDeMinimis] = useState("");
  const [remarks, setRemarks] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    if (!open) return;

    setBasicDailyRate("");
    setDailyDeMinimis("");
    setRemarks("");
    setErrorMessage("");
  }, [open, candidate?.id, candidate?.candidateId]);

  const proposedTotal = useMemo(
    () => toNumber(basicDailyRate) + toNumber(dailyDeMinimis),
    [basicDailyRate, dailyDeMinimis],
  );

  if (!open) return null;

  function handleClose() {
    if (isSubmitting) return;
    onClose?.();
  }

  async function handleSubmit(event) {
    event.preventDefault();
    event.stopPropagation();

    const nextBasicDailyRate = Number(basicDailyRate);
    const nextDailyDeMinimis = Number(dailyDeMinimis);

    if (basicDailyRate === "" || !Number.isFinite(nextBasicDailyRate)) {
      setErrorMessage("Enter the new Basic Daily Rate.");
      return;
    }

    if (dailyDeMinimis === "" || !Number.isFinite(nextDailyDeMinimis)) {
      setErrorMessage("Enter the new Daily De Minimis.");
      return;
    }

    if (nextBasicDailyRate < 0 || nextDailyDeMinimis < 0) {
      setErrorMessage("Compensation values cannot be negative.");
      return;
    }

    if (
      nextBasicDailyRate === Number(currentBasicDailyRate || 0) &&
      nextDailyDeMinimis === Number(currentDailyDeMinimis || 0)
    ) {
      setErrorMessage(
        "The new compensation must be different from the current offer.",
      );
      return;
    }

    setErrorMessage("");

    await onSubmit?.({
      basicDailyRate: nextBasicDailyRate,
      dailyDeMinimis: nextDailyDeMinimis,
      remarks: String(remarks || "").trim(),
    });
  }

  function preventNumberWheel(event) {
    event.preventDefault();
    event.currentTarget.blur();
  }

  function preventNumberArrowChange(event) {
    if (event.key === "ArrowUp" || event.key === "ArrowDown") {
      event.preventDefault();
    }
  }

  const footer = (
    <div className="flex flex-col-reverse justify-end gap-2 sm:flex-row">
      <CandidateModalSecondaryButton type="button" onClick={handleClose} disabled={isSubmitting}>
        Cancel
      </CandidateModalSecondaryButton>
      <CandidateModalPrimaryButton
        type="submit"
        form="candidate-revised-offer-form"
        disabled={isSubmitting}
        className="min-w-[170px] bg-[#FF5C28] hover:bg-[#E94F1F]"
      >
        {isSubmitting && <Loader2 size={15} className="animate-spin" />}
        {isSubmitting ? "Submitting..." : "Submit Revised Offer"}
      </CandidateModalPrimaryButton>
    </div>
  );

  return (
    <CandidatePipelineModalShell
      icon={DollarSign}
      title="Create Revised Offer"
      subtitle="Compare the current compensation against the proposed values before submitting the revision for approval."
      badge="Offer Revision"
      onClose={handleClose}
      closeDisabled={isSubmitting}
      maxWidth="max-w-3xl"
      zIndex="z-[13000]"
      footer={footer}
      closeOnBackdrop
    >
      {isSubmitting && (
        <div className="fixed inset-0 z-[24000] cursor-wait bg-transparent" aria-hidden="true" />
      )}

      <form id="candidate-revised-offer-form" onSubmit={handleSubmit} className="space-y-2.5 2xl:space-y-3.5">
        <CandidateModalSummary candidate={candidate} stage={candidate?.currentStage || "Offered"} />

        <div className="grid grid-cols-1 gap-2.5 2xl:gap-3.5 lg:grid-cols-2">
          <CandidateModalSection title="Current Compensation">
            <div className="space-y-2">
              <div className="sibs-info-tile">
                <p className="sibs-kicker">Current Basic Daily Rate</p>
                <p className="mt-0.5 sibs-text-sm font-extrabold tabular-nums text-[#101828]">
                  {formatCurrency(currentBasicDailyRate)}
                </p>
              </div>
              <div className="sibs-info-tile">
                <p className="sibs-kicker">Current Daily De Minimis</p>
                <p className="mt-0.5 sibs-text-sm font-extrabold tabular-nums text-[#101828]">
                  {formatCurrency(currentDailyDeMinimis)}
                </p>
              </div>
              <div className="rounded-xl border border-blue-100 bg-blue-50 px-3 py-2">
                <p className="sibs-kicker text-sibs-primary-1">Current Total Daily Rate</p>
                <p className="mt-0.5 sibs-text-sm font-extrabold tabular-nums text-sibs-primary-1">
                  {formatCurrency(toNumber(currentBasicDailyRate) + toNumber(currentDailyDeMinimis))}
                </p>
              </div>
            </div>
          </CandidateModalSection>

          <CandidateModalSection title="Proposed Compensation">
            <div className="space-y-2.5">
              <label className="block">
                <span className="mb-1 block sibs-kicker text-sibs-primary-1">New Basic Daily Rate</span>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  inputMode="decimal"
                  value={basicDailyRate}
                  disabled={isSubmitting}
                  onWheel={preventNumberWheel}
                  onKeyDown={preventNumberArrowChange}
                  onChange={(event) => setBasicDailyRate(event.target.value)}
                  placeholder="Enter new basic daily rate"
                  className="h-8.5 2xl:h-10 w-full rounded-xl border border-[#D6E0EA] bg-white px-3 sibs-text-xs font-bold tabular-nums text-[#344054] outline-none transition placeholder:text-slate-400 focus:border-sibs-primary-1 focus:ring-4 focus:ring-sibs-primary-1/10 disabled:cursor-not-allowed disabled:bg-slate-100"
                />
              </label>

              <label className="block">
                <span className="mb-1 block sibs-kicker text-sibs-primary-1">New Daily De Minimis</span>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  inputMode="decimal"
                  value={dailyDeMinimis}
                  disabled={isSubmitting}
                  onWheel={preventNumberWheel}
                  onKeyDown={preventNumberArrowChange}
                  onChange={(event) => setDailyDeMinimis(event.target.value)}
                  placeholder="Enter new daily de minimis"
                  className="h-8.5 2xl:h-10 w-full rounded-xl border border-[#D6E0EA] bg-white px-3 sibs-text-xs font-bold tabular-nums text-[#344054] outline-none transition placeholder:text-slate-400 focus:border-sibs-primary-1 focus:ring-4 focus:ring-sibs-primary-1/10 disabled:cursor-not-allowed disabled:bg-slate-100"
                />
              </label>

              <div className="rounded-xl border border-[#FF5C28]/25 bg-[#FFF9F6] px-3 py-2">
                <p className="sibs-kicker text-[#FF5C28]">Proposed Total Daily Rate</p>
                <p className="mt-0.5 sibs-text-sm font-extrabold tabular-nums text-sibs-primary-1">
                  {formatCurrency(proposedTotal)}
                </p>
              </div>
            </div>
          </CandidateModalSection>
        </div>

        <CandidateModalSection title="Revision Remarks" subtitle="Optional justification for the revised compensation.">
          <textarea
            value={remarks}
            disabled={isSubmitting}
            onChange={(event) => setRemarks(event.target.value)}
            rows={3}
            placeholder="Add a reason or justification for the new offer..."
            className="w-full resize-none rounded-xl border border-[#D6E0EA] bg-white px-3 py-2 sibs-text-xs font-semibold leading-5 text-[#344054] outline-none transition placeholder:text-slate-400 focus:border-sibs-primary-1 focus:ring-4 focus:ring-sibs-primary-1/10 disabled:cursor-not-allowed disabled:bg-slate-100"
          />
        </CandidateModalSection>

        {errorMessage && (
          <div className="rounded-xl border border-red-100 bg-red-50 px-4 py-3 sibs-text-xs font-bold leading-5 text-red-600">
            {errorMessage}
          </div>
        )}
      </form>
    </CandidatePipelineModalShell>
  );
}
