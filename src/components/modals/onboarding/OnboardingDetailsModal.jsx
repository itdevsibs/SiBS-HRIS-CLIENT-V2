import React, { useEffect } from "react";
import {
  AlertTriangle,
  CalendarDays,
  CheckCircle2,
  CircleX,
  Clock3,
  Info,
  UserCheck,
  UserX,
  X,
} from "lucide-react";

function TimelineStep({ number, title, value, state = "complete", last = false }) {
  const tone =
    state === "success"
      ? "border-emerald-200 bg-emerald-50 text-emerald-700"
      : state === "danger"
        ? "border-red-200 bg-red-50 text-red-700"
        : state === "warning"
          ? "border-orange-200 bg-orange-50 text-orange-700"
          : state === "pending"
            ? "border-amber-200 bg-amber-50 text-amber-700"
            : "border-blue-200 bg-blue-50 text-[#042C51]";

  return (
    <div className="relative flex gap-3.5">
      <div className="relative flex shrink-0 flex-col items-center">
        <span className={`relative z-10 flex h-8 w-8 items-center justify-center rounded-full border text-[10px] font-extrabold ${tone}`}>
          {number}
        </span>
        {!last ? <span className="mt-1 h-full min-h-8 w-px bg-[#D7DEE8]" /> : null}
      </div>

      <div className={`min-w-0 flex-1 ${last ? "pb-0" : "pb-4"}`}>
        <div className="rounded-xl border border-[#E6ECF2] bg-[#F8FAFC] px-3.5 py-3">
          <p className="sibs-text-xs font-extrabold text-[#101828]">{title}</p>
          <p className="mt-1 text-[10px] font-semibold text-[#667085]">{value || "—"}</p>
        </div>
      </div>
    </div>
  );
}

function DetailRow({ label, value, valueClass = "text-[#344054]" }) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-[#EEF2F6] py-2.5 last:border-b-0">
      <p className="text-[9px] font-extrabold uppercase tracking-wide text-[#98A2B3]">
        {label}
      </p>
      <p className={`max-w-[62%] break-words text-right text-[10px] font-extrabold ${valueClass}`}>
        {value || "—"}
      </p>
    </div>
  );
}

export default function OnboardingDetailsModal({
  open,
  item: record,
  onClose,
  onOpenOutcomeModal,
  formatDate,
  getShowStatusClass,
  getOutcomeClass,
  getDaysToStart,
}) {
  useEffect(() => {
    if (!open) return undefined;

    function handleEscape(event) {
      if (event.key === "Escape") onClose?.();
    }

    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [open, onClose]);

  if (!open || !record) return null;

  const normalizedRecord = record;
  const isFinal = ["True Hire", "No Show", "Pre-start Withdrawal"].includes(
    normalizedRecord.finalOutcome,
  );
  const daysToStart = getDaysToStart(
    normalizedRecord.acceptedOfferDate,
    normalizedRecord.expectedStartDate,
  );

  const finalTimelineState =
    normalizedRecord.finalOutcome === "True Hire"
      ? "success"
      : normalizedRecord.finalOutcome === "No Show"
        ? "danger"
        : normalizedRecord.finalOutcome === "Pre-start Withdrawal"
          ? "warning"
          : "pending";

  return (
    <div
      className="sibs-modal-blur sibs-modal-backdrop-in fixed inset-0 z-[10000] flex h-dvh items-center justify-center px-2 py-2 font-jakarta sm:px-4 sm:py-4"
      onMouseDown={onClose}
    >
      <div
        className="sibs-modal-pop-in flex max-h-[92dvh] w-full max-w-5xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <header className="flex shrink-0 items-start justify-between gap-4 bg-[#042C51] px-5 py-4 text-white sm:px-6">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-full border border-white/15 bg-white/10 px-2.5 py-1 text-[9px] font-extrabold uppercase tracking-wide text-white">
                Onboarding Record
              </span>
              <span
                className={`rounded-full border px-2.5 py-1 text-[9px] font-extrabold ${getShowStatusClass(
                  normalizedRecord.showStatus,
                )}`}
              >
                {normalizedRecord.showStatus}
              </span>
              <span
                className={`rounded-full border px-2.5 py-1 text-[9px] font-extrabold ${getOutcomeClass(
                  normalizedRecord.finalOutcome,
                )}`}
              >
                {normalizedRecord.finalOutcome}
              </span>
            </div>

            <h2 className="mt-2 truncate sibs-text-base font-extrabold text-white">
              {normalizedRecord.candidateName}
            </h2>
            <p className="mt-0.5 truncate sibs-text-xs font-semibold text-slate-300">
              {normalizedRecord.candidateEmail || "No email saved"} • {normalizedRecord.onboardingId || normalizedRecord.id}
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="sibs-modal-close-btn"
            aria-label="Close onboarding details"
          >
            <X size={17} />
          </button>
        </header>

        <div className="sibs-scrollbar min-h-0 flex-1 overflow-y-auto bg-[#F7F9FC] p-4 sm:p-5">
          <div className="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1fr)_330px]">
            <div className="min-w-0 space-y-4">
              <section className="rounded-2xl border border-[#E6ECF2] bg-white p-4 shadow-sm sm:p-5">
                <div className="flex flex-col gap-4 md:flex-row md:items-stretch md:justify-between">
                  <div className="min-w-0 flex-1">
                    <p className="sibs-kicker">Candidate Assignment</p>
                    <h3 className="mt-1 sibs-text-sm font-extrabold text-[#042C51]">
                      {normalizedRecord.roleTitle || "Not assigned"}
                    </h3>
                    <p className="mt-1 sibs-text-xs font-semibold text-[#667085]">
                      {normalizedRecord.account || "No account"} • {normalizedRecord.location || "No location"}
                    </p>

                    <div className="mt-3 flex flex-wrap gap-2">
                      <span className="rounded-full border border-[#E6ECF2] bg-[#F8FAFC] px-2.5 py-1 text-[9px] font-extrabold text-[#475467]">
                        Accepted: {formatDate(normalizedRecord.acceptedOfferDate)}
                      </span>
                      <span className="rounded-full border border-[#E6ECF2] bg-[#F8FAFC] px-2.5 py-1 text-[9px] font-extrabold text-[#475467]">
                        Owner: {normalizedRecord.owner || "—"}
                      </span>
                    </div>
                  </div>

                  <div className="relative min-w-[220px] overflow-hidden rounded-2xl bg-[#042C51] p-4 text-white shadow-sm">
                    <div className="pointer-events-none absolute -right-4 -top-4 h-20 w-20 rounded-full bg-[#FF5C28]/15 blur-2xl" />
                    <div className="relative z-10 flex items-center gap-3">
                      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-[#FF5C28]/30 bg-[#FF5C28]/15 text-[#FF5C28]">
                        <CalendarDays size={18} />
                      </span>
                      <div>
                        <p className="text-[9px] font-extrabold uppercase tracking-wide text-slate-300">
                          Expected Start Date
                        </p>
                        <p className="mt-0.5 sibs-text-sm font-extrabold text-white">
                          {formatDate(normalizedRecord.expectedStartDate)}
                        </p>
                        <p className="mt-1 text-[9px] font-bold text-[#FFB9A2]">
                          {daysToStart}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </section>

              <section className="rounded-2xl border border-[#E6ECF2] bg-white p-4 shadow-sm sm:p-5">
                <div className="mb-4 flex items-center gap-2 border-b border-[#EEF2F6] pb-3">
                  <Clock3 size={15} className="text-[#FF5C28]" />
                  <div>
                    <h3 className="sibs-text-xs font-extrabold uppercase tracking-wide text-[#042C51]">
                      Onboarding Lifecycle
                    </h3>
                    <p className="mt-0.5 text-[9px] font-semibold text-[#667085]">
                      Accepted offer through final start outcome.
                    </p>
                  </div>
                </div>

                <TimelineStep
                  number="1"
                  title="Offer Accepted"
                  value={formatDate(normalizedRecord.acceptedOfferDate)}
                />
                <TimelineStep
                  number="2"
                  title="Expected Start Date"
                  value={formatDate(normalizedRecord.expectedStartDate)}
                  state="pending"
                />
                <TimelineStep
                  number="3"
                  title="Final Start Outcome"
                  value={
                    normalizedRecord.actualStartDate
                      ? `Actual Start: ${formatDate(normalizedRecord.actualStartDate)}`
                      : normalizedRecord.finalOutcome
                  }
                  state={finalTimelineState}
                  last
                />

                {(normalizedRecord.showStatus === "No Show" ||
                  normalizedRecord.showStatus === "Withdrawn") && (
                  <div
                    className={`mt-4 rounded-xl border p-3 text-[10px] font-semibold leading-5 ${
                      normalizedRecord.showStatus === "No Show"
                        ? "border-red-100 bg-red-50 text-red-700"
                        : "border-orange-100 bg-orange-50 text-orange-700"
                    }`}
                  >
                    <div className="mb-1 flex items-center gap-1.5 font-extrabold">
                      <AlertTriangle size={13} />
                      {normalizedRecord.showStatus === "No Show"
                        ? "No Show Reason"
                        : "Withdrawal Reason"}
                    </div>
                    {normalizedRecord.withdrawalReason || "No specific reason logged."}
                  </div>
                )}
              </section>

              {(normalizedRecord.showStatus === "No Show" ||
                normalizedRecord.showStatus === "Withdrawn") && (
                <section className="rounded-2xl border border-amber-100 bg-amber-50 p-4 sm:p-5">
                  <h3 className="sibs-text-xs font-extrabold uppercase tracking-wide text-amber-800">
                    Candidate Experience Data
                  </h3>
                  <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <div className="rounded-xl border border-amber-100 bg-white p-3">
                      <p className="text-[9px] font-extrabold uppercase text-amber-600">
                        Reason Category
                      </p>
                      <p className="mt-1 text-[10px] font-extrabold text-[#344054]">
                        {normalizedRecord.reasonCategory || "—"}
                      </p>
                    </div>
                    <div className="rounded-xl border border-amber-100 bg-white p-3">
                      <p className="text-[9px] font-extrabold uppercase text-amber-600">
                        Experience Rating
                      </p>
                      <p className="mt-1 text-[10px] font-extrabold text-[#344054]">
                        {normalizedRecord.experienceRating
                          ? `${normalizedRecord.experienceRating}/5`
                          : "—"}
                      </p>
                    </div>
                  </div>
                </section>
              )}

              <section className="rounded-2xl border border-[#E6ECF2] bg-white p-4 shadow-sm sm:p-5">
                <h3 className="sibs-text-xs font-extrabold uppercase tracking-wide text-[#042C51]">
                  Internal Remarks
                </h3>
                <p className="mt-3 rounded-xl border border-[#E6ECF2] bg-[#F8FAFC] p-3 sibs-text-xs font-semibold leading-5 text-[#475467]">
                  {normalizedRecord.remarks || "No remarks provided."}
                </p>
              </section>
            </div>

            <aside className="space-y-4 xl:sticky xl:top-0 xl:self-start">
              <section className="rounded-2xl border border-[#E6ECF2] bg-white p-4 shadow-sm">
                <h3 className="sibs-text-xs font-extrabold uppercase tracking-wide text-[#042C51]">
                  Onboarding Summary
                </h3>
                <div className="mt-2">
                  <DetailRow label="Onboarding ID" value={normalizedRecord.onboardingId || normalizedRecord.id} />
                  <DetailRow label="Offer ID" value={normalizedRecord.offerId} />
                  <DetailRow label="Role" value={normalizedRecord.roleTitle} />
                  <DetailRow label="Account" value={normalizedRecord.account} />
                  <DetailRow label="Location" value={normalizedRecord.location} />
                  <DetailRow label="Accepted Offer" value={formatDate(normalizedRecord.acceptedOfferDate)} />
                  <DetailRow label="Expected Start" value={formatDate(normalizedRecord.expectedStartDate)} />
                  <DetailRow
                    label="Actual Start"
                    value={formatDate(normalizedRecord.actualStartDate)}
                    valueClass={normalizedRecord.actualStartDate ? "text-emerald-700" : "text-[#98A2B3]"}
                  />
                  <DetailRow label="Days to Start" value={daysToStart} />
                  <DetailRow label="Owner" value={normalizedRecord.owner} />
                </div>
              </section>

              {!isFinal ? (
                <section className="rounded-2xl border border-[#E6ECF2] bg-white p-4 shadow-sm">
                  <h3 className="sibs-text-xs font-extrabold uppercase tracking-wide text-[#042C51]">
                    Update Outcome
                  </h3>
                  <p className="mt-1 text-[9px] font-semibold leading-4 text-[#667085]">
                    Resolve the candidate’s final start status.
                  </p>

                  <div className="mt-3 space-y-2">
                    <button
                      type="button"
                      onClick={() => onOpenOutcomeModal(normalizedRecord, "Show")}
                      className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 sibs-text-xs font-extrabold text-white shadow-sm hover:bg-emerald-700 active:scale-[0.98]"
                    >
                      <UserCheck size={14} />
                      Mark as Show
                    </button>
                    <button
                      type="button"
                      onClick={() => onOpenOutcomeModal(normalizedRecord, "No Show")}
                      className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-xl border border-red-200 bg-red-50 px-4 sibs-text-xs font-extrabold text-red-700 hover:bg-red-100 active:scale-[0.98]"
                    >
                      <UserX size={14} />
                      Mark as No Show
                    </button>
                    <button
                      type="button"
                      onClick={() => onOpenOutcomeModal(normalizedRecord, "Withdrawn")}
                      className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-xl border border-orange-200 bg-orange-50 px-4 sibs-text-xs font-extrabold text-orange-700 hover:bg-orange-100 active:scale-[0.98]"
                    >
                      <CircleX size={14} />
                      Mark as Withdrawn
                    </button>
                  </div>
                </section>
              ) : (
                <section className="rounded-2xl border border-emerald-100 bg-emerald-50 p-4">
                  <div className="flex items-start gap-2.5">
                    <CheckCircle2 size={16} className="mt-0.5 shrink-0 text-emerald-600" />
                    <div>
                      <h3 className="sibs-text-xs font-extrabold text-emerald-800">
                        Outcome Finalized
                      </h3>
                      <p className="mt-1 text-[10px] font-semibold leading-5 text-emerald-700">
                        This onboarding record has a final outcome and no longer requires start resolution.
                      </p>
                    </div>
                  </div>
                </section>
              )}

              <section className="rounded-2xl border border-blue-100 bg-blue-50 p-4">
                <div className="flex items-start gap-2.5">
                  <Info size={15} className="mt-0.5 shrink-0 text-[#FF5C28]" />
                  <div>
                    <h3 className="sibs-text-xs font-extrabold text-[#042C51]">
                      Onboarding Governance
                    </h3>
                    <p className="mt-1 text-[10px] font-semibold leading-5 text-[#475467]">
                      Only Show registers as a True Hire and contributes to filled placement count. No Show and Pre-start Withdrawal remain non-hire outcomes.
                    </p>
                  </div>
                </div>
              </section>
            </aside>
          </div>
        </div>

        <footer className="shrink-0 border-t border-[#E6ECF2] bg-white px-5 py-3.5 sm:px-6">
          <div className="flex justify-end">
            <button
              type="button"
              onClick={onClose}
              className="inline-flex h-10 items-center justify-center rounded-xl border border-[#D6E0EA] bg-white px-5 sibs-text-xs font-extrabold text-[#667085] hover:bg-[#F8FAFC] hover:text-[#042C51]"
            >
              Close Details
            </button>
          </div>
        </footer>
      </div>
    </div>
  );
}
