import React from "react";
import { Plus, RotateCcw } from "lucide-react";
import ModalShell from "../../ui/ModalShell";
import SelectDropdown from "@/components/ui/SelectDropdown";

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
  return `h-8.5 2xl:h-10 w-full rounded-[10px] border border-sibs-border bg-slate-50 px-3 sibs-text-xs font-semibold text-sibs-navy outline-none transition placeholder:text-sibs-muted hover:border-sibs-orange/40 hover:bg-white focus:border-sibs-orange focus:bg-white focus:ring-4 focus:ring-sibs-orange/10 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-sibs-muted ${extra}`;
}

function textareaClass(extra = "") {
  return `min-h-18 2xl:min-h-24 w-full resize-none rounded-[10px] border border-sibs-border bg-slate-50 px-3 py-2 sibs-text-xs font-semibold leading-5 text-sibs-navy outline-none transition placeholder:text-sibs-muted hover:border-sibs-orange/40 hover:bg-white focus:border-sibs-orange focus:bg-white focus:ring-4 focus:ring-sibs-orange/10 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-sibs-muted ${extra}`;
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
    <div className="flex items-start justify-between gap-4 border-b border-sibs-border py-3 last:border-b-0">
      <p className="text-[8.5px] 2xl:text-[9px] font-extrabold uppercase tracking-wide text-sibs-muted">
        {label}
      </p>

      <div className="max-w-[60%] break-words text-right text-sm font-bold text-slate-700">
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
    <ModalShell
      open={open}
      onClose={onClose}
      variant="navy"
      title="Create Offer"
      subtitle="Create an offer from a candidate already moved to the Offered stage."
      icon={Plus}
      maxWidth="max-w-6xl"
      className="rounded-[14px]"
      bodyClassName="p-0 flex flex-col min-h-0 flex-1 overflow-hidden"
      footer={
        <div className="flex w-full flex-col justify-end gap-2 sm:flex-row">
          <button
            type="button"
            onClick={onReset}
            className="inline-flex h-8.5 2xl:h-10 items-center justify-center gap-2 rounded-[10px] border border-sibs-border bg-white px-3.5 2xl:px-4 sibs-text-xs font-extrabold text-sibs-navy transition hover:border-sibs-orange/35 hover:bg-sibs-cream-light hover:text-sibs-orange"
          >
            <RotateCcw size={15} />
            Reset
          </button>

          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-8.5 2xl:h-10 items-center justify-center rounded-[10px] border border-sibs-border bg-white px-3.5 2xl:px-4 sibs-text-xs font-extrabold text-slate-600 transition hover:bg-slate-50"
          >
            Cancel
          </button>

          <button
            type="submit"
            form="create-offer-form"
            onClick={onSubmit}
            className="inline-flex h-8.5 2xl:h-10 items-center justify-center gap-2 rounded-[10px] bg-sibs-orange px-3.5 2xl:px-4 sibs-text-xs font-extrabold text-white transition hover:bg-sibs-orange-light active:scale-[0.98]"
          >
            <Plus size={15} />
            Save Offer
          </button>
        </div>
      }
    >
      <form
        id="create-offer-form"
        onSubmit={onSubmit}
        className="flex-1 overflow-y-auto p-4 sm:p-6 font-jakarta"
      >
          <div className="grid grid-cols-1 gap-5 xl:grid-cols-[1fr_360px]">
            <div className="space-y-5">
              <div className="rounded-[10px] border border-sibs-border bg-white p-5 shadow-sm">
                <h3 className="sibs-modal-section-title mb-4 text-sibs-navy">
                  Candidate and Role Information
                </h3>

                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div className="md:col-span-2">
                    <label className="mb-1.5 block text-[8.5px] 2xl:text-[9px] font-extrabold uppercase tracking-wide text-sibs-muted">
                      Candidate <span className="text-sibs-orange"> *</span>
                    </label>

                    <SelectDropdown
                      required
                      value={form.candidateApplicationId}
                      onChange={(val) => handleCandidateChange(val)}
                      options={eligibleCandidates.map((candidate) => ({
                        value: candidate.candidateApplicationId,
                        label: `${candidate.candidateName} — ${candidate.roleAccount}`,
                      }))}
                      placeholder="Select candidate from Offered stage"
                      searchable
                      searchPlaceholder="Search candidate..."
                    />
                  </div>

                  <div>
                    <label className="mb-1.5 block text-[8.5px] 2xl:text-[9px] font-extrabold uppercase tracking-wide text-sibs-muted">
                      Candidate Name
                    </label>

                    <input
                      readOnly
                      value={form.candidateName}
                      className="h-8.5 2xl:h-10 w-full rounded-[10px] border border-sibs-border bg-slate-50 px-3 sibs-text-xs font-bold text-sibs-navy outline-none"
                    />
                  </div>

                  <div>
                    <label className="mb-1.5 block text-[8.5px] 2xl:text-[9px] font-extrabold uppercase tracking-wide text-sibs-muted">
                      Candidate Email
                    </label>

                    <input
                      readOnly
                      value={form.candidateEmail}
                      className="h-8.5 2xl:h-10 w-full rounded-[10px] border border-sibs-border bg-slate-50 px-3 sibs-text-xs font-bold text-sibs-navy outline-none"
                    />
                  </div>

                  <div>
                    <label className="mb-1.5 block text-[8.5px] 2xl:text-[9px] font-extrabold uppercase tracking-wide text-sibs-muted">
                      Role Title
                    </label>

                    <input
                      readOnly
                      value={form.roleTitle}
                      className="h-8.5 2xl:h-10 w-full rounded-[10px] border border-sibs-border bg-slate-50 px-3 sibs-text-xs font-bold text-sibs-navy outline-none"
                    />
                  </div>

                  <div>
                    <label className="mb-1.5 block text-[8.5px] 2xl:text-[9px] font-extrabold uppercase tracking-wide text-sibs-muted">
                      Account
                    </label>

                    <input
                      readOnly
                      value={form.account}
                      className="h-8.5 2xl:h-10 w-full rounded-[10px] border border-sibs-border bg-slate-50 px-3 sibs-text-xs font-bold text-sibs-navy outline-none"
                    />
                  </div>

                  <div>
                    <label className="mb-1.5 block text-[8.5px] 2xl:text-[9px] font-extrabold uppercase tracking-wide text-sibs-muted">
                      TA Owner
                    </label>

                    <input
                      readOnly
                      value={form.owner}
                      className="h-8.5 2xl:h-10 w-full rounded-[10px] border border-sibs-border bg-slate-50 px-3 sibs-text-xs font-bold text-sibs-navy outline-none"
                    />
                  </div>

                  <div>
                    <label className="mb-1.5 block text-[8.5px] 2xl:text-[9px] font-extrabold uppercase tracking-wide text-sibs-muted">
                      Offer Date <span className="text-sibs-orange"> *</span>
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

              <div className="rounded-[10px] border border-sibs-border bg-white p-5 shadow-sm">
                <h3 className="sibs-modal-section-title mb-4 text-sibs-navy">
                  Offer Details
                </h3>

                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div>
                    <label className="mb-1.5 block text-[8.5px] 2xl:text-[9px] font-extrabold uppercase tracking-wide text-sibs-muted">
                      Basic Pay <span className="text-sibs-orange"> *</span>
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
                    <label className="mb-1.5 block text-[8.5px] 2xl:text-[9px] font-extrabold uppercase tracking-wide text-sibs-muted">
                      De Minimis <span className="text-sibs-orange"> *</span>
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
                    <label className="mb-1.5 block text-[8.5px] 2xl:text-[9px] font-extrabold uppercase tracking-wide text-sibs-muted">
                      Daily Rate
                    </label>

                    <input
                      readOnly
                      value={formatCurrency(computedDailyRate)}
                      className="h-8.5 2xl:h-10 w-full cursor-not-allowed rounded-[10px] border border-sibs-border bg-slate-50 px-3 sibs-text-xs font-bold text-sibs-navy outline-none tabular-nums"
                    />

                    <p className="mt-2 text-xs font-semibold text-sibs-tertiary-5">
                      Daily Rate is automatically computed as Basic Pay + De
                      Minimis.
                    </p>
                  </div>

                  <div>
                    <label className="mb-1.5 block text-[8.5px] 2xl:text-[9px] font-extrabold uppercase tracking-wide text-sibs-muted">
                      Initial Offer Status <span className="text-sibs-orange"> *</span>
                    </label>

                    <SelectDropdown
                      required
                      value={form.status}
                      onChange={(val) => handleStatusChange(val)}
                      options={[
                        { value: "Pending", label: "Pending" },
                        { value: "Accepted", label: "Accepted" },
                        { value: "Declined", label: "Declined" },
                      ]}
                      placeholder="Select status"
                    />
                  </div>

                  {form.status === "Accepted" && (
                    <div>
                      <label className="mb-1.5 block text-[8.5px] 2xl:text-[9px] font-extrabold uppercase tracking-wide text-sibs-muted">
                        Accepted Date <span className="text-sibs-orange"> *</span>
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
                        <label className="mb-1.5 block text-[8.5px] 2xl:text-[9px] font-extrabold uppercase tracking-wide text-sibs-muted">
                          Declined Date <span className="text-sibs-orange"> *</span>
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
                        <label className="mb-1.5 block text-[8.5px] 2xl:text-[9px] font-extrabold uppercase tracking-wide text-sibs-muted">
                          Decline Category <span className="text-sibs-orange"> *</span>
                        </label>

                        <SelectDropdown
                          required
                          value={form.declineCategory}
                          onChange={(val) =>
                            setForm({
                              ...form,
                              declineCategory: val,
                            })
                          }
                          options={declineCategoryOptions.map((category) => ({
                            value: category,
                            label: category,
                          }))}
                          placeholder="Select decline category"
                        />
                      </div>

                      <div className="md:col-span-2">
                        <label className="mb-1.5 block text-[8.5px] 2xl:text-[9px] font-extrabold uppercase tracking-wide text-sibs-muted">
                          Decline Reason <span className="text-sibs-orange"> *</span>
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
                        <label className="mb-1.5 block text-[8.5px] 2xl:text-[9px] font-extrabold uppercase tracking-wide text-sibs-muted">
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
                        <label className="mb-1.5 block text-[8.5px] 2xl:text-[9px] font-extrabold uppercase tracking-wide text-sibs-muted">
                          Experience Rating
                        </label>

                        <SelectDropdown
                          value={String(form.experienceRating ?? "")}
                          onChange={(val) =>
                            setForm({
                              ...form,
                              experienceRating: Number(val),
                            })
                          }
                          options={[
                            { value: "5", label: "5 - Excellent" },
                            { value: "4", label: "4 - Good" },
                            { value: "3", label: "3 - Neutral" },
                            { value: "2", label: "2 - Poor" },
                            { value: "1", label: "1 - Very Poor" },
                          ]}
                          placeholder="Select rating"
                        />
                      </div>

                      <div>
                        <label className="mb-1.5 block text-[8.5px] 2xl:text-[9px] font-extrabold uppercase tracking-wide text-sibs-muted">
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
                    <label className="mb-1.5 block text-[8.5px] 2xl:text-[9px] font-extrabold uppercase tracking-wide text-sibs-muted">
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
              <div className="rounded-[10px] border border-sibs-border bg-slate-50 p-5">
                <h3 className="sibs-modal-section-title text-sibs-navy">
                  How this connects to TA-HRIS
                </h3>

                <p className="mt-2 text-sm leading-6 text-slate-600">
                  Creating an offer should be linked to a candidate application
                  that already reached the Offered stage. If accepted, this
                  should move the pipeline to Accepted. If declined, the
                  pipeline should move to Drop-offs and feed Candidate
                  Experience.
                </p>
              </div>

              <div className="rounded-[10px] border border-sibs-border bg-slate-50 p-5">
                <h3 className="sibs-modal-section-title text-sibs-navy">
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

              <div className="rounded-[10px] border border-amber-100 bg-amber-50 p-5">
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
    </ModalShell>
  );
}
