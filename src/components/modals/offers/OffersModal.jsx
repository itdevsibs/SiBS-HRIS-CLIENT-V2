import React from "react";
import { X, Plus, RotateCcw } from "lucide-react";

const declineCategoryOptions = [
  "Compensation",
  "Schedule",
  "Process Delay",
  "Accepted Other Offer",
  "Location Issue",
  "Personal Reason",
  "Incomplete Requirements",
  "Others",
];

function inputClass(extra = "") {
  return `h-8.5 2xl:h-10 w-full rounded-xl border border-[#D7DEE8] bg-[#F8FAFC] px-3 sibs-text-xs font-semibold text-[#042C51] outline-none transition placeholder:text-[#6B88A8] hover:border-[#FF5C28]/40 hover:bg-white focus:border-[#FF5C28] focus:bg-white focus:ring-4 focus:ring-[#FF5C28]/10 disabled:cursor-not-allowed disabled:bg-[#F2F4F7] disabled:text-[#98A2B3] ${extra}`;
}

function textareaClass(extra = "") {
  return `min-h-18 2xl:min-h-24 w-full resize-none rounded-xl border border-[#D7DEE8] bg-[#F8FAFC] px-3 py-2 sibs-text-xs font-semibold leading-5 text-[#042C51] outline-none transition placeholder:text-[#6B88A8] hover:border-[#FF5C28]/40 hover:bg-white focus:border-[#FF5C28] focus:bg-white focus:ring-4 focus:ring-[#FF5C28]/10 disabled:cursor-not-allowed disabled:bg-[#F2F4F7] disabled:text-[#98A2B3] ${extra}`;
}

function getTodayDate() {
  return new Date().toISOString().split("T")[0];
}

function toNumber(value) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function calculateDailyRate(basicPay, deMinimis) {
  return toNumber(basicPay) + toNumber(deMinimis);
}

function formatCurrency(amount) {
  if (!amount && amount !== 0) return "—";

  return new Intl.NumberFormat("en-PH", {
    style: "currency",
    currency: "PHP",
    maximumFractionDigits: 0,
  }).format(amount);
}

function DetailRow({ label, value }) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-gray-100 py-3 last:border-b-0">
      <p className="text-[8.5px] 2xl:text-[9px] font-extrabold uppercase tracking-wide text-[#98A2B3]">
        {label}
      </p>

      <div className="max-w-[60%] break-words text-right text-sm font-bold text-[#344054]">
        {value || "—"}
      </div>
    </div>
  );
}

export function CreateOfferModal({
  open,
  form,
  setForm,
  eligibleCandidates,
  onClose,
  onSubmit,
  onReset,
}) {
  if (!open) return null;

  function handleCandidateChange(value) {
    const selectedCandidate = eligibleCandidates.find(
      (candidate) =>
        String(candidate.candidateApplicationId) === String(value) ||
        candidate.candidateEmail === value
    );

    if (!selectedCandidate) {
      setForm({
        ...form,
        candidateApplicationId: "",
        candidateId: "",
        candidateEmail: "",
        candidateName: "",
        roleTitle: "",
        account: "",
        roleAccount: "",
        owner: "",
        source: "",
      });

      return;
    }

    setForm({
      ...form,
      candidateApplicationId: selectedCandidate.candidateApplicationId,
      candidateId: selectedCandidate.candidateId,
      candidateEmail: selectedCandidate.candidateEmail,
      candidateName: selectedCandidate.candidateName,
      roleTitle: selectedCandidate.roleTitle,
      account: selectedCandidate.account,
      roleAccount: selectedCandidate.roleAccount,
      owner: selectedCandidate.owner,
      source: selectedCandidate.source || "Offer Management",
    });
  }

  function handleStatusChange(status) {
    setForm({
      ...form,
      status,
      acceptedDate: status === "Accepted" ? getTodayDate() : "",
      declinedDate: status === "Declined" ? getTodayDate() : "",
      declineCategory: status === "Declined" ? form.declineCategory : "",
      declineReason: status === "Declined" ? form.declineReason : "",
      candidateFeedback: status === "Declined" ? form.candidateFeedback : "",
      experienceRating: status === "Declined" ? form.experienceRating || 3 : 3,
      feedbackTag: status === "Declined" ? form.feedbackTag : "",
    });
  }

  function handleBasicPayChange(value) {
    const dailyRate = calculateDailyRate(value, form.deMinimis);

    setForm({
      ...form,
      basicPay: value,
      dailyRate,
      offeredCompensation: dailyRate,
    });
  }

  function handleDeMinimisChange(value) {
    const dailyRate = calculateDailyRate(form.basicPay, value);

    setForm({
      ...form,
      deMinimis: value,
      dailyRate,
      offeredCompensation: dailyRate,
    });
  }

  const computedDailyRate = calculateDailyRate(form.basicPay, form.deMinimis);

  return (
    <div
      className="sibs-modal-blur fixed inset-0 z-[10000] flex h-dvh items-center justify-center px-4 py-4"
      onClick={onClose}
    >
      <div
        className="sibs-modal-pop-in flex max-h-[92dvh] w-full max-w-6xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4 border-b border-gray-100 px-5 py-4 sm:px-6 sm:py-5">
          <div className="min-w-0">
            <h2 className="sibs-modal-title truncate text-sibs-primary-1">
              Create Offer
            </h2>

            <p className="sibs-modal-subtitle mt-0.5 text-sibs-tertiary-5">
              Create an offer from a candidate already moved to the Offered
              stage.
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-8 w-8 2xl:h-8.5 2xl:w-8.5 shrink-0 items-center justify-center rounded-lg text-gray-400 transition hover:bg-gray-100 hover:text-gray-700"
            aria-label="Close modal"
          >
            <X size={18} />
          </button>
        </div>

        <form onSubmit={onSubmit} className="flex-1 overflow-y-auto p-4 sm:p-6">
          <div className="grid grid-cols-1 gap-5 xl:grid-cols-[1fr_360px]">
            <div className="space-y-5">
              <div className="rounded-xl border border-[#E6ECF2] bg-white p-5 shadow-sm">
                <h3 className="sibs-modal-section-title mb-4 text-[#042C51]">
                  Candidate and Role Information
                </h3>

                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div className="md:col-span-2">
                    <label className="mb-1.5 block text-[8.5px] 2xl:text-[9px] font-extrabold uppercase tracking-wide text-[#98A2B3]">
                      Candidate <span className="text-[#FF5C28]"> *</span>
                    </label>

                    <select
                      required
                      value={form.candidateApplicationId}
                      onChange={(e) => handleCandidateChange(e.target.value)}
                      className={inputClass()}
                    >
                      <option value="">Select candidate from Offered stage</option>

                      {eligibleCandidates.map((candidate) => (
                        <option
                          key={`${candidate.candidateApplicationId}-${candidate.candidateEmail}`}
                          value={candidate.candidateApplicationId}
                        >
                          {candidate.candidateName} — {candidate.roleAccount}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="mb-1.5 block text-[8.5px] 2xl:text-[9px] font-extrabold uppercase tracking-wide text-[#98A2B3]">
                      Candidate Name
                    </label>

                    <input
                      readOnly
                      value={form.candidateName}
                      className="h-8.5 2xl:h-10 w-full rounded-xl border border-[#D7DEE8] bg-[#F8FAFC] px-3 sibs-text-xs font-bold text-[#042C51] outline-none"
                    />
                  </div>

                  <div>
                    <label className="mb-1.5 block text-[8.5px] 2xl:text-[9px] font-extrabold uppercase tracking-wide text-[#98A2B3]">
                      Candidate Email
                    </label>

                    <input
                      readOnly
                      value={form.candidateEmail}
                      className="h-8.5 2xl:h-10 w-full rounded-xl border border-[#D7DEE8] bg-[#F8FAFC] px-3 sibs-text-xs font-bold text-[#042C51] outline-none"
                    />
                  </div>

                  <div>
                    <label className="mb-1.5 block text-[8.5px] 2xl:text-[9px] font-extrabold uppercase tracking-wide text-[#98A2B3]">
                      Role Title
                    </label>

                    <input
                      readOnly
                      value={form.roleTitle}
                      className="h-8.5 2xl:h-10 w-full rounded-xl border border-[#D7DEE8] bg-[#F8FAFC] px-3 sibs-text-xs font-bold text-[#042C51] outline-none"
                    />
                  </div>

                  <div>
                    <label className="mb-1.5 block text-[8.5px] 2xl:text-[9px] font-extrabold uppercase tracking-wide text-[#98A2B3]">
                      Account
                    </label>

                    <input
                      readOnly
                      value={form.account}
                      className="h-8.5 2xl:h-10 w-full rounded-xl border border-[#D7DEE8] bg-[#F8FAFC] px-3 sibs-text-xs font-bold text-[#042C51] outline-none"
                    />
                  </div>

                  <div>
                    <label className="mb-1.5 block text-[8.5px] 2xl:text-[9px] font-extrabold uppercase tracking-wide text-[#98A2B3]">
                      TA Owner
                    </label>

                    <input
                      readOnly
                      value={form.owner}
                      className="h-8.5 2xl:h-10 w-full rounded-xl border border-[#D7DEE8] bg-[#F8FAFC] px-3 sibs-text-xs font-bold text-[#042C51] outline-none"
                    />
                  </div>

                  <div>
                    <label className="mb-1.5 block text-[8.5px] 2xl:text-[9px] font-extrabold uppercase tracking-wide text-[#98A2B3]">
                      Offer Date <span className="text-[#FF5C28]"> *</span>
                    </label>

                    <input
                      required
                      type="date"
                      value={form.offerDate}
                      onChange={(e) =>
                        setForm({ ...form, offerDate: e.target.value })
                      }
                      className={inputClass()}
                    />
                  </div>
                </div>
              </div>

              <div className="rounded-xl border border-[#E6ECF2] bg-white p-5 shadow-sm">
                <h3 className="sibs-modal-section-title mb-4 text-[#042C51]">
                  Offer Details
                </h3>

                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div>
                    <label className="mb-1.5 block text-[8.5px] 2xl:text-[9px] font-extrabold uppercase tracking-wide text-[#98A2B3]">
                      Basic Pay <span className="text-[#FF5C28]"> *</span>
                    </label>

                    <input
                      required
                      type="number"
                      min="0"
                      value={form.basicPay}
                      onChange={(e) => handleBasicPayChange(e.target.value)}
                      placeholder="Example: 22000"
                      className={`${inputClass()} tabular-nums`}
                    />
                  </div>

                  <div>
                    <label className="mb-1.5 block text-[8.5px] 2xl:text-[9px] font-extrabold uppercase tracking-wide text-[#98A2B3]">
                      De Minimis <span className="text-[#FF5C28]"> *</span>
                    </label>

                    <input
                      required
                      type="number"
                      min="0"
                      value={form.deMinimis}
                      onChange={(e) => handleDeMinimisChange(e.target.value)}
                      placeholder="Example: 3000"
                      className={`${inputClass()} tabular-nums`}
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="mb-1.5 block text-[8.5px] 2xl:text-[9px] font-extrabold uppercase tracking-wide text-[#98A2B3]">
                      Daily Rate
                    </label>

                    <input
                      readOnly
                      value={formatCurrency(computedDailyRate)}
                      className="h-8.5 2xl:h-10 w-full cursor-not-allowed rounded-xl border border-blue-100 bg-blue-50 px-3 sibs-text-xs font-bold text-sibs-primary-1 outline-none tabular-nums"
                    />

                    <p className="mt-2 text-xs font-semibold text-sibs-tertiary-5">
                      Daily Rate is automatically computed as Basic Pay + De
                      Minimis.
                    </p>
                  </div>

                  <div>
                    <label className="mb-1.5 block text-[8.5px] 2xl:text-[9px] font-extrabold uppercase tracking-wide text-[#98A2B3]">
                      Initial Offer Status <span className="text-[#FF5C28]"> *</span>
                    </label>

                    <select
                      required
                      value={form.status}
                      onChange={(e) => handleStatusChange(e.target.value)}
                      className={inputClass()}
                    >
                      <option value="Pending">Pending</option>
                      <option value="Accepted">Accepted</option>
                      <option value="Declined">Declined</option>
                    </select>
                  </div>

                  {form.status === "Accepted" && (
                    <div>
                      <label className="mb-1.5 block text-[8.5px] 2xl:text-[9px] font-extrabold uppercase tracking-wide text-[#98A2B3]">
                        Accepted Date <span className="text-[#FF5C28]"> *</span>
                      </label>

                      <input
                        required
                        type="date"
                        value={form.acceptedDate}
                        onChange={(e) =>
                          setForm({ ...form, acceptedDate: e.target.value })
                        }
                        className={inputClass()}
                      />
                    </div>
                  )}

                  {form.status === "Declined" && (
                    <>
                      <div>
                        <label className="mb-1.5 block text-[8.5px] 2xl:text-[9px] font-extrabold uppercase tracking-wide text-[#98A2B3]">
                          Declined Date <span className="text-[#FF5C28]"> *</span>
                        </label>

                        <input
                          required
                          type="date"
                          value={form.declinedDate}
                          onChange={(e) =>
                            setForm({ ...form, declinedDate: e.target.value })
                          }
                          className={inputClass()}
                        />
                      </div>

                      <div>
                        <label className="mb-1.5 block text-[8.5px] 2xl:text-[9px] font-extrabold uppercase tracking-wide text-[#98A2B3]">
                          Decline Category <span className="text-[#FF5C28]"> *</span>
                        </label>

                        <select
                          required
                          value={form.declineCategory}
                          onChange={(e) =>
                            setForm({
                              ...form,
                              declineCategory: e.target.value,
                            })
                          }
                          className={inputClass()}
                        >
                          <option value="">Select decline category</option>

                          {declineCategoryOptions.map((category) => (
                            <option key={category} value={category}>
                              {category}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="md:col-span-2">
                        <label className="mb-1.5 block text-[8.5px] 2xl:text-[9px] font-extrabold uppercase tracking-wide text-[#98A2B3]">
                          Decline Reason <span className="text-[#FF5C28]"> *</span>
                        </label>

                        <textarea
                          required
                          value={form.declineReason}
                          onChange={(e) =>
                            setForm({
                              ...form,
                              declineReason: e.target.value,
                            })
                          }
                          rows={3}
                          placeholder="Example: Candidate accepted another offer with higher compensation."
                          className={textareaClass()}
                        />
                      </div>

                      <div className="md:col-span-2">
                        <label className="mb-1.5 block text-[8.5px] 2xl:text-[9px] font-extrabold uppercase tracking-wide text-[#98A2B3]">
                          Candidate Feedback
                        </label>

                        <textarea
                          value={form.candidateFeedback}
                          onChange={(e) =>
                            setForm({
                              ...form,
                              candidateFeedback: e.target.value,
                            })
                          }
                          rows={3}
                          placeholder="Optional candidate feedback regarding the offer."
                          className={textareaClass()}
                        />
                      </div>

                      <div>
                        <label className="mb-1.5 block text-[8.5px] 2xl:text-[9px] font-extrabold uppercase tracking-wide text-[#98A2B3]">
                          Experience Rating
                        </label>

                        <select
                          value={form.experienceRating}
                          onChange={(e) =>
                            setForm({
                              ...form,
                              experienceRating: Number(e.target.value),
                            })
                          }
                          className={inputClass()}
                        >
                          <option value={5}>5 - Excellent</option>
                          <option value={4}>4 - Good</option>
                          <option value={3}>3 - Neutral</option>
                          <option value={2}>2 - Poor</option>
                          <option value={1}>1 - Very Poor</option>
                        </select>
                      </div>

                      <div>
                        <label className="mb-1.5 block text-[8.5px] 2xl:text-[9px] font-extrabold uppercase tracking-wide text-[#98A2B3]">
                          Feedback Tag
                        </label>

                        <input
                          value={form.feedbackTag}
                          onChange={(e) =>
                            setForm({ ...form, feedbackTag: e.target.value })
                          }
                          placeholder="Example: Offer Declined, Compensation Concern"
                          className={inputClass()}
                        />
                      </div>
                    </>
                  )}

                  <div className="md:col-span-2">
                    <label className="mb-1.5 block text-[8.5px] 2xl:text-[9px] font-extrabold uppercase tracking-wide text-[#98A2B3]">
                      Remarks
                    </label>

                    <textarea
                      value={form.remarks}
                      onChange={(e) =>
                        setForm({ ...form, remarks: e.target.value })
                      }
                      rows={3}
                      placeholder="Optional offer notes."
                      className={textareaClass()}
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-5">
              <div className="rounded-xl border border-blue-100 bg-blue-50 p-5">
                <h3 className="sibs-modal-section-title text-sibs-primary-1">
                  How this connects to TA-HRIS
                </h3>

                <p className="mt-2 text-sm leading-6 text-sibs-primary-1/80">
                  Creating an offer should be linked to a candidate application
                  that already reached the Offered stage. If accepted, this
                  should move the pipeline to Accepted. If declined, the
                  pipeline should move to Drop-offs and feed Candidate
                  Experience.
                </p>
              </div>

              <div className="rounded-xl border border-[#E6ECF2] bg-[#F8FAFC] p-5">
                <h3 className="sibs-modal-section-title text-[#042C51]">
                  Data Created
                </h3>

                <div className="mt-4">
                  <DetailRow label="Offer Record" value="Yes" />
                  <DetailRow label="Candidate Link" value={form.candidateName} />
                  <DetailRow label="Pipeline Stage" value="Offered" />
                  <DetailRow label="Status" value={form.status} />

                  <DetailRow
                    label="Basic Pay"
                    value={
                      form.basicPay ? formatCurrency(Number(form.basicPay)) : "—"
                    }
                  />

                  <DetailRow
                    label="De Minimis"
                    value={
                      form.deMinimis
                        ? formatCurrency(Number(form.deMinimis))
                        : "—"
                    }
                  />

                  <DetailRow
                    label="Daily Rate"
                    value={formatCurrency(computedDailyRate)}
                  />

                  {form.status === "Accepted" && (
                    <DetailRow label="Pipeline Update" value="Move to Accepted" />
                  )}

                  {form.status === "Declined" && (
                    <>
                      <DetailRow
                        label="Pipeline Update"
                        value="Move to Drop-offs"
                      />
                      <DetailRow
                        label="Experience Record"
                        value="Will be created"
                      />
                      <DetailRow
                        label="Rating"
                        value={`${form.experienceRating}/5`}
                      />
                    </>
                  )}
                </div>
              </div>

              <div className="rounded-xl border border-amber-100 bg-amber-50 p-5">
                <h3 className="text-sm font-bold text-amber-700">
                  Backend Later
                </h3>

                <p className="mt-2 text-sm leading-6 text-amber-700/90">
                  This form should later call{" "}
                  <span className="font-bold">
                     POST /api/recruitment/offers
                  </span>
                  . Accepted offers should update candidate pipeline to
                  Accepted. Declined offers should update candidate pipeline to
                  Drop-offs and create candidate experience data.
                </p>
              </div>
            </div>
          </div>
        </form>

        <div className="border-t border-gray-100 px-5 py-3 sm:px-6 2xl:py-4">
          <div className="flex flex-col justify-end gap-2 sm:flex-row">
            <button
              type="button"
              onClick={onReset}
              className="inline-flex h-8.5 2xl:h-10 items-center justify-center gap-2 rounded-lg border border-[#D6E0EA] bg-white px-3.5 2xl:px-4 sibs-text-xs font-extrabold text-sibs-primary-1 transition hover:border-[#FF5C28]/35 hover:bg-[#FFF8F5] hover:text-[#FF5C28]"
            >
              <RotateCcw size={15} />
              Reset
            </button>

            <button
              type="button"
              onClick={onClose}
              className="inline-flex h-8.5 2xl:h-10 items-center justify-center rounded-lg border border-[#D6E0EA] bg-white px-3.5 2xl:px-4 sibs-text-xs font-extrabold text-gray-600 transition hover:bg-gray-50"
            >
              Cancel
            </button>

            <button
              type="submit"
              onClick={onSubmit}
              className="inline-flex h-8.5 2xl:h-10 items-center justify-center gap-2 rounded-lg bg-[#FF5C28] px-3.5 2xl:px-4 sibs-text-xs font-extrabold text-white transition hover:bg-[#E94F1F] active:scale-[0.98]"
            >
              <Plus size={15} />
              Save Offer
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
