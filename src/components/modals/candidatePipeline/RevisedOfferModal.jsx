import React, { useEffect, useMemo, useState } from "react";
import { Loader2, X } from "lucide-react";

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

  return (
    <div
      className="sibs-modal-blur fixed inset-0 z-[13000] flex h-dvh items-center justify-center px-4 py-4"
      onClick={handleClose}
    >
      <form
        onSubmit={handleSubmit}
        onClick={(event) => event.stopPropagation()}
        className="flex max-h-[92dvh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl"
      >
        <div className="flex items-start justify-between gap-4 border-b border-[#E6ECF2] px-5 py-4 sm:px-6">
          <div className="min-w-0">
            <h2 className="text-xl font-extrabold text-sibs-primary-1">
              Create New Offer
            </h2>
            <p className="mt-1 text-sm font-semibold leading-6 text-sibs-tertiary-5">
              Enter the new compensation and submit it for approval.
            </p>
          </div>

          <button
            type="button"
            onClick={handleClose}
            disabled={isSubmitting}
            className="rounded-full p-2 text-gray-400 transition hover:bg-gray-100 hover:text-gray-700 disabled:cursor-not-allowed disabled:opacity-60"
            aria-label="Close revised offer modal"
          >
            <X size={20} />
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto bg-[#F8FAFC] p-5 sm:p-6">
          <div className="rounded-2xl border border-[#D9E2EC] bg-white p-4">
            <p className="text-[11px] font-extrabold uppercase tracking-wide text-sibs-primary-1">
              Candidate
            </p>
            <p className="mt-1 break-words text-base font-extrabold text-[#101828]">
              {candidate?.name || candidate?.candidateName || "Candidate"}
            </p>
            <p className="mt-1 break-words text-sm font-bold text-sibs-tertiary-5">
              {candidate?.email || candidate?.candidateEmail || "No email provided"}
            </p>
          </div>

          <div className="mt-5 grid grid-cols-1 gap-5 lg:grid-cols-2">
            <section className="rounded-2xl border border-[#D9E2EC] bg-white p-5">
              <h3 className="text-sm font-extrabold text-sibs-primary-1">
                Current Compensation
              </h3>

              <div className="mt-4 space-y-3">
                <div className="rounded-xl border border-[#E6ECF2] bg-[#F8FAFC] px-4 py-3">
                  <p className="text-[11px] font-extrabold uppercase tracking-wide text-sibs-tertiary-5">
                    Current Basic Daily Rate
                  </p>
                  <p className="mt-1 text-base font-extrabold text-[#101828]">
                    {formatCurrency(currentBasicDailyRate)}
                  </p>
                </div>

                <div className="rounded-xl border border-[#E6ECF2] bg-[#F8FAFC] px-4 py-3">
                  <p className="text-[11px] font-extrabold uppercase tracking-wide text-sibs-tertiary-5">
                    Current Daily De Minimis
                  </p>
                  <p className="mt-1 text-base font-extrabold text-[#101828]">
                    {formatCurrency(currentDailyDeMinimis)}
                  </p>
                </div>

                <div className="rounded-xl border border-blue-100 bg-blue-50 px-4 py-3">
                  <p className="text-[11px] font-extrabold uppercase tracking-wide text-sibs-primary-1">
                    Current Total Daily Rate
                  </p>
                  <p className="mt-1 text-base font-extrabold text-sibs-primary-1">
                    {formatCurrency(
                      toNumber(currentBasicDailyRate) +
                        toNumber(currentDailyDeMinimis),
                    )}
                  </p>
                </div>
              </div>
            </section>

            <section className="rounded-2xl border border-[#D9E2EC] bg-white p-5">
              <h3 className="text-sm font-extrabold text-sibs-primary-1">
                Proposed Compensation
              </h3>

              <div className="mt-4 space-y-4">
                <label className="block">
                  <span className="text-xs font-extrabold uppercase tracking-wide text-sibs-primary-1">
                    New Basic Daily Rate
                  </span>
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
                    className="mt-2 h-11 w-full rounded-xl border border-[#D6DEE8] bg-white px-3 text-sm font-bold text-[#344054] outline-none transition [appearance:textfield] placeholder:text-slate-400 focus:border-sibs-primary-1 focus:ring-4 focus:ring-sibs-primary-1/10 disabled:cursor-not-allowed disabled:bg-slate-100 [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                  />
                </label>

                <label className="block">
                  <span className="text-xs font-extrabold uppercase tracking-wide text-sibs-primary-1">
                    New Daily De Minimis
                  </span>
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
                    className="mt-2 h-11 w-full rounded-xl border border-[#D6DEE8] bg-white px-3 text-sm font-bold text-[#344054] outline-none transition [appearance:textfield] placeholder:text-slate-400 focus:border-sibs-primary-1 focus:ring-4 focus:ring-sibs-primary-1/10 disabled:cursor-not-allowed disabled:bg-slate-100 [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                  />
                </label>

                <div className="rounded-xl border border-emerald-100 bg-emerald-50 px-4 py-3">
                  <p className="text-[11px] font-extrabold uppercase tracking-wide text-emerald-700">
                    Proposed Total Daily Rate
                  </p>
                  <p className="mt-1 text-base font-extrabold text-emerald-800">
                    {formatCurrency(proposedTotal)}
                  </p>
                </div>
              </div>
            </section>
          </div>

          <label className="mt-5 block rounded-2xl border border-[#D9E2EC] bg-white p-5">
            <span className="text-xs font-extrabold uppercase tracking-wide text-sibs-primary-1">
              Remarks — Optional
            </span>
            <textarea
              value={remarks}
              disabled={isSubmitting}
              onChange={(event) => setRemarks(event.target.value)}
              rows={4}
              placeholder="Add a reason or justification for the new offer..."
              className="mt-2 w-full resize-none rounded-xl border border-[#D6DEE8] bg-white px-3 py-3 text-sm font-semibold leading-6 text-[#344054] outline-none transition placeholder:text-slate-400 focus:border-sibs-primary-1 focus:ring-4 focus:ring-sibs-primary-1/10 disabled:cursor-not-allowed disabled:bg-slate-100"
            />
          </label>

          {errorMessage && (
            <div className="mt-4 rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm font-bold leading-6 text-red-600">
              {errorMessage}
            </div>
          )}
        </div>

        <div className="flex flex-col-reverse gap-2 border-t border-[#E6ECF2] bg-white px-5 py-4 sm:flex-row sm:justify-end sm:px-6">
          <button
            type="button"
            onClick={handleClose}
            disabled={isSubmitting}
            className="inline-flex h-11 items-center justify-center rounded-xl border border-[#D6DEE8] bg-white px-5 text-sm font-extrabold text-[#475467] transition hover:bg-[#F8FAFC] disabled:cursor-not-allowed disabled:opacity-60"
          >
            Cancel
          </button>

          <button
            type="submit"
            disabled={isSubmitting}
            className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-sibs-primary-1 px-5 text-sm font-extrabold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSubmitting && <Loader2 size={16} className="animate-spin" />}
            {isSubmitting
              ? "Submitting..."
              : "Submit New Offer for Approval"}
          </button>
        </div>
      </form>
    </div>
  );
}
